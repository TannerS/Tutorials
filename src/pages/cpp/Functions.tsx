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

function Functions() {
  return (
    <LessonLayout
      title="Functions, Overloading & Lambdas"
      sectionId="cpp"
      lessonIndex={3}
      prev={{ path: '/cpp/types', label: 'Types, auto & Control Flow' }}
      next={{ path: '/cpp/references', label: 'Values, References & Pointers' }}
    >
      <p>
        In Java and JavaScript, passing an argument is free and you never think about it. A
        parameter of class type receives a reference; the object stays where it is; the only thing
        copied is a machine word. There is no decision to make, so there is no decision syntax.
      </p>
      <p>
        C++ has three ways to pass one argument and they differ by a factor of hundreds. Getting
        that choice wrong is the single most common performance defect in C++ written by people
        coming from a managed language, and it is invisible — the code compiles, the tests pass, and
        a thousand heap allocations happen that nobody asked for. This lesson starts there, because
        it is the real content, and because it is the direct setup for{' '}
        <a href="/cpp/references">the next lesson</a> and the memory phase after it.
      </p>
      <p>
        Then: overloading and how the compiler actually picks, default arguments and the one that
        will catch you, what <code>inline</code> means in 2026 (measured, because the folklore is
        wrong), the three ways to pass behaviour around and what each costs, and lambdas in enough
        depth to avoid the trap that produces the ugliest bugs in the language.
      </p>

      <h2>Pass By Value, Reference, Or <code>const</code> Reference</h2>
      <p>
        The three forms, and what each one actually does:
      </p>

      <CodeBlock language="cpp" title="The three parameter forms">
{`void by_value(Big b);        // b is a NEW Big, copy-constructed from the argument
void by_ref(Big& b);         // b is an alias for the caller's object; writes are visible
void by_cref(const Big& b);  // same alias, but read-only`}
      </CodeBlock>

      <p>
        The thing to be concrete about is <em>what gets copied</em>, because &quot;a copy&quot; in
        C++ is not one machine word. Here is a type that announces its own copies and moves:
      </p>

      <CodeBlock language="cpp" title="pass.cpp">
{`#include <print>
#include <string>
#include <vector>

struct Big {
    std::string name;
    std::vector<int> data;

    Big(std::string n, int count) : name(std::move(n)), data(count, 1) {}
    Big(const Big& o) : name(o.name), data(o.data) { std::println("  COPY   ctor"); }
    Big(Big&& o) noexcept : name(std::move(o.name)), data(std::move(o.data)) {
        std::println("  MOVE   ctor");
    }
    ~Big() = default;
};

void by_value(Big b)        { (void)b.data.size(); }
void by_ref(Big& b)         { (void)b.data.size(); }
void by_cref(const Big& b)  { (void)b.data.size(); }

int main() {
    Big b{"a-string-long-enough-to-allocate-on-the-heap", 1000};

    std::println("by_value(b):");  by_value(b);
    std::println("by_ref(b):");    by_ref(b);
    std::println("by_cref(b):");   by_cref(b);
    std::println("by_value(std::move(b)):"); by_value(std::move(b));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 pass.cpp && ./pass">
{`by_value(b):
  COPY   ctor
by_ref(b):
by_cref(b):
by_value(std::move(b)):
  MOVE   ctor`}
      </CodeBlock>

      <p>
        Three calls, one copy. Both reference forms produced nothing at all — no constructor ran,
        because no object was created. And the fourth call shows the escape hatch:{' '}
        <code>std::move</code> on the argument made the by-value parameter steal the buffers instead
        of copying them, so a <code>MOVE</code> happened instead of a <code>COPY</code>. (Moves get
        their own treatment in the memory phase; for now, note only that the by-value parameter did
        not have to be expensive.)
      </p>
      <p>
        Now the same question answered in bytes, by replacing global <code>operator new</code> with a
        counting version — because &quot;a copy is expensive&quot; is a claim, and claims get
        measured here:
      </p>

      <CodeBlock language="cpp" title="passcost.cpp">
{`#include <print>
#include <string>
#include <vector>
#include <cstdlib>
#include <new>

static long allocs = 0, bytes = 0;
void* operator new(std::size_t n) { ++allocs; bytes += (long)n; return std::malloc(n); }
void  operator delete(void* p) noexcept { std::free(p); }
void  operator delete(void* p, std::size_t) noexcept { std::free(p); }

struct Big { std::string name; std::vector<int> data; };

void by_value(Big b)       { (void)b.data.size(); }
void by_cref(const Big& b) { (void)b.data.size(); }

int main() {
    Big b{"a-string-long-enough-to-allocate-on-the-heap", std::vector<int>(1000, 1)};
    std::println("sizeof(Big)      = {}", sizeof(Big));
    std::println("sizeof(Big&)     = {}  (a reference is a pointer in practice)", sizeof(Big*));

    allocs = bytes = 0;
    for (int i = 0; i < 100; ++i) by_value(b);
    std::println("100x by_value : {} allocations, {} bytes", allocs, bytes);

    allocs = bytes = 0;
    for (int i = 0; i < 100; ++i) by_cref(b);
    std::println("100x by_cref  : {} allocations, {} bytes", allocs, bytes);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 passcost.cpp && ./passcost">
{`sizeof(Big)      = 48
sizeof(Big&)     = 8  (a reference is a pointer in practice)
100x by_value : 200 allocations, 404800 bytes
100x by_cref  : 0 allocations, 0 bytes`}
      </CodeBlock>

      <p>
        <strong>200 heap allocations and 404,800 bytes, versus zero and zero.</strong> One hundred
        calls, two allocations each: one for the string&apos;s character buffer and one for the
        vector&apos;s 4,000 bytes of <code>int</code>. The <code>const Big&amp;</code> version
        passed one 8-byte address and did nothing else.
      </p>
      <p>
        That is the whole reason <code>const T&amp;</code> is the default parameter form in every
        C++ style guide ever written, and it is a consequence of the fact{' '}
        <a href="/cpp/intro">the intro lesson</a> opened with: in C++ the variable{' '}
        <em>is</em> the object. A <code>Big</code> parameter is a <code>Big</code>, and constructing
        one means constructing everything it owns.
      </p>

      <h3>The choosing rule</h3>
      <p>
        Short version, in priority order:
      </p>
      <ol>
        <li>
          <strong>Modifying and the caller should see it?</strong> <code>T&amp;</code>. Though
          consider returning a new value instead — it is usually clearer.
        </li>
        <li>
          <strong>Cheap to copy?</strong> <code>T</code> by value. &quot;Cheap&quot; means
          arithmetic types, pointers, enums, <code>string_view</code>, <code>span</code>, and small
          trivially-copyable structs. Rule of thumb: two machine words or fewer, no heap, no
          destructor.
        </li>
        <li>
          <strong>Anything else you only read?</strong> <code>const T&amp;</code>. Containers,
          strings, anything with a destructor, anything you are not sure about.
        </li>
        <li>
          <strong>Going to store a copy anyway?</strong> <code>T</code> by value, then{' '}
          <code>std::move</code> it into the member. The caller can then hand you a temporary and
          pay a move instead of a copy.
        </li>
      </ol>

      <FlowChart
        title="Choosing a parameter form"
        chart={
          'graph TD\n' +
          '  Q["How should this parameter be declared?"] --> M{"Does the function<br/>modify the argument?"}\n' +
          '  M -->|"yes, and the caller<br/>should see it"| R["T&amp;<br/>non-const reference"]\n' +
          '  M -->|no| C{"Is the type cheap to copy?<br/>— arithmetic, pointer, enum,<br/>small trivially-copyable struct"}\n' +
          '  C -->|yes| V["T by value<br/>copying 8 bytes is cheaper<br/>than an indirection"]\n' +
          '  C -->|"no — it owns a heap buffer,<br/>a container, a string"| K["const T&amp;<br/>the default for everything else"]\n' +
          '  R --> RN["Prefer returning a new value<br/>where you can. An out-parameter<br/>is a last resort, not a style."]\n' +
          '  K --> S{"Is it a string<br/>I only read?"}\n' +
          '  S -->|yes| SV["std::string_view<br/>— no allocation for literals"]\n' +
          '  S -->|no| KOK["const T&amp; is right"]\n' +
          '  Q --> ST{"Will I STORE a copy<br/>in a member?"}\n' +
          '  ST -->|yes| MV["T by value, then std::move<br/>— one move instead of a copy"]\n' +
          '  style V fill:#1a3329,stroke:#4ade80\n' +
          '  style K fill:#1a3329,stroke:#4ade80\n' +
          '  style SV fill:#1a2744,stroke:#5b9cf6\n' +
          '  style MV fill:#1a2744,stroke:#5b9cf6\n' +
          '  style RN fill:#3d2f14,stroke:#fb923c'
        }
      />

      <InfoBox variant="warning" title="Do not reflex-apply const T& to small types">
        <p>
          <code>const int&amp;</code> is worse than <code>int</code>. The <code>int</code> fits in a
          register; the reference forces the value to have an address, which may mean spilling it to
          the stack, and then the callee has to dereference. You have added an indirection to save
          copying four bytes.
        </p>
        <p>
          Same for <code>const std::string_view&amp;</code> — a <code>string_view</code>{' '}
          <em>is</em> two words, as{' '}
          <a href="/cpp/types">the previous lesson</a> measured (16 bytes here). Pass it by value.
          The rule is about ownership and heap buffers, not about reflexively adding{' '}
          <code>&amp;</code>.
        </p>
      </InfoBox>

      <InfoBox variant="info" title="The Java comparison, precisely">
        <p>
          A Java method parameter of reference type is, mechanically, closest to C++&apos;s{' '}
          <code>T* const</code> — you get your own copy of a handle to a shared object, you can
          mutate the object through it, and reassigning your copy does nothing to the caller. The{' '}
          <em>default</em> is what differs: Java gives you that for free and has no way to express
          &quot;copy the object,&quot; while C++ gives you the copy by default and makes you ask for
          the alias.
        </p>
        <p>
          So the translation of &quot;normal Java parameter passing&quot; into C++ is{' '}
          <code>T&amp;</code> or <code>const T&amp;</code>, not <code>T</code>. If you write C++
          signatures with Java instincts you will write by-value parameters everywhere and wonder
          why it is slow.
        </p>
      </InfoBox>

      <h2>Overloading, And How The Compiler Picks</h2>
      <p>
        Overloading itself is familiar from Java: same name, different parameter lists, resolved at
        compile time from the static types of the arguments. Two differences matter.
      </p>
      <p>
        First, <strong>C++ overloads on more things</strong> — <code>const</code>-ness, reference
        qualification, and value category, so <code>f(const T&amp;)</code> and{' '}
        <code>f(T&amp;&amp;)</code> are distinct overloads. Second,{' '}
        <strong>C++ has implicit conversions almost everywhere</strong>, so there are many more
        candidates in play and the ranking rules do more work.
      </p>
      <p>
        Here is the ranking, as the compiler applies it. You do not need to memorise this, but you do
        need to know it exists and roughly what order it goes in, because &quot;why did it call{' '}
        <em>that</em> one&quot; is a question you will have.
      </p>

      <FlowChart
        title="Overload resolution, in the order it actually happens"
        chart={
          'graph TD\n' +
          '  CALL["f(arg)"] --> S1["STEP 1 — NAME LOOKUP<br/>collect every f visible at this point,<br/>plus ADL from arg\'s namespace.<br/>A name in an inner scope HIDES all<br/>outer ones — lookup stops at the<br/>first scope that has any f at all."]\n' +
          '  S1 --> S2["STEP 2 — VIABILITY<br/>discard candidates that cannot be called<br/>with this many arguments, or where no<br/>conversion exists for some argument"]\n' +
          '  S2 --> S3["STEP 3 — RANK each argument\'s conversion"]\n' +
          '  S3 --> R0["0. EXACT match<br/>identity, lvalue-to-rvalue,<br/>array decay, qualification"]\n' +
          '  R0 --> R1["1. PROMOTION<br/>char/short/bool -&gt; int,<br/>float -&gt; double"]\n' +
          '  R1 --> R2["2. STANDARD CONVERSION<br/>int -&gt; long, int -&gt; double,<br/>Derived* -&gt; Base*, -&gt; bool"]\n' +
          '  R2 --> R3["3. USER-DEFINED CONVERSION<br/>a converting constructor<br/>or an operator T()"]\n' +
          '  R3 --> R4["4. ELLIPSIS<br/>f(...)"]\n' +
          '  R4 --> S4{"STEP 4 — is one candidate<br/>better or equal on EVERY argument,<br/>and strictly better on at least one?"}\n' +
          '  S4 -->|yes| WIN["that one is called"]\n' +
          '  S4 -->|"no — they tie"| AMB["error: call to \'f\' is ambiguous"]\n' +
          '  S4 -->|"two still tie, but one<br/>is a template"| NT["the NON-template wins"]\n' +
          '  WIN --> S5{"STEP 5 — is it accessible,<br/>and not = delete?"}\n' +
          '  S5 -->|no| ERR["error, even though<br/>it won resolution"]\n' +
          '  S5 -->|yes| OK["compiled"]\n' +
          '  style R0 fill:#1a3329,stroke:#4ade80\n' +
          '  style AMB fill:#3b1a1a,stroke:#f87171\n' +
          '  style ERR fill:#3b1a1a,stroke:#f87171\n' +
          '  style OK fill:#1a3329,stroke:#4ade80\n' +
          '  style R3 fill:#3d2f14,stroke:#fb923c'
        }
      />

      <p>
        Eleven calls, each exercising a different rung of that ladder:
      </p>

      <CodeBlock language="cpp" title="ovl2.cpp">
{`#include <print>
#include <string>

void f(int)                { std::println("f(int)"); }
void f(double)             { std::println("f(double)"); }
void f(const char*)        { std::println("f(const char*)"); }
void f(const std::string&) { std::println("f(const std::string&)"); }

struct Base {};
struct Derived : Base {};
void h(Base&)    { std::println("h(Base&)"); }
void h(Derived&) { std::println("h(Derived&)"); }

template <class T> void t(T)   { std::println("t(T)        -- template"); }
                   void t(int) { std::println("t(int)      -- non-template"); }

int main() {
    f(42);                  // 1. exact match
    f(42.0);                // 2. exact match
    f('x');                 // 3. promotion (char->int) beats conversion (char->double)
    f(true);                // 4. promotion (bool->int) beats conversion
    f(42.0f);               // 5. promotion (float->double) beats conversion
    f("hi");                // 6. array-to-pointer decay beats a user-defined conversion
    f(std::string("hi"));   // 7. exact match on the reference
    std::println("---");
    Derived d;
    h(d);                   // 8. exact match on Derived& beats base conversion
    Base& br = d;
    h(br);                  // 9. static type is Base&, so Base& wins
    std::println("---");
    t(42);                  // 10. a non-template exact match beats a template
    t(42.0);                // 11. no non-template match, so the template is used
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ovl2.cpp && ./ovl2">
{`f(int)
f(double)
f(int)
f(int)
f(double)
f(const char*)
f(const std::string&)
---
h(Derived&)
h(Base&)
---
t(int)      -- non-template
t(T)        -- template`}
      </CodeBlock>

      <p>
        The three worth dwelling on:
      </p>
      <ul>
        <li>
          <strong>Call 6, <code>f(&quot;hi&quot;)</code>, chose <code>const char*</code>.</strong>{' '}
          A string literal is a <code>const char[3]</code>. Converting it to{' '}
          <code>const char*</code> is array-to-pointer decay, which ranks as an{' '}
          <em>exact match</em>; converting it to <code>std::string</code> runs a constructor, which
          is a user-defined conversion at rank 3. Exact beats user-defined, so the{' '}
          <code>const char*</code> overload wins. This is exactly the mechanism behind the 1,000
          surprise allocations in <a href="/cpp/types">the previous lesson</a> — when there is{' '}
          <em>only</em> a <code>const std::string&amp;</code> overload, that user-defined conversion
          is the only option and it runs on every call.
        </li>
        <li>
          <strong>Call 9, <code>h(br)</code>, chose <code>h(Base&amp;)</code></strong> even though{' '}
          <code>br</code> refers to a <code>Derived</code>. Overload resolution uses{' '}
          <em>static</em> types, always. If you want the dynamic type to decide, you need a{' '}
          <code>virtual</code> function, which is a different mechanism entirely and gets its own
          lesson in the OOP phase.
        </li>
        <li>
          <strong>Call 10 chose the non-template.</strong> When a template instantiation and an
          ordinary function are equally good, the ordinary one wins. This tiebreaker is why adding a
          non-template overload to a template-heavy API can silently change which code runs.
        </li>
      </ul>

      <p>
        And here is the failure mode. When two conversions are at the same rank, there is no
        tiebreaker and it is an error — not a warning, not a coin flip:
      </p>

      <CodeBlock language="cpp" title="ovlbad.cpp">
{`void f(int);
void f(double);
void g(long);
void g(float);
int main() {
    f(42u);     // (A) unsigned int: a conversion to BOTH, equally ranked
    g(42);      // (B) int: integral conversion vs floating conversion, equal
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -c ovlbad.cpp">
{`ovlbad.cpp:6:5: error: call to 'f' is ambiguous
    6 |     f(42u);     // (A) unsigned int: a conversion to BOTH, equally ranked
      |     ^
ovlbad.cpp:1:6: note: candidate function
    1 | void f(int);
      |      ^
ovlbad.cpp:2:6: note: candidate function
    2 | void f(double);
      |      ^
ovlbad.cpp:7:5: error: call to 'g' is ambiguous
    7 |     g(42);      // (B) int: integral conversion vs floating conver...
      |     ^
ovlbad.cpp:3:6: note: candidate function
    3 | void g(long);
      |      ^
ovlbad.cpp:4:6: note: candidate function
    4 | void g(float);
      |      ^
2 errors generated.`}
      </CodeBlock>

      <p>
        <code>g(42)</code> is the one that surprises people: <code>int</code> to{' '}
        <code>long</code> feels obviously closer than <code>int</code> to <code>float</code>. The
        standard does not agree — both are rank-2 standard conversions, with no further ordering
        between &quot;integral conversion&quot; and &quot;floating-integral conversion.&quot; The
        intuition that one is more natural has no basis in the rules.
      </p>

      <InfoBox variant="tip" title="How to not fight overload resolution">
        <p>
          <strong>Overload on genuinely different things, not on numeric widths.</strong>{' '}
          <code>f(int)</code> plus <code>f(double)</code> is an ambiguity generator;{' '}
          <code>f(const Config&amp;)</code> plus <code>f(const Request&amp;)</code> is fine.
        </p>
        <p>
          <strong>Mark unwanted overloads <code>= delete</code>.</strong> Writing{' '}
          <code>void f(char) = delete;</code> makes <code>f('x')</code> a clear error rather than
          silently selecting <code>f(int)</code>. Since C++26 you can even write{' '}
          <code>= delete(&quot;pass an int, not a char&quot;)</code> and the message appears in the
          diagnostic — verified available on this toolchain in{' '}
          <a href="/cpp/intro">the intro lesson</a>&apos;s feature-macro probe.
        </p>
        <p>
          <strong>Mark single-argument constructors <code>explicit</code>.</strong> A
          non-<code>explicit</code> one-argument constructor is a user-defined conversion, which
          means it joins overload resolution for every call in the program that could possibly reach
          it. This is the main source of &quot;why is it constructing a <code>Widget</code>
          here.&quot;
        </p>
        <p>
          <strong>And when it does go wrong, read the candidate list.</strong> Clang prints every
          candidate with its location. The answer is nearly always a candidate you did not know
          existed.
        </p>
      </InfoBox>

      <h2>Default Arguments, And The One That Will Catch You</h2>
      <p>
        Default arguments are simpler than overloads and mostly do what you expect. Three facts and
        one genuine trap.
      </p>
      <p>
        <strong>Fact 1: they are substituted at the call site, in the caller&apos;s context.</strong>{' '}
        The default expression is not evaluated once at definition time, the way a Python default is
        — it is evaluated afresh on every call that omits the argument. This is the sane behaviour,
        and the opposite of the famous Python mutable-default bug.
      </p>
      <p>
        <strong>Fact 2: they must be trailing</strong>, and they may be specified only once across
        all declarations of a function — repeating them is an error even if the value is identical:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -c defbad2.cpp, where f(int a = 1) is declared twice">
{`defbad2.cpp:2:12: error: redefinition of default argument
    2 | void f(int a = 1);      // repeating it is an error, even with th...
      |            ^   ~
defbad2.cpp:1:12: note: previous definition is here
    1 | void f(int a = 1);
      |            ^   ~
1 error generated.`}
      </CodeBlock>

      <p>
        In practice that means: <strong>put the default in the header declaration, not on the
        definition in the <code>.cpp</code></strong>. Only translation units that see the
        declaration get the default, which is exactly what you want, and it keeps the ODR happy — a
        point <a href="/cpp/compiling">the compiling lesson</a> made at length.
      </p>
      <p>
        <strong>Fact 3: they collide with overloads.</strong> A default argument makes one function
        callable with several argument counts, which can tie with a real overload:
      </p>

      <CodeBlock language="text" title="Real output — void amb(int, int = 0); plus void amb(int);">
{`defbad.cpp:3:14: error: call to 'amb' is ambiguous
    3 | int main() { amb(1); }
      |              ^~~
defbad.cpp:1:6: note: candidate function
    1 | void amb(int a, int b = 0);
      |      ^
defbad.cpp:2:6: note: candidate function
    2 | void amb(int a);
      |      ^
1 error generated.`}
      </CodeBlock>

      <h3>The trap: default arguments are not virtual</h3>
      <p>
        This one is worth real attention, because it produces a result that looks impossible and the
        compiler will not help you at all.
      </p>
      <p>
        <strong>Virtual dispatch happens at runtime on the dynamic type. Default arguments are
        substituted at compile time from the static type.</strong> Those are two different types, so
        you can get the derived class&apos;s <em>body</em> running with the base class&apos;s{' '}
        <em>default</em>.
      </p>

      <CodeBlock language="cpp" title="defarg.cpp">
{`#include <print>

struct Base {
    virtual void log(int level = 1) { std::println("Base::log   level={}", level); }
    virtual ~Base() = default;
};
struct Derived : Base {
    void log(int level = 9) override { std::println("Derived::log level={}", level); }
};

// Default arguments are evaluated at the CALL SITE, on every call.
int counter = 0;
int next_id() { return ++counter; }
void tag(int id = next_id()) { std::println("tag id={}", id); }

int main() {
    Derived d;
    Base& b = d;

    d.log();        // Derived default, Derived body
    b.log();        // which default? which body?
    std::println("---");
    tag(); tag(); tag();
    std::println("counter is now {}", counter);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 defarg.cpp && ./defarg">
{`Derived::log level=9
Derived::log level=1
---
tag id=1
tag id=2
tag id=3
counter is now 3`}
      </CodeBlock>

      <p>
        Line two is the whole problem. <code>b.log()</code> ran{' '}
        <strong><code>Derived::log</code> with <code>level=1</code></strong> — a combination that
        appears nowhere in the source. The static type of <code>b</code> is <code>Base&amp;</code>,
        so the compiler substituted <code>Base</code>&apos;s default of <code>1</code>; then at
        runtime the virtual call dispatched to <code>Derived</code>&apos;s body. Same object, same
        expression spelled two ways, two different results.
      </p>
      <p>
        The <code>tag()</code> lines confirm Fact 1 while we are here: <code>next_id()</code> ran
        three times, giving 1, 2, 3, and <code>counter</code> ended at 3. The default expression is
        re-evaluated per call.
      </p>

      <InfoBox variant="danger" title="And nothing warns about it — checked, not assumed">
        <p>
          That file was compiled with <code>-Wall -Wextra</code> and produced no diagnostics. It was
          then compiled with <code>-Weverything</code>, which is clang&apos;s &quot;every warning
          that exists&quot; switch, and the complete list of flags that fired was:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Weverything -c defarg.cpp, warning flags only">
{`[-Wmissing-prototypes]
[-Wmissing-variable-declarations]
[-Wpoison-system-directories]
[-Wweak-vtables]

(nothing about the default argument. Grepping the full -Weverything output for
 "default arg" returns no matches.)`}
        </CodeBlock>
        <p>
          <strong>The rule: never give a default argument to a virtual function.</strong> If you
          want a default on a polymorphic interface, use a non-virtual public function with the
          default that forwards to a virtual implementation function with no default — the
          non-virtual-interface idiom. Then there is exactly one default and exactly one place it
          lives.
        </p>
      </InfoBox>

      <h2><code>inline</code> Does Not Mean &quot;Please Inline This&quot;</h2>
      <p>
        This is the most reliably-wrong piece of folklore a rusty C++ developer carries.{' '}
        <a href="/cpp/compiling">The compiling lesson</a> established what <code>inline</code>{' '}
        actually changes — linkage, so the symbol is marked{' '}
        <code>weak external</code> and the linker keeps one of several identical copies. What it does{' '}
        <em>not</em> do is instruct the optimiser.
      </p>
      <p>
        That is easy to assert and easy to verify, because clang will tell you its inlining decisions
        if you ask with <code>-Rpass=inline</code>. Two functions: one marked{' '}
        <code>inline</code> and deliberately enormous, one not marked and tiny.
      </p>

      <CodeBlock language="cpp" title="inl3.cpp — abridged; marked_inline has 79 similar statements">
{`#include <cstdio>

// Marked inline, and far too large for the optimiser to want it at a call site.
inline int marked_inline(int n) {
    int t = n;
    t += (t ^ 1) * (1+3); if (t % 3 == 0) t -= 1; t ^= (t >> 2);
    t += (t ^ 2) * (2+3); if (t % 4 == 0) t -= 2; t ^= (t >> 3);
    /* ... 77 more lines like these ... */
    return t;
}

// NOT marked inline. Tiny.
int not_marked(int a, int b) { return a + b; }

int main(int argc, char**) {
    std::printf("%d %d\\n", marked_inline(argc), not_marked(argc, 2));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -Rpass=inline -Rpass-missed=inline -c inl3.cpp">
{`inl3.cpp:92:28: remark: '_Z13marked_inlinei' not inlined into 'main' because
      too costly to inline (cost=3520, threshold=487) [-Rpass-missed=inline]
inl3.cpp:92:49: remark: '_Z10not_markedii' inlined into 'main' with
      (cost=-35, threshold=337) at callsite main:1:49; [-Rpass=inline]`}
      </CodeBlock>

      <p>
        There it is, from the compiler&apos;s own mouth. <strong>The function marked{' '}
        <code>inline</code> was not inlined. The function not marked <code>inline</code> was.</strong>{' '}
        The decision was made on a cost model — 3,520 against a threshold of 487 — and the keyword
        played no part in it.
      </p>
      <p>
        What the keyword <em>did</em> change is visible in the symbol table:
      </p>

      <CodeBlock language="text" title="Real output — nm -m inl3.o | c++filt, -O2">
{`0000000000000000 (__TEXT,__text) external not_marked(int, int)
0000000000000048 (__TEXT,__text) weak external automatically hidden marked_inline(int)`}
      </CodeBlock>

      <p>
        <code>external</code> versus <code>weak external</code>. Put <code>not_marked</code> in a
        header, include it in two <code>.cpp</code> files, and you get the duplicate-symbol error
        from <a href="/cpp/compiling">the previous-but-one lesson</a>. Put{' '}
        <code>marked_inline</code> in a header and the linker quietly keeps one copy. That is the
        entire modern meaning of the keyword.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>You want</th>
            <th style={headStyle}>Write</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>A function definition in a header</td>
            <td style={cellStyle}><code>inline</code> — this is its actual job</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A variable definition in a header (C++17+)</td>
            <td style={cellStyle}><code>inline</code> on the variable, or{' '}
              <code>constexpr</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>To actually force inlining</td>
            <td style={cellStyle}><code>[[gnu::always_inline]]</code> — non-standard, and you had
              better have a profile</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>To forbid inlining (for profiling, or a breakpoint)</td>
            <td style={cellStyle}><code>[[gnu::noinline]]</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>To know what the optimiser did</td>
            <td style={cellStyle}><code>-Rpass=inline -Rpass-missed=inline</code>, as above</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Inlining across translation units</td>
            <td style={cellStyle}><code>-flto</code>. The TU boundary is otherwise a hard wall for
              the optimiser.</td>
          </tr>
        </tbody>
      </table>

      <p>
        The last row is the one with real leverage. Because each translation unit is compiled in
        isolation, a function defined in another <code>.cpp</code> simply cannot be inlined — the
        optimiser has never seen its body. That is why header-only libraries are fast and why{' '}
        <code>-flto</code> exists. It is a build-model consequence, not a keyword one.
      </p>

      <h2>Passing Behaviour: Function Pointers, <code>std::function</code>, Lambdas</h2>
      <p>
        Three ways to hand a callable to another function. They look interchangeable and are not.
      </p>

      <CodeBlock language="cpp" title="The three forms">
{`// 1. A function pointer. Type-erased to an address. No captures possible.
long sum_fnptr(const std::vector<int>& v, int (*f)(int));

// 2. std::function. Type-erased behind a vtable. Any callable, any captures.
long sum_stdfn(const std::vector<int>& v, const std::function<int(int)>& f);

// 3. A template parameter. The callable's exact type is preserved.
template <class F>
long sum_tmpl(const std::vector<int>& v, F f);`}
      </CodeBlock>

      <p>
        First the sizes, because they explain the costs:
      </p>

      <CodeBlock language="text" title="Real output — this machine, libc++ _LIBCPP_VERSION 220106">
{`sizeof(lambda, no capture)        = 1
sizeof(lambda, 1 int captured)    = 4
sizeof(lambda, 64 bytes captured) = 64
sizeof(function pointer)          = 8
sizeof(std::function<int(int)>)   = 32`}
      </CodeBlock>

      <p>
        A lambda is <strong>a struct the compiler writes for you</strong>, with one member per
        capture and an <code>operator()</code>. A capture-free lambda is <code>1</code> byte — the
        minimum for any object, holding nothing. Each lambda has its own unnamed type, which is why
        you cannot write it down and why <code>auto</code> is mandatory for storing one.
      </p>
      <p>
        Now the cost. Twenty million elements, one increment each, four dispatch mechanisms, three
        runs to show the variance:
      </p>

      <CodeBlock language="cpp" title="callable2.cpp — the measured part">
{`int plain(int x) { return x + 1; }
int plain2(int x) { return x + 2; }
using FnPtr = int (*)(int);

template <class F>
long sum_tmpl(const std::vector<int>& v, F f) {
    long t = 0; for (int x : v) t += f(x); return t;
}
long sum_fnptr(const std::vector<int>& v, FnPtr f) {
    long t = 0; for (int x : v) t += f(x); return t;
}
long sum_stdfn(const std::vector<int>& v, const std::function<int(int)>& f) {
    long t = 0; for (int x : v) t += f(x); return t;
}

int main(int argc, char**) {
    auto lam = [](int x) { return x + 1; };
    std::vector<int> v(20'000'000);
    std::iota(v.begin(), v.end(), 0);

    // An OPAQUE function pointer: its value depends on argc, so the optimiser
    // cannot see which function it is and must emit a real indirect call.
    FnPtr opaque = (argc > 99) ? plain2 : plain;
    std::function<int(int)> sf = lam;
    /* ... timed with std::chrono::steady_clock, three runs ... */
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 callable2.cpp && ./callable2">
{`run 1
  template parameter (lambda, inlined)        2.14 ms
  function pointer, value known to optimiser      1.85 ms
  function pointer, opaque                   23.75 ms
  std::function                              18.67 ms
run 2
  template parameter (lambda, inlined)        1.18 ms
  function pointer, value known to optimiser      1.13 ms
  function pointer, opaque                   16.36 ms
  std::function                              15.07 ms
run 3
  template parameter (lambda, inlined)        0.97 ms
  function pointer, value known to optimiser      0.97 ms
  function pointer, opaque                   13.47 ms
  std::function                              13.44 ms`}
      </CodeBlock>

      <p>
        Settling on run 3, the warmest: about <strong>1.0 ms versus 13.5 ms — a 14&times;
        gap</strong>, for a loop whose body is one addition.
      </p>

      <InfoBox variant="warning" title="Two results here contradicted what I expected">
        <p>
          <strong>First: the plain function pointer was exactly as fast as the template</strong>{' '}
          when the optimiser could see which function it pointed at. That is why the benchmark has
          two function-pointer rows. <code>sum_fnptr(v, plain)</code> hands over a compile-time
          constant address, so clang devirtualises the call and inlines{' '}
          <code>plain</code> just as it would a lambda. Make the pointer depend on{' '}
          <code>argc</code> and the optimiser loses sight of it, and the cost appears. So{' '}
          &quot;function pointers are slow&quot; is not a property of function pointers; it is a
          property of indirect calls the optimiser cannot resolve.
        </p>
        <p>
          <strong>Second: <code>std::function</code> and the opaque function pointer cost the same
          thing</strong> — 13.44 ms against 13.47 ms. The received wisdom is that{' '}
          <code>std::function</code> is dramatically worse because of type erasure and possible
          allocation. Not here. Once a call is indirect and cannot be inlined, you have already paid
          the whole bill; the type-erasure machinery on top is noise.
        </p>
        <p>
          <strong>The actual lesson</strong> is therefore not &quot;avoid{' '}
          <code>std::function</code>.&quot; It is: <em>the cost is the lost inlining, not the
          wrapper.</em> If the call is in a hot loop over millions of elements, pass the callable as
          a template parameter so its type survives. If it is a callback invoked a few hundred times
          a second, use <code>std::function</code> and enjoy the flexibility — 12 nanoseconds per
          call is not your bottleneck.
        </p>
      </InfoBox>

      <p>
        One more measured detail, since it is the one real allocation hazard.{' '}
        <code>std::function</code> has a small-object buffer, and the threshold on this libc++ is
        exactly 16 bytes:
      </p>

      <CodeBlock language="text" title="Real output — counting operator new while assigning lambdas of growing capture size">
{`capture  8 bytes (sizeof lambda  8) -> 0 allocation(s)
capture 15 bytes (sizeof lambda 15) -> 0 allocation(s)
capture 16 bytes (sizeof lambda 16) -> 0 allocation(s)
capture 17 bytes (sizeof lambda 17) -> 1 allocation(s)
capture 20 bytes (sizeof lambda 20) -> 1 allocation(s)
capture 24 bytes (sizeof lambda 24) -> 1 allocation(s)
capture 32 bytes (sizeof lambda 32) -> 1 allocation(s)`}
      </CodeBlock>

      <p>
        Sixteen bytes is two pointers, or a pointer and an <code>int</code> with padding. Capture
        anything bigger — a <code>std::string</code> by value is 24 bytes, three captured pointers
        is 24 — and every assignment to a <code>std::function</code> heap-allocates. That number is{' '}
        <em>this</em> standard library&apos;s; it is not in the standard, and libstdc++ and the MS
        STL differ. If it matters to you, measure it where you ship.
      </p>

      <FlowChart
        title="Three ways to pass a callable, and what each costs"
        chart={
          'graph LR\n' +
          '  L["a lambda:<br/>[x](int n) { return n + x; }"] --> T["each lambda has its OWN<br/>unnamed closure type"]\n' +
          '  T --> H1{"How do you pass it?"}\n' +
          '  H1 -->|"template &lt;class F&gt; void g(F f)"| TP["TYPE PRESERVED<br/>the call site knows exactly<br/>which operator() to call"]\n' +
          '  TP --> TPR["inlined — measured ~0.92 ms<br/>over 20M elements"]\n' +
          '  H1 -->|"int (*f)(int)"| FP["TYPE ERASED to an address.<br/>Only works with NO captures."]\n' +
          '  FP --> FPR{"Can the optimiser see<br/>which function it is?"}\n' +
          '  FPR -->|yes| FPI["devirtualised and inlined —<br/>measured ~0.92 ms"]\n' +
          '  FPR -->|no| FPO["real indirect call —<br/>measured ~13.5 ms"]\n' +
          '  H1 -->|"std::function&lt;int(int)&gt;"| SF["TYPE ERASED to a vtable.<br/>Any callable, any captures."]\n' +
          '  SF --> SFA{"captures &gt; 16 bytes?"}\n' +
          '  SFA -->|no| SFI["stored in the inline buffer,<br/>no allocation"]\n' +
          '  SFA -->|yes| SFH["heap allocation per assignment"]\n' +
          '  SFI --> SFR["indirect call —<br/>measured ~13.4 ms"]\n' +
          '  SFH --> SFR\n' +
          '  style TPR fill:#1a3329,stroke:#4ade80\n' +
          '  style FPI fill:#1a3329,stroke:#4ade80\n' +
          '  style FPO fill:#3b1a1a,stroke:#f87171\n' +
          '  style SFR fill:#3b1a1a,stroke:#f87171\n' +
          '  style SFH fill:#3d2f14,stroke:#fb923c'
        }
      />

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}>Function pointer</th>
            <th style={headStyle}><code>std::function</code></th>
            <th style={headStyle}>Template parameter</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Accepts captures</td>
            <td style={cellStyle}>no — capture-free lambdas only</td>
            <td style={cellStyle}>yes</td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Can be stored in a member</td>
            <td style={cellStyle}>yes</td>
            <td style={cellStyle}>yes</td>
            <td style={cellStyle}>no — type must be known at the class</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Can be rebound at runtime</td>
            <td style={cellStyle}>yes</td>
            <td style={cellStyle}>yes</td>
            <td style={cellStyle}>no</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Inlinable</td>
            <td style={cellStyle}>only if the value is visible</td>
            <td style={cellStyle}>no</td>
            <td style={cellStyle}>yes</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Allocates</td>
            <td style={cellStyle}>never</td>
            <td style={cellStyle}>when captures exceed 16 bytes (here)</td>
            <td style={cellStyle}>never</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Lives in a header?</td>
            <td style={cellStyle}>no</td>
            <td style={cellStyle}>no</td>
            <td style={cellStyle}>yes — templates must be visible</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Use it for</td>
            <td style={cellStyle}>C APIs and <code>extern &quot;C&quot;</code> callbacks</td>
            <td style={cellStyle}>stored callbacks, event handlers, virtual-ish dispatch</td>
            <td style={cellStyle}>algorithms and hot loops</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="info" title="This is why std::sort beats qsort">
        <p>
          <code>qsort</code> takes a function pointer, so every comparison is an indirect call it
          cannot inline. <code>std::sort</code> takes its comparator as a <strong>template
          parameter</strong>, so the comparator&apos;s body is inlined into the sort and the
          compiler can optimise across the boundary. That is the whole explanation for the
          performance difference people quote between the two, and it is also{' '}
          <a href="/cpp/intro">the intro lesson</a>&apos;s zero-cost-abstraction claim appearing in
          a place you would not expect: the abstraction is free precisely because the type was not
          erased.
        </p>
        <p>
          It is also why nearly every standard algorithm is a template over its callable. Keep the
          pattern in your own APIs where the call is hot — <code>template &lt;class F&gt;</code> is
          not showing off, it is the thing that makes the call free.
        </p>
      </InfoBox>

      <h2>Lambdas In Depth</h2>
      <p>
        You know the syntax from JavaScript arrow functions. The part that has no JavaScript
        equivalent is the <strong>capture list</strong>, because JavaScript closures capture by
        reference, always, and the variables are garbage-collected so there is nothing to get
        wrong. C++ makes you choose, and the wrong choice is a use-after-free.
      </p>

      <CodeBlock language="cpp" title="The anatomy">
{`//    captures   params          return type (usually deduced)
//      vvvv      vvvvvvv           vvv
auto f = [a, &b](int x, int y) -> int { return a + b + x + y; };

// Capture forms:
[]              // nothing
[a]             // a, by value (a copy, made at the point the lambda is created)
[&a]            // a, by reference (an alias to the original)
[=]             // everything used, by value
[&]             // everything used, by reference
[this]          // the enclosing object's this pointer — by REFERENCE semantics
[*this]         // a copy of the enclosing object (C++17)
[n = expr]      // init-capture: a new member initialised from expr (C++14)
[d = std::move(v)]  // init-capture by move — the lambda now OWNS v`}
      </CodeBlock>

      <CodeBlock language="cpp" title="lam.cpp">
{`#include <print>
#include <string>
#include <vector>

int main() {
    int n = 1;
    std::string s = "a-long-string-that-lives-on-the-heap";

    auto by_val = [n, s]()   { std::println("  by_val : n={} s.size()={}", n, s.size()); };
    auto by_ref = [&n, &s]() { std::println("  by_ref : n={} s.size()={}", n, s.size()); };

    n = 99;
    s = "replaced-with-something-much-longer-than-before";

    std::println("after mutating n and s:");
    by_val();     // sees the values as they were AT CAPTURE
    by_ref();     // sees them as they are NOW

    // [=] and [&] capture everything used, by value / by reference.
    auto all_val = [=] { return n; };
    auto all_ref = [&] { return n; };
    n = 7;
    std::println("all_val() = {}   all_ref() = {}", all_val(), all_ref());

    // mutable: lets the lambda modify its own by-value copy.
    int count = 0;
    auto tick = [count]() mutable { return ++count; };
    int t1 = tick(); int t2 = tick(); int t3 = tick();
    std::println("tick() -> {} {} {}   outer count is still {}", t1, t2, t3, count);

    // Init-capture (C++14): create a new member, including by move.
    std::vector<int> data{1, 2, 3};
    auto owns = [d = std::move(data)] { return d.size(); };
    std::println("owns() = {}   data.size() after move = {}", owns(), data.size());

    // Generic lambda (C++14): auto parameters.
    auto twice = [](auto x) { return x + x; };
    std::println("twice(21) = {}  twice(1.5) = {}  twice(std::string(\\"ab\\")) = {}",
                 twice(21), twice(1.5), twice(std::string("ab")));

    // Explicit template parameter list (C++20).
    auto first = []<class T>(const std::vector<T>& v) -> T { return v.at(0); };
    std::println("first({{10,20}}) = {}", first(std::vector<int>{10, 20}));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 lam.cpp && ./lam">
{`after mutating n and s:
  by_val : n=1 s.size()=36
  by_ref : n=99 s.size()=47
all_val() = 99   all_ref() = 7
tick() -> 1 2 3   outer count is still 0
owns() = 3   data.size() after move = 0
twice(21) = 42  twice(1.5) = 3  twice(std::string("ab")) = abab
first({10,20}) = 10`}
      </CodeBlock>

      <p>
        Five things in that output are worth naming:
      </p>
      <ul>
        <li>
          <strong>By-value capture froze the values at creation time.</strong>{' '}
          <code>by_val</code> reports <code>n=1</code> and a 36-character string, which is what they
          were when the lambda was written — not what they were when it was called. If you are used
          to JavaScript, this is the surprise: a JS closure over <code>n</code> would print 99.
        </li>
        <li>
          <strong><code>[=]</code> captured by value too</strong>, which is why{' '}
          <code>all_val()</code> returned 99 (the value at its creation, after the first mutation)
          while <code>all_ref()</code> returned 7 (the value now). Note{' '}
          <code>[=]</code> is not &quot;capture nothing special&quot; — it is a silent copy of
          everything the body mentions, including whole containers.
        </li>
        <li>
          <strong><code>mutable</code> gave the lambda its own mutable state.</strong>{' '}
          <code>tick()</code> counted 1, 2, 3 across calls while the outer <code>count</code>{' '}
          stayed 0. A by-value capture is <code>const</code> by default; <code>mutable</code> lifts
          that on the lambda&apos;s copy only. This is how you write a stateful callable without a
          class — and note the three calls are on separate lines deliberately, because the order in
          which function arguments are evaluated is unspecified, so putting all three inside one{' '}
          <code>println</code> would not reliably print <code>1 2 3</code>.
        </li>
        <li>
          <strong>Init-capture with <code>std::move</code> transferred ownership.</strong>{' '}
          <code>owns()</code> sees 3 elements and <code>data.size()</code> is 0 — the vector&apos;s
          buffer now belongs to the closure. This is the correct way to give a lambda something
          expensive, and the only way to capture a move-only type like{' '}
          <code>std::unique_ptr</code>.
        </li>
        <li>
          <strong>Generic lambdas are templates.</strong> <code>twice</code> worked on{' '}
          <code>int</code>, <code>double</code> and <code>std::string</code> from one definition —{' '}
          <code>auto</code> in a parameter list makes <code>operator()</code> a template. (And{' '}
          <code>twice(1.5)</code> printing <code>3</code> rather than <code>3.0</code> is{' '}
          <code>std::format</code>&apos;s shortest-round-trip default for floating point, not an
          integer conversion.)
        </li>
      </ul>

      <h3>The dangling-capture trap</h3>
      <p>
        This is the bug this section exists to prevent. <strong>A reference capture stores an
        address. If the lambda outlives the variable, that address is garbage.</strong>
      </p>

      <CodeBlock language="cpp" title="lam2.cpp">
{`#include <print>
#include <functional>
#include <string>

// THE TRAP: a lambda that captures a local by reference and outlives it.
std::function<void()> make_logger() {
    std::string prefix = "a-prefix-long-enough-to-live-on-the-heap";
    return [&prefix] { std::println("  [{}] event", prefix); };   // DANGLING
}

// The fix: capture by value (or by init-capture with a move).
std::function<void()> make_logger_ok() {
    std::string prefix = "a-prefix-long-enough-to-live-on-the-heap";
    return [prefix] { std::println("  [{}] event", prefix); };
}

int main() {
    std::println("the safe one:");
    make_logger_ok()();
    std::println("the dangling one:");
    make_logger()();
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three builds of that exact file">
{`$ clang++ -std=c++23 -Wall -Wextra -c lam2.cpp -o /dev/null
(no output — not one warning)

$ clang++ -std=c++23 -O2 lam2.cpp -o lam2 && ./lam2
the safe one:
  [a-prefix-long-enough-to-live-on-the-heap] event
the dangling one:
  [                                      ] event
(exit 0 — the program "succeeded")

$ clang++ -std=c++23 -O1 -fsanitize=address lam2.cpp -o lam2a && ./lam2a
=================================================================
==97575==ERROR: AddressSanitizer: stack-use-after-scope on address
  0x00016ee566f7 at pc 0x000100fa98f4
READ of size 1 at 0x00016ee566f7 thread T0
    #0 ... std::__1::__function::__func<make_logger()::$_0, void ()>::operator()()
    #1 ... main+0x2d4
Address 0x00016ee566f7 is located in stack of thread T0 at offset 55 in frame
    #0 ... in main+0xc
  This frame has 3 object(s):
    [32, 56) 'prefix' <== Memory access at offset 55 is inside this variable`}
      </CodeBlock>

      <p>
        Read all three. <code>-Wall -Wextra</code> said <strong>nothing</strong>. The optimised build
        printed <strong>38 spaces</strong> where the prefix should be, and exited 0 — a program that
        ran to completion with no indication anything was wrong. Only AddressSanitizer named it:{' '}
        <code>stack-use-after-scope</code>, pointing at <code>prefix</code> by name, with the exact
        stack frame.
      </p>
      <p>
        That is the pattern to internalise. <strong>This category of bug is undetectable at compile
        time in the general case and invisible at runtime without instrumentation.</strong> It is
        also the reason <a href="/cpp/intro">the intro lesson</a> insisted on{' '}
        <code>-fsanitize=address</code> in every debug build.
      </p>

      <InfoBox variant="warning" title="A nuance worth knowing: sometimes clang does catch it">
        <p>
          The example above hides the bug behind <code>std::function</code>, and type erasure
          defeats the analysis — <code>-Weverything</code> on that file reports only{' '}
          <code>-Wmissing-prototypes</code> and <code>-Wpoison-system-directories</code>, nothing
          about lifetimes. But when the lambda&apos;s own type is returned, clang can see straight
          through it:
        </p>
        <CodeBlock language="text" title="Real output — returning the closure type directly, with only -Wall -Wextra">
{`$ cat lam3.cpp
auto make_bad() {
    int local = 42;
    return [&local] { return local; };   // returns a lambda holding a dead ref
}

$ clang++ -std=c++23 -Wall -Wextra -fmessage-length=74 -c lam3.cpp
lam3.cpp:4:14: warning: address of stack memory associated with local
      variable 'local' returned [-Wreturn-stack-address]
    4 |     return [&local] { return local; };   // returns a lambda holdi...
      |              ^~~~~
lam3.cpp:4:14: note: captured by reference here
1 warning generated.

$ clang++ -std=c++23 -O2 lam3.cpp -o lam3 && ./lam3
0`}
        </CodeBlock>
        <p>
          A clear warning, naming the variable and the capture, plus a program that prints{' '}
          <code>0</code> instead of <code>42</code>. So the diagnostics are not useless — they are
          defeated by indirection. The more layers between the capture and the escape (a{' '}
          <code>std::function</code>, a member, a container, a thread), the less help you get. Which
          is precisely the direction real code goes.
        </p>
      </InfoBox>

      <FlowChart
        title="Capture by value or by reference: the one question that decides it"
        chart={
          'graph TD\n' +
          '  subgraph GOOD["[prefix] — capture by VALUE"]\n' +
          '    G1["the closure object gets<br/>its OWN std::string member"] --> G2["prefix dies when the function returns"]\n' +
          '    G2 --> G3["the copy inside the closure<br/>is still alive and valid"]\n' +
          '    G3 --> G4["prints the prefix correctly"]\n' +
          '  end\n' +
          '  subgraph BAD["[&amp;prefix] — capture by REFERENCE"]\n' +
          '    B1["the closure object stores<br/>only the ADDRESS of prefix"] --> B2["prefix dies when the function returns"]\n' +
          '    B2 --> B3["the closure still holds<br/>that dead stack address"]\n' +
          '    B3 --> B4["stack-use-after-scope<br/>— printed 38 spaces"]\n' +
          '  end\n' +
          '  D{"Does the lambda outlive<br/>the enclosing scope?"} --> D1["stored in a member,<br/>returned, put on a queue,<br/>handed to a thread,<br/>registered as a callback"]\n' +
          '  D1 --> RULE["YES -> capture by value,<br/>or init-capture with std::move.<br/>NEVER [&amp;] here."]\n' +
          '  D --> D2["passed straight to an algorithm<br/>and used before the call returns"]\n' +
          '  D2 --> RULE2["NO -> [&amp;] is fine and cheaper"]\n' +
          '  style G4 fill:#1a3329,stroke:#4ade80\n' +
          '  style B4 fill:#3b1a1a,stroke:#f87171\n' +
          '  style RULE fill:#1a3329,stroke:#4ade80\n' +
          '  style RULE2 fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <InfoBox variant="danger" title="[this] is the same trap wearing a disguise">
        <p>
          Inside a member function, <code>[=]</code> and <code>[this]</code> both capture the{' '}
          <code>this</code> <em>pointer</em>, not the object. So a lambda that mentions a member
          variable is holding a reference to your object, and if that lambda is stored anywhere that
          outlives the object — a callback registry, a thread, an async continuation — you have the
          dangling-capture bug with none of the visual warning signs, because the capture list says{' '}
          <code>[=]</code> and looks like a copy.
        </p>
        <p>
          This is common enough that C++20 deprecated the implicit <code>this</code> capture via{' '}
          <code>[=]</code>. Spell it: <code>[this]</code> when you mean the pointer and know the
          lifetimes, <code>[*this]</code> (C++17) when you want a copy of the whole object, or
          capture the specific members you need by value. For the asynchronous case the standard
          idiom is to capture a <code>std::weak_ptr</code> to yourself and lock it on invocation —
          which needs <code>shared_ptr</code>, and therefore the memory phase.
        </p>
      </InfoBox>

      <h2><code>constexpr</code> Functions</h2>
      <p>
        <a href="/cpp/types">The previous lesson</a> covered the{' '}
        <code>const</code>/<code>constexpr</code>/<code>consteval</code> distinction and when each
        is required. Here is the part specific to functions: what a <code>constexpr</code> function
        is actually allowed to do, which has expanded enormously and is probably further than you
        remember.
      </p>
      <p>
        In C++11 a <code>constexpr</code> function had to be a single <code>return</code> statement.
        C++14 allowed loops and local variables. C++20 allowed{' '}
        <strong>dynamic allocation</strong>, <code>try</code>/<code>catch</code>, and virtual calls.
        C++23 added <code>if consteval</code>. The practical upshot is that a{' '}
        <code>constexpr</code> function is now just... a function, with the restriction that it must
        not do anything whose result could differ between compile and run time.
      </p>

      <CodeBlock language="cpp" title="cxf.cpp">
{`#include <print>
#include <string>
#include <vector>

// A constexpr function with a loop (legal since C++14).
constexpr int sum_digits(int n) {
    int t = 0;
    while (n > 0) { t += n % 10; n /= 10; }
    return t;
}

// With heap allocation (legal since C++20, provided nothing escapes
// the constant evaluation -- the vector must be gone by the time
// the function returns).
constexpr int longest_word(std::string_view text) {
    std::vector<int> lens;          // a real allocation, at COMPILE TIME
    int cur = 0;
    for (char c : text) {
        if (c == ' ') { lens.push_back(cur); cur = 0; } else ++cur;
    }
    lens.push_back(cur);
    int best = 0;
    for (int l : lens) if (l > best) best = l;
    return best;
}

// if consteval (C++23): branch on which mode you are in.
constexpr const char* which_mode() {
    if consteval { return "compile time"; }
    else         { return "run time"; }
}

int main() {
    constexpr int d = sum_digits(982451653);
    static_assert(d == 43);
    std::println("sum_digits(982451653) = {}  (computed at compile time)", d);

    constexpr int w = longest_word("the quick brown jumping fox");
    static_assert(w == 7);
    std::println("longest_word(...)     = {}  (vector allocated at compile time)", w);

    constexpr const char* ct = which_mode();
    std::println("constexpr context     = {}", ct);
    std::println("runtime context       = {}", which_mode());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cxf.cpp && ./cxf">
{`sum_digits(982451653) = 43  (computed at compile time)
longest_word(...)     = 7  (vector allocated at compile time)
constexpr context     = compile time
runtime context       = run time`}
      </CodeBlock>

      <p>
        Two things in there are genuinely remarkable if you last used C++ before 2020.{' '}
        <code>longest_word</code> <strong>constructs a <code>std::vector</code> during
        compilation</strong>, pushes onto it, and the allocation is reclaimed before the constant
        evaluation finishes — the compiler runs a tiny heap for you. And{' '}
        <code>which_mode</code> returns different strings depending on whether it was called in a
        constant expression or not, printing both in the same program.
      </p>
      <p>
        (The <code>static_assert(d == 43)</code> is there because the first draft of this lesson
        guessed 46. The compiler&apos;s reply was{' '}
        <code>note: expression evaluates to &apos;43 == 46&apos;</code>, which is a good advert for
        asserting rather than asserting-in-prose.)
      </p>
      <p>
        And to confirm the computation really happened at compile time rather than being folded by
        the optimiser incidentally, here are both call shapes in assembly:
      </p>

      <CodeBlock language="cpp" title="cxf2.cpp">
{`constexpr int sum_digits(int n) {
    int t = 0;
    while (n > 0) { t += n % 10; n /= 10; }
    return t;
}
int baked()         { return sum_digits(982451653); }   // constant argument
int computed(int n) { return sum_digits(n); }           // runtime argument`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S cxf2.cpp, bodies extracted, directives stripped">
{`baked():                             computed(int):
	mov	w0, #43                          cmp	w0, #1
	ret                                  b.lt	LBB1_4
                                         mov	x8, x0
                                         mov	w0, #0
                                         mov	w9, #52429
                                         movk	w9, #52428, lsl #16
                                         mov	w10, #10
                                     LBB1_2:
                                         umull	x11, w8, w9
                                         lsr	x11, x11, #35
                                         msub	w12, w11, w10, w8
                                         add	w0, w12, w0
                                         cmp	w8, #9
                                         mov	x8, x11
                                         b.hi	LBB1_2
                                         ret`}
      </CodeBlock>

      <p>
        <code>baked()</code> is <code>mov w0, #43; ret</code> — two instructions, the loop entirely
        absent. <code>computed(int)</code> has the real loop, complete with the
        division-by-reciprocal-multiply trick. Same function, same source, two worlds.
      </p>

      <InfoBox variant="tip" title="When to mark a function constexpr">
        <p>
          <strong>Mark it when it could meaningfully be evaluated at compile time and is small.</strong>{' '}
          Unit conversions, lookup-table generation, parsing a compile-time string, bit twiddling,
          validating a configuration constant. The cost is zero at runtime: if the arguments are not
          constants, it compiles to an ordinary function.
        </p>
        <p>
          <strong>Do not mark everything.</strong> <code>constexpr</code> is part of your public
          interface — removing it later is a breaking change for anyone who used it in a constant
          expression — and it implies <code>inline</code>, so the definition must live in the header,
          which costs build time for every file that includes it. (That is the mechanism{' '}
          <a href="/cpp/compiling">the compiling lesson</a> measured.)
        </p>
        <p>
          <strong>Use <code>static_assert</code> to prove it worked.</strong> A{' '}
          <code>constexpr</code> function that silently fell back to runtime looks identical in the
          source. <code>static_assert(f(x) == expected)</code> fails to compile if the call is not
          actually a constant expression, so it is both a unit test and a guarantee, and it costs
          nothing.
        </p>
      </InfoBox>

      <h2>The Residue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Half-remembered</th>
            <th style={headStyle}>What this lesson measured</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Passing an argument is free&quot;</td>
            <td style={cellStyle}>By value: 200 allocations and 404,800 bytes for 100 calls. By{' '}
              <code>const&amp;</code>: zero and zero.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>const T&amp;</code> is always better&quot;</td>
            <td style={cellStyle}>Not for <code>int</code>, <code>string_view</code>,{' '}
              <code>span</code> — you are adding an indirection to save 8 bytes.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>int</code>&rarr;<code>long</code> is closer than{' '}
              <code>int</code>&rarr;<code>float</code>&quot;</td>
            <td style={cellStyle}>Same rank. <code>g(42)</code> is{' '}
              <code>error: call to &apos;g&apos; is ambiguous</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Defaults work with virtual functions&quot;</td>
            <td style={cellStyle}>Derived body + Base default, silently.{' '}
              <code>-Weverything</code> says nothing.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>inline</code> asks for inlining&quot;</td>
            <td style={cellStyle}>The <code>inline</code> one was declined (cost 3520 vs threshold
              487); the unmarked one was inlined. It controls linkage.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::function</code> is much slower than a function
              pointer&quot;</td>
            <td style={cellStyle}>13.44 ms vs 13.47 ms. Identical. The cost is the indirect call,
              not the wrapper.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>[=]</code> is the safe default&quot;</td>
            <td style={cellStyle}>It copies everything mentioned, and in a member function it
              captures <code>this</code> by pointer. Deprecated in C++20 for that reason.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>constexpr</code> is for simple expressions&quot;</td>
            <td style={cellStyle}>A <code>std::vector</code> was allocated and freed at compile
              time.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="Before you move on">
        <p>
          Everything in this lesson is downstream of one fact: <strong>a C++ parameter of class type
          is an object, not a handle.</strong> That is why the parameter form matters, why{' '}
          <code>const T&amp;</code> is the default, why <code>std::move</code> on an argument changes
          which constructor runs, and why a lambda capture is a genuine decision about ownership
          rather than a syntactic flourish.
        </p>
        <p>
          It is also the thing you have not been given the full story on yet. You have now seen
          references used as a tool — parameters, captures, aliases — without a precise account of
          what a reference <em>is</em>, how it differs from a pointer, or why a dangling reference is
          a worse failure than a null pointer.
        </p>
        <p>
          <a href="/cpp/references">Next: Values, References &amp; Pointers</a> — the last lesson of
          Phase 1, the full version of the &quot;objects are not handles&quot; correction from{' '}
          <a href="/cpp/intro">the intro</a>, and the bridge into the memory model.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Functions;
