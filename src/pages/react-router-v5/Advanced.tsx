import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced Patterns"
      sectionId="react-router-v5"
      lessonIndex={4}
      prev={{ path: '/react-router-v5/guards', label: 'Auth Guards & Protected Routes' }}
      next={{ path: '/react-router-v5/testing', label: 'Testing Routes' }}
    >
      <p>
        The fundamentals get you a working app. These five patterns are the
        ones that actually show up in production v5 codebases — most of them
        because v5 predates hooks, or because <code>&lt;Switch&gt;</code>{' '}
        works differently than you&apos;d expect if you learned routing on
        v6+. Every example on this page was run against real{' '}
        <code>react-router-dom@5.3.4</code> to confirm the behavior described.
      </p>

      <FlowChart
        title="Which Advanced Pattern Do I Need?"
        chart={"graph TD\nA[What's the problem?] --> B{Component can't use hooks?}\nB -->|Class component| C[withRouter]\nB -->|No| D{Need match info without a Route?}\nD -->|Yes| E[useRouteMatch path]\nD -->|No| F{Route renders the wrong component?}\nF -->|Yes| G[Check Switch declaration order]\nF -->|No| H{Need ?sort=price style params?}\nH -->|Yes| I[useLocation search + URLSearchParams]\nH -->|No| J{Need to block navigation away?}\nJ -->|Yes| K[Prompt component]\nstyle C fill:#1a2744\nstyle E fill:#1a2744\nstyle G fill:#3d2f14\nstyle I fill:#2a1f44\nstyle K fill:#3b1a1a"}
      />

      <h2>withRouter — Injecting Router Props Into Any Component</h2>
      <p>
        Hooks (<code>useHistory</code>, <code>useLocation</code>,{' '}
        <code>useParams</code>) cover function components. They don&apos;t
        exist for class components, and v5-era codebases are full of those.{' '}
        <code>withRouter</code> is the answer: it&apos;s a higher-order
        component that wraps anything — class or function — and injects{' '}
        <code>history</code>, <code>location</code>, and <code>match</code>{' '}
        as props, using whichever <code>&lt;Router&gt;</code> is nearest up
        the tree.
      </p>

      <CodeBlock language="jsx" title="withRouter on a Class Component">
{`import { withRouter } from 'react-router-dom';

class Breadcrumb extends React.Component {
  goHome = () => {
    // history is a prop now, not something you constructed yourself
    this.props.history.push('/');
  };

  render() {
    const { location, match } = this.props;
    return (
      <div className="breadcrumb">
        <button onClick={this.goHome}>Home</button>
        <span>{location.pathname}</span>
        {match.params.id && <span>#{match.params.id}</span>}
      </div>
    );
  }
}

export default withRouter(Breadcrumb);`}
      </CodeBlock>

      <p>
        This matters most for components that sit <em>outside</em> the
        render tree of any <code>&lt;Route&gt;</code> — a header rendered
        once at the app root, a component wired up through Redux&apos;s{' '}
        <code>connect()</code>, or any shared component that needs to read
        the current URL without being told about it via props.
      </p>

      <CodeBlock language="jsx" title="withRouter + connect() — Order Matters">
{`// ✅ withRouter OUTSIDE connect — the injected router props
// (history, location, match) are visible to mapStateToProps
export default withRouter(connect(mapStateToProps)(Breadcrumb));

// ⚠️ connect OUTSIDE withRouter still works for rendering, but
// mapStateToProps never sees location/match — only the wrapped
// component does. Usually not what you want if mapStateToProps
// needs to read the URL (e.g. to select a record by route param).
export default connect(mapStateToProps)(withRouter(Breadcrumb));`}
      </CodeBlock>

      <InfoBox variant="tip" title="withRouter vs Hooks — Which One?">
        <p>
          Default to hooks in function components — they&apos;re simpler and
          don&apos;t add a wrapper layer to the component tree. Reach for{' '}
          <code>withRouter</code> only when the component is a class, or when
          you&apos;re composing with another HOC (like <code>connect()</code>
          ) and need router props threaded through that same composition.
        </p>
        <p style={{ marginBottom: 0 }}>
          Verified prop shape: <code>withRouter(Component)</code> injects{' '}
          <code>history</code>, <code>location</code>, and <code>match</code>
          . Under <code>&lt;StaticRouter&gt;</code> (server rendering) it
          also injects <code>staticContext</code>. It also copies a{' '}
          <code>WrappedComponent</code> static property pointing at the
          original, unwrapped component — useful for testing, covered in the
          next lesson.
        </p>
      </InfoBox>

      <h2>useRouteMatch — Matching Without Rendering a Route</h2>
      <p>
        Sometimes you need to know whether the current URL matches a
        pattern <em>without</em> declaring a whole{' '}
        <code>&lt;Route&gt;</code> for it — highlighting a nav link for a
        section, or reading route params inside a component that a parent{' '}
        <code>&lt;Route&gt;</code> already rendered. <code>useRouteMatch</code>{' '}
        has two forms.
      </p>

      <CodeBlock language="jsx" title="Implicit Form — Reads the Closest Enclosing Route">
{`// Called with no arguments INSIDE a component a <Route> already rendered.
// Returns that Route's match — same object you'd get from a render-prop.
import { useRouteMatch } from 'react-router-dom';

function ProjectDetail() {
  // If the enclosing <Route path="/projects/:id"> matched "/projects/42",
  // this is { path: '/projects/:id', url: '/projects/42', isExact: true,
  //           params: { id: '42' } }
  const match = useRouteMatch();

  return (
    <nav>
      <Link to={\`\${match.url}/overview\`}>Overview</Link>
      <Link to={\`\${match.url}/settings\`}>Settings</Link>
    </nav>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Explicit Form — Test Any Path, No Route Required">
{`// Called WITH a path — tests it against the current URL and returns
// the match object, or null. No <Route> needs to exist anywhere.
import { useRouteMatch } from 'react-router-dom';

function SectionNavLink({ to, children }) {
  const match = useRouteMatch(to);
  // Verified: at "/admin/users", useRouteMatch('/admin') returns a
  // match with isExact: false (it's a prefix, not a full match).
  // At "/settings", the same call returns null.
  return (
    <Link to={to} className={match ? 'active' : ''}>
      {children}
    </Link>
  );
}`}
      </CodeBlock>

      <InfoBox variant="info" title="v5 vs v6+: useRouteMatch → useMatch">
        This is the v5 equivalent of v6+&apos;s <code>useMatch</code> — but
        the APIs aren&apos;t identical (different return shape, and{' '}
        <code>useMatch</code> only takes an explicit pattern, no implicit
        form). See the Migration Guide in the v6/v7 section for the full
        before/after table if you&apos;re porting code between the two.
      </InfoBox>

      <h2>The Switch Declaration-Order Gotcha</h2>
      <p>
        This is the single most common source of &ldquo;why did the wrong
        route render&rdquo; bugs in v5. <code>&lt;Switch&gt;</code> scans its
        children <strong>top to bottom</strong> and renders the{' '}
        <strong>first</strong> <code>&lt;Route&gt;</code> whose path
        matches — full stop. There is no ranking, no
        &ldquo;most specific wins&rdquo; logic. That arrived in v6&apos;s{' '}
        <code>&lt;Routes&gt;</code>. In v5, <em>you</em> are the ranking
        algorithm.
      </p>

      <CodeBlock language="jsx" title="Broken — the general route is declared first">
{`<Switch>
  <Route path="/users/:id" render={({ match }) => (
    <UserDetail id={match.params.id} />
  )} />
  <Route path="/users/new" component={NewUserForm} />
</Switch>

// Visit /users/new — Switch checks routes in order. "/users/:id"
// is checked FIRST, and ":id" is happy to match the literal string
// "new". UserDetail renders with id="new". NewUserForm never runs.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Confirmed Against Real react-router-dom@5.3.4">
        Rendered both orderings with <code>StaticRouter</code> at{' '}
        <code>/users/new</code>. Broken order:{' '}
        <code>&quot;BUG: matched :id route with id=new&quot;</code>. After
        swapping the two routes: <code>&quot;FIXED: rendered the new-user
        form&quot;</code>. Nothing subtle about it — this is exactly as
        literal as it sounds.
      </InfoBox>

      <CodeBlock language="jsx" title="Fixed — the specific route goes first">
{`<Switch>
  <Route path="/users/new" component={NewUserForm} />
  <Route path="/users/:id" render={({ match }) => (
    <UserDetail id={match.params.id} />
  )} />
</Switch>

// Now /users/new matches the first Route before the dynamic
// ":id" segment ever gets a chance to swallow it.`}
      </CodeBlock>

      <InfoBox variant="warning" title="This Is Not the Same Bug as a Missing exact">
        <p>
          Don&apos;t confuse this with the classic &ldquo;<code>/</code>{' '}
          matches everything&rdquo; problem (covered in the Migration Guide)
          — that one is about a <em>single</em> route over-matching because
          it lacks <code>exact</code>. This one is about{' '}
          <em>two</em> routes that both legitimately match the URL, where
          the wrong one wins purely because of list order.
        </p>
        <p style={{ marginBottom: 0 }}>
          The fix for both is related, though: order your{' '}
          <code>&lt;Switch&gt;</code> children from most specific to least
          specific, and put any catch-all <code>404</code> route last.
        </p>
      </InfoBox>

      <h2>Manual Query String Parsing</h2>
      <p>
        There is no <code>useSearchParams()</code> in v5 — that hook is a
        v6+ addition. In v5, the query string is just a raw string on{' '}
        <code>location.search</code> (e.g. <code>&quot;?sort=price&amp;
        page=2&quot;</code>), and you parse it yourself.
      </p>

      <CodeBlock language="jsx" title="useLocation().search + URLSearchParams">
{`import { useLocation } from 'react-router-dom';

function ProductList() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const sort = params.get('sort') ?? 'name';
  const page = Number(params.get('page') ?? '1');

  // Verified at "/products?sort=price&page=2":
  // location.search === "?sort=price&page=2"
  // params.get('sort') === "price", params.get('page') === "2"

  return <ProductGrid sort={sort} page={page} />;
}`}
      </CodeBlock>

      <p>
        <code>URLSearchParams</code> is a native browser API, so it needs no
        install — but it&apos;s bare-bones. It has no first-class support
        for arrays (<code>?tag=a&amp;tag=b</code> requires{' '}
        <code>getAll('tag')</code>) or nested objects, and it stringifies
        everything as strings. This is why many v5 codebases reach for the{' '}
        <code>query-string</code> npm package instead, which adds array
        handling, type coercion helpers, and a friendlier{' '}
        <code>parse</code>/<code>stringify</code> pair.
      </p>

      <CodeBlock language="jsx" title="Same Thing With the query-string Package">
{`import queryString from 'query-string';
import { useLocation } from 'react-router-dom';

function ProductList() {
  const location = useLocation();
  const { sort = 'name', page = '1', tag } = queryString.parse(location.search);

  // tag is an array automatically if the URL has repeated ?tag= params
  return <ProductGrid sort={sort} page={Number(page)} tags={[].concat(tag ?? [])} />;
}`}
      </CodeBlock>

      <InfoBox variant="info" title="v5 vs v6+: Manual Parsing → useSearchParams">
        v6+&apos;s <code>useSearchParams()</code> returns a{' '}
        <code>URLSearchParams</code> instance paired with a setter, and
        updates the URL for you. It&apos;s directly built on the same{' '}
        <code>URLSearchParams</code> API shown above — v6 didn&apos;t
        replace the primitive, it just wrapped it in a hook and wired it to
        navigation.
      </InfoBox>

      <h2>Prompt — Blocking Navigation for Unsaved Changes</h2>
      <p>
        <code>&lt;Prompt&gt;</code> stops in-app navigation (and, with a bit
        more wiring, tab close) when a condition is true — the textbook use
        case is warning a user who has unsaved form changes before they
        navigate away and lose them.
      </p>

      <CodeBlock language="jsx" title="Prompt on a Dirty Form">
{`import { Prompt } from 'react-router-dom';

function EditProfileForm() {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <form onChange={() => setIsDirty(true)} onSubmit={handleSave}>
      <Prompt
        when={isDirty}
        message="You have unsaved changes. Leave without saving?"
      />
      {/* ...fields... */}
    </form>
  );
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="Per-Destination Messages With a Function">
{`// message can also be a function of (location, action) -> string | true.
// Returning true allows the navigation through with no prompt at all —
// useful for letting the user leave TO the login page unprompted, say,
// while still blocking every other destination.
<Prompt
  when={isDirty}
  message={(location, action) =>
    location.pathname === '/login'
      ? true
      : \`Leave for \${location.pathname}? Unsaved changes will be lost.\`
  }
/>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Prompt Only Covers In-App Navigation">
        By default <code>Prompt</code>&apos;s dialog is the browser&apos;s
        native <code>window.confirm</code>, and it only intercepts
        navigation performed through the router (link clicks, back/forward,{' '}
        <code>history.push</code>). Closing the tab or typing a new URL in
        the address bar is a separate browser event — handle that with a{' '}
        <code>beforeunload</code> listener alongside <code>Prompt</code>, not
        instead of it.
      </InfoBox>

      <InfoBox variant="note" title="Prompt's Odd History in v6+">
        <p>
          Worth knowing if you move between codebases: <code>&lt;Prompt&gt;</code>{' '}
          was <strong>removed</strong> when v6 shipped — it didn&apos;t survive the
          rewrite to the new matching engine, and for a long stretch v6 simply had
          no built-in way to block navigation at all.
        </p>
        <p style={{ marginBottom: 0 }}>
          It came back later, split into two pieces, once the data-router APIs
          landed: <code>useBlocker</code> (a hook that gives you a blocker object
          and full control over your own confirmation UI — no native{' '}
          <code>window.confirm</code>) and <code>unstable_usePrompt</code>{' '}
          (closer to v5&apos;s <code>window.confirm</code>-based behavior, but
          still marked unstable). If you&apos;re reading a v6/v7 tutorial and
          can&apos;t find <code>Prompt</code>, this is why.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"You have <Route path=\"/reports/:id\" /> and <Route path=\"/reports/summary\" /> inside a <Switch>, in that order. Visiting /reports/summary renders the wrong thing. Why?"}
        options={[
          "Switch requires the exact prop on every Route in v5",
          "The :id route is checked first and matches \"summary\" as the id value",
          "React Router can't have two routes under the same parent path",
          "useRouteMatch must be called before the Switch renders",
        ]}
        correctIndex={1}
        explanation={"Switch scans top to bottom and renders the first match — there's no specificity ranking in v5. Since \":id\" matches any single path segment, it happily matches \"summary\" before the router ever reaches the more specific /reports/summary route below it. The fix: declare /reports/summary first."}
        language="jsx"
      />

      <h2>Quick Reference: When to Use What</h2>
      <CodeBlock language="jsx" title="Pattern Decision Guide">
{`/*
Need                                → Pattern
─────────────────────────────────────────────────────────
Router access in a class component  → withRouter
Router access in a function comp.   → useHistory / useLocation / useParams
Match info, no <Route> declared     → useRouteMatch(path)
Match info, inside a matched Route  → useRouteMatch() (no args)
Route renders the wrong component   → Reorder <Switch> children: specific first
Read ?sort=price style params       → useLocation().search + URLSearchParams
Array/nested query params           → query-string package
Block navigation on unsaved changes → <Prompt when={dirty} message="..." />
Custom confirmation UI (not window.confirm) → wrap navigation triggers yourself,
                                       check isDirty before calling history.push
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Next: Testing All of This">
        You now have the v5-specific toolkit — the pieces that either don&apos;t
        exist in v6+ (<code>withRouter</code>, <code>Prompt</code>) or work
        differently enough to trip you up (<code>Switch</code> ordering,{' '}
        <code>useRouteMatch</code>). Next up: how to actually test routes,
        guards, and these patterns with <code>MemoryRouter</code> and React
        Testing Library.
      </InfoBox>
    </LessonLayout>
  );
}
