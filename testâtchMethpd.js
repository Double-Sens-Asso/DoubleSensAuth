const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.NOCODB_API_URL.replace(/\/+$/, "");
const TABLE_ID = process.env.NOCODB_TABLE_NAME_ID;
const API_TOKEN = process.env.NOCODB_API_TOKEN;
const FIELD_NAME = process.env.FIELDS || "mailMembre";

const headers = {
  "xc-token": API_TOKEN,
  "Content-Type": "application/json"
};

async function getRecord(email) {
  const cleaned = email.trim().toLowerCase();
  const filter = `(${FIELD_NAME},eq,${cleaned})`;
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records?where=${encodeURIComponent(filter)}&limit=1`;

  const res = await axios.get(url, { headers });
  return res.data.list?.[0] || null;
}

async function patchBulk(id, record) {
  const payload = [{
    Id: id,
    Discord: "Oui",
    mailMembre: record.mailMembre,
    telephoneMembre: record.telephoneMembre
  }];
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records`;
  await axios.patch(url, payload, { headers });
  console.log("✅ PATCH bulk terminé");
}

async function patchDirect(id) {
  const url = `${BASE_URL}/api/v2/tables/${TABLE_ID}/records/${id}`;
  await axios.patch(url, { Discord: "Oui" }, { headers });
  console.log("✅ PATCH direct terminé");
}

async function test(method = "bulk") {
  const email = "maximemasquelier@mailo.com";
  console.log(`📨 Test sur ${email} via PATCH ${method.toUpperCase()}`);

  const before = await getRecord(email);
  if (!before) return console.log("❌ Enregistrement introuvable");
  console.log("📄 Avant PATCH →", before.mailMembre);

  if (method === "bulk") {
    await patchBulk(before.Id, before);
  } else {
    await patchDirect(before.Id);
  }

  const after = await getRecord(email);
  if (!after) return console.log("❌ Impossible de relire l'enregistrement");
  console.log("📄 Après PATCH →", after.mailMembre);
}

// Lancer un test
test("bulk");   // ou test("direct");
