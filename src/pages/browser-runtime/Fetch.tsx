import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserFetch() {
  return (
    <LessonLayout
      title="fetch, CORS & the Request Lifecycle"
      sectionId="browser-runtime"
      lessonIndex={6}
      prev={{ path: '/browser-runtime/lifecycle', label: 'Page Lifecycle & Cross-Context Events' }}
      next={{ path: '/browser-runtime/field-guide', label: 'Browser Runtime Field Guide' }}
    >
      <p>
        Two things about <code>fetch</code> cause most of the confusion: it does{' '}
        <strong>not</strong> reject on HTTP errors, and CORS failures look like network
        failures. Both were measured below across two real origins.
      </p>

      <h2>The Error Model — The One Everyone Gets Wrong</h2>
      <CodeBlock language="text" title="Real output — a 500, a 404 and a 200, all with CORS headers">
{`HTTP_500   RESOLVED  res.ok=false  status=500
HTTP_404   RESOLVED  res.ok=false  status=404
HTTP_200   RESOLVED  res.ok=true   status=200`}
      </CodeBlock>

      <p>
        A server error is <strong>a successful fetch</strong>. The request went out, a
        response came back — <code>fetch</code> considers that a win. It only rejects when
        there is <em>no response at all</em>: DNS failure, connection refused, the request
        blocked by CORS, or an abort.
      </p>

      <CodeBlock language="javascript" title="So every fetch needs two checks, not one">
{`// BROKEN: a 500 walks straight into the success path, and res.json()
// throws a confusing SyntaxError on the HTML error page.
const data = await (await fetch(url)).json();

// CORRECT:
const res = await fetch(url);          // throws only on NETWORK failure
if (!res.ok) {                          // 4xx/5xx land here
  throw new Error('HTTP ' + res.status);
}
const data = await res.json();          // throws if the body is not JSON`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the correct pattern against the same 500">
{`caught: HTTP 500`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why React Query exists, in one paragraph">
        <p style={{ marginBottom: 0 }}>
          Every real fetch needs: the <code>res.ok</code> check, a loading flag, an error
          flag, cancellation on unmount, a retry policy, and dedupe when two components
          ask for the same thing. That is the list{' '}
          <a href="/react-query/fundamentals">React Query</a> implements. Knowing what it
          is doing is the reason to learn this layer — not so you hand-roll it.
        </p>
      </InfoBox>

      <h2>The Request</h2>
      <CodeBlock language="javascript" title="The options you will actually use">
{`const res = await fetch('/api/invoices', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ total: 99 }),

  credentials: 'same-origin',  // 'omit' | 'same-origin' (default) | 'include'
                               // 'include' sends cookies CROSS-ORIGIN —
                               // required for a cookie-auth API on another host
  signal: controller.signal,   // for cancellation
  cache: 'no-store',           // bypass the HTTP cache entirely
  redirect: 'follow',          // 'follow' | 'error' | 'manual'
  mode: 'cors',                // 'cors' (default) | 'same-origin' | 'no-cors'
});

// Reading the body — pick ONE, it can only be read once:
await res.json();  await res.text();  await res.blob();
await res.formData();  await res.arrayBuffer();`}
      </CodeBlock>

      <InfoBox variant="warning" title="A response body can only be consumed once">
        <p>
          Calling <code>res.json()</code> after <code>res.text()</code> throws{' '}
          <em>&quot;body stream already read&quot;</em>. This bites in error handling,
          where you want to read the body for a message after already trying to parse it.
          Use <code>res.clone()</code> before the first read, or read as text once and{' '}
          <code>JSON.parse</code> yourself.
        </p>
      </InfoBox>

      <h2>CORS — Why Your Request Failed With No Status</h2>
      <p>
        CORS is enforced by the <strong>browser</strong>, not the server. The server
        answers normally; the browser then refuses to hand the response to your
        JavaScript unless the server opted in with headers. That is why a request that
        works in Postman fails in a page.
      </p>

      <FlowChart
        title="Simple request vs preflighted request"
        chart={"graph TD\n  A[\"fetch() to another origin\"] --> B{\"Is it a SIMPLE request?\\nGET/HEAD/POST +\\nonly safelisted headers\"}\n  B -->|yes| C[\"request is SENT\"]\n  B -->|no| D[\"OPTIONS preflight sent FIRST\"]\n  D --> E{\"Does the preflight reply allow\\nthe method and headers?\"}\n  E -->|no| F[\"blocked — the real request\\nis NEVER sent\"]\n  E -->|yes| C\n  C --> G{\"Does the response carry\\nAccess-Control-Allow-Origin?\"}\n  G -->|no| H[\"TypeError: Failed to fetch\\nthe server DID respond —\\nthe browser hid it from you\"]\n  G -->|yes| I[\"your code gets the response\"]\n  style F fill:#3b1a1a,stroke:#f87171\n  style H fill:#3b1a1a,stroke:#f87171\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="text" title="Real output — two origins, one with CORS headers and one without">
{`page served from http://localhost:4488
API  served from http://localhost:4499

fetch(API + '/nocors')    -> THREW TypeError: Failed to fetch
   // The server returned 200 with a body. The browser discarded it
   // because there was no Access-Control-Allow-Origin header.
   // Note what you DON'T get: a status, a body, any detail at all.

fetch(API + '/allowed')   -> resolved status 200
   // Same server, same body. One response header different.

fetch(API + '/allowed-put', { method: 'PUT',
      headers: { 'Content-Type': 'application/json' } })
                          -> resolved status 200
   // This one sent an OPTIONS preflight first. The server answered it
   // with Allow-Methods: PUT and Allow-Headers: content-type.`}
      </CodeBlock>

      <InfoBox variant="danger" title="You cannot fix CORS in the frontend">
        <p>
          There is no fetch option, header, or trick that makes a server allow you. The
          header has to come from the server. The three real options:
        </p>
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Add the headers server-side</strong> — if it is your API, this is the
            answer.
          </li>
          <li>
            <strong>Proxy it.</strong> In development, Vite&apos;s{' '}
            <code>server.proxy</code> makes <code>/api/*</code> same-origin from the
            browser&apos;s point of view, so CORS never applies. In production the same
            job is done by your reverse proxy or CDN.
          </li>
          <li>
            <strong><code>mode: 'no-cors'</code> is not a workaround.</strong> It returns
            an <em>opaque</em> response: status <code>0</code>, no headers, unreadable
            body. Useful for fire-and-forget beacons, useless for data.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="The preflight gotchas">
        <ul style={{ marginBottom: 0 }}>
          <li>
            A <strong>custom header</strong> (<code>Authorization</code>,{' '}
            <code>X-Request-Id</code>) turns a simple request into a preflighted one. So
            adding an auth header to a working GET can suddenly break it — the server now
            needs to answer <code>OPTIONS</code> too.
          </li>
          <li>
            <code>Content-Type: application/json</code> is <strong>not</strong>{' '}
            safelisted. Only <code>text/plain</code>,{' '}
            <code>application/x-www-form-urlencoded</code> and{' '}
            <code>multipart/form-data</code> are. Nearly every JSON POST is preflighted.
          </li>
          <li>
            With <code>credentials: 'include'</code>, the server may{' '}
            <strong>not</strong> reply <code>Access-Control-Allow-Origin: *</code> — it
            must name your exact origin and add{' '}
            <code>Access-Control-Allow-Credentials: true</code>.
          </li>
        </ul>
      </InfoBox>

      <h2>Cancellation</h2>
      <CodeBlock language="javascript" title="AbortController — and the React pattern">
{`const ac = new AbortController();
fetch(url, { signal: ac.signal });
ac.abort();        // the promise rejects with an AbortError

// In React this is the fix for the race where a fast second request
// resolves before a slow first one and the stale result wins:
useEffect(() => {
  const ac = new AbortController();

  fetch('/api/search?q=' + q, { signal: ac.signal })
    .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
    .then(setResults)
    .catch(e => { if (e.name !== 'AbortError') setError(e); });
    //            ^ an abort is EXPECTED on every keystroke. Never surface it.

  return () => ac.abort();     // cancels the in-flight request on change
}, [q]);

// AbortSignal.timeout(5000) gives you a request timeout in one line.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — abort">
{`const pr = fetch(url, { signal: ac.signal });
ac.abort();
  -> THREW AbortError`}
      </CodeBlock>

      <InfoBox variant="note" title="The error name is how you tell them apart">
        <p style={{ marginBottom: 0 }}>
          A real failure and a deliberate cancellation both reject. Filtering on{' '}
          <code>e.name !== 'AbortError'</code> is what stops every keystroke from
          rendering an error banner — and forgetting that check is the most common bug in
          hand-written debounced search.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
