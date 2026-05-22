import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function TsIntro() {
  return (
    <LessonLayout
      title="TypeScript Introduction"
      sectionId="typescript"
      lessonIndex={0}
      prev={null}
      next={{ path: '/typescript/types', label: 'TypeScript Types' }}
    >
      <h2>What Is TypeScript?</h2>
      <p>
        TypeScript is a statically-typed superset of JavaScript developed by Microsoft. It adds
        optional type annotations, interfaces, generics, and tooling that catch bugs at compile
        time rather than runtime. TypeScript compiles to plain JavaScript with zero runtime overhead.
      </p>

      <FlowChart
        title="TypeScript Development Flow"
        chart={"graph LR\n  A[Write .ts / .tsx] --> B[tsc or esbuild]\n  B --> C{Type Errors?}\n  C -- Yes --> D[Fix in editor]\n  D --> A\n  C -- No --> E[JavaScript .js]\n  E --> F[Browser or Node.js]"}
      />

      <CodeBlock language="typescript" title="The Problem TypeScript Solves">
{`// WITHOUT TYPESCRIPT — bug discovered at runtime
function formatName(user) {
  return user.firstName + ' ' + user.lastName;
}
const result = formatName({ first: 'Alice', last: 'Smith' });
// → "undefined undefined" — no warning, ships to production

// WITH TYPESCRIPT — bug caught before code runs
interface User {
  firstName: string;
  lastName: string;
}
function formatName(user: User): string {
  return user.firstName + ' ' + user.lastName;
}
const result = formatName({ first: 'Alice', last: 'Smith' });
// Error: 'first' does not exist in type 'User'. Did you mean 'firstName'?

// What TypeScript gives you:
// 1. Autocomplete — editor knows every object's shape
// 2. Refactoring safety — rename a field, compiler finds all usages
// 3. Documentation — types ARE the docs, always in sync with code
// 4. Onboarding — new devs understand API contracts immediately
// 5. Bug prevention — ~15% of JS bugs are type errors (Microsoft data)`}
      </CodeBlock>

      <h2>Structural Typing</h2>
      <p>
        TypeScript uses <strong>structural typing</strong> — types are compatible if they have the
        same shape. This is unlike Java/C# which require explicit <code>implements</code> declarations.
      </p>

      <CodeBlock language="typescript" title="Structural Typing — Shape Matters, Not Name">
{`interface Point2D { x: number; y: number; }
interface Vector2D { x: number; y: number; }

function drawPoint(p: Point2D) { console.log(p.x, p.y); }

const v: Vector2D = { x: 3, y: 4 };
drawPoint(v); // ✓ Works — same shape as Point2D

// Even works with extra properties (when assigned first):
const extended = { x: 1, y: 2, z: 3, label: 'origin' };
drawPoint(extended); // ✓ Extra properties fine when via variable

// Excess property check applies to object literals directly:
drawPoint({ x: 1, y: 2, z: 3 }); // ✗ Error — only in direct call

// Classes are structurally compatible too:
class Dog { name: string; constructor(n: string) { this.name = n; } bark() {} }
class Cat { name: string; constructor(n: string) { this.name = n; } meow() {} }
// Dog and Cat are NOT compatible — different shapes (bark vs meow)
// In Java: both could implement Animal interface explicitly`}
      </CodeBlock>

      <h2>TypeScript vs JavaScript Side by Side</h2>

      <CodeBlock language="typescript" title="Same Function: JS vs TS">
{`// JAVASCRIPT — no hints for caller, silent bugs possible
async function fetchUser(id) {
  const res = await fetch('/api/users/' + id);
  if (!res.ok) throw new Error('Not found');
  return await res.json();
}
const user = await fetchUser(1);
user.fullNme; // typo — undefined at runtime, no warning

// TYPESCRIPT — self-documenting, editor-verified
interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

async function fetchUser(id: number): Promise<ApiUser> {
  const res = await fetch('/api/users/' + id);
  if (!res.ok) throw new Error('Not found');
  return res.json() as ApiUser;
}

const user = await fetchUser(1);
user.fullNme;   // Error: Property 'fullNme' does not exist on type 'ApiUser'
user.firstName; // ✓ Autocomplete lists all fields`}
      </CodeBlock>

      <h2>Setting Up TypeScript</h2>

      <CodeBlock language="bash" title="Installation and Configuration">
{`# Install TypeScript compiler
npm install --save-dev typescript

# Generate tsconfig.json with defaults
npx tsc --init

# Type-check without emitting files (use in CI)
npx tsc --noEmit

# Start a new React + TypeScript project with Vite (recommended)
npm create vite@latest my-app -- --template react-ts
cd my-app && npm install && npm run dev
# Vite uses esbuild to transpile (fast), tsc for type checking`}
      </CodeBlock>

      <CodeBlock language="json" title="Essential tsconfig.json Settings">
{`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",

    // Enable ALL strict checks — catches the most bugs
    "strict": true,
    // Expands to these individual flags:
    // "noImplicitAny": true        — no untyped params
    // "strictNullChecks": true     — handle null/undefined explicitly
    // "strictFunctionTypes": true  — check function param types
    // "strictPropertyInitialization": true — class props must init

    "esModuleInterop": true,      // import React from 'react'
    "skipLibCheck": true,         // faster — skip .d.ts type checking

    // Path aliases (update vite.config.ts too!)
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}`}
      </CodeBlock>

      <h2>Type Inference — Less Typing Than You Think</h2>

      <CodeBlock language="typescript" title="When TypeScript Infers Types Automatically">
{`// You DON'T need to annotate everything — TS infers from values
const name = 'Alice';            // inferred: string
const age = 30;                  // inferred: number
const scores = [95, 87, 92];     // inferred: number[]
const config = { port: 3000, host: 'localhost' }; // inferred object

// Functions — return type inferred from return statement
function add(a: number, b: number) {
  return a + b; // inferred return: number
}

// DO annotate:
// 1. Function parameters — TS can't infer from callers
// 2. When inferred type is too broad (string vs 'admin' | 'user')
// 3. Exported public APIs

// Example — annotate the API boundary, let TS infer the rest:
export function createUser(name: string, role: 'admin' | 'user') {
  const user = { name, role, createdAt: new Date() }; // inferred
  return user; // inferred: { name: string; role: 'admin'|'user'; createdAt: Date }
}

// Type assertions (use sparingly — bypass the type checker)
const input = document.getElementById('name') as HTMLInputElement;
input.value; // ✓ TS now knows it's an input, not generic Element`}
      </CodeBlock>

      <InfoBox variant="warning" title="TypeScript Myths vs Reality">
        <p>
          <strong>Myth: "TypeScript slows you down."</strong> You spend 10% more time writing but save
          30%+ debugging. The ROI is positive after the first sprint.<br /><br />
          <strong>Myth: "You need to type everything."</strong> TypeScript infers most types. Only annotate
          function parameters and exported APIs.<br /><br />
          <strong>Myth: "TypeScript prevents all bugs."</strong> It prevents type errors (~15% of bugs).
          Logic bugs still require tests.<br /><br />
          <strong>Myth: "It's only for large teams."</strong> Solo projects benefit enormously from
          IDE autocomplete and refactoring safety.
        </p>
      </InfoBox>

      <CodeBlock language="typescript" title="Gradual Adoption for Existing Projects">
{`// Option 1: @ts-check in individual .js files (zero setup)
// @ts-check
// @ts-ignore (suppress specific line)
// @ts-expect-error (expect and require an error)

// Option 2: JSDoc types (types without .ts files)
/**
 * @param {string} name
 * @param {'admin' | 'user'} role
 * @returns {{ name: string; role: string; id: string }}
 */
function createUser(name, role) {
  return { name, role, id: crypto.randomUUID() };
}

// Option 3: allowJs + incremental migration
// tsconfig.json:
{
  "compilerOptions": {
    "allowJs": true,         // process .js files
    "checkJs": false,        // don't type-check .js yet
    "strict": false          // start lenient, tighten later
  }
}
// Rename files one by one: util.js → util.ts
// Fix errors as you go — each file is a small commit`}
      </CodeBlock>

      <InteractiveChallenge
        question="What happens to TypeScript type annotations when code runs in the browser?"
        options={[
          "They are enforced at runtime by a TypeScript virtual machine",
          "They are completely erased — only plain JavaScript runs",
          "They are stored as metadata in a global __types__ object",
          "They become JavaScript class definitions"
        ]}
        correctIndex={1}
        explanation="TypeScript is a compile-time tool only. The compiler checks types and then erases all type annotations, producing plain JavaScript. No TypeScript-specific code runs in the browser — the output is identical to handwritten JavaScript. This means zero runtime overhead and full compatibility with any JavaScript environment."
      />

      <InteractiveChallenge
        question="What does TypeScript's structural typing mean in practice?"
        options={[
          "Two types must explicitly declare that one extends the other",
          "Two types are compatible if they have the same properties and shapes",
          "TypeScript enforces class hierarchies like Java",
          "All types must be declared in a central .d.ts file"
        ]}
        correctIndex={1}
        explanation="Structural typing means TypeScript checks the shape of objects, not their declared names. If object A has all the properties that type B requires, then A is assignable to B — even if A was never declared to implement B. This is how TypeScript embraces JavaScript's duck-typing nature while still providing compile-time safety. It contrasts with nominal typing in Java/C# where you must explicitly write 'implements MyInterface'."
      />
    </LessonLayout>
  );
}
