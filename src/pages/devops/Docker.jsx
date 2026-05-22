import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Docker() {
  return (
    <LessonLayout
      title="Docker Fundamentals"
      sectionId="devops"
      lessonIndex={3}
      prev={{ path: '/devops/cicd', label: 'CI/CD Pipelines' }}
      next={{ path: '/devops/cloud', label: 'Cloud Basics (AWS/Azure)' }}
    >
      <h2>Core Concepts</h2>
      <p>
        Docker packages applications and their dependencies into lightweight, portable containers
        that run consistently across any environment.
      </p>

      <FlowChart
        title="Docker Architecture"
        chart={"graph TD\nA[Dockerfile] -->|docker build| B[Image]\nB -->|docker run| C[Container]\nB -->|docker push| D[Registry]\nD -->|docker pull| B\nC --> E[Volumes - Persistent Data]\nC --> F[Networks - Container Communication]\nC --> G[Ports - Host Mapping]\nstyle A fill:#2196F3,color:#fff\nstyle B fill:#4CAF50,color:#fff\nstyle C fill:#FF9800,color:#fff\nstyle D fill:#9C27B0,color:#fff"}
      />

      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>What It Is</th>
            <th>Analogy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Image</strong></td>
            <td>Read-only template with app + dependencies</td>
            <td>A class definition</td>
          </tr>
          <tr>
            <td><strong>Container</strong></td>
            <td>Running instance of an image</td>
            <td>An object/instance</td>
          </tr>
          <tr>
            <td><strong>Volume</strong></td>
            <td>Persistent storage that outlives containers</td>
            <td>An external hard drive</td>
          </tr>
          <tr>
            <td><strong>Network</strong></td>
            <td>Virtual network for container communication</td>
            <td>A private LAN</td>
          </tr>
          <tr>
            <td><strong>Registry</strong></td>
            <td>Storage for images (Docker Hub, ECR, ACR)</td>
            <td>An app store</td>
          </tr>
        </tbody>
      </table>

      <h2>Dockerfile Instructions</h2>

      <CodeBlock language="dockerfile" title="Dockerfile Reference">
{`# Base image — always start with a specific tag, never "latest"
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Build-time arguments (not available at runtime)
ARG APP_VERSION=1.0.0

# Copy dependency files first (better layer caching)
COPY package.json package-lock.json ./

# Run commands during build
RUN npm ci --only=production

# Copy application source
COPY . .

# Expose port (documentation — does not publish the port)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Default command to run
CMD ["node", "server.js"]

# Alternative: ENTRYPOINT + CMD
# ENTRYPOINT ["node"]     # fixed executable
# CMD ["server.js"]       # default argument (overridable)`}
      </CodeBlock>

      <InfoBox variant="info" title="CMD vs ENTRYPOINT">
        <code>CMD</code> sets the default command but can be completely overridden at runtime.
        <code>ENTRYPOINT</code> sets the fixed executable — <code>CMD</code> becomes its default
        arguments. Use ENTRYPOINT when the container should always run the same program.
      </InfoBox>

      <h2>Multi-Stage Builds</h2>
      <p>
        Multi-stage builds drastically reduce image size by separating the build environment
        from the runtime environment.
      </p>

      <CodeBlock language="dockerfile" title="Node.js Multi-Stage Build">
{`# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]`}
      </CodeBlock>

      <CodeBlock language="dockerfile" title="Java Multi-Stage Build">
{`# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime with JRE only
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -g 1001 appgroup && adduser -u 1001 -G appgroup -s /bin/sh -D appuser
COPY --from=builder /app/target/*.jar app.jar
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]`}
      </CodeBlock>

      <h2>Docker Compose for Local Development</h2>

      <CodeBlock language="yaml" title="docker-compose.yml">
{`version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: development       # use dev stage of multi-stage build
    ports:
      - "3000:3000"
    volumes:
      - .:/app                  # mount source code for hot reload
      - /app/node_modules       # exclude node_modules from mount
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

      <h2>Essential Docker Commands</h2>

      <CodeBlock language="bash" title="Docker CLI Reference">
{`# Build an image
docker build -t my-app:1.0 .
docker build -t my-app:1.0 --no-cache .           # ignore cache
docker build -t my-app:1.0 --target builder .      # build specific stage

# Run a container
docker run -d --name my-app -p 3000:3000 my-app:1.0
docker run -it --rm node:20-alpine sh              # interactive, remove on exit
docker run -d -v $(pwd)/data:/app/data my-app:1.0  # mount volume

# Container management
docker ps                      # running containers
docker ps -a                   # all containers (including stopped)
docker logs my-app -f          # follow logs
docker logs my-app --tail 100  # last 100 lines
docker exec -it my-app sh      # shell into running container
docker stop my-app
docker rm my-app
docker start my-app

# Image management
docker images                  # list images
docker rmi my-app:1.0          # remove image
docker image prune -a          # remove all unused images
docker system prune -a         # clean everything (careful!)

# Docker Compose
docker compose up -d           # start all services
docker compose down            # stop and remove
docker compose logs -f app     # follow specific service logs
docker compose exec app sh     # shell into service
docker compose build --no-cache`}
      </CodeBlock>

      <h2>Docker Networking</h2>

      <CodeBlock language="bash" title="Networking Commands">
{`# List networks
docker network ls

# Create a custom network
docker network create my-network

# Run containers on the same network (they can reach each other by name)
docker run -d --name api --network my-network my-api:1.0
docker run -d --name db --network my-network postgres:16

# From the api container, you can connect to: db:5432
# Docker DNS resolves container names automatically

# Inspect network
docker network inspect my-network`}
      </CodeBlock>

      <h2>Volume Mounting</h2>

      <CodeBlock language="bash" title="Volume Types">
{`# Named volume (managed by Docker, persists across restarts)
docker volume create app-data
docker run -v app-data:/app/data my-app:1.0

# Bind mount (maps host directory into container)
docker run -v $(pwd)/src:/app/src my-app:1.0

# Read-only mount
docker run -v $(pwd)/config:/app/config:ro my-app:1.0

# tmpfs mount (in-memory, no persistence)
docker run --tmpfs /app/temp my-app:1.0

# List and clean volumes
docker volume ls
docker volume prune`}
      </CodeBlock>

      <InfoBox variant="warning" title="Bind Mount Gotcha">
        When using bind mounts on macOS, file I/O can be significantly slower than on Linux.
        Use named volumes for directories with many files (like <code>node_modules</code>)
        and bind mounts only for source code you need to edit.
      </InfoBox>

      <h2>Best Practices</h2>

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
*.md
.vscode
.idea`}
      </CodeBlock>

      <InfoBox variant="tip" title="Image Size Checklist">
        <ul>
          <li>Use Alpine-based images (<code>node:20-alpine</code> is ~50MB vs ~350MB for full)</li>
          <li>Use multi-stage builds to exclude build tools from production</li>
          <li>Copy <code>package.json</code> before source to leverage layer caching</li>
          <li>Run <code>npm ci --only=production</code> to skip dev dependencies</li>
          <li>Always run as non-root user with <code>USER</code></li>
          <li>Add <code>.dockerignore</code> to exclude unnecessary files</li>
          <li>Pin image tags — never use <code>latest</code> in production</li>
        </ul>
      </InfoBox>

      <InteractiveChallenge
        question={"Why should you copy package.json before copying the rest of your source code in a Dockerfile?"}
        options={[
          "It makes the container start faster",
          "Docker requires dependency files to be copied first",
          "It leverages Docker layer caching — dependencies are only reinstalled when package.json changes",
          "It reduces the final image size"
        ]}
        correctIndex={2}
        explanation={"Docker caches each layer. If you copy package.json and run npm install before copying source code, Docker reuses the cached dependency layer when only your source code changes. This dramatically speeds up rebuilds since npm install is typically the slowest step."}
        language="dockerfile"
      />
    </LessonLayout>
  );
}

export default function DockerPage() {
  return <Docker />;
}
