import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsMonitoring() {
  return (
    <LessonLayout
      title="Monitoring and Observability"
      sectionId="devops"
      lessonIndex={5}
      prev={{ path: "/devops/cloud", label: "Cloud Deployment" }}
      next={{ path: "/systemdesign/intro", label: "System Design Introduction" }}
    >
      <p>Observability means understanding what your system is doing in production. The three pillars are metrics (what's happening), logs (what happened in detail), and traces (how a request flowed through services).</p>
      <CodeBlock language="java" title="Spring Boot Actuator and Micrometer">
{`# application.yml — expose metrics endpoint
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
      probes:
        enabled: true
  metrics:
    tags:
      application: order-service
      environment: production

// Custom metrics with Micrometer
@Service
public class OrderService {
    private final MeterRegistry registry;
    private final Counter ordersCreated;
    private final Timer orderProcessingTime;

    public OrderService(MeterRegistry registry) {
        this.registry = registry;
        this.ordersCreated = Counter.builder("orders.created")
            .description("Total orders created")
            .tag("service", "order")
            .register(registry);
        this.orderProcessingTime = Timer.builder("orders.processing.time")
            .description("Order processing duration")
            .register(registry);
    }

    public Order createOrder(CreateOrderRequest req) {
        return orderProcessingTime.record(() -> {
            Order order = processOrder(req);
            ordersCreated.increment();
            registry.gauge("orders.cart.size", req.getItems().size());
            return order;
        });
    }
}`}
      </CodeBlock>
      <CodeBlock language="yaml" title="Prometheus + Grafana Stack">
{`# docker-compose.yml — monitoring stack
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:latest
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin

# prometheus.yml — scrape Spring Boot metrics
scrape_configs:
  - job_name: 'order-service'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['order-service:8080']

# Key metrics to alert on:
# - http_server_requests_seconds_count (request rate)
# - http_server_requests_seconds_max (latency p99)
# - jvm_memory_used_bytes (memory pressure)
# - orders_created_total (business KPI)
# - hikaricp_connections_active (DB pool saturation)`}
      </CodeBlock>
      <InfoBox variant="note" title="SLIs, SLOs, and SLAs">
        <p>SLI (Service Level Indicator): a measurable metric — e.g., 99th percentile latency. SLO (Service Level Objective): a target — e.g., p99 latency under 500ms for 99.9% of requests. SLA (Service Level Agreement): a contract with consequences — e.g., "if we miss SLO for 3 days, customers get a credit." Define SLOs before writing alerts.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What are the three pillars of observability?"
        options={["CPU, memory, and disk", "Metrics, logs, and traces", "Availability, latency, and throughput", "Alerts, dashboards, and runbooks"]}
        correctIndex={1}
        explanation="Metrics (aggregated numbers over time — request rate, error rate, latency, saturation), Logs (timestamped records of events for debugging), and Traces (end-to-end request flows across services for distributed system debugging) form the three pillars of observability. Together they let you understand, debug, and improve production systems."
      />

    </LessonLayout>
  );
}
