import { checkEmail, markEmailUsed } from "./nocodb.js";
import { checkMessage } from "./checkmessage.js";
import { logPerUser } from "./logger.js";
import { isRateLimited } from "./ratelimit.js";

export async function handleMessage(message, client) {
  const now = new Date().toLocaleString("fr-FR");
  const email = checkMessage(message) || "";
  const details = {
    Date: now,
    "Message privé": "Oui",
    Contenu: message.content,
    Email: email || "[invalide]"
  };

  // ────────────────────────────────────────────────────────────
  // Rate‑limit (5 tentatives/heure par défaut)
  // ────────────────────────────────────────────────────────────
  if (isRateLimited(message.author.id)) {
    await message.author.send("🚫 Trop de tentatives. Réessaie plus tard.");
    await logPerUser("[BLOQUÉ] Trop de tentatives", { Date: now }, client, message.author);
    return;
  }

  // ────────────────────────────────────────────────────────────
  // Validation email syntaxique
  // ────────────────────────────────────────────────────────────
  if (!email) {
    details.Statut = "Email invalide";
    await logPerUser("[ERREUR] Email invalide", details, client, message.author);
    return message.author.send("❌ Email invalide.");
  }

  // ────────────────────────────────────────────────────────────
  // Vérifications NocoDB (existence, doublons, cotisation)
  // ────────────────────────────────────────────────────────────
  const { found, used, discordUsed, statusValid, record } = await checkEmail(
    email,
    message.author.id
  );

  Object.assign(details, {
    "Dans la base": found,
    "Déjà validé": used,
    "DiscordID lié": discordUsed,
    "Cotisation OK": statusValid,
    "Statut cotisation": record ? record.StatusCotisation || "N/A" : "N/A"
  });

  // 1. Email introuvable
  if (!found) {
    details.Statut = "Email non trouvé";
    await logPerUser("[ÉCHEC] Email introuvable", details, client, message.author);
    return message.author.send("❌ Email inconnu.");
  }

  // 2. Cotisation non valide
  if (!statusValid) {
    details.Statut = "Cotisation expirée ou non validée";
    await logPerUser("[ÉCHEC] Cotisation KO", details, client, message.author);
    return message.author.send(
      `⚠️ Ta cotisation n’est pas à jour (statut : « ${record.StatusCotisation || "Indéfini"} »).\nMerci de régulariser avant de valider ton compte.`
    );
  }

  // 3. Email déjà validé
  if (used) {
    details.Statut = "Email déjà utilisé";
    await logPerUser("[INFO] Email déjà utilisé", details, client, message.author);
    return message.author.send("⚠️ Email déjà validé.");
  }

  // 4. DiscordID déjà lié
  if (discordUsed) {
    details.Statut = "Discord déjà lié";
    await logPerUser("[ÉCHEC] Discord doublon", details, client, message.author);
    return message.author.send("⚠️ Discord déjà lié.");
  }

  // ────────────────────────────────────────────────────────────
  // Mise à jour NocoDB & attribution du rôle
  // ────────────────────────────────────────────────────────────
  const ok = await markEmailUsed(email, message);
  details["Marquage en base"] = ok ? "OK" : "Échec";

  if (!ok) {
    details.Statut = "Échec marquage";
    await logPerUser("[ERREUR] Marquage échoué", details, client, message.author);
    return message.author.send("❌ Erreur de validation.");
  }

  // Rôle Discord
  try {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const member = await guild.members.fetch(message.author.id);
    await member.roles.add(process.env.ROLE_ID);

    details.Statut = "Validation complète + rôle attribué";
    await logPerUser("[SUCCÈS] Validation user", details, client, message.author);

    return message.author.send("✅ Validé et rôle attribué !");
  } catch (err) {
    details.Statut = "Validation OK, rôle échoué";
    details.Erreur = err.message;
    await logPerUser("[PARTIEL] Rôle non attribué", details, client, message.author);

    return message.author.send(
      `✅ Validé (mais rôle non attribué).\n🛠️ ${err.message}`
    );
  }
}
