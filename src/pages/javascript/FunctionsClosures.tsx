import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JsFunctionsClosures() {
  return (
    <LessonLayout
      title="Functions, Scope & Closures"
      sectionId="javascript"
      lessonIndex={1}
      prev={{ path: '/javascript/fundamentals', label: 'Fundamentals & Syntax' }}
      next={{ path: '/javascript/objects-prototypes', label: 'Objects, Classes & Prototypes' }}
    >

      {/* ── Section 1: Three Ways to Write a Function ── */}
      <h2>Three Ways to Write a Function</h2>
      <p>
        JavaScript gives you three syntaxes for creating a function, and they look
        interchangeable at a glance. They are not. Each one has different rules for hoisting,
        for what <code>this</code> means inside it, and for whether it gets its own{' '}
        <code>arguments</code> object. Interviewers ask about these differences constantly
        because getting them wrong causes real bugs — not just style nitpicks.
      </p>

      <CodeBlock language="javascript" title="Function Declaration">
{`function add(a, b) {
  return a + b;
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Function Expression">
{`const add = function (a, b) {
  return a + b;
};

// Named function expression — the name "sum" is only visible INSIDE
// this function's own body. Useful for recursion and for readable
// stack traces (an anonymous function shows as "<anonymous>").
const sum = function sum(n) {
  return n <= 1 ? 1 : n + sum(n - 1);
};`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Arrow Function">
{`const add = (a, b) => a + b;

// Equivalent, longer forms:
const addBlock = (a, b) => {
  return a + b;
};
const double = (n) => n * 2;   // single param, parens optional: n => n * 2
const noop = () => {};         // no params`}
      </CodeBlock>

      <InfoBox variant="info" title="Same Result, Different Machinery">
        All three produce a callable function, and for simple math like <code>add</code> they
        behave identically when called normally. The differences only show up around{' '}
        <strong>when the function becomes callable</strong>, <strong>what <code>this</code>{' '}
        refers to</strong>, and <strong>what tools you have inside the body</strong> — exactly
        the three things covered next, each backed by real, run output.
      </InfoBox>

      {/* ── Section 2: Hoisting ── */}
      <h2>Hoisting: Only Declarations Get the Full Treatment</h2>
      <p>
        "Hoisting" means a binding is set up before execution reaches its line. All three forms
        are hoisted in the sense that the JS engine knows about them ahead of time — but only a{' '}
        <strong>function declaration</strong> is hoisted <em>with its function body attached</em>,
        so you can call it before the line where it appears in the source.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`console.log('declaration call before definition:', declared());

function declared() {
  return 'I work because function declarations are hoisted';
}

try {
  console.log(expressed());
} catch (e) {
  console.log('expression call before definition throws:', e.constructor.name, '-', e.message);
}

var expressed = function () {
  return 'I do not work yet';
};

try {
  console.log(arrowed());
} catch (e) {
  console.log('arrow call before definition throws:', e.constructor.name, '-', e.message);
}

const arrowed = () => 'arrow, also not hoisted as callable';

// ── Real console output ──
// declaration call before definition: I work because function declarations are hoisted
// expression call before definition throws: TypeError - expressed is not a function
// arrow call before definition throws: ReferenceError - Cannot access 'arrowed' before initialization`}
      </CodeBlock>

      <p>
        The two errors are different for a reason worth remembering:
      </p>
      <p>
        <code>var expressed</code> is hoisted like every <code>var</code> — the name exists from
        the top of the function, initialized to <code>undefined</code>, and only gets its
        function value when execution reaches the assignment line. Calling it early is really
        calling <code>undefined()</code>, hence <code>TypeError: expressed is not a function</code>.
      </p>
      <p>
        <code>const arrowed</code> is hoisted too — but <code>let</code> and <code>const</code>{' '}
        bindings sit in the <strong>temporal dead zone (TDZ)</strong> from the top of their scope
        until their declaration line runs. Touching them early throws{' '}
        <code>ReferenceError</code>, which is arguably the more honest error: it tells you
        directly that you're too early, instead of the confusing "not a function."
      </p>

      <InfoBox variant="tip" title="The Practical Rule">
        Function declarations can be called before their definition appears in the file (common
        for organizing helper functions below your main logic). Function expressions and arrow
        functions cannot — write them, then use them, top to bottom, like any other variable.
      </InfoBox>

      {/* ── Section 3: this binding ── */}
      <h2><code>this</code> Behaves Differently in Arrow Functions</h2>
      <p>
        A regular function gets its own <code>this</code>, determined by <em>how it is
        called</em> — call it as <code>obj.method()</code> and <code>this</code> is{' '}
        <code>obj</code>. An arrow function has <strong>no <code>this</code> of its own</strong>{' '}
        at all: it captures <code>this</code> lexically from whatever scope it was{' '}
        <em>defined</em> in, permanently, regardless of how it is later called.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`const obj = {
  name: 'Ada',
  regular: function () {
    return \`regular: this.name = \${this && this.name}\`;
  },
  arrow: () => {
    return \`arrow: this.name = \${this && this.name}\`;
  },
};

console.log(obj.regular());
console.log(obj.arrow());
console.log('typeof this at module top level:', typeof this, this);

// ── Real console output ──
// regular: this.name = Ada
// arrow: this.name = undefined
// typeof this at module top level: undefined undefined`}
      </CodeBlock>

      <p>
        <code>obj.regular()</code> is called <em>as a method</em>, so <code>this</code> inside it
        is <code>obj</code>, and <code>this.name</code> is <code>"Ada"</code>. <code>obj.arrow</code>{' '}
        never gets its own <code>this</code> — it closes over <code>this</code> from the scope it
        was written in, which here is the top level of an ES module. Modules run in strict mode
        with no implicit global object, so top-level <code>this</code> is <code>undefined</code>,
        and that is exactly what the arrow prints. (In a browser <code>&lt;script&gt;</code>{' '}
        tag, not a module, top-level <code>this</code> is the <code>window</code> object instead —
        still not <code>obj</code>, which is the point.)
      </p>

      <InfoBox variant="warning" title="Where This Actually Bites You">
        <p>
          The bug shows up when you <em>detach</em> a regular method from its object — pass it as
          a callback and it loses <code>this</code>:
        </p>
        <CodeBlock language="javascript" title="A very common real bug">
{`class Timer {
  seconds = 0;
  tick() {
    this.seconds++;         // works fine when called as timer.tick()
  }
  start() {
    // ❌ setInterval calls tick() as a plain function — this is undefined (strict mode)
    setInterval(this.tick, 1000);

    // ✅ Fix 1: arrow function wrapper — captures 'this' from start()'s scope
    setInterval(() => this.tick(), 1000);

    // ✅ Fix 2: bind — explicitly locks 'this' to the instance
    setInterval(this.tick.bind(this), 1000);
  }
}`}
            </CodeBlock>
        <p>
          Arrow functions do not "fix <code>this</code>" universally — they only help when the
          surrounding scope already has the <code>this</code> you want. Using an arrow for an
          object's own method (like <code>arrow</code> above) is the opposite mistake: there is
          no useful enclosing <code>this</code> to inherit.
        </p>
      </InfoBox>

      {/* ── Section 4: no arguments object ── */}
      <h2>Arrow Functions Have No <code>arguments</code> Object</h2>
      <p>
        Every regular function automatically gets an array-like <code>arguments</code> object
        holding every value it was called with, regardless of its declared parameters. Arrow
        functions do not get one at all — reference <code>arguments</code> inside an arrow and
        JavaScript looks for it in the <em>enclosing</em> scope instead, exactly like it does for{' '}
        <code>this</code>.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`function regularFn() {
  return arguments.length;
}
console.log('regular arguments.length:', regularFn(1, 2, 3));

const arrowFn = (...args) => {
  return arguments.length; // no enclosing function here — nothing to find
};
try {
  console.log('arrow arguments access:', arrowFn(1, 2, 3));
} catch (e) {
  console.log('arrow arguments access throws:', e.constructor.name, '-', e.message);
}

function outer() {
  const inner = () => arguments.length; // arrow borrows OUTER's arguments
  return inner();
}
console.log('arrow inside regular fn sees outer arguments:', outer(1, 2, 3, 4));

// ── Real console output ──
// regular arguments.length: 3
// arrow arguments access throws: ReferenceError - arguments is not defined
// arrow inside regular fn sees outer arguments: 4`}
      </CodeBlock>

      <InfoBox variant="note" title="Why the try/catch is not optional here">
        Without it this snippet prints <em>one</em> line, not three. The{' '}
        <code>ReferenceError</code> from the middle call is never caught, so it propagates out of
        the module and Node exits with status 1 before the third{' '}
        <code>console.log</code> — the interesting one — ever runs. That is the same reason the
        hoisting demo further up wraps its two failing calls: in a script whose whole point is to{' '}
        <em>show you the error</em>, an uncaught throw destroys everything after it.
      </InfoBox>

      <p>
        The middle case throws because <code>arrowFn</code> is defined at the top level — there
        is no enclosing function with an <code>arguments</code> object to inherit, so the lookup
        fails entirely. The third case shows what "inherit" really means: <code>inner</code> has
        no <code>arguments</code> of its own, so the name resolves up the scope chain to{' '}
        <code>outer</code>'s <code>arguments</code>, which has length <code>4</code>.
      </p>

      <InfoBox variant="tip" title="Use Rest Parameters Instead">
        In modern code you rarely want <code>arguments</code> anyway — it is not a real array (no{' '}
        <code>.map</code>, <code>.filter</code>) and it is confusing in exactly the way shown
        above. Rest parameters (<code>...args</code>, covered below) work identically in all
        three function forms, are real arrays, and are the idiomatic choice today.
      </InfoBox>

      {/* ── Section 5: Closures ── */}
      <h2>Closures: Functions That Remember</h2>
      <p>
        A closure is what you get for free whenever a function is defined inside another
        function: the inner function keeps a live reference to the outer function's variables,
        even after the outer function has finished running and would otherwise have its local
        variables thrown away. This is not a special syntax — it is just how lexical scoping
        works in JavaScript, given a name because of how useful the consequence turns out to be.
      </p>

      <CodeBlock language="javascript" title="The simplest possible closure">
{`function makeAdder(x) {
  return function (y) {
    return x + y; // 'x' is not passed in — it's remembered from makeAdder's scope
  };
}

const add5 = makeAdder(5);
const add10 = makeAdder(10);

add5(2);   // 7 — this closure remembers x = 5
add10(2);  // 12 — this closure remembers x = 10, a completely separate binding`}
      </CodeBlock>

      <p>
        Each call to <code>makeAdder</code> creates a fresh scope with its own <code>x</code>,
        and the returned function closes over <em>that specific</em> <code>x</code>. That's the
        whole mechanism. Now build on it with something that changes state, which is where
        closures start to matter in real code — a private counter that cannot be reached or
        tampered with from outside:
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`function createCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const counter = createCounter();
console.log(counter());
console.log(counter());
console.log(counter());

const counter2 = createCounter();
console.log('counter2:', counter2());
console.log('counter (still going):', counter());

// ── Real console output ──
// 1
// 2
// 3
// counter2: 1
// counter (still going): 4`}
      </CodeBlock>

      <p>
        There is no way to read or set <code>count</code> from outside <code>counter</code> —{' '}
        <code>count</code> was never returned or attached to anything global, so the closure is
        the <em>only</em> path to it. <code>counter2</code> proves each call to{' '}
        <code>createCounter()</code> creates an entirely independent <code>count</code>: it starts
        back at <code>1</code> while the original <code>counter</code> keeps incrementing from
        where it left off, because they closed over two different <code>count</code> variables
        that happen to share a name.
      </p>

      <FlowChart
        title="What createCounter() Actually Builds"
        chart={"graph TD\n  A[\"createCounter() is called\"] --> B[\"New scope created: count = 0\"]\n  B --> C[\"Inner function is returned\"]\n  C --> D[\"Inner function keeps a live link to 'count'\"]\n  D --> E[\"counter() runs: count becomes 1\"]\n  E --> F[\"counter() runs: count becomes 2\"]\n  F --> G[\"counter() runs: count becomes 3\"]\n  H[\"createCounter() called again\"] --> I[\"Brand new scope: count = 0\"]\n  I --> J[\"Totally separate closure — counter2\"]\n  style D fill:#5b9cf6,color:#fff\n  style J fill:#5b9cf6,color:#fff"}
      />

      <InfoBox variant="note" title="Why This Matters Beyond Counters">
        <p>
          The counter is the textbook example because it's short, but the same mechanism powers
          patterns you'll use constantly:
        </p>
        <p>
          <strong>Private state</strong> — module-style encapsulation before classes had{' '}
          <code>#private</code> fields, and still common in factory functions.<br />
          <strong>Memoization / caching</strong> — a closure holding a <code>Map</code> that
          persists between calls to avoid recomputing.<br />
          <strong>Event handlers &amp; callbacks</strong> — a click handler that "remembers"
          which item it belongs to, without global variables.<br />
          <strong>Currying / partial application</strong> — <code>makeAdder</code> above is
          already this: a function that bakes in one argument and returns a function waiting
          for the rest.
        </p>
      </InfoBox>

      {/* ── Section 6: IIFEs ── */}
      <h2>IIFEs — Immediately Invoked Function Expressions</h2>
      <p>
        Wrapping a function in parentheses and calling it immediately creates a private scope
        that runs once and disappears — useful for running setup code without leaking any
        variables into the surrounding scope. Before ES modules existed, this was the standard
        way to avoid polluting the global namespace; today ES modules give every file its own
        scope automatically, so IIFEs are less common but still appear for one-off
        initialization blocks and in bundled/minified library output.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`// Function expression IIFE — the outer parens make it an expression, not a declaration
const result = (function () {
  const secret = 42;
  return secret * 2;
})();
console.log('IIFE result:', result);
// 'secret' does not exist out here — it only ever lived inside the IIFE

// Arrow IIFE — same idea, shorter
const result2 = (() => 'arrow IIFE ran')();
console.log(result2);

// ── Real console output ──
// IIFE result: 84
// arrow IIFE ran`}
      </CodeBlock>

      <InfoBox variant="info" title="Why the Wrapping Parentheses?">
        <code>function () {'{ }'}()</code> without the outer parens is a syntax error — the
        parser sees the <code>function</code> keyword at the start of a statement and expects a{' '}
        <em>declaration</em>, which requires a name and cannot be called inline. Wrapping it in{' '}
        <code>(...)</code> tells the parser "this is an expression," which unlocks calling it
        immediately with a trailing <code>()</code>.
      </InfoBox>

      {/* ── Section 7: Default and Rest Parameters ── */}
      <h2>Default and Rest Parameters</h2>
      <p>
        Two features that make function signatures more expressive: default parameters supply a
        fallback value when the caller omits an argument, and rest parameters collect any number
        of trailing arguments into a real array.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`// Default parameters
function greet(name = 'friend') {
  return \`Hello, \${name}!\`;
}
console.log(greet());
console.log(greet('Ada'));

// A default can reference an earlier parameter
function makeRange(start, end = start + 10) {
  return [start, end];
}
console.log('makeRange(5):', makeRange(5));

// Rest parameters — collects everything from that point on into a real array
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
console.log('sum(1,2,3,4):', sum(1, 2, 3, 4));

// ── Real console output ──
// Hello, friend!
// Hello, Ada!
// makeRange(5): [ 5, 15 ]
// sum(1,2,3,4): 10`}
      </CodeBlock>

      <InfoBox variant="tip" title="Two Rules Worth Remembering">
        A default only kicks in for <code>undefined</code> — passing <code>null</code> or{' '}
        <code>0</code> explicitly does <em>not</em> trigger the default, since those are valid
        values, not "missing." A rest parameter must be the <strong>last</strong> parameter in
        the list; <code>function f(...rest, last)</code> is a syntax error because the parser
        needs to know where the collected slice ends.
      </InfoBox>

      {/* ── Section 8: The var/let loop bug ── */}
      <h2>The Interview Classic: <code>var</code> vs <code>let</code> in a Loop</h2>
      <p>
        This is one of the most frequently asked closure questions in front-end interviews,
        because it combines everything above — scope, closures, and hoisting — into one
        surprising result. The setup: schedule three timeouts inside a loop, each logging the
        loop variable.
      </p>

      <CodeBlock language="javascript" title="Verified with node — real output, not a projection">
{`console.log('--- var version ---');
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log('var i:', i);
  }, 10);
}

console.log('--- let version ---');
for (let j = 0; j < 3; j++) {
  setTimeout(function () {
    console.log('let j:', j);
  }, 20);
}

// ── Real console output (in this order) ──
// --- var version ---
// --- let version ---
// var i: 3
// var i: 3
// var i: 3
// let j: 0
// let j: 1
// let j: 2`}
      </CodeBlock>

      <p>
        Both loops finish and print their <code>---</code> header <em>immediately</em> — the
        callbacks are scheduled for later, not run inline, which is why both headers print before
        any numbers do. The interesting part is what each group of three callbacks sees.
      </p>
      <p>
        <code>var</code> is <strong>function-scoped, not block-scoped</strong>. There is exactly{' '}
        <strong>one</strong> <code>i</code> for the entire loop — every iteration reassigns the
        same variable rather than creating a new one. All three callbacks close over that single{' '}
        <code>i</code>, and by the time any of them actually runs (after the 10ms delay), the loop
        has already finished and left <code>i</code> at <code>3</code>. All three print{' '}
        <code>3</code>, because there was only ever one box to look inside, and it holds{' '}
        <code>3</code> by the time anyone checks.
      </p>
      <p>
        <code>let</code> is <strong>block-scoped</strong>, and the <code>for</code> loop gives it
        special treatment beyond that: each iteration gets a{' '}
        <strong>fresh binding</strong>, initialized by copying the previous iteration's value.
        Three iterations means three separate <code>j</code> variables in three separate scopes,
        and each callback closes over its own. Nothing overwrites them, so they print{' '}
        <code>0</code>, <code>1</code>, <code>2</code> — exactly the values each callback
        captured at the moment it was created.
      </p>

      <FlowChart
        title="One Shared Binding vs. One Binding Per Iteration"
        chart={"graph TD\n  subgraph V[\"var — ONE binding shared by all three callbacks\"]\n    V0[\"i created once, outside the loop's block\"] --> V1[\"iteration 0 sets i=0, then i=1\"]\n    V1 --> V2[\"iteration 1 sets i=2\"]\n    V2 --> V3[\"iteration 2 sets i=3, loop exits\"]\n    V3 --> V4[\"10ms later: all 3 callbacks read the SAME i → 3, 3, 3\"]\n  end\n  subgraph L[\"let — a NEW binding for every iteration\"]\n    L0[\"iteration 0: its own j = 0\"] --> L1[\"iteration 1: its own j = 1\"]\n    L1 --> L2[\"iteration 2: its own j = 2\"]\n    L2 --> L3[\"20ms later: each callback reads ITS OWN j → 0, 1, 2\"]\n  end\n  style V4 fill:#ef4444,color:#fff\n  style L3 fill:#10b981,color:#fff"}
      />

      <InfoBox variant="warning" title="If You Need var, Force a New Scope Per Iteration">
        <p>
          Before <code>let</code> existed (ES5 and earlier), the fix was to manually create a new
          scope each iteration with an IIFE, passing the current value in as an argument so it
          gets copied into a fresh parameter:
        </p>
        <CodeBlock language="javascript" title="The old workaround, before let existed">
{`for (var i = 0; i < 3; i++) {
  (function (capturedI) {
    setTimeout(function () {
      console.log('captured i:', capturedI);
    }, 10);
  })(i); // pass the current i in — it's copied into a new 'capturedI' each time
}
// captured i: 0
// captured i: 1
// captured i: 2`}
        </CodeBlock>
        <p>
          This is exactly what <code>let</code> now does for you automatically in a{' '}
          <code>for</code> loop — it's worth recognizing this pattern in older code, but write{' '}
          <code>let</code> in anything new.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="The Wrong Explanation to Avoid Saying in an Interview">
        It is <em>not</em> "because <code>var</code> is global" — <code>var</code> here is scoped
        to the enclosing function (or module), not <code>window</code>. The precise reason is
        that <code>var</code> ignores block boundaries (<code>{'{ }'}</code>) and attaches to the
        nearest function scope, so the loop's braces do not give it a new binding per iteration
        the way they do for <code>let</code>. Saying "scope," not "global," is what separates a
        correct answer from a memorized one.
      </InfoBox>

      {/* ── Section 9: Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"Which statement about calling a function before its definition line is correct?"}
        code={`// Somewhere above these definitions...
foo();  // ?
bar();  // ?
baz();  // ?

function foo() { return 'a'; }
var bar = function () { return 'b'; };
const baz = () => 'c';`}
        language="javascript"
        options={[
          "All three throw the same error, because nothing is ever hoisted early",
          "foo() works; bar() throws TypeError (bar is undefined at that point); baz() throws ReferenceError (TDZ)",
          "All three work fine, because every function is hoisted with its body",
          "foo() throws, but bar() and baz() both work because var and const are hoisted",
        ]}
        correctIndex={1}
        explanation={"Function declarations (foo) are hoisted with their full body, so calling them early works. var bar is hoisted as a binding initialized to undefined — calling it early calls undefined(), a TypeError. const baz is hoisted but sits in the temporal dead zone until its declaration line runs, so touching it early throws a ReferenceError instead."}
      />

      <InteractiveChallenge
        question={"An object has a regular method and an arrow function method, both just returning this.name. Called as obj.regular() and obj.arrow(), what happens?"}
        code={`const obj = {
  name: 'Ada',
  regular: function () { return this.name; },
  arrow: () => { return this.name; },
};

obj.regular(); // ?
obj.arrow();   // ?`}
        language="javascript"
        options={[
          "Both return 'Ada', since both are called on obj",
          "regular() returns 'Ada'; arrow() returns undefined, because the arrow captured 'this' from the enclosing (module) scope, not from obj",
          "Both throw a ReferenceError, since 'this' is never defined",
          "regular() returns undefined; arrow() returns 'Ada', because arrows are 'smarter' about objects",
        ]}
        correctIndex={1}
        explanation={"this in a regular function is determined by the call site: obj.regular() sets this to obj, so this.name is 'Ada'. Arrow functions never get their own this — they close over whatever this was where they were WRITTEN, which for obj.arrow is the module's top-level scope, not obj. That's why arrow methods on object literals are a common bug source."}
      />

      <InteractiveChallenge
        question={"A loop schedules three setTimeout callbacks that each log the loop variable. What logs if the loop uses let, versus var?"}
        code={`for (let j = 0; j < 3; j++) {
  setTimeout(() => console.log(j), 10);
}
// vs
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 10);
}`}
        language="javascript"
        options={[
          "let logs 0, 1, 2 — var logs 3, 3, 3",
          "Both log 0, 1, 2, since setTimeout always preserves loop order",
          "Both log 3, 3, 3, since the loop always finishes before any timeout fires",
          "let logs 3, 3, 3 — var logs 0, 1, 2",
        ]}
        correctIndex={0}
        explanation={"let creates a fresh binding per iteration, so each callback closes over its own j and prints the value it captured: 0, 1, 2. var has exactly one i for the whole loop — every callback closes over that same variable, and by the time any timeout fires (after the loop has already finished), it holds its final value, 3. All three var callbacks print 3."}
      />

      <InfoBox variant="success" title="What You Now Know">
        You've seen — with real, run output — how the three function syntaxes differ in
        hoisting, <code>this</code> binding, and <code>arguments</code>; how closures let a
        function remember variables from a scope that has already returned; what IIFEs and
        default/rest parameters are for; and exactly why <code>var</code> and <code>let</code>{' '}
        produce different output in the classic loop-plus-<code>setTimeout</code> question. That
        last one shows up in interviews specifically because it forces you to reason about scope
        and closures together — you now have both pieces.
      </InfoBox>

    </LessonLayout>
  );
}
