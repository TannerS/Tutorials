import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="TypeScript Cheat Sheet"
      sectionId="typescript"
      lessonIndex={12}
      prev={{ path: '/typescript/enterprise', label: 'Enterprise TypeScript Patterns' }}
      next={{ path: '/typescript/native-compiler', label: 'TypeScript 6 → 7: The Native Compiler' }}
    >
      <h2>Primitives &amp; Literals</h2>
      <CodeBlock language="ts" title="The types you use every day">
{`// primitives
string  number  boolean  bigint  symbol  null  undefined  void  never  unknown  any

// literals — a value is its own type
type Yes = 'yes';           type Zero = 0;         type True = true;

// unions
type Status = 'draft' | 'published' | 'archived';
type Id     = string | number;

// intersection — combine
type WithId<T> = T & { id: string };

// tuples
type Pair = [string, number];
type Named = readonly [name: string, age: number];  // labeled tuples

// arrays
Array<T>   |   T[]   |   ReadonlyArray<T>   |   readonly T[]`}
      </CodeBlock>

      <h2>any / unknown / never / void</h2>
      <CodeBlock language="ts" title="The four that trip people up">
{`any      // disables checking — and infects everything derived from it. Ban it.
unknown  // "I don't know yet" — you MUST narrow before you can touch it
never    // no valid value: a function that always throws, an impossible branch
void     // "ignore my return value" — not the same as undefined

let a: any     = JSON.parse(s);  a.whatever.deep;      // compiles, crashes
let u: unknown = JSON.parse(s);  u.whatever;           // ERROR — narrow first
if (typeof u === 'string') u.trim();                   // OK

function fail(m: string): never { throw new Error(m); }
const _exhaustive: never = value;   // exhaustiveness check (see below)

// void vs undefined: void lets a callback return anything, and it's discarded
const cb: () => void = () => 42;    // OK
const cd: () => undefined = () => 42;  // ERROR`}
      </CodeBlock>

      <h2>Object &amp; Function Types</h2>
      <CodeBlock language="ts" title="Interfaces and type aliases">
{`interface User {
  id: string;
  email: string;
  displayName?: string;               // optional
  readonly createdAt: Date;           // readonly
  metadata: Record<string, string>;   // arbitrary keys
  [k: \`x-\${string}\`]: string;         // template-literal index sig
}

// Function type — three common shapes
type Fn1 = (x: number) => number;
interface Fn2 { (x: number): number }
type Handler<T> = (event: T) => Promise<void>;`}
      </CodeBlock>

      <h2>Interface vs Type Alias</h2>
      <CodeBlock language="ts" title="Pick by capability, not by taste">
{`// ONLY interfaces can do:
interface Box { w: number }
interface Box { h: number }          // declaration merging -> { w, h }

// module augmentation — merges into what the module EXPORTS
declare module '@tanstack/react-query' {
  interface Register { defaultError: { code: string } }
}
// Express's Request is NOT exported — it lives on a global namespace,
// so 'declare module "express"' misses it. Use declare global instead:
declare global { namespace Express { interface Request { userId?: string } } }

// ONLY type aliases can do:
type Id       = string | number;     // unions
type Pair     = [a: string, b: number];
type Elem<T>  = T extends (infer U)[] ? U : never;   // conditionals
type Getters<T> = { [K in keyof T as \`get\${string & K}\`]: () => T[K] };  // mapped

// Both can do: object shapes, generics, extending
interface Admin extends User { role: 'admin' }     // extends
type Admin2 = User & { role: 'admin' };            // intersection

// Rule of thumb:
//   public/extensible object shapes and library types -> interface
//   unions, tuples, mapped/conditional, anything computed -> type
// Interface extends gives BETTER error messages and caches faster than &.`}
      </CodeBlock>

      <h2>Type Operators — keyof, typeof, indexed access</h2>
      <CodeBlock language="ts" title="Derive types instead of duplicating them">
{`interface User { id: string; age: number; tags: string[] }

keyof User            // 'id' | 'age' | 'tags'
User['age']           // number          — indexed access
User['id' | 'age']    // string | number — indexed access with a union
User['tags'][number]  // string          — element type of an array

const config = { retries: 3, mode: 'strict' } as const;
typeof config              // { readonly retries: 3; readonly mode: 'strict' }
keyof typeof config        // 'retries' | 'mode'   <- the workhorse combo

const roles = ['admin', 'user'] as const;
typeof roles[number]       // 'admin' | 'user'     <- union from an array

// Type-safe property getter
function get<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }

// NOTE: two different 'typeof's.
//   value position -> JS runtime operator ('string', 'object', ...)
//   type  position -> TS operator, lifts a VALUE into its type`}
      </CodeBlock>

      <h2>Enums</h2>
      <CodeBlock language="ts" title="What they do — and what to use instead">
{`enum Direction { Up, Down }        // numeric: Up = 0, Down = 1
enum Status { Active = 'ACTIVE' }   // string enum
const enum Fast { A = 1 }           // inlined; breaks under isolatedModules

// Problems: emits runtime JS (not type-only), numeric enums accept ANY number,
// reverse mappings bloat output, and they don't play well with bundlers.
const d: Direction = 99;            // compiles! numeric enums are not exhaustive

// PREFER — zero runtime cost, exhaustive, autocompletes the same:
const STATUS = { Active: 'ACTIVE', Archived: 'ARCHIVED' } as const;
type Status2 = typeof STATUS[keyof typeof STATUS];   // 'ACTIVE' | 'ARCHIVED'

// Or just the union, when you don't need the value object:
type Direction2 = 'up' | 'down';`}
      </CodeBlock>

      <h2>Classes</h2>
      <CodeBlock language="ts" title="Modifiers, accessors, statics, abstract">
{`class Account {
  static readonly VERSION = '2.0';   // on the class, not instances
  static { /* static init block — runs once */ }

  #secret = 'runtime-private';       // ES private — truly inaccessible outside
  private pin = '1234';              // TS private — compile-time check ONLY
  protected balance = 0;             // this class + subclasses
  readonly id: string;               // assign once, in the constructor
  ready!: string;                    // definite assignment — "trust me"

  // Parameter properties: modifier => declares AND assigns the field
  constructor(public owner: string, private rate = 0.05) {
    this.id = crypto.randomUUID();
  }

  get formatted(): string { return \`$\${this.balance}\`; }  // getter
  set deposit(n: number) { this.balance += n; }            // setter
  accessor live = 0;   // auto-accessor — decoratable getter/setter pair
}

abstract class Shape {
  abstract area(): number;                    // subclass MUST implement
  summary() { return this.area().toFixed(2); } // inherited implementation
}

class Circle extends Shape implements Serializable {
  constructor(private r: number) { super(); }
  override area() { return Math.PI * this.r ** 2; }  // 'override' required
}                                                     // under noImplicitOverride

// Singleton — private constructor blocks 'new' from outside
class Db {
  private static instance: Db | null = null;
  private constructor() {}
  static get(): Db { return (Db.instance ??= new Db()); }
}`}
      </CodeBlock>

      <h2>Decorators</h2>
      <CodeBlock language="ts" title="Stage 3 (TS 5+, no flag) vs legacy">
{`// ── Stage 3 standard: (value, context) ──
function log<T extends (...a: any[]) => any>(m: T, c: ClassMethodDecoratorContext): T {
  return function (this: any, ...args: any[]) {
    console.log(String(c.name), args);
    return m.apply(this, args);
  } as T;
}

// Decorator FACTORY — a decorator that takes arguments
function retry(times: number) {
  return function <T extends (...a: any[]) => Promise<any>>(m: T, c: ClassMethodDecoratorContext): T {
    /* wrap and re-invoke m */ return m;
  };
}

class Api {
  @log            // applied LAST  (outermost — its code runs first)
  @retry(3)       // applied FIRST (innermost)
  async fetch() {}
}

// context: { kind, name, static, private, access, addInitializer, metadata }
// kinds: class | method | getter | setter | field | accessor
// class decorator: return a subclass to replace the class; addInitializer for per-instance

// ── Legacy (Angular / NestJS / TypeORM): (target, key, descriptor) ──
// tsconfig: "experimentalDecorators": true, "emitDecoratorMetadata": true
// Only the legacy system has PARAMETER decorators — which is why
// constructor-injection DI still requires the flag. All-or-nothing per project.`}
      </CodeBlock>

      <h2>Utility Types</h2>
      <CodeBlock language="ts" title="Every built-in utility type">
{`// ── Object shape ──
Partial<T>              all props optional
Required<T>             all props required
Readonly<T>             all props readonly
Pick<T, K>              keep the listed keys
Omit<T, K>              drop the listed keys
Record<K, V>            { [key: K]: V }

// ── Union filtering ──
Exclude<T, U>           union minus U
Extract<T, U>           union intersected with U
NonNullable<T>          strip null and undefined

// ── Functions & classes ──
ReturnType<F>           infer function return type
Parameters<F>           tuple of function param types
ConstructorParameters<C> tuple of constructor param types
InstanceType<C>         instance type of a class constructor
ThisParameterType<F>    the declared 'this' param
OmitThisParameter<F>    same function, 'this' removed
ThisType<T>             types 'this' inside an object literal's methods

// ── Async ──
Awaited<P>              unwrap Promise (recursively)

// ── Strings (compiler intrinsics) ──
Uppercase<S>  Lowercase<S>  Capitalize<S>  Uncapitalize<S>

// ── Inference control ──
NoInfer<T>              (TS 5.4+) exclude this position from inference`}
      </CodeBlock>

      <h2>Generics</h2>
      <CodeBlock language="ts" title="Generics essentials">
{`function first<T>(xs: T[]): T | undefined { return xs[0]; }

// Constrained generic — 'extends' means "at least this shape"
function keys<T extends object>(obj: T): (keyof T)[] { return Object.keys(obj) as (keyof T)[]; }
function len<T extends { length: number }>(x: T) { return x.length; }
function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }

// Default type param
type Box<T = string> = { value: T };

// Multiple params + inference
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }

// Generic interface / type alias / class
interface ApiResponse<T> { data: T; error: string | null }
type Nullable<T> = { [K in keyof T]: T[K] | null };
class Stack<T> {
  #items: T[] = [];
  push(x: T) { this.#items.push(x); }
  pop(): T | undefined { return this.#items.pop(); }
}

// In .tsx files <T> parses as JSX — disambiguate with a trailing comma:
const identity = <T,>(x: T): T => x;          // or: <T extends unknown>(x: T) => x

// Variance annotations (TS 4.7+) — document and speed up checking
interface Producer<out T> { get(): T }        // covariant  (read-only position)
interface Consumer<in  T> { set(v: T): void } // contravariant (write-only)
interface Collection<in out T> { get(): T; set(v: T): void }  // invariant

// Naming: T (type) K (key) V (value) E (element/error) R (return) P (props)`}
      </CodeBlock>

      <h2>Discriminated Unions</h2>
      <CodeBlock language="ts" title="The bread and butter of TS modeling">
{`type RemoteData<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error';   error: Error };

function render<T>(rd: RemoteData<T>) {
  switch (rd.kind) {
    case 'idle':    return null;
    case 'loading': return 'Loading...';
    case 'success': return rd.data;
    case 'error':   return rd.error.message;
    default: {
      const _: never = rd;   // exhaustiveness check
      return _;
    }
  }
}`}
      </CodeBlock>

      <h2>Branded Types (Nominal IDs)</h2>
      <CodeBlock language="ts" title="Distinguish strings that shouldn't mix">
{`declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type UserId  = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

const UserId  = { parse: (s: string): UserId  => s as UserId };
const OrderId = { parse: (s: string): OrderId => s as OrderId };

function updateOrder(id: OrderId) { /* ... */ }
updateOrder(UserId.parse('u1'));  // ERROR — UserId is not assignable to OrderId`}
      </CodeBlock>

      <h2>satisfies</h2>
      <CodeBlock language="ts" title="Check shape, keep literals">
{`const routes = {
  '/orders':      listOrders,
  '/orders/:id':  getOrder,
} satisfies Record<string, RouteHandler>;
// typeof routes preserves the LITERAL key set — not widened to Record<string, ...>.

const flags = {
  'darkmode':     { default: true,  desc: 'Dark mode' },
  'ai-suggest':   { default: false, desc: 'AI panel' },
} satisfies Record<string, { default: boolean; desc: string }>;

type FlagName = keyof typeof flags;   // 'darkmode' | 'ai-suggest'`}
      </CodeBlock>

      <h2>Narrowing — Every Mechanism</h2>
      <CodeBlock language="ts" title="How the compiler follows control flow">
{`// typeof — primitives only
if (typeof x === 'string') x.trim();
// 'string' 'number' 'boolean' 'bigint' 'symbol' 'undefined' 'object' 'function'
// GOTCHA: typeof null === 'object', and so is any array

// instanceof — classes and built-ins
if (err instanceof Error) err.message;

// 'in' — does this key exist?
if ('radius' in shape) shape.radius;

// truthiness — beware 0 and ''
if (s) {}                 // excludes '' and 0 too!
if (s !== undefined) {}   // usually what you actually meant

// equality / discriminant
if (a === b) {}                       // narrows BOTH sides
switch (shape.kind) { case 'circle': /* narrowed */ }

// Array.isArray, plus filtering with a predicate
const defined = list.filter((x): x is string => x != null);

// Type predicate — a function whose return type teaches the compiler
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null
    && 'id' in v && 'email' in v;
}

if (isUser(raw)) {
  raw.email;    // narrowed to User
}

// Assertion signatures — narrow after a throw
function assertUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new Error('not a user');
}
assertUser(raw);
raw.email;      // narrowed`}
      </CodeBlock>

      <h2>Assertions &amp; Escape Hatches</h2>
      <CodeBlock language="ts" title="Use sparingly — each one silences the compiler">
{`const el = document.getElementById('x') as HTMLInputElement;  // 'as' — you promise
const el2 = <HTMLInputElement>document.getElementById('x');   // same, illegal in .tsx

value!            // non-null assertion — "trust me, not null". Crashes if wrong.
prop!: string     // definite assignment — "assigned before use, elsewhere"

// Double assertion — required when the types don't overlap at all
const n = ('5' as unknown) as number;   // a giant red flag

// @ts-expect-error > @ts-ignore: it FAILS when the error goes away,
// so it can't rot silently in the codebase.
// @ts-expect-error — API returns snake_case until v3 ships (TICKET-421)
doThing(payload.user_id);

// Preference order, best to worst:
//   narrowing / type predicate  >  satisfies  >  as  >  !  >  as unknown as  >  any`}
      </CodeBlock>

      <h2>Mapped Types</h2>
      <CodeBlock language="ts" title="Transform every key of a type">
{`type ReadonlyDeep<T> = T extends object
  ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
  : T;

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName(): string; getAge(): number }

// Modifiers: add with + (implicit), REMOVE with -
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };   // strip readonly
type Concrete<T> = { [K in keyof T]-?: T[K] };           // strip optional
type Loose<T>    = { [K in keyof T]?: T[K] };            // == Partial<T>

// Key remapping with 'as' — return never to DROP a key
type OmitByType<T, U> = { [K in keyof T as T[K] extends U ? never : K]: T[K] };
type NoFns = OmitByType<{ id: string; run(): void }, Function>;  // { id: string }`}
      </CodeBlock>


      <h2>Conditional Types &amp; infer</h2>
      <CodeBlock language="ts" title="Types as functions">
{`type IsString<T> = T extends string ? true : false;
type A = IsString<'x'>;   // true
type B = IsString<10>;    // false

// infer extracts a piece of a type
type ElementOf<T> = T extends (infer U)[] ? U : never;
type X = ElementOf<number[]>;  // number

type PromiseValue<T> = T extends Promise<infer U> ? U : T;
type Y = PromiseValue<Promise<string>>;  // string

// DISTRIBUTIVE: a naked type param distributes over a union
type ToArray<T> = T extends any ? T[] : never;
type Z = ToArray<string | number>;        // string[] | number[]   (not (string|number)[])
// Opt OUT by wrapping both sides in a tuple:
type NoDist<T> = [T] extends [any] ? T[] : never;
type W = NoDist<string | number>;         // (string | number)[]

// Distribution is how the union utilities work:
//   Exclude<T,U> = T extends U ? never : T   — 'never' deletes a member
// ...and the trap it creates: 'never' is the EMPTY union, so there is
// nothing to distribute over and the conditional never runs.
type IsNever<T>  = T extends never ? true : false;
type N1 = IsNever<never>;                 // never   <- NOT true
type IsNever2<T> = [T] extends [never] ? true : false;
type N2 = IsNever2<never>;                // true    <- wrap to fix

// Recursive conditional types
type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;
type Flatten<T> = T extends readonly (infer U)[] ? Flatten<U> : T;
type Path = Flatten<string[][][]>;        // string

// Recursive data shapes
type Json = string | number | boolean | null | Json[] | { [k: string]: Json };`}
      </CodeBlock>

      <h2>Template Literal Types</h2>
      <CodeBlock language="ts" title="Compose string types">
{`type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Path   = '/users' | '/orders';
type Route  = \`\${Method} \${Path}\`;
// 'GET /users' | 'GET /orders' | 'POST /users' | 'POST /orders' | ...

type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type X = EventName<'click'>;   // 'onClick'`}
      </CodeBlock>

      <h2>as const &amp; Literal Widening</h2>
      <CodeBlock language="ts" title="Preserve exact values">
{`const roles = ['admin', 'user', 'guest'] as const;
// typeof roles is readonly ['admin', 'user', 'guest']

type Role = typeof roles[number];  // 'admin' | 'user' | 'guest'

const config = { retries: 3, mode: 'strict' } as const;
config.retries;   // 3, not number
config.mode;      // 'strict', not string`}
      </CodeBlock>

      <h2>using — Automatic Resource Cleanup</h2>
      <CodeBlock language="ts" title="TS 5.2+ — like try/finally, but declarative">
{`class Conn implements Disposable {
  [Symbol.dispose]() { this.close(); }         // sync cleanup
}
class Handle implements AsyncDisposable {
  async [Symbol.asyncDispose]() { await this.flush(); }
}

function query() {
  using conn = new Conn();        // disposed at end of BLOCK, even on throw
  return conn.run('select 1');
}

async function write() {
  await using h = new Handle();   // awaits asyncDispose on the way out
}
// Needs "lib": ["ESNext.Disposable"] (or ES2022+ with the polyfill).`}
      </CodeBlock>

      <h2>React + TS Essentials</h2>
      <CodeBlock language="tsx" title="Component and hook typing">
{`// Function component
interface ButtonProps { variant?: 'primary' | 'ghost'; onClick(): void; children: ReactNode }
export function Button({ variant = 'primary', onClick, children }: ButtonProps) { /* ... */ }

// Generic component
interface ListProps<T> { items: T[]; render: (item: T) => ReactNode }
export function List<T>({ items, render }: ListProps<T>) {
  return <ul>{items.map((i, k) => <li key={k}>{render(i)}</li>)}</ul>;
}

// Hook return convention
export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  const inc = useCallback(() => setCount(c => c + 1), []);
  return { count, inc } as const;      // preserves literal keys
}

// Event handlers
onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
onClick={(e: MouseEvent<HTMLButtonElement>) => {}}

// ref — React 19: just another prop. forwardRef is deprecated.
interface InputProps extends ComponentPropsWithRef<'input'> { label: string }
function Input({ label, ref, ...rest }: InputProps) { return <input ref={ref} {...rest} />; }
// legacy: const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => ...)
//         note the BACKWARDS generic order: <RefType, PropsType>

// Context — React 19 renders the context itself as the provider
<ThemeContext value={theme}>{children}</ThemeContext>   // not .Provider

// useReducer typed
type Action = { type: 'inc' } | { type: 'set'; value: number };
function reducer(state: number, action: Action): number { /* ... */ }

// useState — annotate only when inference can't reach
const [user, setUser] = useState<User | null>(null);   // null alone infers 'null'
const [ids, setIds]   = useState<string[]>([]);        // [] alone infers 'never[]'

// useRef — three distinct shapes
const dom  = useRef<HTMLInputElement>(null);   // DOM ref -> .current readonly-ish
const box  = useRef<number>(0);                // mutable box -> .current writable
const tid  = useRef<ReturnType<typeof setTimeout> | null>(null);  // timers

// useContext — guarded pattern kills the "| undefined" at every call site
const Ctx = createContext<AuthValue | undefined>(undefined);
export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;                     // narrowed to AuthValue
}

// Props from an element, spread-friendly
type BtnProps = ComponentPropsWithoutRef<'button'> & { variant?: 'primary' };

// React 19 hooks
const [state, action, pending] = useActionState(fn, initialState);
const { pending: p } = useFormStatus();
const [optimistic, addOptimistic] = useOptimistic(items);`}
      </CodeBlock>

      <h2>Runtime Validation — Types Are Erased</h2>
      <CodeBlock language="ts" title="The boundary is where the compiler stops helping">
{`// ❌ THE HOLE. This compiles clean under strict, and checks NOTHING.
const data: User = await res.json();   // an ASSERTION, not a check
// res.json() and JSON.parse both return 'any', and 'any' is assignable to
// everything — so the annotation asks the compiler no question at all.
// Fails 3 components deep as "Cannot read properties of undefined".

// ✅ Cheapest fix, no library: annotate the boundary value 'unknown'.
const raw: unknown = await res.json();  // now you MUST narrow before use

// UNVALIDATED regardless of how you typed it:
//   fetch / res.json()   JSON.parse    process.env
//   form fields          URL + search params        localStorage
//   message queues       third-party SDK callbacks`}
      </CodeBlock>

      <CodeBlock language="ts" title="Schema as the single source of truth (Zod v4)">
{`import * as z from 'zod';

const UserSchema = z.object({
  id:    z.number().int().positive(),
  name:  z.string().min(1),
  email: z.email(),                 // v4 top-level. v3 was z.string().email()
  role:  z.enum(['admin', 'user']),
});

type User = z.infer<typeof UserSchema>;   // DERIVE it — never declare twice
// One declaration, two outputs: a runtime validator AND a static type.
// An interface next to a hand-written check is two things that drift.

// parse vs safeParse — the most common design mistake
UserSchema.parse(raw);      // THROWS ZodError. Use for invariants that should
                            // crash: env at startup, broken API contracts.
const r = UserSchema.safeParse(raw);   // discriminated union — no try/catch
if (r.success) r.data;      // typed + narrowed
else           r.error;     // ZodError, only available in this branch
// Rule of thumb: safeParse for humans, parse for programmer errors.

// z.infer is z.output. With .default()/.transform(), input ≠ output:
type In = z.input<typeof S>;   // what you hand TO the parser (form values)

// Objects STRIP unknown keys by default — z.strictObject() to reject them.
// z.coerce.number() for env/query strings; z.stringbool() for DEBUG="false".`}
      </CodeBlock>

      <InfoBox variant="tip" title="Validate at the edge, then trust internally">
        <p>
          Build a wall where data <em>enters</em> — HTTP responses, request bodies,{' '}
          <code>process.env</code>, forms, storage, queues. Behind that wall the static
          types are honest again and need no re-checking; that is what they are for.
          Parsing the same object at every layer is the failure mode of enthusiasm.
        </p>
        <p>
          Same discipline as Spring&rsquo;s <code>@Valid</code> + Bean Validation, from the
          opposite direction: Zod builds a schema value and derives the type; Bean
          Validation starts from the type and attaches constraints.
        </p>
      </InfoBox>

      <h2>Result Type — When Not to Throw</h2>
      <CodeBlock language="ts" title="Explicit success / failure">
{`type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

const Ok  = <T>(value: T): Result<T, never> => ({ ok: true,  value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

function parseEmail(raw: unknown): Result<string, string> {
  if (typeof raw !== 'string' || !raw.includes('@')) return Err('invalid');
  return Ok(raw);
}`}
      </CodeBlock>

      <h2>Modules &amp; Type-Only Imports</h2>
      <CodeBlock language="ts" title="Erased at compile time — required by esbuild/SWC">
{`import type { User } from './models';          // whole import is erased
import { type Config, createClient } from './client';  // inline type modifier
export type { User };

// declare module — merges into what the module EXPORTS. Nothing else.
declare module 'my-lib' {
  interface LibOptions { retries?: number }   // OK: my-lib exports LibOptions
}

// ⚠️ THE EXPRESS TRAP — the intuitive guess, and it SILENTLY DOES NOTHING.
declare module 'express' {
  interface Request { user?: User }
}
// It merges into express's own wrapper interface, not the Request that
// handlers actually receive (that one comes from express-serve-static-core).
// No error, no warning, and req.user still does not exist.

// ✅ Express.Request is reachable only through the GLOBAL namespace:
declare global {
  namespace Express {
    interface Request { user?: User }
  }
}
export {};   // declare global requires the file to be a module

// declare global — also the way to augment real globals
declare global {
  interface Window { analytics: { track(e: string): void } }
}

// namespace — LEGACY. Do not write new ones in app code.
// And a BARE 'declare namespace X' inside a module is a brand-new LOCAL
// declaration, never an augmentation — it compiles clean and does nothing.`}
      </CodeBlock>

      <h2>tsconfig Essentials</h2>
      <CodeBlock language="json" title="Strictness dial — turn it up">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    // On TS 6 'strict' already DEFAULTS to true — write it anyway, as
    // documentation and for older compilers. Only "strict": false opts out.
    "strict": true,                     // = the eight flags listed below
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "strictBuiltinIteratorReturn": true,
    "noImplicitThis": true,
    "useUnknownInCatchVariables": true,
    // NOT in the strict family: alwaysStrict now defaults to true on its own.
    "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined
    "noImplicitOverride": true,         // 'override' keyword required
    "isolatedModules": true,
    "verbatimModuleSyntax": true,       // import type is erased, plain import is not
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  }
}`}
      </CodeBlock>

      <h2>tsc CLI</h2>
      <CodeBlock language="bash" title="Type-check and diagnose">
{`tsc --noEmit                 # type-check only — this is your CI gate
tsc --watch --noEmit         # re-check on save
tsc --init                   # short, opinionated tsconfig (TS 5.9+ — the
                             #   old ~100-line commented file is gone)
