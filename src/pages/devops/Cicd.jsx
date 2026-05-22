import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Cicd() {
  return (
    <LessonLayout
      title="CI/CD Pipelines"
      sectionId="devops"
      lessonIndex={2}
      prev={{ path: '/devops/branching', label: 'Branching Strategies' }}
      next={{ path: '/devops/docker', label: 'Docker Fundamentals' }}
    >
      <h2>CI vs CD vs CD</h2>
      <p>
        These three terms are often conflated but represent distinct practices in the delivery pipeline.
      </p>

      <table>
        <thead>
          <tr>
            <th>Term</th>
            <th>What It Means</th>
            <th>Goal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Continuous Integration</strong></td>
            <td>Automatically build and test every commit</td>
            <td>Catch bugs early, keep main branch stable</td>
          </tr>
          <tr>
            <td><strong>Continuous Delivery</strong></td>
            <td>Always have a deployable artifact ready</td>
            <td>One-click deployments at any time</td>
          </tr>
          <tr>
            <td><strong>Continuous Deployment</strong></td>
            <td>Automatically deploy every passing commit to production</td>
            <td>Zero manual deployment steps</td>
          </tr>
        </tbody>
      </table>

      <h2>Pipeline Stages</h2>

      <FlowChart
        title="Typical CI/CD Pipeline"
        chart={"graph LR\nA[Code Push] --> B[Build]\nB --> C[Unit Tests]\nC --> D[Static Analysis]\nD --> E[Integration Tests]\nE --> F[Build Artifact]\nF --> G[Deploy to Staging]\nG --> H[E2E Tests]\nH --> I{Manual Approval?}\nI -->|Yes| J[Deploy to Production]\nI -->|Auto| J\nJ --> K[Smoke Tests]\nK --> L[Monitor]\nstyle A fill:#2196F3,color:#fff\nstyle J fill:#4CAF50,color:#fff\nstyle L fill:#9C27B0,color:#fff"}
      />

      <h2>GitHub Actions</h2>
      <p>
        GitHub Actions is the most popular CI/CD platform for GitHub-hosted projects.
        Workflows are defined in YAML files under <code>.github/workflows/</code>.
      </p>

      <CodeBlock language="yaml" title="Basic CI Workflow — .github/workflows/ci.yml">
{`name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Matrix Builds — Test Across Versions">
{`jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
      fail-fast: false

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
      - run: npm ci
      - run: npm test`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Caching Dependencies">
{`# Node.js caching (built into setup-node)
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

# Maven caching
- uses: actions/cache@v4
  with:
    path: ~/.m2/repository
    key: \${{ runner.os }}-maven-\${{ hashFiles('**/pom.xml') }}
    restore-keys: |
      \${{ runner.os }}-maven-

# Gradle caching
- uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: \${{ runner.os }}-gradle-\${{ hashFiles('**/*.gradle*') }}`}
      </CodeBlock>

      <CodeBlock language="yaml" title="Using Secrets and Environment Variables">
{`jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production     # requires approval if configured
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws s3 sync ./dist s3://my-bucket/
          aws cloudfront create-invalidation --distribution-id \${{ secrets.CF_DIST_ID }} --paths "/*"`}
      </CodeBlock>

      <InfoBox variant="warning" title="Secret Management">
        Never hardcode secrets in workflow files. Use GitHub Secrets (repo or organization level)
        and reference them via <code>$&#123;&#123; secrets.NAME &#125;&#125;</code>. For extra
        security, use environment-scoped secrets with required reviewers.
      </InfoBox>

      <h2>Jenkins Pipeline Basics</h2>
      <p>
        Jenkins uses Declarative or Scripted Pipelines defined in a <code>Jenkinsfile</code>.
      </p>

      <CodeBlock language="bash" title="Jenkinsfile (Declarative)">
{`pipeline {
    agent any
    
    environment {
        REGISTRY = 'registry.company.com'
        APP_NAME = 'my-service'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package -DskipTests'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn verify -Pintegration'
                    }
                }
            }
        }
        
        stage('Docker Build') {
            steps {
                sh "docker build -t $REGISTRY/$APP_NAME:$BUILD_NUMBER ."
                sh "docker push $REGISTRY/$APP_NAME:$BUILD_NUMBER"
            }
        }
        
        stage('Deploy to Staging') {
            steps {
                sh "kubectl set image deployment/$APP_NAME $APP_NAME=$REGISTRY/$APP_NAME:$BUILD_NUMBER -n staging"
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            input {
                message 'Deploy to production?'
                ok 'Yes, deploy!'
            }
            steps {
                sh "kubectl set image deployment/$APP_NAME $APP_NAME=$REGISTRY/$APP_NAME:$BUILD_NUMBER -n production"
            }
        }
    }
    
    post {
        failure {
            slackSend channel: '#builds', message: "Build FAILED: $BUILD_URL"
        }
        success {
            slackSend channel: '#builds', message: "Build SUCCESS: $BUILD_URL"
        }
    }
}`}
      </CodeBlock>

      <h2>Environment Promotion</h2>

      <FlowChart
        title="Environment Promotion Flow"
        chart={"graph LR\nA[Dev] -->|Auto| B[QA]\nB -->|Auto| C[Staging]\nC -->|Manual Approval| D[Production]\nA -->|Feature branch| E[Preview Env]\nstyle A fill:#FF9800,color:#fff\nstyle B fill:#2196F3,color:#fff\nstyle C fill:#9C27B0,color:#fff\nstyle D fill:#4CAF50,color:#fff\nstyle E fill:#607D8B,color:#fff"}
      />

      <h2>Deployment Strategies</h2>

      <h3>Blue-Green Deployments</h3>
      <p>
        Run two identical environments (blue and green). Deploy to the inactive one, test it,
        then switch traffic. Instant rollback by switching back.
      </p>

      <CodeBlock language="bash" title="Blue-Green with Load Balancer">
{`# Deploy new version to green (inactive) environment
aws ecs update-service --cluster prod --service green-service --task-definition app:v2

