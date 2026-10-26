import type { ReactNode } from 'react';

export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description: string; action?: ReactNode;
}) {
  return <header className="page-heading">
    <div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-heading__description">{description}</p>}</div>
    {action && <div className="page-heading__action">{action}</div>}
  </header>;
}
