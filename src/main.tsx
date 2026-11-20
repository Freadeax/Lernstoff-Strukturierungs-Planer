import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { starteGeraetestand } from './core/geraetestand';
import './styles.css';
import './ui/ui.css';
import './ui/workspace.css';
import './ui/farbfelder.css';
import './ui/motion.css';

// public/browser-pruefung.js zeigt in zu alten Browsern einen Hinweis; die App startet dann nicht halb.
if (!(window as { __browserZuAlt?: boolean }).__browserZuAlt) {
  // Große Lernstände liegen in IndexedDB (core/geraetestand.ts) und werden vor dem ersten Bild geladen, damit
  // jede Seite sie wie bisher sofort lesen kann. Ohne IndexedDB startet die App mit dem localStorage.
  // Höchstens 8 s warten (z. B. Datenbank durch ein altes Fenster blockiert): Was dann noch im localStorage landet,
  // führt der nächste Start mit der Datenbank zusammen.
  void Promise.race([starteGeraetestand(), new Promise((r) => setTimeout(r, 8000))]).finally(() => createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ));
}
