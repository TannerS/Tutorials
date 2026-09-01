import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JsErrorHandling() {
  return (
    <LessonLayout
      title="Error Handling"
      sectionId="javascript"
      lessonIndex={6}
      prev={{ path: '/javascript/modules', label: 'Modules & Tooling' }}
      next={{ path: '/javascript/modern-tour', label: 'Modern JavaScript: ES2015-2026 Feature Tour' }}
    >
      <p>
        Most JavaScript error-handling bugs are not about <code>try</code>/<code>catch</code> syntax &mdash;
        they are about <em>timing</em>. A <code>catch</code> block only runs if the error arrives while the engine
        is still inside the <code>try</code>. Forget one <code>await</code> in an async function and an error can
        sail right past a <code>catch</code> block that is sitting there waiting for it. This lesson covers the
        mechanics of <code>try</code>/<code>catch</code>/<code>finally</code>, building error types you can
        actually branch on, chaining root causes with <code>error.cause</code>, and the async pitfalls that catch
        even experienced developers &mdash; verified with real Node output, not textbook claims.
      </p>

      <FlowChart
        title="Where Does This Error Get Caught?"
        chart={"graph TD\n  A[Error thrown] --> B{\"Inside a try block\\nthat is currently executing?\"}\n  B -->|Yes| C[Matching catch runs]\n  B -->|No &mdash; e.g. thrown later\nfrom an un-awaited promise| D[try/catch already exited\ncatch does NOT run]\n  D --> E{\".catch() attached\\nto that promise?\"}\n  E -->|Yes| F[.catch handler runs]\n  E -->|No| G[unhandledRejection event\nNode may crash the process]\n  C --> H[finally runs]\n  F --> H\n  G --> H"}
      />

      {/* ── Section 1: try/catch/finally mechanics ─────────────────── */}
      <h2>1. try / catch / finally Mechanics</h2>
      <p>
        The three blocks have distinct jobs: <code>try</code> runs code that might throw, <code>catch</code>{' '}
        handles the thrown value, and <code>finally</code> runs <strong>unconditionally</strong> &mdash; whether
        the <code>try</code> succeeded, threw and got caught, or the <code>catch</code> itself threw again.
      </p>

      <CodeBlock language="javascript" title="Basic shape">
{`try {
  riskyOperation();
} catch (err) {
  console.error('Handled:', err.message);
} finally {
  cleanup(); // always runs — success, failure, or re-throw
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="finally runs even when try returns">
        This trips people up: a <code>return</code> inside <code>try</code> does not exit the function
        immediately. The engine evaluates the return value, then still runs <code>finally</code> before
        actually returning.
      </InfoBox>

      <CodeBlock language="javascript" title="finally runs even on a return inside try — verified with node">
{`function withReturn() {
  try {
    console.log('try: about to return');
    return 'from try';
  } finally {
    console.log('finally: ran even though try returned');
  }
}
console.log('result of withReturn():', withReturn());`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output">
{`try: about to return
finally: ran even though try returned
result of withReturn(): from try`}
      </CodeBlock>

      <p>
        <code>finally</code> also runs when a <code>catch</code> block re-throws instead of swallowing the
        error &mdash; the re-throw does not skip cleanup:
      </p>

      <CodeBlock language="javascript" title="finally runs even when catch re-throws — verified with node">
{`function withRethrow() {
  try {
    throw new Error('boom');
  } catch (err) {
    console.log('catch: caught, now re-throwing');
    throw err;
  } finally {
    console.log('finally: ran even though catch re-threw');
  }
}

try {
  withRethrow();
} catch (err) {
  console.log('outer catch got:', err.message);
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output">
{`catch: caught, now re-throwing
finally: ran even though catch re-threw
outer catch got: boom`}
      </CodeBlock>

      <InfoBox variant="danger" title="A finally with its own return silently discards everything">
        <p>
          If <code>finally</code> itself contains a <code>return</code> (or a <code>throw</code>), it wins
          &mdash; it overrides whatever the <code>try</code> or <code>catch</code> was about to return, with no
          warning. Verified:
        </p>
        <CodeBlock language="javascript" title="Real node output: finallyOverrides() → 'finally value'">
{`function finallyOverrides() {
  try {
    return 'try value';
  } finally {
    return 'finally value'; // overrides the try's return — avoid this
  }
}
console.log(finallyOverrides()); // 'finally value'`}
        </CodeBlock>
        <p>Treat a bare <code>return</code>/<code>throw</code> inside <code>finally</code> as a code smell &mdash; use it for cleanup only (closing files, releasing locks), never for control flow.</p>
      </InfoBox>

      {/* ── Section 2: custom Error subclasses ─────────────────── */}
      <h2>2. Custom Error Subclasses</h2>
      <p>
        The built-in <code>Error</code> only gives you a <code>message</code> and a <code>stack</code>. Real
        applications need to distinguish <em>kinds</em> of failure &mdash; a failed network call is not the same
        problem as invalid user input &mdash; so you subclass <code>Error</code> and attach the extra context
        each kind needs.
      </p>

      <CodeBlock language="javascript" title="A custom ApiError subclass">
{`class ApiError extends Error {
  constructor(message, { status, cause } = {}) {
    super(message, cause !== undefined ? { cause } : undefined);
    this.name = 'ApiError';   // shows up in stack traces and logs
    this.status = status;     // extra context specific to this error kind
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why instanceof checks matter">
        The whole point of subclassing is to be able to ask &quot;what kind of error is this?&quot; and branch
        accordingly. <code>err instanceof ApiError</code> only works reliably if you actually extended{' '}
        <code>Error</code> with <code>class ... extends Error</code> (not, say, throwing a plain object shaped
        like an error) &mdash; and because <code>ApiError</code> is a subclass, every instance is <em>also</em>{' '}
        an instance of <code>Error</code>, so generic <code>catch (err)</code> handlers written for{' '}
        <code>Error</code> still work.
      </InfoBox>

      <CodeBlock language="javascript" title="instanceof checks — verified with node">
{`const err = new ApiError('Request failed', { status: 503 });

console.log('err instanceof ApiError:', err instanceof ApiError);
console.log('err instanceof Error:', err instanceof Error);
console.log('err.name:', err.name);
console.log('err.status:', err.status);`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output">
{`err instanceof ApiError: true
err instanceof Error: true
err.name: ApiError
err.status: 503`}
      </CodeBlock>

      <p>The check is what lets a single catch block route different error kinds to different handling:</p>

      <CodeBlock language="javascript" title="Branching on instanceof — verified with node">
{`function handle(caught) {
  if (caught instanceof ApiError) {
    return \`API error \${caught.status}: \${caught.message}\`;
  }
  return \`Unknown error: \${caught instanceof Error ? caught.message : String(caught)}\`;
}

console.log(handle(new ApiError('Timeout', { status: 504 })));
console.log(handle(new TypeError('not an ApiError')));

// Real output:
// API error 504: Timeout
// Unknown error: not an ApiError`}
      </CodeBlock>

      <InfoBox variant="note" title="Building a small hierarchy">
        <p>
          Once you have one custom error, it is common to build a few siblings for the failure categories your
          app actually has &mdash; e.g. <code>ValidationError</code>, <code>NotFoundError</code>,{' '}
          <code>AuthError</code> &mdash; each carrying only the fields relevant to that kind of failure. Keep
          them shallow (extend <code>Error</code> directly); deep custom hierarchies rarely pay for themselves.
        </p>
      </InfoBox>

      {/* ── Section 3: error.cause ─────────────────── */}
      <h2>3. Chaining Root Causes with error.cause (ES2022)</h2>
      <p>
        When you catch a low-level error and throw a more meaningful one in its place, you traditionally lose the
        original error &mdash; the stack trace that actually points at the bug. ES2022 added a standard{' '}
        <code>cause</code> option to the <code>Error</code> constructor (and every subclass, since it just
        forwards to <code>super()</code>) that attaches the original error without you having to invent your own
        convention for it.
      </p>

      <CodeBlock language="javascript" title="Wrapping a low-level error with cause">
{`class ApiError extends Error {
  constructor(message, options) {
    super(message, options); // options = { cause }
    this.name = 'ApiError';
  }
}

async function readConfigFile() {
  throw new Error('ENOENT: no such file config.json');
}

async function loadConfig() {
  try {
    await readConfigFile();
  } catch (rootErr) {
    throw new ApiError('Failed to load configuration', { cause: rootErr });
  }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Reading .cause off the caught error — verified with node">
{`try {
  await loadConfig();
} catch (err) {
  console.log('err.message:', err.message);
  console.log('err.cause instanceof Error:', err.cause instanceof Error);
  console.log('err.cause.message:', err.cause.message);
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output">
{`err.message: Failed to load configuration
err.cause instanceof Error: true
err.cause.message: ENOENT: no such file config.json`}
      </CodeBlock>

      <InfoBox variant="info" title="console.error prints the whole chain for free">
        Node's default inspector understands <code>.cause</code> and prints it nested under the outer error, so{' '}
        <code>console.error(err)</code> alone shows both the wrapping error and the original one with its own
        stack trace &mdash; no extra logging code needed. Verified real shape (stack lines trimmed for space):
        <CodeBlock language="text" title="console.error(err) — real output, trimmed">
{`ApiError: Failed to load configuration
    at loadConfig (...)
    ... {
  [cause]: Error: ENOENT: no such file config.json
      at readConfigFile (...)
      ...
}`}
        </CodeBlock>
      </InfoBox>

      {/* ── Section 4: async try/catch vs .catch() ─────────────────── */}
      <h2>4. Async Errors: try/catch Around await vs .catch()</h2>
      <p>
        Inside an <code>async</code> function you have two equally valid ways to handle a rejected promise:
        wrap the <code>await</code> in <code>try</code>/<code>catch</code>, or attach <code>.catch()</code> to
        the promise chain before awaiting it. Both genuinely catch the rejection &mdash; the difference is
        control flow, not correctness.
      </p>

      <CodeBlock language="javascript" title="Style A: try/catch around await">
{`async function styleA() {
  try {
    const value = await risky(true);
    console.log('value:', value);
  } catch (err) {
    console.log('caught via try/catch:', err.message);
  }
  console.log('continues after catch, in the same function');
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Style B: .catch() on the promise chain">
{`async function styleB() {
  const value = await risky(true).catch((err) => {
    console.log('caught via .catch():', err.message);
    return 'fallback value'; // .catch() can supply a fallback the await then resolves to
  });
  console.log('value after .catch() fallback:', value);
}`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output for both">
{`[A] caught via try/catch: risky failed
[A] continues after catch, in the same function
---
[B] caught via .catch(): risky failed
[B] value after .catch() fallback: fallback value`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to reach for each">
        <code>try</code>/<code>catch</code> reads naturally when you want one handler for several awaited calls
        in sequence. <code>.catch()</code> is useful per-call when you want to supply an inline fallback value
        (as above) without a multi-line <code>try</code> block, or inside a non-async context where{' '}
        <code>await</code> is not available at all.
      </InfoBox>

      {/* ── Section 5: the missed-catch bug ─────────────────── */}
      <h2>5. The Bug: A Non-awaited Call Inside try Does NOT Get Caught</h2>
      <p>
        Here is the mistake that causes real production incidents: calling an async function inside a{' '}
        <code>try</code> block <strong>without awaiting it</strong>. The <code>try</code> block sees a promise
        get created, not the error the promise will eventually reject with &mdash; by the time the rejection
        happens, the <code>try</code> has already finished executing and moved on. The <code>catch</code> block
        was listening for an error that arrives too late to be heard.
      </p>

      <InfoBox variant="danger" title="This is not a hypothetical — verified below with real Node behavior">
        The demo registers <code>process.on('unhandledRejection', ...)</code> as an <em>independent</em>{' '}
        observer, separate from the <code>try</code>/<code>catch</code>, specifically to prove the{' '}
        <code>catch</code> block genuinely never runs &mdash; the rejection has to be caught by something else
        entirely.
      </InfoBox>

      <CodeBlock language="javascript" title="The bug and the fix, side by side — full verified script">
{`process.on('unhandledRejection', (reason) => {
  console.log('[unhandledRejection fired] reason:', reason.message);
});

function fetchUser(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error(\`user \${id} not found\`)), 10);
  });
}

async function buggyLoad() {
  try {
    fetchUser(1); // BUG: missing \`await\` — this call is not awaited
    console.log('[buggy] try block finished normally, no error seen here');
  } catch (err) {
    // This will NOT run for the missing-await bug.
    console.log('[buggy] catch ran (should NOT print this):', err.message);
  }
}

async function fixedLoad() {
  try {
    await fetchUser(2); // FIX: await it so its rejection is thrown into the try/catch
    console.log('[fixed] try block finished normally (should NOT print this)');
  } catch (err) {
    console.log('[fixed] catch genuinely ran:', err.message);
  }
}

await buggyLoad();
await new Promise((r) => setTimeout(r, 50)); // let the rejection surface
await fixedLoad();`}
      </CodeBlock>

      <CodeBlock language="text" title="Real node output — the catch block never fires for the buggy version">
{`[buggy] try block finished normally, no error seen here
[unhandledRejection fired] reason: user 1 not found
[fixed] catch genuinely ran: user 2 not found`}
      </CodeBlock>

      <InfoBox variant="success" title="Read the output carefully">
        <ul>
          <li>The buggy version's <code>try</code> block finishes and logs its &quot;normal&quot; message &mdash; the <code>catch</code> line for it never prints, because <code>fetchUser(1)</code> returned a promise that the <code>try</code> block did not wait on.</li>
          <li>The rejection from <code>fetchUser(1)</code> does not vanish &mdash; it surfaces later as a Node-level <code>unhandledRejection</code> event, completely outside the <code>try</code>/<code>catch</code> that was supposedly guarding it.</li>
          <li>Adding a single <code>await</code> (the fixed version) is enough to route the same rejection into the <code>catch</code> block, exactly where you meant it to go.</li>
        </ul>
      </InfoBox>

      {/* ── Section 6: unhandled rejections and how Node surfaces them ─────────────────── */}
      <h2>6. Unhandled Promise Rejections: How Node Surfaces Them</h2>
      <p>
        When a promise rejects and nothing is attached to handle it &mdash; no <code>.catch()</code>, no
        awaiting <code>try</code>/<code>catch</code> &mdash; Node fires an <code>unhandledRejection</code> event
        on <code>process</code>. If you never listen for that event, Node's <strong>default behavior since
        Node 15 is to crash the process</strong> with a non-zero exit code, printing the error as if it were an
        uncaught synchronous exception.
      </p>

      <CodeBlock language="javascript" title="No handler registered — what actually happens">
{`// No process.on('unhandledRejection', ...) anywhere in this file.
function boom() {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('nobody caught me')), 5));
}

async function run() {
  boom(); // missing await, on purpose
  console.log('run() finished its try-free body synchronously');
}

await run();`}
      </CodeBlock>
      <CodeBlock language="text" title="Real node output — the process crashes with exit code 1">
{`run() finished its try-free body synchronously
file:///.../06-default-unhandled.mjs:3
  return new Promise((_, reject) => setTimeout(() => reject(new Error('nobody caught me')), 5));
                                                            ^

Error: nobody caught me
    at Timeout._onTimeout (file:///.../06-default-unhandled.mjs:3:61)
    ...

Node.js v25.2.1
EXIT CODE: 1`}
      </CodeBlock>

      <InfoBox variant="warning" title="Design implication: this is not just a warning to ignore">
        <p>
          Earlier Node versions only printed a deprecation warning for unhandled rejections and kept running,
          which trained a lot of developers to treat them as noise. That changed &mdash; on modern Node an
          unhandled rejection can take your whole process down. In production, always register a top-level{' '}
          <code>process.on('unhandledRejection', ...)</code> (to log and decide whether to exit deliberately) as
          a safety net, but treat its firing as a bug to fix, not a mechanism to rely on &mdash; the real fix is
          always adding the missing <code>await</code> or <code>.catch()</code> at the source.
        </p>
      </InfoBox>

      {/* ── Section 7: Interactive Challenges ─────────────────── */}
      <h2>7. Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What does this function log and return?"}
        language="javascript"
        code={`function f() {
  try {
    return 'A';
  } finally {
    console.log('cleanup');
  }
}
console.log(f());`}
        options={[
          "Throws an error — you cannot return from inside a try block",
          "Logs 'cleanup' then 'A' — finally runs before the function actually returns",
          "Logs 'A' then 'cleanup' — the return happens first",
          "Only logs 'A' — finally is skipped because try succeeded",
        ]}
        correctIndex={1}
        explanation={"finally always runs before the function returns, even when try already hit a return statement. So 'cleanup' logs first (from inside finally), then the outer console.log('A') runs after f() actually returns."}
      />

      <InteractiveChallenge
        question={"In this async function, does the catch block run when fetchData() rejects?"}
        language="javascript"
        code={`async function load() {
  try {
    fetchData(); // returns a Promise that will reject
  } catch (err) {
    console.log('caught:', err.message);
  }
}`}
        options={[
          "Yes — try/catch always catches promise rejections from calls inside it",
          "No — fetchData() is never awaited, so its rejection happens after the try block has already finished executing",
          "Yes, but only if fetchData() rejects synchronously",
          "No — you can never use try/catch with promises, only .catch()",
        ]}
        correctIndex={1}
        explanation={"Without await, fetchData() returns a promise immediately and the try block moves on. The rejection arrives later, outside the try/catch entirely, and surfaces as an unhandledRejection instead. Adding await fetchData() fixes it."}
      />

      <InteractiveChallenge
        question={"What is the value of err.cause here?"}
        language="javascript"
        code={`try {
  try {
    throw new Error('disk read failed');
  } catch (rootErr) {
    throw new Error('failed to load user profile', { cause: rootErr });
  }
} catch (err) {
  // err.cause === ?
}`}
        options={[
          "undefined — cause is not a real JavaScript feature",
          "The string 'disk read failed'",
          "The original Error object whose message is 'disk read failed'",
          "err.cause does not exist until you call err.getCause()",
        ]}
        correctIndex={2}
        explanation={"The ES2022 { cause } option on the Error constructor attaches the original error object (not just its message) as err.cause, letting you trace back to the root failure while still throwing a more meaningful outer error."}
      />

      <InfoBox variant="success" title="Checklist: Solid Error Handling">
        <ul>
          <li>✅ Know that <code>finally</code> always runs &mdash; on success, on catch, on re-throw, even after a <code>return</code> in <code>try</code></li>
          <li>✅ Never put a bare <code>return</code>/<code>throw</code> inside <code>finally</code> &mdash; it silently overrides the real result</li>
          <li>✅ Subclass <code>Error</code> for domain-specific failures and check kind with <code>instanceof</code></li>
          <li>✅ Use <code>{'{ cause }'}</code> when wrapping a lower-level error so the root cause is never lost</li>
          <li>✅ Always <code>await</code> a promise-returning call before you expect its rejection to land in a surrounding <code>try</code>/<code>catch</code></li>
          <li>✅ Register a top-level <code>process.on('unhandledRejection', ...)</code> as a safety net, but treat every firing as a bug to fix at the source</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
