import { checkEmail, markEmailUsed } from "./nocodb.js";
import { checkMessage }              from "./checkmessage.js";
import { logPerUser }                from "./logger.js";
import { isRateLimited } from "./ratelimit.js";
export async function handleMessage(message, client) {
  const now   = new Date().toLocaleString("fr-FR");
  const email = checkMessage(message) || "";
  const details = {
    Date:        now,
    "Message privé": "Oui",
    Contenu:     message.content,
    Email:       email || "[invalide]"
  };



  if (isRateLimited(message.author.id)) {
    await message.author.send("🚫 Trop de tentatives. Réessaie plus tard.");
    await logPerUser("[BLOQUÉ] Trop de tentatives", { Date: now }, client, message.author);
    return;
  }


  if (!email) {
    details.Statut = "Email invalide";
    await logPerUser("[ERREUR] Email invalide", details, client, message.author);
    return message.author.send("❌ Email invalide.");
  }

  const { found, used, discordUsed } = await checkEmail(email, message.author.id);
  Object.assign(details, {
    "Dans la base":  found,
    "Déjà validé":   used,
    "DiscordID lié": discordUsed
  });

  if (!found) {
    details.Statut = "Email non trouvé";
    await logPerUser("[ÉCHEC] Email introuvable", details, client, message.author);
    return message.author.send("❌ Email inconnu.");
  }
  if (used) {
    details.Statut = "Email déjà utilisé";
    await logPerUser("[INFO] Email déjà utilisé", details, client, message.author);
    return message.author.send("⚠️ Email déjà validé.");
  }
  if (discordUsed) {
    details.Statut = "Discord déjà lié";
    await logPerUser("[ÉCHEC] Discord doublon", details, client, message.author);
    return message.author.send("⚠️ Discord déjà lié.");
  }

  const ok = await markEmailUsed(email, message);
  details["Marquage en base"] = ok ? "OK" : "Échec";
  if (!ok) {
    details.Statut = "Échec marquage";
    await logPerUser("[ERREUR] Marquage échoué", details, client, message.author);
    return message.author.send("❌ Erreur de validation.");
  }

  try {
    const guild  = client.guilds.cache.get(process.env.GUILD_ID);
    const member = await guild.members.fetch(message.author.id);
    await member.roles.add(process.env.ROLE_ID);
    details.Statut = "Validation complète + rôle attribué";
    await logPerUser("[SUCCÈS] Validation user", details, client, message.author);
    return message.author.send("✅ Validé et rôle attribué !");
  } catch (err) {
    details.Statut = "Validation OK, rôle échoué";
    details.Erreur  = err.message;
    await logPerUser("[PARTIEL] Rôle non attribué", details, client, message.author);
    return message.author.send(`✅ Validé (mais rôle non attribué).\n🛠️ ${err.message}`);
  }
}
