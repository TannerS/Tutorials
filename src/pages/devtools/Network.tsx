import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsNetwork() {
  return (
    <LessonLayout
      title="Network: Reading the Waterfall"
      sectionId="devtools"
      lessonIndex={3}
      prev={{ path: '/devtools/breakpoints', label: 'Breakpoints & the Sources Panel' }}
      next={{ path: '/devtools/performance', label: 'Performance: Flame Charts & Long Tasks' }}
    >
      <p>
        The Network panel answers two different questions, and people usually only ask the
        first: <em>what did the server send back?</em> The second —{' '}
        <em>why did it take that long?</em> — is in the waterfall, and that is where the
        actual performance information lives.
      </p>

      <h2>Before You Record Anything</h2>
      <CodeBlock language="text" title="Three settings that change what you see">
{`Preserve log     keep requests across navigations. Without it, a redirect
                 or a form submit wipes the evidence you were about to read.

Disable cache    while DevTools is open, force every request to the network.
                 ESSENTIAL — otherwise you are measuring your own warm cache
                 and will conclude the site is fast when it is not.

Throttling       "Fast 4G" / "Slow 4G" / "Offline", or a custom profile.
                 Your laptop on office wifi is not the user. Most
                 waterfall problems are invisible until you throttle.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Test with the cache disabled AND throttled, or you are measuring yourself">
        <p>
          A repeat visit on a fast connection hides nearly every loading problem: the
          render-blocking CSS is cached, the font is cached, the waterfall is three
          requests deep instead of twelve. Turn on <strong>Disable cache</strong> and{' '}
          <strong>Slow 4G</strong> and reload — the ordering problems become obvious
          immediately.
        </p>
      </InfoBox>

      <h2>The Columns Worth Reading</h2>
      <CodeBlock language="text" title="Right-click the header row to add these">
{`Status      200, 304 (not modified — served from cache after a check),
            and the grey ones: "(disk cache)" / "(memory cache)" /
            "(prefetch cache)" mean no network request happened at all

Type        document, stylesheet, script, fetch/xhr, font, img

Initiator   WHAT CAUSED THIS REQUEST. Hover it for the JS stack.
            The single most useful column and it is off by default in
            some layouts.

Size        transferred / resource. A big gap = compression working.
            "(disk cache)" here means zero bytes crossed the network.

Time        total duration
Waterfall   the timing bar — see below

Priority    Highest/High/Medium/Low. The browser's own guess at what
            matters. A late-discovered hero image sitting at Low is a
            common, fixable problem.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Initiator answers &quot;where is this request coming from?&quot;">
        <p>
          A mystery request — an analytics call, a duplicate API hit, a font you thought
          you removed — is explained by the Initiator column. Hovering shows the full
          JavaScript stack that caused it, and clicking jumps to the line. Combined with
          an <a href="/devtools/breakpoints">XHR breakpoint</a> you can find the
          responsible component in under a minute.
        </p>
      </InfoBox>

      <h2>The Waterfall: Where the Time Actually Went</h2>
      <p>
        Click any request and open the <strong>Timing</strong> tab. The bar is not one
        number — it is a sequence of phases, and which phase is long tells you what to
        fix.
      </p>

      <CodeBlock language="text" title="The phases, and what a long one means">
{`Queueing          waiting for a connection slot or a higher-priority
                  request. Long queueing = too many parallel requests,
                  or this one was deprioritised.

Stalled           blocked before the request could start.

DNS Lookup        resolving the hostname. Fixable with preconnect /
                  dns-prefetch for a known third-party origin.

Initial connection + SSL
                  TCP handshake and TLS. Paid once per ORIGIN — which is
                  the whole argument against spreading assets across many
                  hosts, and the argument FOR preconnect.

Request sent      negligible, unless the body is large.

Waiting (TTFB)    the server thinking. THIS IS A BACKEND NUMBER.
                  No amount of frontend work will shorten it.

Content Download  streaming the bytes. Long = the file is big, or the
                  connection is slow. Compression and code-splitting
                  live here.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The diagnosis shortcut">
        <p style={{ marginBottom: 0 }}>
          <strong>Long TTFB</strong> → a server or database problem; stop optimising the
          frontend. <strong>Long Content Download</strong> → the asset is too big; split,
          compress, or defer it. <strong>Long Queueing/Stalled</strong> → a priority or
          concurrency problem; something more important is in front of it. These three
          point at three different teams.
        </p>
      </InfoBox>

      <h2>Reading the Shape of the Waterfall</h2>
      <p>
        Zoom out and look at the <em>pattern</em> rather than individual rows. Two shapes
        matter:
      </p>
      <CodeBlock language="text" title="Parallel is healthy. A staircase is a bug.">
{`HEALTHY — requests start together, the browser saturates the connection:

  index.html    ████
  app.css         ████
  app.js          ██████
  logo.svg        ███

CHAIN — each request only starts when the previous one FINISHES. Total
time is the SUM, not the max. This is the single worst loading pattern:

  index.html    ████
  app.js            ██████
  config.json             ████
  user.json                   ████
  avatar.png                      ███

// A chain means something only became discoverable after the previous
// response arrived: a CSS file that @imports another, JS that fetches a
// config before it can fetch data, a font referenced from inside CSS.
// preload breaks the chain by making the resource discoverable early —
// see the HTML metadata lesson.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The vertical lines are the page-load milestones">
        <p style={{ marginBottom: 0 }}>
          The blue line is <code>DOMContentLoaded</code> (HTML parsed, deferred scripts
          run) and the red line is <code>load</code> (every subresource done). Anything
          far to the right of the red line is lazy-loaded or triggered by user code.
          Requests clustered <em>before</em> the blue line are on your critical path —
          that is the set to attack.
        </p>
      </InfoBox>

      <h2>Practical Features People Miss</h2>
      <CodeBlock language="text" title="All available from the panel or its right-click menus">
{`Filter box       plain text, or:
                   status-code:404   method:POST   larger-than:100k
                   -domain:analytics.com    (minus to exclude)
                 Plus the type chips: Fetch/XHR, JS, CSS, Img, Doc.

Right-click a request:
  Copy as fetch       paste into the Console and replay it, edited
  Copy as cURL        reproduce it outside the browser entirely —
                      the fastest way to prove a bug is server-side
  Block request URL   simulate a failed asset or a dead third party
  Replay XHR

Network request blocking pane   block by pattern, e.g. *.woff2 to see
                                the page without your webfonts

Import/Export HAR   save a whole session to a file and attach it to a
                    bug report. Someone else can load it and see exactly
                    what you saw.`}
      </CodeBlock>

      <InfoBox variant="tip" title="&quot;Copy as cURL&quot; settles frontend-vs-backend arguments">
        <p style={{ marginBottom: 0 }}>
          Copy the failing request as cURL, run it in a terminal. If it fails there too,
          it is not your code. If it succeeds there and fails in the browser, the
          difference is something the browser adds — cookies, an{' '}
          <code>Origin</code> header, or CORS. That single comparison is the fastest way
          to localise a request bug, and it matches the CORS failure mode in{' '}
          <a href="/browser-runtime/fetch">fetch, CORS &amp; the Request Lifecycle</a>:
          the server responded fine and the browser hid it from you.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
