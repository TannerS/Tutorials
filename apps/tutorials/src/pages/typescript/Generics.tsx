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
        Sometimes you need a generic type to have certain properties. The <code>extends</code> keyword
        constrains a type parameter to types that match a specific shape.
      </p>

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

      {/* ── Section 7: keyof with Generics ── */}
      <h2>keyof with Generics</h2>
      <p>
        Combining <code>keyof</code> with generics creates type-safe property access — one of
        the most powerful patterns in TypeScript.
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

// Usage
interface LoginForm { username: string; password: string; remember: boolean; }

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

// Define your event contract
interface AppEvents {
  userLogin: { userId: number; timestamp: Date };
  pageView: { path: string };
  error: { message: string; code: number };
}

const emitter = new TypedEmitter<AppEvents>();
emitter.on("userLogin", (data) => {
  console.log(data.userId);   // ✅ TypeScript knows the shape
});
emitter.emit("userLogin", { userId: 1, timestamp: new Date() }); // ✅
emitter.emit("userLogin", { path: "/" }); // ❌ Wrong shape`}
      </CodeBlock>

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
  async findById(id: string): Promise<User | null> { /* ... */ }
  async findAll(filter?: Partial<User>): Promise<User[]> { /* ... */ }
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">) { /* ... */ }
  async update(id: string, data: Partial<Omit<User, "id">>) { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
}`}
      </CodeBlock>

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

      <InfoBox variant="note" title="Cheat Sheet">
        <strong>Make optional:</strong> Partial&lt;T&gt; — <strong>Make required:</strong> Required&lt;T&gt; — <strong>Make
        readonly:</strong> Readonly&lt;T&gt; — <strong>Select keys:</strong> Pick&lt;T, K&gt; — <strong>Remove
        keys:</strong> Omit&lt;T, K&gt; — <strong>Map keys to values:</strong> Record&lt;K, V&gt; — <strong>Keep
        matching:</strong> Extract&lt;T, U&gt; — <strong>Remove matching:</strong> Exclude&lt;T, U&gt; — <strong>Remove
        nulls:</strong> NonNullable&lt;T&gt;
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
  res.error;       // ❌ TS error: error doesn't exist on the 'ok: true' branch
} else {
  res.error;       // ✅ string — required on the failure branch
  res.data;        // ✅ null — narrowed
}`}
      </CodeBlock>

      <p>
        Same pattern as the discriminated union you've seen for events, reducers, etc. — applied to API responses.
        The <code>error?: never</code> on the success branch is what makes TS reject <code>res.error</code> when{' '}
        <code>res.ok</code> is true.
      </p>

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
