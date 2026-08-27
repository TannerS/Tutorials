import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function ReactRefs() {
  return (
    <LessonLayout
      title="Refs In Depth — From Basics to Imperative APIs"
      sectionId="react18"
      lessonIndex={3}
      prev={{ path: '/react18/hooks', label: 'Hooks Deep Dive' }}
      next={{ path: '/react18/state', label: 'State Management Patterns' }}
    >
      <h2>One API, Two Jobs</h2>

      <p>
        A ref is a <strong>mutable box with a stable identity across renders</strong>. That
        is the whole primitive. <code>useRef(initial)</code> hands you the same object every
        time the component renders, forever, until the component unmounts. The object has
        exactly one meaningful property — <code>.current</code> — and React does not care what
        you put in it.
      </p>

      <CodeBlock language="tsx" title="The entire mental model">
{`const ref = useRef(0);

// Render 1: ref === { current: 0 }
// Render 2: ref === the SAME object. Identity is stable.
// Render 9: still the same object.
//
// You may write to it at any time:
ref.current = 42;
//
// React never reads it, never diffs it, never re-renders because of it.`}
      </CodeBlock>

      <p>
        Almost all ref confusion comes from the fact that this one primitive is used for two
        jobs that feel unrelated:
      </p>

      <ol>
        <li>
          <strong>A handle to a DOM node.</strong> You pass the ref object to an element's{' '}
          <code>ref</code> attribute and React writes the node into <code>.current</code> for
          you during commit. <em>React is the writer; you are the reader.</em>
        </li>
        <li>
          <strong>Instance storage.</strong> A place to stash a value that must survive
          re-renders but must never cause one — a timer id, a subscription, an{' '}
          <code>AbortController</code>, the previous value of a prop.{' '}
          <em>You are the writer; React is not involved at all.</em>
        </li>
      </ol>

      <InfoBox variant="tip" title="Say which job out loud">
        <p>
          When you read unfamiliar ref code at work, the first question is always{' '}
          <strong>"who writes <code>.current</code>?"</strong> If React writes it, the timing
          rules in this lesson apply and you must respect the commit lifecycle. If your own
          code writes it, there is no lifecycle at all — it is a plain mutable variable that
          happens to outlive the render function.
        </p>
      </InfoBox>

      <h2>The DOM-Handle Job — and Its Timing</h2>

      <p>
        When React owns the writing, <code>.current</code> follows the commit phase, not the
        render phase. The consequence catches everyone once:
      </p>

      <CodeBlock language="tsx" title="Verified in a browser against React 19.2.6" showLineNumbers>
{`function Measured() {
  const boxRef = useRef<HTMLDivElement>(null);
  const [, force] = useState(0);

  // Runs DURING render — before React has committed anything.
  console.log('render sees:', boxRef.current);

  useEffect(() => {
    console.log('effect sees:', boxRef.current);
  });

  return <div ref={boxRef} onClick={() => force((n) => n + 1)}>box</div>;
}

// Console output:
//   render sees: null          <-- FIRST render: the node does not exist yet
//   effect sees: <div>         <-- committed, ref populated
//   (click)
//   render sees: <div>         <-- SECOND render: still populated from last commit
//   effect sees: <div>`}
      </CodeBlock>

      <p>
        <strong><code>ref.current</code> is <code>null</code> during the first render and
        populated from the second render onward.</strong> It is not "populated after a tick"
        or "populated once the browser is ready" — it is populated when React commits the
        tree, which is after the first render function returns and before effects run.
      </p>

      <FlowChart
        title="Ref Lifecycle — Mount, Update, Unmount"
        chart={"graph TD\n  A[\"Render 1 runs\"] --> B[\"ref.current is null\"]\n  B --> C[\"React commits DOM\"]\n  C --> D[\"React sets ref.current = node\"]\n  D --> E[\"useLayoutEffect runs - node available\"]\n  E --> F[\"Browser paints\"]\n  F --> G[\"useEffect runs - node available\"]\n  G --> H{\"What happens next?\"}\n  H -->|Re-render| I[\"Render 2 runs\"]\n  I --> J[\"ref.current still holds node\"]\n  J --> C\n  H -->|Unmount| K[\"useLayoutEffect cleanup - ref STILL populated\"]\n  K --> L[\"React sets ref.current = null\"]\n  L --> M[\"useEffect cleanup - ref ALREADY null\"]\n  style B fill:#3b1a1a,stroke:#ef5350\n  style D fill:#1a3329,stroke:#66bb6a\n  style K fill:#1a3329,stroke:#66bb6a\n  style M fill:#3b1a1a,stroke:#ef5350"}
      />

      <p>
        Hold on to the two green boxes at the bottom of that chart — the unmount ordering is
        the single most useful fact in this lesson once you start integrating third-party
        libraries, and we come back to it in the integration section.
      </p>

      <h2>The Instance-Storage Job — Why Mutation Doesn't Re-render</h2>

      <p>
        There is no magic to explain here, and that is exactly the point. React re-renders
        because a state setter <em>tells the scheduler there is pending work</em>. There is no
        observation of your data — no proxies, no dirty-checking pass, no deep comparison.{' '}
        <code>ref.current = x</code> is a property assignment on an ordinary JavaScript object
        that nothing is watching.
      </p>

      <CodeBlock language="tsx" title="The difference is a function call, not a data structure">
{`setCount(5);
// -> React marks the fiber dirty, schedules work, re-renders, re-runs effects.

countRef.current = 5;
// -> A property on an object changed. Nobody was told. Nothing happens.`}
      </CodeBlock>

      <p>
        "Nothing happens" is a feature. A whole category of values genuinely needs to survive
        renders while being invisible to the UI, and putting them in state would either cause
        an infinite loop or a flood of pointless renders. The recurring cast:
      </p>

      <CodeBlock language="tsx" title="The instance-storage catalogue" showLineNumbers>
{`// 1. Previous value — compare current vs last render without rendering again.
function usePrevious<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => { ref.current = value; });
  return ref.current;
}

// 2. Render counter — a diagnostic that must not itself cause renders.
//    In state this is an INFINITE LOOP. In a ref it is free.
const renders = useRef(0);
renders.current += 1;

// 3. Timer id — needed only so cleanup can cancel it.
const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);
function debouncedSave(value: string) {
  if (timeoutId.current) clearTimeout(timeoutId.current);
  timeoutId.current = setTimeout(() => save(value), 500);
}

// 4. Interval id — same shape, longer-lived.
const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

// 5. Subscription handle — an unsubscribe function you must hold on to.
const unsubscribe = useRef<(() => void) | null>(null);
useEffect(() => {
  unsubscribe.current = socket.subscribe(handleMessage);
  return () => unsubscribe.current?.();
}, []);

// 6. AbortController — cancel the in-flight request when a newer one starts.
const controller = useRef<AbortController | null>(null);
async function search(term: string) {
  controller.current?.abort();              // cancel the previous search
  controller.current = new AbortController();
  const res = await fetch(url(term), { signal: controller.current.signal });
  setResults(await res.json());             // the RESULT is state — the UI shows it
}`}
      </CodeBlock>

      <p>
        Look closely at the last one, because it contains both jobs in six lines. The{' '}
        <code>AbortController</code> lives in a ref: the UI never renders it, but a later call
        must be able to reach the earlier one. The <em>results</em> go in state: the UI is
        literally a picture of them. Same function, two different storage decisions, made for
        two different reasons.
      </p>

      <InfoBox variant="note" title="A ref per component instance, not per component">
        <p>
          The word "instance" is doing real work. If you render three{' '}
          <code>&lt;SearchBox /&gt;</code> components, there are three independent ref objects
          — a ref is per-fiber, exactly like state. This is why a ref is the right home for a
          third-party chart instance or a WebSocket, and a module-level <code>let</code> is
          not: the module-level variable is shared by every instance and leaks across mounts.
        </p>
      </InfoBox>

      <h2>Refs vs State — One Question Decides It</h2>

      <p>
        You do not need a checklist. You need one question, asked honestly:
      </p>

      <InfoBox variant="tip" title="The decision rule">
        <p>
          <strong>If the UI must reflect it, it is state. If it must survive a render but must
          never trigger one, it is a ref.</strong> If the answer is "both", it is state — and
          the ref, if you still need one, is a separate concern sitting next to it.
        </p>
      </InfoBox>

      <FlowChart
        title="Refs vs State — Decision"
        chart={"graph TD\n  A[\"I need to store a value\"] --> B{\"Does anything the user SEES change when it changes?\"}\n  B -->|Yes| C[\"useState / useReducer\"]\n  B -->|No| D{\"Must it survive across renders?\"}\n  D -->|No| E[\"Plain const inside the component\"]\n  D -->|Yes| F{\"Is it shared by every instance?\"}\n  F -->|Yes| G[\"Module scope\"]\n  F -->|No| H[\"useRef\"]\n  C --> I[\"Wrong choice here: render storms, effect loops\"]\n  H --> J[\"Wrong choice here: stale UI that never updates\"]\n  style C fill:#1a2744,stroke:#5b9cf6\n  style H fill:#1a3329,stroke:#66bb6a\n  style I fill:#3b1a1a,stroke:#ef5350\n  style J fill:#3b1a1a,stroke:#ef5350"}
      />

      <h3>Getting it backwards, way 1 — a ref where state belonged</h3>

      <p>
        The symptom is a UI that is stale, or updates "one behind" whenever something{' '}
        <em>else</em> happens to re-render the component. This is the more confusing of the
        two bugs, because the data is genuinely correct — it is only the screen that is lying.
      </p>

      <CodeBlock language="tsx" title="Broken: the number is right, the screen is wrong" showLineNumbers>
{`function LikeButton() {
  const likes = useRef(0);          // WRONG: the UI reflects this value

  return (
    <button onClick={() => { likes.current += 1; }}>
      {likes.current} likes
    </button>
  );
}

// Click, click, click.
// likes.current is genuinely 3. The button still says "0 likes".
// Nothing scheduled a render, so the button never re-ran.
//
// The evil version: if ANY unrelated state in this component changes later,
// the component re-renders and suddenly displays 3. It looks like a lag bug
// or a race condition. It is neither.

// Fixed: the UI reflects it, so it is state.
const [likes, setLikes] = useState(0);
<button onClick={() => setLikes((n) => n + 1)}>{likes} likes</button>`}
      </CodeBlock>

      <h3>Getting it backwards, way 2 — state where a ref belonged</h3>

      <p>
        The symptom is churn: render storms, effects that tear down and rebuild constantly,
        or an outright infinite loop. Here the screen is fine and the machinery is on fire.
      </p>

      <CodeBlock language="tsx" title="Broken: an infinite loop hiding in a dependency array" showLineNumbers>
{`function Clock() {
  const [now, setNow] = useState(Date.now());
  const [intervalId, setIntervalId] = useState<number | null>(null);
  //     ^^^^^^^^^^ WRONG: nothing renders the interval id

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    setIntervalId(id);              // schedules a render...
    return () => clearInterval(id);
  }, [intervalId]);                 // ...which changes this dep, which re-runs
                                    // the effect, which sets it again. Forever.

  return <span>{new Date(now).toLocaleTimeString()}</span>;
}

// Fixed: the id exists ONLY so cleanup can reach it. Nothing renders it.
function Clock() {
  const [now, setNow] = useState(Date.now());
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalId.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (intervalId.current) clearInterval(intervalId.current); };
  }, []);                           // stable deps, one interval, no loop

  return <span>{new Date(now).toLocaleTimeString()}</span>;
}`}
      </CodeBlock>

      <p>
        The milder everyday version of this bug is putting a high-frequency value in state:
        scroll offset, mouse position, drag delta, or the "latest value" a callback needs. If
        the number is only ever read by an event handler or an effect and never printed,
        state buys you sixty re-renders a second in exchange for nothing.
      </p>

      <InteractiveChallenge
        question="A form component tracks whether the user has edited any field, so it can warn on navigate-away inside a beforeunload handler. The warning text itself is rendered by the browser, not by React — nothing in the component's own JSX changes when the flag flips. Ref or state?"
        options={[
          "State — 'has the user edited anything' is clearly component state, and calling it a ref is an optimisation that will confuse the next reader",
          "A ref — the flag must survive re-renders and is read only inside an event handler; nothing the component renders depends on it, so state would buy a re-render on the first keystroke for no visible change",
          "Neither — derive it during render by comparing current values to the initial props",
          "A module-level variable, since beforeunload is a global browser event anyway"
        ]}
        correctIndex={1}
        explanation="Apply the rule literally: does the UI reflect it? No — the component's JSX is identical whether the flag is true or false, because the browser draws the warning dialog. It must survive renders so the handler can read it, so it is a ref. Option 1 sounds responsible but ignores the actual test; it costs a render on the first keystroke and every reset. Option 3 (derive it) is the right instinct in general and is often better — but only if you actually hold the initial values and the comparison is cheap, which for a large form with file inputs and nested objects it usually isn't. Option 4 breaks the moment two forms are on screen: module scope is shared by every instance, so one form's edits would trigger the other's warning."
      />

      <h2>Callback Refs — Being Told, Instead of Looking</h2>

      <p>
        The <code>ref</code> attribute accepts a function as well as a ref object. React calls
        that function with the DOM node when it attaches, and — classically — with{' '}
        <code>null</code> when it detaches. The difference from an object ref is not cosmetic:
      </p>

      <ul>
        <li>
          An <strong>object ref</strong> is a mailbox. React drops the node in it and you go
          look later, in an effect. Nobody tells you when it arrived.
        </li>
        <li>
          A <strong>callback ref</strong> is a notification. React calls <em>you</em>, at the
          exact moment the node attaches or detaches.
        </li>
      </ul>

      <h3>When exactly does it fire?</h3>

      <p>
        This is where people get burned, so here is the measured behaviour rather than the
        intuition. Given an inline arrow function as the ref:
      </p>

      <CodeBlock language="tsx" title="Measured in a browser against React 19.2.6" showLineNumbers>
{`function Demo() {
  const [n, setN] = useState(0);

  return (
    <div>
      <div ref={(node) => { console.log('ref called with', node, 'at n =', n); }}>
        box
      </div>
      <button onClick={() => setN((v) => v + 1)}>re-render</button>
    </div>
  );
}

// Mount:
//   ref called with <div> at n = 0
//
// Click (re-render, n becomes 1):
//   ref called with null   at n = 0     <-- the OLD callback, detaching
//   ref called with <div>  at n = 1     <-- the NEW callback, attaching
//
// Click again (n becomes 2):
//   ref called with null   at n = 1
//   ref called with <div>  at n = 2
//
// This happens on EVERY re-render. The DOM node was never replaced.`}
      </CodeBlock>

      <p>
        Read the <code>n</code> values in that log carefully, because they explain the whole
        mechanism. The detach call comes from the <em>previous</em> render's closure and the
        attach call from the new one. An inline arrow is a brand-new function identity on
        every render, and React's rule is: <strong>if the ref callback's identity changed,
        detach with the old one and attach with the new one.</strong> React has no way to know
        your two arrows do the same thing.
      </p>

      <InfoBox variant="warning" title="Usually harmless, occasionally a disaster">
        <p>
          For <code>ref={'{(node) => setEl(node)}'}</code> the double-fire costs nothing. But
          if the callback attaches an <code>IntersectionObserver</code>, starts a video, opens
          a WebSocket, or instantiates a charting library, an inline arrow tears it down and
          rebuilds it on <em>every single re-render of the parent</em> — including renders
          caused by something entirely unrelated. Wrap the callback in{' '}
          <code>useCallback</code> with honest dependencies and the identity stabilises, so
          React stops detaching and re-attaching.
        </p>
      </InfoBox>

      <h3>React 19 ref cleanup — and the guard it kills</h3>

      <p>
        React 19 lets a ref callback return a cleanup function, exactly like an effect. This
        changes the contract in a way that is easy to miss:
      </p>

      <CodeBlock language="tsx" title="Returning cleanup changes what React calls you with" showLineNumbers>
{`// Classic (React 18 and still legal in 19): you get called with null on detach.
<div ref={(node) => {
  if (!node) return;                  // the null-detach guard
  const observer = new IntersectionObserver(onIntersect);
  observer.observe(node);
  // ...and nowhere good to disconnect it. This is the problem 19 solved.
}} />

// React 19: return a cleanup instead.
<div ref={(node) => {
  const observer = new IntersectionObserver(onIntersect);
  observer.observe(node);
  return () => observer.disconnect();
}} />

// MEASURED: when you return a cleanup function, React NEVER calls the
// callback with null at all. Not on detach, not on unmount, not ever.
// The cleanup function is the detach signal now.
//
// Which means: inside a callback that returns cleanup,
//   if (!node) return;
// is DEAD CODE. It can never be true.`}
      </CodeBlock>

      <p>
        The two styles are mutually exclusive signalling protocols, not layers you stack.
        Either you get called with <code>null</code>, or you get your cleanup called — never
        both. Leaving the old guard in place while returning a cleanup is not a bug, but it is
        a permanently false branch that will make the next reader think detach-with-null still
        happens here. The React 19 features lesson flags the same thing from the
        migration side.
      </p>

      <h3>The pattern that genuinely needs a callback ref</h3>

      <p>
        Most of the time an object ref is fine. The case where it genuinely is not:{' '}
        <strong>measuring a node that is conditionally rendered.</strong> With an object ref
        you have to guess in a dependency array when the node showed up, and there is nothing
        honest to put there.
      </p>

      <CodeBlock language="tsx" title="Object ref: the effect that cannot express its own dependency" showLineNumbers>
{`function Panel({ open }: { open: boolean }) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // On the render where open flips false -> true, does this see the node?
    // Only because 'open' happens to be in the deps. Now imagine the node
    // appears because of a parent's state, a Suspense boundary resolving,
    // or a list item being filtered in. There is no dep for "the node exists".
    if (bodyRef.current) setHeight(bodyRef.current.offsetHeight);
  }, [open]);

  return open ? <div ref={bodyRef}>...</div> : null;
}`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Callback ref: React tells you, so there is nothing to guess" showLineNumbers>
{`function Panel({ open }: { open: boolean }) {
  const [height, setHeight] = useState(0);

  const measure = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;                       // classic style, no cleanup returned
    setHeight(node.getBoundingClientRect().height);
  }, []);                                    // stable identity: no re-attach churn

  return open ? <div ref={measure}>...</div> : null;
}

// The node appearing IS the event. It does not matter why it appeared --
// a prop, a parent, a Suspense boundary, a filter. React calls measure()
// the moment it attaches, and that is the only correct moment to measure.`}
      </CodeBlock>

      <InfoBox variant="note" title="If you also need to react to resizes">
        <p>
          Measuring once on attach is only correct until the content changes size. The
          production shape combines both ideas: a <code>useCallback</code> ref that attaches a{' '}
          <code>ResizeObserver</code> and returns <code>{'() => observer.disconnect()'}</code>.
          One stable callback, observation set up exactly when the node exists, torn down
          exactly when it goes away — and no <code>null</code> call to handle.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A list item uses an inline ref callback that creates an IntersectionObserver for analytics. The list re-renders whenever a sibling search box's text changes — the list items themselves are unchanged. What actually happens on each keystroke, in React 19?"
        options={[
          "Nothing — React sees the DOM node is the same and skips the ref entirely",
          "The callback is invoked once more with the same node, so a second observer is added on top of the first and they accumulate",
          "React detaches using the previous render's callback and attaches using the new one, so the observer is disconnected and rebuilt per keystroke — unless the callback returns no cleanup, in which case the old observer leaks instead",
          "React batches the ref updates and re-attaches once when typing stops"
        ]}
        correctIndex={2}
        explanation="Ref identity, not node identity, drives detach/attach. An inline arrow is a new function every render, so React runs the teardown path for the old callback and the setup path for the new one on every keystroke — measured as old-callback-with-null followed by new-callback-with-node. If the callback returns a cleanup, that cleanup runs and the observer is correctly disconnected, just wastefully often. If it does not return a cleanup, the old callback is invoked with null and unless you explicitly disconnect in that null branch the previous observer is never disconnected — that is the leak. Option 2 describes the leak's effect but gets the mechanism wrong: the callback is not simply called again with the same node. The fix in both cases is useCallback so the identity stops changing."
      />

      <h2><code>forwardRef</code> — What Is Actually True Today</h2>

      <p>
        Refs used not to be props. In React 18, writing{' '}
        <code>&lt;MyInput ref={'{r}'} /&gt;</code> on a function component did nothing useful
        — <code>ref</code> was stripped out before your component saw it, and you had to opt
        in with <code>forwardRef</code> to receive it as a second argument. React 19 removed
        the special case: <strong><code>ref</code> is now an ordinary prop</strong> on function
        components.
      </p>

      <CodeBlock language="tsx" title="Both of these work in React 19" showLineNumbers>
{`// Legacy — still works, still supported, zero warnings.
const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(props, ref) {
  return <input {...props} ref={ref} />;
});

// React 19 — ref is just a prop you destructure.
function TextInput({ placeholder, ref }: Props & { ref?: Ref<HTMLInputElement> }) {
  return <input placeholder={placeholder} ref={ref} />;
}

// The caller cannot tell the difference:
<TextInput placeholder="name" ref={inputRef} />`}
      </CodeBlock>

      <InfoBox variant="warning" title="Precisely: not deprecated today, deprecated later">
        <p>
          <code>forwardRef</code> is <strong>not deprecated in React 19</strong>. Rendering a{' '}
          <code>forwardRef</code> component on 19.2.6 emits <strong>zero console warnings</strong>
          {' '}— measured, not assumed. What react.dev actually says is that it{' '}
          <em>"will be deprecated in a future release"</em> — future tense, no version named,
          no deprecation warning shipped.
        </p>
        <p>
          So: write new components with <code>ref</code> as a plain prop, and migrate existing{' '}
          <code>forwardRef</code> components opportunistically when you are already editing
          them. There is no fire to put out, and a mass mechanical migration buys you nothing
          today. Be suspicious of anyone — including older pages of this site — who tells you{' '}
          <code>forwardRef</code> is deprecated <em>now</em>; that claim has been wrong every
          time it has been made.
        </p>
      </InfoBox>

      <p>
        Two edges worth knowing. First, this is a <strong>React 19 feature, not a TypeScript
        one</strong> — if any part of your app still runs on React 18, or you publish a library
        that supports 18, <code>forwardRef</code> is still the only portable option. Second,{' '}
        <code>ref</code>-as-a-prop applies to <em>function</em> components; putting a{' '}
        <code>ref</code> on a class component still hands you the class instance through the
        old mechanism and is not a prop the class receives.
      </p>

      <h2><code>useImperativeHandle</code> — Publishing a Narrow API</h2>

      <p>
        Forwarding a ref straight through to a DOM node hands the parent{' '}
        <em>the entire element</em>. Every method, every property, forever. That is an
        unbounded contract: any caller can rewrite <code>innerHTML</code>, mutate styles, or
        yank children out from under React, and you can never refactor the internals without
        risking someone's code.
      </p>

      <p>
        <code>useImperativeHandle</code> lets the child decide what <code>.current</code>{' '}
        actually <em>is</em>. You replace the node with an object of your own design.
      </p>

      <CodeBlock language="tsx" title="A video player that publishes four verbs, not an element" showLineNumbers>
{`type PlayerHandle = {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
};

function VideoPlayer({ src, ref }: { src: string; ref?: Ref<PlayerHandle> }) {
  const videoRef = useRef<HTMLVideoElement>(null);   // the real node stays private

  useImperativeHandle(ref, () => ({
    play:  () => { void videoRef.current?.play(); },
    pause: () => { videoRef.current?.pause(); },
    seek:  (seconds) => { if (videoRef.current) videoRef.current.currentTime = seconds; },
  }), []);                                            // deps: see below

  return <video ref={videoRef} src={src} />;
}

// The parent gets exactly three verbs and no element:
function Lesson() {
  const player = useRef<PlayerHandle>(null);
  return (
    <>
      <VideoPlayer src="/intro.mp4" ref={player} />
      <button onClick={() => player.current?.seek(0)}>Restart</button>
    </>
  );
}`}
      </CodeBlock>

      <p>
        The narrowness <em>is</em> the feature, and it is worth being explicit about why, because
        "expose less" sounds like fussy purity until you have lived the alternative:
      </p>

      <ul>
        <li>
          <strong>You can change the implementation.</strong> Swap{' '}
          <code>&lt;video&gt;</code> for an HLS player, a canvas renderer, or an iframe embed.
          As long as <code>play/pause/seek</code> still mean the same thing, no caller changes.
          If you had exposed the element, every caller reading{' '}
          <code>.current.currentTime</code> directly breaks.
        </li>
        <li>
          <strong>The contract is greppable and typed.</strong>{' '}
          <code>PlayerHandle</code> is three lines that tell you everything a parent is allowed
          to do. <code>HTMLVideoElement</code> tells you nothing about intent.
        </li>
        <li>
          <strong>You can enforce invariants.</strong> <code>seek()</code> can clamp to
          duration, refuse before metadata loads, or fire analytics. A raw{' '}
          <code>currentTime</code> assignment can do none of that.
        </li>
      </ul>

      <p>
        Good handles are verbs the component genuinely owns:{' '}
        <code>focus()</code>, <code>scrollIntoView()</code>, <code>play()</code>,{' '}
        <code>validate()</code>, <code>reset()</code>, <code>openAt(index)</code>. A handle
        that exposes <code>getNode()</code> has defeated the entire purpose.
      </p>

      <h3>The dependency array, and what omitting it does</h3>

      <p>
        <code>useImperativeHandle(ref, createHandle, deps)</code> takes a dependency array with
        the same semantics as <code>useMemo</code>: the handle object is rebuilt when a
        dependency changes, and React re-assigns <code>ref.current</code> to the new object.
      </p>

      <CodeBlock language="tsx" title="Omitting deps vs getting them wrong" showLineNumbers>
{`// 1. NO deps array: the handle object is rebuilt on EVERY render, and
//    ref.current is re-assigned every time.
useImperativeHandle(ref, () => ({ focus }));
//    Usually harmless -- but any parent that captured ref.current into a
//    variable, a closure, or an effect dependency is now holding a dead
//    object, and effects keyed on the handle re-run on every child render.

// 2. Deps that LIE: the classic stale-closure bug.
function Form({ values, onSubmit, ref }) {
  useImperativeHandle(ref, () => ({
    submit: () => onSubmit(values),   // captures 'values' from THIS render
  }), []);                            // ...and never rebuilds. Forever the
                                      // first render's empty form.
}

// 3. Honest deps: rebuild when the captured values change.
useImperativeHandle(ref, () => ({
  submit: () => onSubmit(values),
}), [values, onSubmit]);

// 4. Best: don't capture at all. Read through a ref at CALL time, so the
//    handle is genuinely dependency-free and the deps array is honestly [].
const latest = useRef({ values, onSubmit });
latest.current = { values, onSubmit };
useImperativeHandle(ref, () => ({
  submit: () => latest.current.onSubmit(latest.current.values),
}), []);`}
      </CodeBlock>

      <p>
        Option 4 is the same trick as the <code>useStableCallback</code> pattern from the{' '}
        <strong>Hooks Deep Dive</strong> lesson, applied to an imperative handle: one ref holds
        the latest values, and the published methods read it at call time instead of closing
        over a render's snapshot. It is the reason a well-built handle can keep{' '}
        <code>[]</code> deps without lying.
      </p>

      <InfoBox variant="tip" title="Imperative handles vs promise-bridged dialogs">
        <p>
          <code>useImperativeHandle</code> is for "do this to that component <em>now</em>" —
          fire-and-forget verbs. When you instead need an imperative <em>result</em> —{' '}
          <code>const ok = await confirm('Delete?')</code> — a ref handle is the wrong shape,
          because you would be inventing your own callback plumbing on top of it. That is what
          the <strong>Imperative Bridge Patterns</strong> lesson covers with promise-bridged
          dialogs. Rule of thumb: <strong>refs for commands, promises for answers.</strong>
        </p>
      </InfoBox>

      <h2>Integrating Non-React Libraries — Where Refs Get Hairy</h2>

      <p>
        This is the real reason refs look complicated in a production codebase. Charting
        libraries, maps, video players, rich-text editors, virtualisers, drag-and-drop engines
        — they all <strong>own their own DOM</strong>. They create nodes, mutate them, and
        expect nobody else to interfere. React expects exactly the same thing about its tree.
        Two owners, one document.
      </p>

      <p>
        The treaty that makes this work is always the same: React renders{' '}
        <strong>one empty container element and never looks inside it again</strong>. You hand
        that node to the library, and the library's instance lives in a ref.
      </p>

      <FlowChart
        title="Third-Party Widget — Mount, Update, Teardown"
        chart={"graph TD\n  A[\"React renders an empty container div\"] --> B[\"Effect with empty deps runs once\"]\n  B --> C[\"Create library instance with the container node\"]\n  C --> D[\"Store instance in a ref - NOT state\"]\n  D --> E{\"A prop changes\"}\n  E -->|data| F[\"Separate effect: instance.setData(data)\"]\n  E -->|theme| G[\"Separate effect: instance.setTheme(theme)\"]\n  F --> E\n  G --> E\n  E -->|Unmount| H[\"Cleanup: instance.destroy()\"]\n  H --> I[\"Null the instance ref\"]\n  style D fill:#1a3329,stroke:#66bb6a\n  style C fill:#1a2744,stroke:#5b9cf6\n  style H fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>
        Two structural rules come out of that diagram, and both are constantly violated:
      </p>

      <ul>
        <li>
          <strong>Creation is one effect with <code>[]</code> deps.</strong> Every prop that
          the widget can be updated with imperatively gets its <em>own</em> effect calling its
          own setter method. If you put <code>data</code> in the creation effect's deps, you
          destroy and rebuild an entire chart every time a number changes — you will see it
          flash, and you will lose zoom, selection, and scroll position.
        </li>
        <li>
          <strong>The instance goes in a ref, not state.</strong> Putting it in state means the
          creation effect calls a setter, which renders, and the instance is now a value that
          can land in dependency arrays and drag effects around behind it. It also renders a
          giant non-serialisable mutable object for no reason — nothing in your JSX will ever
          display it. It is the definition of "must survive renders, must never cause one."
        </li>
      </ul>

      <CodeBlock language="tsx" title="The shape, with the container-node subtlety handled" showLineNumbers>
{`function PriceChart({ data, theme }: { data: Point[]; theme: 'light' | 'dark' }) {
  const containerRef = useRef<HTMLDivElement>(null);   // React writes this
  const chartRef = useRef<Chart | null>(null);         // YOU write this

  // 1. CREATE -- exactly once.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const chart = new Chart(node, { theme });
    chartRef.current = chart;

    return () => {
      chart.destroy();          // note: 'chart', the local const -- not chartRef.current
      chartRef.current = null;
    };
  }, []);                       // deliberately empty: create once, destroy once

  // 2. UPDATE -- one effect per imperatively-updatable prop.
  useEffect(() => { chartRef.current?.setData(data); }, [data]);
  useEffect(() => { chartRef.current?.setTheme(theme); }, [theme]);

  // 3. React owns this div's existence and nothing else about it.
  return <div ref={containerRef} style={{ height: 320 }} />;
}`}
      </CodeBlock>

      <h3>Why teardown reads a local variable, not the ref</h3>

      <p>
        That <code>const node = containerRef.current</code> at the top of the effect is not
        style. It is load-bearing, and here is the measured reason:
      </p>

      <InfoBox variant="danger" title="Measured on React 19.2.6 — unmount ordering">
        <p>
          On unmount, a React-managed object ref is <strong>still populated during a{' '}
          <code>useLayoutEffect</code> cleanup</strong>, but is <strong>already{' '}
          <code>null</code> during a <code>useEffect</code> cleanup</strong>. React detaches
          refs in between the two.
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="The same teardown, right and wrong" showLineNumbers>
{`// BROKEN: on unmount this reads null and silently does nothing.
useEffect(() => {
  new Chart(containerRef.current!, opts);
  return () => {
    containerRef.current?.replaceChildren();   // <-- null here. Leak.
  };
}, []);

// CORRECT: capture the node while the effect body runs, when it IS populated.
useEffect(() => {
  const node = containerRef.current;
  if (!node) return;
  const chart = new Chart(node, opts);
  return () => {
    chart.destroy();
    node.replaceChildren();                    // <-- the captured node. Fine.
  };
}, []);

// ALSO CORRECT: useLayoutEffect cleanup, where the ref is still populated.
useLayoutEffect(() => {
  const chart = new Chart(containerRef.current!, opts);
  return () => {
    chart.destroy();
    containerRef.current?.replaceChildren();   // <-- still the node here.
  };
}, []);`}
      </CodeBlock>

      <p>
        Notice that this hazard only ever applies to the <strong>container</strong> ref — the
        one React writes. <code>chartRef</code> is yours; React has no idea it exists and will
        never null it, so reading <code>chartRef.current</code> in a <code>useEffect</code>{' '}
        cleanup is perfectly safe. This is the "who writes <code>.current</code>?" question
        from the top of the lesson paying off: <strong>React-written refs have a lifecycle,
        your own refs do not.</strong>
      </p>

      <p>
        The ordering also tells you <em>where teardown belongs</em> when it is visual. Destroying
        a widget in a <code>useEffect</code> cleanup happens after the browser has already had a
        chance to paint, so a heavy teardown can flash a half-dismantled widget for a frame.
        Teardown that must be invisible — removing an overlay, restoring{' '}
        <code>document.body</code> scroll, disposing a WebGL context — belongs in{' '}
        <code>useLayoutEffect</code>, which runs synchronously before paint. Everything else can
        stay in <code>useEffect</code> and keep the main thread free.
      </p>

      <InfoBox variant="warning" title="StrictMode will double-mount this in development">
        <p>
          In development, React 18+ mounts, unmounts, and remounts every component once to
          surface exactly this class of bug. If your creation effect is not perfectly
          symmetrical with its cleanup, you get <strong>two charts, two map instances, two
          editors</strong> — usually visible as a duplicated widget or a doubled event
          listener, only in dev. That is not a StrictMode bug to work around with a
          "did I already initialise?" ref guard. It is the test telling you the cleanup is
          incomplete: whatever <code>create</code> did, <code>destroy</code> must fully undo.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A map component instantiates a library in useEffect with [] deps and, in the cleanup, calls map.remove() and then containerRef.current.replaceChildren() to clear leftover nodes. In dev with StrictMode, the map renders twice stacked; in production, unmounting a route leaves detached DOM in memory. What single fact explains both?"
        options={[
          "StrictMode is running the effect twice, so the fix is a hasInitialised ref guard that skips the second run",
          "map.remove() is async, so replaceChildren() runs before the library has finished tearing down",
          "React nulls the container ref before useEffect cleanups run, so replaceChildren() never executes — the cleanup is silently incomplete, which StrictMode's remount exposes as a doubled widget and production exposes as a leak",
          "The [] deps array is wrong — it should list containerRef so the effect re-runs when the node attaches"
        ]}
        correctIndex={2}
        explanation="Measured: a React-managed object ref is already null during a useEffect cleanup (it is still populated during a useLayoutEffect cleanup). So containerRef.current?.replaceChildren() is a no-op, leftover nodes survive, and the cleanup does not undo what setup did. StrictMode's mount-unmount-remount then stacks a second widget on top of the surviving nodes, and in production the same incomplete teardown leaves detached DOM alive. The fix is to capture const node = containerRef.current in the effect body and call node.replaceChildren() in the cleanup, or move the teardown to useLayoutEffect. Option 1 is the common wrong fix: a hasInitialised guard hides the symptom in dev while leaving the production leak completely intact. Option 4 is a non-fix — ref objects have stable identity, so listing containerRef in deps changes nothing."
      />

      <h2>The Eight Mistakes You Will Actually Meet</h2>

      <h3>1. Reading <code>ref.current</code> during render</h3>

      <p>
        A render must be a pure function of props and state. <code>ref.current</code> is
        neither — it can change without telling anyone, so React cannot know your output is
        stale. Read it in event handlers and effects, where the commit has already happened.
      </p>

      <CodeBlock language="tsx" title="Render-time reads and the one sanctioned write">
{`// WRONG: not reactive, and null on first render anyway.
return <div>{inputRef.current?.value}</div>;

// WRONG: writing during render makes the render impure and is not
// safe under concurrent rendering, which may discard and re-run it.
renderCount.current += 1;
return <div>rendered {renderCount.current} times</div>;

// THE EXCEPTION: lazy initialisation. Idempotent, so re-running is harmless.
// This is the one render-time ref write React explicitly blesses.
const heavy = useRef<Parser | null>(null);
if (heavy.current === null) heavy.current = new Parser();   // runs once, ever`}
      </CodeBlock>

      <h3>2. Assuming the ref is populated on the first render</h3>

      <p>
        It is <code>null</code>. Every time. Measured at the top of this lesson. Any code
        path that runs during the first render and dereferences a DOM ref will crash or
        silently no-op — and the <code>?.</code> that "fixes" it usually just converts a crash
        into a feature that mysteriously never works.
      </p>

      <h3>3. A ref where derived state belonged</h3>

      <p>
        Caching a computed value in a ref to "avoid recomputing" is a memo with none of the
        safety. Nothing invalidates it, so it goes stale the moment its inputs change and
        produces a UI that disagrees with its own props.
      </p>

      <CodeBlock language="tsx" title="A cache that never invalidates">
{`// WRONG: total is frozen at whatever the first render's items were.
const total = useRef(0);
if (total.current === 0) total.current = items.reduce((a, i) => a + i.price, 0);

// RIGHT: just derive it. It is cheap, and it is never wrong.
const total = items.reduce((a, i) => a + i.price, 0);

// RIGHT, if profiling actually showed it mattered:
const total = useMemo(() => items.reduce((a, i) => a + i.price, 0), [items]);`}
      </CodeBlock>

      <h3>4. Using a ref to silence a dependency warning</h3>

      <p>
        Stashing a value in a ref so you can leave it out of a dependency array is sometimes
        correct — and sometimes it is how a real bug gets buried. The distinction is whether
        the effect <em>should</em> re-run when the value changes.
      </p>

      <CodeBlock language="tsx" title="The same technique, once right and once wrong">
{`// RIGHT: the subscription must NOT be rebuilt when the handler changes.
// The ref is deliberately breaking a dependency that would cause churn.
const onMessage = useRef(handler);
onMessage.current = handler;
useEffect(() => {
  const sub = socket.subscribe((m) => onMessage.current(m));
  return () => sub.unsubscribe();
}, [socket]);

// WRONG: the fetch genuinely SHOULD re-run when userId changes.
// The ref hides that, and the panel now shows the first user forever.
const userIdRef = useRef(userId);
userIdRef.current = userId;
useEffect(() => {
  fetch('/api/users/' + userIdRef.current).then(/* ... */);
}, []);   // lint is happy. The feature is broken.`}
      </CodeBlock>

      <p>
        The related trap is the <strong>stale read across an <code>await</code></strong>. A ref
        is only fresh at the moment you read it; copying it into a local variable and using
        that local after an <code>await</code> gives you a snapshot from before the pause.
      </p>

      <CodeBlock language="tsx" title="Read the ref late, not early">
{`// WRONG: 'chart' was read before the await; it may be destroyed by now.
async function refresh() {
  const chart = chartRef.current;
  const data = await fetchData();
  chart.setData(data);                    // possibly a destroyed instance
}

// RIGHT: read after the await, and check.
async function refresh() {
  const data = await fetchData();
  chartRef.current?.setData(data);        // null if we unmounted mid-flight
}`}
      </CodeBlock>

      <h3>5. Threading a ref through layers where composition would do</h3>

      <p>
        Passing a ref down through three components so a page can focus an input is prop
        drilling with worse ergonomics: every layer in between now has an{' '}
        <code>inputRef</code> prop it does not use, exists only to relay, and cannot be
        reordered or reused without dragging the ref along. The ref has coupled components
        that have nothing to do with each other.
      </p>

      <CodeBlock language="tsx" title="Move the behaviour instead of the ref">
{`// SMELL: a ref relayed through layers that do not care about it.
<Page inputRef={ref} />        // -> <Section inputRef={ref} />
                               //      -> <Form inputRef={ref} />
                               //           -> <input ref={ref} />

// BETTER 1 -- composition: the owner renders the element itself
// and passes it down as content. No layer relays anything.
<Page><Form input={<input ref={ref} />} /></Page>

// BETTER 2 -- declarative prop: describe the intent, let the owner do it.
// Most "I need a ref to focus it" cases are really this.
<Form autoFocusField="email" />

// BETTER 3 -- if it must stay imperative, put ONE handle at the boundary
// so exactly one layer participates instead of three.
useImperativeHandle(ref, () => ({ focusEmail: () => emailRef.current?.focus() }), []);`}
      </CodeBlock>

      <h3>6. Mutating DOM that React also renders</h3>

      <p>
        Setting <code>ref.current.textContent</code> or <code>style.display</code> on a node
        whose content React also controls means the next render silently reverts your change —
        or worse, does not, and the two owners drift apart. Only ever imperatively mutate nodes
        that React renders <strong>empty</strong>, which is exactly the treaty from the
        integration section.
      </p>

      <h3>7. Leaving <code>if (!node) return</code> in a cleanup-returning callback ref</h3>

      <p>
        Dead code, permanently. If the callback returns a cleanup function, React never calls
        it with <code>null</code> — measured, and noted in the React 19 features lesson too.
        Pick one protocol and delete the other.
      </p>

      <h3>8. An inline arrow ref around expensive setup</h3>

      <p>
        New function identity every render means detach-and-reattach every render. Fine for{' '}
        <code>{'(node) => setEl(node)'}</code>; ruinous for anything that opens a connection,
        instantiates a library, or starts an observer. <code>useCallback</code> it.
      </p>

      <h2>The Whole Lesson in Six Lines</h2>

      <InfoBox variant="success" title="Carry these out">
        <ul>
          <li>
            A ref is a <strong>mutable box with stable identity</strong>. Nothing watches it.
          </li>
          <li>
            Ask <strong>"who writes <code>.current</code>?"</strong> React-written refs have a
            commit lifecycle; your own refs have none.
          </li>
          <li>
            <strong>UI reflects it → state. Survives a render but must never cause one → ref.</strong>
          </li>
          <li>
            DOM refs are <strong><code>null</code> on the first render</strong>, and already
            null again by the time a <code>useEffect</code> cleanup runs on unmount.
          </li>
          <li>
            Callback refs fire on <strong>identity change, not node change</strong> — so
            stabilise them, and prefer returning a cleanup over handling <code>null</code>.
          </li>
          <li>
            Expose <strong>verbs, not nodes</strong>. A narrow{' '}
            <code>useImperativeHandle</code> is a contract you can still refactor next year.
          </li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}

export default ReactRefs;
