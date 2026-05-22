import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Data Loading & Actions"
      sectionId="react-router"
      lessonIndex={2}
      prev={{ path: '/react-router/nested', label: 'Nested Routes & Outlets' }}
      next={{ path: '/react-router/guards', label: 'Auth Guards & Protected Routes' }}
    >
      <p>
        React Router v7 brings data loading and mutations into the routing layer.
        Instead of fetching in <code>useEffect</code> and managing loading states
        manually, you declare <strong>loaders</strong> (read) and{' '}
        <strong>actions</strong> (write) on each route. The router runs them
        before rendering, eliminating loading spinners, race conditions, and
        waterfall fetches.
      </p>

      <FlowChart
        title="Loader → Render → Action Lifecycle"
        chart={"graph TD\nA[Navigation or Form Submit] --> B{Is it a GET?}\nB -->|GET| C[Run loader functions]\nB -->|POST/PUT/DELETE| D[Run action function]\nC --> E[Provide data via useLoaderData]\nD --> F[Action processes mutation]\nF --> G[Revalidate - re-run loaders]\nG --> E\nE --> H[Render route component]\nH --> I[User sees fresh data]\nstyle A fill:#3b82f6,color:#fff\nstyle C fill:#8b5cf6,color:#fff\nstyle D fill:#ef4444,color:#fff\nstyle H fill:#10b981,color:#fff"}
      />

      <h2>Loader Functions</h2>
      <p>
        A <code>loader</code> is an async function that fetches data before the
        route renders. It receives the route params and the request. The component
        accesses the data with <code>useLoaderData()</code> — no loading state
        needed because the data is already there when the component mounts.
      </p>

      <CodeBlock language="jsx" title="Basic Loader">
{`// routes/UserProfile.jsx
import { useLoaderData } from 'react-router-dom';

// Loader runs before the component renders
export async function loader({ params, request }) {
  const url = new URL(request.url);
  const tab = url.searchParams.get('tab') || 'overview';

  const response = await fetch(\`/api/users/\${params.userId}\`);
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
{`import UserProfile, { loader as userLoader } from './routes/UserProfile';

const router = createBrowserRouter([
  {
    path: 'users/:userId',
    element: <UserProfile />,
    loader: userLoader,
    errorElement: <UserError />,
  },
]);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Parallel Data Loading">
        When navigating to a nested route, React Router runs <em>all</em> matched
        loaders in parallel — not in a waterfall. A route tree of{' '}
        <code>Root &gt; Dashboard &gt; UserProfile</code> fires all three loaders
        simultaneously. This is a massive performance win over sequential{' '}
        <code>useEffect</code> chains.
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
{`import { Form, useActionData, redirect } from 'react-router-dom';

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
        triggers the route&apos;s <strong>action</strong>.
      </InfoBox>

      <h2>useFetcher — Mutations Without Navigation</h2>
      <p>
        <code>useFetcher</code> lets you call loaders and actions without
        navigating away from the current page. Perfect for inline edits, toggles,
        adding to cart, or any mutation that shouldn&apos;t change the URL.
      </p>

      <CodeBlock language="jsx" title="useFetcher for Inline Actions">
{`import { useFetcher } from 'react-router-dom';

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

      <h2>useNavigation — Loading States</h2>
      <CodeBlock language="jsx" title="Global Loading Indicator">
{`import { useNavigation } from 'react-router-dom';

function RootLayout() {
  const navigation = useNavigation();

  // navigation.state: 'idle' | 'loading' | 'submitting'
  const isLoading = navigation.state === 'loading';
  const isSubmitting = navigation.state === 'submitting';

  return (
    <div>
      {(isLoading || isSubmitting) && (
        <div className="global-spinner">
          {isSubmitting ? 'Saving...' : 'Loading...'}
        </div>
      )}
      <Outlet />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Error Handling with errorElement</h2>
      <p>
        When a loader or action throws (or returns a Response with an error
        status), React Router renders the nearest <code>errorElement</code>
        instead of the route&apos;s element. This replaces the old{' '}
        <code>ErrorBoundary</code> pattern for route-level errors.
      </p>

      <CodeBlock language="jsx" title="Route Error Boundaries">
{`import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

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
}

// In route config — errors bubble up to nearest errorElement
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteError />,   // catches all unhandled errors
    children: [
      {
        path: 'users/:id',
        element: <UserProfile />,
        loader: userLoader,
        errorElement: <RouteError />, // catches errors in this subtree
      },
    ],
  },
]);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Error Bubbling">
        Errors bubble up the route tree until they hit an <code>errorElement</code>.
        If you only put one at the root, a loader failure deep in the tree replaces
        your entire page. Place <code>errorElement</code> on routes where you want
        granular error handling.
      </InfoBox>

      <h2>Deferred Data with defer &amp; Await</h2>
      <p>
        For non-critical data, use <code>defer</code> to start fetching immediately
        but render the page before it resolves. Wrap the deferred portion in{' '}
        <code>&lt;Suspense&gt;</code> and <code>&lt;Await&gt;</code>.
      </p>

      <CodeBlock language="jsx" title="Streaming with defer">
{`import { defer, Await, useLoaderData } from 'react-router-dom';
import { Suspense } from 'react';

export async function loader({ params }) {
  // Critical data — awaited before render
  const user = await fetch(\`/api/users/\${params.id}\`).then(r => r.json());

  // Non-critical — start fetching but don't block render
  const postsPromise = fetch(\`/api/users/\${params.id}/posts\`).then(r => r.json());
  const statsPromise = fetch(\`/api/users/\${params.id}/stats\`).then(r => r.json());

  return defer({
    user,                  // already resolved
    posts: postsPromise,   // still pending
    stats: statsPromise,   // still pending
  });
}

export default function UserProfile() {
  const { user, posts, stats } = useLoaderData();

  return (
    <div>
      {/* Renders immediately — user is already resolved */}
      <h1>{user.name}</h1>

      {/* Streams in when posts resolve */}
      <Suspense fallback={<p>Loading posts...</p>}>
        <Await resolve={posts} errorElement={<p>Failed to load posts</p>}>
          {(resolvedPosts) => (
            <ul>
              {resolvedPosts.map(p => <li key={p.id}>{p.title}</li>)}
            </ul>
          )}
        </Await>
      </Suspense>

      {/* Streams in when stats resolve */}
      <Suspense fallback={<p>Loading stats...</p>}>
        <Await resolve={stats}>
          {(resolvedStats) => <StatsPanel data={resolvedStats} />}
        </Await>
      </Suspense>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Complete CRUD Example</h2>
      <CodeBlock language="jsx" title="Full CRUD Route with Loader + Action">
{`// routes/contacts.jsx
import {
  Form, useLoaderData, useActionData, redirect,
} from 'react-router-dom';

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

      <InteractiveChallenge
        question={"After a Form method=\"post\" action completes successfully in React Router v7, what happens next?"}
        options={[
          "The page reloads from scratch",
          "Nothing — you must manually refetch data",
          "React Router revalidates all active loaders automatically",
          "The action's return value replaces the loader data",
        ]}
        correctIndex={2}
        explanation={"React Router automatically revalidates (re-runs) all active loaders after a successful action. This ensures the UI always reflects the latest server state without manual refetching. This is similar to how a traditional HTML form POST/redirect/GET cycle works."}
        language="jsx"
      />
    </LessonLayout>
  );
}
