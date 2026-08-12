import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Intro() {
  return (
    <LessonLayout
      title="What is Docker? Containers vs VMs"
      sectionId="docker"
      lessonIndex={0}
      prev={null}
      next={{ path: '/docker/dockerfile', label: 'Dockerfile & Multi-Stage Builds' }}
    >
      <h2>The Problem: "Works on My Machine"</h2>
      <p>
        Every senior engineer has lived this: a service runs perfectly on a developer's laptop,
        then breaks in staging because of a different Node version, a missing native library, or
        a Postgres client that doesn't match what production expects. The application's behavior
        depended on the state of the machine it happened to run on — and that state was never
        fully written down anywhere.
      </p>
      <p>
        Docker solves this by packaging an application <em>together with</em> everything it needs
        to run &mdash; runtime, libraries, system tools, environment defaults, and application code
        &mdash; into a single, immutable unit called an <strong>image</strong>. Run that image
        anywhere Docker is installed, and you get byte-for-byte the same environment: your laptop,
        a CI runner, a staging VM, and a production Kubernetes node all execute the identical
        filesystem and dependency graph.
      </p>

      <InfoBox variant="info" title="It's Not Just for Node/Java Apps">
        Docker is language-agnostic. A Node.js API, a Spring Boot service, a Python worker, and a
        Postgres database can all run as containers side by side, each isolated, each described by
        a small declarative file. This is why Docker became the universal packaging format for
        backend services.
      </InfoBox>

      <h2>Containers vs Virtual Machines</h2>
      <p>
        Before containers, the standard way to isolate workloads was the virtual machine: a
        hypervisor virtualizes hardware, and each VM boots a <em>full</em> guest operating system on
        top of it. Containers take a fundamentally different approach &mdash; they share the host
        machine's kernel and only isolate the process, filesystem, and network at the OS level.
      </p>

      <FlowChart
        title="VMs vs Containers: Isolation Model"
        chart={"graph TD\n  subgraph VM[Virtual Machines]\n    HW1[Physical Hardware] --> HV[Hypervisor]\n    HV --> G1[Guest OS + App A]\n    HV --> G2[Guest OS + App B]\n  end\n  subgraph CT[Containers]\n    HW2[Physical Hardware] --> HOS[Host OS Kernel]\n    HOS --> CE[Container Engine]\n    CE --> C1[App A Process]\n    CE --> C2[App B Process]\n  end\n  style G1 fill:#ef4444,color:#fff\n  style G2 fill:#ef4444,color:#fff\n  style C1 fill:#10b981,color:#fff\n  style C2 fill:#10b981,color:#fff"}
      />

      <table>
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Virtual Machine</th>
            <th>Container</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Isolation model</strong></td>
            <td>Hardware-level, via a hypervisor</td>
            <td>OS-level, via kernel namespaces &amp; cgroups</td>
          </tr>
          <tr>
            <td><strong>What's inside</strong></td>
            <td>A full guest operating system + app</td>
            <td>Just the app + its dependencies</td>
          </tr>
          <tr>
            <td><strong>Typical size</strong></td>
            <td>Gigabytes</td>
            <td>Megabytes to low hundreds of MB</td>
          </tr>
          <tr>
            <td><strong>Startup time</strong></td>
            <td>Minutes (booting an OS)</td>
            <td>Milliseconds to seconds</td>
          </tr>
          <tr>
            <td><strong>Resource overhead</strong></td>
            <td>High &mdash; each VM duplicates the OS</td>
            <td>Low &mdash; kernel is shared across containers</td>
          </tr>
          <tr>
            <td><strong>Density per host</strong></td>
            <td>Tens of VMs</td>
            <td>Hundreds to thousands of containers</td>
          </tr>
          <tr>
            <td><strong>Best for</strong></td>
            <td>Strong security boundaries, mixed OS workloads</td>
            <td>Microservices, CI/CD, horizontally scaled apps</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="Containers Aren't a VM Replacement">
        Many production systems run both: cloud VMs (EC2, GCE) provide the hardware-isolated hosts,
        and a container runtime runs many containers on top of each VM. Kubernetes nodes are
        typically VMs; the pods scheduled onto them are containers.
      </InfoBox>

      <h2>Docker's Core Concepts</h2>
      <p>
        Docker introduces a small set of building blocks. Understanding these five terms unlocks
        almost everything else in the ecosystem:
      </p>

      <FlowChart
        title="Docker Architecture"
        chart={"graph TD\n  A[Dockerfile] -->|docker build| B[Image]\n  B -->|docker run| C[Container]\n  B -->|docker push| D[Registry]\n  D -->|docker pull| B\n  C --> E[Volumes: persistent data]\n  C --> F[Networks: container-to-container]\n  C --> G[Ports: host mapping]\n  style A fill:#2196F3,color:#fff\n  style B fill:#4CAF50,color:#fff\n  style C fill:#FF9800,color:#fff\n  style D fill:#9C27B0,color:#fff"}
      />

      <table>
        <thead>
          <tr>
            <th>Concept</th>
            <th>What It Is</th>
            <th>Analogy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Dockerfile</strong></td>
            <td>A text recipe describing how to build an image, step by step</td>
            <td>A blueprint</td>
          </tr>
          <tr>
            <td><strong>Image</strong></td>
            <td>A read-only, layered template containing the app + its dependencies</td>
            <td>A class definition</td>
          </tr>
          <tr>
            <td><strong>Container</strong></td>
            <td>A running (or stopped) instance of an image, with its own writable layer</td>
            <td>An object/instance</td>
          </tr>
          <tr>
            <td><strong>Volume</strong></td>
            <td>Persistent storage that lives outside the container's lifecycle</td>
            <td>An external hard drive</td>
          </tr>
          <tr>
            <td><strong>Network</strong></td>
            <td>A virtual network that lets containers discover and talk to each other</td>
            <td>A private LAN</td>
          </tr>
          <tr>
            <td><strong>Registry</strong></td>
            <td>A server that stores and distributes images (Docker Hub, ECR, GHCR)</td>
            <td>An app store</td>
          </tr>
        </tbody>
      </table>

      <h2>A Brief History</h2>
      <p>
        Container-like isolation on Linux predates Docker by decades &mdash; <code>chroot</code>
        (1979), FreeBSD jails (2000), and Linux Containers/LXC (2008) all provided pieces of the
        puzzle. Docker's contribution wasn't inventing isolation; it was making it easy.
      </p>
      <ul>
        <li><strong>2013</strong> &mdash; Docker, Inc. (then dotCloud) releases Docker, wrapping LXC-style
          isolation with a simple CLI, a Dockerfile format, and a build/ship/run workflow developers
          could actually use.</li>
        <li><strong>2015</strong> &mdash; Docker donates its container image and runtime specs to the
          newly formed <strong>Open Container Initiative (OCI)</strong>, an industry standard so any
          runtime can run any compliant image &mdash; not just Docker's own.</li>
        <li><strong>2016&ndash;2017</strong> &mdash; Docker splits its low-level execution engine into
          <code>containerd</code> (a container runtime) and <code>runc</code> (the OCI-compliant process
          that actually creates containers). Kubernetes and other tools adopt these directly.</li>
        <li><strong>Today</strong> &mdash; "Docker" commonly refers to the Docker Engine and CLI, but the
          underlying pieces (OCI images, containerd, runc) are shared infrastructure used by
          Kubernetes, Podman, and every major cloud container service.</li>
      </ul>

      <InfoBox variant="tip" title="Why This Matters">
        Because images are OCI-standard, an image you build with <code>docker build</code> can be run by
        containerd on a Kubernetes node, by Podman, or by AWS Fargate &mdash; without any changes.
        Docker is a tool for building and running containers; the container format itself is an
        open, portable standard.
      </InfoBox>

      <h2>Installing Docker</h2>
      <p>
        On macOS and Windows, <strong>Docker Desktop</strong> bundles the Docker Engine (running in a
        lightweight Linux VM), the CLI, and Docker Compose. On Linux, you install the Docker Engine
        directly on the host.
      </p>

      <CodeBlock language="bash" title="Verify Your Installation">{`# Check the CLI and engine versions
docker --version
docker compose version

# Confirm the daemon is running and can pull + run an image
docker run hello-world

# You should see:
# "Hello from Docker!"
# "This message shows that your installation appears to be working correctly."`}</CodeBlock>

      <p>
        That one command exercises the entire pipeline: the CLI talked to the Docker daemon, the
        daemon pulled the <code>hello-world</code> image from Docker Hub (a public registry), created a
        container from it, ran it, streamed its output back to your terminal, and the container
        exited. Every Docker workflow you'll build going forward is a variation on that same
        pull-run-observe loop.
      </p>

      <InteractiveChallenge
        question="What's the key architectural difference between a container and a virtual machine?"
        options={[
          "Containers use less disk space, that's the only difference",
          "Containers share the host OS kernel; VMs virtualize hardware and run a full guest OS each",
          "Containers can only run Linux software, VMs can run anything",
          "There is no real difference, the terms are interchangeable"
        ]}
        correctIndex={1}
        explanation="Virtual machines virtualize hardware via a hypervisor, and each VM boots its own complete guest operating system. Containers isolate processes at the OS level using kernel features (namespaces and cgroups) and share the host's kernel, which is why they're dramatically lighter and faster to start."
      />

      <h2>What's Next</h2>
      <p>
        Now that you understand what Docker is and why it exists, the next lesson dives into
        writing Dockerfiles &mdash; the full instruction set, multi-stage builds for both Node.js
        and Java/Spring Boot services, and the layer-caching mechanics that make rebuilds fast.
      </p>
    </LessonLayout>
  );
}
