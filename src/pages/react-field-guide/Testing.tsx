import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTesting() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="Testing Quick Reference"
      tagline="React Testing Library + Vitest — queries, user-event, hooks, async, and the test smells to avoid."
      meta={['RTL · Vitest', '14 patterns']}
      footerLabel="Personal study reference — React Testing"
      pageLabel="React 19 Field Guide · Testing"
      prev={{ path: '/react-field-guide/recipes', label: 'Common Recipes' }}
      next={{ path: '/react-field-guide/stability', label: 'Re-Renders, Memo & Stability' }}
    >
      <PosterCard
        glyph="Rn"
        title={<>render<span className="dim"> + </span>screen</>}
        code={`import { render, screen } from '@testing-library/react';

test('renders greeting message', () => {
  render(<Greeting name="Alice" />);
  expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
});`}
        caption="render() mounts into jsdom; always destructure screen instead of render()'s own return value — it's bound to the latest render automatically and works with debug()/within()."
      />

      <PosterCard
        glyph="Pr"
        title="Query Priority"
        language="text"
        code={`1. getByRole      — button, heading, textbox (try this first)
2. getByLabelText — form fields with associated labels
3. getByPlaceholderText
4. getByText      — non-interactive content
5. getByTestId    — last resort only`}
        caption="Queries near the top mirror how users and assistive tech actually find elements. getByTestId means real users (and screen readers) can't find it that way either — reach for it only when nothing else works."
      />

      <PosterCard
        glyph="Qt"
        title={<>getBy<span className="dim"> vs </span>queryBy<span className="dim"> vs </span>findBy</>}
        code={`screen.getByRole('heading', { name: /welcome/i });         // throws if missing
expect(screen.queryByText('Error')).not.toBeInTheDocument(); // null if missing
const item = await screen.findByText('Loaded!');             // async, waits + throws`}
        caption="getBy is for elements that must exist right now. queryBy is the only one that returns null instead of throwing — use it to assert something is absent. findBy is getBy plus waitFor combined."
      />

      <PosterCard
        glyph="Ue"
        title={<>user-event<span className="dim"> vs </span>fireEvent</>}
        code={`const user = userEvent.setup();

await user.type(screen.getByLabelText(/email/i), 'a@b.com');
await user.click(screen.getByRole('button', { name: /sign in/i }));`}
        caption="user.click fires pointerdown, mousedown, pointerup, mouseup, click, and focus — a full real interaction. fireEvent.click fires only the click event, missing bugs that depend on the other steps."
      />

      <PosterCard
        glyph="Hk"
        title={<>renderHook<span className="dim">()</span></>}
        code={`import { renderHook, act } from '@testing-library/react';

test('increments the counter', () => {
  const { result } = renderHook(() => useCounter());
  act(() => { result.current.increment(); });
  expect(result.current.count).toBe(1);
});`}
        caption="Tests a hook in isolation without a host component. render() and userEvent wrap state updates in act() automatically — renderHook doesn't, so wrap any call that triggers a state update yourself."
      />

      <PosterCard
        glyph="Rr"
        title={<>renderHook<span className="dim"> — rerender</span></>}
        code={`const { result, rerender } = renderHook(
  ({ value, delay }) => useDebounce(value, delay),
  { initialProps: { value: 'hello', delay: 500 } }
);
rerender({ value: 'world', delay: 500 });
act(() => jest.advanceTimersByTime(500));
expect(result.current).toBe('world');`}
        caption="rerender feeds new props into the same hook instance, simulating a parent re-render — essential for hooks whose behavior depends on how a prop changes over time (debounce, previous-value tracking)."
      />

      <PosterCard
        glyph="As"
        title="Testing Async Data"
        code={`test('shows users after loading', async () => {
  render(<UserList />);
  const heading = await screen.findByRole('heading', { name: /users/i });
  expect(heading).toBeInTheDocument();
});

// waitFor — when the wait isn't a single queryable element
await waitFor(() => {
  expect(screen.getAllByRole('listitem')).toHaveLength(5);
});`}
        caption="findBy is sugar for waitFor + getBy — prefer it when waiting on a single element. Reach for waitFor when you need to assert multiple conditions or something that isn't queryable."
      />

      <PosterCard
        glyph="MSW"
        title="Mock Service Worker"
        code={`export const handlers = [
  http.get('/api/users', () => HttpResponse.json([{ id: 1, name: 'Alice' }])),
];
export const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());`}
        caption="MSW intercepts requests at the network level — your component's actual fetch/axios calls run untouched. onUnhandledRequest: 'error' fails loudly if a request has no matching handler, catching mock gaps early."
      />

      <PosterCard
        glyph="Fm"
        title="Testing Forms"
        code={`await user.type(screen.getByLabelText(/email/i), 'not-an-email');
await user.click(screen.getByRole('button', { name: /register/i }));
expect(screen.getByText(/valid email/i)).toBeInTheDocument();

// Query errors the same accessible way real users/screen readers do
screen.getByRole('alert');`}
        caption={'Link validation errors to inputs with aria-describedby and role="alert" — it makes the app more accessible and gives your tests a real query target instead of a data-testid.'}
      />

      <PosterCard
        glyph="Rt"
        title="Testing React Router"
        code={`import { MemoryRouter } from 'react-router-dom';

render(
  <MemoryRouter initialEntries={['/users/42']}>
    <App />
  </MemoryRouter>
);
expect(screen.getByText(/user #42/i)).toBeInTheDocument();`}
        caption="MemoryRouter with initialEntries sets the starting URL without a real browser — it works with useParams, useSearchParams, useNavigate and the rest of the location hooks. Don't mock useNavigate/useParams directly; test real navigation. It does NOT run loaders or actions — see the next card."
      />

      <PosterCard
        glyph="3R"
        title={<>Which test router?<span className="dim"> — all three</span></>}
        code={`// 1. MemoryRouter — declarative. NO loaders/actions.
//    useLoaderData() throws "must be used within a data router".
<MemoryRouter initialEntries={['/users/42']}><App /></MemoryRouter>

// 2. createMemoryRouter — a REAL data router in memory.
//    Loaders, actions, errorElement, fetchers all run for real.
const router = createMemoryRouter(routes, { initialEntries: ['/users/42'] });
render(<RouterProvider router={router} />);

// 3. createRoutesStub — returns a component; stub loaders per test.
const Stub = createRoutesStub([
  { path: '/users/:id', Component: UserPage, loader: () => ({ name: 'Alice' }) },
]);
render(<Stub initialEntries={['/users/42']} />);`}
        caption="Pick by what the component reads. Only location hooks → MemoryRouter, the lightest option. Real loaders/actions you want to exercise → createMemoryRouter with your actual route config. A component that needs loader data but whose real loader you'd rather not run → createRoutesStub, which takes the same route objects but lets you swap in a per-test loader."
      />

      <PosterCard
        glyph="S/M"
        title={<>Spy vs Mock<span className="dim"> — pick deliberately</span></>}
        code={`// SPY — observes, real implementation still runs
const spy = vi.spyOn(analytics, 'track');
await user.click(saveButton);
expect(spy).toHaveBeenCalledWith('save_clicked');
spy.mockRestore();          // always restore a spy

// MOCK — replaces, real implementation does NOT run
vi.mock('./api', () => ({ saveUser: vi.fn().mockResolvedValue({ id: 1 }) }));`}
        caption="A spy observes; a mock asserts. Spy when the real behavior should still happen and you only want to record that a call occurred. Mock when the real thing is slow, networked, or non-deterministic and you are substituting its behavior outright. Prefer MSW over mocking fetch — it replaces the network, not your code, so the component's real request path still runs."
      />

      <PosterCard
        glyph="Cr"
        title={<>Custom Render<span className="dim"> with Providers</span></>}
        code={`function Wrapper({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider><ThemeProvider>{children}</ThemeProvider></AuthProvider>
    </QueryClientProvider>
  );
}
export const render = (ui, opts) => rtlRender(ui, { wrapper: Wrapper, ...opts });`}
        caption="Wrap every test's render in your app's real providers once, in one file, so you never forget one — re-export everything from that same module so tests import from test-utils, not @testing-library/react directly."
      />

      <PosterCard
        glyph="Sm"
        title="Test Smells to Avoid"
        code={`// ❌ expect(component.state.isOpen).toBe(true);   — implementation detail
// ❌ jest.spyOn(React, 'useEffect');               — testing library internals
// ❌ expect(container).toMatchSnapshot();          — too broad, noisy diffs

// ✅ test what the user sees:
expect(await screen.findByText(/success/i)).toBeInTheDocument();`}
        caption="A good test survives a refactor from useState to useReducer or class to function component. If a test breaks without any user-visible behavior changing, it was testing implementation, not behavior."
      />

      <PosterQuickRef
        title="Which query or tool do I need?"
        rows={[
          { need: 'Element must exist right now', answer: 'getByRole / getByText' },
          { need: 'Assert something is absent', answer: 'queryByRole / queryByText' },
          { need: 'Element appears after async work', answer: 'findByRole / findByText' },
          { need: 'Simulate a real user interaction', answer: 'userEvent, not fireEvent' },
          { need: 'Test a hook in isolation', answer: 'renderHook + act()' },
          { need: 'Mock API responses', answer: 'MSW (setupServer + handlers)' },
          { need: 'Test a routed component (location only)', answer: 'MemoryRouter + initialEntries' },
          { need: 'Test a route with real loaders/actions', answer: 'createMemoryRouter + RouterProvider' },
          { need: 'Test loader data without the real loader', answer: 'createRoutesStub' },
          { need: 'Record that a call happened', answer: 'Spy — real code still runs' },
          { need: 'Replace behavior entirely', answer: 'Mock — real code does not run' },
          { need: 'App has multiple providers', answer: 'Custom render() wrapper' },
        ]}
      />
    </PosterLayout>
  );
}
