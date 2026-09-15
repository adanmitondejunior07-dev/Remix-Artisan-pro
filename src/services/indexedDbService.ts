// IndexedDB storage service for local media files (Videos & Photos)
// Guarantees media persistence across browser refreshes and page reloads without base64 or memory bloat

const DB_NAME = 'artisanpro_media_db';
const STORE_NAME = 'media_files';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non disponible dans cet environnement'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.warn('Erreur ouverture IndexedDB:', request.error);
      reject(request.error);
    };
  });

  return dbPromise;
}

export async function saveMediaBlob(id: string, file: File | Blob): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(file, id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB saveMediaBlob fallback error:', err);
  }
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => {
        const result = req.result;
        if (result instanceof Blob) {
          resolve(result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB getMediaBlob error:', err);
    return null;
  }
}

export async function createObjectUrlFromStored(id: string): Promise<string | null> {
  try {
    const blob = await getMediaBlob(id);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB deleteMediaBlob error:', err);
  }
}

/**
 * Récupère le blob vidéo stocké par ID (teste 'video_ID', 'media_ID' et 'ID')
 */
export async function getVideoBlob(id: string | number): Promise<Blob | null> {
  const strId = String(id);
  const candidateKeys = [
    strId.startsWith('video_') ? strId : `video_${strId}`,
    strId.startsWith('media_') ? strId : `media_${strId}`,
    strId,
  ];

  for (const key of candidateKeys) {
    const blob = await getMediaBlob(key);
    if (blob) return blob;
  }
  return null;
}

/**
 * Supprime la vidéo et la miniature associées dans IndexedDB
 */
export async function deleteVideoAndThumbnail(id: string | number): Promise<void> {
  const strId = String(id);
  const keysToDelete = [
    strId.startsWith('video_') ? strId : `video_${strId}`,
    strId.startsWith('thumb_') ? strId : `thumb_${strId}`,
    strId.startsWith('media_') ? strId : `media_${strId}`,
    strId,
  ];

  for (const key of keysToDelete) {
    await deleteMediaBlob(key);
  }
}

