import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Legacy() {
  return (
    <LessonLayout
      title="Reading Legacy v5 Codebases"
      sectionId="react-router-v5"
      lessonIndex={7}
      prev={{ path: '/react-router-v5/fullapp', label: 'Complete App Routing' }}
      next={{ path: '/react-router-v5/cheatsheet', label: '📋 React Router v5 Field Guide' }}
    >
      <p>
        You&apos;ve learned modern React Router — the config-based router, loaders,{' '}
        <code>useNavigate</code>, <code>&lt;Outlet /&gt;</code>. Now a job hands you
        a codebase that predates all of it, and you need to ship a change in it{' '}
        <em>this week</em>, not rewrite it. This lesson is a field checklist for
        that first day: how to recognize v5 on sight, the three bugs that show up
        constantly in real v5 code and don&apos;t exist at all in v6+, and an
        honest answer to &ldquo;can I just upgrade the router without a rewrite?&rdquo;
      </p>

      <FlowChart
        title="Spot the Version in 10 Seconds"
        chart={"graph TD\nA[Open an unfamiliar route file] --> B{Imports Switch, Redirect, or withRouter?}\nB -->|Yes| C[v5]\nB -->|No| D{Uses Outlet or createBrowserRouter?}\nD -->|No| E[Plain v6 JSX - Routes/Route element]\nD -->|Yes, with loader/action| F{Imports from react-router-dom?}\nF -->|Yes| G[v6.4 - v7 alpha era]\nF -->|No, from react-router only| H[v7 or v8]\nC --> I[\"Confirm: history.push, match.params, exact\"]\nstyle C fill:#3b1a1a\nstyle E fill:#2a1f44\nstyle G fill:#1a2744\nstyle H fill:#1a3329"}
      />

      <h2>Recognizing v5 on Sight</h2>
      <p>
        Every one of these is a hard tell — none of them exist in v6, v7, or v8.
        If you see even one, treat the whole file as v5 until proven otherwise.
      </p>

      <CodeBlock language="jsx" title="The v5 tells">
{`// The imports — Switch, Redirect, and withRouter are v5-only.
// (useHistory / useParams / useRouteMatch / useLocation also point to v5,
// but only because their v6+ replacements are named differently — see below.)
import {
  BrowserRouter, Switch, Route, Redirect,
  Link, NavLink, withRouter,
  useHistory, useParams, useRouteMatch, useLocation,
} from 'react-router-dom';

// The calls, inside components:
history.push('/dashboard');                 // not navigate('/dashboard')
history.replace('/login');                  // not navigate('/login', { replace: true })
match.params.id                             // route params via a match object
match.path / match.url                      // no v6+ equivalent at all — Outlet replaced this
<Route exact path="/" component={Home} />   // exact + component/render, not element
<Route path="/about" render={(p) => <About {...p} lang="en" />} />
<NavLink activeClassName="active">          // activeClassName/activeStyle removed in v6

// A codebase mixing class components AND hooks is itself a v5 tell:
// hooks landed in v5.1 (2019), but most v5 apps started life before that,
// so old class components reading this.props.match survive next to newer
// function components calling useParams(). v6+ has no props-injection at
// all, so a class component can only get match/history/location via
// withRouter — if you see withRouter, you are unambiguously in v5.`}
      </CodeBlock>

      <InfoBox variant="info" title="Same Hook Names, Different Router">
        <code>useParams</code> and <code>useLocation</code> exist in <em>both</em>{' '}
        v5 and v6+ with identical signatures — they aren&apos;t tells by
        themselves. <code>useHistory</code> and <code>useRouteMatch</code> are the
        real giveaways: v6 renamed <code>useHistory</code> to{' '}
        <code>useNavigate</code> (different return shape — a function, not an
        object) and replaced <code>useRouteMatch</code> with a different{' '}
        <code>useMatch</code>. Seeing the old names imported from{' '}
        <code>react-router-dom</code> means v5.
      </InfoBox>

      <h2>Footgun 1: A Missing exact Silently Eats the Whole App</h2>
      <p>
        This is the single most common v5 bug, and it&apos;s covered in full —
        with the actual matching behavior verified against{' '}
        <code>path-to-regexp</code> — in the previous{' '}
        <strong>Complete App Routing</strong> lesson. The short version:
        without <code>exact</code>, <code>path=&quot;/&quot;</code>{' '}
        matches <em>every</em> URL, because every pathname starts with{' '}
        <code>/</code>.
      </p>

      <CodeBlock language="jsx" title="The one-character bug">
{`// ❌ Home renders no matter what URL you're on — /about, /pricing, all of it
<Switch>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
</Switch>

// ✅ exact restricts "/" to matching only "/" itself
<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/about" component={About} />
</Switch>`}
      </CodeBlock>

      <h2>Footgun 2: Switch Ordering — Static Routes Lose to Param Routes</h2>
      <p>
        <code>&lt;Switch&gt;</code> has no ranking algorithm. It checks children
        top to bottom and renders the first match — and a param segment like{' '}
        <code>:id</code> matches <em>any</em> string, including one that looks
        like another route&apos;s literal path. <code>exact</code> does not save
        you here, because <code>/users/:id</code> is an exact match for{' '}
        <code>/users/new</code>.
      </p>

      <CodeBlock language="jsx" title="A very common real bug: /users/new vs /users/:id">
{`// ❌ The param route is declared first, so it wins every time
<Switch>
  <Route exact path="/users/:id" component={UserDetail} />
  <Route exact path="/users/new" component={NewUserForm} /> {/* unreachable */}
</Switch>

// Visiting /users/new renders UserDetail with match.params.id === "new",
// which then fires a real request to GET /api/users/new and either 404s
// or — worse — matches a user literally named/ID'd "new" in some seed data.

// ✅ Fix: declare the more specific / static route first
<Switch>
  <Route exact path="/users/new" component={NewUserForm} />
  <Route exact path="/users/:id" component={UserDetail} />
</Switch>`}
      </CodeBlock>

      <InfoBox variant="tip" title="The General Rule">
        Inside any <code>&lt;Switch&gt;</code>, order routes from{' '}
        <strong>most specific to least specific</strong>: static segments before
        dynamic <code>:params</code>, and <code>:params</code> before a bare
        wildcard. v6&apos;s <code>&lt;Routes&gt;</code> ranks automatically and
        removes this entire class of bug — it&apos;s one of the better arguments
        for actually migrating, not just reading around it.
      </InfoBox>

      <h2>Footgun 3: Stale Data From a Reused Component Instance</h2>
      <p>
        This one is commonly described as a &ldquo;stale closure&rdquo; bug, but
        the real mechanism is more specific — and it&apos;s directly documented
        behavior, not a bug in React itself. When the same component sits at the
        same position in the tree across a route change, React Router{' '}
        <strong>does not remount it</strong> — it re-renders the existing
        instance with new props. In a class component, that means{' '}
        <code>componentDidMount</code> — which only ever fires once — has already
        run by the time the URL, and <code>match.params</code>, change.
      </p>

      <CodeBlock language="jsx" title="❌ Fetches once, then goes stale on every param change">
{`class UserDetail extends React.Component {
  state = { user: null };

  componentDidMount() {
    // Runs ONCE, when this component instance is first created —
    // NOT every time match.params.id changes.
    fetch(\`/api/users/\${this.props.match.params.id}\`)
      .then((r) => r.json())
      .then((user) => this.setState({ user }));
  }

  render() {
    const { user } = this.state;
    return user ? <h2>{user.name}</h2> : <p>Loading...</p>;
  }
}

// Route: <Route path="/users/:id" component={UserDetail} />
// Click from /users/1 to /users/2 via a <Link> in a sidebar list:
// the URL changes, match.params.id changes, but the SAME UserDetail
// instance is reused — componentDidMount does not fire again, and
// user 1's data stays on screen under user 2's URL.`}
      </CodeBlock>

      <p>There are two correct fixes, and you&apos;ll see both in real codebases:</p>

      <CodeBlock language="jsx" title="✅ Fix A — also fetch in componentDidUpdate">
{`class UserDetail extends React.Component {
  state = { user: null };

  componentDidMount() {
    this.fetchUser(this.props.match.params.id);
  }

  componentDidUpdate(prevProps) {
    const prevId = prevProps.match.params.id;
    const nextId = this.props.match.params.id;
    if (prevId !== nextId) {
      this.fetchUser(nextId);
    }
  }

  fetchUser(id) {
    fetch(\`/api/users/\${id}\`)
      .then((r) => r.json())
      .then((user) => this.setState({ user }));
  }

  render() {
    const { user } = this.state;
    return user ? <h2>{user.name}</h2> : <p>Loading...</p>;
  }
}`}
      </CodeBlock>

      <CodeBlock language="jsx" title="✅ Fix B — force a remount with key (the officially documented shortcut)">
{`// From the same route config — give the rendered element a key tied
// to the param. A changed key forces React to unmount the old instance
// and mount a fresh one, so componentDidMount (or a function component's
// useEffect(fn, []) ) genuinely runs again with the new id.
<Route
  path="/users/:id"
  render={(props) => (
    <UserDetail key={props.match.params.id} {...props} />
  )}
/>`}
      </CodeBlock>

      <InfoBox variant="note" title="Function Components Get This For Free — Almost">
        A function component using <code>useEffect(() =&gt; {'{ ... }'}, [id])</code>{' '}
        with <code>id</code> from <code>useParams()</code> in its dependency array
        doesn&apos;t have this bug — the effect re-runs whenever <code>id</code>{' '}
        changes, same instance or not. The <code>key</code> trick above is
        mainly for legacy class components, or for the (surprisingly common)
        case where a function component&apos;s effect is missing the param from
        its dependency array — the exact same underlying bug, just with a
        different symptom.
      </InfoBox>

      <h2>Can You Just Upgrade the Router Without a Rewrite?</h2>
      <p>
        The honest answer, verified against React Router&apos;s own upgrade
        guide: <strong>mostly yes, it&apos;s all-or-nothing — but there is one
        real, officially sanctioned exception.</strong>
      </p>

      <InfoBox variant="warning" title="Why It's All-or-Nothing By Default">
        A v5 tree (<code>&lt;Switch&gt;</code> / <code>&lt;Route render&gt;</code>)
        and a v6+ tree (<code>&lt;Routes&gt;</code> / <code>&lt;Route element&gt;</code>)
        are different matching engines at runtime. You cannot mount both under
        the same <code>&lt;BrowserRouter&gt;</code> and have them cooperate — one{' '}
        <code>react-router-dom</code> major version is installed at a time. React
        Router&apos;s own v5-to-v6 upgrade guide says this plainly: absent extra
        tooling, &ldquo;we hope this guide will help you do the upgrade all at
        once.&rdquo;
      </InfoBox>

      <p>
        The exception is a real, currently-published package:{' '}
        <code>react-router-dom-v5-compat</code>. It&apos;s maintained by the
        React Router team specifically to run v5 and v6 <strong>in
        parallel</strong>, so you can migrate &ldquo;one component, one hook, and
        one route at a time&rdquo; instead of in a single cutover. The official
        docs recommend it specifically for apps with more than a handful of
        routes — which, realistically, describes most codebases you&apos;d
        actually be handed at a job.
      </p>

      <CodeBlock language="jsx" title="react-router-dom-v5-compat — incremental v5 → v6">
{`// npm install react-router-dom-v5-compat

import { CompatRouter, CompatRoute } from 'react-router-dom-v5-compat';

// Wrap the existing app in CompatRouter instead of BrowserRouter.
// Untouched v5 code (Switch, <Route component>) keeps working exactly
// as before, route by route, while you migrate.
function App() {
  return (
    <CompatRouter>
      <Switch>
        <Route exact path="/" component={Home} />
        {/* Migrate one route at a time to v6-style element/CompatRoute */}
        <CompatRoute path="/new-page" element={<NewPage />} />
      </Switch>
    </CompatRouter>
  );
}

// Once every route and hook uses v6 APIs, drop react-router-dom-v5-compat
// and swap CompatRouter for a real v6 BrowserRouter / createBrowserRouter.`}
      </CodeBlock>

      <InfoBox variant="tip" title="When the Compat Package Is Worth It — and When It Isn't">
        <ul>
          <li>
            It only bridges <strong>v5 to v6</strong>. There is no v5-to-v7 or
            v5-to-v8 compat shim — after landing on v6 you still take the same
            staged v6 → v7 → v8 path the v6/v7 section&apos;s Migration Guide
            covers, just without a parallel-router layer for those later hops
            (v6.4 → v7 was already designed to be mostly non-breaking).
          </li>
          <li>
            It&apos;s real, maintained infrastructure — not a hack — but it is a{' '}
            <em>second</em> router implementation shipping in your bundle until
            the migration finishes. Budget for that, and remove it as soon as
            the last <code>&lt;Switch&gt;</code> is gone.
          </li>
          <li>
            For a genuinely small app — a handful of routes — standing up the
            compat package is often more setup than just doing the swap over a
            weekend. It earns its keep on the app you can&apos;t take offline
            for a rewrite, which is most legacy apps you&apos;ll actually meet.
          </li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question={"You're handed a large v5 codebase and asked to move it toward modern React Router without a full rewrite. What's the realistic path?"}
        options={[
          "You can't — v5 and v6+ can never coexist in any form, so it must be a single all-at-once cutover",
          "Install react-router-dom-v5-compat and migrate one component, hook, and route at a time, per React Router's own guidance",
          "Run two separate <BrowserRouter> instances side by side, one per version",
          "Import react-router-dom (v5) and react-router (v8) into the same file and mix Switch with Routes",
        ]}
        correctIndex={1}
        explanation={"React Router publishes react-router-dom-v5-compat specifically for this: a CompatRouter lets v5 Switch/Route code and newly-migrated v6 Routes/Route code run side by side, so teams can migrate incrementally rather than in one risky cutover. It's officially recommended for apps with more than a few routes. It only bridges v5 to v6, though — later hops to v7/v8 follow the same staged path as any v6 app."}
        language="jsx"
      />

      <h2>Quick Reference: What to Do on Day One</h2>
      <CodeBlock language="jsx" title="A legacy-v5 checklist">
{`/*
1. Confirm the version — look for Switch / Redirect / withRouter imports,
   or useHistory / useRouteMatch specifically (useParams/useLocation are
   shared with v6+ and don't prove anything by themselves).

2. Find the Switch order before touching it. A reorder that looks like
   a no-op refactor can silently break routes that depend on
   "specific before general" ordering (Footgun 2).

3. Grep for missing "exact" on any Route whose path is a prefix of
   others sharing a Switch — "/" is the highest-risk offender (Footgun 1).

4. If a class component reads match.params and only fetches in
   componentDidMount, check for a matching componentDidUpdate or a
   key={param} on the rendering <Route> before assuming it's correct
   (Footgun 3).

5. Before proposing an upgrade: check whether the app has "a few routes"
   (do the all-at-once swap) or many (reach for
   react-router-dom-v5-compat and migrate incrementally).
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Section Complete">
        You can now recognize v5 code on sight, you know the three bugs that
        account for most of the weird behavior in real v5 apps, and you have a
        verified, honest answer for the upgrade question every legacy codebase
        eventually raises. Combined with the v6/v7 section&apos;s Migration
        Guide, you have the full path from a v5 app to whatever version your
        team lands on next.
      </InfoBox>
    </LessonLayout>
  );
}
