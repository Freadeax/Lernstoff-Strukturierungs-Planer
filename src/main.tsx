import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './ui/ui.css';
import './ui/workspace.css';
import './ui/farbfelder.css';
import './ui/motion.css';

// public/browser-pruefung.js zeigt in zu alten Browsern einen Hinweis; die App startet dann nicht halb.
if (!(window as { __browserZuAlt?: boolean }).__browserZuAlt) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
