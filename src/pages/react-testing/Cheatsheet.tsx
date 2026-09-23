import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactTestingCheatsheet() {
  return (
    <GuideLayout
      title="React Testing"
      kicker="FIELD GUIDE"
      glyph="🧪"
      tagline="Jest, RTL and MSW — every signature, default and error string here was measured against the real stack, not recalled."
      meta={['Jest 30.5 · RTL 16.3 · MSW 2.15', 'React 19.3 · user-event 14.6', '19 panels']}
      page="1 / 1"
      footer="The nine lessons in this section carry the reasoning and the worked examples; this page is the recall sheet."
      prev={{ path: '/react-testing/best-practices', label: 'Best Practices & Anti-Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="Setup & Config" accent="blue" glyph="📦" span={2}>
        <GuideCode>{`npm i -D jest jest-environment-jsdom            # jsdom is SEPARATE since Jest 28
npm i -D babel-jest @babel/core @babel/preset-env \\
         @babel/preset-react @babel/preset-typescript
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event msw

// jest.config.js — ESM, because a Vite package.json has "type": "module"
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],   // AfterEnv, not AfterEach
  moduleNameMapper: {
    '\\\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\\\.(svg|png|jpe?g|gif|webp|woff2?)$': '<rootDir>/src/fileMock.ts',
  },
};

// src/setupTests.ts
import '@testing-library/jest-dom';`}</GuideCode>
        <GuideRules items={[
          'Jest never reads vite.config.ts. TSX compilation, CSS imports and asset imports must all be re-declared — those three are nearly every first-run failure in a Vite project.',
          'ts-jest is the usual advice and is currently a trap: it peers typescript ">=4.3 <7" while TypeScript is 7.0.2. On an existing TS 7 project npm install -D ts-jest fails with ERESOLVE; on a fresh one it silently pins you to typescript 6.0.3.',
          'babel-jest has no such ceiling (verified green on typescript 7.0.2). Cost: preset-typescript strips types instead of checking them — run tsc --noEmit in CI for that.',
          'setupFilesAfterEach is a typo Jest does not reject — it warns "Unknown option" and ignores the key, so the symptom is a missing matcher, not a config error.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Query Matrix" accent="purple" glyph="🔍" span={2}>
        <GuideTable
          head={['Query', 'Returns', '0 matches', '2+ matches', 'Await?']}
          rows={[
            ['getBy', 'Element', 'Throws', 'Throws', 'No'],
            ['queryBy', 'Element | null', 'Returns null', 'Throws', 'No'],
            ['findBy', 'Promise<Element>', 'Rejects (timeout)', 'Rejects', 'Yes'],
            ['getAllBy', 'Element[]', 'Throws', 'Fine', 'No'],
            ['queryAllBy', 'Element[]', 'Returns []', 'Fine', 'No'],
            ['findAllBy', 'Promise<Element[]>', 'Rejects (timeout)', 'Fine', 'Yes'],
          ]}
        />
        <GuideRules items={[
          'Must it be there right now? getBy — the throw IS the assertion, and it prints the DOM. Must it NOT be there? queryBy, the only variant that returns null instead of throwing.',
          "queryBy still throws on 2+ matches — it's forgiving about zero, not ambiguity. Use queryAllBy(...).toHaveLength(0) for \"none of these\".",
          'A bare findBy with no await returns a pending (truthy) promise — an assertion can pass against an element that never appeared.',
          'findAllBy resolves at the FIRST match, not the settled set. On a list that drips in, it returns 1 element and moves on — assert the count with waitFor instead.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Query Priority Ladder" accent="green" glyph="🪜" span={2}>
        <GuideDefs
          items={[
            ['1 getByRole', 'always try first — add { name } to disambiguate'],
            ['2 getByLabelText', 'form fields with an associated <label>'],
            ['3 getByPlaceholderText', 'no label exists (fix the component if you can)'],
            ['4 getByText', 'non-interactive content — paragraphs, spans, list items'],
            ['5 getByDisplayValue', "an input's current value"],
            ['6 getByAltText', 'images and area elements'],
            ['7 getByTitle', 'rarely — inconsistently exposed to screen readers'],
            ['8 getByTestId', 'last resort — no accessible handle at all'],
          ]}
        />
        <GuideCode>{`screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 2, name: /profile/i });
screen.getByRole('combobox', { name: /language/i });   // <select>
screen.getByLabelText(/password/i);
screen.getByTestId('custom-dropdown');                  // last resort`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={4} title="user-event v14" accent="amber" glyph="🖱️" span={2}>
        <GuideRules items={[
          'Call userEvent.setup() once per test, before render().',
          'Every method on the returned instance is async — a missing await lets assertions run before React re-renders.',
          'selectOptions matches o.value === val OR o.innerHTML === val (strict) — pass the value, or the option element, to avoid ambiguity.',
        ]} />
        <GuideTable
          head={['Call', 'Does']}
          rows={[
            ['setup()', 'creates the instance — options: delay, advanceTimers, pointerEventsCheck'],
            ['click(el)', 'pointerdown → mousedown → pointerup → mouseup → click, plus focus'],
            ["type(el, 'abc')", 'appends, one key at a time — supports {enter}, {backspace}'],
            ['clear(el)', 'empties an input — type() appends, so clear first to replace'],
            ['selectOptions(sel, v)', "matches the option's value or exact innerHTML, or pass the element"],
            ['upload(input, file)', "sets input.files — build with new File(['x'], 'a.txt', { type })"],
            ['hover(el) / unhover(el)', 'pointer-over sequences — tooltips, hover menus'],
            ["keyboard('{Escape}')", 'keys at the document level, no target — modals, shortcuts'],
            ['tab()', 'moves focus — also the way to trigger blur validation'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={5} title="jest-dom Matchers" accent="pink" glyph="✅" span={2}>
        <GuideTable
          head={['Matcher', 'Asserts']}
          rows={[
            ['toBeInTheDocument()', 'attached to the document — the default presence check'],
            ['toHaveTextContent(s|re)', 'substring match — flattens nested elements'],
            ['toBeVisible()', 'present AND not hidden by display/visibility/opacity/hidden'],
            ['toBeDisabled()', 'disabled, including via a disabled ancestor fieldset'],
            ['toHaveValue(v)', 'value of an input, select, or textarea'],
            ['toHaveAttribute(n, v?)', 'attribute present, optionally equal to a value'],
            ['toHaveClass(...names)', 'class names present — add { exact: true } for the full set'],
            ['toHaveFocus()', 'element is document.activeElement — pairs with user.tab()'],
            ['toHaveAccessibleName/Description(s)', 'computed accessible name / description'],
            ['toBeChecked()', 'checkbox/radio, or anything with aria-checked'],
            ['toHaveFormValues(obj)', 'whole form at once, keyed by name — call on the <form>'],
          ]}
        />
        <GuideRules items={[
          'toHaveStyle reads COMPUTED style. jsdom loads no external stylesheets or CSS Modules, so a class-applied rule reads empty — only an inline style prop passes.',
          "When appearance carries meaning, put the meaning in markup (role='status', data-variant) and assert that instead of a class.",
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Async — Picking the Primitive" accent="cyan" glyph="⏳" span={2}>
        <GuideTable
          head={['Tool', 'Use when', 'Common misuse']}
          rows={[
            ['findBy*', 'one element should appear — sugar for waitFor + getBy', 'no await — pending promise is truthy, assertion silently passes'],
            ['waitFor(cb)', "condition isn't \"one element exists\" — a count, a spy call, a disappearance", 'side effects (user.click) inside — the callback is retried many times'],
            ['waitForElementToBeRemoved(cb)', 'a spinner or toast should go away', 'calling it when never there — throws immediately'],
          ]}
        />
        <GuideRules items={[
          'Why the early assertion fails at all: render() returns synchronously, but React commits on a later TASK — not the first microtask. Measured: ten awaited microtasks after render still showed "Loading...".',
          "There is no findBy for absence. waitFor(() => expect(queryByText('x')).not.toBeInTheDocument()) passes in ~2ms if it simply hasn't rendered YET — wait for the positive replacement, or use waitForElementToBeRemoved.",
          'findBy signature is (matcher, queryOptions, waitForOptions) — a { timeout } belongs in the THIRD argument. In the second it is silently ignored.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="How waitFor Actually Works" accent="red" glyph="🔁" span={2}>
        <GuideCode>{`// Measured: 20 calls over 1016ms before timing out.
await waitFor(() => {
  expect(screen.getByText('Done')).toBeInTheDocument();   // assertion ONLY
});

// ❌ The callback is retried — this clicked 19-20 times across four runs.
await waitFor(() => { user.click(btn); expect(spy).toHaveBeenCalled(); });`}</GuideCode>
        <GuideDefs
          items={[
            ['default timeout', '1000ms — getConfig().asyncUtilTimeout'],
            ['polling interval', '50ms — plus a MutationObserver that fires sooner (measured 48ms)'],
            ['per-call override', '{ timeout, interval } — there is NO asyncUtilInterval config key'],
            ['Jest per-test cap', '5000ms — a 6000ms waitFor hits Jest first'],
          ]}
        />
        <GuideRules items={[
          'The callback must be an assertion that can THROW. waitFor retries on throw and resolves on success — a callback that never throws resolves on attempt one (measured 3ms) whether or not anything actually happened.',
          '"Timed out in waitFor." with no assertion error does NOT mean the callback never threw — it means the callback returned a promise that never settled (measured 1011ms). An async callback is usually the culprit.',
          'A queryBy inside waitFor never throws, so it never retries. Use getBy inside waitFor.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Fake Timers — What Actually Happens" accent="blue" glyph="⏰" span={2}>
        <GuideCode>{`beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// REQUIRED, or awaited user-event calls hang until Jest's 5s cap.
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

await user.type(screen.getByRole('searchbox'), 'react');
expect(onSearch).not.toHaveBeenCalled();
act(() => jest.advanceTimersByTime(300));
expect(onSearch).toHaveBeenCalledWith('react');`}</GuideCode>
        <GuideRules items={[
          'The folklore that fake timers hang waitFor is FALSE on Jest. jestFakeTimersAreEnabled() detects them (setTimeout owns a "clock" property), so waitFor takes its fake-timer branch and drives the clock itself. A timing-out waitFor costs 10ms real / 1000ms fake.',
          'The real hazard is the inverse: a RETRYING waitFor fast-forwards the fake clock up to 1000ms and fires your pending debounce mid-wait (verified: onSearch called with "react" before the test meant to advance). A waitFor that passes first try advances 0ms.',
          'What genuinely hangs is user-event WITHOUT advanceTimers — its own 60s internal guard timer is frozen too, so only Jest\'s per-test timeout stops it.',
          'Switching clocks mid-test throws. Set fake timers before render, restore in afterEach.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="act() — When You Still Write It" accent="purple" glyph="🎬">
        <GuideDefs
          items={[
            ['render / fireEvent', 'already act-wrapped by RTL'],
            ['user-event calls', 'already wrapped — just await them'],
            ['hook fn from renderHook', 'NOT wrapped — wrap it yourself'],
            ['jest.advanceTimersByTime', 'NOT wrapped — act(() => ...)'],
            ['flush a pending commit', 'await act(async () => {})'],
          ]}
        />
        <GuideRules items={[
          '"not wrapped in act(...)" is a real signal: an update landed outside the window your assertions were watching. Await the interaction rather than silencing it.',
          'Read result.current AT assertion time — destructuring up front snapshots the first render forever.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Custom Hooks — renderHook" accent="green" glyph="🪝">
        <GuideCode>{`const { result, rerender, unmount } = renderHook(() => useCounter());
act(() => result.current.increment());
expect(result.current.count).toBe(1);

const { result: r2, rerender: re } = renderHook(
  ({ value }) => useDebounce(value, 500),
  { initialProps: { value: 'hello' } },
);
re({ value: 'world' });

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
renderHook(() => useAuth(), { wrapper });`}</GuideCode>
      </GuidePanel>

      <GuidePanel n={11} title="Debugging" accent="amber" glyph="🔦">
        <GuideCode>{`const sidebar = screen.getByRole('navigation');
within(sidebar).getAllByRole('link');       // scope queries to a subtree

screen.debug();                  // truncates ~7000 chars
screen.debug(undefined, 30000);  // raise the limit

logRoles(container);             // every role present — LOGS, returns undefined`}</GuideCode>
        <GuideRules items={[
          'within() is essential for tables and repeated rows — scope before you query.',
          "logRoles is the fix for 'unable to find role' — it prints every role in the container.",
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="MSW v2 — The Renames" accent="pink" glyph="🔀" span={2}>
        <GuideTable
          head={['MSW v1', 'MSW v2']}
          rows={[
            ["import { rest } from 'msw'", "import { http, HttpResponse } from 'msw' — rest no longer exists"],
            ['rest.get(url, (req, res, ctx) => ...)', 'http.get(url, ({ request, params }) => ...) — one object arg'],
            ['res(ctx.json(data))', 'HttpResponse.json(data) — returned, not called'],
            ['res(ctx.status(500), ctx.json(e))', 'HttpResponse.json(e, { status: 500 })'],
            ['req.body', 'await request.json() — a real Fetch API Request'],
            ['req.url.searchParams', 'new URL(request.url).searchParams'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={13} title="MSW Handlers & Lifecycle" accent="cyan" glyph="🌐" span={2}>
        <GuideCode>{`export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
  http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: Number(params.id) })),
  http.post('/api/users', async ({ request }) => HttpResponse.json(await request.json(), { status: 201 })),
];

import { setupServer } from 'msw/node';   // node, NOT setupWorker
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());`}</GuideCode>
        <GuideRules items={[
          "onUnhandledRequest: 'error' fails the test on any unmatched request — catches missing mocks before they hit a real API.",
          "A jest.spyOn(fetch) stub only proves you called the function — it can't catch a wrong method, a missing header, or a bad body, because the return value isn't a real Response.",
          "If you do stub fetch, use spyOn — restoreAllMocks() can't undo a hand-assigned global.fetch = jest.fn().",
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Custom Render With Providers" accent="red" glyph="🧩" span={2}>
        <GuideCode>{`function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialUser={user}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export function renderWithProviders(ui, { route = '/', user = null, ...opts } = {}) {
  return render(ui, { wrapper: Wrapper, ...opts });
}
export * from '@testing-library/react';
export { renderWithProviders as render };   // import from YOUR test-utils`}</GuideCode>
        <GuideRules items={[
          "QueryClient needs retry: false in tests — the default 3-attempt retry turns an error-state test into a timeout.",
          'MemoryRouter + <Routes> covers only the declarative API. useLoaderData/useNavigation/<Form> need createMemoryRouter + <RouterProvider>.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="Zustand — Store Leak Between Tests" accent="blue" glyph="🐻" span={2}>
        <GuideCode>{`// The store is module scope: it SURVIVES across tests in the same file.
// Symptom — a box is already checked in a test that never clicked it.

// Fix A — reset in beforeEach
const initial = useStore.getInitialState();
beforeEach(() => useStore.setState(initial));      // no 'true' — see below

// Fix B — official auto-reset, no per-file boilerplate at all.
// Create __mocks__/zustand.ts per Zustand's testing docs; every store
// created via create() is then reset between tests automatically.`}</GuideCode>
        <GuideRules items={[
          'getInitialState() returns your actions too, so a plain setState(initial) restores state AND methods.',
          "setState(obj, true) REPLACES rather than merges — it wipes the actions off the store. The render still succeeds; the click then throws 'TypeError: toggle is not a function'.",
          'The __mocks__/zustand.ts auto-reset works as documented (verified: 4/4 pass with no beforeEach) — but only for stores created via create(). A store built with createStore from zustand/vanilla escapes the mock entirely and still leaks.',
          'Test store logic directly without React — it is a plain object with getState/setState/subscribe.',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="AG Grid in jsdom — Measured" accent="purple" glyph="📊" span={2}>
        <GuideCode>{`// Renders ASYNC. Immediately after render(): rows 0, gridcells 0.
render(<MyGrid rows={3} />);
await screen.findByText('Alice');          // now: 4 rows, 6 gridcells, 2 headers

// Sorting: clicking the columnheader itself does NOTHING (aria-sort stays "none").
await user.click(within(header).getByText('Name'));   // this works`}</GuideCode>
        <GuideRules items={[
          'It virtualizes hard: 1000 rows gives aria-rowcount 1001 but only ~12 role="row" in the DOM. "User 20" is simply absent — assert on what is rendered, or on the grid API.',
          'Container height is irrelevant in jsdom — no wrapper at all produced identical output, and domLayout="autoHeight" does NOT rescue it. jsdom computes 0 height either way.',
          'ModuleRegistry is NOT required to render: rows, sorting and onCellClicked all work with zero registration and zero console output. Only separate-module features fail — pagination logs "AG Grid: error #200 ... moduleName=Pagination" as a console.error, not a throw.',
          'DOM order is NOT visual order. After sorting asc, getAllByRole("row") still returned Carla, Alice, Bob — rows are repositioned with translateY. Sort by the row-index attribute before asserting order.',
          'The grid model leads the DOM: getDisplayedRowCount() was 2 while the DOM still showed 3 rows 100ms later. waitFor caught up at ~409ms.',
          'Mocking is not automatically faster: 10 cycles at 200 rows cost 547ms real vs 930ms mocked. The real grid is near-constant in row count; a full mock is linear.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Layers & Handlers — What to Assert" accent="green" glyph="🪆" span={2}>
        <GuideTable
          head={['Handler arrives as', 'Assert on']}
          rows={[
            ['prop drilled N layers', 'the resulting UI change, not the spy'],
            ['inline arrow in JSX', 'the UI change — there is no stable fn to spy'],
            ['from context', 'render the real provider; assert the UI'],
            ['Zustand action', 'store state after, or the UI — reset the store first'],
            ['render prop / children fn', 'the UI the callback produced'],
            ['library callback (onCellClicked)', 'a jest.fn() IS right — this is a real boundary'],
          ]}
        />
        <GuideRules items={[
          'Render from the component that OWNS the state, with real children. Mocking intermediate layers until the test passes proves nothing — the same assertions stayed green against a deliberately broken tree.',
          'Prefer toHaveBeenLastCalledWith over toHaveBeenCalledTimes — it catches a wrong payload, which a count never will.',
          'A spy is the right assertion only at a boundary you genuinely mocked. If the DOM could have told you, assert the DOM.',
          'Never snapshot a third-party subtree: a 3×2 AG Grid is 15,939 chars and 136 distinct ag-* class tokens — it will break on every upgrade and tell you nothing.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Errors → What They Mean" accent="amber" glyph="🧯" span={2}>
        <GuideTable
          head={['Message', 'Means / try']}
          rows={[
            ['An update... not wrapped in act(...)', 'State settled after assertions ran — await the interaction, or use findBy/waitFor'],
            ['Unable to find role "X"', 'Absent, hidden from a11y tree, or not rendered yet — logRoles(container); switch to findByRole'],
            ['Found multiple elements with text: X', 'Ambiguous — narrow with getByRole(role, { name }), or scope with within()'],
            ['Unable to find element with text: X (but visible)', 'Text split across elements — use a regex, toHaveTextContent, or query the parent'],
            ['Timed out in waitFor. (no assertion error)', 'The callback returned a promise that never settled — usually an async callback'],
            ['waitForElementToBeRemoved: already removed', 'Spinner never rendered or already gone — assert presence first'],
            ['Test timed out in 5000ms (fake timers on)', "user-event without advanceTimers — its guard timer is frozen too"],
            ['TypeError: toggle is not a function', 'Zustand setState(obj, true) replaced the store and wiped the actions'],
            ['AG Grid: error #200 ... moduleName=Pagination', 'A separate-module feature needs ModuleRegistry — console.error, not a throw'],
            ['[MSW] intercepted request without handler', "onUnhandledRequest: 'error' doing its job — add the handler, or check the URL"],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={19} title="Section Index" accent="pink" glyph="📖" span={2}>
        <GuideCode>{`0. RTL Fundamentals                  queries, setup, philosophy
1. Testing Components                props, events, conditional render
2. Testing Custom Hooks              renderHook, act, rerender
3. Testing Async & APIs              MSW, fetch, loading/error states
4. Waiting, act(), Async Failures    waitFor internals, fake timers, flakes
5. Testing Forms & Routing           validation, submission, router
6. Layered & Third-Party             AG Grid, Zustand, handler passing
7. Testing Patterns & CI             custom render, factories, coverage
8. Best Practices & Anti-Patterns    query ladder, what not to test
9. This field guide`}</GuideCode>
        <GuideRules items={[
          'Printing: hit Ctrl/Cmd-P straight from the page — print styles force the light palette regardless of the on-screen toggle, and keep each panel whole across page breaks.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
