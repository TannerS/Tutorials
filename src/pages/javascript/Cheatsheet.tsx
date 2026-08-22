import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsCheatsheet() {
  return (
    <LessonLayout
      title="📋 JavaScript Cheat Sheet"
      sectionId="javascript"
      lessonIndex={9}
      prev={{ path: '/javascript/es2017', label: 'ECMAScript 2017 (ES8): The Complete Deep Dive' }}
      next={null}
    >
      <p>
        A single-page reconciliation of every claim from the eight lessons that precede this one.
        Every behavior below was actually run on Node 25.x somewhere earlier in this section —
        nothing here is a textbook fact restated from memory.
      </p>

      <h2>Scoping &amp; Hoisting</h2>

      <CodeBlock language="text" title="var vs let/const">
{`var    function-scoped, hoisted + initialized to undefined
let    block-scoped, hoisted but NOT initialized (Temporal Dead Zone)
const  block-scoped, TDZ, binding can't be reassigned (value can still mutate)

Accessing a let/const before its declaration: ReferenceError, not undefined
Accessing a var before its declaration:       undefined, no error

// The classic interview bug:
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);  // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);  // 0 1 2
// var: one shared binding across all iterations. let: a fresh binding per iteration.`}
      </CodeBlock>

      <h2>Equality, Truthiness &amp; typeof</h2>

      <CodeBlock language="text" title="The full falsy list — everything else is truthy">
{`false   0   -0   0n   ''   null   undefined   NaN

Truthy traps: '0'  ' '  []  {}  'false'  new Boolean(false)

0 ?? 'x'      -> 0        (?? only checks null/undefined)
0 || 'x'      -> 'x'      (|| checks ALL falsy values)
null == undefined   -> true
null === undefined  -> false
NaN == NaN          -> false   (use Object.is(NaN, NaN) -> true, or Number.isNaN)
typeof null          -> 'object'   (a 50-year-old bug, permanent)
typeof undeclaredVar  -> 'undefined' (no throw)
typeof x  (x in its TDZ)  -> throws ReferenceError`}
      </CodeBlock>

      <h2>this Binding</h2>

      <CodeBlock language="text" title="Four ways 'this' gets set">
{`obj.method()          this = obj                    (call-site rule)
fn.call(ctx)          this = ctx                    (explicit)
new Fn()              this = the new instance        (constructor)
() => {...}           this = enclosing lexical scope (arrow — never rebindable)

Arrow functions also have NO 'arguments' object — referencing it inside a
bare arrow throws ReferenceError; inside a regular function nested in one,
'arguments' resolves to the nearest enclosing regular function's.`}
      </CodeBlock>

      <h2>Closures</h2>

      <CodeBlock language="javascript" title="The shape that shows up everywhere: private state via closure">
{`function makeCounter() {
  let count = 0;                       // private — no way in from outside
  return { inc: () => ++count, get: () => count };
}
const a = makeCounter(), b = makeCounter();
a.inc(); a.inc();
a.get();   // 2 — each call to makeCounter() closes over its OWN 'count'
b.get();   // 0 — completely independent`}
      </CodeBlock>

      <h2>Objects &amp; Prototypes</h2>

      <CodeBlock language="text" title="Verified, not assumed">
{`Object.getPrototypeOf(instance) === Klass.prototype     -> true
class methods are non-enumerable   (object-literal methods ARE enumerable)
new Klass(...) without 'new'       -> TypeError: Class constructor cannot
                                       be invoked without 'new'

Object.freeze(obj)   shallow — nested objects inside stay mutable
Object.seal(obj)     blocks add/delete, existing values still writable

'prop' in obj              -> true for OWN or INHERITED enumerable props
Object.hasOwn(obj, 'prop') -> true for OWN props only (own vs. inherited
                               genuinely diverge — verified with a real example)`}
      </CodeBlock>

      <h2>Prototypes — What They Are, How They Were Used</h2>

      <CodeBlock language="text" title="The core mental model">
{`Every object has an internal [[Prototype]] link (read: Object.getPrototypeOf(obj)).
A missing property lookup walks that link, then its link, until null.

[[Prototype]]   internal link every OBJECT has — used for lookups
.prototype      an ordinary property only FUNCTIONS have — becomes the
                [[Prototype]] of every instance 'new Fn()' creates

class Foo {} is real sugar over this exact mechanism — verified via
Object.getOwnPropertyNames(Foo.prototype) showing methods land there,
same as a hand-written Foo.prototype.method = function(){} would.`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Old-way inheritance — the pattern class extends replaced">
{`function Dog(name) { Animal.call(this, name); }   // "super" call, manually
Dog.prototype = Object.create(Animal.prototype);   // wire the chain
Dog.prototype.constructor = Dog;                    // repair identity — easy to forget!

// Forgetting that last line: felix.constructor === Cat is FALSE,
// felix.constructor === Animal is TRUE — a real, verified, silent bug.
// class Dog extends Animal {} gets both lines right automatically.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Mixins — the multiple-inheritance workaround">
        <p>
          JS only has one prototype chain per object. <code>Object.assign(SomeClass.prototype,
          MixinA, MixinB)</code> copies shared methods onto a prototype directly — real
          multiple-inheritance-like sharing without forcing everything into one chain. Fine on a
          prototype you own; doing the same to a <em>built-in</em> (<code>Array.prototype.x =
          ...</code>) is a real anti-pattern — verified: it leaks into <code>for...in</code> on
          every array in the program, and risks colliding with a same-named method the spec adds
          later.
        </p>
      </InfoBox>

      <h2>Arrays, Destructuring &amp; Iterables</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Method</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Returns</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Mutates original?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>map / filter / reduce</code></td>
            <td style={{ padding: '0.75rem' }}>new array / any value</td>
            <td style={{ padding: '0.75rem' }}>No</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>sort / reverse / splice</code></td>
            <td style={{ padding: '0.75rem' }}>the same array, mutated</td>
            <td style={{ padding: '0.75rem' }}><strong>Yes</strong></td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>toSorted / toReversed / toSpliced / with</code> (ES2023)</td>
            <td style={{ padding: '0.75rem' }}>new array</td>
            <td style={{ padding: '0.75rem' }}>No — verified original untouched</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>at(-1)</code> (ES2022)</td>
            <td style={{ padding: '0.75rem' }}>element</td>
            <td style={{ padding: '0.75rem' }}>No — drop-in for <code>arr[arr.length-1]</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="javascript" title="Destructuring swap — no temp variable">
{`let x = 1, y = 2;
[x, y] = [y, x];   // x=2, y=1 — verified`}
      </CodeBlock>

      <InfoBox variant="warning" title="for...in on arrays is a trap">
        <p>
          Not because integer keys enumerate out of order (they don&apos;t — verified, they walk
          ascending). The real trap: <code>for...in</code> also visits inherited enumerable
          properties (e.g. anything added to <code>Array.prototype</code>) and any stray own
          property you bolted on. Use <code>for...of</code>, <code>.forEach</code>, or a{' '}
          <code>map</code>/<code>filter</code> chain for arrays; save <code>for...in</code> for
          plain objects where you actually want that behavior.
        </p>
      </InfoBox>

      <h2>Promises &amp; Async</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Combinator</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Settles when</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Verified behavior</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>Promise.all</code></td>
            <td style={{ padding: '0.75rem' }}>all fulfill, or first rejection</td>
            <td style={{ padding: '0.75rem' }}>One reject drops every other result immediately</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>Promise.allSettled</code></td>
            <td style={{ padding: '0.75rem' }}>always waits for all</td>
            <td style={{ padding: '0.75rem' }}>Reports each outcome individually, never rejects</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><code>Promise.race</code></td>
            <td style={{ padding: '0.75rem' }}>first to settle, win or lose</td>
            <td style={{ padding: '0.75rem' }}>A fast rejection wins over a slow fulfillment</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}><code>Promise.any</code></td>
            <td style={{ padding: '0.75rem' }}>first fulfillment</td>
            <td style={{ padding: '0.75rem' }}>All-reject case throws real <code>AggregateError</code></td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="text" title="The event loop ordering — verified real output">
{`console.log('1');
setTimeout(() => console.log('2'), 0);       // macrotask queue
Promise.resolve().then(() => console.log('3')); // microtask queue
console.log('4');

// Real logged order: 1, 4, 3, 2
// ALL microtasks drain before the next macrotask — even a 0ms setTimeout.`}
      </CodeBlock>

      <InfoBox variant="danger" title="The missed-await bug — verified with a real unhandledRejection">
        <p>
          Calling an async function inside a <code>try</code> block <strong>without</strong>{' '}
          <code>await</code>-ing it means its rejection happens after the <code>try/catch</code>{' '}
          already finished — the <code>catch</code> block genuinely never runs. Only a separate{' '}
          <code>process.on(&apos;unhandledRejection&apos;, ...)</code> handler (or, with no
          handler at all, a real process crash) catches it. Always <code>await</code> inside{' '}
          <code>try</code>, or attach <code>.catch()</code> directly to the call.
        </p>
      </InfoBox>

      <h2>Error Handling</h2>

      <CodeBlock language="javascript" title="Custom errors + error.cause (ES2022) — the production pattern">
{`class ApiError extends Error {
  constructor(message, opts) { super(message, opts); this.name = 'ApiError'; }
}

try {
  await saveToDb(record);
} catch (err) {
  throw new ApiError('Failed to save record', { cause: err });  // preserves root cause
}

err instanceof ApiError  -> true
err instanceof Error     -> true   (subclassing Error keeps the chain intact)
err.cause                -> the original error, still fully inspectable`}
      </CodeBlock>

      <p>
        <code>finally</code> runs even when <code>try</code> hits a <code>return</code> or{' '}
        <code>catch</code> re-throws — and a <code>return</code> written inside{' '}
        <code>finally</code> itself silently overrides whatever <code>try</code> returned. Verified,
        not assumed.
      </p>

      <h2>Modules — ESM vs CommonJS</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}></th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>ESM (import/export)</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>CommonJS (require)</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Bindings</td>
            <td style={{ padding: '0.75rem' }}><strong>Live</strong> — re-reading an import sees later mutations</td>
            <td style={{ padding: '0.75rem' }}>Copied once at <code>require()</code> time — frozen</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Resolution</td>
            <td style={{ padding: '0.75rem' }}>Static (analyzable without running code)</td>
            <td style={{ padding: '0.75rem' }}>Dynamic (a real function call)</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Top-level <code>await</code></td>
            <td style={{ padding: '0.75rem' }}>Yes</td>
            <td style={{ padding: '0.75rem' }}>No — real <code>SyntaxError</code> at parse time</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}>File signal</td>
            <td style={{ padding: '0.75rem' }}><code>.mjs</code>, or <code>"type":"module"</code></td>
            <td style={{ padding: '0.75rem' }}><code>.cjs</code>, or the default with no <code>"type"</code></td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="import() is always dynamic — and always a Promise">
        <p>
          <code>const mod = await import(&apos;./feature.js&apos;)</code> works in both systems,
          resolves to the module&apos;s namespace object, and is the standard way to code-split or
          conditionally load. Verified: <code>modulePromise instanceof Promise</code> is{' '}
          <code>true</code>.
        </p>
      </InfoBox>

      <h2>Feature Timeline — ES2015 Through ES2026</h2>

      <CodeBlock language="text" title="Year -> headline additions (full depth in Modern JS Tour + the dedicated ES2017 lesson)">
{`2015 (ES6)   let/const, arrow fns, classes, template literals, destructuring,
             default/rest/spread, Promises, modules, generators, Map/Set
2016 (ES7)   Array.includes(), ** exponentiation operator
2017 (ES8)   async/await, Object.values/entries, padStart/padEnd,
             Object.getOwnPropertyDescriptors, trailing commas, SharedArrayBuffer+Atomics
             -> see the dedicated ES2017 lesson for all six, verified individually
2018 (ES9)   object rest/spread, for-await-of, Promise.finally, regex named groups
2019 (ES10)  flat/flatMap, Object.fromEntries, optional catch binding, trimStart/End
2020 (ES11)  ?. optional chaining, ?? nullish coalescing, BigInt,
             Promise.allSettled, dynamic import(), globalThis
2021 (ES12)  replaceAll, Promise.any, ||= &&= ??=, numeric separators (1_000_000)
2022 (ES13)  top-level await, true private #fields, static blocks, .at(),
             Object.hasOwn, error.cause
2023 (ES14)  toSorted/toReversed/toSpliced/with, findLast/findLastIndex
2024 (ES15)  Object.groupBy/Map.groupBy, Promise.withResolvers,
             ArrayBuffer.transfer, /v regex flag
2025 (ES16)  iterator helpers (.map/.filter/.take/.drop/.toArray on any
             iterator), Set methods (union/intersection/difference/...),
             Promise.try, RegExp.escape, JSON modules + import attributes,
             Float16Array, regex modifiers (?i:...), dup named capture groups
2026 (ES17)  Math.sumPrecise, Error.isError, Uint8Array to/fromBase64 + Hex,
             Array.fromAsync, Iterator.concat, Map/WeakMap getOrInsert,
             JSON.rawJSON / JSON.isRawJSON

2027 (next)  Temporal, 'using' / 'await using' (explicit resource management),
             Atomics.pause, Iterator.zip  -- all Stage 4, some already in V8

Caution: an edition number says what TC39 ratified, not what your runtime
can execute. On Node 25.2.1 today, 'using' RUNS (ES2027) while Math.sumPrecise,
Iterator.concat and Map.getOrInsert DO NOT (ES2026). Check the runtime.
And when a TypeScript release note "adds" iterator helpers (5.6) or 'using'
(5.2), it added the TYPES -- the features themselves are ECMAScript.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The two most common real-world bugs on this whole page">
        <p>
          <strong>1)</strong> <code>||</code> where you meant <code>??</code> — silently discards a
          legitimate <code>0</code>, <code>&apos;&apos;</code>, or <code>false</code>.{' '}
          <strong>2)</strong> An <code>async</code> call inside <code>try</code> with no{' '}
          <code>await</code> in front of it — the <code>catch</code> block is a no-op and the
          rejection escapes as unhandled. Both are covered above with real, run output — both are
          worth a second look in code review every time you see them.
        </p>
      </InfoBox>

      <h2>Section Index</h2>

      <CodeBlock language="text" title="All 10 lessons, in reading order">
{`1. Fundamentals & Syntax                      var/let/const, hoisting, TDZ, truthy/falsy
2. Functions, Scope & Closures                this binding, closures, the var/let loop bug
3. Objects, Classes & Prototypes              prototype chain, class as sugar, freeze/seal
4. Arrays, Destructuring & Iterables          array methods, destructuring, Symbol.iterator
5. Asynchronous JavaScript                    Promises, async/await, the event loop
6. Modules & Tooling                          ESM vs CommonJS, live bindings vs copies
7. Error Handling                             try/catch/finally, custom errors, error.cause
8. Modern JavaScript: ES2015-2024 Feature Tour  the chronological survey
9. ECMAScript 2017 (ES8): The Complete Deep Dive  async/await's real debut, and 5 more
10. This page`}
      </CodeBlock>
    </LessonLayout>
  );
}
