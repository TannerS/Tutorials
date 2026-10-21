import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function CppClassPrimer() {
  return (
    <LessonLayout
      title="Class Syntax Primer: Just Enough to Read What Follows"
      sectionId="cpp"
      lessonIndex={6}
      prev={{ path: '/cpp/memory-model', label: 'The Memory Model: Stack, Heap & Object Lifetime' }}
      next={{ path: '/cpp/raii', label: 'RAII: The Idea That Defines C++' }}
    >
      <p>
        The next three lessons — RAII, smart pointers, move semantics — are about <em>ideas</em>, but
        they express those ideas by writing small classes. Those classes use a handful of pieces of
        syntax that have no tidy Java equivalent: a colon after a constructor, a <code>const</code>{' '}
        after a parameter list, <code>= default</code>, <code>explicit</code>. The full treatment of
        classes is <a href="/cpp/classes">a later lesson</a>, and it is long. This page is the short
        version: just enough to <em>read</em> the code in between, nothing about why the rules are the
        way they are.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>, <code>arm64-apple-darwin25.6.0</code>,
          libc++, <code>-std=c++23</code>. Every output block below is a real run of the code above it
          on this machine.
        </p>
      </InfoBox>

      <h2><code>struct</code> vs <code>class</code></h2>
      <p>
        Both keywords define a class type. The <em>only</em> difference is the default access:{' '}
        <code>struct</code> members are <code>public</code> unless you say otherwise,{' '}
        <code>class</code> members are <code>private</code>. By convention a <code>struct</code> is
        used for plain bundles of data and a <code>class</code> for something with an invariant to
        protect, but the compiler does not care. Unlike Java, there is no &quot;default (package)&quot;
        access and no per-member modifier on every line — an access label applies to everything after
        it until the next label.
      </p>

      <CodeBlock language="cpp" title="access.cpp">
{`struct S { int x; };                 // x is public
class  C { int x = 1;                // x is private (class default)
public:
    int get() const { return x; } }; // everything from here down is public

S s{3};      // fine: aggregate-initialises s.x to 3
C c;         // c.x is not reachable from outside; use c.get()`}
      </CodeBlock>

      <h2>Data Members and Member Functions</h2>
      <p>
        A class body holds <strong>data members</strong> (Java: fields) and{' '}
        <strong>member functions</strong> (Java: methods) side by side, and the class definition ends
        with a semicolon, which is the single most common first-week compile error. A member function
        can use the members by bare name — there is no required <code>this.</code> prefix. The
        variable <em>is</em> the object, not a reference to one (<a href="/cpp/memory-model">the
        memory model lesson</a> covered that), so <code>Account a{'{'}&quot;alice&quot;, 100{'}'};</code>{' '}
        needs no <code>new</code>.
      </p>

      <h2>Constructors and the Member-Initialiser List</h2>
      <p>
        A constructor has the class&apos;s name and no return type. The unfamiliar part is the{' '}
        <strong>member-initialiser list</strong>: the <code>: a(x), b(y)</code> between the parameter
        list and the body.
      </p>

      <CodeBlock language="cpp" title="Reading a constructor">
{`class Account {
    std::string owner_;
    int balance_;
public:
    Account(std::string who, int start)
        : owner_(std::move(who)), balance_(start)   // <- initialiser list: construct the members
    {
        // body: runs AFTER every member above is already constructed
    }
};`}
      </CodeBlock>

      <p>
        Read the list as &quot;construct <code>owner_</code> from <code>who</code>, construct{' '}
        <code>balance_</code> from <code>start</code>&quot;. Both parentheses and braces are legal in
        the list; you will see both in the following lessons. The Java habit — leave the members alone
        and assign them in the body — still compiles, but it is a <em>different operation</em>: the
        member was already default-constructed by the time the body runs, and the assignment
        overwrites it. Prefer the list. (Why that matters, and the order the list actually runs in, is
        measured in <a href="/cpp/classes">the full lesson</a>.)
      </p>

      <h2>Destructors</h2>
      <p>
        A destructor is <code>~ClassName()</code>: no parameters, no return type. The compiler calls
        it for you when the object&apos;s lifetime ends — for a local variable, at the closing brace
        of its scope, on every path out including a thrown exception.{' '}
        <a href="/cpp/memory-model">The memory model lesson</a> measured exactly when. Java has no
        equivalent: <code>finalize()</code> is not deterministic, and <code>close()</code> is only
        called if you wrote a <code>try</code>. Here, no one has to remember.
      </p>

      <CodeBlock language="cpp" title="order.cpp">
{`#include <print>
#include <string>
#include <utility>

struct Noisy {
    std::string name;
    explicit Noisy(std::string n) : name(std::move(n)) { std::println("  ctor  {}", name); }
    ~Noisy() { std::println("  dtor  {}", name); }
};

class Account {
    Noisy tag_;        // declared first
    int balance_;
public:
    Account(std::string who, int start)
        : tag_{std::move(who)}, balance_{start} {      // member-initialiser list
        std::println("  Account body runs, balance={}", balance_);
    }
    ~Account() { std::println("  ~Account body runs"); }

    int balance() const { return balance_; }           // const member function
    void deposit(int n) { balance_ += n; }
    Account& self() { return *this; }                  // this is a pointer
};

int main() {
    std::println("enter scope");
    {
        Account a{"alice", 100};
        a.deposit(50);
        std::println("  balance={}, self==&a: {}", a.balance(), &a.self() == &a);
    }
    std::println("left scope");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 order.cpp && ./order">
{`enter scope
  ctor  alice
  Account body runs, balance=100
  balance=150, self==&a: true
  ~Account body runs
  dtor  alice
left scope`}
      </CodeBlock>

      <p>
        Nothing in <code>main</code> calls the destructor; it ran at the inner closing brace, before{' '}
        <code>left scope</code>. Notice the order: the member was constructed <em>before</em> the
        constructor body and destroyed <em>after</em> the destructor body — destruction is construction
        run backwards.
      </p>

      <FlowChart
        title="One object's life, in the order the lines printed"
        chart={
          'graph TD\n' +
          '  A["Object created<br/>Account a{&quot;alice&quot;, 100};"] --> B["1. Members are constructed<br/>from the initialiser list<br/>(printed: ctor alice)"]\n' +
          '  B --> C["2. Constructor body runs<br/>(printed: Account body runs)"]\n' +
          '  C --> D["Object is alive and usable"]\n' +
          '  D --> E["Scope ends: closing brace,<br/>return, or exception unwinding"]\n' +
          '  E --> F["3. Destructor body runs<br/>(printed: ~Account body runs)"]\n' +
          '  F --> G["4. Members are destroyed<br/>(printed: dtor alice)"]\n'
        }
      />

      <h2><code>explicit</code></h2>
      <p>
        You will see <code>explicit</code> in front of nearly every one-argument constructor. Without
        it, that constructor is also an <em>implicit conversion</em>: a function taking a{' '}
        <code>Meters</code> would silently accept a bare <code>2.5</code>. Java has nothing like this.
        <code> explicit</code> turns the conversion off, so you must write{' '}
        <code>Meters{'{'}2.5{'}'}</code>. Treat it as the default for one-argument constructors.
      </p>

      <h2><code>= default</code> and <code>= delete</code></h2>
      <p>
        Both are written in place of a function body. <code>= default</code> says &quot;generate the
        ordinary version for me&quot;; <code>= delete</code> says &quot;this operation does not exist,
        and calling it is a compile error&quot;.
      </p>

      <CodeBlock language="cpp" title="misc.cpp — two of these four lines are deliberately errors">
{`#include <print>

struct Meters {
    double v;
    explicit Meters(double d) : v(d) {}
};
void show(Meters m) { std::println("{}", m.v); }

struct NoCopy {
    NoCopy() = default;                  // "yes, a default constructor; you write nothing"
    NoCopy(const NoCopy&) = delete;      // "copying this type is forbidden"
};

int main() {
    show(Meters{2.5});    // fine
    show(2.5);            // error: explicit
    NoCopy a;             // fine
    NoCopy b = a;         // error: deleted
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsyntax-only misc.cpp (error lines only)">
{`misc.cpp:16:5: error: no matching function for call to 'show'
misc.cpp:18:12: error: call to deleted constructor of 'NoCopy'`}
      </CodeBlock>

      <p>
        Delete the two bad lines and the file compiles and prints <code>2.5</code>. Line 16 fails
        for the reason in the section above — <code>explicit</code> means a bare{' '}
        <code>2.5</code> will not quietly become a <code>Meters</code>. Line 18 fails because the
        copy constructor does not exist to be called.
      </p>

      <p>
        A deleted copy constructor is how <code>std::unique_ptr</code> says &quot;exactly one
        owner&quot;, which is why you will see this syntax again in the smart-pointers lesson.
      </p>

      <h2><code>const</code> Member Functions</h2>
      <p>
        A <code>const</code> <em>after</em> the parameter list promises the function does not modify
        the object. The compiler enforces it, and only <code>const</code> member functions can be
        called on a <code>const</code> object or through a <code>const&amp;</code> parameter — which
        is how most C++ code takes objects it only reads. Java has no counterpart; the nearest thing
        is an immutable class, and there the promise is per-class, not per-method.
      </p>

      <CodeBlock language="cpp" title="constfn.cpp">
{`struct A {
    int x = 0;
    int peek() const { return x; }       // ok: only reads
    int bump() const { x = 2; return x; } // error
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsyntax-only constfn.cpp (error line only)">
{`constfn.cpp:4:26: error: cannot assign to non-static data member within const member function 'bump'`}
      </CodeBlock>

      <h2>What <code>this</code> Is</h2>
      <p>
        Inside a non-static member function, <code>this</code> is a <strong>pointer</strong> to the
        object the function was called on — so <code>this-&gt;x</code>, and <code>*this</code> for the
        object itself. In Java it is a reference; here it is a pointer, which is why you dereference
        it to return the object (<code>return *this;</code>, as in <code>self()</code> above, which
        printed <code>self==&amp;a: true</code>). In a <code>const</code> member function it is a
        pointer-to-const. Most code never writes it, because bare member names already mean{' '}
        <code>this-&gt;name</code>.
      </p>

      <h2>What This Deliberately Skips</h2>
      <p>
        This page taught you to <em>read</em> the syntax, not to <em>design</em> with it. On purpose,
        it does not cover:
      </p>
      <ul>
        <li>
          the rule of zero / three / five, and which special members the compiler generates or
          silently withdraws depending on what you declare;
        </li>
        <li>
          the fact that members initialise in <strong>declaration order</strong>, not the order of the
          initialiser list, and the bugs that follow from it;
        </li>
        <li>copy and move constructors and assignment, beyond seeing one <code>= delete</code>;</li>
        <li>
          <code>static</code> members, <code>friend</code>, and <code>mutable</code>.
        </li>
      </ul>
      <p>
        All of that is in <a href="/cpp/classes">Classes, Constructors &amp; the Rule of
        Zero/Three/Five</a>, with the measurements. Next up is{' '}
        <a href="/cpp/raii">RAII</a>, which puts the constructor/destructor pair you just read to
        work; if a piece of class syntax there trips you, this page is the lookup.
      </p>
    </LessonLayout>
  );
}

export default CppClassPrimer;
