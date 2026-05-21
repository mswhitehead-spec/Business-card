import { useState } from 'react';
import { callClaude, parseExtraction } from '../lib/claude';
import { ocrImage } from '../lib/ocr';
import { parseCardText } from '../lib/parseCardText';
import type { BusinessCard } from '../types/contact';

interface ExtractState {
  loading: boolean;
  error: string | null;
  result: Partial<BusinessCard> | null;
  mode: 'claude' | 'ocr' | null;
}

export function useClaudeExtract() {
  const [state, setState] = useState<ExtractState>({
    loading: false,
    error: null,
    result: null,
    mode: null,
  });

  async function extract(
    base64: string,
    mediaType: string,
    imageDataUrl: string,
    apiKey: string,
    model: string
  ): Promise<Partial<BusinessCard> | null> {
    setState({ loading: true, error: null, result: null, mode: null });

    try {
      if (apiKey) {
        const text = await callClaude(base64, mediaType, apiKey, model);
        const parsed = parseExtraction(text);
        setState({ loading: false, error: null, result: parsed, mode: 'claude' });
        return parsed;
      } else {
        const rawText = await ocrImage(imageDataUrl);
        const parsed = parseCardText(rawText);
        setState({ loading: false, error: null, result: parsed, mode: 'ocr' });
        return parsed;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ loading: false, error: msg, result: null, mode: null });
      return null;
    }
  }

  function reset() {
    setState({ loading: false, error: null, result: null, mode: null });
  }

  return { ...state, extract, reset };
}
