import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTsMigrationEnterprise() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="Migration & Enterprise Patterns"
      tagline="Converting a JS codebase without stopping the world, and the patterns that hold up at scale."
      meta={['TS 6', '12 patterns']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="TypeScript Field Guide · Migration & Enterprise Patterns"
      prev={{ path: '/typescript-field-guide/typing-react', label: 'Typing React' }}
      next={null}
    >
      <PosterCard
        glyph="Bb"
        title={<>Incremental <span className="dim">over Big Bang</span></>}
        language="typescript"
        code={`// Big Bang: convert every file at once
// -> massive PR, merge-conflict magnet, blocks other work

// Incremental: convert one file at a time, ship continuously
// 1. allowJs: true so .js and .ts coexist
// 2. Rename leaf files (no dependents) first
// 3. Add basic types, then enable strict checks gradually`}
        caption="Big Bang migrations create a PR nobody can meaningfully review and freeze the codebase for its duration. Incremental migration keeps the app shippable the entire time — always the safer default for production apps."
      />

      <PosterCard
        glyph="cfg"
        title={<>Migration-Friendly <span className="dim">tsconfig</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "allowJs": true,     // .js and .ts files coexist
    "checkJs": false,    // don't type-check the .js files yet
    "strict": false,     // MUST be explicit — TS 6 defaults it to TRUE
    "noImplicitAny": false
  }
}
// Phase 4, once every file is converted:
// allowJs: false, delete "strict": false, noImplicitAny: true`}
        caption="allowJs lets TypeScript compile a mixed JS/TS project without touching untouched files; checkJs: false means those .js files aren't type-checked yet, just parsed for imports. Under TypeScript 6 the strict line is no longer optional boilerplate: strict defaults to true, so a migration config that simply omits it lands you in full strict mode on day one — the opposite of what you want mid-migration. Finishing the migration now means DELETING that line rather than flipping it to true."
      />

      <PosterCard
        glyph="@te"
        title={<>@ts-expect-error <span className="dim">as a tracked TODO</span></>}
        language="typescript"
        code={`// AVOID — silences forever, nobody notices when it's stale
// @ts-ignore
const value = unstableApi();

// PREFER — documents why, and ERRORS once the suppression is no longer needed
// @ts-expect-error - unstableApi lacks types until v3.0
const value = unstableApi();`}
        caption="@ts-ignore hides an error permanently, even after the underlying issue is fixed. @ts-expect-error does the opposite — if the line stops erroring, the suppression itself becomes a compile error, so stale workarounds can't hide silently in a large migration."
      />

      <PosterCard
        glyph="a-u"
        title={<>any <span className="dim">→ unknown → real type</span></>}
        language="typescript"
        code={`// Stage 1 — unblock the migration
const data: any = await fetchData();

// Stage 2 — safer: forces narrowing before use
const data: unknown = await fetchData();
if (typeof data === 'object' && data !== null) { /* narrow further */ }

// Stage 3 — fully typed
interface ApiResponse { users: User[]; total: number; }
const data: ApiResponse = await fetchData();`}
        caption="any is an acceptable stage-1 escape hatch, not a destination — track every usage with a `// TODO: type this` comment and promote @typescript-eslint/no-explicit-any from warning to error once the migration completes."
      />

      <PosterCard
        glyph="Rt"
        title={<>Ratchet Strategy <span className="dim">— never go backward</span></>}
        language="typescript"
        code={`# CI check: count "any" usages and unconverted files.
# Fails the build if the count INCREASES — never has to decrease.
grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l
find src -name "*.js" -o -name "*.jsx" | wc -l`}
        caption="A ratchet doesn't force every PR to reduce migration debt — it just forbids adding more. That's the difference between a migration that eventually finishes and one that quietly regresses while everyone is busy shipping features."
      />

      <PosterCard
        glyph="4p"
        title={<>Four-Phase <span className="dim">Team Rollout</span></>}
        language="typescript"
        code={`// 1. Infrastructure  — tsconfig + allowJs, ESLint, tsc --noEmit in CI
// 2. Shared types     — API types & utilities convert first (leverage upward)
// 3. Bottom-up         — leaf components first, then inward
// 4. Enforce & tighten — allowJs: false, strict: true, block new .js in CI`}
        caption="Converting shared types and utilities in phase 2 pays off immediately — every component that imports them benefits without being converted itself. Save complex, deeply-coupled components for last."
      />

      <PosterCard
        glyph="Id"
        title={<>Branded ID <span className="dim">Factories at Scale</span></>}
        language="typescript"
        code={`declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };
type UserId = Brand<string, 'UserId'>;

const UserId = {
  parse(raw: string): UserId {
    if (!/^usr_[A-Za-z0-9]{16}$/.test(raw)) throw new Error(\`Invalid UserId: \${raw}\`);
    return raw as UserId;
  },
  unsafe: (raw: string): UserId => raw as UserId, // trusted input / tests only
};`}
        caption="Brand only at the boundary — the value enters your typed world through UserId.parse() at the fetch or JSON-parse layer and stays branded everywhere after. Every ID-shaped mix-up becomes a compile error instead of a support ticket."
      />

      <PosterCard
        glyph="aN"
        title={<>assertNever <span className="dim">— reusable exhaustiveness guard</span></>}
        language="typescript"
        code={`function assertNever(x: never): never {
  throw new Error(\`Unhandled case: \${JSON.stringify(x)}\`);
}

function describe(sub: Subscription): string {
  switch (sub.status) {
    case 'trial':  return 'Trial';
    case 'active': return 'Active';
    default:       return assertNever(sub); // compile error if a case is missing
  }
}`}
        caption="One small helper, reused on every switch over a discriminated union — add a new variant to the union, and every switch relying on assertNever stops compiling until you handle it. Catches missed cases at build time, not in production."
      />

      <PosterCard
        glyph="Rs"
        title={<>Result&lt;T, E&gt; <span className="dim">Instead of Throwing</span></>}
        language="typescript"
        code={`type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
const Ok  = <T,>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E,>(error: E): Result<never, E> => ({ ok: false, error });

function parseEmail(raw: unknown): Result<string, string> {
  if (typeof raw !== 'string' || !raw.includes('@')) return Err('invalid');
  return Ok(raw);
}`}
        caption="For expected failure modes — validation, parsing, business rules — a Result forces the caller to handle both branches at the call site. Reserve throw for genuinely exceptional errors the caller isn't expected to plan around."
      />

      <PosterCard
        glyph="O/P"
        title={<>Sculpting Types <span className="dim">via Omit &amp; Pick</span></>}
        language="typescript"
        code={`interface Customer {
  id: CustomerId; email: string; displayName: string;
  status: CustomerStatus; createdAt: Date; updatedAt: Date | null;
}

type CreateCustomerRequest = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateCustomerRequest = { id: CustomerId } & Partial<Omit<Customer, 'id'>>;
type CustomerListItem = Pick<Customer, 'id' | 'displayName' | 'status'>;`}
        caption="Hand-writing six parallel request/response interfaces means editing all six every time Customer changes. Deriving them with Omit/Pick keeps every variant in sync with the canonical model by construction."
      />

      <PosterCard
        glyph="ro"
        title={<>readonly <span className="dim">on Function Parameters</span></>}
        language="typescript"
        code={`// Signature communicates intent: this function does not mutate its input.
function total(items: readonly Item[]): number {
  // items.push(...)  <- compile error, caught before code review
  return items.reduce((sum, i) => sum + i.price, 0);
}`}
        caption="readonly on a parameter is free documentation the compiler enforces — callers know their array is safe to pass in, and an accidental .push or .sort inside the function is a compile error instead of a shared-reference bug."
      />

      <PosterCard
        glyph="Ds"
        title={<>JSDoc <span className="dim">for Non-Obvious Fields</span></>}
        language="typescript"
        code={`interface Money {
  /** ISO 4217 currency code, e.g. 'USD', 'EUR'. */
  currency: string;
  /**
   * Amount in the currency's smallest unit (cents, satoshi, ...).
   * NEVER represent money as a floating-point number.
   */
  minorUnits: number;
}`}
        caption="Types document the shape; JSDoc documents the intent behind a field that isn't self-explanatory. A one-line comment on minorUnits pays for itself at every autocomplete popup, long after the author has moved on."
      />

      <PosterQuickRef
        title="Which migration/enterprise tool do I need?"
        rows={[
          { need: 'Convert a large JS codebase safely', answer: 'Incremental migration, not Big Bang' },
          { need: 'Let .js and .ts coexist during migration', answer: 'allowJs: true, checkJs: false' },
          { need: 'Stop TS 6 forcing strict on a half-migrated repo', answer: 'Set "strict": false explicitly' },
          { need: 'Suppress an error but not forget about it', answer: '@ts-expect-error with a reason, never @ts-ignore' },
          { need: 'Stop migration debt from creeping back up', answer: 'CI ratchet on any-count / unconverted files' },
          { need: 'Prevent mixing IDs from different entities', answer: 'Branded ID type + parse() constructor' },
          { need: 'Force every switch case to be handled', answer: 'assertNever(x: never) helper' },
          { need: 'Model an expected failure, not a crash', answer: 'Result<T, E> return type' },
          { need: 'Keep request/response types in sync with the model', answer: 'Omit<T, K> / Pick<T, K>' },
        ]}
      />
    </PosterLayout>
  );
}
