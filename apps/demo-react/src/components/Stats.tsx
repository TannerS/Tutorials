import { useEffect, useState } from 'react';
import { useApp } from '../AppContext';

// FIXME: PERF-6 — Stats subscribes to the entire app context. Theme toggle, user
// load, ANY context change re-renders this. Fix once context is split (Part 2).

// FIXME: DERIVE-1 — `completed`, `active`, `byPriority` are all stored in state
// AND synced from `tasks` via useEffect. Classic "syncing derived state" anti-pattern.
// Compute inline (or with useMemo if expensive).
//
// Quick demo of the bug: open DevTools and watch how many renders this triggers
// when you toggle one task. The "correct" version triggers 1 render here total.
export function Stats() {
  const { tasks } = useApp();

  const [completed, setCompleted] = useState(0);
  const [active, setActive] = useState(0);
  const [byPriority, setByPriority] = useState<Record<string, number>>({});

  useEffect(() => {
    setCompleted(tasks.filter((t) => t.done).length);
  }, [tasks]);

  useEffect(() => {
    setActive(tasks.filter((t) => !t.done).length);
  }, [tasks]);

  useEffect(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      const k = String(t.priority);
      map[k] = (map[k] ?? 0) + 1;
    });
    setByPriority(map);
  }, [tasks]);

  return (
    <div className="stats">
      <span><strong>{active}</strong> active</span>
      <span><strong>{completed}</strong> done</span>
      <span>
        {Object.entries(byPriority).map(([k, n]) => (
          <span key={k} className={`pill priority-${k}`} style={{ marginLeft: 6 }}>
            {k}: {n}
          </span>
        ))}
      </span>
    </div>
  );
}
