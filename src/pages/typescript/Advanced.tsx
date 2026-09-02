import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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

      <h3>The problem they exist to solve</h3>
      <p>
        Conditional types are usually introduced with a toy like{' '}
        <code>{'IsString<T>'}</code>, which nobody has ever needed. Here is a job you
        genuinely cannot do without them.
      </p>
      <p>
        You are writing a helper that unwraps a value: hand it a{' '}
        <code>{'Promise<User>'}</code> and it awaits it; hand it a plain{' '}
        <code>User</code> and it returns it as-is. Trivial at runtime. Now type the return
        value:
      </p>

      <CodeBlock language="typescript" title="Everything you know so far falls short">
{`declare const user: User;

// Attempt 1 — a union. Callers now have to narrow a value that is
// never actually ambiguous. You made THEM do work.
declare function unwrap1<T>(value: T | Promise<T>): T | Promise<T>;
const a = unwrap1(Promise.resolve(user));   // User | Promise<User>  ✗

// Attempt 2 — an overload. Works, but you write it again for every
// wrapper type, and the implementation signature is still a lie.
declare function unwrap2<T>(value: Promise<T>): T;
declare function unwrap2<T>(value: T): T;

// Attempt 3 — 'any'. Gives up.
declare function unwrap3(value: any): any;`}
      </CodeBlock>

      <p>
        What you actually want to say is a <em>rule</em>: &quot;if the incoming type is a
        Promise of something, the result is that something; otherwise the result is the
        incoming type unchanged.&quot; That is a branch, evaluated by the compiler, on a type
        you do not know yet. Nothing you have met so far can express it, because every tool
        so far describes a <em>fixed</em> shape. A conditional type is the language&apos;s{' '}
        <code>if</code> statement:
      </p>

      <CodeBlock language="typescript" title="The tool that fits">
{`type Unwrapped<T> = T extends Promise<infer U> ? U : T;

declare function unwrap<T>(value: T): Unwrapped<T>;

const a = unwrap(Promise.resolve(user));   // User   ✓
const b = unwrap(user);                    // User   ✓`}
      </CodeBlock>

      <p>
        (<code>infer U</code> means &quot;capture whatever the <code>Promise</code> is wrapping
        and call it <code>U</code>&quot;. It gets a full section two headings down &mdash; for
        now, read it as a blank the compiler fills in.)
      </p>
      <p>
        One line, works for any type, no overloads to maintain. That is the shape of every
        good use of conditional types: a <em>relationship</em> between an input type and an
        output type that no fixed annotation can capture. Keep that framing as you read the
        mechanics below &mdash; if a conditional type is not expressing a relationship, it is
        probably not earning its complexity.
      </p>

      <h3>The mechanics</h3>
      <p>
        The pattern is <code>T extends U ? X : Y</code>: a ternary at the type level. And{' '}
        <code>extends</code> means what it meant in the Generics lesson &mdash;{' '}
        <strong>&quot;is assignable to&quot;</strong>. The only difference is that there it
        was a <em>requirement</em> the compiler enforced, and here it is a{' '}
        <em>question</em> the compiler answers.
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

      <h3>What &quot;distributes&quot; actually means</h3>
      <p>
        That result surprises everyone the first time. <code>{'ToArray<string | number>'}</code>{' '}
        looks like it should substitute the union in and give{' '}
        <code>{'(string | number)[]'}</code>. Instead it gives{' '}
        <code>{'string[] | number[]'}</code>. Here is the rule that produces it.
      </p>
      <p>
        When the type being tested is a <strong>bare type parameter</strong> &mdash; just{' '}
        <code>T</code>, not <code>T[]</code> or <code>[T]</code> or{' '}
        <code>{'Promise<T>'}</code> &mdash; and you hand it a union, the compiler does not
        evaluate the conditional once. It <em>splits the union apart, evaluates the
        conditional separately for each member, and unions the results back together</em>:
      </p>

      <CodeBlock language="text" title="Distribution, step by step — a derivation, not compilable code">
{`type ToArray<T> = T extends unknown ? T[] : never;

ToArray<string | number>
  → ToArray<string> | ToArray<number>     // 1. split the union
  → (string extends unknown ? string[] : never)
    | (number extends unknown ? number[] : never)
                                          // 2. evaluate each branch
  → string[] | number[]                   // 3. union the results

// Wrap either side in a tuple and the parameter is no longer "bare",
// so no split happens and the union goes in whole:
type ToArrayND<T> = [T] extends [unknown] ? T[] : never;
ToArrayND<string | number>  →  (string | number)[]`}
      </CodeBlock>

      <InfoBox variant="tip" title="This Is Not a Quirk — It Is How the Utility Types Work">
        <p>
          Distribution is the entire mechanism behind the union-filtering utilities you
          already use. <code>{'Exclude<T, U>'}</code> is literally{' '}
          <code>T extends U ? never : T</code>. Run it on a union and watch:
        </p>
        <CodeBlock language="text" title="Exclude is one line, and distribution does the work — a derivation, not compilable code">
{`Exclude<"a" | "b" | "c", "b">
  → ("a" extends "b" ? never : "a")     // "a"
    | ("b" extends "b" ? never : "b")   // never
    | ("c" extends "b" ? never : "c")   // "c"
  → "a" | never | "c"
  → "a" | "c"        // never vanishes from a union — it contributes no members`}
        </CodeBlock>
        <p>
          Note the last step: <code>never</code> is the empty set, so adding it to a union
          adds nothing. That is why <code>never</code> is the &quot;delete this member&quot;
          value in every filtering type, including the{' '}
          <code>{'[K in keyof T as ... ? K : never]'}</code> key-remapping trick above.
        </p>
      </InfoBox>

      <InfoBox variant="danger" title="The never Trap Everyone Hits Once">
        <p>
          Distribution splits a union into its members and evaluates each one. So what happens
          when the union has <em>no</em> members?
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0">
{`type IsNever<T> = T extends never ? true : false;

type A = IsNever<string>;   // false   ✓ as expected
type B = IsNever<never>;    // never   ✗ — not 'true'!

// Zero members to iterate → zero results → the empty union → never.
// The conditional never ran at all.

// Fix: switch off distribution by wrapping both sides.
type IsNeverFixed<T> = [T] extends [never] ? true : false;
type C = IsNeverFixed<never>;   // true   ✓`}
        </CodeBlock>
        <p>
          The same trap hits any conditional you feed a possibly-<code>never</code> type: it
          silently returns <code>never</code> instead of taking a branch, and because{' '}
          <code>never</code> is assignable to everything, the wrong result usually does not
          error where you would notice. If a conditional type is mysteriously producing{' '}
          <code>never</code>, check whether its input can be <code>never</code> and reach for
          the <code>[T]</code> wrapper.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Deciding Which One You Want">
        <p>
          Ask what the type means for a union input. &quot;Transform each member&quot;
          (<code>Exclude</code>, <code>Extract</code>, <code>NonNullable</code>) wants
          distribution &mdash; leave <code>T</code> bare. &quot;Ask one question about the
          union as a whole&quot; (is this exactly <code>never</code>? is this{' '}
          <em>every</em> member a string?) does not &mdash; wrap it in <code>[T]</code>. The
          tuple brackets are not a magic incantation; they simply stop <code>T</code> from
          being the bare thing on the left.
        </p>
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
        <code>using</code> gives you deterministic resource cleanup: the resource is disposed
        automatically when it goes out of scope. TypeScript shipped support for it in 5.2, but
        this is <strong>not a TypeScript feature</strong> — it is TC39&apos;s Explicit Resource
        Management proposal, which reached Stage 4 and is slated for ECMAScript 2027. That
        distinction matters practically: it is real JavaScript syntax, V8 already ships it (it
        runs unmodified on Node 25 with no flag), and the semantics below are the language&apos;s,
        not the compiler&apos;s. TypeScript&apos;s only additions are the <code>Disposable</code>{' '}
        and <code>AsyncDisposable</code> types and a downlevel emit for older targets.
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

