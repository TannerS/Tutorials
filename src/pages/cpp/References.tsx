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

function References() {
  return (
    <LessonLayout
      title="Values, References & Pointers"
      sectionId="cpp"
      lessonIndex={4}
      prev={{ path: '/cpp/functions', label: 'Functions, Overloading & Lambdas' }}
      next={{ path: '/cpp/memory-model', label: 'The Memory Model: Stack, Heap & Object Lifetime' }}
    >
      <p>
        This is the last lesson of Phase 1 and the one that matters most, because it is the single
        largest correction to the instincts you brought with you. Everything in{' '}
        <a href="/cpp/intro">the intro</a> about objects not being handles, everything in{' '}
        <a href="/cpp/functions">the previous lesson</a> about what a parameter copies, and
        everything in the memory phase that follows — all of it rests on one sentence.
      </p>
      <p>
        <strong>In C++, a variable of class type is not a handle to an object. It is the
        object.</strong>
      </p>
      <p>
        If you have spent a decade in Java and Node, that sentence has roughly the weight of
        &quot;gravity points sideways here.&quot; Every mental model you have for assignment,
        parameter passing, container contents and equality is built on the assumption that a
        variable holds a reference to something that lives elsewhere. In C++ that assumption is
        false by default, and the three mechanisms that get you back to reference-like behaviour —
        references, pointers, and smart pointers — are opt-in, distinct from each other, and have
        different failure modes.
      </p>

      <h2>Assignment Copies. All Of It.</h2>
      <p>
        <a href="/cpp/intro">The intro lesson</a> demonstrated this with a <code>User</code> and
        asked you to accept it. Here is the version with the consequences attached.
      </p>

      <CodeBlock language="cpp" title="val2.cpp">
{`#include <print>
#include <string>
#include <vector>

struct User {
    std::string name;
    std::vector<int> scores;
};

void mutate_copy(User u) { u.name = "changed-by-value"; }
void mutate_ref(User& u) { u.name = "changed-by-reference"; }

int main() {
    User a{"ada-lovelace-first-programmer", {1, 2, 3}};

    // THE assignment. In Java and JS this makes a second name for one object.
    User b = a;

    std::println("sizeof(User)                   = {}", sizeof(User));
    std::println("&a == &b                       = {}", &a == &b);
    std::println("a.name.data()   == b.name.data()   = {}", a.name.data()   == b.name.data());
    std::println("a.scores.data() == b.scores.data() = {}", a.scores.data() == b.scores.data());
    std::println("");

    b.name = "alan-turing-also-quite-good";
    b.scores.push_back(4);
    std::println("after mutating b only:");
    std::println("  a = {} / {} scores", a.name, a.scores.size());
    std::println("  b = {} / {} scores", b.name, b.scores.size());
    std::println("");

    mutate_copy(a);
    std::println("after mutate_copy(a):  a.name = {}", a.name);
    mutate_ref(a);
    std::println("after mutate_ref(a):   a.name = {}", a.name);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 val2.cpp && ./val2">
{`sizeof(User)                   = 48
&a == &b                       = false
a.name.data()   == b.name.data()   = false
a.scores.data() == b.scores.data() = false

after mutating b only:
  a = ada-lovelace-first-programmer / 3 scores
  b = alan-turing-also-quite-good / 4 scores

after mutate_copy(a):  a.name = ada-lovelace-first-programmer
after mutate_ref(a):   a.name = changed-by-reference`}
      </CodeBlock>

      <p>
        Four <code>false</code>s, from one <code>=</code>. Two distinct <code>User</code> objects at
        two distinct addresses; two distinct string buffers; two distinct vector buffers. Nobody
        wrote a copy constructor — the compiler generated one that copies each member, and{' '}
        <code>std::string</code> and <code>std::vector</code> each duplicate their own heap storage
        when copied.
      </p>
      <p>
        Translated into Java, that program would have printed <code>true</code> three times and{' '}
        <code>a</code> would have changed when <code>b</code> did. Translated into C++, you get two
        independent objects and a guarantee that nothing you do to <code>b</code> can be observed
        through <code>a</code>.
      </p>

      <InfoBox variant="success" title="This is a feature, and it is worth naming why">
        <p>
          It is easy to read the above as &quot;C++ makes expensive copies behind your back.&quot;
          The more useful reading is that <strong>C++ has no aliasing by default</strong>, and
          aliasing is the thing that makes concurrent and large-scale code hard to reason about.
        </p>
        <p>
          In Java, handing a <code>List&lt;String&gt;</code> to a method means that method can
          mutate your list, and the only defences are documentation, defensive copying, or{' '}
          <code>Collections.unmodifiableList</code>. In C++ the equivalent is passed by value and
          cannot be mutated because it is not your object. &quot;Who can change this?&quot; has a
          syntactic answer in C++: whoever has a non-<code>const</code> reference or pointer, and
          you can see that in the signature.
        </p>
        <p>
          The cost of that guarantee is the copies. The cure for the copies is references,{' '}
          <code>std::move</code>, and the fact that most copies you do not want never happen because
          the compiler elides them — which is Phase 2&apos;s subject.
        </p>
      </InfoBox>

      <h2>What A Reference Actually Is</h2>
      <p>
        A reference is <strong>an alias</strong>. Not a pointer with nicer syntax, not a
        &quot;safe pointer&quot; — a second name for an object that already exists. Once bound, the
        name and the object are indistinguishable.
      </p>
      <p>
        A pointer is <strong>an object in its own right</strong> that happens to store an address.
        It has its own storage, its own address, its own lifetime, and it can be changed to point
        somewhere else.
      </p>

      <FlowChart
        title="Value, reference, pointer: what the variable actually holds"
        chart={
          'graph TD\n' +
          '  subgraph VAL["int x = 1;  — a VALUE"]\n' +
          '    V1["x<br/>4 bytes of storage<br/>holding the integer 1"] --> V2["x IS the object.<br/>sizeof(x) = 4"]\n' +
          '  end\n' +
          '  subgraph REF["int&amp; r = x;  — a REFERENCE"]\n' +
          '    R1["r<br/>no storage required;<br/>no object of its own"] -.->|"IS another name for"| V1\n' +
          '    R1 --> R2["&amp;r == &amp;x is TRUE.<br/>You cannot get r\'s own address<br/>because it has none."]\n' +
          '    R2 --> R3["Must be initialised.<br/>Cannot be null.<br/>Cannot be reseated."]\n' +
          '  end\n' +
          '  subgraph PTR["int* p = &amp;x;  — a POINTER"]\n' +
          '    P1["p<br/>8 bytes of storage<br/>holding x\'s ADDRESS"] -->|"points at"| V1\n' +
          '    P1 --> P2["&amp;p is p\'s OWN address.<br/>sizeof(p) = 8"]\n' +
          '    P2 --> P3["May be uninitialised.<br/>May be null.<br/>May be rebound: p = &amp;y"]\n' +
          '  end\n' +
          '  style V2 fill:#1a3329,stroke:#4ade80\n' +
          '  style R3 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style P3 fill:#3d2f14,stroke:#fb923c'
        }
      />

      <CodeBlock language="cpp" title="rp.cpp">
{`#include <print>

struct Holder { int& r; int* p; };

int main() {
    int x = 1, y = 2;

    int& r = x;        // r IS x. Another name for the same object.
    int* p = &x;       // p is a separate object that stores x's address.

    // 1. A reference has no address of its own: &r gives you &x.
    std::println("&r == &x   = {}   <- the reference has no identity", &r == &x);
    std::println("&p == &x   = {}   <- the pointer is its own object", (void*)&p == (void*)&x);

    // 2. Writing through each.
    r = 99;  std::println("after r = 99:    x = {}", x);
    *p = 50; std::println("after *p = 50:   x = {}", x);

    // 3. "Reseating" a reference is impossible -- this ASSIGNS, it does not rebind.
    r = y;   // copies y's VALUE into x. r still refers to x.
    std::println("after r = y:     x = {}  y = {}  &r == &x = {}", x, y, &r == &x);

    // A pointer genuinely rebinds.
    p = &y;
    std::println("after p = &y:    *p = {}  p == &y = {}", *p, p == &y);

    std::println("sizeof(int*)   = {}", sizeof(int*));
    std::println("sizeof(Holder) = {}   (an int& and an int*)", sizeof(Holder));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 rp.cpp && ./rp">
{`&r == &x   = true   <- the reference has no identity
&p == &x   = false   <- the pointer is its own object
after r = 99:    x = 99
after *p = 50:   x = 50
after r = y:     x = 2  y = 2  &r == &x = true
sizeof(int*)   = 8
sizeof(Holder) = 16   (an int& and an int*)`}
      </CodeBlock>

      <p>
        Line five is the one to stare at. <code>r = y;</code> looks exactly like a rebind and is not
        one. Because <code>r</code> <em>is</em> <code>x</code>, the statement means{' '}
        <code>x = y</code> — it copied <code>y</code>&apos;s value into <code>x</code>, and{' '}
        <code>&amp;r == &amp;x</code> is still <code>true</code>. There is no syntax for reseating a
        reference, because a reference is not a thing that can point at something; it is the name of
        something.
      </p>
      <p>
        Line one is the structural statement: <code>&amp;r</code> gives you{' '}
        <code>&amp;x</code>, not the address of some hypothetical reference variable. That is why
        there is no <code>sizeof</code> for a reference that means anything — the standard does not
        require a reference to occupy storage at all. The <code>Holder</code> struct comes out at 16
        bytes because an implementation almost always stores a reference member <em>as</em> a
        pointer, but that is an implementation choice, not something the language promises you.
      </p>

      <h3>The three things a reference cannot do</h3>

      <CodeBlock language="cpp" title="rpbad.cpp">
{`int main() {
    int x = 1;
    int& a;            // (1) must be initialised
    int& b = nullptr;  // (2) cannot be null
    int&& c = x;       // (3) cannot bind an rvalue reference to an lvalue
    const int& ok = 5; // (4) ...but a CONST lvalue reference CAN bind a literal
    (void)a;(void)b;(void)c;(void)ok;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -c rpbad.cpp">
{`rpbad.cpp:3:10: error: declaration of reference variable 'a' requires an
      initializer
    3 |     int& a;            // (1) must be initialised
      |          ^
rpbad.cpp:4:10: error: non-const lvalue reference to type 'int' cannot
      bind to a temporary of type 'std::nullptr_t'
    4 |     int& b = nullptr;  // (2) cannot be null
      |          ^   ~~~~~~~
rpbad.cpp:5:11: error: rvalue reference to type 'int' cannot bind to
      lvalue of type 'int'
    5 |     int&& c = x;       // (3) cannot bind an rvalue reference to an lvalue
      |           ^   ~
3 errors generated.`}
      </CodeBlock>

      <p>
        Three errors, and note which line is <em>not</em> among them: line 6.{' '}
        <code>const int&amp; ok = 5;</code> compiles. A <code>const</code> lvalue reference can bind
        to a temporary, and when it does, <strong>the temporary&apos;s lifetime is extended to match
        the reference</strong>. That is the mechanism that makes <code>const T&amp;</code> parameters
        able to accept temporaries, which is most of why they are the default parameter form.
      </p>

      <CodeBlock language="cpp" title="lifeext.cpp — watching the extension happen">
{`#include <print>
#include <string>

struct Noisy {
    std::string tag;
    explicit Noisy(std::string t) : tag(std::move(t)) { std::println("  + {}", tag); }
    ~Noisy() { std::println("  - {}", tag); }
};

Noisy make(const char* t) { return Noisy{t}; }

int main() {
    std::println("1. no binding -- the temporary dies at the semicolon:");
    make("unbound");
    std::println("   (back in main)");

    std::println("2. bound to a const reference -- lifetime extended to the ref's scope:");
    {
        const Noisy& r = make("bound");
        std::println("   still alive here, tag = {}", r.tag);
    }
    std::println("   (scope ended, so it died above)");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 lifeext.cpp && ./lifeext">
{`1. no binding -- the temporary dies at the semicolon:
  + unbound
  - unbound
   (back in main)
2. bound to a const reference -- lifetime extended to the ref's scope:
  + bound
   still alive here, tag = bound
  - bound
   (scope ended, so it died above)`}
      </CodeBlock>

      <InfoBox variant="warning" title="Lifetime extension does not survive a function return">
        <p>
          The extension rule is local and syntactic: it applies when a temporary is bound directly to
          a reference <em>variable</em>, and it extends to that variable&apos;s scope. It does{' '}
          <strong>not</strong> apply across a <code>return</code>, and it does not chain through
          another function&apos;s parameter. Clang catches the obvious shape:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -c lifebad.cpp">
{`lifebad.cpp:3:12: warning: returning reference to local temporary object
      [-Wreturn-stack-address]
    3 |     return std::string("temporary");   // lifetime extension does ...
      |            ^~~~~~~~~~~~~~~~~~~~~~~~
1 warning generated.`}
        </CodeBlock>
        <p>
          A <strong>warning</strong>, not an error. That program compiles and links. This is the same
          hazard as the <code>string_view</code> trap in{' '}
          <a href="/cpp/types">the types lesson</a> and the dangling lambda capture in{' '}
          <a href="/cpp/functions">the functions lesson</a> — three faces of one problem, which the
          back half of this lesson is about.
        </p>
      </InfoBox>

      <h2><code>const</code> In Every Position</h2>
      <p>
        <code>const</code> applies to whatever is immediately to its left, unless there is nothing to
        its left, in which case it applies to what is on its right. That single rule generates
        everything, but it is easier to just read declarations right-to-left.
      </p>

      <FlowChart
        title="const on a pointer: which thing is locked?"
        chart={
          'graph TD\n' +
          '  Q["Read it RIGHT TO LEFT.<br/>Whatever is nearest the name binds tightest."] --> A["const int* p"]\n' +
          '  Q --> B["int* const p"]\n' +
          '  Q --> C["const int* const p"]\n' +
          '  Q --> D["const int&amp; r"]\n' +
          '  A --> A1["\'p is a pointer to a const int\'<br/>*p = 5   -&gt; ERROR<br/>p = &amp;other -&gt; OK"]\n' +
          '  B --> B1["\'p is a const pointer to an int\'<br/>*p = 5   -&gt; OK<br/>p = &amp;other -&gt; ERROR"]\n' +
          '  C --> C1["both locked<br/>*p = 5   -&gt; ERROR<br/>p = &amp;other -&gt; ERROR"]\n' +
          '  D --> D1["\'r is a reference to a const int\'<br/>r = 5 is an ASSIGNMENT attempt -&gt; ERROR.<br/>There is no \'const reference\' row,<br/>because a reference never rebinds anyway."]\n' +
          '  A1 --> N1["int const* p is the SAME TYPE<br/>as const int* p — verified with is_same_v"]\n' +
          '  D1 --> N2["This is why const T&amp; is THE parameter form:<br/>it already cannot rebind, so const is the<br/>only thing left to add."]\n' +
          '  style A1 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style B1 fill:#3d2f14,stroke:#fb923c\n' +
          '  style C1 fill:#1a3329,stroke:#4ade80\n' +
          '  style D1 fill:#1a3329,stroke:#4ade80'
        }
      />

      <CodeBlock language="cpp" title="cst.cpp — what each position allows">
{`#include <print>
#include <type_traits>

int main() {
    int a = 1, b = 2;

    const int*  p1 = &a;       // pointer to const int : *p1 read-only, p1 is not
    int* const  p2 = &a;       // const pointer to int : p2 read-only, *p2 is not
    const int* const p3 = &a;  // both read-only
    int const*  p4 = &a;       // IDENTICAL to const int*

    std::println("p1 and p4 are the same type: {}",
                 std::is_same_v<decltype(p1), decltype(p4)>);

    p1 = &b;        // OK: rebinding a pointer-to-const
    *p2 = 99;       // OK: writing through a const pointer
    std::println("a = {}  (written through p2)", a);
    std::println("*p1 = {}  (p1 now points at b)", *p1);
    (void)p3;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cst.cpp && ./cst">
{`p1 and p4 are the same type: true
a = 99  (written through p2)
*p1 = 2  (p1 now points at b)`}
      </CodeBlock>

      <CodeBlock language="cpp" title="cstbad.cpp — and what each forbids">
{`int main() {
    int a = 1, b = 2;
    const int*  p1 = &a;
    int* const  p2 = &a;
    const int* const p3 = &a;

    *p1 = 5;      // (1) cannot write through a pointer-to-const
    p2  = &b;     // (2) cannot rebind a const pointer
    *p3 = 5;      // (3) cannot write through it
    p3  = &b;     // (4) ...and cannot rebind it either
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -c cstbad.cpp (error lines only)">
{`cstbad.cpp:7:9: error: read-only variable is not assignable
cstbad.cpp:8:9: error: cannot assign to variable 'p2' with const-qualified
      type 'int *const'
cstbad.cpp:9:9: error: read-only variable is not assignable
cstbad.cpp:10:9: error: cannot assign to variable 'p3' with const-qualified
      type 'const int *const'`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Declaration</th>
            <th style={headStyle}>Read it as</th>
            <th style={headStyle}><code>*p = v</code></th>
            <th style={headStyle}><code>p = &amp;other</code></th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>int* p</code></td>
            <td style={cellStyle}>pointer to int</td>
            <td style={cellStyle}>OK</td>
            <td style={cellStyle}>OK</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>const int* p</code><br /><code>int const* p</code></td>
            <td style={cellStyle}>pointer to const int</td>
            <td style={cellStyle}>error</td>
            <td style={cellStyle}>OK</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>int* const p</code></td>
            <td style={cellStyle}>const pointer to int</td>
            <td style={cellStyle}>OK</td>
            <td style={cellStyle}>error</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>const int* const p</code></td>
            <td style={cellStyle}>const pointer to const int</td>
            <td style={cellStyle}>error</td>
            <td style={cellStyle}>error</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>int&amp; r</code></td>
            <td style={cellStyle}>reference to int</td>
            <td style={cellStyle}>OK (<code>r = v</code>)</td>
            <td style={cellStyle}>impossible by design</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>const int&amp; r</code></td>
            <td style={cellStyle}>reference to const int</td>
            <td style={cellStyle}>error</td>
            <td style={cellStyle}>impossible by design</td>
          </tr>
        </tbody>
      </table>

      <InfoBox variant="tip" title="const correctness is not politeness, it is a load-bearing wall">
        <p>
          Three practical reasons it earns its keep, beyond &quot;documents intent.&quot;
        </p>
        <p>
          <strong>1. It is the only thing that makes <code>const T&amp;</code> parameters
          work.</strong> A function taking <code>const std::string&amp;</code> can be called with a
          temporary, a literal, or an existing string. One taking <code>std::string&amp;</code>
          cannot be called with any of the first two — the temporary has nowhere to live. So{' '}
          <code>const</code> on a parameter is not a promise, it is what makes the signature usable.
        </p>
        <p>
          <strong>2. <code>const</code> member functions are what you can call on a{' '}
          <code>const</code> object.</strong> Forget to mark a getter <code>const</code> and it
          becomes uncallable through every <code>const T&amp;</code> in your codebase, which
          produces an error message far from the actual mistake. Mark every function that does not
          mutate.
        </p>
        <p>
          <strong>3. It is retrofittable only at great cost.</strong> Adding <code>const</code> to
          one function forces it onto everything that function calls, transitively. &quot;Const
          poisoning&quot; is the usual complaint, and it is the correct direction of travel — but it
          means starting <code>const</code>-correct is cheap and becoming <code>const</code>-correct
          later is a project. Default to <code>const</code> on every parameter and member function
          and remove it only when the compiler makes you.
        </p>
        <p>
          Note that <code>const</code> is a <em>compile-time</em> guarantee about one access path,
          not a runtime property of the memory. It can be cast away with{' '}
          <code>const_cast</code>, and writing through the result is undefined behaviour if the
          object was genuinely <code>const</code>. Mutable-state escape hatches (<code>mutable</code>{' '}
          members, caching in a <code>const</code> function) get their own treatment in the OOP
          phase.
        </p>
      </InfoBox>

      <h2>Which One Should You Use?</h2>
      <p>
        The decision is not stylistic. It follows from two questions: can the thing legitimately be
        absent, and do you need to change which thing you are referring to?
      </p>

      <FlowChart
        title="Value, reference, or pointer — the decision"
        chart={
          'graph TD\n' +
          '  Q["I need to refer to an object<br/>I did not create here."] --> A{"Can it legitimately<br/>be absent?"}\n' +
          '  A -->|"yes — \'not found\',<br/>\'not configured yet\',<br/>\'optional dependency\'"| N{"Do I OWN it?"}\n' +
          '  N -->|"yes, I must free it"| SM["std::unique_ptr&lt;T&gt;<br/>or std::shared_ptr&lt;T&gt;<br/>— Phase 2"]\n' +
          '  N -->|"no, somebody else owns it"| RP["T* — a raw, NON-OWNING pointer.<br/>Check it before dereferencing."]\n' +
          '  A -->|"no — it is always there"| M{"Will I modify it?"}\n' +
          '  M -->|no| CR["const T&amp;<br/>the default for anything<br/>bigger than two words"]\n' +
          '  M -->|yes| MR["T&amp;"]\n' +
          '  Q --> ST{"Do I need to REBIND it later,<br/>or store it in a container?"}\n' +
          '  ST -->|yes| RB["T* — references cannot be reseated,<br/>and std::vector&lt;T&amp;&gt; does not compile"]\n' +
          '  CR --> W["and never let it outlive the referent —<br/>that is the one failure mode a reference<br/>does not protect you from"]\n' +
          '  MR --> W\n' +
          '  style CR fill:#1a3329,stroke:#4ade80\n' +
          '  style MR fill:#1a3329,stroke:#4ade80\n' +
          '  style RP fill:#3d2f14,stroke:#fb923c\n' +
          '  style SM fill:#1a2744,stroke:#5b9cf6\n' +
          '  style W fill:#3b1a1a,stroke:#f87171'
        }
      />

      <p>
        The two hard constraints that push you to a pointer are worth seeing concretely, because they
        come up constantly and the error messages are not helpful. You cannot store references in a
        container:
      </p>

      <CodeBlock language="cpp" title="refvec.cpp">
{`#include <vector>
int main() {
    std::vector<int&> v1;      // does not compile
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -c refvec.cpp: 12 errors, 141 lines of diagnostic">
{`In file included from refvec.cpp:1:
In file included from .../c++/v1/vector:314:
In file included from .../c++/v1/__vector/vector.h:36:
.../c++/v1/__memory/allocator.h:85:76: error:
      'allocate' declared as a pointer to a reference of type 'int &'
   85 |   ..._LIBCPP_HIDE_FROM_ABI _LIBCPP_CONSTEXPR_SINCE_CXX20 _Tp* allocate(...
      |                                                             ^
                                      [...11 more errors, all inside libc++...]`}
      </CodeBlock>

      <p>
        The real message is buried in the third line: <code>&apos;allocate&apos; declared as a
        pointer to a reference</code>. You cannot have a pointer to a reference, because a reference
        has no address of its own — which is where this lesson started.{' '}
        <code>std::vector&lt;T&gt;</code> needs <code>T*</code> internally, so{' '}
        <code>T = int&amp;</code> is structurally impossible.
      </p>
      <p>
        The standard workaround, when you genuinely want a collection of aliases, is{' '}
        <code>std::reference_wrapper</code> — a value type that holds a pointer and converts back to
        a reference on demand:
      </p>

      <CodeBlock language="cpp" title="refvec2.cpp">
{`#include <vector>
#include <functional>
#include <print>
int main() {
    int a = 1, b = 2;
    std::vector<std::reference_wrapper<int>> v{a, b};
    v[0].get() = 99;
    std::println("a = {}  b = {}", a, b);
    std::println("sizeof(reference_wrapper<int>) = {}", sizeof(std::reference_wrapper<int>));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 refvec2.cpp && ./refvec2">
{`a = 99  b = 2
sizeof(reference_wrapper<int>) = 8`}
      </CodeBlock>

      <p>
        Eight bytes — it is a pointer, with a type that promises it is never null. Honest in most
        cases, but note it does nothing about lifetime: a <code>reference_wrapper</code> to a dead
        object is exactly as dangling as a reference to one.
      </p>

      <InfoBox variant="info" title="The Java and Node translation table">
        <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0.5rem 0' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
              <th style={headStyle}>Java / JS</th>
              <th style={headStyle}>Closest C++</th>
              <th style={headStyle}>What differs</th>
            </tr>
          </thead>
          <tbody>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>User u = other;</code></td>
              <td style={cellStyle}><code>User&amp; u = other;</code></td>
              <td style={cellStyle}>C++ needs the <code>&amp;</code>, or it copies</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}>a method parameter</td>
              <td style={cellStyle}><code>T&amp;</code> / <code>const T&amp;</code></td>
              <td style={cellStyle}>C++&apos;s default is a copy, not an alias</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>null</code> / <code>undefined</code></td>
              <td style={cellStyle}><code>nullptr</code> or{' '}
                <code>std::optional&lt;T&gt;</code></td>
              <td style={cellStyle}>a C++ reference cannot be null at all</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>u = someOther;</code> (reassigning the handle)</td>
              <td style={cellStyle}><code>p = &amp;someOther;</code></td>
              <td style={cellStyle}>only pointers rebind; references never do</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>List&lt;User&gt;</code></td>
              <td style={cellStyle}><code>std::vector&lt;User&gt;</code></td>
              <td style={cellStyle}>N contiguous Users, not N pointers to N heap objects</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}><code>final User u</code></td>
              <td style={cellStyle}><code>User* const p</code></td>
              <td style={cellStyle}>the handle is locked, the object is not</td>
            </tr>
            <tr style={rowStyle}>
              <td style={cellStyle}>an immutable view of an object</td>
              <td style={cellStyle}><code>const User&amp;</code></td>
              <td style={cellStyle}>Java has no equivalent; this is checked by the compiler</td>
            </tr>
          </tbody>
        </table>
        <p>
          The last row is the one to notice. <code>const T&amp;</code> gives you something Java
          cannot express: a view of an object that is guaranteed, at compile time, not to be mutated
          through that view. Java approximates it with defensive copies or wrapper classes that throw
          at runtime.
        </p>
      </InfoBox>

      <h2>Null Versus Dangling</h2>
      <p>
        Here is the argument that should change how you write signatures. A pointer has two failure
        modes and a reference has one — but the reference&apos;s single failure mode is far worse
        than either of the pointer&apos;s.
      </p>
      <p>
        <strong>A null pointer is a value you can test for.</strong>{' '}
        <strong>A dangling reference is not a value at all — it is a name bound to memory that no
        longer holds what it claims to.</strong> There is no check you can write. There is no
        comparison that distinguishes a good reference from a dangling one.
      </p>

      <CodeBlock language="cpp" title="nd3.cpp">
{`#include <cstdio>

struct Account { long balance = 1000; int id = 7; };

// A null pointer: checkable, and crashes loudly if you forget to check.
Account* find_null(bool found) { return found ? new Account{} : nullptr; }

// A dangling reference: NOT checkable, and does not crash.
Account& find_dangling() {
    Account local{};
    Account& ref = local;      // name it, then return the name
    return ref;                // a reference to a dead stack object
}

int main() {
    std::printf("--- the null pointer ---\\n");
    Account* p = find_null(false);
    if (!p) std::printf("p is null; checked, handled, no crash\\n");

    std::printf("--- the dangling reference ---\\n");
    Account& r = find_dangling();
    // There is NO check you can write here. r is not null; it is a
    // valid-looking reference to memory that no longer holds an Account.
    std::printf("r.balance = %ld\\n", r.balance);
    std::printf("r.id      = %d\\n", r.id);
    std::printf("survived, exiting 0\\n");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 nd3.cpp && ./nd3 (identical across three runs)">
{`nd3.cpp:11:12: warning: reference to stack memory associated with local
      variable 'local' returned [-Wreturn-stack-address]
   11 |     return ref;                // a reference to a dead stack object
      |            ^~~
nd3.cpp:10:14: note: binding reference variable 'ref' here
1 warning generated.

--- the null pointer ---
p is null; checked, handled, no crash
--- the dangling reference ---
r.balance = 8286978304
r.id      = -302956288
survived, exiting 0
(exit 0)`}
      </CodeBlock>

      <p>
        One warning, no error, and a program that <strong>ran to completion and exited 0</strong>{' '}
        while reporting a bank balance of 8,286,978,304. If that number went into a ledger, nothing
        anywhere would have objected.
      </p>
      <p>
        And the <code>-O0</code> build is worse, not better. The same source at{' '}
        <code>-O0</code> prints <code>r.balance = 1000</code> — the correct, plausible, entirely
        accidental value, because the dead stack slot happened not to have been reused yet. (Its{' '}
        <code>r.id</code> varies from run to run; the balance did not, across three runs.) So your
        debug build shows the right answer and your release build shows garbage, which is the exact
        failure pattern <a href="/cpp/intro">the intro lesson</a> opened with.
      </p>
      <p>
        Compare the null pointer&apos;s failure mode. Dereference one without checking:
      </p>

      <CodeBlock language="text" title="Real output — dereferencing a null pointer, -O0">
{`$ ./nullderef
about to dereference a null pointer
$ echo $?
139`}
      </CodeBlock>

      <p>
        Exit 139 is 128 + 11, and signal 11 is <strong>SIGSEGV</strong>. The process died
        immediately, at the offending instruction, reproducibly, with a core location your debugger
        will point straight at. That is the <em>good</em> outcome. &quot;It crashed&quot; is a bug
        report you can act on in a minute; &quot;the balances are occasionally wrong in
        production&quot; is a week.
      </p>

      <FlowChart
        title="Null versus dangling: which failure would you rather have?"
        chart={
          'graph TD\n' +
          '  START["A function hands you a way<br/>to reach an object that is not there."] --> SPLIT{"Which kind?"}\n' +
          '  SPLIT -->|"a NULL POINTER"| NP["T* p = nullptr"]\n' +
          '  SPLIT -->|"a DANGLING REFERENCE"| DR["T&amp; r = &lt;dead stack slot&gt;"]\n' +
          '  NP --> NP1["There is a CHECK you can write:<br/>if (!p) { ... }"]\n' +
          '  NP1 --> NP2["Forget the check and you get<br/>SIGSEGV — exit 139, immediately,<br/>at the exact line"]\n' +
          '  NP2 --> NP3["Loud. Reproducible.<br/>Debuggable in sixty seconds."]\n' +
          '  DR --> DR1["There is NO check.<br/>r is not null. It looks valid.<br/>r != nullptr does not compile."]\n' +
          '  DR1 --> DR2["Reads succeed and return<br/>whatever is in that memory now"]\n' +
          '  DR2 --> DR3["Verified: balance printed 1000 at -O0<br/>and 8286978304 at -O2.<br/>Exit status 0 in both."]\n' +
          '  DR3 --> DR4["Silent. Optimisation-dependent.<br/>Wrong answer, successful process."]\n' +
          '  NP3 --> FIX1["Prevention: std::optional,<br/>or a reference if absence<br/>is not a real case"]\n' +
          '  DR4 --> FIX2["Prevention: -Wreturn-stack-address<br/>caught THIS one.<br/>-fsanitize=address caught it at runtime.<br/>Neither catches the general case."]\n' +
          '  style NP3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style DR4 fill:#3b1a1a,stroke:#f87171\n' +
          '  style FIX1 fill:#1a3329,stroke:#4ade80\n' +
          '  style FIX2 fill:#1a3329,stroke:#4ade80'
        }
      />

      <InfoBox variant="danger" title="The sanitizer is the only general-purpose detector">
        <p>
          <code>-Wreturn-stack-address</code> caught this particular shape because the capture and
          the escape were in the same function. The general case — a reference stored in a member, a
          pointer handed across three layers, a <code>string_view</code> into a container that later
          reallocates — is not statically detectable, and the warning goes quiet. AddressSanitizer
          does catch it, at runtime, on paths you actually execute:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O1 -fsanitize=address nd2.cpp && ./nd2a">
{`==98000==ERROR: AddressSanitizer: stack-use-after-scope on address
  0x00016d5aa778 at pc 0x000102854db0
READ of size 8 at 0x00016d5aa778 thread T0
    #0 0x000102854dac in main+0x254
Address 0x00016d5aa778 is located in stack of thread T0 at offset 56 in frame
    #0 0x000102854b64 in main+0xc
  This frame has 1 object(s):
    [32, 64) 'local' <== Memory access at offset 56 is inside this variable
SUMMARY: AddressSanitizer: stack-use-after-scope in main+0x254`}
        </CodeBlock>
        <p>
          <code>stack-use-after-scope</code>, the exact address, the exact frame, and the variable{' '}
          named. This is the third lesson in this phase to end at the same place, so it is worth
          stating as a rule rather than advice: <strong>there is no debug build you should be
          running without <code>-fsanitize=address,undefined</code>.</strong> Not because C++ is
          dangerous in the abstract, but because the specific class of bug it has — references and
          views outliving what they refer to — is invisible to every other tool you have.
        </p>
      </InfoBox>

      <h3>So what does this change about how you write code?</h3>
      <ul>
        <li>
          <strong>Never return a reference or pointer to a local.</strong> Return by value. The
          compiler will elide the copy in almost every case — that mechanism gets measured in the
          memory phase — so there is no performance argument for the dangerous version.
        </li>
        <li>
          <strong>Returning a reference to a member is fine</strong>, as long as the caller does not
          outlive the object. This is what <code>operator[]</code>, <code>.front()</code> and{' '}
          <code>.at()</code> all do. It is also why holding a reference to{' '}
          <code>v[0]</code> across a <code>push_back</code> is a use-after-free: the vector may
          reallocate out from under you.
        </li>
        <li>
          <strong>Use <code>std::optional&lt;T&gt;</code> for &quot;maybe absent,&quot; not a
          nullable pointer.</strong> It is a value, so there is nothing to dangle, and it cannot be
          dereferenced without you acknowledging the empty case.
        </li>
        <li>
          <strong>A raw pointer in a modern codebase means &quot;non-owning and possibly
          null.&quot;</strong> That is now its only job. Ownership is expressed with{' '}
          <code>unique_ptr</code> and <code>shared_ptr</code>; a bare <code>T*</code> in a signature
          should never imply that the callee frees anything.
        </li>
      </ul>

      <h2><code>nullptr</code>, <code>NULL</code> and <code>0</code></h2>
      <p>
        Three spellings of &quot;no pointer,&quot; one of which is correct. If you are returning to
        C++ from before 2011 you are probably still typing <code>NULL</code>.
      </p>

      <CodeBlock language="cpp" title="np2.cpp">
{`#include <print>
#include <cstddef>
#include <type_traits>

void f(int)   { std::println("f(int)"); }
void f(char*) { std::println("f(char*)"); }

int main() {
    f(0);                  // the integer 0
    f(nullptr);            // the null pointer constant

    std::println("decltype(NULL) is integral     : {}", std::is_integral_v<decltype(NULL)>);
    std::println("sizeof(NULL)                   = {}", sizeof(NULL));
    std::println("decltype(nullptr) is nullptr_t : {}",
                 std::is_same_v<decltype(nullptr), std::nullptr_t>);
    std::println("sizeof(nullptr)                = {}", sizeof(nullptr));

    int* p = nullptr;
    std::println("p == nullptr                   = {}", p == nullptr);
    std::println("bool(p)                        = {}", bool(p));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 np2.cpp && ./np2">
{`f(int)
f(char*)
decltype(NULL) is integral     : true
sizeof(NULL)                   = 8
decltype(nullptr) is nullptr_t : true
sizeof(nullptr)                = 8
p == nullptr                   = true
bool(p)                        = false`}
      </CodeBlock>

      <p>
        Notice what is missing from that file: a call to <code>f(NULL)</code>. It was in the first
        draft, and it does not compile:
      </p>

      <CodeBlock language="text" title="Real output — adding f(NULL); to the above">
{`np.cpp:11:5: error: call to 'f' is ambiguous
   11 |     f(NULL);               // ?
      |     ^
np.cpp:5:6: note: candidate function
    5 | void f(int)   { std::println("f(int)"); }
      |      ^
np.cpp:6:6: note: candidate function
    6 | void f(char*) { std::println("f(char*)"); }
      |      ^
1 error generated.`}
      </CodeBlock>

      <p>
        That is worth understanding, because it is not what the folklore says. The usual story is
        that <code>NULL</code> is <code>0</code> and therefore picks the <code>int</code> overload.
        On this toolchain <code>NULL</code> expands to <code>__null</code>, a clang/GCC extension — a
        null pointer constant whose type is integral and pointer-sized (hence{' '}
        <code>sizeof(NULL) == 8</code> and <code>is_integral_v</code> being <code>true</code>).
        Being convertible to both <code>int</code> and <code>char*</code> at the same rank, it is{' '}
        <strong>ambiguous</strong>. Which is better than silently picking wrongly, and still a reason
        not to use it.
      </p>
      <p>
        <code>nullptr</code> has its own type, <code>std::nullptr_t</code>, which converts to any
        pointer type and to no integer type:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -c npbad.cpp">
{`npbad.cpp:3:9: error: cannot initialize a variable of type 'int' with an
      rvalue of type 'std::nullptr_t'
    3 |     int n = nullptr;          // (1) no conversion to an integer
      |         ^   ~~~~~~~
npbad.cpp:4:13: warning: implicit conversion of NULL constant to 'int'
      [-Wnull-conversion]
    4 |     int m = NULL;             // (2) ...but NULL is an integer, s...
      |         ~   ^~~~
      |             0
npbad.cpp:5:23: error: invalid operands to binary expression
      ('std::nullptr_t' and 'std::nullptr_t')
    5 |     bool b = (nullptr < nullptr);  // (3) no ordering
      |               ~~~~~~~ ^ ~~~~~~~
1 warning and 2 errors generated.`}
      </CodeBlock>

      <p>
        <code>int n = nullptr</code> is an error; <code>int m = NULL</code> is merely a warning. That
        difference is the whole case for <code>nullptr</code>: it is a distinct type, so the compiler
        can tell the difference between a number and the absence of a pointer. Use it exclusively.{' '}
        <code>NULL</code> is a legacy macro and <code>0</code> as a pointer is a historical accident.
      </p>

      <h2>Array-To-Pointer Decay</h2>
      <p>
        One last inherited-from-C behaviour, and the reason <code>std::span</code> exists.{' '}
        <strong>An array used in almost any expression silently becomes a pointer to its first
        element, and the length is discarded.</strong>
      </p>
      <p>
        The consequence that gets people: a function parameter written{' '}
        <code>int arr[5]</code> is not an array parameter. There is no such thing. The compiler
        rewrites it to <code>int* arr</code> and throws the <code>5</code> away without comment.
      </p>

      <CodeBlock language="cpp" title="decay.cpp">
{`#include <print>
#include <span>
#include <array>
#include <vector>

// What you WROTE. What the compiler SEES: int*. The 5 is discarded.
int sum_wrong(int arr[5]) {
    int n = sizeof(arr) / sizeof(arr[0]);   // the classic bug
    int t = 0;
    for (int i = 0; i < n; ++i) t += arr[i];
    return t;
}

// The C fix: pass the length separately and hope the caller gets it right.
int sum_c(const int* arr, std::size_t n) {
    int t = 0; for (std::size_t i = 0; i < n; ++i) t += arr[i]; return t;
}

// The C++20 fix: a span carries the length with it.
int sum_span(std::span<const int> xs) {
    int t = 0; for (int x : xs) t += x; return t;
}

// A reference to an array does NOT decay -- the size is part of the type.
template <std::size_t N>
int sum_ref(const int (&arr)[N]) {
    int t = 0; for (std::size_t i = 0; i < N; ++i) t += arr[i]; return t;
}

int main() {
    int a[5] = {1, 2, 3, 4, 5};

    std::println("sizeof(a)              = {}   <- in main, a is still an array", sizeof(a));
    std::println("sizeof(&a[0])          = {}   <- a pointer", sizeof(&a[0]));
    std::println("");
    std::println("sum_wrong(a)           = {}   <- WRONG: sizeof(arr) was 8", sum_wrong(a));
    std::println("sum_c(a, 5)            = {}", sum_c(a, 5));
    std::println("sum_span(a)            = {}   <- length carried automatically", sum_span(a));
    std::println("sum_ref(a)             = {}   <- N deduced as 5", sum_ref(a));
    std::println("");

    std::array<int, 3> arr{10, 20, 30};
    std::vector<int> v{100, 200};
    std::println("sum_span(std::array)   = {}", sum_span(arr));
    std::println("sum_span(std::vector)  = {}", sum_span(v));

    // Decay also loses the type's rank: a 2D array decays to a pointer-to-row.
    int m[2][3] = {{1,2,3},{4,5,6}};
    std::println("");
    std::println("sizeof(m)              = {}", sizeof(m));
    std::println("sizeof(m[0])           = {}", sizeof(m[0]));
    std::println("sizeof(*m)             = {}   <- *m is a row, int[3]", sizeof(*m));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 decay.cpp && ./decay">
{`sizeof(a)              = 20   <- in main, a is still an array
sizeof(&a[0])          = 8   <- a pointer

sum_wrong(a)           = 3   <- WRONG: sizeof(arr) was 8
sum_c(a, 5)            = 15
sum_span(a)            = 15   <- length carried automatically
sum_ref(a)             = 15   <- N deduced as 5

sum_span(std::array)   = 60
sum_span(std::vector)  = 300

sizeof(m)              = 24
sizeof(m[0])           = 12
sizeof(*m)             = 12   <- *m is a row, int[3]`}
      </CodeBlock>

      <p>
        <code>sum_wrong(a)</code> returned <strong>3</strong>. It computed{' '}
        <code>sizeof(int*) / sizeof(int)</code> = 8 / 4 = 2, looped twice, and added 1 + 2. The
        length written in the parameter list was a comment the compiler ignored.
      </p>
      <p>
        This one clang does diagnose, and the diagnostics are excellent — two warnings naming exactly
        the problem:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -fmessage-length=74 -c decay.cpp">
{`decay.cpp:8:19: warning: sizeof on array function parameter will return
      size of 'int *' instead of 'int[5]' [-Wsizeof-array-argument]
    8 |     int n = sizeof(arr) / sizeof(arr[0]);   // the classic bug
      |                   ^
decay.cpp:7:19: note: declared here
    7 | int sum_wrong(int arr[5]) {
      |                   ^
decay.cpp:8:25: warning: 'sizeof (arr)' will return the size of the
      pointer, not the array itself [-Wsizeof-pointer-div]
    8 |     int n = sizeof(arr) / sizeof(arr[0]);   // the classic bug
      |             ~~~~~~~~~~~ ^
decay.cpp:7:19: note: pointer 'arr' declared here`}
      </CodeBlock>

      <p>
        Two more things in that output are worth naming. <code>sum_ref</code> works because{' '}
        <strong>a reference to an array does not decay</strong> — the bound is part of the type, so{' '}
        <code>N</code> is deduced as 5 and the function cannot be called with the wrong size. That
        is a real technique for fixed-size buffers, if an ugly one.
      </p>
      <p>
        And <code>std::span</code> is the answer for everything else. One parameter type accepted a
        raw <code>int[5]</code>, a <code>std::array&lt;int,3&gt;</code>, and a{' '}
        <code>std::vector&lt;int&gt;</code>, carrying the correct length in each case, with no
        template and no allocation. It is 16 bytes — a pointer and a size, like{' '}
        <code>string_view</code> — and it is non-owning, so{' '}
        <strong>every lifetime caveat from the <code>string_view</code> section of{' '}
        <a href="/cpp/types">the types lesson</a> applies to it identically.</strong> A{' '}
        <code>span</code> into a <code>vector</code> is invalidated by anything that reallocates the
        vector.
      </p>

      <InfoBox variant="tip" title="The modern rule for arrays">
        <p>
          <strong>Do not use raw arrays.</strong> Use <code>std::array&lt;T, N&gt;</code> when the
          size is a compile-time constant and <code>std::vector&lt;T&gt;</code> when it is not. Both
          know their own size, both work with range-for and the algorithms, and neither decays.{' '}
          <code>std::array</code> has identical layout and performance to a raw array — it is a
          zero-cost wrapper in the literal sense of{' '}
          <a href="/cpp/intro">the intro lesson</a>&apos;s measurement.
        </p>
        <p>
          <strong>Take <code>std::span&lt;const T&gt;</code> for read-only parameters</strong> and{' '}
          <code>std::span&lt;T&gt;</code> for mutable ones. It accepts every contiguous container,
          costs nothing, and makes the <code>(pointer, length)</code> parameter pair obsolete. Before
          C++20 you wrote a template over the container type; now you do not have to.
        </p>
      </InfoBox>

      <h2>One Thing C++23 Fixed While This Lesson Was Being Written</h2>
      <p>
        The dangling-reference demonstration above went through a draft that would not compile, and
        the reason is a genuine improvement worth knowing about. The obvious way to write that
        function is:
      </p>

      <CodeBlock language="cpp" title="The direct version">
{`Account& find_dangling() {
    Account local{};
    return local;      // the obvious spelling
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same file, four standard levels, counting errors">
{`$ for s in c++11 c++17 c++20 c++23; do printf "%-8s " $s; \\
      clang++ -std=$s -fsyntax-only nd.cpp 2>&1 | grep -c "error:"; done
c++11    0
c++17    0
c++20    0
c++23    1

$ clang++ -std=c++23 -fsyntax-only -fmessage-length=74 nd.cpp
nd.cpp:12:12: error: non-const lvalue reference to type 'Account' cannot
      bind to a temporary of type 'Account'
   12 |     return local;              // returns a reference to a dead st...
      |            ^~~~~
1 error generated.`}
      </CodeBlock>

      <p>
        <strong>Zero errors at C++11, C++17 and C++20; a hard error at C++23.</strong> The cause is
        C++23&apos;s simplified implicit-move rules, which make a returned local name an{' '}
        <em>rvalue</em> in a return statement. An rvalue cannot bind to a
        non-<code>const</code> lvalue reference, so the whole function becomes ill-formed rather than
        merely warned about. A rule introduced for move semantics turned a warning into an error,
        for free.
      </p>
      <p>
        Which is also why the demonstration had to be written as{' '}
        <code>Account&amp; ref = local; return ref;</code> — naming the reference first routes around
        the new rule. That workaround is a bug in two lines rather than one, and if you ever find
        yourself writing it, stop.
      </p>
      <p>
        The practical takeaway is small but real: <strong>raising your <code>-std=</code> flag turns
        some of this category of bug into compile errors.</strong> It is the cheapest safety
        improvement available to a C++ codebase, and it costs a line in a Makefile.
      </p>

      <h2>The Residue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Instinct</th>
            <th style={headStyle}>What this lesson showed</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>b = a</code> makes a second name&quot;</td>
            <td style={cellStyle}>Four <code>false</code>s: different objects, different string
              buffer, different vector buffer.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A reference is a safe pointer&quot;</td>
            <td style={cellStyle}>It is an alias with no address of its own.{' '}
              <code>&amp;r == &amp;x</code> is <code>true</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>r = y</code> points <code>r</code> at
              <code> y</code>&quot;</td>
            <td style={cellStyle}>It assigns <code>y</code>&apos;s value into{' '}
              <code>x</code>. References never rebind.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>const int*</code> and <code>int* const</code> are
              much the same&quot;</td>
            <td style={cellStyle}>Opposite. One locks the pointee, the other locks the pointer.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;References are safer than pointers&quot;</td>
            <td style={cellStyle}>Safer against null, worse against dangling. Null gives you
              SIGSEGV at exit 139; dangling gave a wrong balance and exit 0.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>NULL</code> is fine&quot;</td>
            <td style={cellStyle}><code>f(NULL)</code> was{' '}
              <code>error: call to &apos;f&apos; is ambiguous</code>. It expands to{' '}
              <code>__null</code>, which is integral.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>void f(int arr[5])</code> takes an array of 5&quot;</td>
            <td style={cellStyle}>It takes an <code>int*</code>. The function returned 3 instead of
              15.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads: The Memory Phase</h2>
      <p>
        This is the end of Phase 1. The model you now have is:
      </p>
      <ul>
        <li>
          <strong>From <a href="/cpp/compiling">the build lesson</a>:</strong> each{' '}
          <code>.cpp</code> is compiled in isolation and reconciled afterwards by a linker with no
          type system. Headers, the ODR and both error families follow from that.
        </li>
        <li>
          <strong>From <a href="/cpp/types">the types lesson</a>:</strong> sizes are
          implementation-defined, signed/unsigned mixing silently computes wrong answers,{' '}
          <code>auto</code> can copy, and there are three things called a string with three different
          ownership stories.
        </li>
        <li>
          <strong>From <a href="/cpp/functions">the functions lesson</a>:</strong> parameter form is
          a performance decision measured in hundreds of allocations, overload resolution is a
          ranking algorithm, <code>inline</code> is about linkage, and a reference capture that
          outlives its scope is invisible without a sanitizer.
        </li>
        <li>
          <strong>From this lesson:</strong> objects are values, references are aliases, pointers
          are objects holding addresses, and the dangerous failure is not null — it is a name bound
          to memory that has moved on.
        </li>
      </ul>
      <p>
        Every one of those has pointed at the same unanswered question. <em>How long does an object
        live, and who decides?</em> The copies happen because objects have lifetimes. The dangling
        reference happens because a lifetime ended while a name still pointed at it. The{' '}
        <code>string_view</code> and <code>span</code> caveats are lifetime caveats. The destructor
        in <a href="/cpp/intro">the intro</a> that ran at a closing brace was the answer peeking
        through.
      </p>
      <p>
        Phase 2 answers it properly:
      </p>
      <ul>
        <li>
          <strong>The memory model</strong> — stack versus heap, what each actually costs, automatic
          versus dynamic versus static storage duration, and the precise rules for when a destructor
          runs.
        </li>
        <li>
          <strong>RAII in full</strong> — the mechanism that makes &quot;no garbage collector&quot;
          a feature rather than a burden, applied to memory, files, sockets, locks and transactions.
        </li>
        <li>
          <strong>Smart pointers</strong> — <code>unique_ptr</code> for single ownership,{' '}
          <code>shared_ptr</code> for shared, <code>weak_ptr</code> for the cycles and the
          dangling-callback problem this lesson left open, and why you should essentially never write{' '}
          <code>new</code> or <code>delete</code> again.
        </li>
        <li>
          <strong>Move semantics</strong> — what <code>std::move</code> does, why it exists, and how
          the expensive copies you saw measured in these two lessons become cheap transfers.
        </li>
      </ul>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, and it is worth doing rather than reading. Take the dangling-reference
          program from this lesson, build it three ways —{' '}
          <code>-O0</code>, <code>-O2</code>, and <code>-O1 -fsanitize=address</code> — and watch it
          give you three different stories about the same source file. A plausible wrong answer, an
          implausible wrong answer, and the truth.
        </p>
        <p>
          That experience is the thing to carry into the memory phase. In every other language you
          work in, &quot;the program ran and produced a number&quot; is evidence. In C++ it is not
          evidence until you know the object you read was still alive when you read it — and that is
          a question about <em>lifetime</em>, which is exactly where{' '}
          <a href="/cpp/memory-model">the next lesson</a> starts.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default References;
