import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Resolution() {
  return (
    <LessonLayout
      title="Dependency Resolution"
      sectionId="npm-deep-dive"
      lessonIndex={1}
      prev={{ path: '/npm-deep-dive/intro', label: 'How npm Works' }}
      next={{ path: '/npm-deep-dive/node-modules', label: 'node_modules & Hoisting' }}
    >
      <h2>Semantic Versioning (semver)</h2>
      <p>
        Every npm package version follows the <strong>MAJOR.MINOR.PATCH</strong> convention.
        This isn't just a nice format — it's a contract between the package author and its consumers
        about what kinds of changes each release contains.
      </p>

      <CodeBlock language="bash" title="Semver breakdown">
{`# Version: 4.17.21
#           │  │   └── PATCH: bug fixes, no API changes
#           │  └────── MINOR: new features, backward compatible
#           └───────── MAJOR: breaking changes, may require code updates

# Examples:
# 1.0.0 → 1.0.1  (patch: fixed a typo in output)
# 1.0.0 → 1.1.0  (minor: added a new function)
# 1.0.0 → 2.0.0  (major: renamed a function, removed an option)

# Pre-release versions:
# 1.0.0-alpha.1  (early development, unstable)
# 1.0.0-beta.3   (feature complete, may have bugs)
# 1.0.0-rc.1     (release candidate, final testing)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Semver Is a Social Contract">
        Semver only works if authors follow it honestly. In practice, many packages accidentally
        ship breaking changes in minor or patch versions. This is why lockfiles exist — they
        protect you from unexpected changes even when authors mess up semver.
      </InfoBox>

      <h2>Version Ranges</h2>
      <p>
        When you declare a dependency in package.json, you usually don't pin an exact version.
        Instead, you specify a <strong>range</strong> that tells npm which versions are acceptable.
        Here's what each range operator means:
      </p>

      <CodeBlock language="json" title="Version range examples in package.json">
{`{
  "dependencies": {
    "exact":     "4.17.21",
    "caret":     "^4.17.21",
    "tilde":     "~4.17.21",
    "gte":       ">=4.17.0",
    "range":     ">=4.17.0 <5.0.0",
    "or":        "^2.0.0 || ^3.0.0",
    "any":       "*",
    "latest":    "latest"
  }
}`}
      </CodeBlock>

      <h3>Range Operators Explained</h3>
      <CodeBlock language="bash" title="What each range resolves to">
{`# ^4.17.21 (caret — the default when you npm install)
# Allows: 4.17.21, 4.17.22, 4.18.0, 4.99.99
# Blocks: 5.0.0
# Rule: "compatible with version" — allows MINOR and PATCH updates

# ~4.17.21 (tilde)
# Allows: 4.17.21, 4.17.22, 4.17.99
# Blocks: 4.18.0
# Rule: allows only PATCH updates

# ^0.2.3 (caret with major version 0 — SPECIAL CASE!)
# Allows: 0.2.3, 0.2.4, 0.2.99
# Blocks: 0.3.0
# Rule: when major is 0, caret acts like tilde (more conservative)

# ^0.0.3 (caret with 0.0.x — EVEN MORE SPECIAL)
# Allows: ONLY 0.0.3
# Rule: when major.minor are both 0, caret pins exactly

# 4.17.21 (no operator — exact match)
# Allows: ONLY 4.17.21
# Use with save-exact=true in .npmrc

# * (any version)
# Allows: anything — dangerous, never use in production

# >=4.0.0 <5.0.0 (explicit range)
# Equivalent to ^4.0.0`}
      </CodeBlock>

      <InfoBox variant="tip" title="Why Caret Is the Default">
        When you run <code>npm install lodash</code>, npm writes <code>"lodash": "^4.17.21"</code>
        to package.json (with a caret). This lets you automatically get bug fixes and new features
        without breaking changes. If you want exact versions, set <code>save-exact=true</code> in
        your .npmrc.
      </InfoBox>

      <h2>How npm Resolves the Dependency Tree</h2>
      <p>
        Resolution is recursive. npm starts with your package.json, resolves each dependency to
        a concrete version, then does the same for each dependency's dependencies, and so on.
      </p>

      <FlowChart
        title="Dependency Resolution Algorithm"
        chart={"graph TD\n  A[Read root package.json] --> B[For each dependency]\n  B --> C[Query registry for available versions]\n  C --> D[Find latest version matching range]\n  D --> E[Read THAT package's dependencies]\n  E --> F{More unresolved deps?}\n  F -->|Yes| B\n  F -->|No| G[Build complete dependency tree]\n  G --> H[Deduplicate compatible versions]\n  H --> I[Determine node_modules structure]"}
      />

      <CodeBlock language="bash" title="Visualize resolution in action">
{`# See what npm resolves without installing
npm install --dry-run

# View the full dependency tree
npm ls

# View tree with all levels
npm ls --all

# Find a specific package in the tree
npm ls lodash

# See WHY a package is installed
npm explain lodash
# or shorthand:
npm why lodash`}
      </CodeBlock>

      <h2>Version Conflicts</h2>
      <p>
        What happens when two packages need different versions of the same dependency?
        For example, your project uses package A (needs lodash@4.17.x) and package B
        (needs lodash@4.16.x).
      </p>

      <CodeBlock language="bash" title="Version conflict scenario">
{`# Your package.json:
#   "package-a": "^1.0.0"  → depends on lodash@^4.17.0
#   "package-b": "^2.0.0"  → depends on lodash@^4.16.0

# npm resolves this:
# Both ranges overlap! ^4.17.0 and ^4.16.0 both accept 4.17.21
# So npm installs lodash@4.17.21 ONCE (deduplication wins)

# But what if the ranges DON'T overlap?
#   "package-c": "^1.0.0"  → depends on lodash@^3.0.0
#   "package-d": "^2.0.0"  → depends on lodash@^4.0.0

# npm CANNOT deduplicate — installs BOTH versions:
# node_modules/
#   lodash/            (4.17.21 — hoisted)
#   package-c/
#     node_modules/
#       lodash/        (3.10.1 — nested, only visible to package-c)`}
      </CodeBlock>

      <FlowChart
        title="Conflict Resolution Strategy"
        chart={"graph TD\n  A[Two packages need same dep] --> B{Ranges overlap?}\n  B -->|Yes| C[Install one version satisfying both]\n  B -->|No| D[Install both versions]\n  C --> E[Hoist to top-level node_modules]\n  D --> F[Hoist newer version]\n  D --> G[Nest older version inside dependent]"}
      />

      <h2>Deduplication</h2>
      <p>
        npm aggressively deduplicates. If multiple packages can share a single version,
        npm hoists it to the top level. You can also force deduplication after the fact:
      </p>

      <CodeBlock language="bash" title="Deduplication commands">
{`# See duplicate packages in your tree
npm dedupe --dry-run

# Actually deduplicate (restructure node_modules)
npm dedupe

# Check for duplication issues
npm ls --all | grep "deduped"

# Example output of npm ls:
# my-app@1.0.0
# ├── express@4.18.2
# │   ├── accepts@1.3.8
# │   │   └── mime-types@2.1.35 deduped    ← shared!
# │   └── body-parser@1.20.1
# │       └── mime-types@2.1.35 deduped    ← same instance
# └── mime-types@2.1.35                     ← the single copy`}
      </CodeBlock>

      <h2>Peer Dependencies</h2>
      <p>
        Peer dependencies are a special declaration that says "I need this package, but I
        don't install it myself — my CONSUMER must provide it." This pattern exists primarily
        for plugins and framework extensions.
      </p>

      <CodeBlock language="json" title="Peer dependency example (a React component library)">
{`{
  "name": "my-ui-components",
  "version": "1.0.0",
  "peerDependencies": {
    "react": "^17.0.0 || ^18.0.0",
    "react-dom": "^17.0.0 || ^18.0.0"
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true
    }
  },
  "devDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`}
      </CodeBlock>

      <InfoBox variant="info" title="Why Peer Dependencies Exist">
        Without peer deps, a React component library would install its OWN copy of React.
        Now your app has two Reacts — hooks break, context doesn't work, bundle is doubled.
        Peer deps ensure everyone shares the same instance of critical packages.
      </InfoBox>

      <CodeBlock language="bash" title="Dealing with peer dependency warnings">
{`# npm 7+ auto-installs peer deps (npm 6 did not)
# This can cause conflicts:

# "ERESOLVE unable to resolve dependency tree"
# package-a needs react@^17.0.0 (peer)
# package-b needs react@^18.0.0 (peer)
# Your app has react@18.2.0

# Options:
npm install --legacy-peer-deps    # Skip peer dep resolution (npm 6 behavior)
npm install --force               # Force install, may break things

# Better: check if package-a has a newer version supporting React 18
npm info package-a peerDependencies`}
      </CodeBlock>

      <h2>Practical: Reading a Dependency Tree</h2>

      <CodeBlock language="bash" title="Exploring your dependency tree">
{`# Full tree (can be VERY long)
npm ls --all

# Just top-level deps
npm ls --depth=0

# Find all versions of a specific package
npm ls react --all

# Why is this package here?
npm explain accepts
# accepts@1.3.8
# node_modules/accepts
#   accepts@"~1.3.8" from express@4.18.2
#   node_modules/express
#     express@"^4.18.2" from the root project

# Check for issues
npm doctor

# See outdated packages with current/wanted/latest
npm outdated`}
      </CodeBlock>

      <InteractiveChallenge
        question={"If your package.json has \"lodash\": \"^4.17.0\" and the latest lodash is 5.1.0, what will npm install?"}
        options={[
          "5.1.0 (always gets latest)",
          "4.17.21 (latest 4.x version)",
          "4.17.0 (the exact version specified)",
          "It depends on the lockfile"
        ]}
        correctIndex={1}
        explanation="The caret (^) allows minor and patch updates within the same major version. So ^4.17.0 matches anything >=4.17.0 and <5.0.0. npm will install the latest version in that range, which would be 4.17.21 (assuming that's the latest 4.x). However, if a lockfile exists with a specific version pinned, npm install will use THAT version unless you run npm update."
      />

      <InteractiveChallenge
        question="What's the key difference between peerDependencies and regular dependencies?"
        options={[
          "Peer dependencies are faster to install",
          "Peer dependencies must be provided by the consuming project, not installed by the package itself",
          "Peer dependencies are only used in development",
          "Peer dependencies are always optional"
        ]}
        correctIndex={1}
        explanation="Peer dependencies declare that a package NEEDS another package but expects the consumer to provide it. This prevents duplicate installations of framework-level packages (like React) that must be singletons in the dependency tree."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Semver (MAJOR.MINOR.PATCH) is a contract — major = breaking, minor = features, patch = fixes</li>
        <li>Caret (^) is the default range — allows minor+patch updates within the same major</li>
        <li>Resolution is recursive: your deps have deps, which have deps, all the way down</li>
        <li>When version ranges overlap, npm deduplicates to a single version</li>
        <li>When ranges conflict, npm nests the conflicting version inside the package that needs it</li>
        <li>Peer deps prevent duplicate framework installations (React, Angular, etc.)</li>
        <li><code>npm ls</code>, <code>npm explain</code>, and <code>npm outdated</code> are your tree inspection tools</li>
      </ul>
    </LessonLayout>
  );
}