tsc --showConfig             # print the FINAL merged config (after extends)
tsc --listFiles              # every file actually included — "why is this compiled?"
tsc --traceResolution        # why an import resolved (or didn't)
tsc --extendedDiagnostics    # where compile time is going
tsc --generateTrace out/     # perf trace, open in edge://tracing
tsc -b                       # build mode — respects project references`}
      </CodeBlock>

      <h2>TypeScript on Node — Strip vs Transform</h2>
      <CodeBlock language="ts" title="node app.ts runs — but only strips, and never checks">
{`// STRIPPING  = replace type syntax with whitespace. Needs NO type information.
//              Annotations, interfaces, type aliases, generics → erased. Runs.
// TRANSFORMING = emit JavaScript that was not in the source. Needs codegen.

// These three EMIT RUNTIME CODE, so there is nothing to delete:
enum Status { A, B }                       // → a real runtime object
class C { constructor(private x: number) {} }   // parameter property → assignment
namespace N { }                            // → an IIFE

$ node withenum.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]:
  TypeScript enum is not supported in strip-only mode

// Not three arbitrary gaps — one fact three times. Classify any feature as
// "type-only" or "emits code" and you can predict which side it lands on.

// Escape hatch (experimental): node --experimental-transform-types app.ts
// Better: don't use them. as-const objects over enum, ES modules over namespace.

// tsconfig — turn a STARTUP failure into a BUILD error:
{ "compilerOptions": { "erasableSyntaxOnly": true } }`}
      </CodeBlock>

      <InfoBox variant="danger" title="Node does not type-check. At all.">
        <p>
          Stripping requires no type information, and Node has no type checker.{' '}
          <code>const n: number = &quot;not a number&quot;</code> in a <code>.ts</code> file
          runs and prints <code>not a number</code>. Nothing warns, nothing fails.
        </p>
        <p>
          <strong>Native execution replaces your bundler, not your compiler.</strong>{' '}
          <code>tsc --noEmit</code> still has to live somewhere — CI, or at minimum your
          editor.
        </p>
      </InfoBox>

      <CodeBlock language="ts" title="Node + Express essentials">
{`npm i -D typescript @types/node @types/express   // Node/Express ship no types

// ── __dirname does not exist in ES modules (it is a CommonJS variable) ──
const here = import.meta.dirname;               // Node 20.11+ / 21.2+ — simplest
const self = import.meta.filename;
// Older / portable:
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Request is GENERIC: Request<Params, ResBody, ReqBody, Query> ──
app.get('/users/:id', (req: Request<{ id: string }>, res: Response) => {
  req.params.id;        // string — checked. req.params.nope is an error.
});
app.post('/users', (req: Request<unknown, unknown, { name: string }>, res) => {
  res.status(201).json({ name: req.body.name });
});
// ⚠️ req.body is a LIE until you validate it — that annotation is an assertion
//    about data that arrived over the network. Parse it with a schema.

// ── Add req.user: declare global, NOT declare module 'express' ──
declare global { namespace Express { interface Request { user?: User } } }
export {};

// ── Error middleware is identified by ARITY — four parameters ──
// Drop 'next' and it silently becomes ordinary middleware that never runs.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unknown error';
  res.status(500).json({ error: message });
});
// 'unknown', not 'Error' — anything can be thrown in JS, including strings.`}
      </CodeBlock>

      <h2>Reading Compiler Errors</h2>
      <CodeBlock language="text" title="Decode any diagnostic in ten seconds">
{`file.ts(6,7): error TS2345: Argument of type 'X' is not assignable to
                            parameter of type 'Y'.
              ^ where it GAVE UP (not always where the mistake is)

"Type A is not assignable to type B"
  B = what this position requires. A = what you supplied.
  The order carries the whole meaning — never read it backwards.

NESTED CHAINS: read BOTTOM-UP.
  error TS2322: Type '{ user: { age: string } }' is not assignable to 'Account'.
    The types of 'user.age' are incompatible between these types.   <- WHERE
      Type 'string' is not assignable to type 'number'.             <- WHAT
  The headline is the least useful line. Start at the deepest indent.

CODES WORTH KNOWING BY SIGHT
  TS2322  bad assignment                TS2345  bad argument
  TS2339  property does not exist       TS2353  excess property on a literal
  TS2561  ...same, with a "did you mean" suggestion — it is a typo
  TS7006  parameter implicitly 'any'    TS2741  required property is missing
  TS18046 value is 'unknown' — narrow it before use
  TS18048 value is possibly 'undefined' TS2367  comparison is always false
  TS2589  "excessively deep" — a recursive type has no working depth limit
  TS2636  a variance annotation (in/out) contradicts the declaration

FIRST MOVES WHEN STUCK
  1. Suspect the ANNOTATION, not just the value — the mistake is often
     in a type you declared several lines up.
  2. Narrowing vanished? Pull the value into a local const first.
  3. Conditional type resolving to 'never'? Its input can be 'never';
     wrap the check in [T] extends [U].
  4. tsc --showConfig / --listFiles when the error makes no sense at all.`}
      </CodeBlock>

      <h2>Gotchas That Bite</h2>
      <CodeBlock language="ts" title="Surprising-but-correct compiler behavior">
{`// 1. Excess property checks fire ONLY on fresh object literals
interface Opts { name: string }
const a: Opts = { name: 'x', extra: 1 };     // ERROR
const tmp = { name: 'x', extra: 1 };
const b: Opts = tmp;                          // OK — not a literal anymore

// 2. Structural typing: shape matches = type matches. No 'implements' needed.
class Dog { name = '' }  class Person { name = '' }
const d: Dog = new Person();                  // OK. Brand types to prevent this.

// 3. readonly is SHALLOW
const u: Readonly<{ tags: string[] }> = { tags: [] };
u.tags.push('x');                             // allowed! use ReadonlyArray

// 4. Optional (?) vs explicitly undefined
interface P { x?: number }
const p: P = { x: undefined };                // OK unless exactOptionalPropertyTypes

// 5. Index signatures don't guarantee presence
const m: Record<string, number> = {};
m.missing.toFixed();                          // compiles, crashes
// -> turn on noUncheckedIndexedAccess: value becomes number | undefined

// 6. Object.keys returns string[], not (keyof T)[] — by design, because
//    the object may structurally have MORE keys than its type declares.

// 7. Function param bivariance: method shorthand is bivariant (unsound),
//    property syntax is contravariant (checked) under strictFunctionTypes.
interface A { on(cb: (e: MouseEvent) => void): void }   // bivariant
interface B { on: (cb: (e: MouseEvent) => void) => void }  // strictly checked`}
      </CodeBlock>

      <h2>The Rules</h2>
      <InfoBox variant="success" title="Ten habits of type-safe code">
        <ol>
          <li>Prefer <code>unknown</code> over <code>any</code>.</li>
          <li>Prefer <code>satisfies</code> over <code>as</code>.</li>
          <li>Discriminated unions over structs of optionals.</li>
          <li>Brand IDs at the boundary; keep them branded through the app.</li>
          <li>Every switch on a discriminant closes with an <code>assertNever</code>.</li>
          <li>Turn on <code>noUncheckedIndexedAccess</code> and address the errors.</li>
          <li>Derive request/response types from the model via <code>Omit</code> /
              <code>Pick</code> instead of duplicating.</li>
          <li>Return <code>Result&lt;T,E&gt;</code> for expected failures; throw only
              for exceptional ones.</li>
          <li>Use type predicates (or a schema library) at every external boundary.</li>
          <li>Money is a typed value, not <code>number</code>. Dates are
              <code>Date</code>, not <code>string</code>.</li>
        </ol>
      </InfoBox>
    </LessonLayout>
  );
}
