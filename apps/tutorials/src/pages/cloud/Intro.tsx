import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="Cloud Service Models & Compute"
      sectionId="cloud"
      lessonIndex={0}
      prev={null}
      next={{ path: '/cloud/infra', label: 'Multi-Cloud, IaC & Cost' }}
    >
      <h2>Cloud Service Models</h2>
      <p>
        Before picking a service, figure out where you want to sit on the responsibility
        spectrum. Every option — a raw VM, a managed platform, a SaaS product, a single
        function — trades control for convenience. Understanding what you manage vs. what
        the provider manages is fundamental to choosing the right service for each workload.
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

      <p>
        As you move right along the spectrum below, you give up low-level control in
        exchange for less operational burden. Most real systems mix models — a Lambda
        function talking to a managed database is both FaaS and PaaS in the same request.
      </p>

      <FlowChart
        title="Cloud Responsibility Spectrum"
        chart={"graph LR\nA[On-Premise] --> B[IaaS]\nB --> C[PaaS]\nC --> D[FaaS/Serverless]\nD --> E[SaaS]\nstyle A fill:#f44336,color:#fff\nstyle B fill:#FF9800,color:#fff\nstyle C fill:#2196F3,color:#fff\nstyle D fill:#4CAF50,color:#fff\nstyle E fill:#9C27B0,color:#fff"}
      />

      <h2>AWS Core Services</h2>
      <p>
        AWS is the largest cloud provider and a reasonable place to learn the vocabulary
        that carries over to every other provider. The services below cover compute,
        storage, and messaging — the building blocks you'll reach for in almost any
        backend architecture.
      </p>

      <h3>Compute</h3>
      <p>
        EC2 gives you a virtual machine — full control over the OS, but you're responsible
        for patching, scaling, and provisioning capacity yourself.
      </p>

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

      <p>
        Lambda sits at the opposite end of the spectrum: you hand over a function, and AWS
        handles provisioning, scaling, and patching entirely. You pay per invocation and
        per millisecond of execution instead of for idle server time.
      </p>

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

      <InfoBox variant="tip" title="EC2 vs. Lambda">
        Reach for EC2 when you need long-running processes, full OS control, or predictable
        steady-state load. Reach for Lambda when the workload is short-lived, event-driven,
        or bursty — you avoid paying for capacity that sits idle.
      </InfoBox>

      <h3>Storage &amp; Databases</h3>
      <p>
        S3 is object storage — good for static assets, backups, and large blobs. It isn't a
        filesystem; you write and read whole objects by key, and durability/availability are
        handled for you.
      </p>

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

      <p>
        RDS gives you a managed relational database — the engine you already know
        (PostgreSQL, MySQL, etc.), but AWS handles patching, backups, and failover for you.
      </p>

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
      <p>
        SQS and SNS decouple services from each other. SQS is a point-to-point queue —
        one message, one consumer. SNS is pub/sub — one message, fanned out to every
        subscriber. Combining them (SNS topic feeding multiple SQS queues) is one of the
        most common integration patterns on AWS.
      </p>

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

      <p>
        Next up: how these same concepts map onto Azure, how to provision them
        repeatably with Terraform, and how to keep the bill under control.
      </p>
    </LessonLayout>
  );
}
