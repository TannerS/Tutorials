import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserObservers() {
  return (
    <LessonLayout
      title="Intersection, Resize & Mutation Observers"
      sectionId="browser-runtime"
      lessonIndex={3}
      prev={{ path: '/browser-runtime/event-loop', label: 'The Event Loop & Rendering Pipeline' }}
      next={{ path: '/browser-runtime/storage', label: 'Storage: localStorage, Cookies & IndexedDB' }}
    >
      <p>
        Three APIs that replace the worst patterns in frontend code. Each one exists
        because the obvious approach — a <code>scroll</code> listener, a{' '}
        <code>resize</code> listener, a polling interval — runs on the main thread at the
        wrong time and measures things the expensive way.
      </p>
      <p>All callbacks below were observed firing in Chromium 149.</p>

      <h2><code>IntersectionObserver</code> — &quot;Is It On Screen?&quot;</h2>
      <p>
        Replaces the <code>scroll</code> + <code>getBoundingClientRect()</code> pattern,
        which forces a layout on every scroll event. The observer computes visibility off
        the main thread and only calls you when it changes.
      </p>

      <CodeBlock language="javascript" title="Lazy loading, infinite scroll, and view tracking — all the same shape">
{`const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      loadImage(entry.target);
      io.unobserve(entry.target);     // one-shot: stop watching it
    }
  }
}, {
  root: null,              // null = the viewport. Or a scrollable ancestor.
  rootMargin: '200px',     // grow the trigger area — start loading EARLY
  threshold: 0,            // 0 = any pixel. 1 = fully visible.
                           // [0, 0.5, 1] = fire at each of those points.
});

document.querySelectorAll('img[data-src]').forEach(el => io.observe(el));`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the first callback, immediately after observe()">
{`io.observe(target)   // target is 2000px below the fold
  -> callback fired at once with:
     { isIntersecting: false, intersectionRatio: 0 }`}
      </CodeBlock>

      <InfoBox variant="warning" title="The first callback always fires — and it surprises people">
        <p>
          <code>observe()</code> schedules an immediate callback reporting the{' '}
          <em>current</em> state, even when nothing has changed and the element is
          nowhere near the viewport. That is deliberate: it means you never need a
          separate &quot;check the initial position&quot; path. But a handler written as
          &quot;this only runs when something scrolls into view&quot; will fire once with{' '}
          <code>isIntersecting: false</code> on setup. Always branch on{' '}
          <code>entry.isIntersecting</code> rather than assuming.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="rootMargin is the attribute that makes it feel instant">
        <p>
          <code>rootMargin: '200px'</code> fires the callback 200px before the element
          actually enters the viewport, so the image has time to load before the user
          gets there. Negative values shrink the box instead — useful for &quot;this
          section is at least halfway up the screen&quot; scroll-spy behaviour.
        </p>
      </InfoBox>

      <h2><code>ResizeObserver</code> — &quot;How Big Is This Element?&quot;</h2>
      <p>
        <code>window.addEventListener('resize')</code> tells you the{' '}
        <em>window</em> changed. It says nothing about an element that was resized by a
        flex sibling, a font load, or a parent toggling a class — all of which happen
        without the window moving at all.
      </p>

      <CodeBlock language="javascript" title="Per-element size, without polling">
{`const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;   // excludes padding/border
    // entry.borderBoxSize / contentBoxSize are the newer, more precise pair
    chart.resize(width, height);
  }
});

ro.observe(container);
// later: ro.unobserve(container) or ro.disconnect()`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — first callback on a 100×100 div">
{`ro.observe(box)
  -> { contentRect.width: 100, borderBoxSize present: true }
  // Like IntersectionObserver, it reports the CURRENT size immediately.`}
      </CodeBlock>

      <InfoBox variant="danger" title="ResizeObserver loop limit exceeded">
        <p>
          If your callback changes the size of something the observer watches, you get a
          feedback loop. The browser detects it and throws{' '}
          <code>ResizeObserver loop completed with undelivered notifications</code> — an
          error you will eventually meet in a chart or editor component.
        </p>
        <p style={{ marginBottom: 0 }}>
          The fix is not to resize observed elements inside the callback. If you must,
          defer the write with <code>requestAnimationFrame</code> so it lands in the next
          frame rather than inside the same delivery.
        </p>
      </InfoBox>

      <h2><code>MutationObserver</code> — &quot;Did the DOM Change?&quot;</h2>
      <p>
        The one you should reach for least, because in a React app <em>you</em> control
        the DOM. It earns its place when something else does not: a third-party widget, a
        CMS-injected banner, a legacy script you cannot edit.
      </p>

      <CodeBlock language="javascript" title="Watching a subtree you do not own">
{`const mo = new MutationObserver((records) => {
  for (const r of records) {
    // r.type: 'childList' | 'attributes' | 'characterData'
    r.addedNodes.forEach(node => { /* … */ });
  }
});

mo.observe(target, {
  childList: true,      // children added/removed
  attributes: true,     // attribute changes
  subtree: true,        // ...anywhere beneath, not just direct children
  attributeFilter: ['class'],      // only these attributes
  attributeOldValue: true,         // include the previous value
  characterData: true,             // text node contents
});`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — appending one li to an observed ul">
{`mo.observe(list, { childList: true })
list.appendChild(document.createElement('li'))
  -> record: { type: "childList", addedNodes.length: 1 }`}
      </CodeBlock>

      <InfoBox variant="warning" title="MutationObserver callbacks are microtasks">
        <p>
          They are delivered as <strong>microtasks</strong>, not macrotasks — so they run
          before the next paint, in the same drain as your promise callbacks. That makes
          them fast but also means a callback that mutates the DOM can trigger itself
          again within the same turn. Combined with{' '}
          <code>subtree: true</code> on a large tree, this is a genuine performance
          footgun; scope the observation as narrowly as you can.
        </p>
      </InfoBox>

      <h2>All Three in React</h2>
      <CodeBlock language="javascript" title="The shape is always the same">
{`function useOnScreen(ref, rootMargin = '0px') {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;          // capture it — see the Refs lesson
    if (!node) return;

    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin }
    );
    io.observe(node);

    return () => io.disconnect();      // ALWAYS disconnect on cleanup
  }, [ref, rootMargin]);

  return visible;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Two rules that cover every observer">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Capture the node in a local variable.</strong> By the time a{' '}
            <code>useEffect</code> cleanup runs, <code>ref.current</code> is already{' '}
            <code>null</code> — verified in{' '}
            <a href="/react18/refs">Refs In Depth</a>. <code>disconnect()</code> does not
            need the node, but <code>unobserve()</code> does.
          </li>
          <li>
            <strong>Always disconnect.</strong> An observer holds a reference to its
            targets, so a forgotten one keeps a detached subtree alive — a real memory
            leak, and one the Performance panel&apos;s heap snapshots will show you.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="note" title="PerformanceObserver, the fourth one">
        <p style={{ marginBottom: 0 }}>
          Same pattern, different subject: it reports browser performance entries rather
          than DOM changes. Chromium 149 supports entry types including{' '}
          <code>largest-contentful-paint</code>, <code>layout-shift</code>,{' '}
          <code>longtask</code>, <code>event</code>, <code>paint</code>,{' '}
          <code>resource</code> and <code>navigation</code> — which is to say, it is how
          Core Web Vitals are actually measured in the field. The{' '}
          <a href="/devtools/performance">Performance panel lesson</a> uses it.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
