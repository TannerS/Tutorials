import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function CppCheatsheet() {
  return (
    <GuideLayout
      title="C++"
      kicker="FIELD GUIDE"
      glyph="⚙️"
      tagline="Written for a Node backend who knows Java and has rusty C++ — every size, flag and output here was compiled and run, not recalled."
      meta={['C++23 · clang 21 · arm64', 'measured, not assumed', '20 panels']}
      page="1 / 1"
      footer="The twenty lessons in this section carry the reasoning and the worked examples; this page is the recall sheet."
      prev={{ path: '/cpp/mini-guide', label: 'C++ Mini Guide' }}
      next={null}
    >
      <GuidePanel n={1} title="What Inverts Coming From Java / Node" accent="red" glyph="🔄" span={2}>
        <GuideTable
          head={['Your instinct', 'C++']}
          rows={[
            ['objects are references', 'objects are VALUES — assignment copies'],
            ['the GC cleans up', 'destructors run deterministically, at scope exit'],
            ['compilation is one step', 'preprocess → compile → assemble → LINK'],
            ['"it compiled" = correct', 'undefined behaviour says otherwise'],
            ['methods are virtual', 'non-virtual by default — the opposite'],
            ['generics erase', 'templates INSTANTIATE — distinct type per arg'],
            ['map is a hash map', 'map is a TREE; unordered_map is the hash map'],
            ['exceptions are normal', 'contested; banned outright in games/embedded'],
            ['a data race = wrong value', 'a data race = UNDEFINED BEHAVIOUR'],
          ]}
        />
        <GuideRules items={[
          'From C++ itself: no pointer arithmetic worries if you stay in modern C++ — but UB is everywhere the older language still shows through.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Build & Run" accent="purple" glyph="🔧">
        <GuideCode>{`clang++ -std=c++23 -Wall -Wextra -g main.cpp -o app

-E   preprocess only     -S   emit assembly
-c   compile, no link    -O0/-O1/-O2/-O3/-Os

# cross-TU failures are LINKER errors, not compiler errors:
#   "undefined symbol"   -> declared, never defined
#   "duplicate symbol"   -> defined twice (ODR violation)`}</GuideCode>
        <GuideRules items={[
          'A header is pasted in textually. #pragma once or include guards, always.',
          'Declaration vs definition is the distinction the linker cares about.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Types & Zero-Cost Gotchas" accent="green" glyph="🔢">
        <GuideCode>{`// sizes are IMPLEMENTATION-DEFINED. On arm64-apple-darwin:
int 4   long 8   long double 8   (not 16 — measured)

#include <cstdint>
int32_t / uint64_t      // when the width actually matters

auto x = expr;          // deduces, strips references/const
const    runtime constant
constexpr  usable at compile time
consteval  MUST run at compile time

int{3.5};               // ✗ narrowing — rejected by braces
std::string_view sv;    // non-owning — outlives its data = dangling`}</GuideCode>
        <GuideRules items={[
          'Mixing signed and unsigned in a comparison converts the signed operand. -Wall catches the common cases; it does not catch all of them.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Values, References, Pointers" accent="amber" glyph="📍" span={2}>
        <GuideCode>{`T        a copy
T&       alias — must be initialised, CANNOT be reseated
const T& read-only alias — the default for "pass without copying"
T*       rebindable, nullable, has its own address

const T*  pointer to const T     (data is const)
T* const  const pointer to T     (pointer is const)

// Everything is pass-by-value, pointers included:
void f(int* p) { *p = 99; }   // writes THROUGH  -> caller sees it
void g(int* p) { p = &other; } // rebinds a COPY  -> caller does not`}</GuideCode>
        <GuideRules items={[
          'A dangling reference is worse than a null pointer: there is nothing to check.',
          'Return a pointer/reference to a local and it dangles — unlike Go, where escape analysis makes it safe.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Object Lifetime" accent="pink" glyph="⏳">
        <GuideCode>{`automatic   scope-bound       destroyed at }
static      program lifetime
dynamic     new/delete        yours to manage
thread      thread_local

// Destruction is REVERSE declaration order:
{ A a; B b; C c; }   // ~C, ~B, ~A`}</GuideCode>
        <GuideRules items={[
          'Lifetime is THE organising concept of C++. Java defers it to the GC; C++ ties it to scope and makes it the compiler\'s job.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="RAII — the Idea That Defines C++" accent="cyan" glyph="🎁" span={2}>
        <GuideCode>{`// Resource lifetime == object lifetime. The destructor is GUARANTEED,
// including when an exception unwinds the stack.
{
    std::lock_guard lk(mtx);      // locked
    std::ofstream f("out.txt");   // opened
    may_throw();
}                                  // closed, then unlocked — on EVERY path`}</GuideCode>
        <GuideTable
          head={['Language', 'Mechanism', 'Cost']}
          rows={[
            ['Java', 'try-with-resources', 'opt-in, per use site'],
            ['Go', 'defer', 'opt-in, per use site'],
            ['JavaScript', '(none)', 'finally, by hand'],
            ['C++', 'destructor', 'automatic, once, in the type'],
          ]}
        />
        <GuideRules items={[
          'Write it once in the type and every user gets it free — that is the whole argument.',
          'A raw owning pointer in modern C++ is almost always a bug.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Smart Pointers" accent="blue" glyph="🧠" span={2}>
        <GuideCode>{`auto u = std::make_unique<T>(args);   // DEFAULT. move-only, zero overhead
auto s = std::make_shared<T>(args);   // shared ownership, atomic refcount
std::weak_ptr<T> w = s;               // breaks CYCLES, does not own`}</GuideCode>
        <GuideRules items={[
          'unique_ptr is the default. shared_ptr is the exception — it costs a control block and ATOMIC refcount traffic.',
          'shared_ptr is NOT "the safe one" because it resembles a Java reference. Two shared_ptrs pointing at each other leak forever; weak_ptr is the fix.',
          'make_shared does ONE allocation for object + control block. shared_ptr(new T) does two.',
          'Most functions should take T& or T*, not a smart pointer — take a smart pointer only if you are taking OWNERSHIP.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Move Semantics" accent="purple" glyph="➡️" span={2}>
        <GuideCode>{`T(T&& other) noexcept;              // move ctor
T& operator=(T&& other) noexcept;   // move assign

std::move(x)    // a CAST to rvalue. Moves NOTHING by itself.
std::forward<T>(x)  // preserves value category in a template

// A moved-from object is VALID but UNSPECIFIED. Assign before reuse.`}</GuideCode>
        <GuideRules items={[
          'Mark moves noexcept or std::vector will COPY instead of move when it reallocates — it needs the strong guarantee.',
          'Copy elision / RVO removes copies you expect to observe. Instrumenting often shows fewer constructor calls than you predicted, and that is the compiler being correct.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Rule of Zero / Three / Five" accent="green" glyph="5️⃣">
        <GuideCode>{`// RULE OF ZERO — aim here. Own nothing raw; let members manage themselves.
struct Good { std::string name; std::vector<int> data; };

// RULE OF FIVE — if you define ONE, you likely need all five:
~T(); T(const T&); T& operator=(const T&); T(T&&); T& operator=(T&&);

= default;   // generate it
= delete;    // forbid it`}</GuideCode>
        <GuideRules items={[
          'Declaring a destructor SUPPRESSES implicit move generation — the class silently falls back to copying.',
          'Members are initialised in DECLARATION order, not initialiser-list order. -Wall warns.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Inheritance & vtables" accent="red" glyph="🧬" span={2}>
        <GuideCode>{`struct Base {
    virtual ~Base() = default;        // ← REQUIRED if deleting via Base*
    virtual void f();
};
struct Derived : Base {
    void f() override;                // 'override' is not optional politeness
};

// MEASURED on arm64:
struct { int32_t a; };               // 4 bytes
struct { int32_t a; virtual void f(); };  // 16 bytes (8 vptr + 4 + 4 pad)
// +10 more virtuals -> still 16. ONE vptr, not one per function.`}</GuideCode>
        <GuideRules items={[
          'Non-virtual by default. Forget `virtual` and the base version is called silently — no error, no warning.',
          'No virtual destructor + delete via Base* = UB. Concrete base: silent leak. Abstract base: clang emits brk and TRAPS.',
          'override catches signature mismatches at compile time: wrong constness, wrong parameter type, misspelled name.',
          'SLICING: `Base b = derived;` copies only the Base part. Has no Java analogue — it falls out of value semantics.',
          'A virtual call is ~0.7ns vs ~0.5ns direct (2M calls). Real, rarely your bottleneck.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Templates & Concepts" accent="amber" glyph="📐" span={2}>
        <GuideCode>{`template <typename T> T max(T a, T b) { return a > b ? a : b; }

// Templates INSTANTIATE — each T generates real, distinct code.
// Java erases; C++ does not. That is why they live in headers,
// and why build times suffer.

template <std::integral T>            // C++20 concept as a constraint
T twice(T x) { return x * 2; }

template <typename T>
    requires requires(T t) { t.size(); }   // ad-hoc requirement
auto len(const T& t) { return t.size(); }`}</GuideCode>
        <GuideRules items={[
          'Concepts move the error from deep inside the instantiation to the CALL SITE. That is the entire argument for them.',
          'if constexpr discards the untaken branch at compile time.',
          'Fold expressions: (args + ...) over a parameter pack.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Containers — Pick By Access Pattern" accent="cyan" glyph="📦" span={2}>
        <GuideTable
          head={['Container', 'Lookup', 'Use when']}
          rows={[
            ['vector', 'O(n) / O(1) index', 'THE DEFAULT. contiguous, cache-friendly'],
            ['array', 'O(1) index', 'fixed size known at compile time'],
            ['deque', 'O(1) index', 'push/pop at BOTH ends'],
            ['list', 'O(n)', 'rarely — cache-hostile, O(1) splice only'],
            ['map / set', 'O(log n)', 'ORDERED (a tree), iterate in key order'],
            ['unordered_map/set', 'O(1) avg', 'the hash map — no ordering'],
            ['span / string_view', '—', 'non-owning view. DANGLES if data dies'],
          ]}
        />
        <GuideRules items={[
          'vector beats list for traversal even when the algorithm says otherwise — contiguity wins on real hardware.',
          'reserve() before a known-size fill to avoid repeated reallocation.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Iterator Invalidation" accent="red" glyph="💥" span={2}>
        <GuideTable
          head={['Operation', 'Invalidates']}
          rows={[
            ['vector push_back (realloc)', 'ALL iterators, pointers, references'],
            ['vector push_back (no realloc)', 'end() only'],
            ['vector insert/erase', 'everything at or after the point'],
            ['deque insert/erase middle', 'all iterators'],
            ['list/map/set erase', 'only the erased element'],
            ['unordered_* rehash', 'all iterators (refs survive)'],
          ]}
        />
        <GuideRules items={[
          'Java throws ConcurrentModificationException — a clean, immediate failure. C++ gives you UNDEFINED BEHAVIOUR that may look fine.',
          'Erase-in-loop is the classic: `it = v.erase(it);` — erase returns the next valid iterator.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Algorithms & Ranges" accent="green" glyph="⚙️" span={2}>
        <GuideCode>{`// remove does NOT remove. MEASURED on {1,2,3,2,4,2,5}:
auto it = std::remove(v.begin(), v.end(), 2);
//  size is STILL 7, tail reads "4 2 5" — junk, including a 2
v.erase(it, v.end());                 // the erase-remove idiom
std::erase(v, 2);                     // C++20 — does both, returns count

// Ranges are LAZY. filter|transform|take(2) over 10 elements, MEASURED:
//   building the pipeline: predicate 0x, transform 0x
//   consuming it:          predicate 6x (not 10), transform 2x
auto r = v | std::views::filter(even)
           | std::views::transform(x10)
           | std::views::take(2);
auto out = r | std::ranges::to<std::vector>();   // C++23, available here`}</GuideCode>
        <GuideRules items={[
          'accumulate(v.begin(), v.end(), 0) over doubles accumulates into an INT and truncates. Write 0.0.',
          'A view does not own its data. Materialise with ranges::to before letting it escape scope.',
          'Ranges cost: compile times, error messages, and a miserable debugger experience.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="Error Handling" accent="amber" glyph="⚠️" span={2}>
        <GuideCode>{`try { risky(); }
catch (const std::exception& e) { }   // catch by const& — ALWAYS

void f() noexcept;      // violating this calls std::terminate, not propagate

std::expected<T, E>     // C++23 — the Go-style explicit alternative
std::optional<T>        // "maybe absent", no error detail`}</GuideCode>
        <GuideRules items={[
          'Exceptions are genuinely contested here, unlike in Java. Games, embedded and parts of finance build with -fno-exceptions.',
          'RAII is what makes exceptions survivable — destructors run during unwinding, so resources release.',
          'Guarantees: basic (valid state), strong (rolled back), nothrow (cannot fail).',
          'expected<T,E> is close to Go\'s (value, err) but composes through monadic and_then/transform.',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="Concurrency" accent="pink" glyph="🧵" span={2}>
        <GuideCode>{`std::jthread t(work);          // C++20 — JOINS in its destructor. Use this.
std::thread  t(work);          // destroyed while joinable -> std::terminate

{ std::lock_guard lk(m); }     // one mutex
{ std::scoped_lock lk(m1,m2); } // SEVERAL — deadlock-free ordering

std::atomic<bool> ready{false};
cv.wait(lk, []{ return ready; });   // predicate form — spurious wakeups are real

std::jthread t([](std::stop_token st){ while(!st.stop_requested()){} });`}</GuideCode>
        <GuideRules items={[
          'A data race is UNDEFINED BEHAVIOUR, not a stale read. The optimiser assumes it cannot happen and reorders accordingly.',
          'MEASURED: a non-atomic spin-wait printed 42 at -O0 and 0 at -O2 — same source, no crash, no warning. Making the flag atomic fixed both.',
          'Default to seq_cst. relaxed/acquire/release are a profiled optimisation, and ARM exposes bugs x86 hides.',
          'std::async\'s future BLOCKS in its destructor — discarding it makes parallel code sequential.',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Sanitizers — What Works On arm64 macOS" accent="red" glyph="🧪" span={2}>
        <GuideTable
          head={['Tool', 'Status here', 'Note']}
          rows={[
            ['-fsanitize=address', '✅ works', 'use-after-free, overflow, double free'],
            ['  └ use-after-scope', '⚠ -O0 ONLY', 'NOT caught at -Og or -O1'],
            ['  └ use-after-return', '⚠ opt-in', 'ASAN_OPTIONS=detect_stack_use_after_return=1'],
            ['-fsanitize=undefined', '✅ works', 'signed overflow, bad shifts, null deref'],
            ['-fsanitize=thread', '✅ works', 'caught races at BOTH -O0 and -O2'],
            ['-fsanitize=leak', '❌ UNSUPPORTED', 'driver rejects the option outright'],
            ['  └ ASAN detect_leaks=1', '❌ UNSUPPORTED', 'prints "not supported on this platform"'],
          ]}
        />
        <GuideRules items={[
          'All of the above was measured on this machine, not taken from documentation.',
          'A sanitizer config that silently detects LESS looks identical to a clean run. That is why the -O0 constraint matters.',
          'ASan and TSan cannot be combined. Run them as separate CI jobs.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Undefined Behaviour" accent="purple" glyph="☢️" span={2}>
        <GuideCode>{`// UB is not "might crash". It is "the compiler may assume this
// never happens" — and optimise on that assumption.

signed overflow          nullptr dereference
out-of-bounds access     use after free / after scope
uninitialised read       data race
strict-aliasing violation   infinite loop with no side effects`}</GuideCode>
        <GuideRules items={[
          'The proof is that the same source gave different ANSWERS at -O0 and -O2 in the concurrency lesson. Not a crash — a wrong number.',
          '"It worked on my machine" is not evidence. Your debug build and your release build are not the same program.',
          'UBSan + ASan in CI is the practical defence. So is -Wall -Wextra -Werror.',
        ]} />
      </GuidePanel>

      <GuidePanel n={19} title="Flags Worth Defaulting To" accent="blue" glyph="🚩">
        <GuideCode>{`# always
-std=c++23 -Wall -Wextra -Wpedantic

# CI: make warnings fail the build
-Werror

# debug / test job
-O0 -g -fsanitize=address,undefined

# separate job (cannot combine with ASan)
-fsanitize=thread

# release
-O2 -DNDEBUG`}</GuideCode>
        <GuideRules items={[
          '-Wnon-virtual-dtor is in NEITHER -Wall NOR -Wextra. Add it explicitly.',
          '-O0 for the sanitizer job specifically — see panel 17.',
        ]} />
      </GuidePanel>

      <GuidePanel n={20} title="Section Index" accent="cyan" glyph="📖" span={2}>
        <GuideCode>{` 0. Which C++ You're Writing     dialects, runtime model
 1. Compiling & Linking          TU, ODR, linker errors
 2. Types, auto & Control Flow   zero values, narrowing
 3. Functions & Lambdas          captures, the dangling trap
 4. Values, References, Pointers the big Java/JS correction
 5. Memory Model & Lifetime      stack, heap, scope exit
 6. RAII                         the idea that defines C++
 7. Smart Pointers               unique by default, cycles
 8. Move Semantics               std::move is a cast
 9. Memory Bugs & Sanitizers     real ASan/UBSan output
10. Classes & Rule of 0/3/5      special members
11. Inheritance & vtables        slicing, virtual dtor
12. Templates                    instantiation, not erasure
13. Concepts                     errors at the call site
14. Containers & Invalidation    UB, not an exception
15. Algorithms & Ranges          remove doesn't remove
16. Error Handling               exceptions vs expected
17. Concurrency                  races are UB
18. Performance                  measure, never guess
19. Build, Debugging, Sanitizers CMake, lldb, CI
20. This field guide`}</GuideCode>
        <GuideRules items={[
          'Printing: hit Ctrl/Cmd-P straight from the page — print styles force the light palette regardless of the on-screen toggle, and keep each panel whole across page breaks.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
