import { useEffect, useState } from 'react';
import { navigate } from '../../../ui/shell/router';
import { skripteZuThema } from '../store';
import type { Skript } from '../typen';

/** „Im Skript lesen“ für ein Thema, z. B. im Lernplan. Erscheint nur, wenn ein Skript zugeordnet ist. */
export function SkriptKnopf({ topicId, className = 'small' }: { topicId: string; className?: string }) {
  const [skripte, setSkripte] = useState<Skript[]>([]);
  useEffect(() => { let aktiv = true; skripteZuThema(topicId).then((s) => { if (aktiv) setSkripte(s); }).catch(() => undefined); return () => { aktiv = false; }; }, [topicId]);
  if (!skripte.length) return null;
  const ziel = skripte.length === 1 ? `/lernen/skript?id=${encodeURIComponent(skripte[0]!.id)}` : `/lernen/skript?thema=${encodeURIComponent(topicId)}`;
  return <button type="button" className={className} onClick={() => navigate(ziel)}>{skripte.length === 1 ? 'Im Skript lesen' : `In ${skripte.length} Skripten lesen`}</button>;
}
