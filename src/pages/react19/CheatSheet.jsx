import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function CheatSheet() {
  return (
    <LessonLayout
      title="React 19 Cheat Sheet"
      sectionId="react19"
      lessonIndex={12}
      prev={{ path: '/react19/build-toolchain', label: 'Build Toolchain' }}
      next={null}
    >
      <h2>React Stability Master Reference</h2>
      <p>
        Complete condensed reference for React 19 hooks, patterns, and the rules that govern re-renders,
        effect re-runs, and reconciliation. Bookmark this page.
      </p>

      <h2>All Hooks — Signatures and Use Cases</h2>

      <CodeBlock language="jsx" title="State Hooks">
{`// useState — local component state
const [value, setValue] = useState(initialValue)
const [obj, setObj] = useState(() => expensiveInit()) // lazy init

// useReducer — complex state with actions
const [state, dispatch] = useReducer(reducer, initialState)
const [state, dispatch] = useReducer(reducer, initialArg, init) // lazy

// useSyncExternalStore — subscribe to external stores (React 18+)
const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Effect Hooks">
{`// useEffect — side effects after render (async-safe)
useEffect(() => {
  const sub = subscribe(id)
  return () => sub.unsubscribe()          // cleanup
}, [id])                                  // dep array

// useLayoutEffect — fires synchronously after DOM mutation
// Use for: measuring DOM, synchronizing scrollPosition, tooltips
useLayoutEffect(() => { measureEl(ref) }, [])

// useInsertionEffect — inject CSS before any DOM mutations (CSS-in-JS)
useInsertionEffect(() => { injectStyles(rule) }, [])`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Ref Hooks">
{`// useRef — mutable ref, does NOT trigger re-render
const ref = useRef(null)          // DOM access: <div ref={ref} />
const countRef = useRef(0)        // Store mutable value without re-render

// useImperativeHandle — expose custom ref API to parent
useImperativeHandle(ref, () => ({ focus: () => inputRef.current.focus() }), [])`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Context and Performance Hooks">
{`// useContext — consume context value
const theme = useContext(ThemeContext)

// useMemo — memoize expensive computation
const sorted = useMemo(() => items.sort(compare), [items])

// useCallback — memoize function reference
const handleClick = useCallback((id) => dispatch({ type: 'select', id }), [dispatch])

// memo — memoize entire component
const Row = memo(function Row({ data }) { return <tr>{data}</tr> })`}
      </CodeBlock>

      <CodeBlock language="jsx" title="React 19 New Hooks">
{`// use() — read resources in render (suspense-aware)
const data = use(fetchPromise)          // unwraps Promise
const theme = use(ThemeContext)         // same as useContext but works in conditions

// useFormStatus — read parent form's submission state
const { pending, data, method } = useFormStatus()

// useFormState (useActionState in React 19 final)
const [state, formAction] = useFormState(serverAction, initialState)

// useOptimistic — optimistic UI updates
const [optimisticList, addOptimistic] = useOptimistic(
  list,
  (currentList, newItem) => [...currentList, newItem]
)

// useDeferredValue — defer updating a value
const deferredQuery = useDeferredValue(query)   // transitions heavy re-renders

// useTransition — mark state updates as non-urgent
const [isPending, startTransition] = useTransition()
startTransition(() => setPage(newPage))`}
      </CodeBlock>

      <h2>When Components Re-Render</h2>

      <InfoBox variant="warning" title="The Re-Render Rules">
        <p>A component re-renders when:</p>
        <ul>
          <li>Its own state changes (via <code>setState</code> / <code>dispatch</code>)</li>
          <li>Its parent re-renders (unless wrapped in <code>memo</code>)</li>
          <li>A context it consumes changes value</li>
          <li>A hook it uses triggers a re-render (e.g., <code>useSyncExternalStore</code>)</li>
        </ul>
        <p>A component does NOT re-render when:</p>
        <ul>
          <li>A ref changes (<code>useRef</code> is mutable, non-reactive)</li>
          <li>A memoized parent re-renders but passes same props to <code>memo()</code> child</li>
          <li>State is set to the same value (React bails out via <code>Object.is</code>)</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Memo bailout rules">
{`// memo does a SHALLOW comparison of props by default
const Child = memo(function Child({ user, onClick }) {
  return <div>{user.name}</div>
})

// PROBLEM: new object reference each render defeats memo
function Parent() {
  return <Child user={{ name: 'Alice' }} onClick={() => {}} />
}

// SOLUTION: stable references
function Parent() {
  const user = useMemo(() => ({ name: 'Alice' }), [])
  const onClick = useCallback(() => {}, [])
  return <Child user={user} onClick={onClick} />
}

// Custom comparator
const Child = memo(function Child({ data }) {
  return <div>{data.id}</div>
}, (prev, next) => prev.data.id === next.data.id)`}
      </CodeBlock>

      <h2>When Effects Re-Run</h2>

      <CodeBlock language="jsx" title="useEffect dependency rules">
{`// Runs after EVERY render (no dep array)
useEffect(() => { document.title = count })

// Runs once on mount (empty array)
useEffect(() => { analytics.track('view') }, [])

// Runs when dep changes (React uses Object.is for comparison)
useEffect(() => { fetchUser(userId) }, [userId])

// COMMON MISTAKE: object/array in deps (new ref each render)
useEffect(() => { fetchConfig(options) }, [options]) // infinite loop!

// FIX: destructure primitives or memoize
useEffect(() => { fetchConfig(pageSize, sort) }, [pageSize, sort])

// Cleanup fires:
// 1. Before the effect re-runs (dep changed)
// 2. On component unmount
useEffect(() => {
  const timer = setInterval(tick, 1000)
  return () => clearInterval(timer)   // cleanup
}, [])`}
      </CodeBlock>

      <h2>What Triggers Reconciliation</h2>

      <InfoBox variant="info" title="React Reconciliation">
        <p>Reconciliation is React comparing the previous virtual DOM to the new one to determine the minimal DOM updates needed.</p>
        <ul>
          <li><strong>Element type change</strong> — React unmounts the old tree and mounts a new one</li>
          <li><strong>Same type</strong> — React updates props in place (reuse DOM node)</li>
          <li><strong>key change</strong> — Treats element as new (forces unmount + mount)</li>
          <li><strong>key stable</strong> — Reorders existing elements in the list</li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Key behavior">
{`// Keys force remount (reset state)
{isEditing
  ? <Input key="edit" defaultValue={value} />
  : <Input key="view" defaultValue={value} />
}
// Changing key = full unmount + mount = state reset

// Stable key = DOM reuse = state preserved
{items.map(item => <Row key={item.id} data={item} />)}

// NEVER use index as key when list is reorderable
{items.map((item, i) => <Row key={i} />)}  // BAD
{items.map(item => <Row key={item.id} />)} // GOOD`}
      </CodeBlock>

      <h2>Common Recipes</h2>

      <CodeBlock language="jsx" title="Debounced search">
{`function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function SearchBox() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 400)
  useEffect(() => { search(debouncedQuery) }, [debouncedQuery])
  return <input value={query} onChange={e => setQuery(e.target.value)} />
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Dark mode with localStorage">
{`function useTheme() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

function ThemeToggle() {
  const [dark, setDark] = useTheme()
  return (
    <button onClick={() => setDark(d => !d)}>
      {dark ? 'Light' : 'Dark'} Mode
    </button>
  )
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Fetch with abort and error">
{`function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()
    setState({ data: null, loading: true, error: null })

    fetch(url, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`)
        return res.json()
      })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          setState({ data: null, loading: false, error: err })
        }
      })

    return () => controller.abort()
  }, [url])

  return state
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Infinite scroll">
{`function useIntersectionObserver(ref, options = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, options.threshold])
  return isIntersecting
}

function InfiniteList({ loadMore }) {
  const sentinelRef = useRef(null)
  const isVisible = useIntersectionObserver(sentinelRef)

  useEffect(() => {
    if (isVisible) loadMore()
  }, [isVisible])

  return (
    <div>
      {/* items */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  )
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="React 19 Actions pattern">
{`'use client'
import { useOptimistic, useTransition } from 'react'

function TodoList({ todos, addTodo }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticTodos, addOptimistic] = useOptimistic(
    todos,
    (current, newTodo) => [...current, { ...newTodo, pending: true }]
  )

  async function handleAdd(formData) {
    const text = formData.get('text')
    const optimistic = { id: Date.now(), text }
    startTransition(async () => {
      addOptimistic(optimistic)
      await addTodo(text)   // Server Action or API call
    })
  }

  return (
    <form action={handleAdd}>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} style={{ opacity: todo.pending ? 0.6 : 1 }}>
            {todo.text}
          </li>
        ))}
      </ul>
      <input name="text" required />
      <button type="submit" disabled={isPending}>Add</button>
    </form>
  )
}`}
      </CodeBlock>

      <InteractiveChallenge
        question="Which hook should you use to subscribe to an external store (like Redux or Zustand) in a React component?"
        options={["useEffect with a subscription", "useSyncExternalStore", "useRef with a listener", "useContext with a store provider"]}
        correctIndex={1}
        explanation="useSyncExternalStore is the correct hook for subscribing to external stores. It ensures tear-free reads (consistent snapshots) across concurrent renders, which useEffect cannot guarantee. Redux and Zustand internally use this hook. useEffect-based subscriptions can cause 'tearing' where different parts of the UI show different store snapshots."
      />

      <InteractiveChallenge
        question={"What happens when you change an element's key prop in React?"}
        options={[
          "React updates the element's props in place",
          "React fully unmounts the old element and mounts a new one",
          "React re-runs all effects in the component",
          "React skips reconciliation for that subtree"
        ]}
        correctIndex={1}
        explanation={"Changing a key tells React to treat the element as an entirely different component. React unmounts the old instance (running all cleanup effects) and mounts a fresh instance (resetting all state). This is a powerful pattern for forcing state resets — for example, <Input key={userId} /> resets the form when userId changes."}
      />
    </LessonLayout>
  );
}
