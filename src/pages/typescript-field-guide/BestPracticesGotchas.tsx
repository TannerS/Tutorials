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
      meta={['TS 5+', '12 gotchas']}
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
process(null as any);  // only null/undefined are excluded

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
        ]}
      />
    </PosterLayout>
  );
}
