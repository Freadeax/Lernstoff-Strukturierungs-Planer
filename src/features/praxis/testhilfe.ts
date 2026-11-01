// Nur für Tests: führt Befehle aus und beantwortet dabei auftauchende Entscheidungsmomente
// mit der besten Option. So bleiben Tests, die einfach Zeit vergehen lassen, unabhängig davon,
// wo im Verlauf ein Entscheidungsmoment steht.
import { dispatch as roh } from './engine';
import type { Command, Session } from './types';

export function entscheide(s: Session): Session {
  for (let guard = 0; s.open?.length && guard < 20; guard++) {
    const event = s.scenario.storyline!.find(e => e.id === s.open![0])!;
    s = roh(s, { type: 'choose', event: event.id, choice: event.choices!.find(c => c.best)!.id });
  }
  return s;
}

export function dispatch(s: Session, command: Command, commandId?: string): Session {
  if (command.type !== 'advance') return entscheide(roh(s, command, commandId));
  const ziel = s.time + Math.max(0, Math.floor(Number.isFinite(command.seconds) ? command.seconds : 0));
  let x = entscheide(roh(s, command, commandId));
  for (let guard = 0; x.time < ziel && x.phase === 'active' && guard < 50; guard++) x = entscheide(roh(x, { type: 'advance', seconds: ziel - x.time }));
  return x;
}
