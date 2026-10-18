import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserEvents() {
  return (
    <LessonLayout
      title="Events, Phases & Delegation"
      sectionId="browser-runtime"
      lessonIndex={1}
      prev={{ path: '/browser-runtime/dom', label: 'The DOM API' }}
      next={{ path: '/browser-runtime/event-loop', label: 'The Event Loop & Rendering Pipeline' }}
    >
      <p>
        React&apos;s <code>onClick</code> looks like a plain DOM handler and is not one —
        it is a delegated listener on the root. Understanding the real model is what makes
        the differences predictable instead of surprising, and it is the only way to debug
        a handler that fires twice or not at all.
      </p>
      <p>Every ordering below was measured in Chromium 149.</p>

      <h2>Three Phases, One Click</h2>
      <p>
        An event does not just happen on the element you clicked. It travels down from{' '}
        <code>window</code> to the target and back up again, and listeners can attach to
        either leg of that journey.
      </p>

      <FlowChart
        title="Capture down, target, bubble up"
        chart={"graph TD\n  W[\"window\"] --> D[\"document\"]\n  D --> O[\"div#outer — CAPTURE\"]\n  O --> M[\"div#mid — CAPTURE\"]\n  M --> T[\"button#btn — TARGET\"]\n  T --> M2[\"div#mid — BUBBLE\"]\n  M2 --> O2[\"div#outer — BUBBLE\"]\n  O2 --> D2[\"document\"]\n  style T fill:#3d2f14,stroke:#d97706\n  style O fill:#1a2744,stroke:#5b9cf6\n  style M fill:#1a2744,stroke:#5b9cf6\n  style M2 fill:#1a3329,stroke:#4ade80\n  style O2 fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="javascript" title="The third argument is the phase">
{`outer.addEventListener('click', fn, true);   // CAPTURE (down)
outer.addEventListener('click', fn);          // BUBBLE  (up) — the default
outer.addEventListener('click', fn, { capture: true });  // same as true`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — one click on the button, five listeners">
{`1. outer CAPTURE
2. mid CAPTURE
3. button (target)
4. mid BUBBLE
5. outer BUBBLE`}
      </CodeBlock>

      <p>
        Almost everything you write wants the bubble phase, which is why it is the
        default. Capture is for interception — closing a dropdown when a click starts
        anywhere else on the page, for instance, where you want to run{' '}
        <em>before</em> the click reaches its target.
      </p>

      <h2><code>preventDefault</code> vs <code>stopPropagation</code></h2>
      <p>
        These are constantly confused and do completely unrelated things. One cancels the
        browser&apos;s built-in reaction; the other stops the journey.
      </p>

      <CodeBlock language="javascript" title="Two different jobs">
{`// preventDefault: cancel the BROWSER'S action. The event keeps travelling.
form.addEventListener('submit', e => {
  e.preventDefault();      // no page navigation
});                        // ...but ancestor submit handlers still run

// stopPropagation: stop the JOURNEY. The default action still happens.
link.addEventListener('click', e => {
  e.stopPropagation();     // ancestors never hear about it
});                        // ...but the browser STILL navigates

// stopImmediatePropagation: also skip OTHER listeners on this same element.
// Rarely correct — it makes your handler order-dependent.

// Reading them back:
e.defaultPrevented        // did anything call preventDefault?
el.dispatchEvent(ev)      // returns FALSE if preventDefault was called`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — measured separately">
{`preventDefault() -> el.dispatchEvent(event) returned false
stopPropagation() on a child -> the parent's handler did NOT run`}
      </CodeBlock>

      <InfoBox variant="warning" title="stopPropagation is usually the wrong tool">
        <p>
          It is tempting for &quot;this click should not close the modal&quot;, and it
          creates action at a distance: some unrelated feature&apos;s document-level
          listener silently stops working, and nothing points at your component. Prefer
          checking the target —{' '}
          <code>if (!panel.contains(e.target)) close()</code> — which keeps the decision
          local to the thing that cares.
        </p>
      </InfoBox>

      <h2>Delegation: One Listener for a Thousand Rows</h2>
      <p>
        Because events bubble, a listener on a container hears about clicks on every
        descendant — including descendants that did not exist when you attached it. That
        is the whole technique, and it is what React does internally.
      </p>

      <CodeBlock language="javascript" title="The pattern, with the two details that matter">
{`list.addEventListener('click', (e) => {
  // 1. e.target is the DEEPEST element clicked — possibly an <svg>
  //    inside a <span> inside the button you care about. closest()
  //    walks up to the thing you actually want.
  const row = e.target.closest('[data-id]');
  if (!row) return;             // the click was on padding, ignore it

  // 2. e.currentTarget is the element the LISTENER is on (the list).
  //    Inside an arrow function it is reliable; do not confuse the two.
  select(row.dataset.id);
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — a listener attached BEFORE the child existed">
{`list.addEventListener('click', …)    // attached to an EMPTY <ul>
list.appendChild(newLi);              // child created afterwards
newLi.click();                        // the delegated handler fired: true`}
      </CodeBlock>

      <InfoBox variant="tip" title="target vs currentTarget, in one line">
        <p>
          <code>e.target</code> = what was clicked. <code>e.currentTarget</code> = what
          the listener is attached to. In a delegated handler they are almost never the
          same element, and reaching for <code>target</code> when you meant{' '}
          <code>currentTarget</code> is the classic delegation bug.
        </p>
      </InfoBox>

      <h2>Listener Options</h2>
      <CodeBlock language="javascript" title="Four options, all worth knowing">
{`el.addEventListener('click', fn, {
  once: true,      // auto-removes itself after the first call
  capture: true,   // the capture phase
  passive: true,   // "I will never call preventDefault" — see below
  signal: ac.signal,  // remove via AbortController.abort()
});

// The signal option is the cleanest removal story there is. One abort()
// removes every listener registered with that signal — which maps
// perfectly onto a React effect cleanup:
useEffect(() => {
  const ac = new AbortController();
  window.addEventListener('resize', onResize, { signal: ac.signal });
  window.addEventListener('scroll', onScroll, { signal: ac.signal });
  return () => ac.abort();          // removes BOTH
}, []);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — { once: true }">
{`listener registered with { once: true }
el.click(); el.click();
  -> handler ran exactly 1 time`}
      </CodeBlock>

      <InfoBox variant="warning" title="removeEventListener matches on identity — this is the leak">
        <p>
          Removal requires the <em>same function reference</em> you added. An inline arrow
          cannot be removed, because you no longer have a reference to it:
        </p>
        <CodeBlock language="javascript" title="The leak, and the fixes">
{`// LEAKS: a different function object every time.
el.addEventListener('click', () => doThing());
el.removeEventListener('click', () => doThing());   // removes NOTHING

// FIX: keep the reference.
const handler = () => doThing();
el.addEventListener('click', handler);
el.removeEventListener('click', handler);

// OR: use a signal and forget about identity entirely.`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Verified in a browser: removing with a different-but-identical arrow leaves the
          handler firing. The same trap is why a React hook that re-wraps its handler on
          every render can leak — see{' '}
          <a href="/react-testing/hooks">Testing Custom Hooks</a>, which asserts exactly
          this.
        </p>
      </InfoBox>

      <h2><code>passive: true</code> and Scroll Performance</h2>
      <p>
        A non-passive <code>touchstart</code> or <code>wheel</code> listener forces the
        browser to <em>wait</em> for your handler before scrolling, because you might call{' '}
        <code>preventDefault()</code>. On a touch device that is a visible stutter.
        Declaring the listener passive is a promise not to cancel, which lets scrolling
        start immediately.
      </p>
      <CodeBlock language="javascript" title="When to use it">
{`// Scroll/touch/wheel listeners that only READ — always passive.
window.addEventListener('scroll', onScroll, { passive: true });
el.addEventListener('touchstart', onTouch, { passive: true });

// Chrome already treats document-level touchstart/touchmove as passive
// by default. Calling preventDefault() in a passive listener is ignored
// and logs a console warning — if you see that warning, you need a
// NON-passive listener, so drop the option rather than the call.`}
      </CodeBlock>

      <h2>Custom Events</h2>
      <CodeBlock language="javascript" title="For talking between parts of a page that do not import each other">
{`// Dispatch
el.dispatchEvent(new CustomEvent('cart:add', {
  detail: { sku: 'A1', qty: 2 },   // your payload lives in detail
  bubbles: true,                    // DEFAULTS TO FALSE — the usual bug
  cancelable: true,
}));

// Listen
document.addEventListener('cart:add', (e) => {
  console.log(e.detail.sku);
});

// You do not need an element. EventTarget is a constructible base class,
// so you can have a standalone bus with no DOM involved:
class Bus extends EventTarget {}
const bus = new Bus();
bus.addEventListener('tick', (e) => console.log(e.detail));
bus.dispatchEvent(new CustomEvent('tick', { detail: 1 }));`}
      </CodeBlock>
      <p>
        That last form is the browser&apos;s answer to Node&apos;s{' '}
        <code>EventEmitter</code> — same decoupling, different API. The comparison, and the
        traps on the Node side, are in{' '}
        <a href="/javascript/events">Events &amp; EventEmitter in Node</a>. For events that
        cross a tab, iframe or worker boundary rather than travelling up a DOM tree, see{' '}
        <a href="/browser-runtime/lifecycle">Page Lifecycle &amp; Cross-Context Events</a>.
      </p>

      <InfoBox variant="note" title="Where React differs from all of this">
        <p>
          React attaches most listeners at the <strong>root container</strong>, not your
          element, and synthesises the event. Where a native listener sits relative to that
          root decides everything — measured on React 19.2.6:
        </p>
        <ul style={{ marginBottom: 0 }}>
          <li>
            A native listener <strong>below</strong> the root (on the element itself) runs{' '}
            <em>before</em> your React handler, because the real event reaches it on the way
            up to the root. A native listener on <code>document</code> runs{' '}
            <em>after</em> all your React handlers, because <code>document</code> is above
            the root.
          </li>
          <li>
            <code>e.stopPropagation()</code> in a React handler therefore{' '}
            <strong>does</strong> stop a <code>document</code> or <code>window</code>{' '}
            listener, and <strong>cannot</strong> stop one below the root — that one already
            ran. (Pre-17 React listened on <code>document</code> itself, which is where the
            widespread &quot;it never works&quot; advice comes from.)
          </li>
          <li>
            React 17+ no longer pools events, so <code>e.persist()</code> is gone and
            reading <code>e</code> asynchronously is safe.
          </li>
        </ul>
        <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
          The firing order and the click-outside bug it causes are worked through in{' '}
          <a href="/react18/events">React&apos;s Event System</a>.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
