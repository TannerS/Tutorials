import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactQueryFundamentals() {
  return (
    <LessonLayout
      title="React Query: Fundamentals"
      sectionId="react-query"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-query/advanced', label: 'React Query: Advanced Patterns' }}
    >
      <p>
        TanStack Query (formerly React Query) is the gold standard for managing server state in React.
        It handles caching, background refetching, stale data, loading/error states, pagination, and
        optimistic updates — things that are painful to hand-roll in a reducer and easy to get wrong.
      </p>

      <InfoBox variant="success" title="The Core Insight: Server State Is Not Your State">
        <p>
          Data from your API is a <strong>cache</strong> of someone else&apos;s data. It can become
          stale, change on the server while the user has a tab open, fail to load, or need
          refreshing. TanStack Query is built around this reality. You don&apos;t &quot;own&quot; server data
          — you subscribe to it, and the library keeps it fresh.
        </p>
      </InfoBox>

      <FlowChart
        title="TanStack Query — The Stale-While-Revalidate Model"
        chart={"graph TD\n  A[Component mounts] --> B{Data in cache?}\n  B -->|No| C[Fetch from server]\n  B -->|Yes, fresh| D[Return cached data]\n  B -->|Yes, stale| E[Return cached data immediately]\n  E --> F[Refetch in background]\n  C --> G[Cache data with key]\n  F --> H[Update cache when done]\n  G --> I[Render with fresh data]\n  H --> J[Re-render with updated data]\n  D --> I\n  style E fill:#f59e0b,color:#fff\n  style F fill:#3b82f6,color:#fff"}
      />

      <h2>Setup</h2>

      <CodeBlock language="bash" title="Install" showLineNumbers={false}>
{`npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Configure QueryClientProvider" showLineNumbers>
{`// main.jsx — wrap app with QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,      // data stays fresh for 1 min by default
      gcTime: 5 * 60 * 1000,     // unused data garbage collected after 5 min
      retry: 1,                  // retry failed requests once
      refetchOnWindowFocus: true, // refetch when user returns to tab
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MyApp />
      <ReactQueryDevtools initialIsOpen={false} /> {/* Dev tool panel */}
    </QueryClientProvider>
  );
}`}
      </CodeBlock>

      <h2>useQuery — The Foundation</h2>

      <p>
        <code>useQuery</code> fetches and caches data. Give it a key and a fetch function — it
        handles everything else: loading state, error state, caching, background updates.
      </p>

      <CodeBlock language="jsx" title="useQuery — Core Usage" showLineNumbers>
{`import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  const {
    data,       // The fetched data (undefined until first success)
    isLoading,  // True only on the FIRST load (no cached data yet)
    isFetching, // True whenever a request is in-flight (including background)
    isError,    // True if the last request failed
    error,      // The error object
    refetch,    // Function to manually trigger a refetch
  } = useQuery({
    queryKey: ['user', userId],           // Unique cache key — array, not string
    queryFn: () => fetchUser(userId),     // The fetch function
    staleTime: 5 * 60 * 1000,            // Override default: fresh for 5 min
    enabled: !!userId,                   // Only run if userId exists
  });

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return <div>{data.name}</div>;
}`}
      </CodeBlock>

      <InfoBox variant="info" title="isLoading vs isFetching">
        <p>
          <code>isLoading</code> is true only when there is <strong>no cached data and a request is
          in flight</strong> — the first time ever. <code>isFetching</code> is true any time a
          request is happening, including background refreshes. Use <code>isLoading</code> for your
          initial skeleton, use <code>isFetching</code> for a subtle &quot;refreshing&quot; indicator.
        </p>
      </InfoBox>

      <h2>Query Keys — The Cache Address</h2>

      <p>
        Query keys are how TanStack Query identifies, deduplicates, and invalidates cached data.
        They must uniquely describe the data being fetched. Arrays are the standard format.
      </p>

      <CodeBlock language="typescript" title="Query Key Patterns" showLineNumbers>
{`// Simple key — for global data with no parameters
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });

// Key with an ID — different cache entry per user
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });

