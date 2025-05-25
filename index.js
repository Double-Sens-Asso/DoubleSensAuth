const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { handleMessage } = require("./discord");
require("dotenv").config();

// 🔐 Création du client Discord avec les bons intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel] // Obligatoire pour capter les MP
});

// ✅ Connexion réussie
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// 🔍 Lorsqu'un message est reçu
client.on("messageCreate", async (message) => {
  // ❌ Ignorer les messages des bots
  if (message.author.bot) return;

  // 💬 Si le message est dans le salon de démarrage (channel public spécifique)
  if (message.channel.type === 0 && message.channel.id === process.env.CHANNELID) {
    try {
      // 📢 Introduction + consigne de vérification par MP
      await message.reply(
        "👋 Bonjour ! Pour valider ton inscription, suis les instructions ci-dessous.\n\n" +
        "📬 **Active les messages privés (MP)** si ce n'est pas déjà fait :\n" +
        "clic droit sur le serveur > Paramètres de confidentialité > activer \"Autoriser les messages privés\".\n\n" +
        "📨 Ensuite, **réponds à ce message en MP avec ton adresse email** utilisée lors de l'inscription."
      );

      // 🚫 Si MP impossible, message d'erreur en public
      await message.author.send("👋 Salut ! Envoie-moi ton email ici pour être validé.");
      console.log("✅ MP envoyé");
    } catch (err) {
      console.warn("❌ Impossible d'envoyer un MP :", err.message);
      await message.reply("⚠️ Je n'ai pas pu t'envoyer de message privé. Active-les dans tes paramètres Discord puis renvoie un message ici.");
    }
  }

  // 📧 Si le message est en MP (type DM)
  if (message.channel.type === 1) {
    console.log("----------------------------------------------------------");
    try {
      await handleMessage(message);
    } catch (err) {
      console.error("💥 Erreur dans handleMessage :", err.message);
      await message.author.send("❌ Une erreur est survenue pendant le traitement. Merci de réessayer plus tard.");
    }
    console.log("----------------------------------------------------------");
  }
});

client.login(process.env.TOKEN);
