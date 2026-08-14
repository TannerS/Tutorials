import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
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
