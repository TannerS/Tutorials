import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTsBestPracticesGotchas() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="Best Practices & Gotchas"
      tagline="The got-ya moments that separate production-grade TypeScript from any-driven development."
      meta={['TS 6', '19 gotchas']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="TypeScript Field Guide · Best Practices & Gotchas"
      prev={{ path: '/typescript-field-guide/project-setup', label: 'Project Setup & tsconfig' }}
      next={{ path: '/typescript-field-guide/typescript-types', label: 'TypeScript Types & Generics' }}
    >
      <PosterCard
        glyph="a/u"
        title={<>any <span className="dim">disables checking entirely</span></>}
        language="typescript"
        code={`// Bug: input is a number, but TS never flags it
function parse(input: any) {
  return input.trim().toLowerCase(); // crashes at runtime
}

// Fix: unknown forces you to narrow before touching it
function parse(input: unknown): string {
  if (typeof input !== 'string') throw new TypeError('Expected a string');
  return input.trim().toLowerCase();
}`}
        caption="any doesn't just skip checking that value — it silently disables checking on everything derived from it. unknown gives you the same 'I don't know the type yet' flexibility but forces a check before any operation compiles."
      />

      <PosterCard
        glyph="!"
        title={<>Non-null Assertion <span className="dim">(!) Overuse</span></>}
        language="typescript"
        code={`// Bug: ref.current can genuinely be null on first render
function focusInput(ref: React.RefObject<HTMLInputElement>) {
  ref.current!.focus(); // crashes if the ref hasn't attached yet
}

// Fix: optional chaining handles the null case safely
function focusInput(ref: React.RefObject<HTMLInputElement>) {
  ref.current?.focus();
}`}
        caption="! tells the compiler 'trust me, this is never null' — it doesn't make the value non-null, it just deletes the safety net. Reach for ?. or an explicit if-guard first; reserve ! for cases you can actually prove, like right after a length check."
      />

      <PosterCard
        glyph="En"
        title={<>Enum <span className="dim">Pitfalls</span></>}
        language="typescript"
        code={`enum Status { Active, Inactive } // numeric enum by default

function isActive(s: Status) { return s === Status.Active; }
isActive(0);       // compiles! Status.Active is just 0 under the hood
isActive(99 as Status); // compiles — numeric enums aren't range-checked

// Fix: a union of literals rejects both cases at compile time
type Status2 = 'active' | 'inactive';`}
        caption="Numeric enums are structurally just numbers, so any number in range (or out of it, with a cast) satisfies the enum type. A union of string literals is checked exactly, generates no runtime object, and is the modern default."
      />

      <PosterCard
        glyph="Ep"
        title={<>Excess Property Checks <span className="dim">— only on literals</span></>}
        language="typescript"
        code={`interface Options { timeout: number; }

const o1: Options = { timeout: 5, retrys: 3 }; // Error — 'retrys' not in Options
// Typo caught immediately because it's a fresh object literal

const draft = { timeout: 5, retrys: 3 };
const o2: Options = draft; // NO error — draft is an existing variable, not a literal`}
        caption="TypeScript only excess-checks object literals assigned directly — the same object routed through a variable first passes, because now it's judged by structural compatibility, not literal shape. A typo'd property name can slip through that gap."
      />

      <PosterCard
        glyph="St"
        title={<>Structural Typing <span className="dim">Surprises</span></>}
        language="typescript"
        code={`interface Point { x: number; y: number; }
interface Vector { x: number; y: number; }

function move(p: Point) { /* ... */ }
const v: Vector = { x: 1, y: 2 };
move(v); // OK — Vector has every property Point needs, name doesn't matter`}
        caption="TypeScript checks shape, not declared identity — two unrelated interfaces with the same fields are freely interchangeable. This is usually convenient, but it's exactly why look-alike domain values (UserId vs OrderId, both strings) need branded types to stay separate."
      />

      <PosterCard
        glyph="ro"
        title={<>readonly <span className="dim">Is Shallow</span></>}
        language="typescript"
        code={`type FrozenUser = Readonly<{ id: string; address: { city: string } }>;

const u: FrozenUser = { id: '1', address: { city: 'NYC' } };
// u.id = '2';           // Error — top-level property is frozen
u.address.city = 'LA';   // NO error — nested object is still mutable!`}
        caption="Readonly<T> only freezes the top level. Nested objects and arrays remain fully mutable unless you write (or reach for) a DeepReadonly<T> mapped type — assuming readonly means 'immutable all the way down' is a common source of surprise bugs."
      />

      <PosterCard
        glyph="Ix"
        title={<>Index Signature <span className="dim">Gotcha</span></>}
        language="typescript"
        code={`const scores: Record<string, number> = { alice: 90 };

const bobScore = scores['bob']; // typed "number" — but it's actually undefined!
bobScore.toFixed(2);            // compiles, crashes at runtime

// Fix: "noUncheckedIndexedAccess": true in tsconfig makes this
// "number | undefined" instead, forcing a check before use.`}
        caption="By default, TypeScript trusts that every key you index into a Record actually exists — it doesn't. This is one of the highest-value flags NOT in strict; see the Project Setup page for the full noUncheckedIndexedAccess breakdown."
      />

      <PosterCard
        glyph="Fn"
        title={<>Function <span className="dim">Type Is Too Loose</span></>}
        language="typescript"
        code={`// Bug: Function accepts ANY callable with ANY arguments
function onClick(callback: Function) {
  callback('unexpected', 'args', 42); // compiles, may crash the callback
}

// Fix: a specific signature catches mismatches at the call site
function onClick(callback: (event: MouseEvent) => void) {
  callback(new MouseEvent('click'));
}`}
        caption="The Function type describes 'something callable,' nothing more — TypeScript can't check arity or argument types against it. Always write out the exact parameter and return types you expect to call it with."
      />

      <PosterCard
        glyph="{}"
        title={<>{'{}'} <span className="dim">and Object Match Almost Anything</span></>}
        language="typescript"
        code={`function process(data: {}) { /* ... */ }
function handle(data: Object) { /* ... */ }

process('a string');  // compiles!
process(42);           // compiles!
process(null);         // Error — null and undefined are the ONLY things
process(undefined);    // Error —   {} rejects. Verified with tsc.

// Fix: say what you actually expect
function process(data: Record<string, unknown>) { /* ... */ }`}
        caption="{} means 'any non-null, non-undefined value' — strings, numbers, and booleans all satisfy it, which is almost never what you meant by 'an object.' Use Record<string, unknown> or a real interface instead."
      />

      <PosterCard
        glyph="as"
        title={<>Type Assertions <span className="dim">Lie — Narrowing Doesn't</span></>}
        language="typescript"
        code={`// Bug: 'as' makes a claim the compiler doesn't verify
function getLength(value: unknown): number {
  return (value as string).length; // crashes if value isn't a string
}

// Fix: typeof actually checks before narrowing
function getLength(value: unknown): number {
  if (typeof value === 'string') return value.length;
  return 0;
}`}
        caption="as tells the compiler to trust you — it performs zero runtime verification. A typeof, instanceof, or custom type-predicate check narrows the type AND guarantees the claim is true before the code that depends on it runs."
      />

      <PosterCard
        glyph="Bd"
        title={<>Boundary Data <span className="dim">Is Never Actually Checked</span></>}
        language="typescript"
        code={`// Compiles clean under strict. Verifies NOTHING.
const data: User = await res.json();

// res.json() and JSON.parse are both typed 'any', and any is assignable
// to everything — so ': User' asks the compiler no question at all.
// It is an ASSERTION wearing declaration syntax.

// ✅ Cheapest possible fix, no library required:
const raw: unknown = await res.json();   // must narrow before any use

// Unvalidated no matter how carefully you typed it:
//   fetch / res.json()   JSON.parse   process.env   form fields
//   URL + search params  localStorage  queues  third-party callbacks`}
        caption="Types are erased before your code runs, so the compiler's guarantee stops at the process boundary. Rename a field on the backend and nothing fails at the edge — it fails three components deep as 'Cannot read properties of undefined', in a file that is not the broken one. Annotating the raw value ': unknown' instead of ': User' converts that silent runtime crash into a compile error you cannot ignore."
      />

      <PosterCard
        glyph="Sc"
        title={<>Schema <span className="dim">as Single Source of Truth</span></>}
        language="typescript"
        code={`const UserSchema = z.object({
  id:    z.number().int().positive(),
  email: z.email(),                 // Zod v4 top-level; v3 was .string().email()
});

type User = z.infer<typeof UserSchema>;   // DERIVE it — never write it twice

UserSchema.parse(raw);        // THROWS ZodError — for invariants that should
                              // crash: env at startup, broken API contracts
const r = UserSchema.safeParse(raw);   // discriminated union, no try/catch
if (r.success) r.data;        // typed + narrowed
else           r.error;       // only available in this branch`}
        caption="One declaration, two outputs: a runtime validator and a static type. An interface sitting next to a hand-written check is two things that drift apart the first time someone edits one. Rule of thumb: safeParse for humans (form input you must render errors for), parse for programmer errors and startup invariants. Validate once at the edge, then trust internally — re-parsing between your own already-validated functions is what the static types are for."
      />

      <PosterCard
        glyph="Nr"
        title={<>Narrowing Evaporates <span className="dim">at a Closure Boundary</span></>}
        language="typescript"
        code={`let name: string | null = 'x';
function reset() { name = null; }   // ...and it fails even with NO reset() at all

if (name !== null) {
  name.toUpperCase();               // ✅ narrowed here
  setTimeout(() => name.toUpperCase());
  //                ~~~~ TS18047: 'name' is possibly 'null'
}

// Same thing for a narrowed PROPERTY inside any callback:
if (box.v) {
  run(() => box.v.toUpperCase());
  //         ~~~~~ TS18048: 'box.v' is possibly 'undefined'
}

// ✅ Fix both: copy into a const FIRST, then narrow the const
const v = box.v;
if (v) run(() => v.toUpperCase());`}
        caption="Narrowing is control-flow analysis, and a callback has no knowable execution time — TypeScript cannot prove the value is still narrowed when it eventually runs, so it discards the narrowing at the function boundary. This is a correctness feature, not a limitation: reset() really could run first. The trigger is the DECLARATION, not the assignment: verified on tsc 6.0.3, a let that is never reassigned anywhere in the program still gets TS18047 inside the closure. Only const survives, because only const is un-reassignable by construction — which is why the fix is to copy into a const first, not to hunt for the assignment."
      />

      <PosterCard
        glyph="Ea"
        title={<>Error Anatomy <span className="dim">— read the chain bottom-up</span></>}
        language="text"
        code={`error TS2345: Argument of type '{ retry: { policy: { attempts: string; }; }; }'
              is not assignable to parameter of type 'Config'.
  The types of 'retry.policy.attempts' are incompatible between these types.
    Type 'string' is not assignable to type 'number'.
    ^^^^ START HERE — the last line is the ACTUAL problem

Structure of every TS error:
  TS####          the code — stable, searchable
  line 1          the OUTERMOST failure: what you passed, what was wanted
  each indent     one level deeper into WHY
  last line       the root cause, in primitive terms

Read: bottom line = the real fix (attempts is a string, make it a number).
      top line    = where to look (the argument to init()).`}
        caption="A wall of text is really a stack trace through the type structure. The first line names the widest mismatch, each nested line drills one level in, and the deepest line is the only one that tells you what to actually change. Read bottom-up to find the fix, then top-down to find the file position. Long chains of nested object types are the reason a one-character typo can produce twenty lines of output."
      />

      <PosterCard
        glyph="##"
        title={<>The Error Codes <span className="dim">You&apos;ll Actually Hit</span></>}
        language="text"
        code={`TS2322  Type 'X' is not assignable to type 'Y'
        → an ASSIGNMENT / return value is wrong
TS2345  Argument of type 'X' is not assignable to parameter of type 'Y'
        → same problem, but at a CALL SITE
TS2339  Property 'x' does not exist on type 'Y'
        → typo, or you have not narrowed a union yet
TS2353  Object literal may only specify known properties
        → excess property check on a FRESH literal
TS2741  Property 'x' is missing in type 'A' but required in type 'B'
TS2554  Expected N arguments, but got M
TS7006  Parameter 'x' implicitly has an 'any' type      (noImplicitAny)
TS18047 'x' is possibly 'null'                          (strictNullChecks)
TS18048 'x' is possibly 'undefined'                     (strictNullChecks)
TS2341  Property 'x' is private and only accessible within class 'C'`}
        caption="Codes are stable across releases and far better search terms than the message text, which gets reworded. The number also tells you which flag is talking: the 18xxx family is strictNullChecks, 7xxx is the implicit-any family, and 2322 vs 2345 is purely assignment-position vs call-position — same underlying check, so the fix is identical."
      />

      <PosterCard
        glyph="Ov"
        title={<>Over-Annotation <span className="dim">Adds Noise</span></>}
        language="typescript"
        code={`// Noisy — TS already knows every one of these types
const name: string = 'Alice';
const doubled: number[] = nums.map((n: number): number => n * 2);

// Clean — let inference do the obvious work
const name = 'Alice';
const doubled = nums.map(n => n * 2);`}
        caption="Redundant annotations don't add safety — they add a second place that can drift out of sync with the implementation. Annotate function parameters and exported return types; let inference handle local variables and callbacks."
      />

      <PosterCard
        glyph="eo"
        title={<>Optional Prop <span className="dim">vs Explicit undefined</span></>}
        language="typescript"
        code={`interface Options { timeout?: number; }

const a: Options = {};                  // "not provided"
const b: Options = { timeout: undefined }; // also compiles by default — same type!

// 'timeout' in a  -> false
// 'timeout' in b  -> true   <-- silently different behavior, same declared type
// Fix: "exactOptionalPropertyTypes": true makes 'b' a compile error`}
        caption="Without exactOptionalPropertyTypes, ? and 'explicitly set to undefined' are the same type but not the same runtime behavior — code using the 'in' operator or Object.keys to check presence can be silently wrong. See the Project Setup page for the flag."
      />

      <PosterCard
        glyph="dg"
        title={<>Module Augmentation <span className="dim">That Silently Does Nothing</span></>}
        language="typescript"
        code={`// ❌ Inside any file with an import/export, this declares a brand-new
//    LOCAL namespace. No error, no warning — req.user still doesn't exist.
declare namespace Express {
  interface Request { user?: { id: string } }
}

// ✅ Reach the real global namespace @types/express declares
import 'express';
declare global {
  namespace Express {
    interface Request { user?: { id: string } }
  }
}

// Rule: 'declare module "X"' merges into what X EXPORTS.
// It cannot reach a type X only declares globally — which is
// exactly the case for Express.Request.`}
        caption="The most-copied broken snippet in the Express + TypeScript world. A bare `declare namespace` in a module scope is a local declaration, not an augmentation — it compiles cleanly and does nothing. `declare global` (which itself requires the file to be a module) is what reaches the global Express namespace. Same trap in reverse: demoing declaration merging with `interface Window` only 'works' because your local Window shadows the DOM one."
      />

      <PosterCard
        glyph="ce"
        title={<>const enum <span className="dim">Doesn&apos;t Inline Under a Bundler</span></>}
        language="typescript"
        code={`const enum Feature { DarkMode = 'DARK_MODE' }
const f = Feature.DarkMode;

// tsc, whole-program:   const f = "DARK_MODE";   ← inlined, no runtime object
// Vite / esbuild / SWC: emits the full enum IIFE, exactly like a plain enum

// erasableSyntaxOnly (TS 5.8+, needed for Node's native type stripping)
// rejects enums of ANY kind: "This syntax is not allowed when
// 'erasableSyntaxOnly' is enabled."`}
        caption="Inlining needs whole-program knowledge, and single-file transpilers don't have it — so under isolatedModules a const enum quietly degrades to an ordinary enum and you get the runtime object you were trying to avoid, plus a build that differs from tsc's. The as-const object + derived union has none of these failure modes."
      />

      <PosterQuickRef
        title="What's the fix for this gotcha?"
        rows={[
          { need: 'Function parameter could be literally anything', answer: 'unknown, not any — then narrow' },
          { need: '.current might be null on a DOM ref', answer: '?. instead of !' },
          { need: 'A fixed set of string constants', answer: 'Union of literals, not enum' },
          { need: 'Object literal typo not caught', answer: 'Assign the literal directly, not via a variable' },
          { need: 'readonly nested object still mutates', answer: 'DeepReadonly<T>, Readonly<T> is shallow' },
          { need: 'arr[i] typed as if it always exists', answer: 'noUncheckedIndexedAccess in tsconfig' },
          { need: "Callback typed as just Function", answer: 'Write the exact (args) => ReturnType signature' },
          { need: "'as' hides a wrong runtime shape", answer: 'typeof / instanceof / type predicate instead' },
          { need: 'req.user still not on Express.Request', answer: 'declare global { namespace Express { ... } }' },
          { need: 'fetch/JSON.parse result annotated with my type', answer: 'That is an assertion — annotate unknown, then parse' },
          { need: 'Stop the schema and the interface drifting apart', answer: 'Declare the schema, derive the type via z.infer' },
          { need: 'const enum still emits a runtime object', answer: 'Expected under isolatedModules — use as const' },
          { need: 'Narrowed value is "possibly null" in a callback', answer: 'Copy to a const first, then narrow the const' },
          { need: 'A 20-line type error and no idea where to start', answer: 'Read the LAST line — that is the root cause' },
          { need: 'Searching for an error message finds nothing', answer: 'Search the TS#### code instead — it is stable' },
        ]}
      />
    </PosterLayout>
  );
}
