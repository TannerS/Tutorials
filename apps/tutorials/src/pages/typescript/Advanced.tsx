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
        A decorator is a function that runs at <em>class-definition time</em> and can
        observe or replace the thing it is attached to. TypeScript 5.0 shipped native
        support for Stage 3 (TC39 standard) decorators &mdash; no compiler flag required.
        They are the mechanism behind Angular&apos;s <code>@Component</code>, NestJS&apos;s
        <code> @Injectable</code>, and TypeORM&apos;s <code>@Entity</code>.
      </p>

      <InfoBox variant="warning" title="Two Different Decorator Systems">
        <p>
          There are <strong>two incompatible</strong> decorator implementations, and code
          you find online may target either one.
        </p>
        <ul>
          <li>
            <strong>Legacy / experimental</strong> &mdash; requires
            <code> &quot;experimentalDecorators&quot;: true</code>. Signature:
            <code> (target, propertyKey, descriptor)</code>. This is what Angular,
            NestJS, and TypeORM still use today, and it is the only one that supports
            <code> &quot;emitDecoratorMetadata&quot;</code> (the reflection data DI containers rely on).
          </li>
          <li>
            <strong>Stage 3 / standard</strong> &mdash; the default in TS 5.0+ with no flag.
            Signature: <code>(value, context)</code>. This is the one that will ship in
            JavaScript itself.
          </li>
        </ul>
        <p>
          Turning on <code>experimentalDecorators</code> opts the whole project back into
          the legacy behaviour. Match whatever your framework expects; everything below
          is the modern Stage 3 form unless labelled otherwise.
        </p>
      </InfoBox>

      <h3>The context object</h3>
      <p>
        Every Stage 3 decorator receives the decorated value plus a{' '}
        <code>context</code> object describing what is being decorated.
      </p>
      <CodeBlock language="typescript" title="What every decorator gets handed">
{`type Context = {
  kind: "class" | "method" | "getter" | "setter" | "field" | "accessor";
  name: string | symbol;
  static: boolean;        // was it declared with 'static'?
  private: boolean;       // was it a #private member?
  access: { get?(obj): unknown; set?(obj, value): void };
  addInitializer(fn: () => void): void;  // run extra setup per instance
  metadata: Record<PropertyKey, unknown>;
};

// The specific context types TypeScript ships:
// ClassDecoratorContext, ClassMethodDecoratorContext,
// ClassGetterDecoratorContext, ClassSetterDecoratorContext,
// ClassFieldDecoratorContext, ClassAccessorDecoratorContext`}
      </CodeBlock>

      <h3>Method decorators</h3>
      <p>
        A method decorator receives the original method and may return a replacement.
        Return nothing to leave the method untouched (useful for pure registration).
      </p>
      <CodeBlock language="typescript" title="Logging and timing wrappers">
{`function log<T extends (...args: any[]) => any>(
  method: T,
  context: ClassMethodDecoratorContext,
): T {
  const name = String(context.name);
  return function (this: any, ...args: any[]) {
    console.log(\`-> \${name}(\`, args, ")");
    const result = method.apply(this, args);
    console.log(\`<- \${name} =\`, result);
    return result;
  } as T;
}

function timed<T extends (...args: any[]) => any>(
  method: T,
  context: ClassMethodDecoratorContext,
): T {
  return function (this: any, ...args: any[]) {
    const start = performance.now();
    try {
      return method.apply(this, args);
    } finally {
      console.log(\`\${String(context.name)} took \${performance.now() - start}ms\`);
    }
  } as T;
}

class Calculator {
  @log
  @timed
  add(a: number, b: number): number {
    return a + b;
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Evaluation Order With Stacked Decorators">
        <p>
          Decorator <em>expressions</em> are evaluated top-to-bottom, but the decorators are{' '}
          <em>applied</em> bottom-to-top. Above, <code>@timed</code> wraps{' '}
          <code>add</code> first, then <code>@log</code> wraps that &mdash; so at call time
          the log output is the outermost layer. Think of it as function composition:
          <code> log(timed(add))</code>.
        </p>
      </InfoBox>

      <h3>Decorator factories &mdash; decorators that take arguments</h3>
      <p>
        <code>@log</code> is a decorator. <code>@retry(3)</code> is a <em>decorator factory</em>:
        a function you call, which returns the actual decorator. That extra layer is how a
        decorator receives configuration.
      </p>
      <CodeBlock language="typescript" title="A configurable retry decorator">
{`function retry(attempts: number, delayMs = 100) {
  // The factory captures the config...
  return function <T extends (...args: any[]) => Promise<any>>(
    method: T,
    context: ClassMethodDecoratorContext,
  ): T {
    // ...and returns the real decorator.
    return async function (this: any, ...args: any[]) {
      let lastError: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await method.apply(this, args);
        } catch (err) {
          lastError = err;
          console.warn(\`\${String(context.name)} failed, retry \${i + 1}/\${attempts}\`);
          await new Promise(r => setTimeout(r, delayMs * 2 ** i)); // backoff
        }
      }
      throw lastError;
    } as T;
  };
}

class ApiClient {
  @retry(3, 200)
  async fetchUser(id: string): Promise<User> {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }
}`}
      </CodeBlock>

      <h3>Class decorators &mdash; replacing the constructor</h3>
      <CodeBlock language="typescript" title="Observe, register, or replace the whole class">
{`// 1. Pure side effect — register the class somewhere, return nothing
const registry = new Map<string, unknown>();

function component(tag: string) {
  return function (target: Function, context: ClassDecoratorContext) {
    registry.set(tag, target);
  };
}

// 2. Replace the class — return a subclass
function withTimestamp<T extends new (...args: any[]) => object>(
  target: T,
  context: ClassDecoratorContext,
) {
  return class extends target {
    createdAt = new Date();
  };
}

@component("user-card")
class UserCard {
  constructor(public name: string) {}
}

// 3. Per-instance setup via addInitializer
function sealed(target: Function, context: ClassDecoratorContext) {
  context.addInitializer(function () {
    Object.seal(this);  // runs once per instance, after fields are set
  });
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Class Decorators Run Once, Not Per Instance">
        <p>
          A class decorator fires a single time, when the <code>class</code> statement is
          evaluated &mdash; not on every <code>new</code>. If you need per-instance work, use
          <code> context.addInitializer()</code>, which runs in the constructor for each
          instance created.
        </p>
      </InfoBox>

      <h3>Field, getter/setter, and auto-accessor decorators</h3>
      <CodeBlock language="typescript" title="The remaining decorator kinds">
{`// FIELD decorator: returns an initializer that transforms the initial value
function uppercase(_: undefined, context: ClassFieldDecoratorContext<any, string>) {
  return function (initialValue: string) {
    return initialValue.toUpperCase();
  };
}

// GETTER decorator: memoize an expensive computed property
function memoize<T>(getter: () => T, context: ClassGetterDecoratorContext) {
  const cache = new WeakMap<object, T>();
  return function (this: object): T {
    if (!cache.has(this)) cache.set(this, getter.call(this));
    return cache.get(this)!;
  };
}

// AUTO-ACCESSOR decorator: 'accessor' generates a getter/setter pair over a
// private field, and the decorator can intercept BOTH sides.
function observable<T>(
  target: ClassAccessorDecoratorTarget<any, T>,
  context: ClassAccessorDecoratorContext,
): ClassAccessorDecoratorResult<any, T> {
  return {
    get() { return target.get.call(this); },
    set(value: T) {
      console.log(\`\${String(context.name)} changed to\`, value);
      target.set.call(this, value);
    },
    init(initial: T) { return initial; },
  };
}

class Product {
  @uppercase sku = "abc-123";        // stored as "ABC-123"
  @observable accessor price = 9.99;  // logs every assignment

  @memoize
  get expensiveReport(): string { return heavyComputation(this); }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The accessor Keyword">
        <p>
          <code>accessor price = 9.99</code> is new syntax introduced alongside Stage 3
          decorators. It desugars to a private field plus a generated getter/setter,
          which is what gives a decorator a hook on reads <em>and</em> writes &mdash; a plain
          field decorator only sees the initial value.
        </p>
      </InfoBox>

      <h3>Practical pattern: validation decorators</h3>
      <CodeBlock language="typescript" title="Declarative validation, collected via metadata">
{`type Validator = (value: unknown) => string | null;

const validators = new WeakMap<object, Map<string, Validator[]>>();

function addValidator(context: any, fn: Validator) {
  context.addInitializer(function (this: object) {
    const proto = Object.getPrototypeOf(this);
    if (!validators.has(proto)) validators.set(proto, new Map());
    const map = validators.get(proto)!;
    const key = String(context.name);
    map.set(key, [...(map.get(key) ?? []), fn]);
  });
}

function required(_: any, context: ClassFieldDecoratorContext) {
  addValidator(context, v =>
    v === undefined || v === null || v === "" ? "is required" : null);
  return undefined;
}

function maxLength(n: number) {
  return function (_: any, context: ClassFieldDecoratorContext) {
    addValidator(context, v =>
      typeof v === "string" && v.length > n ? \`must be <= \${n} chars\` : null);
    return undefined;
  };
}

class SignupForm {
  @required @maxLength(50) email = "";
  @required @maxLength(72) password = "";
}`}
      </CodeBlock>

      <h3>Legacy decorators &mdash; what you will see in Angular and NestJS</h3>
      <p>
        Framework code you read at work almost certainly uses the older signature.
        It is worth being able to recognise it.
      </p>
      <CodeBlock language="typescript" title="Legacy signatures (experimentalDecorators: true)">
{`// tsconfig.json
// { "compilerOptions": {
//     "experimentalDecorators": true,
//     "emitDecoratorMetadata": true   // needed for DI by type
// } }

// Legacy METHOD decorator — mutates the property descriptor
function legacyLog(
  target: any,             // the prototype (or constructor, if static)
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(propertyKey, args);
    return original.apply(this, args);
  };
  return descriptor;
}

// Legacy PARAMETER decorator — the Stage 3 standard has NO equivalent.
// This is the hook that makes constructor-injection DI possible.
function Inject(token: string) {
  return function (target: any, key: string | undefined, index: number) {
    // record: "constructor arg #index of target needs 'token'"
  };
}

@Injectable()
class UserService {
  constructor(@Inject("HTTP") private http: HttpClient) {}
}`}
      </CodeBlock>

      <InfoBox variant="danger" title="No Parameter Decorators in the Standard">
        <p>
          Stage 3 decorators deliberately dropped parameter decorators. Any DI framework
          that injects by constructor parameter &mdash; Angular, NestJS, InversifyJS &mdash; therefore
          still requires <code>experimentalDecorators</code> today. Do not try to mix the
          two systems in one project: the flag is all-or-nothing.
        </p>
      </InfoBox>

      {/* ── 9b. Modules vs Namespaces ── */}
      <h2>Modules vs Namespaces</h2>
      <p>
        Before ES modules were standard, TypeScript shipped <code>namespace</code> as its own
        way to avoid polluting the global scope. Modules won. You still need to recognise
        namespaces because they appear throughout older codebases and in{' '}
        <code>.d.ts</code> files.
      </p>

      <CodeBlock language="typescript" title="The two mechanisms side by side">
{`// ── NAMESPACE (legacy) — merges into one global object ──
namespace Validation {
  export interface Validator { isValid(s: string): boolean; }

  const lettersOnly = /^[A-Za-z]+$/;   // not exported = private to the namespace

  export class LettersValidator implements Validator {
    isValid(s: string) { return lettersOnly.test(s); }
  }
}
// Nested and merged across files with /// <reference path="..." />
const v = new Validation.LettersValidator();

// ── MODULE (modern) — one file, one module, real imports ──
// validation.ts
export interface Validator { isValid(s: string): boolean; }
const lettersOnly = /^[A-Za-z]+$/;      // file-private automatically
export class LettersValidator implements Validator {
  isValid(s: string) { return lettersOnly.test(s); }
}

// consumer.ts
import { LettersValidator } from "./validation";`}
      </CodeBlock>

      <InfoBox variant="warning" title="Do Not Write New Namespaces">
        <p>
          Namespaces predate ES modules and are effectively deprecated for application
          code: they are not tree-shakeable, they break under{' '}
          <code>isolatedModules</code>, and every modern bundler is built around real
          imports. The one place they remain correct is inside declaration files, where{' '}
          <code>declare namespace</code> describes the shape of a global script-tag
          library or augments an existing global (as with <code>Express.Request</code>).
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Type-only imports and exports">
{`// 'import type' is erased entirely at compile time — no runtime import emitted.
import type { User } from "./models";
import { type Config, createClient } from "./client";  // inline type modifier

export type { User };
export { createClient };

// Why it matters:
// 1. Required by isolatedModules / esbuild / SWC, which compile file-by-file
//    and cannot tell whether an import is a type or a value.
// 2. Prevents accidental runtime imports that create circular dependencies
//    or pull a whole module into the bundle just for its types.`}
      </CodeBlock>

      <InfoBox variant="tip" title="verbatimModuleSyntax">
        <p>
          Setting <code>&quot;verbatimModuleSyntax&quot;: true</code> makes the rule explicit:
          any import without the <code>type</code> keyword is emitted as-is, and any import
          with it is dropped. No guessing by the compiler. It is the recommended setting
          for new projects and supersedes the older{' '}
          <code>importsNotUsedAsValues</code> and <code>preserveValueImports</code> flags.
        </p>
      </InfoBox>

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

      <InteractiveChallenge
        question={"In what order do these decorators wrap the method, and what runs first at call time?"}
        code={`class Service {
  @log
  @retry(3)
  async fetch() { /* ... */ }
}`}
        language="typescript"
        options={[
          "@log wraps first; @retry's logic runs first at call time",
          "@retry wraps first; @log's logic runs first at call time",
          "They apply in source order and run in source order",
          "Only the closest decorator (@retry) is applied",
        ]}
        correctIndex={1}
        explanation={"Decorator expressions evaluate top-to-bottom (so retry(3) is called before @log is read), but decorators are APPLIED bottom-to-top. @retry wraps fetch first, then @log wraps that result — equivalent to log(retry(3)(fetch)). Because @log is the outermost wrapper, its code runs first when the method is called."}
      />

      <InteractiveChallenge
        question={"Your team is adding NestJS to a TypeScript 5 project. NestJS injects dependencies through constructor parameters. What does the tsconfig need?"}
        options={[
          "Nothing — Stage 3 decorators are on by default in TS 5",
          "\"experimentalDecorators\": true and \"emitDecoratorMetadata\": true",
          "\"target\": \"ES2022\" only",
          "\"useDefineForClassFields\": false only",
        ]}
        correctIndex={1}
        explanation={"The Stage 3 standard decorators that TS 5 enables by default have no parameter decorators at all, and no metadata emit. Constructor-parameter injection therefore requires opting back into the legacy system with experimentalDecorators, plus emitDecoratorMetadata so the DI container can read parameter types via reflect-metadata. The flag is project-wide — you cannot mix the two decorator systems."}
      />

    </LessonLayout>
  );
}
