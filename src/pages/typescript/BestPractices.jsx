import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function BestPractices() {
  return (
    <LessonLayout
      title="Best Practices &amp; Pitfalls"
      sectionId="typescript"
      lessonIndex={7}
      prev={{ path: '/typescript/migration', label: 'Migration Guide' }}
      next={{ path: '/typescript/newproject', label: 'New Project from Scratch' }}
    >
      <p>
        TypeScript only helps if you use it well. This lesson covers the most
        impactful dos and don&apos;ts &mdash; patterns that separate production-grade
        TypeScript from &quot;any-driven development.&quot;
      </p>

      <FlowChart
        title="Best Practices Decision Flow"
        chart={"graph TD\n  A[Writing TS Code] --> B{Strict mode?}\n  B -->|No| C[Enable it NOW]\n  B -->|Yes| D{Using any?}\n  D -->|Yes| E[Replace with unknown]\n  D -->|No| F{Over-annotating?}\n  F -->|Yes| G[Let TS infer]\n  F -->|No| H[Ship it]"}
      />

      {/* ── Section 1: Strict Mode ──────────────────────────────── */}
      <h2>1. DO: Use Strict Mode Always</h2>
      <p>
        Strict mode is not one flag &mdash; it is a family of flags. Enabling
        <code> strict: true </code> turns all of them on at once.
      </p>

      <CodeBlock language="json" title="tsconfig.json &mdash; Recommended Strict Options">
{`{
  "compilerOptions": {
    "strict": true,
    // What "strict" enables individually:
    // strictNullChecks, strictFunctionTypes,
    // strictBindCallApply, strictPropertyInitialization,
    // noImplicitAny, noImplicitThis, alwaysStrict,
    // useUnknownInCatchVariables

    // Extra safety beyond "strict":
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="What Each Strict Flag Catches">
        <ul>
          <li><strong>strictNullChecks</strong> &mdash; null and undefined are their own types; you must check before use</li>
          <li><strong>strictFunctionTypes</strong> &mdash; enforces contravariant parameter checking on function types</li>
          <li><strong>strictBindCallApply</strong> &mdash; validates arguments to bind, call, and apply</li>
          <li><strong>strictPropertyInitialization</strong> &mdash; class properties must be set in the constructor or have a default</li>
          <li><strong>noImplicitAny</strong> &mdash; errors on expressions and declarations with an implied any type</li>
          <li><strong>noImplicitThis</strong> &mdash; errors on this expressions with an implied any type</li>
          <li><strong>alwaysStrict</strong> &mdash; emits &quot;use strict&quot; in every output file</li>
          <li><strong>useUnknownInCatchVariables</strong> &mdash; catch clause variables are typed unknown instead of any</li>
        </ul>
      </InfoBox>

      {/* ── Section 2: Side-by-Side Comparisons ─────────────────── */}
      <h2>2. Side-by-Side: ❌ Bad vs ✅ Good</h2>
      <p>
        The following comparisons cover the patterns you will encounter most
        in code reviews.
      </p>

      {/* 2a. any vs unknown */}
      <h3>a) any vs unknown</h3>
      <CodeBlock language="typescript" title="❌ BAD — any disables all type checking">
{`function parse(input: any) {
  return input.trim().toLowerCase(); // No error even if input is a number
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — unknown forces you to narrow first">
{`function parse(input: unknown): string {
  if (typeof input !== 'string') {
    throw new TypeError('Expected a string');
  }
  // TS now knows input is a string
  return input.trim().toLowerCase();
}`}
      </CodeBlock>

      {/* 2b. @ts-ignore vs @ts-expect-error */}
      <h3>b) @ts-ignore vs @ts-expect-error</h3>
      <CodeBlock language="typescript" title="❌ BAD — @ts-ignore silently suppresses forever">
{`// @ts-ignore
const value = unstableApi();`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — @ts-expect-error documents the reason and fails when no longer needed">
{`// @ts-expect-error - unstableApi lacks types until v3.0
const value = unstableApi();`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why @ts-expect-error is better">
        When the underlying issue gets fixed, @ts-expect-error will produce a
        compiler error telling you the suppression is no longer needed. @ts-ignore
        stays silent forever, hiding potentially dangerous code.
      </InfoBox>

      {/* 2c. Enums vs Union Types */}
      <h3>c) Enums vs Union Types</h3>
      <CodeBlock language="typescript" title="❌ BAD — Enums generate runtime code and have quirks">
{`enum Status {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — Union types are zero-cost and exhaustive">
{`type Status = 'active' | 'inactive' | 'pending';

// Or use as const for an object with autocomplete:
const STATUS = {
  Active: 'active',
  Inactive: 'inactive',
  Pending: 'pending',
} as const;

type Status = typeof STATUS[keyof typeof STATUS];`}
      </CodeBlock>

      {/* 2d. Function type */}
      <h3>d) Function vs Specific Signature</h3>
      <CodeBlock language="typescript" title="❌ BAD — Function accepts literally anything">
{`function addEventListener(callback: Function) {
  callback(); // callback could be called with any args
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — Specific signature catches mismatches">
{`function addEventListener(callback: (event: MouseEvent) => void) {
  callback(new MouseEvent('click'));
}`}
      </CodeBlock>

      {/* 2e. {} and Object */}
      <h3>e) {} and Object Types</h3>
      <CodeBlock language="typescript" title={"❌ BAD — {} and Object match almost everything"}>
{`function process(data: {}) { /* ... */ }
function handle(data: Object) { /* ... */ }
// Both accept strings, numbers, booleans!`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — Be explicit about the shape you expect">
{`function process(data: Record<string, unknown>) { /* ... */ }

// Even better — define the shape:
interface UserPayload {
  id: string;
  name: string;
  roles: string[];
}
function handle(data: UserPayload) { /* ... */ }`}
      </CodeBlock>

      {/* 2f. Type assertions vs narrowing */}
      <h3>f) Type Assertions vs Narrowing</h3>
      <CodeBlock language="typescript" title="❌ BAD — as lies to the compiler">
{`function getLength(value: unknown): number {
  return (value as string).length; // Crashes if not a string
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — typeof narrows safely">
{`function getLength(value: unknown): number {
  if (typeof value === 'string') {
    return value.length; // TS knows it is a string
  }
  return 0;
}`}
      </CodeBlock>

      {/* 2g. Non-null assertion */}
      <h3>g) Non-null Assertion vs Proper Handling</h3>
      <CodeBlock language="typescript" title="❌ BAD — the ! operator hides null crashes">
{`function focusInput(ref: React.RefObject<HTMLInputElement>) {
  ref.current!.focus();
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — optional chaining is safe">
{`function focusInput(ref: React.RefObject<HTMLInputElement>) {
  ref.current?.focus();
}`}
      </CodeBlock>

      {/* 2h. Over-annotation */}
      <h3>h) Over-annotation vs Inference</h3>
      <CodeBlock language="typescript" title="❌ BAD — Redundant annotations add noise">
{`const name: string = 'Alice';
const count: number = items.length;
const doubled: number[] = nums.map((n: number): number => n * 2);`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — Let TypeScript infer obvious types">
{`const name = 'Alice';           // inferred as string
const count = items.length;     // inferred as number
const doubled = nums.map(n => n * 2); // inferred as number[]`}
      </CodeBlock>

      <InfoBox variant="warning" title="When to annotate explicitly">
        Annotate return types on exported/public functions and complex derived
        types. Let inference handle local variables, callbacks, and simple expressions.
      </InfoBox>

      {/* ── Section 3: Discriminated Unions ──────────────────────── */}
      <h2>3. DO: Use Discriminated Unions</h2>
      <p>
        Replace boolean flag soup with discriminated unions for complex state.
      </p>
      <CodeBlock language="typescript" title="❌ BAD — Boolean flags create impossible states">
{`interface RequestState {
  isLoading: boolean;
  isError: boolean;
  data: User | null;
  error: Error | null;
} // Bug: isLoading AND isError can both be true`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — Discriminated union makes impossible states unrepresentable">
{`type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function render(state: RequestState) {
  switch (state.status) {
    case 'idle':    return <p>Ready</p>;
    case 'loading': return <Spinner />;
    case 'success': return <Profile user={state.data} />;
    case 'error':   return <Alert msg={state.error.message} />;
  }
}`}
      </CodeBlock>

      {/* ── Section 4: as const ──────────────────────────────────── */}
      <h2>4. DO: Use as const</h2>
      <p>
        The <code>as const</code> assertion narrows values to their literal types.
      </p>
      <CodeBlock language="typescript" title="Literal tuples and config objects">
{`// Without as const: type is (string | number)[]
const pair = ['x', 10];

// With as const: type is readonly ['x', 10]
const typedPair = ['x', 10] as const;

const ROUTES = {
  home: '/',
  about: '/about',
  dashboard: '/dashboard',
} as const;
// typeof ROUTES.home is '/' — not string`}
      </CodeBlock>

      {/* ── Section 5: satisfies ─────────────────────────────────── */}
      <h2>5. DO: Use satisfies</h2>
      <p>
        The <code>satisfies</code> operator validates a value matches a type
        without widening it.
      </p>
      <CodeBlock language="typescript" title="satisfies checks without widening">
{`type Theme = {
  colors: Record<string, string>;
  spacing: Record<string, number>;
};

const theme = {
  colors: { primary: '#5b9cf6', danger: '#f87171' },
  spacing: { sm: 4, md: 8, lg: 16 },
} satisfies Theme;
// theme.colors.primary is '#5b9cf6' not string
// But TS verified it matches Theme at compile time`}
      </CodeBlock>

      {/* ── Section 6: Return Types for Public APIs ──────────────── */}
      <h2>6. DO: Type Return Values for Public APIs</h2>
      <p>
        Exported functions should have explicit return types to prevent
        accidental API changes.
      </p>
      <CodeBlock language="typescript" title="Public vs private return type annotation">
{`// ✅ Public — annotate the return type
export function fetchUser(id: string): Promise<User> {
  return api.get('/users/' + id);
}

// ✅ Internal — let inference work
function buildQuery(filters: Filters) {
  return Object.entries(filters)
    .filter(([, v]) => v != null)
    .map(([k, v]) => k + '=' + v).join('&');
}`}
      </CodeBlock>

      {/* ── Section 7: Branded Types ─────────────────────────────── */}
      <h2>7. DO: Use Branded Types for Domain IDs</h2>
      <p>
        Branded types prevent mixing up IDs that are all strings at runtime.
      </p>
      <CodeBlock language="typescript" title="Branded type pattern">
{`type Brand<T, B extends string> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function createUserId(id: string): UserId {
  return id as UserId;
}

function getOrder(orderId: OrderId): Order { /* ... */ }

const userId = createUserId('u-123');
const orderId = 'o-456' as OrderId;

// getOrder(userId); // Error! UserId is not OrderId
getOrder(orderId);   // OK`}
      </CodeBlock>

      <InfoBox variant="tip" title="When to brand">
        Brand any ID that crosses service boundaries or appears alongside
        other IDs of the same primitive type. Common candidates: UserId,
        OrderId, AccountId, SessionToken.
      </InfoBox>

      {/* ── Section 8: Leverage Inference ────────────────────────── */}
      <h2>8. DO: Leverage Inference</h2>
      <p>
        TypeScript&apos;s inference engine is powerful. Over-annotating adds
        noise without safety benefits.
      </p>
      <CodeBlock language="typescript" title="Let inference shine">
{`// TS infers the return type from the implementation
function createUser(name: string, age: number) {
  return { id: crypto.randomUUID(), name, age, createdAt: new Date() };
}

// TS infers the element type from the array
const admins = users.filter(u => u.role === 'admin');

// TS infers the generic from the argument
function first<T>(arr: T[]): T | undefined { return arr[0]; }
const n = first([1, 2, 3]); // n is number | undefined`}
      </CodeBlock>

      {/* ── Section 9: ESLint Rules ──────────────────────────────── */}
      <h2>9. ESLint Rules for TypeScript</h2>
      <p>
        These @typescript-eslint rules catch common mistakes in CI.
      </p>
      <CodeBlock language="json" title=".eslintrc.json &mdash; Key TypeScript Rules">
{`{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "error",
    "@typescript-eslint/prefer-optional-chain": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",
    "@typescript-eslint/consistent-type-imports": [
      "error", { "prefer": "type-imports" }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error", { "argsIgnorePattern": "^_" }
    ]
  }
}`}
      </CodeBlock>

      {/* ── Section 10: tsconfig Strict Flags ────────────────────── */}
      <h2>10. tsconfig Strict Options Reference</h2>
      <CodeBlock language="typescript" title="What each strict flag catches">
{`// strictNullChecks — null/undefined are their own types
let name: string = null;  // Error!

// noImplicitAny — Requires explicit types where TS cannot infer
function log(msg) {}  // Error: 'msg' implicitly has 'any'

// strictFunctionTypes — Catches unsafe function subtyping
type Handler = (e: MouseEvent) => void;
const handler: Handler = (e: Event) => {};  // Error!

// strictPropertyInitialization — Class properties must be initialized
class User {
  name: string;  // Error: not initialized in constructor
}

// noUncheckedIndexedAccess — Index access returns T | undefined
const arr = [1, 2, 3];
const val = arr[5];  // number | undefined, not number`}
      </CodeBlock>

      {/* ── Section 11: Performance ──────────────────────────────── */}
      <h2>11. Performance: When Types Slow Your Editor</h2>
      <p>
        Complex types can make the TS language server sluggish. Keep your
        editor fast with these tips.
      </p>
      <InfoBox variant="warning" title="Type Performance Tips">
        <ul>
          <li><strong>Prefer interfaces over type aliases</strong> for object shapes &mdash; interfaces are cached and merged more efficiently by the compiler</li>
          <li><strong>Avoid deep recursive types</strong> &mdash; if you need recursion, cap the depth with a counter generic</li>
          <li><strong>Simplify conditional types</strong> &mdash; deeply nested ternaries in type-space cause exponential expansion</li>
          <li><strong>Use --generateTrace</strong> &mdash; run tsc --generateTrace ./trace to identify slow types</li>
          <li><strong>Split large union types</strong> &mdash; unions over 25 members slow down narrowing</li>
          <li><strong>Avoid Omit on large types</strong> &mdash; prefer Pick for selecting a few keys from big interfaces</li>
        </ul>
      </InfoBox>

      <CodeBlock language="bash" title="Generate a type-check performance trace">
{`npx tsc --generateTrace ./trace-output
# Open chrome://tracing and load trace-output/trace.json
# Look for the slowest type resolutions`}
      </CodeBlock>

      {/* ── Section 12: Type Testing ─────────────────────────────── */}
      <h2>12. Type Testing</h2>
      <p>
        Test that your types work correctly using libraries like <code>expect-type</code>.
      </p>
      <CodeBlock language="typescript" title="Type testing with expect-type">
{`import { expectTypeOf } from 'expect-type';

expectTypeOf(fetchUser).returns.toEqualTypeOf<Promise<User>>();
expectTypeOf(fetchUser).parameter(0).toBeString();

type Keys = keyof User;
expectTypeOf<Keys>().toEqualTypeOf<'id' | 'name' | 'email'>();
expectTypeOf<Admin>().toMatchTypeOf<User>();`}
      </CodeBlock>

      <InfoBox variant="info" title="When to test types">
        Type tests are most valuable for library authors and shared utility types.
        If you export generic utilities like DeepPartial or Prettify, write type
        tests to guard against regressions across TypeScript upgrades.
      </InfoBox>

      {/* ── Section 13: Interactive Challenges ───────────────────── */}
      <h2>13. Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"What is the anti-pattern in this code?"}
        language="typescript"
        code={`function processInput(data: any) {\n  return data.name.toUpperCase();\n}\n\nconst user = processInput(42);`}
        options={[
          "Missing return type annotation",
          "Using any instead of unknown — no type narrowing before property access",
          "The function name is too generic",
          "toUpperCase is not a valid method",
        ]}
        correctIndex={1}
        explanation={"The parameter is typed as any, so TypeScript will not flag data.name on a number. Using unknown would force a type check before accessing properties, catching the bug at compile time."}
      />

      <InteractiveChallenge
        question={"Which approach correctly ensures type safety for an API response?"}
        language="typescript"
        code={`// Option A:\nconst user = response.data as User;\n\n// Option B:\nfunction isUser(val: unknown): val is User {\n  return typeof val === 'object'\n    && val !== null\n    && 'id' in val\n    && 'name' in val;\n}\nif (isUser(response.data)) {\n  const user = response.data;\n}`}
        options={[
          "Option A — type assertion is simpler and sufficient",
          "Option B — type guard validates at runtime and narrows the type safely",
          "Both are equally safe",
          "Neither is correct — you should use JSON.parse instead",
        ]}
        correctIndex={1}
        explanation={"Type assertions with 'as' do not perform any runtime check. If the API returns unexpected data, the assertion silently lies and bugs appear later. A type guard validates the shape at runtime and lets TypeScript narrow the type safely."}
      />

      <InteractiveChallenge
        question={"Which TypeScript feature prevents you from accidentally passing a UserId where an OrderId is expected?"}
        options={[
          "Generics",
          "Type aliases",
          "Branded types",
          "Enums",
        ]}
        correctIndex={2}
        explanation={"Branded types add a phantom property to a primitive type, making UserId and OrderId structurally incompatible even though both are strings at runtime. This catches mix-ups at compile time."}
      />

      <InfoBox variant="success" title="Checklist: Ship-Ready TypeScript">
        <ul>
          <li>✅ strict: true in tsconfig &mdash; no exceptions</li>
          <li>✅ Zero uses of any &mdash; use unknown and narrow</li>
          <li>✅ No @ts-ignore &mdash; use @ts-expect-error with a reason</li>
          <li>✅ Union types over enums</li>
          <li>✅ Discriminated unions for complex state</li>
          <li>✅ Branded types for domain IDs</li>
          <li>✅ Return types on all exported functions</li>
          <li>✅ ESLint strict-type-checked rules enabled</li>
          <li>✅ Let inference do its job for local variables</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
