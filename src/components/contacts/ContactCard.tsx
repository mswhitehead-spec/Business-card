import type { BusinessCard } from '../../types/contact';

function avatarColor(name: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-red-500', 'bg-indigo-500'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  contact: BusinessCard;
  onClick: () => void;
}

export function ContactCard({ contact, onClick }: Props) {
  const initial = contact.name ? contact.name[0].toUpperCase() : '?';
  const color = avatarColor(contact.name);

  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {contact.imageDataUrl ? (
          <img src={contact.imageDataUrl} alt={contact.name} className="w-12 h-8 object-cover rounded-md border border-gray-100 flex-shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0`}>{initial}</div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{contact.name || 'Unknown'}</p>
          <p className="text-sm text-gray-500 truncate">{contact.company}</p>
        </div>
      </div>
      {(contact.title || contact.email || contact.phone) && (
        <div className="text-sm text-gray-600 space-y-0.5">
          {contact.title && <p className="truncate">{contact.title}</p>}
          {contact.email && <p className="truncate text-blue-600">{contact.email}</p>}
          {contact.phone && <p className="truncate">{contact.phone}</p>}
        </div>
      )}
      {contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {contact.tags.map((tag) => (<span key={tag} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{tag}</span>))}
        </div>
      )}
    </button>
  );
}
