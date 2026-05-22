import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Lockfile() {
  return (
    <LessonLayout
      title="Lockfiles & Reproducibility"
      sectionId="npm-deep-dive"
      lessonIndex={3}
      prev={{ path: '/npm-deep-dive/node-modules', label: 'node_modules & Hoisting' }}
      next={{ path: '/npm-deep-dive/scripts', label: 'Scripts & Lifecycle Hooks' }}
    >
      <h2>Why Lockfiles Exist</h2>
      <p>
        Your package.json says <code>"lodash": "^4.17.0"</code>. Today that resolves to 4.17.21.
        Next month, lodash publishes 4.17.22. Without a lockfile, your coworker's
        <code>npm install</code> gets 4.17.22 while yours still has 4.17.21. Multiply this
        by hundreds of transitive dependencies and you get "works on my machine" bugs that
        are nearly impossible to debug.
      </p>

      <p>
        The lockfile solves this by recording the <strong>exact</strong> resolved version of
        every package in your tree — including transitive dependencies. When the lockfile exists,
        <code>npm install</code> uses those exact versions instead of re-resolving ranges.
      </p>

      <InfoBox variant="danger" title="The Real-World Horror">
        Without lockfiles, a patch release of a transitive dependency (something you've never
        heard of, 4 levels deep) can silently break your production build. The lockfile is your
        guarantee that if it works on your machine, it works on CI and in production.
      </InfoBox>

      <h2>package-lock.json Structure</h2>
      <p>
        Let's look at what's actually inside a lockfile. It's a JSON document that maps
        every installed package to its exact resolved metadata:
      </p>

      <CodeBlock language="json" title="package-lock.json (simplified excerpt)">
{`{
  "name": "my-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "my-app",
      "version": "1.0.0",
      "dependencies": {
        "express": "^4.18.0"
      }
    },
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-5/PsL6iGPdfQ/lKM1UuielYgv3BUoJfz1aUwU9vHZ+J7gyvwdQXFEBIEIaxeGf0GIcreATNyBExtalisDbuMg==",
      "dependencies": {
        "accepts": "~1.3.8",
        "body-parser": "1.20.1",
        "cookie": "0.5.0"
      },
      "engines": {
        "node": ">= 0.10.0"
      }
    },
    "node_modules/accepts": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
      "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
      "dependencies": {
        "mime-types": "~2.1.34",
        "negotiator": "0.6.3"
      }
    }
  }
}`}
      </CodeBlock>

      <h3>Key Fields Explained</h3>
      <CodeBlock language="bash" title="What each field means">
{`# "version": "4.18.2"
# The EXACT version installed. Not a range — a single version.

# "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz"
# The exact URL where the tarball was downloaded from.
# Useful for auditing and for private registry setups.

# "integrity": "sha512-5/PsL6iGPdfQ/..."
# A cryptographic hash (SHA-512) of the tarball contents.
# npm verifies this on install — if the hash doesn't match,
# the install FAILS. This prevents tampered packages.

# "dependencies": { ... }
# The dependency ranges this specific package needs.
# These get resolved recursively.

# "lockfileVersion": 3
# v1: npm 5-6 (included both packages and dependencies fields)
# v2: npm 7-8 (backward compatible, both fields)
# v3: npm 9+ (only packages field, smaller file)`}
      </CodeBlock>

      <h2>npm install vs npm ci</h2>
      <p>
        These two commands look similar but behave fundamentally differently. Understanding
        the distinction is critical for reliable CI/CD pipelines.
      </p>

      <FlowChart
        title="npm install vs npm ci"
        chart={"graph TD\n  A[npm install] --> B[Read package.json]\n  B --> C[Read package-lock.json]\n  C --> D[Resolve any new/updated deps]\n  D --> E[Update node_modules in place]\n  E --> F[May update package-lock.json]\n  G[npm ci] --> H[Read ONLY package-lock.json]\n  H --> I{Lock matches package.json?}\n  I -->|No| J[ERROR - fail immediately]\n  I -->|Yes| K[Delete entire node_modules]\n  K --> L[Install exact versions from lock]\n  L --> M[Never modifies lockfile]"}
      />

      <CodeBlock language="bash" title="When to use each">
{`# npm install — for DEVELOPMENT
# - Reads package.json, resolves ranges
# - Keeps existing node_modules, adds/updates as needed
# - MAY update package-lock.json (new deps, updated ranges)
# - Slower for clean installs, faster for incremental
npm install

# npm ci — for CI/CD and PRODUCTION
# - Reads ONLY package-lock.json
# - Fails if lockfile is out of sync with package.json
# - Deletes node_modules completely, fresh install
# - Never writes to package-lock.json
# - Faster for clean installs (no resolution step)
# - Guarantees reproducibility
npm ci

# Rule of thumb:
# Local development: npm install
# CI pipelines: npm ci
# Docker builds: npm ci
# Production deploys: npm ci`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always npm ci in CI">
        If your CI pipeline uses <code>npm install</code> instead of <code>npm ci</code>,
        you're not getting reproducible builds. A new patch release published between your
        local install and the CI run could change behavior. <code>npm ci</code> guarantees
        byte-for-byte identical node_modules from the lockfile.
      </InfoBox>

      <h2>When to Commit Lockfiles</h2>

      <CodeBlock language="bash" title="Lockfile commit rules">
{`# APPLICATIONS (deployed code): ALWAYS commit package-lock.json
# - Web apps, APIs, CLIs, microservices
# - You want reproducible builds in production
# - Every developer and CI should use the same versions
# Add to git:
git add package-lock.json

# LIBRARIES (published to npm): DEBATABLE
# - Some say: don't commit (consumers use their own resolution)
# - Others say: commit (for reproducible development/testing)
# - The lockfile is NEVER published to npm regardless
# - npm ignores lockfiles of dependencies
# Modern consensus: commit it for better contributor experience

# NEVER commit:
# - node_modules/ (always in .gitignore)
# - node_modules/.package-lock.json (internal cache)`}
      </CodeBlock>

      <h2>Lockfile Merge Conflicts</h2>
      <p>
        When two branches modify dependencies, the lockfile will have merge conflicts.
        The JSON structure makes manual merging impractical. Here's the standard fix:
      </p>

      <CodeBlock language="bash" title="Resolving lockfile merge conflicts">
{`# Option 1: The safe approach
# Accept either version of the lockfile, then regenerate
git checkout --theirs package-lock.json   # or --ours
npm install
git add package-lock.json

# Option 2: Delete and regenerate
rm package-lock.json
npm install
git add package-lock.json

# Option 3: npm can auto-resolve (npm 8+)
# If package.json is correctly merged, just run:
npm install --package-lock-only
# This regenerates the lockfile without installing anything

# Pro tip: add to .gitattributes to simplify merges
# .gitattributes:
# package-lock.json merge=ours`}
      </CodeBlock>

      <InfoBox variant="warning" title="Don't Blindly Regenerate">
        When you delete and regenerate a lockfile, you might get newer versions of transitive
        dependencies. This is usually fine, but be aware that you're potentially changing
        hundreds of package versions at once. Run your tests after regenerating.
      </InfoBox>

      <h2>Update Lockfile Without Installing</h2>

      <CodeBlock language="bash" title="Lockfile-only operations">
{`# Update lockfile without touching node_modules
npm install --package-lock-only

# Useful when:
# - Resolving merge conflicts
# - Updating lockfile format (e.g., v2 → v3)
# - CI that only needs to verify the lockfile is in sync
# - You're on a plane with no disk space for node_modules

# Check if lockfile is in sync with package.json
npm install --package-lock-only --dry-run
# If this would change the lockfile, they're out of sync`}
      </CodeBlock>

      <h2>Integrity Hashes</h2>
      <p>
        Every entry in the lockfile includes an <code>integrity</code> field containing a
        SHA-512 hash (in Subresource Integrity format). This is npm's defense against
        tampered packages.
      </p>

      <CodeBlock language="bash" title="How integrity checking works">
{`# The integrity hash in the lockfile:
# "integrity": "sha512-5/PsL6iGPdfQ/lKM1UuielYgv3BUoJ..."

# When npm installs a package:
# 1. Download the tarball (or read from cache)
# 2. Compute SHA-512 hash of the tarball
# 3. Compare with integrity hash in lockfile
# 4. If mismatch → REFUSE to install (possible tampering)

# You can verify manually:
shasum -a 512 ~/.npm/_cacache/content-v2/sha512/...

# If you see EINTEGRITY errors:
# "EINTEGRITY sha512-... integrity checksum failed"
# This means the cached tarball doesn't match the lockfile
# Fix: clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install`}
      </CodeBlock>

      <h2>Lockfile Comparison: npm vs yarn vs pnpm</h2>

      <CodeBlock language="bash" title="The three lockfile formats">
{`# npm: package-lock.json (JSON)
# - Verbose but machine-readable
# - lockfileVersion 3 is current
# - Stores full resolution metadata

# yarn: yarn.lock (custom format)
# - More human-readable than JSON
# - Groups version ranges that resolve to the same version
# - Example:
#   lodash@^4.17.0, lodash@^4.17.15:
#     version "4.17.21"
#     resolved "https://registry.yarnpkg.com/lodash/-/lodash-4.17.21.tgz"
#     integrity sha512-v2kDE...

# pnpm: pnpm-lock.yaml (YAML)
# - Most human-readable
# - Includes importers (workspace info)
# - Separates packages from their dependency relationships
# - Example:
#   packages:
#     /express/4.18.2:
#       resolution: {integrity: sha512-...}
#       dependencies:
#         accepts: 1.3.8

# All three serve the same purpose:
# Pin exact versions for reproducible installs`}
      </CodeBlock>

      <InteractiveChallenge
        question="Your CI pipeline runs 'npm install' instead of 'npm ci'. What risk does this create?"
        options={[
          "No risk — they do the same thing",
          "npm install is slower so CI takes longer",
          "npm install might resolve newer versions than the lockfile specifies, creating inconsistency",
          "npm install skips security checks"
        ]}
        correctIndex={2}
        explanation="npm install reads package.json ranges and may resolve to newer versions than what's in the lockfile, potentially updating the lockfile. This means CI could test different code than what developers have locally. npm ci reads ONLY the lockfile and fails if there's a mismatch, guaranteeing reproducibility."
      />

      <InteractiveChallenge
        question="What does the 'integrity' field in package-lock.json protect against?"
        options={[
          "Packages being deleted from the registry",
          "Network errors during download",
          "Tampered or corrupted package contents",
          "Version conflicts between dependencies"
        ]}
        correctIndex={2}
        explanation="The integrity field contains a SHA-512 hash of the package tarball. When npm downloads or reads a package from cache, it computes the hash and compares it to the lockfile. If they don't match, the package has been tampered with or corrupted, and npm refuses to install it."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Lockfiles pin exact versions of every dependency (including transitive) for reproducibility</li>
        <li>package-lock.json stores resolved versions, tarball URLs, and integrity hashes</li>
        <li><code>npm install</code> is for development (may update lockfile); <code>npm ci</code> is for CI/production (lockfile-only, fails on mismatch)</li>
        <li>Always commit lockfiles for applications; do it for libraries too for better DX</li>
        <li>Resolve lockfile merge conflicts by regenerating: <code>npm install --package-lock-only</code></li>
        <li>Integrity hashes (SHA-512) verify package contents haven't been tampered with</li>
        <li>All package managers (npm, yarn, pnpm) have lockfiles — same concept, different formats</li>
      </ul>
    </LessonLayout>
  );
}
