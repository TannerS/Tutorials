import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';
import MtlsExplainer from '../../components/security/MtlsExplainer';

export default function Containers() {
  return (
    <LessonLayout
      title="Containers & Kubernetes"
      sectionId="microservices"
      lessonIndex={6}
      prev={{ path: '/microservices/events', label: 'Event-Driven Architecture' }}
      next={{ path: '/microservices/openshift', label: 'OpenShift: Kubernetes for the Enterprise' }}
    >
      <h2>Why Containers?</h2>
      <p>
        Containers solve the &quot;works on my machine&quot; problem. A container packages your application
        with all its dependencies (runtime, libraries, config) into a lightweight, portable unit
        that runs identically everywhere — your laptop, CI/CD pipeline, staging, and production.
      </p>

      <FlowChart
        title="VMs vs Containers"
        chart={"graph TD\n  subgraph Virtual Machines\n    HW1[Hardware] --> HV[Hypervisor]\n    HV --> VM1[VM: Full OS + App A]\n    HV --> VM2[VM: Full OS + App B]\n    HV --> VM3[VM: Full OS + App C]\n  end\n  subgraph Containers\n    HW2[Hardware] --> OS[Host OS]\n    OS --> CR[Container Runtime]\n    CR --> C1[Container: App A]\n    CR --> C2[Container: App B]\n    CR --> C3[Container: App C]\n  end\n  style VM1 fill:#3b1a1a\n  style VM2 fill:#3b1a1a\n  style VM3 fill:#3b1a1a\n  style C1 fill:#1a3329\n  style C2 fill:#1a3329\n  style C3 fill:#1a3329"}
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
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files first (layer caching!)
# Install ALL deps including devDependencies -- the build needs
# TypeScript, which lives in devDependencies. Installing only
# production deps here would make 'npm run build' below fail.
COPY package*.json ./
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./
RUN npm run build

# Now produce a clean production-only node_modules for the runtime
# stage. ('--only=production' is deprecated since npm 7 -- the
# current flag is '--omit=dev'.)
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:24-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production artifacts (node_modules is now dev-free)
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

# NOTE the 'exec'. Without it, 'sh' stays PID 1 and the JVM runs as a
# child -- so SIGTERM from Kubernetes goes to the shell, which does
# NOT forward it. The JVM never runs its shutdown hooks, in-flight
# requests are dropped, and the pod is SIGKILLed after the grace
# period. 'exec' REPLACES the shell with the JVM so the JVM is PID 1
# and receives the signal directly.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]`}
      </CodeBlock>

      <InfoBox variant="danger" title="PID 1 and Graceful Shutdown — the Bug You Only See Under Load">
        <p>
          The <code>exec</code> above looks like a detail and is not. Kubernetes stops a pod by
          sending <strong>SIGTERM</strong> and waiting{' '}
          <code>terminationGracePeriodSeconds</code> (30 by default) before <strong>SIGKILL</strong>.
          Your application is supposed to use that window to stop accepting new connections and
          finish the requests it already has.
        </p>
        <p>
          If a shell is PID 1, none of that happens — shells do not forward signals to children.
          Every rolling deploy then drops whatever was in flight. It never shows up in testing,
          because at low traffic there is usually nothing in flight.
        </p>
        <p>
          Prefer the exec form entirely (<code>ENTRYPOINT [&quot;java&quot;, &quot;-jar&quot;,
          &quot;app.jar&quot;]</code>) and pass JVM options via the{' '}
          <code>JAVA_TOOL_OPTIONS</code> environment variable, which the JVM picks up on its own —
          then there is no shell in the picture at all.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="There Is a Second Race: Readiness vs. Endpoint Removal">
        <p>
          Even with signals handled correctly, SIGTERM and removal from the Service&apos;s endpoint
          list happen <em>in parallel</em>, not in sequence. For a short window the pod is shutting
          down while kube-proxy on some nodes is still routing new requests to it — producing
          connection-refused errors during every deploy.
        </p>
        <p>
          The standard fix is a <code>preStop</code> hook that simply sleeps, giving endpoint
          removal time to propagate before the application begins shutting down:
        </p>
      </InfoBox>

      <CodeBlock language="yaml" title="Graceful Shutdown — the Complete Pattern">
{`spec:
  terminationGracePeriodSeconds: 60   # must exceed your longest request
  containers:
    - name: order-service
      lifecycle:
        preStop:
          exec:
            # Do nothing for 10s. This is not a hack -- it lets the
            # endpoint removal propagate to every kube-proxy BEFORE
            # the app starts refusing work. SIGTERM is sent only
            # after preStop completes.
            command: ["sh", "-c", "sleep 10"]`}
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
            <td><strong>Base64 is encoding, not encryption</strong> — anyone with read access decodes it instantly, and by default Secrets sit in plaintext in etcd. Enable encryption-at-rest, lock down RBAC, and prefer an external manager (Vault, AWS/GCP Secrets Manager via the Secrets Store CSI driver).</td>
          </tr>
          <tr>
            <td><strong>Ingress</strong></td>
            <td>External HTTP routing (legacy)</td>
            <td>Routes external traffic to internal services. TLS termination, path-based routing. Still GA and still everywhere — but <strong>feature-frozen</strong>: anything beyond host/path routing lives in controller-specific annotations. See the box below before choosing it for something new.</td>
          </tr>
          <tr>
            <td><strong>Gateway / HTTPRoute</strong></td>
            <td>External HTTP routing (Gateway API — the successor)</td>
            <td>Splits Ingress into role-oriented resources: <code>GatewayClass</code> and <code>Gateway</code> (platform team owns the listener and TLS) and <code>HTTPRoute</code> (app team owns its own routes). Header matching, traffic splitting and request mirroring are typed fields, not annotations.</td>
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

      <h3>Getting Traffic In: Gateway API, Not Ingress</h3>

      <InfoBox variant="danger" title="Ingress Is Feature-Frozen, and Its Most Popular Controller Is Retired">
        <p>
          Almost every Kubernetes tutorial — including the table above until recently — presents{' '}
          <code>Ingress</code> as <em>the</em> answer for external HTTP traffic. Two things changed
          that, and both are worth knowing before you start a new cluster.
        </p>
        <p>
          <strong>The Ingress API is feature-frozen.</strong> It is not deprecated and it is not
          going away — existing Ingress resources keep working. But no new capability is being added
          to it, and it never had fields for the things people actually need: header-based routing,
          weighted traffic splitting, request mirroring, timeouts. Every controller invented its own{' '}
          <code>annotations</code> for those, which is why an Ingress manifest is portable in theory
          and locked to one controller in practice.
        </p>
        <p>
          <strong><code>kubernetes/ingress-nginx</code> reached end of life on 2026-03-24.</strong>{' '}
          It was the most widely deployed Ingress controller by a wide margin, and it now receives
          no bug fixes and — the part that should move this up your backlog —{' '}
          <strong>no CVE patches</strong>. Running it is an accumulating, unpatchable security
          liability. (F5&apos;s separate <code>nginx-ingress</code> is a different project and is
          still maintained; so are Traefik, HAProxy and the Envoy-based controllers.)
        </p>
        <p>
          Active development moved to the <strong>Gateway API</strong>, which is GA
          (<code>gateway.networking.k8s.io/v1</code>) and is what SIG-Network now treats as the
          standard. If you have existing Ingress resources, the{' '}
          <code>ingress2gateway</code> tool (1.0, March 2026) converts them, including 30+ of the
          common controller annotations.
        </p>
      </InfoBox>

      <p>
        The design change that matters is not syntax, it is <strong>ownership</strong>. Ingress
        crammed &quot;which port and certificate does the cluster listen on&quot; and &quot;where do
        my app&apos;s URLs go&quot; into one resource, so either the platform team owned every
        route or every app team could rewrite the cluster&apos;s TLS config. Gateway API splits
        those into separate resources with separate RBAC:
      </p>
      <ul>
        <li>
          <strong>GatewayClass</strong> — cluster-scoped, installed once, names the implementation
          (Envoy Gateway, Istio, Traefik, NGINX Gateway Fabric, a cloud load balancer).
        </li>
        <li>
          <strong>Gateway</strong> — the listener: ports, protocol, hostnames, TLS certificates, and
          an explicit policy for which namespaces may attach routes. Platform team.
        </li>
        <li>
          <strong>HTTPRoute</strong> — lives in the application&apos;s own namespace and points at
          its own Services. Application team. There are sibling kinds for other protocols
          (<code>GRPCRoute</code>, <code>TLSRoute</code>, <code>TCPRoute</code>).
        </li>
      </ul>

      <CodeBlock language="yaml" title="Gateway API — the Ingress Replacement">
{`# GatewayClass -- cluster-scoped, installed once by the platform team.
# controllerName selects the implementation actually doing the work.
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: production
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
# Gateway -- the listener. Ports, TLS and delegation policy are decided
# ONCE, here, by the team that should be deciding them.
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: edge
  namespace: gateway-system
spec:
  gatewayClassName: production
  listeners:
    - name: https
      protocol: HTTPS
      port: 443
      hostname: "*.example.com"
      tls:
        mode: Terminate
        certificateRefs:
          - name: example-com-tls
      allowedRoutes:
        # Explicit delegation. With Ingress, any namespace could claim any
        # hostname and the last writer won -- a real multi-tenant hazard.
        namespaces:
          from: Selector
          selector:
            matchLabels:
              gateway-access: "true"
---
# HTTPRoute -- owned by the APP team, in the app's own namespace. It
# attaches to the Gateway by reference; it cannot change the Gateway.
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: order-service
  namespace: order-system
spec:
  parentRefs:
    - name: edge
      namespace: gateway-system
  hostnames:
    - "api.example.com"
  rules:
    # Header matching is a TYPED FIELD. On Ingress this was a
    # controller-specific annotation, where it existed at all.
    - matches:
        - path:
            type: PathPrefix
            value: /orders
          headers:
            - name: x-canary
              value: "true"
      backendRefs:
        - name: order-service-v2
          port: 80
    # Weighted split for everyone else -- 90/10 canary, no annotations,
    # no service-mesh install required.
    - matches:
        - path:
            type: PathPrefix
            value: /orders
      backendRefs:
        - name: order-service
          port: 80
          weight: 90
        - name: order-service-v2
          port: 80
          weight: 10`}
      </CodeBlock>

      <InfoBox variant="tip" title="What This Means for What You Should Learn">
        <p>
          Learn <code>Ingress</code> — you will meet it in every existing cluster, and interviewers
          still ask about it. Reach for <strong>Gateway API</strong> for anything new. The honest
          summary in a design review is: &quot;Ingress still works and we have plenty of it, but it
          is frozen, our routing needs have outgrown annotations, and our controller lost security
          support in March — so new services get HTTPRoutes and we migrate the rest with
          ingress2gateway.&quot;
        </p>
      </InfoBox>

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
        A service mesh is an infrastructure layer that handles service-to-service communication —
        mTLS, retries, circuit breaking, observability, and traffic management — without the
        application knowing about any of it. The classic implementation is the{' '}
        <strong>sidecar</strong> model: an Envoy proxy container injected into every pod, with all
        of that pod&apos;s traffic transparently redirected through it.
      </p>
      <p>
        The diagram and manifests below show the sidecar model, because it is what most clusters run
        and what interviews ask about. It is no longer the only model — see the box under the
        diagram.
      </p>

      <MtlsExplainer compact />

      <FlowChart
        title="Service Mesh — Istio Architecture"
        chart={"graph TD\n  subgraph Control Plane\n    Istiod[Istiod] -.->|Config + Certs| E1\n    Istiod -.->|Config + Certs| E2\n    Istiod -.->|Config + Certs| E3\n  end\n  subgraph Pod A\n    A[Order Service] --- E1[Envoy Sidecar]\n  end\n  subgraph Pod B\n    B[Payment Service] --- E2[Envoy Sidecar]\n  end\n  subgraph Pod C\n    C[Catalog Service] --- E3[Envoy Sidecar]\n  end\n  E1 <-->|mTLS| E2\n  E2 <-->|mTLS| E3\n  E1 <-->|mTLS| E3\n  E1 --> Jaeger[Jaeger - Tracing]\n  E2 --> Jaeger\n  E3 --> Jaeger\n  E1 --> Prom[Prometheus - Metrics]\n  E2 --> Prom\n  E3 --> Prom"}
      />

      <InfoBox variant="info" title="Sidecars Are No Longer the Only Mesh Model — Ambient Mode">
        <p>
          The sidecar model has a real cost that the architecture diagrams hide: one extra Envoy
          container per pod. That is CPU and memory per <em>replica</em>, restarts on every proxy
          upgrade, races between the app and the proxy at pod startup and shutdown, and the injection
          machinery that makes all of it work.
        </p>
        <p>
          Istio&apos;s <strong>ambient mode</strong> (GA in Istio 1.24) removes the sidecar. It splits
          the mesh into two layers you can adopt separately:
        </p>
        <ul>
          <li>
            <strong>ztunnel</strong> — a per-node agent (a DaemonSet, not a per-pod container) that
            provides mTLS, identity and L4 authorization. This is the layer most teams actually want,
            and on its own it costs far less than a sidecar per pod.
          </li>
          <li>
            <strong>waypoint proxy</strong> — an optional per-namespace or per-service Envoy that you
            add only where you need L7 features: header routing, retries, weighted splits, request
            metrics. Pay for L7 where you use it rather than everywhere.
          </li>
        </ul>
        <p>
          The trade-off is not free. Ambient is younger, its debugging story is less familiar, and
          moving L7 processing out of the pod means an extra hop for the workloads that need it.
          Sidecars remain the well-understood default and the right answer for an existing mesh.
          But &quot;a service mesh means a proxy in every pod&quot; stopped being true, and if you
          are asked why a mesh is expensive, per-pod sidecar overhead — and the fact that there is
          now an alternative — is the answer worth having.
        </p>
      </InfoBox>

      <h3>What the Sidecar Handles</h3>

      <CodeBlock language="yaml" title="Istio VirtualService — Traffic Management">
{`# Canary deployment — route 10% of traffic to v2
apiVersion: networking.istio.io/v1
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
apiVersion: networking.istio.io/v1
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
