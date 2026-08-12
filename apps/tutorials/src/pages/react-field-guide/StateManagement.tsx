import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideStateManagement() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React + TypeScript · Field Reference"
      title="State Management"
      tagline="Redux Toolkit, Zustand, TanStack Query, and Jotai side by side — the setup, the gotcha, and when to reach for each."
      meta={['Redux · Zustand · Query', '12 patterns']}
      footerLabel="Personal study reference — State Management"
      pageLabel="React + TS Field Guide · State Management"
      prev={{ path: '/react-field-guide/typing-react', label: 'Typing React' }}
      next={{ path: '/react-field-guide/router', label: 'React Router v7' }}
    >
      <PosterCard
        glyph="RTK"
        title={<>Redux Toolkit — <span className="dim">store</span></>}
        code={`const store = configureStore({
  reducer: { todos: todosReducer, auth: authReducer },
});
// DevTools + thunk middleware + dev checks — all built in
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;`}
        caption="configureStore replaces createStore plus manual middleware wiring. When someone says 'Redux' today they mean Redux Toolkit — nobody hand-writes reducers or action-type strings anymore."
      />

      <PosterCard
        glyph="Sl"
        title={<>createSlice<span className="dim">()</span></>}
        code={`const todosSlice = createSlice({
  name: 'todos',
  initialState: { items: [] },
  reducers: {
    addTodo(state, action) {
      state.items.push(action.payload); // "mutating" — Immer makes it immutable
    },
  },
});
export const { addTodo } = todosSlice.actions;`}
        caption="Immer lets reducers use mutating syntax safely — under the hood it produces a new immutable state. Never destructure or spread state outside a slice reducer; Immer's proxy only works inside createSlice."
      />

      <PosterCard
        glyph="Se"
        title={<>useSelector<span className="dim"> & </span>useDispatch</>}
        code={`const dispatch = useDispatch();
const todos = useSelector(selectFilteredTodos);
dispatch(addTodo('Buy milk'));

// Defined OUTSIDE the component — memoization needs a stable selector
const selectFilteredTodos = createSelector(
  [selectAllTodos, selectFilter],
  (todos, filter) => todos.filter(t => t.done === (filter === 'done'))
);`}
        caption="Define selectors outside components so createSelector's memoization actually works — an inline selector recreated every render defeats the cache entirely."
      />

      <PosterCard
        glyph="Th"
        title={<>createAsyncThunk<span className="dim">()</span></>}
        code={`export const fetchTodos = createAsyncThunk(
  'todos/fetchAll',
  async (_, { rejectWithValue }) => {
    const res = await fetch('/api/todos');
    if (!res.ok) return rejectWithValue('Failed');
    return res.json();
  }
);
// Handle in extraReducers: .addCase(fetchTodos.pending/fulfilled/rejected, ...)`}
        caption="Generates pending/fulfilled/rejected action types automatically. Handle each lifecycle stage in the slice's extraReducers builder — no manual loading-state juggling."
      />

      <PosterCard
        glyph="Zu"
        title={<>Zustand — <span className="dim">create store</span></>}
        code={`const useTodoStore = create<TodoState>()((set, get) => ({
  items: [],
  addTodo: (text) =>
    set((s) => ({ items: [...s.items, { id: crypto.randomUUID(), text }] })),
  getCount: () => get().items.length,
}));
// No <Provider> — ever. The store lives outside the React tree.`}
        caption="One function creates the store and the hook to read it. At ~1KB gzipped with zero boilerplate, this covers most apps that don't need Redux's enforced structure."
      />

      <PosterCard
        glyph="Zu"
        title={<>Zustand — <span className="dim">selectors</span></>}
        code={`// ❌ new object every render — always re-renders, defeats the point
const { items, filter } = useTodoStore((s) => ({ items: s.items, filter: s.filter }));

// ✅ select primitives, or wrap with useShallow
import { useShallow } from 'zustand/react/shallow';
const { items, filter } = useTodoStore(
  useShallow((s) => ({ items: s.items, filter: s.filter }))
);`}
        caption="Zustand compares selector output with strict equality (===). Returning a fresh object/array literal breaks that check every time — select primitives individually or wrap with useShallow."
      />

      <PosterCard
        glyph="Mw"
        title={<>Zustand — <span className="dim">middleware order</span></>}
        code={`const useTodoStore = create(
  devtools(
    persist(
      immer((set) => ({
        items: [],
        addTodo: (t) => set((s) => { s.items.push(t); }),
      })),
      { name: 'todo-storage' }
    ),
    { name: 'TodoStore' }
  )
);`}
        caption="Middleware applies inside-out: immer runs first, then persist serializes the result, then devtools logs it. Put persist outside immer or it tries to serialize Immer's draft objects and breaks."
      />

      <PosterCard
        glyph="Qy"
        title={<>useQuery<span className="dim">()</span></>}
        code={`const { data, isLoading, isFetching, isError, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000,
  enabled: !!userId,
});`}
        caption="isLoading is true only on the very first fetch with no cached data; isFetching is true for any in-flight request including background refreshes — use each for the right piece of UI."
      />

      <PosterCard
        glyph="Mt"
        title={<>useMutation<span className="dim">()</span></>}
        code={`const { mutate, isPending } = useMutation({
  mutationFn: (todo) =>
    fetch('/api/todos', { method: 'POST', body: JSON.stringify(todo) }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
  onError: (err) => toast.error(err.message),
});`}
        caption="onSuccess is the natural place to invalidate the query that should reflect the write — or write directly to the cache with setQueryData to skip a refetch round-trip entirely."
      />

      <PosterCard
        glyph="Ky"
        title={<>Query Keys — <span className="dim">the cache address</span></>}
        code={`const todoKeys = {
  all: ['todos'] as const,
  detail: (id: number) => [...todoKeys.all, 'detail', id] as const,
};
useQuery({ queryKey: todoKeys.detail(42), queryFn: () => fetchTodo(42) });
queryClient.invalidateQueries({ queryKey: todoKeys.all });`}
        caption="Query keys are the cache address — same key, same cache entry, shared across every component that uses it. A key factory per domain prevents a typo'd string from silently creating a duplicate entry."
      />

      <PosterCard
        glyph="Jo"
        title={<>Jotai — <span className="dim">atomic model</span></>}
        code={`const todosAtom = atom<Todo[]>([]);
const filteredTodosAtom = atom((get) =>
  get(todosAtom).filter((t) => !t.completed)
);

function TodoApp() {
  const filtered = useAtomValue(filteredTodosAtom);
  const setTodos = useSetAtom(todosAtom);
}`}
        caption="Jotai's bottom-up composition shines when state shape isn't known upfront — dashboards, form builders, drag-and-drop editors — where Redux or Zustand would need a normalized shape designed in advance."
      />

      <PosterCard
        glyph="?"
        title="Do You Even Need a Library?"
        code={`// ✅ Local to one component → useState
const [isOpen, setIsOpen] = useState(false);

// ✅ Server data → TanStack Query, not useEffect + useState
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// ✅ State lives in the URL → React Router, not useState
const [searchParams, setSearchParams] = useSearchParams();`}
        caption="State libraries solve coordination problems between unrelated components. If your app doesn't have that problem — local state, server data, or URL state — adding one is pure overhead."
      />

      <PosterQuickRef
        title="Which state tool do I need?"
        rows={[
          { need: 'Local component state', answer: 'useState / useReducer' },
          { need: 'Rarely-changing global value (theme, locale)', answer: 'Context' },
          { need: 'Small-to-medium app, minimal ceremony', answer: 'Zustand' },
          { need: 'Large team, strict conventions, best DevTools', answer: 'Redux Toolkit' },
          { need: 'Dynamic, unknown-at-build-time state shape', answer: 'Jotai' },
          { need: 'Server/API data — caching, refetching', answer: 'TanStack Query' },
          { need: 'OOP style, direct mutation', answer: 'MobX' },
          { need: 'Default choice for most new apps', answer: 'Zustand + TanStack Query' },
        ]}
      />
    </PosterLayout>
  );
}
