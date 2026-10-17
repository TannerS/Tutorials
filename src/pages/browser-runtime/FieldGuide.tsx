import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function BrowserRuntimeFieldGuide() {
  return (
    <GuideLayout
      title="Browser Runtime Field Guide"
      kicker="Web Platform"
      tagline="DOM, events, the event loop, observers, storage and fetch — every ordering, flag and failure mode here was measured in Chromium 149."
      glyph="🌐"
      meta={['Chromium 149', '6 lessons', '12 panels']}
      page="1 / 1"
      footer="Measured, not recalled: event phase order, live-collection removal, microtask starvation, observer first-callbacks, localStorage coercion, and CORS failures across two real origins."
      prev={{ path: '/browser-runtime/fetch', label: 'fetch, CORS & the Request Lifecycle' }}
      next={null}
    >
      <GuidePanel n={1} title="Selecting & Traversing" accent="blue" glyph="🔍" span={2}>
        <GuideCode>{`querySelector(sel)      first match or null
querySelectorAll(sel)   STATIC NodeList
getElementsByClassName  LIVE HTMLCollection
el.querySelector(sel)   scoped to a subtree

el.children / firstElementChild / nextElementSibling   <- element only
el.childNodes / firstChild                             <- includes text nodes
e.target.closest(sel)   nearest ancestor-or-self`}</GuideCode>
        <GuideRules items={[
          'Live collections re-query as you read. Measured: a forward loop removing 4 .row elements left 2 behind — exactly half.',
          'querySelectorAll is a snapshot: after removing both matches, .length still reported 2.',
          'closest() is what makes delegation work when the click lands on an inner <svg>.',
          'el.firstChild is usually a whitespace text node. Use firstElementChild.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Attribute vs Property" accent="amber" glyph="⚖️">
        <GuideCode>{`input.getAttribute('value')  -> "original"
input.value                  -> "typed"

cb.getAttribute('checked')   -> ""
cb.checked                   -> false`}</GuideCode>
        <GuideRules items={[
          'Attribute = the markup. Property = the live state.',
          'For form controls they diverge the moment the user types. Always read the property.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Content & XSS" accent="red" glyph="☠️">
        <GuideCode>{`textContent  safe, no parsing
innerHTML    RUNS THE PARSER
innerText    as rendered, forces reflow

<div>a<span style="display:none">b</span></div>
  textContent -> "ab"
  innerText   -> "a"`}</GuideCode>
        <GuideRules items={[
          'innerHTML does NOT run <script> — but <img src=x onerror=…> DOES fire. Verified.',
          'textContent never parses. Use it for anything user-supplied.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Event Phases" accent="purple" glyph="🎯" span={2}>
        <GuideCode>{`one click on a nested button, five listeners:

1. outer CAPTURE      el.addEventListener(t, fn, true)
2. mid   CAPTURE
3. button TARGET
4. mid   BUBBLE       el.addEventListener(t, fn)   <- default
5. outer BUBBLE`}</GuideCode>
        <GuideDefs items={[
          ['preventDefault()', 'cancels the BROWSER action; the event keeps travelling. dispatchEvent returns false.'],
          ['stopPropagation()', 'stops the journey; the default action still happens. Verified: the parent handler did not run.'],
          ['e.target', 'what was clicked — possibly a deep descendant'],
          ['e.currentTarget', 'what the listener is attached to'],
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Listener Options" accent="green" glyph="⚙️">
        <GuideCode>{`{ once: true }     auto-removes after 1 call
{ capture: true }  capture phase
{ passive: true }  "I won't preventDefault"
{ signal }         remove via ac.abort()`}</GuideCode>
        <GuideRules items={[
          'once: verified to fire exactly 1 time across 2 clicks.',
          'removeEventListener matches on IDENTITY — an inline arrow can never be removed.',
          'One ac.abort() removes every listener registered with that signal. Maps perfectly onto an effect cleanup.',
          'passive on scroll/touch/wheel listeners that only read — otherwise the browser waits for you before scrolling.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Event Loop Order" accent="purple" glyph="🔄" span={2}>
        <GuideCode>{`1 sync start
2 sync end
3 promise.then      (microtask)
4 queueMicrotask    (microtask)
5 setTimeout 0      (macrotask)
rAF                 (before the next PAINT)`}</GuideCode>
        <GuideRules items={[
          'All sync code, then the ENTIRE microtask queue, then ONE macrotask, then microtasks again.',
          'rAF has no fixed position relative to setTimeout — it is tied to paint. In this run it landed last.',
          'Microtasks can starve the frame: a chain of 5 delayed the timer until all 5 had run. Unbounded = a hung tab.',
          '~16.7ms per frame at 60fps. Over ~50ms on the main thread is a LONG TASK.',
          'await does NOT yield to the browser — a continuation is a microtask. setTimeout(…,0) yields a real boundary.',
          'async does not move work off the thread. Only a Web Worker does that.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Observers" accent="blue" glyph="👁️" span={2}>
        <GuideTable
          head={['Observer', 'Replaces', 'First callback (measured)']}
          rows={[
            ['IntersectionObserver', 'scroll + getBoundingClientRect', 'fires IMMEDIATELY: { isIntersecting: false, ratio: 0 }'],
            ['ResizeObserver', 'window resize listener', 'fires immediately: contentRect.width 100'],
            ['MutationObserver', 'polling the DOM', '{ type: "childList", addedNodes: 1 }'],
            ['PerformanceObserver', 'manual timing', 'entry types incl. LCP, layout-shift, longtask, event'],
          ]}
        />
        <GuideRules items={[
          'IntersectionObserver reports current state on observe() — branch on entry.isIntersecting, never assume it means "entered".',
          'rootMargin: "200px" fires early so images load before the user arrives.',
          'MutationObserver callbacks are MICROTASKS — fast, but easy to self-trigger with subtree: true.',
          'Resizing an observed element inside a ResizeObserver callback throws "loop completed with undelivered notifications".',
          'ALWAYS disconnect() on cleanup — an observer holds its targets alive.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Storage Comparison" accent="amber" glyph="💾" span={3}>
        <GuideTable
          head={['', 'localStorage', 'sessionStorage', 'Cookies', 'IndexedDB']}
          rows={[
            ['lifetime', 'forever', 'until tab closes', 'Expires/Max-Age', 'forever'],
            ['capacity', '~5–10 MB', '~5–10 MB', '~4 KB TOTAL', 'GBs (8192 MB quota measured)'],
            ['sent to server', 'no', 'no', 'ON EVERY REQUEST', 'no'],
            ['readable by JS', 'yes', 'yes', 'unless HttpOnly', 'yes'],
            ['API', 'synchronous', 'synchronous', 'synchronous', 'async'],
            ['stores', 'strings only', 'strings only', 'strings', 'structured clones'],
          ]}
        />
        <GuideRules items={[
          'setItem("obj", {a:1}) stores the literal string "[object Object]". No error. Always JSON.stringify.',
          'setItem("n", 42) comes back as the STRING "42". Missing keys return null, not undefined.',
          '500 writes measured at 1ms — cheap, but synchronous and on the main thread. It can throw QuotaExceededError.',
          'The storage event fires in OTHER tabs only — free cross-tab sync.',
          'Auth tokens belong in an HttpOnly + Secure + SameSite cookie, never localStorage: any injected script can read localStorage.',
          'Treat all of it as a cache. Private mode, "clear site data" and eviction can wipe any of it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="fetch — The Error Model" accent="red" glyph="📡" span={2}>
        <GuideCode>{`HTTP 500  ->  RESOLVED  res.ok=false  status=500
HTTP 404  ->  RESOLVED  res.ok=false  status=404
HTTP 200  ->  RESOLVED  res.ok=true   status=200

const res = await fetch(url);        // rejects only on NETWORK failure
if (!res.ok) throw new Error('HTTP ' + res.status);
const data = await res.json();`}</GuideCode>
        <GuideRules items={[
          'fetch does NOT reject on 4xx/5xx. A server error is a successful fetch.',
          'It rejects only when there is no response: DNS, refused, CORS-blocked, or aborted.',
          'A body can be consumed ONCE. res.clone() first if you need it twice.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="CORS" accent="red" glyph="🚧" span={2}>
        <GuideCode>{`no Access-Control-Allow-Origin
  -> TypeError: Failed to fetch
     (the server DID respond — you get no
      status, no body, no detail)

with the header  -> status 200
PUT + content-type -> OPTIONS preflight first`}</GuideCode>
        <GuideRules items={[
          'CORS is enforced by the BROWSER. That is why it works in Postman and fails in a page.',
          'You cannot fix it from the frontend. Add the header server-side, or proxy (Vite server.proxy) so it is same-origin.',
          'mode: "no-cors" returns an OPAQUE response — status 0, unreadable. Not a workaround.',
          'Content-Type: application/json is NOT safelisted, so nearly every JSON POST is preflighted.',
          'Adding an Authorization header turns a working simple GET into a preflighted one.',
          'With credentials:"include" the server may not reply Allow-Origin: * — it must name your origin.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Cancellation" accent="green" glyph="🛑">
        <GuideCode>{`const ac = new AbortController();
fetch(url, { signal: ac.signal });
ac.abort();   // -> THREW AbortError

AbortSignal.timeout(5000)  // one-line timeout`}</GuideCode>
        <GuideRules items={[
          'Filter on e.name !== "AbortError" — an abort is expected on every keystroke, not an error to show.',
          'return () => ac.abort() in an effect fixes the stale-response race.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Measuring & Layout Thrash" accent="purple" glyph="📐">
        <GuideCode>{`getBoundingClientRect()  offsetWidth
clientHeight  scrollHeight  scrollTop

// BAD: read/write per item = one layout each
for (const el of items)
  el.style.height = el.offsetHeight + 10 + 'px';

// GOOD: batch reads, then writes
const hs = items.map(el => el.offsetHeight);
items.forEach((el,i) =>
  el.style.height = hs[i] + 10 + 'px');`}</GuideCode>
        <GuideRules items={[
          'Reading geometry forces the browser to flush pending layout immediately.',
          'DocumentFragment: build offscreen, insert once. Verified — children move in and the fragment is left empty.',
          'In the Performance panel this appears as repeated Layout bars, flagged "Forced reflow".',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
