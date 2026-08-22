import { Outlet, useLocation, Link, useNavigate } from 'react-router';
import { useRef, useEffect, useState, useCallback, useMemo, useSyncExternalStore } from 'react';
import Sidebar from './Sidebar';
import { sections } from '../data/sections';
import { CommandPalette, type CommandItem } from './CommandPalette';
import { useCommandPaletteShortcut } from './useCommandPaletteShortcut';

// Mirrors the `@media (max-width: 768px)` breakpoint in global.css, which is
// what actually turns the sidebar into an overlay drawer.
const MOBILE_QUERY = '(max-width: 768px)';

function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(MOBILE_QUERY);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

function HomePage() {
  return (
    <div style={{ maxWidth: '900px' }}>
      <h1 style={{
        fontSize: '2.5rem',
        fontWeight: 700,
        marginBottom: '0.5rem',
        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple), var(--accent-pink))',
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
        {/* A section with no lessons would have crashed the whole home page on
            `section.lessons[0].path` (TypeScript can't catch it — the index
            signature is not checked). Skip it instead. */}
        {sections.filter(section => section.lessons.length > 0).map(section => (
          <Link
            key={section.id}
            to={section.lessons[0]!.path}
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
  const navigate = useNavigate();
  const isHome = location.pathname === '/';
  const mainRef = useRef<HTMLElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isMobile = useIsMobile();

  // The mobile drawer is open only for the route it was opened on, so picking
  // a lesson closes it for free. Previously this was a boolean cleared from the
  // route-change effect, which cost an extra render pass per navigation and
  // left the drawer briefly covering the freshly-loaded page.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
  const mobileOpen = drawerOpenedAt === location.pathname;
  const setMobileOpen = useCallback(
    (open: boolean) => setDrawerOpenedAt(open ? location.pathname : null),
    [location.pathname],
  );

  // Scroll to top on route change.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Escape closes the mobile drawer and returns focus to the button that
  // opened it. Previously the drawer could only be dismissed by tapping the
  // backdrop, which is unreachable with a keyboard.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen, setMobileOpen]);

  // Cmd-K / Ctrl-K toggles the palette
  useCommandPaletteShortcut(useCallback(() => setPaletteOpen((o) => !o), []));

  const commandItems = useMemo<CommandItem[]>(
    () =>
      sections.flatMap((s) =>
        s.lessons.map((l) => ({
          id: l.path,
          title: l.title,
          group: s.label,
          icon: s.icon,
          color: s.color,
          keywords: [s.id, l.id],
          onSelect: () => navigate(l.path),
        })),
      ),
    [navigate],
  );

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Mobile hamburger */}
      <button
        ref={menuBtnRef}
        type="button"
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-controls="site-sidebar"
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

      {/* `inert` while the drawer is off-screen on mobile: the sidebar is only
          translated out of view, so without this every one of its ~200 links
          stayed in the tab order and Tab walked focus through invisible
          content. The attribute is ignored at desktop widths where the
          sidebar is always visible (mobileOpen is irrelevant there), so it is
          driven by a media query read rather than by mobileOpen alone. */}
      <div
        id="site-sidebar"
        className={`sidebar-container ${mobileOpen ? 'sidebar-open' : ''}`}
        inert={isMobile && !mobileOpen}
      >
        <Sidebar />
      </div>
      <main ref={mainRef} style={{
        flex: 1,
        overflow: 'auto',
        padding: '2rem 3rem',
      }}>
        {isHome ? <HomePage /> : <Outlet />}
      </main>

      {/* Mounted only while open so its query/selection reset for free on each
          open, and so the overlay isn't in the a11y tree the rest of the time. */}
      {paletteOpen && (
        <CommandPalette
          open
          onClose={() => setPaletteOpen(false)}
          items={commandItems}
          placeholder="Jump to lesson… (Cmd-K)"
        />
      )}
    </div>
  );
}
