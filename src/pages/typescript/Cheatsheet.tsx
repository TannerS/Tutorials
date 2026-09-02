import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function TypeScriptCheatsheet() {
  return (
    <GuideLayout
      title="TypeScript"
      kicker="FIELD GUIDE"
      glyph="🔷"
      tagline="The type system, generics, decorators, tsconfig, migration strategy, and the boundary where types are erased — TypeScript 5 through 6."
      meta={['TypeScript 5 → 6', 'React 19 + Node', '26 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples and the tsconfig walkthroughs."
      prev={{ path: '/typescript/node', label: 'TypeScript on Node' }}
      next={null}
    >
      <GuidePanel n={1} title="Primitives, Literals & Enums" accent="blue" glyph="🔤" span={2}>
        <GuideCode>{`string number boolean bigint symbol null undefined void never unknown any

type Status = 'draft' | 'published' | 'archived';   // union
type WithId<T> = T & { id: string };                 // intersection
type Pair = [string, number];
type Named = readonly [name: string, age: number];   // labeled tuple
Array<T> | T[] | ReadonlyArray<T> | readonly T[]

const roles = ['admin', 'user'] as const;    // readonly ['admin', 'user']
type Role = typeof roles[number];            // 'admin' | 'user'`}</GuideCode>
        <GuideCode>{`const a = 'GET';               // type 'GET'   — const stays narrow
let   b = 'GET';               // type string  — let widens on reassignment
const cfg = { method: 'GET' }; // cfg.method is string — PROPERTIES widen even inside a const

type Method = 'GET' | 'POST';
const m1: Method = a;          // OK
const m2: Method = cfg.method; // ERROR — string is not assignable to Method

const cfg2 = { method: 'GET' as const };   // fix 1: narrow just the property
const cfg3 = { method: 'GET' } as const;   // fix 2: freeze the whole object`}</GuideCode>
        <GuideCode>{`enum Direction { Up, Down }        // numeric — ANY number is assignable
const enum Fast { A = 1 }          // inlined; breaks under isolatedModules

// Prefer: zero runtime cost, exhaustive, same autocomplete
const STATUS = { Active: 'ACTIVE', Archived: 'ARCHIVED' } as const;
type Status2 = typeof STATUS[keyof typeof STATUS];   // 'ACTIVE' | 'ARCHIVED'`}</GuideCode>
        <GuideRules items={[
          'A literal value is its own type: "yes" is a type as well as a value.',
          'as const freezes an object or array to its literal, readonly shape — the workhorse for deriving a union from real data.',
          'const only freezes the binding, not the object contents — a property initialized with a string literal still widens to string. This is the usual reason a config object mysteriously stops matching a literal union.',
          'Numeric enums are not exhaustive and emit real runtime JS; a const enum inlines under tsc but degrades to the same runtime object as a plain enum under isolatedModules (Vite, esbuild, SWC) — verified: tsc --isolatedModules emits an IIFE instead of inlining. Reach for an as-const object or a plain union instead.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="any / unknown / never / void" accent="purple" glyph="❓">
        <GuideCode>{`any      disables checking — infects everything derived from it. Ban it.
unknown  "I do not know yet" — must narrow before you can touch it
never    no valid value: a function that always throws, an impossible branch
void     "ignore my return" — not the same as undefined

let u: unknown = JSON.parse(s);
u.whatever;                 // ERROR — narrow first
if (typeof u === 'string') u.trim();   // OK

function fail(m: string): never { throw new Error(m); }
const cb: () => void = () => 42;       // OK — void discards the return
const cd: () => undefined = () => 42;  // ERROR`}</GuideCode>
        <GuideRules items={['any compiles clean and crashes at runtime; unknown forces a check first — that difference is the whole argument for banning any.']} />
      </GuidePanel>

      <GuidePanel n={3} title="Interfaces, Type Aliases & Shapes" accent="green" glyph="🧱" span={2}>
        <GuideCode>{`interface User {
  id: string;
  displayName?: string;              // optional
  readonly createdAt: Date;          // readonly
  metadata: Record<string, string>;  // arbitrary keys
}
type Fn = (x: number) => number;             // function type alias
interface Fn2 { (x: number): number }         // callable interface

// ONLY interfaces: declaration merging
interface Box { w: number }
interface Box { h: number }          // -> { w, h }

// ONLY type aliases: unions, tuples, conditionals, mapped types
type Id = string | number;
type Elem<T> = T extends (infer U)[] ? U : never;`}</GuideCode>
        <GuideDefs items={[
          ['interface', 'public and extensible object shapes, library types — merges, and extends caches faster than an intersection'],
          ['type', 'unions, tuples, mapped and conditional types — anything computed'],
          ['both can', 'plain object shapes, generics, and extending (interface extends or & intersection)'],
          ['module augmentation', 'merges into what a module EXPORTS, e.g. declare module "my-lib" { interface Opts {...} }'],
        ]} />
        <GuideRules items={['The Request type in Express is not exported — it lives on a global namespace. declare module "express" compiles clean and silently does nothing; use declare global instead (see the Modules panel).']} />
      </GuidePanel>

      <GuidePanel n={4} title="Deriving Types & Utility Types" accent="amber" glyph="🧮" span={2}>
        <GuideCode>{`interface User { id: string; age: number; tags: string[] }
keyof User             // 'id' | 'age' | 'tags'
User['age']             // number
User['tags'][number]    // string — element type of an array

const config = { retries: 3, mode: 'strict' } as const;
typeof config           // { readonly retries: 3; readonly mode: 'strict' }
keyof typeof config     // 'retries' | 'mode'   <- the workhorse combo`}</GuideCode>
        <GuideTable
          head={['Utility Type', 'Behavior']}
          rows={[
            ['Partial / Required / Readonly<T>', 'toggle optional, required, or readonly on every prop'],
            ['Pick<T, K> / Omit<T, K>', 'keep or drop the listed keys'],
            ['Record<K, V>', '{ [key: K]: V }'],
            ['Exclude<T, U> / Extract<T, U>', 'union minus U / union intersected with U'],
            ['NonNullable<T>', 'strip null and undefined'],
            ['ReturnType<F> / Parameters<F>', 'infer a return type / a tuple of param types'],
            ['InstanceType<C>', 'instance type of a class constructor'],
            ['ConstructorParameters<C>', 'tuple of the parameter types of a class constructor'],
            ['ThisParameterType<F> / OmitThisParameter<F>', 'extract, or strip, the declared this type of a function'],
            ['ThisType<T>', 'contextual this inside an object literal — a type-checking hint, no runtime output'],
            ['Awaited<P>', 'unwrap a Promise, recursively'],
            ['Uppercase / Lowercase / Capitalize<S>', 'compiler string intrinsics'],
            ['NoInfer<T>', 'TS 5.4+ — excludes this position from inference'],
          ]}
        />
        <GuideRules items={[
          'Two different typeof: value position is the plain JS runtime operator; type position is the TS operator that lifts a value into its type.',
          'Sculpt request/response variants — a CreateRequest, an UpdateRequest, a list-view projection — with Omit and Pick off one canonical model instead of hand-duplicating the same fields across six interfaces.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Classes — Modifiers & Patterns" accent="pink" glyph="🏛️" span={2}>
        <GuideCode>{`class Account {
  static readonly VERSION = '2.0';
  #secret = 'runtime-private';       // ES private — enforced by the runtime
  private pin = '1234';              // TS private — compile-time check only
  protected balance = 0;
  readonly id: string;
  ready!: string;                    // definite assignment

  constructor(public owner: string, private rate = 0.05) {  // parameter properties
    this.id = crypto.randomUUID();
  }
  get formatted() { return \`$\${this.balance}\`; }
  set deposit(n: number) { this.balance += n; }
  accessor live = 0;                 // auto-accessor
}

abstract class Shape { abstract area(): number; }
class Circle extends Shape implements Serializable {
  override area() { return Math.PI; }   // required under noImplicitOverride
}

class Db {                            // singleton
  private static instance: Db | null = null;
  private constructor() {}
  static get(): Db { return (Db.instance ??= new Db()); }
}`}</GuideCode>
        <GuideRules items={[
          'A #private field is enforced by the runtime; a private field is erased at compile time and a JavaScript caller can still reach it.',
          'Structural typing still applies to classes: a shape match is enough, implements is not required to satisfy a type.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Decorators — Stage 3 vs Legacy" accent="cyan" glyph="🎀" span={2}>
        <GuideCode>{`// Stage 3 standard (TS 5+, no flag): (value, context)
function log<T extends (...a: any[]) => any>(m: T, c: ClassMethodDecoratorContext): T {
  return function (this: any, ...args: any[]) {
    console.log(String(c.name), args);
    return m.apply(this, args);
  } as T;
}

class Api {
  @log            // applied LAST  (outermost — its code runs first)
  @retry(3)       // applied FIRST (innermost)
  async fetch() {}
}

// Legacy (Angular / NestJS / TypeORM): (target, key, descriptor)
// tsconfig: "experimentalDecorators": true, "emitDecoratorMetadata": true`}</GuideCode>
        <GuideDefs items={[
          ['context object', '{ kind, name, static, private, access, addInitializer, metadata }'],
          ['kinds', 'class, method, getter, setter, field, accessor'],
          ['class decorator', 'returning a subclass replaces the class being decorated'],
        ]} />
        <GuideRules items={['Only the legacy system has PARAMETER decorators — the reason constructor-injection DI still needs the flag. It is all-or-nothing per project.']} />
      </GuidePanel>

      <GuidePanel n={7} title="Decorator Kinds & Context" accent="red" glyph="🧩" span={2}>
        <GuideCode>{`// ctx.kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'
// ctx also carries: name, static, private, access, addInitializer, metadata

function withTimestamp<T extends new (...a: any[]) => object>(t: T) {
  return class extends t { createdAt = new Date(); };  // class decorator: return a subclass to replace it
}

function sealed(t: Function, ctx: ClassDecoratorContext) {
  ctx.addInitializer(function (this: any) { Object.seal(this); }); // per-INSTANCE work — the decorator body runs once
}

function uppercase(_: undefined, ctx: ClassFieldDecoratorContext<any, string>) {
  return (initial: string) => initial.toUpperCase();     // field decorator: transforms the initial value only
}

@sealed
class Product {
  @uppercase sku = 'abc';           // stored as 'ABC'
  @observable accessor price = 0;   // accessor: hooks EVERY read and write, not just init
}`}</GuideCode>
        <GuideRules items={[
          'A class decorator runs once, when the class statement is evaluated — ctx.addInitializer() is how it reaches into each new instance instead.',
          'A plain field decorator only ever sees the initial value; the accessor keyword synthesizes a getter/setter pair specifically so a decorator can intercept every read and write, not just construction.',
          'Same (value, context) shape as the Stage 3 panel above — this is one level deeper into what the context object actually carries.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Generics" accent="blue" glyph="🧬">
        <GuideCode>{`function first<T>(xs: T[]): T | undefined { return xs[0]; }
function len<T extends { length: number }>(x: T) { return x.length; }
function get<T, K extends keyof T>(o: T, k: K): T[K] { return o[k]; }
type Box<T = string> = { value: T };   // default type param

// In .tsx, <T> alone parses as JSX — disambiguate with a trailing comma:
const identity = <T,>(x: T): T => x;

// Variance annotations (4.7+) — document and speed up checking
interface Producer<out T> { get(): T }         // covariant
interface Consumer<in  T> { set(v: T): void }  // contravariant`}</GuideCode>
        <GuideRules items={[
          'Naming convention: T for type, K for key, V for value, E for element or error, R for return, P for props.',
          'extends on a generic parameter means at least this shape, not class inheritance.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Variance — The Two Unsound Holes" accent="purple" glyph="⚖️" span={2}>
        <GuideCode>{`class Animal { name = ''; }
class Dog extends Animal { bark() {} }

// HOLE 1 — arrays are covariant AND mutable. tsc allows this cleanly:
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;      // allowed — Dog[] assignable to Animal[]
animals.push(new Animal());          // allowed — dogs now holds a non-Dog 💥
// readonly Dog[] is the fix: covariance is sound once nothing writes back.

// HOLE 2 — method syntax is bivariant; property syntax is contravariant (checked).
interface A { handle(x: Dog): void }       // method   — unsound, no error below
interface B { handle: (x: Dog) => void }   // property — correctly rejected

const a: A = { handle: (x: Dog & { id: 1 }) => {} };   // compiles — verified tsc 6.0.3
const b: B = { handle: (x: Dog & { id: 1 }) => {} };   // TS2322  — verified tsc 6.0.3`}</GuideCode>
        <GuideRules items={[
          'Function parameters are normally contravariant — a handler may accept something WIDER than required, never something narrower. Arrays and method-syntax callbacks are the two deliberate, long-standing exceptions.',
          'If a callback parameter type needs to be checked for real, declare the field with property syntax (handle: (x) => void), not method syntax (handle(x): void) — strictFunctionTypes only applies to the property form.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Discriminated Unions & Narrowing" accent="green" glyph="🔀" span={2}>
        <GuideCode>{`type RemoteData<T> =
  | { kind: 'idle' } | { kind: 'loading' }
  | { kind: 'success'; data: T } | { kind: 'error'; error: Error };

function render<T>(rd: RemoteData<T>) {
  switch (rd.kind) {
    case 'idle':    return null;
    case 'success': return rd.data;     // narrowed to the success branch
    default: { const _: never = rd; return _; }   // exhaustiveness check
  }
}

function isUser(v: unknown): v is User {          // type predicate
  return typeof v === 'object' && v !== null && 'id' in v;
}
function assertUser(v: unknown): asserts v is User {  // assertion signature
  if (!isUser(v)) throw new Error('not a user');
}

function assertNever(x: never): never {          // reusable version of the idiom above
  throw new Error(\`Unhandled case: \${JSON.stringify(x)}\`);
}`}</GuideCode>
        <GuideDefs items={[
          ['typeof', 'primitives only, and typeof null is "object"'],
          ['instanceof', 'classes and built-ins, e.g. err instanceof Error'],
          ['in operator', 'does this key exist? "radius" in shape'],
          ['truthiness', 'beware — excludes empty string and 0, not just null and undefined'],
          ['equality / switch', 'narrows both sides of ===, and every case of a discriminant switch'],
        ]} />
        <GuideRules items={[
          'A switch on a discriminant should always close with a never assignment in default — the compiler then flags the day a new variant is added and left unhandled.',
          'A reusable assertNever(x: never) helper turns that inline never-assignment idiom into a one-time investment — swap it in once a project reuses the pattern three or more times.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Narrowing Evaporates at a Closure Boundary" accent="amber" glyph="⏳" span={2}>
        <GuideCode>{`let label: string | null = 'x';
function reset() { label = null; }        // doesn't even need to be CALLED

if (label !== null) {
  label.toUpperCase();                     // narrowed here
  setTimeout(() => label.toUpperCase());
  //                ~~~~~ TS18047: 'label' is possibly 'null' — verified tsc 6.0.3
}

// Same failure for a narrowed PROPERTY inside any callback:
if (box.v) {
  run(() => box.v.toUpperCase());
  //         ~~~~~ TS18048: 'box.v' is possibly 'undefined'
}

// Fix both: copy into a const FIRST, then narrow the const.
const v = label;
if (v !== null) setTimeout(() => v.toUpperCase());   // OK — const can't be reassigned`}</GuideCode>
        <GuideRules items={[
          'Narrowing is control-flow analysis, and a callback has no knowable execution time — TS cannot prove the value is still narrowed whenever the callback eventually runs, so it discards the narrowing at the function boundary.',
          'The trigger is the DECLARATION, not an actual reassignment: verified on tsc 6.0.3, a let that is never reassigned anywhere in the file still errors inside the closure. Only const survives, because only const is un-reassignable by construction.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="satisfies, Branding & Assertions" accent="pink" glyph="🛡️" span={2}>
        <GuideCode>{`const routes = {
  '/orders':     listOrders,
  '/orders/:id': getOrder,
} satisfies Record<string, RouteHandler>;
// typeof routes keeps the literal key set, not widened to Record<string, ...>

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };
type UserId  = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;
function updateOrder(id: OrderId) {}
updateOrder(userId);   // ERROR — UserId is not assignable to OrderId

const UserId = {                       // brand at the ONE edge it enters
  parse:  (raw: string): UserId => { if (!/^usr_/.test(raw)) throw new Error('bad id'); return raw as UserId; },
  unsafe: (raw: string): UserId => raw as UserId,   // trusted input / tests only
};`}</GuideCode>
        <GuideCode>{`const el = document.getElementById('x') as HTMLInputElement;  // as — a promise
value!                 // non-null assertion — crashes if the promise was wrong
// @ts-expect-error fails when the error goes away; @ts-ignore never does`}</GuideCode>
        <GuideRules items={[
          'Preference order, best to worst: narrowing or a type predicate, then satisfies, then as, then the non-null assertion, then a double assertion through unknown, then any.',
          'Brand an ID at the one function that parses it, and keep it branded through the rest of the application — a small parse/unsafe factory object, like UserId above, is the pattern at scale.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Mapped, Conditional & Template Literal Types" accent="cyan" glyph="🌀" span={2}>
        <GuideCode>{`type Getters<T> = { [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K] };
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };   // strip readonly
type Concrete<T> = { [K in keyof T]-?: T[K] };            // strip optional

type ElementOf<T> = T extends (infer U)[] ? U : never;    // infer
type PromiseValue<T> = T extends Promise<infer U> ? U : T;

// distributive: a naked type param distributes over a union
type ToArray<T> = T extends any ? T[] : never;
type Z = ToArray<string | number>;    // string[] | number[], not one array type
type NoDist<T> = [T] extends [any] ? T[] : never;   // opt out with a tuple wrap

type Method = 'GET' | 'POST';
type Route  = \`\${Method} /users\`;    // 'GET /users' | 'POST /users'`}</GuideCode>
        <GuideRules items={[
          'never is the empty union, so a conditional distributed over it never runs — IsNever<never> resolves to never, not true, unless the check is wrapped as [T] extends [never].',
          'Recursive conditional types such as DeepPartial and Flatten resolve by unwrapping one layer per recursive call.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="using & Result<T, E>" accent="red" glyph="🧹" span={2}>
        <GuideCode>{`class Conn implements Disposable {
  [Symbol.dispose]() { this.close(); }
}
function query() {
  using conn = new Conn();     // disposed at end of block, even on throw
  return conn.run('select 1');
}
async function write() {
  await using h = new Handle();   // awaits asyncDispose on the way out
}
// needs "lib": ["ESNext.Disposable"]

type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const Ok  = <T>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });`}</GuideCode>
        <GuideRules items={[
          'using is TS 5.2+, sugar over try and finally for disposal — declarative cleanup even when the block throws.',
          'Result<T, E> makes an expected failure part of the return type instead of an invisible throw.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="React + TS Essentials" accent="blue" glyph="⚛️" span={2}>
        <GuideCode>{`interface ButtonProps { variant?: 'primary' | 'ghost'; onClick(): void; children: ReactNode }
export function Button({ variant = 'primary', onClick, children }: ButtonProps) {}

interface ListProps<T> { items: T[]; render: (item: T) => ReactNode }   // generic component
export function List<T>({ items, render }: ListProps<T>) {
  return <ul>{items.map((i, k) => <li key={k}>{render(i)}</li>)}</ul>;
}

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial);
  return { count, inc: () => setCount(c => c + 1) } as const;   // preserves literal keys
}

// React 19: ref is just another prop — forwardRef no longer necessary (not yet @deprecated)
function Input({ label, ref, ...rest }: InputProps) { return <input ref={ref} {...rest} />; }
<ThemeContext value={theme}>{children}</ThemeContext>   // the provider is the context now`}</GuideCode>
        <GuideDefs items={[
          ['useState<T>(null)', 'annotate only when inference cannot reach — an empty array alone infers never[]'],
          ['useRef<HTMLInputElement>(null)', 'a DOM ref, read-mostly current'],
          ['useRef<number>(0)', 'a mutable box, writable current'],
          ['useContext guard', 'throw inside the hook when the context is undefined — removes the union with undefined from every call site'],
          ['event handlers', 'e: ChangeEvent<HTMLInputElement>, e: MouseEvent<HTMLButtonElement>, typed per element'],
        ]} />
        <GuideRules items={[
          'Model a useReducer action as a discriminated union, the same way any other domain event is modeled.',
          'React.FC is worth avoiding outright: it used to imply children were always present, and it cannot express a generic component the way a plain function can.',
          'Legacy forwardRef<RefType, PropsType> takes the ref type first — backwards from the props-first convention used everywhere else.',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="React 19 — Hooks Deep Dive & Actions" accent="purple" glyph="🪝" span={2}>
        <GuideCode>{`// useRef: the zero-argument overload is GONE in @types/react 19
const bad = useRef();          // TS2554: Expected 1 arguments, but got 0 — verified
const ref = useRef<HTMLInputElement>(null);   // required arg, DOM ref
const count = useRef<number>(0);              // required arg, instance ref
// MutableRefObject<T> is superseded too — RefObject<T>.current is writable
// unconditionally now, so annotate every ref as RefObject<T>.

function useLocalStorage<T>(key: string, initial: T) {
  const [stored, setStored] = useState<T>(initial);
  const setValue = (v: T) => setStored(v);
  return [stored, setValue] as const;    // AS CONST — a tuple, not an array union
}                                          // without it, destructuring order is untyped

interface TextInputProps extends ComponentPropsWithRef<'input'> { label: string }
// ComponentPropsWithRef already includes a correctly-typed ref (React 19: no forwardRef).
// Use ComponentPropsWithoutRef when the component does NOT forward its ref.

async function submitAction(prev: FormState, data: FormData): Promise<FormState> {
  const name = data.get('name') as string;
  return name ? { message: 'Saved!', errors: {} } : { message: '', errors: { name: 'Required' } };
}
const [state, formAction, isPending] = useActionState(submitAction, initial);
// the type of state is inferred from the return type of submitAction — nothing to annotate`}</GuideCode>
        <GuideRules items={[
          'The useRef zero-argument overload and MutableRefObject are both gone from the modern typings — pass an explicit initial value and annotate every ref as RefObject<T>.',
          'as const on a [value, setter] custom-hook return turns it into a proper tuple type instead of a plain array with untyped destructuring order.',
          'useActionState signature is fixed — (prevState, formData) => Promise<State> — get that shape right and the rest of the typing follows for free.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Runtime Validation — Types Are Erased" accent="green" glyph="🕳️" span={2}>
        <GuideCode>{`// THE HOLE. Compiles clean under strict, and checks nothing.
const data: User = await res.json();   // an assertion, not a check

// Cheapest fix: annotate the boundary value unknown, then it must be narrowed.
const raw: unknown = await res.json();

import * as z from 'zod';
const UserSchema = z.object({
  id: z.number().int().positive(),
  email: z.email(),                 // v4 top-level; v3 was z.string().email()
});
type User = z.infer<typeof UserSchema>;   // derive it, never declare it twice

UserSchema.parse(raw);        // throws ZodError — for invariants that should crash
const r = UserSchema.safeParse(raw);   // a discriminated union, no try/catch
if (r.success) r.data; else r.error;`}</GuideCode>
        <GuideRules items={[
          'Unvalidated no matter how it is typed: fetch and res.json, JSON.parse, process.env, form fields, URL and search params, localStorage, message queues, third-party callbacks.',
          'safeParse for human input that may be wrong; parse for a broken invariant that should crash the process.',
          'Build the wall where data enters. Behind it the static types are honest again — re-parsing the same object at every layer is the failure mode of enthusiasm.',
          'The same discipline as Bean Validation in Spring, from the opposite direction: Zod builds a schema value and derives the type from it.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Modules, tsconfig & tsc CLI" accent="amber" glyph="🧰" span={2}>
        <GuideCode>{`import type { User } from './models';          // whole import erased
import { type Config, createClient } from './client';  // inline type modifier

// THE EXPRESS TRAP — merges into the wrapper interface Express itself
// exports, not the Request handlers actually receive. No error, no warning.
declare module 'express' { interface Request { user?: User } }   // does nothing

// reachable only through the global namespace:
declare global { namespace Express { interface Request { user?: User } } }
export {};   // declare global requires the file to be a module`}</GuideCode>
        <GuideCode>{`{
  "strict": true,                     // = 8 flags, and defaults true on TS 6+ anyway
  "noUncheckedIndexedAccess": true,   // arr[i] becomes T | undefined
  "noImplicitOverride": true,
  "verbatimModuleSyntax": true,       // import type is erased, a plain import is not
  "moduleResolution": "bundler"
}
tsc --noEmit          # type-check only, the CI gate
tsc --init             # short config since TS 5.9+, the old ~100-line file is gone
tsc --showConfig      # print the final merged config
tsc --listFiles       # every file actually included`}</GuideCode>
        <GuideRules items={[
          'declare module merges into what a module EXPORTS. A bare declare namespace inside a module is a brand-new local declaration, not an augmentation, and it compiles clean while doing nothing.',
          'declare global itself requires the file to already be a module (an import or export somewhere) — that is why the Express fix ends with export {}. A demo that augments interface Window instead only appears to work because the local declaration shadows the DOM one; it never reaches the real global.',
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="tsconfig — target, module, jsx & tsc --init" accent="pink" glyph="🛠️" span={2}>
        <GuideCode>{`{
  // "target": "ES2020"  — safe baseline: ?., ??, BigInt
  // "target": "ES2022"  — adds top-level await, .at(), error.cause
  "target": "ESNext",       // latest syntax — only if a bundler downlevels it

  "module": "ESNext",       // for a bundler          | "moduleResolution": "bundler"
  // "module": "NodeNext",  // Node's own ESM/CJS      | "moduleResolution": "nodenext"

  "jsx": "react-jsx"        // React 17+ automatic runtime — no "import React" needed
}`}</GuideCode>
        <GuideCode>{`tsconfig.json        // root — "files": [], only "references" the two below
tsconfig.app.json    // src/** — browser target, DOM lib
tsconfig.node.json   // vite.config.ts — Node target, no DOM lib
// vite.config.ts runs in Node during the build, src/ runs in the browser —
// one shared config cannot accurately type-check both.`}</GuideCode>
        <GuideCode>{`$ tsc --init                       # TS 5.9+: short, opinionated — not the old wall
{
  "module": "nodenext", "target": "esnext", "jsx": "react-jsx",
  "strict": true, "verbatimModuleSyntax": true, "isolatedModules": true,
  "noUncheckedIndexedAccess": true,      // ← scaffolded on by default now
  "exactOptionalPropertyTypes": true,    // ← scaffolded on by default now
  "skipLibCheck": true, "moduleDetection": "force"
}
// verified: this repo's own tsc --init output, TypeScript 6.0.3`}</GuideCode>
        <GuideRules items={[
          'moduleResolution must match how the code actually runs, not how it is written — mismatching bundler against nodenext produces a cannot-find-module error that only shows up at runtime, never at the type-check step.',
          'A tutorial tsconfig with target: es2016 and 100 commented-out lines predates 5.9 — noUncheckedIndexedAccess and exactOptionalPropertyTypes now ship on by default.',
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="strict — What Each Flag Actually Catches" accent="cyan" glyph="🔒" span={2}>
        <GuideCode>{`// TS 6: a tsconfig that never mentions strict is already strict — the old
// default flipped. Omitting it used to mean loose; now it means strict.
{ "compilerOptions": {} }                    // ← strict, by default
{ "compilerOptions": { "strict": false } }   // ← the only way out now

const x: string = null;      // Error — strictNullChecks
function f(a) { return a; }  // Error — noImplicitAny`}</GuideCode>
        <GuideTable
          head={['Flag', 'Catches']}
          rows={[
            ['strictNullChecks', 'null/undefined must be handled explicitly'],
            ['noImplicitAny', 'an untyped parameter errors instead of silently becoming any'],
            ['strictFunctionTypes', 'rejects unsound function-parameter assignment'],
            ['strictPropertyInitialization', 'a class field must be set in the constructor'],
            ['strictBindCallApply', '.call/.bind/.apply arguments checked against the real signature'],
            ['noImplicitThis', 'this inside a function must have a known type'],
            ['useUnknownInCatchVariables', 'catch (e) types e as unknown, not any'],
            ['strictBuiltinIteratorReturn', 'built-in IteratorResult typed precisely'],
          ]}
        />
        <GuideRules items={[
          'That is the complete list — eight flags. alwaysStrict is the one everybody miscounts as a ninth member: it emits "use strict" and defaults to true independently, not as part of the strict family.',
          'Verify the real list at any time with tsc --showConfig rather than trusting a blog post from memory.',
        ]} />
      </GuidePanel>

      <GuidePanel n={21} title="tsconfig — Interop, Paths & Housekeeping" accent="red" glyph="🧭" span={2}>
        <GuideCode>{`interface Options { timeout?: number; }
const a: Options = {};                       // "not provided" — OK either way
const b: Options = { timeout: undefined };    // OK without the flag, ERROR with it

// verified — tsc 6.0.3, --exactOptionalPropertyTypes:
// error TS2375: Type '{ timeout: undefined; }' is not assignable to type
// 'Options' with 'exactOptionalPropertyTypes: true'.`}</GuideCode>
        <GuideTable
          head={['Flag', 'Why it exists']}
          rows={[
            ['exactOptionalPropertyTypes', 'a question-mark property and one explicitly set to undefined stop being the same type — code that checks presence with the in operator gets checked correctly'],
            ['esModuleInterop', 'adds interop helpers so a default import works against a CJS package with no real default export'],
            ['skipLibCheck', 'skips type-checking .d.ts files, including inside node_modules — one broken dependency typing cannot break the whole build'],
            ['isolatedModules / verbatimModuleSyntax', 'required by any single-file transpiler (Vite, esbuild, SWC, Babel) — they cannot tell a type-only export from a value one without the syntax saying so'],
            ['paths + baseUrl', 'type resolution only — the bundler needs the matching alias too, or type-checking passes while the build cannot find the module. baseUrl is removed in TS 7; keep paths root-relative'],
            ['include / exclude', 'the top cause of a cannot-find-module error on a file that visibly exists — it was never in the tsc file list. tsc --listFiles shows the real set'],
            ['noUnusedLocals / noUnusedParameters / noFallthroughCasesInSwitch / noImplicitReturns', 'code-quality checks, not part of strict — cheap to enable, each catches a real copy-paste bug'],
          ]}
        />
        <GuideRules items={['None of this panel is part of strict — these are the flags that get discovered one broken build at a time instead of being scaffolded by default.']} />
      </GuidePanel>

      <GuidePanel n={22} title="TypeScript on Node — Strip vs Transform" accent="blue" glyph="⚠️" span={2}>
        <GuideCode>{`// STRIPPING = replace type syntax with whitespace, needs no type info. Runs.
// TRANSFORMING = emit JS that was not in the source, needs codegen.

enum Status { A, B }                     // emits runtime code — nothing to delete
class C { constructor(private x: number) {} }   // parameter property becomes an assignment

$ node withenum.ts
SyntaxError [ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX]:
  TypeScript enum is not supported in strip-only mode

// tsconfig — turn a startup failure into a build error:
{ "compilerOptions": { "erasableSyntaxOnly": true } }`}</GuideCode>
        <GuideRules items={[
          'Node has no type checker. const n: number = "not a number" in a .ts file runs and prints the string — nothing warns.',
          'Native execution replaces the bundler, not the compiler — tsc --noEmit still has to live somewhere, in CI or at minimum the editor.',
          'req.body is a lie until it is validated — an Express Request annotation is an assertion about data that arrived over the network, not a check.',
        ]} />
      </GuidePanel>

      <GuidePanel n={23} title="Reading Compiler Errors" accent="purple" glyph="🩺" span={2}>
        <GuideCode>{`file.ts(6,7): error TS2345: Argument of type 'X' is not assignable to
                            parameter of type 'Y'.

"Type A is not assignable to type B"
  B = what this position requires. A = what was supplied. Never read it backwards.

NESTED CHAINS: read bottom-up — the deepest indent is what actually broke.`}</GuideCode>
        <GuideTable
          head={['Code', 'Meaning']}
          rows={[
            ['TS2322 / TS2345', 'bad assignment / bad argument'],
            ['TS2339 / TS2353', 'property does not exist / excess property on a literal'],
            ['TS7006 / TS2741', 'parameter implicitly any / a required property is missing'],
            ['TS18046 / TS18048', 'value is unknown, narrow it / value is possibly undefined'],
            ['TS2554', 'expected N arguments, got M — e.g. useRef() after the zero-argument overload was removed'],
            ['TS2341', 'a private property or method accessed from outside its declaring class'],
            ['TS2589', 'excessively deep — a recursive type has no working depth limit'],
          ]}
        />
        <GuideRules items={[
          'Suspect the annotation first — the mistake is often several lines above the value that failed.',
          'A conditional type resolving to never can mean the input itself is never; wrap the check as [T] extends [U].',
        ]} />
      </GuidePanel>

      <GuidePanel n={24} title="Gotchas That Bite" accent="green" glyph="🪤" span={2}>
        <GuideCode>{`interface Opts { name: string }
const a: Opts = { name: 'x', extra: 1 };   // ERROR — excess property check
const tmp = { name: 'x', extra: 1 };
const b: Opts = tmp;                        // OK, no longer a fresh literal

class Dog { name = '' } class Person { name = '' }
const d: Dog = new Person();                // OK — structural typing, no implements needed

const u: Readonly<{ tags: string[] }> = { tags: [] };
u.tags.push('x');                           // allowed — readonly is shallow

const m: Record<string, number> = {};
m.missing.toFixed();                        // compiles, crashes — noUncheckedIndexedAccess fixes it

function onClick(cb: Function) { cb('unexpected', 42); }   // Function = "callable", arity unchecked

function process(data: {}) {}
process('a string'); process(42);           // both compile — {} means "not null, not undefined"
process(null);                               // ERROR — null/undefined are the only things {} rejects`}</GuideCode>
        <GuideRules items={[
          'Object.keys returns string[], not (keyof T)[] — an object may structurally carry more keys than its type declares.',
          'Method shorthand such as on(cb) {} is bivariant and effectively unchecked; the property form on: (cb) => void is checked strictly under strictFunctionTypes.',
          'Function and {} both look like meaningful constraints and are not: Function accepts any callable with any arity, and {} accepts every value except null and undefined. Write the exact signature, or reach for Record<string, unknown>.',
        ]} />
      </GuidePanel>

      <GuidePanel n={25} title="Migration Strategy — Incremental, Ratchet, Phased" accent="amber" glyph="🪜" span={3}>
        <GuideCode>{`// Incremental over Big Bang: one file at a time, ship continuously —
// a Big Bang PR is a merge-conflict magnet nobody can meaningfully review.
{
  "compilerOptions": {
    "allowJs": true,      // .js and .ts coexist
    "checkJs": false,     // don't type-check the .js files yet
    "strict": false,      // MUST be explicit now — TS 6 defaults strict to true
    "noImplicitAny": false
  }
}
// Finishing the migration means DELETING that strict line, not flipping it to true.`}</GuideCode>
        <GuideCode>{`// @ts-ignore              — silences forever, nobody notices when it goes stale
// @ts-expect-error - unstableApi lacks types until v3.0
//                    — errors again the moment the suppression is no longer needed

const dataAny: any = await fetchData();                 // stage 1 — unblock
const dataUnknown: unknown = await fetchData();          // stage 2 — forces narrowing
interface ApiResponse { users: User[]; total: number }
const dataTyped: ApiResponse = await fetchData();        // stage 3 — real type

// CI ratchet: forbid the any-count / unconverted-file count from increasing —
// never demand it hit zero in one PR.`}</GuideCode>
        <GuideDefs items={[
          ['1 — Infrastructure', 'tsconfig + allowJs, ESLint, tsc --noEmit in CI'],
          ['2 — Shared types first', 'API types and utilities convert before their callers — every importer benefits without being touched'],
          ['3 — Bottom-up', 'leaf components next, then inward toward the coupled core'],
          ['4 — Enforce & tighten', 'allowJs: false, delete the explicit strict: false, block new .js files in CI'],
        ]} />
        <GuideRules items={[
          'Convert shared types and utilities before the components that use them — that is the one ordering decision that pays off immediately instead of waiting for the whole migration to finish.',
          '@ts-expect-error documents why and expires itself; @ts-ignore documents nothing and never expires — prefer the former everywhere.',
        ]} />
      </GuidePanel>

      <GuidePanel n={26} title="The Rules" accent="pink" glyph="✅" span={2}>
        <GuideRules items={[
          'Prefer unknown over any.',
          'Prefer satisfies over as.',
          'Discriminated unions over structs of optionals.',
          'Brand IDs at the boundary and keep them branded through the application.',
          'Every switch on a discriminant closes with a never check.',
          'Turn on noUncheckedIndexedAccess and address the errors it surfaces.',
          'Derive request and response types from the model with Omit or Pick instead of duplicating them.',
          'Return Result<T, E> for expected failures; throw only for the exceptional ones.',
          'Use a type predicate, or a schema library, at every external boundary.',
          'Money is a typed value, not number. Dates are Date, not string.',
          'Prefer incremental migration over a rewrite: allowJs plus an explicit strict: false during the transition, then delete that line entirely — never flip it to true, TS 6 already defaults it there.',
          'readonly on a function parameter is free, compiler-enforced documentation that it will not mutate its input.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