// Key with filters — different cache entry per filter combination
useQuery({
  queryKey: ['todos', { status: 'done', page: 2 }],
  queryFn: () => fetchTodos({ status: 'done', page: 2 }),
});

// Key factory pattern — centralize key structure for a domain
// (Prevents key string typos across your app)
const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: Filters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
};

// Usage — consistent, refactorable
useQuery({ queryKey: todoKeys.detail(42), queryFn: () => fetchTodo(42) });

// Invalidate all todo queries (any key starting with ['todos'])
queryClient.invalidateQueries({ queryKey: todoKeys.all });

// Invalidate just todo #42's detail
queryClient.invalidateQueries({ queryKey: todoKeys.detail(42) });`}
      </CodeBlock>

      <h2>useMutation — Writing Data</h2>

      <CodeBlock language="jsx" title="useMutation — Create, Update, Delete" showLineNumbers>
{`import { useMutation, useQueryClient } from '@tanstack/react-query';

function AddTodoForm() {
  const queryClient = useQueryClient();

  const { mutate, mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (newTodo) => fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(newTodo),
    }).then(r => r.json()),

    onSuccess: (data) => {
      // Pick ONE of these two — they are alternatives, not a sequence.
      // (Doing both writes the item, then immediately throws that write away
      //  when the refetch returns. Harmless, but pointless.)

      // (a) Invalidate: simplest and always correct. Costs a round-trip.
      queryClient.invalidateQueries({ queryKey: ['todos'] });

      // (b) Write the cache directly: no round-trip, but YOU are now
      //     responsible for matching what the server would have returned.
      //     Note the ?? [] — 'old' is undefined if nothing is cached yet,
      //     and spreading undefined throws.
      // queryClient.setQueryData(['todos'], (old) => [...(old ?? []), data]);
    },

    onError: (error) => {
      toast.error('Failed to add todo: ' + error.message);
    },

    onSettled: () => {
      // Runs after either success or error
      // Good for clearing spinners regardless of outcome
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ text: e.target.text.value, done: false });
    // mutateAsync returns a Promise if you need to await it
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="text" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add Todo'}
      </button>
      {isError && <p>{error.message}</p>}
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Invalidate or Write? A Rule You Can Apply">
        <p>
          Default to <code>invalidateQueries</code>. It is one line, it cannot drift
          from the server, and the refetch is usually invisible because the stale data
          stays on screen while it runs. Reach for <code>setQueryData</code> only when
          you can answer yes to both: <em>is the round-trip actually noticeable?</em>{' '}
          and <em>can I reproduce the server&apos;s result exactly?</em>
        </p>
        <p style={{ marginBottom: 0 }}>
          That second question is the one people skip. If the server assigns the id,
          stamps <code>createdAt</code>, computes a derived total, or applies its own
          sort order, then a hand-written cache entry is a <em>guess</em> at the
          server&apos;s state — and the UI will show that guess until something else
          invalidates it. Using the mutation&apos;s <em>response</em> (as above, where{' '}
          <code>data</code> is what the POST returned) rather than the values you sent
          avoids most of this.
        </p>
      </InfoBox>

      <h2>Pagination</h2>

      <CodeBlock language="jsx" title="Paginated Queries — keepPreviousData" showLineNumbers>
{`import { useQuery, keepPreviousData } from '@tanstack/react-query';

function TodoList() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData } = useQuery({
    queryKey: ['todos', page],
    queryFn: () => fetchTodos({ page, limit: 10 }),
    placeholderData: keepPreviousData, // Show previous page while next loads
    staleTime: 30 * 1000,
  });

  return (
    <div>
      {/* isPlaceholderData is true while new page loads — show subtle indicator */}
      <ul style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
        {data?.todos.map(todo => <li key={todo.id}>{todo.text}</li>)}
      </ul>

      <div>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {data?.totalPages}</span>
        <button
          disabled={isPlaceholderData || page === data?.totalPages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Next: Advanced Patterns">
        <p>
          Fundamentals covers reading and writing data. The next lesson builds on this with
          optimistic updates, infinite scroll, prefetching, <code>select</code>-based subscriptions,
          dependent queries, React 19 Suspense integration, and the custom-hook pattern every
          production codebase eventually reaches for.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
