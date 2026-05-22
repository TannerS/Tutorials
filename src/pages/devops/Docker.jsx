import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsDocker() {
  return (
    <LessonLayout
      title="Docker and Containers"
      sectionId="devops"
      lessonIndex={3}
      prev={{ path: "/devops/cicd", label: "CI/CD Pipelines" }}
      next={{ path: "/devops/cloud", label: "Cloud Deployment" }}
    >
      <p>Docker packages applications with their dependencies into portable containers. Every developer runs the same environment, eliminating "works on my machine" problems.</p>
      <CodeBlock language="bash" title="Docker Command Reference">
{`# === BUILD ===
docker build -t myapp:1.0 .              # build from Dockerfile
docker build -t myapp:1.0 --no-cache .  # force fresh build
docker buildx build --platform linux/amd64,linux/arm64 -t myapp:1.0 --push .

# === RUN ===
docker run -d -p 8080:8080 --name myapp myapp:1.0
# -d = detached, -p = port mapping, --name = container name

docker run -d   -p 8080:8080   -e DATABASE_URL=jdbc:postgresql://db:5432/mydb   -v /host/data:/app/data   --network mynetwork   --restart unless-stopped   myapp:1.0

# === INSPECT ===
docker ps                    # running containers
docker ps -a                 # all containers
docker logs myapp -f         # tail logs
docker exec -it myapp bash   # shell into container
docker inspect myapp         # JSON metadata
docker stats                 # live CPU/memory usage

# === CLEANUP ===
docker stop myapp && docker rm myapp
docker image prune -a        # remove unused images
docker system prune -af      # remove everything unused (careful!)

# === COMPOSE ===
docker compose up -d         # start all services in background
docker compose down          # stop and remove containers
docker compose logs -f api   # tail a service's logs
docker compose exec db psql  # run command in service container
docker compose ps            # show compose services`}
      </CodeBlock>
      <CodeBlock language="dockerfile" title="Production-Ready Dockerfile">
{`FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S app && adduser -S app -G app
USER app
WORKDIR /app
COPY --chown=app:app target/app.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3   CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
ENTRYPOINT ["java",   "-XX:+UseContainerSupport",   "-XX:MaxRAMPercentage=75.0",   "-Djava.security.egd=file:/dev/./urandom",   "-jar", "app.jar"]`}
      </CodeBlock>
      <InteractiveChallenge
        question="What does docker run -p 8080:8080 mean?"
        options={["Run 8080 container instances", "Map host port 8080 to container port 8080 (host:container)", "Expose port 8080 to all networks", "Set the container's memory limit to 8080 MB"]}
        correctIndex={1}
        explanation="The -p flag maps ports: -p HOST_PORT:CONTAINER_PORT. So -p 8080:8080 means traffic arriving at port 8080 on your machine is forwarded to port 8080 inside the container. You could use -p 9090:8080 to expose the container's 8080 as 9090 on the host."
      />

    </LessonLayout>
  );
}
