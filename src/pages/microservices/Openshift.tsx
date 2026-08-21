import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function Openshift() {
  return (
    <LessonLayout
      title="OpenShift: Kubernetes for the Enterprise"
      sectionId="microservices"
      lessonIndex={7}
      prev={{ path: '/microservices/containers', label: 'Containers & Kubernetes' }}
      next={{ path: '/microservices/migration', label: 'Migration & Decomposition' }}
    >
      <p>
        Everything from the last lesson carries straight over. Pods, Deployments, Services,
        ConfigMaps, Secrets, <code>kubectl</code>, health probes — none of that gets thrown out or
        replaced here. <strong>Red Hat OpenShift is not a different platform you learn from
        scratch — it is Kubernetes.</strong> This lesson is deliberately not a second Kubernetes
        primer; it is &quot;here is what Red Hat bolts onto the Kubernetes you already know, and
        why anyone bothers.&quot;
      </p>

      <h2>What OpenShift Actually Is</h2>
      <p>
        Under the hood, an OpenShift cluster runs the same upstream Kubernetes API server, etcd,
        scheduler, and controller manager described in the last lesson. Point plain{' '}
        <code>kubectl</code> at an OpenShift cluster and <code>kubectl get pods</code> works
        exactly like it does on EKS, GKE, or a bare-metal cluster you built yourself — because it
        <em> is</em> the same API.
      </p>
      <p>
        What OpenShift adds is a <em>distribution</em>: upstream Kubernetes plus an opinionated
        bundle of software Red Hat builds, tests, certifies, and puts a support contract behind.
        It is not a fork of Kubernetes and not a competitor to it — closer to &quot;Kubernetes,
        except someone already made a pile of the decisions for you and will answer the phone when
        it breaks.&quot;
      </p>

      <table>
        <thead>
          <tr>
            <th>Red Hat adds</th>
            <th>What it is</th>
            <th>How it relates to plain Kubernetes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Web console</strong></td>
            <td>A full browser UI for the cluster</td>
            <td>Vanilla Kubernetes ships no UI at all — you&apos;d bolt on the separate Kubernetes Dashboard project yourself.</td>
          </tr>
          <tr>
            <td><strong>Integrated registry</strong></td>
            <td>A container image registry running inside the cluster</td>
            <td>Vanilla Kubernetes assumes you bring your own (Docker Hub, ECR, GCR, Harbor…).</td>
          </tr>
          <tr>
            <td><strong>Route</strong></td>
            <td>OpenShift&apos;s own object for exposing a Service externally</td>
            <td>Predates widespread Ingress adoption and still ships alongside it — functionally similar goal, OpenShift-specific object.</td>
          </tr>
          <tr>
            <td><strong>BuildConfig + OpenShift Pipelines</strong></td>
            <td>Built-in CI/CD — build images from source, run pipelines</td>
            <td>Pipelines is Red Hat&apos;s productized packaging of the open-source Tekton project. Plain Kubernetes has no built-in CI/CD story.</td>
          </tr>
          <tr>
            <td><strong>Security Context Constraints (SCC)</strong></td>
            <td>Cluster-enforced rules on what a pod is allowed to do</td>
            <td>Stricter than vanilla Kubernetes defaults — e.g. containers do <strong>not</strong> run as root by default, unlike many plain-Kubernetes setups.</td>
          </tr>
          <tr>
            <td><strong>Operators / OperatorHub</strong></td>
            <td>Packaged, self-managing installs of complex software (databases, message queues, monitoring stacks…)</td>
            <td>The Operator Framework and OperatorHub originated from Red Hat&apos;s work here, then went upstream — most Kubernetes distributions support Operators today.</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="OpenShift = Upstream Kubernetes + Red Hat's Layer on Top"
        chart={"graph TD\n  subgraph New[\"Red Hat's Layer — new in this lesson\"]\n    Console[Web Console]\n    Registry[Integrated Image Registry]\n    Route[Route object - external access]\n    BC[BuildConfig + OpenShift Pipelines]\n    SCC[Security Context Constraints]\n    OP[Operators / OperatorHub]\n  end\n  subgraph Known[\"Upstream Kubernetes - from the last lesson\"]\n    API[API Server] --> ETCD[(etcd)]\n    API --> SCHED[Scheduler]\n    API --> CM[Controller Manager]\n    API --> KUBELET[Kubelet]\n    KUBELET --> CRIO[CRI-O Runtime]\n  end\n  New -.->|calls the same API, adds objects on top| Known\n  style Console fill:#5b9cf6,color:#fff\n  style Registry fill:#5b9cf6,color:#fff\n  style Route fill:#5b9cf6,color:#fff\n  style BC fill:#5b9cf6,color:#fff\n  style SCC fill:#5b9cf6,color:#fff\n  style OP fill:#5b9cf6,color:#fff\n  style API fill:#10b981,color:#fff\n  style ETCD fill:#10b981,color:#fff\n  style SCHED fill:#10b981,color:#fff\n  style CM fill:#10b981,color:#fff\n  style KUBELET fill:#10b981,color:#fff\n  style CRIO fill:#10b981,color:#fff"}
      />

      <InfoBox variant="info" title="Blue = New This Lesson, Green = Already Yours">
        Everything in green is exactly what the last lesson covered — same API server, same etcd,
        same kubelet. Everything in blue is what OpenShift adds on top. Nothing in blue replaces
        anything in green.
      </InfoBox>

      <h2>Wait — Isn&apos;t OpenShift Built on Docker?</h2>
      <p>
        Historically, yes — and this is a &quot;changed over time&quot; fact worth being precise
        about rather than repeating from memory, so the history below was checked directly against
        Red Hat&apos;s own engineering blog and the Kubernetes project&apos;s dockershim
        announcement rather than assumed.
      </p>
      <p>
        Early OpenShift (the 3.x line) used the Docker Engine as its container runtime, same as
        most of the Kubernetes world at the time. Starting with <strong>OpenShift 4</strong>{' '}
        (Red Hat made this the default in mid-2019), OpenShift switched to{' '}
        <strong>CRI-O</strong> — a lean, Red-Hat-led container runtime built specifically to
        implement Kubernetes&apos; Container Runtime Interface, with no Docker daemon involved.
        This wasn&apos;t OpenShift going its own way: the entire Kubernetes ecosystem followed the
        same path. Docker-the-runtime was formally deprecated for Kubernetes in December 2020 and
        the compatibility shim (dockershim) that let Docker keep working was removed outright in
        Kubernetes 1.24 (2022). Today the only container runtimes Kubernetes supports are ones that
        implement CRI directly — CRI-O and containerd being the two in wide use.
      </p>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>OpenShift 3.x (pre-2019)</th>
            <th>OpenShift 4.x (today)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Container runtime on nodes</td>
            <td>Docker Engine</td>
            <td>CRI-O</td>
          </tr>
          <tr>
            <td>Image format</td>
            <td>Docker/OCI</td>
            <td>OCI (unchanged)</td>
          </tr>
          <tr>
            <td>Do you still write a <code>Dockerfile</code>?</td>
            <td>Yes</td>
            <td>Yes</td>
          </tr>
          <tr>
            <td>Does the Docker daemon run anything in production?</td>
            <td>Yes</td>
            <td>No</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="note" title="The Confusion This Clears Up">
        <p>
          &quot;Built with a <code>Dockerfile</code>&quot; and &quot;run by the Docker
          daemon&quot; are two different things, and OpenShift is the proof. A{' '}
          <code>Dockerfile</code> is just a recipe for producing a standard{' '}
          <strong>OCI-format image</strong> — the format is an open spec, not a Docker-exclusive
          one. CRI-O runs standard OCI images directly, no Docker involved. So you keep writing
          <code>Dockerfile</code>s and running <code>docker build</code> on your laptop exactly as
          before; what changed is only what happens to that image once it&apos;s deployed —
          nothing in production is asking the Docker daemon to run your container anymore.
        </p>
      </InfoBox>

      <h2>The Web Console — What It Looks Like</h2>

      <InfoBox variant="note" title="Illustrative Layout, Not a Screenshot">
        <p>
          There is no real screenshot below — this environment can&apos;t capture one, and a
          fabricated image would be worse than none. What follows instead is a plain,
          clearly-labeled <strong>boxes-and-labels diagram</strong> of the console&apos;s layout,
          built from styled boxes rather than actual UI. The section names in the sidebar (Home,
          Operators, Workloads, Networking, Storage, Builds, Observe, Compute, User Management,
          Administration) are real and were checked against Red Hat&apos;s OpenShift Container
          Platform web console documentation and search results describing the current
          Administrator-perspective navigation, not invented for this diagram. Exact spacing,
          colors, and icons are approximations. Also worth knowing: Red Hat began rolling out a
          <em> unified</em> console in OpenShift 4.19 (mid-2025) that merges what used to be
          separate &quot;Administrator&quot; and &quot;Developer&quot; views into one, so a cluster
          you actually log into may look somewhat different from this depending on its version.
        </p>
      </InfoBox>

      <div style={{
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        overflow: 'hidden',
        margin: '1.5rem 0',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* top masthead bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          padding: '0.65rem 1rem',
          fontSize: '0.8rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            <span role="img" aria-label="OpenShift">🔴</span> Red Hat OpenShift
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)' }}>
            <span>Project: order-system ▾</span>
            <span>👤 jane@company.com</span>
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          {/* left sidebar nav */}
          <div style={{
            width: '190px',
            flexShrink: 0,
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border-color)',
            padding: '0.75rem 0',
            fontSize: '0.8rem',
          }}>
            {[
              { label: 'Home', active: false },
              { label: 'Operators', active: false },
              { label: 'Workloads', active: true },
              { label: 'Networking', active: false },
              { label: 'Storage', active: false },
              { label: 'Builds', active: false },
              { label: 'Pipelines *', active: false },
              { label: 'Observe', active: false },
              { label: 'Compute', active: false },
              { label: 'User Management', active: false },
              { label: 'Administration', active: false },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '0.5rem 1rem',
                  color: item.active ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  background: item.active ? 'var(--bg-active)' : 'transparent',
                  borderLeft: item.active ? '3px solid var(--accent-blue)' : '3px solid transparent',
                  fontWeight: item.active ? 600 : 400,
                }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* main content area */}
          <div style={{ flex: 1, padding: '1.25rem', background: 'var(--bg-card)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Workloads &gt; Pods
            </div>
            <table style={{ fontSize: '0.8rem', width: '100%' }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Restarts</th>
                  <th>Age</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>order-service-7d9f8-x2k4p</td>
                  <td style={{ color: 'var(--accent-green)' }}>Running</td>
                  <td>0</td>
                  <td>2h</td>
                </tr>
                <tr>
                  <td>order-service-7d9f8-m9j1q</td>
                  <td style={{ color: 'var(--accent-green)' }}>Running</td>
                  <td>0</td>
                  <td>2h</td>
                </tr>
                <tr>
                  <td>payment-service-5c7b2-a1f3d</td>
                  <td style={{ color: 'var(--accent-green)' }}>Running</td>
                  <td>1</td>
                  <td>5h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
        * <strong>Pipelines</strong> only shows up in the nav once the OpenShift Pipelines
        (Tekton) Operator is installed on the cluster — it isn&apos;t there out of the box the way
        Workloads or Networking are.
      </p>

      <p>
        None of this is unfamiliar in substance — that &quot;Pods&quot; table under Workloads is
        showing exactly the objects the last lesson covered. The console is a window onto the same
        API server; every action it takes is something <code>kubectl</code> (or its OpenShift
        counterpart, <code>oc</code>) could do too.
      </p>

      <h2>Why Reach for OpenShift Over Plain Kubernetes?</h2>
      <p>
        Plain Kubernetes here means self-managed clusters, or the managed flavors — EKS, GKE, AKS.
        The honest answer is a trade-off, not a sales pitch:
      </p>

      <table>
        <thead>
          <tr>
            <th>You get</th>
            <th>It costs you</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>A curated, tested, Red-Hat-supported bundle instead of assembling your own from a dozen open-source projects</td>
            <td>More opinionated and heavier than raw Kubernetes — you inherit Red Hat&apos;s decisions, not just Kubernetes&apos;</td>
          </tr>
          <tr>
            <td>Certified Operators via OperatorHub for complex software (databases, messaging, monitoring)</td>
            <td>A real licensing / support cost on top of the infrastructure itself</td>
          </tr>
          <tr>
            <td>One consistent experience across on-prem, cloud, and hybrid — same console, same <code>oc</code>, same SCCs everywhere</td>
            <td>Friction the moment you need something OpenShift&apos;s defaults actively restrict</td>
          </tr>
          <tr>
            <td>A genuinely nicer out-of-the-box developer experience — console, built-in CI/CD, <code>oc new-app</code> for a fast path to a running deployment</td>
            <td>A learning curve for OpenShift-specific objects (Route, BuildConfig) layered on top of the Kubernetes objects you already know</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="warning" title="The SCC Surprise">
        <p>
          The stricter <strong>Security Context Constraints</strong> are the single most common
          &quot;why won&apos;t this just work&quot; moment for people arriving from plain
          Kubernetes. A Helm chart that runs a container as root, binds to a low port, or mounts a
          hostPath — all things vanilla Kubernetes&apos; permissive defaults quietly allow — gets
          rejected outright on OpenShift, because the default SCC forbids it. It isn&apos;t a bug
          in OpenShift or in the chart; it&apos;s OpenShift enforcing a safer baseline than
          Kubernetes ships with. The fix is almost never &quot;disable the SCC&quot; — it&apos;s
          adjusting the workload (or requesting a more permissive SCC be assigned) to run the way
          OpenShift expects: non-root, with an assigned UID range.
        </p>
      </InfoBox>

      <p>
        In practice this shows up most in <strong>regulated, enterprise environments</strong> —
        government, healthcare, finance — where a support contract and a hardened-by-default
        posture matter more than raw flexibility, and in <strong>hybrid / on-prem-plus-cloud</strong>{' '}
        shops that want one platform that behaves identically no matter where the cluster
        physically runs.
      </p>

      <h2>Minimum Commands to Actually Use It</h2>
      <p>
        The CLI is <code>oc</code> — a superset of <code>kubectl</code>. Every{' '}
        <code>kubectl</code> command you already know works with <code>oc</code> unchanged
        (<code>oc get pods</code> behaves exactly like <code>kubectl get pods</code>); <code>oc</code>{' '}
        just adds OpenShift-specific commands on top. Here is enough to go from nothing to a
        running, externally-reachable app.
      </p>

      <CodeBlock language="bash" title="oc — the practical minimum">
{`# Authenticate against the cluster
oc login https://api.cluster.example.com:6443

# Create an isolated project (OpenShift's layer over a Namespace)
oc new-project order-system

# The fast path: point at a git repo or an existing image and OpenShift
# builds AND deploys it in one step — no Dockerfile, Deployment, or
# Service YAML required to get something running
oc new-app https://github.com/example-org/order-service.git
oc new-app --image=myregistry/order-service:v1.2.3

# Same mental model as 'kubectl get' — because it IS kubectl get
oc get pods
oc get deployments

# OpenShift-specific: list Routes (the external-access objects)
oc get routes

# Create a Route for an existing Service in one command
oc expose service order-service`}
      </CodeBlock>

      <InfoBox variant="tip" title="oc new-app Is a Shortcut, Not Magic">
        <code>oc new-app</code> is doing the same things you&apos;d otherwise write by hand — a
        Build to produce an image, a Deployment (technically a DeploymentConfig or Deployment
        depending on version) to run it, and a Service in front of it. It&apos;s a fast path for
        getting something running to iterate against, not a replacement for writing real manifests
        once the application matters.
      </InfoBox>

      <InteractiveChallenge
        question={"A teammate says: \"We can't use OpenShift, we're a Docker shop and OpenShift doesn't support Docker.\" What's the most accurate response?"}
        options={[
          'They’re right — OpenShift requires you to rewrite every Dockerfile into a different format',
          'OpenShift still runs the images your Dockerfiles produce (standard OCI format) — it just doesn’t use the Docker daemon to run them in production; that’s CRI-O, which the whole Kubernetes ecosystem moved to',
          'OpenShift is a competing product to Docker and the two are mutually exclusive by design',
          'OpenShift only supports images built with Podman, never Docker'
        ]}
        correctIndex={1}
        explanation={"\"Built with a Dockerfile\" and \"run by the Docker daemon\" are different things. A Dockerfile produces a standard OCI-format image, and CRI-O (OpenShift's runtime since OpenShift 4, following the same dockershim-removal path as the rest of Kubernetes) runs that image directly — no Docker daemon involved, and no changes needed to how you build images."}
      />

      <InteractiveChallenge
        question={"A Helm chart that works fine on your local Minikube cluster fails to deploy on your company's OpenShift cluster with a permissions error, even though nothing in the chart changed. What's the most likely cause?"}
        options={[
          'OpenShift doesn’t support Helm charts at all',
          'The chart is corrupted and needs to be re-downloaded',
          'OpenShift’s default Security Context Constraints are stricter than Kubernetes’ defaults — e.g. the chart assumes it can run as root, which OpenShift blocks by default',
          'OpenShift requires all workloads to be defined as BuildConfigs instead of Helm charts'
        ]}
        correctIndex={2}
        explanation={"This is the single most common surprise moving from plain Kubernetes to OpenShift. Vanilla Kubernetes' permissive defaults let a lot of charts get away with running as root or requesting privileges they don't need. OpenShift's default Security Context Constraints (SCCs) are stricter and reject that out of the box — it's enforcement of a safer baseline, not a bug, and the fix is adjusting the workload to run non-root rather than disabling the SCC."}
      />

      <h2>Where OpenShift Sits in the Market</h2>
      <p>
        OpenShift is one option among several &quot;give me a Kubernetes platform, not just raw
        Kubernetes&quot; products — it competes with <strong>Rancher</strong> and{' '}
        <strong>VMware Tanzu</strong> as a self-managed / hybrid distribution, and, less directly,
        with the managed cloud offerings — <strong>EKS, GKE, AKS</strong> — for teams deciding
        between &quot;managed Kubernetes from your cloud provider&quot; and &quot;a full platform
        you can run anywhere.&quot; None of these are drop-in equivalents of each other — the
        right pick depends on whether you need multi-cloud/on-prem consistency, how much you value
        a vendor support contract, and how much of the &quot;batteries included&quot; layer (CI/CD,
        registry, console) you actually want versus assembling yourself. That comparison is a
        deeper topic on its own — the point here is just knowing OpenShift isn&apos;t the only name
        in this space.
      </p>

      <h2>Summary</h2>

      <InfoBox variant="success" title="Key Takeaways">
        <ul>
          <li>OpenShift is Red Hat&apos;s Kubernetes distribution — not a fork, not a competitor. Plain <code>kubectl</code> works against it because it&apos;s the same Kubernetes API underneath.</li>
          <li>Red Hat&apos;s additions: web console, integrated registry, Route objects, BuildConfig/OpenShift Pipelines (Tekton-based CI/CD), stricter Security Context Constraints, and Operators/OperatorHub.</li>
          <li>OpenShift moved from Docker Engine to CRI-O as its runtime starting with OpenShift 4 (2019), following the same path the whole Kubernetes ecosystem took when dockershim was removed in Kubernetes 1.24 (2022) — but <code>Dockerfile</code>s and OCI images work exactly the same either way.</li>
          <li>The trade-off for choosing OpenShift over plain Kubernetes: a supported, curated, consistent platform and a nicer default developer experience, versus more opinionation, real licensing cost, and SCC-driven friction with workloads that assume root.</li>
          <li><code>oc</code> is a superset of <code>kubectl</code> — <code>oc login</code>, <code>oc new-project</code>, <code>oc new-app</code>, <code>oc get pods</code>/<code>routes</code>, and <code>oc expose service</code> cover most day-to-day use.</li>
          <li>OpenShift competes with Rancher, VMware Tanzu, and the managed cloud offerings (EKS/GKE/AKS) as one option among several for &quot;a Kubernetes platform, not just raw Kubernetes.&quot;</li>
        </ul>
      </InfoBox>
    </LessonLayout>
  );
}
