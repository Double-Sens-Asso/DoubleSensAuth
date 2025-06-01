// 📁 checkmessage.js
export function checkMessage(message) {
  // Use a RegExp object for complex patterns and avoid unescaped quotes
  const regex = /^((?:[A-Za-z0-9!#$%&'*+\-/=?^_`{|}~]|(?<=^|\.)|(?=$|\.|@)|(?<=".*)[ .](?=.*")|(?<!\.)\.){1,64})(@)((?:[A-Za-z0-9.\-])*(?:[A-Za-z0-9])\.(?:[A-Za-z0-9]){2,})$/;
  const m = message.content.match(regex);
  return m ? m[0] : null;
}
