import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsGenerics() {
  return (
    <LessonLayout
      title="Generics"
      sectionId="typescript"
      lessonIndex={3}
      prev={{ path: "/typescript/interfaces", label: "Interfaces" }}
      next={{ path: "/typescript/advanced", label: "Advanced Types" }}
    >
      <p>
        Generics are TypeScript's mechanism for writing reusable, type-safe code. They let you write a function or
        class once and have it work with any type — while preserving full type information throughout. Without
        generics, you'd have to choose between being type-safe (by specifying a concrete type) or being flexible
        (by using <code>any</code>). Generics give you both.
      </p>

      <FlowChart
        title="How Generics Work"
        chart={"graph LR\n  A[Generic Function identity T] --> B[Call with string]\n  A --> C[Call with number]\n  A --> D[Call with User]\n  B --> E[Returns string]\n  C --> F[Returns number]\n  D --> G[Returns User]\n  E --> H[Full type info preserved]\n  F --> H\n  G --> H"}
      />

      <h2>Generic Functions</h2>
      <p>
        A generic function uses a type parameter (typically <code>T</code>) that TypeScript fills in when you call
        the function. The type is inferred from the argument, so you rarely need to specify it explicitly.
      </p>

      <CodeBlock language="typescript" title="Generic Functions: From Simple to Powerful">
{`// ─── THE PROBLEM WITHOUT GENERICS ────────────────────────────────────────────
// Option 1: Specific type — type-safe but not reusable
function identityString(arg: string): string { return arg; }
function identityNumber(arg: number): number { return arg; }
// Tedious to write for every type

// Option 2: any — reusable but loses type info
function identity(arg: any): any { return arg; }
const result = identity("hello");  // result is 'any', not 'string'!
result.toUpperCase();  // TypeScript can't help — any is unsafe

// ─── GENERIC FUNCTION: best of both worlds ────────────────────────────────────
function identity<T>(arg: T): T { return arg; }

const s = identity("hello");   // T = string → return type is string
const n = identity(42);        // T = number → return type is number
const b = identity(true);      // T = boolean → return type is boolean

// Explicit type argument (rarely needed — TypeScript infers):
const explicit = identity<string>("hello");  // same result, just verbose

// ─── MORE USEFUL GENERIC FUNCTIONS ───────────────────────────────────────────
// first: get first element of any array
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const firstNum = first([1, 2, 3]);       // number | undefined
const firstStr = first(["a", "b"]);      // string | undefined
const firstUser = first(users);          // User | undefined

// zip: pair up two arrays
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  const length = Math.min(a.length, b.length);
  return Array.from({ length }, (_, i) => [a[i], b[i]]);
}
const pairs = zip([1, 2, 3], ["a", "b", "c"]);  // [number, string][]

// pipe: chain transformations
function pipe<A, B, C>(value: A, f: (a: A) => B, g: (b: B) => C): C {
  return g(f(value));
}
const result2 = pipe("hello", s => s.toUpperCase(), s => s.length);
// TypeScript infers: pipe<string, string, number> → result2 is number

// memoize: cache any pure function
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key)!;
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const expensiveFn = memoize((n: number) => n * n);
expensiveFn(5);   // 25 (computed)
expensiveFn(5);   // 25 (from cache)`}
      </CodeBlock>

      <h2>Generic Constraints with extends</h2>
      <p>
        Generic constraints restrict what types a type parameter can accept. Use <code>T extends SomeType</code>
        to require that <code>T</code> has at least the properties of <code>SomeType</code>.
      </p>

      <CodeBlock language="typescript" title="Generic Constraints and keyof">
{`// ─── extends CONSTRAINT: require specific shape ──────────────────────────────
// Without constraint — TypeScript can't call .length on T
function getLength<T>(arg: T): number {
  return arg.length;  // Error: Property 'length' does not exist on type 'T'
}

// With constraint — T must have a length property
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;  // ✓ OK — T is guaranteed to have .length
}
getLength("hello");   // ✓ string has .length
getLength([1, 2, 3]); // ✓ array has .length
getLength({ length: 10, name: "test" }); // ✓ object with .length
getLength(42);        // Error: number doesn't have .length

// ─── keyof: type-safe property access ───────────────────────────────────────
// keyof T is a union of all property names of T as string literals
type UserKeys = keyof User;  // "id" | "name" | "email"

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];  // T[K] = "indexed access type" — the type of obj[key]
}

const user = { id: 1, name: "Alice", email: "alice@example.com" };
const name = getProperty(user, "name");    // TypeScript knows: string
const id   = getProperty(user, "id");      // TypeScript knows: number
// getProperty(user, "missing");           // Error: not a key of User

// ─── Combining constraints ────────────────────────────────────────────────────
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => { result[key] = obj[key]; });
  return result;
}

const partial = pick(user, ["name", "email"]);
// type: { name: string; email: string } — only the picked keys

// ─── Multiple type parameters with constraints ────────────────────────────────
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

const merged = merge({ name: "Alice" }, { age: 30 });
// type: { name: string } & { age: number } → merged.name and merged.age both typed

// ─── Default type parameters ─────────────────────────────────────────────────
interface ApiResponse<T = unknown> {  // T defaults to unknown
  data: T;
  status: number;
  message: string;
}

type DefaultResponse = ApiResponse;                // data: unknown
type UserResponse   = ApiResponse<User>;           // data: User
type UserListResponse = ApiResponse<User[]>;       // data: User[]`}
      </CodeBlock>

      <h2>Generic Classes</h2>

      <CodeBlock language="typescript" title="Generic Classes: Repository Pattern">
{`// Generic class — T is the entity type, ID is the identifier type
class Repository<T extends { id: ID }, ID = number> {
  private items: Map<ID, T> = new Map();

  add(item: T): void {
    this.items.set(item.id, item);
  }

  findById(id: ID): T | undefined {
    return this.items.get(id);
  }

  findAll(): T[] {
    return Array.from(this.items.values());
  }

  update(id: ID, changes: Partial<Omit<T, "id">>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...changes } as T;
    this.items.set(id, updated);
    return updated;
  }

  delete(id: ID): boolean {
    return this.items.delete(id);
  }

  count(): number {
    return this.items.size;
  }
}

// Specific repository for User entities:
interface User { id: number; name: string; email: string; }
const userRepo = new Repository<User>();
userRepo.add({ id: 1, name: "Alice", email: "alice@example.com" });
const alice = userRepo.findById(1);  // User | undefined — fully typed

// Repository for entities with string IDs:
interface Order { id: string; total: number; status: string; }
const orderRepo = new Repository<Order, string>();
orderRepo.add({ id: "ord-001", total: 99.99, status: "pending" });

// Generic Stack
class Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  size(): number { return this.items.length; }
}

const numStack = new Stack<number>();
numStack.push(1); numStack.push(2);
const top = numStack.pop();  // number | undefined`}
      </CodeBlock>

      <h2>Mapped Types</h2>
      <p>
        Mapped types transform every property in a type, creating a new type. TypeScript's built-in utility types
        like <code>Partial</code>, <code>Required</code>, <code>Readonly</code>, <code>Pick</code>, and
        <code>Omit</code> are all implemented as mapped types.
      </p>

      <CodeBlock language="typescript" title="Mapped Types: Built-in and Custom">
{`// ─── UNDERSTANDING MAPPED TYPE SYNTAX ────────────────────────────────────────
// { [K in keyof T]: ... } — iterate over every key K in type T

// Partial<T> — makes all properties optional
type Partial<T> = { [K in keyof T]?: T[K] };

// Required<T> — makes all properties required
type Required<T> = { [K in keyof T]-?: T[K] };  // -? removes optional modifier

// Readonly<T> — makes all properties readonly
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// Mutable<T> (not built-in) — removes readonly from all properties
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

// ─── BUILT-IN UTILITY TYPES ──────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
}

type ProductUpdate   = Partial<Product>;           // all optional (PATCH body)
type ProductRequired = Required<ProductUpdate>;     // back to all required
type ProductSnapshot = Readonly<Product>;           // immutable snapshot
type ProductSummary  = Pick<Product, "id" | "name" | "price">;  // select fields
type CreateProduct   = Omit<Product, "id">;        // exclude id (not known yet)
type ProductRecord   = Record<number, Product>;    // { [id: number]: Product }

// NonNullable<T> — removes null and undefined
type StringOnly = NonNullable<string | null | undefined>;  // string

// Extract and Exclude — filter union members
type Strings = Extract<string | number | boolean, string>;  // string
type NoStrings = Exclude<string | number | boolean, string>; // number | boolean

// ─── CUSTOM MAPPED TYPES ─────────────────────────────────────────────────────
// Nullable<T> — makes all properties nullable
type Nullable<T> = { [K in keyof T]: T[K] | null };

// WithRequired<T, K> — makes specific keys required
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

// DeepPartial<T> — recursively optional
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

// Getters<T> — transform properties to getter functions
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName: () => string; getAge: () => number }`}
      </CodeBlock>

      <h2>Conditional Types and infer</h2>

      <CodeBlock language="typescript" title="Conditional Types and the infer Keyword">
{`// ─── CONDITIONAL TYPES: T extends U ? X : Y ─────────────────────────────────
type IsString<T> = T extends string ? true : false;
type A = IsString<string>;   // true
type B = IsString<number>;   // false
type C = IsString<"hello">;  // true (string literal extends string)

// Non-nullable — remove null/undefined from a type
type NonNullable<T> = T extends null | undefined ? never : T;

// Flatten arrays:
type Flatten<T> = T extends Array<infer Item> ? Item : T;
type Nums = Flatten<number[]>;   // number
type Str  = Flatten<string>;     // string (not an array — returned as-is)

// ─── infer: extract types from other types ────────────────────────────────────
// 'infer U' creates a new type variable U that TypeScript fills in

// Extract the resolved type from a Promise:
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type Resolved = Awaited<Promise<Promise<string>>>;  // string

// Extract function parameter types:
type Parameters<T extends (...args: any) => any> =
  T extends (...args: infer P) => any ? P : never;

type Params = Parameters<(a: string, b: number) => void>;  // [string, number]

// Extract function return type:
type ReturnType<T extends (...args: any) => any> =
  T extends (...args: any) => infer R ? R : never;

async function getUser(id: number): Promise<User> { /* ... */ }
type GetUserReturn = ReturnType<typeof getUser>;        // Promise<User>
type GetUserResolved = Awaited<ReturnType<typeof getUser>>;  // User

// ─── BUILT-IN UTILITY TYPES THAT USE THESE ──────────────────────────────────
type ExampleFn = (req: Request, res: Response) => Promise<void>;
type FnParams = Parameters<ExampleFn>;      // [Request, Response]
type FnReturn = ReturnType<ExampleFn>;      // Promise<void>
type FnReturn2 = Awaited<ReturnType<ExampleFn>>;  // void

// ConstructorParameters — extract class constructor params
class HttpClient {
  constructor(baseUrl: string, timeout: number) {}
}
type HttpClientParams = ConstructorParameters<typeof HttpClient>;  // [string, number]

// InstanceType — extract instance type from a constructor
type Client = InstanceType<typeof HttpClient>;  // HttpClient`}
      </CodeBlock>

      <InfoBox variant="note" title="Key Generic Utility Types Summary">
        <p><strong>Partial&lt;T&gt;</strong> — all properties optional. Use for PATCH request bodies.</p>
        <p><strong>Required&lt;T&gt;</strong> — all properties required. Inverse of Partial.</p>
        <p><strong>Readonly&lt;T&gt;</strong> — all properties readonly. Use for immutable data.</p>
        <p><strong>Pick&lt;T, K&gt;</strong> — only the named properties. Use to create projections.</p>
        <p><strong>Omit&lt;T, K&gt;</strong> — all properties except the named ones. Use to exclude id, timestamps, etc.</p>
        <p><strong>Record&lt;K, V&gt;</strong> — an object with keys of type K and values of type V.</p>
        <p><strong>ReturnType&lt;F&gt;</strong> — the return type of a function type F.</p>
        <p><strong>Parameters&lt;F&gt;</strong> — a tuple of the parameter types of function type F.</p>
        <p><strong>Awaited&lt;T&gt;</strong> — recursively unwraps Promise types to get the resolved value type.</p>
      </InfoBox>

      <InteractiveChallenge
        question={"What does T extends keyof U mean as a generic constraint?"}
        options={[
          "T must be a subclass that extends the U class",
          "T must be one of the property names (string keys) of type U, ensuring type-safe property access",
          "T and U must have the same number of properties",
          "U must extend T — the constraint is on U, not T"
        ]}
        correctIndex={1}
        explanation="keyof U produces a union of all property name literals of U — for example, keyof { id: number; name: string } is 'id' | 'name'. T extends keyof U means T must be assignable to that union, i.e., T must be one of the actual property names of U. This enables the type-safe getProperty pattern where the return type is T[K] — the exact type of that property on the object. TypeScript will error if you pass a key that doesn't exist on the object."
      />

      <InteractiveChallenge
        question="What does the infer keyword do in a conditional type like T extends Promise<infer U> ? U : T?"
        options={[
          "It infers the type of T from context",
          "It creates a new type variable U that TypeScript fills in by pattern-matching against the structure of T",
          "It tells TypeScript to skip type checking for the matched portion",
          "It converts the type to a more specific version automatically"
        ]}
        correctIndex={1}
        explanation="The infer keyword inside a conditional type introduces a new type variable that TypeScript fills in when the extends condition matches. In T extends Promise<infer U>, if T is Promise<string>, TypeScript matches the pattern and sets U = string. You can then use U in the true branch. infer is how TypeScript's built-in utility types like ReturnType, Parameters, and Awaited are implemented — they pattern-match on function or Promise structure and extract the relevant type."
      />
    </LessonLayout>
  );
}
