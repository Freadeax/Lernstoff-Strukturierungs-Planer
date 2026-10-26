import { useEffect, useId, useRef, useState } from 'react';
import { getApiKey } from '../../core/settings';
import { Widget } from '../../ui/widget/Widget';
import { useWidgetData } from '../../ui/widget/useWidgetData';
import { Bone } from '../../ui/widget/states';
import type { SyncBadge, WidgetHostProps, WidgetLifecycle, WidgetState } from '../../ui/widget/types';
import { useStore, storage } from '../../ui/lib/store';
import { useNow } from '../../ui/lib/hooks';
import { relativeTime } from '../../ui/lib/time';
import { Icon } from '../../ui/icons';
import { navigate } from '../../ui/shell/router';
import { session } from '../../ui/shell/session';
import { notify } from '../../ui/shell/notifications';
import { getModule } from '../../modules/registry';
import { ACCEPT, SUPPORTED, importiereDateien, type ImportErgebnis } from '../../features/dokumente/importiere';
import { Field } from '../../ui/form/Field';

const STEPS = ['Fach und Art', 'Dateien', 'Prüfen und importieren', 'Ergebnis'] as const;
const DRAFT_KEY = 'lernstoff.importDraft';
const BIG = 50 * 1024 * 1024;

interface Draft { subjectId: string; handwritten: boolean; step: number; savedAt: string }
export interface WizardData { subjects: Array<{ id: string; name: string; code?: string }>; hasKey: boolean; draft: Draft | null }

/** Validierung je Abschnitt, rein und testbar. */
export function validateStep(step: number, v: { subjectId: string; handwritten: boolean; hasKey: boolean; files: File[] }): string[] {
  const e: string[] = [];
  if (step === 0) {
    if (!v.subjectId) e.push('Bitte ein Fach wählen.');
    if (v.handwritten && !v.hasKey) e.push('Für Handschrift wird der API-Schlüssel gebraucht (Einstellungen).');
  }
  if (step === 1) {
    if (!v.files.length) e.push('Bitte mindestens eine Datei auswählen.');
    const bad = v.files.filter((f) => !SUPPORTED.test(f.name));
    if (bad.length) e.push(`Nicht unterstützt: ${bad.map((f) => f.name).join(', ')}`);
  }
  return e;
}

const size = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function WizardSkeleton() {
  return (
    <div className="wizard">
      <div className="stepper">{STEPS.map((s) => <Bone key={s} h="var(--control-h)" r="var(--radius-pill)" />)}</div>
      <div className="stack-2"><Bone w="30%" /><Bone h="var(--control-h)" r="var(--radius-sm)" /><Bone w="50%" /><Bone h="var(--control-h)" r="var(--radius-sm)" /></div>
    </div>
  );
}

