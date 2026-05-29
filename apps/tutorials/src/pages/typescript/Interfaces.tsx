import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Interfaces() {
  return (
    <LessonLayout
      title="Interfaces &amp; Type Aliases"
      sectionId="typescript"
      lessonIndex={2}
      prev={{ path: '/typescript/types', label: 'Type System Fundamentals' }}
      next={{ path: '/typescript/generics', label: 'Generics Deep Dive' }}
    >
      {/* ── Section 1: Interface Declaration ── */}
      <h2>Interface Declaration</h2>
      <p>
        Interfaces are the primary way to define the shape of an object in TypeScript.
        They describe what properties and methods an object must have.
      </p>

      <CodeBlock language="typescript" title="Basic Interface Syntax">
{`interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

const user: User = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  isActive: true,
};`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Optional and Readonly Properties">
{`interface Product {
  readonly id: string;
  name: string;
  price: number;
  description?: string;   // optional
  readonly createdAt: Date; // cannot be reassigned
}

const item: Product = {
  id: "abc-123",
  name: "Widget",
  price: 9.99,
  createdAt: new Date(),
};

// item.id = "xyz"; // Error: Cannot assign to 'id' because it is read-only`}
      </CodeBlock>

      {/* ── Section 2: Type Alias Declaration ── */}
      <h2>Type Alias Declaration</h2>
      <p>
        Type aliases create a new name for any type. They shine when you need unions,
        tuples, primitives, or mapped types that interfaces cannot express.
      </p>

      <CodeBlock language="typescript" title="Type Alias Basics">
{`// Primitive alias
type ID = string | number;

// Tuple alias
type Coordinate = [x: number, y: number];

// Union alias
type Status = "pending" | "active" | "archived";

// Object alias (looks like an interface)
type Point = {
  x: number;
  y: number;
};

const userId: ID = 42;
const pos: Coordinate = [10, 20];
const status: Status = "active";`}
      </CodeBlock>

      {/* ── Section 3: Interface vs Type Alias ── */}
      <h2>Interface vs Type Alias</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #2a2e42' }}>
            <th style={{ textAlign: 'left', padding: '0.75rem', color: '#5b9cf6' }}>Feature</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#5b9cf6' }}>Interface</th>
            <th style={{ textAlign: 'center', padding: '0.75rem', color: '#5b9cf6' }}>Type Alias</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Declaration merging', '✅', '❌'],
            ['Extends / inheritance', '✅ extends', '✅ via &amp;'],
            ['Union types', '❌', '✅'],
            ['Tuple types', '❌', '✅'],
            ['Primitive aliases', '❌', '✅'],
            ['implements in classes', '✅', '✅'],
            ['Computed properties', '❌', '✅'],
            ['Mapped types', '❌', '✅'],
          ].map(([feature, iface, alias], i) => (
            <tr key={i} style={{ borderBottom: '1px solid #2a2e42' }}>
              <td style={{ padding: '0.5rem 0.75rem', color: '#e4e6f0' }}>{feature}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{iface}</td>
              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>{alias}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <InfoBox variant="tip" title="When To Use Which?">
        <p>
          <strong>Use interfaces</strong> for public API contracts, object shapes you expect
          others to extend, and class implementations. Their merging capability makes them
          ideal for library authors.
        </p>
        <p>
          <strong>Use type aliases</strong> for unions, tuples, mapped types, and any type
          that is not purely an object shape. When in doubt, interfaces are a safe default
          for object types.
        </p>
      </InfoBox>

      {/* ── Section 4: Optional Properties ── */}
      <h2>Optional Properties</h2>
      <p>
        The <code>?</code> modifier marks a property as optional. TypeScript narrows
        optional values to <code>T | undefined</code>, so you must handle the missing case.
      </p>

      <CodeBlock language="typescript" title="Handling Optional Values Safely">
{`interface Config {
  host: string;
  port?: number;
  ssl?: boolean;
}

function connect(config: Config) {
  const port = config.port ?? 3000;     // default via nullish coalescing
  const ssl = config.ssl === true;      // explicit boolean check

  console.log("Connecting to " + config.host + ":" + port);
}

connect({ host: "localhost" });           // port defaults to 3000
connect({ host: "prod.io", port: 443, ssl: true });`}
      </CodeBlock>

      {/* ── Section 5: Readonly Properties ── */}
      <h2>Readonly Properties</h2>

      <CodeBlock language="typescript" title="Readonly Patterns">
{`// Per-property readonly
interface Immutable {
  readonly id: string;
  readonly data: number[];
}

// Utility type: makes ALL properties readonly
type FrozenUser = Readonly<User>;

// Deep readonly (recursive)
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};`}
      </CodeBlock>

      <InfoBox variant="warning" title="Readonly Is Shallow">
        <p>
          The built-in <code>Readonly&lt;T&gt;</code> only freezes top-level properties.
          Nested objects remain mutable unless you use a deep readonly pattern like above.
        </p>
      </InfoBox>

      {/* ── Section 6: Index Signatures ── */}
      <h2>Index Signatures</h2>

      <CodeBlock language="typescript" title="Index Signatures with Known Properties">
{`interface AppConfig {
  appName: string;
  version: string;
  [key: string]: unknown; // allow arbitrary extra keys
}

const config: AppConfig = {
  appName: "Dashboard",
  version: "2.1.0",
  featureFlags: { darkMode: true },
  maxRetries: 3,
};`}
      </CodeBlock>

      {/* ── Section 7: Extending Interfaces ── */}
      <h2>Extending Interfaces</h2>

      <CodeBlock language="typescript" title="Single and Multiple Extends">
{`interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

interface SoftDeletable {
  deletedAt?: Date;
  isDeleted: boolean;
}

// Single extension
interface BaseEntity extends Timestamped {
  id: string;
}

// Multiple extension
interface ManagedEntity extends Timestamped, SoftDeletable {
  id: string;
  version: number;
}`}
      </CodeBlock>

      {/* ── Section 8: Intersection Types ── */}
      <h2>Intersection Types for Combining</h2>
      <p>
        Type aliases use the <code>&amp;</code> operator to combine types, achieving the
        same result as interface extends.
      </p>

      <CodeBlock language="typescript" title="Intersection with Type Aliases">
{`type Timestamped = {
  createdAt: Date;
  updatedAt: Date;
};

type Identifiable = {
  id: string;
};

type Resource = Identifiable & Timestamped & {
  name: string;
  owner: string;
};

// Equivalent to an interface extending both`}
      </CodeBlock>

      {/* ── Section 9: Declaration Merging ── */}
      <h2>Declaration Merging</h2>
      <p>
        Interfaces with the same name in the same scope automatically merge. This is
        especially useful for extending third-party library types.
      </p>

      <CodeBlock language="typescript" title="Merging Interfaces">
{`// Original interface
interface Window {
  title: string;
}

// Merged automatically — no error!
interface Window {
  appVersion: number;
}

// Result: Window has both title AND appVersion
const w: Window = { title: "App", appVersion: 2 };`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Extending Express Request">
{`// Extend Express Request to include authenticated user
declare namespace Express {
  interface Request {
    user?: { id: string; role: "admin" | "user" };
  }
}

// Now req.user is available in all handlers
app.get("/profile", (req, res) => {
  if (req.user) {
    res.json({ id: req.user.id });
  }
});`}
      </CodeBlock>

      <InfoBox variant="info" title="Type Aliases Cannot Merge">
        <p>
          Attempting to declare two type aliases with the same name causes a compile error.
          Declaration merging is exclusive to interfaces and namespaces.
        </p>
      </InfoBox>

      {/* ── Section 10: Implementing Interfaces ── */}
      <h2>Implementing Interfaces in Classes</h2>

      <CodeBlock language="typescript" title="Class Implements">
{`interface Logger {
  log(message: string): void;
  error(message: string, code?: number): void;
}

interface Serializable {
  serialize(): string;
}

class AppLogger implements Logger, Serializable {
  log(message: string) {
    console.log("[LOG] " + message);
  }
  error(message: string, code?: number) {
    console.error("[ERR " + (code ?? 500) + "] " + message);
  }
  serialize() {
    return JSON.stringify({ type: "AppLogger" });
  }
}`}
      </CodeBlock>

      {/* ── Section 11: Function Types ── */}
      <h2>Function Types</h2>

      <CodeBlock language="typescript" title="Function Type Signatures">
{`// Type alias for a function
type Comparator<T> = (a: T, b: T) => number;

// Interface with a call signature
interface SearchFn {
  (source: string, term: string): boolean;
}

// Callable interface with additional properties
interface Formatter {
  (value: unknown): string;
  locale: string;
}

// Overloaded function signatures
interface DateParser {
  (input: string): Date;
  (input: number): Date;
  (input: string, format: string): Date;
}`}
      </CodeBlock>

      {/* ── Section 12: Constructable Signatures ── */}
      <h2>Constructable Signatures</h2>

      <CodeBlock language="typescript" title="Constructor Signatures">
{`interface ClockConstructor {
  new (hour: number, minute: number): ClockInterface;
}

interface ClockInterface {
  tick(): void;
}

function createClock(
  Ctor: ClockConstructor,
  h: number, m: number
): ClockInterface {
  return new Ctor(h, m);
}`}
      </CodeBlock>

      {/* ── Section 13: Discriminated Unions ── */}
      <h2>Discriminated Unions</h2>
      <p>
        A discriminated union combines a union type with a literal discriminant property,
        enabling exhaustive type narrowing via switch or if statements.
      </p>

      <FlowChart
        title="Discriminated Union Pattern"
        chart={"graph TD\n  A[Shape Union] --> B{Check kind}\n  B -->|circle| C[Circle branch]\n  B -->|rectangle| D[Rectangle branch]\n  B -->|triangle| E[Triangle branch]\n  C --> F[Access radius]\n  D --> G[Access width, height]\n  E --> H[Access base, height]"}
      />

      <CodeBlock language="typescript" title="Exhaustive Shape Handling">
{`interface Circle    { kind: "circle";    radius: number }
interface Rectangle { kind: "rectangle"; width: number; height: number }
interface Triangle  { kind: "triangle";  base: number;  height: number }

type Shape = Circle | Rectangle | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // Exhaustive check — errors if a variant is missed
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="The never Trick">
        <p>
          Assigning to <code>never</code> in the default branch ensures a compile error if
          you add a new variant to the union but forget to handle it in the switch.
        </p>
      </InfoBox>

      {/* ── Section 14: Utility Types ── */}
      <h2>Utility Types Intro</h2>
      <p>
        TypeScript ships with built-in utility types that transform existing types.
        These eliminate boilerplate and keep your types DRY.
      </p>

      <CodeBlock language="typescript" title="Partial, Required, Pick, Omit">
{`interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// All properties become optional
type UserUpdate = Partial<User>;

// All properties become required
type StrictUser = Required<User>;

// Select specific properties
type UserPreview = Pick<User, "id" | "name">;

// Remove specific properties
type PublicUser = Omit<User, "email">;

function updateUser(id: string, changes: Partial<User>) {
  // changes can have any subset of User fields
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Record">
{`type Role = "admin" | "editor" | "viewer";

type RolePermissions = Record<Role, string[]>;

const permissions: RolePermissions = {
  admin: ["read", "write", "delete", "manage"],
  editor: ["read", "write"],
  viewer: ["read"],
};`}
      </CodeBlock>

      <InfoBox variant="info" title="Composing Utility Types">
        <p>
          Utility types compose naturally. For example,
          <code>Readonly&lt;Partial&lt;User&gt;&gt;</code> creates a frozen partial user,
          and <code>Omit&lt;User, &quot;id&quot;&gt; &amp; {'{'}id: number{'}'}</code> replaces
          the id type from string to number.
        </p>
      </InfoBox>

      {/* ── Section 15: Interactive Challenges ── */}
      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question={"You are designing a public SDK. Users should be able to add custom properties to your Config type. Which should you use?"}
        options={[
          "type Config = { host: string; port: number }",
          "interface Config { host: string; port: number }",
          "const Config = { host: '', port: 0 }",
          "enum Config { Host, Port }",
        ]}
        correctIndex={1}
        explanation={"Interfaces support declaration merging, allowing SDK consumers to extend Config with their own properties by simply redeclaring the interface. Type aliases cannot be merged and would require intersection types instead."}
      />

      <InteractiveChallenge
        question={"Which utility type would you use to create a function that accepts any subset of User fields for a PATCH endpoint?"}
        code={`interface User {
  id: string;
  name: string;
  email: string;
}

function patchUser(id: string, data: ??? ) { /* ... */ }`}
        language="typescript"
        options={[
          "Required<User>",
          "Partial<User>",
          "Pick<User, 'name'>",
          "Readonly<User>",
        ]}
        correctIndex={1}
        explanation={"Partial<T> makes every property optional, which is exactly what a PATCH endpoint needs — callers send only the fields they want to update. Required would force all fields, Pick limits to specific fields, and Readonly prevents mutation."}
      />

      <InteractiveChallenge
        question={"What happens if you add a new variant to a discriminated union but forget to handle it in the switch statement that assigns to never?"}
        options={[
          "Nothing — it silently returns undefined",
          "A runtime error is thrown",
          "A compile-time error flags the unhandled variant",
          "TypeScript infers the return type as any",
        ]}
        correctIndex={2}
        explanation={"The never type cannot accept any value. When a new variant is added but not handled, the default branch receives that variant's type which is not assignable to never — producing a compile-time error that catches the oversight immediately."}
      />
    </LessonLayout>
  );
}
