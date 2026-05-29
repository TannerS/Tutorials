import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { sections, groups } from '../data/sections';
import type { Section } from '../data/types';
import { useProgress } from './ProgressTracker';

// Build a map of sectionId → group for fast lookup
const sectionGroupMap: Record<string, string> = {};
groups.forEach((g) => g.sectionIds.forEach((id) => { sectionGroupMap[id] = g.id; }));

export default function Sidebar() {
  const location = useLocation();
  const { getSectionProgress } = useProgress();
  const [search, setSearch] = useState('');

  // Which section is open (one at a time)
  const [expandedSection, setExpandedSection] = useState<string | null>(() => {
    const current = sections.find((s) => location.pathname.startsWith(`/${s.id}`));
    return current ? current.id : null;
  });

  // Which groups are open (all open by default)
  const [expandedGroups, setExpandedGroups] = useState(
    () => new Set(groups.map(g => g.id))
  );

  // Auto-expand current section + its group on navigation
  useEffect(() => {
    const current = sections.find(s => location.pathname.startsWith(`/${s.id}`));
    if (current) {
      setExpandedSection(current.id);
      const groupId = sectionGroupMap[current.id];
      if (groupId) {
        setExpandedGroups(prev => {
          if (prev.has(groupId)) return prev;
          return new Set([...prev, groupId]);
        });
      }
    }
  }, [location.pathname]);

  const toggleGroup = (groupId: string): void => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleSection = (sectionId: string): void => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  };

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
      {/* Logo */}
      <NavLink to="/" style={{ textDecoration: 'none' }}>
        <div style={{
          padding: '1.25rem',
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
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.25rem 0' }}>
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
          groups.map(group => {
            const isGroupOpen = expandedGroups.has(group.id);
            const groupSections: Section[] = group.sectionIds
              .map((id) => sections.find((s) => s.id === id))
              .filter((s): s is Section => s !== undefined);

            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '0.65rem 1rem 0.4rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    color: group.color,
                    borderTop: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem' }}>{group.icon}</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      {group.label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    transform: isGroupOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}>▶</span>
                </button>

                {/* Sections within group */}
                {isGroupOpen && groupSections.map(section => {
                  const isSectionOpen = expandedSection === section.id;
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
                          padding: '0.6rem 1rem 0.6rem 1.75rem',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1rem' }}>{section.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{section.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {completedCount > 0 && (
                            <span style={{
                              fontSize: '0.65rem',
                              color: section.color,
                              background: `${section.color}18`,
                              padding: '1px 5px',
                              borderRadius: '4px',
                            }}>
                              {completedCount}/{totalCount}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.65rem',
                            color: 'var(--text-muted)',
                            transform: isSectionOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease',
                          }}>▶</span>
                        </div>
                      </button>

                      {/* Lessons */}
                      {isSectionOpen && (
                        <div style={{ paddingBottom: '0.25rem' }}>
                          {section.lessons.map((lesson, idx) => (
                            <NavLink
                              key={lesson.id}
                              to={lesson.path}
                              style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 1rem 0.4rem 3.25rem',
                                fontSize: '0.8rem',
                                color: isActive ? section.color : 'var(--text-secondary)',
                                background: isActive ? 'var(--bg-active)' : 'none',
                                borderRight: isActive ? `2px solid ${section.color}` : '2px solid transparent',
                                textDecoration: 'none',
                                transition: 'all var(--transition)',
                              })}
                              onMouseEnter={e => {
                                if (!e.currentTarget.getAttribute('aria-current'))
                                  e.currentTarget.style.background = 'var(--bg-hover)';
                              }}
                              onMouseLeave={e => {
                                if (!e.currentTarget.getAttribute('aria-current'))
                                  e.currentTarget.style.background = 'none';
                              }}
                            >
                              <span style={{
                                fontSize: '0.62rem',
                                color: 'var(--text-muted)',
                                width: '1.1rem',
                                flexShrink: 0,
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
                })}
              </div>
            );
          })
        )}
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
