import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function RTHooks() {
  return (
    <LessonLayout
      title="Testing Custom Hooks"
      sectionId="react-testing"
      lessonIndex={2}
      prev={{ path: '/react-testing/components', label: 'Testing Components' }}
      next={{ path: '/react-testing/async', label: 'Async Testing' }}
    >
      <h2>Testing Custom Hooks with renderHook</h2>
      <p>
        Custom hooks can be tested directly using <code>renderHook</code> from React Testing Library.
        This renders a host component that calls your hook and exposes its return value.
      </p>

      <CodeBlock language="jsx" title="Basic renderHook usage">
{`import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

// useCounter.js
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue)
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  const reset = () => setCount(initialValue)
  return { count, increment, decrement, reset }
}

// useCounter.test.js
test('starts at initial value', () => {
  const { result } = renderHook(() => useCounter(5))
  expect(result.current.count).toBe(5)
})

test('increments count', () => {
  const { result } = renderHook(() => useCounter())

  // Wrap state updates in act()
  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})

test('resets to initial value', () => {
  const { result } = renderHook(() => useCounter(10))

  act(() => {
    result.current.increment()
    result.current.increment()
    result.current.reset()
  })

  expect(result.current.count).toBe(10)
})`}
      </CodeBlock>

      <h2>Testing Hooks with Props (rerendering)</h2>

      <CodeBlock language="jsx" title="Updating hook arguments">
{`function useMultiplier(base, factor) {
  return useMemo(() => base * factor, [base, factor])
}

test('recomputes when args change', () => {
  const { result, rerender } = renderHook(
    ({ base, factor }) => useMultiplier(base, factor),
    { initialProps: { base: 3, factor: 4 } }
  )

  expect(result.current).toBe(12)

  // Provide new props to trigger rerender
  rerender({ base: 5, factor: 4 })

  expect(result.current).toBe(20)
})`}
      </CodeBlock>

      <h2>Testing Hooks with Context</h2>

      <CodeBlock language="jsx" title="Providing context in renderHook">
{`const AuthContext = createContext(null)

function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used within AuthProvider')
  return auth
}

test('returns auth from context', () => {
  const mockAuth = { user: { name: 'Alice' }, logout: vi.fn() }

  const wrapper = ({ children }) => (
    <AuthContext.Provider value={mockAuth}>
      {children}
    </AuthContext.Provider>
  )

  const { result } = renderHook(() => useAuth(), { wrapper })

  expect(result.current.user.name).toBe('Alice')
})

test('throws without provider', () => {
  // Suppress console.error for this test
  vi.spyOn(console, 'error').mockImplementation(() => {})

  expect(() => renderHook(() => useAuth())).toThrow(
    'useAuth must be used within AuthProvider'
  )
})`}
      </CodeBlock>

      <h2>Testing Async Hooks</h2>

      <CodeBlock language="jsx" title="Async hook test">
{`// useFetch.js
function useFetch(url) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then(r => r.json())
      .then(data => { if (!cancelled) setState({ data, loading: false, error: null }) })
      .catch(error => { if (!cancelled) setState({ data: null, loading: false, error }) })
    return () => { cancelled = true }
  }, [url])

  return state
}

// useFetch.test.js
import { renderHook, waitFor } from '@testing-library/react'

// Mock fetch globally
beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.resetAllMocks()
})

test('fetches and returns data', async () => {
  global.fetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ id: 1, name: 'Alice' }),
  })

  const { result } = renderHook(() => useFetch('/api/user'))

  expect(result.current.loading).toBe(true)

  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })

  expect(result.current.data).toEqual({ id: 1, name: 'Alice' })
  expect(result.current.error).toBeNull()
})`}
      </CodeBlock>

      <h2>Testing useEffect Cleanup</h2>

      <CodeBlock language="jsx" title="Testing cleanup behavior">
{`function useWindowResize(callback) {
  useEffect(() => {
    window.addEventListener('resize', callback)
    return () => window.removeEventListener('resize', callback)
  }, [callback])
}

test('removes event listener on unmount', () => {
  const addSpy = vi.spyOn(window, 'addEventListener')
  const removeSpy = vi.spyOn(window, 'removeEventListener')
  const callback = vi.fn()

  const { unmount } = renderHook(() => useWindowResize(callback))

  expect(addSpy).toHaveBeenCalledWith('resize', callback)

  unmount()

  expect(removeSpy).toHaveBeenCalledWith('resize', callback)
})`}
      </CodeBlock>

      <h2>Testing useReducer Hooks</h2>

      <CodeBlock language="jsx" title="Complex reducer hook test">
{`// useShoppingCart.js
const initialState = { items: [], total: 0 }

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        items: [...state.items, action.item],
        total: state.total + action.item.price,
      }
    case 'REMOVE_ITEM': {
      const item = state.items.find(i => i.id === action.id)
      return {
        items: state.items.filter(i => i.id !== action.id),
        total: state.total - (item?.price ?? 0),
      }
    }
    case 'CLEAR':
      return initialState
    default:
      return state
  }
}

function useShoppingCart() {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  return {
    ...state,
    addItem: (item) => dispatch({ type: 'ADD_ITEM', item }),
    removeItem: (id) => dispatch({ type: 'REMOVE_ITEM', id }),
    clear: () => dispatch({ type: 'CLEAR' }),
  }
}

// Tests
test('adds item and updates total', () => {
  const { result } = renderHook(() => useShoppingCart())

  act(() => {
    result.current.addItem({ id: 1, name: 'Widget', price: 9.99 })
  })

  expect(result.current.items).toHaveLength(1)
  expect(result.current.total).toBe(9.99)
})

test('clears cart', () => {
  const { result } = renderHook(() => useShoppingCart())

  act(() => {
    result.current.addItem({ id: 1, name: 'Widget', price: 9.99 })
    result.current.clear()
  })

  expect(result.current.items).toHaveLength(0)
  expect(result.current.total).toBe(0)
})`}
      </CodeBlock>

      <InfoBox variant="note" title="act() is Required for State Updates">
        <p>
          Wrap any code that triggers state updates in <code>act()</code>. Calling hook methods that
          dispatch state changes outside <code>act()</code> will cause React to warn about missing batching.
          <code>waitFor</code> automatically wraps assertions in <code>act()</code> for async cases.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does renderHook's rerender() method do?"
        options={[
          "Unmounts and remounts the hook from scratch",
          "Re-invokes the hook with new arguments without unmounting",
          "Clears all state and effects",
          "Runs the cleanup function and re-runs effects"
        ]}
        correctIndex={1}
        explanation="renderHook().rerender(newProps) calls the hook again with new props, simulating a parent re-render with changed arguments. State is preserved from the previous render — only prop-dependent computations (useMemo, useEffect deps) update. This tests how hooks respond to prop changes without the overhead of a full remount."
      />

      <InteractiveChallenge
        question="Why must state-updating calls in renderHook tests be wrapped in act()?"
        options={[
          "act() prevents test timeouts",
          "act() ensures React flushes all state updates and effects before assertions",
          "act() mocks the React reconciler",
          "act() is only needed for class component tests"
        ]}
        correctIndex={1}
        explanation="act() tells React to process all pending state updates, effects, and re-renders synchronously before the test assertions run. Without act(), state updates might not be applied yet when you check result.current, leading to flaky tests that assert against stale values."
      />
    </LessonLayout>
  );
}
