import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Migration() {
  return (
    <LessonLayout
      title={"Migration Guide (JS \u2192 TS)"}
      sectionId="typescript"
      lessonIndex={6}
      prev={{ path: '/typescript/react', label: 'React + TypeScript' }}
      next={{ path: '/typescript/bestpractices', label: 'Best Practices & Pitfalls' }}
    >
      {/* ── 1. Migration Strategies Overview ── */}
      <h2>Migration Strategies Overview</h2>
      <p>
        There are two broad approaches to migrating a JavaScript codebase to
        TypeScript: <strong>Big Bang</strong> and <strong>Incremental</strong>.
        Big Bang converts every file at once. Incremental converts one file at a
        time while keeping the app shippable.
      </p>
      <FlowChart
        chart={
          "graph TD\n" +
          "A[Start Migration] --> B{Choose Strategy}\n" +
          "B -->|Big Bang| C[Convert All Files at Once]\n" +
          "C --> D[Fix All Type Errors]\n" +
          "D --> E[Single Large PR]\n" +
          "E --> F[High Risk - Merge Conflicts]\n" +
          "B -->|Incremental| G[Convert One File at a Time]\n" +
          "G --> H[Add Types Gradually]\n" +
          "H --> I[Small Reviewable PRs]\n" +
          "I --> J[Low Risk - Ship Continuously]"
        }
      />
      <InfoBox variant="warning" title="Avoid Big Bang Migrations">
        Big Bang conversions create massive pull requests that are difficult to
        review, prone to merge conflicts, and block other work. The incremental
        approach lets your team ship features while migrating. Always prefer
        incremental migration for production applications.
      </InfoBox>

      {/* ── 2. Incremental Migration Approach ── */}
      <h2>Incremental Migration Approach</h2>
      <p>Follow these steps in order for a smooth migration:</p>
      <ol>
        <li>
          <strong>Install TypeScript</strong> and configure <code>tsconfig.json</code> with
          <code>allowJs: true</code> so JS and TS files coexist.
        </li>
        <li>
          <strong>Rename files</strong> from <code>.js</code> to <code>.tsx</code> one
          at a time. Start with leaf components that have no dependents.
        </li>
        <li>
          <strong>Add basic types</strong> &mdash; props interfaces, state types,
          and return types for simple functions.
        </li>
        <li>
          <strong>Enable strict checks gradually</strong> &mdash; begin with
          <code>noImplicitAny</code>, then add <code>strictNullChecks</code>.
        </li>
        <li>
          <strong>Add type definitions</strong> for third-party libraries
          via <code>@types/*</code> packages.
        </li>
        <li><strong>Convert utilities and shared code</strong> for maximum leverage.</li>
        <li><strong>Convert complex components and hooks</strong> last.</li>
        <li>
          <strong>Enable full strict mode</strong> in <code>tsconfig.json</code> once
          every file is converted.
        </li>
      </ol>

      {/* ── 3. Initial Setup ── */}
      <h2>Initial Setup</h2>
      <p>Install TypeScript and the React type definitions:</p>
      <CodeBlock
        language="bash"
        title="Install Dependencies"
        code={"npm install --save-dev typescript @types/react @types/react-dom\nnpx tsc --init"}
      />
      <p>
        Configure <code>tsconfig.json</code> for a gradual migration. The key
        is <code>allowJs: true</code> so existing JavaScript files keep working:
      </p>
      <CodeBlock
        language="json"
        title={"tsconfig.json \u2014 Migration-Friendly Config"}
        code={
          '{\n' +
          '  "compilerOptions": {\n' +
          '    "target": "ES2020",\n' +
          '    "module": "ESNext",\n' +
          '    "moduleResolution": "bundler",\n' +
          '    "jsx": "react-jsx",\n' +
          '    "allowJs": true,\n' +
          '    "checkJs": false,\n' +
          '    "strict": false,\n' +
          '    "noImplicitAny": false,\n' +
          '    "esModuleInterop": true,\n' +
          '    "skipLibCheck": true,\n' +
          '    "forceConsistentCasingInFileNames": true,\n' +
          '    "outDir": "./dist"\n' +
          '  },\n' +
          '  "include": ["src/**/*"],\n' +
          '  "exclude": ["node_modules", "dist"]\n' +
          '}'
        }
      />

      {/* ── 4. File-by-File Migration Example ── */}
      <h2>File-by-File Migration Example</h2>
      <p>
        Here is a React component before and after migration. Study the
        differences &mdash; each change is annotated in the TypeScript version.
      </p>
      <h3>Before &mdash; JavaScript</h3>
      <CodeBlock
        language="jsx"
        title="UserProfile.jsx"
        code={
          "import { useState, useEffect } from 'react';\n\n" +
          "export default function UserProfile({ userId, onSave }) {\n" +
          "  const [user, setUser] = useState(null);\n" +
          "  const [loading, setLoading] = useState(true);\n" +
          "  const [error, setError] = useState(null);\n\n" +
          "  useEffect(() => {\n" +
          "    fetch('/api/users/' + userId)\n" +
          "      .then(res => res.json())\n" +
          "      .then(data => { setUser(data); setLoading(false); })\n" +
          "      .catch(err => { setError(err.message); setLoading(false); });\n" +
          "  }, [userId]);\n\n" +
          "  const handleNameChange = (e) => {\n" +
          "    setUser({ ...user, name: e.target.value });\n" +
          "  };\n\n" +
          "  const handleSubmit = (e) => {\n" +
          "    e.preventDefault();\n" +
          "    onSave(user);\n" +
          "  };\n\n" +
          "  if (loading) return <p>Loading...</p>;\n" +
          "  if (error) return <p>Error: {error}</p>;\n\n" +
          "  return (\n" +
          "    <form onSubmit={handleSubmit}>\n" +
          "      <input value={user.name} onChange={handleNameChange} />\n" +
          "      <button type=\"submit\">Save</button>\n" +
          "    </form>\n" +
          "  );\n" +
          "}"
        }
      />
      <h3>After &mdash; TypeScript</h3>
      <CodeBlock
        language="tsx"
        title="UserProfile.tsx"
        code={
          "import { useState, useEffect, ChangeEvent, FormEvent } from 'react';\n\n" +
          "// 1. Define an interface for the data shape\n" +
          "interface User {\n" +
          "  id: number;\n" +
          "  name: string;\n" +
          "  email: string;\n" +
          "}\n\n" +
          "// 2. Define props with an interface\n" +
          "interface UserProfileProps {\n" +
          "  userId: number;\n" +
          "  onSave: (user: User) => void;\n" +
          "}\n\n" +
          "export default function UserProfile({ userId, onSave }: UserProfileProps) {\n" +
          "  // 3. Generic type parameters for useState\n" +
          "  const [user, setUser] = useState<User | null>(null);\n" +
          "  const [loading, setLoading] = useState<boolean>(true);\n" +
          "  const [error, setError] = useState<string | null>(null);\n\n" +
          "  useEffect(() => {\n" +
          "    fetch('/api/users/' + userId)\n" +
          "      .then(res => res.json())\n" +
          "      .then((data: User) => { setUser(data); setLoading(false); })\n" +
          "      .catch((err: Error) => { setError(err.message); setLoading(false); });\n" +
          "  }, [userId]);\n\n" +
          "  // 4. Typed event handlers\n" +
          "  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {\n" +
          "    if (!user) return; // 5. Null guard required by strict mode\n" +
          "    setUser({ ...user, name: e.target.value });\n" +
          "  };\n\n" +
          "  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {\n" +
          "    e.preventDefault();\n" +
          "    if (!user) return;\n" +
          "    onSave(user);\n" +
          "  };\n\n" +
          "  if (loading) return <p>Loading...</p>;\n" +
          "  if (error) return <p>Error: {error}</p>;\n\n" +
          "  return (\n" +
          "    <form onSubmit={handleSubmit}>\n" +
          "      <input value={user?.name ?? ''} onChange={handleNameChange} />\n" +
          "      <button type=\"submit\">Save</button>\n" +
          "    </form>\n" +
          "  );\n" +
          "}"
        }
      />
      <InfoBox variant="info" title="Key Changes in the Migration">
        <strong>Interfaces</strong> were added for the data shape and component
        props. <strong>Event handlers</strong> received proper DOM event types.
        <strong>useState</strong> calls got generic type parameters. And
        <strong>null checks</strong> were added wherever the compiler requires them.
      </InfoBox>

      {/* ── 5. Handling `any` During Migration ── */}
      <h2>{"Handling \"any\" During Migration"}</h2>
      <p>
        Using <code>any</code> to silence errors is acceptable <em>temporarily</em>,
        but every usage should be tracked and replaced.
      </p>
      <CodeBlock
        language="typescript"
        title={"Progression: any \u2192 unknown \u2192 proper type"}
        code={
          "// Stage 1 — Quick migration, silence the error\n" +
          "const data: any = await fetchData();\n\n" +
          "// Stage 2 — Safer: forces you to narrow before use\n" +
          "const data: unknown = await fetchData();\n" +
          "if (typeof data === 'object' && data !== null) {\n" +
          "  // narrow further...\n" +
          "}\n\n" +
          "// Stage 3 — Fully typed\n" +
          "interface ApiResponse { users: User[]; total: number; }\n" +
          "const data: ApiResponse = await fetchData();"
        }
      />
      <InfoBox variant="warning" title={"Track Every \"any\" Usage"}>
        Add a <code>// TODO: type this properly</code> comment next to every
        temporary <code>any</code>. Enable the
        <code> @typescript-eslint/no-explicit-any</code> rule as a warning during
        migration and promote it to an error once complete.
      </InfoBox>

      {/* ── 6. Common Migration Gotchas ── */}
      <h2>Common Migration Gotchas</h2>

      <h3>Event Handler Types</h3>
      <CodeBlock
        language="tsx"
        title="Event Handler Typing"
        code={
          "// Problem: 'e' implicitly has type 'any'\n" +
          "const handleChange = (e) => setName(e.target.value);\n\n" +
          "// Fix: use the correct React event type\n" +
          "import { ChangeEvent } from 'react';\n" +
          "const handleChange = (e: ChangeEvent<HTMLInputElement>) => {\n" +
          "  setName(e.target.value);\n" +
          "};"
        }
      />

      <h3>Null / Undefined Strictness</h3>
      <CodeBlock
        language="tsx"
        title="Null Checks"
        code={
          "// Problem: Object is possibly 'null'\n" +
          "const user = users.find(u => u.id === id);\n" +
          "console.log(user.name); // Error!\n\n" +
          "// Fix: guard against null\n" +
          "const user = users.find(u => u.id === id);\n" +
          "if (!user) throw new Error('User not found');\n" +
          "console.log(user.name); // OK — narrowed"
        }
      />

      <h3>Third-Party Libraries Without Types</h3>
      <CodeBlock
        language="typescript"
        title="Custom Type Shim — declarations.d.ts"
        code={
          "// Create src/declarations.d.ts\n" +
          "declare module 'untyped-lib' {\n" +
          "  export function doSomething(input: string): string;\n" +
          "  export default function init(): void;\n" +
          "}"
        }
      />

      <h3>Enum vs Union Type</h3>
      <CodeBlock
        language="typescript"
        title="Prefer Union Types Over Enums"
        code={
          "// Enum — adds runtime code, can cause bundle bloat\n" +
          "enum Status { Active = 'ACTIVE', Inactive = 'INACTIVE' }\n\n" +
          "// Union type — zero runtime cost, same safety\n" +
          "type Status = 'ACTIVE' | 'INACTIVE';"
        }
      />

      <h3>defaultProps Deprecation</h3>
      <CodeBlock
        language="tsx"
        title={"Default Props \u2014 Before and After"}
        code={
          "// Deprecated pattern\n" +
          "function Button({ label, variant }) { /* ... */ }\n" +
          "Button.defaultProps = { variant: 'primary' };\n\n" +
          "// Modern pattern — JS default parameters\n" +
          "interface ButtonProps {\n" +
          "  label: string;\n" +
          "  variant?: 'primary' | 'secondary';\n" +
          "}\n" +
          "function Button({ label, variant = 'primary' }: ButtonProps) {\n" +
          "  /* ... */\n" +
          "}"
        }
      />

      {/* ── 7. Creating Custom Type Declarations ── */}
      <h2>Creating Custom Type Declarations</h2>
      <p>
        When no <code>@types</code> package exists, create a <code>.d.ts</code> file:
      </p>
      <CodeBlock
        language="typescript"
        title="src/types/untyped-lib.d.ts"
        code={
          "declare module 'untyped-lib' {\n" +
          "  export interface Config {\n" +
          "    apiKey: string;\n" +
          "    timeout?: number;\n" +
          "  }\n" +
          "  export function initialize(config: Config): void;\n" +
          "  export function getData<T>(endpoint: string): Promise<T>;\n" +
          "  export default class Client {\n" +
          "    constructor(config: Config);\n" +
          "    fetch<T>(url: string): Promise<T>;\n" +
          "  }\n" +
          "}"
        }
      />

      {/* ── 8. Vite + TypeScript Setup ── */}
      <h2>Vite + TypeScript Setup</h2>
      <CodeBlock language="bash" title="Create a Vite + React + TS Project"
        code={"npm create vite@latest my-app -- --template react-ts\ncd my-app && npm install"} />
      <CodeBlock language="typescript" title="vite.config.ts"
        code={
          "import { defineConfig } from 'vite';\n" +
          "import react from '@vitejs/plugin-react';\n\n" +
          "export default defineConfig({\n" +
          "  plugins: [react()],\n" +
          "  server: { port: 3000 },\n" +
          "  build: { sourcemap: true, target: 'es2020' },\n" +
          "});"
        }
      />

      {/* ── 9. ESLint + TypeScript ── */}
      <h2>ESLint + TypeScript</h2>
      <CodeBlock language="bash" title="Install ESLint TS Plugins"
        code={"npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin"} />
      <CodeBlock language="json" title="ESLint Config Excerpt"
        code={
          '{\n' +
          '  "parser": "@typescript-eslint/parser",\n' +
          '  "parserOptions": { "project": "./tsconfig.json" },\n' +
          '  "plugins": ["@typescript-eslint"],\n' +
          '  "rules": {\n' +
          '    "@typescript-eslint/no-explicit-any": "warn",\n' +
          '    "@typescript-eslint/no-unused-vars": "error",\n' +
          '    "@typescript-eslint/consistent-type-imports": "warn",\n' +
          '    "@typescript-eslint/no-non-null-assertion": "warn"\n' +
          '  }\n' +
          '}'
        }
      />

      {/* ── 10. CI/CD Integration ── */}
      <h2>CI/CD Integration</h2>
      <p>
        Add <code>tsc --noEmit</code> to your CI pipeline to catch type errors
        without producing output files:
      </p>
      <CodeBlock
        language="yaml"
        title={"GitHub Actions \u2014 Type Check Step"}
        code={
          "name: CI\n" +
          "on: [push, pull_request]\n" +
          "jobs:\n" +
          "  typecheck:\n" +
          "    runs-on: ubuntu-latest\n" +
          "    steps:\n" +
          "      - uses: actions/checkout@v4\n" +
          "      - uses: actions/setup-node@v4\n" +
          "        with:\n" +
          "          node-version: 20\n" +
          "      - run: npm ci\n" +
          "      - run: npx tsc --noEmit\n" +
          "        name: TypeScript Type Check"
        }
      />
      <InfoBox variant="info" title="Catch Type Errors Before Merging">
        Running <code>tsc --noEmit</code> in CI ensures type errors never reach
        the main branch. This is critical during migration when developers may
        introduce <code>any</code> types or miss null checks. Pair it with ESLint
        for maximum coverage.
      </InfoBox>

      {/* ── 12. Large-Scale Migration Strategy ── */}
      <h2>Large-Scale Migration at Team Scale</h2>
      <p>
        Migrating a large codebase is as much a <strong>team coordination problem</strong> as it
        is a technical one. The best technical strategy fails if developers are converting files
        inconsistently, reintroducing <code>any</code> types, or working against each other.
      </p>

      <InfoBox variant="info" title="The Four-Phase Approach for Large Codebases">
        <ol style={{marginBottom: 0}}>
          <li><strong>Phase 1 — Infrastructure</strong>: Install TypeScript, set up tsconfig with <code>allowJs: true</code>, configure ESLint, add <code>tsc --noEmit</code> to CI. Zero files converted yet, but the toolchain is ready.</li>
          <li><strong>Phase 2 — Shared types and utilities</strong>: Convert API types, shared utilities, and constants first. These flow upward — every component that consumes them immediately gets benefit.</li>
          <li><strong>Phase 3 — Bottom-up component conversion</strong>: Convert leaf components (no dependencies) first, then move inward. Use the <code>@typescript-eslint/no-explicit-any</code> warning to track progress.</li>
          <li><strong>Phase 4 — Enforce and tighten</strong>: Flip <code>allowJs: false</code>, enable <code>strict: true</code>, promote <code>any</code> warnings to errors. No new JS files allowed.</li>
        </ol>
      </InfoBox>

      <CodeBlock
        language="json"
        title={"Phase 1 vs Phase 4 tsconfig.json"}
        code={
          '{\n' +
          '  "compilerOptions": {\n' +
          '    "allowJs": true,        // Phase 1: JS files still work\n' +
          '    "checkJs": false,       // Don\'t typecheck JS files yet\n' +
          '    "strict": false,        // Relax strictness during migration\n' +
          '    "noImplicitAny": false  // Allow implicit any temporarily\n' +
          '  }\n' +
          '}\n\n' +
          '// Phase 4 — full strictness\n' +
          '{\n' +
          '  "compilerOptions": {\n' +
          '    "allowJs": false,    // No JS files allowed anymore\n' +
          '    "strict": true,      // All strict checks enabled\n' +
          '    "noImplicitAny": true,\n' +
          '    "strictNullChecks": true,\n' +
          '    "noUncheckedIndexedAccess": true\n' +
          '  }\n' +
          '}'
        }
      />

      <h2>Tracking Migration Progress</h2>

      <InfoBox variant="tip" title="Ratchet Strategy — Never Go Backward">
        <p>
          Set a CI check that counts <code>any</code> usages or unconverted files and{' '}
          <strong>fails if the count increases</strong>. You don&apos;t have to reduce the count every
          PR — but you can never make it worse. This prevents regression while giving developers
          freedom to work on features without being blocked by unrelated migration work.
        </p>
      </InfoBox>

      <CodeBlock
        language="bash"
        title="Measure Migration Debt"
        code={
          '# Count remaining .js/.jsx files\n' +
          'find src -name "*.js" -o -name "*.jsx" | wc -l\n\n' +
          '# Count remaining "any" usages\n' +
          'grep -r ": any" src --include="*.ts" --include="*.tsx" | wc -l\n\n' +
          '# package.json scripts:\n' +
          '"type:check": "tsc --noEmit",\n' +
          '"type:count-any": "grep -r \': any\' src | wc -l"'
        }
      />

      {/* ── 13. Creating a Common TypeScript Component Library ── */}
      <h2>Creating a Common TypeScript Component Library</h2>
      <p>
        A shared component library gives your team a typed, versioned foundation — design system
        components, hooks, utilities, and API types shared across multiple apps. TypeScript makes
        this dramatically safer: callers get autocomplete, prop validation, and change detection
        when the library updates.
      </p>

      <CodeBlock
        language="bash"
        title="Shared Library Package Structure"
        code={
          'packages/\n' +
          '  ui/                    # Shared component library\n' +
          '    src/\n' +
          '      components/\n' +
          '        Button/\n' +
          '          Button.tsx\n' +
          '          Button.types.ts\n' +
          '          index.ts\n' +
          '      hooks/\n' +
          '        useDebounce.ts\n' +
          '      types/\n' +
          '        api.types.ts      # Shared API response types\n' +
          '      index.ts            # Root barrel export\n' +
          '    package.json\n' +
          '    tsconfig.json'
        }
      />

      <CodeBlock
        language="typescript"
        title="Library Component — Button.tsx with Full Types"
        code={
          "// Button.types.ts\n" +
          "export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';\n" +
          "export type ButtonSize = 'sm' | 'md' | 'lg';\n\n" +
          "export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {\n" +
          "  variant?: ButtonVariant;\n" +
          "  size?: ButtonSize;\n" +
          "  isLoading?: boolean;\n" +
          "  leftIcon?: React.ReactNode;\n" +
          "}\n\n" +
          "// Button.tsx\n" +
          "export function Button({\n" +
          "  variant = 'primary',\n" +
          "  size = 'md',\n" +
          "  isLoading = false,\n" +
          "  leftIcon,\n" +
          "  children,\n" +
          "  disabled,\n" +
          "  ...rest\n" +
          "}: ButtonProps) {\n" +
          "  return (\n" +
          "    <button {...rest} disabled={disabled || isLoading}\n" +
          "      data-variant={variant} data-size={size}>\n" +
          "      {leftIcon && <span>{leftIcon}</span>}\n" +
          "      {isLoading ? 'Loading...' : children}\n" +
          "    </button>\n" +
          "  );\n" +
          "}\n\n" +
          "// index.ts — barrel export\n" +
          "export { Button } from './components/Button/Button';\n" +
          "export type { ButtonProps, ButtonVariant } from './components/Button/Button.types';"
        }
      />

      <CodeBlock
        language="json"
        title="packages/ui/package.json — Library Package Config"
        code={
          '{\n' +
          '  "name": "@mycompany/ui",\n' +
          '  "main": "./dist/index.cjs",\n' +
          '  "module": "./dist/index.js",\n' +
          '  "types": "./dist/index.d.ts",\n' +
          '  "exports": {\n' +
          '    ".": {\n' +
          '      "import": "./dist/index.js",\n' +
          '      "require": "./dist/index.cjs",\n' +
          '      "types": "./dist/index.d.ts"\n' +
          '    }\n' +
          '  },\n' +
          '  "scripts": {\n' +
          '    "build": "tsup src/index.ts --format esm,cjs --dts"\n' +
          '  },\n' +
          '  "peerDependencies": { "react": ">=18" }\n' +
          '}'
        }
      />

      <h2>Sharing API Types Across the Stack</h2>

      <p>
        The highest-value use of a common library is sharing the <strong>API contract</strong> —
        the types that describe what the server sends and the client receives. When your Java
        backend&apos;s DTOs are mirrored as TypeScript types, both sides of the stack are type-safe
        and stay in sync.
      </p>

      <CodeBlock
        language="typescript"
        title="Shared API Contract Types"
        code={
          "// packages/ui/src/types/api.types.ts\n" +
          "export interface User {\n" +
          "  id: string;\n" +
          "  name: string;\n" +
          "  email: string;\n" +
          "  role: 'admin' | 'user' | 'viewer';\n" +
          "  createdAt: string;\n" +
          "}\n\n" +
          "export interface PaginatedResponse<T> {\n" +
          "  data: T[];\n" +
          "  total: number;\n" +
          "  page: number;\n" +
          "  pageSize: number;\n" +
          "  totalPages: number;\n" +
          "}\n\n" +
          "export interface ApiError {\n" +
          "  code: string;\n" +
          "  message: string;\n" +
          "  fields?: Record<string, string>;\n" +
          "}\n\n" +
          "export type ApiResult<T> =\n" +
          "  | { success: true; data: T }\n" +
          "  | { success: false; error: ApiError };"
        }
      />

      <h2>Monorepo Setup with Turborepo + TypeScript</h2>

      <CodeBlock
        language="bash"
        title="Create a TypeScript Monorepo"
        code={
          'npx create-turbo@latest my-workspace\n\n' +
          'my-workspace/\n' +
          '  apps/\n' +
          '    web/           # Main React app\n' +
          '    admin/         # Admin React app\n' +
          '  packages/\n' +
          '    ui/            # Shared component library\n' +
          '    api-types/     # Shared API types\n' +
          '    eslint-config/ # Shared ESLint config\n' +
          '    tsconfig/      # Shared tsconfig bases\n' +
          '  turbo.json'
        }
      />

      <CodeBlock
        language="json"
        title="packages/tsconfig/base.json — Shared TypeScript Base"
        code={
          '{\n' +
          '  "compilerOptions": {\n' +
          '    "target": "ES2020",\n' +
          '    "module": "ESNext",\n' +
          '    "moduleResolution": "bundler",\n' +
          '    "strict": true,\n' +
          '    "esModuleInterop": true,\n' +
          '    "skipLibCheck": true\n' +
          '  }\n' +
          '}\n\n' +
          '// packages/ui/tsconfig.json\n' +
          '{\n' +
          '  "extends": "@mycompany/tsconfig/base.json",\n' +
          '  "compilerOptions": {\n' +
          '    "jsx": "react-jsx",\n' +
          '    "declaration": true,\n' +
          '    "declarationDir": "./dist"\n' +
          '  },\n' +
          '  "include": ["src"]\n' +
          '}'
        }
      />

      <h2>Team Adoption Strategy</h2>

      <InfoBox variant="success" title="Making TypeScript Stick Across a Team">
        <ul style={{marginBottom: 0}}>
          <li>
            <strong>Start with types-only files</strong> — create <code>src/types/</code> with
            shared interfaces before converting components. Developers immediately see value with
            zero disruption.
          </li>
          <li>
            <strong>Designate TypeScript champions</strong> — one or two developers who review TS
            PRs for quality and mentor others. Prevents <code>any</code>-type sprawl from developers
            unfamiliar with TypeScript.
          </li>
          <li>
            <strong>Block new JS files in CI</strong> — once Phase 2 is done, add a CI check that
            fails if any <code>.js/.jsx</code> files are added. New code must be TypeScript.
          </li>
          <li>
            <strong>Use path aliases</strong> — configure <code>@/components</code>,{' '}
            <code>@/types</code>, <code>@/hooks</code> in tsconfig for cleaner imports.
          </li>
          <li>
            <strong>Write a <code>TYPESCRIPT.md</code></strong> — document team conventions: when
            to use <code>interface</code> vs <code>type</code>, how to handle API responses, how
            to type event handlers.
          </li>
        </ul>
      </InfoBox>

      <CodeBlock
        language="json"
        title="tsconfig.json — Path Aliases"
        code={
          '{\n' +
          '  "compilerOptions": {\n' +
          '    "baseUrl": ".",\n' +
          '    "paths": {\n' +
          '      "@/*": ["./src/*"],\n' +
          '      "@/components/*": ["./src/components/*"],\n' +
          '      "@/hooks/*": ["./src/hooks/*"],\n' +
          '      "@/types/*": ["./src/types/*"],\n' +
          '      "@/utils/*": ["./src/utils/*"]\n' +
          '    }\n' +
          '  }\n' +
          '}\n\n' +
          '// vite.config.ts — mirror aliases in the bundler\n' +
          'import path from \'path\';\n' +
          'export default defineConfig({\n' +
          '  resolve: {\n' +
          "    alias: { '@': path.resolve(__dirname, './src') },\n" +
          '  },\n' +
          '});'
        }
      />

      {/* ── 14. Migration Checklist ── */}
      <h2>Migration Checklist</h2>
      <InfoBox variant="success" title="Migration Complete Checklist">
        <ul>
          <li>All <code>.js</code> / <code>.jsx</code> files renamed to <code>.ts</code> / <code>.tsx</code></li>
          <li><code>allowJs</code> set to <code>false</code> in tsconfig</li>
          <li><code>strict: true</code> enabled with no errors</li>
          <li>Zero <code>any</code> types remaining (or exceptions documented)</li>
          <li>All third-party libraries have type definitions</li>
          <li><code>tsc --noEmit</code> passes in CI</li>
          <li>ESLint TypeScript rules enabled and passing</li>
          <li>Custom <code>.d.ts</code> shims reviewed for accuracy</li>
          <li>Shared API types extracted to common library</li>
          <li>Path aliases configured in tsconfig and bundler</li>
          <li>CI blocks new <code>.js</code> / <code>.jsx</code> files</li>
          <li>Team trained on TypeScript patterns and conventions</li>
          <li><code>TYPESCRIPT.md</code> conventions doc written</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
