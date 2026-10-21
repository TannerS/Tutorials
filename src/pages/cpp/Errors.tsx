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

function Errors() {
  return (
    <LessonLayout
      title="Error Handling: Exceptions, noexcept & expected"
      sectionId="cpp"
      lessonIndex={17}
      prev={{ path: '/cpp/algorithms', label: 'Algorithms, Iterators & Ranges' }}
      next={{ path: '/cpp/concurrency', label: 'Concurrency: Threads, Atomics & the Memory Model' }}
    >
      <p>
        In Java, how to report an error is not a question. You throw. The language has checked
        exceptions, the standard library throws from everywhere, every framework you have used
        expects it, and nobody in a code review has ever asked you to justify it. Node is the same
        story with a different spelling: <code>throw</code>, or a rejected promise, which is{' '}
        <code>throw</code> wearing a coat.
      </p>
      <p>
        <strong>C++ has exceptions, and whether you are allowed to use them is a live argument that
        has been running for thirty years.</strong> Not a stylistic preference — a build-flag-level
        decision made at the top of a codebase, enforced by the compiler, and still being made
        differently by serious engineers in 2026. Unreal Engine ships with them off. Google&apos;s
        C++ style guide forbids them in most of its own code. Large parts of high-frequency trading,
        almost all of embedded, and most AAA game engines build with{' '}
        <code>-fno-exceptions</code>. Meanwhile the C++ standard library throws, the ISO committee
        standardised a non-exception alternative in C++23 precisely because the argument would not
        die, and Herb Sutter has an active proposal to replace the whole mechanism.
      </p>
      <p>
        So this lesson cannot just teach you <code>try</code>/<code>catch</code> and move on. It has
        to teach you the mechanism, what it actually costs — measured on this machine, in nanoseconds
        and in bytes of machine code — what the ban is really about, and the three other channels
        this language gives you instead. By the end you should be able to make the choice
        deliberately and defend it, which is the actual skill.
      </p>
      <p>
        The one thing that is <em>not</em> contested: whichever channel you pick,{' '}
        <a href="/cpp/raii">RAII</a> is what makes it survivable. That lesson showed three
        destructors running between a <code>throw</code> and a <code>catch</code> in a file with
        zero lines of cleanup code. Everything here builds on that.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same machine and toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>, target{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++ <code>_LIBCPP_VERSION 220106</code>,{' '}
          <code>-std=c++23</code>. 14 logical cores (10 performance, 4 efficiency). Every output
          block, binary size, section size, assembly listing and timing below is pasted from a real
          run or a real build on this machine.
        </p>
        <p>
          <strong><code>std::expected</code> is available here</strong> —{' '}
          <code>__cpp_lib_expected</code> reports <code>202211</code>, which is the full C++23
          paper including the monadic operations, and every <code>std::expected</code> sample on
          this page compiles and runs. That check was done before any of it was written up, because
          the C++23 library is unevenly implemented and &quot;C++23 has it&quot; and &quot;your
          toolchain has it&quot; are different claims.
        </p>
        <p>
          Four results on this page contradicted what I expected before measuring. They are called
          out where they appear, and collected at the bottom.
        </p>
      </InfoBox>

      <h2>What <code>throw</code> Actually Does</h2>
      <p>
        You have a working model of this from Java, and it is mostly right: an object is created, the
        stack is walked outward until something catches, and cleanup happens on the way. The parts
        that differ matter, so here is the mechanism as it exists on this platform, in order.
      </p>

      <FlowChart
        title="From throw to catch: the Itanium ABI's two-phase unwind"
        chart={
          'graph TD\n' +
          '  T["throw std::invalid_argument{...}"] --> A1["1. __cxa_allocate_exception<br/>The exception object is copied onto a<br/>special heap, NOT the stack — the stack<br/>is about to be destroyed."]\n' +
          '  A1 --> A2["2. __cxa_throw<br/>Hands the object plus its std::type_info<br/>to the unwinder."]\n' +
          '  A2 --> P1["3. SEARCH PHASE — walks frames outward,<br/>reading each one\'s __gcc_except_tab<br/>side table. Runs NO destructors yet."]\n' +
          '  P1 --> Q{"does this frame have a catch<br/>whose type matches?"}\n' +
          '  Q -->|no| P1\n' +
          '  Q -->|"no handler anywhere<br/>in the whole stack"| TERM["std::terminate<br/>Measured in the RAII lesson: nothing<br/>was unwound at all. exit 134."]\n' +
          '  Q -->|"yes, found it"| P2["4. CLEANUP PHASE — only now does it walk<br/>the same frames again, jumping into each<br/>landing pad to run destructors."]\n' +
          '  P2 --> LP["a landing pad is the cold code<br/>clang emits per frame: run the<br/>destructors, then _Unwind_Resume"]\n' +
          '  LP --> NX{"is any frame on the way out<br/>marked noexcept?"}\n' +
          '  NX -->|yes| TERM2["std::terminate at that frame.<br/>Measured: the local\'s destructor<br/>did NOT run. The outer catch<br/>never saw it."]\n' +
          '  NX -->|no| H["5. the handler runs<br/>__cxa_begin_catch / __cxa_end_catch"]\n' +
          '  H --> DONE["execution continues after the catch.<br/>Every destructor between throw and<br/>catch has run. Measured cost of the<br/>whole trip: about 2.0 microseconds."]\n' +
          '  style DONE fill:#1a3329,stroke:#4ade80\n' +
          '  style H fill:#1a3329,stroke:#4ade80\n' +
          '  style P2 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style P1 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style TERM fill:#3b1a1a,stroke:#f87171\n' +
          '  style TERM2 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <p>
        Three things in that diagram are worth pulling out, because they are the ones that are not
        true of the JVM.
      </p>
      <p>
        <strong>The exception object is not on the stack.</strong> It cannot be — the frame it was
        created in is about to be torn down. <code>__cxa_allocate_exception</code> puts it in a
        separate allocation managed by libc++abi, and that is why <code>throw</code> does not
        work like <code>return</code> and why you can throw from a function that returns{' '}
        <code>void</code>.
      </p>
      <p>
        <strong>There are two passes, not one.</strong> The unwinder first searches for a handler
        without touching anything, and only runs destructors once it knows a handler exists. This is
        the reason an <em>uncaught</em> exception does not unwind at all —{' '}
        <a href="/cpp/raii">the RAII lesson measured that</a>, including no static destructors — and
        it is the reason a top-level <code>catch</code> in <code>main</code> is load-bearing rather
        than defensive.
      </p>
      <p>
        <strong>The control-flow information lives in a side table, not in your code.</strong>{' '}
        <code>__gcc_except_tab</code> is a real section in the binary that maps program-counter
        ranges to landing pads, and the whole &quot;zero-cost&quot; claim rests on it. You will see
        that section, and its size, further down.
      </p>

      <h3><code>throw</code>, <code>catch</code>, and the one mistake worth never making</h3>
      <p>
        The syntax is Java&apos;s with one critical difference: <strong>you catch by{' '}
        <code>const&amp;</code></strong>. Catching by value does something Java cannot do, because
        in Java every exception is a reference. Here it slices.
      </p>

      <CodeBlock language="cpp" title="hier.cpp — the same throw, caught two ways">
{`#include <print>
#include <stdexcept>
#include <string>
#include <system_error>
#include <typeinfo>
#include <vector>

struct DbError : std::runtime_error {
    int code;
    DbError(std::string what, int c) : std::runtime_error(std::move(what)), code(c) {}
};

void by_value() {
    try {
        throw DbError{"connection reset", 104};
    } catch (std::exception e) {          // BY VALUE -- sliced
        std::println("  caught by value:  typeid = {}, what() = {}", typeid(e).name(), e.what());
    }
}

void by_ref() {
    try {
        throw DbError{"connection reset", 104};
    } catch (const std::exception& e) {   // BY CONST REFERENCE
        std::println("  caught by const&: typeid = {}, what() = {}", typeid(e).name(), e.what());
        if (auto* db = dynamic_cast<const DbError*>(&e)) {
            std::println("                    and the code survived: {}", db->code);
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 hier.cpp && ./hier">
{`1. the same throw, caught two ways:
  caught by value:  typeid = St9exception, what() = std::exception
  caught by const&: typeid = 7DbError, what() = connection reset
                    and the code survived: 104

2. what the standard library actually throws:
  vector::at(99)        -> St12out_of_range         : vector
  stoi("not a number")  -> St16invalid_argument     : stoi: no conversion
  stoi(huge)            -> St12out_of_range         : stoi: out of range
  string::resize(max)   -> St9bad_alloc             : std::bad_alloc
  system_error          -> NSt3__112system_errorE   : No such file or directory
    .code()             = 2 / generic`}
      </CodeBlock>

      <p>
        Read the first two lines again. The <code>catch (std::exception e)</code> version{' '}
        <strong>copy-constructed a plain <code>std::exception</code> from a{' '}
        <code>DbError</code></strong>. The dynamic type became <code>St9exception</code>,{' '}
        <code>what()</code> degraded from <code>&quot;connection reset&quot;</code> to the literal
        string <code>&quot;std::exception&quot;</code>, and the <code>code</code> member — the only
        thing a caller could have acted on — is gone. The <code>const&amp;</code> version kept all
        three: the real type, the real message, and the data.
      </p>

      <InfoBox variant="danger" title="And nothing on this toolchain warns about it — which I did not expect">
        <p>
          GCC has <code>-Wcatch-value</code> for exactly this. I assumed clang did too. It does not:
        </p>
        <CodeBlock language="text" title="Real output — probing for a warning that would catch the slicing">
{`$ clang++ -std=c++23 -Wall -Wextra -Wcatch-value -fsyntax-only hier.cpp
warning: unknown warning option '-Wcatch-value'; did you mean '-Wunused-value'?
         [-Wunknown-warning-option]
1 warning generated.

$ clang++ -std=c++23 -Weverything -fsyntax-only hier.cpp 2>&1 | grep -i "catch\\|slic"
(no output)`}
        </CodeBlock>
        <p>
          Not <code>-Wall</code>, not <code>-Wextra</code>, not even{' '}
          <code>-Weverything</code> — which turns on warnings nobody should turn on — says anything
          about catching a polymorphic type by value. The flag does not exist on this compiler. So
          this is one of the handful of C++ rules you have to carry in your head rather than delegate
          to the build: <strong>always <code>catch (const T&amp;)</code></strong>. If you are
          building on a toolchain where <code>clang-tidy</code> is available,{' '}
          <code>bugprone-exception-escape</code> and <code>cert-err61-cpp</code> cover related
          ground, but neither ships with the compiler.
        </p>
      </InfoBox>

      <h3>The standard hierarchy</h3>
      <p>
        One root, two mid-level categories, and a scattering of direct children. The whole table
        below was verified with <code>static_assert(std::is_base_of_v&lt;...&gt;)</code> on this
        libc++ rather than recalled, because the <code>bad_*</code> types are the ones people
        misremember:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 tree.cpp && ./tree">
{`every relationship in the hierarchy table static_asserts clean on this libc++.
sizeof(std::exception)            = 8
sizeof(std::runtime_error)        = 16
sizeof(std::system_error)         = 32
is std::exception's dtor virtual? = true`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Type</th>
            <th style={headStyle}>Derives from</th>
            <th style={headStyle}>Thrown by</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::exception</code></td>
            <td style={cellStyle}>—</td>
            <td style={cellStyle}>the root; has <code>virtual const char* what()</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::logic_error</code></td>
            <td style={cellStyle}><code>exception</code></td>
            <td style={cellStyle}>&quot;the caller has a bug&quot;</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::invalid_argument</code></td>
            <td style={cellStyle}><code>logic_error</code></td>
            <td style={cellStyle}><code>std::stoi(&quot;abc&quot;)</code>, <code>std::bitset</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::out_of_range</code></td>
            <td style={cellStyle}><code>logic_error</code></td>
            <td style={cellStyle}><code>vector::at</code>, <code>map::at</code>, <code>string::substr</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::length_error</code></td>
            <td style={cellStyle}><code>logic_error</code></td>
            <td style={cellStyle}>asking a container for more than <code>max_size()</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::domain_error</code></td>
            <td style={cellStyle}><code>logic_error</code></td>
            <td style={cellStyle}>nothing in the standard library, actually — it is for you</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::future_error</code></td>
            <td style={cellStyle}><code>logic_error</code></td>
            <td style={cellStyle}><code>future</code>/<code>promise</code> misuse — next lesson</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::runtime_error</code></td>
            <td style={cellStyle}><code>exception</code></td>
            <td style={cellStyle}>&quot;the world went wrong&quot;</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::range_error</code>, <code>overflow_error</code>, <code>underflow_error</code></td>
            <td style={cellStyle}><code>runtime_error</code></td>
            <td style={cellStyle}>numeric conversions</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::system_error</code></td>
            <td style={cellStyle}><code>runtime_error</code></td>
            <td style={cellStyle}>carries an <code>std::error_code</code>; OS failures</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::filesystem::filesystem_error</code></td>
            <td style={cellStyle}><code>system_error</code></td>
            <td style={cellStyle}>also carries the one or two paths involved</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::ios_base::failure</code></td>
            <td style={cellStyle}><code>system_error</code></td>
            <td style={cellStyle}>iostreams, <em>if</em> you enabled exceptions on the stream</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::bad_alloc</code></td>
            <td style={cellStyle}><code>exception</code> <strong>directly</strong></td>
            <td style={cellStyle}><code>operator new</code>. <em>Not</em> a <code>runtime_error</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::bad_cast</code>, <code>bad_typeid</code></td>
            <td style={cellStyle}><code>exception</code> directly</td>
            <td style={cellStyle}><code>dynamic_cast</code> to a reference, <code>typeid</code> on null</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>bad_optional_access</code>, <code>bad_variant_access</code>, <code>bad_expected_access&lt;E&gt;</code></td>
            <td style={cellStyle}><code>exception</code> directly</td>
            <td style={cellStyle}><code>.value()</code> on an empty one</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>bad_function_call</code>, <code>bad_weak_ptr</code></td>
            <td style={cellStyle}><code>exception</code> directly</td>
            <td style={cellStyle}>empty <code>std::function</code>; expired <code>weak_ptr</code> locked wrong</td>
          </tr>
        </tbody>
      </table>

      <p>
        The practically useful part of that table is the <code>logic_error</code> /{' '}
        <code>runtime_error</code> split, and it is a genuine design idea rather than filing.{' '}
        <strong><code>logic_error</code> means the caller violated a precondition — a bug in the
        program, which retrying will not fix. <code>runtime_error</code> means something outside the
        program failed — which retrying might.</strong> If you derive your own exception types,
        derive from whichever of those two answers &quot;should the caller retry?&quot;, and the
        shape of your <code>catch</code> blocks falls out for free.
      </p>
      <p>
        And note <code>std::bad_alloc</code> derives from <code>std::exception</code>{' '}
        <em>directly</em>. A <code>catch (const std::runtime_error&amp;)</code> at the top of your
        program does not catch out-of-memory. This is the most common mistake in the hierarchy and it
        is also the least likely to be exercised by your tests.
      </p>

      <h2>&quot;Zero-Cost Until Thrown&quot;, Measured</h2>
      <p>
        This phrase is the standard defence of exceptions and it is half true in a way worth being
        precise about. The claim is that a <code>try</code> block costs nothing when nothing throws,
        because the handler information lives in that side table rather than in runtime
        bookkeeping — no pushing cleanup records, no entering and leaving a protected region.
      </p>
      <p>
        One callee that can throw, four call sites, 30 million iterations each:
      </p>

      <CodeBlock language="cpp" title="zero.cpp — the four call sites being timed">
{`template <class T> static inline void escape(T&& p) { asm volatile("" : : "r,m"(p) : "memory"); }

[[gnu::noinline]] int work(int n) { if (n < 0) throw std::runtime_error{"neg"}; return n + 1; }

struct Guard { int* p; ~Guard() { escape(p); } };

[[gnu::noinline]] int no_try(int i)        { return work(i); }
[[gnu::noinline]] int with_try(int i)      { try { return work(i); }
                                             catch (const std::exception&) { return -1; } }
[[gnu::noinline]] int with_raii(int i)     { std::vector<int> v(1); Guard g{v.data()};
                                             return work(i) + v[0]; }
[[gnu::noinline]] int with_raii_try(int i) { try { std::vector<int> v(1); Guard g{v.data()};
                                                   return work(i) + v[0]; }
                                             catch (const std::exception&) { return -1; } }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 zero.cpp && ./zero, three consecutive runs">
{`### run 1
one callee that CAN throw; four call sites; 30000000 iters, best of 9
call site has no try/catch                      1.113 ns/op
call site wrapped in try/catch                  1.372 ns/op
call site has an RAII local (vector)           10.627 ns/op
RAII local AND try/catch                       11.240 ns/op
### run 2
call site has no try/catch                      1.116 ns/op
call site wrapped in try/catch                  1.371 ns/op
call site has an RAII local (vector)           10.551 ns/op
RAII local AND try/catch                       10.915 ns/op
### run 3
call site has no try/catch                      1.115 ns/op
call site wrapped in try/catch                  1.370 ns/op
call site has an RAII local (vector)           10.254 ns/op
RAII local AND try/catch                       10.500 ns/op`}
      </CodeBlock>

      <p>
        <strong>Not zero. 1.113 ns becomes 1.372 ns — about a quarter of a nanosecond, repeatable to
        three decimal places across runs.</strong> That is roughly one cycle. The assembly says
        exactly where it went:
      </p>

      <CodeBlock language="cpp" title="zasm.cpp — the same shapes with the callee in another translation unit">
{`#include <stdexcept>
int work(int n);                       // defined elsewhere: can throw, cannot be inlined
struct Guard { int* p; ~Guard(); };    // non-trivial destructor, defined elsewhere

int no_try(int i)   { return work(i); }
int with_try(int i) { try { return work(i); } catch (const std::exception&) { return -1; } }
int with_raii(int i){ int x = i; Guard g{&x}; return work(i); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S, assembler directives stripped">
{`__Z6no_tryi:
	b	__Z4worki                        ; <- ONE instruction. A tail call.

__Z8with_tryi:
Lfunc_begin0:
	stp	x29, x30, [sp, #-16]!            ; <- a real frame, because the tail call is gone
	mov	x29, sp
Ltmp0:
	bl	__Z4worki
Ltmp1:
	ldp	x29, x30, [sp], #16
	ret
LBB1_2:                                  ; <- the landing pad: COLD, never executed
Ltmp2:
	bl	___cxa_begin_catch
	bl	___cxa_end_catch
	mov	w0, #-1
	ldp	x29, x30, [sp], #16
	ret
Lfunc_end0:
GCC_except_table1:                       ; <- the side table, in __TEXT, not in the hot path
Lexception0:
	.uleb128 Lttbase0-Lttbaseref0
Lttbaseref0:
	.uleb128 Lcst_end0-Lcst_begin0
Lcst_begin0:
	.uleb128 Ltmp0-Lfunc_begin0            ; >> Call Site 1 <<
	.uleb128 Ltmp1-Ltmp0                   ;   Call between Ltmp0 and Ltmp1
	.uleb128 Ltmp2-Lfunc_begin0            ;     jumps to Ltmp2
	.uleb128 Ltmp1-Lfunc_begin0            ; >> Call Site 2 <<
	.uleb128 Lfunc_end0-Ltmp1              ;   Call between Ltmp1 and Lfunc_end0
Lcst_end0:

__Z9with_raiii:
	...
	bl	__Z4worki
	bl	__ZN5GuardD1Ev                   ; normal path: run ~Guard, return
	ret
LBB2_2:
	bl	__ZN5GuardD1Ev                   ; unwind path: run ~Guard...
	bl	__Unwind_Resume                  ; ...then keep unwinding`}
      </CodeBlock>

      <p>
        <code>no_try</code> is <strong>one instruction</strong>: <code>b __Z4worki</code>, a tail
        call, no stack frame at all. <code>with_try</code> cannot tail-call, because if{' '}
        <code>work</code> throws, this frame has to still exist for the unwinder to find its
        handler. So it sets up a frame, calls, and tears the frame down — five instructions on the
        hot path instead of one. <strong>That lost tail call is the 0.26 ns.</strong>
      </p>
      <p>
        Everything else is cold. <code>LBB1_2</code> is the landing pad, which never executes unless
        something throws. <code>GCC_except_table1</code> is data. The hot path contains no
        exception-related instruction whatsoever — no register is set, no flag is checked, nothing is
        pushed.
      </p>
      <p>
        So the honest version of the claim is: <strong>&quot;zero-cost&quot; means zero{' '}
        <em>runtime bookkeeping</em>, not zero effect on codegen.</strong> A quarter of a nanosecond
        per guarded call is nothing in almost any program, and it is comfortably inside the noise of
        the function it is guarding — the RAII rows in that table cost 10 ns before anything about
        exceptions enters the picture. But it is not literally nothing, and the people who say
        &quot;zero-cost is a lie&quot; are pointing at something real, just small.
      </p>

      <h2>What A Throw Actually Costs</h2>
      <p>
        The other half of &quot;zero-cost until thrown&quot; is the word <em>until</em>. Here is the
        number, and it is large.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 throwkind.cpp && ./throwkind, two runs">
{`### run 1
cost of ONE throw + catch, by what is thrown (200000 iters, best of 7):
  throw 42            (an int)                       2015.9 ns
  throw Tiny{}        (empty struct)                 1991.0 ns
  throw Mid{}         (derives std::exception)       2021.6 ns
  throw runtime_error (short message, SSO)           2107.0 ns
  throw runtime_error (long message, heap)           2182.3 ns

### run 2
  throw 42            (an int)                       2021.1 ns
  throw Tiny{}        (empty struct)                 2044.1 ns
  throw Mid{}         (derives std::exception)       2092.5 ns
  throw runtime_error (short message, SSO)           2215.6 ns
  throw runtime_error (long message, heap)           2254.8 ns`}
      </CodeBlock>

      <p>
        <strong>About two microseconds per throw-and-catch, and it barely depends on what you
        throw.</strong> <code>throw 42</code> — an <code>int</code>, no allocation of a message, no
        inheritance, nothing — costs 2016 ns. A <code>runtime_error</code> with a long heap-allocated
        message costs 2182 ns. The payload accounts for under 10% of the total; the other 90-plus
        per cent is the unwinder.
      </p>
      <p>
        Two microseconds is a strange number to hold in your head, so convert it. On this machine a
        throw costs about as much as <strong>1,500 of the guarded calls</strong> from the previous
        section, or roughly <strong>200 heap allocations</strong> at the 10 ns/op figure{' '}
        <a href="/cpp/memory-model">the memory-model lesson</a> measured. It is not in the same
        category of cost as anything else you do in a function.
      </p>

      <h3>Depth barely matters, which surprised me</h3>
      <p>
        I expected unwinding to be roughly linear in the number of frames — it is, after all, a walk
        up the stack reading a side table per frame. Measured across 1, 5 and 50 frames:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cost.cpp && ./cost">
{`--- the HAPPY path (no error, 20,000,000 iterations, best of 7) ---
try/catch present, nothing thrown                    1.77 ns/op
no try/catch at all (same callee)                    1.54 ns/op
std::expected<int,std::string>, has value            0.77 ns/op
std::expected<int,int>, has value                    0.73 ns/op
std::optional<int>, has value                        0.77 ns/op
bool + out-param, returns true                       0.77 ns/op

--- the FAILING path (300,000 iterations, best of 7) ---
throw + catch, 1 frame                            2148.01 ns/op
throw + catch, 5 frames of unwinding              2159.43 ns/op
throw + catch, 50 frames of unwinding             2178.11 ns/op
std::expected<int,std::string>, unexpected           0.89 ns/op
std::expected<int,int>, unexpected                   0.66 ns/op
std::optional<int>, nullopt                          0.22 ns/op
bool + out-param, returns false                      0.89 ns/op`}
      </CodeBlock>

      <p>
        <strong>2148 ns at one frame, 2178 ns at fifty.</strong> Fifty times the unwinding work cost
        1.4% more. Whatever dominates the two microseconds is a fixed setup cost — getting into the
        unwinder, locating the unwind information for the throwing function, the RTTI type match —
        and not the per-frame walk. The practical consequence is counter-intuitive and useful:{' '}
        <strong>moving your <code>catch</code> closer to the <code>throw</code> will not make your
        error path faster.</strong> Only throwing less will.
      </p>
      <p>
        The comparison rows in the same table are the headline. <code>std::expected</code>{' '}
        reporting a failure costs <strong>0.66 to 0.89 ns</strong>. That is a ratio of roughly{' '}
        <strong>2,400:1</strong> against the throw on the error path, and a difference of about half
        a nanosecond in <code>expected</code>&apos;s favour on the success path too.
      </p>

      <InfoBox variant="warning" title="Two harnesses, two happy-path numbers — do not compare across the tables">
        <p>
          The <code>cost.cpp</code> table above reports 1.54 ns for the no-<code>try</code> happy
          path; the <code>zero.cpp</code> table earlier reported 1.113 ns for what is nominally the
          same thing. Both are real. They differ because <code>cost.cpp</code> routes every case
          through a generic lambda for uniformity and <code>zero.cpp</code> calls the function
          directly, and a third of a nanosecond is about what one extra layer of indirection costs
          at this scale.
        </p>
        <p>
          This is worth stating rather than quietly picking the prettier number, because it is the
          normal condition of microbenchmarks: <strong>differences within one harness are
          meaningful, absolute values across harnesses are not.</strong> The 2,400:1 ratio is
          robust — it would survive a tenfold error in the harness overhead. The 0.26 ns tail-call
          cost is not robust in that way, which is why it was confirmed against the assembly rather
          than trusted from the clock.
        </p>
      </InfoBox>

      <h3>Does throwing scale across threads? I expected no. It does.</h3>
      <p>
        The best-known complaint about exception cost in the low-latency world is that unwinding
        takes a global lock, so a service that throws under load serialises on it. That is a real
        historical problem with some runtimes. I expected to reproduce it. The same total number of
        throws, spread over 1, 2, 4 and 8 threads:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 scale.cpp && ./scale">
{`hardware_concurrency = 14
480000 throw+catch operations in total, spread over N threads, best of 5
  throw+catch   1 thread(s):    2128.1 ns per throw   (1.00x the 1-thread cost)
  throw+catch   2 thread(s):    1090.2 ns per throw   (0.51x the 1-thread cost)
  throw+catch   4 thread(s):     574.7 ns per throw   (0.27x the 1-thread cost)
  throw+catch   8 thread(s):     309.1 ns per throw   (0.15x the 1-thread cost)

  expected      1 thread(s):       0.8 ns per error   (1.00x the 1-thread cost)
  expected      2 thread(s):       0.4 ns per error   (0.54x the 1-thread cost)
  expected      4 thread(s):       0.3 ns per error   (0.38x the 1-thread cost)
  expected      8 thread(s):       0.3 ns per error   (0.35x the 1-thread cost)`}
      </CodeBlock>

      <p>
        <strong>Near-linear scaling.</strong> Eight threads got through the same work in 0.15 of the
        wall-clock time per throw — if anything slightly <em>better</em> scaling than the{' '}
        <code>expected</code> baseline managed, which is itself memory-bandwidth-bound at these
        speeds rather than lock-bound. Whatever contention existed in older unwinders,{' '}
        <strong>this libc++abi on arm64-apple-darwin does not serialise throws</strong>.
      </p>
      <p>
        Worth being careful about what that does and does not license. It means &quot;exceptions
        don&apos;t scale&quot; is not a true statement about this platform in 2026, and if you
        inherit that claim from a 2015 blog post you should re-measure before repeating it. It does
        not rescue exceptions as a routine error channel, because 2 µs of parallel work is still
        2 µs of work — you have made it concurrent, not cheap.
      </p>

      <h2>The Measurement That Actually Decides It</h2>
      <p>
        Ratios in a microbenchmark are easy to wave away. So here is the end-to-end version: parse
        two million integer fields, vary what fraction of them are malformed, and report wall-clock
        time for the identical work done through each channel.
      </p>

      <CodeBlock language="cpp" title="mix.cpp — the two parsers, identical except for the error channel">
{`[[gnu::noinline]] int parse_throwing(const std::string& s) {
    int v{};
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{} || p != s.data() + s.size())
        throw std::invalid_argument{"bad field: " + s};
    return v;
}

[[gnu::noinline]] std::expected<int, std::string> parse_expected(const std::string& s) {
    int v{};
    auto [p, ec] = std::from_chars(s.data(), s.data() + s.size(), v);
    if (ec != std::errc{} || p != s.data() + s.size())
        return std::unexpected{"bad field: " + s};
    return v;
}

// ...and the two loops:
for (const auto& f : fields) {
    try { sum += parse_throwing(f); } catch (const std::exception&) { ++errs; }
}
for (const auto& f : fields) {
    if (auto r = parse_expected(f)) sum += *r; else ++errs;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 mix.cpp && ./mix, two consecutive runs">
{`### run 1
   0.0000% bad (      0 of 2000000):  exceptions     12.05 ms   expected   13.40 ms   ratio    0.9x
   0.0100% bad (    196 of 2000000):  exceptions     12.54 ms   expected   13.10 ms   ratio    1.0x
   0.1000% bad (   1960 of 2000000):  exceptions     18.24 ms   expected   13.50 ms   ratio    1.4x
   1.0000% bad (  19956 of 2000000):  exceptions     72.14 ms   expected   13.72 ms   ratio    5.3x
  10.0000% bad ( 199461 of 2000000):  exceptions    609.23 ms   expected   14.96 ms   ratio   40.7x

### run 2
   0.0000% bad (      0 of 2000000):  exceptions     12.18 ms   expected   13.43 ms   ratio    0.9x
   0.0100% bad (    196 of 2000000):  exceptions     12.55 ms   expected   13.00 ms   ratio    1.0x
   0.1000% bad (   1960 of 2000000):  exceptions     18.17 ms   expected   12.99 ms   ratio    1.4x
   1.0000% bad (  19956 of 2000000):  exceptions     71.72 ms   expected   13.42 ms   ratio    5.3x
  10.0000% bad ( 199461 of 2000000):  exceptions    610.20 ms   expected   15.07 ms   ratio   40.5x`}
      </CodeBlock>

      <p>
        This single table is the whole argument, and it does not take either side.
      </p>
      <ul>
        <li>
          <strong>At a zero error rate the exception version is <em>faster</em></strong> — 12.05 ms
          against 13.40 ms, by about 10%. &quot;Zero-cost until thrown&quot; is not marketing; the
          happy path really is leaner than carrying a discriminated union through every return.
          This is the result I would least have predicted.
        </li>
        <li>
          <strong>At one error in ten thousand it is a tie.</strong> 12.54 against 13.10 ms. If your
          failures are that rare, the channel is a readability decision, not a performance one.
        </li>
        <li>
          <strong>At one per cent it is 5.3x slower. At ten per cent it is 40x slower</strong> —
          610 ms against 15 ms — and the exception version has spent more than half a second of CPU
          doing nothing but unwinding.
        </li>
        <li>
          <strong>The <code>expected</code> column is flat.</strong> 13.4, 13.1, 13.5, 13.7,
          15.0 ms. Its cost does not depend on how often it fails, because failing and succeeding
          are the same operation with a different tag.
        </li>
      </ul>
      <p>
        <strong>That flatness is the real property to take away.</strong> An exception-based system
        has a performance cliff whose location depends on your <em>input data</em>, not your code.
        A parser that was fine in testing against clean fixtures becomes 40x slower the day a
        customer uploads a malformed export, and nothing in the source changed. Systems with
        latency budgets hate that shape of risk far more than they mind two microseconds.
      </p>

      <h2>Why Parts Of The Industry Ban Them Outright</h2>
      <p>
        Performance is the argument you hear first and it is rarely the deciding one. The{' '}
        <code>-fno-exceptions</code> decision is usually made for two other reasons: binary size,
        and the fact that <code>throw</code> is an invisible control-flow edge out of every function
        that calls anything.
      </p>

      <h3>Binary size, measured</h3>
      <p>
        You cannot measure this with a program containing <code>throw</code>, because{' '}
        <code>-fno-exceptions</code> rejects it outright:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fno-exceptions -fsyntax-only nothrow_src.cpp">
{`nothrow_src.cpp:2:12: error: cannot use 'throw' with exceptions disabled
    2 | void f() { throw std::runtime_error{"boom"}; }
      |            ^
nothrow_src.cpp:3:12: error: cannot use 'try' with exceptions disabled
    3 | void g() { try { f(); } catch (const std::exception&) {} }
      |            ^
2 errors generated.`}
      </CodeBlock>

      <p>
        So the test program has to be exception-free in its own source while still using the
        standard library, which throws internally. That is also the realistic case: most of the
        exception machinery in a typical binary is not yours, it is landing pads generated inside{' '}
        <code>vector</code>, <code>string</code>, <code>map</code> and friends because{' '}
        <em>they</em> can throw. Two programs, both of which compile identically with and without
        the flag:
      </p>

      <CodeBlock language="cpp" title="big.cpp — containers and algorithms over eight value types; no throw, no try anywhere">
{`template <class V>
static long pipeline(int n, V seed) {
    std::vector<std::pair<std::string, V>> rows;
    rows.reserve(static_cast<std::size_t>(n));
    for (int i = 0; i < n; ++i)
        rows.emplace_back("key-" + std::to_string(i * 7919 % n), seed);
    std::ranges::sort(rows, [](const auto& a, const auto& b) { return a.first < b.first; });
    std::map<std::string, V> m;
    std::unordered_map<std::string, V> um;
    std::set<std::string> s;
    std::deque<V> d;
    for (const auto& r : rows) { m[r.first] = r.second; um[r.first] = r.second;
                                 s.insert(r.first); d.push_back(r.second); }
    return static_cast<long>(m.size() + um.size() + s.size() + d.size());
}

int main(int argc, char**) {
    long t = 0;
    t += pipeline<int>(100 + argc, 1);
    t += pipeline<long>(100 + argc, 1);
    t += pipeline<double>(100 + argc, 1.0);
    t += pipeline<float>(100 + argc, 1.0f);
    t += pipeline<char>(100 + argc, 'x');
    t += pipeline<unsigned>(100 + argc, 1u);
    t += pipeline<std::string>(100 + argc, "v");
    t += pipeline<std::pair<int,int>>(100 + argc, {1, 2});
    std::println("total {}", t);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — size -m on four builds, and both binaries produce identical results">
{`$ clang++ -std=c++23 -Wall -Wextra -O2                  big.cpp -o big_O2
$ clang++ -std=c++23 -Wall -Wextra -O2 -fno-exceptions  big.cpp -o big_O2_nx
$ clang++ -std=c++23 -Wall -Wextra -Os                  big.cpp -o big_Os
$ clang++ -std=c++23 -Wall -Wextra -Os -fno-exceptions  big.cpp -o big_Os_nx
$ ./big_O2 && ./big_O2_nx && ./big_Os && ./big_Os_nx
total 3232
total 3232
total 3232
total 3232

--- big_O2            (exceptions on)        --- big_O2_nx         (-fno-exceptions)
Segment __TEXT:              163840           Segment __TEXT:              147456
	Section __text:           137056           	Section __text:           119712
	Section __gcc_except_tab:   2860           	(absent)
	Section __unwind_info:      1296           	(absent)
file size:                   241560           file size:                   213304

--- big_Os            (exceptions on)        --- big_Os_nx         (-fno-exceptions)
Segment __TEXT:              131072           Segment __TEXT:              114688
	Section __text:            96236           	Section __text:            83920
	Section __gcc_except_tab:   2324           	(absent)
	Section __unwind_info:      1744           	(absent)
file size:                   245960           file size:                   219880`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Build</th>
            <th style={headStyle}><code>__text</code> (machine code)</th>
            <th style={headStyle}>Exception tables</th>
            <th style={headStyle}>File on disk</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>big.cpp -O2</code></td>
            <td style={cellStyle}>137,056 &rarr; 119,712 = <strong>&minus;12.7%</strong></td>
            <td style={cellStyle}>4,156 bytes &rarr; 0</td>
            <td style={cellStyle}>241,560 &rarr; 213,304 = &minus;11.7%</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>big.cpp -Os</code></td>
            <td style={cellStyle}>96,236 &rarr; 83,920 = <strong>&minus;12.8%</strong></td>
            <td style={cellStyle}>4,068 bytes &rarr; 0</td>
            <td style={cellStyle}>245,960 &rarr; 219,880 = &minus;10.6%</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>app.cpp -O2</code> (smaller program)</td>
            <td style={cellStyle}>59,584 &rarr; 53,068 = <strong>&minus;10.9%</strong></td>
            <td style={cellStyle}>1,980 bytes &rarr; 0</td>
            <td style={cellStyle}>125,728 &rarr; 122,728 = &minus;2.4%</td>
          </tr>
        </tbody>
      </table>

      <p>
        <strong>Roughly 11&ndash;13% of the machine code in an ordinary container-heavy C++ program
        is there to support exceptions</strong>, and it is gone entirely with one flag. The two
        sections that disappear completely — <code>__gcc_except_tab</code> and{' '}
        <code>__unwind_info</code> — are the side tables from the assembly listing earlier. The
        reduction in <code>__text</code> itself is all the landing pads: thousands of small blocks
        of destructor-calling code, one per frame per possible throw point, which exist only to be
        jumped into by the unwinder.
      </p>
      <p>
        Note the third row, which is why you should measure your own program rather than borrow this
        number. The smaller program&apos;s <code>__text</code> shrank by 10.9% but its{' '}
        <strong>file</strong> only shrank by 2.4%, because Mach-O segments are page-aligned and both
        builds still rounded up to the same 81,920-byte <code>__TEXT</code> segment. On a desktop
        that difference is invisible. On a microcontroller with 256 KB of flash, 12% of your code
        space is the difference between shipping and not, and that — not latency — is why embedded
        firmware is the most consistently exception-free corner of the industry.
      </p>

      <InfoBox variant="danger" title="What -fno-exceptions does to the library's own errors: it makes them silent">
        <p>
          The flag does not remove the error conditions, it removes the reporting. libc++&apos;s
          headers are written to call <code>std::abort()</code> where they would have thrown. Same
          source file, same out-of-range access, two builds:
        </p>
        <CodeBlock language="text" title="Real output — v.at(99) on a 3-element vector, both builds">
{`$ clang++ -std=c++23 -Wall -Wextra -O2                 nxlib.cpp -o nxlib
$ clang++ -std=c++23 -Wall -Wextra -O2 -fno-exceptions nxlib.cpp -o nxlib_nx

$ ./nxlib x
about to call v.at(99) -- which WANTS to throw std::out_of_range
libc++abi: terminating due to uncaught exception of type std::out_of_range: vector
exit=134

$ ./nxlib_nx x
about to call v.at(99) -- which WANTS to throw std::out_of_range
exit=134`}
        </CodeBlock>
        <p>
          Both die with SIGABRT. The difference is the <strong>missing diagnostic line.</strong> The
          exception build tells you the type and the message; the <code>-fno-exceptions</code> build
          produces a bare abort with no indication of what went wrong. You get a core dump and a
          stack trace if you are lucky and have a debugger attached, and nothing at all if you are
          reading a customer&apos;s log file.
        </p>
        <p>
          This is the real cost of the ban and it is why it has to be a whole-codebase decision made
          up front. If you turn exceptions off, you are committing to a style where the library
          never needs to report anything: bounds-checked access becomes{' '}
          <code>v[i]</code> with your own check, or <code>v.size()</code> consulted first, or an{' '}
          <code>std::expected</code>-returning accessor you wrote. Turning the flag on an existing
          codebase that uses <code>.at()</code> for validation converts graceful rejections into
          crashes.
        </p>
      </InfoBox>

      <h3>The argument that is not about numbers</h3>
      <p>
        The strongest objection to exceptions has nothing to do with cost, and it is worth stating
        in its own terms because you will meet it in a code review.
      </p>
      <p>
        <strong>Every function call is a potential return point you cannot see.</strong> In a
        codebase with exceptions, this line:
      </p>
      <CodeBlock language="cpp" title="How many ways can control leave this function?">
{`void handle(Request& r) {
    auto session = lookup(r.id);        // can throw
    session.touch();                    // can throw
    auto body = render(session);        // can throw
    r.respond(std::move(body));         // can throw
}`}
      </CodeBlock>
      <p>
        ...has five exit points: the closing brace and four invisible ones. In Go, every one of those
        would be an explicit <code>if err != nil</code>, and{' '}
        <a href="/go/errors">the Go errors lesson</a> spends a whole section on how annoying that is
        — correctly, it <em>is</em> annoying. But the annoyance buys something specific: you can see
        every path out of the function by reading it. The C++ version above requires you to know
        whether each of those four functions throws, which means reading them, which means reading
        what <em>they</em> call.
      </p>
      <p>
        For code where that reasoning has to be local and complete — an interrupt handler, an audio
        callback with a 1 ms deadline, an exchange gateway, a game&apos;s per-frame update loop —
        that is a decisive objection, and it survives every performance measurement on this page. It
        is also the reason the rest of this lesson is not padding. The C++ answer to &quot;make the
        error path visible&quot; is <code>std::expected</code>, and it is good.
      </p>

      <h2><code>noexcept</code>: A Promise With Teeth</h2>
      <p>
        <code>noexcept</code> declares that a function will not let an exception escape. It is not
        documentation and it is not Java&apos;s <code>throws</code> clause inverted — it is enforced
        at runtime, and the enforcement is brutal.
      </p>

      <CodeBlock language="cpp" title="noex.cpp">
{`#include <print>
#include <stdexcept>
#include <string>
#include <vector>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

void inner() { throw std::runtime_error{"thrown from inner()"}; }

// A function that PROMISES not to throw -- and then does.
void liar() noexcept {
    Tracer t{"a local inside the noexcept function"};
    inner();
}

// noexcept is not a muzzle: catching INSIDE is completely fine.
void honest() noexcept {
    Tracer t{"a local inside the honest noexcept function"};
    try { inner(); } catch (const std::exception& e) {
        std::println("  . honest() handled it internally: {}", e.what());
    }
}

int main(int argc, char**) {
    std::println("1. a noexcept function that handles its own exception:");
    honest();

    std::println("2. the noexcept operator is a compile-time query:");
    std::println("   noexcept(inner())   = {}", noexcept(inner()));
    std::println("   noexcept(honest())  = {}", noexcept(honest()));
    std::println("   noexcept(1 + 1)     = {}", noexcept(1 + 1));
    std::println("   std::string move ctor is noexcept = {}",
                 std::is_nothrow_move_constructible_v<std::string>);
    std::println("   std::vector move ctor is noexcept = {}",
                 std::is_nothrow_move_constructible_v<std::vector<int>>);

    if (argc > 1) {
        std::println("3. now calling the liar, inside a try/catch that cannot save it:");
        try { liar(); } catch (const std::exception& e) {
            std::println("   THIS LINE NEVER PRINTS: {}", e.what());
        }
        std::println("   nor does this one");
    } else {
        std::println("3. pass any argument to call the liar.");
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 noex.cpp, the two streams shown separately">
{`$ ./noex                            # no argument: nothing violates anything
1. a noexcept function that handles its own exception:
  + a local inside the honest noexcept function
  . honest() handled it internally: thrown from inner()
  - a local inside the honest noexcept function
2. the noexcept operator is a compile-time query:
   noexcept(inner())   = false
   noexcept(honest())  = true
   noexcept(1 + 1)     = true
   std::string move ctor is noexcept = true
   std::vector move ctor is noexcept = true
3. pass any argument to call the liar.
exit=0

$ ./noex x 2>/dev/null              # stdout
... (blocks 1 and 2 identical) ...
3. now calling the liar, inside a try/catch that cannot save it:
  + a local inside the noexcept function

$ ./noex x 2>&1 1>/dev/null         # stderr
libc++abi: terminating due to uncaught exception of type std::runtime_error: thrown from inner()

$ ./noex x >/dev/null 2>&1; echo $?
134`}
      </CodeBlock>

      <p>
        Look at what the liar&apos;s run printed and what it did not. The <code>+</code> line for its
        local appeared. <strong>There is no <code>-</code> line.</strong> The destructor did not run,
        the <code>try</code>/<code>catch</code> wrapped around the call did not catch,{' '}
        <code>&quot;nor does this one&quot;</code> never printed, and the process died with 134.
      </p>
      <p>
        That is the mechanism: <strong>violating <code>noexcept</code> calls{' '}
        <code>std::terminate</code>, it does not propagate.</strong> The exception does not become a
        different exception, it does not get wrapped, and it cannot be caught — the frame boundary of
        a <code>noexcept</code> function is a hard wall. Note also the destructor evidence: this is
        the <em>no unwinding at all</em> behaviour from the uncaught-exception row in{' '}
        <a href="/cpp/raii">the RAII lesson</a>, and it means a <code>noexcept</code> violation
        skips your cleanup as well as your handler.
      </p>
      <p>
        The <code>honest()</code> function is the other half of the rule and people get it wrong in
        the opposite direction: <strong><code>noexcept</code> does not forbid exceptions inside the
        function.</strong> Throw all you like, catch it before the closing brace, and the promise is
        kept. <code>noexcept</code> is a statement about the boundary, not the body.
      </p>

      <InfoBox variant="warning" title="The compiler only warns when the throw is in the same function">
        <p>
          Clang does have a warning for this, in <code>-Wall</code> — but its reach is exactly one
          function deep:
        </p>
        <CodeBlock language="cpp" title="direct.cpp">
{`#include <stdexcept>
void inner();
void direct() noexcept { throw std::runtime_error{"right here"}; }   // visible in this function
void indirect() noexcept { inner(); }                                // one call away`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fsyntax-only direct.cpp">
{`direct.cpp:3:26: warning: 'direct' has a non-throwing exception specification but can still
      throw [-Wexceptions]
    3 | void direct() noexcept { throw std::runtime_error{"right here"}; }
      |                          ^
direct.cpp:3:6: note: function declared non-throwing here
    3 | void direct() noexcept { throw std::runtime_error{"right here"}; }
      |      ^        ~~~~~~~~
1 warning generated.`}
        </CodeBlock>
        <p>
          <code>direct()</code> is caught. <code>indirect()</code> is not, and neither was{' '}
          <code>liar()</code> — I checked <code>-Weverything</code> as well, and nothing in it
          mentions the lie. Interprocedural checking would require whole-program analysis the
          compiler does not do here. So the rule for writing <code>noexcept</code> is:{' '}
          <strong>only put it on a function whose entire call tree you can account for</strong>, and
          when in doubt leave it off. An absent <code>noexcept</code> costs you an optimisation; an
          incorrect one costs you the process.
        </p>
      </InfoBox>

      <h3>What <code>noexcept</code> buys, in instructions</h3>
      <p>
        It is not a documentation annotation. It deletes code. Two callers, each with an RAII local,
        differing only in whether the callee promises not to throw:
      </p>

      <CodeBlock language="cpp" title="nxasm.cpp">
{`struct Guard { int* p; ~Guard(); };
int may_throw(int);
int never_throws(int) noexcept;

int caller_unknown(int i)  { int x = i; Guard g{&x}; return may_throw(i); }
int caller_noexcept(int i) { int x = i; Guard g{&x}; return never_throws(i); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S, directives stripped">
{`__Z14caller_unknowni:
Lfunc_begin0:
	sub	sp, sp, #48
	stp	x20, x19, [sp, #16]
	stp	x29, x30, [sp, #32]
	add	x29, sp, #32
	str	w0, [sp, #12]
	add	x8, sp, #12
	str	x8, [sp]
Ltmp0:
	bl	__Z9may_throwi
Ltmp1:
	mov	x19, x0
	mov	x0, sp
	bl	__ZN5GuardD1Ev
	mov	x0, x19
	ldp	x29, x30, [sp, #32]
	ldp	x20, x19, [sp, #16]
	add	sp, sp, #48
	ret
LBB0_2:                                  ; <- LANDING PAD
Ltmp2:
	mov	x19, x0
	mov	x0, sp
	bl	__ZN5GuardD1Ev                   ;    run the destructor...
	mov	x0, x19
	bl	__Unwind_Resume                  ;    ...then keep unwinding
Lfunc_end0:
GCC_except_table0:                       ; <- SIDE TABLE
Lexception0:
Lcst_begin0:
Lcst_end0:

__Z15caller_noexcepti:
	sub	sp, sp, #48
	stp	x20, x19, [sp, #16]
	stp	x29, x30, [sp, #32]
	add	x29, sp, #32
	str	w0, [sp, #12]
	add	x8, sp, #12
	str	x8, [sp]
	bl	__Z12never_throwsi
	mov	x19, x0
	mov	x0, sp
	bl	__ZN5GuardD1Ev
	mov	x0, x19
	ldp	x29, x30, [sp, #32]
	ldp	x20, x19, [sp, #16]
	add	sp, sp, #48
	ret
                                         ; <- no landing pad. no except table.
                                         ;    no Lfunc_begin/Ltmp labels at all.`}
      </CodeBlock>

      <p>
        <code>caller_noexcept</code> has <strong>no landing pad, no exception table, and no unwind
        labels.</strong> Not smaller ones — none. Multiply that across a header-only library
        instantiated a few thousand times and you have the 12% from the binary-size section,
        recovered selectively rather than by banning the feature.
      </p>

      <h3>The <code>noexcept</code> that changes behaviour, not just size</h3>
      <p>
        There is one place where <code>noexcept</code> is not an optimisation but a switch between
        two different algorithms, and it is the single most practically important use of the keyword.
        When <code>std::vector</code> grows, it has to relocate the existing elements, and it has to
        do so without losing them if an element&apos;s constructor fails. It decides how via{' '}
        <code>std::move_if_noexcept</code>:
      </p>

      <CodeBlock language="cpp" title="guarantees2.cpp — one element type, parameterised on a single noexcept">
{`template <bool NoexceptMove>
struct Elem {
    int id;
    static int copies, moves;
    explicit Elem(int i) : id(i) {}
    Elem(const Elem& o) : id(o.id) { ++copies; }
    Elem(Elem&& o) noexcept(NoexceptMove) : id(o.id) { ++moves; }
    Elem& operator=(const Elem&) = default;
    Elem& operator=(Elem&&) = default;
};

template <bool NoexceptMove>
static void grow(const char* label) {
    using E = Elem<NoexceptMove>;
    E::copies = E::moves = 0;
    std::vector<E> v;
    v.reserve(4);
    for (int i = 0; i < 4; ++i) v.emplace_back(i);
    v.emplace_back(4);                 // forces one reallocation of 4 existing elements
    std::println("  {:<34} nothrow_move={:<5}  relocation used {} copies, {} moves",
                 label, std::is_nothrow_move_constructible_v<E>, E::copies, E::moves);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 guarantees2.cpp && ./guarantees2">
{`vector growth: 4 elements relocated into a bigger buffer
  move ctor NOT marked noexcept      nothrow_move=false  relocation used 4 copies, 0 moves
  move ctor marked noexcept          nothrow_move=true   relocation used 0 copies, 4 moves`}
      </CodeBlock>

      <p>
        <strong>One keyword, and the container stopped copying.</strong> The reason is the exception
        guarantee: <code>vector</code> promises that if growth fails, your vector is untouched. If
        moves could throw, a half-finished relocation would have left the old buffer gutted and the
        new one incomplete — unrecoverable. So <code>vector</code> only moves when moving cannot
        fail, and otherwise copies, keeping the originals intact until the relocation has succeeded.
      </p>
      <p>
        For a type holding a <code>std::string</code> or a <code>std::vector</code> this is the
        difference between relocating a pointer and allocating a new buffer per element. It is also
        invisible: nothing warns, nothing fails, your container just got slower.{' '}
        <a href="/cpp/move-semantics">The move-semantics lesson</a> covers when a move constructor
        can be <code>noexcept</code>; the rule of thumb is that if your move is
        member-wise moves of standard-library types, it can be, and the compiler-generated one
        already is.
      </p>

      <InfoBox variant="tip" title="Where to put noexcept, and where not to">
        <p>
          <strong>Yes, and it matters:</strong> move constructors and move assignment (the
          measurement above); <code>swap</code>; destructors (already implicitly{' '}
          <code>noexcept</code> — you have to write <code>noexcept(false)</code> to opt out);
          anything you will call from a destructor or a <code>catch</code> block; and the leaf
          observers — <code>size()</code>, <code>empty()</code>, <code>data()</code>,{' '}
          <code>begin()</code>.
        </p>
        <p>
          <strong>No:</strong> anything that allocates, anything that takes a path or a string,
          anything virtual that a derived class might need to fail in, and anything whose
          implementation you expect to change. <code>noexcept</code> is part of your published
          contract — removing it later is a breaking change for callers who relied on it, and
          adding it later is free. Default to leaving it off and add it where you can prove it.
        </p>
      </InfoBox>

      <h2>The Three Exception-Safety Guarantees</h2>
      <p>
        If your code can be unwound through, every function acquires a second specification: what is
        true if it fails half way. There are four standard answers, and they are worth knowing by
        name because the standard library documents itself in these terms.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Guarantee</th>
            <th style={headStyle}>If it throws...</th>
            <th style={headStyle}>Examples</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><strong>No guarantee</strong></td>
            <td style={cellStyle}>anything. Leaks, corrupt invariants, dangling pointers. The
              object is unusable and so is the program.</td>
            <td style={cellStyle}>the raw-owning-pointer function from{' '}
              <a href="/cpp/raii">the RAII lesson</a> that leaked on two of three paths</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><strong>Basic</strong></td>
            <td style={cellStyle}>no leaks, all invariants hold, every object is destructible and
              assignable — but the <em>values</em> may have changed unpredictably</td>
            <td style={cellStyle}>the floor for everything you write. RAII gets you here for free.{' '}
              <code>vector::insert</code> in the middle</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><strong>Strong</strong></td>
            <td style={cellStyle}>nothing changed. The operation either completed or had no
              effect — a transaction, with rollback</td>
            <td style={cellStyle}><code>vector::push_back</code>, <code>vector::reserve</code>,{' '}
              <code>map::insert</code>. Achieved by copy-and-swap</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><strong>Nothrow</strong></td>
            <td style={cellStyle}>it cannot throw. Marked <code>noexcept</code> and meant.</td>
            <td style={cellStyle}><code>swap</code>, <code>~T()</code>, <code>size()</code>,
              moves of standard containers</td>
          </tr>
        </tbody>
      </table>

      <p>
        The strong guarantee is the interesting one, because it is the one you can actually observe.{' '}
        <code>push_back</code> on a full vector has to allocate a bigger buffer and relocate four
        elements — so give it an element type whose copy constructor fails on the third copy, and
        see what state the vector is left in:
      </p>

      <CodeBlock language="cpp" title="guarantees.cpp — an element that can be told to fail mid-relocation">
{`struct Fragile {
    int id;
    static int copies_until_failure;
    static int copies_made;
    static int moves_made;

    explicit Fragile(int i) : id(i) {}
    Fragile(const Fragile& o) : id(o.id) {
        ++copies_made;
        if (copies_until_failure > 0 && copies_made >= copies_until_failure)
            throw std::runtime_error{"copy ctor failed on copy #" + std::to_string(copies_made)};
    }
    // NOTE: deliberately NOT noexcept -- so relocation will use the copy ctor above.
    Fragile(Fragile&& o) : id(o.id) { ++moves_made; }
    Fragile& operator=(const Fragile&) = default;
    Fragile& operator=(Fragile&&) = default;
};

// ...in main():
std::vector<Fragile> v;
v.reserve(4);
for (int i = 0; i < 4; ++i) v.emplace_back(i);     // size == capacity == 4

Fragile::copies_made = 0;
Fragile::copies_until_failure = 3;                 // blow up part-way through the relocation
try {
    v.push_back(Fragile{99});                      // must reallocate and relocate all 4
} catch (const std::exception& e) {
    std::println("  caught during push_back: {}", e.what());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 guarantees.cpp && ./guarantees">
{`1. STRONG guarantee: vector::push_back reallocates, an element throws.
  before                 size=4 cap=4  ids=[0 1 2 3 ]
  capacity is full, so the next push_back must reallocate and relocate 4 elements
  caught during push_back: copy ctor failed on copy #3
  after the throw        size=4 cap=4  ids=[0 1 2 3 ]
  -> unchanged. Same size, same elements, still usable. That is STRONG.

2. Why relocation used COPIES at all:
  is_nothrow_move_constructible_v<Fragile> = false
  copies made during that relocation = 3, moves made = 1`}
      </CodeBlock>

      <p>
        <strong>Same size, same capacity, same four elements.</strong> The allocation happened, three
        elements were copied into it, the third copy threw, and <code>vector</code> unwound its own
        work: destroyed the elements it had constructed, freed the new buffer, and left the original
        buffer exactly as it was. No leak, no half-populated container, no gap in the sequence.
      </p>
      <p>
        That is not something <code>vector</code> gets for free — it is the <strong>copy-and-swap
        idiom</strong>, and it is the general technique for giving your own operations the strong
        guarantee. The shape is always the same:
      </p>

      <CodeBlock language="cpp" title="The strong guarantee, as a pattern">
{`// WEAK: this has the basic guarantee at best. If the second line throws, the
// object is left with name_ updated and rows_ not -- a state that may violate
// an invariant between them.
void Table::load_weak(const Config& c) {
    name_ = c.name;                      // may throw (allocates)
    rows_ = fetch(c);                    // may throw
}

// STRONG: do all the work that can fail on the SIDE, then commit with
// operations that cannot fail. If anything throws, *this was never touched.
void Table::load_strong(const Config& c) {
    std::string      new_name = c.name;  // may throw -- but only locals exist yet
    std::vector<Row> new_rows = fetch(c);// may throw -- ditto

    name_.swap(new_name);                // noexcept
    rows_.swap(new_rows);                // noexcept
}                                        // the old values die here, in the locals`}
      </CodeBlock>

      <p>
        Everything that can fail happens before anything is modified; the commit step uses only{' '}
        <code>noexcept</code> operations. <strong>This is why <code>swap</code> being{' '}
        <code>noexcept</code> matters so much</strong> — it is the only primitive that lets you
        exchange two states with no possibility of failure, which is what makes an atomic commit
        possible at all.
      </p>
      <p>
        One honest caveat, because the strong guarantee is not free and is not always right. The
        strong version above holds a second copy of the data in memory at peak, and for a large
        container that may be unacceptable. The standard library makes the same trade explicitly:{' '}
        <code>push_back</code> is strong, but <code>insert</code> into the middle is only basic,
        because making it strong would mean copying the whole container on every insert. Aim for
        basic everywhere, strong where a failed operation would otherwise leave an object a caller
        has to throw away.
      </p>

      <InfoBox variant="danger" title="Destructors and the double-exception rule">
        <p>
          A destructor that throws while an exception is already propagating has nowhere to put the
          second one, so the standard does not try: <code>std::terminate</code>. Destructors are
          implicitly <code>noexcept</code> precisely to make this a compile-time-visible decision
          rather than an accident — you have to write <code>noexcept(false)</code> to even get
          there:
        </p>
        <CodeBlock language="cpp" title="ctor.cpp — the relevant part">
{`struct Rude {
    bool armed;
    ~Rude() noexcept(false) {                 // you have to opt in to even write this
        if (armed) throw std::runtime_error{"thrown from a destructor"};
    }
};

// ...in main():
try {
    Rude r{true};
    throw std::runtime_error{"the first exception"};
} catch (const std::exception& e) {
    std::println("   never printed: {}", e.what());
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ctor.cpp && ./ctor x">
{`$ ./ctor x 2>/dev/null              # stdout
3. is ~Rude noexcept by default? no (we opted out)
4. throwing from a destructor DURING unwinding:

$ ./ctor x 2>&1 1>/dev/null         # stderr
libc++abi: terminating due to uncaught exception of type std::runtime_error: thrown from a destructor

$ ./ctor x >/dev/null 2>&1; echo $?
134`}
        </CodeBlock>
        <p>
          Note which exception is named in the diagnostic: the <em>destructor&apos;s</em>, not the
          original. The first one is simply lost, and so is any chance of diagnosing the real
          failure. This is where C++ differs sharply from Java, which models the situation instead
          of forbidding it — <code>try</code>-with-resources attaches the second exception to the
          first as a <em>suppressed</em> exception, which{' '}
          <a href="/cpp/raii">the RAII lesson</a> demonstrated running on JDK 26.
        </p>
        <p>
          The practical rule is the one <a href="/cpp/raii">that lesson</a> already gave for{' '}
          <code>~ofstream</code>: <strong>if releasing a resource can fail and you care, provide an
          explicit <code>close()</code>-style method that can report, and let the destructor be the
          silent safety net.</strong> Never let an exception leave a destructor.
        </p>
      </InfoBox>

      <h2><code>std::expected&lt;T, E&gt;</code> — The C++23 Answer</h2>
      <p>
        This is the headline feature of this lesson and the thing to actually learn, because it is
        new enough that the C++ you half-remember does not contain it and good enough that new code
        should default to it for anything other than genuinely exceptional failures.
      </p>
      <p>
        <code>std::expected&lt;T, E&gt;</code> holds <em>either</em> a <code>T</code> or an{' '}
        <code>E</code>, never both and never neither. It is a sum type — a tagged union — returned
        by value. If that sounds like Rust&apos;s <code>Result</code>, it is; if it sounds like
        Go&apos;s <code>(T, error)</code>, it is close but strictly better-typed, and the difference
        is worth dwelling on since <a href="/go/errors">the Go errors lesson</a> is fresh.
      </p>

      <CodeBlock language="cpp" title="exp.cpp — a real pipeline">
{`#include <charconv>
#include <expected>
#include <print>
#include <string>
#include <string_view>

// One error type for the whole pipeline. An enum is the cheapest useful choice.
enum class ParseError { empty, not_a_number, out_of_range, too_small };

constexpr std::string_view describe(ParseError e) {
    switch (e) {
        case ParseError::empty:        return "empty input";
        case ParseError::not_a_number: return "not a number";
        case ParseError::out_of_range: return "out of range for int";
        case ParseError::too_small:    return "must be at least 1024";
    }
    return "unknown";
}

std::expected<int, ParseError> parse_int(std::string_view s) {
    if (s.empty()) return std::unexpected{ParseError::empty};
    int value{};
    auto [ptr, ec] = std::from_chars(s.data(), s.data() + s.size(), value);
    if (ec == std::errc::invalid_argument)    return std::unexpected{ParseError::not_a_number};
    if (ec == std::errc::result_out_of_range) return std::unexpected{ParseError::out_of_range};
    if (ptr != s.data() + s.size())           return std::unexpected{ParseError::not_a_number};
    return value;                            // implicit conversion into the expected
}

std::expected<int, ParseError> check_port(int p) {
    if (p < 1024) return std::unexpected{ParseError::too_small};
    return p;
}

// The monadic form: and_then chains the success path, transform maps the value,
// transform_error maps the error. Nothing branches explicitly.
std::expected<std::string, std::string> port_banner(std::string_view s) {
    return parse_int(s)
        .and_then(check_port)
        .transform([](int p) { return "listening on " + std::to_string(p); })
        .transform_error([](ParseError e) { return std::string{describe(e)}; });
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 exp.cpp && ./exp">
{`1. sizes -- these are value types, not boxes:
   sizeof(int)                                 = 4
   sizeof(std::expected<int, ParseError>)      = 8
   sizeof(std::optional<int>)                  = 8
   sizeof(std::expected<int, std::string>)     = 32
   sizeof(std::expected<void, ParseError>)     = 8
   sizeof(std::error_code)                     = 16

2. the pipeline, five inputs:
   "8080"           -> ok:    listening on 8080
   "80"             -> error: must be at least 1024
   ""               -> error: empty input
   "80a8"           -> error: not a number
   "99999999999999" -> error: out of range for int

3. the three ways to get a value out:
   bool(bad)                  = false
   bad.has_value()            = false
   bad.value_or(-1)           = -1
   describe(bad.error())      = not a number
   bad.value() threw          = bad access to std::expected (error was: not a number)`}
      </CodeBlock>

      <p>
        Three things from that output deserve naming.
      </p>
      <p>
        <strong>It is a value, not a box.</strong>{' '}
        <code>sizeof(std::expected&lt;int, ParseError&gt;)</code> is 8 bytes — the 4-byte{' '}
        <code>int</code>, the 4-byte enum occupying the same storage, and a discriminator in the
        padding. No allocation, no indirection, no vtable. Returning one is returning two registers.
        Compare 2 µs and a separate heap allocation for a throw.
      </p>
      <p>
        <strong>The monadic operations are the point.</strong> <code>port_banner</code> chains four
        fallible steps with no <code>if</code> and no early return. <code>and_then</code> runs the
        next fallible step only on success and short-circuits otherwise;{' '}
        <code>transform</code> maps a success value with an infallible function;{' '}
        <code>transform_error</code> maps the error, which is how you translate a low-level error
        type into your layer&apos;s error type at a boundary. <code>or_else</code> is the fourth,
        for recovery. This is the answer to Go&apos;s verbosity problem, and it is the one thing
        Go&apos;s model genuinely cannot express.
      </p>
      <p>
        <strong><code>.value()</code> throws; <code>operator*</code> does not check.</strong>{' '}
        <code>bad.value()</code> threw <code>std::bad_expected_access&lt;ParseError&gt;</code>, which
        carries the error for you to inspect. <code>*bad</code> would have been{' '}
        <strong>undefined behaviour</strong> — the same relationship as <code>vector::at</code>{' '}
        versus <code>vector::operator[]</code>. Check first, then dereference with <code>*</code>;
        use <code>.value()</code> only where you are prepared for it to throw.
      </p>

      <InfoBox variant="danger" title="The gotcha: std::expected is not [[nodiscard]] in this libc++">
        <p>
          The entire selling point of returning errors as values is that the caller has to look at
          them. I assumed the library enforced that. It does not:
        </p>
        <CodeBlock language="cpp" title="discard.cpp">
{`std::expected<int, std::string> f();
std::optional<int>              g();
std::error_code                 h();
[[nodiscard]] std::expected<int, std::string> f_nd();

void ignore_everything() {
    f();        // the error is dropped on the floor
    g();
    h();
    f_nd();     // same thing, but the FUNCTION is marked nodiscard
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fsyntax-only discard.cpp">
{`discard.cpp:15:5: warning: ignoring return value of function declared with 'nodiscard'
      attribute [-Wunused-result]
   15 |     f_nd();     // same thing, but the FUNCTION is marked nodiscard
      |     ^~~~
1 warning generated.`}
        </CodeBlock>
        <p>
          <strong>One warning, for the one function that was marked by hand.</strong> Discarding a
          returned <code>std::expected</code>, <code>std::optional</code> or{' '}
          <code>std::error_code</code> compiles silently under <code>-Wall -Wextra</code>. I checked
          the header to be sure, and <code>class expected</code> in libc++ 220106 carries no{' '}
          <code>[[nodiscard]]</code> on the class itself. The committee considered marking it and
          did not, partly because an <code>expected&lt;void, E&gt;</code> from a fire-and-forget
          call is a legitimate thing to ignore.
        </p>
        <p>
          <strong>So mark your own functions.</strong>{' '}
          <code>[[nodiscard]] std::expected&lt;Config, Error&gt; load(...)</code>, every time. This
          is exactly Go&apos;s unchecked-error problem — where ignoring a returned{' '}
          <code>error</code> also compiles clean and you need <code>errcheck</code> or a linter to
          see it — with the difference that C++ puts the fix in the language rather than in a
          separate tool. It is three words and it converts a silent bug into a build warning.
        </p>
      </InfoBox>

      <h3>Compared with Go&apos;s error values</h3>
      <p>
        You have the Go model fresh, so this comparison does most of the explaining. The same
        function, both languages:
      </p>

      <CodeBlock language="go" title="Go — two return values, nil means success">
{`func parsePort(s string) (int, error) {
	v, err := strconv.Atoi(s)
	if err != nil {
		return 0, fmt.Errorf("parsing port %q: %w", s, err)   // wrap and bubble
	}
	if v < 1024 {
		return 0, ErrPortTooSmall                              // a sentinel
	}
	return v, nil
}

// at the call site, every single time:
port, err := parsePort(s)
if err != nil {
	return err
}`}
      </CodeBlock>

      <CodeBlock language="cpp" title="C++23 — one return value that is either/or">
{`std::expected<int, ParseError> parse_port(std::string_view s) {
    return parse_int(s).and_then(check_port);     // short-circuits; no if
}

// at the call site:
auto port = parse_port(s);
if (!port) return std::unexpected{port.error()};  // or just: return port;`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}>Go <code>(T, error)</code></th>
            <th style={headStyle}>C++ <code>std::expected&lt;T, E&gt;</code></th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Shape</td>
            <td style={cellStyle}>a <em>product</em> — both values always exist. A non-nil error
              with a meaningful <code>T</code> is representable, and so is nil-error-with-zero-value</td>
            <td style={cellStyle}>a <em>sum</em> — exactly one exists. &quot;error but also a
              value&quot; cannot be written</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Error type</td>
            <td style={cellStyle}>an interface, so dynamically dispatched and usually heap-allocated;
              any error can come back from anywhere</td>
            <td style={cellStyle}>whatever you declare. An enum costs 4 bytes and the set of
              possible errors is in the signature</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Ignoring it</td>
            <td style={cellStyle}>compiles. <code>_</code> is explicit, bare ignoring needs a linter</td>
            <td style={cellStyle}>compiles — <strong>verified above</strong> — unless you marked the
              function <code>[[nodiscard]]</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Chaining</td>
            <td style={cellStyle}>no mechanism. Every step is an explicit <code>if err != nil</code></td>
            <td style={cellStyle}><code>and_then</code>, <code>transform</code>,{' '}
              <code>transform_error</code>, <code>or_else</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Wrapping / chains of cause</td>
            <td style={cellStyle}>excellent: <code>%w</code>, <code>errors.Is</code>,{' '}
              <code>errors.As</code> — a standardised, idiomatic cause chain</td>
            <td style={cellStyle}><strong>nothing standard.</strong> You design your own{' '}
              <code>E</code>, including any nesting. This is Go&apos;s clear win</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Constructors / operators</td>
            <td style={cellStyle}>not applicable — Go has neither</td>
            <td style={cellStyle}><strong>cannot use it.</strong> A constructor has no return value.
              See the next section</td>
          </tr>
        </tbody>
      </table>

      <p>
        The sum-versus-product distinction is not pedantry. In Go you can write{' '}
        <code>return v, err</code> with both meaningful and the caller may read <code>v</code> after
        a non-nil <code>err</code>; the convention that you must not is a convention.{' '}
        <code>std::expected</code> makes it unrepresentable — reaching for the value when the error
        is set is a check you can perform, not a discipline you must maintain.
      </p>
      <p>
        Equally, <strong>Go&apos;s error wrapping is genuinely better and C++ has no answer to
        it.</strong> There is no standard way to say &quot;this failed because that failed because
        the socket closed&quot; and walk the chain with <code>errors.Is</code>. If you need that in
        C++ you build it: an error type holding a code plus context, or a{' '}
        <code>std::vector&lt;std::string&gt;</code> of context strings, or — in exception-using code
        — <code>std::throw_with_nested</code> and <code>std::rethrow_if_nested</code>, which exist
        and are almost never used. When you design your <code>E</code>, design for this up front,
        because retrofitting context into an enum is painful.
      </p>

      <h2>Where <code>std::expected</code> Cannot Go: Constructors</h2>
      <p>
        A constructor has no return channel. None. If the arguments are invalid, the options are:
        throw, or do not let anyone call the constructor.
      </p>

      <CodeBlock language="cpp" title="ctor.cpp — the two shapes">
{`// A constructor has no return channel. If the arguments are bad, the only ways
// out are: throw, or do not use a public constructor.
struct Port {
    int value;
    explicit Port(int v) : value(v) {
        if (v < 1024) throw std::invalid_argument{"port must be >= 1024, got "
                                                  + std::to_string(v)};
    }
};

// The -fno-exceptions-compatible shape: private constructor, static factory.
class SafePort {
    int value_;
    explicit SafePort(int v) noexcept : value_(v) {}
public:
    static std::expected<SafePort, std::string> make(int v) {
        if (v < 1024) return std::unexpected{"port must be >= 1024, got " + std::to_string(v)};
        return SafePort{v};
    }
    int value() const noexcept { return value_; }
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ctor.cpp && ./ctor">
{`1. constructor validation by throwing:
   Port(8080) ok, value = 8080
   Port(80) threw: port must be >= 1024, got 80
2. the same validation with no exceptions anywhere:
   SafePort::make(8080) ok, value = 8080
   SafePort::make(80) failed: port must be >= 1024, got 80
3. is ~Rude noexcept by default? no (we opted out)
4. pass an argument to run the double-exception case.`}
      </CodeBlock>

      <p>
        Both work, and the choice has consequences beyond style. <code>Port</code> reads naturally,
        composes with everything (containers, aggregate initialisation, base-class initialiser
        lists) and cannot be constructed in an invalid state — which is the whole point of putting
        validation in a constructor.
      </p>
      <p>
        <code>SafePort</code> never throws, works under <code>-fno-exceptions</code>, and makes the
        failure visible in the signature. The cost is that it is no longer a normal type: you cannot
        write <code>SafePort p{'{'}8080{'}'}</code>, you cannot use it as a member without threading
        the factory through your own constructor, and it needs a move constructor for{' '}
        <code>make</code> to return it.
      </p>
      <p>
        <strong>This is the structural reason exception-free C++ is a different dialect rather than
        a flag.</strong> Banning exceptions bans throwing constructors, which bans validating
        constructors, which pushes every fallible type onto a static-factory pattern. It is a
        coherent style — it is roughly how a lot of game engine code is written — but it is not the
        same language with one feature removed.
      </p>

      <h2><code>std::optional</code> and Error Codes</h2>
      <p>
        Two more channels, each right for a narrower case.
      </p>
      <p>
        <strong><code>std::optional&lt;T&gt;</code> is for when nothing went wrong.</strong> A
        lookup that finds nothing, a parse of an optional field, the first element of an empty
        range — there is no error to report, because no failure occurred. Reaching for{' '}
        <code>expected&lt;T, E&gt;</code> here forces you to invent an error value that means
        &quot;it is fine, there just isn&apos;t one&quot;, and that is how you end up with an enum
        containing <code>NotAnError</code>.
      </p>
      <p>
        <strong><code>std::error_code</code> is a 16-byte value: an <code>int</code> plus a pointer
        to a category.</strong> It is what the standard library uses for its non-throwing overloads
        and it is the right choice when you are wrapping an OS API that already has numeric error
        codes. <code>&lt;filesystem&gt;</code> is the clearest example in the library, because it
        offers <em>both</em> channels for every operation:
      </p>

      <CodeBlock language="cpp" title="ec.cpp">
{`namespace fs = std::filesystem;

const fs::path missing{"/definitely/not/here/config.toml"};

// the throwing overload
try {
    auto n = fs::file_size(missing);
    std::println("   throwing overload: {} bytes", n);
} catch (const fs::filesystem_error& e) {
    std::println("   throwing overload threw: {}", e.what());
    std::println("     .code()        = {} ({})", e.code().value(), e.code().message());
    std::println("     .path1()       = {}", e.path1().string());
}

// the error_code overload -- same function, one extra argument, never throws
std::error_code ec;
auto n = fs::file_size(missing, ec);
std::println("   error_code overload: returned {}, ec = {} ({})",
             static_cast<long long>(n), ec.value(), ec.message());
std::println("     ec == std::errc::no_such_file_or_directory -> {}",
             ec == std::errc::no_such_file_or_directory);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ec.cpp && ./ec">
{`1. the SAME standard-library call, two overloads:
   throwing overload threw: filesystem error: in file_size: No such file or directory ["/definitely/not/here/config.toml"]
     .code()        = 2 (No such file or directory)
     .path1()       = /definitely/not/here/config.toml
   error_code overload: returned -1, ec = 2 (No such file or directory)
     ec == std::errc::no_such_file_or_directory -> true
     ec.category().name() = generic

2. std::optional, for the case where nothing went wrong:
   find_header("Host") -> "example.com"
   find_header("Content-Length") -> "42"
   find_header("Authorization") -> (absent)
   and the monadic form chains without an if:
   Content-Length as int, or -1 = 42
   Authorization  as int, or -1 = -1`}
      </CodeBlock>

      <p>
        The dual-overload pattern is the standard library hedging the very argument this lesson is
        about, and it is a reasonable thing to copy in a library of your own: offer the throwing
        form for callers who want it, and an <code>error_code</code> or <code>expected</code> form
        for callers who cannot.
      </p>
      <p>
        Two details from that output worth noticing. The non-throwing <code>file_size</code>{' '}
        returned <strong><code>-1</code></strong> — that is{' '}
        <code>static_cast&lt;std::uintmax_t&gt;(-1)</code>, the documented failure sentinel — which
        is a reminder that <code>error_code</code>-style APIs always need an in-band bad value for
        the return, the exact problem <code>expected</code> exists to remove. And{' '}
        <code>ec.category().name()</code> came back as <code>generic</code>, not{' '}
        <code>system</code>; <code>std::errc</code> comparisons work across categories because
        libc++ maps them, but do not compare <code>.value()</code> against a raw number without
        checking the category.
      </p>
      <p>
        Note also that <code>std::optional</code> has the same monadic operations as{' '}
        <code>expected</code> — <code>transform</code>, <code>and_then</code>,{' '}
        <code>or_else</code>, <code>value_or</code> — since C++23. The{' '}
        <code>.transform(...).value_or(-1)</code> chain in block 2 is the idiomatic way to say
        &quot;convert it if it is there, otherwise use a default&quot; without an{' '}
        <code>if</code>.
      </p>

      <h2>Choosing, Honestly</h2>

      <FlowChart
        title="Which error channel — with the measured consequences attached"
        chart={
          'graph TD\n' +
          '  Q["A function cannot produce its result.<br/>Which channel?"] --> A{"is \'nothing there\' a<br/>NORMAL, expected answer<br/>with no reason attached?"}\n' +
          '  A -->|yes| OPT["std::optional&lt;T&gt;<br/>find, lookup, first-match.<br/>8 bytes for an int. No error to report<br/>because nothing went wrong."]\n' +
          '  A -->|"no, there is a REASON<br/>the caller needs"| B{"how often does it fail,<br/>in production, per call?"}\n' +
          '  B -->|"routinely — per row,<br/>per field, per packet"| EXP["std::expected&lt;T, E&gt; (C++23)<br/>Measured: flat 13-15 ms for 2,000,000<br/>parses at EVERY error rate from 0% to 10%."]\n' +
          '  B -->|"rarely — once per request,<br/>per connection, per file"| C{"can every caller<br/>between here and the<br/>handler be trusted to<br/>check a return value?"}\n' +
          '  C -->|"no — deep call chains,<br/>operators, constructors"| THR["throw<br/>Constructors have no return channel at all,<br/>so for them this is the only option."]\n' +
          '  C -->|"yes, and the build<br/>bans exceptions"| ERRC["std::error_code / std::expected<br/>What -fno-exceptions codebases use."]\n' +
          '  B -->|"it is a BUG, not a<br/>runtime condition"| CONTRACT["Do not report it. Assert, or make it<br/>unrepresentable in the type.<br/>A precondition violation is not an error."]\n' +
          '  EXP --> ND["Verified gotcha: std::expected is NOT<br/>[[nodiscard]] in this libc++. Dropping one<br/>compiles clean under -Wall -Wextra.<br/>Mark YOUR functions [[nodiscard]]."]\n' +
          '  THR --> COST["Measured: about 2.0 microseconds per<br/>throw+catch, independent of what you<br/>throw and nearly independent of depth.<br/>Happy path: +0.26 ns, one lost tail call."]\n' +
          '  style OPT fill:#1a2744,stroke:#5b9cf6\n' +
          '  style EXP fill:#1a3329,stroke:#4ade80\n' +
          '  style THR fill:#3d2f14,stroke:#fb923c\n' +
          '  style ERRC fill:#1a2744,stroke:#5b9cf6\n' +
          '  style CONTRACT fill:#2a1f44,stroke:#a78bfa\n' +
          '  style ND fill:#3d2f14,stroke:#fb923c\n' +
          '  style COST fill:#3d2f14,stroke:#fb923c'
        }
      />

      <InfoBox variant="success" title="The guidance, as four rules">
        <p>
          <strong>1. Default to <code>std::expected</code> for anything a caller might reasonably
          handle.</strong> Parsing, validation, lookups with reasons, I/O that is expected to fail
          sometimes, anything per-item. It is in the signature, it costs under a nanosecond either
          way, its performance does not depend on your input data, and the monadic operations make
          the chaining readable. Mark the function <code>[[nodiscard]]</code>.
        </p>
        <p>
          <strong>2. Throw for failures that are genuinely exceptional and genuinely rare</strong> —
          and specifically where the error has to cross many frames that have nothing useful to say
          about it. Configuration that cannot be loaded at startup. A database connection that has
          died under a request handler. Anything inside a constructor. At one failure in ten
          thousand the measurement says you are paying nothing.
        </p>
        <p>
          <strong>3. Use <code>std::optional</code> when there is no error, only an absence,</strong>{' '}
          and <code>std::error_code</code> when you are the thin layer over an OS API that already
          speaks in numbers.
        </p>
        <p>
          <strong>4. Do not report programmer errors at all.</strong> A null pointer where the
          contract says non-null, an index the caller promised was in range, a state machine in an
          impossible state — these are bugs, not runtime conditions. Assert in debug, or better,
          change the signature so the bad call cannot be written. Converting a bug into a
          well-handled error path mostly buys you a program that limps onward with corrupt state.
        </p>
        <p>
          And one meta-rule: <strong>whichever you choose, choose it for the whole
          codebase.</strong> The expensive situation is not exceptions or error values, it is both,
          at every layer boundary, with adapter code in between.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="Two things on the horizon, so you recognise them">
        <p>
          <strong>Herb Sutter&apos;s P0709 (&quot;Zero-overhead deterministic exceptions&quot;)</strong>{' '}
          proposes <code>throws</code>-marked functions that return errors in a register via the
          normal return path, no allocation, no RTTI lookup, no table walk — which would make
          throwing cost about what <code>expected</code> costs while keeping the syntax. It is a
          large proposal, it is not in C++23 or C++26, and it may never land. It is worth knowing
          about because it reframes the whole debate on this page as a problem with{' '}
          <em>this implementation</em> of exceptions rather than with the idea.
        </p>
        <p>
          <strong>Contracts</strong> (<code>pre</code>, <code>post</code>, <code>contract_assert</code>)
          are the standardised form of rule 4 above and are landing in C++26. They are the
          mechanism for expressing &quot;this is a bug, not an error&quot; in the language rather
          than in a comment. This toolchain accepts <code>-std=c++26</code> but the feature is not
          available in it yet, so nothing on this page claims to have run any.
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
            <td style={cellStyle}>&quot;Exceptions are how you report errors&quot;</td>
            <td style={cellStyle}>At a 1% failure rate the exception version of the same parser was{' '}
              <strong>5.3x</strong> slower; at 10%, <strong>40x</strong> (610 ms vs 15 ms for 2M
              fields).</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;...so error values must be faster&quot;</td>
            <td style={cellStyle}>Not on the happy path. At a <strong>0%</strong> error rate the
              exception version won, 12.05 ms to 13.40 ms.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Zero-cost means zero&quot;</td>
            <td style={cellStyle}>A <code>try</code> block cost <strong>0.26 ns</strong>, repeatably.
              The assembly says why: it blocked a tail call. One instruction became five.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A throw costs more if the message is bigger&quot;</td>
            <td style={cellStyle}><code>throw 42</code> cost <strong>2016 ns</strong>;{' '}
              <code>runtime_error</code> with a heap-allocated message, 2182 ns. The payload is
              under 10% of it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Unwinding is linear in stack depth&quot;</td>
            <td style={cellStyle}><strong>2148 ns at 1 frame, 2178 ns at 50.</strong> Fifty times the
              frames, 1.4% more time. Moving the <code>catch</code> closer will not help.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Throwing serialises on a global lock&quot;</td>
            <td style={cellStyle}>Not here. 8 threads did the same total throws at{' '}
              <strong>0.15x</strong> the per-throw wall time — near-linear scaling.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-fno-exceptions</code> saves a trivial amount&quot;</td>
            <td style={cellStyle}><strong>11&ndash;13% of <code>__text</code></strong> in a
              container-heavy program, at both <code>-O2</code> and <code>-Os</code>, plus{' '}
              <code>__gcc_except_tab</code> and <code>__unwind_info</code> deleted entirely.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-fno-exceptions</code> just removes the throws&quot;</td>
            <td style={cellStyle}>It makes them <strong>silent aborts</strong>.{' '}
              <code>v.at(99)</code> printed a named diagnostic in one build and nothing at all in
              the other. Both exited 134.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>catch (std::exception e)</code> is fine&quot;</td>
            <td style={cellStyle}>It sliced. <code>what()</code> degraded to{' '}
              <code>&quot;std::exception&quot;</code> and the error code was lost — and{' '}
              <strong>no warning exists on this compiler</strong>, not even in{' '}
              <code>-Weverything</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>noexcept</code> violations propagate&quot;</td>
            <td style={cellStyle}><code>std::terminate</code>, uncatchable, and the local&apos;s
              destructor <strong>did not run</strong>. <code>-Wall</code> only warns when the{' '}
              <code>throw</code> is in that same function.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>noexcept</code> is documentation&quot;</td>
            <td style={cellStyle}>It deleted the caller&apos;s landing pad and exception table
              outright, and a single <code>noexcept</code> on a move constructor changed{' '}
              <code>vector</code> growth from <strong>4 copies to 4 moves</strong>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The compiler makes me check an <code>expected</code>&quot;</td>
            <td style={cellStyle}>It does not. <code>class expected</code> in libc++ 220106 is not{' '}
              <code>[[nodiscard]]</code>; discarding one compiles clean. Mark your functions.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        <a href="/cpp/concurrency">The next lesson</a> takes the two threads of this one into a
        harder setting. Exceptions and threads interact badly and specifically: an exception that
        escapes the function a <code>std::thread</code> is running calls{' '}
        <code>std::terminate</code>, with no way for the launching thread to see it, which is why{' '}
        <code>std::async</code> and <code>std::promise</code> exist — they capture the exception into
        a <code>std::exception_ptr</code> and rethrow it when you touch the <code>future</code>.
        That is the one place <code>std::exception_ptr</code> is not an exotic corner of the library.
      </p>
      <p>
        The deeper connection is the one this lesson has been circling. Error handling in C++ is a
        design decision with measured consequences rather than a language default, and concurrency is
        the same story turned up: the memory model is explicit, the orderings are visible, and{' '}
        <strong>a data race is undefined behaviour rather than a wrong answer</strong> — which is a
        sharper difference from Java and Go than anything on this page.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          Take the most recent service you wrote in Java or Node and pick one error path that fires
          routinely in production — a validation failure, a 404 from a lookup, a malformed field in
          an upload. Find out, from your own metrics, roughly how often it fires per request.
        </p>
        <p>
          Then put that number into the <code>mix.cpp</code> table. If it is under one in ten
          thousand, exceptions would have cost you nothing and you should keep using them. If it is
          one in a hundred, the C++ version of that code would be five times slower than it needs to
          be, and the fix is a return type rather than an optimisation.
        </p>
        <p>
          That is the whole decision, and it is the one thing on this page worth carrying into a
          language that is not C++: <strong>&quot;exceptional&quot; is a claim about your production
          error rate, not about how you feel about the failure.</strong>
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Errors;
