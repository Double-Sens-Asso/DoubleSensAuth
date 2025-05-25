// 📁 discord.js (ESM)
import { checkEmail, markEmailUsed } from "./nocodb.js";
import { checkMessage } from "./checkmessage.js";

/**
 * Gère la validation d'un email via MP
 * @param {import("discord.js").Message} message
 */
export async function handleMessage(message) {
  console.log("📨 Nouveau message reçu :", message.content);

  const mail = checkMessage(message);
  if (!mail) return message.author.send("❌ Email invalide ou manquant.");

  console.log(`📧 Email détecté : ${mail}`);
  const { found, used, discordUsed, record } = await checkEmail(mail, message.author.id);

  if (!found) {
    return message.author.send("❌ Cet email n'existe pas dans notre base.");
  }
  if (used) {
    return message.author.send("⚠️ Cet email a déjà été validé.");
  }
  if (discordUsed) {
    return message.author.send("⚠️ Ton compte Discord est déjà lié à un autre email.");
  }

  const success = await markEmailUsed(mail, message);
  if (!success) {
    return message.author.send("❌ Une erreur est survenue pendant la validation.");
  }

  // Attribution de rôle
  try {
    const guild = message.client.guilds.cache.get(process.env.GUILD_ID);
    const member = await guild.members.fetch(message.author.id);
    await member.roles.add(process.env.ROLE_ID);
    await message.author.send("✅ Email vérifié et rôle attribué !");
  } catch (err) {
    console.warn("⚠️ Attribution de rôle échouée :", err.message);
    await message.author.send("✅ Email vérifié, mais l’attribution du rôle a échoué.");
  }

  setTimeout(() => message.delete().catch(() => {}), 5000);
}