function WizardBody({ data, partial }: { data: WizardData; partial: boolean }) {
  const now = useNow(15_000);
  const [step, setStep] = useState(data.draft?.step ? Math.min(data.draft.step, 1) : 0);
  const [subjectId, setSubjectId] = useState(data.draft?.subjectId ?? data.subjects[0]?.id ?? '');
  const [handwritten, setHandwritten] = useState(data.draft?.handwritten ?? false);
  const [files, setFiles] = useState<File[]>([]);
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<{ name: string; index: number } | null>(null);
  const [results, setResults] = useState<ImportErgebnis[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(data.draft?.savedAt ?? null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const errId = useId();

  const values = { subjectId, handwritten, hasKey: data.hasKey, files };
  const errors = STEPS.map((_, i) => validateStep(i, values));
  const done = results.length > 0;

  // Automatisch speichern (ohne Dateien: Browser können Dateiauswahlen nicht dauerhaft halten).
  useEffect(() => {
    if (done) { storage.remove(DRAFT_KEY); return; }
    const t = setTimeout(() => {
      const at = new Date().toISOString();
      storage.write(DRAFT_KEY, { subjectId, handwritten, step: Math.min(step, 1), savedAt: at } satisfies Draft);
      setSavedAt(at);
    }, 500);
    return () => clearTimeout(t);
  }, [subjectId, handwritten, step, done]);
  useEffect(() => { headRef.current?.focus(); }, [step]);

  const go = (target: number) => {
    setTouched((t) => new Set(t).add(step));
    if (target > step && errors.slice(0, target).some((e, i) => i < 3 && e.length)) return;
    setStep(target);
  };

  async function run() {
    setProgress({ name: files[0]?.name ?? '', index: 0 });
    try {
      const r = await importiereDateien(files, { subjectId, handwritten, onProgress: (name, index) => setProgress({ name, index }) });
      setResults(r);
      const ok = r.filter((x) => !x.error).length;
      notify(ok === r.length ? 'info' : 'warning', `Import fertig: ${ok} von ${r.length} Dateien`);
      storage.remove(DRAFT_KEY);
      setStep(3);
    } finally {
      setProgress(null);
    }
  }

  function reset() {
    setFiles([]); setResults([]); setTouched(new Set()); setStep(0);
  }

  const stepState = (i: number) => (i === step ? 'current' : done || (i < step && !errors[i]!.length) ? 'valid' : touched.has(i) && errors[i]!.length ? 'invalid' : 'todo');
  const subjectName = data.subjects.find((s) => s.id === subjectId)?.name;

  return (
    <div className="wizard">
      <ol className="stepper" aria-label="Schritte">
        {STEPS.map((label, i) => {
          const st = stepState(i);
          const reachable = !progress && !done ? i <= step || errors.slice(0, i).every((e) => !e.length) : i === 3 && done;
          return (
            <li key={label} className={`stepper__item is-${st}`}>
              <button type="button" className="stepper__btn" aria-current={i === step ? 'step' : undefined} disabled={!reachable || i === 3}
                onClick={() => go(i)}>
                <span className="stepper__num" aria-hidden="true">{st === 'valid' ? <Icon name="check" size={14} /> : st === 'invalid' ? '!' : i + 1}</span>
                <span className="stepper__label">{label}</span>
                <span className="visually-hidden">{st === 'valid' ? ', erledigt' : st === 'invalid' ? ', fehlerhaft' : ''}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="wizard-progress"><span>Schritt {step + 1} von {STEPS.length}</span><progress max={STEPS.length} value={step + 1} aria-label={`Importschritt ${step + 1} von ${STEPS.length}`} /></div>

      <div className="wizard__panel">
        <h4 ref={headRef} tabIndex={-1} className="wizard__title">{STEPS[step]}</h4>

        {step === 0 && (
          <>
            <p className="form-section__description">Wähle, wohin dein Material gehört. Gedruckter Text wird direkt auf deinem Gerät erkannt.</p>
            <p className="required-note">Mit <span className="required-mark">*</span> markierte Felder sind erforderlich.</p>
            <Field label="Fach für dein Material" name="subjectId" required hint="Dein zuletzt gewähltes Fach wird als Entwurf gespeichert."
              error={touched.has(0) && !subjectId ? 'Wähle ein Fach, damit du dein Material später wiederfindest.' : undefined}>
              {(props) => <select {...props} value={subjectId} onBlur={() => setTouched((t) => new Set(t).add(0))} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">Bitte wählen</option>
                {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} · ` : ''}{s.name}</option>)}
              </select>}
            </Field>
            <label className="check">
              <input type="checkbox" checked={handwritten} onChange={(e) => setHandwritten(e.target.checked)} />
              <span><strong>Handschrift erkennen</strong><br />Nur aktivieren, wenn dein Material handschriftliche Notizen enthält. Die Bilder werden dafür an Claude gesendet. Verwende keine Patientendaten.</span>
            </label>
            {handwritten && !data.hasKey && <p className="note warn">Ohne API-Schlüssel geht Handschrift nicht. <button type="button" className="link" onClick={() => navigate('/einstellungen')}>Zu den Einstellungen</button></p>}
          </>
        )}

        {step === 1 && (
          <>
            <p className="form-section__description">Wähle eine oder mehrere Dateien. Im nächsten Schritt prüfst du deine Auswahl, bevor der Import startet.</p>
            <label className="upload">
              <input type="file" multiple accept={ACCEPT} aria-describedby={touched.has(1) && errors[1]!.length ? errId : undefined} aria-invalid={touched.has(1) && !!errors[1]!.length} onBlur={() => setTouched((t) => new Set(t).add(1))} onChange={(e) => { const picked = Array.from(e.target.files ?? []); setFiles((f) => [...f, ...picked]); setTouched((t) => new Set(t).add(1)); e.target.value = ''; }} />
              <Icon name="upload" size={28} />
              <strong>Dateien auswählen <span className="required-mark" aria-hidden="true">*</span></strong>
              <small>PDF, Word, PowerPoint, TXT, Markdown oder Foto (PNG, JPEG, WebP)</small>
            </label>
            {files.length > 0 && (
              <ul className="filelist" role="list">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className={SUPPORTED.test(f.name) ? '' : 'is-bad'}>
                    <span className="filelist__name">{f.name}</span>
                    <span className="muted">{size(f.size)}{f.size > BIG ? ' · groß, Import dauert länger' : ''}</span>
                    <button type="button" className="icon small ghost" aria-label={`${f.name} entfernen`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><Icon name="close" size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <dl className="summary-list">
              <dt>Fach</dt><dd>{subjectName ?? '–'}</dd>
              <dt>Handschrift</dt><dd>{handwritten ? 'ja, Texterkennung über Claude' : 'nein'}</dd>
              <dt>Dateien</dt><dd>{files.map((f) => f.name).join(', ')}</dd>
            </dl>
            {progress
              ? <div className="note" role="status" aria-live="polite">Lese {progress.name} … ({progress.index + 1} von {files.length})
                  <progress max={files.length} value={progress.index} aria-label="Fortschritt" /></div>
              : <p className="muted">Gescannte Seiten werden auf dem Gerät erkannt, das kann pro Seite einige Sekunden dauern.</p>}
          </>
        )}

        {step === 3 && (
          <div className="stack-2">
            {results.map((r) => (
              <div key={r.name} className={r.error ? 'note warn' : 'note ok'}>
                <strong>{r.name}</strong>
                {r.error && <div>{r.error}</div>}
                {r.report && !r.error && (
                  <div>
                    {r.report.pages} Seiten{r.report.ocrPages ? `, davon ${r.report.ocrPages} per Texterkennung` : ''}
                    {r.report.chapters.length ? `, ${r.report.chapters.length} Kapitel` : ''}
                    {r.report.warnings.map((w) => <div key={w}>⚠ {w}</div>)}
                    {r.report.matches.map((m) => <div key={m.otherDocumentId}>↔ {m.otherTitle}: {m.recommendation}</div>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {touched.has(step) && errors[step]!.length > 0 && (
          <ul id={errId} className="field-error" role="alert">{errors[step]!.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
      </div>

      <div className="wizard__nav">
        {step > 0 && step < 3 && <button type="button" onClick={() => setStep(step - 1)} disabled={!!progress}>Zurück</button>}
        {step < 2 && <button type="button" className="primary" onClick={() => go(step + 1)}>Weiter</button>}
        {step === 2 && <button type="button" className="primary" onClick={run} disabled={!!progress || errors.some((e) => e.length)}>{progress ? 'Importiere …' : `${files.length} ${files.length === 1 ? 'Datei' : 'Dateien'} importieren`}</button>}
        {step === 3 && <>
          <button type="button" onClick={reset}>Weitere Dateien</button>
          <button type="button" className="primary" onClick={() => navigate('/material/zusammenfassen')}>Zusammenfassen</button>
        </>}
        <span className="wizard__saved muted" aria-live="off">
          {partial && step < 2 ? 'Entwurf wiederhergestellt · ' : ''}{savedAt && !done ? `Entwurf gespeichert ${relativeTime(savedAt, now)}` : ''}
        </span>
      </div>
    </div>
  );
}

export function WizardView({ id, state, badge, onRetry, onHide, lifecycle }: {
  id: string; state: WidgetState<WizardData>; badge: SyncBadge; onRetry: () => void; onHide?: () => void; lifecycle?: WidgetLifecycle;
}) {
  return (
    <Widget id={id} state={state} onRetry={onRetry} skeleton={<WizardSkeleton />} lifecycle={lifecycle}
      header={{ title: 'Import-Assistent', subtitle: 'Lernmaterial in vier Schritten übernehmen, mit automatisch gespeichertem Entwurf', badge, onHide }}
      body={{ minHeight: 'var(--wizard-body-min)', maxHeight: 'none' }}
      empty={{ illustration: 'dokumente', title: 'Keine Fächer verfügbar', message: 'Ohne Fachmodul kann Material keinem Fach zugeordnet werden.', cta: { label: 'Fächer ansehen', href: '/lernen/faecher' } }}>
      {(data, { partial }) => <WizardBody data={data} partial={partial} />}
    </Widget>
  );
}

export default function ImportWizard({ id, onHide, lifecycle }: WidgetHostProps) {
  const moduleId = useStore(session, (s) => s.moduleId);
  const { state, retry, badge } = useWidgetData<WizardData>({
    live: false, deps: [moduleId],
    load: () => ({ subjects: getModule(moduleId)?.subjects ?? [], hasKey: !!getApiKey(), draft: storage.read<Draft | null>(DRAFT_KEY, null) }),
    isEmpty: (d) => d.subjects.length === 0,
    isPartial: (d) => !!d.draft && 'Dein Entwurf wurde wiederhergestellt. Dateien bitte neu auswählen, Browser können sie nicht zwischenspeichern.',
  });
  return <WizardView id={id} state={state} badge={badge} onRetry={retry} onHide={onHide} lifecycle={lifecycle} />;
}
