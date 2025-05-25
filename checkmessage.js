// 📁 checkmessage.js
export function checkMessage(message) {
  const m = message.content.match(/\b[\w.-]+@[\w.-]+\.[A-Za-z]{2,}\b/);
  return m ? m[0] : null;
}
