import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { sections } from '../data/sections';
import { useProgress } from './ProgressTracker';

export default function Sidebar() {
  const location = useLocation();
  const { getSectionProgress } = useProgress();
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  // Auto-expand section matching current route
  useEffect(() => {
    sections.forEach(s => {
      const isActive = s.lessons.some(l => location.pathname === l.path);
      if (isActive) setExpanded(prev => ({ ...prev, [s.id]: true }));
    });
  }, [location.pathname]);

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Search mode
  const searchLower = search.toLowerCase().trim();
  const searchResults = searchLower
    ? sections.flatMap(s => s.lessons
        .filter(l => l.title.toLowerCase().includes(searchLower))
        .map(l => ({ ...l, sectionIcon: s.icon, sectionLabel: s.label, path: l.path }))
      )
    : [];

  return (
    <div style={{
      width: 'var(--sidebar-width)', minWidth: 'var(--sidebar-width)',
      height: '100vh', background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'block', padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border-color)',
        textDecoration: 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '1.4rem' }}>📚</span>
          <span style={{
            fontWeight: 700, fontSize: '1rem',
            background: 'linear-gradient(135deg, #5b9cf6, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Dev Tutorials</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', paddingLeft: '1.9rem' }}>
          Learn · Practice · Master
        </div>
      </Link>

      {/* Search */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search lessons..."
          style={{
            width: '100%', background: 'var(--bg-card)',
            border: '1px solid var(--border-color)', borderRadius: '6px',
            padding: '0.4rem 0.75rem', color: 'var(--text-primary)',
            fontSize: '0.8rem', fontFamily: 'inherit', outline: 'none',
          }}
        />
      </div>

      {/* Sections or search results */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0' }}>
        {searchLower ? (
          <div>
            {searchResults.length === 0 && (
              <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No results</div>
            )}
            {searchResults.map(l => (
              <Link key={l.path} to={l.path} onClick={() => setSearch('')} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', textDecoration: 'none',
                color: location.pathname === l.path ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: location.pathname === l.path ? 'var(--bg-active)' : 'transparent',
                fontSize: '0.82rem',
              }}>
                <span>{l.sectionIcon}</span>
                <span style={{ flex: 1 }}>{l.title}</span>
              </Link>
            ))}
          </div>
        ) : (
          sections.map(s => {
            const progress = getSectionProgress(s.id, s.lessons.length);
            const isOpen = !!expanded[s.id];
            const activeInSection = s.lessons.some(l => location.pathname === l.path);
            return (
              <div key={s.id}>
                <button onClick={() => toggle(s.id)} style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: '0.5rem', padding: '0.6rem 1rem',
                  background: activeInSection ? 'var(--bg-active)' : 'transparent',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  color: 'var(--text-primary)', fontFamily: 'inherit',
                  fontSize: '0.82rem', fontWeight: 500,
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (!activeInSection) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!activeInSection) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  <span style={{
                    fontSize: '0.65rem', color: 'var(--text-muted)',
                    background: 'var(--bg-card)', padding: '1px 6px', borderRadius: '10px',
                    marginRight: '0.25rem',
                  }}>{progress}/{s.lessons.length}</span>
                  <span style={{
                    fontSize: '0.6rem', color: 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}>▼</span>
                </button>
                {isOpen && (
                  <div style={{ borderLeft: `2px solid ${s.color}20`, marginLeft: '1.5rem' }}>
                    {s.lessons.map((l, i) => {
                      const isActive = location.pathname === l.path;
                      return (
                        <Link key={l.id} to={l.path} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.4rem 0.75rem',
                          textDecoration: 'none',
                          color: isActive ? s.color : 'var(--text-secondary)',
                          background: isActive ? `${s.color}15` : 'transparent',
                          borderRight: isActive ? `2px solid ${s.color}` : '2px solid transparent',
                          fontSize: '0.8rem', transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                        >
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', minWidth: '18px' }}>
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {l.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)',
        fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center',
      }}>
        ⚡ Built with React + Vite
      </div>
    </div>
  );
}
