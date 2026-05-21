import { AppProvider, useApp } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { ContactList } from './components/contacts/ContactList';
import { ContactDetail } from './components/contacts/ContactDetail';
import { AddCardFlow } from './components/capture/AddCardFlow';
import { Settings } from './components/settings/Settings';

function ViewRouter() {
  const { state } = useApp();
  const view = state.currentView;

  switch (view.name) {
    case 'list':
      return <ContactList />;
    case 'detail':
      return <ContactDetail contactId={view.contactId} />;
    case 'add':
      return <AddCardFlow />;
    case 'settings':
      return <Settings />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <AppShell>
        <ViewRouter />
      </AppShell>
    </AppProvider>
  );
}
