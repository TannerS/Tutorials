import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Interfaces() {
  return (
    <LessonLayout
      title="Interfaces Without implements"
      sectionId="go"
      lessonIndex={5}
      prev={{ path: '/go/structs', label: 'Structs, Methods & Composition' }}
      next={{ path: '/go/errors', label: 'Errors Are Values, Not Exceptions' }}
    >
      <p>
        <a href="/go/structs">Structs</a> gave you data and methods, and took away inheritance. This
        lesson is the other half of the answer: interfaces are how Go gets polymorphism, and they
        work in a way that is genuinely different from every language you are bringing with you.
      </p>
      <p>
        The single sentence: <strong>a type satisfies an interface by having the right methods, and
        nothing anywhere says so.</strong> No <code>implements</code>, no <code>: IFoo</code>, no
        registration, no annotation. The compiler checks the method set at the point where you assign
        the value, and that is the entire mechanism.
      </p>
      <p>Each of your three languages mispredicts a different part of this:</p>
      <ul>
        <li>
          <strong>Java</strong> expects a <em>nominal</em> contract — the class declares{' '}
          <code>implements Runnable</code> and the compiler verifies the declaration. In Go the
          relationship is <em>structural</em> and inferred, which means a type can satisfy an
          interface that was written years later by someone who never saw it.
        </li>
        <li>
          <strong>Node</strong> expects duck typing, which is close — but JavaScript&apos;s duck
          typing is checked at the moment of the call, at runtime, by crashing. Go&apos;s is checked
          at compile time, by the compiler, at the assignment. Same flexibility, opposite failure
          time. (If you have written TypeScript, its structural typing is actually the closest
          analogue in anything you know.)
        </li>
        <li>
          <strong>C++</strong> offers two things that look like this — abstract base classes (nominal,
          plus a vtable, plus inheritance) and templates (structural, but resolved at compile time
          with no runtime indirection). A Go interface is a third point: structural, resolved at
          compile time, but dispatched dynamically through a value that carries its own type
          information.
        </li>
      </ul>

      <h2>The Type Never Mentions the Interface</h2>
      <p>
        Here is the whole idea in one file. One interface, two unrelated concrete types, neither of
        which refers to it:
      </p>

      <CodeBlock language="go" title="Implicit satisfaction">
{`package main

import (
	"fmt"
	"strings"
)

// The CONSUMER declares the interface: this is the code that needs a thing
// to notify with. Nothing below is required to import or even know about it.
type Notifier interface {
	Notify(msg string) error
}

// Two unrelated types. Neither says "implements". Neither mentions Notifier.
type EmailSender struct{ To string }

func (e EmailSender) Notify(msg string) error {
	fmt.Printf("email -> %s: %s\\n", e.To, msg)
	return nil
}

type auditLog struct{ sb strings.Builder }

func (a *auditLog) Notify(msg string) error {
	a.sb.WriteString(msg + ";")
	return nil
}

// Optional, free, and worth writing: a compile-time assertion that these
// types still satisfy Notifier. Costs nothing at runtime.
var (
	_ Notifier = EmailSender{}
	_ Notifier = (*auditLog)(nil)
)

func alertAll(ns []Notifier, msg string) {
	for _, n := range ns {
		fmt.Printf("  dispatching through %T\\n", n)
		_ = n.Notify(msg)
	}
}

func main() {
	al := &auditLog{}
	alertAll([]Notifier{EmailSender{To: "ops@example.com"}, al}, "disk 91% full")
	fmt.Printf("audit buffer: %q\\n", al.sb.String())
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`  dispatching through main.EmailSender
email -> ops@example.com: disk 91% full
  dispatching through *main.auditLog
audit buffer: "disk 91% full;"`}
      </CodeBlock>

      <p>
        Two things in there are worth naming. The slice <code>[]Notifier</code> holds a value type
        and a pointer type side by side — the interface does not care which, only that the method
        set lines up. And <code>auditLog</code> is <em>unexported</em>, so callers outside its
        package can never name the type, but they can still receive and use it through{' '}
        <code>Notifier</code>. That combination — unexported concrete type, exported interface — is
        extremely common in Go libraries.
      </p>

      <InfoBox variant="tip" title="var _ Iface = (*T)(nil) is the idiom to steal today">
        <p>
          Because satisfaction is implicit, nothing tells you when you <em>stop</em> satisfying an
          interface — you rename a method, and the only error appears at some distant call site, or
          at a call site in a package you do not own. The blank-identifier assignment above is a
          free, zero-runtime-cost compile-time assertion that <code>T</code> still fits.{' '}
          <code>(*T)(nil)</code> is a typed nil pointer, which is enough to carry the method set
          without allocating anything. Put one next to each type that exists to satisfy an
          interface. (And keep that phrase &quot;typed nil pointer&quot; in mind — it comes back at
          the end of this lesson wearing a much less friendly hat.)
        </p>
      </InfoBox>

      <h3>What a near-miss looks like</h3>
      <p>
        The flip side of implicit satisfaction is that the compiler has to explain a <em>negative</em>:
        not &quot;you forgot to write <code>implements</code>&quot; but &quot;the shape does not
        match, here is how.&quot; It is good at this.
      </p>

      <CodeBlock language="go" title="main.go — two types that almost satisfy Notifier">
{`package main

type Notifier interface {
	Notify(msg string) error
}

// Right name, wrong signature: no error return.
type SMS struct{}

func (s SMS) Notify(msg string) {}

// Right signature, but declared on a POINTER receiver.
type Webhook struct{}

func (w *Webhook) Notify(msg string) error { return nil }

func main() {
	var a Notifier = SMS{}
	var b Notifier = Webhook{}
	var c Notifier = &Webhook{} // this one is fine
	_, _, _ = a, b, c
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5 darwin/arm64">
{`# example.com/nosat
./main.go:18:19: cannot use SMS{} (value of struct type SMS) as Notifier value in variable declaration: SMS does not implement Notifier (wrong type for method Notify)
		have Notify(string)
		want Notify(string) error
./main.go:19:19: cannot use Webhook{} (value of struct type Webhook) as Notifier value in variable declaration: Webhook does not implement Notifier (method Notify has pointer receiver)`}
      </CodeBlock>

      <p>
        The second error is the promise the <a href="/go/structs">structs lesson</a> made, now
        collected. <code>Notify</code> is declared on <code>*Webhook</code>, so it is in the method
        set of <code>*Webhook</code> and <em>not</em> in the method set of <code>Webhook</code>.
        Line 20 compiles because <code>&amp;Webhook{'{}'}</code> is a <code>*Webhook</code>.
      </p>
      <p>
        The rule, stated once so you can stop re-deriving it: the method set of <code>T</code>{' '}
        contains only its value-receiver methods; the method set of <code>*T</code> contains{' '}
        <strong>both</strong> its value-receiver and its pointer-receiver methods. Pointers see
        everything, values see half. This is why the structs lesson told you to keep receivers
        consistent across a type — the moment you mix them, only <code>*T</code> satisfies your
        interfaces, and a reader has to go check which.
      </p>

      <InfoBox variant="warning" title="The automatic &amp; does not help you here">
        <p>
          In the structs lesson, <code>c.Inc()</code> worked on a <code>Counter</code> even though{' '}
          <code>Inc</code> had a pointer receiver, because the compiler inserts the{' '}
          <code>&amp;</code> for an addressable value. That sugar is a <em>method call</em> feature,
          not a <em>method set</em> feature. Interface satisfaction is decided purely by the method
          set, so no amount of addressability makes <code>Webhook</code> a <code>Notifier</code>. If
          a type has any pointer-receiver method, store and pass <code>*T</code>.
        </p>
      </InfoBox>

      <h2>Who Declares the Interface</h2>
      <p>
        This is the convention that actually changes how you lay out a codebase, and it is the one
        Java habits fight hardest.
      </p>
      <p>
        In Java and C#, an interface ships with its implementations: the library author writes{' '}
        <code>interface PaymentGateway</code> and <code>class StripeGateway implements
        PaymentGateway</code>, side by side, and consumers import the interface from the producer. It
        has to work that way — <code>implements</code> is a declaration, so the implementor needs the
        interface to exist first.
      </p>
      <p>
        Go removes that constraint, and the convention inverted accordingly. <strong>Interfaces are
        usually declared by the package that consumes them</strong>, right next to the function that
        takes one, and they contain exactly the methods that function calls. The producer package
        just exports a concrete struct and never hears about it.
      </p>

      <CodeBlock language="go" title="Who owns what — the shape of a real Go service">
{`// package payments — the PRODUCER. Exports a concrete type. Declares no
// interface, imports nothing from its callers.
package payments

type StripeClient struct{ apiKey string }

func New(key string) *StripeClient            { return &StripeClient{apiKey: key} }
func (c *StripeClient) Charge(cents int64) (string, error) { /* ... */ return "ch_1", nil }
func (c *StripeClient) Refund(id string) error            { /* ... */ return nil }
func (c *StripeClient) ListDisputes() ([]string, error)   { /* ... */ return nil, nil }

// ------------------------------------------------------------------

// package checkout — the CONSUMER. Declares the interface it needs, which is
// ONE method, because that is all this code calls.
package checkout

type Charger interface {
	Charge(cents int64) (string, error)
}

type Service struct{ charger Charger }

func NewService(c Charger) *Service { return &Service{charger: c} }

func (s *Service) Buy(cents int64) (string, error) {
	return s.charger.Charge(cents)
}`}
      </CodeBlock>

      <p>Three consequences, all of them good:</p>
      <ul>
        <li>
          <strong>The dependency arrow points the right way.</strong>{' '}
          <code>checkout</code> imports <code>payments</code> only in <code>main</code>, where the
          wiring happens; the interface itself depends on nothing. <code>payments</code> never
          imports <code>checkout</code>. No import cycles, no &quot;interfaces&quot; package that
          everything depends on.
        </li>
        <li>
          <strong>Tests get trivial.</strong> Faking <code>Charger</code> means writing one method.
          Faking a producer-declared <code>PaymentGateway</code> with all four methods means writing
          four, three of which panic or return zero.
        </li>
        <li>
          <strong>The interface documents the real coupling.</strong> Reading{' '}
          <code>checkout.Charger</code> tells you precisely what <code>checkout</code> needs from a
          payment provider. A four-method interface would have overstated it.
        </li>
      </ul>

      <FlowChart
        title="Do you actually need an interface here?"
        chart={"graph TD\nA[\"I am about to write type X interface\"] --> B{\"Do I have two or more real implementations today?\"}\nB -->|Yes| OK[\"Declare it — in the package that CONSUMES it\"]\nB -->|No| C{\"Do I need to fake it in a test?\"}\nC -->|Yes| OK\nC -->|No| D{\"Is it crossing a module or package boundary<br/>I do not control?\"}\nD -->|Yes| OK\nD -->|No| NO[\"Do not. Use the concrete struct.<br/>Add the interface when the second caller appears.\"]\nOK --> E[\"Keep it to 1-3 methods, named for the behaviour\"]\nstyle OK fill:#1a3329,stroke:#4ade80\nstyle NO fill:#1a2744,stroke:#5b9cf6"}
      />

      <InfoBox variant="warning" title="The Java reflex to unlearn: one interface per class">
        <p>
          A Spring codebase routinely has <code>UserService</code> / <code>UserServiceImpl</code>{' '}
          pairs where the interface exists only so the DI container has something to proxy and the
          test has something to mock. In Go that pattern is pure overhead: there is no container, and
          an interface with exactly one implementation adds a layer of indirection, hides the
          concrete type&apos;s other useful methods, and makes you jump twice to read anything.
        </p>
        <p>
          Note also the naming. Go interfaces are named for the <em>behaviour</em>, usually with an{' '}
          <code>-er</code> suffix — <code>Reader</code>, <code>Stringer</code>,{' '}
          <code>Handler</code>, <code>Charger</code> — not <code>IReader</code> or{' '}
          <code>ReaderInterface</code>. And the concrete type is never <code>XxxImpl</code>; it is
          named for what it concretely is (<code>StripeClient</code>, <code>FileStore</code>).
        </p>
      </InfoBox>

      <h2>Small Interfaces, and Why the Standard Library Composes</h2>
      <p>
        Go&apos;s interface culture is &quot;one or two methods&quot; and the standard library is the
        proof. Straight from the local toolchain:
      </p>

      <CodeBlock language="text" title="Real output — go doc io.Writer, go1.25.5">
{`package io // import "io"

type Writer interface {
	Write(p []byte) (n int, err error)
}
    Writer is the interface that wraps the basic Write method.

    Write writes len(p) bytes from p to the underlying data stream. It returns
    the number of bytes written from p (0 <= n <= len(p)) and any error
    encountered that caused the write to stop early. Write must return a non-nil
    error if it returns n < len(p). Write must not modify the slice data,
    even temporarily.

    Implementations must not retain p.`}
      </CodeBlock>

      <p>
        One method. The <code>io</code> package declares 22 exported interfaces in total, and most of
        them are one method or a composition of one-method ones:
      </p>

      <CodeBlock language="text" title="Real output — go doc io | grep, go1.25.5">
{`$ go doc io | grep -E '^type [A-Z][A-Za-z]* interface'
type ByteReader interface{ ... }
type ByteScanner interface{ ... }
type ByteWriter interface{ ... }
type Closer interface{ ... }
type ReadCloser interface{ ... }
type ReadSeekCloser interface{ ... }
type ReadSeeker interface{ ... }
type ReadWriteCloser interface{ ... }
type ReadWriteSeeker interface{ ... }
type ReadWriter interface{ ... }
type Reader interface{ ... }
type ReaderAt interface{ ... }
type ReaderFrom interface{ ... }
type RuneReader interface{ ... }
type RuneScanner interface{ ... }
type Seeker interface{ ... }
type StringWriter interface{ ... }
type WriteCloser interface{ ... }
type WriteSeeker interface{ ... }
type Writer interface{ ... }
type WriterAt interface{ ... }
type WriterTo interface{ ... }`}
      </CodeBlock>

      <p>
        The compound names are not separate designs. An interface can <strong>embed</strong> other
        interfaces, and the result is the union of their method sets:
      </p>

      <CodeBlock language="text" title="Real output — go doc io.ReadWriteCloser, go1.25.5">
{`package io // import "io"

type ReadWriteCloser interface {
	Reader
	Writer
	Closer
}
    ReadWriteCloser is the interface that groups the basic Read, Write and Close
    methods.`}
      </CodeBlock>

      <p>
        That is the whole trick, and the payoff is large. Write <code>Write([]byte) (int, error)</code>{' '}
        once and the entire ecosystem accepts your type — <code>fmt</code>,{' '}
        <code>encoding/json</code>, <code>compress/gzip</code>, <code>crypto/sha256</code>,{' '}
        <code>net/http</code>, <code>io.Copy</code>, <code>io.MultiWriter</code>, every logger, every
        template engine. Measured rather than claimed:
      </p>

      <CodeBlock language="go" title="One method, and the standard library opens up">
{`package main

import (
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

// One method. That is the whole contract.
type countingWriter struct{ n int64 }

func (c *countingWriter) Write(p []byte) (int, error) {
	c.n += int64(len(p))
	return len(p), nil
}

func main() {
	var cw countingWriter

	// fmt will write to it.
	fmt.Fprintf(&cw, "hello %s\\n", "world")
	fmt.Println("after Fprintf:        ", cw.n, "bytes")

	// encoding/json will write to it.
	_ = json.NewEncoder(&cw).Encode(map[string]int{"a": 1})
	fmt.Println("after json.Encode:    ", cw.n, "bytes")

	// io.Copy will pump any io.Reader into it.
	moved, _ := io.Copy(&cw, strings.NewReader(strings.Repeat("x", 100)))
	fmt.Printf("io.Copy moved %d, total %d bytes\\n", moved, cw.n)

	// And it composes: fan one stream out to a hash AND a gzip stream,
	// counting the compressed bytes on the far side.
	var compressed countingWriter
	h := sha256.New()                 // hash.Hash embeds io.Writer
	gz := gzip.NewWriter(&compressed) // *gzip.Writer is an io.Writer too
	fan := io.MultiWriter(h, gz)      // so is the fan-out

	in := strings.Repeat("go ", 500)
	_, _ = io.Copy(fan, strings.NewReader(in))
	_ = gz.Close()

	fmt.Printf("%d bytes in -> %d bytes gzipped, sha256 %s...\\n",
		len(in), compressed.n, hex.EncodeToString(h.Sum(nil))[:16])
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`after Fprintf:         12 bytes
after json.Encode:     20 bytes
io.Copy moved 100, total 120 bytes
1500 bytes in -> 37 bytes gzipped, sha256 100948799485d062...`}
      </CodeBlock>

      <p>
        Nothing in <code>compress/gzip</code>, <code>crypto/sha256</code>, or{' '}
        <code>encoding/json</code> knows <code>countingWriter</code> exists, and{' '}
        <code>countingWriter</code> imports none of them. Compare the Node equivalent: to plug into
        the stream ecosystem you extend <code>stream.Writable</code> and implement{' '}
        <code>_write</code>, which is nominal inheritance with a base class you must import — and if
        a library wanted a <code>Transform</code> instead, you are rewriting. Compare Java: you
        implement <code>java.io.Writer</code> or <code>Appendable</code> or{' '}
        <code>WritableByteChannel</code>, declared up front, each with its own hierarchy.
      </p>

      <InfoBox variant="info" title="Why small interfaces specifically">
        <p>
          A one-method interface is satisfiable by accident, and that is a feature: it makes the set
          of types that fit enormous. The bigger the interface, the smaller that set, and the more
          likely that the only type that fits is the one you were already thinking of — at which
          point the interface has stopped buying abstraction and is only costing indirection. Rob
          Pike&apos;s version: &quot;the bigger the interface, the weaker the abstraction.&quot;
        </p>
        <p>
          A useful smell test: if your interface has more than about four methods, it is probably
          describing a <em>type</em> rather than a <em>behaviour</em>, and the thing you actually
          wanted was the concrete struct.
        </p>
      </InfoBox>

      <h2>Accept Interfaces, Return Structs</h2>
      <p>
        The second piece of received Go wisdom, and unlike most received wisdom it has a crisp
        reason. Parameters should be interfaces so callers can supply anything; return values should
        be concrete so callers lose nothing.
      </p>
      <p>
        Returning an interface throws away information. If <code>NewStore</code> returns{' '}
        <code>Store</code> (an interface), every method you later add to the concrete type is
        invisible until you also add it to the interface — which is a breaking change for anyone who
        implemented it. Return <code>*FileStore</code> and the caller can use every method, read
        every field, and pick whichever interface <em>they</em> need.
      </p>

      <CodeBlock language="go" title="Accepting an interface, and decorating one by embedding it">
{`package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io"
	"os"
	"strings"
)

// Embedding an INTERFACE in a struct promotes all of its methods. countedRW
// satisfies io.ReadWriter having written exactly one method itself.
type countedRW struct {
	io.ReadWriter // whatever was injected supplies Read, and the base Write
	written       int
}

func (c *countedRW) Write(p []byte) (int, error) {
	n, err := c.ReadWriter.Write(p) // explicit delegation, no super
	c.written += n
	return n, err
}

// ACCEPT INTERFACES: greet works against a file, a socket, a buffer, a gzip
// stream or an httptest recorder, and depends on none of them.
func greet(w io.Writer, name string) error {
	_, err := fmt.Fprintf(w, "hello, %s\\n", name)
	return err
}

func main() {
	var buf bytes.Buffer
	rw := &countedRW{ReadWriter: &buf}

	_ = greet(rw, "ada")
	_ = greet(rw, "grace")
	fmt.Printf("counted %d bytes through the decorator\\n", rw.written)

	// Read is promoted from the embedded value; nothing was written for it.
	line, _ := bufio.NewReader(rw).ReadString('\\n')
	fmt.Printf("promoted Read gave: %q\\n", line)

	// The same function, four unrelated sinks.
	_ = greet(os.Stdout, "stdout")
	_ = greet(io.Discard, "nobody") // measured by producing no output
	var sb strings.Builder
	_ = greet(&sb, "strings.Builder")
	fmt.Print(sb.String())

	fmt.Printf("countedRW satisfies io.ReadWriter: %T\\n", io.ReadWriter(rw))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`counted 24 bytes through the decorator
promoted Read gave: "hello, ada\\n"
hello, stdout
hello, strings.Builder
countedRW satisfies io.ReadWriter: *main.countedRW`}
      </CodeBlock>

      <p>
        Note what <code>greet(io.Discard, "nobody")</code> did: nothing, visibly. That line produced
        no output, which is the evidence that it worked — <code>io.Discard</code> is a{' '}
        <code>Writer</code> that throws bytes away, and it is how you silence a dependency that
        insists on logging.
      </p>
      <p>
        The <code>countedRW</code> type is the embedding trick the structs lesson promised:{' '}
        <strong>embed an interface, override the one method you care about, and the rest is
        promoted.</strong> It is the decorator pattern with no boilerplate. But look closely at{' '}
        <code>c.ReadWriter.Write(p)</code> — that is an explicit call to the embedded value, not{' '}
        <code>super.write()</code>. The same rule as the last lesson still applies: there is no
        dispatch back from the inner value to the outer one. If the embedded implementation&apos;s{' '}
        <code>Read</code> internally called <code>Write</code>, it would call its own, not yours.
      </p>

      <InfoBox variant="danger" title="An embedded nil interface is a panic in waiting">
        <p>
          <code>countedRW{'{}'}</code> with no <code>ReadWriter</code> supplied compiles fine and
          still satisfies <code>io.ReadWriter</code>, because a method set is a compile-time property
          of the type and has nothing to do with whether the field is populated:
        </p>
        <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`zero countedRW still satisfies io.ReadWriter: *main.countedRW
first Read on it: runtime error: invalid memory address or nil pointer dereference`}
        </CodeBlock>
        <p>
          Embedding an interface hands you a constructor obligation that the type system will never
          remind you about. Either make the field unexported behind a <code>New</code> function that
          requires it, or nil-check before delegating.
        </p>
      </InfoBox>

      <h2>The Empty Interface, and <code>any</code></h2>
      <p>
        An interface with no methods is satisfied by every type, because every type has at least no
        methods. Written out, that is <code>interface{'{}'}</code>. Since Go 1.18 there is a
        predeclared alias, which is now what you should write — straight out of the local
        toolchain&apos;s own source:
      </p>

      <CodeBlock language="text" title="Real output — grep $(go env GOROOT)/src/builtin/builtin.go, go1.25.5">
{`97:type any = interface{}`}
      </CodeBlock>

      <p>
        <strong>Alias</strong>, not a new type — the <code>=</code> matters. <code>any</code> and{' '}
        <code>interface{'{}'}</code> are the same type, interchangeable in both directions, including
        through slices and maps: a <code>[]any</code> is assignable to a{' '}
        <code>[]interface{'{}'}</code> with no conversion. Older code and older tutorials use the
        long form; they are identical.
      </p>
      <p>
        If you are coming from TypeScript, resist the obvious analogy. TS <code>any</code> disables
        type checking. Go <code>any</code> does the opposite — it is a real static type with exactly
        zero methods, so the compiler lets you do <em>nothing</em> with it until you prove what is
        inside. It is much closer to TS <code>unknown</code>, or to Java{' '}
        <code>Object</code>.
      </p>

      <h3>Getting the value back out</h3>
      <p>
        A <strong>type assertion</strong> recovers the concrete type. It has two forms, and the
        difference is whether a wrong guess panics. A <strong>type switch</strong> is the multi-way
        version, and it can also match other interfaces:
      </p>

      <CodeBlock language="go" title="Type switches, type assertions, and what each one costs">
{`package main

import (
	"errors"
	"fmt"
	"time"
)

func describe(v any) string {
	switch x := v.(type) {
	case nil:
		return "nil — the interface held no type at all"
	case int:
		return fmt.Sprintf("int %d (doubled: %d)", x, x*2)
	case string:
		return fmt.Sprintf("string of length %d", len(x))
	case []byte:
		return fmt.Sprintf("[]byte %q", x)
	case error:
		// An interface case: matches any dynamic type with Error() string.
		return "error: " + x.Error()
	case fmt.Stringer:
		// Also an interface case, and ORDER MATTERS — see time.Duration below.
		return "Stringer: " + x.String()
	default:
		return fmt.Sprintf("unhandled dynamic type %T", x)
	}
}

func main() {
	for _, v := range []any{
		nil,
		42,
		"hello",
		[]byte("raw"),
		errors.New("boom"),
		2500 * time.Millisecond,
		3.14,
	} {
		fmt.Printf("%-24T -> %s\\n", v, describe(v))
	}

	// Single-type assertion, comma-ok form: never panics.
	var v any = "a string"
	if n, ok := v.(int); ok {
		fmt.Println("it was an int:", n)
	} else {
		fmt.Printf("not an int; n is the zero value %d, ok is %t\\n", n, ok)
	}

	// The one-value form DOES panic. Deliberately triggered, recovered so the
	// rest of the output survives.
	func() {
		defer func() { fmt.Println("recovered:", recover()) }()
		_ = v.(int)
	}()
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`<nil>                    -> nil — the interface held no type at all
int                      -> int 42 (doubled: 84)
string                   -> string of length 5
[]uint8                  -> []byte "raw"
*errors.errorString      -> error: boom
time.Duration            -> Stringer: 2.5s
float64                  -> unhandled dynamic type float64
not an int; n is the zero value 0, ok is false
recovered: interface conversion: interface {} is string, not int`}
      </CodeBlock>

      <p>Five details in that output that are each worth a sentence:</p>
      <ol>
        <li>
          <code>%T</code> of <code>[]byte</code> prints <code>[]uint8</code>, because{' '}
          <code>byte</code> is an alias for <code>uint8</code> and the printer shows the underlying
          name. The <code>case []byte</code> still matched. Expect to see <code>uint8</code> in error
          messages where you wrote <code>byte</code>.
        </li>
        <li>
          <code>errors.New(&quot;boom&quot;)</code> has dynamic type{' '}
          <code>*errors.errorString</code> — an unexported struct pointer you can never name. It
          matched the <code>case error</code> anyway, which is the whole point of interface cases.
        </li>
        <li>
          <code>time.Duration</code> hit the <code>Stringer</code> case, not <code>case int</code>.
          Its underlying type is <code>int64</code>, but a named type is <em>not</em> its underlying
          type for assertion purposes — a type switch matches identity, never convertibility.
        </li>
        <li>
          Type-switch cases are tested <strong>in order</strong>, first match wins, and interface
          cases are where that stops being academic. Demonstrated below.
        </li>
        <li>
          The comma-ok form gives you the <strong>zero value</strong> on failure (<code>0</code>),
          not a nil or an error. And the one-value form panics with a message that names both types,
          which is at least a readable crash.
        </li>
      </ol>

      <p>
        The ordering point deserves running rather than asserting, because a domain error type that
        also has a <code>String()</code> method is a completely ordinary thing to write:
      </p>

      <CodeBlock language="go" title="One value, two case orders, two different answers">
{`// HTTPError satisfies BOTH error and fmt.Stringer.
type HTTPError struct{ Code int }

func (e HTTPError) Error() string  { return fmt.Sprintf("http %d", e.Code) }
func (e HTTPError) String() string { return fmt.Sprintf("HTTP Error #%d", e.Code) }

func errorFirst(v any) string {
	switch x := v.(type) {
	case error:
		return "error -> " + x.Error()
	case fmt.Stringer:
		return "Stringer -> " + x.String()
	}
	return "no match"
}

func stringerFirst(v any) string {
	switch x := v.(type) {
	case fmt.Stringer:
		return "Stringer -> " + x.String()
	case error:
		return "error -> " + x.Error()
	}
	return "no match"
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`errorFirst   : error -> http 503
stringerFirst: Stringer -> HTTP Error #503
errorFirst   : error -> boom
stringerFirst: error -> boom`}
      </CodeBlock>

      <p>
        Same <code>HTTPError{'{503}'}</code>, two different results purely from case order. The last
        two lines are <code>errors.New(&quot;boom&quot;)</code>, which has no{' '}
        <code>String()</code> method, so it reaches <code>case error</code> either way — which is
        exactly what makes the bug hard to spot in testing. The rule: put <strong>concrete types
        before interfaces</strong>, and <strong>more specific interfaces before more general
        ones</strong>. Unlike a TypeScript discriminated union, there is no exhaustiveness check and
        no warning about an unreachable case.
      </p>

      <InfoBox variant="note" title="any is usually the wrong tool now">
        <p>
          Pre-1.18, <code>any</code> was how you wrote a generic container, and the cost was a type
          assertion at every read plus no compile-time safety. Since generics landed, a type
          parameter does that job properly:{' '}
          <code>func Map[T, U any](in []T, f func(T) U) []U</code> keeps the types. Reach for{' '}
          <code>any</code> only where the set of types genuinely is open-ended and inspected at
          runtime — which in practice means printf-style APIs, decoding unknown JSON into{' '}
          <code>map[string]any</code>, and <code>database/sql</code> scan targets. The{' '}
          <a href="/go/generics">generics lesson</a> covers the alternative and its real limits.
        </p>
      </InfoBox>

      <h2>The Typed-Nil Trap</h2>
      <p>
        This is the nastiest bug in Go that the compiler will not help you with, and it is specific
        to interfaces. It bites hardest with <code>error</code>, which is why it is worth meeting
        here, one lesson before the errors lesson.
      </p>
      <p>
        The mechanism is that an interface value is <strong>two words</strong>, not one: a type
        descriptor and a data pointer. Measured:
      </p>

      <CodeBlock language="go" title="An interface value is wider than a pointer">
{`var err error
var p *E // E is some struct type with an Error() method

fmt.Println("sizeof error interface value:", unsafe.Sizeof(err))
fmt.Println("sizeof *E pointer:           ", unsafe.Sizeof(p))
fmt.Println("sizeof any:                  ", unsafe.Sizeof(any(nil)))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`sizeof error interface value: 16
sizeof *E pointer:            8
sizeof any:                   16`}
      </CodeBlock>

      <p>
        16 bytes, two 8-byte words. And <code>iface == nil</code> compares <em>both</em> of them:
      </p>

      <FlowChart
        title="Why an interface can be non-nil while the thing inside it is nil"
        chart={"graph LR\nI[\"an interface value<br/>16 bytes on arm64, measured above\"] --> T[\"type word<br/>which concrete type is in here\"]\nI --> D[\"data word<br/>pointer to the concrete value\"]\nT --> Q{\"iface == nil ?\"}\nD --> Q\nQ -->|\"BOTH words nil\"| Y[\"true\"]\nQ -->|\"type word set, data word nil\"| N[\"false — this is the typed-nil trap\"]\nstyle Y fill:#1a3329,stroke:#4ade80\nstyle N fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        Now the bug. It appears whenever you declare a variable of a <em>concrete</em> error type and
        return it as an <code>error</code>:
      </p>

      <CodeBlock language="go" title="The same function, written two ways">
{`package main

import "fmt"

type ValidationError struct{ Field string }

func (e *ValidationError) Error() string { return "invalid field: " + e.Field }

// THE BUG. The local is a *ValidationError, not an error. Returning it
// widens it into the error interface: type=*ValidationError, data=nil.
// An interface is nil only when BOTH halves are nil.
func validateBroken(name string) error {
	var err *ValidationError
	if name == "" {
		err = &ValidationError{Field: "name"}
	}
	return err
}

// THE FIX. Declare no typed variable; return a literal nil on success.
func validateFixed(name string) error {
	if name == "" {
		return &ValidationError{Field: "name"}
	}
	return nil
}

func report(label string, err error) {
	fmt.Printf("%-20s err != nil: %-5t  %%T: %T\\n", label, err != nil, err)
}

func main() {
	report("broken, valid:", validateBroken("ada"))
	report("broken, invalid:", validateBroken(""))
	report("fixed,  valid:", validateFixed("ada"))
	report("fixed,  invalid:", validateFixed(""))

	// What that first line costs you at the call site:
	if err := validateBroken("ada"); err != nil {
		fmt.Println("\\ntook the error branch for a VALID input, then:")
		defer func() { fmt.Println("  panic:", recover()) }()
		fmt.Println("  err.Error() =", err.Error())
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64 (go vet reports nothing)">
{`broken, valid:       err != nil: true   %T: *main.ValidationError
broken, invalid:     err != nil: true   %T: *main.ValidationError
fixed,  valid:       err != nil: false  %T: <nil>
fixed,  invalid:     err != nil: true   %T: *main.ValidationError

took the error branch for a VALID input, then:
  panic: runtime error: invalid memory address or nil pointer dereference`}
      </CodeBlock>

      <p>
        Read line one again. <code>validateBroken(&quot;ada&quot;)</code> succeeded, returned what
        the author believed was <code>nil</code>, and <code>err != nil</code> is{' '}
        <strong>true</strong>. The two broken lines are indistinguishable from each other at the call
        site. Then <code>err.Error()</code> panics, so a successful validation takes down the
        request.
      </p>

      <FlowChart
        title="The typed-nil trap, step by step"
        chart={"graph TD\nA[\"func validateBroken(name string) error\"] --> B[\"var err *ValidationError<br/>a nil POINTER, 8 bytes, value nil\"]\nB --> C{\"is name empty?\"}\nC -->|no, the happy path| E[\"err is never assigned — still a nil *ValidationError\"]\nC -->|yes| D[\"err = &ValidationError{...}\"]\nE --> F[\"return err\"]\nD --> F\nF --> G[\"the compiler must widen *ValidationError into error\"]\nG --> H[\"resulting interface: type word = *ValidationError, data word = nil\"]\nH --> I{\"caller writes if err != nil\"}\nI --> J[\"type word is non-nil, so the interface is non-nil → TRUE\"]\nJ --> K[\"error branch runs on a successful call;<br/>err.Error() then nil-derefs and panics\"]\nstyle H fill:#3b1a1a,stroke:#f87171\nstyle K fill:#3b1a1a,stroke:#f87171\nstyle E fill:#3d2f14,stroke:#fb923c"}
      />

      <p>
        Two refinements, because the details decide how you debug this.
      </p>
      <p>
        First, the panic is <em>not</em> inherent — it came from <code>Error()</code> touching{' '}
        <code>e.Field</code>. Calling a pointer-receiver method on a nil pointer is perfectly legal
        in Go; only dereferencing inside it is fatal:
      </p>

      <CodeBlock language="go" title="Calling a method on nil is legal. Dereferencing is not.">
{`package main

import "fmt"

type T struct{ F string }

func (t *T) NoDeref() string { return "I never touch t" }
func (t *T) Deref() string   { return t.F }

func main() {
	var p *T // nil
	fmt.Println("calling a method on a nil pointer is legal:", p.NoDeref())
	defer func() { fmt.Println("but dereferencing inside it:", recover()) }()
	fmt.Println(p.Deref())
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`calling a method on a nil pointer is legal: I never touch t
but dereferencing inside it: runtime error: invalid memory address or nil pointer dereference`}
      </CodeBlock>

      <p>
        So the <em>worse</em> version of the typed-nil bug is the one that does not panic. If{' '}
        <code>Error()</code> returns a constant, your service logs a successful operation as a
        failure, forever, silently. The panic is the lucky outcome.
      </p>
      <p>
        Second, this is not just an <code>error</code> problem. Any interface-typed return has it:{' '}
        <code>io.Writer</code>, <code>http.Handler</code>, your own <code>Charger</code>. The{' '}
        <code>error</code> case is just the one you write forty times a day.
      </p>

      <InfoBox variant="danger" title="Three rules that make this unreachable">
        <ul>
          <li>
            <strong>Never give a function a concrete error return type.</strong>{' '}
            <code>func f() *MyError</code> is the root cause; <code>func f() error</code> is the
            cure. This holds even when you &quot;know&quot; the only possible error is yours — the
            moment a caller assigns it to an <code>error</code>, the trap arms itself.
          </li>
          <li>
            <strong>Never declare a typed error variable to return later.</strong> Write{' '}
            <code>return nil</code> on the success path and{' '}
            <code>return &amp;MyError{'{...}'}</code> on the failure path. If you genuinely need a
            variable, declare it as <code>var err error</code> — the interface type — not as the
            concrete pointer.
          </li>
          <li>
            <strong>Be suspicious of helpers that return concrete types.</strong> The classic
            production version of this bug is a helper{' '}
            <code>func validate(...) *ValidationError</code> whose result is passed straight through
            a <code>func handle(...) error</code>. Each function looks fine in isolation; the
            widening happens at the boundary.
          </li>
        </ul>
        <p>
          <code>go vet</code> does not catch this, and neither does the compiler. If you want a
          linter that does, <code>staticcheck</code> flags some shapes of it, and{' '}
          <code>nilness</code> (in <code>golang.org/x/tools</code>) catches others — but neither is
          complete. The discipline above is the real defence.
        </p>
      </InfoBox>

      <h2>Carry These Forward</h2>

      <InfoBox variant="success" title="The six that matter">
        <ul>
          <li>
            Satisfaction is <strong>implicit and structural</strong>, checked at the assignment. A
            type never names the interfaces it satisfies. Use{' '}
            <code>var _ Iface = (*T)(nil)</code> when you want that checked deliberately.
          </li>
          <li>
            The method set of <code>T</code> is its value-receiver methods;{' '}
            <code>*T</code> gets both kinds. Pointer-receiver methods do not satisfy an interface
            through a value, no matter how addressable it is.
          </li>
          <li>
            <strong>Declare interfaces where they are consumed</strong>, containing only the methods
            that consumer calls. Do not write an interface per struct; do not write{' '}
            <code>FooImpl</code>.
          </li>
          <li>
            <strong>Accept interfaces, return structs.</strong> Small interfaces compose; large ones
            are a type description wearing a disguise.
          </li>
          <li>
            <code>any</code> is an <em>alias</em> for <code>interface{'{}'}</code> and is closer to
            TS <code>unknown</code> than to TS <code>any</code>. Type switches match type{' '}
            <strong>identity</strong>, in order, and can match other interfaces.
          </li>
          <li>
            An interface value is two words. <strong>A non-nil interface can hold a nil
            pointer</strong>, so never return a concrete error type and never declare a typed error
            variable.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: <a href="/go/errors">Errors Are Values, Not Exceptions</a>. You have now seen the{' '}
        <code>error</code> interface from the outside, and met the single worst way to get it wrong.
        That lesson covers what to actually do — sentinels, <code>%w</code> wrapping,{' '}
        <code>errors.Is</code> and <code>errors.As</code>, and the narrow set of cases where{' '}
        <code>panic</code> is the right call rather than a <code>throw</code> in disguise.
      </p>
    </LessonLayout>
  );
}

export default Interfaces;
