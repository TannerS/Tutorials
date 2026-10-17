import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function DevtoolsFieldGuide() {
  return (
    <GuideLayout
      title="DevTools Field Guide"
      kicker="Developer Fundamentals"
      tagline="Elements, Console, breakpoints, Network, Performance and the React profiler — the shortcuts and the diagnoses, on one page."
      glyph="🔧"
      meta={['Chromium 149', '6 lessons', '12 panels']}
      page="1 / 1"
      footer="Panel behaviour is Chrome/Edge DevTools (Chromium 149). The console and performance APIs listed were confirmed present by running them."
      prev={{ path: '/devtools/react', label: 'React DevTools & Profiling' }}
      next={null}
    >
      <GuidePanel n={1} title="Shortcuts" accent="blue" glyph="⌨️" span={2}>
        <GuideCode>{`F12 / Cmd+Opt+I      open DevTools
Cmd+Opt+C            INSPECT mode — click to select
Cmd+Opt+J            straight to Console
Cmd+Shift+P          COMMAND MENU (inside DevTools)
Cmd+F                search the DOM tree (takes CSS selectors)
F8   / Cmd+\\         resume
F10  / Cmd+'         step OVER   <- the one you want
F11  / Cmd+;         step INTO
Shift+F11            step OUT`}</GuideCode>
        <GuideRules items={[
          'The Command Menu is the only shortcut you must memorise — it fuzzy-searches every DevTools feature. Try: screenshot, coverage, rendering, disable javascript.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Elements: Reading the Cascade" accent="purple" glyph="🎨" span={2}>
        <GuideDefs items={[
          ['struck through', 'overridden — hover to see by what'],
          ['element.style', 'inline styles; React\'s style prop lands here'],
          ['user agent stylesheet', 'the browser default you did not write'],
          ['Computed tab', 'the ONE resolved value, plus every rule that tried'],
          ['Force state', 'pin :hover / :focus / :focus-visible / :active'],
          ['grid / flex badge', 'overlay with numbered lines and axes'],
          ['scroll badge', 'this is a scroll container — often the bug'],
        ]} />
        <GuideRules items={[
          'The Elements tree is the REPAIRED DOM. View Source is what you sent. Disagreement = the parser rewrote your markup.',
          'A scroll badge on an unexpected ancestor explains clipped dropdowns and sticky elements sticking to the wrong thing.',
          'The colour picker has a live contrast ratio with AA/AAA pass-fail.',
          'The Accessibility pane shows the computed role, the accessible name, and WHERE THE NAME CAME FROM.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Console Methods" accent="green" glyph="🖥️">
        <GuideCode>{`console.table(arrayOfObjects)   <- the big one
console.group / groupEnd
console.dir(el)       the node as an object
console.count('x')    x: 1, x: 2
console.time / timeLog / timeEnd
console.assert(cond, 'msg')
console.trace()       stack, no throw
console.log('%cstyled','color:red')`}</GuideCode>
        <GuideRules items={[
          'All confirmed present in Chromium 149, along with countReset, groupCollapsed, warn, error, info, debug.',
          'Logged objects are LIVE — expanding shows state at expand time. Log structuredClone(obj) for a snapshot.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Console-Only Utilities" accent="amber" glyph="🪄">
        <GuideCode>{`$0 $1 $2       selected elements (Elements)
$_             last evaluated result
$r             selected REACT component
$('sel') $$('sel')   qS / qSA (as an ARRAY)
copy(obj)      to clipboard as JSON
getEventListeners($0)
monitorEvents($0,'click')
queryObjects(Ctor)   live instances`}</GuideCode>
        <GuideRules items={[
          'These exist ONLY in the Console — they will not work pasted into your source.',
          '$0 + getEventListeners($0) finds a mystery handler in seconds, including third-party ones.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Six Kinds of Breakpoint" accent="red" glyph="🛑" span={2}>
        <GuideTable
          head={['Kind', 'How', 'Use it for']}
          rows={[
            ['Line', 'click the gutter', 'the basic case'],
            ['Conditional', 'right-click gutter', 'one row out of a thousand: item.id === 42'],
            ['Logpoint', 'right-click gutter', 'a console.log you never commit, in code you cannot edit'],
            ['DOM', 'Elements → Break on', '"what is deleting / mutating my element?"'],
            ['XHR / fetch', 'Sources pane, URL substring', '"which component calls this endpoint?"'],
            ['Event listener', 'Sources pane, tick an event', 'pause in whoever handles a click, anywhere'],
          ]}
        />
        <GuideRules items={[
          'Logpoints are the actual upgrade from console.log: no source edit, no rebuild, no reload, cannot be committed.',
          'SET THE IGNORE LIST (/node_modules/) or stepping drops you into react-dom and the stack is unreadable. This one setting decides whether the debugger feels usable.',
          'Pause on CAUGHT exceptions to find a swallowed error — you land inside the catch that is eating it.',
          'While paused, the Console evaluates IN THAT FRAME: call functions, mutate state, test the fix before writing it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Network Setup" accent="amber" glyph="📡">
        <GuideRules items={[
          'Preserve log — or a redirect wipes your evidence.',
          'Disable cache — otherwise you are measuring your own warm cache.',
          'Throttle to Slow 4G — most waterfall problems are invisible until you do.',
          'Add the Initiator column: it names what caused each request, with the JS stack.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Timing Phases → Diagnosis" accent="blue" glyph="⏱️" span={2}>
        <GuideTable
          head={['Long phase', 'What it means', 'Who fixes it']}
          rows={[
            ['Queueing / Stalled', 'priority or concurrency problem', 'frontend — reprioritise'],
            ['DNS + Connection + SSL', 'paid once per ORIGIN', 'preconnect / fewer hosts'],
            ['Waiting (TTFB)', 'the server is thinking', 'BACKEND — no frontend fix'],
            ['Content Download', 'the asset is too big', 'split, compress, defer'],
          ]}
        />
        <GuideRules items={[
          'Parallel bars = healthy. A STAIRCASE = a dependency chain, and total time is the SUM.',
          'A chain means something was only discoverable after the previous response. preload breaks it.',
          'Blue line = DOMContentLoaded, red line = load. Requests before the blue line are your critical path.',
          '"Copy as cURL" then run it in a terminal: works there but not in the browser = cookies, Origin or CORS.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Performance: What to Look For" accent="red" glyph="🔥" span={2}>
        <GuideCode>{`CPU strip colours:
  yellow  Scripting     purple  Rendering
  green   Painting       grey    idle

Look for, in priority order:
 1. wide bar + RED TRIANGLE  -> LONG TASK (>50ms)
 2. repeated purple Layout   -> layout thrashing
                                ("Forced reflow")
 3. tall narrow spike        -> recursion / render cascade
 4. long green blocks        -> paint cost`}</GuideCode>
        <GuideRules items={[
          'Set CPU throttling to 4x first. Your machine is not the user\'s phone.',
          'Record ONE interaction, two seconds. A 30s recording is unreadable.',
          'Bottom-Up sorted by SELF time finds the hot function. Total time always shows a useless event handler at the top.',
          'Animate ONLY transform and opacity — those can be composited off the main thread. left/top/width/margin redo layout every frame.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Core Web Vitals" accent="green" glyph="📊" span={2}>
        <GuideTable
          head={['Metric', 'Good', 'Caused by']}
          rows={[
            ['LCP — Largest Contentful Paint', '< 2.5s', 'slow hero image, render-blocking CSS, slow TTFB'],
            ['CLS — Cumulative Layout Shift', '< 0.1', 'images with no width/height, font swap, injected content'],
            ['INP — Interaction to Next Paint', '< 200ms', 'LONG TASKS — the flame chart fixes this one'],
          ]}
        />
        <GuideCode>{`new PerformanceObserver(list => { … })
  .observe({ type: 'largest-contentful-paint',
             buffered: true });

// supportedEntryTypes in Chromium 149 includes:
//   largest-contentful-paint, layout-shift, longtask,
//   event, first-input, paint, resource, navigation,
//   long-animation-frame, mark, measure, element`}</GuideCode>
        <GuideRules items={[
          'performance.mark()/measure() put YOUR named bars in the Timings track. Verified: getEntriesByType("measure") returns them with a duration.',
          'Lighthouse is LAB data — one load, one device. Field data from PerformanceObserver is what counts.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="React DevTools Setup" accent="purple" glyph="⚛️">
        <GuideRules items={[
          'Highlight updates when components render — type in one input, watch what flashes. Finds the problem in 5 seconds with no profiling.',
          'Record why each component rendered — OFF by default, and it is the best feature. Turn it on.',
          'Hide components where… — strips framework wrappers out of the tree.',
          'Break on warnings — get a stack instead of a console line.',
          'No extension installed? window.__REACT_DEVTOOLS_GLOBAL_HOOK__ is undefined.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="&quot;Why Did This Render?&quot;" accent="green" glyph="🔁" span={2}>
        <GuideDefs items={[
          ['Props changed (x)', 'a new prop VALUE — often an array/object literal recreated in the parent, identical contents'],
          ['Hooks changed', 'useState / useReducer / useContext updated'],
          ['The parent component rendered', 'nothing of its own changed — this is what React.memo is for'],
          ['Context changed', 'a provider published a new value; an inline value={{a,b}} is a new object every render'],
          ['First time', 'mount'],
        ]} />
        <GuideRules items={[
          '"Parent rendered" and "Context changed" are IDENTITY problems, not work problems. Stabilise the value; do not memoise the child.',
          'Workflow: highlight updates -> record ONE interaction -> count commits in Timeline -> Ranked for the worst -> read the reason -> only then memoise -> RE-RECORD.',
          'React.memo on a component receiving an inline arrow or object literal does nothing — the comparison fails every time.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Dev vs Production" accent="amber" glyph="⚠️" span={2}>
        <GuideRules items={[
          'StrictMode double-invokes renders and effects in development on purpose. A log printing twice is not a bug.',
          'The development React build is much slower — warnings, prop checks, the DevTools hook. Use dev profiling for RELATIVE cost only; never quote a dev timing as real.',
          'React Profiler answers "which component and why". The browser Performance panel answers "where did the 50ms go" — it sees layout, paint, GC and third-party scripts that React cannot.',
          'A slow interaction with no expensive commits means the cost is not in rendering at all.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
