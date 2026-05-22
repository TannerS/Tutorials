import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
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
        chart={"graph LR\nA[Bad Practices]-->B[Anti-Patterns]\nB-->C[Code Smells]\nC-->D[Acceptable Code]\nD-->E[Good Practices]\nE-->F[Idiomatic React]\nstyle A fill:#e74c3c,color:#fff\nstyle B fill:#e67e22,color:#fff\nstyle C fill:#f1c40f,color:#000\nstyle D fill:#95a5a6,color:#fff\nstyle E fill:#2ecc71,color:#fff\nstyle F fill:#1abc9c,color:#fff"}
      />

      <h2>Why Do Anti-Patterns Emerge?</h2>
      <p>
        Anti-patterns rarely come from malice. They creep into codebases for
        entirely human reasons. Recognizing these root causes helps teams
        address the problem systemically rather than blaming individuals.
      </p>

      <h3>1. Copy-Paste from Tutorials</h3>
      <p>
        Tutorials often simplify for the sake of teaching a single concept.
        When developers copy tutorial code into production without adapting it,
        shortcuts that were fine for a demo become liabilities at scale.
      </p>

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

      <CodeBlock language="jsx" title="Production-Ready Alternative">
        {`// Extract data-fetching into a reusable hook
function useUser(userId) {
  return useQuery(['user', userId], () =>
    fetch(\`/api/users/\${userId}\`).then(res => res.json())
  );
}

function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMsg error={error} />;
  return <div>{user.name}</div>;
}`}
      </CodeBlock>

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
        chart={"graph TD\nA[Anti-Pattern Introduced]-->B[Quick Feature Delivered]\nB-->C[More Code Built on Top]\nC-->D[Bug Discovered]\nD-->E[Hard to Diagnose]\nE-->F[Expensive Fix]\nF-->G[Technical Debt Grows]\nG-->C\nstyle A fill:#e74c3c,color:#fff\nstyle D fill:#e67e22,color:#fff\nstyle F fill:#f39c12,color:#fff\nstyle G fill:#c0392b,color:#fff"}
      />

      <h3>Performance Impact</h3>
      <p>
        Many anti-patterns cause unnecessary re-renders. A single misplaced
        inline function or object literal in a prop can cascade into hundreds
        of wasted render cycles across a component tree.
      </p>

      <CodeBlock language="jsx" title="Unnecessary Re-Renders (Anti-Pattern)">
        {`function ParentComponent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      {/* This object is recreated every render,
          causing ExpensiveChild to re-render too */}
      <ExpensiveChild style={{ color: 'red', fontSize: 16 }} />
      {/* This function is recreated every render */}
      <AnotherChild onAction={() => console.log('clicked')} />
    </div>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Stable References (Clean Pattern)">
        {`const stableStyle = { color: 'red', fontSize: 16 };

function ParentComponent() {
  const [count, setCount] = useState(0);

  const handleAction = useCallback(() => {
    console.log('clicked');
  }, []);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
      <ExpensiveChild style={stableStyle} />
      <AnotherChild onAction={handleAction} />
    </div>
  );
}`}
      </CodeBlock>

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

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"Which of the following is a React anti-pattern?"}
        options={[
          'Using useMemo to cache an expensive computation',
          'Storing a value in useState that could be computed from props',
          'Lifting state up to a common ancestor component',
          'Splitting a large component into smaller, focused components',
        ]}
        correctIndex={1}
        explanation="Storing a value in useState that could be computed from props is the 'derived state' anti-pattern. It introduces unnecessary state synchronization and is a common source of bugs. Instead, compute the value directly during render."
      />

      <InteractiveChallenge
        question={"Why do anti-patterns commonly appear in React codebases?"}
        options={[
          'React is inherently flawed',
          'Copy-paste from tutorials, deadline pressure, and incomplete mental models',
          'JavaScript does not support good design patterns',
          'React documentation encourages anti-patterns',
        ]}
        correctIndex={1}
        explanation="Anti-patterns emerge from very human causes: copying tutorial code without adapting it, rushing under deadline pressure, and working with an incomplete understanding of React's declarative rendering model. None of these reflect a flaw in React itself."
      />

      <InfoBox variant="success" title="Ready to Dive In?">
        Now that you understand what anti-patterns are, why they matter, and
        how to spot them, you are ready to explore each category in depth.
        Start with the next lesson on <strong>State Anti-Patterns</strong> to
        tackle one of the most common sources of bugs in React applications.
      </InfoBox>
    </LessonLayout>
  );
}
