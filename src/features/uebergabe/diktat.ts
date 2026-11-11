// Spracheingabe über die Web Speech API (Safari/iOS: webkitSpeechRecognition).
// Fehlt sie oder ist sie gesperrt (z. B. in manchen Home-Bildschirm-Apps), bleibt die Diktiertaste der Tastatur.
// Datenschutz: Wo der Browser Erkennung auf dem Gerät anbietet (processLocally), wird sie erzwungen.
// Sonst kann die Aufnahme an den Spracherkennungsdienst des Herstellers gehen; das muss vor dem
// ersten Diktat einmal bestätigt werden.
import { useEffect, useRef, useState } from 'react';

interface Erkennung {
  lang: string; continuous: boolean; interimResults: boolean; processLocally?: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type ErkennungKlasse = (new () => Erkennung) & { available?: (o: { langs: string[]; processLocally: boolean }) => Promise<string> };

function klasse(): ErkennungKlasse | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: ErkennungKlasse; webkitSpeechRecognition?: ErkennungKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const diktatMoeglich = () => !!klasse();

const HINWEIS = 'lernstoff.diktat.hinweisBestaetigt';
export function diktatHinweisBestaetigt(): boolean {
  try { return localStorage.getItem(HINWEIS) === '1'; } catch { return false; }
}
export function bestaetigeDiktatHinweis() {
  try { localStorage.setItem(HINWEIS, '1'); } catch { /* privater Modus: dann eben jedes Mal */ }
}

/** Bietet der Browser deutsche Erkennung ganz auf dem Gerät an? */
export async function lokaleErkennungVerfuegbar(K: ErkennungKlasse | undefined = klasse()): Promise<boolean> {
  try { return !!K?.available && (await K.available({ langs: ['de-DE'], processLocally: true })) === 'available'; }
  catch { return false; }
}

const FEHLER: Record<string, string> = {
  'not-allowed': 'Mikrofon nicht erlaubt. Bitte in den Einstellungen freigeben oder die Diktiertaste der Tastatur nutzen.',
  'service-not-allowed': 'Spracherkennung ist hier gesperrt. Nutze die Diktiertaste (Mikrofon) der Tastatur.',
  'no-speech': 'Nichts gehört. Noch einmal versuchen?',
  'audio-capture': 'Kein Mikrofon gefunden.',
  network: 'Spracherkennung braucht hier eine Internetverbindung.',
};

/** Hängt erkannten Text über `onText` an. `zwischen` zeigt den noch nicht fertigen Teil. */
export function useDiktat(onText: (text: string) => void) {
  const [aktiv, setAktiv] = useState(false);
  const [zwischen, setZwischen] = useState('');
  const [fehler, setFehler] = useState('');
  const [lokal, setLokal] = useState(false);
  const [bestaetigt, setBestaetigt] = useState(diktatHinweisBestaetigt);
  const bestaetigtRef = useRef(bestaetigt);
  // Datenhinweis vor dem ersten Diktat, wenn die Erkennung nicht sicher auf dem Gerät läuft (Audit SEC-07)
  const [frage, setFrage] = useState(false);
  const ref = useRef<Erkennung | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => () => ref.current?.abort(), []);
  useEffect(() => { let aktiv = true; void lokaleErkennungVerfuegbar().then((l) => { if (aktiv) setLokal(l); }); return () => { aktiv = false; }; }, []);

  function start() {
    const K = klasse();
    if (!K) return;
    if (!bestaetigtRef.current && !lokal) { setFrage(true); return; }
    setFrage(false);
    setFehler('');
    const r = new K();
    r.lang = 'de-DE';
    r.continuous = true;
    r.interimResults = true;
    if (lokal) r.processLocally = true;
    r.onresult = (e) => {
      let z = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) cb.current(res[0].transcript.trim());
        else z += res[0].transcript;
      }
      setZwischen(z);
    };
    r.onerror = (e) => { if (e.error !== 'aborted') setFehler(FEHLER[e.error] ?? `Spracherkennung: ${e.error}`); };
    r.onend = () => { setAktiv(false); setZwischen(''); ref.current = null; };
    ref.current = r;
    try { r.start(); setAktiv(true); } catch { setFehler(FEHLER['service-not-allowed']!); }
  }

  function stop() { ref.current?.stop(); }

  function bestaetige() { bestaetigeDiktatHinweis(); bestaetigtRef.current = true; setBestaetigt(true); }
  function bestaetigeUndStarte() { bestaetige(); start(); }
  function frageSchliessen() { setFrage(false); }

  /** lokal: Erkennung läuft garantiert auf dem Gerät. bestaetigt: Hinweis zum Datenweg gesehen. */
  return { moeglich: diktatMoeglich(), aktiv, zwischen, fehler, start, stop, lokal, bestaetigt: bestaetigt || lokal, bestaetige, frage, bestaetigeUndStarte, frageSchliessen };
}
