import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsBranching() {
  return (
    <LessonLayout
      title="Branching Strategies"
      sectionId="devops"
      lessonIndex={1}
      prev={{ path: "/devops/git", label: "Git Workflow" }}
      next={{ path: "/devops/cicd", label: "CI/CD Pipelines" }}
    >
      <p>Branching strategies define how a team uses branches to organize work and releases. The main strategies are Git Flow, GitHub Flow, and trunk-based development — each with different complexity and deployment frequency trade-offs.</p>
      <FlowChart title="Branching Strategies" chart={"graph TD\n  A[Team size and deployment?] --> B{Deploy multiple times/day?}\n  B -- Yes --> C[Trunk-based Development]\n  B -- No --> D{Regular release cycles?}\n  D -- Yes --> E[Git Flow]\n  D -- No --> F[GitHub Flow]"} />
      <CodeBlock language="bash" title="GitHub Flow — Simple and Effective">
{`# GitHub Flow: main is always deployable
# 1. Create a feature branch
git checkout -b feature/add-search main

# 2. Commit work
git commit -m "feat(search): add full-text product search"
git commit -m "test(search): add unit tests for SearchService"

# 3. Open Pull Request against main
# - CI runs tests automatically
# - Team reviews code
# - Merge when approved and CI green

# 4. Deploy main automatically after merge

# Branch naming conventions
# feature/TICKET-123-short-description
# fix/TICKET-456-bug-description
# hotfix/urgent-production-fix
# chore/update-dependencies

# === TRUNK-BASED DEVELOPMENT ===
# Short-lived branches (< 1 day), merge to main constantly
# Feature flags hide incomplete features in production
git checkout -b feat/payment-v2  # created this morning
# ... code ...
git push && gh pr create --fill   # PR before lunch
# CI passes, reviewed, merged before EOD
# Feature hidden behind: if (featureFlags.isEnabled("PAYMENT_V2")) { ... }`}
      </CodeBlock>
      <InfoBox variant="note" title="Pull Request Best Practices">
        <p>Keep PRs small (under 400 lines of diff) — large PRs get rubber-stamped. Write a PR description explaining WHY, not what (the diff shows what). Include test coverage. Reference the ticket. Self-review your PR before requesting review — catch obvious issues yourself. Respond to review comments promptly.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What is the core principle of trunk-based development?"
        options={["Use long-lived feature branches for stability", "All developers commit to the main branch (trunk) frequently, using feature flags for incomplete work", "Use a separate release branch for every version", "Branches must be reviewed by 3+ people before merging"]}
        correctIndex={1}
        explanation="Trunk-based development means all developers integrate their work into the main branch (trunk) multiple times per day via small commits or short-lived branches. Feature flags hide incomplete features in production. This minimizes merge conflicts, enables continuous deployment, and surfaces integration issues immediately."
      />

    </LessonLayout>
  );
}
