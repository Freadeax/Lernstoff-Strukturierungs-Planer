// Spracheingabe über die Web Speech API (Safari/iOS: webkitSpeechRecognition).
// Fehlt sie oder ist sie gesperrt (z. B. in manchen Home-Bildschirm-Apps), bleibt die Diktiertaste der Tastatur.
import { useEffect, useRef, useState } from 'react';

interface Erkennung {
  lang: string; continuous: boolean; interimResults: boolean;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type ErkennungKlasse = new () => Erkennung;

function klasse(): ErkennungKlasse | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: ErkennungKlasse; webkitSpeechRecognition?: ErkennungKlasse };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export const diktatMoeglich = () => !!klasse();

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
  const ref = useRef<Erkennung | null>(null);
  const cb = useRef(onText);
  cb.current = onText;

  useEffect(() => () => ref.current?.abort(), []);

  function start() {
    const K = klasse();
    if (!K) return;
    setFehler('');
    const r = new K();
    r.lang = 'de-DE';
    r.continuous = true;
    r.interimResults = true;
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

  return { moeglich: diktatMoeglich(), aktiv, zwischen, fehler, start, stop };
}
