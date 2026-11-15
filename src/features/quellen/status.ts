// Aktualitätsstatus je Quelle: Muss ein Inhalt an eine neue Fassung angepasst werden? Ist die Quelle
// überhaupt schon einmal nachgesehen worden? Ist die nächste Prüfung fällig?
// Lokale Vermerke („heute nachgesehen, keine neue Fassung“) setzen nur die Erinnerung zurück. Einen
// offenen Abgleich können sie nicht schließen: dazu müssen Inhalte und Register im Code geändert werden.

import { istObjekt, storage } from '../../ui/lib/store';
import { ALLGEMEINE_STAENDE, type Nutzung } from './nutzung';
import { jahr, QUELLEN, type QuellenEintrag } from './register';

export type QuellenStatus = 'abgleich' | 'nie-geprueft' | 'faellig' | 'aktuell' | 'fest';

export const STATUS_LABEL: Record<QuellenStatus, string> = {
  abgleich: 'Neue Fassung: Inhalte abgleichen',
  'nie-geprueft': 'Noch nie nachgesehen',
  faellig: 'Erneut nachsehen',
  aktuell: 'Aktuell',
  fest: 'Originalquelle',
};
export const STATUS_RANG: Record<QuellenStatus, number> = { abgleich: 0, faellig: 1, 'nie-geprueft': 2, aktuell: 3, fest: 4 };
export const STATUS_TON: Record<QuellenStatus, 'kritisch' | 'warn' | 'neutral' | 'gut'> = {
  abgleich: 'kritisch', faellig: 'warn', 'nie-geprueft': 'warn', aktuell: 'gut', fest: 'neutral',
};

export interface Vermerk { id: string; datum: string; von?: string; notiz?: string }

export interface QuellenStand {
  eintrag: QuellenEintrag;
  status: QuellenStatus;
  nutzungen: Nutzung[];
  /** Inhalte, deren Quellenangabe älter ist als die neueste Fassung. */
  veraltet: Nutzung[];
  letztePruefung?: string;
  naechstePruefung?: string;
  vermerk?: Vermerk;
}

export function plusMonate(iso: string, monate: number): string {
  const [j, m, t] = iso.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1 + monate, 1));
  const letzterTag = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(t, letzterTag));
  return d.toISOString().slice(0, 10);
}

/** Stand einer Quelle für die Anzeige. `heute` als JJJJ-MM-TT. */
export function quellenStand(e: QuellenEintrag, nutzungen: readonly Nutzung[], heute: string, vermerke: readonly Vermerk[] = []): QuellenStand {
  const eigene = nutzungen.filter((n) => e.muster.test(n.quelle.titel));
  const neu = jahr(e.aktuell.stand);
  const veraltet = eigene.filter((n) => !ALLGEMEINE_STAENDE.test(n.quelle.stand) && jahr(n.quelle.stand) < neu);
  const appAlt = e.appStand !== undefined && jahr(e.appStand) < neu;
  const vermerk = vermerke.filter((v) => v.id === e.id).sort((a, b) => b.datum.localeCompare(a.datum))[0];
  const letztePruefung = [e.geprueftAm, vermerk?.datum].filter((d): d is string => !!d).sort().pop();
  const naechstePruefung = letztePruefung && !e.fest ? plusMonate(letztePruefung, e.intervallMonate) : undefined;
  const status: QuellenStatus =
    e.offen || veraltet.length || appAlt ? 'abgleich'
      : e.fest ? 'fest'
        : !letztePruefung ? 'nie-geprueft'
          : naechstePruefung && naechstePruefung <= heute ? 'faellig'
            : 'aktuell';
  return { eintrag: e, status, nutzungen: eigene, veraltet, letztePruefung, naechstePruefung, vermerk };
}

export function alleStaende(nutzungen: readonly Nutzung[], heute: string, vermerke: readonly Vermerk[] = []): QuellenStand[] {
  return QUELLEN.map((e) => quellenStand(e, nutzungen, heute, vermerke))
    .sort((a, b) => STATUS_RANG[a.status] - STATUS_RANG[b.status] || a.eintrag.titel.localeCompare(b.eintrag.titel, 'de'));
}

export function zaehle(staende: readonly QuellenStand[]): Record<QuellenStatus, number> {
  const z: Record<QuellenStatus, number> = { abgleich: 0, 'nie-geprueft': 0, faellig: 0, aktuell: 0, fest: 0 };
  for (const s of staende) z[s.status]++;
  return z;
}

// ---------- Lokale Vermerke ----------

const K_VERMERKE = 'lernstoff.quellen.vermerke';
const istVermerk = (v: unknown): boolean => istObjekt(v) && typeof v.id === 'string' && typeof v.datum === 'string';

export const ladeQuellenVermerke = (): Vermerk[] => storage.list<Vermerk>(K_VERMERKE, istVermerk);

export function setzeQuellenVermerk(v: Vermerk): Vermerk[] {
  const liste = [v, ...ladeQuellenVermerke().filter((x) => x.id !== v.id)];
  storage.write(K_VERMERKE, liste);
  return liste;
}

export function entferneQuellenVermerk(id: string): Vermerk[] {
  const liste = ladeQuellenVermerke().filter((x) => x.id !== id);
  storage.write(K_VERMERKE, liste);
  return liste;
}

/** Text zum Weitergeben, damit der Vermerk dauerhaft als `geprueftAm` ins Register kommt. */
export const quellenVermerkText = (s: QuellenStand) =>
  `Quellenprüfung Lernstoff-Planer: „${s.eintrag.titel}“ (${s.eintrag.id}) am ${s.vermerk?.datum ?? '?'} beim Herausgeber nachgesehen` +
  `${s.vermerk?.von ? ` von ${s.vermerk.von}` : ''}. Neueste Fassung laut Register: ${s.eintrag.aktuell.stand}.` +
  `${s.vermerk?.notiz ? ` Notiz: ${s.vermerk.notiz}` : ''}`;
