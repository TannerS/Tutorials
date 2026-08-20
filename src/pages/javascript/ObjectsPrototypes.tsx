import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function JsObjectsPrototypes() {
  return (
    <LessonLayout
      title="Objects, Classes & Prototypes"
      sectionId="javascript"
      lessonIndex={2}
      prev={{ path: '/javascript/functions-closures', label: 'Functions, Scope & Closures' }}
      next={{ path: '/javascript/arrays-iterables', label: 'Arrays, Destructuring & Iterables' }}
    >
      {/* ── Section 1: Object Literals ── */}
      <h2>Object Literals — Shorthand and Computed Keys</h2>
      <p>
        Two small syntax features remove most of the boilerplate from writing object
        literals: <strong>property/method shorthand</strong> and{' '}
        <strong>computed property names</strong>. Both existed as verbose alternatives long
        before ES2015 added the short forms.
      </p>

      <CodeBlock language="javascript" title="Property and method shorthand">
{`const name = "Alice";
const age = 30;

// Property shorthand — { name: name, age: age } written the long way
const user = { name, age };

// Method shorthand — no 'function' keyword needed
const counter = {
  count: 0,
  increment() { this.count++; },
};
counter.increment();

console.log(JSON.stringify(user));    // {"name":"Alice","age":30}
console.log(counter.count);           // 1`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Computed property names — the key itself is an expression">
{`const key = "dynamicKey";
const obj = {
  [key]: "value",
  [\`\${key}_upper\`]: "VALUE",
};

console.log(JSON.stringify(obj));
// {"dynamicKey":"value","dynamicKey_upper":"VALUE"}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Before Computed Keys">
        <p>
          Building a key from a variable used to require constructing the object first and
          assigning after: <code>{'const obj = {}; obj[key] = "value";'}</code>. Computed
          property names let that live inline in the literal, which matters most when the
          object also has other, static keys — you no longer have to split the declaration
          in two.
        </p>
      </InfoBox>

      {/* ── Section 2: The Prototype Chain ── */}
      <h2>The Prototype Chain</h2>
      <p>
        Every JavaScript object has an internal link to another object (or to{' '}
        <code>null</code>) called its <strong>[[Prototype]]</strong>. When you read a
        property that the object doesn&apos;t have, the engine doesn&apos;t give up — it
        follows that link and looks on the prototype, then <em>its</em> prototype, and so
        on until it hits <code>null</code>. This is <strong>prototypal inheritance</strong>,
        and it is the mechanism underneath every <code>class</code> in the language.
      </p>

      <CodeBlock language="javascript" title="Object.create builds the link directly">
{`const animal = {
  eats: true,
  walk() { return \`\${this.name} walks\`; },
};

const rabbit = Object.create(animal);
rabbit.name = "Bunny";

console.log(rabbit.eats);      // true  — found on the prototype
console.log(rabbit.walk());    // "Bunny walks" — method found on the prototype,
                                // 'this' is still the object it was called on

console.log(Object.getPrototypeOf(rabbit) === animal);   // true
console.log(Object.hasOwn(rabbit, 'eats'));               // false — inherited, not own
console.log(Object.hasOwn(rabbit, 'name'));                // true  — set directly on rabbit`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Ran exactly as shown: <code>rabbit.eats</code> → <code>true</code>,{' '}
          <code>rabbit.walk()</code> → <code>&quot;Bunny walks&quot;</code>,{' '}
          <code>Object.getPrototypeOf(rabbit) === animal</code> → <code>true</code>,{' '}
          <code>Object.hasOwn(rabbit, &apos;eats&apos;)</code> → <code>false</code>,{' '}
          <code>Object.hasOwn(rabbit, &apos;name&apos;)</code> → <code>true</code>.
        </p>
      </InfoBox>

      <h3>[[Prototype]] vs .prototype — two different things with a confusing name</h3>
      <p>
        This is the single most common source of confusion in this topic, so it deserves its
        own callout before going further:
      </p>

      <InfoBox variant="warning" title="They are not the same property">
        <p>
          <strong>[[Prototype]]</strong> is an internal slot every <em>object</em> has —
          it&apos;s the link used for lookups, and you read it with{' '}
          <code>Object.getPrototypeOf(obj)</code>.
        </p>
        <p>
          <strong>.prototype</strong> is an ordinary, visible property that only exists on{' '}
          <em>functions</em> (because functions can be used as constructors with{' '}
          <code>new</code>). It is the object that becomes the{' '}
          <code>[[Prototype]]</code> of every instance that function creates —{' '}
          <em>not</em> the function&apos;s own internal prototype link.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="A constructor function, proven with real introspection">
{`function Dog(name) { this.name = name; }
Dog.prototype.bark = function () { return \`\${this.name} says woof\`; };

const d = new Dog("Rex");

console.log(d.bark());                                    // "Rex says woof"
console.log(Object.getPrototypeOf(d) === Dog.prototype);   // true
console.log(typeof Dog.prototype);                          // "object"
console.log(typeof d.prototype);                            // "undefined" — instances have none
console.log(Dog.prototype.constructor === Dog);              // true`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Real output: <code>d.bark()</code> → <code>&quot;Rex says woof&quot;</code>,{' '}
          <code>Object.getPrototypeOf(d) === Dog.prototype</code> → <code>true</code>,{' '}
          <code>typeof Dog.prototype</code> → <code>&quot;object&quot;</code>,{' '}
          <code>typeof d.prototype</code> → <code>&quot;undefined&quot;</code>,{' '}
          <code>Dog.prototype.constructor === Dog</code> → <code>true</code>.
        </p>
      </InfoBox>

      <FlowChart
        title="The Chain new Dog('Rex') Actually Walks"
        chart={"graph TD\n  D[\"instance d\\n(own prop: name)\"] -->|internal prototype link| DP[\"Dog.prototype\\n(bark, constructor)\"]\n  DP -->|internal prototype link| OP[\"Object.prototype\\n(toString, hasOwnProperty, ...)\"]\n  OP -->|internal prototype link| N[\"null — lookup stops\"]\n  DC[\"Dog (function)\"] -.->|\".prototype property\\npoints here\"| DP"}
      />

      <p>
        Reading <code>d.bark()</code> checks <code>d</code> itself (not found), then follows{' '}
        <code>[[Prototype]]</code> to <code>Dog.prototype</code> (found — stop). The{' '}
        <code>.prototype</code> property lives on the <em>function</em> <code>Dog</code>, and
        its only job is supplying the <code>[[Prototype]]</code> for objects{' '}
        <code>new Dog()</code> creates. <code>Dog</code> itself has its own, separate{' '}
        <code>[[Prototype]]</code> too (it points to <code>Function.prototype</code>, since{' '}
        <code>Dog</code> is a function) — that dashed arrow and the solid chain are genuinely
        different links.
      </p>

      {/* ── Section 3: class is sugar ── */}
      <h2>class Is Real Syntactic Sugar Over Prototypes</h2>
      <p>
        <code>class</code> reads like the class systems in Java or C#, and that similarity is
        deliberate — but underneath, a JavaScript class desugars to exactly the constructor
        function + <code>.prototype</code> pattern above. This isn&apos;t an analogy; it is
        directly inspectable.
      </p>

      <CodeBlock language="javascript" title="Inspecting what a class really produces">
{`class Foo {
  constructor(x) { this.x = x; }
  greet() { return \`hi \${this.x}\`; }
  static create(x) { return new Foo(x); }
}

console.log(typeof Foo);
// "function"  — a class IS a function

console.log(Object.getOwnPropertyNames(Foo.prototype));
// [ 'constructor', 'greet' ]  — instance methods live on Foo.prototype, same as ever

console.log(Object.getOwnPropertyNames(Foo).filter(n => !['length','name','prototype'].includes(n)));
// [ 'create' ]  — static methods live on the function object itself

const f = new Foo(1);
console.log(Object.getPrototypeOf(f) === Foo.prototype);
// true — identical mechanism to the Dog example above`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Actually ran. <code>typeof Foo</code> → <code>&quot;function&quot;</code>;{' '}
          <code>Object.getOwnPropertyNames(Foo.prototype)</code> →{' '}
          <code>[ &apos;constructor&apos;, &apos;greet&apos; ]</code>; static filter →{' '}
          <code>[ &apos;create&apos; ]</code>;{' '}
          <code>Object.getPrototypeOf(f) === Foo.prototype</code> → <code>true</code>.
        </p>
      </InfoBox>

      <p>
        The hand-written equivalent produces the identical shape:
      </p>

      <CodeBlock language="javascript" title="The desugared, pre-ES2015 version — behaves the same">
{`function Bar(x) { this.x = x; }
Bar.prototype.greet = function () { return \`hi \${this.x}\`; };
Bar.create = function (x) { return new Bar(x); };

const b = new Bar(2);
console.log(b.greet());   // "hi 2" — same behavior as Foo's instance`}
      </CodeBlock>

      <p>
        But <code>class</code> is not <em>merely</em> sugar — it changes a few real
        behaviors that hand-written prototype code never had, and these differences are
        also directly verifiable:
      </p>

      <CodeBlock language="javascript" title="Two things a hand-written constructor function does NOT do">
{`// 1. Class methods are non-enumerable; object-literal / assigned methods are enumerable
console.log(Object.getOwnPropertyDescriptor(Foo.prototype, 'greet').enumerable);
// false

const objLiteral = { greet() { return 'hi'; } };
console.log(Object.getOwnPropertyDescriptor(objLiteral, 'greet').enumerable);
// true — this is WHY for...in / spread never leak class methods but do leak object-literal ones

// 2. A class constructor cannot be called without 'new'
try {
  Foo(5);
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
// TypeError: Class constructor Foo cannot be invoked without 'new'`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Real results: class-prototype <code>greet</code> is <code>enumerable: false</code>;
          object-literal <code>greet</code> is <code>enumerable: true</code>; calling{' '}
          <code>Foo(5)</code> without <code>new</code> threw{' '}
          <code>TypeError: Class constructor Foo cannot be invoked without &apos;new&apos;</code>.
          A plain constructor function like <code>Dog</code> above would have silently run
          with <code>this</code> as the global object (or <code>undefined</code> in strict
          mode) instead of throwing — <code>class</code> adds a real runtime guard that
          plain functions never had.
        </p>
      </InfoBox>

      {/* ── Section 3.5: Building inheritance hierarchies the old way ── */}
      <h2>How Prototypes Were Actually Used: Building Inheritance by Hand</h2>
      <p>
        Before <code>class ... extends</code> existed, a multi-level inheritance hierarchy
        was built by directly wiring one constructor&apos;s <code>.prototype</code> to point
        at another&apos;s. This is the real pattern production codebases used for years — and
        every framework&apos;s <code>Component.extend(...)</code>-style helper from that era
        was a variation of exactly this.
      </p>

      <CodeBlock language="javascript" title="Animal -> Dog, the manual way">
{`function Animal(name) {
  this.name = name;
}
Animal.prototype.eat = function () { return \`\${this.name} eats.\`; };

function Dog(name, breed) {
  Animal.call(this, name);        // "super constructor" call — borrow Animal's setup
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);   // wire the chain: Dog -> Animal
Dog.prototype.constructor = Dog;                    // repair identity (see below for why)
Dog.prototype.bark = function () { return \`\${this.name} barks.\`; };

const rex = new Dog("Rex", "Lab");
console.log(rex.eat());                                   // inherited from Animal
console.log(rex.bark());                                  // own, from Dog
console.log(rex instanceof Dog, rex instanceof Animal);    // both true — real inheritance`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Ran exactly as shown: <code>rex.eat()</code> → <code>&quot;Rex eats.&quot;</code>,{' '}
          <code>rex.bark()</code> → <code>&quot;Rex barks.&quot;</code>,{' '}
          <code>rex instanceof Dog</code> and <code>rex instanceof Animal</code> both{' '}
          <code>true</code>.
        </p>
      </InfoBox>

      <p>
        Three lines are doing real work, and each has a reason: <code>Animal.call(this,
        name)</code> is the only way a plain function can &quot;call the parent
        constructor&quot; — there was no <code>super()</code> yet. <code>Dog.prototype =
        Object.create(Animal.prototype)</code> is the actual inheritance link (a plain{' '}
        <code>Dog.prototype = Animal.prototype</code> would make Dog and Animal share the{' '}
        <em>same</em> object, so adding <code>bark</code> would add it to Animal too — a real
        and common mistake). And the <code>.constructor</code> repair line exists because{' '}
        <code>Object.create</code> gives the new prototype object a fresh, useless{' '}
        <code>constructor</code> — skip that line and the chain still works for method
        lookup, but identity checks quietly break:
      </p>

      <CodeBlock language="javascript" title="Forgetting the .constructor repair — a real, easy-to-miss bug">
{`function Cat(name) { Animal.call(this, name); }
Cat.prototype = Object.create(Animal.prototype);
// (forgot: Cat.prototype.constructor = Cat;)

const felix = new Cat("Felix");
console.log(felix.constructor === Cat);      // false!
console.log(felix.constructor === Animal);   // true — inherited Animal's by accident`}
      </CodeBlock>

      <InfoBox variant="warning" title="Verified — and this is exactly what class extends fixes for you">
        <p>
          Real output: <code>felix.constructor === Cat</code> is <code>false</code>;{' '}
          <code>felix.constructor === Animal</code> is <code>true</code>. Every{' '}
          <code>Cat</code> instance now silently claims to be constructed by{' '}
          <code>Animal</code> — code that branches on <code>instance.constructor</code>{' '}
          (some serialization libraries and older frameworks did) gets the wrong answer, and
          nothing throws to tell you. <code>class Dog extends Animal {'{}'}</code> wires the
          prototype chain <em>and</em> the constructor link correctly every time, which is
          the real, practical reason <code>extends</code> replaced this pattern rather than
          just being shorter to type.
        </p>
      </InfoBox>

      <h3>Mixins — Sharing Behavior Without a Linear Chain</h3>
      <p>
        JavaScript only allows a <em>single</em> prototype chain — no multiple inheritance.
        Mixins were (and still are) the workaround: copy a shared object&apos;s methods onto
        several unrelated prototypes with <code>Object.assign</code>, rather than trying to
        force them into one inheritance tree.
      </p>

      <CodeBlock language="javascript" title="Two unrelated mixins, applied to one class">
{`const Serializable = { serialize() { return JSON.stringify(this); } };
const Comparable = { equals(other) { return this.id === other.id; } };

class Product {
  constructor(id, name) { this.id = id; this.name = name; }
}
Object.assign(Product.prototype, Serializable, Comparable);

const p1 = new Product(1, "Widget");
const p2 = new Product(1, "Widget (renamed)");
console.log(p1.serialize());                                    // from the mixin
console.log(p1.equals(p2));                                     // from the other mixin
console.log(p1 instanceof Product);                              // true — still a real Product
console.log(Object.getPrototypeOf(p1) === Product.prototype);    // true — chain untouched`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Real output: <code>p1.serialize()</code> → <code>{'{"id":1,"name":"Widget"}'}</code>;{' '}
          <code>p1.equals(p2)</code> → <code>true</code> (same <code>id</code>);{' '}
          <code>p1 instanceof Product</code> → <code>true</code>. The mixin methods land
          directly on <code>Product.prototype</code> as if you&apos;d written them there by
          hand — <code>Object.assign</code> doesn&apos;t know or care that they came from
          somewhere else.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="The Same Technique, Aimed at a Built-in, Is a Real Anti-Pattern">
        <p>
          Everything above targets a prototype <em>you own</em>. Doing the identical thing
          to a built-in — <code>Array.prototype.flatten = function () {'{ ... }'}</code> —
          used to be common (people patched in methods before the spec added them) and is
          now considered a real mistake, not a style preference. Verified concretely: adding
          a custom <code>Array.prototype.flatten</code> makes it show up in{' '}
          <code>for...in</code> over <em>every array in the program</em>, including ones you
          don&apos;t own:
        </p>
        <CodeBlock language="javascript" title="A monkey-patched built-in leaking into unrelated code">
{`Array.prototype.flatten = function () {
  return this.reduce((flat, item) =>
    flat.concat(Array.isArray(item) ? item.flatten() : item), []);
};

for (const key in [1, 2, 3]) console.log('for...in key:', key);
// 0
// 1
// 2
// flatten   <- leaked in, from code that never touched this array`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          That is the real version of the &quot;for...in trap&quot; the Arrays lesson warns
          about, caused directly. Worse, if the spec later adds a same-named method (as it
          did with <code>Array.prototype.flat</code> in ES2019), your version silently wins
          or loses depending on load order — a collision with the language itself, not just
          another library. Extending a class or object you own is a normal, useful pattern;
          extending a built-in prototype is the one place this technique is now avoided.
        </p>
      </InfoBox>

      {/* ── Section 4: Getters and Setters ── */}
      <h2>Getters and Setters</h2>
      <p>
        A getter/setter pair looks like a property from the outside but runs code on every
        read or write. They&apos;re defined with the <code>get</code>/<code>set</code>{' '}
        keywords in an object literal or class body.
      </p>

      <CodeBlock language="javascript" title="A validated setter and a computed, read-only getter">
{`const temperature = {
  _celsius: 0,
  get celsius() {
    console.log('  [getter ran]');
    return this._celsius;
  },
  set celsius(value) {
    console.log('  [setter ran with]', value);
    if (value < -273.15) throw new Error('Below absolute zero');
    this._celsius = value;
  },
  get fahrenheit() {           // getter with NO matching setter — read-only
    return this._celsius * 9 / 5 + 32;
  },
};

console.log(temperature.celsius);      // "  [getter ran]" then 0
temperature.celsius = 100;             // "  [setter ran with] 100"
console.log(temperature.fahrenheit);   // 212 — recomputed, not stored

try {
  temperature.celsius = -300;
} catch (e) {
  console.log('threw:', e.message);    // "threw: Below absolute zero"
}
console.log(temperature.celsius);      // 100 — unchanged, the bad write never landed`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified — real console output, in order">
        <p>
          <code>[getter ran]</code> → <code>0</code>; <code>[setter ran with] 100</code>;{' '}
          <code>fahrenheit</code> → <code>212</code>; setting <code>-300</code> logged{' '}
          <code>[setter ran with] -300</code> then threw{' '}
          <code>Below absolute zero</code>; final <code>temperature.celsius</code> read{' '}
          <code>[getter ran]</code> → <code>100</code>, proving the rejected write never
          reached <code>_celsius</code>.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Descriptor-level proof it's not a plain value">
        <p>
          <code>Object.getOwnPropertyDescriptor(temperature, &apos;celsius&apos;)</code>{' '}
          returns <code>{'{ get: [Function], set: [Function], ... }'}</code> with no{' '}
          <code>value</code> key at all — confirmed by running it:{' '}
          <code>{'{ hasGet: true, hasSet: true, hasValue: false }'}</code>. Accessor
          properties and data properties are mutually exclusive descriptor shapes.
        </p>
      </InfoBox>

      {/* ── Section 5: freeze vs seal vs plain ── */}
      <h2>Object.freeze vs Object.seal vs a Plain Object</h2>
      <p>
        These three sit on a spectrum of how much mutation they allow. All were verified
        directly rather than assumed:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--accent-blue)' }}>Operation</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--accent-blue)' }}>Plain</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--accent-blue)' }}>seal()</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--accent-blue)' }}>freeze()</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Modify an existing property value', '✅', '✅', '❌'],
            ['Add a new property', '✅', '❌', '❌'],
            ['Delete a property', '✅', '❌', '❌'],
            ['Mutate a nested object’s properties', '✅', '✅', '✅ (shallow!)'],
          ].map(([op, plain, seal, freeze], i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{op}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{plain}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{seal}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{freeze}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <CodeBlock language="javascript" title="freeze — strict mode throws, value never changes">
{`const frozen = Object.freeze({ a: 1, nested: { b: 2 } });

try {
  frozen.a = 999;                 // this file runs in strict mode (ES modules always do)
} catch (e) {
  console.log(e.constructor.name + ':', e.message);
}
// TypeError: Cannot assign to read only property 'a' of object '#<Object>'

console.log(frozen.a);            // 1 — genuinely unchanged

frozen.nested.b = 999;            // freeze is SHALLOW — nested objects are untouched
console.log(frozen.nested.b);     // 999 — this one DID mutate`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified — and the shallow-freeze trap is real">
        <p>
          Strict mode threw exactly{' '}
          <code>TypeError: Cannot assign to read only property &apos;a&apos; of object
          &apos;#&lt;Object&gt;&apos;</code>, and <code>frozen.a</code> read back as{' '}
          <code>1</code>. But <code>frozen.nested.b = 999</code> succeeded silently and{' '}
          <code>frozen.nested.b</code> really did read back <code>999</code> —{' '}
          <code>Object.freeze</code> only locks the object&apos;s own top-level property
          slots. Freezing a nested object requires freezing it separately (or writing a
          recursive deep-freeze).
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="The classic 'silent no-op' only happens in sloppy mode">
        <p>
          The oft-repeated claim &quot;mutating a frozen object just silently does
          nothing&quot; is <em>only</em> true in non-strict (&quot;sloppy&quot;) code. Every
          <code> .mjs</code>/ES-module file — including everything above — runs in strict
          mode automatically, so a blocked write always throws there. To see the silent
          version for real, the write has to happen inside genuinely sloppy code:
        </p>
        <CodeBlock language="javascript" title="Forcing real sloppy-mode execution with new Function">
{`const sloppyMutate = new Function('frozenObj', \`
  frozenObj.a = 12345;   // no 'use strict' here -> sloppy mode
  return frozenObj.a;    // read back what actually stuck
\`);

const frozen2 = Object.freeze({ a: 1 });
const readBack = sloppyMutate(frozen2);

console.log(readBack);      // 1 — the write silently failed, no exception anywhere
console.log(frozen2.a);     // 1 — confirmed from the outside too`}
        </CodeBlock>
        <p>
          Ran exactly that: no exception was thrown, and both <code>readBack</code> and{' '}
          <code>frozen2.a</code> came back <code>1</code> — the assignment simply had no
          effect. In strict mode (the default in modules, classes, and any file with{' '}
          <code>&apos;use strict&apos;</code>) the identical mutation throws instead of
          vanishing quietly, which is why relying on the &quot;silent&quot; behavior in
          modern code is a mistake — you will get exceptions the moment the surrounding code
          is strict.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="seal — existing values ARE still writable, structure is locked">
{`const sealed = Object.seal({ a: 1 });

sealed.a = 42;                    // allowed — seal does not freeze VALUES
console.log(sealed.a);            // 42

try { sealed.b = 2; } catch (e) { console.log(e.message); }
// Cannot add property b, object is not extensible

try { delete sealed.a; } catch (e) { console.log(e.message); }
// Cannot delete property 'a' of #<Object>

console.log(JSON.stringify(sealed));   // {"a":42} — modified value, still just one key`}
      </CodeBlock>

      <InfoBox variant="info" title="Verified">
        <p>
          Real run: <code>sealed.a = 42</code> succeeded (<code>sealed.a</code> →{' '}
          <code>42</code>); adding <code>b</code> threw{' '}
          <code>Cannot add property b, object is not extensible</code>; deleting{' '}
          <code>a</code> threw <code>Cannot delete property &apos;a&apos; of
          #&lt;Object&gt;</code>. This is the concrete difference from{' '}
          <code>freeze</code>: <code>seal</code> locks the property{' '}
          <em>set</em>, not the values inside it.
        </p>
      </InfoBox>

      {/* ── Section 6: hasOwn vs in ── */}
      <h2>Object.hasOwn vs the in Operator</h2>
      <p>
        <code>in</code> answers &quot;can this key be found anywhere on the prototype
        chain?&quot;. <code>Object.hasOwn(obj, key)</code> (the modern replacement for{' '}
        <code>obj.hasOwnProperty(key)</code>) answers a narrower question: &quot;does this
        object have the key <em>itself</em>, ignoring inheritance entirely?&quot;. They
        genuinely disagree on inherited properties.
      </p>

      <CodeBlock language="javascript" title="The divergence, demonstrated">
{`const base = { inheritedProp: "from base" };
const derived = Object.create(base);
derived.ownProp = "on derived";

console.log(derived.inheritedProp);                  // "from base" — property access WORKS
console.log('inheritedProp' in derived);              // true  — 'in' walks the chain
console.log(Object.hasOwn(derived, 'inheritedProp'));  // false — but it isn't derived's OWN

console.log('ownProp' in derived);                     // true
console.log(Object.hasOwn(derived, 'ownProp'));         // true — both agree here`}
      </CodeBlock>

      <InfoBox variant="danger" title="Verified — the surprising, real divergence">
        <p>
          <code>derived.inheritedProp</code> reads as <code>&quot;from base&quot;</code> — it
          is genuinely accessible through normal dot access. Yet{' '}
          <code>Object.hasOwn(derived, &apos;inheritedProp&apos;)</code> really does return{' '}
          <code>false</code>, while <code>&apos;inheritedProp&apos; in derived</code> returns{' '}
          <code>true</code>. Same object, same key, opposite answers depending which check
          you ask — because they are answering different questions (&quot;can I read
          this?&quot; vs &quot;do I own this?&quot;).
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="This also explains why for...in has a bad reputation">
{`console.log('toString' in derived);              // true — inherited from Object.prototype
console.log(Object.hasOwn(derived, 'toString'));  // false

for (const k in derived) console.log(k);
// ownProp
// inheritedProp     <- for...in walks the chain too (enumerable props only)

console.log(Object.keys(derived));
// [ 'ownProp' ]     <- Object.keys is own-properties-only, like Object.hasOwn`}
      </CodeBlock>

      <InfoBox variant="tip" title="Verified, and the practical rule">
        <p>
          Ran as shown: <code>for...in</code> visited both <code>ownProp</code> and{' '}
          <code>inheritedProp</code>; <code>Object.keys(derived)</code> returned only{' '}
          <code>[ &apos;ownProp&apos; ]</code>. Default to <code>Object.hasOwn</code> and{' '}
          <code>Object.keys</code>/<code>Object.entries</code> for everyday object work —
          they match what you almost always mean (&quot;this object&apos;s own data&quot;).
          Reach for <code>in</code> only when you deliberately want the whole chain, such as
          checking whether a method will resolve at all before calling it.
        </p>
      </InfoBox>

      {/* ── Section 7: Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What does Object.getPrototypeOf(new Dog()) point to, given: function Dog() {}; Dog.prototype.bark = () => {};"}
        code={`function Dog() {}
Dog.prototype.bark = () => {};
const d = new Dog();`}
        language="javascript"
        options={[
          "Dog itself, the function object",
          "Dog.prototype, the object holding bark",
          "d.prototype, a property on the instance",
          "null, because Dog is not a class",
        ]}
        correctIndex={1}
        explanation={
          "Object.getPrototypeOf(d) === Dog.prototype is true — verified directly. The " +
          "instance's internal [[Prototype]] link points at the object assigned to the " +
          "constructor function's .prototype property, which is where bark lives. Instances " +
          "have no .prototype property of their own (typeof d.prototype is 'undefined') — " +
          "only functions carry that property."
        }
      />

      <InteractiveChallenge
        question={"Which of these is something class syntax adds that a hand-written constructor-function + prototype does NOT do?"}
        options={[
          "Instance methods end up on the constructor's .prototype object",
          "new SomeClass() sets the instance's [[Prototype]] to SomeClass.prototype",
          "Calling the constructor without 'new' throws a TypeError instead of running with the wrong 'this'",
          "Static methods can be attached to the constructor function",
        ]}
        correctIndex={2}
        explanation={
          "The first, second, and fourth are exactly what plain constructor functions have " +
          "always done — class is sugar over that same mechanism, confirmed by inspecting " +
          "Foo.prototype directly. But calling Foo(5) without 'new' threw 'TypeError: Class " +
          "constructor Foo cannot be invoked without new' — a real runtime guard. A plain " +
          "function called without 'new' does not throw; it just runs with the wrong 'this'."
        }
      />

      <InteractiveChallenge
        question={"An object O has an inherited property 'x' (on its prototype, not on O itself). What do 'x' in O and Object.hasOwn(O, 'x') return?"}
        options={[
          "Both return true",
          "Both return false",
          "'x' in O is true; Object.hasOwn(O, 'x') is false",
          "'x' in O is false; Object.hasOwn(O, 'x') is true",
        ]}
        correctIndex={2}
        explanation={
          "Verified directly: with derived inheriting inheritedProp from base, " +
          "'inheritedProp' in derived is true (in walks the whole prototype chain) while " +
          "Object.hasOwn(derived, 'inheritedProp') is false (hasOwn only checks the object's " +
          "own properties, ignoring inheritance entirely) — even though derived.inheritedProp " +
          "reads back the value just fine through normal property access."
        }
      />

      <InteractiveChallenge
        question={"const f = Object.freeze({ a: 1, nested: { b: 2 } }); f.nested.b = 999; — what happens?"}
        code={`const f = Object.freeze({ a: 1, nested: { b: 2 } });
f.nested.b = 999;
console.log(f.nested.b);`}
        language="javascript"
        options={[
          "Throws, because f is frozen",
          "Silently does nothing; f.nested.b stays 2",
          "Succeeds; f.nested.b becomes 999",
          "Throws only in non-strict mode",
        ]}
        correctIndex={2}
        explanation={
          "Object.freeze is shallow. Verified: frozen.nested.b = 999 succeeded with no " +
          "error, and reading frozen.nested.b back afterward genuinely returned 999. freeze " +
          "only locks the object's OWN top-level property slots (a, in this case) — the " +
          "object stored at 'nested' is a separate object with its own, unfrozen property " +
          "slots. A real deep-freeze has to walk the object graph and freeze every level."
        }
      />

      <InteractiveChallenge
        question={"const s = Object.seal({ a: 1 }); s.a = 2; delete s.a; — what is the final state of s?"}
        code={`const s = Object.seal({ a: 1 });
s.a = 2;
try { delete s.a; } catch (e) { console.log(e.message); }
console.log(s.a);`}
        language="javascript"
        options={[
          "{} — both the reassignment and the delete succeed",
          "{ a: 1 } — seal blocks both the reassignment and the delete",
          "{ a: 2 } — the reassignment succeeds, but delete throws and is blocked",
          "Throws immediately on 's.a = 2'",
        ]}
        correctIndex={2}
        explanation={
          "Verified: sealed.a = 42 succeeded (seal does not lock existing VALUES, only the " +
          "property set), but the delete threw \"Cannot delete property 'a' of #<Object>\" " +
          "and s.a read back unchanged afterward. seal blocks adding and removing keys, not " +
          "modifying the values already there — that's the concrete distinction from freeze."
        }
      />
    </LessonLayout>
  );
}
