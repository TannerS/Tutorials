import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Collaboration() {
  return (
    <LessonLayout
      title="Collaborative Workflows"
      sectionId="version-control"
      lessonIndex={2}
      prev={{ path: '/version-control/branching', label: 'Branching & Rebase Strategies' }}
      next={{ path: '/version-control/cheatsheet', label: '📋 Git Field Guide' }}
    >
      <p>
        Objects, refs, and the DAG are how Git stores history. Merge and rebase are how you shape it.
        Neither one tells you how a <em>team</em> should actually move code from a laptop into
        production without stepping on each other constantly. That is a process problem, not a Git
        problem, and it is the one this lesson covers: which branching model to run, what a pull request
        is actually supposed to contain, what a reviewer should spend their attention on, how to write a
        commit message a machine can read, and a genuinely new piece of infrastructure — the merge queue
        — built specifically to catch the failure mode that branch protection and CI alone cannot.
      </p>

      <h2>Trunk-Based Development vs. GitFlow</h2>

      <p>
        <strong>Trunk-based development</strong> means every developer merges small, frequent changes
        directly into <code>main</code> — often multiple times a day — instead of living on a long-lived
        feature branch. Anything not ready for users yet ships dark, wrapped in a feature flag and
        switched off, rather than parked on a branch (this site&apos;s CI/CD lesson covers feature flags
        in depth). The entire model exists to minimize the thing that makes merges painful: branches that
        diverge from <code>main</code> for days or weeks accumulate conflicting changes the longer they
        live, so keeping branch lifetimes measured in hours instead of weeks is the actual mechanism, not
        a side effect. Continuous-deployment shops favor it because it is a precondition for the practice
        — you cannot deploy every passing commit if half the team&apos;s work is sitting unintegrated on
        branches.
      </p>

      <p>
        <strong>GitFlow</strong> is the opposite bet: a deliberately heavier model with a fixed set of
        named branch roles. It was proposed by Vincent Driessen in a January 2010 blog post,{' '}
        &quot;A successful Git branching model,&quot; and the roles are specific — <code>develop</code>{' '}
        as the perpetual integration branch, <code>feature/*</code> branches cut from and merged back
        into <code>develop</code>, <code>release/*</code> branches that stabilize a version for shipping,
        and <code>hotfix/*</code> branches cut from production (<code>main</code>/<code>master</code>) to
        patch it directly. It gives a team explicit places to put &quot;code for the release we&apos;re
        stabilizing&quot; versus &quot;code for next quarter&quot; versus &quot;a fix that cannot wait for
        either&quot; — genuinely useful structure for software shipped as discrete, supported versions.
      </p>

      <FlowChart
        title="Two Models, Two Shapes"
        chart={"graph LR\n  subgraph TB[\"Trunk-Based\"]\n    direction LR\n    M1((main)) --> M2((main)) --> M3((main)) --> M4((main))\n    F1[\"flag: off\"] -.short-lived branch.-> M2\n    F2[\"flag: off\"] -.short-lived branch.-> M3\n  end\n  subgraph GF[\"GitFlow\"]\n    direction TB\n    Dv[(\"develop\")]\n    Ft[\"feature/*\"] --> Dv\n    Dv --> Rl[\"release/1.4\"]\n    Rl --> Mn((\"main\"))\n    Mn --> Hf[\"hotfix/1.4.1\"]\n    Hf --> Mn\n    Hf --> Dv\n  end\n  style M1 fill:#1a3329,stroke:#4ade80\n  style M2 fill:#1a3329,stroke:#4ade80\n  style M3 fill:#1a3329,stroke:#4ade80\n  style M4 fill:#1a3329,stroke:#4ade80\n  style Mn fill:#1a2744,stroke:#5b9cf6\n  style Dv fill:#2a1f44,stroke:#a78bfa"}
      />

      <InfoBox variant="note" title="Straight From the Source, a Decade Later">
        <p>
          Driessen added a note to the original 2010 post years later: the model was designed for
          software shipped as versioned releases with multiple lines needing support in parallel — think
          desktop software or a library with an LTS branch. For teams doing continuous deployment of a
          web app, he now points people toward simpler, trunk-based approaches instead. That is not this
          site editorializing — it is the author of GitFlow updating his own recommendation once the
          industry mostly stopped shipping versioned releases.
        </p>
      </InfoBox>

      <p>
        So the honest framing is not &quot;GitFlow is outdated,&quot; it is <strong>match the model to
        how the software ships</strong>. A SaaS product deploying to one production environment
        continuously has little use for a <code>develop</code> branch, a <code>release/*</code> branch,
        and the merge traffic between them — that ceremony solves a problem (multiple supported release
        lines) the team does not have, and mostly adds merge conflicts from long-lived branches instead.
        A team shipping a versioned desktop app, an embedded firmware image, or a library with a
        currently-supported v3 and a maintenance-mode v2 has that problem for real, and GitFlow&apos;s
        explicit branch roles are a reasonable answer to it. Most web teams should default to
        trunk-based; teams with genuine parallel release lines should not feel behind for reaching for
        something closer to GitFlow.
      </p>

      <h2>Pull Requests: A Process, Not a Button</h2>

      <p>
        A pull request is easy to treat as a formality — push a branch, click the green button, wait for
        an approval. Treated as an actual process, two things separate a PR that speeds a team up from
        one that quietly slows it down.
      </p>

      <p>
        <strong>Size.</strong> This is not a style preference — it is a measured, repeatedly observed
        effect. A widely cited study of code review at Cisco (later published by SmartBear, drawn from
        roughly 2,500 reviews) found reviewer effectiveness at finding defects drops sharply once a diff
        goes past around 200&ndash;400 lines of changed code: past that point, reviewers do not reject
        the PR or take proportionally longer, they start skimming, and defect-detection rate falls
        accordingly. A 2,000-line PR does not get four times the scrutiny of a 500-line one — in practice
        it often gets less scrutiny per line than a small one would. A focused PR that does one thing is
        not just nicer to read, it is the difference between a review that actually catches bugs and one
        that is a rubber stamp with extra steps.
      </p>

      <InfoBox variant="warning" title="Small Is a Skill, Not Just a Rule">
        <p>
          &quot;Keep PRs small&quot; sounds obvious until the change genuinely requires touching twelve
          files. The real skill is decomposing that work into an ordered stack of small PRs — add the new
          code path behind a flag, then wire up one caller, then the next, then flip the flag and delete
          the old path — each one independently reviewable and revertable, rather than one PR that lands
          the whole rewrite atomically.
        </p>
      </InfoBox>

      <p>
        <strong>Description.</strong> The diff already shows <em>what</em> changed — a reviewer can read
        the code. What the diff cannot show is <em>why</em>: why this approach and not the obvious
        alternative, what constraint ruled out the simpler fix, what production incident or ticket
        prompted this. That is the same gap this site&apos;s discussion of self-documenting code keeps
        coming back to at the code-comment level — a comment should explain intent the code itself
        cannot express, not restate what the code already says — and a PR description is that same
        principle one level up. &quot;Fixes login bug&quot; wastes the one place in the process
        specifically reserved for context the code can never carry on its own.
      </p>

      <h2>Code Review: What Actually Deserves the Time</h2>

      <p>
        Correctness matters, but it is the floor, not the ceiling. A reviewer earning their spot on a PR
        is also checking whether this is the <strong>simplest</strong> solution to the problem rather
        than just <em>a</em> working one, whether the obvious edge cases have tests (empty input, the
        network call that fails, the list with exactly one item), and whether the change matches patterns
        already established elsewhere in the codebase rather than quietly introducing a second way to do
        the same thing.
      </p>

      <p>
        What should <strong>not</strong> eat review time: formatting, import order, brace placement —
        anything a linter or an auto-formatter enforces automatically and consistently on every commit,
        with zero human attention required. A reviewer typing &quot;missing a space here&quot; is time
        not spent looking for the actual bug, and it is also a symptom — it means the team has not wired
        up tooling that should have caught it before a human ever saw the diff.
      </p>

      <InfoBox variant="tip" title='"nit:" — A Real, Widely Used Convention'>
        <p>
          Good teams make the weight of a comment explicit instead of leaving the author to guess whether
          something blocks merge. Google&apos;s published engineering practices document this directly:
          prefix a comment with <code>Nit:</code> to mark it as a minor, optional polish suggestion —
          the author can take it or leave it, and the PR does not wait on it. Everything else defaults to
          blocking. Several open-source teams extend the same idea further with prefixes like{' '}
          <code>Question:</code> or <code>Suggestion:</code>, formalized under the community-maintained
          &quot;Conventional Comments&quot; convention. The label matters less than the habit: say
          out loud whether a comment is a merge blocker, because &quot;maybe blocking&quot; is where PRs
          go to stall.
        </p>
      </InfoBox>

      <h2>Commit Message Conventions</h2>

      <p>
        <strong>Conventional Commits</strong> is a specification, not just a habit teams converge on by
        taste — and the actual spec (conventionalcommits.org, v1.0.0) is narrower than it usually gets
        remembered. The mandated structure is:
      </p>

      <CodeBlock language="text" title="Conventional Commits — the Actual Grammar">
{`<type>[optional scope]: <description>

[optional body]

[optional footer(s)]`}
      </CodeBlock>

      <p>
        The spec itself only requires two types: <code>fix</code> (a bug patch — correlates with a
        SemVer <strong>PATCH</strong>) and <code>feat</code> (a new capability — correlates with a
        SemVer <strong>MINOR</strong>). Everything else — <code>chore</code>, <code>docs</code>,{' '}
        <code>refactor</code>, <code>test</code>, <code>style</code>, <code>ci</code>,{' '}
        <code>build</code> — comes from the Angular project&apos;s convention that most tooling
        (commitlint, semantic-release) happens to also ship support for, not from the specification text
        itself. A breaking change is signaled either with a <code>!</code> right after the type/scope or
        a <code>BREAKING CHANGE:</code> footer, and it forces a <strong>MAJOR</strong> bump regardless of
        which type it is attached to.
      </p>

      <CodeBlock language="bash" title="Conventional Commit Messages in Practice">
{`git commit -m "feat(auth): add OAuth2 login flow"
git commit -m "fix(cart): prevent duplicate line items on double-click"
git commit -m "docs(readme): add local dev setup steps"
git commit -m "refactor(api): extract shared validation into middleware"

# Breaking change, either form works:
git commit -m "feat(api)!: remove deprecated /v1/users endpoint"
git commit -m "feat(api): remove deprecated /v1/users endpoint" \\
  -m "BREAKING CHANGE: /v1/users is gone, callers must use /v2/users"`}
      </CodeBlock>

      <p>
        The payoff is concrete, not aesthetic: a machine can walk <code>git log</code>, bucket every
        commit by its type prefix, and generate a changelog without a human writing one by hand — feats
        under &quot;Added,&quot; fixes under &quot;Fixed&quot; — and the same scan tells a release tool
        whether the next version is a MAJOR, MINOR, or PATCH bump, entirely from history that already
        exists. This only works, though, if the prefixes are actually consistent — a repo where half the
        commits say <code>fix:</code> and the other half say <code>bugfix:</code> or nothing at all gives
        the tooling nothing reliable to parse.
      </p>

      <h2>Merge Queues: Solving a Failure CI Alone Cannot See</h2>

      <p>
        Branch protection plus required CI checks feels like it should guarantee <code>main</code> never
        breaks. It does not, and the gap is specific: PR A and PR B can each be tested against{' '}
        <code>main</code> independently, both pass, both get approved, both merge in quick succession —
        and the <em>combination</em> breaks something neither PR broke on its own. A function gets
        renamed in A while B adds a new call site using the old name; a config default changes in A while
        B ships code that still assumes the old default. Git sees no textual conflict, CI was green on
        both PRs individually, and <code>main</code> is broken anyway the moment both land. This is
        sometimes called a <strong>semantic conflict</strong> — the code merges cleanly at the text
        level, but not at the level of what it actually does together — and it is a well-documented gap
        in the plain &quot;require passing CI&quot; setup, not a hypothetical.
      </p>

      <p>
        A <strong>merge queue</strong> closes that gap by testing PRs against the state they would
        actually land into, not the state they were opened against. When a PR enters the queue, the
        platform builds a temporary combination of <code>main</code> plus every PR already ahead of it in
        the queue plus this PR, and re-runs CI against <em>that</em> — not against a possibly-stale{' '}
        <code>main</code>. Only if that combined build passes does the PR actually merge; if it fails,
        that PR is pulled from the queue and everything behind it is retested against the new reality.
        This is a real, shipping feature on major platforms, not a theoretical pattern: GitHub&apos;s
        native merge queue reached general availability in July 2023, and GitLab has shipped the same
        idea for longer under the name <strong>merge trains</strong>, where each queued merge request&apos;s
        pipeline runs against the combined changes of every merge request ahead of it, in parallel, with a
        failure ejecting just that one request and re-queuing the rest.
      </p>

      <FlowChart
        title="Merge Queue: Testing the Combination, Not Just the Parts"
        chart={"graph TD\n  M[\"main @ commit X\"] --> Q\n  subgraph Q[\"Merge Queue\"]\n    direction LR\n    A[\"PR A\\n(passed CI vs main alone)\"] --> AB[\"CI: main + A\"]\n    AB --> B[\"PR B\\n(passed CI vs main alone)\"]\n    B --> ABC[\"CI: main + A + B\"]\n    ABC --> C[\"PR C\\n(passed CI vs main alone)\"]\n    C --> ABCD[\"CI: main + A + B + C\"]\n  end\n  ABCD -->|all combined checks pass| Merged[\"main @ commit X+3\\nstill green\"]\n  ABCD -.one fails.-> Ejected[\"failing PR ejected,\\nrest re-tested\"]\n  style Merged fill:#1a3329,stroke:#4ade80\n  style Ejected fill:#3b1a1a,stroke:#f87171\n  style M fill:#1a2744,stroke:#5b9cf6"}
      />

      <InfoBox variant="info" title="Verified: Squash Merge Is Part of the Same Story">
        <p>
          The clean, single-commit history a merge queue produces on <code>main</code> usually comes from
          squash-merging each PR. Run <code>git merge --squash feature-branch</code> yourself and Git
          says exactly what it does: it stages the combined diff from every commit on that branch but{' '}
          <strong>does not create a commit</strong> — Git prints &quot;Squash commit -- not updating
          HEAD&quot; and leaves <code>HEAD</code> untouched until you run <code>git commit</code>{' '}
          yourself. Three messy WIP commits on a feature branch become exactly one clean, reviewable
          commit on <code>main</code> — which is also why the PR&apos;s title and description matter so
          much: for a squash-merged PR, that description often becomes the permanent commit message.
        </p>
      </InfoBox>

      <h2>Monorepo vs. Polyrepo</h2>

      <p>
        One repo per project, or every project in one repo — both are genuinely defensible, and the
        debate is real rather than settled. A <strong>monorepo</strong> makes a single atomic commit able
        to touch a shared library and every one of its callers at once, keeps CI config, linting, and
        tooling defined in exactly one place, and makes cross-project search trivial. A{' '}
        <strong>polyrepo</strong> gets simpler per-project access control, independent deploy cadences —
        one team ships hourly, another ships weekly, with zero coordination — and no risk of one
        project&apos;s bad commit blocking CI for every other project sharing the repo. This site&apos;s
        own repository is a small example of the flat end of that spectrum: every lesson across every
        topic lives in one project history rather than being split into a separate repo per subject,
        which is a fine trade at this scale and a much harder one to defend at the scale of, say, a
        company with forty independently-deployed services and forty teams.
      </p>

    </LessonLayout>
  );
}
