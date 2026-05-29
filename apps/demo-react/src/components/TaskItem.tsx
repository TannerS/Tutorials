import { useState } from 'react';
import { useApp } from '../AppContext';
import type { Task } from '../types';

// FIXME: PERF-4 — Not wrapped in React.memo, so every TaskList render re-renders every row.
// (Memoizing only works if props are referentially stable — see PROP-3 below for what
// breaks that.)
export function TaskItem({ task }: { task: Task }) {
  const { tasks, setTasks } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  // FIXME: STATE-1 — derived "isOverdue" stored in state, then synced via useEffect.
  // It's pure derivation from `task.createdAt`; compute inline.
  const [isOverdue, setIsOverdue] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps  (also wrong — that's a fix, not a hide)
  // FIXME: EFF-4 — missing deps. Should depend on `task.createdAt`.
  if (!isOverdue && Date.now() - task.createdAt > 1000 * 60 * 60 * 24) {
    // FIXME: STATE-2 — setState during render → "Too many renders" trap.
    setIsOverdue(true);
  }

  const toggle = () => {
    // FIXME: STATE-3 — mutating the array in place, then setting the same reference.
    // React's shallow compare won't see a change → child memoized components miss the update.
    const target = tasks.find((x) => x.id === task.id);
    if (target) target.done = !target.done;
    setTasks(tasks);
  };

  const save = () => {
    // FIXME: STATE-4 — copy with map but the inner object reference is shared.
    // Mutating fields on a copied row via Object.assign is fine, but the new array means
    // ref equality for unchanged rows is broken (defeats child memoization).
    setTasks(tasks.map((x) => (x.id === task.id ? Object.assign({}, x, { title: draft }) : x)));
    setEditing(false);
  };

  return (
    <li className={`task-item ${task.done ? 'done' : ''}`}>
      {/* FIXME: A11Y-2 — using a <div> with onClick instead of <button>. No keyboard support,
          no role, no focus ring. */}
      <div className="checkbox" onClick={toggle}>
        {task.done ? '☑' : '☐'}
      </div>

      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          // FIXME: EVENT-1 — `any` event type. Should be React.KeyboardEvent<HTMLInputElement>.
          onKeyDown={(e: any) => { if (e.key === 'Enter') save(); }}
        />
      ) : (
        <span className="title" onDoubleClick={() => setEditing(true)}>
          {task.title}
        </span>
      )}

      <span className={`pill priority-${task.priority}`}>{task.priority}</span>
      {isOverdue && <span className="pill overdue">overdue</span>}

      {/* FIXME: PROP-3 — inline arrow function recreated every render. If TaskItem were
          memoized, this would still defeat memoization in any child it gets passed to.
          Use useCallback OR pass `task.id` and let the handler look it up. */}
      <button onClick={() => setTasks(tasks.filter((x) => x.id !== task.id))}>
        Delete
      </button>
    </li>
  );
}
