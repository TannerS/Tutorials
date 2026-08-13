import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTypescriptTypes() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="TypeScript Types & Generics"
      tagline="The type-level tools that make illegal states unrepresentable — condensed for offline study."
      meta={['TS 6', '16 concepts']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="TypeScript Field Guide · TypeScript Types"
      prev={{ path: '/typescript-field-guide/best-practices-gotchas', label: 'Best Practices & Gotchas' }}
      next={{ path: '/typescript-field-guide/typing-react', label: 'Typing React' }}
    >
      <PosterCard
        glyph="U"
        title={<>Utility <span className="dim">Types</span></>}
        language="typescript"
        code={`// shape
Partial<T>  Required<T>  Readonly<T>
Pick<T, K>  Omit<T, K>   Record<K, V>

// union filtering
Exclude<T, U>  Extract<T, U>  NonNullable<T>

// functions & classes
ReturnType<F>  Parameters<F>  InstanceType<C>
ConstructorParameters<C>
ThisParameterType<F>  OmitThisParameter<F>  ThisType<T>

// async / strings / inference
Awaited<P>   // unwraps Promise recursively
Uppercase<S> Lowercase<S> Capitalize<S> Uncapitalize<S>
NoInfer<T>   // TS 5.4+ — exclude from inference`}
        caption="That is the complete built-in set. All of them except the four string types are a few lines of mapped/conditional type in lib.es5.d.ts — e.g. Exclude<T,U> = T extends U ? never : T. The string ones are compiler intrinsics and cannot be written in TS source."
      />

      <PosterCard
        glyph="G"
        title="Generics"
        language="typescript"
        code={`function first<T>(xs: T[]): T | undefined { return xs[0]; }

function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

type Box<T = string> = { value: T };`}
        caption="`extends` constrains what T can be; a default type parameter (T = string) makes the generic optional to specify at the call site."
      />

      <PosterCard
        glyph="NI"
        title={<>NoInfer&lt;T&gt;<span className="dim"> — remove an inference site</span></>}
        language="typescript"
        code={`// EVERY parameter mentioning C votes on what C is. So a wrong
// argument can widen C until it fits, instead of erroring.
function light<C extends string>(colors: C[], fallback?: C) {}
light(['red', 'yellow', 'green'], 'blue');
// ✅ No error. C inferred as 'red'|'yellow'|'green'|'blue' —
//    'blue' was allowed to contribute its own candidate.

// NoInfer strips that position out of the vote:
function lightSafe<C extends string>(colors: C[], fallback?: NoInfer<C>) {}
lightSafe(['red', 'yellow', 'green'], 'blue');
// ❌ Argument of type '"blue"' is not assignable to parameter of
//    type '"red" | "yellow" | "green" | undefined'.`}
        caption="TS 5.4+. C is now fixed by the colors argument alone, and fallback is merely checked against it. Reach for NoInfer whenever one parameter should define the type and the others should only conform to it — defaults, fallbacks, and initial values are the usual cases."
      />

      <PosterCard
        glyph="DU"
        title={<>Discriminated <span className="dim">Unions</span></>}
        language="typescript"
        code={`type RemoteData<T> =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: T }
  | { kind: 'error'; error: Error };

switch (rd.kind) {
  case 'success': return rd.data; // narrowed
}`}
        caption="A shared literal tag (kind) lets TS narrow the full shape per branch — the standard way to model state instead of a bag of optionals."
      />

      <PosterCard
        glyph="Br"
        title={<>Branded <span className="dim">(Nominal) Types</span></>}
        language="typescript"
        code={`declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

type UserId  = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

updateOrder(userId); // ERROR — UserId isn't an OrderId`}
        caption="Structurally both are just strings, so a phantom `brand` field forces nominal typing — stops IDs from different domains being swapped by accident."
      />

      <PosterCard
        glyph="sat"
        title={<>satisfies</>}
        language="typescript"
        code={`const routes = {
  '/orders': listOrders,
  '/orders/:id': getOrder,
} satisfies Record<string, RouteHandler>;

// typeof routes keeps the LITERAL key set,
// unlike ": Record<...>" which widens it`}
        caption="Checks the value against a type without changing the value's inferred type — you keep literal keys AND get the shape check."
      />

      <PosterCard
        glyph="TP"
        title={<>Type Predicates <span className="dim">&amp; Narrowing</span></>}
        language="typescript"
        code={`function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v;
}
if (isUser(raw)) raw.email; // narrowed to User

function assertUser(v: unknown): asserts v is User {
  if (!isUser(v)) throw new Error('not a user');
}`}
        caption="`v is T` narrows inside the if; `asserts v is T` narrows everything after the call — use the assertion form when a throw makes the rest of the function unreachable otherwise."
      />

      <PosterCard
        glyph="M"
        title={<>Mapped <span className="dim">Types</span></>}
        language="typescript"
        code={`type ReadonlyDeep<T> = T extends object
  ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
  : T;

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};`}
        caption="Loops over a type's keys to build a new type. The `as` clause lets you rename keys during the mapping, not just their value types."
      />

      <PosterCard
        glyph="Co"
        title={<>Conditional <span className="dim">Types &amp; infer</span></>}
        language="typescript"
        code={`type IsString<T> = T extends string ? true : false;

type ElementOf<T> = T extends (infer U)[] ? U : never;
type X = ElementOf<number[]>;  // number

type PromiseValue<T> = T extends Promise<infer U> ? U : T;`}
        caption="`infer` captures a piece of a type inside a conditional — the mechanism behind ReturnType, Awaited, and most library-level type utilities."
      />

      <PosterCard
        glyph="∥"
        title={<>Distribution<span className="dim"> — and the IsNever trap</span></>}
        language="typescript"
        code={`// A conditional over a NAKED type parameter distributes over unions:
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>;   // string[] | number[]  — NOT (string|number)[]

// Wrap both sides in a tuple to switch distribution OFF:
type ToArrayN<T> = [T] extends [any] ? T[] : never;
type R2 = ToArrayN<string | number>; // (string | number)[]

// THE TRAP: never is the EMPTY union. Distributing over zero
// members produces zero results — so the branch never runs.
type IsNever<T>  = T extends never ? true : false;
type Bad  = IsNever<never>;   // never  ← not true. Silently wrong.
type Good = IsNever2<never>;  // true
type IsNever2<T> = [T] extends [never] ? true : false;`}
        caption="Distribution is why Exclude<T,U> filters a union member-by-member instead of comparing the whole union at once. It only happens for a bare type parameter on the left of extends. never being the empty union makes every naive T extends never check evaluate to never rather than true — always tuple-wrap when the type you are testing for is never."
      />

      <PosterCard
        glyph="±"
        title={<>Variance<span className="dim"> — the two unsound holes</span></>}
        language="typescript"
        code={`class Animal { name = '' }
class Dog extends Animal { bark() {} }

// HOLE 1 — arrays are covariant, and mutable. TS allows this:
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;   // ✅ allowed
animals.push(new Animal());       // ✅ allowed — dogs now holds a non-Dog 💥
// Use readonly Dog[] when you only read: covariance is safe there.

// HOLE 2 — METHOD syntax is bivariant; PROPERTY syntax is not.
interface A { handle(x: Dog): void }      // method   → bivariant (unsound)
interface B { handle: (x: Dog) => void }  // property → contravariant (checked)

const a: A = { handle: (x: Dog & { id: 1 }) => {} };  // ✅ no error 💥
const b: B = { handle: (x: Dog & { id: 1 }) => {} };  // ❌ correctly rejected`}
        caption="Parameters are normally contravariant — a handler may accept a WIDER type than required, never a narrower one. Two deliberate exceptions survive for compatibility: mutable arrays are covariant, and methods declared with method syntax stay bivariant even under strictFunctionTypes. If you want a callback's parameter type actually checked, declare it as a property, not a method."
      />

      <PosterCard
        glyph="k[]"
        title={<>keyof<span className="dim"> &amp; indexed access T[K]</span></>}
        language="typescript"
        code={`interface User { id: string; age: number }

type K = keyof User;        // 'id' | 'age'   — union of key names
type V = User['age'];       // number         — indexed access
type Any = User[keyof User]; // string | number — union of all value types

// The pair that makes a type-safe getter:
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
get(user, 'age');   // returns number, not string | number

// Related: {} is "anything not nullish", NOT "empty object" —
// it accepts 42 and 'hi', rejects only null/undefined.
// Full breakdown on the Best Practices & Gotchas page.`}
        caption="keyof gives the key union, T[K] looks up the value type at those keys, and constraining K extends keyof T is what keeps the two in lockstep so the return type is exact — without the constraint the return widens to the union of every value type."
      />

      <PosterCard
        glyph="TL"
        title={<>Template Literal <span className="dim">Types</span></>}
        language="typescript"
        code={`type Method = 'GET' | 'POST';
type Path   = '/users' | '/orders';
type Route  = \`\${Method} \${Path}\`;
// 'GET /users' | 'GET /orders' | 'POST /users' | 'POST /orders'

type EventName<T extends string> = \`on\${Capitalize<T>}\`;`}
        caption="Builds string literal unions the same way template strings build runtime strings — great for typed route tables or event-name generation."
      />

      <PosterCard
        glyph="ac"
        title={<>as const</>}
        language="typescript"
        code={`const roles = ['admin', 'user', 'guest'] as const;
type Role = typeof roles[number]; // 'admin' | 'user' | 'guest'

const config = { retries: 3, mode: 'strict' } as const;
config.retries; // 3, not number`}
        caption="Freezes literal types instead of widening them to string/number — pairs with `typeof x[number]` to turn an array literal into a union type."
      />

      <PosterCard
        glyph="@"
        title={<>Decorators <span className="dim">— Stage 3 vs Legacy</span></>}
        language="typescript"
        code={`// STAGE 3 (TS 5+, no flag): (value, context)
function log<T extends (...a: any[]) => any>(
  method: T, ctx: ClassMethodDecoratorContext,
): T {
  return function (this: any, ...args: any[]) {
    console.log(String(ctx.name), args);
    return method.apply(this, args);
  } as T;
}

// A FACTORY is a decorator that takes arguments
function retry(times: number) {
  return (m: any, c: ClassMethodDecoratorContext) => m;
}

class Api {
  @log        // applied LAST — outermost, so its code runs first
  @retry(3)   // applied FIRST — innermost
  async fetch() {}
}

// LEGACY (Angular/Nest/TypeORM): (target, key, descriptor)
// tsconfig: experimentalDecorators + emitDecoratorMetadata`}
        caption="Decorator expressions evaluate top-to-bottom but apply bottom-to-top — log(retry(3)(fetch)). Stage 3 has NO parameter decorators, which is exactly why constructor-injection DI frameworks still require experimentalDecorators. The flag is project-wide: you cannot mix the two systems."
      />

      <PosterCard
        glyph="ctx"
        title={<>Decorator <span className="dim">Kinds &amp; Context</span></>}
        language="typescript"
        code={`// ctx.kind: 'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'
// ctx also has: name, static, private, access, addInitializer, metadata

// CLASS decorator — return a subclass to replace the class
function withTimestamp<T extends new (...a: any[]) => object>(t: T) {
  return class extends t { createdAt = new Date(); };
}

// Per-INSTANCE work (class decorators fire only once)
function sealed(t: Function, ctx: ClassDecoratorContext) {
  ctx.addInitializer(function () { Object.seal(this); });
}

// FIELD decorator — returns an initializer transforming the initial value
function uppercase(_: undefined, ctx: ClassFieldDecoratorContext<any, string>) {
  return (initial: string) => initial.toUpperCase();
}

class Product {
  @uppercase sku = 'abc';        // stored as 'ABC'
  @observable accessor price = 0; // 'accessor' => hooks on read AND write
}`}
        caption="A class decorator runs once, when the class statement is evaluated — use ctx.addInitializer() for anything per-instance. A plain field decorator only sees the initial value; the `accessor` keyword generates a getter/setter pair so a decorator can intercept every read and write."
      />

      <PosterQuickRef
        title="Which type tool do I need?"
        rows={[
          { need: 'Reshape an existing type', answer: 'Utility types (Partial/Pick/Omit/Record)' },
          { need: 'Reusable across many types', answer: 'Generics' },
          { need: 'Model state with valid/invalid branches', answer: 'Discriminated union' },
          { need: 'Prevent mixing look-alike strings', answer: 'Branded type' },
          { need: 'Validate shape, keep literal keys', answer: 'satisfies' },
          { need: 'Narrow unknown/external data', answer: 'Type predicate (is) or assertion (asserts)' },
          { need: 'Transform every key of a type', answer: 'Mapped type' },
          { need: 'Extract a piece of another type', answer: 'Conditional type + infer' },
          { need: 'Stop a conditional distributing over a union', answer: 'Tuple-wrap both sides: [T] extends [U]' },
          { need: 'Test whether a type is never', answer: '[T] extends [never] — the naive form returns never' },
          { need: 'One argument should define T, others conform', answer: 'NoInfer<T> on the others' },
          { need: 'Callback param types actually checked', answer: 'Property syntax, not method syntax' },
          { need: 'Type a getter so the value type is exact', answer: '<T, K extends keyof T>(o: T, k: K) => T[K]' },
          { need: 'Build string unions', answer: 'Template literal type' },
          { need: 'Lock in literal values', answer: 'as const' },
          { need: 'Add cross-cutting behaviour to a method', answer: 'Decorator (or a factory, if it needs args)' },
          { need: 'Run setup per instance from a class decorator', answer: 'ctx.addInitializer()' },
          { need: 'Intercept reads AND writes of a field', answer: 'accessor + auto-accessor decorator' },
        ]}
      />
    </PosterLayout>
  );
}
