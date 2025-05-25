// 📁 logger.js
/**
 * Log dans un fil unique par utilisateur.
 * Crée le fil si c'est la 1ʳᵉ fois, sinon poste dans le même fil.
 *
 * @param {string} title    Le titre du message (ex : "[MP] Message reçu")
 * @param {object} details  Détails clés:valeurs
 * @param {import("discord.js").Client} client
 * @param {import("discord.js").User} user
 */
export async function logPerUser(title, details, client, user) {
  try {
    const forum = await client.channels.fetch(process.env.LOG_FORUM_ID);
    if (!forum?.isThreadOnly()) {
      throw new Error("Le salon n'est pas un forum ou introuvable");
    }

    // Construire le corps du message
    const body = Object.entries(details)
      .map(([k, v]) => `**${k}**: ${v}`)
      .join("\n");

    // Chercher un thread existant pour cet utilisateur
    const threadName = `Logs ${user.tag}`;
    const active = await forum.threads.fetchActive();
    let thread = active.threads.find(t => t.name === threadName);

    if (!thread) {
      // Création du thread sur la première erreur ou premier log
      thread = await forum.threads.create({
        name: threadName,
        message: { content: `**${title}**\n\n${body}` },
        reason: "Initialisation du fil pour cet utilisateur"
      });
      console.log(`📤 Nouveau fil "${threadName}" créé pour ${user.tag}`);
    } else {
      // Poster dans le fil existant
      await thread.send({ content: `**${title}**\n\n${body}` });
      console.log(`📤 Nouveau message dans "${threadName}" : ${title}`);
    }
  } catch (err) {
    console.warn("⚠️ Impossible de log dans le forum :", err.message);
    console.log(`🔸 Log local [${title}] :`, details);
  }
}
