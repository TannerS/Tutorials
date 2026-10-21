import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Deploy() {
  return (
    <LessonLayout
      title="Project Layout, Build & Deploy"
      sectionId="go"
      lessonIndex={17}
      prev={{ path: '/go/database', label: 'Database Access Without an ORM' }}
      next={{ path: '/go/mini-guide', label: '🧩 Go Mini Guide' }}
    >
      <p>
        This is where Go's deployment story diverges most sharply from Node, and it is probably
        the reason your team is considering it. A Node service deploys as source plus a{' '}
        <code>node_modules</code> tree plus a runtime. A Go service deploys as{' '}
        <strong>one file</strong>.
      </p>

      <h2>Project Layout — Less Settled Than You Will Read</h2>

      <p>
        Search for Go project structure and you will find{' '}
        <code>golang-standards/project-layout</code> presented as canonical.{' '}
        <strong>It is not official.</strong> It is a community repository, the Go team has never
        endorsed it, and prominent Go developers actively argue against adopting it wholesale for
        small services. Treat it as one opinion.
      </p>

      <p>
        What <em>is</em> real is a small number of directory names the toolchain actually
        understands:
      </p>

      <CodeBlock language="text" title="The parts with real meaning">
{`myservice/
├── go.mod
├── cmd/                  convention, not enforced: one dir per binary
│   ├── api/main.go           → builds 'api'
│   └── worker/main.go        → builds 'worker'
├── internal/             COMPILER-ENFORCED. Importable only from within
│   ├── user/                 this module. No external package can import it,
│   └── billing/              no matter what path they write.
├── pkg/                  convention only, and contested — it means
│                             "deliberately public". Many projects skip it.
└── migrations/`}
      </CodeBlock>

      <InfoBox variant="tip" title="internal/ has no npm equivalent, and it is genuinely useful">
        <code>internal/</code> is a compiler rule, not a naming convention. A package under{' '}
        <code>internal/</code> can only be imported by code rooted at its parent directory —
        anything outside the module gets a compile error. npm has nothing like this: once you
        publish, every file you shipped is importable, and <code>"private"</code> fields are
        documentation at best. If you are unsure where something goes, put it in{' '}
        <code>internal/</code>; you can always promote it later, whereas making a public API
        private is a breaking change.
      </InfoBox>

      <p>
        For a small service, a flat layout with a few packages at the root is perfectly idiomatic
        Go and easier to navigate. Reach for <code>cmd/</code> when you genuinely build more than
        one binary.
      </p>

      <h2>The Binary</h2>

      <CodeBlock language="bash" title="Build, then shrink and stamp">
{`go build -o app .

# -s -w strip the symbol table and DWARF debug info
# -X injects a value into a package variable at link time
go build -ldflags="-s -w -X main.version=1.4.2" -o app-small .`}
      </CodeBlock>

      <CodeBlock language="text" title="Real sizes — a small HTTP service, Go 1.25.5">
{`app:        5.1M      default build
app-small:  3.5M      with -s -w`}
      </CodeBlock>

      <p>
        That 3.5 MB contains the HTTP server, the JSON encoder, the structured logger, the
        garbage collector and the scheduler. There is no runtime to install alongside it and no
        dependency tree to resolve at deploy time. The equivalent Node deployment is your source
        plus a <code>node_modules</code> directory that is routinely larger than this on its own,
        plus a Node runtime.
      </p>

      <p>
        The <code>-X</code> flag is how version stamping is done — no build-time codegen, no
        writing a generated file:
      </p>

      <CodeBlock language="go" title="Receiving the stamped value">
{`package main

var version = "dev"   // overwritten at link time by -X main.version=1.4.2

func main() {
	slog.Info("starting", "version", version)
}`}
      </CodeBlock>

      <h2>Cross-Compilation</h2>

      <p>
        This is the capability with no Node analogue at all. Two environment variables build for
        any supported platform, from any platform, with nothing extra installed. All three of
        these were built on an Apple Silicon Mac:
      </p>

      <CodeBlock language="bash" title="One machine, three targets">
{`GOOS=linux   GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o x-linux-amd64 .
GOOS=linux   GOARCH=arm64 CGO_ENABLED=0 go build -ldflags="-s -w" -o x-linux-arm64 .
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o x-win.exe .`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output, including file(1) confirming the formats">
{`  linux/amd64   3.6M
  linux/arm64   3.5M
  windows/amd64 3.8M

x-linux-amd64: ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked
x-win.exe:     PE32+ executable (console) x86-64, for MS Windows`}
      </CodeBlock>

      <p>
        Genuine ELF and PE binaries, produced on macOS, in about a second each. No Docker, no
        cross-toolchain, no CI matrix required just to produce artifacts.
      </p>

      <InfoBox variant="warning" title="CGO_ENABLED=0 is doing real work there">
        Cgo links against the host's C library, which both breaks cross-compilation and produces
        a <em>dynamically</em> linked binary that will fail on a minimal container with a
        missing-shared-library error. Setting <code>CGO_ENABLED=0</code> forces pure-Go
        implementations and a truly static binary. The common things that pull in cgo are the{' '}
        <code>mattn/go-sqlite3</code> driver and some DNS paths in <code>net</code>; pure-Go
        alternatives exist for both. If a container that built fine dies on startup complaining
        about <code>libc</code>, this is why.
      </InfoBox>

      <h2>Containers: Multi-Stage to scratch</h2>

      <p>
        Because the binary is static and self-contained, the final image can contain{' '}
        <em>nothing else</em>:
      </p>

      <CodeBlock language="dockerfile" title="Build stage, then an empty final image">
{`# ---- build ----
FROM golang:1.25 AS build
WORKDIR /src

# Copy manifests first so dependency download caches independently of source.
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w -X main.version=\${VERSION}" -o /app ./cmd/api

# ---- runtime ----
FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]`}
      </CodeBlock>

      <FlowChart
        title="What Ends Up in the Image"
        chart={
          'graph LR\n' +
          '  SRC["source + go.mod"] --> B["golang:1.25 build stage<br/>~850MB, discarded"]\n' +
          '  B -->|"COPY --from=build"| F["final image<br/>static binary only"]\n' +
          '  N["typical Node image<br/>runtime + node_modules"] -.->|"for contrast"| F\n' +
          '  style B fill:#3b1a1a,stroke:#f87171\n' +
          '  style F fill:#1a3329,stroke:#4ade80\n' +
          '  style N fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        The build stage is large and thrown away; only the binary crosses into the final image.
        The practical result is an image a few megabytes in size against a typical Node image's
        hundreds — and far more importantly, an image with{' '}
        <strong>no shell, no package manager, and no OS libraries</strong>, which removes most of
        what a CVE scanner would otherwise flag.
      </p>

      <InfoBox variant="note" title="distroless/static over scratch, usually">
        <code>scratch</code> is genuinely empty, which means no CA certificates (every HTTPS call
        fails), no timezone database, and no <code>/etc/passwd</code> for a non-root user.{' '}
        <code>gcr.io/distroless/static</code> adds exactly those three things and nothing else.
        If you do use <code>scratch</code> and your service makes outbound TLS calls, you must{' '}
        <code>COPY --from=build /etc/ssl/certs/ca-certificates.crt</code> yourself — a failure
        that looks like a mysterious x509 error at runtime.
      </InfoBox>

      <h2>Configuration and Logging</h2>

      <CodeBlock language="go" title="Env vars, with a required-value helper">
{`func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("required env var %s is not set", key)   // fail at startup
	}
	return v
}

cfg := Config{
	DatabaseURL: mustEnv("DATABASE_URL"),
	Port:        cmp.Or(os.Getenv("PORT"), "8080"),   // Go 1.22+ : first non-zero
}`}
      </CodeBlock>

      <p>
        Fail loudly at startup for anything required. A service that boots with a missing config
        value and fails on the first request is far harder to diagnose than one that refuses to
        start.
      </p>

      <p>
        For logging, <code>log/slog</code> has been in the standard library since Go 1.21, so
        structured logging no longer needs a dependency:
      </p>

      <CodeBlock language="go" title="Structured logging, stdlib">
{`slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
slog.Info("starting", "version", version, "port", 8080)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`{"time":"2026-10-10T23:14:52.421263-05:00","level":"INFO","msg":"starting","version":"dev","port":8080}`}
      </CodeBlock>

      <p>
        Swap <code>NewJSONHandler</code> for <code>NewTextHandler</code> in development. Log to
        stdout and let the platform handle collection — the twelve-factor rule applies here
        exactly as it does in Node.
      </p>

      <h2>Profiling Is Built In</h2>

      <CodeBlock language="go" title="Import for side effect, on a private port">
{`import _ "net/http/pprof"   // registers handlers on DefaultServeMux

// Expose on a SEPARATE internal listener — never on your public mux.
go func() { log.Println(http.ListenAndServe("localhost:6060", nil)) }()`}
      </CodeBlock>

      <CodeBlock language="bash" title="Then point the tool at a live process">
{`go tool pprof http://localhost:6060/debug/pprof/heap        # memory
go tool pprof http://localhost:6060/debug/pprof/profile     # 30s CPU
curl http://localhost:6060/debug/pprof/goroutine?debug=1    # goroutine leaks`}
      </CodeBlock>

      <p>
        That last one is the tool referenced back in{' '}
        <a href="/go/concurrency-patterns">Concurrency Patterns &amp; Failure Modes</a> — it
        prints every live goroutine grouped by stack, which usually identifies a leak on sight.
      </p>

      <InfoBox variant="danger" title="pprof on a public port is a vulnerability">
        The blank import registers handlers on <code>http.DefaultServeMux</code>. If your public
        server also uses <code>DefaultServeMux</code>, you have just exposed heap dumps and full
        goroutine stacks to the internet. Always serve your application from an explicit{' '}
        <code>http.NewServeMux()</code> — as{' '}
        <a href="/go/http">HTTP Services with net/http</a> does — and keep pprof on a separate
        internal listener.
      </InfoBox>

      <h2>Key Takeaways</h2>

      <p>
        <strong><code>golang-standards/project-layout</code> is not official</strong> — a flat
        layout is fine for a small service, and <code>internal/</code> is the one directory with
        real compiler-enforced meaning. <strong>The deploy artifact is a single static
        binary</strong>, ~3.5 MB stripped, with no runtime to install.{' '}
        <strong>Cross-compile with <code>GOOS</code>/<code>GOARCH</code></strong> from any machine
        to any target, and set <code>CGO_ENABLED=0</code> so the result is genuinely static.{' '}
        <strong>Multi-stage Docker to distroless</strong> yields an image with no shell and no
        package manager — a few MB instead of hundreds, and a much smaller attack surface.{' '}
        <strong><code>log/slog</code> is stdlib</strong>, so structured logging needs no
        dependency. And <strong>keep <code>pprof</code> on a private port</strong> — the
        profiling is excellent and free, but the blank import publishes it wherever{' '}
        <code>DefaultServeMux</code> is served.
      </p>

      <h2>That Is the Section</h2>
      <p>
        Eighteen lessons in one arc. <a href="/go/setup">Setup</a> and{' '}
        <a href="/go/syntax">syntax</a> got you compiling;{' '}
        <a href="/go/pointers">value semantics</a> gave you the rule that{' '}
        <a href="/go/structs">structs</a> and <a href="/go/interfaces">interfaces</a> both rest on;{' '}
        <a href="/go/errors">errors</a>, <a href="/go/slices">slices and maps</a> and{' '}
        <a href="/go/generics">generics</a> finished the type system. Then five lessons on{' '}
        <a href="/go/goroutines">concurrency</a>, which is the part that does not transfer from
        Node. Then <a href="/go/testing">testing</a>, <a href="/go/http">HTTP</a>,{' '}
        <a href="/go/database">databases</a> and this — a real service, with no framework in it.
      </p>
      <p>
        Two pages left, neither a lesson. The{' '}
        <strong><a href="/go/mini-guide">Mini Guide</a></strong> is the whole section compressed
        into one linear read: useful as revision, and the page to hand someone who wants to write a
        little Go this afternoon. The <strong><a href="/go/cheatsheet">Field Guide</a></strong> is
        the lookup table for when you know what you want and need the syntax or the flag.
      </p>
      <p>
        One habit to carry out of all of it: <strong>put <code>go vet ./...</code> and{' '}
        <code>go test -race ./...</code> in CI on day one.</strong> Between them they catch the
        loop-variable bug, the lost <code>cancel()</code>, the unguarded map and the timing
        decorator that silently measures nothing — four failures from four different lessons, none
        of which the compiler will mention.
      </p>
    </LessonLayout>
  );
}
