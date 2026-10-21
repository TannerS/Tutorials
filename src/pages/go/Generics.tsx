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

export default function Generics() {
  return (
    <LessonLayout
      title="Generics"
      sectionId="go"
      lessonIndex={8}
      prev={{ path: '/go/slices', label: 'Slices, Maps & the Aliasing Trap' }}
      next={{ path: '/go/goroutines', label: 'Goroutines: Beyond the Event Loop' }}
    >
      <p>
        <a href="/go/slices">The previous lesson</a> ended on a frustration it had been building all
        the way through: a helper that works on <code>[]int</code> has to be written again for{' '}
        <code>[]string</code>, and the escape hatch — <code>[]any</code> plus a type assertion —
        throws away the one thing you came to a static language for. This lesson is the fix, and it
        is also how the <code>slices</code> and <code>maps</code> packages you have been calling are
        themselves written.
      </p>

      <p>
        You already know generics. You have written <code>List&lt;T&gt;</code> and{' '}
        <code>Map&lt;K, V&gt;</code> in Java, and in TypeScript you have probably written a
        conditional type that a colleague asked you to explain. So this lesson is not going to
        define &quot;type parameter&quot;. It is going to point at the three places Go is genuinely
        different, because those are the three places you will trip:
      </p>
      <ol>
        <li>
          <strong>They are young and deliberately narrow.</strong> Added in Go 1.18 (March 2022),
          twelve years after Go 1.0. The feature set is a fraction of Java&apos;s, let alone
          TypeScript&apos;s.
        </li>
        <li>
          <strong>They are not erased.</strong> Java throws <code>T</code> away and casts;
          TypeScript throws the whole type system away. Go compiles one copy of the machine code per{' '}
          <em>GC shape</em> and passes a hidden dictionary. <code>T</code> is a real type at run
          time, there is no boxing, and <code>make([]T, n)</code> just works.
        </li>
        <li>
          <strong>The culture is actively discouraging.</strong> This is the big one. In Java,
          reaching for a type parameter is a neutral act. In Go, a reviewer will ask you to justify
          it, and the honest answer is often &quot;I cannot&quot; — at which point you use an
          interface, or write the function twice.
        </li>
      </ol>

      <InfoBox variant="note" title="What was run for this lesson">
        <p>
          Go <strong>1.27.3</strong> is the current stable release. Every output block below came
          from the locally installed <strong>go1.25.5 darwin/arm64</strong> toolchain on an Apple M4
          Pro (14 logical CPUs), plus <strong>java 26.0.1</strong> for the erasure comparison.
          Nothing here is quoted from memory. Generics have not changed in a
          behaviour-visible way between 1.18 and 1.25 beyond the <code>comparable</code> loosening
          in 1.20, which is called out below.
        </p>
      </InfoBox>

      <h2>The Syntax, Fast</h2>

      <p>
        Square brackets, not angle brackets — because <code>&lt;</code> is already ambiguous with
        comparison and Go&apos;s parser refuses to backtrack. The constraint comes after the name,
        in the same position as a parameter type.
      </p>

      <CodeBlock language="go" title="main.go — the whole feature in one file">
{`package main

import "fmt"

// A constraint is an interface. This one lists TYPES rather than methods.
// The ~ means "any type whose underlying type is this".
type Number interface {
	~int | ~int64 | ~float64
}

func Sum[T Number](xs []T) T {
	var total T          // the zero value of T, whatever T turns out to be
	for _, x := range xs {
		total += x       // legal because every type in the set supports +
	}
	return total
}

// Two type parameters. \`any\` is the constraint that allows everything.
func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, 0, len(xs))   // make([]U, ...) — no erasure problem here
	for _, x := range xs {
		out = append(out, f(x))
	}
	return out
}

// comparable: the constraint for types usable as a map key or with ==
func Keys[K comparable, V any](m map[K]V) []K {
	out := make([]K, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	return out
}

type Celsius float64 // underlying type float64, so ~float64 covers it

func main() {
	fmt.Println(Sum([]int{1, 2, 3}))                   // T inferred: int
	fmt.Println(Sum([]float64{1.5, 2.5}))              // T inferred: float64
	fmt.Println(Sum([]Celsius{20.5, 1.5}))             // works BECAUSE of ~
	fmt.Println(Sum[int64]([]int64{1 << 40, 1 << 40})) // explicit, for contrast

	lens := Map([]string{"go", "node", "java"}, func(s string) int { return len(s) })
	fmt.Println(lens)

	ks := Keys(map[string]int{"a": 1})
	fmt.Printf("%T %v\\n", ks, ks)

	fmt.Println(Keys(map[any]bool{1: true})) // any satisfies comparable (1.20+)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`6
4
22
2199023255552
[2 4 4]
[]string [a]
[1]`}
      </CodeBlock>

      <p>
        That is close to the entire surface area. Type parameters on functions and on type
        declarations, constraints that are interfaces, and inference. There is no{' '}
        <code>extends</code>, no <code>super</code>, no <code>?</code> wildcard, no variance
        annotation, no <code>keyof</code>, no conditional types, and no default type arguments.
      </p>

      <h2>Constraints Are Just Interfaces — With a New Kind of Element</h2>

      <p>
        This is the part that is actually novel, and the part Java and TypeScript have no equivalent
        of. Before 1.18, an interface listed <em>methods</em>, and its meaning was &quot;any type
        with these methods&quot;. 1.18 generalised that: an interface now defines a{' '}
        <strong>type set</strong>, and you can populate that set with method elements, type
        elements, or both.
      </p>

      <FlowChart
        title="What a constraint can contain"
        chart={"graph LR\n  C[\"a constraint is an INTERFACE<br/>used in a type parameter list\"] --> M[\"method elements<br/>interface{ Write([]byte) (int, error) }\"]\n  C --> T[\"type elements — new in 1.18<br/>interface{ int | string }\"]\n  C --> B[\"both at once<br/>interface{ ~int; String() string }\"]\n  M --> MS[\"type set = every type with those methods\"]\n  T --> TS[\"type set = exactly those types\"]\n  B --> BS[\"type set = the intersection\"]\n  TS --> TIL[\"~int means 'any type whose<br/>UNDERLYING type is int'<br/>so type Celsius float64 is included\"]\n  MS --> U1[\"usable as an ordinary variable type\"]\n  TS --> U2[\"constraint-only: cannot declare var x interface{ int | string }\"]\n  style U2 fill:#3b2a1a,stroke:#fbbf24"}
      />

      <p>
        The consequence of that last box is a compile error you will hit in week one. An interface
        that contains type elements is not a type you can hold a value in — it only exists to
        constrain a type parameter:
      </p>

      <CodeBlock language="go" title="main.go">
{`package main

type Ordered interface{ ~int | ~string }
type Stringer interface{ String() string }

func main() {
	var ok Stringer // method-only interface: fine as a variable type
	var bad Ordered // type-union interface: not a real type
	_, _ = ok, bad
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/generics/p09
p09/main.go:8:10: cannot use type Ordered outside a type constraint: interface contains type constraints`}
      </CodeBlock>

      <p>
        So Go has two kinds of interface now, distinguished by what you are allowed to do with them.
        That is a genuine wart, and the error message is at least honest about it.
      </p>

      <h3>The three constraints you will actually use</h3>

      <CodeBlock language="go" title="The whole vocabulary, basically">
{`// 1. any — alias for interface{}, added in 1.18 purely for readability.
//    Zero constraints. You can pass it around, store it, compare it to nil,
//    and that is all: no operators, no field access, no method calls.
func First[T any](xs []T) T { return xs[0] }

// 2. comparable — the predeclared constraint for == and != and map keys.
//    NOT ordering. No <, >, <=, >=.
func Index[T comparable](xs []T, want T) int  // body may use x == want

// 3. cmp.Ordered — from the stdlib "cmp" package (1.21+). THIS is ordering.
//    Its definition is literally a type union of every ordered builtin.
func Clamp[T cmp.Ordered](v, lo, hi T) T      // body may use v < lo`}
      </CodeBlock>

      <p>
        Mixing those up produces four of the five most common generics errors in Go, and they all
        arrive in one build. Here is a file that makes every one of them deliberately:
      </p>

      <CodeBlock language="go" title="main.go — four mistakes on purpose">
{`package main

import "fmt"

// 1. Operators are not available on \`any\`.
func BadSum[T any](xs []T) T {
	var total T
	for _, x := range xs {
		total += x
	}
	return total
}

// 2. Return-type-only inference does not exist.
func Zero[T any]() T {
	var z T
	return z
}

// 3. Comparison needs \`comparable\`, not \`any\`.
func Contains[T any](xs []T, want T) bool {
	for _, x := range xs {
		if x == want {
			return true
		}
	}
	return false
}

// 4. Ordering needs cmp.Ordered, not comparable.
func Max2[T comparable](a, b T) T {
	if a > b {
		return a
	}
	return b
}

func main() {
	var n int = Zero()
	fmt.Println(n)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/generics/p02
p02/main.go:9:3: invalid operation: operator + not defined on total (variable of type T constrained by any)
p02/main.go:23:6: invalid operation: x == want (incomparable types in type set)
p02/main.go:32:5: invalid operation: a > b (type parameter T cannot use operator >)
p02/main.go:39:18: in call to Zero, cannot infer T (declared at p02/main.go:15:11)`}
      </CodeBlock>

      <p>
        Error 4 is the one that will annoy a TypeScript developer most.{' '}
        <code>var n int = Zero()</code> has all the information a human needs —{' '}
        <code>T</code> is obviously <code>int</code> — and TypeScript would infer it happily. Go
        only infers type arguments from <strong>the types of the ordinary arguments</strong> and
        from other type arguments. Never from the assignment context, never from the return type.
        Write <code>Zero[int]()</code>.
      </p>

      <InfoBox variant="danger" title="comparable lies a little, and it panics at run time">
        <p>
          Go 1.20 loosened <code>comparable</code> so that ordinary interface types satisfy it. This
          was necessary — before 1.20 you could not write a generic function that accepted{' '}
          <code>map[any]V</code>, which is absurd — but it punched a hole in a compile-time
          guarantee. <code>T comparable</code> no longer means &quot;<code>==</code> on T cannot
          panic&quot;. It means &quot;<code>==</code> on T compiles&quot;.
        </p>
        <CodeBlock language="go" title="main.go — compiles clean, go vet clean">
{`package main

import "fmt"

func Dedup[T comparable](xs []T) []T {
	seen := make(map[T]struct{}, len(xs))
	out := make([]T, 0, len(xs))
	for _, x := range xs {
		if _, dup := seen[x]; dup {
			continue
		}
		seen[x] = struct{}{}
		out = append(out, x)
	}
	return out
}

func main() {
	fmt.Println(Dedup([]any{1, "a", 1, "a", 2}))
	fmt.Println("now with a slice inside the interface:")
	fmt.Println(Dedup([]any{[]int{1}, []int{1}}))
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — go vet reported nothing; go run, go1.25.5, exit status 2">
{`[1 a 2]
now with a slice inside the interface:
panic: hash of unhashable type: []int

goroutine 1 [running]:
main.Dedup[...](...)
	/.../p03/main.go:9
main.main()
	/.../p03/main.go:21 +0x3a4
exit status 2`}
        </CodeBlock>
        <p>
          The practical rule: the moment your <code>T comparable</code> can be instantiated as an
          interface type, you have inherited the same runtime risk as a plain{' '}
          <code>map[any]V</code>. Slices, maps, and functions are not comparable, and a struct
          containing one is not either. If your generic container is public API, document it, the
          same way <code>maps.Equal</code> documents its NaN caveat.
        </p>
      </InfoBox>

      <h3>Constraint type inference — the one piece of real cleverness</h3>

      <p>
        Look at the signatures in the standard library <code>slices</code> package and you will see
        a pattern that looks redundant:
      </p>

      <CodeBlock language="go" title="Real signatures — go doc slices, go1.25.5">
{`func Clone[S ~[]E, E any](s S) S
func Sort[S ~[]E, E cmp.Ordered](x S)
func Contains[S ~[]E, E comparable](s S, v E) bool`}
      </CodeBlock>

      <p>
        Why two parameters when one would do? Because this way the function returns{' '}
        <strong>your</strong> slice type, not <code>[]E</code>. <code>S</code> is inferred from the
        argument, and then <code>E</code> is inferred from <code>S</code> — inference flowing from a
        type argument to another type argument, which is the feature called{' '}
        <em>constraint type inference</em>. Java&apos;s inference cannot do this and TypeScript
        reaches the same place by a completely different route (structural inference on the type
        literal).
      </p>

      <CodeBlock language="go" title="main.go">
{`type IDs []int

// S is inferred from the argument; E is inferred from S.
func Head[S ~[]E, E any](s S) (E, S) {
	return s[0], s[1:]
}

func main() {
	ids := IDs{3, 1, 2}

	slices.Sort(ids)
	clone := slices.Clone(ids) // returns IDs, not []int
	fmt.Printf("%T %v   clone: %T %v\\n", ids, ids, clone, clone)

	first, rest := Head(ids)
	fmt.Printf("first: %T %v   rest: %T %v\\n", first, first, rest, rest)

	// min and max are BUILTINS since Go 1.21 — no import, no type parameter.
	fmt.Println(min(3, 1, 2), max(3, 1, 2), min(2.5, 1.5), max("a", "b"))

	m := map[string]int{"a": 1}
	clear(m) // builtin since Go 1.21
	fmt.Println(len(m))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`main.IDs [1 2 3]   clone: main.IDs [1 2 3]
first: int 1   rest: main.IDs [2 3]
1 3 1.5 b
0`}
      </CodeBlock>

      <p>
        Note the last three lines. <code>min</code>, <code>max</code>, and <code>clear</code> are{' '}
        <strong>builtins</strong>, not generic functions — the Go team looked at the single most
        common reason people wanted generics and solved it without generics in 1.21. If you find
        yourself writing <code>func Min[T cmp.Ordered](a, b T) T</code>, you are reimplementing a
        keyword.
      </p>

      <h2>What the Compiler Actually Does — and Why It Is Not Erasure</h2>

      <p>
        Here is where the Java half of your brain needs rewiring. Three languages, three completely
        different compilation strategies for the same source construct:
      </p>

      <FlowChart
        title="One generic function, three compilers"
        chart={"graph TD\n  SRC[\"one generic function in source\"] --> Q{\"compiler strategy\"}\n  Q -->|\"TypeScript\"| TS1[\"types deleted entirely\"]\n  TS1 --> TS2[\"one JS function<br/>no type info at run time at all\"]\n  Q -->|\"Java: erasure\"| J1[\"T replaced by Object<br/>casts inserted at call sites\"]\n  J1 --> J2[\"one bytecode method<br/>List&lt;String&gt; and List&lt;Integer&gt; are the same class\"]\n  J2 --> J3[\"primitives must be boxed<br/>new T[] is not expressible\"]\n  Q -->|\"Go: GC shape stenciling\"| G1[\"one copy of the machine code per GC SHAPE\"]\n  G1 --> G2[\"all pointer types share go.shape.*uint8<br/>each scalar type gets its own copy\"]\n  G2 --> G3[\"a hidden dictionary argument carries<br/>the real type info and method tables\"]\n  G3 --> G4[\"T is a real type at run time<br/>no boxing, make([]T, n) works\"]\n  style J3 fill:#3b1a1a,stroke:#f87171\n  style G4 fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        You do not have to take that on faith. The instantiations are ordinary symbols in the
        binary, so you can list them. This program calls <code>Sum</code> with three different
        scalar types and <code>First</code> with <code>*User</code>, <code>*Order</code>, and{' '}
        <code>string</code>:
      </p>

      <CodeBlock language="go" title="main.go">
{`func Sum[T int | int64 | float64](xs []T) T { /* ... */ }
func First[T any](xs []T) T { return xs[0] }

type Box[T any] struct{ v T }
type User struct{ Name string }
type Order struct{ ID int }

func main() {
	fmt.Println(Sum([]int{1}), Sum([]int64{1}), Sum([]float64{1}))
	fmt.Println(First([]*User{{Name: "a"}}).Name)
	fmt.Println(First([]*Order{{ID: 1}}).ID)
	fmt.Println(First([]string{"s"}))
	fmt.Println(Box[int]{1}.v, Box[string]{"x"}.v)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go tool nm, go1.25.5 (built with -gcflags=all=-l to stop inlining hiding the symbols)">
{`$ go build -gcflags=all=-l -o p05bin ./p05
$ go tool nm p05bin | grep -E "main\\.(Sum|First)" | sort
10009d3a0 T main.First[go.shape.string]
10009d400 T main.First[go.shape.*uint8]
10009d460 T main.Sum[go.shape.float64]
10009d490 T main.Sum[go.shape.int64]
10009d4c0 T main.Sum[go.shape.int]`}
      </CodeBlock>

      <p>
        Read that carefully, because it contains the entire design:
      </p>
      <ul>
        <li>
          <strong><code>First[*User]</code> and <code>First[*Order]</code> are the same function.</strong>{' '}
          Both collapsed into <code>main.First[go.shape.*uint8]</code>. Every pointer type has the
          same <em>GC shape</em> — one word, and the garbage collector should follow it — so one
          copy of the machine code serves all of them. This is the &quot;GC&quot; in GC shape
          stenciling.
        </li>
        <li>
          <strong><code>Sum[int]</code> and <code>Sum[int64]</code> are different functions</strong>,
          even though both are 8 bytes on this machine, because they are distinct types with
          distinct arithmetic. Scalars are not unified.
        </li>
        <li>
          <strong>Five calls, five <code>main.*</code> symbols, no <code>Object</code>.</strong>{' '}
          Compare Java, where <code>First</code> would be exactly one method taking and returning{' '}
          <code>Object</code>.
        </li>
      </ul>

      <p>
        Because the shapes are shared, the per-shape copy cannot know the real type on its own. So
        Go passes an invisible extra argument — a <strong>dictionary</strong> — carrying the actual{' '}
        <code>T</code>, its method tables, and anything else the body needs. That hybrid is why{' '}
        <code>T</code> survives to run time:
      </p>

      <CodeBlock language="go" title="main.go — T is a real type inside the function">
{`type User struct{ Name string }

func describe[T any](xs []T) {
	var zero T
	fmt.Printf("  T = %-7v  zero = %-12v  make([]T, 2) = %v\\n",
		reflect.TypeFor[T](), fmt.Sprintf("%#v", zero), make([]T, 2))
}

func main() {
	describe([]string{"a"})
	describe([]int{1})
	describe([]*User{})
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`  T = string   zero = ""            make([]T, 2) = [ ]
  T = int      zero = 0             make([]T, 2) = [0 0]
  T = *main.User  zero = (*main.User)(nil)  make([]T, 2) = [<nil> <nil>]`}
      </CodeBlock>

      <h3>The same question, asked of Java</h3>

      <p>
        For contrast, here is erasure being erasure. This is not a thought experiment; it ran:
      </p>

      <CodeBlock language="java" title="Erasure.java">
{`static <T> void show(List<T> list) {
    System.out.println("  inside the generic method, runtime class = "
        + list.getClass().getName());
}

public static void main(String[] args) throws Exception {
    List<String>  strings = new ArrayList<>();
    List<Integer> ints    = new ArrayList<>();

    System.out.println("List<String>.getClass() == List<Integer>.getClass() -> "
        + (strings.getClass() == ints.getClass()));
    show(strings);
    show(ints);

    // The compiler says this list holds Strings. The JVM has no idea.
    List rawHandleToTheSameList = strings;
    rawHandleToTheSameList.add(42);
    System.out.println("a List<String> now contains: " + strings);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java 26.0.1, same machine (one unchecked warning elided)">
{`List<String>.getClass()  == List<Integer>.getClass()  -> true
  inside the generic method, runtime class = java.util.ArrayList
  inside the generic method, runtime class = java.util.ArrayList
a List<String> now contains: [42]`}
      </CodeBlock>

      <p>
        A <code>List&lt;String&gt;</code> holding the integer 42, confirmed by the JVM. There is no
        Go equivalent of that sentence — not because Go is safer by philosophy, but because the type
        argument is still physically present at run time, so there is nothing to launder.
      </p>

      <h3>And the performance consequence, measured</h3>

      <p>
        Erasure forces boxing: <code>List&lt;Integer&gt;</code> is a list of pointers to heap
        objects. Go&apos;s per-shape instantiation does not, so a generic <code>Sum</code> over{' '}
        <code>[]int</code> compiles to the same loop as a hand-written one. Four implementations of
        &quot;sum 1000 ints&quot; — concrete, generic, and the two things people wrote <em>before</em>{' '}
        1.18 — benchmarked against each other:
      </p>

      <CodeBlock language="go" title="bench_test.go (abridged — the four implementations)">
{`func SumInts(xs []int) int                   { /* plain, concrete */ }
func SumGeneric[T Number](xs []T) T          { /* generic over ~int|~int64|~float64 */ }
func SumAdders(xs []Adder) int                { /* interface with an Add method */ }
func SumAny(xs []any) int                     { /* any + a type switch */ }

// Values are deliberately > 255: the runtime keeps a static table of small
// integers, so tiny ints convert to an interface without allocating and
// would have hidden the boxing cost entirely.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go test -bench=. -benchmem -count=1, go1.25.5">
{`goos: darwin
goarch: arm64
pkg: example.com/generics/bench
cpu: Apple M4 Pro
BenchmarkConcrete-14           	 4711282	       243.9 ns/op	       0 B/op	       0 allocs/op
BenchmarkGeneric-14            	 5103013	       233.3 ns/op	       0 B/op	       0 allocs/op
BenchmarkInterfaceMethod-14    	  185283	      6751 ns/op	    8000 B/op	    1000 allocs/op
BenchmarkAnyTypeSwitch-14      	 2534468	       473.1 ns/op	       0 B/op	       0 allocs/op
BenchmarkBoxIntoAny-14         	  195050	      5978 ns/op	   24384 B/op	    1001 allocs/op
PASS
ok  	example.com/generics/bench	6.264s`}
      </CodeBlock>

      <p>
        <strong>Generic and concrete are indistinguishable</strong> — 233 ns against 244 ns is
        run-to-run noise, and both allocate nothing. The interface-with-a-method version is{' '}
        <strong>28&times; slower and allocates 1000 times</strong>, one per boxed accumulator. Even
        the cheap <code>any</code> + type-switch version is 2&times; slower on an{' '}
        <em>already boxed</em> slice, and the last line shows what boxing the slice costs in the
        first place: 5,978 ns and 1,001 allocations.
      </p>

      <InfoBox variant="warning" title="Do not read that as &quot;generics make Go faster&quot;">
        <p>
          The honest reading is narrower: <em>when you were already forced to box, generics remove
          the boxing</em>. That is a real win for numeric and container code. But generic code can
          also be <strong>slower</strong> than concrete code in cases this benchmark does not cover:
          calling a method through a dictionary costs an indirection the compiler may not be able to
          devirtualise or inline, and shared pointer-shape instantiations sometimes force a value
          through memory that a concrete version would keep in a register. Go&apos;s generics are a
          correctness and deduplication feature that happens not to cost anything here. If you are
          converting hot concrete code to generic code, benchmark it rather than assuming.
        </p>
      </InfoBox>

      <h2>The Hard Limits</h2>

      <p>
        Every one of these is a thing you can express in Java or TypeScript and simply cannot
        express in Go. They are not oversights you can work around with cleverness; the compiler
        stops you.
      </p>

      <h3>No generic methods</h3>

      <p>
        Methods can <em>use</em> their receiver type&apos;s parameters, but cannot introduce their
        own. The <a href="/go/intro">intro lesson</a> showed the bare error; here is why it bites.
      </p>

      <CodeBlock language="go" title="main.go">
{`package main

type Stack[T any] struct {
	items []T
}

// Fine: T comes from the receiver.
func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

// Not fine: U is new.
func (s *Stack[T]) MapTo[U any](f func(T) U) []U {
	out := make([]U, 0, len(s.items))
	for _, it := range s.items {
		out = append(out, f(it))
	}
	return out
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/generics/p04
p04/main.go:11:25: syntax error: method must have no type parameters`}
      </CodeBlock>

      <p>
        A <em>syntax</em> error, note — the grammar does not admit it. That rules out every fluent
        generic chain you know from Java streams, LINQ, or TypeScript builders:{' '}
        <code>stack.MapTo(f).Filter(g)</code> cannot exist. The Go answer is a package-level
        function, <code>MapTo(stack, f)</code>, which reads worse and is the only option. The
        underlying reason is that allowing it would make interface satisfaction undecidable in
        general, so it is unlikely to change.
      </p>

      <h3>No type switch on a type parameter</h3>

      <CodeBlock language="go" title="main.go">
{`package main

type Num interface{ int | float64 }

func format[T Num](v T) string {
	switch v.(type) { // <-- not allowed
	case int:
		return "int"
	case float64:
		return "float64"
	}
	return "?"
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/generics/p10
p10/main.go:6:9: cannot use type switch on type parameter value v (variable of type T constrained by Num)`}
      </CodeBlock>

      <p>
        The workaround is to launder the value through <code>any</code> first —{' '}
        <code>switch any(v).(type)</code> — which compiles and prints what you expect. But stop and
        notice what you are doing: if the body needs to branch on the concrete type, the types do
        not actually share an implementation, and <strong>that is the signal to write separate
        functions or put a method on an interface</strong>. The restriction is the language telling
        you something true.
      </p>

      <h3>The rest of the list</h3>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>You want</th>
            <th style={headStyle}>Java / TypeScript</th>
            <th style={headStyle}>Go</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Generic methods</td>
            <td style={cellStyle}>routine</td>
            <td style={cellStyle}>syntax error</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Variance / wildcards</td>
            <td style={cellStyle}><code>List&lt;? extends T&gt;</code>, TS variance annotations</td>
            <td style={cellStyle}>
              none. <code>[]Dog</code> is not a <code>[]Animal</code>, ever
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Specialisation for one type</td>
            <td style={cellStyle}>overloading, TS overload signatures</td>
            <td style={cellStyle}>none. No overloading at all in Go</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Default type arguments</td>
            <td style={cellStyle}><code>Foo&lt;T = string&gt;</code> in TS</td>
            <td style={cellStyle}>none</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Higher-kinded types</td>
            <td style={cellStyle}>no in Java, partially emulable in TS</td>
            <td style={cellStyle}>no</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Reflecting over the type argument</td>
            <td style={cellStyle}>
              Java: erased, needs a <code>Class&lt;T&gt;</code> token
            </td>
            <td style={cellStyle}>
              <code>reflect.TypeFor[T]()</code> — it is right there
            </td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Constraint on a struct field&apos;s existence</td>
            <td style={cellStyle}>TS: <code>T extends {'{ id: string }'}</code></td>
            <td style={cellStyle}>
              none. Constraints see methods and types, never fields
            </td>
          </tr>
        </tbody>
      </table>

      <p>
        That second-to-last row is the one TypeScript developers mourn. There is no way to say
        &quot;any struct with an <code>ID string</code> field&quot;. You must require a method —{' '}
        <code>{'interface{ GetID() string }'}</code> — which means every type needs an accessor it
        otherwise would not have. It is the single most requested generics extension and it is not
        in 1.25.
      </p>

      <InfoBox variant="info" title="Your go.mod gates the feature, not your toolchain">
        <p>
          Same pattern as <code>GOMAXPROCS</code> in the{' '}
          <a href="/go/goroutines">goroutines lesson</a>: the language version declared in{' '}
          <code>go.mod</code> decides what the compiler accepts, regardless of which compiler you
          are running. Compiling generics with <code>go 1.17</code> in go.mod on the 1.25.5
          toolchain:
        </p>
        <CodeBlock language="text" title="Real output — go build, go1.25.5, go.mod says go 1.17">
{`# example.com/old
./main.go:5:12: type parameter requires go1.18 or later (-lang was set to go1.17; check go.mod)
./main.go:5:14: predeclared any requires go1.18 or later (-lang was set to go1.17; check go.mod)
./main.go:7:27: implicit function instantiation requires go1.18 or later (-lang was set to go1.17; check go.mod)`}
        </CodeBlock>
        <p>
          If you inherit an old service and generics mysteriously do not compile, that is the first
          line to check. See <a href="/go/setup">Setup, Modules &amp; the Toolchain</a> for the
          difference between the <code>go</code> and <code>toolchain</code> directives.
        </p>
      </InfoBox>

      <h2>When Not To Use Them — Which Is Most of the Time</h2>

      <p>
        This section is the reason the lesson exists. In Java, a generic utility class is unremarkable.
        In Go, the team that shipped the feature also published guidance on restraining it, and the
        community took that guidance seriously enough that reaching for a type parameter in a code
        review is a conversation.
      </p>

      <FlowChart
        title="The decision procedure, honestly"
        chart={"graph TD\n  START[\"I am tempted to write a type parameter\"] --> A{\"Have I already written<br/>the concrete version?\"}\n  A -->|\"no\"| NO1[\"Write it concretely first.<br/>Write code, don't design types.\"]\n  A -->|\"yes\"| B{\"Does the body only CALL METHODS<br/>on the value?\"}\n  B -->|\"yes\"| NO2[\"Use an interface.<br/>A type parameter buys nothing here.\"]\n  B -->|\"no\"| C{\"Does the body need a different<br/>IMPLEMENTATION per type?\"}\n  C -->|\"yes\"| NO3[\"Use an interface with a method,<br/>or write the functions separately.\"]\n  C -->|\"no\"| D{\"Is it a slice/map/channel helper,<br/>or a container data structure?\"}\n  D -->|\"no\"| NO4[\"Two copies of 20 lines is cheaper<br/>than one clever abstraction.\"]\n  D -->|\"yes\"| E{\"Is it already in slices,<br/>maps, cmp, or sync?\"}\n  E -->|\"yes\"| NO5[\"Use the standard library.\"]\n  E -->|\"no\"| YES[\"Generics are the right tool.\"]\n  style YES fill:#1a3329,stroke:#4ade80\n  style NO1 fill:#3b2a1a,stroke:#fbbf24\n  style NO2 fill:#3b2a1a,stroke:#fbbf24\n  style NO3 fill:#3b2a1a,stroke:#fbbf24\n  style NO4 fill:#3b2a1a,stroke:#fbbf24\n  style NO5 fill:#3b2a1a,stroke:#fbbf24"}
      />

      <h3>Rule 1: if the body only calls methods, use an interface</h3>

      <p>
        This is the most common misuse, and it is seductive because the generic version compiles and
        looks more modern.
      </p>

      <CodeBlock language="go" title="main.go — two versions of the same function">
{`package main

import (
	"bytes"
	"io"
	"os"
)

// The generic version. Looks clever. It is worse.
func writeAllGeneric[W io.Writer](ws []W, b []byte) {
	for _, w := range ws {
		_, _ = w.Write(b)
	}
}

// The boring version.
func writeAllIface(ws []io.Writer, b []byte) {
	for _, w := range ws {
		_, _ = w.Write(b)
	}
}

func main() {
	var buf bytes.Buffer
	writeAllIface([]io.Writer{os.Stdout, &buf}, []byte("both\\n"))
	writeAllGeneric([]any{os.Stdout, &buf}, []byte("nope\\n"))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5">
{`# example.com/generics/p07b
p07b/main.go:26:17: in call to writeAllGeneric, W (type any) does not satisfy io.Writer (missing method Write)`}
      </CodeBlock>

      <p>
        Be precise about what is wrong here, because the sloppy version of this argument is itself
        wrong. <code>writeAllGeneric</code> is not <em>unable</em> to take a mixed slice — you can
        instantiate <code>W = io.Writer</code> explicitly and it works, which I confirmed. The
        problem is that the generic version can only ever be <strong>as good as</strong> the
        interface version, never better:
      </p>
      <ul>
        <li>
          It forces the caller to have a homogeneous <code>[]W</code>, or to spell out{' '}
          <code>[]io.Writer</code> anyway — at which point you wrote a type parameter to arrive back
          at the interface.
        </li>
        <li>
          It generates one copy of the function per shape instead of one total.
        </li>
        <li>
          If it is a struct field rather than a parameter, the type parameter{' '}
          <em>infects the struct</em>, and then everything holding that struct, all the way up.
        </li>
      </ul>
      <p>
        An interface is Go&apos;s abstraction mechanism. Generics are for when you need the type and
        an interface cannot give it to you.
      </p>

      <h3>Rule 2: check the standard library first — and notice what is missing from it</h3>

      <p>
        <code>slices</code>, <code>maps</code>, and <code>cmp</code> already cover most of what
        people reinvent. What is <em>absent</em> from that list is as informative as what is
        present:
      </p>

      <CodeBlock language="text" title="Real output — go doc slices | grep, go1.25.5">
{`$ go doc slices | grep -cE "^func"
40
$ go doc slices | grep -E "^func (Map|Filter|Reduce|FlatMap|GroupBy)"
$ echo "exit status: $?"
exit status: 1`}
      </CodeBlock>

      <p>
        40 generic functions in <code>slices</code>, and <strong>not one of Map, Filter, Reduce,
        FlatMap, or GroupBy</strong>. That is a deliberate decision, not an oversight. The Go
        position is that <code>for</code> with an <code>append</code> is clearer than a chain of
        higher-order calls, and that a half-functional API encourages the chains Go cannot express
        anyway (see: no generic methods). Coming from{' '}
        <code>arr.map().filter().reduce()</code> in JavaScript this is the single most jarring
        cultural difference in the whole language, and writing your own{' '}
        <code>pkg/functional</code> package is a well-known way to make a Go codebase unpleasant for
        the next person.
      </p>

      <p>
        Also note what <code>maps.Keys</code> actually returns on a modern Go:
      </p>

      <CodeBlock language="go" title="main.go">
{`m := map[string]int{"b": 2, "a": 1, "c": 3}
fmt.Printf("maps.Keys(m) is a %T\\n", maps.Keys(m))
fmt.Println("slices.Sorted(maps.Keys(m)) =", slices.Sorted(maps.Keys(m)))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5">
{`maps.Keys(m) is a iter.Seq[string]
slices.Sorted(maps.Keys(m)) = [a b c]`}
      </CodeBlock>

      <p>
        An <code>iter.Seq[K]</code>, not a <code>[]K</code> — range-over-func iterators landed in
        1.23, and <code>maps.Keys</code> was designed for them. Many tutorials show{' '}
        <code>maps.Keys</code> returning a slice; that was{' '}
        <code>golang.org/x/exp/maps</code>, a different package. The stdlib idiom is{' '}
        <code>slices.Sorted(maps.Keys(m))</code> or <code>slices.Collect(maps.Keys(m))</code>.
      </p>

      <h3>Rule 3: write it twice before you write it once</h3>

      <p>
        The Go team&apos;s own slogan for this is <em>&quot;write code, don&apos;t design
        types&quot;</em>: do not design a generic abstraction up front from the shape you imagine
        the problem has. Write the concrete version. Write the second concrete version. If the two
        bodies are then <em>identical</em> except for a type name, replace them with a generic
        function — and if they are not identical, you just learned that a type parameter was the
        wrong tool.
      </p>
      <p>
        This is roughly the opposite of the instinct Spring and TypeScript train. In Spring,{' '}
        <code>Repository&lt;T, ID&gt;</code> up front is the whole point. In Go, duplicated code is
        cheap, discoverable, and easy to delete; a wrong abstraction is none of those. Two 20-line
        functions that diverge next quarter are a better outcome than one 35-line generic function
        with a <code>bool</code> flag bolted on.
      </p>

      <InfoBox variant="tip" title="The three cases where nobody will argue with you">
        <ul>
          <li>
            <strong>Functions over slices, maps, or channels where the element type does not
            matter.</strong> If <code>slices</code> and <code>maps</code> do not already have it:{' '}
            <code>Chunk</code>, <code>Partition</code>, a channel fan-in.
          </li>
          <li>
            <strong>General-purpose data structures.</strong> A set, an LRU cache, a heap, a typed
            worker pool. Before 1.18 these all had <code>interface{}</code> APIs and cast at every
            boundary; a <code>Set[T]</code> is strictly better. <code>sync.OnceValue[T]</code> and{' '}
            <code>sync.Map</code>&apos;s typed cousins in the ecosystem are the stdlib version of
            this.
          </li>
          <li>
            <strong>Several methods or functions with byte-identical bodies and different types.</strong>{' '}
            The classic is a constructor or decoder: <code>Decode[T any](r io.Reader) (T, error)</code>{' '}
            beats <code>Decode(r io.Reader, out any) error</code> because the caller gets a typed
            result instead of passing a pointer and hoping.
          </li>
        </ul>
      </InfoBox>

      <h2>Translating Your Instincts</h2>

      <CodeBlock language="text" title="Java / TypeScript habit  ->  what to do in Go">
{`Java / TS                              In Go
-------------------------------------  -------------------------------------------
<T> on a method                        Impossible. Package-level func(receiver, ...)
<T extends Comparable<T>>              [T cmp.Ordered]
<T extends Number>                     [T interface{ ~int | ~float64 | ... }]
                                       There is no Number hierarchy to extend.
<T>, unbounded                         [T any]
List<? extends Animal>                 []Animal of an interface type. No variance.
Class<T> token to beat erasure         Unnecessary. reflect.TypeFor[T]() works.
new T() / new T[n]                     var z T  /  make([]T, n). Both legal.
Overload for the int case              No overloading. Separate name, or a switch
                                       on any(v).(type) — but see Rule 1 first.
T extends { id: string }  (TS)         Impossible. Require a method instead.
Foo<T = string>  (TS)                  No default type arguments.
arr.map(f).filter(g)                   A for loop. slices has no Map or Filter.
Repository<T, ID> up front             Write the concrete repo. Then the second
                                       one. Then decide.
List<Integer> boxes every element      []int does not box. Measured above: 0 allocs
                                       generic vs 1000 allocs via an interface.`}
      </CodeBlock>

      <InfoBox variant="success" title="What you should now be able to say out loud">
        <ul>
          <li>
            A constraint is an interface; since 1.18 an interface defines a <em>type set</em>, which
            may contain type elements (<code>int | string</code>) as well as methods.{' '}
            <code>~int</code> means &quot;underlying type int&quot;. An interface with type elements
            cannot be used as a variable type.
          </li>
          <li>
            <code>any</code> gives you no operations, <code>comparable</code> gives you{' '}
            <code>==</code>, and <code>cmp.Ordered</code> gives you <code>&lt;</code>. Since 1.20{' '}
            <code>comparable</code> admits interface types, so <code>==</code> can still panic at
            run time.
          </li>
          <li>
            Inference flows from argument types and from other type arguments (constraint type
            inference), never from the return type or the assignment target.
          </li>
          <li>
            Go does not erase. One machine-code copy per GC shape — all pointers share{' '}
            <code>go.shape.*uint8</code> — plus a hidden dictionary. So <code>T</code> is real at
            run time, nothing boxes, and <code>make([]T, n)</code> is fine.
          </li>
          <li>
            No generic methods, no variance, no specialisation, no default type arguments, no
            constraining on struct fields. These are design decisions, not a roadmap.
          </li>
          <li>
            The default answer is still an interface, or two concrete functions. Reach for a type
            parameter for container types and for element-type-agnostic slice/map/channel helpers —
            after checking <code>slices</code>, <code>maps</code>, and <code>cmp</code>.
          </li>
        </ul>
      </InfoBox>

      <p>
        That closes the type system. <a href="/go/syntax">Syntax</a>,{' '}
        <a href="/go/pointers">value semantics</a>, <a href="/go/structs">structs</a>,{' '}
        <a href="/go/interfaces">interfaces</a>, <a href="/go/errors">errors</a>,{' '}
        <a href="/go/slices">slices and maps</a>, and now type parameters — you can write and
        structure ordinary Go programs, and everything from here is about what else the language
        gives you.
      </p>
      <p>
        Next: <strong><a href="/go/goroutines">Goroutines: Beyond the Event Loop</a></strong>, and it
        is the hardest turn in this section. Five lessons in a row are about concurrency, because Go
        is built around it and because this is where a Node background actively misleads you —{' '}
        <code>go f()</code> returns nothing at all, there is no promise to await, and two goroutines
        touching one variable is a real data race rather than a theoretical one. A condensed
        reference for everything in this lesson lives in the{' '}
        <a href="/go/cheatsheet">Go Field Guide</a>.
      </p>
    </LessonLayout>
  );
}
