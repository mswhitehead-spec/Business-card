import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types/contact';
import { loadFromStorage, saveToStorage } from '../lib/storage';

const DEFAULT_STATE: AppState = {
  contacts: [],
  currentView: { name: 'list' },
  settings: {
    anthropicApiKey: '',
    model: 'claude-haiku-4-5-20251001',
  },
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'ADD_CONTACT':
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case 'UPDATE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.contact.id ? action.contact : c
        ),
      };
    case 'DELETE_CONTACT':
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
      };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE, (init) => {
    const saved = loadFromStorage();
    if (!saved) return init;
    return { ...saved, currentView: { name: 'list' as const } };
  });

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
