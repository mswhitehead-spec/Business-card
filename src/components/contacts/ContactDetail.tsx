import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfirmStep } from '../capture/ConfirmStep';
import type { BusinessCard } from '../../types/contact';

interface Props {
  contactId: string;
}

export function ContactDetail({ contactId }: Props) {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const contact = state.contacts.find((c) => c.id === contactId);
  if (!contact) return <div className="p-4 text-center text-gray-500 py-12">Contact not found.</div>;

  function handleDelete() {
    dispatch({ type: 'DELETE_CONTACT', id: contactId });
    dispatch({ type: 'SET_VIEW', view: { name: 'list' } });
  }

  function handleSave(updated: BusinessCard) {
    dispatch({ type: 'UPDATE_CONTACT', contact: { ...updated, updatedAt: new Date().toISOString() } });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="max-w-2xl mx-auto">
        <header className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 flex items-center gap-3">
          <button onClick={() => setEditing(false)} className="text-blue-600 font-medium text-sm">Cancel</button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Edit Contact</h1>
          <div className="w-14" />
        </header>
        <ConfirmStep imageDataUrl={contact.imageDataUrl} initialData={contact} onSave={handleSave} onBack={() => setEditing(false)} saveLabel="Save Changes" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-white z-10 px-4 pt-4 pb-3 border-b border-gray-200 flex items-center gap-3">
        <button onClick={() => dispatch({ type: 'SET_VIEW', view: { name: 'list' } })} className="flex items-center text-blue-600 font-medium text-sm gap-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><polyline points="15 18 9 12 15 6" /></svg>
          Cards
        </button>
        <h1 className="text-lg font-bold text-gray-900 flex-1 text-center truncate">{contact.name || 'Contact'}</h1>
        <button onClick={() => setEditing(true)} className="text-blue-600 font-medium text-sm">Edit</button>
      </header>
      <div className="p-4 space-y-4">
        {contact.imageDataUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <img src={contact.imageDataUrl} alt="Business card" className="w-full object-contain max-h-48" />
          </div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xl font-bold text-gray-900">{contact.name || '—'}</p>
            {contact.title && <p className="text-gray-500 mt-0.5">{contact.title}</p>}
            {contact.company && <p className="text-gray-600 font-medium mt-0.5">{contact.company}</p>}
          </div>
          <ContactField icon="mail" label="Email" value={contact.email} href={contact.email ? `mailto:${contact.email}` : undefined} />
          <ContactField icon="phone" label="Phone" value={contact.phone} href={contact.phone ? `tel:${contact.phone}` : undefined} />
          <ContactField icon="globe" label="Website" value={contact.website} href={contact.website || undefined} />
          <ContactField icon="map-pin" label="Address" value={contact.address} />
          <ContactField icon="linkedin" label="LinkedIn" value={contact.linkedIn} href={contact.linkedIn ? (contact.linkedIn.startsWith('http') ? contact.linkedIn : `https://linkedin.com/in/${contact.linkedIn}`) : undefined} />
          <ContactField icon="twitter" label="Twitter / X" value={contact.twitter} href={contact.twitter ? `https://x.com/${contact.twitter.replace('@', '')}` : undefined} />
        </div>
        {contact.notes && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}
        {contact.tags.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (<span key={tag} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">{tag}</span>))}
            </div>
          </div>
        )}
        <div className="text-center text-xs text-gray-400 pb-2">Added {new Date(contact.createdAt).toLocaleDateString()}</div>
        {showDeleteConfirm ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 font-medium text-center">Delete this contact?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 text-red-600 font-medium text-sm border border-red-200 rounded-xl hover:bg-red-50 transition-colors">Delete Contact</button>
        )}
      </div>
    </div>
  );
}

function ContactField({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  if (!value) return null;
  const content = (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-0">
      <FieldIcon name={icon} />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium break-all ${href ? 'text-blue-600' : 'text-gray-800'}`}>{value}</p>
      </div>
    </div>
  );
  if (href) return <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{content}</a>;
  return content;
}

function FieldIcon({ name }: { name: string }) {
  const cls = 'w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0';
  switch (name) {
    case 'mail': return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
    case 'phone': return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.08 6.08l1.09-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
    case 'globe': return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
    case 'map-pin': return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
    case 'linkedin': return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>;
    case 'twitter': return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
    default: return null;
  }
}
