import type { BusinessCard } from '../types/contact';

function cleanOcr(text: string): string {
  return text
    .replace(/\|/g, 'I')
    .replace(/[^\x20-\x7E\n]/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

const TITLE_WORDS = /\b(director|manager|engineer|developer|designer|analyst|consultant|president|vice\s*president|vp|ceo|cto|cfo|coo|founder|partner|associate|specialist|coordinator|executive|head\s+of|lead|senior|principal|architect|scientist|researcher|advisor|owner|account|sales|marketing|product|program|project|operations|officer)\b/i;
const COMPANY_SUFFIXES = /\b(inc|llc|ltd|corp|co|company|group|solutions|services|consulting|technologies|tech|systems|agency|associates|partners|ventures|holdings|international|global)\b\.?/i;

function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  return words.length >= 2 && words.length <= 5 &&
    words.every((w) => /^[A-Z][a-zA-Z'\-]{0,}$/.test(w));
}

export function parseCardText(text: string): Partial<BusinessCard> {
  const cleaned = cleanOcr(text);
  const lines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);

  const email = cleaned.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] ?? '';
  const phone = cleaned.match(/(?:\+?[\d]{1,3}[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}(?:\s?(?:x|ext)\.?\s?\d{1,5})?/)?.[0]?.trim() ?? '';

  const linkedInMatch = cleaned.match(/linkedin\.com\/in\/([\w\-]+)/i);
  const linkedIn = linkedInMatch ? `https://linkedin.com/in/${linkedInMatch[1]}` : '';

  const twitterMatch = cleaned.match(/(?:twitter\.com|x\.com)\/(\w+)/i);
  const twitterHandle = cleaned.match(/(?<!\w)@([\w]+)/)?.[1];
  const twitter = twitterMatch ? `@${twitterMatch[1]}` : twitterHandle ? `@${twitterHandle}` : '';

  const urlMatch = cleaned.match(/https?:\/\/[^\s,]+/i)?.[0] ?? '';
  const wwwMatch = cleaned.match(/www\.[a-z0-9\-]+\.[a-z]{2,}(?:\/[^\s,]*)?/i)?.[0] ?? '';
  const emailDomain = email ? email.split('@')[1] : '';
  const bareDomainMatch = cleaned.match(/(?<!\S)([a-z0-9\-]+\.(?:com|io|co|net|org|app|dev|ai))(?!\S)/i)?.[0] ?? '';
  const bareWebsite = bareDomainMatch && bareDomainMatch !== emailDomain ? `https://${bareDomainMatch}` : '';
  const website = urlMatch || (wwwMatch ? `https://${wwwMatch}` : '') || bareWebsite;

  const dataSignatures = [email, phone, linkedIn, twitter, website].filter(Boolean);
  const textLines = lines.filter((l) => {
    if (l.length <= 1 || l.length >= 80) return false;
    if (/^\d/.test(l)) return false;
    return !dataSignatures.some((p) =>
      l.toLowerCase().includes(p.replace('https://', '').replace('@', '').toLowerCase())
    );
  });

  const nameLine = textLines.find(looksLikeName) ?? textLines[0] ?? '';
  const rest = textLines.filter((l) => l !== nameLine);
  const titleLine = rest.find((l) => TITLE_WORDS.test(l)) ?? rest[0] ?? '';
  const rest2 = rest.filter((l) => l !== titleLine);
  const companyLine = rest2.find((l) => COMPANY_SUFFIXES.test(l)) ?? rest2[0] ?? '';

  const addressLine = lines.find((l) =>
    /\d+\s+\w/.test(l) && /(?:st|ave|blvd|rd|dr|ln|way|court|pl|suite|ste|floor)/i.test(l)
  ) ?? '';
  const addressIdx = lines.indexOf(addressLine);
  const cityLine = addressIdx >= 0 && lines[addressIdx + 1] ? lines[addressIdx + 1] : '';
  const address = addressLine ? `${addressLine}${cityLine ? ', ' + cityLine : ''}` : '';

  return { name: nameLine, title: titleLine, company: companyLine, email, phone, website, address, linkedIn, twitter, notes: '' };
}
