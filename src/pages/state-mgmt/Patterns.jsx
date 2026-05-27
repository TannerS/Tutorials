import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Patterns() {
  return (
    <LessonLayout
      title="Real-World Patterns"
      sectionId="state-mgmt"
      lessonIndex={4}
      prev={{ path: '/state-mgmt/comparison', label: 'Library Comparison' }}
      next={{ path: '/state-mgmt/react-query', label: 'TanStack Query' }}
    >
      <h2>Feature-Based State Organization</h2>
      <p>
        In production apps, organize state by feature, not by type. Each feature owns its store
        slice/atoms, selectors, async logic, and components. This keeps related code colocated
        and makes features independently deletable.
      </p>

      <CodeBlock language="jsx" title="Feature-Based Folder Structure">
{`src/
├── features/
│   ├── auth/
│   │   ├── authStore.js       # Zustand store (or slice)
│   │   ├── useAuth.js         # Custom hook wrapping the store
│   │   ├── authApi.js         # TanStack Query hooks for auth endpoints
│   │   ├── LoginForm.jsx
│   │   └── UserMenu.jsx
│   ├── todos/
│   │   ├── todoStore.js
│   │   ├── useTodos.js
│   │   ├── todoApi.js
│   │   ├── TodoList.jsx
│   │   └── TodoFilters.jsx
│   └── notifications/
│       ├── notificationStore.js
│       ├── NotificationBell.jsx
│       └── NotificationPanel.jsx
├── shared/
│   └── uiStore.js             # Cross-cutting UI state (sidebar, modals)
└── app/
    └── App.jsx`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Custom Hook Boundary">
        Wrap every store in a custom hook: <code>useTodos()</code> instead of raw
        <code>useTodoStore(s =&gt; s.items)</code>. This creates an abstraction boundary — you can
        swap Zustand for Redux (or anything else) without touching a single component. The
        component never knows which library powers its data.
      </InfoBox>

      <h2>Normalized State Shape</h2>
      <p>
        When managing relational data (users, posts, comments), normalize it like a database:
        entities by ID in a lookup table, plus an ordered array of IDs. This eliminates
        duplicate data, simplifies updates, and prevents inconsistencies.
      </p>

      <CodeBlock language="jsx" title="Normalized vs Denormalized">
{`// ❌ Denormalized — duplicated user data, hard to update consistently
const state = {
  posts: [
    { id: '1', title: 'Hello', author: { id: 'u1', name: 'Alice' } },
    { id: '2', title: 'World', author: { id: 'u1', name: 'Alice' } },
    // If Alice changes her name, you must update EVERY post
  ],
};

// ✅ Normalized — single source of truth per entity
const state = {
  entities: {
    users: {
      'u1': { id: 'u1', name: 'Alice' },
      'u2': { id: 'u2', name: 'Bob' },
    },
    posts: {
      'p1': { id: 'p1', title: 'Hello', authorId: 'u1' },
      'p2': { id: 'p2', title: 'World', authorId: 'u1' },
    },
  },
  ids: {
    users: ['u1', 'u2'],
    posts: ['p1', 'p2'],
  },
};

// Update Alice's name in ONE place — all references resolved
state.entities.users['u1'].name = 'Alice Smith';`}
      </CodeBlock>

      <CodeBlock language="jsx" title="RTK createEntityAdapter — Normalization Built-In">
{`import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const postsAdapter = createEntityAdapter({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const postsSlice = createSlice({
  name: 'posts',
  initialState: postsAdapter.getInitialState({ status: 'idle' }),
  reducers: {
    postAdded: postsAdapter.addOne,
    postUpdated: postsAdapter.updateOne,
    postRemoved: postsAdapter.removeOne,
    postsReceived: postsAdapter.setAll,
  },
});

// Auto-generated selectors
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts);`}
      </CodeBlock>

      <h2>Optimistic Updates</h2>
      <p>
        Show the result immediately, then reconcile with the server. If the server rejects the
        change, roll back. This pattern makes apps feel instant.
      </p>

      <FlowChart
        title="Optimistic Update Flow"
        chart={"graph TD\n  A[User Action] --> B[Update UI Immediately]\n  B --> C[Send API Request]\n  C --> D{Server Response}\n  D -->|Success| E[Keep Optimistic State]\n  D -->|Failure| F[Rollback to Previous State]\n  F --> G[Show Error Toast]\n  style B fill:#10b981,color:#fff\n  style F fill:#ef4444,color:#fff"}
      />

      <CodeBlock language="jsx" title="Optimistic Toggle with Zustand">
{`const useTodoStore = create((set, get) => ({
  items: [],

  toggleTodo: async (id) => {
    // 1. Snapshot current state for rollback
    const previousItems = get().items;

    // 2. Optimistic update
    set((state) => ({
      items: state.items.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    }));

    // 3. Send to server
    try {
      const todo = get().items.find((t) => t.id === id);
      await fetch(\`/api/todos/\${id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: todo.completed }),
      });
    } catch {
      // 4. Rollback on failure
      set({ items: previousItems });
      toast.error('Failed to update todo');
    }
  },
}));`}
      </CodeBlock>

      <h2>Undo/Redo Pattern</h2>
      <p>
        Maintain a history stack of state snapshots. Each mutation pushes the current state onto
        the past stack and clears the future stack. Undo pops from past; redo pops from future.
      </p>

      <CodeBlock language="jsx" title="Undo/Redo Middleware for Zustand">
{`const undoMiddleware = (config) => (set, get, api) =>
  config(
    (args) => {
      const currentState = get();
      set({
        ...typeof args === 'function' ? args(currentState) : args,
        _past: [...(currentState._past || []), currentState],
        _future: [],
      });
    },
    get,
    api
  );

const useDocumentStore = create(
  undoMiddleware((set, get) => ({
    content: '',
    _past: [],
    _future: [],

    updateContent: (content) => set({ content }),

    undo: () => {
      const { _past, _future, ...current } = get();
      if (_past.length === 0) return;
      const previous = _past[_past.length - 1];
      set({
        ...previous,
        _past: _past.slice(0, -1),
        _future: [current, ..._future],
      });
    },

    redo: () => {
      const { _past, _future, ...current } = get();
      if (_future.length === 0) return;
      const next = _future[0];
      set({
        ...next,
        _past: [..._past, current],
        _future: _future.slice(1),
      });
    },
  }))
);`}
      </CodeBlock>

      <h2>State Machines with XState</h2>
      <p>
        For complex stateful workflows (multi-step forms, payment flows, connection managers),
        state machines make impossible states impossible. XState formalizes transitions so you
        can&apos;t accidentally reach an invalid state.
      </p>

      <CodeBlock language="jsx" title="XState — Authentication Flow">
{`import { createMachine, assign } from 'xstate';
import { useMachine } from '@xstate/react';

const authMachine = createMachine({
  id: 'auth',
  initial: 'idle',
  context: { user: null, error: null },
  states: {
    idle: {
      on: { LOGIN: 'authenticating' },
    },
    authenticating: {
      invoke: {
        src: 'loginService',
        onDone: {
          target: 'authenticated',
          actions: assign({ user: (_, event) => event.data }),
        },
        onError: {
          target: 'idle',
          actions: assign({ error: (_, event) => event.data.message }),
        },
      },
    },
    authenticated: {
      on: { LOGOUT: 'idle' },
      entry: assign({ error: null }),
    },
  },
});

function LoginPage() {
  const [state, send] = useMachine(authMachine, {
    services: {
      loginService: (_, event) =>
        fetch('/api/login', {
          method: 'POST',
          body: JSON.stringify(event.credentials),
        }).then((r) => r.json()),
    },
  });

  if (state.matches('authenticated')) return <Dashboard />;
  if (state.matches('authenticating')) return <Spinner />;
  return <LoginForm onSubmit={(creds) => send({ type: 'LOGIN', credentials: creds })} />;
}`}
      </CodeBlock>

      <InfoBox variant="info" title="XState vs Zustand/Redux">
        XState doesn&apos;t replace Zustand or Redux — it solves a different problem. Use Zustand/Redux
        for data stores (lists of entities, UI preferences). Use XState for complex workflows
        where the valid transitions matter (checkout flows, WebSocket connections, multi-step wizards).
        They combine beautifully: XState for the workflow, Zustand for the data.
      </InfoBox>

      <h2>State Persistence</h2>

      <CodeBlock language="jsx" title="localStorage Persistence with Migration">
{`import { persist, createJSONStorage } from 'zustand/middleware';

const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 16,
      sidebarOpen: true,
    }),
    {
      name: 'app-settings',         // localStorage key
      storage: createJSONStorage(() => localStorage),
      version: 2,                    // bump when shape changes
      migrate: (persisted, version) => {
        // Handle state shape migrations between versions
        if (version === 0) {
          // v0 had 'darkMode: boolean', v1 changed to 'theme: string'
          persisted.theme = persisted.darkMode ? 'dark' : 'light';
          delete persisted.darkMode;
        }
        if (version < 2) {
          // v2 added fontSize
          persisted.fontSize = persisted.fontSize ?? 16;
        }
        return persisted;
      },
      partialize: (state) => ({
        // Only persist these keys (skip transient state)
        theme: state.theme,
        fontSize: state.fontSize,
      }),
    }
  )
);`}
      </CodeBlock>

      <h2>Cross-Tab State Sync</h2>
      <p>
        When a user has your app open in multiple tabs, state changes in one tab should reflect
        in others. The BroadcastChannel API handles this natively.
      </p>

      <CodeBlock language="jsx" title="Cross-Tab Sync Middleware">
{`const crossTabSync = (channelName) => (config) => (set, get, api) => {
  const channel = new BroadcastChannel(channelName);

  channel.onmessage = (event) => {
    if (event.data.type === 'STATE_UPDATE') {
      set(event.data.state, true); // true = replace (don't merge)
    }
  };

  return config(
    (...args) => {
      set(...args);
      // Broadcast state to other tabs
      channel.postMessage({
        type: 'STATE_UPDATE',
        state: get(),
      });
    },
    get,
    api
  );
};

const useAuthStore = create(
  crossTabSync('auth-channel')((set) => ({
    user: null,
    token: null,
    login: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
    // Logging out in one tab logs out all tabs
  }))
);`}
      </CodeBlock>

      <h2>Form State Management</h2>
      <p>
        Form state is unique: it&apos;s local, ephemeral, and updates on every keystroke.
        Dedicated libraries outperform global stores by avoiding re-renders through
        uncontrolled inputs and refs.
      </p>

      <CodeBlock language="jsx" title="React Hook Form — Performant Forms">
{`import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']),
});

function UserForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', role: 'viewer' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <select {...register('role')}>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't Put Form State in Redux/Zustand">
        Global stores re-render subscribers on every change. For a form with 10 fields,
        that&apos;s 10 re-renders per keystroke across every subscribed component. React Hook
        Form uses uncontrolled inputs (refs) — zero re-renders during typing, validation only
        on submit or blur. Keep form state local; push the final result to your global store
        on submit.
      </InfoBox>

      <h2>Combining Multiple State Solutions</h2>

      <FlowChart
        title="Production State Architecture"
        chart={"graph TD\n  APP[React App] --> SS[Server State]\n  APP --> CS[Client State]\n  APP --> FS[Form State]\n  APP --> US[URL State]\n  SS --> TQ[TanStack Query]\n  CS --> ZS[Zustand]\n  CS --> CTX[Context - theme/locale]\n  FS --> RHF[React Hook Form]\n  US --> RR[React Router]\n  ZS --> P[Persist Middleware]\n  ZS --> DT[DevTools Middleware]\n  TQ --> CACHE[Automatic Cache]\n  style TQ fill:#10b981,color:#fff\n  style ZS fill:#3b82f6,color:#fff\n  style RHF fill:#f59e0b,color:#fff\n  style RR fill:#8b5cf6,color:#fff\n  style CTX fill:#6b7280,color:#fff"}
      />

      <CodeBlock language="jsx" title="Complete App Architecture">
{`// Server state — TanStack Query
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Client state — Zustand (persisted)
const theme = useSettingsStore((s) => s.theme);
const sidebarOpen = useUIStore((s) => s.sidebarOpen);

// Form state — React Hook Form (local, ephemeral)
const { register, handleSubmit } = useForm();

// URL state — React Router
const [searchParams] = useSearchParams();
const page = Number(searchParams.get('page') || 1);

// Low-frequency globals — Context
const locale = useContext(LocaleContext);
const featureFlags = useContext(FeatureFlagContext);

// This is NOT over-engineering — each tool handles what it's best at.
// The alternative is stuffing everything into Redux and fighting it.`}
      </CodeBlock>

      <h2>Testing Stateful Components</h2>

      <CodeBlock language="jsx" title="Testing Zustand Stores">
{`import { renderHook, act } from '@testing-library/react';
import { useTodoStore } from './todoStore';

// Reset store between tests
beforeEach(() => {
  useTodoStore.setState({ items: [], filter: 'all' });
});

test('addTodo appends a new item', () => {
  const { result } = renderHook(() => useTodoStore());

  act(() => {
    result.current.addTodo('Test item');
  });

  expect(result.current.items).toHaveLength(1);
  expect(result.current.items[0].text).toBe('Test item');
  expect(result.current.items[0].completed).toBe(false);
});

test('toggleTodo flips completed status', () => {
  useTodoStore.setState({
    items: [{ id: '1', text: 'Test', completed: false }],
  });

  const { result } = renderHook(() => useTodoStore());

  act(() => {
    result.current.toggleTodo('1');
  });

  expect(result.current.items[0].completed).toBe(true);
});

// Testing components that use the store
import { render, screen, fireEvent } from '@testing-library/react';
import TodoApp from './TodoApp';

test('renders todos from store', () => {
  useTodoStore.setState({
    items: [
      { id: '1', text: 'Buy milk', completed: false },
      { id: '2', text: 'Walk dog', completed: true },
    ],
  });

  render(<TodoApp />);
  expect(screen.getByText('Buy milk')).toBeInTheDocument();
  expect(screen.getByText('Walk dog')).toBeInTheDocument();
});`}
      </CodeBlock>

      <InteractiveChallenge
        question={"You have a collaborative document editor. Multiple users edit simultaneously, the document auto-saves every 5 seconds, and users can undo/redo their own changes. Which combination of tools fits best?"}
        options={[
          "Redux Toolkit for everything — it can handle all of this",
          "Zustand for document state + XState for save/sync workflow + undo middleware",
          "TanStack Query for server sync + Context for the document",
          "MobX for the document model + React Hook Form for text editing"
        ]}
        correctIndex={1}
        explanation="The document content is client state (Zustand with undo middleware). The auto-save and sync workflow has complex states (idle → saving → syncing → conflict resolution) that XState models cleanly. TanStack Query isn't right here because the document isn't a simple fetch-and-cache — it's a long-lived, continuously mutated resource."
        language="jsx"
      />

      <h2>Key Principles</h2>
      <p>
        <strong>1. Categorize first.</strong> Identify whether state is server cache, UI, form, or
        URL before choosing a tool. <strong>2. Start simple.</strong> useState → useReducer →
        Context → external store. <strong>3. Normalize relational data.</strong> Flat is better
        than nested. <strong>4. Wrap stores in custom hooks.</strong> Keep the library as an
        implementation detail. <strong>5. Test the store, not the library.</strong> Verify your
        business logic, not that Zustand works.
      </p>
    </LessonLayout>
  );
}
