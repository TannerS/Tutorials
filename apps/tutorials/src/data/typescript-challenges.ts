/**
 * TypeScript Interactive Challenges
 *
 * Each challenge presents a coding prompt with starter code. The user writes
 * TypeScript that should satisfy the hidden test assertions. Validation runs
 * in a Web Worker that compiles the combined code with the actual TypeScript
 * compiler.
 *
 * Hidden tests use the standard `Expect<Equal<X, Y>>` type-level assertion
 * pattern — popularized by libraries like type-fest and ts-toolbelt.
 */

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface Challenge {
  id: string;
  category: string;
  title: string;
  difficulty: ChallengeDifficulty;
  /** Markdown-style description shown above the editor. Use \n for new paragraphs. */
  prompt: string;
  /** Initial code shown in the editor. */
  starter: string;
  /** Hidden code appended to the user's code before compilation. Used for type assertions. */
  hiddenTests: string;
  /** Optional progressive hints. */
  hints?: string[];
  /** Model solution — revealed if the user clicks "Show solution". */
  solution: string;
}

/**
 * Type-assertion helpers prepended to every challenge.
 * Standard `Equal<X, Y>` + `Expect<T extends true>` pattern.
 */
export const ASSERTION_HELPERS = `
// ── Test helpers (auto-injected, do not modify) ──────────────────────────────
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false;

type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;
type ExpectExtends<A, B> = A extends B ? true : false;
`.trim();

export const CHALLENGES: Challenge[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: FUNDAMENTALS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'narrow-string-or-number',
    category: 'Fundamentals',
    title: 'Narrow a string | number to a string',
    difficulty: 'easy',
    prompt:
`Write a function called \`format\` that takes a \`string | number\` argument and returns a \`string\`.

Inside the body, use a \`typeof\` check to narrow the parameter. The function should:
- Return the input directly when it's already a string.
- Convert it via \`.toString()\` when it's a number.

The signature MUST be: \`(input: string | number) => string\``,
    starter:
`// TODO: Add the type annotations and implement the body using narrowing.
function format(input) {
  // your code here
}
`,
    hiddenTests:
`// ── Hidden tests ─────────────────────────────────────────────────────────────
type _t1 = Expect<Equal<Parameters<typeof format>, [string | number]>>;
type _t2 = Expect<Equal<ReturnType<typeof format>, string>>;

// Runtime sanity:
const _r1: string = format('hello');
const _r2: string = format(42);
`,
    hints: [
      "Add a type annotation to the parameter: `input: string | number`.",
      "Add a return type annotation: `: string`.",
      "Use `if (typeof input === 'number') { ... }` inside the body to narrow.",
    ],
    solution:
`function format(input: string | number): string {
  if (typeof input === 'number') return input.toString();
  return input;
}
`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: GENERICS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'generic-identity',
    category: 'Generics',
    title: 'A generic identity function',
    difficulty: 'easy',
    prompt:
`Make the \`identity\` function generic so that its return type matches its argument type.

\`identity('hello')\` should return type \`string\`, \`identity(42)\` should return type \`number\`, and so on — never \`any\` or \`unknown\`.

The signature should be: \`<T>(value: T) => T\``,
    starter:
`// TODO: Make this function generic. The return type must match the argument type.
function identity(value) {
  return value;
}
`,
    hiddenTests:
`// ── Hidden tests ─────────────────────────────────────────────────────────────
const _r1: string = identity('hello');
const _r2: number = identity(42);
const _r3: { a: number } = identity({ a: 1 });

// Type-level: function is generic over T
type _t1 = Expect<Equal<ReturnType<typeof identity<string>>, string>>;
type _t2 = Expect<Equal<ReturnType<typeof identity<number>>, number>>;
type _t3 = Expect<Equal<ReturnType<typeof identity<{ a: 1 }>>, { a: 1 }>>;
`,
    hints: [
      'Add a type parameter to the function: `function identity<T>(...)`.',
      'Annotate both the parameter and the return type with `T`: `(value: T): T`.',
      'The body stays the same — just return `value`.',
    ],
    solution:
`function identity<T>(value: T): T {
  return value;
}
`,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORY: PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'api-response-discriminated',
    category: 'Patterns',
    title: 'The ApiResponse discriminated union',
    difficulty: 'medium',
    prompt:
`Define a generic type \`ApiResponse<T>\` as a discriminated union with two variants:

**Success branch** — \`{ ok: true; data: T }\`
**Failure branch** — \`{ ok: false; error: string }\`

When a caller writes \`if (res.ok) { ... }\`, TypeScript should narrow \`res\` to the success branch — \`res.data\` becomes \`T\`. In the \`else\` branch, \`res.error\` should be a \`string\`.

This is the pattern from the "Envelope Generics" lesson — implement just the union type itself, no helper functions needed.`,
    starter:
`// TODO: Define ApiResponse<T> as a discriminated union.
// Hint: use 'ok: true' on one branch and 'ok: false' on the other.

type ApiResponse<T> = /* your union here */;
`,
    hiddenTests:
`// ── Hidden tests ─────────────────────────────────────────────────────────────
interface Recipe { id: number; name: string; }

declare const res: ApiResponse<Recipe>;

if (res.ok) {
  const _data: Recipe = res.data;          // ✅ should narrow data to Recipe
} else {
  const _err: string = res.error;        // ✅ should narrow error to string
}

// Type-level: the union has both branches with correct shapes
type _Success = Extract<ApiResponse<Recipe>, { ok: true }>;
type _Failure = Extract<ApiResponse<Recipe>, { ok: false }>;

type _t1 = Expect<Equal<_Success['data'], Recipe>>;
type _t2 = Expect<Equal<_Failure['error'], string>>;
type _t3 = Expect<Equal<_Success['ok'], true>>;
type _t4 = Expect<Equal<_Failure['ok'], false>>;
`,
    hints: [
      'A discriminated union uses `|` between object types that share a common property (the "discriminant").',
      'Here the discriminant is `ok`. Use the literal types `true` and `false`, not just `boolean`.',
      'Pattern: `type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };`',
    ],
    solution:
`type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
`,
  },
];

/** Group challenges by category for sidebar display. */
export function groupByCategory(challenges: Challenge[]): Map<string, Challenge[]> {
  const map = new Map<string, Challenge[]>();
  for (const ch of challenges) {
    if (!map.has(ch.category)) map.set(ch.category, []);
    map.get(ch.category)!.push(ch);
  }
  return map;
}
