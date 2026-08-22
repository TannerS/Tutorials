import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Typescript() {
  return (
    <LessonLayout
      title="TypeScript Crash Course"
      sectionId="react19"
      lessonIndex={12}
      prev={{ path: '/react19/patterns', label: 'Advanced Patterns' }}
      next={{ path: '/react19/build-toolchain', label: 'Build Toolchain' }}
    >
      <p>TypeScript crash course — fundamentals, Node.js patterns, then React-specific patterns. Covers everything from scratch to production.</p>

      {/* ══════════════════════════════════════════════════
          FUNDAMENTALS
      ══════════════════════════════════════════════════ */}
      <h2>TypeScript Fundamentals</h2>

      <h3>type vs interface</h3>
      <CodeBlock language="typescript" title="type vs interface">
{`// interface — for object shapes; can be extended, implemented by classes
interface User {
  id: number;
  name: string;
  email?: string;           // optional
  readonly createdAt: Date; // can't reassign after creation
}

// type — for anything: primitives, unions, intersections, mapped types
type Status = 'active' | 'inactive' | 'pending'; // union of literals
type ID     = string | number;                    // union of primitives
type WithTimestamps<T> = T & { createdAt: Date; updatedAt: Date }; // intersection

// Extending
interface AdminUser extends User {
  permissions: string[];
}
type AdminUser2 = User & { permissions: string[] }; // same result with type

// RULE OF THUMB:
// - interface for object shapes that might be extended or implemented by a class
// - type for unions, intersections, primitives, and complex type expressions`}
      </CodeBlock>

      <h3>Unions, Intersections & Narrowing</h3>
      <CodeBlock language="typescript" title="Union & Intersection Types">
{`// Union — value can be one of several types
type StringOrNumber = string | number;
type Result<T> = { data: T; error: null } | { data: null; error: string };

// Intersection — value must satisfy ALL types at once
type AdminUser = User & { permissions: string[] };

// Narrowing — TypeScript tracks which branch you're in
function process(value: string | number) {
  if (typeof value === 'string') {
    value.toUpperCase(); // TypeScript knows: string here
  } else {
    value.toFixed(2);    // TypeScript knows: number here
  }
}

// typeof     → primitive check (string, number, boolean, etc.)
// instanceof → class instance check
// 'prop' in obj → object shape check
// discriminant field → check a literal property (most common in React)

function handleEvent(event: MouseEvent | KeyboardEvent) {
  if (event instanceof KeyboardEvent) {
    console.log(event.key); // only exists on KeyboardEvent
  }
}

// Custom type guard — return type "value is T" tells TypeScript what narrowed
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value
  );
}

if (isUser(data)) {
  console.log(data.name); // TypeScript knows data is User here
}`}
      </CodeBlock>

      <h3>as const — Literal Types & Readonly Arrays</h3>
      <CodeBlock language="typescript" title="as const">
{`// Without as const — TypeScript widens to string[]
const STATUSES = ['active', 'inactive', 'pending'];
// Type: string[]  ← too wide, loses the literal values

// With as const — TypeScript preserves the exact literals
const STATUSES = ['active', 'inactive', 'pending'] as const;
// Type: readonly ['active', 'inactive', 'pending']

// Derive a union type directly from the array — single source of truth
type Status = typeof STATUSES[number];
// Type: 'active' | 'inactive' | 'pending'

// Object literals
const CONFIG = { maxRetries: 3, timeout: 5000, env: 'production' } as const;
// All values become readonly literals — TypeScript errors if you mutate them

// Useful in React: pass to a typed Select without widening to string
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = typeof ROLES[number]; // 'admin' | 'editor' | 'viewer'
<Select options={ROLES} value={role} onChange={setRole} label="Role" />`}
      </CodeBlock>

      <h3>Type Assertions & Non-Null</h3>
      <CodeBlock language="typescript" title="as and ! — use sparingly">
{`// Type assertion — you tell TypeScript what the type is
// Use when YOU know more than TypeScript does (e.g., after API validation)
const input = document.getElementById('email') as HTMLInputElement;
input.value; // TypeScript now knows it's HTMLInputElement, not just HTMLElement

// Non-null assertion ! — "I promise this isn't null or undefined"
const root = document.getElementById('root')!; // safe: element is in index.html
root.appendChild(app);

// In React Router loaders: params.id always exists when route matches
async function loader({ params }: LoaderFunctionArgs) {
  return getProduct(params.id!); // safe: route only runs when :id is in the URL
}

// Unknown → narrow before using (safer than any)
function parse(data: unknown): string | null {
  if (typeof data === 'object' && data !== null && 'name' in data) {
    return (data as { name: string }).name;
  }
  return null;
}

// Avoid 'any' — it disables all type checking
// Use 'unknown' when type is genuinely unknown, narrow before use`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          GENERICS
      ══════════════════════════════════════════════════ */}
      <h2>Generics</h2>
      <CodeBlock language="typescript" title="Generic Functions & Constraints">
{`// Basic generic — T is a placeholder resolved at call site
function identity<T>(value: T): T {
  return value;
}
const str = identity('hello'); // T inferred as string
const num = identity(42);       // T inferred as number

// Constraint — T must have certain properties (T extends ...)
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key]; // return type matches the property's actual type
}
const user = { id: 1, name: 'Alice' };
getProperty(user, 'name');  // returns string ✅
getProperty(user, 'id');    // returns number ✅
getProperty(user, 'email'); // TypeScript error — 'email' not in user ❌

// Default type parameter
function createState<T = string>(initial: T) {
  return { value: initial };
}
createState();        // T defaults to string
createState(42);      // T inferred as number
createState<boolean>(true); // T explicitly boolean

// Multiple type parameters
function zip<A, B>(a: A[], b: B[]): [A, B][] {
  return a.map((item, i) => [item, b[i]]);
}
zip([1, 2], ['a', 'b']); // [number, string][]`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          UTILITY TYPES
      ══════════════════════════════════════════════════ */}
      <h2>Utility Types</h2>
      <CodeBlock language="typescript" title="Built-in Utility Types">
{`interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Partial — all props optional (useful for update/patch payloads)
type UserUpdate = Partial<User>;
// { id?: number; name?: string; email?: string; role?: 'admin' | 'user' }

// Required — all props required (removes optional modifiers)
type StrictUser = Required<User>;

// Readonly — prevents mutation
type ImmutableUser = Readonly<User>;

// Pick — select specific props
type UserPreview = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Omit — remove specific props
type NewUser = Omit<User, 'id'>;
// { name: string; email: string; role: 'admin' | 'user' }

// Record — map a set of keys to a value type
type RolePermissions = Record<'admin' | 'user', string[]>;
// { admin: string[]; user: string[] }

// Exclude / Extract — filter union members
type NonAdmin = Exclude<User['role'], 'admin'>; // 'user'
type AdminOnly = Extract<User['role'], 'admin'>; // 'admin'

// ReturnType — extract what a function returns
function getUser(id: number): User { /* ... */ return {} as User; }
type GetUserReturn = ReturnType<typeof getUser>; // User

// Parameters — extract parameter types as a tuple
type GetUserParams = Parameters<typeof getUser>; // [id: number]

// Awaited — unwrap a Promise (works recursively)
async function fetchUser(id: number): Promise<User> { /* ... */ return {} as User; }
type Resolved = Awaited<ReturnType<typeof fetchUser>>; // User (not Promise<User>)`}
      </CodeBlock>

      <InfoBox variant="tip" title="Awaited&lt;ReturnType&lt;typeof fn&gt;&gt; — single source of truth">
        <p>Define the return type once in the function signature. Derive everything else from it — no duplication, no drift. This is the standard pattern for React Router loaders.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="Awaited<ReturnType<...>> in practice">
{`async function loader({ params }: LoaderFunctionArgs): Promise<Product> {
  return getProduct(params.id!);
}

// Derive the component's data type from the loader — don't repeat yourself
type LoaderData = Awaited<ReturnType<typeof loader>>; // Product

function ProductPage() {
  const product = useLoaderData() as LoaderData; // typed as Product
  return <h1>{product.name}</h1>;               // .name is typed ✅
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          ASYNC & ERROR HANDLING
      ══════════════════════════════════════════════════ */}
      <h2>Async & Error Handling</h2>

      <CodeBlock language="typescript" title="Promises, async/await, and typed errors">
{`// Typing async functions — return type is always Promise<T>
async function fetchUser(id: number): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json() as Promise<User>;
}

// Calling it
const user: User = await fetchUser(1); // TypeScript knows this is User, not Promise<User>

// Promise.all — infers a tuple of resolved types
const [user, posts] = await Promise.all([
  fetchUser(1),       // Promise<User>
  fetchPosts(1),      // Promise<Post[]>
]);
// user: User, posts: Post[] — each typed correctly ✅

// Error handling — catch gives 'unknown', not 'Error'
// This is correct: anything can be thrown (strings, numbers, custom objects)
async function loadData() {
  try {
    return await fetchUser(1);
  } catch (err) {
    // err is 'unknown' — narrow before using
    if (err instanceof Error) {
      console.error(err.message); // ✅ safe
    } else {
      console.error('Unknown error', err);
    }
  }
}

// Typed Result pattern — no thrown exceptions, explicit error handling
type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

async function safeFetch<T>(url: string): Promise<Result<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: new Error(\`HTTP \${res.status}\`) };
    const data: T = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

const result = await safeFetch<User[]>('/api/users');
if (result.ok) {
  console.log(result.data); // User[] ✅
} else {
  console.error(result.error.message); // Error ✅
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          CLASSES
      ══════════════════════════════════════════════════ */}
      <h2>Classes</h2>

      <CodeBlock language="typescript" title="Classes with TypeScript">
{`// Access modifiers
class UserService {
  private db: Database;          // only accessible inside this class
  protected logger: Logger;      // accessible in this class and subclasses
  public readonly baseUrl: string; // accessible everywhere, can't reassign

  // Constructor shorthand — declares AND assigns in one step
  constructor(
    private config: AppConfig,   // private field + assignment
    public name: string,         // public field + assignment
  ) {
    this.db = new Database(config.dbUrl);
    this.logger = new Logger();
    this.baseUrl = config.baseUrl;
  }

  async getUser(id: number): Promise<User> {
    return this.db.find('users', id);
  }
}

// Abstract classes — define shape, can't be instantiated directly
abstract class BaseRepository<T> {
  abstract findById(id: number): Promise<T>;
  abstract findAll(): Promise<T[]>;
  abstract save(entity: T): Promise<T>;

  // Concrete method shared by all subclasses
  async exists(id: number): Promise<boolean> {
    const item = await this.findById(id);
    return item !== null;
  }
}

class UserRepository extends BaseRepository<User> {
  async findById(id: number): Promise<User> { /* ... */ return {} as User; }
  async findAll(): Promise<User[]>           { /* ... */ return []; }
  async save(user: User): Promise<User>      { /* ... */ return user; }
}

// Implementing an interface — class must provide all members
interface Serializable {
  serialize(): string;
  deserialize(data: string): void;
}

class Session implements Serializable {
  serialize()                    { return JSON.stringify(this); }
  deserialize(data: string)      { Object.assign(this, JSON.parse(data)); }
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          MODULES & DECLARATION FILES
      ══════════════════════════════════════════════════ */}
      <h2>Modules & Declaration Files</h2>

      <CodeBlock language="typescript" title="import type, export type, declaration files">
{`// import type — type-only import, erased at compile time (no runtime cost)
import type { User, Post } from './types';          // erased — no runtime import
import { fetchUser } from './api';                  // kept — runtime value needed

// export type — explicitly type-only export
export type { User };            // safe to import as 'import type { User }'
export { fetchUser };            // value export — kept in bundle

// Re-exporting all types from a domain module
export type { User, Post, Comment } from './models';

// Declaration files (.d.ts) — add types for untyped JS libraries
// lib.d.ts (place next to the library or in src/types/)
declare module 'untyped-package' {
  export function doThing(input: string): number;
  export interface Config { timeout: number; retries: number; }
}

// Augmenting existing module types (e.g., adding custom properties)
declare module 'express' {
  interface Request {
    user?: User; // add custom property to Express Request
  }
}

// Global augmentation — add to the global scope
declare global {
  interface Window {
    analytics: { track(event: string, props?: object): void };
  }
}
// Now window.analytics.track('page_view') is typed everywhere`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          NODE.JS PATTERNS
      ══════════════════════════════════════════════════ */}
      <h2>Node.js Patterns</h2>

      <h3>tsconfig.json</h3>
      <CodeBlock language="json" title="tsconfig.json — key options explained">
{`{
  "compilerOptions": {
    // TARGET: what JS version to emit
    "target": "ES2022",        // Node 18+ supports ES2022 natively
    // "target": "ES5"         // for old browser support

    // MODULE: how imports/exports are compiled
    "module": "NodeNext",      // Node.js with ESM ("type": "module" in package.json)
    // "module": "CommonJS"    // traditional Node require/module.exports
    // "module": "ESNext"      // Vite / browser bundlers

    // MODULE RESOLUTION: how TypeScript finds files
    "moduleResolution": "NodeNext", // matches "module": "NodeNext"
    // "moduleResolution": "bundler" // for Vite/webpack

    // OUTPUT
    "outDir": "./dist",        // where to emit compiled JS
    "rootDir": "./src",        // source root
    "declaration": true,       // emit .d.ts files alongside JS
    "sourceMap": true,         // emit .map files for debugging

    // STRICTNESS (always enable all of these)
    "strict": true,            // enables all strict checks below:
    //   strictNullChecks      → null/undefined must be handled explicitly
    //   noImplicitAny         → no implicit 'any' types
    //   strictFunctionTypes   → stricter function compatibility
    //   strictBindCallApply   → correct types for .bind/.call/.apply

    // EXTRAS
    "esModuleInterop": true,   // import React from 'react' works (not import * as React)
    "skipLibCheck": true,      // skip .d.ts type checking (faster builds)
    "forceConsistentCasingInFileNames": true,

    // PATH ALIASES (import from '@/components/...' instead of '../../../components')
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`}
      </CodeBlock>

      <h3>Typing process.env</h3>
      <CodeBlock language="typescript" title="Environment variables — typed config">
{`// process.env values are always string | undefined by default
// Two approaches:

// APPROACH 1: Extend NodeJS.ProcessEnv in an env.d.ts file
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    PORT?: string;          // optional — may not be set
    JWT_SECRET: string;
    API_KEY: string;
  }
}
// Now process.env.DATABASE_URL is typed as string (not string | undefined) ✅
// TypeScript errors if you typo an env var name ✅

// APPROACH 2 (preferred): Validate at startup, export a typed config object
// src/config.ts
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(\`Missing required env var: \${key}\`);
  return value;
}

export const config = {
  nodeEnv:     (process.env.NODE_ENV ?? 'development') as 'development' | 'production' | 'test',
  databaseUrl: requireEnv('DATABASE_URL'),
  port:        parseInt(process.env.PORT ?? '3000', 10),
  jwtSecret:   requireEnv('JWT_SECRET'),
} as const;

// Import config everywhere instead of process.env directly
// config.port is number, config.databaseUrl is string — already validated ✅`}
      </CodeBlock>

      <h3>Express</h3>
      <CodeBlock language="typescript" title="Typing Express routes">
{`import express, { Request, Response, NextFunction, RequestHandler } from 'express';

const app = express();

// Basic typed route handler
app.get('/users/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = await userService.findById(id);
  res.json(user);
});

// Generic Request — type params, body, query separately
// Request<Params, ResBody, ReqBody, Query>
interface UserParams { id: string; }
interface CreateUserBody { name: string; email: string; role: 'admin' | 'user'; }
interface UserQuery { include?: 'posts' | 'profile'; }

app.get(
  '/users/:id',
  async (req: Request<UserParams, User, never, UserQuery>, res: Response<User>) => {
    const user = await userService.findById(parseInt(req.params.id, 10));
    // req.query.include is 'posts' | 'profile' | undefined ✅
    // res.json() expects a User ✅
    res.json(user);
  }
);

app.post(
  '/users',
  async (req: Request<never, User, CreateUserBody>, res: Response<User>) => {
    const { name, email, role } = req.body; // typed as CreateUserBody ✅
    const user = await userService.create({ name, email, role });
    res.status(201).json(user);
  }
);

// Typed middleware
const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.headers.authorization) {
    res.status(401).json({ error: 'Unauthorized' });
    return; // important: return after sending response
  }
  next();
};

// Error handling middleware — 4 params, Express detects it by arity
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});`}
      </CodeBlock>

      <InfoBox variant="note" title="Install Express types">
        <p>Express ships as plain JavaScript. Install the types package separately:</p>
        <p><code>npm install express</code><br/><code>npm install -D @types/express</code></p>
        <p>Many popular Node packages work the same way — if TypeScript can't find types, check for a <code>@types/package-name</code> package on npm.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          REACT PROPS
      ══════════════════════════════════════════════════ */}
      <h2>Typing React Props</h2>

      <FlowChart
        title="Props Typing Decision Tree"
        chart={"graph TD\n  A[Defining component props] --> B{Children needed?}\n  B -->|Yes| C[ReactNode — accepts any JSX]\n  B -->|No| D[Plain interface]\n  D --> E{Extending HTML element?}\n  E -->|Yes| F[ComponentPropsWithoutRef]\n  E -->|No| G[Custom interface]\n  G --> H{Mutually exclusive modes?}\n  H -->|Yes| I[Discriminated Union]\n  H -->|No| J[Optional props with literal unions]"}
      />

      <CodeBlock language="typescript" title="Props Patterns">
{`import { ReactNode, ComponentPropsWithoutRef } from 'react';

// Basic props
interface CardProps {
  title: string;
  variant?: 'default' | 'elevated' | 'outlined'; // optional with literal union
  children: ReactNode; // explicit > PropsWithChildren
}

function Card({ title, variant = 'default', children }: CardProps) {
  return <div className={variant}><h2>{title}</h2>{children}</div>;
}

// Extending HTML element — consumer gets ALL native button props for free
interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

function Button({ variant = 'primary', isLoading, children, ...rest }: ButtonProps) {
  return (
    <button disabled={isLoading || rest.disabled} {...rest}>
      {isLoading ? <Spinner /> : children}
    </button>
  );
}
// Consumer gets: onClick, disabled, type, className, aria-*, data-* — all typed!

// Polymorphic "as" prop — renders as any element or component
interface BoxProps<T extends React.ElementType = 'div'> {
  as?: T;
  children?: ReactNode;
}
type PolymorphicProps<T extends React.ElementType> =
  BoxProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof BoxProps>;

function Box<T extends React.ElementType = 'div'>({ as, children, ...props }: PolymorphicProps<T>) {
  const Component = as || 'div';
  return <Component {...props}>{children}</Component>;
}
// <Box as="a" href="/home"> → typed href, renders <a>
// <Box as="section" id="main"> → typed id, renders <section>`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          CHILDREN TYPES
      ══════════════════════════════════════════════════ */}
      <h2>Children Types</h2>
      <CodeBlock language="typescript" title="ReactNode vs ReactElement vs JSX.Element">
{`import { ReactNode, ReactElement } from 'react';

// ReactNode — anything React can render (use this by default for children)
// = string | number | boolean | null | undefined | ReactElement | Iterable<ReactNode>
interface LayoutProps { children: ReactNode; }
// ✅ Use for: wrappers, providers, layouts — anything that just forwards children

// ReactElement — a real React element object (evaluated JSX)
// Excludes: string, number, null, undefined, arrays
interface CloneableProps { children: ReactElement; }
// ✅ Use for: when you need React.cloneElement(children, extraProps)

// JSX.Element = ReactElement<any, any> — avoid, ReactElement is more precise

// Render prop — children is a function
interface DataFetcherProps<T> {
  url: string;
  children: (data: T | null, loading: boolean) => ReactNode;
}

// Detecting render prop vs plain JSX at runtime
function Wrapper({ children }: { children: ReactNode | ((data: string) => ReactNode) }) {
  if (typeof children === 'function') {
    return <>{children('some-data')}</>;  // render prop — component decides content
  }
  return <>{children}</>;                // plain JSX — parent decided content
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          DISCRIMINATED UNIONS
      ══════════════════════════════════════════════════ */}
      <h2>Discriminated Unions — Mutually Exclusive Props</h2>

      <InfoBox variant="tip" title="When to Use Discriminated Unions">
        <p>Use when a component has different "modes" that require different props. Making everything optional allows invalid combinations — a discriminated union makes impossible states unrepresentable.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="Discriminated Union Props">
{`// BAD — allows invalid combinations like { href: '/foo', onClick: fn, disabled: true }
interface BadButtonProps {
  href?: string;
  onClick?: () => void;
  disabled?: boolean; // makes no sense for a link
  target?: string;    // makes no sense for a button
}

// GOOD — each variant has exactly the right props, nothing more
type ButtonProps =
  | { as: 'button'; onClick: () => void; disabled?: boolean; type?: 'button' | 'submit' | 'reset' }
  | { as: 'link'; href: string; target?: '_blank' | '_self' };

function ActionButton(props: ButtonProps) {
  if (props.as === 'link') {
    // TypeScript narrows: href ✅, onClick ❌ (doesn't exist on this branch)
    return <a href={props.href} target={props.target}>Click</a>;
  }
  // TypeScript narrows: onClick ✅, href ❌ (doesn't exist on this branch)
  return <button onClick={props.onClick} disabled={props.disabled}>Click</button>;
}

// Another common example — alert with conditional required props
type AlertProps =
  | { severity: 'info' | 'success'; message: string }
  | { severity: 'error'; message: string; retry: () => void }
  | { severity: 'warning'; message: string; dismissable: true; onDismiss: () => void };

function Alert(props: AlertProps) {
  if (props.severity === 'error') {
    // props.retry is typed and required here
    return <div><p>{props.message}</p><button onClick={props.retry}>Retry</button></div>;
  }
  // props.retry doesn't exist here — TypeScript errors if you try to access it
  return <p>{props.message}</p>;
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          HOOKS
      ══════════════════════════════════════════════════ */}
      <h2>Typing Hooks</h2>

      <CodeBlock language="typescript" title="useState, useRef, useReducer">
{`// useState — inference usually works; annotate for nullable/complex types
const [count, setCount] = useState(0);                // inferred: number
const [user, setUser]   = useState<User | null>(null); // explicit: nullable
const [items, setItems] = useState<Item[]>([]);        // explicit: typed array

// useRef — two uses, two different types
const inputRef = useRef<HTMLInputElement | null>(null);       // DOM ref
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // mutable value, no DOM

// ⚠️ React 19 changed useRef's types in two ways:
//   1. The zero-argument overload is GONE. useRef<T>() no longer compiles —
//      "Expected 1 arguments, but got 0". Always pass an initial value,
//      which for these two cases means an explicit null.
//   2. RefObject<T>.current is now mutable. In React 18 and earlier,
//      useRef<T>(null) produced a read-only .current; that distinction
//      between RefObject and MutableRefObject is gone.

// Access DOM element safely
useEffect(() => {
  inputRef.current?.focus(); // optional chain — null on first render
}, []);

// useReducer — type the full state shape and every action variant
type State = { count: number; error: string | null; loading: boolean };
type Action =
  | { type: 'increment'; payload: number }
  | { type: 'reset' }
  | { type: 'error'; payload: string }
  | { type: 'loading' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment': return { ...state, count: state.count + action.payload };
    case 'reset':     return { count: 0, error: null, loading: false };
    case 'error':     return { ...state, error: action.payload, loading: false };
    case 'loading':   return { ...state, loading: true };
    // If you add a new action type and forget a case,
    // TypeScript errors on the implicit undefined return ✅
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, error: null, loading: false });
dispatch({ type: 'increment', payload: 1 }); // payload required ✅
dispatch({ type: 'reset' });                 // no payload needed ✅
dispatch({ type: 'increment' });             // TypeScript error — missing payload ❌`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Context Typing">
{`import { createContext, useContext, ReactNode } from 'react';

interface AuthContextValue {
  user: User | null;
  login: (creds: { username: string; password: string }) => Promise<void>;
  logout: () => void;
}

// Standard pattern: createContext<T | null>(null)
// null means "not inside a provider" — the hook catches this
const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (creds: { username: string; password: string }) => {
    const user = await authenticate(creds);
    setUser(user);
  };

  return (
    <AuthContext value={{ user, login, logout: () => setUser(null) }}>
      {children}
    </AuthContext>
  );
}

// Hook throws if used outside provider — narrows null away for all callers
function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx; // TypeScript knows ctx is AuthContextValue here (null narrowed out)
}

// Usage — no null checks needed anywhere
function Profile() {
  const { user, logout } = useAuth(); // user: User | null, logout: () => void ✅
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Custom Hooks">
{`// Explicit return type — makes the public API clear for callers
function useFetch<T>(url: string): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
} {
  const [data, setData]         = useState<T | null>(null);
  const [error, setError]       = useState<Error | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then(r => r.json())
      .then((d: T) => { setData(d); setLoading(false); })
      .catch(e => { if (e.name !== 'AbortError') { setError(e); setLoading(false); } });
    return () => controller.abort();
  }, [url]);

  return { data, error, isLoading };
}

// Usage — T inferred from the type argument
const { data, isLoading } = useFetch<User[]>('/api/users');
// data: User[] | null ✅`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          GENERIC COMPONENTS
      ══════════════════════════════════════════════════ */}
      <h2>Generic Components</h2>

      <CodeBlock language="typescript" title="Generic List & Select">
{`// Generic List — T inferred from the items prop at usage site
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string | number;
  emptyState?: ReactNode;
}

function List<T>({ items, renderItem, keyExtractor, emptyState }: ListProps<T>) {
  if (items.length === 0) return <>{emptyState ?? <p>No items</p>}</>;
  return (
    <ul>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>{renderItem(item, i)}</li>
      ))}
    </ul>
  );
}

// T is inferred as User — item is fully typed inside callbacks
<List
  items={users}
  keyExtractor={user => user.id}
  renderItem={user => <span>{user.name}</span>}
/>

// Generic Select — options constrained to string literals
interface SelectProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

function Select<T extends string>({ options, value, onChange, label }: SelectProps<T>) {
  return (
    <label>
      {label}
      <select value={value} onChange={e => onChange(e.target.value as T)}>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </label>
  );
}

const STATUSES = ['active', 'inactive', 'pending'] as const;
type Status = typeof STATUSES[number]; // 'active' | 'inactive' | 'pending'

// value and onChange are typed as Status — not string
<Select options={STATUSES} value={status} onChange={setStatus} label="Status" />`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          EVENTS
      ══════════════════════════════════════════════════ */}
      <h2>Typing Events</h2>

      <CodeBlock language="typescript" title="Event Handler Types">
{`// Inline — TypeScript infers the event type from the JSX element context
<input onChange={e => console.log(e.target.value)} />  // e is ChangeEvent<HTMLInputElement>

// Standalone handlers — annotate explicitly
const handleChange  = (e: React.ChangeEvent<HTMLInputElement>): void => {
  console.log(e.target.value);
};
const handleSubmit  = (e: React.FormEvent<HTMLFormElement>): void => {
  e.preventDefault();
  const data = new FormData(e.currentTarget); // e.currentTarget is HTMLFormElement
};
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
  if (e.key === 'Enter') submit();
};
const handleClick   = (e: React.MouseEvent<HTMLButtonElement>): void => {
  e.stopPropagation();
};

// Common event types — pattern: React.{EventType}Event<{Element}>
// React.ChangeEvent<HTMLInputElement>      → input, textarea
// React.ChangeEvent<HTMLSelectElement>     → select
// React.FormEvent<HTMLFormElement>         → form submit
// React.MouseEvent<HTMLButtonElement>      → button click
// React.KeyboardEvent<HTMLInputElement>    → keydown, keyup
// React.FocusEvent<HTMLInputElement>       → focus, blur
// React.DragEvent<HTMLDivElement>          → drag events

// Shorthand types for props interfaces
interface FormProps {
  onSubmit: React.FormEventHandler<HTMLFormElement>;    // = (e: FormEvent<...>) => void
  onChange: React.ChangeEventHandler<HTMLInputElement>; // = (e: ChangeEvent<...>) => void
}`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          REACT.FC
      ══════════════════════════════════════════════════ */}
      <h2>React.FC — Why Not to Use It</h2>

      <CodeBlock language="typescript" title="React.FC vs plain function">
{`// React.FC — usually not worth it
const Card: React.FC<CardProps> = ({ title }) => <div>{title}</div>;
// Problems:
// 1. Generic components don't work — you cannot write React.FC<ListProps<T>>
//    and still have T inferred at the call site
// 2. Hides that the component returns JSX — less explicit than needed
// 3. Locks the return type to ReactNode, so it fights you if you ever want
//    to return something the annotation didn't anticipate
//
// ⚠️ OUTDATED OBJECTION: "React.FC adds an implicit children prop."
// That was true up to @types/react 17. It was REMOVED in @types/react 18 —
// FunctionComponent<P> is now just (props: P) => ReactNode | Promise<ReactNode>.
// If you want children today you must declare it yourself, with React.FC or without.

// Plain function — preferred everywhere
function Card({ title }: CardProps) {
  return <div>{title}</div>;
}

// Arrow function also fine
const Card = ({ title }: CardProps) => <div>{title}</div>;

// Benefits of plain function:
// ✅ You control the children prop explicitly
// ✅ Generic components work: function List<T>({ items }: ListProps<T>)
// ✅ Standard JS syntax — no React-specific wrapper
// ✅ TypeScript infers JSX.Element return type automatically`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          REDUCERS — ACTIONS AND STATE (BUILT FROM SCRATCH)
      ══════════════════════════════════════════════════ */}
      <h2>Reducers in TypeScript — Actions, State, and the Contract</h2>

      <p>
        The <code>useReducer</code> section above shows the finished pattern. This section builds it from nothing,
        because "what type goes on <code>action</code> and what type goes on <code>state</code>" is the single
        hardest thing to get right the first time — and the two get mixed together constantly.
      </p>

      <p>
        Hold one sentence in your head for the whole section:{' '}
        <strong>actions announce what just happened, state describes what the app currently is,
        and the reducer is the only thing that translates between them.</strong>{' '}
        Almost every reducer typing mistake is a violation of that sentence.
      </p>

      <p>
        Every compiler error quoted below is real output from <code>tsc --strict --noEmit</code>, copied verbatim.
      </p>

      <FlowChart
        title="dispatch → reducer → narrowed case → new state"
        chart={"graph TD\n  A[\"Component calls dispatch(action)\"] --> B[\"Action union: type plus payload only.<br/>Never state fields.\"]\n  B --> C[\"reducer(state, action): State\"]\n  C --> D{\"switch on action.type\"}\n  D -->|FETCH_START| E[\"action narrowed to just the type.<br/>action.data is a COMPILE ERROR here.\"]\n  D -->|FETCH_SUCCESS| F[\"action narrowed.<br/>action.data is Product array.\"]\n  D -->|FETCH_ERROR| G[\"action narrowed.<br/>action.error is Error.\"]\n  D -->|default| H[\"action narrowed to never.<br/>assertNever(action)\"]\n  E --> I[\"Return a shape matching EXACTLY ONE state variant\"]\n  F --> I\n  G --> I\n  I --> J[\"The return type annotation checks every case against the contract\"]\n  J --> K[\"New state, re-render, narrow again in the UI\"]\n  style B fill:#1a2744,stroke:#5b9cf6\n  style H fill:#3b1a1a,stroke:#f87171\n  style J fill:#1a3329,stroke:#4ade80"}
      />

      <h3>Step 0 — The Untyped Reducer, and What TypeScript Actually Sees</h3>

      <p>
        Start with a reducer copied straight out of a JavaScript codebase. It looks fine. Under <code>strict</code> it is not.
      </p>

      <CodeBlock language="typescript" title="❌ No annotations — TS7006">
{`export function apiReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { loading: true, data: null, error: null };
    default:
      return state;
  }
}

// tsc --strict --noEmit
// error TS7006: Parameter 'state' implicitly has an 'any' type.
// error TS7006: Parameter 'action' implicitly has an 'any' type.`}
      </CodeBlock>

      <p>
        Two errors, not one — <code>state</code> and <code>action</code> are separate boundaries and each needs its
        own type. And notice what the <code>any</code> would cost you if <code>noImplicitAny</code> were off:{' '}
        <code>action.typo</code>, <code>action.data</code> on an action that has no data, <code>state.whatever</code> —
        all of it compiles. A reducer is a state machine, and an untyped state machine is exactly the code that
        TypeScript is best at protecting. This is the whole reason the annotation exists.
      </p>

      <InfoBox variant="warning" title="Adding TypeScript is not the same as gaining type safety">
        <p>Annotating these two parameters as <code>any</code> to make the red squiggles go away is <em>worse</em> than leaving the file as plain JavaScript — you now have the build cost of TypeScript and none of the protection, plus a file that looks typed to the next reader. Type the action and the state properly, or leave the file alone until you can.</p>
      </InfoBox>

      <h3>Step 1 — Type the ACTION First, On Its Own</h3>

      <p>
        Type the action before you touch state. It is the smaller, more constrained piece, and getting it right
        forces the state type into shape afterwards.
      </p>

      <h4>Wrong turn 1 — putting state fields on the action</h4>

      <p>
        This is the most common first attempt: the reducer returns <code>{'{ loading, data, error }'}</code>, so the
        action gets <code>loading</code>, <code>data</code> and <code>error</code> too. It feels symmetrical. It is backwards.
      </p>

      <CodeBlock language="typescript" title="❌ State fields on the action — TS2345">
{`type ApiAction =
  | { type: 'FETCH_START'; loading: true; data: null; error: null }
  | { type: 'FETCH_SUCCESS'; loading: false; data: unknown; error: null };

declare function dispatch(action: ApiAction): void;

dispatch({ type: 'FETCH_START' });

// error TS2345: Argument of type '{ type: "FETCH_START"; }' is not assignable to parameter of type 'ApiAction'.
//   Type '{ type: "FETCH_START"; }' is missing the following properties from
//   type '{ type: "FETCH_START"; loading: true; data: null; error: null; }': loading, data, error`}
      </CodeBlock>

      <p>
        Read that error as a design review, not a syntax problem. TypeScript is telling you that{' '}
        <strong>every single call site now has to compute the next state before it can dispatch.</strong>{' '}
        The whole point of a reducer is that the caller says what happened and the reducer decides what that means.
        If the caller already knows <code>loading: true, data: null, error: null</code>, the reducer is doing nothing.
      </p>

      <p>
        The test: an action should read like a sentence in the past tense — "the fetch started", "the fetch
        succeeded, here is the data". <code>{'{ type: '}</code>FETCH_START<code>{', loading: true }'}</code> reads
        like "the fetch started, and also here is what loading should be now", which is two jobs in one object.
      </p>

      <h4>Wrong turn 2 — one loose action shape for everything</h4>

      <p>
        The other common attempt is to give up on per-variant shapes and write one permissive object. Watch what
        the compiler says about it:
      </p>

      <CodeBlock language="typescript" title="❌ Loose action shape — compiles clean, and THAT is the bug">
{`type ApiAction = { type: string; data?: unknown; error?: unknown };

declare function dispatch(action: ApiAction): void;

dispatch({ type: 'FETCH_SUCCES', data: [] });                  // typo in the action name
dispatch({ type: 'FETCH_SUCCESS', error: new Error('boom') }); // an error on a SUCCESS action

// tsc --strict --noEmit
// (no output — zero errors)`}
      </CodeBlock>

      <p>
        Zero errors. A typo'd action name silently does nothing at runtime, and a success action carrying an error
        object is nonsense that type-checks. <code>type: string</code> and optional payload fields are how you write
        an action type that cannot catch anything.
      </p>

      <h4>Right — a discriminated union of actions</h4>

      <CodeBlock language="typescript" title="✅ Actions as a discriminated union — type + payload, nothing else">
{`interface Product { id: number; name: string }

type ApiAction =
  | { type: 'FETCH_START' }                    // no payload — the event carries nothing
  | { type: 'FETCH_SUCCESS'; data: Product[] } // payload: the data that arrived
  | { type: 'FETCH_ERROR'; error: Error };     // payload: the error that was thrown

// Read it as three sentences:
//   "the fetch started"
//   "the fetch succeeded, here are the products"
//   "the fetch failed, here is the error"
//
// Each variant carries EXACTLY the ingredients that event delivers, and nothing more.
// If a case in the reducer never reads anything off the action except .type,
// that variant really is just { type: 'X' }. That is not an oversight — it is correct.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why FETCH_START having no fields is right, not lazy">
        <p>A common instinct is that all the variants should "look the same" for consistency. They should not. Different actions carry different ingredients because they describe different real events. <code>CLOSE_MODAL</code> needs nothing. <code>REMOVE_TOAST</code> needs just an id. <code>ADD_TOAST</code> needs id, message and kind. Padding them out to a uniform shape re-introduces exactly the looseness the union exists to remove.</p>
      </InfoBox>

      <h4>The payoff, concretely</h4>

      <p>
        Here is the mistake the union is designed to catch — reading <code>action.data</code> inside a case whose
        variant has no <code>data</code>:
      </p>

      <CodeBlock language="typescript" title="❌ action.data in the FETCH_START case — TS2339">
{`export function read(action: ApiAction) {
  switch (action.type) {
    case 'FETCH_START':
      return action.data;   // ← this line
    default:
      return null;
  }
}

// error TS2339: Property 'data' does not exist on type '{ type: "FETCH_START"; }'.`}
      </CodeBlock>

      <p>
        Look at the type in the error message: <code>{'{ type: "FETCH_START"; }'}</code>, not <code>ApiAction</code>.
        The <code>switch</code> on <code>action.type</code> narrowed <code>action</code> from the full union down to
        the one variant that matches — so inside that case, <code>data</code> genuinely does not exist. That narrowing
        is the entire reason for the discriminator field.
      </p>

      <p>And at the dispatch site, the same union catches the two mistakes the loose shape let through:</p>

      <CodeBlock language="typescript" title="❌ Dispatch-site errors the union catches — TS2345, TS2820">
{`dispatch({ type: 'FETCH_SUCCESS' });

// error TS2345: Argument of type '{ type: "FETCH_SUCCESS"; }' is not assignable to parameter of type 'ApiAction'.
//   Property 'data' is missing in type '{ type: "FETCH_SUCCESS"; }'
//   but required in type '{ type: "FETCH_SUCCESS"; data: Product[]; }'.

dispatch({ type: 'FETCH_STAR' });

// error TS2820: Type '"FETCH_STAR"' is not assignable to
//   type '"FETCH_START" | "FETCH_SUCCESS" | "FETCH_ERROR"'. Did you mean '"FETCH_START"'?`}
      </CodeBlock>

      <p>
        TS2820 even suggests the fix. That is the difference between an action union and{' '}
        <code>type: string</code>.
      </p>

      <InteractiveChallenge
        language="typescript"
        question="A reducer needs to handle a 'CLOSE_MODAL' event. The reducer sets openProductId back to null when it happens. Which action variant is correct?"
        code={`// A
{ type: 'CLOSE_MODAL'; openProductId: null }

// B
{ type: 'CLOSE_MODAL' }

// C
{ type: 'CLOSE_MODAL'; payload?: unknown }

// D
{ type: string; openProductId: number | null }`}
        options={[
          'A — the action should carry the value the state will end up with',
          'B — the event carries no ingredients, so type alone is the whole variant',
          'C — always include an optional payload so the shape stays uniform',
          'D — a general shape that covers every modal action at once',
        ]}
        correctIndex={1}
        explanation={"B. openProductId is a STATE field, so putting it on the action (A) forces every dispatch site to compute the next state — backwards. C and D are the loose-shape trap: optional payloads and type: string make typos and nonsense payloads compile. Closing the modal delivers no ingredients, so { type: 'CLOSE_MODAL' } is the complete and correct variant. The reducer is the thing that knows CLOSE_MODAL means openProductId: null."}
      />

      <h3>Step 2 — Type the STATE: Union or Plain Object?</h3>

      <p>
        This is a real decision, not a default. Both answers are correct in different reducers, and picking the
        wrong one produces errors that look like type problems but are actually modelling problems.
      </p>

      <InfoBox variant="question" title="The test — run it every time">
        <p><strong>"Is there a combination of field values that would be nonsense at runtime, but that a plain object type would allow?"</strong></p>
        <p><strong>Yes</strong> → discriminated union. The plain shape is too permissive; you need to encode which combinations are legal.<br/>
        <strong>No</strong> → plain object. All combinations are legitimate; there is nothing to forbid.</p>
      </InfoBox>

      <h4>Case A — the fetch reducer: correlated fields, so a union is right</h4>

      <p>
        Loading, success and error are mutually exclusive. You cannot be loading <em>and</em> holding data{' '}
        <em>and</em> holding an error. A plain object would allow{' '}
        <code>{'{ loading: true, data: products, error: someError }'}</code>, which is meaningless. That is a yes on
        the test, so: union.
      </p>

      <CodeBlock language="typescript" title="✅ Correlated fields — discriminated union">
{`// Version A — a dedicated discriminator field (cleanest, most common)
type ApiState =
  | { status: 'loading' }
  | { status: 'success'; data: Product[] }
  | { status: 'error'; error: Error };

// Version C — every field on every variant, so consumers can destructure
// { loading, data, error } the way they always have. Also valid.
type ApiStateC =
  | { loading: true;  data: null;       error: null }
  | { loading: false; data: Product[];  error: null }
  | { loading: false; data: null;       error: Error };

// Both encode the SAME invariants. Pick on ergonomics for consumers, not correctness.
// Note in Version C that the TYPE of 'data' changes between variants —
// null, then Product[], then null. That is the tell of a genuine union:
// narrowing on the discriminator changes what the other fields are.`}
      </CodeBlock>

      <h4>Case B — the UI reducer: independent fields, so a union is wrong</h4>

      <p>
        Now the same instinct gets applied to a UI reducer holding <code>view</code>, <code>openProductId</code> and{' '}
        <code>toasts</code>. Copying the union pattern across produces this:
      </p>

      <CodeBlock language="typescript" title="❌ Wrong turn 1 — one field per variant — TS2339">
{`interface Toast { id: number; message: string }

type UiState =
  | { openProductId: number }
  | { openProductId: null }
  | { toasts: Toast[] };

export function readToasts(state: UiState) {
  return state.toasts;
}

// error TS2339: Property 'toasts' does not exist on type 'UiState'.
//   Property 'toasts' does not exist on type '{ openProductId: number; }'.`}
      </CodeBlock>

      <p>
        Two things are broken here. <code>view</code> is missing from every variant, and each variant describes{' '}
        <em>one field</em> rather than the whole object. Accessing a property directly on a union requires{' '}
        <strong>every</strong> member to have it — hence the error naming the one variant that does not.
      </p>

      <p>
        The natural "fix" is to add all the fields to every variant. That produces a second, more confusing error:
      </p>

      <CodeBlock language="typescript" title="❌ Wrong turn 2 — all fields, but as mutually exclusive slots — TS2322, TS2488">
{`type UiState =
  | { view: string; openProductId: null;   toasts: null }
  | { view: null;   openProductId: number; toasts: null }
  | { view: null;   openProductId: null;   toasts: null }
  | { view: null;   openProductId: null;   toasts: Toast[] };

type UiAction = { type: 'ADD_TOAST'; toast: Toast };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };
  }
}

// error TS2322: Type '{ toasts: any[]; view: string; openProductId: null; } | ... ' is not assignable to type 'UiState'.
//   Type '{ toasts: any[]; view: string; openProductId: null; }' is not assignable to type 'UiState'.
//     Type '{ toasts: any[]; view: string; openProductId: null; }' is not assignable to type
//       '{ view: null; openProductId: null; toasts: Toast[]; }'.
//         Types of property 'view' are incompatible.
//           Type 'string' is not assignable to type 'null'.
//
// error TS2488: Type 'Toast[] | null' must have a '[Symbol.iterator]()' method that returns an iterator.`}
      </CodeBlock>

      <p>
        The TS2488 is the interesting one. Why is <code>state.toasts</code> typed{' '}
        <code>{'Toast[] | null'}</code> inside a case that is specifically about toasts? Because{' '}
        <strong>switching on <code>action.type</code> narrows <code>action</code>, never <code>state</code>.</strong>{' '}
        Nothing about being in the <code>ADD_TOAST</code> case tells TypeScript which state variant you are in, so{' '}
        <code>state.toasts</code> still has to account for all four at once — three say <code>null</code>, one says{' '}
        <code>Toast[]</code> — and <code>null</code> cannot be spread.
      </p>

      <h4>The proof — trace real dispatches</h4>

      <p>
        Reasoning about the fields abstractly is what led to the wrong shape twice. Trace an actual sequence instead:
      </p>

      <CodeBlock language="typescript" title="Four ordinary dispatches that no union variant can represent">
{`// 1. initial:      view: 'browse', openProductId: null, toasts: []
// 2. SET_VIEW   →  view: 'cart',   openProductId: null, toasts: []
// 3. ADD_TOAST  →  view: 'cart',   openProductId: null, toasts: [oneToast]
// 4. OPEN_MODAL →  view: 'cart',   openProductId: 5,    toasts: [oneToast]

case 'OPEN_MODAL':
  return { ...state, openProductId: action.productId }; // preserves view AND toasts

// Final state has all three fields populated at once. That is a completely
// normal UI state — a cart view, with a toast showing, and a modal open.
// None of the four union variants above can represent it.
// The union was not stylistically off. It was structurally wrong.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The mechanical tell — more reliable than eyeballing the fields">
        <p>Look at what each <code>case</code> returns:</p>
        <p><strong>Every case builds a fresh, complete object</strong> (no <code>...state</code>) → the reducer swaps between a closed set of whole snapshots → <strong>discriminated union</strong>. That is <code>apiReducer</code>.</p>
        <p><strong>Every case does <code>{'{ ...state, oneField: x }'}</code></strong> → fields accumulate independently and carry across transitions → <strong>plain object</strong>. That is <code>uiReducer</code>.</p>
        <p>If you find yourself spreading <code>...state</code> into a union variant, you have almost certainly picked the wrong shape.</p>
      </InfoBox>

      <CodeBlock language="typescript" title="✅ Independent fields — a plain interface">
{`const VIEWS = ['browse', 'cart', 'favorites'] as const;

export interface UiState {
  view: (typeof VIEWS)[number];  // 'browse' | 'cart' | 'favorites'
  openProductId: number | null;
  toasts: Toast[];               // always an array, never null
}

export type UiAction =
  | { type: 'SET_VIEW'; view: (typeof VIEWS)[number] }
  | { type: 'OPEN_MODAL'; productId: number }
  | { type: 'CLOSE_MODAL' }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: number };

export function uiReducer(state: UiState, action: UiAction): UiState {
  switch (action.type) {
    case 'SET_VIEW':     return { ...state, view: action.view };
    case 'OPEN_MODAL':   return { ...state, openProductId: action.productId };
    case 'CLOSE_MODAL':  return { ...state, openProductId: null };
    case 'ADD_TOAST':    return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
  }
}

// Compiles clean. state.toasts is Toast[] everywhere, so the spread just works.
// Note the ACTIONS are still a discriminated union — that never changes.
// It is only the STATE that is a plain object here.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Actions are always a union. State sometimes is.">
        <p>These two decisions are independent and it is easy to conflate them. Actions are a discriminated union in <em>every</em> reducer, because different events genuinely carry different payloads. State is a union only when its fields are correlated. <code>uiReducer</code> above has union actions and plain-object state, and that combination is completely normal.</p>
      </InfoBox>

      <InteractiveChallenge
        language="typescript"
        question="A form reducer holds { name: string; email: string; agreedToTerms: boolean; submitCount: number }. Every case is written as { ...state, oneField: value }. Should the state type be a discriminated union or a plain object?"
        options={[
          'Discriminated union — reducers should always use unions for state',
          'Plain object — the fields are independent and every combination is a valid form state',
          'Discriminated union — submitCount correlates with agreedToTerms',
          'Plain object, but only because there are more than three fields',
        ]}
        correctIndex={1}
        explanation={'Plain object. Run the test: is there a combination of name, email, agreedToTerms and submitCount that would be nonsense at runtime? No — any name with any email with either checkbox value and any submit count is a legitimate form state. There is nothing to forbid, so there is nothing to narrow, so a union buys you nothing and costs you the ...state spread. The mechanical tell agrees: every case spreads ...state and changes one field, which means fields accumulate independently.'}
      />

      <h3>Step 3 — The Reducer's Return Type Is the Contract</h3>

      <p>
        This one is easy to skip because the code appears to work without it. Here is what actually happens when
        you leave the return type off a reducer whose state is a union of literal types:
      </p>

      <CodeBlock language="typescript" title="❌ No return type annotation — literal widening — TS2322">
{`type ApiState =
  | { loading: true;  data: null;      error: null }
  | { loading: false; data: Product[]; error: null }
  | { loading: false; data: null;      error: Error };

//                                            ↓ no ': ApiState' here
export function apiReducer(state: ApiState, action: ApiAction) {
  switch (action.type) {
    case 'FETCH_START':   return { loading: true,  data: null,        error: null };
    case 'FETCH_SUCCESS': return { loading: false, data: action.data, error: null };
    case 'FETCH_ERROR':   return { loading: false, data: null,        error: action.error };
  }
}

const next: ApiState = apiReducer(initialState, { type: 'FETCH_START' });

// error TS2322: Type '{ loading: boolean; data: null; error: null; } | ... ' is not assignable to type 'ApiState'.
//   Type '{ loading: boolean; data: null; error: null; }' is not assignable to type 'ApiState'.
//     Type '{ loading: boolean; data: null; error: null; }' is not assignable to
//       type '{ loading: true; data: null; error: null; }'.
//         Types of property 'loading' are incompatible.
//           Type 'boolean' is not assignable to type 'true'.`}
      </CodeBlock>

      <p>
        Read the last line: <code>boolean</code> is not assignable to <code>true</code>. With no return type to check
        against, TypeScript inferred each return from scratch and <strong>widened</strong> the literal{' '}
        <code>true</code> to <code>boolean</code> — which no longer matches any variant. The error also surfaces
        somewhere else entirely (at the call site), which is why this one is confusing to debug.
      </p>

      <p>
        The fix is one annotation, and it changes the compiler's whole mode of operation: instead of inferring a
        type from your returns, it now <em>checks</em> each return against a declared contract.
      </p>

      <CodeBlock language="typescript" title="✅ Annotate the return type — and get better errors everywhere">
{`export function apiReducer(state: ApiState, action: ApiAction): ApiState {
//                                                            ^^^^^^^^^^ the contract

// Now this mistake — mixing the old flat shape into a Version A union —
// errors at the exact line that is wrong, instead of at some call site:
    case 'FETCH_START':
      return { status: 'loading', data: null, error: null };

// error TS2353: Object literal may only specify known properties,
//   and 'data' does not exist in type '{ status: "loading"; }'.`}
      </CodeBlock>

      <p>
        That TS2353 is the exact "muscle memory" mistake: writing{' '}
        <code>{'{ loading, data, error }'}</code> in every case because that is what you have written a thousand
        times. In a discriminated union, <strong>each case must return a shape matching exactly one variant</strong>.
        The loading variant here is <code>{'{ status: \'loading\' }'}</code> and carries no <code>data</code> at all,
        so putting one there is an error. Open the state type in a split view while you write the switch — every
        case has to land on exactly one of those variants.
      </p>

      <p>The same rule applies to the initial state — it has to be one variant, not a blend of all of them:</p>

      <CodeBlock language="typescript" title="❌ Initial state blending old and new shapes — TS2353">
{`// Using the Version C union from Step 2:
type ApiStateC =
  | { loading: true;  data: null;      error: null }
  | { loading: false; data: Product[]; error: null }
  | { loading: false; data: null;      error: Error };

const initialState: ApiStateC = {
  status: undefined,   // ← left over from the old flat shape
  loading: false,
  data: null,
  error: null,
};

// error TS2353: Object literal may only specify known properties, and 'status'
//   does not exist in type '{ loading: false; data: null; error: Error; }'.

// ✅ Pick exactly one variant. For a hook that starts by fetching:
const initialState: ApiStateC = { loading: true, data: null, error: null };
// or, in Version A:
const initialState: ApiState = { status: 'loading' };`}
      </CodeBlock>

      <h3>Step 4 — assertNever: Turn a Missed Case Into a Compile Error</h3>

      <p>
        You have a reducer with three action variants and three cases. Six months later someone adds a fourth
        variant. What tells you the reducer needs updating?
      </p>

      <p>Nothing — if the switch has a <code>default</code> that returns state:</p>

      <CodeBlock language="typescript" title="❌ Silent fallthrough — a new variant compiles clean">
{`type ApiAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: Product[] }
  | { type: 'FETCH_ERROR'; error: Error }
  | { type: 'FETCH_CANCEL' };            // ← added later, no case written for it

export function apiReducer(state: ApiState, action: ApiAction): ApiState {
  switch (action.type) {
    case 'FETCH_START':   return { status: 'loading' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.data };
    case 'FETCH_ERROR':   return { status: 'error', error: action.error };
    default:
      return state;      // FETCH_CANCEL lands here and quietly does nothing
  }
}

// tsc --strict --noEmit
// (no output — zero errors)`}
      </CodeBlock>

      <p>
        Dropping the <code>default</code> gets you <em>something</em>, but not a useful something:
      </p>

      <CodeBlock language="typescript" title="⚠️ No default clause — TS2366, pointing at the wrong place">
{`// error TS2366: Function lacks ending return statement and return type
//   does not include 'undefined'.`}
      </CodeBlock>

      <p>
        That error points at the function signature and says "a return is missing" — it does not tell you{' '}
        <em>which variant</em> is unhandled, and it vanishes the moment anyone adds a <code>default</code> back.{' '}
        <code>assertNever</code> is the fix. It is not built in; it is nine words of your own code:
      </p>

      <CodeBlock language="typescript" title="✅ assertNever — TS2345 names the exact missing variant">
{`export function assertNever(value: never): never {
  throw new Error('Unhandled variant: ' + JSON.stringify(value));
}

export function apiReducer(state: ApiState, action: ApiAction): ApiState {
  switch (action.type) {
    case 'FETCH_START':   return { status: 'loading' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.data };
    case 'FETCH_ERROR':   return { status: 'error', error: action.error };
    default:
      return assertNever(action);
  }
}

// With FETCH_CANCEL added to the union but no case written:
// error TS2345: Argument of type '{ type: "FETCH_CANCEL"; }'
//   is not assignable to parameter of type 'never'.`}
      </CodeBlock>

      <p>
        The error names the exact variant you forgot. The whole trick lives in the parameter type:{' '}
        <code>never</code> is the type with no values, so TypeScript will only let you pass something to{' '}
        <code>assertNever</code> if it can <em>prove</em>, via narrowing, that nothing is left. Once every union
        member has its own <code>case</code>, whatever reaches <code>default</code> is narrowed to{' '}
        <code>never</code> and it compiles. Add a member and forget a case, and what reaches <code>default</code>{' '}
        is that member — not <code>never</code> — so it fails to compile.
      </p>

      <p>
        The same helper works on the state union when rendering, which is where it earns its keep a second time:
      </p>

      <CodeBlock language="typescript" title="✅ assertNever on the state union too">
{`export function render(state: ApiState): string {
  switch (state.status) {
    case 'loading': return 'Loading...';
    case 'success': return state.data.length + ' products';
    case 'error':   return state.error.message;
    default:        return assertNever(state);
  }
}
// Add a 'refreshing' state variant and this stops compiling until the UI handles it.`}
      </CodeBlock>

      <InfoBox variant="note" title="When NOT to use assertNever">
        <p><code>assertNever</code> throws at runtime, so it is a loud failure. Use it when <strong>you control both ends</strong> — your own action union, your own state union, your own status literals. That is a bug in your code, and crashing is the right response.</p>
        <p>When the value can come from outside your control — user input, a third-party API, data you did not write the server for — use a graceful <code>default</code> instead (<code>return 'Unknown'</code>, fall back to a safe state). An external system sending an unexpected value is not a bug in your switch.</p>
      </InfoBox>

      <h3>Step 5 — Wiring It Into React</h3>

      <p>
        With the reducer typed, <code>useReducer</code> needs almost nothing from you. Both type parameters are
        inferred from the reducer function's signature:
      </p>

      <CodeBlock language="typescript" title="✅ useReducer infers both types from the reducer">
{`const [state, dispatch] = useReducer(apiReducer, initialState);
// state:    ApiState        (from the reducer's return type)
// dispatch: Dispatch<ApiAction>  (from the reducer's action parameter)

dispatch({ type: 'FETCH_SUCCESS', data: products }); // ✅ payload checked
dispatch({ type: 'FETCH_SUCCESS' });                 // ❌ TS2345 — data missing
dispatch({ type: 'FETCH_STAR' });                    // ❌ TS2820 — did you mean 'FETCH_START'?

if (state.status === 'success') {
  state.data.map(p => p.name); // ✅ narrowed — .data exists only on this variant
}`}
      </CodeBlock>

      <p>
        There is one place inference bites: an initial state declared separately, without an annotation. Its
        literals widen before <code>useReducer</code> ever sees them.
      </p>

      <CodeBlock language="typescript" title="❌ Un-annotated initial state widens — TS2345">
{`const initialState = { status: 'loading' };   // inferred as { status: string }

const [state] = useReducer(apiReducer, initialState);

// error TS2345: Argument of type '{ status: string; }' is not assignable to parameter of type 'ApiState'.
//   Property 'error' is missing in type '{ status: string; }'
//   but required in type '{ status: "error"; error: Error; }'.

// ✅ Annotate the initial state — it is a boundary, so it gets a type
const initialState: ApiState = { status: 'loading' };`}
      </CodeBlock>

      <p>
        And when you pass <code>dispatch</code> through context or props, its type has a name:{' '}
        <code>{'Dispatch<ApiAction>'}</code>. That single type is what makes every consumer's dispatch calls checked.
      </p>

      <CodeBlock language="tsx" title="✅ Dispatch<Action> through context — the full wiring">
{`import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';

interface ProductsContextValue {
  state: ApiState;
  dispatch: Dispatch<ApiAction>;   // ← the typed dispatch function
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(apiReducer, initialState);
  return <ProductsContext value={{ state, dispatch }}>{children}</ProductsContext>;
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider');
  return ctx;  // null narrowed away for every caller
}

export function Refresh() {
  const { dispatch } = useProducts();
  // dispatch is Dispatch<ApiAction> here — typos and bad payloads are compile errors
  return <button onClick={() => dispatch({ type: 'FETCH_START' })}>Refresh</button>;
}`}
      </CodeBlock>

      <InfoBox variant="success" title="The reducer typing checklist">
        <p><strong>1.</strong> Action is a discriminated union of <code>type</code> + payload. No state fields, ever.<br/>
        <strong>2.</strong> A variant that needs nothing is just <code>{'{ type: \'X\' }'}</code>. That is correct, not lazy.<br/>
        <strong>3.</strong> State is a union only if some field combinations are nonsense. Run the test.<br/>
        <strong>4.</strong> Cases building fresh objects → union. Cases spreading <code>...state</code> → plain object.<br/>
        <strong>5.</strong> The reducer's return type is annotated. Non-negotiable — it is the contract.<br/>
        <strong>6.</strong> Initial state is annotated and matches exactly one variant.<br/>
        <strong>7.</strong> <code>default: return assertNever(action)</code> for unions you control.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          KEYOF / TYPEOF / T[K]
      ══════════════════════════════════════════════════ */}
      <h2>keyof, typeof and T[K] — The Generic That Needs Two Type Parameters</h2>

      <p>
        The <code>getProperty</code> example in the Generics section above shows the finished signature. This
        section shows the three wrong turns on the way there, because each one produces a different error and each
        one teaches something separate.
      </p>

      <p>
        The goal: a <code>sortBy</code> helper that sorts an array of anything by one of its keys.
      </p>

      <h3>Wrong turn 1 — typeof and keyof go in opposite directions</h3>

      <CodeBlock language="typescript" title="❌ typeof on a type parameter — TS2693">
{`type SortDirection = 'asc' | 'desc';

export function sortBy<T>(items: T[], key: typeof T, direction: SortDirection) {
  return items;
}

// error TS2693: 'T' only refers to a type, but is being used as a value here.`}
      </CodeBlock>

      <p>
        Read the error literally: <code>typeof</code> expects a <strong>value</strong>, and <code>T</code> is a{' '}
        <strong>type</strong>. These are two different operators that happen to share the shape of a keyword:
      </p>

      <CodeBlock language="typescript" title="typeof: value → type.   keyof: type → union of keys.">
{`// typeof takes a VALUE and gives you its TYPE — the value-to-type bridge
const IN_STOCK = 'in_stock';
type InStock = typeof IN_STOCK;          // 'in_stock'

const VIEWS = ['browse', 'cart'] as const;
type Views = typeof VIEWS;               // readonly ['browse', 'cart']

// keyof takes a TYPE and gives you the union of its KEY NAMES
interface Product { name: string; price: number }
type ProductKeys = keyof Product;        // 'name' | 'price'

// Opposite directions. You cannot keyof a value, and you cannot typeof a type.
// (Careful: runtime typeof — typeof x === 'string' — is a THIRD thing entirely,
//  a JavaScript operator that returns a string at runtime. Same keyword,
//  different universe. Which one you get depends on whether you are in a
//  type position or a value position.)`}
      </CodeBlock>

      <h3>Wrong turn 2 — an unconstrained T behaves like unknown inside the body</h3>

      <p>
        Switch to a plain <code>string</code> key and index into the item. It fails — and the error is the giveaway:
      </p>

      <CodeBlock language="typescript" title="❌ Indexing an unconstrained T — TS7053">
{`export function sortBy<T>(items: T[], key: string) {
  return [...items].sort((a, b) => (a[key] < b[key] ? -1 : 1));
}

// error TS7053: Element implicitly has an 'any' type because expression of type 'string'
//   can't be used to index type 'unknown'.
//   No index signature with a parameter of type 'string' was found on type 'unknown'.`}
      </CodeBlock>

      <p>
        Note the word in the error: <strong><code>unknown</code></strong>. You wrote <code>T</code>, but inside the
        function body TypeScript treats it as <code>unknown</code>. That is because a generic function's body is
        checked <em>abstractly</em>, once, against the type parameter — not separately for every call site. TypeScript
        cannot assume <code>T</code> has a <code>name</code> property, because someone might call{' '}
        <code>sortBy(numbers, ...)</code>.
      </p>

      <p>
        This is exactly the same error you get from <code>unknown</code> directly, which is the proof:
      </p>

      <CodeBlock language="typescript" title="The same failure, from unknown itself — TS2488">
{`export function sortBy(items: unknown) {
  return [...items];
}

// error TS2488: Type 'unknown' must have a '[Symbol.iterator]()' method that returns an iterator.

// unknown deliberately promises nothing, so spreading it is rejected.
// An unconstrained <T> promises nothing either.
// RULE: a generic that needs property access needs a CONSTRAINT.
//       Unconstrained T buys you nothing over unknown inside the body.`}
      </CodeBlock>

      <h3>Wrong turn 3 — the big one: keyof T alone is still not enough</h3>

      <p>
        Constrain the key with <code>keyof T</code> and the indexing compiles. But storing the result does not:
      </p>

      <CodeBlock language="typescript" title="❌ key: keyof T — TS2322 and the T[keyof T] collapse">
{`export function sortBy<T>(items: T[], key: keyof T) {
  return [...items].sort((a, b) => {
    const av: T = a[key];
    const bv: T = b[key];
    return av < bv ? -1 : 1;
  });
}

// error TS2322: Type 'T[keyof T]' is not assignable to type 'T'.
//   'T' could be instantiated with an arbitrary type which could be unrelated to 'T[keyof T]'.`}
      </CodeBlock>

      <p>
        <code>T[keyof T]</code> is the type in the error, and understanding it is the whole lesson.{' '}
        <code>keyof T</code> is the union of <em>every</em> key. When <code>key</code> is typed{' '}
        <code>keyof T</code>, TypeScript does not know which specific key it holds at any given moment — so{' '}
        <code>a[key]</code> has to produce a type that is valid <strong>no matter which key it turns out to be</strong>.
        That is the union of every property value type on <code>T</code>.
      </p>

      <p>Made concrete, with the generic removed so you can see the actual types:</p>

      <CodeBlock language="typescript" title="❌ The collapse, with a real type — TS2322">
{`interface Product { name: string; price: number }

declare const p: Product;
declare const k: keyof Product;   // 'name' | 'price'

const v = p[k];                   // string | number  ← has to cover BOTH keys
const asString: string = p[k];

// error TS2322: Type 'string | number' is not assignable to type 'string'.
//   Type 'number' is not assignable to type 'string'.`}
      </CodeBlock>

      <p>
        <code>string | number</code> is not assignable to <code>string</code>, or to <code>number</code>, or to{' '}
        <code>T</code>, or to anything specific. That is not a bug — it is TypeScript being correct. You asked for
        "the value at some key, we do not know which", and that is genuinely the answer.
      </p>

      <FlowChart
        title="T → keyof T → K extends keyof T → T[K]"
        chart={"graph TD\n  A[\"T — the object type, e.g. Product\"] --> B[\"keyof T — the union of ALL key names<br/>'name' or 'price'\"]\n  B --> C[\"key: keyof T<br/>the compiler does not know WHICH key\"]\n  B --> F[\"K extends keyof T<br/>K is ONE specific key, inferred per call site\"]\n  C --> D[\"a[key] must cover EVERY key at once<br/>so it collapses to T[keyof T]\"]\n  D --> E[\"For Product that is: string or number<br/>TS2322 — not assignable to anything specific\"]\n  F --> G[\"a[key] is T[K]<br/>the value type of THAT one key\"]\n  G --> H[\"sortBy(products, 'name') makes K = 'name'<br/>so T[K] resolves to string. Compiles.\"]\n  style E fill:#3b1a1a,stroke:#f87171\n  style H fill:#1a3329,stroke:#4ade80\n  style F fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>The fix — give the key its own type parameter, linked to T</h3>

      <p>
        Do not constrain <code>key</code> to <code>keyof T</code> directly. Give it its own type parameter that{' '}
        <em>extends</em> <code>keyof T</code>. The difference is that TypeScript then infers <code>K</code> as the
        one specific key from the call site and tracks it through the entire function.
      </p>

      <CodeBlock language="typescript" title="✅ sortBy<T, K extends keyof T> — compiles clean">
{`type SortDirection = 'asc' | 'desc';

export function sortBy<T, K extends keyof T>(items: T[], key: K, direction: SortDirection): T[] {
  return [...items].sort((a, b) => {
    const av: T[K] = a[key];
    const bv: T[K] = b[key];
    if (av === bv) return 0;
    const ascending = av < bv ? -1 : 1;
    return direction === 'asc' ? ascending : -ascending;
  });
}

interface Product { id: number; name: string; price: number }
declare const products: Product[];

sortBy(products, 'name', 'asc');   // K = 'name',  so T[K] = string  ✅
sortBy(products, 'price', 'desc'); // K = 'price', so T[K] = number  ✅
sortBy(products, 'nmae', 'asc');   // ❌ 'nmae' is not a key of Product

// K extends keyof T  → K must be SOME key of T, but TS narrows it to the one you passed
// T[K]               → "the value type of THAT specific key", not the union of all of them`}
      </CodeBlock>

      <InfoBox variant="tip" title="The rule, in one line">
        <p>If a function's return type or a local variable's type depends on <strong>which key</strong> was passed, that key needs its own generic parameter (<code>K extends keyof T</code>), and the value type is <code>T[K]</code> — not <code>T</code>, and not <code>keyof T</code>.</p>
      </InfoBox>

      <InteractiveChallenge
        language="typescript"
        question="You want a getField helper whose return type is the type of the field being read. Which signature works?"
        code={`interface Product { id: number; name: string }

// A
function getField<T>(obj: T, key: keyof T): T { return obj[key]; }

// B
function getField<T>(obj: T, key: typeof T) { return obj[key]; }

// C
function getField<T, K extends keyof T>(obj: T, key: K): T[K] { return obj[key]; }

// D
function getField<T>(obj: T, key: string) { return obj[key]; }`}
        options={[
          'A — keyof T already constrains the key, so obj[key] is safe',
          'B — typeof T extracts the key names from T',
          'C — a second type parameter tied to the first, with T[K] as the value type',
          'D — string is the simplest key type and TypeScript can figure out the rest',
        ]}
        correctIndex={2}
        explanation={"C. A fails with TS2322: with key typed keyof T, obj[key] collapses to T[keyof T] — the union of every value type on T (number | string for Product) — which is not assignable to T. B fails with TS2693, because typeof needs a value and T is a type; keyof is the type-to-keys operator. D fails with TS7053, because an unconstrained T behaves like unknown inside the body and cannot be indexed by a string. Only C keeps hold of WHICH key was passed, so getField(product, 'name') returns string and getField(product, 'id') returns number."}
      />

      <h3>The same mechanism with number: (typeof ARR)[number]</h3>

      <CodeBlock language="typescript" title="✅ Deriving a literal union from a runtime array">
{`const VIEWS = ['browse', 'cart', 'favorites'] as const;

type ViewFirst = (typeof VIEWS)[0];        // 'browse'  — one specific index
type View      = (typeof VIEWS)[number];   // 'browse' | 'cart' | 'favorites'

// Exactly the same logic as keyof T. Indexing with the whole 'number' type means
// "any possible index", so TypeScript must give an answer valid for every index —
// the union of every element. "Cover every possibility since we do not know which
// specific one" is the recurring theme behind keyof T, T[keyof T] and this.

// Why this shape and not an enum or a duplicated union:
//   VIEWS is real runtime data (you will map over it to render tabs).
//   The type is derived from it, so the two can never drift apart.
//   Put VIEWS in constants.ts; types.ts derives, never duplicates the list.`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          BOUNDARIES — unknown, any, predicates
      ══════════════════════════════════════════════════ */}
      <h2>Boundaries — Where any Leaks In and Type Predicates Plug It</h2>

      <h3>JSON.parse returns any, and any is contagious</h3>

      <p>
        <code>JSON.parse</code> is typed <code>{'(text: string): any'}</code> in TypeScript's own standard library —
        not <code>unknown</code>. This is a known wart: the signature predates <code>unknown</code> existing as a
        feature and was never changed for backwards-compatibility reasons. You do not opt into this; it comes with
        calling the function.
      </p>

      <CodeBlock language="typescript" title="❌ The silent version — zero errors, and that IS the bug">
{`interface Product { id: number; name: string }

export function readProducts(key: string): Product[] {
  const raw = window.localStorage.getItem(key);
  if (raw == null) return [];
  const parsed = JSON.parse(raw);   // parsed: any
  return parsed;                     // any is assignable to Product[] — no complaint
}

export const first = readProducts('products')[0].name.toUpperCase();

// tsc --strict --noEmit
// (no output — zero errors)`}
      </CodeBlock>

      <p>
        Nothing was verified. The return annotation <code>{'Promise<Product[]>'}</code> or{' '}
        <code>{'Product[]'}</code> is a promise <em>you</em> are making about the data, not something TypeScript
        checked. If storage holds <code>{'[42]'}</code>, that <code>.name.toUpperCase()</code> throws at runtime with
        the type system having said nothing. And because <strong>any branch of a function that can return{' '}
        <code>any</code> collapses the whole inferred return type to <code>any</code></strong>, the damage does not
        stay local.
      </p>

      <p>Contain it at the source, in one line:</p>

      <CodeBlock language="typescript" title="✅ Annotate the parse result as unknown — TS2322 immediately">
{`export function readProducts(key: string): Product[] {
  const raw = window.localStorage.getItem(key);
  if (raw == null) return [];
  const parsed: unknown = JSON.parse(raw);   // ← contain the leak here
  return parsed;
}

// error TS2322: Type 'unknown' is not assignable to type 'Product[]'.`}
      </CodeBlock>

      <p>
        This is legal (<code>any</code> is assignable to anything, including a narrower-looking annotation) and it
        converts "untyped and unchecked" into "untyped but <em>must</em> be checked before use". One line, and now
        the compiler is on your side again.
      </p>

      <h3>localStorage.getItem returns string | null</h3>

      <CodeBlock language="typescript" title="❌ Forgetting the null — TS2345">
{`const raw = window.localStorage.getItem(key);
const parsed = JSON.parse(raw);

// error TS2345: Argument of type 'string | null' is not assignable to parameter of type 'string'.
//   Type 'null' is not assignable to type 'string'.

// localStorage is a flat string store. null specifically means "this key does not exist".
// ✅ Narrow it, and every line after the check sees plain 'string':
if (raw == null) return initialValue;
const parsed: unknown = JSON.parse(raw);`}
      </CodeBlock>

      <p>
        Also worth knowing at runtime: <code>JSON.parse</code> legitimately returns primitives —{' '}
        <code>JSON.parse(&apos;42&apos;)</code> is <code>42</code> — and <strong>throws</strong> a{' '}
        <code>SyntaxError</code> when the string is not valid JSON at all. Corrupted storage, an older app version's
        format, someone editing devtools. That is why the whole block belongs in a{' '}
        <code>try / catch</code> that falls back to the initial value.
      </p>

      <h3>Type predicates — item is T</h3>

      <p>
        You have a <code>unknown</code> value and a runtime check that proves what it is. A plain{' '}
        <code>boolean</code>-returning function does <strong>not</strong> connect the two:
      </p>

      <CodeBlock language="typescript" title="❌ Boolean return — the check runs but nothing narrows — TS18046">
{`function isStringPlain(x: unknown): boolean {
  return typeof x === 'string';
}

export function example(val: unknown) {
  if (isStringPlain(val)) {
    return val.toUpperCase();
  }
  return '';
}

// error TS18046: 'val' is of type 'unknown'.`}
      </CodeBlock>

      <p>
        Same runtime logic, same <code>typeof</code> check — but with <code>boolean</code> as the return type,
        TypeScript has no way to connect "this returned true" to "therefore narrow the argument". The predicate is
        the only thing that wires a runtime check to compile-time narrowing.
      </p>

      <CodeBlock language="typescript" title="✅ Type predicate — the same function, one changed return type">
{`function isString(x: unknown): x is string {
  return typeof x === 'string';
}

function example(val: unknown) {
  // val: unknown here — .toUpperCase() is blocked
  if (isString(val)) {
    val.toUpperCase();   // val: string here ✅
  }
  // val: unknown again out here — the guarantee only held inside the if
}

// The syntax 'paramName is SomeType' can appear in exactly ONE place:
// the return type slot of a function signature. Not a variable type,
// not a property type. Special-purpose syntax for exactly this one job.

// A more useful one — validating parsed JSON:
function isFavoritesArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((n) => typeof n === 'number');
}`}
      </CodeBlock>

      <p>Wired into a generic hook, the predicate is what keeps <code>T</code> flowing through every branch:</p>

      <CodeBlock language="typescript" title="✅ useLocalStorageState — every branch returns T, no any anywhere">
{`export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  validate: (item: unknown) => item is T,
): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return initialValue;           // branch 1 → T
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) return initialValue;     // branch 2 → T
    return parsed;                                   // branch 3 → parsed is narrowed to T
  } catch {
    return initialValue;                             // branch 4 → T
  }
}

// Trace the narrowing on 'return parsed':
//   If validate(parsed) is false, the function already returned on the line above.
//   So the ONLY way execution reaches 'return parsed' is when the predicate held.
//   Control-flow analysis sees that, and narrows parsed from unknown to T
//   on that line specifically — hover it on the JSON.parse line and it is
//   still unknown; hover it on the return and it is T.`}
      </CodeBlock>

      <InfoBox variant="warning" title="The honest caveat — a predicate is an assertion you are responsible for">
        <p>TypeScript does <strong>not</strong> verify that the body of <code>isFavoritesArray</code> actually checks for a <code>number[]</code>. You could write <code>{'return true;'}</code> and it would compile. <code>x is T</code> is in the same family as <code>as</code> and <code>!</code> — you are telling the compiler something it cannot check.</p>
        <p>What makes it <em>better</em> than a bare <code>as</code> is that it ties that trust to a function whose entire job is to inspect the value at runtime, and it can express <strong>failure</strong>. A converter shaped <code>{'(item: unknown) => T'}</code> cannot — it must always return something claimed to be <code>T</code>, so its implementation ends up being <code>{'return item as T'}</code>, an unchecked cast wearing a function costume. The boolean-plus-predicate shape is what lets the fallback branch exist at all.</p>
        <p>Remember why this matters: TypeScript's checks are 100% real at compile time and 100% <strong>erased</strong> at runtime. A predicate is how you manually reintroduce a real runtime check at the exact seam where the static guarantee stops.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          TYPE HONESTY
      ══════════════════════════════════════════════════ */}
      <h2>Type Honesty at the Boundary</h2>

      <p>
        A type is a claim about what actually arrives. Two ways to break that claim, both of which compile:
      </p>

      <CodeBlock language="typescript" title="❌ Under-claiming — throwing away information you already have">
{`// The API always returns string[] for GET /api/categories.
type Categories = unknown[];

// unknown[] is not "safe", it is uninformative. Every consumer now has to
// narrow a value whose type you already knew, and none of them can call
// .toLowerCase() or render it without a cast.

// ✅ Say what arrives
type Categories = string[];

// Same category of mistake:
status: string;   // ❌ when the API only ever sends three specific values
status: 'in_stock' | 'low_stock' | 'out_of_stock';   // ✅ literal union
tags: string[] | [];   // ❌ redundant — string[] already includes []
tags: string[];        // ✅`}
      </CodeBlock>

      <CodeBlock language="typescript" title="❌ Over-claiming — a lie that compiles and returns NaN">
{`interface Product { name: string; discount: number }   // the API sends null sometimes

declare const p: Product;
export const half = p.discount * 0.5;

// tsc --strict --noEmit
// (no output — zero errors, and at runtime null * 0.5 is NaN)`}
      </CodeBlock>

      <CodeBlock language="typescript" title="✅ Honest type — the compiler now forces the null check — TS18047">
{`interface Product { name: string; discount: number | null }

export function formatPrice(price: number, discount: number | null): string {
  return (price * (1 - discount)).toFixed(2);
}

// error TS18047: 'discount' is possibly 'null'.

// ✅ Handle it — and note that narrowing, not '!', is the fix
export function formatPrice(price: number, discount: number | null): string {
  const applied = discount == null ? price : price * (1 - discount);
  return applied.toFixed(2);
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="null vs undefined at an HTTP boundary">
        <p>JSON has <code>null</code>. It has no <code>undefined</code>. Data crossing the network uses <code>null</code> to mean "explicitly no value", so domain types describing API payloads should use <code>null</code> too. <code>undefined</code> is for "this field was not set" inside your own code. Consistency matters more than which one is technically nicer — pick one per project and hold it.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          OVER-TYPING VS UNDER-TYPING
      ══════════════════════════════════════════════════ */}
      <h2>Over-Typing vs Under-Typing — Annotate the Boundaries, Infer the Interior</h2>

      <p>
        <strong>Type where data enters your code. Let inference carry it through.</strong> Think of it as pipes: you
        weld the openings, not the middle. Annotating every local variable is welding fittings inside the pipe.
        Forgetting the openings lets water out as <code>any</code>.
      </p>

      <CodeBlock language="typescript" title="Boundaries — always annotate">
{`// Domain model — the shape of an entity in your system
export interface Product { id: number; name: string; discount: number | null }

// API response — external data entering on the network
export async function getProducts(): Promise<Product[]> { ... }

// Function parameters — data entering a function
function formatPrice(price: number, discount: number | null): string { ... }

// Component props — data entering from the parent
type FilterBarProps = { categories: string[] };
export function FilterBar({ categories }: FilterBarProps) { ... }

// Reducer state, action AND return type — the contract, all three
function apiReducer(state: ApiState, action: ApiAction): ApiState { ... }

// Context value — declared once, propagates to every consumer
const FilterContext = createContext<FilterContextValue | null>(null);

// useState where the initial value does not say enough
const [user, setUser]   = useState<User | null>(null);  // else inferred as null
const [items, setItems] = useState<Product[]>([]);      // else inferred as never[]

// Custom hook signature — a public contract
export function useApi<T>(fetcher: () => Promise<T>): ApiResult<T> { ... }`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Interior — do not annotate">
{`// ✗ Redundant — useApi's return type already carries all of this
const productsQuery: ApiResult<Products> = useApi(getProducts, []);
const productsQuery = useApi(getProducts, []);           // ✓

// ✗ Redundant — types flow through the destructure
const { data, error, loading }: ApiResult<Product[]> = productsQuery;
const { data, error, loading } = productsQuery;          // ✓

// ✗ Redundant — useContext infers from where createContext declared it
const ctx: FilterContextValue | null = useContext(FilterContext);
const ctx = useContext(FilterContext);                   // ✓

// ✗ Redundant — TS knows Product[] from products
const filtered: Product[] = products.filter(p => p.status === 'in_stock');
const filtered = products.filter(p => p.status === 'in_stock');  // ✓

// ✗ Noise on a small private helper — nobody consumes it as a contract
function double(n: number): number { return n * 2; }
function double(n: number) { return n * 2; }             // ✓

// ✗ Obvious literals
const name: string = 'Tanner';
const name = 'Tanner';                                    // ✓`}
      </CodeBlock>

      <InfoBox variant="question" title="The two questions — ask them before every annotation">
        <p><strong>1. "Is data coming INTO this function / component / hook from outside?"</strong><br/>
        Yes → type the entry point. That is a boundary.<br/>
        No → skip it.</p>
        <p><strong>2. "Am I computing something from data that is already typed?"</strong><br/>
        Yes → let TypeScript infer. An annotation here is noise.<br/>
        No → you are probably at another boundary. Type it.</p>
        <p><strong>The delete-and-check heuristic:</strong> delete the annotation and hover the value. Same type as before → it was noise, leave it deleted. Worse type (<code>any</code>, <code>never</code>, <code>null</code>) → it was doing work, put it back.</p>
      </InfoBox>

      <InfoBox variant="danger" title="Under-typing is the more expensive direction">
        <p>Over-typing costs readability. Under-typing costs safety, silently. <code>function reducer(state, action)</code> and <code>{'function FilterBar({ categories })'}</code> both compile happily without <code>noImplicitAny</code> and give you nothing. If you only have the attention for one pass, spend it on the boundaries.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          erasableSyntaxOnly
      ══════════════════════════════════════════════════ */}
      <h2>erasableSyntaxOnly — Why enum Is Off the Table</h2>

      <p>
        <code>erasableSyntaxOnly</code> (TypeScript 5.8+) allows only syntax that erases to nothing at runtime,
        which is what makes a file safe for Node's native type stripping and for Vite's transpile-only dev server.
        It bans <code>enum</code>, <code>namespace</code>, and constructor parameter properties, because all three
        emit real JavaScript.
      </p>

      <CodeBlock language="typescript" title="❌ enum under erasableSyntaxOnly — TS1294">
{`export enum Status {
  InStock = 'in_stock',
  LowStock = 'low_stock',
}

// error TS1294: This syntax is not allowed when 'erasableSyntaxOnly' is enabled.`}
      </CodeBlock>

      <CodeBlock language="typescript" title="✅ The replacement — literal union, plus as const when you need the values">
{`// If you only need the TYPE:
type Status = 'in_stock' | 'low_stock' | 'out_of_stock';

// If you also need the values at runtime (to map over, validate against, render):
const STATUSES = ['in_stock', 'low_stock', 'out_of_stock'] as const;
type Status = (typeof STATUSES)[number];   // 'in_stock' | 'low_stock' | 'out_of_stock'

STATUSES.map(s => <option key={s} value={s}>{s}</option>);  // real array at runtime ✅

// This is not a workaround — it is better than an enum:
//   • zero runtime cost when you only need the type
//   • a plain string at runtime, so it compares and serialises the way you expect
//   • no enum/string assignability weirdness
//   • one source of truth: the array is the data, the type is derived from it

// If the constant is only ever used inside 'typeof X' in a file, the import
// can be type-only — typeof X is fully erased and needs no runtime value:
import { type STATUSES } from './constants';`}
      </CodeBlock>

      {/* ══════════════════════════════════════════════════
          SMALL SLIPS
      ══════════════════════════════════════════════════ */}
      <h2>Small Slips That Cost Real Time</h2>

      <p>
        None of these are conceptually hard. All of them produce an error message that does not obviously name the
        fix, which is what makes them expensive. Every code below is real <code>tsc</code> output.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>The slip</th>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>Real error</th>
              <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left' }}>Fix</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "const foo = bar(): SomeType",
                "TS1005: ',' expected.",
                "Annotations for variables go on the LEFT: const foo: SomeType = bar()",
              ],
              [
                "import type ApiResult from './types'",
                'TS2613: Module \'"types"\' has no default export. Did you mean to use \'import { ApiResult } from "types"\' instead?',
                "Named export needs braces: import type { ApiResult } from './types'",
              ],
              [
                'type X = REDUCER_STATES.FETCH_START',
                "TS2503: Cannot find namespace 'REDUCER_STATES'.",
                "A value expression is not a type. Bridge it: typeof REDUCER_STATES.FETCH_START — or just use the literal 'FETCH_START'",
              ],
              [
                'type Bad = ApiResult<>',
                "TS2314: Generic type 'ApiResult' requires 1 type argument(s).  /  TS1099: Type argument list cannot be empty.",
                'Supply the argument: ApiResult<Product[]>',
              ],
              [
                'JSX written in a .ts file',
                "TS1161: Unterminated regular expression literal.",
                "The < is being parsed as JS, not JSX. Rename the file to .tsx",
              ],
              [
                'Reducer with no return type annotation',
                "TS2322: Type 'boolean' is not assignable to type 'true'. (surfacing at the call site, not the reducer)",
                'Annotate it: function apiReducer(state, action): ApiState — the return type is the contract',
              ],
              [
                'tags: string[] | []',
                '(none — it compiles)',
                'Redundant. string[] already includes the empty array. Just string[]',
              ],
              [
                'type filterState = { ... }',
                '(none — it compiles)',
                'Types, interfaces and components are PascalCase. Functions and hooks are camelCase. Constant string values are UPPER_SNAKE',
              ],
            ].map(([slip, err, fix], i) => (
              <tr key={i}>
                <td style={{ border: '1px solid #555', padding: '8px' }}><code>{slip}</code></td>
                <td style={{ border: '1px solid #555', padding: '8px' }}><code>{err}</code></td>
                <td style={{ border: '1px solid #555', padding: '8px' }}>{fix}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfoBox variant="warning" title="The dev server is not a type check">
        <p><code>npm run dev</code> (Vite) does <strong>not</strong> type-check — it strips types for speed, so broken TypeScript still runs in the browser. <code>tsc -b</code> is the truth, and it is what CI will run. "It works in the browser" never means "the types are correct". Wire <code>vite-plugin-checker</code> in if you want the two to agree while you work.</p>
      </InfoBox>

      {/* ══════════════════════════════════════════════════
          REACT 19
      ══════════════════════════════════════════════════ */}
      <InfoBox variant="note" title="React 19 TypeScript Changes">
        <p><strong>ref as a regular prop:</strong> React 19 makes <code>ref</code> a normal prop — no more <code>forwardRef</code> wrapper. Add <code>{'ref?: React.Ref<HTMLDivElement>'}</code> directly to your props interface.</p>
        <p><strong>use() hook:</strong> <code>use(promise)</code> correctly infers the resolved type — <code>{'use(Promise<User>)'}</code> returns <code>User</code>, not <code>{'Promise<User>'}</code>.</p>
        <p><strong>useActionState:</strong> <code>{'useActionState<State, Payload>(fn, initial)'}</code> — both the state shape and action payload are fully typed.</p>
      </InfoBox>

    </LessonLayout>
  );
}
