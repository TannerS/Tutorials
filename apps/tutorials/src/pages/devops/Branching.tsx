import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Branching() {
  return (
    <LessonLayout
      title="Branching Strategies"
      sectionId="devops"
      lessonIndex={1}
      prev={{ path: '/devops/git', label: 'Git Commands Cheat Sheet' }}
      next={{ path: '/devops/cicd', label: 'CI/CD Pipelines' }}
    >
      <h2>Why Branching Strategies Matter</h2>
      <p>
        A branching strategy defines how your team collaborates on code, manages releases,
        and handles hotfixes. The right strategy depends on team size, release cadence, and
        deployment model. Let&apos;s explore the three most popular approaches.
      </p>

      <h2>GitFlow</h2>
      <p>
        GitFlow uses long-lived branches to separate development from production-ready code.
        Best suited for projects with scheduled releases and multiple versions in production.
      </p>

      <FlowChart
        title="GitFlow Branch Model"
        chart={"graph LR\nA[main] --> B[hotfix/*]\nB --> A\nB --> C[develop]\nA --> C\nC --> D[feature/*]\nD --> C\nC --> E[release/*]\nE --> A\nE --> C\nstyle A fill:#4CAF50,color:#fff\nstyle C fill:#2196F3,color:#fff\nstyle D fill:#FF9800,color:#fff\nstyle E fill:#9C27B0,color:#fff\nstyle B fill:#f44336,color:#fff"}
      />

      <CodeBlock language="bash" title="GitFlow Workflow">
{`# Start a feature
git checkout develop
git checkout -b feature/user-profile

# Work on feature, then merge back
git checkout develop
git merge --no-ff feature/user-profile
git branch -d feature/user-profile

# Create a release
git checkout develop
git checkout -b release/1.2.0
# Bump version, final testing, bug fixes only
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release 1.2.0"
git checkout develop
git merge --no-ff release/1.2.0

# Hotfix from production
git checkout main
git checkout -b hotfix/critical-bug
# Fix the bug
git checkout main
git merge --no-ff hotfix/critical-bug
git tag -a v1.2.1 -m "Hotfix 1.2.1"
git checkout develop
git merge --no-ff hotfix/critical-bug`}
      </CodeBlock>

      <h2>GitHub Flow</h2>
      <p>
        GitHub Flow is simpler: one main branch, short-lived feature branches, and pull requests.
        Ideal for teams practicing continuous deployment.
      </p>

      <CodeBlock language="bash" title="GitHub Flow Workflow">
{`# Everything starts from main
git checkout main
git pull origin main

# Create a descriptive branch
git checkout -b feature/add-search-api

# Make commits, push regularly
git add .
git commit -m "feat(search): add elasticsearch integration"
git push -u origin feature/add-search-api

# Open a Pull Request on GitHub
# Team reviews, CI runs, then merge via PR
# Deploy automatically from main`}
      </CodeBlock>

      <h2>Trunk-Based Development</h2>
      <p>
        Trunk-based development takes simplicity further: everyone commits to <code>main</code> (or
        uses very short-lived branches that live less than a day). This demands strong CI/CD,
        feature flags, and high test coverage.
      </p>

      <FlowChart
        title="Trunk-Based Development"
        chart={"graph LR\nA[main/trunk] --> B[Short-lived branch]\nB -->|Merge within hours| A\nA --> C[Release branch]\nC -->|Cherry-pick fixes| D[Production]\nA --> E[Feature flags]\nE -->|Toggle on/off| D\nstyle A fill:#4CAF50,color:#fff\nstyle B fill:#FF9800,color:#fff\nstyle C fill:#9C27B0,color:#fff\nstyle E fill:#2196F3,color:#fff"}
      />

      <CodeBlock language="bash" title="Trunk-Based Workflow">
{`# Short-lived branch (hours, not days)
git checkout main
git pull
git checkout -b ts/add-retry-logic

# Small, focused change
git commit -am "feat: add retry logic with exponential backoff"
git push -u origin ts/add-retry-logic

# Merge same day via PR (or direct push if team is small)
# Feature hidden behind flag until ready
# Release branches cut from main for production`}
      </CodeBlock>

      <h2>Feature Flags as an Alternative to Branches</h2>
      <p>
        Feature flags decouple deployment from release. You can merge incomplete features to
        main behind a flag, deploy safely, and enable when ready.
      </p>

      <CodeBlock language="javascript" title="Feature Flag Example">
{`// Simple feature flag check
const features = {
  newSearchUI: process.env.FEATURE_NEW_SEARCH === 'true',
  darkMode: process.env.FEATURE_DARK_MODE === 'true',
};

function SearchPage() {
  if (features.newSearchUI) {
    return <NewSearchExperience />;
  }
  return <LegacySearch />;
}

// With a feature flag service (LaunchDarkly, Unleash, etc.)
import { useFlag } from '@unleash/proxy-client-react';

function Dashboard() {
  const showAnalytics = useFlag('show-analytics-dashboard');
  return (
    <div>
      <MainContent />
      {showAnalytics && <AnalyticsDashboard />}
    </div>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Feature Flag Hygiene">
        Feature flags are powerful but become tech debt if left forever. Track every flag with an
        expiration date. Once a feature is fully rolled out and stable, remove the flag and the
        old code path.
      </InfoBox>

      <h2>Strategy Comparison</h2>

      <table>
        <thead>
          <tr>
            <th>Factor</th>
            <th>GitFlow</th>
            <th>GitHub Flow</th>
            <th>Trunk-Based</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Complexity</td>
            <td>High</td>
            <td>Low</td>
            <td>Low</td>
          </tr>
          <tr>
            <td>Release cadence</td>
            <td>Scheduled</td>
            <td>Continuous</td>
            <td>Continuous</td>
          </tr>
          <tr>
            <td>Long-lived branches</td>
            <td>Yes (develop, main)</td>
            <td>No</td>
            <td>No</td>
          </tr>
          <tr>
            <td>Best for</td>
            <td>Versioned products</td>
            <td>Web apps, SaaS</td>
            <td>High-velocity teams</td>
          </tr>
          <tr>
            <td>CI/CD requirement</td>
            <td>Moderate</td>
            <td>High</td>
            <td>Very high</td>
          </tr>
          <tr>
            <td>Feature flags needed</td>
            <td>Rarely</td>
            <td>Sometimes</td>
            <td>Always</td>
          </tr>
          <tr>
            <td>Merge conflicts</td>
            <td>Frequent</td>
            <td>Occasional</td>
            <td>Rare</td>
          </tr>
        </tbody>
      </table>

      <h2>Pull Request Best Practices</h2>

      <CodeBlock language="bash" title="PR Workflow">
{`# Keep PRs small and focused (< 400 lines ideally)
# Use a PR template:
# ## What
# Brief description of changes
#
# ## Why
# Context / ticket link
#
# ## Testing
# How was this tested?
#
# ## Screenshots (if UI change)

# Before opening a PR:
git fetch origin main
git rebase origin/main        # resolve conflicts locally
npm test                      # run tests
npm run lint                  # check linting`}
      </CodeBlock>

      <InfoBox variant="info" title="Code Review Checklist">
        When reviewing PRs, focus on: correctness, edge cases, security implications, test
        coverage, naming clarity, and whether the change matches the described intent. Avoid
        bikeshedding on style — let linters handle that.
      </InfoBox>

      <h2>Merge vs Rebase vs Squash</h2>

      <CodeBlock language="bash" title="Merge Strategies">
{`# Merge commit (preserves full branch history)
git checkout main
git merge --no-ff feature/login
# Creates: A--B--C--M (merge commit)

# Rebase (linear history, replays commits)
git checkout feature/login
git rebase main
git checkout main
git merge feature/login       # fast-forward
# Creates: A--B--C--D--E (linear)

# Squash merge (collapse branch into single commit)
git checkout main
git merge --squash feature/login
git commit -m "feat: add login feature"
# Creates: A--B--C--S (single squashed commit)`}
      </CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>History</th>
            <th>Best For</th>
            <th>Downside</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Merge</td>
            <td>Full context preserved</td>
            <td>Complex features, auditing</td>
            <td>Noisy git log</td>
          </tr>
          <tr>
            <td>Rebase</td>
            <td>Clean, linear</td>
            <td>Small changes, clean history</td>
            <td>Rewrites history</td>
          </tr>
          <tr>
            <td>Squash</td>
            <td>Single commit per PR</td>
            <td>Feature branches with messy commits</td>
            <td>Loses granular history</td>
          </tr>
        </tbody>
      </table>

      <h2>Branch Naming Conventions</h2>

      <CodeBlock language="bash" title="Naming Patterns">
{`# Common patterns:
# type/description
feature/user-authentication
bugfix/login-timeout
hotfix/payment-crash
release/v2.1.0
chore/update-dependencies

# With ticket number:
feature/JIRA-1234-user-authentication
bugfix/GH-567-login-timeout

# Personal prefix (for shared repos):
ts/feature/add-caching        # initials/type/description

# Rules:
# - Use lowercase
# - Use hyphens, not underscores or spaces
# - Keep it short but descriptive
# - Include ticket numbers when available
# - Delete branches after merging`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Your team deploys to production multiple times per day and uses feature flags. Which branching strategy fits best?"}
        options={[
          "GitFlow with develop and release branches",
          "GitHub Flow with short-lived feature branches",
          "Trunk-based development",
          "No branching — everyone commits directly to main without PRs"
        ]}
        correctIndex={2}
        explanation={"Trunk-based development is designed for high-velocity teams deploying frequently. Combined with feature flags, it minimizes merge conflicts and keeps branches extremely short-lived. GitHub Flow is close but trunk-based is even more streamlined for this cadence."}
        language="bash"
      />

      <InfoBox variant="warning" title="Rebase Golden Rule">
        Never rebase commits that have been pushed to a shared branch. Rebasing rewrites
        commit hashes, which will cause conflicts for anyone who has already pulled those commits.
        Only rebase your own local, unpushed work.
      </InfoBox>
    </LessonLayout>
  );
}

export default function BranchingPage() {
  return <Branching />;
}
