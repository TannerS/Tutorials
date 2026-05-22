import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmResolution() {
  return (
    <LessonLayout
      title="Dependency Resolution"
      sectionId="npm-deep-dive"
      lessonIndex={1}
      prev={{ path: '/npm-deep-dive/intro', label: 'npm Introduction' }}
      next={{ path: '/npm-deep-dive/node-modules', label: 'node_modules Structure' }}
    >
      <h2>Semantic Versioning (Semver)</h2>
      <p>
        npm uses semver for versioning. Every package version is <code>MAJOR.MINOR.PATCH</code>.
        The version ranges in package.json specify which updates are acceptable.
      </p>

      <CodeBlock language="bash" title="Semver rules">
{`# MAJOR.MINOR.PATCH
# MAJOR: breaking changes
# MINOR: new features, backwards compatible
# PATCH: bug fixes, backwards compatible

# Version ranges in package.json:
"react": "18.2.0"      # exact — only this version
"react": "^18.2.0"     # caret — 18.x.x (minor + patch updates ok)
"react": "~18.2.0"     # tilde — 18.2.x (patch updates only)
"react": ">=18.0.0"    # at least 18.0.0
"react": "18.x"        # any 18 minor version
"react": "*"           # any version (avoid!)
"react": "latest"      # latest tag (avoid in prod!)
"react": "18.2.0 - 19.0.0"  # range

# Pre-release versions
"react": "19.0.0-rc.1"  # release candidate
"react": "^18.0.0-0"    # include pre-releases of 18

# npm semver calculator: semver.npmjs.com`}
      </CodeBlock>

      <h2>Resolution Algorithm</h2>
      <p>
        When you run <code>npm install</code>, npm resolves the complete dependency tree by fetching
        the metadata for every package and finding a set of versions that satisfies all constraints.
      </p>

      <FlowChart
        title="Dependency Resolution Steps"
        chart={"graph TD\n  A[npm install] --> B[Read package.json]\n  B --> C[Fetch registry metadata]\n  C --> D[Resolve version ranges]\n  D --> E[Build dependency tree]\n  E --> F{Conflicts?}\n  F -- No --> G[Install flat where possible]\n  F -- Yes --> H[Nest conflicting versions]\n  G --> I[Write package-lock.json]\n  H --> I"}
      />

      <CodeBlock language="bash" title="Resolution example">
{`# Your package.json:
# "react": "^18.2.0"
# "react-query": "^5.0.0"  (requires react@^18)
# "react-router": "^6.0.0" (requires react@^18)

# npm resolves a single compatible version:
# react@18.2.0 — satisfies all constraints
# Installed once at root level (hoisted)

# Conflict scenario:
# "old-library": "^1.0.0"  (requires react@^16)
# React 18 and React 16 cannot coexist at root
# npm nests old-library/node_modules/react@16.x
# Your app uses react@18, old-library uses react@16
# (duplicate react = bugs! use resolutions to force version)

# Force a specific version with overrides (npm 8.3+)
{
  "overrides": {
    "react": "18.2.0"  // force ALL deps to use this version
  }
}`}
      </CodeBlock>

      <h2>Peer Dependencies</h2>
      <p>
        Peer dependencies specify that a package expects the host application to provide a certain
        dependency. React plugins list React as a peer dep — they use the app's React, not their own.
      </p>

      <CodeBlock language="json" title="peerDependencies">
{`// In a library's package.json:
{
  "name": "react-hooks-lib",
  "peerDependencies": {
    "react": ">=17.0.0"    // expects host to provide react
  },
  "peerDependenciesMeta": {
    "react-dom": {
      "optional": true     // peer dep that isn't required
    }
  },
  "devDependencies": {
    "react": "^18.2.0"   // for testing the library itself
  }
}

// npm 7+ automatically installs peer deps
// To skip: npm install --legacy-peer-deps
// To check: npm install --strict-peer-deps

// Common peer dep error:
// "react@16.8.0 is not compatible with react@^17.0.0"
// Fix: upgrade the host app's react version`}
      </CodeBlock>

      <h2>Optional Dependencies</h2>

      <CodeBlock language="json" title="optionalDependencies">
{`// Optional deps: npm tries to install them, but does not fail if it can't
// Use for: platform-specific native modules, fallback implementations
{
  "optionalDependencies": {
    "fsevents": "^2.3.0"    // macOS file watching (not on Linux/Windows)
  }
}

// In code, handle the optional dep being absent:
let fsevents
try {
  fsevents = require('fsevents')
} catch {
  // fsevents not available on this platform
  fsevents = null
}`}
      </CodeBlock>

      <h2>npm Overrides and Resolutions</h2>

      <CodeBlock language="json" title="Forcing dependency versions">
{`// npm 8.3+ overrides — force a specific version for any package in the tree
{
  "overrides": {
    "lodash": "^4.17.21",       // force all lodash to 4.x
    "some-package": {
      "lodash": "^4.17.21"      // only for some-package's lodash
    }
  }
}

// yarn resolutions (equivalent)
{
  "resolutions": {
    "lodash": "^4.17.21"
  }
}

// pnpm overrides
{
  "pnpm": {
    "overrides": {
      "lodash": "^4.17.21"
    }
  }
}

// Use case: security vulnerabilities in transitive deps
// npm audit may tell you "upgrade lodash to 4.17.21"
// But you don't depend on lodash directly — use overrides`}
      </CodeBlock>

      <h2>dist-tags</h2>

      <CodeBlock language="bash" title="npm dist-tags">
{`# dist-tags map a label to a version
# npm install react@latest   → installs the 'latest' tagged version
# npm install react@next     → installs the 'next' tagged version (pre-release)
# npm install react@legacy   → installs a legacy version

# View dist-tags for a package
npm dist-tag ls react
# latest: 18.2.0
# next: 19.0.0-rc.1
# experimental: 0.0.0-experimental-...

# Set a dist-tag (for publishers)
npm dist-tag add my-package@1.2.3 stable
npm dist-tag add my-package@2.0.0-beta.1 next`}
      </CodeBlock>

      <InfoBox variant="warning" title="Caret Range Gotcha">
        <p>
          <code>^0.x.x</code> behaves differently than <code>^1.x.x</code>. For versions below 1.0.0,
          the caret only allows patch updates: <code>^0.2.3</code> matches <code>0.2.x</code> but NOT <code>0.3.x</code>.
          This is because pre-1.0 packages consider minor version bumps as potentially breaking.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What does '^18.2.0' mean as a version range in package.json?"
        options={[
          "Exactly version 18.2.0",
          "18.2.0 or higher — compatible with 18.x.x but not 19.0.0",
          "18.2.x — only patch updates allowed",
          "Any version greater than 18.2.0"
        ]}
        correctIndex={1}
        explanation="The caret (^) allows compatible updates. For ^18.2.0, npm will accept any version >=18.2.0 and <19.0.0. This means minor version bumps (18.3.0, 18.4.0) and patch updates (18.2.1) are all accepted, but 19.0.0 is not (as it may have breaking changes). The tilde (~18.2.0) is more restrictive: only patch updates (18.2.x)."
      />

      <InteractiveChallenge
        question="What are peer dependencies used for?"
        options={[
          "Dependencies that are shared between multiple packages in a monorepo",
          "Packages the host application must provide — the library uses the app's copy rather than bundling its own",
          "Optional dependencies that improve performance if available",
          "Dependencies only needed during the build process"
        ]}
        correctIndex={1}
        explanation="Peer dependencies declare that a package expects the consuming application to provide a certain dependency. For example, a React component library lists 'react' as a peer dependency because it wants to use the same React instance as the host app. Bundling its own React would create two separate React instances, breaking hooks (which rely on a single React context per app)."
      />
    </LessonLayout>
  );
}
