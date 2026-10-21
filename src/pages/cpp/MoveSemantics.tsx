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

function MoveSemantics() {
  return (
    <LessonLayout
      title="Move Semantics & Perfect Forwarding"
      sectionId="cpp"
      lessonIndex={9}
      prev={{ path: '/cpp/smart-pointers', label: 'Smart Pointers: unique_ptr, shared_ptr & weak_ptr' }}
      next={{ path: '/cpp/memory-bugs', label: 'Memory Bugs & the Sanitizers That Catch Them' }}
    >
      <p>
        This is the hardest lesson in the phase, and it exists because of one problem.{' '}
        <a href="/cpp/references">The references lesson</a> established that{' '}
        <code>b = a</code> deep-copies everything <code>a</code> owns. That guarantee is valuable —
        no aliasing, no action at a distance — but it is also sometimes pure waste. If{' '}
        <code>a</code> is a temporary that is about to be destroyed anyway, copying its heap buffer
        and then freeing the original is two operations where zero would do.
      </p>
      <p>
        Move semantics is the language-level fix: a way for a type to say &quot;this source object is
        about to die, so instead of duplicating its buffer, just take the pointer.&quot; Getting
        there requires three ideas that each sound more complicated than they are, plus one plain
        statement that corrects the misconception almost everyone holds.
      </p>

      <InfoBox variant="danger" title="The one sentence to internalise before anything else">
        <p>
          <strong><code>std::move</code> does not move anything.</strong> It is a cast. Its entire
          implementation is a <code>static_cast</code>, it emits zero machine instructions, and
          calling it on an object changes nothing about that object. All it does is change how{' '}
          <em>overload resolution</em> sees the expression — and if no move-taking overload happens to
          be in scope, you get a full copy and the source is left completely untouched.
        </p>
        <p>
          Both halves of that are demonstrated below with real output: a bare{' '}
          <code>std::move(a);</code> statement that does nothing at all, and a{' '}
          <code>std::move</code> into a <code>const&amp;</code> parameter that silently copies.
        </p>
      </InfoBox>

      <h2>Part 1: Lvalues and Rvalues</h2>
      <p>
        The distinction exists to answer one question: <strong>is anybody else going to look at this
        object after this expression finishes?</strong> If yes, the compiler must not let you gut it.
        If no, gutting it is free performance.
      </p>
      <p>
        The names are historical — &quot;left of the assignment&quot; and &quot;right of the
        assignment&quot; — and unhelpful. The useful test is whether the expression has an{' '}
        <em>identity</em> you could take the address of.
      </p>

      <FlowChart
        title="Lvalue or rvalue, and why the compiler cares"
        chart={
          'graph TD\n' +
          '  Q["Look at an EXPRESSION, not a type.<br/>Every expression is one or the other."] --> A{"Can I take its<br/>address with &amp;?"}\n' +
          '  A -->|"yes"| L["LVALUE<br/>It has a name or an identity.<br/>Something else may still be using it."]\n' +
          '  A -->|"no"| R["RVALUE<br/>A temporary. Nothing else can<br/>observe it after this expression."]\n' +
          '  L --> L1["x — a local variable<br/>obj.member<br/>arr[i]<br/>*p<br/>f() returning T&amp; or const T&amp;"]\n' +
          '  R --> R1["42, &quot;literal&quot;<br/>a + b<br/>f() returning T by value<br/>T(args) — an explicit temporary<br/>std::move(x)"]\n' +
          '  L1 --> LB{"Which reference can<br/>bind to it?"}\n' +
          '  R1 --> RB{"Which reference can<br/>bind to it?"}\n' +
          '  LB --> LB1["T&amp;        yes<br/>const T&amp;  yes<br/>T&amp;&amp;       NO"]\n' +
          '  RB --> RB1["T&amp;        NO<br/>const T&amp;  yes<br/>T&amp;&amp;       yes — and this overload<br/>is PREFERRED over const T&amp;"]\n' +
          '  LB1 --> WHY["So: an lvalue argument selects the COPY.<br/>Gutting it would break whoever else holds it."]\n' +
          '  RB1 --> WHY2["So: an rvalue argument selects the MOVE.<br/>It is about to be destroyed anyway —<br/>stealing its buffer harms nobody."]\n' +
          '  style L fill:#1a2744,stroke:#5b9cf6\n' +
          '  style R fill:#3d2f14,stroke:#fb923c\n' +
          '  style WHY fill:#1a2744,stroke:#5b9cf6\n' +
          '  style WHY2 fill:#1a3329,stroke:#4ade80'
        }
      />

      <p>
        Rather than take that on trust, here it is as an experiment. Three overloads, nine argument
        shapes, and the compiler tells you which category each one is:
      </p>

      <CodeBlock language="cpp" title="lv.cpp">
{`#include <print>
#include <string>
#include <utility>

void f(std::string&)        { std::println("    -> f(string&)        modifiable lvalue"); }
void f(const std::string&)  { std::println("    -> f(const string&)  anything, read-only"); }
void f(std::string&&)       { std::println("    -> f(string&&)       an rvalue: safe to gut"); }

std::string make() { return "made"; }
const std::string& cref() { static const std::string s = "static"; return s; }

int main() {
    std::string s = "named";
    const std::string cs = "const named";

    std::println("f(s)                  a named variable");             f(s);
    std::println("f(cs)                 a named const variable");       f(cs);
    std::println("f(\\"literal\\")          a string literal");            f("literal");
    std::println("f(make())             a function returning by value"); f(make());
    std::println("f(cref())             a function returning const&");   f(cref());
    std::println("f(s + \\"!\\")            the result of an operator");    f(s + "!");
    std::println("f(std::string(\\"t\\"))   an explicit temporary");        f(std::string("t"));
    std::println("f(std::move(s))       std::move applied to an lvalue"); f(std::move(s));
    std::println("f(std::move(cs))      std::move applied to a CONST lvalue"); f(std::move(cs));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 lv.cpp && ./lv">
{`f(s)                  a named variable
    -> f(string&)        modifiable lvalue
f(cs)                 a named const variable
    -> f(const string&)  anything, read-only
f("literal")          a string literal
    -> f(string&&)       an rvalue: safe to gut
f(make())             a function returning by value
    -> f(string&&)       an rvalue: safe to gut
f(cref())             a function returning const&
    -> f(const string&)  anything, read-only
f(s + "!")            the result of an operator
    -> f(string&&)       an rvalue: safe to gut
f(std::string("t"))   an explicit temporary
    -> f(string&&)       an rvalue: safe to gut
f(std::move(s))       std::move applied to an lvalue
    -> f(string&&)       an rvalue: safe to gut
f(std::move(cs))      std::move applied to a CONST lvalue
    -> f(const string&)  anything, read-only`}
      </CodeBlock>

      <p>
        Two rows deserve attention. <code>f(make())</code> picked <code>string&amp;&amp;</code> —
        a function returning by value produces a temporary, so the move path is selected
        automatically with no <code>std::move</code> anywhere in sight. That is where most of the
        benefit of move semantics comes from in practice: code that never types{' '}
        <code>std::move</code> at all.
      </p>
      <p>
        And the last row is the first trap. <strong><code>std::move</code> on a{' '}
        <code>const</code> object does nothing.</strong> It produces a <code>const string&amp;&amp;</code>,
        which cannot bind to <code>string&amp;&amp;</code>, so overload resolution falls back to{' '}
        <code>const string&amp;</code> and you get a copy. No warning, no error. A{' '}
        <code>const</code> member, a <code>const</code> parameter, a <code>const</code> range-for
        variable — all of them silently defeat every <code>std::move</code> you write on them.
      </p>

      <h2>Part 2: Rvalue References and the Four Operations</h2>
      <p>
        <code>T&amp;&amp;</code> is a new kind of reference, introduced in C++11, with exactly one
        job: <strong>to be an overload the compiler picks only when the argument is a
        temporary.</strong> That is it. It is not &quot;a reference to a moved thing&quot; and it is
        not a different storage model — it is a signal in the type system.
      </p>
      <p>
        Which means a class can now have four ways of being given another object of its own type,
        and the pair you get is chosen entirely by the argument&apos;s value category. Here they are
        instrumented:
      </p>

      <CodeBlock language="cpp" title="inst.cpp">
{`#include <print>
#include <string>
#include <utility>
#include <vector>

struct Tracked {
    std::string tag;
    std::vector<int> data;          // something with a real heap buffer

    explicit Tracked(std::string t, std::size_t n = 3)
        : tag(std::move(t)), data(n, 1) { std::println("  ctor        {}", tag); }

    Tracked(const Tracked& o)
        : tag(o.tag + "-copy"), data(o.data) { std::println("  COPY ctor   {} <- {}", tag, o.tag); }

    Tracked(Tracked&& o) noexcept
        : tag(std::move(o.tag)), data(std::move(o.data)) {
        o.tag = "(moved-from)";
        std::println("  MOVE ctor   {}", tag);
    }

    Tracked& operator=(const Tracked& o) {
        std::println("  COPY assign {} <- {}", tag, o.tag);
        tag = o.tag + "-copyassigned"; data = o.data; return *this;
    }

    Tracked& operator=(Tracked&& o) noexcept {
        std::println("  MOVE assign {} <- {}", tag, o.tag);
        tag = std::move(o.tag); data = std::move(o.data); o.tag = "(moved-from)";
        return *this;
    }

    ~Tracked() { std::println("  dtor        {}", tag); }
};

int main() {
    std::println("1. construct a:");
    Tracked a{"a"};
    std::println("2. Tracked b = a;            (lvalue -> copy ctor)");
    Tracked b = a;
    std::println("3. Tracked c = std::move(a); (rvalue -> move ctor)");
    Tracked c = std::move(a);
    std::println("4. b = c;                    (lvalue -> copy assign)");
    b = c;
    std::println("5. b = std::move(c);         (rvalue -> move assign)");
    b = std::move(c);
    std::println("6. what is left of the moved-from objects:");
    std::println("   a.tag = '{}'  a.data.size() = {}", a.tag, a.data.size());
    std::println("   c.tag = '{}'  c.data.size() = {}", c.tag, c.data.size());
    std::println("7. end of main -- destructors:");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 inst.cpp && ./inst">
{`1. construct a:
  ctor        a
2. Tracked b = a;            (lvalue -> copy ctor)
  COPY ctor   a-copy <- a
3. Tracked c = std::move(a); (rvalue -> move ctor)
  MOVE ctor   a
4. b = c;                    (lvalue -> copy assign)
  COPY assign a-copy <- a
5. b = std::move(c);         (rvalue -> move assign)
  MOVE assign a-copyassigned <- a
6. what is left of the moved-from objects:
   a.tag = '(moved-from)'  a.data.size() = 0
   c.tag = '(moved-from)'  c.data.size() = 0
7. end of main -- destructors:
  dtor        (moved-from)
  dtor        a
  dtor        (moved-from)`}
      </CodeBlock>

      <p>
        Four distinct operations, selected purely by whether the argument was a named variable or a{' '}
        <code>std::move</code> expression. The bodies are the interesting part: the move constructor
        does <code>data(std::move(o.data))</code>, which hands over the vector&apos;s heap pointer
        rather than copying N integers. For a <code>std::vector</code> of a million elements that is
        the difference between three pointer assignments and a million-element memcpy plus an
        allocation.
      </p>

      <InfoBox variant="warning" title="Declare a destructor and your move constructor disappears">
        <p>
          This is the single most expensive accident in this area, and it is invisible. The compiler
          generates a move constructor for you only if you have declared{' '}
          <em>none</em> of the destructor, copy constructor, copy assignment, or move operations.
          Declare a destructor — even an empty one, even just to add a log line — and the implicit
          move operations are suppressed. Your code still compiles, still passes its tests, and
          silently copies everywhere it used to move.
        </p>
        <CodeBlock language="cpp" title="suppress2.cpp">
{`struct Counted {
    std::string s{"a string long enough to need the heap, so a copy is visible"};
    Counted() = default;
    Counted(const Counted& o) : s(o.s)                { ++sc; }   // count copies
    Counted(Counted&& o) noexcept : s(std::move(o.s)) { ++mc; }   // count moves
};

struct A { Counted c; };            // no destructor declared
struct B { Counted c; ~B() {} };    // ONE empty destructor. That is the only difference.`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 suppress2.cpp && ./suppress2">
{`A a2 = std::move(a1):  copies=0 moves=1
B b2 = std::move(b1):  copies=1 moves=0
vector<A>, 5 emplace_backs from capacity 1: copies=0 moves=7
vector<B>, 5 emplace_backs from capacity 1: copies=7 moves=0`}
        </CodeBlock>
        <p>
          Seven moves became seven copies, because of <code>~B() {'{}'}</code>. And the obvious
          diagnostic does not help you find it —{' '}
          <code>std::is_move_constructible_v</code> reports <code>true</code> for{' '}
          <code>B</code>, because a copy constructor can legally accept an rvalue. The trait that
          tells the truth is <code>std::is_nothrow_move_constructible_v</code>, which is{' '}
          <code>true</code> for <code>A</code> and <code>false</code> for <code>B</code>. Keep that
          one in a <code>static_assert</code> on any type you care about moving.
        </p>
        <p>
          The rule that prevents this is the rule of zero/three/five, and it gets its own treatment
          in <a href="/cpp/classes">the classes lesson</a>. The short version: declare all five or
          declare none.
        </p>
      </InfoBox>

      <h2>Part 3: <code>std::move</code> Is A Cast</h2>
      <p>
        Here is the actual implementation, from the libc++ headers on this machine
        (<code>__utility/move.h</code>), with the macros left in so you can see there is nothing
        hiding in them:
      </p>

      <CodeBlock language="cpp" title="/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/__utility/move.h">
{`template <class _Tp>
[[__nodiscard__]] inline _LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR __libcpp_remove_reference_t<_Tp>&&
move(_LIBCPP_LIFETIMEBOUND _Tp&& __t) _NOEXCEPT {
  using _Up _LIBCPP_NODEBUG = __libcpp_remove_reference_t<_Tp>;
  return static_cast<_Up&&>(__t);
}`}
      </CodeBlock>

      <p>
        One statement. Strip the reference off the deduced type, cast to an rvalue reference to it,
        return. No allocation, no copying, no bookkeeping, no runtime effect. Which the assembly
        confirms:
      </p>

      <CodeBlock language="cpp" title="moveasm.cpp">
{`#include <utility>
#include <string>
std::string&& via_move(std::string& s) { return std::move(s); }
std::string&& via_cast(std::string& s) { return static_cast<std::string&&>(s); }
std::string*  via_addr(std::string& s) { return &s; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S moveasm.cpp | c++filt, directives stripped, laid out side by side and the basic_string type name shortened">
{`via_move(std::string&):      via_cast(std::string&):      via_addr(std::string&):
	ret                          ret                          ret`}
      </CodeBlock>

      <p>
        All three functions are a single <code>ret</code>. The address is already in{' '}
        <code>x0</code> on entry and that is also the return register, so there is literally nothing
        to do. <code>std::move</code>, <code>static_cast&lt;T&amp;&amp;&gt;</code> and{' '}
        <code>&amp;s</code> compile to the same zero instructions.
      </p>
      <p>
        So what does it actually accomplish? It changes a type, and therefore changes which overload
        gets picked. Watch what happens when there is no overload to pick:
      </p>

      <CodeBlock language="cpp" title="movecast.cpp">
{`#include <print>
#include <string>
#include <type_traits>
#include <utility>
#include <vector>

struct Loud {
    std::vector<int> data{1, 2, 3};
    Loud() = default;
    Loud(const Loud& o) : data(o.data)                { std::println("  COPY"); }
    Loud(Loud&& o) noexcept : data(std::move(o.data)) { std::println("  MOVE"); }
};

void takes_const_ref(const Loud&) { std::println("  (inside takes_const_ref)"); }

int main() {
    // 1. What is the TYPE of std::move(x)?
    std::string s = "hello";
    std::println("decltype(s)            is lvalue ref? {}", std::is_lvalue_reference_v<decltype(s)>);
    std::println("decltype(std::move(s)) is rvalue ref? {}",
                 std::is_rvalue_reference_v<decltype(std::move(s))>);
    std::println("std::move(s) and static_cast<std::string&&>(s) are the same type: {}",
                 std::is_same_v<decltype(std::move(s)), decltype(static_cast<std::string&&>(s))>);
    std::println("");

    // 2. A bare std::move statement. Does anything happen?
    Loud a;
    std::println("about to evaluate 'std::move(a);' as a whole statement:");
    std::move(a);
    std::println("  ...nothing printed. a.data.size() is still {}", a.data.size());
    std::println("");

    // 3. std::move into a parameter that cannot accept an rvalue reference.
    std::println("takes_const_ref(std::move(a)):");
    takes_const_ref(std::move(a));
    std::println("  a.data.size() is still {}  <- no move happened", a.data.size());
    std::println("");

    // 4. Now a context that DOES have a move constructor to select.
    std::println("Loud b = std::move(a);");
    Loud b = std::move(a);
    std::println("  a.data.size() = {}   b.data.size() = {}", a.data.size(), b.data.size());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 movecast.cpp && ./movecast">
{`movecast.cpp:29:5: warning: ignoring return value of function declared with
      'nodiscard' attribute [-Wunused-result]
   29 |     std::move(a);
      |     ^~~~~~~~~ ~
1 warning generated.

decltype(s)            is lvalue ref? false
decltype(std::move(s)) is rvalue ref? true
std::move(s) and static_cast<std::string&&>(s) are the same type: true

about to evaluate 'std::move(a);' as a whole statement:
  ...nothing printed. a.data.size() is still 3

takes_const_ref(std::move(a)):
  (inside takes_const_ref)
  a.data.size() is still 3  <- no move happened

Loud b = std::move(a);
  MOVE
  a.data.size() = 0   b.data.size() = 3`}
      </CodeBlock>

      <p>
        Four results, each worth a sentence.
      </p>
      <ul>
        <li>
          <code>std::move(s)</code> and <code>static_cast&lt;std::string&amp;&amp;&gt;(s)</code>{' '}
          are <strong>the same type</strong>. <code>std::move</code> is a readability wrapper around
          a cast, nothing more.
        </li>
        <li>
          <code>std::move(a);</code> as a whole statement printed <strong>nothing</strong> and left{' '}
          <code>a.data.size()</code> at 3. The only reaction was clang pointing out that you
          discarded the cast&apos;s result: <code>ignoring return value of function declared with
          &apos;nodiscard&apos;</code>. That warning is the compiler telling you{' '}
          <code>std::move</code> <em>produces a value</em> rather than <em>performing an
          action</em>.
        </li>
        <li>
          <code>takes_const_ref(std::move(a))</code> ran and <code>a</code> was{' '}
          <strong>unchanged</strong>. The <code>const Loud&amp;</code> parameter can bind an rvalue,
          so the call compiles, and nothing is stolen. If <code>Loud</code> had been expensive and
          the parameter had been by value, you would have paid a full copy while believing you had
          avoided one.
        </li>
        <li>
          Only in case 4, where a <code>Loud&amp;&amp;</code> constructor exists to be selected, does
          anything move — and then it is <em>the move constructor</em> doing the work, not{' '}
          <code>std::move</code>.
        </li>
      </ul>

      <FlowChart
        title="What std::move(x) actually does"
        chart={
          'graph TD\n' +
          '  S["std::move(x)"] --> W1["It is a one-line function template.<br/>Its entire body is a static_cast.<br/>It emits ZERO instructions — verified<br/>against the -O2 assembly."]\n' +
          '  W1 --> W2["All it does is change the expression\'s<br/>value category from LVALUE to RVALUE."]\n' +
          '  W2 --> OR{"Now overload resolution runs.<br/>What is in scope?"}\n' +
          '  OR -->|"a T&amp;&amp; overload exists<br/>(move ctor, move assign,<br/>a &amp;&amp; parameter)"| M["THAT overload is chosen.<br/>It does the actual stealing."]\n' +
          '  OR -->|"only const T&amp; is available"| C["The CONST overload is chosen.<br/>Nothing is moved. You paid a full copy<br/>and the source is untouched."]\n' +
          '  OR -->|"x was declared const"| C2["const T&amp;&amp; cannot bind to T&amp;&amp;.<br/>Falls back to const T&amp;. A COPY.<br/>std::move on a const object is a no-op."]\n' +
          '  OR -->|"nothing — a bare<br/>\'std::move(x);\' statement"| N["Nothing happens at all.<br/>clang warns: ignoring return value of<br/>function declared with \'nodiscard\'"]\n' +
          '  M --> AFTER["Only NOW is x moved-from:<br/>valid, destructible, assignable,<br/>but its value is unspecified."]\n' +
          '  C --> SAME["x is completely unchanged."]\n' +
          '  C2 --> SAME\n' +
          '  N --> SAME\n' +
          '  style W1 fill:#3d2f14,stroke:#fb923c\n' +
          '  style M fill:#1a3329,stroke:#4ade80\n' +
          '  style C fill:#3b1a1a,stroke:#f87171\n' +
          '  style C2 fill:#3b1a1a,stroke:#f87171\n' +
          '  style N fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h2>Part 4: What A Moved-From Object Is</h2>
      <p>
        The standard&apos;s guarantee for a moved-from standard library object is{' '}
        <strong>&quot;valid but unspecified.&quot;</strong> Precisely:
      </p>
      <ul>
        <li>It is still a live object. Its destructor will run and must not misbehave.</li>
        <li>You may assign to it, which puts it back in a known state.</li>
        <li>
          You may call any operation that has <strong>no preconditions</strong> —{' '}
          <code>size()</code>, <code>empty()</code>, <code>clear()</code>.
        </li>
        <li>
          You may <strong>not</strong> call anything with a precondition you cannot verify —{' '}
          <code>front()</code>, <code>back()</code>, <code>operator*</code> on an empty optional. That
          is undefined behaviour.
        </li>
        <li>
          You may not assume any particular <em>value</em>. In practice it is usually empty.
          &quot;Usually&quot; is not a guarantee.
        </li>
      </ul>

      <CodeBlock language="cpp" title="movedfrom.cpp">
{`#include <memory>
#include <optional>
#include <print>
#include <string>
#include <utility>
#include <vector>

int main() {
    // 1. A SHORT string -- small-string optimisation, nothing on the heap.
    std::string shortstr = "abc";
    auto short_moved = std::move(shortstr);
    std::println("short string, moved-from: size={} content='{}' empty={}",
                 shortstr.size(), shortstr, shortstr.empty());

    // 2. A LONG string -- a real heap buffer to steal.
    std::string longstr = "a string far too long for the small-string optimisation";
    auto long_moved = std::move(longstr);
    std::println("long  string, moved-from: size={} content='{}' empty={}",
                 longstr.size(), longstr, longstr.empty());

    // 3. vector
    std::vector<int> v{1, 2, 3};
    auto v2 = std::move(v);
    std::println("vector,       moved-from: size={} capacity={}", v.size(), v.capacity());

    // 4. unique_ptr -- this one IS specified: guaranteed null.
    auto u = std::make_unique<int>(7);
    auto u2 = std::move(u);
    std::println("unique_ptr,   moved-from: == nullptr? {}", u == nullptr);

    // 5. shared_ptr -- also guaranteed empty.
    auto s = std::make_shared<int>(7);
    auto s2 = std::move(s);
    std::println("shared_ptr,   moved-from: use_count={} == nullptr? {}", s.use_count(), s == nullptr);

    // 6. optional -- NOT emptied. It still has_value(); the VALUE is moved-from.
    std::optional<std::string> o{"a long string that definitely allocates on the heap"};
    auto o2 = std::move(o);
    std::println("optional,     moved-from: has_value={} inner size={}", o.has_value(), o->size());

    // 7. Recovery: assignment puts a moved-from object back in a known state.
    longstr = "reassigned";
    std::println("after reassignment: longstr = '{}'", longstr);
    (void)short_moved; (void)long_moved; (void)v2; (void)u2; (void)s2; (void)o2;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 movedfrom.cpp && ./movedfrom">
{`short string, moved-from: size=0 content='' empty=true
long  string, moved-from: size=0 content='' empty=true
vector,       moved-from: size=0 capacity=0
unique_ptr,   moved-from: == nullptr? true
shared_ptr,   moved-from: use_count=0 == nullptr? true
optional,     moved-from: has_value=true inner size=0
after reassignment: longstr = 'reassigned'`}
      </CodeBlock>

      <p>
        Line six is the one that surprises people, and it is correct:{' '}
        <strong>a moved-from <code>std::optional</code> still reports{' '}
        <code>has_value() == true</code>.</strong> Moving an <code>optional</code> moves{' '}
        <em>the contained value</em> and leaves the engaged/disengaged flag alone. So after a move
        you have an <code>optional</code> that claims to hold something and holds a moved-from
        something. If you are coming from Java&apos;s <code>Optional</code> or from
        pattern-matching languages, that is the opposite of the intuition.
      </p>
      <p>
        <code>unique_ptr</code> and <code>shared_ptr</code> are the exceptions in the other
        direction: their moved-from state <em>is</em> specified. Null, guaranteed. That is what made
        the ownership transfer in <a href="/cpp/smart-pointers">the previous lesson</a> safe to rely
        on.
      </p>

      <InfoBox variant="danger" title="Using a moved-from object: three different behaviours from one source file">
        <p>
          &quot;Valid but unspecified&quot; sounds mild. Here is the cost of the distinction between
          &quot;no preconditions&quot; and &quot;has preconditions&quot;:
        </p>
        <CodeBlock language="cpp" title="movedub.cpp">
{`std::vector<int> v{10, 20, 30};
auto v2 = std::move(v);

// v.size() is fine -- size() has no preconditions.
std::printf("v.size() = %zu\\n", v.size());
std::fflush(stdout);

// v.front() requires !v.empty(). It does not hold. This is UB.
std::printf("v.front() = %d\\n", v.front());`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — four builds of the same file">
{`$ clang++ -std=c++23 -Wall -Wextra -O0 -g movedub.cpp -o movedub0 && ./movedub0
v.size() = 0  (defined: size() has no preconditions)
exit=139        <- 128 + 11, SIGSEGV

$ clang++ -std=c++23 -Wall -Wextra -O2 -g movedub.cpp -o movedub2 && ./movedub2
v.size() = 0  (defined: size() has no preconditions)
exit=133        <- 128 + 5, SIGTRAP. A DIFFERENT signal at -O2.

$ clang++ -std=c++23 -fsanitize=address -g -O1 movedub.cpp && ./a.out
v.size() = 0  (defined: size() has no preconditions)
AddressSanitizer:DEADLYSIGNAL
==18814==ERROR: AddressSanitizer: SEGV on unknown address 0x000000000000
  (pc 0x000104ea0a98 bp 0x00016af5e840 sp 0x00016af5e720 T0)
==18814==The signal is caused by a READ memory access.
==18814==Hint: address points to the zero page.
    #0 0x000104ea0a98 in main movedub.cpp:12

$ clang++ -std=c++23 -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG \\
      -g -O1 movedub.cpp && ./a.out
v.size() = 0  (defined: size() has no preconditions)
.../c++/v1/__vector/vector.h:434: libc++ Hardening assertion !empty() failed:
      front() called on an empty vector
exit=134        <- SIGABRT, with the actual reason named`}
        </CodeBlock>
        <p>
          Note that <code>-Wall -Wextra</code> said nothing in any build, and that the{' '}
          <code>-O0</code> and <code>-O2</code> builds died on <em>different signals</em>. The
          fourth build is the useful one and is the actionable tip here:{' '}
          <strong><code>-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG</code></strong>{' '}
          turns libc++&apos;s internal preconditions into named assertions. It costs runtime, it
          belongs in debug and CI builds alongside the sanitizers, and it is the only one of the
          four that told you <em>which precondition</em> you broke.
        </p>
      </InfoBox>

      <h2>Part 5: Copy Elision, And Why Instrumenting Lies To You</h2>
      <p>
        Everything above was measured by counting constructor calls. That technique has a trap in
        it, and the trap is the single most confusing thing about learning move semantics: a large
        fraction of the copies and moves you expect to observe <strong>never happen at all</strong>,
        because the compiler is required to skip them.
      </p>
      <p>
        Here is the experiment. Seven shapes, one instrumented type, three builds:
      </p>

      <CodeBlock language="cpp" title="elide.cpp">
{`#include <print>
#include <string>
#include <utility>

struct T {
    std::string tag;
    explicit T(std::string t) : tag(std::move(t)) { std::println("    ctor   {}", tag); }
    T(const T& o) : tag(o.tag)                    { std::println("    COPY   {}", tag); }
    T(T&& o) noexcept : tag(std::move(o.tag))     { std::println("    MOVE   {}", tag); }
    ~T() { std::println("    dtor   {}", tag.empty() ? "(moved-from)" : tag); }
};

T make_temporary()      { return T("temporary"); }            // return a prvalue
T make_named()          { T local("named"); return local; }   // NRVO candidate
T make_moved()          { T local("moved"); return std::move(local); } // the pessimisation
T make_branchy(bool b)  { T x("x"); T y("y"); return b ? x : y; }      // NRVO cannot apply
void by_value(T t)      { std::println("    (inside by_value, got {})", t.tag); }

int main() {
    std::println("A. T a = make_temporary();");
    { T a = make_temporary(); }
    std::println("B. T b = make_named();");
    { T b = make_named(); }
    std::println("C. T c = make_moved();           <- return std::move(local)");
    { T c = make_moved(); }
    std::println("D. T d = make_branchy(true);");
    { T d = make_branchy(true); }
    std::println("E. by_value(T(\\"direct\\"));         <- temporary into a by-value param");
    by_value(T("direct"));
    std::println("F. T f(\\"existing\\"); by_value(f);");
    { T f("existing"); by_value(f); }
    std::println("G. T g(\\"existing2\\"); by_value(std::move(g));");
    { T g("existing2"); by_value(std::move(g)); }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O0 elide.cpp && ./elide. The -O2 build produced BYTE-IDENTICAL output.">
{`A. T a = make_temporary();
    ctor   temporary
    dtor   temporary
B. T b = make_named();
    ctor   named
    dtor   named
C. T c = make_moved();           <- return std::move(local)
    ctor   moved
    MOVE   moved
    dtor   (moved-from)
    dtor   moved
D. T d = make_branchy(true);
    ctor   x
    ctor   y
    COPY   x
    dtor   y
    dtor   x
    dtor   x
E. by_value(T("direct"));         <- temporary into a by-value param
    ctor   direct
    (inside by_value, got direct)
    dtor   direct
F. T f("existing"); by_value(f);
    ctor   existing
    COPY   existing
    (inside by_value, got existing)
    dtor   existing
    dtor   existing
G. T g("existing2"); by_value(std::move(g));
    ctor   existing2
    MOVE   existing2
    (inside by_value, got existing2)
    dtor   existing2
    dtor   (moved-from)`}
      </CodeBlock>

      <p>
        Three things in there were not what I expected going in, and they are the point of this
        section.
      </p>

      <h3>Surprise 1: <code>-O0</code> and <code>-O2</code> produced identical output</h3>
      <p>
        I ran both expecting the debug build to show the copies and the release build to hide them.
        It does not. <strong>Copy elision is not an optimisation in the normal sense</strong> — it is
        a licence (and since C++17, in some cases a requirement) in the language itself, and clang
        applies it at <code>-O0</code>. Which means you cannot find these copies by building
        unoptimised, and it also means the constructor counts you measure in a debug build are the
        ones you get in release.
      </p>

      <h3>Surprise 2: A, B and E show no copy and no move at all</h3>
      <p>
        <strong>A</strong> (<code>return T("temporary")</code>) and <strong>E</strong>{' '}
        (<code>by_value(T("direct"))</code>) each produce exactly one <code>ctor</code> and one{' '}
        <code>dtor</code>. One object, total, for what looks in the source like
        &quot;construct a temporary, then copy or move it into the destination.&quot; There was never
        a second object to copy from: the temporary is constructed{' '}
        <em>directly in the destination&apos;s storage</em>. Since C++17 this is{' '}
        <strong>mandatory</strong>, not an optimisation — a prvalue does not materialise an object
        until something needs it to.
      </p>
      <p>
        <strong>B</strong> (<code>T local("named"); return local;</code>) also shows one object. That
        one <em>is</em> an optimisation — NRVO, named return value optimisation — and it is optional,
        but every mainstream compiler does it, including at <code>-O0</code> here.
      </p>
      <p>
        The difference between &quot;mandatory&quot; and &quot;optional&quot; is visible if you ask
        clang to stop eliding. <code>-fno-elide-constructors</code> disables the optional elisions
        and cannot disable the mandatory ones — and comparing across standard versions makes the
        C++17 change obvious:
      </p>

      <p>
        (That comparison uses a cut-down version of the file —{' '}
        <code>elide14.cpp</code>, keeping only cases A, B and E and swapping{' '}
        <code>std::println</code> for <code>std::printf</code>, because{' '}
        <code>&lt;print&gt;</code> does not exist in C++14. The instrumented <code>T</code> is
        identical.)
      </p>

      <CodeBlock language="text" title="Real output — elide14.cpp at three standard levels, all with -O0 -fno-elide-constructors. The &quot;&lt;-&quot; notes are annotations, not program output.">
{`===== -std=c++14 -O0 -fno-elide-constructors =====
A. T a = make_temporary();
    ctor   temporary
    MOVE   temporary        <- local into the return slot
    dtor   (moved-from)
    MOVE   temporary        <- return slot into 'a'
    dtor   (moved-from)
    dtor   temporary
B. T b = make_named();
    ctor   named
    MOVE   named
    dtor   (moved-from)
    MOVE   named
    dtor   (moved-from)
    dtor   named
E. by_value(T("direct"));
    ctor   direct
    MOVE   direct
    (inside by_value, got direct)
    dtor   direct
    dtor   (moved-from)

===== -std=c++17 -O0 -fno-elide-constructors =====
A. T a = make_temporary();
    ctor   temporary
    dtor   temporary        <- both moves GONE, and they cannot be turned back on
B. T b = make_named();
    ctor   named
    MOVE   named            <- NRVO was optional, so this one came back
    dtor   (moved-from)
    dtor   named
E. by_value(T("direct"));
    ctor   direct
    dtor   direct

===== -std=c++23 -O0 -fno-elide-constructors =====
    (identical to the c++17 block above)`}
      </CodeBlock>

      <p>
        That is the clearest demonstration of C++17&apos;s guaranteed copy elision I managed to
        produce. In C++14 the <code>A</code> case genuinely creates three objects when elision is
        disabled. In C++17 and later it creates one, and{' '}
        <code>-fno-elide-constructors</code> cannot change that, because there is no copy to elide —
        the standard no longer says an intermediate object exists.
      </p>

      <h3>Surprise 3: case D is a COPY, at every optimisation level</h3>
      <p>
        <code>return b ? x : y;</code> with two local candidates printed <code>COPY</code>, not{' '}
        <code>MOVE</code>, at <code>-O0</code> and <code>-O2</code> alike. NRVO needs a single named
        local to construct directly into the return slot; with two candidates it cannot apply. And
        C++&apos;s implicit-move-on-return rule only fires for an expression that <em>names</em> an
        object, which <code>b ? x : y</code> does not. So you get the most expensive option available.
      </p>
      <p>
        That is a real, actionable finding: <strong>a conditional return of one of two locals costs
        you a copy.</strong> Restructure it as{' '}
        <code>if (b) return x; return y;</code> and each branch is an id-expression again, which
        restores the implicit move.
      </p>

      <h3>And the one that is purely self-inflicted: case C</h3>
      <p>
        <code>return std::move(local);</code> printed a <code>MOVE</code> that the plain{' '}
        <code>return local;</code> in case B did not. Adding <code>std::move</code> to a return
        statement <strong>defeats NRVO</strong>: the return expression is no longer the name of a
        local, so the compiler cannot construct it in place, and you have converted zero operations
        into one move plus one extra destructor. Clang diagnoses it by name:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 -fmessage-length=74 elide.cpp">
{`elide.cpp:15:52: warning: moving a local object in a return statement
      prevents copy elision [-Wpessimizing-move]
   15 | T make_moved()          { T local("moved"); return std::move(local...
      |                                                    ^
elide.cpp:15:52: note: remove std::move call here
   15 |   ...{ T local("moved"); return std::move(local); } // the pessimisation
      |                                 ^~~~~~~~~~     ~
1 warning generated.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The practical rules this produces">
        <p>
          <strong>Return by value and do not write <code>std::move</code> on the return
          statement.</strong> <code>return local;</code> is faster than{' '}
          <code>return std::move(local);</code>, which is the opposite of what the names suggest.
          Turn on <code>-Wpessimizing-move</code> (it is in <code>-Wall</code>) and believe it.
        </p>
        <p>
          <strong>Do not fear returning a large object by value.</strong> The copy you are afraid of
          does not exist. This is why <a href="/cpp/references">the references lesson</a> could say
          &quot;never return a reference to a local, return by value&quot; without a performance
          caveat.
        </p>
        <p>
          <strong>When you instrument a type to count copies, expect to see fewer than you
          predicted</strong>, and check against{' '}
          <code>-fno-elide-constructors</code> before concluding that your move constructor is being
          called. Half the confusion in this topic comes from attributing elision to move semantics.
        </p>
      </InfoBox>

      <h2>Part 6: <code>noexcept</code>, And Why <code>std::vector</code> Depends On It</h2>
      <p>
        <code>noexcept</code> on a move constructor looks like documentation. It is not: it changes
        what the standard library does with your type, by a factor you can measure.
      </p>
      <p>
        The reason is <code>push_back</code>&apos;s exception guarantee. If <code>push_back</code>{' '}
        throws, the vector must be unchanged. Now consider a reallocation: the vector has a new
        buffer and must relocate N existing elements into it. If it <em>moves</em> them and element
        K&apos;s move constructor throws, elements 0..K-1 have been gutted in the old buffer and
        there is no way back. If it <em>copies</em> them, the originals are intact, so it can free
        the new buffer and rethrow.
      </p>
      <p>
        So <code>std::vector</code> checks <code>is_nothrow_move_constructible_v&lt;T&gt;</code> and
        picks. Here it is, with the only difference between the two types being the{' '}
        <code>noexcept</code> specifier:
      </p>

      <CodeBlock language="cpp" title="noex.cpp">
{`template <bool NoexceptMove>
struct Elem {
    std::string data;
    explicit Elem(const char* s) : data(s) {}
    Elem(const Elem& o) : data(o.data) { ++copies; }
    Elem(Elem&& o) noexcept(NoexceptMove) : data(std::move(o.data)) { ++moves; }
    Elem& operator=(const Elem&) = default;
    Elem& operator=(Elem&&) = default;
};

template <class E>
void grow(const char* label) {
    copies = moves = 0;
    std::vector<E> v;
    std::println("{}", label);
    std::println("  is_nothrow_move_constructible : {}", std::is_nothrow_move_constructible_v<E>);
    for (int i = 0; i < 9; ++i) {
        std::size_t before = v.capacity();
        v.emplace_back("some string long enough to need a heap allocation");
        if (v.capacity() != before)
            std::println("  push {} -> capacity {} to {}: copies={} moves={}",
                         i + 1, before, v.capacity(), copies, moves);
    }
    std::println("  TOTAL after 9 push_backs: copies={} moves={}", copies, moves);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 noex.cpp && ./noex">
{`A. move constructor is noexcept
  is_nothrow_move_constructible : true
  push 1 -> capacity 0 to 1: copies=0 moves=0
  push 2 -> capacity 1 to 2: copies=0 moves=1
  push 3 -> capacity 2 to 4: copies=0 moves=3
  push 5 -> capacity 4 to 8: copies=0 moves=7
  push 9 -> capacity 8 to 16: copies=0 moves=15
  TOTAL after 9 push_backs: copies=0 moves=15

B. move constructor is NOT noexcept
  is_nothrow_move_constructible : false
  push 1 -> capacity 0 to 1: copies=0 moves=0
  push 2 -> capacity 1 to 2: copies=1 moves=0
  push 3 -> capacity 2 to 4: copies=3 moves=0
  push 5 -> capacity 4 to 8: copies=7 moves=0
  push 9 -> capacity 8 to 16: copies=15 moves=0
  TOTAL after 9 push_backs: copies=15 moves=0`}
      </CodeBlock>

      <p>
        Fifteen moves become fifteen copies. The capacity sequence is also worth noting —{' '}
        <strong>1, 2, 4, 8, 16</strong> — so libc++ doubles, and the total relocation work over{' '}
        <em>n</em> insertions is <em>n</em> &minus; 1.
      </p>
      <p>
        At realistic scale, with each element owning a heap string, the difference is allocations
        rather than instructions:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 noex2.cpp && ./noex2, best of three runs">
{`200,000 emplace_backs from capacity 1, each element owns a heap string
move IS noexcept                       3.0 ms   200018 heap allocations
move is NOT noexcept                   7.4 ms   462161 heap allocations`}
      </CodeBlock>

      <p>
        <strong>262,143 extra heap allocations</strong> and roughly 2.4&times; the wall time, from
        one missing keyword. (262,143 is 2<sup>18</sup> &minus; 1 — the sum of every capacity the
        vector passed through, each copied string allocating once.) The allocation count was
        byte-identical across all three runs; the timings moved between 3.0&ndash;5.5 ms and
        7.4&ndash;10.6 ms, so treat the ratio as the signal and the absolute numbers as indicative.
      </p>

      <FlowChart
        title="Why one keyword changes vector's reallocation strategy"
        chart={
          'graph TD\n' +
          '  P["v.push_back(x) and<br/>size() == capacity()"] --> A["vector must allocate a bigger buffer<br/>and relocate every existing element"]\n' +
          '  A --> Q{"is_nothrow_move_constructible_v&lt;T&gt;?"}\n' +
          '  Q -->|"true — the move ctor<br/>is marked noexcept"| M["MOVE each element.<br/>If nothing can throw, the old buffer<br/>can be abandoned safely."]\n' +
          '  Q -->|"false — the move ctor<br/>might throw"| C["COPY each element instead."]\n' +
          '  C --> WHY["Why: push_back guarantees that if it<br/>throws, the vector is UNCHANGED.<br/>A move halfway through leaves half<br/>the elements gutted and the old buffer<br/>unrestorable. A copy leaves the<br/>original intact, so a throw can<br/>just free the new buffer and rethrow."]\n' +
          '  M --> MR["Measured: 200,000 emplace_backs<br/>200,018 heap allocations, ~3.0 ms"]\n' +
          '  WHY --> CR["Measured: the same 200,000<br/>462,161 heap allocations, ~7.4 ms<br/>262,143 extra allocations<br/>from one missing keyword"]\n' +
          '  style M fill:#1a3329,stroke:#4ade80\n' +
          '  style MR fill:#1a3329,stroke:#4ade80\n' +
          '  style C fill:#3b1a1a,stroke:#f87171\n' +
          '  style CR fill:#3b1a1a,stroke:#f87171\n' +
          '  style WHY fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <InfoBox variant="tip" title="The noexcept rule">
        <p>
          <strong>Mark your move constructor and move assignment operator{' '}
          <code>noexcept</code>.</strong> They almost always can be, because a correct move is
          pointer-swapping, which does not allocate and therefore cannot throw. If you cannot mark
          them <code>noexcept</code>, your move is doing something it probably should not.
        </p>
        <p>
          The compiler-generated move operations figure this out for themselves — they are{' '}
          <code>noexcept</code> if every member&apos;s move is. So the best way to get this right is
          to not write them at all: compose your type out of{' '}
          <code>std::string</code>, <code>std::vector</code> and <code>std::unique_ptr</code> and
          declare none of the five. That is the rule of zero, and it is the subject of{' '}
          <a href="/cpp/classes">the classes lesson</a>.
        </p>
        <p>
          A <code>static_assert(std::is_nothrow_move_constructible_v&lt;MyType&gt;)</code> next to
          the class definition is a cheap guard that catches the destructor-suppression accident from
          earlier <em>and</em> a missing <code>noexcept</code>, both at compile time.
        </p>
      </InfoBox>

      <h2>Part 7: Forwarding References</h2>
      <p>
        Now the part that genuinely is confusing, and it starts with a piece of syntax that means two
        different things.
      </p>
      <p>
        In <code>void f(std::string&amp;&amp; s)</code>, the <code>&amp;&amp;</code> is an{' '}
        <strong>rvalue reference</strong>: it binds only to temporaries.
      </p>
      <p>
        In <code>template &lt;class T&gt; void f(T&amp;&amp; x)</code>, with <code>T</code> deduced
        right there, the <code>&amp;&amp;</code> is a <strong>forwarding reference</strong> (the
        standard calls it a <em>forwarding reference</em>; older material says &quot;universal
        reference&quot;). It binds to anything, and <code>T</code> is deduced differently depending
        on what it bound to.
      </p>
      <p>
        The mechanism is <strong>reference collapsing</strong>. If <code>T</code> is deduced as{' '}
        <code>A&amp;</code>, then <code>T&amp;&amp;</code> is <code>A&amp; &amp;&amp;</code>, and the
        language collapses that to <code>A&amp;</code>. The rule is &quot;lvalue wins&quot;:{' '}
        <code>&amp; &amp;</code>, <code>&amp; &amp;&amp;</code> and <code>&amp;&amp; &amp;</code> all
        collapse to <code>&amp;</code>; only <code>&amp;&amp; &amp;&amp;</code> stays{' '}
        <code>&amp;&amp;</code>.
      </p>

      <CodeBlock language="cpp" title="fwd.cpp — what T is actually deduced as">
{`template <class T>
void inspect(T&& x) {
    std::println("    T  is lvalue ref? {:<5}  rvalue ref? {}",
                 std::is_lvalue_reference_v<T>, std::is_rvalue_reference_v<T>);
    std::println("    T&& resolves to lvalue ref? {}",
                 std::is_lvalue_reference_v<decltype(x)>);
    (void)x;
}

// The bug: inside the template, the parameter is a NAMED variable -> an lvalue.
template <class T> void relay_broken(T&& x)  { sink(x); }
// The fix.
template <class T> void relay_forward(T&& x) { sink(std::forward<T>(x)); }
// The other bug: std::move unconditionally steals, even from an lvalue caller.
template <class T> void relay_move(T&& x)    { sink(std::move(x)); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 fwd.cpp && ./fwd">
{`inspect(lv):      -- an lvalue argument
    T  is lvalue ref? true   rvalue ref? false
    T&& resolves to lvalue ref? true
inspect(clv):     -- a const lvalue argument
    T  is lvalue ref? true   rvalue ref? false
    T&& resolves to lvalue ref? true
inspect(std::string("rv")):  -- an rvalue
    T  is lvalue ref? false  rvalue ref? false
    T&& resolves to lvalue ref? false

relay_broken(lv)
    sink(string&)   -- lvalue
relay_broken(std::string("rv"))
    sink(string&)   -- lvalue

relay_forward(lv)
    sink(string&)   -- lvalue
relay_forward(clv)
    sink(const&)    -- const lvalue
relay_forward(std::string("rv"))
    sink(string&&)  -- rvalue

relay_move(lv)   <- steals from the caller's lvalue!
    sink(string&&)  -- rvalue
  after relay_move(lv), lv = 'lvalue'`}
      </CodeBlock>

      <p>
        Three things to extract from that.
      </p>
      <p>
        <strong>For an lvalue argument, <code>T</code> is deduced as a reference type.</strong> That
        is unusual — in ordinary template deduction <code>T</code> is never a reference — and it is
        the whole trick. The reference-ness of the argument is encoded into <code>T</code>, which is
        what lets <code>std::forward&lt;T&gt;</code> reconstruct it later. For an rvalue argument,{' '}
        <code>T</code> is deduced as the plain type (both reference checks are <code>false</code>).
      </p>
      <p>
        <strong><code>relay_broken</code> lost the rvalue-ness.</strong> Even when the caller passed
        a temporary, <code>sink(x)</code> picked <code>sink(string&amp;)</code>. The reason is simple
        once you see it: inside the function body <code>x</code> is a{' '}
        <em>named variable</em>, and every use of a named variable is an lvalue, regardless of its
        declared type. A variable of type <code>string&amp;&amp;</code> is still an lvalue when you
        use it.
      </p>
      <p>
        <strong><code>relay_move</code> is actively dangerous.</strong> It forced the rvalue overload
        even for an lvalue caller. The last line of that output — <code>lv = &apos;lvalue&apos;</code>{' '}
        — is not a reprieve: these <code>sink</code> overloads only print, so there was nothing to
        steal. Give the rvalue overload a reason to steal and the damage shows up:
      </p>

      <CodeBlock language="cpp" title="fwd2.cpp">
{`std::vector<std::string> store;
void keep(const std::string& s) { std::println("    keep(const&)  -- COPIED"); store.push_back(s); }
void keep(std::string&& s)      { std::println("    keep(&&)      -- MOVED");  store.push_back(std::move(s)); }

template <class T> void relay_forward(T&& x) { keep(std::forward<T>(x)); }
template <class T> void relay_move(T&& x)    { keep(std::move(x)); }

int main() {
    std::string a = "a string long enough to live on the heap, not in SSO";
    std::string b = a;

    std::println("relay_forward(a)   -- a is an lvalue");
    relay_forward(a);
    std::println("  a is now '{}' ({} chars)", a.empty() ? "(empty)" : "intact", a.size());

    std::println("relay_move(b)      -- b is also an lvalue");
    relay_move(b);
    std::println("  b is now '{}' ({} chars)", b.empty() ? "(empty)" : "intact", b.size());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 fwd2.cpp && ./fwd2">
{`relay_forward(a)   -- a is an lvalue
    keep(const&)  -- COPIED
  a is now 'intact' (52 chars)
relay_move(b)      -- b is also an lvalue
    keep(&&)      -- MOVED
  b is now '(empty)' (0 chars)`}
      </CodeBlock>

      <p>
        The caller&apos;s <code>b</code> came back empty. <code>relay_move</code> looks like a
        performance optimisation and is a correctness bug: a function with a{' '}
        <code>T&amp;&amp;</code> parameter that calls <code>std::move</code> on it will silently gut
        variables its callers still intend to use.{' '}
        <strong>In a template with a deduced <code>T&amp;&amp;</code> parameter, the right tool is
        always <code>std::forward&lt;T&gt;</code>, never <code>std::move</code>.</strong> Conversely,
        for a non-deduced <code>T&amp;&amp;</code> — a real rvalue reference parameter —{' '}
        <code>std::move</code> is correct and <code>std::forward</code> is noise.
      </p>

      <FlowChart
        title="Forwarding references and reference collapsing"
        chart={
          'graph TD\n' +
          '  T["template &lt;class T&gt;<br/>void f(T&amp;&amp; x)<br/><br/>T&amp;&amp; here is NOT an rvalue reference.<br/>It is a FORWARDING reference, because<br/>T is being deduced right here."] --> C{"What did the caller pass?"}\n' +
          '  C -->|"an lvalue: f(a)"| L1["T deduced as A&amp;<br/>parameter type A&amp; &amp;&amp; collapses to A&amp;<br/>x is an LVALUE reference"]\n' +
          '  C -->|"a const lvalue: f(ca)"| L2["T deduced as const A&amp;<br/>collapses to const A&amp;"]\n' +
          '  C -->|"an rvalue: f(A())"| L3["T deduced as A (no reference!)<br/>parameter type A&amp;&amp;<br/>x is an RVALUE reference"]\n' +
          '  L1 --> INSIDE["BUT inside the function, x is a NAMED<br/>variable — which makes every use of it<br/>an LVALUE, whatever T was deduced as."]\n' +
          '  L2 --> INSIDE\n' +
          '  L3 --> INSIDE\n' +
          '  INSIDE --> P{"How do you pass it on?"}\n' +
          '  P -->|"g(x)"| BAD["Always the lvalue overload.<br/>The rvalue-ness the caller gave you<br/>is thrown away. Verified: an rvalue<br/>argument still picked sink(string&amp;)."]\n' +
          '  P -->|"g(std::move(x))"| WORSE["Always the rvalue overload.<br/>Steals from the CALLER\'S lvalue.<br/>Verified: the caller\'s string came<br/>back empty."]\n' +
          '  P -->|"g(std::forward&lt;T&gt;(x))"| GOOD["lvalue in -&gt; lvalue out<br/>rvalue in -&gt; rvalue out<br/>The reference collapsing on T<br/>does the choosing for you."]\n' +
          '  style BAD fill:#3d2f14,stroke:#fb923c\n' +
          '  style WORSE fill:#3b1a1a,stroke:#f87171\n' +
          '  style GOOD fill:#1a3329,stroke:#4ade80\n' +
          '  style INSIDE fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h2>Part 8: Perfect Forwarding</h2>
      <p>
        <code>std::forward</code> is, like <code>std::move</code>, a cast — but a{' '}
        <em>conditional</em> one. Here is the libc++ implementation on this machine
        (<code>__utility/forward.h</code>), both overloads:
      </p>

      <CodeBlock language="cpp" title="/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/__utility/forward.h">
{`template <class _Tp>
[[__nodiscard__]] inline _LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR _Tp&&
forward(_LIBCPP_LIFETIMEBOUND __libcpp_remove_reference_t<_Tp>& __t) _NOEXCEPT {
  return static_cast<_Tp&&>(__t);
}

template <class _Tp>
[[__nodiscard__]] inline _LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR _Tp&&
forward(_LIBCPP_LIFETIMEBOUND __libcpp_remove_reference_t<_Tp>&& __t) _NOEXCEPT {
  static_assert(!is_lvalue_reference<_Tp>::value, "cannot forward an rvalue as an lvalue");
  return static_cast<_Tp&&>(__t);
}`}
      </CodeBlock>

      <p>
        <code>static_cast&lt;_Tp&amp;&amp;&gt;</code> — the same cast as <code>std::move</code>, but
        with <code>_Tp</code> supplied explicitly rather than deduced. That is the whole difference.
        If <code>T</code> is <code>A&amp;</code>, the cast target collapses to <code>A&amp;</code> and
        you get an lvalue out. If <code>T</code> is <code>A</code>, the target is{' '}
        <code>A&amp;&amp;</code> and you get an rvalue out. Which is why{' '}
        <code>std::forward&lt;T&gt;</code> must always be spelled with its template argument — the
        argument <em>is</em> the mechanism.
      </p>
      <p>
        Combine that with a variadic pack and you have <strong>perfect forwarding</strong>: a wrapper
        that passes its arguments to a constructor exactly as it received them. That is what{' '}
        <code>make_unique</code>, <code>make_shared</code> and <code>emplace_back</code> all are.
        Here are the three plausible ways to write a factory, with the copies and moves counted:
      </p>

      <CodeBlock language="cpp" title="pfwd.cpp">
{`static int ctors = 0, copies = 0, moves = 0;
struct Payload {
    std::string s;
    explicit Payload(std::string v) : s(std::move(v)) { ++ctors; }
    Payload(const Payload& o) : s(o.s)                { ++copies; }
    Payload(Payload&& o) noexcept : s(std::move(o.s)) { ++moves; }
};

struct Thing {
    Payload p;
    int n;
    Thing(Payload payload, int num) : p(std::move(payload)), n(num) {}
};

// 1. const& everywhere: an rvalue argument gets copied for no reason.
template <class T>
std::unique_ptr<Thing> make_cref(const T& a, int n) { return std::make_unique<Thing>(a, n); }

// 2. by value then move: one move too many for an lvalue, right for an rvalue.
template <class T>
std::unique_ptr<Thing> make_byval(T a, int n) { return std::make_unique<Thing>(std::move(a), n); }

// 3. perfect forwarding: whatever the caller gave, the constructor gets.
template <class... Args>
std::unique_ptr<Thing> make_fwd(Args&&... args) {
    return std::make_unique<Thing>(std::forward<Args>(args)...);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O1 pfwd.cpp && ./pfwd">
{`Passing an RVALUE Payload:
  make_cref(Payload{...}, 1)           ctors=1 copies=1 moves=1
  make_byval(Payload{...}, 1)          ctors=1 copies=0 moves=2
  make_fwd(Payload{...}, 1)            ctors=1 copies=0 moves=2

Passing an LVALUE Payload:
  make_cref(lv, 1)                     ctors=0 copies=1 moves=1
  make_byval(lv, 1)                    ctors=0 copies=1 moves=2
  make_fwd(lv, 1)                      ctors=0 copies=1 moves=1`}
      </CodeBlock>

      <p>
        Read it as two columns. For an <strong>rvalue</strong> argument,{' '}
        <code>make_cref</code> costs a copy that the other two avoid. For an{' '}
        <strong>lvalue</strong> argument, <code>make_byval</code> costs an extra move that the other
        two avoid. <strong><code>make_fwd</code> is the only one that is optimal in both
        columns</strong> — never worse than either alternative, better than each in one case. That is
        what &quot;perfect&quot; means in perfect forwarding: not &quot;zero cost,&quot; but
        &quot;exactly the cost the caller&apos;s argument category implies, and no more.&quot;
      </p>
      <p>
        One honest detail about the two moves in the rvalue row, since it took a moment to account
        for. <code>Thing</code>&apos;s constructor takes <code>Payload</code> by value and then does{' '}
        <code>p(std::move(payload))</code>. That is two by-value hops: the forwarded{' '}
        <code>Payload&amp;&amp;</code> initialises the parameter (move 1), then the parameter
        initialises the member (move 2). Elision cannot remove the first one because the forwarded
        expression is an xvalue, not a prvalue — there is already an object elsewhere. Taking{' '}
        <code>Payload</code> by value in a constructor and moving it into the member is still the
        standard idiom; the cost is one cheap move, not a copy.
      </p>

      <InfoBox variant="info" title="Where you will actually meet this">
        <p>
          You almost never write a forwarding-reference template on purpose. You meet them as
          users:
        </p>
        <ul>
          <li>
            <code>v.emplace_back(args...)</code> forwards <code>args</code> to{' '}
            <code>T</code>&apos;s constructor, which is why it can build an element in place where{' '}
            <code>push_back(T(args...))</code> builds one and moves it.
          </li>
          <li>
            <code>std::make_unique&lt;T&gt;(args...)</code> and{' '}
            <code>std::make_shared&lt;T&gt;(args...)</code> — the same mechanism, which is why they
            accept whatever <code>T</code>&apos;s constructor accepts.
          </li>
          <li>
            <code>std::thread</code>, <code>std::async</code>, <code>std::invoke</code>,{' '}
            <code>std::apply</code> and every standard algorithm that takes a callable.
          </li>
          <li>
            <code>auto&amp;&amp; x = expr;</code> in a range-for or a lambda parameter —{' '}
            <code>auto&amp;&amp;</code> is a forwarding reference too, and{' '}
            <code>for (auto&amp;&amp; e : range)</code> is the form that works for every range
            including ones whose iterators return temporaries.
          </li>
        </ul>
        <p>
          You write one when you are building a factory, a wrapper, a logging decorator, or anything
          that has to pass arguments through without knowing their types. Outside that, prefer plain
          overloads — a <code>const T&amp;</code> and a <code>T&amp;&amp;</code> pair is easier to
          read and gives better error messages than a constrained forwarding template.
        </p>
      </InfoBox>

      <h2>When To Write <code>std::move</code> Yourself</h2>
      <p>
        Short list, because the answer is &quot;rarely.&quot;
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Situation</th>
            <th style={headStyle}>Write</th>
            <th style={headStyle}>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Passing a local you are finished with into a sink</td>
            <td style={cellStyle}><code>sink(std::move(local))</code></td>
            <td style={cellStyle}>The one clearly correct use. Nothing reads{' '}
              <code>local</code> afterwards.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A by-value constructor parameter into a member</td>
            <td style={cellStyle}><code>: member(std::move(param))</code></td>
            <td style={cellStyle}>The parameter is yours; moving it costs a pointer swap instead
              of an allocation.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Transferring a <code>unique_ptr</code></td>
            <td style={cellStyle}><code>f(std::move(u))</code></td>
            <td style={cellStyle}>Required — it is move-only, and the <code>std::move</code>{' '}
              makes the transfer visible at the call site.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Inside a template with a deduced <code>T&amp;&amp;</code></td>
            <td style={cellStyle}><code>std::forward&lt;T&gt;(x)</code> — not{' '}
              <code>std::move</code></td>
            <td style={cellStyle}>Verified above: <code>std::move</code> there empties the
              caller&apos;s lvalue.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Returning a local</td>
            <td style={cellStyle}><code>return local;</code> — <strong>no</strong>{' '}
              <code>std::move</code></td>
            <td style={cellStyle}><code>std::move</code> defeats NRVO. Clang warns{' '}
              <code>-Wpessimizing-move</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Returning a temporary, or a function result</td>
            <td style={cellStyle}>nothing</td>
            <td style={cellStyle}>Already an rvalue. Elision means there may be no object to
              move.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Anything <code>const</code></td>
            <td style={cellStyle}>nothing — it will not work</td>
            <td style={cellStyle}><code>const T&amp;&amp;</code> cannot bind{' '}
              <code>T&amp;&amp;</code>; you get a silent copy.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>An <code>int</code>, a pointer, a <code>std::span</code></td>
            <td style={cellStyle}>nothing</td>
            <td style={cellStyle}>Nothing to steal. Moving a trivially copyable type is a
              copy.</td>
          </tr>
        </tbody>
      </table>

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
            <td style={cellStyle}>&quot;<code>std::move</code> moves the object&quot;</td>
            <td style={cellStyle}>Three single-<code>ret</code> functions. A bare{' '}
              <code>std::move(a);</code> printed nothing and left <code>size()</code> at 3.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;If I write <code>std::move</code>, a move happens&quot;</td>
            <td style={cellStyle}>Into a <code>const&amp;</code> parameter: no move, source
              untouched. On a <code>const</code> object: picks{' '}
              <code>f(const string&amp;)</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A moved-from object is empty&quot;</td>
            <td style={cellStyle}>A moved-from <code>optional</code> reported{' '}
              <code>has_value = true</code>. Only <code>unique_ptr</code>/<code>shared_ptr</code>{' '}
              guarantee null.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Debug builds show the copies release builds hide&quot;</td>
            <td style={cellStyle}><code>-O0</code> and <code>-O2</code> produced byte-identical
              constructor traces. Elision happens at <code>-O0</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>return std::move(local)</code> is faster&quot;</td>
            <td style={cellStyle}>It added a move and a destructor that <code>return local;</code>{' '}
              did not have, and earned a <code>-Wpessimizing-move</code> warning.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>noexcept</code> is documentation&quot;</td>
            <td style={cellStyle}>15 moves vs 15 copies in a growing vector; 200,018 vs 462,161
              allocations at 200k elements.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Adding a destructor is harmless&quot;</td>
            <td style={cellStyle}><code>~B() {'{}'}</code> turned 7 moves into 7 copies, and{' '}
              <code>is_move_constructible_v</code> still said <code>true</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::move</code> works in a template too&quot;</td>
            <td style={cellStyle}><code>relay_move(b)</code> emptied the caller&apos;s{' '}
              <code>b</code>. Use <code>std::forward&lt;T&gt;</code>.</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="question" title="Before you move on">
        <p>
          The exercise worth doing is the elision one, because reading a trace is not the same as
          predicting one. Write the instrumented <code>T</code> from Part 5, then{' '}
          <em>before running anything</em>, write down how many{' '}
          <code>ctor</code>/<code>COPY</code>/<code>MOVE</code>/<code>dtor</code> lines each of the
          seven cases will print. Then run it. Then run it again with{' '}
          <code>-fno-elide-constructors</code>, and once more at <code>-std=c++14</code>. The gap
          between your predictions and the output is exactly the amount of copy elision you were
          unknowingly attributing to move semantics.
        </p>
        <p>
          The thread running through this whole lesson is that the type system is doing the work and{' '}
          <code>std::move</code> is only a way of talking to it. Value categories decide which
          overload is viable; <code>noexcept</code> decides what the library is willing to do;
          elision decides whether there is an object to operate on at all. None of it is runtime
          machinery — it is all decided during compilation, which is why none of it costs anything
          and also why none of it can protect you at runtime.
        </p>
        <p>
          Which is the handover. You now have <a href="/cpp/raii">RAII</a>,{' '}
          <a href="/cpp/smart-pointers">ownership</a>, and transfer. What you do not have is a way to
          know when you got it wrong — and <a href="/cpp/memory-bugs">the next lesson</a> is that:
          every classic memory bug, its minimal reproduction, and the real sanitizer output that
          names it.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default MoveSemantics;