# Wait for green to be healthy
aws ecs wait services-stable --cluster prod --services green-service

# Run smoke tests against green
curl -f https://green.myapp.com/health

# Switch ALB target group to green
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG_ARN

# If issues: switch back to blue (instant rollback)
aws elbv2 modify-listener --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TG_ARN`}
      </CodeBlock>

      <h3>Canary Releases</h3>
      <p>
        Route a small percentage of traffic to the new version. Monitor for errors. Gradually
        increase traffic if healthy.
      </p>

      <CodeBlock language="yaml" title="Canary with Kubernetes">
{`# Ingress with traffic splitting
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"  # 10% to canary
spec:
  rules:
    - host: myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: my-app-canary
                port:
                  number: 80`}
      </CodeBlock>

      <h2>Rollback Strategies</h2>

      <CodeBlock language="bash" title="Rollback Approaches">
{`# Docker/Kubernetes: deploy previous image tag
kubectl rollout undo deployment/my-app
kubectl rollout undo deployment/my-app --to-revision=3

# AWS ECS: update to previous task definition
aws ecs update-service --cluster prod --service my-app --task-definition app:v1

# Database rollback (always have a plan!)
# 1. Forward-compatible migrations only
# 2. Separate deploy and migrate steps
# 3. Keep N-1 version compatible with current DB schema

# GitHub Actions: re-run a previous successful workflow
gh run rerun 12345678`}
      </CodeBlock>

      <InfoBox variant="danger" title="Database Migrations in CI/CD">
        Always make database migrations backward-compatible. Deploy the migration first, then
        deploy the code. For destructive changes (dropping columns), use a multi-step approach:
        stop using the column in code, deploy, then drop the column in a later migration.
      </InfoBox>

      <InteractiveChallenge
        question={"What is the key difference between Continuous Delivery and Continuous Deployment?"}
        options={[
          "Continuous Delivery includes testing; Continuous Deployment does not",
          "Continuous Delivery requires a manual approval step before production; Continuous Deployment is fully automated",
          "Continuous Deployment only works with Docker containers",
          "They are the same thing with different names"
        ]}
        correctIndex={1}
        explanation={"Continuous Delivery means every commit produces a deployable artifact and can be deployed at any time, but a human decides when to push to production. Continuous Deployment removes that manual gate — every passing commit goes to production automatically."}
        language="bash"
      />

      <InfoBox variant="tip" title="Pipeline Performance">
        Slow pipelines kill productivity. Target under 10 minutes for the CI feedback loop.
        Use parallelism, caching, incremental builds, and test splitting. Consider running
        only affected tests on PRs and full suites on main.
      </InfoBox>
    </LessonLayout>
  );
}

export default function CicdPage() {
  return <Cicd />;
}
