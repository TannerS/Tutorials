import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';

export default function Cicd() {
  return (
    <LessonLayout
      title="CI/CD Pipelines & Deployment Strategies"
      sectionId="cloud-architecture"
      lessonIndex={4}
      prev={{ path: '/cloud-architecture/capacity-planning', label: 'Cost & Capacity Planning' }}
      next={{ path: '/cloud-architecture/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        &quot;We do CI/CD&quot; is one of the most common claims on a resume and one of the least
        precisely defined in practice. The three terms — <strong>Continuous Integration</strong>,{' '}
        <strong>Continuous Delivery</strong>, and <strong>Continuous Deployment</strong> — describe
        three genuinely different levels of automation, and the last two get blurred together
        constantly, including by engineers who ship through a pipeline every day. Getting the vocabulary
        exact matters for an interview, but it also matters for a design doc: &quot;we&#39;ll do
        continuous deployment to prod&quot; and &quot;we&#39;ll do continuous delivery to prod&quot; are
        two different architectural commitments, not two ways of saying the same thing.
      </p>

      <h2>CI vs. Delivery vs. Deployment — Precisely</h2>

      <p>
        All three build on each other in sequence. Each one is strictly a superset of the automation in
        the one before it:
      </p>

      <InfoBox variant="info" title="The Three Levels, Exactly">
        <p>
          <strong>Continuous Integration (CI)</strong> — Every code change is automatically built and
          tested, usually on every push or pull request. The goal is to catch integration problems —
          &quot;my branch and yours don&#39;t actually work together&quot; — within minutes of the change
          landing, instead of weeks later during a manual merge. CI says nothing about deployment at all.
        </p>
        <p>
          <strong>Continuous Delivery (CD)</strong> — Every change that passes CI is automatically built,
          tested, and prepared for release — packaged into a deployable artifact and pushed as far as a
          staging environment — so that it is always in a releasable state. Getting it into production is
          still a <strong>deliberate, human-triggered action</strong> — someone clicks &quot;deploy&quot;
          or approves a gate. The pipeline does everything up to that button; a person presses it.
        </p>
        <p>
          <strong>Continuous Deployment</strong> — Every change that passes CI is automatically deployed
          all the way to production, with <strong>no human approval step at all</strong>. If the tests
          pass, it ships. This is the least common of the three in practice, because it requires enough
          confidence in the test suite and enough investment in fast rollback that nobody needs to be the
          last line of defense before customers see a change.
        </p>
      </InfoBox>

      <p>
        The single word that separates the last two is <em>automatic</em>. Continuous Delivery makes
        every change <em>deployable</em> automatically; Continuous Deployment makes every change{' '}
        <em>deployed</em> automatically. A team that runs a fully automated pipeline right up to a
        &quot;click to release&quot; button in production is doing Continuous Delivery, full stop — no
        matter how automated the rest of the pipeline is, that one manual click means it is not Continuous
        Deployment. This is the distinction interviewers ask about most often precisely because it is the
        one people get backwards most often.
      </p>

      <h2>A Real GitHub Actions Pipeline</h2>

      <p>
        Concretely, here is what Continuous Integration looks like for a Java/Maven project — this is the
        part of the pipeline that runs on every push, before any question of delivery or deployment comes
        up at all.
      </p>

      <InfoBox variant="note" title="Illustrative YAML — Syntactically Verified Against GitHub&#39;s Own Docs, Not Executed Here">
        <p>
          There is no GitHub Actions runner in this environment, so nothing below has actually executed.
          Every action name and version tag was checked directly against its source: <code>actions/checkout</code>{' '}
          and <code>actions/setup-java</code>&#39;s current major versions and input names (<code>distribution</code>,{' '}
          <code>java-version</code>, <code>cache</code>) were confirmed against their published{' '}
          <code>action.yml</code> definitions and README examples on GitHub, and the overall{' '}
          <code>on:</code>/<code>jobs:</code>/<code>steps:</code> structure matches GitHub&#39;s own Maven CI
          starter workflow. Treat it the way you&#39;d treat any workflow file you didn&#39;t personally
          run: read it, then let a real push against a real repository confirm it.
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title=".github/workflows/build-and-test.yml (illustrative, not executed)">
{`name: Build and Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v7

      - name: Set up JDK 21
        uses: actions/setup-java@v6
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Compile
        run: mvn -B compile --file pom.xml

      - name: Run unit tests
        run: mvn -B test --file pom.xml

      - name: Package (tests already ran above)
        run: mvn -B package -DskipTests --file pom.xml

      - name: Upload build artifact
        uses: actions/upload-artifact@v7
        with:
          name: app-jar
          path: target/*.jar`}
      </CodeBlock>

      <p>
        Walking it top to bottom: <code>on:</code> triggers the workflow on every push to{' '}
        <code>main</code> and on every pull request targeting it — the &quot;every code change&quot; part
        of the CI definition. <code>actions/checkout@v7</code> pulls the repository onto the runner;{' '}
        <code>actions/setup-java@v6</code> installs a JDK, with <code>distribution: temurin</code> picking
        the Eclipse Temurin OpenJDK build and <code>cache: maven</code> enabling GitHub&#39;s built-in
        caching for the local Maven repository so dependencies aren&#39;t re-downloaded on every run. The
        three <code>mvn</code> steps are deliberately split rather than collapsed into one{' '}
        <code>mvn package</code> call: compiling, testing, and packaging as separate steps means a failure
        shows up in the CI log against the exact step that caused it, instead of buried inside a single
        combined goal. The final step uploads the built JAR as a workflow artifact — the thing a later
        deployment step, or a human, would actually take and ship. Note what this workflow does{' '}
        <em>not</em> do: it never touches a production server. That is the line between CI and everything
        that follows.
      </p>

      <h2>The Stages of a Pipeline, and What Each One Catches</h2>

      <p>
        A mature pipeline is a sequence of increasingly expensive, increasingly realistic checks, each one
        designed to catch a specific category of problem as early — and as cheaply — as possible:
      </p>

      <FlowChart
        title="A Typical CI/CD Pipeline, Stage by Stage"
        chart={"graph TD\n  A[\"Build\\ncompile the source\"] --> B[\"Unit Tests\\nlogic errors, one function/class at a time\"]\n  B --> C[\"Integration Tests\\ncomponents don't actually work together\\n(e.g. Testcontainers against a real DB)\"]\n  C --> D[\"Static Analysis / Linting\\nstyle violations, likely bugs, code smells\"]\n  D --> E[\"Security Scanning\\nknown-vulnerable dependencies\"]\n  E --> F[\"Package\\nbuild the one deployable artifact\"]\n  F --> G[\"Deploy to Staging\"]\n  G --> H{\"Manual Approval Gate\\n(this step is what makes it\\nContinuous Delivery, not Deployment)\"}\n  H --> I[\"Deploy to Production\"]\n  style H fill:#3d2f14,stroke:#d97706\n  style I fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        <strong>Build</strong> catches the cheapest and dumbest failures — code that does not even
        compile — before spending any more time on it. <strong>Unit tests</strong> catch logic errors
        inside a single function or class, run in isolation from anything external.{' '}
        <strong>Integration tests</strong> catch the failures unit tests structurally cannot see —
        components that each work fine alone but break when wired together against a real database, queue,
        or downstream service; this site&#39;s Testcontainers lesson covers exactly this category, running
        tests against real, disposable containers instead of mocks that quietly drift from how the real
        dependency behaves. <strong>Static analysis and linting</strong> catch style violations and known
        bug patterns without running the code at all. <strong>Security scanning</strong> catches
        dependencies with known vulnerabilities before they ship — this site&#39;s npm Deep Dive Security
        lesson covers <code>npm audit</code> in detail for the Node ecosystem; a Java/Maven pipeline runs
        the equivalent dependency-vulnerability check as its own pipeline stage. Only after all of that
        passes does the pipeline <strong>package</strong> a single deployable artifact and{' '}
        <strong>deploy it to staging</strong> for a final check against production-like infrastructure.
        The <strong>manual approval gate</strong> is the exact point where Continuous Delivery stops and a
        human decides whether <strong>production</strong> happens now — remove that one gate and let the
        pipeline walk straight through it automatically, and the same pipeline becomes Continuous
        Deployment.
      </p>

      <h2>Deployment Strategies</h2>

      <p>
        Passing every stage above only gets a build to the production door — <em>how</em> it actually
        replaces what is currently running is a separate decision, with real trade-offs between how fast
        you can back out, how much infrastructure you are paying for during the switch, and how many users
        are exposed if the new version has a bug it didn&#39;t show in staging.
      </p>

      <h3>Blue-Green Deployment</h3>

      <p>
        Two <strong>complete, identical production environments</strong> exist side by side — call them
        blue (currently live) and green (the new version). The new version is deployed and verified on
        green while blue keeps serving all real traffic, untouched. Cutover happens by repointing a
        router or load balancer from blue to green <strong>all at once</strong>. If something is wrong,
        rollback means flipping that same router back to blue — which never stopped running — making it
        about as fast a rollback as exists.
      </p>

      <FlowChart
        title="Blue-Green — Two Full Environments, One Instant Switch"
        chart={"graph TD\n  subgraph Before Cutover\n    R1[\"Router\"] -->|100% traffic| B1[\"Blue v1 - live\"]\n    G1[\"Green v2 - deployed,\\nbeing verified, no traffic\"]\n  end\n  subgraph Cutover - All Users At Once\n    R2[\"Router\"] -->|100% traffic, instantly| G2[\"Green v2 - now live\"]\n    B2[\"Blue v1 - idle,\\nstill running, untouched\"]\n  end\n  subgraph If Something Is Wrong - Instant Rollback\n    R3[\"Router\"] -->|flip back| B3[\"Blue v1 - never stopped,\\nso this is instant\"]\n  end\n  style G1 fill:#3d2f14,stroke:#d97706\n  style G2 fill:#1a3329,stroke:#4ade80\n  style B2 fill:#1a2744,stroke:#5b9cf6\n  style B3 fill:#1a3329,stroke:#4ade80"}
      />

      <h3>Canary Deployment</h3>

      <p>
        The new version is rolled out to a <strong>small percentage of real production traffic</strong>{' '}
        first — the &quot;canary&quot; slice — while everyone else keeps hitting the old version. That
        slice is monitored against error rates, latency, and business metrics, and only if it looks healthy
        does the percentage gradually increase until the new version is serving everyone. The defining
        difference from blue-green is exactly that gradualness: blue-green switches every user at once,
        canary deliberately limits how many users can be affected before a human or an automated check
        decides whether to continue.
      </p>

      <FlowChart
        title="Canary — a Growing Traffic Slice, Watched Before It Grows Further"
        chart={"graph TD\n  subgraph \"Before - Canary Deployed, No Traffic Yet\"\n    R1[\"Router\"] -->|100% traffic| S1[\"Stable v1\"]\n    C1[\"Canary v2 - deployed,\\n0% traffic\"]\n  end\n  subgraph Canary Slice - Monitored Before Continuing\n    R2[\"Router\"] -->|90% traffic| S2[\"Stable v1\"]\n    R2 -->|10% traffic - the canary| C2[\"Canary v2\"]\n    C2 -.->|error rate / latency / business metrics| M2{\"Healthy?\"}\n  end\n  subgraph After - Gradually Ramped to 100%\n    R3[\"Router\"] -->|100% traffic| C3[\"v2 - fully promoted\"]\n  end\n  M2 -->|yes -- increase percentage| R3\n  style C1 fill:#3d2f14,stroke:#d97706\n  style C2 fill:#3d2f14,stroke:#d97706\n  style C3 fill:#1a3329,stroke:#4ade80\n  style M2 fill:#2a1f44,stroke:#a78bfa"}
      />

      <h3>Rolling Deployment</h3>

      <p>
        Running instances are updated <strong>a few at a time</strong> — take one or a handful out of the
        pool, deploy the new version to them, put them back, repeat with the next batch. The defining
        characteristic is that <strong>old and new versions run simultaneously, side by side, for the
        entire duration of the rollout</strong> — there is no separate green environment and no fixed
        canary percentage held steady for observation; the mix of old-vs-new simply shifts batch by batch
        until every instance is on the new version. It is the default strategy for most Kubernetes
        deployments precisely because it needs no duplicate environment at all.
      </p>

      <FlowChart
        title="Rolling — Batch by Batch, No Duplicate Environment"
        chart={"graph TD\n  subgraph Batch 1 of 3\n    P1[\"Pool: 3 old, 0 new\"] -->|take 1 out, deploy v2, add back| P1a[\"Pool: 2 old, 1 new\\nboth versions serving traffic\"]\n  end\n  subgraph Batch 2 of 3\n    P2[\"Pool: 2 old, 1 new\"] -->|take next 1 out, deploy v2, add back| P2a[\"Pool: 1 old, 2 new\\nboth versions serving traffic\"]\n  end\n  subgraph Batch 3 of 3 - Done\n    P3[\"Pool: 1 old, 2 new\"] -->|take last 1 out, deploy v2, add back| P3a[\"Pool: 0 old, 3 new\\nrollout complete\"]\n  end\n  P1a --> P2\n  P2a --> P3\n  style P1a fill:#3d2f14,stroke:#d97706\n  style P2a fill:#3d2f14,stroke:#d97706\n  style P3a fill:#1a3329,stroke:#4ade80"}
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Strategy</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Rollback Speed</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Infrastructure Cost</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Blast Radius If Something&#39;s Wrong</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Blue-Green</strong></td>
            <td style={{ padding: '0.75rem' }}>Instant — flip the router back to blue, which never stopped running</td>
            <td style={{ padding: '0.75rem' }}>High — two full production-sized environments running at once, even if briefly</td>
            <td style={{ padding: '0.75rem' }}>All traffic, immediately — every user hits the new version the moment you cut over</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Canary</strong></td>
            <td style={{ padding: '0.75rem' }}>Fast — route the small canary slice back; most users were never on the new version</td>
            <td style={{ padding: '0.75rem' }}>Low-to-moderate — no full duplicate environment, just extra capacity for the canary slice</td>
            <td style={{ padding: '0.75rem' }}>Small and contained — only the canary percentage is exposed before you decide to proceed or abort</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}><strong>Rolling</strong></td>
            <td style={{ padding: '0.75rem' }}>Slower — no instant switch; rolling back means rolling the old version back out, batch by batch</td>
            <td style={{ padding: '0.75rem' }}>Low — no duplicate environment; roughly normal capacity, replaced in place</td>
            <td style={{ padding: '0.75rem' }}>Partial but growing — old and new both serve traffic throughout the rollout, so some users are always on whichever version has the bug</td>
          </tr>
        </tbody>
      </table>

      <h2>Feature Flags: A Complement, Not a Competitor</h2>

      <p>
        Every strategy above answers &quot;how does new code get onto servers.&quot; A{' '}
        <strong>feature flag</strong> answers a different question entirely, and the two techniques
        combine rather than compete. <strong>Deployment</strong> is code physically running on production
        infrastructure. <strong>Release</strong> is that code actually being visible or active for users.
        Without feature flags those two happen at the same moment — deploy it, and it is live. A feature
        flag lets a team deploy new code with the feature wrapped in a conditional and switched{' '}
        <strong>off</strong> — dark in production, fully deployed, doing nothing — and then flip it on
        later for a percentage of users, a specific account, or everyone at once, completely independent
        of any subsequent deployment. This is what makes true Continuous Deployment tractable for
        half-finished or risky features: the code ships continuously with everything else, but the flag —
        not the deploy — decides when anyone actually sees it, and turning it back off if it misbehaves is
        instant, no rollback or redeploy required.
      </p>

      <p>
        Pipeline speed and rollback capability are not just a CI/CD concern in isolation — the Multi-Region
        Architecture &amp; Disaster Recovery lesson&#39;s RTO (how fast you must recover) is only as
        achievable as the pipeline that has to rebuild, redeploy, or roll back a known-good version during
        the incident that made RTO matter in the first place.
      </p>

    </LessonLayout>
  );
}
