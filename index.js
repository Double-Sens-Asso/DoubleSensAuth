/**
 * @file index.js
 * @brief Discord bot for validating user emails against a Google Sheet and managing role assignment.
 *
 * This bot listens for user messages containing emails, verifies the email in a Google Sheet,
 * checks if the email has already been used, and assigns roles accordingly. Messages are deleted
 * after processing to ensure privacy.
 */

require("dotenv").config();
const { sendMessage } = require('./discord.js');
const { Client, GatewayIntentBits } = require("discord.js");
const { checkMessage } = require('./checkmessage.js');
const { checkEmail, markEmailUsed } = require('./nocodb');
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

/**
 * Handle user message: extract email, verify against Google Sheet,
 * assign role if valid and update the sheet accordingly.
 * @param {Message} message - Discord message object
 */
async function handleMessage(message) {
  console.log('🛠️ Processing message:', message.content);

  const mail = checkMessage(message);
  if (!mail) {
    console.log('❌ No valid email detected');
    await message.reply("❌ Email invalide.");
    return;
  }

  setTimeout(() => {
    message.delete().catch(() => {});
  }, 5000);
}




client.on('messageCreate', async (message) => {
  if (message.author.bot) return;


  if (message.channelId !== process.env.CHANNELID) {
    return;
  }



  console.log('----------------------------------------------------------');
  await handleMessage(message);
    try {
    await message.delete();
    console.log('🗑️ Message deleted for confidentiality');
  } catch (err) {
    console.error("⚠️ Failed to delete message:", err);
  }
  console.log('----------------------------------------------------------');
});

client.login(process.env.TOKEN);