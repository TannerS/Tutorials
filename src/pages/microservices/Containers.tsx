import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Containers() {
  return (
    <LessonLayout
      title="Containers & Kubernetes"
      sectionId="microservices"
      lessonIndex={6}
      prev={{ path: '/microservices/events', label: 'Event-Driven Architecture' }}
      next={{ path: '/microservices/migration', label: 'Migration & Decomposition' }}
    >
      <h2>Why Containers?</h2>
      <p>
        Containers solve the &quot;works on my machine&quot; problem. A container packages your application
        with all its dependencies (runtime, libraries, config) into a lightweight, portable unit
        that runs identically everywhere — your laptop, CI/CD pipeline, staging, and production.
      </p>

      <FlowChart
        title="VMs vs Containers"
        chart={"graph TD\n  subgraph Virtual Machines\n    HW1[Hardware] --> HV[Hypervisor]\n    HV --> VM1[VM: Full OS + App A]\n    HV --> VM2[VM: Full OS + App B]\n    HV --> VM3[VM: Full OS + App C]\n  end\n  subgraph Containers\n    HW2[Hardware] --> OS[Host OS]\n    OS --> CR[Container Runtime]\n    CR --> C1[Container: App A]\n    CR --> C2[Container: App B]\n    CR --> C3[Container: App C]\n  end\n  style VM1 fill:#ef4444,color:#fff\n  style VM2 fill:#ef4444,color:#fff\n  style VM3 fill:#ef4444,color:#fff\n  style C1 fill:#10b981,color:#fff\n  style C2 fill:#10b981,color:#fff\n  style C3 fill:#10b981,color:#fff"}
      />

      <InfoBox variant="info" title="Containers vs VMs">
        VMs virtualize the entire hardware — each VM runs its own operating system (GB of overhead).
        Containers share the host OS kernel and only package the application and its dependencies
        (MB of overhead). Containers start in seconds, VMs in minutes. Containers are the standard
        deployment unit for microservices.
      </InfoBox>

      <h2>Docker Fundamentals</h2>

      <h3>Dockerfile</h3>
      <p>
        A Dockerfile defines how to build a container image. It specifies the base image, copies
        your code, installs dependencies, and defines how to start the application.
      </p>

      <CodeBlock language="dockerfile" title="Production-Ready Node.js Dockerfile">
{`# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first (layer caching!)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD wget --spider -q http://localhost:8080/health || exit 1

# Switch to non-root user
USER appuser

CMD ["node", "dist/server.js"]`}
      </CodeBlock>

      <CodeBlock language="dockerfile" title="Production-Ready Java Dockerfile">
{`# Stage 1: Build with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline  # cache dependencies
COPY src/ ./src/
RUN mvn package -DskipTests

# Stage 2: Production image with JRE only
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app

# Security: non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy only the JAR
COPY --from=builder /app/target/*.jar app.jar

# JVM tuning for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport \\
  -XX:MaxRAMPercentage=75.0 \\
  -XX:InitialRAMPercentage=50.0 \\
  -XX:+UseG1GC \\
  -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \\
  CMD wget --spider -q http://localhost:8080/actuator/health || exit 1

USER spring

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Docker Best Practices">
        <ul>
          <li><strong>Multi-stage builds</strong> — separate build and runtime stages to keep images small</li>
          <li><strong>Non-root user</strong> — never run containers as root in production</li>
          <li><strong>Layer caching</strong> — copy package.json before source code for better caching</li>
          <li><strong>Alpine base</strong> — use Alpine images (~5MB vs ~900MB for full Ubuntu)</li>
          <li><strong>.dockerignore</strong> — exclude node_modules, .git, tests from the build context</li>
          <li><strong>Health checks</strong> — define HEALTHCHECK in Dockerfile for orchestrator integration</li>
        </ul>
      </InfoBox>

      <h2>Kubernetes (K8s) Concepts</h2>
      <p>
        Kubernetes is the industry-standard container orchestration platform. It automates deployment,
        scaling, and management of containerized applications. Understanding its core concepts is
        essential for operating microservices in production.
      </p>

      <FlowChart
        title="Kubernetes Architecture"
        chart={"graph TD\n  User[Developer / CI/CD] --> API[API Server]\n  subgraph Control Plane\n    API --> ETCD[(etcd - State Store)]\n    API --> SCHED[Scheduler]\n    API --> CM[Controller Manager]\n  end\n  subgraph Worker Node 1\n    KL1[Kubelet] --> P1[Pod: Order Service]\n    KL1 --> P2[Pod: Payment Service]\n    KP1[Kube-Proxy] --> P1\n    KP1 --> P2\n  end\n  subgraph Worker Node 2\n    KL2[Kubelet] --> P3[Pod: Order Service]\n    KL2 --> P4[Pod: Catalog Service]\n    KP2[Kube-Proxy] --> P3\n    KP2 --> P4\n  end\n  API --> KL1\n  API --> KL2"}
      />

      <h3>Core Kubernetes Objects</h3>

      <table>
        <thead>
          <tr>
            <th>Object</th>
            <th>Purpose</th>
            <th>Key Facts</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pod</strong></td>
            <td>Smallest deployable unit</td>
            <td>One or more containers sharing network/storage. Ephemeral — can be killed anytime.</td>
          </tr>
          <tr>
            <td><strong>Deployment</strong></td>
            <td>Manages pod replicas</td>
            <td>Ensures desired number of pods are running. Handles rolling updates and rollbacks.</td>
          </tr>
          <tr>
            <td><strong>Service</strong></td>
            <td>Stable network endpoint</td>
            <td>Load balances across pods. Provides DNS name: service-name.namespace.svc.cluster.local</td>
          </tr>
          <tr>
            <td><strong>Namespace</strong></td>
            <td>Virtual cluster isolation</td>
            <td>Separate environments (dev, staging, prod) or teams within one cluster.</td>
          </tr>
          <tr>
            <td><strong>ConfigMap</strong></td>
            <td>Non-sensitive configuration</td>
            <td>Key-value pairs injected as env vars or mounted as files.</td>
          </tr>
          <tr>
            <td><strong>Secret</strong></td>
            <td>Sensitive data</td>
            <td>Base64-encoded. For passwords, API keys, certificates. Consider external secret managers.</td>
          </tr>
          <tr>
            <td><strong>Ingress</strong></td>
            <td>External HTTP routing</td>
            <td>Routes external traffic to internal services. TLS termination, path-based routing.</td>
          </tr>
          <tr>
            <td><strong>HPA</strong></td>
            <td>Auto-scaling</td>
            <td>Scales pod replicas based on CPU, memory, or custom metrics.</td>
          </tr>
        </tbody>
      </table>

      <h3>Complete K8s Deployment</h3>

      <CodeBlock language="yaml" title="Full Kubernetes Deployment for a Microservice">
{`# Namespace — isolate the application
apiVersion: v1
kind: Namespace
metadata:
  name: order-system
---
# ConfigMap — non-sensitive configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
  namespace: order-system
data:
  DATABASE_HOST: "postgres-service.order-system.svc.cluster.local"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "orders"
  KAFKA_BROKERS: "kafka-0:9092,kafka-1:9092,kafka-2:9092"
  LOG_LEVEL: "info"
---
# Secret — sensitive data (use external secret manager in production!)
apiVersion: v1
kind: Secret
metadata:
  name: order-service-secrets
  namespace: order-system
type: Opaque
data:
  DATABASE_PASSWORD: cGFzc3dvcmQxMjM=  # base64 encoded
  JWT_SECRET: c3VwZXItc2VjcmV0LWtleQ==
---
# Deployment — manages pod replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  namespace: order-system
  labels:
    app: order-service
    version: v1.2.3
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # 1 extra pod during update
      maxUnavailable: 0   # zero downtime
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
        version: v1.2.3
    spec:
      containers:
        - name: order-service
          image: myregistry/order-service:v1.2.3
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: order-service-config
            - secretRef:
                name: order-service-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health/live
              port: 8080
            failureThreshold: 30
            periodSeconds: 10
---
# Service — stable network endpoint
apiVersion: v1
kind: Service
metadata:
  name: order-service
  namespace: order-system
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP`}
      </CodeBlock>

      <h3>Health Checks: Liveness vs Readiness vs Startup</h3>

      <InfoBox variant="note" title="Three Types of Health Probes">
        <strong>Liveness probe:</strong> Is the container alive? If it fails, Kubernetes kills and restarts the pod.
        Use for detecting deadlocks or hung processes.
        <br /><br />
        <strong>Readiness probe:</strong> Is the container ready to receive traffic? If it fails, the pod is removed
        from the Service load balancer but NOT restarted. Use for warming caches or waiting for dependencies.
        <br /><br />
        <strong>Startup probe:</strong> Has the container started successfully? Disables liveness/readiness probes
        until it succeeds. Use for slow-starting applications (JVM warm-up, large data loading).
      </InfoBox>

      <CodeBlock language="typescript" title="Health Check Endpoints — Node.js">
{`// Liveness — is the process alive?
app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness — can this instance serve traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check database connectivity
    await db.query('SELECT 1');
    // Check Redis connectivity
    await redis.ping();
    // Check Kafka connectivity
    const admin = kafka.admin();
    await admin.connect();
    await admin.disconnect();

    res.status(200).json({ status: 'ready' });
  } catch (error) {
    // Not ready — remove from load balancer
    res.status(503).json({
      status: 'not ready',
      error: error.message,
    });
  }
});`}
      </CodeBlock>

      <h2>Service Mesh</h2>
      <p>
        A service mesh is an infrastructure layer that handles service-to-service communication.
        It deploys a sidecar proxy (typically Envoy) alongside every service that transparently
        handles mTLS, retries, circuit breaking, observability, and traffic management.
      </p>

      <FlowChart
        title="Service Mesh — Istio Architecture"
        chart={"graph TD\n  subgraph Control Plane\n    Istiod[Istiod] -.->|Config + Certs| E1\n    Istiod -.->|Config + Certs| E2\n    Istiod -.->|Config + Certs| E3\n  end\n  subgraph Pod A\n    A[Order Service] --- E1[Envoy Sidecar]\n  end\n  subgraph Pod B\n    B[Payment Service] --- E2[Envoy Sidecar]\n  end\n  subgraph Pod C\n    C[Catalog Service] --- E3[Envoy Sidecar]\n  end\n  E1 <-->|mTLS| E2\n  E2 <-->|mTLS| E3\n  E1 <-->|mTLS| E3\n  E1 --> Jaeger[Jaeger - Tracing]\n  E2 --> Jaeger\n  E3 --> Jaeger\n  E1 --> Prom[Prometheus - Metrics]\n  E2 --> Prom\n  E3 --> Prom"}
      />

      <h3>What the Sidecar Handles</h3>

      <CodeBlock language="yaml" title="Istio VirtualService — Traffic Management">
{`# Canary deployment — route 10% of traffic to v2
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: order-service
spec:
  hosts:
    - order-service
  http:
    - route:
        - destination:
            host: order-service
            subset: v1
          weight: 90          # 90% to stable version
        - destination:
            host: order-service
            subset: v2
          weight: 10          # 10% to canary version
      retries:
        attempts: 3           # retry failed requests
        perTryTimeout: 2s
      timeout: 10s            # total request timeout
