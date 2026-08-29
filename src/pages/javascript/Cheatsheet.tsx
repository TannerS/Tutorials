import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function JavaScriptCheatsheet() {
  return (
    <GuideLayout
      title="JAVASCRIPT"
      kicker="FIELD GUIDE"
      glyph="🟨"
      tagline="The language itself — scoping, this, prototypes, async, modules. The parts that bite."
      meta={['ES2015 → ES2026', '12 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning and the worked examples."
      prev={{ path: '/javascript/es2017', label: 'ECMAScript 2017 (ES8): The Complete Deep Dive' }}
      next={null}
    >
      <GuidePanel n={1} title="Declarations & Hoisting" accent="blue" glyph="📦">
        <GuideTable
          head={['', 'var', 'let / const']}
          rows={[
            ['scope', 'function', 'block'],
            ['hoisted', 'yes, as undefined', 'yes, but in the TDZ'],
            ['redeclare', 'allowed', 'SyntaxError'],
            ['on globalThis', 'yes (at top level)', 'no'],
          ]}
        />
        <GuideCode>{`console.log(a);  // undefined  — var is hoisted
var a = 1;

console.log(b);  // ReferenceError — TDZ
let b = 1;`}</GuideCode>
        <GuideRules items={['const binds the VARIABLE, not the value: const o = {}; o.x = 1 is legal.', 'Default to const; use let only when you reassign; never var in new code.']} />
      </GuidePanel>

      <GuidePanel n={2} title="Equality & Truthiness" accent="amber" glyph="⚖️">
        <GuideCode>{`0 == '0'        // true   — == coerces
0 === '0'       // false  — === does not
null == undefined   // true
null === undefined  // false
NaN === NaN     // false! use Object.is or Number.isNaN`}</GuideCode>
        <GuideDefs
          items={[
            ['falsy, all 8', "false 0 -0 0n '' null undefined NaN"],
            ['everything else', 'truthy — including [] and {} and "0"'],
            ['??', 'nullish coalescing: only null/undefined fall through'],
            ['||', 'falls through on ANY falsy — 0 and "" included'],
            ['?.', 'optional chaining, short-circuits on null/undefined'],
          ]}
        />
        <GuideRules items={['Use === always. The one idiomatic exception is x == null, which tests null OR undefined.']} />
      </GuidePanel>

      <GuidePanel n={3} title="this — Five Rules, In Order" accent="red" glyph="🎯">
        <GuideDefs
          items={[
            ['1. new', 'new Foo() — this is the fresh object'],
            ['2. explicit', 'call / apply / bind — this is what you passed'],
            ['3. method', 'obj.fn() — this is obj'],
            ['4. plain call', 'fn() — undefined in strict mode, else globalThis'],
            ['5. arrow', 'NO own this — inherits from the enclosing scope'],
          ]}
        />
        <GuideCode>{`const o = {
  name: 'o',
  reg()   { return this.name; },      // 'o'
  arrow: () => this?.name,            // NOT 'o' — outer scope
};

const f = o.reg;
f();          // undefined — the receiver is lost`}</GuideCode>
        <GuideRules items={['Losing this by extracting a method is the classic bug — bind it, or use an arrow in a class field.', 'Arrow functions cannot be used as constructors and have no arguments object.']} />
      </GuidePanel>

      <GuidePanel n={4} title="Closures" accent="green" glyph="🔒">
        <GuideCode>{`function counter() {
  let n = 0;                 // captured, not copied
  return () => ++n;
}
const c = counter();
c(); c();   // 2

// The classic loop bug:
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 3 3 3   — one shared binding

for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));
// 0 1 2   — let makes a NEW binding each iteration`}</GuideCode>
        <GuideRules items={['A closure captures the VARIABLE, not its value at capture time.', 'This is the whole mechanism behind hooks, module privacy and partial application.']} />
      </GuidePanel>

      <GuidePanel n={5} title="Objects & Prototypes" accent="purple" glyph="🧬">
        <GuideCode>{`const proto = { greet() { return 'hi'; } };
const o = Object.create(proto);
Object.getPrototypeOf(o) === proto;   // true

class A { greet() {} }        // sugar over the same thing
// A.prototype.greet is where the method actually lives`}</GuideCode>
        <GuideDefs
          items={[
            ['lookup', 'own property first, then up the prototype chain'],
            ['hasOwnProperty', 'own only — prefer Object.hasOwn(o, k) (ES2022)'],
            ['{ ...o }', 'shallow copy of OWN enumerable props; prototype is lost'],
            ['structuredClone', 'deep copy, handles Map/Set/Date/cycles (not functions)'],
          ]}
        />
        <GuideRules items={['Spread and Object.assign are SHALLOW — nested objects are still shared.']} />
      </GuidePanel>

      <GuidePanel n={6} title="Arrays — Mutating vs Not" accent="cyan" glyph="📚">
        <GuideTable
          head={['Mutates', 'Returns new']}
          rows={[
            ['push / pop / shift', 'concat / slice'],
            ['splice', 'map / filter / flatMap'],
            ['sort / reverse', 'toSorted / toReversed (ES2023)'],
            ['fill / copyWithin', 'with(i, v) (ES2023)'],
          ]}
        />
        <GuideCode>{`arr.sort()            // MUTATES, and sorts as STRINGS by default
[10,9,1].sort()       // [1, 10, 9]
[10,9,1].sort((a,b) => a-b)   // [1, 9, 10]

arr.at(-1)            // last element (ES2022)
Object.groupBy(xs, x => x.kind)   // ES2024`}</GuideCode>
        <GuideRules items={['sort() mutating in place is a frequent React bug — copy first, or use toSorted().']} />
      </GuidePanel>

      <GuidePanel n={7} title="Promises & async/await" accent="pink" glyph="⏳" span={2}>
        <GuideCode>{`// SEQUENTIAL — each awaits the previous. Usually not what you want.
const a = await getA();
const b = await getB();

// PARALLEL — both start immediately.
const [a, b] = await Promise.all([getA(), getB()]);`}</GuideCode>
        <GuideTable
          head={['Combinator', 'Settles when', 'On rejection']}
          rows={[
            ['Promise.all', 'all fulfil', 'rejects on the FIRST rejection'],
            ['Promise.allSettled', 'all settle', 'never rejects — inspect each result'],
            ['Promise.race', 'first settles', 'rejects if the first to settle rejected'],
            ['Promise.any', 'first FULFILS', 'AggregateError only if all reject'],
          ]}
        />
        <GuideRules items={['await inside a for-loop serialises the work. Build the array of promises first, then await Promise.all.', 'A rejected promise with no catch is an unhandledrejection — in Node it terminates the process by default.', 'Microtasks (promises) run before macrotasks (setTimeout), which is why await ordering surprises people.']} />
      </GuidePanel>

      <GuidePanel n={8} title="Error Handling" accent="red" glyph="🚨">
        <GuideCode>{`try { ... }
catch (e) { ... }        // the binding is optional (ES2019)
finally { ... }          // runs even on return/throw

throw new Error('msg', { cause: err });   // ES2022
class AppError extends Error {
  constructor(msg) { super(msg); this.name = 'AppError'; }
}`}</GuideCode>
        <GuideRules items={['try/catch does NOT catch async callbacks — only awaited promises inside the same function.', 'Always throw Error instances; throwing strings loses the stack trace.']} />
      </GuidePanel>

      <GuidePanel n={9} title="Modules — ESM vs CommonJS" accent="blue" glyph="🔌">
        <GuideTable
          head={['', 'ESM', 'CommonJS']}
          rows={[
            ['syntax', 'import / export', 'require / module.exports'],
            ['resolved', 'statically, before run', 'at runtime'],
            ['loading', 'async', 'sync'],
            ['bindings', 'live', 'a copy of the value'],
            ['top-level await', 'yes', 'no'],
            ['tree-shaking', 'yes', 'largely no'],
          ]}
        />
        <GuideRules items={['Node picks the mode from "type" in package.json, or the .mjs / .cjs extension.', 'ESM can import CJS; CJS cannot require ESM — use dynamic import().']} />
      </GuidePanel>

      <GuidePanel n={10} title="Destructuring & Spread" accent="green" glyph="✂️">
        <GuideCode>{`const { a, b: renamed, c = 1, ...rest } = obj;
const [x, , third = 0] = arr;

function f({ id, opts = {} } = {}) {}   // defaults for a missing arg

const merged = { ...base, ...override };  // later wins, SHALLOW`}</GuideCode>
        <GuideRules items={['A default only applies when the value is undefined — NOT when it is null.', 'Rest must be last; spread may appear anywhere.']} />
      </GuidePanel>

      <GuidePanel n={11} title="Numbers, Strings, Dates" accent="amber" glyph="🔢">
        <GuideCode>{`0.1 + 0.2 === 0.3        // false — IEEE-754 binary floats
(0.1 + 0.2).toFixed(2)   // "0.30"
Number.EPSILON           // the tolerance to compare against

parseInt('08')     // 8
Number('')         // 0     — but Number(' ') is 0 too
Number(null)       // 0     Number(undefined) is NaN

'a'.padStart(3, '0');  'abc'.replaceAll('a','b');   // ES2021`}</GuideCode>
        <GuideRules items={['Use BigInt for integers beyond Number.MAX_SAFE_INTEGER (2^53 - 1).', 'Date months are 0-indexed. Temporal is the modern replacement — check availability before relying on it.']} />
      </GuidePanel>

      <GuidePanel n={12} title="Feature Timeline" accent="purple" glyph="📅">
        <GuideDefs
          items={[
            ['ES2015', 'let/const, arrow, class, modules, Promise, Map/Set'],
            ['ES2017', 'async/await, Object.entries, padStart'],
            ['ES2019', 'flat, flatMap, optional catch binding'],
            ['ES2020', '?. ?? BigInt, Promise.allSettled, globalThis'],
            ['ES2021', 'replaceAll, Promise.any, logical assignment'],
            ['ES2022', 'at(), Object.hasOwn, class fields, top-level await'],
            ['ES2023', 'toSorted, toReversed, with(), findLast'],
            ['ES2024', 'Object.groupBy, Promise.withResolvers'],
          ]}
        />
      </GuidePanel>
    </GuideLayout>
  );
}
