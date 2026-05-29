# Broken React Demo — Fix-It Roadmap

Don't try to fix everything at once. The FIXMEs are tagged so you can attack them in
phases. Each phase has clear entry/exit criteria so you know when you're "done" with it.

---

## Part 1 — TypeScript hygiene 🅣

**Goal:** No more `any`. Compile-time safety for shapes you read every day.

**Tags to fix:** `TS-*`, `NARROW-*`, `EVENT-*`

**Exit criteria:**
- [ ] `Task`, `User`, `Filter`, `Theme` have real types (no `any`).
- [ ] `Filter` is a literal union; switches over it are exhaustive.
- [ ] All event handlers use `React.*Event<...>`, not `any`.
- [ ] `npm run typecheck -w @tutorials/demo-react` returns 0 errors.

**Why first:** type errors will guide every subsequent refactor — types tell you
*what* you're allowed to change.

---

## Part 2 — Tame the context 🌍

**Goal:** Stop the whole tree from re-rendering when one slice changes.

**Tags to fix:** `CTX-*`, `PERF-1`, `PERF-2`, `CTX-6`

**Exit criteria:**
- [ ] Theme toggle no longer re-renders task rows (verify in React DevTools Profiler).
- [ ] Search input typing no longer re-renders unrelated components.
- [ ] Either: (a) multiple split contexts, (b) state+dispatch split, or (c) external
      store (Zustand/Jotai).
- [ ] Custom selector hooks (e.g. `useTasks()`, `useTheme()`) — no direct `useContext`
      calls in components.

---

## Part 3 — Correct state management 🧠

**Goal:** No mutations. No setState in render. No stale closures. Derived state
computed, not stored.

**Tags to fix:** `STATE-*`, `STALE-*`, `EFF-4` (derived state)

**Exit criteria:**
- [ ] All updates use functional updaters or a reducer.
- [ ] No `Object.assign`-then-set patterns; spread the row you change.
- [ ] `isOverdue` (and any other derived value) is computed inline.
- [ ] Rapid-fire submits don't drop tasks.

---

## Part 4 — Effects, async, and React 19 data 🔁

**Goal:** No race conditions. No setState-on-unmounted warnings. Adopt React 19's
`use()` + Suspense where it fits.

**Tags to fix:** `EFF-*`, `ASYNC-*`, `API-*`, `SUSPENSE-1`

**Exit criteria:**
- [ ] Fetch effect has AbortController OR is replaced by `use()` + `<Suspense>`.
- [ ] Refreshing twice quickly never shows stale data.
- [ ] No DOM mutation in render (theme class set via effect or CSS attribute).
- [ ] An `<ErrorBoundary>` exists around the data area.

---

## Part 5 — Modernize forms (React 19) 📝

**Goal:** Replace manual form state with React 19's form trio.

**Tags to fix:** `FORM-*`, `REACT19-1..6`, `EVENT-2`, `ASYNC-1`

**Exit criteria:**
- [ ] `useActionState` powers the error/pending state of `AddTaskForm`.
- [ ] `useFormStatus` drives the submit button.
- [ ] `useOptimistic` shows the new task instantly.
- [ ] `<form action={...}>` instead of `onSubmit`.
- [ ] Submitting "boom" surfaces the server error gracefully.

---

## Part 6 — Refs, metadata, and the rest of React 19 🚀

**Goal:** Drop `forwardRef`. Use built-in metadata. Touch React Compiler.

**Tags to fix:** `REACT19-7`, `REACT19-8`, `REACT19-9`, plus stretch goals.

**Exit criteria:**
- [ ] No `forwardRef` left in the codebase.
- [ ] `<title>` and `<meta>` rendered from JSX, not imperatively set.
- [ ] (Optional) React Compiler enabled in `vite.config.ts`; profile shows the
      `useMemo`/`useCallback` you removed didn't hurt performance.

---

## Part 7 — Accessibility & polish ♿

**Goal:** WCAG 2.1 AA-friendly basics.

**Tags to fix:** `A11Y-*`, `KEY-*`, `PROP-*`, `PERF-5`

**Exit criteria:**
- [ ] Every input has a real label (visible or sr-only).
- [ ] Checkboxes are real `<input type="checkbox">` or proper button roles.
- [ ] List keys are stable IDs, never indexes.
- [ ] Focus management feels reasonable (tab order, focus trap inside modals if you
      add any).

---

## Part 8 — Stretch (only if Parts 1–7 are done) 🌟

Pick from the "Stretch goals" section in `SOLUTIONS.md`:
- Persist to localStorage (and break/fix the SSR hydration story).
- Bulk select + bulk delete.
- React Compiler comparative profile.
- Add Vitest + RTL tests starting from the reducer.
- Replace fetch with TanStack Query.

---

## Done?

You won't be — there's always more. But once you've done Parts 1–6 the codebase
will feel like a *real* modern React 19 app, and reading the React 19 release notes
will click in a way it doesn't right now.
