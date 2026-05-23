import { useRef } from 'react';
import { resizeAndConvert } from '../../lib/imageUtils';
import type { ProcessedImage } from '../../lib/imageUtils';

interface Props {
  onCapture: (image: ProcessedImage) => void;
  onCancel: () => void;
}

export function CaptureStep({ onCapture, onCancel }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    try {
      const processed = await resizeAndConvert(file);
      onCapture(processed);
    } catch (err) {
      alert('Failed to process image. Please try again.');
      console.error(err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 flex items-center">
        <button onClick={onCancel} className="text-blue-600 font-medium text-sm">Cancel</button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Add Card</h1>
        <div className="w-14" />
      </header>

      <div className="p-6 flex flex-col items-center gap-6 mt-4">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>

        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Scan a Business Card</h2>
          <p className="text-gray-500 text-sm max-w-xs">Take a photo or upload an image. Claude will automatically extract all contact details.</p>
        </div>

        <div className="w-full space-y-3">
          <button onClick={() => cameraRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 rounded-xl font-semibold text-base shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Take Photo
          </button>
          <button onClick={() => galleryRef.current?.click()} className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 py-4 rounded-xl font-semibold text-base border border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Upload from Library
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center max-w-xs">Images are processed locally and sent to the Claude API. Nothing is stored on any server.</p>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
