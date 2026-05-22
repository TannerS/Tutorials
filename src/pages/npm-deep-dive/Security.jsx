import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Security & Auditing"
      sectionId="npm-deep-dive"
      lessonIndex={5}
      prev={{ path: '/npm-deep-dive/scripts', label: 'Scripts & Lifecycle Hooks' }}
      next={null}
    >
      <h2>Supply Chain Attacks</h2>
      <p>
        The npm ecosystem's greatest strength — anyone can publish — is also its greatest
        vulnerability. Supply chain attacks target the packages you depend on, injecting
        malicious code that runs automatically when installed or imported.
      </p>

      <CodeBlock language="bash" title="Real-world supply chain attacks">
{`# event-stream (2018)
# - Popular package (2M weekly downloads) transferred to new maintainer
# - New maintainer added malicious dependency targeting Bitcoin wallets
# - Went undetected for 2 months

# ua-parser-js (2021)
# - Maintainer's npm account compromised
# - Crypto miners injected into versions 0.7.29, 0.8.0, 1.0.0
# - 7M weekly downloads affected

# colors.js & faker.js (2022)
# - Author intentionally sabotaged own packages
# - Added infinite loop printing "LIBERTY LIBERTY LIBERTY"
# - Broke thousands of projects depending on them

# node-ipc (2022)
# - Author added code that wiped files on Russian/Belarusian IPs
# - "Protestware" — political motivation

# Common attack vectors:
# 1. Typosquatting (publish 'lodassh' hoping for typos)
# 2. Account takeover (compromise maintainer credentials)
# 3. Dependency confusion (internal package names on public registry)
# 4. Malicious postinstall scripts (run code on npm install)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Install = Execute">
        Running <code>npm install</code> can execute arbitrary code via postinstall scripts.
        A malicious package can steal env vars, SSH keys, or crypto wallets the moment you
        install it — before you ever import it in your code. This is why you should review
        new dependencies before adding them.
      </InfoBox>

      <h2>npm audit</h2>
      <p>
        <code>npm audit</code> checks your dependency tree against the GitHub Advisory Database
        for known vulnerabilities. It's your first line of defense.
      </p>

      <CodeBlock language="bash" title="Running and reading npm audit">
{`# Run an audit
npm audit

# Example output:
# ┌───────────────┬──────────────────────────────────────────────────────────┐
# │ Moderate      │ Prototype Pollution in lodash                           │
# ├───────────────┼──────────────────────────────────────────────────────────┤
# │ Package       │ lodash                                                   │
# │ Vulnerability │ https://github.com/advisories/GHSA-jf85-cpcp-j695       │
# │ Patched in    │ >=4.17.21                                               │
# │ Dependency of │ my-old-lib                                              │
# │ Path          │ my-old-lib > lodash                                      │
# │ Severity      │ moderate                                                 │
# └───────────────┴──────────────────────────────────────────────────────────┘

# Severity levels:
# - critical: remotely exploitable, no user interaction needed
# - high: significant impact, some conditions required
# - moderate: limited impact or complex exploitation
# - low: minimal impact

# JSON output for CI pipelines
npm audit --json

# Only report specific severity levels
npm audit --audit-level=high

# Audit only production dependencies
npm audit --omit=dev`}
      </CodeBlock>

      <h2>Fixing Vulnerabilities</h2>

      <CodeBlock language="bash" title="npm audit fix strategies">
{`# Auto-fix: update vulnerable packages to patched versions
npm audit fix
# This only updates within semver ranges (safe)

# Force fix: allow major version updates (DANGEROUS)
npm audit fix --force
# This may install breaking changes!
# Always review and test after --force

# Dry run: see what would change without changing anything
npm audit fix --dry-run

# When you CAN'T fix:
# 1. Vulnerability is in a transitive dep with no fix available
# 2. The fix requires a major version bump you can't take
# 3. The vulnerability doesn't affect your usage

# Override a transitive dependency version:
# package.json:
{
  "overrides": {
    "lodash": "^4.17.21"
  }
}
# Forces ALL lodash installations to use this version
# Use sparingly — can break packages expecting a different version`}
      </CodeBlock>

      <InfoBox variant="warning" title="audit fix --force Is a Footgun">
        <code>npm audit fix --force</code> will perform major version bumps to fix
        vulnerabilities. This can completely break your application. Never run it blindly —
        always do a dry run first, then test thoroughly. For transitive deps you can't
        control, use overrides or find an alternative package.
      </InfoBox>

      <h2>Integrity Checking</h2>
      <p>
        npm verifies every package it installs against the SHA-512 hash stored in your lockfile.
        This ensures that even if the registry is compromised, tampered packages will be detected.
      </p>

      <CodeBlock language="bash" title="How npm verifies integrity">
{`# Every lockfile entry has an integrity hash:
# "integrity": "sha512-abc123..."

# npm's verification process:
# 1. Download tarball (or read from cache)
# 2. Compute SHA-512 of the tarball bytes
# 3. Compare computed hash with lockfile's integrity value
# 4. If match → install proceeds
# 5. If mismatch → EINTEGRITY error, refuse to install

# Verify your cache is intact:
npm cache verify
# Output:
# Cache verified and compressed (~/.npm/_cacache)
# Content verified: 5421 (234567891 bytes)
# Index entries: 8234

# If you get EINTEGRITY errors:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install`}
      </CodeBlock>

      <h2>Package Provenance</h2>
      <p>
        Since 2023, npm supports provenance attestations — cryptographic proof that a package
        was built from a specific source commit in a specific CI environment. This lets you
        verify the entire chain from source code to published package.
      </p>

      <CodeBlock language="bash" title="Provenance in practice">
{`# Check if a package has provenance
npm audit signatures

# When publishing with provenance (in GitHub Actions):
npm publish --provenance
# This creates a signed attestation linking the package to:
# - The exact git commit
# - The GitHub Actions workflow that built it
# - The build environment

# On npmjs.com, packages with provenance show a green checkmark
# and link to the source commit

# Verify provenance locally:
npm audit signatures
# Output:
# audited 847 packages in 3s
# 847 packages have verified registry signatures
# 212 packages have verified attestations`}
      </CodeBlock>

      <h2>.npmrc Security</h2>

      <CodeBlock language="bash" title="Securing your .npmrc">
{`# NEVER commit auth tokens to git
# User ~/.npmrc (contains tokens):
//registry.npmjs.org/:_authToken=npm_XXXXXXXXXXXXX

# Project .npmrc (committed to git — NO tokens here):
registry=https://registry.npmjs.org/
@mycompany:registry=https://npm.mycompany.com/

# .gitignore should include:
.npmrc  # Only if project .npmrc has tokens (rare)

# For CI, set tokens via environment variables:
# In CI config:
# NPM_TOKEN=npm_XXXXXXXXX

# In project .npmrc:
//registry.npmjs.org/:_authToken=\${NPM_TOKEN}
# npm expands environment variables in .npmrc

# Rotate tokens regularly:
npm token list    # see all active tokens
npm token revoke <id>  # revoke a compromised token
npm token create  # create new token`}
      </CodeBlock>

      <h2>Typosquatting</h2>
      <p>
        Attackers publish packages with names similar to popular ones, hoping developers
        make typos when installing. The malicious package runs code on install.
      </p>

      <CodeBlock language="bash" title="Typosquatting examples">
{`# Real typosquatting attacks that were caught:
# crossenv     (instead of cross-env) — stole env vars
# electorn     (instead of electron)
# event-steam  (instead of event-stream)
# lodahs       (instead of lodash)

# Protection strategies:
# 1. Copy package names from docs/npmjs.com, never type from memory
# 2. Verify the package before installing:
npm info <package-name>    # check author, repo, downloads
npm info <package-name> repository  # verify it links to expected repo

# 3. Use exact package names in documentation
# 4. Enable npm's typosquatting detection:
#    npm now warns about similar package names

# 5. For your org: register common misspellings as empty packages
npm publish  # publish placeholder packages with common typos of your real package`}
      </CodeBlock>

      <h2>Dependency Review Tools</h2>

      <CodeBlock language="bash" title="Security tools for npm">
{`# Built-in: npm audit
npm audit
npm audit --json | jq '.vulnerabilities | keys'

# Socket.dev — detects supply chain risks beyond CVEs
# Checks for: network access, filesystem access, obfuscated code,
# install scripts, and more
# Available as GitHub App and CLI

# Snyk — vulnerability scanning with fix PRs
npx snyk test     # scan for vulnerabilities
npx snyk monitor  # continuous monitoring

# npm audit signatures — verify package provenance
npm audit signatures

# depcheck — find unused dependencies (reduce attack surface)
npx depcheck

# lockfile-lint — validate lockfile integrity
npx lockfile-lint --path package-lock.json --type npm --allowed-hosts npm

# GitHub Dependabot — automated dependency update PRs
# .github/dependabot.yml:
# version: 2
# updates:
#   - package-ecosystem: "npm"
#     directory: "/"
#     schedule:
#       interval: "weekly"`}
      </CodeBlock>

      <h2>Best Practices Checklist</h2>

      <FlowChart
        title="Security Checklist for Adding a New Dependency"
        chart={"graph TD\n  A[Want to add a package] --> B[Check npmjs.com page]\n  B --> C{Weekly downloads > 1000?}\n  C -->|No| D[High risk - find alternative]\n  C -->|Yes| E[Check last publish date]\n  E --> F{Published in last year?}\n  F -->|No| G[May be abandoned - check issues]\n  F -->|Yes| H[Check GitHub repo]\n  H --> I{Has tests and CI?}\n  I -->|No| J[Medium risk - evaluate carefully]\n  I -->|Yes| K[Check dependencies count]\n  K --> L{Pulls in > 50 transitive deps?}\n  L -->|Yes| M[Consider lighter alternative]\n  L -->|No| N[Run npm audit after install]\n  N --> O[Review postinstall scripts]\n  O --> P[Add to project]"}
      />

      <CodeBlock language="bash" title="Security best practices">
{`# 1. Pin versions for production apps
npm config set save-exact true
# Saves "lodash": "4.17.21" instead of "^4.17.21"

# 2. Always use lockfiles
# npm ci in CI, never npm install

# 3. Enable 2FA on your npm account
npm profile enable-2fa auth-and-writes

# 4. Audit regularly
npm audit
# Add to CI: npm audit --audit-level=moderate

# 5. Review new dependencies
npm info <pkg> repository  # check the source
npm info <pkg> maintainers # who maintains it?

# 6. Check for outdated packages
npm outdated
# Update strategy: one major version at a time, test between each

# 7. Use overrides for stuck transitive deps
# package.json:
{
  "overrides": {
    "vulnerable-pkg": "^2.0.1"
  }
}

# 8. Disable postinstall scripts for untrusted packages
npm install --ignore-scripts
# Then selectively run scripts you trust`}
      </CodeBlock>

      <h2>npm outdated & Update Strategies</h2>

      <CodeBlock language="bash" title="Managing updates">
{`# See what's outdated
npm outdated
# Package    Current  Wanted  Latest  Location
# lodash     4.17.19  4.17.21 4.17.21 my-app
# react      17.0.2   17.0.2  18.2.0  my-app
# typescript 4.9.5    4.9.5   5.3.3   my-app

# Current: what you have installed
# Wanted: latest matching your semver range
# Latest: absolute latest on registry

# Update within ranges (safe):
npm update

# Update a specific package:
npm update lodash

# Update to latest (may be breaking):
npm install lodash@latest
npm install react@latest react-dom@latest

# Interactive update tool:
npx npm-check-updates  # (ncu) — shows all possible updates
npx npm-check-updates -u  # updates package.json ranges
npm install  # install the new versions

# Update strategy for production:
# 1. Run npm outdated weekly
# 2. Update patch/minor versions (npm update) — low risk
# 3. Update major versions one at a time
# 4. Read changelogs for breaking changes
# 5. Run full test suite after each update
# 6. Deploy behind feature flags if unsure`}
      </CodeBlock>

      <InfoBox variant="tip" title="Automate with Dependabot or Renovate">
        GitHub Dependabot and Mend Renovate automatically open PRs for dependency updates.
        Configure them to group patch updates (merge quickly) but separate major updates
        (review carefully). This keeps you current without manual labor.
      </InfoBox>

      <InteractiveChallenge
        question="A package you depend on has a critical vulnerability in a transitive dependency (3 levels deep). npm audit fix doesn't resolve it. What's the safest next step?"
        options={[
          "Run npm audit fix --force to force the update",
          "Add an override in package.json to pin the fixed version of the transitive dep",
          "Ignore it since it's not a direct dependency",
          "Delete node_modules and reinstall"
        ]}
        correctIndex={1}
        explanation="The 'overrides' field in package.json lets you force a specific version of any transitive dependency without major version bumps to your direct dependencies. This is safer than --force (which may introduce breaking changes) and more responsible than ignoring it. Test thoroughly after adding overrides."
      />

      <InteractiveChallenge
        question="What makes typosquatting attacks particularly dangerous in the npm ecosystem?"
        options={[
          "npm doesn't check package names for typos",
          "Malicious postinstall scripts execute immediately on npm install, before you ever import the package",
          "Typosquatted packages look identical on npmjs.com",
          "npm automatically installs suggested packages"
        ]}
        correctIndex={1}
        explanation="The most dangerous aspect is that npm packages can define postinstall scripts that run immediately when the package is installed. A typosquatted package can steal your environment variables, SSH keys, or credentials the instant you accidentally install it — you don't even need to use it in your code."
      />

      <h2>Key Takeaways</h2>
      <ul>
        <li>Supply chain attacks are real and common — the npm ecosystem is a high-value target</li>
        <li><code>npm audit</code> checks for known vulnerabilities; run it in CI</li>
        <li><code>npm audit fix</code> is safe; <code>--force</code> is dangerous — always dry-run first</li>
        <li>Integrity hashes in lockfiles detect tampered packages</li>
        <li>Provenance attestations verify packages were built from known source in trusted CI</li>
        <li>Never commit auth tokens; use environment variables in CI</li>
        <li>Review new dependencies: check downloads, maintenance, repo quality, and dep count</li>
        <li>Use overrides for stuck transitive vulnerabilities</li>
        <li>Enable 2FA, pin versions, and automate updates with Dependabot/Renovate</li>
      </ul>
    </LessonLayout>
  );
}
