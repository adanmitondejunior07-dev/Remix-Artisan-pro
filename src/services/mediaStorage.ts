import { saveMediaBlob, getMediaBlob, createObjectUrlFromStored } from './indexedDbService.ts';
import { app } from '../firebase/config.ts';

// Cache of active runtime object URLs to avoid recreating them repeatedly
const runtimeUrlCache = new Map<string, string>();

export async function uploadOrStoreMedia(
  file: File | Blob,
  mediaId: string
): Promise<{ mediaUrl: string; mediaId: string; isPermanent: boolean }> {
  // 1. Toujours stocker dans IndexedDB pour une disponibilité locale immédiate et pérenne
  await saveMediaBlob(mediaId, file);

  // 2. Tentative d'upload sur Firebase Storage si configuré
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const storage = getStorage(app);
    const storageRef = ref(storage, `publications/${Date.now()}_${mediaId}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);

    if (downloadUrl && downloadUrl.startsWith('https://')) {
      return {
        mediaUrl: downloadUrl,
        mediaId,
        isPermanent: true,
      };
    }
  } catch (storageErr) {
    console.info('Stockage permanent local via IndexedDB activé (Firebase Storage non utilisé):', storageErr);
  }

  // 3. Si pas d'URL https distante, on crée un ObjectURL actif associé au mediaId
  const localUrl = URL.createObjectURL(file);
  runtimeUrlCache.set(mediaId, localUrl);

  return {
    mediaUrl: localUrl,
    mediaId,
    isPermanent: false,
  };
}

/**
 * Résout une URL multimédia pour un post donné.
 * Si le blob a expiré au refresh, réhydrate automatiquement le fichier depuis IndexedDB !
 */
export async function resolveMediaUrl(
  mediaUrl?: string,
  mediaId?: string,
  postId?: string
): Promise<{ url: string; isExpired: boolean }> {
  // Si c'est déjà une URL https distante permanente, elle ne s'expire pas
  if (mediaUrl && (mediaUrl.startsWith('https://') || mediaUrl.startsWith('http://'))) {
    return { url: mediaUrl, isExpired: false };
  }

  const lookupKey = mediaId || (postId ? `media_${postId}` : null);

  // Vérifie d'abord le cache d'URL active en cours d'exécution
  if (lookupKey && runtimeUrlCache.has(lookupKey)) {
    return { url: runtimeUrlCache.get(lookupKey)!, isExpired: false };
  }

  // Tente de réhydrater le Blob depuis IndexedDB
  if (lookupKey) {
    const freshUrl = await createObjectUrlFromStored(lookupKey);
    if (freshUrl) {
      runtimeUrlCache.set(lookupKey, freshUrl);
      return { url: freshUrl, isExpired: false };
    }
  }

  // Tente également avec postId brut si le lookupKey était différent
  if (postId && postId !== lookupKey) {
    const freshUrl = await createObjectUrlFromStored(postId);
    if (freshUrl) {
      runtimeUrlCache.set(postId, freshUrl);
      return { url: freshUrl, isExpired: false };
    }
  }

  // Si c'est un blob URL historique sans fichier dans IndexedDB
  if (mediaUrl && mediaUrl.startsWith('blob:')) {
    // Vérifier si le blob est encore valide dans la session
    try {
      const res = await fetch(mediaUrl, { method: 'HEAD' });
      if (res.ok) {
        return { url: mediaUrl, isExpired: false };
      }
    } catch {
      // Blobs d'anciennes sessions après rechargement de page
      return { url: '', isExpired: true };
    }
    return { url: '', isExpired: true };
  }

  return { url: mediaUrl || '', isExpired: false };
}
