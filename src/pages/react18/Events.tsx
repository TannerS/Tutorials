import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ReactEvents() {
  return (
    <LessonLayout
      title="React's Event System"
      sectionId="react18"
      lessonIndex={1}
      prev={{ path: '/react18/jsx', label: 'What JSX Really Is' }}
      next={{ path: '/react18/lifecycle', label: 'Component Lifecycle' }}
    >
      <p>
        <code>onClick</code> looks like a DOM listener and is not one. React attaches a
        handful of real listeners at the <strong>root container</strong> and synthesises
        the rest, which is why mixing React handlers with{' '}
        <code>addEventListener</code> produces firing orders that look impossible until
        you know the model.
      </p>
      <p>
        Everything below was measured against React 19.2.6 in Chromium.
      </p>

      <h2>What You Actually Receive</h2>
      <CodeBlock language="text" title="Real output — inspecting the event inside an onClick">
{`e.constructor.name            ->  "SyntheticBaseEvent"   (not MouseEvent)
e.nativeEvent                 ->  present
e.nativeEvent.constructor     ->  PointerEvent
e.nativeEvent.currentTarget   ->  DIV                    <- the ROOT container`}
      </CodeBlock>
      <p>
        Three facts in four lines. You get a <strong>synthetic</strong> object, not a
        native one. The real browser event is available at{' '}
        <code>e.nativeEvent</code> — and note it is a <code>PointerEvent</code>, not a{' '}
        <code>MouseEvent</code>. And the native listener&apos;s{' '}
        <code>currentTarget</code> is the <strong>root div</strong>, which is the whole
        architecture in one value: <strong>React does not attach a listener to your
        button.</strong>
      </p>

      <InfoBox variant="tip" title="Why synthesise at all?">
        <p style={{ marginBottom: 0 }}>
          One listener per event type at the root instead of thousands across the tree —
          cheaper to attach, and nothing to clean up when a component unmounts. The
          synthetic object also normalises cross-browser differences and gives React a
          place to hook batching. The cost is the ordering model below.
        </p>
      </InfoBox>

      <h2>The Firing Order, Measured</h2>
      <p>
        One click on a button, with React handlers and <em>native</em> listeners on both
        the button and <code>document</code>:
      </p>

      <CodeBlock language="text" title="Real output — React 19.2.6, a single click">
{`1. React onClickCapture (parent)
2. native listener ON THE BUTTON
3. React onClick (button)
4. React onClick (parent, bubble)
5. native document listener`}
      </CodeBlock>

      <FlowChart
        title="Why that order happens"
        chart={"graph TD\n  A[\"click on the button\"] --> B[\"the REAL event captures down\\nand bubbles up the actual DOM\"]\n  B --> C[\"native listeners BELOW the root\\nfire during real bubbling\\n(step 2)\"]\n  C --> D[\"the event reaches the ROOT CONTAINER,\\nwhere React's single real listener sits\"]\n  D --> E[\"React replays its OWN synthetic\\ncapture + bubble pass over the\\ncomponent tree (steps 1, 3, 4)\"]\n  E --> F[\"the real event keeps bubbling\\npast the root to document\\n(step 5)\"]\n  style D fill:#3d2f14,stroke:#d97706\n  style E fill:#2a1f44,stroke:#a78bfa"}
      />

      <p>
        React&apos;s capture pass (step 1) runs before a native listener on the button
        (step 2) even though the button is deeper — because React simulates the whole
        capture/bubble journey itself once the real event reaches the root. The two
        systems are not interleaved; the native one runs up to the root, then React&apos;s
        runs, then the native one continues.
      </p>

      <h2><code>stopPropagation</code> Across the Two Systems</h2>
      <InfoBox variant="warning" title="The result here is the opposite of the common advice">
        <p>
          You will read that React&apos;s <code>stopPropagation</code> cannot stop native
          listeners. Measured on React 19, it <strong>can</strong> — for listeners on{' '}
          <code>document</code>:
        </p>
        <CodeBlock language="text" title="Real output — three buttons, one native document listener">
{`click plain     -> ["React onClick (no stop)", "native DOCUMENT listener fired"]
click stopped   -> ["React onClick + e.stopPropagation()"]
                     ^ the document listener did NOT fire
click native    -> ["React onClick + nativeEvent.stopImmediatePropagation()"]`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          The reason is the root attachment. React 17 moved its listener from{' '}
          <code>document</code> to the <strong>root container</strong>, so{' '}
          <code>document</code> is now <em>above</em> React in the real tree. Stopping
          propagation at the root means the native event never reaches it. On React 16,
          where React listened on <code>document</code> itself, this did not work — which
          is where the old advice comes from.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="The rule, stated precisely">
{`native listener BELOW the root (on the element, or between it and the root)
  -> fires BEFORE your React handler
  -> React's stopPropagation CANNOT stop it (it already ran)

native listener ON document / window (above the root)
  -> fires AFTER your React handlers
  -> React's stopPropagation DOES stop it  (React 17+)`}
      </CodeBlock>

      <InfoBox variant="danger" title="The click-outside bug this explains">
        <p>
          A dropdown opens on click and immediately closes itself. The usual cause: the
          opening click bubbles past the root to your{' '}
          <code>document.addEventListener('click', closeIfOutside)</code>, which runs{' '}
          <em>after</em> your React handler and sees a click it considers outside.
        </p>
        <p style={{ marginBottom: 0 }}>
          Fixes, best first: check the target —{' '}
          <code>if (!panelRef.current?.contains(e.target)) close()</code>; or register the
          document listener in an effect <em>after</em> open, so it is not attached during
          the opening click; or stop reinventing it and use the top layer —{' '}
          <code>popover</code> gives you light-dismiss for free (
          <a href="/html/interactive">Native Interactive Elements</a>).
        </p>
      </InfoBox>

      <h2>The Capture Phase, and What React Supports</h2>
      <CodeBlock language="jsx" title="Every event has a Capture twin">
{`<div onClickCapture={onCapture} onClick={onBubble}>

// Also: onFocusCapture, onKeyDownCapture, onPointerDownCapture, …

// React's synonyms differ from the DOM in two places worth knowing:
//   onChange   fires on EVERY keystroke (the DOM's 'input' event),
//              not on blur like the native 'change'
//   onFocus /  these BUBBLE in React, while native focus/blur do not —
//   onBlur     React maps them onto focusin/focusout`}
      </CodeBlock>

      <InfoBox variant="note" title="Events React does NOT delegate">
        <p style={{ marginBottom: 0 }}>
          A few cannot be delegated because they do not bubble, so React attaches them
          directly to the element: <code>onScroll</code>, plus media events like{' '}
          <code>onPlay</code> and <code>onEnded</code>. That is why an{' '}
          <code>onScroll</code> on a deep element works even though scroll does not bubble.
          It is also why you occasionally see scroll handlers behave differently from every
          other React event.
        </p>
      </InfoBox>

      <h2>Passive Listeners: The One React Cannot Express</h2>
      <CodeBlock language="jsx" title="When you must reach for a ref and addEventListener">
{`// React gives you no way to pass { passive: false }. A wheel or touchmove
// handler that needs preventDefault() must be attached manually:
useEffect(() => {
  const el = ref.current;
  if (!el) return;
  const onWheel = (e) => { e.preventDefault(); /* custom zoom */ };

  el.addEventListener('wheel', onWheel, { passive: false });
  return () => el.removeEventListener('wheel', onWheel);
}, []);

// Calling preventDefault() in a passive listener is ignored and logs a
// console warning — see the browser-runtime Events lesson.`}
      </CodeBlock>

      <h2>Two Things That Changed, and One That Did Not</h2>
      <CodeBlock language="text" title="Worth knowing when reading older code or answers">
{`React 17  listeners moved from "document" to the ROOT CONTAINER.
          Makes multiple React roots on one page safe, and is why the
          stopPropagation result above differs from pre-17 advice.

React 17  EVENT POOLING REMOVED. e.persist() is gone and is a no-op.
          Reading the event asynchronously is now safe:
            onClick={(e) => setTimeout(() => console.log(e.target), 0)}
          Pre-17 that logged null, because React recycled the object.

still true  e.target   = what was actually clicked (maybe a deep child)
            e.currentTarget = the element whose handler is running`}
      </CodeBlock>

      <InfoBox variant="success" title="Three symptoms, and what they mean">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>&quot;My document listener fires before React&quot;</strong> — it
            cannot, if it is on <code>document</code>. Something is attached below the
            root, or in a capture phase.
          </li>
          <li>
            <strong>&quot;stopPropagation did nothing&quot;</strong> — the other listener
            is below the React root and already ran. Reach for{' '}
            <code>e.nativeEvent.stopImmediatePropagation()</code> only as a last resort;
            it makes behaviour depend on attachment order.
          </li>
          <li>
            <strong>&quot;The handler runs twice in dev&quot;</strong> — not an event
            problem. StrictMode double-invokes effects, so an{' '}
            <code>addEventListener</code> in an effect without a cleanup gets attached
            twice. Return the <code>removeEventListener</code>.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="note" title="The same pattern, three layers down">
        <p style={{ marginBottom: 0 }}>
          React&apos;s root delegation is the browser&apos;s event delegation (
          <a href="/browser-runtime/events">Events, Phases &amp; Delegation</a>) applied at
          framework scale, which is itself the publish/subscribe shape that{' '}
          <a href="/javascript/events">Node&apos;s EventEmitter</a> uses in-process and a
          message broker uses across machines. One listener, many subscribers, decoupled
          from who emits — the only thing that changes is how far the event has to travel.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
