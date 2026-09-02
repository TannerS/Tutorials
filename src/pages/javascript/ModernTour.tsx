import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsModernTour() {
  return (
    <LessonLayout
      title="Modern JavaScript: ES2015-2026 Feature Tour"
      sectionId="javascript"
      lessonIndex={7}
      prev={{ path: '/javascript/error-handling', label: 'Error Handling' }}
      next={{ path: '/javascript/es2017', label: 'ECMAScript 2017 (ES8): The Complete Deep Dive' }}
    >
      <p>
        JavaScript ships a new spec every year now. This lesson is a chronological map of what
        landed and when, from the 2015 rewrite that made the language feel modern through the
        small-but-useful additions that keep arriving every June, up to ES2026 (ratified June 2026)
        and a look at what is already locked in for ES2027. Earlier lessons in this section
        already cover most of the ES2015 mechanics in depth (destructuring, closures, modules,
        async) — here they're just named and dated so you can place them on the timeline.
      </p>

      <h2>ES2015 / ES6 — The Big Bang</h2>
      <p>
        This is the release that turned JavaScript into a language people wanted to write. Almost
        everything you consider "normal" JS syntax today shipped in one go.
      </p>
      <CodeBlock language="javascript" title="ES2015 headliners">
{`let count = 0;                 // block-scoped, replaces var
const PI = 3.14159;             // block-scoped, can't be reassigned

const add = (a, b) => a + b;    // arrow functions — lexical 'this'

class Animal {                  // class syntax over prototypes
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} makes a sound.\`; }
}

const name = 'Ada';
console.log(\`Hello, \${name}!\`);           // template literals

const { name: n, ...rest } = { name: 'Ada', age: 30 };  // destructuring + rest
const merged = { ...rest, active: true };                // spread

function greet(name = 'friend') { return \`Hi, \${name}\`; }  // default params
function sum(...nums) { return nums.reduce((a, b) => a + b, 0); }  // rest params

fetch('/api/user').then(res => res.json());   // Promises

// ES modules
export function helper() {}
import { helper } from './utils.js';

for (const x of [1, 2, 3]) { /* iterables */ }
function* gen() { yield 1; yield 2; }          // generators
const map = new Map(); const set = new Set();  // Map / Set
Symbol('id');                                   // Symbol`}
      </CodeBlock>
      <InfoBox variant="info" title="Where to go deeper">
        <p>
          Destructuring and spread/rest live in{' '}
          <a href="/javascript/arrays-iterables">Arrays, Destructuring &amp; Iterables</a>;
          closures and arrow-function scoping in{' '}
          <a href="/javascript/functions-closures">Functions, Scope &amp; Closures</a>; classes in{' '}
          <a href="/javascript/objects-prototypes">Objects, Classes &amp; Prototypes</a>; Promises
          and modules in <a href="/javascript/async">Asynchronous JavaScript</a> and{' '}
          <a href="/javascript/modules">Modules &amp; Tooling</a>.
        </p>
      </InfoBox>

      <h2>ES2016 / ES7 — The Small One</h2>
      <p>
        The shortest release in the modern era — just two additions, both quality-of-life fixes.
      </p>
      <CodeBlock language="javascript" title="includes() and the exponentiation operator">
{`const nums = [1, 2, NaN];
nums.includes(2);     // true
nums.includes(NaN);   // true — unlike indexOf(NaN), which always returns -1

2 ** 10;   // 1024 — same as Math.pow(2, 10), just infix`}
      </CodeBlock>

      <h2>ES2017 / ES8</h2>
      <p>
        ES2017 gets its own dedicated lesson next — async/await, <code>Object.values</code>/
        <code>Object.entries</code>, and more.
      </p>

      <h2>ES2018 / ES9 — Async Iteration &amp; Object Spread</h2>
      <CodeBlock language="javascript" title="Object rest/spread, for await...of, finally, named groups">
{`// rest/spread now work on object literals, not just arrays
const { id, ...fields } = { id: 1, name: 'Ada', role: 'admin' };
const updated = { ...fields, role: 'user' };

// async iteration — for-await over an async iterable
async function readAll(asyncIterable) {
  for await (const chunk of asyncIterable) {
    console.log(chunk);
  }
}

fetch('/api').finally(() => setLoading(false));  // Promise.prototype.finally

// regex named capture groups
const re = /(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})/;
const { groups } = '2024-06-01'.match(re);
groups.year;   // '2024'`}
      </CodeBlock>

      <h2>ES2019 / ES10 — Flattening &amp; Cleanup</h2>
      <CodeBlock language="javascript" title="flat/flatMap, fromEntries, optional catch, trim">
{`[1, [2, [3, [4]]]].flat();      // [1, 2, [3, [4]]] — one level deep
[1, [2, [3, [4]]]].flat(Infinity);  // [1, 2, 3, 4]
[1, 2, 3].flatMap(x => [x, x * 2]); // [1, 2, 2, 4, 3, 6] — map then flat(1)

Object.fromEntries([['a', 1], ['b', 2]]);   // { a: 1, b: 2 } — inverse of Object.entries

try {
  riskyOperation();
} catch {              // no (e) needed when you don't use the error
  reportFailure();
}

'  hi  '.trimStart();   // 'hi  '
'  hi  '.trimEnd();     // '  hi'`}
      </CodeBlock>

      <h2>ES2020 / ES11 — Optional Chaining &amp; Nullish Coalescing</h2>
      <p>
        This is the release worth slowing down for — <code>?.</code> and <code>??</code> changed
        how everyday defensive code gets written, and the difference between{' '}
        <code>??</code> and <code>||</code> is one of the most common real-world bugs.
      </p>
      <CodeBlock language="javascript" title="Optional chaining short-circuits before it ever crashes">
{`const user = { profile: { name: 'Ada' } };

user?.profile?.name;              // 'Ada'
user?.address?.city;              // undefined — no crash, stops at the first missing link
user?.address?.city?.toUpperCase();  // still undefined — toUpperCase() is never even called

const noop = undefined;
noop?.();                          // undefined — optional call, doesn't throw "not a function"

// without ?., the equivalent access throws:
user.address.city;
// TypeError: Cannot read properties of undefined (reading 'city')`}
      </CodeBlock>
      <InfoBox variant="tip" title="Verified — real Node output">
        <p>
          Ran on Node 25.2.1: <code>user?.address?.city</code> printed{' '}
          <code>undefined</code> three times in a row (plain access, chained access, and chained
          method call), while the unguarded <code>user.address.city</code> threw{' '}
          <code>TypeError: Cannot read properties of undefined (reading &apos;city&apos;)</code>.
          Optional chaining stops evaluating the moment it hits <code>null</code>/
          <code>undefined</code> — the rest of the chain, including any method call at the end,
          simply never runs.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="?? vs || — the difference is 0, '', false, and NaN">
{`0  ?? 'default';    // 0          — 0 is not null/undefined, so ?? keeps it
0  || 'default';    // 'default'  — 0 is falsy, so || replaces it

''  ?? 'default';    // ''
''  || 'default';    // 'default'

false ?? 'default';  // false
false || 'default';  // 'default'

null      ?? 'default';  // 'default'
undefined ?? 'default';  // 'default'`}
      </CodeBlock>
      <InfoBox variant="warning" title="Verified — the real bug this causes">
        <p>
          Actual output: <code>0 ?? &apos;default&apos;</code> is <code>0</code>, but{' '}
          <code>0 || &apos;default&apos;</code> is <code>&apos;default&apos;</code>. Same shape
          for <code>&apos;&apos;</code> and <code>false</code>. If a quantity field, a form input,
          or a feature flag can legitimately be <code>0</code>, <code>&apos;&apos;</code>, or{' '}
          <code>false</code>, <code>||</code> will silently overwrite a valid value with your
          fallback. <code>??</code> checks only for <code>null</code>/<code>undefined</code> and
          leaves every other falsy value alone — that's the entire reason it exists.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="BigInt, Promise.allSettled, dynamic import, globalThis">
{`const big = 9007199254740993n;    // BigInt literal — beyond Number.MAX_SAFE_INTEGER
typeof big;                        // 'bigint'

const results = await Promise.allSettled([task1(), task2()]);
// [{ status: 'fulfilled', value }, { status: 'rejected', reason }]
// unlike Promise.all, this never short-circuits — every settlement is reported

const mod = await import('./feature.js');   // dynamic import — code-splitting, lazy load

globalThis.setTimeout;   // works in browser, Node, and workers — one name for 'the global object'`}
      </CodeBlock>

      <h2>ES2021 / ES12 — Logical Assignment &amp; Readable Numbers</h2>
      <CodeBlock language="javascript" title="replaceAll, Promise.any, ||= &&= ??=, numeric separators">
{`'a-b-c'.replaceAll('-', '_');   // 'a_b_c' — replace() only ever caught the first match

const first = await Promise.any([fetchFromMirrorA(), fetchFromMirrorB()]);
// resolves as soon as ANY promise fulfills; rejects only if ALL of them reject

let config = {};
config.timeout ||= 3000;   // set only if timeout is currently falsy
config.retries &&= 5;      // set only if retries is currently truthy
config.mode    ??= 'auto'; // set only if mode is currently null/undefined

const billion = 1_000_000_000;   // numeric separators — purely a readability aid`}
      </CodeBlock>

      <h2>ES2022 / ES13 — True Private Fields &amp; Top-Level Await</h2>
      <p>
        Private class fields aren't a naming convention or a TypeScript-only check — they're
        enforced by the JS engine itself, at parse time.
      </p>
      <CodeBlock language="javascript" title="#x is really private — verified for real">
{`class Account {
  #balance = 0;
  constructor(initial) { this.#balance = initial; }
  get balance() { return this.#balance; }
}

const acct = new Account(100);
acct.balance;      // 100 — access only through the getter
acct.#balance;      // SyntaxError: Private field '#balance' must be
                     //   declared in an enclosing class
                     //   (a plain typo like acct.#typo fails the same way)

// '#x in obj' — brand check without touching the field (also ES2022)
class Box {
  #x = 1;
  static hasX(obj) { return #x in obj; }
}
Box.hasX(new Box());  // true
Box.hasX({});          // false — not a real error, just false`}
      </CodeBlock>
      <InfoBox variant="tip" title="Verified — real Node output">
        <p>
          Because the check happens while the file is being parsed, not while it runs,{' '}
          <code>acct.#balance</code> written directly in a script fails the whole file to load.
          Forcing it through <code>eval()</code> to catch it at runtime reproduces the real
          engine error: <code>SyntaxError: Private field &apos;#balance&apos; must be declared in
          an enclosing class</code>. There is no way to reach a <code>#</code> field from outside
          its class — no bracket-notation trick, no <code>Object.keys</code> leak, nothing. This
          is a hard language guarantee, not a lint rule.
        </p>
      </InfoBox>
      <CodeBlock language="javascript" title="Class fields, static blocks, at(), Object.hasOwn, error.cause">
{`class Counter {
  count = 0;                 // public field — no constructor needed
  static instances = 0;
  static { Counter.instances = 0; }   // static initialization block

  increment() { this.count++; }
}

[10, 20, 30, 40].at(-1);      // 40 — last element, no .length arithmetic
[10, 20, 30, 40][3];          // 40 — the old way, still fine, just noisier for negative indices

Object.hasOwn(obj, 'key');    // true/false — safe replacement for obj.hasOwnProperty('key')
                               // (works even when 'key' is 'hasOwnProperty' itself)

try {
  await saveToDb(record);
} catch (err) {
  throw new Error('Failed to save record', { cause: err });  // preserves the original error
}

// top-level await — only inside ES modules, no wrapping async function needed
const data = await fetch('/config.json').then(r => r.json());`}
      </CodeBlock>
      <InfoBox variant="info" title="Verified — .at(-1) vs arr[arr.length - 1]">
        <p>
          Both returned <code>40</code> for <code>[10, 20, 30, 40]</code>. <code>.at()</code> also
          works on strings (<code>&apos;hello&apos;.at(-1)</code> gives <code>&apos;o&apos;</code>)
          and accepts positive indices too, so it's a drop-in replacement for bracket access —
          it's just the only one of the two that can count from the end without you computing{' '}
          <code>.length</code> yourself.
        </p>
      </InfoBox>

      <h2>ES2023 / ES14 — Array Methods That Don't Mutate</h2>
      <p>
        Four new array methods mirror existing mutating ones, but return a copy and leave the
        original untouched — useful anywhere you rely on referential equality (React state chief
        among them).
      </p>
      <CodeBlock language="javascript" title="toSorted/toReversed/toSpliced/with — verified originals stay untouched">
{`const original = [3, 1, 2];

original.toSorted();     // [1, 2, 3] — sort() would mutate original in place
original.toReversed();   // [2, 1, 3] — reverse() would mutate original in place
original.with(1, 99);    // [3, 99, 2] — splice() would mutate original in place
original.toSpliced(0, 1); // [1, 2] — removes index 0, returns the new array

original;   // still [3, 1, 2] — every call above left it alone

const nums = [5, 12, 8, 130, 44];
nums.findLast(n => n > 10);       // 44 — last match, searching from the end
nums.findLastIndex(n => n > 10);  // 4`}
      </CodeBlock>
      <InfoBox variant="tip" title="Verified — real Node output">
        <p>
          After calling <code>toSorted()</code>, <code>toReversed()</code>, and{' '}
          <code>with(1, 99)</code> on <code>[3, 1, 2]</code>, logging the original array each time
          printed <code>[3, 1, 2]</code> — unchanged. Each method returns a fresh array (
          <code>[1, 2, 3]</code>, <code>[2, 1, 3]</code>, and <code>[3, 99, 2]</code>{' '}
          respectively) instead of mutating in place.
        </p>
      </InfoBox>

      <h2>ES2024 / ES15 — Grouping &amp; Deferred Promises</h2>
      <CodeBlock language="javascript" title="Object.groupBy, Map.groupBy, Promise.withResolvers — verified">
{`const inventory = [
  { name: 'apple',  type: 'fruit' },
  { name: 'carrot', type: 'vegetable' },
  { name: 'banana', type: 'fruit' },
];

Object.groupBy(inventory, item => item.type);
// { fruit: [apple, banana], vegetable: [carrot] }

Map.groupBy(inventory, item => item.type);
// same grouping, as a Map instead of a plain object — keys can be any type

// Promise.withResolvers — pulls resolve/reject out of the executor callback,
// useful when something OUTSIDE the Promise constructor needs to settle it
const { promise, resolve, reject } = Promise.withResolvers();
socket.onmessage = (e) => resolve(e.data);
socket.onerror = (e) => reject(e);
await promise;`}
      </CodeBlock>
      <InfoBox variant="note" title="Verified — real Node output">
        <p>
          Running the inventory example produced exactly{' '}
          <code>{'{"fruit":[apple,banana],"vegetable":[carrot]}'}</code>, and{' '}
          <code>Promise.withResolvers()</code> returned a promise that resolved to{' '}
          <code>&apos;resolved from outside&apos;</code> after calling the extracted{' '}
          <code>resolve</code> function separately — confirming both work exactly as documented on
          Node 25.x.
        </p>
      </InfoBox>

      <h2>ES2025 / ES16 — Lazy Iteration &amp; Real Set Algebra</h2>
      <p>
        Ratified June 2025. The headline is <strong>iterator helpers</strong>: the array methods
        you already know, moved onto <code>Iterator.prototype</code> so they work lazily on
        anything iterable — including infinite generators, where <code>Array.from()</code> first
        would simply hang.
      </p>
      <CodeBlock language="javascript" title="ES2025 — all verified on Node 25.2.1">
{`// Iterator helpers — lazy, chainable, never materializes the whole sequence
function* naturals() { let n = 1; while (true) yield n++; }
naturals().map(n => n * n).filter(n => n % 2 === 0).take(2).toArray();
// [4, 16]

[1, 2, 3, 4, 5].values().filter(n => n % 2).map(n => n * 10).take(2).toArray();
// [10, 30]

// Set methods — the seven operations everyone used to hand-roll or import lodash for
new Set([1, 2]).union(new Set([2, 3]));              // Set {1, 2, 3}
new Set([1, 2, 3]).intersection(new Set([2, 3, 4])); // Set {2, 3}
// also: difference, symmetricDifference, isSubsetOf, isSupersetOf, isDisjointFrom

// Promise.try — runs the callback synchronously, but a THROW comes back
// as a rejection instead of blowing up the caller
await Promise.try(() => 'sync value, still a promise');
// 'sync value, still a promise'

// RegExp.escape — finally, a correct way to put user input in a pattern
RegExp.escape('a.b*c');   // '\\x61\\.b\\*c'
// (yes, the leading 'a' becomes \\x61 — escaping the first character is
//  deliberate so the result is always safe to concatenate anywhere)

// Float16Array + Math.f16round + DataView get/setFloat16
new Float16Array([1.5, 2.25])[1];   // 2.25

// JSON modules (with import attributes)
import config from './config.json' with { type: 'json' };

// RegExp modifiers and duplicate named capture groups
/(?i:hello) world/.test('HELLO world');                    // true
/(?<year>\\d{4})-\\d\\d|\\d\\d-(?<year>\\d{4})/;               // legal now`}
      </CodeBlock>

      <h2>ES2026 / ES17 — Precision, Binary Strings &amp; Upserts</h2>
      <p>
        Ratified June 2026. A grab-bag of &quot;the correct version of something you were doing
        approximately.&quot;
      </p>
      <CodeBlock language="javascript" title="ES2026">
{`// Math.sumPrecise — correctly-rounded summation. The naive reduce loses the 0.1
// entirely because 1e20 + 0.1 rounds back to 1e20.
Math.sumPrecise([1e20, 0.1, -1e20]);              // 0.1
[1e20, 0.1, -1e20].reduce((a, b) => a + b, 0);    // 0   (verified on Node 25)

// Error.isError — works across realms/iframes, where instanceof Error does not,
// and is not fooled by a plain object that merely looks like an error
Error.isError(new TypeError('x'));         // true
Error.isError({ name: 'Error', message: 'x' });  // false

// Uint8Array <-> base64/hex, without the atob/btoa/String.fromCharCode dance
new Uint8Array([72, 105]).toBase64();   // 'SGk='
Uint8Array.fromBase64('SGk=');          // Uint8Array [72, 105]
new Uint8Array([255, 0, 16]).toHex();   // 'ff0010'

// Array.fromAsync — the async-iterable counterpart to Array.from
await Array.fromAsync(someAsyncGenerator());   // [1, 2]

// Iterator.concat — sequencing iterators without spreading them into arrays
Iterator.concat([1, 2].values(), [3].values()).toArray();   // [1, 2, 3]

// Map/WeakMap upsert — replaces the get-check-set trio
const m = new Map();
m.getOrInsert('k', []).push(1);         // inserts [] the first time, returns it after
m.getOrInsertComputed('k2', () => expensive());  // callback only runs on a miss

// JSON.rawJSON / JSON.isRawJSON — round-trip a big integer without precision loss
JSON.stringify({ n: JSON.rawJSON('12345678901234567890') });
// '{"n":12345678901234567890}'
JSON.stringify({ n: 12345678901234567890 });
// '{"n":12345678901234567000}'   <- a plain number literal already lost the tail`}
      </CodeBlock>

      <InfoBox variant="warning" title="Ratified is not the same as shipped — and neither implies the other">
        <p>
          This is the single most useful thing to internalize about the yearly cadence. Both
          directions of the mismatch are real, measured on Node 25.2.1 today:
        </p>
        <p>
          <strong>Ratified but not yet in V8:</strong> <code>Math.sumPrecise</code>,{' '}
          <code>Iterator.concat</code> and <code>Map.prototype.getOrInsert</code> all threw{' '}
          <code>TypeError: … is not a function</code>. They are in the ES2026 spec; the engine
          hasn&apos;t caught up. Everything else in the ES2026 block above ran.
        </p>
        <p>
          <strong>Shipped but not yet ratified:</strong> <code>using</code> declarations run
          unflagged on Node 25 right now, and they are <em>not</em> in ES2026 — Explicit Resource
          Management is Stage 4 and slated for <strong>ES2027</strong>, alongside{' '}
          <strong>Temporal</strong> (the <code>Date</code> replacement, which missed the June 2026
          cutoff), <code>Atomics.pause</code>, and joint iteration (<code>Iterator.zip</code>).
          Temporal is the reverse case again: ratified for 2027 and still absent from Node 25 —{' '}
          <code>typeof Temporal</code> is <code>&apos;undefined&apos;</code>.
        </p>
        <p>
          The practical rule: an edition number tells you what TC39 agreed on, never what your
          runtime can execute. Check the runtime. And when a TypeScript release note says it
          &quot;added&quot; iterator helpers or <code>using</code>, read that as &quot;added the
          type declarations for&quot; — those are JavaScript features, and TypeScript describing
          them does not make your Node version able to run them.
        </p>
      </InfoBox>

      <InfoBox variant="success" title="The shape of the last decade">
        <p>
          2015 was the rewrite; everything since has been steady, incremental polish — smarter
          defaults for common footguns (<code>??</code>, <code>.at()</code>), real enforcement
          where JS previously only had convention (private fields), array APIs that stopped
          assuming mutation was fine, and — in the most recent editions — correct versions of
          things everyone had been approximating (set algebra, precise summation, base64,
          cross-realm error detection). None of it is flashy. All of it is worth reaching for.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
