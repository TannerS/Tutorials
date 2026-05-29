import { useEffect, useRef } from 'react';
import { useApp } from '../AppContext';

// FIXME: PROP-5 — Multiple props expressed as separate states; the parent passes
// none of them down — they come from context. But the component still re-renders
// on every keystroke (Stats / Theme / anything). Wrap in React.memo AFTER PERF-6
// is solved.
//
// FIXME: REF-1 — `lastSeenCount` is a ref used to detect "new tasks since last
// render" — but it's mutated DURING render, breaking concurrent rendering safety
// (React 19 can re-run renders that get torn). Move to useEffect.
//
// FIXME: REF-2 — useRef initial value is `null` but type assumes `number`. The
// `lastSeenCount.current!` non-null assertion is a code smell. Initialize properly:
//   const lastSeenCount = useRef(0);
export function TagFilter() {
  const { tasks } = useApp();
  const lastSeenCount = useRef<number | null>(null);

  // BAD: side effect in render
  if (lastSeenCount.current === null) {
    lastSeenCount.current = tasks.length;
  } else if (tasks.length > lastSeenCount.current) {
    console.log(`🆕 ${tasks.length - lastSeenCount.current} new task(s)`);
    lastSeenCount.current = tasks.length;
  }

  // FIXME: EFF-5 — fires on EVERY render because `tasks` changes reference even
  // when the array contents are identical (after STATE-1/STATE-3 mutations).
  // After fixing state immutability, this effect quiets down.
  useEffect(() => {
    console.log('TagFilter saw task change', tasks.length);
  });

  const tags = Array.from(new Set(tasks.flatMap((t) => t.tags ?? [])));

  if (tags.length === 0) return null;

  return (
    <div className="tag-filter">
      <span className="tag-filter-label">Tags:</span>
      {tags.map((tag) => (
        <span key={tag} className="pill" style={{ marginRight: 4 }}>{tag}</span>
      ))}
    </div>
  );
}
