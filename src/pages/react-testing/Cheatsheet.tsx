import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const th = { padding: '0.75rem', textAlign: 'left' as const, color: 'var(--accent-amber)' };
const td = { padding: '0.75rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, margin: '1rem 0' };
const headRow = { borderBottom: '2px solid var(--border-color)' };
const row = { borderBottom: '1px solid var(--border-color)' };

export default function ReactTestingCheatsheet() {
  return (
    <LessonLayout
      title="React Testing Library Cheat Sheet"
      sectionId="react-testing"
      lessonIndex={7}
      prev={{ path: '/react-testing/best-practices', label: 'Best Practices & Anti-Patterns' }}
      next={null}
    >
      <p>
        A single-page reconciliation of the seven lessons that precede this one. Every API
        signature, matcher name, and error string below was run against the real stack rather than
        recalled: <strong>Vitest 4.1.11</strong>, <strong>@testing-library/react 16.3.2</strong>,{' '}
        <strong>@testing-library/dom 10.4.1</strong>, <strong>jest-dom 7.0.1</strong>,{' '}
        <strong>user-event 14.6.6</strong>, <strong>MSW 2.15.0</strong>, React 19.
      </p>

      <h2>Setup</h2>

      <CodeBlock language="bash" title="Install" showLineNumbers={false}>
{`# Runner + a DOM for it to render into
npm install -D vitest jsdom

# Testing Library: renderer, custom matchers, interaction simulation
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Optional, but the section's default for anything that talks to an API
npm install -D msw`}
      </CodeBlock>

      <CodeBlock language="typescript" title="vite.config.ts — note the import source">
{`// 'vitest/config', NOT 'vite'. Vite's own defineConfig has no 'test' key, so
// importing from 'vite' fails with "Object literal may only specify known
// properties — 'test' does not exist".
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',        // give tests a DOM (default is 'node')
    globals: true,               // describe/test/expect without importing them
    setupFiles: './src/setupTests.ts',
    css: true,                   // process CSS imports instead of erroring
  },
});

// Alternative if the config must keep importing from 'vite':
//   /// <reference types="vitest/config" />   <- as the FIRST line of the file`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/setupTests.ts — runs once before every test file">
{`import '@testing-library/jest-dom/vitest';   // registers toBeInTheDocument() etc.

// With globals: true, RTL auto-cleans between tests. Without it:
//   import { cleanup } from '@testing-library/react';
//   afterEach(cleanup);`}
      </CodeBlock>

      <InfoBox variant="note" title="Reading the jest.* calls in this section">
        <p style={{ marginBottom: 0 }}>
          The lessons write <code>jest.*</code> because that is what most existing codebases and
          most RTL answers online use. On Vitest the API is the same shape under a different
          namespace, so every example translates mechanically:{' '}
          <code>jest.fn</code> → <code>vi.fn</code> · <code>jest.mock</code> →{' '}
          <code>vi.mock</code> · <code>jest.spyOn</code> → <code>vi.spyOn</code> ·{' '}
          <code>jest.useFakeTimers</code> → <code>vi.useFakeTimers</code> ·{' '}
          <code>jest.advanceTimersByTime</code> → <code>vi.advanceTimersByTime</code> ·{' '}
          <code>jest.clearAllMocks</code> → <code>vi.clearAllMocks</code>. The three real
          differences: <code>vi.mock</code> needs <code>vi.hoisted()</code> for shared variables,
          ES module mocking is native rather than transform-based, and jest-dom is imported from{' '}
          <code>@testing-library/jest-dom/vitest</code>.
        </p>
      </InfoBox>

      <h2>The Query Matrix</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Query</th>
            <th style={th}>Returns</th>
            <th style={th}>0 matches</th>
            <th style={th}>2+ matches</th>
            <th style={th}>Await?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>getBy</code></td>
            <td style={td}>Element</td>
            <td style={td}><strong>Throws</strong></td>
            <td style={td}><strong>Throws</strong></td>
            <td style={td}>No</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>queryBy</code></td>
            <td style={td}>Element | null</td>
            <td style={td}>Returns <code>null</code></td>
            <td style={td}><strong>Throws</strong></td>
            <td style={td}>No</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>findBy</code></td>
            <td style={td}>Promise&lt;Element&gt;</td>
            <td style={td}>Rejects after timeout</td>
            <td style={td}>Rejects</td>
            <td style={td}><strong>Yes</strong></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>getAllBy</code></td>
            <td style={td}>Element[]</td>
            <td style={td}><strong>Throws</strong></td>
            <td style={td}>Fine</td>
            <td style={td}>No</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>queryAllBy</code></td>
            <td style={td}>Element[]</td>
            <td style={td}>Returns <code>[]</code></td>
            <td style={td}>Fine</td>
            <td style={td}>No</td>
          </tr>
          <tr>
            <td style={td}><code>findAllBy</code></td>
            <td style={td}>Promise&lt;Element[]&gt;</td>
            <td style={td}>Rejects after timeout</td>
            <td style={td}>Fine</td>
            <td style={td}><strong>Yes</strong></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="success" title="Picking one is three questions, in order">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Must it be there right now?</strong> → <code>getBy</code>. The throw <em>is</em>{' '}
            the assertion, and its failure message prints the DOM.
          </li>
          <li>
            <strong>Will it be there, after async work?</strong> → <code>findBy</code>, awaited.
            Never <code>getBy</code> in a <code>waitFor</code> you could have written as{' '}
            <code>findBy</code>.
          </li>
          <li>
            <strong>Must it NOT be there?</strong> → <code>queryBy</code>, the only variant that
            returns <code>null</code> instead of throwing:{' '}
            <code>expect(screen.queryByText(&apos;Error&apos;)).not.toBeInTheDocument()</code>.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="The two traps this table encodes">
        <p style={{ marginBottom: 0 }}>
          <strong>1)</strong> <code>queryBy</code> still throws on multiple matches — it is
          forgiving about <em>zero</em>, not about ambiguity. To assert &ldquo;none of
          these&rdquo; safely, use <code>queryAllBy(...)</code> and check{' '}
          <code>toHaveLength(0)</code>. <strong>2)</strong> A bare <code>findBy</code> with no{' '}
          <code>await</code> returns a pending promise, which is truthy — so{' '}
          <code>expect(screen.findByText(&apos;x&apos;)).toBeInTheDocument()</code> passes
          against an element that never appeared.
        </p>
      </InfoBox>

      <h2>Query Priority Ladder</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>#</th>
            <th style={th}>Query</th>
            <th style={th}>Use when</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}>1</td>
            <td style={td}><code>getByRole</code></td>
            <td style={td}>Always try first — buttons, headings, textboxes, links. Add <code>{'{ name }'}</code> to disambiguate</td>
          </tr>
          <tr style={row}>
            <td style={td}>2</td>
            <td style={td}><code>getByLabelText</code></td>
            <td style={td}>Form fields with an associated <code>&lt;label&gt;</code></td>
          </tr>
          <tr style={row}>
            <td style={td}>3</td>
            <td style={td}><code>getByPlaceholderText</code></td>
            <td style={td}>The field genuinely has no label (fix the component if you can)</td>
          </tr>
          <tr style={row}>
            <td style={td}>4</td>
            <td style={td}><code>getByText</code></td>
            <td style={td}>Non-interactive content — paragraphs, spans, list items</td>
          </tr>
          <tr style={row}>
            <td style={td}>5</td>
            <td style={td}><code>getByDisplayValue</code></td>
            <td style={td}>Finding an input by its <em>current</em> value</td>
          </tr>
          <tr style={row}>
            <td style={td}>6</td>
            <td style={td}><code>getByAltText</code></td>
            <td style={td}>Images and <code>area</code> elements</td>
          </tr>
          <tr style={row}>
            <td style={td}>7</td>
            <td style={td}><code>getByTitle</code></td>
            <td style={td}>Rarely — <code>title</code> is inconsistently exposed to screen readers</td>
          </tr>
          <tr>
            <td style={td}>8</td>
            <td style={td}><code>getByTestId</code></td>
            <td style={td}>Last resort, for things with no accessible handle at all (a canvas, a chart, a portal backdrop)</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="The ladder in practice">
{`screen.getByRole('button', { name: /submit/i });
screen.getByRole('heading', { level: 2, name: /profile/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('combobox', { name: /language/i });   // <select>
screen.getByRole('checkbox', { name: /dark mode/i });

screen.getByLabelText(/password/i);
screen.getByText(/welcome back/i);
screen.getByTestId('custom-dropdown');                 // last resort`}
      </CodeBlock>

      <h2>user-event v14</h2>

      <InfoBox variant="danger" title="Two rules that cause most user-event bugs">
        <p style={{ marginBottom: 0 }}>
          <strong>1)</strong> Call <code>userEvent.setup()</code> once per test,{' '}
          <em>before</em> <code>render()</code>. <strong>2)</strong> Every method on the returned
          instance is <code>async</code> — verified, they all return a real{' '}
          <code>Promise</code>. A missing <code>await</code> does not fail loudly; it just lets
          your assertions run before React has re-rendered, which reads as a mysteriously stale
          DOM.
        </p>
      </InfoBox>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Call</th>
            <th style={th}>Does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>const user = userEvent.setup()</code></td>
            <td style={td}>Creates the instance. Options: <code>delay</code>, <code>advanceTimers</code>, <code>pointerEventsCheck</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.click(el)</code></td>
            <td style={td}>pointerdown, mousedown, pointerup, mouseup, click, plus focus — not just <code>click</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.type(el, &apos;abc&apos;)</code></td>
            <td style={td}>Appends, one key at a time. Supports <code>{'{enter}'}</code>, <code>{'{backspace}'}</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.clear(el)</code></td>
            <td style={td}>Empties an input. <code>type</code> appends, so clear first to replace</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.selectOptions(sel, v)</code></td>
            <td style={td}>Matches <code>option.value</code> <strong>or</strong> exact <code>innerHTML</code>; or pass the option element</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.upload(input, file)</code></td>
            <td style={td}>Sets <code>input.files</code>. Build with <code>new File([&apos;x&apos;], &apos;a.txt&apos;, {'{ type }'})</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.hover(el)</code> / <code>unhover</code></td>
            <td style={td}>Pointer-over sequences — tooltips, hover menus</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>await user.keyboard(&apos;{'{Escape}'}&apos;)</code></td>
            <td style={td}>Keys at the document level, no target needed — modals, shortcuts</td>
          </tr>
          <tr>
            <td style={td}><code>await user.tab()</code></td>
            <td style={td}>Moves focus; also the way to trigger blur validation</td>
          </tr>
        </tbody>
      </table>

      <p>
        Also on the instance, verified present: <code>dblClick</code>, <code>tripleClick</code>,{' '}
        <code>deselectOptions</code>, <code>pointer</code>, <code>paste</code>,{' '}
        <code>copy</code>, <code>cut</code>.
      </p>

      <InfoBox variant="warning" title="selectOptions: what the string is actually matched against">
        <p style={{ marginBottom: 0 }}>
          The Forms lesson says to pass the value, not the visible label. Reading the source, the
          real rule is <code>o.value === val || o.innerHTML === val</code> — so for{' '}
          <code>&lt;option value=&quot;es&quot;&gt;Spanish&lt;/option&gt;</code> both{' '}
          <code>&apos;es&apos;</code> and <code>&apos;Spanish&apos;</code> work. But{' '}
          <code>innerHTML</code> is compared with strict equality, so any wrapping element or
          stray whitespace in the option breaks the label form and you get{' '}
          <code>Value &quot;Spanish&quot; not found in options</code>. Pass the value, or pass the
          element — <code>user.selectOptions(sel, screen.getByRole(&apos;option&apos;, {'{ name: /spanish/i }'}))</code>{' '}
          — and the ambiguity disappears.
        </p>
      </InfoBox>

      <h2>jest-dom Matchers</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Matcher</th>
            <th style={th}>Asserts</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>toBeInTheDocument()</code></td>
            <td style={td}>Element is attached to the document. The default presence check</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveTextContent(str | regex)</code></td>
            <td style={td}>Text content, <strong>substring</strong> match — flattens nested elements</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toBeVisible()</code></td>
            <td style={td}>Present <em>and</em> not hidden by display/visibility/opacity/<code>hidden</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toBeDisabled()</code></td>
            <td style={td}>Disabled, including via a disabled ancestor <code>fieldset</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveValue(val)</code></td>
            <td style={td}>Value of an input, select, or textarea</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveAttribute(name, val?)</code></td>
            <td style={td}>Attribute present, optionally equal to a value</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveClass(...names)</code></td>
            <td style={td}>Class names present. Add <code>{'{ exact: true }'}</code> for the full set</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveFocus()</code></td>
            <td style={td}>Element is <code>document.activeElement</code> — pairs with <code>user.tab()</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveAccessibleName(str)</code></td>
            <td style={td}>Computed accessible name (label, <code>aria-label</code>, content)</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toHaveAccessibleDescription(str)</code></td>
            <td style={td}>Computed description — usually via <code>aria-describedby</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>toBeChecked()</code></td>
            <td style={td}>Checkbox/radio, or anything with <code>aria-checked</code></td>
          </tr>
          <tr>
            <td style={td}><code>toHaveFormValues(obj)</code></td>
            <td style={td}>Whole form at once, keyed by <code>name</code>. Call on the <code>&lt;form&gt;</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="The a11y and whole-form matchers, which get underused">
{`// Given: <label for="n">Name</label>
//        <input id="n" name="name" value="Ada" aria-describedby="h" />
//        <p id="h">Your full name</p>
//        <input type="checkbox" name="ok" checked aria-label="Agree" />

expect(screen.getByLabelText('Name')).toHaveAccessibleName('Name');
expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Your full name');

// One assertion instead of one per field:
expect(screen.getByRole('form')).toHaveFormValues({ name: 'Ada', ok: true });`}
      </CodeBlock>

      <InfoBox variant="warning" title="toHaveStyle reads COMPUTED styles">
        <p style={{ marginBottom: 0 }}>
          jsdom does not load external stylesheets or CSS Modules, so{' '}
          <code>toHaveStyle({'{ textDecoration: \'line-through\' }'})</code> only passes when the
          rule arrives as an inline <code>style</code> prop. Applied via a class, the computed
          value is empty and you get a confusing diff. This is also why{' '}
          <code>toHaveClass</code> shows up in the lessons despite being an implementation
          detail — when appearance carries meaning, put the meaning in the markup
          (<code>role=&quot;status&quot;</code>, <code>data-variant</code>) and assert that
          instead.
        </p>
      </InfoBox>

      <h2>Async: findBy vs waitFor vs waitForElementToBeRemoved</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Tool</th>
            <th style={th}>Reach for it when</th>
            <th style={th}>Common misuse</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>findBy*</code></td>
            <td style={td}>One element should appear. Sugar for <code>waitFor</code> + <code>getBy</code></td>
            <td style={td}>Forgetting <code>await</code> — the pending promise is truthy and the assertion silently passes</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>waitFor(cb)</code></td>
            <td style={td}>The condition is not &ldquo;one element exists&rdquo; — a count, a spy call, a disappearance</td>
            <td style={td}>Putting side effects (a <code>user.click</code>) inside — the callback is retried many times</td>
          </tr>
          <tr>
            <td style={td}><code>waitForElementToBeRemoved(cb)</code></td>
            <td style={td}>A spinner or toast should go away</td>
            <td style={td}>Calling it when the element was never there — it throws immediately rather than passing</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="jsx" title="Verified behaviours">
{`// findBy — the default for "appears after async work"
expect(await screen.findByText('Alice')).toBeInTheDocument();

// waitFor — assertions that aren't a single element
await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(5));
await waitFor(() => expect(onSave).toHaveBeenCalledWith({ id: 1 }));

// waitForElementToBeRemoved — pass a CALLBACK returning queryBy, not an element
await waitForElementToBeRemoved(() => screen.queryByText('Loading…'));

// If it was already gone, that call throws:
//   "The element(s) given to waitForElementToBeRemoved are already removed."
// So it doubles as an assertion that the loading state actually rendered.

// Default timeout is 1000ms (verified: getConfig().asyncUtilTimeout === 1000)
await screen.findByText('Slow', {}, { timeout: 3000 });`}
      </CodeBlock>

      <InfoBox variant="tip" title="Do not await a negative">
        <p style={{ marginBottom: 0 }}>
          There is no <code>findBy</code> for absence, and{' '}
          <code>await waitFor(() =&gt; expect(queryByText(&apos;x&apos;)).not.toBeInTheDocument())</code>{' '}
          passes instantly on the first poll if the element has not rendered <em>yet</em> — it
          proves nothing. Either wait for the positive thing that replaces it (
          <code>await screen.findByText(&apos;Done&apos;)</code>, then assert the absence
          synchronously) or use <code>waitForElementToBeRemoved</code>, which requires the element
          to have existed.
        </p>
      </InfoBox>

      <h2>Custom Hooks — renderHook</h2>

      <CodeBlock language="jsx" title="result.current, act, rerender, wrapper">
{`import { renderHook, act } from '@testing-library/react';

// renderHook returns exactly three things: { result, rerender, unmount }
const { result, rerender, unmount } = renderHook(() => useCounter());

// ALWAYS read through result.current at assertion time.
// Destructuring up front snapshots the FIRST render and never updates:
//   const { count } = renderHook(() => useCounter()).result.current;  // stale forever
act(() => result.current.increment());
expect(result.current.count).toBe(1);

// Props: pass initialProps, then rerender with new ones
const { result: r2, rerender: re } = renderHook(
  ({ value, delay }) => useDebounce(value, delay),
  { initialProps: { value: 'hello', delay: 500 } },
);
re({ value: 'world', delay: 500 });
act(() => vi.advanceTimersByTime(500));
expect(r2.current).toBe('world');

// Context: same 'wrapper' option that render() takes
const wrapper = ({ children }) => <AuthProvider initialUser={user}>{children}</AuthProvider>;
const { result: r3 } = renderHook(() => useAuth(), { wrapper });`}
      </CodeBlock>

      <InfoBox variant="info" title="When you actually need act()">
        <p style={{ marginBottom: 0 }}>
          <code>render</code>, <code>fireEvent</code>, and every <code>user-event</code> call are
          already wrapped in <code>act()</code> for you. The uncovered case is exactly the one
          above: calling a hook&apos;s returned function directly. Treat the{' '}
          <em>&ldquo;not wrapped in act(...)&rdquo;</em> warning as a real signal — it means an
          update landed outside the window your assertions were watching, which is where flaky
          tests come from.
        </p>
      </InfoBox>

      <h2>Debugging</h2>

      <CodeBlock language="jsx" title="within, debug, logRoles, asFragment">
{`import { render, screen, within, logRoles } from '@testing-library/react';

// within() — scope queries to a subtree. Essential for tables and repeated rows.
const sidebar = screen.getByRole('navigation');
expect(within(sidebar).getAllByRole('link')).toHaveLength(4);

const bobRow = screen.getByText('Bob').closest('tr');
await user.click(within(bobRow).getByRole('button', { name: /delete/i }));

// screen.debug() — pretty-print the DOM. Truncates at 7000 chars by default.
screen.debug();                 // whole body
screen.debug(sidebar);          // one element
screen.debug(undefined, 30000); // raise the limit

// logRoles() — the fix for "unable to find role". Prints every role in the
// container with the elements that carry it. Returns undefined; it LOGS.
const { container } = render(<App />);
logRoles(container);

// asFragment() — a DocumentFragment snapshot, from render()'s return value
const { asFragment } = render(<Badge label="New" />);
expect(asFragment()).toMatchSnapshot();   // use sparingly — brittle, noisy diffs`}
      </CodeBlock>

      <h2>MSW v2</h2>

      <InfoBox variant="danger" title="v1 → v2 renames — most tutorials you find are still v1">
        <table style={tableStyle}>
          <thead>
            <tr style={headRow}>
              <th style={th}>MSW v1</th>
              <th style={th}>MSW v2</th>
            </tr>
          </thead>
          <tbody>
            <tr style={row}>
              <td style={td}><code>import {'{ rest }'} from &apos;msw&apos;</code></td>
              <td style={td}><code>import {'{ http, HttpResponse }'} from &apos;msw&apos;</code> — <code>rest</code> no longer exists</td>
            </tr>
            <tr style={row}>
              <td style={td}><code>rest.get(url, (req, res, ctx) =&gt; ...)</code></td>
              <td style={td}><code>http.get(url, ({'{ request, params }'}) =&gt; ...)</code> — one object arg</td>
            </tr>
            <tr style={row}>
              <td style={td}><code>res(ctx.json(data))</code></td>
              <td style={td}><code>HttpResponse.json(data)</code> — returned, not called</td>
            </tr>
            <tr style={row}>
              <td style={td}><code>res(ctx.status(500), ctx.json(e))</code></td>
              <td style={td}><code>HttpResponse.json(e, {'{ status: 500 }'})</code></td>
            </tr>
            <tr style={row}>
              <td style={td}><code>req.body</code></td>
              <td style={td}><code>await request.json()</code> — a real Fetch API <code>Request</code></td>
            </tr>
            <tr>
              <td style={td}><code>req.url.searchParams</code></td>
              <td style={td}><code>new URL(request.url).searchParams</code></td>
            </tr>
          </tbody>
        </table>
        <p style={{ marginBottom: 0 }}>
          Verified on 2.15.0: <code>&apos;rest&apos; in msw</code> is <code>false</code>.{' '}
          <code>http</code> exposes <code>get, post, put, patch, delete, head, options, all</code>;{' '}
          <code>HttpResponse</code> exposes <code>json, text, html, xml, arrayBuffer, formData, error</code>.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="mocks/handlers.js + mocks/server.js">
{`import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }])),

  http.get('/api/users/:id', ({ params }) =>
    HttpResponse.json({ id: Number(params.id), name: 'Alice' })),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  http.get('/api/items', ({ request }) => {
    const page = new URL(request.url).searchParams.get('page');
    return HttpResponse.json(page === '2' ? page2 : page1);
  }),

  http.delete('/api/users/:id', () => new HttpResponse(null, { status: 204 })),
];

// mocks/server.js — Node (Vitest/Jest) uses setupServer, NOT setupWorker.
// There is no service worker and no mockServiceWorker.js in your tests.
import { setupServer } from 'msw/node';
export const server = setupServer(...handlers);`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Lifecycle — in setupTests, once for the whole suite">
{`beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());   // drops per-test server.use() overrides
afterAll(() => server.close());

// onUnhandledRequest: 'error' fails the test on any request no handler matched —
// verified: the fetch rejects. Catches missing mocks and stops tests from
// quietly hitting a real API.

// Per-test override; undone by resetHandlers()
server.use(
  http.get('/api/users', () =>
    HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })),
);`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why MSW over stubbing fetch">
        <p style={{ marginBottom: 0 }}>
          A <code>vi.spyOn(global, &apos;fetch&apos;)</code> stub returning{' '}
          <code>{'{ ok: true, json: async () => data }'}</code> asserts only that you called the
          function the test told it to expect. It cannot catch a wrong HTTP method, a missing{' '}
          <code>Content-Type</code>, a badly serialized body, or an ignored non-200 status —
          because that object is not a <code>Response</code>. With MSW the real{' '}
          <code>fetch</code> runs and a real <code>Response</code> comes back, so those bugs
          surface. If you do stub, use <code>spyOn</code> — <code>restoreAllMocks()</code> cannot
          undo a hand-assigned <code>global.fetch = vi.fn()</code>, so it leaks into every later
          test in the file.
        </p>
      </InfoBox>

      <h2>Custom Render With Providers</h2>

      <CodeBlock language="jsx" title="test-utils.jsx — the wrapper pattern">
{`import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

export function renderWithProviders(ui, {
  queryClient = createTestQueryClient(),
  route = '/',
  user = null,
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialUser={user}>
          <ThemeProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
  }
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

export * from '@testing-library/react';    // re-export everything
export { renderWithProviders as render };  // ...then shadow render`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Using it — import from YOUR test-utils">
{`import { render, screen } from '../test-utils';   // NOT @testing-library/react

render(<Dashboard />, { user: { id: 1, name: 'Alice' }, route: '/dashboard' });

// retry: false matters. React Query's default retry means a failed request is
// attempted 3 times with backoff, so an error-state test times out instead of
// failing usefully.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Routing: MemoryRouter covers only the declarative API">
        <p style={{ marginBottom: 0 }}>
          <code>MemoryRouter</code> + <code>&lt;Routes&gt;</code> is right for the declarative
          API. A component calling <code>useLoaderData</code>, <code>useActionData</code>,{' '}
          <code>useNavigation</code>, or rendering <code>&lt;Form&gt;</code> throws inside it —
          those need a data router. Build one the way your app does:{' '}
          <code>createMemoryRouter(routes, {'{ initialEntries: [\'/users/42\'] }'})</code> then{' '}
          <code>render(&lt;RouterProvider router={'{router}'} /&gt;)</code>. Note{' '}
          <code>initialEntries</code> is a <em>prop</em> on <code>MemoryRouter</code> but an{' '}
          <em>option</em> in <code>createMemoryRouter</code>&apos;s second argument.
        </p>
      </InfoBox>

      <h2>Fake Timers — The Footgun</h2>

      <CodeBlock language="jsx" title="The recipe that actually works on Vitest">
{`beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

test('debounces the search callback', async () => {
  const onSearch = vi.fn();
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(<SearchInput onSearch={onSearch} debounceMs={300} />);
  await user.type(screen.getByRole('searchbox'), 'react');

  expect(onSearch).not.toHaveBeenCalled();      // still inside the window
  act(() => vi.advanceTimersByTime(300));       // step past it
  expect(onSearch).toHaveBeenCalledWith('react');
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="Why advanceTimers alone is not enough on Vitest — verified">
        <p>
          The Async lesson&apos;s advice — pass{' '}
          <code>{'{ advanceTimers: jest.advanceTimersByTime }'}</code> to{' '}
          <code>userEvent.setup()</code> — is correct <strong>on Jest</strong>. On Vitest it is
          not sufficient, and the reason is in <code>@testing-library/dom</code>&apos;s source:
        </p>
        <CodeBlock language="javascript" title="helpers.js — the detection guard">
{`function jestFakeTimersAreEnabled() {
  if (typeof jest !== 'undefined' && jest !== null) {
    return setTimeout._isMockFunction === true ||
           Object.prototype.hasOwnProperty.call(setTimeout, 'clock');
  }
  return false;   // <- Vitest lands here: there is no 'jest' global
}`}
        </CodeBlock>
        <p>
          Under Vitest, <code>setTimeout.clock</code> <em>is</em> present, but{' '}
          <code>typeof jest === &apos;undefined&apos;</code>, so the function short-circuits to{' '}
          <code>false</code>. RTL then believes real timers are running and polls{' '}
          <code>waitFor</code> on a clock nothing ever advances. Measured on this stack:{' '}
          <code>waitFor</code> hangs until the test times out <em>even when its condition is
          already true</em>, and since <code>findBy*</code>,{' '}
          <code>waitForElementToBeRemoved</code> and every awaited <code>user-event</code> call
          route through it, they all hang too. Setting <code>delay: null</code> does not help;
          neither does <code>advanceTimers</code> on its own.
        </p>
        <p style={{ marginBottom: 0 }}>
          <code>shouldAdvanceTime: true</code> is the fix — the fake clock creeps forward against
          real time, so RTL&apos;s polling makes progress. Verified that this does{' '}
          <strong>not</strong> cost you determinism: the debounce above still does not fire until
          the explicit <code>advanceTimersByTime(300)</code>.
        </p>
      </InfoBox>

      <h2>Common Errors → What They Actually Mean</h2>

      <table style={tableStyle}>
        <thead>
          <tr style={headRow}>
            <th style={th}>Message</th>
            <th style={th}>What it means / first thing to try</th>
          </tr>
        </thead>
        <tbody>
          <tr style={row}>
            <td style={td}><code>An update to X inside a test was not wrapped in act(...)</code></td>
            <td style={td}>State settled after your assertions ran — usually an un-awaited promise or a timer firing post-test. Not noise to silence: <code>await</code> the interaction, or use <code>findBy</code>/<code>waitFor</code> so the update lands inside the window</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>Unable to find an accessible element with the role &quot;X&quot;</code></td>
            <td style={td}>The role is absent, or the element is hidden from the a11y tree (<code>display:none</code>, <code>aria-hidden</code>), or it has not rendered yet. Run <code>logRoles(container)</code>; if it is async, switch to <code>findByRole</code></td>
          </tr>
          <tr style={row}>
            <td style={td}><code>Found multiple elements with the text: X</code></td>
            <td style={td}>Ambiguous query. Narrow with <code>getByRole(role, {'{ name }'})</code>, scope with <code>within()</code>, or switch to <code>getAllBy</code> if several genuinely should match</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>Unable to find an element with the text: X</code> <em>(but you can see it)</em></td>
            <td style={td}>Text is split across elements. <code>getByText</code> matches per text node — use a regex, <code>toHaveTextContent</code>, or query the parent</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>The element(s) given to waitForElementToBeRemoved are already removed</code></td>
            <td style={td}>The spinner never rendered, or had already gone by the time you looked. Assert it is present first, or wait for its replacement instead</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>Value &quot;X&quot; not found in options</code></td>
            <td style={td}>From <code>selectOptions</code>. The string matched neither <code>option.value</code> nor the option&apos;s exact <code>innerHTML</code> — pass the value, or pass the option element</td>
          </tr>
          <tr style={row}>
            <td style={td}><code>Test timed out in 5000ms</code> <em>(with fake timers on)</em></td>
            <td style={td}>The RTL/Vitest fake-timer detection gap above. Add <code>shouldAdvanceTime: true</code></td>
          </tr>
          <tr>
            <td style={td}><code>[MSW] Error: intercepted a request without a matching request handler</code></td>
            <td style={td}>Real behaviour of <code>onUnhandledRequest: &apos;error&apos;</code>. Add the handler, or check the URL — handlers match the full request URL</td>
          </tr>
        </tbody>
      </table>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="All 8 lessons, in reading order">
{`1. RTL Fundamentals              Vitest setup, render/screen, query matrix + priority,
                                  user-event vs fireEvent, test doubles vocabulary
2. Testing Components            props, conditional rendering, lists, events, state,
                                  context providers, children/slots
3. Testing Custom Hooks          renderHook, result.current, act, rerender, cleanup,
                                  timers, hooks that read context
4. Testing Async & APIs          findBy vs waitFor, MSW v2, stubbing fetch, pagination,
                                  retry, fake timers + debounce
5. Testing Forms & Routing       inputs, validation, submission, file upload,
                                  MemoryRouter vs createMemoryRouter
6. Testing Patterns & CI         custom render, data factories, page objects, error
                                  boundaries, portals, jest-axe, coverage, GitHub Actions
7. Best Practices & Anti-Patterns
8. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
