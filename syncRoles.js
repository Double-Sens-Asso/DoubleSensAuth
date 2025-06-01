// 📁 syncRoles.js – fonction handleExpiration pour retrait automatique du rôle
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE   = process.env.NOCODB_API_URL.replace(/\/+$/, "");
const TABLE  = process.env.NOCODB_TABLE_NAME_ID;   // ID ou slug de la table Membres
const ROLE   = process.env.ROLE_ID;                // rôle à retirer
const GUILD  = process.env.GUILD_ID;               // serveur Discord
const HEADERS = { "xc-token": process.env.NOCODB_API_TOKEN };

/**
 * Retire le rôle Discord à un membre dont la cotisation a expiré
 * et remet Discord = "Non" côté NocoDB.
 *
 * @param {number|string} membreId  Identifiant de la ligne dans la table Membres
 * @param {import('discord.js').Client} client  Instance Discord du bot
 */
export async function handleExpiration(membreId, client) {
  // ──────────────────────────────────────────────────────────
  // 1. Récupérer la ligne Membres dans NocoDB
  // ──────────────────────────────────────────────────────────
  const url = `${BASE}/api/v2/tables/${TABLE}/records/${membreId}`;
  let row;
  try {
    const { data } = await axios.get(url, { headers: HEADERS });
    row = data;
  } catch (err) {
    // Si la ligne n'existe pas, on ignore simplement la requête :
    if (err.response?.status === 404) {
      console.log(`ℹ️  Membre ${membreId} introuvable – ignoré`);
      return; // pas de 500 renvoyé au webhook
    }
    throw err; // autre erreur = on laisse la route répondre 500
  }

  const discordId = row.DiscordID;
  if (!discordId) {
    console.log(`ℹ️  Membre ${membreId} sans DiscordID – rien à retirer`);
    return;
  }

  // ──────────────────────────────────────────────────────────
  // 2. Retirer le rôle dans Discord (si le membre est encore présent)
  // ──────────────────────────────────────────────────────────
  const guild = client.guilds.cache.get(GUILD);
  if (!guild) throw new Error("Guild introuvable");

  let member;
  try {
    member = await guild.members.fetch(discordId);
  } catch {
    member = null; // membre a quitté le serveur
  }

  if (member) {
    await member.roles.remove(ROLE, "Cotisation expirée").catch(() => {});
    await member
      .send(
        "⚠️ Ta cotisation n’est plus valide. Ton accès a été restreint. " +
          "Dès que tu auras régularisé, utilise de nouveau /valider."
      )
      .catch(() => {});
  }

  // ──────────────────────────────────────────────────────────
  // 3. Mettre à jour la ligne NocoDB (Discord = Non)
  // ──────────────────────────────────────────────────────────
  const payload = [
    { Id: membreId, Discord: "Non", DiscordID: "" }
  ];

  await axios.patch(`${BASE}/api/v2/tables/${TABLE}/records`, payload, { headers: HEADERS });

  console.log(`🔄 Rôle retiré et NocoDB mis à jour pour membre ${membreId}`);
}