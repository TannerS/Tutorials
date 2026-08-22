import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Generics() {
  return (
    <LessonLayout
      title="Generics Deep Dive"
      sectionId="typescript"
      lessonIndex={3}
      prev={{ path: '/typescript/interfaces', label: 'Interfaces & Type Aliases' }}
      next={{ path: '/typescript/advanced', label: 'Advanced Types' }}
    >

      {/* ── Section 1: Why Generics ── */}
      <h2>Why Generics?</h2>
      <p>
        Without generics, you have two bad options: write a separate function for every type,
        or use <code>any</code> and lose all type safety. Generics give you the best of both
        worlds — reusable code that retains full type information.
      </p>

      <CodeBlock language="typescript" title="The Problem: any Loses Type Info">
{`// ❌ Option 1: Separate functions per type
function identityString(arg: string): string { return arg; }
function identityNumber(arg: number): number { return arg; }

// ❌ Option 2: Use any — compiles but no type safety
function identityAny(arg: any): any { return arg; }
const result = identityAny("hello");
// result is 'any' — TypeScript can't help you anymore
result.toFixed(2); // No error at compile time, crash at runtime!

// ✅ Option 3: Generics — reusable AND type-safe
function identity<T>(arg: T): T { return arg; }
const str = identity("hello");   // str: string
const num = identity(42);        // num: number
str.toFixed(2); // ✅ Compile error! TypeScript knows str is a string`}
      </CodeBlock>

      <FlowChart
        title="How Generics Preserve Type Information"
        chart={"graph LR\n  A[\"Input: string\"] --> B[\"identity&lt;string&gt;\"]\n  B --> C[\"Output: string\"]\n  D[\"Input: number\"] --> E[\"identity&lt;number&gt;\"]\n  E --> F[\"Output: number\"]\n  G[\"Input: any\"] --> H[\"identityAny\"]\n  H --> I[\"Output: any ❌\"]\n  style C fill:#10b981,color:#fff\n  style F fill:#10b981,color:#fff\n  style I fill:#ef4444,color:#fff"}
      />

      <InfoBox variant="tip" title="Type Inference">
        You usually do not need to explicitly pass the type parameter. TypeScript infers it
        from the argument: <code>identity(&quot;hello&quot;)</code> automatically
        sets <code>T = string</code>. You only need explicit type arguments when inference
        cannot determine the type — for example, when there are no arguments to infer from.
      </InfoBox>

      {/* ── Section 2: Generic Functions ── */}
      <h2>Generic Functions</h2>
      <p>
        A generic function declares one or more type parameters in angle brackets before the
        parameter list. The type parameter acts as a placeholder that gets filled in when the
        function is called.
      </p>

      <CodeBlock language="typescript" title="Function Declaration Syntax">
{`// Standard function declaration
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = firstElement([1, 2, 3]);       // n: number | undefined
const s = firstElement(["a", "b", "c"]); // s: string | undefined`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Arrow Function Syntax">
{`// Arrow function — note the trailing comma after T
// The comma disambiguates <T> from a JSX tag in .tsx files
const firstElement = <T,>(arr: T[]): T | undefined => {
  return arr[0];
};

// Multiple type parameters
const map = <T, U>(arr: T[], fn: (item: T) => U): U[] => {
  return arr.map(fn);
};

const lengths = map(["hello", "world"], (s) => s.length);
// lengths: number[]`}
      </CodeBlock>

      <InfoBox variant="warning" title="TSX Disambiguation">
        In <code>.tsx</code> files, the parser confuses <code>&lt;T&gt;</code> with a JSX
        opening tag. Use a trailing comma <code>&lt;T,&gt;</code> or
        extend <code>&lt;T extends unknown&gt;</code> to disambiguate. This is not needed
        in <code>.ts</code> files.
      </InfoBox>

      {/* ── Section 3: Generic Interfaces ── */}
      <h2>Generic Interfaces</h2>
      <p>
        Interfaces with type parameters let you define reusable shapes that work with
        different data types. This is one of the most common patterns in real-world TypeScript.
      </p>

      <CodeBlock language="typescript" title="Generic API Response">
{`interface ApiResponse<T> {
  data: T;
  error: string | null;
  loading: boolean;
  timestamp: number;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Usage — T is replaced with User
const response: ApiResponse<User> = {
  data: { id: 1, name: "Alice", email: "alice@example.com" },
  error: null,
  loading: false,
  timestamp: Date.now(),
};

// Works with any data type
const listResponse: ApiResponse<User[]> = {
  data: [{ id: 1, name: "Alice", email: "alice@example.com" }],
  error: null,
  loading: false,
  timestamp: Date.now(),
};`}
      </CodeBlock>

      {/* ── Section 4: Generic Type Aliases ── */}
      <h2>Generic Type Aliases</h2>
      <p>
        Type aliases support the same generic patterns as interfaces and are often preferred
        for union types, tuples, and utility types.
      </p>

      <CodeBlock language="typescript" title="Type Alias Generics">
{`// Result type — success or failure
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// Nullable wrapper
type Nullable<T> = T | null | undefined;

// Pair tuple
type Pair<A, B> = [A, B];

// Usage
const success: Result<User> = { ok: true, value: { id: 1, name: "Alice", email: "a@b.com" } };
const failure: Result<User> = { ok: false, error: new Error("Not found") };

const name: Nullable<string> = null; // valid
const coords: Pair<number, number> = [40.7, -74.0];`}
      </CodeBlock>

      {/* ── Section 5: Generic Classes ── */}
      <h2>Generic Classes</h2>
      <p>
        Classes with type parameters create reusable data structures that maintain type
        safety for their contents.
      </p>

      <CodeBlock language="typescript" title="Typed Stack">
{`class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numberStack = new Stack<number>();
numberStack.push(1);
numberStack.push(2);
const top = numberStack.pop(); // top: number | undefined

const stringStack = new Stack<string>();
stringStack.push("hello");
stringStack.push(42); // ✅ Compile error! Expected string`}
      </CodeBlock>

      {/* ── Section 6: Generic Constraints ── */}
      <h2>Generic Constraints</h2>
      <p>
        Start with the wall you hit without them. An unconstrained <code>T</code> could be{' '}
        <em>anything</em>, so the checker will not let you assume a single thing about it:
      </p>

      <CodeBlock language="typescript" title="The problem: T means 'literally any type'">
{`function logLength<T>(item: T) {
  console.log(item.length);
  //               ~~~~~~
  // error TS2339: Property 'length' does not exist on type 'T'.
}

function findById<T>(items: T[], id: number) {
  return items.find(item => item.id === id);
  //                             ~~
  // error TS2339: Property 'id' does not exist on type 'T'.
}`}
      </CodeBlock>

      <p>
        These errors are correct and worth sitting with. <code>T</code> is a promise{' '}
        <em>you</em> made to your callers: &quot;this works for every type&quot;. Someone will
        call <code>logLength(42)</code>, and numbers have no <code>length</code>. The compiler
        is holding you to the promise you wrote.
      </p>
      <p>
        A constraint is how you narrow that promise: <em>&quot;this works for every type{' '}
        <strong>that has</strong> a length&quot;</em>. You give up some callers and gain the
        right to use the members you asked for.
      </p>

      <InfoBox variant="warning" title="This &quot;extends&quot; Does Not Mean Inheritance">
        <p>
          The keyword is reused and the meaning is different. In{' '}
          <code>class Dog extends Animal</code>, <code>extends</code> means &quot;inherits
          from&quot;. In <code>{'<T extends { length: number }>'}</code> it means{' '}
          <strong>&quot;is assignable to&quot;</strong> &mdash; the same relation from the last
          two lessons, nothing more.
        </p>
        <p>
          That is why <code>{'logLength<string>'}</code> is legal even though{' '}
          <code>string</code> is a primitive that inherits from nothing you wrote: it is a
          structural check, not a lookup of a base class. Read{' '}
          <code>T extends U</code> as <em>&quot;every T is a valid U&quot;</em> everywhere it
          appears &mdash; in constraints here, and in the conditional types coming in the next
          lesson, where the same phrase becomes a question rather than a requirement.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Constraining with extends">
{`// T must have an 'id' property
interface HasId {
  id: number;
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id);
}

interface User { id: number; name: string; }
interface Product { id: number; price: number; }

const users: User[] = [{ id: 1, name: "Alice" }];
const products: Product[] = [{ id: 1, price: 9.99 }];

findById(users, 1);    // ✅ User has 'id'
findById(products, 1); // ✅ Product has 'id'
findById(["a", "b"], 1); // ❌ Error: string doesn't have 'id'`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Union Constraints">
{`// T must be string or number
function formatId<T extends string | number>(id: T): string {
  return \`ID-\${id}\`;
}

formatId(42);      // ✅ "ID-42"
formatId("abc");   // ✅ "ID-abc"
formatId(true);    // ❌ Error: boolean doesn't extend string | number

// T must have a length property
function logLength<T extends { length: number }>(item: T): void {
  console.log(item.length);
}

logLength("hello");    // ✅ string has length
logLength([1, 2, 3]);  // ✅ array has length
logLength(42);         // ❌ number has no length`}
      </CodeBlock>

      <InfoBox variant="tip" title="TS 5.0+: const Type Parameters — Inference Without the as const Everywhere">
        <p>
          Before TypeScript 5.0, a generic call over a literal like{' '}
          <code>{"identity('GET')"}</code> widened <code>T</code> to <code>string</code> unless
          the <em>caller</em> remembered to write <code>as const</code> at every call site. TS 5.0
          added a <code>const</code> modifier on the type parameter itself, which flips that
          default for every caller at once &mdash; no change needed at the call site.
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0 — the exact inferred types, not a guess">
{`function namedTuple<T extends readonly unknown[]>(...args: T): T {
  return args;
}
function namedTupleConst<const T extends readonly unknown[]>(...args: T): T {
  return args;
}

const a = namedTuple("a", "b", "c");
// inferred type: [string, string, string] — each literal widened to its base type

const b = namedTupleConst("a", "b", "c");
// inferred type: readonly ["a", "b", "c"] — literals preserved, marked readonly`}
        </CodeBlock>
        <p>
          It only changes <em>inference</em>, not what the type parameter is allowed to be —{' '}
          <code>const T</code> still needs its own <code>extends</code> clause if you want to
          constrain it, exactly like an ordinary type parameter. Reach for it on any generic
          function whose whole point is capturing the caller&apos;s literal values &mdash; tuple
          builders, event-name registries, config objects &mdash; the same jobs{' '}
          <code>as const</code> already does in the <em>const Assertions</em> lesson, just moved
          from every call site into the one function signature.
        </p>
      </InfoBox>

      {/* ── Section 7: keyof with Generics ── */}
      <h2>keyof with Generics</h2>

      <h3>Two operators you have been shown but never taught</h3>
      <p>
        <code>keyof</code> and <code>T[K]</code> appear all over TypeScript code (including
        earlier in this course, in <code>typeof STATUS[keyof typeof STATUS]</code>). They are
        both far simpler than they look, and everything in this section is just the two of
        them combined.
      </p>

      <CodeBlock language="typescript" title="keyof — the union of a type's keys">
{`interface User { id: number; name: string; active: boolean }

type UserKeys = keyof User;
// "id" | "name" | "active"      — a union of string literal types

// It is a TYPE-level operator. There is no runtime equivalent:
// Object.keys(user) gives you string[] at runtime and knows nothing
// about which keys are actually there.`}
      </CodeBlock>

      <CodeBlock language="typescript" title="T[K] — indexed access, or 'look up a property's type'">
{`type NameType = User["name"];        // string
type IdType   = User["id"];          // number

// Index with a union and you get a union back:
type Either = User["id" | "name"];   // number | string

// Index with keyof and you get every value type:
type AnyValue = User[keyof User];    // number | string | boolean`}
      </CodeBlock>

      <InfoBox variant="tip" title="Read T[K] Exactly Like Value-Level Property Access">
        <p>
          The syntax is deliberate. At the value level, <code>user[&quot;name&quot;]</code>{' '}
          gets you a value; at the type level, <code>User[&quot;name&quot;]</code> gets you
          that value&apos;s type. The bracket even works with a union in the same way a{' '}
          <code>switch</code> over several keys would.
        </p>
        <p>
          One trap: it is <code>User[&quot;name&quot;]</code>, never{' '}
          <code>User.name</code>. Dot notation <em>parses</em> fine &mdash; a dotted name in
          type position is how you reach into a namespace, as in{' '}
          <code>React.FC</code> &mdash; so this is not a syntax error but a checker error,
          and a helpfully specific one:{' '}
          <code>
            error TS2713: Cannot access &apos;User.name&apos; because &apos;User&apos; is a
            type, but not a namespace. Did you mean to retrieve the type of the property
            &apos;name&apos; in &apos;User&apos; with &apos;User[&quot;name&quot;]&apos;?
          </code>
        </p>
      </InfoBox>

      <p>
        Now combine them with a generic. <code>K extends keyof T</code> says &quot;K is one of
        T&apos;s keys&quot;, and <code>T[K]</code> says &quot;the type stored under that
        key&quot;. Together they give you property access that the compiler can verify:
      </p>

      <CodeBlock language="typescript" title="Type-Safe Property Access">
{`// K is constrained to be a key of T
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Alice", email: "alice@example.com" };

const name = getProperty(user, "name");   // name: string
const id = getProperty(user, "id");       // id: number
getProperty(user, "phone"); // ❌ Error: "phone" is not a key of user

// Type-safe setter
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}

setProperty(user, "name", "Bob");  // ✅
setProperty(user, "name", 42);    // ❌ Error: number not assignable to string

// Pluck multiple values
function pluck<T, K extends keyof T>(objs: T[], key: K): T[K][] {
  return objs.map(obj => obj[key]);
}

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
const names = pluck(users, "name"); // string[]
const ids = pluck(users, "id");     // number[]`}
      </CodeBlock>

      <InfoBox variant="info" title="Why keyof Matters">
        Without <code>keyof</code>, you would need to type <code>key</code> as <code>string</code>,
        which means TypeScript cannot verify the key exists or know the return type. The
        combination of <code>K extends keyof T</code> and <code>T[K]</code> gives you both
        key validation and automatic return type inference.
      </InfoBox>

      {/* ── Section 8: Generic Defaults ── */}
      <h2>Generic Defaults</h2>
      <p>
        Like function parameters, type parameters can have default values. This makes generics
        easier to use when a common type covers most cases.
      </p>

      <CodeBlock language="typescript" title="Default Type Parameters">
{`// Default T to string if not specified
interface Container<T = string> {
  value: T;
  label: string;
}

const strContainer: Container = { value: "hello", label: "greeting" };
const numContainer: Container<number> = { value: 42, label: "answer" };

// Event system with defaults
type EventHandler<TData = void> = (data: TData) => void;

const onClick: EventHandler = () => console.log("clicked");       // no data
const onSubmit: EventHandler<FormData> = (data) => console.log(data); // typed data

// Multiple defaults — defaults must come after non-default params
interface ApiConfig<TResponse = unknown, TError = Error> {
  url: string;
  onSuccess: (data: TResponse) => void;
  onError: (err: TError) => void;
}`}
      </CodeBlock>

      {/* ── Section 9: Multiple Type Parameters ── */}
      <h2>Multiple Type Parameters</h2>
      <p>
        When a function relates two or more independent types, use multiple type parameters.
        Follow naming conventions: <code>T</code>, <code>U</code> for abstract generics or
        descriptive names like <code>TKey</code>, <code>TValue</code> for clarity.
      </p>

      <CodeBlock language="typescript" title="Multiple Type Parameters">
{`// Transform one type to another
function transform<TInput, TOutput>(
  input: TInput,
  transformer: (value: TInput) => TOutput
): TOutput {
  return transformer(input);
}

const length = transform("hello", (s) => s.length);  // number
const upper = transform("hello", (s) => s.toUpperCase()); // string

// Typed key-value store
class TypedMap<TKey, TValue> {
  private store = new Map<TKey, TValue>();

  set(key: TKey, value: TValue): void {
    this.store.set(key, value);
  }

  get(key: TKey): TValue | undefined {
    return this.store.get(key);
  }
}

const userRoles = new TypedMap<number, string>();
userRoles.set(1, "admin");
userRoles.set("1", "admin"); // ❌ Error: string not assignable to number`}
      </CodeBlock>

      <InfoBox variant="tip" title="Naming Conventions">
        Use single letters (<code>T</code>, <code>U</code>, <code>K</code>, <code>V</code>)
        for simple generics. Use descriptive prefixed names
        (<code>TInput</code>, <code>TOutput</code>, <code>TKey</code>, <code>TValue</code>)
        when the meaning of each parameter is not obvious from context. Consistency within
        a codebase matters more than which convention you pick.
      </InfoBox>

      {/* ── Section 10: Generic Utility Patterns ── */}
      <h2>Generic Utility Patterns</h2>
      <p>
        These patterns appear constantly in production TypeScript codebases. Understanding them
        will help you read and write real-world generic code.
      </p>

      <h3>Generic API Response Wrapper</h3>
      <CodeBlock language="typescript" title="Typed API Layer">
{`type ApiState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

async function fetchApi<T>(url: string): Promise<ApiState<T>> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { status: "error", error: response.statusText };
    }
    const data: T = await response.json();
    return { status: "success", data };
  } catch (err) {
    return { status: "error", error: String(err) };
  }
}

// Usage — fully typed responses
const userState = await fetchApi<User>("/api/users/1");
if (userState.status === "success") {
  console.log(userState.data.name); // ✅ TypeScript knows data is User
}`}
      </CodeBlock>

      <h3>Generic Form Handler</h3>
      <CodeBlock language="typescript" title="Typed Form Values">
{`interface FormConfig<TValues> {
  initialValues: TValues;
  validate: (values: TValues) => Partial<Record<keyof TValues, string>>;
  onSubmit: (values: TValues) => Promise<void>;
}

function createForm<TValues extends Record<string, unknown>>(
  config: FormConfig<TValues>
) {
  let values = { ...config.initialValues };

  return {
    setField<K extends keyof TValues>(key: K, value: TValues[K]) {
      values[key] = value;
    },
    getValues: () => ({ ...values }),
    submit: () => config.onSubmit(values),
  };
}

// Usage — 'type', not 'interface': the constraint is Record<string, unknown>
type LoginForm = { username: string; password: string; remember: boolean };

const form = createForm<LoginForm>({
  initialValues: { username: "", password: "", remember: false },
  validate: (vals) => {
    const errors: Partial<Record<keyof LoginForm, string>> = {};
    if (!vals.username) errors.username = "Required";
    return errors;
  },
  onSubmit: async (vals) => console.log(vals),
});

form.setField("username", "alice");  // ✅
form.setField("username", 42);      // ❌ Error`}
      </CodeBlock>

      <h3>Generic Event Emitter</h3>
      <CodeBlock language="typescript" title="Typed Events">
{`type EventMap = Record<string, unknown>;

class TypedEmitter<TEvents extends EventMap> {
  private handlers = new Map<keyof TEvents, Set<Function>>();

  on<K extends keyof TEvents>(
    event: K,
    handler: (data: TEvents[K]) => void
  ): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    this.handlers.get(event)?.forEach(fn => fn(data));
  }
}

// Define your event contract.
// NOTE: this must be a 'type', not an 'interface' — see the box below.
type AppEvents = {
  userLogin: { userId: number; timestamp: Date };
  pageView: { path: string };
  error: { message: string; code: number };
};

const emitter = new TypedEmitter<AppEvents>();
emitter.on("userLogin", (data) => {
  console.log(data.userId);   // ✅ TypeScript knows the shape
});
emitter.emit("userLogin", { userId: 1, timestamp: new Date() }); // ✅
emitter.emit("userLogin", { path: "/" }); // ❌ Wrong shape`}
      </CodeBlock>

      <InfoBox variant="warning" title="Why Those Two Contracts Are type, Not interface">
        <p>
          Both <code>AppEvents</code> above and <code>LoginForm</code> in the form example are
          constrained by <code>{'Record<string, unknown>'}</code>, and an{' '}
          <code>interface</code> <strong>does not satisfy that constraint</strong>:
        </p>
        <p>
          <code>
            error TS2344: Type &apos;AppEvents&apos; does not satisfy the constraint
            &apos;EventMap&apos;. Index signature for type &apos;string&apos; is missing in type
            &apos;AppEvents&apos;.
          </code>
        </p>
        <p>
          A <em>type alias</em> for an object literal gets an <strong>implicit index
          signature</strong>; an <em>interface</em> never does. The reason is declaration
          merging &mdash; an interface can be reopened and extended by any later declaration,
          so TypeScript cannot promise its key set stays within <code>string</code>. A type
          alias is sealed at its definition, so the compiler can prove it.
        </p>
        <p>
          If you need the shape to stay an <code>interface</code>, loosen the constraint
          instead &mdash; <code>{'<TEvents extends object>'}</code> works here, since{' '}
          <code>keyof</code> and <code>TEvents[K]</code> are all this class actually uses.
        </p>
      </InfoBox>

      <h3>Generic Repository Pattern</h3>
      <CodeBlock language="typescript" title="Data Access Layer">
{`interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Repository<T extends Entity> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: string, data: Partial<Omit<T, "id">>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface User extends Entity {
  name: string;
  email: string;
  role: "admin" | "user";
}

class UserRepository implements Repository<User> {
  constructor(private db: Db) {}

  async findById(id: string): Promise<User | null> {
    return this.db.one<User>("SELECT * FROM users WHERE id = $1", [id]);
  }
  async findAll(filter?: Partial<User>): Promise<User[]> {
    return this.db.many<User>("SELECT * FROM users", filter);
  }
  // Annotate the return type here too — without it TS infers Promise<void>
  // from an empty body and 'implements Repository<User>' fails.
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return this.db.insert<User>("users", data);
  }
  async update(id: string, data: Partial<Omit<User, "id">>): Promise<User> {
    return this.db.update<User>("users", id, data);
  }
  async delete(id: string): Promise<void> {
    await this.db.delete("users", id);
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="An Empty Body Is Not a Valid Stub Here">
        <p>
          <code>async findById(id: string): Promise&lt;User | null&gt; {'{ }'}</code> does not
          compile: <em>&quot;A function whose declared type is neither &apos;undefined&apos;,
          &apos;void&apos;, nor &apos;any&apos; must return a value.&quot;</em> And an unannotated{' '}
          <code>async create(...) {'{ }'}</code> is worse &mdash; it infers{' '}
          <code>Promise&lt;void&gt;</code>, so the class quietly stops satisfying{' '}
          <code>Repository&lt;User&gt;</code> and the error surfaces on the <code>create</code>{' '}
          member rather than where you were looking. When sketching a class against an
          interface, annotate every return type.
        </p>
      </InfoBox>

      {/* ── Section 11: Built-in Utility Types ── */}
      <h2>Built-in Utility Types Deep Dive</h2>
      <p>
        TypeScript ships with powerful generic utility types that transform existing types.
        Mastering these eliminates boilerplate and keeps your types DRY.
      </p>

      <CodeBlock language="typescript" title="Partial, Required, Readonly">
{`interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
}

// Partial<T> — all properties become optional
type UserUpdate = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number; }

function updateUser(id: number, changes: Partial<User>): void {
  // Can pass any subset of User fields
}
updateUser(1, { name: "Bob" }); // ✅ Only updating name

// Required<T> — all properties become required
type CompleteUser = Required<User>;
// { id: number; name: string; email: string; age: number; }

// Readonly<T> — all properties become readonly
type FrozenUser = Readonly<User>;
const user: FrozenUser = { id: 1, name: "Alice", email: "a@b.com" };
user.name = "Bob"; // ❌ Error: Cannot assign to 'name' — it's readonly`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Pick, Omit, Record">
{`interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Pick<T, K> — select specific properties
type UserPreview = Pick<User, "id" | "name">;
// { id: number; name: string; }

// Omit<T, K> — remove specific properties
type PublicUser = Omit<User, "password">;
// { id: number; name: string; email: string; createdAt: Date; }

// Record<K, V> — create an object type with keys K and values V
type UserRoles = Record<string, "admin" | "editor" | "viewer">;
const roles: UserRoles = {
  alice: "admin",
  bob: "editor",
};

// Combining them
type UserTable = Record<number, Pick<User, "name" | "email">>;
const table: UserTable = {
  1: { name: "Alice", email: "a@b.com" },
  2: { name: "Bob", email: "b@b.com" },
};`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Extract, Exclude, NonNullable">
{`type Status = "active" | "inactive" | "pending" | "banned";

// Extract<T, U> — keep members assignable to U
type ActiveStatus = Extract<Status, "active" | "pending">;
// "active" | "pending"

// Exclude<T, U> — remove members assignable to U
type NonBannedStatus = Exclude<Status, "banned">;
// "active" | "inactive" | "pending"

// NonNullable<T> — remove null and undefined
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// string

// Practical example: filtering event types
type AppEvent =
  | { type: "click"; x: number; y: number }
  | { type: "keypress"; key: string }
  | { type: "scroll"; offset: number };

type MouseEvent = Extract<AppEvent, { type: "click" }>;
// { type: "click"; x: number; y: number }`}
      </CodeBlock>

      <CodeBlock language="typescript" title="ReturnType, Parameters, InstanceType">
{`function createUser(name: string, age: number) {
  return { id: Math.random(), name, age, active: true };
}

// ReturnType<T> — extract the return type of a function
type NewUser = ReturnType<typeof createUser>;
// { id: number; name: string; age: number; active: boolean; }

// Parameters<T> — extract parameter types as a tuple
type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number]

// InstanceType<T> — extract instance type from a constructor
class UserService {
  getUser(id: number) { return { id, name: "Alice" }; }
}
type UserServiceInstance = InstanceType<typeof UserService>;
// UserService

// Practical: wrapping a function while preserving types
function withLogging<T extends (...args: any[]) => any>(
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args) => {
    console.log("Calling with:", args);
    return fn(...args);
  };
}

const loggedCreate = withLogging(createUser);
// loggedCreate has the same signature as createUser`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Awaited, ConstructorParameters, NoInfer">
{`// Awaited<T> — unwrap a Promise, recursively
type A = Awaited<Promise<string>>;             // string
type B = Awaited<Promise<Promise<number>>>;    // number — unwraps all the way
type C = Awaited<boolean | Promise<number>>;   // boolean | number

// The idiomatic way to type "whatever this async function resolves to":
async function loadUser(id: string) { /* ... */ return { id, name: "Alice" }; }
type LoadedUser = Awaited<ReturnType<typeof loadUser>>;
// { id: string; name: string }   (NOT Promise<...>)

// ConstructorParameters<T> — the constructor's argument tuple
class HttpClient {
  constructor(baseUrl: string, timeout: number) {}
}
type ClientArgs = ConstructorParameters<typeof HttpClient>;
// [baseUrl: string, timeout: number]

// Practical: a factory that stays in sync with the constructor
function makeClient(...args: ConstructorParameters<typeof HttpClient>) {
  return new HttpClient(...args);
}

// NoInfer<T> (TS 5.4+) — stop a parameter from voting on what T is.
// By default EVERY parameter mentioning T is an inference site, so a
// bad argument can quietly widen T until it fits, instead of erroring.

// ── Before: the fallback widens C to include its own mistake ──
function light<C extends string>(colors: C[], defaultColor?: C) {}
light(["red", "yellow", "green"], "blue");
// No error. C was inferred as "red" | "yellow" | "green" | "blue",
// because "blue" was allowed to contribute a candidate.

// ── After: NoInfer removes it from the vote ──
function lightSafe<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {}
lightSafe(["red", "yellow", "green"], "blue");
//                                    ~~~~~~
// error TS2345: Argument of type '"blue"' is not assignable to
//               parameter of type '"red" | "yellow" | "green" | undefined'.
// C is now fixed by 'colors' alone, and 'defaultColor' is merely checked.`}
      </CodeBlock>

      <CodeBlock language="typescript" title="String manipulation types and 'this' helpers">
{`// The four intrinsic string types — built into the compiler
type Upper = Uppercase<"hello">;        // "HELLO"
type Lower = Lowercase<"HELLO">;        // "hello"
type Cap   = Capitalize<"hello">;       // "Hello"
type Uncap = Uncapitalize<"Hello">;     // "hello"

// They distribute over unions, which is what makes event-name mapping work:
type Events = "click" | "focus";
type Handlers = \`on\${Capitalize<Events>}\`;   // "onClick" | "onFocus"

// ── 'this'-related utilities (rarely needed, but good to recognise) ──

// ThisParameterType<T> — extract the declared 'this' parameter
function greet(this: { name: string }, greeting: string) {
  return greeting + ", " + this.name;
}
type GreetThis = ThisParameterType<typeof greet>;   // { name: string }

// OmitThisParameter<T> — the same function with 'this' stripped
type BoundGreet = OmitThisParameter<typeof greet>;  // (greeting: string) => string
const bound: BoundGreet = greet.bind({ name: "Alice" });

// ThisType<T> — sets the type of 'this' inside an object literal's methods.
// Requires "noImplicitThis". Used by config-object APIs like Vue's options API.
type Store = { state: { count: number } } & ThisType<{ increment(): void }>;`}
      </CodeBlock>

      <InfoBox variant="note" title="Complete Utility Type Cheat Sheet">
        <p><strong>Object shape:</strong> Partial&lt;T&gt; (all optional) —
        Required&lt;T&gt; (all required) — Readonly&lt;T&gt; (all readonly) —
        Pick&lt;T, K&gt; (keep keys) — Omit&lt;T, K&gt; (drop keys) —
        Record&lt;K, V&gt; (build a map type)</p>
        <p><strong>Union filtering:</strong> Extract&lt;T, U&gt; (keep matching) —
        Exclude&lt;T, U&gt; (remove matching) — NonNullable&lt;T&gt; (strip null/undefined)</p>
        <p><strong>Function &amp; class:</strong> ReturnType&lt;F&gt; — Parameters&lt;F&gt; —
        ConstructorParameters&lt;C&gt; — InstanceType&lt;C&gt; —
        ThisParameterType&lt;F&gt; — OmitThisParameter&lt;F&gt; — ThisType&lt;T&gt;</p>
        <p><strong>Async:</strong> Awaited&lt;P&gt; (unwrap Promise, recursively)</p>
        <p><strong>String:</strong> Uppercase&lt;S&gt; — Lowercase&lt;S&gt; —
        Capitalize&lt;S&gt; — Uncapitalize&lt;S&gt;</p>
        <p><strong>Inference control:</strong> NoInfer&lt;T&gt; (TS 5.4+)</p>
      </InfoBox>

      <InfoBox variant="tip" title="They Are Not Magic — You Can Write Them Yourself">
        <p>
          Almost every utility above is a few lines of mapped or conditional type in
          TypeScript&apos;s own <code>lib.es5.d.ts</code>. For example{' '}
          <code>Exclude&lt;T, U&gt; = T extends U ? never : T</code> and{' '}
          <code>Pick&lt;T, K extends keyof T&gt; = {'{'} [P in K]: T[P] {'}'}</code>.
          The four string types and <code>NoInfer</code> are the exceptions &mdash; they are
          declared as <code>= intrinsic</code> in that file, implemented inside the compiler,
          and cannot be expressed in TypeScript source.
        </p>
      </InfoBox>

      {/* ── Section 12: Common Generic Patterns in Libraries ── */}
      <h2>Common Generic Patterns in Libraries</h2>
      <p>
        Understanding how popular libraries use generics helps you read type signatures
        and use APIs correctly.
      </p>

      <CodeBlock language="typescript" title="Generics You Already Use">
{`// Array<T> — same as T[]
const nums: Array<number> = [1, 2, 3];

// Promise<T> — typed async results
async function fetchUser(): Promise<User> {
  const res = await fetch("/api/user");
  return res.json();
}

// Map<K, V> and Set<T>
const cache = new Map<string, User>();
cache.set("user-1", { id: 1, name: "Alice", email: "a@b.com" });
const user = cache.get("user-1"); // User | undefined

const uniqueIds = new Set<number>();
uniqueIds.add(1);
uniqueIds.add("1"); // ❌ Error: string not assignable to number

// React.FC and useState (in React projects)
// const MyComponent: React.FC<{ title: string }> = ({ title }) => ...
// const [count, setCount] = useState<number>(0);

// Reading complex signatures
// ReadonlyArray<T> = readonly T[]
// WeakMap<K extends object, V>
// IterableIterator<T>`}
      </CodeBlock>

      <InfoBox variant="tip" title="Iterator Helper Methods — You Don't Need Array.from() First Anymore">
        <p>
          Before TS 5.6, a generator&apos;s return type &mdash; <code>Iterator&lt;T&gt;</code> or{' '}
          <code>IterableIterator&lt;T&gt;</code> from the comment above &mdash; had none of the
          familiar array methods. The standard fix was <code>Array.from(iterator)</code> first,
          which defeats the entire point of an iterator for something like an infinite generator:
          it can never finish. TS 5.6 added <em>types</em> for the{' '}
          <code>Iterator.prototype</code> helper methods (<code>.map</code>, <code>.filter</code>,{' '}
          <code>.take</code>, <code>.drop</code>, <code>.flatMap</code>, <code>.toArray</code>, and
          more), so you chain directly on the iterator and only materialize an array at the very
          end, if at all.
        </p>
        <p>
          Read &quot;TS 5.6&quot; as the version that <em>described</em> them, not the version that
          introduced them. Iterator helpers are <strong>ECMAScript 2025</strong> &mdash; a ratified
          JavaScript feature that V8 implements. TypeScript only shipped the{' '}
          <code>lib</code> declarations, which is exactly why the caveat at the bottom of this box
          bites: the compiler will happily type-check code that a runtime without the methods
          cannot run.
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0 / Node 25 — real output, not a projection">
{`function* naturals() {
  let n = 1;
  while (true) yield n++;   // infinite — Array.from() here would hang forever
}

const result = naturals()
  .map(n => n * n)
  .filter(n => n % 2 === 0)
  .take(5)
  .toArray();

console.log(result);
// [ 4, 16, 36, 64, 100 ]`}
        </CodeBlock>
        <p>
          This needs a <code>lib</code> that includes <code>esnext</code> (or a target new enough
          to imply it) in <code>tsconfig.json</code>, and a runtime new enough to actually have the
          methods &mdash; Node 22+. Older Node versions type-check fine but throw{' '}
          <code>TypeError: naturals(...).map is not a function</code> at runtime, since this is a
          real JS engine feature TypeScript is describing, not something TypeScript adds itself.
        </p>
      </InfoBox>

      <FlowChart
        title="Reading a Generic Signature"
        chart={"graph TD\n  A[\"See: Map&lt;K, V&gt;\"] --> B[\"K = type of keys\"]\n  A --> C[\"V = type of values\"]\n  B --> D[\"Map&lt;string, User&gt;\"]\n  C --> D\n  D --> E[\"Keys are strings\"]\n  D --> F[\"Values are Users\"]\n  style A fill:#5b9cf6,color:#fff\n  style D fill:#10b981,color:#fff"}
      />

      {/* ── Section 13: Envelope Generics ── */}
      <h2>Envelope Generics — Wrapping API Responses</h2>

      <p>
        One of the highest-leverage generic patterns in real production code: the <strong>API response envelope</strong>.
        Instead of every endpoint returning its own ad-hoc shape, all responses go through a single generic wrapper that
        carries success/failure information alongside the typed payload.
      </p>

      <CodeBlock language="ts" title="The canonical envelope" showLineNumbers>
{`// The default 'T = unknown' is doing real work here — read on for why.
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data: T | null;
  error?: string | null;
}`}
      </CodeBlock>

      <p>
        Three properties, one generic. That single interface types every API call in the app.
      </p>

      <h3>Why default to <code>T = unknown</code> instead of <code>T = any</code>?</h3>

      <p>
        The default type parameter is the most under-appreciated part of this pattern. The choice between <code>unknown</code>{' '}
        and <code>any</code> changes how callers behave at call sites that <em>don't specify</em> the generic argument:
      </p>

      <CodeBlock language="ts" title="unknown forces narrowing; any silently lets everything through" showLineNumbers>
{`// With T = unknown (recommended)
function genericFetch(url: string): Promise<ApiResponse> { /* ... */ }
const res = await genericFetch('/health');
res.data.foo;       // ❌ TS error: data is 'unknown | null', no '.foo' access
res.data?.foo;      // ❌ still 'unknown', can't access properties

// You're forced to narrow or assert:
if (res.ok && res.data) {
  const checked = res.data as { foo: string };
  console.log(checked.foo);
}

// ─────────────────────────────────────────────────────────────

// With T = any (anti-pattern)
function looseFetch(url: string): Promise<ApiResponse<any>> { /* ... */ }
const res2 = await looseFetch('/health');
res2.data.foo.bar.baz;  // ✅ TS happy — but ZERO actual safety. Crashes at runtime.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The rule">
        <p>
          <code>unknown</code> as default means "you must specify the type or narrow it." <code>any</code> as default
          means "I give up on type safety." Always prefer <code>unknown</code> for envelope generics — it forces every
          call site to either declare its expected shape or handle the loose data explicitly.
        </p>
      </InfoBox>

      <h3>Specifying the payload type at call sites</h3>

      <CodeBlock language="ts" title="The envelope unlocks typed endpoints" showLineNumbers>
{`interface Recipe {
  id: number;
  title: string;
  author: string;
}

interface Cookbook {
  recipes: Recipe[];
  count: number;
}

async function fetchRecipe(id: number): Promise<ApiResponse<Recipe>> {
  const raw = await fetch(\`/api/recipes/\${id}\`);
  if (!raw.ok) return { ok: false, data: null, error: raw.statusText };
  return { ok: true, data: await raw.json(), error: null };
}

async function fetchCookbook(): Promise<ApiResponse<Cookbook>> { /* ... */ }

// Call sites get full type safety:
const recipeRes = await fetchRecipe(42);
if (recipeRes.ok && recipeRes.data) {
  recipeRes.data.title;  // ✅ string — inferred from ApiResponse<Recipe>
  recipeRes.data.cookbook; // ❌ TS error: cookbook doesn't exist on Recipe
}`}
      </CodeBlock>

      <h3>Pairing with discriminated unions for stricter null handling</h3>

      <p>
        The envelope above has a small weakness: <code>ok: true</code> doesn't <em>guarantee</em>{' '}
        <code>data !== null</code> in TypeScript's eyes — they're independent fields. A more sophisticated version
        uses a discriminated union to tie them together at the type level:
      </p>

      <CodeBlock language="ts" title="Discriminated envelope — ok narrows data" showLineNumbers>
{`type ApiResponse<T> =
  | { ok: true;  data: T;    error?: never }
  | { ok: false; data: null; error: string };

const res = await fetchRecipe(42);
if (res.ok) {
  res.data.title;  // ✅ T is narrowed — TS now KNOWS data is not null
  res.error;       // ✅ compiles — but its type is 'undefined', so there is nothing to read
} else {
  res.error;       // ✅ string — required on the failure branch
  res.data;        // ✅ null — narrowed
}

// What 'error?: never' actually buys you is on the WRITE side:
const bad: ApiResponse<Recipe> = {
  ok: true, data: recipe, error: "boom",  // ❌ 'string' is not assignable to type 'undefined'
};`}
      </CodeBlock>

      <p>
        Same pattern as the discriminated union you've seen for events, reducers, etc. — applied to API responses.
      </p>

      <InfoBox variant="warning" title="What error?: never really does">
        <p>
          A common misreading is that <code>error?: never</code> makes <code>res.error</code> a{' '}
          <em>compile error</em> on the success branch. It does not. The <code>?</code> adds{' '}
          <code>undefined</code>, and <code>never | undefined</code> collapses to{' '}
          <code>undefined</code> — so the property exists, reads fine, and is simply always{' '}
          <code>undefined</code>.
        </p>
        <p>
          Its actual job is on the write side and on narrowing: it lets you build a success
          object without excess-property errors, and it rejects any attempt to attach a real
          error to a successful response. If you want <em>reading</em> it to fail too, omit{' '}
          <code>error</code> from the success branch entirely — then{' '}
          <code>res.error</code> genuinely does not exist there.
        </p>
      </InfoBox>

      <h3>Typed errors with a second generic</h3>

      <CodeBlock language="ts" title="ApiResponse<T, E> — generic data AND error" showLineNumbers>
{`interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

type ApiResponse<T, E = ApiError> =
  | { ok: true;  data: T;    error?: never }
  | { ok: false; data: null; error: E };

// Most call sites use the default error type:
const res = await fetchRecipe(42);
if (!res.ok) {
  res.error.code;         // ✅ ApiError shape
}

// Specialize when an endpoint has its own error shape:
type ValidationErrors = { fields: Record<string, string[]> };
async function submitForm(): Promise<ApiResponse<{ id: number }, ValidationErrors>> { /* ... */ }

const form = await submitForm();
if (!form.ok) {
  form.error.fields;      // ✅ typed as Record<string, string[]>
}`}
      </CodeBlock>

      <InfoBox variant="note" title="Why this is so common in production">
        <p>
          One generic interface = one place to evolve the response contract. Add a <code>requestId</code> for tracing?
          Add a <code>warnings</code> array? Add pagination meta? You change <code>ApiResponse&lt;T&gt;</code> in one
          file and every consumer either keeps working (additive fields) or gets a type error pointing at exactly
          what needs updating (breaking changes). Without the envelope, that change is a multi-day grep-and-update.
        </p>
      </InfoBox>

      {/* ── Section 14: Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"Which function signature correctly constrains T to objects that have a 'name' property of type string?"}
        code={`// Which signature is correct?
// A) function greet<T>(obj: T): string
// B) function greet<T extends { name: string }>(obj: T): string
// C) function greet<T extends string>(obj: T): string
// D) function greet<T = { name: string }>(obj: T): string`}
        language="typescript"
        options={[
          "function greet<T>(obj: T): string — no constraint at all",
          "function greet<T extends { name: string }>(obj: T): string — extends constrains shape",
          "function greet<T extends string>(obj: T): string — constrains T to string type",
          "function greet<T = { name: string }>(obj: T): string — default, not constraint",
        ]}
        correctIndex={1}
        explanation={"The extends keyword constrains T so that only types with a 'name: string' property are accepted. Option A has no constraint. Option C constrains T to string itself, not objects with a name. Option D sets a default type but does not enforce the constraint — callers could pass any type explicitly."}
      />

      <InteractiveChallenge
        question={"You have a User type and want to create a type with only 'id' and 'email'. Which utility type do you use?"}
        code={`interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

// Goal: { id: number; email: string; }`}
        language="typescript"
        options={[
          "Partial<User>",
          "Omit<User, \"name\" | \"password\" | \"createdAt\">",
          "Pick<User, \"id\" | \"email\">",
          "Extract<User, \"id\" | \"email\">",
        ]}
        correctIndex={2}
        explanation={"Pick<User, \"id\" | \"email\"> selects exactly those two properties. Omit would also work but requires listing everything to remove — Pick is cleaner when you want fewer fields than you are excluding. Partial makes all fields optional but keeps them all. Extract works on union types, not object properties."}
      />

      <InteractiveChallenge
        question={"What does the return type T[K] resolve to in this function call?"}
        code={`function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "Alice", active: true };
const result = getProperty(user, "active");
// What is the type of result?`}
        language="typescript"
        options={[
          "string",
          "unknown",
          "boolean",
          "string | number | boolean",
        ]}
        correctIndex={2}
        explanation={"T is inferred as { id: number; name: string; active: boolean } and K is inferred as the literal type \"active\". T[K] therefore resolves to the type of the 'active' property, which is boolean. This is the power of indexed access types combined with generics — TypeScript tracks the exact property type."}
      />

      <InfoBox variant="success" title="Generics Mastery">
        You now understand the core building blocks of TypeScript generics — from basic type
        parameters through constraints, keyof patterns, and utility types. Generics are the
        foundation of type-safe, reusable code. Practice by adding type parameters to your
        own utility functions and see how much more the compiler can catch for you.
      </InfoBox>

    </LessonLayout>
  );
}
