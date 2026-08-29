import type { ReactNode } from 'react';

export type GuideAccent = 'purple' | 'blue' | 'green' | 'amber' | 'pink' | 'cyan' | 'red';

interface GuidePanelProps {
  /** 1-based number shown in the header chip, like the printed sheets. */
  n?: number;
  title: string;
  accent?: GuideAccent;
  /** How many grid columns to span. Defaults to 1. */
  span?: 1 | 2 | 3;
  glyph?: string;
  children: ReactNode;
}

/**
 * One bordered, colour-accented block of a field guide — the direct analogue of a
 * numbered box on a printed cheat sheet. Content is deliberately open: a panel may
 * hold a definition list, a snippet, a small table, or a mix of all three.
 */
export default function GuidePanel({ n, title, accent = 'blue', span = 1, glyph, children }: GuidePanelProps) {
  return (
    <section className="guide-panel" data-accent={accent} style={{ gridColumn: `span ${span}` }}>
      <header>
        {n !== undefined && <span className="guide-num">{n}</span>}
        {glyph && <span aria-hidden="true">{glyph}</span>}
        <h3>{title}</h3>
      </header>
      <div className="guide-body">{children}</div>
    </section>
  );
}

/** A terse `term — definition` list; the densest way to spend vertical space. */
export function GuideDefs({ items }: { items: [string, string][] }) {
  return (
    <dl className="guide-defs">
      {items.map(([term, def]) => (
        <div key={term} style={{ display: 'contents' }}>
          <dt>{term}</dt>
          <dd>{def}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A compact snippet — deliberately not CodeBlock: no title bar, no chrome. */
export function GuideCode({ children }: { children: string }) {
  return (
    <pre className="guide-code">
      <code>{children}</code>
    </pre>
  );
}

/** A small comparison table. */
export function GuideTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="guide-table">
        <thead>
          <tr>{head.map(h => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One-line takeaways, the "rules" strip on a printed sheet. */
export function GuideRules({ items }: { items: string[] }) {
  return (
    <ul className="guide-rules">
      {items.map((t, i) => <li key={i}><span>{t}</span></li>)}
    </ul>
  );
}
