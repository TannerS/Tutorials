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
      <p>
        The two imports are the whole API. <code>renderHook</code> mounts a throwaway
        component whose only job is to call your hook, and hands you{' '}
        <code>result.current</code> — a live view of the latest return value.
      </p>
      <p>
        <code>result.current</code> is a <strong>snapshot, not a binding</strong>, and this
        is the mistake everyone makes once: destructuring{' '}
        <code>const &#123; toggle &#125; = result.current</code> and reusing it after an
        update leaves you holding a function closed over stale state. Always go through{' '}
        <code>result.current</code> at the moment you need it.
      </p>
      <p>
        Every state update goes inside <code>act()</code>. That is not ceremony: it tells
        React the update is finished so effects flush and a re-render happens before your
        next assertion. Skip it and you assert against the value from before the update —
        and React warns, loudly, which is the one warning never worth suppressing.
      </p>

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
      <p>
        A reducer hook is the easiest kind to test well, because the interesting logic is a
        pure function of state and action. Note what is asserted below: not the action that
        was dispatched, but the state that resulted — <code>items</code> <em>and</em>{' '}
        <code>total</code> together.
      </p>
      <p>
        That pairing is the point. <code>total</code> is derived, so it is exactly where
        bugs live — a quantity change that updates the line item and forgets the sum. Assert
        the derived value on every mutation and that class of bug cannot survive.
      </p>

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
      <p>
        Now the hook touches something outside React. <code>localStorage</code> is real in
        jsdom — it genuinely stores and returns values — which is convenient and also the
        trap: <strong>it persists between tests in the same file</strong>. One test writing{' '}
        <code>&apos;dark&apos;</code> would leave it there for the next, producing a suite
        that passes in order and fails when a single test is run alone. That is what the{' '}
        <code>localStorage.clear()</code> in <code>beforeEach</code> below is for — it is
        the most load-bearing line in the block, and the easiest one to leave out.
      </p>
      <p>
        These tests also seed storage directly before rendering rather than driving the hook
        to write it first. That keeps each test independent and makes the arrangement
        obvious — the alternative chains tests together so one failure cascades into five.
      </p>

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
      <p>
        A debounce hook is defined by <em>time</em>, so testing it for real would mean
        waiting half a second per assertion. <code>jest.useFakeTimers()</code> replaces the
        clock with one you advance by hand: the test runs instantly and, more importantly,
        becomes deterministic — a real 500 ms wait is a race that passes on your laptop and
        flakes on a loaded CI box.
      </p>
      <p>
        The paired <code>jest.useRealTimers()</code> in <code>afterEach</code> is not
        optional. Fake timers are global, so leaving them installed breaks every later test
        in the file that expects a real clock — including anything using{' '}
        <code>waitFor</code>, which would then hang against a clock nobody is advancing.
      </p>
      <p>
        One sharp edge worth knowing before you hit it: <code>user-event</code> schedules
        its own delays, so it needs to be told about the fake clock via{' '}
        <code>userEvent.setup(&#123; advanceTimers: jest.advanceTimersByTime &#125;)</code>.
        RTL&apos;s own <code>waitFor</code> detects Jest&apos;s fake timers and drives them
        itself — the distinction is unpacked in{' '}
        <a href="/react-testing/async-deep-dive">Waiting, act(), and Async Failure Modes</a>.
      </p>

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
      <p>
        Pagination is arithmetic, and arithmetic is where off-by-one lives. This is the
        ideal hook to test exhaustively precisely because it is cheap to do so: no DOM, no
        network, no timers — just input numbers and derived output.
      </p>
      <p>
        The <code>setup()</code> helper is the pattern to copy. Rather than repeating{' '}
        <code>renderHook(() =&gt; usePagination(&#123;...&#125;))</code> in every test, one
        function takes the varying bits and returns <code>result</code>. Tests then read as
        a table of cases, which is what you want when the real goal is covering the
        <em> boundaries</em>: page 1, the last page, a <code>totalItems</code> that divides
        evenly versus one that leaves a short final page, and zero items.
      </p>

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
      <p>
        A hook calling <code>useContext</code> cannot be rendered bare — without a provider
        it reads the context&apos;s <em>default</em> value, which is usually{' '}
        <code>undefined</code> and gives you a crash with a confusing stack rather than a
        useful failure.
      </p>
      <p>
        That is what <code>renderHook</code>&apos;s second argument is for: a{' '}
        <code>wrapper</code> component rendered around the hook. Because the wrapper is
        per-call, each test can supply a different provider value, which is how you cover
        logged-in and logged-out from the same hook without touching global state.
      </p>
      <p>
        Worth testing the no-provider case deliberately, too. A hook that throws a clear{' '}
        <em>&quot;useAuth must be used inside AuthProvider&quot;</em> saves far more time
        than one that reads <code>undefined</code> and fails three components away from the
        actual mistake.
      </p>

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
      <p>
        This is the section most hook suites skip, and the one that catches real leaks. A
        hook that subscribes on mount and never unsubscribes works perfectly in every test
        that only mounts — the damage shows up in a long-lived app as duplicate handlers
        firing, or a setState on an unmounted component.
      </p>
      <p>
        So the pair below asserts both halves: <code>addEventListener</code> on mount, and{' '}
        <code>removeEventListener</code> after <code>unmount()</code>. The{' '}
        <code>jest.spyOn</code>/<code>mockRestore</code> bracket matters because these are
        spies on a global — leave one installed and it follows you into the next test file.
      </p>
      <InfoBox variant="tip" title="What this test still cannot catch — and how to close the gap">
        <p>
          Both assertions use <code>expect.any(Function)</code>, which proves cleanup
          happened <em>at all</em>. It cannot prove cleanup removed the{' '}
          <strong>right</strong> listener, because <code>removeEventListener</code> matches
          on <em>identity</em>: hand it a fresh arrow that looks identical and it removes
          nothing, silently. Verified in a real browser:
        </p>
        <CodeBlock language="javascript" title="Real result — Chromium via Playwright">
{`window.addEventListener('ping', handler);
window.removeEventListener('ping', () => {});   // different fn, same shape
window.dispatchEvent(new Event('ping'));        // handler STILL fires -> 1

window.removeEventListener('ping', handler);    // same reference
window.dispatchEvent(new Event('ping'));        // silent -> still 1`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So a hook that wraps the handler in a new function on every render passes the test
          above and leaks anyway. To close it, capture what was registered and require the
          same value back:{' '}
          <code>
            expect(removeSpy).toHaveBeenCalledWith(&apos;resize&apos;,
            addSpy.mock.calls[0][1])
          </code>
          .
        </p>
      </InfoBox>

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
      <p>
        Mounting a hook tests its first render. Plenty of bugs only appear on the{' '}
        <em>second</em> one — a <code>useEffect</code> with a missing dependency that never
        re-runs, or a value memoised against the wrong input.
      </p>
      <p>
        <code>renderHook</code>&apos;s <code>rerender</code> is how you reach that: call it
        with new arguments and the same hook instance re-renders, keeping its state. That
        last part is what makes it a different test from simply mounting again with
        different props — this is the update path, state and all.
      </p>
      <p>
        <code>useDocumentTitle</code> is a good subject because the effect writes to
        something global, so the second assertion would still read{' '}
        <code>&apos;New Title&apos;</code> if the effect never re-ran. Which is also the
        reminder: <code>document.title</code> persists across tests in a file, so reset it
        in <code>afterEach</code> if later tests depend on it.
      </p>

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
