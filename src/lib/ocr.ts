import { createWorker, PSM } from 'tesseract.js';
import { preprocessForOCR } from './imageUtils';

export async function ocrImage(imageDataUrl: string): Promise<string> {
  const processed = await preprocessForOCR(imageDataUrl);
  const worker = await createWorker('eng');
  try {
    // PSM.SPARSE_TEXT = 11: finds text anywhere on the card regardless of layout
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const { data } = await worker.recognize(processed);
    return data.text;
  } finally {
    await worker.terminate();
  }
}
