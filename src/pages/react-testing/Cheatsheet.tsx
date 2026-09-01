import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function ReactTestingCheatsheet() {
  return (
    <GuideLayout
      title="React Testing"
      kicker="FIELD GUIDE"
      glyph="🧪"
      tagline="RTL, Vitest and MSW — every signature and error string here was run against the real stack, not recalled."
      meta={['Vitest 4.1 · RTL 16.3 · MSW 2.15', 'React 19', '14 panels']}
      page="1 / 1"
      footer="The eight lessons in this section carry the reasoning and the worked examples; this page is the recall sheet."
      prev={{ path: '/react-testing/best-practices', label: 'Best Practices & Anti-Patterns' }}
      next={null}
    >
      <GuidePanel n={1} title="Setup & Config" accent="blue" glyph="📦">
        <GuideCode>{`npm i -D vitest jsdom
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm i -D msw

// vite.config.ts — import from 'vitest/config', NOT 'vite'
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.ts' },
});

// src/setupTests.ts
import '@testing-library/jest-dom/vitest';`}</GuideCode>
        <GuideRules items={[
          "vite's own defineConfig has no 'test' key — importing it from 'vite' fails with \"'test' does not exist\".",
          'globals: true gives describe/test/expect with no import. Without it, RTL needs afterEach(cleanup) by hand.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Jest → Vitest" accent="purple" glyph="🔁">
        <GuideDefs
          items={[
            ['jest.fn', 'vi.fn'],
            ['jest.mock', 'vi.mock'],
            ['jest.spyOn', 'vi.spyOn'],
            ['jest.useFakeTimers', 'vi.useFakeTimers'],
            ['jest.advanceTimersByTime', 'vi.advanceTimersByTime'],
            ['jest.clearAllMocks', 'vi.clearAllMocks'],
          ]}
        />
        <GuideRules items={[
          'vi.mock needs vi.hoisted() for shared variables; ES module mocking is native, not transform-based.',
          'jest-dom imports from @testing-library/jest-dom/vitest, not the plain package root.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Query Matrix" accent="green" glyph="🔍" span={2}>
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
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Query Priority Ladder" accent="amber" glyph="🪜" span={2}>
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

      <GuidePanel n={5} title="user-event v14" accent="pink" glyph="🖱️" span={2}>
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

      <GuidePanel n={6} title="jest-dom Matchers" accent="cyan" glyph="✅" span={2}>
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

      <GuidePanel n={7} title="Async: findBy vs waitFor vs waitForElementToBeRemoved" accent="red" glyph="⏳" span={2}>
        <GuideTable
          head={['Tool', 'Use when', 'Common misuse']}
          rows={[
            ['findBy*', 'one element should appear — sugar for waitFor + getBy', 'no await — pending promise is truthy, assertion silently passes'],
            ['waitFor(cb)', "condition isn't \"one element exists\" — a count, a spy call, a disappearance", 'side effects (user.click) inside — the callback is retried many times'],
            ['waitForElementToBeRemoved(cb)', 'a spinner or toast should go away', 'calling it when never there — throws immediately'],
          ]}
        />
        <GuideRules items={[
          'Default timeout is 1000ms (verified: getConfig().asyncUtilTimeout === 1000).',
          "There is no findBy for absence. waitFor(() => expect(queryByText('x')).not.toBeInTheDocument()) passes instantly if it just hasn't rendered YET — wait for the positive replacement, or use waitForElementToBeRemoved.",
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Custom Hooks — renderHook" accent="blue" glyph="🪝">
        <GuideCode>{`const { result, rerender, unmount } = renderHook(() => useCounter());
act(() => result.current.increment());
expect(result.current.count).toBe(1);   // read result.current AT assertion time

const { result: r2, rerender: re } = renderHook(
  ({ value }) => useDebounce(value, 500),
  { initialProps: { value: 'hello' } },
);
re({ value: 'world' });

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
renderHook(() => useAuth(), { wrapper });`}</GuideCode>
        <GuideRules items={[
          'Destructuring result.current up front snapshots the FIRST render and never updates — always read through result.current at assertion time.',
          "render, fireEvent, and user-event are already wrapped in act(). Calling a hook's returned function directly is the case act() doesn't cover for you.",
          '"not wrapped in act(...)" is a real signal, not noise — an update landed outside the window your assertions were watching.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Debugging" accent="purple" glyph="🔦">
        <GuideCode>{`const sidebar = screen.getByRole('navigation');
within(sidebar).getAllByRole('link');       // scope queries to a subtree

screen.debug();                  // pretty-print the DOM (truncates ~7000 chars)
screen.debug(undefined, 30000);  // raise the limit

logRoles(container);             // every role present + its elements — LOGS, returns undefined

const { asFragment } = render(<Badge label="New" />);
expect(asFragment()).toMatchSnapshot();   // use sparingly — brittle diffs`}</GuideCode>
        <GuideRules items={[
          'within() is essential for tables and repeated rows — scope before you query.',
          "logRoles is the fix for 'unable to find role' — it prints every role in the container.",
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="MSW v2 — The Renames" accent="green" glyph="🔀" span={2}>
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
        <GuideRules items={[
          "Verified on 2.15.0: 'rest' in msw is false. http exposes get/post/put/patch/delete/head/options/all; HttpResponse exposes json/text/html/xml/arrayBuffer/formData/error.",
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="MSW Handlers & Lifecycle" accent="amber" glyph="🌐" span={2}>
        <GuideCode>{`export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
  http.get('/api/users/:id', ({ params }) => HttpResponse.json({ id: Number(params.id) })),
  http.post('/api/users', async ({ request }) => HttpResponse.json(await request.json(), { status: 201 })),
  http.delete('/api/users/:id', () => new HttpResponse(null, { status: 204 })),
];

// Node (Vitest/Jest) uses setupServer, NOT setupWorker — no service worker in tests
import { setupServer } from 'msw/node';
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());   // drops per-test server.use() overrides
afterAll(() => server.close());`}</GuideCode>
        <GuideRules items={[
          "onUnhandledRequest: 'error' fails the test on any request no handler matched (verified: the fetch rejects) — catches missing mocks before they hit a real API.",
          "A vi.spyOn(fetch) stub only proves you called the function the test expected — it can't catch a wrong method, a missing header, or a bad body, because the return value isn't a real Response. MSW runs the real fetch.",
          "If you do stub fetch, use spyOn — restoreAllMocks() can't undo a hand-assigned global.fetch = vi.fn().",
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Custom Render With Providers" accent="pink" glyph="🧩" span={2}>
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
export { renderWithProviders as render };   // shadow render — import from YOUR test-utils`}</GuideCode>
        <GuideRules items={[
          "QueryClient needs retry: false in tests — React Query's default 3-attempt retry turns an error-state test into a timeout.",
          'MemoryRouter + <Routes> covers only the declarative API. useLoaderData/useActionData/useNavigation/<Form> need a data router: createMemoryRouter(...) + <RouterProvider>.',
          "initialEntries is a PROP on MemoryRouter but an OPTION in createMemoryRouter's second argument.",
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Fake Timers — The Footgun" accent="cyan" glyph="⏰" span={2}>
        <GuideCode>{`beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
await user.type(screen.getByRole('searchbox'), 'react');
expect(onSearch).not.toHaveBeenCalled();
act(() => vi.advanceTimersByTime(300));
expect(onSearch).toHaveBeenCalledWith('react');`}</GuideCode>
        <GuideRules items={[
          "advanceTimers alone is NOT enough on Vitest. @testing-library/dom's jestFakeTimersAreEnabled() checks for a global 'jest' — Vitest has none, so it short-circuits to false and RTL believes real timers are running.",
          'Verified: under that gap, waitFor / findBy* / waitForElementToBeRemoved / awaited user-event calls all hang until timeout — even when the condition is already true.',
          "shouldAdvanceTime: true is the fix — the fake clock creeps forward against real time so RTL's polling makes progress, without costing determinism.",
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Common Errors → What They Mean" accent="red" glyph="🧯" span={2}>
        <GuideTable
          head={['Message', 'Means / try']}
          rows={[
            ['An update... not wrapped in act(...)', 'State settled after assertions ran — await the interaction, or use findBy/waitFor'],
            ['Unable to find role "X"', 'Absent, hidden from a11y tree, or not rendered yet — logRoles(container); switch to findByRole if async'],
            ['Found multiple elements with text: X', 'Ambiguous — narrow with getByRole(role, { name }), scope with within(), or use getAllBy'],
            ['Unable to find element with text: X (but visible)', 'Text split across elements — use a regex, toHaveTextContent, or query the parent'],
            ['waitForElementToBeRemoved: already removed', 'Spinner never rendered or already gone — assert presence first, or wait for its replacement'],
            ['Value "X" not found in options', "selectOptions matched neither option.value nor exact innerHTML — pass the value or the element"],
            ['Test timed out (fake timers on)', 'The Vitest fake-timer detection gap — add shouldAdvanceTime: true'],
            ['[MSW] intercepted request without handler', "onUnhandledRequest: 'error' doing its job — add the handler, or check the URL"],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
