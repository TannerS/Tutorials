import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Types() {
  return (
    <LessonLayout
      title="Type System Fundamentals"
      sectionId="typescript"
      lessonIndex={1}
      prev={{ path: '/typescript/intro', label: 'Intro & Setup' }}
      next={{ path: '/typescript/interfaces', label: 'Interfaces, Type Aliases & Classes' }}
    >
      {/* ── Primitive Types ── */}
      <h2>Primitive Types</h2>
      <p>
        TypeScript&apos;s type system builds on JS primitives with compile-time annotations.
      </p>
      <CodeBlock language="typescript" title="Primitive type annotations">
{`let name: string = "Alice";
let age: number = 30;
let active: boolean = true;
let nothing: null = null;
let notDefined: undefined = undefined;
let id: symbol = Symbol("id");
let huge: bigint = 9007199254740991n;

// Type inference — skip annotations for initialized variables
let inferred = "hello"; // TS infers: string
let count = 42;         // TS infers: number`}
      </CodeBlock>

      <InfoBox variant="tip" title="Let inference do the work">
        <p>
          Skip annotations for initialized variables — TypeScript&apos;s inference is almost
          always correct. Annotate function parameters, explicit return types, and
          uninitialized variables.
        </p>
      </InfoBox>

      {/* ── Arrays and Tuples ── */}
      <h2>Arrays and Tuples</h2>
      <p>Two equivalent syntaxes for typed arrays:</p>
      <CodeBlock language="typescript" title="Arrays and tuples">
{`// Shorthand (preferred)
let ids: number[] = [1, 2, 3];
// Generic form
let names: Array<string> = ["Alice", "Bob"];
// Readonly — prevents push, pop, splice
let frozen: readonly number[] = [1, 2, 3];

// Tuples — fixed-length, typed per position
let pair: [string, number] = ["age", 30];
type Point = [x: number, y: number, z: number];

// Rest elements and readonly tuples
type StringAndNumbers = [string, ...number[]];
let data: StringAndNumbers = ["scores", 95, 87, 73];
type Immutable = readonly [string, number];`}
      </CodeBlock>

      {/* ── Object Types ── */}
      <h2>Object Types</h2>
      <CodeBlock language="typescript" title="Inline object types">
{`let user: { name: string; age: number; active?: boolean } = {
  name: "Alice",
  age: 30,
};

function greet(person: { name: string; title?: string }): string {
  const prefix = person.title ? person.title + " " : "";
  return "Hello, " + prefix + person.name;
}`}
      </CodeBlock>

      {/* ── Union Types ── */}
      <h2>Union Types</h2>
      <CodeBlock language="typescript" title="Union types">
{`type Id = string | number;

function formatId(id: Id): string {
  if (typeof id === "string") {
    return id.toUpperCase(); // narrowed to string
  }
  return id.toFixed(2);      // narrowed to number
}

// Practical: discriminated API response
type ApiResponse<T> =
  | { status: "success"; data: T }
  | { status: "error"; message: string };

function handleResponse(res: ApiResponse<string[]>) {
  if (res.status === "success") {
    console.log(res.data.join(", "));
  } else {
    console.error(res.message);
  }
}`}
      </CodeBlock>

      {/* ── Intersection Types ── */}
      <h2>Intersection Types</h2>
      <CodeBlock language="typescript" title="Intersection types">
{`type HasId = { id: number };
type HasName = { name: string };
type HasTimestamps = { createdAt: Date; updatedAt: Date };

// Must satisfy ALL constituent types
type Entity = HasId & HasName & HasTimestamps;

// Practical: composing API response shapes
type Paginated<T> = { items: T[]; total: number; page: number };
type Sortable = { sortBy: string; sortOrder: "asc" | "desc" };
type PaginatedAndSortable<T> = Paginated<T> & Sortable;`}
      </CodeBlock>

      {/* ── Literal Types ── */}
      <h2>Literal Types</h2>
      <CodeBlock language="typescript" title="Literal types">
{`type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function request(url: string, method: HttpMethod) { /* ... */ }
request("/api/users", "GET");
// request("/api/users", "GETS"); // Error

type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;

// Template literal types — compose string literals
type EventName = "click" | "scroll" | "keypress";
type Handler = \`on\${Capitalize<EventName>}\`;
// "onClick" | "onScroll" | "onKeypress"`}
      </CodeBlock>

      {/* ── Type Narrowing and Type Guards ── */}
      <h2>Type Narrowing and Type Guards</h2>
      <p>
        Narrowing is how TypeScript refines a broad type into something specific
        inside a conditional block. Master this and you&apos;ll rarely fight the compiler.
      </p>

      <h3>How the checker actually does it</h3>
      <p>
        Before memorising the operators, understand the machinery, because it explains every
        surprise you will hit later. TypeScript runs <strong>control-flow analysis</strong>:
        it walks your function as a graph of possible paths and, for each variable, tracks
        what its type could be <em>at that point on that path</em>. A declared type like{' '}
        <code>string | number</code> is the starting set. Every branch you take removes
        members from the set:
      </p>

      <CodeBlock language="typescript" title="One variable, three different types">
{`function describe(x: string | number | null) {
  // here x is:  string | number | null

  if (x === null) {
    return "nothing";       // on THIS path x is: null
  }
  // here x is:  string | number   — null was removed by the return above

  if (typeof x === "number") {
    return x.toFixed(2);    // on THIS path x is: number
  }
  // here x is:  string     — the only member left

  return x.toUpperCase();   // no cast, no check, no assertion needed
}`}
      </CodeBlock>

      <p>
        Notice the last line. Nobody wrote &quot;this is a string&quot; &mdash; the checker
        derived it by elimination. That is the whole game: instead of asserting what a value
        is, you write ordinary runtime checks and the checker <em>follows along</em>. The
        operators below (<code>typeof</code>, <code>instanceof</code>, <code>in</code>,{' '}
        equality against a literal) are simply the ones it knows how to read.
      </p>

      <InfoBox variant="question" title="Why This Matters More Than the Operator List">
        <p>
          Two consequences fall straight out of &quot;per-variable, per-path&quot;:
        </p>
        <ul>
          <li>
            Narrowing applies to a <em>reference</em>, not a value. Narrowing{' '}
            <code>user.profile</code> does not narrow a copy you took earlier, and vice versa.
          </li>
          <li>
            Narrowing is only valid while the checker can prove nothing reassigned the
            reference. The moment it cannot prove that &mdash; crossing into a callback, say
            &mdash; it throws the narrowing away. That is the gotcha at the end of this
            section, and it is not a bug.
          </li>
        </ul>
      </InfoBox>

      <FlowChart
        title="Narrowing decision tree"
        chart={"graph TD\n  A[Broad type] --> B{Primitive?}\n  B -- Yes --> C[typeof]\n  B -- No --> D{Class instance?}\n  D -- Yes --> E[instanceof]\n  D -- No --> F{Tag/kind field?}\n  F -- Yes --> G[Discriminated union]\n  F -- No --> H[in operator or custom guard]"}
      />

      <h3>typeof narrowing</h3>
      <CodeBlock language="typescript" title="typeof narrowing">
{`function padLeft(value: string | number, padding: string | number): string {
  if (typeof padding === "number") {
    // padding is number here
    return " ".repeat(padding) + value;
  }
  // padding is string here
  return padding + value;
}`}
      </CodeBlock>

      <h3>instanceof narrowing</h3>
      <CodeBlock language="typescript" title="instanceof narrowing">
{`class ApiError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}

function handleError(err: Error) {
  if (err instanceof ApiError) {
    console.log("API error:", err.statusCode); // statusCode accessible
  } else {
    console.log("Generic error:", err.message);
  }
}`}
      </CodeBlock>

      <h3>in operator narrowing</h3>
      <CodeBlock language="typescript" title="'in' operator narrowing">
{`type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}`}
      </CodeBlock>

      <h3>Discriminated unions</h3>
      <p>
        The most powerful narrowing pattern. Add a literal &quot;tag&quot; field to each
        variant, then switch on it.
      </p>
      <CodeBlock language="typescript" title="Discriminated unions">
{`type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle"; base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
    case "triangle":  return 0.5 * shape.base * shape.height;
    default:
      const _check: never = shape; // Error if a variant is unhandled
      return _check;
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="TS 5.3+: switch (true) Now Narrows — For When There Is No Single Discriminant">
        <p>
          The discriminated-union switch above works because every branch tests the same field.
          When the condition per branch is different &mdash; a range check, an{' '}
          <code>instanceof</code>, a compound condition &mdash; older TypeScript could not follow{' '}
          <code>switch (true) {'{'} case someCondition: ... {'}'}</code> at all: every case body
          saw the original, un-narrowed type. TS 5.3 made the checker treat each{' '}
          <code>case</code> expression exactly like an <code>if</code> condition, narrowing for the
          rest of that case body.
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0">
{`type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(shape: Shape): number {
  switch (true) {
    case shape.kind === "circle":
      return Math.PI * shape.radius ** 2;  // narrowed to the circle branch here
    case shape.kind === "square":
      return shape.side ** 2;
    default:
      const _exhaustive: never = shape;    // still exhaustive, same as a normal switch
      return _exhaustive;
  }
}`}
        </CodeBlock>
        <p>
          Reach for this only when the branches genuinely cannot share one discriminant field
          &mdash; a plain <code>switch (shape.kind)</code>, or a chain of <code>if</code>/
          <code>else if</code>, stays the clearer default otherwise.
        </p>
      </InfoBox>

      <h3>Custom type guard functions</h3>
      <p>
        Everything so far narrowed <em>inline</em>. The moment you move the check into a
        helper, narrowing stops &mdash; and the reason is worth understanding before the fix.
      </p>

      <CodeBlock language="typescript" title="The problem: a helper returning boolean throws the information away">
{`type Cat = { kind: "cat"; purr(): void };
type Dog = { kind: "dog"; fetch(): void };

function isCat(animal: Cat | Dog): boolean {
  return animal.kind === "cat";
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.purr();
    //     ~~~~
    // error TS2339: Property 'purr' does not exist on type 'Cat | Dog'.
    //   Property 'purr' does not exist on type 'Dog'.
  }
}`}
      </CodeBlock>

      <p>
        Read that error the way the last lesson taught: the bottom line is the real
        complaint &mdash; <code>Dog</code> has no <code>purr</code>. So the checker still
        thinks <code>animal</code> could be a <code>Dog</code>. Of course it does:{' '}
        <code>isCat</code> promised to return <code>boolean</code>, and{' '}
        <code>boolean</code> is just true-or-false. It says nothing about{' '}
        <em>which variable</em> that answer is about. The narrowing you did inside the
        helper was thrown away at the <code>return</code>.
      </p>
      <p>
        A <strong>type predicate</strong> is a return type that carries that missing
        information across the function boundary:
      </p>

      <CodeBlock language="typescript" title="The fix: 'animal is Cat' instead of 'boolean'">
{`// Reads as: "if this returns true, the caller may treat 'animal' as a Cat"
function isCat(animal: Cat | Dog): animal is Cat {
  return animal.kind === "cat";
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.purr();  // narrowed to Cat
  } else {
    animal.fetch(); // narrowed to Dog — the false branch narrows too
  }
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="A Predicate Is a Promise the Compiler Cannot Check">
        <p>
          Nothing stops you writing <code>return animal.kind === &quot;dog&quot;;</code> inside{' '}
          <code>isCat</code>. It compiles, and every call site is then confidently wrong.
          A type predicate is an assertion in guard&apos;s clothing &mdash; the body is on you.
          Keep predicate bodies to a single obvious check for exactly this reason.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="TS 5.5+: Stop Writing &quot;: boolean&quot;">
        <p>
          Since TypeScript 5.5 the compiler <em>infers</em> a type predicate for a function
          whose body just returns a narrowing check, so the naive version now works &mdash;{' '}
          <strong>as long as you leave the return type off</strong>:
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0">
{`// ── variant A: no return annotation ──
function isCatA(animal: Cat | Dog) {
  return animal.kind === "cat";
}
if (isCatA(a)) { a.purr(); }   // narrows — predicate inferred

// ── variant B: identical body, annotated ──
function isCatB(animal: Cat | Dog): boolean {
  return animal.kind === "cat";
}
if (isCatB(a)) { a.purr(); }   // TS2339 — does NOT narrow`}
        </CodeBlock>
        <p>
          This inverts the usual &quot;always annotate your return types&quot; advice for this
          one case: writing <code>: boolean</code> is precisely what destroys the inference.
          Keep writing explicit <code>x is T</code> predicates on exported helpers &mdash; they
          are documentation and they survive refactors &mdash; but never downgrade one to{' '}
          <code>boolean</code>.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Payoff: type-safe array filtering">
{`type AdminUser = { role: "admin"; permissions: string[] };
type BasicUser = { role: "basic" };
type User = AdminUser | BasicUser;

declare const users: User[];

function isAdmin(user: User): user is AdminUser {
  return user.role === "admin";
}

// filter's overload for predicates returns AdminUser[], not User[]
const admins: AdminUser[] = users.filter(isAdmin);

// Same effect inline, thanks to 5.5 inference:
const admins2: AdminUser[] = users.filter(u => u.role === "admin");`}
      </CodeBlock>

      <h3>Truthiness narrowing</h3>
      <CodeBlock language="typescript" title="Truthiness narrowing">
{`function printName(name: string | null | undefined) {
  if (name) {
    console.log(name.toUpperCase()); // name is string
  }
}

// Caution: 0 and "" are falsy too — use explicit null checks for numbers
function processValue(val: string | number | null) {
  if (val !== null && val !== undefined) {
    console.log(val); // val is string | number, including 0 and ""
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Truthiness traps">
        <p>
          Truthiness narrowing excludes all falsy values: <code>0</code>, <code>&quot;&quot;</code>,
          <code>null</code>, <code>undefined</code>. If your value could be <code>0</code> or empty
          string, use explicit <code>!== null</code> checks.
        </p>
      </InfoBox>

      <h3>When narrowing evaporates</h3>
      <p>
        This is the single most common &quot;but I already checked that!&quot; moment in
        TypeScript, and control-flow analysis explains it exactly.
      </p>

      <CodeBlock language="typescript" title="Narrowing does not survive into a callback">
{`interface Box { value?: string }

function process(box: Box) {
  if (box.value) {
    // here box.value is: string  ✓

    [1, 2, 3].forEach(() => {
      box.value.length;
      //  ~~~~~
      // error TS18048: 'box.value' is possibly 'undefined'.
    });
  }
}`}
      </CodeBlock>

      <p>
        The checker is not being obtuse. It has no idea <em>when</em> that arrow function
        runs &mdash; <code>forEach</code> could stash it and call it next week, and anything
        could have set <code>box.value = undefined</code> in between. <code>box</code> is a
        parameter holding a mutable object, so a property read is re-checked from scratch
        inside a function boundary. The narrowing was only ever a claim about that one path
        in <em>this</em> function.
      </p>

      <CodeBlock language="typescript" title="The fix: narrow a const, not a property">
{`function process(box: Box) {
  const value = box.value;   // capture once
  if (value) {
    // 'value' is a const — nothing can reassign it, ever
    [1, 2, 3].forEach(() => value.length);  // OK
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The Rule Underneath">
        <p>
          Narrowing survives exactly as far as the checker can prove the reference has not
          changed. A local <code>const</code> is provably immutable, so its narrowing follows
          it into any closure. A property access, a <code>let</code>, or anything reachable
          from outside the function is not, so the narrowing is dropped at the boundary.
        </p>
        <p>
          &quot;Pull it into a <code>const</code> first&quot; solves a startling share of
          real-world TypeScript complaints, and now you know why rather than just that it works.
        </p>
      </InfoBox>

      {/* ── any vs unknown vs never ── */}
      <h2>any vs unknown vs never</h2>
      <p>
        These three types sit at the extremes of TypeScript&apos;s type system.
      </p>

      <h3>First, the model: types are sets, assignability is a direction</h3>
      <p>
        Almost every rule in this section is derivable from one idea. Think of a type as the{' '}
        <strong>set of values it permits</strong>. <code>boolean</code> is a set of two
        values. <code>&quot;GET&quot; | &quot;POST&quot;</code> is a set of two strings.{' '}
        <code>string</code> is an infinite set.
      </p>
      <p>
        <strong>Assignability</strong> &mdash; the relation behind the phrase &quot;Type A is
        not assignable to type B&quot; that you will read a thousand times &mdash; is then just
        subset checking: <em>A is assignable to B when every value in A is also in B.</em>{' '}
        <code>&quot;GET&quot;</code> is assignable to <code>string</code> because that one
        string is among all strings. The reverse fails, because most strings are not{' '}
        <code>&quot;GET&quot;</code>. Assignability has a direction, and reading it backwards
        is why errors feel arbitrary.
      </p>
      <p>Now place the three special types on that picture:</p>
      <ul>
        <li>
          <code>unknown</code> is the <strong>top type</strong> &mdash; the set of{' '}
          <em>all</em> values. Everything is assignable <em>to</em> it (every set is a subset
          of everything). Almost nothing is assignable <em>from</em> it, because knowing a
          value is &quot;some value&quot; proves nothing about it.
        </li>
        <li>
          <code>never</code> is the <strong>bottom type</strong> &mdash; the <em>empty</em>{' '}
          set. Nothing is assignable to it (no non-empty set fits inside an empty one), and
          it is assignable to everything (the empty set is a subset of every set). Both
          halves of that sound useless in isolation; together they are what makes
          exhaustiveness checks work.
        </li>
        <li>
          <code>any</code> is <strong>not a set at all</strong>. It is an instruction to stop
          checking. It is assignable in <em>both</em> directions, which is impossible for a
          real set and is precisely why it is dangerous: it does not widen your types, it
          switches the checker off around that value.
        </li>
      </ul>

      <CodeBlock language="typescript" title="The asymmetry, made concrete">
{`declare let str: string;
declare let unk: unknown;
declare let anyv: any;
declare let nev: never;

unk  = str;   // OK   — string ⊆ all values
str  = unk;   // error TS2322: Type 'unknown' is not assignable to type 'string'.

anyv = str;   // OK   — any accepts anything
str  = anyv;  // OK   — ...and any is accepted BY anything. Both directions.
              //        That second line is the hole. No error, no proof, no safety.

str  = nev;   // OK   — the empty set fits inside any set (a value that never exists
              //        can never violate a type)
nev  = str;   // error TS2322: Type 'string' is not assignable to type 'never'.`}
      </CodeBlock>

      <InfoBox variant="question" title="Now Re-derive the Rule Everyone Repeats">
        <p>
          &quot;Prefer <code>unknown</code> over <code>any</code>&quot; is usually taught as
          a commandment. It is really a consequence of the table above:{' '}
          <code>unknown</code> and <code>any</code> accept the same values coming in &mdash;
          both hold anything. They differ entirely on the way <em>out</em>.{' '}
          <code>unknown</code> makes you <strong>prove</strong> what the value is (narrow it)
          before you may touch it; <code>any</code> lets you skip the proof.
        </p>
        <p>
          So the choice is not &quot;safe type vs unsafe type&quot;. It is: do you want the
          obligation to appear at compile time where you can see it, or at runtime where your
          user finds it?
        </p>
      </InfoBox>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #555' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Assignability</th>
            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Use when</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <td style={{ padding: '0.5rem' }}><code>any</code></td>
            <td style={{ padding: '0.5rem' }}>Everything to/from it, unchecked</td>
            <td style={{ padding: '0.5rem' }}>JS migration, third-party escape hatch</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <td style={{ padding: '0.5rem' }}><code>unknown</code></td>
            <td style={{ padding: '0.5rem' }}>Everything to it, must narrow to use</td>
            <td style={{ padding: '0.5rem' }}>Untrusted sources, safe any alternative</td>
          </tr>
          <tr>
            <td style={{ padding: '0.5rem' }}><code>never</code></td>
            <td style={{ padding: '0.5rem' }}>Bottom type, nothing assigns to it</td>
            <td style={{ padding: '0.5rem' }}>Exhaustiveness checks, impossible values</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="typescript" title="any — the escape hatch">
{`let danger: any = "hello";
danger.nonExistentMethod(); // No error at compile time — crash at runtime!
danger = 42;
danger = { foo: "bar" };
// any disables ALL type checking`}
      </CodeBlock>

      <CodeBlock language="typescript" title="unknown — the safe alternative">
{`let safe: unknown = "hello";
safe.toUpperCase();
// error TS18046: 'safe' is of type 'unknown'.
//   ^ not "wrong type" — the checker is saying you have not proved anything yet

// Must narrow first
if (typeof safe === "string") {
  console.log(safe.toUpperCase()); // OK — proof supplied
}

// Practical: parsing JSON safely
function parseJSON(raw: string): unknown {
  return JSON.parse(raw);
}
const data = parseJSON('{"name":"Alice"}');
data.name;   // error TS18046: 'data' is of type 'unknown'.`}
      </CodeBlock>

      <InfoBox variant="note" title="JSON.parse Returns any — and That Is a Real Hole">
        <p>
          The standard library types <code>JSON.parse</code> as returning{' '}
          <code>any</code>, so <code>const d = JSON.parse(raw); d.user.name.toUpperCase()</code>{' '}
          compiles with no complaint at all and explodes on the first response that does not
          match. That single <code>any</code> is the most common way type safety leaks out of
          an otherwise strict codebase.
        </p>
        <p>
          Wrapping it in a function annotated <code>: unknown</code>, exactly as above, is
          the cheapest fix: one line that converts a silent runtime crash into a compile error
          you cannot ignore. (A schema validator such as Zod is the fuller answer &mdash; see{' '}
          <em>Runtime Validation &amp; Schemas</em>, which covers it end to end.)
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="never — the impossible type">
{`// Functions that never return
function throwError(msg: string): never {
  throw new Error(msg);
}

// Exhaustiveness checking
type Color = "red" | "green" | "blue";

function toHex(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    case "blue":  return "#0000ff";
    default:
      const _exhaustive: never = color;
      return _exhaustive;
  }
}`}
      </CodeBlock>

      <p>
        That version compiles silently, which teaches nothing &mdash; the whole value of the
        pattern only shows up when a case is <em>missing</em>. Delete one branch and watch:
      </p>

      <CodeBlock language="typescript" title="Same code, one case removed">
{`function toHex(color: Color): string {
  switch (color) {
    case "red":   return "#ff0000";
    case "green": return "#00ff00";
    // "blue" deliberately not handled
    default:
      const _exhaustive: never = color;
      //    ~~~~~~~~~~~
      // error TS2322: Type '"blue"' is not assignable to type 'never'.
      return _exhaustive;
  }
}`}
      </CodeBlock>

      <p>
        And the error tells you exactly which case you forgot &mdash; it names{' '}
        <code>&quot;blue&quot;</code>. The mechanism is pure control-flow narrowing plus the
        set model from above: by the time execution reaches <code>default</code>, every{' '}
        <code>case</code> has eliminated one member, so <code>color</code> has narrowed to the
        empty set, which <em>is</em> <code>never</code> &mdash; and <code>never</code> is
        assignable to <code>never</code>. Miss a case and the leftover member survives; a
        non-empty set is not assignable to the empty one, so it fails.
      </p>

      <InfoBox variant="tip" title="Why This Is the Highest-Leverage Pattern in the Section">
        <p>
          Add a fourth colour to the union six months from now and every switch that forgot to
          handle it lights up at compile time, in files you had forgotten existed. It converts
          &quot;grep for every place that switches on Color&quot; into a build error. Use it in
          every exhaustive switch you write.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="Ban any from production code">
        <p>
          Enable <code>noImplicitAny</code> (on by default with <code>strict: true</code>).
          Every <code>any</code> is a hole in your type safety. Prefer <code>unknown</code> and
          narrow explicitly.
        </p>
      </InfoBox>

      {/* ── Type Assertions ── */}
      <h2>Type Assertions</h2>
      <CodeBlock language="typescript" title="Type assertions">
{`// 'as' syntax (preferred in JSX/TSX)
const input = document.getElementById("name") as HTMLInputElement;
console.log(input.value);

// Double assertion via unknown — absolute last resort
const mystery: string = "42";
const num = (mystery as unknown) as number; // compiles, but nonsensical`}
      </CodeBlock>

      <InfoBox variant="warning" title="Assertions are not casts">
        <p>
          Unlike Java/C# casts, <code>x as number</code> performs zero runtime conversion.
          If the runtime value doesn&apos;t match, you get a silent bug. Prefer type guards.
        </p>
      </InfoBox>

      {/* ── Non-null Assertion ── */}
      <h2>Non-null Assertion</h2>
      <CodeBlock language="typescript" title="Non-null assertion operator">
{`// The ! postfix removes null | undefined without a runtime check
const button = document.getElementById("submit")!;

// Prefer explicit checks over ! in application code:
const user = getUser("123");
if (user) {
  console.log(user.name); // safe, no assertion needed
}`}
      </CodeBlock>

      {/* ── const Assertions ── */}
      <h2>const Assertions</h2>

      <h3>The problem first: literal widening</h3>
      <p>
        You cannot understand <code>as const</code> without understanding{' '}
        <strong>widening</strong>, and widening is rarely explained &mdash; it is just
        blamed. Here is the whole rule.
      </p>
      <p>
        When TypeScript infers a type from a literal like <code>&quot;GET&quot;</code>, it has
        two candidates: the <em>literal type</em> <code>&quot;GET&quot;</code> (a set of
        exactly one string) and its <em>base type</em> <code>string</code> (all strings). It
        chooses by asking one question: <strong>can this location be reassigned?</strong>
      </p>

      <CodeBlock language="typescript" title="Same value, three different inferred types">
{`const a = "GET";               // "GET"    — a const binding can never change,
                               //             so the precise type is safe to keep

let b = "GET";                 // string   — you will almost certainly reassign b,
                               //             so keeping "GET" would be useless

const c = { method: "GET" };   // { method: string }
                               //          — c is const, but c.method is NOT.
                               //             Object properties are always mutable,
                               //             so the property widens.`}
      </CodeBlock>

      <p>
        That third case is the one that bites, because <code>const</code> makes people expect
        precision they did not get. It shows up the moment a literal union is involved:
      </p>

      <CodeBlock language="typescript" title="Where widening actually costs you">
{`type HttpMethod = "GET" | "POST";
declare function request(url: string, method: HttpMethod): void;

const opts = { method: "GET" };
request("/api", opts.method);
//              ~~~~~~~~~~~
// error TS2345: Argument of type 'string' is not assignable
//               to parameter of type 'HttpMethod'.

const methods = ["GET", "POST"];        // inferred: string[]
methods.forEach(m => request("/api", m));
//                                   ~
// error TS2345: Argument of type 'string' is not assignable
//               to parameter of type 'HttpMethod'.`}
      </CodeBlock>

      <p>
        Read those with the set model: you supplied <code>string</code> (all strings) where{' '}
        <code>HttpMethod</code> (two strings) was required. The value is fine; the{' '}
        <em>type</em> lost the information on the way in. <code>as const</code> is the
        instruction that stops the loss &mdash; it tells the checker &quot;nothing here will
        ever be reassigned, so keep the literal types and mark it all{' '}
        <code>readonly</code>&quot;. Adding it to either declaration above makes both errors
        disappear.
      </p>

      <h3>as const in practice</h3>
      <CodeBlock language="typescript" title="as const in practice">
{`// Without as const — types are widened
const config = { endpoint: "/api/v1", retries: 3 };
// config.endpoint is string, config.retries is number

// With as const — literal and readonly
const configLocked = { endpoint: "/api/v1", retries: 3 } as const;
// configLocked.endpoint is "/api/v1", configLocked.retries is 3

// Arrays become readonly tuples
const methods = ["GET", "POST", "PUT"] as const;
// type: readonly ["GET", "POST", "PUT"]

// Derive union types from const objects
const STATUS = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
  Pending: "PENDING",
} as const;

type StatusValue = typeof STATUS[keyof typeof STATUS];
// StatusValue = "ACTIVE" | "INACTIVE" | "PENDING"`}
      </CodeBlock>

      {/* ── Enums ── */}
      <h2>Enums</h2>
      <p>
        TypeScript enums emit runtime code. They work, but the community prefers alternatives.
      </p>
      <CodeBlock language="typescript" title="Numeric and string enums">
{`// Numeric enum — auto-increments from 0
enum Direction { Up, Down, Left, Right }

// String enum — explicit values required
enum LogLevel {
  Debug = "DEBUG", Info = "INFO",
  Warn = "WARN",  Error = "ERROR",
}

// Reverse mapping (numeric only)
console.log(Direction[0]); // "Up"

// const enum — inlined ONLY when tsc compiles the whole program at once
const enum Feature { DarkMode = "DARK_MODE", Beta = "BETA" }
// let f = Feature.DarkMode; // tsc emits: let f = "DARK_MODE";`}
      </CodeBlock>

      <InfoBox variant="warning" title="const enum Does Not Inline Under a Bundler">
        <p>
          Inlining requires whole-program knowledge. Vite, esbuild, SWC and Babel compile one
          file at a time, so under <code>isolatedModules</code> (the default for every bundler
          setup in this course) a <code>const enum</code> is downgraded to an ordinary enum and
          emits the same runtime object &mdash; you get none of the promised savings and a
          subtly different build from <code>tsc</code>.
        </p>
        <p>
          Separately, <code>erasableSyntaxOnly</code> (TS 5.8+, required if you want Node to
          run your <code>.ts</code> files directly via its built-in type stripping) rejects
          enums of any kind outright. Both point the same way: use the{' '}
          <code>as const</code> pattern below.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Preferred alternative: union types + as const">
{`const LogLevel = {
  Debug: "DEBUG", Info: "INFO",
  Warn: "WARN",  Error: "ERROR",
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];
// LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR"

// Benefits: tree-shakeable, works with isolatedModules,
// no special syntax, values are plain strings

function log(level: LogLevel, message: string) {
  console.log("[" + level + "]", message);
}

log(LogLevel.Info, "Server started"); // OK
log("INFO", "Also works");           // OK
// log("TRACE", "Nope");             // Error`}
      </CodeBlock>

      <InfoBox variant="tip" title="Skip enums — use union types">
        <p>
          Prefer the <code>as const</code> object + union type pattern. It produces
          no runtime artifacts, plays well with bundlers, and works in both
          <code> .ts</code> and <code>.js</code> files.
        </p>
      </InfoBox>

      {/* ── Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
