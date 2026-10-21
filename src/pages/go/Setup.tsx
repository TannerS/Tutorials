import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const cellStyle = { padding: '0.75rem' } as const;
const rowStyle = { borderBottom: '1px solid var(--border-color)' } as const;
const headStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  color: 'var(--accent-amber)',
};

function Setup() {
  return (
    <LessonLayout
      title="Setup, Modules & the Toolchain"
      sectionId="go"
      lessonIndex={1}
      prev={{ path: '/go/intro', label: 'Go From a Node Backend: What Changes' }}
      next={{ path: '/go/syntax', label: 'Syntax, Types & Zero Values' }}
    >
      <p>
        In a Node project, &quot;the toolchain&quot; is a committee: npm or pnpm for dependencies,
        tsc for types, esbuild or swc or Vite for bundling, Prettier for formatting, ESLint for
        linting, Jest or Vitest for tests, and a <code>devDependencies</code> block holding all of
        them at versions you have to keep mutually compatible. Each one has a config file. Several
        of them have plugins for the others.
      </p>
      <p>
        In Go, all of that is subcommands of one binary that shipped with the compiler. There is no
        bundler because there is nothing to bundle. There is no separate type checker because the
        compiler is the type checker. There is no formatter config because there are no formatter
        options. This lesson is mostly about what that buys you and the two or three places where
        Go&apos;s model will genuinely surprise you — the <code>/v2</code> import path suffix being
        the big one.
      </p>

      <InfoBox variant="tip" title="This is the longest lesson in the section — read it in two passes">
        <p>
          It is a reference as much as a lesson, and reading it end to end before you have written
          any Go is the wrong order. On the first pass read <strong>Installing It</strong>,{' '}
          <strong>go.mod and go.sum</strong>, <strong>go build vs go run vs go install</strong> and{' '}
          <strong>The Commands You Will Actually Type</strong>. That is everything needed to build
          and run something — then go on to <a href="/go/syntax">Syntax</a>.
        </p>
        <p style={{ marginBottom: 0 }}>
          Come back for the rest when it bites. The <code>/v2</code> import-path suffix,
          cross-compilation and <code>go.work</code> are each the answer to one specific confusing
          afternoon and are much easier to absorb once you have had it — and{' '}
          <strong>GOPATH</strong> you can skip outright, which that section says itself.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="Versions, and what was actually run">
        <p>
          Go <strong>1.27.3</strong> is the current stable release. The locally installed toolchain
          on this machine is <strong>go1.25.5 darwin/arm64</strong>, and unless an output block says
          otherwise, that is what produced it. Two blocks in this lesson genuinely were produced by{' '}
          <strong>go1.27.2</strong> and <strong>go1.26.9</strong> — not because a second compiler was
          installed by hand, but because Go&apos;s toolchain switching fetched them automatically.
          That mechanism is the subject of its own section below, and those blocks are labelled with
          the version that actually printed them.
        </p>
      </InfoBox>

      <h2>Installing It</h2>
      <p>
        Three options, in descending order of how much I would recommend them:
      </p>
      <ul>
        <li>
          <strong>The official package from go.dev/dl</strong> — a <code>.pkg</code> on macOS, an{' '}
          <code>.msi</code> on Windows, a tarball you extract to <code>/usr/local/go</code> on
          Linux. This is what is on this machine.
        </li>
        <li>
          <strong>Your OS package manager</strong> — <code>brew install go</code>,{' '}
          <code>apt install golang-go</code>, <code>dnf install golang</code>. Fine, with the
          caveat that distro packages lag and occasionally split the standard library into a
          separate package.
        </li>
        <li>
          <strong>In CI, the official action/image</strong> —{' '}
          <code>actions/setup-go</code> or a <code>golang:1.25</code> container. Never hand-roll a
          Go install in a Dockerfile.
        </li>
      </ul>
      <p>Verify it, and look at what you actually got:</p>

      <CodeBlock language="bash" title="Terminal">
{`command -v go
go env GOROOT
ls $(go env GOROOT) | column -c 80
du -sh $(go env GOROOT)
cat $(go env GOROOT)/VERSION`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64, official .pkg install">
{`/usr/local/go/bin/go
/usr/local/go
CONTRIBUTING.md	SECURITY.md	codereview.cfg	misc
LICENSE		VERSION		doc		pkg
PATENTS		api		go.env		src
README.md	bin		lib		test
233M	/usr/local/go
go1.25.5
time 2025-11-26T02:01:51Z`}
      </CodeBlock>

      <p>
        <code>GOROOT</code> is where the toolchain lives. You never set it; the <code>go</code>{' '}
        binary knows where it is relative to itself. Two directories in there matter to you:
      </p>
      <ul>
        <li>
          <code>src/</code> — the <em>entire standard library, as readable Go source</em>. 7,343{' '}
          <code>.go</code> files on this install. This is why <code>go doc</code> works offline and
          why &quot;read the standard library&quot; is normal advice in Go rather than an
          aspiration: <code>net/http</code> is a directory on your disk written in the same language
          you are writing.
        </li>
        <li>
          <code>go.env</code> — the shipped defaults, which is worth seeing because it is only three
          settings:
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — cat $(go env GOROOT)/go.env, go1.25.5">
{`# This file contains the initial defaults for go command configuration.
# Values set by 'go env -w' and written to the user's go/env file override these.
# The environment overrides everything else.

# Use the Go module mirror and checksum database by default.
# See https://proxy.golang.org for details.
GOPROXY=https://proxy.golang.org,direct
GOSUMDB=sum.golang.org

# Automatically download newer toolchains as directed by go.mod files.
# See https://go.dev/doc/toolchain for details.
GOTOOLCHAIN=auto`}
      </CodeBlock>

      <InfoBox variant="tip" title="There is no nvm, and you do not need one">
        <p>
          The first thing a Node developer looks for is the version manager, because in Node your
          project&apos;s required runtime version and your installed runtime version are two
          different facts that you reconcile with <code>nvm</code> and an <code>.nvmrc</code>.
        </p>
        <p>
          Go folded that into the toolchain itself. Your <code>go.mod</code> states the Go version
          the module needs, and the <code>go</code> command will fetch and use that version if yours
          is older — same machine, no version manager, no shell hooks, per-project and automatic.
          There is a <code>g</code> and a <code>gvm</code> out there; you will not need either.{' '}
          <a href="#toolchain">Demonstrated below</a>, with the output to prove it.
        </p>
      </InfoBox>

      <h2>GOPATH: A Historical Artifact You Can Stop Reading About</h2>
      <p>
        If you have googled anything about Go, you have hit a 2016 blog post telling you that your
        code must live in <code>$GOPATH/src/github.com/you/project</code>. Ignore it completely. But
        it is worth understanding what it <em>was</em>, because the error messages from that era
        still exist and you will see one eventually.
      </p>
      <p>
        Before Go 1.11, there were no modules. There was one global workspace rooted at{' '}
        <code>GOPATH</code>, and an import path was a <em>path into that directory tree</em>.{' '}
        <code>import &quot;github.com/google/uuid&quot;</code> meant &quot;the directory{' '}
        <code>$GOPATH/src/github.com/google/uuid</code>.&quot; Consequences, all bad:
      </p>
      <ul>
        <li>Your project could not live wherever you wanted. It had to live at its import path.</li>
        <li>
          There were no versions. <code>go get</code> cloned a repo&apos;s default branch into that
          directory. Everything on the machine shared the one checkout, so two projects could not
          want two different versions of a library.
        </li>
        <li>
          Reproducible builds required a third-party tool — <code>godep</code>, then{' '}
          <code>glide</code>, then <code>dep</code> — and a vendored copy of everything.
        </li>
      </ul>
      <p>
        You can still see the old resolver if you force it. <code>GO111MODULE=off</code> drops the{' '}
        <code>go</code> command back into GOPATH mode, and the error is the one that generated a
        decade of Stack Overflow questions:
      </p>

      <CodeBlock language="bash" title="Terminal — a directory with a main.go that imports github.com/google/uuid, and no go.mod">
{`GO111MODULE=off go build .`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`main.go:6:2: cannot find package "github.com/google/uuid" in any of:
	/usr/local/go/src/github.com/google/uuid (from $GOROOT)
	/Users/tannersummers/go/src/github.com/google/uuid (from $GOPATH)`}
      </CodeBlock>

      <p>Whereas the default behaviour today, same directory, is to tell you what to do about it:</p>

      <CodeBlock language="text" title="Real output — go build, go1.25.5, no go.mod present">
{`main.go:6:2: no required module provides package github.com/google/uuid; to add it:
	go get github.com/google/uuid`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Go version</th>
            <th style={headStyle}>Default mode</th>
            <th style={headStyle}>What it means for you</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&le; 1.10</td>
            <td style={cellStyle}>GOPATH only</td>
            <td style={cellStyle}>the world every old blog post describes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>1.11 &ndash; 1.12</td>
            <td style={cellStyle}>modules opt-in (<code>GO111MODULE=on</code>)</td>
            <td style={cellStyle}>why that env var is still in people&apos;s shell profiles</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>1.13 &ndash; 1.15</td>
            <td style={cellStyle}><code>auto</code> — modules if a <code>go.mod</code> exists</td>
            <td style={cellStyle}>the transition years; both modes live</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>1.16+</td>
            <td style={cellStyle}>modules always</td>
            <td style={cellStyle}>GOPATH mode is off unless you deliberately turn it on</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>1.22+</td>
            <td style={cellStyle}>modules only, in practice</td>
            <td style={cellStyle}><code>go get</code> outside a module is a hard error</td>
          </tr>
        </tbody>
      </table>

      <p>
        <code>GOPATH</code> still exists, but it no longer has anything to do with where your source
        lives. It is now just a parent directory for two caches:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go env GOPATH GOMODCACHE GOBIN GOCACHE`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64">
{`/Users/tannersummers/go
/Users/tannersummers/go/pkg/mod
/Users/tannersummers/go/bin
/Users/tannersummers/Library/Caches/go-build`}
      </CodeBlock>

      <ul>
        <li>
          <strong><code>GOMODCACHE</code></strong> (<code>$GOPATH/pkg/mod</code>) — every version of
          every module you have ever downloaded, extracted, machine-wide, shared across all your
          projects. This is the thing that replaces <code>node_modules</code>, and the difference is
          that there is <em>one</em> of it.
        </li>
        <li>
          <strong><code>GOBIN</code></strong> (<code>$GOPATH/bin</code> if unset) — where{' '}
          <code>go install</code> puts executables. Put it on your <code>PATH</code> once and you are
          done.
        </li>
        <li>
          <strong><code>GOCACHE</code></strong> — the build cache, which is <em>not</em> under
          GOPATH on macOS. Content-addressed compiled packages and test results. This is why the
          incremental builds in the <a href="/go/intro">previous lesson</a> took a third of a second.
        </li>
      </ul>

      <InfoBox variant="warning" title="Stale shell profiles are the real GOPATH problem in 2026">
        <p>
          Full disclosure, since it is relevant: this machine&apos;s shell profile exports{' '}
          <code>GOPATH</code>, <code>GOBIN</code>, <code>GOFLAGS</code> and{' '}
          <code>GO111MODULE=on</code>. The first two match the defaults, so they are harmless noise.{' '}
          <code>GO111MODULE=on</code> is a <strong>no-op</strong> — it has been the default since
          1.16 — and it is there because someone copied it from a 2019 README. I left those in place
          and then unset <code>GOFLAGS</code> and <code>GO111MODULE</code> for the demos in this
          lesson so the output represents a default install rather than this machine&apos;s
          accumulated cruft.
        </p>
        <p>
          The dangerous one is <code>GO111MODULE=off</code>, which you will occasionally find in an
          old Dockerfile or CI script. It does not produce a clear error — it quietly switches the
          resolver, and you get the GOPATH-era message above about a package you can see sitting in
          your <code>go.mod</code>. If a Go build fails in a way that makes no sense, check{' '}
          <code>go env GO111MODULE GOFLAGS</code> first.
        </p>
      </InfoBox>

      <h2>go.mod and go.sum, Against package.json and package-lock.json</h2>
      <p>
        Start a module. Then write code that imports things you have not declared, and watch what
        happens — because the workflow is genuinely inverted relative to npm.
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go mod init example.com/billing
cat go.mod
ls -a -x`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: creating new go.mod: module example.com/billing
module example.com/billing

go 1.25.5
.	..	go.mod`}
      </CodeBlock>

      <p>
        That is the whole manifest. No name, no version, no description, no license, no scripts, no
        author, no <code>main</code>, no <code>type: module</code>. A Go module has two mandatory
        facts: its <strong>path</strong> and the <strong>Go version</strong> it needs.
      </p>

      <InfoBox variant="info" title="The module path is a location, not a name">
        <p>
          <code>example.com/billing</code> is not a registry name you reserved. It is the prefix
          every import path inside this module gets, and for a module anyone else will import, it
          must be <strong>where the code actually is</strong> —{' '}
          <code>github.com/you/billing</code>. The <code>go</code> command resolves imports by
          fetching that URL. There is no central namespace, so there is nothing to squat and no{' '}
          <code>npm publish</code>. <code>example.com/...</code> is the conventional placeholder for
          code that will never be fetched, the way <code>example.com</code> is reserved in DNS.
        </p>
        <p>
          <code>go mod init</code> with no argument does <em>not</em> guess, even inside a git repo
          that has an <code>origin</code> remote — I checked, expecting it would:
        </p>
        <CodeBlock language="text" title="Real output — go mod init with no args, in a git repo with origin set to github.com/acme/billing-service, go1.25.5">
{`go: cannot determine module path for source directory /.../initdir
	(outside GOPATH, module path must be specified)

Example usage:
	'go mod init example.com/m' to initialize a v0 or v1 module`}
        </CodeBlock>
      </InfoBox>

      <h3>Dependencies are discovered from your imports, not declared first</h3>
      <p>
        In Node you run <code>npm install uuid</code> and <em>then</em> write the import. In Go you
        write the import and then run one command that reconciles the manifest to your source.
      </p>

      <CodeBlock language="go" title="main.go — written before any dependency was declared">
{`package main

import (
	"fmt"

	"github.com/google/uuid"
)

func main() {
	fmt.Println("invoice", uuid.New())
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Terminal">
{`go mod tidy
cat go.mod
cat go.sum
go build -o billing . && ./billing`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: finding module for package github.com/google/uuid
go: found github.com/google/uuid in github.com/google/uuid v1.6.0

module example.com/billing

go 1.25.5

require github.com/google/uuid v1.6.0

github.com/google/uuid v1.6.0 h1:NIvaJDMOsjHA8n1jAhLSgzrAzy1Hgr+hNrb57e+94F0=
github.com/google/uuid v1.6.0/go.mod h1:TIyPZe4MgqvfeYDBFedMoGGpEw/LqOeaOT+nhxU+yHo=

invoice a984dc3d-8496-40a3-9fd2-878a32b18cd6`}
      </CodeBlock>

      <p>
        <code>go mod tidy</code> read the source, found the import, resolved it to the latest
        release, wrote the requirement, wrote the checksums, and downloaded it. It also works in the
        other direction, which is the part with no npm equivalent at all — delete the import and run
        it again:
      </p>

      <CodeBlock language="text" title="Real output — go mod tidy after removing the uuid import, go1.25.5">
{`module example.com/billing

go 1.25.5

# go.sum is now 0 bytes — emptied, not deleted`}
      </CodeBlock>

      <p>
        <strong>Dependency drift is not a thing you can have.</strong> There is no{' '}
        <code>depcheck</code>, no &quot;is this still used?&quot; audit, no stale{' '}
        <code>devDependencies</code> block accumulating for three years. One command, run in CI as{' '}
        <code>go mod tidy &amp;&amp; git diff --exit-code</code>, makes the manifest provably equal
        to what the code imports.
      </p>

      <h3>The mapping, term by term</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Node</th>
            <th style={headStyle}>Go</th>
            <th style={headStyle}>The difference that bites</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>package.json</code></td>
            <td style={cellStyle}><code>go.mod</code></td>
            <td style={cellStyle}>
              Go records an <strong>exact version</strong>, never a range. There is no{' '}
              <code>^</code> or <code>~</code>.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>package-lock.json</code></td>
            <td style={cellStyle}>
              <code>go.mod</code> again, plus <code>go.sum</code>
            </td>
            <td style={cellStyle}>
              <code>go.sum</code> is <strong>not</strong> a lockfile. It is a hash list. The lock{' '}
              <em>is</em> <code>go.mod</code>.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>node_modules/</code></td>
            <td style={cellStyle}><code>$GOPATH/pkg/mod</code></td>
            <td style={cellStyle}>
              Machine-wide and read-only, not per-project. Nothing to <code>rm -rf</code> and
              nothing to <code>.gitignore</code>.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm install</code></td>
            <td style={cellStyle}><code>go mod download</code> (usually implicit)</td>
            <td style={cellStyle}>
              <code>go build</code> fetches what it needs. There is no install step to forget.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm ci</code></td>
            <td style={cellStyle}><code>go build</code> with <code>-mod=readonly</code> (the default)</td>
            <td style={cellStyle}>
              Builds already refuse to silently edit <code>go.mod</code>. CI needs no special flag.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm install pkg</code></td>
            <td style={cellStyle}><code>go get pkg</code></td>
            <td style={cellStyle}>
              <code>go get</code> only edits <code>go.mod</code>. It never installs an executable.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm uninstall pkg</code></td>
            <td style={cellStyle}>delete the import, <code>go mod tidy</code></td>
            <td style={cellStyle}>Removal is derived from source, not commanded.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm outdated</code></td>
            <td style={cellStyle}><code>go list -m -u all</code></td>
            <td style={cellStyle}>Available upgrades shown in brackets.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>npm ls</code></td>
            <td style={cellStyle}><code>go list -m all</code> / <code>go mod graph</code></td>
            <td style={cellStyle}>A flat list, because the graph resolves to one version per module.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>devDependencies</code></td>
            <td style={cellStyle}><code>tool</code> directives (Go 1.24+)</td>
            <td style={cellStyle}>Separate mechanism entirely; see below.</td>
          </tr>
        </tbody>
      </table>

      <h3>Exact versions plus Minimal Version Selection</h3>
      <p>
        This is the design decision that makes the lockfile unnecessary, and it is worth ten minutes
        because it explains why Go builds do not drift.
      </p>
      <p>
        <code>require github.com/google/uuid v1.6.0</code> does not mean &quot;v1.6.0 or
        compatible.&quot; It means &quot;<strong>at least</strong> v1.6.0,&quot; and the resolver —{' '}
        <strong>Minimal Version Selection</strong> — picks, for each module, the{' '}
        <em>highest minimum</em> that anything in the graph asked for. Not the highest available. The
        highest <em>requested</em>.
      </p>
      <p>Which makes the resolution a pure function of the <code>go.mod</code> files. Here it is happening:</p>

      <CodeBlock language="bash" title="Terminal">
{`# Step 1: pin an old yaml.v3 on purpose.
go get gopkg.in/yaml.v3@v3.0.0
cat go.mod

# Step 2: add testify, which itself requires a NEWER yaml.v3.
go get github.com/stretchr/testify@v1.9.0
cat go.mod

go mod graph | grep '^github.com/stretchr/testify@v1.9.0 '`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: downloading gopkg.in/yaml.v3 v3.0.0
go: added gopkg.in/yaml.v3 v3.0.0

module example.com/mvs

go 1.25.5

require gopkg.in/yaml.v3 v3.0.0 // indirect

go: downloading github.com/stretchr/testify v1.9.0
go: added github.com/stretchr/testify v1.9.0
go: upgraded gopkg.in/yaml.v3 v3.0.0 => v3.0.1

module example.com/mvs

go 1.25.5

require (
	github.com/stretchr/testify v1.9.0 // indirect
	gopkg.in/yaml.v3 v3.0.1 // indirect
)

github.com/stretchr/testify@v1.9.0 github.com/davecgh/go-spew@v1.1.1
github.com/stretchr/testify@v1.9.0 github.com/pmezard/go-difflib@v1.0.0
github.com/stretchr/testify@v1.9.0 github.com/stretchr/objx@v0.5.2
github.com/stretchr/testify@v1.9.0 gopkg.in/yaml.v3@v3.0.1`}
      </CodeBlock>

      <p>
        <code>go: upgraded gopkg.in/yaml.v3 v3.0.0 =&gt; v3.0.1</code> — the exact mechanic.
        yaml.v3 v3.0.2 and later exist, and MVS <strong>did not take them</strong>, because nothing
        asked. Compare the npm side of the same operation:
      </p>

      <CodeBlock language="text" title="Real output — npm 11.6.2 / Node v25.2.1, npm install uuid">
{`$ cat package.json | grep -A2 dependencies
  "dependencies": {
    "uuid": "^14.0.3"
  }

$ cat package-lock.json | head -16
{
  "name": "npmcmp",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "npmcmp",
      "version": "1.0.0",
      "license": "ISC",
      "dependencies": {
        "uuid": "^14.0.3"
      }
    },
    "node_modules/uuid": {
      "version": "14.0.3",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-14.0.3.tgz",`}
      </CodeBlock>

      <p>
        Two files, because <code>^14.0.3</code> is a <em>range</em> and the resolved tree is a{' '}
        <em>decision</em> made at install time. Delete the lockfile and tomorrow&apos;s install can
        legitimately give you 14.1.0. The lockfile exists to pin that decision. Go has no decision to
        pin: given the same <code>go.mod</code> files, MVS has exactly one answer, today and in five
        years. Practical consequences:
      </p>
      <ul>
        <li>
          <strong>Upgrades are explicit, always.</strong> Nothing moves until you run{' '}
          <code>go get</code> or <code>go get -u</code>. There is no &quot;it broke in CI and
          nothing changed.&quot;
        </li>
        <li>
          <strong>Adding a dependency cannot bump an unrelated one.</strong> The most it can do is
          raise a shared module to the minimum it requires, visibly, in the diff.
        </li>
        <li>
          <strong>You get the <em>oldest</em> versions that satisfy everyone</strong>, not the
          newest. Nobody gets a transitive upgrade by accident — and your deps can also sit several
          years stale without you noticing, which is what <code>go list -m -u all</code> is for.
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — go list -m -u all, go1.25.5 (brackets = available upgrade)">
{`example.com/v2demo
github.com/Masterminds/semver v1.5.0
github.com/Masterminds/semver/v3 v3.3.1 [v3.5.0]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Reading `// indirect`">
        <p>
          A requirement marked <code>// indirect</code> is one no package in your module imports
          directly — it is in <code>go.mod</code> only because something else in the graph needs it.
          In the MVS demo above, <em>everything</em> was indirect, because that module had no{' '}
          <code>.go</code> files importing anything; <code>go get</code> edits the manifest without
          consulting your source, and only <code>go mod tidy</code> reclassifies the markers. If you
          see a direct dependency of yours marked <code>// indirect</code>, you forgot to run{' '}
          <code>go mod tidy</code>.
        </p>
      </InfoBox>

      <h3>go.sum is a transparency log, not a lockfile</h3>
      <p>
        Two lines per module version: one hash of the module zip, one of its <code>go.mod</code>.
        It does not decide anything — it refuses things. Corrupt one hash and the build stops hard:
      </p>

      <CodeBlock language="text" title="Real output — go build after hand-editing one h1: hash in go.sum, go1.25.5">
{`verifying github.com/Masterminds/semver/v3@v3.3.1: checksum mismatch
	downloaded: h1:QtNSWtVZ3nBfk8mAOu/B6v7FMJ+NHTIgUPi7rj+4nv4=
	go.sum:     h1:AAAASWtVZ3nBfk8mAOu/B6v7FMJ+NHTIgUPi7rj+4nv4=

SECURITY ERROR
This download does NOT match an earlier download recorded in go.sum.
The bits may have been replaced on the origin server, or an attacker may
have intercepted the download attempt.

For more information, see 'go help module-auth'.`}
      </CodeBlock>

      <p>
        And for a version you have never fetched, there is a second line of defence:{' '}
        <code>GOSUMDB=sum.golang.org</code>, a public append-only transparency log of module
        hashes (the same Merkle-tree idea as Certificate Transparency). A repo owner who
        force-pushes a tag to change published code cannot make the log agree. <code>npm</code> has
        integrity hashes in the lockfile, which protects you against tampering <em>after</em> your
        first install; the checksum database also protects your first install. Set{' '}
        <code>GOPRIVATE=github.com/yourcorp/*</code> to exempt internal modules from both the proxy
        and the sumdb.
      </p>

      <FlowChart
        title="What happens when the compiler hits an import"
        chart={"graph TD\nA[\"import github.com/google/uuid<br/>somewhere in your source\"] --> B{\"listed in go.mod require?\"}\nB -->|no| C[\"build error:<br/>no required module provides package\"]\nB -->|yes| D{\"already in the module cache?<br/>GOMODCACHE = ~/go/pkg/mod\"}\nD -->|yes| G[\"compile\"]\nD -->|no| E[\"fetch via GOPROXY<br/>proxy.golang.org\"]\nE --> F{\"hash matches go.sum<br/>and GOSUMDB?\"}\nF -->|no| X[\"SECURITY ERROR<br/>build stops\"]\nF -->|yes| W[\"unpack into the module cache,<br/>read-only, shared by every project\"]\nW --> G\nG --> H[\"build cache<br/>GOCACHE, keyed by content\"]\nH --> I[\"one executable\"]\nstyle X fill:#3b1a1a,stroke:#f87171\nstyle C fill:#3b1a1a,stroke:#f87171\nstyle I fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="note" title="If you genuinely want node_modules back: go mod vendor">
        <p>
          It exists, it is first-class, and it is occasionally the right answer — air-gapped builds,
          or a compliance requirement that the artifact contain its sources.
        </p>
        <CodeBlock language="text" title="Real output — go mod vendor on the two-major-versions module below, go1.25.5">
{`$ go mod vendor && find vendor -type f | wc -l && du -sh vendor
      23
160K	vendor

$ cat vendor/modules.txt
# github.com/Masterminds/semver v1.5.0
## explicit
github.com/Masterminds/semver
# github.com/Masterminds/semver/v3 v3.3.1
## explicit; go 1.21
github.com/Masterminds/semver/v3

$ GOMODCACHE=/nonexistent GOPROXY=off go build -o /dev/null . && echo ok
ok`}
        </CodeBlock>
        <p>
          Note the last command: with a <code>vendor/</code> directory present,{' '}
          <code>-mod=vendor</code> becomes the default, so the build never consulted the cache or
          the network. Note also that <code>vendor/</code> holds only the packages actually imported
          — 23 files, not the repos&apos; full contents. The cost is the same cost{' '}
          <code>node_modules</code> has: a large tree in your diffs. Default to not vendoring.
        </p>
      </InfoBox>

      <h2 id="toolchain">The <code>go</code> Directive and Toolchain Switching</h2>
      <p>
        Note that <code>go mod init</code> wrote <code>go 1.25.5</code> — the full patch version, not{' '}
        <code>go 1.25</code>. That line is load-bearing. It is both the <em>language version</em>{' '}
        the compiler applies to this module and the <em>minimum toolchain</em> the module needs.
      </p>
      <p>
        With <code>GOTOOLCHAIN=auto</code> (the shipped default), if the directive names a version
        newer than the one you have, the <code>go</code> command downloads that toolchain and
        re-executes itself under it. Here is that happening on a machine whose only installed Go is
        1.25.5:
      </p>

      <CodeBlock language="bash" title="Terminal — go.mod contains nothing but `module example.com/tc` and `go 1.27.2`">
{`cat go.mod
go version
go run .`}
      </CodeBlock>

      <CodeBlock language="go" title="main.go">
{`package main

import (
	"fmt"
	"runtime"
)

func main() {
	fmt.Println("built and run by:", runtime.Version())
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — invoked as go1.25.5, which fetched and re-executed under go1.27.2">
{`module example.com/tc

go 1.27.2

go version go1.27.2 darwin/arm64
built and run by: go1.27.2`}
      </CodeBlock>

      <p>
        <code>go version</code> reported <strong>1.27.2</strong>, inside that directory, with no
        version manager and nothing installed by hand. Step outside the directory and it is 1.25.5
        again. The downloaded toolchain is a module like any other:
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5 host, after the switch above">
{`$ go env GOROOT                      # inside the module
/Users/tannersummers/go/pkg/mod/golang.org/toolchain@v0.0.1-go1.27.2.darwin-arm64

$ cd .. && go env GOROOT && go version
/usr/local/go
go version go1.25.5 darwin/arm64

$ du -sh ~/go/pkg/mod/golang.org/toolchain@*
231M	.../toolchain@v0.0.1-go1.26.0.darwin-arm64
231M	.../toolchain@v0.0.1-go1.26.9.darwin-arm64
243M	.../toolchain@v0.0.1-go1.27.2.darwin-arm64`}
      </CodeBlock>

      <p>
        The Go toolchain is distributed as a Go module, fetched through the same proxy and verified
        by the same checksum database as your dependencies. Which also means it happens{' '}
        <em>mid-command</em> when a dependency demands it. This one genuinely surprised me while
        writing the lesson — a plain <code>go mod tidy</code> changed the compiler underneath itself:
      </p>

      <CodeBlock language="text" title="Real output — go mod tidy, invoked as go1.25.5, on a module importing golang.org/x/text">
{`go: finding module for package golang.org/x/text/language
go: finding module for package golang.org/x/text/cases
go: finding module for package github.com/google/uuid
go: downloading golang.org/x/text v0.43.0
go: toolchain upgrade needed to resolve golang.org/x/text/cases
go: golang.org/x/text@v0.43.0 requires go >= 1.26.0; switching to go1.26.9
go: finding module for package golang.org/x/text/language
go: finding module for package golang.org/x/text/cases
go: finding module for package github.com/google/uuid
go: found github.com/google/uuid in github.com/google/uuid v1.6.0
go: found golang.org/x/text/cases in golang.org/x/text v0.43.0
go: found golang.org/x/text/language in golang.org/x/text v0.43.0`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the resulting go.mod, and go version in that directory afterwards">
{`module example.com/billing

go 1.26.0

require (
	github.com/google/uuid v1.6.0
	golang.org/x/text v0.43.0
)

$ go version
go version go1.26.0 darwin/arm64`}
      </CodeBlock>

      <p>
        Adding a dependency raised this module&apos;s minimum Go version from 1.25.5 to 1.26.0, and
        every subsequent <code>go</code> command in that directory now runs 1.26.0. Note the detail:{' '}
        <code>tidy</code> switched to <strong>1.26.9</strong> (the newest 1.26 patch) to do the
        resolution, but wrote <code>go 1.26.0</code> — the actual requirement — into{' '}
        <code>go.mod</code>, which is why the later <code>go version</code> says 1.26.0.
      </p>

      <FlowChart
        title="How the go command decides which compiler to run"
        chart={"graph TD\nA[\"go command starts<br/>locally installed: go1.25.5\"] --> B{\"go directive in go.mod\"}\nB -->|\"1.25.5 or older\"| C[\"run with the installed toolchain\"]\nB -->|\"newer than 1.25.5\"| D{\"GOTOOLCHAIN\"}\nD -->|\"auto (the shipped default)\"| E[\"download that exact toolchain<br/>as a module: golang.org/toolchain\"]\nE --> F[\"re-exec under it.<br/>go version now reports the NEW one\"]\nD -->|\"local\"| G[\"error: go.mod requires a newer Go\"]\nstyle F fill:#1a3329,stroke:#4ade80\nstyle G fill:#3b1a1a,stroke:#f87171"}
      />

      <InfoBox variant="warning" title="Pin GOTOOLCHAIN in CI if you want a reproducible compiler">
        <p>
          <code>auto</code> is the right default for humans and a surprise for build systems: your
          CI image says Go 1.25 and your build quietly downloads 1.27 because a dependency bumped
          its <code>go</code> directive. Set <code>GOTOOLCHAIN=local</code> to forbid downloads
          (builds then fail loudly with &quot;requires a newer Go&quot;), or{' '}
          <code>GOTOOLCHAIN=go1.27.2</code> to pin one exactly. The <code>toolchain</code> directive
          in <code>go.mod</code> does the same thing per-module. Either way, decide — do not leave it
          implicit.
        </p>
      </InfoBox>

      <h2>Semantic Import Versioning: the <code>/v2</code> Suffix</h2>
      <p>
        This is the part of Go modules with no counterpart in any ecosystem you have used, and the
        rule is one sentence:
      </p>
      <p>
        <strong>For major version 2 and above, the major version is part of the import path.</strong>
      </p>
      <p>
        Not part of a version field somewhere — part of the path you type in your{' '}
        <code>import</code> block. <code>github.com/foo/bar</code> at v1 becomes{' '}
        <code>github.com/foo/bar/v2</code> at v2. Try to get a v3 without saying so and the tool
        tells you exactly why it refuses:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go get github.com/Masterminds/semver@v3.3.1`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: github.com/Masterminds/semver@v3.3.1: invalid version:
	go.mod has post-v3 module path "github.com/Masterminds/semver/v3" at revision v3.3.1`}
      </CodeBlock>

      <CodeBlock language="bash" title="Terminal — with the suffix">
{`go get github.com/Masterminds/semver/v3@v3.3.1`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: downloading github.com/Masterminds/semver/v3 v3.3.1
go: added github.com/Masterminds/semver/v3 v3.3.1`}
      </CodeBlock>

      <p>
        It looks like bureaucracy. It is actually enforcing the <strong>import compatibility
        rule</strong>: <em>if an old package and a new package have the same import path, the new
        one must be backwards compatible.</em> A breaking change therefore has to change the path.
        And once a major version is a different path, it is a different package — so two of them can
        coexist in one program, which is the payoff:
      </p>

      <CodeBlock language="go" title="main.go — v1 and v3 of the same library, in one binary">
{`package main

import (
	"fmt"

	semver1 "github.com/Masterminds/semver"
	semver3 "github.com/Masterminds/semver/v3"
)

func main() {
	v1, _ := semver1.NewVersion("1.2.3-beta.1")
	v3, _ := semver3.NewVersion("1.2.3-beta.1")

	fmt.Printf("v1 pkg: %T -> %s (prerelease %q)\\n", v1, v1, v1.Prerelease())
	fmt.Printf("v3 pkg: %T -> %s (prerelease %q)\\n", v3, v3, v3.Prerelease())
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go mod tidy then go run, go1.25.5">
{`go: finding module for package github.com/Masterminds/semver
go: downloading github.com/Masterminds/semver v1.5.0
go: found github.com/Masterminds/semver in github.com/Masterminds/semver v1.5.0

module example.com/v2demo

go 1.25.5

require (
	github.com/Masterminds/semver v1.5.0
	github.com/Masterminds/semver/v3 v3.3.1
)

v1 pkg: *semver.Version -> 1.2.3-beta.1 (prerelease "beta.1")
v3 pkg: *semver.Version -> 1.2.3-beta.1 (prerelease "beta.1")`}
      </CodeBlock>

      <p>
        Both types print as <code>*semver.Version</code> — same package <em>name</em>, different
        packages, which is why the import aliases are needed. The <code>vendor/</code> layout from
        earlier shows how little machinery this takes:{' '}
        <code>vendor/github.com/Masterminds/semver/</code> and{' '}
        <code>vendor/github.com/Masterminds/semver/v3/</code>, side by side, because the suffix is
        just a directory.
      </p>

      <InfoBox variant="info" title="Compare: how npm solves the same problem">
        <p>
          npm allows one name to be many versions, resolved by <em>position in the tree</em>:
          hoisted to the top <code>node_modules</code> when there is no conflict, nested under the
          dependent when there is. So <code>require(&apos;lodash&apos;)</code> can mean different
          code in different files of the same program, decided by directory walk. That is why you
          get the duplicated-dependency bloat, why <code>npm dedupe</code> exists, and why
          &quot;two copies of React&quot; is a famous class of bug: two instances with separate
          module state, structurally invisible from the source.
        </p>
        <p>
          Go made the version visible in the source instead. One import path is always exactly one
          package, everywhere in the program. You cannot accidentally link two copies of something,
          because linking two copies requires typing two different import paths.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Three things that will trip you up">
        <ul>
          <li>
            <strong>v0 and v1 share the unsuffixed path.</strong> v0 is explicitly
            &quot;no stability promised,&quot; and a v0&rarr;v1 bump needs no path change. The
            suffix starts at v2.
          </li>
          <li>
            <strong>Releasing a v2 of your own module is manual.</strong> You must edit the{' '}
            <code>module</code> line in your <code>go.mod</code> to end in <code>/v2</code>, and
            every internal import of your own packages has to be updated too. Tagging{' '}
            <code>v2.0.0</code> without doing that publishes a module whose declared path disagrees
            with its tag — which is exactly the error above, pointed at you.
          </li>
          <li>
            <strong><code>gopkg.in/yaml.v3</code> is not this mechanism.</strong> It predates it.{' '}
            <code>gopkg.in</code> is a redirector service that encodes the major version in the
            hostname path; it happens to satisfy the same rule by accident. Do not copy the style
            for new code.
          </li>
        </ul>
      </InfoBox>

      <h3>There is no registry, and nothing to publish to it</h3>
      <p>
        Versions are git tags. The proxy is a cache in front of your repo host, not a place you
        upload to. You can see the whole chain:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go list -m -versions github.com/Masterminds/semver/v3
go list -m -versions github.com/Masterminds/semver
go list -m -json github.com/Masterminds/semver/v3@v3.3.1`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`github.com/Masterminds/semver/v3 v3.0.0 v3.0.1 v3.0.2 v3.0.3 v3.1.0 v3.1.1 v3.2.0 v3.2.1 v3.3.0 v3.3.1 v3.4.0 v3.5.0
github.com/Masterminds/semver v1.1.1 v1.2.0 v1.2.1 v1.2.2 v1.2.3 v1.3.0 v1.3.1 v1.4.0 v1.4.1 v1.4.2 v1.5.0

{
	"Path": "github.com/Masterminds/semver/v3",
	"Version": "v3.3.1",
	"Time": "2024-11-19T20:00:22Z",
	"Dir": "/Users/tannersummers/go/pkg/mod/github.com/!masterminds/semver/v3@v3.3.1",
	"GoMod": "/Users/tannersummers/go/pkg/mod/cache/download/github.com/!masterminds/semver/v3/@v/v3.3.1.mod",
	"GoVersion": "1.21",
	"Sum": "h1:QtNSWtVZ3nBfk8mAOu/B6v7FMJ+NHTIgUPi7rj+4nv4=",
	"GoModSum": "h1:4V+yj/TJE1HU9XfppCwVMZq3I84lprf4nC11bSS5beM=",
	"Origin": {
		"VCS": "git",
		"URL": "https://github.com/Masterminds/semver",
		"Hash": "1558ca3488226e3490894a145e831ad58a5ff958",
		"Ref": "refs/tags/v3.3.1"
	}
}`}
      </CodeBlock>

      <p>
        <code>&quot;Ref&quot;: &quot;refs/tags/v3.3.1&quot;</code>. Publishing a Go module is{' '}
        <code>git tag v1.4.0 &amp;&amp; git push --tags</code>. That is the entire process: no
        account, no access token, no <code>files</code> field, no <code>.npmignore</code>, no
        two-factor prompt. Both major version lines above live in <strong>the same repository</strong>
        , distinguished only by tag. (Incidental detail worth knowing when you go spelunking in the
        cache: capital letters in module paths are escaped as{' '}
        <code>!</code> + lowercase — hence <code>!masterminds</code> — so the cache works on
        case-insensitive filesystems.)
      </p>

      <h2><code>go build</code> vs <code>go run</code> vs <code>go install</code></h2>
      <p>
        Three verbs, one difference: where the executable ends up. Same program each time — it
        prints its own <code>argv[0]</code>, which makes the answer visible.
      </p>

      <CodeBlock language="go" title="main.go — module example.com/greet">
{`package main

import (
	"fmt"
	"os"
)

func main() {
	fmt.Printf("greet: argv=%v pid=%d exe=%s\\n", os.Args[1:], os.Getpid(), os.Args[0])
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Terminal">
{`go run . --name=ada
ls -x

go build .
ls -x
./greet --name=ada

go install .
ls -x
greet --from=PATH`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`greet: argv=[--name=ada] pid=99830 exe=/var/folders/l3/0cbc0wq169n4r_ypv1sbxk780000gn/T/go-build3817925526/b001/exe/greet
go.mod	main.go

go.mod	greet	main.go
greet: argv=[--name=ada] pid=99948 exe=./greet

go.mod	greet	main.go
greet: argv=[--from=PATH] pid=99978 exe=greet`}
      </CodeBlock>

      <p>
        Read the <code>exe=</code> values. <code>go run</code> compiled to{' '}
        <code>$TMPDIR/go-build.../b001/exe/greet</code>, ran it, and deleted it — the first{' '}
        <code>ls</code> shows no new file. <code>go build</code> left <code>./greet</code> in the
        working directory, named after the last element of the module path.{' '}
        <code>go install</code> added nothing locally; the binary went to{' '}
        <code>$(go env GOBIN)</code>, which was on <code>PATH</code>, so the bare word{' '}
        <code>greet</code> resolved.
      </p>

      <FlowChart
        title="Where each verb puts the executable"
        chart={"graph TD\nS[\"a package main directory\"] --> B[\"go build .\"]\nS --> R[\"go run .\"]\nS --> I[\"go install .\"]\nB --> B1[\"executable in the CURRENT directory,<br/>named after the module path's last element\"]\nR --> R1[\"executable in a temp dir:<br/>/var/folders/.../go-build.../b001/exe/greet\"]\nR1 --> R2[\"run, then thrown away.<br/>Nothing left in your working tree.\"]\nI --> I1[\"executable in GOBIN<br/>(~/go/bin by default, which you put on PATH)\"]\nI1 --> I2[\"this is Go's 'npm install -g'\"]\nstyle B1 fill:#1a2744,stroke:#5b9cf6\nstyle R2 fill:#3d2f14,stroke:#fb923c\nstyle I2 fill:#1a3329,stroke:#4ade80"}
      />

      <ul>
        <li>
          <strong><code>go run .</code></strong> is not an interpreter and not{' '}
          <code>nodemon</code>. It is a full compile-and-exec, which is affordable because the build
          cache makes the compile take a third of a second. It is for scratch programs; do not use
          it in a container <code>ENTRYPOINT</code> (you ship a toolchain and lose signal handling
          and exit codes).
        </li>
        <li>
          <strong><code>go build</code></strong> is what CI runs. <code>-o</code> controls the path.{' '}
          <code>go build ./...</code> type-checks and compiles every package in the module and
          writes no executable for libraries — the cheap &quot;does it all still compile&quot; check.
        </li>
        <li>
          <strong><code>go install</code></strong> is Go&apos;s <code>npm install -g</code>, except
          it builds from source and the result is a static binary with no runtime to go stale.
        </li>
      </ul>

      <h3><code>go get</code> does not install things</h3>
      <p>
        Muscle memory from <code>npm install -g</code> will send you to <code>go get</code>, and
        since Go 1.17 that is simply the wrong tool — <code>go get</code> now only edits{' '}
        <code>go.mod</code>. The error message is unusually good about it:
      </p>

      <CodeBlock language="text" title="Real output — go get, run outside any module, go1.25.5">
{`go: go.mod file not found in current directory or any parent directory.
	'go get' is no longer supported outside a module.
	To build and install a command, use 'go install' with a version,
	like 'go install example.com/cmd@latest'
	For more information, see https://golang.org/doc/go-get-install-deprecation
	or run 'go help get' or 'go help install'.`}
      </CodeBlock>

      <CodeBlock language="bash" title="Terminal — the right way to install a tool">
{`go install golang.org/x/tools/cmd/goimports@v0.38.0
ls -l $(go env GOBIN)/goimports
goimports --help`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`go: downloading golang.org/x/tools v0.38.0
go: downloading golang.org/x/telemetry v0.0.0-20251008203120-078029d740a8
go: downloading golang.org/x/mod v0.29.0
-rwxr-xr-x@ 1 tannersummers  staff  7676818 Oct  9 21:12 /Users/tannersummers/go/bin/goimports
usage: goimports [flags] [path ...]
  -cpuprofile string
    	CPU profile output
  -d	display diffs instead of rewriting files
  -e	report all errors (not just the first 10 on different lines)`}
      </CodeBlock>

      <p>
        The <code>@version</code> is mandatory and it is the whole point:{' '}
        <code>go install pkg@version</code> builds in an isolated context that{' '}
        <strong>ignores your project&apos;s <code>go.mod</code> entirely</strong>. Installing a tool
        cannot perturb your application&apos;s dependency graph — the exact failure mode that makes
        npm <code>devDependencies</code> a source of version conflicts.
      </p>

      <InfoBox variant="tip" title="devDependencies, properly: the `tool` directive (Go 1.24+)">
        <p>
          The flip side of that isolation is that the version is not recorded anywhere, so your
          teammates and CI can run a different <code>mockgen</code> than you. The old fix was a{' '}
          <code>tools.go</code> file with blank imports behind a build tag. Go 1.24 made it a
          first-class directive:
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go get -tool golang.org/x/tools/cmd/stringer@v0.38.0
go: added golang.org/x/mod v0.29.0
go: added golang.org/x/sync v0.17.0
go: added golang.org/x/tools v0.38.0

$ cat go.mod
module example.com/toolpin

go 1.25.5

tool golang.org/x/tools/cmd/stringer

require (
	golang.org/x/mod v0.29.0 // indirect
	golang.org/x/sync v0.17.0 // indirect
	golang.org/x/tools v0.38.0 // indirect
)

$ go tool
asm
cgo
compile
cover
link
preprofile
vet
golang.org/x/tools/cmd/stringer

$ go tool stringer -h
Usage of stringer:
	stringer [flags] -type T [directory]
	stringer [flags] -type T files... # Must be a single package
For more information, see:
	https://pkg.go.dev/golang.org/x/tools/cmd/stringer
Flags:
  -linecomment
    	use line comment text as printed text when present
  -output string
    	output file name; default srcdir/<type>_string.go`}
        </CodeBlock>
        <p>
          Now <code>go tool stringer</code> works for anyone who clones the repo, at the pinned
          version, with no install step. The trade is the one you can see in that{' '}
          <code>require</code> block: the tool&apos;s dependencies are now in your module graph as
          indirect requirements. Use <code>tool</code> for things that affect build output (code
          generators, <code>mockgen</code>); use <code>go install</code> for personal tooling.
        </p>
      </InfoBox>

      <h2>The Unified Toolchain</h2>

      <h3><code>gofmt</code> — formatting is not a decision you get to make</h3>
      <p>
        There is no <code>.prettierrc</code> because there is nothing to put in it. Here is{' '}
        <code>gofmt</code>&apos;s complete flag surface:
      </p>

      <CodeBlock language="text" title="Real output — gofmt -h, go1.25.5">
{`usage: gofmt [flags] [path ...]
  -cpuprofile string
    	write cpu profile to this file
  -d	display diffs instead of rewriting files
  -e	report all errors (not just the first 10 on different lines)
  -l	list files whose formatting differs from gofmt's
  -r string
    	rewrite rule (e.g., 'a[b:len(a)] -> a[b:]')
  -s	simplify code
  -w	write result to (source) file instead of stdout`}
      </CodeBlock>

      <p>
        Read that list again: every single flag is about <em>input and output</em>. Not one of them
        changes the style. No indent width, no tabs-vs-spaces, no print width, no semicolons, no
        trailing-comma mode, no quote preference, no bracket spacing. The output is a pure function
        of the parsed syntax tree.
      </p>
      <p>Deliberately mangled input, and what the tool does with it:</p>

      <CodeBlock language="go" title="main.go — before (spaces, no alignment, everything crammed)">
{`package main

import ("fmt"
 "os"
 "strings")

type Invoice struct {
ID int
CustomerName string
TotalCents int64
Paid bool
}

func main(){
   inv := Invoice{ ID : 1, CustomerName : "Ada Lovelace", TotalCents : 129900, Paid : false }
   if inv.Paid == false { fmt.Fprintln(os.Stderr,"unpaid:",strings.ToUpper(inv.CustomerName)) }
   fmt.Println( inv.ID , inv.TotalCents )
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — gofmt -l . then gofmt -d main.go, go1.25.5">
{`main.go

diff main.go.orig main.go
--- main.go.orig
+++ main.go
@@ -1,18 +1,22 @@
 package main

-import ("fmt"
- "os"
- "strings")
+import (
+	"fmt"
+	"os"
+	"strings"
+)

 type Invoice struct {
-ID int
-CustomerName string
-TotalCents int64
-Paid bool
-}
-
-func main(){
-   inv := Invoice{ ID : 1, CustomerName : "Ada Lovelace", TotalCents : 129900, Paid : false }
-   if inv.Paid == false { fmt.Fprintln(os.Stderr,"unpaid:",strings.ToUpper(inv.CustomerName)) }
-   fmt.Println( inv.ID , inv.TotalCents )
+	ID           int
+	CustomerName string
+	TotalCents   int64
+	Paid         bool
+}
+
+func main() {
+	inv := Invoice{ID: 1, CustomerName: "Ada Lovelace", TotalCents: 129900, Paid: false}
+	if inv.Paid == false {
+		fmt.Fprintln(os.Stderr, "unpaid:", strings.ToUpper(inv.CustomerName))
+	}
+	fmt.Println(inv.ID, inv.TotalCents)
 }`}
      </CodeBlock>

      <p>
        Note the struct field alignment — <code>gofmt</code> pads with <em>spaces</em> inside a
        tab-indented line so columns line up at any tab width. Note also the single-line{' '}
        <code>if</code> became a block: <code>gofmt</code> reformats but never rewrites meaning, and
        a one-line <code>if</code> body is not legal Go formatting. <code>go fmt ./...</code> is a
        thin wrapper that runs <code>gofmt -l -w</code> over the packages you name.
      </p>

      <InfoBox variant="info" title="Why this is deliberate, and why it is more than taste">
        <p>
          Rob Pike&apos;s line is the usual quote: <em>&quot;gofmt&apos;s style is no one&apos;s
          favorite, yet gofmt is everyone&apos;s favorite.&quot;</em> The reasoning behind it is
          worth taking seriously, because it generalises:
        </p>
        <ul>
          <li>
            <strong>Style debate is pure cost.</strong> Every hour your team has spent on print
            width or semicolons produced nothing. Removing the option removes the cost permanently.
            It is the same move as making unused imports a compile error rather than a lint rule —
            delete the possibility of the mess instead of policing it.
          </li>
          <li>
            <strong>One canonical form makes tooling possible.</strong> Because every Go file in the
            world is formatted identically, a tool can rewrite your source and produce a readable
            diff. That is what <code>gofmt -r</code>, <code>go fix</code>, the automatic{' '}
            <code>errors.As</code> rewrites, and every IDE refactor depend on. Tools that must
            preserve arbitrary formatting are far harder to write, so fewer of them exist.
          </li>
          <li>
            <strong>Diffs are about code.</strong> No reformatting churn, ever, because there is
            nothing to reformat differently.
          </li>
        </ul>
        <p>
          The one adjacent tool worth installing is <strong><code>goimports</code></strong> (used in
          the <code>go install</code> example above): it is <code>gofmt</code> plus adding and
          removing import lines automatically. Point your editor at it and the unused-import compile
          error from the <a href="/go/intro">previous lesson</a> stops ever happening.
        </p>
      </InfoBox>

      <h3><code>go vet</code> — the compiler&apos;s pedantic colleague</h3>
      <p>
        Go&apos;s compiler rejects a lot, but it has no warnings — code either compiles or it does
        not. <code>go vet</code> is where the heuristic &quot;this compiles and is still wrong&quot;
        checks live. Here is a file that builds cleanly:
      </p>

      <CodeBlock language="go" title="main.go — compiles without complaint">
{`type Account struct {
	ID      int    \`json:"id"\`
	Balance int64  \`json:'balance'\`
	Owner   string \`json:"owner,omitempty"\`
}

func main() {
	acct := &Account{ID: 7, Balance: 1500}

	// 1. Printf verbs do not match the argument types.
	fmt.Printf("balance for %s is %d\\n", acct.ID, acct.Owner)

	// 2. Printf with arguments but no directives.
	fmt.Printf("done\\n", acct.ID)

	// 3. context.WithTimeout's cancel func is discarded.
	ctx, _ := context.WithTimeout(context.Background(), time.Second)
	_, _ = fetch(ctx, 1)

	// 4. Struct tag with single quotes — encoding/json silently ignores it.
	b, _ := json.Marshal(acct)
	fmt.Println(string(b))

	// 5. A WaitGroup copied by value into a goroutine.
	var wg sync.WaitGroup
	wg.Add(1)
	go func(w sync.WaitGroup) { w.Done() }(wg)

	fmt.Println(fmt.Sprintf("acct %d", acct.ID))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go build -o /dev/null ./... && echo "yes — the compiler is happy with all of that"
yes — the compiler is happy with all of that

$ go vet ./...
# example.com/vetdemo
# [example.com/vetdemo]
./main.go:41:41: call of func(w sync.WaitGroup) { w.Done() } copies lock value: sync.WaitGroup contains sync.noCopy
./main.go:41:12: func passes lock by value: sync.WaitGroup contains sync.noCopy
./main.go:31:7: the cancel function returned by context.WithTimeout should be called, not discarded, to avoid a context leak
./main.go:25:26: fmt.Printf format %s has arg acct.ID of wrong type int
./main.go:28:23: fmt.Printf call has arguments but no formatting directives
./main.go:13:2: struct field tag \`json:'balance'\` not compatible with reflect.StructTag.Get: bad syntax for struct tag value`}
      </CodeBlock>

      <p>
        Every one of those is a real bug that ships. The struct tag one is especially nasty: single
        quotes make <code>encoding/json</code> ignore the tag entirely, so the field serialises as{' '}
        <code>&quot;Balance&quot;</code> and your API contract breaks silently. The leaked{' '}
        <code>context</code> cancel func is the classic slow resource leak — see{' '}
        <a href="/go/context">Context: Cancellation &amp; Deadlines</a>. Vet ships 35 analyzers in
        1.25.5 (<code>go tool vet help</code> lists them); the ones you will hit most are{' '}
        <code>printf</code>, <code>lostcancel</code>, <code>copylocks</code>,{' '}
        <code>structtag</code>, <code>loopclosure</code>, and <code>httpresponse</code>.
      </p>
      <p>
        Note what vet did <em>not</em> flag: the last line,{' '}
        <code>fmt.Println(fmt.Sprintf(...))</code>, which should be <code>fmt.Printf</code>. Vet is
        deliberately tuned for near-zero false positives, so it stops well short of a style linter.
        That gap is why real projects add <strong>staticcheck</strong> (or{' '}
        <code>golangci-lint</code>, which bundles it and a few dozen others). Neither is installed
        on this machine, so there is no output block for them here — but a single{' '}
        <code>.golangci.yml</code> is the one config file a Go repo typically does have.
      </p>

      <h3><code>go test</code> — the runner is in the box</h3>
      <p>
        No Jest, no Mocha, no Vitest, no JUnit, no assertion library, no mocking framework, no{' '}
        <code>describe</code>. A file ending in <code>_test.go</code>, functions named{' '}
        <code>TestXxx(t *testing.T)</code>. <a href="/go/testing">Testing Without a Framework</a>{' '}
        covers this properly; the point here is that it is part of the toolchain. A table test
        against a <code>Format(cents int64) string</code> function:
      </p>

      <CodeBlock language="go" title="money_test.go">
{`func TestFormat(t *testing.T) {
	cases := []struct {
		name string
		in   int64
		want string
	}{
		{"zero", 0, "$0.00"},
		{"cents only", 7, "$0.07"},
		{"dollars", 129900, "$1299.00"},
		{"negative", -50, "$-0.50"},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := Format(c.in); got != c.want {
				t.Errorf("Format(%d) = %q, want %q", c.in, got, c.want)
			}
		})
	}
}

func BenchmarkFormat(b *testing.B) {
	for b.Loop() {
		Format(129900)
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -v -run TestFormat ./..., go1.25.5">
{`=== RUN   TestFormat
=== RUN   TestFormat/zero
=== RUN   TestFormat/cents_only
=== RUN   TestFormat/dollars
=== RUN   TestFormat/negative
    money_test.go:19: Format(-50) = "$0.-50", want "$-0.50"
--- FAIL: TestFormat (0.00s)
    --- PASS: TestFormat/zero (0.00s)
    --- PASS: TestFormat/cents_only (0.00s)
    --- PASS: TestFormat/dollars (0.00s)
    --- FAIL: TestFormat/negative (0.00s)
FAIL
FAIL	example.com/money	0.288s
FAIL`}
      </CodeBlock>

      <InfoBox variant="danger" title="That failure was not planted, and the coverage number is the lesson">
        <p>
          I wrote <code>Format</code> as a one-liner —{' '}
          <code>fmt.Sprintf(&quot;$%d.%02d&quot;, cents/100, cents%100)</code> — added the negative
          case as an afterthought, and it came out <code>&quot;$0.-50&quot;</code>. Integer division
          truncates toward zero, so <code>-50/100</code> is <code>0</code> and{' '}
          <code>-50%100</code> is <code>-50</code>, and the sign lands in the cents field. A real
          bug, found by a real test, while writing a tutorial about toolchains.
        </p>
        <p>Now look at what <code>-cover</code> said about that same broken function:</p>
        <CodeBlock language="text" title="Real output — go test -cover ./..., go1.25.5">
{`--- FAIL: TestFormat (0.00s)
    --- FAIL: TestFormat/negative (0.00s)
        money_test.go:19: Format(-50) = "$0.-50", want "$-0.50"
FAIL
coverage: 100.0% of statements
FAIL	example.com/money	0.322s
FAIL`}
        </CodeBlock>
        <p>
          <strong>100.0% of statements, and the function was wrong.</strong> Coverage measures which
          lines ran, not which inputs you thought about. Keep that in mind the next time someone
          proposes a coverage gate.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — the fixed version, plus -bench, go1.25.5">
{`$ go test ./...
ok  	example.com/money	0.300s

$ go test -bench=Format -benchmem -run=^$ ./...
goos: darwin
goarch: arm64
pkg: example.com/money
cpu: Apple M4 Pro
BenchmarkFormat-14    	14458920	        95.45 ns/op	      16 B/op	       2 allocs/op
PASS
ok  	example.com/money	1.662s`}
      </CodeBlock>

      <p>
        Benchmarking with per-operation allocation counts, from the same command, with no plugin.
        And the toolchain is integrated in a way that is easy to miss: <code>go test</code> runs a
        subset of <code>go vet</code> before compiling the tests, and a vet failure is a{' '}
        <em>build</em> failure:
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5, with a bad Printf in a _test.go file">
{`$ go test ./...
# example.com/money
# [example.com/money]
./bad_test.go:9:23: fmt.Printf format %d has arg "not a number" of wrong type string
FAIL	example.com/money [build failed]
FAIL

$ go test -vet=off ./...
ok  	example.com/money	0.311s`}
      </CodeBlock>

      <h3><code>go doc</code> — documentation from the source you are compiling</h3>
      <p>
        Not a website. Not a separate generator. <code>go doc</code> reads the doc comments out of
        the Go source on your disk, including your pinned third-party versions, with no network:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go doc strings.Builder
go doc net/http.Server.ListenAndServe
go doc github.com/Masterminds/semver/v3.Version.Prerelease`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, offline">
{`package strings // import "strings"

type Builder struct {
	// Has unexported fields.
}
    A Builder is used to efficiently build a string using Builder.Write methods.
    It minimizes memory copying. The zero value is ready to use. Do not copy a
    non-zero Builder.

func (b *Builder) Cap() int
func (b *Builder) Grow(n int)
func (b *Builder) Len() int
func (b *Builder) Reset()
func (b *Builder) Write(p []byte) (int, error)
func (b *Builder) WriteByte(c byte) error
func (b *Builder) WriteRune(r rune) (int, error)
func (b *Builder) WriteString(s string) (int, error)

package http // import "net/http"

func (s *Server) ListenAndServe() error
    ListenAndServe listens on the TCP network address s.Addr and then calls
    Serve to handle requests on incoming connections. Accepted connections are
    configured to enable TCP keep-alives.

    If s.Addr is blank, ":http" is used.

    ListenAndServe always returns a non-nil error. After Server.Shutdown or
    Server.Close, the returned error is ErrServerClosed.

package semver // import "github.com/Masterminds/semver/v3"

func (v Version) Prerelease() string
    Prerelease returns the pre-release version.`}
      </CodeBlock>

      <p>
        That third one is the one with no npm equivalent: documentation for a third-party dependency,
        at <em>exactly</em> the version your build uses, in your terminal, offline. No hunting for
        whether the README on GitHub&apos;s default branch describes the version you pinned.{' '}
        <code>go doc -all strings</code> dumps the whole package; <code>go doc -src</code> prints the
        implementation.
      </p>
      <p>
        One detail in that output is a preview of the <a href="/go/syntax">next lesson</a>:{' '}
        <em>&quot;The zero value is ready to use.&quot;</em> That sentence appears throughout the
        standard library, and it is a design contract, not a nicety.
      </p>

      <h2>Cross-Compilation</h2>
      <p>
        Node has no equivalent of this, because Node ships source and the runtime is the target&apos;s
        problem. Java has no real equivalent either — bytecode is portable, so there is nothing to
        cross-compile. In Go you pick a target at build time, and picking a different one is two
        environment variables.
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go tool dist list | wc -l
go tool dist list | column -c 95`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5 darwin/arm64 (one toolchain, 48 targets)">
{`      48
aix/ppc64	freebsd/arm	linux/arm64	netbsd/386	plan9/386
android/386	freebsd/arm64	linux/loong64	netbsd/amd64	plan9/amd64
android/amd64	freebsd/riscv64	linux/mips	netbsd/arm	plan9/arm
android/arm	illumos/amd64	linux/mips64	netbsd/arm64	solaris/amd64
android/arm64	ios/amd64	linux/mips64le	openbsd/386	wasip1/wasm
darwin/amd64	ios/arm64	linux/mipsle	openbsd/amd64	windows/386
darwin/arm64	js/wasm		linux/ppc64	openbsd/arm	windows/amd64
dragonfly/amd64	linux/386	linux/ppc64le	openbsd/arm64	windows/arm64
freebsd/386	linux/amd64	linux/riscv64	openbsd/ppc64
freebsd/amd64	linux/arm	linux/s390x	openbsd/riscv64`}
      </CodeBlock>

      <p>
        Those are not plugins or SDKs you install. They came with the 233 MB in{' '}
        <code>GOROOT</code>. Here is a release matrix, from a Mac, with nothing else installed, on a
        cold build cache:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`go clean -cache
GOOS=darwin  GOARCH=arm64 go build -o dist/xc-darwin-arm64 .
GOOS=linux   GOARCH=amd64 go build -o dist/xc-linux-amd64 .
GOOS=linux   GOARCH=arm64 go build -o dist/xc-linux-arm64 .
GOOS=windows GOARCH=amd64 go build -o dist/xc-windows-amd64.exe .
GOOS=freebsd GOARCH=amd64 go build -o dist/xc-freebsd-amd64 .`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — /usr/bin/time -p around all five, go1.25.5, Apple M4 Pro">
{`real 8.90
user 3.82
sys 0.81

2.3M  xc-darwin-arm64
2.1M  xc-freebsd-amd64
2.2M  xc-linux-amd64
2.2M  xc-linux-arm64
2.2M  xc-windows-amd64.exe`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — file(1) on each artifact">
{`xc-darwin-arm64        Mach-O 64-bit executable arm64
xc-freebsd-amd64       ELF 64-bit LSB executable, x86-64, version 1 (FreeBSD), statically linked, for FreeBSD 12.3, ...
xc-linux-amd64         ELF 64-bit LSB executable, x86-64, version 1 (SYSV), statically linked, BuildID[sha1]=43e2040...
xc-linux-arm64         ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), statically linked, BuildID[sha1]=99b1555...
xc-windows-amd64.exe   PE32+ executable (console) x86-64, for MS Windows`}
      </CodeBlock>

      <p>
        Nine seconds, five operating-system/architecture pairs, from scratch, including recompiling{' '}
        <code>runtime</code> and <code>fmt</code> for each one. And they genuinely run — the Linux
        builds were executed in an Alpine container, which is a <strong>musl</strong> distro with no
        glibc at all, so a dynamically linked binary would have failed:
      </p>

      <CodeBlock language="text" title="Real output — docker 29.1.2, alpine:3, binaries mounted read-only">
{`$ docker run --rm --platform linux/arm64 -v "$PWD/dist:/dist:ro" alpine:3 /dist/xc-linux-arm64
built for linux/arm64 by go1.25.5

$ docker run --rm --platform linux/amd64 -v "$PWD/dist:/dist:ro" alpine:3 /dist/xc-linux-amd64
built for linux/amd64 by go1.25.5`}
      </CodeBlock>

      <InfoBox variant="warning" title="cgo is where cross-compilation stops being free">
        <p>
          The moment any package in your build uses <code>import &quot;C&quot;</code>, a C compiler
          and the target&apos;s headers enter the picture, and your Mac does not have Linux ones. I
          added a nine-line cgo file to the program above:
        </p>
        <CodeBlock language="go" title="cgo.go">
{`package main

/*
#include <unistd.h>
*/
import "C"

// pageSize calls the host's C library directly.
func pageSize() int { return int(C.getpagesize()) }`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go1.25.5 on darwin/arm64">
{`$ go build -o xc-native . && ./xc-native
built for darwin/arm64 by go1.25.5, page size 16384

$ CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o /dev/null .
# runtime/cgo
linux_syscall.c:67:13: error: call to undeclared function 'setresgid'; ISO C99 and later do
  not support implicit function declarations [-Wimplicit-function-declaration]
linux_syscall.c:67:13: note: did you mean 'setregid'?
/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/unistd.h:607:6: note:
  'setregid' declared here

$ CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /dev/null .
# example.com/xc
./main.go:10:52: undefined: pageSize`}
        </CodeBlock>
        <p>
          Two distinct failures worth separating. The first: Apple&apos;s clang and the macOS SDK
          were handed Linux C source. The second is the subtler one — <code>CGO_ENABLED=0</code>{' '}
          does not disable cgo, it <strong>excludes every file that imports{' '}
          <code>&quot;C&quot;</code></strong> via an implicit build constraint, so{' '}
          <code>pageSize</code> stopped existing and the Go code referencing it stopped compiling.
          Silently dropping files is a surprising failure mode the first time you meet it.
        </p>
        <p>
          In practice: keep <code>CGO_ENABLED=0</code> and stay on pure-Go libraries (
          <code>modernc.org/sqlite</code> rather than <code>mattn/go-sqlite3</code>,{' '}
          <code>jackc/pgx</code> rather than anything wrapping libpq). If you truly need cgo for a
          foreign target, build inside a container for that target or use a cross-toolchain like{' '}
          <code>zig cc</code>. Note also that the macOS <code>net</code> and <code>os/user</code>{' '}
          packages have cgo-backed implementations, so <code>CGO_ENABLED=0</code> changes DNS
          resolution behaviour on darwin — another reason your real builds should happen on Linux.
        </p>
      </InfoBox>

      <h2>Multi-Module Repos: <code>go.work</code></h2>
      <p>
        The npm-workspaces situation: a repo with a service and a shared SDK, and you want the
        service to build against your uncommitted SDK changes. The old answer was a{' '}
        <code>replace</code> directive in <code>go.mod</code>, which you then had to remember to
        strip before release. Since Go 1.18 there is a mechanism that leaves <code>go.mod</code>{' '}
        alone:
      </p>

      <CodeBlock language="bash" title="Terminal — ./api (module example.com/api) and ./sdk (module example.com/sdk)">
{`cd api && go build ./...          # api imports example.com/sdk
cd ..
go work init ./api ./sdk
cat go.work
cd api && go run .
cat go.mod`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`main.go:6:2: no required module provides package example.com/sdk; to add it:
	go get example.com/sdk

go 1.25.5

use (
	./api
	./sdk
)

hello ada

module example.com/api

go 1.25.5`}
      </CodeBlock>

      <p>
        The import resolved to <code>./sdk</code> on disk, and <code>api/go.mod</code> is byte-for-byte
        unchanged — no <code>replace</code> to forget. <strong>Do not commit{' '}
        <code>go.work</code></strong> for a repo whose modules are consumed independently; it is a
        local development override, and committing it makes CI build against your layout instead of
        published versions. <code>.gitignore</code> it. (For a monorepo where the modules are only
        ever built together, committing it is the pragmatic choice — but make that a decision, not
        an accident.)
      </p>

      <h2>The Commands You Will Actually Type</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Command</th>
            <th style={headStyle}>When</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go mod init github.com/you/thing</code></td>
            <td style={cellStyle}>once, at the start</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go mod tidy</code></td>
            <td style={cellStyle}>after any import change; in CI with <code>git diff --exit-code</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go build ./...</code></td>
            <td style={cellStyle}>does the whole module still compile</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go run .</code></td>
            <td style={cellStyle}>inner loop on a scratch program</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go test ./...</code></td>
            <td style={cellStyle}>every commit. Add <code>-race</code> in CI.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go vet ./...</code></td>
            <td style={cellStyle}>every commit (partially implied by <code>go test</code>)</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>gofmt -l .</code></td>
            <td style={cellStyle}>CI gate: non-empty output means someone bypassed their editor</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go get -u ./... &amp;&amp; go mod tidy</code></td>
            <td style={cellStyle}>deliberate dependency upgrade, on its own branch</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go install pkg@version</code></td>
            <td style={cellStyle}>install a CLI tool</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go doc pkg.Symbol</code></td>
            <td style={cellStyle}>constantly, instead of opening a browser</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>go env -w KEY=value</code></td>
            <td style={cellStyle}>persist a setting without touching your shell profile</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build</code></td>
            <td style={cellStyle}>release build for your deploy target</td>
          </tr>
        </tbody>
      </table>

      <p>
        The <a href="/go/cheatsheet">Go Field Guide</a> at the end of this section keeps the printable
        version of that table, along with the flags worth memorising. Project layout —{' '}
        <code>cmd/</code>, <code>internal/</code>, and how <code>internal</code> is enforced by the
        compiler rather than by convention — belongs to{' '}
        <a href="/go/deploy">Project Layout, Build &amp; Deploy</a> rather than here.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          The through-line of this lesson is that Go removed choices: one formatter with no options,
          one version per module instead of a resolved tree, one toolchain binary instead of a
          devDependencies block, versions as git tags instead of a registry. Each removal costs
          something real — you cannot have two incompatible versions of a library at the same import
          path, you cannot configure your formatter, you cannot have ranges that pick up patches
          automatically.
        </p>
        <p>
          Worth deciding for yourself which of those trades you actually like, because the same
          instinct shows up in the language itself, and the <a href="/go/syntax">next lesson</a> is
          full of it: one loop keyword, no implicit conversions, no <code>undefined</code>, and
          exactly one zero value per type.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Setup;
