import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Advanced() {
  return (
    <LessonLayout
      title="Advanced Types"
      sectionId="typescript"
      lessonIndex={4}
      prev={{ path: '/typescript/generics', label: 'Generics Deep Dive' }}
      next={{ path: '/typescript/react', label: 'React + TypeScript' }}
    >

      {/* ── 1. Mapped Types ── */}
      <h2>Mapped Types</h2>
      <p>
        Mapped types let you transform every property of a type systematically.
        The syntax <code>[K in keyof T]</code> iterates over each key, producing
        a new type with transformed values.
      </p>

      <CodeBlock language="typescript" title="Built-in Mapped Utilities">
{`// Make every property optional
type MyPartial<T> = { [K in keyof T]?: T[K] };

// Make every property readonly
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Custom Mapped Types">
{`// Strip readonly from every property
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// Make every property nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// Pick only string-valued properties (key remapping with 'as')
type StringProps<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};`}
      </CodeBlock>

      <InfoBox variant="tip" title="Key Remapping with 'as'">
        TypeScript 4.1 added key remapping in mapped types. The <code>as</code> clause
        lets you filter or rename keys during mapping &mdash; extremely powerful for
        building API response transformers and form helpers.
      </InfoBox>

      {/* ── 2. Conditional Types ── */}
      <h2>Conditional Types</h2>
      <p>
        Conditional types follow the pattern <code>T extends U ? X : Y</code>.
        They act like ternary expressions at the type level &mdash; choosing one
        branch or another based on whether a type relationship holds.
      </p>

      <CodeBlock language="typescript" title="Simple Conditional Types">
{`type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">;  // true
type B = IsString<42>;       // false

type IsArray<T> = T extends any[] ? true : false;
type C = IsArray<string[]>;  // true
type D = IsArray<string>;    // false`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Distributive Conditional Types">
{`// When T is a union, conditional types distribute
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>;
// string[] | number[]  (NOT (string | number)[])

// Prevent distribution by wrapping in a tuple
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]`}
      </CodeBlock>

      <InfoBox variant="warning" title="Distribution Gotcha">
        Distributive conditional types only apply when the checked type is a
        naked type parameter. Wrapping in a tuple suppresses distribution.
      </InfoBox>

      {/* ── 3. The infer Keyword ── */}
      <h2>The infer Keyword</h2>
      <p>
        The <code>infer</code> keyword lets you extract types from within
        conditional type checks. Think of it as pattern-matching: you describe
        the shape and let TypeScript fill in the blanks.
      </p>

      <CodeBlock language="typescript" title="Extracting Types with infer">
{`// Unwrap a Promise to get the resolved type
type UnpackPromise<T> = T extends Promise<infer U> ? U : T;
type X = UnpackPromise<Promise<string>>;  // string
type Y = UnpackPromise<number>;           // number

// Get the return type of a function
type GetReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
type Ret = GetReturnType<() => boolean>;  // boolean

// Get the first element of a tuple
type FirstElement<T> = T extends [infer F, ...any[]] ? F : never;
type First = FirstElement<[string, number, boolean]>;  // string`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Multiple infer Positions">
{`type FuncParts<T> = T extends (arg: infer P) => infer R
  ? { param: P; return: R } : never;

type Parts = FuncParts<(x: string) => number>;
// { param: string; return: number }`}
      </CodeBlock>

      {/* ── 4. Template Literal Types ── */}
      <h2>Template Literal Types</h2>
      <p>
        Template literal types bring string interpolation to the type system.
        They let you construct string types from other types, enabling
        precise typing for routes, events, CSS values, and more.
      </p>

      <CodeBlock language="typescript" title="API Route and Event Patterns">
{`// API route typing
type ApiRoute = \`/api/\${string}\`;
const valid: ApiRoute = "/api/users";  // OK

// Event name pattern
type EventName = \`on\${Capitalize<string>}\`;
const click: EventName = "onClick";    // OK

// CSS unit types
type CSSLength = \`\${number}px\` | \`\${number}rem\` | \`\${number}em\`;
const size: CSSLength = "16px";        // OK`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Combining Template Literals with Mapped Types">
{`type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

interface Person { name: string; age: number }
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }`}
      </CodeBlock>

      {/* ── 5. Recursive Types ── */}
      <h2>Recursive Types</h2>
      <p>
        Types can reference themselves, allowing you to model infinitely nested
        structures like JSON, trees, and deeply nested configurations.
      </p>

      <CodeBlock language="typescript" title="Recursive Type Examples">
{`// JSON type
type Json =
  | string | number | boolean | null
  | Json[]
  | { [key: string]: Json };

// Deep Readonly
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

// Deep Partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Tree structure
type TreeNode<T> = { value: T; children: TreeNode<T>[] };`}
      </CodeBlock>

      {/* ── 6. Discriminated Unions Advanced ── */}
      <h2>Discriminated Unions &mdash; Advanced</h2>
      <p>
        Complex discriminated unions model state machines and multi-step
        workflows. Combined with exhaustive checking via <code>never</code>,
        they make illegal states unrepresentable.
      </p>

      <CodeBlock language="typescript" title="State Machine with Discriminated Unions">
{`type State =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "success"; data: string }
  | { status: "error"; error: Error };

function handleState(state: State): string {
  switch (state.status) {
    case "idle":    return "Waiting...";
    case "loading": return \`Loading since \${state.startedAt}\`;
    case "success": return state.data;
    case "error":   return \`Error: \${state.error.message}\`;
    default:
      const _exhaustive: never = state;
      return _exhaustive;
  }
}`}
      </CodeBlock>

      <FlowChart
        title="State Machine Flow"
        chart={"stateDiagram-v2\n  [*] --> Idle\n  Idle --> Loading : fetch\n  Loading --> Success : data received\n  Loading --> Error : request failed\n  Error --> Loading : retry\n  Success --> [*]"}
      />

      <InfoBox variant="info" title="Exhaustive Checking">
        Assigning to <code>never</code> in the default branch ensures that
        adding a new variant later causes a compile error at every unhandled switch.
      </InfoBox>

      {/* ── 7. The satisfies Operator ── */}
      <h2>The satisfies Operator</h2>
      <p>
        Added in TypeScript 4.9, <code>satisfies</code> validates that a value
        matches a type without widening it. This preserves literal types and
        autocompletion while still catching mistakes.
      </p>

      <CodeBlock language="typescript" title="satisfies vs Type Annotation">
{`type Colors = Record<string, string | string[]>;

// With type annotation - loses literal info
const colorsAnnotated: Colors = {
  primary: "#0ff",
  secondary: ["#f00", "#0f0"],
};
// colorsAnnotated.primary is string | string[]

// With satisfies - keeps literal types!
const colors = {
  primary: "#0ff",
  secondary: ["#f00", "#0f0"],
} satisfies Colors;

colors.primary.toUpperCase();       // OK - knows it's string
colors.secondary.map(c => c);       // OK - knows it's string[]`}
      </CodeBlock>

      {/* ── 8. using Declarations ── */}
      <h2>using Declarations</h2>
      <p>
        TypeScript 5.2 introduced <code>using</code> for deterministic resource
        cleanup. Resources are automatically disposed when they go out of scope.
      </p>

      <CodeBlock language="typescript" title="Resource Management with using">
{`class DatabaseConnection implements Disposable {
  constructor(private url: string) {
    console.log("Connected to", url);
  }
  query(sql: string) { /* ... */ }

  [Symbol.dispose]() {
    console.log("Connection closed");
  }
}

function runQuery() {
  using db = new DatabaseConnection("postgres://localhost");
  db.query("SELECT * FROM users");
  // db is automatically disposed when runQuery() exits
}

// Async version
async function processFile() {
  await using handle = new FileHandle();
  // handle is disposed when this function completes
}`}
      </CodeBlock>

      {/* ── 9. Decorators ── */}
      <h2>Decorators</h2>
      <p>
        TypeScript 5.0 shipped native support for Stage 3 decorators,
        following the TC39 standard without extra compiler flags.
      </p>

      <CodeBlock language="typescript" title="Class and Method Decorators">
{`// Method decorator - logging
function log(target: any, context: ClassMethodDecoratorContext) {
  const name = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(\`Calling \${name} with\`, args);
    return target.apply(this, args);
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}`}
      </CodeBlock>

      {/* ── 10. Module Augmentation ── */}
      <h2>Module Augmentation</h2>
      <p>
        Module augmentation lets you extend types from third-party libraries
        without modifying their source.
      </p>

      <CodeBlock language="typescript" title="Augmenting Third-Party Types">
{`// Extend Express Request with custom fields
declare module "express" {
  interface Request {
    userId?: string;
    role?: "admin" | "user";
  }
}

// Extend the global Window
declare global {
  interface Window {
    analytics: { track: (event: string, data?: object) => void };
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="File Must Be a Module">
        For module augmentation to work, the file must contain at least one
        top-level import or export. Otherwise the declarations become global.
      </InfoBox>

      {/* ── 11. Branded / Opaque Types ── */}
      <h2>Branded / Opaque Types</h2>
      <p>
        TypeScript uses structural typing, so two identical shapes are
        interchangeable. Branded types add a phantom property to create
        nominal-like distinctions.
      </p>

      <CodeBlock language="typescript" title="The Branded Type Pattern">
{`type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;

// Constructor functions
function UserId(id: string): UserId { return id as UserId; }
function OrderId(id: string): OrderId { return id as OrderId; }

function getUser(id: UserId) { /* ... */ }
function getOrder(id: OrderId) { /* ... */ }

const uid = UserId("user-123");
const oid = OrderId("order-456");

getUser(uid);  // OK
getOrder(oid); // OK
// getUser(oid);         // Error! OrderId !== UserId
// getUser("raw-string"); // Error! string !== UserId`}
      </CodeBlock>

      {/* ── 12. Type-Level Programming ── */}
      <h2>Type-Level Programming</h2>
      <p>
        TypeScript&apos;s type system is Turing-complete. You can encode complex
        logic at the type level to enforce constraints without runtime checks.
      </p>

      <CodeBlock language="typescript" title="Type-Safe Builder Pattern">
{`type BuilderState = { host: boolean; port: boolean; db: boolean };
type Initial = { host: false; port: false; db: false };

class ConnBuilder<S extends BuilderState> {
  private config: Record<string, unknown> = {};

  setHost(h: string): ConnBuilder<S & { host: true }> {
    this.config.host = h;
    return this as any;
  }
  setPort(p: number): ConnBuilder<S & { port: true }> {
    this.config.port = p;
    return this as any;
  }
  setDb(db: string): ConnBuilder<S & { db: true }> {
    this.config.db = db;
    return this as any;
  }
  // build() only available when all fields are set
  build(this: ConnBuilder<{ host: true; port: true; db: true }>): string {
    return JSON.stringify(this.config);
  }
}

const conn = new ConnBuilder<Initial>()
  .setHost("localhost").setPort(5432).setDb("mydb")
  .build(); // OK - all fields set

// new ConnBuilder<Initial>().setHost("localhost").build();
// Error! port and db not set`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Type-Safe State Machine">
{`type Transitions = {
  idle: "loading";
  loading: "success" | "error";
  success: never;
  error: "loading";
};

function transition<
  From extends keyof Transitions,
  To extends Transitions[From]
>(from: From, to: To): To {
  return to;
}

transition("idle", "loading");     // OK
transition("loading", "error");    // OK
// transition("idle", "success");  // Error!`}
      </CodeBlock>

      {/* ── 13. Variance Annotations ── */}
      <h2>Variance Annotations</h2>
      <p>
        TypeScript 4.7 added <code>in</code> and <code>out</code> keywords
        to declare whether a type parameter is covariant, contravariant,
        or invariant.
      </p>

      <CodeBlock language="typescript" title="Variance with in / out Keywords">
{`// out = covariant (producer)
interface Producer<out T> { get(): T; }

// in = contravariant (consumer)
interface Consumer<in T> { accept(value: T): void; }

// in out = invariant (both read and write)
interface Collection<in out T> {
  get(): T;
  add(value: T): void;
}
// Producer<Dog> assignable to Producer<Animal> (covariance)
// Consumer<Animal> assignable to Consumer<Dog> (contravariance)`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Use Variance Annotations">
        These are most useful in library code where you want to enforce correct
        usage patterns and produce clearer error messages.
      </InfoBox>

      {/* ── 14. Performance Tips ── */}
      <h2>Performance Tips</h2>
      <p>
        Complex types can slow down the editor and increase compile times.
        Keep your type system fast with these strategies.
      </p>

      <CodeBlock language="typescript" title="Performance Best Practices">
{`// 1. Prefer interface over complex mapped types
// Slow: type UserProps = { [K in keyof User]: User[K] };
// Fast:
interface UserProps extends User {}

// 2. Limit recursive type depth
type DeepReadonly<T, Depth extends number = 5> =
  Depth extends 0 ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K]> };

// 3. Profile slow types with --generateTrace
// npx tsc --generateTrace ./trace-output

// 4. Break complex types into named intermediates
type HandleA<T> = T extends A ? X : never;
type HandleB<T> = T extends B ? Y : never;
type Good<T> = HandleA<T> | HandleB<T>;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Type Instantiation Depth">
        TypeScript has a recursion limit of ~50 levels for type instantiation.
        If you hit &quot;Type instantiation is excessively deep and possibly infinite&quot;,
        add a depth counter to your recursive type or simplify the structure.
      </InfoBox>

      {/* ── 15. Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What does the following conditional type resolve to?\n\ntype Result = string extends any ? 'yes' : 'no';"}
        options={[
          "'yes'",
          "'no'",
          "string",
          "'yes' | 'no'",
        ]}
        correctIndex={0}
        explanation={"string extends any is always true, so the conditional resolves to 'yes'. The extends keyword checks if the left side is assignable to the right side, and every type is assignable to any."}
        language="typescript"
      />

      <InteractiveChallenge
        question={"What type does TemplateName produce?\n\ntype TemplateName = `on${Capitalize<'click' | 'hover'>}`;"}
        options={[
          "'onClick' | 'onHover'",
          "'onclick' | 'onhover'",
          "'onCLICK' | 'onHOVER'",
          "string",
        ]}
        correctIndex={0}
        explanation={"Template literal types distribute over unions. Capitalize<'click' | 'hover'> becomes 'Click' | 'Hover'. Then the template produces 'onClick' | 'onHover'."}
        language="typescript"
      />

    </LessonLayout>
  );
}
