import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTypescriptTypes() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React + TypeScript · Field Reference"
      title="TypeScript Types & Generics"
      tagline="The type-level tools that make illegal states unrepresentable — condensed for offline study."
      meta={['TS 5+', '10 concepts']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="React + TS Field Guide · TypeScript Types"
      prev={{ path: '/react-field-guide/component-patterns', label: 'Component Patterns' }}
      next={{ path: '/react-field-guide/typing-react', label: 'Typing React' }}
    >
      <PosterCard
        glyph="U"
        title={<>Utility <span className="dim">Types</span></>}
        language="typescript"
        code={`Partial<T>      // all props optional
Pick<T, K>      // keep listed keys
Omit<T, K>      // drop listed keys
Record<K, V>    // { [key: K]: V }
ReturnType<F>   // infer function return type
Awaited<P>      // unwrap Promise (deeply)`}
        caption="The built-ins you'll reach for constantly — memorize these before writing a custom mapped type for the same job."
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
          { need: 'Build string unions', answer: 'Template literal type' },
          { need: 'Lock in literal values', answer: 'as const' },
        ]}
      />
    </PosterLayout>
  );
}
