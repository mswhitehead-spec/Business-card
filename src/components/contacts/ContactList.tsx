import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ContactCard } from './ContactCard';

export function ContactList() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');

  const filtered = state.contacts.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 mb-3">Business Cards</h1>
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search cards..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {filtered.length} of {state.contacts.length} card{state.contacts.length !== 1 ? 's' : ''}
        </p>
      </header>

      <div className="p-4">
        {state.contacts.length === 0 ? (
          <EmptyState onAdd={() => dispatch({ type: 'SET_VIEW', view: { name: 'add' } })} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No cards match "{query}"</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onClick={() =>
                  dispatch({ type: 'SET_VIEW', view: { name: 'detail', contactId: contact.id } })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">No cards yet</h2>
      <p className="text-gray-500 text-sm mb-6 max-w-xs">
        Scan your first business card to get started. Claude will automatically extract all the contact details.
      </p>
      <button
        onClick={onAdd}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-sm hover:bg-blue-700 active:scale-[0.97] transition-all"
      >
        Scan Your First Card
      </button>
    </div>
  );
}
