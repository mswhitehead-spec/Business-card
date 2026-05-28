import type { AppState } from '../types/contact';

const KEY = 'card-tracker:state';

export function loadFromStorage(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}

export function saveToStorage(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded — retry without embedded images so contacts still persist
    try {
      const stripped = {
        ...state,
        contacts: state.contacts.map((c) => ({ ...c, imageDataUrl: null })),
      };
      localStorage.setItem(KEY, JSON.stringify(stripped));
    } catch {
      // localStorage unavailable (e.g. private browsing) — data lives in memory only
    }
  }
}

export function getStorageUsageKB(): number {
  try {
    const raw = localStorage.getItem(KEY) ?? '';
    return Math.round((raw.length * 2) / 1024);
  } catch {
    return 0;
  }
}

export function clearStorage(): void {
  localStorage.removeItem(KEY);
}
