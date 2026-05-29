# Broken React Demo — Master Cheat Sheet

For each `FIXME:` tag in the source, here's what's wrong, **why it matters**, and **multiple
ways to fix it**. There is usually no single right answer — pick what teaches you the
most.

> Tip: when you fix one, write a one-line note in the FIXME comment explaining the
> trade-off you picked. The next reader (you, in a month) will thank you.

---

## CTX — Context misuse

### CTX-1 · One mega-context for everything (`AppContext.tsx`)
**Why it matters:** Every consumer subscribes to the whole value. Theme toggle → tasks
re-render. Tasks change → ThemeToggle re-renders.

**Options:**
- **Split into multiple contexts**: `TasksContext`, `FilterContext`, `ThemeContext`,
  `UserContext`. Each component reads only the slice it needs. Cheap, idiomatic, no deps.
- **State + dispatch split** (Kent Dodds pattern): two contexts per domain, the dispatch
  one is referentially stable so action-only consumers never re-render.
- **External store**: Zustand, Jotai, Redux Toolkit, or Valtio. Selectors give you O(1)
  subscriptions and stable references for free.
- **`use` + Suspense** (React 19): for the *initial* data load, a resource read with
  `use()` removes the manual fetch state machine entirely.

### CTX-2 / CTX-4 · Value object rebuilt every render
**Options:**
- `useMemo(() => ({ tasks, setTasks, ... }), [tasks, filter, theme, user])`.
- Better, **stop using one giant value** (see CTX-1). The need for useMemo goes away
  when you split contexts.

### CTX-3 · Lying default value
**Options:**
- `createContext<AppContextValue | null>(null)` and a `useApp()` that throws if it's null.
- Or default to an object whose setters throw with a useful message.

### CTX-5 · Direct `useContext` export
**Option:** wrap in custom selector hooks (`useTasks`, `useTheme`) so the call site
documents what it depends on AND you have one place to add `useMemo` / `useSyncExternalStore`
later.

### CTX-6 · Theme toggle re-renders the world
**Option:** drops out for free once CTX-1 is done.

---

## PERF — Re-renders and memoization

