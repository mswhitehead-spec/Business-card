import { useState } from 'react';
import { CaptureStep } from './CaptureStep';
import { ExtractStep } from './ExtractStep';
import { ConfirmStep } from './ConfirmStep';
import { useApp } from '../../context/AppContext';
import type { ProcessedImage } from '../../lib/imageUtils';
import type { BusinessCard } from '../../types/contact';

type FlowState =
  | { step: 'capture' }
  | { step: 'extract'; image: ProcessedImage }
  | { step: 'confirm'; image: ProcessedImage; parsed: Partial<BusinessCard> };

export function AddCardFlow() {
  const { dispatch } = useApp();
  const [flow, setFlow] = useState<FlowState>({ step: 'capture' });

  function cancel() {
    dispatch({ type: 'SET_VIEW', view: { name: 'list' } });
  }

  function handleCapture(image: ProcessedImage) {
    setFlow({ step: 'extract', image });
  }

  function handleExtracted(parsed: Partial<BusinessCard>) {
    if (flow.step !== 'extract') return;
    setFlow({ step: 'confirm', image: flow.image, parsed });
  }

  function handleSave(contact: BusinessCard) {
    dispatch({ type: 'ADD_CONTACT', contact });
    dispatch({ type: 'SET_VIEW', view: { name: 'detail', contactId: contact.id } });
  }

  if (flow.step === 'capture') {
    return <CaptureStep onCapture={handleCapture} onCancel={cancel} />;
  }

  if (flow.step === 'extract') {
    return (
      <ExtractStep
        imageDataUrl={flow.image.dataUrl}
        base64={flow.image.base64}
        mediaType={flow.image.mediaType}
        onSuccess={handleExtracted}
        onBack={() => setFlow({ step: 'capture' })}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 flex items-center">
        <button
          onClick={() => setFlow({ step: 'extract', image: flow.image })}
          className="text-blue-600 font-medium text-sm"
        >
          Back
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Review Details</h1>
        <button onClick={cancel} className="text-gray-500 font-medium text-sm">Cancel</button>
      </header>
      <ConfirmStep
        imageDataUrl={flow.image.dataUrl}
        initialData={flow.parsed}
        onSave={handleSave}
      />
    </div>
  );
}
