import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function StateChoosing() {
  return (
    <LessonLayout
      title="Zustand vs Redux vs Context — Choosing"
      sectionId="state-basics"
      lessonIndex={1}
      prev={{ path: '/state-mgmt/comparison', label: 'The State Escalation Ladder' }}
      next={{ path: '/state-mgmt/intro', label: 'When Context Isn\'t Enough' }}
    >
      <p>
        The previous lesson gave the escalation ladder. This one is the decision itself,
        including the question that comes up most in real code:{' '}
        <strong>two sibling components need to share something — does that justify a
        store?</strong>
      </p>
      <p>
        The short answer is almost always no. Here is the long answer.
      </p>

      <h2>First: Is It Even Client State?</h2>
      <p>
        The most common mistake is not picking the wrong store. It is putting{' '}
        <strong>server data</strong> in one.
      </p>
      <CodeBlock language="text" title="Two different problems that look like one">
{`SERVER state                        CLIENT state
──────────────────────────────────  ──────────────────────────────────
lives in your database              lives only in this browser tab
you have a COPY, possibly stale     you are the source of truth
needs: caching, refetching,         needs: a setter
  dedupe, retry, invalidation
examples: the invoice list,         examples: is the sidebar open,
  the current user, search results    the active tab, a draft form,
                                      theme, a multi-step wizard

-> React Query / RTK Query          -> useState, Context, or Zustand`}
      </CodeBlock>
      <InfoBox variant="danger" title="Fetching into a store is the classic over-engineering">
        <p style={{ marginBottom: 0 }}>
          If you are writing <code>fetchInvoices()</code> that sets{' '}
          <code>loading</code>, <code>error</code> and <code>data</code> in a Zustand or
          Redux store, you are reimplementing{' '}
          <a href="/react-query/fundamentals">React Query</a> by hand — and you will not
          get the cache invalidation, request dedupe or retry logic. Keep server data in a
          query cache and your store for genuine UI state. Most apps that &quot;need
          Redux&quot; actually needed a data-fetching library.
        </p>
      </InfoBox>

      <h2>The Sibling Question</h2>
      <p>
        Two sibling components need the same value. The instinct is &quot;this is shared,
        so it needs to be global&quot;. It usually does not.
      </p>

      <FlowChart
        title="Where should this state live?"
        chart={"graph TD\n  A[\"two components need this value\"] --> B{\"do they share a\\nnearby parent?\"}\n  B -->|yes| C[\"LIFT IT to that parent.\\nPass value + setter down.\\nThis is the right answer\\nfar more often than people expect\"]\n  B -->|\"only via the app root\"| D{\"how often does it change?\"}\n  D -->|\"rarely — theme, locale,\\nthe logged-in user\"| E[\"CONTEXT.\\nRe-render cost is irrelevant\\nif it changes twice a session\"]\n  D -->|\"often — and many\\nunrelated components read it\"| F{\"is prop-drilling the\\nreal pain, or re-renders?\"}\n  F -->|\"drilling through 5+ levels\"| G[\"CONTEXT, split by concern\"]\n  F -->|\"re-render storms\"| H[\"ZUSTAND.\\nSelector subscriptions mean\\nonly the readers of the changed\\nslice re-render\"]\n  style C fill:#1a3329,stroke:#4ade80\n  style E fill:#1a2744,stroke:#5b9cf6\n  style H fill:#2a1f44,stroke:#a78bfa"}
      />

      <CodeBlock language="jsx" title="Lifting state — the answer you should try first">
{`// Siblings: a filter input and a results list.
// They do NOT need a store. They need a shared parent.

function InvoicePage() {
  const [filter, setFilter] = useState('');          // ONE owner

  return (
    <>
      <FilterInput value={filter} onChange={setFilter} />
      <InvoiceList filter={filter} />
    </>
  );
}

// Why this is better than a store:
//   - the data flow is visible in one file
//   - the state dies with the page, so no stale value on the next visit
//   - it is trivially testable: render the parent, no provider needed
//   - no extra dependency, no devtools, nothing to learn`}
      </CodeBlock>

      <InfoBox variant="tip" title="The threshold that actually matters">
        <p style={{ marginBottom: 0 }}>
          Reach past lifting when the state is needed by components with{' '}
          <strong>no reasonable common parent</strong> — a toast triggered from a deeply
          nested form and rendered at the root, a command palette, the authenticated user.
          &quot;Reasonable&quot; is the operative word: if lifting means hoisting state to{' '}
          <code>App</code> and threading it through five layers that do not care about it,
          lifting has stopped being the cheap option.
        </p>
      </InfoBox>

      <h2>The Three Options, Compared</h2>
      <CodeBlock language="text" title="What you are actually choosing between">
{`                    Context          Zustand           Redux Toolkit
──────────────────  ───────────────  ────────────────  ──────────────────
what it is          React built-in   ~1 KB store       store + conventions
                                                       + middleware
extra dependency    none             yes (tiny)        yes (larger)
boilerplate         a provider       a create() call   a slice per concern
                    + a hook
re-render model     EVERY consumer   only components   only components
                    re-renders when  whose SELECTOR    whose selector
                    the value        result changed    result changed
                    changes
read outside React  no               yes (store.get)   yes (store.get)
devtools            React DevTools   Redux devtools    first-class
                                     (via middleware)
async               do it yourself   do it yourself    thunks / RTK Query
time travel         no               no                yes
learning curve      lowest           low               real`}
      </CodeBlock>

      <h2>Context: Cheap, With One Sharp Edge</h2>
      <CodeBlock language="jsx" title="The re-render behaviour that decides when NOT to use it">
{`// Context has no selector mechanism. ANY change to the value
// re-renders EVERY consumer, even one that reads an unrelated field.

const AppContext = createContext(null);

// BAD: one context holding unrelated things.
<AppContext.Provider value={{ theme, user, sidebarOpen, cart }}>
// Toggling the sidebar re-renders every component that reads theme.

// FIX 1: split by change frequency. This is the main one.
<ThemeContext.Provider value={theme}>        {/* changes rarely */}
  <UserContext.Provider value={user}>        {/* changes rarely */}
    <SidebarContext.Provider value={sidebar}>{/* changes often */}

// FIX 2: split state from the setters. Setters are stable, so
// components that only DISPATCH never re-render on value changes.
<CartStateContext.Provider value={cart}>
  <CartActionsContext.Provider value={actions}>   {/* useMemo'd */}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The inline-object bug that defeats every optimisation">
        <p>
          <code>value=&#123;&#123; user, login &#125;&#125;</code> creates a{' '}
          <strong>new object on every render of the provider</strong>, so every consumer
          re-renders every time regardless of whether anything changed. React DevTools
          reports this as <em>&quot;Context changed&quot;</em> — see{' '}
          <a href="/devtools/react">React DevTools &amp; Profiling</a>.
        </p>
        <CodeBlock language="jsx" title="The fix">
{`const value = useMemo(() => ({ user, login }), [user, login]);
return <UserContext.Provider value={value}>{children}</UserContext.Provider>;`}
        </CodeBlock>
      </InfoBox>

      <h2>Zustand: A Store Without the Ceremony</h2>
      <CodeBlock language="jsx" title="The whole API, and the one rule that matters">
{`import { create } from 'zustand';

const useCart = create((set, get) => ({
  items: [],
  add:    (item) => set((s) => ({ items: [...s.items, item] })),
  remove: (id)   => set((s) => ({ items: s.items.filter(i => i.id !== id) })),
  total:  () => get().items.reduce((n, i) => n + i.price, 0),
}));

// THE RULE: always select the narrowest slice you need.
const count = useCart((s) => s.items.length);   // re-renders only when
                                                 // the LENGTH changes
const add   = useCart((s) => s.add);             // actions are stable:
                                                 // this never re-renders

// WRONG — subscribes to the whole store, so every change re-renders:
const { items, add } = useCart();

// Selecting multiple fields needs a shallow compare, or the new object
// identity re-renders every time:
import { useShallow } from 'zustand/react/shallow';
const { items, total } = useCart(useShallow((s) => ({ items: s.items, total: s.total })));`}
      </CodeBlock>
      <p>
        That selector model is the whole reason to prefer Zustand over Context for
        frequently-changing state: subscriptions are per-selector, so a component reading{' '}
        <code>items.length</code> does not re-render when an unrelated field changes.
        Context cannot do that without splitting into more providers.
      </p>

      <h2>Redux Toolkit: When the Conventions Are the Point</h2>
      <CodeBlock language="jsx" title="More structure, deliberately">
{`const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    add:    (state, action) => { state.items.push(action.payload); },  // Immer
    remove: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
  },
});

