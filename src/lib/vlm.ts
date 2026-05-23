import {
  AutoProcessor,
  AutoModelForImageTextToText,
  RawImage,
  env,
} from '@huggingface/transformers';
import { parseExtraction } from './claude';
import type { BusinessCard } from '../types/contact';

env.useBrowserCache = true;
env.allowLocalModels = false;

const MODEL_ID = 'HuggingFaceTB/SmolVLM-256M-Instruct';

const EXTRACTION_PROMPT = `You are a business card data extraction assistant.
Extract ALL visible contact information from this business card image.
Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

JSON schema (use empty string "" for any field not found):
{"name":"","title":"","company":"","email":"","phone":"","website":"","address":"","linkedIn":"","twitter":"","notes":""}

Rules:
- Extract text exactly as printed; do not guess or hallucinate fields.
- prefix bare domains with https://
- put secondary phones/emails in notes
Return only the JSON object, nothing else.`;

export type OnProgress = (info: { message: string; percent?: number }) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let processorCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let modelCache: any = null;
let loadingPromise: Promise<void> | null = null;

export function isWebGPUAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator && navigator.gpu != null;
}

function makeProgressCb(onProgress: OnProgress): (info: { status: string; file?: string; progress?: number }) => void {
  return (info) => {
    if (info.status === 'progress' && info.progress != null) {
      onProgress({
        message: `Downloading${info.file ? ` ${info.file}` : ''}...`,
        percent: Math.round(info.progress),
      });
    } else if (info.status === 'initiate' || info.status === 'download') {
      onProgress({ message: `Downloading${info.file ? ` ${info.file}` : ''}...` });
    } else if (info.status === 'done') {
      onProgress({ message: 'Loading model weights...' });
    }
  };
}

async function load(onProgress: OnProgress): Promise<void> {
  const device = isWebGPUAvailable() ? 'webgpu' : 'wasm';
  onProgress({ message: 'Preparing on-device AI (first time: ~200 MB download)...' });
  processorCache = await AutoProcessor.from_pretrained(MODEL_ID, {
    progress_callback: makeProgressCb(onProgress),
  });
  modelCache = await AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
    dtype: 'q4',
    device,
    progress_callback: makeProgressCb(onProgress),
  });
}

async function ensureLoaded(onProgress: OnProgress): Promise<void> {
  if (processorCache && modelCache) return;
  if (loadingPromise) { await loadingPromise; return; }
  loadingPromise = load(onProgress).finally(() => { loadingPromise = null; });
  await loadingPromise;
}

export async function extractWithVLM(
  imageDataUrl: string,
  onProgress: OnProgress
): Promise<Partial<BusinessCard>> {
  await ensureLoaded(onProgress);
  onProgress({ message: 'Analyzing card with on-device AI...' });

  const image = await RawImage.read(imageDataUrl);

  const conversation = [{
    role: 'user',
    content: [
      { type: 'image' },
      { type: 'text', text: EXTRACTION_PROMPT },
    ],
  }];

  const text = processorCache.apply_chat_template(conversation, {
    tokenize: false,
    add_generation_prompt: true,
  });

  const inputs = await processorCache(text, [image], { padding: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const generated_ids: any = await modelCache.generate({ ...inputs, max_new_tokens: 512 });

  const decodeFn =
    processorCache.batch_decode?.bind(processorCache) ??
    processorCache.tokenizer?.batch_decode?.bind(processorCache.tokenizer);

  if (!decodeFn) throw new Error('Cannot decode VLM output: no batch_decode found');

  const decoded: string[] = decodeFn(generated_ids, { skip_special_tokens: true });
  const rawText = decoded[0] ?? '';

  return parseExtraction(rawText);
}

export async function isModelCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open('transformers-cache');
    const keys = await cache.keys();
    return keys.some((req: Request) => req.url.includes('SmolVLM'));
  } catch {
    return false;
  }
}

export async function preloadModel(onProgress: OnProgress): Promise<void> {
  await ensureLoaded(onProgress);
}
