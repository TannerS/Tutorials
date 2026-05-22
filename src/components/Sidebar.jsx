import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { sections } from '../data/sections';
import { useProgress } from './ProgressTracker';

export default function Sidebar() {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    const current = sections.find(s => location.pathname.startsWith(`/${s.id}`));
    return current ? current.id : sections[0].id;
  });
  const [search, setSearch] = useState('');
  const { getSectionProgress } = useProgress();

  // Auto-expand current section on route change
  useEffect(() => {
    const current = sections.find(s => location.pathname.startsWith(`/${s.id}`));
    if (current) {
      setExpanded(current.id);
    }
  }, [location.pathname]);

  const toggleSection = (id) => {
    setExpanded(prev => prev === id ? null : id);
  };

  // Filter lessons for search
  const searchResults = search.trim()
    ? sections.flatMap(section =>
        section.lessons
          .filter(lesson => lesson.title.toLowerCase().includes(search.toLowerCase()))
          .map(lesson => ({ ...lesson, sectionIcon: section.icon, sectionColor: section.color }))
      )
    : [];

  return (
    <nav style={{
      width: 'var(--sidebar-width)',
      minWidth: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo / Header */}
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <div style={{
          padding: '1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>📚</span>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #5b9cf6, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Dev Tutorials
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Learn • Practice • Master
            </div>
          </div>
        </div>
      </NavLink>

      {/* Search */}
      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
        <input
          type="text"
          placeholder="Search lessons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            background: 'var(--bg-hover)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '0.82rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Sections */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem 0' }}>
        {search.trim() ? (
          <div>
            {searchResults.length === 0 && (
              <div style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No results found
              </div>
            )}
            {searchResults.map(lesson => (
              <NavLink
                key={lesson.path}
                to={lesson.path}
                onClick={() => setSearch('')}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.82rem',
                  color: isActive ? lesson.sectionColor : 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'all var(--transition)',
                })}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ fontSize: '1rem' }}>{lesson.sectionIcon}</span>
                {lesson.title}
              </NavLink>
            ))}
          </div>
        ) : (
          sections.map(section => {
          const isExpanded = expanded === section.id;
          const completedCount = getSectionProgress(section.id, section.lessons.length);
          const totalCount = section.lessons.length;

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{section.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{section.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {completedCount > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: section.color,
                      background: `${section.color}15`,
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {completedCount}/{totalCount}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}>▶</span>
                </div>
              </button>

              {isExpanded && (
                <div style={{ paddingBottom: '0.5rem' }}>
                  {section.lessons.map((lesson, idx) => (
                    <NavLink
                      key={lesson.id}
                      to={lesson.path}
                      style={({ isActive }) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.45rem 1.25rem 0.45rem 3rem',
                        fontSize: '0.82rem',
                        color: isActive ? section.color : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-active)' : 'none',
                        borderRight: isActive ? `2px solid ${section.color}` : '2px solid transparent',
                        textDecoration: 'none',
                        transition: 'all var(--transition)',
                      })}
                      onMouseEnter={e => {
                        if (!e.currentTarget.classList.contains('active'))
                          e.currentTarget.style.background = 'var(--bg-hover)';
                      }}
                      onMouseLeave={e => {
                        if (!e.currentTarget.classList.contains('active'))
                          e.currentTarget.style.background = 'none';
                      }}
                    >
                      <span style={{ 
                        fontSize: '0.65rem', 
                        color: 'var(--text-muted)',
                        width: '1.25rem',
                      }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {lesson.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        }))
        }
      </div>

      {/* Footer */}
      <div style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--border-color)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Built with React + Vite ⚡
      </div>
    </nav>
  );
}
