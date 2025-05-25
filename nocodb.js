const axios = require('axios');

const apiBaseUrl = process.env.NOCODB_API_URL; 
const apiToken = process.env.NOCODB_API_TOKEN; // token d’API
const project = process.env.BASE_NAME; // nom du projet
const table = process.env.NOCODB_TABLE_NAME; // nom de la table

const headers = {
  'accept': 'application/json',
  'xc-token': apiToken
};

async function checkEmail(email) {
  try {
    console.log("📥 Ligne récupérée :", JSON.stringify(response.data.list[0], null, 2));

    const url = `${apiBaseUrl}/api/v1/db/data/v1/${project}/${table}?filter=mailMembre,eq,${encodeURIComponent(email)}`;
    console.log("📥 Ligne récupérée :", JSON.stringify(response.data.list[0], null, 2));

    
    const response = await axios.get(url, { headers });

    if (response.data.list.length === 0) {
      return { valid: false, reason: "Email non trouvé" };
    }

    const row = response.data.list[0];
    console.log("📥 Ligne récupérée :", JSON.stringify(row, null, 2));


    if (row.Discord === "Oui") {
      return { valid: false, reason: "Déjà utilisé" };
    }

    return { valid: true, rowId: row.id };
  } catch (err) {
    console.error("Erreur lors de la vérification d'email :", err.message);
    return { valid: false, reason: "Erreur serveur" };
  }
}

async function markEmailUsed(rowId) {
  try {
    const url = `${apiBaseUrl}/api/v1/db/data/v1/${project}/${table}/${rowId}`;
    const data = {
      Discord: "Oui"
    };
    console.log("🔁 PATCH vers :", url);
    console.log("📤 Données envoyées :", data);

    const response = await axios.patch(url, data, { headers });
    console.log("✅ Mise à jour réussie :", response.data);
    return true;
  } catch (err) {
    if (err.response) {
      console.error("❌ Erreur PATCH :", err.response.status, err.response.data);
    } else {
      console.error("❌ Erreur inconnue PATCH :", err.message);
    }
    return false;
  }
}



module.exports = {
  checkEmail,
  markEmailUsed
};
