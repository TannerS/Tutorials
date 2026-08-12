import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DockerfileLesson() {
  return (
    <LessonLayout
      title="Dockerfile & Multi-Stage Builds"
      sectionId="docker"
      lessonIndex={1}
      prev={{ path: '/docker/intro', label: 'What is Docker?' }}
      next={{ path: '/docker/compose', label: 'Docker Compose & Local Dev' }}
    >
      <h2>The Dockerfile Instruction Set</h2>
      <p>
        A Dockerfile is a plain-text recipe. Each instruction produces a new, cached
        <strong> layer</strong> on top of the previous one, and the final stack of layers is your
        image. Here's the full instruction reference you'll use in real-world Dockerfiles:
      </p>

      <CodeBlock language="dockerfile" title="Dockerfile Instruction Reference" showLineNumbers>
{`# FROM — every Dockerfile starts from a base image. Always pin a specific
# tag; never build against a moving target like "latest".
FROM node:20-alpine

# WORKDIR — sets the working directory for all subsequent instructions.
# Creates the directory if it doesn't exist.
WORKDIR /app

# ENV — sets an environment variable available at BUILD time and at
# CONTAINER RUNTIME. Baked permanently into the image.
ENV NODE_ENV=production
ENV PORT=3000

# ARG — a build-time-only variable, NOT available once the container runs.
# Pass with --build-arg. Useful for version pinning without hardcoding.
ARG APP_VERSION=1.0.0

# COPY — copies files from the build context (your machine) into the image.
# Copy dependency manifests BEFORE source code — see layer caching below.
COPY package.json package-lock.json ./

# RUN — executes a command during the BUILD and commits the result as a
# new layer. This is where you install dependencies, compile, etc.
RUN npm ci --only=production

# COPY the rest of the source after dependencies are installed.
COPY . .

# EXPOSE — documentation only. It does NOT publish the port to the host;
# you still need "-p" on "docker run" or "ports:" in compose.
EXPOSE 3000

# HEALTHCHECK — tells Docker (and orchestrators) how to probe liveness.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

# CMD — the default command run when the container starts.
CMD ["node", "server.js"]`}
      </CodeBlock>

      <h2>CMD vs ENTRYPOINT</h2>
      <p>
        These two instructions are frequently confused because they can look interchangeable in
        simple examples, but they serve different purposes:
      </p>

      <FlowChart
        title="How CMD and ENTRYPOINT Combine"
        chart={"graph LR\n  A[ENTRYPOINT: fixed executable] --> C[Final command run]\n  B[CMD: default arguments] --> C\n  D[docker run overrides CMD] --> C"}
      />

      <table>
        <thead>
          <tr>
            <th>Behavior</th>
            <th><code>CMD</code></th>
            <th><code>ENTRYPOINT</code></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Purpose</td>
            <td>Default command <em>and</em> its arguments</td>
            <td>The fixed, always-run executable</td>
          </tr>
          <tr>
            <td>Overridable?</td>
            <td>Fully overridden by any <code>docker run</code> arguments</td>
            <td>Not overridden unless <code>--entrypoint</code> is passed</td>
          </tr>
          <tr>
            <td>Typical use</td>
            <td>Simple images with one obvious default action</td>
            <td>Images built to behave like a single executable/CLI</td>
          </tr>
        </tbody>
      </table>

      <CodeBlock language="dockerfile" title="ENTRYPOINT + CMD Combined">{`# ENTRYPOINT sets the fixed program to run
ENTRYPOINT ["java", "-jar"]

# CMD supplies the default argument — overridable at "docker run" time
CMD ["app.jar"]

# docker run my-image                  → java -jar app.jar
# docker run my-image other.jar        → java -jar other.jar
# docker run --entrypoint sh my-image  → drops into a shell instead`}</CodeBlock>

      <InfoBox variant="info" title="Rule of Thumb">
        If a container should <em>always</em> run the same program (a JAR, a Python script, a CLI
        tool), use <code>ENTRYPOINT</code> with <code>CMD</code> supplying default arguments. If a container is
        more of a general-purpose environment where the command might vary, plain <code>CMD</code> is
        simpler and easier to override for debugging.
      </InfoBox>

      <h2>Layer Caching: Why Instruction Order Matters</h2>
      <p>
        Docker builds an image layer by layer, and it caches each layer keyed by the instruction
        and its inputs. On a rebuild, Docker walks the Dockerfile top to bottom and reuses a
        cached layer as long as nothing about that instruction (or anything above it) has changed.
        The moment one layer's cache misses, <em>every layer after it</em> must be rebuilt too
        &mdash; even if their own inputs didn't change.
      </p>

      <FlowChart
        title="Layer Cache Invalidation"
        chart={"graph TD\n  A[FROM node:20-alpine] --> B[COPY package.json]\n  B --> C[RUN npm ci]\n  C --> D[COPY source code]\n  D --> E[CMD]\n  F[Source code changes] -.invalidates.-> D\n  D -.forces rebuild of.-> E\n  G[package.json changes] -.invalidates.-> B\n  B -.forces rebuild of.-> C\n  C -.forces rebuild of.-> D"}
      />

      <p>
        This is why the pattern of <strong>copying dependency manifests before source code</strong> is
        one of the highest-leverage habits in Dockerfile authoring. Source code changes on nearly
        every commit; <code>package.json</code> or <code>pom.xml</code> change rarely. Structuring the
        Dockerfile so the expensive dependency-install step sits above the frequently-changing
        <code>COPY . .</code> means most rebuilds skip straight past <code>npm ci</code> or <code>mvn
        dependency:go-offline</code> entirely and reuse the cached layer &mdash; often turning a
        90-second rebuild into a 3-second one.
      </p>

      <InfoBox variant="warning" title="A Common Anti-Pattern">
        Writing <code>COPY . .</code> followed by <code>RUN npm install</code> means <em>any</em> source
        file change (even a comment) invalidates the dependency-install layer, forcing a full
        reinstall on every single build. Always separate the manifest copy from the source copy.
      </InfoBox>

      <h3>BuildKit Cache Mounts</h3>
      <p>
        Layer ordering gets you a long way, but it is all-or-nothing: the
        moment <code>package.json</code> changes at all, the entire dependency
        install re-runs from scratch and re-downloads every package. BuildKit
        (the default builder since Docker 23) fixes this with{' '}
        <strong>cache mounts</strong> — a persistent directory that survives
        across builds and is <em>not</em> committed into the image layer.
      </p>

      <CodeBlock language="dockerfile" title="Dockerfile — cache mounts" showLineNumbers>
{`# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./

# The npm download cache persists between builds. Adding one dependency
# re-downloads one package instead of all of them — and the cache
# directory never becomes part of the image.
RUN --mount=type=cache,target=/root/.npm \\
    npm ci

# Maven works the same way — hugely effective, since ~/.m2 is enormous.
# RUN --mount=type=cache,target=/root/.m2 \\
#     mvn -B package -DskipTests

# Secrets get their own mount type. Unlike ARG or ENV, a secret mount
# leaves NO trace in the image history — never pass tokens via ARG.
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \\
    npm ci --omit=dev`}
      </CodeBlock>

      <InfoBox variant="tip" title="Cache Mounts vs. Layer Cache">
        <p>
          They solve different problems and are best used together. The{' '}
          <strong>layer cache</strong> skips an instruction entirely when
          nothing changed. A <strong>cache mount</strong> makes the instruction
          cheaper when it <em>does</em> have to run.
        </p>
        <p>
          One caveat for CI: cache mounts live on the build host, so an
          ephemeral runner starts cold every time. Use{' '}
          <code>docker buildx build --cache-from</code> /{' '}
          <code>--cache-to</code> pointed at a registry to persist build cache
          across CI runs.
        </p>
      </InfoBox>

      <h2>Multi-Stage Builds</h2>
      <p>
        Multi-stage builds solve a different problem: build tooling (compilers, package managers,
        dev dependencies) is large and has no business existing in your production image. A
        multi-stage Dockerfile uses <em>multiple</em> <code>FROM</code> instructions in one file &mdash; each
        starts a new, independent stage &mdash; and lets later stages selectively copy only the
        finished artifacts out of earlier stages with <code>COPY --from=</code>.
      </p>

      <FlowChart
        title="Multi-Stage Build Flow"
        chart={"graph LR\n  A[Stage 1: builder\\nfull toolchain] -->|COPY --from=builder| B[Stage 2: production\\nruntime only]\n  A -.discarded after build.-> X[Build tools never\\nreach final image]"}
      />

      <h3>Node.js Multi-Stage Build</h3>
      <CodeBlock language="dockerfile" title="Dockerfile — Node.js" showLineNumbers>
{`# Stage 1: Build — has the full toolchain (npm, devDependencies, build scripts)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                  # installs ALL deps, including devDependencies
COPY . .
RUN npm run build

# Stage 2: Production dependencies ONLY.
# This separate stage matters: the builder's node_modules contains
# devDependencies (typescript, eslint, test runners). Copying that
# directory straight into production would ship all of it.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev       # production dependencies only

# Stage 3: Production — starts fresh from a clean base image
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Create a dedicated non-root user (covered in depth in Security & Best Practices)
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser

# Compiled output from the builder, runtime deps from the deps stage —
# TypeScript source, devDependencies, and build caches are left behind
COPY --from=builder /app/dist ./dist
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]`}
      </CodeBlock>

      <h3>Java (Spring Boot) Multi-Stage Build</h3>
      <p>
        The same pattern applies directly to a Java service &mdash; Maven and the JDK are needed
        only to <em>produce</em> the JAR, not to <em>run</em> it. The runtime stage only needs a JRE:
      </p>
      <CodeBlock language="dockerfile" title="Dockerfile — Spring Boot" showLineNumbers>
{`# Stage 1: Build with Maven + full JDK
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
# Resolve dependencies before copying source — same caching principle as npm ci
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime — JRE only, no compiler, no Maven, no source
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \\
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]`}
      </CodeBlock>

      <p>
        In both examples, the final image contains no compiler, no build cache, and no dev
        dependencies &mdash; only the compiled artifact and the minimal runtime it needs. A
        Node.js build image might be 900MB; the resulting production image can be under 150MB. A
        Maven builder image can exceed 500MB; the JRE-alpine runtime image is often under 200MB.
      </p>

      <InfoBox variant="tip" title="Named Stages Are Reusable Targets">
        Naming a stage with <code>AS builder</code> lets you target it directly:
        <code>docker build --target builder -t my-app:debug .</code> builds only up through that stage
        &mdash; handy for debugging a failing build step without waiting for the full production
        stage, or for a separate "development" stage with hot-reload tooling.
      </InfoBox>

      <h2>.dockerignore</h2>
      <p>
        Everything in the build context gets sent to the Docker daemon before the build even
        starts, and anything not explicitly excluded can end up inside a <code>COPY . .</code> layer.
        A <code>.dockerignore</code> file (same syntax as <code>.gitignore</code>) keeps the context small
        and prevents secrets or bloat from leaking into image layers.
      </p>

      <CodeBlock language="dockerfile" title=".dockerignore">
{`node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
Dockerfile
docker-compose*.yml
.dockerignore
coverage
.nyc_output
dist
build
target
*.md
.vscode
.idea`}
      </CodeBlock>

      <InfoBox variant="danger" title="Never Rely on .dockerignore for Secrets Already Copied">
        Excluding <code>.env</code> in <code>.dockerignore</code> stops it from being copied in future
        builds, but if it was ever copied into an earlier layer, it still lives in that layer's
        history &mdash; even if a later layer deletes it. We cover proper secrets handling
        (BuildKit <code>--secret</code>, runtime injection) in the Security &amp; Best Practices lesson.
      </InfoBox>

      <h2>Image Size Checklist</h2>
      <p>
        A few habits compound into dramatically smaller, faster-to-pull, faster-to-scan images:
      </p>
      <InfoBox variant="tip" title="Image Size Checklist">
        <ul>
          <li>Use Alpine-based images (<code>node:20-alpine</code> is ~50MB vs ~350MB for the full image)</li>
          <li>Use multi-stage builds to exclude build tools from the production stage</li>
          <li>Copy dependency manifests (<code>package.json</code>, <code>pom.xml</code>) before source, to leverage layer caching</li>
          <li>Run <code>npm ci --only=production</code> (or Maven's offline resolve) to skip dev dependencies</li>
          <li>Combine related <code>RUN</code> commands with <code>&amp;&amp;</code> to avoid extra layers where it helps readability without hurting caching</li>
          <li>Always run as a non-root user with <code>USER</code></li>
          <li>Add a thorough <code>.dockerignore</code> to exclude unnecessary files from the build context</li>
          <li>Pin base image tags &mdash; never use <code>latest</code> in production</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question="Why should you copy package.json (or pom.xml) before copying the rest of your source code in a Dockerfile?"
        options={[
          "It makes the container start faster at runtime",
          "Docker requires dependency files to be copied first",
          "It leverages Docker layer caching — dependencies are only reinstalled when the manifest changes",
          "It reduces the final image size automatically"
        ]}
        correctIndex={2}
        explanation="Docker caches each layer keyed by its instruction and inputs. Copying the dependency manifest and installing dependencies before copying source code means that layer stays cached across rebuilds where only source code changed — skipping the expensive install step entirely."
      />

      <h2>What's Next</h2>
      <p>
        With a solid Dockerfile in hand, the next lesson covers Docker Compose &mdash; orchestrating
        your app alongside a database and cache for local development, plus the essential CLI
        commands you'll run daily.
      </p>
    </LessonLayout>
  );
}
