import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function ReactNew() {
  return (
    <LessonLayout
      title="React 19 New Features"
      sectionId="react19"
      lessonIndex={7}
      prev={{ path: "/react19/performance", label: "Performance Optimization" }}
      next={{ path: "/react19/server", label: "Server Components" }}
    >
      <p>React 19 is a major release with Actions, the use() hook, the React Compiler, new form hooks, and improved error handling.</p>

      <h2>Actions — Async Transitions</h2>
      <CodeBlock language="jsx" title="Server and Client Actions">
{`// Actions replace manual isPending/error state management
// useActionState manages form state + server action transitions
import { useActionState } from 'react';

async function submitOrder(prevState, formData) {
    const item = formData.get("item");
    try {
        await api.order(item);
        return { success: true, error: null };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

function OrderForm() {
    const [state, action, isPending] = useActionState(submitOrder, null);

    return (
        <form action={action}>
            <input name="item" required />
            <button type="submit" disabled={isPending}>
                {isPending ? "Ordering..." : "Order Now"}
            </button>
            {state?.error && <p style={{color:"red"}}>{state.error}</p>}
            {state?.success && <p style={{color:"green"}}>Order placed!</p>}
        </form>
    );
}`}
      </CodeBlock>

      <h2>use() Hook</h2>
      <CodeBlock language="jsx" title="use() for Promises and Context">
{`import { use, Suspense } from 'react';

// use() unwraps a Promise (must be wrapped in Suspense)
function UserCard({ userPromise }) {
    const user = use(userPromise); // suspends until resolved
    return <div>{user.name}</div>;
}

function App() {
    const userPromise = fetchUser(1); // start fetch outside component
    return (
        <Suspense fallback={<Spinner />}>
            <UserCard userPromise={userPromise} />
        </Suspense>
    );
}

// use() for Context (unlike useContext, works in conditionals)
function ConditionalUser({ show }) {
    if (!show) return null; // early return is fine!
    const user = use(UserContext); // use() after conditional
    return <span>{user.name}</span>;
}`}
      </CodeBlock>

      <h2>useFormStatus</h2>
      <CodeBlock language="jsx" title="useFormStatus for Submit Button State">
{`import { useFormStatus } from 'react-dom';

// Must be a child component inside a <form>
function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save"}
        </button>
    );
}

function ProfileForm() {
    return (
        <form action={updateProfile}>
            <input name="name" />
            <SubmitButton /> {/* has access to form pending state */}
        </form>
    );
}`}
      </CodeBlock>

      <h2>useOptimistic</h2>
      <CodeBlock language="jsx" title="Optimistic UI Updates">
{`import { useOptimistic } from 'react';

function TodoList({ todos, addTodo }) {
    const [optimisticTodos, addOptimistic] = useOptimistic(
        todos,
        (current, newTodo) => [...current, { ...newTodo, pending: true }]
    );

    async function handleAdd(formData) {
        const text = formData.get("text");
        addOptimistic({ id: Date.now(), text }); // instantly show
        await addTodo(text);                      // real async call
    }

    return (
        <form action={handleAdd}>
            <input name="text" />
            <button type="submit">Add</button>
            <ul>
                {optimisticTodos.map(t => (
                    <li key={t.id} style={{ opacity: t.pending ? 0.5 : 1 }}>
                        {t.text} {t.pending && "(saving...)"}
                    </li>
                ))}
            </ul>
        </form>
    );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="React Compiler">
        <p>React 19 ships the React Compiler (formerly React Forget) which automatically memoizes components, hooks, and computed values. When enabled, you can remove most manual useMemo, useCallback, and React.memo calls — the compiler handles it.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What does useOptimistic do?"
        options={["Optimizes component rendering speed", "Shows an optimistic (immediate) UI update before the async operation completes, reverting on error", "Caches API responses", "Defers non-urgent state updates"]}
        correctIndex={1}
        explanation="useOptimistic immediately shows the expected result of an async action in the UI before the server responds. If the action succeeds, the real data takes over. If it fails, the optimistic state reverts. This makes apps feel instant while remaining correct."
      />
    </LessonLayout>
  );
}