---
# Circuit breaker configuration
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: order-service
spec:
  host: order-service
  trafficPolicy:
    connectionPool:
      http:
        h2UpgradePolicy: UPGRADE
        maxRequestsPerConnection: 100
    outlierDetection:
      consecutive5xxErrors: 5   # open circuit after 5 errors
      interval: 10s
      baseEjectionTime: 30s     # eject for 30 seconds
      maxEjectionPercent: 50    # max 50% of pods ejected
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2`}
      </CodeBlock>

      <h3>Service Mesh Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Feature</th>
            <th>Istio</th>
            <th>Linkerd</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Proxy</td>
            <td>Envoy (C++)</td>
            <td>linkerd2-proxy (Rust)</td>
          </tr>
          <tr>
            <td>Complexity</td>
            <td>High — many features and configuration</td>
            <td>Low — simpler, opinionated defaults</td>
          </tr>
          <tr>
            <td>Resource Usage</td>
            <td>Higher (Envoy is heavier)</td>
            <td>Lower (Rust proxy is lightweight)</td>
          </tr>
          <tr>
            <td>mTLS</td>
            <td>Yes — configurable</td>
            <td>Yes — on by default</td>
          </tr>
          <tr>
            <td>Traffic Management</td>
            <td>Advanced (canary, A/B, fault injection)</td>
            <td>Basic (traffic splits)</td>
          </tr>
          <tr>
            <td>Best For</td>
            <td>Large orgs needing advanced traffic control</td>
            <td>Teams wanting simplicity and low overhead</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"Your Java application takes 45 seconds to start (JVM warm-up + loading reference data). Which Kubernetes probe should you configure to prevent premature restarts?"}
        options={[
          'Liveness probe with a 45-second initialDelaySeconds',
          'Readiness probe with a long timeout',
          'Startup probe with failureThreshold: 30 and periodSeconds: 2',
          'No probe — Kubernetes will wait automatically'
        ]}
        correctIndex={2}
        explanation={"The startup probe is designed for slow-starting containers. It disables liveness and readiness probes until it succeeds. With failureThreshold: 30 and periodSeconds: 2, Kubernetes will wait up to 60 seconds for the app to start before considering it failed. Using initialDelaySeconds on the liveness probe is fragile — if startup takes longer than expected, the pod gets killed."}
      />

      <InteractiveChallenge
        question={"What is the primary benefit of a service mesh like Istio over implementing retries and circuit breakers in application code?"}
        options={[
          'Better performance — sidecars are faster than application code',
          'Language-agnostic — works the same for Java, Node, Go, Python without code changes',
          'Eliminates the need for load balancers',
          'Provides a database for each service automatically'
        ]}
        correctIndex={1}
        explanation={"A service mesh handles cross-cutting concerns (mTLS, retries, circuit breaking, observability) in the sidecar proxy, which is transparent to the application. This means a Java service, a Node.js service, and a Go service all get the same resilience features without any code changes or library dependencies."}
      />

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>Containers package apps with dependencies — runs identically everywhere</li>
          <li>Use multi-stage Docker builds, non-root users, and Alpine base images</li>
          <li>Kubernetes automates deployment, scaling, and management of containers</li>
          <li>Core K8s objects: Pod, Deployment, Service, ConfigMap, Secret, Ingress, HPA</li>
          <li>Three health probes: Liveness (alive?), Readiness (ready for traffic?), Startup (started?)</li>
          <li>Service mesh (Istio/Linkerd) handles mTLS, retries, circuit breaking, and observability</li>
          <li>The sidecar pattern moves cross-cutting concerns out of application code</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
