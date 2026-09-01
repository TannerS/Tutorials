import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Nested() {
  return (
    <LessonLayout
      title="Nested Routes"
      sectionId="react-router-v5"
      lessonIndex={1}
      prev={{ path: '/react-router-v5/intro', label: 'Setup & Core Concepts' }}
      next={{ path: '/react-router-v5/data', label: 'Data Fetching Patterns' }}
    >
      <p>
        v5 has <strong>no <code>&lt;Outlet /&gt;</code></strong> — that component
        doesn&apos;t exist until v6. There is no separate place for a parent
        route to declare &ldquo;a child renders here.&rdquo; Instead, nesting in
        v5 is just... more React Router, rendered by hand: a matched route&apos;s
        own component renders additional <code>&lt;Route&gt;</code>/
        <code>&lt;Switch&gt;</code> elements directly in its JSX, wherever you
        want them, using <code>match.path</code> and{' '}
        <code>match.url</code> (or <code>useRouteMatch()</code>) to build paths
        that stay correct regardless of what the parent&apos;s own path or
        params happen to be.
      </p>

      <FlowChart
        title="Nesting in v5 — No Outlet, the Component Does It Itself"
        chart={"graph TD\nA[URL: /users/42/posts] --> B[Top-level Route: path=/users/:userId]\nB --> C[UserDetail component mounts, receives match]\nC --> D[UserDetail renders its OWN Switch/Route in its JSX]\nD --> E[Nested Route: path=match.path + /posts]\nE --> F[UserPosts renders wherever UserDetail put the Route]\nstyle A fill:#1a2744\nstyle C fill:#2a1f44\nstyle F fill:#1a3329"}
      />

      <InfoBox variant="info" title="What v6+ Replaced This With">
        In v6+, nested routes live in a shared config tree and the parent
        renders <code>&lt;Outlet /&gt;</code> as a placeholder the router fills
        automatically — the parent never writes another <code>&lt;Route&gt;</code>{' '}
        itself. v5&apos;s approach is more manual but also more flexible: because
        nesting is just JSX, a matched component can put its child routes
        anywhere in its own render tree, conditionally, alongside other content —
        there&apos;s no router-owned slot it has to hand control to.
      </InfoBox>

      <h2>match.path vs match.url</h2>
      <p>
        Every match object — whether injected as a prop by <code>&lt;Route&gt;</code>{' '}
        or read with <code>useRouteMatch()</code> — has the same shape:{' '}
        <code>{'{ path, url, isExact, params }'}</code>. The two you need for
        nesting are easy to mix up, and mean genuinely different things:
      </p>

      <ul>
        <li>
          <code>match.path</code> — the raw <strong>pattern</strong> string from
          the <code>path</code> prop, params and all (e.g.{' '}
          <code>&quot;/users/:userId&quot;</code>). Use this to build the{' '}
          <code>path</code> of a <em>nested <code>&lt;Route&gt;</code></em> —
          it needs the placeholder syntax so the child route can define its own
          matching.
        </li>
        <li>
          <code>match.url</code> — the <strong>resolved</strong> URL segment
          that actually matched, with real values substituted (e.g.{' '}
          <code>&quot;/users/42&quot;</code>). Use this to build a{' '}
          <code>&lt;Link to&gt;</code> or <code>&lt;Redirect to&gt;</code> — it&apos;s
          a real, navigable path, not a pattern.
        </li>
      </ul>

      <CodeBlock language="jsx" title="Verified: match.path and match.url for the same match">
{`// Route: <Route path="/users/:userId" component={UserDetail} />
// Visiting: /users/42/posts

// Inside UserDetail, the injected match is:
// match.path -> "/users/:userId"   (the pattern — still has :userId)
// match.url  -> "/users/42"        (resolved — the real segment for this visit)
// match.params -> { userId: "42" }

// A nested Route further down needs the PATTERN, so a second :param works too:
<Route path={\`\${match.path}/posts/:postId\`} component={UserPost} />

// A Link needs a real, resolved URL, so it uses match.url:
<Link to={\`\${match.url}/posts\`}>All posts</Link>`}
      </CodeBlock>

      <InfoBox variant="tip" title="A Simple Rule of Thumb">
        Building a <code>path</code> prop for another <code>&lt;Route&gt;</code>?
        Use <code>match.path</code>. Building somewhere a user can actually
        navigate to — <code>&lt;Link&gt;</code>, <code>&lt;Redirect&gt;</code>,{' '}
        <code>history.push</code>? Use <code>match.url</code>. Mixing them up
        either breaks the nested route&apos;s matching (a stray literal{' '}
        <code>:userId</code> in a link) or breaks navigation (a param placeholder
        with no real value in an href).
      </InfoBox>

      <h2>Building a Nested Route Tree</h2>
      <p>
        A parent route&apos;s component renders its own <code>&lt;Switch&gt;</code>{' '}
        for its children, exactly like a top-level route list — same rules,
        including first-match-wins order and the <code>exact</code> prefix trap
        from the previous lesson. This example was run against the real{' '}
        <code>react-router-dom@5.3.4</code> package to confirm both the index
        route and the nested <code>/posts</code> route resolve correctly for a
        URL like <code>/users/42/posts</code>:
      </p>

      <CodeBlock language="jsx" title="UserDetail.jsx — a route that renders its own children">
{`import { Switch, Route, Link, useRouteMatch } from 'react-router-dom';

function UserOverview() {
  return <p>Overview</p>;
}

function UserPosts() {
  return <p>Posts</p>;
}

function UserDetail() {
  const match = useRouteMatch(); // the closest matched Route — same as the "match" prop

  return (
    <div>
      <nav>
        {/* match.url is resolved: "/users/42", not "/users/:userId" */}
        <Link to={match.url}>Overview</Link>
        <Link to={\`\${match.url}/posts\`}>Posts</Link>
      </nav>

      <Switch>
        {/* exact matters here too — without it, this would also match /users/42/posts */}
        <Route exact path={match.path} component={UserOverview} />
        <Route path={\`\${match.path}/posts\`} component={UserPosts} />
      </Switch>
    </div>
  );
}

// Parent config
<Route path="/users/:userId" component={UserDetail} />`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Nested-exact Trap: A Second Way to Get Bitten">
        If <code>{'<Route exact path={match.path} component={UserOverview} />'}</code>{' '}
        loses its <code>exact</code>, it becomes a prefix match against{' '}
        <code>match.path</code> itself (e.g. <code>&quot;/users/:userId&quot;</code>) —
        which matches <code>/users/42/posts</code> too, since that pathname
        starts with <code>/users/42</code>. Listed first in the{' '}
        <code>Switch</code>, it silently wins and <code>UserPosts</code> never
        renders. This is the exact same bug as an un-<code>exact</code>-ed root
        route, just one level deeper — nesting doesn&apos;t make the rule from
        the previous lesson go away, it just gives you one more place to forget
        it.
      </InfoBox>

      <h2>useRouteMatch() Instead of Prop-Drilling match</h2>
      <p>
        The example above used <code>useRouteMatch()</code> with no arguments,
        which reads the <em>closest</em> matched <code>&lt;Route&gt;</code>&apos;s
        match from context — the same value that would arrive as the{' '}
        <code>match</code> prop if <code>UserDetail</code> were rendered directly
        by a <code>&lt;Route&gt;</code>&apos;s <code>component</code>. That means
        any component nested further down the tree can call it too, without
        needing <code>match</code> passed down as a prop through every layer in
        between.
      </p>

      <CodeBlock language="jsx" title="Verified: match.path composes correctly across two levels of nesting">
{`// Route: <Route path="/users/:userId" component={UserDetail} />
// UserDetail renders: <Route path={\`\${match.path}/posts\`} render={() => <Route ... />} />
// Visiting: /users/42/posts

// A component rendered by that SECOND, nested Route calls useRouteMatch()
// with no arguments and sees the fully composed match:
useRouteMatch();
// -> {
//      path: "/users/:userId/posts",   // both patterns joined
//      url: "/users/42/posts",         // both segments resolved
//      isExact: true,
//      params: { userId: "42" }        // params flow down automatically
//    }`}
      </CodeBlock>

      <h2>The Absolute vs Relative Path Trap</h2>
      <p>
        <code>&lt;Link to&gt;</code> supports relative strings — no leading
        slash — but v5 resolves them against the browser&apos;s current{' '}
        <code>location.pathname</code>, the same way a plain HTML{' '}
        <code>&lt;a href=&quot;posts&quot;&gt;</code> would resolve against the
        current page URL. It has <strong>no idea which part of that pathname
        came from your route tree and which part came from deeper
        nesting</strong> — it just does browser-style relative URL resolution on
        whatever string is currently in the address bar.
      </p>

      <CodeBlock language="jsx" title="Verified: relative Link resolution, rendered at /users/42/settings">
{`// Current location.pathname: "/users/42/settings"

<Link to="posts" />     // -> href="/users/42/posts"   (replaces the last segment)
<Link to="/posts" />    // -> href="/posts"             (absolute — ignores current location)
<Link to="../posts" />  // -> href="/users/posts"       (!!)`}
      </CodeBlock>

      <InfoBox variant="warning" title={'Why "../posts" Lands on /users/posts, Not /users/42/posts'}>
        <p>
          <code>..</code> strips one raw <strong>URL segment</strong>, not one{' '}
          <strong>route level</strong>. From <code>/users/42/settings</code>,
          one <code>..</code> removes <code>settings</code>, landing on{' '}
          <code>/users/42</code> — but a relative link is resolved{' '}
          <em>as if editing a file path</em>, so <code>&quot;../posts&quot;</code>{' '}
          also drops the segment before it (<code>42</code>) on the way there,
          leaving <code>/users/posts</code>. If you were expecting
          &ldquo;go up to my parent route, then to its posts child,&rdquo; that
          is not what happened — the resolution has no concept of{' '}
          <code>:userId</code> being a single param your route tree owns; it
          only sees path segments.
        </p>
        <p style={{ marginBottom: 0 }}>
          The reliable fix is the same rule from the last section: build the
          link explicitly from <code>match.url</code> (
          <code>{'`${match.url}/posts`'}</code>) rather than a bare relative
          string. <code>match.url</code> is anchored to the route your
          component actually owns, so it stays correct no matter how deeply
          nested the current render happens to be — unlike a relative{' '}
          <code>to</code>, which only knows about the raw URL string, not your
          route hierarchy.
        </p>
      </InfoBox>

      <h2>Complete Nested Example</h2>
      <CodeBlock language="jsx" title="Users list -> user detail -> overview / posts / edit">
{`// App.jsx
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path="/users" component={UsersList} />
        <Route path="/users/:userId" component={UserDetail} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

// UserDetail.jsx — owns everything under /users/:userId
import { Switch, Route, NavLink, useRouteMatch } from 'react-router-dom';

function UserDetail() {
  const match = useRouteMatch(); // { path: "/users/:userId", url: "/users/42", ... }

  return (
    <div>
      <nav>
        <NavLink exact to={match.url}>Overview</NavLink>
        <NavLink to={\`\${match.url}/posts\`}>Posts</NavLink>
        <NavLink to={\`\${match.url}/edit\`}>Edit</NavLink>
      </nav>

      <Switch>
        <Route exact path={match.path} component={UserOverview} />
        <Route path={\`\${match.path}/posts\`} component={UserPostsSection} />
        <Route path={\`\${match.path}/edit\`} component={UserEdit} />
      </Switch>
    </div>
  );
}

// UserPostsSection.jsx — nests ONE level further, still using useRouteMatch()
function UserPostsSection() {
  const match = useRouteMatch(); // "/users/:userId/posts" composed automatically

  return (
    <Switch>
      <Route exact path={match.path} component={PostsList} />
      <Route path={\`\${match.path}/:postId\`} component={PostDetail} />
    </Switch>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="NavLink Needs exact Too">
        <code>&lt;NavLink&gt;</code> is <code>&lt;Link&gt;</code> plus an active
        class, and it uses the same prefix-matching rule as{' '}
        <code>&lt;Route&gt;</code> to decide whether it&apos;s &ldquo;active.&rdquo;
        Without <code>exact</code>, the &ldquo;Overview&rdquo; link above would
        stay highlighted on <code>/users/42/posts</code> and{' '}
        <code>/users/42/edit</code> too, since both start with{' '}
        <code>match.url</code>.
      </InfoBox>

      <InteractiveChallenge
        question={"A component is rendered by <Route path=\"/users/:userId\" component={UserDetail} />. Which value should it use to build <Link to={...}> to its own \"posts\" child route?"}
        options={[
          'match.path, because it already contains the full pattern',
          'match.url, because it is the resolved, real URL segment this component owns',
          'A relative Link to="posts" is always safest, since v5 resolves it against the route tree',
          'window.location.pathname, built manually',
        ]}
        correctIndex={1}
        explanation={"match.url is the resolved URL for the current match (e.g. \"/users/42\"), so `${match.url}/posts` always produces a correct, navigable link. match.path still contains the raw :userId placeholder, which would put a literal \":userId\" into the href. A relative to=\"posts\" is resolved against the current browser pathname, not against match.url or the route tree, which is exactly the trap covered above."}
        language="jsx"
      />

      <FlowChart
        title="match.path vs match.url Through Two Levels of Nesting"
        chart={"graph TD\nA[Route: /users/:userId] --> B[match.path = /users/:userId]\nA --> C[match.url = /users/42]\nB --> D[Nested Route path: match.path + /posts]\nC --> E[Nested Link to: match.url + /posts]\nD --> F[Matches pathname /users/42/posts]\nE --> G[Navigates to /users/42/posts]\nstyle B fill:#2a1f44\nstyle C fill:#1a2744\nstyle F fill:#1a3329\nstyle G fill:#1a3329"}
      />
    </LessonLayout>
  );
}
