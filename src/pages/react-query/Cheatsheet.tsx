import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactQueryCheatsheet() {
  return (
    <GuideLayout
      title="React Query"
      kicker="FIELD GUIDE"
      glyph="🔄"
      tagline="TanStack Query — server-state caching, mutations and Suspense integration for React 19."
      meta={['@tanstack/react-query', '10 panels']}
      page="1 / 1"
      footer="This page is for recall. The two lessons in this section carry the reasoning and the worked examples."
      prev={{ path: '/react-query/advanced', label: 'React Query: Advanced Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="The Mental Model" accent="blue" glyph="🧠" span={2}>
        <GuideDefs
          items={[
            ['queryKey', 'the cache address — same key = same cache entry, shared across components'],
            ['staleTime', 'when data becomes eligible for background refetch (default: 0 — always stale)'],
            ['gcTime', 'when unused cached data is garbage collected (default: 5 min)'],
            ['enabled', "gates the query — set false or a condition to delay fetching"],
            ['select', 'transforms data and scopes re-renders to just the selected slice'],
            ['invalidateQueries', 'marks data stale and triggers a background refetch for active consumers'],
            ['setQueryData', 'writes the cache directly — skips a round-trip refetch after a mutation'],
            ['onMutate', 'runs BEFORE the mutation — optimistic updates with rollback support'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={2} title="Setup" accent="purple" glyph="🏗️">
        <GuideCode>{`npm install @tanstack/react-query
npm install -D @tanstack/react-query-devtools

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, gcTime: 5 * 60_000, retry: 1 },
  },
});

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={3} title="useQuery — Status Fields" accent="green" glyph="📶">
        <GuideTable
          head={['Field', 'Meaning']}
          rows={[
            ['isLoading', 'true only on the first-ever fetch — no cached data yet'],
            ['isFetching', 'true any time a request is in flight, incl. background refetches'],
            ['isError / error', 'last request failed / the error object'],
            ['refetch', 'manually re-trigger the query'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={4} title="Query Key Patterns" accent="amber" glyph="🔑" span={2}>
        <GuideCode>{`useQuery({ queryKey: ['todos'], queryFn: fetchTodos });                       // global
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });   // per-id
useQuery({ queryKey: ['todos', { status, page }], queryFn: ... });            // per-filter

// Key factory — the production pattern once >1 query touches a domain
const todoKeys = {
  all: ['todos'] as const,
  detail: (id: number) => [...todoKeys.all, 'detail', id] as const,
};
queryClient.invalidateQueries({ queryKey: todoKeys.all });        // invalidate everything
queryClient.invalidateQueries({ queryKey: todoKeys.detail(42) }); // invalidate one`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={5} title="useMutation — Five Callbacks" accent="pink" glyph="✉️">
        <GuideCode>{`useMutation({
  mutationFn: (vars) => fetch(...).then(r => r.json()),
  onMutate:   async (vars) => { /* BEFORE the request — optimistic update */ },
  onSuccess:  (data, vars) => { /* request succeeded */ },
  onError:    (err, vars, context) => { /* request failed — roll back here */ },
  onSettled:  (data, err, vars) => { /* always runs, success or failure */ },
});`}</GuideCode>
        <GuideRules items={['Order they can fire: onMutate → mutationFn → (onSuccess or onError) → onSettled.']} />
      </GuidePanel>

      <GuidePanel n={6} title="Invalidate vs setQueryData" accent="cyan" glyph="⚖️">
        <GuideRules
          items={[
            'Default to invalidateQueries — one line, can never drift from the server.',
            "Reach for setQueryData only when the round-trip is actually noticeable AND you can reproduce the server's exact result (id, timestamps, derived fields and all).",
            "Otherwise you're caching a guess.",
          ]}
        />
      </GuidePanel>

      <GuidePanel n={7} title="Pagination & Infinite Scroll" accent="red" glyph="📜" span={2}>
        <GuideCode>{`// Page-by-page — old page stays visible while the next loads
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
const items = data?.pages.flatMap(p => p.items) ?? [];`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={8} title="Performance — select" accent="blue" glyph="🎯">
        <GuideCode>{`useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select: (t) => t.filter(x => x.done) });
useQuery({ queryKey: ['todos'], queryFn: fetchTodos, select: (t) => t.length });
// Both share the fetch. Each only re-renders when ITS selected slice changes.`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={9} title="Dependent & Parallel Queries" accent="purple" glyph="🔗">
        <GuideCode>{`const { data: user } = useQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) });
const { data: orders } = useQuery({
  queryKey: ['orders', user?.accountId],
  queryFn: () => fetchOrders(user.accountId),
  enabled: !!user?.accountId,   // sequential — waits for user
});`}</GuideCode>
        <GuideRules items={["Omitting 'enabled' on independent queries fires them all in parallel by default."]} />
      </GuidePanel>

      <GuidePanel n={10} title="React 19 Suspense" accent="green" glyph="⏳">
        <GuideCode>{`const { data: user } = useSuspenseQuery({ queryKey: ['user', id], queryFn: () => fetchUser(id) });
// No isLoading check needed — the Suspense boundary handles it.

<ErrorBoundary fallback={<ErrorUI />}>
  <Suspense fallback={<Skeleton />}><UserName /></Suspense>
</ErrorBoundary>`}</GuideCode>
      </GuidePanel>
    </GuideLayout>
  );
}
