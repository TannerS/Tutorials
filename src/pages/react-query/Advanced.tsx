import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactQueryAdvanced() {
  return (
    <LessonLayout
      title="React Query: Advanced Patterns"
      sectionId="react-query"
      lessonIndex={1}
      prev={{ path: '/react-query/fundamentals', label: 'React Query: Fundamentals' }}
      next={{ path: '/react-query/cheatsheet', label: 'React Query Cheat Sheet' }}
    >
      <p>
        You already know <code>useQuery</code>, <code>useMutation</code>, query keys, and pagination
        from the last lesson. This one is everything that turns a basic data-fetching setup into a
        production one: optimistic updates, infinite scroll, prefetching, scoped subscriptions,
        sequential queries, React 19 Suspense integration, and the custom-hook pattern that keeps
        all of it organized as an app grows.
      </p>

      <h2>Optimistic Updates — Instant UI Feedback</h2>

      <p>
        Optimistic updates show the result of a mutation immediately, then roll back if the server
        rejects it. TanStack Query&apos;s <code>onMutate</code> callback enables this pattern cleanly.
      </p>

      <InfoBox variant="info" title='Two Different Things Both Called "Optimistic"'>
        The <code>onSuccess</code> + <code>setQueryData</code> pattern from the Fundamentals lesson
        writes the cache <strong>after</strong> the server confirms — the user still waits for the
        request. What follows is different: <code>onMutate</code> runs{' '}
        <strong>before</strong> the request is even sent, so the UI updates on the same
        frame as the click and the network round-trip happens invisibly behind it.
        That speed is why it needs the snapshot-and-rollback machinery: you have
        shown the user something that may yet turn out to be false.
      </InfoBox>

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

      <FlowChart
        title="Mutation Lifecycle"
        chart={"graph TD\n  A[mutate called] --> B[onMutate - snapshot + optimistic update]\n  B --> C[mutationFn called - API request]\n  C --> D{Success?}\n  D -->|Yes| E[onSuccess - invalidate or update cache]\n  D -->|No| F[onError - rollback from snapshot]\n  E --> G[onSettled - cleanup]\n  F --> G"}
      />
    </LessonLayout>
  );
}
