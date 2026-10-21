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

function Classes() {
  return (
    <LessonLayout
      title="Classes, Constructors & the Rule of Zero/Three/Five"
      sectionId="cpp"
      lessonIndex={11}
      prev={{ path: '/cpp/memory-bugs', label: 'Memory Bugs & the Sanitizers That Catch Them' }}
      next={{ path: '/cpp/inheritance', label: 'Inheritance, Virtual Functions & vtables' }}
    >
      <p>
        Phase 3 is about building types, and this is the lesson that owes you three answers. Phase 2
        promised the rule of zero/three/five twice — once in{' '}
        <a href="/cpp/raii">RAII</a> and once in{' '}
        <a href="/cpp/move-semantics">move semantics</a>, where an empty{' '}
        <code>~B() {'{}'}</code> silently converted seven moves into seven copies — and{' '}
        <a href="/cpp/memory-bugs">the bug catalogue</a> closed by pointing here.
      </p>
      <p>
        You know what a class is. That is not the problem. The problem is that you know what a{' '}
        <em>Java</em> class is, and roughly four of the things that are true there are false here.
        Phase 2 already retired the biggest one — a C++ class variable <em>is</em> the object, not a
        handle to it, so <code>b = a</code> copies. This lesson is about what follows from that:
      </p>
      <ul>
        <li>
          <strong>The constructor body is not where initialisation happens.</strong> By the time the
          first <code>{'{'}</code> of a constructor body is reached, every member is already
          constructed. Writing <code>m = x;</code> in the body is a second operation on an
          already-built object, and it is measurable.
        </li>
        <li>
          <strong>Members initialise in declaration order, not in the order you wrote the
          initialiser list.</strong> Java has no analogue because Java fields are either{' '}
          <code>null</code> or default-valued before the constructor runs. Here, reading a member
          that has not been initialised yet is undefined behaviour, and one of the demonstrations
          below prints the right answer at <code>-O2</code> and garbage at <code>-O0</code>.
        </li>
        <li>
          <strong>A one-argument constructor is a conversion operator unless you stop it.</strong>{' '}
          Java has nothing like this at all. <code>wait(500)</code> compiles against{' '}
          <code>void wait(Seconds)</code> and means five hundred seconds.
        </li>
        <li>
          <strong>Declaring one special member silently changes which others exist.</strong>{' '}
          Java generates nothing and takes nothing away. C++ generates up to six functions for you
          and the generation rules are interlocked, so adding a destructor deletes your move
          constructor. This one is subtle enough that the whole matrix is measured rather than
          described.
        </li>
      </ul>
      <p>
        The destination is the <strong>rule of zero</strong>: a class that declares none of the
        special members, because it owns nothing directly. Most classes you write should be that.
        The rule of three and the rule of five are what you need on the day you cannot be, and
        that day is rarer than it looks.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++, <code>-std=c++23</code> unless a line says
          otherwise. Every output block, warning, error message and trait value on this page was
          captured from a real compile or run on this machine. The technique from{' '}
          <a href="/cpp/move-semantics">the move-semantics lesson</a> — a member that prints on
          construct, copy, move, assign and destroy — does most of the work, because the question
          &quot;which function actually ran?&quot; has no reliable answer from reading the source.
        </p>
      </InfoBox>

      <h2><code>class</code> vs <code>struct</code>: One Difference, Twice</h2>
      <p>
        Start here because it is the only thing in this lesson with a short answer.{' '}
        <strong><code>class</code> and <code>struct</code> differ in default access and nothing
        else.</strong> Not layout, not triviality, not what you are allowed to put in them. A{' '}
        <code>struct</code> can have virtual functions, private members, constructors, operators and
        inheritance; a <code>class</code> can be two public ints.
      </p>

      <CodeBlock language="cpp" title="sc.cpp">
{`#include <print>
#include <type_traits>

struct S { int a; };
class  C { public: int a; };

// The ONLY differences: default member access, and default inheritance access.
struct SBase { int x = 1; };
struct SDerived : SBase {};      // public inheritance by default
class  CDerived : SBase {};      // PRIVATE inheritance by default

int main() {
    std::println("sizeof(S) == sizeof(C)            : {}", sizeof(S) == sizeof(C));
    std::println("is_standard_layout S / C          : {} / {}",
                 std::is_standard_layout_v<S>, std::is_standard_layout_v<C>);
    std::println("is_trivially_copyable S / C       : {} / {}",
                 std::is_trivially_copyable_v<S>, std::is_trivially_copyable_v<C>);
    std::println("is_aggregate S / C                : {} / {}",
                 std::is_aggregate_v<S>, std::is_aggregate_v<C>);
    std::println("SBase* <- SDerived* converts      : {}",
                 std::is_convertible_v<SDerived*, SBase*>);
    std::println("SBase* <- CDerived* converts      : {}",
                 std::is_convertible_v<CDerived*, SBase*>);
    S s{1}; C c; c.a = 1;
    std::println("both usable                       : {} {}", s.a, c.a);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 sc.cpp && ./sc">
{`sizeof(S) == sizeof(C)            : true
is_standard_layout S / C          : true / true
is_trivially_copyable S / C       : true / true
is_aggregate S / C                : true / true
SBase* <- SDerived* converts      : true
SBase* <- CDerived* converts      : false
both usable                       : 1 1`}
      </CodeBlock>

      <p>
        Identical on every property that matters, and then that last pair of lines is the second
        half of the same rule: <strong>inheritance is public by default for a{' '}
        <code>struct</code> and private by default for a <code>class</code></strong>. A{' '}
        <code>CDerived*</code> does not convert to an <code>SBase*</code> because the base is
        private. That is the one place the default bites in real code, and{' '}
        <a href="/cpp/inheritance">the next lesson</a> covers what private inheritance even means.
      </p>
      <p>
        When you forget which default you are in, the error is at least clear about it:
      </p>

      <CodeBlock language="cpp" title="sc2.cpp">
{`class Point { int x; int y; };   // 'class' => both members are private
struct Vec   { int x; int y; };  // 'struct' => both members are public

int main() {
    Point p;
    Vec v{1, 2};
    return p.x + v.x;            // only p.x is an error
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only sc2.cpp">
{`sc2.cpp:7:14: error: 'x' is a private member of 'Point'
    7 |     return p.x + v.x;            // only p.x is an error
      |              ^
sc2.cpp:1:19: note: implicitly declared private here
    1 | class Point { int x; int y; };   // 'class' => both members are private
      |                   ^
1 error generated.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The convention everyone actually uses">
        <p>
          Because the language does not care, the choice is a signal to readers. The convention in
          the C++ Core Guidelines, and in most codebases:
        </p>
        <ul>
          <li>
            <strong><code>struct</code></strong> for a bag of public data with no invariant —{' '}
            <code>struct Point {'{'} double x, y; {'}'};</code>. If any combination of member values
            is valid, it is a <code>struct</code>. These are also <em>aggregates</em>, which means
            you get <code>Point p{'{'}1, 2{'}'}</code> and C++20 designated initialisers for free.
          </li>
          <li>
            <strong><code>class</code></strong> when there is an invariant to protect — when some
            member values are illegal, or two members have to agree with each other. The invariant
            is established by a constructor and preserved by the public methods, and{' '}
            <code>private</code> is what makes that enforceable.
          </li>
        </ul>
        <p>
          Java has no version of this decision because Java has no aggregate initialisation and no
          free functions; a Java <code>record</code> is the closest thing to the{' '}
          <code>struct</code> case.
        </p>
      </InfoBox>

      <h2>The Member Initialiser List Is Not Decoration</h2>
      <p>
        This is the first real divergence. In Java you write:
      </p>

      <CodeBlock language="java" title="The Java shape, which is also the C++ shape people reach for first">
{`class ListInit {
    private final Noisy m;
    ListInit(Noisy n) { this.m = n; }     // assignment in the body. Idiomatic Java.
}`}
      </CodeBlock>

      <p>
        In C++ that same shape costs you an extra object. Here it is with an instrumented member, so
        there is no guessing about which function ran:
      </p>

      <CodeBlock language="cpp" title="init.cpp">
{`#include <print>
#include <string>
#include <utility>

// An instrumented member: every special member announces itself.
struct Noisy {
    std::string tag;
    Noisy() : tag("default")                          { std::println("    Noisy()  default-constructed"); }
    explicit Noisy(std::string t) : tag(std::move(t)) { std::println("    Noisy(\\"{}\\")  constructed", tag); }
    Noisy(const Noisy& o) : tag(o.tag)                { std::println("    Noisy(const Noisy&)  COPY-constructed from \\"{}\\"", o.tag); }
    Noisy(Noisy&& o) noexcept : tag(std::move(o.tag)) { std::println("    Noisy(Noisy&&)  MOVE-constructed"); }
    Noisy& operator=(const Noisy& o) { tag = o.tag;            std::println("    operator=(const Noisy&)  COPY-ASSIGNED from \\"{}\\"", o.tag); return *this; }
    Noisy& operator=(Noisy&& o) noexcept { tag = std::move(o.tag); std::println("    operator=(Noisy&&)  MOVE-ASSIGNED"); return *this; }
    ~Noisy() { std::println("    ~Noisy()  \\"{}\\" destroyed", tag); }
};

// Version A: the member initialiser list. The member is built once, directly.
struct ListInit {
    Noisy m;
    explicit ListInit(const Noisy& n) : m(n) { std::println("  ListInit body runs"); }
};

// Version B: assignment in the constructor body -- the Java shape.
struct BodyAssign {
    Noisy m;
    explicit BodyAssign(const Noisy& n) { m = n; std::println("  BodyAssign body runs"); }
};

int main() {
    Noisy source{"source"};
    std::println("");
    std::println("--- ListInit li{{source}} ---");
    { ListInit li{source}; }
    std::println("");
    std::println("--- BodyAssign ba{{source}} ---");
    { BodyAssign ba{source}; }
    std::println("");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 init.cpp && ./init">
{`    Noisy("source")  constructed

--- ListInit li{source} ---
    Noisy(const Noisy&)  COPY-constructed from "source"
  ListInit body runs
    ~Noisy()  "source" destroyed

--- BodyAssign ba{source} ---
    Noisy()  default-constructed
    operator=(const Noisy&)  COPY-ASSIGNED from "source"
  BodyAssign body runs
    ~Noisy()  "source" destroyed

    ~Noisy()  "source" destroyed`}
      </CodeBlock>

      <p>
        <strong>One operation versus two.</strong> The initialiser-list version copy-constructs{' '}
        <code>m</code> directly from <code>n</code>. The body-assignment version
        default-constructs <code>m</code> first — because <em>every member is constructed before the
        body runs, whether you asked for it or not</em> — and then throws that default-constructed
        value away with a copy assignment.
      </p>
      <p>
        For a <code>std::string</code> member that is one wasted allocation. For a member holding a
        database connection or a 4 MB buffer it is a wasted connection or a wasted 4 MB. And it is
        invisible: both versions compile, both produce the right value, and{' '}
        <code>-Wall -Wextra</code> says nothing.
      </p>
      <p>
        The other half of the argument is that for two kinds of member the body form does not
        compile at all:
      </p>

      <CodeBlock language="cpp" title="init2.cpp">
{`#include <string>

struct Needs {
    const int id;          // const: can only be initialised, never assigned
    std::string& alias;    // reference: must be bound at construction
    Needs(int i, std::string& a) { id = i; alias = a; }   // both wrong
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only init2.cpp (3 errors, two shown)">
{`init2.cpp:6:5: error: constructor for 'Needs' must explicitly initialize the
      const member 'id'
    6 |     Needs(int i, std::string& a) { id = i; alias = a; }   // both wrong
      |     ^
init2.cpp:6:5: error: constructor for 'Needs' must explicitly initialize the
      reference member 'alias'
    6 |     Needs(int i, std::string& a) { id = i; alias = a; }   // both wrong
      |     ^
init2.cpp:6:39: error: cannot assign to non-static data member 'id' with
      const-qualified type 'const int'
    6 |     Needs(int i, std::string& a) { id = i; alias = a; }   // both wrong
      |                                    ~~ ^`}
      </CodeBlock>

      <p>
        <code>const</code> members and reference members have exactly one chance to get a value, and
        it is the initialiser list. Note how different this is from Java&apos;s{' '}
        <code>final</code>: a Java <code>final</code> field <em>is</em> assigned in the constructor
        body, because the field starts out as a reserved slot and the compiler just verifies it is
        written once. A C++ <code>const</code> member starts out as a constructed object, and
        there is no later point at which writing to it means anything.
      </p>

      <h3>Default member initialisers and delegating constructors</h3>
      <p>
        Two features that remove most hand-written constructors. A <strong>default member
        initialiser</strong> is a value written at the declaration, used by any constructor that
        does not mention that member. A <strong>delegating constructor</strong> calls another
        constructor of the same class — the equivalent of Java&apos;s <code>this(...)</code>.
      </p>

      <CodeBlock language="cpp" title="deleg.cpp">
{`#include <print>
#include <string>

struct Counter {
    static int built;
    int v;
    Counter() : v(0) { ++built; std::println("    Counter() default"); }
    explicit Counter(int x) : v(x) { ++built; std::println("    Counter({})", x); }
};
int Counter::built = 0;

struct Config {
    // Default member initialisers: the fallback if a constructor does not
    // mention the member.
    Counter c{99};
    std::string host = "localhost";
    int port = 8080;

    Config() { std::println("  Config() -- no init list at all"); }
    explicit Config(int p) : port(p) { std::println("  Config(int) -- only port in the list"); }
    Config(std::string h, int p) : c(7), host(std::move(h)), port(p) {
        std::println("  Config(string,int) -- names c explicitly");
    }
    // A delegating constructor: calls another constructor of the same class.
    explicit Config(const char* h) : Config(std::string{h}, 443) {
        std::println("  Config(const char*) delegated, then ran its own body");
    }
};

// C++20 designated initialisers on an aggregate (no user ctors, no private members).
struct Point { int x = 0; int y = 0; int z = 0; };

int main() {
    std::println("Config a{{}}:");
    Config a{};
    std::println("  -> c.v={} host={} port={}", a.c.v, a.host, a.port);
    std::println("Config b{{9090}}:");
    Config b{9090};
    std::println("  -> c.v={} host={} port={}", b.c.v, b.host, b.port);
    std::println("Config d{{\\"example.com\\"}}:");
    Config d{"example.com"};
    std::println("  -> c.v={} host={} port={}", d.c.v, d.host, d.port);
    std::println("Counter::built = {}", Counter::built);

    Point p{.x = 1, .z = 3};        // C++20
    std::println("Point{{.x=1,.z=3}} -> x={} y={} z={}", p.x, p.y, p.z);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 deleg.cpp && ./deleg">
{`Config a{}:
    Counter(99)
  Config() -- no init list at all
  -> c.v=99 host=localhost port=8080
Config b{9090}:
    Counter(99)
  Config(int) -- only port in the list
  -> c.v=99 host=localhost port=9090
Config d{"example.com"}:
    Counter(7)
  Config(string,int) -- names c explicitly
  Config(const char*) delegated, then ran its own body
  -> c.v=7 host=example.com port=443
Counter::built = 3
Point{.x=1,.z=3} -> x=1 y=0 z=3`}
      </CodeBlock>

      <p>
        Three <code>Config</code> objects, <strong><code>Counter::built = 3</code></strong>. That
        number is the point. The default member initialiser <code>Counter c{'{'}99{'}'}</code> is
        not an extra construction that later gets overwritten — it is the initialiser used{' '}
        <em>instead</em> when the constructor stays quiet, and when{' '}
        <code>Config(string,int)</code> says <code>c(7)</code> that replaces it entirely. One{' '}
        <code>Counter</code> per <code>Config</code>, never two.
      </p>
      <p>
        The delegating constructor ran <code>Config(string,int)</code> to completion first and then
        its own body — so the output order is <code>Counter(7)</code>, the delegate&apos;s message,
        then the delegator&apos;s. Delegation is a full construction, not a jump.
      </p>

      <InfoBox variant="tip" title="Prefer default member initialisers to constructors">
        <p>
          A default member initialiser applies to <em>every</em> constructor, including ones added
          later by somebody else, which makes it the cheapest available defence against the
          uninitialised-read bug from{' '}
          <a href="/cpp/memory-bugs">the bug catalogue</a>. Writing{' '}
          <code>int port = 8080;</code> or just <code>int port{'{}'};</code> at the declaration
          means no future constructor can forget it.
        </p>
        <p>
          The practical rule: give every member a default member initialiser, then write
          constructors only for the members that genuinely need a caller-supplied value. A{' '}
          <code>struct</code> with all-defaulted members and no constructors at all is also an
          aggregate, which gets you <code>Point{'{'}.x = 1, .z = 3{'}'}</code> — C++20 designated
          initialisers, named arguments in all but name, and a feature C++ borrowed from C99.
        </p>
      </InfoBox>

      <h2>Initialisation Order Follows Declaration Order</h2>
      <p>
        Now the trap. The initialiser list looks like a sequence of statements. It is not. It is an
        unordered set of instructions for how to initialise each member, and the{' '}
        <strong>order of execution is the order the members are declared in the class</strong>,
        regardless of how you write the list.
      </p>
      <p>
        That rule exists for a good reason — the destructor has to destroy members in exactly the
        reverse order, and it has no initialiser list to consult, so the order must be a property of
        the type and not of the constructor. The consequence is that a list which reads correctly
        top-to-bottom can execute in a completely different order.
      </p>

      <CodeBlock language="cpp" title="order2.cpp">
{`#include <print>
#include <vector>

struct Window {
    int width;       // declared 1st
    int height;      // declared 2nd
    int area;        // declared 3rd

    // Declaration order and list order agree, so this one is correct.
    Window(int w, int h)
        : width(w)
        , height(h)
        , area(width * height) {}
};

struct WindowSwapped {
    int area;        // declared 1st -- the only change
    int width;
    int height;

    // Identical constructor. But area runs FIRST now, reading two
    // uninitialised ints.
    WindowSwapped(int w, int h)
        : width(w)
        , height(h)
        , area(width * height) {}
};

struct Buffer {
    std::size_t count;        // declared FIRST
    std::vector<int> data;    // declared SECOND

    explicit Buffer(std::vector<int> v) : data(std::move(v)), count(data.size()) {}
};

int main() {
    Window w{4, 5};
    std::println("Window{{4,5}}.area        = {}   (should be 20)", w.area);
    WindowSwapped ws{4, 5};
    std::println("WindowSwapped{{4,5}}.area = {}   (should be 20)", ws.area);
    Buffer b{{1, 2, 3, 4}};
    std::println("Buffer.count            = {}   (should be 4)", b.count);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same source at two optimisation levels">
{`$ clang++ -std=c++23 -O0 order2.cpp -o o20 && ./o20
Window{4,5}.area        = 20   (should be 20)
WindowSwapped{4,5}.area = -300107152   (should be 20)
Buffer.count            = 1347454048   (should be 4)

$ clang++ -std=c++23 -O2 order2.cpp -o o22 && ./o22
Window{4,5}.area        = 20   (should be 20)
WindowSwapped{4,5}.area = 20   (should be 20)       <- the BROKEN one is now right
Buffer.count            = 0   (should be 4)`}
      </CodeBlock>

      <p>
        Read the <code>WindowSwapped</code> row across. <strong>Garbage at <code>-O0</code>, the
        correct answer at <code>-O2</code>.</strong> The only difference between it and{' '}
        <code>Window</code> is which line the <code>area</code> member is declared on. This is the
        undefined-behaviour pattern from{' '}
        <a href="/cpp/memory-bugs">the bug catalogue</a> appearing in ordinary-looking class code:
        a program whose debug build is obviously broken and whose release build passes the test.
      </p>
      <p>
        And <code>Buffer</code> is the realistic version, because nobody writes{' '}
        <code>area(width * height)</code> by accident, but <em>everybody</em> writes{' '}
        <code>count(data.size())</code>. It reads as though <code>data</code> is initialised first.
        It is not, because <code>count</code> is declared first.
      </p>

      <h3>This is one of the few places <code>-Wall</code> earns its keep</h3>
      <p>
        Phase 2 spent a whole lesson on how little the warning flags catch. Here they catch
        everything, which is worth recording with the same precision:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fsyntax-only order2.cpp">
{`order2.cpp:25:11: warning: field 'height' will be initialized after field 'area' [-Wreorder-ctor]
order2.cpp:26:16: warning: field 'width' is uninitialized when used here [-Wuninitialized]
order2.cpp:26:24: warning: field 'height' is uninitialized when used here [-Wuninitialized]
order2.cpp:33:43: warning: field 'data' will be initialized after field 'count' [-Wreorder-ctor]
order2.cpp:33:69: warning: field 'data' is uninitialized when used here [-Wuninitialized]`}
      </CodeBlock>

      <p>
        Five warnings, both bugs, and <code>-Wreorder-ctor</code> even prints the corrected list
        order underneath. Checked rather than assumed, because the grouping matters:
      </p>

      <CodeBlock language="text" title="Real output — which flag enables it (count of -Wreorder-ctor warnings)">
{`$ clang++ -std=c++23           -fsyntax-only order2.cpp   -> 0
$ clang++ -std=c++23 -Wall     -fsyntax-only order2.cpp   -> 2
$ clang++ -std=c++23 -Wextra   -fsyntax-only order2.cpp   -> 0`}
      </CodeBlock>

      <p>
        <strong><code>-Wreorder-ctor</code> is in <code>-Wall</code>, not{' '}
        <code>-Wextra</code>.</strong> So the mitigation is simply to have{' '}
        <code>-Wall -Werror</code> on, and then write your initialiser list in declaration order
        because the compiler will make you. If you keep one habit from this section about class
        layout, make it that: <strong>write the list in the same order as the declarations, every
        time</strong>, and the trap cannot fire.
      </p>

      <FlowChart
        title="What actually happens when you construct an object"
        chart={
          'graph TD\n' +
          '  S["Widget w{args};"] --> OR["1. Overload resolution picks ONE constructor<br/>from all the candidates, including the<br/>compiler-generated ones"]\n' +
          '  OR --> B["2. Base classes initialise, in<br/>declaration order<br/>(the subject of the next lesson)"]\n' +
          '  B --> M["3. Non-static data members initialise in<br/>DECLARATION ORDER — not the order of<br/>the initialiser list"]\n' +
          '  M --> M1{"Is this member named<br/>in the initialiser list?"}\n' +
          '  M1 -->|yes| ML["Use the list entry.<br/>ONE operation: the member is constructed<br/>directly from those arguments."]\n' +
          '  M1 -->|"no, but it has a default<br/>member initialiser"| MD["Use the = or {} at the declaration.<br/>Measured: Counter::built = 3 for three<br/>Configs — one construction each, not two."]\n' +
          '  M1 -->|"no, and no default<br/>member initialiser"| MN["Default-construct it.<br/>For int/pointer members that means<br/>INDETERMINATE — a real uninitialised read."]\n' +
          '  ML --> BODY\n' +
          '  MD --> BODY\n' +
          '  MN --> BODY["4. NOW the constructor body runs.<br/>Every member already exists."]\n' +
          '  BODY --> ASSIGN["m = x; in the body is therefore a SECOND<br/>operation on a built object.<br/>Measured: default-construct + copy-assign,<br/>versus one copy-construct via the list."]\n' +
          '  M --> ORDER["Why declaration order?<br/>Because ~Widget must destroy members in<br/>exactly reverse order, and it has no<br/>initialiser list to consult. The order has<br/>to be a property of the TYPE."]\n' +
          '  ORDER --> TRAP["So count(data.size()) with count declared<br/>FIRST reads data before it exists.<br/>Measured: 1347454048 at -O0, 0 at -O2."]\n' +
          '  TRAP --> W["Caught by -Wall (-Wreorder-ctor<br/>plus -Wuninitialized). NOT by -Wextra alone."]\n' +
          '  style ML fill:#1a3329,stroke:#4ade80\n' +
          '  style MD fill:#1a3329,stroke:#4ade80\n' +
          '  style W fill:#1a3329,stroke:#4ade80\n' +
          '  style MN fill:#3d2f14,stroke:#fb923c\n' +
          '  style ASSIGN fill:#3d2f14,stroke:#fb923c\n' +
          '  style TRAP fill:#3b1a1a,stroke:#f87171\n' +
          '  style ORDER fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h2><code>explicit</code>: The Keyword That Prevents A Real Bug</h2>
      <p>
        A constructor callable with one argument is, by default, also an{' '}
        <strong>implicit conversion</strong> from that argument&apos;s type to your class. The
        compiler will apply it silently, anywhere a value of your type is wanted. There is no Java
        equivalent — Java has no user-defined conversions at all — so this is a blind spot rather
        than a difference.
      </p>

      <CodeBlock language="cpp" title="expl.cpp">
{`#include <print>

// A unit type, the thing C++ is good at -- except for one missing keyword.
struct Seconds {
    long value;
    Seconds(long v) : value(v) {}        // NOT explicit
};

struct Millis {
    long value;
    explicit Millis(long v) : value(v) {}   // explicit
};

void wait(Seconds s)   { std::println("  wait(): sleeping for {} seconds", s.value); }
void waitms(Millis m)  { std::println("  waitms(): sleeping for {} ms", m.value); }

int main() {
    std::println("1. the call the author intended:");
    wait(Seconds{30});

    std::println("2. a caller who thought the unit was milliseconds:");
    wait(500);                      // compiles. 500 SECONDS.

    std::println("3. a caller who passed a double:");
    wait(2.9);                      // double -> long -> Seconds. Truncates.

    std::println("4. a caller who passed a bool:");
    wait(true);                     // bool -> long -> Seconds. One second.

    std::println("5. copy-initialisation from an int:");
    Seconds s = 42;                 // allowed: implicit conversion
    std::println("  Seconds s = 42; -> {}", s.value);

    std::println("6. the explicit version requires you to say what you mean:");
    waitms(Millis{500});
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 expl.cpp && ./expl">
{`expl.cpp:25:10: warning: implicit conversion from 'double' to 'long' changes value from 2.9 to 2 [-Wliteral-conversion]
1 warning generated.

1. the call the author intended:
  wait(): sleeping for 30 seconds
2. a caller who thought the unit was milliseconds:
  wait(): sleeping for 500 seconds
3. a caller who passed a double:
  wait(): sleeping for 2 seconds
4. a caller who passed a bool:
  wait(): sleeping for 1 seconds
5. copy-initialisation from an int:
  Seconds s = 42; -> 42
6. the explicit version requires you to say what you mean:
  waitms(): sleeping for 500 ms`}
      </CodeBlock>

      <p>
        <code>wait(500)</code> compiled and meant <strong>500 seconds</strong>. The whole point of
        wrapping a <code>long</code> in a <code>Seconds</code> type was to make that call
        impossible, and one missing keyword gave it away. <code>wait(true)</code> is worse: a{' '}
        <code>bool</code> promotes to <code>long</code>, so a stray boolean becomes a one-second
        sleep, and nothing warned. Only the <code>double</code> case produced a diagnostic, and it
        was about the truncation rather than about the conversion to <code>Seconds</code>.
      </p>
      <p>
        Add the keyword and all three misuses stop compiling:
      </p>

      <CodeBlock language="cpp" title="expl2.cpp">
{`struct Millis { long value; explicit Millis(long v) : value(v) {} };
void waitms(Millis m);

int main() {
    waitms(500);          // error
    Millis m = 42;        // error
    waitms(2.9);          // error
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only expl2.cpp (trimmed to the key notes)">
{`expl2.cpp:5:5: error: no matching function for call to 'waitms'
    5 |     waitms(500);          // error
      |     ^~~~~~
expl2.cpp:2:6: note: candidate function not viable: no known conversion
      from 'int' to 'Millis' for 1st argument

expl2.cpp:6:12: error: no viable conversion from 'int' to 'Millis'
    6 |     Millis m = 42;        // error
      |            ^   ~~
expl2.cpp:1:38: note: explicit constructor is not a candidate
    1 | struct Millis { long value; explicit Millis(long v) : value(v) {} };
      |                                      ^

expl2.cpp:7:5: error: no matching function for call to 'waitms'
    7 |     waitms(2.9);          // error
3 errors generated.`}
      </CodeBlock>

      <p>
        <code>explicit constructor is not a candidate</code> is the line to recognise. It means the
        constructor exists and would do what you want, but you have to name the type:{' '}
        <code>waitms(Millis{'{'}500{'}'})</code>.
      </p>

      <InfoBox variant="warning" title="The rule, and the two cases where you genuinely want the conversion">
        <p>
          <strong>Mark every single-argument constructor <code>explicit</code> unless you have
          thought about it and decided otherwise.</strong> It is one of maybe three keywords in C++
          where the safe choice is more typing and the default is wrong; <code>override</code>, in{' '}
          <a href="/cpp/inheritance">the next lesson</a>, is another.
        </p>
        <p>
          The exceptions are real, though. <strong>Wrapper and view types</strong> want the
          conversion — <code>std::string_view</code> from <code>const char*</code>, or{' '}
          <code>std::string</code> from a literal — because the whole point is that the conversion
          is free and lossless and you want <code>f("hello")</code> to work.{' '}
          <strong>Arithmetic-like value types</strong> want it too, so that{' '}
          <code>money + 1</code> compiles; the <code>friend</code> section at the end of this page
          has a measured example where the non-<code>explicit</code> constructor is what makes the
          symmetric operators usable.
        </p>
        <p>
          Also note <code>explicit</code> is not only about one-argument constructors. It applies to
          multi-argument constructors reached by braced initialisation, and to conversion operators
          (<code>explicit operator bool()</code> is the idiom that makes{' '}
          <code>if (ptr)</code> work without <code>ptr + 1</code> compiling). C++20 added{' '}
          <code>explicit(<em>bool</em>)</code> for templates that need to be conditionally explicit,
          which is what <code>std::pair</code> and <code>std::tuple</code> use internally.
        </p>
      </InfoBox>

      <h2><code>= default</code> and <code>= delete</code></h2>
      <p>
        Two small pieces of syntax that do most of the work in the rest of this lesson.{' '}
        <code>= default</code> asks the compiler for the member it would have generated.{' '}
        <code>= delete</code> declares the member and makes using it a compile error.
      </p>
      <p>
        <code>= default</code> is not the same as writing an empty body, and the difference is
        measurable:
      </p>

      <CodeBlock language="cpp" title="defdel.cpp">
{`#include <print>
#include <type_traits>

struct Plain     { int a; int b; };
struct Defaulted { int a; int b; Defaulted() = default; ~Defaulted() = default;
                   Defaulted(const Defaulted&) = default; };
struct Written   { int a; int b; Written() {} ~Written() {}
                   Written(const Written& o) : a(o.a), b(o.b) {} };

template <class T> void show(const char* n) {
    std::println("{:<11} trivial={:<5} trivially_copyable={:<5} triv_default_ctor={:<5} triv_dtor={:<5} sizeof={}",
                 n, std::is_trivial_v<T>, std::is_trivially_copyable_v<T>,
                 std::is_trivially_default_constructible_v<T>,
                 std::is_trivially_destructible_v<T>, sizeof(T));
}

int main() {
    show<Plain>("Plain");
    show<Defaulted>("Defaulted");
    show<Written>("Written");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 defdel.cpp && ./defdel">
{`Plain       trivial=true  trivially_copyable=true  triv_default_ctor=true  triv_dtor=true  sizeof=8
Defaulted   trivial=true  trivially_copyable=true  triv_default_ctor=true  triv_dtor=true  sizeof=8
Written     trivial=false trivially_copyable=false triv_default_ctor=false triv_dtor=false sizeof=8`}
      </CodeBlock>

      <p>
        <code>= default</code> keeps the type <strong>trivial</strong>; the hand-written equivalent
        with identical behaviour does not. That is not pedantry about a trait name. Trivially
        copyable types can be relocated with a single <code>memcpy</code>, which is how{' '}
        <code>std::vector</code> reallocates them, and trivially destructible types let a container
        skip the destructor loop entirely. <code>Written</code>&apos;s empty, pointless
        destructor costs <code>std::vector&lt;Written&gt;</code> a per-element loop forever.
      </p>
      <p>
        <code>= delete</code> is the other half. Its best-known use is making a type non-copyable,
        but it also works on ordinary overloads, where it is the cleanest way to ban a conversion
        you do not want:
      </p>

      <CodeBlock language="cpp" title="defdel2.cpp">
{`void take(int);
void take(double) = delete;         // refuse the lossy call outright

struct NonCopyable {
    int v = 0;
    NonCopyable() = default;
    NonCopyable(const NonCopyable&) = delete;
    NonCopyable& operator=(const NonCopyable&) = delete;
};

int main() {
    take(1);              // fine
    take(2.5);            // error: deleted
    NonCopyable a;
    NonCopyable b = a;    // error: deleted copy ctor
    return b.v;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only defdel2.cpp">
{`defdel2.cpp:13:5: error: call to deleted function 'take'
   13 |     take(2.5);        // error: deleted
      |     ^~~~
defdel2.cpp:2:6: note: candidate function has been explicitly deleted
    2 | void take(double) = delete;
      |      ^
defdel2.cpp:1:6: note: candidate function
    1 | void take(int);
      |      ^
defdel2.cpp:15:17: error: call to deleted constructor of 'NonCopyable'
   15 |     NonCopyable b = a;  // error: deleted copy ctor
      |                 ^   ~
defdel2.cpp:7:5: note: 'NonCopyable' has been explicitly marked deleted
      here
    7 |     NonCopyable(const NonCopyable&) = delete;
      |     ^
2 errors generated.`}
      </CodeBlock>

      <p>
        Note what <code>= delete</code> does and does not do.{' '}
        <strong>The function still participates in overload resolution</strong> — it is chosen,
        and <em>then</em> the call is rejected. That is the whole trick: a deleted{' '}
        <code>take(double)</code> is a better match for <code>2.5</code> than{' '}
        <code>take(int)</code>, so it wins and errors, instead of silently truncating. The old way
        of doing this was to declare the function private and never define it, which produced a
        link error at best and a confusing access error at worst.{' '}
        <a href="/cpp/functions">The functions lesson</a> covers overload resolution itself.
      </p>

      <InfoBox variant="info" title="C++26 lets you say why, and it works on this compiler">
        <p>
          <a href="/cpp/intro">The intro</a> established that <code>-std=c++26</code> on this
          toolchain is partial, and reported <code>__cpp_deleted_function = 202403</code> as
          available. Confirming that it does what it claims:
        </p>
        <CodeBlock language="cpp" title="defdel3.cpp">
{`void take(int);
void take(double) = delete("pass an integral count, not a fractional one");
int main() { take(2.5); }`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++26 -fmessage-length=74 -fsyntax-only defdel3.cpp">
{`defdel3.cpp:3:14: error: call to deleted function 'take': pass an integral
      count, not a fractional one
    3 | int main() { take(2.5); }
      |              ^~~~`}
      </CodeBlock>
        <p>
          The reason string is appended to the error. Worth knowing it exists; not worth depending
          on until your whole toolchain is on C++26.
        </p>
      </InfoBox>

      <h2>The Six Special Members</h2>
      <p>
        These are the functions the compiler will write for you if you do not. Six, not five — the
        &quot;rule of five&quot; counts the ones that matter for resource ownership and leaves out
        the default constructor.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Member</th>
            <th style={headStyle}>Signature</th>
            <th style={headStyle}>When it runs</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>default constructor</td>
            <td style={cellStyle}><code>T()</code></td>
            <td style={cellStyle}><code>T a;</code> or <code>T a{'{}'};</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>destructor</td>
            <td style={cellStyle}><code>~T()</code></td>
            <td style={cellStyle}>scope exit, <code>delete</code>, container removal — see{' '}
              <a href="/cpp/raii">RAII</a></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>copy constructor</td>
            <td style={cellStyle}><code>T(const T&amp;)</code></td>
            <td style={cellStyle}>building a <em>new</em> object from an existing one:{' '}
              <code>T b = a;</code>, pass-by-value</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>copy assignment</td>
            <td style={cellStyle}><code>T&amp; operator=(const T&amp;)</code></td>
            <td style={cellStyle}>overwriting an <em>existing</em> object: <code>b = a;</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>move constructor</td>
            <td style={cellStyle}><code>T(T&amp;&amp;)</code></td>
            <td style={cellStyle}><code>T b = std::move(a);</code>, returning a local — see{' '}
              <a href="/cpp/move-semantics">move semantics</a></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>move assignment</td>
            <td style={cellStyle}><code>T&amp; operator=(T&amp;&amp;)</code></td>
            <td style={cellStyle}><code>b = std::move(a);</code></td>
          </tr>
        </tbody>
      </table>

      <p>
        The distinction people get wrong is the first four versus the second two in each pair:{' '}
        <strong>construction builds an object that did not exist; assignment overwrites one that
        did.</strong> That is why the assignment operators have work the constructors do not — they
        have to dispose of the old contents first, and they have to cope with being handed the
        object they are already inside.
      </p>
      <p>
        One syntactic note, since this is a common misread.{' '}
        <code>T b = a;</code> calls the <strong>copy constructor</strong>, not copy assignment,
        despite the <code>=</code>. The rule is whether <code>b</code> is being declared. If the{' '}
        <code>=</code> is part of a declaration it is initialisation; otherwise it is assignment.
      </p>

      <h2>The Generation Rules, Measured</h2>
      <p>
        Here is the subtle part, and it is the reason this lesson exists. The six members are not
        generated independently. Declaring any one of them changes whether others are generated,
        deleted, or quietly fall back to a worse alternative. The rules are notoriously hard to
        remember, so rather than restate them, here they are measured.
      </p>
      <p>
        The harness uses a member that counts which operation actually ran, because the type traits
        alone do not tell the truth — <a href="/cpp/move-semantics">the move-semantics lesson</a>{' '}
        established that <code>is_move_constructible_v</code> reports <code>true</code> for a type
        whose &quot;move&quot; is really a copy, because a copy constructor can legally bind an
        rvalue.
      </p>

      <CodeBlock language="cpp" title="special.cpp">
{`#include <print>
#include <string>
#include <type_traits>
#include <utility>

// A member that reports which operation actually ran.
int copies = 0, moves = 0, copy_assigns = 0, move_assigns = 0;
struct Probe {
    std::string s{"long enough that a copy would really allocate"};
    Probe() = default;
    Probe(const Probe& o) : s(o.s)                { ++copies; }
    Probe(Probe&& o) noexcept : s(std::move(o.s)) { ++moves; }
    Probe& operator=(const Probe& o)     { s = o.s;            ++copy_assigns; return *this; }
    Probe& operator=(Probe&& o) noexcept { s = std::move(o.s); ++move_assigns; return *this; }
    ~Probe() = default;
};

struct Zero  { Probe p; };                                        // declares NOTHING
struct Dtor  { Probe p; ~Dtor() {} };                             // declares a destructor
struct CopyC { Probe p; CopyC() = default; CopyC(const CopyC&) = default; };
struct CopyA { Probe p; CopyA& operator=(const CopyA&) = default; };
struct MoveC { Probe p; MoveC() = default; MoveC(MoveC&&) = default; };
struct MoveA { Probe p; MoveA& operator=(MoveA&&) = default; };
struct Five  {                                                    // declares all five
    Probe p;
    Five() = default;
    Five(const Five&) = default;
    Five& operator=(const Five&) = default;
    Five(Five&&) noexcept = default;
    Five& operator=(Five&&) noexcept = default;
    ~Five() = default;
};

template <class T>
void probe(const char* name) {
    constexpr bool dc  = std::is_default_constructible_v<T>;
    constexpr bool cc  = std::is_copy_constructible_v<T>;
    constexpr bool ca  = std::is_copy_assignable_v<T>;
    constexpr bool mc  = std::is_move_constructible_v<T>;
    constexpr bool ma  = std::is_move_assignable_v<T>;
    constexpr bool nmc = std::is_nothrow_move_constructible_v<T>;

    // Now the empirical half: build one from an rvalue and see what ran.
    const char* ctor_ran = "n/a";
    if constexpr (dc && mc) {
        copies = moves = 0;
        T a{};
        T b{std::move(a)};
        (void)b;
        ctor_ran = (moves == 1) ? "MOVED" : (copies == 1 ? "copied!" : "neither");
    }
    const char* assign_ran = "n/a";
    if constexpr (dc && ma) {
        copy_assigns = move_assigns = 0;
        T a{}, b{};
        b = std::move(a);
        assign_ran = (move_assigns == 1) ? "MOVED" : (copy_assigns == 1 ? "copied!" : "neither");
    }

    std::println("{:<7} {:<6} {:<6} {:<6} {:<6} {:<6} {:<6} {:<8} {}",
                 name, dc, cc, ca, mc, ma, nmc, ctor_ran, assign_ran);
}

int main() {
    std::println("{:<7} {:<6} {:<6} {:<6} {:<6} {:<6} {:<6} {:<8} {}",
                 "type", "def", "copy", "copy=", "move", "move=", "nothr",
                 "T b{move(a)}", "b = move(a)");
    probe<Zero>("Zero");    probe<Dtor>("Dtor");
    probe<CopyC>("CopyC");  probe<CopyA>("CopyA");
    probe<MoveC>("MoveC");  probe<MoveA>("MoveA");
    probe<Five>("Five");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 special.cpp && ./special">
{`type    def    copy   copy=  move   move=  nothr  T b{move(a)} b = move(a)
Zero    true   true   true   true   true   true   MOVED    MOVED
Dtor    true   true   true   true   true   false  copied!  copied!
CopyC   true   true   true   true   true   false  copied!  copied!
CopyA   true   true   true   true   true   false  copied!  copied!
MoveC   true   false  false  true   false  true   MOVED    n/a
MoveA   true   false  false  false  true   false  n/a      MOVED`}
      </CodeBlock>

      <p>
        (<code>Five</code> printed the same row as <code>Zero</code> —{' '}
        <code>true</code> across the board and <code>MOVED</code> twice — which is the point of
        declaring all five.)
      </p>
      <p>
        Three findings in that table, in increasing order of how much they will cost you.
      </p>

      <h3>1. Declaring a destructor turns every move into a copy</h3>
      <p>
        Row <code>Dtor</code>. The class is <code>{'{'} Probe p; ~Dtor() {'{}'} {'}'}</code> — one
        empty destructor, no other change. <code>is_move_constructible_v</code> still says{' '}
        <code>true</code>, and the operation that actually ran was <strong><code>copied!</code>
        </strong>. The trait that tells the truth is <code>is_nothrow_move_constructible_v</code>,
        which flipped to <code>false</code>.
      </p>
      <p>
        This is the accident <a href="/cpp/move-semantics">the move-semantics lesson</a> measured
        at scale: seven moves became seven copies inside a <code>std::vector</code> because of one
        empty destructor. Rows <code>CopyC</code> and <code>CopyA</code> show the same thing from
        declaring either copy operation. <strong>Any of those three declarations suppresses both
        implicit move operations</strong>, and the fallback is a copy, which compiles and works and
        is slower.
      </p>

      <h3>2. Declaring a move operation <em>deletes</em> the copy operations</h3>
      <p>
        Rows <code>MoveC</code> and <code>MoveA</code>: <code>copy</code> and <code>copy=</code>{' '}
        are both <code>false</code>. Not &quot;not generated&quot; — <em>defined as deleted</em>, so
        a copy is a hard compile error. That is usually what you want (a type with a hand-written
        move is usually a resource owner that must not be copied) but it is a louder change than
        people expect from adding one function.
      </p>

      <h3>3. And the asymmetry nobody predicts</h3>
      <p>
        Look at <code>MoveC</code>&apos;s <code>move=</code> column: <code>false</code>. A class
        that declares <em>only</em> a move constructor <strong>cannot be assigned at all</strong>.
        The copy assignment is deleted because a move operation was declared, and the move
        assignment was never generated because you declared one of the group. Every form of{' '}
        <code>b = a</code> is gone.
      </p>
      <p>
        <code>MoveA</code> is the mirror image: declaring only move assignment leaves the type with{' '}
        <code>is_move_constructible_v == false</code>, so you cannot build one from an rvalue —
        there is no move constructor, and the copy constructor is deleted.
      </p>
      <p>
        <strong>That is the argument for the rule.</strong> Not elegance — the partial states are
        genuinely broken in ways that are hard to predict. Declare all five or declare none.
      </p>

      <FlowChart
        title="The special-member generation rules, as measured on this compiler"
        chart={
          'graph TD\n' +
          '  Q["What did you declare in your class?"] --> N["NOTHING<br/>(the rule of zero)"]\n' +
          '  Q --> D["a DESTRUCTOR<br/>— even an empty one"]\n' +
          '  Q --> C["a COPY ctor or COPY assignment"]\n' +
          '  Q --> M["a MOVE ctor or MOVE assignment"]\n' +
          '  Q --> A["ALL FIVE<br/>(the rule of five)"]\n' +
          '  N --> N1["All six are generated.<br/>Measured, struct Zero:<br/>copy ok, move ok,<br/>nothrow_move = true,<br/>T b{move(a)} -> MOVED"]\n' +
          '  D --> D1["Copy ops: still generated (deprecated).<br/>MOVE OPS: SUPPRESSED."]\n' +
          '  D1 --> D2["Measured, struct Dtor:<br/>is_move_constructible = TRUE (a lie —<br/>the copy ctor binds the rvalue)<br/>is_nothrow_move_constructible = FALSE<br/>T b{move(a)} -> copied!"]\n' +
          '  C --> C1["The OTHER copy op: generated but<br/>DEPRECATED (-Wextra: -Wdeprecated-copy).<br/>MOVE OPS: SUPPRESSED."]\n' +
          '  C1 --> C2["Measured, struct CopyC and CopyA:<br/>identical to Dtor —<br/>every move silently becomes a copy"]\n' +
          '  M --> M1["BOTH copy ops: DEFINED AS DELETED.<br/>The other move op: NOT generated."]\n' +
          '  M1 --> M2["Measured, struct MoveC (move ctor only):<br/>copy=false copy==false move==FALSE<br/>-> the type cannot be ASSIGNED AT ALL"]\n' +
          '  M1 --> M3["Measured, struct MoveA (move assign only):<br/>move=FALSE<br/>-> the type cannot be built from an rvalue"]\n' +
          '  A --> A1["All five behave.<br/>Measured, struct Five: identical row to<br/>struct Zero — MOVED, MOVED"]\n' +
          '  N1 --> AIM["AIM FOR THIS ONE.<br/>Compose out of string / vector /<br/>unique_ptr and declare nothing."]\n' +
          '  A1 --> OK["Acceptable when you own a raw resource<br/>that has no RAII wrapper yet."]\n' +
          '  D2 --> BAD["These three rows are the accident.<br/>Code compiles, tests pass, every move<br/>is a copy. Guard with<br/>static_assert(is_nothrow_move_constructible_v&lt;T&gt;)"]\n' +
          '  C2 --> BAD\n' +
          '  M2 --> BROKEN["These two are a half-built type.<br/>Declare all five instead."]\n' +
          '  M3 --> BROKEN\n' +
          '  style N1 fill:#1a3329,stroke:#4ade80\n' +
          '  style A1 fill:#1a3329,stroke:#4ade80\n' +
          '  style AIM fill:#1a3329,stroke:#4ade80\n' +
          '  style OK fill:#1a2744,stroke:#5b9cf6\n' +
          '  style D2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style C2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style BAD fill:#3b1a1a,stroke:#f87171\n' +
          '  style BROKEN fill:#3b1a1a,stroke:#f87171'
        }
      />

      <InfoBox variant="warning" title="The compiler will warn about one of these, and only with -Wextra">
        <p>
          Compiling <code>special.cpp</code> produced two warnings, both about the same rule:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fsyntax-only special.cpp">
{`special.cpp:20:44: warning: definition of implicit copy assignment operator for
      'CopyC' is deprecated because it has a user-declared copy constructor
      [-Wdeprecated-copy]
special.cpp:21:32: warning: definition of implicit copy constructor for 'CopyA'
      is deprecated because it has a user-declared copy assignment operator
      [-Wdeprecated-copy]`}
        </CodeBlock>
        <p>
          Declaring one copy operation and relying on the implicit other one is{' '}
          <em>deprecated behaviour</em>, which is the standard telling you the same thing this
          lesson is: declare all of them or none. Checked, because the grouping is not obvious:
        </p>
        <CodeBlock language="text" title="Real output — count of -Wdeprecated-copy warnings by flag">
{`$ clang++ -std=c++23 -Wall   -fsyntax-only special.cpp   -> 0
$ clang++ -std=c++23 -Wextra -fsyntax-only special.cpp   -> 2`}
        </CodeBlock>
        <p>
          <strong><code>-Wdeprecated-copy</code> is in <code>-Wextra</code>, not{' '}
          <code>-Wall</code></strong> — the exact mirror of <code>-Wreorder-ctor</code> earlier on
          this page. Which is the practical case for always passing both. And note there is{' '}
          <em>no</em> warning for the expensive one: nothing at all is said when a declared
          destructor turns every move into a copy.
        </p>
      </InfoBox>

      <h2>The Rule of Three, Violated</h2>
      <p>
        Now the classic. A class owning a raw <code>new[]</code>, with a destructor and nothing
        else:
      </p>

      <CodeBlock language="cpp" title="three.cpp">
{`#include <cstdio>
#include <cstring>

// Rule of THREE, violated: a destructor and nothing else.
class Buffer {
public:
    explicit Buffer(std::size_t n) : size_(n), data_(new int[n]) {
        std::memset(data_, 0, n * sizeof(int));
    }
    ~Buffer() { delete[] data_; }          // ONE declared special member
    int& operator[](std::size_t i) { return data_[i]; }
    std::size_t size() const { return size_; }
private:
    std::size_t size_;
    int* data_;
};

void consume(Buffer b) {                   // by VALUE -- a copy
    std::printf("  consume(): b[0] = %d, size = %zu\\n", b[0], b.size());
}                                          // ...and the copy is destroyed here

int main() {
    Buffer a{4};
    a[0] = 7;
    std::printf("before: a[0] = %d\\n", a[0]);
    std::fflush(stdout);
    consume(a);                            // generated copy ctor: copies the POINTER
    std::printf("after:  a[0] = %d\\n", a[0]);
    std::fflush(stdout);
}                                          // ...and a is destroyed here. Second delete[].`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same source at two optimisation levels, plus the diagnostics">
{`$ clang++ -std=c++23 -Wall -Wextra -fsyntax-only three.cpp
(no output -- not one warning)

$ clang++ -std=c++23 -Wall -Wextra -O0 -g three.cpp -o three0 && ./three0; echo exit=$?
before: a[0] = 7
  consume(): b[0] = 7, size = 4
after:  a[0] = 4            <- reading freed memory. Stable across 3 runs.
exit=133                    <- 128 + 5, SIGTRAP: the allocator caught the second delete[]

$ clang++ -std=c++23 -Wall -Wextra -O2 -g three.cpp -o three2 && ./three2; echo exit=$?
before: a[0] = 7
  consume(): b[0] = 7, size = 4
after:  a[0] = 7            <- looks perfect
exit=0`}
      </CodeBlock>

      <p>
        The generated copy constructor copied each member, which for <code>data_</code> means it
        copied the <em>pointer</em>. Two <code>Buffer</code> objects, one allocation, two
        destructors, two <code>delete[]</code>s. At <code>-O0</code> the read after the copy was
        destroyed printed <code>4</code> and the process trapped on the second free; at{' '}
        <code>-O2</code> it printed the right answer and exited 0.
      </p>
      <p>
        Which is, again, the Phase 2 lesson: <strong>your release build passing is not
        evidence.</strong> ASan has an opinion:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O0 three.cpp && ./three_a (exit 134, legend trimmed)">
{`==23575==ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000d0 at pc 0x0001008bcd10
READ of size 4 at 0x6020000000d0 thread T0
    #0 0x0001008bcd0c in main three.cpp:28

0x6020000000d0 is located 0 bytes inside of 16-byte region [0x6020000000d0,0x6020000000e0)
freed by thread T0 here:
    #0 0x000101254644 in _ZdaPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50644)
    #1 0x0001008bd0dc in Buffer::~Buffer() three.cpp:10
    #3 0x0001008bccac in main three.cpp:27

previously allocated by thread T0 here:
    #0 0x000101254268 in _Znam+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50268)
    #1 0x0001008bcfdc in Buffer::Buffer(unsigned long) three.cpp:7
    #3 0x0001008bcb3c in main three.cpp:23`}
      </CodeBlock>

      <p>
        Read the <code>freed by</code> trace: <code>Buffer::~Buffer()</code> at{' '}
        <code>three.cpp:10</code>, called from <code>main three.cpp:27</code> — which is the{' '}
        <code>consume(a)</code> line. The destructor that freed the memory belongs to the{' '}
        <em>parameter</em>, and nothing in the source at line 27 looks like a destruction. That is
        exactly the information <a href="/cpp/memory-bugs">the sanitizer lesson</a> said the
        &quot;freed by&quot; trace is for.
      </p>

      <InfoBox variant="danger" title="The rule of three, stated">
        <p>
          <strong>If you declare any one of the destructor, copy constructor, or copy assignment
          operator, you almost certainly need all three.</strong>
        </p>
        <p>
          The logic is one step long. You declared a destructor, which means the object owns
          something that needs releasing. If it owns something, copying it member-by-member
          produces two owners of one resource — so the generated copy operations are wrong, and
          they are generated anyway. Each of the three implies the other two for the same reason.
        </p>
        <p>
          C++11 added the two move operations, so the modern version is the{' '}
          <strong>rule of five</strong>: all three of the above plus the move constructor and move
          assignment. And the measurement earlier on this page is why you cannot skip the move pair
          and call it done — declaring the destructor suppressed them, so a rule-of-three class in
          2026 is a class that silently copies where it should move.
        </p>
      </InfoBox>

      <h2>Self-Assignment, And A Correction</h2>
      <p>
        Copy assignment has a hazard the copy constructor does not: the source and the destination
        can be the same object. You will not write <code>a = a</code>, but{' '}
        <code>*it = *other_it</code> inside an algorithm, or two references into the same container,
        arrange it for you.
      </p>
      <p>
        The received wisdom is that the naive copy assignment causes a use-after-free. Measured, it
        does something slightly different, and the difference is worth getting right:
      </p>

      <CodeBlock language="cpp" title="selfassign.cpp">
{`#include <cstdio>
#include <algorithm>

class Naive {
public:
    explicit Naive(std::size_t n) : size_(n), data_(new int[n]) {
        for (std::size_t i = 0; i < n; ++i) data_[i] = static_cast<int>(i) + 1;
    }
    ~Naive() { delete[] data_; }
    Naive(const Naive& o) : size_(o.size_), data_(new int[o.size_]) {
        std::copy(o.data_, o.data_ + o.size_, data_);
    }

    // The obvious copy assignment: free what we have, then copy theirs.
    Naive& operator=(const Naive& o) {
        delete[] data_;                 // if &o == this, this was o's data too
        size_ = o.size_;
        data_ = new int[size_];
        std::copy(o.data_, o.data_ + size_, data_);
        return *this;
    }

    int at(std::size_t i) const { return data_[i]; }
private:
    std::size_t size_;
    int* data_;
};

int main() {
    Naive n{4};
    std::printf("before self-assignment: %d %d %d %d\\n", n.at(0), n.at(1), n.at(2), n.at(3));
    std::fflush(stdout);
    Naive& alias = n;                   // two names for one object -- easy to arrange
    n = alias;                          // self-assignment
    std::printf("after  self-assignment: %d %d %d %d\\n", n.at(0), n.at(1), n.at(2), n.at(3));
    std::fflush(stdout);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three builds of selfassign.cpp">
{`$ clang++ -std=c++23 -Wall -Wextra -fsyntax-only selfassign.cpp
(no output -- not one warning)

$ clang++ -std=c++23 -O0 -g selfassign.cpp -o sa0 && ./sa0
before self-assignment: 1 2 3 4
after  self-assignment: 0 0 0 0

$ clang++ -std=c++23 -O2 -g selfassign.cpp -o sa2 && ./sa2
before self-assignment: 1 2 3 4
after  self-assignment: 1 2 3 4                 <- looks fine. It is not.

$ clang++ -std=c++23 -fsanitize=address -g -O0 selfassign.cpp -o sa_a && ./sa_a
before self-assignment: 1 2 3 4
after  self-assignment: -1094795586 -1094795586 -1094795586 -1094795586
                                                <- and NO sanitizer report at all`}
      </CodeBlock>

      <p>
        <strong>The data was silently destroyed, and ASan said nothing.</strong> The reason is worth
        tracing, because it corrects the usual explanation. After <code>data_ = new int[size_]</code>{' '}
        the member <code>data_</code> points at fresh, uninitialised memory — and because{' '}
        <code>o</code> <em>is</em> <code>*this</code>, <code>o.data_</code> is that same new
        pointer. So the <code>std::copy</code> copies the new uninitialised block onto itself.
        There is no read of freed memory, so there is nothing for ASan to flag.{' '}
        <code>-1094795586</code> is <code>0xBEBEBEBE</code>, which is ASan&apos;s fill pattern for a
        <em>fresh</em> allocation — the clue that this is uninitialised memory, not freed memory.
      </p>
      <p>
        A one-line variation does produce the use-after-free, and it is at least as natural to
        write:
      </p>

      <CodeBlock language="cpp" title="selfassign2.cpp — the same bug, with the source pointer read up front">
{`Naive2& operator=(const Naive2& o) {
    const int* theirs = o.data_;        // read the source pointer up front
    const std::size_t n = o.size_;
    delete[] data_;                     // self-assignment: 'theirs' is now dangling
    size_ = n;
    data_ = new int[n];
    std::copy(theirs, theirs + n, data_);   // ...and this reads it
    return *this;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O0 selfassign2.cpp && ./s2a (trimmed)">
{`before: 1 2 3 4
==23645==ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000d0
READ of size 16 at 0x6020000000d0 thread T0
    #0 0x000101293b40 in __asan_memmove+0x19c
    ...
    #7 0x0001008dcfac in Naive2::operator=(Naive2 const&) selfassign2.cpp:19
    #8 0x0001008dca8c in main selfassign2.cpp:33

0x6020000000d0 is located 0 bytes inside of 16-byte region
freed by thread T0 here:
    #0 ... in _ZdaPv+0x74

(unsanitized: -O0 printed 0 0 0 0 and exit 0; -O2 printed 1 2 3 4 and exit 0)`}
      </CodeBlock>

      <p>
        Note the stack trace shape — six frames of libc++ <code>std::copy</code> machinery before{' '}
        frame <code>#7</code> reaches your <code>operator=</code>. That is the
        read-bottom-up-until-you-see-your-own-code advice from{' '}
        <a href="/cpp/memory-bugs">the sanitizer lesson</a> in action.
      </p>
      <p>
        The usual advice is to add <code>if (this == &amp;o) return *this;</code> at the top. It
        works, but it is a check you have to remember in every assignment operator you ever write,
        and it costs a branch on the common path. The better answer makes the problem structurally
        impossible.
      </p>

      <h3>Copy-and-swap</h3>
      <p>
        Build a complete copy first, then swap with it. The old contents end up in the temporary and
        are destroyed when it goes out of scope.
      </p>

      <CodeBlock language="cpp" title="zero.cpp — the rule of five, written properly">
{`// RULE OF FIVE, hand-written: five declarations.
class FiveBuffer {
public:
    explicit FiveBuffer(std::size_t n) : size_(n), data_(new int[n]{}) {}

    ~FiveBuffer() { delete[] data_; }

    FiveBuffer(const FiveBuffer& o) : size_(o.size_), data_(new int[o.size_]) {
        for (std::size_t i = 0; i < size_; ++i) data_[i] = o.data_[i];
    }
    FiveBuffer& operator=(const FiveBuffer& o) {
        FiveBuffer tmp{o};              // copy-and-swap: self-assignment safe for free
        swap(tmp);
        return *this;
    }
    FiveBuffer(FiveBuffer&& o) noexcept
        : size_(std::exchange(o.size_, 0)), data_(std::exchange(o.data_, nullptr)) {}

    FiveBuffer& operator=(FiveBuffer&& o) noexcept {
        FiveBuffer tmp{std::move(o)};
        swap(tmp);
        return *this;
    }

    void swap(FiveBuffer& o) noexcept {
        std::swap(size_, o.size_);
        std::swap(data_, o.data_);
    }
    int& operator[](std::size_t i) { return data_[i]; }
    std::size_t size() const { return size_; }
private:
    std::size_t size_;
    int* data_;
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 zero.cpp && ./zero">
{`FiveBuffer copy independent: f[0]=7 f2[0]=9
FiveBuffer after f = f:      f[0]=7 size=4
after move: f3[0]=7 f3.size()=4  moved-from f.size()=0`}
      </CodeBlock>

      <p>
        <code>f = f</code> left the contents intact, with no <code>this == &amp;o</code> check
        anywhere. The copy constructor built a real second copy before anything was freed, so the
        aliasing simply does not matter. The same <code>swap</code> serves both assignment
        operators, so there are two one-line assignment bodies instead of two hand-rolled ones.
      </p>
      <p>
        Three details that are easy to get wrong:
      </p>
      <ul>
        <li>
          <strong><code>std::exchange</code> in the move constructor</strong> sets the source&apos;s
          members to a valid empty state while reading their old values. A moved-from object must
          still be destructible — <code>delete[] nullptr</code> is well-defined and does nothing,
          which is what makes this work.
        </li>
        <li>
          <strong><code>noexcept</code> on both move operations.</strong>{' '}
          <a href="/cpp/move-semantics">The move-semantics lesson</a> measured 262,143 extra heap
          allocations in a <code>std::vector</code> from that keyword being absent.
        </li>
        <li>
          <strong><code>swap</code> is <code>noexcept</code> too</strong>, because it is two pointer
          swaps. If your <code>swap</code> can throw, copy-and-swap stops being exception-safe.
        </li>
      </ul>

      <InfoBox variant="info" title="clang will warn about literal self-assignment, but only the obvious kind">
        <p>
          Writing <code>f = f;</code> directly does produce a diagnostic:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 zero.cpp">
{`zero.cpp:76:7: warning: explicitly assigning value of variable of type 'FiveBuffer'
      to itself [-Wself-assign-overloaded]
   76 |     f = f;              // self-assignment through copy-and-swap
      |     ~ ^ ~`}
        </CodeBlock>
        <p>
          But the <code>selfassign.cpp</code> demonstration above went through a reference —{' '}
          <code>Naive&amp; alias = n; n = alias;</code> — and compiled with{' '}
          <strong>zero warnings</strong>. The warning catches the version nobody writes and misses
          the version that actually occurs. Do not treat it as coverage.
        </p>
      </InfoBox>

      <h2>The Rule of Zero</h2>
      <p>
        Everything above is what you need when your class owns a raw resource. The better move is to
        not own one. <strong>Compose your class out of members that already manage themselves, and
        declare none of the six.</strong>
      </p>

      <CodeBlock language="cpp" title="zero.cpp — the same Buffer, on the rule of zero">
{`// RULE OF ZERO: own nothing directly. Declare no special members at all.
class ZeroBuffer {
public:
    explicit ZeroBuffer(std::size_t n) : data_(n, 0) {}
    int& operator[](std::size_t i) { return data_[i]; }
    std::size_t size() const { return data_.size(); }
private:
    std::vector<int> data_;
};

// When the resource is a C handle with no standard wrapper: unique_ptr with a
// custom deleter, which puts you back on the rule of zero.
struct FileCloser { void operator()(std::FILE* f) const { if (f) std::fclose(f); } };

class ZeroFile {
public:
    explicit ZeroFile(const char* path) : f_(std::fopen(path, "w")) {}
    bool ok() const { return f_ != nullptr; }
private:
    std::unique_ptr<std::FILE, FileCloser> f_;
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 zero.cpp && ./zero">
{`ZeroBuffer   copy_ctor=true  copy_assign=true  nothrow_move_ctor=true  nothrow_move_assign=true  sizeof=24
FiveBuffer   copy_ctor=true  copy_assign=true  nothrow_move_ctor=true  nothrow_move_assign=true  sizeof=16
ZeroFile     copy_ctor=false copy_assign=false nothrow_move_ctor=true  nothrow_move_assign=true  sizeof=8

ZeroBuffer copy independent: z[0]=7 z2[0]=9`}
      </CodeBlock>

      <p>
        <code>ZeroBuffer</code> has the <em>same four properties</em> as the hand-written
        twenty-line <code>FiveBuffer</code>: copyable, assignable, nothrow-movable both ways. It
        deep-copies correctly (<code>z[0]=7 z2[0]=9</code> after modifying the copy) and it releases
        correctly, from a class body containing no special members at all. The{' '}
        <code>sizeof</code> difference — 24 against 16 — is <code>std::vector</code> carrying three
        pointers where <code>FiveBuffer</code> carries a size and a pointer; that is the entire cost
        and it buys you <code>push_back</code>, <code>resize</code> and bounds-checked{' '}
        <code>at()</code>.
      </p>
      <p>
        <code>ZeroFile</code> is the interesting row. It is correctly{' '}
        <strong>non-copyable and movable</strong> — exactly the semantics a file handle should
        have — and nobody wrote a single special member to get that, because{' '}
        <code>std::unique_ptr</code>&apos;s own special members propagated. And{' '}
        <code>sizeof == 8</code>: the stateless deleter occupies no space, which is the measurement{' '}
        <a href="/cpp/raii">the RAII lesson</a> made about exactly this pattern.
      </p>

      <FlowChart
        title="Zero, three, or five: deciding which rule applies"
        chart={
          'graph TD\n' +
          '  S["You are writing a class.<br/>Which special members do you declare?"] --> Q1{"Does it directly own a resource<br/>that needs releasing?<br/>raw new, FILE*, fd, HANDLE,<br/>mutex, socket, GL texture"}\n' +
          '  Q1 -->|"No — every member is a<br/>string / vector / unique_ptr /<br/>shared_ptr / optional / int"| Z["RULE OF ZERO<br/>Declare NONE of the six.<br/>Measured: ZeroBuffer gets copy,<br/>assign and nothrow-move for free<br/>and deep-copies correctly."]\n' +
          '  Q1 -->|"Yes"| Q2{"Can an existing RAII type<br/>own it for you?"}\n' +
          '  Q2 -->|"Yes — vector, string,<br/>unique_ptr with a custom deleter"| Z2["WRAP IT, then rule of zero.<br/>Measured: ZeroFile is non-copyable,<br/>nothrow-movable, sizeof == 8 —<br/>zero special members written."]\n' +
          '  Q2 -->|"No — you are IMPLEMENTING<br/>the ownership mechanism"| Q3{"Should the resource be<br/>copyable at all?"}\n' +
          '  Q3 -->|"No — a handle, a lock,<br/>a thread, a connection"| MO["Destructor + move ctor + move assign.<br/>Copy ctor and copy assign = delete.<br/>This is the honest rule of five<br/>for a move-only type."]\n' +
          '  Q3 -->|"Yes — it is a value that<br/>happens to own a buffer"| F["RULE OF FIVE<br/>All five, and use copy-and-swap<br/>for both assignment operators.<br/>Measured: f = f survives with no<br/>this == &amp;o check."]\n' +
          '  Z --> CHK\n' +
          '  Z2 --> CHK\n' +
          '  MO --> CHK\n' +
          '  F --> CHK["Then guard it:<br/>static_assert(std::is_nothrow_move_constructible_v&lt;T&gt;);<br/>— the one trait the measurements showed<br/>does not lie about moves."]\n' +
          '  S --> NEVER["NEVER: declare exactly one or two of them.<br/>Measured: a destructor alone turns every<br/>move into a copy; a move ctor alone<br/>leaves the type unassignable entirely."]\n' +
          '  style Z fill:#1a3329,stroke:#4ade80\n' +
          '  style Z2 fill:#1a3329,stroke:#4ade80\n' +
          '  style CHK fill:#1a3329,stroke:#4ade80\n' +
          '  style MO fill:#1a2744,stroke:#5b9cf6\n' +
          '  style F fill:#1a2744,stroke:#5b9cf6\n' +
          '  style NEVER fill:#3b1a1a,stroke:#f87171'
        }
      />

      <InfoBox variant="success" title="Why this is the destination">
        <p>
          <a href="/cpp/raii">RAII</a> said the guarantee should live in the type rather than at
          every call site. The rule of zero is the same argument one level up:{' '}
          <strong>the correct special members should live in the members rather than in every class
          that holds them.</strong> <code>std::vector</code>&apos;s author wrote the five once;
          every class with a <code>vector</code> member inherits correct copy, move, and destruction
          behaviour without writing anything.
        </p>
        <p>
          That is also the answer to &quot;C++ makes you write so much boilerplate.&quot; The
          twenty-line <code>FiveBuffer</code> on this page is real C++ and you should be able to
          read it, because you will meet it in code written before 2011. You should rarely have
          cause to write it.
        </p>
      </InfoBox>

      <h2><code>const</code> Member Functions, and <code>mutable</code></h2>
      <p>
        A <code>const</code> member function promises not to modify the object. Mechanically, the
        hidden <code>this</code> parameter becomes <code>const T*</code>, so every member is{' '}
        <code>const</code> inside the body, and only other <code>const</code> member functions can
        be called.
      </p>
      <p>
        The consequence that catches people is the direction of travel:{' '}
        <strong>a <code>const</code> object can only call <code>const</code> member
        functions.</strong> Forgetting <code>const</code> on an accessor does not make it slightly
        less correct, it makes the function uncallable on half your objects — including every
        object reached through a <code>const T&amp;</code> parameter, which{' '}
        <a href="/cpp/references">the references lesson</a> established is the default way to pass
        things.
      </p>

      <CodeBlock language="cpp" title="constm2.cpp">
{`#include <vector>
#include <string>
struct Row { std::string name; };
class Table {
public:
    std::size_t size() const { return rows_.size(); }
    void add(Row r) { rows_.push_back(std::move(r)); }
    void bad() const { rows_.clear(); }        // non-mutable member, const function
private:
    std::vector<Row> rows_;
};
int main() {
    const Table t;
    t.add(Row{"x"});                           // non-const member on a const object
    return (int)t.size();
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only constm2.cpp">
{`constm2.cpp:8:24: error: 'this' argument to member function 'clear' has
      type 'const std::vector<Row>', but function is not marked const
    8 |     void bad() const { rows_.clear(); }        // non-mutable memb...
      |                        ^~~~~
constm2.cpp:14:5: error: 'this' argument to member function 'add' has type
      'const Table', but function is not marked const
   14 |     t.add(Row{"x"});                           // non-const membe...
      |     ^
constm2.cpp:7:10: note: 'add' declared here
    7 |     void add(Row r) { rows_.push_back(std::move(r)); }
      |          ^
2 errors generated.`}
      </CodeBlock>

      <p>
        Note the phrasing: <code>&apos;this&apos; argument to member function ... has type ... but
        function is not marked const</code>. Once you have read that message twice you will
        recognise it instantly, and the fix is almost always to add <code>const</code> to the member
        function rather than to remove it from the object.
      </p>

      <h3><code>mutable</code>, and the difference between two kinds of const</h3>
      <p>
        <code>const</code> as the compiler enforces it is <strong>bitwise</strong> const: no byte of
        the object changes. What you usually want is <strong>logical</strong> const: the object&apos;s
        observable value does not change. A cache is the standard case where those diverge — filling
        a cache changes bytes but not meaning. <code>mutable</code> is how you declare the gap.
      </p>

      <CodeBlock language="cpp" title="constm.cpp">
{`class Table {
public:
    explicit Table(std::vector<Row> rows) : rows_(std::move(rows)) {}

    std::size_t size() const { return rows_.size(); }

    // Logically const, but it writes to a cache. 'mutable' is how you say that.
    const std::string& summary() const {
        if (!summary_.empty()) { std::println("    (cache hit)"); return summary_; }
        std::println("    (computing the summary -- the expensive bit)");
        ++computations_;
        for (const Row& r : rows_) { summary_ += r.name; summary_ += ';'; }
        return summary_;
    }
    int computations() const { return computations_; }

    // The const/non-const overload pair.
    Row&       at(std::size_t i)       { std::println("    at() non-const"); return rows_[i]; }
    const Row& at(std::size_t i) const { std::println("    at() const");     return rows_[i]; }

private:
    std::vector<Row> rows_;
    mutable std::string summary_;
    mutable int computations_ = 0;
};

// A const member function on a class holding a POINTER.
class Logger {
public:
    explicit Logger(std::string* sink) : sink_(sink) {}
    void log(const std::string& msg) const {   // const... but:
        *sink_ += msg;                          // this mutates the pointee. Legal.
    }
private:
    std::string* sink_;
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 constm.cpp && ./constm">
{`t.size() = 2
first call to summary():
    (computing the summary -- the expensive bit)
  -> alpha;beta;
second call to summary():
    (cache hit)
  -> alpha;beta;
computations = 1  (on a const object)
overload resolution:
    at() non-const
    at() const
sink = "written through a const member function"`}
      </CodeBlock>

      <p>
        Three things in that output. The cache worked on a <code>const Table</code>, and{' '}
        <code>computations</code> went from 0 to 1 — a counter incremented inside a{' '}
        <code>const</code> member function on a <code>const</code> object, which is only legal
        because both members are <code>mutable</code>.
      </p>
      <p>
        The <strong>const/non-const overload pair</strong> resolved on the constness of the object,
        not the arguments. This is how every standard container provides <code>begin()</code>,{' '}
        <code>operator[]</code> and <code>at()</code>, and it is the pattern for your own accessors:
        return <code>T&amp;</code> from the non-const one, <code>const T&amp;</code> from the const
        one. (C++23 added <em>explicit object parameters</em> —{' '}
        <code>template &lt;class Self&gt; auto&amp;&amp; at(this Self&amp;&amp; self, size_t i)</code>{' '}
        — which collapses the pair into one function. Worth knowing the feature exists; the two
        overloads are still what you will read.)
      </p>

      <InfoBox variant="warning" title="The real limit: const does not propagate through a pointer">
        <p>
          <code>Logger::log</code> is a <code>const</code> member function that appends to a string,
          and the output proves it took effect. There is nothing wrong with the compiler. In a{' '}
          <code>const Logger</code>, the member <code>sink_</code> is a{' '}
          <code>std::string* const</code> — a const pointer to a <em>non-const</em> string. You
          cannot repoint it; you can write through it all day.
        </p>
        <p>
          So a <code>const</code> member function guarantees the object&apos;s own bytes are
          unchanged, and guarantees <em>nothing</em> about what the object can reach. For a Java
          developer this is the exact shape of the <code>final</code> field misconception —{' '}
          <code>final List&lt;String&gt; items</code> does not stop{' '}
          <code>items.add(...)</code> — so the instinct transfers correctly here, unusually.
        </p>
        <p>
          The practical consequence: mark member functions <code>const</code> by default, but do not
          read <code>const</code> as &quot;immutable&quot; when pointer or reference members are
          involved. If you want the deep guarantee, hold a <code>const T*</code> or store the thing
          by value.
        </p>
      </InfoBox>

      <h2>Static Members</h2>
      <p>
        A static data member is one variable shared by all instances; a static member function has
        no <code>this</code>. The concepts match Java exactly. The{' '}
        <em>declaration rules</em> do not, because of the one-definition rule from{' '}
        <a href="/cpp/compiling">the compiling lesson</a>.
      </p>

      <CodeBlock language="cpp" title="statics.cpp">
{`#include <print>
#include <string>

struct Widget {
    // C++17: implicitly inline. No out-of-class definition needed.
    static constexpr int max_count = 100;
    inline static int live = 0;              // C++17 'inline static': also no .cpp line
    static int declared_only;                // old style: needs a definition somewhere

    std::string name;
    explicit Widget(std::string n) : name(std::move(n)) { ++live; }
    ~Widget() { --live; }

    // A static member function: no 'this', callable on the class.
    static int how_many() { return live; }
};

// An expensive object built on first use. C++11 guarantees this is
// initialised exactly once, even under concurrent first calls.
struct Heavy {
    Heavy() { std::println("    Heavy() ran"); }
    int value = 42;
};

const Heavy& heavy() {
    static Heavy instance;      // a function-local static -- a "magic static"
    return instance;
}

int main() {
    std::println("Widget::max_count    = {}", Widget::max_count);
    std::println("Widget::how_many()   = {}", Widget::how_many());
    {
        Widget a{"a"}, b{"b"};
        std::println("inside the scope      = {}", Widget::how_many());
        std::println("via an instance       = {}", a.how_many());
    }
    std::println("after the scope       = {}", Widget::how_many());

    std::println("first heavy() call:");
    std::println("  value = {}", heavy().value);
    std::println("second heavy() call:");
    std::println("  value = {}", heavy().value);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 statics.cpp && ./statics">
{`Widget::max_count    = 100
Widget::how_many()   = 0
inside the scope      = 2
via an instance       = 2
after the scope       = 0
first heavy() call:
    Heavy() ran
  value = 42
second heavy() call:
  value = 42`}
      </CodeBlock>

      <p>
        Note that <code>declared_only</code> was never touched, and the program linked. Add one use
        of it and the failure is a <em>linker</em> error, not a compiler error — the distinction{' '}
        <a href="/cpp/compiling">the compiling lesson</a> is built around:
      </p>

      <CodeBlock language="text" title="Real output — adding one use of Widget::declared_only and rebuilding">
{`Undefined symbols for architecture arm64:
  "Widget::declared_only", referenced from:
      use() in statics2-c662ae.o
ld: symbol(s) not found for architecture arm64
clang++: error: linker command failed with exit code 1 (use -v to see invocation)`}
      </CodeBlock>

      <p>
        The old fix is a line in exactly one <code>.cpp</code> file:{' '}
        <code>int Widget::declared_only = 0;</code>. Put it in a header and you get a duplicate
        symbol from the linker instead. <strong>Since C++17 you do not need it:</strong>{' '}
        <code>inline static int live = 0;</code> and{' '}
        <code>static constexpr int max_count = 100;</code> (which is implicitly{' '}
        <code>inline</code>) are both complete definitions, usable from a header-only class. Use
        those and the whole category of problem disappears.
      </p>

      <InfoBox variant="tip" title="The function-local static is the one to remember">
        <p>
          <code>static Heavy instance;</code> inside a function — a &quot;magic static&quot; — is
          initialised on first call and never again. The output shows <code>Heavy() ran</code> once
          across two calls. Since C++11 that initialisation is{' '}
          <strong>guaranteed thread-safe</strong>: if two threads call <code>heavy()</code>{' '}
          simultaneously, one constructs and the other blocks until it finishes.
        </p>
        <p>
          This is worth more than it looks. It solves the <strong>static initialisation order
          problem</strong> — namespace-scope objects in different translation units are initialised
          in an order the standard does not specify, so one global depending on another is a real
          source of crashes-before-main. A function-local static is initialised at first{' '}
          <em>use</em>, which is an order you control. If you need a global, this is how to spell it.
        </p>
        <p>
          It is also the C++ Meyers singleton. Treat the thread-safety guarantee as being about{' '}
          <em>initialisation only</em> — concurrent <em>use</em> of the object afterwards needs its
          own synchronisation, exactly as in Java.
        </p>
      </InfoBox>

      <h2><code>friend</code></h2>
      <p>
        <code>friend</code> grants one function or one class access to your private members. Java
        has no equivalent; package-private is the nearest thing and it is much coarser. The reason
        C++ needs it is that <strong>some operations on your type cannot be member
        functions</strong>.
      </p>

      <CodeBlock language="cpp" title="friends.cpp">
{`#include <print>
#include <sstream>
#include <string>

class Money {
public:
    Money(long cents) : cents_(cents) {}     // deliberately NOT explicit -- see below

    // A "hidden friend": defined inside the class, but it is a free function.
    // It is found only by argument-dependent lookup on Money.
    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        return os << '$' << m.cents_ / 100 << '.' << (m.cents_ % 100 < 10 ? "0" : "")
                  << m.cents_ % 100;
    }
    // Symmetric operators are the other classic use: both sides convert.
    friend Money operator+(const Money& a, const Money& b) { return Money{a.cents_ + b.cents_}; }
    friend bool  operator==(const Money& a, const Money& b) { return a.cents_ == b.cents_; }

    friend class Auditor;        // a whole class granted access

private:
    long cents_;
};

class Auditor {
public:
    static long raw(const Money& m) { return m.cents_; }   // reaches a private member
};

std::string show(const Money& m) { std::ostringstream o; o << m; return o.str(); }

int main() {
    Money a{1250}, b{99};
    std::println("{} + {} = {}", show(a), show(b), show(a + b));
    std::println("a + 1 (int converts to Money) = {}", show(a + 1));
    std::println("Auditor::raw(a)               = {}", Auditor::raw(a));
    std::println("a == 1250                     = {}", a == 1250);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 friends.cpp && ./friends">
{`$12.50 + $0.99 = $13.49
a + 1 (int converts to Money) = $12.51
Auditor::raw(a)               = 1250
a == 1250                     = true`}
      </CodeBlock>

      <p>
        <code>operator&lt;&lt;</code> has to be a free function because the left operand is a
        stream, not a <code>Money</code> — you cannot add a member to <code>std::ostream</code>. And{' '}
        <code>operator+</code> wants to be a free function so that <em>both</em> operands get the
        same conversion treatment: as a member, <code>1 + money</code> would not compile because
        there is no <code>int::operator+(Money)</code>, while as a free function both sides convert
        symmetrically.
      </p>
      <p>
        Which is where the <code>explicit</code> section comes back around.{' '}
        <code>a + 1</code> printing <code>$12.51</code> and <code>a == 1250</code> being{' '}
        <code>true</code> both depend on <code>Money(long)</code> <em>not</em> being{' '}
        <code>explicit</code>. For an arithmetic-like value type that is usually the right call —
        but notice that <code>a + 1</code> meant &quot;plus one cent&quot;, which is the same
        units ambiguity that the <code>Seconds</code> example got wrong. The honest version of this
        type either makes the constructor <code>explicit</code> and provides{' '}
        <code>Money::from_cents</code> / <code>Money::from_dollars</code> named factories, or uses{' '}
        <code>std::chrono</code>-style strong units. The language will not decide for you.
      </p>

      <h3>What <code>friend</code> is not</h3>
      <p>
        Friendship is <strong>not inherited, not transitive, and not reciprocal</strong>. A class
        derived from a friend is not a friend:
      </p>

      <CodeBlock language="cpp" title="friends2.cpp">
{`class Money {
    long cents_ = 0;
    friend class Auditor;
};
class Auditor { public: static long raw(const Money& m) { return m.cents_; } };
class SubAuditor : public Auditor {
public:
    static long raw2(const Money& m) { return m.cents_; }   // not a friend
};
int main() { Money m; return (int)SubAuditor::raw2(m); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only friends2.cpp">
{`friends2.cpp:8:49: error: 'cents_' is a private member of 'Money'
    8 |     static long raw2(const Money& m) { return m.cents_; }   // no...
      |                                                 ^
friends2.cpp:2:10: note: implicitly declared private here
    2 |     long cents_ = 0;
      |          ^
1 error generated.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Prefer hidden friends, and keep the list short">
        <p>
          A <strong>hidden friend</strong> — a <code>friend</code> function <em>defined</em> inside
          the class body, as all three operators above are — is the modern idiom. It is a free
          function, but its name is only visible to argument-dependent lookup on your type. That
          means it never shows up in overload resolution for unrelated calls, which keeps error
          messages short and compile times down. The alternative, declaring the friend inside and
          defining it at namespace scope, puts the name in the enclosing namespace for everybody.
        </p>
        <p>
          <code>friend class X</code> for a whole class is the blunt version and deserves more
          suspicion. It is legitimate for a tightly coupled pair that is really one abstraction in
          two files — a container and its iterator, a builder and the thing it builds — and
          a &quot;friend <code>TestFixture</code>&quot; for testing private state is common if not
          beloved. If the list is long, the class is doing too much.
        </p>
        <p>
          A note on the C++20 alternative to half of this: <code>auto operator&lt;=&gt;(const T&amp;)
          const = default;</code> generates all six comparison operators as members, so you no
          longer need friend comparison operators for the ordinary case.{' '}
          <a href="/cpp/intro">The intro</a> showed it working.
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
            <td style={cellStyle}>&quot;<code>class</code> and <code>struct</code> are
              different kinds of thing&quot;</td>
            <td style={cellStyle}>Identical on <code>sizeof</code>, standard layout, trivial
              copyability and aggregate-ness. The differences are default member access and
              default inheritance access.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Assigning the member in the constructor body is
              fine&quot;</td>
            <td style={cellStyle}>Default-construct <em>then</em> copy-assign — two operations
              where the initialiser list does one. And it does not compile at all for{' '}
              <code>const</code> or reference members.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The initialiser list runs top to bottom&quot;</td>
            <td style={cellStyle}>Declaration order. <code>count(data.size())</code> with{' '}
              <code>count</code> declared first printed 1347454048 at <code>-O0</code> and 0 at{' '}
              <code>-O2</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A default member initialiser is an extra
              construction&quot;</td>
            <td style={cellStyle}>No. <code>Counter::built = 3</code> for three{' '}
              <code>Config</code>s — one construction each, whether the list named the member or
              not.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>explicit</code> is politeness&quot;</td>
            <td style={cellStyle}><code>wait(500)</code> compiled against{' '}
              <code>void wait(Seconds)</code> and slept 500 seconds. <code>wait(true)</code> slept
              one. Neither warned.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>= default</code> is shorthand for an empty
              body&quot;</td>
            <td style={cellStyle}>
              <code>= default</code> keeps <code>is_trivial</code> and{' '}
              <code>is_trivially_copyable</code> <code>true</code>; the hand-written equivalent
              makes both <code>false</code>, which costs containers a per-element loop.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Adding a destructor is harmless&quot;</td>
            <td style={cellStyle}><code>is_nothrow_move_constructible_v</code> went{' '}
              <code>true</code> &rarr; <code>false</code> and{' '}
              <code>T b{'{'}std::move(a){'}'}</code> ran <strong>a copy</strong>. No warning of any
              kind.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Declaring a move constructor just adds moves&quot;</td>
            <td style={cellStyle}>It deletes both copy operations and does not generate move
              assignment — the measured type could not be assigned at all.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>is_move_constructible_v</code> tells me whether it
              moves&quot;</td>
            <td style={cellStyle}><code>true</code> for every row in the matrix, including the
              three where a copy actually ran. Use{' '}
              <code>is_nothrow_move_constructible_v</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A copy of my class is a copy&quot;</td>
            <td style={cellStyle}>With a destructor and no copy constructor: two objects, one
              allocation, two <code>delete[]</code>s. Exit 133 at <code>-O0</code>,{' '}
              <strong>exit 0 and the right answer at <code>-O2</code></strong>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Naive self-assignment is a use-after-free&quot;</td>
            <td style={cellStyle}>Not in the obvious form — <code>o.data_</code> is the same member,
              so it self-copies uninitialised memory and ASan is silent. Caching the source pointer
              first <em>does</em> give a real <code>heap-use-after-free</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Hand-written is the only way to own a buffer&quot;</td>
            <td style={cellStyle}>A <code>std::vector</code> member gave the same four
              properties as the 20-line rule-of-five class, from zero declared special members.{' '}
              <code>unique_ptr</code> with a deleter gave a non-copyable, nothrow-movable file
              handle at <code>sizeof == 8</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A <code>const</code> member function cannot change
              anything&quot;</td>
            <td style={cellStyle}>It incremented a <code>mutable</code> counter on a{' '}
              <code>const</code> object, and appended to a string through a pointer member.{' '}
              <code>const</code> stops at the object&apos;s own bytes.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A static member just works, like in Java&quot;</td>
            <td style={cellStyle}>The old-style declaration linked fine until something used it,
              then produced <code>Undefined symbols for architecture arm64</code>.{' '}
              <code>inline static</code> and <code>static constexpr</code> avoid it.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-Wall -Wextra</code> will tell me&quot;</td>
            <td style={cellStyle}>It caught both init-order bugs (<code>-Wall</code>) and the
              deprecated-copy cases (<code>-Wextra</code>) — and said <em>nothing</em> about the
              double free, the self-assignment, the implicit conversions, or the suppressed move
              operations.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        You can now build a type. The next two lessons are the two ways C++ lets you{' '}
        <em>abstract over</em> types, and they are the two places your Java intuition will cost you
        the most.
      </p>
      <ul>
        <li>
          <strong><a href="/cpp/inheritance">Inheritance, Virtual Functions &amp; vtables</a></strong>{' '}
          — where the default is the exact opposite of Java&apos;s. Methods are{' '}
          <em>not</em> virtual unless you say so; destructors are not virtual either, which makes{' '}
          <code>delete base_ptr</code> undefined behaviour; and object slicing, which has no Java
          analogue, is waiting for anyone who still thinks of a class variable as a handle. Also
          where <code>override</code> turns out to prevent a genuine class of bug rather than
          documenting intent.
        </li>
        <li>
          <strong><a href="/cpp/templates">Templates &amp; Generic Programming</a></strong> — which
          are not Java generics. No erasure, no bounded type parameters, no shared implementation:
          each instantiation is a separate type with its own machine code, generated at compile
          time, and type-checked only once you use it. That last property is where the famously
          awful error messages come from, and the lesson reads a real one line by line.
        </li>
      </ul>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, five minutes, and it will probably find something. Take a class you have
          written in C++ — or the most complicated one in a codebase you are about to work on — and
          put this next to its definition:
        </p>
        <CodeBlock language="cpp" title="The three-line audit">
{`static_assert(std::is_nothrow_move_constructible_v<YourType>);
static_assert(std::is_nothrow_move_assignable_v<YourType>);
// and then just read the class body: how many of the six are declared?`}
        </CodeBlock>
        <p>
          If either assertion fails, something in that class — a declared destructor, a declared
          copy operation, or a member that has one — is turning every move into a copy, exactly as
          row <code>Dtor</code> did. If the count of declared special members is one, two, three or
          four, you are in the band the measurements showed is broken in unpredictable ways. Zero and
          five are the two answers that behave.
        </p>
        <p>
          And if the answer is five, ask the follow-up: what resource does this class own that{' '}
          <code>std::vector</code>, <code>std::string</code> or a{' '}
          <code>std::unique_ptr</code> with a custom deleter could own instead? Most of the time
          there is one, and the twenty lines go away.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Classes;
