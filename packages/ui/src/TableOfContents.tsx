import { useEffect, useState, type RefObject } from 'react';

export interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface TableOfContentsProps {
  /** Container whose h2/h3 we should track. */
  containerRef: RefObject<HTMLElement | null>;
  /** Re-scan when this key changes (e.g. route path). */
  resetKey?: string;
}

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

export function TableOfContents({ containerRef, resetKey }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // Extract headings from container
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const nodes = root.querySelectorAll<HTMLElement>('h2, h3');
    const collected: TocHeading[] = [];
    nodes.forEach((node) => {
      const text = node.textContent?.trim();
      if (!text) return;
      if (!node.id) node.id = slugify(text);
      collected.push({
        id: node.id,
        text,
        level: node.tagName === 'H2' ? 2 : 3,
      });
    });
    setHeadings(collected);
    setActiveId(collected[0]?.id ?? '');
  }, [containerRef, resetKey]);

  // Scroll-spy via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0 && visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    headings.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside
      aria-label="Table of contents"
      style={{
        position: 'sticky',
        top: '2rem',
        width: '220px',
        flexShrink: 0,
        maxHeight: 'calc(100vh - 4rem)',
        overflow: 'auto',
        fontSize: '0.78rem',
        paddingLeft: '1rem',
        borderLeft: '1px solid var(--border-color, #2a2e42)',
      }}
    >
      <div style={{
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontSize: '0.7rem',
        color: 'var(--text-muted, #6b7090)',
        fontWeight: 700,
        marginBottom: '0.6rem',
      }}>
        On this page
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {headings.map((h) => {
          const isActive = h.id === activeId;
          return (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? '0.75rem' : 0 }}>
              <a
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  setActiveId(h.id);
                }}
                style={{
                  display: 'block',
                  color: isActive ? '#5b9cf6' : 'var(--text-secondary, #9399b2)',
                  textDecoration: 'none',
                  fontWeight: isActive ? 600 : 400,
                  borderLeft: isActive ? '2px solid #5b9cf6' : '2px solid transparent',
                  paddingLeft: '0.5rem',
                  lineHeight: 1.4,
                }}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default TableOfContents;
