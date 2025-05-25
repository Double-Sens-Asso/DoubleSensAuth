// 📁 ratelimit.js
const attempts = new Map();

export function isRateLimited(userId) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1h
  const maxAttempts = 5;

  const userData = attempts.get(userId) || { count: 0, firstTry: now };
  
  // Réinitialise si la fenêtre est dépassée
  if (now - userData.firstTry > windowMs) {
    attempts.set(userId, { count: 1, firstTry: now });
    return false;
  }

  if (userData.count >= maxAttempts) return true;

  userData.count++;
  attempts.set(userId, userData);
  return false;
}
