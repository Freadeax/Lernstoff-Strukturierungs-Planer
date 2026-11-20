import { Icon } from '../icons';
import { THEMEN_ANSICHTEN } from './nav';

const KURZ: Record<string, string> = { themen: 'Liste', ce: 'Nach CE', landkarte: 'Landkarte', board: 'Themenboard', faecher: 'Fächer', mindmap: 'Mindmaps' };

/** Umschalter über den Ansichten der Themen (Audit U-1): im Menü steht nur „Themen“, hier wechselst du die Sicht. */
export function ThemenAnsichten({ path }: { path: string }) {
  return (
    <nav className="themen-ansichten" aria-label="Ansichten der Themen">
      {THEMEN_ANSICHTEN.map((a) => {
        const aktiv = a.path === path;
        return <a key={a.id} href={`#${a.path}`} className={`themen-ansichten__link${aktiv ? ' is-aktiv' : ''}`} aria-current={aktiv ? 'page' : undefined}>
          {a.icon && <Icon name={a.icon} size={16} />}<span>{KURZ[a.id] ?? a.label}</span>
        </a>;
      })}
    </nav>
  );
}
