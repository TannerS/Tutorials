import type { Task } from '../types';

const seed: Task[] = [
  { id: 1, title: 'Read React 19 docs', done: false, priority: 'high',   createdAt: Date.now() - 1000 * 60 * 60 * 26, tags: ['learning'] },
  { id: 2, title: 'Refactor mega-context',  done: false, priority: 'medium', createdAt: Date.now(), tags: ['react', 'perf'] },
  { id: 3, title: 'Adopt useActionState',   done: false, priority: 'high', createdAt: Date.now(), tags: ['react19'] },
  { id: 4, title: 'Try useOptimistic',      done: true,  priority: 'low',   createdAt: Date.now(), tags: ['react19'] },
  { id: 5, title: 'Replace forwardRef with ref-as-prop', done: false, priority: 'medium', createdAt: Date.now(), tags: ['react19'] },
];

// FIXME: API-1 — random delay + no cancellation. Two rapid calls produce a race condition.
// Fix with AbortController, a request id, or — better — wrap the fetch in a promise
// resource and consume it with React 19's `use()` + <Suspense>.
export function fetchTasks(): Promise<Task[]> {
  const delay = 300 + Math.random() * 1500;
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(seed)), delay));
}

// FIXME: API-2 — mutates the in-memory seed. Server actions should never mutate request
// state like this. Treat it as if it were a real Postgres write — return the persisted row.
export function createTask(title: string): Promise<Task> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // FIXME: API-3 — a fake server-side error for the form to handle. Currently the
      // caller has no idea this can throw. Surface it through useActionState's error path.
      if (title.toLowerCase().includes('boom')) {
        reject(new Error('Server rejected "boom" titles'));
        return;
      }
      const t: Task = {
        id: Math.floor(Math.random() * 1_000_000),
        title,
        done: false,
        priority: 'medium',
        createdAt: Date.now(),
        tags: [],
      };
      seed.push(t);
      resolve(t);
    }, 600);
  });
}

// Cached promise for the `use()` example users will eventually write.
// FIXME: SUSPENSE-1 — there's no Suspense boundary yet. When you switch App.tsx to
// `const tasks = use(tasksPromise)`, wrap <Shell /> in <Suspense fallback={...}>.
let _tasksPromise: Promise<Task[]> | null = null;
export function getTasksPromise(): Promise<Task[]> {
  if (!_tasksPromise) _tasksPromise = fetchTasks();
  return _tasksPromise;
}
