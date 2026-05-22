export function preprocessForOCR(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      // Upscale to at least 2400px on longest side — Tesseract accuracy improves significantly at higher resolution
      const TARGET = 2400;
      if (Math.max(width, height) < TARGET) {
        const scale = TARGET / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;
      const n = width * height;

      // Convert to grayscale
      const gray = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
      }

      // Robust contrast stretch using 5th/95th percentile (handles coloured backgrounds)
      const hist = new Uint32Array(256);
      for (let i = 0; i < n; i++) hist[gray[i]]++;
      let cumul = 0, minVal = 0, maxVal = 255;
      for (let v = 0; v < 256; v++) {
        cumul += hist[v];
        if (cumul <= n * 0.05) minVal = v;
        if (cumul <= n * 0.95) maxVal = v;
      }
      const range = (maxVal - minVal) || 1;

      for (let i = 0; i < n; i++) {
        const v = Math.max(0, Math.min(255, Math.round(((gray[i] - minVal) / range) * 255)));
        data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = v;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to preprocess image'));
    img.src = imageDataUrl;
  });
}

export interface ProcessedImage {
  base64: string;
  dataUrl: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export async function resizeAndConvert(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<ProcessedImage> {
  const mediaType = (
    file.type === 'image/png' ? 'image/png'
    : file.type === 'image/webp' ? 'image/webp'
    : 'image/jpeg'
  ) as ProcessedImage['mediaType'];

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D not supported')); return; }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Failed to compress image')); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, dataUrl, mediaType });
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        },
        mediaType === 'image/png' ? 'image/png' : 'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}
