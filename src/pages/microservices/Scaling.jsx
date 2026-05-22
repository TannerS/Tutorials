import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesScaling() {
  return (
    <LessonLayout
      title="Scaling Strategies"
      sectionId="microservices"
      lessonIndex={4}
      prev={{ path: "/microservices/data", label: "Data Management" }}
      next={{ path: "/microservices/events", label: "Event-Driven Architecture" }}
    >
      <p>One of the primary benefits of microservices is independent scaling. Services with different load profiles can be scaled separately, reducing infrastructure cost and improving performance.</p>

      <h2>Horizontal Scaling with Kubernetes</h2>

      <CodeBlock language="yaml" title="Kubernetes Deployment and HPA">
{`# Deploy Order service with autoscaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3          # start with 3 instances
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: myregistry/order-service:1.2.3
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
---
# Horizontal Pod Autoscaler — scale based on CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70   # scale up when avg CPU > 70%`}
      </CodeBlock>

      <h2>Caching Strategies</h2>

      <CodeBlock language="java" title="Multi-Level Caching">
{`// L1: Application-level cache (in-process, fastest)
@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id",
               condition = "#id != null",
               unless = "#result == null")
    public ProductDto getProduct(String id) {
        return productRepository.findById(id)
            .map(ProductDto::from)
            .orElse(null);
    }

    @CacheEvict(value = "products", key = "#product.id")
    public void updateProduct(Product product) {
        productRepository.save(product);
    }
}

# application.yml — Redis as L2 cache
spring:
  cache:
    type: redis
  redis:
    host: redis-cluster
    port: 6379
  cache:
    redis:
      time-to-live: 300000  # 5 minutes TTL
      cache-null-values: false`}
      </CodeBlock>

      <FlowChart
        title="Scaling Decision Tree"
        chart={"graph TD\n  A[Service under load?] --> B{CPU bound?}\n  B -- Yes --> C[Horizontal scaling - add instances]\n  B -- No --> D{Memory bound?}\n  D -- Yes --> E[Vertical scaling or optimize memory]\n  D -- No --> F{DB queries slow?}\n  F -- Yes --> G[Add caching layer]\n  F -- No --> H{Network I/O?}\n  H -- Yes --> I[Async processing - Kafka]"}
      />

      <InfoBox variant="tip" title="Twelve-Factor App">
        <p>The Twelve-Factor App methodology describes best practices for building scalable, maintainable microservices: store config in environment variables, treat logs as event streams, keep processes stateless, use backing services as attached resources, and more. It's the foundation of cloud-native design.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the key advantage of microservices for scaling compared to a monolith?"
        options={["Microservices always use less memory", "Each service scales independently based on its own load profile", "Microservices eliminate the need for load balancers", "Microservices automatically scale without configuration"]}
        correctIndex={1}
        explanation="Independent scaling is a core microservices benefit. A product search service that gets 100x more traffic than an order management service can be scaled to 50 instances while the order service runs on 2. In a monolith, you'd scale the entire application, wasting resources."
      />

    </LessonLayout>
  );
}
