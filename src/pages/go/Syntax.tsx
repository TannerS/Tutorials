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

function Syntax() {
  return (
    <LessonLayout
      title="Syntax, Types & Zero Values"
      sectionId="go"
      lessonIndex={2}
      prev={{ path: '/go/setup', label: 'Setup, Modules & the Toolchain' }}
      next={{ path: '/go/pointers', label: 'Pointers & Value Semantics' }}
    >
      <p>
        Go&apos;s syntax is small enough that you can read it on day one and be wrong about it for
        a month. The grammar is C-shaped, so your C++ and Java eyes parse it instantly, and that is
        the problem: several constructs that <em>look</em> like things you know behave differently.
        This lesson is about those, in roughly increasing order of how long it takes to get bitten.
      </p>
      <p>
        The two that matter most, and the reason this lesson exists:{' '}
        <strong>every type has a defined zero value, so there is no <code>undefined</code></strong>{' '}
        — which deletes a whole category of JavaScript bug and introduces one new one — and{' '}
        <strong><code>defer</code> evaluates its arguments when you write it, not when it
        runs</strong>, which is the single most common way a Go newcomer ships a wrong number.
      </p>

      <InfoBox variant="note" title="Versions, and what was actually run">
        <p>
          Go <strong>1.27.3</strong> is the current stable release. Every program, compile error and
          output block below was executed on this machine against the locally installed{' '}
          <strong>go1.25.5 darwin/arm64</strong> — so the outputs are what 1.25.5 actually printed.
          One section deliberately runs the <em>same</em> source under two different language
          versions (1.21 and 1.22) via the <code>go</code> directive in <code>go.mod</code>, which
          the <a href="/go/setup">previous lesson</a> explains. The 32-bit figures come from a{' '}
          <code>GOARCH=386</code> cross-compile executed in a Linux container.
        </p>
      </InfoBox>

      <h2>Declarations and <code>:=</code></h2>
      <p>
        Types go <strong>after</strong> the name, which is the first thing your Java reflexes will
        get wrong. <code>var count int</code>, not <code>int count</code>. The reason is
        readability of complex declarations left-to-right, and you stop noticing in a day.
      </p>
      <p>There are three forms and they overlap almost completely:</p>

      <CodeBlock language="go" title="main.go">
{`package main

import "fmt"

// Package level: \`var\` only. \`:=\` is a STATEMENT, and statements cannot
// appear outside a function.
var buildVersion = "dev"

var (
	maxConns  int = 100
	retryWait     = 250 // type inferred: int
)

func main() {
	// Three ways to say the same thing.
	var a int = 7 // explicit type, explicit value
	var b = 7     // type inferred
	c := 7        // short form; only legal inside a function
	fmt.Printf("a=%d b=%d c=%d   all %T\\n", a, b, c, c)

	// \`var\` with no value is how you ask for the zero value on purpose.
	var pending []string
	var seen map[string]bool
	fmt.Printf("pending=%v (nil: %v)  seen=%v (nil: %v)\\n",
		pending, pending == nil, seen, seen == nil)

	// := needs at least ONE new variable on the left. This is what makes the
	// repeated \`x, err := ...\` pattern legal.
	x, err := one()
	y, err := two() // err is reused, y is new - legal
	fmt.Println("x, y, err:", x, y, err)
}

func one() (int, error) { return 1, nil }
func two() (int, error) { return 2, nil }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`a=7 b=7 c=7   all int
pending=[] (nil: true)  seen=map[] (nil: true)
x, y, err: 1 2 <nil>`}
      </CodeBlock>

      <p>
        The working rule is simple: <strong>use <code>:=</code> everywhere inside functions; use{' '}
        <code>var</code> when you specifically want the zero value, when you need a type the
        right-hand side would not infer (<code>var timeout time.Duration = 5</code>), or at package
        scope.</strong>
      </p>

      <CodeBlock language="text" title="Real output — the three ways to get this wrong, go1.25.5">
{`# := with nothing new on the left
./bad.go:5:9: no new variables on left side of :=

# var combined with :=
./bad.go:3:14: syntax error: unexpected :=, expected =

# := at package level
./bad.go:3:1: syntax error: non-declaration statement outside function body`}
      </CodeBlock>

      <InfoBox variant="danger" title="Shadowing: the one that actually costs you money">
        <p>
          <code>:=</code> declares. If the name already exists in an <em>enclosing</em> scope,{' '}
          <code>:=</code> does not assign to it — it creates a new variable that hides it. Combine
          that with <code>err</code> and you get a bug that passes code review:
        </p>
        <CodeBlock language="go" title="shadow.go">
{`func shadowBug(ids []int) error {
	var err error
	results := make([]string, 0, len(ids))

	for _, id := range ids {
		// \`:=\` here declares a NEW err, scoped to the loop body.
		// The outer err stays nil forever.
		rec, err := load(id)
		if err != nil {
			fmt.Println("  logged but swallowed:", err)
			continue
		}
		results = append(results, rec)
	}
	fmt.Printf("  returning err = %v  (results: %v)\\n", err, results)
	return err
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go1.25.5, called with []int{1, -2, 3} where -2 fails to load">
{`shadowBug([]int{1, -2, 3}):
  logged but swallowed: negative id
  returning err = <nil>  (results: [record-1 record-3])
  outer err from shadowBug: <nil>

shadowFixed([]int{1, -2, 3}):
  outer err from shadowFixed: load -2: negative id`}
        </CodeBlock>
        <p>
          The function returned <code>nil</code> while having failed. Note that the fix is{' '}
          <em>not</em> &quot;avoid <code>:=</code> in loops&quot; — <code>rec, err := load(id)</code>{' '}
          inside the loop is correct and idiomatic. The fix is to stop declaring the outer{' '}
          <code>err</code> at all and <code>return</code> from inside the loop. An accumulator
          variable that only one branch ever writes to is the smell.
        </p>
        <p>
          And a thing worth knowing: <strong><code>go vet</code> does not catch this.</strong>{' '}
          Shadowing is not among its 35 default analyzers (see{' '}
          <a href="/go/setup">the previous lesson</a> for the list) because legitimate shadowing is
          far more common than the bug. This one stays your job.
        </p>
      </InfoBox>

      <h2>Zero Values: There Are No <code>undefined</code> Holes</h2>
      <p>
        This is the headline change coming from JavaScript, and it is a specification-level
        guarantee rather than a convention: <strong>a variable declared without an explicit value
        is set to the zero value of its type.</strong> Not garbage, as in C. Not{' '}
        <code>undefined</code>, as in JS. Not &quot;must be initialised before use&quot;, as the
        JVM enforces for locals. A defined, documented value, decided by the type at compile time.
      </p>
      <p>Every kind of type, declared and never assigned:</p>

      <CodeBlock language="go" title="main.go">
{`package main

import "fmt"

type Config struct {
	Name    string
	Retries int
	Tags    []string
	Limits  map[string]int
	Parent  *Config
}

// show pads the %v form so the columns line up; fmt applies a width to each
// ELEMENT of a slice or array, not to the whole thing.
func show(label string, v any, zero bool) {
	fmt.Printf("%-22s %-14s zero? %v\\n", label, fmt.Sprintf("%v", v), zero)
}

func main() {
	// Every one of these is DECLARED and never assigned.
	var (
		b     bool
		i     int
		f     float64
		s     string
		r     rune
		by    byte
		p     *Config
		sl    []string
		m     map[string]int
		ch    chan int
		fn    func(int) error
		iface interface{ Close() error }
		arr   [3]int
		cfg   Config
	)

	show("bool", b, b == false)
	show("int", i, i == 0)
	show("float64", f, f == 0)
	show("string", fmt.Sprintf("%q", s), s == "")
	show("rune", r, r == 0)
	show("byte", by, by == 0)
	show("*Config", p, p == nil)
	show("[]string", sl, sl == nil)
	show("map[string]int", m, m == nil)
	show("chan int", ch, ch == nil)
	show("func(int) error", fn, fn == nil)
	show("interface", iface, iface == nil)
	show("[3]int", arr, arr == [3]int{})
	fmt.Printf("%-22s %+v\\n", "Config", cfg)

	fmt.Println()
	fmt.Println("len of the nil slice:", len(sl), " len of the nil map:", len(m))
	fmt.Println("there is no third state: s is \\"\\", not undefined, not null")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`bool                   false          zero? true
int                    0              zero? true
float64                0              zero? true
string                 ""             zero? true
rune                   0              zero? true
byte                   0              zero? true
*Config                <nil>          zero? true
[]string               []             zero? true
map[string]int         map[]          zero? true
chan int               <nil>          zero? true
func(int) error        <nil>          zero? true
interface              <nil>          zero? true
[3]int                 [0 0 0]        zero? true
Config                 {Name: Retries:0 Tags:[] Limits:map[] Parent:<nil>}

len of the nil slice: 0  len of the nil map: 0
there is no third state: s is "", not undefined, not null`}
      </CodeBlock>

      <p>
        Note <code>Config</code>: the zero value of a struct is <em>every field at its own zero
        value</em>, recursively, with no special case. And note that <code>[3]int</code> zeroes
        every element — a Go array is a value, not a reference, and there is no such thing as a
        sparse one.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Type</th>
            <th style={headStyle}>Zero value</th>
            <th style={headStyle}>Usable as-is?</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>all numeric types</td>
            <td style={cellStyle}><code>0</code></td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>bool</code></td>
            <td style={cellStyle}><code>false</code></td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>string</code></td>
            <td style={cellStyle}><code>&quot;&quot;</code> (never nil)</td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>array <code>[N]T</code></td>
            <td style={cellStyle}>N zero values of T</td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>struct</code></td>
            <td style={cellStyle}>every field zeroed, recursively</td>
            <td style={cellStyle}>depends on the fields</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>slice <code>[]T</code></td>
            <td style={cellStyle}><code>nil</code></td>
            <td style={cellStyle}>
              <strong>mostly</strong> — <code>len</code>, <code>range</code>, <code>append</code>{' '}
              all work
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>map <code>map[K]V</code></td>
            <td style={cellStyle}><code>nil</code></td>
            <td style={cellStyle}>
              <strong>read only</strong> — writing panics
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>pointer, func, interface, chan</td>
            <td style={cellStyle}><code>nil</code></td>
            <td style={cellStyle}>no — calling or dereferencing panics</td>
          </tr>
        </tbody>
      </table>

      <h3>What this replaces, concretely</h3>
      <p>
        Here is the same set of questions asked of Node, so the comparison is measured rather than
        asserted:
      </p>

      <CodeBlock language="javascript" title="holes.mjs">
{`let s;                       // declared, never assigned
const o = { name: 'ada' };
const a = [1, 2, 3];
a[7] = 9;                    // sparse

console.log('let s;            ->', s, typeof s);
console.log('o.missing         ->', o.missing, typeof o.missing);
console.log('o.a.b (throws)    ->');
try { console.log(o.a.b); } catch (e) { console.log('   ', e.constructor.name + ':', e.message); }
console.log('a                 ->', a, 'length', a.length);
console.log('a[5]              ->', a[5], typeof a[5]);
console.log('5 in a            ->', 5 in a, '   7 in a ->', 7 in a);
console.log('JSON.stringify(a) ->', JSON.stringify(a));
console.log('null vs undefined ->', null == undefined, null === undefined);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Node v25.2.1">
{`let s;            -> undefined undefined
o.missing         -> undefined undefined
o.a.b (throws)    ->
    TypeError: Cannot read properties of undefined (reading 'b')
a                 -> [ 1, 2, 3, <4 empty items>, 9 ] length 8
a[5]              -> undefined undefined
5 in a            -> false    7 in a -> true
JSON.stringify(a) -> [1,2,3,null,null,null,null,9]
null vs undefined -> true false`}
      </CodeBlock>

      <p>
        Four distinct absence states in one script: <code>undefined</code> from a declaration,{' '}
        <code>undefined</code> from a missing property (indistinguishable from a property explicitly
        set to <code>undefined</code>), an array hole that counts toward <code>.length</code> but
        fails <code>in</code> and serialises as <code>null</code>, and <code>null</code> itself,
        which is <code>== undefined</code> but not <code>===</code> it. None of those exist in Go.
        A <code>struct</code> field either exists with a typed value or does not compile.
      </p>

      <FlowChart
        title="What a declared-but-unassigned variable can hold"
        chart={"graph TD\nJS[\"JavaScript: let x;\"] --> J1[\"undefined\"]\nJS --> J2[\"null, once something assigns it\"]\nJS --> J3[\"an actual value\"]\nJS --> J4[\"an array hole: counted by .length,<br/>absent from 'in', nulled by JSON.stringify\"]\nGO[\"Go: var x T\"] --> G1[\"the zero value of T.<br/>There is no second option.\"]\nG1 --> G2[\"0 / 0.0 / false / empty string / nil<br/>chosen by T, at compile time\"]\nstyle J1 fill:#3b1a1a,stroke:#f87171\nstyle J4 fill:#3b1a1a,stroke:#f87171\nstyle G2 fill:#1a3329,stroke:#4ade80"}
      />

      <h3>The design consequence: &quot;the zero value is ready to use&quot;</h3>
      <p>
        That phrase appears all over the standard library — you saw it in{' '}
        <code>go doc strings.Builder</code> in the <a href="/go/setup">last lesson</a> — and it is
        a contract, not a nicety. Well-designed Go types are usable the moment they are declared,
        which means no constructor, no <code>new</code>, no factory, no builder:
      </p>

      <CodeBlock language="go" title="main.go">
{`var buf bytes.Buffer
buf.WriteString("no constructor was called")
fmt.Println("bytes.Buffer:  ", buf.String())

var sb strings.Builder
sb.WriteString("same for strings.Builder")
fmt.Println("strings.Builder:", sb.String())

var mu sync.Mutex
mu.Lock()
mu.Unlock()
fmt.Println("sync.Mutex:     locked and unlocked a zero-value mutex")

var wg sync.WaitGroup
wg.Add(1)
go func() { defer wg.Done() }()
wg.Wait()
fmt.Println("sync.WaitGroup: used a zero-value WaitGroup")`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`bytes.Buffer:   no constructor was called
strings.Builder: same for strings.Builder
sync.Mutex:     locked and unlocked a zero-value mutex
sync.WaitGroup: used a zero-value WaitGroup`}
      </CodeBlock>

      <p>
        Compare the Java equivalent — <code>new StringBuilder()</code>,{' '}
        <code>new ReentrantLock()</code>, <code>new CountDownLatch(1)</code> — and the Node one,
        where you would reach for an array and <code>join</code>. The payoff shows up most in
        structs: a type with a <code>sync.Mutex</code> field is correctly initialised by{' '}
        <code>var c Counter</code>, with no constructor to forget to call.{' '}
        <a href="/go/structs">Structs, Methods &amp; Composition</a> builds on this directly.
      </p>

      <InfoBox variant="warning" title="The one new bug you are taking on: the nil map">
        <p>
          A <code>nil</code> map reads fine and panics on write. This is the only zero value in Go
          that is genuinely a trap, and it is the thing that replaces{' '}
          <code>Cannot read properties of undefined</code> in your error budget.
        </p>
        <CodeBlock language="go" title="main.go">
{`// Reading a missing key gives you the ZERO VALUE, not undefined, not an error.
counts := map[string]int{"a": 1}
fmt.Printf("counts[\\"zzz\\"] = %d   (not undefined, not an error)\\n", counts["zzz"])
v, ok := counts["zzz"]
fmt.Printf("comma-ok:       v=%d ok=%v\\n", v, ok)

// But a NIL map is read-only.
var nilMap map[string]int
fmt.Println("read from nil map:", nilMap["anything"], "len:", len(nilMap))
func() {
	defer func() { fmt.Println("write to nil map PANICKED:", recover()) }()
	nilMap["boom"] = 1
}()

// time.Time's zero value is a real instant, and it is not "no time".
var t time.Time
fmt.Println("time.Time zero: ", t, "IsZero:", t.IsZero())

// A struct with a nil map field: same trap, one level down.
type Counter struct {
	mu sync.Mutex     // zero value: a ready, unlocked mutex
	n  map[string]int // zero value: nil. NOT ready.
}
c := Counter{}
c.mu.Lock() // fine
c.mu.Unlock()
func() {
	defer func() { fmt.Println("c.n[\\"x\\"]++ PANICKED:", recover()) }()
	c.n["x"]++
}()`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`counts["zzz"] = 0   (not undefined, not an error)
comma-ok:       v=0 ok=false
read from nil map: 0 len: 0
write to nil map PANICKED: assignment to entry in nil map
time.Time zero:  0001-01-01 00:00:00 +0000 UTC IsZero: true
c.n["x"]++ PANICKED: assignment to entry in nil map`}
        </CodeBlock>
        <p>
          Three things to take from that. <strong>First</strong>, maps always need{' '}
          <code>make(map[K]V)</code> or a literal before you write to them, and a struct containing
          a map needs a constructor function after all. <strong>Second</strong>, the comma-ok form{' '}
          <code>v, ok := m[k]</code> is how you distinguish &quot;absent&quot; from &quot;present
          and zero&quot; — it is the job <code>undefined</code> was doing for you.{' '}
          <strong>Third</strong>, a zero value being <em>defined</em> does not make it{' '}
          <em>meaningful</em>: <code>time.Time{'{}'}</code> is midnight on 1 January year 1, which is
          why <code>IsZero()</code> exists. Slices and maps get full treatment in{' '}
          <a href="/go/slices">Slices, Maps &amp; the Aliasing Trap</a>.
        </p>
      </InfoBox>

      <h2>Basic Types: <code>int</code>, <code>int64</code>, <code>rune</code>, <code>byte</code></h2>
      <p>
        JavaScript has one number type. Go has fifteen, and four of the names overlap confusingly.
      </p>

      <CodeBlock language="go" title="main.go (abridged — the Printf scaffolding is omitted)">
{`var i int
var i8 int8
var i32 int32
var i64 int64
var u uint
var r rune
var b byte

// unsafe.Sizeof is a compile-time constant; nothing unsafe happens.
fmt.Printf("%-9s %2d bytes  %-10T  range %v .. %v\\n", "int",
	unsafe.Sizeof(i), i, math.MinInt, math.MaxInt)
// ... same for the rest ...

// rune and byte really are ALIASES, not distinct types:
var r2 rune = 'A'
var i32b int32 = r2 // no conversion needed
var b2 byte = 65
var u8 uint8 = b2 // ditto`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`GOARCH: arm64
int        8 bytes  int         range -9223372036854775808 .. 9223372036854775807
int8       1 bytes  int8        range -128 .. 127
int32      4 bytes  int32       range -2147483648 .. 2147483647
int64      8 bytes  int64       range -9223372036854775808 .. 9223372036854775807
uint       8 bytes  uint        range 0 .. 18446744073709551615
float32    4 bytes  float32
float64    8 bytes  float64
rune       4 bytes  int32       <- alias for int32
byte       1 bytes  uint8       <- alias for uint8

rune 'A' as int32: 65   byte 65 as uint8: 65
%T of 'A' (untyped rune constant assigned to a var): int32`}
      </CodeBlock>

      <p>
        Read the <code>%T</code> column. <code>rune</code> prints as <code>int32</code> and{' '}
        <code>byte</code> prints as <code>uint8</code> because they are <strong>aliases</strong>,
        not named types — assigning between them needs no conversion, and no method set
        distinguishes them. They exist purely to document intent:
      </p>
      <ul>
        <li><code>byte</code> means &quot;this is a piece of binary data&quot;</li>
        <li><code>rune</code> means &quot;this is a Unicode code point&quot;</li>
      </ul>

      <h3><code>int</code> is not <code>int64</code>, and its width is not yours to assume</h3>
      <p>
        <code>int</code> and <code>int64</code> are <em>different types</em> that happen to be the
        same size on every platform you will realistically deploy to. Mixing them is a compile
        error (see the next section), and the size really is platform-dependent. Rather than quote
        that, here is the same binary built for three architectures and executed:
      </p>

      <CodeBlock language="bash" title="Terminal">
{`CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o dist/sz-amd64 .
CGO_ENABLED=0 GOOS=linux GOARCH=386   go build -o dist/sz-386 .

go run .
docker run --rm --platform linux/amd64 -v "$PWD/dist:/d:ro" alpine:3 /d/sz-amd64
docker run --rm --platform linux/386   -v "$PWD/dist:/d:ro" alpine:3 /d/sz-386`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go1.25.5, docker 29.1.2 (the 386 build really ran)">
{`darwin/arm64: sizeof(int)=8 sizeof(uint)=8 sizeof(*int)=8 MaxInt=9223372036854775807
linux/amd64:  sizeof(int)=8 sizeof(uint)=8 sizeof(*int)=8 MaxInt=9223372036854775807
linux/386:    sizeof(int)=4 sizeof(uint)=4 sizeof(*int)=4 MaxInt=2147483647`}
      </CodeBlock>

      <p>Practical rules, in priority order:</p>
      <ul>
        <li>
          <strong>Use <code>int</code> by default.</strong> For loop counters, lengths, indices,
          counts. <code>len()</code> returns <code>int</code>, so anything that interacts with a
          slice wants <code>int</code>.
        </li>
        <li>
          <strong>Use <code>int64</code> when the width is part of the contract.</strong> Money in
          minor units, Unix timestamps, byte counts of things that could exceed 2 GB, anything
          crossing a wire or a database column. <code>database/sql</code> and{' '}
          <code>encoding/json</code> both deal in explicit widths.
        </li>
        <li>
          <strong>Avoid <code>uint</code> for &quot;it cannot be negative&quot;.</strong> It is not
          a validation; it is a wraparound hazard. Use <code>int</code> and check.
        </li>
        <li>
          <strong>Use <code>float64</code>, not <code>float32</code></strong>, unless you have a
          memory-layout reason. The <code>math</code> package is all <code>float64</code>.
        </li>
      </ul>

      <InfoBox variant="warning" title="Overflow wraps silently. It is defined, and it is still a bug.">
        <CodeBlock language="go" title="main.go">
{`var small int8 = 127
small++
fmt.Println("int8 127 + 1 =", small)

big := int64(math.MaxInt64)
fmt.Println("MaxInt64 + 1 =", big+1)
fmt.Println("MaxInt64      =", int64(math.MaxInt64))

// Unsigned subtraction below zero wraps too - the classic len()-1 bug.
var n uint = 0
fmt.Println("uint 0 - 1    =", n-1)`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`int8 127 + 1 = -128
MaxInt64 + 1 = -9223372036854775808
MaxInt64      = 9223372036854775807
uint 0 - 1    = 18446744073709551615`}
        </CodeBlock>
        <p>
          No panic, no exception, no promotion to a wider type, no <code>Infinity</code>. Go&apos;s
          signed overflow is <em>specified</em> as two&apos;s-complement wraparound — which is
          better than C++, where signed overflow is undefined behaviour and the optimiser may assume
          it cannot happen — but it will still corrupt your data. That{' '}
          <code>uint 0 - 1 = 18446744073709551615</code> is what{' '}
          <code>for i := uint(0); i &lt;= uint(len(s))-1; i++</code> does to you on an empty slice.
        </p>
        <p>
          Two upsides worth noting: <code>int64</code> holds <code>9223372036854775807</code>{' '}
          exactly, which JavaScript&apos;s <code>Number</code> cannot (it silently rounds to{' '}
          <code>9007199254740992</code> past 2<sup>53</sup>), and <strong>constant</strong> overflow
          is caught at compile time, so only runtime arithmetic can bite you:
        </p>
        <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./ovf.go:6:14: cannot use huge2 (untyped int constant 1267650600228229401496703205376) as int value in variable declaration (overflows)
./ovf.go:7:15: cannot use 128 (untyped int constant) as int8 value in variable declaration (overflows)
./ovf.go:8:15: cannot use -1 (untyped int constant) as uint value in variable declaration (overflows)`}
        </CodeBlock>
      </InfoBox>

      <h2>Strings Are Immutable UTF-8 Bytes</h2>
      <p>
        A Go <code>string</code> is an immutable, read-only sequence of bytes that is{' '}
        <em>conventionally</em> UTF-8. Not a sequence of characters. Not UTF-16 code units, which is
        what JavaScript gives you. Not a <code>char[]</code>. Bytes. Everything surprising follows
        from that.
      </p>

      <CodeBlock language="go" title="main.go">
{`package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	s := "Jalapeño"

	fmt.Printf("s            = %q\\n", s)
	fmt.Printf("len(s)       = %d   <- BYTES, not characters\\n", len(s))
	fmt.Printf("RuneCount    = %d   <- characters\\n", utf8.RuneCountInString(s))
	fmt.Println()

	// Indexing a string does NOT give you a character.
	fmt.Printf("s[0]         = %v      (type %T)\\n", s[0], s[0])
	fmt.Printf("s[6]         = %v     (type %T)  <- the 'ñ' starts here\\n", s[6], s[6])
	fmt.Printf("s[7]         = %v     (type %T)  <- ...and continues here\\n", s[7], s[7])
	fmt.Println()

	// Converting that single byte to a string produces garbage.
	fmt.Printf("string(s[6]) = %q\\n", string(s[6]))
	fmt.Printf("s[6:8]       = %q      <- both bytes together ARE the character\\n", s[6:8])
	fmt.Printf("s[6:7]       = %q    <- half a character\\n", s[6:7])
	fmt.Println()

	fmt.Printf("[]byte(s)    = %v\\n", []byte(s))
	fmt.Printf("[]rune(s)    = %v\\n", []rune(s))
	fmt.Printf("hex          = % x\\n", s)
	fmt.Println()

	// range over a string decodes UTF-8 and gives you (byteOffset, rune).
	fmt.Println("for i, r := range s:")
	for i, r := range s {
		fmt.Printf("  i=%d  r=%q  rune=%d  width=%d bytes\\n", i, r, r, utf8.RuneLen(r))
	}
	fmt.Println()

	// Indexing by position requires an explicit []rune conversion (which COPIES).
	rs := []rune(s)
	fmt.Printf("len([]rune(s)) = %d, rs[6] = %q\\n", len(rs), rs[6])
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`s            = "Jalapeño"
len(s)       = 9   <- BYTES, not characters
RuneCount    = 8   <- characters

s[0]         = 74      (type uint8)
s[6]         = 195     (type uint8)  <- the 'ñ' starts here
s[7]         = 177     (type uint8)  <- ...and continues here

string(s[6]) = "Ã"
s[6:8]       = "ñ"      <- both bytes together ARE the character
s[6:7]       = "\\xc3"    <- half a character

[]byte(s)    = [74 97 108 97 112 101 195 177 111]
[]rune(s)    = [74 97 108 97 112 101 241 111]
hex          = 4a 61 6c 61 70 65 c3 b1 6f

for i, r := range s:
  i=0  r='J'  rune=74  width=1 bytes
  i=1  r='a'  rune=97  width=1 bytes
  i=2  r='l'  rune=108  width=1 bytes
  i=3  r='a'  rune=97  width=1 bytes
  i=4  r='p'  rune=112  width=1 bytes
  i=5  r='e'  rune=101  width=1 bytes
  i=6  r='ñ'  rune=241  width=2 bytes
  i=8  r='o'  rune=111  width=1 bytes

len([]rune(s)) = 8, rs[6] = 'ñ'`}
      </CodeBlock>

      <p>Four things in there are worth saying out loud.</p>
      <ul>
        <li>
          <strong><code>len(&quot;Jalapeño&quot;)</code> is 9, not 8.</strong> <code>len</code> on a
          string is a byte count and it is O(1) because it is a field in the string header. The
          character count is <code>utf8.RuneCountInString</code>, which is O(n).
        </li>
        <li>
          <strong><code>s[6]</code> is the number 195 of type <code>uint8</code>.</strong> Indexing
          yields a <em>byte</em>. In JavaScript <code>&quot;Jalapeño&quot;[6]</code> gives you the
          one-character string <code>&quot;ñ&quot;</code>; in Go there is no single-character string
          type and no implicit conversion, so you get the raw byte.
        </li>
        <li>
          <strong><code>string(s[6])</code> is <code>&quot;Ã&quot;</code></strong> — and this one I
          got wrong before running it. I had written a comment predicting the Unicode replacement
          character <code>U+FFFD</code>. It is not: <code>string(aByte)</code> is a{' '}
          <em>numeric</em> conversion, so byte 195 becomes code point U+00C3, which is{' '}
          <code>Ã</code>, re-encoded as the two bytes <code>C3 83</code>. You asked for a code
          point and you got one. Mojibake with a completely logical derivation — which is exactly
          why the toolchain flags this pattern (more below).
        </li>
        <li>
          <strong>The <code>range</code> index jumps from 6 to 8.</strong> <code>for i, r := range
          s</code> decodes UTF-8 as it walks: <code>i</code> is a <em>byte offset</em> and{' '}
          <code>r</code> is a <code>rune</code>. Eight iterations over nine bytes. If you wrote{' '}
          <code>for i := 0; i &lt; len(s); i++</code> you would get nine iterations and two broken
          halves of <code>ñ</code>.
        </li>
      </ul>

      <FlowChart
        title="One string, three ways to look at it"
        chart={"graph TD\nS[\"s := Jalapeño<br/>one Go string value\"] --> B[\"an immutable, read-only<br/>sequence of 9 BYTES (UTF-8)\"]\nB --> L[\"len(s) is 9<br/>— the byte count, never the character count\"]\nB --> I1[\"s[6] is 195, of type uint8.<br/>Not a character. Not a string.\"]\nB --> I2[\"s[6:8] is the two bytes that<br/>together encode ñ — a valid string\"]\nB --> I3[\"s[6:7] is half a character:<br/>the invalid fragment 0xc3\"]\nB --> R[\"for i, r := range s<br/>decodes UTF-8 as it goes\"]\nR --> R1[\"8 iterations; i jumps 6 then 8<br/>r is a rune, i.e. an int32 code point\"]\nB --> C[\"[]rune(s)\"]\nC --> C1[\"ALLOCATES a new 8-element slice.<br/>Now indexable per character — at O(n) cost.\"]\nstyle I1 fill:#3b1a1a,stroke:#f87171\nstyle I3 fill:#3b1a1a,stroke:#f87171\nstyle R1 fill:#1a3329,stroke:#4ade80\nstyle C1 fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>How bad does it get? Measured.</h3>

      <CodeBlock language="go" title="main.go">
{`func report(label, s string) {
	fmt.Printf("%-22s %-14q len=%-3d runes=%-3d bytes=%v\\n",
		label, s, len(s), utf8.RuneCountInString(s), []byte(s))
}

func main() {
	report("ASCII", "cafe")
	report("2-byte (precomposed)", "café") // é as U+00E9
	report("combining accent", "cafe\\u0301") // e + U+0301
	report("3-byte CJK", "日本")
	report("4-byte emoji", "🌮")
	report("ZWJ family emoji", "👨\\u200d👩\\u200d👧")

	a := "café"       // U+00E9
	b := "cafe\\u0301" // e + combining acute
	fmt.Printf("both render as %q and %q\\n", a, b)
	fmt.Println("a == b ?", a == b, "  <- == is a BYTE comparison")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`ASCII                  "cafe"         len=4   runes=4   bytes=[99 97 102 101]
2-byte (precomposed)   "café"         len=5   runes=4   bytes=[99 97 102 195 169]
combining accent       "café"        len=6   runes=5   bytes=[99 97 102 101 204 129]
3-byte CJK             "日本"           len=6   runes=2   bytes=[230 151 165 230 156 172]
4-byte emoji           "🌮"            len=4   runes=1   bytes=[240 159 140 174]
ZWJ family emoji       "👨\\u200d👩\\u200d👧" len=18  runes=5   bytes=[240 159 145 168 226 128 141 240 159 145 169 226 128 141 240 159 145 167]

both render as "café" and "café"
a == b ? false   <- == is a BYTE comparison`}
      </CodeBlock>

      <p>
        The family emoji is <strong>18 bytes, 5 runes, and one thing a user would call a
        character</strong>. And the last two lines are the important ones: two strings that render
        identically are not equal, because <code>==</code> on Go strings is a byte comparison.
        That is not a Go flaw — JavaScript&apos;s <code>===</code> does the same thing on UTF-16
        code units, and the fix is the same in both: normalise first (<code>golang.org/x/text/unicode/norm</code>{' '}
        is the Go answer; it is one of the few genuinely necessary non-standard-library
        dependencies). <strong>Neither <code>len</code> nor <code>RuneCountInString</code> answers
        &quot;how many characters does a human see&quot;</strong>; that needs grapheme cluster
        segmentation, which the standard library does not provide.
      </p>

      <InfoBox variant="tip" title="What to actually do">
        <ul>
          <li>
            <strong>Iterating text?</strong> <code>for i, r := range s</code>. Correct by default.
          </li>
          <li>
            <strong>Building a string in a loop?</strong> <code>strings.Builder</code>, never{' '}
            <code>s += x</code> — strings are immutable, so <code>+=</code> allocates and copies the
            whole thing every time, making the loop O(n&sup2;).
          </li>
          <li>
            <strong>Need random access by character?</strong> <code>[]rune(s)</code> once, outside
            the loop. It allocates and copies, so do not do it per iteration.
          </li>
          <li>
            <strong>Working with binary, or mutating?</strong> <code>[]byte</code>. The{' '}
            <code>bytes</code> package mirrors <code>strings</code> function for function.
          </li>
          <li>
            <strong>Searching, splitting, trimming, casing?</strong> The <code>strings</code>{' '}
            package already has it, and all of it is UTF-8-aware.
          </li>
        </ul>
      </InfoBox>

      <p>
        And &quot;immutable&quot; is enforced by the compiler, not by convention — there is no{' '}
        <code>const</code> qualifier involved, the type simply has no addressable elements:
      </p>

      <CodeBlock language="go" title="imm.go">
{`func mutate() {
	s := "hello"
	s[0] = 'H'
	_ = s
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./imm.go:5:2: cannot assign to s[0] (neither addressable nor a map index expression)`}
      </CodeBlock>

      <h2>Conversions Are Explicit. All of Them.</h2>
      <p>
        There is no implicit numeric conversion in Go. None. Not even between two types of the same
        size, not even widening, not even from a smaller type to a strictly larger one. This is
        stricter than C, C++, Java, C#, and obviously JavaScript.
      </p>

      <CodeBlock language="go" title="bad.go — six things every other language you know would allow">
{`func bad() {
	var count int = 3
	var ratio float64 = 1.5
	var big int64 = 9

	fmt.Println(count * ratio) // int * float64
	fmt.Println(count + big)   // int + int64 - SAME SIZE, still rejected
	var pct float64 = count    // int into float64 (widening!)
	var n int = ratio          // float64 into int
	if count {                 // truthiness
	}
	fmt.Println("x" + 1) // string + number
	_, _ = pct, n
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./bad.go:10:14: invalid operation: count * ratio (mismatched types int and float64)
./bad.go:11:14: invalid operation: count + big (mismatched types int and int64)
./bad.go:12:20: cannot use count (variable of type int) as float64 value in variable declaration
./bad.go:13:14: cannot use ratio (variable of type float64) as int value in variable declaration
./bad.go:14:5: non-boolean condition in if statement
./bad.go:16:14: invalid operation: "x" + 1 (mismatched types untyped string and untyped int)`}
      </CodeBlock>

      <p>
        Line 11 is the one that surprises people: <code>int</code> and <code>int64</code> are both
        64 bits on this machine and it is still rejected, because they are different <em>types</em>.
        Line 12 shows that even a provably lossless widening needs to be written out. And line 14
        means there is no truthiness: <code>if count</code> is not &quot;if count is nonzero&quot;,
        it is a type error.
      </p>
      <p>
        For contrast, the same set of operations in the language you came from — all legal, all
        producing a value:
      </p>

      <CodeBlock language="text" title="Real output — Node v25.2.1">
{`1 == '1'             -> true
0 == ''              -> true
0 == '0'             -> true
'' == '0'            -> false
null == 0            -> false
[] == false          -> true
[1] == 1             -> true
'3' * 2              -> 6
'3' + 2              -> "32"
[] + {}              -> "[object Object]"
1 + true             -> 2
0.1 + 0.2 == 0.3     -> false
9007199254740993     -> 9007199254740992`}
      </CodeBlock>

      <p>
        <code>0 == &apos;&apos;</code> and <code>0 == &apos;0&apos;</code> are both true while{' '}
        <code>&apos;&apos; == &apos;0&apos;</code> is false, so <code>==</code> is not even
        transitive. Go does not have a <code>===</code> because it does not need one.
      </p>

      <h3>Untyped constants are what make this bearable</h3>
      <p>
        If every literal had a type, explicit conversion would be unbearable —{' '}
        <code>x * float64(2)</code> everywhere. Go&apos;s answer is that constants are{' '}
        <strong>untyped</strong> and arbitrary-precision until the moment they are used, at which
        point they take on whatever type the context needs:
      </p>

      <CodeBlock language="go" title="main.go">
{`// Untyped constants: these have no type until they are used.
const (
	maxRetries = 3    // untyped integer constant
	backoff    = 0.25 // untyped float constant
)

func main() {
	count := 3
	ratio := 1.5

	// Conversions between VARIABLES are explicit, always.
	fmt.Println("float64(count) * ratio =", float64(count)*ratio)
	fmt.Println("count * int(ratio)     =", count*int(ratio), "  <- int(1.5) TRUNCATES toward zero")
	neg := -1.9
	fmt.Println("int(neg) where neg=-1.9 =", int(neg), " <- truncates toward zero, not floor")

	// Untyped constants need no conversion at all.
	var asInt int = maxRetries
	var asFloat float64 = maxRetries // same constant, different type
	var asI64 int64 = maxRetries
	fmt.Printf("maxRetries as int=%d float64=%.1f int64=%d  (one constant, three types)\\n",
		asInt, asFloat, asI64)
	fmt.Println("ratio * backoff        =", ratio*backoff, " <- no conversion needed; backoff is untyped")

	// The string conversion trap.
	n := 65
	fmt.Printf("string(rune(n)) = %q   <- a NUMERIC conversion: code point 65\\n", string(rune(n)))
	fmt.Printf("strconv.Itoa(n) = %q  <- what you actually wanted\\n", strconv.Itoa(n))
	fmt.Printf("fmt.Sprint(n)   = %q  <- also fine\\n", fmt.Sprint(n))

	// Parsing goes the other way, and it returns an error you must handle.
	v, err := strconv.Atoi("not a number")
	fmt.Printf("strconv.Atoi(\\"not a number\\") -> v=%d err=%v\\n", v, err)
	v2, err2 := strconv.ParseInt("ff", 16, 64)
	fmt.Printf("strconv.ParseInt(\\"ff\\", 16, 64) -> v=%d err=%v\\n", v2, err2)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`float64(count) * ratio = 4.5
count * int(ratio)     = 3   <- int(1.5) TRUNCATES toward zero
int(neg) where neg=-1.9 = -1  <- truncates toward zero, not floor

maxRetries as int=3 float64=3.0 int64=3  (one constant, three types)
ratio * backoff        = 0.375  <- no conversion needed; backoff is untyped

string(rune(n)) = "A"   <- a NUMERIC conversion: code point 65
strconv.Itoa(n) = "65"  <- what you actually wanted
fmt.Sprint(n)   = "65"  <- also fine

strconv.Atoi("not a number") -> v=0 err=strconv.Atoi: parsing "not a number": invalid syntax
strconv.ParseInt("ff", 16, 64) -> v=255 err=<nil>`}
      </CodeBlock>

      <InfoBox variant="success" title="Something I expected to be false and it was true">
        <p>
          I wrote the following expecting a dull confirmation that Go has the same IEEE 754 problems
          everyone does. It does, but not where I thought:
        </p>
        <CodeBlock language="go" title="main.go">
{`fmt.Println("0.1+0.2 ==", 0.1+0.2, "   equals 0.3?", 0.1+0.2 == 0.3)
var f1, f2 = 0.1, 0.2
fmt.Println("via vars:  ", f1+f2, "  equals 0.3?", f1+f2 == 0.3)`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`0.1+0.2 == 0.3    equals 0.3? true
via vars:   0.30000000000000004   equals 0.3? false`}
        </CodeBlock>
        <p>
          The constant expression is <strong>true</strong>. Untyped float constants are evaluated by
          the compiler at arbitrary precision, so <code>0.1+0.2</code> is exactly{' '}
          <code>0.3</code> before anything is rounded to a <code>float64</code>. Move the same
          numbers into variables and you get the familiar{' '}
          <code>0.30000000000000004</code>. Same program. In JavaScript it is{' '}
          <code>false</code> either way, because every literal is already a double.
        </p>
        <p>
          That same arbitrary precision is why <code>const huge = 1 &lt;&lt; 100</code> is legal:
          the compiler computes <code>1267650600228229401496703205376</code> exactly, and only
          complains if you try to <em>store</em> it. It is also why{' '}
          <code>int(-1.9)</code> — note, a <em>constant</em> — is a compile error rather than{' '}
          <code>-1</code>: constant conversions must be exact, and only variable conversions
          truncate.
        </p>
        <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./constconv.go:4:11: cannot convert -1.9 (untyped float constant) to type int`}
        </CodeBlock>
      </InfoBox>

      <InfoBox variant="warning" title="string(someInt) compiles and is almost never what you meant">
        <p>
          <code>string(65)</code> is <code>&quot;A&quot;</code>, not <code>&quot;65&quot;</code> —
          a numeric conversion to a code point. It is the one conversion in Go that looks like a
          formatting operation and is not. The compiler permits it; the toolchain catches it:
        </p>
        <CodeBlock language="text" title="Real output — go1.25.5">
{`$ go build -o /dev/null ./...
(build exit 0)

$ go vet ./...
# example.com/conv
# [example.com/conv]
./si.go:7:14: conversion from int to string yields a string of one rune, not a string of digits
(vet exit 1)`}
        </CodeBlock>
        <p>
          Use <code>strconv.Itoa</code> for integers, <code>strconv.FormatFloat</code> for floats,{' '}
          <code>fmt.Sprintf</code> when you need a layout, and{' '}
          <code>string(rune(n))</code> only when you genuinely mean a code point — the explicit{' '}
          <code>rune()</code> is how you tell both the reader and vet that you meant it.
        </p>
      </InfoBox>

      <h2><code>const</code> and <code>iota</code></h2>
      <p>
        <code>const</code> is compile-time only: numbers, strings, booleans, and runes. No{' '}
        <code>const</code> slices, maps, or structs, and no <code>const</code> function results —{' '}
        it is nothing like JavaScript&apos;s <code>const</code>, which is a binding immutability
        rule, nor Java&apos;s <code>static final</code>, which can hold an object reference.
      </p>
      <p>
        <code>iota</code> is the one piece of magic: inside a <code>const</code> block it is the
        index of the current line, starting at 0. Combined with an implicitly repeated expression,
        it is how Go does enums.
      </p>

      <CodeBlock language="go" title="main.go">
{`// 1. The plain counter. iota starts at 0 in every const block and
//    increments once per line.
type State int

const (
	StatePending State = iota // 0
	StateRunning              // 1
	StateDone                 // 2
	StateFailed               // 3
)

func (s State) String() string {
	switch s {
	case StatePending:
		return "pending"
	case StateRunning:
		return "running"
	case StateDone:
		return "done"
	case StateFailed:
		return "failed"
	}
	return fmt.Sprintf("State(%d)", int(s))
}

// 2. Skipping values, so that the zero value means "unset".
type Priority int

const (
	_            Priority = iota // discard 0
	PriorityLow                  // 1
	PriorityMed                  // 2
	PriorityHigh                 // 3
)

// 3. Bit flags: the expression on the first line repeats implicitly.
type Perm uint8

const (
	PermRead Perm = 1 << iota // 1 << 0 = 1
	PermWrite                 // 1 << 1 = 2
	PermExec                  // 1 << 2 = 4
	PermAdmin                 // 1 << 3 = 8
)

// 4. The classic size constants.
const (
	_  = iota             // skip 1<<(10*0)
	KB = 1 << (10 * iota) // 1 << 10
	MB                    // 1 << 20
	GB                    // 1 << 30
	TB                    // 1 << 40
)

// 5. Typed constants that are not numbers.
const (
	DefaultTimeout = 5 * time.Second
	HeaderName     = "X-Request-Id"
)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`State:    pending running done failed
as ints:  0 1 2 3
zero State is pending  <- deliberate: the zero value is meaningful

Priority: 1 2 3  zero = 0

PermRead|PermWrite = 0011  has write? true  has exec? false
flags: read=1 write=2 exec=4 admin=8

KB=1024 MB=1048576 GB=1073741824 TB=1099511627776
DefaultTimeout: 5s  HeaderName: X-Request-Id

1<<100 / 1<<90 = 1024
float64(huge) = 1.2676506002282294e+30
MaxFloat64: 1.7976931348623157e+308`}
      </CodeBlock>

      <p>
        Two design choices in there deserve attention, because they are the whole enum story in Go.
      </p>
      <ul>
        <li>
          <strong>Pattern 1 makes the zero value meaningful on purpose.</strong>{' '}
          <code>var s State</code> is <code>StatePending</code>, which is the right default. This is
          the zero-value contract applied to your own types.
        </li>
        <li>
          <strong>Pattern 2 does the opposite on purpose.</strong> Discarding 0 means{' '}
          <code>Priority(0)</code> is not a valid priority, so a struct field someone forgot to
          populate is detectably wrong rather than silently &quot;low&quot;. Pick based on whether a
          sensible default exists.
        </li>
      </ul>

      <InfoBox variant="warning" title="This is not a real enum, and the compiler will not save you">
        <p>
          <code>State</code> is an <code>int</code> with a nicer name. <code>State(47)</code>{' '}
          compiles and is a perfectly legal value — which is why the <code>String()</code> method
          above ends with a fallback instead of a panic. There is no exhaustiveness checking on a{' '}
          <code>switch</code> over a <code>State</code>, so adding <code>StateCancelled</code> will
          not make any existing switch fail to compile. TypeScript&apos;s discriminated unions and
          Java&apos;s <code>enum</code> both give you more here, and this is a real loss.
        </p>
        <p>
          Mitigations, in order of how much they are worth: always write a <code>default</code> case;
          generate the <code>String()</code> method with <code>stringer</code> (the{' '}
          <code>tool</code> directive in <a href="/go/setup">the previous lesson</a> pins it) so it
          cannot drift; and if exhaustiveness genuinely matters, <code>golangci-lint</code>&apos;s{' '}
          <code>exhaustive</code> linter exists. Also note the <code>%d</code> row above: a{' '}
          <code>String()</code> method is only consulted by <code>%v</code>, <code>%s</code> and{' '}
          <code>Println</code>, so <code>%d</code> still prints the bare integer.
        </p>
      </InfoBox>

      <h2>Control Flow</h2>
      <p>
        Three facts and you have the whole of it: parentheses around conditions are not used, braces
        are not optional, and the opening brace must be on the same line. That last one is not a
        style preference — Go&apos;s grammar inserts semicolons at line ends, so your Java habit is
        a syntax error:
      </p>

      <CodeBlock language="go" title="brace.go">
{`func braces(x int)
{
	if x > 0
	{
		fmt.Println("positive")
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`./brace.go:6:1: syntax error: unexpected semicolon or newline before {`}
      </CodeBlock>

      <p>
        There is also no ternary operator, and no plan to add one. <code>?</code> is not even a
        legal character:
      </p>

      <CodeBlock language="text" title="Real output — go build on `return ok ? 1 : 0`, go1.25.5">
{`./tern.go:4:12: invalid character U+003F '?'
./tern.go:4:14: syntax error: unexpected literal 1 at end of statement`}
      </CodeBlock>

      <h3><code>if</code> with an initialiser</h3>
      <p>
        <code>if</code> can declare variables scoped to the <code>if</code>/<code>else</code> chain
        and nothing beyond it. This is used constantly, and it is the structural reason Go code
        is not a pyramid of nesting:
      </p>

      <CodeBlock language="go" title="main.go">
{`if n, err := strconv.Atoi("42"); err != nil {
	fmt.Println("bad input:", err)
} else {
	fmt.Println("if-init: parsed", n, "- n and err are scoped to this if/else only")
}

// The idiomatic shape: handle the error and leave, keep the happy path unindented.
n, err := strconv.Atoi("not a number")
if err != nil {
	fmt.Println("idiomatic:", err)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`if-init: parsed 42 - n and err are scoped to this if/else only
idiomatic: strconv.Atoi: parsing "not a number": invalid syntax`}
      </CodeBlock>

      <p>
        Use the init form when the value is only needed for the check. Use the plain form when you
        need the value afterwards — which, for the <code>(value, error)</code> pattern, is most of
        the time. <a href="/go/errors">Errors Are Values, Not Exceptions</a> goes into why this
        shape dominates.
      </p>

      <h3>One loop keyword</h3>
      <p>
        No <code>while</code>, no <code>do</code>, no <code>foreach</code>, no{' '}
        <code>for...in</code> / <code>for...of</code> distinction, no <code>.forEach()</code> as the
        idiomatic choice. Just <code>for</code>, in four shapes:
      </p>

      <CodeBlock language="go" title="main.go">
{`fmt.Print("three-clause:  ")
for i := 0; i < 3; i++ {
	fmt.Print(i, " ")
}

fmt.Print("while-style:   ")
j := 0
for j < 3 { // no 'while' keyword; this IS while
	fmt.Print(j, " ")
	j++
}

fmt.Print("infinite+break:")
k := 0
for { // no 'do-while' either; this is the loop you break out of
	if k >= 3 {
		break
	}
	fmt.Print(" ", k)
	k++
}

fmt.Print("range slice:   ")
for i, v := range []string{"a", "b", "c"} {
	fmt.Printf("%d=%s ", i, v)
}

fmt.Print("range int:     ")
for i := range 3 { // Go 1.22+
	fmt.Print(i, " ")
}

fmt.Print("range, no var: ")
for range 3 { // Go 1.22+: just repeat
	fmt.Print("* ")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`three-clause:  0 1 2
while-style:   0 1 2
infinite+break: 0 1 2
range slice:   0=a 1=b 2=c
range int:     0 1 2
range, no var: * * *`}
      </CodeBlock>

      <FlowChart
        title="for — the only loop keyword, and its four shapes"
        chart={"graph TD\nF[\"for — the only loop keyword in Go\"] --> A[\"for i := 0; i < n; i++\"]\nF --> B[\"for cond\"]\nF --> C[\"for\"]\nF --> D[\"for i, v := range x\"]\nA --> A1[\"the three-clause C loop\"]\nB --> B1[\"this is while\"]\nC --> C1[\"this is while(true) / do-while;<br/>you break out of it\"]\nD --> D1[\"slice, array, string, map, channel,<br/>int (1.22+), func iterator (1.23+)\"]\nstyle F fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>
        <code>for i := range 3</code> is Go 1.22 or newer — it is what the{' '}
        <a href="/go/intro">intro lesson</a> used for{' '}
        <code>for range 2_000_000</code>. If you see older code writing{' '}
        <code>for i := 0; i &lt; n; i++</code> purely to count, that is why.
      </p>

      <InfoBox variant="danger" title="Go 1.22 changed loop variable scoping, and your go.mod decides which one you get">
        <p>
          Before Go 1.22, a <code>for</code> loop had <strong>one</strong> variable reused across
          every iteration. Closures captured that one variable, so they all saw the final value —
          the single most-reported Go gotcha in the language&apos;s history. Go 1.22 made it
          per-iteration.
        </p>
        <p>
          The part worth internalising is <em>how</em> they shipped a breaking semantic change: the{' '}
          <code>go</code> directive in <code>go.mod</code> selects the behaviour. Same source, same
          compiler binary, two different answers:
        </p>
        <CodeBlock language="go" title="main.go">
{`var fns []func()
for i := 0; i < 3; i++ {
	fns = append(fns, func() { fmt.Print(i, " ") })
}
fmt.Printf("language version in go.mod decides this. runtime: %s\\n", runtime.Version())
fmt.Print("captured values: ")
for _, f := range fns {
	f()
}

// Same question, asked of addresses.
var addrs []*int
for i := 0; i < 3; i++ {
	addrs = append(addrs, &i)
}
fmt.Printf("&i the same pointer each iteration? %v\\n",
	addrs[0] == addrs[1] && addrs[1] == addrs[2])`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go1.25.5 toolchain, only the go.mod directive changed between runs">
{`=== go.mod says: go 1.21 ===
language version in go.mod decides this. runtime: go1.25.5
captured values: 3 3 3
&i the same pointer each iteration? true
values behind the pointers: 3 3 3

=== go.mod says: go 1.22 ===
language version in go.mod decides this. runtime: go1.25.5
captured values: 0 1 2
&i the same pointer each iteration? false
values behind the pointers: 0 1 2`}
        </CodeBlock>
        <p>
          <code>3 3 3</code> versus <code>0 1 2</code>, and <code>&amp;i</code> is literally a
          different address per iteration under 1.22+. Two things follow. <strong>One:</strong> if
          you inherit a repo whose <code>go.mod</code> says <code>go 1.19</code>, bumping that one
          line changes runtime behaviour, so read the loops before you bump it.{' '}
          <strong>Two:</strong> if you are reading a blog post or Stack Overflow answer that tells
          you to write <code>i := i</code> at the top of a loop body, it predates 1.22. That
          workaround is now a no-op — harmless, but a dated-code smell.
        </p>
      </InfoBox>

      <h3><code>switch</code> does not fall through</h3>
      <p>
        You will never write <code>break</code> at the end of a case again. Go inverted the C
        default: cases break implicitly, and <code>fallthrough</code> is an explicit keyword you
        will use perhaps twice a year.
      </p>

      <CodeBlock language="go" title="main.go">
{`// No condition at all: the cleanest if/else-if chain in the language.
code := 404
switch {
case code >= 500:
	fmt.Println("switch (no condition): server error")
case code >= 400:
	fmt.Println("switch (no condition): client error  <- matched, and STOPPED")
case code >= 200:
	fmt.Println("switch (no condition): ok")
}

// Init statement plus multi-value cases.
switch method := "PATCH"; method {
case "GET", "HEAD": // comma-separated, NOT a fallthrough chain
	fmt.Println("switch (init + multi-value): read")
case "POST", "PUT", "PATCH":
	fmt.Println("switch (init + multi-value): write")
default:
	fmt.Println("switch: unknown")
}

// fallthrough exists, is explicit, and is rare.
switch 2 {
case 2:
	fmt.Println("fallthrough demo: case 2")
	fallthrough
case 3:
	fmt.Println("fallthrough demo: case 3 (reached via fallthrough)")
case 4:
	fmt.Println("fallthrough demo: case 4 (NOT reached)")
}

// Type switch: switch on the dynamic type inside an interface.
var vals = []any{42, "hi", 3.14, []int{1}, nil, os.ErrNotExist}
for _, v := range vals {
	switch t := v.(type) {
	case int:
		fmt.Printf("type switch: int %d\\n", t)
	case string:
		fmt.Printf("type switch: string %q\\n", t)
	case error:
		fmt.Printf("type switch: error %v (is ErrNotExist: %v)\\n", t, errors.Is(t, os.ErrNotExist))
	case nil:
		fmt.Println("type switch: nil interface")
	default:
		fmt.Printf("type switch: something else (%T)\\n", t)
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`switch (no condition): client error  <- matched, and STOPPED
switch (init + multi-value): write
fallthrough demo: case 2
fallthrough demo: case 3 (reached via fallthrough)
type switch: int 42
type switch: string "hi"
type switch: something else (float64)
type switch: something else ([]int)
type switch: nil interface
type switch: error file does not exist (is ErrNotExist: true)`}
      </CodeBlock>

      <p>
        Note that <code>3.14</code> hit <code>default</code>, not <code>case int</code> — a type
        switch matches the <em>exact</em> dynamic type, with no numeric widening, consistent with
        everything else in this lesson. Note also that <code>os.ErrNotExist</code> matched{' '}
        <code>case error</code>, which is an <em>interface</em> case: type switches can match
        interface satisfaction, not just concrete types.{' '}
        <a href="/go/interfaces">Interfaces Without implements</a> covers that properly.
      </p>

      <h3>Labels, and the <code>goto</code> you will not use</h3>
      <p>
        <code>break</code> and <code>continue</code> take an optional label, which is how you exit
        a nested loop without a boolean flag:
      </p>

      <CodeBlock language="go" title="main.go">
{`grid := [][]string{{"a", "b"}, {"c", "TARGET"}, {"e", "f"}}
outer:
	for r, row := range grid {
		for c, cell := range row {
			if strings.HasPrefix(cell, "TARGET") {
				fmt.Printf("labelled break: found at [%d][%d]\\n", r, c)
				break outer
			}
		}
	}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`labelled break: found at [1][1]`}
      </CodeBlock>

      <p>
        <code>goto</code> also exists and is genuinely usable (it cannot jump into a block or over a
        variable declaration), but the only place you will see it in practice is machine-generated
        code and a few hot loops in the standard library. Verified, for completeness — the following
        compiles and runs:
      </p>

      <CodeBlock language="go" title="main.go">
{`i := 0
loop:
	if i < 3 {
		fmt.Print("goto iteration ", i, "; ")
		i++
		goto loop
	}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`goto iteration 0; goto iteration 1; goto iteration 2;`}
      </CodeBlock>

      <InfoBox variant="info" title="Map iteration order is randomised, deliberately, per loop">
        <p>
          <code>for k := range someMap</code> gives you a different order every time — not just
          between runs, but between two loops in the same process. The runtime starts at a random
          bucket on purpose, so that nobody can accidentally depend on an order that is not
          guaranteed:
        </p>
        <CodeBlock language="text" title="Real output — four loops over the same map in one process, go1.25.5">
{`map order run 0: d e a b c
map order run 1: b c d e a
map order run 2: c d e a b
map order run 3: a b c d e`}
        </CodeBlock>
        <p>
          JavaScript objects guarantee insertion order for string keys, and <code>Map</code>{' '}
          guarantees it absolutely, so this will catch you in a test that compares serialised
          output. If you need deterministic order: collect the keys with{' '}
          <code>slices.Sorted(maps.Keys(m))</code> and range over that.
        </p>
      </InfoBox>

      <h2>Multiple Return Values</h2>
      <p>
        Functions return any number of values, which is a language feature rather than a tuple
        library or an out-parameter convention. It is the reason Go does not need exceptions, and
        it is the single most visible difference in the shape of Go code:
      </p>

      <CodeBlock language="go" title="main.go">
{`// The dominant Go idiom: (value, error).
func parsePort(s string) (int, error) {
	n, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parse port %q: %w", s, err)
	}
	if n < 1 || n > 65535 {
		return 0, fmt.Errorf("port %d out of range", n)
	}
	return n, nil
}

// Three returns is fine and common.
func splitHostPort(s string) (host string, port int, err error) {
	i := strings.LastIndex(s, ":")
	if i < 0 {
		return "", 0, errors.New("no colon in address")
	}
	p, err := parsePort(s[i+1:])
	if err != nil {
		return "", 0, err
	}
	return s[:i], p, nil
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`parsePort("8080") = 8080
parsePort("http")  error: parse port "http": strconv.Atoi: parsing "http": invalid syntax
unwrapped: strconv.Atoi: parsing "http": invalid syntax
splitHostPort -> host="db.internal" port=5432 err=<nil>`}
      </CodeBlock>

      <p>
        Two mechanical details. Discarding a return value requires <code>_</code> —{' '}
        <code>n, _ := parsePort(&quot;443&quot;)</code> is you saying out loud that you are ignoring
        an error. And a result you <em>do</em> bind has to be used, because unused locals are a
        compile error (see <a href="/go/intro">the intro lesson</a>), so you cannot accidentally
        bind an error and forget it.
      </p>

      <h3>Named returns, and why they are mostly discouraged</h3>
      <p>
        You can name the results. The names become real variables, pre-declared at their zero
        values, and <code>return</code> with no operands — a <strong>naked return</strong> —
        returns whatever they currently hold.
      </p>

      <CodeBlock language="go" title="main.go — do not write this">
{`func namedBad(s string) (host string, port int, err error) {
	i := strings.LastIndex(s, ":")
	if i < 0 {
		err = errors.New("no colon in address")
		return // <- a "naked return". Returns whatever the named vars hold NOW.
	}
	host = s[:i]
	port, err = parsePort(s[i+1:])
	return
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`namedBad      -> host="db.internal" port=5432 err=<nil>
namedBad      -> host="db.internal" port=0 err=port 99999 out of range   <- host was already set before the error`}
      </CodeBlock>

      <p>
        Look at the second line. The function failed <em>and</em> returned a populated{' '}
        <code>host</code>, because <code>host</code> was assigned before the error happened and the
        naked return shipped it. Any caller that checks the error is fine; any caller that is
        sloppy, or logs the result before checking, now has a half-valid value. The explicit{' '}
        <code>return &quot;&quot;, 0, err</code> in <code>splitHostPort</code> cannot do that.
      </p>
      <p>The case against named returns, concretely:</p>
      <ul>
        <li>
          <strong>Naked returns hide what is returned.</strong> In a 40-line function with five{' '}
          <code>return</code> statements, you have to track every assignment to know what each one
          sends back. The compiler will not tell you that you forgot to set one, because the zero
          value is always valid.
        </li>
        <li>
          <strong>Partial results leak</strong>, as above.
        </li>
        <li>
          <strong>They shadow.</strong> A named <code>err</code> plus an inner{' '}
          <code>x, err := ...</code> in a block is the shadowing bug from the top of this lesson,
          now with a silent return path attached.
        </li>
      </ul>
      <p>The two cases where they are genuinely right:</p>
      <ul>
        <li>
          <strong>Documentation on an otherwise ambiguous signature.</strong>{' '}
          <code>func Bounds() (left, top, right, bottom int)</code> is far better than four bare{' '}
          <code>int</code>s. Name them, then <em>still</em> return explicitly.
        </li>
        <li>
          <strong>When a <code>defer</code> needs to see or modify the result.</strong> This is the
          only thing you cannot do any other way, and it is the next section.
        </li>
      </ul>

      <h2><code>defer</code></h2>
      <p>
        <code>defer</code> schedules a function call to run when the <em>surrounding function</em>{' '}
        returns — on a normal return, on any <code>return</code> path, and while a panic is
        unwinding the stack. It is Go&apos;s <code>try/finally</code>, its{' '}
        <code>try-with-resources</code>, and its RAII destructor, collapsed into one keyword that
        you place next to the thing it cleans up:
      </p>

      <CodeBlock language="go" title="The shape you will write a thousand times">
{`f, err := os.Open(path)
if err != nil {
	return err
}
defer f.Close() // right next to the Open, impossible to forget at the bottom`}
      </CodeBlock>

      <h3>Rule one: LIFO</h3>

      <CodeBlock language="go" title="main.go">
{`func order() {
	fmt.Println("order: start")
	defer fmt.Println("order: deferred FIRST")
	defer fmt.Println("order: deferred SECOND")
	defer fmt.Println("order: deferred THIRD")
	fmt.Println("order: end of body")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`order: start
order: end of body
order: deferred THIRD
order: deferred SECOND
order: deferred FIRST`}
      </CodeBlock>

      <p>
        Last deferred, first run — which is what you want, because resources acquired later usually
        depend on resources acquired earlier.
      </p>

      <h3>Rule two: the arguments are evaluated <em>now</em></h3>
      <p>
        This is the gotcha. <code>defer f(x)</code> evaluates <code>x</code> at the moment the{' '}
        <code>defer</code> statement executes, stores the result, and calls <code>f</code> with that
        stored value much later. Only the <em>call</em> is deferred, not the argument expressions.
      </p>

      <CodeBlock language="go" title="main.go">
{`// 2. THE GOTCHA: arguments are evaluated when \`defer\` executes,
//    not when the deferred call runs.
func evalTime() {
	i := 0
	defer fmt.Println("evalTime: defer fmt.Println(i)      saw i =", i)
	i = 42
	fmt.Println("evalTime: i is now", i)
}

// 3. A closure defers the *read*, not just the call.
func closureForm() {
	i := 0
	defer func() { fmt.Println("closureForm: closure sees i =", i) }()
	i = 42
	fmt.Println("closureForm: i is now", i)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`evalTime: i is now 42
evalTime: defer fmt.Println(i)      saw i = 0

closureForm: i is now 42
closureForm: closure sees i = 42`}
      </CodeBlock>

      <p>
        <code>0</code> versus <code>42</code>, from two lines that look the same. The closure form
        wins because <code>func() {'{'} ... i ... {'}'}</code> takes <strong>no arguments</strong> —
        there is nothing to evaluate at defer time — and the body reads <code>i</code> from the
        enclosing scope when it eventually runs.
      </p>

      <FlowChart
        title="defer: three distinct moments, and what happens at each"
        chart={"graph TD\nA[\"the function body is running\"] --> B[\"a defer f(expr) statement is REACHED\"]\nB --> C[\"expr is evaluated RIGHT NOW<br/>and the resulting value is stored\"]\nC --> D[\"f is not called. The call plus its frozen<br/>arguments is pushed on this function's defer stack\"]\nD --> E[\"the rest of the body runs.<br/>Whatever expr read from may now change.\"]\nE --> F[\"a return statement, or a panic\"]\nF --> G[\"named result variables are assigned\"]\nG --> H[\"the defer stack pops: last deferred, first run\"]\nH --> I[\"f executes with the arguments frozen at step C\"]\nI --> J[\"deferred funcs may still rewrite named results\"]\nJ --> K[\"control returns to the caller,<br/>or the panic keeps unwinding\"]\nstyle C fill:#3d2f14,stroke:#fb923c\nstyle I fill:#3d2f14,stroke:#fb923c\nstyle J fill:#1a2744,stroke:#5b9cf6"}
      />

      <h3>The version of that bug you will actually write</h3>
      <p>
        Nobody ships <code>defer fmt.Println(i)</code>. Everybody, at least once, ships this:
      </p>

      <CodeBlock language="go" title="main.go">
{`// A timing decorator that always reports zero, because time.Since(start)
// is evaluated at the defer statement.
func handleBroken() {
	start := time.Now()
	defer fmt.Println("  broken: handler took", time.Since(start))
	time.Sleep(120 * time.Millisecond)
}

// The fix: wrap it so the CALL happens at return time.
func handleFixed() {
	start := time.Now()
	defer func() {
		fmt.Println("  fixed:  handler took", time.Since(start).Round(time.Millisecond))
	}()
	time.Sleep(120 * time.Millisecond)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`timing decorator:
  broken: handler took 9.917µs
  fixed:  handler took 121ms`}
      </CodeBlock>

      <p>
        <strong>9.917 microseconds versus 121 milliseconds</strong> — a four-order-of-magnitude
        difference, and the broken version produces a plausible-looking number rather than an
        obvious zero, so it survives code review and then lies in your metrics for a year.
      </p>

      <InfoBox variant="success" title="The toolchain does catch this one">
        <p>
          From the <a href="/go/setup">previous lesson</a>&apos;s list of vet analyzers,{' '}
          <code>defers</code> exists precisely for this:
        </p>
        <CodeBlock language="text" title="Real output — go vet on the code above, go1.25.5">
{`# example.com/defer2
# [example.com/defer2]
./main.go:13:46: call to time.Since is not deferred
(vet exit 1)`}
        </CodeBlock>
        <p>
          Which is a good argument for having <code>go vet ./...</code> in your pre-commit path
          rather than only in CI. Note that it catches <code>time.Since</code> specifically — it is
          a special case, not a general &quot;this argument is evaluated early&quot; analysis, so
          the same mistake with your own function goes unreported.
        </p>
      </InfoBox>

      <h3>What exactly gets frozen: receivers</h3>
      <p>
        <code>defer x.Method(args)</code> freezes the receiver too, and whether that freezes the{' '}
        <em>data</em> depends on whether the method takes a value or a pointer. I expected the two
        pointer-ish forms below to behave the same. They do not:
      </p>

      <CodeBlock language="go" title="main.go">
{`type counter struct{ n int }

func (c counter) byValue(tag string)    { fmt.Printf("  %-16s counter.n = %d\\n", tag, c.n) }
func (c *counter) byPointer(tag string) { fmt.Printf("  %-16s counter.n = %d\\n", tag, c.n) }

func receiverCopy() {
	a := counter{n: 1}
	b := counter{n: 1}
	c := counter{n: 1}

	defer a.byValue("value recv:")      // *a* is copied right now
	defer b.byPointer("pointer recv:")  // &b is copied right now; b.n read later
	defer (&c).byValue("ptr -> value:") // still a copy: the method takes a value

	a.n, b.n, c.n = 99, 99, 99
	fmt.Println("receiverCopy: set all three to 99")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`receiverCopy: set all three to 99
  ptr -> value:    counter.n = 1
  pointer recv:    counter.n = 99
  value recv:      counter.n = 1`}
      </CodeBlock>

      <p>
        Only the genuine pointer receiver saw <code>99</code>. Taking the address at the call
        site —&nbsp;<code>(&amp;c).byValue(...)</code>&nbsp;— changes nothing, because the method
        signature still takes a <code>counter</code> by value, so Go dereferences and copies it at
        defer time. The rule is about the <em>method&apos;s</em> receiver, not the expression you
        wrote. The next two lessons — <a href="/go/pointers">Pointers &amp; Value Semantics</a> and
        then <a href="/go/structs">Structs, Methods &amp; Composition</a> — go deeper on the
        receiver decision, in that order and for that reason.
      </p>

      <h3>Scope is the function, not the block</h3>

      <CodeBlock language="go" title="main.go">
{`func deferInLoop() {
	fmt.Println("  entering loop")
	for i := range 3 {
		defer fmt.Println("    deferred from iteration", i)
	}
	fmt.Println("  loop finished - nothing has run yet")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`defer in a loop:
  entering loop
  loop finished - nothing has run yet
    deferred from iteration 2
    deferred from iteration 1
    deferred from iteration 0
  back in main - the three deferred calls ran as deferInLoop returned`}
      </CodeBlock>

      <p>
        Nothing ran until <code>deferInLoop</code> returned. Replace{' '}
        <code>fmt.Println</code> with <code>f.Close()</code> over ten thousand files and you have
        held ten thousand file descriptors open until the function ends — a textbook leak, and a
        C++ habit that transfers badly, since a C++ destructor fires at the end of the enclosing{' '}
        <em>block</em>. The fix is to put the body in its own function, usually a closure called
        immediately, so there is a function boundary for the <code>defer</code> to land on.
      </p>

      <h3>Where <code>defer</code> and named returns earn their keep</h3>

      <CodeBlock language="go" title="main.go">
{`// defer + NAMED return: decorate every error path from one place.
func process(path string) (err error) {
	defer func() {
		if err != nil {
			err = fmt.Errorf("process %s: %w", path, err)
		}
	}()
	return os.ErrNotExist
}

// Without the named return, the deferred func cannot see or change the result.
func processUnnamed(path string) error {
	var err error
	defer func() {
		if err != nil {
			err = fmt.Errorf("process %s: %w", path, err) // modifies a local; nobody sees it
		}
	}()
	err = os.ErrNotExist
	return err
}

// recover() into a named return: turning a panic into an error.
func safeDivide(a, b int) (result int, err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("recovered: %v", r)
		}
	}()
	return a / b, nil
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`error wrapping:
  process():         process /etc/nope: file does not exist
  processUnnamed():  file does not exist

panic to error:
  safeDivide(10, 2) -> 5, <nil>
  safeDivide(10, 0) -> 0, recovered: runtime error: integer divide by zero`}
      </CodeBlock>

      <p>
        <code>process</code> wrapped the error; <code>processUnnamed</code> did not, despite looking
        almost identical, because <code>return err</code> copies the value into the (unnamed) result
        slot and the deferred closure then edits a local nobody reads. This is the one pattern that
        genuinely requires a named return, and it is why you will see it in well-written Go.
        Note also <code>safeDivide(10, 0)</code> returning <code>0</code> for{' '}
        <code>result</code>: the panic happened before anything was assigned, so{' '}
        <code>result</code> is still at its zero value.
      </p>

      <InfoBox variant="warning" title="Two more things about defer, and then you know all of it">
        <p>
          <strong><code>defer</code> runs during a panic.</strong> That is what makes{' '}
          <code>recover()</code> possible — it is only meaningful inside a deferred function:
        </p>
        <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`onPanic: recovered: something went wrong
onPanic: this deferred line still ran`}
        </CodeBlock>
        <p>
          <strong><code>os.Exit</code> does not run deferred calls.</strong> Neither does a fatal
          runtime error that is not recovered, nor <code>log.Fatal</code> (which calls{' '}
          <code>os.Exit(1)</code>). If you have cleanup that must happen, it cannot be behind{' '}
          <code>log.Fatal</code>:
        </p>
        <CodeBlock language="go" title="main.go">
{`func main() {
	defer fmt.Println("this will NEVER print")
	fmt.Println("about to call os.Exit(0)")
	os.Exit(0)
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`about to call os.Exit(0)`}
        </CodeBlock>
        <p>
          Which is why the idiomatic <code>main</code> is a three-line wrapper around a{' '}
          <code>run() error</code> function: <code>main</code> gets to call <code>os.Exit</code>,{' '}
          <code>run</code> gets to use <code>defer</code>.
        </p>
      </InfoBox>

      <h2>What to Carry Forward</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Instinct from Node / Java / C++</th>
            <th style={headStyle}>What Go actually does</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>an unset variable is <code>undefined</code>/<code>null</code></td>
            <td style={cellStyle}>it is the zero value of its type, always</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>a missing object key is distinguishable from a falsy one</td>
            <td style={cellStyle}>use <code>v, ok := m[k]</code>; plain indexing returns the zero value</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>s[i]</code> gives a character</td>
            <td style={cellStyle}>it gives a <code>byte</code>; <code>range</code> gives runes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>len(s)</code> counts characters</td>
            <td style={cellStyle}>it counts bytes; <code>utf8.RuneCountInString</code> counts runes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>numbers widen automatically</td>
            <td style={cellStyle}>never. <code>int</code> and <code>int64</code> will not even add.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>if (count)</code> tests nonzero</td>
            <td style={cellStyle}>type error. There is no truthiness.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>overflow becomes a bigger number or <code>Infinity</code></td>
            <td style={cellStyle}>it wraps, silently, at runtime</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>switch</code> cases fall through</td>
            <td style={cellStyle}>they do not. <code>fallthrough</code> is explicit and rare.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>a closure in a loop captures one shared variable</td>
            <td style={cellStyle}>per-iteration since Go 1.22, selected by your <code>go.mod</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>finally</code> runs at the end of the block</td>
            <td style={cellStyle}><code>defer</code> runs at the end of the <em>function</em></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>deferred arguments are evaluated when the cleanup runs</td>
            <td style={cellStyle}>they are evaluated at the <code>defer</code> statement</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>an enum is a closed set</td>
            <td style={cellStyle}>
              <code>iota</code> constants are just <code>int</code>s; no exhaustiveness checking
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        The <a href="/go/cheatsheet">Go Field Guide</a> at the end of this section holds the
        printable form of that table plus the zero-value reference. Next up is{' '}
        <a href="/go/structs">Structs, Methods &amp; Composition</a>, which takes the zero-value
        contract from this lesson and applies it to your own types — and is where the Java half of
        your brain finds out there are no classes and no inheritance.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          Here is the thing worth sitting with. Everything in this lesson that felt restrictive —
          no implicit conversion, no truthiness, no ternary, one loop keyword, unused variables as
          errors — is the same trade as <code>gofmt</code> having no options: Go removes the
          expression so that reading code requires less inference. The payoff is not elegance, it is
          that an unfamiliar Go file has almost no hidden behaviour to reconstruct.
        </p>
        <p>
          And one genuinely concrete thing to take with you: <strong>go and look at the timing
          decorators in whatever Go code you touch next.</strong> The{' '}
          <code>defer fmt.Println(time.Since(start))</code> bug is in a surprising amount of
          production code precisely because it produces a number rather than an error, and{' '}
          <code>go vet ./...</code> will find every instance of it in seconds.
        </p>
      </InfoBox>

      <p>
        Next: <strong><a href="/go/pointers">Pointers &amp; Value Semantics</a></strong>. It comes
        before structs and interfaces on purpose, because one rule underneath it decides how both of
        those behave — <strong>everything in Go is passed by value</strong>, including pointers and
        including the receiver of a method. Get that rule first and the{' '}
        <code>&amp;</code> and <code>*</code> you are about to see everywhere stop being syntax to
        memorise and become a choice you are making.
      </p>
    </LessonLayout>
  );
}

export default Syntax;
