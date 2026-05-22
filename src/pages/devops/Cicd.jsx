import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function DevopsCicd() {
  return (
    <LessonLayout
      title="CI/CD Pipelines"
      sectionId="devops"
      lessonIndex={2}
      prev={{ path: "/devops/branching", label: "Branching Strategies" }}
      next={{ path: "/devops/docker", label: "Docker and Containers" }}
    >
      <p>CI/CD automates building, testing, and deploying code. CI (Continuous Integration) means merging and testing code frequently. CD (Continuous Delivery/Deployment) means always having a deployable artifact, and optionally deploying automatically.</p>
      <CodeBlock language="yaml" title="GitHub Actions CI/CD Pipeline">
{`name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven

      - name: Run tests
        run: ./mvnw verify
        env:
          SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/testdb
          SPRING_DATASOURCE_PASSWORD: testpass

      - name: Upload coverage report
        uses: codecov/codecov-action@v4

  build-and-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/order-service             order-service=ghcr.io/\${{ github.repository }}:\${{ github.sha }}`}
      </CodeBlock>
      <InfoBox variant="tip" title="CI/CD Pipeline Principles">
        <p>Keep pipelines fast (under 10 minutes for CI feedback). Fail fast — put linting and unit tests before integration tests. Make pipelines deterministic — same code = same result. Store artifacts in a registry, don't build twice. Use environment protection rules for production deployments requiring approval.</p>
      </InfoBox>
      <InteractiveChallenge
        question="What is the difference between Continuous Delivery and Continuous Deployment?"
        options={["They are the same thing", "Continuous Delivery automatically deploys to production; Continuous Deployment requires a manual approval step", "Continuous Delivery produces a deployable artifact but requires manual production deployment; Continuous Deployment deploys automatically", "Continuous Deployment only works with microservices"]}
        correctIndex={2}
        explanation="Continuous Delivery means every passing build produces a release candidate that CAN be deployed to production with a button click — deployment is manual. Continuous Deployment goes further: every passing build IS automatically deployed to production. CD requires very high test confidence and robust monitoring/rollback."
      />

    </LessonLayout>
  );
}
