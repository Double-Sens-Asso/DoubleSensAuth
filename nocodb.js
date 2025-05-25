// 📁 nocodb.js (ESM)
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const BASE_URL = process.env.NOCODB_API_URL.replace(/\/+$/, "");
const TABLE_ID = process.env.NOCODB_TABLE_NAME_ID;
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const FIELD_NAME = process.env.FIELDS || "mailMembre";

const headers = {
  "xc-token": API_TOKEN,
  "Content-Type": "application/json"
};

/**
 * Vérifie si un email existe et si un DiscordID est déjà utilisé
 */
export async function checkEmail(email, discordId) {
  const cleaned = email.trim().toLowerCase();
  const urlEmail = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=(${FIELD_NAME},eq,${cleaned})&limit=1`;
  const urlDiscord = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=(DiscordID,eq,${discordId})&limit=1`;

  try {
    const [resEmail, resDiscord] = await Promise.all([
      axios.get(urlEmail, { headers }),
      axios.get(urlDiscord, { headers })
    ]);

    const record = resEmail.data.list?.[0];
    const discordUsed = resDiscord.data.list?.length > 0;

    if (!record) return { found: false, used: false, discordUsed };

    console.log("🧾 Clés du record :", Object.keys(record));

    return {
      found: true,
      used: (record.Discord || "").toLowerCase() === "oui",
      discordUsed,
      record
    };
  } catch (err) {
    console.error("❌ checkEmail error:", err.response?.data || err.message);
    return { found: false, used: false, discordUsed: false };
  }
}

/**
 * Marque l'email comme utilisé dans NocoDB
 */
export async function markEmailUsed(email, message) {
  const { found, used, discordUsed, record } = await checkEmail(email, message.author.id);

  if (!found || !record?.Id) return false;
  if (used) return false;
  if (discordUsed) {
    await message.author.send("❌ Ton compte Discord est déjà lié à un autre email.");
    return false;
  }

  const payload = [{ Id: record.Id, Discord: "Oui", DiscordID: message.author.id }];
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;

  console.log("🔗 PATCH →", url);
  console.log("📦 Payload →", payload);

  try {
    await axios.patch(url, payload, { headers });
    return true;
  } catch (err) {
    console.error("❌ markEmailUsed error:", err.response?.data || err.message);
    return false;
  }
}
