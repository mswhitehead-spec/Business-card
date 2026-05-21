import { useState } from 'react';
import type { BusinessCard } from '../../types/contact';

interface Props {
  imageDataUrl: string | null;
  initialData: Partial<BusinessCard>;
  onSave: (contact: BusinessCard) => void;
  onBack?: () => void;
  saveLabel?: string;
}

export function ConfirmStep({ imageDataUrl, initialData, onSave, onBack, saveLabel = 'Save Contact' }: Props) {
  const [form, setForm] = useState({
    name: initialData.name ?? '',
    title: initialData.title ?? '',
    company: initialData.company ?? '',
    email: initialData.email ?? '',
    phone: initialData.phone ?? '',
    website: initialData.website ?? '',
    address: initialData.address ?? '',
    linkedIn: initialData.linkedIn ?? '',
    twitter: initialData.twitter ?? '',
    notes: initialData.notes ?? '',
  });
  const [tagsInput, setTagsInput] = useState((initialData.tags ?? []).join(', '));
  const [keepImage, setKeepImage] = useState(true);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSave() {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const contact: BusinessCard = {
      id: initialData.id ?? crypto.randomUUID(),
      createdAt: initialData.createdAt ?? now,
      updatedAt: now,
      ...form,
      tags,
      imageDataUrl: keepImage ? (imageDataUrl ?? null) : null,
    };
    onSave(contact);
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {imageDataUrl && (
        <div className="rounded-xl overflow-hidden border border-gray-200">
          <img src={imageDataUrl} alt="Business card" className="w-full object-contain max-h-40" />
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
        <p className="text-blue-700 text-sm">Review and correct the extracted details before saving.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        <FormField label="Name" value={form.name} onChange={set('name')} placeholder="Full name" required />
        <FormField label="Title" value={form.title} onChange={set('title')} placeholder="Job title" />
        <FormField label="Company" value={form.company} onChange={set('company')} placeholder="Company name" />
        <FormField label="Email" value={form.email} onChange={set('email')} placeholder="email@example.com" type="email" />
        <FormField label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" type="tel" />
        <FormField label="Website" value={form.website} onChange={set('website')} placeholder="https://example.com" type="url" />
        <FormField label="Address" value={form.address} onChange={set('address')} placeholder="Street, City, State, ZIP" />
        <FormField label="LinkedIn" value={form.linkedIn} onChange={set('linkedIn')} placeholder="https://linkedin.com/in/..." />
        <FormField label="Twitter / X" value={form.twitter} onChange={set('twitter')} placeholder="@handle" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} placeholder="Additional notes..." rows={3} className="w-full text-sm text-gray-800 focus:outline-none resize-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5">Tags <span className="normal-case font-normal">(comma-separated, e.g. CES 2026, Investor)</span></label>
        <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Show name, category..." className="w-full text-sm text-gray-800 focus:outline-none" />
      </div>

      {imageDataUrl && (
        <label className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 cursor-pointer">
          <input type="checkbox" checked={keepImage} onChange={(e) => setKeepImage(e.target.checked)} className="w-4 h-4 rounded" />
          <div>
            <p className="text-sm font-medium text-gray-800">Save card photo</p>
            <p className="text-xs text-gray-400">Stores the image locally (~200–400 KB)</p>
          </div>
        </label>
      )}

      <div className="flex gap-3 pb-2">
        {onBack && (
          <button onClick={onBack} className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl font-semibold text-sm">Back</button>
        )}
        <button onClick={handleSave} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all">{saveLabel}</button>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <label className="text-xs text-gray-400 w-20 flex-shrink-0 uppercase tracking-wide">{label}{required && ' *'}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="flex-1 text-sm text-gray-800 focus:outline-none placeholder-gray-300 min-w-0" />
    </div>
  );
}
