import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="React Anti-Patterns Overview"
      sectionId="react-antipatterns"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-antipatterns/state', label: 'State Anti-Patterns' }}
    >
      <h2>What Are React Anti-Patterns?</h2>
      <p>
        Anti-patterns are common solutions to recurring problems that appear
        effective on the surface but ultimately create more issues than they
        solve. In React, anti-patterns lead to components that are hard to
        maintain, difficult to test, and prone to subtle bugs.
      </p>
      <p>
        Understanding anti-patterns is just as important as learning best
        practices. When you can recognize what <em>not</em> to do, you
        naturally gravitate toward cleaner, more idiomatic React code.
      </p>

      <FlowChart
        title="The Spectrum from Bad to Good Practices"
        chart={"graph LR\nA[Bad Practices]-->B[Anti-Patterns]\nB-->C[Code Smells]\nC-->D[Acceptable Code]\nD-->E[Good Practices]\nE-->F[Idiomatic React]\nstyle A fill:#3b1a1a\nstyle B fill:#3d2f14\nstyle C fill:#3d2f14\nstyle D fill:#1a3329\nstyle E fill:#1a3329\nstyle F fill:#1a3329"}
      />

      <h2>Why Do Anti-Patterns Emerge?</h2>
      <p>
        Anti-patterns rarely come from malice. They creep into codebases for
        entirely human reasons. Recognizing these root causes helps teams
        address the problem systemically rather than blaming individuals.
      </p>

      <h3>1. Copy-Paste from Tutorials</h3>
      <p>
        Tutorials simplify in order to teach one concept at a time, and that is
        the right call — an example that handled every edge case would bury the
        idea it exists to show. The problem is that the simplification is
        invisible. Nothing in the snippet marks which parts were the lesson and
        which parts were omitted, so it reads as finished code.
      </p>

      <InfoBox variant="note" title="Including this one">
        That applies to this site. Examples here are cut down to make a point,
        and several of them would need more work before they belonged in a
        production codebase. Where that gap matters, the lessons try to say so
        explicitly rather than leave you to discover it — the note under the
        next example is an instance of exactly that.
      </InfoBox>

      <CodeBlock language="jsx" title="Tutorial-Style Code (Problematic at Scale)">
        {`// Fetching data directly inside the component body
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg error={error} />;
  return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <p>
        That compiles, runs, and demos perfectly. Three specific things are
        wrong with it, and none of them show up until it is under real
        conditions:
      </p>
      <ul>
        <li>
          <strong>The responses can arrive out of order.</strong> Change{' '}
          <code>userId</code> from 1 to 2 quickly and two requests are in
          flight. If the slower request for user 1 lands second, it calls{' '}
          <code>setUser</code> last and the screen shows user 1 while the prop
          says 2. The effect has no cleanup, so nothing cancels or ignores the
          stale response. This is the bug that is hardest to reproduce and
          easiest to ship.
        </li>
        <li>
          <strong>It updates state after unmount.</strong> Navigate away while
          the request is in flight and <code>setUser</code> runs on a component
          that no longer exists.
        </li>
        <li>
          <strong>
            <code>fetch</code> does not reject on 404 or 500.
          </strong>{' '}
          It only rejects on network failure. A 500 resolves normally, so{' '}
          <code>res.json()</code> parses the error body, <code>setUser</code>{' '}
          stores it, and <code>error</code> stays <code>null</code>. The branch
          that looks like error handling never runs.
        </li>
      </ul>
      <p>
        There is also a structural cost. The fetching is welded to this
        component, so the next component that needs a user copies all of it —
        including all three bugs — and two of them mounted together fire two
        identical requests.
      </p>

      <p>
        None of that requires a library to fix. The cheapest correct version is
        the same code with a flag that ignores a response you no longer want,
        and a status check:
      </p>

      <CodeBlock language="jsx" title="Fix 1 — Same Shape, No Dependencies">
        {`function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Flipped by the cleanup function below when userId changes or the
    // component unmounts. A response that arrives after that is ignored,
    // which is what kills both the ordering bug and the unmount warning.
    let ignore = false;
    setLoading(true);

    fetch(\`/api/users/\${userId}\`)
      .then(res => {
        // fetch only rejects on network failure, so a 404 or 500 has to
        // be turned into an error by hand.
        if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
        return res.json();
      })
      .then(data => { if (!ignore) { setUser(data); setLoading(false); } })
      .catch(err => { if (!ignore) { setError(err); setLoading(false); } });

    return () => { ignore = true; };
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg error={error} />;
  return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <p>
        That is now correct. Six added lines, no new dependency, and it is the
        version to reach for when one or two components fetch something. What it
        still does not do is <em>share</em> anything: move it into a{' '}
        <code>useUser(userId)</code> custom hook and the logic becomes reusable,
        but two components calling that hook still fire two requests, because
        nothing holds a result that both can see.
      </p>

      <p>
        That gap — a cache that outlives any one component — is what a
        data-fetching library exists to fill.{' '}
        <strong>TanStack Query</strong> (still widely called React Query) keeps
        responses in a cache keyed by a value you choose, so repeated requests
        for the same key are served once and shared. On top of that it tracks
        loading and error state for you, retries failures, and refetches in the
        background when data goes stale. It is covered properly in{' '}
        <a href="/react-query/fundamentals">React Query: Fundamentals</a>.
      </p>

      <p>It is one option, not the only one:</p>
      <ul>
        <li>
          <strong>The effect above.</strong> No dependency, correct, fine for a
          handful of call sites. The default.
        </li>
        <li>
          <strong>Your framework&apos;s data layer.</strong> If you already use
          React Router, its{' '}
          <a href="/react-router/data">loaders</a> fetch before the route
          renders and avoid the whole fetch-in-effect shape. A
          server-rendering framework does the same at a different layer.
          Reaching for a second system when you already have one is its own
          anti-pattern.
        </li>
        <li>
          <strong>A caching library</strong> — TanStack Query, SWR, or RTK Query
          if you already run Redux. Worth it when many components read the same
          server data, or when you want caching and background refetching and
          would otherwise build them.
        </li>
      </ul>

      <p>
        The library version of the same component, for comparison:
      </p>

      <CodeBlock language="jsx" title="Fix 2 — With a Caching Library">
        {`// Extract data-fetching into a reusable hook
function useUser(userId) {
  // TanStack Query v5 takes a single options object. The older positional
  // form — useQuery(['user', id], fn) — was removed in v5.
  return useQuery({
    queryKey: ['user', userId],
    // fetch resolves on 404/500, so a non-OK response has to be turned
    // into a thrown error explicitly or it is treated as success.
    queryFn: async () => {
      const res = await fetch(\`/api/users/\${userId}\`);
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      return res.json();
    },
  });
}

function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMsg error={error} />;
  return <div>{user.name}</div>;
}`}
      </CodeBlock>

      <p>
        Measured against Fix 1 rather than against the broken original, the win
        is narrower than it first looks. Both are correct; both handle ordering
        and unmounting. What the library adds is the <code>queryKey</code> —
        because results live in a cache under that key instead of in one
        component&apos;s state, ten components asking for{' '}
        <code>['user', 7]</code> share one request and one copy, and retries and
        background refetching come with it. Note what it does{' '}
        <em>not</em> do: the <code>res.ok</code> check is still yours, because{' '}
        <code>fetch</code> treats a 500 as a successful response no matter who
        calls it.
      </p>
      <p>
        So the honest summary is not &ldquo;use a library.&rdquo; It is that the
        original snippet had three bugs, six lines fixed them, and a library is
        worth its weight once the same data is read in many places. Picking it up
        before that point is itself a tutorial habit — the one this section is
        about.
      </p>
      <p>
        The useful habit is not &ldquo;reach for a library&rdquo;. It is to ask
        of any snippet you are about to adopt: <strong>what did this leave out
        in order to stay readable?</strong> Error paths, cancellation, and what
        happens on the second render are the usual answers.
      </p>

      <h3>2. Deadline Pressure</h3>
      <p>
        Under tight deadlines, developers reach for the quickest solution
        rather than the most sustainable one. A prop gets drilled through five
        components instead of reaching for context or composition. A
        <code>useEffect</code> gains yet another dependency instead of being
        refactored into smaller hooks.
      </p>

      <h3>3. Incomplete Mental Models</h3>
      <p>
        React has a unique rendering model. Developers coming from imperative
        frameworks sometimes fight against React rather than working with it,
        producing patterns that technically work but miss the declarative
        philosophy entirely.
      </p>

      <InfoBox variant="warning" title="The Golden Rule">
        If it feels complicated, there is probably a simpler pattern. When a
        component becomes hard to read, difficult to test, or tightly coupled
        to its siblings, step back and ask whether a different composition
        strategy would simplify things.
      </InfoBox>

      <h2>The Cost of Anti-Patterns</h2>
      <p>
        Anti-patterns are not just aesthetic problems. They have real,
        measurable consequences for your application and your team.
      </p>

      <FlowChart
        title="How Anti-Patterns Compound Over Time"
        chart={"graph TD\nA[Anti-Pattern Introduced]-->B[Quick Feature Delivered]\nB-->C[More Code Built on Top]\nC-->D[Bug Discovered]\nD-->E[Hard to Diagnose]\nE-->F[Expensive Fix]\nF-->G[Technical Debt Grows]\nG-->C\nstyle A fill:#3b1a1a\nstyle D fill:#3d2f14\nstyle F fill:#3d2f14\nstyle G fill:#3b1a1a"}
      />

      <h3>Performance Impact</h3>
      <p>
        Many anti-patterns cause unnecessary re-renders. In a tree that has
        been deliberately memoized, a single inline function or object literal
        in a prop can defeat that memoization and cascade into wasted render
        cycles across an entire subtree — the optimization silently stops
        working while still costing you the code to maintain it.
      </p>

      <p>
        Before the example, one piece of vocabulary that the rest of this
        section leans on. A <strong>stable reference</strong> is a value whose
        identity (the thing <code>===</code> compares) survives across renders.
        Primitives like <code>16</code> or <code>'red'</code> are always stable
        — <code>16 === 16</code>. Objects, arrays and functions are not: every
        render evaluates <code>{'{ color: \'red\' }'}</code> afresh and produces
        a <em>new</em> object that is <code>!==</code> the last one, even though
        it looks identical. That distinction is the entire mechanism behind the
        next few pages.
      </p>

      <CodeBlock language="jsx" title="Unnecessary Re-Renders (Anti-Pattern)">
        {`// Precondition: these children are wrapped in React.memo. That is what
// makes prop identity matter at all — see the note below.
const ExpensiveChild = React.memo(function ExpensiveChild({ style }) { /* ... */ });
const AnotherChild = React.memo(function AnotherChild({ onAction }) { /* ... */ });

function ParentComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* New object identity every render, so memo's props comparison
          fails and ExpensiveChild re-renders anyway */}
      <ExpensiveChild style={{ color: 'red', fontSize: 16 }} />
      {/* Same story: a new function identity every render */}
      <AnotherChild onAction={() => console.log('clicked')} />
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Stable References (Clean Pattern)">
        {`// Hoisted out of the component: created once for the module's lifetime,
// so every render passes the identical object.
const stableStyle = { color: 'red', fontSize: 16 };

const ExpensiveChild = React.memo(function ExpensiveChild({ style }) { /* ... */ });
const AnotherChild = React.memo(function AnotherChild({ onAction }) { /* ... */ });

function ParentComponent() {
  const [count, setCount] = useState(0);

  // useCallback with an empty dep array returns the same function
  // instance on every render.
  const handleAction = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* Both props are now === their previous value, so memo's
          comparison passes and neither child re-renders. */}
      <ExpensiveChild style={stableStyle} />
      <AnotherChild onAction={handleAction} />
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Stable References Do Nothing Without memo">
        This is the most commonly mis-taught point in React performance work,
        so it is worth stating plainly. If <code>ExpensiveChild</code> were a
        plain component, <strong>both versions above would render exactly the
        same number of times</strong>. A parent re-render re-renders all of its
        children by default; React does not compare props to decide. Prop
        identity only becomes load-bearing once a child is wrapped in{' '}
        <code>React.memo</code>, because <code>memo</code> is the thing that
        opts into a props comparison in the first place.
        <br />
        <br />
        So the rule is not &ldquo;always hoist objects and wrap callbacks.&rdquo;
        It is: <code>memo</code> plus stable props is a pair, and neither half
        works alone. Reaching for <code>useCallback</code> around an unmemoized
        child is pure overhead — you pay for the dependency array and get no
        skipped renders. The <strong>Performance Mistakes</strong> lesson
        develops this properly.
      </InfoBox>

      <h3>Maintainability Impact</h3>
      <p>
        Anti-patterns make code harder to change. When components are tightly
        coupled, a small requirement change can ripple through dozens of files.
        When logic is duplicated, bug fixes need to be applied in multiple
        places — and inevitably one gets missed.
      </p>

      <InfoBox variant="info" title="Maintainability Heuristic">
        Ask yourself: &ldquo;If a new developer joined the team tomorrow, how
        long would it take them to understand this component?&rdquo; If the
        answer is more than a few minutes, the component is likely too complex
        or relies on hidden assumptions.
      </InfoBox>

      <h3>Bug Surface Area</h3>
      <p>
        Anti-patterns increase the number of places where bugs can hide.
        Derived state that falls out of sync, effects that fire at the wrong
        time, and stale closures are all symptoms of common anti-patterns.
      </p>

      <h2>How to Spot Anti-Patterns in Code Reviews</h2>
      <p>
        Code reviews are the first line of defense against anti-patterns
        entering a codebase. Here are concrete signals to watch for.
      </p>

      <InfoBox variant="tip" title="Code Review Checklist for Anti-Patterns">
        <ul>
          <li>
            <strong>Prop drilling:</strong> Are props passed through 3+ levels
            without being used by intermediate components?
          </li>
          <li>
            <strong>God components:</strong> Is a single component doing data
            fetching, business logic, and rendering all at once?
          </li>
          <li>
            <strong>Derived state:</strong> Is <code>useState</code> used for
            values that could be computed from existing state or props?
          </li>
          <li>
            <strong>Effect chains:</strong> Does one <code>useEffect</code>
            set state that triggers another <code>useEffect</code>?
          </li>
          <li>
            <strong>Inline object/function literals:</strong> Are objects or
            functions created inside JSX that could be hoisted or memoized?
          </li>
        </ul>
      </InfoBox>

      <CodeBlock language="jsx" title="Derived State Anti-Pattern">
        {`function PriceDisplay({ items }) {
  // Anti-pattern: storing derived data in state
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const sum = items.reduce((acc, item) => acc + item.price, 0);
    setTotal(sum);
  }, [items]);

  return <span>Total: \${total}</span>;
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Derived State Done Right">
        {`function PriceDisplay({ items }) {
  // Clean: compute during render — no state, no effect
  const total = items.reduce((acc, item) => acc + item.price, 0);

  return <span>Total: \${total}</span>;
}`}
      </CodeBlock>

      <p>
        The second version is shorter, but the reason to prefer it is
        correctness rather than length. In the first, <code>total</code> is a
        copy of something already known, and a copy can disagree with its
        source. On the very first render it is <code>0</code> while{' '}
        <code>items</code> already has prices in it — the effect has not run
        yet — so the user sees <code>Total: $0</code> flash before the real
        number. Every later change to <code>items</code> renders the stale total
        once, then renders again after <code>setTotal</code>. Two render passes
        to show one number.
      </p>
      <p>
        Computing during render cannot go out of sync, because there is nothing
        to sync: <code>total</code> is derived fresh from the current{' '}
        <code>items</code> every time. The general rule — <strong>if a value can
        be calculated from props or state you already have, calculate it; do not
        store it</strong> — is the subject of{' '}
        <a href="/react-antipatterns/state">State Anti-Patterns</a>. If the
        calculation is genuinely expensive, <code>useMemo</code> is the answer,
        not <code>useState</code> plus <code>useEffect</code>.
      </p>

      <h2>Categories of Anti-Patterns</h2>
      <p>
        Throughout this section, we will explore anti-patterns organized into
        clear categories. Each lesson dives deep into a specific area with
        examples, explanations, and refactored alternatives.
      </p>

      <FlowChart
        title="Anti-Pattern Categories Covered in This Section"
        chart={"graph TD\nA[React Anti-Patterns]-->B[State Management]\nA-->C[Component Design]\nA-->D[Effects & Lifecycle]\nA-->E[Performance]\nA-->F[Props & Data Flow]\nB-->B1[Derived State]\nB-->B2[Redundant State]\nC-->C1[God Components]\nC-->C2[Prop Drilling]\nD-->D1[Effect Chains]\nD-->D2[Missing Cleanup]\nE-->E1[Wasted Renders]\nE-->E2[Premature Optimization]\nF-->F1[Unstable References]\nF-->F2[Implicit Dependencies]"}
      />

      <InfoBox variant="note" title="How to Use This Section">
        Each lesson in this section follows a consistent structure: we present
        the anti-pattern, explain why it is problematic, show real-world code
        that exhibits the pattern, and then refactor it step by step into
        clean, idiomatic React. You will also find interactive challenges to
        test your understanding.
      </InfoBox>

      <h2>What&apos;s Next</h2>

      <InfoBox variant="success" title="Ready to Dive In?">
        Now that you understand what anti-patterns are, why they matter, and
        how to spot them, you are ready to explore each category in depth.
        Start with the next lesson on <strong>State Anti-Patterns</strong> to
        tackle one of the most common sources of bugs in React applications.
      </InfoBox>
    </LessonLayout>
  );
}
