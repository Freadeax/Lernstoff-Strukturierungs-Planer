import { Icon } from '../../ui/icons';
import { emptyGroup, MAX_DEPTH, newCondition, OPERATORS, updateNode, type Condition, type Group, type Operator, type QueryField } from './query';

function ConditionRow({ c, fields, onChange, onRemove }: { c: Condition; fields: QueryField[]; onChange: (c: Condition) => void; onRemove: () => void }) {
  const field = fields.find((f) => f.key === c.field) ?? fields[0]!;
  const ops = (Object.keys(OPERATORS) as Operator[]).filter((o) => OPERATORS[o].types.includes(field.type));
  return (
    <li className="qb__cond">
      <label className="qb__not"><input type="checkbox" checked={!!c.not} onChange={(e) => onChange({ ...c, not: e.target.checked })} /> NICHT</label>
      <select aria-label="Feld" value={c.field} onChange={(e) => onChange({ ...newCondition(fields.find((f) => f.key === e.target.value)!), id: c.id })}>
        {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <select aria-label="Vergleich" value={c.op} onChange={(e) => onChange({ ...c, op: e.target.value as Operator })}>
        {ops.map((o) => <option key={o} value={o}>{OPERATORS[o].label}</option>)}
      </select>
      {c.op !== 'empty' && (field.type === 'enum'
        ? <select aria-label="Wert" value={c.value} onChange={(e) => onChange({ ...c, value: e.target.value })}>
            {field.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        : <input aria-label="Wert" type={field.type === 'number' ? 'number' : 'text'} inputMode={field.type === 'number' ? 'numeric' : undefined}
            value={c.value} onChange={(e) => onChange({ ...c, value: e.target.value })} placeholder="Wert" />)}
      <button type="button" className="icon small ghost" aria-label="Bedingung entfernen" onClick={onRemove}><Icon name="trash" size={16} /></button>
    </li>
  );
}

function GroupBox({ g, root, depth, fields, onRoot }: { g: Group; root: Group; depth: number; fields: QueryField[]; onRoot: (g: Group) => void }) {
  const set = (id: string, fn: Parameters<typeof updateNode>[2]) => onRoot(updateNode(root, id, fn));
  return (
    <fieldset className={`qb__group qb__group--d${depth}`}>
      <legend className="qb__legend">
        <span className="pills" role="radiogroup" aria-label="Verknüpfung">
          {(['and', 'or'] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={g.combinator === k} className="pill" aria-pressed={g.combinator === k}
              onClick={() => set(g.id, (n) => ({ ...(n as Group), combinator: k }))}>{k === 'and' ? 'UND' : 'ODER'}</button>
          ))}
        </span>
        <label className="qb__not"><input type="checkbox" checked={!!g.not} onChange={(e) => set(g.id, (n) => ({ ...(n as Group), not: e.target.checked }))} /> NICHT</label>
        {depth > 1 && <button type="button" className="small ghost" onClick={() => set(g.id, () => null)}>Gruppe entfernen</button>}
      </legend>
      <ul className="qb__list" role="list">
        {g.children.map((child) => child.kind === 'cond'
          ? <ConditionRow key={child.id} c={child} fields={fields} onChange={(c) => set(child.id, () => c)} onRemove={() => set(child.id, () => null)} />
          : <li key={child.id}><GroupBox g={child} root={root} depth={depth + 1} fields={fields} onRoot={onRoot} /></li>)}
      </ul>
      <div className="qb__add">
        <button type="button" className="small" onClick={() => set(g.id, (n) => ({ ...(n as Group), children: [...(n as Group).children, newCondition(fields[0]!)] }))}>
          <Icon name="plus" size={16} /> Bedingung
        </button>
        {depth < MAX_DEPTH && (
          <button type="button" className="small" onClick={() => set(g.id, (n) => ({ ...(n as Group), children: [...(n as Group).children, { ...emptyGroup(), children: [newCondition(fields[0]!)] }] }))}>
            <Icon name="plus" size={16} /> Gruppe
          </button>
        )}
      </div>
    </fieldset>
  );
}

/** Baukasten für verschachtelte Abfragen (bis drei Ebenen). */
export function QueryBuilder({ value, fields, onChange }: { value: Group; fields: QueryField[]; onChange: (g: Group) => void }) {
  return (
    <div className="qb">
      <GroupBox g={value} root={value} depth={1} fields={fields} onRoot={onChange} />
      {value.children.length > 0 && <button type="button" className="small ghost" onClick={() => onChange(emptyGroup())}>Alle Bedingungen löschen</button>}
    </div>
  );
}
