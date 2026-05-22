import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpkgPublishing() {
  return (
    <LessonLayout
      title="Publishing to npm"
      sectionId="npm-packages"
      lessonIndex={3}
      prev={{ path: '/npm-packages/modules', label: 'CJS vs ESM' }}
      next={{ path: '/npm-packages/advanced', label: 'Advanced Packaging' }}
    >
      <h2>Publishing to the npm Registry</h2>
      <p>
        Publishing makes your package available to the world. The process: authenticate,
        build, version, and publish. Automate it with CI for reliable releases.
      </p>

      <FlowChart
        title="Publishing Workflow"
        chart={"graph LR\n  A[Write code] --> B[npm version]\n  B --> C[git tag + push]\n  C --> D[CI runs tests]\n  D --> E[npm publish]\n  E --> F[npm registry]\n  F --> G[Users install]"}
      />

      <h2>First-Time Setup</h2>

      <CodeBlock language="bash" title="Authentication setup">
{`# Create an npm account at npmjs.com, then:
npm login
# Username: your-username
# Password: ••••••••
# Email: you@example.com
# OTP: 123456  (if 2FA enabled)

# Verify login
npm whoami

# Enable 2FA (strongly recommended for publishing)
npm profile enable-2fa auth-and-writes

# For scoped packages: create an org
# npmjs.com → Add Organization → @your-org
# Free orgs can publish public scoped packages`}
      </CodeBlock>

      <h2>Pre-Publish Checklist</h2>

      <CodeBlock language="bash" title="Before publishing">
{`# 1. Verify package contents
npm pack --dry-run     # see what will be published
# or
npm pack               # creates my-package-1.0.0.tgz
tar tf my-package-1.0.0.tgz  # inspect

# 2. Test locally before publishing
mkdir /tmp/test-app && cd /tmp/test-app
npm init -y
npm install /path/to/my-package-1.0.0.tgz
# Test that the package works correctly

# 3. Check package.json is correct
# - name, version, main/exports, files, license

# 4. Run tests
npm test

# 5. Build
npm run build

# 6. Check version
cat package.json | grep version`}
      </CodeBlock>

      <h2>Publishing</h2>

      <CodeBlock language="bash" title="npm publish">
{`# Public unscoped package
npm publish

# Public scoped package (requires --access public)
npm publish --access public

# Pre-release (tagged as 'beta' — not installed by 'npm install pkg')
npm publish --tag beta
# Users install with: npm install my-package@beta

# Publish specific version
npm version 1.2.0
npm publish

# Dry run (shows what would be published, no actual upload)
npm publish --dry-run

# After publish, verify:
npm info my-package
npm info @myorg/my-package
# Should show the new version`}
      </CodeBlock>

      <h2>Semantic Versioning for Releases</h2>

      <CodeBlock language="bash" title="Version management">
{`# When to bump each version:
# PATCH (1.0.0 → 1.0.1): Bug fix, no API change
# MINOR (1.0.0 → 1.1.0): New feature, backwards compatible
# MAJOR (1.0.0 → 2.0.0): Breaking change

# npm version automatically:
# 1. Updates package.json version
# 2. Creates a git commit
# 3. Creates a git tag

npm version patch    # fix: 1.0.0 → 1.0.1
npm version minor    # feat: 1.0.0 → 1.1.0
npm version major    # BREAKING: 1.0.0 → 2.0.0

# Pre-releases
npm version prerelease --preid=beta   # 1.0.0 → 1.0.1-beta.0
npm version prerelease --preid=beta   # 1.0.1-beta.0 → 1.0.1-beta.1
npm version 1.0.1                     # promote pre-release to release

# Push everything including tags
git push && git push --tags`}
      </CodeBlock>

      <h2>CI Publishing with GitHub Actions</h2>

      <CodeBlock language="yaml" title=".github/workflows/publish.yml">
{`name: Publish to npm

on:
  push:
    tags:
      - 'v*'   # Trigger on version tags (v1.2.3)

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write    # for provenance

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          cache: 'npm'

      - run: npm ci

      - run: npm test

      - name: Build
        run: npm run build

      - name: Publish
        run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
          # Store NPM_TOKEN in GitHub → Settings → Secrets`}
      </CodeBlock>

      <h2>Release Automation with Changesets</h2>

      <CodeBlock language="bash" title="Changesets for managing releases">
{`# Install changesets
npm install --save-dev @changesets/cli
npx changeset init

# Workflow:
# 1. Developer adds a changeset when making a change
npx changeset add
# → prompts: what changed? major/minor/patch?
# → creates .changeset/some-name.md

# 2. CI opens a "Version Packages" PR (using action)
# 3. On merge: bumps versions, updates CHANGELOG.md, publishes

# .changeset/my-change.md (auto-generated)
---
"@myorg/my-lib": minor
---
Added a new helper function for formatting dates

# .github/workflows/release.yml
- uses: changesets/action@v1
  with:
    publish: npm run release
  env:
    GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: \${{ secrets.NPM_TOKEN }}`}
      </CodeBlock>

      <h2>Deprecating and Unpublishing</h2>

      <CodeBlock language="bash" title="Managing published versions">
{`# Deprecate a version (shows warning on install)
npm deprecate my-package@1.0.0 "Use my-package@2.0.0 instead"
npm deprecate "my-package@<2.0.0" "Please upgrade to v2"

# Unpublish (within 72 hours of publish)
npm unpublish my-package@1.0.0
npm unpublish my-package --force    # remove entire package

# After 72 hours, you cannot unpublish (by design)
# This prevents breaking existing installs
# Contact npm support for exceptional cases

# Transferring ownership
npm owner add other-user my-package
npm owner rm old-user my-package
npm owner ls my-package`}
      </CodeBlock>

      <InfoBox variant="warning" title="The left-pad Incident">
        <p>
          In 2016, a developer unpublished the popular <code>left-pad</code> package from npm.
          This broke thousands of projects including React and Babel. npm now requires support contact
          for unpublishing packages installed more than 300 times per week or that other packages depend on.
          The 72-hour window for self-unpublish is a safety measure.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="When publishing a public scoped package (@myorg/my-lib), what flag must you add to npm publish?"
        options={[
          "--scope=@myorg",
          "--access public",
          "--public",
          "--registry=https://registry.npmjs.org"
        ]}
        correctIndex={1}
        explanation="Scoped packages (@org/name) are private by default on npm. Without --access public, npm assumes you want to publish privately and requires a paid subscription. Adding --access public explicitly marks the package as publicly accessible. You can also set this permanently in package.json: { 'publishConfig': { 'access': 'public' } }."
      />

      <InteractiveChallenge
        question="What does publishing with a non-default dist-tag (e.g., npm publish --tag beta) mean for users?"
        options={[
          "The package is only accessible to beta testers",
          "npm install my-package won't install it — users must explicitly use @beta",
          "The package is marked as experimental and shows a warning",
          "The package expires after 30 days unless promoted"
        ]}
        correctIndex={1}
        explanation="The 'latest' dist-tag is what npm install uses by default. Publishing with --tag beta assigns the 'beta' dist-tag instead of 'latest'. This means 'npm install my-package' still installs the previous 'latest' version. To install the beta, users must explicitly run 'npm install my-package@beta'. This is the safe way to publish pre-releases without affecting existing users."
      />
    </LessonLayout>
  );
}
