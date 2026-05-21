import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { testApiKey } from '../../lib/claude';
import { getStorageUsageKB, clearStorage } from '../../lib/storage';
import { Spinner } from '../ui/Spinner';

export function Settings() {
  const { state, dispatch } = useApp();
  const [apiKey, setApiKey] = useState(state.settings.anthropicApiKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testError, setTestError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function saveKey() {
    dispatch({ type: 'SET_SETTINGS', settings: { anthropicApiKey: apiKey.trim() } });
  }

  async function handleTest() {
    const key = apiKey.trim();
    if (!key) { alert('Enter an API key first.'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      await testApiKey(key, state.settings.model);
      setTestResult('success');
      dispatch({ type: 'SET_SETTINGS', settings: { anthropicApiKey: key } });
    } catch (err) {
      setTestResult('error');
      setTestError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setTesting(false);
    }
  }

  function handleClearAll() {
    clearStorage();
    dispatch({ type: 'LOAD_STATE', state: { contacts: [], currentView: { name: 'list' }, settings: state.settings } });
    setShowClearConfirm(false);
  }

  function exportJSON() {
    const json = JSON.stringify(state.contacts, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-cards-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const storageKB = getStorageUsageKB();

  return (
    <div className="max-w-2xl mx-auto">
      <header className="sticky top-0 bg-gray-50 z-10 px-4 pt-4 pb-3 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </header>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Anthropic API Key</p>
            <p className="text-xs text-gray-400 mt-0.5">Required for card scanning. Get one at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">console.anthropic.com</a></p>
          </div>
          <div className="p-4 space-y-3">
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} onBlur={saveKey} placeholder="sk-ant-..." className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {testResult === 'success' && (
              <p className="text-green-600 text-sm flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><polyline points="20 6 9 17 4 12" /></svg>
                API key is valid
              </p>
            )}
            {testResult === 'error' && <p className="text-red-600 text-sm break-all">{testError}</p>}
            <button onClick={handleTest} disabled={testing} className="flex items-center justify-center gap-2 w-full py-2.5 border border-blue-300 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50 transition-colors">
              {testing ? <><Spinner size={16} /> Testing...</> : 'Test API Key'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Claude Model</p>
            <p className="text-xs text-gray-400 mt-0.5">Haiku is faster and cheaper; Sonnet is more accurate</p>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku (Recommended)', desc: 'Fast & affordable — great for quick scanning at shows' },
              { id: 'claude-sonnet-4-6', label: 'Claude Sonnet', desc: 'More accurate for complex or hard-to-read cards' },
            ].map((m) => (
              <label key={m.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                <input type="radio" name="model" value={m.id} checked={state.settings.model === m.id} onChange={() => dispatch({ type: 'SET_SETTINGS', settings: { model: m.id as typeof state.settings.model } })} className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-900 text-sm">Data & Storage</p>
            <p className="text-xs text-gray-400 mt-0.5">{state.contacts.length} card{state.contacts.length !== 1 ? 's' : ''} · ~{storageKB} KB used locally</p>
          </div>
          <div className="p-4 space-y-3">
            <button onClick={exportJSON} disabled={state.contacts.length === 0} className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Export Contacts as JSON
            </button>
            {showClearConfirm ? (
              <div className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-3">
                <p className="text-sm text-red-700 font-medium text-center">Delete all {state.contacts.length} contacts?</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700">Cancel</button>
                  <button onClick={handleClearAll} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Delete All</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)} className="w-full py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Clear All Data</button>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 pb-2">Card Tracker · All data stored locally on your device</div>
      </div>
    </div>
  );
}
