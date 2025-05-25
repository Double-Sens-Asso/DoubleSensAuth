/**
 * Extrait une adresse email valide d’un message texte.
 * @param {import("discord.js").Message} message
 * @returns {string|null}
 */
export function checkMessage(message) {
  const regex = /[\w.-]+@[\w.-]+\.\w+/g;
  const match = message.content.match(regex);
  return match ? match[0].toLowerCase() : null;
}
