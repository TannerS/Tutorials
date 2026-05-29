# Broken React Demo — Bug Hunt

This app is **deliberately broken**. Run it, click around, then start fixing.

```bash
# from repo root
npm run dev
# then open http://localhost:5174
```

Every problem is tagged with a `FIXME: <CATEGORY>-<N>` comment in the source so you can
grep for them.

```bash
grep -rn "FIXME:" apps/demo-react/src
```

Open `SOLUTIONS.md` only after you've taken a real swing at each one.
**For the recommended order to fix things, see `ROADMAP.md`** — work through the
parts one at a time.

---

## Categories

| Tag    | Theme                          | Where to look                              |
| ------ | ------------------------------ | ------------------------------------------ |
| CTX-N  | Context misuse                 | `AppContext.tsx`, every consumer           |
| PERF-N | Re-render & memoization        | `TaskList.tsx`, `TaskItem.tsx`, context    |
| PROP-N | Prop / reference identity bugs | `App.tsx`, `UserProfile.tsx`, `TaskItem`   |
| EFF-N  | useEffect anti-patterns        | `App.tsx`, `TaskItem.tsx`                  |
| STATE-N| State management bugs          | `TaskItem.tsx`, `AddTaskForm.tsx`          |
| STALE-N| Stale closures                 | `AddTaskForm.tsx`                          |
| ASYNC-N| Async / race conditions        | `App.tsx`, `api/tasks.ts`, `AddTaskForm`   |
| FORM-N | Form handling                  | `AddTaskForm.tsx`                          |
| TS-N   | TypeScript weakness            | `types.ts`, scattered `any`                |
| EVENT-N| Event-typing bugs              | `TaskItem.tsx`, `AddTaskForm.tsx`          |
| KEY-N  | List key bugs                  | `TaskList.tsx`                             |
| A11Y-N | Accessibility                  | `App.tsx`, `TaskItem.tsx`                  |
| NARROW-N | Type-narrowing opportunities | `FilterBar.tsx`, `types.ts`                |
| APP-N  | App-level structure / EB       | `App.tsx`                                  |
| REACT19-N | React 19 features to adopt  | `AddTaskForm.tsx`, `SearchInput.tsx`, `App.tsx` |
| DERIVE-N | Derived state in useState     | `Stats.tsx`                                |
| HOOK-N  | Custom hook bugs              | `hooks/useDebounced.ts`                    |
| REF-N   | useRef misuse                 | `TagFilter.tsx`                            |

---

## Symptoms you can observe just by using the app

1. Type fast in the search box — feel the lag from re-rendering every task row.
2. Click the theme toggle — every task row re-renders too (it shouldn't).
3. Add tasks rapidly — sometimes one disappears (stale closure / race).
4. Edit a task title via double-click, then change the filter — editing state can leak to
   the wrong row.
5. Refresh quickly twice — old fetch can overwrite newer data.
6. Open React DevTools profiler → record while typing one letter → look at the flame chart.

---

## Suggested order to fix

1. **TS-N first.** Get the type model right and many other fixes become obvious.
2. **CTX-N + PERF-N** together. Split the context, then memoization actually pays off.
3. **STATE-N + STALE-N**. Switch to functional updaters; consider useReducer.
4. **EFF-N + ASYNC-N**. Cancellation + correct deps.
5. **FORM-N**. Modernize with React 19 form actions / useActionState.
6. **A11Y-N**. Last pass — easy wins.

There is no single right answer for most of these — see `SOLUTIONS.md` for options.
