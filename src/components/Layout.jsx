import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { sections } from '../data/sections';

function HomePage() {
  return (
    <div style={{ padding: '2.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #5b9cf6, #a78bfa, #22d3ee)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', fontSize: '2.5rem', fontWeight: 700,
          marginBottom: '0.5rem',
        }}>Developer Tutorials</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          175 interactive lessons across 26 sections — from Java basics to system design.
        </p>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '1rem',
      }}>
        {sections.map(s => (
          <Link key={s.id} to={s.lessons[0]?.path || '/'} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: '12px', padding: '1.25rem',
            textDecoration: 'none', display: 'block',
            transition: 'all 0.2s ease',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = s.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}25`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{s.label}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {s.lessons.length} lesson{s.lessons.length !== 1 ? 's' : ''}
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile hamburger */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        style={{
          display: 'none', position: 'fixed', top: '1rem', left: '1rem',
          zIndex: 1003, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: '8px', padding: '0.5rem', cursor: 'pointer',
          color: 'var(--text-primary)', fontSize: '1.2rem',
        }}
      >☰</button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          style={{
            display: 'none', position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 1001,
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-container${sidebarOpen ? ' sidebar-open' : ''}`}
        style={{ flexShrink: 0 }}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        flex: 1, overflowY: 'auto',
        background: 'var(--bg-primary)',
        padding: '0',
      }}>
        {isHome ? <HomePage /> : <Outlet />}
      </main>
    </div>
  );
}
