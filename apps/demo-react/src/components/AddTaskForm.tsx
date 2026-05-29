import { useState } from 'react';
import { useApp } from '../AppContext';
import { createTask } from '../api/tasks';

// =============================================================================
// FIXME: REACT19-1 — This entire component is a "before React 19" implementation.
// It manually tracks `submitting`, captures stale state, has no error UI, and
// no optimistic UI. The exercise is to rewrite it using React 19's three big
// form primitives:
//
//   useActionState  → replaces the manual submit/error/pending state machine
//   useFormStatus   → replaces the manual `submitting` prop drilled to the button
//   useOptimistic   → replaces the "wait for server then setTasks" delay
//
// After: this component shrinks by ~50% AND gets better UX.
// =============================================================================

export function AddTaskForm() {
  const { tasks, setTasks } = useApp();
  const [title, setTitle] = useState('');
  // FIXME: REACT19-2 — replace this `submitting` boolean with useFormStatus()
  // from inside a <SubmitButton /> child of <form>. (You CANNOT call useFormStatus
  // in the same component that renders the <form> — it has to be in a child.)
  const [submitting, setSubmitting] = useState(false);
  // FIXME: REACT19-3 — manual error state, no useActionState. Convert to:
  //   const [error, action, isPending] = useActionState(async (_prev, formData) => { ... }, null);
  //   then: <form action={action}>
  const [error, setError] = useState<string | null>(null);

  // FIXME: REACT19-4 — onSubmit instead of form `action`. React 19 lets you pass a
  // server action (or a client async function) directly to `<form action={...}>`.
  // No e.preventDefault needed.
  const onSubmit = (e: any /* FIXME: EVENT-2 → React.FormEvent<HTMLFormElement> */) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // FIXME: REACT19-5 — no useOptimistic. Users wait ~600ms before they see their
    // task in the list. After this rewrite:
    //   const [optimisticTasks, addOptimistic] = useOptimistic(tasks, (state, t: Task) => [...state, t]);
    //   addOptimistic({ id: 'temp', title, ... });    // instant UI
    //   await createTask(title);                       // server reconciles via setTasks
    createTask(title)
      .then((t) => {
        // FIXME: STALE-1 — `tasks` is captured; two rapid submits drop one. Use
        //   setTasks(prev => [...prev, t])
        // — but if you adopt useOptimistic above, you won't even need this update path
        // because the reconciler will refetch or you'll dispatch through an action.
        setTasks([...tasks, t]);
        setTitle('');
      })
      .catch((err: Error) => setError(err.message))   // FIXME: ASYNC-1 — error path is afterthought; useActionState gives this for free
      .finally(() => setSubmitting(false));
  };

  return (
    <form className="add-form" onSubmit={onSubmit}>
      <input
        // FIXME: REACT19-6 — Once you switch to `<form action={action}>`, you can
        // make this an UNCONTROLLED input and read FormData inside the action:
        //   const title = String(formData.get('title') ?? '').trim();
        // That deletes this useState entirely.
        name="title"
        placeholder='What needs doing? (try "boom" to trigger an error)'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button type="submit" disabled={submitting}>
        {submitting ? 'Adding…' : 'Add'}
      </button>
      {error && <span className="form-error">⚠ {error}</span>}
    </form>
  );
}
