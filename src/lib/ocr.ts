import Tesseract from 'tesseract.js';

export async function ocrImage(imageDataUrl: string): Promise<string> {
  const result = await Tesseract.recognize(imageDataUrl, 'eng', {
    logger: () => {},
  });
  return result.data.text;
}
