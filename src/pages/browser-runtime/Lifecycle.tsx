import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserLifecycle() {
  return (
    <LessonLayout
      title="Page Lifecycle & Cross-Context Events"
      sectionId="browser-runtime"
      lessonIndex={5}
      prev={{ path: '/browser-runtime/storage', label: 'Storage: localStorage, Cookies & IndexedDB' }}
      next={{ path: '/browser-runtime/fetch', label: 'fetch, CORS & the Request Lifecycle' }}
    >
      <p>
        Not every event comes from a user. The page itself fires events as it is hidden,
        frozen, restored and torn down — and other browsing contexts (tabs, iframes,
        workers) fire events at you across a process boundary. Both categories are where
        &quot;it works on my machine but loses data on a phone&quot; lives.
      </p>
      <p>Every output on this page was measured in Chromium.</p>

      <h2>The Teardown Order, Measured</h2>
      <p>
        One same-origin navigation away from a page with a listener on everything:
      </p>
      <CodeBlock language="text" title="Real output — navigating away">
{`["beforeunload:visible",
 "pagehide:visible",
 "visibilitychange:hidden",
 "unload:hidden"]`}
      </CodeBlock>
      <p>
        Note the state in each label: at <code>beforeunload</code> and{' '}
        <code>pagehide</code> the document is still <code>visible</code>, and{' '}
        <code>visibilityState</code> only flips to <code>hidden</code> afterwards. So{' '}
        <code>visibilitychange</code> is <em>not</em> the first warning you get on a
        navigation — but it <em>is</em> the only one you reliably get on mobile.
      </p>

      <InfoBox variant="danger" title="beforeunload and unload are not save hooks">
        <p>
          Both are skipped routinely: when a mobile OS kills the tab to reclaim memory,
          when the user switches apps and never comes back, and whenever the page is put
          into the back/forward cache. An <code>unload</code> listener is worse than
          useless — <strong>registering one disqualifies the page from bfcache
          entirely</strong>, so you pay an instant-back-button regression for a callback
          that may never run.
        </p>
        <p style={{ marginBottom: 0 }}>
          Save on <code>visibilitychange</code> when state becomes{' '}
          <code>hidden</code>, and treat <code>pagehide</code> as the backstop. Keep{' '}
          <code>beforeunload</code> for exactly one thing: the &quot;you have unsaved
          changes&quot; confirmation prompt, registered only while the form is actually
          dirty.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="The pattern that actually persists">
{`// Fires when the tab is backgrounded, the app is switched away from, OR
// the page is navigated away from. This is the one to build on.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});

// Backstop for the cases where the document is being torn down.
window.addEventListener('pagehide', flush);

// NOT this:
// window.addEventListener('unload', flush);      // breaks bfcache
// window.addEventListener('beforeunload', flush); // unreliable, also costs bfcache

function flush() {
  // Must be synchronous-ish: a pending fetch() can be cancelled on teardown.
  navigator.sendBeacon('/api/metrics', JSON.stringify(pending));
  // or: fetch(url, { body, method: 'POST', keepalive: true })
  try { localStorage.setItem('draft', JSON.stringify(state)); } catch {}
}

// Only while dirty, and only for the prompt:
useEffect(() => {
  if (!isDirty) return;
  const warn = (e) => { e.preventDefault(); };   // modern browsers need this
  window.addEventListener('beforeunload', warn);
  return () => window.removeEventListener('beforeunload', warn);
}, [isDirty]);`}
      </CodeBlock>

      <h2>bfcache: Your Page Can Come Back From the Dead</h2>
      <p>
        On a back-button navigation the browser may keep the whole page — DOM, JS heap,
        timers paused — and restore it instead of reloading. That means{' '}
        <strong>your module-level code does not re-run</strong>, and a page that assumed
        &quot;load means fresh&quot; comes back with stale state.
      </p>
      <CodeBlock language="text" title="Real output — pageshow/pagehide across a navigate-and-go-back">
{`["pageshow persisted=false",     <- first load
 "pagehide persisted=false",     <- navigating away
 "pageshow persisted=false",     <- the second page loading
 "pagehide persisted=false",
 "pageshow persisted=false"]     <- the back navigation

Headless Chromium did not use bfcache here, so persisted was false
throughout. The flag is what distinguishes the two cases:
  pageshow  persisted=false -> a normal load; init ran
  pageshow  persisted=true  -> a bfcache RESTORE; nothing re-ran
  pagehide  persisted=true  -> the page went INTO bfcache, not away`}
      </CodeBlock>
      <CodeBlock language="javascript" title="Handling a restore">
{`window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    // Restored from bfcache: nothing re-initialised. Re-check anything
    // time-sensitive — auth tokens, prices, a "live" feed, open sockets.
    refetch();
  }
});

// Was this tab previously discarded by the browser to save memory and
// then re-created when the user returned to it?
if (document.wasDiscarded) restoreFromStorage();`}
      </CodeBlock>

      <FlowChart
        title="Page lifecycle states"
        chart={"graph LR\n  A[\"ACTIVE\\nvisible, focused\"] <--> B[\"PASSIVE\\nvisible, not focused\"]\n  B <--> C[\"HIDDEN\\nvisibilityState = hidden\"]\n  C --> D[\"FROZEN\\ntimers paused\\n('freeze' event)\"]\n  D --> C2[\"resume\"]\n  C2 --> C\n  D --> E[\"DISCARDED\\ntab killed to save memory\"]\n  C --> F[\"TERMINATED\\nunload\"]\n  E -.-> G[\"re-created on return\\ndocument.wasDiscarded = true\"]\n  style C fill:#3d2f14,stroke:#d97706\n  style E fill:#3d1a1a,stroke:#ef4444\n  style F fill:#3d1a1a,stroke:#ef4444"}
      />

      <InfoBox variant="tip" title="The only transition you are guaranteed to see">
        <p style={{ marginBottom: 0 }}>
          Every path out of a live page passes through <strong>hidden</strong>. Discard,
          freeze, app-switch and navigation all go through it; <code>unload</code> is the
          only one that fires afterwards and it is the one that can be skipped. That single
          fact is why <code>visibilitychange</code> is the save hook and everything else is
          a bonus.
        </p>
      </InfoBox>

      <h2>Cross-Context: Four Channels, Different Jobs</h2>
      <CodeBlock language="text" title="Picking one">
{`storage event      other TABS, same origin. Free if you already persist to
                   localStorage. Fires only on OTHER tabs, carries key +
                   oldValue + newValue. See the Storage lesson.

BroadcastChannel   other TABS/workers, same origin. A named bus; no storage
                   involved. Structured-cloneable payloads.

postMessage        a specific WINDOW or IFRAME, possibly cross-origin.
                   The only one that crosses an origin boundary — which is
                   why it is also the one with a security contract.

MessageChannel     a private two-ended pipe you hand to someone (commonly a
                   worker, or an iframe you then stop talking to directly).`}
      </CodeBlock>

      <h2><code>BroadcastChannel</code></h2>
      <CodeBlock language="javascript" title="A named bus between same-origin contexts">
{`// Tab 1
const bus = new BroadcastChannel('room');
bus.postMessage({ hi: 'from tab 1' });

// Tab 2 — same channel name, same origin
const bus = new BroadcastChannel('room');
bus.onmessage = (e) => console.log(e.data);

bus.close();   // always close it; an open channel keeps the context referenced`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — two tabs on the same origin">
{`tab2 received:                       [{"hi":"from tab 1"}, "second"]
SENDER received its own message:     []`}
      </CodeBlock>
      <InfoBox variant="warning" title="The sender does not hear itself">
        <p style={{ marginBottom: 0 }}>
          Measured above: the tab that posted received nothing on its own{' '}
          <code>onmessage</code>. This is the opposite of what people assume from
          pub/sub, and it is usually what you want — but it means a &quot;sync all
          tabs&quot; handler must <strong>also</strong> apply the change locally. If you
          only call <code>postMessage</code> and rely on the handler, the originating tab
          is the one tab that never updates.
        </p>
      </InfoBox>

      <h2><code>postMessage</code> and the Origin Contract</h2>
      <CodeBlock language="text" title="Real output — three posts into a same-origin iframe">
{`frame.postMessage('right-origin', location.origin)   -> DELIVERED
frame.postMessage('wrong-origin', 'https://example.invalid')
                                                     -> SILENTLY DROPPED
frame.postMessage('wildcard', '*')                   -> DELIVERED

received: [
  { data: "right-origin", origin: "http://localhost:4399", sameSource: true },
  { data: "wildcard",     origin: "http://localhost:4399", sameSource: true }
]`}
      </CodeBlock>
      <InfoBox variant="danger" title="Both halves of the contract are yours to enforce">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Sending:</strong> pass a real <code>targetOrigin</code>, never{' '}
            <code>'*'</code>, for anything sensitive. The second argument is a condition —
            if the frame has navigated elsewhere, the browser drops the message rather than
            handing your data to a different origin. With <code>'*'</code> you have waived
            that check. Note that a mismatch is <em>silent</em>: no error, no delivery.
          </li>
          <li>
            <strong>Receiving:</strong> check <code>e.origin</code> against an allowlist on
            every message, before you look at <code>e.data</code>. Anyone can{' '}
            <code>postMessage</code> your window. Checking{' '}
            <code>e.source === expectedFrame</code> as well pins it to the frame you
            actually embedded.
          </li>
        </ul>
      </InfoBox>
      <CodeBlock language="javascript" title="A receiver that is safe to ship">
{`window.addEventListener('message', (e) => {
  if (e.origin !== 'https://widget.example.com') return;   // FIRST line
  if (e.source !== iframeRef.current?.contentWindow) return;
  const msg = e.data;
  if (msg?.type !== 'resize' || typeof msg.height !== 'number') return;
  setHeight(msg.height);
});`}
      </CodeBlock>

      <h2>What Can Cross: Structured Clone</h2>
      <p>
        None of these channels pass references. The payload is{' '}
        <strong>structured-cloned</strong>, which handles far more than JSON — and throws
        on anything holding behaviour or a DOM identity:
      </p>
      <CodeBlock language="text" title="Real output — what survived, and what threw">
{`postMessage({ d: new Date(0), m: new Map(), s: new Set(), u: new Uint8Array() })
  -> ok. Received types: Date, Map, Set, Uint8Array   (NOT stringified)

postMessage({ fn() {} })          -> threw DataCloneError
postMessage({ el: document.body }) -> threw DataCloneError`}
      </CodeBlock>
      <InfoBox variant="note" title="Three things that follow from this">
        <ul style={{ marginBottom: 0 }}>
          <li>
            Dates, Maps, Sets, typed arrays, <code>RegExp</code>, <code>Blob</code> and
            cyclic references all cross intact — so do not pre-serialise with{' '}
            <code>JSON.stringify</code> and lose the types for no reason.
          </li>
          <li>
            Functions, class instances&apos; prototypes, DOM nodes and anything with a
            closure do not. A class instance arrives as a plain object with the right
            fields and none of the methods.
          </li>
          <li>
            It is a <em>copy</em>. Mutating what you received changes nothing on the other
            side. The same algorithm backs <code>structuredClone(value)</code>, which is
            the cheapest correct deep clone in the platform.
          </li>
        </ul>
      </InfoBox>

      <h2><code>MessageChannel</code></h2>
      <CodeBlock language="javascript" title="A private pipe with two ends">
{`const { port1, port2 } = new MessageChannel();

port2.onmessage = (e) => console.log('got', e.data);
port1.postMessage('ping');          // measured: port2 received "ping"

// The point is handing one end away. The port is TRANSFERABLE, so the
// receiver gets the real port, not a copy — note the third argument:
worker.postMessage({ type: 'channel' }, [port2]);

// After transfer, port2 is unusable in THIS context. That is the deal:
// transferring moves ownership instead of cloning.`}
      </CodeBlock>
      <p>
        This is how you get a direct request/response line to a worker or iframe without
        every message going through a shared global <code>onmessage</code> that has to
        demultiplex by a <code>type</code> field. React Query, service-worker clients and
        most RPC-over-postMessage libraries are built on it.
      </p>

      <h2>In React</h2>
      <CodeBlock language="jsx" title="All of these are effects with cleanups">
{`useEffect(() => {
  const ac = new AbortController();

  const onHidden = () => { if (document.visibilityState === 'hidden') flush(); };
  document.addEventListener('visibilitychange', onHidden, { signal: ac.signal });
  window.addEventListener('pagehide', flush,      { signal: ac.signal });

  const bus = new BroadcastChannel('auth');
  bus.onmessage = (e) => { if (e.data === 'logout') logoutLocally(); };

  return () => { ac.abort(); bus.close(); };   // BOTH, or you leak
}, []);`}
      </CodeBlock>
      <InfoBox variant="success" title="Three bugs this chapter prevents">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>&quot;Drafts are lost on mobile.&quot;</strong> You saved on{' '}
            <code>beforeunload</code>. The OS killed the tab and never fired it. Move to{' '}
            <code>visibilitychange</code>.
          </li>
          <li>
            <strong>&quot;Back button shows stale data.&quot;</strong> bfcache restored the
            page and your init never re-ran. Handle{' '}
            <code>pageshow</code> with <code>e.persisted</code>.
          </li>
          <li>
            <strong>&quot;Logging out in one tab leaves the others logged in — except it
            also doesn&apos;t log out the tab I clicked in.&quot;</strong> Two halves of
            the same mistake: no cross-tab channel, and then a channel whose sender never
            hears itself.
          </li>
        </ul>
      </InfoBox>
      <p>
        The event mechanics underneath all of this — phases, delegation, listener options —
        are in <a href="/browser-runtime/events">Events, Phases &amp; Delegation</a>; the{' '}
        <code>storage</code> event is in{' '}
        <a href="/browser-runtime/storage">Storage</a>; and how React wraps native events
        is in <a href="/react18/events">React&apos;s Event System</a>.
      </p>
    </LessonLayout>
  );
}
