import { useState } from 'react';
import { Sandpack } from '@codesandbox/sandpack-react';
import { useTheme } from './ThemeProvider';

interface Challenge {
  id: number;
  title: string;
  category: string;
  description: string;
  hint: string;
  template: 'vanilla-ts' | 'react-ts';
  files: Record<string, string>;
  height?: number;
}

const STRICT_TSCONFIG = `{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"]
}`;

const CATEGORY_COLORS: Record<string, string> = {
  'Fundamentals':       '#5b9cf6',
  'Interfaces':         '#a78bfa',
  'Type System':        '#f59e0b',
  'Generics':           '#34d399',
  'React + TypeScript': '#f472b6',
  'Real-World Patterns':'#60a5fa',
};

const CHALLENGES: Challenge[] = [
  {
    id: 1,
    title: 'Basic Type Annotations',
    category: 'Fundamentals',
    description: `In strict mode TypeScript errors when variables are declared without a value — it can't infer a type so it falls back to 'any', which noImplicitAny bans.

Task: Add explicit type annotations to the three variables and the three function parameters. No 'any' allowed. When all red squiggles are gone and the preview shows output, you're done.`,
    hint: 'Variables: let name: string  |  Function params: function greet(name: string, age: number): string  |  Hover each red squiggle to read the exact error.',
    template: 'vanilla-ts',
    files: {
      '/index.ts': `// TASK: Add type annotations to remove all implicit 'any' errors.
// Hover the red-underlined names to see the TypeScript error.

let userId;        // ← add ': number'
let username;      // ← add ': string'
let isAdmin;       // ← add ': boolean'

// All three parameters implicitly have type 'any' — fix them
function buildProfile(id, name, admin) {
  return \`[\${admin ? 'ADMIN' : 'USER'}] #\${id} — \${name}\`;
}

// Don't change below — this verifies your solution
userId   = 42;
username = "tanner";
isAdmin  = true;

const profile = buildProfile(userId, username, isAdmin);
document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = \`<p style="color:#4ade80">✅ \${profile}</p>\`;
console.log("✅ Output:", profile);
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 2,
    title: 'Define an Interface',
    category: 'Interfaces',
    description: `The function below accepts 'any', which removes all type safety — typos, wrong shapes, missing fields all go undetected.

Task:
1. Define a User interface with: id (number), name (string), email (string), role ('admin' | 'editor' | 'viewer')
2. Replace 'any' on the parameter with your interface
3. Uncomment the bad call at the bottom — after your fix, TypeScript should flag it as an error`,
    hint: "Interface syntax: interface User { id: number; name: string; ... }  |  For role, use a literal union: role: 'admin' | 'editor' | 'viewer'  |  'superuser' is not in that union, so the bad call will error.",
    template: 'vanilla-ts',
    files: {
      '/index.ts': `// TASK: Replace 'any' with a proper User interface.

// Step 1: Define your User interface here:


// Step 2: Replace 'any' below with your interface type
function displayUser(user: any): string {
  return \`\${user.name} <\${user.email}> — \${user.role.toUpperCase()}\`;
}

const result = displayUser({
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  role: "admin"
});

// Step 3: Uncomment this — after your fix it should show a TypeScript error
// (role: "superuser" is not in the union)
// displayUser({ id: 2, name: "Bob", email: "b@b.com", role: "superuser" });

document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = \`<p style="color:#4ade80">✅ \${result}</p>\`;
console.log("✅", result);
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 3,
    title: 'Interface + Class (OOP)',
    category: 'Interfaces',
    description: `TypeScript interfaces work exactly like Java interfaces — a class that declares 'implements MyInterface' must provide ALL methods in that interface or TypeScript errors.

The Logger class below implements Loggable but is missing one required method. Find it and add it.`,
    hint: "Compare the Loggable interface methods with what Logger provides. The missing method should: reset this.history to [], then console.log(\"Log cleared.\"). Match the signature from the interface exactly.",
    template: 'vanilla-ts',
    files: {
      '/index.ts': `interface Loggable {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  clear(): void;  // ← Logger is missing this
}

// ❌ Error: Class 'Logger' incorrectly implements interface 'Loggable'
//    Property 'clear' is missing in type 'Logger' but required in 'Loggable'
class Logger implements Loggable {
  private history: string[] = [];

  log(message: string): void {
    this.history.push(\`[LOG] \${message}\`);
    console.log(\`[LOG] \${message}\`);
  }

  warn(message: string): void {
    this.history.push(\`[WARN] \${message}\`);
    console.warn(\`[WARN] \${message}\`);
  }

  error(message: string): void {
    this.history.push(\`[ERR] \${message}\`);
    console.error(\`[ERR] \${message}\`);
  }

  // TASK: Add the missing 'clear' method here.
  // Signature from the interface: clear(): void
  // Body: reset this.history to [], then console.log("Log cleared.")
}

const logger = new Logger();
logger.log("App started");
logger.warn("High memory");
logger.error("Disk full");
logger.clear();
logger.log("After clear — history is empty");

document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = '<p style="color:#4ade80">✅ Check the console output</p>';
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 4,
    title: 'Union Types',
    category: 'Type System',
    description: `The formatId function only accepts numbers, but real-world IDs often come as strings from external APIs (e.g., "USR-999").

Task:
1. Change 'id: number' to a union type: number | string
2. Add the string branch in the function body — if the string already has a "USR-" prefix return it as-is, otherwise prefix it`,
    hint: 'Union syntax: id: number | string  |  Use typeof id === "number" to narrow. The current return id; line errors because TypeScript thinks id might not be a string there — fix the logic so each branch returns a string.',
    template: 'vanilla-ts',
    files: {
      '/index.ts': `// TASK: Change the parameter type and add the string case.

function formatId(id: number): string {  // ← change to number | string
  if (typeof id === 'number') {
    return \`USR-\${id.toString().padStart(6, '0')}\`;
  }
  // TASK: add the string branch here:
  // - If id already starts with "USR-", return as-is
  // - Otherwise return \`USR-\${id}\`

  return id;  // ← this errors until the type and logic are both fixed
}

const a = formatId(42);          // "USR-000042"
const b = formatId("USR-999");   // "USR-999"
const c = formatId("123");       // "USR-123"

document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = [a, b, c]
  .map(v => \`<p style="color:#4ade80">✅ \${v}</p>\`)
  .join('');
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 5,
    title: 'Generic Functions',
    category: 'Generics',
    description: `These three functions do the exact same thing for three different types — grab the first element of an array and return it (or undefined if empty).

Task: Replace all three with ONE generic function called 'first<T>'. Then update the four calls below to use it. TypeScript infers T automatically from whatever array you pass — no manual type annotation needed at the call site.`,
    hint: "Generic syntax: function first<T>(arr: T[]): T | undefined { return arr[0]; }  |  After writing it, change firstNumber([...]) to first([...]) etc. TypeScript will infer T as number, string, boolean from context.",
    template: 'vanilla-ts',
    files: {
      '/index.ts': `// These three functions are identical except for the type.
// TASK: Replace them with one generic function, then update the calls.

function firstNumber(arr: number[]): number | undefined { return arr[0]; }
function firstString(arr: string[]): string | undefined { return arr[0]; }
function firstBool  (arr: boolean[]): boolean | undefined { return arr[0]; }

// TASK: Write your generic function here:
// function first<T>(arr: T[]): T | undefined { ... }


// Update these to call first(...) instead — delete the three typed functions above
// once 'first' works. TypeScript infers T automatically.
const num   = firstNumber([10, 20, 30]);
const str   = firstString(["a", "b", "c"]);
const bool  = firstBool([true, false]);
const empty = first<string>([]);  // ← this line errors until 'first' exists

document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = \`
  <p style="color:#4ade80">✅ num: \${num}</p>
  <p style="color:#4ade80">✅ str: \${str}</p>
  <p style="color:#4ade80">✅ bool: \${bool}</p>
  <p style="color:#4ade80">✅ empty: \${empty ?? 'undefined'}</p>
\`;
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 6,
    title: 'React Component Props',
    category: 'React + TypeScript',
    description: `The Button component's props are untyped — TypeScript treats them all as 'any', so passing wrong types or misspelling a prop won't be caught.

Task: Define a ButtonProps interface and apply it to the component.

Required props: label (string), onClick (() => void)
Optional props: variant ('primary' | 'danger' | 'ghost'), disabled (boolean)`,
    hint: "Define interface ButtonProps { ... } then change function Button(props) to function Button(props: ButtonProps) or destructure: function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps).",
    template: 'react-ts',
    height: 500,
    files: {
      '/App.tsx': `// TASK: Define ButtonProps and apply it to the Button component.
// Hover 'props' to see the implicit 'any' error.

// Step 1: Define ButtonProps interface here:


// ❌ Parameter 'props' implicitly has an 'any' type
function Button(props) {
  const bg =
    props.variant === 'danger' ? '#ef4444' :
    props.variant === 'ghost'  ? 'transparent' : '#6d28d9';

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      style={{
        padding: '8px 20px',
        background: bg,
        color: 'white',
        border: props.variant === 'ghost' ? '1px solid #6d28d9' : 'none',
        borderRadius: '6px',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.5 : 1,
        fontSize: '14px',
      }}
    >
      {props.label}
    </button>
  );
}

export default function App() {
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '24px', background: '#0f1120', minHeight: '100vh', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Button label="Save"   onClick={() => alert('saved!')} />
      <Button label="Delete" onClick={() => {}} variant="danger" />
      <Button label="Cancel" onClick={() => {}} variant="ghost" disabled />
      {/* After your fix, this should show a TypeScript error — 'primary2' is not in the union: */}
      {/* <Button label="Bad" onClick={() => {}} variant="primary2" /> */}
    </div>
  );
}
`,
    },
  },
  {
    id: 7,
    title: 'API Response Contract',
    category: 'Real-World Patterns',
    description: `The dashboard fetcher returns structured data typed as 'any' everywhere. That means typos in property names, accessing missing fields, and wrong assumptions about the shape are all invisible to TypeScript.

Task: Define interfaces that match the actual API response shape, then replace all 'any' usages — the function return type, the data variable, and the filter callback.`,
    hint: "You'll need three interfaces: one for the User object, one for a Post, and one for the full DashboardResponse. The function should return Promise<DashboardResponse>. The filter callback becomes (p: Post) => p.published.",
    template: 'vanilla-ts',
    files: {
      '/index.ts': `// The API returns this shape — define interfaces that match it:
// {
//   user:  { id: number, name: string, email: string },
//   posts: Array<{ id: number, title: string, published: boolean }>,
//   meta:  { total: number, page: number }
// }

// TASK: Define your interfaces here:


async function fetchDashboard(userId: number): Promise<any> {  // ← fix return type
  return {
    user:  { id: userId, name: "Alice", email: "alice@example.com" },
    posts: [
      { id: 1, title: "Hello World", published: true },
      { id: 2, title: "Draft post",  published: false },
      { id: 3, title: "TypeScript Tips", published: true },
    ],
    meta: { total: 3, page: 1 }
  };
}

async function main() {
  const data: any = await fetchDashboard(1);  // ← fix this type

  const greeting  = \`Welcome \${data.user.name}!\`;
  const published = data.posts.filter((p: any) => p.published);  // ← fix the 'any'
  const summary   = \`\${published.length}/\${data.meta.total} posts published\`;

  document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
  document.body.innerHTML = \`
    <p style="color:#4ade80">✅ \${greeting}</p>
    <p style="color:#94a3b8">\${summary}</p>
    <p style="color:#94a3b8">Page \${data.meta.page}</p>
  \`;
}

main();
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
  {
    id: 8,
    title: 'Type Narrowing (Discriminated Union)',
    category: 'Type System',
    description: `describePet receives a Pet — which could be a Dog or a Cat. Right now it can only safely return pet.name because TypeScript doesn't know which variant it is yet.

Both Dog and Cat have a 'kind' field — this is called a discriminated union. Use it to narrow the type and call the right describe function for each pet.`,
    hint: "Use if (pet.kind === 'dog') — inside that block TypeScript narrows pet to Dog, giving you access to .breed. Use else for the Cat case. TypeScript knows Pet is exhausted after both branches.",
    template: 'vanilla-ts',
    files: {
      '/index.ts': `interface Dog {
  kind:  'dog';
  name:  string;
  breed: string;
}

interface Cat {
  kind:   'cat';
  name:   string;
  indoor: boolean;
}

type Pet = Dog | Cat;

function describeDog(dog: Dog): string {
  return \`\${dog.name} is a \${dog.breed}\`;
}

function describeCat(cat: Cat): string {
  return \`\${cat.name} is \${cat.indoor ? 'an indoor' : 'an outdoor'} cat\`;
}

// TASK: Fix describePet — narrow pet.kind and call the right function.
// Right now it only returns pet.name. Trying to access pet.breed here
// errors because TypeScript doesn't know it's a Dog yet.
function describePet(pet: Pet): string {
  // Add narrowing here using pet.kind:

  return pet.name;  // ← replace this with narrowed calls to describeDog / describeCat
}

const pets: Pet[] = [
  { kind: 'dog', name: 'Rex',      breed: 'Labrador' },
  { kind: 'cat', name: 'Whiskers', indoor: true },
  { kind: 'dog', name: 'Max',      breed: 'Husky' },
  { kind: 'cat', name: 'Luna',     indoor: false },
];

document.body.style.cssText = 'background:#0f1120;padding:20px;font-family:monospace';
document.body.innerHTML = pets
  .map(p => \`<p style="color:#4ade80">✅ \${describePet(p)}</p>\`)
  .join('');
`,
      '/tsconfig.json': STRICT_TSCONFIG,
    },
  },
];

const STORAGE_KEY = 'ts-playground-completed';

function loadCompleted(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveCompleted(done: Set<number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]));
}

export default function TypeScriptPlayground() {
  const { theme } = useTheme();
  const [index, setIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(loadCompleted);

  const challenge = CHALLENGES[index];
  const isDone = completed.has(challenge.id);
  const categoryColor = CATEGORY_COLORS[challenge.category] ?? '#a78bfa';

  function markDone() {
    const next = new Set(completed);
    next.add(challenge.id);
    setCompleted(next);
    saveCompleted(next);
  }

  function markUndone() {
    const next = new Set(completed);
    next.delete(challenge.id);
    setCompleted(next);
    saveCompleted(next);
  }

  function goTo(i: number) {
    setIndex(i);
    setShowHint(false);
  }

  return (
    <div style={{ margin: '2rem 0' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px 12px 0 0',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.1rem' }}>⌨️</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            TypeScript Challenges
          </span>
          <span style={{
            background: categoryColor + '22',
            color: categoryColor,
            border: `1px solid ${categoryColor}55`,
            borderRadius: '999px',
            padding: '2px 10px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            {challenge.category}
          </span>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {CHALLENGES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => goTo(i)}
              title={`${i + 1}. ${c.title}`}
              style={{
                width: i === index ? '24px' : '10px',
                height: '10px',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                background: completed.has(c.id)
                  ? 'var(--accent-green)'
                  : i === index
                  ? 'var(--accent-purple)'
                  : 'var(--border-color)',
                transition: 'all 0.2s ease',
                padding: 0,
              }}
            />
          ))}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>
            {completed.size}/{CHALLENGES.length}
          </span>
        </div>
      </div>

      {/* Challenge body */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: 'none',
        padding: '1.25rem',
      }}>
        {/* Title + challenge number */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <span style={{ color: 'var(--accent-blue)', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'monospace' }}>
            #{challenge.id.toString().padStart(2, '0')}
          </span>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700 }}>
            {challenge.title}
          </h3>
          {isDone && (
            <span style={{ color: 'var(--accent-green)', fontSize: '0.85rem' }}>✅ completed</span>
          )}
        </div>

        {/* Description */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.9rem 1rem',
          marginBottom: '0.75rem',
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          lineHeight: 1.75,
          whiteSpace: 'pre-line',
        }}>
          {challenge.description}
        </div>

        {/* Hint toggle */}
        <button
          onClick={() => setShowHint(h => !h)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '4px 12px',
            color: 'var(--text-secondary)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            marginBottom: showHint ? '0.5rem' : '1rem',
            transition: 'border-color 0.15s',
          }}
        >
          {showHint ? '▾ hide hint' : '▸ show hint'}
        </button>

        {showHint && (
          <div style={{
            background: 'var(--accent-blue-bg)',
            border: '1px solid var(--accent-blue)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            color: 'var(--accent-blue)',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            💡 {challenge.hint}
          </div>
        )}
      </div>

      {/* Sandpack editor */}
      <div style={{ border: '1px solid var(--border-color)', borderTop: 'none' }}>
        <Sandpack
          key={`${challenge.id}-${theme}`}
          template={challenge.template}
          files={challenge.files}
          theme={theme}
          options={{
            editorHeight: challenge.height ?? 400,
            showLineNumbers: true,
            showInlineErrors: true,
            wrapContent: false,
            showConsole: true,
            showConsoleButton: true,
          }}
        />
      </div>

      {/* Footer nav */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px 16px',
            color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: index === 0 ? 'default' : 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ← Prev
        </button>

        <button
          onClick={isDone ? markUndone : markDone}
          style={{
            background: isDone ? 'var(--accent-green-bg)' : 'var(--bg-card)',
            border: `1px solid ${isDone ? 'var(--accent-green)' : 'var(--accent-purple)'}`,
            borderRadius: '8px',
            padding: '6px 20px',
            color: isDone ? 'var(--accent-green)' : 'var(--accent-purple)',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
        >
          {isDone ? '✅ Mark Incomplete' : '✓ Mark Complete'}
        </button>

        <button
          onClick={() => goTo(index + 1)}
          disabled={index === CHALLENGES.length - 1}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '6px 16px',
            color: index === CHALLENGES.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: index === CHALLENGES.length - 1 ? 'default' : 'pointer',
            fontSize: '0.85rem',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
