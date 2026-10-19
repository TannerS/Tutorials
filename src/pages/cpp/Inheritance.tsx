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

function Inheritance() {
  return (
    <LessonLayout
      title="Inheritance, Virtual Functions & vtables"
      sectionId="cpp"
      lessonIndex={11}
      prev={{ path: '/cpp/classes', label: 'Classes, Constructors & the Rule of Zero/Three/Five' }}
      next={{ path: '/cpp/templates', label: 'Templates & Generic Programming' }}
    >
      <p>
        This is the lesson where knowing Java well is a liability. Not a gap — a liability. The
        syntax is close enough that transliterated Java compiles, and four of the defaults are
        inverted, so the transliteration <em>runs</em> and gives wrong answers. Every mistake on
        this page compiles clean; most of them run without crashing.
      </p>
      <p>
        The four inversions, stated flatly so you can check them against your instincts before
        reading the measurements:
      </p>
      <ul>
        <li>
          <strong>Methods are not virtual.</strong> In Java every non-<code>final</code>,
          non-<code>private</code>, non-<code>static</code> method is virtual and you cannot turn
          that off. In C++ nothing is virtual unless you write <code>virtual</code>, and a derived
          function with the same name as a non-virtual base function is not an override at all —
          it is a <em>different function that hides the base name</em>. The demonstration below
          prints the area of a circle of radius 2 as <code>0</code>.
        </li>
        <li>
          <strong><code>override</code> is not <code>@Override</code>.</strong> Java&apos;s
          annotation is a nicety; the overriding already happened because every method is virtual
          and Java matches on name plus erased parameter types. C++&apos;s <code>override</code>
          catches a signature mismatch that would otherwise silently produce a <em>new</em> virtual
          function nobody calls. Three realistic mistakes are measured here; <code>override</code>
          turns all three into compile errors.
        </li>
        <li>
          <strong><code>delete base_ptr</code> is undefined behaviour unless the base destructor is
          virtual.</strong> Java has no destructors and no <code>delete</code>, so there is no
          instinct to carry over at all. Below, a derived destructor simply never runs and a
          connection is never closed — and in a second variant the program aborts with exit 133.
        </li>
        <li>
          <strong>Objects can be cut in half.</strong> Object slicing is the direct consequence of
          the value semantics <a href="/cpp/references">phase 1</a> and{' '}
          <a href="/cpp/classes">the last lesson</a> established. A <code>Manager</code> assigned
          into an <code>Employee</code> variable loses its bonus <em>and</em> its identity, and
          nothing — not <code>-Wall</code>, not <code>-Wextra</code>, not{' '}
          <code>-Weverything</code> — says a word.
        </li>
      </ul>
      <p>
        Two features follow that Java has no analogue for at all: <strong>private and protected
        inheritance</strong>, and <strong>multiple inheritance</strong> with the diamond problem it
        creates. Both are covered, both briefly, because both are rarely the right tool.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++, <code>-std=c++23</code>. Every output
          block, warning, error, <code>sizeof</code>, assembly listing and timing on this page was
          captured from a real compile or run on this machine. The Java comparison is a real run on{' '}
          <strong>JDK 26.0.1</strong>.
        </p>
        <p>
          Two of the findings here were not what this lesson was originally going to claim. The
          &quot;forgotten <code>virtual</code>&quot; case turned out to be partly caught by{' '}
          <code>-Wall</code> — but only in the mismatched-signature forms, not the one that matters
          most. And the virtual-destructor bug turned out to behave differently depending on whether
          the base class is abstract: one variant leaks silently, the other traps at runtime. Both
          are written up as measured rather than as expected.
        </p>
      </InfoBox>

      <h2>Non-Virtual By Default</h2>
      <p>
        Here is a Java class hierarchy transliterated into C++ by somebody who assumed the defaults
        match, next to the same hierarchy with <code>virtual</code> added. Three keywords apart.
      </p>

      <CodeBlock language="cpp" title="nonvirt.cpp">
{`#include <print>
#include <string>

// --- The Java shape, transliterated. Looks right. Is wrong. ---
struct Shape {
    std::string name;
    explicit Shape(std::string n) : name(std::move(n)) {}
    double area() const { return 0.0; }                      // no 'virtual'
    void describe() const {                                  // no 'virtual'
        std::println("  Shape::describe   {} area={}", name, area());
    }
};

struct Circle : Shape {
    double r;
    explicit Circle(double radius) : Shape("circle"), r(radius) {}
    double area() const { return 3.14159265358979 * r * r; }
    void describe() const {
        std::println("  Circle::describe  {} area={}", name, area());
    }
};

// --- The same thing with 'virtual'. Three keywords different. ---
struct VShape {
    std::string name;
    explicit VShape(std::string n) : name(std::move(n)) {}
    virtual double area() const { return 0.0; }
    virtual void describe() const {
        std::println("  VShape::describe   {} area={}", name, area());
    }
    virtual ~VShape() = default;
};

struct VCircle : VShape {
    double r;
    explicit VCircle(double radius) : VShape("circle"), r(radius) {}
    double area() const override { return 3.14159265358979 * r * r; }
    void describe() const override {
        std::println("  VCircle::describe {} area={}", name, area());
    }
};

void report(const Shape& s)   { s.describe(); }
void vreport(const VShape& s) { s.describe(); }

int main() {
    Circle c{2.0};
    VCircle vc{2.0};

    std::println("1. direct call on the object (static type is the derived type):");
    c.describe();
    vc.describe();

    std::println("2. through a base REFERENCE:");
    report(c);
    vreport(vc);

    std::println("3. through a base POINTER:");
    const Shape* sp = &c;
    const VShape* vsp = &vc;
    sp->describe();
    vsp->describe();

    std::println("4. the area() call that happens INSIDE the base's describe():");
    std::println("   non-virtual sp->area() = {}", sp->area());
    std::println("   virtual    vsp->area() = {}", vsp->area());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 nonvirt.cpp && ./nonvirt">
{`1. direct call on the object (static type is the derived type):
  Circle::describe  circle area=12.56637061435916
  VCircle::describe circle area=12.56637061435916
2. through a base REFERENCE:
  Shape::describe   circle area=0
  VCircle::describe circle area=12.56637061435916
3. through a base POINTER:
  Shape::describe   circle area=0
  VCircle::describe circle area=12.56637061435916
4. the area() call that happens INSIDE the base's describe():
   non-virtual sp->area() = 0
   virtual    vsp->area() = 12.56637061435916`}
      </CodeBlock>

      <p>
        <strong><code>area=0</code> for a circle of radius 2.</strong> Not a crash, not a warning —
        an answer that is quietly, specifically wrong, and only when the object is reached through a
        base reference or pointer, which is to say only in the polymorphic code the hierarchy exists
        for. Called directly on a <code>Circle</code>, line 1, it is right. That asymmetry is what
        makes it survive unit tests: the test constructs a <code>Circle</code> and calls{' '}
        <code>c.describe()</code>, which works.
      </p>
      <p>
        Section 4 is the part that compounds. <code>Shape::describe</code> calls{' '}
        <code>area()</code> on itself, and <em>inside a non-virtual base function the derived
        override does not exist</em>. So even if you only ever got <code>describe</code> wrong,
        every call it makes is also pinned to the base. One missing <code>virtual</code> at the top
        of a hierarchy switches off polymorphism for everything underneath it.
      </p>
      <p>
        The mechanism has a name worth knowing, because it is what you will see in error messages
        and standardese: the derived <code>describe</code> does not override anything, it{' '}
        <strong>hides</strong> the base name. Name lookup finds <code>Shape::describe</code> when
        the static type is <code>Shape</code> and <code>Circle::describe</code> when the static type
        is <code>Circle</code>, and that is the end of the story. There is no runtime involved.
      </p>

      <InfoBox variant="warning" title="How much of this does -Wall catch? Measured: part of it, and not the part you need">
        <p>
          The compile above produced <strong>zero warnings</strong> — not with{' '}
          <code>-Wall -Wextra</code>, and not with <code>-Wshadow -Weffc++</code> added either. When
          the derived signature <em>matches</em> the base exactly, clang has nothing to say, because
          a class that hides a non-virtual base function is perfectly legal and sometimes
          deliberate.
        </p>
        <p>
          It does speak up when the signatures <em>differ</em>, which is the next section. So the
          practical reading is backwards from what you would hope:{' '}
          <strong>the compiler helps you when your mistake is sloppy and stays silent when your
          mistake is tidy.</strong> There is no flag that turns on &quot;Java mode&quot;; the only
          defence is to write <code>virtual</code> in the base and <code>override</code> in every
          derived class, and let <code>override</code> fail loudly when the base is not virtual.
        </p>
      </InfoBox>

      <h2><code>override</code> Is Not Politeness</h2>
      <p>
        Java&apos;s <code>@Override</code> is a documentation aid that occasionally catches a typo.
        C++&apos;s <code>override</code> is load-bearing, and the reason is that{' '}
        <strong>C++ matches overrides on the exact signature</strong> — parameter types,{' '}
        <code>const</code>-qualification, ref-qualification, all of it. Get any part of it wrong and
        you have not overridden anything; you have added a <em>new</em> function that hides the old
        name, and the virtual call keeps going to the base.
      </p>
      <p>
        Three realistic mistakes, none of them stupid, all of them things a careful person types on
        a Friday:
      </p>

      <CodeBlock language="cpp" title="ovr1.cpp — no 'override' anywhere">
{`#include <print>
#include <string>

struct Renderer {
    virtual void draw(const std::string& layer) const {
        std::println("  Renderer::draw   (BASE) layer={}", layer);
    }
    virtual void flush() const { std::println("  Renderer::flush  (BASE)"); }
    virtual ~Renderer() = default;
};

struct GpuRenderer : Renderer {
    // Three honest mistakes. No 'override' anywhere, so all three compile.
    void draw(std::string layer) const {        // by value, not by const&
        std::println("  GpuRenderer::draw  layer={}", layer);
    }
    void flush() { std::println("  GpuRenderer::flush"); }   // forgot const
    void draw_all() const { std::println("  GpuRenderer::draw_all"); }  // wrong name
};

void render(const Renderer& r) {
    r.draw("background");
    r.flush();
}

int main() {
    GpuRenderer g;
    std::println("1. called through a Renderer& (the polymorphic path):");
    render(g);
    std::println("2. called directly on the GpuRenderer:");
    g.draw("background");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ovr1.cpp && ./ovr1">
{`ovr1.cpp:14:10: warning: 'GpuRenderer::draw' hides overloaded virtual function [-Woverloaded-virtual]
   14 |     void draw(std::string layer) const {        // by value, not by const&
      |          ^
ovr1.cpp:5:18: note: hidden overloaded virtual function 'Renderer::draw' declared here: type mismatch at 1st parameter ('const std::string &' (aka 'const basic_string<char> &') vs 'std::string' (aka 'basic_string<char>'))
    5 |     virtual void draw(const std::string& layer) const {
      |                  ^
ovr1.cpp:17:10: warning: 'GpuRenderer::flush' hides overloaded virtual function [-Woverloaded-virtual]
   17 |     void flush() { std::println("  GpuRenderer::flush"); }   // forgot const
      |          ^
ovr1.cpp:8:18: note: hidden overloaded virtual function 'Renderer::flush' declared here: different qualifiers ('const' vs unqualified)
    8 |     virtual void flush() const { std::println("  Renderer::flush  (BASE)"); }
      |                  ^
2 warnings generated.

1. called through a Renderer& (the polymorphic path):
  Renderer::draw   (BASE) layer=background
  Renderer::flush  (BASE)
2. called directly on the GpuRenderer:
  GpuRenderer::draw  layer=background`}
      </CodeBlock>

      <p>
        The program compiled and ran. Through a <code>Renderer&amp;</code> — the only path that
        matters — <strong>both base implementations ran</strong>, and the{' '}
        <code>GpuRenderer</code> code was dead. Called directly on the concrete type it works, which
        again is how this ships.
      </p>
      <p>
        Credit where it is due: <code>-Wall</code> caught two of the three, via{' '}
        <code>-Woverloaded-virtual</code>, and its notes are genuinely good — it names the exact
        divergence (<code>type mismatch at 1st parameter</code>,{' '}
        <code>different qualifiers (&apos;const&apos; vs unqualified)</code>). Checked rather than
        assumed, because the grouping is not obvious:
      </p>

      <CodeBlock language="text" title="Real output — count of -Woverloaded-virtual warnings by flag">
{`$ clang++ -std=c++23         -fsyntax-only ovr1.cpp   -> 0
$ clang++ -std=c++23 -Wall   -fsyntax-only ovr1.cpp   -> 2
$ clang++ -std=c++23 -Wextra -fsyntax-only ovr1.cpp   -> 0`}
      </CodeBlock>

      <p>
        Two of three, and nothing at all about <code>draw_all</code> — the misspelled name — because
        a derived class is allowed to add functions. Now add <code>override</code> to exactly the
        same three declarations:
      </p>

      <CodeBlock language="cpp" title="ovr2.cpp — identical mistakes, 'override' added">
{`#include <string>

struct Renderer {
    virtual void draw(const std::string& layer) const;
    virtual void flush() const;
    virtual ~Renderer() = default;
};

struct GpuRenderer : Renderer {
    void draw(std::string layer) const override;   // by value, not by const&
    void flush() override;                         // forgot const
    void draw_all() const override;                // wrong name
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only ovr2.cpp">
{`ovr2.cpp:10:40: error: non-virtual member function marked 'override' hides
      virtual member function
   10 |     void draw(std::string layer) const override;   // by value, no...
      |                                        ^
ovr2.cpp:4:18: note: hidden overloaded virtual function 'Renderer::draw'
      declared here: type mismatch at 1st parameter ('const std::string &'
      (aka 'const basic_string<char> &') vs 'std::string' (aka
      'basic_string<char>'))
    4 |     virtual void draw(const std::string& layer) const;
      |                  ^
ovr2.cpp:11:18: error: non-virtual member function marked 'override' hides
      virtual member function
   11 |     void flush() override;                         // forgot const
      |                  ^
ovr2.cpp:5:18: note: hidden overloaded virtual function 'Renderer::flush'
      declared here: different qualifiers ('const' vs unqualified)
    5 |     virtual void flush() const;
      |                  ^
ovr2.cpp:12:27: error: only virtual member functions can be marked
      'override'
   12 |     void draw_all() const override;                // wrong name
      |                           ^~~~~~~~
3 errors generated.`}
      </CodeBlock>

      <p>
        <strong>Three mistakes, three errors, zero running programs.</strong> The third message is
        the one to memorise, because it is the same message you get for the{' '}
        <code>nonvirt.cpp</code> bug from the previous section:
      </p>
      <p>
        <code>error: only virtual member functions can be marked &apos;override&apos;</code>
      </p>
      <p>
        That is <code>override</code> telling you the base function you think you are overriding is
        not virtual. It does not matter whether the cause is a misspelled name, a wrong signature,
        or a missing <code>virtual</code> in a base class you did not write — all of them land
        here. Writing <code>override</code> on every derived virtual function converts the entire
        silent-wrong-answer family from this lesson into compile errors, which is why{' '}
        <a href="/cpp/classes">the last lesson</a> paired it with <code>explicit</code> as a keyword
        whose default is wrong.
      </p>

      <InfoBox variant="tip" title="You do not need to repeat 'virtual' in the derived class">
        <p>
          An override is virtual whether or not you say so — virtualness is inherited. So{' '}
          <code>virtual void f() override;</code> is redundant, and the C++ Core Guidelines
          (C.128) say to pick exactly one of the three keywords per declaration:
        </p>
        <ul>
          <li><strong><code>virtual</code></strong> — first declaration, in the base.</li>
          <li><strong><code>override</code></strong> — any derived class that re-implements it.</li>
          <li><strong><code>final</code></strong> — a derived class that re-implements it and wants
            to stop anyone going further.</li>
        </ul>
        <p>
          <code>final</code> implies <code>override</code>, so <code>void f() final;</code> gets you
          the same signature checking. Writing <code>final override</code> is legal and compiles,
          and does no harm beyond the noise.
        </p>
      </InfoBox>

      <h2><code>final</code>, And The One Place A Virtual Call Disappears</h2>
      <p>
        <code>final</code> has two spellings with two different jobs. On a <em>class</em> it means
        nothing may derive from this; on a <em>virtual function</em> it means nothing may override
        this again. Java has both (<code>final class</code>, <code>final method</code>) and they
        mean the same things.
      </p>
      <p>
        The part Java does not have is what it buys you. Both forms give the optimiser a proof that
        it knows the dynamic type, and the proof is worth looking at in the generated code:
      </p>

      <CodeBlock language="cpp" title="finalv.cpp">
{`struct Base {
    virtual int cost() const { return 1; }
    virtual ~Base() = default;
};

// 'final' on the CLASS: nothing may derive from Sealed.
struct Sealed final : Base {
    int cost() const override { return 42; }
};

// 'final' on the FUNCTION: Tuned may be derived from, but nobody may
// override cost() again.
struct Tuned : Base {
    int cost() const final override { return 7; }
};

int via_base(const Base* b)     { return b->cost(); }   // must dispatch
int via_sealed(const Sealed* s) { return s->cost(); }   // class is final
int via_tuned(const Tuned* t)   { return t->cost(); }   // function is final`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S finalv.cpp (directives stripped)">
{`__Z8via_basePK4Base:                    ; @_Z8via_basePK4Base
; %bb.0:
	ldr	x8, [x0]
	ldr	x1, [x8]
	br	x1
                                        ; -- End function
__Z10via_sealedPK6Sealed:               ; @_Z10via_sealedPK6Sealed
; %bb.0:
	mov	w0, #42                         ; =0x2a
	ret
                                        ; -- End function
__Z9via_tunedPK5Tuned:                  ; @_Z9via_tunedPK5Tuned
; %bb.0:
	mov	w0, #7                          ; =0x7
	ret
                                        ; -- End function`}
      </CodeBlock>

      <p>
        That is the whole mechanism of virtual dispatch in three instructions, and the whole value
        of <code>final</code> in two.
      </p>
      <ul>
        <li>
          <code>via_base</code>: <code>ldr x8, [x0]</code> loads the <strong>vtable pointer</strong>{' '}
          from the first 8 bytes of the object. <code>ldr x1, [x8]</code> loads slot 0 of that
          vtable — the address of <code>cost</code>. <code>br x1</code> branches to it. Two
          dependent loads and an indirect branch, and critically, <strong>the function body cannot
          be inlined</strong>, because at compile time nobody knows which body it is.
        </li>
        <li>
          <code>via_sealed</code> and <code>via_tuned</code>: <code>mov</code> of a constant, and{' '}
          <code>ret</code>. The call is gone. The vtable is gone. The function was devirtualised,
          then inlined, then constant-folded, and what is left is the answer.
        </li>
      </ul>
      <p>
        So <strong><code>final</code> on your leaf classes is a free optimisation</strong> wherever
        the static type is known, and costs nothing. The errors it produces are clear:
      </p>

      <CodeBlock language="cpp" title="final2.cpp">
{`struct Base { virtual int cost() const; virtual ~Base() = default; };
struct Sealed final : Base { int cost() const override; };
struct Tuned : Base { int cost() const final; };

struct TooFar : Sealed { };                       // derives from a final class
struct Retuned : Tuned { int cost() const override; };  // overrides a final fn`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only final2.cpp">
{`final2.cpp:5:17: error: base 'Sealed' is marked 'final'
    5 | struct TooFar : Sealed { };                       // derives from ...
      |                 ^
final2.cpp:2:8: note: 'Sealed' declared here
    2 | struct Sealed final : Base { int cost() const override; };
      |        ^      ~~~~~
final2.cpp:6:30: error: declaration of 'cost' overrides a 'final' function
    6 | struct Retuned : Tuned { int cost() const override; };  // overrid...
      |                              ^
final2.cpp:3:27: note: overridden virtual function is here
    3 | struct Tuned : Base { int cost() const final; };
      |                           ^
2 errors generated.`}
      </CodeBlock>

      <h2>vtables, And What A Virtual Call Actually Costs</h2>
      <p>
        You have now seen the dispatch in assembly, so the data structure is easy to describe. For
        every class with at least one virtual function the compiler emits one <strong>vtable</strong>{' '}
        — a static array of function pointers, one per virtual function, shared by every object of
        that dynamic type — and gives every object a hidden <strong>vptr</strong> member pointing at
        it. That vptr is the only per-object cost, and it is worth measuring, because the number is
        bigger than people expect for small types.
      </p>

      <CodeBlock language="cpp" title="vsize.cpp">
{`#include <cstdint>
#include <print>
#include <type_traits>

struct Empty {};
struct Plain       { std::int32_t a; };                 // no virtuals
struct OneVirtual  { std::int32_t a; virtual void f(); virtual ~OneVirtual() = default; };
struct TenVirtual  { std::int32_t a;
                     virtual void f1(); virtual void f2(); virtual void f3();
                     virtual void f4(); virtual void f5(); virtual void f6();
                     virtual void f7(); virtual void f8(); virtual void f9();
                     virtual void f10(); virtual ~TenVirtual() = default; };
struct DtorOnly    { std::int32_t a; virtual ~DtorOnly() = default; };
struct Derived     : OneVirtual { std::int32_t b; void f() override; };
struct NonVirtDeriv : Plain { std::int32_t b; };

// (definitions elided -- they are all empty)

template <class T>
void row(const char* n) {
    std::println("{:<14} sizeof={:<3} alignof={:<3} polymorphic={:<5} trivially_copyable={}",
                 n, sizeof(T), alignof(T), std::is_polymorphic_v<T>,
                 std::is_trivially_copyable_v<T>);
}

int main() {
    std::println("sizeof(void*) on this target = {}", sizeof(void*));
    std::println("");
    row<Empty>("Empty");            row<Plain>("Plain");
    row<NonVirtDeriv>("NonVirtDeriv");  row<DtorOnly>("DtorOnly");
    row<OneVirtual>("OneVirtual");  row<TenVirtual>("TenVirtual");
    row<Derived>("Derived");
    std::println("");

    // Where does the vptr live, and is it shared?
    OneVirtual a, b;
    Derived    d;
    auto vptr = [](const void* p) { return *reinterpret_cast<const std::uintptr_t*>(p); };
    std::println("vptr stored at offset 0 of the object:");
    std::println("  &a      = {}", static_cast<const void*>(&a));
    std::println("  &a.a    = {}", static_cast<const void*>(&a.a));
    std::println("  vptr(a) == vptr(b)  (same dynamic type) : {}", vptr(&a) == vptr(&b));
    std::println("  vptr(a) == vptr(d)  (different type)    : {}", vptr(&a) == vptr(&d));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 vsize.cpp && ./vsize (the two stack addresses differ per run; the 8-byte gap does not)">
{`sizeof(void*) on this target = 8

Empty          sizeof=1   alignof=1   polymorphic=false trivially_copyable=true
Plain          sizeof=4   alignof=4   polymorphic=false trivially_copyable=true
NonVirtDeriv   sizeof=8   alignof=4   polymorphic=false trivially_copyable=true
DtorOnly       sizeof=16  alignof=8   polymorphic=true  trivially_copyable=false
OneVirtual     sizeof=16  alignof=8   polymorphic=true  trivially_copyable=false
TenVirtual     sizeof=16  alignof=8   polymorphic=true  trivially_copyable=false
Derived        sizeof=16  alignof=8   polymorphic=true  trivially_copyable=false

vptr stored at offset 0 of the object:
  &a      = 0x16d07e788
  &a.a    = 0x16d07e790
  vptr(a) == vptr(b)  (same dynamic type) : true
  vptr(a) == vptr(d)  (different type)    : false`}
      </CodeBlock>

      <p>
        Read the <code>Plain</code> and <code>OneVirtual</code> rows together. Same members — one{' '}
        <code>int32_t</code>. <strong><code>4</code> bytes versus <code>16</code> bytes: four times
        the size for adding one virtual function.</strong> The vptr itself is only 8 bytes; the jump
        to 16 is 8 bytes of vptr, 4 bytes of <code>int</code>, and then 4 bytes of tail padding,
        because <code>alignof</code> went from 4 to 8 as soon as the object contained a pointer.
      </p>
      <p>
        Five more things that table settles:
      </p>
      <ul>
        <li>
          <strong>It is one vptr, not one per function.</strong> <code>TenVirtual</code> has eleven
          virtual functions including the destructor and is still 16 bytes. The vtable grows; the
          object does not.
        </li>
        <li>
          <strong>A virtual destructor alone is enough.</strong> <code>DtorOnly</code> declares no
          other virtual function and pays the full 12 bytes. There is no &quot;cheap&quot; way to be
          polymorphic.
        </li>
        <li>
          <strong>The vptr is at offset 0 and is 8 bytes.</strong>{' '}
          <code>&amp;a.a</code> is exactly <code>&amp;a + 8</code> (<code>...788</code> →{' '}
          <code>...790</code>). That is an Itanium-ABI layout choice, not a language rule, but it is
          what every mainstream implementation does.
        </li>
        <li>
          <strong>It is shared per dynamic type.</strong> Two <code>OneVirtual</code> objects hold
          the same vptr value; a <code>Derived</code> holds a different one. The vtable is one
          static object in the binary, which is why vtable cost is per-type, not per-object.
        </li>
        <li>
          <strong>Polymorphism costs you triviality.</strong>{' '}
          <code>is_trivially_copyable_v</code> flipped to <code>false</code>. That is the same
          property <a href="/cpp/classes">the last lesson</a> showed <code>= default</code>
          {' '}preserving — and it is gone for good here, because a <code>memcpy</code> of a
          polymorphic object would copy the vptr, which is exactly what you must not do. No
          container can relocate your objects with <code>memcpy</code> any more.
        </li>
      </ul>
      <p>
        Non-virtual inheritance, by contrast, is free: <code>NonVirtDeriv</code> is two{' '}
        <code>int32_t</code>s in 8 bytes, the same as a struct with two <code>int</code>s.{' '}
        <strong>Inheritance does not cost anything. <em>Virtual</em> costs something.</strong>
      </p>

      <FlowChart
        title="What actually happens at p->describe(), and what it costs"
        chart={
          'graph TD\n' +
          '  S["p-&gt;describe();<br/>where p has static type Base*"] --> Q{"Is Base::describe<br/>declared virtual?"}\n' +
          '  Q -->|no| NV["STATIC dispatch.<br/>The compiler picks the function from the<br/>STATIC type of p — Base — at compile time.<br/>It never looks at the object at all."]\n' +
          '  NV --> NV2["Measured: Shape::describe ran on a Circle<br/>and printed area=0 for radius 2."]\n' +
          '  NV --> NV3["A same-named derived function does not<br/>override. It HIDES the base name."]\n' +
          '  NV3 --> NV4["Diagnostics measured:<br/>signatures DIFFER -&gt; -Wall catches it<br/>(-Woverloaded-virtual)<br/>signatures MATCH -&gt; total silence, even<br/>under -Weffc++ and -Wshadow"]\n' +
          '  Q -->|yes| V["DYNAMIC dispatch, through the vtable."]\n' +
          '  V --> V1["1. ldr x8, [x0]<br/>load the vptr from offset 0 of *p"]\n' +
          '  V1 --> V2["2. ldr x1, [x8]<br/>load describe()s slot from that vtable"]\n' +
          '  V2 --> V3["3. br x1<br/>indirect branch — and NO INLINING,<br/>because the body is unknown here"]\n' +
          '  V3 --> COST["Measured over 2,000,000 calls at -O2:<br/>virtual via base pointer 0.67–0.83 ns<br/>non-virtual direct call 0.49–0.52 ns<br/>-&gt; roughly 0.2 ns of dispatch overhead.<br/>The branch is cheap. The lost inlining<br/>and the pointer chasing are the cost."]\n' +
          '  V --> SIZE["Per-object cost, measured:<br/>struct with one int32 = 4 bytes<br/>+ one virtual function = 16 bytes<br/>+ ten more virtual functions = still 16<br/>and is_trivially_copyable -&gt; false"]\n' +
          '  Q -->|"yes, and the static type is<br/>final, or the function is final"| F["DEVIRTUALISED.<br/>Measured: via_sealed compiled to<br/>mov w0, #42 / ret.<br/>The call, the vtable load and the<br/>function body are all gone."]\n' +
          '  style NV fill:#3d2f14,stroke:#fb923c\n' +
          '  style NV2 fill:#3b1a1a,stroke:#f87171\n' +
          '  style NV4 fill:#3b1a1a,stroke:#f87171\n' +
          '  style F fill:#1a3329,stroke:#4ade80\n' +
          '  style V1 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style V2 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style V3 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style COST fill:#1a2744,stroke:#5b9cf6\n' +
          '  style SIZE fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h3>The measurement, so you can stop guessing</h3>
      <p>
        &quot;Virtual calls are slow&quot; is received wisdom that is worth replacing with a number.
        Four loops over two million elements, each summing an area: base pointers with two
        interleaved dynamic types (so the branch predictor cannot collapse it), a tagged struct with
        a <code>switch</code>, a <code>std::variant</code> visited with{' '}
        <code>std::visit</code>, and a single concrete type called non-virtually as the floor.
      </p>

      <CodeBlock language="cpp" title="vcost.cpp — the four loops being timed (full harness: best of 20 runs each)">
{`// 1. classic polymorphism: base pointers, mixed dynamic types
struct Shape { virtual double area() const = 0; virtual ~Shape() = default; };
struct Sq : Shape { double s; double area() const override { return s * s; } };
struct Tr : Shape { double b, h; double area() const override { return 0.5 * b * h; } };

// 2. a tagged value type, stored contiguously, dispatched by switch
struct Tagged {
    enum Kind : std::uint8_t { SQUARE, TRIANGLE } kind;
    double a, b;
    double area() const {
        switch (kind) {
            case SQUARE:   return a * a;
            case TRIANGLE: return 0.5 * a * b;
        }
        return 0.0;
    }
};

// 3. std::variant over a closed set, visited
struct VSq { double s; double area() const { return s * s; } };
struct VTr { double b, h; double area() const { return 0.5 * b * h; } };
using VShape = std::variant<VSq, VTr>;

// 4. one concrete type, non-virtual, stored by value -- the floor
struct SqOnly { double s; double area() const { return s * s; } };

double t_poly   = best_ms([&] { double s = 0; for (auto& p : poly)   s += p->area(); return s; }, c1);
double t_tagged = best_ms([&] { double s = 0; for (auto& t : tagged) s += t.area();   return s; }, c2);
double t_var    = best_ms([&] { double s = 0; for (auto& v : vars)
                                  s += std::visit([](const auto& sh) { return sh.area(); }, v);
                                return s; }, c4);
double t_plain  = best_ms([&] { double s = 0; for (auto& p : plain)  s += p.area();   return s; }, c3);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 vcost.cpp && ./vcost">
{`2000000 elements, best of 20 runs
  virtual call via base pointer (mixed types):   1.348 ms   sum=31999972
  tag + switch, contiguous values            :   1.184 ms   sum=31999972
  std::variant + std::visit, contiguous      :   1.333 ms   sum=31999972
  non-virtual call, one concrete type        :   0.983 ms   sum=39999965
  ns per element: virtual 0.674 / switch 0.592 / variant 0.667 / direct 0.492`}
      </CodeBlock>

      <p>
        Across eight runs of that binary the numbers landed in these bands:{' '}
        <strong>virtual 0.67–0.83 ns, switch 0.59–0.68 ns, variant 0.666–0.667 ns, direct
        0.49–0.52 ns</strong> per element. The virtual arm is the noisiest, which itself tells you
        something — it is the one doing dependent loads through scattered heap allocations.
      </p>
      <p>
        So the honest summary is: <strong>a virtual call costs on the order of 0.2 nanoseconds more
        than a direct one on this machine, which is a handful of cycles.</strong> If your function
        body does any real work, the dispatch is free. What actually costs you, in rough order of
        size:
      </p>
      <ol>
        <li>
          <strong>Lost inlining.</strong> <code>via_sealed</code> above collapsed to a constant;{' '}
          <code>via_base</code> could not even inline a one-line body. For tiny functions called in
          a hot loop, that is the entire difference.
        </li>
        <li>
          <strong>Lost memory locality.</strong> Polymorphism almost always means{' '}
          <code>vector&lt;unique_ptr&lt;Base&gt;&gt;</code>, which means every element is a separate
          heap allocation reached through a pointer. The contiguous arms above beat it without
          needing to win on dispatch at all.
        </li>
        <li>
          <strong>The indirect branch itself.</strong> Last, and smallest.
        </li>
      </ol>
      <p>
        Note also that <code>std::variant</code> was not faster than virtual dispatch here — it was
        the same, 0.667 against 0.674 in that run. It wins on other grounds (value semantics, no
        heap, no destructor rule to get wrong, exhaustiveness), not on speed. Beware the benchmark
        that claims otherwise without showing you the loop.
      </p>

      <h2>The Virtual Destructor Rule</h2>
      <p>
        This is the one that is genuinely undefined behaviour rather than merely a wrong answer.
      </p>
      <p>
        <strong>If you delete an object through a pointer to a base class, and that base class
        destructor is not virtual, the behaviour is undefined.</strong> Not implementation-defined,
        not &quot;leaks a bit&quot; — undefined. In practice what happens is that{' '}
        <code>delete</code> is a non-virtual call, so it runs the destructor it can see at compile
        time, which is the base&apos;s, and the derived class&apos;s destructor never executes.
      </p>

      <CodeBlock language="cpp" title="vdtor2.cpp">
{`#include <cstdio>
#include <print>
#include <string>

int open_connections = 0;

struct Connection {
    std::string dsn;
    explicit Connection(std::string d) : dsn(std::move(d)) {
        ++open_connections;
        std::println("    + connection to {} opened", dsn);
    }
    ~Connection() {
        --open_connections;
        std::println("    - connection to {} closed", dsn);
    }
};

// --- A: base has a virtual function, a BODY (so it is not abstract), and a
//        NON-virtual destructor.
struct TaskA {
    virtual void run() { std::println("  TaskA::run()"); }
    ~TaskA() { std::println("  ~TaskA()   (non-virtual)"); }
};

struct DbTaskA : TaskA {
    Connection conn{"postgres://a"};
    void run() override { std::println("  DbTaskA::run()"); }
    ~DbTaskA() { std::println("  ~DbTaskA()  <-- does this ever print?"); }
};

// --- B: the same thing with \`virtual ~TaskB()\`. One keyword.
struct TaskB {
    virtual void run() { std::println("  TaskB::run()"); }
    virtual ~TaskB() { std::println("  ~TaskB()   (virtual)"); }
};

struct DbTaskB : TaskB {
    Connection conn{"postgres://b"};
    void run() override { std::println("  DbTaskB::run()"); }
    ~DbTaskB() override { std::println("  ~DbTaskB()"); }
};

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);   // so nothing is lost to a crash

    std::println("--- A: non-virtual base destructor ---");
    {
        TaskA* t = new DbTaskA{};
        t->run();
        delete t;                       // UNDEFINED BEHAVIOUR
    }
    std::println("open_connections after A: {}", open_connections);

    std::println("--- B: virtual base destructor ---");
    {
        TaskB* t = new DbTaskB{};
        t->run();
        delete t;
    }
    std::println("open_connections after B: {}", open_connections);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 vdtor2.cpp && ./vdtor2">
{`vdtor2.cpp:51:9: warning: delete called on non-final 'TaskA' that has virtual functions but non-virtual destructor [-Wdelete-non-abstract-non-virtual-dtor]
   51 |         delete t;                       // UNDEFINED BEHAVIOUR
      |         ^
1 warning generated.

--- A: non-virtual base destructor ---
    + connection to postgres://a opened
  DbTaskA::run()
  ~TaskA()   (non-virtual)
open_connections after A: 1
--- B: virtual base destructor ---
    + connection to postgres://b opened
  DbTaskB::run()
  ~DbTaskB()
    - connection to postgres://b closed
  ~TaskB()   (virtual)
open_connections after B: 1`}
      </CodeBlock>

      <p>
        Case A, line by line. The connection opened. <code>run()</code> dispatched correctly to{' '}
        <code>DbTaskA::run</code> — <em>function</em> dispatch was fine, because{' '}
        <code>run</code> is virtual. Then <code>delete t</code> ran{' '}
        <code>~TaskA()</code> and <strong><code>~DbTaskA()</code> never printed</strong>. The{' '}
        <code>Connection</code> member was never destroyed, so <code>- connection ... closed</code>{' '}
        never printed either, and <code>open_connections</code> is stuck at <code>1</code>.
      </p>
      <p>
        Case B is the same program with <code>virtual</code> on one destructor. The full chain runs
        in the right order — derived destructor, then members, then base — and the connection
        closes. <code>open_connections</code> still reads <code>1</code> at the end because case
        A&apos;s leak never went away; that final <code>1</code> is case A&apos;s, not case
        B&apos;s.
      </p>
      <p>
        This is the <a href="/cpp/raii">RAII</a> guarantee being broken from underneath. Everything
        that lesson promised — the destructor runs on every path out of a scope, so release is
        automatic — assumes the right destructor runs. A non-virtual base destructor is the one
        construct that silently substitutes a different one, and every{' '}
        <code>std::string</code>, <code>std::vector</code>, file handle, lock and smart pointer a
        derived class owns leaks along with it.
      </p>

      <InfoBox variant="danger" title="And when the base class is abstract, this machine traps instead">
        <p>
          The first version of this demonstration had <code>TaskA::run()</code> declared{' '}
          <code>= 0</code>, making <code>TaskA</code> abstract. That version does not leak quietly.
          It aborts:
        </p>
        <CodeBlock language="text" title="Real output — the same program with 'virtual void run() = 0;' in TaskA (same unbuffered stdout)">
{`$ clang++ -std=c++23 -Wall -Wextra -O2 vdtor.cpp -o vdtor
vdtor.cpp:52:9: warning: delete called on 'TaskA' that is abstract but has non-virtual destructor [-Wdelete-abstract-non-virtual-dtor]
   52 |         delete t;                       // UNDEFINED BEHAVIOUR
      |         ^
1 warning generated.

$ ./vdtor
--- A: non-virtual base destructor ---
    + connection to postgres://a opened
  DbTaskA::run()
$ echo $?
133`}
        </CodeBlock>
        <p>
          It stops dead at the <code>delete</code>. No <code>~TaskA()</code>, no{' '}
          <code>open_connections after A:</code> line, no case B at all. Without the{' '}
          <code>setvbuf</code> call there is no output whatsoever, because the buffered{' '}
          <code>stdout</code> is lost with the process — which is worth knowing the first time you
          debug a crash and conclude your program never started.
        </p>
        <p>
          Exit <code>133</code> is <code>128 + 5</code>, SIGTRAP. Under <code>lldb</code> the stop
          reason is <code>EXC_BREAKPOINT</code> at the first line of <code>~TaskA()</code>, and{' '}
          <code>clang++ -O2 -S</code> on that file contains <code>brk #0x1</code> — the compiler
          has replaced the provably-undefined path with a deliberate trap. It can prove it, because
          an abstract class can never be the dynamic type of a real object, so{' '}
          <code>delete</code> through a <code>TaskA*</code> with a non-virtual destructor is{' '}
          <em>always</em> wrong, never merely usually.
        </p>
        <p>
          Two lessons. First, this is what undefined behaviour means in practice: the same bug
          leaks silently in one shape and hard-aborts in another, and which one you get depends on
          what the compiler happened to be able to prove. Second, if you ever see a bare{' '}
          <code>SIGTRAP</code> with no message at the top of a destructor, this is a candidate.
        </p>
      </InfoBox>

      <InfoBox variant="warning" title="-Wall warns at the delete site. The flag you actually want warns at the class.">
        <p>
          <code>-Wall</code> caught both variants, which is better than this lesson expected. But
          look at <em>where</em> it caught them — at line 51, the <code>delete</code>. In real code
          the base class lives in a header, the <code>delete</code> lives in somebody else&apos;s
          translation unit, and the person who gets the warning is not the person who can fix it.
        </p>
        <CodeBlock language="text" title="Real output — adding -Wnon-virtual-dtor to the same file">
{`$ clang++ -std=c++23 -Wall -Wextra -fsyntax-only vdtor2.cpp
vdtor2.cpp:51:9: warning: delete called on non-final 'TaskA' that has virtual functions but non-virtual destructor [-Wdelete-non-abstract-non-virtual-dtor]

$ clang++ -std=c++23 -Wall -Wextra -Wnon-virtual-dtor -fsyntax-only vdtor2.cpp
vdtor2.cpp:23:5: warning: 'TaskA' has virtual functions but non-virtual destructor [-Wnon-virtual-dtor]
vdtor2.cpp:29:5: warning: 'DbTaskA' has virtual functions but non-virtual destructor [-Wnon-virtual-dtor]
vdtor2.cpp:51:9: warning: delete called on non-final 'TaskA' that has virtual functions but non-virtual destructor [-Wdelete-non-abstract-non-virtual-dtor]`}
        </CodeBlock>
        <p>
          <strong><code>-Wnon-virtual-dtor</code> is in neither <code>-Wall</code> nor{' '}
          <code>-Wextra</code></strong> — it is opt-in, and it fires at lines 23 and 29, the class
          declarations. That is the one to add to your build. It is the only diagnostic on this page
          that points at the place where the fix goes.
        </p>
      </InfoBox>

      <p>
        The rule, in the form worth memorising, and the two exemptions:
      </p>
      <ul>
        <li>
          <strong>A class with any virtual function needs a <code>virtual</code> destructor.</strong>{' '}
          <code>virtual ~Base() = default;</code> is the whole cost. Note from the{' '}
          <code>vsize.cpp</code> table that it is <em>free</em> once the class is already
          polymorphic — the vptr is already there.
        </li>
        <li>
          <strong>Or make the destructor <code>protected</code> and non-virtual.</strong> That
          removes the hazard by removing the operation, which is the right answer for a mixin or a
          CRTP base that is never owned polymorphically. Measured:
          <CodeBlock language="text" title="Real output — delete through a Base* whose destructor is protected">
{`protdtor.cpp:10:12: error: calling a protected destructor of class 'Mixin'
   10 |     delete m;                      // should not compile
      |            ^
protdtor.cpp:4:5: note: declared protected here
    4 |     ~Mixin() = default;            // protected, NOT virtual
      |     ^
1 warning and 1 error generated.`}
          </CodeBlock>
          A hard error rather than undefined behaviour. Only derived classes can destroy
          themselves.
        </li>
        <li>
          <strong>Or mark the class <code>final</code> and never derive from it.</strong> No
          derived destructor exists to skip. Note the warning text itself says{' '}
          <code>delete called on <strong>non-final</strong> &apos;TaskA&apos;</code>, so the
          compiler agrees.
        </li>
      </ul>

      <InfoBox variant="tip" title="unique_ptr will not save you here. shared_ptr will — measured.">
        <p>
          A detail worth carrying from <a href="/cpp/smart-pointers">the smart-pointers lesson</a>:{' '}
          <code>std::unique_ptr&lt;Base&gt;</code> has its deleter baked into its <em>type</em>,
          so it reproduces this bug exactly. <code>std::shared_ptr&lt;Base&gt;</code> captures a
          type-erased deleter at construction from the <em>concrete</em> type, so it does not. That
          sounds like folklore, so here it is run on the same <code>Base</code> with a non-virtual
          destructor:
        </p>
        <CodeBlock language="cpp" title="ptrdtor.cpp">
{`int live = 0;
struct Base { virtual void f() {} ~Base() { std::println("  ~Base()"); } };
struct Derived : Base {
    Derived()  { ++live; }
    ~Derived() { --live; std::println("  ~Derived()  (live now {})", live); }
};

int main() {
    { std::unique_ptr<Base> p = std::make_unique<Derived>(); }
    std::println("  live = {}", live);
    { std::shared_ptr<Base> p = std::make_shared<Derived>(); }
    std::println("  live = {}", live);
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ptrdtor.cpp && ./ptrdtor">
{`unique_ptr<Base> = make_unique<Derived>():
  ~Base()
  live = 1
shared_ptr<Base> = make_shared<Derived>():
  ~Derived()  (live now 1)
  ~Base()
  live = 1`}
        </CodeBlock>
        <p>
          The <code>unique_ptr</code> block ran <code>~Base()</code> only, leaving{' '}
          <code>live == 1</code>. The <code>shared_ptr</code> block ran{' '}
          <code>~Derived()</code> then <code>~Base()</code>, taking <code>live</code> from{' '}
          <code>2</code> back down to the <code>1</code> the first leak left behind. Different
          behaviour from the same base class.
        </p>
        <p>
          Worth noting that <code>-Wall</code> did catch both, but the diagnostic came out{' '}
          <em>inside libc++</em> — <code>unique_ptr.h:75:5: delete called on non-final
          &apos;Derived&apos;</code> followed by five <code>in instantiation of</code> notes before
          it reaches your line. That is the template error-message problem{' '}
          <a href="/cpp/templates">the next lesson</a> is about, arriving early.
        </p>
        <p>
          And this is not a reason to reach for <code>shared_ptr</code>. Write the virtual
          destructor.
        </p>
      </InfoBox>

      <h2>Virtual Dispatch Does Not Work During Construction Or Destruction</h2>
      <p>
        This one is an inversion in your favour, which makes it easy to get wrong in the other
        direction: C++ does the safe thing here and Java does not. Calling a virtual function from a
        constructor resolves to the <em>currently constructed</em> class, not the most-derived one.
      </p>

      <CodeBlock language="cpp" title="ctorvirt.cpp">
{`#include <print>
#include <string>

struct Base {
    Base() {
        std::println("  Base()  about to call virtual describe():");
        describe();                       // which one runs?
    }
    virtual void describe() const { std::println("    Base::describe()"); }
    virtual ~Base() {
        std::println("  ~Base() about to call virtual describe():");
        describe();                       // and which one here?
    }
};

struct Derived : Base {
    std::string tag = "derived-state";
    void describe() const override {
        std::println("    Derived::describe()  tag=\\"{}\\"  (len {})", tag, tag.size());
    }
};

int main() {
    std::println("Derived d;");
    Derived d;
    std::println("--- fully constructed, now a normal call ---");
    d.describe();
    std::println("--- scope exit ---");
}`}
      </CodeBlock>

      <CodeBlock language="java" title="CtorVirt.java — the same program">
{`class Base {
    Base() {
        System.out.println("  Base()  about to call describe():");
        describe();
    }
    void describe() { System.out.println("    Base.describe()"); }
}

class Derived extends Base {
    String tag = "derived-state";
    @Override void describe() {
        System.out.println("    Derived.describe()  tag=\\"" + tag + "\\"  (len "
            + (tag == null ? "NPE" : String.valueOf(tag.length())) + ")");
    }
}

public class CtorVirt {
    public static void main(String[] a) {
        System.out.println("new Derived();");
        Derived d = new Derived();
        System.out.println("--- fully constructed, now a normal call ---");
        d.describe();
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — both programs, same machine (clang++ -std=c++23 -O2 / JDK 26.0.1)">
{`$ ./ctorvirt
Derived d;
  Base()  about to call virtual describe():
    Base::describe()
--- fully constructed, now a normal call ---
    Derived::describe()  tag="derived-state"  (len 13)
--- scope exit ---
  ~Base() about to call virtual describe():
    Base::describe()

$ java CtorVirt.java
new Derived();
  Base()  about to call describe():
    Derived.describe()  tag="null"  (len NPE)
--- fully constructed, now a normal call ---
    Derived.describe()  tag="derived-state"  (len 13)`}
      </CodeBlock>

      <p>
        <strong>C++ ran <code>Base::describe</code>. Java ran{' '}
        <code>Derived.describe</code> and read <code>tag</code> as <code>null</code>.</strong> That
        Java output is the classic &quot;do not call an overridable method from a
        constructor&quot; bug — the subclass override runs before the subclass field initialisers
        do, so it observes a half-built object.
      </p>
      <p>
        C++ cannot do that, by design. The vptr is updated as construction proceeds: while{' '}
        <code>Base</code>&apos;s constructor is running, the object <em>is</em> a{' '}
        <code>Base</code> as far as dispatch is concerned, and it becomes a <code>Derived</code>{' '}
        only when <code>Derived</code>&apos;s constructor begins. Destruction runs the film
        backwards, which is why <code>~Base()</code> also printed{' '}
        <code>Base::describe()</code> — by then the <code>Derived</code> part, including{' '}
        <code>tag</code>, has already been destroyed, and dispatching to it would be a
        use-after-destruction.
      </p>
      <p>
        So the C++ behaviour is strictly safer. The trap is the other one: this is also why{' '}
        <strong>the two-phase-init pattern does not work</strong>. If you write a base constructor
        that calls <code>virtual void init()</code> expecting the derived override to configure
        things, you get the base version, every time, silently. And if the function is{' '}
        <em>pure</em> virtual there is no base version at all:
      </p>

      <CodeBlock language="cpp" title="purector.cpp">
{`#include <cstdio>
#include <print>

struct Base {
    Base() {
        std::println("  Base() calling the pure virtual init():");
        init();                          // UB: there is no override yet
    }
    virtual void init() = 0;
    virtual ~Base() = default;
};

struct Derived : Base {
    void init() override { std::println("    Derived::init()"); }
};

int main() {
    std::setvbuf(stdout, nullptr, _IONBF, 0);
    Derived d;
    (void)d;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 purector.cpp && ./purector">
{`purector.cpp:7:9: warning: call to pure virtual member function 'init' has undefined behavior; overrides of 'init' in subclasses are not available in the constructor of 'Base' [-Wcall-to-pure-virtual-from-ctor-dtor]
    7 |         init();                          // UB: there is no override yet
      |         ^
1 warning generated.

  Base() calling the pure virtual init():
libc++abi: Pure virtual function called!
exit status 134`}
      </CodeBlock>

      <p>
        <code>libc++abi: Pure virtual function called!</code> and exit 134 (SIGABRT). This is the
        one diagnostic in the lesson that is <strong>on by default</strong> — no{' '}
        <code>-Wall</code> needed, measured — and the warning text explains the whole model in one
        clause: <em>overrides of &apos;init&apos; in subclasses are not available in the
        constructor of &apos;Base&apos;</em>.
      </p>
      <p>
        The fix is not a flag. It is to do configuration in the constructor you are actually in, or
        to use a factory function that constructs the object and then calls <code>init()</code> on
        the finished thing.
      </p>

      <h2>Object Slicing</h2>
      <p>
        Java has no analogue for this, not even a distant one, because a Java variable of class type
        is always a reference. In C++ a variable of class type <em>is</em> the object — the thing{' '}
        <a href="/cpp/references">phase 1</a> established and <a href="/cpp/classes">the last
        lesson</a> built on — and copying a derived object into a base-typed destination copies only
        the base-shaped part of it. The rest is discarded, and the result is not merely incomplete:
        it is a different type.
      </p>

      <CodeBlock language="cpp" title="slice.cpp">
{`#include <print>
#include <string>
#include <vector>

struct Employee {
    std::string name;
    explicit Employee(std::string n) : name(std::move(n)) {}
    virtual double pay() const { return 1000.0; }
    virtual std::string role() const { return "Employee"; }
    virtual ~Employee() = default;
};

struct Manager : Employee {
    double bonus;
    Manager(std::string n, double b) : Employee(std::move(n)), bonus(b) {}
    double pay() const override { return 1000.0 + bonus; }
    std::string role() const override { return "Manager"; }
};

// The bug: taking the base BY VALUE.
void printByValue(Employee e) {
    std::println("  byValue    : {:<8} role={:<8} pay={}", e.name, e.role(), e.pay());
}
// The fix: taking the base BY REFERENCE.
void printByRef(const Employee& e) {
    std::println("  byRef      : {:<8} role={:<8} pay={}", e.name, e.role(), e.pay());
}

int main() {
    Manager m{"ada", 500.0};
    std::println("sizeof(Employee)={}  sizeof(Manager)={}", sizeof(Employee), sizeof(Manager));
    std::println("1. the object itself:");
    std::println("  direct     : {:<8} role={:<8} pay={}", m.name, m.role(), m.pay());

    std::println("2. passed to a function:");
    printByValue(m);
    printByRef(m);

    std::println("3. copied into a base-typed variable:");
    Employee e = m;
    std::println("  Employee e = m -> role={} pay={}", e.role(), e.pay());

    std::println("4. stored in a std::vector<Employee>:");
    std::vector<Employee> staff;
    staff.push_back(m);
    staff.emplace_back("bob");
    for (const auto& s : staff)
        std::println("  vector elem: {:<8} role={:<8} pay={}", s.name, s.role(), s.pay());

    std::println("5. assigned THROUGH a base reference (partial assignment):");
    Manager target{"target", 999.0};
    Employee& ref = target;
    ref = Employee{"overwritten"};
    std::println("  target.name={} target.bonus={} target.pay()={}",
                 target.name, target.bonus, target.pay());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 slice.cpp && ./slice">
{`sizeof(Employee)=32  sizeof(Manager)=40
1. the object itself:
  direct     : ada      role=Manager  pay=1500
2. passed to a function:
  byValue    : ada      role=Employee pay=1000
  byRef      : ada      role=Manager  pay=1500
3. copied into a base-typed variable:
  Employee e = m -> role=Employee pay=1000
4. stored in a std::vector<Employee>:
  vector elem: ada      role=Employee pay=1000
  vector elem: bob      role=Employee pay=1000
5. assigned THROUGH a base reference (partial assignment):
  target.name=overwritten target.bonus=999 target.pay()=1999`}
      </CodeBlock>

      <p>
        Four of the five lines are wrong, and the fifth — <code>byRef</code> — is the only one that
        did what the code reads as doing.
      </p>
      <p>
        Cases 2, 3 and 4 are the same event: <code>Employee</code>&apos;s copy constructor ran. That
        constructor is a function compiled with full knowledge of <code>Employee</code> and no
        knowledge of <code>Manager</code>, so it copies 32 bytes of <code>Employee</code>-shaped
        state, and <code>bonus</code> is simply not part of the conversation. The subtler half is
        the vptr: the new object is an <code>Employee</code>, gets{' '}
        <code>Employee</code>&apos;s vptr, and therefore <code>role()</code> and <code>pay()</code>{' '}
        now dispatch to <code>Employee</code>. Virtual dispatch was never broken — it faithfully
        reported the type of the object you actually have.
      </p>
      <p>
        <strong>Case 5 is the one that should make you uncomfortable.</strong>{' '}
        <code>ref = Employee{'{'}"overwritten"{'}'}</code> called{' '}
        <code>Employee::operator=</code> on the <code>Employee</code> prefix of a live{' '}
        <code>Manager</code>. The vptr is <em>not</em> an assignable member, so it was left alone.
        The result is an object that is still a <code>Manager</code>, still dispatches to{' '}
        <code>Manager::pay()</code>, still has <code>bonus == 999</code>, and has had its{' '}
        <code>name</code> replaced: <code>pay() == 1999</code>. A half-overwritten object that
        passes every type check you could apply to it.
      </p>

      <InfoBox variant="danger" title="Nothing warns. Checked under -Weverything.">
        <p>
          Not <code>-Wall</code>, not <code>-Wextra</code>. The full set of warnings{' '}
          <code>-Weverything</code> produced for <code>slice.cpp</code>, deduplicated, was:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Weverything -fsyntax-only slice.cpp (warning flags, sorted, unique)">
{`-Wc++98-compat
-Wdeprecated-copy-with-dtor
-Wmissing-prototypes
-Wpoison-system-directories
-Wweak-vtables`}
        </CodeBlock>
        <p>
          Five flags, all about unrelated things —{' '}
          <code>-Wdeprecated-copy-with-dtor</code> is the rule-of-five family from{' '}
          <a href="/cpp/classes">the last lesson</a>, and the others are style and build noise. Not
          one of them is about slicing. There is no <code>-Wslicing</code> on this compiler, and
          there is nothing to turn on.
        </p>
      </InfoBox>

      <FlowChart
        title="Object slicing: what gets copied, what gets dropped, and what happens to the vptr"
        chart={
          'graph TD\n' +
          '  SRC["A live Manager object<br/>measured: sizeof(Employee)=32,<br/>sizeof(Manager)=40"] --> L["LAYOUT<br/>offset 0: vptr -&gt; Manager vtable<br/>offset 8: name — the Employee part<br/>offset 32: bonus = 500.0"]\n' +
          '  L --> Q{"How is it passed, stored<br/>or assigned?"}\n' +
          '  Q -->|"const Employee&amp; / Employee* /<br/>unique_ptr&lt;Employee&gt;"| REF["No copy happens. The object keeps its<br/>own vptr and all 40 bytes.<br/>Measured: role=Manager pay=1500"]\n' +
          '  Q -->|"Employee — BY VALUE"| CUT["Employees COPY CONSTRUCTOR runs.<br/>It is a function that knows only about<br/>Employee, so it copies only the<br/>Employee-shaped prefix."]\n' +
          '  CUT --> C1["40 bytes -&gt; 32 bytes.<br/>bonus is DROPPED. No diagnostic."]\n' +
          '  CUT --> C2["The destination IS an Employee, so it gets<br/>EMPLOYEEs vptr. Virtual dispatch now<br/>correctly reports the type you have.<br/>Measured: role=Employee pay=1000"]\n' +
          '  Q -->|"std::vector&lt;Employee&gt;"| VEC["The same cut, once per push_back,<br/>invisibly, inside the container.<br/>Measured: every element reported<br/>role=Employee pay=1000"]\n' +
          '  Q -->|"baseRef = someEmployee;"| ASG["Employees COPY ASSIGNMENT runs on the<br/>Employee prefix of a LIVE Manager.<br/>The vptr is not an assignable member,<br/>so it is left alone."]\n' +
          '  ASG --> A1["Result: still a Manager, still dispatches<br/>to Manager::pay, bonus untouched at 999,<br/>name overwritten.<br/>Measured: pay() = 1999"]\n' +
          '  C1 --> W["No diagnostic for ANY of these.<br/>Measured under -Weverything: the only<br/>warnings produced were about c++98<br/>compat, deprecated-copy, prototypes and<br/>weak vtables. Nothing about slicing."]\n' +
          '  C2 --> W\n' +
          '  VEC --> W\n' +
          '  A1 --> W\n' +
          '  W --> F1["FIX 1, always: never pass or store a<br/>polymorphic type by value. Reference,<br/>pointer, or unique_ptr&lt;Base&gt;."]\n' +
          '  W --> F2["FIX 2, structural: make the base ABSTRACT.<br/>An abstract class cannot be a by-value<br/>parameter or a vector element, so every<br/>case above becomes a compile error."]\n' +
          '  W --> F3["FIX 3, explicit: in the base, delete the<br/>copy operations, or make them protected.<br/>Then only derived classes can copy."]\n' +
          '  style REF fill:#1a3329,stroke:#4ade80\n' +
          '  style F1 fill:#1a3329,stroke:#4ade80\n' +
          '  style F2 fill:#1a3329,stroke:#4ade80\n' +
          '  style F3 fill:#1a3329,stroke:#4ade80\n' +
          '  style CUT fill:#3d2f14,stroke:#fb923c\n' +
          '  style C1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style C2 fill:#3b1a1a,stroke:#f87171\n' +
          '  style VEC fill:#3b1a1a,stroke:#f87171\n' +
          '  style ASG fill:#3b1a1a,stroke:#f87171\n' +
          '  style A1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style W fill:#3b1a1a,stroke:#f87171\n' +
          '  style L fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h2>Abstract Classes And Pure Virtual Functions</h2>
      <p>
        <code>= 0</code> on a virtual function declaration makes it <strong>pure virtual</strong>,
        and a class with any pure virtual function is <strong>abstract</strong>: you cannot create an
        object of it. This is the direct analogue of Java&apos;s <code>abstract</code>, and a class
        where <em>every</em> function is pure virtual and there are no data members is the C++
        spelling of a Java <code>interface</code>.
      </p>

      <CodeBlock language="cpp" title="abstract.cpp">
{`#include <memory>
#include <print>
#include <string>
#include <vector>

// The C++ spelling of a Java interface: all functions pure virtual, a
// virtual destructor, no data.
struct Sink {
    virtual void write(std::string_view line) = 0;
    virtual void flush() = 0;
    virtual ~Sink() = default;
};

struct StdoutSink : Sink {
    void write(std::string_view line) override { std::println("  [stdout] {}", line); }
    void flush() override { std::println("  [stdout] flush"); }
};

struct BufferSink : Sink {
    std::vector<std::string> lines;
    void write(std::string_view line) override { lines.emplace_back(line); }
    void flush() override { std::println("  [buffer] {} line(s) held", lines.size()); }
};

// A pure virtual function MAY have a definition. Derived classes still have to
// override it, but they can call this one explicitly as a shared default.
struct Policy {
    virtual int retries() const = 0;
    virtual ~Policy() = default;
};
int Policy::retries() const { return 3; }

struct Aggressive : Policy {
    int retries() const override { return Policy::retries() * 4; }
};

void emit(Sink& s) { s.write("hello"); s.write("world"); s.flush(); }

int main() {
    std::println("sizeof(Sink) = {}   (no data members, one vptr)", sizeof(Sink));
    StdoutSink a; BufferSink b;
    emit(a);
    emit(b);

    std::vector<std::unique_ptr<Sink>> sinks;
    sinks.push_back(std::make_unique<StdoutSink>());
    sinks.push_back(std::make_unique<BufferSink>());
    for (auto& s : sinks) s->write("via unique_ptr");
    for (auto& s : sinks) s->flush();

    Aggressive agg;
    std::println("Aggressive::retries() = {}  (calls the pure virtual's own definition)",
                 agg.retries());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 abstract.cpp && ./abstract">
{`sizeof(Sink) = 8   (no data members, one vptr)
  [stdout] hello
  [stdout] world
  [stdout] flush
  [buffer] 2 line(s) held
  [stdout] via unique_ptr
  [stdout] flush
  [buffer] 1 line(s) held
Aggressive::retries() = 12  (calls the pure virtual's own definition)`}
      </CodeBlock>

      <p>
        <code>sizeof(Sink) == 8</code>: a pure interface is exactly one vptr and nothing else. And{' '}
        <code>Aggressive::retries() == 12</code> confirms something that surprises people —{' '}
        <strong>a pure virtual function is allowed to have a definition</strong>, which derived
        classes must still override but can call explicitly as a shared default. The syntax is
        slightly odd: the <code>= 0</code> goes on the declaration, the body goes outside the class.
        Java got the same capability much later, as <code>default</code> methods on interfaces.
      </p>
      <p>
        Attempting to instantiate an abstract class is a clear error, and so is a derived class that
        forgets one override:
      </p>

      <CodeBlock language="cpp" title="abstract2.cpp">
{`#include <string_view>
struct Sink {
    virtual void write(std::string_view line) = 0;
    virtual ~Sink() = default;
};
struct Partial : Sink { };            // forgot to override write()

int main() {
    Sink s;                            // abstract
    Partial p;                         // still abstract
    Sink* heap = new Sink{};           // abstract
    (void)heap;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only abstract2.cpp">
{`abstract2.cpp:9:10: error: variable type 'Sink' is an abstract class
    9 |     Sink s;                            // abstract
      |          ^
abstract2.cpp:3:18: note: unimplemented pure virtual method 'write' in
      'Sink'
    3 |     virtual void write(std::string_view line) = 0;
      |                  ^
abstract2.cpp:10:13: error: variable type 'Partial' is an abstract class
   10 |     Partial p;                         // still abstract
      |             ^
abstract2.cpp:3:18: note: unimplemented pure virtual method 'write' in
      'Partial'
    3 |     virtual void write(std::string_view line) = 0;
      |                  ^
abstract2.cpp:11:22: error: allocating an object of abstract class type
      'Sink'
   11 |     Sink* heap = new Sink{};           // abstract
      |                      ^
3 errors generated.`}
      </CodeBlock>

      <p>
        <code>unimplemented pure virtual method &apos;write&apos; in &apos;Partial&apos;</code> is
        the C++ equivalent of Java&apos;s &quot;Partial is not abstract and does not override
        abstract method&quot;. Note the second half of the slicing fix hiding in here: because an
        abstract class cannot be a variable, it also cannot be a by-value parameter or a{' '}
        <code>std::vector</code> element. <strong>Making the base abstract turns object slicing from
        a silent bug into a compile error</strong>, which is the single best structural reason to
        prefer interfaces with no data over base classes with state.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Java</th>
            <th style={headStyle}>C++</th>
            <th style={headStyle}>Difference that bites</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>interface Sink</code></td>
            <td style={cellStyle}><code>struct Sink</code> with all functions{' '}
              <code>= 0</code> and <code>virtual ~Sink() = default;</code></td>
            <td style={cellStyle}>You must write the virtual destructor yourself. Nothing reminds
              you unless you add <code>-Wnon-virtual-dtor</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>abstract class</code> with state</td>
            <td style={cellStyle}>A class with at least one <code>= 0</code> function</td>
            <td style={cellStyle}>C++ has no <code>abstract</code> keyword. Abstractness is a
              consequence of having a pure virtual, not a declaration.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>default</code> method on an interface</td>
            <td style={cellStyle}>A pure virtual with an out-of-class definition</td>
            <td style={cellStyle}>Derived classes must <em>still</em> override it; they just get to
              call <code>Base::f()</code>. Measured: <code>12</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>implements Sink</code></td>
            <td style={cellStyle}><code>: public Sink</code></td>
            <td style={cellStyle}>Forget <code>public</code> on a <code>class</code> and you get{' '}
              <em>private</em> inheritance, and the conversion to <code>Sink*</code> silently
              disappears. See the next section.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>instanceof</code> / pattern matching</td>
            <td style={cellStyle}><code>dynamic_cast</code>, <code>typeid</code></td>
            <td style={cellStyle}>Requires RTTI, needs a polymorphic type, and the reference form
              throws rather than returning null.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>A field of interface type</td>
            <td style={cellStyle}><code>std::unique_ptr&lt;Sink&gt;</code> or{' '}
              <code>Sink&amp;</code></td>
            <td style={cellStyle}>A field of type <code>Sink</code> does not compile (abstract) or,
              if the base is concrete, slices.</td>
          </tr>
        </tbody>
      </table>

      <h2><code>dynamic_cast</code>: Where <code>instanceof</code> Went</h2>
      <p>
        Occasionally you do need to ask what a thing actually is. C++ spells it{' '}
        <code>dynamic_cast</code>, it requires the type to be polymorphic (at least one virtual
        function), and it comes in two forms with different failure modes.
      </p>

      <CodeBlock language="cpp" title="dyncast.cpp">
{`#include <print>
#include <typeinfo>

struct Shape { virtual ~Shape() = default; };
struct Circle : Shape { double r = 1.0; };
struct Square : Shape { double s = 2.0; };

int main() {
    Circle c;
    Shape* s = &c;

    // The pointer form: nullptr on failure. This is C++'s instanceof.
    if (auto* p = dynamic_cast<Circle*>(s)) std::println("dynamic_cast<Circle*> ok, r={}", p->r);
    if (auto* p = dynamic_cast<Square*>(s)) std::println("dynamic_cast<Square*> ok, s={}", p->s);
    else                                    std::println("dynamic_cast<Square*> -> nullptr");

    // The reference form throws instead.
    try { [[maybe_unused]] auto& r = dynamic_cast<Square&>(*s); }
    catch (const std::bad_cast& e) { std::println("dynamic_cast<Square&> threw: {}", e.what()); }

    // typeid: the runtime type, mangled.
    std::println("typeid(*s).name() = {}", typeid(*s).name());
    std::println("typeid(*s) == typeid(Circle) : {}", typeid(*s) == typeid(Circle));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 dyncast.cpp && ./dyncast">
{`dynamic_cast<Circle*> ok, r=1
dynamic_cast<Square*> -> nullptr
dynamic_cast<Square&> threw: std::bad_cast
typeid(*s).name() = 6Circle
typeid(*s) == typeid(Circle) : true`}
      </CodeBlock>

      <p>
        Three things worth noting. The pointer form returning <code>nullptr</code> makes{' '}
        <code>if (auto* p = dynamic_cast&lt;D*&gt;(b))</code> the idiomatic{' '}
        <code>instanceof</code>-plus-bind, which is close to Java&apos;s pattern-matching{' '}
        <code>instanceof</code>. <code>typeid(...).name()</code> returns the{' '}
        <em>mangled</em> name — <code>6Circle</code>, not <code>Circle</code> — which is
        implementation-defined and not for user-facing output; run it through{' '}
        <code>c++filt</code> if you need it readable. And all of this depends on RTTI being
        enabled:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fno-rtti -fsyntax-only dyncast.cpp">
{`dyncast.cpp:13:19: error: use of dynamic_cast requires -frtti
   13 |     if (auto* p = dynamic_cast<Circle*>(s)) std::println("dynamic_cast<Circle*> ok, r={}", p->r);
      |                   ^
dyncast.cpp:22:44: error: use of typeid requires -frtti
   22 |     std::println("typeid(*s).name() = {}", typeid(*s).name());
      |                                            ^`}
      </CodeBlock>

      <p>
        <code>-fno-rtti</code> is common in games, embedded work and parts of LLVM itself, to cut
        binary size. If you are writing a library, do not make it depend on{' '}
        <code>dynamic_cast</code>. And in general, treat a <code>dynamic_cast</code> in your code as
        a design smell that you asked a base class to pretend it did not know something: the usual
        fix is a virtual function, or <code>std::variant</code> if the set of types is closed.
      </p>

      <h2>Private And Protected Inheritance</h2>
      <p>
        Java has <code>extends</code> and nothing else. C++ has three inheritance accesses, and{' '}
        <a href="/cpp/classes">the last lesson</a> already flagged the trap in passing: the default
        is <code>public</code> for a <code>struct</code> and <code>private</code> for a{' '}
        <code>class</code>, so <code>class D : B</code> is private inheritance and the conversion
        from <code>D*</code> to <code>B*</code> silently does not exist.
      </p>
      <p>
        The distinction is not about hiding fields. It is about <strong>whether &quot;is-a&quot;
        leaves the class</strong>:
      </p>
      <ul>
        <li>
          <strong><code>public</code></strong> — &quot;D <em>is a</em> B&quot;. Anyone may convert a{' '}
          <code>D*</code> to a <code>B*</code>. This is the only form that is polymorphism.
        </li>
        <li>
          <strong><code>protected</code></strong> — &quot;D is a B, and so are D&apos;s
          descendants, but nobody outside the family knows&quot;.
        </li>
        <li>
          <strong><code>private</code></strong> — &quot;D <em>is implemented in terms of</em> a
          B&quot;. Composition with extra privileges: D can call B&apos;s protected members and
          override its virtuals, but no conversion escapes.
        </li>
      </ul>

      <CodeBlock language="cpp" title="privinh.cpp">
{`#include <print>
#include <type_traits>
#include <vector>

// A small reusable engine. Not an interface -- an implementation detail.
class RingBuffer {
public:
    void push(int v) { data_.push_back(v); if (data_.size() > cap_) data_.erase(data_.begin()); }
    std::size_t size() const { return data_.size(); }
    int newest() const { return data_.back(); }
protected:
    std::size_t cap_ = 4;
private:
    std::vector<int> data_;
};

// PUBLIC inheritance: "a PubSensor IS-A RingBuffer".
class PubSensor : public RingBuffer {};

// PRIVATE inheritance: "a PrivSensor IS-IMPLEMENTED-IN-TERMS-OF a RingBuffer".
// No conversion to RingBuffer*, and push/size/newest are private here.
class PrivSensor : private RingBuffer {
public:
    void record(int v) { push(v); }                // can still use the base
    using RingBuffer::size;                        // selectively re-export one
    std::size_t capacity() const { return cap_; }  // protected member visible
};

// PROTECTED inheritance: like private, but classes derived from ProtSensor
// can still see the base interface.
class ProtSensor : protected RingBuffer {
public:
    void record(int v) { push(v); }
};
class SubProtSensor : public ProtSensor {
public:
    int latest() const { return newest(); }        // visible: protected base
};

int main() {
    std::println("is_convertible_v<PubSensor*,  RingBuffer*> = {}",
                 std::is_convertible_v<PubSensor*, RingBuffer*>);
    std::println("is_convertible_v<PrivSensor*, RingBuffer*> = {}",
                 std::is_convertible_v<PrivSensor*, RingBuffer*>);
    std::println("is_convertible_v<ProtSensor*, RingBuffer*> = {}",
                 std::is_convertible_v<ProtSensor*, RingBuffer*>);
    std::println("is_base_of_v<RingBuffer, PrivSensor>       = {}",
                 std::is_base_of_v<RingBuffer, PrivSensor>);

    PrivSensor s;
    for (int i = 0; i < 6; ++i) s.record(i);
    std::println("PrivSensor: size()={} capacity()={}", s.size(), s.capacity());

    SubProtSensor t;
    for (int i = 10; i < 13; ++i) t.record(i);
    std::println("SubProtSensor: latest()={}", t.latest());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 privinh.cpp && ./privinh">
{`is_convertible_v<PubSensor*,  RingBuffer*> = true
is_convertible_v<PrivSensor*, RingBuffer*> = false
is_convertible_v<ProtSensor*, RingBuffer*> = false
is_base_of_v<RingBuffer, PrivSensor>       = true
PrivSensor: size()=4 capacity()=4
SubProtSensor: latest()=12`}
      </CodeBlock>

      <p>
        Note the pair of lines that disagree:{' '}
        <strong><code>is_base_of_v&lt;RingBuffer, PrivSensor&gt;</code> is{' '}
        <code>true</code> while <code>is_convertible_v&lt;PrivSensor*, RingBuffer*&gt;</code> is{' '}
        <code>false</code></strong>. <code>is_base_of</code> answers a question about class
        structure; <code>is_convertible</code> answers a question about access. When you are writing
        a template that wants &quot;any type derived from <code>Base</code>&quot;, the one you
        almost always mean is <code>is_convertible</code> (or, from{' '}
        <a href="/cpp/concepts">the concepts lesson</a>,{' '}
        <code>std::derived_from</code>, which is specified in terms of both).
      </p>
      <p>
        The errors are explicit about the cause, which is more than most of this lesson:
      </p>

      <CodeBlock language="cpp" title="privinh2.cpp">
{`class RingBuffer { public: void push(int); };
class PrivSensor : private RingBuffer { public: void record(int v) { push(v); } };

void consume(RingBuffer*);

int main() {
    PrivSensor s;
    s.push(1);              // push is private in PrivSensor
    consume(&s);            // no conversion to RingBuffer*
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only privinh2.cpp">
{`privinh2.cpp:8:7: error: 'push' is a private member of 'RingBuffer'
    8 |     s.push(1);              // push is private in PrivSensor
      |       ^
privinh2.cpp:2:20: note: constrained by private inheritance here
    2 | class PrivSensor : private RingBuffer { public: void record(int v...
      |                    ^~~~~~~~~~~~~~~~~~
privinh2.cpp:1:33: note: member is declared here
    1 | class RingBuffer { public: void push(int); };
      |                                 ^
privinh2.cpp:9:13: error: cannot cast 'PrivSensor' to its private base
      class 'RingBuffer'
    9 |     consume(&s);            // no conversion to RingBuffer*
      |             ^
privinh2.cpp:2:20: note: declared private here
    2 | class PrivSensor : private RingBuffer { public: void record(int v...
      |                    ^~~~~~~~~~~~~~~~~~
2 errors generated.`}
      </CodeBlock>

      <InfoBox variant="tip" title="When private inheritance is actually the right call — it is rare">
        <p>
          Private inheritance and a private member do almost the same job, and the member is
          clearer, testable in isolation, and swappable at runtime. <strong>Prefer
          composition.</strong> The honest list of cases where private inheritance earns its place:
        </p>
        <ul>
          <li>
            <strong>You need to override the base&apos;s virtual functions.</strong> A member cannot
            do that. This is the main one.
          </li>
          <li>
            <strong>You need access to the base&apos;s <code>protected</code> members</strong> —{' '}
            <code>cap_</code> above. A member gives you only the public interface.
          </li>
          <li>
            <strong>Empty base optimisation.</strong> A stateless base costs 0 bytes; a stateless
            member costs at least 1, plus alignment padding. Measured:
            <CodeBlock language="text" title="Real output — ebo.cpp, clang++ -std=c++23 -O2">
{`sizeof(Stateless)             = 1
sizeof(AsMember)  member      = 8     <- struct { Stateless s; int v; }
sizeof(AsBase)    empty base  = 4     <- struct : Stateless { int v; }
sizeof(NoAddr)    no_unique_  = 4     <- [[no_unique_address]] member
sizeof(std::vector<int>)      = 24    <- 3 pointers; the allocator is free`}
            </CodeBlock>
            Eight bytes against four, for a type with no state in it. This is how{' '}
            <code>std::vector</code> carries a stateless allocator at zero cost —{' '}
            <code>sizeof(std::vector&lt;int&gt;)</code> is exactly three pointers. Note the last
            row: C++20&apos;s <code>[[no_unique_address]]</code> gets the same 4 bytes with a
            member instead of a base, which removes most of the reason to inherit for this.
          </li>
        </ul>
        <p>
          Also note <code>using RingBuffer::size;</code> above, which re-exports exactly one
          inherited name at public access. That is how you take an interface apart deliberately
          instead of inheriting all of it by accident — and it is the same{' '}
          <code>using</code> that pulls in base constructors (<code>using Base::Base;</code>).
        </p>
      </InfoBox>

      <h2>Multiple Inheritance And The Diamond</h2>
      <p>
        C++ lets a class have several base classes. Java deliberately does not, for data — you may
        implement many interfaces but extend one class — and the reason is this section.
      </p>
      <p>
        Inheriting the same base twice through two different paths gives you{' '}
        <strong>two complete copies of that base subobject</strong>. Not two names for one thing:
        two objects, with independent state, at different addresses.
      </p>

      <CodeBlock language="cpp" title="diamond.cpp">
{`#include <print>
#include <string>

// --- The non-virtual diamond: Device is inherited TWICE. ---
struct Device {
    std::string serial = "unset";
    int power_cycles = 0;
    void power_on() { ++power_cycles; }
    virtual ~Device() = default;
};
struct Scanner  : Device {};
struct Printer  : Device {};
struct MFP      : Scanner, Printer {};     // two Device subobjects

// --- The same shape with virtual inheritance: ONE Device. ---
struct VDevice {
    std::string serial = "unset";
    int power_cycles = 0;
    void power_on() { ++power_cycles; }
    virtual ~VDevice() = default;
};
struct VScanner : virtual VDevice {};
struct VPrinter : virtual VDevice {};
struct VMFP     : VScanner, VPrinter {};   // one shared VDevice

int main() {
    std::println("sizeof(Device)={}  sizeof(Scanner)={}  sizeof(MFP)={}",
                 sizeof(Device), sizeof(Scanner), sizeof(MFP));
    std::println("sizeof(VDevice)={} sizeof(VScanner)={} sizeof(VMFP)={}",
                 sizeof(VDevice), sizeof(VScanner), sizeof(VMFP));

    MFP m;
    m.Scanner::serial = "SC-1";
    m.Printer::serial = "PR-1";
    m.Scanner::power_on();
    m.Scanner::power_on();
    m.Printer::power_on();
    std::println("MFP  (non-virtual): Scanner::serial={} Printer::serial={}",
                 m.Scanner::serial, m.Printer::serial);
    std::println("MFP  (non-virtual): Scanner::power_cycles={} Printer::power_cycles={}",
                 m.Scanner::power_cycles, m.Printer::power_cycles);
    std::println("  two Device subobjects at {} and {}",
                 static_cast<const void*>(static_cast<Scanner*>(&m)),
                 static_cast<const void*>(static_cast<Printer*>(&m)));

    VMFP v;
    v.serial = "MFP-1";                 // unambiguous: there is only one
    v.power_on();
    v.VScanner::power_on();
    v.VPrinter::power_on();
    std::println("VMFP (virtual):     serial={} power_cycles={}", v.serial, v.power_cycles);
    std::println("  one VDevice subobject, reached from both at {} / {}",
                 static_cast<const void*>(static_cast<VDevice*>(static_cast<VScanner*>(&v))),
                 static_cast<const void*>(static_cast<VDevice*>(static_cast<VPrinter*>(&v))));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 diamond.cpp && ./diamond">
{`sizeof(Device)=40  sizeof(Scanner)=40  sizeof(MFP)=80
sizeof(VDevice)=40 sizeof(VScanner)=48 sizeof(VMFP)=56

MFP  (non-virtual): Scanner::serial=SC-1 Printer::serial=PR-1
MFP  (non-virtual): Scanner::power_cycles=2 Printer::power_cycles=1
  two Device subobjects at 0x16d702780 and 0x16d7027a8
VMFP (virtual):     serial=MFP-1 power_cycles=3
  one VDevice subobject, reached from both at 0x16d702750 / 0x16d702750`}
      </CodeBlock>

      <p>
        <code>sizeof(MFP) == 80</code>, exactly two <code>Device</code>s, at two addresses 40 bytes
        apart. One device with two serial numbers and two independent power-cycle counters reading{' '}
        <code>2</code> and <code>1</code>. That is not a subtle bug; it is a data model that cannot
        be right.
      </p>
      <p>
        And any unqualified access is ambiguous, which is at least loud. The error messages draw the
        paths for you:
      </p>

      <CodeBlock language="cpp" title="diamond2.cpp">
{`struct Device { int power_cycles = 0; void power_on(); };
struct Scanner : Device {};
struct Printer : Device {};
struct MFP : Scanner, Printer {};

void use(Device*);

int main() {
    MFP m;
    m.power_on();          // which Device::power_on?
    int n = m.power_cycles;// which Device::power_cycles?
    use(&m);               // which Device subobject?
    return n;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only diamond2.cpp">
{`diamond2.cpp:10:7: error: non-static member 'power_on' found in multiple
      base-class subobjects of type 'Device':
    struct MFP -> Scanner -> Device
    struct MFP -> Printer -> Device
   10 |     m.power_on();          // which Device::power_on?
      |       ^
diamond2.cpp:1:44: note: member found by ambiguous name lookup
    1 | struct Device { int power_cycles = 0; void power_on(); };
      |                                            ^
diamond2.cpp:11:15: error: non-static member 'power_cycles' found in
      multiple base-class subobjects of type 'Device':
    struct MFP -> Scanner -> Device
    struct MFP -> Printer -> Device
   11 |     int n = m.power_cycles;// which Device::power_cycles?
      |               ^
diamond2.cpp:12:9: error: ambiguous conversion from derived class 'MFP' to
      base class 'Device':
    struct MFP -> Scanner -> Device
    struct MFP -> Printer -> Device
3 errors generated.`}
      </CodeBlock>

      <p>
        <strong><code>virtual</code> inheritance</strong> is the fix.{' '}
        <code>struct VScanner : virtual VDevice</code> says &quot;however many paths reach{' '}
        <code>VDevice</code>, there is exactly one of it&quot;, and the measurements confirm it:{' '}
        <code>v.serial</code> is unambiguous, the three <code>power_on()</code> calls through three
        different paths all incremented <em>the same</em> counter to <code>3</code>, and the
        subobject address is identical from both branches.
      </p>
      <p>
        It is not free, and the costs are the reason to be suspicious of the whole shape:
      </p>
      <ul>
        <li>
          <strong>Space.</strong> <code>sizeof(VScanner)</code> is <code>48</code> against{' '}
          <code>sizeof(Scanner)</code> at <code>40</code> — 8 bytes for each intermediate class, to
          hold the offset information needed to find the shared base at runtime.{' '}
          <code>sizeof(VMFP) == 56</code>, which is still much better than 80, but the per-class
          overhead is there even when no diamond exists.
        </li>
        <li>
          <strong>Time.</strong> Finding a virtual base&apos;s members requires an indirection
          through the vtable, because the offset from <code>VScanner*</code> to{' '}
          <code>VDevice*</code> depends on the most-derived type and is therefore not a compile-time
          constant.
        </li>
        <li>
          <strong>Construction rules change,</strong> and this is the part that surprises people in
          real code. The <em>most-derived</em> class initialises a virtual base, not the intermediate
          classes — so an intermediate class&apos;s initialiser list for that base is silently
          ignored. Measured:
          <CodeBlock language="cpp" title="vbase.cpp — three classes each ask for a different VDevice">
{`struct VDevice { int id; explicit VDevice(int i) : id(i) { std::println("    VDevice({})", i); }
                 virtual ~VDevice() = default; };
struct VScanner : virtual VDevice { VScanner() : VDevice(11) { std::println("  VScanner() asked for VDevice(11)"); } };
struct VPrinter : virtual VDevice { VPrinter() : VDevice(22) { std::println("  VPrinter() asked for VDevice(22)"); } };
struct VMFP : VScanner, VPrinter  { VMFP()     : VDevice(99) { std::println("VMFP() asked for VDevice(99)"); } };

int main() { VMFP v; std::println("v.id = {}", v.id); }`}
          </CodeBlock>
          <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 vbase.cpp && ./vbase">
{`    VDevice(99)
  VScanner() asked for VDevice(11)
  VPrinter() asked for VDevice(22)
VMFP() asked for VDevice(99)
v.id = 99`}
          </CodeBlock>
          One <code>VDevice</code>, constructed <em>first</em>, with <code>VMFP</code>&apos;s
          argument. The <code>11</code> and the <code>22</code> were discarded without a word.
          Which also means <code>VScanner</code> on its own would build a{' '}
          <code>VDevice(11)</code>, and the same class inside a <code>VMFP</code> gets{' '}
          <code>99</code> — the behaviour of an intermediate class depends on what derives from it.
        </li>
        <li>
          <strong><code>static_cast</code> stops working in one direction.</strong> Measured:
          <CodeBlock language="text" title="Real output — static_cast from a virtual base down to a derived class">
{`vcast.cpp:4:16: error: cannot cast 'VDevice *' to 'VScanner *' via virtual
      base 'VDevice'
    4 |     auto* s1 = static_cast<VScanner*>(p);     // from a virtual base
      |                ^~~~~~~~~~~~~~~~~~~~~~~~~
1 error generated.`}
          </CodeBlock>
          The <code>dynamic_cast</code> on the next line compiled fine. The offset is not a
          compile-time constant, so the downcast needs runtime information.
        </li>
      </ul>

      <InfoBox variant="warning" title="How often is this the right tool? Almost never.">
        <p>
          The honest position: <strong>multiple inheritance of <em>interfaces</em> is fine and
          common</strong> — several abstract bases with no data members, which is exactly what Java
          lets you do with <code>implements</code>, and which creates no diamond problem because
          there is no state to duplicate. <strong>Multiple inheritance of <em>state</em> is a
          design smell</strong>, and virtual inheritance is the expensive patch for a shape you
          should probably not have.
        </p>
        <p>
          The one place you will certainly meet it is <code>&lt;iostream&gt;</code>, and it is
          worth looking at the real headers on this machine rather than taking it on trust:
        </p>
        <CodeBlock language="text" title="Real output — grep of /Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/istream">
{`istream:195:class basic_istream : virtual public basic_ios<_CharT, _Traits> {
istream:1177:class basic_iostream : public basic_istream<_CharT, _Traits>, public basic_ostream<_CharT, _Traits> {`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — and what that costs, measured">
{`is_base_of_v<std::ios, std::istream>      = true
is_base_of_v<std::istream, std::iostream> = true
is_base_of_v<std::ostream, std::iostream> = true
sizeof(std::ios)=152 istream=168 ostream=160 iostream=176
iostream* -> ios* converts unambiguously: true`}
        </CodeBlock>
        <p>
          There is the diamond, exactly the shape of <code>MFP</code>:{' '}
          <code>basic_iostream</code> inherits both streams, and both streams{' '}
          <code>virtual</code>ly inherit <code>basic_ios</code>. The payoff is in the last two
          lines. <code>sizeof(std::iostream)</code> is <strong>176</strong>; if{' '}
          <code>basic_ios</code> were duplicated it would be at least{' '}
          <code>168 + 160 = 328</code>. And <code>iostream*</code> converts to{' '}
          <code>ios*</code> without the ambiguity error measured above. That is the canonical
          example, it dates from 1990, and it is frequently cited as a design the committee would
          not repeat.
        </p>
        <p>
          If you are reaching for multiple inheritance to share implementation, the alternatives in
          order are: a member (composition), a free function taking the common interface, a
          template, or — if you need compile-time mixin behaviour — CRTP.
        </p>
      </InfoBox>

      <h2>Composition Usually Wins</h2>
      <p>
        Everything on this page has a cost attached to it now, measured rather than asserted: 12
        extra bytes per object and the loss of trivial copyability for the vptr; roughly 0.2 ns and
        the loss of inlining per virtual call; one undefined-behaviour footgun at every{' '}
        <code>delete</code>; one silent-wrong-answer footgun at every by-value copy; and a whole
        category of layout problems if you inherit state twice.
      </p>
      <p>
        Against that, <strong>inheritance buys exactly one thing: runtime substitutability through a
        common type.</strong> If you do not need that, you are paying for nothing. And the list of
        things people <em>actually</em> want when they reach for inheritance is mostly satisfied by
        cheaper tools:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>What you want</th>
            <th style={headStyle}>Reach for</th>
            <th style={headStyle}>Measured cost here</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Reuse an implementation</td>
            <td style={cellStyle}>A member. Composition.</td>
            <td style={cellStyle}>Zero. No vptr, no slicing, no destructor rule.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>One of a <em>closed</em> set of behaviours</td>
            <td style={cellStyle}><code>std::variant</code> + <code>std::visit</code>, or a tagged
              struct and a <code>switch</code></td>
            <td style={cellStyle}>0.59–0.68 ns/element against 0.67–0.83 for virtual dispatch —
              and the compiler can check exhaustiveness.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Swap behaviour out at runtime</td>
            <td style={cellStyle}><code>std::function</code>, or a member holding a{' '}
              <code>unique_ptr</code> to a small interface</td>
            <td style={cellStyle}>One indirection, and it can change after construction — which an
              object&apos;s dynamic type cannot.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>The same algorithm for several unrelated types</td>
            <td style={cellStyle}>A template —{' '}
              <a href="/cpp/templates">the next lesson</a></td>
            <td style={cellStyle}>Zero runtime cost, full inlining, and no common base type
              needed at all.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Plug in types you do not know at compile time</td>
            <td style={cellStyle}>An abstract class with no data members, held by{' '}
              <code>unique_ptr</code></td>
            <td style={cellStyle}>The real use case. <code>sizeof(Sink) == 8</code>, and an
              abstract base cannot be sliced.</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="Decision path: do you need inheritance at all?"
        chart={
          'graph TD\n' +
          '  Q0["Several things that behave differently.<br/>Reach for inheritance?"] --> Q1{"Is the set of types CLOSED?<br/>Do you know all of them<br/>at compile time?"}\n' +
          '  Q1 -->|yes| CLOSED["std::variant + std::visit, or a tagged<br/>struct and a switch. VALUES, not pointers.<br/>No vptr, no heap, no virtual destructor<br/>rule, no slicing."]\n' +
          '  CLOSED --> CM["Measured, 2,000,000 elements:<br/>switch 0.59–0.68 ns<br/>variant 0.666–0.667 ns<br/>virtual-via-pointer 0.67–0.83 ns"]\n' +
          '  Q1 -->|"no — plugins, test doubles,<br/>types chosen at runtime"| Q2{"Do callers have to handle them<br/>uniformly through ONE type?"}\n' +
          '  Q2 -->|no| TEMPL["A TEMPLATE. Compile-time polymorphism:<br/>no vptr, no common base, full inlining.<br/>This is the next lesson."]\n' +
          '  Q2 -->|yes| Q3{"Do you want the bases<br/>INTERFACE, or its<br/>IMPLEMENTATION?"}\n' +
          '  Q3 -->|"interface only"| ABS["An ABSTRACT class: every function = 0,<br/>virtual destructor, NO data members.<br/>Measured: sizeof = 8, one vptr.<br/>Cannot be sliced, because it cannot be<br/>a by-value parameter at all."]\n' +
          '  ABS --> ABS2["Hold it as unique_ptr&lt;Base&gt; or Base&amp;.<br/>Mark every override with override.<br/>Mark leaf classes final — measured:<br/>that devirtualised the call completely."]\n' +
          '  Q3 -->|implementation| Q4{"Is it really IS-A? Can a caller<br/>substitute one for the other<br/>without noticing?"}\n' +
          '  Q4 -->|"no — you just want its guts"| COMP["COMPOSITION. Hold it as a member.<br/>Measured cost: zero. And the member can<br/>be replaced at runtime, which an objects<br/>dynamic type cannot."]\n' +
          '  COMP --> PRIV["private inheritance is the same idea with<br/>worse ergonomics. Only when you must<br/>override the bases virtuals, need its<br/>protected members, or want the empty<br/>base optimisation."]\n' +
          '  Q4 -->|yes| PUB["public inheritance with state.<br/>The rarest correct answer. If you do it:<br/>virtual ~Base() or a protected destructor;<br/>override on every override;<br/>final on every leaf;<br/>-Wnon-virtual-dtor in the build."]\n' +
          '  style CLOSED fill:#1a3329,stroke:#4ade80\n' +
          '  style TEMPL fill:#1a3329,stroke:#4ade80\n' +
          '  style ABS fill:#1a3329,stroke:#4ade80\n' +
          '  style ABS2 fill:#1a3329,stroke:#4ade80\n' +
          '  style COMP fill:#1a3329,stroke:#4ade80\n' +
          '  style CM fill:#1a2744,stroke:#5b9cf6\n' +
          '  style PRIV fill:#3d2f14,stroke:#fb923c\n' +
          '  style PUB fill:#3d2f14,stroke:#fb923c'
        }
      />

      <h2>The Residue</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Java instinct</th>
            <th style={headStyle}>What this lesson measured</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Methods are virtual&quot;</td>
            <td style={cellStyle}>Without <code>virtual</code>, a base reference ran{' '}
              <code>Shape::describe</code> on a <code>Circle</code> and printed{' '}
              <code>area=0</code> for radius 2. Zero warnings, even with{' '}
              <code>-Weffc++ -Wshadow</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>override</code> is documentation&quot;</td>
            <td style={cellStyle}>Three realistic mistakes — by-value parameter, missing{' '}
              <code>const</code>, misspelled name — all compiled and ran the base version.{' '}
              <code>override</code> turned all three into errors.{' '}
              <code>-Wall</code> caught two of three on its own.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>final</code> is just a restriction&quot;</td>
            <td style={cellStyle}>It is an optimisation. <code>via_base</code> compiled to{' '}
              <code>ldr / ldr / br</code>; <code>via_sealed</code> compiled to{' '}
              <code>mov w0, #42 / ret</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A virtual function is basically free&quot;</td>
            <td style={cellStyle}>Per call, nearly: 0.67–0.83 ns against 0.49–0.52 ns direct. Per{' '}
              <em>object</em>, not free: <code>4</code> bytes &rarr; <code>16</code>, and{' '}
              <code>is_trivially_copyable</code> &rarr; <code>false</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Ten virtual functions cost more than one&quot;</td>
            <td style={cellStyle}>Per object, no. One vptr either way —{' '}
              <code>sizeof(TenVirtual) == sizeof(OneVirtual) == 16</code>. A virtual destructor
              alone costs the full 12 bytes.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Deleting through a base pointer is fine&quot;</td>
            <td style={cellStyle}><code>~DbTaskA()</code> never ran and the connection was never
              closed: <code>open_connections</code> stuck at <code>1</code>. With an{' '}
              <em>abstract</em> base the same program trapped — exit <code>133</code>,{' '}
              <code>brk #0x1</code> in the generated code.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>-Wall -Wextra</code> covers the destructor
              rule&quot;</td>
            <td style={cellStyle}>Only at the <code>delete</code> site.{' '}
              <code>-Wnon-virtual-dtor</code>, which warns at the class declaration, is in neither{' '}
              <code>-Wall</code> nor <code>-Wextra</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A constructor can call an override&quot;</td>
            <td style={cellStyle}>C++ ran <code>Base::describe</code>; Java ran{' '}
              <code>Derived.describe</code> with <code>tag == null</code>. C++ is safer here. A{' '}
              <em>pure</em> virtual call from a constructor aborted:{' '}
              <code>Pure virtual function called!</code>, exit 134.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Copying a derived object copies the derived
              object&quot;</td>
            <td style={cellStyle}>40 bytes became 32. <code>role</code> went{' '}
              <code>Manager</code> &rarr; <code>Employee</code>, <code>pay</code> went{' '}
              <code>1500</code> &rarr; <code>1000</code>, four different ways. Assignment through a
              base reference left a <code>Manager</code> with <code>pay() == 1999</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Something will warn about slicing&quot;</td>
            <td style={cellStyle}><code>-Weverything</code> produced five warning kinds for{' '}
              <code>slice.cpp</code> and not one was about slicing.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>class D : B</code> is inheritance&quot;</td>
            <td style={cellStyle}>It is <em>private</em> inheritance.{' '}
              <code>is_convertible_v&lt;D*, B*&gt;</code> came back <code>false</code> while{' '}
              <code>is_base_of_v&lt;B, D&gt;</code> came back <code>true</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Multiple inheritance just merges the bases&quot;</td>
            <td style={cellStyle}>Two complete copies.{' '}
              <code>sizeof(MFP) == 80</code> for two 40-byte <code>Device</code>s, at two
              addresses, with power-cycle counters reading <code>2</code> and <code>1</code>.{' '}
              <code>virtual</code> inheritance gave one shared base at{' '}
              <code>sizeof == 56</code> and 8 bytes of overhead per intermediate class.</td>
          </tr>
        </tbody>
      </table>

      <h2>The Checklist</h2>
      <p>
        If you keep nothing else from this page, keep these six lines. Every one of them is a
        measurement above, not a style preference.
      </p>
      <CodeBlock language="cpp" title="The shape of a polymorphic base class that cannot bite you">
{`class Sink {                               // abstract => cannot be sliced
public:
    virtual void write(std::string_view) = 0;
    virtual ~Sink() = default;             // or: protected, non-virtual
    Sink(const Sink&) = delete;            // belt and braces against slicing
    Sink& operator=(const Sink&) = delete;
protected:
    Sink() = default;
};

class FileSink final : public Sink {       // final => devirtualised at -O2
public:
    void write(std::string_view s) override;   // override => signature checked
};

// ...and in the build:  -Wall -Wextra -Wnon-virtual-dtor -Werror`}
      </CodeBlock>
      <ol>
        <li><strong>Base classes are abstract and hold no data</strong> where you can manage it.</li>
        <li><strong><code>virtual ~Base() = default;</code></strong>, or a{' '}
          <code>protected</code> non-virtual destructor if the type is never owned
          polymorphically.</li>
        <li><strong><code>override</code> on every single override.</strong> No exceptions; it is
          the only thing that catches the silent cases.</li>
        <li><strong><code>final</code> on every leaf class.</strong> Free, and measurably
          faster.</li>
        <li><strong>Never pass or store a polymorphic type by value.</strong>{' '}
          <code>const Base&amp;</code> for parameters, <code>unique_ptr&lt;Base&gt;</code> for
          ownership.</li>
        <li><strong><code>-Wnon-virtual-dtor</code> in the build.</strong> It is not in{' '}
          <code>-Wall</code>, and it is the one warning that points at the fix.</li>
      </ol>

      <h2>Where This Leads</h2>
      <p>
        Inheritance is <em>runtime</em> polymorphism: one type, many implementations, resolved
        through a pointer while the program runs. The next lesson is the other half of the language
        — <em>compile-time</em> polymorphism, where there is no common base type, no vptr, no
        pointer indirection and nothing to resolve at runtime, because a separate copy of the code
        was generated for each type you used.
      </p>
      <p>
        <strong><a href="/cpp/templates">Templates &amp; Generic Programming</a></strong> is the
        single largest conceptual gap between Java and C++, bigger than anything on this page.{' '}
        <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are the same class in
        Java; <code>vector&lt;string&gt;</code> and <code>vector&lt;int&gt;</code> are unrelated
        types with separately compiled machine code. There is no erasure, no bound on the type
        parameter unless you add one, and no type checking of the body until somebody instantiates
        it — which is where the famously unreadable error messages come from. One of them is
        captured and read line by line.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          A ten-minute audit with a high hit rate, using the compiler rather than a regex — because
          a regex cannot tell an override from a new function, and that is the whole difficulty.
          Take a codebase you are about to work in and do two things.
        </p>
        <p>
          <strong>One: turn on the flag that is not in <code>-Wall</code>.</strong> This found three
          separate problems in a 60-line demo file on this page:
        </p>
        <CodeBlock language="bash" title="Verified on this machine">
{`clang++ -std=c++23 -Wall -Wextra -Wnon-virtual-dtor -fsyntax-only yourfile.cpp

# on vdtor2.cpp from this lesson that produces 3 warnings:
#   line 23 -- 'TaskA'   has virtual functions but non-virtual destructor
#   line 29 -- 'DbTaskA' has virtual functions but non-virtual destructor
#   line 51 -- delete called on non-final 'TaskA' ...`}
        </CodeBlock>
        <p>
          <strong>Two: assert the property, next to the type.</strong> There is a trait for exactly
          this, and it is better than a comment because it fails the build:
        </p>
        <CodeBlock language="cpp" title="The two-line audit">
{`static_assert(std::has_virtual_destructor_v<YourBase>,
              "polymorphic base without a virtual destructor");
// and, if the base is meant to be an interface:
static_assert(std::is_abstract_v<YourBase>, "base should not be instantiable");`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — what the first one looks like when it fires">
{`audit.cpp:3:15: error: static assertion failed due to requirement
      'std::has_virtual_destructor_v<Sink>': polymorphic base without a
      virtual destructor
    3 | static_assert(std::has_virtual_destructor_v<Sink>,
      |               ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1 error generated.`}
        </CodeBlock>
        <p>
          Then one question to sit with, because it is the one that changes how you write C++ rather
          than how you read it. Pick the largest class hierarchy you can find. For each base class
          in it, ask: <strong>does any caller actually hold this type without knowing the concrete
          type?</strong> If the answer is no — if every call site knows it has a{' '}
          <code>FileSink</code> — then the hierarchy is paying 12 bytes an object, a lost
          inlining opportunity per call, and every footgun on this page, for nothing. That is the
          common case, and it is why the Core Guidelines open the inheritance section with{' '}
          &quot;prefer composition&quot;.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Inheritance;
