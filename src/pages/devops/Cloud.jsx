import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Cloud() {
  return (
    <LessonLayout
      title="Cloud Basics (AWS/Azure)"
      sectionId="devops"
      lessonIndex={4}
      prev={{ path: '/devops/docker', label: 'Docker Fundamentals' }}
      next={{ path: '/devops/monitoring', label: 'Monitoring & Observability' }}
    >
      <h2>Cloud Service Models</h2>
      <p>
        Understanding what you manage vs. what the provider manages is fundamental to
        choosing the right service for each workload.
      </p>

      <table>
        <thead>
          <tr>
            <th>Model</th>
            <th>You Manage</th>
            <th>Provider Manages</th>
            <th>Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>IaaS</strong></td>
            <td>OS, runtime, app, data</td>
            <td>Hardware, networking, virtualization</td>
            <td>EC2, Azure VMs</td>
          </tr>
          <tr>
            <td><strong>PaaS</strong></td>
            <td>App, data</td>
            <td>Everything else</td>
            <td>Elastic Beanstalk, Azure App Service</td>
          </tr>
          <tr>
            <td><strong>SaaS</strong></td>
            <td>Configuration</td>
            <td>Everything</td>
            <td>Gmail, Salesforce, Jira</td>
          </tr>
          <tr>
            <td><strong>FaaS</strong></td>
            <td>Function code only</td>
            <td>Everything else, including scaling</td>
            <td>Lambda, Azure Functions</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="Cloud Responsibility Spectrum"
        chart={"graph LR\nA[On-Premise] --> B[IaaS]\nB --> C[PaaS]\nC --> D[FaaS/Serverless]\nD --> E[SaaS]\nstyle A fill:#f44336,color:#fff\nstyle B fill:#FF9800,color:#fff\nstyle C fill:#2196F3,color:#fff\nstyle D fill:#4CAF50,color:#fff\nstyle E fill:#9C27B0,color:#fff"}
      />

      <h2>AWS Core Services</h2>

      <h3>Compute</h3>

      <CodeBlock language="bash" title="EC2 — Virtual Servers">
{`# Launch an EC2 instance via CLI
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.medium \
  --key-name my-keypair \
  --security-group-ids sg-12345678 \
  --subnet-id subnet-abcdef \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-server}]'

# SSH into your instance
ssh -i my-keypair.pem ec2-user@<public-ip>

# Common instance types:
# t3.micro  — free tier, burstable, dev/test
# t3.medium — small workloads
# m6i.large — general purpose production
# c6i.large — compute-optimized
# r6i.large — memory-optimized`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Lambda — Serverless Functions">
{`// Lambda handler (Node.js)
export const handler = async (event) => {
  const { name } = JSON.parse(event.body);
  
  // Process the request
  const result = await processData(name);
  
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Success', data: result }),
  };
};

// Lambda is billed per millisecond of execution
// Max execution time: 15 minutes
// Max memory: 10GB
// Cold starts: first invocation takes longer`}
      </CodeBlock>

      <h3>Storage &amp; Databases</h3>

      <CodeBlock language="bash" title="S3 — Object Storage">
{`# Create a bucket
aws s3 mb s3://my-company-assets-prod

# Upload files
aws s3 cp ./build s3://my-bucket/static/ --recursive
aws s3 sync ./dist s3://my-bucket/app/ --delete

# Presigned URLs (temporary access)
aws s3 presign s3://my-bucket/private/report.pdf --expires-in 3600

# S3 storage classes:
# Standard         — frequently accessed
# Intelligent      — auto-tiering
# Standard-IA      — infrequent access
# Glacier          — archival (minutes to hours retrieval)
# Glacier Deep     — archival (12+ hours retrieval)`}
      </CodeBlock>

      <CodeBlock language="bash" title="RDS — Managed Databases">
{`# Create a PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier my-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16 \
  --master-username admin \
  --master-user-password "SecureP@ss123!" \
  --allocated-storage 100 \
  --storage-type gp3 \
  --multi-az \
  --backup-retention-period 7

# RDS handles: patching, backups, failover, read replicas
# Supported engines: PostgreSQL, MySQL, MariaDB, Oracle, SQL Server, Aurora`}
      </CodeBlock>

      <h3>Messaging &amp; Integration</h3>

      <CodeBlock language="bash" title="SQS and SNS">
{`# SQS — Message queue (point-to-point)
aws sqs create-queue --queue-name order-processing
aws sqs send-message --queue-url <url> --message-body '{"orderId": 123}'

# SNS — Pub/Sub (fan-out to multiple subscribers)
aws sns create-topic --name order-events
aws sns subscribe --topic-arn <arn> --protocol sqs --notification-endpoint <queue-arn>

# Pattern: SNS topic fans out to multiple SQS queues
# Order placed -> SNS topic -> SQS (fulfillment)
#                            -> SQS (notifications)
#                            -> SQS (analytics)`}
      </CodeBlock>

      <h2>AWS to Azure Mapping</h2>

      <table>
        <thead>
          <tr>
            <th>Service Category</th>
            <th>AWS</th>
            <th>Azure</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Virtual Machines</td>
            <td>EC2</td>
            <td>Virtual Machines</td>
          </tr>
          <tr>
            <td>Serverless Functions</td>
            <td>Lambda</td>
            <td>Azure Functions</td>
          </tr>
          <tr>
            <td>Container Orchestration</td>
            <td>ECS / EKS</td>
            <td>ACI / AKS</td>
          </tr>
          <tr>
            <td>Object Storage</td>
            <td>S3</td>
            <td>Blob Storage</td>
          </tr>
          <tr>
            <td>Managed SQL</td>
            <td>RDS / Aurora</td>
            <td>Azure SQL / Cosmos DB</td>
          </tr>
          <tr>
            <td>NoSQL</td>
            <td>DynamoDB</td>
            <td>Cosmos DB</td>
          </tr>
          <tr>
            <td>Message Queue</td>
            <td>SQS</td>
            <td>Service Bus Queues</td>
          </tr>
          <tr>
            <td>Pub/Sub</td>
            <td>SNS</td>
            <td>Service Bus Topics / Event Grid</td>
          </tr>
          <tr>
            <td>API Gateway</td>
            <td>API Gateway</td>
            <td>API Management</td>
          </tr>
          <tr>
            <td>CDN</td>
            <td>CloudFront</td>
            <td>Azure CDN / Front Door</td>
          </tr>
          <tr>
            <td>DNS</td>
            <td>Route 53</td>
            <td>Azure DNS</td>
          </tr>
          <tr>
            <td>Identity &amp; Access</td>
            <td>IAM</td>
            <td>Azure AD / Entra ID</td>
          </tr>
          <tr>
            <td>Virtual Network</td>
            <td>VPC</td>
            <td>VNet</td>
          </tr>
          <tr>
            <td>Monitoring</td>
            <td>CloudWatch</td>
            <td>Azure Monitor</td>
          </tr>
          <tr>
            <td>IaC</td>
            <td>CloudFormation</td>
            <td>ARM / Bicep</td>
          </tr>
        </tbody>
      </table>

      <h2>Infrastructure as Code</h2>

      <CodeBlock language="bash" title="Terraform Basics">
{`# Initialize a new Terraform project
terraform init

# Preview changes
terraform plan

# Apply changes
terraform apply

# Destroy infrastructure
terraform destroy`}
      </CodeBlock>

      <CodeBlock language="json" title="Terraform — main.tf (HCL shown as reference)">
{`// Provider configuration
provider "aws" {
  region = "us-east-1"
}

// Create a VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "production-vpc"
  }
}

// Create an EC2 instance
resource "aws_instance" "api_server" {
  ami           = "ami-0abcdef1234567890"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.public.id
  
  tags = {
    Name        = "api-server"
    Environment = "production"
  }
}

// Create an RDS database
resource "aws_db_instance" "main" {
  identifier     = "production-db"
  engine         = "postgres"
  engine_version = "16"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  
  db_name  = "myapp"
  username = "admin"
  password = var.db_password   // from variables
  
  multi_az             = true
  skip_final_snapshot  = false
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Terraform State">
        Terraform tracks infrastructure state in a state file. For teams, always use remote
        state (S3 + DynamoDB for locking on AWS, or Azure Blob Storage). Never commit
        <code>terraform.tfstate</code> to version control — it may contain secrets.
      </InfoBox>

      <h2>12-Factor App Methodology</h2>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Factor</th>
            <th>Principle</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1</td><td>Codebase</td><td>One codebase per app, tracked in version control</td></tr>
          <tr><td>2</td><td>Dependencies</td><td>Explicitly declare and isolate dependencies</td></tr>
          <tr><td>3</td><td>Config</td><td>Store config in environment variables, not code</td></tr>
          <tr><td>4</td><td>Backing Services</td><td>Treat databases, queues, etc. as attached resources</td></tr>
          <tr><td>5</td><td>Build, Release, Run</td><td>Strictly separate build, release, and run stages</td></tr>
          <tr><td>6</td><td>Processes</td><td>Execute the app as stateless processes</td></tr>
          <tr><td>7</td><td>Port Binding</td><td>Export services via port binding</td></tr>
          <tr><td>8</td><td>Concurrency</td><td>Scale out via the process model</td></tr>
          <tr><td>9</td><td>Disposability</td><td>Fast startup, graceful shutdown</td></tr>
          <tr><td>10</td><td>Dev/Prod Parity</td><td>Keep development and production as similar as possible</td></tr>
          <tr><td>11</td><td>Logs</td><td>Treat logs as event streams</td></tr>
          <tr><td>12</td><td>Admin Processes</td><td>Run admin/management tasks as one-off processes</td></tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Factor #3: Config">
        The most commonly violated factor. Hardcoded database URLs, API keys, and feature
        flags should all come from environment variables. If your app needs a code change to
        switch between staging and production, you&apos;re doing it wrong.
      </InfoBox>

      <h2>Cost Optimization Tips</h2>

      <CodeBlock language="bash" title="Cost-Saving Strategies">
{`# 1. Right-size instances — monitor CPU/memory and downsize
aws cloudwatch get-metric-statistics --namespace AWS/EC2 \
  --metric-name CPUUtilization --dimensions Name=InstanceId,Value=i-12345

# 2. Use Reserved Instances or Savings Plans for stable workloads
# 1-year RI: ~40% savings  |  3-year RI: ~60% savings

# 3. Use Spot Instances for fault-tolerant workloads (up to 90% off)
aws ec2 run-instances --instance-market-options MarketType=spot

# 4. Auto-scaling: scale down during low traffic
# 5. S3 Lifecycle Policies: move old data to cheaper storage
# 6. Schedule dev/test environments to stop after hours
# 7. Use serverless for unpredictable or spiky workloads
# 8. Enable Cost Explorer and set up billing alerts`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Your application handles unpredictable traffic spikes — sometimes 10 requests/minute, sometimes 10,000. Which compute service is most cost-effective?"}
        options={[
          "EC2 with Auto Scaling Groups",
          "ECS with Fargate",
          "Lambda (serverless functions)",
          "A single large EC2 instance"
        ]}
        correctIndex={2}
        explanation={"Lambda charges only for actual execution time and scales automatically to handle any load. With such unpredictable traffic, you'd waste money on idle EC2 or Fargate capacity during quiet periods. Lambda's pay-per-invocation model is ideal for spiky workloads."}
        language="bash"
      />

      <InfoBox variant="warning" title="Cloud Billing Surprises">
        Always set up billing alerts before doing anything in a cloud account. Common
        surprises: NAT Gateway data transfer fees, unused Elastic IPs, forgotten EBS volumes,
        and CloudWatch log storage. Use AWS Cost Explorer or Azure Cost Management weekly.
      </InfoBox>
    </LessonLayout>
  );
}

export default function CloudPage() {
  return <Cloud />;
}
