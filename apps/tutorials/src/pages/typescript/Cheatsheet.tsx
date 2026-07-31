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
      next={null}
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

      <h2>Utility Types</h2>
      <CodeBlock language="ts" title="Built-in utility types worth memorizing">
{`Partial<T>          all props optional
Required<T>         all props required
Readonly<T>         all props readonly
Pick<T, K>          keep the listed keys
Omit<T, K>          drop the listed keys
Record<K, V>        { [key: K]: V }
NonNullable<T>      strip null and undefined
ReturnType<F>       infer function return type
Parameters<F>       tuple of function param types
Awaited<P>          unwrap Promise (deeply)
Exclude<T, U>       union minus U
Extract<T, U>       union intersected with U
InstanceType<C>     instance type of a class constructor`}
      </CodeBlock>

      <h2>Generics</h2>
      <CodeBlock language="ts" title="Generics essentials">
{`function first<T>(xs: T[]): T | undefined { return xs[0]; }

// Constrained generic
function keys<T extends object>(obj: T): (keyof T)[] { return Object.keys(obj) as (keyof T)[]; }

// Default type param
type Box<T = string> = { value: T };

// Multiple params + inference
function pair<A, B>(a: A, b: B): [A, B] { return [a, b]; }

// Higher-order utility
type Nullable<T> = { [K in keyof T]: T[K] | null };`}
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

      <h2>Type Predicates &amp; Narrowing</h2>
      <CodeBlock language="ts" title="Runtime guards that also narrow the type">
{`function isUser(v: unknown): v is User {
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

      <h2>Mapped Types</h2>
      <CodeBlock language="ts" title="Transform every key of a type">
{`type ReadonlyDeep<T> = T extends object
  ? { readonly [K in keyof T]: ReadonlyDeep<T[K]> }
  : T;

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};

type UserGetters = Getters<{ name: string; age: number }>;
// { getName(): string; getAge(): number }`}
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
type Y = PromiseValue<Promise<string>>;  // string`}
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

// forwardRef
const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => <input ref={ref} {...props} />);

// useReducer typed
type Action = { type: 'inc' } | { type: 'set'; value: number };
function reducer(state: number, action: Action): number { /* ... */ }`}
      </CodeBlock>

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

      <h2>tsconfig Essentials</h2>
      <CodeBlock language="json" title="Strictness dial — turn it up">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,                     // enables all strict flags below
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUncheckedIndexedAccess": true,   // arr[i] is T | undefined
    "noImplicitOverride": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "skipLibCheck": true
  }
}`}
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
