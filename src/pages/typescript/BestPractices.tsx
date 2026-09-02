import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
    // strictBuiltinIteratorReturn, noImplicitAny,
    // noImplicitThis, useUnknownInCatchVariables
    // (alwaysStrict is NOT in this list any more — it is on by
    //  default on its own, independent of "strict".)

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
          <li><strong>strictBuiltinIteratorReturn</strong> &mdash; (TS 5.6+) built-in iterators return <code>undefined</code> rather than <code>any</code> for <code>TReturn</code>, so <code>it.next().value</code> is honestly typed</li>
          <li><strong>noImplicitAny</strong> &mdash; errors on expressions and declarations with an implied any type</li>
          <li><strong>noImplicitThis</strong> &mdash; errors on this expressions with an implied any type</li>
          <li><strong>useUnknownInCatchVariables</strong> &mdash; catch clause variables are typed unknown instead of any</li>
        </ul>
        <p>
          <strong>Not</strong> in the family, despite what most references say:{' '}
          <code>alwaysStrict</code> (emits <code>&quot;use strict&quot;</code>). It defaults to
          <code> true</code> on its own now and is only turned off by setting it to{' '}
          <code>false</code> explicitly.
        </p>
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

      <InfoBox variant="question" title="What {} Actually Means (It Is Not &quot;An Empty Object&quot;)">
        <p>
          The name misleads everyone. <code>{'{}'}</code> does not mean &quot;an object with no
          properties&quot; &mdash; it means <strong>&quot;anything that is not{' '}
          <code>null</code> or <code>undefined</code>&quot;</strong>. That falls straight out of
          structural typing: a type demanding zero properties is satisfied by every value that{' '}
          <em>has</em> properties, and in JavaScript that is everything except the two you cannot
          dot into.
        </p>
        <CodeBlock language="typescript" title="Verified on TypeScript 6.0">
{`declare function process(data: {}): void;

process("hello");     // ✓
process(42);          // ✓
process(true);        // ✓
process([1, 2]);      // ✓
process(() => {});    // ✓

process(null);        // ✗ error TS2345: Argument of type 'null' is not
process(undefined);   //   assignable to parameter of type '{}'.`}
        </CodeBlock>
        <p>
          Which makes <code>{'{}'}</code> genuinely useful for exactly one thing: as{' '}
          <code>NonNullable</code>, e.g. <code>{'T extends {}'}</code> to say &quot;T is not
          nullish&quot;. As a parameter type it is <code>any</code> wearing a disguise.
        </p>
        <p>
          Lowercase <code>object</code> is the different one: it means &quot;a non-primitive&quot;,
          so it rejects <code>string</code> and <code>number</code> but still accepts arrays and
          functions. And capital-<code>Object</code> is the boxed wrapper interface &mdash; behaves
          almost like <code>{'{}'}</code>, and is a mistake in every case. Reach for{' '}
          <code>{'Record<string, unknown>'}</code> or a real interface instead.
        </p>
      </InfoBox>
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
{`function focusInput(ref: React.RefObject<HTMLInputElement | null>) {
  ref.current!.focus();   // throws if the node is unmounted or not yet attached
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — optional chaining is safe">
{`function focusInput(ref: React.RefObject<HTMLInputElement | null>) {
  ref.current?.focus();
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Put the null INSIDE RefObject on React 19">
        <p>
          Writing the parameter as <code>React.RefObject&lt;HTMLInputElement&gt;</code> &mdash;
          which is what pre-19 code does &mdash; now rejects every ref you would actually pass:{' '}
          <code>useRef&lt;HTMLInputElement&gt;(null)</code> produces{' '}
          <code>RefObject&lt;HTMLInputElement | null&gt;</code>, and{' '}
          <code>RefObject</code> is invariant in <code>T</code>. The call site fails with
          &quot;Type &apos;null&apos; is not assignable to type &apos;HTMLInputElement&apos;&quot;,
          which reads like a bug in your ref rather than in the signature.
        </p>
      </InfoBox>

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

      <InfoBox variant="question" title="The Reason Behind That Rule: Where Do You Want the Error?">
        <p>
          &quot;Annotate exports, infer locals&quot; is repeated everywhere without its
          justification, which makes it feel arbitrary. It is not about noise. An annotation
          decides <strong>where a mistake is reported</strong>.
        </p>
        <CodeBlock language="typescript" title="Same bug, two very different failure modes">
{`// Inferred return type
export function getUser(id: string) {
  return { id, nmae: "Alice" };      // typo
}
// No error here. The return type simply BECOMES { id: string; nmae: string },
// and the failure surfaces later, in every consumer, as
// "Property 'name' does not exist on type ..." — far from the actual typo.

// Annotated return type
export function getUser(id: string): User {
  return { id, nmae: "Alice" };
  //           ~~~~
  // error TS2353: Object literal may only specify known properties,
  //               and 'nmae' does not exist in type 'User'.
}`}
        </CodeBlock>
        <p>
          An annotation is a <em>checkpoint</em>: it stops a wrong type propagating outward and
          reports it at the source. On an exported function it also pins the public contract, so
          an accidental change to the return shape breaks the build in one place instead of
          silently rippling through every caller.
        </p>
        <p>
          For a local <code>const</code> the same annotation buys nothing &mdash; the value and
          its use are three lines apart, and the annotation is one more thing that can go stale.
          Hence the rule. It is about error <em>locality</em>, not about typing effort.
        </p>
      </InfoBox>

      {/* 2i. Manual array copying vs the TS 5.2 copying methods */}
      <h3>i) Manual Array Copying vs the Built-in Copying Methods (TS 5.2+)</h3>
      <CodeBlock language="typescript" title="❌ Not wrong, but easy to get wrong — the spread-and-mutate dance">
{`function sortedDesc(nums: number[]): number[] {
  return [...nums].sort((a, b) => b - a);   // easy to forget the [...] and mutate the input
}
function withUpdated(items: string[], i: number, value: string): string[] {
  const copy = [...items];
  copy[i] = value;
  return copy;
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ TS 5.2+ (lib ES2023) — toSorted, toReversed, toSpliced, with">
{`function sortedDesc(nums: number[]): number[] {
  return nums.toSorted((a, b) => b - a);   // returns a new array — impossible to
}                                            // accidentally mutate the caller's array

function withUpdated(items: string[], i: number, value: string): string[] {
  return items.with(i, value);
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="Verified on TypeScript 6.0 / Node 25 — the original really is untouched">
        <p>
          You don&apos;t have <code>Array.prototype.sort()</code> mutating your data as a side
          effect anymore &mdash; not literally (the old mutating methods are still there), but you
          rarely need to reach for them once you know the copying versions exist. This needs{' '}
          <code>&quot;lib&quot;: [&quot;ES2023&quot;]</code> or later in <code>tsconfig.json</code>{' '}
          (this course&apos;s recommended configs already include it).
        </p>
        <CodeBlock language="text" title="Real console.log output">
{`original unchanged: [3,1,4,1,5,9,2,6]
toSorted result:    [1,1,2,3,4,5,6,9]
toReversed result:  [6,2,9,5,1,4,1,3]
toSpliced result:   [3,100,200,1,5,9,2,6]
with(0, 999):       [999,1,4,1,5,9,2,6]
original still:     [3,1,4,1,5,9,2,6]`}
        </CodeBlock>
      </InfoBox>

      {/* 2j. Manual grouping vs Object.groupBy / Map.groupBy */}
      <h3>j) Manual Grouping vs Object.groupBy / Map.groupBy (TS 5.4+)</h3>
      <CodeBlock language="typescript" title="❌ BAD — the reduce() you don't need lodash's groupBy for, but still hand-roll">
{`function groupByStatus(orders: Order[]): Record<string, Order[]> {
  return orders.reduce((acc, o) => {
    (acc[o.status] ??= []).push(o);
    return acc;
  }, {} as Record<string, Order[]>);
}`}
      </CodeBlock>
      <CodeBlock language="typescript" title="✅ GOOD — a real, typed built-in as of TS 5.4 (lib ES2024)">
{`const byStatus = Object.groupBy(orders, o => o.status);
// Partial<Record<string, Order[]>> — verbatim from tsc 6.0.3.
// Partial<> is what makes every value Order[] | undefined: a key you
// never grouped on simply isn't there, and the type says so.

const byStatusMap = Map.groupBy(orders, o => o.status);
// Map<string, Order[]> — verified. No undefined in the type parameter;
// the "might be missing" lives in .get()'s return instead.`}
      </CodeBlock>
      <InfoBox variant="tip" title="Why Two Versions Exist">
        <p>
          <code>Object.groupBy</code> returns{' '}
          <code>{'Partial<Record<K, T[]>>'}</code> &mdash; note the exact wording, because you will
          see it in error messages. The <code>Partial</code> is doing the work: it makes every
          value <code>{'T[] | undefined'}</code>, so TypeScript is honest that a key you never
          grouped on simply won&apos;t be there and you have to handle the{' '}
          <code>undefined</code> before you can <code>.map()</code> over a group.{' '}
          <code>Map.groupBy</code> is the one to reach for when the
          grouping key isn&apos;t a string (an object, a number you don&apos;t want coerced), or
          when you want <code>.get()</code>&apos;s explicit &quot;might not exist&quot; semantics
          instead of an index signature. Same <code>&quot;lib&quot;: [&quot;ES2024&quot;]</code>{' '}
          (or later) requirement as the array-copying methods above.
        </p>
      </InfoBox>

      {/* 2k. Regex bugs caught at compile time (TS 5.5+) */}
      <h3>k) A Regex Bug the Compiler Now Catches for You (TS 5.5+)</h3>
      <p>
        Before TS 5.5, a regex literal was just an opaque value to the type checker &mdash; any
        syntax error inside it (a duplicate named group, an unknown escape, an invalid quantifier)
        was purely a runtime surprise, the first time that line of code actually ran. TS 5.5 added
        real syntax checking for regex literals, so this class of bug now shows up at compile time
        instead:
      </p>
      <CodeBlock language="typescript" title="Verified on TypeScript 6.0 — a real compiler error, not a lint suggestion">
{`const parseDate = /(?<year>\\d{4})-(?<year>\\d{2})/;
//                                    ~~~~~~~~~~
// error TS1515: Named capturing groups with the same name
//               must be mutually exclusive to each other.`}
      </CodeBlock>
      <InfoBox variant="info" title="Scope: Syntax, Not Logic">
        <p>
          This only catches regexes that are malformed as <em>syntax</em> &mdash; duplicate names,
          invalid escapes, unbalanced groups. It cannot tell you a correctly-formed regex matches
          the wrong strings; that is still on you and your test cases, same as before TS 5.5.
        </p>
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
      <CodeBlock language="javascript" title="eslint.config.js &mdash; Key TypeScript Rules (flat config)">
{`import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  // strictTypeChecked needs type information — wire up the project service:
  ...tseslint.configs.strictTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error', { prefer: 'type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error', { argsIgnorePattern: '^_' },
      ],
    },
  },
);`}
      </CodeBlock>

      <InfoBox variant="info" title="Flat config only">
        The <code>.eslintrc.json</code> form &mdash; with <code>&quot;extends&quot;</code>{' '}
        strings like <code>&quot;plugin:@typescript-eslint/strict-type-checked&quot;</code>{' '}
        &mdash; stopped being the default in ESLint 9 and is <strong>removed in ESLint 10</strong>.
        The type-checked presets also need type information, which comes from{' '}
        <code>parserOptions.projectService</code> (the modern replacement for listing{' '}
        <code>project: [&apos;./tsconfig.json&apos;]</code> by hand).
      </InfoBox>

      {/* ── Section 10: tsconfig Strict Flags ────────────────────── */}
      <h2>10. tsconfig Strict Options Reference</h2>
      <CodeBlock language="typescript" title="What each strict flag catches">
{`// strictNullChecks — null/undefined are their own types
let name: string = null;  // Error!

// noImplicitAny — Requires explicit types where TS cannot infer
function log(msg) {}  // Error: 'msg' implicitly has 'any'

// strictFunctionTypes — Catches unsafe function subtyping.
// Parameters are checked CONTRAVARIANTLY, so widening is fine and
// narrowing is the error. Get the direction the right way round:
type Handler = (e: MouseEvent) => void;
const ok: Handler = (e: Event) => {};       // OK — a handler that accepts
                                            // any Event handles a MouseEvent
type Loose = (e: Event) => void;
const bad: Loose = (e: MouseEvent) => {};   // Error! It would be called with
                                            // a plain Event and read e.clientX

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

      {/* ── Section 13: Adapter Functions at the DTO Boundary ───────────────────── */}
      <h2>13. DO: Use Adapter Functions at the DTO Boundary</h2>

      <p>
        APIs almost never return the shape your application actually wants to work with. Server fields are{' '}
        <code>snake_case</code>, dates are strings, optional fields land as <code>null</code>, sometimes nested
        objects come back flattened. The biggest mistake a TypeScript codebase makes is leaking that API shape into
        every component, hook, and selector.
      </p>

      <InfoBox variant="danger" title="The anti-pattern: leaking API shapes into the app">
        <p>
          When the API's DTO type is what your components consume, every component implicitly knows about{' '}
          <code>created_at</code> vs <code>createdAt</code>, about <code>null</code> vs <code>undefined</code>,
          about whether <code>display_title</code> exists. A field rename on the server breaks 50 files. A new optional
          field forces every consumer to handle the case. The boundary is everywhere.
        </p>
      </InfoBox>

      <CodeBlock language="ts" title="Without adapters: API shape leaks everywhere" showLineNumbers>
{`// ❌ The API DTO is what consumers see
interface RecipeApi {
  recipe_id: number;
  display_title: string;
  author_handle: string;
  created_at: string;             // ISO string from the server
  last_cooked_at: string | null;  // null when never cooked
}

async function fetchRecipe(id: number): Promise<RecipeApi> {
  return (await fetch(\`/api/recipes/\${id}\`)).json();
}

// Now every consumer deals with snake_case, string dates, and null:
function RecipeCard({ recipe }: { recipe: RecipeApi }) {
  return (
    <div>
      <h2>{recipe.display_title}</h2>           {/* snake_case in JSX, ugly */}
      <p>By @{recipe.author_handle}</p>
      <p>Posted: {new Date(recipe.created_at).toLocaleDateString()}</p>
      {recipe.last_cooked_at !== null && (     {/* every consumer null-checks */}
        <p>Last cooked: {new Date(recipe.last_cooked_at).toLocaleDateString()}</p>
      )}
    </div>
  );
}`}
      </CodeBlock>

      <h3>The pattern: type the boundary, transform once, app sees clean types</h3>

      <CodeBlock language="ts" title="The adapter function pattern" showLineNumbers>
{`// 1. Type the API shape EXACTLY as the server sends it.
//    This type lives next to the fetch call and is NOT exported beyond.
interface RecipeApi {
  recipe_id: number;
  display_title: string;
  author_handle: string;
  created_at: string;
  last_cooked_at: string | null;
}

// 2. Type the domain shape the way YOUR APP wants to work.
//    This is what every consumer imports — camelCase, real Dates, undefined.
export interface Recipe {
  id: number;
  title: string;
  author: string;
  createdAt: Date;
  lastCookedAt: Date | undefined;
}

// 3. The adapter — the ONLY place that knows about both shapes.
export function adaptRecipe(api: RecipeApi): Recipe {
  return {
    id: api.recipe_id,
    title: api.display_title,
    author: api.author_handle,
    createdAt: new Date(api.created_at),
    lastCookedAt: api.last_cooked_at ? new Date(api.last_cooked_at) : undefined,
  };
}

// 4. Wrap the fetch so callers never see the DTO type.
export async function fetchRecipe(id: number): Promise<Recipe> {
  const raw: RecipeApi = await (await fetch(\`/api/recipes/\${id}\`)).json();
  return adaptRecipe(raw);
}

// Now consumers only see the clean Recipe type:
function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div>
      <h2>{recipe.title}</h2>
      <p>By @{recipe.author}</p>
      <p>Posted: {recipe.createdAt.toLocaleDateString()}</p>
      {recipe.lastCookedAt && (
        <p>Last cooked: {recipe.lastCookedAt.toLocaleDateString()}</p>
      )}
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="success" title="What you get from this boundary">
        <ul>
          <li><strong>API drift is contained.</strong> Server renames <code>display_title</code> → <code>headline</code>? You change <em>one line in <code>adaptRecipe</code></em>. Zero changes to UI code.</li>
          <li><strong>Null/undefined are normalized.</strong> The app picks one convention (usually <code>undefined</code> for missing in TypeScript) and the adapter does the mapping.</li>
          <li><strong>Type conversions happen once.</strong> String dates become real <code>Date</code> objects at the boundary. UI code never re-parses them.</li>
          <li><strong>Defensive logic has a home.</strong> Missing fields, malformed values, version differences — all handled in the adapter, not scattered across the UI.</li>
          <li><strong>Domain types are searchable.</strong> Find every place a <code>Recipe</code> is used → no false matches from <code>RecipeApi</code>, <code>RecipeDTO</code>, <code>RecipeResponse</code>, etc.</li>
        </ul>
      </InfoBox>

      <h3>Arrays and nested adapters</h3>

      <CodeBlock language="ts" title="Composing adapters" showLineNumbers>
{`interface IngredientApi {
  ingredient_id: number;
  display_name: string;
  quantity_grams: number | null;
}

export interface Ingredient {
  id: number;
  name: string;
  quantityGrams?: number;
}

export function adaptIngredient(api: IngredientApi): Ingredient {
  return {
    id: api.ingredient_id,
    name: api.display_name,
    quantityGrams: api.quantity_grams ?? undefined,
  };
}

// Composition — nested adapters
interface RecipeApi {
  recipe_id: number;
  display_title: string;
  ingredients: IngredientApi[];   // ← nested DTO
}

export interface Recipe {
  id: number;
  title: string;
  ingredients: Ingredient[];      // ← nested domain type
}

export function adaptRecipe(api: RecipeApi): Recipe {
  return {
    id: api.recipe_id,
    title: api.display_title,
    ingredients: api.ingredients.map(adaptIngredient),  // delegate to nested adapter
  };
}

// For lists, a tiny helper avoids repetition:
export const adaptRecipes = (items: RecipeApi[]): Recipe[] => items.map(adaptRecipe);`}
      </CodeBlock>

      <h3>Pairing with the API response envelope</h3>

      <CodeBlock language="ts" title="Adapter + ApiResponse<T> — the full boundary pattern" showLineNumbers>
{`import type { ApiResponse } from './types/api';   // the envelope from earlier

export async function fetchRecipe(id: number): Promise<ApiResponse<Recipe>> {
  try {
    const raw = await fetch(\`/api/recipes/\${id}\`);
    if (!raw.ok) {
      return { ok: false, data: null, error: raw.statusText };
    }
    const apiRecipe: RecipeApi = await raw.json();
    return { ok: true, data: adaptRecipe(apiRecipe), error: null };
  } catch (err) {
    return { ok: false, data: null, error: (err as Error).message };
  }
}

// Consumers see a clean, type-safe contract:
const res = await fetchRecipe(42);
if (res.ok && res.data) {
  res.data.title;             // ✅ string (camelCase, clean)
  res.data.createdAt;         // ✅ Date object
} else {
  showError(res.error);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Naming conventions for the pattern">
        <ul>
          <li><code>adapt<strong>Foo</strong>(api: FooApi): Foo</code> — one-direction, API → domain. Most common.</li>
          <li><code>serialize<strong>Foo</strong>(foo: Foo): FooApi</code> — domain → API. Used for outgoing payloads (POST/PUT bodies).</li>
          <li><code>FooApi</code> / <code>Foo<strong>DTO</strong></code> / <code>Foo<strong>Response</strong></code> — pick one suffix for "the API shape" and use it consistently across the codebase.</li>
          <li>Adapter files often live in <code>src/adapters/</code> or alongside the service files that call them.</li>
        </ul>
      </InfoBox>

      <InfoBox variant="warning" title="When NOT to adapt">
        <p>
          If the API shape is already exactly what your app wants — same casing, same types, same null semantics —
          adding an adapter is pure ceremony. The pattern earns its keep when there's a <em>real impedance mismatch</em>{' '}
          between server and client conventions. Small toy apps with a single Express backend you control don't need
          adapters; large apps consuming third-party APIs almost always do.
        </p>
      </InfoBox>

      {/* ── Section 14: Interactive Challenges ───────────────────── */}
      <h2>14. Test Your Knowledge</h2>

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
