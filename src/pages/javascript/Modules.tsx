import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsModules() {
  return (
    <LessonLayout
      title="Modules & Tooling"
      sectionId="javascript"
      lessonIndex={5}
      prev={{ path: '/javascript/async', label: 'Asynchronous JavaScript' }}
      next={{ path: '/javascript/error-handling', label: 'Error Handling' }}
    >
      <p>
        JavaScript has two module systems in active use: <strong>ES Modules</strong> (ESM
        &mdash; <code>import</code>/<code>export</code>) and <strong>CommonJS</strong> (CJS
        &mdash; <code>require</code>/<code>module.exports</code>). They look similar enough
        that people treat them as syntax variants of the same thing. They are not. ESM is
        resolved statically before any code runs; CJS is resolved dynamically, line by line,
        as the file executes. That one difference cascades into everything else in this
        lesson &mdash; live bindings, top-level <code>await</code>, and every interop gotcha
        you will hit mixing the two. Every claim below was run for real in Node, not recalled
        from memory &mdash; you'll see the actual terminal output.
      </p>

      {/* ── Section 1: Static vs Dynamic ─────────────────────────── */}
      <h2>1. Static Analysis vs Dynamic Resolution</h2>

      <p>
        ESM <code>import</code>/<code>export</code> declarations must appear at the top level
        of a file, with a literal module specifier &mdash; you cannot conditionally import or
        build the path from a variable. That rigidity is the point: it lets the JS engine parse
        the entire module graph <em>before executing a single line</em>, wiring up bindings
        between modules ahead of time.
      </p>

      <p>
        CJS <code>require()</code> is a plain function call. It runs exactly where you put it,
        can be wrapped in an <code>if</code>, called with a computed string, and returns
        whatever <code>module.exports</code> happened to be set to <em>at that moment</em> in
        the required file's execution.
      </p>

      <CodeBlock language="javascript" title="Static (ESM) vs dynamic (CJS) — what's legal">
{`// ── ESM: must be top-level, literal specifier ──
import { readFile } from 'node:fs/promises';   // OK
if (needsLodash) {
  import { debounce } from 'lodash';            // SyntaxError — import isn't a statement here
}

// ── CJS: it's just a function call ──
const { readFile } = require('node:fs/promises'); // OK
if (needsLodash) {
  const { debounce } = require('lodash');          // OK — perfectly legal
}
const dep = require('./' + name + '.js');           // OK — computed path, CJS doesn't care`}
      </CodeBlock>

      <InfoBox variant="info" title="Why static analysis matters in practice">
        Because ESM's shape is known before execution, bundlers (Vite, Rollup, webpack) can
        <strong> tree-shake</strong> &mdash; strip out exports nobody imports &mdash; and
        tooling can autocomplete/typecheck imports without running your code. CJS's
        dynamism makes both of those fundamentally harder; bundlers have to fall back to
        conservative, whole-module inclusion for CJS dependencies.
      </InfoBox>

      <FlowChart
        title="How each system resolves a module graph"
        chart={"graph TD\n  subgraph ESM[\"ES Modules\"]\n    A1[Parse all import/export\\nstatements first] --> A2[Build full dependency graph]\n    A2 --> A3[Link live bindings\\nbetween modules]\n    A3 --> A4[THEN execute module bodies\\ntop to bottom]\n  end\n  subgraph CJS[\"CommonJS\"]\n    B1[Start executing file\\ntop to bottom] --> B2{Hit a require call?}\n    B2 -->|Yes| B3[Pause, run that file\\nnow, synchronously]\n    B3 --> B4[Copy module.exports\\nvalue at this instant]\n    B4 --> B2\n    B2 -->|No more| B5[Done]\n  end"}
      />

      {/* ── Section 2: Named vs Default Exports ──────────────────── */}
      <h2>2. Named vs Default Exports</h2>

      <p>
        ESM gives you two independent export mechanisms per module: any number of{' '}
        <strong>named exports</strong>, and at most one <strong>default export</strong>. They
        are not related &mdash; a module can have both, either, or neither.
      </p>

      <CodeBlock language="javascript" title="math.js — named and default exports">
{`// Named exports — export as many as you want, each with its own name
export const PI = 3.14159;
export function square(x) { return x * x; }
export function cube(x) { return x * x * x; }

// Default export — at most one per module, imported with any local name
export default function add(a, b) { return a + b; }`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Importing both flavors">
{`// Named imports must match the exported names (destructuring-like syntax)
import { PI, square } from './math.js';

// Default import: name it whatever you want, no braces
import add from './math.js';

// Combine both in one statement
import add, { PI, square, cube } from './math.js';

// Rename a named import to avoid a collision
import { square as sq } from './math.js';

// Grab everything as a namespace object
import * as MathUtils from './math.js';
MathUtils.square(4); // 16
MathUtils.default(2, 3); // 5 — the default export lives at .default`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer named exports for anything with more than one thing">
        Named exports are renamed and refactor-tracked reliably by editors; a default export's
        local name is invented fresh at every import site, so two files can call the same
        thing <code>add</code> and <code>sum</code>. Reserve default exports for files that
        genuinely export one primary thing (a single React component, a single class).
      </InfoBox>

      {/* ── Section 3: Dynamic import() ──────────────────────────── */}
      <h2>3. Dynamic <code>import()</code></h2>

      <p>
        Static <code>import</code> declarations run before your code does. Sometimes you want
        the opposite &mdash; load a module conditionally, lazily, or from a computed path,
        <em>while</em> your code is running. That's what the <code>import()</code> function
        (technically a dynamic import <em>expression</em>) is for. Unlike static imports, it's
        legal anywhere an expression is legal, and it returns a <strong>real Promise</strong>{' '}
        that resolves to the module's namespace object.
      </p>

      <CodeBlock language="javascript" title="dynamic-import-demo.js — ran with `node dynamic-import-demo.js`">
{`const modulePromise = import('./counter.js');
console.log('import() returned:', modulePromise, modulePromise instanceof Promise);

modulePromise.then((mod) => {
  console.log('resolved module namespace object:', mod);
  console.log('mod.count =', mod.count);
});`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual terminal output — verified on Node v25.2.1">
{`$ node dynamic-import-demo.js
import() returned: Promise { <pending> } true
resolved module namespace object: [Module: null prototype] { count: 0, increment: [Function: increment] }
mod.count = 0`}
      </CodeBlock>

      <p>
        That's not a simulation of a Promise &mdash; <code>modulePromise instanceof Promise</code>{' '}
        really printed <code>true</code>, and the resolved value really is the module's
        namespace object with every named export attached as a property. This is exactly why{' '}
        <code>import()</code> is the standard way to code-split a React app:
      </p>

      <CodeBlock language="javascript" title="Real-world use: React.lazy + code splitting">
{`import { lazy, Suspense } from 'react';

// This chunk is NOT downloaded until the component actually renders
const SettingsPanel = lazy(() => import('./SettingsPanel.jsx'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <SettingsPanel />
    </Suspense>
  );
}`}
      </CodeBlock>

      {/* ── Section 4: Live Bindings vs Value Copies ─────────────── */}
      <h2>4. Live Bindings vs Value Copies &mdash; the single most-tested fact</h2>

      <p>
        Here is the fact interviewers ask about and almost nobody has actually watched happen:
        when you <code>import</code> something from an ES module, you get a{' '}
        <strong>live, read-only view</strong> onto the exporting module's variable &mdash; not
        a copy of its value at import time. If the exporting module later reassigns that
        variable, every importer sees the new value immediately, without re-importing anything.
        CommonJS has no equivalent mechanism: <code>require()</code> returns the{' '}
        <code>module.exports</code> object as it existed at the moment <code>require</code>{' '}
        ran, and primitive values copied out of it never update again.
      </p>

      <CodeBlock language="javascript" title="ESM — counter.js (exports a mutable let)">
{`export let count = 0;

export function increment() {
  count++;
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="ESM — main.js (imports it, mutates via the module, re-reads it)">
{`import { count, increment } from './counter.js';

console.log('before increment, count =', count);
increment();
increment();
console.log('after two increments, count =', count);`}
      </CodeBlock>

      <CodeBlock language="bash" title={'Real terminal output — package.json has "type": "module"'}>
{`$ node main.js
before increment, count = 0
after two increments, count = 2`}
      </CodeBlock>

      <p>
        <code>main.js</code> never reassigns <code>count</code> itself &mdash; it only calls{' '}
        <code>increment()</code>, which mutates <code>counter.js</code>'s own local variable.
        Yet the imported <code>count</code> binding in <code>main.js</code> reflects the new
        value on the very next read. That's a live binding, not a snapshot.
      </p>

      <p>Now the exact same shape in CommonJS:</p>

      <CodeBlock language="javascript" title="CJS — counter.js">
{`let count = 0;

function increment() {
  count++;
}

module.exports = { count, increment };`}
      </CodeBlock>

      <CodeBlock language="javascript" title="CJS — main.js">
{`const counterA = require('./counter.js');
const counterB = require('./counter.js'); // same cached module instance

console.log('before increment, counterA.count =', counterA.count);
counterA.increment();
counterA.increment();
console.log('after two increments, counterA.count =', counterA.count);
console.log('counterB.count (same require cache) =', counterB.count);`}
      </CodeBlock>

      <CodeBlock language="bash" title={'Real terminal output — package.json has "type": "commonjs"'}>
{`$ node main.js
before increment, counterA.count = 0
after two increments, counterA.count = 0
counterB.count (same require cache) = 0`}
      </CodeBlock>

      <p>
        Same logic, same call sequence &mdash; count stays <code>0</code> forever, even though{' '}
        <code>counterB</code> is the exact same cached module object as{' '}
        <code>counterA</code> (Node caches <code>require()</code> results by resolved path).
        Here's why: <code>module.exports = &#123; count, increment &#125;</code> copies the{' '}
        <em>current number value</em> of <code>count</code> into a new object property at the
        moment that line runs. <code>count</code> the number and{' '}
        <code>counterA.count</code> the object property have no relationship after that
        &mdash; incrementing the module's internal <code>count</code> variable does nothing to
        the already-copied property. (The <code>increment</code> function itself still works
        correctly, because functions are copied by reference and close over the module's real
        internal variable &mdash; it's specifically the primitive <code>count</code> value that
        gets frozen at export time.)
      </p>

      <FlowChart
        title="Same mutation, two different outcomes"
        chart={"graph LR\n  subgraph ESM[\"ESM: live binding\"]\n    E1[\"counter.js: let count = 0\"] -.live link.-> E2[\"main.js: import count\"]\n    E1 --> E3[\"increment() does count++\"]\n    E3 -.reflected instantly.-> E2\n    E2 --> E4[\"count reads as 2\"]\n  end\n  subgraph CJS[\"CJS: value copy\"]\n    C1[\"counter.js: module.exports = { count }\"] --copied once at require()--> C2[\"main.js: counterA.count\"]\n    C1 --> C3[\"increment() does count++\"]\n    C3 -.does NOT reach.-> C2\n    C2 --> C4[\"count still reads as 0\"]\n  end"}
      />

      <InfoBox variant="warning" title="Why this trips people up in interviews and in real bugs">
        The bug shows up as: &quot;I updated a config/singleton value in one module but another
        module that imported it still has the old value.&quot; In CommonJS that's expected
        behavior for primitives (only object <em>references</em> stay shared — mutate a
        property on a shared object and everyone sees it; reassign a copied primitive and
        nobody else does). In ESM the language guarantees live bindings for everything,
        primitives included, which is one reason ESM is considered the more predictable
        system for shared mutable state like feature flags or counters.
      </InfoBox>

      {/* ── Section 5: Top-Level Await ───────────────────────────── */}
      <h2>5. Top-Level <code>await</code> &mdash; ESM Only</h2>

      <p>
        ES Modules allow <code>await</code> directly at the top level of a file &mdash; no
        wrapping <code>async function</code> required. The module system defers anything that
        imports your module until the <code>await</code> settles. CommonJS has no such
        allowance: <code>await</code> outside an <code>async function</code> is a syntax error,
        full stop.
      </p>

      <CodeBlock language="javascript" title={'tla.js — ESM, package.json has "type": "module"'}>
{`console.log('starting tla.js (ESM, no wrapper function)');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await delay(50);

console.log('top-level await finished, this line ran after the real delay');`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real output — this actually waited 50ms between the two lines">
{`$ node tla.js
starting tla.js (ESM, no wrapper function)
top-level await finished, this line ran after the real delay`}
      </CodeBlock>

      <p>The identical file, run as CommonJS, fails immediately at parse time:</p>

      <CodeBlock language="bash" title={'Same code, package.json has "type": "commonjs" — real error'}>
{`$ node tla.js
/…/cjs-proj/tla.js:7
await delay(50);
^^^^^

SyntaxError: await is only valid in async functions and the top level bodies of modules
    at wrapSafe (node:internal/modules/cjs/loader:1691:18)
    ...
Node.js v25.2.1`}
      </CodeBlock>

      <InfoBox variant="note" title="What top-level await is actually for">
        The common real use: awaiting a one-time async setup step &mdash; opening a database
        connection, reading a remote config, dynamically importing a WASM module &mdash;
        before the rest of the module's exports are considered ready. Any module that imports
        yours will itself wait for your top-level <code>await</code> to resolve before it
        finishes loading, which is powerful but means a slow top-level <code>await</code>{' '}
        anywhere in a dependency graph slows down every importer's startup.
      </InfoBox>

      {/* ── Section 6: How Node decides which system a file uses ──── */}
      <h2>6. How Node Decides: ESM or CommonJS?</h2>

      <p>
        Node has to pick a module system for every file it loads. It uses this order, checked
        for real below:
      </p>

      <CodeBlock language="text" title="Node's resolution order (highest priority first)">
{`1. File extension .mjs   → always ESM, no matter what package.json says
2. File extension .cjs   → always CommonJS, no matter what package.json says
3. File extension .js    → look up the nearest package.json:
                              "type": "module"    → treat as ESM
                              "type": "commonjs"  → treat as CommonJS
                              no "type" field      → defaults to CommonJS`}
      </CodeBlock>

      <p>
        The extension overrides always win. Here's the proof: a package.json declares{' '}
        <code>&quot;type&quot;: &quot;commonjs&quot;</code>, yet a sibling <code>.mjs</code>{' '}
        file in that same folder still runs as a real ES module &mdash; and a{' '}
        <code>.cjs</code> file would run as CommonJS even under{' '}
        <code>&quot;type&quot;: &quot;module&quot;</code>.
      </p>

      <CodeBlock language="json" title="package.json for this folder">
{`{ "name": "interop-proj", "type": "commonjs" }`}
      </CodeBlock>

      <CodeBlock language="javascript" title={'esm-lib.mjs — runs as ESM despite "type": "commonjs"'}>
{`export const greeting = 'hello from ESM';
export default function greet() {
  return greeting;
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Practical takeaway">
        If you're not sure what module system a stray <code>.js</code> file uses, check the
        nearest <code>package.json</code>'s <code>&quot;type&quot;</code> field — not the file
        itself. Libraries that ship both formats commonly use <code>.mjs</code>/<code>.cjs</code>{' '}
        specifically so consumers don't need to care what <code>&quot;type&quot;</code> their
        own project declares.
      </InfoBox>

      {/* ── Section 7: Interop gotchas ────────────────────────────── */}
      <h2>7. Interop Gotchas: Mixing CJS and ESM</h2>

      <h3>Requiring an ESM module from CommonJS</h3>

      <p>
        This used to be flatly impossible &mdash; <code>require()</code> is synchronous and
        ESM loading is asynchronous by design, so older Node always threw. As of Node 22.12+
        (and on, including the Node 25 used to verify this lesson), <code>require()</code> can
        load a <strong>synchronous</strong> ES module &mdash; one with no top-level{' '}
        <code>await</code> anywhere in its graph &mdash; via a new feature called{' '}
        <code>require(esm)</code>. Both behaviors were verified for real below.
      </p>

      <CodeBlock language="javascript" title="require-esm.js — requiring a plain (synchronous) .mjs file">
{`try {
  const esm = require('./esm-lib.mjs');
  console.log('unexpectedly worked:', esm);
} catch (err) {
  console.log('require() of ESM failed as expected:');
  console.log('  err.code =', err.code);
  console.log('  err.message =', err.message);
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real output on Node v25.2.1 (require(esm) is on by default)">
{`$ node require-esm.js
unexpectedly worked: [Module: null prototype] {
  __esModule: true,
  default: [Function: greet],
  greeting: 'hello from ESM'
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't rely on this for older Node — verified both ways">
        Running the exact same script with{' '}
        <code>node --no-experimental-require-module require-esm.js</code> reproduces the
        classic failure, which is still what you'll get on Node versions before this feature
        existed:
        <CodeBlock language="bash" title="Real output with the feature explicitly disabled">
{`err.code = ERR_REQUIRE_ESM
err.message = require() of ES Module .../esm-lib.mjs from .../require-esm.js not supported.
Instead change the require of .../esm-lib.mjs to a dynamic import() which is available in all CommonJS modules.`}
        </CodeBlock>
        The safe, portable fix in a CommonJS file is always the one the error message itself
        suggests: <code>await import('./esm-lib.mjs')</code> instead of{' '}
        <code>require()</code>.
      </InfoBox>

      <p>
        And even with <code>require(esm)</code> enabled, a top-level-<code>await</code> module
        still can't be required &mdash; that's the one case where synchronous loading is
        actually impossible, not just unsupported:
      </p>

      <CodeBlock language="bash" title="Real output — requiring an ESM module that uses top-level await">
{`err.code = ERR_REQUIRE_ASYNC_MODULE
err.message = require() cannot be used on an ESM graph with top-level await. Use import() instead.`}
      </CodeBlock>

      <h3>Importing a CommonJS module from ESM</h3>

      <p>
        This direction has always worked, because <code>import</code> can await internally.
        Node wraps the CJS module's <code>module.exports</code> as the default export of the
        namespace:
      </p>

      <CodeBlock language="javascript" title="cjs-lib.cjs">
{`module.exports = { name: 'cjs-lib', version: 1 };`}
      </CodeBlock>

      <CodeBlock language="javascript" title="import-cjs.mjs">
{`import cjsDefault from './cjs-lib.cjs';
import * as cjsNamespace from './cjs-lib.cjs';

console.log('default import of CJS module.exports:', cjsDefault);
console.log('namespace import of CJS module.exports:', cjsNamespace);
console.log('cjsDefault === cjsNamespace.default:', cjsDefault === cjsNamespace.default);`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real output">
{`$ node import-cjs.mjs
default import of CJS module.exports: { name: 'cjs-lib', version: 1 }
namespace import of CJS module.exports: [Module: null prototype] {
  default: { name: 'cjs-lib', version: 1 },
  'module.exports': { name: 'cjs-lib', version: 1 }
}
cjsDefault === cjsNamespace.default: true`}
      </CodeBlock>

      <p>
        The genuinely surprising part is <em>named</em> imports from a CJS module. Node runs a
        static analyzer (<code>cjs-module-lexer</code>) over the CJS file's source to guess
        which properties are safe to expose as named exports &mdash; but it only recognizes
        specific assignment patterns, not arbitrary object literals. This was verified with
        two shapes that look equivalent at runtime but are not equivalent to the analyzer:
      </p>

      <CodeBlock language="javascript" title="Shape A — a single object-literal assignment (FAILS as a named import)">
{`// cjs-lib2.cjs
module.exports = { label: 'cjs-lib', version: 1 };`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real error — the lexer can't see inside the object literal">
{`$ node -e "import('./import-cjs-named2.mjs')"
SyntaxError: Named export 'label' not found. The requested module './cjs-lib2.cjs' is a
CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from './cjs-lib2.cjs';
const { label, version } = pkg;`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Shape B — per-property assignments (WORKS as a named import)">
{`// cjs-lib3.cjs
exports.label = 'cjs-lib';
exports.version = 1;`}
      </CodeBlock>

      <CodeBlock language="bash" title="Real output — this one succeeds">
{`$ node -e "
import('./import-cjs-named3.mjs').then(() => {});
"
named import from CJS via exports.x = assignments (cjs-module-lexer CAN see these statically): cjs-lib 1`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified, not assumed: two exports.foo = ... lines beat one object literal">
        Both CJS files above export the exact same two properties at runtime, and both work
        identically with <code>require()</code>. But only the <code>exports.label = ...</code>{' '}
        / <code>exports.version = ...</code> style is visible to ESM's named-import syntax.
        The lesson: when you write a CJS module you intend ESM consumers to{' '}
        <code>import &#123; someExport &#125;</code> from, assign each export as its own
        statement &mdash; don't collapse them into a single <code>module.exports = &#123; ... &#125;</code>{' '}
        object literal. Everyone can always fall back to the default import (
        <code>import pkg from '...'; const &#123; someExport &#125; = pkg;</code>), which
        works regardless of how the CJS file wrote its exports.
      </InfoBox>

      <h2>Summary</h2>

      <CodeBlock language="text" title="ESM vs CommonJS — verified differences">
{`                          ESM                          CommonJS
Syntax                    import / export              require / module.exports
Resolution                Static (before execution)     Dynamic (at the require() call)
Import location            Top level only                Anywhere, even conditional
Bindings                  Live — reflect later changes  Value copied at require() time
Top-level await            Supported natively            SyntaxError, always
require(esm) (Node 22.12+) n/a                           Works for sync ESM graphs only
File always this system    .mjs                          .cjs
Package.json default       "type": "module"              "type": "commonjs" or absent`}
      </CodeBlock>

      <InfoBox variant="success" title="What you should take away">
        Static analysis is what makes ESM's tree-shaking, live bindings, and top-level{' '}
        <code>await</code> possible — they're not separate features, they're consequences of
        resolving the whole graph before running any code. When debugging a real interop bug
        between the two systems, check three things in order: the file extension, the nearest{' '}
        <code>package.json</code>'s <code>&quot;type&quot;</code> field, and — if a named
        import from a CJS package is missing — whether that package assigned exports one
        property at a time or as a single object literal.
      </InfoBox>
    </LessonLayout>
  );
}
