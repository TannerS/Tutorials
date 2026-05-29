import { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './AppContext';
import { fetchTasks } from './api/tasks';
import { TaskList } from './components/TaskList';
import { AddTaskForm } from './components/AddTaskForm';
import { FilterBar } from './components/FilterBar';
import { ThemeToggle } from './components/ThemeToggle';
import { UserProfile } from './components/UserProfile';
import { SearchInput } from './components/SearchInput';
import { Stats } from './components/Stats';
import { TagFilter } from './components/TagFilter';
import './styles.css';

// FIXME: APP-1 — No <ErrorBoundary>. Any throw inside the tree unmounts the whole app.
// Class-based ErrorBoundary (still required in React 19) wrapping <Shell />.

function Shell() {
  const { setTasks, theme, tasks } = useApp();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // FIXME: REACT19-8 — document.title set imperatively. React 19 natively supports
  // hoisting <title>, <meta>, <link> from anywhere in the tree. Replace with:
  //   <title>{`${activeCount} tasks · Broken Tasks`}</title>
  //   <meta name="description" content="..." />
  // anywhere inside JSX. React deduplicates and hoists into <head>.
  useEffect(() => {
    const activeCount = tasks.filter((t) => !t.done).length;
    document.title = `${activeCount} tasks · Broken Tasks`;
  }, [tasks]);

  // FIXME: EFF-1 (deps) + EFF-2 (no AbortController). Two bugs in one effect.
  // Also a candidate for full replacement with `use(getTasksPromise())` + Suspense.
  useEffect(() => {
    fetchTasks().then((data) => setTasks(data));
  }, []);

  // FIXME: EFF-3 — DOM side effect in render. Move into useEffect, OR drop the JS
  // and use a CSS attribute selector on <html data-theme={theme}>.
  document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';

  return (
    <div className="shell">
      <header className="header">
        <h1>📝 Broken Tasks</h1>
        <div className="header-right">
          {/* FIXME: PROP-1 — inline object created every render. */}
          <UserProfile style={{ marginRight: 12 }} />
          <ThemeToggle />
        </div>
      </header>

      {/* FIXME: REACT19-9 — banner imperatively reaches into DOM via ref to focus.
          Fine here, but the SearchInput uses legacy forwardRef — see REACT19-7. */}
      <section className="controls">
        <SearchInput
          ref={searchRef}
          value={search}
          onChange={setSearch}
          placeholder="search…"
        />
        <button
          className="theme-btn"
          onClick={() => searchRef.current?.focus()}
          aria-label="Focus search"
        >
          ⌕
        </button>
        <FilterBar />
      </section>

      <AddTaskForm />
      <Stats />
      <TagFilter />

      {/* FIXME: PERF-1 — search lives at the wrong level (re-renders Shell every keystroke). */}
      <TaskList search={search} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
