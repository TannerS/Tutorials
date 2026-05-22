import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function FTPackages() {
  return (
    <LessonLayout
      title="Package Managers"
      sectionId="frontend-tooling"
      lessonIndex={2}
      prev={{ path: '/frontend-tooling/linting', label: 'ESLint & Prettier' }}
      next={{ path: '/frontend-tooling/monorepos', label: 'Monorepos' }}
    >
      <h2>npm, yarn, and pnpm Compared</h2>
      <p>
        The three major JavaScript package managers all read <code>package.json</code> and resolve dependencies,
        but differ significantly in storage strategy, speed, and workspace support.
      </p>

      <FlowChart
        title="Package Manager Storage Strategies"
        chart={"graph TD\n  A[npm install] --> B[Flat node_modules]\n  B --> C[Hoisted dependencies]\n  D[yarn install] --> E[Flat node_modules]\n  E --> F[Plug n Play optional]\n  G[pnpm install] --> H[Content-addressable store]\n  H --> I[Symlinked node_modules]\n  I --> J[Strict isolation]"}
      />

      <h2>npm — The Default</h2>

      <CodeBlock language="bash" title="npm commands">
{`# Install all dependencies from package.json
npm install           # or npm i

# Install and add to dependencies
npm install react
npm install --save-dev vitest    # devDependency
npm install --save-optional X   # optionalDependency

# Install globally
npm install -g typescript

# Run scripts
npm run dev
npm test              # shorthand for npm run test
npm start             # shorthand for npm run start

# Update packages
npm update                # updates within semver range
npm outdated             # show outdated packages
npx npm-check-updates    # show all possible upgrades

# Audit for vulnerabilities
npm audit
npm audit fix
npm audit fix --force    # upgrades major versions (breaking!)

# Workspaces (npm 7+)
npm install --workspace=packages/web
npm run build --workspaces`}
      </CodeBlock>

      <h2>pnpm — The Modern Choice</h2>
      <p>
        pnpm is the recommended package manager for new projects in 2024+. It uses a global content-addressable
        store that hard-links packages, saving disk space and install time dramatically.
      </p>

      <CodeBlock language="bash" title="pnpm setup and commands">
{`# Install pnpm
npm install -g pnpm
# Or use corepack (Node.js built-in)
corepack enable
corepack prepare pnpm@latest --activate

# Basic commands (same API as npm)
pnpm install
pnpm add react
pnpm add -D vitest
pnpm run dev
pnpm dlx create-vite my-app   # equivalent to npx

# pnpm advantages:
# ─ 40-70% less disk space (content-addressable store)
# ─ 2-3x faster installs (hard-links, no copying)
# ─ Strict mode: prevents accessing undeclared dependencies
# ─ Built-in monorepo support with pnpm workspaces

# .npmrc for pnpm strict mode
echo "node-linker=hoisted" > .npmrc    # if you need hoisting compat
echo "shamefully-hoist=true" >> .npmrc # same as npm/yarn flat (not recommended)`}
      </CodeBlock>

      <CodeBlock language="yaml" title="pnpm-workspace.yaml">
{`packages:
  - 'apps/*'
  - 'packages/*'
  - '!**/node_modules/**'`}
      </CodeBlock>

      <h2>yarn — The Classic</h2>

      <CodeBlock language="bash" title="Yarn v4 (Berry) commands">
{`# Enable via corepack
corepack enable
corepack prepare yarn@stable --activate

# Yarn commands
yarn install
yarn add react
yarn add -D vitest
yarn dlx create-vite my-app

# Yarn Plug'n'Play (no node_modules!)
# Dependencies are ZIP archives, no disk bloat
# Requires editor SDK setup:
yarn dlx @yarnpkg/sdks vscode

# Yarn workspaces
yarn workspace my-app add react
yarn workspaces foreach run build`}
      </CodeBlock>

      <h2>Lock Files</h2>

      <CodeBlock language="bash" title="Lock file comparison">
{`# npm: package-lock.json
# yarn: yarn.lock
# pnpm: pnpm-lock.yaml

# Always commit lock files to source control
# They ensure reproducible installs across machines

# Install from lock file (CI-friendly — never updates lock file)
npm ci                 # faster than npm install in CI
yarn install --frozen-lockfile
pnpm install --frozen-lockfile

# Regenerate lock file
rm package-lock.json && npm install
rm yarn.lock && yarn install
rm pnpm-lock.yaml && pnpm install`}
      </CodeBlock>

      <h2>Enforcing a Package Manager</h2>

      <CodeBlock language="json" title="package.json — packageManager field">
{`{
  "name": "my-app",
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}

// With corepack enabled, running "npm install" in a pnpm project
// will error: "This project is configured to use pnpm"`}
      </CodeBlock>

      <CodeBlock language="json" title=".npmrc">
{`# Prevent using npm in a pnpm project
engine-strict=true
strict-peer-dependencies=false
auto-install-peers=true`}
      </CodeBlock>

      <h2>npx and Package Execution</h2>

      <CodeBlock language="bash" title="npx / pnpm dlx">
{`# Run a package without installing it permanently
npx create-react-app my-app      # downloads and runs create-react-app
npx prettier --write src         # uses project's prettier if available
npx jest                         # prefer local to global

# pnpm equivalent
pnpm dlx create-vite my-app

# yarn equivalent
yarn dlx create-vite my-app

# Specify version
npx eslint@8 .
npx react@18 --version`}
      </CodeBlock>

      <InfoBox variant="tip" title="Which Package Manager to Use?">
        <p>
          For new projects: use <strong>pnpm</strong>. It is the fastest, most disk-efficient, and has the strictest
          dependency isolation. For existing npm projects: stay with npm unless you have a specific reason to switch.
          Yarn Berry (v4) is excellent for teams that want zero-install setups with PnP.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of pnpm's content-addressable store over npm's flat node_modules?"
        options={[
          "pnpm automatically updates packages to their latest versions",
          "Each package is stored once globally and hard-linked into projects, saving disk space",
          "pnpm bundles dependencies before installation for faster startup",
          "pnpm prevents all version conflicts by using a single global version per package"
        ]}
        correctIndex={1}
        explanation="pnpm stores each version of every package exactly once in a global content-addressable store (~/.pnpm-store). When a project needs that package, pnpm creates hard links from the store into the project's node_modules. This means 100 projects using React 18.2.0 share a single copy on disk instead of 100 copies. This saves gigabytes of disk space and makes installs nearly instantaneous for cached packages."
      />

      <InteractiveChallenge
        question="Why should you use 'npm ci' instead of 'npm install' in CI environments?"
        options={[
          "npm ci is faster because it skips all optional dependencies",
          "npm ci installs from the lock file and fails if package.json and lock file are out of sync",
          "npm ci automatically runs tests after installation",
          "npm ci uses a different registry with pre-built binaries"
        ]}
        correctIndex={1}
        explanation="npm ci reads package-lock.json and installs exactly those versions, never updating the lock file. It fails if package.json and package-lock.json are inconsistent, catching configuration drift early. It also deletes node_modules before installing for a clean slate, making it more reliable than npm install for CI where you want reproducible, deterministic builds."
      />
    </LessonLayout>
  );
}
