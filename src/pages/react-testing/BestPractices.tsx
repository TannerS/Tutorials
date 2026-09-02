import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BestPractices() {
  return (
    <LessonLayout
      title="Best Practices & Anti-Patterns"
      sectionId="react-testing"
      lessonIndex={6}
      prev={{ path: '/react-testing/patterns', label: 'Testing Patterns & CI' }}
      next={{ path: '/react-testing/cheatsheet', label: '📋 React Testing Library Cheat Sheet' }}
    >
      <p>
        Every lesson up to here has shown you <em>how</em> to write a test. This one is
        about how to <em>decide</em>: which query, which assertion, what to leave
        untested, and how to read the errors RTL gives you when you get it wrong.
        Almost every rule below collapses into one sentence, so start there.
      </p>

      <InfoBox variant="tip" title="The Guiding Principle">
        <p>
          &ldquo;The more your tests resemble the way your software is used, the more
          confidence they can give you.&rdquo; — Kent C. Dodds
        </p>
        <p style={{ marginBottom: 0 }}>
          This is not a slogan about writing nicer tests. It is a{' '}
          <strong>falsifiable criterion</strong>: for any line of a test, ask whether a
          real user could have caused it or could observe it. If neither, that line is
          buying you nothing and will cost you on the next refactor.
        </p>
      </InfoBox>

      <h2>What the Principle Rules Out</h2>
      <p>
        Read literally, the principle deletes whole categories of test. A user cannot
        read a <code>useState</code> variable, cannot call a component&apos;s method, does
        not know a prop&apos;s name, and never sees a class attribute. So none of those
        belong in an assertion:
      </p>

      <table>
        <thead>
          <tr>
            <th>You wrote</th>
            <th>Can a user cause/observe it?</th>
            <th>Verdict</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>expect(state.isOpen).toBe(true)</code></td>
            <td>No — state is invisible</td>
            <td>Delete. Assert the panel is on screen.</td>
          </tr>
          <tr>
            <td><code>expect(el).toHaveClass(&apos;is-active&apos;)</code></td>
            <td>No — users see the <em>effect</em> of a class</td>
            <td>Assert the effect (visible, disabled, pressed).</td>
          </tr>
          <tr>
            <td><code>expect(onChange).toHaveBeenCalled()</code></td>
            <td>Partly — it is your component&apos;s contract</td>
            <td>Fine at a boundary. Not as a substitute for output.</td>
          </tr>
          <tr>
            <td><code>expect(await screen.findByRole(&apos;alert&apos;))…</code></td>
            <td>Yes — a screen reader announces it</td>
            <td>Keep.</td>
          </tr>
          <tr>
            <td><code>expect(container).toMatchSnapshot()</code></td>
            <td>No — users do not diff markup</td>
            <td>Not an assertion. See below.</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="The only question that matters"
        chart={"graph TD\n  A[Test went red] --> B{Behaviour changed?}\n  B -->|Yes| C[Good test.<br/>Fix the component.]\n  B -->|No| D{Why did it break?}\n  D -->|Class or prop renamed| E[Implementation detail.<br/>Rewrite the test.]\n  D -->|Markup reshuffled| F[Query too structural.<br/>Move up the ladder.]\n  D -->|Order dependent| G[Shared state or bad wait.<br/>Fix the test.]\n  style C fill:#1a3329,stroke:#4ade80\n  style E fill:#3b1a1a,stroke:#f87171\n  style F fill:#3b1a1a,stroke:#f87171\n  style G fill:#3b1a1a,stroke:#f87171"}
      />

      <InfoBox variant="note" title="The Corollary Nobody Quotes">
        The principle cuts <em>both</em> ways. It rules out implementation-detail tests,
        but it equally rules out tests so abstracted that no user journey is represented
        — a suite of one-assertion-per-prop tests that never once fills in the form and
        presses the button. A component with 100% line coverage and no test that
        completes a real task is still untested in the only sense that matters.
      </InfoBox>

      <h2>The Query Ladder Is a Discipline, Not a Menu</h2>
      <p>
        You have seen the priority list already. What the list does not explain is{' '}
        <em>why</em> it is ordered that way, and the ordering is the whole point: each
        rung down is a step further from what the user perceives and a step closer to
        how you happened to build the markup.
      </p>

      <FlowChart
        title="Each rung down trades user-truth for convenience"
        chart={"graph TD\n  R1[\"1. getByRole<br/>the accessibility tree\"] --> R2[\"2. getByLabelText<br/>the form contract\"]\n  R2 --> R3[\"3. getByPlaceholderText<br/>visible, but not a label\"]\n  R3 --> R4[\"4. getByText<br/>DOM, not the a11y tree\"]\n  R4 --> R5[\"5. getByDisplayValue<br/>value, not identity\"]\n  R5 --> R6[\"6. getByAltText<br/>images only\"]\n  R6 --> R7[\"7. getByTitle<br/>exposed inconsistently\"]\n  R7 --> R8[\"8. getByTestId<br/>perceivable by nobody\"]\n  style R1 fill:#1a3329,stroke:#4ade80\n  style R2 fill:#1a3329,stroke:#4ade80\n  style R8 fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        Rung by rung, here is the actual argument:
      </p>
      <ul>
        <li>
          <strong>getByRole</strong> queries the <em>accessibility tree</em> — the same
          structure a screen reader walks. It asserts two things at once: the element
          exists, and it is exposed correctly. Nothing else on the ladder does that.
        </li>
        <li>
          <strong>getByLabelText</strong> is second because a label is a real,
          user-facing contract that assistive tech uses — but it is scoped to form
          controls, and it does not check the control&apos;s <em>role</em>. A{' '}
          <code>&lt;div&gt;</code> wired up with <code>aria-labelledby</code> passes this
          query while being unusable by keyboard.
        </li>
        <li>
          <strong>getByPlaceholderText</strong> drops a rung because a placeholder is{' '}
          <em>not</em> a label. It disappears the moment the user types, and — as
          verified below — it does not even contribute an accessible name. Reaching for
          it usually means the field has no label, which is a bug you just tested around.
        </li>
        <li>
          <strong>getByText</strong> is fine for prose and headings, but it walks the DOM,
          not the a11y tree. It happily finds text inside{' '}
          <code>aria-hidden</code> and <code>hidden</code> subtrees that no user can reach.
        </li>
        <li>
          <strong>getByDisplayValue</strong> identifies a field by its <em>current</em>{' '}
          contents, so the query breaks the moment the test types into it. Useful for
          asserting pre-filled state; poor for locating.
        </li>
        <li>
          <strong>getByAltText</strong> and <strong>getByTitle</strong> are narrow and
          unreliable in turn: <code>alt</code> only exists on a few elements, and{' '}
          <code>title</code> is exposed inconsistently across browsers and screen readers
          — it is the accessible-name computation&apos;s <em>last</em> fallback, which is
          exactly why you should not build a query on it.
        </li>
        <li>
          <strong>getByTestId</strong> is at the bottom because a{' '}
          <code>data-testid</code> is perceivable by <em>nobody</em>. It never fails when
          the UI becomes unusable, because it is not connected to usability at all.
        </li>
      </ul>

      <p>
        The gap between rung 1 and rung 4 is not theoretical. Render a card with two
        buttons a user genuinely cannot reach — one inside <code>&lt;div hidden&gt;</code>,
        one inside <code>aria-hidden=&quot;true&quot;</code> — and the two queries
        disagree completely:
      </p>

      <CodeBlock language="text" title="Actual output — the same DOM, queried two ways">
{`OK   getByRole('button', { name: 'Download' })
FAIL getByRole('button', { name: 'Hidden action' })    <- inside <div hidden>
FAIL getByRole('button', { name: 'Decorative' })       <- inside aria-hidden
OK   getByText('Hidden action')                        <- text query ignores the a11y tree
OK   getByText('Decorative')
OK   getByRole('button', { name: 'Hidden action', hidden: true })`}
      </CodeBlock>

      <p>
        <code>getByRole</code> refuses to find what a user cannot reach, which is exactly
        the behaviour you want: a test that passes because it found a button inside an{' '}
        <code>aria-hidden</code> subtree is a test asserting that a broken UI works. The{' '}
        <code>{'{ hidden: true }'}</code> option exists for the rare case where you
        deliberately want to assert on the inert branch.
      </p>

      <InfoBox variant="warning" title="data-testid Is an Escape Hatch, Not a Default">
        <p>
          There are legitimate uses: a drag handle with no name, a canvas, a container you
          need to scope <code>within()</code> to, a third-party widget you do not control.
          What makes them legitimate is that <em>no accessible alternative exists</em>.
        </p>
        <p style={{ marginBottom: 0 }}>
          The failure mode is reaching for it because a role query threw. That query threw
          for a reason — see the next section. Every <code>data-testid</code> added to
          silence a failing <code>getByRole</code> is an accessibility bug you have
          formally agreed to stop noticing.
        </p>
      </InfoBox>

      <h2>How an Accessible Name Actually Resolves</h2>
      <p>
        <code>getByRole(&apos;button&apos;, {'{ name: ... }'})</code> does not read{' '}
        <code>textContent</code>. It runs the W3C <em>accessible name computation</em> —
        the same algorithm a screen reader uses to decide what to announce. RTL delegates
        this to the <code>dom-accessibility-api</code> package. The precedence, highest
        first: <code>aria-labelledby</code>, then <code>aria-label</code>, then the
        element&apos;s own content (recursively, including nested{' '}
        <code>alt</code> text), then <code>title</code> as a last resort.
      </p>

      <CodeBlock language="jsx" title="A probe of every rule at once">
{`import { render, screen } from '@testing-library/react';

render(
  <div>
    <span id="lbl">Delete permanently</span>
    <button aria-labelledby="lbl" aria-label="Remove">Trash</button>
    <button aria-label="Close dialog">X</button>
    <button title="Print page" />
    <button><img src="/s.png" alt="Save draft" /></button>
    <button>Send <span>message</span></button>
    <button>  Sign   in  </button>
  </div>
);`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — RTL 16.3.2, @testing-library/dom 10.4.1, React 19.2.6">
{`OK   name="Delete permanently"   <- aria-labelledby beats aria-label
FAIL name="Remove"               <- aria-label is shadowed by aria-labelledby
OK   name="Close dialog"         <- aria-label beats text content
FAIL name="X"                    <- the visible text is NOT the name
OK   name="Print page"           <- title, only because there is no content
OK   name="Save draft"           <- nested <img alt> becomes the button's name
OK   name="Send message"         <- nested elements are flattened
FAIL name="Send  message"        <- ...and whitespace is collapsed to one space
OK   name="Sign in"              <- leading/trailing whitespace trimmed
FAIL name="Trash"`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two Results That Catch Everyone">
        <p>
          <strong>A placeholder is not an accessible name.</strong> Calling{' '}
          <code>computeAccessibleName()</code> on{' '}
          <code>&lt;input type=&quot;text&quot; placeholder=&quot;Email address&quot; /&gt;</code>{' '}
          returns the empty string <code>&quot;&quot;</code>. So{' '}
          <code>getByRole(&apos;textbox&apos;, {'{ name: \'Email address\' }'})</code>{' '}
          <em>fails</em> while <code>getByPlaceholderText(&apos;Email address&apos;)</code>{' '}
          succeeds. That divergence is the ladder telling you the field needs a real label.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong><code>&lt;input type=&quot;password&quot;&gt;</code> has no role at all.</strong>{' '}
          Rendering text, password, search, number, email inputs and a textarea together,{' '}
          <code>logRoles</code> reports only <code>textbox</code>, <code>searchbox</code>{' '}
          and <code>spinbutton</code> — the password field appears nowhere.{' '}
          <code>getByRole(&apos;textbox&apos;, {'{ name: \'Password\' }'})</code> can never
          work. Use <code>getByLabelText(/password/i)</code>. This is not an RTL quirk; the
          HTML-ARIA mapping genuinely assigns password inputs no role, so that assistive
          tech does not read the value aloud.
        </p>
      </InfoBox>

      <h2>Name Matching Is Exact, Unless You Say Otherwise</h2>
      <p>
        A <em>string</em> <code>name</code> must match the whole normalised accessible
        name. A partial string silently does not match — which is why{' '}
        <code>{'{ name: \'Sav\' }'}</code> throws against a button named{' '}
        <code>Save</code>. Use a regex when you want a substring, and prefer the
        case-insensitive form so a design tweak from <em>SAVE</em> to <em>Save</em>{' '}
        does not turn the suite red.
      </p>

      <CodeBlock language="jsx" title="Exact vs regex name matching">
{`screen.getByRole('button', { name: 'Save changes' });   // exact, normalised
screen.getByRole('button', { name: 'Sav' });            // throws — not a substring
screen.getByRole('button', { name: /save/i });          // substring, case-insensitive

// The whitespace is normalised for you, so this markup:
//   <button>Send <span>message</span></button>
// is named exactly "Send message" — one space, no newlines.`}
      </CodeBlock>

      <h2>Debugging a Failing Role Query</h2>
      <p>
        When a role query throws, RTL prints every role currently in the document. Read
        that list before changing anything — it usually contains the diagnosis. Here is a
        real failure against a panel whose &ldquo;Submit&rdquo; control is a{' '}
        <code>&lt;div onClick&gt;</code>:
      </p>

      <CodeBlock language="jsx" title="The component under test">
{`function SearchPanel() {
  return (
    <section>
      <h2>Find a user</h2>
      <label htmlFor="q">Search</label>
      <input id="q" type="search" />
      <div onClick={handleSubmit}>Submit</div>   {/* <- the bug */}
      <img src="/x.png" alt="Logo" />
    </section>
  );
}

screen.getByRole('button', { name: /submit/i });`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — the thrown error, abridged">
{`Unable to find an accessible element with the role "button" and name \`/submit/i\`

Here are the accessible roles:

  heading:
  Name "Find a user":
  <h2 />
  --------------------------------------------------
  searchbox:
  Name "Search":
  <input id="q" type="search" />
  --------------------------------------------------
  img:
  Name "Logo":
  <img alt="Logo" src="/x.png" />
  --------------------------------------------------

Ignored nodes: comments, script, style
<body>
  ...
      <div>
        Submit
      </div>
  ...
</body>`}
      </CodeBlock>

      <InfoBox variant="success" title="Read That Output Again">
        The <code>&lt;div&gt;Submit&lt;/div&gt;</code> is <strong>absent from the role
        list entirely</strong>. It is in the DOM dump at the bottom but has no role, no
        name, no keyboard focus and no Enter/Space handling. The test did not fail because
        RTL is fussy — it failed because a keyboard user cannot submit this form. Changing
        the query to <code>getByText(&apos;Submit&apos;)</code> makes the test green and
        leaves the bug. Changing the <code>div</code> to a <code>&lt;button
        type=&quot;submit&quot;&gt;</code> fixes both. <strong>A failing role query is
        usually a bug report.</strong>
      </InfoBox>

      <h2>logRoles and screen.debug()</h2>
      <p>
        You do not have to wait for a failure to see the a11y tree.{' '}
        <code>logRoles(container)</code> prints it on demand, grouped by role with the
        computed name for each element — it is the fastest way to answer &ldquo;what
        should I be querying for?&rdquo;
      </p>

      <CodeBlock language="jsx" title="logRoles — printing the accessibility tree">
{`import { render, logRoles } from '@testing-library/react';

test('what roles does this render?', () => {
  const { container } = render(<SearchPanel />);
  logRoles(container);   // note: takes an element, not screen
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output">
{`heading:

Name "Find a user":
<h2 />

--------------------------------------------------
searchbox:

Name "Search":
<input
  id="q"
  type="search"
/>

--------------------------------------------------
img:

Name "Logo":
<img
  alt="Logo"
  src="/x.png"
/>

--------------------------------------------------`}
      </CodeBlock>

      <p>
        <code>screen.debug()</code> is the blunter instrument: it pretty-prints the DOM
        itself. Two things about it are worth knowing before you fight it.
      </p>

      <InfoBox variant="warning" title="screen.debug() Truncates, and Not Where You Think">
        <p>
          Rendering a 400-row list and calling <code>screen.debug()</code> prints exactly{' '}
          <strong>7003 characters</strong> and then <code>...</code> — the default{' '}
          <code>DEBUG_PRINT_LIMIT</code> is 7000. If your output stops mid-element it was
          not corrupted, it was cut off. Scope the dump instead of fighting it:
        </p>
        <CodeBlock language="jsx">
{`screen.debug(screen.getByRole('table'));   // just that subtree — usually the real fix
screen.debug(undefined, 40000);            // whole body, bigger limit
// or from the shell:  DEBUG_PRINT_LIMIT=40000 npx vitest run`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          The limit is a good deal stranger than the docs suggest, which is worth knowing
          the first time a raised limit does nothing. See below.
        </p>
      </InfoBox>

      <p>
        The truncation in <code>prettyDOM</code> — which is what <code>screen.debug()</code>{' '}
        calls — compares <code>maxLength</code> against one string and then slices a{' '}
        <em>different</em> one:
      </p>

      <CodeBlock language="javascript" title="@testing-library/dom 10.4.1 — dist/pretty-dom.js">
{`// (the real source builds the first branch with a template literal;
//  shown here with concatenation, same behaviour)
return maxLength !== undefined && dom.outerHTML.length > maxLength
  ? debugContent.slice(0, maxLength) + '...'
  : debugContent;`}
      </CodeBlock>

      <p>
        The decision is made on <code>dom.outerHTML.length</code> (raw HTML), but the cut
        is applied to <code>debugContent</code> — the pretty-printed, syntax-coloured
        version, which is far longer. On that same 400-row list:
      </p>

      <CodeBlock language="text" title="Actual output">
{`body.outerHTML.length (the value compared to maxLength) : 15523
pretty-printed length (the value actually sliced)        : 49600

default limit 7000:   15523 > 7000  -> truncates, printing 7003 of 49600 chars
maxLength = 20000:    15523 < 20000 -> no truncation, printing all 49600 chars`}
      </CodeBlock>

      <p>
        Two practical consequences. Raising the limit is <em>all or nothing</em> — once it
        clears your raw HTML length you get the entire coloured dump, however enormous. And
        at the default you see far less than &ldquo;7000 characters of DOM&rdquo;, because
        much of that budget is spent on ANSI colour codes. Both are reasons to pass an
        element to <code>screen.debug()</code> rather than dumping{' '}
        <code>document.body</code>. (Setting <code>DEBUG_PRINT_LIMIT=300</code> and
        re-running does print 303 characters, so the env var is genuinely read at print
        time — it is the <em>comparison</em> that is surprising, not the plumbing.)
      </p>

      <InfoBox variant="tip" title="testing-playground.com">
        <p>
          The third tool, and the one that shortcuts the other two: paste your markup into{' '}
          <strong>testing-playground.com</strong>, click any element, and it shows you the
          query RTL recommends for it — colour-coded by ladder rung, so a red suggestion is
          itself the signal that the markup needs fixing.
        </p>
        <p style={{ marginBottom: 0 }}>
          The same engine runs in-test: <code>screen.logTestingPlaygroundURL()</code>{' '}
          prints a URL with the current DOM already encoded into it. Drop it in a failing
          test, open the link, click the element you wanted, copy the query it gives you.
        </p>
      </InfoBox>

      <h2>The Anti-Pattern Catalogue</h2>
      <p>
        Each of these is shown wrong first, then right, with the reason it matters. They
        are ordered roughly by how often they show up in a real code review.
      </p>

      <h3>1. Testing Implementation Details</h3>
      <CodeBlock language="jsx" title="WRONG — asserting on state, props and instances">
{`// Enzyme-era habits that RTL deliberately does not support
expect(wrapper.state('isOpen')).toBe(true);
expect(wrapper.find(Modal).prop('visible')).toBe(true);
wrapper.instance().handleSubmit();

// The modern equivalent: spying on your own hook
const spy = jest.spyOn(hooks, 'useCart');
expect(spy).toHaveBeenCalled();`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — assert the consequence">
{`await user.click(screen.getByRole('button', { name: /open settings/i }));
expect(await screen.findByRole('dialog', { name: /settings/i })).toBeInTheDocument();`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> <code>isOpen</code> can be renamed, promoted to a reducer,
        lifted into context, or replaced by a <code>&lt;dialog&gt;</code> element. Every
        one of those is a refactor with no behaviour change, and every one of them breaks
        the first version. The second version survives all four and additionally proves
        the dialog is announced to a screen reader.
      </p>

      <h3>2. container.querySelector Instead of a Semantic Query</h3>
      <CodeBlock language="jsx" title="WRONG">
{`const { container } = render(<CheckoutForm />);
const btn = container.querySelector('.btn-primary');
fireEvent.click(btn);`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT">
{`render(<CheckoutForm />);
await user.click(screen.getByRole('button', { name: /place order/i }));`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> the failure modes are not comparable. A class rename makes{' '}
        <code>querySelector</code> return <code>null</code> — <em>silently</em> — and you
        find out one line later with an error that names neither the element you wanted
        nor what was actually rendered:
      </p>
      <CodeBlock language="text" title="Actual output — what a stale selector gets you">
{`container.querySelector(".btn-primary-v2") returned: null
...then fireEvent.click(el) threw:
   Unable to fire a "click" event - please provide a DOM element.

screen.getByRole("button", { name: "Sav" }) threw:
   Unable to find an accessible element with the role "button" and name "Sav"
   (followed by the full list of roles that DO exist)`}
      </CodeBlock>
      <p>
        The RTL error tells you what you asked for and what was available. The{' '}
        <code>querySelector</code> path tells you that <code>null</code> is not a DOM
        element. On a suite of 400 tests, that difference is hours.
      </p>

      <h3>3. Snapshots Used as Assertions</h3>
      <CodeBlock language="jsx" title="WRONG">
{`test('renders correctly', () => {
  const { container } = render(<Toolbar />);
  expect(container.firstChild).toMatchSnapshot();
});`}
      </CodeBlock>
      <p>
        Change <code>class=&quot;toolbar&quot;</code> to{' '}
        <code>class=&quot;toolbar toolbar--sticky&quot;</code> — a purely cosmetic edit,
        zero behaviour change — and:
      </p>
      <CodeBlock language="text" title="Actual output — Vitest 4.1.11">
{`FAIL  snap/toolbar.test.tsx > renders correctly
Error: Snapshot \`renders correctly 1\` mismatched

- Expected
+ Received

@@ -1,7 +1,7 @@
  <div
-   class="toolbar"
+   class="toolbar toolbar--sticky"
  >
    <button
      class="btn"
    >
      Save

 Snapshots  1 failed`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — say what you actually mean">
{`test('offers save and cancel', () => {
  render(<Toolbar />);
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
});

// If you do want a snapshot, make it small and targeted. Leave the argument
// off and the runner writes it into this file on the first run, so the
// expected value is reviewable in the diff rather than in a sidecar file.
expect(screen.getByRole('status')).toMatchInlineSnapshot();`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> a test named <em>renders correctly</em> went red without
        anything becoming incorrect. The reviewer&apos;s only options are to read a DOM
        diff carefully or to run <code>-u</code> and move on — and after the third false
        alarm, everyone runs <code>-u</code>. At that point the snapshot is not asserting
        anything; it is a changelog that fails the build. Snapshots earn their keep for
        small, stable, human-readable output (an error message, a formatted currency
        string, a serialised reducer state) where the diff <em>is</em> the specification.
      </p>

      <h3>4. waitFor Wrapping a getBy</h3>
      <CodeBlock language="jsx" title="WRONG">
{`await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument();
});`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT">
{`expect(await screen.findByText('Loaded')).toBeInTheDocument();`}
      </CodeBlock>
      <p>
        <strong>Why —</strong> and here the honest answer is narrower than the usual
        folklore. Running both against an element that never appears, the timings and the
        error messages come out <em>identical</em>: 1005ms vs 1002ms, and the same{' '}
        <em>&ldquo;Unable to find an element with the text: Loaded&rdquo;</em> plus DOM
        dump. <code>findBy</code> is literally <code>waitFor</code> + <code>getBy</code>,
        so that is expected. The real reasons to prefer it:
      </p>
      <ul>
        <li>
          It is one expression instead of a callback, and it returns the element, so you
          can chain assertions on it.
        </li>
        <li>
          <code>eslint-plugin-testing-library</code> ships a{' '}
          <code>prefer-find-by</code> rule that autofixes it, so the codebase converges
          whether or not anyone remembers the guidance.
        </li>
        <li>
          Most importantly, it removes the <em>callback</em>, and the callback is where
          the real damage happens — see the next two entries.
        </li>
      </ul>

      <h3>5. Empty and Incorrect waitFor Callbacks</h3>
      <CodeBlock language="jsx" title="WRONG — three ways to assert nothing">
{`// (a) The "just let React settle" waitFor
await waitFor(() => {});

// (b) A negative assertion that is true before the work even starts
await waitFor(() => {
  expect(onSave).not.toHaveBeenCalled();
});

// (c) A side effect inside the retried callback
await waitFor(async () => {
  await user.click(screen.getByRole('button', { name: /retry/i }));
  expect(screen.getByText('Done')).toBeInTheDocument();
});`}
      </CodeBlock>
      <CodeBlock language="text" title="Actual output — what (a) and (b) really do">
{`await waitFor(() => {})                                 resolved in 2ms, asserted nothing
await waitFor(() => expect(spy).not.toHaveBeenCalled())  resolved in 2ms — passed on the FIRST tick

a failing waitFor callback ran 20 times before its 1000ms timeout`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> <code>waitFor</code> resolves as soon as the callback stops
        throwing. An empty callback never throws, so (a) is a no-op that costs 2ms and
        buys nothing. (b) is worse than useless: a &ldquo;not called&rdquo; expectation is
        satisfied immediately, so the test passes and would keep passing even if{' '}
        <code>onSave</code> fired a millisecond later. And that <strong>20 retries</strong>{' '}
        number is why (c) is dangerous — the callback is polled roughly every 50ms, so a
        click inside it can fire up to twenty times before you notice.
      </p>
      <CodeBlock language="jsx" title="RIGHT">
{`// (a) — wait for the thing you were actually waiting for
expect(await screen.findByRole('status')).toHaveTextContent('Saved');

// (b) — a negative needs a bounded window, not a poll. Wait for a POSITIVE
//       signal that the work is finished, THEN assert the absence once.
await user.click(screen.getByRole('button', { name: /cancel/i }));
expect(await screen.findByText(/discarded/i)).toBeInTheDocument();  // it's done
expect(onSave).not.toHaveBeenCalled();                              // now this means something

// (c) — side effects go OUTSIDE; only the assertion is retried
await user.click(screen.getByRole('button', { name: /retry/i }));
await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(2));`}
      </CodeBlock>

      <InfoBox variant="info" title="The Rule for waitFor Callbacks">
        A <code>waitFor</code> callback must be <strong>pure, cheap, and contain exactly
        one assertion</strong>. No clicks, no typing, no <code>fetch</code>, no{' '}
        <code>render</code>. If you need a side effect, it belongs on the line above.
      </InfoBox>

      <h3>6. Asserting on className</h3>
      <CodeBlock language="jsx" title="WRONG">
{`expect(screen.getByRole('button')).toHaveClass('btn--loading');
expect(tab).toHaveClass('tab--selected');
expect(row).toHaveStyle({ backgroundColor: '#fee' });`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — assert the state the class is expressing">
{`expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
expect(screen.getByRole('tab', { name: /billing/i })).toHaveAttribute('aria-selected', 'true');
expect(await screen.findByRole('alert')).toHaveTextContent(/payment declined/i);`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> a class name is an internal token. Rename it, migrate to CSS
        modules (where it becomes <code>Button_loading__x7f2q</code>), or move to Tailwind,
        and the test breaks while the UI is unchanged. Worse, it passes when the class is
        present but the styling was deleted. Every &ldquo;state&rdquo; class has a
        user-observable counterpart — <code>disabled</code>, <code>aria-selected</code>,{' '}
        <code>aria-expanded</code>, <code>aria-pressed</code>, <code>role=&quot;alert&quot;</code>,
        or simply different text — and asserting on that counterpart tests the class{' '}
        <em>and</em> the semantics together.
      </p>

      <h3>7. Over-Mocking Your Own Modules</h3>
      <CodeBlock language="jsx" title="WRONG — mocking everything the component touches">
{`jest.mock('./CartSummary');
jest.mock('./PriceBadge');
jest.mock('../hooks/useCart');
jest.mock('../utils/formatCurrency');

test('shows the cart total', () => {
  useCart.mockReturnValue({ total: 4200 });
  formatCurrency.mockReturnValue('$42.00');
  render(<Checkout />);
  expect(screen.getByText('$42.00')).toBeInTheDocument();
});`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — mock the boundary, run your own code">
{`// Only the network is faked; every module you wrote runs for real.
server.use(
  http.get('/api/cart', () =>
    HttpResponse.json({ items: [{ id: 1, priceCents: 4200, qty: 1 }] })
  )
);

test('shows the cart total', async () => {
  render(<Checkout />);
  expect(await screen.findByText('$42.00')).toBeInTheDocument();
});`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> the first test passes if <code>formatCurrency</code> divides
        by 10 instead of 100, because the real one never runs. It asserts that a mock
        returns what the mock was told to return. Draw the mock boundary at the edge of
        your system — the network, the clock, randomness, browser APIs jsdom lacks — and
        let everything you wrote execute. Every mock of your own code is an untested
        assumption that the real thing still behaves that way.
      </p>

      <h3>8. fireEvent Where userEvent Models the Real Interaction</h3>
      <p>
        The usual justification (&ldquo;<code>user.click</code> fires more events&rdquo;)
        undersells it. Consider a PIN field that rejects non-digits in{' '}
        <code>onKeyDown</code>:
      </p>
      <CodeBlock language="jsx" title="The component">
{`<input
  id="pin"
  value={value}
  onKeyDown={(e) => {
    if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
  }}
  onChange={(e) => { setValue(e.target.value); setChangeCount(c => c + 1); }}
/>`}
      </CodeBlock>
      <CodeBlock language="text" title='Actual output — typing "a1b2" two different ways'>
{`fireEvent.change(input, { target: { value: 'a1b2' } })
   -> input value = "a1b2",  changes: 1

await user.type(input, 'a1b2')
   -> input value = "12",    changes: 2`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> <code>fireEvent.change</code> assigns the value directly and
        dispatches one event. It walked straight past the <code>onKeyDown</code> filter and
        produced a value <em>a real user cannot create</em>. A test built on it would
        assert behaviour for impossible input, and would keep passing if you deleted the
        filter entirely. <code>user.type</code> dispatches a real key sequence per
        character, so the filter runs and the field ends up with <code>&quot;12&quot;</code>.
      </p>
      <p>
        The second difference is that <code>userEvent</code> refuses interactions a user
        could not perform:
      </p>
      <CodeBlock language="text" title="Actual output — clicking through pointer-events: none">
{`fireEvent.click(btn)   -> handler called 1 time    (the user could never do this)

await user.click(btn)  -> THREW:
   Unable to perform pointer interaction as the element has \`pointer-events: none\`:

   BUTTON(label=Ghost)`}
      </CodeBlock>
      <p>
        <code>fireEvent</code> still has honest uses: DOM events with no user gesture
        behind them (<code>scroll</code>, <code>transitionend</code>, a{' '}
        <code>MediaQueryList</code> change), and pasting a value into a field where the
        keystrokes genuinely do not matter and 200 characters of{' '}
        <code>user.type</code> would be slow. Reach for it deliberately, not by default.
      </p>

      <h3>9. Shared Mutable State Between Tests</h3>
      <CodeBlock language="jsx" title="WRONG — a module-scope fixture every test mutates">
{`const cart = { items: [] };

test('starts empty',        () => { expect(cart.items).toHaveLength(0); });
test('adds an item',        () => { cart.items.push('apple');  expect(cart.items).toHaveLength(1); });
test('adds a second item',  () => { cart.items.push('banana'); expect(cart.items).toHaveLength(2); });`}
      </CodeBlock>
      <p>
        All three pass. They pass because they run in file order, and for no other reason.
        Turn on randomised ordering:
      </p>
      <CodeBlock language="text" title="Actual output — npx vitest run --sequence.shuffle --sequence.seed=2">
{`× starts empty  2ms

AssertionError: expected [ 'apple' ] to have a length of +0 but got 1

 Tests  1 failed | 2 passed (3)

# and with --sequence.seed=3, all three fail.`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — rebuild the fixture per test">
{`let cart;
beforeEach(() => { cart = { items: [] }; });

// Better still, use a factory so each test states its own starting point:
const buildCart = (items = []) => ({ items: [...items] });

test('adds an item', () => {
  const cart = buildCart();
  ...
});`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> order-dependent tests are the classic &ldquo;passes locally,
        fails in CI&rdquo;. They also break <code>.only</code>, retries, and sharding
        across workers. The same trap catches <code>jest.fn()</code> instances declared at
        module scope — configure <code>restoreMocks: true</code> (Vitest) or{' '}
        <code>restoreMocks</code> in your Jest config so call history cannot leak between
        tests. Running the suite shuffled once a week in CI is cheap insurance.
      </p>

      <h3>10. Testing a Library&apos;s Behaviour Instead of Your Own</h3>
      <CodeBlock language="jsx" title="WRONG">
{`test('React Router navigates', async () => {
  render(<App />);
  await user.click(screen.getByRole('link', { name: /about/i }));
  expect(window.location.pathname).toBe('/about');
});

test('react-hook-form registers the field', () => {
  expect(register).toHaveBeenCalledWith('email', expect.any(Object));
});

test('useState updates', () => { /* ... */ });`}
      </CodeBlock>
      <CodeBlock language="jsx" title="RIGHT — assert YOUR outcome, let the library be the mechanism">
{`test('the About link reaches the About page', async () => {
  render(<App />);
  await user.click(screen.getByRole('link', { name: /about/i }));
  expect(await screen.findByRole('heading', { name: /about us/i })).toBeInTheDocument();
});

test('rejects an email without an @', async () => {
  render(<SignupForm />);
  await user.type(screen.getByLabelText(/email/i), 'nope');
  await user.click(screen.getByRole('button', { name: /sign up/i }));
  expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
});`}
      </CodeBlock>
      <p>
        <strong>Why:</strong> React Router has its own test suite, and it is better than
        yours. Asserting <code>pathname</code> tests <em>their</em> code; asserting that
        the About heading appeared tests <em>your</em> route table, <em>your</em> lazy
        boundary and <em>your</em> component — and it keeps passing when you upgrade the
        router or switch to a hash history. The rule generalises: <strong>assert on the
        outcome you own, and let the dependency be the invisible mechanism that produced
        it.</strong>
      </p>

      <h2>The act() Warning, Properly Explained</h2>
      <p>
        This is the most-searched React testing error, and the top answers all tell you to
        wrap something in <code>act()</code>. That is usually the wrong fix. Here is what
        the warning is actually reporting.
      </p>
      <p>
        React does not re-render synchronously when you call <code>setState</code>. It
        schedules the work. In a browser that is invisible, because the next frame flushes
        it. In a test there is no next frame — so <code>act()</code> exists to say
        &ldquo;run this code, then flush every re-render and effect it caused before
        continuing.&rdquo; React tracks whether it is currently inside such a window, and
        when a state update lands <em>outside</em> one during a test, it warns.
      </p>

      <FlowChart
        title="Why the warning fires"
        chart={"graph TD\n  A[setState during a test] --> B{Inside an act window?}\n  B -->|Yes| C[React flushes<br/>render and effects]\n  C --> D[Next line sees<br/>the updated DOM]\n  B -->|No| E[act warning fires]\n  E --> F{Where did it come from?}\n  F -->|Promise never awaited| G[Assert with findBy]\n  F -->|Landed after the test| H[Abort or clear<br/>in cleanup]\n  style D fill:#1a3329,stroke:#4ade80\n  style G fill:#3b1a1a,stroke:#f87171\n  style H fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        <strong>Why you rarely write <code>act()</code> yourself:</strong>{' '}
        <code>render</code>, <code>fireEvent</code>, every <code>await user.*</code> call,
        and <code>waitFor</code> are all already wrapped in it. That is the whole reason
        RTL feels like it &ldquo;just works&rdquo;. If you are seeing the warning, you have
        found an update that none of those covered — which is information, not noise.
      </p>

      <CodeBlock language="jsx" title="A genuine occurrence, reproduced">
{`function Profile() {
  const [name, setName] = useState(null);
  useEffect(() => {
    // resolves ~10ms later; nothing in the test awaits it
    fetchName().then(setName);
  }, []);
  return <p>{name ? 'Hello, ' + name : 'Loading...'}</p>;
}

test('shows a loading state', () => {
  render(<Profile />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  // test ends here — then setName fires, with no act() window open
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Actual output — React 19.2.6 + RTL 16.3.2 (test still PASSES)">
{`An update to Profile inside a test was not wrapped in act(...).

When testing, code that causes React state updates should be wrapped into act(...):

act(() => {
  /* fire events that update state */
});
/* assert on the output */

This ensures that you're testing the behavior the user would see in the browser.
Learn more at https://react.dev/link/wrap-tests-with-act`}
      </CodeBlock>

      <InfoBox variant="danger" title="Note That the Test Passed">
        <p>
          The warning goes to <code>console.error</code>; it does not fail anything. That
          is exactly why it is so often ignored — and why it is worth taking seriously. In
          the example above the state update landed <strong>after the test finished</strong>,
          into a component RTL had already unmounted. Everything about that is a real
          problem: the assertion never saw the loaded state, and depending on scheduling
          the update can bleed into the <em>next</em> test&apos;s render.
        </p>
        <p style={{ marginBottom: 0 }}>
          Translate the warning as: <em>&ldquo;something in your component is still
          working, and your test walked away.&rdquo;</em>
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="The fix is almost never act() — it is awaiting the result">
{`// The same component, warning-free: the assertion waits for the update.
test('shows the loaded name', async () => {
  render(<Profile />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
  expect(await screen.findByText('Hello, Alice')).toBeInTheDocument();
});`}
      </CodeBlock>

      <table>
        <thead>
          <tr>
            <th>What the warning is telling you</th>
            <th>The actual fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>An async update resolved after your last assertion</td>
            <td>End the test with <code>await screen.findBy…</code> for the settled state</td>
          </tr>
          <tr>
            <td>You forgot an <code>await</code> on a <code>user.*</code> call</td>
            <td>Add it — <code>userEvent</code> v14 is async throughout</td>
          </tr>
          <tr>
            <td>A timer fired outside a flush window</td>
            <td><code>await act(async () =&gt; {'{'} vi.advanceTimersByTime(500); {'}'})</code></td>
          </tr>
          <tr>
            <td>You called a hook&apos;s returned setter directly</td>
            <td>Wrap that one call in <code>act()</code> — this is the legitimate case</td>
          </tr>
          <tr>
            <td>An update lands after unmount</td>
            <td>Abort the request / clear the timer in the effect&apos;s cleanup</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Do Not Silence It">
        <p>
          You will find advice to set{' '}
          <code>globalThis.IS_REACT_ACT_ENVIRONMENT = false</code>, or to stub{' '}
          <code>console.error</code> in <code>setupTests</code>. Both make the message go
          away and leave the race in place. The first also disables the flushing behaviour
          your other tests depend on.
        </p>
        <p style={{ marginBottom: 0 }}>
          If you want pressure in the other direction, make the warning fail the build:
          fail any test whose run wrote to <code>console.error</code>. It is aggressive,
          but on a suite that is currently warning-free it stays warning-free.
        </p>
      </InfoBox>

      <h2>What Not to Test</h2>
      <p>
        The hardest discipline is not writing a test you could write. Some concrete
        exclusions:
      </p>
      <ul>
        <li>
          <strong>Third-party code.</strong> Router navigation, form-library registration,
          query-cache internals, date-formatting libraries. Test the outcome in your UI,
          not the library&apos;s mechanism.
        </li>
        <li>
          <strong>Exact styling.</strong> Colours, spacing, pixel positions. jsdom has no
          layout engine, so <code>toHaveStyle</code> checks a declaration, not a rendered
          result. Visual regression tooling is the right instrument.
        </li>
        <li>
          <strong>Pure presentational glue.</strong> A component that spreads its props
          onto a <code>&lt;div&gt;</code> has no logic to break. Its behaviour gets covered
          for free by the test of the feature that uses it.
        </li>
        <li>
          <strong>Type-level guarantees.</strong> If TypeScript proves that{' '}
          <code>status</code> can only be one of three strings, a test asserting it is not{' '}
          <code>&quot;banana&quot;</code> is dead weight.
        </li>
        <li>
          <strong>Configuration and constants.</strong> A test that re-states a config
          object is a copy of the source that must now be maintained twice.
        </li>
        <li>
          <strong>Generated markup.</strong> Icon components, barrel re-exports,
          Storybook glue.
        </li>
      </ul>

      <InfoBox variant="question" title="A Test You Should Not Delete Even Though It Looks Trivial">
        The exception to &ldquo;do not test glue&rdquo; is a component that <em>encodes a
        decision</em>. A one-line <code>&lt;Badge&gt;</code> that maps{' '}
        <code>status</code> to a colour is glue; a one-line{' '}
        <code>&lt;PriceBadge&gt;</code> that decides when to show the strikethrough
        original price is business logic wearing a small component as a disguise. The test
        for &ldquo;does this look right&rdquo; is skippable. The test for &ldquo;does this
        decide right&rdquo; is not.
      </InfoBox>

      <h2>Coverage Is a Signal, Not a Target</h2>
      <p>
        Coverage answers exactly one question: <em>which lines did no test execute?</em>{' '}
        That is genuinely useful — an uncovered error branch is a real finding. What it
        cannot tell you is whether the covered lines were <em>asserted</em> on. This test
        gives you 100% coverage of the component and proves nothing:
      </p>
      <CodeBlock language="jsx" title="100% coverage, 0% confidence">
{`test('renders', () => {
  render(<Checkout items={items} coupon="SAVE10" />);
  // every line executed. Nothing was checked.
});`}
      </CodeBlock>
      <p>
        Which is why an <em>enforced</em> global threshold is where teams go wrong. Once
        the number is the goal, the cheapest way to raise it is exactly the test above.
        Use coverage the other way round:
      </p>
      <ul>
        <li>
          Read the <strong>uncovered</strong> report, not the percentage. Ask of each gap
          &ldquo;could a user reach this?&rdquo; If yes, that is a missing test. If no, that
          may be dead code worth deleting.
        </li>
        <li>
          Enforce on the <strong>diff</strong>, not the codebase. &ldquo;New lines in this
          PR must be covered&rdquo; is a rule people can act on; &ldquo;the repo must be at
          82%&rdquo; is a rule that gets gamed.
        </li>
        <li>
          Treat a <em>drop</em> as the signal. The absolute number matters far less than
          the direction.
        </li>
      </ul>

      <h2>Unit vs Integration Weight in a React App</h2>
      <p>
        The classic pyramid says &ldquo;mostly unit tests&rdquo;. For a React UI that
        advice inverts, because RTL makes integration tests nearly as cheap as unit tests —
        the same <code>render</code>, the same queries, no browser. The shape people
        actually converge on is the <strong>testing trophy</strong>: a thin base of static
        checks, a modest layer of unit tests, and the bulk of the effort in integration.
      </p>

      <FlowChart
        title="Where the effort goes in a React codebase"
        chart={"graph TD\n  E[\"E2E — Playwright<br/>a few critical journeys\"] --> I[\"INTEGRATION — RTL<br/>most of your tests\"]\n  I --> U[\"UNIT<br/>pure logic, reducers\"]\n  U --> S[\"STATIC<br/>TypeScript + ESLint\"]\n  style I fill:#1a3329,stroke:#4ade80\n  style E fill:#3d2f14,stroke:#fb923c"}
      />

      <table>
        <thead>
          <tr>
            <th>Test it in isolation (unit)</th>
            <th>Test it wired together (integration)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Pure functions: formatters, parsers, validators</td>
            <td>A form: type, submit, see the result</td>
          </tr>
          <tr>
            <td>Reducers and state machines with many transitions</td>
            <td>A list: load, filter, sort, paginate, empty state</td>
          </tr>
          <tr>
            <td>A custom hook with genuinely tricky logic</td>
            <td>A page: route in, fetch, render, handle the error</td>
          </tr>
          <tr>
            <td>Algorithms where the edge cases <em>are</em> the spec</td>
            <td>Anything where a child component does the real work</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="The Practical Heuristic">
        <p>
          Write the integration test first — render the feature, do what a user does, assert
          what they would see. Drop to a unit test only when the combinatorics get
          unreasonable: nine validation rules × four field states is 36 cases you do not want
          to drive through a form.
        </p>
        <p style={{ marginBottom: 0 }}>
          Then check the ratio the other way. If your suite is 90% unit tests and every
          release still ships a broken screen, the units are all passing in isolation while
          the seams between them are untested — and the seams are where React apps break.
        </p>
      </InfoBox>

      <h2>The Review Checklist</h2>
      <p>
        Everything above, compressed into what you can actually scan a diff for:
      </p>

      <CodeBlock language="text" title="Reading a test in a pull request">
{`QUERIES
  [ ] getByRole first; anything lower has a reason
  [ ] no data-testid that a role or label could replace
  [ ] no container.querySelector
  [ ] name matchers are regex where the copy might change

INTERACTIONS
  [ ] userEvent, not fireEvent (unless there is no user gesture)
  [ ] every user.* call is awaited

WAITING
  [ ] findBy instead of waitFor + getBy
  [ ] waitFor callbacks: one assertion, no side effects, never empty
  [ ] no arbitrary sleep / setTimeout

ASSERTIONS
  [ ] no state, props, instances, or className
  [ ] snapshots only where the diff IS the specification
  [ ] the assertion describes something a user could observe

ISOLATION
  [ ] no mutable module-scope fixtures
  [ ] mocks are at the boundary (network, clock, browser API)
  [ ] the test passes when run alone AND shuffled

NOISE
  [ ] the run is free of act() warnings`}
      </CodeBlock>

      <InfoBox variant="success" title="One Question, Every Time">
        <p>
          If you remember nothing else from this lesson, keep the falsification test:{' '}
          <strong>could a user cause this, and could a user observe it?</strong> Every
          anti-pattern in the catalogue is a case where the answer was no and the test was
          written anyway.
        </p>
        <p style={{ marginBottom: 0 }}>
          The cheat sheet next door is the lookup table for the syntax. This lesson is the
          part you will still need when the syntax changes.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
