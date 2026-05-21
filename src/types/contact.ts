export interface BusinessCard {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  linkedIn: string;
  twitter: string;
  notes: string;
  imageDataUrl: string | null;
  tags: string[];
}

export type View =
  | { name: 'list' }
  | { name: 'detail'; contactId: string }
  | { name: 'add' }
  | { name: 'settings' };

export interface AppSettings {
  anthropicApiKey: string;
  model: 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6';
}

export interface AppState {
  contacts: BusinessCard[];
  currentView: View;
  settings: AppSettings;
}

export type AppAction =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'ADD_CONTACT'; contact: BusinessCard }
  | { type: 'UPDATE_CONTACT'; contact: BusinessCard }
  | { type: 'DELETE_CONTACT'; id: string }
  | { type: 'SET_SETTINGS'; settings: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; state: AppState };
