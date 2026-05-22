import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsCloud() {
  return (
    <LessonLayout
      title="Cloud Deployment"
      sectionId="devops"
      lessonIndex={4}
      prev={{ path: "/devops/docker", label: "Docker and Containers" }}
      next={{ path: "/devops/monitoring", label: "Monitoring and Observability" }}
    >
      <p>Cloud platforms (AWS, GCP, Azure) provide managed infrastructure. Spring Boot applications typically deploy to container services (ECS, Cloud Run, AKS) or managed Kubernetes (EKS, GKE, AKS).</p>
      <CodeBlock language="yaml" title="Kubernetes Production Deployment">
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
    version: "1.2.3"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # allow 1 extra pod during rollout
      maxUnavailable: 0    # keep all 3 running (zero downtime)
  selector:
    matchLabels: { app: order-service }
  template:
    metadata:
      labels: { app: order-service }
    spec:
      containers:
      - name: order-service
        image: ghcr.io/myorg/order-service:1.2.3
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: production
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
        resources:
          requests: { memory: "256Mi", cpu: "250m" }
          limits:   { memory: "512Mi", cpu: "1000m" }
        livenessProbe:
          httpGet: { path: /actuator/health/liveness, port: 8080 }
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet: { path: /actuator/health/readiness, port: 8080 }
          initialDelaySeconds: 10
          periodSeconds: 5`}
      </CodeBlock>
      <InfoBox variant="tip" title="12-Factor Cloud Checklist">
        <p>For cloud-native apps: store config in environment variables, log to stdout (not files), treat the app as stateless (session in Redis, not memory), use readiness/liveness probes for zero-downtime deploys, set resource requests and limits, use secrets management (not hardcoded), and implement graceful shutdown.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What is the purpose of Kubernetes readiness vs liveness probes?"
        options={["They are the same — both restart the pod if they fail", "Readiness controls traffic routing (don't send traffic until ready); liveness controls restarts (restart if stuck)", "Liveness is for databases; readiness is for APIs", "Readiness probes are optional; liveness is required"]}
        correctIndex={1}
        explanation="Readiness: 'Is this pod ready to receive traffic?' — failed readiness removes the pod from load balancer rotation but doesn't restart it (e.g., still warming up cache). Liveness: 'Is this pod alive?' — failed liveness kills and restarts the pod (e.g., deadlocked, out of memory). Use both for production deployments."
      />

    </LessonLayout>
  );
}
