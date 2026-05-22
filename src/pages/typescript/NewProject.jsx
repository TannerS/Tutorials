import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NewProject() {
  return (
    <LessonLayout
      title="New Project from Scratch"
      sectionId="typescript"
      lessonIndex={8}
      prev={{ path: '/typescript/bestpractices', label: 'Best Practices & Pitfalls' }}
      next={{ path: '/typescript/tsconfig', label: 'tsconfig Mastery' }}
    >
      <p>
        Starting a React + TypeScript project from absolute scratch. No guessing,
        no outdated blog posts &mdash; just the exact commands, files, and
        configuration you need to ship production code on day one.
      </p>

      <FlowChart
        title="New Project Decision Flow"
        chart={"graph TD\n  A[Starting a new project] --> B{Need SSR/SSG?}\n  B -->|Yes| C[Next.js + TypeScript]\n  B -->|No| D{SPA or Library?}\n  D -->|SPA| E[Vite + react-ts template]\n  D -->|Library| F[Vite library mode or tsup]\n  E --> G[npm create vite@latest]\n  C --> H[npx create-next-app@latest --ts]\n  F --> I[Configure for dual ESM/CJS]"}
      />

      {/* ── Section 1: Creating the Project ──────────────────────── */}
      <h2>1. Creating the Project</h2>

      <h3>Recommended: Vite + React + TypeScript</h3>
      <p>
        Vite is the modern standard. It uses esbuild for dev (instant HMR) and
        Rollup for production builds. One command:
      </p>

      <CodeBlock language="bash" title="Create a new Vite React+TS project">
{`npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev`}
      </CodeBlock>

      <InfoBox variant="tip" title="What that command does">
        <code>npm create vite@latest</code> runs the <code>create-vite</code> package.
        The <code>--</code> separates npm args from Vite args.
        <code>--template react-ts</code> scaffolds a React project with TypeScript
        pre-configured &mdash; tsconfig, Vite plugin, .tsx files, all ready.
      </InfoBox>

      <h3>Alternative: Create React App (Legacy)</h3>
      <CodeBlock language="bash" title="CRA &mdash; not recommended for new projects">
{`npx create-react-app my-app --template typescript`}
      </CodeBlock>
      <p>
        CRA is in maintenance mode. It uses Webpack (slow), has no active
        development, and the React team no longer recommends it. Use Vite instead.
      </p>

      <h3>Alternative: Next.js with TypeScript</h3>
      <CodeBlock language="bash" title="Next.js &mdash; when you need SSR/SSG">
{`npx create-next-app@latest my-app --typescript --tailwind --eslint --app
cd my-app
npm run dev`}
      </CodeBlock>

      <h3>Generated File Tree (Vite react-ts)</h3>
      <CodeBlock language="bash" title="What Vite creates for you">
{`my-app/
├── index.html              # Entry HTML (Vite uses this as entry point)
├── package.json            # Dependencies & scripts
├── tsconfig.json           # Root TS config (references app + node)
├── tsconfig.app.json       # TS config for your app source code
├── tsconfig.node.json      # TS config for Node-side files (vite.config.ts)
├── vite.config.ts          # Vite configuration
├── eslint.config.js        # ESLint flat config
├── public/
│   └── vite.svg            # Static assets (served as-is)
└── src/
    ├── App.tsx             # Root component
    ├── App.css             # Component styles
    ├── main.tsx            # Entry point (renders App into DOM)
    ├── index.css           # Global styles
    ├── vite-env.d.ts       # Type declarations for Vite features
    └── assets/
        └── react.svg       # Importable assets`}
      </CodeBlock>

      <h3>Walking Through Every Generated File</h3>

      <CodeBlock language="typescript" title="vite.config.ts &mdash; Vite configuration">
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  // Enables JSX transform + Fast Refresh
})`}
      </CodeBlock>

      <CodeBlock language="json" title="tsconfig.json &mdash; Root config (just references)">
{`{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="tsconfig.app.json &mdash; Your app source config">
{`{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"]
}`}
      </CodeBlock>

      <CodeBlock language="json" title="tsconfig.node.json &mdash; Config for vite.config.ts">
{`{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["vite.config.ts"]
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/vite-env.d.ts &mdash; Vite type declarations">
{`/// <reference types="vite/client" />

// This single line gives you types for:
// - import.meta.env (VITE_* environment variables)
// - Asset imports (importing .svg, .png, .css files)
// - Hot Module Replacement API (import.meta.hot)`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/main.tsx &mdash; App entry point">
{`import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The "!" is a non-null assertion: we KNOW #root exists in index.html`}
      </CodeBlock>

      {/* ── Section 2: Project Structure ─────────────────────────── */}
      <h2>2. Project Structure Best Practices</h2>

      <CodeBlock language="bash" title="Recommended folder structure">
{`src/
├── components/        # Reusable UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Modal/
├── pages/             # Route-level page components
│   ├── Home.tsx
│   └── Dashboard.tsx
├── hooks/             # Custom React hooks
│   ├── useAuth.ts
│   └── useDebounce.ts
├── services/          # API calls & external integrations
│   ├── api.ts         # Axios/fetch instance
│   └── userService.ts
├── types/             # Shared type definitions
│   ├── user.ts
│   └── api.ts
├── utils/             # Pure utility functions
│   ├── formatDate.ts
│   └── validation.ts
├── context/           # React context providers
│   └── AuthContext.tsx
├── assets/            # Images, fonts, icons
├── styles/            # Global CSS/SCSS
└── App.tsx`}
      </CodeBlock>

      <h3>Where to Put Types: Co-located vs Centralized</h3>

      <InfoBox variant="info" title="Co-located types (recommended for most projects)">
        Put types next to the code that uses them. A component&apos;s props interface
        lives in the same file. A service&apos;s request/response types live in the
        service file. Only extract to <code>types/</code> when a type is shared
        across 3+ unrelated files.
      </InfoBox>

      <CodeBlock language="typescript" title="Co-located: types live with their component">
{`// src/components/UserCard/UserCard.tsx
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
  onEdit: (id: string) => void;
}

export function UserCard({ name, email, avatar, onEdit }: UserCardProps) {
  // ...
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Centralized: shared types in types/ folder">
{`// src/types/user.ts — used by UserCard, UserList, UserService, AuthContext
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: User['role'];
}`}
      </CodeBlock>

      <h3>Barrel Exports (index.ts)</h3>
      <CodeBlock language="typescript" title="src/components/Button/index.ts">
{`// Barrel export — allows: import { Button } from './components/Button'
export { Button } from './Button';
export type { ButtonProps } from './Button';

// DO NOT barrel-export entire directories in large projects:
// export * from './UserCard';   // <-- hurts tree-shaking & IDE perf
// export * from './Modal';`}
      </CodeBlock>

      <h3>File Naming Conventions</h3>
      <CodeBlock language="bash" title="Naming rules">
{`# Components: PascalCase
src/components/UserCard.tsx
src/components/PaymentForm.tsx

# Hooks: camelCase, prefixed with "use"
src/hooks/useAuth.ts
src/hooks/useDebounce.ts

# Utils: camelCase
src/utils/formatDate.ts
src/utils/parseQuery.ts

# Types: camelCase (matches the domain)
src/types/user.ts
src/types/apiResponse.ts

# Tests: same name + .test
src/components/UserCard.test.tsx
src/hooks/useAuth.test.ts`}
      </CodeBlock>

      {/* ── Section 3: Essential Configuration ───────────────────── */}
      <h2>3. Essential Configuration</h2>

      <h3>ESLint + TypeScript (Flat Config)</h3>
      <CodeBlock language="javascript" title="eslint.config.js &mdash; Complete React+TS setup">
{`import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Add your team rules:
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
)`}
      </CodeBlock>

      <h3>Prettier Config</h3>
      <CodeBlock language="json" title=".prettierrc">
{`{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}`}
      </CodeBlock>

      <h3>Path Aliases &mdash; BOTH Files Need It</h3>
      <InfoBox variant="warning" title="Path aliases require TWO configs">
        TypeScript needs path aliases in <code>tsconfig.app.json</code> for
        type checking. Vite needs them in <code>vite.config.ts</code> for
        bundling. Miss either one and it breaks.
      </InfoBox>

      <CodeBlock language="json" title="tsconfig.app.json &mdash; Add paths">
{`{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@hooks/*": ["./src/hooks/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="vite.config.ts &mdash; Add resolve aliases">
{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    },
  },
})`}
      </CodeBlock>

      <h3>VS Code Settings</h3>
      <CodeBlock language="json" title=".vscode/settings.json">
{`{
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  }
}`}
      </CodeBlock>

      {/* ── Section 4: Essential Packages ────────────────────────── */}
      <h2>4. Essential Packages to Install</h2>

      <CodeBlock language="bash" title="Complete stack install commands">
{`# Routing
npm install react-router-dom

# State management (pick one)
npm install zustand              # Simple, minimal boilerplate
npm install @reduxjs/toolkit react-redux  # Full-featured, enterprise

# Forms
npm install react-hook-form zod  # zod for schema validation
npm install @hookform/resolvers  # Connects zod to react-hook-form

# HTTP
npm install axios                # Or use native fetch with typed wrappers

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom

# Dev tools
npm install -D @types/node       # For path aliases in vite.config.ts`}
      </CodeBlock>

      <CodeBlock language="json" title="package.json scripts to add">
{`{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
  }
}`}
      </CodeBlock>

      {/* ── Section 5: Your First Component ──────────────────────── */}
      <h2>5. Your First Component (TypeScript)</h2>

      <CodeBlock language="typescript" title="src/types/user.ts &mdash; Shared types">
{`export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/services/userService.ts &mdash; Typed API">
{`import type { User, ApiResponse } from '@/types/user';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(\`\${API_BASE}/users\`);
  if (!response.ok) {
    throw new Error(\`Failed to fetch users: \${response.status}\`);
  }
  const json: ApiResponse<User[]> = await response.json();
  return json.data;
}

export async function fetchUserById(id: string): Promise<User> {
  const response = await fetch(\`\${API_BASE}/users/\${id}\`);
  if (!response.ok) {
    throw new Error(\`User not found: \${id}\`);
  }
  const json: ApiResponse<User> = await response.json();
  return json.data;
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/hooks/useUsers.ts &mdash; Typed custom hook">
{`import { useState, useEffect } from 'react';
import type { User } from '@/types/user';
import { fetchUsers } from '@/services/userService';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return { users, loading, error, refetch: load };
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/context/AuthContext.tsx &mdash; Typed context">
{`import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, _password: string) => {
    // Replace with real API call
    const mockUser: User = {
      id: '1', name: 'Dev User', email, role: 'admin', createdAt: new Date().toISOString()
    };
    setUser(mockUser);
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="src/components/UserCard.tsx &mdash; Typed component">
{`import type { User } from '@/types/user';

interface UserCardProps {
  user: User;
  onSelect?: (user: User) => void;
  variant?: 'compact' | 'full';
  children?: React.ReactNode;
}

export function UserCard({ user, onSelect, variant = 'compact', children }: UserCardProps) {
  return (
    <div className={\`user-card user-card--\${variant}\`} onClick={() => onSelect?.(user)}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {variant === 'full' && <span className="role-badge">{user.role}</span>}
      {children}
    </div>
  );
}`}
      </CodeBlock>

      <InteractiveChallenge
        question={"When using Vite path aliases like @/components, which files must BOTH be updated?"}
        options={[
          "tsconfig.json and package.json",
          "tsconfig.app.json and vite.config.ts",
          "vite.config.ts and .eslintrc",
          "tsconfig.json and index.html"
        ]}
        correctIndex={1}
        explanation={"TypeScript uses tsconfig paths for type checking and Vite uses resolve.alias for bundling. Both must be configured or imports will fail at either type-check time or build time."}
      />

      {/* ── Section 6: Common First-Day Issues ───────────────────── */}
      <h2>6. Common First-Day Issues</h2>

      <h3>Cannot find module for images/SVGs</h3>
      <CodeBlock language="typescript" title="src/vite-env.d.ts &mdash; Add asset declarations">
{`/// <reference types="vite/client" />

// If you still get errors for specific file types, add:
declare module '*.svg' {
  import type { FC, SVGProps } from 'react';
  const content: FC<SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}`}
      </CodeBlock>

      <h3>Event Handler Types</h3>
      <CodeBlock language="typescript" title="Common React event types you will need">
{`// Input change
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value);
}

// Form submit
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  // ...
}

// Button click
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  // ...
}

// Keyboard
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === 'Enter') { /* ... */ }
}

// Select change
function handleSelect(e: React.ChangeEvent<HTMLSelectElement>) {
  console.log(e.target.value);
}`}
      </CodeBlock>

      <h3>Ref Types</h3>
      <CodeBlock language="typescript" title="Typing useRef correctly">
{`import { useRef, useEffect } from 'react';

// DOM ref — initialize with null, type the element
const inputRef = useRef<HTMLInputElement>(null);
const divRef = useRef<HTMLDivElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Mutable ref (stores a value, not a DOM element)
const intervalRef = useRef<number | null>(null);
const prevValueRef = useRef<string>('');  // no null needed if you give initial

useEffect(() => {
  // TypeScript knows inputRef.current might be null
  inputRef.current?.focus();
}, []);`}
      </CodeBlock>

      <h3>Third-Party Libs Without Types</h3>
      <CodeBlock language="typescript" title="When @types/package does not exist">
{`// Option 1: Check if types exist
// npm install -D @types/some-library

// Option 2: Declare the module yourself (src/types/declarations.d.ts)
declare module 'untyped-library' {
  export function doSomething(input: string): string;
  export default function init(config: Record<string, unknown>): void;
}

// Option 3: Quick escape hatch (least safe)
declare module 'totally-untyped-lib';
// This types everything as "any" — use only as last resort`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never suppress errors with // @ts-ignore">
        If you cannot type something, use <code>// @ts-expect-error</code> instead.
        It will warn you when the error is fixed, so you can remove the suppression.
        <code>@ts-ignore</code> silently hides errors forever.
      </InfoBox>

      <InteractiveChallenge
        question={"What is the correct type for useRef when referencing an HTML input element?"}
        options={[
          "useRef<HTMLElement>(null)",
          "useRef<InputElement>(null)",
          "useRef<HTMLInputElement>(null)",
          "useRef<React.Input>(null)"
        ]}
        correctIndex={2}
        explanation={"DOM refs use the specific HTML element type. HTMLInputElement gives you access to .value, .checked, .focus() etc. The generic HTMLElement would work but loses input-specific properties."}
      />

      <h2>Quick Start Checklist</h2>
      <InfoBox variant="success" title="Your project is ready when you can...">
        <ul>
          <li>Run <code>npm run dev</code> and see the app</li>
          <li>Import with path aliases: <code>import {'{ Button }'} from &apos;@/components/Button&apos;</code></li>
          <li>Run <code>npm run lint</code> with zero warnings</li>
          <li>Run <code>npm test</code> and see green</li>
          <li>See full IntelliSense on all your custom types in VS Code</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
