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

function SmartPointers() {
  return (
    <LessonLayout
      title="Smart Pointers: unique_ptr, shared_ptr & weak_ptr"
      sectionId="cpp"
      lessonIndex={7}
      prev={{ path: '/cpp/raii', label: 'RAII: The Idea That Defines C++' }}
      next={{ path: '/cpp/move-semantics', label: 'Move Semantics & Perfect Forwarding' }}
    >
      <p>
        <a href="/cpp/raii">The previous lesson</a> established the mechanism: a destructor runs at a
        closing brace, deterministically, on every exit path. Smart pointers are that mechanism
        applied to one specific resource — a heap allocation. There are three of them in the standard
        library, they are not interchangeable, and choosing between them is the single most consequential
        design decision in a C++ codebase.
      </p>
      <p>
        Two things need correcting before any of it makes sense, and both are things an experienced
        Java or Node developer arrives with.
      </p>

      <InfoBox variant="danger" title="&quot;Smart pointer&quot; does not mean &quot;safe pointer&quot;">
        <p>
          It means <strong>a pointer that owns what it points at</strong>. That is the whole claim. A
          smart pointer guarantees exactly one thing: it will call the right deallocation function at
          the right time, once, on every exit path. It guarantees <em>nothing</em> about whether you
          dereference it while it is null, whether you kept a raw pointer to its contents that now
          dangles, or whether you accidentally handed the same raw pointer to two of them.
        </p>
        <p>
          Every one of those is demonstrated further down this page as a real crash or a real
          AddressSanitizer report. A <code>unique_ptr</code> you dereference after moving from it is
          a null dereference. Two <code>shared_ptr</code>s built from one <code>new</code> is a
          double free. A <code>.get()</code> that escapes its owner is a use-after-free that{' '}
          <code>-Wall -Wextra</code> does not mention. &quot;Smart&quot; is about{' '}
          <em>deallocation</em>, not about <em>access</em>.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="The reflex to break: shared_ptr is not the default">
        <p>
          <code>std::shared_ptr&lt;T&gt;</code> looks like a Java reference. It is copyable, several
          of them can point at one object, and the object dies when the last one does. That
          resemblance is why it is the first smart pointer most returning C++ developers reach for,
          and it is the wrong default.
        </p>
        <p>
          <strong><code>std::unique_ptr</code> is the default.</strong> It is 8 bytes, it compiles to
          byte-identical assembly to a hand-written <code>new</code>/<code>delete</code> pair
          (measured below), it needs one allocation, and it makes ownership visible in every
          signature it appears in. <code>shared_ptr</code> is 16 bytes, needs a second heap object,
          performs an atomic read-modify-write on every copy, and can leak in a way{' '}
          <code>unique_ptr</code> structurally cannot. It is the answer to a specific question —
          &quot;several independent owners, and I genuinely cannot say which outlives which&quot; —
          and most of the time that is not your question.
        </p>
      </InfoBox>

      <h2>The Three Types, Measured</h2>
      <p>
        Start with sizes, because they tell you most of the story. Everything in this lesson was run
        on the toolchain from <a href="/cpp/intro">the intro</a>: Apple clang 21.0.0, arm64, libc++,{' '}
        <code>-std=c++23</code>.
      </p>

      <CodeBlock language="cpp" title="sp1.cpp">
{`#include <print>
#include <memory>
#include <cstdio>

struct Widget { int a; double b; };

struct FileCloser { void operator()(std::FILE* f) const { if (f) std::fclose(f); } };

int main() {
    std::println("sizeof(Widget*)                          = {}", sizeof(Widget*));
    std::println("sizeof(std::unique_ptr<Widget>)          = {}", sizeof(std::unique_ptr<Widget>));
    std::println("sizeof(std::shared_ptr<Widget>)          = {}", sizeof(std::shared_ptr<Widget>));
    std::println("sizeof(std::weak_ptr<Widget>)            = {}", sizeof(std::weak_ptr<Widget>));
    std::println("");
    std::println("sizeof(unique_ptr<FILE, FileCloser>)     = {}",
                 sizeof(std::unique_ptr<std::FILE, FileCloser>));
    std::println("sizeof(unique_ptr<Widget, void(*)(Widget*)>) = {}",
                 sizeof(std::unique_ptr<Widget, void(*)(Widget*)>));
    std::println("");
    std::println("is_move_constructible<unique_ptr<Widget>> = {}",
                 std::is_move_constructible_v<std::unique_ptr<Widget>>);
    std::println("is_copy_constructible<unique_ptr<Widget>> = {}",
                 std::is_copy_constructible_v<std::unique_ptr<Widget>>);
    std::println("is_copy_constructible<shared_ptr<Widget>> = {}",
                 std::is_copy_constructible_v<std::shared_ptr<Widget>>);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sp1.cpp && ./sp1">
{`sizeof(Widget*)                          = 8
sizeof(std::unique_ptr<Widget>)          = 8
sizeof(std::shared_ptr<Widget>)          = 16
sizeof(std::weak_ptr<Widget>)            = 16

sizeof(unique_ptr<FILE, FileCloser>)     = 8
sizeof(unique_ptr<Widget, void(*)(Widget*)>) = 16

is_move_constructible<unique_ptr<Widget>> = true
is_copy_constructible<unique_ptr<Widget>> = false
is_copy_constructible<shared_ptr<Widget>> = true`}
      </CodeBlock>

      <p>
        Read the first two lines together: <strong><code>unique_ptr</code> is the same size as a raw
        pointer</strong>, because it <em>is</em> a raw pointer with a destructor attached. There is no
        header, no refcount, no bookkeeping. The <code>shared_ptr</code> is two pointers — one to the
        object, one to a separate heap-allocated <strong>control block</strong> — and that second
        pointer is where all of its cost comes from.
      </p>
      <p>
        The fifth line is worth noticing too. A <code>unique_ptr</code> with a{' '}
        <em>stateless</em> custom deleter is still 8 bytes, because libc++ applies the empty-base
        optimisation to the deleter. A <code>unique_ptr</code> with a <em>function pointer</em>{' '}
        deleter is 16, because now there is actual state to store. That is the only way a{' '}
        <code>unique_ptr</code> ever grows.
      </p>

      <FlowChart
        title="What each of the three actually holds"
        chart={
          'graph TD\n' +
          '  subgraph U["std::unique_ptr&lt;Widget&gt; — 8 bytes on this machine"]\n' +
          '    UP["the unique_ptr object<br/>ONE pointer, that is all"] --> UO["Widget on the heap<br/>1 allocation, 16 bytes"]\n' +
          '    UP --> UN["No refcount. No control block.<br/>Destructor is \'if non-null, delete\'."]\n' +
          '  end\n' +
          '  subgraph S["std::shared_ptr&lt;Widget&gt; — 16 bytes on this machine"]\n' +
          '    SP["shared_ptr #1<br/>TWO pointers"] --> SO["Widget on the heap"]\n' +
          '    SP --> SC["CONTROL BLOCK — a second object<br/>strong count (ATOMIC)<br/>weak count (ATOMIC)<br/>deleter + allocator, type-erased"]\n' +
          '    SP2["shared_ptr #2<br/>a copy — cost: one atomic increment"] --> SO\n' +
          '    SP2 --> SC\n' +
          '    SC -->|"strong hits 0 -&gt; destroy the Widget"| SO\n' +
          '    WP["weak_ptr — also 16 bytes"] -.->|"bumps the WEAK count only;<br/>does not keep the Widget alive"| SC\n' +
          '  end\n' +
          '  style UN fill:#1a3329,stroke:#4ade80\n' +
          '  style SC fill:#3d2f14,stroke:#fb923c\n' +
          '  style WP fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h2><code>unique_ptr</code>: The Default, And Why</h2>
      <p>
        Three claims, each of which is checkable. First, <strong>zero runtime
        overhead</strong> — not &quot;low overhead,&quot; not &quot;negligible.&quot; Here are two
        functions that do the same work, one with manual <code>new</code>/<code>delete</code> and one
        with <code>make_unique</code>:
      </p>

      <CodeBlock language="cpp" title="zc.cpp">
{`#include <memory>
struct Widget { int v; };
int use(Widget*);          // declared, not defined -- the optimiser cannot see through it

// Manual: new, use, delete. Note it LEAKS if use() throws.
int manual() {
    Widget* w = new Widget{7};
    int r = use(w);
    delete w;
    return r;
}

// RAII: make_unique. Cannot leak, on any exit path.
int owned() {
    auto w = std::make_unique<Widget>(Widget{7});
    return use(w.get());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -fno-exceptions -S zc.cpp, directives and comments stripped">
{`__Z6manualv:                              __Z5ownedv:
	stp	x20, x19, [sp, #-32]!                 stp	x20, x19, [sp, #-32]!
	stp	x29, x30, [sp, #16]                   stp	x29, x30, [sp, #16]
	add	x29, sp, #16                          add	x29, sp, #16
	mov	w0, #4                                mov	w0, #4
	bl	__Znwm                                bl	__Znwm
	mov	x19, x0                               mov	x19, x0
	mov	w8, #7                                mov	w8, #7
	str	w8, [x0]                              str	w8, [x0]
	bl	__Z3useP6Widget                       bl	__Z3useP6Widget
	mov	x20, x0                               mov	x20, x0
	mov	x0, x19                               mov	x0, x19
	bl	__ZdlPv                               bl	__ZdlPv
	mov	x0, x20                               mov	x0, x20
	ldp	x29, x30, [sp, #16]                   ldp	x29, x30, [sp, #16]
	ldp	x20, x19, [sp], #32                   ldp	x20, x19, [sp], #32
	ret                                       ret

manual instructions : 16
owned  instructions : 16
identical instruction lists: True`}
      </CodeBlock>

      <p>
        Sixteen instructions each, identical — verified by extracting both function bodies from the{' '}
        <code>-S</code> output and comparing the instruction lists in a script, not by eye.{' '}
        <code>make_unique</code> is <code>__Znwm</code> (<code>operator new</code>) and the
        destructor is <code>__ZdlPv</code> (<code>operator delete</code>), in the same places you
        would have written them. The abstraction has no representation at runtime, exactly as{' '}
        <a href="/cpp/intro">the intro lesson</a> measured for the dereference case.
      </p>
      <p>
        The difference is in the source, not the binary: <code>manual()</code> leaks if{' '}
        <code>use()</code> throws, and <code>owned()</code> cannot. You get the exception safety for
        free, in the literal sense.
      </p>

      <h3>Second claim: it is move-only, and that is the point</h3>
      <p>
        A <code>unique_ptr</code> cannot be copied. Not &quot;should not&quot; — the copy constructor
        is deleted, so the attempt is a compile error.
      </p>

      <CodeBlock language="cpp" title="ubad.cpp">
{`#include <memory>
int main() {
    auto a = std::make_unique<int>(1);
    std::unique_ptr<int> b = a;              // (1) copy construction
    std::unique_ptr<int> c;
    c = a;                                   // (2) copy assignment
    std::unique_ptr<int> d = std::move(a);   // (3) ...but a move is fine
    (void)b; (void)c; (void)d;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsyntax-only -fmessage-length=74 ubad.cpp">
{`ubad.cpp:4:26: error: call to implicitly-deleted copy constructor of
      'std::unique_ptr<int>'
    4 |     std::unique_ptr<int> b = a;        // (1) copy construction
      |                          ^   ~
.../__memory/unique_ptr.h:209:55: note:
      copy constructor is implicitly deleted because 'unique_ptr<int>' has
      a user-declared move constructor
ubad.cpp:6:7: error: object of type 'std::unique_ptr<int>' cannot be
      assigned because its copy assignment operator is implicitly deleted
    6 |     c = a;                             // (2) copy assignment
      |       ^
2 errors generated.`}
      </CodeBlock>

      <p>
        Two errors, and line 7 — the <code>std::move</code> — is not among them. That is the whole
        design: <strong>ownership is transferable but not duplicable</strong>, and the compiler
        enforces it. &quot;Who deletes this?&quot; has a single answer at every point in the program,
        and the type system is the thing keeping it single. <a href="/cpp/move-semantics">The next
        lesson</a> explains what <code>std::move</code> actually does here, because it is not what
        the name suggests.
      </p>

      <h3>Third claim: always <code>make_unique</code>, never <code>unique_ptr&lt;T&gt;(new T)</code></h3>
      <p>
        Both work. <code>make_unique</code> is shorter, mentions the type once instead of twice, and
        — the real reason — never leaves a raw <code>new</code> result unowned for even one
        expression. <code>f(std::unique_ptr&lt;A&gt;(new A), std::unique_ptr&lt;B&gt;(new B))</code>{' '}
        has an evaluation order in which <code>new B</code> throwing leaks the <code>A</code>; the{' '}
        <code>make_unique</code> spelling does not. Treat raw <code>new</code> as something you no
        longer type.
      </p>

      <h2><code>shared_ptr</code>: What It Actually Costs</h2>
      <p>
        The control block is not a conceptual device, it is a second heap allocation. Instrumenting
        global <code>operator new</code> shows exactly how many and how big:
      </p>

      <CodeBlock language="cpp" title="sp2.cpp — counting allocations by replacing operator new">
{`#include <cstdio>
#include <cstdlib>
#include <memory>
#include <new>

static int  alloc_count = 0;
static long alloc_bytes = 0;
static bool tracking    = false;

void* operator new(std::size_t n) {
    void* p = std::malloc(n);
    if (!p) throw std::bad_alloc();
    if (tracking) {
        ++alloc_count;
        alloc_bytes += static_cast<long>(n);
        std::printf("    [new  %zu bytes]\\n", n);
    }
    return p;
}
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p, std::size_t) noexcept { std::free(p); }

struct Widget { int a; double b; };   // 16 bytes

int main() {
    std::printf("sizeof(Widget) = %zu\\n\\n", sizeof(Widget));

    std::printf("unique_ptr via make_unique:\\n");
    tracking = true; alloc_count = 0; alloc_bytes = 0;
    { auto u = std::make_unique<Widget>(); (void)u; }
    tracking = false;
    std::printf("  -> %d allocation(s), %ld bytes total\\n\\n", alloc_count, alloc_bytes);

    std::printf("shared_ptr via shared_ptr<Widget>(new Widget):\\n");
    tracking = true; alloc_count = 0; alloc_bytes = 0;
    { std::shared_ptr<Widget> s(new Widget()); (void)s; }
    tracking = false;
    std::printf("  -> %d allocation(s), %ld bytes total\\n\\n", alloc_count, alloc_bytes);

    std::printf("shared_ptr via make_shared<Widget>():\\n");
    tracking = true; alloc_count = 0; alloc_bytes = 0;
    { auto s = std::make_shared<Widget>(); (void)s; }
    tracking = false;
    std::printf("  -> %d allocation(s), %ld bytes total\\n", alloc_count, alloc_bytes);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sp2.cpp && ./sp2">
{`sizeof(Widget) = 16

unique_ptr via make_unique:
    [new  16 bytes]
  -> 1 allocation(s), 16 bytes total

shared_ptr via shared_ptr<Widget>(new Widget):
    [new  16 bytes]
    [new  32 bytes]
  -> 2 allocation(s), 48 bytes total

shared_ptr via make_shared<Widget>():
    [new  40 bytes]
  -> 1 allocation(s), 40 bytes total`}
      </CodeBlock>

      <p>
        Three concrete numbers to carry away. A <code>unique_ptr</code> to a 16-byte object costs{' '}
        <strong>one allocation of 16 bytes</strong>. The same object behind{' '}
        <code>shared_ptr&lt;Widget&gt;(new Widget)</code> costs{' '}
        <strong>two allocations, 48 bytes</strong> — the object, plus a 32-byte control block on this
        implementation. <code>make_shared</code> fuses them into{' '}
        <strong>one allocation of 40 bytes</strong>.
      </p>
      <p>
        That is the <code>make_shared</code> case, and it is a real one: one trip to the allocator
        instead of two, 40 bytes instead of 48, and the object and its refcount land in the same
        cache line. It also closes the same exception-safety hole as{' '}
        <code>make_unique</code>.
      </p>

      <h3>The atomic refcount, in instructions</h3>
      <p>
        &quot;Atomic refcount&quot; is abstract until you look at what the hardware is asked to do.
        Two functions, one copying a <code>shared_ptr</code> and one copying a raw pointer:
      </p>

      <CodeBlock language="cpp" title="atomic.cpp">
{`#include <memory>
struct Widget { int v; };
std::shared_ptr<Widget> copy_it(const std::shared_ptr<Widget>& s) { return s; }
Widget*                 copy_raw(Widget* const& p)                { return p; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S atomic.cpp, arm64, directives stripped">
{`copy_it(const std::shared_ptr<Widget>&):      copy_raw(Widget* const&):
	ldr	x9, [x0, #8]                              ldr	x0, [x0]
	ldr	q0, [x0]                                  ret
	str	q0, [x8]
	cbz	x9, LBB0_2            <- null check
	add	x8, x9, #8
	mov	w9, #1
	ldadd	x9, x8, [x8]      <- ATOMIC add
LBB0_2:
	ret`}
      </CodeBlock>

      <p>
        Nine instructions versus two, including a branch and an <code>ldadd</code> — an atomic
        read-modify-write on the shared count. That instruction is not expensive in isolation; it is
        expensive because it is a synchronisation point. Two threads copying{' '}
        <code>shared_ptr</code>s to the same object contend on the same cache line, every time, even
        though neither thread is touching the object.
      </p>
      <p>
        Here is what that costs in a tight loop. Fifty million iterations of each, built{' '}
        <code>-O2</code>:
      </p>

      <CodeBlock language="cpp" title="sp3.cpp — the four loops">
{`constexpr long N = 50'000'000;
volatile int sink = 0;            // a sink the optimiser cannot see through

auto u   = std::make_unique<Widget>();
auto s   = std::make_shared<Widget>();
Widget* raw = u.get();

// 1. raw pointer: copy the pointer, dereference it
for (long i = 0; i < N; ++i) { Widget* copy = raw; sink += copy->v; }

// 2. unique_ptr by reference: no copy possible, just a dereference
for (long i = 0; i < N; ++i) { const std::unique_ptr<Widget>& ref = u; sink += ref->v; }

// 3. shared_ptr by reference: also no refcount traffic
for (long i = 0; i < N; ++i) { const std::shared_ptr<Widget>& ref = s; sink += ref->v; }

// 4. shared_ptr by COPY: an atomic increment and decrement per iteration
for (long i = 0; i < N; ++i) { std::shared_ptr<Widget> copy = s; sink += copy->v; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sp3.cpp && ./sp3, one representative run of five">
{`50000000 iterations each
raw pointer copy + deref            15.9 ms
unique_ptr by ref + deref           14.2 ms
shared_ptr by ref + deref           15.0 ms
shared_ptr COPY + deref            156.0 ms
use_count at the end = 1`}
      </CodeBlock>

      <p>
        Across five runs the first three numbers moved around between 11 ms and 20 ms — they are
        indistinguishable from each other and from the cost of the empty loop, which is the honest
        reading: <strong>holding a <code>shared_ptr</code> costs nothing; copying one
        does.</strong> The fourth number never left the 156&ndash;162 ms band. Roughly{' '}
        <strong>10&times;</strong> the loop, for the privilege of incrementing and then decrementing
        a counter.
      </p>

      <InfoBox variant="info" title="What shared_ptr's thread safety does and does not cover">
        <p>
          The atomic count buys you exactly one guarantee: <strong>the reference count itself is
          safe to manipulate from multiple threads.</strong> Two threads can copy and destroy{' '}
          <code>shared_ptr</code>s to the same object without corrupting the count or
          double-deleting.
        </p>
        <p>
          It buys you <strong>nothing</strong> about the object. Two threads writing to{' '}
          <code>*sp</code> is a data race whether the pointer is smart or not. And writing to{' '}
          <em>the same <code>shared_ptr</code> variable</em> from two threads is also a race — the
          count is atomic, the two pointers inside the <code>shared_ptr</code> are not. If you
          genuinely need that, C++20 added <code>std::atomic&lt;std::shared_ptr&lt;T&gt;&gt;</code>.
        </p>
        <p>
          If you came from Java expecting <code>shared_ptr</code> to be the thread-safe option, this
          is the correction: it is thread-safe about <em>lifetime</em>, which is the one thing the
          JVM gave you for free and the one thing it is for.
        </p>
      </InfoBox>

      <h2>The Leak <code>shared_ptr</code> Makes Possible</h2>
      <p>
        This is the argument that should actually change your default. <code>unique_ptr</code> cannot
        leak — single ownership is acyclic by construction.{' '}
        <strong><code>shared_ptr</code> can, and the shape it leaks in is the most natural data
        structure in the world: a parent that knows its child and a child that knows its
        parent.</strong>
      </p>

      <CodeBlock language="cpp" title="cyc.cpp — instrumented destructors that never fire">
{`#include <memory>
#include <print>
#include <string>

struct Child;

struct Parent {
    std::string name;
    std::shared_ptr<Child> child;
    explicit Parent(std::string n) : name(std::move(n)) { std::println("  + Parent {}", name); }
    ~Parent() { std::println("  - Parent {}", name); }
};

struct Child {
    std::string name;
    std::shared_ptr<Parent> parent;      // <-- the cycle
    explicit Child(std::string n) : name(std::move(n)) { std::println("  + Child {}", name); }
    ~Child() { std::println("  - Child {}", name); }
};

int main() {
    std::println("entering scope");
    {
        auto p = std::make_shared<Parent>("p");
        auto c = std::make_shared<Child>("c");
        p->child  = c;
        c->parent = p;                   // now each holds the other alive
        std::println("  p.use_count() = {}, c.use_count() = {}", p.use_count(), c.use_count());
    }
    std::println("left scope -- did you see two destructors?");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 -g cyc.cpp && ./cyc; echo exit=$?">
{`entering scope
  + Parent p
  + Child c
  p.use_count() = 2, c.use_count() = 2
left scope -- did you see two destructors?
exit=0`}
      </CodeBlock>

      <p>
        <strong>Two constructors, zero destructors, exit status 0.</strong> No warning at compile
        time, no crash at runtime, no message of any kind. The objects are still sitting on the heap
        when the process exits, and the only reason it does not matter here is that the process
        exited. In a long-running server that is a leak that grows with traffic.
      </p>
      <p>
        The mechanism is arithmetic. Both counts reach 2 while <code>p</code> and <code>c</code> are
        alive. At the closing brace each local <code>shared_ptr</code> decrements its count from 2 to
        1. Neither reaches 0, so neither destructor runs, so neither object releases <em>its</em>{' '}
        <code>shared_ptr</code> to the other. The two objects are now unreachable from your program
        and keeping each other alive forever.
      </p>
      <p>
        This is precisely the case a tracing garbage collector handles and reference counting cannot.
        A JVM would have collected both objects, because it asks &quot;is this reachable from a
        root?&quot; rather than &quot;does anything point at this?&quot; If your instinct is that
        &quot;<code>shared_ptr</code> is like a Java reference,&quot; this is where the analogy
        breaks and takes your heap with it.
      </p>

      <h3>The fix: <code>weak_ptr</code> on the back edge</h3>
      <p>
        A <code>weak_ptr</code> points at the control block without contributing to the strong count.
        It does not keep the object alive and it cannot be dereferenced directly — you must call{' '}
        <code>.lock()</code>, which either hands you a real <code>shared_ptr</code> or hands you an
        empty one. That forced check is the feature.
      </p>

      <CodeBlock language="cpp" title="cycfix.cpp — one word changed">
{`struct Child {
    std::string name;
    std::weak_ptr<Parent> parent;        // was shared_ptr. That is the entire fix.
    explicit Child(std::string n) : name(std::move(n)) { std::println("  + Child {}", name); }
    ~Child() { std::println("  - Child {}", name); }
};

int main() {
    std::println("entering scope");
    std::weak_ptr<Parent> watcher;
    {
        auto p = std::make_shared<Parent>("p");
        auto c = std::make_shared<Child>("c");
        p->child  = c;
        c->parent = p;                   // does NOT bump p's strong count
        watcher   = p;
        std::println("  p.use_count() = {}, c.use_count() = {}", p.use_count(), c.use_count());

        // Using a weak_ptr: lock() promotes it to a shared_ptr, or returns empty.
        if (auto up = c->parent.lock()) {
            std::println("  c->parent.lock() succeeded, parent is {}", up->name);
            std::println("  while locked, p.use_count() = {}", p.use_count());
        }
    }
    std::println("left scope");
    std::println("watcher.expired() = {}", watcher.expired());
    std::println("watcher.lock() == nullptr = {}", watcher.lock() == nullptr);
    std::println("watcher.use_count() = {}", watcher.use_count());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 -g cycfix.cpp && ./cycfix">
{`entering scope
  + Parent p
  + Child c
  p.use_count() = 1, c.use_count() = 2
  c->parent.lock() succeeded, parent is p
  while locked, p.use_count() = 2
  - Parent p
  - Child c
left scope
watcher.expired() = true
watcher.lock() == nullptr = true
watcher.use_count() = 0`}
      </CodeBlock>

      <p>
        Both destructors fire, in the right order, at the right brace. Four things in that output are
        worth naming:
      </p>
      <ul>
        <li>
          <code>p.use_count()</code> is <strong>1</strong>, not 2 — the child&apos;s{' '}
          <code>weak_ptr</code> is not counted. That broken count is what lets the chain unwind.
        </li>
        <li>
          <code>.lock()</code> temporarily raises it to <strong>2</strong>. That is the point of{' '}
          <code>lock()</code>: while you hold the returned <code>shared_ptr</code>, the object cannot
          die under you. A <code>weak_ptr</code> is a <em>ticket to attempt</em> access, not access.
        </li>
        <li>
          Destruction order is Parent then Child. The Parent dies first (count 1 &rarr; 0), its
          destructor releases its <code>shared_ptr&lt;Child&gt;</code> (2 &rarr; 1), then{' '}
          <code>c</code> goes out of scope (1 &rarr; 0).
        </li>
        <li>
          After the scope, <code>watcher.expired()</code> is <code>true</code> and{' '}
          <code>lock()</code> returns an empty <code>shared_ptr</code>. A <code>weak_ptr</code>{' '}
          survives the thing it points at and tells you so — unlike a raw pointer, which does not.
        </li>
      </ul>

      <FlowChart
        title="A cycle, and the one edge that breaks it"
        chart={
          'graph LR\n' +
          '  subgraph BROKEN["shared_ptr both ways: a leak with no leaker"]\n' +
          '    SP1["p — a shared_ptr&lt;Parent&gt;<br/>in main\'s scope"] --> PA["Parent<br/>strong count 2"]\n' +
          '    SC1["c — a shared_ptr&lt;Child&gt;<br/>in main\'s scope"] --> CH["Child<br/>strong count 2"]\n' +
          '    PA -->|"p-&gt;child, a shared_ptr"| CH\n' +
          '    CH -->|"c-&gt;parent, a shared_ptr"| PA\n' +
          '    SP1 -.->|"scope ends: 2 -&gt; 1"| X1["Parent still at 1.<br/>Destructor NEVER RUNS."]\n' +
          '    SC1 -.->|"scope ends: 2 -&gt; 1"| X2["Child still at 1.<br/>Destructor NEVER RUNS."]\n' +
          '  end\n' +
          '  subgraph FIXED["weak_ptr on the back edge"]\n' +
          '    FP1["p"] --> FPA["Parent<br/>strong count 1"]\n' +
          '    FSC1["c"] --> FCH["Child<br/>strong count 2"]\n' +
          '    FPA -->|"shared_ptr: the parent OWNS the child"| FCH\n' +
          '    FCH -.->|"weak_ptr: the child OBSERVES the parent"| FPA\n' +
          '    FP1 -.->|"scope ends: 1 -&gt; 0"| F1["Parent destroyed, which drops<br/>its shared_ptr to the Child: 2 -&gt; 1"]\n' +
          '    F1 --> F2["then c goes out of scope: 1 -&gt; 0.<br/>Child destroyed. 0 bytes leaked."]\n' +
          '  end\n' +
          '  style X1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style X2 fill:#3b1a1a,stroke:#f87171\n' +
          '  style F2 fill:#1a3329,stroke:#4ade80'
        }
      />

      <InfoBox variant="warning" title="Checked, not assumed: LeakSanitizer does not run on this machine">
        <p>
          The obvious way to catch that leak in CI is LeakSanitizer. On Linux you would build with{' '}
          <code>-fsanitize=address</code> and get a leak report at exit for free. On
          macOS/arm64 that is simply not available, and it fails in two different ways depending on
          how you ask:
        </p>
        <CodeBlock language="text" title="Real output — both attempts, arm64-apple-darwin25.6.0">
{`$ clang++ -std=c++23 -fsanitize=address -g -O1 cyc.cpp -o cyc_asan
$ ASAN_OPTIONS=detect_leaks=1 ./cyc_asan
==17555==AddressSanitizer: detect_leaks is not supported on this platform.
$ echo $?
134

$ clang++ -std=c++23 -fsanitize=leak -g -O1 cyc.cpp -o cyc_lsan
clang++: error: unsupported option '-fsanitize=leak' for target
         'arm64-apple-darwin25.6.0'`}
        </CodeBlock>
        <p>
          Note that asking for it does not degrade gracefully — the process <strong>aborts</strong>{' '}
          with exit 134 (SIGABRT) before running a line of your code. So do not copy{' '}
          <code>ASAN_OPTIONS=detect_leaks=1</code> out of a Linux CI config into a Mac developer
          script; it will look like your program crashed.
        </p>
        <p>
          The platform-native replacement is Apple&apos;s <code>leaks</code> tool, which is in{' '}
          <code>/usr/bin</code> and needs no special build. It found the cycle, and it is
          startlingly explicit about it:
        </p>
        <CodeBlock language="text" title="Real output — MallocStackLogging=1 leaks --atExit -- ./cyc (report section only)">
{`leaks Report Version: 4.0, multi-line stacks
Process 17583: 190 nodes malloced for 31 KB
Process 17583: 2 leaks for 160 total leaked bytes.

STACK OF 1 INSTANCE OF 'ROOT CYCLE: <std::__shared_ptr_emplace<Parent>>':
4   dyld                       0x1813c04e4 start + 6992
3   cyc                        0x104d985f4 main + 108  cyc.cpp:24
2   libc++abi.dylib            0x1817427e8 operator new(unsigned long) + 52
1   libsystem_malloc.dylib     0x18159b6c4 _malloc + 96
0   libsystem_malloc.dylib     0x1815b71fc _malloc_zone_malloc_instrumented_or_legacy + 152
====
    2 (160 bytes) ROOT CYCLE: <std::__shared_ptr_emplace<Parent> 0x70d02c000> [80]
       1 (80 bytes) ROOT CYCLE: <std::__shared_ptr_emplace<Child> 0x70d02c050> [80]
          CYCLE BACK TO <std::__shared_ptr_emplace<Parent> 0x70d02c000> [80]`}
        </CodeBlock>
        <p>
          It prints the words <strong><code>ROOT CYCLE</code></strong> and{' '}
          <strong><code>CYCLE BACK TO</code></strong>, names both control-block types, and points at{' '}
          <code>cyc.cpp:24</code> — the <code>make_shared</code> call. It also exits <code>1</code>{' '}
          when it finds something, so it drops straight into a CI step. Running the same tool against
          the <code>weak_ptr</code> version reports{' '}
          <code>0 leaks for 0 total leaked bytes</code>.
        </p>
        <p>
          <code>MallocStackLogging=1</code> is what buys you the allocation stack; without it you
          still get the leak count and the cycle structure, just no source line.
        </p>
      </InfoBox>

      <h2><code>make_shared</code> vs <code>shared_ptr(new T)</code> — Including The Catch</h2>
      <p>
        The single-allocation win above is real, and it is the reason <code>make_shared</code> is the
        recommendation. But fusing the object and the control block into one block has a consequence
        that is easy to miss: <strong>the object&apos;s memory cannot be released until the last{' '}
        <code>weak_ptr</code> is gone</strong>, because it is the same allocation as the control block
        that the <code>weak_ptr</code> needs.
      </p>
      <p>
        Note what that is and is not. The object&apos;s <em>destructor</em> runs on time in both
        cases. It is the <em>memory</em> that lingers. Here it is, with a 1 KB payload so the
        difference is visible:
      </p>

      <CodeBlock language="cpp" title="mkshared.cpp — tracking new and delete by address">
{`struct Big {
    char payload[1024];
    Big()  { std::printf("    Big constructed\\n"); }
    ~Big() { std::printf("    Big destroyed (destructor ran)\\n"); }
};

int main() {
    tracking = true;   // the instrumented operator new/delete from sp2.cpp

    std::printf("A. make_shared, with a weak_ptr outliving the last shared_ptr:\\n");
    {
        std::weak_ptr<Big> w;
        {
            auto s = std::make_shared<Big>();
            w = s;
        }   // last shared_ptr dies here
        std::printf("    (all shared_ptrs gone; w.expired() = %s)\\n", w.expired() ? "true" : "false");
    }       // weak_ptr dies here
    std::printf("\\n");

    std::printf("B. shared_ptr(new Big), same shape:\\n");
    {
        std::weak_ptr<Big> w;
        {
            std::shared_ptr<Big> s(new Big());
            w = s;
        }
        std::printf("    (all shared_ptrs gone; w.expired() = %s)\\n", w.expired() ? "true" : "false");
    }
    tracking = false;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 mkshared.cpp && ./mkshared">
{`A. make_shared, with a weak_ptr outliving the last shared_ptr:
      [new     1048 bytes at 0x104b8f000]
    Big constructed
    Big destroyed (destructor ran)
    (all shared_ptrs gone; w.expired() = true)
      [delete           at 0x104b8f000]

B. shared_ptr(new Big), same shape:
      [new     1024 bytes at 0x104b8f000]
    Big constructed
      [new       32 bytes at 0x104b8db20]
    Big destroyed (destructor ran)
      [delete           at 0x104b8f000]
    (all shared_ptrs gone; w.expired() = true)
      [delete           at 0x104b8db20]`}
      </CodeBlock>

      <p>
        Follow the addresses. In <strong>A</strong>, one 1048-byte block holds both the{' '}
        <code>Big</code> and the control block. The destructor runs when the last{' '}
        <code>shared_ptr</code> dies, but the <code>delete</code> happens <em>after</em> the{' '}
        <code>w.expired()</code> line — the whole 1048 bytes, payload included, waits for the{' '}
        <code>weak_ptr</code>. In <strong>B</strong>, the 1024-byte object block is released
        immediately and only the 32-byte control block waits.
      </p>
      <p>
        So the rule has an exception, and it is narrow: <strong>use{' '}
        <code>make_shared</code></strong>, unless the object is large and you expect{' '}
        <code>weak_ptr</code>s to substantially outlive the last <code>shared_ptr</code> — an
        observer registry or a cache of weak handles — in which case the two-allocation form releases
        the payload sooner. There is a second exception: <code>make_shared</code> uses{' '}
        <code>new</code> internally, so if you need a custom deleter you must use the{' '}
        <code>shared_ptr(ptr, deleter)</code> constructor. <code>make_shared</code> has no overload
        that takes one.
      </p>

      <h2>Custom Deleters</h2>
      <p>
        The payload does not have to be deleted with <code>delete</code>. Any resource with a
        close-shaped function fits — and this is where smart pointers stop being about memory and
        become a general RAII adapter for C APIs.
      </p>

      <CodeBlock language="cpp" title="deleter.cpp">
{`#include <cstdio>
#include <memory>
#include <print>

// 1. A stateless functor deleter: costs nothing, because it is an empty class
//    and unique_ptr applies the empty-base optimisation to it.
struct FileCloser {
    void operator()(std::FILE* f) const {
        if (f) { std::println("  [FileCloser: fclose]"); std::fclose(f); }
    }
};
using FilePtr = std::unique_ptr<std::FILE, FileCloser>;

FilePtr open_file(const char* path, const char* mode) {
    return FilePtr{std::fopen(path, mode)};
}

int main() {
    {
        auto f = open_file("/tmp/sp_deleter_demo.txt", "w");
        if (!f) { std::println("open failed"); return 1; }
        std::fputs("written through a unique_ptr<FILE>\\n", f.get());
        std::println("file is open, sizeof(FilePtr) = {}", sizeof(FilePtr));
    }   // fclose happens here, on every exit path, including an exception

    // 2. A lambda deleter: the closure type is part of unique_ptr's type.
    auto log_delete = [](int* p) { std::println("  [lambda deleter: {}]", *p); delete p; };
    {
        std::unique_ptr<int, decltype(log_delete)> u(new int(42), log_delete);
        std::println("lambda-deleter unique_ptr holds {}", *u);
        std::println("sizeof(that unique_ptr) = {}", sizeof(u));
    }

    // 3. shared_ptr's deleter is type-erased into the control block,
    //    so the shared_ptr itself does not grow.
    {
        std::shared_ptr<int> s(new int(7), [](int* p) {
            std::println("  [shared_ptr deleter: {}]", *p); delete p;
        });
        std::println("sizeof(shared_ptr<int> with a lambda deleter) = {}", sizeof(s));
    }

    // 4. The array specialisations. unique_ptr<T[]> calls delete[], not delete.
    {
        auto arr = std::make_unique<int[]>(4);
        arr[0] = 1; arr[3] = 4;
        std::println("make_unique<int[]>(4): arr[0]={} arr[3]={}", arr[0], arr[3]);
    }

    std::FILE* check = std::fopen("/tmp/sp_deleter_demo.txt", "r");
    char buf[64] = {};
    std::fgets(buf, sizeof buf, check);
    std::fclose(check);
    std::print("file contents: {}", buf);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 deleter.cpp && ./deleter">
{`file is open, sizeof(FilePtr) = 8
  [FileCloser: fclose]
lambda-deleter unique_ptr holds 42
sizeof(that unique_ptr) = 8
  [lambda deleter: 42]
sizeof(shared_ptr<int> with a lambda deleter) = 16
  [shared_ptr deleter: 7]
make_unique<int[]>(4): arr[0]=1 arr[3]=4
file contents: written through a unique_ptr<FILE>`}
      </CodeBlock>

      <p>
        The sizes are the interesting part. A stateless functor deleter is <strong>free</strong> —{' '}
        <code>FilePtr</code> is still 8 bytes. A capture-less lambda is also free, because its
        closure type is empty too. And <code>shared_ptr</code> stays at 16 bytes no matter what
        deleter you give it, because the deleter is type-erased into the control block it already
        allocates. That is the one place <code>shared_ptr</code>&apos;s extra machinery buys you
        something: the deleter is not part of the type, so{' '}
        <code>shared_ptr&lt;FILE&gt;</code> with an <code>fclose</code> deleter and{' '}
        <code>shared_ptr&lt;FILE&gt;</code> with a different one are the same type and
        interchangeable. With <code>unique_ptr</code> they are not.
      </p>

      <InfoBox variant="tip" title="This is the idiom for wrapping a C library">
        <p>
          Nearly every C API you will link against has a <code>create</code>/<code>destroy</code>{' '}
          pair: <code>sqlite3_open</code>/<code>sqlite3_close</code>,{' '}
          <code>SSL_new</code>/<code>SSL_free</code>, <code>curl_easy_init</code>/
          <code>curl_easy_cleanup</code>. A three-line stateless deleter plus a{' '}
          <code>using</code> alias turns each into a type that cannot be leaked and cannot be
          double-closed, with no wrapper class, no size overhead, and no runtime cost. Write the
          alias once at the top of the header and the rest of your code never mentions the destroy
          function again.
        </p>
      </InfoBox>

      <h2>Passing Smart Pointers To Functions</h2>
      <p>
        This is where most of the avoidable <code>shared_ptr</code> traffic in real codebases comes
        from. The rule is short: <strong>a smart pointer in a parameter list is a statement about
        ownership. If the function is not changing who owns the object, it should not appear.</strong>
      </p>

      <CodeBlock language="cpp" title="params.cpp">
{`#include <memory>
#include <print>

struct Widget { int v = 1; };

// 1. WRONG by default: takes a copy, bumps the atomic refcount twice
//    (up on entry, down on exit), and demands the caller own via shared_ptr.
int by_shared_value(std::shared_ptr<Widget> w) {
    std::println("  inside by_shared_value:        use_count = {}", w.use_count());
    return w->v;
}

// 2. Still too much: no refcount traffic, but the signature still demands
//    the caller's object be owned by a shared_ptr specifically.
int by_shared_ref(const std::shared_ptr<Widget>& w) {
    std::println("  inside by_shared_ref:          use_count = {}", w.use_count());
    return w->v;
}

// 3. RIGHT for a function that only READS the object.
int by_const_ref(const Widget& w) { return w.v; }

// 4. RIGHT when the object may legitimately be absent and you do not own it.
int by_raw_ptr(const Widget* w) { return w ? w->v : -1; }

// 5. Ownership transfer -- the only case that should take a unique_ptr by value.
void takes_ownership(std::unique_ptr<Widget> w) {
    std::println("  takes_ownership got {}, and will delete it on return", w->v);
}

int main() {
    auto s = std::make_shared<Widget>();
    std::println("in main, before any call:        use_count = {}", s.use_count());
    by_shared_value(s);
    by_shared_ref(s);
    std::println("in main, after both calls:       use_count = {}", s.use_count());

    // 3 and 4 work on ANY Widget, however it is owned.
    Widget stack_widget{7};
    auto u = std::make_unique<Widget>(Widget{9});
    std::println("");
    std::println("by_const_ref(*s)            = {}", by_const_ref(*s));
    std::println("by_const_ref(stack_widget)  = {}", by_const_ref(stack_widget));
    std::println("by_const_ref(*u)            = {}", by_const_ref(*u));
    std::println("by_raw_ptr(u.get())         = {}", by_raw_ptr(u.get()));
    std::println("by_raw_ptr(nullptr)         = {}", by_raw_ptr(nullptr));

    std::println("");
    takes_ownership(std::move(u));
    std::println("after the move, u is {}", u ? "non-null" : "null");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 params.cpp && ./params">
{`in main, before any call:        use_count = 1
  inside by_shared_value:        use_count = 2
  inside by_shared_ref:          use_count = 1
in main, after both calls:       use_count = 1

by_const_ref(*s)            = 1
by_const_ref(stack_widget)  = 7
by_const_ref(*u)            = 9
by_raw_ptr(u.get())         = 9
by_raw_ptr(nullptr)         = -1

  takes_ownership got 9, and will delete it on return
after the move, u is null`}
      </CodeBlock>

      <p>
        The <code>use_count = 2</code> on the second line is the measurable cost of{' '}
        <code>by_shared_value</code>: an atomic increment on the way in and an atomic decrement on
        the way out, every call, for a function that reads one <code>int</code>. The by-reference
        version shows <code>1</code> — no traffic.
      </p>
      <p>
        But the real cost of both is <em>coupling</em>, and that is the middle block. The same{' '}
        <code>by_const_ref</code> handled a <code>shared_ptr</code>&apos;s object, a stack object,
        and a <code>unique_ptr</code>&apos;s object — three completely different ownership stories,
        one signature, no conversions. The moment you write{' '}
        <code>const std::shared_ptr&lt;Widget&gt;&amp;</code> in a parameter list you have made the
        function unusable for the other two, for no benefit. A function that reads a{' '}
        <code>Widget</code> should ask for a <code>Widget</code>.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>You want to express</th>
            <th style={headStyle}>Parameter type</th>
            <th style={headStyle}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I read this object&quot;</td>
            <td style={cellStyle}><code>const T&amp;</code></td>
            <td style={cellStyle}>Works for every owner. No refcount. The default.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I modify this object&quot;</td>
            <td style={cellStyle}><code>T&amp;</code></td>
            <td style={cellStyle}>Same, and the signature says it mutates.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;This object may be absent&quot;</td>
            <td style={cellStyle}><code>T*</code> (non-owning)</td>
            <td style={cellStyle}>A legitimate raw pointer. Check it; never delete it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I take over ownership&quot;</td>
            <td style={cellStyle}><code>std::unique_ptr&lt;T&gt;</code> by value</td>
            <td style={cellStyle}>The caller must <code>std::move</code>, so the transfer is
              visible at the call site.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I become a co-owner&quot;</td>
            <td style={cellStyle}><code>std::shared_ptr&lt;T&gt;</code> by value</td>
            <td style={cellStyle}>Only if you genuinely store it — e.g. capture it in an async
              callback. The copy is the point.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I might become a co-owner&quot;</td>
            <td style={cellStyle}><code>std::shared_ptr&lt;T&gt;</code> by <code>const&amp;</code></td>
            <td style={cellStyle}>Rare and usually a smell. Caller pays the coupling, you only
              sometimes pay the copy.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I reseat the caller&apos;s pointer&quot;</td>
            <td style={cellStyle}><code>std::unique_ptr&lt;T&gt;&amp;</code></td>
            <td style={cellStyle}>The only reason to take a smart pointer by non-const reference.</td>
          </tr>
        </tbody>
      </table>

      <h2>A Raw Pointer Is Still Legitimate</h2>
      <p>
        <a href="/cpp/references">The references lesson</a> ended on this and it is worth restating
        now that the alternatives exist. <strong>Modern C++ did not abolish raw pointers. It narrowed
        their meaning to one thing: a non-owning, possibly-null view of an object someone else
        owns.</strong>
      </p>
      <p>
        <code>T*</code> in a signature is not a code smell. <code>delete</code> on a{' '}
        <code>T*</code> is. A raw pointer that never deletes is 8 bytes, has zero overhead, works
        regardless of how the object is owned, and is exactly the right tool for a back-pointer, an
        optional dependency, or a tree node&apos;s parent link where the parent provably outlives the
        child. Replacing every such pointer with a <code>shared_ptr</code> &quot;to be safe&quot; is
        how a codebase ends up with an atomic increment on its hot path and a cycle in its object
        graph.
      </p>

      <FlowChart
        title="Who owns this object?"
        chart={
          'graph TD\n' +
          '  Q["I have a heap object.<br/>Who deletes it, and when?"] --> A{"Is there exactly ONE<br/>place responsible for its life?"}\n' +
          '  A -->|"yes — and this is<br/>almost always the answer"| U["std::unique_ptr&lt;T&gt;<br/>make_unique. 8 bytes. 1 allocation.<br/>Zero runtime overhead vs a raw pointer."]\n' +
          '  A -->|"no: several independent owners,<br/>and I genuinely cannot say<br/>which outlives which"| B{"Can I restructure so one<br/>of them outlives the rest?"}\n' +
          '  B -->|"yes"| U\n' +
          '  B -->|"no — e.g. a cache handing out<br/>handles with independent lifetimes,<br/>or an object captured by<br/>async callbacks"| S["std::shared_ptr&lt;T&gt;<br/>make_shared. 16 bytes.<br/>Atomic refcount on every copy."]\n' +
          '  S --> C{"Does anything point BACK?"}\n' +
          '  C -->|"yes"| W["std::weak_ptr&lt;T&gt; on the back edge.<br/>Otherwise it is a cycle,<br/>and a cycle is a leak."]\n' +
          '  C -->|"no"| OK["Fine. Keep copies to a minimum:<br/>pass const T&amp; downstream,<br/>not const shared_ptr&lt;T&gt;&amp;."]\n' +
          '  Q --> D{"Am I only LOOKING at it?"}\n' +
          '  D -->|"yes, and it is always there"| R["const T&amp; or T&amp;<br/>— no ownership in the signature"]\n' +
          '  D -->|"yes, and it may be absent"| RP["T* — a raw, NON-OWNING pointer.<br/>Still legitimate. Still correct.<br/>It just must never delete."]\n' +
          '  style U fill:#1a3329,stroke:#4ade80\n' +
          '  style R fill:#1a3329,stroke:#4ade80\n' +
          '  style RP fill:#1a2744,stroke:#5b9cf6\n' +
          '  style S fill:#3d2f14,stroke:#fb923c\n' +
          '  style W fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h2>Three Ways A Smart Pointer Still Lets You Crash</h2>
      <p>
        Back to the opening claim, with evidence. These are not exotic; each one is something a
        reasonable developer writes.
      </p>

      <h3>1. Two owners from one <code>new</code> — a double free</h3>

      <CodeBlock language="cpp" title="notsafe1.cpp">
{`#include <cstdio>
#include <memory>
#include <print>

struct Widget { int v = 1; };

int main() {
    Widget* raw = new Widget{};

    // Two independent shared_ptrs built from the SAME raw pointer.
    // Each makes its own control block. Each thinks it is the only owner.
    std::shared_ptr<Widget> a(raw);
    std::shared_ptr<Widget> b(raw);

    std::println("a.use_count() = {}   b.use_count() = {}", a.use_count(), b.use_count());
    std::println("a.get() == b.get() = {}", a.get() == b.get());
    std::println("about to leave main -- both will delete the same object");
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 -g notsafe1.cpp && ./notsafe1; echo exit=$?">
{`a.use_count() = 1   b.use_count() = 1
a.get() == b.get() = true
about to leave main -- both will delete the same object
exit=133`}
      </CodeBlock>

      <p>
        <code>use_count() = 1</code> on both. Two <code>shared_ptr</code>s, two control blocks, two
        counts, one object — and each count is confident it is the only one. Exit 133 is 128 + 5,
        signal 5, <strong>SIGTRAP</strong>: the macOS allocator detected the second{' '}
        <code>free</code> of the same block and trapped, printing no message at all.
      </p>
      <p>
        That <code>std::fflush(stdout)</code> is load-bearing, and finding out why was instructive.
        Without it the program printed <strong>nothing</strong> — not even the three lines it had
        already executed — because <code>stdout</code> is buffered and the trap happened before any
        flush. A silent crash with an empty log is a bad hour. The real fix is not to flush; it is
        never to hand a raw <code>new</code> to anything, which <code>make_shared</code> enforces by
        not letting you.
      </p>
      <p>
        AddressSanitizer names it precisely, including both deallocation sites:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 notsafe1.cpp && ./notsafe1a">
{`==17685==ERROR: AddressSanitizer: attempting double-free on 0x6020000000d0 in thread T0:
    #0 0x000101290558 in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 0x00010089cd3c in std::__1::__shared_count::__release_shared() shared_count.h:65
    #2 0x00010089cd3c in std::__1::__shared_weak_count::__release_shared() shared_count.h:100
    #3 0x00010089cd3c in std::__1::shared_ptr<Widget>::~shared_ptr() shared_ptr.h:503
    #5 0x00010089cd3c in main notsafe1.cpp:17

0x6020000000d0 is located 0 bytes inside of 4-byte region [0x6020000000d0,0x6020000000d4)
freed by thread T0 here:
    #1 0x00010089ccd0 in std::__1::__shared_count::__release_shared() shared_count.h:65
    #5 0x00010089ccd0 in main notsafe1.cpp:17

previously allocated by thread T0 here:
    #1 0x00010089c994 in main notsafe1.cpp:7

SUMMARY: AddressSanitizer: double-free shared_count.h:65 in std::__1::__shared_count::__release_shared()
==17685==ABORTING`}
      </CodeBlock>

      <h3>2. A <code>.get()</code> that outlives its owner — a use-after-free</h3>

      <CodeBlock language="cpp" title="notsafe3.cpp">
{`#include <cstdio>
#include <memory>
#include <vector>

struct Widget { int v = 42; };

// A cache of non-owning observers -- the shape every real codebase has.
std::vector<Widget*> observers;

void register_observer(Widget* w) { observers.push_back(w); }

void setup() {
    auto owned = std::make_unique<Widget>();
    register_observer(owned.get());      // hand out a non-owning view
}                                        // owned dies here. The observer does not.

int main() {
    setup();
    std::printf("observers[0]->v = %d\\n", observers[0]->v);
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g notsafe3.cpp && ./notsafe3; echo exit=$?">
{`observers[0]->v = 2
exit=0`}
      </CodeBlock>

      <p>
        <code>2</code> instead of <code>42</code>, and exit 0. <strong>No warning
        whatsoever</strong> — not with <code>-Wall -Wextra</code>, not at <code>-O2</code>. The{' '}
        <code>unique_ptr</code> did its job perfectly: it deleted the <code>Widget</code> exactly
        once, at the right brace. It has no opinion about the pointer you copied out of it.
        AddressSanitizer does:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 notsafe3.cpp && ./notsafe3a">
{`==17843==ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000d0
  at pc 0x000100524d5c bp 0x00016f8da810 sp 0x00016f8da808
READ of size 4 at 0x6020000000d0 thread T0
    #0 0x000100524d58 in main notsafe3.cpp:19
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

0x6020000000d0 is located 0 bytes inside of 4-byte region [0x6020000000d0,0x6020000000d4)
freed by thread T0 here:
    #0 0x000100c64558 in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 0x000100524ba0 in std::__1::default_delete<Widget>::operator()(Widget*) const unique_ptr.h:75
    #2 0x000100524ba0 in std::__1::unique_ptr<Widget>::reset(Widget*) unique_ptr.h:291
    #3 0x000100524ba0 in std::__1::unique_ptr<Widget>::~unique_ptr() unique_ptr.h:257`}
      </CodeBlock>

      <p>
        Exact line, exact size, and a free stack that goes through{' '}
        <code>default_delete</code> &rarr; <code>reset</code> &rarr; <code>~unique_ptr</code>, which
        tells you immediately that the deleter you want to blame is the one that behaved correctly.
      </p>
      <p>
        The interesting detail: the <em>simpler</em> version of this bug —{' '}
        <code>return u.get();</code> straight out of a function — <em>is</em> caught statically, and
        with a slightly misleading message:{' '}
        <code>warning: address of stack memory associated with local variable &apos;u&apos;
        returned [-Wreturn-stack-address]</code>. The address is heap memory, not stack memory; clang
        is reporting on the <code>unique_ptr</code>, which is the local. It flags the right line for
        a wrong-sounding reason. One hop through a function, as above, and the warning disappears
        entirely.
      </p>

      <h3>3. The <code>weak_ptr</code> that forgot it needs a control block</h3>
      <p>
        If a class needs to hand out a <code>shared_ptr</code> to itself —{' '}
        <code>this</code> is a raw pointer and wrapping it in a new <code>shared_ptr</code> is bug #1
        above — the mechanism is <code>std::enable_shared_from_this</code>. It works by holding a{' '}
        <code>weak_ptr</code> that the first <code>shared_ptr</code> fills in. Which means it only
        works if the object is <em>already</em> owned by a <code>shared_ptr</code>:
      </p>

      <CodeBlock language="cpp" title="esft.cpp">
{`#include <memory>
#include <print>

struct Session : std::enable_shared_from_this<Session> {
    int id = 1;
    std::shared_ptr<Session> self() { return shared_from_this(); }
};

int main() {
    // Correct: the object is already owned by a shared_ptr.
    auto owned = std::make_shared<Session>();
    std::println("owned.use_count() before self() = {}", owned.use_count());
    auto again = owned->self();
    std::println("owned.use_count() after  self() = {}", owned.use_count());
    std::println("again.get() == owned.get()      = {}", again.get() == owned.get());

    // Wrong: a stack object has no control block for shared_from_this to find.
    Session on_the_stack;
    try {
        auto bad = on_the_stack.self();
        std::println("unreachable");
    } catch (const std::bad_weak_ptr& e) {
        std::println("stack object -> threw std::bad_weak_ptr: {}", e.what());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 esft.cpp && ./esft">
{`owned.use_count() before self() = 1
owned.use_count() after  self() = 2
again.get() == owned.get()      = true
stack object -> threw std::bad_weak_ptr: bad_weak_ptr`}
      </CodeBlock>

      <p>
        A <code>std::bad_weak_ptr</code> exception, which is at least a defined failure rather than
        undefined behaviour — C++17 tightened this from the UB it used to be. The practical
        consequence is a design constraint: a class using{' '}
        <code>enable_shared_from_this</code> must never be constructed on the stack or inside another
        object by value. Codebases usually enforce that with a private constructor and a static{' '}
        <code>create()</code> returning <code>shared_ptr</code>.
      </p>

      <h2>The Java and Node Translation</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>What you reach for</th>
            <th style={headStyle}>What it maps to</th>
            <th style={headStyle}>The difference that bites</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>a Java object reference</td>
            <td style={cellStyle}>mostly <code>T&amp;</code> or <code>T*</code>; sometimes{' '}
              <code>unique_ptr&lt;T&gt;</code></td>
            <td style={cellStyle}>C++ makes you say who deletes it. Java never asked.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>shared_ptr</code> &quot;because it&apos;s the safe
              one&quot;</td>
            <td style={cellStyle}>nothing in Java — it is reference <em>counting</em>, not{' '}
              tracing GC</td>
            <td style={cellStyle}>Cycles leak. The JVM collects them; a refcount cannot see
              them.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>java.lang.ref.WeakReference</code></td>
            <td style={cellStyle}><code>std::weak_ptr&lt;T&gt;</code></td>
            <td style={cellStyle}>Genuinely close. <code>.lock()</code> is{' '}
              <code>.get()</code> plus a lifetime guarantee while you hold it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>try-with-resources</code> /{' '}
              <code>AutoCloseable</code></td>
            <td style={cellStyle}>a <code>unique_ptr</code> with a custom deleter</td>
            <td style={cellStyle}>No block, no keyword, no <code>close()</code> to forget. It is
              the type.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Node closures capturing an object</td>
            <td style={cellStyle}><code>shared_ptr</code> captured by value in a lambda</td>
            <td style={cellStyle}>This is the one case where <code>shared_ptr</code> by value is
              clearly right.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>null</code> checks everywhere</td>
            <td style={cellStyle}><code>T*</code> checked, or{' '}
              <code>std::optional&lt;T&gt;</code></td>
            <td style={cellStyle}>A <code>unique_ptr</code> can be null too —{' '}
              <code>if (u)</code> works and is sometimes necessary.</td>
          </tr>
        </tbody>
      </table>

      <h2>The Residue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Instinct</th>
            <th style={headStyle}>What this lesson measured</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Smart pointer means safe pointer&quot;</td>
            <td style={cellStyle}>Three crashes on this page: SIGTRAP double free,
              heap-use-after-free with no warning, <code>bad_weak_ptr</code>. It means{' '}
              <em>owning</em>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>shared_ptr</code> is the default&quot;</td>
            <td style={cellStyle}>16 bytes vs 8, two allocations vs one (48 vs 16 bytes), an atomic
              RMW per copy, and a leak class <code>unique_ptr</code> cannot have.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>unique_ptr</code> must cost something&quot;</td>
            <td style={cellStyle}>Sixteen instructions, byte-identical to hand-written{' '}
              <code>new</code>/<code>delete</code>, verified by comparing instruction lists.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Reference counting is garbage collection&quot;</td>
            <td style={cellStyle}>Two constructors, zero destructors, exit 0. The macOS{' '}
              <code>leaks</code> tool printed <code>ROOT CYCLE</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>make_shared</code> is strictly better&quot;</td>
            <td style={cellStyle}>One allocation of 40 bytes instead of two totalling 48 — but a
              1048-byte block stayed alive until the last <code>weak_ptr</code> died.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Raw pointers are obsolete&quot;</td>
            <td style={cellStyle}>One <code>const Widget&amp;</code> served a{' '}
              <code>shared_ptr</code>, a stack object and a <code>unique_ptr</code>. Non-owning{' '}
              <code>T*</code> is the correct tool for a back-pointer.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-fsanitize=address</code> finds leaks&quot;</td>
            <td style={cellStyle}>Not here. <code>detect_leaks is not supported on this
              platform</code>, exit 134, before <code>main</code>. Use{' '}
              <code>/usr/bin/leaks</code> on macOS.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One thing to try, because reading it is not the same as watching it. Take the cycle program
          from this page, build it, and run it under{' '}
          <code>MallocStackLogging=1 leaks --atExit -- ./cyc</code>. Then change one word —{' '}
          <code>shared_ptr&lt;Parent&gt;</code> to <code>weak_ptr&lt;Parent&gt;</code> — and run it
          again. <code>2 leaks for 160 total leaked bytes</code> becomes{' '}
          <code>0 leaks for 0 total leaked bytes</code>, and two destructor lines appear that were
          never there before.
        </p>
        <p>
          The thing to carry forward is the question that replaces &quot;is this safe?&quot;. In
          C++ the useful question is <strong>&quot;who owns this, and what is the shape of the
          ownership graph?&quot;</strong> If the answer is &quot;one owner,&quot; you want{' '}
          <code>unique_ptr</code> and you are done. If the answer is &quot;a graph,&quot; you want{' '}
          <code>shared_ptr</code> plus a deliberate decision about which edges are{' '}
          <code>weak_ptr</code>. If the answer is &quot;I am just looking,&quot; you want a reference
          and no smart pointer at all.
        </p>
        <p>
          <a href="/cpp/move-semantics">The next lesson</a> is the machinery underneath{' '}
          <code>std::move(u)</code> — the thing that made the <code>unique_ptr</code> transfer in{' '}
          <code>params.cpp</code> legal and left <code>u</code> null. It is the hardest topic in this
          phase, and it starts by taking apart the most common misconception in C++:{' '}
          <code>std::move</code> does not move anything.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default SmartPointers;
