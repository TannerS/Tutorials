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

function Compiling() {
  return (
    <LessonLayout
      title="Compiling, Linking & the One-Definition Rule"
      sectionId="cpp"
      lessonIndex={2}
      prev={{ path: '/cpp/intro', label: 'C++ in 2026: Which C++ You\'re Actually Writing' }}
      next={{ path: '/cpp/types', label: 'Types, auto & Control Flow' }}
    >
      <p>
        In Node you write a file and run it. In Java you run <code>javac</code>, or more likely you
        let Gradle do it, and the thing you get back is bytecode that still knows its own class
        names at runtime. Neither model prepares you for what C++ actually does, and the gap is not
        academic trivia — it is the direct cause of the two most common &quot;I can&apos;t get this
        to build&quot; situations, and of a whole class of bug where the build succeeds and the
        program is nonsense anyway.
      </p>
      <p>
        <a href="/cpp/intro">The previous lesson</a> claimed compilation is at least four stages.
        This lesson runs them separately, one command each, and then shows what each stage can and
        cannot know. By the end you should be able to read a build failure and say which stage
        produced it before you read the message — which is most of the skill.
      </p>

      <h2>Four Stages, Run One At A Time</h2>
      <p>
        The <code>clang++</code> you normally type is a <em>driver</em>. It is not a compiler; it is
        a program that runs four other programs in sequence and deletes the intermediate files
        behind itself. Each stage has a flag that makes the driver stop there and keep its output.
      </p>
      <p>
        Here is a two-file program, deliberately boring, so that the interesting thing is the
        pipeline and not the code:
      </p>

      <CodeBlock language="cpp" title="greet.h">
{`#pragma once
#include <string>

// A DECLARATION: tells the compiler the name, types, and nothing else.
std::string greet(const std::string& who);

// A DEFINITION of a constant, allowed in a header because it is inline.
inline constexpr int kGreetVersion = 2;`}
      </CodeBlock>

      <CodeBlock language="cpp" title="greet.cpp">
{`#include "greet.h"

// A DEFINITION: supplies the body. This is what the linker is looking for.
std::string greet(const std::string& who) {
    return "hello, " + who;
}`}
      </CodeBlock>

      <CodeBlock language="cpp" title="main.cpp">
{`#include <print>
#include "greet.h"

int main() {
    std::println("{} (v{})", greet("world"), kGreetVersion);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — four stages, four commands, Apple clang 21.0.0">
{`$ clang++ -std=c++23 -E greet.cpp -o greet.ii      # 1. preprocess only
$ clang++ -std=c++23 -S greet.ii -o greet.s        # 2. compile to assembly
$ clang++ -std=c++23 -c greet.s  -o greet.o        # 3. assemble
$ clang++ -std=c++23 -c main.cpp -o main.o
$ clang++ main.o greet.o -o app                    # 4. link
$ ./app
hello, world (v2)

$ wc -l greet.cpp greet.ii greet.s
       6 greet.cpp
   23014 greet.ii
      30 greet.s
   23050 total

$ stat -f '%-10z %N' greet.cpp greet.ii greet.s greet.o app
170        greet.cpp
1027312    greet.ii
1115       greet.s
888        greet.o
302320     app`}
      </CodeBlock>

      <p>
        Read the sizes, because they tell the whole story of why C++ builds feel the way they do.
        Your six-line source file becomes <strong>23,014 lines and a megabyte of text</strong> after
        the preprocessor, which the compiler then grinds down to <strong>30 lines</strong> of
        assembly and <strong>888 bytes</strong> of object code. The expansion-then-collapse is not a
        quirk; it is the design. And note that stage 2 accepts the <code>.ii</code> file, stage 3
        accepts the <code>.s</code> file — these really are separate programs communicating through
        files, not phases of one monolith.
      </p>

      <FlowChart
        title="The four stages, and which one owns which error"
        chart={
          'graph TD\n' +
          '  SRC["main.cpp<br/>6 lines you wrote"] --> PP\n' +
          '  H1["greet.h"] -.->|"#include — literal text"| PP\n' +
          '  H2["&lt;print&gt;, &lt;string&gt;<br/>and everything they include"] -.->|"#include"| PP\n' +
          '  PP["1. PREPROCESSOR<br/>clang++ -E<br/>text in, text out"] --> TU["TRANSLATION UNIT<br/>greet.ii — 23,014 lines<br/>this is what \'the compiler\' sees"]\n' +
          '  TU --> CC["2. COMPILER<br/>clang++ -S<br/>parse, typecheck, optimise"]\n' +
          '  CC --> ASM["greet.s — 30 lines<br/>arm64 assembly"]\n' +
          '  ASM --> AS["3. ASSEMBLER<br/>clang++ -c"]\n' +
          '  AS --> OBJ["greet.o — 888 bytes<br/>machine code + a SYMBOL TABLE"]\n' +
          '  OBJ --> LD["4. LINKER<br/>ld, invoked by clang++<br/>matches every U to some T"]\n' +
          '  OBJ2["main.o"] --> LD\n' +
          '  LIBS["libc++.1.dylib<br/>libSystem.B.dylib"] -.-> LD\n' +
          '  LD --> EXE["app — 302,320 bytes<br/>an executable"]\n' +
          '  CC -.->|"errors here know<br/>line and column"| E1["COMPILER ERROR<br/>\'use of undeclared identifier\'"]\n' +
          '  LD -.->|"errors here know<br/>only mangled symbol names"| E2["LINKER ERROR<br/>\'Undefined symbols for architecture arm64\'"]\n' +
          '  style TU fill:#3d2f14,stroke:#fb923c\n' +
          '  style OBJ fill:#1a2744,stroke:#5b9cf6\n' +
          '  style EXE fill:#1a3329,stroke:#4ade80\n' +
          '  style E1 fill:#2a1f44,stroke:#a78bfa\n' +
          '  style E2 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h2>The Translation Unit Is The Unit Of Everything</h2>
      <p>
        That orange box in the middle is the concept to actually memorise. A{' '}
        <strong>translation unit</strong> is one source file plus the full recursive text of
        everything it includes. It is the only thing the compiler ever looks at, and it is the unit
        of compilation, of optimisation, and of ignorance.
      </p>
      <p>
        That last word is the one that matters. When the compiler is working on{' '}
        <code>main.cpp</code>, it has <em>no idea</em> that <code>greet.cpp</code> exists. None. It
        cannot look at it, cannot check against it, cannot warn you about it. This is the deepest
        structural difference from both of your day jobs:
      </p>
      <ul>
        <li>
          <strong>Java</strong> — <code>javac</code> resolves <code>com.acme.Greeter</code> by going
          and finding <code>Greeter.class</code> on the classpath and reading its real signatures.
          One compiler invocation has a whole-program view.
        </li>
        <li>
          <strong>Node</strong> — <code>require</code> and <code>import</code> execute at runtime
          against the actual module. There is no separate step to be ignorant during.
        </li>
        <li>
          <strong>C++</strong> — each <code>.cpp</code> is compiled in total isolation and the
          pieces are reconciled afterwards, by a program that has thrown away all the types.
        </li>
      </ul>
      <p>
        Everything peculiar about C++ builds falls out of that. Headers exist because isolated
        compilation needs you to <em>restate</em> the interface in every file that uses it. The
        linker exists because somebody has to reconcile the isolated pieces at the end. And the
        One-Definition Rule exists because the reconciliation is done on trust.
      </p>

      <InfoBox variant="note" title="Where the build time actually goes">
        <p>
          <a href="/cpp/intro">The previous lesson</a> measured the standard headers:{' '}
          <code>&lt;vector&gt;</code> is 40,476 preprocessed lines, <code>&lt;print&gt;</code> is
          44,689, and sixteen headers plus one statement came to 109,902 lines and just under a
          second. The translation-unit model is the mechanism behind those numbers. That work is
          redone from scratch <strong>per translation unit</strong>, because each one is a fresh,
          isolated parse of the same text. Fifty <code>.cpp</code> files that each{' '}
          <code>#include &lt;vector&gt;</code> parse those 40,476 lines fifty times, in fifty
          processes, producing fifty identical copies of the same template instantiations for the
          linker to throw away.
        </p>
      </InfoBox>

      <h2><code>#include</code> Is Not An Import</h2>
      <p>
        This is the single most useful thing a rusty C++ developer can re-internalise, because the
        word &quot;include&quot; sounds like the word &quot;import&quot; and it is nothing like it.
      </p>
      <p>
        <code>#include "foo.h"</code> means: <em>find that file, and paste its entire contents here,
        as text, before the compiler sees any of this.</em> There is no module, no namespace, no
        symbol resolution, no interface. It is copy-paste performed by a program that does not know
        what C++ is.
      </p>
      <p>
        The cleanest proof is to include something that is not a declaration, not a type, not even
        a complete statement — just a fragment of syntax from the middle of an <code>if</code>:
      </p>

      <CodeBlock language="cpp" title="middle.h — a &quot;header&quot; that is a syntax fragment">
{`    total += 1;
} else {
    total -= 1;`}
      </CodeBlock>

      <CodeBlock language="cpp" title="silly.cpp — note where the closing brace comes from">
{`#include <print>

int main() {
    int total = 0;
    bool flag = true;
    if (flag) {
#include "middle.h"
    }
    std::println("total = {}", total);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 silly.cpp -o silly && ./silly">
{`total = 1`}
      </CodeBlock>

      <p>
        It compiles and it runs. The <code>else</code> branch of that <code>if</code> lives in
        another file, and the <code>{'}'}</code> that closes the <code>if (flag) {'{'}</code> came
        out of <code>middle.h</code>. Please never do this. But do hold on to the fact that it{' '}
        <em>works</em>, because once you believe <code>#include</code> is textual, three things stop
        being mysterious:
      </p>
      <ul>
        <li>
          <strong>Include order can matter.</strong> If <code>a.h</code> uses a type that{' '}
          <code>b.h</code> declares, then <code>#include</code>-ing them in the wrong order fails,
          exactly as pasting them in the wrong order would. (Good headers include their own
          dependencies so they are order-independent. Many headers are not good.)
        </li>
        <li>
          <strong>A macro from one header rewrites the next one.</strong> The notorious case is
          Windows&apos; <code>&lt;windows.h&gt;</code> defining <code>min</code> and{' '}
          <code>max</code> as macros, which then mangle every subsequent use of{' '}
          <code>std::max</code>. A macro is not scoped because the preprocessor has no concept of
          scope.
        </li>
        <li>
          <strong>Including a file twice is a real problem</strong> rather than a no-op, which is the
          next section.
        </li>
      </ul>

      <h2>Include Guards And <code>#pragma once</code></h2>
      <p>
        Because inclusion is textual, including the same header twice in one translation unit pastes
        its contents twice. For a declaration that is harmless; for a type definition it is an
        error. And you do not usually do it on purpose — you do it because <code>a.h</code> and{' '}
        <code>b.h</code> both include <code>point.h</code>, and your file includes both.
      </p>

      <CodeBlock language="cpp" title="point_noguard.h and dbl.cpp — the unguarded case, done on purpose">
{`// point_noguard.h
struct Point { int x, y; };

// dbl.cpp
#include "point_noguard.h"
#include "point_noguard.h"   // a second, innocent-looking include
int main() { Point p{1, 2}; return p.x; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 dbl.cpp">
{`In file included from dbl.cpp:2:
./point_noguard.h:1:8: error: redefinition of 'Point'
    1 | struct Point { int x, y; };
      |        ^
dbl.cpp:1:10: note: './point_noguard.h' included multiple times, additional
      include site here
    1 | #include "point_noguard.h"
      |          ^
./point_noguard.h:1:8: note: unguarded header; consider using #ifdef guards
      or #pragma once
    1 | struct Point { int x, y; };
      |        ^
1 error generated.`}
      </CodeBlock>

      <p>
        Clang diagnoses this unusually well — it names the duplicate include sites and tells you the
        fix. There are two spellings of that fix:
      </p>

      <CodeBlock language="cpp" title="The two guard styles">
{`// Style 1: the classic include guard. Portable to every compiler ever made.
#ifndef ACME_POINT_H
#define ACME_POINT_H

struct Point { int x, y; };

#endif  // ACME_POINT_H


// Style 2: #pragma once. One line, cannot be got wrong.
#pragma once

struct Point { int x, y; };`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use #pragma once">
        <p>
          It is not in the standard, which is the only argument against it, and that argument is
          twenty years stale: GCC, Clang, MSVC, ICC and every compiler you will plausibly meet
          support it. In exchange you cannot make the two mistakes the classic form invites — a
          guard macro that collides with another header&apos;s (which silently makes the second
          header empty, producing a baffling &quot;undeclared identifier&quot; for a type you are
          looking right at), and a <code>#define</code> line that does not match the{' '}
          <code>#ifndef</code> after a copy-paste.
        </p>
        <p>
          If your codebase already uses classic guards, keep using them; consistency beats
          correctness here, and both work.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="A guard protects one translation unit, not the program">
        <p>
          This is the misconception that produces the duplicate-symbol error later in this lesson.{' '}
          <code>#pragma once</code> and <code>#ifndef</code> guards are <em>preprocessor</em>{' '}
          mechanisms, and the preprocessor runs separately for every single{' '}
          <code>.cpp</code> file. The guard stops <code>point.h</code> being pasted twice into{' '}
          <code>a.cpp</code>. It does nothing whatsoever to stop it being pasted once into{' '}
          <code>a.cpp</code> <em>and</em> once into <code>b.cpp</code> — which is the normal,
          intended case, and which is exactly why a header may not contain an ordinary function
          definition.
        </p>
      </InfoBox>

      <h2>Declaration Versus Definition</h2>
      <p>
        Java does not make you care about this distinction, because a method signature and its body
        live in the same place. C++ separates them, and the separation is what makes isolated
        compilation possible.
      </p>
      <ul>
        <li>
          A <strong>declaration</strong> introduces a name and its type. It is a promise:{' '}
          <em>this exists somewhere, here is its shape, typecheck my calls against it.</em>
        </li>
        <li>
          A <strong>definition</strong> supplies the thing itself — a function body, a class&apos;s
          members, storage for a variable. It is what gets turned into bytes.
        </li>
      </ul>
      <p>
        You may declare a thing as many times as you like. You may define a function or a variable{' '}
        <em>once</em> in the whole program. That one-sentence asymmetry is the One-Definition Rule,
        and the linker is the thing that enforces it.
      </p>

      <CodeBlock language="cpp" title="Which of these is which">
{`// --- DECLARATIONS (safe in a header, repeat as needed) ---
int add(int a, int b);                 // function declaration: no body
extern int g_counter;                  // variable declaration: 'extern' = elsewhere
class Widget;                          // forward declaration of a type
using Id = long long;                  // type alias

// --- DEFINITIONS (exactly one per program) ---
int add(int a, int b) { return a + b; }   // body supplied
int g_counter = 0;                        // storage allocated

// --- DEFINITIONS that are nonetheless allowed in a header ---
struct Point { int x, y; };               // a class definition: one per TU is fine
inline int twice(int n) { return n * 2; } // 'inline' permits identical copies
constexpr int kMax = 100;                 // implicitly internal-linkage
template <class T> T id(T v) { return v; }// templates must be visible to be used`}
      </CodeBlock>

      <p>
        The third group is the one worth staring at. A class definition, an <code>inline</code>{' '}
        function, a <code>constexpr</code> variable and a template are all definitions, and all four
        are allowed to appear in every translation unit — provided every copy is{' '}
        <strong>token-for-token identical</strong>. That proviso is the whole subject of the ODR
        section below, and violating it is where the silent disasters live.
      </p>

      <FlowChart
        title="What the compiler emits, and what the linker does with it"
        chart={
          'graph LR\n' +
          '  subgraph TUA["use.cpp — a translation unit"]\n' +
          '    DA["DECLARATION<br/>std::string greet(const std::string&amp;);<br/>name + types, no body"] --> CA["compiler is satisfied:<br/>it can typecheck the call"]\n' +
          '    CA --> UA["emits U greet(...)<br/>\'somebody owes me this\'"]\n' +
          '  end\n' +
          '  subgraph TUB["api.cpp — a different translation unit"]\n' +
          '    DB["DEFINITION<br/>std::string greet(const std::string&amp; w) { ... }<br/>name + types + body"] --> TB["emits T greet(...)<br/>\'here it is, at this address\'"]\n' +
          '  end\n' +
          '  UA --> LK{"LINKER<br/>can every U be matched<br/>to exactly one T?"}\n' +
          '  TB --> LK\n' +
          '  LK -->|"zero matches"| Z["Undefined symbols<br/>for architecture arm64"]\n' +
          '  LK -->|"exactly one"| O["linked"]\n' +
          '  LK -->|"two or more"| M["duplicate symbol"]\n' +
          '  style O fill:#1a3329,stroke:#4ade80\n' +
          '  style Z fill:#3b1a1a,stroke:#f87171\n' +
          '  style M fill:#3b1a1a,stroke:#f87171\n' +
          '  style DA fill:#1a2744,stroke:#5b9cf6\n' +
          '  style DB fill:#3d2f14,stroke:#fb923c'
        }
      />

      <p>
        Those <code>T</code> and <code>U</code> letters are not an abstraction — they are literally
        what <code>nm</code> prints. <code>T</code> is a symbol defined in this object file&apos;s
        text section; <code>U</code> is one it needs from somewhere else. Here is{' '}
        <code>greet.o</code> from the top of the lesson:
      </p>

      <CodeBlock language="text" title="Real output — nm greet.o, then the same piped through c++filt">
{`$ nm greet.o
0000000000000000 T __Z5greetRKNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE
                 U __ZNSt3__1plIcNS_11char_traitsIcEENS_9allocatorIcEEEENS_12basic_stringIT_T0_T1_EEPKS6_RKS9_

$ nm greet.o | c++filt
0000000000000000 T greet(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&)
                 U std::__1::basic_string<...> std::__1::operator+<...>(char const*, std::__1::basic_string<...> const&)`}
      </CodeBlock>

      <p>
        One <code>T</code>: we defined <code>greet</code>. One <code>U</code>: we used{' '}
        <code>operator+</code> on a string and did not define it, so the linker will have to find it
        in <code>libc++</code>. That mangled name is the key insight about linkers — the C++ types
        have been <em>encoded into the symbol string</em>, because the linker itself has no type
        system. <code>RKNSt3__112basic_stringIcE...E</code> is how{' '}
        <code>const std::string&amp;</code> is spelled once the type checker has gone home.
      </p>

      <InfoBox variant="tip" title="c++filt is the tool you will actually use most">
        <p>
          Every incomprehensible C++ linker error becomes readable by piping it through{' '}
          <code>c++filt</code>, which ships with the toolchain. <code>nm -C</code> does the same for
          symbol listings on GNU binutils; on this Apple toolchain <code>nm | c++filt</code> is the
          reliable spelling. Make it a reflex before you start guessing: the demangled symbol tells
          you the <em>exact</em> signature the linker wanted, which is usually the entire bug.
        </p>
      </InfoBox>

      <h2>The Two Error Families</h2>
      <p>
        Newcomers conflate these constantly, and the conflation wastes real time because the two
        families need opposite debugging approaches. Here is the same mistake — calling a{' '}
        <code>greet</code> that has no body anywhere — made twice, with one line of difference.
      </p>

      <h3>Family 1: a compiler error</h3>

      <CodeBlock language="cpp" title="ce.cpp — no declaration in scope">
{`#include <print>
int main() {
    std::println("{}", greet("world"));   // never declared anywhere
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -c ce.cpp">
{`ce.cpp:3:24: error: use of undeclared identifier 'greet'
    3 |     std::println("{}", greet("world"));   // never declared anywhere
      |                        ^~~~~
1 error generated.`}
      </CodeBlock>

      <h3>Family 2: a linker error</h3>
      <p>Add the declaration. Change nothing else.</p>

      <CodeBlock language="cpp" title="le.cpp — declared, still never defined">
{`#include <print>
#include <string>
std::string greet(const std::string& who);   // declared, never defined
int main() {
    std::println("{}", greet("world"));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — compile succeeds, link fails">
{`$ clang++ -std=c++23 -Wall -Wextra -c le.cpp -o le.o
(no output — zero diagnostics)

$ clang++ le.o -o le
Undefined symbols for architecture arm64:
  "greet(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&)", referenced from:
      _main in le.o
ld: symbol(s) not found for architecture arm64
clang++: error: linker command failed with exit code 1 (use -v to see invocation)`}
      </CodeBlock>

      <p>
        Same bug, two completely different experiences. The compiler error knows the file, the line,
        the column, and draws an arrow at the token. The linker error knows a mangled symbol and an
        architecture, and the <em>most</em> it can tell you about location is which object file
        referenced it. There is no line number because line numbers were discarded two stages ago.
      </p>
      <p>
        The practical consequence: <strong>a linker error is never about the line you are looking
        at.</strong> It is about your build — a <code>.cpp</code> missing from the command line, a
        library not passed, a signature that does not match the declaration. Reading the source
        harder will not help.
      </p>

      <h3>The trap: a signature that almost matches</h3>
      <p>
        Here is the version of this that costs people an afternoon. The declaration and the
        definition differ by one qualifier.
      </p>

      <CodeBlock language="cpp" title="api.h / api.cpp — spot the difference">
{`// api.h
#pragma once
#include <string>
std::string greet(const std::string& who);   // declared: const reference

// api.cpp
#include "api.h"
// Oops: defined taking std::string BY VALUE.
// Different parameter type, therefore a different mangled name,
// therefore — as far as the linker is concerned — a different function.
std::string greet(std::string who) { return "hello, " + who; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — both files compile clean with -Wall -Wextra, then the link fails">
{`$ clang++ -std=c++23 -Wall -Wextra -c api.cpp -o api.o
$ clang++ -std=c++23 -Wall -Wextra -c use.cpp -o use.o
(no output from either — zero diagnostics)

$ clang++ api.o use.o -o app
Undefined symbols for architecture arm64:
  "greet(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> const&)", referenced from:
      _main in use.o
ld: symbol(s) not found for architecture arm64`}
      </CodeBlock>

      <p>
        Note what <code>api.cpp</code> saw: it included the header with the <code>const&amp;</code>{' '}
        declaration and then defined the by-value version, and clang said nothing, because{' '}
        <strong>that is a legal overload</strong>. Two functions named <code>greet</code>, one
        declared and one defined. Perfectly well-formed C++, and completely useless.
      </p>
      <p>
        This is why demangling first is the right move. The linker told you it wanted{' '}
        <code>const&amp;</code>; you have a by-value definition sitting in front of you; the bug is
        now obvious rather than mysterious. The usual real-world flavours of this are a forgotten{' '}
        <code>const</code> on a member function, a mismatched <code>extern &quot;C&quot;</code>, or
        two files compiled against different versions of the same header.
      </p>

      <FlowChart
        title="Triage: which half of the build is complaining?"
        chart={
          'graph TD\n' +
          '  Q["The build failed. Which half?"] --> A{"Does the message have<br/>a file, line and column?"}\n' +
          '  A -->|"yes: foo.cpp:12:5: error"| C["COMPILER<br/>one translation unit is ill-formed"]\n' +
          '  A -->|"no: just a symbol name<br/>and an architecture"| L["LINKER<br/>all TUs were fine individually"]\n' +
          '  C --> C1["Typo, missing #include,<br/>wrong types, syntax"]\n' +
          '  C1 --> C2["Fix: in THIS file,<br/>or a header it includes"]\n' +
          '  L --> L2{"Undefined, or duplicate?"}\n' +
          '  L2 -->|"Undefined symbols"| U["You declared it and never defined it,<br/>or the .cpp/.a is not on the link line,<br/>or the signature does not match"]\n' +
          '  L2 -->|"duplicate symbol"| D["A non-inline definition in a header,<br/>or the same .cpp linked twice"]\n' +
          '  U --> UF["Fix: c++filt the symbol first.<br/>It tells you the exact signature wanted."]\n' +
          '  D --> DF["Fix: inline it, make it constexpr,<br/>or move it to one .cpp"]\n' +
          '  style C fill:#2a1f44,stroke:#a78bfa\n' +
          '  style L fill:#3b1a1a,stroke:#f87171\n' +
          '  style UF fill:#1a3329,stroke:#4ade80\n' +
          '  style DF fill:#1a3329,stroke:#4ade80'
        }
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}>Compiler error</th>
            <th style={headStyle}>Linker error</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Scope of knowledge</td>
            <td style={cellStyle}>one translation unit</td>
            <td style={cellStyle}>all object files and libraries, no types</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Message shape</td>
            <td style={cellStyle}><code>file:line:col: error: ...</code> with a caret</td>
            <td style={cellStyle}>a mangled symbol and an architecture</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Typical cause</td>
            <td style={cellStyle}>typo, missing include, type mismatch</td>
            <td style={cellStyle}>missing definition, missing <code>.cpp</code> or{' '}
              <code>-l</code>, signature mismatch</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Where you fix it</td>
            <td style={cellStyle}>the named line</td>
            <td style={cellStyle}>another file, or the build command</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>First move</td>
            <td style={cellStyle}>read the top error, ignore the rest</td>
            <td style={cellStyle}>pipe it through <code>c++filt</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Nearest Java analogue</td>
            <td style={cellStyle}><code>javac</code> error</td>
            <td style={cellStyle}><code>NoSuchMethodError</code> at runtime — same
              &quot;compiled against a different version&quot; feeling</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="The Java analogue is closer than it looks">
        <p>
          You have met the linker&apos;s failure mode before, under a different name. A Java{' '}
          <code>NoSuchMethodError</code> happens when <code>A.class</code> was compiled against one
          version of <code>B</code> and run against another — compile-time agreement, runtime
          disagreement. C++ has the same hazard with the same cause, except the reconciliation
          happens at link time instead of class-load time, so you find out before you ship. That is
          genuinely the better end of the trade.
        </p>
      </InfoBox>

      <h2>The One-Definition Rule</h2>
      <p>
        Stated plainly, the ODR has two halves and the second one is the dangerous one:
      </p>
      <ol>
        <li>
          Every function or variable that is used must have <strong>exactly one definition</strong>{' '}
          in the whole program. Zero is a linker error. Two is a linker error.
        </li>
        <li>
          Entities that <em>are</em> permitted multiple definitions — classes,{' '}
          <code>inline</code> functions, templates — must have definitions that are{' '}
          <strong>token-for-token identical and mean the same thing</strong> in every translation
          unit. Violating this is <strong>undefined behaviour, and nothing is required to detect
          it.</strong>
        </li>
      </ol>

      <h3>Half one: the duplicate-symbol error</h3>
      <p>
        This is the one everybody hits within a week of writing their first multi-file C++ program,
        and it is the direct consequence of the earlier warning that a guard protects one
        translation unit rather than the program.
      </p>

      <CodeBlock language="cpp" title="util.h — a function definition in a header, with a guard">
{`#pragma once
#include <string>

// A FUNCTION DEFINITION in a header. The guard does NOT save you:
// it only stops double inclusion within ONE translation unit.
std::string tag() { return "util"; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — both TUs compile clean, the link does not">
{`$ clang++ -std=c++23 -Wall -Wextra -c a.cpp -o a.o   # includes util.h
$ clang++ -std=c++23 -Wall -Wextra -c b.cpp -o b.o   # also includes util.h
(both OK, zero diagnostics)

$ clang++ a.o b.o -o app
duplicate symbol 'tag()' in:
    .../dupsym/a.o
    .../dupsym/b.o
ld: 1 duplicate symbols
clang++: error: linker command failed with exit code 1`}
      </CodeBlock>

      <p>
        Two object files, each containing a full definition of <code>tag</code>, each a legitimate{' '}
        <code>T</code> symbol. The linker is asked to pick one and refuses, correctly, because
        picking silently would be worse.
      </p>

      <CodeBlock language="text" title="Real output — the fix is one keyword">
{`$ # util.h now reads:  inline std::string tag() { return "util"; }
$ clang++ -std=c++23 -c a.cpp -o a.o && clang++ -std=c++23 -c b.cpp -o b.o
$ clang++ a.o b.o -o app && ./app
util util`}
      </CodeBlock>

      <p>
        Three ways out, in order of how often they are right:
      </p>
      <ul>
        <li>
          <strong>Move the definition into one <code>.cpp</code></strong> and leave only the
          declaration in the header. This is the default for anything non-trivial, and it keeps your
          build times down.
        </li>
        <li>
          <strong>Mark it <code>inline</code></strong> (or <code>constexpr</code>, which implies it
          for functions). This tells the linker &quot;expect several identical copies, keep one.&quot;
          Right for small functions and for header-only libraries.
        </li>
        <li>
          <strong>Put it in an anonymous namespace</strong> —{' '}
          <code>namespace {'{'} ... {'}'}</code> — which gives every translation unit its own
          private copy with internal linkage. Right when you genuinely want per-TU state, wrong
          otherwise, because you get N copies instead of one and nobody can share them.
        </li>
      </ul>

      <InfoBox variant="note" title="What inline actually means here">
        <p>
          Notice what the fix did and did not do. <code>inline</code> did not make anything faster
          and did not ask the compiler to paste the body at the call site. It changed the{' '}
          <strong>linkage</strong>: the symbol goes into the object file marked for deduplication
          rather than as a unique definition, and the linker keeps one. On this toolchain{' '}
          <code>nm -m</code> shows the exact marking:
        </p>
        <CodeBlock language="text" title="Real output — nm -m on an object file containing an inline function">
{`0000000000000160 (__TEXT,__text) weak external __Z12widget_bytesv`}
        </CodeBlock>
        <p>
          <code>weak external</code> is the linker&apos;s word for &quot;I have one of these, and so
          might everyone else; keep any one.&quot; The optimisation hint meaning of{' '}
          <code>inline</code> is vestigial and compilers largely ignore it —{' '}
          <a href="/cpp/functions">Functions, Overloading &amp; Lambdas</a> takes that apart
          properly.
        </p>
      </InfoBox>

      <h3>Half two: the silent one</h3>
      <p>
        Now the part that matters, and the reason the ODR gets its own name instead of being
        filed under &quot;linker errors.&quot; When the <em>same</em> entity has definitions that
        differ between translation units, you get undefined behaviour with no diagnostic from any
        stage of the build.
      </p>
      <p>
        You do not have to be careless to cause this. The ordinary way is a header whose meaning
        depends on a macro, and two translation units compiled with different macro settings —
        a feature flag, <code>NDEBUG</code>, a <code>-D</code> that is set in one target&apos;s
        flags and not another&apos;s.
      </p>

      <CodeBlock language="cpp" title="widget.h">
{`#pragma once

struct Widget {
    int id;
#ifdef WITH_TELEMETRY
    long long telemetry;      // present only in TUs built with -DWITH_TELEMETRY
#endif
    int size;
};

// Defined in a header, so the compiler emits one copy per translation unit
// and the linker is required to keep exactly ONE of them.
inline int widget_bytes() { return sizeof(Widget); }

void report_from_b();`}
      </CodeBlock>

      <CodeBlock language="cpp" title="a2.cpp and b2.cpp — each just reports what it believes">
{`// a2.cpp
#include <cstdio>
#include <print>
#include "widget.h"

int main() {
    std::println("TU a: sizeof(Widget) = {}", sizeof(Widget));
    std::println("TU a: widget_bytes() = {}", widget_bytes());
    std::fflush(stdout);
    report_from_b();
}

// b2.cpp
#include <cstdio>
#include <print>
#include "widget.h"

void report_from_b() {
    std::println("TU b: sizeof(Widget) = {}", sizeof(Widget));
    std::println("TU b: widget_bytes() = {}", widget_bytes());
    std::fflush(stdout);
}`}
      </CodeBlock>

      <p>
        Compile <code>a2.cpp</code> without the flag and <code>b2.cpp</code> with it — which is
        exactly what a build system does when two targets disagree — and then look at what the
        link order does to the answer:
      </p>

      <CodeBlock language="text" title="Real output — -O0, both TUs compiled with -Wall -Wextra, zero diagnostics anywhere">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 -c a2.cpp -o a2.o
$ clang++ -std=c++23 -Wall -Wextra -O0 -DWITH_TELEMETRY -c b2.cpp -o b2.o
$ clang++ a2.o b2.o -o app2            # links clean, no warning
$ ./app2
TU a: sizeof(Widget) = 8
TU a: widget_bytes() = 8
TU b: sizeof(Widget) = 24
TU b: widget_bytes() = 8          <-- TU b asked for its own sizeof and got A's

$ clang++ b2.o a2.o -o app2r           # SAME object files, order swapped
$ ./app2r
TU a: sizeof(Widget) = 8
TU a: widget_bytes() = 24         <-- now TU a gets B's answer
TU b: sizeof(Widget) = 24
TU b: widget_bytes() = 24`}
      </CodeBlock>

      <p>
        Sit with that. <strong>The value returned by <code>widget_bytes()</code> depends on the
        order of the object files on the link command line.</strong> Nothing about the source
        changed. Both copies were <code>weak external</code>, the linker kept whichever it saw
        first, and every caller in the program got that one — including the translation unit whose
        own <code>sizeof</code> disagrees with it, two lines earlier, in the same function.
      </p>
      <p>
        And it gets worse at a higher optimisation level, in a different direction:
      </p>

      <CodeBlock language="text" title="Real output — identical sources at -O2">
{`$ clang++ -std=c++23 -Wall -Wextra -O2 -c a2.cpp -o a2.o
$ clang++ -std=c++23 -Wall -Wextra -O2 -DWITH_TELEMETRY -c b2.cpp -o b2.o
$ clang++ a2.o b2.o -o app2 && ./app2
TU a: sizeof(Widget) = 8
TU a: widget_bytes() = 8
TU b: sizeof(Widget) = 24
TU b: widget_bytes() = 24         <-- different answer from -O0, and link order
                                      no longer matters`}
      </CodeBlock>

      <p>
        At <code>-O2</code> the compiler inlined its local copy of <code>widget_bytes</code> into
        each caller, so each translation unit got its own answer and the surviving symbol became
        irrelevant. Both behaviours are legal: the compiler is <em>entitled</em> to assume the
        definitions are identical, so it is free to use its local one or to call the shared one, and
        there is no observable difference — unless you have lied, in which case there is.
      </p>
      <p>
        This is the same shape as the signed-overflow demonstration in{' '}
        <a href="/cpp/intro">the previous lesson</a>, and it is the shape of UB generally: the
        optimiser is not malicious, it is taking you at your word.
      </p>

      <InfoBox variant="danger" title="And when the mismatched layout gets written through">
        <p>
          The version above only <em>reads</em>. Make the two translation units write to the same
          object and the consequence stops being a wrong number. Same <code>Widget</code>, same{' '}
          <code>#ifdef</code>, but the header now declares a function that takes a reference:
        </p>
        <CodeBlock language="cpp" title="widget2.h, a3.cpp, b3.cpp">
{`// widget2.h -- same struct and #ifdef as before, plus:
void write_in_b(Widget& w);

// a3.cpp -- compiled WITHOUT the flag
int main() {
    Widget w{};
    std::println("TU a: offset of size = {}", (char*)&w.size - (char*)&w);
    std::fflush(stdout);
    write_in_b(w);            // b writes at ITS offset, into A's 8-byte object
    std::println("TU a: survived, w.size = {}", w.size);
}

// b3.cpp -- compiled WITH the flag
void write_in_b(Widget& w) {
    std::println("TU b: offset of size = {}", (char*)&w.size - (char*)&w);
    std::fflush(stdout);
    w.size = 99;
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — -O0, compiles clean, links clean, identical across three runs">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 -c a3.cpp -o a3.o
$ clang++ -std=c++23 -Wall -Wextra -O0 -DWITH_TELEMETRY -c b3.cpp -o b3.o
$ clang++ a3.o b3.o -o app3
(no diagnostics from any of the three commands)

$ ./app3
TU a: offset of size = 4
TU b: offset of size = 16
$ echo $?
138`}
        </CodeBlock>
        <p>
          The program never reached its last line. Exit status 138 is 128 + 10, and signal 10 on this
          platform is <strong>SIGBUS</strong> (confirmed with <code>kill -l</code>). The two
          translation units disagree about where the <code>size</code> field lives — offset 4 in one,
          offset 16 in the other — so <code>w.size = 99</code> wrote eight bytes past the end of an
          8-byte stack object, trampled the frame, and the process died on the way out. No warning at
          compile time, no warning at link time, and a crash whose stack trace points at innocent
          code.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="How to not do this">
        <p>
          The defence is boring and effective: <strong>compile every translation unit in a program
          with the same flags</strong>, and never let a macro change the layout of a type or the
          body of an <code>inline</code> function. Concretely —
        </p>
        <ul>
          <li>
            Set standard, warning and <code>-D</code> flags once, at the top of the build, not
            per-target. This is the main reason people use a build generator rather than hand-rolled
            commands.
          </li>
          <li>
            Never put a <code>#ifdef</code> inside a <code>struct</code> or <code>class</code> that
            crosses a library boundary. If the layout must be configurable, put the configuration in
            a type parameter or behind an opaque pointer, so a mismatch becomes a compile error.
          </li>
          <li>
            Treat a prebuilt library as compiled with <em>its</em> flags, not yours. Mixing a release
            library into a debug build is a textbook ODR violation when the headers contain{' '}
            <code>#ifdef NDEBUG</code>.
          </li>
          <li>
            <code>-flto</code> will catch some of these, because link-time optimisation gives the
            optimiser a whole-program view and it can then notice the disagreement. It is a
            detection side-effect, not a guarantee.
          </li>
        </ul>
      </InfoBox>

      <h2>C++20 Modules: What This Compiler Actually Does</h2>
      <p>
        Everything above is the consequence of a 1972 design — textual inclusion, isolated
        translation, trust-based reconciliation. C++20 added <strong>modules</strong>, which replace
        it properly: a module is compiled once into a binary interface, imported by name, and its
        macros do not leak. The answer to &quot;why does my build take thirty seconds&quot; is
        supposed to be &quot;because you are still using headers.&quot;
      </p>
      <p>
        The honest question is whether you can use them. That got checked here rather than assumed,
        and the result is more interesting than either &quot;yes&quot; or &quot;no.&quot;
      </p>
      <p>
        Straight out of the box, the keyword does not exist:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 m.cpp, where m.cpp begins with `import std;`">
{`m.cpp:1:1: error: unknown type name 'import'
    1 | import std;
      | ^
m.cpp:4:5: error: 'std' is not a class, namespace, or enumeration
    4 |     std::println("hello from a module");
      |     ^
2 errors generated.`}
      </CodeBlock>

      <p>
        <code>-std=c++26</code> gives the identical two errors, and{' '}
        <code>clang++ -std=c++23 -dM -E -x c++ /dev/null</code> does not define{' '}
        <code>__cpp_modules</code> at all — the feature-test macro that is supposed to announce
        support. So on a default invocation, C++ modules are simply not on, at any standard level.
      </p>
      <p>
        But they are present. Two things had to be found. First, the libc++ module interface source{' '}
        <em>does</em> ship with the toolchain, at{' '}
        <code>/usr/share/libc++/v1/std.cppm</code> — it is just not pre-built, so you compile it
        yourself. Second, the flag that enables the syntax is <code>-fcxx-modules</code>; neither{' '}
        <code>-fmodules</code> nor <code>--precompile</code> on its own is enough. With both of
        those, it works:
      </p>

      <CodeBlock language="text" title="Real output — building the std module, then using it">
{`$ clang++ -std=c++23 -fcxx-modules -Wno-reserved-module-identifier \\
      --precompile -o std.pcm /usr/share/libc++/v1/std.cppm
real 1.17
$ stat -f '%z bytes' std.pcm
33031636 bytes

$ cat m.cpp
import std;

int main() {
    std::println("hello from a module");
}

$ clang++ -std=c++23 -fcxx-modules -fmodule-file=std=std.pcm m.cpp -o m && ./m
hello from a module`}
      </CodeBlock>

      <p>
        And the payoff is real. The same hello-world written both ways, measured three times each
        after the <code>std.pcm</code> already exists:
      </p>

      <CodeBlock language="text" title="Real output — lines reaching the compiler, and -O2 compile time">
{`                    lines after preprocessing     compile time (3 runs)
#include <print>              44689                0.80  0.66  0.64
import std;                      12                0.50  0.50  0.50`}
      </CodeBlock>

      <p>
        <strong>44,689 lines down to 12</strong>, and about 22% off the compile time of a program
        that prints one string — on a file where almost all of the remaining half-second is process
        startup and linking. On a real translation unit the ratio gets better, because the saved work
        scales with how many headers you were pulling in.
      </p>

      <InfoBox variant="warning" title="So should you use modules? Not yet, and here is the honest reason">
        <p>
          Everything above worked, which is more than was true two years ago. But count what it took:
          a compiler flag that is not in any tutorial, a 33 MB artefact you build yourself from a
          path you have to go find, and an explicit{' '}
          <code>-fmodule-file=std=std.pcm</code> on every single compile command. That last one is
          the killer. Modules require the build system to compile things in{' '}
          <em>dependency order</em> and to pass the right <code>.pcm</code> files to each
          translation unit — which means it has to scan your sources for <code>import</code>{' '}
          declarations before it can schedule anything. Headers never needed that, which is why
          every build tool you have ever used assumes it is unnecessary.
        </p>
        <p>
          The practical state in 2026: the compiler side is largely done, the build-system side is
          where the friction is, and support for a prebuilt <code>std</code> module varies by
          platform and by how your standard library was packaged. Treat modules as something to
          watch and to try on a greenfield project, not something to migrate a codebase to this
          quarter. The rest of this section uses <code>#include</code>, because that is what you will
          be reading and writing.
        </p>
        <p>
          <strong>And note the general lesson</strong>, which is the one this section keeps
          repeating: &quot;clang does not support modules&quot; and &quot;modules work fine&quot;
          were both wrong. The truth was a flag away, and the only way to find it was to run the
          thing.
        </p>
      </InfoBox>

      <h2>The Practical Residue</h2>
      <p>
        Five rules that follow from everything above, which is most of what you need day to day.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Rule</th>
            <th style={headStyle}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>#pragma once</code> at the top of every header</td>
            <td style={cellStyle}>inclusion is textual, and diamond includes are normal</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Headers hold declarations; <code>.cpp</code> files hold definitions</td>
            <td style={cellStyle}>one definition per program, and smaller TUs build faster</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A definition in a header must be <code>inline</code>,{' '}
              <code>constexpr</code>, a class, or a template</td>
            <td style={cellStyle}>otherwise it is a duplicate symbol in every TU that includes it</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Every header includes what it uses</td>
            <td style={cellStyle}>it is pasted into contexts you have never seen, in any order</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Identical flags across the whole program</td>
            <td style={cellStyle}>differing flags silently change what a header means</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="Before you move on">
        <p>
          The thing to carry forward is not the flag list — it is the translation unit. Every C++
          file you read is compiled by a process that knows nothing about any other file in your
          project, and the pieces are reconciled afterwards by a program that has lost the type
          system and sees only mangled strings. Headers, the ODR, duplicate symbols, undefined
          symbols, and the whole 33 MB modules adventure are all consequences of that one
          architectural fact.
        </p>
        <p>
          And one habit: when a build fails, look for a <code>file:line:col</code> before you look
          at anything else. Present means the compiler is talking and the answer is on that line.
          Absent means the linker is talking and the answer is somewhere else entirely — pipe it
          through <code>c++filt</code> and read what it asked for.
        </p>
        <p>
          <a href="/cpp/types">Next: Types, auto &amp; Control Flow</a> — including real{' '}
          <code>sizeof</code> values from this machine, which, as the ODR demonstration above should
          have suggested, are not as fixed as Java has trained you to expect.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Compiling;
