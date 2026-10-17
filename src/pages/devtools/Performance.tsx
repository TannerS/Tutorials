import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsPerformance() {
  return (
    <LessonLayout
      title="Performance: Flame Charts & Long Tasks"
      sectionId="devtools"
      lessonIndex={5}
      prev={{ path: '/devtools/network', label: 'Network: Reading the Waterfall' }}
      next={{ path: '/devtools/react', label: 'React DevTools & Profiling' }}
    >
      <p>
        The Performance panel is the one people open, see a wall of coloured bars, and
        close. It is readable once you know that you are looking for exactly two things:{' '}
        <strong>long tasks</strong> and <strong>forced layout</strong>. Everything else is
        context.
      </p>

      <h2>Recording Something Useful</h2>
      <CodeBlock language="text" title="The two recording modes">
{`⏺ Record      start, interact, stop. For runtime problems — a janky
              scroll, a slow filter, a laggy drag.

⟳ Reload      records a full page load from navigation start. For
              startup problems.

// Always set CPU throttling to 4x (or 20x) first. Your machine is much
// faster than a mid-range phone, and most jank is invisible without it.
// Network throttling applies here too.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Record the smallest possible slice">
        <p>
          A 30-second recording is unreadable and slow to load. Start recording, do{' '}
          <em>one</em> interaction, stop. Two seconds of the actual problem beats thirty
          seconds of context every time — and you can always record again.
        </p>
      </InfoBox>

      <h2>Reading the Tracks, Top to Bottom</h2>
      <CodeBlock language="text" title="What each row is telling you">
{`FPS / Frames      green bars = frames rendered. A RED bar above the
                  track is a dropped frame — jank you can see.

CPU               the coloured summary strip. The colour legend is the
                  whole key:
                    yellow  Scripting   (your JavaScript)
                    purple  Rendering   (style + layout)
                    green   Painting    (paint + composite)
                    grey    Other / idle

NET               the same requests as the Network panel, on the same
                  timeline — so you can see a script land and immediately
                  cause a long yellow block.

Main              THE FLAME CHART. This is where you spend your time.

Timings           user timings from performance.mark()/measure(), plus
                  the browser's own LCP / FCP / DCL markers.

Interactions      each click/tap and how long it took to respond — this
                  is where INP problems appear.`}
      </CodeBlock>

      <h2>The Flame Chart</h2>
      <p>
        The Main track reads <strong>downward as the call stack</strong>: the top bar is
        what the browser invoked, each bar below it is a function that bar called. Width
        is time. Nesting is causality.
      </p>

      <CodeBlock language="text" title="What you are looking for, in priority order">
{`1. A WIDE BAR with a RED TRIANGLE in its corner
     -> a LONG TASK: over 50ms on the main thread. During it the page
        cannot respond to a click at all. These are the whole game.
        Click it; the Summary tab names the function and file:line.

2. Repeated PURPLE "Layout" bars inside one task
     -> LAYOUT THRASHING. Often labelled "Forced reflow" or flagged
        "Recalculate Style" in a loop. Cause: reading a geometry
        property after writing a style, repeatedly. The fix (batch all
        reads, then all writes) is in the DOM lesson.

3. A tall, narrow spike of deeply nested identical frames
     -> recursion, or a render cascade. In React this is usually a
        component re-rendering its subtree.

4. Long GREEN blocks
     -> paint cost. Usually a large repaint area, box-shadows,
        filters, or a non-composited animation.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Animate transform and opacity — nothing else">
        <p>
          Animating <code>left</code>, <code>top</code>, <code>width</code> or{' '}
          <code>margin</code> makes the browser redo layout and paint on{' '}
          <em>every frame</em>, which shows up as a solid purple-and-green band in the
          recording. <code>transform</code> and <code>opacity</code> can be handled by the
          compositor, off the main thread — they show as almost nothing.
        </p>
        <p style={{ marginBottom: 0 }}>
          If an animation is janky, this is the first thing to check, and the Performance
          panel proves it in one recording. Command Menu →{' '}
          <code>Show Rendering</code> → <em>Paint flashing</em> shows the repainting
          regions live.
        </p>
      </InfoBox>

      <h2>The Bottom Pane: Four Tabs</h2>
      <CodeBlock language="text" title="Select a range in the timeline first, then read these">
{`Summary        a pie chart of time by category. Answers "is this a
               scripting problem or a rendering problem?" in one glance.
               Start here.

Bottom-Up      every function, sorted by SELF time — time spent in that
               function itself, excluding what it called. This is how you
               find the actual hot function.

Call Tree      top-down, by TOTAL time. Shows which entry point is
               expensive, rather than which leaf.

Event Log      chronological list of everything, filterable.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Self time vs total time — the distinction that finds the bug">
        <p style={{ marginBottom: 0 }}>
          <strong>Total time</strong> includes everything a function called, so the top of
          that list is always something useless like an event handler.{' '}
          <strong>Self time</strong> is the work done in the function itself — which is
          where the actual cost is. Sort Bottom-Up by Self time and the top row is usually
          the thing to fix.
        </p>
      </InfoBox>

      <h2>Labelling Your Own Code</h2>
      <p>
        <code>performance.mark()</code> and <code>performance.measure()</code> put named
        bars in the <strong>Timings</strong> track, so your own phases are visible instead
        of guessed at.
      </p>

      <CodeBlock language="javascript" title="Instrumenting a suspect block">
{`performance.mark('filter:start');
const rows = applyFilters(allRows);
performance.mark('filter:end');
performance.measure('filter', 'filter:start', 'filter:end');

// Read it back without the panel:
performance.getEntriesByType('measure');
// -> [{ name: 'filter', duration: <ms>, … }]`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — verified in Chromium 149">
{`performance.getEntriesByType('mark')     -> ["start", "end"]
performance.getEntriesByType('measure')  -> [{ name: "work", duration: <number> }]`}
      </CodeBlock>

      <h2>Core Web Vitals, and Measuring Them for Real</h2>
      <CodeBlock language="text" title="The three that matter, and what causes each">
{`LCP   Largest Contentful Paint   — when the biggest element appears
      good: < 2.5s
      caused by: a slow hero image, render-blocking CSS, slow TTFB

CLS   Cumulative Layout Shift     — how much the page JUMPS
      good: < 0.1
      caused by: images without width/height, webfonts swapping,
                 content injected above existing content

INP   Interaction to Next Paint   — how long until a click is answered
      good: < 200ms
      caused by: LONG TASKS. This is the metric the flame chart fixes.`}
      </CodeBlock>

      <CodeBlock language="javascript" title="PerformanceObserver — how field measurement actually works">
{`new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) console.log(entry.name, entry.startTime);
}).observe({ type: 'largest-contentful-paint', buffered: true });

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) console.log('shift', entry.value);
  }
}).observe({ type: 'layout-shift', buffered: true });

new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) console.log('long task', entry.duration);
}).observe({ type: 'longtask', buffered: true });`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — entry types supported in Chromium 149">
{`PerformanceObserver.supportedEntryTypes:
  element, event, first-input, largest-contentful-paint, layout-shift,
  long-animation-frame, longtask, mark, measure, navigation, paint,
  resource, visibility-state`}
      </CodeBlock>

      <InfoBox variant="note" title="Lab data is not field data">
        <p style={{ marginBottom: 0 }}>
          A Lighthouse score on your laptop is a <em>lab</em> measurement — one load, one
          device, one network. Real users are on worse hardware with colder caches, and
          their numbers are the ones that count. The <code>PerformanceObserver</code>{' '}
          snippets above are what real-user monitoring is built from; the{' '}
          <code>web-vitals</code> library is a small wrapper around exactly these. Use
          the panel to <em>diagnose</em>, and field data to decide <em>whether</em> to.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