// 3. Deferred setup via addInitializer — runs ONCE, immediately after the
//    class definition is finalized, with 'this' bound to the CLASS itself.
function sealed(target: Function, context: ClassDecoratorContext) {
  context.addInitializer(function () {
    Object.seal(this);  // seals the constructor — 'this' is not an instance
  });
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Class Decorators Run Once, Not Per Instance">
        <p>
          A class decorator fires a single time, when the <code>class</code> statement is
          evaluated &mdash; not on every <code>new</code>. Its{' '}
          <code>context.addInitializer()</code> does <em>not</em> change that: the callback
          runs once more, right after the class definition is finalised, with{' '}
          <code>this</code> bound to the <strong>class</strong>. That is the hook for
          registering the class somewhere (<code>customElements.define(tag, this)</code>).
        </p>
        <p>
          For per-instance work you need a <em>member</em> decorator instead. A field,
          method, getter, setter, or accessor decorator&apos;s{' '}
          <code>addInitializer()</code> runs once per instance during construction, with{' '}
          <code>this</code> bound to the instance &mdash; which is exactly what the
          validation example below depends on.
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

      <h3>Import Attributes — Typing a Non-JS Import Directly</h3>
      <p>
        Before TS 5.3, importing a JSON file needed <code>resolveJsonModule</code> and gave the
        compiler no way to know <em>what kind</em> of module was being pulled in &mdash; it just
        trusted the <code>.json</code> extension. <code>import ... with {'{'} type: ... {'}'}</code>{' '}
        is the standard TC39 syntax for stating that explicitly at the import site, and TS 5.3
        type-checks it:
      </p>
      <CodeBlock language="typescript" title="Verified on TypeScript 6.0 / Node 25 — real output">
{`// data.json: { "name": "example-config", "version": 1 }
import config from "./data.json" with { type: "json" };

console.log(config);
// { name: 'example-config', version: 1 }`}
      </CodeBlock>
      <InfoBox variant="warning" title="Not the Same as the Old resolveJsonModule">
        <p>
          <code>resolveJsonModule</code> is a TypeScript-only convenience that infers a type from
          the file&apos;s shape and needs no special import syntax, but it does not exist as a
          real JS feature &mdash; a plain <code>import config from &quot;./data.json&quot;</code>{' '}
          with no attribute only runs under bundlers that added their own JSON support.{' '}
          <code>with {'{'} type: &quot;json&quot; {'}'}</code> is the opposite: an actual runtime
          instruction (Node and browsers both honor it directly), and TypeScript is just
          type-checking syntax that already means something on its own. Use{' '}
          <code>resolveJsonModule</code> in a bundler-driven app for convenience; use import
          attributes when the code needs to run unbundled, e.g. directly under Node.
        </p>
      </InfoBox>

      <h3>import defer — Typed Ahead of Runtime Support</h3>
      <p>
        TS 5.9 added type-checking for the Stage 3 <code>import defer</code> proposal: it parses a
        module&apos;s exports and types them normally, but defers actually <em>running</em> the
        module&apos;s top-level code until the first property access on the namespace &mdash;
        useful for an expensive module (a large parser, a wasm loader) that a given code path might
        never touch.
      </p>
      <CodeBlock language="typescript" title="Compiles clean on TypeScript 6.0 — but does not run yet">
{`import defer * as heavy from "./heavy-module.js";

console.log("module not evaluated yet");
console.log("first access triggers evaluation:", heavy.value);`}
      </CodeBlock>
      <InfoBox variant="danger" title="tsc Accepts It, Node Does Not — Verified, Not Assumed">
        <p>
          The snippet above passes <code>tsc --noEmit</code> with zero errors. Running it under
          Node 25.2.1 throws <code>SyntaxError: Unexpected token &apos;*&apos;</code> immediately
          &mdash; the JS engine itself has no <code>import defer</code> support yet, and{' '}
          <code>node --help</code> has no experimental flag for it either. This is a real gap
          between what TypeScript 5.9 type-checks and what today&apos;s runtimes execute: treat any
          brand-new TC39 proposal TypeScript adds support for as &quot;syntax-valid&quot; only
          until you have separately confirmed your actual deployment target (Node version, browser
          matrix) runs it.
        </p>
      </InfoBox>

      {/* ── 10. Module Augmentation ── */}
      <h2>Module Augmentation</h2>
      <p>
        Module augmentation lets you extend types from third-party libraries
        without modifying their source.
      </p>

      <CodeBlock language="typescript" title="Augmenting Third-Party Types">
{`import "@tanstack/react-query";
import "express";

// 1. Module augmentation — merges into an interface the module EXPORTS.
//    The module specifier must be exactly what you would import.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: { code: string; message: string };
  }
}

// 2. Global namespace augmentation — what Express actually needs.
//    Request is declared on the global 'Express' namespace, not exported
//    from "express", so 'declare module "express"' will NOT reach it.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      role?: "admin" | "user";
    }
  }
}

// 3. Extend a global interface from lib.dom
declare global {
  interface Window {
    analytics: { track: (event: string, data?: object) => void };
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="File Must Be a Module — And You Must Target the Right Thing">
        <p>
          For <code>declare module</code> / <code>declare global</code> to augment rather than
          shadow, the file must contain at least one top-level import or export. Otherwise the
          declarations become plain globals and <code>declare global</code> is an error.
        </p>
        <p>
          The second half of getting this right is aiming at the correct declaration.{' '}
          <code>declare module &quot;X&quot;</code> merges into what module <code>X</code>{' '}
          exports; it cannot reach a type that <code>X</code> only declares in the global scope.
          Express is the classic trap &mdash; its <code>Request</code> lives on a global{' '}
          <code>Express</code> namespace, so it needs form 2 above, not form 1.
        </p>
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
{`type Field = "host" | "port" | "db";

class ConnBuilder<Missing extends Field = Field> {
  // Phantom field. Never assigned at runtime — 'declare' emits nothing.
  // Without it the type parameter is invisible to assignability checks
  // and the whole pattern silently stops working. See the note below.
  declare private readonly __missing: Missing;

  private config: Record<string, unknown> = {};

  setHost(h: string) {
    this.config.host = h;
    return this as unknown as ConnBuilder<Exclude<Missing, "host">>;
  }
  setPort(p: number) {
    this.config.port = p;
    return this as unknown as ConnBuilder<Exclude<Missing, "port">>;
  }
  setDb(db: string) {
    this.config.db = db;
    return this as unknown as ConnBuilder<Exclude<Missing, "db">>;
  }

  // build() is callable only when nothing is still missing
  build(this: ConnBuilder<never>): string {
    return JSON.stringify(this.config);
  }
}

const conn = new ConnBuilder()
  .setHost("localhost").setPort(5432).setDb("mydb")
  .build(); // OK — nothing missing

// new ConnBuilder().setHost("localhost").build();
// Error: The 'this' context of type 'ConnBuilder<"port" | "db">' is not
//        assignable to method's 'this' of type 'ConnBuilder<never>'.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why the Phantom Field Is Not Optional">
        <p>
          Track the state as the set of keys still <em>missing</em>, not as boolean flags. An
          intersection like <code>{'{ host: false } & { host: true }'}</code> collapses to{' '}
          <code>never</code>, and <code>never</code> is assignable to <code>true</code> &mdash; so a
          flag-based builder happily accepts a half-built object.
        </p>
        <p>
          The phantom field matters just as much. If <code>Missing</code> appears only inside{' '}
          <code>Exclude&lt;...&gt;</code> in return positions, TypeScript cannot measure the
          type parameter&apos;s variance, falls back to a structural (and effectively bivariant)
          comparison of the two instantiations, and <code>build()</code> compiles on an
          incomplete builder with no error at all. Giving <code>Missing</code> one ordinary
          property position makes the check real.
        </p>
      </InfoBox>

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
      <h2>Variance</h2>
      <p>
        &quot;Covariant&quot; and &quot;contravariant&quot; are two words that get dropped into
        TypeScript discussions constantly and explained almost never. The concept underneath
        is small, and once you have it you can predict assignability errors around functions
        and generics instead of guessing at them. It is also a standard senior interview
        question.
      </p>

      <h3>The question variance answers</h3>
      <p>
        You know <code>Dog</code> is assignable to <code>Animal</code>. Variance asks the
        follow-up: <strong>if <code>Dog</code> is assignable to <code>Animal</code>, what
        happens to <code>{'Box<Dog>'}</code> and <code>{'Box<Animal>'}</code>?</strong> There
        are only three possible answers, and which one you get is decided entirely by{' '}
        <em>where <code>T</code> appears</em> inside <code>Box</code>.
      </p>

      <CodeBlock language="typescript" title="Case 1: T only comes OUT — covariant">
{`interface Animal { name: string }
interface Dog extends Animal { breed: string }

type Producer<T> = () => T;          // T appears only in the RETURN position

declare const dogFactory: Producer<Dog>;

const p: Producer<Animal> = dogFactory;   // ✓ OK
// Anyone expecting "a function that gives me an Animal" is perfectly
// served by one that gives Dogs. Every Dog is an Animal.

declare const animalFactory: Producer<Animal>;
const q: Producer<Dog> = animalFactory;
// error TS2322: Type 'Producer<Animal>' is not assignable to type 'Producer<Dog>'.
//   Property 'breed' is missing in type 'Animal' but required in type 'Dog'.
// Correct: the caller expects breed, and a generic Animal may not have one.`}
      </CodeBlock>

      <p>
        <code>Producer</code> preserved the direction: <code>Dog → Animal</code> gave{' '}
        <code>{'Producer<Dog>'} → {'Producer<Animal>'}</code>. That is{' '}
        <strong>covariance</strong> &mdash; &quot;varies with&quot;. Producers are covariant.
      </p>

      <CodeBlock language="typescript" title="Case 2: T only goes IN — contravariant, and the direction flips">
{`type Consumer<T> = (value: T) => void;   // T appears only as a PARAMETER

declare const handleAnyAnimal: Consumer<Animal>;   // reads only .name

const c: Consumer<Dog> = handleAnyAnimal;   // ✓ OK — and this is the surprise
// Somewhere expecting "a function I can hand a Dog to" is safely satisfied by
// one that accepts ANY Animal. It will be handed Dogs; it copes; it asked for
// less than it will receive.

const d: Consumer<Animal> = (dog: Dog) => console.log(dog.breed);
// error TS2322: Type '(dog: Dog) => void' is not assignable to type 'Consumer<Animal>'.
//   Types of parameters 'dog' and 'value' are incompatible.
//     Property 'breed' is missing in type 'Animal' but required in type 'Dog'.
// Correct: this callback will be handed cats, and it reads .breed.`}
      </CodeBlock>

      <p>
        <code>Consumer</code> <em>reversed</em> the direction: <code>Dog → Animal</code> gave{' '}
        <code>{'Consumer<Animal>'} → {'Consumer<Dog>'}</code>. That is{' '}
        <strong>contravariance</strong>, and it is the part people find unintuitive. The
        one-line intuition to keep:
      </p>

      <InfoBox variant="tip" title="Why Parameters Flip">
        <p>
          For a function to be a safe <em>substitute</em> for another, it must{' '}
          <strong>demand no more and promise no less</strong>.
        </p>
        <ul>
          <li>
            <strong>Return types promise.</strong> Promising something more specific than
            required is always fine. → covariant.
          </li>
          <li>
            <strong>Parameters demand.</strong> Demanding something more specific than you
            will be given is not fine; demanding <em>less</em> is. → contravariant.
          </li>
        </ul>
        <p>
          This is exactly the rule <code>strictFunctionTypes</code> enforces, and it is why
          reading a chain that says <em>&quot;Types of parameters are incompatible&quot;</em>{' '}
          followed by an assignment that looks backwards is not a compiler bug.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Case 3: T goes both ways — invariant">
{`interface Collection<T> {
  get(): T;              // out
  add(value: T): void;   // in
}
// Neither direction is safe, so neither is allowed. Collection<Dog> and
// Collection<Animal> are simply unrelated types.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Arrays Are Covariant, and That Is a Deliberate Hole">
        <p>
          <code>{'Array<T>'}</code> is read <em>and</em> written, so by the rules above it
          ought to be invariant. TypeScript makes it covariant anyway, because requiring
          invariance would reject an enormous amount of ordinary, almost-always-correct
          JavaScript. The cost is a genuine unsoundness you can trigger in four lines:
        </p>
        <CodeBlock language="typescript" title="No errors. Crashes at runtime.">
{`const dogs: Dog[] = [{ name: "Rex", breed: "lab" }];

const animals: Animal[] = dogs;      // allowed — arrays are covariant
animals.push({ name: "Whiskers" });  // allowed — it IS an Animal[]

dogs[1].breed.toUpperCase();
// TypeError: Cannot read properties of undefined (reading 'toUpperCase')
// 'dogs' and 'animals' are the same array. A cat is now in your Dog[].`}
        </CodeBlock>
        <p>
          Worth knowing not as trivia but as a boundary: the checker is a very good assistant,
          not a proof system. <code>readonly T[]</code> closes this particular hole, which is
          one more reason to prefer it for parameters you do not mutate.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Methods Are Bivariant — Another Deliberate Hole">
        <p>
          <code>strictFunctionTypes</code> only applies to function-<em>type</em> positions,
          not to methods declared with method shorthand. These two look equivalent and are
          checked differently:
        </p>
        <CodeBlock language="typescript" title="Same intent, different strictness">
{`interface A { handle(e: Animal): void }        // method shorthand → BIVARIANT
interface B { handle: (e: Animal) => void }    // property syntax  → contravariant

const a: A = { handle(d: Dog) { d.breed; } };  // ✓ compiles, unsound
const b: B = { handle: (d: Dog) => d.breed };  // ✗ error TS2322`}
        </CodeBlock>
        <p>
          The exemption exists so that <code>Array</code>, <code>Promise</code> and friends
          stay usable. In your own code, writing callbacks as{' '}
          <code>{'handler: (e: E) => void'}</code> rather than{' '}
          <code>{'handler(e: E): void'}</code> gets you the stricter check for free.
        </p>
      </InfoBox>

      <h3>Variance annotations (TypeScript 4.7+)</h3>
      <p>
        TypeScript infers all of the above automatically. The <code>in</code> and{' '}
        <code>out</code> keywords let you <em>state</em> the variance you intend, which does
        two things: it errors if the declaration ever stops matching, and it lets the compiler
        skip the structural comparison it would otherwise perform &mdash; a real speed-up in
        large type graphs.
      </p>

      <CodeBlock language="typescript" title="Variance with in / out Keywords">
{`// out = covariant (produces T)
interface Producer<out T> { get(): T }

// in = contravariant (consumes T)
interface Consumer<in T> { accept(value: T): void }

// in out = invariant (both)
interface Collection<in out T> {
  get(): T;
  add(value: T): void;
}

// Annotating wrongly is an error at the DECLARATION, not at some
// distant call site:
interface Broken<in T> { get(): T }
//               ~~~~
// error TS2636: Type 'Broken<super-T>' is not assignable to type
//               'Broken<sub-T>' as implied by variance annotation.
//   The types returned by 'get()' are incompatible between these types.
// (T is produced, so it is covariant — 'out', not 'in'.)`}
      </CodeBlock>

      <InfoBox variant="note" title="When to Reach for Them">
        <p>
          Almost never in application code &mdash; inference is correct and free. They pay off
          in library code and in large shared type packages, where an accidental variance
          change is a silent breaking change for consumers, and where the skipped structural
          checks measurably improve compile time.
        </p>
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

// 2. Limit recursive type depth — the counter must actually count DOWN.
//    Type-level decrement: index into a tuple of the preceding numbers.
type Prev = [never, 0, 1, 2, 3, 4, 5];
type DeepReadonly<T, Depth extends number = 5> =
  Depth extends 0
    ? T
    : { readonly [K in keyof T]: DeepReadonly<T[K], Prev[Depth]> };
//                                              ^^^^^^^^^^^^^^ pass Depth - 1.
// Forgetting this is the classic bug: the inner call re-defaults Depth to 5,
// 'Depth extends 0' is never true, and the "limit" limits nothing.

// 3. Profile slow types with --generateTrace
// npx tsc --generateTrace ./trace-output

// 4. Break complex types into named intermediates
type HandleA<T> = T extends A ? X : never;
type HandleB<T> = T extends B ? Y : never;
type Good<T> = HandleA<T> | HandleB<T>;`}
      </CodeBlock>

      <InfoBox variant="warning" title="Type Instantiation Depth">
        TypeScript bails out at an instantiation depth of <strong>100</strong> (or a total of
        5,000,000 instantiations in one check) and reports &quot;Type instantiation is
        excessively deep and possibly infinite.&quot; If you hit it, add a real depth counter
        to your recursive type &mdash; one that decrements, as above &mdash; or simplify the
        structure. Note that tail-recursive conditional types get a much higher budget, which
        is why <code>type Join&lt;T&gt;</code>-style accumulator patterns survive far deeper
        input than naive recursion does.
      </InfoBox>

      {/* ── 15. Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

    </LessonLayout>
  );
}
