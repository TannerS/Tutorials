import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmLockfile() {
  return (
    <LessonLayout
      title="Lockfiles"
      sectionId="npm-deep-dive"
      lessonIndex={3}
      prev={{ path: '/npm-deep-dive/node-modules', label: 'node_modules Structure' }}
      next={{ path: '/npm-deep-dive/scripts', label: 'npm Scripts' }}
    >
      <h2>What is a Lock File?</h2>
      <p>
        A lock file records the exact resolved version of every package in your dependency tree,
        including transitive dependencies. It ensures every developer and CI environment installs
        the exact same versions.
      </p>

      <CodeBlock language="bash" title="Lock file by package manager">
{`# npm     → package-lock.json
# yarn    → yarn.lock
# pnpm    → pnpm-lock.yaml

# Always commit lock files to source control!
# Without a lock file, npm install might resolve different versions
# on different machines (within the semver range)

# Example: "react": "^18.2.0"
# Without lock file: could install 18.2.0, 18.2.1, 18.3.0...
# With lock file: always installs exactly 18.2.0 (or whatever was resolved)`}
      </CodeBlock>

      <h2>package-lock.json Structure</h2>

      <CodeBlock language="json" title="package-lock.json v3 format">
{`{
  "name": "my-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "my-app",
      "version": "1.0.0",
      "dependencies": { "react": "^18.2.0" },
      "devDependencies": { "vite": "^5.0.0" }
    },
    "node_modules/react": {
      "version": "18.2.0",          // exact resolved version
      "resolved": "https://registry.npmjs.org/react/-/react-18.2.0.tgz",
      "integrity": "sha512-/3IjM...", // SHA-512 hash for tamper detection
      "dependencies": {
        "loose-envify": "^1.1.0"
      },
      "engines": { "node": ">=0.10.0" }
    },
    "node_modules/loose-envify": {
      "version": "1.4.0",
      "resolved": "...",
      "integrity": "sha512-...",
      "dependencies": { "js-tokens": "^3.0.0 || ^4.0.0" }
    }
  }
}
// Every transitive dep is recorded — full determinism`}
      </CodeBlock>

      <h2>npm install vs npm ci</h2>

      <CodeBlock language="bash" title="When to use each">
{`# npm install — development
# - Updates lock file if package.json changed
# - Adds/removes packages based on package.json
# - Use when: adding new deps, developing locally

# npm ci — CI/CD and production
# - Reads lock file ONLY (never modifies it)
# - Fails if package.json and lock file are out of sync
# - Deletes node_modules first (clean slate)
# - Faster than npm install in CI (parallel installs)
# - Use when: CI pipelines, Docker builds, deploying

# Detecting sync issues:
npm ci
# → npm ERR! Invalid: lock file's react@18.2.0 does not satisfy react@^18.3.0
# → Fix: run npm install to update lock file`}
      </CodeBlock>

      <h2>Lock File Conflicts</h2>

      <CodeBlock language="bash" title="Resolving lock file merge conflicts">
{`# Lock file conflicts happen when two branches both modify dependencies

# Option 1: Accept one side and reinstall (recommended)
git checkout main -- package-lock.json
npm install    # regenerates lock file with all changes merged

# Option 2: Manual merge (advanced)
# Lock files are hard to merge manually — prefer Option 1

# Option 3: Delete and regenerate
rm package-lock.json
npm install

# Best practices to reduce conflicts:
# - Make dependency changes in separate PRs
# - Never manually edit the lock file
# - Use npm --save-exact for critical dependencies
# - Run npm install on a dedicated branch after merging package.json changes`}
      </CodeBlock>

      <h2>Lock File Security</h2>

      <CodeBlock language="bash" title="Integrity verification">
{`# The integrity field in package-lock.json is a SHA-512 hash
# npm verifies downloaded packages against this hash
# Prevents tampered packages from being installed

# "integrity": "sha512-/3IjMib3Ij4..."

# npm audit — check for known vulnerabilities
npm audit
npm audit --audit-level moderate  # exit code 1 if moderate+ vulns
npm audit fix                     # auto-fix compatible upgrades
npm audit fix --force             # upgrade major versions (breaking!)

# Review audit output carefully:
# ✗ critical: 1    (update ASAP)
# ✗ high: 2        (update soon)
# ⚠ moderate: 3    (update when possible)
# ℹ low: 5         (informational)

# Ignore specific advisory (if not applicable):
# .npmrc:
# audit-resolve-paths=false`}
      </CodeBlock>

      <h2>yarn.lock vs package-lock.json</h2>

      <CodeBlock language="yaml" title="yarn.lock format">
{`# yarn.lock uses a custom format (not JSON/YAML)
"react@^18.2.0":
  version "18.2.0"
  resolved "https://registry.yarnpkg.com/react/-/react-18.2.0.tgz#..."
  integrity sha512-...
  dependencies:
    loose-envify "^1.1.0"

# Key difference from package-lock.json:
# yarn.lock is simpler and human-readable
# package-lock.json v3 also includes the dependency graph
# Both achieve the same goal: deterministic installs`}
      </CodeBlock>

      <CodeBlock language="bash" title="pnpm-lock.yaml">
{`# pnpm-lock.yaml is the most verbose but most precise
# It includes the lockfileVersion, importers, and packages sections

# importers — what each workspace package declared
importers:
  .:
    dependencies:
      react:
        specifier: ^18.2.0
        version: 18.2.0

# packages — resolved versions with deps and integrity
packages:
  react@18.2.0:
    resolution: {integrity: sha512-...}
    engines: {node: '>=0.10.0'}
    dependencies:
      loose-envify: 1.4.0
    dev: false`}
      </CodeBlock>

      <InfoBox variant="tip" title="One Package Manager Per Project">
        <p>
          Never mix package managers on the same project. Running both <code>npm install</code> and
          <code>yarn install</code> creates two lock files with potentially different resolved versions.
          Use the <code>packageManager</code> field in <code>package.json</code> and enable Corepack
          to enforce the correct package manager.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the 'integrity' field in package-lock.json used for?"
        options={[
          "Tracks which developer last modified the dependency",
          "A SHA-512 hash used to verify downloaded packages have not been tampered with",
          "Records the license compatibility of the package",
          "Stores the package's digital signature for publishing"
        ]}
        correctIndex={1}
        explanation="The integrity field contains a Subresource Integrity (SRI) hash (sha512-...) of the package tarball. When npm downloads a package, it computes the hash of the downloaded file and compares it to the value in the lock file. If they don't match, npm refuses to install and reports an error. This prevents supply chain attacks where a malicious package is substituted in the registry."
      />

      <InteractiveChallenge
        question="When should you commit package-lock.json to source control?"
        options={[
          "Only for applications, not for libraries",
          "Always — for both applications and libraries",
          "Never — it should be generated fresh on each machine",
          "Only when deploying to production"
        ]}
        correctIndex={1}
        explanation="Always commit lock files. For applications: they ensure every developer, CI server, and deployment uses the exact same dependency versions — eliminating 'works on my machine' bugs. For libraries: the lock file is used for development and testing the library itself. When users install your library, npm uses THEIR lock file (not yours), so publishing the lock file doesn't affect users."
      />
    </LessonLayout>
  );
}
