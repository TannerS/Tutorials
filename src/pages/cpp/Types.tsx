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

function Types() {
  return (
    <LessonLayout
      title="Types, auto & Control Flow"
      sectionId="cpp"
      lessonIndex={2}
      prev={{ path: '/cpp/compiling', label: 'Compiling, Linking & the One-Definition Rule' }}
      next={{ path: '/cpp/functions', label: 'Functions, Overloading & Lambdas' }}
    >
      <p>
        Java fixed the sizes of its primitives in the spec in 1995 and never looked back. An{' '}
        <code>int</code> is 32 bits on every JVM that has ever existed, a <code>long</code> is 64,
        and <code>char</code> is a UTF-16 code unit. JavaScript went further and gave you one number
        type. Both decisions were correct for their purposes, and both have trained you to treat
        &quot;how big is an int&quot; as a question with an answer.
      </p>
      <p>
        In C++ it is a question with a <em>per-target</em> answer, and that is the first of several
        places in this lesson where your instincts are not wrong so much as inapplicable. The others
        are that mixing signed and unsigned integers is a silent correctness bug rather than a type
        error, that <code>auto</code> is not Java&apos;s <code>var</code>, and that there are three
        different things in this language all called &quot;a string.&quot;
      </p>

      <h2>Fundamental Types Are Implementation-Defined</h2>
      <p>
        The standard specifies <em>minimum</em> widths and an ordering. It does not specify sizes.
        What it actually guarantees is only this:
      </p>
      <CodeBlock language="text" title="The guarantees the standard gives you">
{`1 == sizeof(char) <= sizeof(short) <= sizeof(int) <= sizeof(long) <= sizeof(long long)

char       at least 8 bits    (CHAR_BIT, which is 8 on anything you will meet)
short      at least 16 bits
int        at least 16 bits   <- note: SIXTEEN. Not 32.
long       at least 32 bits
long long  at least 64 bits`}
      </CodeBlock>

      <p>
        Here is what those actually are on this machine. Nothing below is quoted from a reference —
        it is the output of a program compiled and run with Apple clang 21.0.0 targeting{' '}
        <code>arm64-apple-darwin25.6.0</code>:
      </p>

      <InfoBox variant="note" title="If you have not seen template <class T> before">
        <p style={{ marginBottom: 0 }}>
          The helper below starts with <code>template &lt;class T&gt;</code>, and{' '}
          <code>row&lt;bool&gt;(...)</code> calls it. Read it as Java&apos;s{' '}
          <code>&lt;T&gt; void row(...)</code> — one function written once, usable with any type, with
          the type named in angle brackets at the call. That is all you need here, and it will turn up
          a few more times before it gets its own lesson. The differences from Java generics are real
          and large (no erasure; a separate copy of the function is compiled per type), and they are
          the subject of <a href="/cpp/templates">Templates &amp; Generic Programming</a>.
        </p>
      </InfoBox>

      <CodeBlock language="cpp" title="sizes.cpp">
{`#include <print>
#include <cstdint>
#include <climits>

template <class T>
void row(const char* name) {
    std::println("{:<22} {:>2}   {:>2}", name, sizeof(T), alignof(T));
}

int main() {
    std::println("{:<22} {:>2}   {:>2}", "type", "sizeof", "alignof");
    row<bool>("bool");
    row<char>("char");
    row<short>("short");
    row<int>("int");
    row<long>("long");
    row<long long>("long long");
    row<float>("float");
    row<double>("double");
    row<long double>("long double");
    row<void*>("void*");
    row<std::size_t>("std::size_t");
    row<std::ptrdiff_t>("std::ptrdiff_t");
    row<wchar_t>("wchar_t");
    std::println("");
    std::println("CHAR_BIT        = {}", CHAR_BIT);
    std::println("char is signed? {}", char(-1) < 0);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — this machine only: clang++ -std=c++23 -O2 sizes.cpp && ./sizes">
{`type                   sizeof   alignof
bool                    1    1
char                    1    1
short                   2    2
int                     4    4
long                    8    8
long long               8    8
float                   4    4
double                  8    8
long double             8    8
void*                   8    8
std::size_t             8    8
std::ptrdiff_t          8    8
wchar_t                 4    4

CHAR_BIT        = 8
char is signed? true`}
      </CodeBlock>

      <p>
        Two of those lines are worth flagging immediately. <code>long double</code> is{' '}
        <strong>8 bytes</strong> here — identical to <code>double</code>, so on this platform{' '}
        <code>long double</code> buys you exactly nothing. And <code>char</code> is{' '}
        <strong>signed</strong>, which means <code>char(0xE9)</code> is a negative number and using
        it as an array index is a bug.
      </p>
      <p>
        Neither of those is a portable fact, and the way to prove it is not to look them up. Clang
        is a cross-compiler, and <code>sizeof</code> is a compile-time constant, so you can ask it
        about any target without being on that target. The trick is a deliberately failing{' '}
        <code>static_assert</code>, because clang prints the value it computed:
      </p>

      <CodeBlock language="cpp" title="p3.cpp — never run, only type-checked">
{`static_assert(sizeof(int)         == 0, "a");
static_assert(sizeof(long)        == 0, "b");
static_assert(sizeof(long double) == 0, "d");`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -target i386-pc-linux-gnu -fsyntax-only -nostdinc++ p3.cpp">
{`p3.cpp:1:15: error: static assertion failed due to requirement 'sizeof(int) == 0': a
p3.cpp:1:35: note: expression evaluates to '4 == 0'
p3.cpp:2:15: error: static assertion failed due to requirement 'sizeof(long) == 0': b
p3.cpp:2:35: note: expression evaluates to '4 == 0'
p3.cpp:3:15: error: static assertion failed due to requirement 'sizeof(long double) == 0': d
p3.cpp:3:35: note: expression evaluates to '12 == 0'`}
      </CodeBlock>

      <p>
        Run that across six target triples and the whole table falls out. Every number below was
        produced by that probe, on this machine, with this compiler:
      </p>

      <CodeBlock language="text" title="Real output — the same probe, six -target triples, Apple clang 21.0.0">
{`target triple                       int        long   long long long double       void*     wchar_t       char
arm64-apple-darwin                    4           8           8           8           8           4     signed
x86_64-pc-linux-gnu                   4           8           8          16           8           4     signed
aarch64-unknown-linux-gnu             4           8           8          16           8           4   unsigned
x86_64-pc-windows-msvc                4           4           8           8           8           2     signed
i386-pc-linux-gnu                     4           4           8          12           4           4     signed
armv7a-none-eabi                      4           4           8           8           4           4   unsigned`}
      </CodeBlock>

      <p>
        Read down the columns rather than across, because each one is a real bug someone has
        shipped:
      </p>
      <ul>
        <li>
          <strong><code>long</code> is 8 on Linux and 4 on Windows</strong>, on the same CPU. This is
          the LP64-versus-LLP64 split, and it is the single most common cause of &quot;works on
          Linux, truncates on Windows.&quot; If you want 64 bits, write{' '}
          <code>long long</code> or <code>std::int64_t</code>, never <code>long</code>.
        </li>
        <li>
          <strong><code>long double</code> is 8, 12 or 16 bytes</strong> depending on target. Writing
          one to a file is not a portable serialisation format, and neither is{' '}
          <code>sizeof</code>-ing it into a buffer size.
        </li>
        <li>
          <strong><code>wchar_t</code> is 2 bytes on Windows and 4 elsewhere.</strong> This is why{' '}
          <code>wchar_t</code> is effectively unusable for portable code and why C++11 added{' '}
          <code>char16_t</code> and <code>char32_t</code>, which are pinned.
        </li>
        <li>
          <strong><code>char</code> is signed on x86-64 Linux and unsigned on AArch64 Linux.</strong>{' '}
          Same operating system, same compiler, different CPU, opposite answer. Code that does{' '}
          <code>if (c &gt; 127)</code> is dead on one of them.
        </li>
        <li>
          <strong><code>void*</code> is 4 bytes on 32-bit targets.</strong> Still extremely alive in
          embedded work, and the reason &quot;just store the pointer in an <code>int</code>&quot; has
          a long and unhappy history.
        </li>
      </ul>

      <InfoBox variant="tip" title="The one habit that makes this a non-issue">
        <p>
          Never assume a size — assert it. One line at the top of a header, and the
          implementation-defined problem turns into a compile error on the day somebody builds you
          for a target you did not plan for:
        </p>
        <CodeBlock language="cpp" title="Make the assumption explicit">
{`static_assert(sizeof(long) == 8, "this code assumes LP64");
static_assert(CHAR_BIT == 8,     "this code assumes 8-bit bytes");
static_assert(sizeof(void*) == 8, "64-bit only");`}
        </CodeBlock>
        <p>
          This is the cheapest defensive move in C++. It costs nothing at runtime, it is checked by
          the compiler rather than by a reviewer, and it converts a silent miscompile into a message
          that names the assumption you made.
        </p>
      </InfoBox>

      <h2><code>&lt;cstdint&gt;</code>: When To Pin The Width</h2>
      <p>
        <code>&lt;cstdint&gt;</code> gives you the types whose names are their sizes:{' '}
        <code>std::int8_t</code>, <code>std::uint16_t</code>, <code>std::int32_t</code>,{' '}
        <code>std::uint64_t</code>, and so on. The temptation, coming from a language where every
        width was fixed, is to use them everywhere. Resist it — they are a tool for a specific job.
      </p>
      <p>
        The rule that holds up: <strong>use a fixed-width type when the number of bits is part of
        the contract, and the natural type otherwise.</strong> &quot;Part of the contract&quot; means
        something outside your program can see the bits.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Situation</th>
            <th style={headStyle}>Use</th>
            <th style={headStyle}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>A wire protocol, file header, checksum</td>
            <td style={cellStyle}><code>std::uint32_t</code> etc.</td>
            <td style={cellStyle}>the byte count is the specification</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A hardware register or memory-mapped field</td>
            <td style={cellStyle}><code>std::uint8_t</code>, <code>std::uint16_t</code></td>
            <td style={cellStyle}>the width is physical</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Bit manipulation with a known mask</td>
            <td style={cellStyle}><code>std::uint64_t</code></td>
            <td style={cellStyle}>shifts past the width are UB; pin it</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A loop counter, an ID, ordinary arithmetic</td>
            <td style={cellStyle}><code>int</code></td>
            <td style={cellStyle}>it is the target&apos;s natural register width and signed</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A size, index or object count</td>
            <td style={cellStyle}><code>std::size_t</code></td>
            <td style={cellStyle}>what every container&apos;s <code>.size()</code> returns</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A difference between two indices or pointers</td>
            <td style={cellStyle}><code>std::ptrdiff_t</code></td>
            <td style={cellStyle}><code>size_t</code> is unsigned; differences go negative</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A byte of untyped memory</td>
            <td style={cellStyle}><code>std::byte</code></td>
            <td style={cellStyle}>no arithmetic, no signedness question, no character
              baggage</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="Which integer type to reach for"
        chart={
          'graph TD\n' +
          '  Q["I need an integer. Which one?"] --> A{"What is it for?"}\n' +
          '  A -->|"ordinary arithmetic,<br/>loop counters, IDs"| I["int<br/>— at least 16 bits, 32 everywhere real"]\n' +
          '  A -->|"a size, index or<br/>count of objects in memory"| S["std::size_t<br/>— what .size() returns"]\n' +
          '  A -->|"a difference between<br/>two indices or pointers"| P["std::ptrdiff_t<br/>— signed, unlike size_t"]\n' +
          '  A -->|"a wire format, file header,<br/>register or hardware field"| F["std::int32_t / std::uint8_t ...<br/>from &lt;cstdint&gt;"]\n' +
          '  A -->|"a byte of raw memory"| B["std::byte<br/>— not char, not signed"]\n' +
          '  I --> W{"Will it be compared<br/>against a .size()?"}\n' +
          '  W -->|yes| WARN["Signed/unsigned mix.<br/>Cast ONE side explicitly,<br/>or use std::ssize(c)"]\n' +
          '  W -->|no| OK1["fine"]\n' +
          '  F --> NOTE["Fixed width is a PROMISE about layout.<br/>Use it when the bytes matter,<br/>not as a default."]\n' +
          '  style I fill:#1a3329,stroke:#4ade80\n' +
          '  style S fill:#1a2744,stroke:#5b9cf6\n' +
          '  style F fill:#3d2f14,stroke:#fb923c\n' +
          '  style WARN fill:#3b1a1a,stroke:#f87171'
        }
      />

      <InfoBox variant="note" title="Three things about <cstdint> that catch people out">
        <p>
          <strong><code>std::int8_t</code> is almost certainly <code>signed char</code></strong>,
          which means streaming it with <code>std::cout</code> prints a character rather than a
          number, and <code>std::println("{}", x)</code> will format it as an integer only because{' '}
          <code>std::format</code> treats it as the arithmetic type it is. Mixing the two is a
          classic confusion.
        </p>
        <p>
          <strong>The exact-width types are optional.</strong> The standard only requires{' '}
          <code>int_least8_t</code> and friends; <code>int8_t</code> exists if the target has a type
          that is exactly 8 bits with no padding. In practice every mainstream target has them, but
          that is why they live in a header rather than being keywords.
        </p>
        <p>
          <strong>Unsigned fixed-width types inherit all the mixing problems below.</strong> Writing{' '}
          <code>std::uint32_t</code> does not make the arithmetic safer; it makes the width
          predictable. Those are different properties.
        </p>
      </InfoBox>

      <h2>Mixing Signed And Unsigned</h2>
      <p>
        This is the highest-value section in the lesson, because it is the one place where C++ will
        quietly compute the wrong answer from code that reads correctly, in a way neither Java nor
        JavaScript can.
      </p>
      <p>
        When you compare or add a signed and an unsigned integer of the same rank, the rule is{' '}
        <strong>the signed one is converted to unsigned</strong>. Not the other way round. Here is
        what that does:
      </p>

      <CodeBlock language="cpp" title="su.cpp">
{`#include <print>
#include <vector>
#include <cstdint>

int main() {
    // 1. The comparison surprise.
    int           i = -1;
    unsigned int  u =  1;
    std::println("(-1 < 1u)                      = {}", i < u);

    // 2. The one that actually bites: .size() is unsigned.
    std::vector<int> v{10, 20, 30};
    std::println("v.size()                       = {}", v.size());
    std::println("v.size() - 5                   = {}", v.size() - 5);

    // 3. ...which turns an "obviously safe" loop into an infinite one.
    int visited = 0;
    for (std::size_t n = v.size() - 1; n >= 0; --n) {
        if (++visited > 5) { std::println("loop ran away; bailing out"); break; }
    }

    // 4. Integer promotion: small types are promoted to int before arithmetic.
    std::uint8_t a = 200, b = 100;
    std::println("uint8_t 200 + 100              = {}", a + b);
    std::println("sizeof(a + b)                  = {}", sizeof(a + b));
    std::println("uint8_t(a + b)                 = {}", std::uint8_t(a + b));

    // 5. Promotion also breaks the "~ then compare" idiom on small types.
    std::uint8_t mask = 0x0F;
    std::println("~mask as written               = {}", ~mask);
    std::println("~mask narrowed back to uint8_t = {}", std::uint8_t(~mask));

    // 6. char is signed here, which makes this a negative index.
    char hi = '\\xE9';
    std::println("char '\\\\xE9' as int             = {}", int(hi));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 su.cpp && ./su">
{`(-1 < 1u)                      = false
v.size()                       = 3
v.size() - 5                   = 18446744073709551614
loop ran away; bailing out
uint8_t 200 + 100              = 300
sizeof(a + b)                  = 4
uint8_t(a + b)                 = 44
~mask as written               = -16
~mask narrowed back to uint8_t = 240
char '\\xE9' as int             = -23`}
      </CodeBlock>

      <p>
        Six separate surprises. Taking them in order:
      </p>
      <ol>
        <li>
          <strong><code>-1 &lt; 1u</code> is <code>false</code>.</strong> The <code>-1</code> became{' '}
          <code>4294967295</code>, which is not less than 1. Mathematically wrong, exactly as
          specified.
        </li>
        <li>
          <strong><code>v.size() - 5</code> is 18 quintillion.</strong> There is no negative in
          unsigned arithmetic; subtraction below zero wraps to the top. And unlike signed overflow —
          which is the undefined behaviour from <a href="/cpp/intro">the intro lesson</a> —{' '}
          unsigned wraparound is fully <em>defined</em>. It is not UB. It is just wrong.
        </li>
        <li>
          <strong>The backwards loop never ends.</strong> <code>n &gt;= 0</code> where{' '}
          <code>n</code> is unsigned is a tautology — it is <em>always</em> true, so{' '}
          <code>--n</code> at zero wraps to 18 quintillion and keeps going. This loop would be
          correct in Java character-for-character.
        </li>
        <li>
          <strong><code>uint8_t(200) + uint8_t(100)</code> is 300, not 44.</strong> This is{' '}
          <em>integer promotion</em>: before any arithmetic happens, anything smaller than{' '}
          <code>int</code> is promoted to <code>int</code>. So the addition is done in 32 bits,{' '}
          <code>sizeof(a + b)</code> is 4, and you only lose the high bits if you narrow the result
          back — which is where the 44 comes from.
        </li>
        <li>
          <strong><code>~mask</code> on a <code>uint8_t</code> is <code>-16</code>.</strong> Promotion
          again: <code>0x0F</code> became <code>0x0000000F</code>, and <code>~</code> of that is{' '}
          <code>0xFFFFFFF0</code>, which as a signed <code>int</code> is <code>-16</code>. Anyone
          expecting <code>0xF0</code> has just written a bitmask bug.
        </li>
        <li>
          <strong><code>char('\xE9')</code> is <code>-23</code>.</strong> Because <code>char</code>{' '}
          is signed on this target. <code>table[c]</code> is now an out-of-bounds read.
        </li>
      </ol>

      <InfoBox variant="danger" title="And the warnings caught exactly one of the six">
        <p>
          The program above was compiled with <code>-Wall -Wextra</code>. Here is everything the
          compiler had to say:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fmessage-length=76 -c su.cpp">
{`su.cpp:9:59: warning: comparison of integers of different signs: 'int' and
      'unsigned int' [-Wsign-compare]
    9 |     std::println("(-1 < 1u)                      = {}", i < u);
      |                                                         ~ ^ ~
1 warning generated.`}
        </CodeBlock>
        <p>
          One warning, for case 1. Nothing about the runaway loop, nothing about the promotion
          truncation. The runaway loop <em>is</em> diagnosable — it needs a flag that{' '}
          <code>-Wall -Wextra</code> does not turn on:
        </p>
        <CodeBlock language="text" title="Real output — adding -Wtautological-unsigned-zero-compare">
{`loop.cpp:5:42: warning: result of comparison of unsigned expression >= 0
      is always true [-Wtautological-unsigned-zero-compare]
    5 |     for (std::size_t n = v.size() - 1; n >= 0; --n) {
      |                                        ~ ^  ~`}
        </CodeBlock>
        <p>
          The truncation in case 4 is the genuinely uncomfortable one.{' '}
          <strong>Not even <code>-Weverything</code> warns about it.</strong> That got checked rather
          than assumed, and the reason turns out to be deliberate: clang suppresses{' '}
          <code>-Wconversion</code> when a narrowing merely undoes an integer promotion, because
          that pattern is almost always intentional. It fires for an honest <code>int</code> source
          and for a literal that cannot fit, but not for <code>uint8_t r = x + y</code>:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -Wconversion -c conv2.cpp">
{`conv2.cpp:5:42: warning: implicit conversion loses integer precision:
    5 | std::uint8_t b(int n) { std::uint8_t r = n; return r; }
conv2.cpp:7:53: warning: implicit conversion loses integer precision:
    7 | std::uint8_t c(std::uint8_t x) { std::uint8_t r = x + 1000; return r; }

(line 3 -- std::uint8_t a(std::uint8_t x, std::uint8_t y) { std::uint8_t r = x + y; ... }
 -- produces no diagnostic at all, at any warning level including -Weverything)`}
        </CodeBlock>
      </InfoBox>

      <h3>What to actually do about it</h3>
      <p>
        Three tools, in increasing order of how much you should reach for them.
      </p>

      <CodeBlock language="cpp" title="safe.cpp — the C++20 fixes">
{`#include <print>
#include <vector>
#include <utility>    // std::cmp_less  (C++20)
#include <iterator>   // std::ssize     (C++20)
#include <cstddef>

int main() {
    int i = -1;
    unsigned u = 1;
    std::println("i < u                  = {}   (wrong)", i < u);
    std::println("std::cmp_less(i, u)    = {}   (right)", std::cmp_less(i, u));

    std::vector<int> v{10, 20, 30};
    std::println("v.size()               = {}  (type size_t)", v.size());
    std::println("std::ssize(v)          = {}  (type ptrdiff_t, SIGNED)", std::ssize(v));

    // The backwards loop that actually terminates.
    for (auto n = std::ssize(v) - 1; n >= 0; --n) std::print("{} ", v[n]);
    std::println("");

    std::byte b{0xF0};
    std::println("std::byte 0xF0 as int  = {}", std::to_integer<int>(b));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 safe.cpp && ./safe">
{`i < u                  = false   (wrong)
std::cmp_less(i, u)    = true   (right)
v.size()               = 3  (type size_t)
std::ssize(v)          = 3  (type ptrdiff_t, SIGNED)
30 20 10
std::byte 0xF0 as int  = 240`}
      </CodeBlock>

      <ul>
        <li>
          <strong><code>std::ssize(c)</code></strong> (C++20) returns the container&apos;s size as a{' '}
          signed <code>ptrdiff_t</code>. Use it whenever a size is going to meet signed arithmetic —
          the backwards loop above now terminates, with no cast and no cleverness. This is the one
          to make a habit.
        </li>
        <li>
          <strong><code>std::cmp_less</code>, <code>cmp_greater</code>, <code>cmp_equal</code></strong>{' '}
          and friends (C++20, <code>&lt;utility&gt;</code>) compare integers by mathematical value
          regardless of signedness. Verbose, so reserve them for where the mix is unavoidable — a
          bounds check against an API that hands you an unsigned.
        </li>
        <li>
          <strong>An explicit cast on exactly one side</strong>, with a comment saying why it cannot
          overflow. This is the honest version of silencing the warning, and the comment is the part
          that matters.
        </li>
      </ul>

      <InfoBox variant="warning" title="The flags to actually use">
        <p>
          <code>-Wall -Wextra</code> is the floor, not the ceiling. For integer work add{' '}
          <code>-Wsign-compare</code> (already in <code>-Wall</code>),{' '}
          <code>-Wsign-conversion</code>, <code>-Wconversion</code> and{' '}
          <code>-Wtautological-unsigned-zero-compare</code>. On a new codebase, consider{' '}
          <code>-Weverything -Wno-&lt;the ones you reject&gt;</code>, which inverts the default from
          opt-in to opt-out. And keep{' '}
          <code>-fsanitize=undefined,address</code> on in debug, per{' '}
          <a href="/cpp/intro">the intro lesson</a> — unsigned wraparound is not UB so the sanitizer
          will not flag it, but signed overflow is, and that one it catches exactly.
        </p>
      </InfoBox>

      <h2><code>auto</code>: Not Java&apos;s <code>var</code></h2>
      <p>
        <code>auto</code> looks like <code>var</code> and mostly behaves like it. The difference is
        that C++ has value semantics, so <strong><code>auto</code> can silently make a
        copy</strong> — which in Java is impossible, because there is nothing to copy.
      </p>
      <p>
        The rule to memorise: <code>auto</code> deduces by the same rules as a template parameter,
        which means <strong>it strips top-level <code>const</code> and strips
        references.</strong>
      </p>

      <CodeBlock language="cpp" title="autod.cpp">
{`#include <print>
#include <map>
#include <string>
#include <typeinfo>
#include <vector>

struct Config { std::string name{"long-enough-to-allocate-on-the-heap"}; };
const Config& get_config() { static Config c; return c; }

int main() {
    // 1. auto strips const and reference. This is a silent copy.
    auto  copy = get_config();          // Config        — a full copy
    auto& ref  = get_config();          // const Config& — no copy
    std::println("copy.name buffer == original? {}", copy.name.data() == get_config().name.data());
    std::println("ref.name  buffer == original? {}", ref.name.data()  == get_config().name.data());

    // 2. auto with an integer literal is int, not size_t.
    std::vector<int> v(5, 7);
    auto n = v.size();                  // size_t
    auto m = 0;                         // int
    std::println("sizeof(n)={} sizeof(m)={}", sizeof(n), sizeof(m));

    // 3. vector<bool> — auto gives you a proxy, not a bool.
    std::vector<bool> flags{true, false, true};
    auto  f1 = flags[0];                // std::vector<bool>::reference, a PROXY
    bool  f2 = flags[0];                // an actual bool
    flags[0] = false;
    std::println("after flags[0]=false:  f1 (auto) = {}, f2 (bool) = {}", bool(f1), f2);
    std::println("sizeof(f1) = {}, sizeof(f2) = {}", sizeof(f1), sizeof(f2));
    std::println("is f1 a bool? {}", typeid(f1) == typeid(bool));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 autod.cpp && ./autod">
{`copy.name buffer == original? false
ref.name  buffer == original? true
sizeof(n)=8 sizeof(m)=4
after flags[0]=false:  f1 (auto) = false, f2 (bool) = true
sizeof(f1) = 16, sizeof(f2) = 1
is f1 a bool? false`}
      </CodeBlock>

      <p>
        The first pair is the one that costs performance in real code.{' '}
        <code>get_config()</code> returns <code>const Config&amp;</code> — a reference, no copy. But{' '}
        <code>auto copy = get_config()</code> deduced <code>Config</code>, dropping both the{' '}
        <code>const</code> and the <code>&amp;</code>, so a whole <code>Config</code> was
        constructed, including a heap allocation for its string. The <code>false</code> on line one
        is the proof: different buffer address, therefore a different allocation.{' '}
        <code>auto&amp;</code> on line two shares the buffer, as the <code>true</code> shows.
      </p>
      <p>
        The <code>vector&lt;bool&gt;</code> case is the one that produces a genuine wrong answer.{' '}
        <code>std::vector&lt;bool&gt;</code> is a bitfield in disguise, so <code>operator[]</code>{' '}
        does not return a <code>bool&amp;</code> — it returns a 16-byte proxy object that remembers
        which bit it refers to. <code>auto f1</code> captured <em>the proxy</em>, so when{' '}
        <code>flags[0]</code> changed afterwards, <code>f1</code> changed with it.{' '}
        <code>bool f2</code> read the value at the time and kept it. Two variables initialised from
        the same expression on adjacent lines, holding different values.
      </p>

      <InfoBox variant="tip" title="When to use auto, and when not to">
        <p>
          <strong>Use it when the type is already on the line</strong> or is unspeakable:{' '}
          <code>auto it = m.find(k)</code>, <code>auto p = std::make_unique&lt;Widget&gt;()</code>,{' '}
          <code>auto lam = [](int x) {'{'} return x * 2; {'}'}</code> (a lambda&apos;s type has no
          name you can write), <code>for (const auto&amp; [k, v] : m)</code>.
        </p>
        <p>
          <strong>Spell the type out when it is the point.</strong> If the reader needs to know that
          this is a <code>std::int32_t</code> because it goes on the wire, write{' '}
          <code>std::int32_t</code>. If a function returns something surprising, naming the type is
          the documentation.
        </p>
        <p>
          <strong>And always ask &quot;did that copy?&quot;</strong> The reflex that keeps you out of
          trouble is to default to <code>const auto&amp;</code> for anything you are only reading,
          and write bare <code>auto</code> only when you actually want your own copy. That single
          habit fixes case 1 and case 3 at once.
        </p>
      </InfoBox>

      <h2><code>const</code> vs <code>constexpr</code> vs <code>consteval</code></h2>
      <p>
        These three are frequently explained as a spectrum of strictness. They are not. They answer
        two different questions, and conflating the questions is why the distinction feels slippery.
      </p>
      <ul>
        <li>
          <strong><code>const</code> is about writing.</strong> &quot;Nobody will modify this through
          this name.&quot; It says nothing at all about <em>when</em> the value comes into
          existence.
        </li>
        <li>
          <strong><code>constexpr</code> is about when.</strong> &quot;This is computable at compile
          time,&quot; which makes it usable where the language demands a constant — an array bound, a
          template argument, a <code>case</code> label.
        </li>
        <li>
          <strong><code>consteval</code> is <code>constexpr</code> with the escape hatch
          removed.</strong> A <code>constexpr</code> function <em>may</em> run at compile time and
          falls back to runtime; a <code>consteval</code> function <em>must</em>, and a runtime call
          is a compile error.
        </li>
      </ul>

      <FlowChart
        title="const, constexpr, consteval: two different questions"
        chart={
          'graph LR\n' +
          '  SRC["int n = f(x);"] --> D{"How is it declared?"}\n' +
          '  D -->|"int n"| M["mutable, runtime"]\n' +
          '  D -->|"const int n"| C["read-only, STILL RUNTIME<br/>const is about writes,<br/>not about when"]\n' +
          '  D -->|"constexpr int n"| CE["must be computable NOW,<br/>at compile time —<br/>or it is an error"]\n' +
          '  C --> CU["cannot be an array bound,<br/>a template argument,<br/>or a case label"]\n' +
          '  CE --> CA["CAN be an array bound,<br/>a template argument,<br/>a case label"]\n' +
          '  FD{"And the function f?"} --> FN["int f(int)<br/>runtime only"]\n' +
          '  FD --> FC["constexpr int f(int)<br/>MAY run at compile time;<br/>falls back to runtime"]\n' +
          '  FD --> FV["consteval int f(int)<br/>MUST run at compile time;<br/>a runtime call is an error"]\n' +
          '  style C fill:#3d2f14,stroke:#fb923c\n' +
          '  style CE fill:#1a3329,stroke:#4ade80\n' +
          '  style CU fill:#3b1a1a,stroke:#f87171\n' +
          '  style CA fill:#1a3329,stroke:#4ade80\n' +
          '  style FV fill:#2a1f44,stroke:#a78bfa'
        }
      />

      <CodeBlock language="cpp" title="cx.cpp — all five combinations that do work">
{`#include <print>
#include <array>

// const: "I will not modify this." Says nothing about WHEN it is computed.
int runtime_seed() { return 7; }

// constexpr function: MAY run at compile time; falls back to runtime if it must.
constexpr int square(int n) { return n * n; }

// consteval function: MUST run at compile time. Calling it at runtime is an error.
consteval int cube(int n) { return n * n * n; }

int main() {
    const int a = runtime_seed();        // const, but computed at RUNTIME
    constexpr int b = square(5);         // must be a compile-time constant: 25
    int c = square(runtime_seed());      // same function, runtime call: 49

    std::array<int, square(4)> arr{};    // constexpr used where a constant is required
    std::println("a={} b={} c={} arr.size()={}", a, b, c, arr.size());
    std::println("cube(3) = {}", cube(3));

    constexpr int d = cube(4);
    std::println("cube(4) = {}", d);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 cx.cpp && ./cx">
{`a=7 b=25 c=49 arr.size()=16
cube(3) = 27
cube(4) = 64`}
      </CodeBlock>

      <p>
        Note <code>square</code> being used twice, two different ways:{' '}
        <code>square(5)</code> and <code>square(4)</code> ran during compilation — the second one
        became an array bound, which is only possible for a compile-time value — while{' '}
        <code>square(runtime_seed())</code> compiled to an ordinary call. One function, both modes.
        That is what <code>constexpr</code> on a function actually grants: permission, not
        obligation.
      </p>
      <p>
        And here are the three mistakes, with the real diagnostics, because the error messages are
        the clearest explanation of the distinction anyone has written:
      </p>

      <CodeBlock language="cpp" title="cxbad.cpp — three things that must not compile">
{`#include <array>
int runtime_seed() { return 7; }
constexpr int square(int n) { return n * n; }
consteval int cube(int n) { return n * n * n; }

int main() {
    const int a = runtime_seed();
    std::array<int, a> arr1{};                 // (1) const is not constexpr
    constexpr int b = square(runtime_seed());  // (2) not a constant expression
    int n = runtime_seed();
    int c = cube(n);                           // (3) consteval, runtime value
    (void)arr1; (void)b; (void)c;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -c cxbad.cpp">
{`cxbad.cpp:8:21: error: non-type template argument is not a constant
      expression
    8 |     std::array<int, a> arr1{};            // (1) const is not constexpr
      |                     ^
cxbad.cpp:8:21: note: initializer of 'a' is not a constant expression
cxbad.cpp:7:15: note: declared here
    7 |     const int a = runtime_seed();
      |               ^
cxbad.cpp:9:19: error: constexpr variable 'b' must be initialized by a
      constant expression
    9 |     constexpr int b = square(runtime_seed());  // (2) not a consta...
      |                   ^   ~~~~~~~~~~~~~~~~~~~~~~
cxbad.cpp:9:30: note: non-constexpr function 'runtime_seed' cannot be used
      in a constant expression
cxbad.cpp:11:13: error: call to consteval function 'cube' is not a
      constant expression
   11 |     int c = cube(n);                      // (3) consteval called ...
      |             ^
cxbad.cpp:11:18: note: read of non-const variable 'n' is not allowed in a
      constant expression`}
      </CodeBlock>

      <p>
        &quot;Initializer of <code>a</code> is not a constant expression&quot; is the whole lesson in
        one line. <code>a</code> is <code>const</code>, so you cannot write to it, and it is{' '}
        <em>also</em> the result of a runtime function call, so the compiler does not know its value
        and cannot use it as an array bound. <code>const</code> and <code>constexpr</code> are
        orthogonal.
      </p>

      <InfoBox variant="info" title="How this maps to what you know">
        <p>
          <code>const</code> is roughly Java&apos;s <code>final</code> on a local or field — a
          write restriction, enforced at compile time, saying nothing about timing.{' '}
          <code>constexpr</code> is closer to a Java <code>static final int</code> that the compiler
          inlines as a constant, except vastly more powerful: a <code>constexpr</code> function can
          run loops, allocate (since C++20), and build whole data structures during compilation. And{' '}
          <code>consteval</code> has no Java equivalent at all — it is the closest thing C++ has to
          an annotation processor that runs real code in the language itself.
        </p>
        <p>
          A note on <code>const</code> that trips up everybody: on a pointer, the{' '}
          <em>position</em> of <code>const</code> changes its meaning entirely.{' '}
          <code>const T*</code> and <code>T* const</code> are different types.{' '}
          <a href="/cpp/references">Values, References &amp; Pointers</a> takes that apart in full,
          with every position enumerated.
        </p>
      </InfoBox>

      <h2>Uniform Initialisation And The Narrowing It Rejects</h2>
      <p>
        C++11 added braced initialisation, and the headline reason to prefer it is not consistency —
        it is that <strong>braces refuse to lose data silently.</strong> Parentheses and{' '}
        <code>=</code> truncate without comment; braces are a compile error.
      </p>

      <CodeBlock language="cpp" title="init.cpp — the old forms, which are silent">
{`#include <print>
#include <vector>

struct P { int x; int y; };

int main() {
    double d = 3.9;

    int paren(d);        // 3
    int assign = d;      // 3
    std::println("int paren(3.9)  = {}", paren);
    std::println("int assign= 3.9 = {}", assign);

    int braced{3};
    std::println("int braced{{3}}   = {}", braced);

    std::vector<int> a(5, 7);   // five elements, each 7
    std::vector<int> b{5, 7};   // TWO elements: 5 and 7
    std::println("vector(5,7).size() = {}, vector{{5,7}}.size() = {}", a.size(), b.size());

    P p1{1, 2};
    P p2{};             // both members zeroed
    int z{};            // 0, guaranteed — bare \`int z;\` is indeterminate
    std::println("p1={{{},{}}} p2={{{},{}}} z={}", p1.x, p1.y, p2.x, p2.y, z);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 init.cpp && ./init">
{`int paren(3.9)  = 3
int assign= 3.9 = 3
int braced{3}   = 3
vector(5,7).size() = 5, vector{5,7}.size() = 2
p1={1,2} p2={0,0} z=0`}
      </CodeBlock>

      <p>
        Both silent truncations happened with <strong>zero diagnostics</strong> under{' '}
        <code>-Wall -Wextra</code> — verified by compiling that file again with those flags and{' '}
        <code>-c</code>, which produced no output whatsoever. (Adding{' '}
        <code>-Wconversion</code> does catch both, as{' '}
        <code>warning: implicit conversion turns floating-point number into integer</code>.) Now the
        braced versions:
      </p>

      <CodeBlock language="cpp" title="narrow.cpp">
{`#include <cstdint>
int main() {
    double d = 3.9;
    int   a{d};             // (1) double -> int
    int   b{3.9};           // (2) double literal -> int
    long  big = 1'000'000;
    short c{big};           // (3) long -> short
    std::uint8_t e{300};    // (4) literal does not fit
    char  f{65};            // (5) FITS, so this one is fine
    (void)a;(void)b;(void)c;(void)e;(void)f;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -c narrow.cpp (abridged; 4 errors, 2 warnings)">
{`narrow.cpp:4:13: error: type 'double' cannot be narrowed to 'int' in
      initializer list [-Wc++11-narrowing]
    4 |     int   a{d};             // (1) double -> int
      |             ^
narrow.cpp:4:13: note: insert an explicit cast to silence this issue
    4 |     int   a{d};             // (1) double -> int
      |             ^
      |             static_cast<int>( )
narrow.cpp:7:13: error: non-constant-expression cannot be narrowed from
      type 'long' to 'short' in initializer list [-Wc++11-narrowing]
    7 |     short c{big};           // (3) long -> short
      |             ^~~
narrow.cpp:8:20: error: constant expression evaluates to 300 which cannot
      be narrowed to type 'std::uint8_t' (aka 'unsigned char')
      [-Wc++11-narrowing]
    8 |     std::uint8_t e{300};    // (4) literal does not fit
      |                    ^~~

(line 9 -- char f{65} -- produces no diagnostic: 65 fits in a char, so it
 is not a narrowing conversion. Verified: zero messages mention line 9.)`}
      </CodeBlock>

      <p>
        Four errors where the old spellings gave you four silent truncations. Note how precise case
        4 is — &quot;constant expression evaluates to 300 which cannot be narrowed&quot; — and that
        case 5 is accepted, because <code>65</code> provably fits.
      </p>
      <p>
        The rule is <strong>value-based for constants and type-based otherwise</strong>, and case 3
        shows the difference. <code>short c{'{'}big{'}'}</code> is rejected with &quot;non-constant
        expression cannot be narrowed,&quot; and the compiler never even looks at the value:{' '}
        <code>big</code> is a non-<code>const</code> <code>long</code>, so the conversion is a
        narrowing on type alone. Had it been written <code>const long big = 1'000'000</code>, the
        compiler would have evaluated it and rejected it for the other reason — 1,000,000 does not
        fit in a 16-bit <code>short</code>. Either way it is an error, which is the point; the
        parenthesised spelling would have silently handed you <code>16960</code>.
      </p>

      <InfoBox variant="warning" title="Braces have two real gotchas, so this is not a blanket rule">
        <p>
          <strong>1. <code>vector{'{'}5, 7{'}'}</code> is not <code>vector(5, 7)</code>.</strong> The
          output above shows it: parentheses mean &quot;five elements of value 7&quot; and braces
          mean &quot;the two elements 5 and 7.&quot; Braces prefer an{' '}
          <code>initializer_list</code> constructor over everything else, aggressively. For
          containers where you mean a <em>size</em>, use parentheses.
        </p>
        <p>
          <strong>2. <code>auto x{'{'}1{'}'}</code> used to be a surprise.</strong> In C++11/14 it
          deduced <code>std::initializer_list&lt;int&gt;</code>. C++17 fixed the single-element case
          to deduce <code>int</code>, which is what this section&apos;s compiler does. Old advice
          about this is stale, but you will still read it.
        </p>
        <p>
          The practical rule: <strong>braces by default, parentheses when you are passing
          constructor arguments that are not elements</strong> — sizes, capacities, counts.
        </p>
      </InfoBox>

      <h2>Three Things Called &quot;A String&quot;</h2>
      <p>
        Java has <code>String</code> and <code>CharSequence</code> and you can mostly ignore the
        difference. C++ has three types in daily use, they are not interchangeable, and choosing
        wrongly either allocates when it should not or dangles when it should not.
      </p>

      <FlowChart
        title="const char*, std::string, std::string_view — who owns the bytes?"
        chart={
          'graph TD\n' +
          '  subgraph CS["const char* — 8 bytes"]\n' +
          '    C1["just an address"] --> C2["bytes live... somewhere.<br/>Length is not stored:<br/>strlen walks to the NUL"]\n' +
          '    C2 --> C3["owns nothing.<br/>Cheap, and tells you nothing."]\n' +
          '  end\n' +
          '  subgraph SS["std::string — 24 bytes here"]\n' +
          '    S1["ptr + size + capacity"] --> S2{"longer than<br/>the SSO buffer?"}\n' +
          '    S2 -->|no| S3["bytes live INSIDE the object.<br/>No allocation."]\n' +
          '    S2 -->|yes| S4["bytes live on the heap.<br/>One allocation, freed by ~string"]\n' +
          '    S4 --> S5["OWNS its bytes.<br/>Copying copies them."]\n' +
          '  end\n' +
          '  subgraph SV["std::string_view — 16 bytes here"]\n' +
          '    V1["ptr + size"] --> V2["points at somebody else\'s bytes"]\n' +
          '    V2 --> V3["owns nothing, allocates never,<br/>knows its length,<br/>NOT guaranteed NUL-terminated"]\n' +
          '    V3 --> V4["DANGER: outliving the owner<br/>is a dangling view"]\n' +
          '  end\n' +
          '  style C3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style S5 fill:#1a3329,stroke:#4ade80\n' +
          '  style V3 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style V4 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <CodeBlock language="cpp" title="str.cpp">
{`#include <print>
#include <string>
#include <string_view>
#include <cstring>

std::size_t by_cstr(const char* s)          { return std::strlen(s); }
std::size_t by_string(const std::string& s) { return s.size(); }
std::size_t by_view(std::string_view s)     { return s.size(); }

int main() {
    std::println("sizeof(const char*)      = {}", sizeof(const char*));
    std::println("sizeof(std::string)      = {}", sizeof(std::string));
    std::println("sizeof(std::string_view) = {}", sizeof(std::string_view));

    // string_view does NOT own and is NOT guaranteed NUL-terminated.
    std::string owner = "hello world";
    std::string_view part = std::string_view(owner).substr(0, 5);
    std::println("part        = '{}'  size = {}", part, part.size());
    std::println("part.data() = '{}'  <- reads PAST the view", part.data());

    // Small-string optimisation: short strings do not touch the heap.
    std::string shortish = "abc";
    std::string longish  = "abcdefghijklmnopqrstuvwxyz0123456789";
    std::println("'abc' data() inside the object? {}",
                 (const void*)shortish.data() >= (const void*)&shortish &&
                 (const void*)shortish.data() <  (const void*)(&shortish + 1));
    std::println("long  data() inside the object? {}",
                 (const void*)longish.data() >= (const void*)&longish &&
                 (const void*)longish.data() <  (const void*)(&longish + 1));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 str.cpp && ./str">
{`sizeof(const char*)      = 8
sizeof(std::string)      = 24
sizeof(std::string_view) = 16
part        = 'hello'  size = 5
part.data() = 'hello world'  <- reads PAST the view
'abc' data() inside the object? true
long  data() inside the object? false`}
      </CodeBlock>

      <p>
        Look at the fourth line. <code>part</code> is a five-character view, and{' '}
        <code>part.size()</code> correctly says 5, but <code>part.data()</code> printed{' '}
        <strong><code>hello world</code></strong> — eleven characters. That is not a bug in the
        example; it is the defining property of a view. <code>data()</code> hands you a{' '}
        <code>const char*</code> to the start of the view, and <code>std::println</code>{' '}
        formatting a <code>const char*</code> reads until it finds a NUL — which is five characters
        further on, in the owner&apos;s buffer.
      </p>
      <p>
        <strong>A <code>string_view</code> is a pointer and a length, with no NUL at the end.</strong>{' '}
        Never pass <code>sv.data()</code> to a C API. Use <code>std::string(sv).c_str()</code>, which
        allocates and is honest about it.
      </p>
      <p>
        The last two lines are the small-string optimisation, shown by checking whether the character
        buffer&apos;s address falls inside the <code>std::string</code> object itself. For{' '}
        <code>&quot;abc&quot;</code> it does — zero heap allocations. For the 36-character string it
        does not. This is the mechanism <a href="/cpp/intro">the intro lesson</a> worked around when
        it deliberately used long names to force a real allocation.
      </p>

      <h3>The parameter choice, measured</h3>
      <p>
        The practical consequence of all this is which type to put in a function signature. That
        choice has a measurable cost, so here it is measured — by replacing global{' '}
        <code>operator new</code> with a counting version, which is the only way to know for certain
        rather than by reasoning:
      </p>

      <CodeBlock language="cpp" title="alloc.cpp — counting allocations instead of guessing">
{`#include <print>
#include <string>
#include <string_view>
#include <cstdlib>
#include <new>

static long allocs = 0;
void* operator new(std::size_t n) { ++allocs; return std::malloc(n); }
void  operator delete(void* p) noexcept { std::free(p); }
void  operator delete(void* p, std::size_t) noexcept { std::free(p); }

std::size_t by_string(const std::string& s) { return s.size(); }
std::size_t by_view(std::string_view s)     { return s.size(); }

int main() {
    const char* lit = "a-name-too-long-for-the-small-string-optimisation";

    allocs = 0;
    for (int i = 0; i < 1000; ++i) by_string(lit);
    std::println("1000 calls to by_string(const char*) : {} heap allocations", allocs);

    allocs = 0;
    for (int i = 0; i < 1000; ++i) by_view(lit);
    std::println("1000 calls to by_view(const char*)   : {} heap allocations", allocs);

    const char* small = "abc";
    allocs = 0; for (int i = 0; i < 1000; ++i) by_string(small);
    std::println("1000 calls to by_string(\\"abc\\")       : {} heap allocations", allocs);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — identical at -O2 and -O0, so this is not an optimiser artefact">
{`1000 calls to by_string(const char*) : 1000 heap allocations
1000 calls to by_view(const char*)   : 0 heap allocations
1000 calls to by_string("abc")       : 0 heap allocations`}
      </CodeBlock>

      <p>
        <strong>One thousand allocations versus zero.</strong> Every call to the{' '}
        <code>const std::string&amp;</code> overload with a <code>const char*</code> argument
        constructs a temporary <code>std::string</code>, which allocates, copies the bytes, and
        frees them again — purely to satisfy the parameter type. The <code>string_view</code>{' '}
        version just wraps the pointer and the length.
      </p>
      <p>
        The third line is the honest caveat: with a short literal, the small-string optimisation
        means <code>const std::string&amp;</code> costs nothing either. So this is not a
        &quot;string is slow&quot; result; it is a &quot;string allocates when the string is long
        enough and you did not need it to&quot; result.
      </p>

      <FlowChart
        title="Choosing the parameter type"
        chart={
          'graph TD\n' +
          '  Q["My function takes \'a string\'.<br/>What should the parameter be?"] --> A{"Do I need to keep it<br/>after the call returns?"}\n' +
          '  A -->|"no — just read it"| V["std::string_view<br/>accepts string, const char*,<br/>and literals with zero allocation"]\n' +
          '  A -->|"yes — store a copy"| B{"Will I move it<br/>into the member?"}\n' +
          '  B -->|yes| BV["std::string by value,<br/>then std::move it in"]\n' +
          '  B -->|no| BC["const std::string&amp;<br/>then copy"]\n' +
          '  V --> VN{"Do I call a C API<br/>that needs a NUL?"}\n' +
          '  VN -->|yes| VC["const std::string&amp;<br/>— string_view has no NUL promise"]\n' +
          '  VN -->|no| VOK["string_view is right"]\n' +
          '  style VOK fill:#1a3329,stroke:#4ade80\n' +
          '  style BV fill:#1a3329,stroke:#4ade80\n' +
          '  style VC fill:#3d2f14,stroke:#fb923c'
        }
      />

      <InfoBox variant="danger" title="The string_view trap, stated once so you recognise it later">
        <p>
          A <code>string_view</code> does not keep its bytes alive. These two lines are both
          dangling views, and neither is a compile error:
        </p>
        <CodeBlock language="cpp" title="Both of these are use-after-free">
{`std::string_view bad1 = std::string("built here");   // temporary dies at the ;
std::string_view bad2 = get_name() + "-suffix";      // same, via a temporary`}
        </CodeBlock>
        <p>
          Returning a <code>string_view</code> from a function that built the string locally is the
          same bug with a longer fuse. The rule is: <strong>a view is for the duration of a call,
          not for storage.</strong> If you need to hold onto it, hold a{' '}
          <code>std::string</code>. The general form of this hazard — a reference outliving what it
          refers to — is <a href="/cpp/references">the last lesson in this phase</a>, and the
          lambda-shaped version of it is in <a href="/cpp/functions">the next one</a>.
        </p>
      </InfoBox>

      <h2>Structured Bindings</h2>
      <p>
        C++17 added destructuring, and it covers structs, tuples, pairs and arrays. If you reach for
        it from JavaScript muscle memory, note two differences: it is{' '}
        <strong>positional, not by name</strong> (there is no{' '}
        <code>const {'{'} x, y {'}'} = p</code>), and it is a declaration, so every name is new.
      </p>

      <CodeBlock language="cpp" title="sb.cpp">
{`#include <print>
#include <map>
#include <string>
#include <tuple>
#include <array>

struct Point { int x; int y; };
std::tuple<bool, int, std::string> parse() { return {true, 8080, "ok"}; }

int main() {
    Point p{3, 4};
    auto [px, py] = p;                            // from a struct
    std::println("px={} py={}", px, py);

    auto [ok, port, msg] = parse();               // from a tuple
    std::println("ok={} port={} msg={}", ok, port, msg);

    std::array<int, 3> arr{1, 2, 3};              // from an array
    auto [a, b, c] = arr;
    std::println("a={} b={} c={}", a, b, c);

    auto& [rx, ry] = p;                           // by reference: mutate through it
    rx = 99;
    std::println("after rx=99, p.x={}", p.x);

    std::map<std::string, int> ages{{"ada", 36}, {"alan", 41}};
    for (const auto& [name, age] : ages) std::println("  {} is {}", name, age);

    // insert() returns a pair whose .second nobody remembers.
    if (auto [it, inserted] = ages.insert({"grace", 45}); inserted) {
        std::println("inserted {} -> {}", it->first, it->second);
    }
    if (auto [it, inserted] = ages.insert({"grace", 99}); !inserted) {
        std::println("already present: {} -> {}", it->first, it->second);
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sb.cpp && ./sb">
{`px=3 py=4
ok=true port=8080 msg=ok
a=1 b=2 c=3
after rx=99, p.x=99
  ada is 36
  alan is 41
inserted grace -> 45
already present: grace -> 45`}
      </CodeBlock>

      <p>
        Two of those are the ones you will use constantly.{' '}
        <code>for (const auto&amp; [name, age] : map)</code> replaces{' '}
        <code>it-&gt;first</code> and <code>it-&gt;second</code>, which are among the least readable
        names in the standard library. And the <code>insert</code> pattern replaces the perennial{' '}
        &quot;what is <code>.second</code> again&quot; — it is whether the insert happened, and now
        you can call it <code>inserted</code>.
      </p>
      <p>
        Note the <code>const auto&amp;</code> in the loop and the plain <code>auto&amp;</code> in the
        mutation case. The <code>auto</code> rules from earlier apply unchanged:{' '}
        <code>auto [a, b] = thing</code> copies the whole <code>thing</code> first and then binds to
        the copy. For a map entry with a <code>std::string</code> key, that is an allocation per
        iteration you did not ask for.
      </p>

      <h2><code>enum class</code> vs Plain <code>enum</code></h2>
      <p>
        Java enums are real classes with real types. C++ has two kinds: the inherited C one, which
        is barely a type at all, and the C++11 one, which behaves the way you expect.
      </p>

      <CodeBlock language="cpp" title="en.cpp">
{`#include <print>
#include <cstdint>

enum Colour { Red, Green, Blue };                    // plain: leaks its names
enum Status { Ok, Error };                           // ...and collides

enum class Level : std::uint8_t { Low, Mid, High };
enum class Mode  : std::uint8_t { Low, Mid, High };   // same names, no collision

int main() {
    int n = Green;
    std::println("Green as int          = {}", n);
    std::println("Red == Ok             = {}", Red == Ok);    // compiles! both are 0
    std::println("Blue * 10             = {}", Blue * 10);

    Level l = Level::Mid;
    std::println("Level::Mid            = {}", static_cast<int>(l));
    std::println("sizeof(Colour)        = {}", sizeof(Colour));
    std::println("sizeof(Level)         = {}", sizeof(Level));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 en.cpp && ./en">
{`en.cpp:14:52: warning: comparison of different enumeration types ('Colour' and 'Status') is deprecated [-Wdeprecated-enum-compare]
   14 |     std::println("Red == Ok             = {}", Red == Ok);
      |                                                ~~~ ^  ~~
1 warning generated.

Green as int          = 1
Red == Ok             = true
Blue * 10             = 20
Level::Mid            = 1
sizeof(Colour)        = 4
sizeof(Level)         = 1`}
      </CodeBlock>

      <p>
        <code>Red == Ok</code> is <code>true</code>. Those are values of two unrelated enumerations,
        comparing equal because both decay to the integer 0. Clang deprecation-warns, which is a
        2026 courtesy, not a guarantee; the comparison still compiles and the program still runs.{' '}
        <code>Blue * 10</code> is arithmetic on an enumerator, also fine. This is why plain{' '}
        <code>enum</code> is described as &quot;not really a type.&quot;
      </p>
      <p>
        <code>enum class</code> fixes all of it, and the error messages are blunt about it:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -c enbad.cpp (four errors, trimmed to the first line of each)">
{`enbad.cpp:5:9:  error: cannot initialize a variable of type 'int' with an ...
                        // int n = Level::Mid;         -- no implicit conversion TO int
enbad.cpp:6:26: error: invalid operands to binary expression
                        // Level::Low == Mode::Low     -- different types
enbad.cpp:7:11: error: cannot initialize a variable of type 'Level' with ...
                        // Level l = 1;                -- no implicit conversion FROM int
enbad.cpp:8:14: error: use of undeclared identifier 'Low'
                        // auto x = Low;               -- names are scoped`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}><code>enum Colour</code></th>
            <th style={headStyle}><code>enum class Level</code></th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Enumerator names</td>
            <td style={cellStyle}>leak into the enclosing scope — <code>Red</code></td>
            <td style={cellStyle}>scoped — <code>Level::Low</code> only</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Converts to <code>int</code> implicitly</td>
            <td style={cellStyle}>yes, so arithmetic silently works</td>
            <td style={cellStyle}>no, needs <code>static_cast</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Comparable with another enum</td>
            <td style={cellStyle}>yes (deprecated, still compiles)</td>
            <td style={cellStyle}>no — type error</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Underlying type</td>
            <td style={cellStyle}>implementation-chosen — 4 bytes here</td>
            <td style={cellStyle}>yours to pick: <code>: std::uint8_t</code> gave 1 byte</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Can be forward-declared</td>
            <td style={cellStyle}>only with an explicit underlying type</td>
            <td style={cellStyle}>yes — defaults to <code>int</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Use it when</td>
            <td style={cellStyle}>interoperating with a C API that wants the integers</td>
            <td style={cellStyle}><strong>always, otherwise</strong></td>
          </tr>
        </tbody>
      </table>

      <h2>Control Flow Worth Noting</h2>
      <p>
        Almost all of C++ control flow is what you expect. Four things are not.
      </p>

      <CodeBlock language="cpp" title="cf.cpp">
{`#include <print>
#include <map>
#include <string>

enum class Op { Add, Sub, Log, Quit };

int apply(Op op, int a, int b) {
    int result = 0;
    switch (op) {
        case Op::Log:
            std::println("  (logging)");
            [[fallthrough]];              // C++17: "yes, I meant this"
        case Op::Add:
            result = a + b;
            break;
        case Op::Sub:
            result = a - b;
            break;
        case Op::Quit:
            result = -1;
            break;
    }
    return result;
}

int main() {
    std::map<std::string, int> ports{{"http", 80}, {"https", 443}};

    // if with initialiser (C++17): the found iterator is scoped to the if.
    if (auto it = ports.find("https"); it != ports.end()) {
        std::println("https -> {}", it->second);
    } else {
        std::println("https not found");
    }
    // \`it\` does not exist out here.

    // switch with initialiser works too.
    switch (int n = ports.size(); n) {
        case 0:  std::println("empty");            break;
        case 2:  std::println("two entries");      break;
        default: std::println("{} entries", n);    break;
    }

    std::println("Add  -> {}", apply(Op::Add, 10, 3));
    std::println("Sub  -> {}", apply(Op::Sub, 10, 3));
    std::println("Log  -> {}", apply(Op::Log, 10, 3));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -Wimplicit-fallthrough -O2 cf.cpp && ./cf">
{`https -> 443
two entries
Add  -> 13
Sub  -> 7
  (logging)
Log  -> 13`}
      </CodeBlock>

      <h3>1. <code>if</code> and <code>switch</code> with an initialiser</h3>
      <p>
        <code>if (auto it = m.find(k); it != m.end())</code> declares <code>it</code>, scoped to the{' '}
        <code>if</code> and its <code>else</code>, and gone afterwards. This is the C++17 replacement
        for the pattern where you hoisted a variable to an outer scope purely so the condition could
        see it, and then it hung around polluting the rest of the function. Use it for every{' '}
        <code>find</code>, every <code>insert</code>, every lock attempt.
      </p>

      <h3>2. <code>switch</code> fall-through is implicit, and <code>-Wall</code> misses it</h3>
      <p>
        A <code>case</code> without <code>break</code> falls into the next one. That is inherited
        from C and it is not changing. C++17 added <code>[[fallthrough]];</code> so you can
        distinguish &quot;deliberate&quot; from &quot;forgot,&quot; and the compiler will diagnose
        the undeclared kind — but only if you ask:
      </p>

      <CodeBlock language="text" title="Real output — the same file with the [[fallthrough]] removed">
{`$ clang++ -std=c++23 -Wall -Wextra -c cf2.cpp -o /dev/null
(no output — zero warnings)

$ clang++ -std=c++23 -Wall -Wextra -Wimplicit-fallthrough -c cf2.cpp -o /dev/null
cf2.cpp:13:9: warning: unannotated fall-through between switch labels
      [-Wimplicit-fallthrough]
   13 |         case Op::Add:
      |         ^
cf2.cpp:13:9: note: insert '[[fallthrough]];' to silence this warning
   13 |         case Op::Add:
      |         ^
      |         [[fallthrough]];`}
      </CodeBlock>

      <p>
        <strong><code>-Wimplicit-fallthrough</code> is not in <code>-Wall -Wextra</code></strong> on
        this compiler — verified above, zero warnings without it. Add it to your build today; it is
        pure upside.
      </p>
      <p>
        One related warning you <em>do</em> get for free is exhaustiveness. Omit an enumerator from a{' '}
        <code>switch</code> over an <code>enum class</code> with no <code>default</code>, and{' '}
        <code>-Wall</code> says so:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -c sw2.cpp">
{`sw2.cpp:3:13: warning: enumeration values 'Log' and 'Quit' not handled in
      switch [-Wswitch]
    3 |     switch (op) {
      |             ^~`}
      </CodeBlock>

      <p>
        This is the closest C++ gets to Java&apos;s exhaustive <code>switch</code> on a sealed type.
        It only works if you <em>omit</em> the <code>default</code> label — adding{' '}
        <code>default:</code> silences it forever, which is the usual reason people never see it.
      </p>

      <h3>3. Range-for, and the temporary it used to not keep alive</h3>
      <p>
        <code>for (const auto&amp; x : container)</code> is the loop you should write by default; it
        works on anything with <code>begin()</code> and <code>end()</code>, including raw arrays,
        which ordinary index loops get wrong. The subtlety is lifetime.
      </p>
      <p>
        The range expression can produce a temporary, and before C++23 only the{' '}
        <em>outermost</em> temporary was kept alive for the loop. So{' '}
        <code>for (int x : make_box())</code> was fine but{' '}
        <code>for (int x : make_box().data)</code> was a use-after-free, because the{' '}
        <code>Box</code> died at the end of the range-initialiser and the loop then walked its
        freed vector. C++23&apos;s P2718R0 extended the lifetime of <em>all</em> temporaries in the
        range expression to the whole loop, fixing it.
      </p>

      <InfoBox variant="warning" title="A verification that did not go the way I expected">
        <p>
          The plan here was to show that pattern faulting under{' '}
          <code>-fsanitize=address</code> at <code>-std=c++20</code> and being clean at{' '}
          <code>-std=c++23</code>. <strong>It did not fault.</strong> On this toolchain the
          temporary survives the loop at every standard level tested:
        </p>
        <CodeBlock language="text" title="Real output — for (int x : make_box().data), with a destructor that announces itself">
{`$ clang++ -std=c++17 -O1 -fsanitize=address,undefined rf4.cpp -o q && ./q
before loop
  iteration, x = 1
  iteration, x = 2
  iteration, x = 3
  Box destroyed
after loop

(identical output at -std=c++20 and -std=c++23. The destructor runs AFTER the
 loop in all three, and ASan+UBSan report nothing.)`}
        </CodeBlock>
        <p>
          Meanwhile the feature-test macro says the language rule really did change —{' '}
          <code>__cpp_range_based_for</code> is <code>201603</code> at{' '}
          <code>-std=c++17</code> and <code>-std=c++20</code>, and <code>202211</code> at{' '}
          <code>-std=c++23</code> and <code>-std=c++26</code>, which is P2718R0&apos;s value.
        </p>
        <p>
          So the correct statement is: <strong>pre-C++23 that code is undefined behaviour, and this
          particular implementation happens to do the safe thing anyway.</strong> Which is worse
          than a crash, not better. A pattern that works on your compiler and is UB by the standard
          is the exact category <a href="/cpp/intro">the intro lesson</a> warned about — it will
          keep working right up until you change compiler, platform or optimiser, and then it will
          stop, and nothing will have changed in your source. Compile at{' '}
          <code>-std=c++23</code> and the question disappears.
        </p>
      </InfoBox>

      <h3>4. There is no <code>for ... else</code>, and no labelled break</h3>
      <p>
        Worth saying because Java has labelled <code>break</code> and people reach for it. C++ does
        not. The options for leaving a nested loop are a flag, a <code>goto</code> (genuinely the
        least-bad choice occasionally, and a style-guide fight you do not want), or — much better —
        extracting the loop into a function and using <code>return</code>. The last one is almost
        always right and usually improves the code anyway.
      </p>

      <h2>The Residue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Instinct from Java/JS</th>
            <th style={headStyle}>What is actually true</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;An <code>int</code> is 32 bits&quot;</td>
            <td style={cellStyle}>32 on every target tested here, but the standard says 16 minimum;{' '}
              <code>long</code> genuinely varies. <code>static_assert</code> your assumptions.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Comparing numbers works&quot;</td>
            <td style={cellStyle}><code>-1 &lt; 1u</code> is <code>false</code>. Use{' '}
              <code>std::ssize</code> and <code>std::cmp_less</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>var</code> is free&quot;</td>
            <td style={cellStyle}><code>auto</code> strips <code>const</code> and{' '}
              <code>&amp;</code>, so it can copy. Default to <code>const auto&amp;</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>final</code> means constant&quot;</td>
            <td style={cellStyle}><code>const</code> is about writes; <code>constexpr</code> is
              about when. Orthogonal.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A string is a string&quot;</td>
            <td style={cellStyle}>Three types.{' '}
              <code>string_view</code> for parameters, <code>string</code> for storage, and never
              pass <code>sv.data()</code> to C.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Enums are types&quot;</td>
            <td style={cellStyle}>Plain <code>enum</code> is not. Use{' '}
              <code>enum class</code> everywhere.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-Wall -Wextra</code> is thorough&quot;</td>
            <td style={cellStyle}>It missed five of the six integer surprises and the
              fall-through. Add <code>-Wconversion -Wsign-conversion</code>{' '}
              <code>-Wimplicit-fallthrough</code>{' '}
              <code>-Wtautological-unsigned-zero-compare</code>.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="Before you move on">
        <p>
          The through-line of this lesson is that C++ has a large category of mistakes that are
          neither compile errors nor runtime exceptions — they are correct-looking code computing a
          wrong number. <code>-1 &lt; 1u</code>, <code>v.size() - 5</code>, a{' '}
          <code>uint8_t</code> sum that wrapped, an <code>auto</code> that copied a config object
          on every call. None of those will ever stop your program. They will just make it wrong.
        </p>
        <p>
          Your defences are not vigilance, which does not scale. They are: warning flags beyond{' '}
          <code>-Wall</code>, <code>static_assert</code> for every size assumption, braces instead
          of parentheses so narrowing is an error, and <code>const auto&amp;</code> as the default
          for anything you are only reading.
        </p>
        <p>
          <a href="/cpp/functions">Next: Functions, Overloading &amp; Lambdas</a> — which takes that
          last point, &quot;did that copy?&quot;, and turns it into the main question. Parameter
          passing is where value semantics stops being a curiosity and starts determining
          performance, and it is the immediate setup for the memory phase.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Types;
