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

function MemoryModel() {
  return (
    <LessonLayout
      title="The Memory Model: Stack, Heap & Object Lifetime"
      sectionId="cpp"
      lessonIndex={5}
      prev={{ path: '/cpp/references', label: 'Values, References & Pointers' }}
      next={{ path: '/cpp/raii', label: 'RAII: The Idea That Defines C++' }}
    >
      <p>
        <a href="/cpp/references">The last lesson</a> ended on an unanswered question:{' '}
        <em>how long does an object live, and who decides?</em> Every problem in Phase 1 turned out
        to be a face of it. The copies happen because objects have lifetimes. The dangling reference
        happened because a lifetime ended while a name still pointed at the storage. The{' '}
        <code>string_view</code> and <code>span</code> caveats are lifetime caveats.
      </p>
      <p>
        This lesson answers it, and the answer is the thing that makes C++ a different kind of
        language from the three you work in. <strong>In C++, object lifetime is a property of the
        program text.</strong> You can look at a source file and say, with certainty, the line on
        which an object is born and the line on which it dies. Not &quot;becomes eligible for
        collection.&quot; Dies — destructor called, storage reclaimed, at a point you can put your
        finger on.
      </p>
      <p>
        That is a bigger adjustment than it sounds, because it is not a feature you opt into. It is
        the organising principle. Destructors, RAII, smart pointers, move semantics, the rule of
        five, <code>const</code> correctness and most of the standard library&apos;s design all fall
        out of it. If you only take one idea from Phase 2, take this one: <strong>in Java and Node
        you manage <em>references</em> and something else manages lifetime; in C++ you manage{' '}
        <em>lifetime</em> and references take care of themselves.</strong>
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same machine and toolchain as the rest of the section: <strong>Apple clang 21.0.0
          (clang-2100.3.34.2)</strong>, target <code>arm64-apple-darwin25.6.0</code>, libc++,{' '}
          <code>-std=c++23</code>. Every output block below is pasted from a real run. Where a
          number varies between runs — addresses, timings — that is said explicitly. Where
          something I expected turned out not to be true, the actual result is what you see, with a
          note.
        </p>
        <p>
          Two cross-language comparisons are also real runs: <strong>JDK 26.0.1</strong>{' '}
          (<code>26.0.1+8-34</code>) and <strong>Go 1.25.5 darwin/arm64</strong>. The stack limit
          on this machine is <code>ulimit -s</code> = <strong>8176 KB</strong>, which matters for
          the last section.
        </p>
      </InfoBox>

      <h2>Four Storage Durations</h2>
      <p>
        The standard does not talk about &quot;the stack&quot; and &quot;the heap&quot; — those are
        implementation facts. It talks about <strong>storage duration</strong>, of which there are
        four, and every object you ever create has exactly one of them. Which one is decided
        entirely by <em>how you wrote the declaration</em>.
      </p>

      <FlowChart
        title="Four storage durations, and who guarantees the destructor"
        chart={
          'graph TD\n' +
          '  Q["You declared an object.<br/>One question decides its lifetime:<br/>WHERE is the declaration?"] --> A{"which form?"}\n' +
          '  A -->|"in a function body,<br/>no keyword at all"| AUTO["AUTOMATIC storage duration<br/>— what everyone calls \'a local\'"]\n' +
          '  A -->|"at file scope, or marked static,<br/>or a static class member"| STAT["STATIC storage duration"]\n' +
          '  A -->|"marked thread_local"| TL["THREAD storage duration"]\n' +
          '  A -->|"produced by new, make_unique,<br/>or a container growing"| DYN["DYNAMIC storage duration<br/>— \'on the heap\'"]\n' +
          '  AUTO --> AUTO2["Born at the declaration.<br/>Dies at the closing brace.<br/>Lives in the current stack frame."]\n' +
          '  STAT --> STAT2["File-scope: born before main().<br/>Function-local: born on first call.<br/>Dies after main() returns,<br/>in reverse order of construction."]\n' +
          '  TL --> TL2["One instance per thread.<br/>Measured: built on first use in<br/>that thread, destroyed when<br/>the thread ends."]\n' +
          '  DYN --> DYN2["Born at new.<br/>Dies at delete — and at nothing else.<br/>No brace, no scope, no collector."]\n' +
          '  AUTO2 --> OK["The COMPILER guarantees<br/>the destructor runs."]\n' +
          '  STAT2 --> OK\n' +
          '  TL2 --> OK\n' +
          '  DYN2 --> YOU["YOU guarantee the destructor runs.<br/>This is the only row that can leak —<br/>and the next lesson deletes the row."]\n' +
          '  style OK fill:#1a3329,stroke:#4ade80\n' +
          '  style YOU fill:#3b1a1a,stroke:#f87171\n' +
          '  style AUTO2 fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        All four in one program. The technique here — a type that prints on construction and
        destruction — is the single most useful tool in this phase, and it is used throughout this
        lesson and the next. There is no guessing about lifetime when the object tells you.
      </p>

      <CodeBlock language="cpp" title="dur.cpp">
{`#include <print>
#include <string>
#include <thread>
#include <utility>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

Tracer file_scope{"STATIC   file-scope global"};        // static storage duration

thread_local Tracer per_thread{"THREAD   thread_local"}; // thread storage duration

void counted() {
    static Tracer fn_local{"STATIC   function-local static"};
    std::println("    . counted() ran");
}

int main() {
    std::println("--- main() entered ---");

    {
        Tracer automatic{"AUTO     local in a block"};
        std::println("    . inside the block");
    }

    std::println("--- calling counted() twice ---");
    counted();
    counted();

    std::println("--- touching the thread_local on the main thread ---");
    std::println("    . per_thread.name = {}", per_thread.name);

    std::println("--- spawning one thread that touches it ---");
    std::thread t{[] {
        std::println("    . worker sees per_thread.name = {}", per_thread.name);
    }};
    t.join();
    std::println("--- worker joined ---");

    Tracer* dynamic = new Tracer{"DYNAMIC  new'd, never deleted"};
    std::println("    . allocated at {}", static_cast<const void*>(dynamic));

    std::println("--- main() returning ---");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 dur.cpp && ./dur">
{`  + STATIC   file-scope global
--- main() entered ---
  + AUTO     local in a block
    . inside the block
  - AUTO     local in a block
--- calling counted() twice ---
  + STATIC   function-local static
    . counted() ran
    . counted() ran
--- touching the thread_local on the main thread ---
  + THREAD   thread_local
    . per_thread.name = THREAD   thread_local
--- spawning one thread that touches it ---
  + THREAD   thread_local
    . worker sees per_thread.name = THREAD   thread_local
  - THREAD   thread_local
--- worker joined ---
  + DYNAMIC  new'd, never deleted
    . allocated at 0x1011edb00
--- main() returning ---
  - THREAD   thread_local
  - STATIC   function-local static
  - STATIC   file-scope global`}
      </CodeBlock>

      <p>
        Six things in that output are worth naming individually, because each one is a rule.
      </p>
      <ol>
        <li>
          <strong>The static global was constructed before <code>main()</code> ran.</strong> Its{' '}
          <code>+</code> line is the first thing printed, above{' '}
          <code>--- main() entered ---</code>. Static initialisation happens before you get control.
        </li>
        <li>
          <strong>The automatic local died at the closing brace</strong>, before the next statement.
          Not at the end of <code>main</code> — at the brace.
        </li>
        <li>
          <strong>The function-local static was constructed on the first call only.</strong>{' '}
          <code>counted()</code> ran twice and there is one <code>+</code> line. This is lazy and —
          since C++11 — thread-safe initialisation, which is the whole reason the
          Meyers singleton works.
        </li>
        <li>
          <strong>The <code>thread_local</code> was constructed on first <em>use</em>, per
          thread.</strong> I expected it to be built alongside the file-scope global before{' '}
          <code>main()</code>; it was not. It appeared when the main thread first read it, and the
          worker thread built a second, independent one.
        </li>
        <li>
          <strong>The worker&apos;s <code>thread_local</code> was destroyed when the thread
          ended</strong> — the <code>-</code> line sits between the worker&apos;s message and{' '}
          <code>--- worker joined ---</code>. Thread storage duration ends with the thread, not with
          the process.
        </li>
        <li>
          <strong>There is no <code>- DYNAMIC</code> line.</strong> The <code>new</code>&apos;d
          object was never destroyed, because nothing in the language was ever going to destroy it.
          A leak in C++ is not an abstraction — it is a destructor that did not run, and with an
          instrumented type you can <em>see</em> it as a missing line.
        </li>
      </ol>

      <p>
        And the destruction order of the statics is the reverse of their construction order:{' '}
        <code>thread_local</code>, then function-local static, then file-scope global. Reverse order
        of construction is the rule everywhere in C++ that more than one thing has to be destroyed.
      </p>

      <InfoBox variant="warning" title="Static initialisation order across translation units is not defined — demonstrated">
        <p>
          Within one <code>.cpp</code> file, file-scope objects are constructed top to bottom.{' '}
          <em>Across</em> files, the order is unspecified, and &quot;unspecified&quot; here means
          &quot;decided by your linker command line.&quot; Two one-line source files, each with one
          global, linked twice in different orders:
        </p>
        <CodeBlock language="text" title="Real output — same three files, two link orders">
{`$ clang++ -std=c++23 -O2 t_a.cpp t_b.cpp t_main.cpp -o t_ab && ./t_ab
  + A (from a.cpp)
  + B (from b.cpp)
main()
  - B (from b.cpp)
  - A (from a.cpp)

$ clang++ -std=c++23 -O2 t_b.cpp t_a.cpp t_main.cpp -o t_ba && ./t_ba
  + B (from b.cpp)
  + A (from a.cpp)
main()
  - A (from a.cpp)
  - B (from b.cpp)`}
        </CodeBlock>
        <p>
          Reordering two filenames in a build command changed which global was constructed first.
          This is the <strong>static initialisation order fiasco</strong>, and it is a real class of
          production bug: a global logger that is used by another global&apos;s constructor works
          until somebody reorders the sources, then crashes at startup with no stack trace worth
          reading. It follows directly from{' '}
          <a href="/cpp/compiling">the separate-compilation model</a> — the linker has no idea what
          your constructors depend on.
        </p>
        <p>
          The fix is the function-local static from row three above, which is constructed on first
          use and therefore cannot be used before it exists:
        </p>
        <CodeBlock language="cpp" title="The standard workaround">
{`Logger& logger() {
    static Logger instance;   // built on the first call, whenever that is
    return instance;
}`}
        </CodeBlock>
        <p>
          Better still: do not have mutable global state. But if you must, that is the shape.
        </p>
      </InfoBox>

      <h2>The Stack: What A Closing Brace Actually Does</h2>
      <p>
        The stack is not a concept, it is a region of memory and a register. When you call a
        function, the stack pointer moves down by the size of that function&apos;s locals; when you
        return, it moves back up. That is the entire allocation strategy, and it is why automatic
        storage is effectively free.
      </p>
      <p>
        You can see it directly by printing the addresses of locals at four call depths:
      </p>

      <CodeBlock language="cpp" title="frames2.cpp">
{`#include <cstdio>

static const char* base = nullptr;

void report(const char* who, const void* local) {
    auto here = static_cast<const char*>(local);
    if (!base) base = here;
    std::printf("%-8s local at %p   offset from main's: %6ld bytes\\n",
                who, local, (long)(here - base));
}

void level3() { int x = 3; report("level3", &x); }
void level2() { int x = 2; report("level2", &x); level3(); }
void level1() { int x = 1; report("level1", &x); level2(); }

int main() {
    int m = 0;
    report("main", &m);
    level1();

    int  on_stack = 0;
    int* on_heap  = new int{0};
    std::printf("\\nstack int at %p\\nheap  int at %p\\n", (void*)&on_stack, (void*)on_heap);
    std::printf("they are %.2f GB apart\\n",
                (double)((char*)&on_stack - (char*)on_heap) / (1024.0 * 1024.0 * 1024.0));
    delete on_heap;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O0 frames2.cpp && ./frames2, two consecutive runs">
{`main     local at 0x16f26e838   offset from main's:      0 bytes
level1   local at 0x16f26e7ec   offset from main's:    -76 bytes
level2   local at 0x16f26e7cc   offset from main's:   -108 bytes
level3   local at 0x16f26e7ac   offset from main's:   -140 bytes

stack int at 0x16f26e834
heap  int at 0x10136db40
they are 1.72 GB apart

main     local at 0x16b1d2838   offset from main's:      0 bytes
level1   local at 0x16b1d27ec   offset from main's:    -76 bytes
level2   local at 0x16b1d27cc   offset from main's:   -108 bytes
level3   local at 0x16b1d27ac   offset from main's:   -140 bytes

stack int at 0x16b1d2834
heap  int at 0x105325b40
they are 1.59 GB apart`}
      </CodeBlock>

      <p>
        The absolute addresses change between runs — that is address-space layout randomisation, and
        it is why you should never hard-code or compare raw addresses across runs. The{' '}
        <strong>offsets do not change</strong>: <code>-76</code>, <code>-108</code>,{' '}
        <code>-140</code>. Each nested call put its local exactly <strong>32 bytes</strong> lower
        than the one before. The stack grows <em>down</em> on this platform, frames are laid out
        contiguously, and the whole stack region sits around 1.6&ndash;1.7 GB away from the heap in
        the address space.
      </p>
      <p>
        Now the part that matters. At the closing brace, the compiler emits destructor calls{' '}
        <strong>in exact reverse order of construction</strong>, and it does so for every exit path
        out of the scope.
      </p>

      <CodeBlock language="cpp" title="scope.cpp">
{`#include <print>
#include <string>
#include <utility>
#include <vector>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

struct Engine { Tracer t{"Engine member"}; };
struct Wheels { Tracer t{"Wheels member"}; };

struct Car {
    Tracer  tag{"Car's own member, declared first"};
    Engine  engine;
    Wheels  wheels;
    Car()  { std::println("  * Car body runs AFTER all members"); }
    ~Car() { std::println("  * ~Car body runs BEFORE any member dies"); }
};

int main() {
    std::println("1. three locals in one scope:");
    {
        Tracer a{"a (declared 1st)"};
        Tracer b{"b (declared 2nd)"};
        Tracer c{"c (declared 3rd)"};
        std::println("    . end of block reached");
    }

    std::println("2. a loop body is a scope, once per iteration:");
    for (int i = 0; i < 3; ++i) {
        Tracer loop{std::string{"iteration "} + std::to_string(i)};
    }

    std::println("3. members: construction order vs destruction order:");
    {
        Car car;
        std::println("    . car is fully built");
    }

    std::println("4. a vector of them owns its elements:");
    {
        std::vector<Tracer> v;
        v.reserve(2);                    // no reallocation, so no extra copies
        v.emplace_back("vector[0]");
        v.emplace_back("vector[1]");
        std::println("    . vector holds {} elements", v.size());
    }

    std::println("5. an early return still destroys everything:");
    [] {
        Tracer x{"x, before the return"};
        if (x.name.size() > 1) return;   // always taken
        Tracer y{"y, never constructed"};
    }();

    std::println("done.");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 scope.cpp && ./scope">
{`1. three locals in one scope:
  + a (declared 1st)
  + b (declared 2nd)
  + c (declared 3rd)
    . end of block reached
  - c (declared 3rd)
  - b (declared 2nd)
  - a (declared 1st)
2. a loop body is a scope, once per iteration:
  + iteration 0
  - iteration 0
  + iteration 1
  - iteration 1
  + iteration 2
  - iteration 2
3. members: construction order vs destruction order:
  + Car's own member, declared first
  + Engine member
  + Wheels member
  * Car body runs AFTER all members
    . car is fully built
  * ~Car body runs BEFORE any member dies
  - Wheels member
  - Engine member
  - Car's own member, declared first
4. a vector of them owns its elements:
  + vector[0]
  + vector[1]
    . vector holds 2 elements
  - vector[1]
  - vector[0]
5. an early return still destroys everything:
  + x, before the return
  - x, before the return
done.`}
      </CodeBlock>

      <FlowChart
        title="Into a frame and out of a scope — the measured version"
        chart={
          'graph TD\n' +
          '  subgraph DOWN["Calling IN — each frame starts lower than the last"]\n' +
          '    M["main() frame<br/>a local at 0x16f26e838"] --> L1["level1() frame<br/>offset -76 bytes"]\n' +
          '    L1 --> L2["level2() frame<br/>offset -108"]\n' +
          '    L2 --> L3["level3() frame<br/>offset -140<br/>measured: 32 bytes per frame"]\n' +
          '  end\n' +
          '  L3 -.->|"level3 reaches its closing brace"| B\n' +
          '  subgraph UP["Leaving a scope — strict reverse order, then one instruction"]\n' +
          '    B["the closing brace"] --> D3["~c runs — declared THIRD"]\n' +
          '    D3 --> D2["~b runs — declared second"]\n' +
          '    D2 --> D1["~a runs — declared FIRST"]\n' +
          '    D1 --> POP["and only then is the frame reclaimed:<br/>add sp, sp, #80<br/>— one instruction, any number of locals"]\n' +
          '  end\n' +
          '  POP --> NOTE["No free list, no search, no collector.<br/>Measured at 0.92 ns per object<br/>versus 9.7 ns for new + delete."]\n' +
          '  style D3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style POP fill:#1a3329,stroke:#4ade80\n' +
          '  style NOTE fill:#1a3329,stroke:#4ade80'
        }
      />

      <h3>Reading the five blocks</h3>
      <p>
        <strong>Block 1</strong> is the guarantee: <code>c</code>, <code>b</code>, <code>a</code>.
        Reverse declaration order, mandated by the standard, not an implementation detail. The
        reason it has to be that way is dependency — <code>c</code> may have been initialised using{' '}
        <code>a</code>, so <code>a</code> must still be alive when <code>c</code> is destroyed.
      </p>
      <p>
        <strong>Block 2</strong> is the one that catches Java and Node developers. A loop body is a
        scope. The object was constructed and destroyed three times, fully, not pooled or reused.
        Three constructor calls, three destructor calls, interleaved. That is why a{' '}
        <code>std::lock_guard</code> inside a loop locks and unlocks each iteration, and why a
        heavyweight object constructed in a hot loop is a real performance bug rather than a
        theoretical one.
      </p>
      <p>
        <strong>Block 3</strong> is the member rule, and the symmetry is exact. Members are
        constructed in <em>declaration order</em> before the constructor body runs; the destructor
        body runs <em>first</em>, then members are destroyed in reverse declaration order. So by the
        time <code>~Car</code>&apos;s body executes, every member is still fully alive and usable —
        which is what makes &quot;flush the buffer in the destructor&quot; work. Note that{' '}
        <strong>declaration order wins, not the order you write in the initialiser list</strong>;
        clang will warn with <code>-Wreorder</code> if you write them out of order, and the warning
        is worth heeding because it means the code does not do what it reads like.
      </p>
      <p>
        <strong>Block 4</strong> shows that a container destroys what it owns. <code>~vector</code>{' '}
        ran two destructors and then freed one heap buffer. This is the mechanism by which you never
        think about memory in modern C++ — the container&apos;s own lifetime, which is automatic,
        drives the lifetime of its elements.
      </p>
      <p>
        One honest caveat on that block: libc++ destroyed the elements back to front
        (<code>vector[1]</code> then <code>vector[0]</code>). The standard does not specify the
        order in which <code>vector</code> destroys its elements, so do not write code that depends
        on it. Reverse order is guaranteed for <em>locals</em> and for <em>members</em>; it is a
        courtesy for container elements.
      </p>
      <p>
        <strong>Block 5</strong> is the property that the next lesson is built on: an early{' '}
        <code>return</code> did not skip the destructor. There was no cleanup block, no{' '}
        <code>finally</code>, no <code>defer</code>. The compiler emitted the destructor call on
        that path because the path leaves the scope. Note also that <code>y</code> was never
        constructed, and therefore never destroyed — construction, not declaration, is what starts a
        lifetime.
      </p>

      <h2>The Heap: <code>new</code> and <code>delete</code>, The Raw Mechanism</h2>
      <p>
        Dynamic storage duration is the fourth row of the chart and the only one you are responsible
        for. The raw mechanism is two operators:
      </p>

      <CodeBlock language="cpp" title="The raw mechanism — and you should write almost none of this">
{`Session* s = new Session{7};     // 1. allocate storage  2. construct the object
delete s;                        // 1. run ~Session      2. free the storage

Session* arr = new Session[10];  // array form
delete[] arr;                    // array form — the [] is NOT optional`}
      </CodeBlock>

      <p>
        <code>new</code> does two separate things and so does <code>delete</code>, which is worth
        holding on to because the smart pointers in <a href="/cpp/smart-pointers">the next lesson
        but one</a> exist precisely to keep step two bound to a scope. You can watch both halves by
        replacing the global allocator — every <code>new</code> in the program, including the ones
        inside <code>std::string</code> and <code>std::vector</code>, routes through these
        functions:
      </p>

      <CodeBlock language="cpp" title="heapmech.cpp — instrumenting the global allocator">
{`#include <cstdio>
#include <cstdlib>
#include <malloc/malloc.h>
#include <new>
#include <string>
#include <vector>

// Instrument the global allocator. Every new/delete in the program -- including
// the ones inside std::string and std::vector -- comes through these.
static long n_new = 0, n_del = 0, bytes_new = 0;

void* operator new(std::size_t n) {
    ++n_new; bytes_new += static_cast<long>(n);
    void* p = std::malloc(n);
    if (!p) throw std::bad_alloc{};
    return p;
}
void* operator new[](std::size_t n) { return ::operator new(n); }
void  operator delete(void* p) noexcept            { if (p) ++n_del; std::free(p); }
void  operator delete(void* p, std::size_t) noexcept { if (p) ++n_del; std::free(p); }
void  operator delete[](void* p) noexcept          { ::operator delete(p); }
void  operator delete[](void* p, std::size_t) noexcept { ::operator delete(p); }

struct Node { int a[16]; };      // 64 bytes

#define SNAP() long s_new = n_new, s_del = n_del, s_bytes = bytes_new
#define REPORT(what) std::printf("%-34s %2ld new, %2ld delete, %5ld bytes requested\\n", \\
                                 what, n_new - s_new, n_del - s_del, bytes_new - s_bytes)

int main() {
    std::printf("warming up stdio\\n");     // so stdio's own buffer is not counted

    { SNAP(); Node* p = new Node{};    delete p;    REPORT("new Node / delete"); }
    { SNAP(); Node* p = new Node[10]; delete[] p;  REPORT("new Node[10] / delete[]"); }
    { SNAP(); { std::vector<int> v(16); } REPORT("std::vector<int>(16)"); }
    { SNAP();
      std::size_t cap = 0;
      { std::vector<int> v;
        for (int i = 0; i < 100; ++i) v.push_back(i);
        cap = v.capacity(); }
      REPORT("100x push_back from empty");
      std::printf("   (it ended at capacity %zu)\\n", cap); }
    { SNAP(); { std::string s = "short"; } REPORT("std::string \\"short\\" (SSO)"); }
    { SNAP(); { std::string s = "a string too long for the small-string buffer"; }
      REPORT("std::string, 44 chars"); }

    std::printf("\\nwhat the allocator actually hands back:\\n");
    for (std::size_t want : {1u, 8u, 24u, 64u, 65u, 1000u}) {
        void* p = ::operator new(want);
        std::printf("  new(%4zu)  ->  malloc_size = %4zu bytes\\n", want, malloc_size(p));
        ::operator delete(p);
    }

    std::printf("\\nprogram totals: %ld new, %ld delete, %ld bytes requested\\n",
                n_new, n_del, bytes_new);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O0 heapmech.cpp && ./heapmech0">
{`warming up stdio
new Node / delete                   1 new,  1 delete,    64 bytes requested
new Node[10] / delete[]             1 new,  1 delete,   640 bytes requested
std::vector<int>(16)                1 new,  1 delete,    64 bytes requested
100x push_back from empty           8 new,  8 delete,  1020 bytes requested
   (it ended at capacity 128)
std::string "short" (SSO)           0 new,  0 delete,     0 bytes requested
std::string, 44 chars               1 new,  1 delete,    48 bytes requested

what the allocator actually hands back:
  new(   1)  ->  malloc_size =   16 bytes
  new(   8)  ->  malloc_size =   16 bytes
  new(  24)  ->  malloc_size =   32 bytes
  new(  64)  ->  malloc_size =   64 bytes
  new(  65)  ->  malloc_size =   80 bytes
  new(1000)  ->  malloc_size = 1024 bytes

program totals: 18 new, 18 delete, 2998 bytes requested`}
      </CodeBlock>

      <p>
        Four readings from that, one of which I did not expect.
      </p>
      <p>
        <strong>Containers are thin.</strong> A <code>std::vector&lt;int&gt;(16)</code> is one
        allocation of exactly 64 bytes — 16 <code>int</code>s, no per-element overhead, no object
        headers. Compare a Java <code>ArrayList&lt;Integer&gt;</code> of 16 elements: one array
        object plus sixteen boxed <code>Integer</code> objects, each with a header. This is the
        concrete content of the layout claim in <a href="/cpp/intro">the intro</a>.
      </p>
      <p>
        <strong>Geometric growth is visible and expensive.</strong> 100 <code>push_back</code> calls
        from empty cost <strong>eight</strong> allocations and <strong>1020 bytes requested</strong>{' '}
        for 400 bytes of payload, ending at capacity 128. libc++ doubles: 1, 2, 4, 8, 16, 32, 64,
        128, and 1 + 2 + 4 + ... + 128 = 255 <code>int</code>s = 1020 bytes. If you know the size,{' '}
        <code>reserve()</code> turns eight allocations into one.
      </p>
      <p>
        <strong>The small-string optimisation is real.</strong> <code>std::string s =
        &quot;short&quot;</code> allocated <em>nothing</em> — the characters live inside the string
        object. The 44-character one requested 48 bytes (45 including the terminator, rounded up).
        This is why <a href="/cpp/intro">the intro</a> had to use deliberately long names to prove
        anything about heap buffers.
      </p>
      <p>
        <strong>And your allocation request is not what you get.</strong>{' '}
        <code>new(1)</code> yielded a 16-byte block; <code>new(65)</code> yielded 80. macOS&apos;s
        allocator rounds to size classes, so a million one-byte allocations do not cost a megabyte,
        they cost sixteen. Allocation overhead is a thing you can measure rather than guess about.
      </p>

      <InfoBox variant="info" title="The result I did not expect: at -O2, two of those rows are zero">
        <p>
          The identical program built at <code>-O2</code> reports this for the first two rows:
        </p>
        <CodeBlock language="text" title="Real output — the same source at -O2 (first three rows)">
{`new Node / delete                   0 new,  0 delete,     0 bytes requested
new Node[10] / delete[]             0 new,  0 delete,     0 bytes requested
std::vector<int>(16)                1 new,  1 delete,    64 bytes requested`}
        </CodeBlock>
        <p>
          <strong>Zero allocations</strong> for <code>new Node{'{}'} ... delete p</code>. The
          optimiser removed them. This is not a bug and it is not clang being clever beyond the
          rules: since C++14 the standard explicitly permits an implementation to omit a call to a
          replaceable global allocation function when the allocated object&apos;s lifetime is
          strictly contained within another and the pointer never escapes. Clang implements that,
          and it holds even though I replaced <code>operator new</code> myself.
        </p>
        <p>
          The practical consequences are two. First, <strong>any benchmark that allocates and frees
          without the pointer escaping may be measuring nothing</strong> — the numbers in the next
          section needed an explicit optimisation barrier for exactly this reason. Second, it is
          evidence for the general rule in this section: trust what you measured on the build you
          actually ship, not what you reasoned about from the source.
        </p>
      </InfoBox>

      <h2>What The Stack And The Heap Actually Cost</h2>
      <p>
        &quot;The stack is faster&quot; gets repeated without a number attached. Here is the number
        on this machine. The benchmark constructs a 64-byte object five million times, once per
        iteration, with an <code>asm</code> barrier so the object genuinely has to exist, and takes
        the best of seven trials:
      </p>

      <CodeBlock language="cpp" title="cost.cpp — the two loops being timed (the timing harness is omitted)">
{`// Stop the optimiser deleting work we are trying to time.
template <class T>
static inline void escape(T* p) { asm volatile("" : : "r,m"(p) : "memory"); }

struct Node { int a[16]; };          // 64 bytes

static long stack_node(int n) {
    long sum = 0;
    for (int i = 0; i < n; ++i) {
        Node node{};
        node.a[0] = i;
        escape(&node);
        sum += node.a[0];
    }
    return sum;
}

static long heap_node(int n) {
    long sum = 0;
    for (int i = 0; i < n; ++i) {
        Node* node = new Node{};
        node->a[0] = i;
        escape(node);
        sum += node->a[0];
        delete node;
    }
    return sum;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cost.cpp && ./cost, three consecutive runs">
{`sizeof(Node) = 64 bytes, 5000000 iterations, best of 7

Node on the stack              1.230 ns/op
new Node + delete              9.888 ns/op     8.0x
std::array<int,16>             0.920 ns/op
std::vector<int>(16)           9.839 ns/op    10.7x

Node on the stack              0.920 ns/op
new Node + delete              9.659 ns/op    10.5x
std::array<int,16>             0.920 ns/op
std::vector<int>(16)           9.653 ns/op    10.5x

Node on the stack              1.117 ns/op
new Node + delete              9.521 ns/op     8.5x
std::array<int,16>             0.920 ns/op
std::vector<int>(16)           9.607 ns/op    10.4x`}
      </CodeBlock>

      <p>
        Round numbers: <strong>about 1 nanosecond on the stack, about 10 nanoseconds on the
        heap</strong> — call it an order of magnitude, repeatably, for an object small enough that
        neither choice is absurd. The <code>std::array</code> versus <code>std::vector</code> pair
        is the same story told in library terms, and it is the more useful form of the result,
        because that is a decision you make all day:{' '}
        <code>std::array&lt;int,16&gt;</code> is a stack object and{' '}
        <code>std::vector&lt;int&gt;(16)</code> is a heap allocation wearing a value-shaped
        interface.
      </p>
      <p>
        The reason for the gap is visible in the generated code. Here are the two shapes with the
        object forced to really exist by passing it to a function defined in another translation
        unit:
      </p>

      <CodeBlock language="cpp" title="costasm2.cpp">
{`struct Node { int a[16]; };
void use(Node*);                 // defined elsewhere: the object must really exist

int stack_one(int i) {
    Node n{};
    n.a[0] = i;
    use(&n);
    return n.a[0];
}

int heap_one(int i) {
    Node* n = new Node{};
    n->a[0] = i;
    use(n);
    int r = n->a[0];
    delete n;
    return r;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S, arm64, directives stripped">
{`stack_one(int):                      heap_one(int):
	sub	sp, sp, #80                      stp	x20, x19, [sp, #-32]!
	stp	x29, x30, [sp, #64]              stp	x29, x30, [sp, #16]
	add	x29, sp, #64                     add	x29, sp, #16
	movi.2d	v0, #0000000000000000            mov	x19, x0
	str	q0, [sp, #48]                    mov	w0, #64
	stur	q0, [sp, #36]                    bl	__Znwm          <- operator new
	stur	q0, [sp, #20]                    mov	x20, x0
	stur	q0, [sp, #4]                     movi.2d	v0, #0000000000000000
	str	w0, [sp]                         stp	q0, q0, [x0]
	mov	x0, sp                           stp	q0, q0, [x0, #32]
	bl	__Z3useP4Node                    str	w19, [x0]
	ldr	w0, [sp]                         bl	__Z3useP4Node
	ldp	x29, x30, [sp, #64]              ldr	w19, [x20]
	add	sp, sp, #80                      mov	x0, x20
	ret                                  bl	__ZdlPv         <- operator delete
	                                     mov	x0, x19
	                                     ldp	x29, x30, [sp, #16]
	                                     ldp	x20, x19, [sp], #32
	                                     ret`}
      </CodeBlock>

      <p>
        The entire stack allocation is <code>sub sp, sp, #80</code>, and the entire deallocation is{' '}
        <code>add sp, sp, #80</code>. One instruction each, and the <code>80</code> covers{' '}
        <em>all</em> the locals in the function at once — declaring ten more objects would change
        the constant, not the instruction count. The heap version has to call{' '}
        <code>__Znwm</code> and <code>__ZdlPv</code> — which <code>c++filt</code> demangles as{' '}
        <code>operator new(unsigned long)</code> and <code>operator delete(void*)</code> — and those
        are real function calls into libc++ that walk the allocator&apos;s size-class free lists and
        can take a lock.
      </p>

      <FlowChart
        title="Stack or heap: the decision, with the measured consequences"
        chart={
          'graph TD\n' +
          '  Q["I need an object.<br/>Stack or heap?"] --> A{"Must it outlive<br/>the scope that makes it?"}\n' +
          '  A -->|"no — it is used here<br/>and then finished with"| S["STACK. Just declare it.<br/>Thing t{...};"]\n' +
          '  A -->|yes| B{"Is the size known<br/>at compile time<br/>and small?"}\n' +
          '  B -->|"no — megabytes, or<br/>a runtime-chosen count"| H1["HEAP. Measured: a 16 MB local<br/>killed the process with SIGSEGV<br/>before main\'s first statement ran."]\n' +
          '  B -->|yes| H2{"Does something else<br/>need to share it?"}\n' +
          '  H2 -->|"no, one owner"| U["HEAP via std::unique_ptr&lt;T&gt;<br/>or just return it by value"]\n' +
          '  H2 -->|"yes, genuinely shared"| SH["HEAP via std::shared_ptr&lt;T&gt;"]\n' +
          '  A -->|"not sure"| V["Then it does not.<br/>Return it BY VALUE — the copy is<br/>almost always elided — and the<br/>question disappears."]\n' +
          '  S --> ZERO["Cost: part of one<br/>stack-pointer adjustment"]\n' +
          '  U --> COST["Cost: one operator new<br/>+ one operator delete"]\n' +
          '  SH --> COST\n' +
          '  H1 --> COST\n' +
          '  style S fill:#1a3329,stroke:#4ade80\n' +
          '  style ZERO fill:#1a3329,stroke:#4ade80\n' +
          '  style V fill:#1a3329,stroke:#4ade80\n' +
          '  style U fill:#1a2744,stroke:#5b9cf6\n' +
          '  style SH fill:#1a2744,stroke:#5b9cf6\n' +
          '  style H1 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <InfoBox variant="tip" title="Ten nanoseconds is not a reason to contort your code">
        <p>
          Read that measurement in proportion. Ten nanoseconds is nothing if it happens once per
          request; it is catastrophic if it happens once per pixel. The useful form of the rule is
          not &quot;avoid the heap,&quot; it is <strong>default to automatic storage because it is
          simpler and happens to be free, and reach for the heap when the object genuinely needs to
          outlive its scope or genuinely is not a compile-time size.</strong>
        </p>
        <p>
          Where it does bite in ordinary code is loops. A <code>std::string</code> or{' '}
          <code>std::vector</code> constructed inside a hot loop allocates once per iteration — the
          loop block in <code>scope.cpp</code> above shows that the object really is rebuilt every
          time. Hoisting the buffer out of the loop and calling <code>.clear()</code> is the
          standard fix, and it is worth 10 ns times your iteration count.
        </p>
      </InfoBox>

      <h2>Lifetime Is The Organising Concept</h2>
      <p>
        Everything so far has been mechanism. This section is the mental model, and it is the part
        that your Java and Node instincts will fight.
      </p>
      <p>
        In Java and in Node, you think in terms of <strong>reachability</strong>. An object exists
        as long as something can reach it, and when nothing can, it becomes garbage, and at some
        later point — determined by the collector, not by you — the memory is reused. You never
        write the moment of death, and you cannot observe it. &quot;When is this freed?&quot; is not
        a question your code answers.
      </p>
      <p>
        In C++ you think in terms of <strong>ownership and scope</strong>. Every object has exactly
        one point at which it is destroyed, that point is determined by its storage duration, and
        for the three durations the compiler manages it is visible in the source. The question
        &quot;when is this destroyed?&quot; always has an answer, and the answer is a line number.
      </p>
      <p>
        Here is that difference as two programs that do the same thing. Both create 100,000 objects
        in a loop inside a function, let them go out of scope, and then report how many have been
        cleaned up by the time the function returns.
      </p>

      <CodeBlock language="cpp" title="deterministic.cpp">
{`#include <print>

static int created = 0, destroyed = 0;

struct Resource {
    Resource()  { ++created; }
    ~Resource() { ++destroyed; }
};

void work() {
    for (int i = 0; i < 100'000; ++i) {
        Resource r;                     // goes out of scope every iteration
    }
}

int main() {
    work();
    std::println("right after work() returned: created {}, destroyed {}", created, destroyed);
    std::println("there is no second line, because there is nothing left to wait for.");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 deterministic.cpp && ./deterministic">
{`right after work() returned: created 100000, destroyed 100000
there is no second line, because there is nothing left to wait for.`}
      </CodeBlock>

      <CodeBlock language="java" title="Deterministic.java — the nearest Java equivalent">
{`import java.util.concurrent.atomic.AtomicInteger;

public class Deterministic {
    static final AtomicInteger created = new AtomicInteger();
    static final AtomicInteger finalized = new AtomicInteger();

    static class Resource {
        Resource() { created.incrementAndGet(); }
        @Override protected void finalize() { finalized.incrementAndGet(); }
    }

    static void work() {
        for (int i = 0; i < 100_000; i++) {
            Resource r = new Resource();        // goes out of scope every iteration
        }
    }

    public static void main(String[] args) throws Exception {
        work();
        System.out.printf("right after work() returned: created %d, finalized %d%n",
                          created.get(), finalized.get());
        System.gc();
        Thread.sleep(300);
        System.out.printf("after System.gc() + 300ms:   created %d, finalized %d%n",
                          created.get(), finalized.get());
        System.gc();
        Thread.sleep(1000);
        System.out.printf("after a second gc + 1s:      created %d, finalized %d%n",
                          created.get(), finalized.get());
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — JDK 26.0.1, javac + java Deterministic, three consecutive runs">
{`Deterministic.java:9: warning: [removal] finalize() in Object has been deprecated
      and marked for removal
        @Override protected void finalize() { finalized.incrementAndGet(); }
                                 ^
1 warning

--- run 1 ---
right after work() returned: created 100000, finalized 0
after System.gc() + 300ms:   created 100000, finalized 100000
after a second gc + 1s:      created 100000, finalized 100000
--- run 2 ---
right after work() returned: created 100000, finalized 0
after System.gc() + 300ms:   created 100000, finalized 100000
after a second gc + 1s:      created 100000, finalized 100000
--- run 3 ---
right after work() returned: created 100000, finalized 0
after System.gc() + 300ms:   created 100000, finalized 100000
after a second gc + 1s:      created 100000, finalized 100000`}
      </CodeBlock>

      <p>
        <strong>C++: 100,000 created, 100,000 destroyed, before the function returned.</strong>{' '}
        <strong>Java: 100,000 created, zero finalized.</strong> One hundred thousand objects had gone
        out of scope and not one of them had been touched. They were all cleaned up eventually — but
        only after an explicit <code>System.gc()</code>, which is a request, not a command, and
        which you would never put in production code.
      </p>
      <p>
        Nothing there is a criticism of the JVM. It is doing the right thing: batching reclamation is
        how a collector gets its throughput, and the Java program is in no way incorrect. The point
        is narrower and more important. <strong>&quot;Out of scope&quot; means something in C++ that
        it does not mean in Java.</strong> In Java it means a local variable&apos;s name is no
        longer usable. In C++ it means the object has been destroyed, now, and anything it was
        holding has been given back.
      </p>

      <InfoBox variant="warning" title="A note on that Java program, since the lesson has to be accurate about versions">
        <p>
          <code>finalize()</code> is the wrong way to do cleanup in Java and has been for a decade —
          it is used here only because it is the only mechanism that lets you <em>count</em>{' '}
          reclamations, which is the thing being measured. On <strong>JDK 26.0.1</strong>{' '}
          <code>javac</code> emits <code>warning: [removal] finalize() in Object has been deprecated
          and marked for removal</code>, and the methods still ran. I had expected finalization to be
          gone by now; it is deprecated-for-removal and disabled-by-default-capable (JEP 421), not
          removed, on this JDK. The modern replacements are{' '}
          <code>try</code>-with-resources and <code>java.lang.ref.Cleaner</code>, and the former is
          exactly what <a href="/cpp/raii">the next lesson</a> compares against.
        </p>
      </InfoBox>

      <h3>What follows from this, concretely</h3>
      <ul>
        <li>
          <strong>You do not need a cleanup block.</strong> The three blocks of{' '}
          <code>try/finally</code> you write around every file handle in Node have no analogue here,
          because the destructor is attached to the object rather than to the control flow. That is{' '}
          <a href="/cpp/raii">the next lesson</a>.
        </li>
        <li>
          <strong>Memory is not the interesting resource.</strong> A GC manages memory and nothing
          else. Deterministic destruction manages memory, file descriptors, sockets, locks,
          database transactions and GPU buffers with the same mechanism, because they all end at a
          brace.
        </li>
        <li>
          <strong>There are no pause times, and no tuning.</strong> No <code>-Xmx</code>, no
          nursery, no choosing between G1 and ZGC. There is also no safety net — the trade is
          explicit.
        </li>
        <li>
          <strong>The failure mode moves.</strong> A GC language&apos;s memory bug is a leak: you
          held a reference you forgot about, and the heap grows. C++ has that bug too, but it also
          has the opposite one — <em>using something after its lifetime ended</em>, which the rest
          of this lesson is about and which has no equivalent in any language you currently use.
        </li>
      </ul>

      <h2>When A Lifetime Ends And Something Still Points At It</h2>
      <p>
        <a href="/cpp/references">The previous lesson</a> showed one shape of this: a reference
        returned from a function whose local had died. There are four more, you will meet all of
        them, and what is instructive is how differently the toolchain treats each.
      </p>

      <h3>1. A pointer that outlives a block</h3>
      <p>
        No function boundary, no return value. Just a pointer assigned inside a block and used
        outside it — which is how this actually happens in real code, usually with several hundred
        lines between the two.
      </p>

      <CodeBlock language="cpp" title="uas.cpp">
{`#include <print>

struct Config { int port; int retries; };

int main() {
    Config* saved = nullptr;

    {
        Config c{8080, 3};
        saved = &c;              // the POINTER escapes; the OBJECT does not
        std::println("inside the scope:  port = {}", saved->port);
    }                            // c's lifetime ends at this brace

    saved->port = 9090;          // writing into a dead stack slot
    std::println("after the scope:   port = {}  retries = {}", saved->port, saved->retries);
    std::println("exiting normally");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 uas.cpp && ./uas2 (and identically at -O0)">
{`inside the scope:  port = 8080
after the scope:   port = 9090  retries = 3
exiting normally
(exit 0)`}
      </CodeBlock>

      <p>
        <strong>No warning from <code>-Wall -Wextra</code>, correct-looking output, exit 0.</strong>{' '}
        The write succeeded and the read came back with exactly the value you would want. It happens
        to work because nothing else has used that stack slot yet, and it will stop happening to work
        the moment a function call sits between the brace and the use.
      </p>
      <p>
        AddressSanitizer catches it, with one important condition:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O0 -g -fsanitize=address uas.cpp && ./uasA0">
{`=================================================================
==17766==ERROR: AddressSanitizer: stack-use-after-scope on address 0x00016f2fe760
  at pc 0x000100b00a6c bp 0x00016f2fe730 sp 0x00016f2fe728
WRITE of size 4 at 0x00016f2fe760 thread T0
    #0 0x000100b00a68 in main uas.cpp:14
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

Address 0x00016f2fe760 is located in stack of thread T0 at offset 32 in frame
    #0 0x000100b008c4 in main uas.cpp:5

  This frame has 1 object(s):
    [32, 40) 'c' (line 9) <== Memory access at offset 32 is inside this variable
HINT: this may be a false positive if your program uses some custom stack unwind mechanism,
      swapcontext or vfork
      (longjmp and C++ exceptions *are* supported)
SUMMARY: AddressSanitizer: stack-use-after-scope uas.cpp:14 in main
(exit 134)`}
      </CodeBlock>

      <p>
        <code>WRITE of size 4</code>, the line of the bad write (14), the line of the frame (5), the
        name and line of the dead object (<code>&apos;c&apos; (line 9)</code>), and exit 134 —
        SIGABRT. That is a bug report you can fix in a minute.
      </p>

      <InfoBox variant="danger" title="The condition: this one needs -O0, and that is not what I expected">
        <p>
          The same build at <code>-O1</code> does <strong>not</strong> report anything. Verified
          four ways — <code>-O1</code> alone, and <code>-O1</code> with{' '}
          <code>-fsanitize-address-use-after-scope</code> added explicitly — and in every case the
          program printed its plausible-looking output and exited 0:
        </p>
        <CodeBlock language="text" title="Real output — the same file, ASan at two optimisation levels">
{`$ clang++ -std=c++23 -O0 -g -fsanitize=address uas.cpp -o uasX && ./uasX
==17735==ERROR: AddressSanitizer: stack-use-after-scope on address 0x00016cfc2760
  [...]  (exit 134)

$ clang++ -std=c++23 -O1 -g -fsanitize=address uas.cpp -o uasX && ./uasX
inside the scope:  port = 8080
after the scope:   port = 9090  retries = 3
exiting normally
(exit 0)`}
        </CodeBlock>
        <p>
          The reason is that use-after-<em>scope</em> detection depends on the compiler keeping the
          inner block&apos;s lifetime markers distinct from the enclosing frame so it can poison and
          unpoison that range. At <code>-O1</code> the block is merged into the function frame and
          there is no longer a scope boundary to instrument. The{' '}
          <a href="/cpp/references">previous lesson&apos;s</a> example was caught at{' '}
          <code>-O1</code> because it crossed a <em>function</em> boundary, where the frame really
          is torn down.
        </p>
        <p>
          Practical rule, and it is a small change to how you set up a project:{' '}
          <strong>build your sanitizer configuration at <code>-O0</code>. Not <code>-Og</code>, and
          not <code>-O1</code> or above.</strong> Measured on this machine against the inner-block
          example, compiling with <code>-fsanitize=address</code> at each level:
        </p>
        <CodeBlock language="text" title="Real result — only -O0 catches it">
{`-O0   AddressSanitizer: stack-use-after-scope   <- caught
-Og   (prints garbage, no report)                <- NOT caught
-O1   (prints garbage, no report)                <- NOT caught`}
        </CodeBlock>
        <p>
          <code>-Og</code> is documented as &ldquo;optimise for debugging&rdquo;, so it is a
          reasonable guess that it would preserve the scope markers — it does not. Guessing here is
          expensive in a specific way: the build still succeeds, the sanitizer still runs, and the
          bug simply is not reported. A configuration that silently detects less looks identical to
          a clean run. The usual advice to pair sanitizers with <code>-O1</code> for speed costs you
          this entire category, and <code>-Og</code> costs you it too.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="Use-after-RETURN is a separate switch, and it is off by default">
        <p>
          The inner-block case above is use-after-<em>scope</em>. Returning the address of a local
          and dereferencing it after the function returns is use-after-<em>return</em>, which
          AddressSanitizer treats as a different feature — and does <strong>not</strong> check
          unless you ask. Measured here with the returning-a-local example at <code>-O0</code>:
        </p>
        <CodeBlock language="bash" title="Real result — the default misses it entirely">
{`./a.out
# prints 42. No report. The bug is real and invisible.

ASAN_OPTIONS=detect_stack_use_after_return=1 ./a.out
# AddressSanitizer: stack-use-after-return   <- now caught`}
        </CodeBlock>
        <p>
          Set <code>ASAN_OPTIONS=detect_stack_use_after_return=1</code> in whatever runs your tests.
          It costs extra memory, which is why it is not on by default, and without it the single
          most intuitive lifetime bug in the language passes straight through the tool you installed
          to catch it.
        </p>
      </InfoBox>

      <h3>2. A pointer that outlives a call — and why Go is fine with this</h3>
      <p>
        This is the one that will bite you specifically, because <strong>you have probably just read{' '}
        <a href="/go/pointers">the Go pointers lesson</a>, where returning the address of a local is
        correct, idiomatic Go.</strong> The same five characters are a bug here. Worth seeing
        side by side, because the shapes are identical.
      </p>

      <CodeBlock language="cpp" title="retlocal2.cpp">
{`#include <print>

template <class T>
static inline void escape(T* p) { asm volatile("" : : "r,m"(p) : "memory"); }

int* make_answer() {
    int x = 42;
    return &x;                       // x's lifetime ends at this brace
}

void reuse_the_frame() {
    int junk[8];
    for (int& j : junk) j = 0xBADF00D;
    escape(junk);
}

int main() {
    int* p = make_answer();

    int straight_away = *p;          // read it before calling anything else
    reuse_the_frame();
    int after_a_call  = *p;          // read it again after another frame used that memory

    std::println("straight away:       *p = {}", straight_away);
    std::println("after one more call: *p = {}  (0xBADF00D is {})", after_a_call, 0xBADF00D);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra, three optimisation levels, two runs each">
{`### compile (all levels)
retlocal2.cpp:8:13: warning: address of stack memory associated with local
      variable 'x' returned [-Wreturn-stack-address]
    8 |     return &x;                       // x's lifetime ends at this brace
      |             ^
1 warning generated.

### -O0
straight away:       *p = 42
after one more call: *p = 1  (0xBADF00D is 195948557)
straight away:       *p = 42
after one more call: *p = 1  (0xBADF00D is 195948557)

### -O1
straight away:       *p = 42
after one more call: *p = 42  (0xBADF00D is 195948557)
straight away:       *p = 42
after one more call: *p = 42  (0xBADF00D is 195948557)

### -O2
straight away:       *p = 0
after one more call: *p = 0  (0xBADF00D is 195948557)
straight away:       *p = 0
after one more call: *p = 0  (0xBADF00D is 195948557)`}
      </CodeBlock>

      <p>
        <strong>Three optimisation levels, three different stories, all from one warning-free-apart-
        from-one-warning program that exits 0 every time.</strong> At <code>-O0</code> the value
        survived one read and then became 1. At <code>-O1</code> it looked completely correct —
        this is the build on which you would conclude the code is fine. At <code>-O2</code> it was
        already 0 on the very first read.
      </p>
      <p>
        Note what none of them printed: <code>195948557</code>. I expected the clobbering frame to
        put <code>0xBADF00D</code> in that slot and make the corruption obvious. It did not — the
        junk array landed elsewhere in the frame, and what you get instead is a small plausible
        integer, which is worse. Garbage that looks like data is the failure mode to be afraid of.
      </p>
      <p>
        Now Go. Same shape, same intent:
      </p>

      <CodeBlock language="go" title="main.go — the identical program in Go">
{`package main

import "fmt"

func makeAnswer() *int {
	x := 42
	return &x // the identical shape, and it is correct here
}

func reuseTheFrame() {
	var junk [8]int
	for i := range junk {
		junk[i] = 0xBADF00D
	}
	_ = junk
}

func main() {
	p := makeAnswer()

	straightAway := *p
	reuseTheFrame()
	afterACall := *p

	fmt.Println("straight away:      *p =", straightAway)
	fmt.Println("after one more call: *p =", afterACall)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Go 1.25.5 darwin/arm64">
{`$ go vet ./...
(no output)

$ go build -gcflags='-m' ./...
./main.go:5:6: can inline makeAnswer
./main.go:10:6: can inline reuseTheFrame
./main.go:19:17: inlining call to makeAnswer
./main.go:22:15: inlining call to reuseTheFrame
./main.go:6:2: moved to heap: x
./main.go:25:14: "straight away:      *p =" escapes to heap
./main.go:25:42: straightAway escapes to heap

$ go run .
straight away:      *p = 42
after one more call: *p = 42

$ go run .
straight away:      *p = 42
after one more call: *p = 42`}
      </CodeBlock>

      <p>
        <code>./main.go:6:2: moved to heap: x</code>. That one line is the entire difference. Go&apos;s
        escape analysis noticed that a pointer to <code>x</code> outlives{' '}
        <code>makeAnswer</code>, so <code>x</code> was never a stack variable in the compiled
        program — it was heap-allocated, and the garbage collector owns it from there. The Go
        program is correct, deterministic, and 42 every time.
      </p>
      <p>
        <strong>C++ has no escape analysis for this purpose, and it could not have one.</strong> Not
        because compiler writers have not got round to it, but because the decision is yours by
        design: in C++ the declaration <code>int x = 42;</code> inside a function <em>means</em>{' '}
        automatic storage duration. If the compiler silently promoted it to the heap whenever a
        pointer escaped, the language would have lost the property that makes it predictable —
        that you can tell from the source where an object lives and when it dies. Go made the
        opposite trade, which is the right trade for Go, and which{' '}
        <a href="/go/pointers">the Go lesson</a> is explicit about: you do not write the stack-or-heap
        decision down, so you cannot read a Go program&apos;s allocation profile off the page.
      </p>

      <InfoBox variant="tip" title="What to write instead — and it is shorter than the broken version">
        <p>
          <strong>Return by value.</strong> That is the whole answer, and it is not a performance
          compromise: <code>int make_answer() {'{ return 42; }'}</code> returns in a register, and for
          class types the copy is elided. If the thing genuinely must outlive its scope and genuinely
          must be referred to rather than copied, return{' '}
          <code>std::unique_ptr&lt;T&gt;</code> — ownership travels with the pointer, which is{' '}
          <a href="/cpp/smart-pointers">the smart pointers lesson</a>.
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.5rem 0' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={headStyle}>You want to write</th>
              <th style={headStyle}>In Go</th>
              <th style={headStyle}>In C++</th>
            </tr>
          </thead>
          <tbody>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>return &amp;local</code></td>
              <td style={cellStyle}>correct — escape analysis heap-allocates it</td>
              <td style={cellStyle}>a bug. Return by value, or{' '}
                <code>std::unique_ptr&lt;T&gt;</code></td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}>a factory function</td>
              <td style={cellStyle}><code>func New() *Thing</code></td>
              <td style={cellStyle}><code>Thing make_thing()</code> — by value</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}>&quot;who frees this?&quot;</td>
              <td style={cellStyle}>nobody; the GC does</td>
              <td style={cellStyle}>the type system answers it:{' '}
                <code>unique_ptr</code> = you, <code>T*</code> = somebody else</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}>stack-or-heap decision</td>
              <td style={cellStyle}>the compiler&apos;s, invisible in the source</td>
              <td style={cellStyle}>yours, and visible in the declaration</td>
            </tr>
          </tbody>
        </table>
      </InfoBox>

      <InfoBox variant="warning" title="ASan does not catch use-after-return by default">
        <p>
          Worth knowing before you rely on your sanitizer build. Plain{' '}
          <code>-fsanitize=address</code> ran the program above to completion without a word. It
          needs an explicit opt-in, either at runtime or at compile time:
        </p>
        <CodeBlock language="text" title="Real output — ASAN_OPTIONS=detect_stack_use_after_return=1 ./rl_asan">
{`=================================================================
==18036==ERROR: AddressSanitizer: stack-use-after-return on address 0x00010433d020
  at pc 0x00010214ce98 bp 0x00016dcb26f0 sp 0x00016dcb26e8
READ of size 4 at 0x00010433d020 thread T0
    #0 0x00010214ce94 in main retlocal2.cpp:20
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

Address 0x00010433d020 is located in stack of thread T0 at offset 32 in frame
    #0 0x00010214c8c4 in make_answer() retlocal2.cpp:6

  This frame has 1 object(s):
    [32, 36) 'x' (line 7) <== Memory access at offset 32 is inside this variable
SUMMARY: AddressSanitizer: stack-use-after-return retlocal2.cpp:20 in main
(exit 134)`}
        </CodeBlock>
        <p>
          The compile-time equivalent is{' '}
          <code>-fsanitize-address-use-after-return=always</code>, verified to produce the same
          report. So the full recipe for a debug build on this toolchain is:
        </p>
        <CodeBlock language="bash" title="The flags this lesson is arguing for">
{`clang++ -std=c++23 -Wall -Wextra -g -O0 \\
        -fsanitize=address,undefined \\
        -fsanitize-address-use-after-return=always \\
        yourfile.cpp`}
        </CodeBlock>
      </InfoBox>

      <h3>3. Using heap memory after <code>delete</code></h3>
      <p>
        The heap version of the same mistake, and the one place where the raw mechanism is most
        obviously indefensible. The thing to notice is what <code>delete</code> does{' '}
        <em>not</em> do:
      </p>

      <CodeBlock language="cpp" title="uaf2.cpp">
{`#include <cstdio>

struct Session { int id; char user[16]; };

int main() {
    Session* s = new Session{7, "tanner"};
    std::printf("live:          id = %d  user = %s\\n", s->id, s->user);

    delete s;                      // the memory goes back to the allocator

    // delete does NOT touch s. It is still an ordinary pointer holding an
    // ordinary address -- to memory you no longer own.
    std::printf("after delete:  s == nullptr ? %s\\n", s == nullptr ? "true" : "false");
    std::printf("after delete:  id = %d\\n", s->id);   // undefined behaviour
    s->id = 99;                                       // undefined behaviour
    std::printf("after write:   id = %d\\n", s->id);
    std::printf("exiting normally\\n");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 uaf2.cpp && ./uaf2b">
{`live:          id = 7  user = tanner
after delete:  s == nullptr ? false
after delete:  id = 6
after write:   id = 99
exiting normally
(exit 0)`}
      </CodeBlock>

      <p>
        Three facts in five lines of output. <strong><code>delete s</code> left{' '}
        <code>s</code> holding the same address</strong> — the pointer is not nulled, so there is no
        check you can write to distinguish it from a live one, exactly as with the dangling
        reference in <a href="/cpp/references">the previous lesson</a>.{' '}
        <strong>The value changed from 7 to 6 on its own</strong>, because the allocator wrote its
        own free-list bookkeeping into the first bytes of the block it just took back. And{' '}
        <strong>the write at <code>s-&gt;id = 99</code> succeeded</strong> — into memory that the
        allocator may hand to somebody else on the next <code>new</code>, which is how one
        component&apos;s use-after-free becomes another component&apos;s mysteriously corrupted
        object.
      </p>
      <p>
        ASan&apos;s report for this is the best one it produces, because it names three locations:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O1 -g -fsanitize=address uaf2.cpp && ./uaf2A">
{`=================================================================
==18203==ERROR: AddressSanitizer: heap-use-after-free on address 0x603000001c30
  at pc 0x0001005b4958 bp 0x00016f84a800 sp 0x00016f84a7f8
READ of size 4 at 0x603000001c30 thread T0
    #0 0x0001005b4954 in main uaf2.cpp:14
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

0x603000001c30 is located 0 bytes inside of 20-byte region [0x603000001c30,0x603000001c44)
freed by thread T0 here:
    #0 0x000100e94558 in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 0x0001005b489c in main uaf2.cpp:9
    #2 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

previously allocated by thread T0 here:
    #0 0x000100e94150 in _Znwm+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50150)
    #1 0x0001005b4840 in main uaf2.cpp:6
    #2 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

SUMMARY: AddressSanitizer: heap-use-after-free uaf2.cpp:14 in main
(exit 134)`}
      </CodeBlock>

      <p>
        Where it was used (line 14), where it was freed (line 9) and where it was allocated (line 6).
        Unlike the use-after-scope case, this works at <code>-O1</code>: heap poisoning does not
        depend on preserving scope boundaries. Note that these reports are far more readable if your
        bad access is in plain <code>printf</code> code — the first draft of this used{' '}
        <code>std::println</code> and the stack trace came back with eight frames of{' '}
        <code>std::__format::__create_packed_storage</code> template instantiations above{' '}
        <code>main</code>.
      </p>

      <h3>4. Deleting twice, and 5. never deleting</h3>
      <p>
        Both measured, and the results are unbalanced in an instructive way.
      </p>

      <CodeBlock language="cpp" title="dd.cpp">
{`#include <cstdio>
int main() {
    int* p = new int{1};
    delete p;
    std::printf("first delete done\\n");
    delete p;                  // double delete
    std::printf("second delete done\\n");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — four builds of dd.cpp">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 dd.cpp -o dd0 && ./dd0
(no output at all)
exit=133

$ clang++ -std=c++23 -O0 -g -fsanitize=address dd.cpp && ./a.out
==18251==ERROR: AddressSanitizer: attempting double-free on 0x6020000000d0 in thread T0:
    #0 ... in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 ... in main dd.cpp:6
0x6020000000d0 is located 0 bytes inside of 4-byte region [0x6020000000d0,0x6020000000d4)
freed by thread T0 here:
    #1 ... in main dd.cpp:4
previously allocated by thread T0 here:
    #1 ... in main dd.cpp:3
exit=134

$ clang++ -std=c++23 -Wall -Wextra -O1 dd.cpp -o dd1 && ./dd1
first delete done
second delete done
exit=0

$ clang++ -std=c++23 -O1 -g -fsanitize=address dd.cpp && ./a.out
first delete done
second delete done
exit=0`}
      </CodeBlock>

      <p>
        At <code>-O0</code>, macOS&apos;s allocator detected the double free and killed the process
        with exit 133 — that is 128 + 5, SIGTRAP. Notice that{' '}
        <strong>&quot;first delete done&quot; never appeared</strong>: stdout was still buffered when
        the process was killed, so the last thing your program said before dying is not in the log.
        That is a general hazard with crash diagnosis, not specific to this bug.
      </p>
      <p>
        At <code>-O1</code> both deletes reported success and the program exited 0 —{' '}
        <strong>including under AddressSanitizer</strong>. The allocation was elided, as in the{' '}
        <code>-O2</code> finding earlier, so there was no block to free twice and nothing to detect.
        A real double free in real code involves a pointer that escapes and will not be elided; the
        lesson here is narrower and still useful: <strong>a bug that your sanitizer build cannot
        reproduce is not a bug that your sanitizer build has disproved.</strong>
      </p>
      <p>
        The leak is the worst result of the lot, and it is a platform fact rather than a C++ one:
      </p>

      <CodeBlock language="text" title="Real output — a deliberate leak, every way of looking for it">
{`$ cat leak.cpp
#include <cstdio>
int main() { int* p = new int[1000]; p[0] = 1; std::printf("leaked %d\\n", p[0]); }

$ clang++ -std=c++23 -Wall -Wextra -O1 leak.cpp -o leakA && ./leakA
leaked 1
exit=0

$ clang++ -std=c++23 -O1 -g -fsanitize=address leak.cpp -o leakA && ./leakA
leaked 1
exit=0

$ ASAN_OPTIONS=detect_leaks=1 ./leakA
==18221==AddressSanitizer: detect_leaks is not supported on this platform.`}
      </CodeBlock>

      <p>
        <strong>On this platform, nothing found the leak.</strong> The runtime says so in as many
        words: <code>detect_leaks is not supported on this platform</code>. LeakSanitizer is a
        separate component of the sanitizer runtime from the address checker, and the Apple-shipped
        build does not include it, so <code>-fsanitize=address</code> here gives you
        use-after-free and buffer-overflow detection with a leak-detection hole in the middle. The
        macOS-native alternatives are <code>leaks(1)</code> against a running process or
        Instruments&apos; Allocations template — both much more manual, neither something you can
        put in a test run. If you develop on a Mac and deploy to Linux, that is a specific,
        concrete reason to run the test suite under sanitizers in CI as well as locally.
      </p>

      <FlowChart
        title="Five ways a lifetime ends badly, and what actually catches each"
        chart={
          'graph TD\n' +
          '  START["A lifetime ended while<br/>something still referred to it"] --> K{"Which shape?"}\n' +
          '  K -->|"pointer outlives a BLOCK"| S1["stack-use-after-scope"]\n' +
          '  K -->|"pointer outlives a CALL"| S2["stack-use-after-return"]\n' +
          '  K -->|"used after delete"| S3["heap-use-after-free"]\n' +
          '  K -->|"delete\'d twice"| S4["double free"]\n' +
          '  K -->|"never delete\'d"| S5["memory leak"]\n' +
          '  S1 --> R1["-Wall -Wextra: SILENT<br/>ASan at -O0: caught, WRITE of size 4<br/>ASan at -O1: SILENT — verified"]\n' +
          '  S2 --> R2["-Wreturn-stack-address: caught here<br/>ASan: needs detect_stack_use_after_return=1<br/>— off by default, verified"]\n' +
          '  S3 --> R3["-Wall -Wextra: SILENT<br/>ASan: caught, with the free site<br/>AND the allocation site"]\n' +
          '  S4 --> R4["libmalloc aborts: exit 133 at -O0<br/>ASan: \'attempting double-free\'<br/>At -O1 the allocation was ELIDED<br/>and nothing happened at all"]\n' +
          '  S5 --> R5["LeakSanitizer: \'detect_leaks is not<br/>supported on this platform\' — macOS.<br/>Nothing on this machine finds it."]\n' +
          '  R1 --> FIX["All five are deleted as a CATEGORY by<br/>binding every resource to an object\'s<br/>lifetime. That is the next lesson."]\n' +
          '  R2 --> FIX\n' +
          '  R3 --> FIX\n' +
          '  R4 --> FIX\n' +
          '  R5 --> FIX\n' +
          '  style R5 fill:#3b1a1a,stroke:#f87171\n' +
          '  style R1 fill:#3d2f14,stroke:#fb923c\n' +
          '  style R4 fill:#3d2f14,stroke:#fb923c\n' +
          '  style FIX fill:#1a3329,stroke:#4ade80'
        }
      />

      <InfoBox variant="success" title="The honest conclusion from that diagram">
        <p>
          Five failure modes, five different detection stories, three of which have a verified hole
          on this machine. If the plan for writing correct C++ is &quot;be careful and run the
          sanitizers,&quot; the plan is not good enough — not because the sanitizers are bad, but
          because the coverage is patchy in ways you cannot predict from the source.
        </p>
        <p>
          The plan that works is to <strong>stop writing the code that can fail this way</strong>.
          Every single bug on that diagram requires a raw owning pointer or a pointer to an object
          whose lifetime you did not think about. Remove both and the whole diagram becomes
          unreachable. <a href="/cpp/raii">The next lesson</a> is how.
        </p>
      </InfoBox>

      <h2>Running Out Of Stack</h2>
      <p>
        The stack is fast because it is a pre-reserved region with a pointer that only moves up and
        down. The price of that is a fixed size, and nothing in C++ checks whether you have exceeded
        it. On this machine:
      </p>

      <CodeBlock language="text" title="Real output — the limit">
{`$ ulimit -s
8176`}
      </CodeBlock>

      <p>
        8176 KB = 8,372,224 bytes for the main thread. There are two ways to overrun it, and they
        fail at different moments.
      </p>

      <h3>Deep recursion</h3>
      <p>
        The cost of a call is the frame size, which you can measure precisely. This program recurses
        to a depth given on the command line, records the lowest stack address it reached, and
        reports success:
      </p>

      <CodeBlock language="cpp" title="deep2.cpp">
{`#include <cstdio>
#include <cstdlib>

static char* deepest = nullptr;

void recurse(long n) {
    char frame[64];
    frame[0] = static_cast<char>(n & 0x7f);
    deepest = frame;
    if (n > 0) recurse(n - 1);
    asm volatile("" : : "r,m"(frame) : "memory");   // defeat tail-call elimination
}

int main(int argc, char** argv) {
    long n = std::atol(argv[1]);
    char top[1];
    recurse(n);
    std::printf("survived depth %ld   (%ld bytes of stack used, %.0f bytes/frame)\\n",
                n, (long)(top - deepest), (double)(top - deepest) / (double)(n + 1));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — binary-searching the limit, three independent trials">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 deep2.cpp -o deep2
$ lo=1; hi=200000
$ while [ $((hi-lo)) -gt 1 ]; do mid=$(((lo+hi)/2)); \\
      if ./deep2 $mid >/dev/null 2>&1; then lo=$mid; else hi=$mid; fi; done
$ echo "deepest surviving = $lo ; first crashing = $hi"
deepest surviving = 74696 ; first crashing = 74697

$ ./deep2 74696
survived depth 74696   (8366079 bytes of stack used, 112 bytes/frame)

$ ./deep2 74697
exit=139

trial 1: deepest=74696
trial 2: deepest=74696
trial 3: deepest=74696`}
      </CodeBlock>

      <p>
        <strong>74,696 frames, then SIGSEGV.</strong> 8,366,079 bytes used against a limit of
        8,372,224 — within 6 KB, which is the rest of <code>main</code>&apos;s frame and the C
        runtime&apos;s startup frames. And the boundary is exactly reproducible: the same depth in
        three independent binary searches, with ASLR shifting the absolute addresses every time.
      </p>
      <p>
        112 bytes per frame for a function with one 64-byte local, at <code>-O0</code>. That is the
        number to keep: <strong>a recursion depth budget is roughly eight megabytes divided by your
        frame size</strong>, so tens of thousands of frames for small ones and only hundreds if a
        frame holds a large buffer. A recursive descent parser on hostile input is a denial of
        service, and the fix is an explicit depth limit, not optimism.
      </p>
      <p>
        Two things that make this worse than it sounds. There is <strong>no exception</strong> —
        stack exhaustion is not <code>std::bad_alloc</code>, it is a signal, and you cannot catch
        it and recover in any portable way. And <strong>worker threads get far less than the main
        thread</strong>, which is worth measuring rather than assuming, because the gap is large:
      </p>

      <CodeBlock language="text" title="Real output — pthread_get_stacksize_np, then the same binary search run inside a std::thread">
{`main thread  pthread_get_stacksize_np = 8372224 bytes (8176 KB)
std::thread  pthread_get_stacksize_np =  536576 bytes ( 524 KB)

worker-thread deepest surviving = 4787
survived depth 4787 on a worker thread (536271 bytes used)
./tdeep 4788 -> exit=138`}
      </CodeBlock>

      <p>
        <strong>4,787 frames on a worker thread against 74,696 on the main thread</strong> — a
        factor of about 15.6, matching the 8176 KB / 524 KB ratio almost exactly. Code that recurses
        happily during development dies at one-sixteenth of the depth the moment you move it onto a
        thread pool, which is a genuinely nasty way to discover the limit. Note also that the exit
        code changed: <strong>139 (SIGSEGV) on the main thread, 138 (SIGBUS) on the worker</strong>.
        Same bug, different signal, because the two stacks are mapped with different guard
        arrangements. Do not pattern-match stack overflow to one signal number.
      </p>

      <h3>One oversized local</h3>
      <p>
        The other way, and the failure is much more abrupt than I expected:
      </p>

      <CodeBlock language="cpp" title="bigl.cpp">
{`#include <cstdio>

int main() {
    std::printf("about to declare a 16 MB local on an 8 MB stack\\n");
    std::fflush(stdout);

    int big[4'000'000];          // 4,000,000 * 4 = 16,000,000 bytes
    big[0] = 1;
    big[3'999'999] = 2;
    std::printf("never reached: %d\\n", big[0] + big[3'999'999]);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three builds of bigl.cpp">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 -Wframe-larger-than=1048576 bigl.cpp -o bigl0
bigl.cpp:4:5: warning: stack frame size (16000048) exceeds limit (1048576) in 'main'
      [-Wframe-larger-than]
    4 | int main() {
      |     ^
1 warning generated.

$ ./bigl0
(no output at all)
exit=139

$ clang++ -std=c++23 -Wall -Wextra -O2 -Wframe-larger-than=1048576 bigl.cpp -o bigl
(no warning)
$ ./bigl
about to declare a 16 MB local on an 8 MB stack
never reached: 3
exit=0`}
      </CodeBlock>

      <p>
        Two surprises there, both worth your attention.
      </p>
      <p>
        <strong>At <code>-O0</code>, the first <code>printf</code> never ran.</strong> It is the
        first statement in <code>main</code>, it is followed by an explicit{' '}
        <code>fflush</code>, and it produced nothing. The frame for a function is allocated on{' '}
        <em>entry</em>, before any of the body executes, so the stack pointer had already been moved
        16 MB past the end of the mapped region and the first touch of the guard page killed the
        process. When a stack overflow takes out a function, you do not get partial output from that
        function.
      </p>
      <p>
        <strong>At <code>-O2</code> it printed a cheerful answer and exited 0.</strong> The optimiser
        noticed that only two elements of the array are ever read, constant-folded{' '}
        <code>1 + 2</code>, and never allocated the array at all — so the frame was never oversized
        and <code>-Wframe-larger-than</code> had nothing to warn about either. Re-tested with an{' '}
        <code>asm</code> barrier forcing the array to exist, <code>-O2</code> warns and crashes with
        exit 139 like <code>-O0</code>. That is now the third separate place in this lesson where{' '}
        <code>-O2</code> made a memory bug disappear instead of louder.
      </p>

      <InfoBox variant="tip" title="The practical rules for stack size">
        <p>
          <strong>Keep locals small — a few KB per frame at most.</strong> If you need a 16 MB
          buffer, it belongs on the heap: <code>std::vector&lt;int&gt; big(4'000'000);</code> works
          fine, costs one allocation, and gives you a <code>std::bad_alloc</code> you can catch if
          the machine genuinely cannot provide it. A <code>std::array&lt;int, 4'000'000&gt;</code>{' '}
          as a local is the same bug as the raw array, because{' '}
          <code>std::array</code> is a stack object.
        </p>
        <p>
          <strong>Turn on <code>-Wframe-larger-than=</code>.</strong> It is not in{' '}
          <code>-Wall -Wextra</code> and it caught this immediately at <code>-O0</code>. A limit
          around 64 KB is a reasonable starting point for application code.
        </p>
        <p>
          <strong>Bound your recursion explicitly.</strong> Carry a depth parameter and fail at a
          limit you chose, rather than at a limit the operating system chose. Or convert the
          recursion to an explicit stack of work items, which moves the memory to the heap where
          exhaustion is a catchable exception.
        </p>
      </InfoBox>

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
            <td style={cellStyle}>&quot;Out of scope means eligible for collection&quot;</td>
            <td style={cellStyle}>C++ destroyed 100,000 objects before the function returned.
              Java had finalized <strong>zero</strong> at the same point.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Destruction order is an implementation detail&quot;</td>
            <td style={cellStyle}>Strict reverse order for locals and members, guaranteed.
              Unspecified for <code>vector</code> elements — libc++ went back to front.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Globals are initialised in a defined order&quot;</td>
            <td style={cellStyle}>Reordering two filenames on the link line swapped the
              construction order.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The stack is a bit faster than the heap&quot;</td>
            <td style={cellStyle}>0.92 ns versus 9.7 ns per object — about 10&times;. One
              instruction (<code>sub sp</code>) versus two library calls.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>new</code> always allocates&quot;</td>
            <td style={cellStyle}>At <code>-O2</code> the instrumented allocator counted{' '}
              <strong>zero</strong> calls for a <code>new</code>/<code>delete</code> pair whose
              pointer did not escape. The standard permits it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>delete p</code> makes <code>p</code> safe&quot;</td>
            <td style={cellStyle}><code>s == nullptr</code> was <code>false</code> afterwards, and
              the value had silently changed from 7 to 6.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The sanitizer will catch it&quot;</td>
            <td style={cellStyle}>Use-after-scope: only at <code>-O0</code>. Use-after-return:
              only with an opt-in flag. Leaks: &quot;not supported on this platform.&quot;</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>return &amp;local</code> is fine, Go does it&quot;</td>
            <td style={cellStyle}>Go: <code>moved to heap: x</code>, 42 every time. C++: 42 then 1
              at <code>-O0</code>, 42 then 42 at <code>-O1</code>, 0 at <code>-O2</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A big local is just slower to set up&quot;</td>
            <td style={cellStyle}>A 16 MB local killed the process with SIGSEGV{' '}
              <em>before the first statement of <code>main</code> ran</em>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Recursion depth is effectively unlimited&quot;</td>
            <td style={cellStyle}>74,696 frames at 112 bytes each, then SIGSEGV. Reproducible to
              the frame. A <code>std::thread</code> gets 536,576 bytes, not 8,372,224 — 4,787
              frames, and SIGBUS rather than SIGSEGV.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        You now have the mechanism. Every object has one of four storage durations; three of them are
        managed by the compiler, deterministically, in reverse order of construction; one of them is
        managed by you, and it is the only one that can leak or dangle. Automatic storage costs a
        single instruction. The heap costs about ten nanoseconds and a decision about ownership.
      </p>
      <p>
        What you do not yet have is the <em>technique</em>. Look back at the five-failure diagram:
        every entry on it needs a raw owning pointer or an unconsidered lifetime. And look back at
        block 5 of <code>scope.cpp</code> — an early return that still destroyed its local, with no
        cleanup code anywhere.
      </p>
      <p>
        Put those two observations together and you have <strong>RAII</strong>. If the only thing
        that is guaranteed to happen is &quot;the destructor runs when the scope ends,&quot; then the
        way to make a resource impossible to leak is to make its release the destructor of an object
        with automatic storage duration. That single move turns the whole diagram above into dead
        ground, and it is why C++ developers do not experience the absence of a garbage collector as
        a hardship.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, and it takes four minutes. Take <code>scope.cpp</code> from this lesson and
          add a <code>throw std::runtime_error{'{'}&quot;boom&quot;{'}'}</code> in the middle of
          block 1, after <code>b</code> is constructed and before <code>c</code>. Wrap the block in a{' '}
          <code>try</code>/<code>catch</code>. Then predict, before running it, exactly which{' '}
          <code>-</code> lines you expect and in what order.
        </p>
        <p>
          Whatever you predicted, the result is the single most important property of the language,
          and it is where <a href="/cpp/raii">the next lesson</a> starts. If you came from Java you
          will reach for <code>finally</code>; if you came from Go, <code>defer</code>; if you came
          from Node, a <code>try/finally</code> and a nagging doubt. C++ needs none of the three, and
          the reason is on this page: destruction is a property of the scope, not of the control
          flow that leaves it.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default MemoryModel;
