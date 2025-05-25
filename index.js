// 📁 index.js (ESM)
import { Client, GatewayIntentBits } from "discord.js";
import { handleMessage } from "./discord.js";
import dotenv from "dotenv";

dotenv.config();

// Création du bot avec les permissions nécessaires
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
});

// Connexion réussie
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Message reçu
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Si c'est dans le canal public configuré
  if (message.guild && message.channelId === process.env.CHANNELID) {
    try {
      await message.author.send(
        "👋 Bienvenue ! Pour valider ton compte, réponds simplement à ce message avec **ton adresse email**.\n\nℹ️ *Active les messages privés ici : `Paramètres > Confidentialité > Autoriser les MP du serveur`*"
      );
      await message.reply("📩 Regarde tes messages privés !");
    } catch (err) {
      console.error("❌ Impossible d'envoyer le MP :", err.message);
      await message.reply("❌ Active les messages privés dans tes paramètres Discord.");
    }
    return;
  }

  // Si c'est en message privé
  if (!message.guild) {
    console.log("----------------------------------------------------------");
    try {
      await handleMessage(message);
    } catch (err) {
      console.error("💥 Erreur dans handleMessage :", err.message);
    }
    console.log("----------------------------------------------------------");
  }
});

client.login(process.env.TOKEN);
