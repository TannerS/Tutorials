import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Networking() {
  return (
    <LessonLayout
      title="Networking & Volumes"
      sectionId="docker"
      lessonIndex={3}
      prev={{ path: '/docker/compose', label: 'Docker Compose & Local Dev' }}
      next={{ path: '/docker/security', label: 'Security & Best Practices' }}
    >
      <h2>Docker Networking Modes</h2>
      <p>
        Every container's network access is determined by which Docker network mode it runs in.
        Understanding the three you'll actually use &mdash; bridge, custom bridge, and host &mdash;
        explains both why containers on the same Compose file can reach each other by name, and
        why a container sometimes surprisingly <em>can't</em> reach something you expect it to.
      </p>

      <FlowChart
        title="Docker Network Modes"
        chart={"graph TD\n  H[Host Machine] --> DB[default bridge: docker0]\n  H --> CB[custom bridge network]\n  H --> HN[host network mode]\n  DB --> C1[Container A\\nno auto DNS by name]\n  DB --> C2[Container B\\nno auto DNS by name]\n  CB --> C3[Container C\\nresolves by name]\n  CB --> C4[Container D\\nresolves by name]\n  HN --> C5[Container E\\nshares host's network stack]"}
      />

      <table>
        <thead>
          <tr>
            <th>Mode</th>
            <th>Isolation</th>
            <th>Container-name DNS?</th>
            <th>When to use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Default bridge</strong></td>
            <td>Isolated from host, containers share one flat network</td>
            <td>No &mdash; only via legacy <code>--link</code></td>
            <td>Rarely used directly today; it's the historical default</td>
          </tr>
          <tr>
            <td><strong>Custom bridge</strong></td>
            <td>Isolated from host and from other custom networks</td>
            <td>Yes &mdash; built-in embedded DNS resolves container names</td>
            <td>The default for Compose projects and most multi-container apps</td>
          </tr>
          <tr>
            <td><strong>Host</strong></td>
            <td>None &mdash; container shares the host's network namespace directly</td>
            <td>N/A (same as host)</td>
            <td>Performance-sensitive cases, Linux only, avoid unless you need it</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="Why Compose 'Just Works'">
        When you run <code>docker compose up</code>, Compose automatically creates a dedicated custom
        bridge network for your project and attaches every service to it. That's why an
        <code>app</code> service can reach Postgres simply by hostname <code>db</code> &mdash; Compose's network
        gives every service DNS-resolvable names for free. This is different from the legacy
        default bridge network, which has no built-in name resolution.
      </InfoBox>

      <h2>Networking Commands</h2>
      <CodeBlock language="bash" title="Networking Commands">
{`# List networks
docker network ls

# Create a custom network
docker network create my-network

# Run containers on the same network — they can reach each other by name
docker run -d --name api --network my-network my-api:1.0
docker run -d --name db --network my-network postgres:16

# From the "api" container, you can connect to: db:5432
# Docker's embedded DNS resolves container names automatically

# Inspect a network (see connected containers, subnet, gateway)
docker network inspect my-network

# Attach a running container to an additional network
docker network connect my-network some-container

# Host networking (Linux only) — container shares host's network stack directly,
# no port mapping needed/possible, no isolation
docker run --network host my-app:1.0`}
      </CodeBlock>

      <InfoBox variant="warning" title="Host Mode Isn't Available on Docker Desktop the Same Way">
        <code>--network host</code> works natively on Linux hosts. On Docker Desktop for
        macOS/Windows, the Docker Engine itself runs inside a lightweight VM, so "host" networking
        means the VM's network, not your actual laptop's &mdash; the behavior is subtly different.
        Stick to bridge networking with explicit port mapping unless you have a specific reason
        not to.
      </InfoBox>

      <h2>Volumes: Persisting Data</h2>
      <p>
        Containers are meant to be disposable &mdash; you should be able to <code>docker rm</code> one
        and recreate it without a second thought. But some data (a database's files, uploaded
        user content) needs to outlive any single container's lifecycle. That's what volumes are
        for.
      </p>

      <CodeBlock language="bash" title="Volume Types">
{`# Named volume — managed by Docker, persists across container restarts/removal
docker volume create app-data
docker run -v app-data:/app/data my-app:1.0

# Bind mount — maps a host directory directly into the container
docker run -v $(pwd)/src:/app/src my-app:1.0

# Read-only mount — container can read but not write
docker run -v $(pwd)/config:/app/config:ro my-app:1.0

# tmpfs mount — in-memory only, never touches disk, gone when container stops
docker run --tmpfs /app/temp my-app:1.0

# List and clean up volumes
docker volume ls
docker volume inspect app-data
docker volume prune          # remove volumes not referenced by any container`}
      </CodeBlock>

      <table>
        <thead>
          <tr>
            <th>Volume type</th>
            <th>Managed by</th>
            <th>Survives container removal?</th>
            <th>Typical use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Named volume</strong></td>
            <td>Docker</td>
            <td>Yes</td>
            <td>Database storage, anything Docker should own and manage</td>
          </tr>
          <tr>
            <td><strong>Bind mount</strong></td>
            <td>You (a host path)</td>
            <td>Yes (it's your filesystem)</td>
            <td>Local dev hot-reload, mounting config files</td>
          </tr>
          <tr>
            <td><strong>tmpfs</strong></td>
            <td>Kernel memory</td>
            <td>No &mdash; wiped on container stop</td>
            <td>Sensitive temp data (secrets, caches) that shouldn't hit disk</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="Where Each Mount Type Lives"
        chart={"graph TD\n  C[Container] --> NV[Named Volume\\nDocker-managed storage]\n  C --> BM[Bind Mount\\nyour host filesystem path]\n  C --> TF[tmpfs\\nRAM only, ephemeral]\n  NV --> Persist1[Survives container removal]\n  BM --> Persist2[Survives container removal]\n  TF --> Gone[Lost when container stops]"}
      />

      <InfoBox variant="warning" title="Bind Mount Gotcha on macOS">
        On macOS (and Windows), bind mounts cross a filesystem-sharing boundary between the host
        and the Linux VM Docker Desktop runs in, and file I/O through that boundary can be
        significantly slower than on native Linux &mdash; especially noticeable with directories
        containing many small files. Use named volumes for directories like <code>node_modules</code>
        (as in the Compose example from the previous lesson), and reserve bind mounts for the
        source code you're actively editing.
      </InfoBox>

      <InteractiveChallenge
        question="Why can services in a docker-compose.yml file reach each other using service names like `db` or `cache` as hostnames?"
        options={[
          "Docker automatically edits your host machine's /etc/hosts file",
          "Compose creates a custom bridge network for the project with built-in DNS name resolution",
          "All Compose services always run in host networking mode",
          "Service names are just aliases for 127.0.0.1 with different ports"
        ]}
        correctIndex={1}
        explanation="Docker Compose automatically creates a dedicated custom bridge network for the project and attaches every service to it. Docker's embedded DNS server resolves each service's name to its container IP on that network — this DNS resolution is a feature of custom bridge networks specifically, not the legacy default bridge."
      />

      <h2>What's Next</h2>
      <p>
        Networking and volumes get your containers talking to each other and persisting data
        safely. The next lesson turns to hardening containers for production: running as
        non-root, image scanning, secrets management, and resource limits.
      </p>
    </LessonLayout>
  );
}
