import { Outlet, useLocation, Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { sections } from '../data/sections';

function HomePage() {
  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
        background: 'linear-gradient(135deg, #5b9cf6, #a78bfa, #f472b6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Developer Tutorials
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Your interactive guide to Java, Spring Boot, React 19, SQL, SOLID Principles, and Design Patterns.
        Pick a section from the sidebar to get started.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
      }}>
        {sections.map(section => (
          <Link
            key={section.id}
            to={section.lessons[0].path}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '1.5rem',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = section.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${section.color}15`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '2rem' }}>{section.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                {section.label}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {section.lessons.length} lessons
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '3px',
              background: 'var(--border-color)',
              borderRadius: '2px',
              overflow: 'hidden',
              marginTop: 'auto',
            }}>
              <div style={{
                width: '0%',
                height: '100%',
                background: section.color,
                borderRadius: '2px',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const mainRef = useRef(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 1000,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '1.5rem',
          padding: '0.4rem 0.6rem',
          cursor: 'pointer',
          lineHeight: 1,
        }}
        aria-label="Open menu"
      >
        ☰
      </button>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileOpen(false)}
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1001,
          }}
        />
      )}

      <div className={`sidebar-container ${mobileOpen ? 'sidebar-open' : ''}`}>
        <Sidebar />
      </div>
      <main ref={mainRef} style={{
        flex: 1,
        overflow: 'auto',
        padding: '2rem 3rem',
      }}>
        {isHome ? <HomePage /> : <Outlet />}
      </main>
    </div>
  );
}
