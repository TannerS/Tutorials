import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Data() {
  return (
    <LessonLayout
      title="Data Fetching Patterns"
      sectionId="react-router-v5"
      lessonIndex={2}
      prev={{ path: '/react-router-v5/nested', label: 'Nested Routes' }}
      next={{ path: '/react-router-v5/guards', label: 'Auth Guards & Protected Routes' }}
    >
      <p>
        React Router v5 has <strong>no data loading layer</strong>. There is no{' '}
        <code>loader</code>, no <code>action</code>, no{' '}
        <code>useLoaderData()</code> — those are a v6.4+/v7/v8 concept called the{' '}
        <em>data router</em>, and v5 predates it entirely. In a v5 app, every
        route component is responsible for fetching its own data, the same way
        any React component always has been: <code>useEffect</code> plus{' '}
        <code>fetch</code> (or axios), with <code>useState</code> tracking
        loading and error status by hand.
      </p>

      <p>
        This lesson teaches that real, honest v5-era pattern — not a preview of
        loaders wearing a v5 costume. If you already know v6.4+/v7/v8, treat this
        as &ldquo;what the industry did before the router took over data
        fetching,&rdquo; because that is exactly what it is, and it is still
        what you will find in most production v5 codebases today.
      </p>

      <FlowChart
        title="How Data Gets Onto the Screen in v5"
        chart={"graph TD\nA[Route matches, component mounts] --> B[Render with loading=true, data=null]\nB --> C[useEffect fires after paint]\nC --> D[fetch or axios call starts]\nD --> E{Response ok?}\nE -->|Yes| F[setData, setLoading false]\nE -->|No| G[setError, setLoading false]\nF --> H[Re-render with data]\nG --> I[Re-render with error UI]\nstyle A fill:#1a2744\nstyle C fill:#2a1f44\nstyle F fill:#1a3329\nstyle G fill:#3b1a1a"}
      />

      <h2>The useEffect + fetch Pattern</h2>
      <p>
        This is the baseline. The component reads the route param with{' '}
        <code>useParams()</code> (added in v5.1 — earlier v5 code read params
        off <code>props.match.params</code> instead), fetches on mount, and
        tracks three pieces of state: is it loading, did it error, and what did
        it get back.
      </p>

      <CodeBlock language="jsx" title="Basic fetch-on-mount, v5 style">
{`// routes/UserProfile.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function UserProfile() {
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(\`/api/users/\${userId}\`)
      .then((res) => {
        if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [userId]); // re-run whenever the route param changes

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return null;

  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Three States, Every Time">
        <code>loading</code> / <code>error</code> / <code>data</code> is the
        boilerplate that v6.4+ loaders exist specifically to eliminate. In v5
        you write it by hand in every component that fetches — there is no
        shortcut built into the router. Extracting it into a reusable hook (see
        below) is the closest v5 gets to that convenience.
      </InfoBox>

      <h2>The Param-Change Gotcha</h2>
      <p>
        React Router does not unmount and remount your component just because
        the URL param changed. Navigating from <code>/users/1</code> to{' '}
        <code>/users/2</code> matches the <em>same</em> <code>&lt;Route&gt;</code>{' '}
        and reuses the <em>same</em> component instance — only the props
        change. That means the dependency array on your <code>useEffect</code>{' '}
        is not optional decoration. Leave it off, or leave{' '}
        <code>userId</code> out of it, and the component silently keeps
        showing the previous user&apos;s data after the URL has already
        changed.
      </p>

      <CodeBlock language="jsx" title="The bug — missing dependency">
{`// BUG: fetches once on first mount, then never again.
// Clicking from /users/1 to /users/2 updates the URL and the params,
// but this effect never re-runs, so the old user's data just sits there.
useEffect(() => {
  fetch(\`/api/users/\${userId}\`)
    .then((res) => res.json())
    .then(setUser);
}, []); // <- userId is read inside, but missing from the array`}
      </CodeBlock>

      <InfoBox variant="warning" title="ESLint Catches This — Use It">
        The <code>react-hooks/exhaustive-deps</code> rule flags exactly this
        mistake. If your v5 project doesn&apos;t have{' '}
        <code>eslint-plugin-react-hooks</code> wired in, add it — this bug is
        one of the most common causes of &ldquo;stale data after navigating&rdquo;
        bug reports in real v5 codebases.
      </InfoBox>

      <h2>Race Conditions on Fast Navigation</h2>
      <p>
        There is a second, sneakier bug even with the dependency array fixed.
        If a user clicks from <code>/users/1</code> to <code>/users/2</code>{' '}
        quickly, two fetches are in flight at once. If the request for user 1
        happens to resolve <em>after</em> the request for user 2 (slow network,
        server load, anything), the effect for user 1 calls{' '}
        <code>setUser</code> last and overwrites user 2&apos;s data on a page
        that is now displaying user 2&apos;s URL. React Router does not protect
        you from this — the data router in v6.4+ automatically cancels stale
        navigations, but v5 has no such mechanism. You have to guard it
        yourself.
      </p>

      <CodeBlock language="jsx" title="Guarding against out-of-order responses">
{`useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setError(null);

  fetch(\`/api/users/\${userId}\`)
    .then((res) => {
      if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
      return res.json();
    })
    .then((data) => {
      if (!cancelled) setUser(data); // ignore if a newer request already landed
    })
    .catch((err) => {
      if (!cancelled) setError(err.message);
    })
    .finally(() => {
      if (!cancelled) setLoading(false);
    });

  // Cleanup runs before the next effect (new userId) or on unmount —
  // flips the flag so a still-pending fetch from the OLD userId is ignored.
  return () => {
    cancelled = true;
  };
}, [userId]);`}
      </CodeBlock>

      <p>
        <code>AbortController</code> is the more thorough version of the same
        idea — it actually cancels the in-flight network request instead of
        just ignoring its result:
      </p>

      <CodeBlock language="jsx" title="Same guard, with AbortController">
{`useEffect(() => {
  const controller = new AbortController();
  setLoading(true);
  setError(null);

  fetch(\`/api/users/\${userId}\`, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
      return res.json();
    })
    .then(setUser)
    .catch((err) => {
      if (err.name !== 'AbortError') setError(err.message);
    })
    .finally(() => setLoading(false));

  return () => controller.abort();
}, [userId]);`}
      </CodeBlock>

      <h2>Extracting a Reusable useFetch Hook</h2>
      <p>
        Writing the loading/error/cancellation boilerplate in every route
        component gets old fast. The typical v5-era fix is a small custom hook
        — not a router feature, just ordinary React composition:
      </p>

      <CodeBlock language="jsx" title="hooks/useFetch.js">
{`import { useEffect, useState } from 'react';

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(\`Request failed: \${res.status}\`);
        return res.json();
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Usage in a route component
function UserProfile() {
  const { userId } = useParams();
  const { data: user, loading, error } = useFetch(\`/api/users/\${userId}\`);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <h1>{user.name}</h1>;
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Where Redux Fit Into This">
        A large share of real v5 codebases didn&apos;t call <code>fetch</code>{' '}
        directly from the component at all — they dispatched a Redux thunk
        (<code>dispatch(fetchUser(userId))</code>) from the same{' '}
        <code>useEffect</code>, and the thunk set <code>loading</code>/
        <code>error</code>/<code>data</code> in the store instead of local
        state. The shape of the problem is identical; only where the three
        booleans/values live changes. Later, libraries like React Query and
        SWR were layered on top of v5&apos;s router to add caching,
        deduplication, and background revalidation — all still living entirely
        in the component tree, because v5&apos;s router itself never gained an
        opinion about data.
      </InfoBox>

      <h2>What v5 Does Not Have</h2>
      <p>
        Worth stating plainly, since it&apos;s easy to half-remember a v6.4+
        tutorial and go looking for these in v5:
      </p>
      <ul>
        <li>
          No <code>loader</code> / <code>action</code> route config options —{' '}
          <code>&lt;Route&gt;</code> in v5 only accepts{' '}
          <code>component</code>, <code>render</code>, or{' '}
          <code>children</code>.
        </li>
        <li>
          No <code>useLoaderData()</code>, <code>useActionData()</code>,{' '}
          <code>useNavigation()</code>, or <code>useFetcher()</code> — none of
          these hooks exist in the <code>react-router-dom@5</code> package.
        </li>
        <li>
          No automatic revalidation after a mutation — if you POST new data,{' '}
          <em>you</em> decide when and how to refetch (usually by calling the
          same fetch function again after the POST resolves).
        </li>
        <li>
          No router-level code splitting API. Lazy-loading a route&apos;s
          component in v5 uses plain React —{' '}
          <code>React.lazy(() =&gt; import('./UserProfile'))</code> wrapped in{' '}
          <code>&lt;Suspense&gt;</code> — the same mechanism you&apos;d use
          anywhere else in a v5 app. That has always been a React feature, not
          a router one, in any version.
        </li>
      </ul>

      <InfoBox variant="info" title="What v6.4+/v7/v8 Changed (Briefly)">
        Later versions moved data fetching into the route config itself:
        a <code>loader</code> runs <em>before</em> the component renders, so
        there&apos;s no loading flash and no manual dependency-array
        bookkeeping, and the router cancels stale navigations for you. That is
        a router-level solution to the exact race condition and staleness
        problems shown above. It doesn&apos;t make the v5 pattern wrong — it
        was the standard for years and still works fine — it just means v5
        pushes that responsibility onto you, the component author.
      </InfoBox>

      <h2>Complete Example: List + Detail</h2>
      <p>
        A realistic pairing — a list route that fetches a collection, and a
        detail route (nested under it) that fetches one item by param. Both
        use the same three-state shape, independently.
      </p>

      <CodeBlock language="jsx" title="A list route and a detail route, each fetching their own data">
{`// routes/PostList.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/posts')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load posts');
        return res.json();
      })
      .then((data) => { if (!cancelled) setPosts(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []); // no params — fetch once on mount

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link to={\`/posts/\${post.id}\`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  );
}

// routes/PostDetail.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(\`/api/posts/\${postId}\`)
      .then((res) => {
        if (!res.ok) throw new Error('Post not found');
        return res.json();
      })
      .then((data) => { if (!cancelled) setPost(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]); // re-fetch when the :postId param changes

  if (loading) return <p>Loading post...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!post) return null;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.body}</p>
    </article>
  );
}

// App.jsx — wiring them up
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { PostList } from './routes/PostList';
import { PostDetail } from './routes/PostDetail';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/posts" component={PostList} />
        <Route path="/posts/:postId" component={PostDetail} />
      </Switch>
    </Router>
  );
}`}
      </CodeBlock>

    </LessonLayout>
  );
}
