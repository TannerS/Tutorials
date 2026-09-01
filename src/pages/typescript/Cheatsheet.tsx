import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function TypeScriptCheatsheet() {
  return (
    <GuideLayout
      title="TypeScript"
      kicker="FIELD GUIDE"
      glyph="🔷"
      tagline="The type system, generics, decorators, and the boundary where types are erased — TypeScript 5 through 6."
      meta={['TypeScript 5 → 6', 'React 19 + Node', '18 panels']}
      page="1 / 1"
      footer="This page is for recall. The lessons in this section carry the reasoning, the worked examples and the tsconfig walkthroughs."
      prev={{ path: '/typescript/enterprise', label: 'Enterprise Patterns' }}
      next={{ path: '/typescript/native-compiler', label: 'TypeScript 6 → 7: The Native Compiler' }}
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
        <GuideCode>{`enum Direction { Up, Down }        // numeric — ANY number is assignable
const enum Fast { A = 1 }          // inlined; breaks under isolatedModules

// Prefer: zero runtime cost, exhaustive, same autocomplete
const STATUS = { Active: 'ACTIVE', Archived: 'ARCHIVED' } as const;
type Status2 = typeof STATUS[keyof typeof STATUS];   // 'ACTIVE' | 'ARCHIVED'`}</GuideCode>
        <GuideRules items={[
          'A literal value is its own type: "yes" is a type as well as a value.',
          'as const freezes an object or array to its literal, readonly shape — the workhorse for deriving a union from real data.',
          'Numeric enums are not exhaustive and emit real runtime JS; reach for an as-const object or a plain union instead.',
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
            ['Awaited<P>', 'unwrap a Promise, recursively'],
            ['Uppercase / Lowercase / Capitalize<S>', 'compiler string intrinsics'],
            ['NoInfer<T>', 'TS 5.4+ — excludes this position from inference'],
          ]}
        />
        <GuideRules items={['Two different typeof: value position is the plain JS runtime operator; type position is the TS operator that lifts a value into its type.']} />
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

      <GuidePanel n={7} title="Generics" accent="blue" glyph="🧬">
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

      <GuidePanel n={8} title="Discriminated Unions & Narrowing" accent="green" glyph="🔀" span={2}>
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
}`}</GuideCode>
        <GuideDefs items={[
          ['typeof', 'primitives only, and typeof null is "object"'],
          ['instanceof', 'classes and built-ins, e.g. err instanceof Error'],
          ['in operator', 'does this key exist? "radius" in shape'],
          ['truthiness', 'beware — excludes empty string and 0, not just null and undefined'],
          ['equality / switch', 'narrows both sides of ===, and every case of a discriminant switch'],
        ]} />
        <GuideRules items={['A switch on a discriminant should always close with a never assignment in default — the compiler then flags the day a new variant is added and left unhandled.']} />
      </GuidePanel>

      <GuidePanel n={9} title="satisfies, Branding & Assertions" accent="amber" glyph="🛡️" span={2}>
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

const el = document.getElementById('x') as HTMLInputElement;  // as — a promise
value!                 // non-null assertion — crashes if the promise was wrong
// @ts-expect-error fails when the error goes away; @ts-ignore never does`}</GuideCode>
        <GuideRules items={[
          'Preference order, best to worst: narrowing or a type predicate, then satisfies, then as, then the non-null assertion, then a double assertion through unknown, then any.',
          'Brand an ID at the one function that parses it, and keep it branded through the rest of the application.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Mapped, Conditional & Template Literal Types" accent="purple" glyph="🌀" span={2}>
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

      <GuidePanel n={11} title="using & Result<T, E>" accent="cyan" glyph="🧹" span={2}>
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

      <GuidePanel n={12} title="React + TS Essentials" accent="blue" glyph="⚛️" span={2}>
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

// React 19: ref is just another prop — forwardRef is deprecated
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
          'Legacy forwardRef<RefType, PropsType> takes the ref type first — backwards from the props-first convention used everywhere else.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Runtime Validation — Types Are Erased" accent="pink" glyph="🕳️" span={2}>
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

      <GuidePanel n={14} title="Modules, tsconfig & tsc CLI" accent="amber" glyph="🧰" span={2}>
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
        <GuideRules items={['declare module merges into what a module EXPORTS. A bare declare namespace inside a module is a brand-new local declaration, not an augmentation, and it compiles clean while doing nothing.']} />
      </GuidePanel>

      <GuidePanel n={15} title="TypeScript on Node — Strip vs Transform" accent="red" glyph="⚠️" span={2}>
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

      <GuidePanel n={16} title="Reading Compiler Errors" accent="purple" glyph="🩺" span={2}>
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
            ['TS2589', 'excessively deep — a recursive type has no working depth limit'],
          ]}
        />
        <GuideRules items={[
          'Suspect the annotation first — the mistake is often several lines above the value that failed.',
          'A conditional type resolving to never can mean the input itself is never; wrap the check as [T] extends [U].',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Gotchas That Bite" accent="red" glyph="🪤" span={2}>
        <GuideCode>{`interface Opts { name: string }
const a: Opts = { name: 'x', extra: 1 };   // ERROR — excess property check
const tmp = { name: 'x', extra: 1 };
const b: Opts = tmp;                        // OK, no longer a fresh literal

class Dog { name = '' } class Person { name = '' }
const d: Dog = new Person();                // OK — structural typing, no implements needed

const u: Readonly<{ tags: string[] }> = { tags: [] };
u.tags.push('x');                           // allowed — readonly is shallow

const m: Record<string, number> = {};
m.missing.toFixed();                        // compiles, crashes — noUncheckedIndexedAccess fixes it`}</GuideCode>
        <GuideRules items={[
          'Object.keys returns string[], not (keyof T)[] — an object may structurally carry more keys than its type declares.',
          'Method shorthand such as on(cb) {} is bivariant and effectively unchecked; the property form on: (cb) => void is checked strictly under strictFunctionTypes.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="The Rules" accent="green" glyph="✅" span={2}>
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
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