### PERF-1 · Search lives at the wrong level
**Options:**
- Move `search` into `TaskList` (it's the only component that uses it).
- Or: keep it in App but pass it via a dedicated `SearchContext` so unrelated components
  don't re-render on every keystroke.
- Or: use `useDeferredValue(search)` in the filter computation so typing stays smooth
  while filtering catches up.

### PERF-2 · `TaskList` not memoized AND uses mega-context
**Options:**
- Memoize: `export const TaskList = React.memo(...)`. **But** memoization only works if
  props are stable — see PROP-3.
- Better: split context (CTX-1) so `TaskList` only subscribes to tasks + filter.
- Best long-term: a selector hook + an external store.

### PERF-3 · `filtered` recomputed every render
**Options:**
- `const filtered = useMemo(() => ..., [tasks, filter, search])`.
- Move filtering into a `useFilteredTasks(search)` hook.
- For very large lists: virtualize (react-virtuoso, react-window) so off-screen rows
  don't render at all.

### PERF-4 · `TaskItem` not memoized
**Options:**
- `React.memo(TaskItem)` AFTER making the `task` prop stable (currently you spread arrays,
  creating new object refs — see STATE-4).
- Or wrap *just* the heavy children in memo and leave TaskItem light.

### PERF-5 · Inline arrow in `FilterBar`
**Options:**
- `useCallback` with `[setFilter]` deps.
- Or extract a `FilterButton` component that receives `value` + `setFilter`.
- Honestly, for 3 buttons, **doing nothing is fine** — premature memoization adds
  complexity without measurable gain. Profile first.

---

## PROP — Prop identity bugs

### PROP-1 · Inline `style={{ marginRight: 12 }}` in `App.tsx`
**Options:**
- Hoist to module constant: `const PROFILE_STYLE = { marginRight: 12 };`.
- Use a CSS class.
- `useMemo` (overkill for a static literal).

### PROP-2 · `search` from props but `filter` from context (`TaskList`)
**Option:** pick one source of truth. Search should also flow through the same place as
filter (either both props or both context).

### PROP-3 · Inline `() => setTasks(tasks.filter(...))` in `TaskItem`
**Options:**
- `useCallback(() => setTasks(prev => prev.filter(x => x.id !== task.id)), [task.id])`.
- Better: lift the delete handler up; pass `onDelete(id)` from a stable parent that uses
  the functional updater.

### PROP-4 · `style` prop on `UserProfile`
**Options:**
- Pass a `className` instead.
- Freeze the style object as a module constant in the parent.
- `React.memo(UserProfile, customEquality)` — usually not worth it.

---

## EFF — useEffect anti-patterns

### EFF-1 · Empty deps but uses `setTasks`
**Options:**
- Add `setTasks` to deps — useState setters are stable so it won't re-run.
- Move the fetch into a custom hook (`useTasks()`) that returns `{tasks, loading, error}`.

### EFF-2 · No AbortController in fetch effect
**Options:**
- `useEffect(() => { const ac = new AbortController(); fetch(..., {signal: ac.signal}); return () => ac.abort(); }, []);`
- An `ignore` flag: `let alive = true; ... if (alive) setState(...); return () => { alive = false; };`
- Switch to `use()` + Suspense (React 19) — no effect needed at all.
- Move to TanStack Query — request dedupe / cancellation come for free.

### EFF-3 · Side effect (`document.body.className = ...`) in render
**Options:**
- Move into `useEffect(() => { ... }, [theme])`.
- Or set the class once in `main.tsx` and update via a single effect at the top.

### EFF-4 · "Overdue" derived state via setState inside render
**Options (in order of preference):**
- **Don't store it at all** — compute inline: `const isOverdue = Date.now() - task.createdAt > DAY;`.
- If recomputing is too expensive (it isn't here), `useMemo`.
- Never write derived state into useState — it's the single biggest source of state bugs.

---

## STATE — State bugs

### STATE-1 · Mutating array in place in `toggle()`
**Why:** `setTasks(tasks)` with the *same* array reference → React skips re-render or
later memoized children miss the update.

**Options:**
- `setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))`.
- Switch to `useReducer` with a `toggle` action.
- Use Immer (`useImmer`) so you can write mutation-style code that produces immutable
  updates.

### STATE-2 · `setIsOverdue` during render
**Options:**
- Remove the state entirely (see EFF-4).

### STATE-3 · `setTasks(tasks)` after mutation
Same fix as STATE-1.

### STATE-4 · `Object.assign` on a row, new array
**Options:**
- Spread the row: `x.id === task.id ? { ...x, title: draft } : x`. Unchanged rows keep
  reference equality, so memoized children skip re-render.
- Move into a reducer action.

### STALE-1 · Captured `tasks` in `AddTaskForm.onSubmit`
**Options:**
- Functional updater: `setTasks(prev => [...prev, t])`.
- Or move to a reducer: `dispatch({ type: 'add', task: t })`.
- Or use React 19 `useOptimistic` for instant UI + server reconciliation.

---

## ASYNC — Race conditions

### ASYNC-1 · No try/catch on `createTask`
**Options:**
- `.then(...).catch(setError)` and surface in UI.
- `try/await/catch` with `useState` for error.
- React 19 `useActionState` returns `{state, error, isPending}` from the action.

### API-1 · Stale-response race (`api/tasks.ts`)
**Options:**
- AbortController.
- Request id (`const id = ++latest; ... if (id !== latest) return;`).
- TanStack Query / SWR — handles this for you.

---

## FORM — Form handling

### FORM-1 / FORM-2 · Manual everything
**Options:**
- **React 19 form actions:**
  ```ts
  const [error, submitAction, isPending] = useActionState(async (_prev, formData) => {
    const title = String(formData.get('title') ?? '').trim();
    if (!title) return 'Title required';
    await createTask(title);
    return null;
  }, null);
  ```
- Add `zod` for validation; pair with a tiny wrapper or `react-hook-form`.
- For the spinner state inside the submit button: `useFormStatus()` (must be inside a
  `<form>` child).
- For instant UI: `useOptimistic` to show the task immediately, roll back on error.

---

## TS — TypeScript

### TS-1 · `any` everywhere in `Task`
**Options:**
- Strict interface:
  ```ts
  export interface Task {
    id: number;            // or branded: type TaskId = number & { __brand: 'TaskId' };
    title: string;
    done: boolean;
    priority: Priority;
    createdAt: number;
    tags: string[];
  }
  export type Priority = 'low' | 'medium' | 'high';
  ```
- Use `zod` to derive the type AND validate at the API boundary:
  ```ts
  const TaskSchema = z.object({ id: z.number(), ... });
  export type Task = z.infer<typeof TaskSchema>;
  ```

### TS-2 · `Filter` is `string`
**Option:** `export type Filter = 'all' | 'active' | 'completed';` Then the FilterBar
button map is type-checked, and the switch in TaskList is exhaustive:
```ts
const x: Filter = 'all';
switch (x) {
  case 'all': ...
  case 'active': ...
  case 'completed': ...
  default: { const _exhaustive: never = x; throw new Error('unhandled'); }
}
```

### TS-3 · User loading state
**Option:** Replace with a tagged union:
```ts
type UserState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'loaded'; user: User };
```

### TS-4 · `Theme` is `string`
**Option:** `export type Theme = 'dark' | 'light';`

### NARROW-1 · `filter === 'active'` string comparisons
**Option:** Falls out of TS-2.

---

## EVENT — Event-typing

### EVENT-1 · `onKeyDown={(e: any) => ...}`
**Option:** `(e: React.KeyboardEvent<HTMLInputElement>)` — get `e.key` typed.

### EVENT-2 · `onSubmit={(e: any) => ...}`
**Option:** `(e: React.FormEvent<HTMLFormElement>)`. Or use React 19 form actions and
let `formData` carry the data instead of reading from controlled state.

---

## KEY — List keys

### KEY-1 · `key={idx}` on filterable list
**Options:**
- `key={task.id}` — easy, correct.
- If you ever support drag-reorder, this is required for it to work at all.

---

## A11Y — Accessibility

### A11Y-1 · Unlabeled search input
**Options:**
- `<label htmlFor="search">Search</label>` (visible) or visually-hidden:
  ```tsx
  <label className="sr-only" htmlFor="search">Search tasks</label>
  <input id="search" ... />
  ```
- `aria-label="Search tasks"` if you really can't show a label.

### A11Y-2 · `<div onClick>` for checkbox
**Options:**
- Use `<input type="checkbox">` and style it.
- Or `<button role="checkbox" aria-checked={task.done} onClick={toggle}>`.
- Tab/Space/Enter keyboard handling — `<button>` gives you this for free.

---

## APP — App structure

### APP-1 · No error boundary
**Options:**
- Class-based `ErrorBoundary` component (still the canonical answer in React 19) wrapping `<Shell />`.
- `react-error-boundary` library for nicer ergonomics with hooks.
- Per-route boundaries when you add routing later.

### APP-2 · `search` state at App level
Covered by PERF-1.

---

## REACT19 — React 19 features you should adopt

These FIXMEs only exist because the code was deliberately written the "React 17" way.
Each one is an opportunity to learn a React 19 feature.

### REACT19-1 through REACT19-6 · `AddTaskForm.tsx` — form actions
Replace manual `useState` + onSubmit with React 19's form trio:

```tsx
import { useActionState, useOptimistic } from 'react';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus(); // MUST be inside a child of <form>
  return <button type="submit" disabled={pending}>{pending ? 'Adding…' : 'Add'}</button>;
}

export function AddTaskForm() {
  const { tasks, setTasks } = useApp();
  const [optimistic, addOptimistic] = useOptimistic(
    tasks,
    (state, t: Task) => [...state, t],
  );
  const [error, action] = useActionState(
    async (_prev: string | null, formData: FormData): Promise<string | null> => {
      const title = String(formData.get('title') ?? '').trim();
      if (!title) return 'Title is required';
      const temp: Task = { id: `temp-${Date.now()}`, title, done: false, /* ... */ };
      addOptimistic(temp);
      try {
        const created = await createTask(title);
        setTasks([...tasks, created]);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    null,
  );

  return (
    <form action={action} className="add-form">
      <input name="title" placeholder="What needs doing?" />
      <SubmitButton />
      {error && <span className="form-error">⚠ {error}</span>}
    </form>
  );
}
```

What this teaches:
- `useActionState` replaces three pieces of useState (data, error, pending) with one hook.
- `useFormStatus` reads the *enclosing* form's state — that's why it lives in a child.
- `useOptimistic` is paired with the action: the temp row shows instantly, then the
  real `setTasks` swap-in is invisible if successful, or rolled back automatically if
  the action throws.
- The `<input>` is now uncontrolled — you read FormData inside the action.

### REACT19-7 · `SearchInput.tsx` — drop forwardRef
React 19 removes the need:

```tsx
interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ref?: Ref<HTMLInputElement>;        // <-- just a prop now
}

export function SearchInput({ ref, value, onChange, placeholder }: SearchInputProps) {
  return <input ref={ref} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}
```

### REACT19-8 · App.tsx — Document Metadata
React 19 hoists `<title>`, `<meta>`, and `<link>` automatically. Replace the
`document.title = ...` effect with:

```tsx
const activeCount = tasks.filter((t) => !t.done).length;
return (
  <>
    <title>{`${activeCount} tasks · Broken Tasks`}</title>
    <meta name="description" content="Deliberately broken React app for learning" />
    <div className="shell">...</div>
  </>
);
```

### REACT19-9 · Use `use()` for initial fetch
Once you wrap `<Shell />` in `<Suspense fallback={...}>`, replace the EFF-1/EFF-2
effect with:

```tsx
import { use } from 'react';
import { getTasksPromise } from './api/tasks';

function ShellInner() {
  const initial = use(getTasksPromise());  // throws the promise → caught by Suspense
  const { setTasks } = useApp();
  useEffect(() => setTasks(initial), [initial, setTasks]);
  // ...
}

export function Shell() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <ShellInner />
    </Suspense>
  );
}
```

The `use()` hook is the React 19 way to read a promise mid-render. No effect, no
loading boolean, no race condition.

### Bonus · React Compiler
The React Compiler (now stable for React 19) auto-memoizes components and values.
Once you've fixed CTX-N and removed the worst anti-patterns, install
`babel-plugin-react-compiler` and you'll find that **most** of your `useMemo` /
`useCallback` calls become unnecessary. Remove them one at a time and verify with
the profiler.

Install (when ready):
```bash
npm i -D babel-plugin-react-compiler @vitejs/plugin-react
```

Then in `vite.config.ts`:
```ts
react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } })
```

---

## DERIVE — Derived state stored in useState

### DERIVE-1 · `Stats.tsx` syncs three pieces of derived state via effects
Compute, don't store:
```tsx
export function Stats() {
  const { tasks } = useTasks();   // narrowed selector hook from Part 2
  const completed = tasks.filter((t) => t.done).length;
  const active    = tasks.length - completed;
  const byPriority = tasks.reduce<Record<Priority, number>>((acc, t) => {
    acc[t.priority] = (acc[t.priority] ?? 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0 });
  ...
}
```
If profiling shows the reduce is hot, wrap it in `useMemo`. Don't reach for memo
*first* — start with the inline version, then measure.

---

## HOOK — Custom hook bugs

### HOOK-1 · `useDebounced` leaks timers
The cleanup function calls `setTimeout(...)` instead of `clearTimeout(...)`.
```ts
useEffect(() => {
  const handle = setTimeout(() => setDebounced(value), delayMs);
  return () => clearTimeout(handle);
}, [value, delayMs]);
```

### HOOK-2 · No `flush()`
Return a tuple so callers can flush:
```ts
return [debounced, flush] as const;
```
And implement `flush` by clearing the timer + calling `setDebounced(value)` immediately.

### HOOK-3 · Not generic
```ts
export function useDebounced<T>(value: T, delayMs = 300): T { ... }
```

---

## REF — useRef misuse

### REF-1 · Mutating ref in render (`TagFilter.tsx`)
Move into `useEffect`:
```ts
useEffect(() => {
  if (tasks.length > lastSeenCount.current) {
    console.log(`🆕 ${tasks.length - lastSeenCount.current} new task(s)`);
  }
  lastSeenCount.current = tasks.length;
}, [tasks.length]);
```
Why: React 19's concurrent renderer may discard a render and retry. Side effects
in render fire twice; refs mutated in render leak inconsistent values.

### REF-2 · Wrong initial value
```ts
const lastSeenCount = useRef<number>(0);
```

---

## Stretch goals (after the FIXMEs)

- Persist tasks to `localStorage` and watch what breaks (SSR? hydration? double writes?).
- Add a "Bulk select + bulk delete" feature. Where does the selection state live?
- Add Suspense + `use()` for the initial fetch and remove the `useEffect` entirely.
- Wire up React Compiler and remove your `useMemo` / `useCallback` calls one by one,
  measuring with the profiler.
- Convert the reducer (when you write one) to use `useSyncExternalStore` for time-travel
  debug.
- Add Vitest + RTL tests for the reducer, then for components.
