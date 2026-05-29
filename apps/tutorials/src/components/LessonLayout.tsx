import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, type ReactNode } from 'react';
import ProgressTracker from './ProgressTracker';
import { TableOfContents } from '@tutorials/ui';

export interface LessonLink {
  path: string;
  label: string;
}

export interface LessonLayoutProps {
  title: string;
  sectionId: string;
  lessonIndex: number;
  children: ReactNode;
  prev?: LessonLink | null;
  next?: LessonLink | null;
}

export default function LessonLayout({
  title,
  sectionId,
  lessonIndex,
  children,
  prev,
  next,
}: LessonLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowLeft' && prev) {
        navigate(prev.path);
      } else if (e.key === 'ArrowRight' && next) {
        navigate(next.path);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next, navigate]);

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      <div ref={contentRef} style={{ maxWidth: '900px', flex: 1, minWidth: 0 }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 700,
          marginBottom: '0.25rem',
          background: 'linear-gradient(135deg, #5b9cf6, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {title}
        </h1>
        <div style={{
          height: '3px',
          width: '60px',
          background: 'linear-gradient(135deg, #5b9cf6, #a78bfa)',
          borderRadius: '2px',
          marginBottom: '2rem',
        }} />

        {children}

        <ProgressTracker sectionId={sectionId} lessonIndex={lessonIndex} />

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid #2a2e42',
        }}>
          {prev ? (
            <Link to={prev.path} style={{
              color: '#5b9cf6',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>← {prev.label}</Link>
          ) : <div />}
          {next ? (
            <Link to={next.path} style={{
              color: '#5b9cf6',
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>{next.label} →</Link>
          ) : <div />}
        </div>
      </div>

      <TableOfContents containerRef={contentRef} resetKey={location.pathname} />
    </div>
  );
}
