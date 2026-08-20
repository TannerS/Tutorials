import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactQueryCheatsheet() {
  return (
    <LessonLayout
      title="React Query Cheat Sheet"
      sectionId="react-query"
      lessonIndex={2}
      prev={{ path: '/react-query/advanced', label: 'React Query: Advanced Patterns' }}
      next={null}
    >
      <p>
        A single-page reconciliation of both lessons that precede this one — every option, every
        hook, and the mental model tying them together.
      </p>

      <h2>The Mental Model</h2>

      <InfoBox variant="success" title="Every Option Traces Back to One Idea">
        <ul>
          <li><strong>queryKey</strong> is the cache address — same key = same cache entry, shared across all components</li>
          <li><strong>staleTime</strong> controls when data is considered stale and eligible for background refetch (default: 0 — always stale)</li>
          <li><strong>gcTime</strong> controls when unused cached data is garbage collected (default: 5 minutes)</li>
          <li><strong>enabled</strong> gates the query — set to <code>false</code> or a condition to prevent fetching until ready</li>
          <li><strong>select</strong> transforms data and scopes re-renders to just the selected slice</li>
          <li><strong>invalidateQueries</strong> marks cached data as stale and triggers a background refetch for any active consumer</li>
          <li><strong>setQueryData</strong> directly writes to the cache — use after mutations to avoid a round-trip refetch</li>
          <li><strong>onMutate</strong> runs before the mutation — use it for optimistic updates with rollback support</li>
        </ul>
      </InfoBox>

      <h2>Setup</h2>

      <CodeBlock language="bash" title="Install" showLineNumbers={false}>
{`npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Minimal provider setup">
{`const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000, gcTime: 5 * 60 * 1000, retry: 1 },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>`}
      </CodeBlock>

      <h2>Reading Data — useQuery</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Field</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>isLoading</code></td>
            <td style={{ padding: '0.75rem' }}>True only on the first-ever fetch — no cached data exists yet</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>isFetching</code></td>
            <td style={{ padding: '0.75rem' }}>True any time a request is in flight, including silent background refetches</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>isError</code> / <code>error</code></td>
            <td style={{ padding: '0.75rem' }}>Last request failed / the error object</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>refetch</code></td>
            <td style={{ padding: '0.75rem' }}>Manually re-trigger the query</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="typescript" title="Query key patterns, cheapest to most structured">
{`useQuery({ queryKey: ['todos'], queryFn: fetchTodos });                       // global
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });   // per-id
useQuery({ queryKey: ['todos', { status, page }], queryFn: ... });            // per-filter

// Key factory — the production pattern once >1 query touches a domain
const todoKeys = {
  all: ['todos'] as const,
  detail: (id: number) => [...todoKeys.all, 'detail', id] as const,
};
queryClient.invalidateQueries({ queryKey: todoKeys.all });      // invalidate everything
queryClient.invalidateQueries({ queryKey: todoKeys.detail(42) }); // invalidate one`}
      </CodeBlock>

      <h2>Writing Data — useMutation</h2>

      <CodeBlock language="jsx" title="The five callbacks, in the order they can fire">
{`useMutation({
  mutationFn: (vars) => fetch(...).then(r => r.json()),
  onMutate: async (vars) => { /* BEFORE the request — optimistic update */ },
  onSuccess: (data, vars) => { /* request succeeded */ },
  onError: (err, vars, context) => { /* request failed — roll back here */ },
  onSettled: (data, err, vars) => { /* always runs, success or failure */ },
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Invalidate vs setQueryData — the decision rule">
        <p>
          Default to <code>invalidateQueries</code> — one line, can never drift from the server.
          Reach for <code>setQueryData</code> only when the round-trip is actually noticeable{' '}
          <em>and</em> you can reproduce the server&apos;s exact result (id, timestamps, derived
          fields and all). Otherwise you&apos;re caching a guess.
        </p>
      </InfoBox>

      <h2>Pagination &amp; Infinite Scroll</h2>

      <CodeBlock language="jsx" title="keepPreviousData vs useInfiniteQuery">
{`// Page-by-page — old page stays visible while the next loads
useQuery({
  queryKey: ['todos', page],
  queryFn: () => fetchTodos({ page }),
  placeholderData: keepPreviousData,
});

// Load-more / infinite scroll
const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
});
const items = data?.pages.flatMap(p => p.items) ?? [];`}
      </CodeBlock>

      <h2>Performance — select</h2>

      <CodeBlock language="jsx" title="Two components, one cache entry, independent re-render scopes">
{`useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select: (t) => t.filter(x => x.done) });
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select: (t) => t.length });
// Both share the fetch. Each only re-renders when ITS selected slice changes.`}
      </CodeBlock>

      <h2>Sequencing — Dependent &amp; Parallel Queries</h2>

      <CodeBlock language="jsx" title="enabled gates a query until its dependency is ready">
{`const { data: user } = useQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) });
const { data: orders } = useQuery({
  queryKey: ['orders', user?.accountId],
  queryFn: () => fetchOrders(user.accountId),
  enabled: !!user?.accountId,   // sequential — waits for user
});
// Omitting 'enabled' on independent queries fires them all in parallel by default.`}
      </CodeBlock>

      <h2>React 19 Suspense</h2>

      <CodeBlock language="jsx" title="useSuspenseQuery — data is never undefined">
{`const { data: user } = useSuspenseQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) });
// No isLoading check needed — the Suspense boundary handles it.
<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Skeleton />}><UserName /></Suspense>
</ErrorBoundary>`}
      </CodeBlock>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="Both lessons, in reading order">
{`1. React Query: Fundamentals       Setup, useQuery, query keys, useMutation, pagination
2. React Query: Advanced Patterns  Optimistic updates, infinite queries, prefetching, select,
                                    dependent queries, Suspense, custom hook pattern
3. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
