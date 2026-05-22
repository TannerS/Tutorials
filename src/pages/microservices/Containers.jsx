import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function MicroservicesContainers() {
  return (
    <LessonLayout
      title="Containers and Docker"
      sectionId="microservices"
      lessonIndex={6}
      prev={{ path: "/microservices/events", label: "Event-Driven Architecture" }}
      next={{ path: "/microservices/migration", label: "Migration Strategies" }}
    >
      <p>Containers package a microservice with all its dependencies into a portable unit. Docker is the container runtime; Kubernetes orchestrates containers at scale. Together they enable consistent deployment across environments.</p>

      <h2>Dockerfile for Spring Boot</h2>

      <CodeBlock language="dockerfile" title="Multi-Stage Dockerfile">
{`# Stage 1: Build
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw dependency:go-offline -q   # cache deps layer

COPY src src
RUN ./mvnw package -DskipTests -q

# Stage 2: Extract layered jar (faster startup, smaller layers)
FROM builder AS extractor
RUN java -Djarmode=layertools -jar target/*.jar extract

# Stage 3: Runtime (minimal image)
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app

# Copy layers in order of least to most frequently changed
COPY --from=extractor /app/dependencies/      ./
COPY --from=extractor /app/spring-boot-loader/ ./
COPY --from=extractor /app/snapshot-dependencies/ ./
COPY --from=extractor /app/application/       ./

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "org.springframework.boot.loader.JarLauncher"]`}
      </CodeBlock>

      <h2>Docker Compose for Local Development</h2>

      <CodeBlock language="yaml" title="docker-compose.yml — Full Stack Locally">
{`version: '3.8'
services:
  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    depends_on: [user-service, order-service]
    environment:
      SPRING_PROFILES_ACTIVE: docker

  user-service:
    build: ./user-service
    depends_on: [postgres]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/users
      SPRING_DATASOURCE_PASSWORD: secret

  order-service:
    build: ./order-service
    depends_on: [postgres, kafka]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/orders
      KAFKA_BOOTSTRAP_SERVERS: kafka:9092

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_NODE_ID: 1
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk

volumes:
  postgres-data:`}
      </CodeBlock>

      <FlowChart
        title="Container Orchestration"
        chart={"graph TD\n  A[Developer] --> B[docker build]\n  B --> C[Docker Image]\n  C --> D[Registry]\n  D --> E[Kubernetes Cluster]\n  E --> F[Pod 1]\n  E --> G[Pod 2]\n  E --> H[Pod 3]\n  I[kubectl apply] --> E"}
      />

      <InfoBox variant="tip" title="Container Best Practices">
        <p>Run as non-root user, use multi-stage builds to minimize image size, set resource limits, configure health checks, use JVM container-awareness flags (-XX:+UseContainerSupport), and never hardcode secrets in images — use environment variables or Kubernetes Secrets.</p>
      </InfoBox>

      <InteractiveChallenge
        question="What is the main benefit of multi-stage Docker builds for Java applications?"
        options={["They make the container start faster at runtime", "They produce smaller final images by excluding build tools and source code", "They enable parallel builds across multiple machines", "They automatically configure the JVM for containers"]}
        correctIndex={1}
        explanation="Multi-stage builds separate the build environment (JDK, Maven, source code) from the runtime environment (JRE only). The final image contains only the JRE and compiled application, not Maven, source code, or build tools — reducing image size from ~600MB to ~100MB and shrinking the attack surface."
      />

    </LessonLayout>
  );
}
