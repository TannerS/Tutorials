import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsInterfaces() {
  return (
    <LessonLayout
      title="Interfaces and Type Aliases"
      sectionId="typescript"
      lessonIndex={2}
      prev={{ path: "/typescript/types", label: "Types" }}
      next={{ path: "/typescript/generics", label: "Generics" }}
    >
      <p>
        Interfaces and type aliases are the two ways to name and reuse object shapes in TypeScript. They are mostly
        interchangeable, but each has capabilities the other lacks. Understanding the differences helps you choose
        the right tool for each situation.
      </p>

      <FlowChart
        title="Interface vs Type Alias Decision"
        chart={"graph TD\n  A[Defining a shape?] --> B{Is it an object?}\n  B -->|Yes| C{Needs merging or implements?}\n  C -->|Yes| D[Use interface]\n  C -->|No| E[Either works — prefer interface]\n  B -->|No| F{Union or intersection?}\n  F -->|Yes| G[Use type alias]\n  F -->|No| H{Primitive alias or tuple?}\n  H -->|Yes| I[Use type alias]\n  H -->|No| J[Use interface]"}
      />

      <h2>Interface Declaration</h2>
      <p>
        An interface declares the shape of an object. Every object assigned to an interface type must have at least
        all the required properties with the correct types.
      </p>

      <CodeBlock language="typescript" title="Interface Declaration Basics">
{`// Basic interface
interface User {
  id: number;
  name: string;
  email: string;
}

// Using the interface
const alice: User = { id: 1, name: "Alice", email: "alice@example.com" };

// Function that accepts User objects
function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}

// Structural typing applies — any object with the right shape works:
const bob = { id: 2, name: "Bob", email: "bob@example.com", role: "admin" };
greet(bob);  // ✓ OK — has all required User properties (plus extra role)

// ─── OPTIONAL PROPERTIES: ? ─────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  price: number;
  description?: string;    // optional — may be undefined
  tags?: string[];         // optional array
  discount?: number;       // optional number
}

// Can omit optional properties:
const laptop: Product = { id: 1, name: "Laptop", price: 999 };  // ✓ OK
const phone: Product = {
  id: 2,
  name: "Phone",
  price: 599,
  description: "Latest flagship",
  tags: ["mobile", "flagship"],
};  // ✓ Also OK — optional properties included

// ─── READONLY PROPERTIES ────────────────────────────────────────────────────
interface Config {
  readonly apiUrl: string;      // can't be changed after assignment
  readonly version: number;
  timeout: number;              // mutable
}

const config: Config = { apiUrl: "https://api.example.com", version: 2, timeout: 5000 };
config.timeout = 3000;         // ✓ OK — mutable
config.apiUrl = "other url";   // Error: Cannot assign to 'apiUrl' — it is read-only
config.version = 3;            // Error: Cannot assign to 'version' — it is read-only`}
      </CodeBlock>

      <h2>Extending Interfaces</h2>
      <p>
        Interfaces can extend one or more other interfaces, inheriting all their properties and adding new ones.
        This models inheritance hierarchies cleanly.
      </p>

      <CodeBlock language="typescript" title="Interface Inheritance and Extension">
{`// Single extension
interface Animal {
  name: string;
  age: number;
}

interface Dog extends Animal {
  breed: string;
  bark(): void;
}

interface ServiceDog extends Dog {
  certificationNumber: string;
  tasks: string[];
}

const rex: ServiceDog = {
  name: "Rex",
  age: 3,
  breed: "German Shepherd",
  certificationNumber: "SD-2024-001",
  tasks: ["guide", "alert"],
  bark() { console.log("Woof!"); },
};

// Multiple extension (TypeScript supports this, unlike class extends)
interface HasName    { name: string; }
interface HasEmail   { email: string; }
interface HasAddress { address: string; }

interface ContactInfo extends HasName, HasEmail, HasAddress {
  phone?: string;
}

// ─── FUNCTION TYPES IN INTERFACES ────────────────────────────────────────────
interface EventEmitter {
  // Method syntax (preferred for object methods)
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  emit(event: string, data?: unknown): void;

  // Property function syntax (slightly different: disables method bivariance)
  transform: (input: string) => string;

  // Overloaded method signatures
  subscribe(event: "click", handler: (e: MouseEvent) => void): void;
  subscribe(event: "keydown", handler: (e: KeyboardEvent) => void): void;
  subscribe(event: string, handler: (e: Event) => void): void;
}

// ─── CALL SIGNATURES AND CONSTRUCT SIGNATURES ────────────────────────────────
interface Formatter {
  // Call signature — the interface itself is callable
  (value: string): string;
  // Can also have regular properties
  locale: string;
  precision: number;
}

interface Constructor<T> {
  // Construct signature — the interface describes a class/constructor
  new(id: number, name: string): T;
}

function createInstance<T>(Ctor: Constructor<T>, id: number, name: string): T {
  return new Ctor(id, name);
}`}
      </CodeBlock>

      <h2>Declaration Merging</h2>
      <p>
        One of the most unique features of interfaces (not type aliases) is <strong>declaration merging</strong>:
        if you declare the same interface name twice, TypeScript merges them into one interface with all the
        properties from both declarations. This is how libraries extend global types like <code>Window</code> or
        Express's <code>Request</code>.
      </p>

      <CodeBlock language="typescript" title="Declaration Merging in Practice">
{`// ─── BASIC DECLARATION MERGING ───────────────────────────────────────────────
interface User {
  id: number;
  name: string;
}

interface User {
  email: string;    // merged into the same User interface
  role: string;
}

// Merged result: User = { id: number; name: string; email: string; role: string }
const user: User = { id: 1, name: "Alice", email: "alice@example.com", role: "admin" };

// ─── AUGMENTING GLOBAL INTERFACES ────────────────────────────────────────────
// This is how you add properties to the browser's Window object:
interface Window {
  __APP_VERSION__: string;
  __FEATURE_FLAGS__: Record<string, boolean>;
}

// Now TypeScript accepts this without errors:
window.__APP_VERSION__ = "1.2.3";
window.__FEATURE_FLAGS__ = { darkMode: true, betaFeatures: false };

// ─── AUGMENTING LIBRARY INTERFACES ───────────────────────────────────────────
// Add custom properties to Express Request (common pattern):
// In a file: src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId: string;
    }
  }
}

// After augmentation, in route handlers:
app.get("/profile", (req, res) => {
  // req.user is now typed as AuthenticatedUser | undefined — no any cast needed
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ user: req.user });
});

// ─── WHY TYPE ALIASES CAN'T DO THIS ─────────────────────────────────────────
type UserType = { id: number; name: string; };
type UserType = { email: string; };  // Error: Duplicate identifier 'UserType'
// Type aliases are closed — you cannot add to them after declaration.
// This is intentional: declaration merging is a specialized feature.`}
      </CodeBlock>

      <h2>Index Signatures</h2>
      <p>
        Index signatures describe objects where you don't know the property names in advance but you know the
        types of the keys and values.
      </p>

      <CodeBlock language="typescript" title="Index Signatures">
{`// ─── BASIC INDEX SIGNATURE ────────────────────────────────────────────────────
interface StringMap {
  [key: string]: string;  // any string key, string value
}

const headers: StringMap = {
  "Content-Type": "application/json",
  "Authorization": "Bearer token123",
  "X-Request-Id": "abc-def-ghi",
};

// Access any key — TypeScript knows the value is string:
const contentType: string = headers["Content-Type"];

// ─── MIXING KNOWN AND DYNAMIC PROPERTIES ─────────────────────────────────────
interface Cache {
  ttl: number;               // known property (must match index value type)
  maxSize: number;           // known property
  [key: string]: unknown;   // dynamic properties (use unknown for safety)
}

// More type-safe: require known properties to match the index signature type
interface StrictCache {
  [key: string]: string | number;
  ttl: number;               // ✓ number is assignable to string | number
  prefix: string;            // ✓ string is assignable to string | number
  // flag: boolean;          // Error: boolean is not assignable to string | number
}

// ─── NUMBER INDEX SIGNATURES ──────────────────────────────────────────────────
interface NumberIndexed {
  [index: number]: string;  // array-like
  length: number;
}

// ─── RECORD TYPE: THE PRACTICAL ALTERNATIVE ──────────────────────────────────
// Record<K, V> is shorthand for { [key in K]: V }
type Translations = Record<string, string>;
type RolePermissions = Record<"admin" | "user" | "guest", string[]>;
type UserMap = Record<number, User>;

const roles: RolePermissions = {
  admin: ["read", "write", "delete"],
  user:  ["read", "write"],
  guest: ["read"],
};
// Advantage over index signature: Record<"admin"|"user"|"guest", ...>
// requires ALL three keys to be present`}
      </CodeBlock>

      <h2>Interface vs Type Alias: When to Use Which</h2>

      <InfoBox variant="tip" title="The Practical Rule for Interface vs Type">
        <p><strong>Use interface when:</strong> you are describing the shape of an object that might be extended or implemented by a class, you want declaration merging (library augmentation), or you are defining a public API for a library or module.</p>
        <p><strong>Use type when:</strong> you need a union type (<code>A | B</code>), an intersection type (<code>A &amp; B</code>), a mapped type, a conditional type, a tuple type, or a primitive alias (<code>type ID = string</code>). Type aliases can do things interfaces simply cannot.</p>
        <p><strong>When in doubt:</strong> Both work for basic object shapes. Pick one style and be consistent within a codebase. Many teams use interface for public object types and type for computed/derived types.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="Interface vs Type Alias: What Each Can Do">
{`// ─── THINGS ONLY type CAN DO ─────────────────────────────────────────────────

// Union types:
type Result<T> = { success: true; data: T } | { success: false; error: Error };
// interface Result<T> = ... | ...  ← Syntax error: interfaces can't be unions

// Primitive aliases:
type UserID = string;
type Milliseconds = number;
// interface UserID = string;  ← Syntax error

// Tuple types:
type Pair = [string, number];
// interface Pair = [string, number];  ← Syntax error

// Mapped types:
type Optional<T> = { [K in keyof T]?: T[K] };
// interface cannot express this directly

// Conditional types:
type NonNullable<T> = T extends null | undefined ? never : T;

// ─── THINGS ONLY interface CAN DO ────────────────────────────────────────────

// Declaration merging:
interface Plugin { name: string; }
interface Plugin { version: string; }  // ✓ Merged — type alias would error

// implements keyword (classes):
interface Printable { print(): void; }
class Report implements Printable {
  print() { console.log("Printing report..."); }
}
// Can't use type alias with 'implements'... actually you CAN in modern TS:
type Serializable = { toJSON(): string };
class DataModel implements Serializable {
  toJSON() { return JSON.stringify(this); }  // ✓ Works with type aliases too
}

// ─── THINGS BOTH CAN DO ──────────────────────────────────────────────────────

// Object shapes:
interface UserI { id: number; name: string; }
type UserT = { id: number; name: string; };  // identical capability

// Extension/intersection:
interface AdminI extends UserI { role: string; }
type AdminT = UserT & { role: string; };     // equivalent

// Generics:
interface Box<T> { value: T; }
type Box2<T> = { value: T; };  // identical`}
      </CodeBlock>

      <h2>The implements Keyword</h2>
      <p>
        Classes can declare that they implement an interface, which tells TypeScript to verify the class has
        all the required members.
      </p>

      <CodeBlock language="typescript" title="implements in Classes">
{`interface Repository<T, ID = number> {
  findById(id: ID): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: ID, changes: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Class must implement all interface members:
class InMemoryUserRepository implements Repository<User> {
  private users: Map<number, User> = new Map();

  async findById(id: number): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findAll(filter?: Partial<User>): Promise<User[]> {
    const all = Array.from(this.users.values());
    if (!filter) return all;
    return all.filter(u =>
      Object.entries(filter).every(([k, v]) => u[k as keyof User] === v)
    );
  }

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async update(id: number, changes: Partial<User>): Promise<User | null> {
    const existing = this.users.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...changes };
    this.users.set(id, updated);
    return updated;
  }

  async delete(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
}

// ─── BENEFIT: Swap implementations without changing call sites ────────────────
// In tests:       const repo = new InMemoryUserRepository();
// In production:  const repo = new PostgresUserRepository();
// Both satisfy Repository<User> — calling code is identical`}
      </CodeBlock>

      <InteractiveChallenge
        question="What is declaration merging and which TypeScript construct supports it?"
        options={[
          "Combining two files into one — supported by both interfaces and type aliases",
          "Declaring the same interface name multiple times, causing TypeScript to merge all declarations into one — only interfaces support this, not type aliases",
          "Using the spread operator to merge two objects at runtime",
          "Extending an interface with new properties — supported by both interfaces and type aliases"
        ]}
        correctIndex={1}
        explanation="Declaration merging is when you write the same interface name in multiple places and TypeScript automatically combines them into one interface with all properties from every declaration. This is an interface-only feature — type aliases with the same name cause a duplicate identifier error. Declaration merging is essential for augmenting global types like Window, or extending library types like Express's Request object, without modifying the original source."
      />

      <InteractiveChallenge
        question="Which of these can ONLY be expressed with a type alias, not an interface?"
        options={[
          "An object with id: number and name: string",
          "An object that extends another interface",
          "A union type like string | number | null",
          "A generic container like Box<T>"
        ]}
        correctIndex={2}
        explanation="Union types (A | B) can only be expressed with a type alias. Interfaces describe a single, concrete shape — they cannot be defined as 'either this or that'. type aliases can express unions, primitive aliases, tuples, mapped types, and conditional types. Interfaces can express object shapes, method signatures, generics, and allow declaration merging and extends. For basic object shapes, both work equivalently."
      />
    </LessonLayout>
  );
}
