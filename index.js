// 📁 index.js – Discord bot + Express webhook
import { Client, GatewayIntentBits } from "discord.js";
import express from "express";
import dotenv from "dotenv";
import { handleMessage } from "./discord.js";
import { logPerUser } from "./logger.js";
import { handleExpiration } from "./syncRoles.js";

dotenv.config();
const confirmationMessages = new Map(); // userId → message à supprimer

// ────────────────────────────────────────────────────────────
// Discord client
// ────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ]
});

client.once("ready", () => {
  logPerUser(
    "[INFO] Bot démarré",
    {
      Date: new Date().toLocaleString("fr-FR"),
      Statut: "Bot opérationnel"
    },
    client,
    client.user
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const now = new Date().toLocaleString("fr-FR");
  const base = { Date: now, Contenu: message.content };
  

  // ─── 1. Message dans le canal d'inscription ─────────────────
  if (message.guild && message.channelId === process.env.CHANNELID) {
    try {
      await message.author.send("👋 Réponds à ce MP avec ton email pour valider.");
      const confirmationMsg = await message.reply("📩 J’ai envoyé un MP !");
      confirmationMessages.set(message.author.id, {
  channelId: confirmationMsg.channelId,
  messageId: confirmationMsg.id
});
      setTimeout(() => confirmationMessages.delete(message.author.id), 15 * 60 * 1000);
    } catch (_) {/* DM fermé */}

    await logPerUser(
      "[INSCRIPTION] Invitation MP",
      { ...base, Utilisateur: message.author.tag, Canal: message.channel.name },
      client,
      message.author
    );

    await message.delete();

    return;
  }


  // ─── 2. DM privé : tentative de validation ─────────────────
  if (!message.guild) {
    await logPerUser(
      "[MP] Message privé reçu",
      { ...base, Utilisateur: message.author.tag, "Message privé": "Oui" },
      client,
      message.author
    );

      const info = confirmationMessages.get(message.author.id);
      if (!info) {
        console.warn("⚠️ Aucun message enregistré à supprimer pour cet utilisateur.");
      } else {
        try {
          const channel = await client.channels.fetch(info.channelId);
          const msgToDelete = await channel.messages.fetch(info.messageId);
          await msgToDelete.delete();
          console.log("✅ Message supprimé avec succès:", info);
          confirmationMessages.delete(message.author.id);
        } catch (err) {
          console.error("❌ Erreur lors de la suppression via fetch:", err);
        }
      }
    try {
      await handleMessage(message, client);
    } catch (err) {
      await logPerUser(
        "[ERREUR] handleMessage",
        { Date: now, Erreur: err.message },
        client,
        message.author
      );
    }
  }
});

client.login(process.env.TOKEN);

// ────────────────────────────────────────────────────────────
// Express server for NocoDB webhooks
// ────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.get("/ping", (_, res) => res.send("🏓")); // simple health-check

app.post("/api/cotisation-update", async (req, res) => {
  // 1. Auth header
  if (req.headers["x-webhook-token"] !== process.env.NOCODB_WEBHOOK_TOKEN) {
    return res.sendStatus(401);
  }

  // 2. L'ID du membre peut provenir :
  //    • d'une ligne Cotisation  -> record.Membres_Id
  //    • d'une ligne Membres     -> record.Id
  const record =
  req.body?.record            // ← ancien format « Test Webhook »
  || req.body?.data?.rows?.[0]// ← nouveau format « records.* »
  || null;

const membreId = record?.Membres_Id ?? record?.Id;


  if (!membreId) {
    return res.status(400).send("Aucun identifiant membre trouvé dans le payload");
  }

  try {
    await handleExpiration(membreId, client);
    return res.sendStatus(204); // ok, rien à renvoyer
  } catch (err) {
    console.error("Webhook error:", err);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Webhook HTTP prêt sur le port ${PORT}`);
});