import type { Session } from './types';

const BASE = 'https://freadeax.github.io/Lernstoff-Strukturierungs-Planer/';
/** Portable statement draft, no LRS connection or certification is implied. */
export function xapiDraft(s: Session) {
  return s.events.map(e => ({
    id: `${s.id.slice(0, 24)}${e.id.toString(16).padStart(12, '0')}`,
    actor: { objectType: 'Agent', account: { homePage: BASE, name: `simulation-${s.id}` } },
    verb: { id: new URL(`praxis/verbs/${e.kind === 'state' && s.phase === 'finished' && e.id === s.events.at(-1)?.id ? 'finished' : e.kind}`, BASE).href, display: { 'de-DE': e.title } },
    object: { objectType: 'Activity', id: new URL(`praxis/scenarios/${encodeURIComponent(s.scenario.id)}`, BASE).href, definition: { name: { 'de-DE': s.scenario.title } } },
    context: { registration: s.id, extensions: {
      [new URL('praxis/extensions/simulation-seconds', BASE).href]: e.at,
      [new URL('praxis/extensions/setting', BASE).href]: s.scenario.setting,
      [new URL('praxis/extensions/scenario-version', BASE).href]: s.scenario.version,
      [new URL('praxis/extensions/event-id', BASE).href]: e.id,
    } },
    // Free-text notes are deliberately omitted from portable tracking statements.
  }));
}
