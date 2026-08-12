import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Compose() {
  return (
    <LessonLayout
      title="Docker Compose & Local Dev"
      sectionId="docker"
      lessonIndex={2}
      prev={{ path: '/docker/dockerfile', label: 'Dockerfile & Multi-Stage Builds' }}
      next={{ path: '/docker/networking', label: 'Networking & Volumes' }}
    >
      <h2>Why Compose</h2>
      <p>
        A real application is rarely a single container. A typical backend needs the app itself,
        a database, and often a cache &mdash; each with its own image, environment variables, ports,
        and startup dependencies. Running each with a hand-typed <code>docker run</code> command is
        tedious and unrepeatable. <strong>Docker Compose</strong> lets you describe your entire
        multi-container stack declaratively in one YAML file and bring it all up with a single
        command.
      </p>

      <FlowChart
        title="A Typical Local Dev Stack"
        chart={"graph TD\n  Dev[Developer] -->|docker compose up| App[app service]\n  App -->|depends_on: healthy| DB[(db: Postgres)]\n  App -->|depends_on: started| Cache[(cache: Redis)]\n  App -->|bind mount| Src[Local source code]\n  DB --> Vol[(named volume: pgdata)]"}
      />

      <h2>A Complete docker-compose.yml</h2>
      <p>
        Here's a realistic local-dev stack: a Node.js app, a Postgres database, and a Redis cache.
        The same shape applies almost unchanged to a Spring Boot app &mdash; swap the <code>app</code>
        service's build context and environment variables for your Java project's, and Postgres
        remains a natural fit either way (via Spring Data JPA on the Java side).
      </p>

      <CodeBlock language="yaml" title="docker-compose.yml" showLineNumbers>
{`services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development       # use the dev stage of a multi-stage build
    ports:
      - "3000:3000"
    volumes:
      - .:/app                  # mount source code for hot reload
      - /app/node_modules       # exclude node_modules from the mount
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:secret@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:`}
      </CodeBlock>

      <p>
        A few things worth calling out line by line:
      </p>
      <ul>
        <li><code>target: development</code> selects a specific stage from a multi-stage Dockerfile &mdash;
          useful for running a dev stage with hot reload locally while production still builds the
          minimal final stage.</li>
        <li><code>volumes: - .:/app</code> is a <strong>bind mount</strong> &mdash; it maps your local source
          directory into the container so code edits are reflected immediately, without a rebuild.</li>
        <li><code>- /app/node_modules</code> with no host path is an anonymous volume that "masks" the
          bind mount at that specific path, preventing your local (possibly incompatible)
          <code>node_modules</code> from overwriting the container's own.</li>
        <li><code>depends_on</code> with <code>condition: service_healthy</code> makes the app service wait
          for Postgres's <code>healthcheck</code> to pass &mdash; not just for the container to start &mdash;
          before starting itself, avoiding a class of "connection refused at boot" bugs.</li>
      </ul>

      <InfoBox variant="info" title="depends_on Doesn't Wait for the App Inside to Be Ready">
        Without a <code>healthcheck</code>, <code>depends_on</code> only waits for the container process to
        start, not for Postgres itself to accept connections. Always pair <code>depends_on</code> with a
        <code>healthcheck</code> and <code>condition: service_healthy</code> for anything your app needs to
        actually communicate with at startup.
      </InfoBox>

      <h2>Essential Docker CLI Reference</h2>
      <p>
        Whether or not Compose is involved, these are the commands you'll reach for daily:
      </p>

      <CodeBlock language="bash" title="Docker CLI Reference">
{`# Build an image
docker build -t my-app:1.0 .
docker build -t my-app:1.0 --no-cache .           # ignore cache
docker build -t my-app:1.0 --target builder .      # build a specific stage

# Run a container
docker run -d --name my-app -p 3000:3000 my-app:1.0
docker run -it --rm node:20-alpine sh              # interactive, remove on exit
docker run -d -v $(pwd)/data:/app/data my-app:1.0  # mount a volume

# Container management
docker ps                      # running containers
docker ps -a                   # all containers (including stopped)
docker logs my-app -f          # follow logs
docker logs my-app --tail 100  # last 100 lines
docker exec -it my-app sh      # shell into a running container
docker stop my-app
docker rm my-app
docker start my-app

# Image management
docker images                  # list images
docker rmi my-app:1.0          # remove an image
docker image prune -a          # remove all unused images
docker system prune -a         # clean everything (careful!)

# Docker Compose
docker compose up -d           # start all services, detached
docker compose down            # stop and remove containers + network
docker compose logs -f app     # follow a specific service's logs
docker compose exec app sh     # shell into a running service
docker compose build --no-cache
docker compose ps              # status of services in this project`}
      </CodeBlock>

      <InfoBox variant="tip" title="docker compose vs docker-compose">
        Modern Docker ships Compose as a CLI plugin: <code>docker compose</code> (no hyphen). The older
        standalone <code>docker-compose</code> Python tool is deprecated but you'll still see it in
        older docs and CI scripts &mdash; functionally they're nearly identical for common usage.
      </InfoBox>

      <h2>Multiple Compose Files: Dev vs Prod</h2>
      <p>
        A single <code>docker-compose.yml</code> works for a demo, but real teams usually need
        different behavior locally versus in CI or production &mdash; hot reload and exposed
        debug ports locally, but leaner, restart-policy-hardened services elsewhere. Rather than
        maintaining two entirely separate files, Compose supports <strong>layering</strong> multiple
        files, where later files override or extend earlier ones.
      </p>

      <FlowChart
        title="Compose File Layering"
        chart={"graph LR\n  A[docker-compose.yml\\nbase config] --> C[Merged Config]\n  B[docker-compose.override.yml\\ndev-only additions] --> C\n  C --> D[docker compose up]"}
      />

      <p>
        By convention, <code>docker compose up</code> automatically merges <code>docker-compose.yml</code>
        with <code>docker-compose.override.yml</code> if the latter is present &mdash; no flags needed.
        This makes it the natural place for developer-only conveniences you don't want baked into
        the base file that CI and production also read.
      </p>

      <CodeBlock language="yaml" title="docker-compose.override.yml — Dev-Only Additions">
{`services:
  app:
    build:
      target: development
    volumes:
      - .:/app                # bind mount for hot reload — dev only
    environment:
      - DEBUG=app:*
    ports:
      - "9229:9229"            # Node.js inspector port, exposed locally only`}
      </CodeBlock>

      <p>
        For an explicit production file (no auto-merge — you name it directly), a common pattern
        is a slimmer, hardened override:
      </p>

      <CodeBlock language="yaml" title="docker-compose.prod.yml">
{`services:
  app:
    build:
      target: production
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
    # No source bind mount, no debug ports — production runs the built image as-is`}
      </CodeBlock>

      <CodeBlock language="bash" title="Selecting Files Explicitly">{`# Local dev — override.yml is picked up automatically
docker compose up -d

# Explicit combination for CI / staging
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Named "profiles" let you opt specific services in/out without separate files
# (e.g. only start a debugging tool locally)
docker compose --profile debug up -d`}</CodeBlock>

      <InfoBox variant="note" title="Profiles: A Lighter-Weight Alternative">
        For a small number of optional services (a mail-catcher, an admin UI, a seed-data job),
        Compose <code>profiles:</code> on individual services can be simpler than a whole extra file &mdash;
        tag a service with <code>profiles: [debug]</code> and it's skipped by default, only starting
        when you pass <code>--profile debug</code>.
      </InfoBox>

      <InteractiveChallenge
        question="When you run `docker compose up` with no extra flags, which file does Compose automatically merge on top of docker-compose.yml, if present?"
        options={[
          "docker-compose.prod.yml",
          "docker-compose.override.yml",
          "docker-compose.local.yml",
          "docker-compose.dev.yml"
        ]}
        correctIndex={1}
        explanation="Compose automatically detects and merges docker-compose.override.yml with docker-compose.yml — no -f flags required. Other filenames like docker-compose.prod.yml must be specified explicitly with -f."
      />

      <h2>What's Next</h2>
      <p>
        With Compose orchestrating your local stack, the next lesson goes deeper on the two
        pieces that make multi-container apps actually work together: Docker networking (how
        containers find and talk to each other) and volumes (how data survives container
        restarts).
      </p>
    </LessonLayout>
  );
}