// You get, in exchange for the boilerplate:
//   - every state change is a named, logged, serialisable ACTION
//   - time-travel debugging and action replay in the devtools
//   - one enforced pattern across a large team
//   - middleware: logging, persistence, optimistic updates, RTK Query`}
      </CodeBlock>
      <InfoBox variant="note" title="Redux is not legacy — but it is not the default either">
        <p style={{ marginBottom: 0 }}>
          Modern Redux Toolkit is nothing like the 2017 experience: no hand-written action
          constants, no spread-operator reducers, no <code>connect</code>. It is a
          reasonable choice for a large team that benefits from one enforced pattern, or
          when the action log and time-travel genuinely help you debug. It is the wrong
          choice as a reflex, which is how most apps acquired it.
        </p>
      </InfoBox>

      <h2>The Recommendation</h2>
      <CodeBlock language="text" title="In order. Stop at the first one that fits.">
{`1. useState in the component that owns it
2. LIFT to the nearest shared parent, pass props down
3. useReducer when several fields change together under rules
4. React Query for anything that came from a server
5. Context for low-frequency global values (theme, user, locale)
6. Zustand when many unrelated components read frequently-changing
   state and re-renders are measurably hurting
7. Redux Toolkit when the team or the debugging story needs the
   conventions

// Most applications need 1-5 and nothing else. If you cannot name the
// specific pain that the next step solves, you are at the right step.`}
      </CodeBlock>

      <InfoBox variant="success" title="Two sanity checks before adding a store">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Have you measured the re-renders?</strong> Turn on{' '}
            <em>Highlight updates</em> in React DevTools and interact. If nothing
            irrelevant is flashing, you do not have a re-render problem and a store will
            not make anything faster — it will just move your state further from where it
            is used.
          </li>
          <li>
            <strong>Is it actually global, or just awkwardly placed?</strong> State used
            by one page belongs to that page, even if the page is big. A store makes it
            survive navigation, which is usually a bug rather than a feature — a stale
            filter from a page you left is the classic symptom.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
