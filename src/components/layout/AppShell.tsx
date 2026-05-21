import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <main className="flex-1 pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
