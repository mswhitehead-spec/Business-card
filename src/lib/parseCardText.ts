import type { BusinessCard } from '../types/contact';

export function parseCardText(text: string): Partial<BusinessCard> {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const email =
    text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] ?? '';

  const phone =
    text.match(
      /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}(?:\s?(?:x|ext)\.?\s?\d{1,5})?/
    )?.[0]?.trim() ?? '';

  const linkedInMatch = text.match(/linkedin\.com\/in\/([\w\-]+)/i);
  const linkedIn = linkedInMatch ? `https://linkedin.com/in/${linkedInMatch[1]}` : '';

  const twitterMatch = text.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
  const twitterHandle = text.match(/(?<!\w)@([\w]+)/)?.[1];
  const twitter = twitterMatch
    ? `@${twitterMatch[1]}`
    : twitterHandle ? `@${twitterHandle}` : '';

  const urlMatch = text.match(/https?:\/\/[^\s,]+/i)?.[0] ?? '';
  const wwwMatch = text.match(/www\.[a-z0-9\-]+\.[a-z]{2,}(?:\/[^\s,]*)?/i)?.[0] ?? '';
  const emailDomain = email ? email.split('@')[1] : '';
  const bareDomainMatch =
    text.match(/(?<!\S)([a-z0-9\-]+\.(?:com|io|co|net|org|app|dev|ai))(?!\S)/i)?.[0] ?? '';
  const bareWebsite =
    bareDomainMatch && bareDomainMatch !== emailDomain
      ? `https://${bareDomainMatch}`
      : '';
  const website = urlMatch || (wwwMatch ? `https://${wwwMatch}` : '') || bareWebsite;

  const dataPatterns = [email, phone, linkedIn, twitter, website].filter(Boolean);
  const textLines = lines.filter(
    (l) => !dataPatterns.some((p) => l.includes(p.replace('https://', '').replace('@', '')))
  );

  const nameCandidates = textLines.filter(
    (l) => l.length > 2 && l.length < 60 && !/^\d/.test(l)
  );

  const name = nameCandidates[0] ?? '';
  const title = nameCandidates[1] ?? '';
  const company = nameCandidates[2] ?? '';

  const addressLine = lines.find((l) =>
    /\d+\s+\w/.test(l) && /(?:st|ave|blvd|rd|dr|ln|way|court|pl|suite|ste|floor)/i.test(l)
  ) ?? '';
  const addressIdx = lines.indexOf(addressLine);
  const cityLine =
    addressIdx >= 0 && lines[addressIdx + 1]
      ? lines[addressIdx + 1]
      : '';
  const address = addressLine
    ? `${addressLine}${cityLine ? ', ' + cityLine : ''}`
    : '';

  return { name, title, company, email, phone, website, address, linkedIn, twitter, notes: '' };
}
