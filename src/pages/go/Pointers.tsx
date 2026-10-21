import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Pointers() {
  return (
    <LessonLayout
      title="Pointers & Value Semantics"
      sectionId="go"
      lessonIndex={3}
      prev={{ path: '/go/syntax', label: 'Syntax, Types & Zero Values' }}
      next={{ path: '/go/structs', label: 'Structs, Methods & Composition' }}
    >
      <p>
        This lesson sits awkwardly between your three backgrounds. Coming from{' '}
        <strong>Node</strong>, you have never written a pointer and may suspect they are
        something to be afraid of. Coming from <strong>C++</strong>, you have written far too
        many and will reach for mental machinery — ownership, lifetimes, arithmetic — that Go
        simply does not have. Coming from <strong>Java</strong>, you have been using references
        the whole time without the syntax ever making it explicit.
      </p>

      <p>
        Go's position is deliberately boring, and it is worth stating up front:{' '}
        <strong>pointers exist, they are garbage collected, and you cannot do arithmetic on
        them.</strong> That is nearly the whole story. What actually takes adjusting is not the{' '}
        <code>*</code> and <code>&amp;</code> syntax — it is the rule underneath them.
      </p>

      <h2>The One Rule: Everything Is Pass-by-Value</h2>

      <p>
        Go passes <em>everything</em> by value. Every argument, every assignment, every channel
        send is a copy. There is no pass-by-reference in the language at all.
      </p>

      <p>
        That sounds like it contradicts the existence of pointers, and the resolution is the
        thing to internalise: when you pass a pointer, Go copies <em>the pointer</em>. The copy
        holds the same address, so it still points at the same value — but the pointer itself is
        a copy, and that distinction has visible consequences.
      </p>

      <CodeBlock language="go" title="Both halves of the rule, in one program">
{`type Counter struct{ n int }

func (c Counter) IncVal()  { c.n++ }   // value receiver — mutates a COPY
func (c *Counter) IncPtr() { c.n++ }   // pointer receiver — mutates the original

func mutate(p *int) { *p = 99 }        // writes THROUGH the pointer — visible outside

func main() {
	c := Counter{}
	c.IncVal()
	fmt.Println("after IncVal (value receiver):", c.n)
	c.IncPtr()
	fmt.Println("after IncPtr (pointer receiver):", c.n)

	x := 1
	mutate(&x)
	fmt.Println("after mutate(&x):", x)

	// Pointers are pass-by-value too. Reassigning the local copy of the
	// pointer does nothing to the caller — only writing THROUGH it does.
	reassign := func(p *int) { v := 7; p = &v; _ = p }
	reassign(&x)
	fmt.Println("after reassign(&x):", x)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, Go 1.25.5">
{`after IncVal (value receiver): 0
after IncPtr (pointer receiver): 1
after mutate(&x): 99
after reassign(&x): 99`}
      </CodeBlock>

      <p>
        Read those four lines carefully, because each one is a different lesson. The first is the
        bug that bites everybody: <code>IncVal</code> incremented a copy that was discarded the
        moment the method returned, and Go gave you no warning. The second shows the pointer
        receiver doing what you meant. The third shows writing <em>through</em> a pointer
        reaching the caller. The fourth is the subtle one — <code>reassign</code> pointed its own
        local copy somewhere else, and <code>x</code> never noticed.
      </p>

      <InfoBox variant="tip" title="The test that resolves every case">
        Ask: am I modifying <em>what the pointer points at</em>, or <em>the pointer itself</em>?
        Writing through it (<code>*p = 99</code>, <code>c.n++</code> on a pointer receiver)
        reaches the caller. Reassigning it (<code>p = &amp;v</code>) does not, because{' '}
        <code>p</code> is your own copy. This is exactly the same rule as JavaScript objects,
        where mutating a property is visible to the caller but reassigning the parameter is not —
        Go just makes the distinction visible in the syntax.
      </InfoBox>

      <FlowChart
        title="Passing a Pointer: What Gets Copied"
        chart={
          'graph LR\n' +
          '  subgraph caller["caller"]\n' +
          '    X["x = 1<br/>at address 0xc000..."]\n' +
          '  end\n' +
          '  subgraph callee["mutate(p *int)"]\n' +
          '    P["p — a COPY of the address"]\n' +
          '  end\n' +
          '  X -->|"&x passes the address by value"| P\n' +
          '  P -->|"*p = 99 writes THROUGH — caller sees it"| X\n' +
          '  P -.->|"p = &v only moves the local copy — caller unaffected"| V["v = 7"]\n' +
          '  style X fill:#1a3329,stroke:#4ade80\n' +
          '  style P fill:#1a2744,stroke:#5b9cf6\n' +
          '  style V fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h2>What Go Took Away From C++</h2>

      <p>
        If your pointer instincts come from C or C++, the useful framing is subtraction. Go kept
        the idea and removed almost everything that made it dangerous.
      </p>

      <CodeBlock language="go" title="Things that are simply not expressible">
{`p := &x

p++           // ✗ invalid operation — NO pointer arithmetic
p = p + 1     // ✗ same
p[2]          // ✗ a pointer is not an array

// There is also no:
//   - delete / free            the GC owns lifetime
//   - ownership or borrowing    no unique_ptr, no shared_ptr, no &mut
//   - dangling pointers         returning &local is SAFE and idiomatic
//   - pointer-to-pointer juggling in ordinary code`}
      </CodeBlock>

      <p>
        The removal that surprises C++ developers most is the third one. In C++, returning the
        address of a local is a classic use-after-free. In Go it is routine, correct, and the
        compiler handles it for you:
      </p>

      <CodeBlock language="go" title="Returning a pointer to a local — correct in Go">
{`func escapes() *int {
	x := 42
	return &x   // perfectly safe
}`}
      </CodeBlock>

      <p>
        It is safe because of <strong>escape analysis</strong>. The compiler notices that{' '}
        <code>x</code> outlives its function and allocates it on the heap instead of the stack.
        You can watch it decide:
      </p>

      <CodeBlock language="bash" title="Ask the compiler what it did">
{`go build -gcflags='-m' ./...`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the relevant lines">
{`./escape.go:6:25: moved to heap: x
./main.go:8:7:   c does not escape
./main.go:10:13: p does not escape`}
      </CodeBlock>

      <p>
        <code>moved to heap: x</code> is the compiler telling you it promoted that local because
        a pointer to it escaped. The <code>does not escape</code> lines are the opposite result —
        those values stayed on the stack, which is free to allocate and free to reclaim.
      </p>

      <InfoBox variant="note" title="Stack vs heap is a decision you do not make">
        In C++ you choose: stack object or <code>new</code>. In Go you never write that choice
        down. You write <code>&amp;Thing{'{}'}</code> and the compiler decides based on whether the
        value escapes. This means a Go program's allocation profile is not obvious from reading
        it — which is exactly why <code>-gcflags='-m'</code> exists, and why reaching for it is
        the right move when profiling says you are allocating too much. Do not try to outguess it
        by hand before you have a measurement.
      </InfoBox>

      <h2>Nil Pointers Panic — They Are Not Undefined Behaviour</h2>

      <p>
        The zero value of any pointer type is <code>nil</code>. Dereferencing one is a defined,
        recoverable runtime panic — not the silent memory corruption a C++ developer braces for:
      </p>

      <CodeBlock language="go" title="Dereferencing nil">
{`var p *T
defer func() { fmt.Println("recovered:", recover()) }()
fmt.Println(p.n)`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`recovered: runtime error: invalid memory address or nil pointer dereference`}
      </CodeBlock>

      <p>
        That is a vastly better failure mode than C++'s, but it is still a crash, and it is one of
        the most common panics in production Go. The defence is not defensive nil checks
        everywhere — it is preferring value types and the zero value, which the next section is
        really about.
      </p>

      <InfoBox variant="warning" title="A nil pointer inside an interface is a different, nastier bug">
        Everything above concerns a plain <code>*T</code> that is nil. A nil pointer stored{' '}
        <em>in an interface</em> behaves differently and catches experienced people out:
        the interface is not nil even though the pointer inside it is, so{' '}
        <code>err != nil</code> is true when you expected false. That is covered in{' '}
        <a href="/go/interfaces">Interfaces Without implements</a> — it is worth re-reading that
        section once you have this lesson's model in place, because the two interact.
      </InfoBox>

      <h2>When To Actually Use One</h2>

      <p>
        Coming from Node or Java, the instinct is to reach for a pointer whenever a value feels
        "big" or you want it to be shared. That instinct over-applies. The practical rule in Go
        is narrower:
      </p>

      <CodeBlock language="text" title="The decision, in practice">
{`USE A POINTER WHEN
  1. The method must mutate the receiver.           ← the dominant reason
  2. The type must express "absent" distinctly
     from its zero value (nil vs 0 vs "").
  3. The struct is genuinely large and you have
     a profile showing copying costs you.
  4. The type contains a sync.Mutex or similar —
     copying it is a BUG (go vet catches this).

OTHERWISE PASS BY VALUE
  - small structs are cheap to copy
  - value semantics remove a whole class of
    aliasing bugs before they can happen
  - no nil to check`}
      </CodeBlock>

      <p>
        Reason 3 deserves scepticism. Copying a small struct is often <em>faster</em> than
        chasing a pointer, because the copy stays in cache and avoids an indirection. "Large"
        here means kilobytes, not a handful of fields, and the honest answer is that you should
        not act on this reason without a benchmark.
      </p>

      <InfoBox variant="danger" title="Consistency matters more than the individual choice">
        Pick one receiver kind per type and use it for every method on that type. A type with a
        mix of value and pointer receivers is confusing to read and creates real traps around
        interface satisfaction — only <code>*T</code> satisfies an interface whose method set
        includes pointer-receiver methods, so a <code>T</code> value will silently fail to
        implement it. If any method needs a pointer receiver, give them all pointer receivers.
      </InfoBox>

      <h2>The Thing Node Developers Actually Need To Unlearn</h2>

      <p>
        In JavaScript the value/reference split is invisible and arbitrary: primitives copy,
        objects and arrays do not, and nothing in the syntax tells you which you are holding. You
        learned to simply know which is which.
      </p>

      <p>
        Go removes the arbitrariness — everything copies — but it introduces something JS never
        had: <strong>structs are values</strong>. Assigning a struct copies the whole thing. That
        is the single most surprising consequence coming from Node, and it is the root of the
        value-receiver bug at the top of this lesson.
      </p>

      <CodeBlock language="go" title="Assignment copies — a JS reflex misfires here">
{`a := Counter{n: 1}
b := a        // a FULL COPY, not a second name for the same object
b.n = 99
// a.n is still 1

// In JavaScript the equivalent would have aliased:
//   const b = a;  b.n = 99;  // a.n is now 99 too`}
      </CodeBlock>

      <p>
        The exceptions — the types that still alias even though they are &quot;copied&quot; — are
        slices, maps and channels, because each is a small header containing a pointer. Copying the
        header copies the pointer, so both copies see the same backing data. Hold on to that
        sentence: it is the entire explanation for{' '}
        <a href="/go/slices">the aliasing trap</a> four lessons from here, which is the largest
        source of wrong answers in production Go. Nothing special is going on there either — you
        will simply have copied a struct that had a pointer in it.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Everything is pass-by-value, pointers included</strong> — writing through a
        pointer reaches the caller, reassigning your local copy of it does not.{' '}
        <strong>There is no pointer arithmetic and no manual lifetime management</strong>;
        returning <code>&amp;local</code> is safe because escape analysis moves it to the heap,
        and <code>-gcflags='-m'</code> will show you when that happens.{' '}
        <strong>Nil dereference is a recoverable panic, not undefined behaviour</strong> — bad,
        but defined. <strong>Default to values and reach for a pointer for a reason</strong>,
        the dominant one being that a method needs to mutate its receiver. And{' '}
        <strong>be consistent per type</strong>: mixing receiver kinds creates interface
        satisfaction traps that the compiler reports somewhere far from the cause.
      </p>

      <p>
        Next: <strong><a href="/go/structs">Structs, Methods &amp; Composition</a></strong>, which
        is where that last point stops being abstract. Every method you write picks a receiver, and
        the choice is the one this lesson just equipped you to make —{' '}
        <code>func (c Counter)</code> gets a copy and cannot mutate the original,{' '}
        <code>func (c *Counter)</code> gets the address and can. You will also see{' '}
        <code>&amp;User{'{'}...{'}'}</code> constantly from here on; it is Go&apos;s{' '}
        <code>new User(...)</code>, and it is a pointer for exactly the reasons above.
      </p>
    </LessonLayout>
  );
}
