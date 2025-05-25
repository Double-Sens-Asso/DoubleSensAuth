const axios = require("axios");
require("dotenv").config();

// 🔧 Variables d'environnement
const BASE_URL   = process.env.NOCODB_API_URL.replace(/\/+$/, ""); // Retire les / finaux
const TABLE_ID   = process.env.NOCODB_TABLE_NAME_ID;               // ID de la table (ex: m72opw56u1t02vw)
const API_TOKEN  = process.env.NOCODB_API_TOKEN;
const FIELD_NAME = process.env.FIELDS || "mailMembre";            // Colonne email

// 🧾 Headers communs pour toutes les requêtes
const headers = {
  "xc-token": API_TOKEN,
  "Content-Type": "application/json"
};

/**
 * 🔍 Vérifie si un email existe dans la table, et s’il est déjà utilisé
 * @param {string} email 
 * @returns {Promise<{ found: boolean, used: boolean, record?: object }>}
 */
/**
 * 🔍 Vérifie si un email est en base et si un DiscordID est déjà utilisé
 * @param {string} email 
 * @param {string} discordId 
 * @returns {Promise<{ found: boolean, used: boolean, record?: object, discordUsed: boolean }>}
 */
async function checkEmail(email, discordId) {
  const cleaned = email.trim().toLowerCase();

  // Vérification email
  const urlEmail = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=(${FIELD_NAME},eq,${cleaned})&limit=1`;
  console.log("🔍 GET →", urlEmail);

  // Vérification DiscordID
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
 * ✅ Marque l'email comme utilisé (Discord = "Oui")
 * @param {string} email 
 * @returns {Promise<boolean>}
 */
async function markEmailUsed(email,message) {
  const { found, used, discordUsed, record } = await checkEmail(email, message.author.id);

  if (!found || !record?.Id) {
    console.warn(`⚠️ Enregistrement introuvable ou Id manquant pour : ${email}`);
    return false;
  }

  if (used) {
    console.warn("⚠️ Email déjà marqué comme utilisé");
    return false;
  }

  if (discordUsed) {
    console.warn("❌ Ce compte Discord est déjà associé à un autre compte.");
    await message.author.send("❌ Ton compte Discord a déjà été utilisé pour valider un autre email.");
    return false;
  }


  const payload = [{ Id: record.Id, Discord: "Oui", DiscordID: message.author.id  }];
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;

  console.log("🔗 PATCH →", url);
  console.log("📦 Payload →", payload);

  try {
    await axios.patch(url, payload, { headers });
    console.log(`✅ Mise à jour réussie sur Id=${record.Id}`);
    return true;
  } catch (err) {
    console.error("❌ markEmailUsed error:", err.response?.data || err.message);
    return false;
  }
}

export default { checkEmail, markEmailUsed };
