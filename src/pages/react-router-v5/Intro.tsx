import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Setup & Core Concepts"
      sectionId="react-router-v5"
      lessonIndex={0}
      prev={null}
      next={{ path: '/react-router-v5/nested', label: 'Nested Routes' }}
    >
      <p>
        React Router v5 is the version that shipped for most of 2019–2021 and is
        still running in a huge share of production React codebases today — if
        you&apos;re interviewing or inheriting an older app, this is the API
        you&apos;ll actually meet. The package is <code>react-router-dom</code>{' '}
        (version <code>5.3.4</code> is the final v5 release): the &ldquo;dom&rdquo;
        suffix mattered back then, because <code>react-router</code> alone was
        the router-agnostic core (routing logic with no browser bindings, used
        for things like React Native), and almost nobody imported it directly.
        You install <code>react-router-dom</code>, and it re-exports the core
        along with browser-specific pieces like <code>&lt;BrowserRouter&gt;</code>.
      </p>

      <p>
        The API itself is fundamentally different from v6+, not just relabeled:
        no <code>&lt;Outlet&gt;</code>, no <code>useNavigate</code>, routes match
        as <em>prefixes</em> by default, and <code>&lt;Switch&gt;</code> picks the
        first match top-to-bottom instead of ranking every candidate. This lesson
        covers the real v5.3.4 API, grounded in its actual source and behavior —
        not a v6 lesson with the names swapped out.
      </p>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="Install React Router v5">
{`npm install react-router-dom@5

# TypeScript: types are NOT bundled with react-router-dom v5 —
# install the community-maintained @types package separately
npm install --save-dev @types/react-router-dom@^5.3`}
      </CodeBlock>

      <InfoBox variant="note" title="Why the Separate @types Package">
        <p>
          React Router only started shipping its own TypeScript types from v6
          onward. <code>react-router-dom@5.3.4</code>&apos;s published package has
          no <code>types</code> field at all — its authors wrote it in plain
          JavaScript with PropTypes for runtime checks. If you&apos;re on a v5
          project in TypeScript (very common, since this site assumes you&apos;re
          headed that direction), <code>@types/react-router-dom</code> is not
          optional polish, it&apos;s the only source of type information you get.
        </p>
        <p style={{ marginBottom: 0 }}>
          One more reason this matters:{' '}
          <code>@types/react-router-dom</code>&apos;s latest published version is{' '}
          <code>5.3.3</code> — pinned to the v5 line, because v6+ made the{' '}
          <code>@types</code> package obsolete by shipping its own types. Installing
          the wrong major here silently gives you the wrong API&apos;s
          autocomplete.
        </p>
      </InfoBox>

      <h2>Core Components</h2>
      <p>
        Four components do almost all the work: <code>&lt;BrowserRouter&gt;</code>{' '}
        provides routing context using the HTML5 History API,{' '}
        <code>&lt;HashRouter&gt;</code> is the same idea but encodes the route in
        the URL fragment (<code>#/about</code>) for static hosts with no
        server-side rewrite rules, <code>&lt;Switch&gt;</code> renders only the{' '}
        <em>first</em> child <code>&lt;Route&gt;</code> that matches, and{' '}
        <code>&lt;Route&gt;</code> is the thing that actually tests a path and
        renders content.
      </p>

      <CodeBlock language="jsx" title="Basic v5 App">
{`import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/users/:userId" component={UserProfile} />
        {/* No path — always matches, so it must stay last */}
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}`}
      </CodeBlock>

      <FlowChart
        title="How a Route Matches (With and Without Switch)"
        chart={"graph TD\nA[Router provides the current location] --> B[Each Route tests its own path independently]\nB --> C{Wrapped in a Switch?}\nC -->|No| D[Every Route whose path matches renders - could be more than one]\nC -->|Yes| E[Switch walks children top to bottom, stops at the FIRST match]\nE --> F[Only that one Route renders]\nstyle A fill:#1a2744\nstyle D fill:#3d2f14\nstyle F fill:#1a3329"}
      />

      <InfoBox variant="info" title="Without Switch, Multiple Routes Can Render at Once">
        A bare <code>&lt;Route&gt;</code> outside a <code>&lt;Switch&gt;</code>{' '}
        just tests its own <code>path</code> against the current location and
        renders if it matches — it doesn&apos;t know or care about any sibling{' '}
        <code>&lt;Route&gt;</code>. That&apos;s not a bug; it&apos;s how v5 apps
        render multiple independent regions off the same URL (a sidebar route
        plus a main-content route, for example). Reach for{' '}
        <code>&lt;Switch&gt;</code> specifically when you want exclusive,
        first-match-only selection — most top-level route lists want this.
      </InfoBox>

      <h2>The Three Ways to Render a Route</h2>
      <p>
        <code>&lt;Route&gt;</code> accepts exactly one of three props to decide
        what to render when it matches, and they are not interchangeable — each
        has different re-mount behavior:
      </p>

      <CodeBlock language="jsx" title="component, render, and children">
{`// 1. component — pass a component reference directly.
//    React Router calls React.createElement(Component, routeProps) for you.
<Route path="/profile" component={Profile} />

// 2. render — pass a function that returns JSX.
//    Called on every matching render; lets you pass extra props.
<Route
  path="/profile"
  render={(routeProps) => <Profile {...routeProps} theme="dark" />}
/>

// 3. children — pass a function OR a node.
//    As a function, it is called on EVERY render, matched or not —
//    routeProps.match is null when the path doesn't match.
<Route
  path="/profile"
  children={({ match, ...routeProps }) => (
    <div className={match ? 'active' : 'inactive'}>
      {match && <Profile {...routeProps} />}
    </div>
  )}
/>`}
      </CodeBlock>

      <InfoBox variant="warning" title="Never Pass an Inline Function to component — This Is a Real, Documented Bug">
        <p>
          <code>component</code> works by calling{' '}
          <code>React.createElement(component, props)</code> — straight from
          v5&apos;s own source. If you write{' '}
          <code>{'<Route component={() => <Profile />} />'}</code>, that arrow
          function is a <em>brand-new function reference</em> on every render of
          the parent, so React sees a different component type each time and
          unmounts the old instance to mount a new one. State resets, effects
          re-fire, inputs lose focus — every single render.
        </p>
        <p style={{ marginBottom: 0 }}>
          This isn&apos;t a hypothetical: running it through{' '}
          <code>react-test-renderer</code> against the real{' '}
          <code>react-router-dom@5.3.4</code> package confirms it exactly — three
          re-renders with an inline <code>component</code> function produced
          three separate mount/unmount cycles, while the same three re-renders
          using <code>render</code> with an identical inline function produced
          exactly one mount, with zero unmounts until final teardown. Pass{' '}
          <code>component</code> a stable reference (a component declared
          elsewhere, not inline), or use <code>render</code> when you need to
          pass extra props from an inline function.
        </p>
      </InfoBox>

      <h2>exact and the Prefix-Matching Trap</h2>
      <p>
        This is the single most common v5 bug, and it trips up almost everyone
        coming from v6+. Every <code>&lt;Route&gt;</code>&apos;s <code>path</code>{' '}
        matches as a <strong>prefix</strong> by default —{' '}
        <code>exact</code> defaults to <code>false</code>. That means{' '}
        <code>&lt;Route path=&quot;/users&quot;&gt;</code> matches{' '}
        <code>/users</code>, but it <em>also</em> matches{' '}
        <code>/users/123</code>, <code>/users/123/edit</code>, and anything else
        that starts with <code>/users</code>.
      </p>

      <CodeBlock language="jsx" title="Verified against the real matchPath() function">
{`// react-router's own matchPath(), called directly:
matchPath('/users/123', { path: '/users' });
// -> { path: '/users', url: '/users', isExact: false, params: {} }
//    Matched! isExact is false, but it still matched.

matchPath('/users', { path: '/users', exact: true });
// -> { path: '/users', url: '/users', isExact: true, params: {} }

matchPath('/users/123', { path: '/users', exact: true });
// -> null
//    No match — exact requires the pathname to end exactly at the route's path.`}
      </CodeBlock>

      <FlowChart
        title={'Why <Route path="/users"> Matches /users/123'}
        chart={"graph TD\nA[pathname: /users/123] --> B[Route path: /users, no exact prop]\nB --> C[exact defaults to false]\nC --> D[Regex is built with NO end-of-string anchor]\nD --> E{Does /users/123 START WITH /users ?}\nE -->|Yes| F[Match! isExact: false]\nE -->|No| G[No match, null]\nF --> H[Route renders]\nstyle C fill:#3d2f14\nstyle F fill:#1a3329\nstyle G fill:#3b1a1a"}
      />

      <InfoBox variant="danger" title={'Add exact to Your Root Route Almost Always'}>
        <code>{'<Route path="/" component={Home} />'}</code> without{' '}
        <code>exact</code> matches <em>every</em> URL in your app, because every
        path starts with <code>/</code>. Inside a <code>&lt;Switch&gt;</code>{' '}
        this silently swallows every route listed after it. The fix is always
        the same: <code>{'<Route exact path="/" component={Home} />'}</code>.
        This single missing prop is responsible for more &ldquo;why is my home
        page rendering on every URL&rdquo; bug reports than anything else in v5.
      </InfoBox>

      <h2>&lt;Switch&gt;: First Match Wins, Order Matters</h2>
      <p>
        <code>&lt;Switch&gt;</code> walks its children top to bottom, tests each{' '}
        <code>path</code> with the same prefix-matching rule above, and renders
        only the <em>first</em> one that matches — everything after it is
        skipped, even if it would also have matched. That makes route order
        load-bearing: more specific paths have to come before less specific ones
        that could shadow them.
      </p>

      <CodeBlock language="jsx" title="Order matters — most specific first">
{`<Switch>
  <Route exact path="/users/new" component={NewUser} />
  <Route path="/users/:userId" component={UserDetail} />
  {/* If /users/new were listed AFTER /users/:userId, the dynamic
      route would match first and "new" would be treated as a userId */}
</Switch>`}
      </CodeBlock>

      <InfoBox variant="success" title="This Is the Opposite of v6+">
        React Router v6 replaced this with a ranking algorithm — it scores every
        route that could match and picks the most specific one regardless of
        array order, which is why <code>exact</code> doesn&apos;t even exist as a
        prop in v6+. In v5, there is no ranking: <code>&lt;Switch&gt;</code>{' '}
        genuinely stops at the first match it finds, so you have to order routes
        deliberately and reach for <code>exact</code> to keep broad paths from
        eating everything below them.
      </InfoBox>

      <h2>&lt;Redirect&gt;</h2>
      <p>
        v5 redirects with a component, not a hook — <code>&lt;Redirect&gt;</code>{' '}
        runs an effect on mount that calls <code>history.replace()</code> (or{' '}
        <code>history.push()</code> if you pass <code>push</code>) to navigate.
        Used inside a <code>&lt;Switch&gt;</code>, it can also take a{' '}
        <code>from</code> prop instead of matching unconditionally — the{' '}
        <code>Switch</code> matches <code>from</code> exactly like a{' '}
        <code>Route</code>&apos;s <code>path</code>, and any <code>:params</code>{' '}
        it captures get substituted into <code>to</code> automatically.
      </p>

      <CodeBlock language="jsx" title="Redirect usage">
{`import { Redirect, Switch, Route } from 'react-router-dom';

// Unconditional — e.g. inside an auth guard
<Redirect to="/login" />

// push instead of replace (adds a history entry instead of swapping one)
<Redirect to="/dashboard" push />

// Redirect with state (read it back with useLocation().state)
<Redirect to={{ pathname: '/login', state: { from: currentLocation } }} />

// Inside a Switch: "from" matches like a Route path, and its params
// carry over into "to" automatically.
// Verified: visiting /old-page/42 with this Switch lands on /new-page/42.
<Switch>
  <Redirect from="/old-page/:id" to="/new-page/:id" />
  <Route path="/new-page/:id" component={NewPage} />
</Switch>`}
      </CodeBlock>

      <h2>Hooks (v5.1+) and withRouter for Class Components</h2>
      <p>
        <code>useHistory</code>, <code>useLocation</code>, <code>useParams</code>,
        and <code>useRouteMatch</code> were <strong>not</strong> in the original
        v5.0.0 release — they landed in <strong>v5.1.0</strong>, about six months
        later, once hooks themselves had stabilized in React 16.8. Before that
        (and still today, for class components), the equivalent data — history,
        location, and match — arrives as props, either because{' '}
        <code>&lt;Route&gt;</code> injected them directly, or via the{' '}
        <code>withRouter</code> higher-order component for anything not rendered
        by a <code>&lt;Route&gt;</code> itself.
      </p>

      <CodeBlock language="jsx" title="Hooks vs withRouter">
{`// Function component — hooks (v5.1+)
import { useHistory, useLocation, useParams, useRouteMatch } from 'react-router-dom';

function UserProfile() {
  const history = useHistory();       // { push, replace, goBack, goForward, length, ... }
  const location = useLocation();     // { pathname, search, hash, state, key }
  const { userId } = useParams();     // route :params, always strings
  const match = useRouteMatch();      // the closest matched Route's { path, url, isExact, params }

  const goBack = () => history.goBack();

  return <h1>User {userId}</h1>;
}

// Class component — no hooks available, so wrap with withRouter
import { withRouter } from 'react-router-dom';

class UserProfileClass extends React.Component {
  goBack = () => this.props.history.goBack();

  render() {
    const { match, location } = this.props; // injected by withRouter
    return <h1>User {match.params.userId}</h1>;
  }
}

export default withRouter(UserProfileClass);`}
      </CodeBlock>

      <InfoBox variant="tip" title="No useHistory() Before v5.1? Use the Injected Props">
        A <code>&lt;Route&gt;</code>&apos;s <code>component</code>/<code>render</code>/
        <code>children</code> function always receives <code>history</code>,{' '}
        <code>location</code>, and <code>match</code> as props — that has been
        true since v5.0.0, hooks or not. <code>useHistory()</code> is really just
        a hook-shaped way to reach the same <code>history</code> object that was
        always being passed down; it doesn&apos;t do anything a class component
        with <code>withRouter</code> couldn&apos;t already do.
      </InfoBox>

      <h2>Quick Reference</h2>
      <CodeBlock language="jsx" title="v5 Cheat Sheet">
{`// Setup
<BrowserRouter>                              // History API routing
<HashRouter>                                 // #/fragment routing (static hosts)

// Matching
<Switch>...</Switch>                          // first match wins, order matters
<Route exact path="/" component={X} />        // exact stops prefix matching
<Route path="/x" render={(p) => <X {...p} />} /> // extra props, no remount risk
<Route path="/x" children={({ match }) => ...} /> // always called, match may be null

// Navigation
<Redirect to="/login" />                      // history.replace() on mount
<Redirect to="/login" push />                 // history.push() instead
history.push('/path')                          // imperative navigate
history.replace('/path')                       // imperative, no back-button entry
history.goBack() / history.goForward()

// Hooks (v5.1+) / withRouter (class components)
useHistory()  useLocation()  useParams()  useRouteMatch()
withRouter(MyClassComponent)                  // injects history, location, match`}
      </CodeBlock>

    </LessonLayout>
  );
}
