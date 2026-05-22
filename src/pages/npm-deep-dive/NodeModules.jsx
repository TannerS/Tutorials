import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmNodeModules() {
  return (
    <LessonLayout
      title="node_modules Structure"
      sectionId="npm-deep-dive"
      lessonIndex={2}
      prev={{ path: '/npm-deep-dive/resolution', label: 'Dependency Resolution' }}
      next={{ path: '/npm-deep-dive/lockfile', label: 'Lockfiles' }}
    >
      <h2>How node_modules Works</h2>
      <p>
        The <code>node_modules</code> directory is where npm stores all installed packages.
        Understanding its structure explains why it grows so large and how Node.js resolves modules at runtime.
      </p>

      <FlowChart
        title="Module Resolution Order"
        chart={"graph TD\n  A[require - import module] --> B{Relative path?}\n  B -- Yes --> C[Load file directly]\n  B -- No --> D[Check node_modules/]\n  D --> E[./node_modules/module]\n  E --> F{Found?}\n  F -- No --> G[../node_modules/module]\n  G --> H{Found?}\n  H -- No --> I[Continue up to /]\n  F -- Yes --> J[Load module]\n  H -- Yes --> J"}
      />

      <h2>Flat vs Nested node_modules</h2>

      <CodeBlock language="bash" title="npm v3+ flat structure">
{`# Before npm v3: deeply nested (each package had its own node_modules)
# node_modules/
# └── A/
#     └── node_modules/
#         └── B@1.0/
#             └── node_modules/
#                 └── C@1.0/

# npm v3+ hoists dependencies to the top level (flat)
# node_modules/
# ├── A/
# ├── B@1.0/      ← hoisted (used by A and C)
# └── C@1.0/      ← hoisted

# Benefits: deduplication, shorter paths (Windows 260-char limit)
# Downside: phantom dependencies (can require packages not in package.json)`}
      </CodeBlock>

      <CodeBlock language="bash" title="Nested (non-hoisted) for conflicts">
{`# When two packages require incompatible versions, npm nests:
# node_modules/
# ├── react@18.2.0         ← your app's react
# ├── old-library/
# │   └── node_modules/
# │       └── react@16.14.0  ← old-library's conflicting react
# └── new-library/         ← uses hoisted react@18

# The nested react@16 only applies to old-library
# This keeps compatibility but wastes disk space`}
      </CodeBlock>

      <h2>Phantom Dependencies</h2>
      <p>
        Phantom dependencies are packages you can <code>require()</code> even though they are not in
        your <code>package.json</code>. They exist because npm hoists transitive deps to the top level.
        This is a significant source of fragility.
      </p>

      <CodeBlock language="javascript" title="Phantom dependency problem">
{`// Your package.json only lists: "react", "react-dom"
// But react-dom depends on "scheduler"
// npm hoists scheduler to node_modules/scheduler

// You can accidentally do:
const { unstable_scheduleCallback } = require('scheduler')
// This works today! But if react-dom stops depending on scheduler,
// or uses a different version, your code breaks silently.

// pnpm solves this with strict isolation:
// Only packages listed in package.json are accessible
// require('scheduler') would fail if not in your package.json`}
      </CodeBlock>

      <h2>pnpm's Symlink Structure</h2>
      <p>
        pnpm uses a fundamentally different approach that eliminates phantom dependencies and saves disk space
        through a global content-addressable store with hard links.
      </p>

      <CodeBlock language="bash" title="pnpm node_modules layout">
{`# pnpm creates a virtual store + symlinks
# node_modules/
# ├── .pnpm/                      ← virtual store
# │   ├── react@18.2.0/
# │   │   └── node_modules/
# │   │       ├── react/          ← actual files (hard-linked from global store)
# │   │       └── loose-envify/   ← react's deps
# │   └── react-dom@18.2.0/
# │       └── node_modules/
# │           └── react-dom/      ← actual files
# ├── react -> .pnpm/react@18.2.0/node_modules/react  (symlink)
# └── react-dom -> .pnpm/react-dom@18.2.0/...  (symlink)

# Global store (shared across ALL projects):
# ~/.pnpm-store/v3/files/
# └── ab/
#     └── cdef123...  (content-addressed, hard-linked)

# Benefits:
# - Each package only has access to its own deps (no phantoms)
# - All projects share one copy per package version on disk
# - node_modules is tiny (just symlinks)`}
      </CodeBlock>

      <h2>Why node_modules Gets So Large</h2>

      <CodeBlock language="bash" title="Analyzing node_modules size">
{`# Check total size
du -sh node_modules

# Find largest packages
du -sh node_modules/* | sort -hr | head -20

# Count total packages
ls node_modules | wc -l

# Typical sizes for common projects:
# Empty Vite React app: ~200 packages, ~350MB
# Most packages are devDependencies (won't ship to users)
# Production build (dist/) is typically 50-200KB gzipped

# Tools to analyze:
npx cost-of-modules        # cost of each dependency
npx npm-check-updates      # show available updates
npx depcheck               # find unused dependencies`}
      </CodeBlock>

      <h2>Module Resolution Algorithm</h2>

      <CodeBlock language="javascript" title="How require() finds modules">
{`// When you write: const foo = require('foo')
// Node.js follows this algorithm:

// 1. Check if 'foo' is a built-in (fs, path, http...)
// 2. Check if 'foo' starts with ./ ../ / (relative/absolute)
//    → load that file directly
// 3. Otherwise, search for node_modules/foo/ starting at current dir
//    → ./node_modules/foo
//    → ../node_modules/foo
//    → ../../node_modules/foo
//    → ... up to filesystem root
// 4. Inside the package, read package.json "main" field
//    → if no main: load index.js

// ESM (import) with Node.js:
import foo from 'foo'
// Same algorithm, but reads "exports" field first
// Then "module" field (for ESM entry)
// Fallback to "main"`}
      </CodeBlock>

      <h2>.gitignore for node_modules</h2>

      <CodeBlock language="bash" title="What to gitignore">
{`# .gitignore — always ignore node_modules
node_modules/

# Never commit node_modules because:
# 1. Huge (hundreds of MB)
# 2. Contains binaries for current OS
# 3. package-lock.json is the source of truth
# 4. npm ci can rebuild it in seconds

# DO commit:
# package.json        (dependency declarations)
# package-lock.json   (exact resolved versions)
# .npmrc              (project npm config)
# .nvmrc              (required Node.js version)

# For libraries, also commit:
# dist/               OR exclude it (depends on workflow)`}
      </CodeBlock>

      <InfoBox variant="warning" title="The node_modules Problem">
        <p>
          node_modules is famously the heaviest object in the universe (a joke in the JS community).
          A single Vite + React project can have 200+ packages and 300MB of node_modules — even though
          the production bundle is only ~100KB. Most of the weight is dev tooling.
          pnpm and Yarn PnP are the best solutions for large teams with many projects.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is a 'phantom dependency' in npm projects?"
        options={[
          "A dependency that is declared but never used in the code",
          "A package you can require() even though it is not in your package.json (because it was hoisted)",
          "A circular dependency between two packages",
          "A dependency that only exists in the lock file"
        ]}
        correctIndex={1}
        explanation="Phantom dependencies are packages you can import even though they're not in your package.json. npm's flat hoisting puts all transitive dependencies at the top level of node_modules, making them accessible. This is fragile — if a package you depend on stops using that transitive dep, your code breaks even though you didn't change anything. pnpm's strict mode prevents this by only allowing access to packages explicitly listed in your package.json."
      />

      <InteractiveChallenge
        question="How does pnpm save disk space compared to npm?"
        options={[
          "pnpm compresses all packages with gzip",
          "pnpm stores each package version once globally and uses hard links into each project",
          "pnpm only installs packages that are actually imported",
          "pnpm shares node_modules between all projects in a monorepo"
        ]}
        correctIndex={1}
        explanation="pnpm uses a global content-addressable store (~/.pnpm-store). Every unique file across all package versions is stored exactly once. Projects then use hard links (not copies) to point to these files. This means 100 projects using React 18.2.0 share the same physical files on disk. npm and yarn create full copies in each project's node_modules, multiplying disk usage."
      />
    </LessonLayout>
  );
}
