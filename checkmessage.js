const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Extrait et renvoie le premier email valide du contenu, sinon null
 * @param {Message} message
 * @returns {string|null}
 */
function checkMessage(message) {
  const match = message.content.match(EMAIL_REGEX);
  return match ? match[0].toLowerCase() : null;
}

export default { checkMessage };