import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FTMonorepos() {
  return (
    <LessonLayout
      title="Monorepos"
      sectionId="frontend-tooling"
      lessonIndex={3}
      prev={{ path: '/frontend-tooling/packages', label: 'Package Managers' }}
      next={{ path: '/frontend-tooling/performance', label: 'Bundle Performance' }}
    >
      <h2>What is a Monorepo?</h2>
      <p>
        A monorepo is a single repository containing multiple packages or applications. It enables code sharing,
        unified tooling, and atomic changes across related projects without the overhead of coordinating separate repos.
      </p>

      <FlowChart
        title="Monorepo Structure"
        chart={"graph TD\n  A[my-monorepo/] --> B[apps/]\n  A --> C[packages/]\n  B --> D[apps/web]\n  B --> E[apps/mobile]\n  B --> F[apps/api]\n  C --> G[packages/ui]\n  C --> H[packages/utils]\n  C --> I[packages/config]"}
      />

      <h2>Turborepo</h2>
      <p>
        Turborepo is the most popular monorepo build system for JavaScript/TypeScript projects.
        It caches build outputs locally and on remote caches to skip redundant work.
      </p>

      <CodeBlock language="bash" title="Creating a Turborepo">
{`# Create from scratch
npx create-turbo@latest my-monorepo

# Or add to existing project
npm install --save-dev turbo

# Project structure after scaffolding:
# my-monorepo/
# ├── apps/
# │   ├── web/          (Next.js or Vite app)
# │   └── docs/         (documentation site)
# ├── packages/
# │   ├── ui/           (shared React components)
# │   ├── eslint-config/ (shared ESLint config)
# │   └── typescript-config/ (shared tsconfig)
# ├── package.json
# ├── turbo.json
# └── pnpm-workspace.yaml`}
      </CodeBlock>

      <CodeBlock language="json" title="turbo.json — pipeline config">
{`{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // build deps first (^)
      "outputs": [".next/**", "dist/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true,
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**"]
    },
    "lint": {
      "cache": true,
      "inputs": ["src/**", "eslint.config.js"]
    },
    "dev": {
      "cache": false,         // never cache dev server
      "persistent": true      // long-running process
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    }
  },
  "globalEnv": ["NODE_ENV", "VERCEL_URL"]
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Running Turborepo tasks">
{`# Build all packages and apps (in correct dep order)
npx turbo build

# Run dev for all apps in parallel
npx turbo dev

# Run only for specific package
npx turbo build --filter=web
npx turbo build --filter=@myorg/ui...  # ui and all dependents

# Run only changed packages (vs main branch)
npx turbo build --filter=...[origin/main]

# Remote caching (share cache with team)
npx turbo login
npx turbo link`}
      </CodeBlock>

      <h2>Nx</h2>
      <p>
        Nx is a more opinionated and feature-rich alternative to Turborepo. It has stronger support for
        Angular, Next.js, and complex enterprise setups with code generation and plugins.
      </p>

      <CodeBlock language="bash" title="Nx basics">
{`# Create Nx workspace
npx create-nx-workspace@latest my-org

# Generate app or library
nx generate @nx/react:application my-app
nx generate @nx/react:library ui

# Run tasks
nx build my-app
nx test my-app
nx lint my-app

# Run for all affected by changes
nx affected:build
nx affected:test

# Project dependency graph
nx graph

# Cache hits (local and optional cloud)
nx reset   # clear cache`}
      </CodeBlock>

      <h2>Workspace Package Sharing</h2>

      <CodeBlock language="json" title="Shared UI package — packages/ui/package.json">
{`{
  "name": "@myorg/ui",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "peerDependencies": {
    "react": ">=18"
  },
  "devDependencies": {
    "typescript": "^5"
  }
}`}
      </CodeBlock>

      <CodeBlock language="typescript" title="Using workspace package in app">
{`// packages/ui/src/index.ts
export { Button } from './Button'
export { Input } from './Input'
export type { ButtonProps } from './Button'

// apps/web/package.json
{
  "dependencies": {
    "@myorg/ui": "workspace:*"   // pnpm workspace protocol
    // OR:  "*"                  // npm/yarn workspaces
  }
}

// apps/web/src/App.tsx
import { Button, Input } from '@myorg/ui'

function App() {
  return <Button onClick={() => {}}>Click me</Button>
}`}
      </CodeBlock>

      <h2>Shared Config Packages</h2>

      <CodeBlock language="javascript" title="packages/eslint-config/index.js">
{`// Shared ESLint config package
export default [
  {
    rules: {
      'no-console': 'warn',
      'prefer-const': 'error',
    }
  }
]

// packages/typescript-config/base.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}

// apps/web/tsconfig.json
{
  "extends": "@myorg/typescript-config/base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "outDir": "dist"
  },
  "include": ["src"]
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Turborepo vs Nx">
        <p>
          Choose <strong>Turborepo</strong> for simpler setups focused on caching task pipelines.
          Choose <strong>Nx</strong> for enterprise setups needing code generation, project graph analysis,
          and plugin ecosystem. Both support remote caching to share build artifacts across CI machines and developers.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question={"What does the ^ prefix mean in Turborepo's dependsOn configuration (e.g., \"^build\")?"}
        options={[
          "Run this task in all packages simultaneously",
          "Build this package's dependencies first before building this package",
          "Skip this task if there are no changes",
          "Run the task in the root workspace only"
        ]}
        correctIndex={1}
        explanation={"The ^ prefix means \"run this pipeline task in a package's dependencies first.\" So \"^build\" means: before building package A, first run the build task for all packages that A depends on. This ensures that when you build your app, all the workspace packages it imports are built first and their outputs are up-to-date."}
      />

      <InteractiveChallenge
        question="What is the main performance feature of Turborepo?"
        options={[
          "It runs all tasks in parallel using multiple CPU cores",
          "It caches task outputs and skips tasks when inputs have not changed",
          "It pre-compiles TypeScript to JavaScript before running",
          "It uses Rust for all build operations"
        ]}
        correctIndex={1}
        explanation="Turborepo's primary optimization is content-aware caching. It hashes all inputs (source files, env vars, dependencies) for a task. If the hash matches a previous run, it restores the outputs from cache and skips execution entirely. Combined with remote caching (Vercel or self-hosted), every CI run and every developer machine shares the same cache."
      />
    </LessonLayout>
  );
}
