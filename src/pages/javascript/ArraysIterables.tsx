import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JsArraysIterables() {
  return (
    <LessonLayout
      title="Arrays, Destructuring & Iterables"
      sectionId="javascript"
      lessonIndex={3}
      prev={{ path: '/javascript/objects-prototypes', label: 'Objects, Classes & Prototypes' }}
      next={{ path: '/javascript/async', label: 'Asynchronous JavaScript' }}
    >
      <p>
        Four topics, one theme: JavaScript gives you compact syntax for pulling data out of
        collections and walking through them. The array methods replace hand-written loops with
        intent-revealing names. Destructuring and spread/rest replace index juggling with
        shape-matching. And <code>Symbol.iterator</code> is the quiet protocol underneath{' '}
        <code>for...of</code>, spread, and <code>Array.from</code> that makes all of it work on
        more than just arrays &mdash; once you see it, you&apos;ll recognize it everywhere.
      </p>

      {/* ── Array methods ── */}
      <h2>Array Methods: map, filter, reduce, find, some, every</h2>
      <p>
        Each of these takes a callback and walks the array once. What separates them is purely{' '}
        <strong>what they return</strong> &mdash; get that straight and the choice of which one
        to reach for becomes automatic.
      </p>

      <CodeBlock language="javascript" title="Verified — map and filter">
{`const nums = [1, 2, 3, 4, 5, 6];

const doubled = nums.map(n => n * 2);
console.log(doubled);
// [ 2, 4, 6, 8, 10, 12 ]   — SAME length as the input, every element transformed

const evens = nums.filter(n => n % 2 === 0);
console.log(evens);
// [ 2, 4, 6 ]              — SAME or SHORTER, only elements that pass the test`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Verified — reduce, find, some, every">
{`const sum = nums.reduce((acc, n) => acc + n, 0);
console.log(sum);
// 21                       — collapses the whole array into ONE value

const firstBig = nums.find(n => n > 3);
console.log(firstBig);
// 4                        — the first element that matches, or undefined

const hasNegative = nums.some(n => n < 0);
console.log(hasNegative);
// false                    — true if ANY element matches

const allPositive = nums.every(n => n > 0);
console.log(allPositive);
// true                     — true only if ALL elements match

// They chain, because map/filter both return new arrays:
const result = nums
  .filter(n => n % 2 === 0)
  .map(n => n * n)
  .reduce((acc, n) => acc + n, 0);
console.log(result);
// 56   — (2² + 4² + 6²) = 4 + 16 + 36`}
      </CodeBlock>

      <InfoBox variant="tip" title="What each one returns — the whole decision in one table">
        <ul>
          <li><code>map</code> &mdash; a new array, same length, one output per input</li>
          <li><code>filter</code> &mdash; a new array, same or shorter, a subset of the originals</li>
          <li><code>reduce</code> &mdash; one value of any shape (number, object, array&hellip;)</li>
          <li><code>find</code> &mdash; one element (or <code>undefined</code>), stops at first match</li>
          <li><code>some</code> / <code>every</code> &mdash; one boolean, both short-circuit</li>
        </ul>
        <p>
          <code>find</code>, <code>some</code>, and <code>every</code> all stop early once they
          have their answer &mdash; useful on large arrays when you don&apos;t need to visit
          every element. <code>map</code>, <code>filter</code>, and <code>reduce</code> always
          visit every element, because each one needs the full pass to build its result.
        </p>
      </InfoBox>

      <p>
        <code>reduce</code> is the most general of the six &mdash; <code>map</code> and{' '}
        <code>filter</code> can both be written as a <code>reduce</code> in disguise &mdash; but
        that generality is exactly why it&apos;s worth reaching for the more specific method when
        one fits. A codebase full of <code>reduce</code> calls doing simple maps is harder to
        skim than one that says <code>map</code> when it means map. Save <code>reduce</code> for
        shapes the other five genuinely can&apos;t produce, like grouping:
      </p>

      <CodeBlock language="javascript" title="Verified — reduce building a grouped object">
{`const people = [
  { name: 'Ada', dept: 'Engineering' },
  { name: 'Grace', dept: 'Engineering' },
  { name: 'Alan', dept: 'Research' },
  { name: 'Margaret', dept: 'Research' },
  { name: 'Linus', dept: 'Engineering' },
];

const byDept = people.reduce((groups, person) => {
  const key = person.dept;
  if (!groups[key]) {
    groups[key] = [];
  }
  groups[key].push(person.name);
  return groups;
}, {});

console.log(byDept);
// {
//   Engineering: [ 'Ada', 'Grace', 'Linus' ],
//   Research: [ 'Alan', 'Margaret' ]
// }`}
      </CodeBlock>

      <InfoBox variant="note" title="Every one of these leaves the original array alone">
        <p>
          <code>map</code>, <code>filter</code>, <code>reduce</code>, <code>find</code>,{' '}
          <code>some</code>, and <code>every</code> are all non-mutating &mdash; none of them
          touch the array you called them on. That&apos;s different from <code>push</code>,{' '}
          <code>sort</code>, <code>splice</code>, and <code>reverse</code>, which mutate in
          place. Reaching for these six by default is a large part of what &quot;write
          functional-style JS&quot; actually means in practice.
        </p>
      </InfoBox>

      {/* ── Destructuring ── */}
      <h2>Destructuring</h2>
      <p>
        Destructuring unpacks values out of an array or object into standalone variables by{' '}
        <em>matching shape</em> &mdash; position for arrays, property name for objects &mdash;
        instead of writing <code>const x = arr[0]</code> by hand.
      </p>

      <h3>Array destructuring</h3>
      <CodeBlock language="javascript" title="Verified — array destructuring, skipping, defaults">
{`const coords = [10, 20, 30];
const [x, y, z] = coords;
console.log(x, y, z);
// 10 20 30

// Skip elements with a bare comma
const [first, , third] = coords;
console.log(first, third);
// 10 30

// Defaults apply when the value at that position is undefined
const [a = 1, b = 2, c = 3] = [10, undefined];
console.log(a, b, c);
// 10 2 3   — 'a' had a real value, 'b' was undefined so its default kicked in,
//            'c' has no value at all so it's also undefined -> default`}
      </CodeBlock>

      <h3>Object destructuring</h3>
      <CodeBlock language="javascript" title="Verified — object destructuring, renaming, nested">
{`const user = { name: 'Ada', age: 36, city: 'London' };

const { name, age } = user;
console.log(name, age);
// Ada 36

// Rename while destructuring: { sourceKey: newLocalName }
const { name: userName, city: userCity } = user;
console.log(userName, userCity);
// Ada London

// Nested objects and arrays destructure in one expression
const response = {
  data: { id: 1, profile: { email: 'ada@example.com' } },
  meta: { total: 100 },
};
const {
  data: { id, profile: { email } },
  meta: { total },
} = response;
console.log(id, email, total);
// 1 ada@example.com 100

// Mixing array-in-object and object-in-array
const records = [{ id: 1, tags: ['a', 'b'] }, { id: 2, tags: ['c'] }];
const [{ tags: [firstTag] }] = records;
console.log(firstTag);
// a`}
      </CodeBlock>

      <InfoBox variant="warning" title="Defaults trigger on undefined only — not null, not a missing value that's actually null">
        <p>
          This trips people up constantly, so it&apos;s worth pinning down exactly:
        </p>
        <CodeBlock language="javascript" title="Verified">
{`const { a = 'default-a' } = { a: null };
console.log(a);
// null            — explicit null is a real value, the default does NOT run

const { b = 'default-b' } = { b: undefined };
console.log(b);
// default-b        — explicit undefined DOES trigger the default

const { c = 'default-c' } = {};
console.log(c);
// default-c        — a missing key reads as undefined, so this also triggers it`}
        </CodeBlock>
        <p>
          If an API can hand you back <code>null</code> for &quot;no value,&quot; a destructuring
          default won&apos;t save you &mdash; you still need <code>?? </code> or an explicit check.
        </p>
      </InfoBox>

      <p>Destructuring works in function parameters too, which is how most React props end up read:</p>
      <CodeBlock language="javascript" title="Verified — parameter destructuring">
{`function describeUser({ name: n, age: ag = 0 }) {
  return \`\${n} is \${ag}\`;
}
console.log(describeUser({ name: 'Grace' }));
// Grace is 0`}
      </CodeBlock>

      <h3>The swap-two-variables trick</h3>
      <p>
        Array destructuring reads the right-hand side <em>completely</em> before assigning
        anything on the left, so you can swap two bindings without a temporary variable:
      </p>
      <CodeBlock language="javascript" title="Verified — real before/after values">
{`let p = 1;
let q = 2;
console.log('before:', p, q);
// before: 1 2

[p, q] = [q, p];
console.log('after: ', p, q);
// after:  2 1

// Works on array elements too
let arr = ['left', 'right'];
console.log('before:', arr);
// before: [ 'left', 'right' ]

[arr[0], arr[1]] = [arr[1], arr[0]];
console.log('after: ', arr);
// after:  [ 'right', 'left' ]`}
      </CodeBlock>
      <InfoBox variant="info" title="Why this works">
        <p>
          <code>[q, p]</code> builds a temporary array holding both current values{' '}
          <strong>before</strong> any assignment happens. Then the destructuring on the left
          assigns from that snapshot, left to right. It&apos;s the temp-variable trick,
          just with the array literal playing the role of the temp.
        </p>
      </InfoBox>

      {/* ── Spread and rest ── */}
      <h2>Spread and Rest (...)</h2>
      <p>
        Same three dots, opposite jobs, disambiguated entirely by <em>where</em> they appear.{' '}
        <strong>Spread</strong> expands an iterable into individual elements (in an array
        literal or a function call). <strong>Rest</strong> does the reverse &mdash; it gathers
        multiple elements back into a single array (in a function parameter list or a
        destructuring pattern).
      </p>

      <CodeBlock language="javascript" title="Verified — spread in array literals and function calls">
{`const a = [1, 2, 3];
const b = [4, 5, 6];

const combined = [...a, ...b];
console.log(combined);
// [ 1, 2, 3, 4, 5, 6 ]

// A shallow copy, not the same reference
const copy = [...a];
console.log(copy !== a, JSON.stringify(copy) === JSON.stringify(a));
// true true

// Spread an array into a function call's individual arguments
function sum3(x, y, z) { return x + y + z; }
console.log(sum3(...[10, 20, 30]));
// 60

console.log(Math.max(...[3, 1, 4, 1, 5, 9, 2, 6]));
// 9

// Any iterable spreads, not just arrays — a string is a sequence of characters
console.log([...'hi']);
// [ 'h', 'i' ]`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Verified — rest in parameters and in destructuring">
{`// Rest parameter: collects every remaining argument into a real array
function sumAll(...nums) {
  return nums.reduce((acc, n) => acc + n, 0);
}
console.log(sumAll(1, 2, 3, 4, 5));
// 15

function logFirstAndRest(first, ...rest) {
  return { first, rest };
}
console.log(logFirstAndRest(1, 2, 3, 4));
// { first: 1, rest: [ 2, 3, 4 ] }

// Rest in array destructuring: everything after the matched positions
const [head, ...tail] = [1, 2, 3, 4, 5];
console.log(head, tail);
// 1 [ 2, 3, 4, 5 ]

// Rest in object destructuring: everything except the named keys
const { id, ...otherFields } = { id: 1, name: 'Ada', age: 36 };
console.log(id, otherFields);
// 1 { name: 'Ada', age: 36 }`}
      </CodeBlock>

      <InfoBox variant="tip" title="One rule to keep spread and rest straight">
        <p>
          If <code>...</code> shows up where a <em>value</em> is expected (inside{' '}
          <code>[ ]</code> being built, or as a function-call argument), it&apos;s spreading
          outward. If it shows up where a <em>binding</em> is being declared (a function&apos;s
          parameter list, or the left side of a destructuring pattern), it&apos;s gathering
          inward. Same token, and the position tells you which.
        </p>
      </InfoBox>

      {/* ── Iterables and Symbol.iterator ── */}
      <h2>Iterables and Symbol.iterator</h2>
      <p>
        <code>for...of</code>, spread, <code>Array.from</code>, and destructuring an array all
        rely on the same underlying protocol: an object is <strong>iterable</strong> if it has a
        method at the well-known key <code>Symbol.iterator</code> that returns an{' '}
        <strong>iterator</strong> &mdash; an object with a <code>.next()</code> method that
        returns <code>{'{ value, done }'}</code> each time it&apos;s called. Arrays, strings,
        <code> Map</code>, and <code>Set</code> all implement this already. Plain objects{' '}
        <em>don&apos;t</em> &mdash; which is exactly why <code>for...of</code> refuses to run on
        one.
      </p>

      <FlowChart
        title="The iterable protocol"
        chart={"graph TD\n  A[for...of obj] --> B[Call obj Symbol.iterator]\n  B --> C[Get back an iterator object]\n  C --> D[Call iterator.next]\n  D --> E{done?}\n  E -- false --> F[Use .value, loop back to D]\n  E -- true --> G[Loop ends]"}
      />

      <p>You can implement this by hand. Here&apos;s a range object built from scratch:</p>

      <CodeBlock language="javascript" title="Verified — a custom iterable, consumed by for...of">
{`const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

const collected = [];
for (const n of range) {
  collected.push(n);
}
console.log(collected);
// [ 1, 2, 3, 4, 5 ]`}
      </CodeBlock>

      <p>
        Nothing about <code>range</code> is a special built-in type &mdash; it&apos;s a plain
        object with one method at a symbol-keyed property. That single method is what unlocks{' '}
        <code>for...of</code>, and everything else that consumes iterables for free:
      </p>

      <CodeBlock language="javascript" title="Verified — the same object also works with spread, Array.from, and re-runs cleanly">
{`console.log([...range]);
// [ 1, 2, 3, 4, 5 ]

console.log(Array.from(range));
// [ 1, 2, 3, 4, 5 ]

// A second pass works because [Symbol.iterator]() returns a FRESH iterator
// (with its own 'current' closure variable) every time it's called
console.log([...range]);
// [ 1, 2, 3, 4, 5 ]

// What for...of does under the hood — manual .next() calls
const it = range[Symbol.iterator]();
console.log(it.next());  // { value: 1, done: false }
console.log(it.next());  // { value: 2, done: false }
console.log(it.next());  // { value: 3, done: false }
console.log(it.next());  // { value: 4, done: false }
console.log(it.next());  // { value: 5, done: false }
console.log(it.next());  // { value: undefined, done: true }`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified — for...of throws on a plain object, on purpose">
        <p>
          A plain <code>{'{ x: 1, y: 2 }'}</code> has no <code>Symbol.iterator</code>, so:
        </p>
        <CodeBlock language="javascript" title="Verified">
{`for (const v of { x: 1, y: 2 }) { console.log(v); }
// TypeError: {(intermediate value)} is not iterable`}
        </CodeBlock>
        <p>
          That&apos;s not a bug to work around &mdash; it&apos;s the protocol correctly refusing
          to guess an order for a plain object&apos;s properties. If you need to loop over an
          object&apos;s data, that&apos;s exactly the job <code>for...in</code> was built for,
          covered next.
        </p>
      </InfoBox>

      {/* ── for...of vs for...in ── */}
      <h2>for...of vs for...in</h2>
      <p>
        These look like siblings and are constantly confused, but they answer different
        questions. <code>for...of</code> walks the <strong>values</strong> produced by an
        iterable&apos;s protocol. <code>for...in</code> walks the{' '}
        <strong>enumerable property keys</strong> of any object &mdash; it was designed for
        plain objects, and arrays only happen to also have keys because array elements{' '}
        <em>are</em> properties (<code>"0"</code>, <code>"1"</code>, <code>"2"</code>&hellip;)
        under the hood.
      </p>

      <CodeBlock language="javascript" title="Verified — same array, two different loops">
{`const fruits = ['apple', 'banana', 'cherry'];

for (const value of fruits) { console.log(value); }
// apple
// banana
// cherry

for (const key in fruits) { console.log(key, typeof key); }
// 0 string
// 1 string
// 2 string
//   ^ for...in gives you the KEYS, as strings — not the values, and not numbers`}
      </CodeBlock>

      <p>
        That difference alone (values vs. string keys) is a common source of off-by-one and
        type-coercion bugs. But the more dangerous trap is that <code>for...in</code> walks{' '}
        <strong>every enumerable property it can see</strong> &mdash; including ones you never
        meant as array data, and including ones inherited from the prototype chain:
      </p>

      <CodeBlock language="javascript" title="Verified — for...in picks up a stray own property">
{`const fruitsWithLabel = ['apple', 'banana', 'cherry'];
fruitsWithLabel.label = 'a fruit basket'; // an ordinary property assignment — legal on any object

for (const key in fruitsWithLabel) { console.log(key); }
// 0
// 1
// 2
// label          <-- not an array element, but for...in doesn't know the difference

for (const value of fruitsWithLabel) { console.log(value); }
// apple
// banana
// cherry          <-- for...of only ever sees the three real elements`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Verified — and it inherits through the prototype chain too">
{`// Imagine an old polyfill or a careless library did this somewhere in the app:
Array.prototype.describe = function () { return 'a describable array'; };

const plainArray = ['x', 'y', 'z'];

console.log(Object.keys(plainArray));
// [ '0', '1', '2' ]                          — own keys only, as expected

const seenViaForIn = [];
for (const key in plainArray) { seenViaForIn.push(key); }
console.log(seenViaForIn);
// [ '0', '1', '2', 'describe' ]              — 'describe' leaked in from the prototype,
//                                                on EVERY array in the whole program`}
      </CodeBlock>

      <InfoBox variant="warning" title="What 'no guaranteed order' actually means here">
        <p>
          You may have heard <code>for...in</code> order is entirely unpredictable on arrays.
          Verified more precisely: modern engines <em>do</em> enumerate integer-index keys in
          ascending numeric order first (this is spec-guaranteed for ordinary objects), so{' '}
          <code>0, 1, 2</code> really does come out in that order. The actual danger isn&apos;t
          numeric ordering &mdash; it&apos;s that <code>for...in</code> has <em>no concept</em>{' '}
          of &quot;array element&quot; at all. It will happily hand you non-index own properties
          and inherited enumerable properties mixed in with the indices, as string keys, with no
          way to tell them apart just by looking at the loop. <code>for...of</code> and the
          array methods above never have this problem, because they only ever know about actual
          elements.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="The practical rule">
        <ul>
          <li>Looping over an <strong>array</strong>? Use <code>for...of</code>, or better, <code>map</code>/<code>filter</code>/<code>forEach</code>.</li>
          <li>Looping over a <strong>plain object&apos;s</strong> keys? <code>for...in</code> is fine there &mdash; that&apos;s its actual job &mdash; though <code>Object.keys/values/entries</code> combined with <code>for...of</code> is usually clearer and skips the prototype-chain risk entirely.</li>
          <li>Never reach for <code>for...in</code> on an array. If you see one in review, it's almost always meant to be <code>for...of</code>.</li>
        </ul>
      </InfoBox>

      {/* ── Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What does nums.filter(n => n % 2 === 0).map(n => n * n) return for nums = [1, 2, 3, 4]?"
        code={`const nums = [1, 2, 3, 4];\nconst result = nums.filter(n => n % 2 === 0).map(n => n * n);\nconsole.log(result);`}
        language="javascript"
        options={['[1, 4, 9, 16]', '[4, 16]', '[2, 4]', '20']}
        correctIndex={1}
        explanation="filter keeps only the even numbers first: [2, 4]. Then map squares each of those: [4, 16]. filter never squares odd numbers, and the final result is still an array, not the reduced sum — that would require a further .reduce() call."
      />

      <InteractiveChallenge
        question="const { a = 'x' } = { a: null }; console.log(a); — what logs?"
        code={`const { a = 'x' } = { a: null };\nconsole.log(a);`}
        language="javascript"
        options={["'x'", 'null', 'undefined', 'TypeError']}
        correctIndex={1}
        explanation="Destructuring defaults only kick in when the matched value is exactly undefined. null is a real, explicit value, so the default is skipped and 'a' stays null. This is the single most common destructuring-default mistake."
      />

      <InteractiveChallenge
        question="let [p, q] = [1, 2]; [p, q] = [q, p]; — what are p and q afterward?"
        code={`let p = 1;\nlet q = 2;\n[p, q] = [q, p];\nconsole.log(p, q);`}
        language="javascript"
        options={['1 2 (unchanged)', '2 1 (swapped)', '2 2', 'SyntaxError']}
        correctIndex={1}
        explanation="[q, p] builds a temporary array snapshotting both current values (2, 1) before any assignment happens. The destructuring on the left then assigns from that snapshot: p gets 2, q gets 1. No temp variable needed."
      />

      <InteractiveChallenge
        question="An array has Array.prototype.describe = function(){} added somewhere in the app. What does for...in see that for...of does not?"
        code={`Array.prototype.describe = function () {};\nconst arr = ['x', 'y'];\n\nfor (const v of arr) { /* ? */ }\nfor (const k in arr) { /* ? */ }`}
        language="javascript"
        options={[
          "They see exactly the same thing",
          "for...in also yields 'describe', inherited from the prototype chain",
          "for...of throws an error in this case",
          "for...in only shows the array indices, never inherited properties",
        ]}
        correctIndex={1}
        explanation="for...in walks every enumerable property it can see, own or inherited, so a property added to Array.prototype leaks into every for...in loop over every array in the program as an extra string key, 'describe'. for...of only ever yields actual iterated elements via the Symbol.iterator protocol, so it's unaffected. This is the core reason for...in is considered unsafe on arrays."
      />
    </LessonLayout>
  );
}
