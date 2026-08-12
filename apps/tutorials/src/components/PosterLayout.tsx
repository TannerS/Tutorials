import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import '../styles/poster.css';

export interface PosterLink {
  path: string;
  label: string;
}

interface PosterLayoutProps {
  accent: 'sky' | 'amber';
  eyebrow: string;
  title: string;
  tagline: string;
  meta: string[];
  footerLabel: string;
  pageLabel: string;
  prev?: PosterLink | null;
  next?: PosterLink | null;
  children: ReactNode;
}

export default function PosterLayout({
  accent, eyebrow, title, tagline, meta, footerLabel, pageLabel, prev, next, children,
}: PosterLayoutProps) {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft' && prev) navigate(prev.path);
      else if (e.key === 'ArrowRight' && next) navigate(next.path);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next, navigate]);

  return (
    <div style={{ maxWidth: '980px' }}>
      <div className="poster-sheet" data-accent={accent} data-mode={mode}>
        <div className="poster-toggle-bar">
          <button
            type="button"
            className="poster-toggle-btn"
            onClick={() => setMode((m) => (m === 'light' ? 'dark' : 'light'))}
          >
            {mode === 'light' ? '● Dark mode' : '○ Light mode (B&W printer)'}
          </button>
        </div>

        <header className="poster-band">
          <div>
            <p className="poster-eyebrow">{eyebrow}</p>
            <h2 className="poster-title">{title}</h2>
            <p className="poster-tag">{tagline}</p>
          </div>
          <div className="poster-meta">
            {meta.map((m) => (
              <span className="poster-chip accent" key={m}>{m}</span>
            ))}
          </div>
        </header>

        <main className="poster-main">
          <div className="poster-grid">{children}</div>
        </main>

        <footer className="poster-foot">
          <span>{footerLabel}</span>
          <span>{pageLabel}</span>
        </footer>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #2a2e42',
      }}>
        {prev ? (
          <Link to={prev.path} style={{ color: '#5b9cf6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ← {prev.label}
          </Link>
        ) : <div />}
        {next ? (
          <Link to={next.path} style={{ color: '#5b9cf6', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {next.label} →
          </Link>
        ) : <div />}
      </div>
    </div>
  );
}
