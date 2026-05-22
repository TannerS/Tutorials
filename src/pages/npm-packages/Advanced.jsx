import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpkgAdvanced() {
  return (
    <LessonLayout
      title="Advanced Packaging"
      sectionId="npm-packages"
      lessonIndex={4}
      prev={{ path: '/npm-packages/publishing', label: 'Publishing to npm' }}
      next={null}
    >
      <h2>npm Workspaces</h2>
      <p>
        npm workspaces (npm 7+) let you manage multiple packages in a single repository.
        They hoist shared dependencies to the root and link local packages to each other.
      </p>

      <CodeBlock language="json" title="Root package.json for a workspace">
{`{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint -w packages/ui -w packages/utils"
  }
}

# Structure:
# my-monorepo/
# ├── package.json          (root — private: true)
# ├── node_modules/         (hoisted shared deps)
# ├── packages/
# │   ├── ui/               (@myorg/ui)
# │   │   └── package.json
# │   └── utils/            (@myorg/utils)
# │       └── package.json
# └── apps/
#     └── web/              (my-web-app)
#         └── package.json`}
      </CodeBlock>

      <CodeBlock language="bash" title="Workspace commands">
{`# Install a dep in a specific workspace
npm install react -w packages/ui
npm install -D vitest -w packages/utils

# Run a script in a specific workspace
npm run build -w packages/ui

# Run a script in all workspaces
npm run test --workspaces

# Run only in workspaces that have the script
npm run lint --workspaces --if-present

# List workspace package names
npm query .workspace

# Install a local workspace package as dependency
# In apps/web/package.json:
{
  "dependencies": {
    "@myorg/ui": "*"     // link to local package
  }
}
npm install   # creates symlink in node_modules/@myorg/ui → packages/ui`}
      </CodeBlock>

      <h2>Changesets for Monorepos</h2>

      <CodeBlock language="bash" title="Managing multi-package releases with changesets">
{`# @changesets/cli manages version bumps and changelogs across packages

# Setup
npm install --save-dev @changesets/cli
npx changeset init

# .changeset/config.json:
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}

# Create a changeset (describe what changed)
npx changeset
# → Which packages changed? (select with space)
# → Major/minor/patch for each?
# → Summary of changes?
# → Creates .changeset/amazing-foxes-jump.md

# Preview version bumps
npx changeset status --verbose

# Apply version bumps + update CHANGELOG.md
npx changeset version

# Publish all changed packages
npx changeset publish`}
      </CodeBlock>

      <h2>Package Provenance</h2>

      <CodeBlock language="bash" title="npm provenance attestations">
{`# Provenance links a published package to its exact
# source code commit and CI build (GitHub Actions)

# Requires: GitHub Actions + id-token: write permission
npm publish --provenance

# What it provides:
# - Cryptographic proof of where the package was built
# - Links package to specific git commit and workflow run
# - Visible on npmjs.com package page as a badge
# - Users can verify: npm audit signatures

# Verifying provenance:
npm audit signatures
# audited 250 packages
# 250 packages have verified registry signatures
# 15 packages have verified attestations (provenance)

# View provenance data:
npm info @myorg/my-lib dist.attestations`}
      </CodeBlock>

      <h2>Local Package Development with 'npm link'</h2>

      <CodeBlock language="bash" title="Testing packages locally">
{`# Method 1: npm link (creates global symlink)
cd packages/my-lib
npm link                    # register globally

cd apps/my-app
npm link my-lib             # link to local version

# Unlink when done
npm unlink my-lib
cd packages/my-lib && npm unlink

# Method 2: file: protocol (more reliable)
# In apps/my-app/package.json:
{
  "dependencies": {
    "my-lib": "file:../../packages/my-lib"
  }
}

# Method 3: yalc (best for cross-project testing)
npm install -g yalc

cd packages/my-lib
yalc publish               # publish to local store

cd apps/my-app
yalc add my-lib            # install from local store
# Make changes, then:
yalc push                  # push updates instantly`}
      </CodeBlock>

      <h2>TypeScript Declaration Files</h2>

      <CodeBlock language="typescript" title="Generating and configuring types">
{`// tsconfig.build.json (separate config for building)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,        // generate .d.ts files
    "declarationDir": "./dist",
    "declarationMap": true,     // generate .d.ts.map for IDE navigation
    "emitDeclarationOnly": true // only types, no JS (tsup handles JS)
  },
  "include": ["src"],
  "exclude": ["**/*.test.ts", "**/*.spec.ts"]
}

// tsup generates both JS and .d.ts in one step:
// tsup.config.ts
export default {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,             // generates dist/index.d.ts automatically
}

// Verifying types before publishing
npx @arethetypeswrong/cli ./my-package-1.0.0.tgz
# Checks all module format + TS resolution scenarios`}
      </CodeBlock>

      <h2>Package Size Optimization</h2>

      <CodeBlock language="bash" title="Reducing package size">
{`# Check your package size
npm pack --dry-run 2>&1 | grep "package size"
# package size: 12.3 kB
# unpacked size: 45.6 kB
# shasum: abc123
# total files: 8

# Reduce size:
# 1. Only publish dist/ not src/
"files": ["dist"]

# 2. Externalize all peer dependencies (don't bundle react)
# In tsup.config.ts:
external: ['react', 'react-dom']

# 3. Check with bundlephobia:
# npx bundlephobia my-package
# or visit bundlephobia.com

# Target sizes (gzipped):
# Utility library: < 5KB
# UI component: < 20KB
# Full library: < 50KB
# > 100KB: needs justification`}
      </CodeBlock>

      <InfoBox variant="tip" title="Testing Published Packages">
        <p>
          Before publishing, test your package exactly as a consumer would: install the tarball
          (<code>npm pack</code> then <code>npm install ./my-package-1.0.0.tgz</code>) in a fresh project.
          This catches issues that only appear after publishing: wrong entry points, missing files,
          broken type declarations, and wrong module format exports.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the advantage of using 'npm workspaces' over separate repositories for related packages?"
        options={[
          "Packages in a workspace share the same npm account",
          "Atomic changes across packages, shared tooling, and local symlinks between packages",
          "Workspace packages are automatically published together",
          "All packages in a workspace use the same version number"
        ]}
        correctIndex={1}
        explanation="npm workspaces provide: (1) atomic changes — one PR can update both a library and its consumer app together, (2) shared dev tooling — single ESLint config, TypeScript config, test setup at root, (3) local package linking — packages/ui is automatically symlinked so apps/web can import it without publishing, and (4) hoisted dependencies — common packages installed once at root instead of duplicated."
      />

      <InteractiveChallenge
        question="What does 'yalc' solve that 'npm link' does not handle well?"
        options={[
          "yalc is faster because it bypasses the npm registry",
          "yalc copies the actual published file structure to a local store, matching real install behavior",
          "yalc supports TypeScript projects; npm link does not",
          "yalc works across different machines on the same network"
        ]}
        correctIndex={1}
        explanation="npm link creates symlinks to your source directory, which means your app sees source files, TypeScript files, and dev dependencies — not what would actually be published. This can mask issues. yalc runs the full publish process (respecting 'files', 'exports', and 'prepublish' scripts) to a local store, then installs the resulting artifact. This closely mirrors what users will actually get, catching packaging issues before you publish."
      />
    </LessonLayout>
  );
}
