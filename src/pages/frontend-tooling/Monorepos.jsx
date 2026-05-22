import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Monorepos() {
  return (
    <LessonLayout
      title="Monorepo Strategies"
      sectionId="frontend-tooling"
      lessonIndex={3}
      prev={{ path: '/frontend-tooling/packages', label: 'Package Managers' }}
      next={{ path: '/frontend-tooling/performance', label: 'Bundle Analysis & Performance' }}
    >
      <h2>What Is a Monorepo?</h2>
      <p>
        A monorepo is a single repository that contains multiple projects — apps,
        libraries, services — that may or may not be related. It's not a monolith:
        each project is independently deployable, but they share tooling, config,
        and can import from each other without publishing to npm.
      </p>

      <FlowChart
        title="Monorepo vs Polyrepo"
        chart={"graph TD\n  subgraph Polyrepo\n    A[web-app repo] -->|npm publish| D[shared-ui v1.2.3]\n    B[mobile-app repo] -->|npm install| D\n    C[admin-app repo] -->|npm install| D\n  end\n  subgraph Monorepo\n    E[apps/web-app] -->|direct import| H[libs/shared-ui]\n    F[apps/mobile-app] -->|direct import| H\n    G[apps/admin-app] -->|direct import| H\n  end"}
      />

      <h3>Why Monorepos?</h3>
      <ul>
        <li><strong>Atomic changes</strong> — Update a shared library and all consumers in a single PR</li>
        <li><strong>Code sharing</strong> — Import utilities, types, and components directly</li>
        <li><strong>Consistent tooling</strong> — One ESLint config, one TypeScript config, one CI pipeline</li>
        <li><strong>Simplified dependencies</strong> — No version matrix across repos</li>
        <li><strong>Better code review</strong> — See the full impact of a change in one diff</li>
      </ul>

      <InfoBox variant="info" title="Who Uses Monorepos?">
        Google (all code in one repo), Meta, Microsoft, Uber, Airbnb, and most large
        frontend teams. The React repo itself is a monorepo (react, react-dom,
        react-reconciler are all packages in one repo).
      </InfoBox>

      <h2>NX Overview</h2>
      <p>
        NX is a build system and monorepo tool built by Nrwl. It adds project graph
        awareness, computation caching, affected commands, and code generators on
        top of your existing toolchain.
      </p>

      <FlowChart
        title="NX Architecture"
        chart={"graph TD\n  A[nx.json Config] --> B[Project Graph]\n  B --> C{What Changed?}\n  C --> D[Affected Projects]\n  D --> E[Run Tasks]\n  E --> F{Cache Hit?}\n  F -->|Yes| G[Replay Output]\n  F -->|No| H[Execute + Cache Result]"}
      />

      <h3>Key NX Concepts</h3>

      <CodeBlock language="bash" title="Core NX Commands">
{`# Run a target for a specific project
npx nx build my-app
npx nx test shared-ui
npx nx lint admin-app

# Run only affected projects (based on git diff)
npx nx affected -t build
npx nx affected -t test
npx nx affected -t lint

# Visualize the project dependency graph
npx nx graph

# Generate a new React library
npx nx g @nx/react:library shared-ui --directory=libs/shared-ui

# Generate a new React component
npx nx g @nx/react:component Button --project=shared-ui

# Clear the cache
npx nx reset`}
      </CodeBlock>

      <CodeBlock language="json" title="nx.json">
{`{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*"],
    "production": [
      "default",
      "!{projectRoot}/**/*.spec.ts",
      "!{projectRoot}/**/*.test.ts"
    ]
  },
  "defaultBase": "main"
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="NX Caching Is a Superpower">
        NX hashes the inputs (source files, dependencies, env) for every task. If the
        hash matches a previous run, it replays the cached output instantly. With NX
        Cloud, this cache is shared across your entire team and CI — if your teammate
        already built it, you get the result in milliseconds.
      </InfoBox>

      <h2>Turborepo Overview</h2>
      <p>
        Turborepo is Vercel's monorepo tool. It focuses on task orchestration and
        caching with a simpler mental model than NX. It's package-based (each
        package.json is a project) rather than using a project graph config.
      </p>

      <CodeBlock language="json" title="turbo.json">
{`{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "cache": true
    },
    "lint": {
      "cache": true
    },
    "dev": {
      "persistent": true,
      "cache": false
    }
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Turborepo Commands">
{`# Run build across all packages (respects dependency order)
npx turbo build

# Run tests only for changed packages
npx turbo test --filter=...[HEAD^1]

# Run dev for a specific app and its dependencies
npx turbo dev --filter=web-app

# Remote caching with Vercel
npx turbo login
npx turbo link`}
      </CodeBlock>

      <h2>NX vs Turborepo</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Feature</th>
            <th style={{ padding: '0.75rem' }}>NX</th>
            <th style={{ padding: '0.75rem' }}>Turborepo</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Learning curve</td>
            <td style={{ padding: '0.75rem' }}>Steeper — more concepts</td>
            <td style={{ padding: '0.75rem' }}>Gentle — just turbo.json</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Code generation</td>
            <td style={{ padding: '0.75rem' }}>Built-in generators</td>
            <td style={{ padding: '0.75rem' }}>None built-in</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Project graph</td>
            <td style={{ padding: '0.75rem' }}>Visual + interactive</td>
            <td style={{ padding: '0.75rem' }}>Basic</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Plugin ecosystem</td>
            <td style={{ padding: '0.75rem' }}>Rich (React, Angular, Node)</td>
            <td style={{ padding: '0.75rem' }}>Minimal</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '0.75rem' }}>Remote caching</td>
            <td style={{ padding: '0.75rem' }}>NX Cloud</td>
            <td style={{ padding: '0.75rem' }}>Vercel Remote Cache</td>
          </tr>
          <tr>
            <td style={{ padding: '0.75rem' }}>Best for</td>
            <td style={{ padding: '0.75rem' }}>Large enterprise teams</td>
            <td style={{ padding: '0.75rem' }}>Small to mid-size projects</td>
          </tr>
        </tbody>
      </table>

      <h2>pnpm Workspaces</h2>

      <CodeBlock language="yaml" title="pnpm-workspace.yaml">
{`packages:
  - 'apps/*'
  - 'libs/*'
  - 'packages/*'`}
      </CodeBlock>

      <CodeBlock language="json" title="Root package.json">
{`{
  "name": "@myorg/monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "test": "turbo test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}`}
      </CodeBlock>

      <h2>Monorepo Folder Structure</h2>

      <CodeBlock language="bash" title="Typical Monorepo Layout">
{`my-monorepo/
├── apps/
│   ├── web-app/           # Main React SPA
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── admin-app/         # Admin dashboard
│   │   ├── src/
│   │   └── package.json
│   └── api-server/        # Express/Fastify backend
│       ├── src/
│       └── package.json
├── libs/
│   ├── shared-ui/         # Reusable React components
│   │   ├── src/
│   │   └── package.json
│   ├── shared-utils/      # Pure utility functions
│   │   ├── src/
│   │   └── package.json
│   └── shared-types/      # TypeScript type definitions
│       ├── src/
│       └── package.json
├── packages/
│   └── eslint-config/     # Shared ESLint config
│       └── package.json
├── nx.json                # or turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json`}
      </CodeBlock>

      <h2>Shared Packages and Libraries</h2>

      <CodeBlock language="json" title="libs/shared-ui/package.json">
{`{
  "name": "@myorg/shared-ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "react": "^18.3.0"
  }
}`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Consuming a shared library">
{`// In apps/web-app/src/App.tsx
import { Button, Modal } from '@myorg/shared-ui';
import { formatDate, debounce } from '@myorg/shared-utils';
import type { User, ApiResponse } from '@myorg/shared-types';`}
      </CodeBlock>

      <InfoBox variant="warning" title="Avoid Circular Dependencies">
        Libraries should never import from apps. Use the project graph (NX) or
        dependency visualization to catch circular references early. A strict layering
        rule helps: <code>apps → libs → shared-types</code>. Types flow down, imports
        flow up.
      </InfoBox>

      <h2>Module Federation and Micro-Frontends</h2>
      <p>
        For very large applications, Module Federation allows multiple independently
        deployed apps to share components at runtime. Each "remote" app exposes
        components that the "host" app loads dynamically.
      </p>

      <FlowChart
        title="Module Federation Architecture"
        chart={"graph TD\n  A[Host App Shell] --> B[Remote: Header MFE]\n  A --> C[Remote: Dashboard MFE]\n  A --> D[Remote: Settings MFE]\n  B --> E[Shared: React + Design System]\n  C --> E\n  D --> E"}
      />

      <h2>CI Optimization for Monorepos</h2>

      <CodeBlock language="yaml" title="GitHub Actions with Affected">
{`name: CI
on: [pull_request]
jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      # Only build/test/lint what changed
      - run: npx nx affected -t lint test build --base=origin/main`}
      </CodeBlock>

      <InteractiveChallenge
        question={"What does NX's 'affected' command do?"}
        options={[
          "Runs all tasks across every project in the monorepo",
          "Runs tasks only for projects impacted by changes since the base branch",
          "Generates new projects affected by a schema change",
          "Clears the computation cache for affected projects"
        ]}
        correctIndex={1}
        explanation={"The affected command analyzes the project graph and git diff to determine which projects are impacted by your changes. It then runs the specified task (build, test, lint) only for those projects and their dependents. This dramatically reduces CI time."}
      />

      <InfoBox variant="tip" title="Start Simple, Scale Up">
        You don't need NX or Turborepo on day one. Start with pnpm workspaces and
        add orchestration tools when your CI gets slow or your team outgrows manual
        coordination. Many teams run monorepos with just pnpm workspaces and
        a few shell scripts.
      </InfoBox>
    </LessonLayout>
  );
}
