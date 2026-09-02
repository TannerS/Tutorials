import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Interfaces() {
  return (
    <LessonLayout
      title="Interfaces, Type Aliases &amp; Classes"
      sectionId="typescript"
      lessonIndex={2}
      prev={{ path: '/typescript/types', label: 'Type System Fundamentals' }}
      next={{ path: '/typescript/generics', label: 'Generics Deep Dive' }}
    >
      {/* ── Section 1: Interface Declaration ── */}
      <h2>Interface Declaration</h2>
      <p>
        Interfaces are the primary way to define the shape of an object in TypeScript.
        They describe what properties and methods an object must have.
      </p>

      <CodeBlock language="typescript" title="Basic Interface Syntax">
{`interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  isActive: true,
};`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Optional and Readonly Properties">
{`interface Product {
  readonly id: string;
  name: string;
  price: number;
  description?: string;   // optional
  readonly createdAt: Date; // cannot be reassigned
}

const item: Product = {
  id: "abc-123",
  name: "Widget",
  price: 9.99,
  createdAt: new Date(),
};

// item.id = "xyz"; // Error: Cannot assign to 'id' because it is read-only`}
      </CodeBlock>

      <InfoBox variant="question" title="Wait — Where Is &quot;implements User&quot;?">
        <p>
          Nothing in that object literal mentions <code>User</code>. It just has the right
          properties, and TypeScript accepted it. If you have written Java or C#, that should
          look wrong: there, a class is compatible with an interface only if it explicitly
          declares <code>implements</code>. TypeScript works on a different principle
          entirely, and it is the single most important thing to understand about the
          language. It gets its own section, right now, before anything else.
        </p>
      </InfoBox>

      <h2>Structural Typing &mdash; the Rule Behind Everything</h2>
      <p>
        TypeScript is <strong>structurally typed</strong>: two types are compatible when their{' '}
        <em>shapes</em> are compatible. Names are labels for humans; the checker only ever
        compares members. Java, C#, and Kotlin are <strong>nominally</strong> typed &mdash;
        compatibility is decided by the declared name and inheritance chain. Same word,
        &quot;interface&quot;; opposite mechanic.
      </p>

      <CodeBlock language="typescript" title="No declaration of intent required">
{`interface Point { x: number; y: number }

function distanceFromOrigin(p: Point) {
  return Math.sqrt(p.x ** 2 + p.y ** 2);
}

// A class that has never heard of Point:
class Vector3 {
  constructor(public x: number, public y: number, public z: number) {}
}

distanceFromOrigin(new Vector3(1, 2, 3));  // ✓ accepted

// A plain object held in a variable:
const reading = { x: 3, y: 4, z: 5, label: "sensor-1" };
distanceFromOrigin(reading);               // ✓ accepted`}
      </CodeBlock>

      <p>
        Both are accepted because both <em>have</em> an <code>x: number</code> and a{' '}
        <code>y: number</code>. The extra members are irrelevant: <code>Point</code> is a
        contract about what must be present, never about what must be absent. In set terms
        (from the last lesson) a type with <em>more</em> properties describes a{' '}
        <em>smaller</em> set of objects, so it fits inside the one that demands less.
      </p>

      <InfoBox variant="tip" title="Why This Design, and What It Buys You">
        <p>
          Structural typing is why TypeScript could be retrofitted onto JavaScript at all.
          JavaScript objects come from JSON responses, object literals, spreads, and libraries
          that never imported your types &mdash; none of which can declare{' '}
          <code>implements</code>. A nominal system would have rejected all of it.
        </p>
        <p>
          Day to day this means you can describe someone else&apos;s data without owning it,
          and you can write an interface for the three fields a function actually needs rather
          than demanding the caller hand you a whole <code>User</code>. Narrow parameter types
          are free here in a way they are not in Java.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="implements Is a Check, Not a Connection">
        <p>
          Class <code>implements</code> still exists, but it does far less than the Java
          keyword that shares its spelling. It <em>verifies</em> that the class satisfies the
          interface and changes nothing else &mdash; the class was already compatible with any
          interface whose shape it matched, and removing <code>implements</code> would not
          break a single call site.
        </p>
        <p>
          One practical consequence surprises everyone: <code>implements</code> supplies{' '}
          <strong>no contextual types</strong> to the members.
        </p>
        <CodeBlock language="typescript" title="The interface does not type your parameters">
{`interface Greeter { greet(name: string): string }

class Console implements Greeter {
  greet(name) { return name; }
  //    ~~~~
  // error TS7006: Parameter 'name' implicitly has an 'any' type.
}`}
        </CodeBlock>
        <p>
          You must annotate <code>name: string</code> yourself. <code>implements</code> checks
          your work afterwards; it does not do the work for you.
        </p>
      </InfoBox>

      <h2>Excess Property Checking</h2>
      <p>
        Structural typing says extra properties are harmless &mdash; and it means it. So this
        looks like a contradiction:
      </p>

      <CodeBlock language="typescript" title="Two lines that should behave identically. They do not.">
{`interface Point { x: number; y: number }
declare function distanceFromOrigin(p: Point): number;

const reading = { x: 3, y: 4, z: 5 };
distanceFromOrigin(reading);          // ✓ fine

distanceFromOrigin({ x: 3, y: 4, z: 5 });
//                               ~
// error TS2353: Object literal may only specify known properties,
//               and 'z' does not exist in type 'Point'.`}
      </CodeBlock>

      <p>
        The same value, rejected only when written inline. This is not an inconsistency, it is
        a deliberate extra rule called <strong>excess property checking</strong>, and it fires
        on exactly one thing: a <em>fresh object literal</em> assigned directly to a typed
        position. Assign that literal to a variable first and its &quot;freshness&quot; is
        gone, so only ordinary structural rules apply.
      </p>

      <InfoBox variant="question" title="Why Have the Exception at All?">
        <p>
          Because of what an inline literal means. If you write{' '}
          <code>{'{ x: 3, y: 4, z: 5 }'}</code> right at the call, that object exists for no
          other purpose &mdash; nobody else will read <code>z</code>. So <code>z</code> is
          either dead weight or, far more likely, a mistake. TypeScript pays back the
          strictness immediately:
        </p>
        <CodeBlock language="typescript" title="The case this rule exists to catch">
{`interface RequestOptions { url: string; timeout?: number }
declare function send(o: RequestOptions): void;

send({ url: "/api", timout: 3000 });
//                  ~~~~~~
// error TS2561: Object literal may only specify known properties,
//               but 'timout' does not exist in type 'RequestOptions'.
//               Did you mean to write 'timeout'?`}
        </CodeBlock>
        <p>
          Without the rule this typo would be silently legal &mdash; <code>timeout</code> is
          optional, so the object still structurally satisfies{' '}
          <code>RequestOptions</code> &mdash; and your request would quietly use the default
          timeout forever. Note the error code too: <strong>TS2561 is the typo variant</strong>{' '}
          of TS2353 and it tells you the intended name.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="When You Hit This For Real">
        <p>
          The useful takeaway is diagnostic. Seeing TS2353 means one of three things, in
          order of likelihood: you typed a property name wrong; the target type is missing a
          property it should have; or you genuinely want the extra field, in which case the
          honest fix is to widen the type, not to reach for <code>as</code>.
        </p>
        <p>
          Assigning to an intermediate variable also makes the error go away &mdash; but that
          is a loophole, not a solution. It suppresses the check without answering the
          question of why an unexpected property is there.
        </p>
      </InfoBox>

      {/* ── Section 2: Type Alias Declaration ── */}
      <h2>Type Alias Declaration</h2>
      <p>
        Type aliases create a new name for any type. They shine when you need unions,
        tuples, primitives, or mapped types that interfaces cannot express.
      </p>

      <CodeBlock language="typescript" title="Type Alias Basics">
{`// Primitive alias
type ID = string | number;

// Tuple alias
type Coordinate = [x: number, y: number];

// Union alias
type Status = "pending" | "active" | "archived";

// Object alias (looks like an interface)
type Point = {
  x: number;
  y: number;
};

const userId: ID = 42;
const pos: Coordinate = [10, 20];
const status: Status = "active";`}
      </CodeBlock>

      {/* ── Section 3: Interface vs Type Alias ── */}
      <h2>Interface vs Type Alias</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--accent-blue)' }}>Feature</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--accent-blue)' }}>Interface</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--accent-blue)' }}>Type Alias</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Declaration merging', '✅', '❌'],
            ['Extends / inheritance', '✅ extends', '✅ via &amp;'],
            ['Union types', '❌', '✅'],
            ['Tuple types', '❌', '✅'],
            ['Primitive aliases', '❌', '✅'],
            ['implements in classes', '✅', '✅'],
            ['Computed properties', '❌', '✅'],
            ['Mapped types', '❌', '✅'],
          ].map(([feature, iface, alias], i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)' }}>{feature}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{iface}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{alias}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <InfoBox variant="tip" title="When To Use Which?">
        <p>
          <strong>Use interfaces</strong> for public API contracts, object shapes you expect
          others to extend, and class implementations. Their merging capability makes them
          ideal for library authors.
        </p>
        <p>
          <strong>Use type aliases</strong> for unions, tuples, mapped types, and any type
          that is not purely an object shape. When in doubt, interfaces are a safe default
          for object types.
        </p>
      </InfoBox>

      {/* ── Section 4: Optional Properties ── */}
      <h2>Optional Properties</h2>
      <p>
        The <code>?</code> modifier marks a property as optional. TypeScript narrows
        optional values to <code>T | undefined</code>, so you must handle the missing case.
      </p>

      <CodeBlock language="typescript" title="Handling Optional Values Safely">
{`interface Config {
  host: string;
  port?: number;
  ssl?: boolean;
}

function connect(config: Config) {
  const port = config.port ?? 3000;     // default via nullish coalescing
  const ssl = config.ssl === true;      // explicit boolean check

  console.log("Connecting to " + config.host + ":" + port);
}

connect({ host: "localhost" });           // port defaults to 3000
connect({ host: "prod.io", port: 443, ssl: true });`}
      </CodeBlock>

      {/* ── Section 5: Readonly Properties ── */}
      <h2>Readonly Properties</h2>

      <CodeBlock language="typescript" title="Readonly Patterns">
{`// Per-property readonly
interface Immutable {
  readonly id: string;
  readonly data: number[];
}

// Utility type: makes ALL properties readonly
type FrozenUser = Readonly<User>;

// Deep readonly (recursive)
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};`}
      </CodeBlock>

      <InfoBox variant="warning" title="Readonly Is Shallow">
        <p>
          The built-in <code>Readonly&lt;T&gt;</code> only freezes top-level properties.
          Nested objects remain mutable unless you use a deep readonly pattern like above.
        </p>
      </InfoBox>

      {/* ── Section 6: Index Signatures ── */}
      <h2>Index Signatures</h2>

      <CodeBlock language="typescript" title="Index Signatures with Known Properties">
{`interface AppConfig {
  appName: string;
  version: string;
  [key: string]: unknown; // allow arbitrary extra keys
}

const config: AppConfig = {
  appName: "Dashboard",
  version: "2.1.0",
  featureFlags: { darkMode: true },
  maxRetries: 3,
};`}
      </CodeBlock>

      <p>
        There is a rule hiding in that example that catches people the first time:{' '}
        <strong>every named property must be assignable to the index signature&apos;s
        type.</strong> It works above only because <code>string</code> is assignable to{' '}
        <code>unknown</code>. Narrow the index type and the named properties start failing:
      </p>

      <CodeBlock language="typescript" title="The constraint an index signature imposes">
{`interface Scores {
  average: string;
  //~~~~~
  // error TS2411: Property 'average' of type 'string' is not
  //               assignable to 'string' index type 'number'.
  [subject: string]: number;
}`}
      </CodeBlock>

      <p>
        The logic is that <code>config[someRuntimeKey]</code> must have a single predictable
        type, and <code>someRuntimeKey</code> could be <code>&quot;average&quot;</code>. If the
        signature promises <code>number</code>, a <code>string</code> property would make that
        promise false. The fix is to widen the index type to cover both
        (<code>number | string</code>), or to drop the index signature and use{' '}
        <code>Record</code> for the open-ended part separately.
      </p>

      <InfoBox variant="warning" title="An Index Signature Switches Off Typo Protection">
        <p>
          Adding <code>[key: string]: unknown</code> makes <em>every</em> key a known key, so
          the excess property check from earlier in this lesson has nothing left to reject:
        </p>
        <CodeBlock language="typescript" title="Same typo, opposite outcomes">
{`interface Tight  { appName: string; verbose?: boolean }
interface Open   { appName: string; verbose?: boolean; [key: string]: unknown }

const a: Tight = { appName: "x", vrebose: true };
//                               ~~~~~~~
// error TS2561: ... 'vrebose' does not exist in type 'Tight'.
//               Did you mean to write 'verbose'?

const b: Open  = { appName: "x", vrebose: true };  // no error at all`}
        </CodeBlock>
        <p>
          That is a real cost, not a formality &mdash; you traded your typo protection for
          flexibility. Reach for an index signature only when the keys are genuinely
          open-ended (a translations map, a feature-flag bag); for a fixed set of options,
          list them.
        </p>
      </InfoBox>

      {/* ── Section 7: Extending Interfaces ── */}
      <h2>Extending Interfaces</h2>

      <CodeBlock language="typescript" title="Single and Multiple Extends">
{`interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeletable {
  deletedAt?: Date;
  isDeleted: boolean;
}

// Single extension
interface BaseEntity extends Timestamped {
  id: string;
}

// Multiple extension
interface ManagedEntity extends Timestamped, SoftDeletable {
  id: string;
  version: number;
}`}
      </CodeBlock>

      {/* ── Section 8: Intersection Types ── */}
      <h2>Intersection Types for Combining</h2>
      <p>
        Type aliases use the <code>&amp;</code> operator to combine types, achieving the
        same result as interface extends.
      </p>

      <CodeBlock language="typescript" title="Intersection with Type Aliases">
{`type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

type Identifiable = {
  id: string;
};

type Resource = Identifiable & Timestamped & {
  name: string;
  owner: string;
};

// Equivalent to an interface extending both`}
      </CodeBlock>

      {/* ── Section 9: Declaration Merging ── */}
      <h2>Declaration Merging</h2>
      <p>
        Interfaces with the same name in the same scope automatically merge. This is
        especially useful for extending third-party library types.
      </p>

      <CodeBlock language="typescript" title="Merging Interfaces">
{`// Original interface
interface AppShell {
  title: string;
}

// Merged automatically — no error!
interface AppShell {
  appVersion: number;
}

// Result: AppShell has both title AND appVersion
const shell: AppShell = { title: "App", appVersion: 2 };`}
      </CodeBlock>

      <InfoBox variant="warning" title="Do Not Demo This With a Name the DOM Already Owns">
        <p>
          Tutorials love to show this with <code>interface Window</code>. It appears to work
          only because a file containing an <code>import</code> or <code>export</code> is a
          module, so your <code>Window</code> shadows the DOM one instead of merging with it.
          Paste the same two declarations into a script-scope <code>.ts</code> file and they
          really do merge &mdash; with the global <code>Window</code> &mdash; and the object
          literal fails with &quot;missing the following properties from type &apos;Window&apos;:
          clientInformation, closed, ... and 212 more.&quot;
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Extending Express Request — the form that actually works">
{`// src/types/express.d.ts (or any file that is already a module)
import "express";   // makes this file a module so 'declare global' is legal

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: "admin" | "user" };
    }
  }
}

// Now req.user is available in every handler, app-wide.
app.get("/profile", (req, res) => {
  if (req.user) {
    res.json({ id: req.user.id });
  }
});`}
      </CodeBlock>

      <InfoBox variant="danger" title="The Augmentation That Silently Does Nothing">
        <p>
          Writing a bare <code>declare namespace Express {'{ … }'}</code> inside a file that has
          any import or export is the single most-copied broken snippet in the Express +
          TypeScript world. In a module, that declares a brand-new{' '}
          <em>local</em> namespace: no error, no warning, and <code>req.user</code> still
          reports <code>Property &apos;user&apos; does not exist</code>. The <code>declare global</code>{' '}
          wrapper above is what reaches the real global <code>Express</code> namespace that{' '}
          <code>@types/express</code> declares.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Type Aliases Cannot Merge">
        <p>
          Attempting to declare two type aliases with the same name causes a compile error.
          Declaration merging is exclusive to interfaces and namespaces.
        </p>
      </InfoBox>

      {/* ── Section 10: Implementing Interfaces ── */}
      <h2>Implementing Interfaces in Classes</h2>

      <CodeBlock language="typescript" title="Class Implements">
{`interface Logger {
  log(message: string): void;
  error(message: string, code?: number): void;
}

interface Serializable {
  serialize(): string;
}

class AppLogger implements Logger, Serializable {
  log(message: string) {
    console.log("[LOG] " + message);
  }
  error(message: string, code?: number) {
    console.error("[ERR " + (code ?? 500) + "] " + message);
  }
  serialize() {
    return JSON.stringify({ type: "AppLogger" });
  }
}`}
      </CodeBlock>

      <hr style={{ borderColor: '#333', margin: '3rem 0 2rem' }} />

      {/* ── Part 2: Classes in TypeScript ── */}
      <h2>Part 2: Classes in TypeScript</h2>
      <p>
        Everything above described the <em>shape</em> of data. Classes are where TypeScript
        adds a full object-oriented layer on top of JavaScript&apos;s own <code>class</code>{' '}
        syntax &mdash; access modifiers, parameter properties, abstract members, and
        compile-time checks that a class actually satisfies the interfaces it claims to{' '}
        <code>implement</code>. That last part is the connective tissue back to Part 1:
        every one of these class features exists to make a class into a value that is
        structurally compatible with the interfaces you just learned to write.
      </p>

      <h3>Access modifiers</h3>
      <CodeBlock language="typescript" title="public, private, protected, readonly">
{`class Account {
  public owner: string;        // default — accessible anywhere
  protected balance: number;   // this class AND subclasses
  private pin: string;         // this class only
  readonly id: string;         // set once (in the constructor), never reassigned

  constructor(owner: string, balance: number, pin: string) {
    this.owner = owner;
    this.balance = balance;
    this.pin = pin;
    this.id = crypto.randomUUID();
  }
}

const acct = new Account("Alice", 100, "1234");
acct.owner;   // OK
// acct.balance; // Error: 'balance' is protected
// acct.pin;     // Error: 'pin' is private
// acct.id = "x"; // Error: 'id' is read-only`}
      </CodeBlock>

      <InfoBox variant="warning" title="private is Compile-Time Only">
        <p>
          TypeScript&apos;s <code>private</code> disappears after compilation &mdash; at runtime the
          field is a normal property, reachable via <code>acct[&quot;pin&quot;]</code> or from plain JS.
          For true runtime privacy use the ECMAScript <code>#</code> field syntax:
          <code> #pin: string</code>. That one is enforced by the JS engine itself, and
          accessing it from outside the class is a syntax error, not a type error.
        </p>
      </InfoBox>

      <h3>Parameter properties &mdash; the constructor shorthand</h3>
      <CodeBlock language="typescript" title="Declare and assign in one step">
{`// Verbose: declare the field, then assign it
class Verbose {
  private name: string;
  constructor(name: string) { this.name = name; }
}

// Shorthand: a modifier on a constructor parameter declares AND assigns the field
class Concise {
  constructor(
    private name: string,
    public readonly id: string,
    protected role: "admin" | "user" = "user",
  ) {}
}

const c = new Concise("Alice", "u-1");
c.id;    // "u-1"
// c.name; // Error: private`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Modifier Is Required">
        <p>
          A constructor parameter only becomes a field if it carries a modifier
          (<code>public</code>, <code>private</code>, <code>protected</code>, or
          <code> readonly</code>). A bare <code>constructor(name: string)</code> is
          just a local parameter that vanishes when the constructor returns.
        </p>
      </InfoBox>

      <h3>Inheritance, super, and override</h3>
      <CodeBlock language="typescript" title="extends, super(), and the override keyword">
{`class Employee {
  constructor(protected name: string, protected salary: number) {}

  describe(): string {
    return this.name + " earns " + this.salary;
  }
}

class Manager extends Employee {
  constructor(name: string, salary: number, private reports: string[]) {
    super(name, salary);  // MUST run before any use of 'this'
  }

  // 'override' documents intent — and with noImplicitOverride it is required
  override describe(): string {
    return super.describe() + " and manages " + this.reports.length + " people";
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Turn on noImplicitOverride">
        <p>
          With <code>&quot;noImplicitOverride&quot;: true</code>, forgetting the <code>override</code>
          keyword is an error &mdash; and so is marking a method <code>override</code> when the
          base class has no such method. That catches the classic bug where someone
          renames a base method and every &quot;override&quot; silently becomes a brand-new method.
        </p>
      </InfoBox>

      <h3>Abstract classes</h3>
      <p>
        An abstract class is a partially implemented base: it can hold real logic and
        state, but it cannot be instantiated, and its abstract members must be
        implemented by every concrete subclass.
      </p>
      <CodeBlock language="typescript" title="Abstract base with shared logic">
{`abstract class Shape {
  constructor(public readonly name: string) {}

  // No body — every subclass MUST supply one
  abstract area(): number;
  abstract perimeter(): number;

  // Concrete method shared by all subclasses
  summary(): string {
    return this.name + ": area " + this.area().toFixed(2);
  }
}

class Circle extends Shape {
  constructor(private radius: number) { super("circle"); }
  area()      { return Math.PI * this.radius ** 2; }
  perimeter() { return 2 * Math.PI * this.radius; }
}

// new Shape("x");   // Error: cannot create an instance of an abstract class
new Circle(2).summary();  // "circle: area 12.57"`}
      </CodeBlock>

      <InfoBox variant="tip" title="Abstract Class vs Interface">
        <p>
          Use an <strong>interface</strong> when you only need to describe a shape &mdash; it has
          zero runtime cost and a class can implement many. Use an <strong>abstract class</strong>
          when subclasses should inherit real implementation or shared state. A class
          can extend exactly one abstract class but implement any number of interfaces.
        </p>
      </InfoBox>

      <h3>Getters and setters</h3>
      <CodeBlock language="typescript" title="Accessors look like properties, run like methods">
{`class Temperature {
  #celsius = 0;

  get celsius(): number { return this.#celsius; }

  set celsius(value: number) {
    if (value < -273.15) throw new Error("Below absolute zero");
    this.#celsius = value;
  }

  // Read-only computed property — a getter with no matching setter
  get fahrenheit(): number { return this.#celsius * 9 / 5 + 32; }
}

const t = new Temperature();
t.celsius = 25;      // calls the setter (validated)
t.fahrenheit;        // 77 — computed on read
// t.fahrenheit = 90; // Error: no setter exists`}
      </CodeBlock>

      <h3>Static members and static blocks</h3>
      <CodeBlock language="typescript" title="Members that live on the class, not the instance">
{`class Config {
  static readonly VERSION = "2.1.0";
  static #instances = 0;
  static defaults: Record<string, string>;

  // Static initialization block — runs once, when the class is defined
  static {
    Config.defaults = { host: "localhost", port: "3000" };
  }

  static create(): Config {
    Config.#instances++;
    return new Config();
  }

  static get count(): number { return Config.#instances; }
}

Config.VERSION;  // "2.1.0" — no instance needed
Config.create();
Config.count;    // 1`}
      </CodeBlock>

      <h3>Singletons with a private constructor</h3>
      <CodeBlock language="typescript" title="One instance, enforced by the compiler">
{`class Database {
  private static instance: Database | null = null;

  // Private constructor blocks 'new Database()' from outside
  private constructor(private readonly url: string) {}

  static getInstance(): Database {
    Database.instance ??= new Database("postgres://localhost");
    return Database.instance;
  }

  query(sql: string) { /* ... */ }
}

// new Database("x");  // Error: constructor is private
const db = Database.getInstance();
const same = Database.getInstance();
db === same;  // true`}
      </CodeBlock>

      <InfoBox variant="note" title="Do You Actually Need a Singleton?">
        <p>
          In a module-based codebase, a plain exported <code>const db = createDatabase()</code>
          is already a singleton &mdash; ES modules are evaluated once and cached. Reach for the
          private-constructor pattern only when you need lazy construction or want the
          compiler to physically prevent a second instance.
        </p>
      </InfoBox>

      <h3>strictPropertyInitialization</h3>
      <CodeBlock language="typescript" title="Every field must be definitely assigned">
{`class Widget {
  // Error under strict: 'title' has no initializer and is not
  // definitely assigned in the constructor.
  title: string;
}

// Four ways to satisfy the check:
class Fixed {
  a: string = "default";     // 1. initializer
  b: string;                 // 2. assigned in the constructor
  c!: string;                // 3. definite assignment assertion — "trust me"
  d?: string;                // 4. or admit it may be undefined

  constructor() { this.b = "set here"; }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="The ! Assertion Is a Promise You Must Keep">
        <p>
          <code>c!: string</code> silences the compiler without proving anything. It is
          appropriate for fields a framework injects (DI containers, test setup hooks)
          and a landmine everywhere else &mdash; if nothing assigns it, you get
          <code> undefined</code> at runtime with a type that says <code>string</code>.
        </p>
      </InfoBox>

      {/* ── Section 11: Function Types ── */}
      <h2>Function Types</h2>

      <CodeBlock language="typescript" title="Function Type Signatures">
{`// Type alias for a function
type Comparator<T> = (a: T, b: T) => number;

// Interface with a call signature
interface SearchFn {
  (source: string, term: string): boolean;
}

// Callable interface with additional properties
interface Formatter {
  (value: unknown): string;
  locale: string;
}

// Overloaded function signatures
interface DateParser {
  (input: string): Date;
  (input: number): Date;
  (input: string, format: string): Date;
}`}
      </CodeBlock>

      {/* ── Section 12: Constructable Signatures ── */}
      <h2>Constructable Signatures</h2>

      <CodeBlock language="typescript" title="Constructor Signatures">
{`interface ClockConstructor {
  new (hour: number, minute: number): ClockInterface;
}

interface ClockInterface {
  tick(): void;
}

function createClock(
  Ctor: ClockConstructor,
  h: number, m: number
): ClockInterface {
  return new Ctor(h, m);
}`}
      </CodeBlock>

      {/* ── Section 13: Discriminated Unions ── */}
      <h2>Discriminated Unions</h2>
      <p>
        A discriminated union combines a union type with a literal discriminant property,
        enabling exhaustive type narrowing via switch or if statements.
      </p>

      <FlowChart
        title="Discriminated Union Pattern"
        chart={"graph TD\n  A[Shape Union] --> B{Check kind}\n  B -->|circle| C[Circle branch]\n  B -->|rectangle| D[Rectangle branch]\n  B -->|triangle| E[Triangle branch]\n  C --> F[Access radius]\n  D --> G[Access width, height]\n  E --> H[Access base, height]"}
      />

      <CodeBlock language="typescript" title="Exhaustive Shape Handling">
{`interface Circle    { kind: "circle";    radius: number }
interface Rectangle { kind: "rectangle"; width: number; height: number }
interface Triangle  { kind: "triangle";  base: number;  height: number }

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // Exhaustive check — errors if a variant is missed
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The never Trick">
        <p>
          Assigning to <code>never</code> in the default branch ensures a compile error if
          you add a new variant to the union but forget to handle it in the switch.
        </p>
      </InfoBox>

      {/* ── Section 14: Utility Types ── */}
      <h2>Utility Types Intro</h2>
      <p>
        TypeScript ships with built-in utility types that transform existing types.
        These eliminate boilerplate and keep your types DRY.
      </p>

      <CodeBlock language="typescript" title="Partial, Required, Pick, Omit">
{`interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// All properties become optional
type UserUpdate = Partial<User>;

// All properties become required
type StrictUser = Required<User>;

// Select specific properties
type UserPreview = Pick<User, "id" | "name">;

// Remove specific properties
type PublicUser = Omit<User, "email">;

function updateUser(id: string, changes: Partial<User>) {
  // changes can have any subset of User fields
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Record">
{`type Role = "admin" | "editor" | "viewer";

type RolePermissions = Record<Role, string[]>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete", "manage"],
  editor: ["read", "write"],
  viewer: ["read"],
};`}
      </CodeBlock>

      <InfoBox variant="info" title="Composing Utility Types">
        <p>
          Utility types compose naturally. For example,
          <code>Readonly&lt;Partial&lt;User&gt;&gt;</code> creates a frozen partial user,
          and <code>Omit&lt;User, &quot;id&quot;&gt; &amp; {'{'}id: number{'}'}</code> replaces
          the id type from string to number.
        </p>
      </InfoBox>

      {/* ── Section 15: Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
