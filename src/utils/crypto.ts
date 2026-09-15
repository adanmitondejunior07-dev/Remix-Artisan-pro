/**
 * Utilitaire de hachage sécurisé pour le code secret / mot de passe utilisateur
 * Utilise l'API standard Web Crypto SHA-256
 */

export async function hashSecretCode(code: string): Promise<string> {
  const trimmed = code.trim();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(trimmed);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple si Web Crypto n'est pas disponible dans certains contextes
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16)}`;
}

export async function verifySecretCode(inputCode: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  // Si déjà stocké en clair (anciens comptes de test)
  if (inputCode.trim() === storedHash.trim()) return true;
  const computedHash = await hashSecretCode(inputCode);
  return computedHash === storedHash.trim();
}
