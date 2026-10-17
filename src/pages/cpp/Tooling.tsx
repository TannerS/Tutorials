import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Tooling() {
  return (
    <LessonLayout
      title="Build Systems, Debugging & Sanitizers"
      sectionId="cpp"
      lessonIndex={19}
      prev={{ path: '/cpp/performance', label: 'Performance: Cache, Copies & Undefined Behaviour' }}
      next={{ path: '/cpp/cheatsheet', label: 'C++ Field Guide' }}
    >
      <p>
        The last lesson before the field guide, and the one that decides whether everything else in
        this section actually protects you. The language gives you undefined behaviour in a dozen
        forms; the tooling is what turns that from a production incident into a failing CI job.
      </p>

      <p>
        Set expectations honestly first: coming from <code>npm install</code>, C++'s dependency
        story is the worst part of the ecosystem, and nothing in this lesson fixes that. What it
        can do is get your warnings, sanitizers and debugger configured so the compiler works for
        you instead of silently accepting broken code.
      </p>

      <h2>CMake</h2>

      <InfoBox variant="note" title="Described, not executed">
        <code>cmake</code> is not installed on the machine these lessons were written against, so
        unlike everything else in this section the CMake snippets below were <strong>not run</strong>.
        They are written from the documented modern-CMake style rather than captured from a real
        build. Every other output block in this lesson is genuine.
      </InfoBox>

      <p>
        CMake is not a build system — it generates one (Makefiles, Ninja, an Xcode or Visual Studio
        project). It is unloved and universal, and "modern CMake" means thinking in{' '}
        <strong>targets</strong> rather than global flag soup.
      </p>

      <CodeBlock language="cmake" title="CMakeLists.txt — a minimal modern one">
{`cmake_minimum_required(VERSION 3.20)
project(myapp LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)        # -std=c++23, not -std=gnu++23

add_library(core
    src/engine.cpp
    src/parser.cpp
)
# PUBLIC  -> propagates to anything linking 'core'
# PRIVATE -> applies only when building 'core' itself
target_include_directories(core PUBLIC include)
target_compile_options(core PRIVATE -Wall -Wextra -Wpedantic)

add_executable(myapp src/main.cpp)
target_link_libraries(myapp PRIVATE core)`}
      </CodeBlock>

      <CodeBlock language="bash" title="Configure, then build">
{`cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build -j

# a separate directory per configuration — this is the point of out-of-source builds
cmake -S . -B build-asan -DCMAKE_BUILD_TYPE=Debug \\
      -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined -O0 -g"`}
      </CodeBlock>

      <InfoBox variant="warning" title="The advice you will find online is mostly for CMake 2">
        Anything using <code>include_directories()</code>, <code>add_definitions()</code> or{' '}
        <code>CMAKE_CXX_FLAGS</code> as the primary mechanism is the old global style — it applies
        settings to everything and composes badly. The <code>target_*</code> family with explicit{' '}
        <code>PUBLIC</code>/<code>PRIVATE</code>/<code>INTERFACE</code> scope is the modern
        equivalent, and the distinction matters as soon as you have more than one target.
      </InfoBox>

      <h2>Dependencies, Honestly</h2>

      <p>
        There is no npm. There is no single registry, no lockfile everyone agrees on, and no
        command that reliably fetches a library and makes it available. These are the partial
        answers:
      </p>

      <CodeBlock language="text" title="The realistic options">
{`SYSTEM PACKAGES    apt / brew install the library globally.
                   Easy, but the version is whatever the distro ships
                   and it is not reproducible across machines.

FetchContent       CMake downloads and builds the dependency as part
                   of your build. No extra tool. Slow — you compile
                   the whole dependency — and transitive deps get messy.

vcpkg              Microsoft's. Large catalogue, manifest mode gives
                   you something lockfile-shaped. Builds from source,
                   so a cold build can take a very long time.

Conan              Binary packages, so faster cold builds. More moving
                   parts, its own profile system to learn.

VENDORING          Commit the source into your repo. Still genuinely
                   common in C++, and for one or two small headers it
                   is often the correct answer rather than a surrender.`}
      </CodeBlock>

      <p>
        For a header-only library, vendoring the header is frequently the least-bad choice. For
        anything substantial, pick vcpkg or Conan at the start of the project — retrofitting one
        onto an established build is considerably more painful than adopting it on day one.
      </p>

      <h2>Warnings Are the Cheapest Tool You Have</h2>

      <CodeBlock language="bash" title="What to turn on">
{`-Wall -Wextra -Wpedantic        # the baseline. Not optional.
-Wshadow                        # a local shadowing an outer name
-Wconversion                    # narrowing conversions (noisy, worth it)
-Wnon-virtual-dtor              # see below — NOT in -Wall or -Wextra
-Werror                         # in CI only, never in local dev`}
      </CodeBlock>

      <InfoBox variant="danger" title="-Wnon-virtual-dtor is in neither -Wall nor -Wextra">
        <p>
          Measured while writing <a href="/cpp/inheritance">the inheritance lesson</a>: a base class
          with virtual functions and a non-virtual destructor produces no warning under{' '}
          <code>-Wall -Wextra</code> at the class declaration. <code>-Wall</code> does warn at the{' '}
          <code>delete</code> site — but that is often in a different file, written by someone else,
          long after the class was declared.
        </p>
        <p>
          Add <code>-Wnon-virtual-dtor</code> explicitly. It catches the bug where it is actually
          introduced, and that bug is undefined behaviour.
        </p>
      </InfoBox>

      <p>
        <code>-Werror</code> belongs in CI and not on your laptop. In CI it prevents warnings
        accumulating until nobody reads them. Locally it turns an unrelated warning into a hard
        stop while you are mid-thought, which teaches people to disable warnings entirely.
      </p>

      <h2>Debugging With lldb</h2>

      <p>
        <code>lldb</code> is what ships with clang on macOS; <code>gdb</code> is the GNU
        equivalent and the commands are close enough to translate. Compile with <code>-g</code>{' '}
        for debug info and <code>-O0</code> so the code you step through still resembles the code
        you wrote.
      </p>

      <CodeBlock language="cpp" title="crash.cpp — a deliberate off-by-one">
{`int sum(const std::vector<int>& v) {
    int total = 0;
    for (size_t i = 0; i <= v.size(); ++i) total += v[i];   // <= is the bug
    return total;
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="A real session — batch mode, so it is reproducible">
{`$ clang++ -std=c++23 -g -O0 crash.cpp -o crash
$ lldb -b -o "breakpoint set -f crash.cpp -l 5" \\
       -o "run" -o "frame variable i total" ./crash`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`Breakpoint 1: where = crash\`sum(...) + 20 at crash.cpp:5:17
Process 79230 launched: '/tmp/dbg/crash' (arm64)
Process 79230 stopped
* thread #1, queue = 'com.apple.main-thread', stop reason = breakpoint 1.1
    frame #0: crash\`sum(v=size=3) at crash.cpp:5:17
   4       int total = 0;
-> 5       for (size_t i = 0; i <= v.size(); ++i) total += v[i];
   6       return total;

(size_t) i = 6171912064`}
      </CodeBlock>

      <p>
        Two things in that output are worth noticing. <code>v=size=3</code> — lldb understands
        standard containers and prints the size rather than raw pointers. And{' '}
        <code>i = 6171912064</code>, which is uninitialised stack garbage at the moment the
        breakpoint hit, before the loop's initialiser ran. Reading a variable before its
        initialisation executes shows you exactly that, and it is a useful habit to notice rather
        than be confused by.
      </p>

      <CodeBlock language="text" title="The commands worth memorising">
{`b main / b file.cpp:42      breakpoint
r                           run
n / s                       next (over) / step (into)
c                           continue
fin                         finish the current frame
bt                          backtrace
fr v                        frame variables
p expr                      evaluate an expression
watch set var x             break when x changes
q                           quit`}
      </CodeBlock>

      <InfoBox variant="tip" title="A sanitizer usually beats a debugger">
        For a memory bug, reach for AddressSanitizer before lldb. The sanitizer tells you the bug
        class, the faulting address, the allocation site and the free site in one report —
        information you would otherwise spend a long session reconstructing by hand. Use the
        debugger for logic errors, where you need to watch state evolve.
      </InfoBox>

      <h2>The Sanitizer Matrix</h2>

      <p>
        This section measured sanitizer behaviour in three different lessons. Consolidated, for
        this platform — Apple clang 21 on arm64-apple-darwin — and all of it observed rather than
        taken from documentation:
      </p>

      <CodeBlock language="text" title="What actually works here">
{`-fsanitize=address              ✅ works
   use-after-free                ✅
   heap/stack buffer overflow    ✅
   double free                   ✅
   use-after-SCOPE               ⚠  -O0 ONLY. Not -Og, not -O1.
   use-after-RETURN              ⚠  opt-in at runtime:
                                    ASAN_OPTIONS=detect_stack_use_after_return=1

-fsanitize=undefined            ✅ works
   signed overflow, bad shifts, null deref, misaligned access

-fsanitize=thread               ✅ works — caught races at BOTH -O0 and -O2

-fsanitize=leak                 ❌ UNSUPPORTED on this target
   clang++: error: unsupported option '-fsanitize=leak'
   ASAN_OPTIONS=detect_leaks=1 -> "not supported on this platform"`}
      </CodeBlock>

      <InfoBox variant="danger" title="A weaker sanitizer config looks exactly like a clean run">
        <p>
          The <code>-O0</code> constraint is the one that costs people. Build your sanitizer job at{' '}
          <code>-O1</code> for speed and use-after-scope stops being reported — the build still
          succeeds, the sanitizer still runs, the suite still passes. Nothing anywhere tells you
          that an entire bug class is no longer being checked.
        </p>
        <p>
          Likewise, if you are coming from Linux and expect <code>detect_leaks</code> to work, it
          does not here. A CI matrix that only runs macOS has no leak detection at all.
        </p>
      </InfoBox>

      <FlowChart
        title="What Each Stage Can Catch"
        chart={
          'graph LR\n' +
          '  W["compile<br/>-Wall -Wextra -Wnon-virtual-dtor"] --> S["static analysis<br/>clang-tidy"]\n' +
          '  S --> T["tests + sanitizers<br/>ASan · UBSan · TSan"]\n' +
          '  T --> P["production"]\n' +
          '  W -.->|"cheapest, instant"| C1["typos, shadowing,<br/>missing virtual dtor"]\n' +
          '  S -.->|"seconds"| C2["dead code, bad casts,<br/>style violations"]\n' +
          '  T -.->|"2-20x slower"| C3["UB, races, leaks,<br/>memory corruption"]\n' +
          '  P -.->|"too late"| C4["the incident"]\n' +
          '  style W fill:#1a3329,stroke:#4ade80\n' +
          '  style P fill:#3b1a1a,stroke:#f87171\n' +
          '  style C4 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <p>
        Each stage left to right costs more and catches later. The economics strongly favour
        pushing work leftward — a warning costs nothing and fires instantly, while a sanitizer runs
        2–20× slower and only catches what your tests actually execute.
      </p>

      <h2>Static Analysis and Formatting</h2>

      <p>
        Neither <code>clang-tidy</code> nor <code>clang-format</code> is installed on this machine
        (verified — both are absent from a stock Xcode command-line-tools install and ship with the
        full LLVM distribution). Both are worth adding:
      </p>

      <CodeBlock language="bash" title="What they do">
{`clang-tidy src/*.cpp -- -std=c++23
#   modernize-*      raw loops -> range-for, NULL -> nullptr
#   bugprone-*       likely-wrong patterns
#   performance-*    needless copies, pass-by-value misuse
#   cppcoreguidelines-*  the Core Guidelines, mechanically checked

clang-format -i src/*.cpp        # settle formatting arguments permanently`}
      </CodeBlock>

      <p>
        The <code>performance-*</code> checks are the ones that pay for themselves fastest — they
        find the accidental copies that <a href="/cpp/performance">the previous lesson</a> covered,
        at build time rather than in a profile.
      </p>

      <h2>Profiling on This Platform</h2>

      <p>
        <code>perf</code> is Linux-only and <code>valgrind</code> is not available here either.
        What this machine does have:
      </p>

      <CodeBlock language="bash" title="Verified present">
{`sample <pid> <seconds>     # stack sampling, ships with macOS
xctrace record --template "Time Profiler" --launch ./app
                           # the Instruments engine, from the CLI

# portable and often enough: just time the thing
std::chrono::steady_clock around the suspect region`}
      </CodeBlock>

      <InfoBox variant="tip" title="Measure before you optimise, and measure the right build">
        Profile a <code>-O2</code> build. Profiling <code>-O0</code> tells you about code the
        optimiser was going to delete, which sends you off optimising something that does not exist
        in the binary you ship.
      </InfoBox>

      <h2>What To Turn On In CI</h2>

      <CodeBlock language="text" title="The practical checklist">
{`BUILD JOB
  □ -std=c++23 -Wall -Wextra -Wpedantic -Wnon-virtual-dtor
  □ -Werror  (CI only, never local)
  □ build Debug AND Release — UB often only appears optimised

TEST JOB — ASan + UBSan
  □ -O0 -g -fsanitize=address,undefined
  □ ASAN_OPTIONS=detect_stack_use_after_return=1
  □ -O0 specifically: -O1 silently loses use-after-scope

TEST JOB — TSan  (SEPARATE: cannot combine with ASan)
  □ -fsanitize=thread
  □ run the concurrency tests repeatedly — races are probabilistic

STATIC
  □ clang-tidy with bugprone-*, performance-*, modernize-*
  □ clang-format --dry-run --Werror

IF YOU ALSO BUILD ON LINUX
  □ add a Linux job for LeakSanitizer — it does not exist on macOS`}
      </CodeBlock>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Think in CMake targets</strong>, not global flags — and treat most CMake advice
        online as written for a version two decades old.{' '}
        <strong>Dependency management is genuinely worse than npm</strong>; pick vcpkg or Conan at
        project start rather than retrofitting, and accept that vendoring a small header is often
        correct. <strong>Warnings are the cheapest defence</strong> — and add{' '}
        <code>-Wnon-virtual-dtor</code> explicitly, because it is in neither <code>-Wall</code> nor{' '}
        <code>-Wextra</code> despite catching undefined behaviour.{' '}
        <strong>Reach for a sanitizer before a debugger</strong> on memory bugs; use lldb for logic
        errors. <strong>Build the sanitizer job at <code>-O0</code></strong>, enable{' '}
        <code>detect_stack_use_after_return</code>, run TSan as a separate job, and know that{' '}
        <strong>LeakSanitizer does not exist on macOS</strong> — if that matters, you need a Linux
        runner. And <strong>profile the optimised build</strong>, since the debug build is not the
        program you ship.
      </p>
    </LessonLayout>
  );
}
