import { useState } from 'react';
import { callClaude, parseExtraction } from '../lib/claude';
import { ocrImage } from '../lib/ocr';
import { parseCardText } from '../lib/parseCardText';
import { extractWithVLM, isWebGPUAvailable } from '../lib/vlm';
import type { BusinessCard } from '../types/contact';

interface ExtractState {
  loading: boolean;
  error: string | null;
  result: Partial<BusinessCard> | null;
  mode: 'claude' | 'vlm' | 'ocr' | null;
  progress: string | null;
  progressPct: number | undefined;
}

const INITIAL: ExtractState = {
  loading: false,
  error: null,
  result: null,
  mode: null,
  progress: null,
  progressPct: undefined,
};

export function useClaudeExtract() {
  const [state, setState] = useState<ExtractState>(INITIAL);

  async function extract(
    base64: string,
    mediaType: string,
    imageDataUrl: string,
    apiKey: string,
    model: string
  ): Promise<Partial<BusinessCard> | null> {
    setState({ ...INITIAL, loading: true });

    try {
      // Path 1: Claude API (when key provided)
      if (apiKey) {
        const text = await callClaude(base64, mediaType, apiKey, model);
        const parsed = parseExtraction(text);
        setState({ ...INITIAL, result: parsed, mode: 'claude' });
        return parsed;
      }

      // Path 2: On-device VLM (when WebGPU available)
      if (isWebGPUAvailable()) {
        try {
          const parsed = await extractWithVLM(imageDataUrl, ({ message, percent }) => {
            setState((prev) => ({ ...prev, progress: message, progressPct: percent }));
          });
          setState({ ...INITIAL, result: parsed, mode: 'vlm' });
          return parsed;
        } catch (vlmErr) {
          // VLM failed — fall through to Tesseract silently
          console.warn('VLM extraction failed, falling back to OCR:', vlmErr);
        }
      }

      // Path 3: Tesseract OCR fallback
      setState((prev) => ({ ...prev, progress: 'Reading card with OCR...', progressPct: undefined }));
      const rawText = await ocrImage(imageDataUrl);
      const parsed = parseCardText(rawText);
      setState({ ...INITIAL, result: parsed, mode: 'ocr' });
      return parsed;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ ...INITIAL, error: msg });
      return null;
    }
  }

  function reset() {
    setState(INITIAL);
  }

  return { ...state, extract, reset };
}
