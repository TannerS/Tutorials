import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Portals() {
  return (
    <LessonLayout
      title="Portals, In Depth"
      sectionId="react18"
      lessonIndex={21}
      prev={{ path: '/react18/animations', label: 'Animation Libraries (Framer Motion & Beyond)' }}
      next={null}
    >
      <p>
        <code>createPortal(children, domNode)</code> renders <code>children</code> into{' '}
        <code>domNode</code> instead of the current component's normal DOM position — but the
        rendered content stays in the <strong>same React tree</strong> as its caller. That second
        half is the part that's easy to state and easy to get wrong in practice, so this lesson
        proves it rather than just asserting it: every non-obvious claim below was actually run in a
        live React 19 app and observed, not recalled from memory.
      </p>

      <CodeBlock language="jsx" title="The basic shape">
{`import { createPortal } from 'react-dom';

function Modal({ children }) {
  return createPortal(
    children,
    document.body, // renders here in the DOM...
  );
  // ...but Modal is still exactly where it was in the React tree.
}

function App() {
  return (
    <div className="app">
      <Modal>
        <p>My DOM parent is &lt;body&gt;. My React parent is still &lt;App&gt;.</p>
      </Modal>
    </div>
  );
}`}
      </CodeBlock>

      <h2>Same Tree, Different DOM Node</h2>

      <p>
        The consequence that matters: an event fired inside a portal bubbles through the{' '}
        <strong>React tree's</strong> ancestor chain, not the DOM tree's. Built this exact scenario
        to check it — an ancestor several React levels up has an <code>onClick</code>, its child
        renders a portal straight into <code>document.body</code>, and a button lives inside that
        portal with no handler of its own:
      </p>

      <CodeBlock language="jsx" title="Ancestor in the React tree, nowhere in the DOM tree" showLineNumbers>
{`function ChildThatPortals() {
  // This button's DOM parent will be document.body directly.
  return createPortal(
    <button onClick={() => console.log('button\\'s own handler')}>
      Click me
    </button>,
    document.body,
  );
}

function AncestorWithHandler() {
  return (
    <div onClick={() => console.log('ancestor handler fired')}>
      {/* DOM-wise, nothing below this div actually lives inside it — the
          portal's button is a sibling of the whole app in the real DOM. */}
      <ChildThatPortals />
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified: the click reaches the React ancestor's handler">
        <p>
          Confirmed the button's DOM parent really is <code>document.body</code> (not inside{' '}
          <code>AncestorWithHandler</code>'s DOM subtree at all — checked with{' '}
          <code>ancestor.contains(button)</code>, which returned <code>false</code>). Clicking the
          button anyway fired <em>both</em> the button's own handler <em>and</em>{' '}
          <code>AncestorWithHandler</code>'s <code>onClick</code>, in that order. As a control, a
          second, unrelated <code>onClick</code> handler elsewhere on the page — not a React ancestor
          of the portal — did <em>not</em> fire. So it's specifically React-tree ancestry doing this,
          not &quot;portals broadcast clicks to the whole page.&quot;
        </p>
      </InfoBox>

      <p>
        This is why a portaled modal's close button can sit inside a parent's{' '}
        <code>onClick</code>-driven &quot;click outside to close&quot; handler, why a portaled
        dropdown item still participates in a form's synthetic event delegation, and why context
        providers still reach components rendered through a portal (a portal-rendered modal calling{' '}
        <code>useContext(ThemeContext)</code> works exactly as if it were rendered inline — because,
        as far as React's tree is concerned, it is).
      </p>

      <h2>Why Bother — Escaping Layout Constraints</h2>

      <p>
        The concrete reason to reach for a portal: an ancestor's <code>overflow: hidden</code> or a
        stacking context clips or occludes anything rendered as its DOM descendant, no matter how
        high you set <code>z-index</code>. A modal, tooltip, or toast has to escape that. Built the
        clipping case directly to see it:
      </p>

      <CodeBlock language="jsx" title="A card that clips its own content by design" showLineNumbers>
{`function ClippingCard() {
  return (
    <div style={{ position: 'relative', width: 200, height: 100, overflow: 'hidden' }}>
      <button>Open tooltip</button>

      {/* Rendered normally — this div is a DOM child of the card above,
          so the card's overflow: hidden clips it. */}
      <div style={{ position: 'absolute', top: -140, width: 300 }}>
        I get clipped — I'm a DOM descendant of the overflow:hidden card
      </div>
    </div>
  );
}

function PortaledTooltip() {
  // Same visual position, but its DOM parent is document.body — the card's
  // overflow: hidden has no descendant to clip.
  return createPortal(
    <div style={{ position: 'absolute', top: 20, left: 20, width: 300 }}>
      I'm not clipped — my DOM parent is &lt;body&gt;, not the card
    </div>,
    document.body,
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified with real hit-testing, not just a visual guess">
        <p>
          Rendered both tooltips at the same coordinates and used{' '}
          <code>document.elementFromPoint(x, y)</code> — the actual browser hit-test — at each one's
          own position. At the non-portaled tooltip's coordinates, the element actually present at
          that point was <code>&lt;html&gt;</code>, not the tooltip: it has a real bounding box, but
          nothing is visually there because the ancestor's <code>overflow: hidden</code> clipped it
          out of the paint. At the portaled tooltip's coordinates, the hit-test returned the tooltip
          itself — genuinely rendered, not clipped, because its DOM parent is <code>body</code>.
        </p>
      </InfoBox>

      <p>
        The same mechanism covers <code>z-index</code>: a parent with <code>position: relative</code>{' '}
        and its own stacking context can bury a child's high <code>z-index</code> underneath a
        sibling, no matter how large the number gets — <code>z-index</code> only competes against
        siblings within the <em>same</em> stacking context. Rendering the modal/tooltip/toast into{' '}
        <code>document.body</code> (or a dedicated root sibling to your app) sidesteps the whole
        problem: there's no longer a shared stacking context to lose the fight in.
      </p>

      <h2>Accessibility — Portals Don't Give You This For Free</h2>

      <p>
        A portal solves the visual/layout problem. It does <strong>nothing</strong> for keyboard and
        screen-reader users on its own — focus doesn't move, isn't trapped, and isn't restored
        automatically. Built the naive version to confirm exactly what breaks, and the correct
        version to confirm what fixes it.
      </p>

      <InfoBox variant="danger" title="Verified: the naive modal — no focus handling at all">
        <p>
          Rendered a portal-based modal with two buttons on top of a page that has its own button
          below the trigger. Opened the modal by clicking the trigger, then checked{' '}
          <code>document.activeElement</code>: it was still the trigger button — now hidden behind
          the modal. Pressed <code>Tab</code> once: focus jumped straight to the page's button behind
          the modal, skipping the modal's own contents entirely. A sighted mouse user sees a modal; a
          keyboard user is still interacting with whatever was behind it. This is the actual, common
          real-world bug, verified rather than assumed.
        </p>
      </InfoBox>

      <CodeBlock language="jsx" title="What a portal-based modal actually needs" showLineNumbers>
{`function Modal({ onClose }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    // 1. Remember what had focus before the modal opened.
    previouslyFocused.current = document.activeElement;

    // 2. Move focus INTO the modal. Without this, focus silently stays on
    //    whatever's now hidden behind it.
    const first = dialogRef.current.querySelector('button, [href], input, [tabindex]');
    first?.focus();

    // 3. Trap Tab within the modal's own focusable elements.
    function handleKeyDown(e) {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab') return;

      const focusables = dialogRef.current.querySelectorAll('button, [href], input, [tabindex]');
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // 4. Restore focus to wherever it was before the modal opened.
      previouslyFocused.current?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div ref={dialogRef} role="dialog" aria-modal="true">
      <button>First</button>
      <button>Last</button>
    </div>,
    document.body,
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Verified live: all four steps working together">
        <p>
          Ran the exact component above through a full keyboard sequence: opening moved{' '}
          <code>document.activeElement</code> into the modal's first button; pressing{' '}
          <code>Tab</code> repeatedly cycled through the modal's buttons and wrapped from the last
          back to the first (not out into the page); <code>Shift+Tab</code> from the first wrapped
          backward to the last; and closing via <code>Escape</code> both removed the modal from the
          DOM and returned focus to the exact trigger element that had it before the modal opened.
        </p>
      </InfoBox>

      <p>
        <code>role=&quot;dialog&quot;</code> and <code>aria-modal=&quot;true&quot;</code> tell
        assistive tech what the region is; they don't trap focus by themselves — the keydown handler
        above is still doing that work. In production, reach for a tested implementation
        (Radix UI's <code>Dialog</code>, React Aria's <code>useDialog</code>/<code>FocusScope</code>)
        rather than hand-rolling this — the four steps above are what those libraries are doing
        internally, but they also handle edge cases (dynamically added/removed focusable children,
        <code>inert</code> on background content, nested dialogs) that a 30-line version won't.
      </p>

      <h2>Cleanup and Unmounting</h2>

      <p>
        A portal is still a normal part of the React tree for lifecycle purposes — unmounting the
        component that renders it removes its content from the DOM node it was portaled into, the
        same as it would for a normally-positioned child. Verified by toggling a portaled component
        off and on: its content is fully removed from <code>document.body</code> when unmounted, and
        cleanly re-added — no leftover duplicate nodes, no stale content — when remounted. There's no
        special cleanup to write for the portal mechanism itself; the usual rules (clean up
        subscriptions/listeners in an effect's return function) are all that's needed, same as any
        other component.
      </p>

      <h2>Nested Portals</h2>

      <p>
        A portal rendered inside another portal's children works as expected — verified with a
        portal rendered into one detached container, containing a second component that portals{' '}
        <em>again</em> into a completely different detached container. Both layers of content
        rendered into their correct, separate DOM locations, and a click on the innermost, doubly-portaled
        button still bubbled all the way up through the full React ancestry to a handler on the
        outermost component — the same tree-based bubbling from earlier holds across multiple portal
        boundaries stacked on top of each other, not just one.
      </p>

      <h2>Decision Table</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Situation</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use a portal because&hellip;</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Modal/dialog inside a card, table cell, or any <code>overflow: hidden</code> container</td>
            <td style={{ padding: '0.75rem' }}>DOM-descendant content gets clipped or loses z-index fights — rendering to <code>body</code> escapes both</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Tooltip that must render above everything, positioned near its trigger</td>
            <td style={{ padding: '0.75rem' }}>Same clipping/stacking problem, usually inside a scroll container</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Toast/notification stack shown regardless of which page section triggered it</td>
            <td style={{ padding: '0.75rem' }}>Needs one DOM location outside any single feature's layout</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Modal needs to read auth/theme context, or bubble a click to a parent's handler</td>
            <td style={{ padding: '0.75rem' }}>Portals stay in the React tree — context and event bubbling both still work through it</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Content just needs different CSS, no layout escape needed</td>
            <td style={{ padding: '0.75rem' }}><strong>Don&apos;t</strong> reach for a portal — it solves a DOM-position problem, not a styling problem</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question="A portal renders a <button> directly into document.body. An ancestor several levels up in the React tree (but nowhere in the DOM tree) has an onClick handler. What happens when the button is clicked, verified by actually running it?"
        options={[
          "Nothing — DOM event bubbling can't reach a handler on an element that isn't a DOM ancestor",
          "The ancestor's onClick fires, because React dispatches events along the React tree's ancestry, not the DOM tree's",
          "It throws an error, because portaled elements aren't allowed to have ancestor handlers",
          "Only the button's own handler fires; ancestor handlers need the element to be a literal DOM descendant"
        ]}
        correctIndex={1}
        explanation="Verified live: even though document.body.contains-style checks confirm the button is nowhere inside the ancestor's actual DOM subtree, clicking it fires both the button's own handler and the React-tree ancestor's onClick. React's synthetic event system dispatches along the component tree it renders, not the physical DOM structure — that's the entire point of a portal: different DOM location, same React tree."
        language="jsx"
      />

      <InteractiveChallenge
        question="A tooltip is rendered as a normal DOM child inside a card with overflow: hidden and position: relative. What actually happens to it, verified with document.elementFromPoint hit-testing?"
        options={[
          "React automatically detects the overflow and renders it via a portal instead",
          "It has a real bounding box and exists in the DOM, but the browser's paint clips it — hit-testing at its coordinates returns the ancestor, not the tooltip",
          "The overflow: hidden only affects text content, not positioned children",
          "It renders fine as long as z-index is set high enough"
        ]}
        correctIndex={1}
        explanation="Verified directly: getBoundingClientRect() on the non-portaled tooltip returns real coordinates, but document.elementFromPoint() at those same coordinates returned <html>, not the tooltip — proving it's genuinely clipped from the actual rendered page, not just visually offset. z-index doesn't fix this because overflow: hidden clips at the box level, before stacking order is even considered. A portal into document.body sidesteps the clipping ancestor entirely."
        language="jsx"
      />

      <InteractiveChallenge
        question="A modal is built with createPortal but no explicit focus handling code. A sighted mouse user opens it and it looks correct. What's actually broken, verified by checking document.activeElement and pressing Tab?"
        options={[
          "Nothing — createPortal automatically moves and traps focus for accessibility",
          "Focus silently stays on the now-hidden trigger button behind the modal, and Tab moves focus into unrelated page content behind the modal instead of into it",
          "The modal fails to render at all for keyboard users",
          "Tab presses are blocked entirely until JavaScript adds a focus trap"
        ]}
        correctIndex={1}
        explanation="Verified live with a naive portal-based modal: after opening it, document.activeElement was still the trigger button, now visually hidden behind the modal. Pressing Tab once moved focus straight into a page element positioned after the trigger in DOM order — completely skipping the modal's own buttons. createPortal only relocates DOM output; it has no opinion on focus. Moving focus in on open, trapping Tab within the dialog, and restoring focus on close all have to be written explicitly (or provided by a library like Radix UI or React Aria)."
        language="jsx"
      />
    </LessonLayout>
  );
}
