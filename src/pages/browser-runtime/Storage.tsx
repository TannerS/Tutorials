import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function BrowserStorage() {
  return (
    <LessonLayout
      title="Storage: localStorage, Cookies & IndexedDB"
      sectionId="browser-runtime"
      lessonIndex={4}
      prev={{ path: '/browser-runtime/observers', label: 'Intersection, Resize & Mutation Observers' }}
      next={{ path: '/browser-runtime/lifecycle', label: 'Page Lifecycle & Cross-Context Events' }}
    >
      <p>
        Four places to put data in a browser, and they are not interchangeable. Picking
        the wrong one is how auth tokens end up readable by any injected script, and how
        a &quot;simple cache&quot; blocks the main thread.
      </p>
      <p>Every measurement below is from Chromium 149 on a real HTTP origin.</p>

      <h2>The Comparison, First</h2>
      <CodeBlock language="text" title="What each one is actually for">
{`                  localStorage   sessionStorage   Cookies        IndexedDB
lifetime          forever        until tab close  Expires/Max-Age forever
capacity          ~5-10 MB       ~5-10 MB         ~4 KB TOTAL     large (GBs)
sent to server    no             no               ON EVERY REQUEST no
readable by JS    yes            yes              unless HttpOnly  yes
API               synchronous    synchronous      synchronous      async
stores            strings only   strings only     strings          structured
                                                                   (objects, Blobs)
shared across     all tabs       that tab only    all tabs         all tabs
  same origin

measured quota on this machine: navigator.storage.estimate()
  -> quota 8192 MB`}
      </CodeBlock>

      <h2><code>localStorage</code> — Strings, Synchronously</h2>
      <CodeBlock language="javascript" title="The whole API is five methods">
{`localStorage.setItem('theme', 'dark');
localStorage.getItem('theme');        // "dark", or null if absent
localStorage.removeItem('theme');
localStorage.clear();
localStorage.key(0);  localStorage.length;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the two traps, measured">
{`localStorage.setItem('k', '1');
  typeof localStorage.getItem('k')  -> "string"

localStorage.setItem('obj', { a: 1 });
  localStorage.getItem('obj')       -> "[object Object]"
  // It called toString() on your object. No error, no warning.
  // The data is simply gone.

localStorage.setItem('n', 42);
  localStorage.getItem('n')         -> "42"   (a string, not a number)

localStorage.getItem('nope')        -> null   (not undefined)

500 sequential setItem calls        -> 1 ms, ALL on the main thread`}
      </CodeBlock>

      <InfoBox variant="danger" title="Two failure modes that look like nothing">
        <p>
          <strong>Objects silently become <code>"[object Object]"</code>.</strong> Always{' '}
          <code>JSON.stringify</code> going in and <code>JSON.parse</code> coming out —
          and wrap the parse in a <code>try/catch</code>, because a half-written or
          hand-edited value will throw and take your app down on boot.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>It is synchronous, on the main thread.</strong> 500 writes measured at
          1ms, so small use is genuinely cheap — but storing something large, or writing
          on every keystroke, blocks rendering. And it can <em>throw</em>: Safari in
          private mode and a full quota both raise{' '}
          <code>QuotaExceededError</code> from <code>setItem</code>.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="The safe wrapper, which you will write once per project">
{`const store = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;          // corrupt value, or storage unavailable
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;             // quota exceeded, or private mode
    }
  },
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="The storage event: cross-tab sync for free">
        <p>
          Writing to <code>localStorage</code> fires a <code>storage</code> event in{' '}
          <em>other</em> tabs on the same origin — never in the tab that wrote it. That is
          the cheapest cross-tab sync there is: log out in one tab and every other tab can
          react.
        </p>
        <CodeBlock language="javascript" title="Cross-tab logout">
{`window.addEventListener('storage', (e) => {
  if (e.key === 'auth' && e.newValue === null) redirectToLogin();
});`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          If you want cross-tab messages without persisting anything, use{' '}
          <code>BroadcastChannel</code> instead — it has the same &quot;the sender never
          hears itself&quot; behaviour and no storage quota. Both, plus the{' '}
          <code>postMessage</code> origin contract, are in{' '}
          <a href="/browser-runtime/lifecycle">Page Lifecycle &amp; Cross-Context Events</a>.
        </p>
      </InfoBox>

      <h2><code>sessionStorage</code> — Same API, Narrower Scope</h2>
      <p>
        Identical API, scoped to <strong>one tab</strong>. Closing the tab clears it;
        duplicating the tab copies it; a second tab on the same site gets its own empty
        copy. Verified: a key written to <code>sessionStorage</code> is not visible
        through <code>localStorage</code> at all — they are separate stores, not views.
      </p>
      <p>
        Right for things that should not outlive the task: a multi-step form&apos;s
        progress, a &quot;return to this page after login&quot; URL, a scroll position.
      </p>

      <h2>Cookies — The Only One the Server Sees</h2>
      <p>
        Cookies are the oldest and the most awkward to use from JavaScript —{' '}
        <code>document.cookie</code> is a single semicolon-delimited string you parse by
        hand. Their point is that the browser attaches them to requests automatically.
      </p>

      <CodeBlock language="javascript" title="Set from the server, not from JS, when it matters">
{`// What the SERVER sends — and the flags are the whole story:
Set-Cookie: session=abc123;
            HttpOnly;              // JS CANNOT read it. The XSS defence.
            Secure;                // HTTPS only
            SameSite=Lax;          // not sent on cross-site requests. CSRF defence.
            Max-Age=3600;
            Path=/

// From JavaScript you get one string:
document.cookie  // "theme=dark; lang=en"   — typeof "string"

// Writing appends/replaces ONE cookie, despite the = looking like assignment:
document.cookie = 'theme=dark; Max-Age=31536000; Path=/; SameSite=Lax';`}
      </CodeBlock>

      <InfoBox variant="danger" title="Where to put an auth token — the one decision that matters">
        <p>
          <strong>Not in <code>localStorage</code>.</strong> Any injected script can read
          it: one compromised dependency, one XSS, and the token is exfiltrated. There is
          no mitigation, because readability is the whole design of{' '}
          <code>localStorage</code>.
        </p>
        <p style={{ marginBottom: 0 }}>
          An <strong><code>HttpOnly</code>; <code>Secure</code>;{' '}
          <code>SameSite</code></strong> cookie cannot be read by JavaScript at all, so
          XSS cannot steal it, and <code>SameSite</code> blunts CSRF. The cost is that
          your JS cannot read it either — which is the point. See{' '}
          <a href="/auth/cookies">Cookies &amp; Sessions</a> and{' '}
          <a href="/auth/jwt">JWT Deep Dive</a> for the full argument.
        </p>
      </InfoBox>

      <h2>IndexedDB — The Real Database</h2>
      <p>
        Asynchronous, transactional, stores structured data (objects, <code>Blob</code>s,{' '}
        <code>ArrayBuffer</code>s) without serialising to strings, and sized in gigabytes
        rather than megabytes. The raw API is event-based and unpleasant; in practice
        everyone uses a wrapper such as <code>idb</code> or <code>Dexie</code>.
      </p>

      <CodeBlock language="javascript" title="The raw API, to recognise it">
{`const req = indexedDB.open('app-db', 1);

req.onupgradeneeded = (e) => {          // runs on version change only
  const db = e.target.result;
  db.createObjectStore('invoices', { keyPath: 'id' });
};

req.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('invoices', 'readwrite');
  tx.objectStore('invoices').put({ id: 1, total: 99 });   // a real object
  tx.oncomplete = () => console.log('committed');
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="When IndexedDB is actually the answer">
        <p style={{ marginBottom: 0 }}>
          Offline-capable apps, caching API responses larger than a few hundred KB,
          storing files the user picked, or anything you want to query rather than load
          wholesale. If you are reaching for <code>localStorage</code> and finding
          yourself <code>JSON.parse</code>-ing a large array on every page load, that is
          the signal to move. For everything smaller, <code>localStorage</code> with the
          safe wrapper above is genuinely fine.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="None of it is guaranteed to still be there">
        <p style={{ marginBottom: 0 }}>
          Every storage mechanism here can be cleared without warning — private windows,
          &quot;clear site data&quot;, storage pressure eviction, and browser privacy
          policies that cap script-writable storage lifetime. Treat all of it as a{' '}
          <strong>cache</strong>, never as the only copy. Anything that must survive
          belongs on a server. <code>navigator.storage.persist()</code> asks for exemption
          and may be refused.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
