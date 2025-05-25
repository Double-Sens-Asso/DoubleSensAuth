import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage }            from "./discord.js";
import { logPerUser }               from "./logger.js";
import dotenv                       from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
});

client.once("ready", () => {
  logPerUser(
    "[INFO] Bot démarré",
    {
      Date:   new Date().toLocaleString("fr-FR"),
      Statut: "Bot opérationnel"
    },
    client,
    client.user
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const now = new Date().toLocaleString("fr-FR");
  const base = {
    Date:    now,
    Contenu: message.content
  };

  // Canal d'inscription
  if (message.guild && message.channelId === process.env.CHANNELID) {
    try {
      await message.author.send("👋 Réponds à ce MP avec ton email pour valider.");
      await message.reply("📩 J’ai envoyé un MP !");
    } catch {/* ignore */ }

    await logPerUser(
      "[INSCRIPTION] Invitation MP",
      {
        ...base,
        Utilisateur: message.author.tag,
        Canal:       message.channel.name
      },
      client,
      message.author
    );
    return;
  }

  // MP privé → log + traitement
  if (!message.guild) {
    await logPerUser(
      "[MP] Message privé reçu",
      {
        ...base,
        Utilisateur: message.author.tag,
        "Message privé": "Oui"
      },
      client,
      message.author
    );
    try {
      await handleMessage(message, client);
    } catch (err) {
      await logPerUser(
        "[ERREUR] handleMessage",
        {
          Date:    now,
          Erreur:  err.message
        },
        client,
        message.author
      );
    }
  }
});

client.login(process.env.TOKEN);
