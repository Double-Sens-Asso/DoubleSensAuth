// 📁 nocodb.js (ESM)
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// ────────────────────────────────────────────────────────────
// Configuration                                                     
// ────────────────────────────────────────────────────────────
const BASE_URL = process.env.NOCODB_API_URL.replace(/\/+$/, "");
const TABLE_ID = process.env.NOCODB_TABLE_NAME_ID;
const API_TOKEN = process.env.NOCODB_API_TOKEN;

// Champs NocoDB
const EMAIL_FIELD = process.env.EMAIL_FIELD_NAME || "mailMembre";
const DISCORD_FIELD = "Discord";
const DISCORD_ID_FIELD = "DiscordID";
const STATUS_FIELD = process.env.STATUS_FIELD_NAME || "StatusCotisation";

// Valeur considérée comme OK pour la cotisation
const VALID_STATUS_VALUE = (process.env.STATUS_OK_VALUE || "✅Valide").toLowerCase();

const headers = {
  "xc-token": API_TOKEN,
  "Content-Type": "application/json"
};

// ────────────────────────────────────────────────────────────
// Utils                                                          
// ────────────────────────────────────────────────────────────
/**
 * Vérifie si un email existe, si la cotisation est valide
 * et si un DiscordID est déjà utilisé.
 */
export async function checkEmail(email, discordId) {
  const cleaned = email.trim().toLowerCase();

  // Requête par email
  const urlEmail = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=(${EMAIL_FIELD},eq,${cleaned})&limit=1`;
  // Requête par DiscordID (évite les doublons)
  const urlDiscord = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=(${DISCORD_ID_FIELD},eq,${discordId})&limit=1`;

  try {
    const [resEmail, resDiscord] = await Promise.all([
      axios.get(urlEmail, { headers }),
      axios.get(urlDiscord, { headers })
    ]);

    const record = resEmail.data.list?.[0];
    const discordUsed = resDiscord.data.list?.length > 0;

    if (!record) {
      return { found: false, used: false, discordUsed, statusValid: false };
    }

    const used = (record[DISCORD_FIELD] || "").toLowerCase() === "oui";
    const statusValid = ((record[STATUS_FIELD] || "").toLowerCase() === VALID_STATUS_VALUE);

    return {
      found: true,
      used,
      discordUsed,
      statusValid,
      record
    };
  } catch (err) {
    console.error("❌ checkEmail error:", err.response?.data || err.message);
    return { found: false, used: false, discordUsed: false, statusValid: false };
  }
}

/**
 * Marque l'email comme utilisé dans NocoDB après toutes les vérifications.
 */
export async function markEmailUsed(email, message) {
  const {
    found,
    used,
    discordUsed,
    statusValid,
    record
  } = await checkEmail(email, message.author.id);

  // ─── Vérifications préalables ──────────────────────────────
  if (!found || !record?.Id) return false;

  if (!statusValid) {
    await message.author.send(
      "⚠️ Ta cotisation n’est pas à jour (statut : « " +
        (record[STATUS_FIELD] || "Indéfini") +
        " »). Merci de la régulariser avant de valider ton compte."
    );
    return false;
  }

  if (used) return false;

  if (discordUsed) {
    await message.author.send("❌ Ton compte Discord est déjà lié à un autre email.");
    return false;
  }

  // ─── Tout est bon : patch NocoDB ───────────────────────────
  const payload = [
    {
      Id: record.Id,
      [DISCORD_FIELD]: "Oui",
      [DISCORD_ID_FIELD]: message.author.id
    }
  ];

  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;

  try {
    await axios.patch(url, payload, { headers });
    return true;
  } catch (err) {
    console.error("❌ markEmailUsed error:", err.response?.data || err.message);
    return false;
  }
}
