import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';

export interface CommandItem {
  id: string;
  title: string;
  /** Optional section label shown to the right of the title. */
  group?: string;
  /** Emoji or single-character icon. */
  icon?: string;
  /** Color used for active highlight. */
  color?: string;
  /** Extra search terms (synonyms). */
  keywords?: string[];
  /** Action to run on Enter or click. */
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  items: CommandItem[];
  placeholder?: string;
}

const fuzzyScore = (query: string, item: CommandItem): number => {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const haystack = [
    item.title,
    item.group ?? '',
    ...(item.keywords ?? []),
  ].join(' ').toLowerCase();

  if (haystack.includes(q)) {
    // earlier match = higher score
    return 1000 - haystack.indexOf(q);
  }

  // letter-by-letter subsequence match
  let qi = 0;
  for (let i = 0; i < haystack.length && qi < q.length; i++) {
    if (haystack[i] === q[qi]) qi++;
  }
  return qi === q.length ? 500 - (haystack.length - q.length) : -1;
};

export function CommandPalette({
  open,
  onClose,
  items,
  placeholder = 'Search lessons…',
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 50);
    return items
      .map((item) => ({ item, score: fuzzyScore(query, item) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
      .map((r) => r.item);
  }, [query, items]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Keep active item in view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const activeEl = list.children[active] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[active];
      if (item) {
        item.onSelect();
        onClose();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px, 92vw)',
          background: '#161822',
          border: '1px solid #2a2e42',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search"
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid #2a2e42',
            color: '#e4e6f0',
            fontSize: '1rem',
            padding: '1rem 1.25rem',
            outline: 'none',
          }}
        />

        <ul
          ref={listRef}
          role="listbox"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '0.25rem 0',
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          {results.length === 0 && (
            <li style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7090', fontSize: '0.85rem' }}>
              No matches
            </li>
          )}
          {results.map((item, idx) => {
            const isActive = idx === active;
            const color = item.color ?? '#5b9cf6';
            return (
              <li
                key={item.id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(idx)}
                onClick={() => {
                  item.onSelect();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.55rem 1.25rem',
                  cursor: 'pointer',
                  background: isActive ? '#1a1d2e' : 'transparent',
                  borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                  fontSize: '0.88rem',
                  color: '#e4e6f0',
                }}
              >
                {item.icon && <span style={{ fontSize: '1rem' }}>{item.icon}</span>}
                <span style={{ flex: 1 }}>{item.title}</span>
                {item.group && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#6b7090',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {item.group}
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <div style={{
          borderTop: '1px solid #2a2e42',
          padding: '0.5rem 1.25rem',
          fontSize: '0.7rem',
          color: '#6b7090',
          display: 'flex',
          gap: '1rem',
        }}>
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
