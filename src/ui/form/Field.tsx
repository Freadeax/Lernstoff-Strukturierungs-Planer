import { useId, useState, type ReactNode } from 'react';

interface ControlProps {
  id: string;
  name: string;
  required: boolean;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

/** Ein gemeinsamer Vertrag für sichtbare Labels, Hilfetexte und Feldfehler. */
export function Field({ label, name, hint, error, required = false, children }: {
  label: string; name: string; hint?: string; error?: string; required?: boolean;
  children: (props: ControlProps) => ReactNode;
}) {
  const id = useId();
  const described = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field form-field${error ? ' form-field--error' : ''}`}>
      <label htmlFor={id}>{label}{required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
      {children({ id, name, required, 'aria-invalid': !!error, 'aria-describedby': described })}
      {error && <p id={`${id}-error`} className="field-error" aria-live="polite">{error}</p>}
    </div>
  );
}

/** Fehler erst nach Verlassen des Feldes oder einem Speicherversuch zeigen. */
export function useFormFeedback(errors: Record<string, string>) {
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  return {
    touch: (name: string) => setTouched((prev) => new Set(prev).add(name)),
    error: (name: string) => submitted || touched.has(name) ? errors[name] : undefined,
    validate: (form: HTMLFormElement) => {
      setSubmitted(true);
      const first = Object.keys(errors).find((name) => errors[name]);
      if (!first) return true;
      const control = form.elements.namedItem(first);
      if (control instanceof HTMLElement) control.focus();
      else if (control instanceof RadioNodeList && control.item(0) instanceof HTMLElement) (control.item(0) as HTMLElement).focus();
      return false;
    },
  };
}
