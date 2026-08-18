import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JsEs2017() {
  return (
    <LessonLayout
      title="ECMAScript 2017 (ES8): The Complete Deep Dive"
      sectionId="javascript"
      lessonIndex={8}
      prev={{ path: '/javascript/modern-tour', label: 'Modern JavaScript: ES2015-2024 Feature Tour' }}
      next={{ path: '/javascript/cheatsheet', label: '📋 Cheat Sheet' }}
    >

      <p>
        ES2016 (ES7) was famously small — a one-line release. ES2017 (ES8), which followed a
        year later, was not: its headline feature, <code>async</code>/<code>await</code>, changed
        how most everyday JavaScript gets written. Alongside it, ES2017 shipped a handful of
        genuinely useful object and string utilities, a small syntax cleanup, and one advanced
        concurrency primitive almost nobody touches directly. This lesson covers exactly what
        shipped that year — six additions, no more, no less.
      </p>

      {/* ── 1. async / await ── */}
      <h2>async / await</h2>
      <p>
        Generators and Promises already existed before ES2017 — libraries had been using a
        generator-plus-runner pattern to fake this exact syntax for years. What ES2017 added was{' '}
        <code>async</code>/<code>await</code> as real, native language syntax: mark a function{' '}
        <code>async</code> and it always returns a Promise; inside it, <code>await</code> pauses
        the function at a Promise and resumes it with the resolved value once that Promise
        settles.
      </p>

      <CodeBlock language="javascript" title="A working example — verified with real timing">
{`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

async function run() {
  console.log("start");
  const result = await delay(300, "done waiting");
  console.log("after await:", result);
  return result;
}

const startedAt = Date.now();
run().then(finalValue => {
  console.log("elapsed ms:", Date.now() - startedAt);
});
console.log("this logs BEFORE 'after await'");

// Real output (Node 25.2.1):
// start
// this logs BEFORE 'after await'
// after await: done waiting
// elapsed ms: 303`}
      </CodeBlock>

      <p>
        The ordering in that output is the whole point: <code>run()</code> starts executing
        synchronously, hits <code>await</code>, and returns a still-pending Promise immediately —
        which is why the last <code>console.log</code> in the file runs before{' '}
        <code>&quot;after await&quot;</code>. The function body only resumes, on the microtask
        queue, once the 300ms timer fires. The <code>elapsed ms: 303</code> confirms it actually
        waited for the real delay rather than continuing early.
      </p>

      <InfoBox variant="info" title="It's Sugar Over Promises — Not a New Execution Model">
        <p>
          <code>await</code> does not block the thread, and <code>async</code> functions do not
          run on a separate thread. Under the hood, an <code>async</code> function is compiled to
          something equivalent to a generator paused and resumed by a driver that chains{' '}
          <code>.then()</code> calls for you. The snippet below is a hand-written version of that
          driver — no <code>async</code>/<code>await</code> syntax at all, same observable
          behavior.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Desugared equivalent — verified, produces the same result">
{`function delay(ms, value) {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

// async/await version
async function withAsync() {
  const result = await delay(100, "async value");
  console.log("[async/await]", result);
  return result;
}

// Hand-desugared equivalent: a generator, plus a tiny driver that steps it
// and feeds resolved promise values back in. This is the shape async/await
// is sugar over.
function withGenerator() {
  function* gen() {
    const result = yield delay(100, "generator value");
    console.log("[generator desugar]", result);
    return result;
  }
  return new Promise((resolve, reject) => {
    const iterator = gen();
    function step(input) {
      let next;
      try { next = iterator.next(input); }
      catch (err) { return reject(err); }
      if (next.done) return resolve(next.value);
      Promise.resolve(next.value).then(step, reject);
    }
    step();
  });
}

withAsync().then(() => withGenerator());
// Real output:
// [async/await] async value
// [generator desugar] generator value`}
      </CodeBlock>

      <p>
        That is deliberately as far as this lesson goes into the mechanics — a different lesson
        in this section is dedicated entirely to <code>async</code>/<code>await</code> and how it
        interacts with the event loop, microtask queue, and error handling. What matters here is
        the historical fact: this syntax, exactly as you use it today, is an ES2017 addition.
      </p>

      {/* ── 2. Object.values() and Object.entries() ── */}
      <h2>Object.values() and Object.entries()</h2>
      <p>
        <code>Object.keys()</code> already existed (ES2015). ES2017 filled in the two obvious
        companions: <code>Object.values()</code> returns an array of a plain object&apos;s own
        enumerable property <em>values</em>, and <code>Object.entries()</code> returns an array
        of <code>[key, value]</code> pairs — the shape a <code>for...of</code> loop or the{' '}
        <code>Map</code> constructor expects.
      </p>

      <CodeBlock language="javascript" title="Verified output (Node 25.2.1)">
{`const user = { id: 42, name: "Ada", role: "admin" };

console.log(Object.values(user));
// [ 42, 'Ada', 'admin' ]

console.log(Object.entries(user));
// [ [ 'id', 42 ], [ 'name', 'Ada' ], [ 'role', 'admin' ] ]

for (const [key, value] of Object.entries(user)) {
  console.log(\`\${key} = \${value}\`);
}
// id = 42
// name = Ada
// role = admin`}
      </CodeBlock>

      <InfoBox variant="tip" title="Same Ordering as Object.keys()">
        <p>
          Both follow the same enumeration order as <code>Object.keys()</code>: integer-like keys
          first in ascending numeric order, then string keys in insertion order. Since{' '}
          <code>Map</code> already accepted any iterable of <code>[key, value]</code> pairs,{' '}
          <code>new Map(Object.entries(obj))</code> became a one-line way to turn a plain object
          into a <code>Map</code> the moment ES2017 shipped.
        </p>
      </InfoBox>

      {/* ── 3. String.prototype.padStart() / padEnd() ── */}
      <h2>String.prototype.padStart() and padEnd()</h2>
      <p>
        Two string methods for padding a string to a target length: <code>padStart</code> adds
        padding at the beginning, <code>padEnd</code> adds it at the end. Both take a target{' '}
        <code>length</code> and an optional pad string (a single space if omitted).
      </p>

      <CodeBlock language="javascript" title="Verified output (Node 25.2.1)">
{`"7".padStart(3, "0")          // "007"
"7".padEnd(3, "0")            // "700"
"abc".padStart(7, "*")        // "****abc"
"99".padStart(5, "0")         // "00099"
"5".padStart(3)               // "  5"   (default pad is a space)

// Edge case: target length <= the string's own length is a no-op —
// it returns the ORIGINAL string unchanged, never truncates.
"hello world".padStart(5, "0") // "hello world"
"hello world".padEnd(5, "0")   // "hello world"`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Classic Use Case">
        Zero-padding numbers for fixed-width display — <code>String(hours).padStart(2, "0")</code>{' '}
        turns <code>9</code> into <code>&quot;09&quot;</code> for an{' '}
        <code>HH:MM</code> clock, without a manual length check.
      </InfoBox>

      {/* ── 4. Object.getOwnPropertyDescriptors() ── */}
      <h2>Object.getOwnPropertyDescriptors()</h2>
      <p>
        <code>Object.getOwnPropertyDescriptor()</code> (singular, ES5) returns the descriptor for
        one property. ES2017&apos;s <code>Object.getOwnPropertyDescriptors()</code> (plural)
        returns descriptors for <em>every</em> own property at once, keyed by property name. A
        descriptor for an ordinary data property has <code>value</code>/<code>writable</code>/
        <code>enumerable</code>/<code>configurable</code>; a descriptor for an accessor has{' '}
        <code>get</code>/<code>set</code>/<code>enumerable</code>/<code>configurable</code>{' '}
        instead — no <code>value</code> at all.
      </p>

      <CodeBlock language="javascript" title="Verified real shape — data property vs. accessor property">
{`const obj = {
  name: "Ada",
  get greeting() { return \`Hello, \${this.name}\`; },
  set greeting(value) { this.name = value; },
};

console.log(Object.getOwnPropertyDescriptors(obj));
// {
//   name: {
//     value: 'Ada',
//     writable: true,
//     enumerable: true,
//     configurable: true
//   },
//   greeting: {
//     get: [Function: get greeting],
//     set: [Function: set greeting],
//     enumerable: true,
//     configurable: true
//   }
// }`}
      </CodeBlock>

      <p>
        The reason this exists: <code>Object.assign()</code> copies property <em>values</em> — it
        invokes any getter on the source and writes the plain result onto the target as an
        ordinary data property, so the accessor itself does not survive the copy.{' '}
        <code>Object.getOwnPropertyDescriptors()</code> paired with{' '}
        <code>Object.defineProperties()</code> (both pre-existing except the plural getter) copies
        the descriptors themselves, so getters and setters keep working on the copy.
      </p>

      <CodeBlock language="javascript" title="Verified — Object.assign loses the getter, defineProperties keeps it">
{`const source = {
  first: "Ada",
  last: "Lovelace",
  get fullName() { return \`\${this.first} \${this.last}\`; },
};

const assigned = Object.assign({}, source);
console.log(Object.getOwnPropertyDescriptor(assigned, "fullName"));
// { value: 'Ada Lovelace', writable: true, enumerable: true, configurable: true }
// — the getter is GONE; fullName is now a frozen-in-time string.

const cloned = Object.defineProperties({}, Object.getOwnPropertyDescriptors(source));
console.log(Object.getOwnPropertyDescriptor(cloned, "fullName"));
// { get: [Function: get fullName], set: undefined, enumerable: true, configurable: true }
// — the getter survived.

cloned.first = "Grace";
console.log(cloned.fullName);
// "Grace Lovelace" — live, because it's still a real getter.`}
      </CodeBlock>

      {/* ── 5. Trailing commas in function parameter lists and calls ── */}
      <h2>Trailing Commas in Function Parameter Lists and Calls</h2>
      <p>
        A small, purely syntactic change. Trailing commas were already legal in array and object
        literals; ES2017 extended that same allowance to function{' '}
        <strong>parameter lists</strong> and function <strong>calls</strong>. It is optional, not
        required — existing code with no trailing comma is untouched.
      </p>

      <CodeBlock language="javascript" title="Verified — both compile and run fine, with and without">
{`// WITH a trailing comma — allowed since ES2017
function add(
  a,
  b,
) {
  return a + b;
}
const sum = add(
  2,
  3,
);
console.log(sum); // 5

// WITHOUT a trailing comma — always worked, still works
function subtract(a, b) {
  return a - b;
}
console.log(subtract(5, 3)); // 2`}
      </CodeBlock>

      <InfoBox variant="note" title="The One Exception: Rest Parameters">
        <p>
          A trailing comma immediately after a rest parameter is still a syntax error — it was
          deliberately excluded because <code>...args,</code> would be visually confusing with a
          parameter that has to be last.
        </p>
        <CodeBlock language="javascript" title="Verified error (Node 25.2.1)">
{`function bad(...args,) {}
// SyntaxError: Rest parameter must be last formal parameter`}
        </CodeBlock>
      </InfoBox>

      <p>
        The practical payoff is smaller diffs: adding a new last argument to a multi-line call or
        parameter list no longer touches the previous line just to add a comma.
      </p>

      {/* ── 6. SharedArrayBuffer and Atomics ── */}
      <h2>SharedArrayBuffer and Atomics</h2>
      <p>
        This is the most advanced item in the release, and honestly: most working JavaScript
        developers will never write this code directly. It exists to solve one specific problem —
        sharing memory between the main thread and Web Workers (or between workers) without
        copying it.
      </p>
      <p>
        Ordinarily, sending data to a Worker via <code>postMessage()</code> uses the{' '}
        <em>structured clone algorithm</em>: the data is copied, so the two sides never see the
        same memory. A <code>SharedArrayBuffer</code> is different — it is a raw block of memory
        that multiple threads can hold references to <em>simultaneously</em>, so a write on one
        thread is visible on another without any copying or messaging round-trip.
      </p>
      <p>
        Sharing memory across threads means two threads can race to read/modify/write the same
        byte at once. The <code>Atomics</code> object provides operations — <code>load</code>,{' '}
        <code>store</code>, <code>add</code>, <code>compareExchange</code>, and others — that are
        guaranteed indivisible: no other thread can observe a half-finished read or write. Without
        them, concurrent access to a <code>SharedArrayBuffer</code> is a data race.
      </p>

      <CodeBlock language="javascript" title="Verified — single-thread demo of the API surface (Node 25.2.1)">
{`const sab = new SharedArrayBuffer(4); // 4 bytes
const view = new Int32Array(sab);

console.log(Atomics.load(view, 0));      // 0  (initial value)

Atomics.store(view, 0, 10);
console.log(Atomics.load(view, 0));      // 10

const previous = Atomics.add(view, 0, 5);
console.log(previous);                   // 10  (Atomics.add returns the PRE-add value)
console.log(Atomics.load(view, 0));      // 15

console.log(sab.byteLength);             // 4`}
      </CodeBlock>

      <InfoBox variant="note" title="This Demo Is Single-Threaded on Purpose">
        <p>
          The point of a <code>SharedArrayBuffer</code> only shows up once a second thread — a{' '}
          <code>Worker</code> — holds a reference to the <em>same</em> buffer and both sides call{' '}
          <code>Atomics</code> operations on it concurrently. The snippet above verifies the API
          itself runs correctly; it does not exercise actual cross-thread sharing, which needs a
          multi-file Worker setup outside the scope of a single runnable example.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Historical Caveat: Disabled After Spectre">
        <p>
          It is well documented, following the January 2018 Spectre side-channel disclosures, that{' '}
          <code>SharedArrayBuffer</code> was disabled by default in most major browsers shortly
          after this ES2017 release. The concern was that shared memory combined with{' '}
          <code>Atomics</code> gives attacker code a high-resolution timer, one of the practical
          building blocks a Spectre-style timing attack needs to read memory it should not have
          access to.
        </p>
        <p>
          It was later re-enabled, but gated: a page must now opt in by serving both a{' '}
          <code>Cross-Origin-Opener-Policy</code> and a <code>Cross-Origin-Embedder-Policy</code>{' '}
          response header to get <em>cross-origin isolation</em> before{' '}
          <code>SharedArrayBuffer</code> becomes available to it. Code that assumes it is
          unconditionally available — as it briefly was in 2017 — will silently fail to construct
          it on the open web today without those headers.
        </p>
      </InfoBox>

      {/* ── 7. Recap ── */}
      <h2>Recap: Everything ES2017 Shipped</h2>
      <p>Six additions, nothing more:</p>
      <ul>
        <li><code>async</code>/<code>await</code> — native syntax, sugar over generators + Promises</li>
        <li><code>Object.values()</code> and <code>Object.entries()</code></li>
        <li><code>String.prototype.padStart()</code> and <code>padEnd()</code></li>
        <li><code>Object.getOwnPropertyDescriptors()</code></li>
        <li>Trailing commas allowed in function parameter lists and function calls</li>
        <li><code>SharedArrayBuffer</code> and <code>Atomics</code> — shared memory, gated post-Spectre</li>
      </ul>

      {/* ── 8. Test Your Knowledge ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What does an async function return when you call it, the instant it hits its first await?"}
        options={[
          "The final resolved value, computed synchronously",
          "undefined, until the await finishes",
          "A pending Promise — the rest of the calling code keeps running immediately",
          "A generator object that must be manually iterated",
        ]}
        correctIndex={2}
        explanation={"Calling an async function returns a Promise right away, even before any awaited work finishes. The function body pauses at the first await and resumes later on the microtask queue — meanwhile, the code after the call site keeps executing. That's why async/await is sugar over Promises, not a way to make code synchronous."}
        language="javascript"
      />

      <InteractiveChallenge
        question={"const obj = { b: 2, a: 1 }; What does Object.entries(obj) return?"}
        options={[
          "[['a', 1], ['b', 2]] — alphabetically sorted",
          "[['b', 2], ['a', 1]] — insertion order",
          "{ a: 1, b: 2 } — a new object",
          "['b', 'a'] — just the keys",
        ]}
        correctIndex={1}
        explanation={"Object.entries() follows the same enumeration order as Object.keys(): for string keys (no integer-like keys here), that's insertion order — 'b' was defined before 'a', so it comes first. It does not sort alphabetically."}
        language="javascript"
      />

      <InteractiveChallenge
        question={"\"hello world\".padStart(5, \"0\") — what does this return?"}
        options={[
          "\"0hello world\"",
          "\"hello\" — truncated to length 5",
          "\"hello world\" — unchanged",
          "Throws a RangeError",
        ]}
        correctIndex={2}
        explanation={"padStart/padEnd only ADD padding to reach a target length — they never truncate. Since \"hello world\" is already longer than the target length of 5, it's returned completely unchanged."}
        language="javascript"
      />

      <InteractiveChallenge
        question={"Why does Object.getOwnPropertyDescriptors() + Object.defineProperties() copy an object more faithfully than Object.assign()?"}
        options={[
          "It's faster, which is the only difference",
          "Object.assign copies a getter's current VALUE as a plain property; the descriptor-based copy preserves the getter/setter itself",
          "Object.assign doesn't work on objects with getters at all — it throws",
          "There's no real difference; they're aliases",
        ]}
        correctIndex={1}
        explanation={"Object.assign() invokes any getter on the source and writes the resulting value onto the target as an ordinary data property — the accessor doesn't survive. Object.getOwnPropertyDescriptors() captures the actual get/set functions, and Object.defineProperties() installs them as real accessors on the target, so the copy keeps behaving live."}
        language="javascript"
      />

      <InteractiveChallenge
        question={"Why was SharedArrayBuffer disabled by default in most browsers shortly after ES2017 shipped it?"}
        options={[
          "It was replaced by a newer API almost immediately",
          "Browser vendors decided threads were unnecessary on the web",
          "The Spectre side-channel disclosures (Jan 2018) showed shared memory + high-resolution timing could leak data across security boundaries",
          "It never actually shipped in any browser",
        ]}
        correctIndex={2}
        explanation={"Following the January 2018 Spectre disclosures, browser vendors disabled SharedArrayBuffer by default because it — combined with Atomics — gave untrusted code a high-resolution timer, a key ingredient in Spectre-style timing attacks. It was later re-enabled, but only for pages that opt into cross-origin isolation via the Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy headers."}
        language="javascript"
      />

    </LessonLayout>
  );
}
