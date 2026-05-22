import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TypescriptInterview() {
  return (
    <LessonLayout
      title="TypeScript Interview Questions"
      sectionId="interview-prep"
      lessonIndex={1}
      prev={{ path: '/interview-prep/react', label: 'React Interview Questions' }}
      next={{ path: '/interview-prep/frontend', label: 'Frontend System Design' }}
    >

      <FlowChart
        title="TypeScript Type System Hierarchy"
        chart={"graph TD\n  A[unknown] --> B[any]\n  A --> C[object]\n  A --> D[Primitives]\n  D --> E[string]\n  D --> F[number]\n  D --> G[boolean]\n  C --> H[Array]\n  C --> I[Function]\n  C --> J[Interface / Type]\n  K[never] --> A\n  style A fill:#6366f1,color:#fff\n  style K fill:#ef4444,color:#fff\n  style B fill:#f59e0b,color:#fff"}
      />

      {/* ── Q1 ── */}
      <h2>1. interface vs type — What is the difference?</h2>
      <p>
        Both describe object shapes but differ in capability. <code>interface</code> supports
        <strong> declaration merging</strong> and is preferred for public API contracts.
        <code> type</code> is more expressive — it can describe unions, intersections, tuples,
        and computed types.
      </p>

      <CodeBlock language="typescript" title="interface vs type">
{`// interface — extendable, mergeable
interface User { id: number; name: string; }
interface User { email: string; } // ✅ merges — User now has id, name, email
interface Admin extends User { role: string; }

// type — cannot be re-declared, more flexible
type UserType = { id: number; name: string };
// type UserType = { email: string }; ❌ Duplicate identifier
type AdminType = UserType & { role: string }; // Intersection instead

// Only type can do these:
type ID       = string | number;          // Union
type Pair     = [string, number];         // Tuple
type Callback = (x: number) => void;      // Function alias`}
      </CodeBlock>

      <InfoBox variant="tip" title="Rule of Thumb">
        Use <code>interface</code> for object shapes and public contracts. Use <code>type</code> for
        unions, intersections, computed types, and anything that isn't a plain object shape.
      </InfoBox>

      <InteractiveChallenge
        question={"Which feature does interface support that type does NOT?"}
        options={["Extending another type", "Declaration merging", "Describing object shapes", "Generic constraints"]}
        correctIndex={1}
        explanation={"Declaration merging lets you declare the same interface name multiple times and TypeScript merges them automatically. type aliases cannot be re-declared — it is a compile error."}
        language="typescript"
      />

      {/* ── Q2 ── */}
      <h2>2. Generics — What are they and when do you use them?</h2>
      <p>
        Generics defer the type decision to the call site, making code reusable without
        sacrificing type safety. Use them when a function or component works with multiple
        types but must preserve the relationship between inputs and outputs.
      </p>

      <CodeBlock language="typescript" title="Generic Function, Component, and Hook">
{`// Generic function with constraint
function getFirst<T extends { id: number }>(items: T[]): T | undefined {
  return items[0];
}

// Generic React component
type ListProps<T> = { items: T[]; render: (item: T) => React.ReactNode };
function List<T>({ items, render }: ListProps<T>) {
  return <ul>{items.map((item, i) => <li key={i}>{render(item)}</li>)}</ul>;
}

// Generic hook
function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = React.useState<T>(initial);
  const set = (v: T) => { localStorage.setItem(key, JSON.stringify(v)); setValue(v); };
  return [value, set];
}

// Multiple type parameters
function zip<A, B>(as: A[], bs: B[]): [A, B][] {
  return as.map((a, i) => [a, bs[i]]);
}
const pairs = zip([1, 2], ['a', 'b']); // [number, string][]`}
      </CodeBlock>

      {/* ── Q3 ── */}
      <h2>3. Union Types vs Intersection Types</h2>
      <p>
        A <strong>union</strong> (<code>|</code>) means a value is <em>one of</em> the types.
        An <strong>intersection</strong> (<code>&amp;</code>) means it satisfies <em>all</em> of them.
      </p>

      <CodeBlock language="typescript" title="Union | vs Intersection &">
{`// Union — only shared members accessible without narrowing
function format(val: string | number) {
  if (typeof val === 'number') return val.toFixed(2); // narrowed: number
  return val.toUpperCase();                           // narrowed: string
}

// Intersection — all members available
type Timestamped = { createdAt: Date };
type Named       = { name: string };
type Entity      = Timestamped & Named; // { createdAt: Date; name: string }

// Practical: mix in cross-cutting concerns
type WithLoading<T> = T & { isLoading: boolean; error: string | null };`}
      </CodeBlock>

      {/* ── Q4 ── */}
      <h2>4. Type Narrowing and Type Guards</h2>
      <p>
        TypeScript narrows unions inside conditionals based on the runtime check. The four
        techniques are <code>typeof</code>, <code>instanceof</code>, the <code>in</code> operator,
        and custom type guards using the <code>is</code> keyword.
      </p>

      <CodeBlock language="typescript" title="All Four Narrowing Techniques">
{`type Cat = { meow: () => void };
type Dog = { bark: () => void };
type Animal = Cat | Dog;

// 1. typeof — primitives
function double(x: string | number) {
  return typeof x === 'string' ? x.repeat(2) : x * 2;
}

// 2. instanceof — class instances
function logDate(val: Date | string) {
  return val instanceof Date ? val.toISOString() : new Date(val).toISOString();
}

// 3. in — property existence
function makeSound(a: Animal) {
  if ('meow' in a) a.meow(); else a.bark();
}

// 4. Custom type guard (is keyword)
function isCat(a: Animal): a is Cat {
  return (a as Cat).meow !== undefined;
}
function speak(a: Animal) {
  if (isCat(a)) a.meow(); // narrowed to Cat
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What return type must a custom type guard function have?"}
        options={["boolean", "void", "arg is Type", "Type | undefined"]}
        correctIndex={2}
        explanation={"A custom type guard must return a type predicate in the form 'paramName is Type'. This tells TypeScript how to narrow the type in branches where the guard returns true."}
        language="typescript"
      />

      {/* ── Q5 ── */}
      <h2>5. Built-in Utility Types</h2>
      <p>
        TypeScript ships with utility types that transform existing types. Knowing them prevents
        re-implementing common transformations manually.
      </p>

      <CodeBlock language="typescript" title="Essential Utility Types">
{`interface User { id: number; name: string; email: string; age: number; }

type PartialUser  = Partial<User>;                        // All optional
type RequiredUser = Required<Partial<User>>;               // All required
type NameEmail    = Pick<User, 'name' | 'email'>;         // Subset
type NoAge        = Omit<User, 'age'>;                    // All except age
type UserMap      = Record<string, User>;                  // Index signature

async function fetchUser(id: number): Promise<User> { return {} as User; }
type FetchReturn  = Awaited<ReturnType<typeof fetchUser>>; // User
type FetchParams  = Parameters<typeof fetchUser>;          // [number]

type SafeId       = NonNullable<string | null | undefined>; // string
type UserForm     = Partial<Pick<User, 'name' | 'email'>>;  // form state`}
      </CodeBlock>

      {/* ── Q6 ── */}
      <h2>6. any vs unknown vs never</h2>
      <p>
        These three types occupy special positions in the hierarchy. <code>any</code> opts out of
        type checking, <code>unknown</code> is the type-safe alternative, and <code>never</code>
        represents values that can never exist — useful for exhaustive checks.
      </p>

      <CodeBlock language="typescript" title="any vs unknown vs never">
{`// any — disables type checking (avoid)
let x: any = 'hello';
x.toFixed(); // No compile error — runtime crash!

// unknown — must narrow before use (prefer over any)
let y: unknown = externalData();
// y.toFixed();          ❌ Compile error
if (typeof y === 'number') y.toFixed(); // ✅

// never — exhaustive switch checking
function assertNever(x: never): never {
  throw new Error('Unhandled case: ' + x);
}
type Shape = 'circle' | 'square';
function area(s: Shape): number {
  switch (s) {
    case 'circle': return Math.PI;
    case 'square': return 1;
    default: return assertNever(s); // ✅ Compile error if Shape grows
  }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="any Propagates">
        Values derived from <code>any</code> are also <code>any</code>. One leak can silently
        hollow out your type safety across an entire call chain.
      </InfoBox>

      {/* ── Q7 ── */}
      <h2>7. Enums vs Union Literals</h2>
      <p>
        Regular enums emit JavaScript and produce a bidirectional mapping object. Union literals
        are erased at compile time — zero runtime cost, perfect tree-shaking.
      </p>

      <CodeBlock language="typescript" title="Enum vs Union Literal">
{`// ❌ Numeric enum — emits JS, bidirectional map
enum Direction { Up, Down, Left, Right }
// compiled: { Up: 0, 0: "Up", Down: 1, ... }

// ✅ const enum — values inlined, no JS object emitted
const enum Status { Active = 'ACTIVE', Inactive = 'INACTIVE' }

// ✅✅ Union literal — most idiomatic modern TypeScript (zero runtime cost)
type DirectionLiteral = 'up' | 'down' | 'left' | 'right';

// Object-as-enum pattern (iterable + type-safe)
const ROLES = { Admin: 'admin', User: 'user', Guest: 'guest' } as const;
type Role = typeof ROLES[keyof typeof ROLES]; // 'admin' | 'user' | 'guest'
const allRoles = Object.values(ROLES);         // ✅ Iterable at runtime`}
      </CodeBlock>

      {/* ── Q8 ── */}
      <h2>8. Discriminated Unions and Exhaustive Checks</h2>
      <p>
        A discriminated union has a shared <em>literal</em> property (the discriminant) on each
        member. TypeScript uses it to narrow the type automatically inside a <code>switch</code>.
      </p>

      <CodeBlock language="typescript" title="Discriminated Union — Result Pattern">
{`type Loading      = { status: 'loading' };
type Success<T>   = { status: 'success'; data: T };
type Failure      = { status: 'error'; error: string; code: number };
type AsyncResult<T> = Loading | Success<T> | Failure;

function render<T>(r: AsyncResult<T>): string {
  switch (r.status) {
    case 'loading': return 'Loading...';
    case 'success': return \`Data: \${JSON.stringify(r.data)}\`;
    case 'error':   return \`Error \${r.code}: \${r.error}\`;
    default:
      const _check: never = r; // ✅ fails if a new union member is unhandled
      return _check;
  }
}`}
      </CodeBlock>

      {/* ── Q9 ── */}
      <h2>9. Mapped Types and Conditional Types</h2>
      <p>
        Mapped types iterate over keys to transform a type. Conditional types express type-level
        logic. The <code>infer</code> keyword captures a type from inside an <code>extends</code> clause.
      </p>

      <CodeBlock language="typescript" title="Mapped Types, Conditional Types, infer">
{`// Mapped types — build custom utility types
type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyRequired<T> = { [K in keyof T]-?: T[K] }; // -? removes optional

// Remap keys with 'as' (TS 4.1+)
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
// Getters<{ name: string }> → { getName: () => string }

// Conditional type
type IsArray<T> = T extends any[] ? true : false;
type A = IsArray<string[]>; // true
type B = IsArray<number>;   // false

// infer — extract inner type
type ElementOf<T> = T extends (infer E)[] ? E : never;
type Unwrap<T>    = T extends Promise<infer V> ? V : T;
type El = ElementOf<string[]>;        // string
type Res = Unwrap<Promise<number>>;   // number`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What does the -? modifier do in a mapped type?"}
        options={["Makes all properties optional", "Removes optionality (makes required)", "Deletes the property", "Makes properties nullable"]}
        correctIndex={1}
        explanation={"The -? modifier removes the optional modifier from mapped type properties, making them required. This is how TypeScript's built-in Required<T> utility is implemented."}
        language="typescript"
      />

      {/* ── Q10 ── */}
      <h2>10. Template Literal Types</h2>
      <p>
        Template literal types construct new string literal types at the type level — zero
        runtime cost. They combine powerfully with mapped types.
      </p>

      <CodeBlock language="typescript" title="Template Literal Types in Practice">
{`type EventName = 'click' | 'focus' | 'blur';
type HandlerName = \`on\${Capitalize<EventName>}\`; // 'onClick' | 'onFocus' | 'onBlur'

type Route    = '/users' | '/posts';
type ApiRoute = \`/api/v1\${Route}\`; // '/api/v1/users' | '/api/v1/posts'

// Combine with mapped types
type Events = { click: MouseEvent; keydown: KeyboardEvent };
type EventHandlers = {
  [K in keyof Events as \`on\${Capitalize<string & K>}\`]?: (e: Events[K]) => void;
};
// { onClick?: (e: MouseEvent) => void; onKeydown?: (e: KeyboardEvent) => void }`}
      </CodeBlock>

      {/* ── Q11 ── */}
      <h2>11. TypeScript with React — All the Patterns</h2>
      <p>
        Typing React covers props, hooks, events, refs, and context. These patterns
        come up in almost every senior frontend interview.
      </p>

      <CodeBlock language="typescript" title="Props, Hooks, Events, Refs, and Context">
{`// 1. Props — prefer plain function over React.FC
type ButtonProps = {
  label: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'primary' | 'secondary';
  children?: React.ReactNode;
};
function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{label}</button>;
}

// 2. useState — infer primitives, explicit for union/null
const [count, setCount] = useState(0);
const [user, setUser]   = useState<User | null>(null);

// 3. useRef — DOM ref vs mutable ref
const inputRef = useRef<HTMLInputElement>(null);           // DOM ref
const timerRef = useRef<ReturnType<typeof setTimeout>>(); // mutable ref

// 4. useReducer
type State  = { count: number };
type Action = { type: 'inc' } | { type: 'dec' };
function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'inc': return { count: s.count + 1 };
    case 'dec': return { count: s.count - 1 };
  }
}

// 5. Context with guard
type ThemeCtx = { theme: 'light' | 'dark'; toggle: () => void };
const ThemeContext = createContext<ThemeCtx | undefined>(undefined);
function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider');
  return ctx;
}

// 6. Inline event types
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => e.target.value;
const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => e.preventDefault();`}
      </CodeBlock>

      <InfoBox variant="tip" title="React.FC vs Plain Function">
        Avoid <code>React.FC</code> — it adds implicit <code>children</code> (older versions),
        hides return type flexibility, and adds noise. Plain typed functions are the modern
        idiomatic choice.
      </InfoBox>

      <InteractiveChallenge
        question={"For a DOM ref, which useRef call is correct?"}
        options={[
          "useRef<HTMLInputElement>() — no initial value",
          "useRef<HTMLInputElement>(null) — null initial value",
          "useRef<HTMLInputElement | null>(undefined)",
          "useRef(HTMLInputElement)"
        ]}
        correctIndex={1}
        explanation={"useRef<HTMLInputElement>(null) is correct for DOM refs. Without null, the ref becomes MutableRefObject<HTMLInputElement | undefined> which doesn't satisfy the ref prop on JSX elements."}
        language="typescript"
      />

      {/* ── Bonus ── */}
      <h2>Quick-Fire Gotchas and Best Practices</h2>

      <InfoBox variant="note" title="Structural vs Nominal Typing">
        TypeScript uses <strong>structural typing</strong> — two types are compatible if they have
        the same shape, regardless of name. To get nominal-style typing, use <strong>branded types</strong>:{' '}
        <code>{'type UserId = string & { __brand: "UserId" }'}</code>. This prevents accidentally
        passing a <code>ProductId</code> where a <code>UserId</code> is expected.
      </InfoBox>

      <CodeBlock language="typescript" title="satisfies Operator and Branded Types">
{`// satisfies (TS 4.9) — validate without widening the inferred type
const palette = {
  red:  [255, 0, 0],
  blue: '#0000ff',
} satisfies Record<string, string | number[]>;
palette.red.map(Math.sqrt); // ✅ palette.red is number[], not string | number[]

// Branded types — nominal typing in a structural system
type UserId    = string & { readonly __brand: 'UserId' };
type ProductId = string & { readonly __brand: 'ProductId' };
const toUserId = (id: string): UserId => id as UserId;

function fetchUser(id: UserId): Promise<User> { return Promise.resolve({} as User); }
const uid = toUserId('u_123');
const pid = 'p_456' as ProductId;
// fetchUser(pid); ❌ ProductId is not assignable to UserId
fetchUser(uid);   // ✅`}
      </CodeBlock>

      <InfoBox variant="question" title="Common Interview Follow-ups">
        <ul>
          <li><strong>What is the <code>satisfies</code> operator?</strong> — Validates a value against a type without widening the inferred type.</li>
          <li><strong>What is <code>NoInfer&lt;T&gt;</code> (TS 5.4)?</strong> — Prevents a generic from being inferred from a specific argument site.</li>
          <li><strong>What is strictNullChecks and why enable it?</strong> — Forces <code>null</code>/<code>undefined</code> handling, eliminating an entire class of runtime errors.</li>
          <li><strong>What is module augmentation?</strong> — <code>declare module 'express'</code> lets you extend third-party types (e.g., adding <code>req.currentUser</code>) without forking.</li>
        </ul>
      </InfoBox>

    </LessonLayout>
  );
}
