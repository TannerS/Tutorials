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

export default function Testing() {
  return (
    <LessonLayout
      title="Testing Without a Framework"
      sectionId="go"
      lessonIndex={15}
      prev={{ path: '/go/generics', label: 'Generics' }}
      next={{ path: '/go/http', label: 'HTTP Services with net/http' }}
    >
      <p>
        Open a Node repo and count what testing costs you before you write an assertion: a runner
        (<code>jest</code>, <code>vitest</code>, <code>node:test</code>), a transform
        (<code>babel-jest</code> or <code>ts-jest</code> or <code>swc</code>), a config file, an
        assertion library, a mocking library, a coverage tool, and a <code>test</code> script to
        glue them together. In Java it is JUnit plus AssertJ plus Mockito plus a Surefire config.
      </p>
      <p>
        In Go the answer to all of that is: it is already installed. <code>go test</code> is part of
        the toolchain, <code>testing</code> is part of the standard library, coverage and
        benchmarking and fuzzing and race detection are flags on the same command, and the
        conventional project has <strong>zero</strong> testing dependencies. There is also no{' '}
        <code>describe</code>, no <code>it</code>, no <code>beforeEach</code>, no{' '}
        <code>expect(x).toBe(y)</code>, and — by default — no assertion function at all. You write{' '}
        <code>if got != want</code>.
      </p>
      <p>
        That last part is the culture shock, and your first instinct will be that something is
        missing. Give it a week. The thing Go is buying with that austerity is that every Go test in
        the world looks the same, and you can read a test in an unfamiliar repo without first
        learning its testing dialect.
      </p>

      <InfoBox variant="note" title="What was run for this lesson">
        <p>
          Go <strong>1.27.2</strong> is the current stable release. Every output block below is real
          output from the locally installed <strong>go1.25.5 darwin/arm64</strong> toolchain on an
          Apple M4 Pro (14 logical CPUs). Third-party comparisons used{' '}
          <strong>testify v1.12.1</strong> and <strong>go-cmp v0.7.0</strong>, resolved today. Two
          of my own predicted outputs turned out to be wrong while writing this; both are left in,
          with the real output, because the mistakes are instructive.
        </p>
      </InfoBox>

      <h2>The Rules, Which Are All Conventions</h2>

      <CodeBlock language="text" title="Everything go test knows about your tests">
{`File must be named       *_test.go           (excluded from normal builds)
Package                  same package, OR <pkg>_test for an external test package
Test function            func TestXxx(t *testing.T)
Benchmark                func BenchmarkXxx(b *testing.B)
Fuzz target              func FuzzXxx(f *testing.F)
Example                  func ExampleXxx()   with an // Output: comment
Setup/teardown for a
whole package            func TestMain(m *testing.M)
Test data directory      testdata/           (ignored by the go tool entirely)

Xxx must start with an upper-case letter or a non-letter. 'Testsomething'
is not a test; it is a function nobody calls.`}
      </CodeBlock>

      <p>
        Note what is <em>not</em> in that list: an annotation. No <code>@Test</code>, no decorator,
        no registration call. The <code>go</code> tool reads your test files, finds functions whose
        names match those shapes, and generates a <code>main()</code> that calls them. That is the
        entire discovery mechanism.
      </p>

      <FlowChart
        title="What `go test ./...` actually does"
        chart={"graph TD\n  CMD[\"go test ./...\"] --> SCAN[\"find every package under ./...\"]\n  SCAN --> PER[\"for EACH package, independently\"]\n  PER --> V[\"run a subset of go vet<br/>printf, tests, atomic, bools...\"]\n  V -->|\"vet fails\"| VF[\"FAIL [build failed]<br/>no tests run\"]\n  V -->|\"vet clean\"| GEN[\"generate a main() that registers<br/>TestXxx, BenchmarkXxx, FuzzXxx, ExampleXxx\"]\n  GEN --> LINK[\"compile + link ONE TEST BINARY per package<br/>package code + _test.go files + the generated main\"]\n  LINK --> RUN[\"exec the binary\"]\n  RUN --> CACHE[\"cache the result keyed on inputs<br/>unchanged package => '(cached)'\"]\n  PER -.->|\"up to -p packages at once<br/>default GOMAXPROCS\"| PER\n  style VF fill:#3b1a1a,stroke:#f87171\n  style LINK fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>
        Two consequences of that diagram are worth internalising early. First,{' '}
        <strong>a test binary is a real program</strong> — you can build it with{' '}
        <code>go test -c</code>, copy it somewhere, and run it under a debugger or a loop. Second,{' '}
        <strong><code>go test</code> runs <code>go vet</code> for you</strong>, and vet failures are
        build failures, not warnings:
      </p>

      <CodeBlock language="go" title="textutil/vet_test.go — one argument short">
{`package textutil

import "testing"

func TestVetCatchesThis(t *testing.T) {
	t.Errorf("slug = %q, want %q", Slug("Hello"))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test ./textutil/, go1.25.5">
{`# example.com/svc/textutil
# [example.com/svc/textutil]
textutil/vet_test.go:6:28: (*testing.common).Errorf format %q reads arg #2, but call has 1 arg
FAIL	example.com/svc/textutil [build failed]`}
      </CodeBlock>

      <p>
        A Jest snapshot of a wrong format string is a silently malformed message. Here it is a red
        build. The vet checks that run during <code>go test</code> are a deliberately small, very
        high-signal subset (<code>printf</code>, <code>tests</code>, <code>atomic</code>,{' '}
        <code>bools</code>, and a few others) — the full <code>go vet ./...</code> runs more.
      </p>

      <h2>Your First Test, and What a Failure Looks Like</h2>

      <p>
        Here is the package under test for this whole lesson: two string helpers of the kind that
        accumulate in every service.
      </p>

      <CodeBlock language="go" title="textutil/textutil.go">
{`// Package textutil holds small string helpers used by the API layer.
package textutil

import "strings"

const ellipsis = "…"

// Truncate shortens s to at most max bytes, appending an ellipsis if it had
// to cut anything. If max is less than the ellipsis itself, it returns "".
func Truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	if max < len(ellipsis) {
		return ""
	}
	return s[:max-len(ellipsis)] + ellipsis
}

// Slug lowercases s and replaces every run of non-alphanumeric bytes with a
// single hyphen, trimming hyphens from both ends.
func Slug(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	lastHyphen := true // suppresses a leading hyphen
	for _, r := range strings.ToLower(s) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			lastHyphen = false
		default:
			if !lastHyphen {
				b.WriteByte('-')
				lastHyphen = true
			}
		}
	}
	return strings.TrimSuffix(b.String(), "-")
}`}
      </CodeBlock>

      <p>
        And here is the simplest possible test of it. Note the four things it does not have: an
        import of an assertion library, a <code>describe</code> block, a lifecycle hook, and a
        return value.
      </p>

      <CodeBlock language="go" title="textutil/textutil_test.go — the minimal shape">
{`package textutil

import "testing"

func TestSlugSimple(t *testing.T) {
	got := Slug("Hello World")
	want := "hello-world"
	if got != want {
		t.Errorf("Slug(%q) = %q, want %q", "Hello World", got, want)
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Failure reporting: the two that matter">
{`t.Errorf(...)   mark this test failed, KEEP RUNNING.  Jest: expect() that
                                                      does not throw.
t.Fatalf(...)   mark failed and STOP this test now.   Jest: a thrown error.
                Calls runtime.Goexit, so defers run.

t.Error / t.Fatal   same, without the format string
t.Log / t.Logf      only printed for failing tests, or with -v
t.Skip / t.Skipf    report as skipped
t.Helper()          see below
t.Cleanup(f)        LIFO teardown. Like afterEach, but scoped to one test.
t.TempDir()         a directory deleted for you when the test ends
t.Setenv(k, v)      env var restored afterwards; forbids t.Parallel
t.Context()         a context cancelled just before Cleanup runs (1.24+)

Message convention, universally followed:
    got X, want Y        — in that order, with %q for strings`}
      </CodeBlock>

      <InfoBox variant="warning" title="t.Fatalf inside a goroutine does not work">
        <p>
          <code>t.Fatalf</code> stops the test by calling <code>runtime.Goexit</code>, which only
          ends <em>the goroutine that called it</em>. Call it from a goroutine you launched and the
          test keeps going, having neither failed fast nor cleaned up properly. The{' '}
          <code>testing</code> package documents this explicitly: <code>FailNow</code> must be
          called from the goroutine running the test. In a goroutine, use <code>t.Errorf</code>{' '}
          and return.
        </p>
      </InfoBox>

      <h2>Table-Driven Tests: The Idiom</h2>

      <p>
        This is the single most important thing in the lesson. Table-driven testing is not <em>a</em>{' '}
        Go pattern, it is <strong>the</strong> Go pattern — it is how the standard library itself is
        tested, and a Go reviewer will expect it by default. It is Go&apos;s answer to{' '}
        <code>it.each</code> in Jest and <code>@ParameterizedTest</code> in JUnit 5, except that it
        needs no framework support because it is a slice and a loop.
      </p>

      <CodeBlock language="go" title="textutil/textutil_test.go — the canonical shape">
{`func TestSlug(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		{"simple", "Hello World", "hello-world"},
		{"already a slug", "already-a-slug", "already-a-slug"},
		{"punctuation collapses", "Go: Testing, Properly!", "go-testing-properly"},
		{"leading and trailing junk", "  --Go--  ", "go"},
		{"digits survive", "HTTP 2 vs HTTP 3", "http-2-vs-http-3"},
		{"empty", "", ""},
		{"all punctuation", "!!!", ""},
		{"unicode is dropped", "café", "caf"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := Slug(tt.in); got != tt.want {
				t.Errorf("Slug(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}`}
      </CodeBlock>

      <p>
        Every element of that is load-bearing:
      </p>
      <ul>
        <li>
          <strong>An anonymous struct declared inline.</strong> Not a named type — the table is used
          once, so naming it is noise. This is one of the few places Go idiom likes anonymous
          structs.
        </li>
        <li>
          <strong>A <code>name</code> field, always first.</strong> It becomes the subtest name, so
          it is also your <code>-run</code> filter and your failure label.
        </li>
        <li>
          <strong>Positional literals</strong> (<code>{'{"simple", "Hello World", "hello-world"}'}</code>),
          not field names. The table reads as a data table. Switch to named fields the moment you
          have more than about five columns or an optional one.
        </li>
        <li>
          <strong><code>t.Run</code> per row.</strong> This is what makes a failing row identifiable
          and independently runnable, and it is why you should never write a table-driven test
          without it.
        </li>
        <li>
          <strong>The assertion inlined in the <code>if</code>.</strong>{' '}
          <code>if got := f(x); got != tt.want</code> is the house style.
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — go test -v ./textutil/, go1.25.5">
{`=== RUN   TestSlug
=== RUN   TestSlug/simple
=== RUN   TestSlug/already_a_slug
=== RUN   TestSlug/punctuation_collapses
=== RUN   TestSlug/leading_and_trailing_junk
=== RUN   TestSlug/digits_survive
=== RUN   TestSlug/empty
=== RUN   TestSlug/all_punctuation
=== RUN   TestSlug/unicode_is_dropped
--- PASS: TestSlug (0.00s)
    --- PASS: TestSlug/simple (0.00s)
    --- PASS: TestSlug/already_a_slug (0.00s)
    --- PASS: TestSlug/punctuation_collapses (0.00s)
    --- PASS: TestSlug/leading_and_trailing_junk (0.00s)
    --- PASS: TestSlug/digits_survive (0.00s)
    --- PASS: TestSlug/empty (0.00s)
    --- PASS: TestSlug/all_punctuation (0.00s)
    --- PASS: TestSlug/unicode_is_dropped (0.00s)
PASS
ok  	example.com/svc/textutil	0.302s`}
      </CodeBlock>

      <p>
        Spaces in subtest names become underscores, which matters when you want to re-run one.
      </p>

      <InfoBox variant="danger" title="A real failure — and the mistake was mine">
        <p>
          The second table in this package tests <code>Truncate</code>. I wrote the expectations by
          reasoning about the code rather than running it, and got one wrong. Here is exactly what{' '}
          <code>go test</code> said:
        </p>
        <CodeBlock language="text" title="Real output — go test ./textutil/, go1.25.5">
{`--- FAIL: TestTruncate (0.00s)
    --- FAIL: TestTruncate/needs_cutting (0.00s)
        textutil_test.go:47: Truncate("hello world", 8) = "hello…", want "hel…"
FAIL
FAIL	example.com/svc/textutil	0.308s
FAIL`}
        </CodeBlock>
        <p>
          I had expected <code>&quot;hel…&quot;</code>, reasoning that an ellipsis takes one
          character. It does not: <code>&quot;…&quot;</code> is <strong>U+2026, three bytes in
          UTF-8</strong>, so <code>max-len(ellipsis)</code> is 5, not 7, and the correct answer is{' '}
          <code>&quot;hello…&quot;</code> — which is exactly 8 bytes, as documented. The code was
          right and my expectation was wrong.
        </p>
        <p>
          Notice how much the failure message did for you: the function, the exact inputs, got, and
          want, all on one line. That is the entire payoff of the <code>got X, want Y</code>{' '}
          convention, and it is why Go does not need an assertion library to produce a useful
          failure. An <code>assert.True(t, ok)</code> would have told you only that something was
          false.
        </p>
      </InfoBox>

      <h3>Subtests do more than name rows</h3>

      <CodeBlock language="go" title="What t.Run buys you">
{`t.Run("name", func(t *testing.T) { ... })

// 1. Addressable by -run, with a / separator per nesting level.
// 2. An independent failure scope: one row failing does not stop the others.
// 3. Its own t, so t.Fatalf inside a row aborts THAT ROW only.
// 4. Its own t.Cleanup / t.TempDir / t.Setenv lifetime.
// 5. Can be made parallel per row with t.Parallel().
// 6. Returns bool — false if the subtest failed — so you can gate on it.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — selecting rows, go1.25.5">
{`$ go test -list '.*' ./textutil/
TestSlug
TestTruncate
ok  	example.com/svc/textutil	0.298s

$ go test -v -run 'TestSlug/punctuation' ./textutil/
=== RUN   TestSlug
=== RUN   TestSlug/punctuation_collapses
=== RUN   TestSlug/all_punctuation
--- PASS: TestSlug (0.00s)
    --- PASS: TestSlug/punctuation_collapses (0.00s)
    --- PASS: TestSlug/all_punctuation (0.00s)
PASS
ok  	example.com/svc/textutil	0.291s`}
      </CodeBlock>

      <p>
        Look at that second command: <code>-run &apos;TestSlug/punctuation&apos;</code> matched{' '}
        <strong>both</strong> <code>punctuation_collapses</code> and <code>all_punctuation</code>.{' '}
        <code>-run</code> takes a slash-separated list of <em>unanchored</em> regular expressions,
        one per nesting level, so a substring matches anywhere in the name. If you want exactly one
        row, anchor it: <code>-run &apos;^TestSlug$/^all_punctuation$&apos;</code>.
      </p>

      <h3><code>t.Helper()</code>: make failures point at the caller</h3>

      <p>
        As soon as you factor an assertion into a function, failures start reporting the line inside
        the helper, which is useless — every row blames the same line. One call fixes it.
      </p>

      <CodeBlock language="go" title="helper_test.go">
{`package helperdemo

import "testing"

// No t.Helper(). Failures are attributed to the line INSIDE this function.
func assertEqBad(t *testing.T, got, want string) {
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

// With t.Helper(). Failures are attributed to the CALLER.
func assertEq(t *testing.T, got, want string) {
	t.Helper()
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}

func TestWithoutHelper(t *testing.T) {
	assertEqBad(t, "a", "b")
	assertEqBad(t, "c", "d")
}

func TestWithHelper(t *testing.T) {
	assertEq(t, "a", "b")
	assertEq(t, "c", "d")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test ./helperdemo/, go1.25.5">
{`--- FAIL: TestWithoutHelper (0.00s)
    helper_test.go:8: got "a", want "b"
    helper_test.go:8: got "c", want "d"
--- FAIL: TestWithHelper (0.00s)
    helper_test.go:26: got "a", want "b"
    helper_test.go:27: got "c", want "d"
FAIL
FAIL	example.com/svc/helperdemo	0.356s
FAIL`}
      </CodeBlock>

      <p>
        Both failures in <code>TestWithoutHelper</code> point at <code>helper_test.go:8</code> — the{' '}
        <code>t.Errorf</code> inside the helper. With <code>t.Helper()</code>, they point at lines{' '}
        <strong>26 and 27</strong>, the actual call sites. The rule is simple:{' '}
        <strong>any test function that takes a <code>*testing.T</code> and is not itself a test
        starts with <code>t.Helper()</code></strong>. Test fixtures and setup functions too, not
        just assertions.
      </p>

      <h2>The <code>testify</code> Question</h2>

      <p>
        You will hit this in your first week, and you should know both sides rather than pick up a
        slogan. <code>stretchr/testify</code> is the most-imported Go testing library by a wide
        margin; a large fraction of production Go code uses it; and a large fraction of experienced
        Go developers will tell you not to. Both of those are true at the same time.
      </p>

      <p>
        Here is the same wrong expectation, asserted three ways, with the real failure output from
        each. Judge the ergonomics yourself.
      </p>

      <CodeBlock language="go" title="The three dialects">
{`// 1. Standard library.
if !reflect.DeepEqual(got, want) {
	t.Errorf("Load(1) =\\n  %+v\\nwant\\n  %+v", got, want)
}

// 2. testify.
assert.Equal(t, want, got)   // records a failure, keeps going
require.Equal(t, want, got)  // records a failure and calls FailNow

// 3. google/go-cmp — the semi-official middle ground.
if diff := cmp.Diff(want, got); diff != "" {
	t.Errorf("Load(1) mismatch (-want +got):\\n%s", diff)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — reflect.DeepEqual, go1.25.5">
{`--- FAIL: TestLoadStdlib (0.00s)
    stdlib_test.go:12: Load(1) =
          {ID:1 Name:Ada Tags:[admin beta] Email:ada@example.com}
        want
          {ID:1 Name:Ada Tags:[admin gamma] Email:ada@example.com}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — testify v1.12.1 (one of the two assertions shown)">
{`--- FAIL: TestLoadTestify (0.00s)
    testify_test.go:13:
        	Error Trace:	/.../testifydemo/testify_test.go:13
        	Error:      	Not equal:
        	            	expected: testifydemo.User{ID:1, Name:"Ada", Tags:[]string{"admin", "gamma"}, Email:"ada@example.com"}
        	            	actual  : testifydemo.User{ID:1, Name:"Ada", Tags:[]string{"admin", "beta"}, Email:"ada@example.com"}

        	            	Diff:
        	            	--- Expected
        	            	+++ Actual
        	            	@@ -5,3 +5,3 @@
        	            	   (string) (len=5) "admin",
        	            	-  (string) (len=5) "gamma"
        	            	+  (string) (len=4) "beta"
        	            	  },
        	Test:       	TestLoadTestify`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go-cmp v0.7.0">
{`--- FAIL: TestLoadGoCmp (0.00s)
    cmp_test.go:13: Load(1) mismatch (-want +got):
          testifydemo.User{
          	ID:   1,
          	Name: "Ada",
          	Tags: []string{
          		"admin",
        - 		"gamma",
        + 		"beta",
          	},
          	Email: "ada@example.com",
          }
`}
      </CodeBlock>

      <h3>The case for testify</h3>
      <ul>
        <li>
          <strong>Deep comparison with a readable diff, for free.</strong> The stdlib version above
          made me eyeball two 60-character lines to spot <code>beta</code> vs <code>gamma</code>.
          For a 20-field struct that is genuinely bad.
        </li>
        <li>
          <strong><code>require</code> saves a mountain of <code>if err != nil</code>.</strong>{' '}
          <code>require.NoError(t, err)</code> is one line where the stdlib wants three, and in a
          test with eight setup steps that is a real reduction in noise.
        </li>
        <li>
          <strong>It is what your team already uses.</strong> Consistency inside a repo beats
          purity. Introducing a second dialect to an existing testify codebase is worse than either
          choice alone.
        </li>
        <li>
          <strong>Onboarding.</strong> A room full of JUnit and Jest developers reads{' '}
          <code>assert.Equal</code> immediately.
        </li>
      </ul>

      <h3>The case against</h3>
      <ul>
        <li>
          <strong>Argument order is a coin flip.</strong> <code>assert.Equal(t, expected, actual)</code>{' '}
          — expected first. Go&apos;s own convention is <code>got, want</code>. Every mixed-dialect
          codebase has reversed-argument failures that read exactly backwards.
        </li>
        <li>
          <strong><code>assert</code> versus <code>require</code> is a real footgun.</strong> Use{' '}
          <code>assert.NoError(t, err)</code> where you meant <code>require</code> and the test
          continues into a nil dereference, turning a clear failure into a panic. Both exist, they
          look identical, and nothing warns you.
        </li>
        <li>
          <strong>It drags in dependencies, and it reaches for reflection.</strong> Measured just now
          in an otherwise empty module:
          <CodeBlock language="text" title="Real output — go mod tidy then go list -m all, go1.25.5">
{`--- importing github.com/stretchr/testify/assert ---
require github.com/stretchr/testify v1.12.1
require go.yaml.in/yaml/v3 v3.0.5 // indirect

$ go list -m all
example.com/dep
github.com/stretchr/objx v0.5.3
github.com/stretchr/testify v1.12.1
go.yaml.in/yaml/v3 v3.0.5

--- importing github.com/google/go-cmp/cmp ---
require github.com/google/go-cmp v0.7.0

$ go list -m all
example.com/dep
github.com/google/go-cmp v0.7.0`}
          </CodeBlock>
        </li>
        <li>
          <strong>It encourages assertions that say nothing.</strong>{' '}
          <code>assert.True(t, valid)</code> produces a failure message with no values in it. The
          stdlib&apos;s lack of a <code>True</code> helper nudges you into writing the message.
        </li>
        <li>
          <strong>It does not compose with table-driven tests as well as it looks like it will,</strong>{' '}
          because the useful information is in <code>tt.name</code> and the inputs, which testify
          does not know about unless you pass them as the optional message argument — at which point
          you are writing the <code>Errorf</code> anyway.
        </li>
      </ul>

      <InfoBox variant="tip" title="A defensible position for a new codebase">
        <p>
          Use the standard library for comparisons of scalars and short strings, which is most
          assertions. Add <strong><code>google/go-cmp</code></strong> for struct and slice
          comparison — it has the best diff of the three, takes one dependency and no indirect ones,
          is written by the Go team (though not part of the standard library), handles unexported
          fields explicitly rather than silently, and keeps you in <code>got, want</code> order
          because <em>you</em> write the <code>Errorf</code>. Reach for{' '}
          <code>require.NoError</code> only if the <code>if err != nil</code> volume is genuinely
          hurting, and if you do, use <code>require</code> and not <code>assert</code> as the
          default import so the dangerous one is the one you have to type deliberately.
        </p>
        <p>
          And if you join a team that already uses testify everywhere: use testify. This is not a
          hill.
        </p>
      </InfoBox>

      <h2>The Flags You Will Actually Type</h2>

      <CodeBlock language="bash" title="go test, in order of how often you will use it">
{`go test ./...                    # everything. The default verb.
go test -v ./...                 # show every test and all t.Log output
go test -run 'TestSlug' ./...    # unanchored regex, / per subtest level
go test -count=1 ./...           # THE way to defeat the test cache
go test -race ./...              # see below. Use this in CI.
go test -cover ./...             # coverage % per package
go test -failfast ./...          # stop after the first failure
go test -timeout 30s ./...       # default is 10m, then a goroutine dump
go test -shuffle=on ./...        # randomise order; prints the seed
go test -json ./... | ...        # machine-readable, for CI reporters
go test -c -o ./svc.test ./api   # build the test binary without running it
go test -list '.*' ./...         # what tests exist, run nothing`}
      </CodeBlock>

      <InfoBox variant="info" title="The test cache will confuse you once">
        <p>
          <code>go test</code> caches successful results keyed on the package&apos;s inputs, and
          prints <code>(cached)</code> instead of re-running. That is wonderful for a big repo and
          baffling the first time you are debugging something environmental and the suite refuses to
          run. <code>-count=1</code> is the idiomatic cache-buster — not a flag called{' '}
          <code>-no-cache</code>, which does not exist.
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go test ./...
ok  	example.com/svc/api	(cached)
ok  	example.com/svc/textutil	(cached)`}
        </CodeBlock>
      </InfoBox>

      <h3><code>-race</code>: the flag that justifies itself</h3>

      <p>
        The <a href="/go/goroutines">goroutines lesson</a> made the point that Go hands you back the
        data races Node&apos;s single thread was protecting you from. <code>-race</code> is where you
        catch them, and it belongs in CI. Here is a counter with no synchronisation and a test that
        increments it from N goroutines:
      </p>

      <CodeBlock language="go" title="counter/counter.go and counter/counter_test.go">
{`type Total struct {
	n int
}

func (t *Total) Inc()       { t.n++ }
func (t *Total) Value() int { return t.n }

// ---- test ----
func TestTotalIsNotThreadSafe(t *testing.T) {
	var total Total
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			total.Inc()
		}()
	}
	wg.Wait()

	if got := total.Value(); got != n {
		t.Errorf("Value() = %d, want %d", got, n)
	}
}`}
      </CodeBlock>

      <p>
        The code is unambiguously broken. The question is whether your test suite tells you.
        Measured by running the compiled test binary in a loop, at three levels of contention:
      </p>

      <CodeBlock language="text" title="Real measurement — go1.25.5, Apple M4 Pro, 14 logical CPUs">
{`                          test went GREEN     test went RED
no -race,  n=4                190 / 200          10 / 200
no -race,  n=10               177 / 200          23 / 200
no -race,  n=100               59 / 200         141 / 200

with -race, n=4                 0 / 30           30 / 30
with -race, n=10                0 / 30           30 / 30
with -race, n=100               0 / 30           30 / 30`}
      </CodeBlock>

      <p>
        Read the top row again. With four goroutines, <strong>a test over definitively broken code
        passed 95% of the time</strong>. That is the shape of every concurrency bug you will ever
        chase: not a failure, a <em>probability</em> of failure, which varies with load, with the
        machine, and with how busy CI is that morning. With <code>-race</code> it is red 30 times
        out of 30, at every contention level, and it tells you exactly where:
      </p>

      <CodeBlock language="text" title="Real output — go test -race ./counter/, go1.25.5 (abridged)">
{`==================
WARNING: DATA RACE
Read at 0x00c0000a2188 by goroutine 13:
  example.com/svc/counter.(*Total).Inc()
      /.../counter/counter.go:9 +0x70
  example.com/svc/counter.TestTotalIsNotThreadSafe.func1()
      /.../counter/counter_test.go:15 +0x6c

Previous write at 0x00c0000a2188 by goroutine 9:
  example.com/svc/counter.(*Total).Inc()
      /.../counter/counter.go:9 +0x80
  example.com/svc/counter.TestTotalIsNotThreadSafe.func1()
      /.../counter/counter_test.go:15 +0x6c

Goroutine 13 (running) created at:
  example.com/svc/counter.TestTotalIsNotThreadSafe()
      /.../counter/counter_test.go:13 +0x70
==================`}
      </CodeBlock>

      <p>
        Both racing stacks, the address, and the line that spawned each goroutine. Note{' '}
        <strong><code>-race</code> only reports races it actually observes</strong> — it is a dynamic
        detector instrumenting real memory accesses, not a static analysis. Code paths your tests do
        not exercise are invisible to it, which is the strongest practical argument for having tests
        that drive concurrency at all. It also costs you: expect roughly 2&ndash;10&times; slower
        execution and several times the memory, which is why it is a CI flag rather than a default.
      </p>

      <InfoBox variant="warning" title="A real race the runtime caught for me, and a mutex is the fix">
        <p>
          The API package in this lesson originally had an unsynchronised{' '}
          <code>map[string]int</code> hit counter, and a 20-goroutine handler test. Without{' '}
          <code>-race</code> it still failed about half the time — but with{' '}
          <code>fatal error: concurrent map writes</code>, which is the Go <em>runtime&apos;s</em>{' '}
          own unconditional check, not the race detector. Maps are special-cased like that; a plain{' '}
          <code>int</code> is not, which is why the <code>Total</code> example above is the honest
          demonstration. The fix is the boring one from{' '}
          <a href="/go/sync">the sync lesson</a> — a <code>sync.Mutex</code> in the struct, locked
          in both <code>Inc</code> and <code>Get</code> — after which{' '}
          <code>go test -race ./...</code> is clean:
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go test -race ./...
ok  	example.com/svc/api	1.299s
ok  	example.com/svc/textutil	1.452s`}
        </CodeBlock>
      </InfoBox>

      <h3><code>-cover</code>, and why the number lies</h3>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go test -count=1 -cover ./...
ok  	example.com/svc/api	0.389s	coverage: 90.0% of statements
ok  	example.com/svc/textutil	0.205s	coverage: 100.0% of statements

$ go test -count=1 -coverprofile=cover.out ./... && go tool cover -func=cover.out
example.com/svc/api/api.go:17:			NewCounter	100.0%
example.com/svc/api/api.go:19:			Inc		100.0%
example.com/svc/api/api.go:25:			Get		100.0%
example.com/svc/api/api.go:38:			NewHandler	84.6%
example.com/svc/textutil/textutil.go:13:	Truncate	100.0%
example.com/svc/textutil/textutil.go:30:	Slug		100.0%
total:						(statements)	94.9%`}
      </CodeBlock>

      <p>
        <code>go tool cover -html=cover.out</code> opens a browser view with every uncovered
        statement highlighted in red, which is the part actually worth looking at. Two things a
        Jest user should know: Go measures <strong>statement</strong> coverage, not branch or line
        coverage, so the percentages are not comparable to Istanbul&apos;s; and{' '}
        <code>-coverpkg</code> is how you count coverage of package A caused by tests in package B,
        which <code>-cover</code> alone does not do.
      </p>

      <InfoBox variant="danger" title="100% statement coverage, and the function was still broken">
        <p>
          That <code>textutil 100.0%</code> is not a humblebrag, it is a warning. The{' '}
          <code>Truncate</code> shown earlier in this lesson has a real bug — it slices a string by
          byte offset, so it can cut a multi-byte rune in half. The eight-row table and the
          five-row table never hit it. Measured on the broken version, with only the table-driven
          tests present:
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5, broken Truncate, table tests only">
{`$ go test -count=1 -cover .
ok  	example.com/covdemo	0.230s	coverage: 100.0% of statements

$ go tool cover -func=c.out
example.com/covdemo/textutil.go:10:	Truncate	100.0%
example.com/covdemo/textutil.go:22:	Slug		100.0%
total:					(statements)	100.0%`}
        </CodeBlock>
        <p>
          100.0%. Green suite. Shipping a function that produces invalid UTF-8. Coverage tells you
          which lines ran, never which <em>inputs</em> you forgot. The tool that finds this bug is
          in the next section, and it took it 0.17 seconds.
        </p>
      </InfoBox>

      <h2>Benchmarks Are Part of the Test File</h2>

      <p>
        No JMH, no <code>benchmark.js</code>, no separate harness. A <code>BenchmarkXxx</code>{' '}
        function goes in the same <code>_test.go</code> files, and <code>go test</code> finds it.
        Benchmarks do not run during a normal <code>go test</code>; you opt in with{' '}
        <code>-bench</code>.
      </p>

      <CodeBlock language="go" title="textutil/bench_test.go">
{`var input = "Go: Testing Without a Framework — Table-Driven Tests, Benchmarks & Fuzzing (2026)"

var sink string // package-level, so the compiler cannot optimise the call away

func BenchmarkSlugBuilder(b *testing.B) {
	for b.Loop() { // Go 1.24+. Before that: for i := 0; i < b.N; i++
		sink = Slug(input)
	}
}

func BenchmarkSlugConcat(b *testing.B) {
	for b.Loop() {
		sink = slugConcat(input) // out += string(r) in a loop
	}
}

func BenchmarkSlugRegexp(b *testing.B) {
	for b.Loop() {
		sink = slugRegexp(input) // regexp.ReplaceAllString
	}
}

// Sub-benchmarks: b.Run is the b analogue of t.Run.
func BenchmarkSlugByLength(b *testing.B) {
	for _, n := range []int{8, 64, 512} {
		in := strings.Repeat("Ab 1! ", n/6+1)[:n]
		b.Run("len="+itoa(n), func(b *testing.B) {
			b.ReportAllocs()
			b.SetBytes(int64(len(in))) // makes the MB/s column appear
			for b.Loop() {
				sink = Slug(in)
			}
		})
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -bench=. -benchmem -run='^$' ./textutil/, go1.25.5">
{`goos: darwin
goarch: arm64
pkg: example.com/svc/textutil
cpu: Apple M4 Pro
BenchmarkSlugBuilder-14     	 3192202	       370.1 ns/op	     192 B/op	       2 allocs/op
BenchmarkSlugConcat-14      	  618159	      1751 ns/op	    3568 B/op	     137 allocs/op
BenchmarkSlugRegexp-14      	  885766	      1379 ns/op	     442 B/op	       8 allocs/op
BenchmarkSlugByLength/len=8-14         	26861787	        44.06 ns/op	 181.58 MB/s	      16 B/op	       2 allocs/op
BenchmarkSlugByLength/len=64-14        	 5849733	       203.1 ns/op	 315.05 MB/s	     128 B/op	       2 allocs/op
BenchmarkSlugByLength/len=512-14       	  812433	      1502 ns/op	 340.83 MB/s	    1024 B/op	       2 allocs/op
PASS
ok  	example.com/svc/textutil	7.311s`}
      </CodeBlock>

      <p>
        How to read that: the <code>-14</code> suffix is <code>GOMAXPROCS</code>. The first number
        is how many iterations the harness chose — it is <em>not</em> a result, it is the sample
        size it needed to reach a stable measurement, which is why a &quot;faster&quot; benchmark
        shows a bigger number there. The columns you actually compare are{' '}
        <code>ns/op</code>, <code>B/op</code>, and <code>allocs/op</code>.
      </p>
      <p>
        And the result: <code>strings.Builder</code> at 370 ns and <strong>2 allocations</strong>,
        string concatenation at 1,751 ns and <strong>137 allocations</strong> — one per character
        appended, because strings are immutable — and the regexp version at 1,379 ns, nearly{' '}
        4&times; slower than the hand-written loop. The <code>len=</code> sub-benchmarks show a
        constant 2 allocations at 8, 64, and 512 bytes, which is the <code>b.Grow(len(s))</code> in{' '}
        <code>Slug</code> doing its job.
      </p>

      <CodeBlock language="text" title="Benchmark mechanics worth knowing">
{`-bench=.             run all benchmarks (it is a regex, like -run)
-bench=Slug          just the ones matching "Slug"
-run='^$'            run NO tests — pair it with -bench so the test
                     phase does not pollute your timings
-benchmem            add the B/op and allocs/op columns. Always use it.
-benchtime=5s        run each benchmark for 5s instead of ~1s
-benchtime=100x      run each benchmark exactly 100 iterations
-count=10            repeat each benchmark 10 times (for benchstat)
-cpu=1,4,14          run at several GOMAXPROCS values

In the function:
  b.Loop()           1.24+. Preferred: keeps the args alive, resets the
                     timer correctly, and runs the body exactly once per
                     iteration. Replaces the b.N loop.
  b.ReportAllocs()   force the alloc columns for this benchmark
  b.SetBytes(n)      adds a MB/s column
  b.ResetTimer()     discard setup time (b.Loop handles the common case)
  b.StopTimer() / b.StartTimer()   exclude per-iteration setup
  b.RunParallel(...) measure under concurrency

Comparing two runs: install golang.org/x/perf/cmd/benchstat and feed it
'go test -bench=X -count=10' output from before and after. A single run is
not evidence; the 512-byte row above moved by ~5% between runs.`}
      </CodeBlock>

      <h2>Fuzzing: Built In Since Go 1.18</h2>

      <p>
        This is the capability with no cheap equivalent in the Node or Java worlds, and it is one{' '}
        <code>go test</code> flag away. A fuzz target states a <em>property</em> that must hold for
        every input, seeds the engine with a few examples, and the engine mutates them under
        coverage guidance looking for a counterexample.
      </p>

      <FlowChart
        title="The fuzzing loop"
        chart={"graph TD\n  SEED[\"f.Add(...) seed corpus<br/>+ testdata/fuzz/FuzzName/* files\"] --> BASE[\"run every seed, gather baseline coverage\"]\n  BASE --> MUT[\"mutate an input<br/>14 worker processes here\"]\n  MUT --> EXEC[\"call f.Fuzz body with it\"]\n  EXEC --> CHK{\"t.Error, panic,<br/>or timeout?\"}\n  CHK -->|\"no, but NEW code covered\"| KEEP[\"keep it: 'new interesting'<br/>added to the in-memory corpus\"]\n  KEEP --> MUT\n  CHK -->|\"no, nothing new\"| MUT\n  CHK -->|\"YES\"| MIN[\"minimize the failing input\"]\n  MIN --> WRITE[\"write testdata/fuzz/FuzzName/HASH<br/>a committed regression test from now on\"]\n  WRITE --> FAIL[\"FAIL, with the exact input printed\"]\n  style FAIL fill:#3b1a1a,stroke:#f87171\n  style WRITE fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="go" title="textutil/fuzz_test.go">
{`func FuzzTruncate(f *testing.F) {
	// Seed corpus: the fuzzer starts from these and mutates them.
	f.Add("hello world", 8)
	f.Add("", 0)
	f.Add("café", 5)

	f.Fuzz(func(t *testing.T, s string, max int) {
		if max < 0 {
			t.Skip() // max < 0 is not a documented input
		}
		got := Truncate(s, max)

		// Property 1: never longer than max (unless max was too small for
		// the ellipsis, in which case we documented "").
		if len(got) > max && got != "" {
			t.Errorf("Truncate(%q, %d) = %q: len %d > max %d", s, max, got, len(got), max)
		}
		// Property 2: valid UTF-8 in, valid UTF-8 out.
		if utf8.ValidString(s) && !utf8.ValidString(got) {
			t.Errorf("Truncate(%q, %d) = %q: produced invalid UTF-8", s, max, got)
		}
	})
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -fuzz=FuzzTruncate -fuzztime=60s ./textutil/, go1.25.5">
{`fuzz: elapsed: 0s, gathering baseline coverage: 0/3 completed
fuzz: elapsed: 0s, gathering baseline coverage: 3/3 completed, now fuzzing with 14 workers
fuzz: minimizing 42-byte failing input file
fuzz: elapsed: 0s, minimizing
--- FAIL: FuzzTruncate (0.17s)
    --- FAIL: FuzzTruncate (0.00s)
        fuzz_test.go:27: Truncate("0é000", 5) = "0\\xc3…": produced invalid UTF-8

    Failing input written to testdata/fuzz/FuzzTruncate/fb74cf5a728e7eb4
    To re-run:
    go test -run=FuzzTruncate/fb74cf5a728e7eb4
FAIL
exit status 1
FAIL	example.com/svc/textutil	0.466s`}
      </CodeBlock>

      <p>
        <strong>0.17 seconds.</strong> The bug that 100% statement coverage and thirteen hand-written
        table rows missed. <code>Truncate(&quot;0é000&quot;, 5)</code>: with <code>max=5</code> and a
        3-byte ellipsis the cut lands at byte 2, which is the middle of the two-byte{' '}
        <code>é</code>, so the result starts with the orphaned lead byte <code>\xc3</code>. It also
        minimized a 42-byte discovery down to that five-character example on its own.
      </p>

      <p>
        Now look at what it left behind, because this is the part people miss. The failing input is
        written into <code>testdata/</code> as a plain text file, and from that moment it is part of
        your ordinary test suite — committed to git, run by <code>go test</code> with no{' '}
        <code>-fuzz</code> flag at all:
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ cat textutil/testdata/fuzz/FuzzTruncate/fb74cf5a728e7eb4
go test fuzz v1
string("0é000")
int(5)

$ go test -run=FuzzTruncate ./textutil/
--- FAIL: FuzzTruncate (0.00s)
    --- FAIL: FuzzTruncate/fb74cf5a728e7eb4 (0.00s)
        fuzz_test.go:27: Truncate("0é000", 5) = "0\\xc3…": produced invalid UTF-8
FAIL
FAIL	example.com/svc/textutil	0.293s
FAIL`}
      </CodeBlock>

      <p>
        The fix is to back the cut up to a rune boundary:
      </p>

      <CodeBlock language="go" title="textutil/textutil.go — the fix">
{`	cut := max - len(ellipsis)
	// Back up to the start of a rune so we never split one in half.
	for cut > 0 && !utf8.RuneStart(s[cut]) {
		cut--
	}
	return s[:cut] + ellipsis`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — 30 more seconds of fuzzing after the fix, go1.25.5">
{`fuzz: elapsed: 6s, execs: 2598383 (316192/sec), new interesting: 27 (total: 45)
fuzz: elapsed: 12s, execs: 10751503 (1657919/sec), new interesting: 29 (total: 47)
fuzz: elapsed: 18s, execs: 16761353 (912053/sec), new interesting: 29 (total: 47)
fuzz: elapsed: 24s, execs: 22189648 (896464/sec), new interesting: 29 (total: 47)
fuzz: elapsed: 30s, execs: 27668145 (909211/sec), new interesting: 29 (total: 47)
PASS
ok  	example.com/svc/textutil	30.412s`}
      </CodeBlock>

      <p>
        27.7 million executions across 14 worker processes, no counterexample.{' '}
        <code>new interesting</code> is the count of inputs that reached code nothing had reached
        before — it climbed to 29 and then flattened, which is the engine telling you it has run out
        of new paths to find in this function.
      </p>

      <InfoBox variant="tip" title="How to actually use fuzzing on a real service">
        <ul>
          <li>
            <strong>Fuzz the parsers.</strong> Anything that turns bytes from outside into a
            structure: JSON decoding into your types, a query-string or header parser, a CSV
            importer, a protocol framer. Those are where the crashes are.
          </li>
          <li>
            <strong>Properties, not expected outputs.</strong> You cannot write a table for infinite
            inputs. Write invariants: it does not panic; round-tripping is identity; the result is
            never longer than the input; the output is always valid UTF-8; two implementations agree
            (differential fuzzing).
          </li>
          <li>
            <strong>It never ends on its own.</strong> <code>-fuzz</code> runs until it fails or you
            give it <code>-fuzztime</code>. So it does not go in your normal CI job; run it nightly,
            commit whatever lands in <code>testdata/fuzz/</code>, and let the fast{' '}
            <code>go test</code> path replay those forever.
          </li>
          <li>
            <strong>Only a fixed set of argument types is allowed</strong> —{' '}
            <code>[]byte</code>, <code>string</code>, the integer and float types,{' '}
            <code>bool</code>, and <code>rune</code>. For a struct, fuzz the bytes and decode inside
            the body.
          </li>
          <li>
            <strong>The corpus lives in two places.</strong>{' '}
            <code>testdata/fuzz/</code> is yours and you commit it; the much larger generated cache
            is under <code>$GOCACHE/fuzz</code> and you do not.
          </li>
        </ul>
      </InfoBox>

      <h2><code>httptest</code>: HTTP Tests With No Port</h2>

      <p>
        <code>net/http/httptest</code> gives you two tools, and knowing which to reach for is most
        of the skill. The <a href="/go/http">next lesson</a> covers the handler side properly; this
        is the testing side.
      </p>

      <CodeBlock language="go" title="api/api_test.go — httptest.NewRecorder: no socket at all">
{`func TestSlugEndpoint(t *testing.T) {
	h := NewHandler(NewCounter())

	tests := []struct {
		name     string
		method   string
		target   string
		wantCode int
		wantSlug string
	}{
		{"happy path", "GET", "/slug/Hello%20World", http.StatusOK, "hello-world"},
		{"punctuation", "GET", "/slug/Go:%20Testing!", http.StatusOK, "go-testing"},
		{"wrong method", "POST", "/slug/x", http.StatusMethodNotAllowed, ""},
		{"no path value", "GET", "/slug/", http.StatusNotFound, ""},
		{"unknown route", "GET", "/nope", http.StatusNotFound, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.target, nil)
			rec := httptest.NewRecorder()

			h.ServeHTTP(rec, req) // no socket, no port, no listener

			if rec.Code != tt.wantCode {
				t.Fatalf("status = %d, want %d (body: %q)", rec.Code, tt.wantCode, rec.Body.String())
			}
			if tt.wantSlug == "" {
				return
			}
			var got slugResponse
			if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
				t.Fatalf("decoding body: %v", err)
			}
			if got.Slug != tt.wantSlug {
				t.Errorf("slug = %q, want %q", got.Slug, tt.wantSlug)
			}
			if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
				t.Errorf("Content-Type = %q, want application/json", ct)
			}
		})
	}
}`}
      </CodeBlock>

      <p>
        <code>h.ServeHTTP(rec, req)</code> is the whole trick. An <code>http.Handler</code> is just
        an interface with one method, so a &quot;request&quot; is a struct you construct and a
        &quot;response&quot; is a recorder you read. No listener, no port, no{' '}
        <code>supertest</code>, nothing to tear down, and it is fast enough that a table of 50
        routes costs milliseconds.
      </p>

      <CodeBlock language="go" title="api/api_test.go — httptest.NewServer: a real listener, when you need a URL">
{`func TestAgainstARealServer(t *testing.T) {
	srv := httptest.NewServer(NewHandler(NewCounter()))
	defer srv.Close()

	t.Logf("test server listening on %s", srv.URL)

	resp, err := http.Get(srv.URL + "/slug/Real%20Socket")
	if err != nil {
		t.Fatal(err)
	}
	defer resp.Body.Close()
	// ... assert on resp ...
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -v ./api/, go1.25.5">
{`=== RUN   TestSlugEndpoint
=== RUN   TestSlugEndpoint/happy_path
=== RUN   TestSlugEndpoint/punctuation
=== RUN   TestSlugEndpoint/wrong_method
=== RUN   TestSlugEndpoint/no_path_value
=== RUN   TestSlugEndpoint/unknown_route
--- PASS: TestSlugEndpoint (0.00s)
    --- PASS: TestSlugEndpoint/happy_path (0.00s)
    --- PASS: TestSlugEndpoint/punctuation (0.00s)
    --- PASS: TestSlugEndpoint/wrong_method (0.00s)
    --- PASS: TestSlugEndpoint/no_path_value (0.00s)
    --- PASS: TestSlugEndpoint/unknown_route (0.00s)
=== RUN   TestAgainstARealServer
    api_test.go:61: test server listening on http://127.0.0.1:55963
--- PASS: TestAgainstARealServer (0.00s)
PASS
ok  	example.com/svc/api	0.239s`}
      </CodeBlock>

      <p>
        <code>httptest.NewServer</code> binds <code>127.0.0.1</code> on an OS-assigned port (55963
        on that run) and hands you <code>srv.URL</code>. Use it when the code under test needs a
        URL rather than a handler — an HTTP client you wrote, a webhook sender, a service that
        reads its own base URL from config. Use the recorder for everything else. There is also{' '}
        <code>httptest.NewTLSServer</code> for the TLS path, which gives you{' '}
        <code>srv.Client()</code> pre-configured to trust its self-signed certificate.
      </p>

      <h2>Golden Files</h2>

      <p>
        When the thing under test produces a large exact output — a rendered template, a generated
        config, a formatted report, a full JSON response — asserting field by field is unreadable
        and asserting a string literal in the test is worse. The Go convention is a{' '}
        <strong>golden file</strong>: the expected bytes live in <code>testdata/</code>, and the
        test takes a flag that rewrites them.
      </p>
      <p>
        If you are thinking &quot;that is Jest snapshots&quot; — nearly, with two differences.
        There is no library, and the regeneration flag is one you declare yourself, so there is no
        ambient <code>--updateSnapshot</code> that someone can run by habit.
      </p>

      <CodeBlock language="go" title="api/golden_test.go">
{`// Convention, not a stdlib feature: a package-level flag that rewrites the
// expectations instead of asserting against them.
var update = flag.Bool("update", false, "rewrite the .golden files")

func TestSlugResponseGolden(t *testing.T) {
	cases := map[string]string{
		"simple":      "Hello World",
		"punctuation": "Go: Testing, Properly!",
		"long":        "A Very Long Title Indeed, Truncated",
	}

	h := NewHandler(NewCounter())
	for name, in := range cases {
		t.Run(name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/slug/"+url.PathEscape(in), nil)
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, body %q", rec.Code, rec.Body.String())
			}

			golden := filepath.Join("testdata", t.Name()+".golden")
			got := rec.Body.Bytes()

			if *update {
				if err := os.MkdirAll(filepath.Dir(golden), 0o755); err != nil {
					t.Fatal(err)
				}
				if err := os.WriteFile(golden, got, 0o644); err != nil {
					t.Fatal(err)
				}
				t.Logf("wrote %s", golden)
				return
			}

			want, err := os.ReadFile(golden)
			if err != nil {
				t.Fatalf("reading golden file: %v (run: go test ./api -update)", err)
			}
			if string(got) != string(want) {
				t.Errorf("response does not match %s\\n--- got ---\\n%s--- want ---\\n%s",
					golden, got, want)
			}
		})
	}
}`}
      </CodeBlock>

      <p>
        <code>t.Name()</code> is doing the real work there: inside the subtest it returns{' '}
        <code>TestSlugResponseGolden/simple</code>, so the path becomes{' '}
        <code>testdata/TestSlugResponseGolden/simple.golden</code> with no bookkeeping. Here is the
        whole workflow, run end to end:
      </p>

      <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go test -run TestSlugResponseGolden ./api/
--- FAIL: TestSlugResponseGolden (0.00s)
    --- FAIL: TestSlugResponseGolden/punctuation (0.00s)
        golden_test.go:50: reading golden file: open testdata/TestSlugResponseGolden/punctuation.golden: no such file or directory (run: go test ./api -update)
    --- FAIL: TestSlugResponseGolden/long (0.00s)
        golden_test.go:50: reading golden file: open testdata/TestSlugResponseGolden/long.golden: no such file or directory (run: go test ./api -update)
    --- FAIL: TestSlugResponseGolden/simple (0.00s)
        golden_test.go:50: reading golden file: open testdata/TestSlugResponseGolden/simple.golden: no such file or directory (run: go test ./api -update)
FAIL

$ go test -run TestSlugResponseGolden ./api/ -update
ok  	example.com/svc/api	0.241s

$ find api/testdata -type f | sort
api/testdata/TestSlugResponseGolden/long.golden
api/testdata/TestSlugResponseGolden/punctuation.golden
api/testdata/TestSlugResponseGolden/simple.golden

$ cat api/testdata/TestSlugResponseGolden/long.golden
{
  "input": "A Very Long Title Indeed, Truncated",
  "slug": "a-very-long-title-indeed-truncated",
  "truncated": "A Very Lo…",
  "hits": 1
}

$ go test -run TestSlugResponseGolden ./api/
ok  	example.com/svc/api	0.247s`}
      </CodeBlock>

      <p>
        Then the point of the whole exercise. I changed the handler&apos;s truncation limit from 12
        bytes to 20 — a one-token change, easy to make by accident — and the suite caught it with
        the before and after side by side:
      </p>

      <CodeBlock language="text" title="Real output — after changing Truncate(in, 12) to Truncate(in, 20), go1.25.5">
{`--- FAIL: TestSlugResponseGolden (0.00s)
    --- FAIL: TestSlugResponseGolden/long (0.00s)
        golden_test.go:53: response does not match testdata/TestSlugResponseGolden/long.golden
            --- got ---
            {
              "input": "A Very Long Title Indeed, Truncated",
              "slug": "a-very-long-title-indeed-truncated",
              "truncated": "A Very Long Title…",
              "hits": 1
            }
            --- want ---
            {
              "input": "A Very Long Title Indeed, Truncated",
              "slug": "a-very-long-title-indeed-truncated",
              "truncated": "A Very Lo…",
              "hits": 1
            }
FAIL`}
      </CodeBlock>

      <InfoBox variant="warning" title="Golden files rot in exactly one way">
        <p>
          They are only as good as the review of the diff. The failure mode is a developer seeing
          red, running <code>-update</code>, seeing green, and committing — approving a behaviour
          change nobody looked at. Two habits make that much less likely:{' '}
          <strong>commit the <code>.golden</code> files</strong> so changes to them show up in the
          pull request diff, and <strong>keep each golden file small enough to actually read</strong>.
          A 4,000-line golden file is a rubber stamp with extra steps. Also: never generate them
          from non-deterministic output. A timestamp, a random ID, a map iterated without sorting,
          or an unindented JSON encoding will all make the file churn — encode with{' '}
          <code>SetIndent</code>, sort your keys, and inject a fixed clock.
        </p>
      </InfoBox>

      <h2><code>Example</code> Functions: Tests That Are Also Documentation</h2>

      <p>
        A feature with no Jest or JUnit equivalent. A function named <code>ExampleXxx</code> with an{' '}
        <code>// Output:</code> comment is <em>both</em> rendered into the package documentation{' '}
        <em>and</em> executed as a test, with its stdout compared to that comment. Documentation that
        cannot silently go stale.
      </p>

      <CodeBlock language="go" title="textutil/example_test.go">
{`package textutil_test // the EXTERNAL test package: only the exported API

import (
	"fmt"

	"example.com/svc/textutil"
)

func ExampleSlug() {
	fmt.Println(textutil.Slug("Go: Testing Without a Framework"))
	// Output: go-testing-without-a-framework
}

func ExampleTruncate() {
	fmt.Println(textutil.Truncate("A fairly long headline", 12))
	// Output: A fairly l…
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -v -run Example ./textutil/, go1.25.5">
{`=== RUN   ExampleSlug
--- PASS: ExampleSlug (0.00s)
=== RUN   ExampleTruncate
--- FAIL: ExampleTruncate (0.00s)
got:
A fairly …
want:
A fairly l…
FAIL
FAIL	example.com/svc/textutil	0.227s
FAIL`}
      </CodeBlock>

      <p>
        That is the <strong>second</strong> time in this lesson I asserted an output from reasoning
        and was wrong, in the same way: <code>max=12</code> minus a 3-byte ellipsis is a cut at byte
        9, giving <code>&quot;A fairly &quot;</code> — with the trailing space, and no{' '}
        <code>l</code>. Correcting the comment to <code>// Output: A fairly …</code> makes it pass.
        Which is the argument for the feature: the comment is checked, so the docs and the code
        cannot drift.
      </p>

      <CodeBlock language="text" title="Example conventions">
{`func Example()               docs for the package
func ExampleSlug()           docs for the function Slug
func ExampleUser_Save()      docs for the method Save on type User
func ExampleSlug_unicode()   a second example for Slug, labelled "unicode"
                             (lower-case suffix after the underscore)

// Output:                   compared exactly, after trimming leading and
                             trailing space on each line
// Unordered output:         compared as a set of lines — for map iteration
no Output comment            COMPILED but NOT RUN. Useful for examples that
                             need a network or a database.`}
      </CodeBlock>

      <p>
        Note the <code>package textutil_test</code> on that file. Two package names are legal in a{' '}
        <code>_test.go</code> file: <code>textutil</code> (an internal test, can touch unexported
        identifiers) and <code>textutil_test</code> (an external test, sees only the exported API).
        Examples belong in the external one, because they double as documentation and documentation
        should only use the public surface. It is also the only way to break an import cycle when
        your test needs a package that imports yours.
      </p>

      <h2>Parallelism, Ordering, and Package-Level Setup</h2>

      <CodeBlock language="go" title="t.Parallel, and the one thing to know about it">
{`func TestParallel(t *testing.T) {
	for _, name := range []string{"a", "b", "c", "d", "e", "f", "g", "h"} {
		t.Run(name, func(t *testing.T) {
			t.Parallel() // this subtest PAUSES here until the loop finishes
			time.Sleep(200 * time.Millisecond)
		})
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -v, go1.25.5, 8 subtests sleeping 200ms each">
{`$ go test -v -run TestSerial .
    --- PASS: TestSerial/g (0.20s)
    --- PASS: TestSerial/h (0.20s)
PASS
ok  	example.com/paralleldemo	1.815s

$ go test -v -run TestParallel .
    --- PASS: TestParallel/d (0.20s)
    --- PASS: TestParallel/a (0.20s)
PASS
ok  	example.com/paralleldemo	0.395s`}
      </CodeBlock>

      <p>
        1.815s to 0.395s. Two details in that output matter. The parallel subtests{' '}
        <strong>report in completion order</strong> — <code>d</code> before <code>a</code> — so any
        test that depends on ordering will break. And <code>t.Parallel()</code> signals
        &quot;suspend me and resume when my parent&apos;s function body has returned&quot;, which is
        why the sleeps overlap rather than the loop blocking on each one.
      </p>

      <InfoBox variant="info" title="Three levels of parallelism, and they are different knobs">
        <ul>
          <li>
            <strong>Across packages:</strong> <code>go test</code> builds and runs one test binary
            per package and runs up to <code>-p</code> of them at once. From{' '}
            <code>go help build</code> on go1.25.5: &quot;<em>the number of programs, such as build
            commands or test binaries, that can be run in parallel. The default is GOMAXPROCS,
            normally the number of CPUs available.</em>&quot; This is on by default, which is why
            two packages writing to the same temp path or the same database flake immediately.
          </li>
          <li>
            <strong>Within a package:</strong> tests run sequentially <em>unless</em> they call{' '}
            <code>t.Parallel()</code>. The cap is <code>-parallel</code>, which{' '}
            <code>go help testflag</code> says &quot;<em>is set to the value of GOMAXPROCS</em>&quot;
            by default.
          </li>
          <li>
            <strong>Inside your code:</strong> ordinary goroutines, unaffected by either flag.
          </li>
        </ul>
        <p>
          Coming from Jest, where every <em>file</em> gets its own worker process by default, the
          notable difference is the second bullet: within a Go package, parallelism is opt-in per
          test. So the usual Jest hazard — global state shared across tests in a file — bites less
          often, and the usual Go hazard is instead cross-<em>package</em> interference through the
          filesystem or a shared service.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — go test -shuffle=on, go1.25.5">
{`-test.shuffle 1791599385592947000
=== RUN   TestSerial
=== RUN   TestSerial/a
=== RUN   TestSerial/b
--- PASS: TestSerial (0.40s)`}
      </CodeBlock>

      <p>
        <code>-shuffle=on</code> randomises the order of top-level tests and prints the seed, and{' '}
        <code>-shuffle=&lt;seed&gt;</code> replays it. Worth adding to CI: it finds the tests that
        only pass because an earlier test left state behind.
      </p>

      <CodeBlock language="go" title="TestMain — per-package setup, the nearest thing to beforeAll">
{`func TestMain(m *testing.M) {
	// Runs ONCE for the whole package, before any test.
	pool, err := startPostgresContainer()
	if err != nil {
		fmt.Fprintln(os.Stderr, "setup failed:", err)
		os.Exit(1)
	}
	db = pool

	code := m.Run() // <-- every test in the package runs here

	// Teardown. NOTE: os.Exit does not run deferred functions, so do
	// cleanup explicitly, before the exit.
	_ = pool.Close()
	os.Exit(code)
}`}
      </CodeBlock>

      <p>
        <code>TestMain</code> is the only package-level hook, and Go deliberately gives you nothing
        finer-grained. There is no <code>beforeEach</code>; the idiomatic replacement is a helper
        that returns a fixture plus its cleanup, called at the top of each test:
      </p>

      <CodeBlock language="go" title="The beforeEach replacement">
{`// Each test gets its own isolated everything, and cleanup is automatic.
func newTestStore(t *testing.T) *Store {
	t.Helper()
	dir := t.TempDir() // removed when the test ends, no defer needed
	s, err := Open(filepath.Join(dir, "state.db"))
	if err != nil {
		t.Fatalf("opening store: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func TestSomething(t *testing.T) {
	s := newTestStore(t) // explicit, greppable, no hidden ordering
	// ...
}`}
      </CodeBlock>

      <p>
        This is more typing than <code>beforeEach</code> and it is better, for one reason: you can
        see what a test depends on by reading the test. No hidden setup inherited from three{' '}
        <code>describe</code> blocks up.
      </p>

      <h2>Mocking: There Is No Mocking Library, and You Need One Less Often</h2>

      <p>
        Go has no <code>jest.mock()</code> and no Mockito, because the thing those tools exist to
        defeat — a hard-coded dependency inside a function — is avoided structurally instead.{' '}
        <a href="/go/interfaces">Interfaces are satisfied implicitly</a>, so a test double is any
        struct with the right methods, defined in the test file in four lines.
      </p>

      <CodeBlock language="go" title="The whole mocking story">
{`// Production code declares the narrow interface it needs — at the CONSUMER,
// not next to the implementation. One method is a very normal size.
type SlugStore interface {
	Save(ctx context.Context, slug string) error
}

func Handle(ctx context.Context, store SlugStore, in string) error {
	return store.Save(ctx, Slug(in))
}

// ---- in the test file ----

type fakeStore struct {
	saved []string
	err   error
}

func (f *fakeStore) Save(_ context.Context, slug string) error {
	if f.err != nil {
		return f.err
	}
	f.saved = append(f.saved, slug)
	return nil
}

func TestHandleSavesSlug(t *testing.T) {
	fake := &fakeStore{}
	if err := Handle(context.Background(), fake, "Hello World"); err != nil {
		t.Fatalf("Handle: %v", err)
	}
	if len(fake.saved) != 1 || fake.saved[0] != "hello-world" {
		t.Errorf("saved = %v, want [hello-world]", fake.saved)
	}
}`}
      </CodeBlock>

      <p>
        No <code>implements</code>, no registration, no code generation, no{' '}
        <code>@MockBean</code>. And when the dependency is HTTP, you do not mock at all —{' '}
        <code>httptest.NewServer</code> gives you the real thing. When it is a database, the Go
        community leans heavily toward a real database in a container over a mock, which the{' '}
        <a href="/go/database">database lesson</a> goes into.
      </p>
      <p>
        <code>uber-go/mock</code> (the maintained fork of the retired <code>golang/mock</code>)
        exists and generates these for you. It earns its place when an interface has a dozen methods
        and you need call-order assertions. For a one- or two-method interface, hand-writing the
        fake is shorter than the <code>go:generate</code> line.
      </p>

      <h2>Which Construct, When</h2>

      <FlowChart
        title="Picking the right testing tool"
        chart={"graph TD\n  Q[\"What am I checking?\"] --> A{\"Many inputs,<br/>one behaviour?\"}\n  A -->|\"yes\"| TAB[\"table-driven test + t.Run<br/>THE default shape of a Go test\"]\n  A -->|\"no\"| B{\"A property that must hold<br/>for ALL inputs?\"}\n  B -->|\"yes\"| FUZZ[\"FuzzXxx(f *testing.F)\"]\n  B -->|\"no\"| C{\"Speed or allocations?\"}\n  C -->|\"yes\"| BEN[\"BenchmarkXxx(b *testing.B)<br/>with -benchmem\"]\n  C -->|\"no\"| D{\"An HTTP handler?\"}\n  D -->|\"yes\"| HT[\"httptest.NewRecorder for the handler<br/>httptest.NewServer when you need a URL\"]\n  D -->|\"no\"| E{\"A big exact output blob?\"}\n  E -->|\"yes\"| GOLD[\"golden file + a -update flag\"]\n  E -->|\"no\"| F{\"Documentation that<br/>must stay true?\"}\n  F -->|\"yes\"| EX[\"ExampleXxx with an // Output: comment\"]\n  F -->|\"no\"| PLAIN[\"a plain TestXxx\"]\n  style TAB fill:#1a3329,stroke:#4ade80"}
      />

      <h2>Translating Your Instincts</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Jest / Vitest</th>
            <th style={headStyle}>JUnit 5</th>
            <th style={headStyle}>Go</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>describe</code> + <code>it</code></td>
            <td style={cellStyle}><code>@Nested</code> + <code>@Test</code></td>
            <td style={cellStyle}>
              <code>TestXxx</code> + <code>t.Run</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>expect(a).toBe(b)</code></td>
            <td style={cellStyle}><code>assertEquals</code></td>
            <td style={cellStyle}><code>if got != want</code> + <code>t.Errorf</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>expect(a).toEqual(obj)</code></td>
            <td style={cellStyle}>AssertJ <code>isEqualTo</code></td>
            <td style={cellStyle}>
              <code>reflect.DeepEqual</code>, or <code>cmp.Diff</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>it.each([...])</code></td>
            <td style={cellStyle}><code>@ParameterizedTest</code></td>
            <td style={cellStyle}>a table-driven test. No framework involved.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>beforeAll</code></td>
            <td style={cellStyle}><code>@BeforeAll</code></td>
            <td style={cellStyle}><code>TestMain(m *testing.M)</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>beforeEach</code> / <code>afterEach</code></td>
            <td style={cellStyle}><code>@BeforeEach</code></td>
            <td style={cellStyle}>
              nothing. A helper returning a fixture + <code>t.Cleanup</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>jest.mock('./mod')</code></td>
            <td style={cellStyle}>Mockito <code>@Mock</code></td>
            <td style={cellStyle}>
              a struct with the right methods, written in the test file
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>jest.useFakeTimers()</code></td>
            <td style={cellStyle}><code>Clock</code> injection</td>
            <td style={cellStyle}>
              inject a <code>func() time.Time</code>. No global clock to patch.
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>toMatchSnapshot()</code></td>
            <td style={cellStyle}>ApprovalTests</td>
            <td style={cellStyle}>
              golden file in <code>testdata/</code> + your own <code>-update</code> flag
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>supertest(app)</code></td>
            <td style={cellStyle}><code>MockMvc</code> / <code>@SpringBootTest</code></td>
            <td style={cellStyle}>
              <code>httptest.NewRecorder</code> + <code>h.ServeHTTP</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>--coverage</code></td>
            <td style={cellStyle}>JaCoCo</td>
            <td style={cellStyle}>
              <code>-cover</code>, <code>-coverprofile</code>, <code>go tool cover</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>benchmark.js</code></td>
            <td style={cellStyle}>JMH, a separate project</td>
            <td style={cellStyle}>
              <code>BenchmarkXxx</code> in the same file, <code>-bench</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>jsfuzz, a side quest</td>
            <td style={cellStyle}>Jazzer, a separate tool</td>
            <td style={cellStyle}>
              <code>FuzzXxx</code> in the same file, <code>-fuzz</code>
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>no equivalent</td>
            <td style={cellStyle}>no equivalent</td>
            <td style={cellStyle}>
              <code>-race</code>, and <code>ExampleXxx</code> as checked documentation
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>test.only</code> / <code>test.skip</code></td>
            <td style={cellStyle}><code>@Disabled</code></td>
            <td style={cellStyle}>
              <code>-run</code> regex / <code>t.Skip()</code>. No <code>only</code> in source.
            </td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="success" title="What you should now be able to say out loud">
        <ul>
          <li>
            A test is <code>func TestXxx(t *testing.T)</code> in a <code>*_test.go</code> file. No
            annotation, no runner to install, no assertion library required.{' '}
            <code>t.Errorf</code> continues, <code>t.Fatalf</code> stops — and{' '}
            <code>t.Fatalf</code> does not work from a goroutine you launched.
          </li>
          <li>
            Table-driven plus <code>t.Run</code> is the default shape. Anonymous struct,{' '}
            <code>name</code> first, positional literals, assertion inlined in the{' '}
            <code>if</code>, message in <code>got X, want Y</code> order.
          </li>
          <li>
            <code>t.Helper()</code> in every non-test function that takes a <code>*testing.T</code>,
            or your failures will all blame the same line.
          </li>
          <li>
            <code>-count=1</code> defeats the cache, <code>-run</code> is an unanchored regex with{' '}
            <code>/</code> per subtest level, <code>-race</code> belongs in CI, and{' '}
            <code>go test</code> fails the build on a vet error.
          </li>
          <li>
            Coverage measures statements and proves nothing about inputs — 100% on a function that
            produced invalid UTF-8, found by fuzzing in 0.17 seconds.
          </li>
          <li>
            Benchmarks (<code>b.Loop</code>, <code>-benchmem</code>) and fuzzing
            (<code>f.Add</code>, <code>f.Fuzz</code>, a corpus committed under{' '}
            <code>testdata/fuzz/</code>) are flags on the same command, not separate tools.
          </li>
          <li>
            <code>httptest.NewRecorder</code> for handlers, <code>httptest.NewServer</code> when
            something needs a URL. Mocks are structs you write; there is no mocking framework and
            you need one less often.
          </li>
          <li>
            testify is widely used and the community is genuinely split.{' '}
            <code>go-cmp</code> for diffs is the position hardest to argue with — and matching your
            team beats being right.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: <a href="/go/http">HTTP Services with net/http</a>, where the handler and the{' '}
        <code>ServeMux</code> that this lesson has been testing get explained properly — including
        what Go 1.22 added to routing, which makes a lot of older &quot;you need a router&quot;
        advice obsolete. The flag tables above are condensed into the{' '}
        <a href="/go/cheatsheet">Go Field Guide</a> if you want them on one page.
      </p>
    </LessonLayout>
  );
}
