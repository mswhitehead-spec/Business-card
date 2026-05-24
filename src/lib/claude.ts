import type { BusinessCard } from '../types/contact';

const EXTRACTION_PROMPT = `You are a business card OCR and data extraction assistant.

Examine the business card image carefully and extract ALL visible contact information.
Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

Required JSON schema (use empty string "" for any field not found on the card):
{
  "name": "Full name of the person",
  "title": "Job title or role",
  "company": "Company or organization name",
  "email": "Primary email address",
  "phone": "Primary phone number, include country code if visible",
  "website": "Website URL (include https:// prefix if only domain is shown)",
  "address": "Full mailing address on one line",
  "linkedIn": "LinkedIn URL or handle",
  "twitter": "Twitter/X handle with @ prefix",
  "notes": "Any other info on the card (secondary phones, emails, etc)"
}

Rules:
- Extract text exactly as printed; do not guess or hallucinate fields.
- If multiple phones/emails appear, put the primary one in the field and extras in notes.
- For website, if only a domain is shown (e.g. acme.com), prefix with https://.
- Return only the JSON object, nothing else.`;

export async function callClaude(
  base64: string,
  mediaType: string,
  apiKey: string,
  model: string
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: controller.signal,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      }],
    }),
  }).finally(() => clearTimeout(timer));

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.content[0].text as string;
}

export async function testApiKey(apiKey: string, model: string): Promise<void> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API key test failed (${res.status}): ${body}`);
  }
}

export function parseExtraction(text: string): Partial<BusinessCard> {
  let json = text.trim();
  json = json.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  const match = json.match(/\{[\s\S]*\}/);
  if (match) json = match[0];
  const raw = JSON.parse(json);
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    name: str(raw.name),
    title: str(raw.title),
    company: str(raw.company),
    email: str(raw.email),
    phone: str(raw.phone),
    website: str(raw.website),
    address: str(raw.address),
    linkedIn: str(raw.linkedIn),
    twitter: str(raw.twitter),
    notes: str(raw.notes),
  };
}
