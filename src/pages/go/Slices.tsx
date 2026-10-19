import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Slices() {
  return (
    <LessonLayout
      title="Slices, Maps & the Aliasing Trap"
      sectionId="go"
      lessonIndex={7}
      prev={{ path: '/go/errors', label: 'Errors Are Values, Not Exceptions' }}
      next={{ path: '/go/pointers', label: 'Pointers & Value Semantics' }}
    >
      <p>
        Slices and maps are the two data structures you will use in every Go file you ever write, and
        slices are the single largest source of real bugs in production Go code. Not panics —{' '}
        <em>wrong answers</em>. Data that changes behind your back, appends that vanish, writes that
        land in a different variable than the one you wrote to.
      </p>
      <p>
        The reason is specific and learnable: a slice is <strong>a value that describes a window into
        an array it does not own</strong>, and two slices can describe overlapping windows into the
        same array without either one knowing. If you are coming from JavaScript, you have never had
        to think about this, because a JS array is one object with one identity and{' '}
        <code>arr.slice(2, 5)</code> always copies. Go&apos;s <code>arr[2:5]</code> never copies.
      </p>
      <p>Where each of your languages will mislead you:</p>
      <ul>
        <li>
          <strong>Node.</strong> <code>Array.prototype.slice</code> copies, <code>push</code> mutates
          in place and always works, and there is no concept of capacity. Go&apos;s{' '}
          <code>s[2:5]</code> aliases, and <code>append</code> sometimes mutates in place and
          sometimes allocates a whole new array — and which one you got changes the behaviour of
          code that has nothing to do with the append.
        </li>
        <li>
          <strong>Java.</strong> You have <code>int[]</code> (fixed, a reference) and{' '}
          <code>ArrayList</code> (growable, a reference). Go&apos;s slice is neither: it is a{' '}
          <em>value type</em> that <em>contains</em> a reference, so passing it copies three words
          and shares the data. <code>Arrays.copyOfRange</code> copies;{' '}
          <code>subList</code> is the closest analogue to a Go reslice and has the same aliasing
          hazard, which is why most Java developers avoid it.
        </li>
        <li>
          <strong>C++.</strong> This one is the closest: a Go slice is almost exactly a{' '}
          <code>std::span</code> with a capacity, and <code>append</code> is almost{' '}
          <code>vector::push_back</code>. The thing to unlearn is that{' '}
          <code>std::vector</code> <em>owns</em> its buffer and a <code>span</code> does not own
          anything — a Go slice sits in between, non-owning in the aliasing sense but
          garbage-collected, so you get the sharing hazard without the dangling-pointer hazard.
        </li>
      </ul>

      <h2>Arrays First, Because Slices Are Built On Them</h2>
      <p>
        Go has arrays, they are rare in application code, and you need to understand them for ten
        minutes so that slices make sense. An array&apos;s <strong>length is part of its type</strong>
        {' '}(<code>[3]int</code> and <code>[4]int</code> are unrelated types) and an array is a
        plain value — assignment and function calls copy every element.
      </p>

      <CodeBlock language="go" title="An array is a value. A slice is a header.">
{`package main

import (
	"fmt"
	"unsafe"
)

func mutateArray(a [3]int) { a[0] = 999 }
func mutateSlice(s []int)  { s[0] = 999 }

func main() {
	// An ARRAY: the length is part of the type, and the whole thing is a VALUE.
	arr := [3]int{1, 2, 3}
	copyOfArr := arr
	copyOfArr[0] = 100
	mutateArray(arr)
	fmt.Printf("arr      %v   copyOfArr %v\\n", arr, copyOfArr)

	// A SLICE: a small header describing a window into an array somewhere else.
	sl := []int{1, 2, 3}
	copyOfSl := sl
	copyOfSl[0] = 100
	mutateSlice(sl)
	fmt.Printf("sl       %v  copyOfSl  %v\\n", sl, copyOfSl)

	fmt.Printf("\\nsizeof [3]int        : %5d  <- the data itself\\n", unsafe.Sizeof([3]int{}))
	fmt.Printf("sizeof [1000]int     : %5d  <- grows with the length\\n", unsafe.Sizeof([1000]int{}))
	fmt.Printf("sizeof []int (len 3) : %5d  <- ptr + len + cap\\n", unsafe.Sizeof(sl))
	fmt.Printf("sizeof []int (len 1e6): %4d  <- the SAME header, always\\n", unsafe.Sizeof(make([]int, 1_000_000)))

	// Length is part of an array's TYPE.
	fmt.Printf("\\n%T and %T are different, incompatible types\\n", [3]int{}, [4]int{})

	// Arrays are comparable; slices are not (see the structs lesson).
	fmt.Println("[3]int{1,2,3} == [3]int{1,2,3}:", [3]int{1, 2, 3} == [3]int{1, 2, 3})
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`arr      [1 2 3]   copyOfArr [100 2 3]
sl       [999 2 3]  copyOfSl  [999 2 3]

sizeof [3]int        :    24  <- the data itself
sizeof [1000]int     :  8000  <- grows with the length
sizeof []int (len 3) :    24  <- ptr + len + cap
sizeof []int (len 1e6):   24  <- the SAME header, always

[3]int and [4]int are different, incompatible types
[3]int{1,2,3} == [3]int{1,2,3}: true`}
      </CodeBlock>

      <p>
        The array survived both the copy and the function call untouched. The slice did not survive
        either. (The <code>[3]int</code> and the slice header both being 24 bytes is a coincidence of
        this example — three 8-byte ints versus three 8-byte header words. The{' '}
        <code>[1000]int</code> line is the one that makes the point: array size tracks length, header
        size never does.)
      </p>
      <p>
        Two practical notes before we leave arrays. They are <strong>comparable</strong> with{' '}
        <code>==</code> when their element type is, which is why{' '}
        <code>[32]byte</code> is a usable map key and <code>[]byte</code> is not — a real
        consideration when you want to key something by a SHA-256 digest. And they are genuinely
        useful for small fixed-size records (<code>[16]byte</code> for a UUID,{' '}
        <code>[4]float64</code> for a vector) precisely because they are values with no indirection
        and no separate allocation.
      </p>

      <h2>The Slice Header</h2>
      <p>
        Three words: a pointer to an element of a backing array, a <strong>length</strong> (how many
        elements this slice exposes) and a <strong>capacity</strong> (how many elements exist from the
        pointer to the end of the array). Everything in this lesson follows from those three numbers.
      </p>

      <FlowChart
        title="One backing array, one slice header — s := original[2:5]"
        chart={"graph LR\nsubgraph H[\"the slice header — 24 bytes, measured\"]\nP[\"ptr\"]\nL[\"len = 3\"]\nC[\"cap = 6\"]\nend\nsubgraph B[\"the backing array — one [8]int allocation\"]\ndirection LR\nA0[\"0\"] --- A1[\"10\"] --- A2[\"20\"] --- A3[\"30\"] --- A4[\"40\"] --- A5[\"50\"] --- A6[\"60\"] --- A7[\"70\"]\nend\nP ==>|\"points at index 2\"| A2\nL -.->|\"readable window ends here\"| A4\nC -.->|\"appendable room ends here\"| A7\nstyle A2 fill:#1a3329,stroke:#4ade80\nstyle A3 fill:#1a3329,stroke:#4ade80\nstyle A4 fill:#1a3329,stroke:#4ade80\nstyle A5 fill:#3d2f14,stroke:#fb923c\nstyle A6 fill:#3d2f14,stroke:#fb923c\nstyle A7 fill:#3d2f14,stroke:#fb923c"}
      />

      <p>
        The green cells are what <code>s</code> can read and write by index. The orange cells are what{' '}
        <code>append</code> can reach <em>without allocating</em> — and they belong to somebody else.
        That is the entire trap, drawn.
      </p>

      <h3>What it means to pass a slice to a function</h3>
      <p>
        The header is copied. The array is not. So the callee can change your elements but cannot
        change your length:
      </p>

      <CodeBlock language="go" title="Three behaviours from one rule">
{`package main

import "fmt"

func setFirst(s []int)  { s[0] = 999 }         // caller SEES this
func appendOne(s []int) { s = append(s, 888) } // caller does NOT see this
func appendAndReport(s []int) {
	s = append(s, 777)
	fmt.Printf("    inside: len=%d cap=%d %v\\n", len(s), cap(s), s)
}

func main() {
	a := []int{1, 2, 3}
	setFirst(a)
	fmt.Printf("after setFirst   : len=%d cap=%d %v\\n", len(a), cap(a), a)

	appendOne(a)
	fmt.Printf("after appendOne  : len=%d cap=%d %v\\n", len(a), cap(a), a)

	// Now the subtle one. Spare capacity means the append writes into the
	// SHARED array, even though the caller's len never changes.
	b := make([]int, 3, 10)
	b[0], b[1], b[2] = 1, 2, 3
	fmt.Printf("\\nb before         : len=%d cap=%d %v\\n", len(b), cap(b), b)
	appendAndReport(b)
	fmt.Printf("b after          : len=%d cap=%d %v\\n", len(b), cap(b), b)
	fmt.Printf("b[:4] reveals it : %v   <-- 777 is really in b's array\\n", b[:4])

	// And the genuinely nasty version: two appends to the same base.
	base := make([]int, 0, 4)
	base = append(base, 1, 2)
	x := append(base, 100)
	y := append(base, 200)
	fmt.Printf("\\nbase=%v  x=%v  y=%v   <-- x[2] was overwritten by y\\n", base, x, y)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`after setFirst   : len=3 cap=3 [999 2 3]
after appendOne  : len=3 cap=3 [999 2 3]

b before         : len=3 cap=10 [1 2 3]
    inside: len=4 cap=10 [1 2 3 777]
b after          : len=3 cap=10 [1 2 3]
b[:4] reveals it : [1 2 3 777]   <-- 777 is really in b's array

base=[1 2]  x=[1 2 200]  y=[1 2 200]   <-- x[2] was overwritten by y`}
      </CodeBlock>

      <p>
        Three things in that output, in increasing order of how badly they will ruin your afternoon.
      </p>
      <p>
        <strong>One:</strong> <code>setFirst</code> worked and <code>appendOne</code> did nothing.{' '}
        <code>s = append(...)</code> inside the function reassigned the callee&apos;s{' '}
        <em>copy of the header</em>. This is why every <code>append</code> in Go is written as{' '}
        <code>s = append(s, ...)</code> — the return value is the new header and discarding it is
        almost always a bug. <code>go vet</code> does catch the exact form{' '}
        <code>append(s, x)</code> with the result thrown away.
      </p>
      <p>
        <strong>Two:</strong> <code>appendAndReport</code> wrote 777 into <code>b</code>&apos;s
        backing array. From <code>b</code>&apos;s point of view nothing happened — its length is
        still 3 — but the byte is there, and <code>b[:4]</code> finds it. If any other slice shares
        that array at index 3, that other slice just changed.
      </p>
      <p>
        <strong>Three:</strong> <code>x := append(base, 100)</code> then{' '}
        <code>y := append(base, 200)</code>. Both appends found spare capacity, so both wrote to{' '}
        <code>base</code>&apos;s array at index 2, and the second one won.{' '}
        <code>x</code> is <code>[1 2 200]</code> — a value it was never assigned, from a line that
        does not mention it. Nothing here is undefined behaviour; it is all precisely specified. It
        is just not what anyone means.
      </p>

      <h2><code>append</code> and the Reallocation Rule</h2>
      <p>
        The whole of <code>append</code>&apos;s behaviour is one branch:
      </p>

      <FlowChart
        title="append — in place, or a new array?"
        chart={"graph TD\nA[\"append(s, x)\"] --> B{\"is len(s) < cap(s) ?\"}\nB -->|\"Yes — there is spare room\"| C[\"write x into the EXISTING array at index len(s)\"]\nC --> C1[\"returned header: same pointer, len+1, same cap\"]\nC --> C2[\"every other slice over that array sees the write\"]\nB -->|\"No — the array is full\"| D[\"allocate a NEW, larger array\"]\nD --> E[\"copy the len(s) existing elements into it\"]\nE --> F[\"returned header: NEW pointer, len+1, larger cap\"]\nF --> G[\"the caller's old slice still points at the OLD array<br/>and stops seeing any further changes\"]\nstyle C2 fill:#3b1a1a,stroke:#f87171\nstyle G fill:#3d2f14,stroke:#fb923c"}
      />

      <p>
        Which branch you get depends on <code>cap</code>, which depends on the history of the slice,
        which the function doing the append usually cannot see. <strong>That is why aliasing bugs are
        intermittent.</strong> Your test passes with three elements and fails in production with
        nine, because at nine the append reallocated and the two slices stopped sharing — or the
        reverse.
      </p>

      <h3>How much does it grow? Measured, not quoted</h3>
      <p>
        The folklore is &quot;capacity doubles.&quot; That has not been true since Go 1.18, and the
        real behaviour matters if you are sizing buffers. Appending one element at a time to a nil
        slice and printing every time <code>cap</code> changes:
      </p>

      <CodeBlock language="go" title="Watching cap and the backing-array address">
{`var s []int
prev := -1
for i := 0; i < 2000; i++ {
	s = append(s, i)
	if cap(s) != prev {
		fmt.Printf("%-5d %-5d %-16p %s\\n", len(s), cap(s), &s[0], ratio(prev, cap(s)))
		prev = cap(s)
	}
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`len   cap   &s[0]            growth
1     1     0x14000010130
2     2     0x14000010150    cap 1 -> 2 (x2.00)
3     4     0x1400001c140    cap 2 -> 4 (x2.00)
5     8     0x14000018280    cap 4 -> 8 (x2.00)
9     16    0x1400001e180    cap 8 -> 16 (x2.00)
17    32    0x14000120000    cap 16 -> 32 (x2.00)
33    64    0x14000122000    cap 32 -> 64 (x2.00)
65    128   0x14000124000    cap 64 -> 128 (x2.00)
129   256   0x14000126000    cap 128 -> 256 (x2.00)
257   512   0x14000128000    cap 256 -> 512 (x2.00)
513   848   0x1400012a000    cap 512 -> 848 (x1.66)
849   1280  0x14000134000    cap 848 -> 1280 (x1.51)
1281  1792  0x1400013e000    cap 1280 -> 1792 (x1.40)
1793  2560  0x1400014c000    cap 1792 -> 2560 (x1.43)`}
      </CodeBlock>

      <p>
        Doubling holds up to 256 elements, then the factor tapers toward 1.25 — and the results are
        rounded to the allocator&apos;s size classes, which is why you get 848 and 1280 rather than
        clean powers of two. The address changes at every single growth step, which is the
        reallocation happening in front of you.
      </p>
      <p>
        The operational takeaway is not the exact numbers; it is that <code>append</code> in a loop
        does <em>O(log n)</em> allocations and copies, and you can make it one by giving{' '}
        <code>make</code> a capacity. If you know the final size — and when you are building a slice
        from a database result or another slice, you do — say so:
      </p>

      <CodeBlock language="go" title="The one-line optimisation worth doing by reflex">
{`// 14 allocations and ~4000 element copies to reach 2000 elements.
var ids []string
for _, u := range users {
	ids = append(ids, u.ID)
}

// One allocation, zero copies. Note len 0, cap len(users) — NOT make([]string, len(users)),
// which would give you len(users) empty strings followed by your real data.
ids := make([]string, 0, len(users))
for _, u := range users {
	ids = append(ids, u.ID)
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="make([]T, n) versus make([]T, 0, n)">
        <p>
          This is the most common <code>make</code> mistake and it is silent.{' '}
          <code>make([]string, 5)</code> gives you a slice of <strong>length 5</strong> containing
          five zero values; appending to it produces element six.{' '}
          <code>make([]string, 0, 5)</code> gives you an empty slice with room for five. If an API
          response ever contained five empty strings followed by your real data, this was why.
        </p>
      </InfoBox>

      <h2>The Aliasing Trap</h2>
      <p>
        Now the main event. Everything above assembled into the bug you will actually ship.
      </p>

      <CodeBlock language="go" title="A window, a write, and an append that reaches into someone else's data">
{`package main

import "fmt"

func show(label string, s []int) {
	fmt.Printf("%-22s len=%d cap=%d %v\\n", label, len(s), cap(s), s)
}

func main() {
	original := []int{0, 10, 20, 30, 40, 50, 60, 70}
	show("original", original)

	// A reslice does NOT copy. It is a new header over the SAME array.
	window := original[2:5]
	show("window := orig[2:5]", window)

	// 1. A write through the window is visible through the original.
	window[0] = -999
	show("after window[0]=-999", window)
	show("  original now", original)

	// 2. The window's cap runs to the END of the backing array, so append
	//    has room and writes IN PLACE — over original[5].
	fmt.Println()
	window = append(window, -111)
	show("after append(-111)", window)
	show("  original now", original)

	// 3. Three-index slicing caps the capacity, so append must reallocate.
	fmt.Println()
	safe := original[2:5:5]
	show("safe := orig[2:5:5]", safe)
	safe = append(safe, -222)
	show("after append(-222)", safe)
	show("  original now", original)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`original               len=8 cap=8 [0 10 20 30 40 50 60 70]
window := orig[2:5]    len=3 cap=6 [20 30 40]
after window[0]=-999   len=3 cap=6 [-999 30 40]
  original now         len=8 cap=8 [0 10 -999 30 40 50 60 70]

after append(-111)     len=4 cap=6 [-999 30 40 -111]
  original now         len=8 cap=8 [0 10 -999 30 40 -111 60 70]

safe := original[2:5:5] len=3 cap=3 [-999 30 40]
after append(-222)     len=4 cap=6 [-999 30 40 -222]
  original now         len=8 cap=8 [0 10 -999 30 40 -111 60 70]`}
      </CodeBlock>

      <p>
        Read the second block. <code>append(window, -111)</code> is a statement about{' '}
        <code>window</code>. It changed <code>original[5]</code> from <code>50</code> to{' '}
        <code>-111</code>. There is no mention of <code>original</code> on that line and no pointer
        in sight. If <code>window</code> was handed to a function three packages away, the write
        happened there and the corrupted value showed up here.
      </p>
      <p>
        Then read the third block. <code>original[2:5:5]</code> — the{' '}
        <strong>three-index slice</strong>, <code>s[low:high:max]</code> — sets{' '}
        <code>cap</code> to <code>max - low</code> instead of running to the end of the array. With{' '}
        <code>cap == len</code>, <code>append</code> has no spare room, so it is{' '}
        <em>forced</em> to allocate, and <code>original</code> came through untouched. That is the
        cheapest fix available: it costs nothing until someone appends, and then it costs one
        allocation instead of one corruption.
      </p>

      <InfoBox variant="danger" title="The function-boundary version, which is how this reaches production">
        <p>
          Nobody writes the code above. What people write is this:
        </p>
        <CodeBlock language="go" title="Looks completely harmless">
{`// Returns the first n log entries. Does not mutate anything. Right?
func (l *Log) Head(n int) []Entry {
	if n > len(l.entries) {
		n = len(l.entries)
	}
	return l.entries[:n]
}`}
        </CodeBlock>
        <p>
          The returned slice has <code>cap(l.entries)</code>, not <code>n</code>. Any caller that
          appends to it writes into the <code>Log</code>&apos;s own storage, past the end of what it
          was given. Two callers appending to two separately-obtained &quot;copies&quot; will
          overwrite each other. The fix is one character class:{' '}
          <code>return l.entries[:n:n]</code> — or <code>slices.Clone(l.entries[:n])</code> if the
          caller is also allowed to mutate elements.
        </p>
        <p>
          Generalised rule: <strong>a method that returns a slice of its own internal state has
          published a writable view of that state.</strong> Decide deliberately whether you meant to.
          The same applies in reverse to a constructor that stores a slice its caller passed in.
        </p>
      </InfoBox>

      <h2><code>copy</code>, <code>slices.Clone</code>, and Deleting Elements</h2>
      <p>
        The deliberate-copy tools. <code>copy(dst, src)</code> is the builtin and it copies{' '}
        <code>min(len(dst), len(src))</code> elements — note <strong>len</strong>, not{' '}
        <code>cap</code>, which is the thing that catches people. Since Go 1.21 the{' '}
        <code>slices</code> package has the operations you actually want.
      </p>

      <CodeBlock language="go" title="copy, Clone, and two ways to delete">
{`package main

import (
	"fmt"
	"slices"
)

func main() {
	src := []int{1, 2, 3, 4, 5}

	// copy() copies min(len(dst), len(src)) elements. It does NOT grow dst.
	dst := make([]int, 3)
	n := copy(dst, src)
	fmt.Printf("copy into len-3 dst : n=%d dst=%v\\n", n, dst)

	empty := []int{}
	n = copy(empty, src)
	fmt.Printf("copy into len-0 dst : n=%d empty=%v  <-- silently copied nothing\\n", n, empty)

	// slices.Clone (Go 1.21+) is the one-liner you actually want.
	clone := slices.Clone(src)
	clone[0] = 999
	fmt.Printf("\\nsrc   %v\\nclone %v  <-- independent\\n", src, clone)

	// Deleting: the classic idiom, and what the slices package does instead.
	manual := slices.Clone(src)
	i := 2
	manual = append(manual[:i], manual[i+1:]...) // remove index 2
	fmt.Printf("\\nmanual delete idx 2 : %v\\n", manual)

	viaSlices := slices.Clone(src)
	viaSlices = slices.Delete(viaSlices, 2, 3)
	fmt.Printf("slices.Delete(2,3)  : %v\\n", viaSlices)

	// But watch what the manual idiom does to the ORIGINAL backing array.
	victim := []int{1, 2, 3, 4, 5}
	_ = append(victim[:2], victim[3:]...)
	fmt.Printf("\\nvictim after the idiom: %v  <-- the tail was shifted in place\\n", victim)
	fmt.Printf("victim[4] is a stale duplicate: %d\\n", victim[4])
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`copy into len-3 dst : n=3 dst=[1 2 3]
copy into len-0 dst : n=0 empty=[]  <-- silently copied nothing

src   [1 2 3 4 5]
clone [999 2 3 4 5]  <-- independent

manual delete idx 2 : [1 2 4 5]
slices.Delete(2,3)  : [1 2 4 5]

victim after the idiom: [1 2 4 5 5]  <-- the tail was shifted in place
victim[4] is a stale duplicate: 5`}
      </CodeBlock>

      <p>
        <code>copy</code> into a zero-length slice copies zero elements and returns 0, with no error
        and no warning. <code>make([]int, 0, 100)</code> followed by <code>copy</code> is a no-op;
        you need <code>make([]int, len(src))</code>.
      </p>
      <p>
        The two deletes produce the same visible result and leave the backing array in different
        states. <code>slices.Delete</code> zeroes the vacated tail; the hand-rolled{' '}
        <code>append(s[:i], s[i+1:]...)</code> leaves a stale duplicate:
      </p>

      <CodeBlock language="text" title="Real output — the same delete, both ways, inspecting the full array">
{`returned : len=4 cap=5 [1 2 4 5]
a (orig) : len=5 cap=5 [1 2 4 5 0]
full backing array via a[:cap(a)]: [1 2 4 5 0]

manual returned : [1 2 4 5]
b full backing  : [1 2 4 5 5]

after slices.Delete on []*big, the vacated slot is <nil>`}
      </CodeBlock>

      <p>
        For <code>[]int</code> that is cosmetic. For <code>[]*Thing</code> or{' '}
        <code>[]string</code> it is a <strong>memory leak</strong>: the stale duplicate is a live
        pointer, so the object it points to can never be collected, for as long as the slice lives.{' '}
        <code>slices.Delete</code> nils it for you. Use the <code>slices</code> package; the
        hand-rolled idiom is what you had to write before Go 1.21 and there is no longer a reason to.
      </p>

      <InfoBox variant="tip" title="The slices package, worth reading end to end once">
        <p>
          <code>slices.Clone</code>, <code>Delete</code>, <code>Insert</code>,{' '}
          <code>Contains</code>, <code>Index</code>, <code>Sort</code>,{' '}
          <code>SortFunc</code>, <code>BinarySearch</code>, <code>Equal</code>,{' '}
          <code>Reverse</code>, <code>Compact</code>, <code>Max</code>/<code>Min</code>, and{' '}
          <code>Sorted</code>/<code>Collect</code> for iterators. It landed in Go 1.21 and most Go
          tutorials predate it, so you will see a lot of hand-written loops in older code and older
          answers. <code>maps</code> is the equivalent for maps. Both are generic, which is the one
          place <a href="/go/generics">generics</a> unambiguously earned their keep.
        </p>
      </InfoBox>

      <h3>The retention leak, measured</h3>
      <p>
        One more consequence of &quot;a slice keeps its whole backing array alive&quot;: a small
        window over a large array pins the entire allocation. This one is worth seeing with real
        numbers because it is invisible in code review.
      </p>

      <CodeBlock language="go" title="Returning 8 bytes, keeping 64 MB">
{`// Reads 64 MB, returns the first 8 bytes. The obvious version.
func firstBytesLeaky() []byte {
	huge := make([]byte, 64<<20)
	for i := range huge {
		huge[i] = byte(i)
	}
	return huge[:8] // len 8, cap 67108864 — the whole array stays reachable
}

// The same thing, decoupled from the backing array.
func firstBytesClean() []byte {
	huge := make([]byte, 64<<20)
	for i := range huge {
		huge[i] = byte(i)
	}
	return slices.Clone(huge[:8])
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — compiled binary (not `go run`), runtime.GC() before each reading, go1.25.5">
{`baseline heap                  :   0.18 MB
holding leaky: len=8 cap=67108864 :  64.19 MB
after dropping leaky           :   0.19 MB
holding clean: len=8 cap=8        :   0.19 MB`}
      </CodeBlock>

      <p>
        Eight bytes of useful data, 64 MB of retained heap, no leak in any tool that counts
        allocations — the allocation is correct, it is just immortal. The classic production version
        is <code>bytes.Split</code> or a parser handing back sub-slices of a request body that is
        then stored in a cache. If you are <strong>keeping</strong> a small piece of a big buffer,{' '}
        <code>slices.Clone</code> it. If you are using it and discarding it, do not — the clone is
        pure waste.
      </p>

      <FlowChart
        title="Share it, cap it, or clone it?"
        chart={"graph TD\nA[\"I am handing a slice to, or taking one from, someone else\"] --> B{\"Will either side mutate or append to it?\"}\nB -->|No| K[\"Share it. A slice is a cheap 24-byte view — copying is waste.\"]\nB -->|Yes| C{\"Do both sides need to see each other's writes?\"}\nC -->|Yes| K2[\"Share it — but document that it is shared,<br/>and guard it if goroutines are involved\"]\nC -->|No| D{\"Is this a long-lived keep of a small window<br/>over a large array?\"}\nD -->|Yes| CL[\"slices.Clone — otherwise the whole array stays alive\"]\nD -->|No| CL2[\"slices.Clone, or s[a:b:b] to cap the capacity<br/>so append is forced to reallocate\"]\nstyle K fill:#1a3329,stroke:#4ade80\nstyle CL fill:#1a2744,stroke:#5b9cf6\nstyle CL2 fill:#1a2744,stroke:#5b9cf6"}
      />

      <h2>nil Slices and Empty Slices</h2>
      <p>
        Go has two distinct zero-ish slices and the difference matters in exactly two places. For
        everything else they are interchangeable, which is why the distinction is easy to forget and
        then surprising.
      </p>

      <CodeBlock language="go" title="Where nil and empty differ, and where they do not">
{`package main

import (
	"encoding/json"
	"fmt"
	"reflect"
)

type Resp struct {
	Items []string \`json:"items"\`
}

func main() {
	var nilSlice []string
	emptySlice := []string{}

	fmt.Printf("%-12s %-6s %-6s %-8s %v\\n", "", "len", "cap", "== nil", "%#v")
	fmt.Printf("%-12s %-6d %-6d %-8t %#v\\n", "nil slice", len(nilSlice), cap(nilSlice), nilSlice == nil, nilSlice)
	fmt.Printf("%-12s %-6d %-6d %-8t %#v\\n", "empty slice", len(emptySlice), cap(emptySlice), emptySlice == nil, emptySlice)

	// Everything read-only works identically on both.
	fmt.Println("\\nrange over nil runs 0 times, no panic:")
	for range nilSlice {
		fmt.Println("  never")
	}
	nilSlice = append(nilSlice, "appending to nil is fine")
	fmt.Println("append to nil   :", nilSlice)

	// Where it DOES matter: the JSON wire format.
	var a, b Resp
	b.Items = []string{}
	ja, _ := json.Marshal(a)
	jb, _ := json.Marshal(b)
	fmt.Printf("\\nnil   field marshals to: %s\\n", ja)
	fmt.Printf("empty field marshals to: %s\\n", jb)

	// And reflect.DeepEqual, which tests use constantly.
	fmt.Printf("\\nreflect.DeepEqual(nil, empty): %t\\n", reflect.DeepEqual([]string(nil), []string{}))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`             len    cap    == nil   %#v
nil slice    0      0      true     []string(nil)
empty slice  0      0      false    []string{}

range over nil runs 0 times, no panic:
append to nil   : [appending to nil is fine]

nil   field marshals to: {"items":null}
empty field marshals to: {"items":[]}

reflect.DeepEqual(nil, empty): false`}
      </CodeBlock>

      <p>
        <code>len</code>, <code>cap</code>, <code>range</code>, indexing within bounds, and{' '}
        <code>append</code> all behave identically. A nil slice is a perfectly good empty slice, and{' '}
        <code>append</code> to nil is the normal way to build one — <strong>you do not need to
        initialise a slice before appending to it</strong>, which is the opposite of the map rule
        below.
      </p>
      <p>The two places it bites:</p>
      <ol>
        <li>
          <strong>JSON.</strong> A nil slice marshals to <code>null</code>; an empty slice marshals
          to <code>[]</code>. Your TypeScript client that does{' '}
          <code>resp.items.map(...)</code> will throw on <code>null</code> and be fine with{' '}
          <code>[]</code>. This is a real, recurring production incident and the fix is to make your
          handlers return <code>[]T{'{}'}</code> rather than a nil slice for empty collections — or
          to set the field explicitly before encoding.
        </li>
        <li>
          <strong><code>reflect.DeepEqual</code>.</strong> It reports them as different, so a test
          comparing an expected <code>[]string{'{}'}</code> against a function that returned nil
          fails with two identical-looking <code>[]</code> values in the diff. The{' '}
          <a href="/go/structs">structs lesson</a> already flagged this;{' '}
          <code>google/go-cmp</code> with <code>cmpopts.EquateEmpty()</code> is the usual answer.
        </li>
      </ol>

      <InfoBox variant="note" title="Do not test a slice with == nil to mean &quot;empty&quot;">
        <p>
          Write <code>if len(s) == 0</code>. It is true for both cases, it is what you meant, and it
          does not change behaviour when someone upstream switches between returning nil and
          returning <code>[]T{'{}'}</code>. Reserve <code>s == nil</code> for the rare case where
          &quot;was never set&quot; is genuinely distinct from &quot;is empty&quot; — and if you need
          that distinction in an API, a <code>*[]T</code> or a separate boolean says so much more
          clearly.
        </p>
      </InfoBox>

      <h2>Maps</h2>
      <p>
        A map is a hash table, it is a <strong>reference type</strong> (unlike a slice, a map
        variable is a single pointer-sized handle, so copying a map variable gives you a second name
        for the same table), and its zero value is <code>nil</code> and not usable for writing. The
        key type must be comparable, which the{' '}
        <a href="/go/structs">structs lesson</a> covered — so a struct of comparable fields works and
        anything containing a slice does not.
      </p>

      <CodeBlock language="go" title="nil maps, comma-ok, and the counting idiom">
{`package main

import "fmt"

func main() {
	// A nil map READS fine and reports len 0. It PANICS on write.
	var nilMap map[string]int
	fmt.Printf("nil map: len=%d  nilMap[\\"x\\"]=%d  == nil: %t\\n", len(nilMap), nilMap["x"], nilMap == nil)
	for k, v := range nilMap {
		fmt.Println("never", k, v)
	}
	_, ok := nilMap["x"]
	fmt.Println("comma-ok on a nil map:", ok)

	func() {
		defer func() { fmt.Println("write to a nil map:", recover()) }()
		nilMap["x"] = 1
	}()

	// The comma-ok idiom: distinguishing "absent" from "present and zero".
	counts := map[string]int{"a": 0}
	fmt.Printf("\\ncounts[\\"a\\"]=%d  counts[\\"zz\\"]=%d   <-- indistinguishable\\n", counts["a"], counts["zz"])
	v, ok := counts["a"]
	fmt.Printf("v, ok := counts[\\"a\\"]  -> %d, %t\\n", v, ok)
	v, ok = counts["zz"]
	fmt.Printf("v, ok := counts[\\"zz\\"] -> %d, %t\\n", v, ok)

	// delete on a missing key is a no-op, not an error.
	delete(counts, "nope")
	fmt.Println("delete of a missing key is a no-op, len still", len(counts))

	// The zero value is usable for counting without any initialisation check.
	words := map[string]int{}
	for _, w := range []string{"go", "is", "go", "go"} {
		words[w]++ // reads the zero 0, adds 1, writes back
	}
	fmt.Println("\\nword counts:", words)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`nil map: len=0  nilMap["x"]=0  == nil: true
comma-ok on a nil map: false
write to a nil map: assignment to entry in nil map

counts["a"]=0  counts["zz"]=0   <-- indistinguishable
v, ok := counts["a"]  -> 0, true
v, ok := counts["zz"] -> 0, false
delete of a missing key is a no-op, len still 1

word counts: map[go:3 is:1]`}
      </CodeBlock>

      <p>
        The asymmetry is the thing to memorise: <strong>reading a nil map is fine, writing to one
        panics.</strong> This is the exact opposite of the slice rule, where appending to nil is
        normal. A struct with a map field whose constructor forgot to initialise it compiles, passes
        every read-only test, and panics on the first write — which is why{' '}
        <code>SafeCache.Put</code> in the structs lesson had that{' '}
        <code>if c.entries == nil</code> guard.
      </p>
      <p>
        The <strong>comma-ok</strong> form is the only way to tell &quot;absent&quot; from
        &quot;present with the zero value.&quot; Coming from JavaScript, note there is no{' '}
        <code>undefined</code> to lean on: <code>m[&quot;missing&quot;]</code> gives you{' '}
        <code>0</code> or <code>&quot;&quot;</code> or <code>nil</code>, not a sentinel. Coming from
        Java, this replaces <code>containsKey</code> plus <code>get</code> with one lookup.
      </p>

      <h3>Iteration order is deliberately randomized</h3>
      <p>
        This is not &quot;unspecified&quot; in the C++ sense of &quot;happens to be stable on your
        machine.&quot; The Go runtime actively randomizes the starting point of every{' '}
        <code>range</code> over a map, specifically so you cannot accidentally write code that
        depends on an order. Five passes over one unchanged map, in one process:
      </p>

      <CodeBlock language="go" title="Same map, same process, repeated range">
{`func passes(label string, m map[string]int, n int) {
	fmt.Println(label)
	for i := 0; i < n; i++ {
		var keys []string
		for k := range m {
			keys = append(keys, k)
		}
		fmt.Printf("  pass %d: %s\\n", i+1, strings.Join(keys, " "))
	}
}

func main() {
	m := map[string]int{"a": 1, "b": 2, "c": 3, "d": 4, "e": 5}
	passes("five range passes over one unchanged 5-key map:", m, 5)

	big := map[string]int{}
	for i := 0; i < 12; i++ {
		big[fmt.Sprintf("k%02d", i)] = i
	}
	passes("\\nfour passes over a 12-key map:", big, 4)

	// fmt, by contrast, SORTS map keys when printing. This fools people into
	// thinking maps have an order.
	fmt.Println("\\nfmt.Println sorts for you:", m)

	// The deterministic way, since Go 1.23: maps.Keys returns an iterator and
	// slices.Sorted collects and sorts it.
	fmt.Println("slices.Sorted(maps.Keys(m)):", slices.Sorted(maps.Keys(m)))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64 (one run; every run differs)">
{`five range passes over one unchanged 5-key map:
  pass 1: c d e a b
  pass 2: c d e a b
  pass 3: e a b c d
  pass 4: a b c d e
  pass 5: d e a b c

four passes over a 12-key map:
  pass 1: k03 k05 k06 k08 k00 k04 k07 k09 k10 k11 k01 k02
  pass 2: k07 k09 k10 k11 k01 k02 k03 k05 k06 k08 k00 k04
  pass 3: k08 k00 k04 k07 k09 k10 k11 k01 k02 k03 k05 k06
  pass 4: k10 k11 k01 k02 k03 k05 k06 k08 k00 k04 k07 k09

fmt.Println sorts for you: map[a:1 b:2 c:3 d:4 e:5]
slices.Sorted(maps.Keys(m)): [a b c d e]`}
      </CodeBlock>

      <p>
        That output is more interesting than I expected when I wrote it, and the honest reading
        matters. <strong>It is a randomized starting offset, not a shuffle.</strong> Passes 1 and 2
        of the 5-key map came out identical, and the 12-key passes are all rotations of one
        hash-determined permutation (<code>k00 k04 k07 k09 ...</code>). So:
      </p>
      <ul>
        <li>
          Two consecutive loops <em>can</em> produce the same order. A test that iterates twice and
          compares will pass locally and then fail in CI. The guarantee is &quot;do not depend on
          the order,&quot; not &quot;the order will visibly differ.&quot;
        </li>
        <li>
          The underlying permutation also changes between <em>processes</em>, because the hash seed
          is randomized per map at creation. Run the program again and even the base order differs.
        </li>
        <li>
          <code>fmt</code> sorts map keys when printing (since Go 1.12), which is the single biggest
          source of the false belief that maps are ordered. Your debug output is sorted; your{' '}
          <code>range</code> is not.
        </li>
      </ul>
      <p>
        When you need determinism — and you do, for anything that produces output a human or a
        diff will read — collect the keys and sort them. Since Go 1.23 that is one line:{' '}
        <code>slices.Sorted(maps.Keys(m))</code>, where <code>maps.Keys</code> returns an iterator
        and <code>slices.Sorted</code> drains and sorts it.
      </p>

      <InfoBox variant="info" title="Go 1.24 replaced the map implementation">
        <p>
          Maps are now Swiss tables rather than the old bucket-and-overflow design — you can see it
          in the stack traces below, which name{' '}
          <code>internal/runtime/maps/runtime_fast64_swiss.go</code>. It is faster, especially for
          large maps and misses, and it changes <em>nothing</em> you can observe from Go code except
          the specific iteration permutations and some performance numbers. It is mentioned here only
          so that when you read an older blog post describing map internals as &quot;8-element
          buckets with overflow chains,&quot; you know it describes Go 1.23 and earlier.
        </p>
      </InfoBox>

      <h3>Maps are not safe for concurrent use</h3>
      <p>
        This is the one that will actually take your service down, so it gets a demonstration rather
        than a sentence. Coming from Node, your instinct is that shared mutable state is safe because
        there is one thread; that instinct is now actively dangerous. Coming from Java, you may
        expect a corrupted-but-surviving <code>HashMap</code>; Go does not do that either.
      </p>

      <CodeBlock language="go" title="Two goroutines, one map, no mutex">
{`func main() {
	m := map[int]int{}
	var wg sync.WaitGroup

	// Two goroutines writing the same map. No mutex. This is not "usually
	// fine" — the runtime actively detects it and kills the process.
	defer func() { fmt.Println("recover() got:", recover()) }()

	for g := 0; g < 2; g++ {
		wg.Add(1)
		go func(g int) {
			defer wg.Done()
			for i := 0; i < 100_000; i++ {
				m[i] = g
			}
		}(g)
	}
	wg.Wait()
	fmt.Println("finished without complaint, len =", len(m))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64 (compiled binary exits 2)">
{`fatal error: concurrent map writes

goroutine 19 [running]:
internal/runtime/maps.fatal({0x104481469?, 0x0?})
	/usr/local/go/src/runtime/panic.go:1046 +0x20
main.main.func2(0x0)
	/.../main.go:21 +0x60
created by main.main in goroutine 1
	/.../main.go:18 +0x68`}
      </CodeBlock>

      <p>
        Note what is <em>not</em> in that output. <code>recover() got:</code> never printed. The
        header says <strong><code>fatal error</code></strong>, not <code>panic</code> — and a fatal
        error is not a panic. It does not run deferred functions, it cannot be recovered, and the
        recover middleware from the <a href="/go/errors">errors lesson</a> is powerless against it.
        The process is gone, exit code 2, mid-request.
      </p>
      <p>
        The runtime only detects this when it happens to notice; a concurrent read/write that it does
        not catch gives you silent corruption instead. <code>-race</code> catches it reliably:
      </p>

      <CodeBlock language="text" title="Real output — go run -race, go1.25.5 darwin/arm64 (abridged to one of the reported races)">
{`==================
WARNING: DATA RACE
Read at 0x00c0001a20f0 by goroutine 8:
  runtime.mapassign_fast32()
      /usr/local/go/src/internal/runtime/maps/runtime_fast32_swiss.go:195 +0x3ac
  main.main.func2()
      /.../main.go:13 +0x94

Previous write at 0x00c0001a20f0 by goroutine 7:
  runtime.mapaccess2_fast64()
      /usr/local/go/src/internal/runtime/maps/runtime_fast64_swiss.go:86 +0x25c
  main.main.func1()
      /.../main.go:12 +0x98
==================`}
      </CodeBlock>

      <p>
        The fix is a <code>sync.RWMutex</code> around the map — or <code>sync.Map</code>, which is
        narrower than it looks and is usually the wrong choice. Which one, and why{' '}
        <code>sync.Map</code> is specialised for a case you probably do not have, is the{' '}
        <a href="/go/sync">sync lesson</a>. For now: <strong>every map touched by more than one
        goroutine needs a lock, and <code>go test -race</code> belongs in your CI from the first
        commit.</strong>
      </p>
      <p>
        Slices have the same problem with less drama. Concurrent writes to <em>different</em> indices
        of one slice are safe (they are independent memory locations); concurrent{' '}
        <code>append</code> is not, because it reads and writes the shared header and may reallocate.
        There is no runtime detector for that one — only <code>-race</code>.
      </p>

      <h3>Map elements are not addressable</h3>
      <p>
        One rule carried forward from the <a href="/go/structs">structs lesson</a>, because it is a
        map rule and this is the map section. You cannot take the address of a map element, so you
        cannot mutate a struct value stored in a map in place:
      </p>

      <CodeBlock language="go" title="What a map of structs will not let you do">
{`type Counter struct{ n int }

counters := map[string]Counter{"a": {}}
counters["a"].n++      // compile error
p := &counters["a"]    // compile error`}
      </CodeBlock>

      <p>
        The reason is that a map may move its storage when it grows, so any pointer into it would
        have no guaranteed lifetime. Three ways out, in order of preference:{' '}
        <code>map[string]*Counter</code> (the usual answer — you get a stable pointer and{' '}
        <code>counters[&quot;a&quot;].n++</code> works);{' '}
        read-modify-write (<code>c := m[k]; c.n++; m[k] = c</code>); or a slice plus an index map if
        you need both stability and iteration order.
      </p>

      <InfoBox variant="warning" title="A Go 1.22 change you will meet in old code: loop variables">
        <p>
          Before Go 1.22, <code>for _, v := range s</code> declared <code>v</code>{' '}
          <strong>once</strong> for the whole loop, so every closure captured the same variable and
          saw the final value. From 1.22 it is declared per iteration. The surprising part is that
          this is gated on the <code>go</code> directive in your <code>go.mod</code>, not on the
          toolchain — the same go1.25.5 compiler produces both behaviours:
        </p>
        <CodeBlock language="go" title="main.go">
{`var fns []func()
for _, v := range []string{"a", "b", "c"} {
	fns = append(fns, func() { fmt.Print(v, " ") })
}
for _, f := range fns {
	f()
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — same toolchain (go1.25.5), two go.mod directives">
{`$ grep '^go ' go.mod   ->   go 1.25.5
closures captured: a b c

$ grep '^go ' go.mod   ->   go 1.21
closures captured: c c c`}
        </CodeBlock>
        <p>
          So when you read a pre-2024 Go tutorial telling you to write{' '}
          <code>v := v</code> at the top of every loop body, that advice was correct and is now
          unnecessary — but only if your module declares <code>go 1.22</code> or later. Check your{' '}
          <code>go.mod</code> before you trust the modern behaviour, and note that{' '}
          <em>raising</em> the directive in an old codebase silently changes the semantics of every
          closure in every loop.
        </p>
      </InfoBox>

      <h2>Carry These Forward</h2>

      <InfoBox variant="success" title="The eight that matter">
        <ul>
          <li>
            A slice is a <strong>24-byte header</strong> (ptr, len, cap) over an array it does not
            own. Passing one copies the header and shares the array.
          </li>
          <li>
            <strong>A reslice never copies.</strong> <code>s[2:5]</code> is a second view of the same
            data, and its <code>cap</code> runs to the end of the array, not to its own length.
          </li>
          <li>
            <code>append</code> writes <strong>in place when there is spare capacity</strong> and
            reallocates otherwise. Which one you get depends on history you cannot see from the call
            site, so aliasing bugs are intermittent by nature.
          </li>
          <li>
            Always <code>s = append(s, x)</code>. Always{' '}
            <code>make([]T, 0, n)</code> when you mean &quot;room for n&quot;.
          </li>
          <li>
            To break sharing deliberately: <code>s[a:b:b]</code> caps the capacity (cheap, stops
            append from reaching further) or <code>slices.Clone</code> (copies, fully independent).
            A method returning a slice of internal state has published a writable view of it.
          </li>
          <li>
            A nil slice is a usable empty slice — <code>append</code> to it freely, test with{' '}
            <code>len(s) == 0</code>. It differs from <code>[]T{'{}'}</code> only in JSON
            (<code>null</code> vs <code>[]</code>) and <code>reflect.DeepEqual</code>.
          </li>
          <li>
            A nil map <strong>reads fine and panics on write</strong> — the opposite of the slice
            rule. Use comma-ok to tell absent from zero.
          </li>
          <li>
            Map iteration order is randomized per pass <em>and</em> per process, but it is an offset
            and not a shuffle. And a concurrently-written map produces a{' '}
            <code>fatal error</code> that no <code>recover</code> can catch.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: <a href="/go/pointers">Pointers &amp; Value Semantics</a>. Slices and maps are the two
        places where Go hands you reference behaviour without an explicit pointer, so you have
        already met the hard part. That lesson covers the explicit kind — why there is no pointer
        arithmetic, why you do not have to think about lifetimes, and how the compiler decides
        between the stack and the heap without telling you.
      </p>
    </LessonLayout>
  );
}

export default Slices;
