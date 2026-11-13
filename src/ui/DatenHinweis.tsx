// Datenhinweis direkt am jeweiligen Schritt: was wohin geht, bevor es passiert.
// Ein Ort für alle Texte, damit Import, KI, Diktat und Teilen dieselbe Sprache sprechen.

export type DatenArt = 'import' | 'ki' | 'ki-bild' | 'diktat' | 'teilen' | 'abgabe' | 'rueckmeldung' | 'lehrer';

export const FIKTIV = 'Für SIS, Übergaben, Pflegeberichte und Wundbilder nur ausgedachte Übungsdaten verwenden. Auch Kürzel, geänderte Namen, Zimmernummern oder Fotos können auf echte Personen hinweisen.';

export const DATEN_TEXT: Record<DatenArt, { kurz: string; lang: string }> = {
  import: {
    kurz: 'Bleibt auf diesem Gerät.',
    lang: 'Text und gescannte Seiten werden in diesem Browser erkannt. Nur mit „Handschrift erkennen“ gehen Seitenbilder an Claude (Anthropic), nur mit dem Repo-Haken geht das Original an dein privates GitHub-Repository.',
  },
  ki: {
    kurz: 'Geht an Claude (Anthropic).',
    lang: 'Der benötigte Text wird mit deinem API-Schlüssel direkt aus dem Browser an die Claude-API von Anthropic gesendet. Dabei können API-Kosten entstehen.',
  },
  'ki-bild': {
    kurz: 'Bilder gehen an Claude (Anthropic).',
    lang: 'Die Seitenbilder werden mit deinem API-Schlüssel an die Claude-API von Anthropic gesendet, um die Handschrift zu lesen.',
  },
  diktat: {
    kurz: 'Spracherkennung des Browsers.',
    lang: 'Die Erkennung übernimmt dein Browser. Je nach Browser und Gerät wird die Aufnahme dafür an den Spracherkennungsdienst des Herstellers (z. B. Apple oder Google) gesendet.',
  },
  teilen: {
    kurz: 'Der Inhalt steckt im Link.',
    lang: 'Der Link enthält den Fall selbst, kodiert und komprimiert, aber nicht verschlüsselt. Wer den Link hat, kann ihn lesen, auch Programme, über die du ihn verschickst.',
  },
  abgabe: {
    kurz: 'Name und Antworten stecken im Code.',
    lang: 'Der Abgabe-Code enthält deinen Namen und deine Antworten, kodiert, aber weder verschlüsselt noch unterschrieben. Ein Kürzel oder Vorname reicht.',
  },
  rueckmeldung: {
    kurz: 'Name, Punkte und Kommentare stecken im Link.',
    lang: 'Der Rückmeldelink enthält Namen, Punkte, Kommentare und, wenn gewählt, die Note, kodiert, aber nicht verschlüsselt. Nur direkt an die betreffende Person schicken, nicht in eine Gruppe. Er ist nicht unterschrieben und ersetzt keine offizielle Notenmitteilung.',
  },
  lehrer: {
    kurz: 'Namen, Abgaben und Noten bleiben auf diesem Gerät.',
    lang: 'Der Lehrermodus speichert Klassenlisten, Abgaben und Bewertungen nur in diesem Browser und in Datensicherungen dieses Geräts. Nichts geht an einen Server. Nach Abschluss eines Kurses bitte die Daten exportieren und hier löschen.',
  },
};

export function DatenHinweis({ art, detail, fiktiv = true, className = '', kompakt = false }: { art: DatenArt; detail?: string; fiktiv?: boolean; className?: string; kompakt?: boolean }) {
  const t = DATEN_TEXT[art];
  // Kompakt: eine Zeile an Stellen, die sich wiederholen (z. B. je Frage); gleiche Bezeichnung wie die lange Fassung.
  if (kompakt) return <p className={`muted daten-hinweis daten-hinweis--kompakt ${className}`.trim()} role="note"><strong>{t.kurz}</strong>{detail ? ` ${detail}` : ''}</p>;
  return (
    <p className={`note daten-hinweis ${className}`.trim()} role="note">
      <strong>Datenhinweis: {t.kurz}</strong> {detail ? `${detail} ` : ''}{t.lang}{fiktiv ? ` ${FIKTIV}` : ''}
    </p>
  );
}
