import { useState } from 'react';
import { Dashboard } from './features/Dashboard';
import { Faecher } from './features/Faecher';
import { Einstellungen } from './features/Einstellungen';

const views = { dashboard: 'Übersicht', faecher: 'Fächer', einstellungen: 'Einstellungen' } as const;
type View = keyof typeof views;

export function App() {
  const [view, setView] = useState<View>('dashboard');
  return (
    <div className="app">
      <header>
        <h1>Lernstoff-Planer</h1>
        <nav>
          {(Object.keys(views) as View[]).map((v) => (
            <button key={v} className={v === view ? 'active' : ''} onClick={() => setView(v)}>
              {views[v]}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'faecher' && <Faecher />}
        {view === 'einstellungen' && <Einstellungen />}
      </main>
    </div>
  );
}
