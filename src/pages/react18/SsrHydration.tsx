import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function SsrHydration() {
  return (
    <LessonLayout
      title="SSR & Hydration"
      sectionId="react18"
      lessonIndex={10}
      prev={{ path: '/react18/server', label: 'Server Components & Actions' }}
      next={{ path: '/react18/patterns', label: 'Advanced Patterns' }}
    >
      <p>
        Server-side rendering means running your components on a server to produce real HTML, sending
        that HTML to the browser, and then <strong>hydrating</strong> it — attaching React to markup
        that already exists instead of building the DOM from scratch. It is the oldest React
        &quot;advanced&quot; topic and still the one with the most sharp edges, because it is the only
        situation where your component code runs twice, in two different environments, and the two
        runs are required to agree.
      </p>

      <h2>The Problem SSR Solves</h2>

      <p>
        A pure client-rendered app ships an empty shell. Every meaningful pixel is gated behind a
        chain of serial steps, and each link in that chain is a place where a slow network or a slow
        device costs you the user.
      </p>

      <FlowChart
        title="Client rendering vs server rendering — the critical path"
        chart={"graph TD\n  subgraph CSR[Client Rendered]\n    A1[HTML: empty div id=root] --> A2[Download JS bundle]\n    A2 --> A3[Parse and execute JS]\n    A3 --> A4[React renders - shows spinner]\n    A4 --> A5[Fetch data over network]\n    A5 --> A6[First Contentful Paint]\n  end\n  subgraph SSR[Server Rendered]\n    B1[Server fetches data] --> B2[Server renders HTML]\n    B2 --> B3[Browser paints real content]\n    B3 --> B4[First Contentful Paint]\n    B4 --> B5[Download JS bundle in parallel]\n    B5 --> B6[Hydrate - now interactive]\n  end\n  style A6 fill:#3b1a1a\n  style B4 fill:#1a3329\n  style B6 fill:#1a2744"}
      />

      <h3>What you actually gain</h3>

      <ul>
        <li>
          <strong>FCP and LCP</strong> — the browser paints content from the first response instead of
          after a bundle download plus a data round-trip. On a fast connection this is worth a few
          hundred milliseconds; on a slow 4G phone it is routinely worth several seconds.
        </li>
        <li>
          <strong>Crawlers that do not run JavaScript.</strong> Googlebot does execute JS, but on a
          separate deferred render queue, so JS-only content is indexed later and less reliably.
          Almost every <em>other</em> crawler — Bing, DuckDuckGo, and critically the social preview
          bots for Slack, Discord, X, Facebook, LinkedIn, and iMessage — fetches your HTML and never
          runs a line of your code. If your <code>&lt;title&gt;</code> and <code>og:</code> meta tags
          are injected by React on the client, your links unfurl as a blank card forever.
        </li>
        <li>
          <strong>Data fetching moves next to the data.</strong> A server sitting in the same region
          as your database can do three queries in the time a phone spends on TLS handshakes.
        </li>
        <li>
          <strong>Graceful degradation.</strong> If the bundle fails to load, a server-rendered page
          is still readable. A client-rendered one is a white screen.
        </li>
      </ul>

      <InfoBox variant="warning" title="What SSR does NOT give you">
        <p>
          <strong>SSR does not make your app interactive faster.</strong> The same JavaScript still
          has to download, parse, and execute before anything responds to a click — and now it also
          has to hydrate. Time-to-interactive is usually marginally <em>worse</em> under SSR, and you
          have added an HTML payload that is often larger than the JSON it replaced.
        </p>
        <p style={{ marginBottom: 0 }}>
          This produces the &quot;uncanny valley&quot; that users complain about: the page looks
          completely finished, they click a button, and nothing happens. Nothing is broken — React
          attaches its listeners at the root container during hydration, so before hydration
          completes there is genuinely nothing listening. Disable buttons or show a subtle pending
          state if the gap is long enough to notice.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Be honest about whether you need this">
        <p>Skip SSR when:</p>
        <ul>
          <li>
            <strong>Everything is behind a login.</strong> Dashboards, admin panels, internal tools —
            no crawler will ever see them, and your users are repeat visitors with a warm cache. This
            tutorial site is a Vite SPA for exactly that reason.
          </li>
          <li>
            <strong>The content is fully personalized.</strong> Nothing is cacheable, so you pay full
            server CPU on every request for a first paint the user could have gotten from a skeleton.
          </li>
          <li>
            <strong>Your marketing pages are static.</strong> Prerender them at build time and serve
            them from a CDN. You get every SEO and FCP benefit with none of the runtime.
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          The price of SSR is real: a Node or edge runtime you now have to operate and pay for, cold
          starts, no <code>window</code> at module scope anywhere in your dependency tree, a build
          that emits two bundles, and an entire category of bugs that only reproduce in production.
        </p>
      </InfoBox>

      <h2>The Render → Hydrate Handoff</h2>

      <p>
        Understanding one sentence prevents most SSR bugs: <strong>the client re-renders the entire
        tree from scratch, and compares that result to the DOM the server sent.</strong> Hydration is
        an assertion, not a merge.
      </p>

      <FlowChart
        title="What crosses the wire, and what the client does with it"
        chart={"graph TD\n  A[Request arrives] --> B[Server runs your components]\n  B --> C[Produces HTML string or stream]\n  C --> D[Serializes fetched data into an inline script]\n  D --> E[Adds bootstrap script tag for the client bundle]\n  E --> F[Browser parses HTML and paints - visible but dead]\n  F --> G[Bundle downloads and executes]\n  G --> H[hydrateRoot renders the SAME tree in memory]\n  H --> I{Does the virtual tree match the DOM?}\n  I -->|Yes| J[Adopt existing nodes - build fiber tree - attach listeners]\n  I -->|No| K[Log recoverable error - discard server DOM for that subtree]\n  K --> L[Client-render it instead - visible flicker]\n  J --> M[Interactive]\n  style M fill:#1a3329\n  style L fill:#3b1a1a"}
      />

      <p>
        The server sends three things, and all three matter. The <strong>markup</strong> is what gets
        painted. The <strong>serialized data</strong> exists so the client&apos;s first render can
        produce an identical tree without refetching — if the client refetches, it will get different
        data and mismatch. The <strong>bootstrap script tag</strong> is what starts hydration; React
        injects it for you when you pass <code>bootstrapScripts</code>.
      </p>

      <CodeBlock language="html" title="What a server-rendered document actually looks like">
{`<!DOCTYPE html>
<html>
  <head><title>Product — Widget</title></head>
  <body>
    <div id="root">
      <!-- Real markup. Paints immediately. Zero JS required. -->
      <h1>Widget</h1>
      <p>A very good widget.</p>
      <button>Add to cart</button>   <!-- looks clickable; is not yet -->
    </div>

    <!-- The data the server used, so the client renders the SAME tree -->
    <script>window.__INITIAL_DATA__ = {"product":{"id":1,"name":"Widget"}}</script>

    <!-- Injected by React from bootstrapScripts. This starts hydration. -->
    <script src="/main.js" async></script>
  </body>
</html>`}
      </CodeBlock>

      <InfoBox variant="danger" title="Serializing state into HTML is an XSS sink">
        <p style={{ marginBottom: 0 }}>
          Never <code>JSON.stringify</code> straight into a <code>&lt;script&gt;</code> tag. If any
          value contains the literal text <code>&lt;/script&gt;</code>, the browser&apos;s parser ends
          your script tag right there and treats the rest of your data as HTML — which is a
          full-page-takeover XSS if that value came from user input. Escape <code>&lt;</code>,
          <code>&gt;</code>, and the line separators, or use a library such as{' '}
          <code>serialize-javascript</code> or <code>devalue</code> (which also handles{' '}
          <code>Date</code>, <code>Map</code>, <code>Set</code>, and cycles, none of which survive
          plain JSON).
        </p>
      </InfoBox>

      <CodeBlock language="tsx" title="Safe state serialization">
{`// ❌ XSS. A product named '</script><script>steal()</script>' owns your page.
\`<script>window.__DATA__ = \${JSON.stringify(data)}</script>\`

// ✅ Escape the characters that can break out of a script context
function safeJson(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\\\u003c')      // kills </script> and <!--
    .replace(/>/g, '\\\\u003e')
    .replace(/\\u2028/g, '\\\\u2028') // JS line separators — valid JSON, invalid JS
    .replace(/\\u2029/g, '\\\\u2029');
}

\`<script>window.__DATA__ = \${safeJson(data)}</script>\`

// On the client, seed your cache from it — do NOT refetch on mount,
// or the client's first render will differ from the server's.
const initialData = window.__DATA__;`}
      </CodeBlock>

      <h2>The Four Server Rendering APIs</h2>

      <p>
        <code>react-dom/server</code> exports the request-time renderers;{' '}
        <code>react-dom/static</code> exports the build-time ones. Which you use is decided almost
        entirely by your runtime and by whether you want to stream.
      </p>

      <h3><code>renderToString</code> — legacy, and worth understanding why</h3>

      <CodeBlock language="tsx" title="renderToString — synchronous, blocking, no streaming">
{`import { renderToString } from 'react-dom/server';

app.get('/*', (req, res) => {
  const html = renderToString(<App url={req.url} />);
  res.send(\`<!DOCTYPE html><div id="root">\${html}</div><script src="/main.js"></script>\`);
});

// Three fatal limitations, all consequences of being synchronous:
//
// 1. It CANNOT wait for anything. A component that suspends for data does not
//    pause the render — React emits the Suspense FALLBACK into the HTML and
//    moves on. Your users get a server-rendered spinner. Async Server
//    Components cannot be used at all.
//
// 2. No streaming. Nothing is sent until the entire tree is done, so TTFB is
//    gated on your slowest component. It also blocks the Node event loop for
//    the whole render — one slow page degrades every concurrent request.
//
// 3. No bootstrapScripts, no resource preloading, no <link rel=preload> hints.
//    You hand-assemble the document and hope your asset manifest is right.`}
      </CodeBlock>

      <InfoBox variant="note" title="renderToString is not deprecated — it is just rarely the right tool">
        <p style={{ marginBottom: 0 }}>
          It remains legitimately useful for rendering a tree that never suspends and never
          hydrates: HTML email bodies, RSS/Atom item content, PDF pipelines, snapshot tests. For
          those, reach for its sibling <code>renderToStaticMarkup</code>, which omits React&apos;s
          hydration markers and produces cleaner output — precisely because you will never call{' '}
          <code>hydrateRoot</code> on it.
        </p>
      </InfoBox>

      <h3><code>renderToPipeableStream</code> — Node.js</h3>

      <CodeBlock language="tsx" title="renderToPipeableStream — Express, Fastify, plain http" showLineNumbers>
{`import { renderToPipeableStream } from 'react-dom/server';

app.get('/*', (req, res) => {
  let didError = false;

  const { pipe, abort } = renderToPipeableStream(<App url={req.url} />, {
    bootstrapScripts: ['/main.js'],   // React injects the <script> tag itself

    // Fires when everything OUTSIDE a suspended Suspense boundary is ready.
    // This is the earliest moment you can send bytes — and the LAST moment
    // you can still set a status code or a header.
    onShellReady() {
      res.statusCode = didError ? 500 : 200;
      res.setHeader('Content-Type', 'text/html');
      pipe(res);                      // shell now; boundaries stream in after
    },

    // Use INSTEAD of onShellReady when the consumer cannot execute the inline
    // scripts that swap streamed content into place — crawlers, static export,
    // anything that reads the raw HTML.
    // onAllReady() { res.setHeader(...); pipe(res); },

    // The shell itself threw. Nothing renderable exists. You have not sent
    // bytes yet, so a real error status is still possible.
    onShellError() {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/html');
      res.send('<!DOCTYPE html><h1>Something went wrong</h1>');
    },

    // Every error, including ones inside a boundary that React recovered from
    // by streaming the fallback and letting the client retry.
    onError(error, errorInfo) {
      didError = true;
      logToSentry(error, errorInfo.componentStack);
    },
  });

  // A hung data source must never hold the socket open forever.
  // abort() flushes fallbacks for anything unresolved and closes the stream.
  setTimeout(abort, 10_000);
});`}
      </CodeBlock>

      <h3><code>renderToReadableStream</code> — Web / edge runtimes</h3>

      <CodeBlock language="tsx" title="renderToReadableStream — Cloudflare Workers, Deno, Bun, Vercel Edge">
{`import { renderToReadableStream } from 'react-dom/server';

export default async function handler(request: Request) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10_000);

  try {
    // The PROMISE resolves when the shell is ready — that is this API's
    // equivalent of onShellReady. Awaiting it and then returning the stream
    // is the whole pattern.
    const stream = await renderToReadableStream(<App />, {
      bootstrapScripts: ['/main.js'],
      signal: controller.signal,
      onError(error) { logToSentry(error); },
    });

    // Serving a crawler? Wait for everything instead of streaming:
    // if (isBot(request.headers.get('user-agent'))) await stream.allReady;

    return new Response(stream, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    // Rejecting means the SHELL failed — equivalent to onShellError.
    return new Response('<!DOCTYPE html><h1>Something went wrong</h1>', {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}`}
      </CodeBlock>

      <h3><code>prerender</code> / <code>prerenderToNodeStream</code> — static generation</h3>

      <p>
        React 19 added these in <code>react-dom/static</code>. They render exactly like the streaming
        APIs, but the promise resolves only once <em>all</em> data has loaded and every boundary has
        filled in — which is what a build step wants, since there is no live client to receive later
        chunks.
      </p>

      <CodeBlock language="tsx" title="prerender — build-time HTML with full Suspense support">
{`// ── Web streams: Deno, Bun, or a Node build script ──
import { prerender } from 'react-dom/static';

const { prelude } = await prerender(<App />, {
  bootstrapScripts: ['/main.js'],
});

// NOTE: prelude is a ReadableStream<Uint8Array>, not a string.
const html = await new Response(prelude).text();
await fs.writeFile('dist/index.html', html);

// ── Node streams ──
import { prerenderToNodeStream } from 'react-dom/static';

const { prelude } = await prerenderToNodeStream(<App />, {
  bootstrapScripts: ['/main.js'],
});
prelude.pipe(fs.createWriteStream('dist/index.html'));

// Why not just renderToString for static generation?
// Because prerender WAITS for async data and Suspense boundaries.
// renderToString would bake your loading skeletons into the static file.`}
      </CodeBlock>

      <InfoBox variant="info" title="Picking one">
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Node server, per request</strong> → <code>renderToPipeableStream</code></li>
          <li><strong>Edge / Workers / Deno / Bun, per request</strong> → <code>renderToReadableStream</code></li>
          <li><strong>Build time, output written to disk</strong> → <code>prerenderToNodeStream</code> (Node) or <code>prerender</code> (Web)</li>
          <li><strong>Never hydrated — email, RSS, tests</strong> → <code>renderToStaticMarkup</code></li>
          <li><strong>Everything else</strong> → you almost certainly want a framework, not these functions directly</li>
        </ul>
      </InfoBox>

      <h2><code>hydrateRoot</code> vs <code>createRoot</code></h2>

      <CodeBlock language="tsx" title="The client entry point" showLineNumbers>
{`import { hydrateRoot } from 'react-dom/client';
import App from './App';

// Note the shape: hydrateRoot takes the element as its SECOND ARGUMENT.
// There is no .render() call here — that is createRoot's API, not this one.
const root = hydrateRoot(document.getElementById('root')!, <App />, {
  // Hydration mismatches arrive here. React "recovered" by throwing away the
  // server DOM for that subtree and client-rendering it — the page is not
  // broken, but you shipped a bug and the user saw a flicker.
  onRecoverableError(error, errorInfo) {
    report(error, errorInfo.componentStack);
  },

  // React 19 also routes normal render errors through callbacks:
  onCaughtError(error, errorInfo) {    // an error boundary handled it
    report(error, errorInfo.componentStack);
  },
  onUncaughtError(error, errorInfo) {  // nothing caught it — the tree unmounted
    report(error, errorInfo.componentStack);
  },

  // Required when two independently-rendered React roots share a page,
  // so their useId() values cannot collide.
  identifierPrefix: 'app-',
});

// The returned root still supports root.render(<App />) for later updates and
// root.unmount(). The difference is only in how the FIRST render behaves.`}
      </CodeBlock>

      <InfoBox variant="info" title="What actually differs">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong><code>createRoot(container).render(el)</code></strong> — the container must be
            empty. React constructs every DOM node itself. Any pre-existing children are wiped.
          </li>
          <li>
            <strong><code>hydrateRoot(container, el, options)</code></strong> — the container holds
            server HTML. React renders the tree in memory and walks the existing DOM in lockstep,{' '}
            <em>adopting</em> nodes rather than creating them, then attaches its event delegation at
            the root.
          </li>
          <li>
            <strong>Hydration is stricter.</strong> Under <code>createRoot</code>, whatever your
            component returns is the truth. Under <code>hydrateRoot</code>, the first render is
            checked against the DOM, and disagreement is an error.
          </li>
          <li>
            <strong>Hydration is chunked and interruptible.</strong> React yields between Suspense
            boundaries and re-prioritizes based on user interaction — see selective hydration below.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="Hydrate a container, not document.body">
        <p style={{ marginBottom: 0 }}>
          <code>hydrateRoot</code> accepts a <code>Document</code>, and frameworks that render the
          entire <code>&lt;html&gt;</code> element do use it that way. In a hand-rolled setup, target{' '}
          <code>#root</code>. Browser extensions inject nodes and attributes directly into{' '}
          <code>&lt;body&gt;</code> — Grammarly adds <code>data-gr-*</code>, dark-mode extensions
          rewrite <code>style</code>, password managers insert icons — and every one of those becomes
          a hydration mismatch you cannot reproduce or fix.
        </p>
      </InfoBox>

      <h2>Hydration Mismatches</h2>

      <p>
        This is the bug you will actually hit, and it always reduces to the same thing: the
        client&apos;s <strong>first</strong> render produced something different from what the server
        sent. React 19 made this dramatically easier to debug — instead of the old cryptic
        &quot;Text content did not match&quot; warning (or a minified error number in production),
        you now get a single error containing a readable diff of the server tree against the client
        tree, plus the component stack.
      </p>

      <CodeBlock language="text" title="What React 19 reports">
{`Hydration failed because the server rendered HTML didn't match the client.
...

  <ProductPage>
    <div>
      <span>
+       2:14:07 PM        <- what the CLIENT rendered
-       9:14:07 PM        <- what the SERVER sent

    at span
    at ProductPage (src/ProductPage.tsx:12:5)`}
      </CodeBlock>

      <h3>The causes, in rough order of how often they bite</h3>

      <CodeBlock language="tsx" title="Every common mismatch, and its fix" showLineNumbers>
{`// 1. NON-DETERMINISM IN RENDER
//    Two runs, two values. Guaranteed mismatch.
function Bad() {
  return <div id={\`item-\${Math.random()}\`}>{Date.now()}</div>;
}
//    Fix: useId() for stable IDs; compute time-based values in an effect,
//    or pass a single server-computed value down as a prop.
function Good() {
  const id = useId();          // stable across server and client. Use this.
  return <div id={id} />;
}

// 2. LOCALE AND TIMEZONE — the sneakiest one
//    Your server runs in UTC. Your user is in Denver. toLocaleString()
//    disagrees by 6 hours. This often passes locally because your laptop
//    and your dev server share a timezone, then breaks in production.
<span>{new Date(post.createdAt).toLocaleString()}</span>          // ❌
<span>{formatInTimeZone(post.createdAt, 'UTC', 'PP p')}</span>    // ✅ explicit
//    Or: render the ISO string on the server, localize in an effect.

// 3. typeof window BRANCHES IN RENDER
//    The server takes one branch and the client's FIRST render must take the
//    same one — but it structurally cannot, because window now exists.
function Bad() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  return isMobile ? <MobileNav /> : <DesktopNav />;   // ❌ always mismatches
}
//    Fix: render the server-safe default, correct it after mount (below),
//    or better, use a CSS media query and render both.

// 4. READING BROWSER STATE DURING RENDER
const theme = localStorage.getItem('theme');    // ❌ crashes on the server
const dark = matchMedia('(prefers-color-scheme: dark)').matches;  // ❌
//    Fix: useSyncExternalStore with a getServerSnapshot (below).

// 5. INVALID HTML NESTING — mismatches with no non-determinism at all
<p><div>hi</div></p>          // ❌ browser closes the <p> BEFORE the <div>
<p><p>a</p></p>               // ❌ same
<a href="/x"><a href="/y" /></a>  // ❌ same
<table><div /></table>        // ❌ hoisted out of the table entirely
//    The server emitted valid-looking JSX, but the browser's parser REPAIRED
//    the HTML on the way in. React then compares its tree against a DOM the
//    browser silently restructured. Nothing you wrote is random; it still
//    fails every time. React 19 warns about these specifically.

// 6. THE SERVER AND CLIENT USED DIFFERENT DATA
useEffect(() => { fetch('/api/me').then(setUser); }, []);
const [user, setUser] = useState(null);   // ❌ server had a user, client has null
//    Fix: serialize the server's data into the HTML and seed state from it.

// 7. BROWSER EXTENSIONS
//    Not your bug, not fixable in your code. Hydrate into #root, not body.

// 8. HTML MINIFIERS THAT COLLAPSE WHITESPACE
//    A minifier in front of your server can eat the whitespace between inline
//    elements that React expects to be there. Disable whitespace collapsing.`}
      </CodeBlock>

      <h3>The three legitimate escape hatches</h3>

      <CodeBlock language="tsx" title="1. suppressHydrationWarning — narrow, and it does less than you think" showLineNumbers>
{`// For values that are genuinely allowed to differ and that you will correct
// immediately anyway. A timestamp is the canonical example.
<time suppressHydrationWarning dateTime={iso}>
  {new Date(iso).toLocaleString()}
</time>

// What it actually does:
//   - Silences the warning for THIS element's attributes and text content.
//   - Goes exactly ONE LEVEL DEEP. It does not cascade to descendants —
//     you cannot slap it on <body> and make the whole page quiet.
//   - It suppresses the WARNING, not the mismatch. React keeps the SERVER's
//     markup and does not patch it. The wrong time stays on screen until
//     something triggers a re-render.
//
// So it is a companion to a fix, not a fix. If the value must actually be
// correct, you still need the mount effect below.`}
      </CodeBlock>

      <CodeBlock language="tsx" title="2. The mount-effect pattern — for genuinely client-only values" showLineNumbers>
{`import { useState, useEffect } from 'react';

function LocalTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);

  // Effects never run on the server. After the first client render commits,
  // this flips and the SECOND render is free to use browser APIs.
  useEffect(() => setMounted(true), []);

  // First client render === server render. Hydration succeeds. Then we swap.
  if (!mounted) return <time dateTime={iso}>{formatUtc(iso)}</time>;
  return <time dateTime={iso}>{new Date(iso).toLocaleString()}</time>;
}

// Package it once and reuse it:
function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? children : fallback;
}

// <ClientOnly fallback={<ChartSkeleton />}><CanvasChart /></ClientOnly>

// The costs are real, so do not reach for this by default:
//   - Two renders instead of one on every mount.
//   - The content is NOT in the server HTML, so it is invisible to crawlers.
//     Never wrap your <h1> or your meta tags in this.
//   - It causes layout shift unless the fallback reserves the same space.`}
      </CodeBlock>

      <CodeBlock language="tsx" title="3. useSyncExternalStore — the principled version for browser APIs" showLineNumbers>
{`import { useSyncExternalStore } from 'react';

// The THIRD argument is getServerSnapshot. React calls it during SSR and
// during the hydration render, so both sides agree — then subscribes and
// re-renders with the real value. One hook, no mounted flag, no flicker
// beyond the intended correction.
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,  // client snapshot
    () => false,                             // SERVER snapshot — must be stable
  );
}

function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
    () => true,   // assume online on the server
  );
}

// getServerSnapshot MUST return a stable, cached value. Returning a fresh
// object each call causes an infinite render loop.`}
      </CodeBlock>

      <InteractiveChallenge
        question="A component renders a 'Last seen 3 minutes ago' label using new Date(). It hydrates fine locally but throws a hydration error for real users. What is the actual root cause?"
        options={[
          'The component needs to be wrapped in Suspense',
          'The server and client evaluated the date at different moments and in different timezones — the first render must be identical, so the time must come from a prop and be localized after mount',
          'useEffect is not supported during SSR, so the label must move to a Server Component',
          'suppressHydrationWarning on the parent div will resolve it correctly',
        ]}
        correctIndex={1}
        explanation="Any value that changes between the server render and the client render breaks hydration, and time is the worst offender because it differs both in the instant it was sampled and in the timezone used to format it. It passes locally because your dev server and browser share a clock and a timezone. The fix is to pass a fixed ISO timestamp down as a prop, render a stable server-safe format during the first client render, and only switch to the localized relative format inside an effect. suppressHydrationWarning is wrong here on its own — it silences the warning but keeps the server's markup, so the label would just stay stale."
        language="tsx"
        code={`function LastSeen() {
  const ago = Math.floor((Date.now() - lastSeenAt) / 60000);
  return <span>Last seen {ago} minutes ago</span>;
}`}
      />

      <h2>Streaming SSR with <code>&lt;Suspense&gt;</code></h2>

      <p>
        Non-streaming SSR is all-or-nothing: your time to first byte is your slowest query. Streaming
        splits the document into a <strong>shell</strong> — everything not inside a suspended
        boundary — and the boundaries, which are flushed later as their data arrives.
      </p>

      <FlowChart
        title="Out-of-order streaming"
        chart={"graph TD\n  A[Render begins] --> B[Shell completes - header, nav, layout]\n  B --> C[Flush shell + fallback markers immediately]\n  C --> D[Browser paints skeletons - TTFB is now shell-only]\n  D --> E[Slow boundaries keep resolving on the server]\n  E --> F[Reviews resolve at 800ms]\n  E --> G[Stats resolve at 200ms]\n  G --> H[Append hidden div + inline swap script]\n  F --> H\n  H --> I[Inline script moves content into the right slot]\n  I --> J[Order of arrival does not matter]\n  style D fill:#1a3329\n  style J fill:#1a2744"}
      />

      <CodeBlock language="html" title="The wire format — how the swap physically happens">
{`<!-- 1. Shell flushes first. The comment is React's boundary marker, and
        the fallback is real markup the user sees right now. -->
<div id="root">
  <h1>Dashboard</h1>
  <!--$?--><template id="B:0"></template><div class="skeleton">Loading…</div><!--/$-->
</div>

<!-- 2. ...500ms later, on the SAME response, React appends the real content
        somewhere harmless — hidden, at the end of the body. -->
<div hidden id="S:0">
  <table><!-- the actual stats --></table>
</div>

<!-- 3. ...followed by a tiny inline script React ships in the bootstrap.
        $RC = "Reveal Completed boundary": move S:0 into B:0's slot,
        delete the fallback, delete the hidden div. -->
<script>$RC("B:0","S:0")</script>

<!-- This is why arrival ORDER is irrelevant. Each chunk carries its own
     destination, so a boundary that resolves in 200ms is revealed before one
     that started earlier and resolves in 800ms. Nothing blocks on document
     order the way a classic streamed template would. -->`}
      </CodeBlock>

      <CodeBlock language="tsx" title="Boundary placement determines what the user sees first" showLineNumbers>
{`// ❌ One boundary around everything: back to all-or-nothing.
//    The whole page is a skeleton until the slowest query returns.
<Suspense fallback={<PageSkeleton />}>
  <Header /><Stats /><Feed /><Recommendations />
</Suspense>

// ❌ A boundary around every leaf: a page of independently flickering
//    spinners popping in at random. Technically fast, feels broken.
{items.map(i => <Suspense key={i.id} fallback={<Row />}><Item id={i.id} /></Suspense>)}

// ✅ Group by what you would draw a skeleton for. Anything NOT wrapped is
//    the shell — so keep the shell cheap and instant.
function Dashboard() {
  return (
    <Layout>
      <Header />                       {/* shell: no await, flushes at once */}
      <Nav />                          {/* shell */}

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />                      {/* 200ms — revealed first */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <Feed />                       {/* 500ms */}
      </Suspense>

      <Suspense fallback={<RecsSkeleton />}>
        <Recommendations />            {/* 2s, below the fold — nobody waits */}
      </Suspense>
    </Layout>
  );
}

// Rules that follow from the mechanism:
//   - TTFB is gated on the slowest thing in the SHELL. One stray await in a
//     layout component destroys streaming for the entire page.
//   - Nested boundaries reveal outside-in. An inner boundary cannot appear
//     before the outer one that contains it.
//   - Fallbacks must reserve the same dimensions as the real content, or
//     every reveal is a layout shift.
//   - Content above the fold deserves fewer boundaries; content below the
//     fold deserves more.`}
      </CodeBlock>

      <h3>Selective hydration</h3>

      <InfoBox variant="tip" title="Suspense boundaries are also hydration boundaries">
        <p>
          Without <code>&lt;Suspense&gt;</code>, hydration is one atomic pass over the whole tree —
          nothing on the page is interactive until all of it is. Each boundary breaks that up: React
          hydrates them independently, and can begin hydrating one boundary before another
          boundary&apos;s HTML has even arrived.
        </p>
        <p style={{ marginBottom: 0 }}>
          The clever part is prioritization. If the user clicks inside a boundary that has not been
          hydrated yet, React <strong>captures the event</strong>, jumps that boundary to the front of
          the queue, hydrates it, and then <strong>replays the event</strong> against the
          now-interactive tree. The click is not lost. This is why the correct answer to &quot;my
          page feels dead for a moment&quot; is usually &quot;add Suspense boundaries&quot; rather
          than &quot;ship less HTML&quot;.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Streaming gotchas that only appear in production">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Buffering proxies erase every benefit.</strong> A CDN, nginx, or a compression
            middleware that buffers the full response before forwarding turns your stream back into{' '}
            <code>renderToString</code> with extra steps. Check for{' '}
            <code>X-Accel-Buffering: no</code> and confirm chunks actually arrive incrementally.
          </li>
          <li>
            <strong>You cannot change the status code after the shell flushes.</strong> Headers are
            gone the moment you call <code>pipe</code>. Decide 404 versus 200 inside the shell, which
            is exactly why the thing that determines the status must not be behind a boundary.
          </li>
          <li>
            <strong>Crawlers and static export need <code>onAllReady</code> / <code>allReady</code>.</strong>{' '}
            The reveal depends on inline scripts; a consumer that does not execute them sees only
            fallbacks.
          </li>
          <li>
            <strong>Always <code>abort</code> on a timeout.</strong> Otherwise one hung upstream
            request holds a connection open indefinitely.
          </li>
        </ul>
      </InfoBox>

      <h2>SSR Is Not RSC</h2>

      <p>
        These get conflated constantly, including in job interviews. They are orthogonal technologies
        that happen to both involve a server, and they solve different problems.
      </p>

      <CodeBlock language="text" title="The distinction, precisely">
{`                        SSR                          React Server Components
                        ─────────────────────────    ──────────────────────────
Age                     Since 2015                   Since React 18/19
Output                  HTML                         A serialized element tree
                                                     (the "RSC payload"/flight)
Purpose                 Fast first paint, SEO        Delete code from the bundle,
                                                     fetch data at the source
Does the component      YES — every SSR'd component  NO — Server Component code
ship to the browser?    is ALSO in the client        never reaches the browser
                        bundle and runs AGAIN
                        during hydration
Hydrated?               Yes, all of it               Server Components are never
                                                     hydrated. Only the Client
                                                     Components inside them are.
Can hold state?         Yes (it is a normal          No — no state, no effects,
                        component)                   no event handlers
Needs a framework?      No — renderToPipeableStream  Yes — RSC is a protocol a
                        + hydrateRoot is enough      bundler must implement`}
      </CodeBlock>

      <InfoBox variant="danger" title="&quot;use client&quot; does not mean client-only">
        <p>
          This is the single most common misconception in the whole topic.{' '}
          <code>&quot;use client&quot;</code> marks a component as part of the{' '}
          <em>client bundle</em> — it says &quot;this code ships to the browser and hydrates&quot;. It
          does <strong>not</strong> say &quot;skip this on the server&quot;.
        </p>
        <p style={{ marginBottom: 0 }}>
          Client Components are still <strong>server-rendered</strong> to produce the initial HTML.
          That is why a Client Component that touches <code>window</code> at the top level still
          crashes your server, and why Client Components are still subject to every hydration
          mismatch rule in this lesson. If you want something to truly never render on the server,
          you need the <code>ClientOnly</code> mount-effect pattern above.
        </p>
      </InfoBox>

      <FlowChart
        title="How they compose in one Next.js App Router request"
        chart={"graph TD\n  A[Request] --> B[RSC render: Server Components execute]\n  B --> C[Server Component code stays on the server forever]\n  B --> D[Produces RSC payload with holes for Client Components]\n  D --> E[SSR pass: render Client Components to HTML]\n  E --> F[Response: HTML + RSC payload + bundle tags]\n  F --> G[Browser paints HTML instantly]\n  G --> H[Bundle loads - hydrateRoot]\n  H --> I[ONLY Client Component islands hydrate]\n  I --> J[RSC payload reconciles the tree - no refetch]\n  style C fill:#1a3329\n  style G fill:#1a2744\n  style I fill:#3d2f14"}
      />

      <InteractiveChallenge
        question={'A component marked "use client" calls localStorage.getItem() directly in its function body. It works in a Vite SPA but crashes with "localStorage is not defined" after moving to Next.js App Router. Why?'}
        options={[
          'The "use client" directive was placed on the wrong line — it must be inside the component',
          'Next.js strips browser globals from Client Components for security',
          'Client Components are still server-rendered to produce the initial HTML, so the component body executes in Node where localStorage does not exist',
          'localStorage requires a Server Action to be accessed from a Client Component',
        ]}
        correctIndex={2}
        explanation={'"use client" is a bundling boundary, not an execution boundary. It means the component ships to the browser and hydrates — but the initial HTML still has to come from somewhere, and that somewhere is a server render of that exact component. Anything in the render path runs in Node first. Move the localStorage read into a useEffect (effects never run on the server), or read it through useSyncExternalStore with a getServerSnapshot that returns a safe default.'}
        language="tsx"
        code={`"use client";
export function ThemeToggle() {
  const theme = localStorage.getItem('theme') ?? 'light';
  return <button>{theme}</button>;
}`}
      />

      <h2>Where Frameworks Fit</h2>

      <p>
        Raw React gives you two functions: something that turns a tree into HTML, and{' '}
        <code>hydrateRoot</code>. Everything between them you would have to build yourself — and the
        list is longer than it looks.
      </p>

      <InfoBox variant="note" title="What a framework is actually doing for you">
        <ul style={{ marginBottom: 0 }}>
          <li><strong>Isomorphic routing</strong> — matching the URL identically on both sides, so the first client render agrees with the server.</li>
          <li><strong>Data loading</strong> — fetching before or during render, then serializing the result into the HTML so the client does not refetch and mismatch.</li>
          <li><strong>Two builds</strong> — a server bundle and a client bundle from one source tree, with the right externals on each.</li>
          <li><strong>Asset manifests</strong> — knowing which hashed chunks this route needs, so it can emit the right <code>&lt;script&gt;</code> and <code>&lt;link rel=&quot;preload&quot;&gt;</code> tags. Without this, code splitting and streaming actively fight each other.</li>
          <li><strong>Head management</strong> — getting <code>&lt;title&gt;</code> and <code>og:</code> tags into the shell, which is the entire SEO argument.</li>
          <li><strong>Caching and revalidation</strong> — because rendering every request from scratch is how you get a large server bill.</li>
        </ul>
      </InfoBox>

      <CodeBlock language="text" title="The landscape">
{`Next.js App Router      RSC + streaming SSR + file routing. The reference
                        implementation of Server Components; if you are
                        learning RSC, you are learning it here.

Next.js Pages Router    Classic SSR/SSG via getServerSideProps and
                        getStaticProps. No RSC. Still very widely deployed.

React Router v7         The merger of Remix into React Router. "Framework
(framework mode)        mode" gives SSR with loaders and actions built on
                        web-standard Request/Response, so it runs on Node or
                        edge. RSC support is newer and opt-in. The most
                        natural upgrade path if you already have a React
                        Router SPA.

TanStack Start          SSR + typed server functions on TanStack Router and
                        Vite. Full-document type safety is the selling point.

Astro                   Static-first with islands; React is one renderer
                        among several. Excellent for content sites, a poor
                        fit for app-shaped UIs.

Vite SPA                No SSR at all. vite build emits static assets and
(this site)             everything renders in the browser. Correct choice
                        for anything behind a login.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Practical advice">
        <p style={{ marginBottom: 0 }}>
          Do not hand-roll SSR for a product. The functions are easy; the manifest, routing, and
          data-serialization plumbing around them is where months disappear. Do hand-roll it{' '}
          <em>once</em>, on a toy — an Express server, <code>renderToPipeableStream</code>,{' '}
          <code>hydrateRoot</code>, and one deliberate hydration mismatch — because after that,
          every framework&apos;s docs stop being magic and start being a list of decisions you
          recognize.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Related lesson">
        <p style={{ marginBottom: 0 }}>
          For Server Components, Server Actions, the <code>&quot;use client&quot;</code> /{' '}
          <code>&quot;use server&quot;</code> composition rules, <code>cache()</code>, and caching or
          revalidation strategy, see{' '}
          <a href="/react18/server">Server Components &amp; Actions</a>. This lesson covers the
          rendering and hydration layer those features sit on top of.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
