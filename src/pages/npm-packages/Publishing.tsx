import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Publishing() {
  return (
    <LessonLayout
      title="Publishing & Versioning"
      sectionId="npm-packages"
      lessonIndex={3}
      prev={{ path: '/npm-packages/modules', label: 'CJS vs ESM & Dual Publishing' }}
      next={{ path: '/npm-packages/advanced', label: 'Monorepo Packages & Best Practices' }}
    >
      <h2>Publishing for the First Time</h2>
      <p>
        Publishing to npm is surprisingly simple once your package is built and tested.
        Here's the exact sequence of commands:
      </p>

      <CodeBlock language="bash" title="First-time publish workflow">
{`# 1. Create an npm account (if you haven't)
npm adduser
# or sign up at npmjs.com, then:
npm login

# 2. Verify you're logged in
npm whoami
# Output: your-username

# 3. Check the package name is available
npm info my-package-name
# 404 = available, otherwise it's taken

# 4. Make sure your package is ready
npm pack --dry-run    # verify published files
npx publint           # check for common mistakes

# 5. Publish!
npm publish
# For scoped packages (@org/name), they're private by default:
npm publish --access public

# 6. Verify on npmjs.com
open https://www.npmjs.com/package/my-package-name`}
      </CodeBlock>

      <InfoBox variant="tip" title="Dry Run Everything First">
        Before your first real publish, do a complete dry run:
        <code>npm publish --dry-run</code> shows exactly what would happen without actually
        publishing. You can also publish to a local Verdaccio registry for testing.
      </InfoBox>

      <h2>Scoped Packages</h2>
      <CodeBlock language="bash" title="Working with scoped packages">
{`# Scoped packages: @scope/package-name
# Scopes map to npm organizations or your username

# Create an org on npmjs.com, then:
npm publish --access public
# Scoped packages default to RESTRICTED (private, paid feature)
# Use --access public for open-source scoped packages

# Or set it permanently in package.json:
# "publishConfig": { "access": "public" }

# Installing scoped packages (same as unscoped):
npm install @myorg/utils

# Importing:
import { slugify } from '@myorg/utils';

# Advantages of scopes:
# - Namespace prevents name collisions
# - All @myorg/* packages are clearly from your org
# - Can route to private registry per-scope
# - No typosquatting risk within your scope`}
      </CodeBlock>

      <h2>Versioning Strategy</h2>
      <p>
        Semver isn't just a format — it's a promise to your consumers. Break it and you
        break their builds. Here's when to bump each number:
      </p>

      <CodeBlock language="bash" title="When to bump each version component">
{`# PATCH (1.0.0 → 1.0.1): Bug fixes, no API changes
# - Fixed a typo in output
# - Corrected an edge case that returned wrong result
# - Performance improvement with no behavior change
# - Updated internal dependency for security

# MINOR (1.0.0 → 1.1.0): New features, backward compatible
# - Added a new exported function
# - Added optional parameters to existing function
# - New configuration option with a default value
# - Deprecated a function (but still works)

# MAJOR (1.0.0 → 2.0.0): Breaking changes
# - Removed a function or parameter
# - Changed return type
# - Renamed exports
# - Changed default behavior
# - Dropped Node.js version support
# - Changed from CJS to ESM-only`}
      </CodeBlock>

      <h3>npm version Command</h3>
      <CodeBlock language="bash" title="Automated version bumping">
{`# npm version does three things:
# 1. Bumps version in package.json
# 2. Creates a git commit
# 3. Creates a git tag

npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0

# Pre-release versions:
npm version prepatch   # 1.0.0 → 1.0.1-0
npm version preminor   # 1.0.0 → 1.1.0-0
npm version premajor   # 1.0.0 → 2.0.0-0
npm version prerelease # 2.0.0-0 → 2.0.0-1

# Set exact version:
npm version 3.0.0-beta.1

# Skip git tag:
npm version patch --no-git-tag-version

# Custom commit message:
npm version patch -m "Release v%s"
# %s is replaced with the new version number`}
      </CodeBlock>

      <h2>Pre-release Versions</h2>
      <CodeBlock language="bash" title="Pre-release publishing workflow">
{`# Pre-release versions let you publish unstable code
# without affecting users on the "latest" tag

# Alpha: early development, API may change drastically
npm version 2.0.0-alpha.1
npm publish --tag alpha
# Users install with: npm install my-pkg@alpha

# Beta: feature complete, may have bugs
npm version 2.0.0-beta.1
npm publish --tag beta
# Users install with: npm install my-pkg@beta

# Release candidate: final testing
npm version 2.0.0-rc.1
npm publish --tag next
# Users install with: npm install my-pkg@next

# Final release:
npm version 2.0.0
npm publish
# This goes to the "latest" tag by default`}
      </CodeBlock>

      <h2>Dist Tags</h2>
      <p>
        Dist tags are labels for specific versions. <code>latest</code> is the default —
        it's what users get with <code>npm install pkg</code>. You can create custom tags
        for pre-releases and parallel version tracks.
      </p>

      <CodeBlock language="bash" title="Working with dist tags">
{`# See all tags for a package
npm dist-tag ls my-package
# latest: 1.5.2
# next: 2.0.0-beta.3
# legacy: 1.4.9

# Publish to a specific tag
npm publish --tag next
npm publish --tag beta
npm publish --tag canary

# Move a tag to a different version
npm dist-tag add my-package@2.0.0 latest

# Remove a tag
npm dist-tag rm my-package next

# Install a specific tag
npm install my-package@next
npm install my-package@beta

# IMPORTANT: without --tag, npm publish updates "latest"
# NEVER publish a pre-release without --tag!
# npm publish  ← this makes 2.0.0-beta.3 the "latest" (bad!)
# npm publish --tag beta  ← correct`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Publish Pre-releases to 'latest'">
        If you accidentally publish a pre-release version without a tag, it becomes the
        <code>latest</code> and every <code>npm install your-pkg</code> gets your unstable
        code. Fix it immediately with: <code>npm dist-tag add your-pkg@stable-version latest</code>
      </InfoBox>

      <h2>The Full Publish Pipeline</h2>

      <FlowChart
        title="Complete Publish Workflow"
        chart={"graph TD\n  A[Ready to publish?] --> B[Run linter]\n  B --> C[Run tests]\n  C --> D[Run build]\n  D --> E[npm pack --dry-run]\n  E --> F[Verify files look correct]\n  F --> G[npm version patch/minor/major]\n  G --> H[npm publish]\n  H --> I[git push && git push --tags]\n  I --> J[Verify on npmjs.com]\n  J --> K[Create GitHub release]"}
      />

      <CodeBlock language="json" title="Automated pipeline in package.json">
{`{
  "scripts": {
    "prepublishOnly": "npm run ci",
    "ci": "npm run lint && npm run typecheck && npm run test && npm run build",
    "release:patch": "npm version patch && npm publish && git push --follow-tags",
    "release:minor": "npm version minor && npm publish && git push --follow-tags",
    "release:major": "npm version major && npm publish && git push --follow-tags"
  }
}`}
      </CodeBlock>

      <h2>Unpublishing and Deprecation</h2>
      <CodeBlock language="bash" title="Removing published packages">
{`# Unpublish a specific version (within 72 hours)
npm unpublish my-package@1.0.1

# Unpublish entire package (within 72 hours)
npm unpublish my-package --force

# After 72 hours: cannot unpublish (too many people may depend on it)
# The name is also blocked from reuse for 24 hours

# PREFERRED alternative: deprecate
npm deprecate my-package "This package is no longer maintained. Use better-package instead."
npm deprecate my-package@"< 2.0.0" "Upgrade to v2 for security fixes"

# Deprecation shows a warning on install but doesn't remove the package
# This is the responsible way to sunset a package`}
      </CodeBlock>

      <h2>Private Packages</h2>
      <CodeBlock language="bash" title="Private package options">
{`# Option 1: "private": true in package.json
# npm publish will refuse — protects against accidental publish
{
  "private": true
}

# Option 2: Private scoped package (paid npm feature)
{
  "name": "@mycompany/internal-utils",
  "publishConfig": {
    "access": "restricted"
  }
}

# Option 3: Private registry (self-hosted)
# .npmrc:
@mycompany:registry=https://npm.mycompany.com/
# Publish there instead of public npm

# Option 4: GitHub Packages (free for private repos)
# .npmrc:
@myorg:registry=https://npm.pkg.github.com/
# publishConfig.registry = https://npm.pkg.github.com/`}
      </CodeBlock>

      <h2>Automated Publishing with GitHub Actions</h2>

      <CodeBlock language="yaml" title=".github/workflows/publish.yml">
{`name: Publish to npm
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for provenance
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Setting up automated publishing">
{`# 1. Create an npm access token
npm token create --type=automation
# Copy the token

# 2. Add to GitHub repo secrets
# Settings → Secrets → Actions → New secret
# Name: NPM_TOKEN
# Value: npm_XXXXXXXXXXXXXXXX

# 3. Create a release on GitHub
# This triggers the workflow above
# The package version in package.json becomes the published version

# 4. Alternative trigger: publish on git tag push
# on:
#   push:
#     tags: ['v*']`}
      </CodeBlock>

      <h2>Changesets for Monorepos</h2>
      <CodeBlock language="bash" title="Brief intro to changesets">
{`# Changesets manages versioning across multiple packages in a monorepo
npm install -D @changesets/cli
npx changeset init

# When you make a change:
npx changeset
# Prompts: which packages changed? major/minor/patch? description?
# Creates: .changeset/random-name.md

# When ready to release:
npx changeset version   # Bumps versions, updates changelogs
npx changeset publish   # Publishes all changed packages

# Works great with: npm workspaces, turborepo, lerna`}
      </CodeBlock>

      <h2>npm Provenance</h2>
      <CodeBlock language="bash" title="Publishing with provenance">
{`# Provenance creates a cryptographic attestation that your package
# was built from a specific commit in a trusted CI environment

# Publish with provenance (from GitHub Actions, GitLab CI, etc.):
npm publish --provenance

# Requirements:
# - Must be published from a supported CI system
# - CI must have OIDC token permissions
# - Package must be linked to a public repository

# What it proves:
# - This exact tarball was built from commit abc123
# - It was built by GitHub Actions workflow X
# - No human touched the build between source and publish

# Users can verify:
npm audit signatures
# Shows which packages have verified provenance`}
      </CodeBlock>

      <InfoBox variant="tip" title="Always Use Provenance">
        If you publish from CI (which you should), add <code>--provenance</code> to your
        publish command. It costs nothing, requires no extra setup beyond OIDC permissions,
        and gives consumers cryptographic proof your package wasn't tampered with.
      </InfoBox>

      <h2>Practical: Publishing Step-by-Step</h2>

      <CodeBlock language="bash" title="End-to-end first publish">
{`# Assuming your package is built and tested:

# 1. Final checks
npm pack --dry-run          # verify contents
npx publint                 # check for issues
node -e "require('./dist/index.cjs')"   # test CJS
node --input-type=module -e "import './dist/index.mjs'"  # test ESM

# 2. Login (if not already)
npm login
npm whoami  # confirm

# 3. Set version
npm version 1.0.0  # first release

# 4. Publish
npm publish --access public  # for scoped packages
# or just:
npm publish                  # for unscoped packages

# 5. Verify
npm info my-package          # should show your package
npm install my-package       # test in a fresh project

# 6. Push tags to git
git push --follow-tags

# 7. For subsequent releases:
npm version patch  # or minor/major
npm publish
git push --follow-tags`}
      </CodeBlock>

      <InteractiveChallenge
        question="You published version 2.0.0-beta.1 without any --tag flag. What happened?"
        options={[
          "npm rejected the publish because it's a pre-release",
          "It was published under the 'beta' tag automatically",
          "It became the 'latest' tag, so npm install your-pkg now gets the beta",
          "Nothing special — pre-release versions are always installed explicitly"
        ]}
        correctIndex={2}
        explanation="Without a --tag flag, npm publish ALWAYS updates the 'latest' dist-tag — even for pre-release versions. This means every user running 'npm install your-pkg' now gets your unstable beta. You must always use --tag when publishing pre-releases: 'npm publish --tag beta'."
      />

      <InteractiveChallenge
        question="What's the difference between npm deprecate and npm unpublish?"
        options={[
          "They do the same thing but deprecate is newer",
          "unpublish removes the package entirely; deprecate keeps it available but shows a warning",
          "deprecate only works for old versions; unpublish works for any version",
          "unpublish is free; deprecate requires a paid account"
        ]}
        correctIndex={1}
        explanation="npm unpublish removes the package/version from the registry entirely (only works within 72 hours). npm deprecate keeps the package available and installable but shows a warning message to anyone who installs it. Deprecation is the preferred approach because removing packages can break other people's builds."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Publishing: <code>npm login</code> → <code>npm version</code> → <code>npm publish</code></li>
        <li>Scoped packages are private by default — use <code>--access public</code> for open source</li>
        <li>Follow semver strictly: patch (fixes), minor (features), major (breaking)</li>
        <li>Always use <code>--tag</code> for pre-releases to avoid polluting "latest"</li>
        <li>Automate publishing with GitHub Actions + provenance for security</li>
        <li>Prefer <code>npm deprecate</code> over unpublish when sunsetting packages</li>
        <li>Use changesets for monorepo versioning across multiple packages</li>
      </ul>
    </LessonLayout>
  );
}
