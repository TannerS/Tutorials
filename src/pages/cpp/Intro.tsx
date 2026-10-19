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

function Intro() {
  return (
    <LessonLayout
      title="C++ in 2026: Which C++ You're Actually Writing"
      sectionId="cpp"
      lessonIndex={0}
      prev={null}
      next={{ path: '/cpp/compiling', label: 'Compiling, Linking & the One-Definition Rule' }}
    >
      <p>
        You have written C++ before. That is both the good news and the problem. The good news is
        that this section does not have to explain a <code>for</code> loop, a struct, or what a
        header is for. The problem is that the C++ you half-remember is almost certainly a different
        language from the one a 2026 codebase is written in, and the half you remember wrongly is
        the expensive half.
      </p>
      <p>
        Worse, the gaps get filled in by instincts from the languages you use every day. Four of
        those instincts are actively wrong here, and each one is the root of a whole family of bugs:
      </p>
      <ul>
        <li>
          <strong>&quot;Something cleans up after me.&quot;</strong> Nothing does. There is no
          garbage collector, not an optional one, not a conservative one. There is a much better
          mechanism instead, and it runs at a brace.
        </li>
        <li>
          <strong>&quot;Objects are handles to things.&quot;</strong> In Java and JavaScript a
          variable of class type holds a reference. In C++ a variable of class type <em>is</em> the
          object. <code>b = a</code> copies it — all of it, including whatever it owns on the heap.
        </li>
        <li>
          <strong>&quot;Compilation is a step.&quot;</strong> It is at least four stages, and the
          two error families they produce look nothing alike. Half of &quot;I can&apos;t get this to
          build&quot; is not knowing which stage is complaining.
        </li>
        <li>
          <strong>&quot;It compiled and the tests pass, so it works.&quot;</strong> C++ has
          undefined behaviour, which means a program can be wrong in a way that only shows up when
          you change the optimiser flag. There is a verified demonstration of exactly that further
          down this page.
        </li>
      </ul>
      <p>
        This lesson orients you: which dialect you are reading, what C++ is actually chosen for
        today, what that choice costs, and where the language has got to. The rest of Phase 1 then
        builds the model from the bottom — the build pipeline, types, functions, and finally values
        versus references, which is the bridge into the memory work.
      </p>

      <InfoBox variant="note" title="Versions, and what was actually run">
        <p>
          Every command, output block, binary size and assembly listing in this section was executed
          on this machine. The toolchain is <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,
          target <code>arm64-apple-darwin25.6.0</code>, with libc++ <code>_LIBCPP_VERSION 220106</code>.
          The default standard for examples is <strong>C++23</strong> (<code>-std=c++23</code>),
          which this compiler fully accepts; <code>c++17</code>, <code>c++20</code> and{' '}
          <code>c++26</code> also compile here and are used where a comparison needs them.
        </p>
        <p>
          Two things worth knowing before you trust a command you see elsewhere.{' '}
          <strong><code>g++</code> on this machine is not GCC.</strong> It is a wrapper around the
          same Apple clang — <code>g++ -dM -E -x c++ /dev/null</code> defines{' '}
          <code>__clang__ 1</code> and <code>__clang_version__ &quot;21.0.0&quot;</code>, and the
          legacy <code>__GNUC__ 4</code> it also defines is a compatibility lie, not a version. And{' '}
          <strong><code>cmake</code> is not installed here</strong>, so where CMake comes up it is{' '}
          <em>described</em>, never claimed to have been run. <code>make</code> and{' '}
          <code>lldb</code> are present and are used.
        </p>
      </InfoBox>

      <h2>&quot;C++&quot; Names at Least Four Languages</h2>
      <p>
        This is the single most useful thing to understand before you read any C++ on the internet.
        C++ has kept near-total backward compatibility since 1998, which means every style ever
        written is still valid input to the compiler. So when you search for how to do something,
        you get answers written against four different languages, all of them called C++, and
        nothing in the answer tells you which.
      </p>
      <p>
        Here is the same trivial task — keep the odd numbers, sort them, print them — in three of
        those dialects. All three compile and run on the toolchain above.
      </p>

      <CodeBlock language="cpp" title="dc.cpp — &quot;C with classes&quot;: compiled with -std=c++98, but there is nothing C++ about it">
{`#include <stdio.h>
#include <stdlib.h>

int cmp(const void* a, const void* b) {
    return (*(const int*)a) - (*(const int*)b);
}

int main() {
    int raw[] = {3, 8, 1, 9, 4, 7};
    int n = sizeof(raw) / sizeof(raw[0]);

    int* odds = (int*)malloc(n * sizeof(int));   // who frees this? you do.
    int count = 0;
    for (int i = 0; i < n; ++i) {
        if (raw[i] % 2 != 0) odds[count++] = raw[i];
    }
    qsort(odds, count, sizeof(int), cmp);

    for (int i = 0; i < count; ++i) printf("%d ", odds[i]);
    printf("\\n");
    free(odds);
    return 0;
}`}
      </CodeBlock>

      <CodeBlock language="cpp" title="d98.cpp — the C++98/03 dialect: a functor class, explicit iterators, no auto, no lambdas">
{`#include <stdio.h>
#include <vector>
#include <algorithm>

struct IsEven {
    bool operator()(int n) const { return n % 2 == 0; }
};

int main() {
    int raw[] = {3, 8, 1, 9, 4, 7};
    std::vector<int> v(raw, raw + sizeof(raw) / sizeof(raw[0]));

    std::vector<int> odds;
    std::remove_copy_if(v.begin(), v.end(), std::back_inserter(odds), IsEven());
    std::sort(odds.begin(), odds.end());

    for (std::vector<int>::const_iterator it = odds.begin(); it != odds.end(); ++it) {
        printf("%d ", *it);
    }
    printf("\\n");
    return 0;
}`}
      </CodeBlock>

      <CodeBlock language="cpp" title="d23.cpp — C++23: a ranges pipeline, no raw loop, no manual memory, no functor class">
{`#include <algorithm>
#include <print>
#include <ranges>
#include <vector>

int main() {
    std::vector v{3, 8, 1, 9, 4, 7};
    auto odds = v | std::views::filter([](int n) { return n % 2 != 0; })
                  | std::ranges::to<std::vector>();
    std::ranges::sort(odds);
    std::println("{}", odds);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Apple clang 21.0.0, all three built and run">
{`$ clang++ -std=c++98 dc.cpp  -o dc  && ./dc
1 3 7 9

$ clang++ -std=c++98 d98.cpp -o d98 && ./d98
1 3 7 9

$ clang++ -std=c++23 d23.cpp -o d23 && ./d23
[1, 3, 7, 9]`}
      </CodeBlock>

      <p>
        Three programs, one answer, three unrelated skill sets. The first needs you to track an
        allocation by hand and get <code>sizeof</code> arithmetic right. The second needs you to
        know that a class with <code>operator()</code> is how you passed behaviour around before
        lambdas existed. The third needs you to know that <code>|</code> composes views, that{' '}
        <code>std::ranges::to</code> materialises one, and that <code>std::println</code> can
        format a container directly — <code>[1, 3, 7, 9]</code> is the standard library&apos;s range
        formatter, not a loop someone wrote.
      </p>
      <p>
        That is why most bad C++ advice is not wrong, it is <em>stale</em>. It is a correct answer
        to a question the language stopped asking. &quot;How do I avoid leaking this?&quot; had a
        hard answer in 2005 and has a one-word answer now. The practical skill is dating the code
        you are reading.
      </p>

      <FlowChart
        title="Dating the C++ in front of you"
        chart={
          'graph TD\n' +
          '  Q["C++ code or advice you did not write"] --> A{"What is in it?"}\n' +
          '  A -->|"malloc / free / qsort<br/>char* / sizeof arithmetic"| D1["C with classes<br/>(1985-ish habits)"]\n' +
          '  A -->|"new / delete, functor structs<br/>vector&lt;T&gt;::iterator, no auto"| D2["C++98 / C++03"]\n' +
          '  A -->|"auto, lambdas, unique_ptr<br/>range-for, std::move, nullptr"| D3["C++11 / C++14<br/>— the real break"]\n' +
          '  A -->|"string_view, optional, variant<br/>structured bindings, if constexpr"| D4["C++17<br/>— common corporate floor"]\n' +
          '  A -->|"concepts, ranges, &lt;=&gt;, span<br/>std::format / println, expected"| D5["C++20 / C++23<br/>— this section"]\n' +
          '  D1 --> R1["The advice is probably about a leak<br/>that RAII now deletes as a category"]\n' +
          '  D2 --> R1\n' +
          '  D3 --> R2["The advice is probably still current,<br/>possibly with a shorter spelling now"]\n' +
          '  D4 --> R2\n' +
          '  D5 --> R3["Current. Check your compiler supports it<br/>before you depend on it."]\n' +
          '  style D5 fill:#1a3329,stroke:#4ade80\n' +
          '  style D1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style R3 fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        The compiler will even tell you when you have crossed a dialect boundary, though the message
        is not always friendly about it. Compiling the C++23 feature tour from further down this
        page as C++17 produces this:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++17 -fmessage-length=76 tour.cpp (first and fourth diagnostics of nine)">
{`tour.cpp:9:16: error: no type named 'integral' in namespace 'std'
    9 | template <std::integral T>
      |           ~~~~~^
tour.cpp:15:18: warning: '<=>' is a single token in C++20; add a space to
      avoid a change in behavior [-Wc++20-compat]
   15 |     auto operator<=>(const Version&) const = default;
      |                  ^
tour.cpp:15:10: error: 'operator<=' cannot be the name of a variable or data
      member
   15 |     auto operator<=>(const Version&) const = default;
      |          ^`}
      </CodeBlock>

      <p>
        Read that second diagnostic carefully, because it is the dialect problem in miniature. The
        characters <code>&lt;=&gt;</code> are <em>one operator</em> in C++20 and <em>two
        operators</em> in C++17. Same bytes, different language. <code>-std=</code> is not a
        compatibility toggle; it selects which language the compiler is reading.
      </p>

      <InfoBox variant="tip" title="Practical rule for reading C++ you did not write">
        <p>
          Find the build system and read the standard flag first — <code>-std=c++17</code> in a
          Makefile, <code>CMAKE_CXX_STANDARD</code> in a <code>CMakeLists.txt</code>, or{' '}
          <code>/std:c++20</code> on MSVC. That one line tells you which of these dialects you are
          allowed to write, which is more useful than any amount of guessing from the code. If it is
          not set at all, you are on the compiler&apos;s default, and the default is not what you
          would guess. Checked here rather than assumed —{' '}
          <code>clang++ -dM -E -x c++ /dev/null | grep __cplusplus</code> prints{' '}
          <code>#define __cplusplus 201402L</code>, so Apple clang 21 defaults to{' '}
          <strong>C++14</strong>. New enough for <code>auto</code> and lambdas, too old for{' '}
          <code>std::optional</code>, <code>std::string_view</code>, or anything else in this
          section. Always pass <code>-std=</code> explicitly.
        </p>
      </InfoBox>

      <h2>What C++ Is Actually Chosen For</h2>
      <p>
        Nobody picks C++ in 2026 for productivity. It gets picked for three things, and it is worth
        being precise about them because they are also the three things you give up by using Java or
        Node.
      </p>

      <h3>1. There is no runtime to install, start, or warm up</h3>
      <p>
        A C++ program is machine code. There is no VM, no interpreter, no JIT, no class loader, no
        bytecode. The only thing it needs on the target machine is the C++ standard library it
        linked against — and on macOS that ships with the OS.
      </p>

      <CodeBlock language="cpp" title="hello_ios.cpp">
{`#include <iostream>
#include <string>

int main() {
    std::string who = "C++23";
    std::cout << "Hello from " << who << "\\n";
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2, arm64">
{`$ clang++ -std=c++23 -O2 hello_ios.cpp -o hello && ./hello
Hello from C++23

$ stat -f '%z bytes' hello
35944 bytes

$ strip hello && stat -f '%z bytes' hello
35272 bytes

$ otool -L hello
hello:
	/usr/lib/libc++.1.dylib (compatibility version 1.0.0, current version 2200.27.0)
	/usr/lib/libSystem.B.dylib (compatibility version 1.0.0, current version 1359.0.0)`}
      </CodeBlock>

      <p>
        <strong>35,944 bytes</strong>, two dynamic dependencies, both of which are part of macOS.
        No <code>node_modules</code>, no JAR, no JRE. For comparison, on this same machine the Node
        binary is <strong>127,703,568 bytes</strong> before you install a single package, and the
        JDK 26 installation is <strong>371 MB</strong>.
      </p>
      <p>
        That shows up as startup latency. Three hello-worlds, each run 25 times from a Python
        harness that measures wall-clock around <code>subprocess.run</code> (so every number
        includes a few hundred microseconds of harness overhead — the comparison is fair, the
        absolute floor is not):
      </p>

      <CodeBlock language="text" title="Real output — 25 runs each after 3 warmups, same machine">
{`C++  ./hello       min     4.0 ms   median     4.4 ms
Node node h.js     min    20.9 ms   median    21.6 ms     (Node v25.2.1)
Java java H        min    41.3 ms   median    43.9 ms     (JDK 26.0.1)`}
      </CodeBlock>

      <p>
        Roughly 5&times; Node and 10&times; Java, on a program that prints one line. That gap is
        entirely process setup: no dynamic loader work for a 122 MB binary, no JVM boot, no class
        loading. It is why C++ still owns CLI tools, embedded targets, game engines, and anything
        that has to be alive in single-digit milliseconds.
      </p>

      <h3>2. Zero-cost abstraction, meant literally</h3>
      <p>
        This phrase gets repeated so often it has stopped meaning anything, so here it is measured.
        Two pairs of functions. In each pair, one is the bare-metal version and one is wrapped in
        abstraction — a smart pointer that owns its allocation, and a struct with an overloaded{' '}
        <code>operator+</code>.
      </p>

      <CodeBlock language="cpp" title="zc3.cpp">
{`#include <memory>

// A raw pointer, passed by const reference.
int via_raw(int* const& p) { return *p; }

// A unique_ptr — owning, auto-freeing, move-only — passed by const reference.
int via_unique(const std::unique_ptr<int>& p) { return *p; }

// A wrapper struct with an overloaded operator+, versus the bare int add.
struct Cents { int v; };
Cents operator+(Cents a, Cents b) { return Cents{a.v + b.v}; }

int   add_int(int a, int b)       { return a + b; }
Cents add_cents(Cents a, Cents b) { return a + b; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S, arm64 assembly, directives stripped">
{`via_raw(int* const&):                     via_unique(const unique_ptr<int>&):
	ldr	x8, [x0]                              ldr	x8, [x0]
	ldr	w0, [x8]                              ldr	w0, [x8]
	ret                                       ret

add_int(int, int):                        add_cents(Cents, Cents):
	add	w0, w1, w0                            add	w0, w1, w0
	ret                                       ret`}
      </CodeBlock>

      <p>
        Byte-for-byte identical in both pairs — verified by extracting each function body from the{' '}
        <code>-S</code> output and comparing the instruction lists programmatically, not by eye.{' '}
        <code>std::unique_ptr</code> compiles to exactly a pointer. <code>operator+</code> on a
        wrapper struct compiles to exactly <code>add</code>; the out-of-line{' '}
        <code>operator+</code> is emitted as its own two-instruction function and then inlined away
        at the call site.
      </p>
      <p>
        This is the property that makes C++ different from &quot;C, but with nicer syntax.&quot; In
        Java, wrapping an <code>int</code> in a class costs you an object header, a heap allocation,
        and a pointer chase, and the JIT may or may not scalar-replace it. In C++ the abstraction
        has no representation at runtime at all. You are allowed to build real types — a{' '}
        <code>Cents</code> that cannot be accidentally added to a <code>Metres</code> — and pay
        nothing.
      </p>

      <InfoBox variant="warning" title="&quot;Zero-cost&quot; has two well-known exceptions and a third nobody mentions">
        <p>
          The classic two are <strong>exceptions</strong> and <strong>RTTI</strong>, which do have
          runtime and binary-size costs and are the reason some embedded and game codebases build
          with <code>-fno-exceptions -fno-rtti</code>. The third is{' '}
          <strong>compile time</strong>: the cost of a zero-cost abstraction is not zero, it is just
          paid by your build rather than your CPU. The next section puts a number on that, and{' '}
          <a href="/cpp/compiling">the next lesson</a> explains the mechanism.
        </p>
      </InfoBox>

      <h3>3. You control memory and layout</h3>
      <p>
        This is Phase 2&apos;s subject, so it gets one sentence here and a whole lesson later: in
        C++ you decide whether an object lives on the stack or the heap, you decide exactly how its
        fields are laid out in memory, and a <code>std::vector&lt;Point&gt;</code> is genuinely{' '}
        <em>N contiguous Points</em> — not N pointers to N separately-allocated heap objects, which
        is what a Java <code>ArrayList&lt;Point&gt;</code> is. For anything cache-sensitive, that one
        difference is most of the performance story.
      </p>

      <h2>What It Costs — Honestly</h2>

      <h3>Compile times, and why</h3>
      <p>
        Here is a translation unit that does nothing but print <code>hi</code>, with a header set
        you would plausibly find at the top of a real source file:
      </p>

      <CodeBlock language="cpp" title="heavy.cpp — sixteen standard headers and one statement">
{`#include <algorithm>
#include <chrono>
#include <expected>
#include <filesystem>
#include <format>
#include <map>
#include <memory>
#include <optional>
#include <print>
#include <ranges>
#include <regex>
#include <string>
#include <thread>
#include <unordered_map>
#include <variant>
#include <vector>
int main() { std::println("hi"); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Apple clang 21.0.0, libc++">
{`$ clang++ -std=c++23 -E heavy.cpp | wc -l
  109902

$ /usr/bin/time -p clang++ -std=c++23 -O2 heavy.cpp -o /dev/null
real 0.97
user 0.74
sys 0.09`}
      </CodeBlock>

      <p>
        <strong>109,902 lines</strong> of source reach the actual compiler, and it takes just under
        a second to turn them into a program that prints two characters. Individual headers, for
        scale:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -E <header> | wc -l">
{`<string>      23001 lines
<algorithm>   31324 lines
<vector>      40476 lines
<print>       44689 lines
<iostream>    56966 lines`}
      </CodeBlock>

      <p>
        Now multiply. That work is redone <em>per source file</em>, because each one is compiled in
        isolation and <code>#include</code> is literal text insertion. Fifty source files that each
        include <code>&lt;vector&gt;</code> parse <code>&lt;vector&gt;</code> fifty times. A
        thirty-second incremental build is not your project being large; it is the same standard
        library headers being re-read once per file. That is the mechanism behind every C++ build
        complaint you have ever heard, and <a href="/cpp/compiling">the next lesson</a> makes it
        concrete.
      </p>

      <h3>Undefined behaviour, which is the real one</h3>
      <p>
        Java has <code>ArrayIndexOutOfBoundsException</code>. JavaScript gives you{' '}
        <code>undefined</code>. Go panics. All three have the same property: when you do something
        wrong, something defined happens. C++ has a third category beyond &quot;works&quot; and
        &quot;fails&quot; — <strong>undefined behaviour</strong>, where the standard imposes no
        requirement at all, and the optimiser is entitled to assume you never do it.
      </p>
      <p>
        Here is the smallest honest demonstration. Signed integer overflow is UB, so the compiler
        may assume <code>x + 1</code> is always greater than <code>x</code>:
      </p>

      <CodeBlock language="cpp" title="ub1.cpp">
{`#include <print>
#include <climits>

bool grows(int x) { return x + 1 > x; }   // "obviously always true"

int main() {
    std::println("grows(INT_MAX) = {}", grows(INT_MAX));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — same source, same compiler, two optimisation levels">
{`$ clang++ -std=c++23 -O0 ub1.cpp -o ub1_O0 && ./ub1_O0
grows(INT_MAX) = false

$ clang++ -std=c++23 -O2 ub1.cpp -o ub1_O2 && ./ub1_O2
grows(INT_MAX) = true

$ clang++ -std=c++23 -Wall -Wextra -O2 ub1.cpp -o /dev/null
(no output — not one warning)`}
      </CodeBlock>

      <p>
        Sit with that for a second. <strong>The same program printed <code>false</code> at{' '}
        <code>-O0</code> and <code>true</code> at <code>-O2</code>.</strong> At <code>-O0</code> the
        addition actually happened, wrapped to <code>INT_MIN</code>, and the comparison was false.
        At <code>-O2</code> the optimiser reasoned &quot;signed overflow cannot happen, therefore{' '}
        <code>x + 1 &gt; x</code> is a tautology&quot; and folded the whole function to{' '}
        <code>return true</code>. Both are correct compilations of a program with no defined
        meaning. And <code>-Wall -Wextra</code> — the warning flags everyone tells you to
        enable — said nothing at all.
      </p>
      <p>
        This is why &quot;it compiles and the tests pass&quot; is a weaker statement in C++ than in
        any other language you use. Your debug build and your release build can genuinely disagree.
      </p>

      <InfoBox variant="danger" title="The tool that does catch it">
        <p>
          UB is not undetectable, it is just not detectable at compile time. The sanitizers
          instrument your program and check at runtime. On the exact same source:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -fsanitize=undefined -O0 ub1.cpp">
{`ub1.cpp:4:30: runtime error: signed integer overflow: 2147483647 + 1 cannot be
              represented in type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub1.cpp:4:30
grows(INT_MAX) = false`}
        </CodeBlock>
        <p>
          Exact file, line, column and reason. <code>-fsanitize=undefined</code> and{' '}
          <code>-fsanitize=address</code> should be on in every debug and CI build you control; they
          are the closest thing C++ has to the runtime safety net you are used to. They cost roughly
          2&ndash;3&times; runtime, which is why they are a debug tool rather than a default, and
          they only catch UB on paths you actually execute. Tooling gets its own lesson in Phase 5.
        </p>
      </InfoBox>

      <h3>Complexity, and the honest version of it</h3>
      <p>
        The C++23 standard is roughly two thousand pages. Nobody knows all of it, including the
        people who wrote it. The genuinely hard parts you will meet are overload resolution
        (covered in <a href="/cpp/functions">Functions</a>), object lifetime and ownership (Phase 2),
        and template error messages, which remain the worst developer experience in mainstream
        programming despite concepts making them meaningfully better in C++20.
      </p>
      <p>
        The mitigation is not learning everything. It is picking a subset and staying in it: modern
        C++ with RAII, value semantics, no raw <code>new</code>/<code>delete</code>, standard
        containers and algorithms. That subset is small, learnable, and is what this section
        teaches.
      </p>

      <h2>The Two Instincts You Have To Retire</h2>

      <h3>Instinct 1: something will clean up after me</h3>
      <p>
        There is no garbage collector. Not disabled, not pluggable — absent. (C++11 did add a set
        of hooks for a hypothetical GC; C++23 removed them again, unused.)
      </p>
      <p>
        What C++ has instead is better for most purposes, and it is the thing to actually internalise:
        <strong> when a local object goes out of scope, its destructor runs. Immediately.
        Deterministically. At that closing brace.</strong>
      </p>

      <CodeBlock language="cpp" title="raii.cpp">
{`#include <print>
#include <string>
#include <utility>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) {
        std::println("  + acquired {}", name);
    }
    ~Tracer() {
        std::println("  - released {}", name);
    }
};

void work() {
    Tracer outer{"outer"};
    {
        Tracer inner{"inner"};
        std::println("  . inside the inner scope");
    }                                  // inner dies HERE, not "eventually"
    std::println("  . back in work(), inner is already gone");
}                                      // outer dies HERE

int main() {
    std::println("before work()");
    work();
    std::println("after work()");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 raii.cpp && ./raii">
{`before work()
  + acquired outer
  + acquired inner
  . inside the inner scope
  - released inner
  . back in work(), inner is already gone
  - released outer
after work()`}
      </CodeBlock>

      <p>
        Every one of those lines happened at a point you can name by looking at the source.
        Contrast the Java equivalent: a <code>finalize</code> method (deprecated, then removed) ran
        at an unspecified time or never, which is precisely why Java needed{' '}
        <code>try-with-resources</code> and <code>AutoCloseable</code> bolted on, and why Node needs{' '}
        <code>try/finally</code> around every <code>fs</code> handle. C++ needs neither, because
        destruction is not a feature of a cleanup block — it is a feature of the scope.
      </p>
      <p>
        This mechanism is called <strong>RAII</strong> (Resource Acquisition Is Initialisation), and
        it generalises past memory to every resource: file handles, sockets, mutexes, database
        transactions. It is the single most important idea in the language and it gets a full
        treatment in Phase 2.
      </p>

      <InfoBox variant="success" title="The compensation is real">
        <p>
          Losing a GC sounds like a downgrade until you notice what you get: no pause times, no heap
          tuning, no <code>-Xmx</code>, no generational nursery, and a destructor ordering you can
          reason about from the source. Memory is <em>one</em> of the resources RAII manages, and it
          is not even the most interesting one. The mutex that unlocks itself on every exit path
          including an exception is worth more than the collector you gave up.
        </p>
      </InfoBox>

      <h3>Instinct 2: objects are handles</h3>
      <p>
        In Java, <code>User b = a;</code> gives you a second name for one object. In JavaScript the
        same. In C++ it gives you a second object, deep-copied, including every heap buffer the
        first one owned.
      </p>

      <CodeBlock language="cpp" title="values2.cpp">
{`#include <print>
#include <string>
#include <vector>

struct User {
    std::string name;           // long enough to live on the heap, not in SSO
    std::vector<int> scores;
};

int main() {
    User a{"ada-lovelace-first-programmer", {1, 2, 3}};
    User b = a;                 // one '=' — a full deep copy

    b.name = "alan-turing-also-quite-good";
    b.scores.push_back(4);

    std::println("a: {} / {} scores", a.name, a.scores.size());
    std::println("b: {} / {} scores", b.name, b.scores.size());
    std::println("a.name heap buffer == b.name heap buffer? {}", a.name.data() == b.name.data());
    std::println("a.scores buffer    == b.scores buffer?    {}", a.scores.data() == b.scores.data());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 values2.cpp && ./values2">
{`a: ada-lovelace-first-programmer / 3 scores
b: alan-turing-also-quite-good / 4 scores
a.name heap buffer == b.name heap buffer? false
a.scores buffer    == b.scores buffer?    false`}
      </CodeBlock>

      <p>
        Two separate string buffers, two separate vector buffers, from one <code>=</code>. Nobody
        wrote a copy constructor; the compiler generated one that copies each member, and{' '}
        <code>std::string</code> and <code>std::vector</code> each copy their own storage. In Java
        this program would have printed <code>true</code> twice and <code>a</code> would have
        changed too.
      </p>
      <p>
        (The deliberately long names are not decoration. Short strings live inside the{' '}
        <code>std::string</code> object itself under the small-string optimisation, so comparing{' '}
        <code>data()</code> for <code>&quot;ada&quot;</code> would be comparing two member addresses
        and would prove nothing about the heap. Making them long forces a real allocation so the
        comparison means what it looks like it means.)
      </p>

      <FlowChart
        title="One assignment, two object models"
        chart={
          'graph TD\n' +
          '  subgraph JVMJS["Java / JavaScript: the variable holds a handle"]\n' +
          '    JA["User a"] --> JH["heap object<br/>name, scores"]\n' +
          '    JB["User b = a"] --> JH\n' +
          '    JH --> JG["freed whenever<br/>the collector gets to it"]\n' +
          '  end\n' +
          '  subgraph CPP["C++: the variable IS the object"]\n' +
          '    CA["User a<br/>name + scores live HERE"] --> CAH["its own heap buffers"]\n' +
          '    CB["User b = a<br/>a separate object"] --> CBH["its own heap buffers,<br/>deep-copied"]\n' +
          '    CA --> CD["destructor at the closing brace,<br/>frees CA buffers"]\n' +
          '    CB --> CD2["destructor at the closing brace,<br/>frees CB buffers"]\n' +
          '  end\n' +
          '  style JH fill:#3d2f14,stroke:#fb923c\n' +
          '  style JG fill:#3b1a1a,stroke:#f87171\n' +
          '  style CD fill:#1a3329,stroke:#4ade80\n' +
          '  style CD2 fill:#1a3329,stroke:#4ade80'
        }
      />

      <p>
        Everything downstream follows from that diagram. Why C++ has a copy constructor, a move
        constructor, and five special member functions you have to think about. Why{' '}
        <code>std::move</code> exists. Why passing a parameter by value can be a performance bug and
        why it can also be the fastest option. Why <code>const T&amp;</code> is the default
        parameter form in every C++ style guide. All of it is this one fact.{' '}
        <a href="/cpp/references">Values, References &amp; Pointers</a> — the last lesson of this
        phase — is dedicated to it.
      </p>

      <h2>Where the Language Actually Is</h2>
      <p>
        A tour of what C++20 and C++23 added that changes how you write day-to-day code. This
        compiles and runs as shown:
      </p>

      <CodeBlock language="cpp" title="tour.cpp">
{`#include <concepts>
#include <expected>
#include <print>
#include <span>
#include <string>
#include <string_view>

// C++20: concepts replace SFINAE for constraining templates.
template <std::integral T>
T double_it(T v) { return v * 2; }

// C++20: the spaceship operator generates all six comparisons.
struct Version {
    int major, minor;
    auto operator<=>(const Version&) const = default;
};

// C++23: std::expected — a return value that is either a result or an error.
std::expected<int, std::string> parse_port(std::string_view s) {
    int out = 0;
    for (char c : s) {
        if (c < '0' || c > '9') return std::unexpected("not a number: " + std::string(s));
        out = out * 10 + (c - '0');
    }
    if (out > 65535) return std::unexpected("port out of range");
    return out;
}

// C++20: std::span — a non-owning view over contiguous memory.
int sum(std::span<const int> xs) {
    int t = 0;
    for (int x : xs) t += x;
    return t;
}

int main() {
    std::println("double_it(21)        = {}", double_it(21));
    std::println("v1 < v2              = {}", Version{1, 9} < Version{2, 0});
    std::println("parse_port(\\"8080\\")   = {}", parse_port("8080").value());
    std::println("parse_port(\\"80a0\\")   = {}", parse_port("80a0").error());
    int arr[] = {1, 2, 3, 4};
    std::println("sum(arr)             = {}", sum(arr));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 tour.cpp && ./tour">
{`double_it(21)        = 42
v1 < v2              = true
parse_port("8080")   = 8080
parse_port("80a0")   = not a number: 80a0
sum(arr)             = 10`}
      </CodeBlock>

      <p>
        Five things in that file are worth noticing, because each replaces something you may
        remember doing the hard way:
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Modern C++</th>
            <th style={headStyle}>What it replaces</th>
            <th style={headStyle}>Closest thing you know</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::integral T</code> (concepts, C++20)</td>
            <td style={cellStyle}><code>enable_if</code> / SFINAE and its 400-line errors</td>
            <td style={cellStyle}>a Java bounded type parameter, but checked better</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>operator&lt;=&gt; = default</code> (C++20)</td>
            <td style={cellStyle}>hand-writing all six comparison operators</td>
            <td style={cellStyle}>a Java <code>record</code> getting <code>equals</code> free</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::expected&lt;T, E&gt;</code> (C++23)</td>
            <td style={cellStyle}>out-params, error codes, or an exception</td>
            <td style={cellStyle}>Go&apos;s <code>(T, error)</code>; Rust&apos;s <code>Result</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::span&lt;const int&gt;</code> (C++20)</td>
            <td style={cellStyle}>a <code>(pointer, length)</code> parameter pair</td>
            <td style={cellStyle}>a Go slice, non-owning</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::println</code> (C++23)</td>
            <td style={cellStyle}><code>printf</code> format-string bugs, or <code>cout &lt;&lt;</code> chains</td>
            <td style={cellStyle}>a type-checked template literal</td>
          </tr>
        </tbody>
      </table>

      <p>
        Note the <code>sum(arr)</code> call: a raw C array converted to a <code>std::span</code>{' '}
        implicitly, carrying its length with it. Passing an array to a function has been one of
        C++&apos;s sharpest edges for thirty years — the length silently disappears — and{' '}
        <code>span</code> is the fix. <a href="/cpp/references">The last lesson in this phase</a>{' '}
        covers the decay that makes this necessary.
      </p>

      <InfoBox variant="info" title="And C++26 — what is actually available here, as opposed to announced">
        <p>
          <code>-std=c++26</code> compiles on this toolchain, but it is a partial implementation of
          a standard that is still in its final stage. Verified by probing feature-test macros with
          this compiler rather than reading a release note:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++26, feature-test macros printed at runtime">
{`__cplusplus          = 202400     <- a draft placeholder, not 202600
__cpp_pack_indexing  = 202311     <- C++26 pack indexing: available
__cpp_static_assert  = 202306     <- user-generated static_assert messages: available
__cpp_deleted_function = 202403   <- '= delete("reason")': available
contracts:  not defined
reflection: not defined`}
        </CodeBlock>
        <p>
          And the headline C++26 feature, static reflection, is simply not there:{' '}
          <code>#include &lt;meta&gt;</code> gives{' '}
          <code>fatal error: &apos;meta&apos; file not found</code>, and the <code>^^</code>{' '}
          reflection operator is parsed as a block pointer, producing{' '}
          <code>error: type name requires a specifier or qualifier</code>. So: C++26 is real, it is
          coming, it will matter enormously for serialisation and binding code — and you cannot use
          its interesting parts on this machine today. This section targets C++23 and will mention
          C++26 only where it genuinely changes an answer.
        </p>
      </InfoBox>

      <h2>One Surprise From Building This Lesson</h2>
      <p>
        Worth recording because it contradicts received wisdom. The folklore is that{' '}
        <code>&lt;iostream&gt;</code> is the bloated option and <code>std::print</code> is the lean
        modern replacement. Measured on this toolchain, for the identical hello-world, the opposite
        is true:
      </p>

      <CodeBlock language="text" title="Real output — both -O2, both stripped and unstripped">
{`std::println version (#include <print>)      123032 bytes   (103680 stripped)
std::cout   version (#include <iostream>)     35944 bytes   ( 35272 stripped)

compile time, std::println :  real 0.70
compile time, std::cout    :  real 0.39`}
      </CodeBlock>

      <p>
        The <code>std::print</code> build is <strong>3.4&times; larger and 1.8&times; slower to
        compile</strong> here. The reason is structural, not a bug: iostream&apos;s machinery already
        lives inside <code>/usr/lib/libc++.1.dylib</code>, so your binary just calls into it,
        whereas <code>std::format</code> is templates that get instantiated into <em>your</em>{' '}
        object file. Keep using <code>std::println</code> — it is type-safe, far harder to misuse
        than <code>printf</code>, and 90 KB is irrelevant on a desktop. But if you ever repeat
        &quot;iostream is bloated&quot; as a reason, check it on your own toolchain first. This is
        the habit the whole section is built on: measure the thing, on the compiler you actually
        have.
      </p>

      <h2>Where This Section Goes</h2>
      <p>
        Phase 1 — this phase — builds the model you need before memory makes any sense:
      </p>
      <ol>
        <li>
          <strong>This lesson.</strong> Orientation: dialects, trade-offs, the two instincts.
        </li>
        <li>
          <a href="/cpp/compiling">Compiling, Linking &amp; the One-Definition Rule</a> — the build
          model Java and Node developers simply do not have, run stage by stage, including the
          difference between a compiler error and a linker error.
        </li>
        <li>
          <a href="/cpp/types">Types, auto &amp; Control Flow</a> — real <code>sizeof</code> values
          from this machine, why mixing signed and unsigned bites,{' '}
          <code>const</code>/<code>constexpr</code>/<code>consteval</code>, and{' '}
          <code>std::string</code> versus <code>const char*</code>.
        </li>
        <li>
          <a href="/cpp/functions">Functions, Overloading &amp; Lambdas</a> — what actually gets
          copied when you pass an argument, how overload resolution picks, and lambdas including the
          dangling-capture trap.
        </li>
        <li>
          <a href="/cpp/references">Values, References &amp; Pointers</a> — the full version of
          Instinct 2, plus <code>const</code> correctness and array decay. This is the bridge into
          the memory phase.
        </li>
      </ol>
      <p>
        Later phases cover the memory model and RAII in full, OOP and templates, the STL and
        ranges, and performance and tooling. Each one assumes this phase.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          The UB demonstration above is the one to keep in mind. In every other language you use,
          the set of things a program can do is bounded: it computes a result, or it throws, or it
          returns <code>undefined</code>. In C++ there is a fourth option where the compiler is
          licensed to assume your bug cannot happen and to optimise on that basis — and a program
          that prints <code>false</code> in debug and <code>true</code> in release is not a freak
          case, it is a four-line function.
        </p>
        <p>
          The practical consequence is a habit, not a fear: turn on{' '}
          <code>-Wall -Wextra -fsanitize=undefined,address</code> in your debug builds today, before
          you write anything you care about. You just watched <code>-Wall -Wextra</code> miss this
          one entirely, so the sanitizers are the part that matters.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Intro;
