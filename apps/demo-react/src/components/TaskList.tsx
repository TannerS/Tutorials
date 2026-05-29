import { useApp } from '../AppContext';
import { TaskItem } from './TaskItem';

// FIXME: PERF-2 — Component is not memoized AND consumes the mega-context, so it
// re-renders whenever ANY field in the context changes (theme toggle, user load, etc.).
// Either narrow what it subscribes to (selector hook + split contexts) OR wrap in React.memo
// AFTER stabilizing the props it receives.

// FIXME: PROP-2 — `search` passed in as a prop but filter comes from context. Mixing
// sources of truth. Either both come from context (with a useSearch hook) or both are local.
export function TaskList({ search }: { search: string }) {
  const { tasks, filter } = useApp();

  // FIXME: PERF-3 — derived data recomputed every render. Wrap in useMemo with the right deps,
  // OR (better) move the computation out of the render path entirely (selector hook).
  const filtered = tasks
    .filter((t) => {
      if (filter === 'active')    return !t.done;
      if (filter === 'completed') return t.done;
      return true;
    })
    .filter((t) => String(t.title).toLowerCase().includes(search.toLowerCase()));

  if (filtered.length === 0) {
    return <p className="empty">No tasks. Add one above.</p>;
  }

  return (
    <ul className="task-list">
      {filtered.map((t, idx) => (
        // FIXME: KEY-1 — using array index as key in a filterable/reorderable list.
        // When tasks are added/removed/filtered, React mis-matches DOM nodes → state in
        // child rows (e.g. an "editing" toggle) leaks across rows. Use t.id instead.
        <TaskItem key={idx} task={t} />
      ))}
    </ul>
  );
}
