import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsTypes() {
  return (
    <LessonLayout
      title="TypeScript Types"
      sectionId="typescript"
      lessonIndex={1}
      prev={{ path: "/typescript/intro", label: "Introduction" }}
      next={{ path: "/typescript/interfaces", label: "Interfaces" }}
    >
      <p>
        TypeScript's type system is the foundation of everything else. It includes primitive types, literal types,
        union and intersection types, tuples, enums, and special types like <code>any</code>, <code>unknown</code>,
        and <code>never</code>. Understanding these thoroughly lets you model any domain accurately.
      </p>

      <FlowChart
        title="TypeScript Type Hierarchy"
        chart={"graph TD\n  A[unknown] --> B[any]\n  B --> C[string]\n  B --> D[number]\n  B --> E[boolean]\n  B --> F[object]\n  B --> G[null]\n  B --> H[undefined]\n  F --> I[Array]\n  F --> J[Tuple]\n  F --> K[Interface / Type]\n  L[never] --> M[subtype of everything]"}
      />

      <h2>Primitive Types</h2>
      <p>
        TypeScript has seven primitive types, matching JavaScript's primitives. Every other type is built on top of
        these.
      </p>

      <CodeBlock language="typescript" title="All Seven Primitive Types">
{`// string — text data
let firstName: string = "Alice";
let greeting: string = \`Hello, \${firstName}!\`;  // template literals work

// number — all numeric values (integer and floating point)
let age: number = 30;
let price: number = 9.99;
let hex: number = 0xff;
let binary: number = 0b1010;
let octal: number = 0o744;

// boolean — true or false only
let isActive: boolean = true;
let hasPermission: boolean = false;

// null — intentional absence of a value (must be explicit in strict mode)
let selectedUser: string | null = null;   // will be set later

// undefined — variable declared but not assigned
let uninitializedConfig: string | undefined;  // may never be set

// symbol — guaranteed unique value, used for object property keys
const id: symbol = Symbol("userId");
const anotherId: symbol = Symbol("userId");
id === anotherId;  // false — every Symbol() is unique

// bigint — integers larger than Number.MAX_SAFE_INTEGER (2^53 - 1)
const maxSafeInt: number = Number.MAX_SAFE_INTEGER;  // 9007199254740991
const bigNumber: bigint = 9007199254740993n;          // precise!
const result: bigint = bigNumber * 2n;                // operations use 'n' suffix

// Type inference — TypeScript infers from assignment, no annotation needed:
const name = "Alice";   // inferred as string
const count = 42;       // inferred as number
const flag = true;      // inferred as boolean
// Only annotate when inference can't figure it out`}
      </CodeBlock>

      <h2>Literal Types</h2>
      <p>
        Literal types narrow a type to a specific value rather than a general category. They are the building blocks
        of union types and discriminated unions.
      </p>

      <CodeBlock language="typescript" title="Literal Types and Their Uses">
{`// String literal types
type Direction = "north" | "south" | "east" | "west";
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Status = "pending" | "active" | "suspended" | "deleted";

// Numeric literal types
type DiceRoll = 1 | 2 | 3 | 4 | 5 | 6;
type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500;
type Port = 80 | 443 | 3000 | 8080;

// Boolean literal types (less common but useful)
type AlwaysTrue = true;
type AlwaysFalse = false;

// Where literal types shine: function parameters
function move(direction: Direction, steps: number): void {
  console.log(\`Moving \${steps} steps \${direction}\`);
}
move("north", 3);   // ✓ OK
move("up", 3);      // Error: "up" is not assignable to Direction

// Literal types + overloads: different return based on input
function createElement(tag: "div"): HTMLDivElement;
function createElement(tag: "span"): HTMLSpanElement;
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}
const div = createElement("div");     // TypeScript knows this is HTMLDivElement
const span = createElement("span");   // TypeScript knows this is HTMLSpanElement

// Type widening — watch out for this
const method = "GET";          // inferred as string (widened!)
const method2 = "GET" as const; // inferred as literal "GET"
// or:
const method3: HttpMethod = "GET";  // annotated as HttpMethod`}
      </CodeBlock>

      <h2>Union Types</h2>
      <p>
        A union type (<code>A | B</code>) means "this value can be either A or B". TypeScript enforces that you handle
        all possibilities before using type-specific behavior — this is called type narrowing.
      </p>

      <CodeBlock language="typescript" title="Union Types and Type Narrowing">
{`// Basic union type
type StringOrNumber = string | number;
let id: StringOrNumber = "user-42";
id = 42;  // also valid — can be either

// Union types require narrowing before type-specific operations
function formatId(id: string | number): string {
  // typeof narrowing
  if (typeof id === "string") {
    return id.toUpperCase();   // TypeScript knows: id is string here
  }
  return id.toFixed(0);        // TypeScript knows: id is number here
}

// instanceof narrowing
function processError(err: Error | string): string {
  if (err instanceof Error) {
    return \`Error: \${err.message}\`;  // err is Error here
  }
  return \`String: \${err}\`;           // err is string here
}

// Equality narrowing
function handleStatus(status: "loading" | "success" | "error") {
  if (status === "loading") return <Spinner />;
  if (status === "error")   return <ErrorMessage />;
  return <Content />;  // TypeScript knows: only "success" remains
}

// 'in' narrowing — check for property existence
interface Dog { breed: string; bark(): void; }
interface Cat { indoor: boolean; meow(): void; }

function makeSound(animal: Dog | Cat): void {
  if ("bark" in animal) {
    animal.bark();   // animal is Dog here
  } else {
    animal.meow();   // animal is Cat here
  }
}

// Discriminated unions — the most powerful narrowing technique
type Shape =
  | { kind: "circle";    radius: number }
  | { kind: "rectangle"; width: number; height: number }
  | { kind: "triangle";  base: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":    return Math.PI * shape.radius ** 2;
    case "rectangle": return shape.width * shape.height;
    case "triangle":  return 0.5 * shape.base * shape.height;
    // TypeScript knows all cases are handled — no default needed
  }
}`}
      </CodeBlock>

      <h2>Intersection Types</h2>
      <p>
        An intersection type (<code>A & B</code>) means "this value must satisfy both A AND B simultaneously". It
        combines multiple types into one.
      </p>

      <CodeBlock language="typescript" title="Intersection Types">
{`// Basic intersection: must have ALL properties from both
type Named = { name: string };
type Aged  = { age: number };
type Person = Named & Aged;

const alice: Person = { name: "Alice", age: 30 };  // ✓ must have both
const invalid: Person = { name: "Bob" };  // Error: missing 'age'

// Practical use: mixing in capabilities
interface Serializable {
  toJSON(): string;
  fromJSON(json: string): void;
}

interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// A User that is both serializable and auditable
type AuditableUser = User & Serializable & Auditable;

// Intersection with generics — very common pattern
type WithId<T> = T & { id: number };
type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date };

interface CreateUserInput { name: string; email: string; }
type User = WithId<WithTimestamps<CreateUserInput>>;
// User has: id, name, email, createdAt, updatedAt

// Intersection of functions (less common but valid)
type StringToString = (s: string) => string;
type NumberToNumber = (n: number) => number;
// Intersection of function types creates an overloaded function type`}
      </CodeBlock>

      <h2>any, unknown, and never</h2>

      <InfoBox variant="warning" title="The Three Special Types: Know When to Use Each">
        <p><strong>any</strong> — opts out of all type checking. Avoid it. Anything you assign to any, and anything you try to do with any, TypeScript silently accepts. It's the escape hatch of last resort.</p>
        <p><strong>unknown</strong> — the type-safe alternative to any. Like any, it can hold any value. Unlike any, TypeScript won't let you call methods or access properties on an unknown value without first proving what type it is. Use unknown for values you genuinely don't know the type of (API responses, catch clauses, dynamic data).</p>
        <p><strong>never</strong> — a value that can never occur. A function that always throws has return type never. The bottom of a conditional type has type never. Use never for exhaustiveness checking.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="any vs unknown vs never in Practice">
{`// ─── any: avoid ────────────────────────────────────────────────────────────
let data: any = fetchData();
data.anyMethod();           // No error — TypeScript trusts you blindly
data.nonExistentProp.foo;  // No error — will crash at runtime
const num: number = data;  // No error — type safety abandoned

// ─── unknown: use for untrusted data ───────────────────────────────────────
let safeData: unknown = fetchData();
safeData.anyMethod();           // Error! Must narrow first
safeData.nonExistentProp;       // Error! Must narrow first
const num2: number = safeData;  // Error! Must narrow first

// You MUST prove the type before using it:
if (typeof safeData === "string") {
  safeData.toUpperCase();  // ✓ OK — TypeScript knows it's string here
}

// Type guard for complex narrowing:
function isUser(val: unknown): val is User {
  return (
    typeof val === "object" &&
    val !== null &&
    "id" in val &&
    "name" in val &&
    typeof (val as any).id === "number" &&
    typeof (val as any).name === "string"
  );
}

// Use in catch clauses (TypeScript 4.4+ default with useUnknownInCatchVariables):
try {
  await fetchUser(id);
} catch (error) {
  // error is unknown — must narrow
  if (error instanceof Error) {
    console.error(error.message);  // ✓ OK
  }
}

// ─── never: exhaustiveness and impossible states ────────────────────────────
// Functions that never return:
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) { /* ... */ }
}

// Exhaustiveness checking:
type Color = "red" | "green" | "blue";

function assertNever(x: never): never {
  throw new Error("Unhandled case: " + x);
}

function describeColor(color: Color): string {
  switch (color) {
    case "red":   return "warm";
    case "green": return "natural";
    case "blue":  return "cool";
    default: return assertNever(color);
    // If you add "purple" to Color and forget to handle it here,
    // TypeScript gives a compile error: "purple" is not assignable to never
  }
}`}
      </CodeBlock>

      <h2>Tuples and Enums</h2>

      <CodeBlock language="typescript" title="Tuples, Enums, and as const Objects">
{`// ─── TUPLES: fixed-length arrays with known types at each position ──────────
type Pair = [string, number];
const alice: Pair = ["Alice", 30];  // ✓ OK
const bad: Pair = [30, "Alice"];    // Error: wrong order

// Named tuple elements (TypeScript 4.0+) — much clearer
type NameAge = [name: string, age: number];
const [name, age] = alice;   // destructuring works

// Tuple as function return (multiple values without object overhead)
function divmod(a: number, b: number): [quotient: number, remainder: number] {
  return [Math.floor(a / b), a % b];
}
const [q, r] = divmod(17, 5);  // q = 3, r = 2

// Optional tuple elements
type OptionalPair = [string, number?];

// Rest elements in tuples
type StringsAndNumber = [...string[], number];

// ─── ENUMS: named constants (use sparingly) ──────────────────────────────────
enum Direction {
  North = "NORTH",
  South = "SOUTH",
  East  = "EAST",
  West  = "WEST",
}

// Numeric enums (auto-increment from 0)
enum StatusCode {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  NotFound = 404,
}

// const enums — inlined at compile time, no runtime object generated
const enum LogLevel { Debug, Info, Warn, Error }
const level = LogLevel.Warn;  // compiles to: const level = 2;

// ─── AS CONST OBJECTS: preferred over enums ──────────────────────────────────
// More flexible, works with tree-shaking, debugger-friendly
const DIRECTION = {
  North: "NORTH",
  South: "SOUTH",
  East:  "EAST",
  West:  "WEST",
} as const;

// Extract the union type of values:
type Direction2 = typeof DIRECTION[keyof typeof DIRECTION];
// "NORTH" | "SOUTH" | "EAST" | "WEST"

// Why as const over enum?
// 1. No special runtime object — enums generate an object + reverse mapping
// 2. Works naturally with JSON serialization
// 3. Intellisense shows actual values, not enum names
// 4. Can use in both .ts and .js files (enums are TypeScript-only)

const STATUS = { Pending: "pending", Active: "active", Deleted: "deleted" } as const;
type Status = typeof STATUS[keyof typeof STATUS];  // "pending" | "active" | "deleted"`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What is the difference between unknown and any in TypeScript?"}
        options={[
          "They are identical — both accept any value and allow any operation",
          "unknown requires you to narrow the type before using it; any skips all type checking entirely",
          "unknown is only for objects; any is for primitives",
          "any is the newer, safer version that replaced unknown"
        ]}
        correctIndex={1}
        explanation="Both unknown and any can hold any value. The critical difference is what TypeScript lets you do with that value. With any, TypeScript trusts you completely — you can call any method, access any property, assign it to any type, all without error. With unknown, TypeScript requires proof: you must use typeof, instanceof, a type guard, or an explicit assertion before accessing the value. Use unknown for API responses, catch clause variables, and dynamic data. Reserve any for genuinely unavoidable escape hatches."
      />

      <InteractiveChallenge
        question="When should you prefer an as const object over a TypeScript enum?"
        options={[
          "Never — enums are always the better choice for named constants",
          "Always — as const objects are more flexible, tree-shakeable, and work in both JS and TS files",
          "Only when the values are strings (enums are better for numbers)",
          "Only in React components, not in utility files"
        ]}
        correctIndex={1}
        explanation="as const objects are generally preferred over enums for several reasons: they generate no extra runtime code (enums create an object with reverse mappings), they work identically in JavaScript files (enums are TypeScript-only syntax), they serialize to JSON naturally, debuggers show actual values instead of enum names, and they are simpler to understand. The only advantage enums have is slightly nicer syntax. Most TypeScript style guides now recommend as const objects."
      />
    </LessonLayout>
  );
}
