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
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  // Layout mounts this only while it's open, so mount === open. That's what
  // resets `query`/`active` between openings: the previous version returned
  // null while closed but stayed mounted, so it kept its state and had to
  // clear it from an effect on every open.
  useEffect(() => {
    if (!open) return;
    // Remember what had focus so closing can hand it back — without this,
    // dismissing the palette dropped focus onto <body> and a keyboard user had
    // to Tab in from the top of the document again.
    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      window.clearTimeout(focusTimer);
      restoreFocusTo.current?.focus?.();
    };
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

  // `active` is clamped against the current result list rather than reset from
  // an effect: an effect-driven reset renders one frame with a stale highlight
  // (and trips react-hooks/set-state-in-effect).
  const activeIndex = results.length === 0 ? -1 : Math.min(active, results.length - 1);

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
    if (!list || activeIndex < 0) return;
    const activeEl = list.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const activeOptionId = activeIndex >= 0 ? `cmdk-option-${activeIndex}` : undefined;

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(Math.min(activeIndex + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(Math.max(activeIndex - 1, 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(results.length - 1);
    } else if (e.key === 'Tab') {
      // The input is the only focusable control in the dialog, so a plain Tab
      // walked focus out to the page behind the overlay while the modal stayed
      // open — focus and the visible UI ended up in two different places.
      e.preventDefault();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[activeIndex];
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
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
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
          aria-label="Search lessons"
          // Without these the listbox was invisible to screen readers: the
          // highlighted row is tracked in React state, not DOM focus, so the
          // input has to advertise it via aria-activedescendant.
          role="combobox"
          aria-expanded
          aria-controls="cmdk-listbox"
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          autoComplete="off"
          spellCheck={false}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            padding: '1rem 1.25rem',
            outline: 'none',
          }}
        />

        <ul
          ref={listRef}
          id="cmdk-listbox"
          role="listbox"
          aria-label="Lesson results"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '0.25rem 0',
            maxHeight: '50vh',
            overflow: 'auto',
          }}
        >
          {results.length === 0 && (
            <li role="presentation" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matches
            </li>
          )}
          {results.map((item, idx) => {
            const isActive = idx === activeIndex;
            const color = item.color ?? 'var(--accent-blue)';
            return (
              <li
                key={item.id}
                id={`cmdk-option-${idx}`}
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
                  background: isActive ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: isActive ? `2px solid ${color}` : '2px solid transparent',
                  fontSize: '0.88rem',
                  color: 'var(--text-primary)',
                }}
              >
                {item.icon && <span style={{ fontSize: '1rem' }}>{item.icon}</span>}
                <span style={{ flex: 1 }}>{item.title}</span>
                {item.group && (
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
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
          borderTop: '1px solid var(--border-color)',
          padding: '0.5rem 1.25rem',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
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
