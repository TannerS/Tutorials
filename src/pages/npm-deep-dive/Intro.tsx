import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="How npm Works"
      sectionId="npm-deep-dive"
      lessonIndex={0}
      prev={null}
      next={{ path: '/npm-deep-dive/resolution', label: 'Dependency Resolution' }}
    >
      <h2>What is npm, Really?</h2>
      <p>
        You type <code>npm install</code> every day, but npm is actually three distinct things
        working together. Understanding each one demystifies everything else.
      </p>

      <FlowChart
        title="The Three Parts of npm"
        chart={"graph TD\n  A[npm] --> B[Registry]\n  A --> C[CLI Tool]\n  A --> D[Website]\n  B --> E[Giant JSON database of packages]\n  B --> F[Stores tarballs of every version]\n  C --> G[Installs, publishes, audits]\n  C --> H[Ships with Node.js]\n  D --> I[npmjs.com - search & docs]"}
      />

      <h3>The Registry</h3>
      <p>
        The npm registry is a massive CouchDB-backed database hosted at <code>registry.npmjs.org</code>.
        Every package is stored as a JSON document containing metadata (versions, dependencies,
        maintainers) plus a tarball (.tgz file) for each published version. When you run
        <code>npm install lodash</code>, the CLI hits this registry to figure out what to download.
      </p>

      <CodeBlock language="bash" title="Query the registry directly">
{`# Get full metadata for a package (JSON)
curl https://registry.npmjs.org/lodash | head -c 500

# Get metadata for a specific version
curl https://registry.npmjs.org/lodash/4.17.21

# The tarball URL looks like this:
# https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz`}
      </CodeBlock>

      <InfoBox variant="info" title="It's Just HTTP">
        The registry is a REST API. Every <code>npm install</code> is ultimately just HTTP GET
        requests. You can replicate npm's behavior with curl if you wanted to. Private registries
        (Artifactory, Verdaccio, GitHub Packages) implement this same API.
      </InfoBox>

      <h3>The CLI Tool</h3>
      <p>
        The <code>npm</code> command ships bundled with Node.js. It's a Node.js program itself —
        you can find it at <code>which npm</code>. The CLI handles installing packages, managing
        lockfiles, running scripts, publishing, auditing, and more. It's the conductor of the
        entire ecosystem.
      </p>

      <h3>The Website</h3>
      <p>
        npmjs.com is the front-end to the registry. It renders README files, shows download
        stats, dependency graphs, and package scores. When evaluating a package, this is where
        you check things like weekly downloads, last publish date, and number of dependents.
      </p>

      <h2>How <code>npm install</code> Works Step-by-Step</h2>
      <p>
        That simple command triggers a complex pipeline. Here's what actually happens under the hood:
      </p>

      <FlowChart
        title="The npm install Pipeline"
        chart={"graph TD\n  A[npm install] --> B[Read package.json]\n  B --> C[Read package-lock.json]\n  C --> D[Resolve version ranges to exact versions]\n  D --> E[Build dependency tree]\n  E --> F[Check local cache]\n  F --> G{Cached?}\n  G -->|Yes| H[Use cached tarball]\n  G -->|No| I[Fetch from registry]\n  I --> J[Store in cache]\n  H --> K[Extract to node_modules]\n  J --> K\n  K --> L[Run lifecycle scripts]\n  L --> M[Update package-lock.json]"}
      />

      <p>
        Let's trace through each step:
      </p>
      <ol>
        <li><strong>Read package.json</strong> — Parse your declared dependencies and their version ranges</li>
        <li><strong>Read lockfile</strong> — If package-lock.json exists, use its exact resolved versions as a starting point</li>
        <li><strong>Resolve versions</strong> — For new or updated deps, query the registry for the latest version matching the range</li>
        <li><strong>Build dependency tree</strong> — Recursively resolve all transitive dependencies, deduplicate where possible</li>
        <li><strong>Check cache</strong> — Look for previously downloaded tarballs in ~/.npm/_cacache</li>
        <li><strong>Fetch tarballs</strong> — Download any packages not in cache from the registry</li>
        <li><strong>Extract</strong> — Unpack tarballs into node_modules with the correct directory structure</li>
        <li><strong>Lifecycle scripts</strong> — Run preinstall, install, postinstall scripts for each package</li>
        <li><strong>Update lockfile</strong> — Write the resolved tree to package-lock.json</li>
      </ol>

      <h2>npm vs npx</h2>
      <p>
        <code>npx</code> is a companion tool that ships with npm. Its purpose is to <strong>execute</strong>
        a package without permanently installing it. This is perfect for one-off commands and scaffolding tools.
      </p>

      <CodeBlock language="bash" title="npm vs npx">
{`# npm: install globally, then use
npm install -g create-react-app
create-react-app my-app

# npx: download temporarily, execute, discard
npx create-react-app my-app

# npx also runs local binaries from node_modules/.bin
npx jest --watch
# equivalent to: ./node_modules/.bin/jest --watch

# npx with a specific version
npx create-next-app@14.0.0 my-app`}
      </CodeBlock>

      <InfoBox variant="tip" title="npx Resolution Order">
        When you run <code>npx some-tool</code>, it first checks node_modules/.bin in your
        project, then checks globally installed packages, and only then downloads from the
        registry. This means local project binaries always win.
      </InfoBox>

      <h2>The npm Cache</h2>
      <p>
        Every tarball npm downloads is stored in a content-addressable cache at
        <code>~/.npm/_cacache</code>. This means if you <code>npm install</code> the same
        package version across multiple projects, it's only downloaded once.
      </p>

      <CodeBlock language="bash" title="Working with the cache">
{`# See where the cache lives
npm config get cache
# Output: /Users/you/.npm

# Verify cache integrity
npm cache verify

# Clean the cache (rarely needed)
npm cache clean --force

# See cache stats after verify
# Cache is content-addressable: indexed by integrity hash (sha512)
ls ~/.npm/_cacache/
# content-v2/  index-v5/  tmp/`}
      </CodeBlock>

      <InfoBox variant="note" title="Cache Is Safe to Delete">
        The npm cache is purely a performance optimization. Deleting it with
        <code>npm cache clean --force</code> just means the next install will re-download
        from the registry. It won't break anything — unlike deleting node_modules mid-install.
      </InfoBox>

      <h2>.npmrc Configuration</h2>
      <p>
        npm reads configuration from multiple .npmrc files in a specific order (highest priority first):
        project-level, user-level, global-level, and npm built-in defaults.
      </p>

      <CodeBlock language="bash" title=".npmrc examples">
{`# Project .npmrc (lives in project root, committed to git)
registry=https://registry.npmjs.org/
save-exact=true
engine-strict=true

# Scoped registry (route @mycompany packages to private registry)
@mycompany:registry=https://npm.mycompany.com/

# User .npmrc (~/.npmrc — NEVER commit this one)
//registry.npmjs.org/:_authToken=npm_XXXXXXXXXXXX
//npm.mycompany.com/:_authToken=secret_token_here

# Useful settings
save-exact=true          # Save exact versions (no ^ prefix)
package-lock=true        # Always generate lockfile
audit=true               # Run audit on install
fund=false               # Suppress funding messages
loglevel=warn            # Reduce noise`}
      </CodeBlock>

      <h2>Scoped Packages</h2>
      <p>
        Scoped packages are namespaced under an organization: <code>@angular/core</code>,
        <code>@types/node</code>, <code>@babel/preset-env</code>. The scope is the part
        after @ and before the slash.
      </p>

      <CodeBlock language="bash" title="Working with scoped packages">
{`# Install a scoped package
npm install @babel/core

# Scopes prevent name collisions
npm install @mycompany/utils  # Your company's utils
npm install @otherco/utils    # Different org, no conflict

# Scoped packages are private by default when publishing
npm publish                     # Fails for @scope/pkg (private by default)
npm publish --access public     # Explicitly make it public

# Route a scope to a private registry
npm config set @mycompany:registry https://npm.mycompany.com/`}
      </CodeBlock>

      <h2>npm vs yarn vs pnpm</h2>
      <p>
        All three are package managers that use the same npm registry. They differ in
        how they manage node_modules and what guarantees they provide:
      </p>

      <CodeBlock language="bash" title="Quick comparison">
{`# npm (ships with Node.js)
# - Flat node_modules with hoisting
# - package-lock.json
# - Workspaces support since v7

# yarn (Facebook, 2016)
# - yarn.lock (deterministic)
# - Plug'n'Play mode (no node_modules!)
# - Faster parallel installs historically

# pnpm (2017, "performant npm")
# - Content-addressable store (shared across projects)
# - Strict node_modules via symlinks (no phantom deps)
# - pnpm-lock.yaml
# - Fastest install times, smallest disk usage`}
      </CodeBlock>

      <InfoBox variant="tip" title="Which Should You Use?">
        For most teams: use whatever's already in the project (check for yarn.lock vs
        package-lock.json vs pnpm-lock.yaml). For new projects: pnpm is technically
        superior but npm has the lowest friction since it ships with Node.js. yarn is
        fine but its v1→v2+ migration confused many teams.
      </InfoBox>

      <InteractiveChallenge
        question={"When you run npm install lodash, what does npm download from the registry?"}
        options={[
          "The raw JavaScript source files from GitHub",
          "A tarball (.tgz) containing the package contents",
          "A Docker container with the package",
          "A binary executable compiled for your OS"
        ]}
        correctIndex={1}
        explanation="npm packages are distributed as gzipped tarballs (.tgz files). The registry stores a tarball for each published version. npm downloads and extracts these tarballs into your node_modules directory."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>npm is three things: a registry (database), a CLI tool, and a website</li>
        <li>The registry is just an HTTP API — packages are JSON metadata + tarballs</li>
        <li><code>npm install</code> is a multi-step pipeline: resolve → fetch → cache → extract → scripts</li>
        <li>npx executes packages without permanent installation</li>
        <li>The cache at ~/.npm/_cacache prevents redundant downloads</li>
        <li>.npmrc configures registries, auth tokens, and default behaviors</li>
        <li>Scoped packages (@org/name) namespace packages to organizations</li>
      </ul>
    </LessonLayout>
  );
}
