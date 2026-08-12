import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Security() {
  return (
    <LessonLayout
      title="Security & Best Practices"
      sectionId="docker"
      lessonIndex={4}
      prev={{ path: '/docker/networking', label: 'Networking & Volumes' }}
      next={{ path: '/docker/production', label: 'Production, Registries & Orchestration' }}
    >
      <h2>Defense in Depth for Containers</h2>
      <p>
        A container is not a security boundary on its own &mdash; it shares the host kernel, and a
        misconfigured or compromised container can, in the worst case, escalate to the host.
        Hardening a container image and its runtime configuration is a layered effort: reduce
        what's inside the image, reduce what the running container is allowed to do, and catch
        known vulnerabilities before they ship.
      </p>

      <FlowChart
        title="Container Security: Defense in Depth"
        chart={"graph TD\n  A[1. Minimal base image] --> B[2. Non-root USER]\n  B --> C[3. Image scanning in CI]\n  C --> D[4. No secrets baked into layers]\n  D --> E[5. Read-only filesystem + dropped capabilities]\n  E --> F[6. Resource limits]\n  F --> G[Hardened container]"}
      />

      <h2>Run as Non-Root</h2>
      <p>
        By default, a container's main process runs as <code>root</code> inside the container. If an
        attacker exploits the application to gain arbitrary code execution, running as root gives
        them root inside the container &mdash; and a much shorter path to exploiting a kernel or
        Docker Engine vulnerability to escape to the host entirely. Creating a dedicated
        unprivileged user and switching to it with <code>USER</code> is one of the single highest-value
        hardening steps you can take.
      </p>

      <CodeBlock language="dockerfile" title="Creating and Switching to a Non-Root User">
{`FROM node:20-alpine
WORKDIR /app

# Create a dedicated, unprivileged user and group
RUN addgroup -g 1001 appgroup && \\
    adduser -u 1001 -G appgroup -s /bin/sh -D appuser

COPY --chown=appuser:appgroup package*.json ./
RUN npm ci --only=production
COPY --chown=appuser:appgroup . .

# Everything from this line onward runs as appuser, not root
USER appuser

EXPOSE 3000
CMD ["node", "server.js"]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Some Official Images Already Include a Non-Root User">
        Many official images (like <code>node</code>) ship a pre-created, unprivileged <code>node</code> user
        you can use directly with <code>USER node</code> instead of creating your own. Check the image's
        documentation before rolling your own &mdash; it saves a few lines and is one less thing to
        get wrong.
      </InfoBox>

      <h2>Image Scanning</h2>
      <p>
        Every base image and every dependency layer you build on top of can carry known
        vulnerabilities (CVEs). Scanning images &mdash; ideally as a required step in CI, before an
        image is ever pushed to a registry &mdash; catches these before they reach production.
      </p>

      <CodeBlock language="bash" title="Scanning an Image with Trivy">{`# Trivy is a free, widely-used open-source scanner
# https://github.com/aquasecurity/trivy

trivy image my-app:1.0

# Fail the CI build on HIGH/CRITICAL findings
trivy image --severity HIGH,CRITICAL --exit-code 1 my-app:1.0

# Alternatives:
# docker scout cves my-app:1.0     — built into Docker Desktop/CLI
# snyk container test my-app:1.0   — Snyk's container scanning`}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Tool</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Trivy</strong></td>
            <td>Free, open-source, fast, easy to drop into any CI pipeline</td>
          </tr>
          <tr>
            <td><strong>Docker Scout</strong></td>
            <td>Built directly into the Docker CLI/Desktop, integrates with Docker Hub</td>
          </tr>
          <tr>
            <td><strong>Snyk</strong></td>
            <td>Commercial, strong at prioritizing fixable vulnerabilities and suggesting base-image upgrades</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="Scan Early and Scan Often">
        Scanning on every merge to main catches new CVEs disclosed against your <em>existing</em>
        dependencies, not just new code — a base image with zero known vulnerabilities today can
        have several disclosed against it next month. Re-scan built images on a schedule, not just
        at build time.
      </InfoBox>

      <h2>Minimal & Distroless Base Images</h2>
      <p>
        Every package in your base image is both attack surface and scan noise. Alpine already
        cuts this down significantly versus a full Debian/Ubuntu base, but "distroless" images go
        further &mdash; they contain your application and its runtime dependencies and nothing
        else: no shell, no package manager, no coreutils.
      </p>

      <CodeBlock language="dockerfile" title="Distroless Runtime Stage (Java example)">
{`# Build stage — unchanged, full JDK + Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Runtime stage — Google's distroless Java image: no shell, no package manager
FROM gcr.io/distroless/java21-debian12
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
USER nonroot
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]`}
      </CodeBlock>

      <InfoBox variant="note" title="The Trade-Off">
        Distroless images are harder to debug &mdash; there's no shell to <code>docker exec</code> into.
        Many teams keep an Alpine-based image for local development and staging (where you might
        need to shell in) and switch to distroless only for the final production build, or keep a
        separate debug-tagged image available alongside the distroless production one.
      </InfoBox>

      <h2>Secrets Management</h2>
      <p>
        The single most common container security mistake is baking a secret &mdash; an API key, a
        database password, a private certificate &mdash; into an image layer via <code>ENV</code>, <code>ARG</code>,
        or a <code>COPY</code>'d file. Because image layers are content-addressed and cached, that
        secret persists in the image's history <em>forever</em>, even if a later layer deletes the
        file. Anyone who can pull the image (including from a registry misconfiguration) can
        extract it.
      </p>

      <FlowChart
        title="Where Secrets Should NOT Live vs Where They Should"
        chart={"graph TD\n  A[Secret] -->|WRONG: ENV/ARG/COPY into image| B[Baked into a layer forever]\n  A -->|RIGHT: BuildKit --secret| C[Available only during that RUN step]\n  A -->|RIGHT: runtime env var| D[Injected when container starts]\n  A -->|RIGHT: mounted secret file| E[Read from a volume/vault at runtime]"}
      />

      <CodeBlock language="dockerfile" title="BuildKit --secret: Build-Time Secrets That Never Land in a Layer">
{`# syntax=docker/dockerfile:1
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./

# The secret is mounted only for the duration of this RUN instruction,
# and is never written to the resulting layer or image history.
RUN --mount=type=secret,id=npm_token \\
    NPM_TOKEN=$(cat /run/secrets/npm_token) npm ci

COPY . .
CMD ["node", "server.js"]`}
      </CodeBlock>

      <CodeBlock language="bash" title="Passing the Secret at Build Time">{`export DOCKER_BUILDKIT=1
docker build --secret id=npm_token,src=$HOME/.npm_token -t my-app:1.0 .`}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Approach</th>
            <th>Good for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Runtime environment variables</strong></td>
            <td>Simple config secrets injected by the orchestrator (Compose <code>.env</code>, Kubernetes Secret env)</td>
          </tr>
          <tr>
            <td><strong>Mounted secret files</strong></td>
            <td>Certificates, keys — read from a file path rather than an env var, less likely to leak via logs/env dumps</td>
          </tr>
          <tr>
            <td><strong>A vault (HashiCorp Vault, AWS Secrets Manager)</strong></td>
            <td>Production systems needing rotation, auditing, and fine-grained access control</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="danger" title="Never Do This">
        <code>ENV DATABASE_PASSWORD=hunter2</code> or <code>ARG API_KEY=xyz</code> baked into a Dockerfile
        means that value is permanently visible via <code>docker history</code> or <code>docker inspect</code>
        on anyone who can pull the image — regardless of what later instructions do.
      </InfoBox>

      <h2>Runtime Hardening</h2>
      <p>
        Beyond the image itself, how you <em>run</em> a container matters just as much. A few flags
        meaningfully reduce what a compromised container can do to the host or to other
        containers:
      </p>

      <CodeBlock language="bash" title="Hardened docker run">{`docker run -d \\
  --name my-app \\
  --read-only \\                          # root filesystem is read-only
  --tmpfs /tmp \\                         # writable scratch space only where needed
  --memory=512m --cpus=1.0 \\             # resource limits — contain runaway processes
  --cap-drop=ALL \\                       # drop every Linux capability by default
  --cap-add=NET_BIND_SERVICE \\           # then add back only what's actually needed
  --security-opt no-new-privileges \\     # block privilege escalation via setuid binaries
  my-app:1.0`}</CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>What it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--read-only</code></td>
            <td>Makes the container's root filesystem immutable; pair with <code>--tmpfs</code> for any directory the app must write to</td>
          </tr>
          <tr>
            <td><code>--memory</code> / <code>--cpus</code></td>
            <td>Caps resource usage so one runaway container can't starve the host or its neighbors</td>
          </tr>
          <tr>
            <td><code>--cap-drop=ALL</code> / <code>--cap-add=...</code></td>
            <td>Linux capabilities are fine-grained root privileges (binding low ports, changing file ownership, etc.); drop all, then allow only what's required</td>
          </tr>
        </tbody>
      </table>

      <h2>Pin Base Image Digests</h2>
      <p>
        A tag like <code>node:20-alpine</code> is mutable &mdash; the maintainers can (and do) push a new
        image under the same tag when they patch it. That's usually desirable for picking up
        security fixes, but it also means the exact bytes of your base image can change between
        builds without any change to your Dockerfile, undermining reproducibility and making
        supply-chain attacks (a compromised upstream image) possible without any visible signal
        in your repo. Pinning to a content-addressed digest locks in the exact image:
      </p>

      <CodeBlock language="dockerfile" title="Pinning by Digest for Supply-Chain Integrity">{`# Tag alone — mutable, can silently change
FROM node:20-alpine

# Digest-pinned — immutable, guaranteed to be byte-for-byte identical every build
FROM node:20-alpine@sha256:9f1b7f9c... `}</CodeBlock>

      <InfoBox variant="tip" title="Practical Balance">
        Fully digest-pinning every build is common in high-security environments but adds
        maintenance overhead (you must deliberately bump the digest to get patches). A common
        middle ground: pin digests in production release Dockerfiles, tracked and updated via a
        dependency bot (Renovate, Dependabot both support digest pinning), while local dev
        Dockerfiles use the mutable tag for convenience.
      </InfoBox>

      <InteractiveChallenge
        question="Why is `ENV API_KEY=xyz` in a Dockerfile a security problem, even if a later instruction deletes or overwrites that file?"
        options={[
          "It isn't a problem as long as the final CMD doesn't reference the key",
          "Docker image layers are immutable and cached — the secret persists in the image's layer history forever, extractable via docker history",
          "Environment variables set with ENV are automatically encrypted by Docker",
          "It's only a problem if the image is pushed to a public registry"
        ]}
        correctIndex={1}
        explanation="Each Dockerfile instruction creates a new, immutable, cached layer. A secret set via ENV (or ARG, or copied in via COPY) exists in that layer permanently — even a later instruction that appears to remove it only adds a new layer on top; the original layer, and the secret in it, is still part of the image and extractable by anyone who can pull it."
      />

      <h2>What's Next</h2>
      <p>
        With a hardened image and runtime configuration, the final lesson covers what happens
        once you're ready to ship: pushing to registries, tagging strategy, health checks in
        production, running Docker in CI/CD, and a brief orientation to orchestration options.
      </p>
    </LessonLayout>
  );
}
