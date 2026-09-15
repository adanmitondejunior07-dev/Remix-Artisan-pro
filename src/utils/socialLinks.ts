/**
 * Utility functions to format and sanitize social media links
 * for Artisans and Clients (WhatsApp, Facebook, TikTok).
 */

export function formatWhatsAppUrl(val?: string, customMessage?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  const defaultMsg = "Bonjour, j'ai vu votre profil sur Artisan Pro Afrique !";
  const messageToUse = customMessage !== undefined ? customMessage : defaultMsg;

  // If already a full wa.me or whatsapp link
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (customMessage && !trimmed.includes('text=')) {
      const sep = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${sep}text=${encodeURIComponent(customMessage)}`;
    }
    return trimmed;
  }

  // Extract digits and optional plus
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return '';

  return `https://wa.me/${digits}?text=${encodeURIComponent(messageToUse)}`;
}

export function formatFacebookUrl(val?: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanHandle = trimmed.replace(/^@/, '').replace(/^facebook\.com\//, '');
  return `https://facebook.com/${cleanHandle}`;
}

export function formatTikTokUrl(val?: string): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const cleanHandle = trimmed.replace(/^@/, '').replace(/^tiktok\.com\/@?/, '');
  return `https://tiktok.com/@${cleanHandle}`;
}

export function cleanHandle(urlOrHandle?: string): string {
  if (!urlOrHandle) return '';
  const trimmed = urlOrHandle.trim();
  // If it's a URL, extract the last segment
  try {
    if (trimmed.startsWith('http')) {
      const url = new URL(trimmed);
      return url.pathname.replace(/^\//, '').replace(/^@/, '');
    }
  } catch {
    // fallback
  }
  return trimmed.replace(/^@/, '');
}
