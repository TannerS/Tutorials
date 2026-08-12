import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideTsFundamentals() {
  return (
    <PosterLayout
      accent="blue"
      eyebrow="TypeScript · Field Reference"
      title="TypeScript Fundamentals"
      tagline="Primitives, inference, and the interface/type-alias split — the base every other page builds on."
      meta={['TS 5+', '14 concepts']}
      footerLabel="Personal study reference — TypeScript"
      pageLabel="TypeScript Field Guide · Fundamentals"
      prev={null}
      next={{ path: '/typescript-field-guide/typescript-types', label: 'TypeScript Types & Generics' }}
    >
      <PosterCard
        glyph="Pr"
        title={<>Primitive <span className="dim">&amp; Literal Types</span></>}
        language="typescript"
        code={`string  number  boolean  bigint  symbol
null  undefined  void  never  unknown  any

// literal types — a value is its own type
type Yes = 'yes';
type Zero = 0;
let retries: 3 = 3;`}
        caption="Literal types are the building block of every union — 'active' | 'archived' is just two literal types joined. never is a type with no valid values; unknown is the type-safe any."
      />

      <PosterCard
        glyph="In"
        title={<>Type <span className="dim">Inference</span></>}
        language="typescript"
        code={`const name = 'Alice';              // inferred: string
const count = items.length;        // inferred: number
const doubled = nums.map(n => n * 2); // inferred: number[]

// Annotate where inference CAN'T reach:
function log(msg: string) {}       // param — always annotate
export function fetchUser(id: string): Promise<User> { /* ... */ } // public return`}
        caption="TypeScript infers from initializers and return statements. Annotate function parameters (never inferred) and exported function returns (locks the public API) — let inference handle everything else."
      />

      <PosterCard
        glyph="AT"
        title={<>Arrays <span className="dim">&amp; Tuples</span></>}
        language="typescript"
        code={`const nums: number[] = [1, 2, 3];
const nums2: Array<number> = [1, 2, 3];

type Pair = [x: number, y: number];
type Named = readonly [name: string, age: number];

const p: Named = ['Alice', 30];
p[0]; // 'Alice' — labeled tuples double as inline docs`}
        caption="A tuple is a fixed-length array where each position has its own type — labeling the elements (name:, age:) doesn't change the runtime value, just what your editor shows on hover."
      />

      <PosterCard
        glyph="i/t"
        title={<>Interface <span className="dim">vs Type Alias</span></>}
        language="typescript"
        code={`interface User { id: string; name: string; }  // merges, extends via 'extends'
type ID = string | number;                     // unions, tuples, primitives
type Point = { x: number; y: number; };        // object alias — looks like interface

// Rule of thumb:
// Object shape, especially a public API? -> interface
// Union, tuple, mapped/conditional type?  -> type`}
        caption="Interfaces support declaration merging (great for SDKs consumers extend); type aliases are the only option for unions, tuples, and primitive aliases. Default to interface for object shapes, type for everything else."
      />

      <PosterCard
        glyph="Ex"
        title={<>Extending <span className="dim">Interfaces</span></>}
        language="typescript"
        code={`interface Timestamped { createdAt: Date; updatedAt: Date; }
interface SoftDeletable { deletedAt?: Date; isDeleted: boolean; }

interface BaseEntity extends Timestamped {
  id: string;
}
interface ManagedEntity extends Timestamped, SoftDeletable {
  id: string;
  version: number;
}`}
        caption="extends composes shared shapes without copy-pasting fields — unlike classes, an interface can extend multiple other interfaces at once."
      />

      <PosterCard
        glyph="DM"
        title={<>Declaration <span className="dim">Merging</span></>}
        language="typescript"
        code={`// Two interfaces, same name, same scope — they merge automatically.
declare namespace Express {
  interface Request {
    user?: { id: string; role: 'admin' | 'user' };
  }
}
// req.user is now available everywhere Express.Request is used`}
        caption="Declaration merging is exclusive to interfaces — it's how you safely extend a third-party library's types (like adding req.user to Express) without touching their source. Type aliases with a duplicate name are a compile error."
      />

      <PosterCard
        glyph="&"
        title={<>Intersection <span className="dim">Types (&amp;)</span></>}
        language="typescript"
        code={`type Timestamped = { createdAt: Date; updatedAt: Date };
type Identifiable = { id: string };

type Resource = Identifiable & Timestamped & {
  name: string;
  owner: string;
};
// Equivalent to an interface extending both`}
        caption="& is the type-alias equivalent of extends. Unlike interface extends, TS won't error on conflicting property types up front — a property typed differently in each side just collapses to never."
      />

      <PosterCard
        glyph="?/ro"
        title={<>Optional <span className="dim">&amp; Readonly Properties</span></>}
        language="typescript"
        code={`interface Config {
  host: string;
  port?: number;        // widens to number | undefined
  readonly ssl: boolean; // cannot be reassigned after creation
}

function connect(c: Config) {
  const port = c.port ?? 3000; // must handle the missing case
}`}
        caption="? doesn't set a default — it means 'this may be undefined,' and you must handle that before use. readonly blocks reassignment on the property itself, but it's a compile-time check only, not a runtime freeze."
      />

      <PosterCard
        glyph="Ix"
        title={<>Index <span className="dim">Signatures</span></>}
        language="typescript"
        code={`interface AppConfig {
  appName: string;
  version: string;
  [key: string]: unknown; // any other key is allowed
}

const config: AppConfig = {
  appName: 'Dashboard',
  version: '2.1.0',
  featureFlags: { darkMode: true }, // OK — matches the index signature
};`}
        caption="Use an index signature when a type has some known properties plus arbitrary extras. If every key shares the same value type and there are no fixed keys, reach for Record<K, V> instead — it's more precise."
      />

      <PosterCard
        glyph="En"
        title={<>Enums <span className="dim">vs Union of Literals</span></>}
        language="typescript"
        code={`// AVOID — enums generate runtime code and have quirks
enum Status { Active = 'active', Inactive = 'inactive' }

// PREFER — zero runtime cost, structurally simple
type Status = 'active' | 'inactive' | 'pending';

// Need an iterable object too? Use as const:
const STATUS = { Active: 'active', Inactive: 'inactive' } as const;
type Status2 = typeof STATUS[keyof typeof STATUS];`}
        caption="Numeric enums leak reverse mappings at runtime and enums aren't structurally compatible with equivalent literal strings — a union of literals is zero-cost and the modern default; add an `as const` object only when you need runtime iteration."
      />

      <PosterCard
        glyph="Fn"
        title={<>Function <span className="dim">Types</span></>}
        language="typescript"
        code={`type Comparator<T> = (a: T, b: T) => number;

interface SearchFn {
  (source: string, term: string): boolean; // call signature
}

interface DateParser {              // overloaded signatures
  (input: string): Date;
  (input: number): Date;
}`}
        caption="A type alias with an arrow signature covers most cases; an interface call signature is needed when you also want the callable to carry extra properties, or when you need multiple overloaded signatures."
      />

      <PosterCard
        glyph="Cl"
        title={<>Class Members <span className="dim">&amp; Access Modifiers</span></>}
        language="typescript"
        code={`class Account {
  public owner: string;       // default — anywhere
  protected balance = 0;      // this class + subclasses
  private pin = '1234';       // TS-only check, erased at runtime
  #secret = 'x';              // ES private — enforced by the engine
  readonly id: string;        // assign once, in the constructor
  static readonly VERSION = '2.0';  // on the class, not instances

  // Parameter property: the modifier declares AND assigns the field
  constructor(public name: string, private rate = 0.05) {
    this.id = crypto.randomUUID();
  }

  get formatted() { return \`$\${this.balance}\`; }  // getter
}`}
        caption="A constructor parameter becomes a field ONLY if it carries a modifier — a bare `constructor(name: string)` is just a local. And TypeScript's `private` is erased at compile time: it's still reachable via obj['pin'] from plain JS. Use #private when you need real runtime privacy."
      />

      <PosterCard
        glyph="Ab"
        title={<>Abstract Classes <span className="dim">&amp; Inheritance</span></>}
        language="typescript"
        code={`abstract class Shape {
  abstract area(): number;                      // subclass MUST implement
  summary() { return this.area().toFixed(2); }  // inherited implementation
}

class Circle extends Shape {
  constructor(private r: number) {
    super();                    // MUST run before any use of 'this'
  }
  override area() { return Math.PI * this.r ** 2; }
}
// new Shape();  // Error — abstract classes can't be instantiated

// Singleton: a private constructor blocks 'new' from outside
class Db {
  private static instance: Db | null = null;
  private constructor() {}
  static get(): Db { return (Db.instance ??= new Db()); }
}`}
        caption="Interface when you only need a shape (zero runtime cost, implement many); abstract class when subclasses should inherit real implementation or state (extend exactly one). Turn on noImplicitOverride so `override` is required — it catches the bug where renaming a base method silently turns every override into a new method."
      />

      <PosterCard
        glyph="St"
        title={<>strict<span className="dim"> Mode — the master switch</span></>}
        language="typescript"
        code={`{
  "compilerOptions": {
    "strict": true
    // Turns on: noImplicitAny, strictNullChecks,
    // strictFunctionTypes, strictBindCallApply,
    // strictPropertyInitialization, noImplicitThis,
    // useUnknownInCatchVariables, alwaysStrict
  }
}`}
        caption="strict is a bundle of eight flags, not one check — enable it from day one on a new project. Each flag is broken down individually, with what it catches and why, on the Project Setup & tsconfig page."
      />

      <PosterQuickRef
        title="Which fundamental applies?"
        rows={[
          { need: 'Model an object shape you expect others to extend', answer: 'interface' },
          { need: 'Model a union, tuple, or primitive alias', answer: 'type' },
          { need: 'Add fields to a third-party interface', answer: 'Declaration merging (interface only)' },
          { need: 'Combine two object shapes into one', answer: 'extends (interface) or & (type)' },
          { need: 'A property that may be missing', answer: '? — then handle T | undefined' },
          { need: 'A fixed set of string constants', answer: 'Union of string literals, not enum' },
          { need: 'Arbitrary extra keys on an object', answer: 'Index signature or Record<K, V>' },
          { need: 'Declare and assign a field in one step', answer: 'Parameter property — modifier on the ctor arg' },
          { need: 'Share implementation AND force subclasses to fill gaps', answer: 'abstract class with abstract members' },
          { need: 'A field truly inaccessible from outside at runtime', answer: '#private, not private' },
          { need: 'Catch bugs before day one', answer: '"strict": true in tsconfig' },
        ]}
      />
    </PosterLayout>
  );
}
