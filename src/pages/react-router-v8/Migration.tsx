import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Migration() {
  return (
    <LessonLayout
      title="Migration Guide (v7→v8)"
      sectionId="react-router-v8"
      lessonIndex={7}
      prev={{ path: '/react-router-v8/fullapp', label: 'Complete App Routing' }}
      next={{ path: '/react-router-v8/cheatsheet', label: '📋 React Router v8 Field Guide' }}
    >
      <p>
        React Router v8.0.0 shipped June 17, 2026, and this repo currently pins{' '}
        <code>react-router@^7.16.0</code> — a real, live version of exactly the
        upgrade this lesson covers. The team&apos;s stated goal for major versions is
        to make them &ldquo;relatively boring&rdquo; by landing breaking changes ahead
        of time behind <strong>future flags</strong> you can adopt one at a time while
        still on v7. If you adopt every <code>future.v8_*</code> flag before you bump
        the major version, the actual jump to v8 is a version bump and not much else.
      </p>

      <InfoBox variant="note" title="Every Claim Here Is Sourced">
        This lesson is verified against the official{' '}
        <code>CHANGELOG.md</code> and the <em>Upgrading from v7</em> guide on{' '}
        reactrouter.com, plus the live npm registry, as of the v8.3.1 release
        (2026-08-28). Confirmed dist-tags: <code>react-router</code>{' '}
        <code>latest</code> = <strong>8.3.1</strong>, <code>version-7</code> ={' '}
        <strong>7.18.3</strong>. <code>react-router-dom</code>&apos;s{' '}
        <code>latest</code> tag is frozen at <strong>7.18.3</strong> — no v8 build
        was ever published for it, which is the whole story of that package's
        removal below.
      </InfoBox>

      <FlowChart
        title="The Recommended Upgrade Path"
        chart={"graph TD\nA[On v6 or earlier?] -->|Yes| B[Migrate to v7 first - see the v6/v7 section's guide]\nA -->|Already on v7| C[Update to latest v7.18.x]\nB --> C\nC --> D[Adopt future.v8_* flags one at a time, commit each]\nD --> E[Fix the non-flagged breaking changes: react-router-dom, meta/matches data, Cloudflare plugin, architect option]\nE --> F[Bump Node/React/Vite to v8's floors]\nF --> G[npm install react-router@latest]\nG --> H[You are on v8]\nstyle C fill:#3d2f14\nstyle D fill:#2a1f44\nstyle E fill:#2a1f44\nstyle G fill:#1a3329"}
      />

      <h2>Step 0: New Minimum Versions</h2>
      <p>
        Update these before you touch the <code>react-router</code> version — v8
        will not install cleanly otherwise.
      </p>
      <CodeBlock language="jsx" title="v8's floors">
{`Node    22.22.0+   (v7 supported Node 20+)
React   19.2.7+    (react + react-dom)
Vite    7+         — Framework mode only, and only because Framework mode
                     requires future.v8_viteEnvironmentApi, which itself
                     requires Vite 7+`}
      </CodeBlock>

      <InfoBox variant="warning" title="This Repo Is Below the React Floor">
        This site currently pins React 19 (see the React 19 What&apos;s New section)
        but not necessarily <code>19.2.7</code> specifically. Check{' '}
        <code>react</code>/<code>react-dom</code> in <code>package.json</code>{' '}
        before attempting this upgrade for real — a React bump usually needs to land
        as its own commit, verified separately, before a router major version on top
        of it.
      </InfoBox>

      <h2>Step 1: Update to the Latest v7 First</h2>
      <p>
        Future flags before v8.3.0 aren&apos;t available on older v7 minors, so get
        current before doing anything else.
      </p>
      <CodeBlock language="bash" title="Update to latest v7.x">
{`npm install react-router@7 @react-router/{dev,node,etc.}@7`}
      </CodeBlock>

      <h2>Step 2: Adopt Each Future Flag on v7</h2>
      <p>
        Every flag below shipped in v7, defaults to <code>false</code> there, and
        becomes the unconditional, un-flagged behavior in v8. Turn each one on while
        still on v7, fix what it breaks, commit, then move to the next — that&apos;s
        the whole point of the future-flag strategy.
      </p>

      <h3>future.v8_middleware</h3>
      <p>
        Stable middleware and context APIs — <code>createContext</code>,{' '}
        <code>RouterContextProvider</code>, route-level <code>middleware</code>{' '}
        arrays — landed unstable, then stabilized in v7.9.0. This flag makes them the
        default and permanent behavior.
      </p>
      <CodeBlock language="jsx" title="Enable in Data mode (createBrowserRouter)">
{`const router = createBrowserRouter(routes, {
  future: {
    v8_middleware: true,
  },
});`}
      </CodeBlock>
      <InfoBox variant="danger" title="If You Have a Custom Server: getLoadContext Must Change">
        With this flag on, <code>context</code> in <code>loader</code>/<code>action</code>/
        <code>middleware</code> is <strong>always</strong> a{' '}
        <code>RouterContextProvider</code> instance — never a plain object. A custom
        server&apos;s <code>getLoadContext</code> function that currently returns{' '}
        <code>{'{ db, user }'}</code> needs to build and return a{' '}
        <code>RouterContextProvider</code> instead, or every loader that destructures{' '}
        <code>context</code> as a plain object breaks at runtime. If you deploy via{' '}
        <code>react-router-serve</code> rather than a custom server, there is nothing
        to change here.
      </InfoBox>

      <h3>future.v8_splitRouteModules</h3>
      <p>
        Splits <code>clientLoader</code>/<code>clientAction</code>/
        <code>clientMiddleware</code>/<code>HydrateFallback</code> into their own
        chunk so they can be fetched and run while the route component is still
        downloading. Framework mode only. Purely a build optimization — no code
        changes are required to adopt it.
      </p>
      <CodeBlock language="ts" title="react-router.config.ts">
{`export default {
  future: {
    v8_splitRouteModules: true, // or "enforce" to fail the build on unsplittable routes
  },
};`}
      </CodeBlock>
      <InfoBox variant="note" title="Renamed on the Way to v8, Not Removed">
        In v8 this stops being a future flag and becomes a top-level{' '}
        <code>splitRouteModules</code> config option, <strong>defaulted to{' '}
        <code>true</code></strong>. If your build genuinely can&apos;t split some
        route (shared module-scope state between a loader and its component, say),
        set <code>splitRouteModules: false</code> after upgrading rather than leaving
        it as a lingering future flag — the flag itself won&apos;t exist anymore.
      </InfoBox>

      <h3>future.v8_viteEnvironmentApi</h3>
      <p>
        Framework mode only, requires Vite 6+ to adopt on v7 (Vite 7+ once you&apos;re
        on v8, since the flag disappears and the behavior is mandatory). Most apps
        need zero changes; the exception is a custom <code>entry.server.tsx</code>{' '}
        that branches on Vite&apos;s <code>isSsrBuild</code> flag.
      </p>
      <CodeBlock language="jsx" title="Only if you have a custom SSR rollup config">
{`// ❌ Before — isSsrBuild branch in the top-level build config
export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild ? { input: './server/app.ts' } : undefined,
  },
}));

// ✅ After — moved under the per-environment config
export default defineConfig({
  environments: {
    ssr: { build: { rollupOptions: { input: './server/app.ts' } } },
  },
  plugins: [reactRouter()],
});`}
      </CodeBlock>

      <h3>future.v8_passThroughRequests</h3>
      <p>
        Today, React Router strips its own implementation details — <code>.data</code>{' '}
        suffixes, <code>?index</code>/<code>?_routes</code> — off{' '}
        <code>request.url</code> before handing the <code>Request</code> to your
        loader/action. This flag stops that normalization and passes the raw HTTP
        request through untouched, adding a sibling <code>url</code> parameter with
        the normalized version for anyone who was relying on the old behavior.
      </p>
      <CodeBlock language="jsx" title="Before / after — reading the request URL">
{`// ❌ Before this flag: assumed request.url never has a .data suffix
export async function loader({ request }) {
  const url = new URL(request.url);
  if (url.pathname === '/path') { /* ... */ }   // breaks on data requests once the flag is on
}

// ✅ After: url is always normalized; request is always raw
export async function loader({ request, url }) {
  if (url.pathname === '/path') { /* always correct */ }

  const isDataRequest = new URL(request.url).pathname.endsWith('.data');
}`}
      </CodeBlock>

      <h3>future.v8_trailingSlashAwareDataRequests</h3>
      <p>
        A narrow but real bug: before this flag, <code>/a/b/c</code> and{' '}
        <code>/a/b/c/</code> both resolved to the same <code>/a/b/c.data</code> URL
        internally, so a route that cares about the trailing slash couldn&apos;t
        distinguish a data request for one from the other. This flag gives the
        trailing-slash variant its own <code>/a/b/c/_.data</code> format (and renames
        the root data request from <code>/_root.data</code> to <code>/_.data</code>).
        Only matters if you have custom CDN/cache/rewrite rules that pattern-match{' '}
        <code>.data</code> URLs — update those patterns if so.
      </p>

      <h2>Step 3: Fix the Breaking Changes That Have No Flag</h2>
      <p>
        These four are not gated behind a future flag — they simply change in v8, so
        fix them at your own pace on v7 before bumping the version, then verify.
      </p>

      <h3>1. react-router-dom Is Removed</h3>
      <CodeBlock language="jsx" title="react-router-dom → react-router / react-router/dom">
{`// ❌ v7 — react-router-dom re-exported everything for v6-era imports
import { Link, useLocation, RouterProvider } from 'react-router-dom';

// ✅ v8 — DOM-specific APIs from react-router/dom, everything else from react-router
import { Link, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';`}
      </CodeBlock>
      <InfoBox variant="warning" title="Uninstall It, Don't Just Stop Importing It">
        <code>npm uninstall react-router-dom</code> as its own step. It was already
        just a thin re-export of <code>react-router</code> in v7 — kept around purely
        so old v6 imports kept working — and v8 drops it outright. If it lingers in{' '}
        <code>package.json</code>, a transitive dependency or an old import you
        missed will silently resolve to the last-ever version,{' '}
        <strong>7.18.3</strong>, side by side with <code>react-router@8</code>. Two
        copies of the router in one bundle is a strictly worse failure mode than a
        missing import, because it usually doesn't throw — it just produces
        inconsistent <code>context</code> depending on which copy a given component
        imported from.
      </InfoBox>

      <h3>2. meta / matches: data → loaderData</h3>
      <p>
        The <code>data</code> field was deprecated in v7.8.0 in favor of{' '}
        <code>loaderData</code>, to match the naming <code>Route.ComponentProps</code>{' '}
        already used. v8 removes <code>data</code> outright in all three spots.
        Framework mode only — Data mode never had this field.
      </p>
      <CodeBlock language="jsx" title="Three call sites, same rename">
{`// ❌ meta() function's data argument
export function meta({ data, matches }) {
  return [{ title: data.title }];
}

// ✅ loaderData argument
export function meta({ loaderData, matches }) {
  return [{ title: loaderData.title }];
}

// ❌ meta()'s matches argument — matches[i].data
const rootMatch = matches.find((m) => m.id === 'root');
const rootData = rootMatch?.data;

// ✅ matches[i].loaderData
const rootData = rootMatch?.loaderData;

// ❌ useMatches() — matches[i].data
const matches = useMatches();
const rootLoaderData = matches[0].data;

// ✅ matches[i].loaderData
const rootLoaderData = matches[0].loaderData;`}
      </CodeBlock>

      <h3>3. Cloudflare Vite Plugin</h3>
      <p>
        <code>@react-router/dev/vite/cloudflare</code> (the dev proxy) is removed.
        Cloudflare projects move to the official{' '}
        <code>@cloudflare/vite-plugin</code>.
      </p>
      <CodeBlock language="jsx" title="vite.config.ts">
{`// ❌ Removed in v8
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
// ...
plugins: [cloudflareDevProxy(), reactRouter()],

// ✅ v8
import { cloudflare } from '@cloudflare/vite-plugin';
// ...
plugins: [cloudflare(), reactRouter()],`}
      </CodeBlock>

      <h3>4. @react-router/architect: useRequestContextDomainName</h3>
      <p>
        Only relevant if you deploy to AWS via <code>@react-router/architect</code>.
        v7 built the request from <code>X-Forwarded-Host</code>, falling back to{' '}
        <code>Host</code>. v8 defaults to{' '}
        <code>event.requestContext.domainName</code> instead, falling back to{' '}
        <code>Host</code> — and removes the option that used to opt into that
        behavior early, because it&apos;s no longer optional.
      </p>
      <CodeBlock language="jsx" title="Opt in on v7, then delete the option on v8">
{`// On v7 — opt into the v8 behavior ahead of time to de-risk the bump
createRequestHandler({ build, useRequestContextDomainName: true });

// On v8 — the option is gone because that IS the behavior now
createRequestHandler({ build });`}
      </CodeBlock>

      <h2>Step 4: The Version Bump Itself</h2>
      <CodeBlock language="bash" title="Upgrade to v8">
{`# Data mode / declarative mode
npm install react-router@latest

# Framework mode
npm install react-router@latest @react-router/{dev,node,etc.}@latest`}
      </CodeBlock>

      <InfoBox variant="info" title="No Official Codemod — and That's the Point">
        Unlike the v5→v6 jump (which shipped a real codemod because{' '}
        <code>&lt;Switch&gt;</code> → <code>&lt;Routes&gt;</code> is a mechanical
        JSX rewrite), there is no <code>@react-router/codemod</code> package and
        neither the CHANGELOG nor the official upgrade guide mentions one for
        v7→v8. That&apos;s not an oversight: nearly the entire v8 surface change is
        future-flag adoption you do incrementally on v7 — a codemod can&apos;t turn a
        flag on for you and then decide whether your custom{' '}
        <code>getLoadContext</code> needs rewriting. The remaining changes
        (<code>react-router-dom</code> imports, <code>data</code> →{' '}
        <code>loaderData</code>) are simple enough that TypeScript and a project-wide
        find/replace cover them without dedicated tooling.
      </InfoBox>

      <h2>Full Breaking-Changes Reference</h2>
      <CodeBlock language="jsx" title="Everything v8 changes vs. v7 — one table">
{`/*
┌────────────────────────────────────┬─────────────────────────────────────────┐
│ v7                                  │ v8                                       │
├────────────────────────────────────┼─────────────────────────────────────────┤
│ future.v8_middleware: false         │ middleware always on, no flag            │
│ future.v8_splitRouteModules: false  │ splitRouteModules: true (top-level, on)  │
│ future.v8_viteEnvironmentApi: false │ Vite Environment API always on, Vite 7+  │
│ future.v8_passThroughRequests: false│ raw request always passed through        │
│ future.v8_trailingSlashAware...     │ trailing-slash .data URLs always on      │
│ import ... from 'react-router-dom'  │ react-router-dom package REMOVED          │
│ meta({ data })                      │ meta({ loaderData })                      │
│ matches[i].data                     │ matches[i].loaderData                     │
│ @react-router/dev/vite/cloudflare   │ REMOVED — use @cloudflare/vite-plugin    │
│ useRequestContextDomainName option  │ REMOVED — that behavior is the default   │
│ Node 20+, React 18+/19+, Vite 5+    │ Node 22.22+, React 19.2.7+, Vite 7+       │
│ CJS + ESM builds                    │ ESM-only                                  │
└────────────────────────────────────┴─────────────────────────────────────────┘
*/`}
      </CodeBlock>

      <h2>Common Migration Pitfalls</h2>

      <InfoBox variant="danger" title="Pitfall: Two Router Packages in One Bundle">
        Forgetting to <code>npm uninstall react-router-dom</code> (see above) is the
        single most common way this upgrade goes wrong — it doesn&apos;t error, it
        just produces subtly broken <code>context</code>/hook behavior in whichever
        components still resolve the old package.
      </InfoBox>

      <InfoBox variant="danger" title="Pitfall: getLoadContext Still Returning a Plain Object">
        If <code>future.v8_middleware</code> is on (or you're already on v8) and a
        custom server's <code>getLoadContext</code> still returns{' '}
        <code>{'{ db: ..., user: ... }'}</code> instead of a{' '}
        <code>RouterContextProvider</code>, every loader that calls{' '}
        <code>context.get(...)</code> throws — plain objects don&apos;t have a{' '}
        <code>get</code> method. This is the change most likely to be silent in
        development (if you don&apos;t exercise a loader that touches context) and
        loud in production.
      </InfoBox>

      <InfoBox variant="warning" title="Pitfall: CI Still on an Older Node">
        v8 requires Node 22.22+. A CI pipeline pinned to Node 20 or an older Node 22
        patch will fail the install, not the build — check{' '}
        <code>engines</code> in <code>package.json</code> and your CI runner image
        together, not just one of them.
      </InfoBox>

      <h2>Quick Reference: Step-by-Step Checklist</h2>
      <CodeBlock language="jsx" title="Migration Checklist">
{`/*
Step 0 — Floors
  [ ] Node >= 22.22.0
  [ ] React & react-dom >= 19.2.7
  [ ] Vite >= 7 (Framework mode only)

Step 1 — Get current on v7
  [ ] npm install react-router@7 @react-router/{dev,node,etc.}@7

Step 2 — Future flags (adopt on v7, one at a time, commit each)
  [ ] future.v8_middleware              (custom getLoadContext must return RouterContextProvider)
  [ ] future.v8_splitRouteModules       (no code changes — build optimization)
  [ ] future.v8_viteEnvironmentApi      (only touches custom entry.server.tsx w/ isSsrBuild)
  [ ] future.v8_passThroughRequests     (use the new 'url' param, not request.url, for normalized routing)
  [ ] future.v8_trailingSlashAwareDataRequests  (only matters w/ custom .data URL rewrite rules)

Step 3 — Non-flagged breaking changes (fix on v7, before bumping)
  [ ] npm uninstall react-router-dom; repoint imports at react-router / react-router/dom
  [ ] meta({ data }) -> meta({ loaderData })
  [ ] matches[i].data -> matches[i].loaderData  (in meta() AND useMatches())
  [ ] @react-router/dev/vite/cloudflare -> @cloudflare/vite-plugin
  [ ] @react-router/architect: remove useRequestContextDomainName (now the default)

Step 4 — The bump
  [ ] npm install react-router@latest [@react-router/{dev,node,etc.}@latest]
  [ ] No official codemod exists — this is manual, verify with your test suite

Step 5 — Smoke test
  [ ] Every loader/action that reads context still works
  [ ] Any custom CDN/cache rule matching *.data URLs updated for trailing-slash routes
  [ ] Cloudflare / architect deploys, if applicable, still authenticate correctly
*/`}
      </CodeBlock>

      <InfoBox variant="success" title="Migration Complete">
        That&apos;s the entire v7→v8 surface: five future flags you can adopt
        incrementally without ever being on a broken commit, four small
        non-flagged fixes, three new version floors, and a version bump with no
        codemod because none of it needs one. The <strong>Complete App Routing</strong>{' '}
        lesson in this section shows what the result looks like once every one of
        these is in place.
      </InfoBox>
    </LessonLayout>
  );
}
