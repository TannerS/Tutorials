import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function JsFundamentals() {
  return (
    <LessonLayout
      title="Fundamentals & Syntax"
      sectionId="javascript"
      lessonIndex={0}
      prev={null}
      next={{ path: '/javascript/functions-closures', label: 'Functions, Scope & Closures' }}
    >
      <p>
        You already know JavaScript well enough to ship with it. This lesson is not
        &quot;introduction to programming&quot; &mdash; it is the small set of rules that
        experienced developers still get bitten by: <em>why</em> <code>var</code> leaks out of
        blocks, <em>why</em> a <code>let</code> can throw before you&apos;ve even reached its
        declaration, and exactly which values compare equal under <code>==</code> and why.
        Get the mental model right here and the next nine lessons build on solid ground.
      </p>

      {/* ── var / let / const ── */}
      <h2>var, let, and const</h2>
      <p>
        All three declare a binding. They differ on two axes that matter a lot in practice:{' '}
        <strong>scope</strong> (where the binding is visible) and{' '}
        <strong>mutability</strong> (whether the binding itself can be reassigned).
      </p>

      <CodeBlock language="javascript" title="The three declarations, at a glance">
{`var a = 1;    // function-scoped, reassignable, re-declarable, hoisted & initialized to undefined
let b = 2;    // block-scoped, reassignable, NOT re-declarable in the same scope
const c = 3;  // block-scoped, NOT reassignable, NOT re-declarable

b = 20;       // OK
// c = 30;    // TypeError: Assignment to constant variable.`}
      </CodeBlock>

      <InfoBox variant="info" title="const freezes the binding, not the value">
        <p>
          <code>const</code> only prevents <em>reassigning the variable</em>. If the value is an
          object or array, its contents are still fully mutable &mdash; <code>push</code>,{' '}
          <code>splice</code>, and property assignment all work fine. Reach for{' '}
          <code>Object.freeze()</code> if you actually need immutable contents.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Verified: const blocks reassignment, not mutation">
{`const arr = [1, 2, 3];
arr.push(4);       // fine — mutating contents, not reassigning the binding
console.log(arr);  // [ 1, 2, 3, 4 ]

const z = 1;
z = 2;              // TypeError: Assignment to constant variable.`}
      </CodeBlock>

      <h3>Function scope vs block scope</h3>
      <p>
        <code>var</code> ignores <code>{'{ }'}</code> blocks entirely &mdash; its scope is the
        nearest enclosing <em>function</em> (or the global scope, if there is no function).{' '}
        <code>let</code> and <code>const</code> respect the nearest enclosing{' '}
        <em>block</em>: an <code>if</code>, a <code>for</code>, or a bare <code>{'{ }'}</code>.
      </p>

      <CodeBlock language="javascript" title="Verified — var escapes the block, let/const don't">
{`{
  var leaked = 'I escaped the block';
}
console.log(leaked);
// I escaped the block

{
  let trapped = 'I stay here';
}
console.log(trapped);
// ReferenceError: trapped is not defined`}
      </CodeBlock>

      <p>
        This is the entire reason the classic &quot;loop variable captured by a callback&quot;
        bug exists, and the entire reason <code>let</code> fixes it without any other code
        change:
      </p>

      <CodeBlock language="javascript" title="Verified — the var-in-a-loop closure bug, and the let fix">
{`const varResults = [];
for (var i = 0; i < 3; i++) {
  varResults.push(() => i);
}
console.log(varResults.map(fn => fn()));
// [ 3, 3, 3 ]   — one shared 'i', all callbacks read its final value

const letResults = [];
for (let j = 0; j < 3; j++) {
  letResults.push(() => j);
}
console.log(letResults.map(fn => fn()));
// [ 0, 1, 2 ]   — 'let' creates a FRESH binding of j for each iteration`}
      </CodeBlock>

      <InfoBox variant="tip" title="Default to const, reach for let only when you'll reassign, avoid var">
        <p>
          <code>const</code> by default documents intent and rules out a whole class of bugs
          where something reassigns a variable you didn&apos;t expect to change. Use{' '}
          <code>let</code> for loop counters, accumulators, and anything you genuinely
          reassign. There is essentially no reason to reach for <code>var</code> in modern code
          &mdash; its function-scoping and hoisting behavior below are legacy footguns, not
          features you want.
        </p>
      </InfoBox>

      {/* ── Hoisting ── */}
      <h2>Hoisting</h2>
      <p>
        &quot;Hoisting&quot; is the common name for a real mechanism: before running any code,
        the JS engine scans the current scope and registers every <code>var</code>,{' '}
        <code>let</code>, <code>const</code>, and function declaration <em>up front</em>. What
        differs between them is what happens between that registration and the line where your
        code actually initializes the binding.
      </p>

      <FlowChart
        title="What happens when you read a variable before its declaration line"
        chart={"graph TD\n  A[Read identifier] --> B{Declared with?}\n  B -- var --> C[Registered + initialized to undefined]\n  C --> D[Read returns: undefined]\n  B -- let / const --> E[Registered but in Temporal Dead Zone]\n  E --> F[Read throws: ReferenceError]\n  B -- function declaration --> G[Registered + fully initialized]\n  G --> H[Callable immediately]"}
      />

      <ul>
        <li>
          <code>var</code> is hoisted <em>and initialized to <code>undefined</code></em> at the
          top of its function scope. Reading it early gives <code>undefined</code>, not an
          error.
        </li>
        <li>
          <code>let</code> and <code>const</code> are hoisted but <strong>not</strong>{' '}
          initialized. The span between the top of the scope and the actual declaration line is
          the <strong>Temporal Dead Zone (TDZ)</strong> &mdash; accessing the binding anywhere
          in that span throws.
        </li>
        <li>
          A <code>function</code> declaration is hoisted <em>fully</em>, body included, so it is
          callable before the line it&apos;s written on. A function assigned to a{' '}
          <code>var</code>/<code>let</code>/<code>const</code> (a function expression or arrow
          function) follows the hoisting rule of whichever keyword holds it &mdash; the name is
          hoisted, the function value is not.
        </li>
      </ul>

      <CodeBlock language="javascript" title="Verified — var hoists to undefined, function declarations hoist fully">
{`console.log(typeof varName);   // "undefined" — hoisted, not yet assigned
var varName = 'hi';

console.log(hoisted(2, 3));    // 5 — fully hoisted, callable early
function hoisted(a, b) { return a + b; }

notHoisted(1, 2);
// TypeError: notHoisted is not a function
var notHoisted = function (a, b) { return a + b; };`}
      </CodeBlock>

      <InfoBox variant="danger" title="The TDZ throws a ReferenceError — this is the detail people get wrong">
        <p>
          It is common to hear &quot;<code>let</code> and <code>const</code> aren&apos;t
          hoisted.&quot; They are &mdash; the engine knows about the binding from the top of the
          scope. What they don&apos;t get is an initial value. Touching them before their
          declaration line throws a real <code>ReferenceError</code>, distinct from the
          <code>ReferenceError</code> you&apos;d get from a name that was never declared at all.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Verified — actual TDZ ReferenceErrors, node v25">
{`console.log(letName);
let letName = 'hi';
// ReferenceError: Cannot access 'letName' before initialization

console.log(constName);
const constName = 'hi';
// ReferenceError: Cannot access 'constName' before initialization

// Contrast with typeof on a name that was never declared anywhere —
// that one stays a soft "undefined", no throw:
console.log(typeof neverDeclared);
// undefined

// But typeof on a name that WILL be declared later with let/const
// still throws, because the binding exists in this scope (in the TDZ):
console.log(typeof tdzVar);
// ReferenceError: Cannot access 'tdzVar' before initialization
let tdzVar = 1;`}
      </CodeBlock>

      <InfoBox variant="note" title="Why this exists">
        <p>
          The TDZ isn&apos;t an implementation accident &mdash; it&apos;s a deliberate safety
          net. Silently returning <code>undefined</code> for a <code>let</code>/<code>const</code>{' '}
          read before its declaration (the old <code>var</code> behavior) would hide real bugs.
          Throwing turns &quot;used before ready&quot; into a loud failure at the exact line
          that caused it.
        </p>
      </InfoBox>

      {/* ── Primitive types & typeof ── */}
      <h2>Primitive Types and typeof Quirks</h2>
      <p>
        JavaScript has seven primitive types &mdash; <code>string</code>, <code>number</code>,{' '}
        <code>boolean</code>, <code>undefined</code>, <code>null</code>, <code>symbol</code>,{' '}
        <code>bigint</code> &mdash; plus <code>object</code> for everything else (including
        arrays and functions). <code>typeof</code> reports on these, and it has one very famous
        wart.
      </p>

      <CodeBlock language="javascript" title="Verified — typeof over every kind of value, node v25">
{`typeof 42            // "number"
typeof "hi"           // "string"
typeof true           // "boolean"
typeof undefined      // "undefined"
typeof null           // "object"   ← the famous bug, see below
typeof {}              // "object"
typeof []              // "object"   ← arrays are objects; use Array.isArray()
typeof function(){}    // "function"
typeof Symbol()        // "symbol"
typeof 10n             // "bigint"
typeof NaN             // "number"  ← NaN literally means "Not a Number", but its TYPE is number`}
      </CodeBlock>

      <InfoBox variant="warning" title="typeof null === 'object' is a 1995 bug, kept forever for compatibility">
        <p>
          In the original JS engine, values were tagged with a type identifier stored in their
          low bits, and objects were tagged <code>0</code>. <code>null</code> was represented as
          the all-zero machine word &mdash; so it accidentally got the object tag too.
          Fixing it would break existing code that (knowingly or not) depends on the bug, so
          it shipped in ES1 and can never change. To actually test for <code>null</code>, use{' '}
          <code>value === null</code> directly, never <code>typeof</code>.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Practical fallout: a safe type-check helper">
{`function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

typeOf(null);      // "null"
typeOf([1, 2]);     // "array"
typeOf({});          // "object"`}
      </CodeBlock>

      {/* ── Truthy / Falsy ── */}
      <h2>Truthy and Falsy Values</h2>
      <p>
        Anywhere JS expects a boolean &mdash; an <code>if</code> condition, a{' '}
        <code>&amp;&amp;</code>/<code>||</code> chain, a ternary &mdash; a non-boolean value is
        coerced first. There are exactly <strong>eight</strong> falsy values in JavaScript.
        Everything else, including several values developers routinely expect to be falsy, is
        truthy.
      </p>

      <CodeBlock language="javascript" title="Verified — the complete falsy list, node v25">
{`Boolean(false)      // false
Boolean(0)           // false
Boolean(-0)          // false
Boolean(0n)          // false   — BigInt zero
Boolean('')          // false
Boolean(null)        // false
Boolean(undefined)   // false
Boolean(NaN)         // false

// That's all eight. There is no ninth.`}
      </CodeBlock>

      <InfoBox variant="danger" title="These look falsy but are NOT — the ones that actually cause bugs">
        <p>
          The mistake that bites experienced developers isn&apos;t the falsy list &mdash;
          it&apos;s assuming something is on it that isn&apos;t.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Verified — commonly-mistaken-for-falsy, but truthy, node v25">
{`Boolean('0')          // true   — non-empty string, even though it "looks like" zero
Boolean(' ')           // true   — whitespace is a non-empty string
Boolean([])             // true   — an empty array is still an object
Boolean({})              // true   — an empty object is still an object
Boolean('false')          // true   — the STRING "false" is non-empty
Boolean(new Boolean(false)) // true — a Boolean OBJECT wrapper is always truthy!
Boolean(Infinity)          // true
Boolean(-Infinity)         // true`}
      </CodeBlock>

      <p>
        The <code>[]</code> and <code>{'{}'}</code> cases are the ones that cost real debugging
        time: <code>if (emptyArray)</code> runs its body, so &quot;is this array empty&quot; has
        to be <code>array.length === 0</code>, never a truthiness check on the array itself.
      </p>

      {/* ── == vs === ── */}
      <h2>== vs === and Coercion</h2>
      <p>
        <code>===</code> (&quot;strict equality&quot;) compares type and value with no
        conversion. <code>==</code> (&quot;loose equality&quot;) first tries to convert the two
        operands to a common type, following a specific and mostly-memorizable algorithm, and{' '}
        <em>then</em> compares. The bugs come from not knowing that algorithm.
      </p>

      <CodeBlock language="javascript" title="Verified — the coercion cases that actually bite, node v25">
{`''   == 0        // true    — '' converts to 0
''   === 0       // false   — different types, no conversion

'0'  == 0        // true    — '0' converts to 0
'0'  === 0       // false

null == undefined  // true  — a special-cased pair: they equal EACH OTHER...
null === undefined // false — ...but are never === to anything, including each other

NaN == NaN        // false  — NaN is never equal to anything, even itself
NaN === NaN       // false
Object.is(NaN, NaN) // true — the one tool that DOES treat NaN as itself

[]   == false     // true    — [] → '' → 0, false → 0, so 0 == 0
[]   === false    // false
[]   == ''        // true    — [] → ''
[]   == 0         // true    — [] → '' → 0

[1, 2] == '1,2'   // true    — array's default toString() joins with commas

null == 0         // false   — null only loosely-equals undefined, nothing else
undefined == 0    // false   — same rule, other direction`}
      </CodeBlock>

      <InfoBox variant="tip" title="The rule that actually predicts these results">
        <p>
          <code>==</code> converts <code>null</code> and <code>undefined</code> to equal{' '}
          <em>only each other</em> and nothing else. For every other pairing, objects (arrays
          included) convert to a primitive first via <code>toString</code>/<code>valueOf</code>,
          then string/boolean operands convert toward <code>number</code>. Chase every{' '}
          <code>==</code> surprise back to &quot;what does this become when coerced to a
          number?&quot; and the result stops being surprising.
        </p>
      </InfoBox>

      <InfoBox variant="success" title="The practical rule">
        <p>
          Use <code>===</code> by default, always. The one broadly-accepted exception is{' '}
          <code>value == null</code>, which reads as &quot;is this <code>null</code> or{' '}
          <code>undefined</code>&quot; in one check &mdash; a deliberate, well-known use of the{' '}
          <code>null</code>/<code>undefined</code> special case above, not a coercion accident.
        </p>
      </InfoBox>

      {/* ── Template literals ── */}
      <h2>Template Literals</h2>
      <p>
        Backtick strings support embedded expressions and real multi-line text, without
        string-concatenation gymnastics.
      </p>

      <CodeBlock language="javascript" title="Verified — template literal output, node v25">
{`const name = 'Ada';
const age = 36;

console.log(\`Hello, \${name}! You are \${age} years old.\`);
// Hello, Ada! You are 36 years old.

console.log(\`Next year you'll be \${age + 1}.\`);
// Next year you'll be 37.
// — any expression is allowed inside \${...}, not just a variable name

console.log(\`line one
line two\`);
// line one
// line two
// — the literal newline in the source becomes a real newline in the string`}
      </CodeBlock>

      <InfoBox variant="info" title="Tagged templates, briefly">
        <p>
          Prefixing a template literal with a function name &mdash; <code>tag\`text\`</code>{' '}
          &mdash; calls that function with the literal pieces and interpolated values passed
          separately, before they&apos;re joined. That&apos;s how libraries like styled-components
          and SQL-injection-safe query builders work under the hood. Out of scope for this
          lesson, but good to recognize when you see it.
        </p>
      </InfoBox>

      {/* ── Challenges ── */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
