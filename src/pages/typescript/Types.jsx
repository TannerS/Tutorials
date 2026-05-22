import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Types() {
  return (
    <LessonLayout
      title="Type System Fundamentals"
      sectionId="typescript"
      lessonIndex={1}
      prev={{ path: '/typescript/intro', label: 'Intro & Setup' }}
      next={{ path: '/typescript/interfaces', label: 'Interfaces & Type Aliases' }}
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

      <h3>Custom type guard functions</h3>
      <CodeBlock language="typescript" title="Custom type guards with 'is'">
{`// The return type 'animal is Cat' is the type predicate
function isCat(animal: Cat | Dog): animal is Cat {
  return "meow" in animal;
}

function interact(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.purr();  // narrowed to Cat
  } else {
    animal.fetch(); // narrowed to Dog
  }
}

// Practical: type-safe array filtering
type AdminUser = { role: "admin"; permissions: string[] };
type BasicUser = { role: "basic" };
type User = AdminUser | BasicUser;

function isAdmin(user: User): user is AdminUser {
  return user.role === "admin";
}
const admins: AdminUser[] = users.filter(isAdmin); // correctly typed!`}
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

      {/* ── any vs unknown vs never ── */}
      <h2>any vs unknown vs never</h2>
      <p>
        These three types sit at the extremes of TypeScript&apos;s type system.
      </p>

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
// safe.toUpperCase(); // Error: Object is of type 'unknown'

// Must narrow first
if (typeof safe === "string") {
  console.log(safe.toUpperCase()); // OK
}

// Practical: parsing JSON safely
function parseJSON(raw: string): unknown {
  return JSON.parse(raw);
}
const data = parseJSON('{"name":"Alice"}');
// data.name; // Error — must narrow first`}
      </CodeBlock>

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
      const _exhaustive: never = color; // Errors if a variant is unhandled
      return _exhaustive;
  }
}`}
      </CodeBlock>

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

// const enum — inlined at compile time, no runtime object
const enum Feature { DarkMode = "DARK_MODE", Beta = "BETA" }
// let f = Feature.DarkMode; // compiles to: let f = "DARK_MODE";`}
      </CodeBlock>

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

      <InteractiveChallenge
        question={"What is the type of 'value' inside the if block?"}
        code={`function process(input: string | number | boolean) {\n  if (typeof input === "string") {\n    // What is 'input' here?\n    console.log(input);\n  }\n}`}
        language="typescript"
        options={[
          "string | number | boolean",
          "string",
          "string | number",
          "unknown",
        ]}
        correctIndex={1}
        explanation={"typeof narrowing reduces the union to only the branch that matches. Inside the if block, TypeScript knows input passed a typeof === 'string' check, so it narrows to just 'string'."}
      />

      <InteractiveChallenge
        question={"Which type should you use for a value from an untrusted source like JSON.parse?"}
        code={`const data = JSON.parse(rawInput);\n// What should 'data' be typed as?`}
        language="typescript"
        options={[
          "any — so you can use it immediately",
          "unknown — narrow it before use",
          "never — because we don't know the shape",
          "object — because JSON always returns objects",
        ]}
        correctIndex={1}
        explanation={"unknown is the correct choice for untrusted data. It forces you to narrow the type before accessing properties, preventing runtime errors. any would skip all checks, never represents impossible values, and object is too specific since JSON.parse can return primitives and arrays too."}
      />

      <InteractiveChallenge
        question={"What happens if you add a new variant to a discriminated union but forget to handle it?"}
        code={`type Shape =\n  | { kind: "circle"; radius: number }\n  | { kind: "square"; side: number }\n  | { kind: "triangle"; base: number };\n\nfunction area(s: Shape): number {\n  switch (s.kind) {\n    case "circle": return Math.PI * s.radius ** 2;\n    case "square": return s.side ** 2;\n    default:\n      const _check: never = s;\n      return _check;\n  }\n}`}
        language="typescript"
        options={[
          "Runtime error only",
          "Compile error — 'triangle' is not assignable to never",
          "No error — default handles it",
          "Warning only",
        ]}
        correctIndex={1}
        explanation={"The never type in the default branch acts as an exhaustiveness check. The unhandled 'triangle' variant falls to default where TypeScript tries to assign it to never — which fails at compile time, catching the missing case."}
      />
    </LessonLayout>
  );
}
