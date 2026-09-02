import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Hooks() {
  return (
    <LessonLayout
      title="Testing Custom Hooks"
      sectionId="react-testing"
      lessonIndex={2}
      prev={{ path: '/react-testing/components', label: 'Testing Components' }}
      next={{ path: '/react-testing/async', label: 'Testing Async & APIs' }}
    >
      <h2>Why Test Hooks Separately?</h2>
      <p>
        Custom hooks encapsulate reusable logic. Testing them in isolation (without
        a component) gives you faster, more focused tests. RTL provides{' '}
        <code>renderHook</code> for exactly this purpose.
      </p>

      <FlowChart
        title="Hook Testing Flow"
        chart={"graph LR\n  R[renderHook] --> A[Access result.current]\n  A --> ACT[act: trigger updates]\n  ACT --> AS[Assert new state]\n  AS --> RR[rerender with new props]\n  RR --> CL[Verify cleanup]"}
      />

      <CodeBlock language="jsx" title="renderHook Basics">
{`import { renderHook, act } from '@testing-library/react';
import useCounter from './useCounter';

test('initializes with default value', () => {
  const { result } = renderHook(() => useCounter());
  expect(result.current.count).toBe(0);
});

test('initializes with provided value', () => {
  const { result } = renderHook(() => useCounter(10));
  expect(result.current.count).toBe(10);
});

test('increments the counter', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Two Things That Look Like Boilerplate But Are Not">
        <p>
          <strong>Why <code>result.current</code> and not just <code>result</code>?</strong>{' '}
          Because a hook has no return value that persists — it returns a fresh value
          on every render. <code>renderHook</code> therefore hands you a stable box and
          overwrites <code>.current</code> after each render, which is the same trick{' '}
          <code>useRef</code> uses. The practical consequence:
        </p>
        <CodeBlock language="jsx" title="The mistake this design invites">
          {`// ❌ Snapshots the value from the FIRST render. It will never change,
//    and your assertion fails with a baffling "expected 1, received 0".
const { count, increment } = renderHook(() => useCounter()).result.current;
act(() => increment());
expect(count).toBe(1);        // still 0 — 'count' is a stale copy

// ✅ Re-read through the box every time you assert.
const { result } = renderHook(() => useCounter());
act(() => result.current.increment());
expect(result.current.count).toBe(1);`}
        </CodeBlock>
        <p>
          <strong>What does <code>act()</code> actually do?</strong> React batches state
          updates and flushes effects <em>asynchronously</em>. Outside a browser, nothing
          would otherwise force that flush before your next line runs.{' '}
          <code>act()</code> marks a block as &ldquo;a unit of user interaction&rdquo;:
          run this code, then process every resulting re-render and effect before
          returning. Without it you assert against the state as it was <em>before</em>{' '}
          React caught up — and React logs the familiar{' '}
          <em>&ldquo;An update to X inside a test was not wrapped in act(...)&rdquo;</em>{' '}
          warning.
        </p>
        <p style={{ marginBottom: 0 }}>
          You rarely write it by hand in component tests because{' '}
          <code>render</code>, <code>fireEvent</code> and every{' '}
          <code>userEvent</code> call are already wrapped in it. Calling a hook&apos;s
          returned function directly, as here, is the case nothing wraps for you. Treat
          the warning as a real signal rather than noise to silence: it means an update
          landed outside the window your assertions were watching, which is also how
          genuinely flaky tests begin.
        </p>
      </InfoBox>

      <h2>Testing useState-Based Hooks</h2>

      <CodeBlock language="jsx" title="useToggle — Full Test Suite">
{`// useToggle.js
// export function useToggle(initial = false) {
//   const [value, setValue] = useState(initial);
//   const toggle = useCallback(() => setValue(v => !v), []);
//   const setTrue = useCallback(() => setValue(true), []);
//   const setFalse = useCallback(() => setValue(false), []);
//   return { value, toggle, setTrue, setFalse };
// }

import { renderHook, act } from '@testing-library/react';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  test('defaults to false', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current.value).toBe(false);
  });

  test('accepts initial value', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current.value).toBe(true);
  });

  test('toggles value', () => {
    const { result } = renderHook(() => useToggle());

    act(() => result.current.toggle());
    expect(result.current.value).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.value).toBe(false);
  });

  test('setTrue forces true', () => {
    const { result } = renderHook(() => useToggle(false));
    act(() => result.current.setTrue());
    expect(result.current.value).toBe(true);
  });

  test('setFalse forces false', () => {
    const { result } = renderHook(() => useToggle(true));
    act(() => result.current.setFalse());
    expect(result.current.value).toBe(false);
  });
});`}
      </CodeBlock>

      <h2>Testing useReducer Hooks</h2>

      <CodeBlock language="jsx" title="useCart — Reducer-Based Hook">
{`import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

