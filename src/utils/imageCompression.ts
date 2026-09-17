/**
 * Utilitaire ultra-rapide de compression d'images côté client pour photo de profil et couvertures
 * Évite les lenteurs de transfert de photos lourdes (5 à 10 Mo) en les redimensionnant en < 50ms
 */

export async function compressImageToDataUrl(
  file: File,
  maxWidth = 512,
  maxHeight = 512,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve) => {
    // Si ce n'est pas une image ou fichier corrompu, fallback FileReader
    if (!file || !file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculer les dimensions proportionnelles
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Lissage d'image pour rendu haute fidélité
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Exportation JPEG légère et ultra-rapide (~30 à 60 Ko au lieu de plusieurs Mo)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch (e) {
          console.warn('Fallback compression image:', e);
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}
