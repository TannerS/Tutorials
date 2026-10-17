import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlDocument() {
  return (
    <LessonLayout
      title="The Document, head & Metadata"
      sectionId="html"
      lessonIndex={0}
      prev={null}
      next={{ path: '/html/semantics', label: 'Semantic Structure & Text Elements' }}
    >
      <p>
        If you have been writing React, you have probably not written an{' '}
        <code>&lt;html&gt;</code> tag in a while — Vite generated one{' '}
        <code>index.html</code> and you never opened it again. That file is still the
        thing the browser receives first, and everything about how fast your app feels
        starts there. This lesson is the part of HTML you own even in a single-page app.
      </p>

      <p>
        Everything below was checked in a real Chromium (149) rather than quoted from the
        spec, because the interesting parts of this topic are all browser behaviour.
      </p>

      <h2>The Minimum Viable Document</h2>
      <p>
        Five lines do real work. Nothing here is boilerplate you can drop without a
        consequence:
      </p>

      <CodeBlock language="html" title="index.html — every line earning its place">
{`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoices — Acme</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`}
      </CodeBlock>

      <ul>
        <li>
          <code>&lt;!doctype html&gt;</code> — not a version declaration, a{' '}
          <strong>mode switch</strong>. Omit it and the browser enters{' '}
          <em>quirks mode</em>, where it deliberately emulates 1990s layout behaviour.
          Measured below — it is not subtle.
        </li>
        <li>
          <code>lang="en"</code> — screen readers pick a pronunciation engine from it, and
          browsers pick hyphenation and quote styles. One attribute, and it is wrong far
          more often than it is missing, because templates get copied between projects.
        </li>
        <li>
          <code>meta charset</code> — must appear in the{' '}
          <strong>first 1024 bytes</strong> of the document. The parser has to decide how
          to decode bytes into text before it can read much of anything, so this goes
          first, before <code>&lt;title&gt;</code>.
        </li>
        <li>
          <code>meta viewport</code> — without it, a phone pretends to be a ~980px-wide
          desktop and scales the result down. Every media query you write is then
          evaluated against that fake width, so your responsive CSS silently does nothing.
        </li>
        <li>
          <code>&lt;title&gt;</code> — the browser tab, the bookmark name, the search
          result heading, and the first thing a screen reader announces on page load.
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — Chromium 149, reading the parsed document back">
{`<meta charset="utf-8"> ... document.characterSet
  -> "UTF-8"

<meta name=viewport content="width=device-width, initial-scale=1">
  -> "width=device-width, initial-scale=1"`}
      </CodeBlock>

      <InfoBox variant="warning" title="The doctype is a one-line bug — measured, because the usual story is out of date">
        <p>
          Quirks mode is not a historical curiosity; it is one missing line away in any
          hand-built page or email template. Two identical files, served over HTTP,
          differing only in that first line:
        </p>
        <CodeBlock language="text" title="Real output — Chromium 149, 800×600 viewport, same CSS both times">
{`                                  with doctype    without doctype
document.compatMode               "CSS1Compat"    "BackCompat"

div { height: 50% }                      18px             300px
  (parent has auto height, so standards mode cannot resolve the
   percentage and falls back to content height. Quirks resolves it
   against the viewport: 50% of 600px.)

<img> alone in a <td>, cell height       34px              30px
  (standards mode sits the image on the text baseline and leaves
   4px of descender space under it — the classic mystery gap.
   Quirks mode removes it.)

div { width:200px; padding:20px; border:5px }
  rendered width                        250px             250px
  (NOT a difference. The famous "quirks uses border-box" claim
   did not reproduce in Chromium 149 — both are content-box.)`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Note the last one. &quot;Quirks mode changes the box model&quot; is the version
          of this fact that everyone repeats, and it did not hold when checked. The
          differences that <em>did</em> show up are percentage-height resolution and the
          table-cell image gap. If a layout is inexplicably wrong, read{' '}
          <code>document.compatMode</code> in the console first —{' '}
          <code>"CSS1Compat"</code> is standards, <code>"BackCompat"</code> is quirks.
        </p>
      </InfoBox>

      <h2>What <code>head</code> Is For, and Why Order Matters</h2>
      <p>
        <code>&lt;head&gt;</code> is not a junk drawer. The parser works through it
        top-to-bottom before it paints anything, so the order of what you put there is
        the order the browser does work in.
      </p>

      <FlowChart
        title="What the parser does with head, in order"
        chart={"graph TD\n  A[\"bytes arrive\"] --> B[\"meta charset: decide the encoding\"]\n  B --> C[\"link rel=stylesheet: BLOCKS rendering until fetched\"]\n  C --> D[\"script (no attribute): BLOCKS parsing, runs immediately\"]\n  D --> E[\"script defer / type=module: parse continues, runs after\"]\n  E --> F[\"body parsed, DOM built\"]\n  F --> G[\"first paint\"]\n  style C fill:#3d2f14,stroke:#d97706\n  style D fill:#3b1a1a,stroke:#f87171\n  style E fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="html" title="The three script loading modes — the only one you usually want is the last">
{`<!-- 1. BLOCKING. Parsing stops, the file downloads, it runs, parsing resumes.
        A slow network here means a blank page. Almost never what you want. -->
<script src="/a.js"></script>

<!-- 2. async: downloads in parallel, runs THE MOMENT it arrives — which means
        execution order between two async scripts is whichever lands first.
        Fine for genuinely independent things (analytics). Bad for anything
        with a dependency. -->
<script async src="/analytics.js"></script>

<!-- 3. defer: downloads in parallel, runs after the document is parsed, and
        multiple defer scripts run IN DOCUMENT ORDER. This is the sane default.
        type="module" is defer by default — which is why the Vite tag works
        without the attribute. -->
<script defer src="/app.js"></script>
<script type="module" src="/src/main.tsx"></script>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Stylesheets block rendering — and that is deliberate">
        <p>
          A <code>&lt;link rel="stylesheet"&gt;</code> in <code>head</code> blocks the
          first paint until it loads. That sounds like a bug and is actually a feature:
          the alternative is painting unstyled HTML and then re-painting it, which is the
          flash of unstyled content. The fix is never &quot;move CSS to the bottom&quot;;
          it is to send less blocking CSS.
        </p>
      </InfoBox>

      <h2>Metadata You Will Actually Be Asked For</h2>
      <p>
        Two groups, and they are not the same thing. Search engines read the standard{' '}
        <code>meta</code> tags; social platforms read Open Graph, which is a separate
        vocabulary that happens to use the same element.
      </p>

      <CodeBlock language="html" title="The set worth memorising">
{`<!-- Search -->
<meta name="description" content="One or two sentences. Shown in results." />
<link rel="canonical" href="https://acme.com/invoices" />

<!-- Open Graph: Slack, iMessage, LinkedIn, Facebook. NOT a standard, but
     universally honoured. og:image is the one everybody forgets, and it is
     the only one anyone actually notices. -->
<meta property="og:title"       content="Invoices — Acme" />
<meta property="og:description" content="Track and send invoices." />
<meta property="og:image"       content="https://acme.com/card.png" />
<meta property="og:url"         content="https://acme.com/invoices" />

<!-- Twitter/X reads og:* as a fallback, so you usually only need this one -->
<meta name="twitter:card" content="summary_large_image" />

<!-- Icons -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`}
      </CodeBlock>

      <InfoBox variant="danger" title="In a single-page app, none of this updates itself">
        <p>
          Everything above is static text in one HTML file. Client-side routing changes
          the URL without reloading the document, so <code>&lt;title&gt;</code> and every{' '}
          <code>meta</code> tag still describe the page the user first landed on. A
          crawler that does not execute JavaScript sees only that first version.
        </p>
        <p style={{ marginBottom: 0 }}>
          That is the whole reason server-side rendering and metadata APIs exist. In
          React Router v7+ framework mode you export a <code>meta</code> function per
          route; in plain React you set <code>document.title</code> in an effect. Either
          way it is a thing you have to do on purpose — see{' '}
          <a href="/react-router-v8/data">Data Loading &amp; Actions</a> and{' '}
          <a href="/react18/ssr-hydration">SSR &amp; Hydration</a>.
        </p>
      </InfoBox>

      <h2>Resource Hints, Briefly</h2>
      <p>
        These tell the browser about work it cannot discover on its own yet. Reach for
        them when a profile shows a late-discovered critical resource — not by default,
        because each one spends bandwidth on a guess.
      </p>

      <CodeBlock language="html" title="Four hints, in rough order of how often they are worth it">
{`<!-- preconnect: open the TCP+TLS connection now. Best single win for a
     third-party origin you KNOW you will hit (fonts, an API host). -->
<link rel="preconnect" href="https://api.acme.com" />

<!-- preload: fetch a specific file at high priority. Needed for things the
     parser cannot see, like a font referenced from inside a CSS file.
     "as" is mandatory — without it the browser may fetch it twice. -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- dns-prefetch: just the DNS lookup. A cheaper, weaker preconnect. -->
<link rel="dns-prefetch" href="https://cdn.acme.com" />

<!-- prefetch: fetch at LOW priority for a probable NEXT navigation.
     Wrong for anything the current page needs. -->
<link rel="prefetch" href="/dashboard-chunk.js" />`}
      </CodeBlock>

      <InfoBox variant="warning" title="A preload you do not use is worse than no preload">
        <p>
          Preloading something the page never requests spends bandwidth competing with
          resources it does need, and Chromium will tell you so in the console:{' '}
          <em>&quot;The resource … was preloaded using link preload but not used within
          a few seconds.&quot;</em> Treat that warning as a real bug — it means you are
          paying for a download twice over, once in bytes and once in contention.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
