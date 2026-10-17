import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsBreakpoints() {
  return (
    <LessonLayout
      title="Breakpoints & the Sources Panel"
      sectionId="devtools"
      lessonIndex={3}
      prev={{ path: '/devtools/console', label: 'Console: Beyond console.log' }}
      next={{ path: '/devtools/network', label: 'Network: Reading the Waterfall' }}
    >
      <p>
        This is the highest-leverage lesson in the section. A breakpoint shows you{' '}
        <em>every</em> variable in scope and the full call stack at the moment something
        happened. A <code>console.log</code> shows you one value you guessed in advance —
        and then you edit, reload, and guess again.
      </p>
      <p>
        The reason people stick with logging is that they have never had a reason to learn
        conditional breakpoints and logpoints. Those two are the whole payoff.
      </p>

      <h2>The Six Kinds of Breakpoint</h2>
      <CodeBlock language="text" title="Set these from the Sources panel's gutter, or the Breakpoints pane">
{`1. LINE          click the line number. Pauses every time.

2. CONDITIONAL   right-click the line number -> Add conditional breakpoint.
                 Pauses only when your expression is truthy:
                   item.id === 42
                   items.length === 0
                   user.role !== 'admin'
                 This is the one that replaces "log inside an if".

3. LOGPOINT      right-click -> Add logpoint. Prints an expression and
                 KEEPS GOING — a console.log you never commit, that you
                 can add and remove without touching the file or reloading.

4. DOM           Elements panel, right-click a node -> Break on:
                   subtree modifications | attribute modifications |
                   node removal
                 "What is deleting my element?" answered directly.

5. XHR / FETCH   Sources -> XHR/fetch Breakpoints -> add a URL substring.
                 Pauses when a matching request is ABOUT TO BE SENT, so
                 the stack shows you which code is calling your API.

6. EVENT         Sources -> Event Listener Breakpoints. Tick 'click',
                 'keydown', 'load' etc. and pause in whatever handler runs,
                 wherever it lives — including third-party code.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Logpoints are the upgrade from console.log, specifically">
        <p>
          A logpoint does exactly what a <code>console.log</code> does, except: it is not
          in your source, so it cannot be committed by accident; you can add one in
          minified or third-party code you cannot edit; and adding or removing one needs
          no rebuild and no reload. If you take one habit from this section, take this
          one.
        </p>
      </InfoBox>

      <h2>Once You Are Paused</h2>
      <FlowChart
        title="The four panes that matter while paused"
        chart={"graph LR\n  A[\"CALL STACK\\nwho called this, in order.\\nClick any frame to inspect\\nits scope\"] --> B[\"SCOPE\\nLocal / Closure / Global.\\nEvery variable and its\\nvalue, right now\"]\n  B --> C[\"WATCH\\npin an expression,\\nre-evaluated at every pause\"]\n  C --> D[\"CONSOLE\\nevaluates IN THE PAUSED\\nFRAME — call functions,\\nmutate state, test a fix\"]\n  style D fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="text" title="Stepping — the distinction that trips people">
{`F8  / Cmd+\\     Resume          run until the next breakpoint
F10 / Cmd+'     Step OVER       run this line; do NOT descend into calls
F11 / Cmd+;     Step INTO       descend into the function on this line
Shift+F11       Step OUT        finish this function, pause in the caller

// Step OVER is what you want 90% of the time. Step INTO lands you inside
// React's internals the moment the line contains a hook — which is what
// the ignore list below is for.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Set the ignore list, or stepping is unusable">
        <p>
          Without it, <em>Step into</em> drops you into <code>react-dom</code>,{' '}
          <code>scheduler</code>, or a polyfill, and the call stack is forty frames of
          framework noise with two of your own buried inside.
        </p>
        <p style={{ marginBottom: 0 }}>
          Right-click any frame in the call stack →{' '}
          <strong>Add script to ignore list</strong>, or set a pattern in{' '}
          <strong>Settings → Ignore List</strong> (<code>/node_modules/</code> is the
          one to add). Ignored frames are collapsed, stepping skips over them, and the
          stack becomes readable. This single setting is why some people find the debugger
          pleasant and others find it unusable.
        </p>
      </InfoBox>

      <h2>Pause on Exceptions</h2>
      <p>
        The two checkboxes at the top of the Breakpoints pane, and the reason to know the
        difference:
      </p>
      <ul>
        <li>
          <strong>Pause on uncaught exceptions</strong> — stops at the throw site of
          anything that reaches the top. Leave this on; it is how you get a stack for an
          error instead of a console line.
        </li>
        <li>
          <strong>Pause on caught exceptions</strong> — also stops on exceptions a{' '}
          <code>try/catch</code> handles. Noisy in a real app, because libraries throw
          internally on purpose. Turn it on when an error is being <em>swallowed</em> and
          you need to find where.
        </li>
      </ul>

      <InfoBox variant="tip" title="The &quot;an error is being swallowed&quot; recipe">
        <p style={{ marginBottom: 0 }}>
          Something fails silently — an empty list, a spinner that never stops, no console
          output. Turn on <strong>Pause on caught exceptions</strong> and reproduce. You
          will land inside whichever <code>catch</code> block is eating it, with the full
          stack showing where it came from. This finds in one minute what logging finds in
          twenty.
        </p>
      </InfoBox>

      <h2>Source Maps — Debugging Your Code, Not the Bundle</h2>
      <p>
        Vite and webpack ship source maps in development, so Sources shows your original
        TypeScript/JSX with readable names, and breakpoints land on the lines you wrote.
        When that breaks, it is usually one of these:
      </p>
      <CodeBlock language="text" title="Source map troubleshooting, in order">
{`1. Is the map there?      Network panel -> filter .map
                          A 404 on a .map file explains everything.

2. Right-click in Sources -> "Add source map…" to point at one manually.

3. The Page / Filesystem / Overrides tabs in the left sidebar:
     Page         what the browser loaded
     Filesystem   add your project folder -> edits in DevTools SAVE TO DISK
     Overrides    persist local edits to a REMOTE file across reloads —
                  the only way to patch a production script to test a fix

4. Settings -> Preferences -> Enable JavaScript source maps (on by default,
   but a corporate policy or an extension can disable it).`}
      </CodeBlock>

      <h2>Two Things to Know Before You Need Them</h2>
      <CodeBlock language="javascript" title="debugger, and the async stack">
{`// The debugger statement is a hard-coded breakpoint. It does nothing
// when DevTools is closed, which makes it safe-ish — but it WILL ship
// if you commit it. Lint rules exist for exactly this reason.
function onSubmit(values) {
  debugger;          // pauses here, every time, when DevTools is open
  save(values);
}

// Async stacks: Chromium stitches the stack ACROSS await boundaries, so a
// promise rejection shows the call site that started the chain rather than
// a bare microtask frame. If a stack looks truncated, check that
// "Async stack traces" is enabled in Settings.`}
      </CodeBlock>

      <InfoBox variant="note" title="Where this lands in React">
        <p style={{ marginBottom: 0 }}>
          Three specific recipes worth keeping: a <strong>conditional breakpoint</strong>{' '}
          in a render body on <code>props.id === 42</code> to catch one row out of a
          thousand; an <strong>XHR breakpoint</strong> on an endpoint substring to find
          which component triggers a request; and <strong>pause on caught
          exceptions</strong> to find the <code>catch</code> that is hiding a failed fetch
          behind an empty state. All three are things logging does badly.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
