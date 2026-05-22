import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmIntro() {
  return (
    <LessonLayout
      title="npm Introduction"
      sectionId="npm-deep-dive"
      lessonIndex={0}
      prev={null}
      next={{ path: '/npm-deep-dive/resolution', label: 'Dependency Resolution' }}
    >
      <h2>What is npm?</h2>
      <p>
        npm (Node Package Manager) is the world's largest software registry and the default package manager
        for Node.js. It manages dependencies, runs scripts, and publishes packages. Every Node.js
        installation includes npm.
      </p>

      <FlowChart
        title="npm Ecosystem"
        chart={"graph LR\n  A[Developer] --> B[package.json]\n  B --> C[npm install]\n  C --> D[npm registry]\n  D --> E[node_modules/]\n  B --> F[npm run build]\n  F --> G[lifecycle scripts]\n  A --> H[npm publish]\n  H --> D"}
      />

      <h2>npm vs yarn vs pnpm</h2>

      <CodeBlock language="bash" title="Command comparison">
{`# Install all dependencies
npm install          yarn install         pnpm install

# Add a dependency
npm install react    yarn add react       pnpm add react

# Add a devDependency
npm install -D vite  yarn add -D vite     pnpm add -D vite

# Remove a dependency
npm uninstall react  yarn remove react    pnpm remove react

# Run a script
npm run build        yarn build           pnpm run build

# Run without installing globally
npx eslint .         yarn dlx eslint .    pnpm dlx eslint .

# Install exact version (no caret/tilde)
npm install react@18.2.0
npm install --save-exact react`}
      </CodeBlock>

      <h2>npm Registry</h2>
      <p>
        The npm registry at <code>registry.npmjs.org</code> hosts over 2 million packages.
        Organizations can also run private registries (Verdaccio, Nexus, GitHub Packages).
      </p>

      <CodeBlock language="bash" title="Registry configuration">
{`# Check current registry
npm config get registry

# Set a scoped package to use private registry
npm config set @mycompany:registry https://registry.mycompany.com

# Authenticate with private registry
npm login --registry https://registry.mycompany.com
npm login --scope @mycompany

# .npmrc file (project or user level)
registry=https://registry.npmjs.org
@mycompany:registry=https://registry.mycompany.com
//registry.mycompany.com/:_authToken=${AUTH_TOKEN}

# Check package info
npm info react
npm info react versions
npm info react dist-tags`}
      </CodeBlock>

      <h2>npm init and package.json</h2>

      <CodeBlock language="bash" title="Initializing a project">
{`# Interactive init
npm init

# Skip questions (use defaults)
npm init -y

# Scope a package (for org or private)
npm init --scope=@myorg

# Key package.json fields
{
  "name": "my-package",          // must be unique on npm (for published packages)
  "version": "1.0.0",            // semver: MAJOR.MINOR.PATCH
  "description": "...",
  "main": "./dist/index.js",     // CJS entry point
  "module": "./dist/index.esm.js", // ESM entry (unofficial but widely used)
  "exports": {                   // official subpath exports (Node 12+)
    ".": { "import": "./dist/index.esm.js", "require": "./dist/index.cjs" }
  },
  "scripts": { "build": "tsc", "test": "vitest" },
  "keywords": ["react", "ui"],
  "author": "Alice <alice@example.com>",
  "license": "MIT",
  "files": ["dist"],             // files included when published
  "engines": { "node": ">=18" },
  "private": true                // prevents accidental publish
}`}
      </CodeBlock>

      <h2>npm config</h2>

      <CodeBlock language="bash" title="Common npm config settings">
{`# View all config
npm config list
npm config list -l    # include defaults

# Set config values
npm config set save-exact true         # always install exact versions
npm config set fund false              # disable funding messages
npm config set audit-level moderate    # CI: fail on moderate+ vulns
npm config set prefer-offline true     # use cache when available

# Config files (ascending priority)
# project/.npmrc        (project level — commit this)
# ~/.npmrc              (user level)
# /etc/npmrc            (system level)
# npm CLI defaults`}
      </CodeBlock>

      <h2>npm commands reference</h2>

      <CodeBlock language="bash" title="Essential commands">
{`# Dependency management
npm install                    # install from package.json
npm ci                         # clean install from lock file (CI)
npm install react@^18          # install specific version range
npm install react@latest       # install latest
npm update                     # update within semver range
npm outdated                   # show available updates
npm dedupe                     # reduce duplicated packages

# Inspection
npm ls                         # dependency tree
npm ls --depth=0               # direct dependencies only
npm ls react                   # find react in dependency tree
npm explain react              # why is react installed?

# Publishing
npm pack                       # create .tgz without publishing
npm publish                    # publish to registry
npm publish --tag beta         # publish under 'beta' dist-tag
npm deprecate my-pkg "reason"  # deprecate a version

# Cache
npm cache clean --force
npm cache verify`}
      </CodeBlock>

      <InfoBox variant="tip" title="npm ci vs npm install">
        <p>
          Always use <code>npm ci</code> in CI/CD pipelines. It: installs from <code>package-lock.json</code> exactly,
          fails if the lock file is missing or out of sync with <code>package.json</code>, deletes
          <code>node_modules</code> before installing (clean slate), and does not write to the lock file.
          This gives reproducible, deterministic installs.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the difference between 'npm install' and 'npm ci'?"
        options={[
          "npm ci is faster because it skips all optional dependencies",
          "npm ci installs exactly from the lock file and fails if it's out of sync; npm install may update the lock file",
          "npm install requires internet access; npm ci works offline",
          "They are identical commands with different names"
        ]}
        correctIndex={1}
        explanation="npm ci (clean install) reads package-lock.json and installs those exact versions without making any changes. If package.json and package-lock.json are inconsistent, npm ci fails loudly. npm install can update the lock file and resolve new versions. npm ci is also faster in CI because it deletes node_modules first and installs everything in parallel."
      />

      <InteractiveChallenge
        question="What does the 'private: true' field in package.json do?"
        options={[
          "Makes the package only accessible to authenticated users",
          "Prevents the package from being accidentally published to the npm registry",
          "Hides the package from npm ls output",
          "Prevents others from installing the package as a dependency"
        ]}
        correctIndex={1}
        explanation="Setting 'private: true' in package.json prevents npm publish from publishing the package to the npm registry. npm will refuse to publish and throw an error. This is a safety net for application code (as opposed to libraries) that should never be published. It is the recommended setting for all application projects."
      />
    </LessonLayout>
  );
}
