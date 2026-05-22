import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProgressTracker from './ProgressTracker';

export default function LessonLayout({ title, sectionId, lessonIndex, children, prev, next }) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tag)) return;
      if (e.key === 'ArrowLeft' && prev) navigate(prev.path);
      if (e.key === 'ArrowRight' && next) navigate(next.path);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next, navigate]);

  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #5b9cf6, #a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', fontSize: '2rem', fontWeight: 700,
          marginBottom: '0.5rem',
        }}>{title}</h1>
        <div style={{
          width: '60px', height: '3px',
          background: 'linear-gradient(90deg, #5b9cf6, #a78bfa)',
          borderRadius: '2px',
        }} />
      </div>

      {/* Content */}
      {children}

      {/* Progress + Nav */}
      <ProgressTracker sectionId={sectionId} lessonIndex={lessonIndex} />

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #2a2e42',
        gap: '1rem',
      }}>
        <div>
          {prev && (
            <Link to={prev.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: '#9399b2', padding: '0.5rem 1rem',
              border: '1px solid #2a2e42', borderRadius: '8px',
              transition: 'all 0.2s ease', fontSize: '0.9rem',
              textDecoration: 'none',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e4e6f0'; e.currentTarget.style.borderColor = '#5b9cf6'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9399b2'; e.currentTarget.style.borderColor = '#2a2e42'; }}
            >
              ← {prev.label}
            </Link>
          )}
        </div>
        <div>
          {next && (
            <Link to={next.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              color: '#9399b2', padding: '0.5rem 1rem',
              border: '1px solid #2a2e42', borderRadius: '8px',
              transition: 'all 0.2s ease', fontSize: '0.9rem',
              textDecoration: 'none',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e4e6f0'; e.currentTarget.style.borderColor = '#5b9cf6'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9399b2'; e.currentTarget.style.borderColor = '#2a2e42'; }}
            >
              {next.label} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
