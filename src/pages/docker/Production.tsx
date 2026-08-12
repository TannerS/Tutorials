import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Production() {
  return (
    <LessonLayout
      title="Production, Registries & Orchestration"
      sectionId="docker"
      lessonIndex={5}
      prev={{ path: '/docker/security', label: 'Security & Best Practices' }}
      next={null}
    >
      <h2>From Local Image to Running Production Service</h2>
      <p>
        A locally built image is only useful once other machines can pull it. This lesson covers
        the last mile: getting an image into a registry, tagging it in a way that keeps
        deployments reproducible and rollback-able, wiring health checks so orchestrators know
        when a container is actually ready, running the whole build in CI/CD, and a quick map of
        where orchestration goes from here.
      </p>

      <FlowChart
        title="Image → Registry → Running Service"
        chart={"graph LR\n  A[docker build] --> B[docker tag]\n  B --> C[docker push]\n  C --> D[(Registry)]\n  D -->|docker pull| E[Production host / orchestrator]\n  E --> F[Container running with healthcheck]"}
      />

      <h2>Registries: Tagging and Pushing</h2>
      <p>
        A registry stores and distributes images. Docker Hub is the default public registry, but
        production teams almost always use a private registry tied to their cloud provider &mdash;
        most commonly AWS ECR or GitHub Container Registry.
      </p>

      <CodeBlock language="bash" title="Docker Hub">{`# Tag the image with your Docker Hub namespace
docker tag my-app:1.0 myusername/my-app:1.0

# Authenticate (interactive, or via docker login with a token in CI)
docker login

# Push
docker push myusername/my-app:1.0`}</CodeBlock>

      <CodeBlock language="bash" title="AWS Elastic Container Registry (ECR)">{`# Authenticate Docker to your ECR registry (credentials via AWS CLI config)
aws ecr get-login-password --region us-east-1 \\
  | docker login --username AWS --password-stdin \\
    123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create the repository once, if it doesn't exist
aws ecr create-repository --repository-name my-app

# Tag with the full ECR repository URI
docker tag my-app:1.0 \\
  123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:1.0

# Push
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:1.0`}</CodeBlock>

      <CodeBlock language="bash" title="GitHub Container Registry (GHCR)">{`# Authenticate with a GitHub personal access token (or GITHUB_TOKEN in Actions)
echo $GITHUB_TOKEN | docker login ghcr.io -u your-github-username --password-stdin

# Tag using the ghcr.io/<owner>/<image> convention
docker tag my-app:1.0 ghcr.io/your-org/my-app:1.0

# Push
docker push ghcr.io/your-org/my-app:1.0`}</CodeBlock>

      <InfoBox variant="info" title="Registry Choice Usually Follows Your Cloud">
        If you're deploying to AWS (ECS, EKS), ECR gives you IAM-based access control and
        same-region pulls with no egress cost. If your code already lives on GitHub, GHCR is the
        path of least resistance and integrates directly with GitHub Actions. Docker Hub remains
        the default for open-source or when you don't want to couple image storage to a specific
        cloud.
      </InfoBox>

      <h2>Tagging Strategy: Never Ship `:latest`</h2>
      <p>
        <code>:latest</code> is not a version &mdash; it's whatever was pushed most recently, and it
        moves. Deploying <code>:latest</code> to production means you can't answer "what code is
        actually running" with certainty, and rolling back means guessing which previous push to
        re-tag. Production deployments should always reference an <strong>immutable</strong> tag.
      </p>

      <table>
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Example</th>
            <th>Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Git SHA</strong></td>
            <td><code>my-app:a1b2c3d</code></td>
            <td>Perfectly traceable to a commit, but not human-readable</td>
          </tr>
          <tr>
            <td><strong>Semantic version</strong></td>
            <td><code>my-app:2.4.1</code></td>
            <td>Readable and communicates intent (major/minor/patch), requires a release process</td>
          </tr>
          <tr>
            <td><strong>SHA + semver combined</strong></td>
            <td><code>my-app:2.4.1-a1b2c3d</code></td>
            <td>Best of both — common in mature CI/CD pipelines</td>
          </tr>
          <tr>
            <td><strong><code>:latest</code></strong></td>
            <td><code>my-app:latest</code></td>
            <td>Fine as a convenience alias for "most recent," never as a deploy target</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Tags Are Mutable — Digests Are Not">
        Even a semver tag like <code>2.4.1</code> can technically be overwritten (re-pushed) unless
        your registry enforces immutability. For the strongest guarantee, production deploy
        manifests can reference the image by digest (<code>my-app@sha256:...</code>) rather than tag
        alone — the same supply-chain reasoning from the Security lesson's base-image pinning
        applies here too.
      </InfoBox>

      <h2>Production Health Checks</h2>
      <p>
        A <code>HEALTHCHECK</code> isn't just documentation &mdash; orchestrators (Compose, Kubernetes,
        ECS) use it to decide whether a container is actually ready to receive traffic, and
        whether a running container needs to be restarted.
      </p>

      <CodeBlock language="dockerfile" title="A Meaningful Health Check">
{`# Checks a real endpoint that verifies the app can serve requests —
# not just that the process is alive
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1`}
      </CodeBlock>

      <p>
        A good <code>/health</code> endpoint distinguishes between <strong>liveness</strong> (is the process
        running at all) and <strong>readiness</strong> (can it actually serve a request right now &mdash;
        e.g., is its database connection established). Returning 200 the instant the process
        boots, before the database pool is ready, causes an orchestrator to route traffic to a
        container that will fail every request until it warms up.
      </p>

      <InfoBox variant="tip" title="start-period Matters">
        <code>--start-period</code> gives the container a grace window where failed health checks
        don't count against the retry limit — essential for apps with real startup work (JVM warm-up,
        connection pool initialization) that would otherwise get killed and restarted in a loop
        before they ever had a chance to become healthy.
      </InfoBox>

      <h2>Docker in CI/CD</h2>
      <p>
        The build-tag-push sequence you just ran by hand is exactly what a CI pipeline automates
        on every merge or release. Here's a representative GitHub Actions job:
      </p>

      <CodeBlock language="yaml" title=".github/workflows/docker-publish.yml" showLineNumbers>
{`name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build image
        run: |
          docker build -t ghcr.io/\${{ github.repository }}:\${{ github.sha }} .

      - name: Scan image before publishing
        run: |
          trivy image --severity HIGH,CRITICAL --exit-code 1 \\
            ghcr.io/\${{ github.repository }}:\${{ github.sha }}

      - name: Push image
        run: |
          docker push ghcr.io/\${{ github.repository }}:\${{ github.sha }}
          docker tag ghcr.io/\${{ github.repository }}:\${{ github.sha }} \\
                     ghcr.io/\${{ github.repository }}:latest
          docker push ghcr.io/\${{ github.repository }}:latest`}
      </CodeBlock>

      <p>
        Note the order: <strong>build, then scan, then push</strong>. A failed scan blocks the push
        entirely, so a vulnerable image never reaches the registry deployments pull from — this
        is the CI enforcement of the scanning practice from the previous lesson.
      </p>

      <h2>Orchestration Options: A Quick Map</h2>
      <p>
        Docker and Compose get you a single host running multiple containers. At some point &mdash;
        multiple hosts, automatic failover, rolling deployments, autoscaling &mdash; you need an
        orchestrator to manage containers <em>across</em> a fleet of machines. Here's the landscape,
        at a glance:
      </p>

      <FlowChart
        title="Orchestration Options by Scale"
        chart={"graph LR\n  A[Single host] -->|Docker Compose| B[A few containers,\\none machine]\n  C[Small cluster] -->|Docker Swarm| D[Docker-native,\\nsimple multi-host]\n  E[Large scale] -->|Kubernetes| F[Industry standard,\\nfull ecosystem]"}
      />

      <table>
        <thead>
          <tr>
            <th>Option</th>
            <th>Scope</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Docker Compose</strong></td>
            <td>Single host</td>
            <td>What you've used throughout this section — ideal for local dev, small single-server deployments</td>
          </tr>
          <tr>
            <td><strong>Docker Swarm</strong></td>
            <td>Small-to-medium multi-host clusters</td>
            <td>Docker's own built-in orchestrator; much simpler than Kubernetes, but a shrinking ecosystem and mindshare</td>
          </tr>
          <tr>
            <td><strong>Kubernetes</strong></td>
            <td>Large-scale, multi-host, multi-team</td>
            <td>The industry-standard orchestrator; steep learning curve, but unmatched ecosystem, cloud support, and extensibility</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="Deep Kubernetes Coverage Lives Elsewhere">
        This section deliberately stays at an orientation level for orchestration — Kubernetes
        alone is a large enough topic to warrant its own treatment. For pods, deployments,
        services, and manifests in depth, see the <strong>"Containers &amp; Kubernetes"</strong> lesson in
        the Microservices section, which builds directly on the Docker fundamentals you've covered
        here.
      </InfoBox>

      <InteractiveChallenge
        question="Why is deploying an image tagged `:latest` to production considered risky?"
        options={[
          "`:latest` images are always larger than versioned images",
          "`:latest` is a mutable, moving pointer — you can't be certain what code is actually running or reliably roll back to a specific previous version",
          "Docker refuses to run containers tagged `:latest` in production mode",
          "`:latest` tags cannot be pulled from private registries"
        ]}
        correctIndex={1}
        explanation="Unlike a git-sha or semver tag pinned to a specific build, `:latest` simply points at whatever was most recently pushed. It moves. That makes it impossible to know with certainty what's deployed, and rollbacks become guesswork instead of a precise re-deploy of a known-good, immutable tag."
      />

      <h2>Wrapping Up</h2>
      <p>
        Across this section you went from "what is a container" to a full production pipeline:
        writing efficient multi-stage Dockerfiles for both Node.js and Java services, orchestrating
        local multi-container stacks with Compose, understanding networking and volumes, hardening
        images and runtime configuration for security, and shipping images through a registry with
        a defensible tagging strategy and CI enforcement. From here, Kubernetes is the natural next
        step for running these same images at scale.
      </p>
    </LessonLayout>
  );
}
