import { useApp } from '../AppContext';

// FIXME: CTX-6 — Toggling theme re-renders every consumer of AppContext (TaskList,
// AddTaskForm, every TaskItem, etc.) because the value object is rebuilt. Split theme
// into its own context, then this button only causes Shell + ThemedSurface to re-render.
export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="theme-btn"
    >
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  );
}
