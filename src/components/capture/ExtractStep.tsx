import { useEffect } from 'react';
import { Spinner } from '../ui/Spinner';
import { useClaudeExtract } from '../../hooks/useClaudeExtract';
import { useApp } from '../../context/AppContext';
import type { BusinessCard } from '../../types/contact';

interface Props {
  imageDataUrl: string;
  base64: string;
  mediaType: string;
  onSuccess: (parsed: Partial<BusinessCard>) => void;
  onBack: () => void;
}

export function ExtractStep({ imageDataUrl, base64, mediaType, onSuccess, onBack }: Props) {
  const { state, dispatch } = useApp();
  const { loading, error, extract } = useClaudeExtract();

  useEffect(() => {
    if (!state.settings.anthropicApiKey) return;
    runExtraction();
  }, []);

  async function runExtraction() {
    if (!state.settings.anthropicApiKey) return;
    const result = await extract(base64, mediaType, state.settings.anthropicApiKey, state.settings.model);
    if (result) onSuccess(result);
  }

  const noKey = !state.settings.anthropicApiKey;

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 flex items-center">
        <button onClick={onBack} className="text-blue-600 font-medium text-sm">Back</button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Analyzing Card</h1>
        <div className="w-14" />
      </header>

      <div className="p-4 space-y-4">
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img src={imageDataUrl} alt="Business card" className="w-full object-contain max-h-56" />
        </div>

        {noKey ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-amber-800 font-medium text-sm">API Key Required</p>
            <p className="text-amber-700 text-sm">You need an Anthropic API key to extract card details. Add one in Settings first.</p>
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Back</button>
              <button onClick={() => dispatch({ type: 'SET_VIEW', view: { name: 'settings' } })} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">Go to Settings</button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Spinner size={40} />
            <p className="text-gray-600 font-medium">Analyzing business card...</p>
            <p className="text-gray-400 text-sm text-center">Claude is reading the card and extracting contact details</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-red-700 font-medium text-sm">Extraction failed</p>
            <p className="text-red-600 text-sm break-all">{error}</p>
            <div className="flex gap-3">
              <button onClick={onBack} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Back</button>
              <button onClick={runExtraction} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">Retry</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
