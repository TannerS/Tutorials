import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsConsole() {
  return (
    <LessonLayout
      title="Console: Beyond console.log"
      sectionId="devtools"
      lessonIndex={1}
      prev={{ path: '/devtools/elements', label: 'Elements: Inspecting the Live DOM' }}
      next={{ path: '/devtools/breakpoints', label: 'Breakpoints & the Sources Panel' }}
    >
      <p>
        <code>console.log</code> is a fine tool and a poor habit. Seventeen other methods
        exist, several of them strictly better for the thing you were about to log, and
        the Console also has a set of utilities that only work there — which is why
        pasting them into your source does not work.
      </p>
      <p>
        Every method listed as available below was confirmed present in Chromium 149.
      </p>

      <h2>The Methods Worth Switching To</h2>
      <CodeBlock language="javascript" title="Each of these replaces a worse console.log">
{`// An array of objects — the single biggest upgrade. Renders a real,
// sortable table with a column per key.
console.table(invoices);
console.table(invoices, ['id', 'total']);    // only these columns

// Labelled, collapsible sections. groupCollapsed starts folded.
console.group('Request /api/invoices');
console.log('status', 200);
console.groupEnd();

// The DOM NODE, not its markup. console.log(el) in Chrome prints the
// element; console.dir(el) gives you the inspectable property list.
console.dir(el);

// "How many times did this run?" without a counter variable.
console.count('render');        // render: 1
console.count('render');        // render: 2
console.countReset('render');

// Timing a block.
console.time('fetch');
console.timeLog('fetch', 'headers received');
console.timeEnd('fetch');       // fetch: 0.002 ms

// Log ONLY if something is wrong. Silent when the condition holds.
console.assert(items.length > 0, 'items was empty');

// A stack trace WITHOUT throwing — "who called this?"
console.trace();`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — captured from Chromium 149">
{`table:      [Object, Object]
startGroup: group label
log:          inside
endGroup
count:      hits: 1
count:      hits: 2
timeEnd:    t: 0.001953125 ms
assert:     assertion text
dir:        <the node, as an inspectable object>`}
      </CodeBlock>

      <InfoBox variant="tip" title="console.table is the one to build a habit around">
        <p>
          Any time you are about to log an array of objects — API results, a list of
          rows, test fixtures — <code>console.table</code> gives you something you can
          actually scan, with sortable columns. It works on arrays of objects, objects of
          objects, and arrays of arrays.
        </p>
      </InfoBox>

      <h2>Console-Only Utilities</h2>
      <p>
        These exist only in the Console. They are not part of JavaScript, they will not
        work in your source files, and that is the most common confusion about them.
      </p>

      <CodeBlock language="javascript" title="The utilities you will use weekly">
{`$0        the element currently selected in Elements
$1 … $4   the previously selected ones
$_        the result of the last expression you evaluated

$('.card')      alias for document.querySelector
$$('.card')     alias for querySelectorAll — returns a real ARRAY, so
                .map and .filter work directly (unlike a NodeList)
$x('//div')     XPath query

copy(obj)       copy anything to the clipboard as JSON — far better than
                selecting a logged object by hand
inspect(fn)     jump to a function's definition in Sources
keys(obj) / values(obj)

getEventListeners($0)    EVERY listener attached to that element, by type.
                         The fastest way to find a stray handler.

monitorEvents($0, 'click')     log every matching event on that element
unmonitorEvents($0)

queryObjects(Promise)    every live instance of a constructor — a quick
                         leak check`}
      </CodeBlock>

      <InfoBox variant="tip" title="$0 plus getEventListeners is a debugging superpower">
        <p>
          Click an element in Elements, switch to Console, run{' '}
          <code>getEventListeners($0)</code>. You get an object keyed by event type,
          listing every handler with a link to the source line that registered it. When a
          button does something you cannot find in the codebase, this finds it in
          seconds — including listeners added by third-party scripts.
        </p>
      </InfoBox>

      <h2>Formatting and Styling</h2>
      <CodeBlock language="javascript" title="Format specifiers, and the one people only know from library output">
{`console.log('%s is %d years old', 'Ada', 36);
//  %s string   %d|%i integer   %f float   %o DOM element   %O object
//  %c apply CSS to everything after it

console.log('%cHTTP 500%c /api/invoices',
  'background:#b91c1c;color:#fff;padding:2px 6px;border-radius:3px',
  'color:gray');

// This is how libraries print coloured banners. Useful for making YOUR
// log lines findable in a noisy console.`}
      </CodeBlock>

      <h2>Making the Console Usable</h2>
      <CodeBlock language="text" title="Settings that matter once the app is noisy">
{`Preserve log        keep output across navigations — ESSENTIAL for
                    debugging anything that reloads or redirects

Filter box          plain text, or -minus to EXCLUDE, or /regex/
                    Also: a Default/Verbose/Info/Warnings/Errors level menu

Selected context    switch the Console to an IFRAME's context. If your
                    code runs in an embedded frame, the top-level console
                    cannot see it and nothing you type will work.

Live Expression     the eye icon. Pins an expression that re-evaluates
                    continuously — e.g. document.activeElement to watch
                    focus move, with no logging at all.

Settings ▸ Console ▸ Autocomplete from history
          ▸ Group similar messages in console   (turn OFF when counting)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two traps in logged output">
        <p>
          <strong>Logged objects are live.</strong> Expanding a logged object shows its
          state <em>when you expanded it</em>, not when it was logged. So an object that
          was correct at log time can appear wrong. Log a snapshot —{' '}
          <code>console.log(structuredClone(obj))</code> or{' '}
          <code>JSON.parse(JSON.stringify(obj))</code> — when the timing matters.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Logging in a loop costs real time.</strong> Console output is not free;
          thousands of lines will themselves slow the thing you are measuring. Use{' '}
          <code>console.count</code>, a conditional breakpoint, or a logpoint instead —
          which is the next lesson.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="One React-specific note">
        <p style={{ marginBottom: 0 }}>
          In development, React&apos;s StrictMode deliberately{' '}
          <strong>double-invokes</strong> renders and effects to surface impure logic. A{' '}
          <code>console.log</code> in a component body printing twice is StrictMode doing
          its job, not a bug and not a double render in production. It is also why{' '}
          <code>console.count</code> in a render is misleading unless you know that.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
