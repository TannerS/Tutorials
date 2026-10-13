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

function Concepts() {
  return (
    <LessonLayout
      title="Concepts & Compile-Time Constraints"
      sectionId="cpp"
      lessonIndex={13}
      prev={{ path: '/cpp/templates', label: 'Templates & Generic Programming' }}
      next={{ path: '/cpp/containers', label: 'STL Containers & Iterator Invalidation' }}
    >
      <p>
        <a href="/cpp/templates">The last lesson</a> ended on a measurement. A twelve-line file
        with one missing <code>operator&lt;</code> produced 304 lines and 34,331 bytes of
        diagnostics from <code>std::sort</code>, and 34 lines from{' '}
        <code>std::ranges::sort</code> — the same algorithm with its requirements written down. This
        lesson is about writing them down on <em>your</em> templates, and the measurement repeats
        almost exactly: <strong>357 lines becomes 19, twenty errors become one, and fifty-five
        instantiation frames become zero.</strong>
      </p>
      <p>
        That is the whole argument, and it is worth being precise about <em>why</em> it works,
        because &quot;better error messages&quot; undersells it. A concept does not reformat the
        error. It moves the <em>decision</em>:
      </p>
      <ul>
        <li>
          <strong>Unconstrained:</strong> the compiler accepts your call, substitutes the type,
          instantiates the body, instantiates everything the body calls, and eventually reaches a
          line — eight frames deep inside libc++ — that will not compile. It reports the failure{' '}
          <em>there</em>, then unwinds an instantiation stack back to you, then does it again for
          every other internal helper that hit the same wall.
        </li>
        <li>
          <strong>Constrained:</strong> the compiler evaluates the requirement <em>before
          substituting anything</em>. Your function is simply not a candidate. The error is{' '}
          &quot;no matching function for call&quot; at your line, followed by a chain of{' '}
          <code>because X is not satisfied</code> narrowing to the root cause. Nothing is ever
          instantiated, so there is nothing to report from inside.
        </li>
      </ul>
      <p>
        Concepts also do three other things that are easy to miss: they are the{' '}
        <strong>documentation</strong> of a template&apos;s requirements, in a form the compiler
        checks; they participate in <strong>overload resolution</strong>, so a more constrained
        overload beats a less constrained one without any hand-written mutual exclusion; and they
        replace the <code>std::enable_if</code>/SFINAE machinery you will meet in every codebase
        written before 2021. All three are measured below.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++, <code>-std=c++23</code>. Every error
          message, byte count, line count and trait value on this page was captured from a real
          compile on this machine.
        </p>
        <p>
          Concepts are C++20, and that was worth checking rather than asserting. Every{' '}
          <em>language</em> feature on this page — all four requirement kinds, all five constraint
          syntaxes, subsumption, <code>range_value_t</code> with a <code>requires</code> clause —
          was recompiled at <code>-std=c++20</code> with <code>-Wall -Wextra</code> and produced
          no diagnostics. Three things here genuinely need C++23, and all three are incidental to
          the subject: <code>std::println</code> (used for every output block in the section),{' '}
          <code>std::ranges::to</code> (in the closing example), and{' '}
          <code>if consteval</code>, which reports{' '}
          <code>warning: consteval if is a C++23 extension [-Wc++23-extensions]</code> at{' '}
          <code>-std=c++20</code>.
        </p>
        <p>
          Three results on this page are not what the lesson set out to claim.{' '}
          <code>std::enable_if</code>&apos;s error messages turned out to be <em>reasonable</em> for
          the simple case, so the argument against it had to be rebuilt around overload resolution
          rather than diagnostics. A <code>requires</code>-expression on a concrete type turned out
          to be a hard error rather than <code>false</code>. And a nested requirement written as{' '}
          <code>sizeof(key_type) &lt;= 8</code> was supposed to fail for{' '}
          <code>long double</code> and did not, because{' '}
          <code>sizeof(long double) == 8</code> on this target. All three are written up as
          measured.
        </p>
      </InfoBox>

      <h2>The Centrepiece: The Same Mistake, Twice</h2>
      <p>
        Here is a utility of the kind that exists in every codebase — take a vector, sort it, return
        the middle value as a <code>double</code>. It works. It says nothing about what{' '}
        <code>T</code> has to be.
      </p>

      <CodeBlock language="cpp" title="median_un.h — unconstrained">
{`#pragma once
#include <algorithm>
#include <vector>

// UNCONSTRAINED. Says nothing about what T must support.
template <class T>
double median_of(std::vector<T> xs) {
    std::sort(xs.begin(), xs.end());
    return static_cast<double>(xs[xs.size() / 2]);
}`}
      </CodeBlock>

      <CodeBlock language="cpp" title="use_un.cpp — the caller, and the mistake">
{`#include <print>
#include <string>
#include <vector>
#include "median_un.h"

struct Reading {            // no operator<, not convertible to double
    double value;
    std::string sensor;
};

int main() {
    std::vector<Reading> rs{{21.5, "a"}, {19.0, "b"}, {20.25, "c"}};
    std::println("median = {}", median_of(rs));
}`}
      </CodeBlock>

      <p>
        The mistake is a sensible one: somebody passed the whole <code>Reading</code> instead of
        pulling out <code>.value</code>. Here is what the compiler says, measured:
      </p>

      <CodeBlock language="text" title="Real measurements — clang++ -std=c++23 -fsyntax-only use_un.cpp">
{`$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | wc -l
357

$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | wc -c
37738

$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | grep -c "error:"
20

$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | grep -c "in instantiation of"
55

$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | grep -n "^use_un.cpp" | head -1
60:use_un.cpp:13:33: note: in instantiation of function template specialization`}
      </CodeBlock>

      <p>
        <strong>357 lines. 37,738 bytes. Twenty errors. Fifty-five instantiation frames. And the
        first mention of your own file is at output line 60, as a <code>note:</code>.</strong>
      </p>

      <CodeBlock language="text" title="Real output — the first 20 of those 357 lines (libc++ paths shortened to .../)">
{`In file included from use_un.cpp:1:
In file included from .../c++/v1/print:46:
In file included from .../c++/v1/format:200:
In file included from .../c++/v1/__format/buffer.h:13:
In file included from .../c++/v1/__algorithm/copy_n.h:12:
In file included from .../c++/v1/__algorithm/copy.h:12:
In file included from .../c++/v1/__algorithm/copy_move_common.h:18:
In file included from .../c++/v1/__string/constexpr_c_functions.h:28:
In file included from .../c++/v1/__utility/is_pointer_in_range.h:12:
.../c++/v1/__algorithm/comp.h:42:18: error:
      invalid operands to binary expression ('const Reading' and
      'const Reading')
   42 |     return __lhs < __rhs;
      |            ~~~~~ ^ ~~~~~
.../c++/v1/__algorithm/sift_down.h:49:39: note:
      in instantiation of function template specialization
      'std::__less<>::operator()<Reading, Reading>' requested here
   49 |   } else if ((__child + 1) < __len && __comp(__first[__child], __fir...
      |                                       ^
.../c++/v1/__algorithm/make_heap.h:49:12: note:
      in instantiation of function template specialization
      'std::__sift_down<std::_ClassicAlgPolicy, false, std::__less<void,`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the 20 errors, deduplicated">
{`$ clang++ -std=c++23 -fsyntax-only use_un.cpp 2>&1 | grep "error:" \\
    | sed 's/^.*error: //' | sort | uniq -c | sort -rn

  10 no matching function for call to object of type 'std::__less<void, void>'
   6 no matching function for call to '__sort3'
   1 too many errors emitted, stopping now [-ferror-limit=]
   1 no matching function for call to '__partial_sort_impl'
   1 invalid operands to binary expression ('const Reading' and 'const Reading')
   1 cannot convert 'value_type' (aka 'Reading') to 'double' without a conversion operator`}
      </CodeBlock>

      <p>
        Two of those twenty lines describe something real — the missing <code>&lt;</code> and the
        missing conversion to <code>double</code>. The other eighteen are internal libc++ helper
        names and an announcement that the compiler gave up. Note also{' '}
        <strong>it hit the error limit and stopped</strong>, so 357 lines is not even the full
        output.
      </p>

      <h3>Now add two lines</h3>

      <CodeBlock language="cpp" title="median_con.h — the same function, constrained">
{`#pragma once
#include <algorithm>
#include <concepts>
#include <vector>

// CONSTRAINED. Two requirements, stated in the signature.
template <class T>
    requires std::totally_ordered<T> && std::convertible_to<T, double>
double median_of(std::vector<T> xs) {
    std::sort(xs.begin(), xs.end());
    return static_cast<double>(xs[xs.size() / 2]);
}`}
      </CodeBlock>

      <p>
        Same caller, same mistake, one <code>#include</code> changed. This is the entire output:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only use_con.cpp (all 19 lines; libc++ paths shortened)">
{`use_con.cpp:13:33: error: no matching function for call to 'median_of'
   13 |     std::println("median = {}", median_of(rs));
      |                                 ^~~~~~~~~
./median_con.h:9:8: note: candidate template ignored: constraints not
      satisfied [with T = Reading]
    9 | double median_of(std::vector<T> xs) {
      |        ^
./median_con.h:8:14: note: because 'Reading' does not satisfy
      'totally_ordered'
    8 |     requires std::totally_ordered<T> && std::convertible_to<T, double>
      |              ^
.../c++/v1/__concepts/totally_ordered.h:41:27: note:
      because 'Reading' does not satisfy 'equality_comparable'
   41 | concept totally_ordered = equality_comparable<_Tp> && __partially_or...
      |                           ^
.../c++/v1/__concepts/equality_comparable.h:39:31: note:
      because '__weakly_equality_comparable_with<Reading, Reading>'
      evaluated to false
   39 | concept equality_comparable = __weakly_equality_comparable_with<_Tp, _Tp>;
      |                               ^
.../c++/v1/__concepts/equality_comparable.h:32:13: note:
      because '__t == __u' would be invalid: invalid operands to binary
      expression ('const __libcpp_remove_reference_t<Reading>'
      (aka 'const Reading') and 'const __libcpp_remove_reference_t<Reading>'
      (aka 'const Reading'))
   32 |       { __t == __u } -> __boolean_testable;
      |             ^
1 error generated.`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}>Unconstrained</th>
            <th style={headStyle}>Constrained</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Lines of diagnostics</td>
            <td style={cellStyle}>357 (and it stopped early)</td>
            <td style={cellStyle}><strong>19</strong></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Bytes</td>
            <td style={cellStyle}>37,738</td>
            <td style={cellStyle}><strong>1,573</strong> — 24&times; smaller</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Errors reported</td>
            <td style={cellStyle}>20</td>
            <td style={cellStyle}><strong>1</strong></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>in instantiation of</code> frames</td>
            <td style={cellStyle}>55</td>
            <td style={cellStyle}><strong>0</strong> — nothing was instantiated</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Where your own file first appears</td>
            <td style={cellStyle}>Output line 60, as a <code>note:</code></td>
            <td style={cellStyle}><strong>Output line 1, as the <code>error:</code></strong></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>First thing you read</td>
            <td style={cellStyle}><code>comp.h:42: invalid operands to binary expression</code></td>
            <td style={cellStyle}><code>use_con.cpp:13: no matching function for call to
              &apos;median_of&apos;</code></td>
          </tr>
        </tbody>
      </table>

      <p>
        Read the constrained output as a derivation, top to bottom, and stop at the first line that
        tells you enough:
      </p>
      <ol>
        <li><code>no matching function for call to &apos;median_of&apos;</code> — at your line.</li>
        <li><code>candidate template ignored: constraints not satisfied [with T = Reading]</code> —
          the function exists; your type does not qualify.</li>
        <li><code>because &apos;Reading&apos; does not satisfy &apos;totally_ordered&apos;</code> —
          which requirement failed. Most of the time you can stop here.</li>
        <li>Three more <code>because</code> lines narrowing <code>totally_ordered</code> →{' '}
          <code>equality_comparable</code> →{' '}
          <code>__weakly_equality_comparable_with</code> →{' '}
          <code>__t == __u would be invalid</code>, which is the root cause.</li>
      </ol>
      <p>
        Each line is a strictly narrower claim than the one above it. That is structurally different
        from twenty copies of the same thing from twenty call sites, and it is the reason this is
        worth two lines of typing.
      </p>

      <InfoBox variant="warning" title="Two honest caveats about that output">
        <p>
          <strong>The error names <code>==</code>, not <code>&lt;</code>.</strong>{' '}
          <code>std::totally_ordered</code> is defined as{' '}
          <code>equality_comparable&lt;T&gt; &amp;&amp; __partially_ordered_with&lt;T, T&gt;</code>,
          and the equality half is checked first, so the root cause you are shown is the missing{' '}
          <code>operator==</code>. The missing <code>operator&lt;</code> is also real; you just
          never hear about it.
        </p>
        <p>
          <strong>Only the first failing requirement is reported,</strong> because{' '}
          <code>&amp;&amp;</code> in a requires-clause short-circuits. Checked by swapping the two
          conjuncts round:
        </p>
        <CodeBlock language="text" title="Real output — the same file with the requires clause reordered">
{`./median_con2.h:8:14: note: because 'std::convertible_to<Reading, double>'
      evaluated to false
    8 |     requires std::convertible_to<T, double> && std::totally_ordered<T>
      |              ^
.../c++/v1/__concepts/convertible_to.h:27:26: note:
      because 'is_convertible_v<Reading, double>' evaluated to false`}
        </CodeBlock>
        <p>
          A different diagnosis for the same type, from the same compiler, decided by the order you
          wrote the conjunction in. Both are true. Neither is the whole story. Put the requirement
          most likely to be violated first.
        </p>
      </InfoBox>

      <FlowChart
        title="Where the error lands: unconstrained vs constrained, measured"
        chart={
          'graph TD\n' +
          '  CALL["median_of(rs);<br/>where rs is a vector&lt;Reading&gt; and<br/>Reading has no operator&lt; and no<br/>conversion to double"] --> Q{"Does the template declare<br/>what it requires?"}\n' +
          '  Q -->|"no — template &lt;class T&gt;"| U1["1. The call is accepted.<br/>T is deduced as Reading."]\n' +
          '  U1 --> U2["2. The body is SUBSTITUTED and<br/>INSTANTIATED, including std::sort."]\n' +
          '  U2 --> U3["3. std::sort instantiates __sort_impl,<br/>__partial_sort, __make_heap, __sift_down,<br/>__less ... eight levels deep."]\n' +
          '  U3 --> U4["4. comp.h:42 — return __lhs &lt; __rhs;<br/>will not compile. THE ERROR IS REPORTED<br/>HERE, inside libc++."]\n' +
          '  U4 --> U5["5. An instantiation stack is unwound<br/>back to your line ... and then the same<br/>failure is reported again from every<br/>other internal helper that hit it."]\n' +
          '  U5 --> UM["MEASURED:<br/>357 lines / 37,738 bytes<br/>20 errors, 55 instantiation frames<br/>your file first appears at output line 60<br/>as a note, not an error<br/>and it STOPPED EARLY on -ferror-limit"]\n' +
          '  Q -->|"yes — requires<br/>totally_ordered&lt;T&gt; &amp;&amp;<br/>convertible_to&lt;T, double&gt;"| C1["1. The constraint is evaluated FIRST,<br/>before any substitution into the body."]\n' +
          '  C1 --> C2["2. totally_ordered&lt;Reading&gt; is false,<br/>so the function is NOT A CANDIDATE."]\n' +
          '  C2 --> C3["3. Overload resolution finds nothing.<br/>The error is reported AT YOUR CALL."]\n' +
          '  C3 --> C4["4. The notes narrow the reason:<br/>not satisfied -&gt; totally_ordered -&gt;<br/>equality_comparable -&gt;<br/>__t == __u would be invalid"]\n' +
          '  C4 --> CM["MEASURED:<br/>19 lines / 1,573 bytes — 24x smaller<br/>1 error, ZERO instantiation frames<br/>your file is output LINE 1<br/>nothing was ever instantiated"]\n' +
          '  style U4 fill:#3b1a1a,stroke:#f87171\n' +
          '  style U5 fill:#3b1a1a,stroke:#f87171\n' +
          '  style UM fill:#3b1a1a,stroke:#f87171\n' +
          '  style U2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style U3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style C1 fill:#1a3329,stroke:#4ade80\n' +
          '  style C2 fill:#1a3329,stroke:#4ade80\n' +
          '  style C3 fill:#1a3329,stroke:#4ade80\n' +
          '  style C4 fill:#1a3329,stroke:#4ade80\n' +
          '  style CM fill:#1a3329,stroke:#4ade80'
        }
      />

      <h2>The Standard Concepts</h2>
      <p>
        Before writing your own, know what already exists. <code>&lt;concepts&gt;</code> ships about
        thirty, and most constraints you need are a conjunction of two or three of them —{' '}
        <code>median_of</code> above needed no custom concept at all. Here they are measured against
        a spread of types, because several of the answers are not what you would guess:
      </p>

      <CodeBlock language="cpp" title="stdcon.cpp — abridged; the row() helper prints one line per type">
{`struct Plain { int x; };
struct NoCopy { NoCopy() = default; NoCopy(const NoCopy&) = delete; NoCopy(NoCopy&&) = default; };
struct Base { virtual ~Base() = default; };
struct Derived : Base {};

template <class T>
void row(const char* n) {
    std::println("{:<14} integral={:<5} signed={:<5} floating={:<5} regular={:<5} "
                 "copyable={:<5} movable={:<5} ord={:<5} eq={}",
                 n,
                 std::integral<T>, std::signed_integral<T>, std::floating_point<T>,
                 std::regular<T>, std::copyable<T>, std::movable<T>,
                 std::totally_ordered<T>, std::equality_comparable<T>);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 stdcon.cpp && ./stdcon">
{`int            integral=true  signed=true  floating=false regular=true  copyable=true  movable=true  ord=true  eq=true
unsigned       integral=true  signed=false floating=false regular=true  copyable=true  movable=true  ord=true  eq=true
double         integral=false signed=false floating=true  regular=true  copyable=true  movable=true  ord=true  eq=true
char           integral=true  signed=true  floating=false regular=true  copyable=true  movable=true  ord=true  eq=true
bool           integral=true  signed=false floating=false regular=true  copyable=true  movable=true  ord=true  eq=true
std::string    integral=false signed=false floating=false regular=true  copyable=true  movable=true  ord=true  eq=true
Plain          integral=false signed=false floating=false regular=false copyable=true  movable=true  ord=false eq=false
NoCopy         integral=false signed=false floating=false regular=false copyable=false movable=false ord=false eq=false
unique_ptr<int> integral=false signed=false floating=false regular=false copyable=false movable=true  ord=true  eq=true

same_as<int,int>                  = true
same_as<int,const int>            = false
derived_from<Derived,Base>        = true
derived_from<Base,Derived>        = false
convertible_to<int,double>        = true
convertible_to<std::string,int>   = false
default_initializable<NoCopy>     = true
invocable<decltype(+[](int){}),int> = true
predicate<decltype(+[](int){return true;}),int> = true
ranges::range<std::vector<int>>   = true
ranges::range<int>                = false`}
      </CodeBlock>

      <p>
        Four rows in there are worth stopping on.
      </p>
      <ul>
        <li>
          <strong><code>std::integral&lt;bool&gt;</code> is <code>true</code>, and{' '}
          <code>std::integral&lt;char&gt;</code> is too.</strong> These concepts are defined in
          terms of <code>std::is_integral</code>, which includes <code>bool</code>,{' '}
          <code>char</code> and the character types. If you constrain an arithmetic function on{' '}
          <code>std::integral</code>, somebody can pass it a <code>bool</code>. That is the same
          implicit-promotion family <a href="/cpp/classes">the classes lesson</a> measured with{' '}
          <code>wait(true)</code> sleeping for one second.
        </li>
        <li>
          <strong><code>std::signed_integral&lt;char&gt;</code> is <code>true</code> here</strong>,
          and that is platform-dependent. Plain <code>char</code> is signed on{' '}
          <code>arm64-apple-darwin</code> and unsigned on <code>arm64-linux</code>. Verified on this
          machine with <code>std::is_signed_v&lt;char&gt; == true</code>. Never constrain on{' '}
          <code>signed_integral</code> and assume <code>char</code> lands on one side.
        </li>
        <li>
          <strong><code>std::regular&lt;Plain&gt;</code> is <code>false</code>.</strong>{' '}
          <code>struct Plain {'{'} int x; {'}'}</code> is copyable and movable, but{' '}
          <code>regular</code> also requires <code>equality_comparable</code>, and C++ does not
          generate <code>operator==</code> for you unless you ask — which, since C++20, is{' '}
          <code>bool operator==(const Plain&amp;) const = default;</code>. <code>regular</code> is a
          good default constraint for value types precisely because it catches this.
        </li>
        <li>
          <strong><code>std::movable&lt;NoCopy&gt;</code> is <code>false</code>, even though{' '}
          <code>NoCopy</code> has a defaulted move constructor.</strong> This is the special-member
          generation matrix from <a href="/cpp/classes">the classes lesson</a> resurfacing. Broken
          down:
          <CodeBlock language="text" title="Real output — nocopy.cpp, why movable is false">
{`move_constructible<NoCopy>       = true
assignable_from<NoCopy&, NoCopy> = false
swappable<NoCopy>                = false
movable<NoCopy>                  = false
is_move_assignable_v<NoCopy>     = false
is_copy_assignable_v<NoCopy>     = false`}
          </CodeBlock>
          Declaring a move constructor deleted the copy assignment and did not generate a move
          assignment, so the type cannot be assigned at all — row <code>MoveC</code> of that lesson&apos;s
          table, exactly. <code>std::movable</code> requires{' '}
          <code>assignable_from</code>, so it says <code>false</code>.{' '}
          <strong>A concept caught a rule-of-five bug.</strong>
        </li>
      </ul>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Concept</th>
            <th style={headStyle}>Use it when you mean</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::same_as&lt;T, U&gt;</code></td>
            <td style={cellStyle}>Exactly this type, cv-qualifiers and all. Measured:{' '}
              <code>same_as&lt;int, const int&gt;</code> is <code>false</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::convertible_to&lt;From, To&gt;</code></td>
            <td style={cellStyle}>&quot;I will convert it&quot;. The usual choice for a return-type
              requirement.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::derived_from&lt;D, B&gt;</code></td>
            <td style={cellStyle}>Public inheritance. The concept version of the{' '}
              <code>is_base_of</code> / <code>is_convertible</code> distinction from{' '}
              <a href="/cpp/inheritance">the inheritance lesson</a> — it requires{' '}
              <em>both</em>, so private inheritance does not satisfy it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::integral</code>,{' '}
              <code>std::signed_integral</code>, <code>std::floating_point</code></td>
            <td style={cellStyle}>Numbers — with the <code>bool</code> and <code>char</code> caveat
              above.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::equality_comparable</code>,{' '}
              <code>std::totally_ordered</code></td>
            <td style={cellStyle}><code>==</code> / <code>&lt;</code>. The pair you want before
              calling any sorting or searching algorithm.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::movable</code>, <code>std::copyable</code>,{' '}
              <code>std::semiregular</code>, <code>std::regular</code></td>
            <td style={cellStyle}>Value semantics, in increasing strictness.{' '}
              <code>regular</code> = <code>semiregular</code> +{' '}
              <code>equality_comparable</code>, and is the right default for a value type.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::invocable&lt;F, Args...&gt;</code>,{' '}
              <code>std::predicate</code></td>
            <td style={cellStyle}>Callbacks. <code>predicate</code> additionally requires the
              result to be usable as a <code>bool</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::ranges::range</code>,{' '}
              <code>random_access_range</code>, <code>sized_range</code>&hellip;</td>
            <td style={cellStyle}>In <code>&lt;ranges&gt;</code>, not{' '}
              <code>&lt;concepts&gt;</code>. &quot;Anything I can iterate&quot;, which is what you
              almost always mean instead of <code>std::vector&lt;T&gt;</code>.</td>
          </tr>
        </tbody>
      </table>

      <h2>Five Syntaxes, One Constraint</h2>
      <p>
        There are five places you can put a constraint, and they are equivalent for the simple case.
        Pick one and be consistent; a codebase that uses all five is harder to read than one that
        uses the worst of them.
      </p>

      <CodeBlock language="cpp" title="forms.cpp — abridged; includes and main() elided">
{`template <class T>
concept Scalable = requires(T a, double f) { { a * f } -> std::convertible_to<T>; };

// 1. Constrained template parameter
template <std::integral T>
std::string f1(T) { return "f1 constrained template parameter"; }

// 2. requires clause after the template header
template <class T> requires std::integral<T>
std::string f2(T) { return "f2 trailing requires clause on the header"; }

// 3. requires clause after the function declarator
template <class T>
std::string f3(T) requires std::integral<T> { return "f3 trailing requires clause"; }

// 4. Constrained auto parameter -- an abbreviated function template
std::string f4(std::integral auto) { return "f4 constrained auto parameter"; }

// 5. An ad-hoc requires expression inside a requires clause, no named concept
template <class T> requires requires(T t) { t.begin(); t.end(); }
std::string f5(T) { return "f5 inline requires-requires"; }

// --- Constraint subsumption: the MORE constrained overload wins ---
template <class T> std::string best(T)                  { return "unconstrained"; }
template <std::integral T> std::string best(T)          { return "integral"; }
template <std::signed_integral T> std::string best(T)   { return "signed_integral"; }

// --- Constrained auto in return position too ---
std::integral auto doubled(std::integral auto x) { return x + x; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 forms.cpp && ./forms">
{`f1 constrained template parameter
f2 trailing requires clause on the header
f3 trailing requires clause
f4 constrained auto parameter
f5 inline requires-requires

best(1)         -> signed_integral
best(1u)        -> integral
best(1.5)       -> unconstrained
best("text")    -> unconstrained

doubled(21)     = 42
Scalable<double> = true  Scalable<std::string> = false`}
      </CodeBlock>

      <p>
        The <code>best()</code> block is the feature that is easy to skip past and is actually the
        most useful one in the lesson. <strong>Three overloads with the same signature, resolved by
        how constrained they are.</strong> <code>int</code> satisfies all three and the{' '}
        <code>signed_integral</code> one wins because{' '}
        <code>signed_integral</code> <em>subsumes</em> <code>integral</code> — the compiler can see
        that one constraint implies the other and prefers the stronger. <code>unsigned</code>{' '}
        satisfies two and gets <code>integral</code>. <code>double</code> and{' '}
        <code>const char*</code> fall through to the unconstrained fallback.
      </p>
      <p>
        No <code>if constexpr</code>, no tag dispatch, no mutually exclusive conditions to maintain
        by hand, and adding a fourth overload later does not require editing the other three. That
        is a real improvement over everything{' '}
        <a href="/cpp/templates">the last lesson</a> offered for the same job — and the section on{' '}
        <code>enable_if</code> below shows that the old way cannot do it at all.
      </p>

      <InfoBox variant="tip" title="Which syntax to use">
        <ul>
          <li>
            <strong>Form 1 (<code>template &lt;std::integral T&gt;</code>) for a single named
            concept.</strong> Shortest, reads like Java&apos;s{' '}
            <code>&lt;T extends Comparable&lt;T&gt;&gt;</code>, and it is what the standard library
            does.
          </li>
          <li>
            <strong>Form 2 (<code>requires</code> clause on the header) when the constraint is a
            conjunction</strong> or involves more than one parameter —{' '}
            <code>requires std::totally_ordered&lt;T&gt; &amp;&amp; std::convertible_to&lt;T,
            double&gt;</code>, as in the centrepiece. Do not try to cram that into form 1.
          </li>
          <li>
            <strong>Form 4 (<code>std::integral auto</code>) for short free functions and
            lambdas.</strong> Note the cost: an abbreviated function template has no <em>name</em>{' '}
            for its type parameter, so you cannot write <code>T</code> in the body or supply the
            argument explicitly. Use <code>decltype(x)</code> or write it out longhand.
          </li>
          <li>
            <strong>Form 3 is for when you need the constraint to mention a trailing return
            type</strong>, and is otherwise just a third way to read the same thing. Form 5 is for
            one-off requirements that do not deserve a name — use it sparingly, because a named
            concept is the documentation.
          </li>
        </ul>
      </InfoBox>

      <h2>Writing Your Own: The <code>requires</code> Expression</h2>
      <p>
        A <strong>concept</strong> is a named compile-time <code>bool</code> over template
        parameters. A <strong><code>requires</code> expression</strong> is the way to spell
        &quot;would this code compile?&quot; and is where the real expressiveness lives. It has four
        kinds of requirement, and here they are all in one concept, measured against five types that
        each break exactly one of them:
      </p>

      <CodeBlock language="cpp" title="reqs.cpp — abridged; includes, main() and four of the five struct bodies elided">
{`// A concept with all FOUR kinds of requirement in one requires-expression.
template <class T>
concept Repository = requires(T repo, int id, const typename T::entity_type& e) {
    // 1. SIMPLE requirement: this expression must compile. Its value is ignored.
    repo.save(e);

    // 2. TYPE requirement: this must name a valid type.
    typename T::entity_type;
    typename T::key_type;

    // 3. COMPOUND requirement: must compile, must not throw, and the result
    //    must satisfy a concept.
    { repo.find(id)  } -> std::same_as<typename T::entity_type>;
    { repo.count()   } noexcept -> std::convertible_to<std::size_t>;

    // 4. NESTED requirement: another concept (or constant expression) must hold.
    requires std::default_initializable<typename T::entity_type>;
    requires sizeof(typename T::key_type) <= 8;
};

struct User { int id{}; std::string name; };
struct Uuid { unsigned char bytes[16]; };          // 16 bytes

struct GoodRepo {
    using entity_type = User;
    using key_type    = int;
    void save(const User&) {}
    User find(int) { return {}; }
    std::size_t count() const noexcept { return 0; }
};
struct NoNoexcept  { /* as GoodRepo, but */ std::size_t count() const { return 0; } };
struct WrongReturn { /* as GoodRepo, but */ int find(int) { return 0; } };
struct BigKey      { /* as GoodRepo, but */ using key_type = Uuid; };
struct NoTypes     { void save(const User&) {} };  // no member typedefs at all

// A requires-expression is just a bool. It only yields false instead of
// erroring when it is substituting a TEMPLATE PARAMETER -- hence the template.
template <class T>
constexpr bool has_size = requires(T v) { v.size(); };`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 reqs.cpp && ./reqs">
{`sizeof(Uuid) = 16   (sizeof(long double) here is 8, not 16)
Repository<GoodRepo>   = true
Repository<NoNoexcept> = false
Repository<WrongReturn>= false
Repository<BigKey>     = false
Repository<NoTypes>    = false
Repository<int>        = false

has_size<std::vector<int>> = true
has_size<std::string>      = true
has_size<int>              = false`}
      </CodeBlock>

      <p>
        One <code>true</code> and five <code>false</code>s, each for a different reason, from one
        concept. Note what the compound requirements bought: <code>NoNoexcept</code> differs from{' '}
        <code>GoodRepo</code> only by a missing <code>noexcept</code>, and{' '}
        <code>WrongReturn</code> only by returning <code>int</code> instead of{' '}
        <code>User</code>. Neither is a thing <code>std::enable_if</code> could express without
        several lines of helper templates.
      </p>
      <p>
        And the diagnostic when a constrained function is handed the <code>noexcept</code> one is
        nine lines and points at the exact requirement:
      </p>

      <CodeBlock language="text" title="Real output — calling template <Repository R> void run(R&) with NoNoexcept">
{`reqerr.cpp:30:5: error: no matching function for call to 'run'
   30 |     run(r);
      |     ^~~
reqerr.cpp:26:6: note: candidate template ignored: constraints not satisfied
      [with R = NoNoexcept]
   26 | void run(R& repo) { repo.count(); }
      |      ^
reqerr.cpp:25:11: note: because 'NoNoexcept' does not satisfy 'Repository'
   25 | template <Repository R>
      |           ^
reqerr.cpp:10:24: note: because 'repo.count()' may throw an exception
   10 |     { repo.count()   } noexcept -> std::convertible_to<std::size_t>;
      |                        ^
1 error generated.`}
      </CodeBlock>

      <p>
        <code>because &apos;repo.count()&apos; may throw an exception</code>, pointing at line 10 of
        the concept definition. There is no version of that message available from any pre-C++20
        technique.
      </p>

      <FlowChart
        title="The four kinds of requirement in a requires-expression"
        chart={
          'graph TD\n' +
          '  R["concept Repository = requires(T repo, int id, ...) { ... };<br/>The parameter list introduces NAMES ONLY —<br/>nothing is constructed, nothing is called at<br/>run time. The whole thing is a compile-time bool."] --> S["1. SIMPLE requirement<br/>repo.save(e);<br/>This expression must COMPILE.<br/>Its value and its type are ignored."]\n' +
          '  R --> T["2. TYPE requirement<br/>typename T::entity_type;<br/>This must NAME A VALID TYPE.<br/>Measured: NoTypes, which has no member<br/>typedefs, failed here."]\n' +
          '  R --> C["3. COMPOUND requirement<br/>{ repo.find(id) } -&gt; std::same_as&lt;...&gt;;<br/>{ repo.count() } noexcept -&gt; convertible_to;<br/>Three checks in one: compiles, optionally<br/>does not throw, and the RESULT TYPE<br/>satisfies a concept."]\n' +
          '  R --> N["4. NESTED requirement<br/>requires std::default_initializable&lt;...&gt;;<br/>requires sizeof(key_type) &lt;= 8;<br/>Note the SECOND requires — without it this<br/>would only check that the expression<br/>compiles, not that it is TRUE."]\n' +
          '  C --> CM["Measured: WrongReturn differs from a<br/>valid repo only by returning int instead<br/>of User -&gt; false.<br/>NoNoexcept differs only by a missing<br/>noexcept -&gt; false, with the diagnostic<br/>because repo.count() may throw<br/>an exception."]\n' +
          '  N --> NM["Measured: BigKey with a 16-byte key -&gt;<br/>false. And a gotcha found while writing<br/>this: long double was supposed to fail<br/>the same check and did NOT, because<br/>sizeof(long double) == 8 on this target."]\n' +
          '  R --> GOTCHA["GOTCHA, measured:<br/>a requires-expression only yields FALSE<br/>instead of a hard error while substituting<br/>a TEMPLATE PARAMETER.<br/>requires(int v) { v.size(); } written on a<br/>concrete type is error: member reference<br/>base type int is not a structure or union.<br/>Wrap it in a template."]\n' +
          '  R --> LIMIT["AND THE REAL LIMITATION:<br/>a concept constrains the INTERFACE, not<br/>the IMPLEMENTATION. Measured: a body<br/>constrained on Addable&lt;T&gt; that used * on<br/>T compiled fine and then failed deep<br/>inside at instantiation, exactly as if<br/>there were no concept at all."]\n' +
          '  style S fill:#1a2744,stroke:#5b9cf6\n' +
          '  style T fill:#1a2744,stroke:#5b9cf6\n' +
          '  style C fill:#1a2744,stroke:#5b9cf6\n' +
          '  style N fill:#1a2744,stroke:#5b9cf6\n' +
          '  style CM fill:#1a3329,stroke:#4ade80\n' +
          '  style NM fill:#3d2f14,stroke:#fb923c\n' +
          '  style GOTCHA fill:#3d2f14,stroke:#fb923c\n' +
          '  style LIMIT fill:#3b1a1a,stroke:#f87171'
        }
      />

      <InfoBox variant="danger" title="The limitation nobody tells you about: concepts do not check the body">
        <p>
          A concept constrains what callers may pass. It does <strong>not</strong> constrain what
          the template body is allowed to do with it. If the body uses an operation the concept
          never promised, nothing complains until somebody instantiates it with a type that has the
          promised operations and not the used ones — at which point you are back to a deep
          instantiation error.
        </p>
        <CodeBlock language="cpp" title="nodefcheck.cpp">
{`template <class T> concept Addable = requires(T a, T b) { a + b; };

// The constraint promises only '+'. The body uses '*'.
template <Addable T>
T misuse(T a, T b) { return a * b; }      // '*' is NOT in Addable

struct PlusOnly {
    int v;
    friend PlusOnly operator+(PlusOnly l, PlusOnly r) { return {l.v + r.v}; }
};

int main() {
    std::println("Addable<PlusOnly> = {}", Addable<PlusOnly>);
    std::println("misuse(2, 3)      = {}", misuse(2, 3));   // fine for int
    misuse(PlusOnly{2}, PlusOnly{3});
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only nodefcheck.cpp">
{`nodefcheck.cpp:9:31: error: invalid operands to binary expression
      ('PlusOnly' and 'PlusOnly')
    9 | T misuse(T a, T b) { return a * b; }      // '*' is NOT in Addable
      |                             ~ ^ ~
nodefcheck.cpp:19:5: note: in instantiation of function template
      specialization 'misuse<PlusOnly>' requested here
   19 |     misuse(PlusOnly{2}, PlusOnly{3});
      |     ^
1 error generated.`}
      </CodeBlock>
        <p>
          <code>Addable&lt;PlusOnly&gt;</code> is <code>true</code>, the constraint was satisfied,
          the call was accepted, and the body failed anyway. This is called the absence of{' '}
          <em>definition checking</em>, and it was deliberately left out of C++20 — the original
          &quot;Concepts&quot; proposal had it and was rejected partly because of it. The practical
          consequence: <strong>a concept is only as good as its coverage of what the body actually
          does</strong>, and keeping the two in sync is on you. Write the concept from the body, not
          from your intentions.
        </p>
      </InfoBox>

      <h2><code>static_assert</code>: The Older, Cruder Tool</h2>
      <p>
        <code>static_assert</code> predates concepts by twelve years and is still the right answer
        for some things. The difference is <em>when</em> it fires: a <code>static_assert</code> in a
        template body runs at instantiation, which means the function was already selected.
      </p>

      <CodeBlock language="cpp" title="sa.cpp vs sc.cpp — the same requirement, two mechanisms">
{`// static_assert: the check happens INSIDE the body, at instantiation time.
template <class T>
double to_double_sa(T v) {
    static_assert(std::is_arithmetic_v<T>, "to_double requires an arithmetic type");
    return static_cast<double>(v);
}

// A requires clause: the check happens at the CALL, before the body exists.
template <class T>
    requires std::is_arithmetic_v<T>
double to_double_c(T v) { return static_cast<double>(v); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the static_assert version, called with std::string (18 lines, 2 errors)">
{`sa.cpp:7:19: error: static assertion failed due to requirement
      'std::is_arithmetic_v<std::string>': to_double requires an arithmetic
      type
    7 |     static_assert(std::is_arithmetic_v<T>, "to_double requires an ar...
      |                   ^~~~~~~~~~~~~~~~~~~~~~~
sa.cpp:11:26: note: in instantiation of function template specialization
      'to_double_sa<std::string>' requested here
   11 | int main() { return (int)to_double_sa(std::string{"x"}); }
      |                          ^
sa.cpp:8:12: error: no matching conversion for static_cast from
      'std::string' to 'double'
    8 |     return static_cast<double>(v);
      |            ^~~~~~~~~~~~~~~~~~~~~~
.../c++/v1/string:1223:55: note: candidate function
 1223 |   _LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR_SINCE_CXX20 operator __sel...
      |                                                       ^
2 errors generated.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the requires-clause version, same call (12 lines, 1 error)">
{`sc.cpp:9:26: error: no matching function for call to 'to_double_c'
    9 | int main() { return (int)to_double_c(std::string{"x"}); }
      |                          ^~~~~~~~~~~
sc.cpp:7:8: note: candidate template ignored: constraints not satisfied
      [with T = std::string]
    7 | double to_double_c(T v) { return static_cast<double>(v); }
      |        ^
sc.cpp:6:14: note: because 'std::is_arithmetic_v<std::string>' evaluated to
      false
    6 |     requires std::is_arithmetic_v<T>
      |              ^
1 error generated.`}
      </CodeBlock>

      <p>
        The <code>static_assert</code> message is good — it includes your sentence, which a concept
        failure cannot. But look at the <strong>second error</strong>: because the body was
        instantiated anyway, the broken <code>static_cast</code> also got reported, complete with a
        libc++ candidate note. One mistake, two errors, and the second one is noise.
      </p>
      <p>
        That is the smaller half of the difference. The larger half is that{' '}
        <strong>a <code>static_assert</code> cannot remove the function from overload
        resolution.</strong> The function was selected, the assertion failed, and the compile is
        over — there is no &quot;try the other overload&quot;. A constraint makes the candidate
        disappear, which is what lets the <code>best()</code> overload set above work.
      </p>

      <InfoBox variant="tip" title="Where static_assert still earns its place">
        <ul>
          <li>
            <strong>Facts about a type, asserted next to the type.</strong>{' '}
            <a href="/cpp/classes">The classes lesson</a> closed with{' '}
            <code>static_assert(std::is_nothrow_move_constructible_v&lt;T&gt;)</code>, and{' '}
            <a href="/cpp/inheritance">the inheritance lesson</a> with{' '}
            <code>static_assert(std::has_virtual_destructor_v&lt;T&gt;)</code>. Neither is about
            constraining a template; both are invariants you want the build to enforce.
          </li>
          <li>
            <strong>Layout and ABI assumptions.</strong>{' '}
            <code>static_assert(sizeof(Packet) == 64)</code>,{' '}
            <code>static_assert(alignof(T) == 8)</code>,{' '}
            <code>static_assert(std::endian::native == std::endian::little)</code>. There is no
            concept for &quot;this struct had better not grow&quot;.
          </li>
          <li>
            <strong>A custom message, when the requirement genuinely needs explaining.</strong> You
            can have both: constrain the template <em>and</em>{' '}
            <code>static_assert</code> inside it with prose. The constraint handles overload
            resolution; the assertion handles the human.
          </li>
          <li>
            <strong><code>static_assert(false)</code> in an <code>else</code> branch of an{' '}
            <code>if constexpr</code></strong> to make a chain exhaustive. The textbook caveat is
            that this only became well-formed in C++23 (P2593) and that before it you needed a
            dependent-false helper. Measured on this compiler, that caveat does not apply:
            <CodeBlock language="text" title="Real output — the same if-constexpr chain with static_assert(false) in the else">
{`$ for std in c++17 c++20 c++23; do clang++ -std=$std -fsyntax-only safalse.cpp; done
# no output at any of the three -- all accepted

$ # and when a type DOES reach the else branch, at -std=c++17:
safalse2.cpp:6:24: error: static assertion failed: f(): unsupported type
    6 |     else static_assert(false, "f(): unsupported type");
      |                        ^~~~~
safalse2.cpp:8:21: note: in instantiation of function template
      specialization 'f<std::string>' requested here`}
            </CodeBlock>
            Clang 21 behaves the C++23 way at <code>-std=c++17</code> as well. Which is the usual
            warning about portability notes: the standard changed, this compiler never needed it,
            and a different compiler might.
          </li>
        </ul>
      </InfoBox>

      <InfoBox variant="info" title="C++26 lets the message be computed — and std::format is not the way to do it">
        <p>
          <a href="/cpp/intro">The intro</a> established that <code>-std=c++26</code> on this
          toolchain is partial, so this was worth checking rather than assuming. C++26 (P2741)
          allows the second argument of <code>static_assert</code> to be any constant expression
          with <code>constexpr</code> <code>size()</code> and <code>data()</code>, so the message
          can report the value that was wrong. The obvious attempt does not work:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++26 -fsyntax-only, message produced by std::format">
{`sa26.cpp:5:15: error: the message in a static assertion must be produced by
      a constant expression
    5 |               std::format("Packet is {} bytes, expected 8", sizeof(P...
      |               ^
sa26.cpp:5:15: note: non-constexpr function 'format<unsigned long>' cannot
      be used in a constant expression`}
        </CodeBlock>
        <p>
          <code>std::format</code> is not <code>constexpr</code>, so it cannot produce a{' '}
          <code>static_assert</code> message. With a hand-written <code>constexpr</code> type that
          has <code>size()</code> and <code>data()</code>, it works — and at{' '}
          <code>-std=c++23</code> the same code compiles with{' '}
          <code>warning: &apos;static_assert&apos; with a user-generated message is a C++26
          extension [-Wc++26-extensions]</code>:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++26 -fmessage-length=76 -fsyntax-only sa26b.cpp">
{`sa26b.cpp:21:15: error: static assertion failed due to requirement
      'sizeof(Packet) == 8': Packet is < bytes, expected 8
   21 | static_assert(sizeof(Packet) == 8, Msg<sizeof(Packet)>{});
      |               ^~~~~~~~~~~~~~~~~~~
sa26b.cpp:21:30: note: expression evaluates to '12 == 8'
   21 | static_assert(sizeof(Packet) == 8, Msg<sizeof(Packet)>{});
      |               ~~~~~~~~~~~~~~~^~~~
1 error generated.`}
        </CodeBlock>
        <p>
          The feature works. <code>Packet is &lt; bytes</code> is a bug in the demonstration&apos;s
          hand-rolled integer formatting — <code>&apos;0&apos; + 12</code> is{' '}
          <code>&apos;&lt;&apos;</code> — which is a fair illustration of why you want{' '}
          <code>std::format</code> for this and cannot have it yet. Note also the{' '}
          <code>note: expression evaluates to &apos;12 == 8&apos;</code> underneath, which clang
          gives you for free in every standard mode and is usually all you needed.
        </p>
      </InfoBox>

      <h2>What You Will Actually Find: SFINAE and <code>enable_if</code></h2>
      <p>
        Every C++ codebase older than 2021 does this with <code>std::enable_if</code>, and plenty of
        newer ones still do because they target C++17. You need to be able to read it. The
        underlying rule is <strong>SFINAE</strong> — <em>substitution failure is not an
        error</em> — which says that if substituting template arguments into a function&apos;s{' '}
        <em>signature</em> produces something ill-formed, that candidate is quietly dropped instead
        of the compile failing. Everything below is built on deliberately engineering such a failure.
      </p>

      <CodeBlock language="cpp" title="sfinae.cpp — abridged; includes and main() elided">
{`// ---------- The pre-C++20 way ----------
// Two overloads that must be MUTUALLY EXCLUSIVE by hand, because there is no
// notion of one constraint being more specialised than another.
template <class T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
std::string describe_old(T) { return "old: integral"; }

template <class T, std::enable_if_t<std::is_floating_point_v<T>, int> = 0>
std::string describe_old(T) { return "old: floating point"; }

// "has a size() member" the SFINAE way: the void_t detection idiom.
template <class, class = void>
struct has_size_old : std::false_type {};
template <class T>
struct has_size_old<T, std::void_t<decltype(std::declval<T&>().size())>> : std::true_type {};

template <class T, std::enable_if_t<has_size_old<T>::value, int> = 0>
std::string describe_old(T) { return "old: has size()"; }

// ---------- The C++20 way ----------
template <class T> concept Sized = requires(T& t) { t.size(); };

template <class T> std::string describe_new(T)               { return "new: anything"; }
template <std::integral T> std::string describe_new(T)       { return "new: integral"; }
template <std::floating_point T> std::string describe_new(T)  { return "new: floating point"; }
template <Sized T> std::string describe_new(T)               { return "new: has size()"; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sfinae.cpp && ./sfinae">
{`has_size_old<std::vector<int>>::value = true
has_size_old<int>::value              = false
Sized<std::vector<int>>               = true
Sized<int>                            = false

describe_old(1)        -> old: integral
describe_old(1.5)      -> old: floating point
describe_old(vector)   -> old: has size()
describe_new(1)        -> new: integral
describe_new(1.5)      -> new: floating point
describe_new(vector)   -> new: has size()
describe_new(nullptr)  -> new: anything`}
      </CodeBlock>

      <p>
        Both work. Four lines of <code>void_t</code> partial specialisation against{' '}
        <code>concept Sized = requires(T&amp; t) {'{'} t.size(); {'}'};</code> is the readability
        argument, and it is a real one — but it is not the decisive one.
      </p>

      <h3>What <code>enable_if</code> genuinely cannot do</h3>
      <p>
        Look at the C++20 set again: there are <strong>four</strong> overloads, one of which is a
        completely unconstrained <code>describe_new(T)</code> fallback, and{' '}
        <code>describe_new(nullptr)</code> found it. Try the same structure with{' '}
        <code>enable_if</code>:
      </p>

      <CodeBlock language="cpp" title="sfinae2.cpp">
{`template <class T, std::enable_if_t<std::is_integral_v<T>, int> = 0>
std::string describe_old(T) { return "old: integral"; }

// Try to add a general fallback the way you would with concepts.
template <class T>
std::string describe_old(T) { return "old: anything"; }

int main() { return (int)describe_old(1).size(); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only sfinae2.cpp">
{`sfinae2.cpp:11:26: error: call to 'describe_old' is ambiguous
   11 | int main() { return (int)describe_old(1).size(); }
      |                          ^~~~~~~~~~~~
sfinae2.cpp:5:13: note: candidate function [with T = int, $1 = 0]
    5 | std::string describe_old(T) { return "old: integral"; }
      |             ^
sfinae2.cpp:9:13: note: candidate function [with T = int]
    9 | std::string describe_old(T) { return "old: anything"; }
      |             ^
1 error generated.`}
      </CodeBlock>

      <p>
        <strong><code>call to &apos;describe_old&apos; is ambiguous</code>.</strong>{' '}
        <code>enable_if</code> can only make a candidate exist or not exist; it has no way to say
        &quot;this one is more specific&quot;. So every overload set has to be partitioned by hand
        into conditions that cannot both be true, and the <code>n</code>-th overload means editing
        the previous <code>n-1</code> to exclude it. That is the actual reason concepts replaced it,
        and it is the one you will feel in a codebase.
      </p>

      <InfoBox variant="warning" title="Something this lesson expected to find and did not: enable_if's error messages are fine">
        <p>
          The received wisdom is that <code>enable_if</code> produces incomprehensible errors.
          Measured on this compiler, for the ordinary case, it does not:
        </p>
        <CodeBlock language="text" title="Real output — enable_if overloads called with a type that satisfies none of them">
{`sfinae3.cpp:10:26: error: no matching function for call to 'describe_old'
   10 | int main() { return (int)describe_old(std::string{"x"}).size(); }
      |                          ^~~~~~~~~~~~
sfinae3.cpp:5:13: note: candidate template ignored: requirement
      'std::is_integral_v<std::string>' was not satisfied
      [with T = std::string]
    5 | std::string describe_old(T) { return "old: integral"; }
      |             ^
sfinae3.cpp:8:13: note: candidate template ignored: requirement
      'std::is_floating_point_v<std::string>' was not satisfied
      [with T = std::string]
    8 | std::string describe_old(T) { return "old: floating point"; }
      |             ^
1 error generated.`}
        </CodeBlock>
        <p>
          <code>candidate template ignored: requirement
          &apos;std::is_integral_v&lt;std::string&gt;&apos; was not satisfied</code> is a perfectly
          good message, and it lands at the call site for the same reason a concept failure does —
          both are checked during overload resolution, before instantiation. Modern clang has got
          much better at this.
        </p>
        <p>
          So the honest case for concepts over <code>enable_if</code> is, in order:{' '}
          <strong>subsumption</strong> (the ambiguity above, which has no workaround),{' '}
          <strong>readability of the declaration</strong>, <strong>reusability</strong> (a concept
          is a name you can use in forty places, a <code>enable_if_t</code> expression is copy-
          paste), and <strong>the <code>because</code> chain</strong> for composed requirements,
          which <code>enable_if</code> has no equivalent of. &quot;Better errors&quot; is real but
          it is fourth on the list.
        </p>
      </InfoBox>

      <h2><code>constexpr</code> and <code>consteval</code>: The Other Compile-Time Axis</h2>
      <p>
        Concepts are compile-time <em>predicates about types</em>.{' '}
        <code>constexpr</code> is compile-time <em>computation of values</em>. They meet in two
        places: a concept body can call a <code>constexpr</code> function, and a nested requirement
        is just a constant expression — <code>requires sizeof(key_type) &lt;= 8;</code> above was
        exactly that.
      </p>

      <CodeBlock language="cpp" title="cxpr.cpp — abridged; includes elided">
{`// constexpr: MAY run at compile time. Runs at run time if the arguments are
// not constants.
constexpr int checksum(std::string_view s) {
    int total = 0;
    for (char c : s) total += static_cast<unsigned char>(c);
    return total;
}

// consteval: MUST run at compile time. An "immediate function".
consteval int compiletime_checksum(std::string_view s) { return checksum(s); }

// C++23 'if consteval' -- pick a different implementation per context.
constexpr int which_path(int x) {
    if consteval { return x * 100; }     // compile-time branch
    else         { return x;       }     // run-time branch
}

// Concepts are just compile-time bools, so they compose with constexpr.
template <class T>
concept Checksummable = requires(T t) { { checksum(t) } -> std::same_as<int>; };

template <Checksummable T>
constexpr int safe_checksum(T t) { return checksum(t); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cxpr.cpp && ./cxpr">
{`checksum("postgres") constexpr          = 887
compiletime_checksum("postgres")        = 887
checksum(runtime)  (same fn, run time)  = 887
which_path(7) at compile time           = 700
which_path(7) at run time               = 7
Checksummable<std::string_view>         = true
Checksummable<double>                   = false
safe_checksum("abc")                    = 294`}
      </CodeBlock>

      <p>
        The two <code>which_path(7)</code> lines are the clearest illustration:{' '}
        <strong><code>700</code> in a <code>constexpr</code> initialiser and <code>7</code> in an
        ordinary one, from the same function.</strong>
      </p>
      <p>
        <code>if consteval</code> is C++23. The C++20 spelling is{' '}
        <code>if (std::is_constant_evaluated())</code> — note the plain <code>if</code> — and it
        comes with a trap worth having measured, because the fix looks like a bug:
      </p>

      <CodeBlock language="cpp" title="ice.cpp">
{`constexpr int wrong(int x) {
    if constexpr (std::is_constant_evaluated()) return x * 100;   // ALWAYS taken?
    else                                        return x;
}
constexpr int right(int x) {
    if (std::is_constant_evaluated()) return x * 100;             // plain if
    else                              return x;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ice.cpp && ./ice">
{`ice.cpp:5:19: warning: 'std::is_constant_evaluated' will always evaluate to 'true' in a manifestly constant-evaluated expression [-Wconstant-evaluated]
    5 |     if constexpr (std::is_constant_evaluated()) return x * 100;   // ALWAYS taken?
      |                   ^
1 warning generated.

wrong: compile-time 700 / run-time 700
right: compile-time 700 / run-time 7`}
      </CodeBlock>

      <p>
        <code>run-time 700</code> on the first line is the bug.{' '}
        <code>is_constant_evaluated()</code> is a function call, and the condition of an{' '}
        <code>if constexpr</code> is itself a constant expression, so the answer inside it is
        always <code>true</code> — the runtime branch is discarded at compile time and never
        exists. The plain <code>if</code> is correct, which is the one time in C++ that{' '}
        <code>if constexpr</code> is the wrong choice for a compile-time question.
      </p>
      <p>
        Credit to clang: <code>-Wconstant-evaluated</code> catches it, and measured, it is{' '}
        <strong>on by default</strong> — no <code>-Wall</code> needed. <code>if consteval</code>{' '}
        exists precisely so the question cannot be asked wrongly.
      </p>
      <p>
        The practical distinction between the two keywords:
      </p>
      <ul>
        <li>
          <strong><code>constexpr</code> is permission.</strong> &quot;This <em>may</em> be
          evaluated at compile time.&quot; If the arguments are not constants it just runs normally
          — the third output line is the same function called at run time. So marking something{' '}
          <code>constexpr</code> costs a caller nothing.
        </li>
        <li>
          <strong><code>consteval</code> is a requirement.</strong> &quot;This <em>must</em> be
          evaluated at compile time.&quot; Calling it with a runtime value is an error:
          <CodeBlock language="text" title="Real output — calling a consteval function with a non-constant argument">
{`cxpr2.cpp:9:12: error: call to consteval function 'compiletime_checksum' is
      not a constant expression
    9 |     return compiletime_checksum(runtime);     // not a constant expression
      |            ^
cxpr2.cpp:9:33: note: read of non-constexpr variable 'runtime' is not
      allowed in a constant expression
    9 |     return compiletime_checksum(runtime);     // not a constant expression
      |                                 ^~~~~~~
cxpr2.cpp:8:22: note: declared here
    8 |     std::string_view runtime = "postgres";
      |                      ^`}
          </CodeBlock>
          That is the point of it: a <code>consteval</code> function cannot accidentally end up in
          the binary as runtime code. Use it for things that are only meaningful at compile time —
          validating a format string, hashing a compile-time name, building a lookup table.
        </li>
      </ul>
      <p>
        One honesty note on <code>static_assert(a == 887)</code> in that program: the first draft of
        this lesson asserted <code>876</code>, which is what the author expected. The compiler
        replied <code>note: expression evaluates to &apos;887 == 876&apos;</code> and the number in
        the lesson was corrected. Which is a small advertisement for{' '}
        <code>static_assert</code>: a wrong compile-time expectation is a build failure, not a
        wrong answer in production.
      </p>

      <FlowChart
        title="Choosing a constraint mechanism"
        chart={
          'graph TD\n' +
          '  Q["A template that only makes sense<br/>for some types"] --> Q1{"Does the requirement need to<br/>affect WHICH OVERLOAD is chosen?"}\n' +
          '  Q1 -->|yes| CON["A CONSTRAINT: requires clause or a<br/>named concept. It is the only mechanism<br/>that removes the candidate AND orders<br/>candidates by strength."]\n' +
          '  CON --> SUB["Measured: three same-signature overloads<br/>constrained on nothing / integral /<br/>signed_integral resolved to<br/>signed_integral for int, integral for<br/>unsigned, unconstrained for double.<br/>No hand-written mutual exclusion."]\n' +
          '  Q1 -->|"no, I just want a clear<br/>failure"| Q2{"Is it a property of a TYPE,<br/>or a fact about layout,<br/>sizes or the platform?"}\n' +
          '  Q2 -->|"a type property"| CON2["Still a constraint. Measured:<br/>1 error / 12 lines, at the call site,<br/>versus static_assert at 2 errors /<br/>18 lines with the body instantiated<br/>anyway."]\n' +
          '  Q2 -->|"layout / size / ABI /<br/>an invariant to pin down"| SA["static_assert, next to the type.<br/>sizeof(Packet) == 64,<br/>is_nothrow_move_constructible_v&lt;T&gt;,<br/>has_virtual_destructor_v&lt;Base&gt;.<br/>There is no concept for these."]\n' +
          '  Q1 -->|"the difference is which CODE<br/>runs, not which types are allowed"| IFC["if constexpr — the previous lesson.<br/>One function, several branches,<br/>untaken branches not instantiated."]\n' +
          '  CON --> NAME{"Will the requirement be<br/>used more than once?"}\n' +
          '  NAME -->|yes| NAMED["Give it a name: concept Sized = ...<br/>The name is the documentation, and it<br/>appears verbatim in the error as<br/>because X does not satisfy Sized."]\n' +
          '  NAME -->|no| INLINE["An inline requires clause is fine.<br/>requires requires(T t) { t.begin(); }<br/>— ugly, but local."]\n' +
          '  CON --> PRE{"Must this compile<br/>on C++17?"}\n' +
          '  PRE -->|yes| EI["std::enable_if_t. Readable enough, and<br/>its errors are measurably FINE —<br/>candidate template ignored: requirement<br/>... was not satisfied.<br/>But it has NO subsumption: adding an<br/>unconstrained fallback measured as<br/>call to describe_old is ambiguous."]\n' +
          '  PRE -->|no| NAMED\n' +
          '  style CON fill:#1a3329,stroke:#4ade80\n' +
          '  style CON2 fill:#1a3329,stroke:#4ade80\n' +
          '  style NAMED fill:#1a3329,stroke:#4ade80\n' +
          '  style SUB fill:#1a3329,stroke:#4ade80\n' +
          '  style SA fill:#1a2744,stroke:#5b9cf6\n' +
          '  style IFC fill:#1a2744,stroke:#5b9cf6\n' +
          '  style INLINE fill:#3d2f14,stroke:#fb923c\n' +
          '  style EI fill:#3d2f14,stroke:#fb923c'
        }
      />

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
            <td style={cellStyle}>&quot;Concepts tidy up the error message&quot;</td>
            <td style={cellStyle}>They move the decision. 357 lines &rarr; 19, 37,738 bytes &rarr;
              1,573, 20 errors &rarr; 1, and <strong>55 instantiation frames &rarr; 0</strong> —
              nothing was instantiated at all.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The error will name the real problem&quot;</td>
            <td style={cellStyle}>Partly. It named the missing <code>operator==</code> (via{' '}
              <code>totally_ordered</code>) and never mentioned the missing{' '}
              <code>operator&lt;</code> or the missing conversion, because{' '}
              <code>&amp;&amp;</code> short-circuits. Reordering the clause changed the
              diagnosis.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A concept checks my template&quot;</td>
            <td style={cellStyle}>It checks callers, not the body. A body constrained on{' '}
              <code>Addable&lt;T&gt;</code> used <code>*</code> and compiled; the failure came back
              at instantiation. There is no definition checking in C++20.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::integral</code> means a number&quot;</td>
            <td style={cellStyle}><code>std::integral&lt;bool&gt;</code> and{' '}
              <code>std::integral&lt;char&gt;</code> are both <code>true</code>. And{' '}
              <code>std::signed_integral&lt;char&gt;</code> is <code>true</code>{' '}
              <em>on this target</em> — plain <code>char</code> is signed on arm64 macOS.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A plain struct is a regular type&quot;</td>
            <td style={cellStyle}><code>std::regular&lt;struct {'{'} int x; {'}'}&gt;</code> is{' '}
              <code>false</code> — no <code>operator==</code>. You need{' '}
              <code>= default</code> on it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A type with a move constructor is movable&quot;</td>
            <td style={cellStyle}><code>std::movable&lt;NoCopy&gt;</code> is <code>false</code>.{' '}
              <code>move_constructible</code> was <code>true</code> but{' '}
              <code>assignable_from</code> was <code>false</code> — the rule-of-five trap from{' '}
              <a href="/cpp/classes">the classes lesson</a>, caught by a concept.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A <code>requires</code> expression is just a
              <code>bool</code>&quot;</td>
            <td style={cellStyle}>Only while substituting a template parameter. Written on a
              concrete type, <code>requires(int v) {'{'} v.size(); {'}'}</code> is a hard error:{' '}
              <code>member reference base type &apos;int&apos; is not a structure or
              union</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>static_assert</code> does the same job&quot;</td>
            <td style={cellStyle}>It fires after the overload is chosen and the body is
              instantiated — 2 errors and 18 lines against the constraint&apos;s 1 and 12, and the
              candidate cannot be removed from the overload set.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>enable_if</code> gives unreadable errors&quot;</td>
            <td style={cellStyle}>Measured: it does not.{' '}
              <code>candidate template ignored: requirement &apos;...&apos; was not
              satisfied</code>, at the call site. Its real failing is no subsumption — an
              unconstrained fallback produced{' '}
              <code>call to &apos;describe_old&apos; is ambiguous</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>sizeof(long double) &gt; 8</code>&quot;</td>
            <td style={cellStyle}>Not here. It is <code>8</code> on{' '}
              <code>arm64-apple-darwin</code>, which quietly made a nested requirement pass that
              was written to fail. The demonstration had to be rebuilt around a 16-byte
              struct.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>constexpr</code> means it runs at compile
              time&quot;</td>
            <td style={cellStyle}>It means it <em>may</em>. The same function returned 887 from a{' '}
              <code>constexpr</code> initialiser and 887 from a runtime call.{' '}
              <code>consteval</code> is the one that must — and the runtime call to it was{' '}
              <code>error: call to consteval function ... is not a constant expression</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;My compile-time constant is obviously
              right&quot;</td>
            <td style={cellStyle}>The checksum in this lesson was written as 876 and is 887. The
              build failed with <code>expression evaluates to &apos;887 == 876&apos;</code>, which
              is the whole point of asserting it.</td>
          </tr>
        </tbody>
      </table>

      <h2>The Shape To Copy</h2>
      <p>
        Phase 3 built types (<a href="/cpp/classes">classes</a>), the two ways to abstract over them
        (<a href="/cpp/inheritance">inheritance</a> and{' '}
        <a href="/cpp/templates">templates</a>), and now the way to say what an abstraction
        requires. Here is the composite, with every choice in it traceable to a measurement in one
        of those four lessons:
      </p>

      <CodeBlock language="cpp" title="shape2.cpp — the shape of a generic function you will not regret (includes elided)">
{`// 1. Name the requirement. The name appears verbatim in the error message.
template <class T>
concept Sample = std::totally_ordered<T> && std::convertible_to<T, double>;

// 2. Constrain the RANGE, not the container -- and no more tightly than the
//    body needs. We copy before sorting, so input_range is enough.
template <std::ranges::input_range R>
    requires Sample<std::ranges::range_value_t<R>>
double median_of(R&& xs) {
    auto v = std::ranges::to<std::vector>(std::forward<R>(xs));
    std::ranges::sort(v);                 // constrained algorithm: good errors inside too
    return static_cast<double>(v[v.size() / 2]);
}

// 3. Assert the things a concept cannot express, next to the type.
struct Packet { std::uint32_t id; std::uint32_t len; };
static_assert(sizeof(Packet) == 8, "Packet is wire format; it must not grow");
static_assert(std::is_trivially_copyable_v<Packet>);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 shape2.cpp && ./shape2">
{`vector<double>  -> 2
array<int,5>    -> 3
deque<int>      -> 8
span<double>    -> 2
filter_view     -> 3

random_access_range<filter_view> = false
input_range<filter_view>         = true
random_access_range<deque<int>>  = true`}
      </CodeBlock>

      <p>
        One function template, five different kinds of range, no overloads.
      </p>
      <ol>
        <li>
          <strong>A named concept, not an inline clause,</strong> because the name is what the
          reader of the error sees — <code>because &apos;Reading&apos; does not satisfy
          &apos;Sample&apos;</code> beats a reprinted conjunction.
        </li>
        <li>
          <strong>Constrain on a range concept, not a concrete container.</strong>{' '}
          <a href="/cpp/templates">The templates lesson</a> measured 7.6 KB of object code and 58 ms
          of build time per distinct instantiation; taking a range instead of{' '}
          <code>std::vector&lt;T&gt;</code> is how you stop multiplying them.
        </li>
        <li>
          <strong>But no more tightly than the body needs,</strong> and this one was a real mistake
          caught while writing the page. The first version said{' '}
          <code>std::ranges::random_access_range</code>, which looked harmless — the body does
          index with <code>[]</code>, after all. It rejected the <code>filter_view</code>:
          <CodeBlock language="text" title="Real output — the over-tight version, trimmed to the because-chain (libc++ paths shortened; source echoes removed)">
{`shape.cpp:34:52: error: no matching function for call to 'median_of'
   34 |     std::println("median_of(filtered view)  = {}", median_of(evens));
      |                                                    ^~~~~~~~~
shape.cpp:15:11: note: because
      'std::ranges::filter_view<std::ranges::ref_view<std::vector<double>>,
      (lambda at shape.cpp:33:41)> &' does not satisfy 'random_access_range'
   15 | template <std::ranges::random_access_range R>
      |           ^
.../c++/v1/__ranges/concepts.h:116:59: note:
      because
      'iterator_t<std::ranges::filter_view<std::ranges::ref_view<std::vector<double,
      std::allocator<double>>>, (lambda at shape.cpp:33:41)> &>' (aka
      '...::__iterator') does not satisfy 'random_access_iterator'`}
          </CodeBlock>
          The indexing happens on the local <code>std::vector</code> copy, not on{' '}
          <code>xs</code> — so the right constraint is <code>input_range</code>, and the measured
          facts are <code>random_access_range&lt;filter_view&gt; == false</code> while{' '}
          <code>input_range&lt;filter_view&gt; == true</code>.{' '}
          <strong>An over-tight constraint rejects valid callers, and the concept error is how you
          find out.</strong> Write the constraint from what the body does to{' '}
          <em>that parameter</em>.
        </li>
        <li>
          <strong><code>requires</code> on the element type via{' '}
          <code>range_value_t</code>,</strong> which is the idiom for &quot;a range of things that
          are X&quot;.
        </li>
        <li>
          <strong>Use the <code>std::ranges::</code> algorithms.</strong> They are constrained, so
          when something does go wrong inside your template the inner error is 34 lines rather than
          304.
        </li>
        <li>
          <strong><code>static_assert</code> for the facts no concept covers.</strong> Size, layout,
          triviality, <code>has_virtual_destructor_v</code>.
        </li>
      </ol>

      <h2>Where This Leads</h2>
      <p>
        That closes Phase 3. You can define a type and control its copying, moving and destruction;
        you know which of inheritance, templates and <code>std::variant</code> to reach for and what
        each costs; and you can state and check a template&apos;s requirements so that a mistake
        lands at the call site.
      </p>
      <p>
        Phase 4 turns to the standard library, starting with{' '}
        <strong><a href="/cpp/containers">STL Containers &amp; Iterator Invalidation</a></strong>.
        That lesson is where several threads from this phase come due at once:{' '}
        <code>std::vector</code> reallocation is the move-semantics measurement from{' '}
        <a href="/cpp/move-semantics">phase 2</a> with the special-member matrix from{' '}
        <a href="/cpp/classes">phase 3</a> deciding whether it moves or copies; storing a derived
        type in a <code>vector&lt;Base&gt;</code> is the slicing measurement from{' '}
        <a href="/cpp/inheritance">the inheritance lesson</a>; and iterator invalidation is a
        use-after-free with its own vocabulary — one that no concept and no sanitizer configuration
        measured in <a href="/cpp/memory-bugs">phase 2</a> reliably catches by default.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, and it is the one that makes concepts click, because it is the reverse of
          how people usually learn them. <strong>Do not start by writing a concept. Start by
          breaking a template.</strong>
        </p>
        <p>
          Take any function template in your own code — or write{' '}
          <code>median_of</code> from this page. Call it with a type that does not work. Count the
          output:
        </p>
        <CodeBlock language="bash" title="Verified commands">
{`clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | wc -l
clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | grep -c "error:"
clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | grep -c "in instantiation of"`}
        </CodeBlock>
        <p>
          Now read the <em>first</em> <code>error:</code> line — not the first line of output, the
          first <code>error:</code> — and write down what it actually requires. For{' '}
          <code>median_of</code> that was <code>__lhs &lt; __rhs</code> and{' '}
          <code>static_cast&lt;double&gt;</code>, which translate to{' '}
          <code>std::totally_ordered</code> and <code>std::convertible_to&lt;T, double&gt;</code>.{' '}
          <strong>That translation step is the skill.</strong> The concept is not something you
          invent; it is a transcription of what the body already demands.
        </p>
        <p>
          Then add the <code>requires</code> clause and run the same three commands. The numbers to
          beat, from this page: <strong>357 / 20 / 55</strong> down to{' '}
          <strong>19 / 1 / 0</strong>. And then the follow-up question, which is the uncomfortable
          one: having written the concept from the body, is there anything the body does that the
          concept does not promise? Because as the <code>Addable</code> measurement showed, nothing
          will tell you.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Concepts;
