import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Infra() {
  return (
    <LessonLayout
      title="Multi-Cloud, IaC & Cost"
      sectionId="cloud"
      lessonIndex={1}
      prev={{ path: '/cloud/intro', label: 'Cloud Service Models & Compute' }}
      next={null}
    >
      <h2>AWS to Azure Mapping</h2>
      <p>
        Job postings and existing infrastructure won't always agree on a provider. The
        underlying concepts are the same across clouds — only the names change. Keeping this
        table in your head (or bookmarked) makes it much faster to read unfamiliar
        infrastructure or interview for a role that uses a different provider than you're
        used to.
      </p>

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
      <p>
        Clicking around a console doesn't scale and isn't repeatable. Terraform describes
        infrastructure declaratively in HCL and is cloud-agnostic — the same workflow
        provisions AWS, Azure, GCP, or all three. The core loop is four commands.
      </p>

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

      <p>
        A minimal project defines a provider and the resources you want, and Terraform
        figures out the create/update/delete plan needed to reach that state.
      </p>

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
      <p>
        Once your infrastructure is codified, the application running on top of it should
        follow the same discipline. The{' '}
        <a href="https://12factor.net" target="_blank" rel="noreferrer">12-factor app</a>{' '}
        methodology is a set of practices for building apps that deploy cleanly to any cloud
        environment — most of them boil down to "don't assume anything about the machine
        you're running on."
      </p>

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
      <p>
        Cloud bills grow quietly. A handful of habits — right-sizing, buying commitment
        discounts where usage is predictable, and cleaning up idle resources — usually
        account for most of the savings available without any architectural changes.
      </p>

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
