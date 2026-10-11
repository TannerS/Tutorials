import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

const cellStyle = { padding: '0.75rem', verticalAlign: 'top' as const };
const rowStyle = { borderBottom: '1px solid var(--border-color)' } as const;
const headStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  color: 'var(--accent-amber)',
};

function Errors() {
  return (
    <LessonLayout
      title="Errors Are Values, Not Exceptions"
      sectionId="go"
      lessonIndex={5}
      prev={{ path: '/go/interfaces', label: 'Interfaces Without implements' }}
      next={{ path: '/go/slices', label: 'Slices, Maps & the Aliasing Trap' }}
    >
      <p>
        Go has no exceptions. There is no <code>throw</code>, no <code>try</code>, no{' '}
        <code>catch</code>, no <code>finally</code>, no stack unwinding to a handler you forgot you
        installed. A function that can fail says so in its signature by returning an extra value,
        and the caller deals with that value like any other.
      </p>
      <p>
        That is the single largest day-to-day adjustment in this section, and it hits you from both
        directions at once. Node taught you that failure propagates invisibly — a <code>throw</code>{' '}
        five frames down lands in your <code>try</code> without any of the frames in between
        mentioning it. Java taught you that failure is a <em>type</em> in a hierarchy, that the
        compiler can force you to acknowledge it, and that the escape hatch is to wrap everything in
        a <code>RuntimeException</code>. Go uses neither model.
      </p>

      <FlowChart
        title="How a failure travels — three models"
        chart={"graph TD\nF[\"a function deep in the call stack fails\"] --> Q{\"how does the failure travel?\"}\nQ -->|\"Node: throw / rejected promise\"| N1[\"the stack unwinds invisibly past every caller\"]\nN1 --> N2[\"the nearest try/catch anywhere above handles it\"]\nN2 --> N3[\"intermediate signatures say nothing about failing<br/>so you cannot tell by reading them\"]\nQ -->|\"Java: checked exception\"| J1[\"the signature declares throws IOException\"]\nJ1 --> J2[\"every caller must catch it or re-declare it\"]\nJ2 --> J3[\"escape hatch: wrap in a RuntimeException<br/>which is what most real code does\"]\nQ -->|\"Go: return a value\"| G1[\"the signature says (T, error)\"]\nG1 --> G2[\"the caller receives the error as an ordinary value\"]\nG2 --> G3[\"nothing unwinds — the control flow is the code on screen\"]\nstyle N3 fill:#3d2f14,stroke:#fb923c\nstyle J3 fill:#3d2f14,stroke:#fb923c\nstyle G3 fill:#1a3329,stroke:#4ade80"}
      />

      <h2>The <code>error</code> Interface Is Three Lines</h2>
      <p>
        There is no <code>Throwable</code>, no <code>Exception</code> base class, no{' '}
        <code>Error.captureStackTrace</code>. <code>error</code> is a predeclared interface, and
        that is the entire type. From the local toolchain&apos;s own source:
      </p>

      <CodeBlock language="text" title="Real output — grep -n $(go env GOROOT)/src/builtin/builtin.go, go1.25.5">
{`308:type error interface {
309-	Error() string
310-}`}
      </CodeBlock>

      <p>
        One method. Which means — per the <a href="/go/interfaces">previous lesson</a> — any type in
        any package becomes an error by growing an <code>Error() string</code> method, with nothing
        to declare and nothing to extend. The package that manipulates them is equally small:
      </p>

      <CodeBlock language="text" title="Real output — go doc errors | grep ^func, go1.25.5">
{`func As(err error, target any) bool
func Is(err, target error) bool
func Join(errs ...error) error
func New(text string) error
func Unwrap(err error) error`}
      </CodeBlock>

      <p>
        Five functions. That is the whole of Go&apos;s error library, and between them they cover
        everything a <code>catch (e instanceof FooError)</code> chain does.
      </p>

      <h2>What <code>if err != nil</code> Actually Buys</h2>
      <p>
        Start with the honest version of the trade, because the usual pitch
        (&quot;explicit is better than implicit&quot;) is a slogan, not an argument.
      </p>

      <CodeBlock language="javascript" title="Node — the failure is invisible in the signature">
{`// Node — the failure is invisible in the signature.
// Does getUser throw? Does save? You cannot tell from here, and nothing
// makes you find out. If you forget the try, the rejection escapes.
async function transfer(from, to, cents) {
  const a = await getUser(from);   // may throw
  const b = await getUser(to);     // may throw
  a.balance -= cents;
  b.balance += cents;
  await save(a);                   // may throw
  await save(b);                   // may throw — and now a is already saved
}`}
      </CodeBlock>

      <CodeBlock language="go" title="Go — every failure point is a visible branch">
{`func Transfer(from, to string, cents int64) error {
	a, err := getUser(from)
	if err != nil {
		return fmt.Errorf("transfer: load source %s: %w", from, err)
	}
	b, err := getUser(to)
	if err != nil {
		return fmt.Errorf("transfer: load dest %s: %w", to, err)
	}

	a.balance -= cents
	b.balance += cents

	if err := save(a); err != nil {
		return fmt.Errorf("transfer: save source %s: %w", from, err)
	}
	if err := save(b); err != nil {
		// Nothing magically rolls back the first save. The Go version puts
		// that problem in front of you, right here, rather than in an
		// incident review.
		return fmt.Errorf("transfer: save dest %s: %w", to, err)
	}
	return nil
}`}
      </CodeBlock>

      <p>
        Strip the comment and the Go version is <strong>19 non-blank lines of code against
        Node&apos;s 8</strong> — and 12 of those 19 are four identical three-line blocks whose only
        job is to move an error upward. That is a real cost and it is worth naming plainly rather
        than reframing. What you get for it:
      </p>
      <ul>
        <li>
          <strong>Failure is in the type signature.</strong> You can tell whether a function can fail
          by reading one line, without opening it, without reading its transitive callees, and
          without trusting a doc comment. Java&apos;s checked exceptions tried to give you this and
          lost because <code>throws Exception</code> and{' '}
          <code>catch (Exception e) {'{ }'}</code> defeat it, and because unchecked exceptions
          exist.
        </li>
        <li>
          <strong>There is exactly one control-flow mechanism.</strong> Nothing in a Go function body
          jumps to a handler somewhere else. No invisible early exit means no &quot;how did we get
          here with a half-written row,&quot; which is the entire category of bug that makes
          exception-based rollback hard.
        </li>
        <li>
          <strong>Context accumulates at each layer deliberately.</strong> Four{' '}
          <code>%w</code> wraps gave four distinct messages naming which call failed and with which
          argument. A stack trace gives you line numbers; the wrap chain gives you{' '}
          <em>values</em>, which is usually what you actually wanted at 3am.
        </li>
        <li>
          <strong>You cannot accidentally ignore an error.</strong> Not quite — see the warning box
          below — but the failure mode is visible (<code>_</code> or a missing assignment) rather
          than absent (no <code>try</code>).
        </li>
      </ul>

      <InfoBox variant="warning" title="The compiler does NOT force you to check errors">
        <p>
          This is widely misstated. Go errors are unused <em>values</em>, and Go only rejects unused{' '}
          <em>variables</em>. So <code>json.Unmarshal(b, &amp;v)</code> with the result discarded
          entirely compiles clean, and so does <code>_ = doThing()</code>. The compiler catches{' '}
          <code>err := f()</code> followed by never reading <code>err</code>, and that is all.
        </p>
        <p>
          <code>go vet</code> catches a narrow list of famously-dangerous ones (notably unchecked{' '}
          <code>fmt.Fprintf</code> to an <code>os.File</code>). For real coverage you want{' '}
          <code>errcheck</code>, which is bundled into <code>golangci-lint</code>, and you want it on
          from day one. Treat &quot;Go makes you handle errors&quot; as a cultural claim, not a
          compiler guarantee.
        </p>
      </InfoBox>

      <h2>Making Errors: <code>errors.New</code> and Sentinels</h2>
      <p>
        <code>errors.New("text")</code> is the floor. The step up is a <strong>sentinel</strong>: an
        exported package-level error value that callers compare against, which is Go&apos;s
        replacement for <code>catch (FileNotFoundException e)</code>. The standard library is full of
        them — <code>io.EOF</code>, <code>sql.ErrNoRows</code>, <code>os.ErrNotExist</code>,{' '}
        <code>context.DeadlineExceeded</code>.
      </p>
      <p>
        The thing to internalise is that sentinels work by <strong>identity</strong>, not by message:
      </p>

      <CodeBlock language="go" title="Sentinel semantics, and the two ways to get them wrong">
{`package main

import (
	"errors"
	"fmt"
	"io"
	"strings"
)

var ErrNotFound = errors.New("store: not found")

func main() {
	// Sentinels work by IDENTITY, not by message. Two errors.New calls with
	// the same text are different values.
	a := errors.New("store: not found")
	b := errors.New("store: not found")
	fmt.Println("a == b                :", a == b)
	fmt.Println("a.Error() == b.Error():", a.Error() == b.Error())
	fmt.Println("ErrNotFound == ErrNotFound:", ErrNotFound == ErrNotFound)

	// == breaks the moment anyone wraps. errors.Is does not.
	wrapped := fmt.Errorf("loadUser: %w", ErrNotFound)
	fmt.Println("\\nwrapped == ErrNotFound       :", wrapped == ErrNotFound)
	fmt.Println("errors.Is(wrapped, ErrNotFound):", errors.Is(wrapped, ErrNotFound))

	// io.EOF is the most-used sentinel in Go, and it is NOT an error
	// condition — it is how a reader says "that is all".
	r := strings.NewReader("hi")
	buf := make([]byte, 8)
	for i := 0; i < 3; i++ {
		n, err := r.Read(buf)
		fmt.Printf("read #%d: n=%d err=%v  (is EOF: %t)\\n", i+1, n, err, errors.Is(err, io.EOF))
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`a == b                : false
a.Error() == b.Error(): true
ErrNotFound == ErrNotFound: true

wrapped == ErrNotFound       : false
errors.Is(wrapped, ErrNotFound): true
read #1: n=2 err=<nil>  (is EOF: false)
read #2: n=0 err=EOF  (is EOF: true)
read #3: n=0 err=EOF  (is EOF: true)`}
      </CodeBlock>

      <p>
        <code>errors.New</code> returns a pointer to a fresh struct, so equality is pointer identity
        and two identical messages are two different errors. The upshot is a hard rule:{' '}
        <strong>never branch on an error&apos;s message text.</strong> If you find yourself writing{' '}
        <code>strings.Contains(err.Error(), &quot;not found&quot;)</code>, the library you are
        calling has failed to give you a sentinel or a type, and the correct fix is to ask for one,
        not to pattern-match prose that will be reworded in a patch release.
      </p>

      <InfoBox variant="tip" title="Conventions for the message string">
        <p>
          Error strings are lowercase and have no trailing punctuation — <code>go vet</code>&apos;s{' '}
          <code>ST1005</code>-adjacent checks and <code>staticcheck</code> both enforce this. The
          reason is that errors get <em>composed</em>:{' '}
          <code>&quot;handler: service: store: not found&quot;</code> reads correctly, and{' '}
          <code>&quot;Handler: Service: Store: Not found.&quot;</code> does not. Prefixing with the
          package name, as above, is also worth the keystrokes — an error surfaces far from where it
          was created, and &quot;not found&quot; on its own in a log line is nearly useless.
        </p>
      </InfoBox>

      <h2>Wrapping: <code>%w</code>, <code>errors.Is</code>, <code>errors.As</code></h2>
      <p>
        Wrapping is how Go replaces a stack trace. Each layer that passes an error up adds the
        context it has and the layers above do not, and <code>%w</code> keeps the original reachable
        underneath.
      </p>
      <p>
        <code>%w</code> and <code>%v</code> produce <strong>identical text</strong> and completely
        different values. That is the single most important mechanical fact in this lesson:
      </p>

      <CodeBlock language="go" title="%w versus %v, the unwrap chain, and errors.Join">
{`package main

import (
	"errors"
	"fmt"
)

var (
	ErrNotFound = errors.New("store: not found")
	ErrTimeout  = errors.New("store: timeout")
)

func main() {
	// %w wraps: the chain survives.
	wrapped := fmt.Errorf("loadUser 42: %w", ErrNotFound)
	// %v formats: the text survives, the chain does not.
	flattened := fmt.Errorf("loadUser 42: %v", ErrNotFound)

	fmt.Printf("%%w text: %v\\n", wrapped)
	fmt.Printf("%%v text: %v\\n", flattened)
	fmt.Println("identical text:", wrapped.Error() == flattened.Error())
	fmt.Println("errors.Is on %w:", errors.Is(wrapped, ErrNotFound))
	fmt.Println("errors.Is on %v:", errors.Is(flattened, ErrNotFound))

	// Walking the chain by hand with errors.Unwrap.
	deep := fmt.Errorf("handler: %w", fmt.Errorf("service: %w", wrapped))
	fmt.Println("\\nunwrapping the chain:")
	for e, i := deep, 0; e != nil; e, i = errors.Unwrap(e), i+1 {
		fmt.Printf("  [%d] %-14T %v\\n", i, e, e)
	}

	// Two independent failures at once: errors.Join (Go 1.20+).
	joined := errors.Join(ErrNotFound, ErrTimeout)
	fmt.Printf("\\njoined (note the newline between them):\\n%v\\n", joined)
	fmt.Println("Is(joined, ErrNotFound):", errors.Is(joined, ErrNotFound))
	fmt.Println("Is(joined, ErrTimeout) :", errors.Is(joined, ErrTimeout))

	// A single Errorf can also carry more than one %w (Go 1.20+).
	both := fmt.Errorf("batch failed: %w and %w", ErrNotFound, ErrTimeout)
	fmt.Printf("\\nmulti-%%w: %v\\n", both)
	fmt.Println("Is(both, ErrNotFound):", errors.Is(both, ErrNotFound))
	fmt.Println("Is(both, ErrTimeout) :", errors.Is(both, ErrTimeout))
	fmt.Printf("errors.Unwrap(both) is %v (multi-wrap has no single Unwrap)\\n", errors.Unwrap(both))

	// errors.Join of nils is nil — handy for accumulating in a loop.
	fmt.Println("\\nerrors.Join(nil, nil) == nil:", errors.Join(nil, nil) == nil)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`%w text: loadUser 42: store: not found
%v text: loadUser 42: store: not found
identical text: true
errors.Is on %w: true
errors.Is on %v: false

unwrapping the chain:
  [0] *fmt.wrapError handler: service: loadUser 42: store: not found
  [1] *fmt.wrapError service: loadUser 42: store: not found
  [2] *fmt.wrapError loadUser 42: store: not found
  [3] *errors.errorString store: not found

joined (note the newline between them):
store: not found
store: timeout
Is(joined, ErrNotFound): true
Is(joined, ErrTimeout) : true

multi-%w: batch failed: store: not found and store: timeout
Is(both, ErrNotFound): true
Is(both, ErrTimeout) : true
errors.Unwrap(both) is <nil> (multi-wrap has no single Unwrap)

errors.Join(nil, nil) == nil: true`}
      </CodeBlock>

      <p>
        Four things to take from that output:
      </p>
      <ol>
        <li>
          Lines 1&ndash;3: <code>%w</code> and <code>%v</code> printed byte-for-byte the same string.
          A reviewer eyeballing your log output cannot tell which you used. Only{' '}
          <code>errors.Is</code> can, and it says <code>true</code> for one and{' '}
          <code>false</code> for the other. <strong>Using <code>%v</code> where you meant{' '}
          <code>%w</code> is a silent, invisible bug</strong> that only shows up as a sentinel check
          failing in production.
        </li>
        <li>
          The unwrap walk shows <code>*fmt.wrapError</code> three times then the original{' '}
          <code>*errors.errorString</code>. <code>fmt.Errorf</code> with a <code>%w</code> returns a
          different concrete type than without one — that is the whole implementation.
        </li>
        <li>
          <code>errors.Join</code> separates with a <strong>newline</strong>, not a comma. If you log
          errors as single lines, a joined error will break that assumption; this surprises people.
        </li>
        <li>
          Multi-<code>%w</code> and <code>Join</code> produce a <em>tree</em>, and{' '}
          <code>errors.Unwrap</code> returns <code>nil</code> for them because there is no single
          parent. <code>errors.Is</code> and <code>errors.As</code> walk the tree properly
          (pre-order, depth-first, per the package docs); hand-rolled <code>Unwrap</code> loops do
          not. Prefer <code>Is</code>/<code>As</code> over walking manually.
        </li>
      </ol>

      <h2>Custom Error Types, and <code>errors.As</code></h2>
      <p>
        A sentinel answers &quot;was it <em>this</em> failure?&quot;. When the caller needs{' '}
        <em>data</em> out of the failure — an HTTP status to map, a field name to show the user, a
        retryable flag — you need a type with fields, and <code>errors.As</code> to get it back out
        of the chain. This is the direct analogue of Java&apos;s{' '}
        <code>catch (QueryException e) {'{ e.getCode() }'}</code>, except the type check happens at
        an arbitrary depth in the wrap chain.
      </p>

      <CodeBlock language="go" title="Sentinel, custom type, and a foreign error, all through one chain">
{`package main

import (
	"errors"
	"fmt"
	"os"
)

// A SENTINEL: an exported, comparable value callers can test against.
var ErrNotFound = errors.New("store: not found")

// A CUSTOM TYPE: for when the caller needs structured detail, not identity.
type QueryError struct {
	Query string
	Code  int
}

func (e *QueryError) Error() string {
	return fmt.Sprintf("store: query %q failed with code %d", e.Query, e.Code)
}

func (e *QueryError) Retryable() bool { return e.Code >= 500 }

func fetchRow(id string) error {
	switch id {
	case "missing":
		return ErrNotFound
	case "broken":
		return &QueryError{Query: "SELECT 1", Code: 503}
	case "nofile":
		_, err := os.Open("/definitely/not/here")
		return err
	}
	return nil
}

// Each layer adds context and wraps with %w, preserving the chain.
func loadUser(id string) error {
	if err := fetchRow(id); err != nil {
		return fmt.Errorf("loadUser %s: %w", id, err)
	}
	return nil
}

func handleRequest(id string) error {
	if err := loadUser(id); err != nil {
		return fmt.Errorf("handleRequest: %w", err)
	}
	return nil
}

func main() {
	for _, id := range []string{"ok", "missing", "broken", "nofile"} {
		err := handleRequest(id)
		fmt.Printf("--- id=%q\\n", id)
		fmt.Printf("  err                            : %v\\n", err)
		fmt.Printf("  errors.Is(err, ErrNotFound)    : %t\\n", errors.Is(err, ErrNotFound))
		fmt.Printf("  errors.Is(err, os.ErrNotExist) : %t\\n", errors.Is(err, os.ErrNotExist))

		var qe *QueryError
		if errors.As(err, &qe) {
			fmt.Printf("  errors.As -> *QueryError       : code=%d retryable=%t\\n", qe.Code, qe.Retryable())
		} else {
			fmt.Printf("  errors.As -> *QueryError       : false\\n")
		}
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`--- id="ok"
  err                            : <nil>
  errors.Is(err, ErrNotFound)    : false
  errors.Is(err, os.ErrNotExist) : false
  errors.As -> *QueryError       : false
--- id="missing"
  err                            : handleRequest: loadUser missing: store: not found
  errors.Is(err, ErrNotFound)    : true
  errors.Is(err, os.ErrNotExist) : false
  errors.As -> *QueryError       : false
--- id="broken"
  err                            : handleRequest: loadUser broken: store: query "SELECT 1" failed with code 503
  errors.Is(err, ErrNotFound)    : false
  errors.Is(err, os.ErrNotExist) : false
  errors.As -> *QueryError       : code=503 retryable=true
--- id="nofile"
  err                            : handleRequest: loadUser nofile: open /definitely/not/here: no such file or directory
  errors.Is(err, ErrNotFound)    : false
  errors.Is(err, os.ErrNotExist) : true
  errors.As -> *QueryError       : false`}
      </CodeBlock>

      <p>
        Two details in there are worth more than the API surface.
      </p>
      <p>
        The error message reads like a call stack in domain language:{' '}
        <code>handleRequest: loadUser broken: store: query &quot;SELECT 1&quot; failed with code
        503</code>. Nobody built that; each layer added one clause.
      </p>
      <p>
        The <code>nofile</code> case is the more interesting one, and it turned out not to work the
        way I assumed when writing this. Unwrapping that chain by hand:
      </p>

      <CodeBlock language="text" title="Real output — walking the os error chain, go1.25.5 darwin/arm64">
{`[0] *fmt.wrapError         handleRequest: loadUser nofile: open /definitely/not/here: no such file or directory
[1] *fmt.wrapError         loadUser nofile: open /definitely/not/here: no such file or directory
[2] *fs.PathError          open /definitely/not/here: no such file or directory
[3] syscall.Errno          no such file or directory
errors.Is(err, os.ErrNotExist): true
os.ErrNotExist is *errors.errorString = file does not exist`}
      </CodeBlock>

      <p>
        Read the last two lines together. <code>os.ErrNotExist</code> has the message{' '}
        <code>&quot;file does not exist&quot;</code> and it is <strong>nowhere in that chain</strong>{' '}
        — the deepest element is a <code>syscall.Errno</code> whose message is &quot;no such file or
        directory&quot;. So <code>errors.Is</code> did not find it by unwrapping. It found it because{' '}
        <code>errors.Is</code> also asks each error in the chain whether it <em>considers itself</em>{' '}
        equal to the target, via an optional <code>Is(error) bool</code> method. From the local
        toolchain&apos;s source:
      </p>

      <CodeBlock language="text" title="Real output — $(go env GOROOT)/src/syscall/syscall_unix.go, go1.25.5">
{`120:func (e Errno) Is(target error) bool {
121-	switch target {
122-	case oserror.ErrPermission:
123-		return e == EACCES || e == EPERM
124-	case oserror.ErrExist:
125-		return e == EEXIST || e == ENOTEMPTY
126-	case oserror.ErrNotExist:
127-		return e == ENOENT
128-	case errorspkg.ErrUnsupported:
129-		return e == ENOSYS || e == ENOTSUP || e == EOPNOTSUPP
130-	}
131-	return false
132-}`}
      </CodeBlock>

      <p>
        That is the third piece of the protocol, after <code>Error() string</code> and{' '}
        <code>Unwrap() error</code>: an error type may implement <code>Is(error) bool</code> to
        declare equivalences that identity cannot express — here, &quot;<code>ENOENT</code> counts as{' '}
        <code>ErrNotExist</code> on every platform.&quot; You can implement it yourself when your
        type wants to match a sentinel it does not literally wrap, and the symmetric{' '}
        <code>As(any) bool</code> exists for the same reason. Four unwrap levels, three packages that
        have never heard of each other, one method — and the payoff is still the <code>%w</code>{' '}
        discipline, because without it the chain would have stopped at level 1.
      </p>

      <FlowChart
        title="Which error tool for which question"
        chart={"graph TD\nA[\"I have an err and I need to do something other than return it\"] --> B{\"What do I need from it?\"}\nB -->|\"Is it this specific failure?\"| C[\"errors.Is(err, ErrNotFound)\"]\nB -->|\"I need fields off it: code, field, retryable\"| D[\"var e *MyError<br/>errors.As(err, &e)\"]\nB -->|\"Nothing — just add context and pass it up\"| E[\"return fmt.Errorf(verb %w, err)\"]\nC --> C2[\"Never err == ErrNotFound.<br/>It breaks the first time anyone wraps.\"]\nD --> D2[\"Target must be a POINTER to the type,<br/>or As panics at runtime.\"]\nE --> E2[\"Wrap once per layer, with context the layer above lacks.\"]\nstyle C2 fill:#3b1a1a,stroke:#f87171\nstyle D2 fill:#3b1a1a,stroke:#f87171\nstyle E2 fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="danger" title="errors.As takes a pointer to the target, and panics if you forget">
        <p>
          The signature is <code>errors.As(err error, target any) bool</code>, and{' '}
          <code>any</code> means the compiler cannot help you. <code>errors.As(err, qe)</code> where{' '}
          <code>qe</code> is already a <code>*QueryError</code> compiles clean and then:
        </p>
        <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`errors.As(err, &qe): true code 503
errors.As(err, qe) panics: errors: *target must be interface or implement error`}
        </CodeBlock>
        <p>
          The mnemonic that sticks: <code>As</code> <em>assigns</em> to the target, so it needs the
          target&apos;s address, exactly like <code>json.Unmarshal</code>. Declare{' '}
          <code>var e *MyError</code> and pass <code>&amp;e</code>. Every time.
        </p>
      </InfoBox>

      <h3>Sentinel or type? And the coupling cost nobody mentions</h3>
      <p>
        Both are part of your package&apos;s public API, and both are therefore a compatibility
        promise. A sentinel is cheaper: callers can only ask yes/no, so you can change the message,
        the internals, and the wrapping freely. A custom type exports its fields and its methods, and
        every one of them is now something you cannot change.
      </p>
      <p>
        The practical default: <strong>sentinel unless the caller demonstrably needs a field.</strong>{' '}
        And if you expose a type, expose a <em>predicate</em> alongside it (
        <code>func IsRetryable(err error) bool</code>) so callers have an option that does not couple
        them to your struct layout. That is what <code>os.IsNotExist</code> was, before{' '}
        <code>errors.Is</code> made it redundant.
      </p>

      <h2>The Verbosity Criticism, Taken Seriously</h2>
      <p>
        &quot;Go is 40% error handling&quot; is the most common complaint about the language and it
        deserves a real answer rather than a shrug. So, measured on the installed toolchain&apos;s
        own standard library — the 1,605 non-test <code>GoFiles</code> of the packages that{' '}
        <code>go list std</code> reports:
      </p>

      <CodeBlock language="text" title="Real output — counted over $(go env GOROOT)/src, go1.25.5">
{`$ # every non-test source file of every package in "go list std"
$ cat $(cat stdfiles.txt) | wc -l
  522449
$ grep -hE 'if .*err != nil \\{' $(cat stdfiles.txt) | wc -l
    4173

$ # per-package density
net/http           28514 lines    264 err checks  ~1 per 108 lines
database/sql        4420 lines     60 err checks  ~1 per  73 lines
os                  5444 lines    110 err checks  ~1 per  49 lines
encoding/json       4303 lines     38 err checks  ~1 per 113 lines
bufio               1272 lines     23 err checks  ~1 per  55 lines`}
      </CodeBlock>

      <p>
        4,173 error checks in 522,449 lines is one every 125 lines; even in <code>os</code>, which is
        nothing but syscall wrappers, it is one every 49. At three lines per check that is roughly
        2.4% of the standard library. So the 40% figure is not true of library code.
      </p>
      <p>
        <strong>But it is much closer to true of application glue code</strong>, and pretending
        otherwise is dishonest. A handler that calls a service that calls a repository is
        <em>mostly</em> a sequence of fallible calls with very little logic between them, and the
        ratio there genuinely can approach one check per meaningful line. The{' '}
        <code>Transfer</code> function at the top of this lesson is <strong>12 lines of error
        plumbing out of 19</strong> — 63%, against the standard library&apos;s 2.4%. That is the
        real shape of the complaint, and the gap is not because the standard library is better
        written; it is because library code has algorithms between its fallible calls and glue code
        does not.
      </p>
      <p>Three things actually reduce it, and one thing does not:</p>

      <h3>1. Wrap and return. Do not handle.</h3>
      <p>
        The most common beginner mistake is writing a <code>switch</code> on every error at every
        layer. Almost all of the time, a middle layer&apos;s correct action is{' '}
        <code>return fmt.Errorf(&quot;context: %w&quot;, err)</code> and nothing else. Handle an
        error <strong>once</strong>, at the layer that can actually decide something — the HTTP
        handler maps it to a status, the retry loop decides to retry, the CLI prints it and exits.
        Everywhere else, three lines, no logic. If you are both logging <em>and</em> returning the
        same error, you have made your logs twice as long and told the reader nothing new.
      </p>

      <h3>2. A sticky error, for a run of writes</h3>
      <p>
        When you have a sequence of operations against the same target and the first failure makes
        the rest pointless, collapse the checks into the type. This is not a trick — it is what{' '}
        <code>bufio.Writer</code> and <code>bufio.Scanner</code> do:
      </p>

      <CodeBlock language="go" title="Four checks, or one">
{`// VERSION A: the shape people complain about. 4 writes, 4 checks.
func writeHeaderVerbose(w io.Writer, name, version string) error {
	if _, err := fmt.Fprintf(w, "name: %s\\n", name); err != nil {
		return fmt.Errorf("write name: %w", err)
	}
	if _, err := fmt.Fprintf(w, "version: %s\\n", version); err != nil {
		return fmt.Errorf("write version: %w", err)
	}
	if _, err := fmt.Fprintln(w, "---"); err != nil {
		return fmt.Errorf("write separator: %w", err)
	}
	if _, err := fmt.Fprintln(w, "body goes here"); err != nil {
		return fmt.Errorf("write body: %w", err)
	}
	return nil
}

// VERSION B: a sticky-error wrapper. One check, at the end.
type errWriter struct {
	w   io.Writer
	err error
}

func (e *errWriter) printf(format string, args ...any) {
	if e.err != nil {
		return // already failed; every later call is a no-op
	}
	_, e.err = fmt.Fprintf(e.w, format, args...)
}

func writeHeaderSticky(w io.Writer, name, version string) error {
	ew := &errWriter{w: w}
	ew.printf("name: %s\\n", name)
	ew.printf("version: %s\\n", version)
	ew.printf("---\\n")
	ew.printf("body goes here\\n")
	if ew.err != nil {
		return fmt.Errorf("write header: %w", ew.err)
	}
	return nil
}

// The standard library's own version of the same idea: a Scanner accumulates
// one error and you check it once, after the loop.
sc := bufio.NewScanner(strings.NewReader("a\\nbb\\nccc\\n"))
total := 0
for sc.Scan() {
	total += len(sc.Bytes())
}
fmt.Printf("scanner read %d bytes, sc.Err() = %v\\n", total, sc.Err())`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run against a writer that fails after N bytes, go1.25.5">
{`budget=1000
  verbose: <nil>
  sticky : <nil>
budget=20
  verbose: write version: disk full
  sticky : write header: disk full

scanner read 6 bytes, sc.Err() = <nil>`}
      </CodeBlock>

      <p>
        Note what you gave up: the verbose version says <em>which</em> write failed; the sticky
        version says only that the header write failed. That trade is usually fine for a run of
        writes to one destination and usually not fine for a run of unrelated operations. Choose
        deliberately rather than reflexively.
      </p>

      <h3>3. <code>errors.Join</code> when you want all the failures, not the first</h3>
      <p>
        Validation is the canonical case. Returning on the first bad field makes your API tell a user
        about one problem at a time; <code>errors.Join</code> lets you collect, and returns{' '}
        <code>nil</code> when nothing was added — which is why it composes cleanly in a loop:
      </p>

      <CodeBlock language="go" title="Accumulating instead of short-circuiting">
{`func (u User) Validate() error {
	var errs []error
	if u.Name == "" {
		errs = append(errs, errors.New("name is required"))
	}
	if !strings.Contains(u.Email, "@") {
		errs = append(errs, fmt.Errorf("email %q is not an address", u.Email))
	}
	if u.Age < 0 {
		errs = append(errs, fmt.Errorf("age %d is negative", u.Age))
	}
	return errors.Join(errs...) // nil if errs is empty
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`valid:   <nil>
invalid:
name is required
email "nope" is not an address
age -1 is negative`}
      </CodeBlock>

      <h3>And the thing that does not help: a helper that panics</h3>
      <p>
        Sooner or later someone on your team proposes{' '}
        <code>func must[T any](v T, err error) T</code> that panics on error, so the call sites get
        short. In library code and request paths this is a bad trade: you have reintroduced invisible
        unwinding without reintroducing any of the tooling that makes exceptions survivable. It is
        legitimate in exactly two places — <code>main</code>/startup, and tests — and we will get to
        why in a moment.
      </p>

      <InfoBox variant="note" title="Why there is no ? operator">
        <p>
          The Go team has rejected sugar for this repeatedly and publicly — the{' '}
          <code>check</code>/<code>handle</code> proposal in 2018, and the <code>try</code> builtin
          proposal in 2019, both withdrawn after community feedback. The stated reason is consistent:
          any syntax that makes the error path shorter also makes it <em>easier to skip adding
          context</em>, and an un-annotated error bubbling up five layers is strictly worse than a
          verbose one that says where it came from. Rust&apos;s <code>?</code> is the counter-example
          people cite, and it is a real counter-example — but note that it pairs with{' '}
          <code>From</code> conversions and the <code>anyhow</code> ecosystem specifically to solve
          the context problem Go solves with <code>%w</code>. You may legitimately prefer Rust&apos;s
          answer. You will not get it in Go, so do not write code that pines for it.
        </p>
      </InfoBox>

      <h2><code>panic</code> and <code>recover</code> Are Not Error Handling</h2>
      <p>
        Go does have a mechanism that unwinds the stack. It looks like exceptions, it is not
        exceptions, and conflating them is the most common way a Java or Node developer writes bad
        Go in their first month.
      </p>
      <p>
        <code>panic</code> means <strong>this program is in a state its author believed to be
        impossible.</strong> Not &quot;the user sent bad JSON&quot;, not &quot;the database is
        down&quot; — those are expected, and expected failures are return values.{' '}
        <code>panic</code> is an assertion failure.
      </p>

      <FlowChart
        title="Error or panic? The decision"
        chart={"graph TD\nA[\"Something has gone wrong\"] --> B{\"Could a CORRECT caller cause this?\"}\nB -->|\"Yes — bad input, network, disk, user\"| E[\"Return an error. No exceptions, literally.\"]\nB -->|\"No — only a bug in my own code can\"| C{\"Is it during startup: init, config, template or regexp compile?\"}\nC -->|Yes| P[\"panic / MustXxx is idiomatic:<br/>fail loudly before serving traffic\"]\nC -->|No| D{\"Have I broken an invariant I cannot<br/>meaningfully continue past?\"}\nD -->|Yes| P\nD -->|\"No, I can still return something sane\"| E\nP --> R[\"and put ONE defer+recover at the request boundary,<br/>so a single bad request is not a dead process\"]\nstyle E fill:#1a3329,stroke:#4ade80\nstyle P fill:#3d2f14,stroke:#fb923c\nstyle R fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>The legitimate uses, in descending order of how often you will write them:</p>
      <ul>
        <li>
          <strong>Startup / <code>MustXxx</code>.</strong>{' '}
          <code>regexp.MustCompile</code>, <code>template.Must</code>,{' '}
          <code>sql.Open</code> followed by a failed <code>Ping</code> in <code>main</code>. A
          hard-coded regexp that does not compile is a typo in your source, not a runtime condition;
          crashing at process start is strictly better than returning an error nobody can act on.
        </li>
        <li>
          <strong>Unreachable branches.</strong> The <code>default</code> of a switch over your own
          closed set of constants. <code>panic(fmt.Sprintf(&quot;unhandled state %v&quot;, s))</code>{' '}
          is better documentation than a comment and fails loudly if someone adds a constant.
        </li>
        <li>
          <strong>Broken invariants inside a package.</strong> A balanced tree that discovers it is
          not balanced cannot usefully continue.
        </li>
        <li>
          <strong>Tests.</strong> <code>t.Fatal</code> is not a panic, but a test helper that panics
          on a setup failure is fine — the blast radius is one test binary.
        </li>
      </ul>

      <h3>What the runtime itself panics about</h3>
      <p>
        Most panics you meet in practice are not yours. These four are the ones you will actually
        see, and all of them are recoverable:
      </p>

      <CodeBlock language="go" title="The four runtime panics you will meet, plus recover mechanics">
{`package main

import "fmt"

// recover() only does anything when called DIRECTLY from a deferred function
// during a panic. Everywhere else it returns nil.
func recoverOutsideDefer() {
	fmt.Println("recover() called normally returns:", recover())
}

func main() {
	recoverOutsideDefer()

	// Deferred calls still run while a panic unwinds — this is why defer is
	// safe for cleanup even in the presence of panics. Note the LIFO order:
	// the recover was registered second, so it runs first.
	func() {
		defer fmt.Println("  deferred cleanup ran during the unwind")
		defer func() { fmt.Println("  recovered:", recover()) }()
		panic("unrecoverable-looking")
	}()

	for _, f := range []func(){
		func() { var m map[string]int; m["x"] = 1 },
		func() { s := []int{1, 2, 3}; _ = s[5] },
		func() { a, b := 1, 0; _ = a / b },
		func() { var p *int; _ = *p },
	} {
		func() {
			defer func() { fmt.Printf("  runtime panic: %v\\n", recover()) }()
			f()
		}()
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`recover() called normally returns: <nil>
  recovered: unrecoverable-looking
  deferred cleanup ran during the unwind
  runtime panic: assignment to entry in nil map
  runtime panic: runtime error: index out of range [5] with length 3
  runtime panic: runtime error: integer divide by zero
  runtime panic: runtime error: invalid memory address or nil pointer dereference`}
      </CodeBlock>

      <p>
        Three mechanical rules are visible there. <code>recover()</code> returns <code>nil</code>{' '}
        unless it is called directly from a deferred function during a panic — not from a function
        the deferred function calls, and not just anywhere. Deferred calls <em>do</em> run during an
        unwind, which is what makes <code>defer</code> a safe replacement for{' '}
        <code>finally</code> and for C++ RAII. And defers run <strong>LIFO</strong>, which is why
        &quot;recovered&quot; printed before &quot;cleanup&quot;.
      </p>

      <h3>Converting a panic to an error at a package boundary</h3>
      <p>
        There is one place where an internal panic is a genuinely good design: a deeply recursive
        algorithm — a parser, a tree walk — where threading an error return through every frame would
        obscure the actual logic. Panic to unwind, recover at the exported function, and convert.
        This is what <code>encoding/json</code> and <code>text/template</code> do internally.
      </p>
      <p>
        The mechanism that makes it work is the <strong>named return value</strong>: a deferred
        closure can assign to it after the <code>return</code> statement has already chosen a value.
      </p>

      <CodeBlock language="go" title="panic to unwind, recover to convert — and re-panic on anything unexpected">
{`type parseError struct{ at int }

func (e parseError) Error() string { return fmt.Sprintf("parse: bad token at %d", e.at) }

// Note "err error" — a NAMED return. That is what lets the deferred closure
// set it after the body has already returned.
func parse(s string) (n int, err error) {
	defer func() {
		v := recover()
		if v == nil {
			return
		}
		// Only absorb OUR OWN panic type. Anything else is a real bug and
		// must keep unwinding.
		pe, ok := v.(parseError)
		if !ok {
			panic(v)
		}
		err = pe
	}()
	return parseDigits(s, 0), nil
}

func parseDigits(s string, i int) int {
	if i >= len(s) {
		return 0
	}
	if s[i] < '0' || s[i] > '9' {
		panic(parseError{at: i})
	}
	return int(s[i]-'0') + 10*parseDigits(s, i+1)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`parse("123") -> n=321 err=<nil>  errors.As(parseError)=false
parse("12x") -> n=0 err=parse: bad token at 2  errors.As(parseError)=true`}
      </CodeBlock>

      <p>
        The critical line is <code>if !ok {'{ panic(v) }'}</code>. A recover that swallows{' '}
        <em>everything</em> turns a nil-pointer dereference in your own code into a vague error and
        destroys the stack trace that would have found it. Always narrow by type and re-panic the
        rest. And note the contract this creates: the panic never escapes the package. Callers see
        only <code>(int, error)</code>.
      </p>

      <InfoBox variant="warning" title="(n=321 is not a bug in the lesson)">
        <p>
          <code>parseDigits</code> above accumulates digits least-significant-first, so{' '}
          <code>&quot;123&quot;</code> genuinely parses to <code>321</code>. It is a deliberately
          minimal recursive function whose job here is to have a deep call stack and a failure in the
          middle of it, not to be a correct integer parser. Use{' '}
          <code>strconv.Atoi</code> for that.
        </p>
      </InfoBox>

      <h2>The <code>recover</code> You Will Actually Write: a Server Boundary</h2>
      <p>
        Here is the part that matters operationally. First, what <code>net/http</code> already does
        for you, measured against a real socket:
      </p>

      <CodeBlock language="go" title="A handler that panics, against a real server">
{`func panicky(w http.ResponseWriter, r *http.Request) {
	var m map[string]string
	m["boom"] = "write to a nil map" // panics
	fmt.Fprintln(w, "never reached")
}

func ok(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "still alive")
}

func main() {
	// Keep stderr readable: we only want to see THAT it logged, not 30 frames.
	log.SetOutput(io.Discard)

	mux := http.NewServeMux()
	mux.HandleFunc("/panic", panicky)
	mux.HandleFunc("/ok", ok)

	srv := httptest.NewServer(mux) // a real socket, not a Recorder
	defer srv.Close()

	// Fresh connection per request, so the client does not silently retry.
	client := &http.Client{Transport: &http.Transport{DisableKeepAlives: true}}

	for _, path := range []string{"/ok", "/panic", "/ok"} {
		resp, err := client.Get(srv.URL + path)
		if err != nil {
			fmt.Printf("GET %-7s -> no response at all: %v\\n", path, err)
			continue
		}
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()
		fmt.Printf("GET %-7s -> %s  body=%q\\n", path, resp.Status, strings.TrimSpace(string(body)))
	}
	fmt.Println("and the process is still serving.")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`GET /ok     -> 200 OK  body="still alive"
GET /panic  -> no response at all: Get "http://127.0.0.1:55880/panic": EOF
GET /ok     -> 200 OK  body="still alive"`}
      </CodeBlock>

      <p>
        So <code>net/http</code> does recover per connection: the process survived and the next
        request was served. But look at what the client got — <strong>no status code at all</strong>.
        Not a 500; an <code>EOF</code>, because the server logged the panic and closed the
        connection mid-response. Your load balancer sees a dropped connection, your client sees a
        transport error, and your observability sees a stack trace on stderr with none of the request
        context attached.
      </p>
      <p>
        That is why every production Go service has a recover middleware. Note that this is{' '}
        <strong>not</strong> error handling — it is a blast-radius limiter at a boundary, which is the
        same role as a top-level <code>process.on(&apos;uncaughtException&apos;)</code> in Node or an{' '}
        <code>@ControllerAdvice</code> catching <code>RuntimeException</code> in Spring:
      </p>

      <CodeBlock language="go" title="The recover middleware, verbatim">
{`// Recover is the one legitimate "catch-all" in a Go service: a boundary
// guard. It does NOT make panics an error-handling mechanism — it stops one
// bad request from taking the connection (or worse) with it.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				// http.ErrAbortHandler is net/http's own signal; re-panic it.
				if v == http.ErrAbortHandler {
					panic(v)
				}
				slog.Error("panic recovered",
					"method", r.Method, "path", r.URL.Path,
					"panic", fmt.Sprint(v),
					"stack", string(debug.Stack()))
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				_, _ = w.Write([]byte(\`{"error":"internal"}\`))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ... and then wrap the mux with it:
srv := httptest.NewServer(Recover(mux))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same three requests, same handler, with Recover in front">
{`GET /ok     -> 200 OK  body="still alive"
GET /panic  -> 500 Internal Server Error  body="{\\"error\\":\\"internal\\"}"
GET /ok     -> 200 OK  body="still alive"`}
      </CodeBlock>

      <p>
        A real 500 with a real body, a structured log line carrying the method, path and stack, and
        the connection intact. Four details in that middleware are load-bearing:
      </p>
      <ul>
        <li>
          <code>recover()</code> is called <em>directly</em> in the deferred closure. Factoring it
          into a helper function that the closure calls makes it return <code>nil</code> and the
          middleware silently stops working.
        </li>
        <li>
          <code>http.ErrAbortHandler</code> is re-panicked. <code>net/http</code> uses that specific
          panic value internally to abort a response without logging; swallowing it breaks{' '}
          <code>httputil.ReverseProxy</code> and anything using{' '}
          <code>http.NewResponseController</code>.
        </li>
        <li>
          <code>debug.Stack()</code> is captured <em>inside</em> the deferred function, while the
          panicking frames are still on the stack. Capture it anywhere else and you get the stack of
          your logging code.
        </li>
        <li>
          <code>w.WriteHeader(500)</code> only works if the handler had not already written a status.
          If the panic happened halfway through streaming a 200, you cannot un-send it — the middleware
          will log a <code>superfluous WriteHeader</code> complaint and the client gets a truncated
          body. There is no fix for that other than buffering, which has its own costs.
        </li>
      </ul>

      <InfoBox variant="danger" title="A panic in a goroutine you spawned kills the whole process">
        <p>
          This is the one that takes production down, and it is the single most important sentence in
          this lesson for a Node developer. <code>recover</code> is{' '}
          <strong>per-goroutine</strong>. A recover in your handler cannot see a panic in a goroutine
          that handler started, and an unrecovered panic in <em>any</em> goroutine terminates the
          entire program — not just that goroutine.
        </p>
        <CodeBlock language="go" title="main.go">
{`func main() {
	// This defer/recover is in main's goroutine. It cannot see a panic that
	// happens in a different goroutine — recover is per-goroutine.
	defer func() {
		fmt.Println("main's recover saw:", recover())
	}()

	go func() {
		panic("background work failed")
	}()

	time.Sleep(100 * time.Millisecond)
	fmt.Println("this line never runs")
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64 (exit status 2)">
{`panic: background work failed

goroutine 7 [running]:
main.main.func2()
	/.../main.go:16 +0x2c
created by main.main in goroutine 1
	/.../main.go:15 +0x40
exit status 2`}
        </CodeBlock>
        <p>
          Neither print statement ran. The deferred <code>recover</code> in <code>main</code> never
          executed, because the process was already gone. Compare Node, where an unhandled promise
          rejection has historically been survivable and is still only fatal by default rather than
          by design, and Java, where an uncaught exception kills one thread and the JVM keeps going.
          Go has no such mercy.
        </p>
        <p>
          The consequence for your code: <strong>every</strong> <code>go func()</code> that runs
          anything non-trivial needs its own <code>defer</code>/<code>recover</code>, or a helper
          that supplies one. The <a href="/go/goroutines">goroutines lesson</a> and{' '}
          <a href="/go/concurrency-patterns">concurrency patterns</a> cover how to wrap that up so
          you are not writing it by hand forty times.
        </p>
      </InfoBox>

      <h2>Side by Side</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Concern</th>
            <th style={headStyle}>Node</th>
            <th style={headStyle}>Java</th>
            <th style={headStyle}>Go</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Signal a failure</td>
            <td style={cellStyle}><code>throw</code> / reject</td>
            <td style={cellStyle}><code>throw</code></td>
            <td style={cellStyle}><code>return err</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Visible in the signature</td>
            <td style={cellStyle}>no</td>
            <td style={cellStyle}>checked only; most real code uses unchecked</td>
            <td style={cellStyle}>always</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Match a specific failure</td>
            <td style={cellStyle}><code>e.code === &apos;ENOENT&apos;</code></td>
            <td style={cellStyle}><code>catch (FileNotFoundException e)</code></td>
            <td style={cellStyle}><code>errors.Is(err, fs.ErrNotExist)</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Get structured detail out</td>
            <td style={cellStyle}>read properties off the thrown object</td>
            <td style={cellStyle}>catch the subclass, call its getters</td>
            <td style={cellStyle}><code>errors.As(err, &amp;target)</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Add context on the way up</td>
            <td style={cellStyle}><code>new Error(msg, {'{ cause }'})</code></td>
            <td style={cellStyle}><code>new XException(msg, cause)</code></td>
            <td style={cellStyle}><code>fmt.Errorf(&quot;ctx: %w&quot;, err)</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Where is the stack trace?</td>
            <td style={cellStyle}>on the Error, automatically</td>
            <td style={cellStyle}>on the Throwable, automatically</td>
            <td style={cellStyle}>nowhere — the wrap chain replaces it</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Guaranteed cleanup</td>
            <td style={cellStyle}><code>finally</code></td>
            <td style={cellStyle}><code>finally</code> / try-with-resources</td>
            <td style={cellStyle}><code>defer</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Uncaught, in a worker</td>
            <td style={cellStyle}>kills that worker thread</td>
            <td style={cellStyle}>kills that thread, JVM lives</td>
            <td style={cellStyle}><strong>kills the whole process</strong></td>
          </tr>
        </tbody>
      </table>

      <p>
        The &quot;no stack trace&quot; row is the one that stings for the first week. Go&apos;s answer
        is that a wrap chain carrying real values (<code>loadUser 42</code>,{' '}
        <code>query &quot;SELECT 1&quot; code 503</code>) is more useful than a list of line numbers,
        and in my experience that is usually right and occasionally infuriating. If you want traces,{' '}
        <code>github.com/pkg/errors</code> was the classic answer and is now archived;{' '}
        <code>log/slog</code> plus disciplined wrapping is the current one. Do not add a
        trace-capturing error library before you have felt the pain — most teams find they do not
        need it.
      </p>

      <h2>Carry These Forward</h2>

      <InfoBox variant="success" title="The seven that matter">
        <ul>
          <li>
            <code>error</code> is a <strong>one-method interface</strong> and an error is an ordinary
            value. There are no exceptions and no <code>finally</code> — <code>defer</code> does
            that job.
          </li>
          <li>
            <strong>Wrap with <code>%w</code>, add context, return.</strong> Handle an error once, at
            the layer that can decide something. <code>%v</code> where you meant <code>%w</code> is a
            silent bug with identical output.
          </li>
          <li>
            <code>errors.Is</code> for identity, <code>errors.As</code> for structure (and{' '}
            <code>As</code> takes a <strong>pointer</strong> to the target or it panics). Never{' '}
            <code>==</code>, never <code>strings.Contains(err.Error(), ...)</code>.
          </li>
          <li>
            Sentinel by default, custom type when the caller needs a field. Both are public API
            forever.
          </li>
          <li>
            <code>errors.Join</code> when you want every failure, not the first; it returns{' '}
            <code>nil</code> when given only nils.
          </li>
          <li>
            <code>panic</code> is for impossible states and startup, not for expected failures.{' '}
            <code>recover</code> only works called directly from a deferred function, and must narrow
            by type and re-panic the rest.
          </li>
          <li>
            <strong>An unrecovered panic in any goroutine kills the process.</strong> One recover
            middleware at the request boundary, and a recover in every goroutine you spawn.
          </li>
        </ul>
      </InfoBox>

      <p>
        One loose end from the <a href="/go/interfaces">interfaces lesson</a> is worth restating here
        because this is where it does damage: never give a function a concrete error return type like{' '}
        <code>*MyError</code>, and never declare <code>var err *MyError</code> intending to return it
        as an <code>error</code>. The typed-nil trap makes <code>err != nil</code> true on your
        success path, and every wrapping and <code>errors.Is</code> habit in this lesson is powerless
        against it.
      </p>
      <p>
        Next: <a href="/go/slices">Slices, Maps &amp; the Aliasing Trap</a> — back to data, and to the
        single most common source of genuine bugs in production Go, which is two slices quietly
        sharing one array.
      </p>
    </LessonLayout>
  );
}

export default Errors;
