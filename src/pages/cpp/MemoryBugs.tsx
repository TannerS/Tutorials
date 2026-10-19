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

function MemoryBugs() {
  return (
    <LessonLayout
      title="Memory Bugs & the Sanitizers That Catch Them"
      sectionId="cpp"
      lessonIndex={10}
      prev={{ path: '/cpp/move-semantics', label: 'Move Semantics & Perfect Forwarding' }}
      next={{ path: '/cpp/classes', label: 'Classes, Constructors & the Rule of Zero/Three/Five' }}
    >
      <p>
        This is the practical capstone of the memory phase. <a href="/cpp/raii">RAII</a>,{' '}
        <a href="/cpp/smart-pointers">smart pointers</a> and{' '}
        <a href="/cpp/move-semantics">move semantics</a> are all about not writing these bugs. This
        lesson is about what happens when you write them anyway, which you will, and about the one
        class of tool that reliably finds them.
      </p>
      <p>
        Nine bug families, each with a minimal reproduction, the real output from the unsanitized
        build, the real sanitizer report, and the fix. Every command and every output block on this
        page was executed on the toolchain from <a href="/cpp/intro">the intro</a>: Apple clang
        21.0.0, <code>arm64-apple-darwin25.6.0</code>, libc++.
      </p>

      <InfoBox variant="danger" title="The number to read first">
        <p>
          Every one of the nine reproductions below was compiled with{' '}
          <code>-Wall -Wextra</code>. Here is the total number of warnings those flags produced
          across all nine files:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -c <each file>">
{`use-after-free      0 warnings
double free         0 warnings
heap overflow       0 warnings
stack overflow      0 warnings
use-after-scope     0 warnings
vector OOB          0 warnings
memory leak         0 warnings
undefined behaviour 0 warnings   (six separate UB constructs in one file)
uninitialised reads 1 warning    (of four uninitialised reads)`}
        </CodeBlock>
        <p>
          One warning, for one of roughly twenty distinct defects. That is not a criticism of clang —
          most of these are simply not decidable at compile time. It is the argument for everything
          that follows: <strong>in C++, the compiler is not your safety net. The runtime
          instrumentation is.</strong>
        </p>
      </InfoBox>

      <h2>How To Read A Sanitizer Report</h2>
      <p>
        One full report, once, so the later ones can be trimmed. This is the use-after-free case,
        unabridged:
      </p>

      <CodeBlock language="cpp" title="uaf.cpp">
{`#include <cstdio>
#include <vector>

struct Session { int id; char name[16]; };

int main() {
    std::vector<Session*> cache;
    Session* s = new Session{42, "alice"};
    cache.push_back(s);

    delete s;                      // the session ends...
    // ...but the cache entry is still there.
    std::printf("cache[0]->id = %d\\n", cache[0]->id);
    cache[0]->id = 99;             // and now we write to it
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g uaf.cpp && ./uaf; echo exit=$?">
{`cache[0]->id = 4543
exit=0`}
      </CodeBlock>

      <p>
        <strong>Exit 0.</strong> It read a freed object, printed a plausible-looking integer, wrote
        to the freed object, and reported success. In a service this is a wrong answer in a log, not
        an incident.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 uaf.cpp && ./uaf_a (full report, exit 134)">
{`=================================================================
==19463==ERROR: AddressSanitizer: heap-use-after-free on address 0x603000001c30 at pc 0x00010427cb30 bp 0x00016bb826f0 sp 0x00016bb826e8
READ of size 4 at 0x603000001c30 thread T0
    #0 0x00010427cb2c in main uaf.cpp:13
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

0x603000001c30 is located 0 bytes inside of 20-byte region [0x603000001c30,0x603000001c44)
freed by thread T0 here:
    #0 0x000104b74558 in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 0x00010427c9d8 in main uaf.cpp:11
    #2 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

previously allocated by thread T0 here:
    #0 0x000104b74150 in _Znwm+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50150)
    #1 0x00010427c948 in main uaf.cpp:8
    #2 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

SUMMARY: AddressSanitizer: heap-use-after-free uaf.cpp:13 in main
Shadow bytes around the buggy address:
  0x603000001b80: 00 00 fa fa 00 00 05 fa fa fa 00 00 00 00 fa fa
=>0x603000001c00: 00 00 00 00 fa fa[fd]fd fd fa fa fa fa fa fa fa
  0x603000001c80: fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa fa
Shadow byte legend (one shadow byte represents 8 application bytes):
  Addressable:           00
  Partially addressable: 01 02 03 04 05 06 07
  Heap left redzone:       fa
  Freed heap region:       fd
  Stack left redzone:      f1
  Stack mid redzone:       f2
  Stack right redzone:     f3
  Stack after return:      f5
  Stack use after scope:   f8
  Global redzone:          f9
  Global init order:       f6
  Poisoned by user:        f7
  Container overflow:      fc
  Array cookie:            ac
  Intra object redzone:    bb
  ASan internal:           fe
  Left alloca redzone:     ca
  Right alloca redzone:    cb
==19463==ABORTING`}
      </CodeBlock>

      <p>
        Five parts, and they are the same five parts in every ASan report:
      </p>
      <ol>
        <li>
          <strong>The verdict and the address.</strong>{' '}
          <code>heap-use-after-free on address 0x603000001c30</code>. The bug class is named; you do
          not have to infer it.
        </li>
        <li>
          <strong>The access.</strong> <code>READ of size 4</code>, then a stack trace to{' '}
          <code>uaf.cpp:13</code>. Size 4 is an <code>int</code> — useful for identifying which
          member.
        </li>
        <li>
          <strong>The region.</strong>{' '}
          <code>0 bytes inside of 20-byte region</code> — the allocation was 20 bytes
          (<code>sizeof(Session)</code>), and you touched its first byte.
        </li>
        <li>
          <strong>Who freed it, and who allocated it.</strong> Two more stack traces,{' '}
          <code>uaf.cpp:11</code> and <code>uaf.cpp:8</code>. This is the part that saves the day:
          you get the <em>whole life story</em> of the memory, not just the moment it went wrong.
        </li>
        <li>
          <strong>The shadow map.</strong> ASan keeps one shadow byte per eight bytes of your
          address space. <code>fd</code> is &quot;freed heap region&quot;, <code>fa</code> is
          &quot;redzone&quot;, <code>00</code> is &quot;fine&quot;. The <code>[fd]</code> in square
          brackets is the byte you touched. You rarely need this, but when you do — a corruption of
          unknown origin — it tells you what the allocator thought that memory was.
        </li>
      </ol>
      <p>
        That legend is the same in every report, so it is omitted from here on.
      </p>
      <p>
        The fix, incidentally, is the subject of{' '}
        <a href="/cpp/smart-pointers">the smart pointers lesson</a>: the cache should hold{' '}
        <code>std::weak_ptr&lt;Session&gt;</code> if the sessions are shared, or the sessions should
        live in a <code>std::vector&lt;Session&gt;</code> and the cache hold indices. A{' '}
        <code>Session*</code> in a container that outlives the <code>delete</code> is the bug, not
        the <code>delete</code>.
      </p>

      <h2>Bug 2: Double Free — And A Serious Caveat</h2>
      <p>
        The realistic shape is not <code>delete p; delete p;</code> on adjacent lines. It is two
        places that each believe they own one allocation:
      </p>

      <CodeBlock language="cpp" title="dfree2.cpp">
{`#include <cstdio>

struct Buffer { int* data; };

// Two owners of one allocation -- the realistic shape of a double free.
Buffer a, b;

void release(Buffer& buf) {
    delete[] buf.data;
    buf.data = nullptr;              // a's pointer is cleared. b's is not.
}

int main() {
    int* shared = new int[4]{1, 2, 3, 4};
    a.data = shared;
    b.data = shared;                 // aliased, by accident

    release(a);
    std::printf("a released\\n");
    std::fflush(stdout);
    release(b);                      // b still thinks it owns the buffer
    std::printf("b released\\n");
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three optimisation levels, unsanitized">
{`$ for o in -O0 -O1 -O2; do clang++ -std=c++23 -Wall -Wextra $o -g dfree2.cpp -o d2 \\
      && ./d2; echo "exit=$?"; done
a released
exit=133
a released
exit=133
a released
exit=133`}
      </CodeBlock>

      <p>
        Exit 133 is 128 + 5, <strong>SIGTRAP</strong>: the macOS allocator detected the second{' '}
        <code>free</code> and trapped. Note it printed no diagnostic message at all — the process
        just stopped. And note that <code>b released</code> never printed, so without the{' '}
        <code>fflush</code> calls you would have had an empty log and a dead process.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 dfree2.cpp && ./d2a">
{`==19726==ERROR: AddressSanitizer: attempting double-free on 0x6020000000d0 in thread T0:
    #0 0x0001035e0644 in _ZdaPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50644)
    #1 0x000102f049a4 in release(Buffer&) dfree2.cpp:9
    #2 0x000102f049a4 in main dfree2.cpp:21

0x6020000000d0 is located 0 bytes inside of 16-byte region [0x6020000000d0,0x6020000000e0)
freed by thread T0 here:
    #0 0x0001035e0644 in _ZdaPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50644)
    #1 0x000102f04968 in release(Buffer&) dfree2.cpp:9
    #2 0x000102f04968 in main dfree2.cpp:18

previously allocated by thread T0 here:
    #0 0x0001035e0268 in _Znam+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50268)
    #1 0x000102f048a8 in main dfree2.cpp:14

SUMMARY: AddressSanitizer: double-free dfree2.cpp:9 in release(Buffer&)
==19726==ABORTING`}
      </CodeBlock>

      <p>
        Both <code>release()</code> call sites are named —{' '}
        <code>dfree2.cpp:21</code> and <code>dfree2.cpp:18</code> — which is exactly the information
        you need, because the bug is in neither of them individually.
      </p>

      <InfoBox variant="warning" title="The caveat: ASan missed a double free entirely at -O1 and above">
        <p>
          This was not what I expected and it is worth the detour. Here is a <em>simpler</em>{' '}
          double free:
        </p>
        <CodeBlock language="cpp" title="dfree.cpp">
{`#include <cstdio>

void cleanup(int* p) { delete p; }     // this function takes ownership...

int main() {
    int* p = new int(7);
    cleanup(p);                        // ...and the caller does not know it
    std::printf("cleaned up once\\n");
    std::fflush(stdout);
    delete p;                          // "defensive" cleanup. Second delete.
    std::printf("unreachable in practice\\n");
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — the same file under ASan at three optimisation levels">
{`=== ASan -O0 ===
cleaned up once
==19646==ERROR: AddressSanitizer: attempting double-free on 0x6020000000d0 in thread T0:
    #0 0x000105628558 in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    #1 0x000104fb0944 in main dfree.cpp:10
0x6020000000d0 is located 0 bytes inside of 4-byte region [0x6020000000d0,0x6020000000d4)

=== ASan -O1 ===
cleaned up once
unreachable in practice

=== ASan -O2 ===
cleaned up once
unreachable in practice`}
        </CodeBlock>
        <p>
          Caught at <code>-O0</code>, <strong>completely silent at <code>-O1</code> and{' '}
          <code>-O2</code></strong>. The reason is in the assembly — counting the calls to{' '}
          <code>operator new</code> and <code>operator delete</code> in the generated code:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 $o -S dfree.cpp | grep -c 'bl __Znwm' / 'bl __ZdlPv'">
{`-O0 :  1 new, 2 deletes
-O1 :  0 new, 0 deletes
-O2 :  0 new, 0 deletes

$ clang++ -std=c++23 -O2 -S dfree.cpp     # the whole of main, directives stripped
_main:
	stp	x29, x30, [sp, #-16]!
	mov	x29, sp
	adrp	x0, l_str@PAGE
	add	x0, x0, l_str@PAGEOFF
	bl	_puts
	...
	bl	_fflush
	adrp	x0, l_str.2@PAGE
	add	x0, x0, l_str.2@PAGEOFF
	bl	_puts`}
        </CodeBlock>
        <p>
          The allocation and <em>both</em> deallocations were deleted from the program. The standard
          explicitly permits a compiler to elide a matching <code>new</code>/<code>delete</code>{' '}
          pair, and because a second <code>delete</code> of the same pointer is undefined behaviour,
          the optimiser is entitled to treat it as unreachable and remove it too. There is no
          allocation left for ASan to instrument.
        </p>
        <p>
          <strong>The practical rule: build your sanitizer jobs at <code>-O0</code> or{' '}
          <code>-O1</code>, not <code>-O2</code>.</strong> <code>-O1</code> is the usual
          recommendation because the stack traces stay readable and the run is tolerable; this case
          is the argument for also having an <code>-O0</code> run when you are chasing something
          specific. A sanitizer can only instrument code that survives to the back end.
        </p>
      </InfoBox>

      <h2>Bug 3: Heap Buffer Overflow</h2>
      <p>
        The off-by-one. <code>&lt;=</code> where <code>&lt;</code> belonged.
      </p>

      <CodeBlock language="cpp" title="hbo.cpp">
{`#include <cstdio>

int main() {
    int n = 8;
    int* buf = new int[n];
    for (int i = 0; i <= n; ++i) {     // <= instead of <. The classic off-by-one.
        buf[i] = i * i;
    }
    std::printf("buf[7] = %d\\n", buf[7]);
    std::fflush(stdout);
    delete[] buf;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g hbo.cpp && ./hbo; echo exit=$?">
{`buf[7] = 49
exit=0`}
      </CodeBlock>

      <p>
        Correct answer, clean exit, and a 4-byte write into memory belonging to somebody else. On a
        different day that write lands in another object&apos;s field and you get a bug report about
        the <em>other</em> object.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 hbo.cpp && ./hbo_a (exit 134, legend trimmed)">
{`==19633==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x603000001c50 at pc 0x0001027948f4 bp 0x00016d66a810 sp 0x00016d66a808
WRITE of size 4 at 0x603000001c50 thread T0
    #0 0x0001027948f0 in main hbo.cpp:7
    #1 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

0x603000001c50 is located 0 bytes after 32-byte region [0x603000001c30,0x603000001c50)
allocated by thread T0 here:
    #0 0x0001030d0268 in _Znam+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50268)
    #1 0x000102794838 in main hbo.cpp:5

SUMMARY: AddressSanitizer: heap-buffer-overflow hbo.cpp:7 in main
=>0x603000001c00: 00 00 00 00 fa fa 00 00 00 00[fa]fa fa fa fa fa`}
      </CodeBlock>

      <p>
        <code>0 bytes after 32-byte region</code> is the off-by-one stated in the clearest possible
        terms: the region is 32 bytes (8 <code>int</code>s), and you wrote at the byte immediately
        after it. <code>WRITE of size 4</code>, line 7. The square-bracketed <code>[fa]</code> in the
        shadow row is the redzone ASan placed there precisely so this would be detectable.
      </p>
      <p>
        The fix is not &quot;be careful with the loop bound,&quot; it is{' '}
        <code>std::vector&lt;int&gt;</code> and a range-<code>for</code>, which removes the bound
        from the source entirely.
      </p>

      <h2>Bug 4: Stack Buffer Overflow</h2>

      <CodeBlock language="cpp" title="sbo.cpp">
{`#include <cstdio>
#include <cstring>

int main() {
    char name[8];
    const char* input = "a-name-that-is-too-long";
    std::strcpy(name, input);          // no bounds check anywhere
    std::printf("name = %s\\n", name);
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g sbo.cpp && ./sbo, stdout and stderr captured separately">
{`--stdout--
name = a-name-that-is-too-long
--stderr--
(empty)
exit=134`}
      </CodeBlock>

      <p>
        This one is the odd case in the set, and it took an experiment to explain. The program{' '}
        <em>did</em> die — exit 134, SIGABRT — but printed <strong>nothing at all</strong> to
        explain why. That is the stack canary, and it is on by default on this toolchain. Verified
        two ways:
      </p>

      <CodeBlock language="text" title="Real output — the same source with the protector disabled, plus the undefined symbols in each binary">
{`$ clang++ -std=c++23 -O2 -g -fno-stack-protector sbo.cpp -o sbo_nosp && ./sbo_nosp
name = a-name-that-is-too-long
exit=0                              <- no abort at all

$ nm -u ./sbo              $ nm -u ./sbo_nosp
___stack_chk_fail          ___stdoutp
___stack_chk_guard         _fflush
___stdoutp                 _printf
_fflush
_printf`}
      </CodeBlock>

      <p>
        <code>___stack_chk_fail</code> and <code>___stack_chk_guard</code> are present in the default
        build and absent with <code>-fno-stack-protector</code>. So the default build detected the
        overwritten canary on return and aborted; the unprotected build corrupted the frame and
        carried on to exit 0. Both are &quot;undefined behaviour&quot; and neither is a diagnostic.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 sbo.cpp && ./sbo_a (exit 134, legend trimmed)">
{`==19744==ERROR: AddressSanitizer: stack-buffer-overflow on address 0x00016f1de7a8 at pc 0x00010163ecc4 bp 0x00016f1de770 sp 0x00016f1ddf20
WRITE of size 24 at 0x00016f1de7a8 thread T0
    #0 0x00010163ecc0 in __asan_memcpy+0x330 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x3ecc0)
    #1 0x000100c208d8 in main sbo.cpp:7

Address 0x00016f1de7a8 is located in stack of thread T0 at offset 40 in frame
    #0 0x000100c20824 in main sbo.cpp:4

  This frame has 1 object(s):
    [32, 40) 'name' (line 5) <== Memory access at offset 40 overflows this variable
HINT: this may be a false positive if your program uses some custom stack unwind mechanism, swapcontext or vfork
      (longjmp and C++ exceptions *are* supported)
SUMMARY: AddressSanitizer: stack-buffer-overflow sbo.cpp:7 in main`}
      </CodeBlock>

      <p>
        <code>[32, 40) &apos;name&apos; (line 5)</code> — the variable is named, its stack extent is
        given, and the access offset (40) is one past the end of it. <code>WRITE of size 24</code> is
        the length of the source string including its terminator. That is a complete explanation of
        the bug from a program that otherwise died in silence.
      </p>

      <h2>Bug 5: Use After Scope</h2>
      <p>
        The one <a href="/cpp/references">the references lesson</a> ended on, in its most modern
        form — a <code>string_view</code> outliving its buffer.
      </p>

      <CodeBlock language="cpp" title="uas.cpp">
{`#include <cstdio>
#include <string_view>

int main() {
    std::string_view view;
    {
        char buf[32] = "temporary buffer contents";
        view = buf;                    // the view outlives the buffer
    }
    std::printf("view = %.*s\\n", (int)view.size(), view.data());
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g uas.cpp && ./uas; echo exit=$?">
{`view = temporary buffer contents
exit=0`}
      </CodeBlock>

      <p>
        It printed <em>the correct string</em>. The stack slot had not been reused yet, so the dead
        buffer still contained exactly what it used to contain. This is the worst possible outcome:
        the bug is invisible, the test passes, and it will start failing when somebody adds a
        function call between the brace and the <code>printf</code>.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 uas.cpp && ./uas_a (exit 134, legend trimmed)">
{`==19751==ERROR: AddressSanitizer: stack-use-after-scope on address 0x00016d762780 at pc 0x000102e60094 bp 0x00016d762270 sp 0x00016d761a10
READ of size 25 at 0x00016d762780 thread T0
    #0 0x000102e60090 in memcpy+0x248 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x90090)
    #1 0x00018161dd54 in __sfvwrite+0x178 (libsystem_c.dylib:arm64e+0x4d54)
    #2 0x00018161d774 in __vfprintf+0x2d2c (libsystem_c.dylib:arm64e+0x4774)
    #3 0x00018162aff0 in vfprintf_l+0x8c (libsystem_c.dylib:arm64e+0x11ff0)
    #4 0x000102defa90 in printf+0x70 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x1fa90)
    #5 0x00010269c900 in main uas.cpp:10

Address 0x00016d762780 is located in stack of thread T0 at offset 32 in frame
    #0 0x00010269c824 in main uas.cpp:4

  This frame has 1 object(s):
    [32, 64) 'buf' (line 7) <== Memory access at offset 32 is inside this variable
SUMMARY: AddressSanitizer: stack-use-after-scope (libsystem_c.dylib:arm64e+0x4d54) in __sfvwrite+0x178`}
      </CodeBlock>

      <p>
        Note where the <code>SUMMARY</code> points: into <code>libsystem_c.dylib</code>, because the
        actual read happened inside <code>printf</code>&apos;s internals. The useful frame is{' '}
        <code>#5 ... in main uas.cpp:10</code>, and the useful line is{' '}
        <code>[32, 64) &apos;buf&apos; (line 7)</code>. <strong>Read ASan stack traces from the
        bottom up until you reach your own code</strong> — the top frames are often inside the
        standard library or the sanitizer runtime, and the summary line can be misleading because of
        it.
      </p>

      <h2>Bug 6: Past <code>size()</code>, Inside <code>capacity()</code></h2>
      <p>
        This one deserves its own entry because it is the most common real-world version of a buffer
        overflow in modern C++, and because a naive expectation is that ASan cannot see it — the
        memory <em>is</em> allocated, after all.
      </p>

      <CodeBlock language="cpp" title="vecoob.cpp">
{`#include <cstdio>
#include <vector>

int main() {
    std::vector<int> v;
    v.reserve(16);                 // capacity 16, size 4
    v = {1, 2, 3, 4};
    int i = 7;                     // past size, inside capacity
    std::printf("v[7] = %d\\n", v[i]);
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -g vecoob.cpp && ./vo; echo exit=$?">
{`v[7] = -302956288
exit=0`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O1 vecoob.cpp && ./vo_a (exit 134, trimmed)">
{`==20143==ERROR: AddressSanitizer: container-overflow on address 0x60600000027c at pc 0x000104500a80 bp 0x00016b8fe730 sp 0x00016b8fe728
READ of size 4 at 0x60600000027c thread T0
    #0 0x000104500a7c in main vecoob.cpp:9

0x60600000027c is located 28 bytes inside of 64-byte region [0x606000000260,0x6060000002a0)
allocated by thread T0 here:
    #0 0x000104cec150 in _Znwm+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50150)
    #1 0x000104500b7c in int* std::__1::__libcpp_allocate<int>(std::__1::__element_count, unsigned long) allocate.h:60
    #2 0x000104500b7c in std::__1::allocator<int>::allocate(unsigned long) allocator.h:92`}
      </CodeBlock>

      <p>
        <strong><code>container-overflow</code></strong> — a distinct verdict from{' '}
        <code>heap-buffer-overflow</code>, and the one place the standard library and the sanitizer
        cooperate. <code>std::vector</code> poisons the region between <code>size()</code> and{' '}
        <code>capacity()</code> in its own shadow bytes (the <code>fc</code> entry in the legend
        earlier), so reading an allocated-but-unconstructed element is detectable. Worth knowing
        that this works out of the box here: the libc++ shipped with this toolchain is already built
        with the container annotations enabled, so no extra flag is needed.
      </p>

      <InfoBox variant="tip" title="There is a cheaper tool for this one: libc++ hardening">
        <p>
          Container bounds and preconditions do not need the full sanitizer. libc++ has a hardening
          mode that compiles its own internal assertions in:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG -g -O1 vecoob.cpp && ./vo_h">
{`/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/__vector/vector.h:414:
libc++ Hardening assertion __n < size() failed: vector[] index out of bounds
exit=134`}
      </CodeBlock>
        <p>
          One line, the assertion that failed, and the English explanation. The same mechanism
          catches <code>front()</code> on an empty vector, which is the moved-from hazard from{' '}
          <a href="/cpp/move-semantics">the previous lesson</a>. There are four modes —{' '}
          <code>none</code>, <code>fast</code>, <code>extensive</code>, <code>debug</code> — and{' '}
          <code>fast</code> is cheap enough that some projects ship with it on. Use{' '}
          <code>debug</code> in development and <code>fast</code> if you want bounds checking in
          production.
        </p>
      </InfoBox>

      <h2>Bug 7: The Leak — And What This Platform Actually Does</h2>
      <p>
        This is the one where the honest answer differs from the advice you will find online, so it
        gets checked rather than assumed.
      </p>

      <CodeBlock language="cpp" title="leak.cpp">
{`#include <cstdio>
#include <cstdlib>

struct Record { char payload[256]; };

Record* load_record(int id) {
    Record* r = (Record*)std::malloc(sizeof(Record));
    std::snprintf(r->payload, sizeof(r->payload), "record-%d", id);
    return r;
}

int main() {
    for (int i = 0; i < 3; ++i) {
        Record* r = load_record(i);
        std::printf("loaded %s\\n", r->payload);
        // ...and never freed. Three 256-byte leaks.
    }
    char* name = new char[64];
    std::snprintf(name, 64, "also leaked");
    std::printf("%s\\n", name);
    std::fflush(stdout);
}`}
      </CodeBlock>

      <p>
        Four allocations are leaked by construction: three <code>malloc</code>s in the loop and one{' '}
        <code>new char[64]</code>. Here is what each tool does about it.
      </p>

      <CodeBlock language="text" title="Real output — the plain build, the ASan build, and the ASan build with detect_leaks">
{`$ clang++ -std=c++23 -Wall -Wextra -O2 -g leak.cpp -o leak && ./leak; echo "exit=$?"
loaded record-0
loaded record-1
loaded record-2
also leaked
exit=0

$ clang++ -std=c++23 -fsanitize=address -g -O1 leak.cpp -o leak_a && ./leak_a
loaded record-0
loaded record-1
loaded record-2
also leaked
exit=0                       <- ASan said nothing about leaks

$ ASAN_OPTIONS=detect_leaks=1 ./leak_a
==19793==AddressSanitizer: detect_leaks is not supported on this platform.
exit=134

$ clang++ -std=c++23 -fsanitize=leak -g -O1 leak.cpp
clang++: error: unsupported option '-fsanitize=leak' for target
         'arm64-apple-darwin25.6.0'`}
      </CodeBlock>

      <InfoBox variant="danger" title="LeakSanitizer does not exist on macOS/arm64, and asking for it aborts your program">
        <p>
          Two separate failures, both verified above. <code>-fsanitize=leak</code> is{' '}
          <strong>rejected by the driver</strong> as an unsupported option for this target. And{' '}
          <code>ASAN_OPTIONS=detect_leaks=1</code> on an otherwise working ASan binary does{' '}
          <strong>not</strong> degrade gracefully — it prints{' '}
          <code>detect_leaks is not supported on this platform</code> and{' '}
          <strong>aborts with exit 134 before running a line of your code</strong>.
        </p>
        <p>
          That matters practically. On Linux, <code>-fsanitize=address</code> enables leak detection
          by default, so a lot of CI configuration and a lot of blog advice sets{' '}
          <code>ASAN_OPTIONS=detect_leaks=1</code> as a matter of course. Copy that into a script a
          Mac developer runs and every sanitized binary appears to crash at startup.
        </p>
      </InfoBox>

      <p>
        The platform replacement is <code>/usr/bin/leaks</code>, which ships with macOS and needs no
        special build. It works, and on the <a href="/cpp/smart-pointers">reference-cycle</a> case
        from the previous lesson it is genuinely excellent. On this one:
      </p>

      <CodeBlock language="text" title="Real output — MallocStackLogging=1 leaks --atExit -- ./leak0 (the -O0 build)">
{`leaks Report Version: 4.0, multi-line stacks
Process 19833: 3 leaks for 960 total leaked bytes.

STACK OF 3 INSTANCES OF 'ROOT LEAK: <malloc in load_record(int)>':
2   leak0     0x10026c518 main + 48  leak.cpp:14
1   leak0     0x10026c4b4 load_record(int) + 28  leak.cpp:7
      1 (320 bytes) ROOT LEAK: <malloc in load_record(int) 0x7fb024000> [320]
      1 (320 bytes) ROOT LEAK: <malloc in load_record(int) 0x7fb024140> [320]
      1 (320 bytes) ROOT LEAK: <malloc in load_record(int) 0x7fb024280> [320]`}
      </CodeBlock>

      <p>
        Three leaks, the allocating function, the source line, and the call site. The 320 is
        the allocator&apos;s bucket size for a 256-byte request, not a mistake. Exit status is{' '}
        <strong>1</strong> when it finds something, so it slots straight into a CI step.
      </p>

      <InfoBox variant="warning" title="But it found three of the four, and a different three at each optimisation level">
        <p>
          Checked rather than assumed, and the result is a caveat worth carrying:
        </p>
        <CodeBlock language="text" title="Real output — the same source, two builds, the leaks count line">
{`$ clang++ -std=c++23 -O0 -g leak.cpp -o leak0
$ MallocStackLogging=1 leaks --atExit -- ./leak0 | grep "leaks for"
Process 19808: 3 leaks for 960 total leaked bytes.
                 ^ the three 320-byte Records. The new char[64] is NOT reported.

$ clang++ -std=c++23 -O2 -g leak.cpp -o leak
$ MallocStackLogging=1 leaks --atExit -- ./leak | grep "leaks for"
Process 19811: 3 leaks for 720 total leaked bytes.
                 ^ 2 x 320 + 1 x 80. Two Records and the char array.
                   (Stable across three repeat runs.)`}
        </CodeBlock>
        <p>
          Four leaks exist; three are reported; <em>which</em> three depends on the optimisation
          level. The reason is what <code>leaks</code> is:{' '}
          <strong>a conservative reachability scanner</strong>, not an allocation ledger. It walks
          registers, stack and globals looking for anything that could be a pointer, and treats
          whatever it can reach as live. At <code>-O0</code> the local variable{' '}
          <code>name</code> is still sitting in <code>main</code>&apos;s frame at exit, so the{' '}
          <code>char[64]</code> looks reachable. At <code>-O2</code> register allocation left a
          different pointer lying around instead.
        </p>
        <p>
          So <code>leaks</code> reports <em>unreachable</em> allocations, which is close to but not
          the same as <em>leaked</em> allocations. It will never report a false leak, and it will
          miss real ones. Treat a non-zero count as a definite bug and a zero count as weak
          evidence — the opposite of how you would read an ASan report.
        </p>
      </InfoBox>

      <p>
        The real answer to leaks, of course, is not a tool. It is{' '}
        <a href="/cpp/raii">RAII</a>: the <code>malloc</code>/<code>new</code> pair in that file
        should be a <code>std::vector&lt;Record&gt;</code> and a <code>std::string</code>, and then
        the bug is unwritable. <strong>A leak detector is for finding the places you failed to apply
        RAII, not a substitute for applying it.</strong>
      </p>

      <h2>Bug 8: Uninitialised Reads — Another Platform Gap</h2>

      <CodeBlock language="cpp" title="uninit.cpp">
{`#include <cstdio>

struct Config { int port; bool verbose; };

int main() {
    int n;                 // never initialised
    Config c;              // members never initialised
    int arr[4];            // elements never initialised
    std::printf("n          = %d\\n", n);
    std::printf("c.port     = %d\\n", c.port);
    std::printf("c.verbose  = %d\\n", c.verbose);
    std::printf("arr[2]     = %d\\n", arr[2]);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the warning, two optimisation levels, and the MSan attempt">
{`$ clang++ -std=c++23 -Wall -Wextra -O2 -fmessage-length=74 -c uninit.cpp
uninit.cpp:9:38: warning: variable 'n' is uninitialized when used here
      [-Wuninitialized]
    9 |     std::printf("n          = %d\\n", n);
      |                                      ^
uninit.cpp:6:10: note: initialize the variable 'n' to silence this warning
1 warning generated.                 <- one warning, for one of four reads

$ clang++ -std=c++23 -O0 -g uninit.cpp -o uninit0 && ./uninit0
n          = -1
c.port     = 1
c.verbose  = 0
arr[2]     = -302956288

$ clang++ -std=c++23 -O2 -g uninit.cpp -o uninit2 && ./uninit2
n          = -302956288
c.port     = -302956288
c.verbose  = 0
arr[2]     = 0
                                     <- every int differs between -O0 and -O2

$ clang++ -std=c++23 -fsanitize=memory -g -O1 uninit.cpp
clang++: error: unsupported option '-fsanitize=memory' for target
         'arm64-apple-darwin25.6.0'`}
      </CodeBlock>

      <p>
        So <strong>MemorySanitizer is unavailable here too</strong>, like LeakSanitizer. That leaves
        a genuine gap: on Linux, MSan is the tool for this bug class, and on macOS/arm64 there is no
        equivalent.
      </p>
      <p>
        What there <em>is</em> turns out to be useful anyway, and it was worth checking:
      </p>

      <CodeBlock language="text" title="Real output — -ftrivial-auto-var-init, both modes, -O2">
{`$ clang++ -std=c++23 -O2 -g -ftrivial-auto-var-init=pattern uninit.cpp && ./a.out
n          = -1431655766
c.port     = -1431655766
c.verbose  = 0
arr[2]     = -1431655766

$ clang++ -std=c++23 -O2 -g -ftrivial-auto-var-init=zero uninit.cpp && ./a.out
n          = 0
c.port     = 0
c.verbose  = 0
arr[2]     = 0`}
      </CodeBlock>

      <p>
        <code>-1431655766</code> is <code>0xAAAAAAAA</code>. That does not <em>detect</em> the bug,
        but it converts it from &quot;nondeterministic garbage that differs between builds&quot; into
        &quot;a single recognisable value that is obviously wrong and reproducible.&quot; Seeing{' '}
        <code>-1431655766</code> or <code>0xAAAAAAAA</code> in a debugger is an immediate, unambiguous
        &quot;this was never initialised.&quot; <code>=zero</code> is the production mitigation — it
        makes the behaviour defined and deterministic at a near-zero cost, at the price of hiding the
        bug rather than flagging it.
      </p>
      <p>
        The real fix is a habit: <strong>always initialise.</strong>{' '}
        <code>int n{'{}'};</code> is zero. <code>Config c{'{}'};</code> zero-initialises every
        member. <code>int arr[4]{'{}'};</code> zeroes the array. The empty braces cost nothing when
        the compiler can see the value is overwritten, and they remove the entire bug class.
      </p>

      <h2>Bug 9: Undefined Behaviour, And What It Actually Means</h2>
      <p>
        Six UB constructs in one file. Nothing exotic — every one of these appears in real code.
      </p>

      <CodeBlock language="cpp" title="ub.cpp">
{`#include <climits>
#include <cstdio>

struct Misaligned { char pad; int value; };

int main() {
    // 1. Signed integer overflow.
    int big = INT_MAX;
    std::printf("1. INT_MAX + 1          = %d\\n", big + 1);

    // 2. Shift by >= the width of the type.
    int shift = 32;
    std::printf("2. 1 << 32              = %d\\n", 1 << shift);

    // 3. Division of INT_MIN by -1 (the result is not representable).
    int min = INT_MIN, neg = -1;
    std::printf("3. INT_MIN / -1         = %d\\n", min / neg);

    // 4. Out-of-bounds array index.
    int arr[4] = {1, 2, 3, 4};
    int idx = 5;
    std::printf("4. arr[5]               = %d\\n", arr[idx]);

    // 5. Float-to-integer conversion that does not fit.
    double huge = 1e300;
    std::printf("5. (int)1e300           = %d\\n", (int)huge);

    // 6. A misaligned load.
    char raw[sizeof(Misaligned) + 1] = {};
    int* unaligned = reinterpret_cast<int*>(raw + 1);
    std::printf("6. misaligned load      = %d\\n", *unaligned);

    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three builds of this one file. Each build is deterministic across three runs; the builds disagree with each other.">
{`$ clang++ -std=c++23 -Wall -Wextra -O2 ub.cpp -o ub2
(no output -- not one warning for six UB constructs)

                           -O0              -O2              UBSan -O0
1. INT_MAX + 1          -2147483648      -2147483648      -2147483648
2. 1 << 32                        1      -2147483648                1
3. INT_MIN / -1         -2147483648      -2147483648      -2147483648
4. arr[5]                         1      -2147483648               -1
5. (int)1e300            2147483647      -2147483648       2147483647
6. misaligned load                0                0                0

exit status                       0                0                0`}
      </CodeBlock>

      <p>
        Read the middle rows across. <strong><code>1 &lt;&lt; 32</code> is 1 at <code>-O0</code> and{' '}
        &minus;2147483648 at <code>-O2</code>. <code>arr[5]</code> is 1, then &minus;2147483648,
        then &minus;1 — three different answers from three builds of one source file.</strong> And
        all three exited 0.
      </p>
      <p>
        This is what undefined behaviour <em>is</em>. Not &quot;crashes.&quot; Not &quot;returns
        garbage.&quot; The standard imposes <strong>no requirement on the behaviour of the entire
        program</strong>, which means every one of those answers is a correct compilation of a
        program that has no defined meaning. There is no fact of the matter about what{' '}
        <code>1 &lt;&lt; 32</code> is.
      </p>
      <p>
        UBSan names all six, with file, line, column and the actual values:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=undefined -g -O0 ub.cpp && ./ubs">
{`ub.cpp:10:55: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:10:55
ub.cpp:14:53: runtime error: shift exponent 32 is too large for 32-bit type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:14:53
ub.cpp:18:55: runtime error: division of -2147483648 by -1 cannot be represented in type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:18:55
ub.cpp:23:51: runtime error: index 5 out of bounds for type 'int[4]'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:23:51
ub.cpp:27:56: runtime error: 1e+300 is outside the range of representable values of type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:27:56
ub.cpp:32:51: runtime error: load of misaligned address 0x00016b7d6811 for type 'int', which requires 4 byte alignment
0x00016b7d6811: note: pointer points here
 00 00 00  00 00 00 00 00 00 00 00  00 6a 7d 6b 01 00 00 00  01 00 00 00 02 00 00 00
              ^
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:32:51`}
      </CodeBlock>

      <p>
        Six for six, each with the operands spelled out. Note that the process{' '}
        <strong>continued after each error and exited 0</strong> — UBSan&apos;s default is to report
        and recover. In CI you want the opposite:
      </p>

      <CodeBlock language="text" title="Real output — adding -fno-sanitize-recover=all">
{`$ clang++ -std=c++23 -fsanitize=undefined -fno-sanitize-recover=all -g -O0 ub.cpp -o ubs_halt
$ ./ubs_halt
ub.cpp:10:55: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior ub.cpp:10:55
$ echo $?
134`}
      </CodeBlock>

      <p>
        Stops at the first finding, exits 134. That is the flag that makes a UBSan job actually fail
        a pull request instead of burying a warning in the log.
      </p>

      <h2>&quot;It Worked On My Machine&quot; — The Strongest Version</h2>
      <p>
        The table above shows UB producing different <em>values</em>. This next one shows it
        producing a different <em>program</em>, and it is the single most important example on this
        page. The pattern is a defensive null check placed after the dereference it was meant to
        guard — which is an extremely common shape, because the dereference often arrives later via
        a refactor.
      </p>

      <CodeBlock language="cpp" title="nullcheck.cpp">
{`#include <cstdio>

struct Config { int port; };

// The dereference happens BEFORE the null check. Because dereferencing null
// is UB, the compiler may assume cfg is non-null -- and therefore delete the
// check entirely.
int get_port(Config* cfg) {
    int port = cfg->port;              // UB if cfg is null
    if (cfg == nullptr) {              // ...so this check "cannot" be true
        std::printf("   [defensive branch taken: cfg was null]\\n");
        return -1;
    }
    return port;
}

int main() {
    Config real{8080};
    std::printf("get_port(&real)   = %d\\n", get_port(&real));
    std::fflush(stdout);
    std::printf("get_port(nullptr) = %d\\n", get_port(nullptr));
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three optimisation levels, and the diagnostics">
{`$ clang++ -std=c++23 -Wall -Wextra -Wnull-dereference -O2 -c nullcheck.cpp
(no output -- not one warning)

$ for o in -O0 -O1 -O2; do clang++ -std=c++23 -Wall -Wextra $o -g nullcheck.cpp \\
      -o nc$o && ./nc$o; echo "exit=$?"; done
get_port(&real)   = 8080
exit=139                 <- -O0 : 128 + 11, SIGSEGV
get_port(&real)   = 8080
exit=133                 <- -O1 : 128 + 5,  SIGTRAP
get_port(&real)   = 8080
exit=133                 <- -O2 : 128 + 5,  SIGTRAP`}
      </CodeBlock>

      <p>
        Now the assembly, which is where this stops being an abstract argument:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S nullcheck.cpp, directives and labels stripped">
{`get_port(Config*):
	ldr	w0, [x0]
	ret

main:                       (tail of the function)
	bl	_printf
	ldr	x0, [x8]
	bl	_fflush
	brk	#0x1`}
      </CodeBlock>

      <p>
        <code>get_port</code> is <strong>two instructions</strong>. The null check is gone. The{' '}
        <code>printf</code> inside it is gone. The <code>return -1</code> is gone. The function is
        structurally incapable of returning &minus;1, so any test asserting on the defensive path
        would be testing code that is not in the binary.
      </p>
      <p>
        And look at <code>main</code>: it ends in <code>brk #0x1</code>. The compiler proved that{' '}
        <code>get_port(nullptr)</code> is undefined behaviour, replaced the call with a hard trap,
        and deleted the second <code>printf</code> — which is why the <code>-O1</code> and{' '}
        <code>-O2</code> builds die on SIGTRAP rather than SIGSEGV. The binary does not contain the
        program you wrote.
      </p>
      <p>
        UBSan, on the same source, says exactly what is wrong:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=undefined,null -g -O0 nullcheck.cpp && ./nc_ubs">
{`get_port(&real)   = 8080
nullcheck.cpp:9:21: runtime error: member access within null pointer of type 'Config'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior nullcheck.cpp:9:21
nullcheck.cpp:9:21: runtime error: load of null pointer of type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior nullcheck.cpp:9:21
UndefinedBehaviorSanitizer:DEADLYSIGNAL
==19940==ERROR: UndefinedBehaviorSanitizer: SEGV on unknown address 0x000000000000`}
      </CodeBlock>

      <FlowChart
        title="What undefined behaviour licenses the compiler to do"
        chart={
          'graph TD\n' +
          '  S["You wrote code with undefined behaviour.<br/>Example: int port = cfg-&gt;port;<br/>followed by if (cfg == nullptr)"] --> R["The standard says: NO REQUIREMENT.<br/>Not \'crashes\'. Not \'returns garbage\'.<br/>No requirement on the whole program."]\n' +
          '  R --> I["So the optimiser is entitled to assume<br/>it never happens — because a program<br/>in which it happens has no meaning<br/>it is obliged to preserve."]\n' +
          '  I --> C1["\'cfg was dereferenced,<br/>therefore cfg is not null\'"]\n' +
          '  C1 --> C2["\'therefore cfg == nullptr is false\'"]\n' +
          '  C2 --> C3["\'therefore the whole defensive<br/>branch is dead code\'"]\n' +
          '  C3 --> OUT["VERIFIED at -O2: get_port compiles to<br/>two instructions, ldr w0, [x0] and ret.<br/>The null check, the log line and the<br/>return -1 are all gone from the binary."]\n' +
          '  OUT --> M["And main ends in brk #0x1 — the<br/>compiler replaced the call it could<br/>prove was UB with a hard trap, and<br/>deleted the printf after it."]\n' +
          '  M --> WHY["Which is why the SAME SOURCE gave<br/>exit 139 (SIGSEGV) at -O0 and<br/>exit 133 (SIGTRAP) at -O1 and -O2."]\n' +
          '  WHY --> EV["\'It worked on my machine\' is therefore<br/>not evidence. It is a statement about<br/>one optimiser, one version, one run."]\n' +
          '  EV --> FIX["-Wall -Wextra -Wnull-dereference:<br/>SILENT. Zero warnings.<br/>UBSan: \'member access within null<br/>pointer of type Config\', line 9, col 21."]\n' +
          '  style R fill:#3d2f14,stroke:#fb923c\n' +
          '  style OUT fill:#3b1a1a,stroke:#f87171\n' +
          '  style M fill:#3b1a1a,stroke:#f87171\n' +
          '  style EV fill:#3b1a1a,stroke:#f87171\n' +
          '  style FIX fill:#1a3329,stroke:#4ade80'
        }
      />

      <InfoBox variant="note" title="Why this is different from every other language you use">
        <p>
          In Java, an <code>ArrayIndexOutOfBoundsException</code> is <em>defined</em> behaviour. The
          JVM is required to throw it, the surrounding code keeps its meaning, and a{' '}
          <code>catch</code> block around it works. In Node, reading past an array gives you{' '}
          <code>undefined</code> — also defined. In both cases a bug is a <em>local</em> event: the
          rest of the program still means what it says.
        </p>
        <p>
          UB is not local. The compiler is permitted to reason <em>backwards</em> from &quot;this
          cannot happen&quot; and delete code that precedes the bug, as it did with the null check
          above. That is why you cannot debug UB by reading the source, and why a program that
          passes its tests at <code>-O0</code> tells you very little about the binary you shipped at{' '}
          <code>-O2</code>.
        </p>
        <p>
          The practical translation of all this is not fear. It is: <strong>the only evidence that a
          C++ program is free of UB on a given path is that you executed that path under the
          sanitizers.</strong> Test coverage and sanitizer coverage multiply — a sanitizer only sees
          what you run.
        </p>
      </InfoBox>

      <h2>What The Sanitizers Cost</h2>
      <p>
        Measured, because &quot;2&ndash;3&times;&quot; is folklore that deserves a number from this
        machine. The workload is a realistic mix — 40 rounds of building a 20,000-element{' '}
        <code>std::vector&lt;std::string&gt;</code>, sorting it, and summing the lengths. Five runs
        of each build:
      </p>

      <CodeBlock language="text" title="Real output — five runs each, elapsed milliseconds">
{`b_plain   88.8  73.1  74.4  74.1  73.3      (-O2, no sanitizers)
b_asan   204.1 203.3 205.1 205.3 205.5      (-O2 -g -fsanitize=address)
b_ubsan  226.9 223.7 227.5 223.7 228.7      (-O2 -g -fsanitize=undefined)
b_both   431.4 429.1 429.3 435.5 429.9      (-O2 -g -fsanitize=address,undefined)
b_O0     868.9 871.4 867.2 863.4 868.0      (-O0, no sanitizers)

checksum = 8710947 in every build -- same answer, so the work is identical`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Build</th>
            <th style={headStyle}>Time</th>
            <th style={headStyle}>vs plain <code>-O2</code></th>
            <th style={headStyle}>Binary</th>
            <th style={headStyle}>Peak RSS</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>-O2</code>, no sanitizers</td>
            <td style={cellStyle}>~73 ms</td>
            <td style={cellStyle}>1.0&times;</td>
            <td style={cellStyle}>126,280 bytes</td>
            <td style={cellStyle}>1,968 KB</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>-fsanitize=address</code></td>
            <td style={cellStyle}>~205 ms</td>
            <td style={cellStyle}>2.8&times;</td>
            <td style={cellStyle}>280,440 bytes</td>
            <td style={cellStyle}>38,576 KB (19.6&times;)</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>-fsanitize=undefined</code></td>
            <td style={cellStyle}>~226 ms</td>
            <td style={cellStyle}>3.1&times;</td>
            <td style={cellStyle}>333,352 bytes</td>
            <td style={cellStyle}>&mdash;</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>-fsanitize=address,undefined</code></td>
            <td style={cellStyle}>~430 ms</td>
            <td style={cellStyle}>5.9&times;</td>
            <td style={cellStyle}>384,152 bytes</td>
            <td style={cellStyle}>38,656 KB</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>-O0</code>, no sanitizers</td>
            <td style={cellStyle}>~868 ms</td>
            <td style={cellStyle}>11.9&times;</td>
            <td style={cellStyle}>&mdash;</td>
            <td style={cellStyle}>&mdash;</td>
          </tr>
        </tbody>
      </table>

      <p>
        Two surprises in that table, both worth recording because both contradict the usual story.
      </p>
      <p>
        <strong>UBSan was slower than ASan here</strong> — 3.1&times; versus 2.8&times; — which is
        the opposite of the folklore that ASan is the expensive one and UBSan is nearly free. On this
        workload, which is dominated by small allocations and string comparisons, UBSan&apos;s
        per-operation checks cost more than ASan&apos;s shadow-memory lookups.
      </p>
      <p>
        <strong>The fully sanitized <code>-O2</code> build is twice as fast as the plain{' '}
        <code>-O0</code> build.</strong> 430 ms against 868 ms. If your development loop already
        builds unoptimised — and most do — then turning on both sanitizers and raising the
        optimisation level to <code>-O1</code> or <code>-O2</code> makes your tests{' '}
        <em>faster</em> while also finding bugs. &quot;The sanitizers are too slow for
        development&quot; is, on this evidence, simply not true.
      </p>
      <p>
        The memory figure is the one that genuinely rules out production:{' '}
        <strong>19.6&times; peak RSS</strong>, because ASan maintains a shadow byte for every eight
        bytes of your address space plus quarantined freed allocations. A service sized for 4 GB
        becomes a service that needs considerably more than that.
      </p>

      <FlowChart
        title="Where each build belongs"
        chart={
          'graph LR\n' +
          '  subgraph DEV["Local development"]\n' +
          '    D1["-O1 -g<br/>-fsanitize=address,undefined<br/>-D_LIBCPP_HARDENING_MODE=<br/>_LIBCPP_HARDENING_MODE_DEBUG"] --> D2["Measured here: 5.9x runtime,<br/>19.6x peak RSS.<br/>Still 2x FASTER than the<br/>plain -O0 build you were<br/>probably using anyway."]\n' +
          '  end\n' +
          '  subgraph CI["CI — every pull request"]\n' +
          '    C1["Job 1: -O2, no sanitizers<br/>— the build you ship"]\n' +
          '    C2["Job 2: -O1 -g -fsanitize=address<br/>— run the whole test suite"]\n' +
          '    C3["Job 3: -O1 -g -fsanitize=undefined<br/>-fno-sanitize-recover=all<br/>— so a finding FAILS the job"]\n' +
          '    C4["Job 4: leaks --atExit on<br/>a representative binary<br/>— exits 1 when it finds something"]\n' +
          '  end\n' +
          '  subgraph PROD["Production"]\n' +
          '    P1["-O2, NO sanitizers."]\n' +
          '    P1 --> P2["Why not: 5.9x slower, 19.6x memory,<br/>3x the binary, and ASan\'s shadow<br/>mapping is itself an attack surface."]\n' +
          '    P2 --> P3["Keep instead: -Wall -Wextra -Werror,<br/>the stack protector (on by default),<br/>and _LIBCPP_HARDENING_MODE=fast<br/>if you want cheap bounds checks."]\n' +
          '  end\n' +
          '  D2 --> C1\n' +
          '  C2 --> P1\n' +
          '  C3 --> P1\n' +
          '  style D1 fill:#1a3329,stroke:#4ade80\n' +
          '  style C3 fill:#1a3329,stroke:#4ade80\n' +
          '  style P1 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style P2 fill:#3d2f14,stroke:#fb923c'
        }
      />

      <InfoBox variant="warning" title="Three constraints on how you combine them">
        <p>
          <strong>ASan and TSan cannot be combined</strong> — ThreadSanitizer and AddressSanitizer
          both claim the same shadow-memory regions, so you need separate jobs. ASan and UBSan{' '}
          <em>can</em> be combined, and the 5.9&times; figure above is them together.
        </p>
        <p>
          <strong>Do not build sanitizer jobs at <code>-O2</code>.</strong> The double-free case
          earlier in this lesson was caught at <code>-O0</code> and silently missed at{' '}
          <code>-O1</code> and <code>-O2</code>, because the optimiser deleted the allocation before
          the sanitizer could instrument it. <code>-O1 -g</code> is the standard choice;{' '}
          <code>-O0</code> catches a little more and is slower.
        </p>
        <p>
          <strong>A sanitizer only sees the code you run.</strong> They are not static analysis.
          ASan on a test suite with 40% coverage checks 40% of your program. This is why they belong
          in CI attached to the test suite rather than being run manually once.
        </p>
      </InfoBox>

      <h2>Which Tool For Which Bug</h2>

      <FlowChart
        title="The bug-to-tool map, as verified on this machine"
        chart={
          'graph TD\n' +
          '  B["A memory or UB bug<br/>in a C++ program"] --> K{"What kind?"}\n' +
          '  K -->|"touching freed heap memory"| A1["ASan: heap-use-after-free"]\n' +
          '  K -->|"freeing the same block twice"| A2["ASan: attempting double-free<br/>— but see the caveat: at -O1+ the<br/>optimiser may delete the whole<br/>new/delete pair first"]\n' +
          '  K -->|"writing past a heap array"| A3["ASan: heap-buffer-overflow"]\n' +
          '  K -->|"writing past a stack array"| A4["ASan: stack-buffer-overflow<br/>(the stack canary also fires,<br/>silently, with no message)"]\n' +
          '  K -->|"a pointer or view outliving<br/>the scope it points into"| A5["ASan: stack-use-after-scope"]\n' +
          '  K -->|"past size() but inside capacity()<br/>of a std::vector"| A6["ASan: container-overflow<br/>— the shipped libc++ is already<br/>instrumented for this"]\n' +
          '  K -->|"signed overflow, bad shift,<br/>misaligned load, null deref,<br/>bad float-to-int"| U1["UBSan: runtime error,<br/>with file:line:column<br/>and the actual values"]\n' +
          '  K -->|"a precondition on a standard<br/>container: front() on empty,<br/>v[i] out of range"| H1["libc++ hardening:<br/>-D_LIBCPP_HARDENING_MODE=<br/>_LIBCPP_HARDENING_MODE_DEBUG"]\n' +
          '  K -->|"never freeing something"| L1["NOT LeakSanitizer on this platform.<br/>/usr/bin/leaks — and read the caveat,<br/>it is a conservative scanner"]\n' +
          '  K -->|"reading an uninitialised variable"| M1["NOT MemorySanitizer on this platform.<br/>-Wall catches some; use<br/>-ftrivial-auto-var-init=pattern<br/>to make the rest deterministic"]\n' +
          '  style A1 fill:#1a3329,stroke:#4ade80\n' +
          '  style A3 fill:#1a3329,stroke:#4ade80\n' +
          '  style A4 fill:#1a3329,stroke:#4ade80\n' +
          '  style A5 fill:#1a3329,stroke:#4ade80\n' +
          '  style A6 fill:#1a3329,stroke:#4ade80\n' +
          '  style U1 fill:#1a3329,stroke:#4ade80\n' +
          '  style H1 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style A2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style L1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style M1 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h2>Every Bug On This Page, And Why It Could Not Have Happened</h2>
      <p>
        The point of the previous three lessons is that most of this page is avoidable by
        construction, not by vigilance.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Bug</th>
            <th style={headStyle}>Unsanitized result</th>
            <th style={headStyle}>The construction that prevents it</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>use-after-free</td>
            <td style={cellStyle}>printed <code>4543</code>, exit 0</td>
            <td style={cellStyle}><code>unique_ptr</code> for ownership; indices or{' '}
              <code>weak_ptr</code> in the cache instead of raw pointers</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>double free</td>
            <td style={cellStyle}>exit 133, no message</td>
            <td style={cellStyle}>Single ownership. A <code>unique_ptr</code> cannot be copied, so
              the aliasing is a compile error</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>heap buffer overflow</td>
            <td style={cellStyle}>correct answer, exit 0</td>
            <td style={cellStyle}><code>std::vector</code> + range-<code>for</code>; no index
              arithmetic in the source</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>stack buffer overflow</td>
            <td style={cellStyle}>exit 134, no message</td>
            <td style={cellStyle}><code>std::string</code>, not <code>char[]</code>; never{' '}
              <code>strcpy</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>use-after-scope</td>
            <td style={cellStyle}><strong>printed the right answer</strong>, exit 0</td>
            <td style={cellStyle}>Treat <code>string_view</code>/<code>span</code> as parameter
              types only; never store one</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>past <code>size()</code></td>
            <td style={cellStyle}>garbage, exit 0</td>
            <td style={cellStyle}><code>.at()</code> where the index is untrusted;{' '}
              <code>_LIBCPP_HARDENING_MODE</code> everywhere else</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>leak</td>
            <td style={cellStyle}>exit 0, nothing anywhere</td>
            <td style={cellStyle}>RAII. There is no <code>malloc</code> or raw{' '}
              <code>new</code> in modern C++</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>uninitialised read</td>
            <td style={cellStyle}>different value at each <code>-O</code></td>
            <td style={cellStyle}><code>{'{}'}</code> on every declaration; member initialisers in
              the class</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>UB / null check after deref</td>
            <td style={cellStyle}>the check was deleted from the binary</td>
            <td style={cellStyle}>A reference, or <code>std::optional</code>, so there is no
              nullable thing to check</td>
          </tr>
        </tbody>
      </table>

      <p>
        Six of the nine ran to completion with exit status 0, and one of those printed the
        completely correct answer. That is the single most important observation on this page.{' '}
        <strong>In C++, &quot;the program ran and the output looked right&quot; is not evidence that
        the program is correct.</strong>
      </p>

      <h2>The Closing Checklist</h2>
      <p>
        Everything on this list was exercised somewhere above, so none of it is aspirational.
      </p>

      <h3>Flags, for every project you control</h3>
      <CodeBlock language="make" title="A Makefile fragment you can paste">
{`CXX      := clang++
CXXSTD   := -std=c++23
WARN     := -Wall -Wextra -Wpedantic -Wconversion -Wshadow

# The build you ship.
RELEASE  := $(CXXSTD) $(WARN) -O2 -DNDEBUG

# The build you develop against. Measured at 5.9x the release runtime here,
# and still ~2x faster than a plain -O0 build.
DEBUG    := $(CXXSTD) $(WARN) -O1 -g \\
            -fsanitize=address,undefined \\
            -fno-omit-frame-pointer \\
            -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG

# The CI build, where a finding must fail the job rather than print a line.
CI       := $(DEBUG) -fno-sanitize-recover=all

# Optional, for chasing an uninitialised read: makes the garbage deterministic
# and recognisable as 0xAAAAAAAA.
PATTERN  := -ftrivial-auto-var-init=pattern`}
      </CodeBlock>

      <h3>Habits, in rough order of how much they buy</h3>
      <ul>
        <li>
          <strong>No raw <code>new</code>, no <code>delete</code>, no <code>malloc</code>.</strong>{' '}
          <code>std::vector</code>, <code>std::string</code>, <code>make_unique</code>. This alone
          removes bugs 1, 2, 3 and 7 from the list above as categories.
        </li>
        <li>
          <strong>Initialise everything, with <code>{'{}'}</code>.</strong> Free, and removes bug 8.
        </li>
        <li>
          <strong>Run the test suite under the sanitizers in CI, not by hand.</strong> They only see
          executed code, so their value is proportional to your coverage.
        </li>
        <li>
          <strong>Build sanitizer jobs at <code>-O1</code>, with an occasional{' '}
          <code>-O0</code> run.</strong> Verified above: a double free was invisible to ASan at{' '}
          <code>-O2</code>.
        </li>
        <li>
          <strong>Add <code>-fno-sanitize-recover=all</code>.</strong> Otherwise UBSan prints and
          continues, and the job goes green.
        </li>
        <li>
          <strong>On macOS, remember two sanitizers are missing.</strong> No LeakSanitizer, no
          MemorySanitizer. Use <code>/usr/bin/leaks</code> for the first and read it as a
          conservative lower bound; use <code>-ftrivial-auto-var-init</code> and{' '}
          <code>-Wall</code> for the second. If your CI has Linux runners, run ASan with{' '}
          <code>detect_leaks=1</code> and MSan there.
        </li>
        <li>
          <strong>Never hold a <code>string_view</code>, <code>span</code>, reference or raw pointer
          longer than the thing it refers to.</strong> This is the one habit no tool fully replaces,
          because bug 5 above printed the correct answer.
        </li>
        <li>
          <strong>Turn on <code>_LIBCPP_HARDENING_MODE</code>.</strong> It is the cheapest of all of
          these and it produces the most readable diagnostics.
        </li>
      </ul>

      <h3>What to do when a report lands</h3>
      <ol>
        <li>
          Read the <strong>verdict line</strong> first. The bug class is named; do not re-derive it.
        </li>
        <li>
          Read the stack traces <strong>bottom-up until you reach your own code</strong>. The top
          frames are often inside libc++ or the sanitizer runtime, and the{' '}
          <code>SUMMARY</code> line can point at a system library, as it did in bug 5.
        </li>
        <li>
          For a heap bug, the <strong>&quot;freed by&quot;</strong> and{' '}
          <strong>&quot;previously allocated by&quot;</strong> traces are usually more useful than
          the access itself — the mistake is normally in the lifetime, not the access.
        </li>
        <li>
          Note the <strong>size and offset</strong>. <code>0 bytes after a 32-byte region</code> is
          an off-by-one; <code>28 bytes inside a 64-byte region</code> is an index problem.
        </li>
        <li>
          Reproduce at <code>-O0</code> before you start editing. Optimisation can move or remove
          the bug, as the double-free case showed.
        </li>
      </ol>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, and it is a small one with a disproportionate payoff. Take{' '}
          <code>nullcheck.cpp</code> from this page, compile it at <code>-O2</code> with{' '}
          <code>-S</code>, and look at <code>get_port</code> with your own eyes. Two instructions.
          The defensive branch you wrote is not in the binary.
        </p>
        <p>
          That is the thing to carry out of this phase. In Java and Node, a defensive check is a
          defensive check — it is in the bytecode, it runs, and worst case it is redundant. In C++ a
          defensive check placed after undefined behaviour is{' '}
          <em>evidence to the optimiser that the bad case cannot occur</em>, and it gets deleted
          along with everything that depended on it. The code you read is not reliably the code that
          runs, and the sanitizers are how you close that gap.
        </p>
        <p>
          Phase 2 ends here. You have the memory model, <a href="/cpp/raii">RAII</a>,{' '}
          <a href="/cpp/smart-pointers">ownership</a>,{' '}
          <a href="/cpp/move-semantics">transfer</a>, and now detection. Phase 3 turns to building
          types, and it opens with the rule that has been owed an explanation three times on this
          page — <a href="/cpp/classes">the rule of zero, three and five</a>, which is what connects
          the destructor you declare to the move constructor you silently lose.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default MemoryBugs;
