
const sendMessage = (text,message) => {
    if (!text || !message) {
        console.error("❌ Missing text or message object");
        return;
    }
    
    if (message.author.bot) {
        console.log("🛑 Ignoring bot message");
        return;
    }
    
    try {
        message.author.send(text);
        console.log("📬 Message sent to user:", message.author.tag);
    } catch (error) {
        console.error("⚠️ Failed to send message:", error);
    }


};

module.exports = { sendMessage };