const apple = { id: 'a1', name: 'Apple', price: 1.5 };
const banana = { id: 'b1', name: 'Banana', price: 0.75 };

describe('useCart', () => {
  test('starts with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  test('adds an item', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(apple));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({ id: 'a1', quantity: 1 });
    expect(result.current.total).toBe(1.5);
  });

  test('increments quantity for duplicate items', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(apple));
    act(() => result.current.addItem(apple));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.total).toBe(3.0);
  });

  test('removes an item', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(apple));
    act(() => result.current.addItem(banana));
    act(() => result.current.removeItem('a1'));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe('b1');
  });

  test('clears the cart', () => {
    const { result } = renderHook(() => useCart());

    act(() => result.current.addItem(apple));
    act(() => result.current.addItem(banana));
    act(() => result.current.clearCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
  });
});`}
      </CodeBlock>

      <h2>Testing Hooks with Side Effects</h2>

      <CodeBlock language="jsx" title="useLocalStorage — Side Effect Hook">
{`import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns initial value when key is not in storage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('theme', 'light')
    );
    expect(result.current[0]).toBe('light');
  });

  test('returns stored value when key exists', () => {
    localStorage.setItem('theme', JSON.stringify('dark'));

    const { result } = renderHook(() =>
      useLocalStorage('theme', 'light')
    );
    expect(result.current[0]).toBe('dark');
  });

  test('updates localStorage when value changes', () => {
    const { result } = renderHook(() =>
      useLocalStorage('theme', 'light')
    );

    act(() => {
      result.current[1]('dark');
    });

    expect(result.current[0]).toBe('dark');
    expect(JSON.parse(localStorage.getItem('theme'))).toBe('dark');
  });

  test('handles objects in storage', () => {
    const { result } = renderHook(() =>
      useLocalStorage('user', { name: 'Alice' })
    );

    act(() => {
      result.current[1]({ name: 'Bob' });
    });

    expect(result.current[0]).toEqual({ name: 'Bob' });
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ name: 'Bob' });
  });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="Clean Up Global State">
        Hooks that write to localStorage, sessionStorage, or the DOM need cleanup
        in <code>beforeEach</code> or <code>afterEach</code>. Otherwise tests
        bleed state into each other and produce flaky results.
      </InfoBox>

      <h2>Testing useDebounce</h2>

      <CodeBlock language="jsx" title="useDebounce — Timer-Based Hook">
{`import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));
    expect(result.current).toBe('hello');
  });

  test('does not update before delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    rerender({ value: 'world', delay: 500 });
    act(() => jest.advanceTimersByTime(300));

    expect(result.current).toBe('hello'); // Not updated yet
  });

  test('updates after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'hello', delay: 500 } }
    );

    rerender({ value: 'world', delay: 500 });
    act(() => jest.advanceTimersByTime(500));

    expect(result.current).toBe('world');
  });

  test('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'ab', delay: 500 });
    act(() => jest.advanceTimersByTime(200));

    rerender({ value: 'abc', delay: 500 });
    act(() => jest.advanceTimersByTime(200));

    // 400ms of total elapsed time, but each rerender RESET the timer —
    // only 200ms has run on the current one, so the value is still 'a'.
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(300));
    expect(result.current).toBe('abc');
  });
});`}
      </CodeBlock>

      <h2>Testing usePagination</h2>

      <CodeBlock language="jsx" title="usePagination — Complex Logic Hook">
{`import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';

describe('usePagination', () => {
  const setup = (totalItems = 50, pageSize = 10) =>
    renderHook(() => usePagination({ totalItems, pageSize }));

  test('starts on page 1', () => {
    const { result } = setup();
    expect(result.current.currentPage).toBe(1);
  });

  test('calculates total pages', () => {
    const { result } = setup(50, 10);
    expect(result.current.totalPages).toBe(5);
  });

  test('goes to next page', () => {
    const { result } = setup();
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(2);
  });

  test('goes to previous page', () => {
    const { result } = setup();
    act(() => result.current.nextPage());
    act(() => result.current.nextPage());
    act(() => result.current.prevPage());
    expect(result.current.currentPage).toBe(2);
  });

  test('does not go below page 1', () => {
    const { result } = setup();
    act(() => result.current.prevPage());
    expect(result.current.currentPage).toBe(1);
  });

  test('does not go past last page', () => {
    const { result } = setup(30, 10);
    act(() => result.current.goToPage(3));
    act(() => result.current.nextPage());
    expect(result.current.currentPage).toBe(3);
  });

  test('jumps to specific page', () => {
    const { result } = setup();
    act(() => result.current.goToPage(4));
    expect(result.current.currentPage).toBe(4);
  });

  test('reports hasNext and hasPrev correctly', () => {
    const { result } = setup(30, 10);

    expect(result.current.hasPrev).toBe(false);
    expect(result.current.hasNext).toBe(true);

    act(() => result.current.goToPage(3));
    expect(result.current.hasPrev).toBe(true);
    expect(result.current.hasNext).toBe(false);
  });
});`}
      </CodeBlock>

      <h2>Testing Hooks with Context</h2>

      <CodeBlock language="jsx" title="Testing Hook That Reads Context">
{`import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthProvider } from './AuthContext';

// Create a wrapper that provides the context
const createWrapper = (user = null) => {
  return function Wrapper({ children }) {
    return (
      <AuthProvider initialUser={user}>
        {children}
      </AuthProvider>
    );
  };
};

describe('useAuth', () => {
  test('returns null when no user is logged in', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(null),
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('returns user when logged in', () => {
    const mockUser = { id: 1, name: 'Alice' };
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(mockUser),
    });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });
});`}
      </CodeBlock>

      <h2>Testing Hook Cleanup</h2>

      <CodeBlock language="jsx" title="Testing Effect Cleanup">
{`import { renderHook } from '@testing-library/react';
import { useEventListener } from './useEventListener';

describe('useEventListener', () => {
  test('adds event listener on mount', () => {
    const handler = jest.fn();
    const addSpy = jest.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('resize', handler));

    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    addSpy.mockRestore();
  });

  test('removes event listener on unmount', () => {
    const handler = jest.fn();
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useEventListener('resize', handler));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    removeSpy.mockRestore();
  });
});`}
      </CodeBlock>

      <h2>Rerender with New Props</h2>

      <CodeBlock language="jsx" title="Testing Hook Rerender Behavior">
{`import { renderHook } from '@testing-library/react';
import { useDocumentTitle } from './useDocumentTitle';

describe('useDocumentTitle', () => {
  const originalTitle = document.title;
  afterEach(() => { document.title = originalTitle; });

  test('sets document title', () => {
    renderHook(() => useDocumentTitle('New Title'));
    expect(document.title).toBe('New Title');
  });

  test('updates title on rerender', () => {
    const { rerender } = renderHook(
      ({ title }) => useDocumentTitle(title),
      { initialProps: { title: 'Page 1' } }
    );

    expect(document.title).toBe('Page 1');

    rerender({ title: 'Page 2' });
    expect(document.title).toBe('Page 2');
  });

  test('restores title on unmount', () => {
    const { unmount } = renderHook(() => useDocumentTitle('Temp'));
    expect(document.title).toBe('Temp');

    unmount();
    expect(document.title).toBe(originalTitle);
  });
});`}
      </CodeBlock>

      <InfoBox variant="tip" title="Hook Testing Rule of Thumb">
        If a hook is used by only one component, test it through that component.
        If it's used by multiple components or has complex logic, test it
        independently with <code>renderHook</code>. Both approaches are valid.
      </InfoBox>
    </LessonLayout>
  );
}
