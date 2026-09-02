import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Data Loading & Actions"
      sectionId="react-router-v8"
      lessonIndex={2}
      prev={{ path: '/react-router-v8/nested', label: 'Nested Routes & Outlets' }}
      next={{ path: '/react-router-v8/guards', label: 'Auth Guards & Protected Routes' }}
    >
      <p>
        React Router v8 (current — <code>latest</code> is <code>8.3.1</code>,
        with <code>8.0.0</code> shipping June 2026 as the first release under
        the project&apos;s new yearly-major-version cadence) keeps the exact
        same data-loading model v7 introduced: a <strong>loader</strong> for
        reads, an <strong>action</strong> for writes, and{' '}
        <code>useLoaderData()</code> to read the result in your component. If
        you already know v7, most of this lesson will look identical — because
        it is. What actually changed is narrower than the rename rumors
        floating around suggest, and this lesson is upfront about exactly what
        did and didn&apos;t move, verified against the real{' '}
        <code>v8.0.0</code> changelog rather than assumed.
      </p>

      <FlowChart
        title="Request → Middleware → Loader/Action → Render"
        chart={"graph TD\nA[Navigation or Form Submit] --> B[Root route middleware runs - before]\nB --> C[Parent route middleware runs - before]\nC --> D[Leaf route middleware runs - before]\nD --> E{Is it a GET?}\nE -->|GET| F[Run matched loaders in parallel]\nE -->|POST/PUT/DELETE| G[Run the action]\nF --> H[Leaf middleware resumes - after]\nG --> H\nH --> I[Parent middleware resumes - after]\nI --> J[Root middleware resumes - after]\nJ --> K[Render with useLoaderData]\nstyle A fill:#1a2744\nstyle F fill:#2a1f44\nstyle G fill:#3b1a1a\nstyle K fill:#1a3329"}
      />

      <InfoBox variant="note" title="Where the Middleware Layer in This Diagram Comes From">
        That nested before/after wrapper is new context, not new to this
        lesson&apos;s API: <strong>middleware</strong> stabilized in React
        Router <code>7.9.0</code> (September 2025) and became always-on by
        default in <code>8.0.0</code> — the <code>future.v8_middleware</code>{' '}
        flag that used to gate it was removed entirely, so there is nothing
        left to opt into. Loaders and actions run exactly as they always have;
        middleware is simply free to wrap around them now without any setup.
        The next lesson covers middleware in depth using auth as the running
        example — this page sticks to loaders and actions.
      </InfoBox>

      <h2>Loader Functions</h2>
      <p>
        A <code>loader</code> is an async function that fetches data before
        the route renders. It receives the route params and the request. The
        component accesses the data with <code>useLoaderData()</code> — no
        loading state needed because the data is already there when the
        component mounts. None of this changed in v8.
      </p>

      <CodeBlock language="jsx" title="Basic Loader">
{`// routes/UserProfile.jsx
import { useLoaderData } from 'react-router';

// Loader runs before the component renders.
//   params  — the :placeholders from the matched path, e.g. { userId: '42' }
//   request — a real Request object, so the URL and query string are available
export async function loader({ params, request }) {
  // Read ?tab=… so the loader can fetch only the section being shown
  const tab = new URL(request.url).searchParams.get('tab') || 'overview';

  const response = await fetch(
    \`/api/users/\${params.userId}?tab=\${tab}\`
  );

  // Throwing a Response (rather than returning it) hands control to the
  // nearest errorElement — see "Error Handling" below.
  if (!response.ok) {
    throw new Response('User not found', { status: 404 });
  }
  return response.json(); // { name, email, avatar, ... }
}

export default function UserProfile() {
  const user = useLoaderData(); // data from loader — already resolved

  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Register the Loader in Route Config">
{`import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import UserProfile, { loader as userLoader } from './routes/UserProfile';

const router = createBrowserRouter([
  {
    path: 'users/:userId',
    element: <UserProfile />,
    loader: userLoader,
    errorElement: <UserError />,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Parallel Data Loading">
        When navigating to a nested route, React Router runs <em>all</em> matched
        loaders in parallel — not in a waterfall. A route tree of{' '}
        <code>Root &gt; Dashboard &gt; UserProfile</code> fires all three loaders
        simultaneously. Still true in v8; nothing about this changed.
      </InfoBox>

      <h2>Action Functions</h2>
      <p>
        An <code>action</code> handles non-GET submissions — creating, updating,
        or deleting data. Use the <code>&lt;Form&gt;</code> component (from React
        Router, not HTML) to submit to the route&apos;s action. After the action
        completes, React Router automatically revalidates all active loaders so
        the UI shows fresh data.
      </p>

      <CodeBlock language="jsx" title="Action Function + Form">
{`import { Form, useActionData, redirect } from 'react-router';

// Action receives the form data
export async function action({ request, params }) {
  const formData = await request.formData();
  const name = formData.get('name');
  const email = formData.get('email');

  // Validate
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email?.includes('@')) errors.email = 'Invalid email';
  if (Object.keys(errors).length) return { errors };

  // Persist
  await fetch(\`/api/users/\${params.userId}\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  });

  // Redirect after success
  return redirect(\`/users/\${params.userId}\`);
}

export default function EditUser() {
  const actionData = useActionData(); // { errors } if validation failed

  return (
    <Form method="post">
      <label>
        Name
        <input name="name" />
        {actionData?.errors?.name && (
          <span className="error">{actionData.errors.name}</span>
        )}
      </label>
      <label>
        Email
        <input name="email" type="email" />
        {actionData?.errors?.email && (
          <span className="error">{actionData.errors.email}</span>
        )}
      </label>
      <button type="submit">Save</button>
    </Form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Form method Determines Action vs Loader">
        <code>&lt;Form method=&quot;get&quot;&gt;</code> triggers the route&apos;s{' '}
        <strong>loader</strong> (like a search).{' '}
        <code>&lt;Form method=&quot;post&quot;&gt;</code> (or put/patch/delete)
        triggers the route&apos;s <strong>action</strong>. Revalidation after a
        successful action is automatic — see the v7 lesson if you want the full
        explanation of why; the behavior itself carried over unchanged.
      </InfoBox>

      <h2>useFetcher and useNavigation</h2>
      <p>
        <code>useFetcher</code> calls loaders and actions without navigating —
        inline edits, toggles, add-to-cart. <code>useNavigation</code> exposes
        the router&apos;s current <code>state</code> (<code>idle</code> /{' '}
        <code>loading</code> / <code>submitting</code>) for building a global
        spinner. Both hooks are unchanged from v7.
      </p>

      <CodeBlock language="jsx" title="useFetcher for Inline Actions">
{`import { useFetcher } from 'react-router';

function TodoItem({ todo }) {
  const fetcher = useFetcher();

  // Optimistic UI — assume success immediately
  const isDeleting = fetcher.state !== 'idle' &&
    fetcher.formData?.get('intent') === 'delete';

  if (isDeleting) return null; // hide while deleting

  return (
    <div className="todo-item">
      <span>{todo.title}</span>

      {/* Toggle complete — POST to /todos/:id action */}
      <fetcher.Form method="post" action={\`/todos/\${todo.id}\`}>
        <input type="hidden" name="intent" value="toggle" />
        <button type="submit">
          {todo.completed ? 'Undo' : 'Complete'}
        </button>
      </fetcher.Form>

      {/* Delete */}
      <fetcher.Form method="post" action={\`/todos/\${todo.id}\`}>
        <input type="hidden" name="intent" value="delete" />
        <button type="submit">Delete</button>
      </fetcher.Form>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Error Handling with errorElement</h2>
      <p>
        When a loader or action throws (or returns a Response with an error
        status), React Router renders the nearest <code>errorElement</code>
        instead of the route&apos;s element. Errors bubble up the route tree
        until they hit one — a <code>middleware</code> that throws behaves the
        same way, so this is also how a rejected auth check in the next lesson
        ends up on screen.
      </p>

      <CodeBlock language="jsx" title="Route Error Boundaries">
{`import { useRouteError, isRouteErrorResponse } from 'react-router';

function RouteError() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    // Thrown Response (e.g., throw new Response("Not found", { status: 404 }))
    return (
      <div className="error-page">
        <h1>{error.status}</h1>
        <p>{error.statusText || error.data}</p>
      </div>
    );
  }

  // Unexpected error
  return (
    <div className="error-page">
      <h1>Something went wrong</h1>
      <p>{error?.message || 'Unknown error'}</p>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="defer() and json() Are Still Gone">
        If a tutorial shows <code>return defer({'{ ... }'})</code> or{' '}
        <code>return json(data)</code>, it&apos;s written against v6. Both were
        removed in v7 and stayed removed in v8 — nothing brought them back.
        Return a plain object; any value on it that&apos;s an un-awaited
        promise streams in automatically and is unwrapped with{' '}
        <code>&lt;Suspense&gt;</code> + <code>&lt;Await&gt;</code>, exactly as
        in v7.
      </InfoBox>

      <h2>What Actually Changed From v7 to v8</h2>
      <p>
        This is the part worth reading carefully — verified against the real{' '}
        <code>v8.0.0</code> entry in React Router&apos;s changelog, not
        assumed from the version bump.
      </p>

      <InfoBox variant="danger" title="useLoaderData() Was NOT Renamed">
        Despite what you may have heard, <code>useLoaderData()</code> itself
        is unchanged — same name, same signature, same behavior. What actually
        got renamed is narrower and easy to conflate with it: a{' '}
        <code>data</code> field on <em>route matches</em>, in two specific
        spots. Read on.
      </InfoBox>

      <p>
        <strong>1. <code>react-router-dom</code> is gone.</strong> In v7,
        everything DOM-specific moved into <code>react-router/dom</code>, but{' '}
        <code>react-router-dom</code> was kept around as a compatibility
        re-export so v6 imports kept working. v8 drops that re-export package
        entirely.
      </p>

      <CodeBlock language="jsx" title="Import swap required for v8">
{`// v6-style import — worked through all of v7 via the compat package,
// throws a resolve error in v8:
import { RouterProvider, Link, useNavigate } from 'react-router-dom';

// v8 (and the v7-recommended form, so this may already be a no-op for you):
import { RouterProvider } from 'react-router/dom'; // DOM-rendering APIs only
import { Link, useNavigate } from 'react-router';  // everything else`}
      </CodeBlock>

      <InfoBox variant="tip" title="Already Safe If You Followed the v7 Lesson">
        Every code sample on this site&apos;s v7 lessons already imports{' '}
        <code>RouterProvider</code> from <code>react-router/dom</code> and
        everything else from <code>react-router</code> — that was the
        recommended split as of v7, it just wasn&apos;t <em>enforced</em> yet.
        v8 enforces it by deleting the fallback package.
      </InfoBox>

      <p>
        <strong>2. <code>data</code> → <code>loaderData</code> on route
        matches — specifically in <code>meta()</code> and{' '}
        <code>useMatches()</code>.</strong> v7.8.0 added a <code>loaderData</code>{' '}
        field alongside the existing <code>data</code> field on{' '}
        <code>MetaArgs</code>, <code>MetaMatch</code>, and each item{' '}
        <code>useMatches()</code> returns (typed as <code>UIMatch</code>), for
        consistency with the <code>loaderData</code> name already used
        everywhere else. <code>data</code> was marked deprecated at the same
        time. v8.0.0 finished the job and removed the deprecated{' '}
        <code>data</code> field outright.
      </p>

      <CodeBlock language="jsx" title="meta() and useMatches() — the field that actually moved">
{`// v7 (data still worked, but was deprecated and warned in types)
export function meta({ data }) {
  return [{ title: data.name }];
}

// v8 (data is gone from these two APIs — use loaderData)
export function meta({ loaderData }) {
  return [{ title: loaderData.name }];
}

// Same rename applies to useMatches()
import { useMatches } from 'react-router';

function Breadcrumbs() {
  const matches = useMatches();
  // v7: matches[0].data      (deprecated)
  // v8: matches[0].loaderData
  return matches.map((m) => m.loaderData?.name).join(' / ');
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Scope of the Rename — Read This Twice If You're Migrating">
        This affects exactly two APIs: the <code>meta()</code> route export&apos;s
        arguments, and the objects <code>useMatches()</code> returns. It does{' '}
        <strong>not</strong> affect <code>useLoaderData()</code>,{' '}
        <code>useActionData()</code>, or the <code>loaderData</code> prop
        already passed to route components — those were never called{' '}
        <code>data</code> and are untouched. If your v7 app never used{' '}
        <code>meta()</code> or <code>useMatches()</code>, this change is a
        non-event for you.
      </InfoBox>

      <p>
        <strong>3. Middleware is stable and default-on</strong> — covered in
        depth in the next lesson, but relevant here because it changes where
        you might put logic that used to live only in a loader. <strong>4.
        Minimum versions moved:</strong> Node 22.22.0+, React 19.2.7+, Vite 7+,
        and the package is published ESM-only. None of that changes any code
        in this lesson — it&apos;s an upgrade-time constraint, not an API
        change.
      </p>

      <h2>Migrating a v7 Loader/Action to v8</h2>
      <p>
        For the loader/action code on this page specifically, the honest
        checklist is short:
      </p>
      <ul>
        <li>
          <strong>Loader and action bodies:</strong> no changes. Same params,
          same <code>request</code>, same return shape, same{' '}
          <code>useLoaderData()</code> / <code>useActionData()</code> on the
          other end.
        </li>
        <li>
          <strong>Imports:</strong> if anything still imports from{' '}
          <code>react-router-dom</code>, switch it to{' '}
          <code>react-router</code> / <code>react-router/dom</code> as shown
          above — this is the change most likely to actually break a v7 app on
          upgrade.
        </li>
        <li>
          <strong>Only if you export <code>meta()</code>:</strong> switch its
          destructured argument from <code>data</code> to{' '}
          <code>loaderData</code>.
        </li>
        <li>
          <strong>Only if you call <code>useMatches()</code>:</strong> read{' '}
          <code>match.loaderData</code> instead of <code>match.data</code>.
        </li>
        <li>
          <strong>Anything still on <code>defer()</code>/<code>json()</code>:</strong>{' '}
          that migration was already required for v7 and doesn&apos;t change
          again here.
        </li>
      </ul>

      <h2>Complete CRUD Example</h2>
      <CodeBlock language="jsx" title="Full CRUD Route with Loader + Action">
{`// routes/contacts.jsx
import { Form, useLoaderData, useActionData, redirect } from 'react-router';

export async function loader() {
  const res = await fetch('/api/contacts');
  if (!res.ok) throw new Response('Failed to load', { status: res.status });
  return res.json();
}

export async function action({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'create') {
    const name = formData.get('name');
    if (!name) return { error: 'Name required' };
    await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  }

  if (intent === 'delete') {
    const id = formData.get('id');
    await fetch(\`/api/contacts/\${id}\`, { method: 'DELETE' });
  }

  return redirect('/contacts');
}

export default function Contacts() {
  const contacts = useLoaderData();
  const actionData = useActionData();

  return (
    <div>
      <h1>Contacts</h1>

      <Form method="post">
        <input type="hidden" name="intent" value="create" />
        <input name="name" placeholder="New contact" />
        {actionData?.error && <p className="error">{actionData.error}</p>}
        <button type="submit">Add</button>
      </Form>

      <ul>
        {contacts.map((c) => (
          <li key={c.id}>
            {c.name}
            <Form method="post" style={{ display: 'inline' }}>
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={c.id} />
              <button type="submit">Delete</button>
            </Form>
          </li>
        ))}
      </ul>
    </div>
  );
}`}
      </CodeBlock>

    </LessonLayout>
  );
}
