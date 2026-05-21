import { useState } from 'react';
import { callClaude, parseExtraction } from '../lib/claude';
import type { BusinessCard } from '../types/contact';

interface ExtractState {
  loading: boolean;
  error: string | null;
  result: Partial<BusinessCard> | null;
}

export function useClaudeExtract() {
  const [state, setState] = useState<ExtractState>({
    loading: false,
    error: null,
    result: null,
  });

  async function extract(
    base64: string,
    mediaType: string,
    apiKey: string,
    model: string
  ): Promise<Partial<BusinessCard> | null> {
    setState({ loading: true, error: null, result: null });
    try {
      const text = await callClaude(base64, mediaType, apiKey, model);
      const parsed = parseExtraction(text);
      setState({ loading: false, error: null, result: parsed });
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setState({ loading: false, error: msg, result: null });
      return null;
    }
  }

  function reset() {
    setState({ loading: false, error: null, result: null });
  }

  return { ...state, extract, reset };
}
