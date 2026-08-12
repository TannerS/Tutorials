import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactQuery() {
  return (
    <LessonLayout
      title="TanStack Query (React Query)"
      sectionId="state-mgmt"
      lessonIndex={5}
      prev={{ path: '/state-mgmt/patterns', label: 'Real-World Patterns' }}
      next={null}
    >
      <p>
        TanStack Query (formerly React Query) is the gold standard for managing server state in React.
        It handles caching, background refetching, stale data, loading/error states, pagination, and
        optimistic updates — things that are painful to build manually and error-prone with Redux.
      </p>

      <InfoBox variant="success" title="The Core Insight: Server State Is Not Your State">
        <p>
          Data from your API is a <strong>cache</strong> of someone else's data. It can become
          stale, change on the server while the user has a tab open, fail to load, or need
          refreshing. TanStack Query is built around this reality. You don't "own" server data
          — you subscribe to it, and the library keeps it fresh.
        </p>
      </InfoBox>

      <FlowChart
        title="TanStack Query — The Stale-While-Revalidate Model"
        chart={"graph TD\n  A[Component mounts] --> B{Data in cache?}\n  B -->|No| C[Fetch from server]\n  B -->|Yes, fresh| D[Return cached data]\n  B -->|Yes, stale| E[Return cached data immediately]\n  E --> F[Refetch in background]\n  C --> G[Cache data with key]\n  F --> H[Update cache when done]\n  G --> I[Render with fresh data]\n  H --> J[Re-render with updated data]\n  D --> I\n  style E fill:#f59e0b,color:#fff\n  style F fill:#3b82f6,color:#fff"}
      />

      <h2>Setup</h2>

      <CodeBlock language="jsx" title="Install and configure QueryClientProvider" showLineNumbers>
{`npm install @tanstack/react-query

// main.jsx — wrap app with QueryClientProvider
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
          initial skeleton, use <code>isFetching</code> for a subtle "refreshing" indicator.
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
      // Invalidate so the list refetches with the new item
      queryClient.invalidateQueries({ queryKey: ['todos'] });

      // OR: directly update the cache without refetching (faster)
      queryClient.setQueryData(['todos'], (old) => [...old, data]);
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

      <h2>Optimistic Updates — Instant UI Feedback</h2>

      <p>
        Optimistic updates show the result of a mutation immediately, then roll back if the server
        rejects it. TanStack Query's <code>onMutate</code> callback enables this pattern cleanly.
      </p>

      <CodeBlock language="jsx" title="Optimistic Updates — Toggle Todo" showLineNumbers>
{`const queryClient = useQueryClient();

const toggleTodo = useMutation({
  mutationFn: ({ id, done }) =>
    fetch(\`/api/todos/\${id}\`, {
      method: 'PATCH',
      body: JSON.stringify({ done }),
    }).then(r => r.json()),

  onMutate: async ({ id, done }) => {
    // 1. Cancel any in-flight refetches (they would overwrite our optimistic update)
    await queryClient.cancelQueries({ queryKey: ['todos'] });

    // 2. Snapshot the previous value
    const previousTodos = queryClient.getQueryData(['todos']);

    // 3. Optimistically update the cache
    queryClient.setQueryData(['todos'], (old) =>
      old.map(todo => todo.id === id ? { ...todo, done } : todo)
    );

    // 4. Return snapshot for rollback
    return { previousTodos };
  },

  onError: (error, variables, context) => {
    // Roll back to snapshot on failure
    queryClient.setQueryData(['todos'], context.previousTodos);
    toast.error('Update failed — changes reverted');
  },

  onSettled: () => {
    // Always refetch after settle to sync with server
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});`}
      </CodeBlock>

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

      <h2>Infinite Queries — Load More / Infinite Scroll</h2>

      <CodeBlock language="jsx" title="useInfiniteQuery — Infinite Scroll" showLineNumbers>
{`import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    // getNextPageParam returns undefined when there are no more pages
  });

  // data.pages is an array of page results, each has its items
  const posts = data?.pages.flatMap(page => page.posts) ?? [];

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No More Posts'}
      </button>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Prefetching — Anticipate Navigation</h2>

      <CodeBlock language="jsx" title="Prefetch on Hover — Zero-Latency Navigation" showLineNumbers>
{`import { useQueryClient } from '@tanstack/react-query';

function PostLink({ post }) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    // Prefetch when user hovers — by the time they click, data is cached
    queryClient.prefetchQuery({
      queryKey: ['post', post.id],
      queryFn: () => fetchPost(post.id),
      staleTime: 10 * 1000, // Don't prefetch if data is still fresh
    });
  };

  return (
    <Link to={\`/posts/\${post.id}\`} onMouseEnter={prefetch}>
      {post.title}
    </Link>
  );
}

// Server-side prefetching (Next.js App Router with TanStack Query)
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

async function PostsPage() {
  const queryClient = new QueryClient();

  // Prefetch on the server so client gets it instantly
  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PostList />
    </HydrationBoundary>
  );
}`}
      </CodeBlock>

      <h2>select — Transform and Subscribe to Slices</h2>

      <InfoBox variant="tip" title="select Prevents Unnecessary Re-renders">
        <p>
          The <code>select</code> option transforms the data before returning it to the component.
          More importantly, the component only re-renders when the selected value changes — not when
          any part of the raw query data changes. This is the TanStack Query equivalent of a selector.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="select — Derive and Subscribe Efficiently" showLineNumbers>
{`// Full query result stays in cache, but component only sees filtered view
function DoneTodos() {
  const doneTodos = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (todos) => todos.filter(t => t.done),
    // Component only re-renders when the count/content of done todos changes
  });

  return <ul>{doneTodos.data?.map(t => <li key={t.id}>{t.text}</li>)}</ul>;
}

function TodoCount() {
  const { data: count } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    select: (todos) => todos.length,
    // Only re-renders when the total count changes
  });

  return <span>{count} todos</span>;
}

// Both components share the SAME ['todos'] cache entry —
// the full list is fetched once, both components derive their own view`}
      </CodeBlock>

      <h2>Dependent Queries — Sequential Fetching</h2>

      <CodeBlock language="jsx" title="Sequential Queries — Fetch B After A" showLineNumbers>
{`function UserOrders({ userId }) {
  // Step 1: fetch user
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // Step 2: fetch orders ONLY when user.accountId is available
  const { data: orders } = useQuery({
    queryKey: ['orders', user?.accountId],
    queryFn: () => fetchOrders(user.accountId),
    enabled: !!user?.accountId, // The key — disabled until user loads
  });

  return (
    <div>
      {orders?.map(o => <OrderCard key={o.id} order={o} />)}
    </div>
  );
}

// Parallel queries — fetch multiple things at once
function Dashboard({ userId }) {
  const userQuery = useQuery({ queryKey: ['user', userId], queryFn: ... });
  const postsQuery = useQuery({ queryKey: ['posts', userId], queryFn: ... });
  const statsQuery = useQuery({ queryKey: ['stats', userId], queryFn: ... });

  // All 3 requests fire simultaneously — no artificial waterfall
}`}
      </CodeBlock>

      <h2>Integration with React 19 Suspense</h2>

      <CodeBlock language="jsx" title="TanStack Query + Suspense + Error Boundaries" showLineNumbers>
{`import { useSuspenseQuery } from '@tanstack/react-query';

// useSuspenseQuery always returns data (never undefined)
// — it suspends until data is available
function UserName({ userId }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <h1>{user.name}</h1>; // data is guaranteed non-null here
}

// Parent handles loading and error states via boundaries
function UserPage({ userId }) {
  return (
    <ErrorBoundary fallback={<ErrorUI />}>
      <Suspense fallback={<Skeleton />}>
        <UserName userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// useSuspenseQueries — parallel with Suspense
import { useSuspenseQueries } from '@tanstack/react-query';

function Dashboard({ userId }) {
  const [userResult, statsResult] = useSuspenseQueries({
    queries: [
      { queryKey: ['user', userId], queryFn: () => fetchUser(userId) },
      { queryKey: ['stats', userId], queryFn: () => fetchStats(userId) },
    ],
  });

  return (
    <div>
      <h1>{userResult.data.name}</h1>
      <StatPanel stats={statsResult.data} />
    </div>
  );
}`}
      </CodeBlock>

      <h2>Custom Hook Pattern</h2>

      <InfoBox variant="tip" title="Wrap Every Query in a Custom Hook">
        <p>
          Never call <code>useQuery</code> directly in components. Wrap each query in a custom
          hook — this centralizes the query key, queryFn, and options in one place. If the API
          changes or you want to adjust staleTime, you change it in one file, not everywhere.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Custom Hook Pattern — useUser, useUserPosts" showLineNumbers>
{`// hooks/useUser.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Key factory — all user-related keys in one place
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
};

export function useUser(userId: number) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => api.users.get(userId),
    staleTime: 5 * 60 * 1000,
    enabled: userId > 0,
  });
}

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: [...userKeys.lists(), filters],
    queryFn: () => api.users.list(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      api.users.update(id, data),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.detail(updatedUser.id), updatedUser);
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// Usage in component — clean and simple
function UserPage({ userId }: { userId: number }) {
  const { data: user, isLoading } = useUser(userId);
  const updateUser = useUpdateUser();

  if (isLoading) return <Skeleton />;

  return (
    <button onClick={() => updateUser.mutate({ id: userId, data: { name: 'New Name' } })}>
      {updateUser.isPending ? 'Saving...' : user?.name}
    </button>
  );
}`}
      </CodeBlock>

      <h2>Key Concepts Summary</h2>

      <InfoBox variant="success" title="TanStack Query Mental Model">
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

      <FlowChart
        title="Mutation Lifecycle"
        chart={"graph TD\n  A[mutate called] --> B[onMutate - snapshot + optimistic update]\n  B --> C[mutationFn called - API request]\n  C --> D{Success?}\n  D -->|Yes| E[onSuccess - invalidate or update cache]\n  D -->|No| F[onError - rollback from snapshot]\n  E --> G[onSettled - cleanup]\n  F --> G"}
      />
    </LessonLayout>
  );
}
