import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CloudArchitectureIac() {
  return (
    <LessonLayout
      title="Infrastructure as Code — Terraform Fundamentals"
      sectionId="cloud-architecture"
      lessonIndex={1}
      prev={{ path: '/cloud-architecture/well-architected', label: 'The Well-Architected Framework' }}
      next={{ path: '/cloud-architecture/multi-region', label: 'Multi-Region Architecture & Disaster Recovery' }}
    >
      <p>
        For most of cloud computing&#39;s history, building infrastructure meant clicking through a
        console: create a VPC here, launch an instance there, attach a security group, repeat next
        Tuesday when someone needs a second environment. None of that is reviewable, none of it has a
        diff, and none of it survives the one engineer who remembers the exact click order leaving the
        team. <strong>Infrastructure as Code (IaC)</strong> applies the same discipline to infrastructure
        that you already apply to application code: define the desired state in version-controlled text,
        get a diff before anything changes, get a history of who changed what and why, and get the same
        environment every time you run it. This lesson uses Terraform to make that concrete, because it
        is the most widely deployed tool in the category and its vocabulary — providers, resources, state,
        plan/apply — shows up under different names in almost every alternative.
      </p>

      <h2>Declarative Text Instead of Console Clicks</h2>

      <p>
        Terraform configuration is <strong>declarative</strong>: you write what you want to exist —
        &quot;an S3 bucket named X, an EC2 instance of type Y&quot; — and Terraform figures out the steps
        to get there. This is different from an imperative script that says &quot;run this API call, then
        that one, then check if this resource already exists before creating it.&quot; You describe the
        end state; Terraform diffs that end state against what it currently believes is deployed and
        computes the actions needed to reconcile the two. That diffing step is the whole reason the tool
        is safe to hand to a team instead of a single expert&#39;s memorized click sequence.
      </p>

      <h2>Terraform&#39;s Core Vocabulary</h2>

      <h3>Providers</h3>

      <p>
        A <strong>provider</strong> is a plugin that knows how to talk to a specific API — AWS, Google
        Cloud, Azure, Datadog, GitHub, Kubernetes, and hundreds of others each have one. The provider is
        what translates a resource block in your configuration into actual API calls. You declare which
        providers a configuration needs, and at what version, in a <code>required_providers</code> block
        nested inside a <code>terraform</code> block, then configure the provider itself (region, credentials
        source, etc.) in a separate <code>provider</code> block:
      </p>

      <CodeBlock language="hcl" title="Declaring and Configuring a Provider">
{`terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      # "~> 6.0" means >= 6.0.0 and < 7.0.0 -- accept minor and patch
      # releases, refuse the next major. The AWS provider is on 6.x;
      # a stale "~> 5.0" here would quietly hold you a whole major
      # version behind, missing new resource types and fixes.
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}`}
      </CodeBlock>

      <p>
        Pinning a version constraint here (<code>~&gt; 6.0</code>) matters for the same reason pinning a
        package.json dependency matters — without it, a fresh <code>terraform init</code> months from now
        can silently pull a newer provider version with breaking changes to resource arguments.
      </p>
      <p>
        The failure mode people forget is the other direction. A constraint is a ceiling as well as a
        floor: leave <code>&quot;~&gt; 5.0&quot;</code> in place after the provider moves to 6.x and{' '}
        <code>terraform init</code> keeps succeeding, keeps resolving a 5.x release, and never tells
        you that you are a major version behind on new resource types, arguments and bug fixes. Nothing
        errors — it just stops moving. Constraints need reviewing on a schedule, the same as any other
        dependency pin. <code>required_version</code> is set to <code>&gt;= 1.10.0</code> here rather
        than something older for a concrete reason: the S3 backend&apos;s native{' '}
        <code>use_lockfile</code> locking used later in this lesson does not exist before 1.10.
      </p>

      <h3>Resources</h3>

      <p>
        A <strong>resource</strong> block is one piece of infrastructure — one S3 bucket, one EC2
        instance, one DNS record. Its shape is <code>resource &quot;&lt;provider_type&gt;&quot;
        &quot;&lt;local_name&gt;&quot; {'{ ... }'}</code>, where the type (<code>aws_s3_bucket</code>,{' '}
        <code>aws_instance</code>) is defined by the provider and the local name is just how you refer to
        it elsewhere in your own configuration — it never appears in the actual cloud account. Every
        resource type documents its own arguments and the attributes it exports back for you to reference
        (an EC2 instance&#39;s <code>public_ip</code>, an S3 bucket&#39;s <code>arn</code>) — that
        documentation lives on the Terraform Registry, and it is worth treating as the source of truth
        over any blog post, including this one.
      </p>

      <InfoBox variant="danger" title="The State File Is Sensitive — Treat It Like a Secret">
        <p>
          Terraform records everything it manages in a <strong>state file</strong> (
          <code>terraform.tfstate</code> by default) — a JSON snapshot mapping every resource block in
          your configuration to the real object it corresponds to in the cloud account. Two properties of
          this file make it dangerous. First, it routinely contains <strong>plaintext secrets</strong> —
          a database&#39;s master password set via a resource argument, a generated TLS private key, an
          API token — because Terraform has to record a resource&#39;s full argument and attribute values
          to detect drift, and it does not encrypt them by default. HashiCorp&#39;s own documentation
          warns against storing state anywhere that lacks secure access control specifically because of
          the risk of &quot;exposure of secrets stored in the state file.&quot; Second, the state file is
          Terraform&#39;s <em>only</em> record of what it believes is deployed. Lose it, corrupt it, or
          let two people apply against stale copies of it, and Terraform&#39;s understanding of reality
          desyncs from actual infrastructure — its next plan may propose recreating resources that already
          exist, or destroying resources it no longer thinks it owns. The state file is not a build
          artifact you can regenerate; it is closer to a database, and it belongs in a backend with
          encryption, access control, and locking, never in Git.
        </p>
      </InfoBox>

      <h3><code>terraform plan</code> vs <code>terraform apply</code> — The Actual Safety Mechanism</h3>

      <p>
        This two-command split is the single most important habit in this lesson.{' '}
        <code>terraform plan</code> reads the real state of the world, compares it against your
        configuration, and prints exactly what would change — resources to create, update in place, or
        destroy — <strong>without touching anything</strong>. Per HashiCorp&#39;s own CLI documentation,
        &quot;the plan command alone does not actually carry out the proposed changes.&quot; It is a pure
        preview. <code>terraform apply</code> is the command that actually executes changes — and by
        default, run on its own, it first generates that same plan, shows it to you, and waits for typed
        confirmation before doing anything, exactly mirroring what <code>plan</code> would have shown.
      </p>

      <InfoBox variant="tip" title="Why This Two-Step Is the Safety Net, Not Bureaucracy">
        <p>
          A misconfigured resource argument can mean &quot;destroy and recreate this database.&quot;{' '}
          <code>plan</code> is the only thing standing between a typo and data loss — it turns a change
          that would otherwise be invisible until it happened into a diff a human (or a required PR
          reviewer, in CI) reads before it&#39;s real. Running <code>terraform apply -auto-approve</code>{' '}
          in a pipeline skips that confirmation prompt entirely, which is exactly why teams gate it behind
          a separate, human-reviewed <code>plan</code> output rather than trusting <code>apply</code> to
          run unattended on every commit.
        </p>
      </InfoBox>

      <h3>Variables and Outputs</h3>

      <p>
        <strong>Variables</strong> parameterize a configuration so the same files work across
        environments instead of being copy-pasted with different literals. A <code>variable</code> block
        declares a name, an optional type, an optional default, and a description; you reference it
        elsewhere with <code>var.&lt;name&gt;</code>:
      </p>

      <CodeBlock language="hcl" title="Declaring and Referencing a Variable">
{`variable "instance_type" {
  type        = string
  description = "EC2 instance type for the web server"
  default     = "t3.micro"
}

resource "aws_instance" "web" {
  instance_type = var.instance_type
  # ...
}`}
      </CodeBlock>

      <p>
        <strong>Outputs</strong> are the reverse direction — values a configuration exposes after it
        runs, for a human to read off the CLI or for another Terraform configuration to consume. An{' '}
        <code>output</code> block needs a <code>value</code> (any valid expression, usually a resource
        attribute) and should carry a <code>description</code>:
      </p>

      <CodeBlock language="hcl" title="Declaring an Output">
{`output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}`}
      </CodeBlock>

      <h2>A Complete Example</h2>

      <InfoBox variant="note" title="Illustrative HCL — Syntactically Correct, Not Executed Here">
        <p>
          The <code>terraform</code> CLI is not installed in this environment and there are no cloud
          credentials configured, so nothing below has been run. Every resource type, argument name, and
          exported attribute in this example was checked directly against the HashiCorp AWS provider&#39;s
          own documentation (registry.terraform.io / the provider&#39;s source repository) rather than
          written from memory — but treat it the way you&#39;d treat any code you didn&#39;t personally
          run: read it, then run <code>terraform plan</code> yourself against a real account before
          trusting it.
        </p>
      </InfoBox>

      <CodeBlock language="hcl" title="main.tf — S3 Bucket + EC2 Instance (illustrative, not executed)">
{`terraform {
  # 1.10+ is required for the S3 backend's native use_lockfile below.
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # Remote state, stored in S3 instead of on a laptop, with native
  # state locking so two people can't apply conflicting changes at once.
  backend "s3" {
    bucket       = "acme-terraform-state"
    key          = "web-app/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Deployment environment name, used in resource tags"
  default     = "dev"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type for the web server"
  default     = "t3.micro"
}

# Look up the latest Amazon Linux 2 AMI instead of hardcoding an ID
# that will silently go stale as AWS publishes new images.
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_s3_bucket" "app_data" {
  bucket = "acme-\${var.environment}-app-data"

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Versioning is its own resource as of AWS provider v4+ — it used to be
# an inline "versioning" block on aws_s3_bucket, which is now deprecated.
resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  tags = {
    Name        = "web-\${var.environment}"
    Environment = var.environment
  }
}

output "bucket_arn" {
  description = "ARN of the application data bucket"
  value       = aws_s3_bucket.app_data.arn
}

output "web_instance_public_ip" {
  description = "Public IP address of the web server"
  value       = aws_instance.web.public_ip
}`}
      </CodeBlock>

      <p>
        Walking it top to bottom: the <code>terraform</code> block pins the provider version and points
        at a remote S3 backend for state, with <code>use_lockfile = true</code> enabling Terraform&#39;s
        native S3 state locking. Two <code>variable</code> blocks parameterize the environment name and
        instance size. The <code>data &quot;aws_ami&quot;</code> block is a <strong>data source</strong> —
        a read-only lookup against the provider&#39;s API, in this case fetching the newest matching AMI
        ID at plan time rather than hardcoding one that will eventually stop existing. The bucket is split
        across two resources because, as the comment notes, recent versions of the AWS provider moved
        versioning out of an inline argument on <code>aws_s3_bucket</code> and into its own{' '}
        <code>aws_s3_bucket_versioning</code> resource — a good example of why checking current provider
        docs beats remembering syntax from an older tutorial. The instance references both the data
        source and a variable. The two outputs surface exactly the two values someone deploying this
        would actually need afterward. Running <code>terraform init</code> once (to download the pinned
        provider and configure the backend), then <code>terraform plan</code>, then{' '}
        <code>terraform apply</code> is the full workflow this file was written for.
      </p>

      <h2>State Management: Remote State and Locking</h2>

      <p>
        The backend block above solves a real, common failure mode, not a hypothetical one: two engineers
        running <code>terraform apply</code> against the same infrastructure at the same time, each
        working from their own local copy of the state file. Without coordination, both applies can
        succeed against a stale view of reality, and whichever one writes state last silently clobbers the
        other&#39;s changes — or worse, both partially apply and leave the state file describing
        infrastructure that no longer matches what either engineer intended. A <strong>remote
        backend</strong> (S3, HCP Terraform, and others) centralizes the state file so a team shares one
        copy instead of each holding their own, and <strong>state locking</strong> makes a second{' '}
        <code>apply</code> wait — or fail outright — while one is already in progress, rather than racing
        it. Terraform has historically implemented S3 locking via a companion DynamoDB table; current
        versions also support locking natively within S3 itself (the <code>use_lockfile</code> argument
        used above), with the DynamoDB approach now on a deprecation path. Either mechanism exists to
        solve the same problem: make concurrent applies queue up safely instead of corrupting each other.
      </p>

      <InfoBox variant="note" title="Terraform Is One IaC Tool Among Several">
        <p>
          Terraform&#39;s specific bet is a small, purpose-built <strong>declarative</strong> language
          (HCL) that intentionally limits what you can express — no arbitrary loops or classes, reuse via
          a module system instead of functions. <strong>Pulumi</strong> and the <strong>AWS Cloud
          Development Kit (CDK)</strong> take the opposite bet: you write actual TypeScript, Python, Go,
          or Java, which gives you real control flow, your existing test framework, and your IDE&#39;s
          type-checking, at the cost of infrastructure code now being able to do anything a general-purpose
          program can do — including things that make a diff harder to reason about at a glance.
          Neither approach is objectively better; teams already deep in Terraform&#39;s module ecosystem
          pay a real cost to switch, and teams that want infrastructure code reviewed with the same tools
          and rigor as application code often prefer a real language. Separately, <strong>Ansible</strong>{' '}
          usually is not a direct alternative to any of the above — it is primarily a{' '}
          <strong>configuration management</strong> tool (installing packages, editing config files,
          restarting services on machines that already exist) rather than a provisioning tool for creating
          the cloud resources in the first place, and it is common to see Terraform provision a server and
          Ansible configure it afterward, in the same pipeline.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Terraform Is No Longer Open Source — and OpenTofu Is the Fork">
        <p>
          One fact about Terraform is not technical and gets left out of tutorials, including this one
          until now: in <strong>August 2023 HashiCorp relicensed Terraform from MPL 2.0 to the
          Business Source License (BUSL 1.1)</strong>. BUSL is source-available, not open source. For
          the overwhelming majority of users nothing changes — you may still read, run, modify and
          embed Terraform in your own infrastructure. The restriction targets building a competing
          commercial offering with it, which is a real constraint for a narrow set of vendors and a
          non-issue for a team managing its own AWS account.
        </p>
        <p>
          What it did change is the ecosystem. The community forked the last MPL-licensed code as{' '}
          <strong>OpenTofu</strong>, now a Linux Foundation project, currently on the 1.12 line. It is
          a drop-in replacement — same HCL, same provider protocol, same registry providers, and{' '}
          <code>tofu</code> in place of <code>terraform</code> on the command line. It has since
          shipped features Terraform does not have, such as client-side state encryption.
        </p>
        <p>
          Practically: learn Terraform, because it is what job postings say and what the module
          ecosystem is built around, and everything in this lesson applies to both. Know that OpenTofu
          exists, because &quot;why not just use Terraform?&quot; is a question a senior engineer is
          expected to be able to answer with the licence change rather than a shrug — and because if
          you ever build a product that <em>provisions infrastructure on a customer&apos;s behalf</em>,
          the distinction stops being trivia and becomes a legal review.
        </p>
      </InfoBox>

    </LessonLayout>
  );
}
