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

   This lives in its own module rather than beside the ProgressTracker component
   because a file that exports both a component and a hook opts out of React Fast
   Refresh — editing it full-reloads the app in dev instead of hot-swapping.
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
