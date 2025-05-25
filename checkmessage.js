/**
 * @file checkmessage.js
 * @brief Validates message content and extracts emails using a regex pattern.
 *
 * This module exports a function to be used in a Discord bot to detect and extract
 * valid email addresses from user messages. Only messages from a specific channel
 * are processed.
 */

const { sendMessage } = require("./discord");

const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

/**
 * Validates a message and extracts an email address if present.
 *
 * @param {Object} message - Discord message object
 * @returns {string|undefined} The extracted email address, or undefined if invalid
 */
const checkMessage = (message) => {
  if (!message || message.author.bot) return;

  if (message.channel.id !== process.env.CHANNELID) {
    console.log("🔒 Message ignored: not in the authorized channel");
    return;
  }


  const result = message.content.match(emailRegex);
  if (result) {
    const email = result[0];
    console.log("📧 Valid email extracted:", email);
    return email;
  } else {
    console.log("❌ No valid email detected in message.");
    return;
  }
};

module.exports = { checkMessage };