// Service de gestion et traitement des vidéos pour Artisan Pro
// Vérification durée (30s max), génération miniature canvas à 1s, compression 720p

export interface VideoDurationResult {
  valid: boolean;
  duration: number;
  message?: string;
}

export interface VideoThumbnailResult {
  thumbnailUrl: string;
  thumbnailBlob: Blob;
  duration: number;
  width: number;
  height: number;
}

/**
 * 1. Vérifie la durée de la vidéo : si > 30 secondes, retourne valid = false
 */
export function checkVideoDuration(file: File | Blob): Promise<VideoDurationResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve({ valid: true, duration: 0 });
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const tempUrl = URL.createObjectURL(file);
    video.src = tempUrl;

    const timer = setTimeout(() => {
      URL.revokeObjectURL(tempUrl);
      video.remove();
      // Si le navigateur tarde à lire les métadonnées, on accepte par précaution
      resolve({ valid: true, duration: 0 });
    }, 4000);

    video.onloadedmetadata = () => {
      clearTimeout(timer);
      const duration = video.duration;
      URL.revokeObjectURL(tempUrl);
      video.remove();

      if (isNaN(duration) || duration <= 0) {
        resolve({ valid: true, duration: 0 });
      } else if (duration > 30.5) {
        resolve({
          valid: false,
          duration,
          message: 'Vidéo trop longue, choisissez 30s max',
        });
      } else {
        resolve({ valid: true, duration });
      }
    };

    video.onerror = () => {
      clearTimeout(timer);
      URL.revokeObjectURL(tempUrl);
      video.remove();
      // En cas de codec inconnu par l'élément vidéo, on ne bloque pas brutalement
      resolve({ valid: true, duration: 0 });
    };
  });
}

/**
 * 2. Génère automatiquement une miniature (thumbnail) avec canvas en dessinant la frame à 1 seconde
 */
export function generateVideoThumbnail(file: File | Blob): Promise<VideoThumbnailResult> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Environnement sans fenêtre'));
      return;
    }

    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const tempUrl = URL.createObjectURL(file);
    video.src = tempUrl;

    const cleanup = () => {
      URL.revokeObjectURL(tempUrl);
      video.remove();
    };

    // Timeout de secours au cas où la vidéo ne cherche pas
    const fallbackTimer = setTimeout(() => {
      createFallbackThumbnail(640, 360)
        .then((res) => {
          cleanup();
          resolve(res);
        })
        .catch((err) => {
          cleanup();
          reject(err);
        });
    }, 6000);

    video.onloadedmetadata = () => {
      // Seek frame à 1 seconde (ou à mi-chemin si durée courte)
      let seekTime = 1.0;
      if (video.duration && video.duration > 0) {
        if (video.duration <= 1.2) {
          seekTime = Math.max(0.1, video.duration / 2);
        }
      }
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      clearTimeout(fallbackTimer);
      try {
        const vidW = video.videoWidth || 640;
        const vidH = video.videoHeight || 360;

        // Limite à 720p max pour la miniature
        const maxW = 720;
        const scale = Math.min(1, maxW / vidW);
        const w = Math.max(160, Math.round(vidW * scale));
        const h = Math.max(90, Math.round(vidH * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D non disponible');
        }

        ctx.drawImage(video, 0, 0, w, h);

        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

        canvas.toBlob(
          (blob) => {
            cleanup();
            resolve({
              thumbnailUrl,
              thumbnailBlob: blob || new Blob(),
              duration: video.duration || 0,
              width: vidW,
              height: vidH,
            });
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        cleanup();
        createFallbackThumbnail(640, 360).then(resolve).catch(reject);
      }
    };

    video.onerror = () => {
      clearTimeout(fallbackTimer);
      cleanup();
      createFallbackThumbnail(640, 360).then(resolve).catch(reject);
    };
  });
}

