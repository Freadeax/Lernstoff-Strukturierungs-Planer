import { useState } from 'react';
import { aufraeumen, dateiName, htmlZuMarkdown, titelAus } from './einfuegen';

/**
 * Kopierten Text als Dokument übernehmen. Aus Webseiten, Word oder OneNote eingefügter Text behält
 * Überschriften, Listen und Tabellen (als Markdown), damit Kapitel und Themen erkannt werden.
 */
export function TextEinfuegen({ disabled, onSpeichern }: { disabled: boolean; onSpeichern: (datei: File) => Promise<void> | void }) {
  const [text, setText] = useState('');
  const [titel, setTitel] = useState('');
  const [hinweis, setHinweis] = useState('');
  const vorschlag = titelAus(text);

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const html = e.clipboardData.getData('text/html');
    if (!html) return;
    const md = htmlZuMarkdown(html);
    if (!md) return;
    e.preventDefault();
    const el = e.currentTarget;
    const neu = `${text.slice(0, el.selectionStart)}${md}${text.slice(el.selectionEnd)}`;
    setText(neu);
    const n = (md.match(/^#{1,6} /gm) ?? []).length;
    setHinweis(n ? `Formatierung übernommen: ${n} ${n === 1 ? 'Überschrift' : 'Überschriften'} als Kapitel.` : 'Formatierung übernommen.');
  }

  async function speichern(e: React.FormEvent) {
    e.preventDefault();
    const inhalt = aufraeumen(text);
    if (inhalt.length < 20) return;
    await onSpeichern(new File([inhalt], dateiName(titel.trim() || vorschlag), { type: 'text/markdown' }));
    setText(''); setTitel(''); setHinweis('');
  }

  return (
    <details className="text-einfuegen">
      <summary><strong>Text einfügen statt Datei</strong> <span className="muted">aus Webseite, Word, PDF oder Notizen</span></summary>
      <form className="stack-2" onSubmit={speichern}>
        <label className="field">Titel
          <input value={titel} onChange={(e) => setTitel(e.target.value)} placeholder={vorschlag || 'z. B. Mitschrift Herzinsuffizienz'} maxLength={80} disabled={disabled} />
        </label>
        <label className="field">Text
          <textarea rows={8} value={text} onChange={(e) => { setText(e.target.value); setHinweis(''); }} onPaste={onPaste} disabled={disabled}
            placeholder={'Hier einfügen (Strg/⌘ + V). Überschriften mit # werden zu Kapiteln:\n\n# Herzinsuffizienz\n## Symptome\n- Dyspnoe\n- Ödeme'} />
        </label>
        <p className="muted" aria-live="polite">{hinweis || `${text.trim() ? `${text.trim().split(/\s+/).length} Wörter` : 'Nichts verlässt das Gerät: Der Text wird lokal wie eine .md-Datei eingelesen.'}`}</p>
        <div className="row">
          <button type="submit" className="primary small" disabled={disabled || aufraeumen(text).length < 20}>Als Dokument übernehmen</button>
          {text && <button type="button" className="small ghost" onClick={() => { setText(''); setHinweis(''); }}>Leeren</button>}
        </div>
      </form>
    </details>
  );
}
