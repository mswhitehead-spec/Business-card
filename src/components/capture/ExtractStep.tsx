import { useEffect } from 'react';
import { Spinner } from '../ui/Spinner';
import { useClaudeExtract } from '../../hooks/useClaudeExtract';
import { useApp } from '../../context/AppContext';
import { isWebGPUAvailable } from '../../lib/vlm';
import type { BusinessCard } from '../../types/contact';

interface Props {
  imageDataUrl: string;
  base64: string;
  mediaType: string;
  onSuccess: (parsed: Partial<BusinessCard>) => void;
  onBack: () => void;
}

export function ExtractStep({ imageDataUrl, base64, mediaType, onSuccess, onBack }: Props) {
  const { state } = useApp();
  const { loading, error, mode, progress, progressPct, extract } = useClaudeExtract();

  useEffect(() => {
    runExtraction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runExtraction() {
    const result = await extract(
      base64,
      mediaType,
      imageDataUrl,
      state.settings.anthropicApiKey,
      state.settings.model
    );
    if (result) onSuccess(result);
  }

  function loadingMessage() {
    if (progress) return progress;
    if (state.settings.anthropicApiKey) return 'Analyzing with Claude AI...';
    if (isWebGPUAvailable()) return 'Preparing on-device AI...';
    return 'Reading card with OCR...';
  }

  function loadingSubtext() {
    if (progress) return null;
    if (state.settings.anthropicApiKey) return 'Claude is reading the card and extracting contact details';
    if (isWebGPUAvailable()) return 'Running AI model locally — no data leaves your device';
    return 'Extracting text from the card image';
  }

  const sub = loadingSubtext();

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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Spinner size={40} />
            <p className="text-gray-600 font-medium text-center">{loadingMessage()}</p>
            {sub && <p className="text-gray-400 text-sm text-center">{sub}</p>}
            {progressPct != null && (
              <div className="w-full max-w-xs">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-xs text-gray-400 text-center mt-1">{progressPct}%</p>
              </div>
            )}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-red-700 font-medium text-sm">Couldn't read this card automatically</p>
            <p className="text-red-600 text-sm">Add a Claude API key in Settings for reliable extraction, or enter the details manually.</p>
            <div className="flex gap-3">
              <button onClick={runExtraction} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Retry</button>
              <button onClick={() => onSuccess({})} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium">Enter Manually</button>
            </div>
          </div>
        ) : mode === 'vlm' ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>
            <p className="text-green-700 text-xs">Analyzed with on-device AI — no data left your device.</p>
          </div>
        ) : mode === 'ocr' ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            <p className="text-amber-700 text-xs">Used basic OCR — results may need corrections. Your device does not support WebGPU for on-device AI.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
