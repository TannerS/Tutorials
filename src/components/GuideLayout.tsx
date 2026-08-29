import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hasModifier, isTypingTarget } from './keyboardNav';
import '../styles/guide.css';

export interface GuideLink {
  path: string;
  label: string;
}

interface GuideLayoutProps {
  /** Big word in the masthead, e.g. "T-SQL". */
  title: string;
  /** Smaller coloured word beside it. */
  kicker?: string;
  /** One line of context under the masthead. */
  tagline: string;
  glyph?: string;
  /** Chips on the right: version, scope, panel count. */
  meta?: string[];
  /** "1 / 3" page marker, as on multi-page printed sheets. */
  page?: string;
  footer?: string;
  prev?: GuideLink | null;
  next?: GuideLink | null;
  children: ReactNode;
}

/**
 * A printed-cheat-sheet page: dark ground, bold masthead, and a dense grid of
 * colour-accented panels.
 *
 * Like PosterLayout, the sheet owns its own colour tokens instead of inheriting
 * the site theme — a field guide should look the same wherever it is viewed, and
 * the reference sheets this imitates are all dark. The toggle exists for printing.
 */
export default function GuideLayout({
  title, kicker = 'FIELD GUIDE', tagline, glyph, meta = [], page, footer, prev, next, children,
}: GuideLayoutProps) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget() || hasModifier(e) || e.defaultPrevented) return;
      if (e.key === 'ArrowLeft' && prev) { e.preventDefault(); navigate(prev.path); }
      else if (e.key === 'ArrowRight' && next) { e.preventDefault(); navigate(next.path); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, navigate]);

  return (
    <div className="guide-sheet" data-mode={mode}>
      <header className="guide-mast">
        {glyph && <span aria-hidden="true" style={{ fontSize: '2.1rem', lineHeight: 1 }}>{glyph}</span>}
        <div style={{ flex: '1 1 16rem', minWidth: 0 }}>
          <h1>
            {title} <span className="kicker">{kicker}</span>
          </h1>
          <p>{tagline}</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
          {page && <span className="guide-chip page">{page}</span>}
          {meta.map(m => <span key={m} className="guide-chip">{m}</span>)}
          <button
            type="button"
            className="guide-toggle"
            onClick={() => setMode(m => (m === 'dark' ? 'light' : 'dark'))}
          >
            {mode === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <div className="guide-grid">{children}</div>

      {footer && <p className="guide-foot">{footer}</p>}

      {(prev || next) && (
        <nav className="guide-nav">
          <span>{prev && <a href={prev.path}>← {prev.label}</a>}</span>
          <span>{next && <a href={next.path}>{next.label} →</a>}</span>
        </nav>
      )}
    </div>
  );
}
