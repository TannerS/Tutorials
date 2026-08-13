import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'tutorial-progress';

type ProgressMap = Record<string, boolean>;

const key = (sectionId: string, lessonId: string | number): string => `${sectionId}/${lessonId}`;

/* ────────────────────────────────────────────
   Shared progress store.

   This used to be a plain `useState` inside `useProgress()`, which meant every
   caller got its *own* copy seeded from localStorage at mount. The Sidebar and
   the ProgressTracker button are two separate callers, so clicking "Complete"
   updated the button's copy and localStorage, but the Sidebar's copy — mounted
   once for the life of the app — kept its stale snapshot and the "3/11" badge
   never moved until a full page reload.

   One module-level snapshot + useSyncExternalStore keeps every caller on the
   same value, and the `storage` event keeps a second tab in sync too.
   ──────────────────────────────────────────── */

function readStorage(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

let snapshot: ProgressMap = readStorage();
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function handleStorageEvent(e: StorageEvent): void {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  snapshot = readStorage();
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', handleStorageEvent);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', handleStorageEvent);
  };
}

const getSnapshot = (): ProgressMap => snapshot;

function setComplete(sectionId: string, lessonId: string | number): void {
  const k = key(sectionId, lessonId);
  if (snapshot[k]) return;
  snapshot = { ...snapshot, [k]: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Private-browsing / quota errors shouldn't break the UI; the in-memory
    // snapshot still reflects the click for this session.
  }
  emit();
}

export function useProgress() {
  const progress = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Module-level function — already a stable identity, no memoisation needed.
  const markComplete = setComplete;

  const isComplete = useCallback(
    (sectionId: string, lessonId: string | number): boolean => !!progress[key(sectionId, lessonId)],
    [progress],
  );

  const getSectionProgress = useCallback(
    (sectionId: string, totalLessons: number): number => {
      let count = 0;
      for (let i = 0; i < totalLessons; i++) {
        if (progress[key(sectionId, i)]) count++;
      }
      return count;
    },
    [progress],
  );

  return { markComplete, isComplete, getSectionProgress };
}

interface ProgressTrackerProps {
  sectionId: string;
  lessonIndex: number;
  onComplete?: () => void;
}

export default function ProgressTracker({ sectionId, lessonIndex, onComplete }: ProgressTrackerProps) {
  const { markComplete, isComplete } = useProgress();
  const done = isComplete(sectionId, lessonIndex);

  const handleClick = () => {
    markComplete(sectionId, lessonIndex);
    onComplete?.();
  };

  return (
    <div className="no-print" style={{
      margin: '2rem 0',
      padding: '1rem',
      background: done ? 'var(--accent-green-bg)' : 'var(--bg-secondary)',
      border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border-color)'}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ color: done ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {done ? '✅ Lesson completed!' : "Mark this lesson as complete when you're done:"}
      </span>
      {!done && (
        <button
          onClick={handleClick}
          style={{
            background: 'var(--accent-blue)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1.25rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
          }}
        >
          Complete ✓
        </button>
      )}
    </div>
  );
}
