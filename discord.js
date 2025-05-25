const { checkEmail, markEmailUsed } = require("./nocodb");
const { checkMessage } = require("./checkmessage").default;

/**
 * Gère un message Discord reçu en message privé :
 * - Valide le format de l'email
 * - Vérifie s'il est en base
 * - Marque comme utilisé s'il est valide et non utilisé
 * - Envoie un retour utilisateur explicite
 *
 * @param {import('discord.js').Message} message
 */
async function handleMessage(message) {
  console.log('📨 Nouveau message reçu :', message.content);

  // 📧 Extraction de l'email depuis le message
  const mail = checkMessage(message);
  if (!mail) {
    console.log('❌ Aucun email détecté');
    return message.author.send("❌ Email invalide ou non détecté. Merci de réessayer avec un email correct.");
  }

  console.log(`📧 Email détecté : ${mail}`);

  // 🔍 Vérification dans la base de données NocoDB
  const { found, used } = await checkEmail(mail);

  if (!found) {
    console.warn(`❌ Email introuvable en base : ${mail}`);
    return message.author.send("❌ Cet email n'existe pas dans notre base de données.");
  }

  if (used) {
    console.warn("⚠️ Email déjà utilisé");
    return message.author.send("⚠️ Cet email a déjà été utilisé pour une validation Discord.");
  }

  // ✅ Marquage comme utilisé (Discord = Oui)
  const success = await markEmailUsed(mail,message);

    if (!success) {
        return
    }


  // 🎉 Succès complet
  await message.author.send("✅ Email vérifié et marqué avec succès. Tu es maintenant validé !");
  setTimeout(() => message.delete().catch(() => {}), 5000);
}

export default { handleMessage };
