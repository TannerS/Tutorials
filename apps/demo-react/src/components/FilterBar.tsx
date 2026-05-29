import { useApp } from '../AppContext';

// FIXME: NARROW-1 — `filter` is typed as `string` (see types.ts). Switch to a union
// type "all" | "active" | "completed" so this map / typo'd value is caught at compile time.

const buttons = [
  { value: 'all',       label: 'All' },
  { value: 'active',    label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function FilterBar() {
  const { filter, setFilter } = useApp();

  return (
    <div className="filter-bar" role="group" aria-label="Filter tasks">
      {buttons.map((b) => (
        <button
          key={b.value}
          // FIXME: PERF-5 — inline arrow each render. With many filters this is fine, but
          // demonstrates the pattern. Useful when this component grows or is memoized.
          onClick={() => setFilter(b.value)}
          className={filter === b.value ? 'active' : ''}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}
