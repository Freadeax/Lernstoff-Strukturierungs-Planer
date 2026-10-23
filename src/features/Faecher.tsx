import { modules } from '../modules/registry';

export function Faecher() {
  return (
    <section>
      <h2>Fächer</h2>
      {modules.map((m) => (
        <div key={m.id} className="card">
          <h3>{m.name}</h3>
          <ul>
            {m.subjects.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