function createFallbackThumbnail(w: number, h: number): Promise<VideoThumbnailResult> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 10, h / 2 - 16);
      ctx.lineTo(w / 2 + 18, h / 2);
      ctx.lineTo(w / 2 - 10, h / 2 + 16);
      ctx.closePath();
      ctx.fill();
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    canvas.toBlob(
      (b) => {
        resolve({
          thumbnailUrl: dataUrl,
          thumbnailBlob: b || new Blob(),
          duration: 10,
          width: w,
          height: h,
        });
      },
      'image/jpeg',
      0.8
    );
  });
}

/**
 * 3. Compresseur de vidéo : si vidéo > 10Mo, compresse à 720p avant de sauvegarder
 */
export async function compressVideoIfNeeded(
  file: File | Blob,
  onProgress?: (msg: string) => void
): Promise<{ file: File | Blob; wasCompressed: boolean }> {
  const TEN_MB = 10 * 1024 * 1024;

  if (file.size <= TEN_MB) {
    return { file, wasCompressed: false };
  }

  // Vérifie si MediaRecorder et canvas sont supportés
  if (
    typeof window === 'undefined' ||
    typeof MediaRecorder === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return { file, wasCompressed: false };
  }

  onProgress?.('Vidéo > 10Mo détectée : optimisation 720p...');

  try {
    const compressed = await transcodeTo720p(file, onProgress);
    if (compressed && compressed.size > 0 && compressed.size < file.size) {
      return { file: compressed, wasCompressed: true };
    }
    return { file, wasCompressed: false };
  } catch (err) {
    console.info('Compression 720p non réalisable, conservation du fichier d’origine:', err);
    return { file, wasCompressed: false };
  }
}

/**
 * Transcodage à 720p (1280x720 max) via Canvas et MediaRecorder
 */
function transcodeTo720p(
  file: File | Blob,
  onProgress?: (msg: string) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    const tempUrl = URL.createObjectURL(file);
    video.src = tempUrl;

    let mediaRecorder: MediaRecorder | null = null;
    let chunks: BlobPart[] = [];
    let animId: number;

    const cleanup = () => {
      cancelAnimationFrame(animId);
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          mediaRecorder.stop();
        } catch {}
      }
      URL.revokeObjectURL(tempUrl);
      video.remove();
    };

    // Timeout de sécurité max 12 secondes
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout transcodage'));
    }, 12000);

    video.onloadedmetadata = () => {
      const vidW = video.videoWidth || 1280;
      const vidH = video.videoHeight || 720;

      // Calcul des dimensions 720p
      const maxW = 1280;
      const maxH = 720;
      const scale = Math.min(1, maxW / vidW, maxH / vidH);
      let targetW = Math.round(vidW * scale);
      let targetH = Math.round(vidH * scale);
      if (targetW % 2 !== 0) targetW -= 1;
      if (targetH % 2 !== 0) targetH -= 1;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        clearTimeout(timeout);
        cleanup();
        reject(new Error('Contexte 2D indisponible'));
        return;
      }

      // Stream du canvas à 24 fps
      const stream = canvas.captureStream(24);

      // Support mimeType
      let mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : '';
      }

      try {
        const options: MediaRecorderOptions = {
          videoBitsPerSecond: 1800000, // 1.8 Mbps -> ~6.7 Mo pour 30s
        };
        if (mimeType) options.mimeType = mimeType;

        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        clearTimeout(timeout);
        cleanup();
        reject(e);
        return;
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        clearTimeout(timeout);
        const resultBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        cleanup();
        resolve(resultBlob);
      };

      // Dessine chaque frame sur le canvas
      function drawFrame() {
        if (!video.paused && !video.ended) {
          ctx?.drawImage(video, 0, 0, targetW, targetH);
          animId = requestAnimationFrame(drawFrame);
        }
      }

      video.onended = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      };

      // Démarrage enregistrement et lecture accélérée
      mediaRecorder.start(100);
      video.playbackRate = 1.0;
      video
        .play()
        .then(() => {
          drawFrame();
        })
        .catch((err) => {
          clearTimeout(timeout);
          cleanup();
          reject(err);
        });
    };

    video.onerror = (err) => {
      clearTimeout(timeout);
      cleanup();
      reject(err);
    };
  });
}
