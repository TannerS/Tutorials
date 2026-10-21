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

function Templates() {
  return (
    <LessonLayout
      title="Templates & Generic Programming"
      sectionId="cpp"
      lessonIndex={13}
      prev={{ path: '/cpp/inheritance', label: 'Inheritance, Virtual Functions & vtables' }}
      next={{ path: '/cpp/concepts', label: 'Concepts & Compile-Time Constraints' }}
    >
      <p>
        <code>List&lt;String&gt;</code> and <code>vector&lt;string&gt;</code> look like the same
        idea in two syntaxes. They are not the same idea at all, and this is the single largest
        conceptual gap between the two languages — larger than anything in{' '}
        <a href="/cpp/inheritance">the last lesson</a>, larger than manual memory management, and
        the reason C++ build times and error messages have the reputation they do.
      </p>
      <p>
        Java generics are a <em>compile-time check over a single runtime class</em>. The angle
        brackets are erased; <code>ArrayList&lt;String&gt;</code> and{' '}
        <code>ArrayList&lt;Integer&gt;</code> are the same class, with the same bytecode, and a
        static field inside a generic class is shared across every parameterisation. C++ templates
        are a <em>code generator</em>. Each set of arguments you actually use produces a separate
        type with separately compiled machine code, its own{' '}
        <code>sizeof</code>, its own static members, and its own symbol in the binary.
      </p>
      <p>
        Four consequences, all measured on this page:
      </p>
      <ul>
        <li>
          <strong>There is no erasure, so the type is genuinely there at runtime.</strong> You will
          never get a <code>ClassCastException</code> out of a container, you can write{' '}
          <code>vector&lt;int&gt;</code> without boxing, and <code>sizeof(T)</code> works inside a
          template. The Java program below throws a <code>ClassCastException</code> from a{' '}
          <code>List&lt;Integer&gt;</code> that contains a <code>String</code>; the C++ equivalent
          cannot be written.
        </li>
        <li>
          <strong>You pay for it in generated code and in build time.</strong> Measured below:
          going from 1 to 200 distinct instantiations of one small function template took the
          compile from 296 ms to 11.9 seconds and the object file from 8.5 KB to 1.5 MB.
        </li>
        <li>
          <strong>The template body is not type-checked until somebody instantiates it.</strong> A
          template that calls <code>t.quack()</code> compiles fine as long as nobody ever passes it
          something that cannot quack. There are no bounded type parameters unless you add them —
          no <code>&lt;T extends Comparable&lt;T&gt;&gt;</code> — so a template is{' '}
          <em>duck-typed</em>, and the duck test happens at the instantiation site.
        </li>
        <li>
          <strong>That is where the error messages come from.</strong> The errors are not reported
          at your call; they are reported wherever inside the library the requirement was finally
          needed, with an instantiation stack back to you. One mistake on this page produced{' '}
          <strong>304 lines and 34,331 bytes of diagnostics, 20 errors, and then gave up because it
          hit the error limit</strong>. That section is read line by line, because you will hit this
          in your first hour.
        </li>
      </ul>
      <p>
        The last section is also the bridge forward: the same mistake written against a{' '}
        <strong>concept-constrained</strong> algorithm produced 34 lines and one error, starting at
        the line you wrote. That is what <a href="/cpp/concepts">the next lesson</a> is about.
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++ (<code>_LIBCPP_VERSION 220106</code>),{' '}
          <code>-std=c++23</code>. Every output block, error message, symbol listing, byte count and
          timing was captured from a real compile or run on this machine. The Java comparison is a
          real run on <strong>JDK 26.0.1</strong>. Build timings are best-of-N wall clock on an
          otherwise idle machine and are reported with the spread where it matters.
        </p>
      </InfoBox>

      <h2>Instantiation, Not Erasure</h2>
      <p>
        Start with the measurement, because it settles the whole model. One class template with a
        static member, one function template, and three different type arguments:
      </p>

      <CodeBlock language="cpp" title="inst.cpp">
{`#include <print>
#include <string>
#include <typeinfo>
#include <vector>

// A class template with a static member.
template <class T>
struct Box {
    static int instances;          // ONE PER INSTANTIATION, not one in total
    T value{};
    Box() { ++instances; }
};
template <class T> int Box<T>::instances = 0;

// A function template. One of these per T, in the binary.
template <class T>
T twice(T x) { return x + x; }

int main() {
    Box<int> a, b, c;
    Box<std::string> d;
    Box<double> e, f;

    std::println("Box<int>::instances         = {}", Box<int>::instances);
    std::println("Box<std::string>::instances = {}", Box<std::string>::instances);
    std::println("Box<double>::instances      = {}", Box<double>::instances);
    std::println("sizeof(Box<int>)            = {}", sizeof(Box<int>));
    std::println("sizeof(Box<double>)         = {}", sizeof(Box<double>));
    std::println("sizeof(Box<std::string>)    = {}", sizeof(Box<std::string>));
    std::println("typeid(Box<int>).name()     = {}", typeid(Box<int>).name());
    std::println("typeid(Box<double>).name()  = {}", typeid(Box<double>).name());
    std::println("same type?                  = {}", typeid(Box<int>) == typeid(Box<double>));
    std::println("twice(21)      = {}", twice(21));
    std::println("twice(1.5)     = {}", twice(1.5));
    std::println("twice(\\"ab\\"s)   = {}", twice(std::string{"ab"}));
    std::println("sizeof(std::vector<int>)         = {}", sizeof(std::vector<int>));
    std::println("sizeof(std::vector<char>)        = {}", sizeof(std::vector<char>));
    std::println("typeid same for the two vectors? = {}",
                 typeid(std::vector<int>) == typeid(std::vector<char>));
    (void)a; (void)b; (void)c; (void)d; (void)e; (void)f;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O0 inst.cpp && ./inst">
{`Box<int>::instances         = 3
Box<std::string>::instances = 1
Box<double>::instances      = 2
sizeof(Box<int>)            = 4
sizeof(Box<double>)         = 8
sizeof(Box<std::string>)    = 24
typeid(Box<int>).name()     = 3BoxIiE
typeid(Box<double>).name()  = 3BoxIdE
same type?                  = false
twice(21)      = 42
twice(1.5)     = 3
twice("ab"s)   = abab
sizeof(std::vector<int>)         = 24
sizeof(std::vector<char>)        = 24
typeid same for the two vectors? = false`}
      </CodeBlock>

      <p>
        (<code>twice(1.5) = 3</code> is not a typo — <code>std::format</code> prints the double{' '}
        <code>3.0</code> as <code>3</code>.)
      </p>
      <p>
        <strong>Three independent <code>instances</code> counters</strong>, reading 3, 1 and 2. Not
        one counter at 6. <code>Box&lt;int&gt;::instances</code> and{' '}
        <code>Box&lt;double&gt;::instances</code> are different objects in the binary, because{' '}
        <code>Box&lt;int&gt;</code> and <code>Box&lt;double&gt;</code> are different classes.
      </p>
      <p>
        <code>sizeof</code> differs per instantiation — 4, 8, 24 — because the <code>T</code> is
        laid out inline, not as a pointer to a boxed object. And the two{' '}
        <code>std::vector</code>s are the same <em>size</em> (three pointers each) but not the same{' '}
        <em>type</em>, which the <code>typeid</code> comparison confirms.
      </p>
      <p>
        You can see the generated functions in the object file:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O0 -c inst.cpp && nm inst.o | grep twice | c++filt">
{`00000000000008d4 T std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>> twice<std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>>(std::__1::basic_string<char, std::__1::char_traits<char>, std::__1::allocator<char>>)
0000000000000870 T double twice<double>(double)
000000000000080c T int twice<int>(int)`}
      </CodeBlock>

      <p>
        <strong>Three functions, three addresses, three bodies of machine code</strong>, generated
        from one source function. <code>twice&lt;int&gt;</code> is an integer add;{' '}
        <code>twice&lt;double&gt;</code> is a floating-point add; <code>twice&lt;string&gt;</code>{' '}
        is a string concatenation with an allocation in it. That is why templates cost nothing at
        runtime — there is nothing generic left by the time the program runs.
      </p>

      <h3>The same program in Java</h3>

      <CodeBlock language="java" title="Erasure.java">
{`import java.util.*;

class Box<T> {
    static int instances = 0;        // ONE IN TOTAL. Shared by every Box<...>.
    T value;
    Box() { instances++; }
}

public class Erasure {
    public static void main(String[] a) {
        Box<Integer> b1 = new Box<>(), b2 = new Box<>(), b3 = new Box<>();
        Box<String>  b4 = new Box<>();
        Box<Double>  b5 = new Box<>(), b6 = new Box<>();
        System.out.println("Box.instances (there is only one)  = " + Box.instances);

        List<String>  ls = new ArrayList<>();
        List<Integer> li = new ArrayList<>();
        System.out.println("ls.getClass()                      = " + ls.getClass().getName());
        System.out.println("li.getClass()                      = " + li.getClass().getName());
        System.out.println("same runtime class?                = " + (ls.getClass() == li.getClass()));

        // Erasure in action: the cast is unchecked, so this compiles with a
        // warning and blows up later, far from here.
        @SuppressWarnings({"unchecked", "rawtypes"})
        List raw = li;
        raw.add("not an integer");
        System.out.println("li.size() after adding a String    = " + li.size());
        try {
            Integer n = li.get(0);
            System.out.println("got " + n);
        } catch (ClassCastException e) {
            System.out.println("ClassCastException at the READ:    " + e.getMessage());
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java Erasure.java (JDK 26.0.1)">
{`Erasure.java:26: warning: [unchecked] unchecked call to add(E) as a member of the raw type List
        raw.add("not an integer");
               ^
  where E is a type-variable:
    E extends Object declared in interface List
1 warning
Box.instances (there is only one)  = 6
ls.getClass()                      = java.util.ArrayList
li.getClass()                      = java.util.ArrayList
same runtime class?                = true
li.size() after adding a String    = 1
ClassCastException at the READ:    class java.lang.String cannot be cast to class java.lang.Integer (java.lang.String and java.lang.Integer are in module java.base of loader 'bootstrap')`}
      </CodeBlock>

      <p>
        <code>Box.instances = 6</code> against C++&apos;s 3 / 1 / 2. One static field, shared,
        because there is one <code>Box</code> class. <code>ls.getClass() == li.getClass()</code>{' '}
        is <code>true</code>: at runtime those two lists are indistinguishable, which is both why
        erasure is cheap and why the <code>ClassCastException</code> is possible at all. The
        exception fired at the <em>read</em>, not at the bad <code>add</code> — the classic
        signature of erasure, a failure reported a long way from its cause.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}></th>
            <th style={headStyle}>Java generics</th>
            <th style={headStyle}>C++ templates</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>Runtime representation</td>
            <td style={cellStyle}>One class. Type arguments erased. Measured:{' '}
              <code>getClass()</code> identical.</td>
            <td style={cellStyle}>A distinct type per argument list. Measured: different{' '}
              <code>typeid</code>, different <code>sizeof</code>, three separate symbols.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Static members</td>
            <td style={cellStyle}>One, shared. Measured: <code>6</code>.</td>
            <td style={cellStyle}>One per instantiation. Measured: <code>3</code>,{' '}
              <code>1</code>, <code>2</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Primitives</td>
            <td style={cellStyle}>Boxed. <code>List&lt;Integer&gt;</code>, never{' '}
              <code>List&lt;int&gt;</code>.</td>
            <td style={cellStyle}>Inline. <code>vector&lt;int&gt;</code> stores{' '}
              <code>int</code>s contiguously, no indirection.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Type checking of the body</td>
            <td style={cellStyle}>Once, against the declared bound. Checked even if never
              used.</td>
            <td style={cellStyle}>At each instantiation, against the actual type. Never checked
              if never instantiated.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Constraints</td>
            <td style={cellStyle}><code>&lt;T extends Comparable&lt;T&gt;&gt;</code>, and the
              compiler enforces it at the declaration.</td>
            <td style={cellStyle}>None by default — duck typing. Opt in with{' '}
              <a href="/cpp/concepts">concepts</a> (C++20) or{' '}
              <code>static_assert</code>/SFINAE before that.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Cost</td>
            <td style={cellStyle}>Zero code growth. Boxing, casts and megamorphic call sites at
              runtime.</td>
            <td style={cellStyle}>Zero runtime cost. Code growth and build time. Measured: 200
              instantiations &rarr; 11.9 s and 1.5 MB.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>Where mistakes surface</td>
            <td style={cellStyle}>At the declaration, or as a{' '}
              <code>ClassCastException</code> at runtime.</td>
            <td style={cellStyle}>At compile time, inside the library, with an instantiation
              stack. Measured: 304 lines for one mistake.</td>
          </tr>
        </tbody>
      </table>

      <FlowChart
        title="What the compiler does with a template, and what Java does instead"
        chart={
          'graph TD\n' +
          '  SRC["template &lt;class T&gt;<br/>T twice(T x) { return x + x; }<br/>in a header"] --> NONE["By itself this generates NO CODE.<br/>Measured: an object file compiled from a TU<br/>containing only the definition held one<br/>symbol — ltmp0. Nothing else."]\n' +
          '  NONE --> USE["Somebody writes twice(21)"]\n' +
          '  USE --> D1["1. DEDUCTION<br/>Match the argument types against the<br/>parameter pattern to find T.<br/>Measured: no common-type coercion —<br/>twice(1, 2.0) is an error, not a double."]\n' +
          '  D1 --> D2["2. SUBSTITUTION<br/>Make a copy of the body with T replaced<br/>by int. This copy is a real function."]\n' +
          '  D2 --> D3["3. TYPE-CHECK THE COPY<br/>Only now is x + x checked, against int.<br/>This is why a template that calls<br/>t.quack() compiles until somebody<br/>instantiates it with a non-duck."]\n' +
          '  D3 --> D4["4. EMIT A DISTINCT SYMBOL<br/>Measured, nm: three separate functions<br/>at three addresses for int, double and<br/>std::string."]\n' +
          '  D4 --> ODR["5. The SAME instantiation in another TU<br/>is emitted again, as a weak symbol, and<br/>the linker discards the duplicates.<br/>That is the work you pay for twice.<br/>See the one-definition rule lesson."]\n' +
          '  D4 --> COST["Measured cost of step 4:<br/>1 instantiation = 296 ms, 8.5 KB object<br/>10 = 790 ms, 77 KB<br/>50 = 3.06 s, 382 KB<br/>200 = 11.9 s, 1.5 MB"]\n' +
          '  SRC --> JAVA["JAVA, for contrast:<br/>class Box&lt;T&gt; compiles ONCE, to one<br/>class file. T becomes Object.<br/>Measured: ArrayList&lt;String&gt; and<br/>ArrayList&lt;Integer&gt; have the same<br/>getClass(); one static field shared<br/>by all parameterisations, reading 6."]\n' +
          '  JAVA --> JCOST["So Java pays nothing at build time and<br/>pays at RUNTIME instead: boxing, casts,<br/>and a ClassCastException reported at the<br/>read rather than at the bad write."]\n' +
          '  style NONE fill:#1a2744,stroke:#5b9cf6\n' +
          '  style D3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style COST fill:#3d2f14,stroke:#fb923c\n' +
          '  style ODR fill:#3d2f14,stroke:#fb923c\n' +
          '  style D4 fill:#1a3329,stroke:#4ade80\n' +
          '  style JAVA fill:#2a1f44,stroke:#a78bfa\n' +
          '  style JCOST fill:#2a1f44,stroke:#a78bfa'
        }
      />

      <h2>The Three Kinds Of Template Parameter</h2>
      <p>
        Java has one kind: a type parameter, optionally bounded. C++ has three, and the second one
        has no Java analogue at all.
      </p>
      <ul>
        <li><strong>Type parameters</strong> — <code>template &lt;class T&gt;</code>. The familiar
          one. <code>class</code> and <code>typename</code> are interchangeable here.</li>
        <li><strong>Non-type parameters</strong> — <code>template &lt;std::size_t N&gt;</code>. A{' '}
          <em>value</em> baked into the type. This is how <code>std::array&lt;int, 3&gt;</code>{' '}
          knows its own size with no runtime storage, and it is why{' '}
          <code>std::array&lt;int, 3&gt;</code> and <code>std::array&lt;int, 4&gt;</code> are
          unrelated types.</li>
        <li><strong>Template template parameters</strong> —{' '}
          <code>template &lt;template &lt;class&gt; class Container&gt;</code>. Rare; you will read
          it more often than write it.</li>
      </ul>

      <CodeBlock language="cpp" title="nttp.cpp">
{`#include <array>
#include <print>
#include <type_traits>

// A non-type template parameter: the VALUE is part of the type.
template <class T, std::size_t N>
struct FixedBuffer {
    T data[N]{};
    static constexpr std::size_t capacity = N;
};

// C++17: 'auto' as a non-type parameter -- the type is deduced from the value.
template <auto V>
constexpr auto twice_v = V + V;

// C++20: a structural class type as a non-type parameter. This is how
// compile-time strings work.
template <std::size_t N>
struct FixedString {
    char chars[N]{};
    constexpr FixedString(const char (&s)[N]) { for (std::size_t i = 0; i < N; ++i) chars[i] = s[i]; }
};
template <FixedString S>
constexpr std::size_t name_length = sizeof(S.chars) - 1;

int main() {
    std::println("sizeof(FixedBuffer<int,4>)   = {}", sizeof(FixedBuffer<int, 4>));
    std::println("sizeof(FixedBuffer<int,16>)  = {}", sizeof(FixedBuffer<int, 16>));
    std::println("same type?                   = {}",
                 std::is_same_v<FixedBuffer<int, 4>, FixedBuffer<int, 16>>);
    std::println("twice_v<21>                  = {}  (type int?    {})",
                 twice_v<21>, std::is_same_v<decltype(twice_v<21>), const int>);
    std::println("twice_v<1.5>                 = {}  (type double? {})",
                 twice_v<1.5>, std::is_same_v<decltype(twice_v<1.5>), const double>);
    std::println("name_length<\\"postgres\\">      = {}", name_length<"postgres">);
    std::array<int, 3> a{1, 2, 3};
    std::println("std::array<int,3> size is part of the type: {}", a.size());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 nttp.cpp && ./nttp">
{`sizeof(FixedBuffer<int,4>)   = 16
sizeof(FixedBuffer<int,16>)  = 64
same type?                   = false
twice_v<21>                  = 42  (type int?    true)
twice_v<1.5>                 = 3  (type double? true)
name_length<"postgres">      = 8
std::array<int,3> size is part of the type: 3`}
      </CodeBlock>

      <p>
        <code>template &lt;auto V&gt;</code> deduced <code>int</code> from <code>21</code> and{' '}
        <code>double</code> from <code>1.5</code> — a non-type parameter whose <em>type</em> is
        also deduced, which is C++17. And <code>name_length&lt;"postgres"&gt;</code> computing{' '}
        <code>8</code> is a C++20 feature: a class type with all-public members and no custom
        copy/destructor can be a template argument, which is how compile-time string handling works
        in modern C++. There is no Java construct in the neighbourhood of either.
      </p>

      <h2>Deduction, And Where It Refuses</h2>
      <p>
        Template argument deduction matches the types of your arguments against the pattern of the
        parameters. It is a pattern match, <strong>not an overload resolution</strong>, and the
        difference catches everyone:
      </p>

      <CodeBlock language="cpp" title="deduce.cpp">
{`#include <string>

template <class T>
T larger(T a, T b) { return a < b ? b : a; }

int main() {
    larger(1, 2);                 // ok: both int
    larger(1, 2.0);               // deduction conflict
    larger(1, 2L);                // deduction conflict
    larger<double>(1, 2.0);       // ok: T supplied, both convert
    larger(std::string{"a"}, "b");// deduction conflict: string vs const char[2]
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only deduce.cpp">
{`deduce.cpp:8:5: error: no matching function for call to 'larger'
    8 |     larger(1, 2.0);               // deduction conflict
      |     ^~~~~~
deduce.cpp:4:3: note: candidate template ignored: deduced conflicting
      types for parameter 'T' ('int' vs. 'double')
    4 | T larger(T a, T b) { return a < b ? b : a; }
      |   ^
deduce.cpp:9:5: error: no matching function for call to 'larger'
    9 |     larger(1, 2L);                // deduction conflict
      |     ^~~~~~
deduce.cpp:4:3: note: candidate template ignored: deduced conflicting
      types for parameter 'T' ('int' vs. 'long')
    4 | T larger(T a, T b) { return a < b ? b : a; }
      |   ^
deduce.cpp:11:5: error: no matching function for call to 'larger'
   11 |     larger(std::string{"a"}, "b");// deduction conflict: string v...
      |     ^~~~~~
deduce.cpp:4:3: note: candidate template ignored: deduced conflicting
      types for parameter 'T' ('std::string' (aka 'basic_string<char>')
      vs. 'const char *')
    4 | T larger(T a, T b) { return a < b ? b : a; }
      |   ^
3 errors generated.`}
      </CodeBlock>

      <p>
        <code>larger(1, 2.0)</code> does not deduce <code>double</code> and promote the{' '}
        <code>1</code>. It does not deduce anything — <strong>deduction never applies conversions
        to make two deductions agree</strong>, so <code>int</code> against <code>double</code> is a
        conflict and the candidate is dropped. <code>larger(1, 2L)</code> fails the same way, and so
        does <code>std::string</code> against a string literal, which is particularly surprising
        because everything else in the language converts those happily.
      </p>
      <p>
        <code>candidate template ignored: deduced conflicting types for parameter &apos;T&apos;</code>{' '}
        is the message to recognise. The four fixes, in rough order of how often each is right:
      </p>
      <ul>
        <li><strong>Supply the argument explicitly:</strong> <code>larger&lt;double&gt;(1, 2.0)</code>.
          Deduction is skipped, ordinary conversions apply.</li>
        <li><strong>Use two parameters:</strong>{' '}
          <code>template &lt;class A, class B&gt; auto larger(A a, B b) -&gt;
          std::common_type_t&lt;A, B&gt;</code>.</li>
        <li><strong>Use <code>auto</code> parameters</strong>, which is the same thing with less
          ceremony: <code>auto larger(auto a, auto b)</code> is an abbreviated function template in
          C++20, and each <code>auto</code> is its own parameter.</li>
        <li><strong>Constrain it,</strong> which is{' '}
          <a href="/cpp/concepts">the next lesson</a> and the one that also fixes the error
          message.</li>
      </ul>

      <h3>CTAD: deduction for class templates</h3>
      <p>
        Before C++17, class template arguments were never deduced — you wrote{' '}
        <code>std::pair&lt;int, std::string&gt; p{'{'}1, "one"{'}'}</code> in full, or used a{' '}
        <code>make_</code> helper function whose only job was to get deduction for you (which is why{' '}
        <code>std::make_pair</code> exists). <strong>Class template argument deduction</strong>{' '}
        removed that:
      </p>

      <CodeBlock language="cpp" title="ctad.cpp — abridged; the std::println assertions are shown as output below">
{`// A class template with a constructor.
template <class A, class B>
struct Pair {
    A first;
    B second;
    Pair(A a, B b) : first(std::move(a)), second(std::move(b)) {}
};

// A deduction guide: tells CTAD to decay const char* to std::string.
template <class A, class B> Pair(A, B) -> Pair<A, B>;
Pair(const char*, const char*) -> Pair<std::string, std::string>;

int main() {
    std::vector v{1, 2, 3};                   // vector<int>
    std::vector w{1.5, 2.5};                  // vector<double>
    std::pair  p{1, std::string{"one"}};      // pair<int, string>
    std::array arr{1, 2, 3, 4};               // array<int, 4>

    Pair q{1, 2.5};                           // Pair<int, double>
    Pair r{"hello", "world"};                 // the guide fires

    std::vector x{v};                         // a COPY, not vector<vector<int>>
    auto s = "literal";                       // const char*, not std::string
    // ... assertions printed below
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ctad.cpp && ./ctad">
{`std::vector v{1,2,3}      -> element is int?    true
std::vector w{1.5,2.5}    -> element is double? true
std::pair p{1, string}    -> true
std::array arr{1,2,3,4}   -> array<int,4>?      true  size=4

Pair q{1, 2.5}            -> Pair<int,double>?  true
Pair r{"hello","world"}  -> Pair<string,string>? true  (hello / world)

std::vector x{v}          -> vector<int> (a COPY)? true  size=3
auto s = "literal"         -> const char*? true
  decltype(1 + 2.0)                  int? false double? true  string? false`}
      </CodeBlock>

      <p>
        Three things in that output are worth keeping.
      </p>
      <ul>
        <li>
          <strong><code>std::array arr{'{'}1,2,3,4{'}'}</code> deduced{' '}
          <code>std::array&lt;int, 4&gt;</code></strong> — the <em>count</em> as well as the
          element type, because the count is a non-type parameter.
        </li>
        <li>
          <strong>A deduction guide made <code>Pair r{'{'}"hello","world"{'}'}</code> a{' '}
          <code>Pair&lt;std::string, std::string&gt;</code></strong>, not a{' '}
          <code>Pair&lt;const char*, const char*&gt;</code>. Without the guide you would get
          dangling-pointer-shaped members. That is exactly why the standard library ships a guide
          for <code>std::vector(It, It)</code> and friends.
        </li>
        <li>
          <strong><code>std::vector x{'{'}v{'}'}</code> is a copy of <code>v</code>,</strong> not a{' '}
          <code>vector&lt;vector&lt;int&gt;&gt;</code> containing it. The copy constructor is a
          better match than the initialiser-list constructor, and this is the one CTAD surprise
          that bites in real code.
        </li>
      </ul>

      <h2>Duck-Typed Until Somebody Instantiates It</h2>
      <p>
        This is the property Java does not have, and the one that produces the error messages. A
        C++ template body is parsed when the compiler reads it, but the parts that{' '}
        <em>depend on the template parameters</em> are not checked until an instantiation supplies
        actual types. So a template can call a method that does not exist on any type in your
        program, and compile.
      </p>

      <CodeBlock language="cpp" title="duck.cpp">
{`#include <print>

// This template body calls .quack(). Nothing in the language says T must
// have one, and nothing checks until somebody instantiates it.
template <class T>
void make_noise(const T& t) { t.quack(); }

struct Duck  { void quack() const { std::println("  quack"); } };
struct Robot { void beep()  const { std::println("  beep");  } };

int main() {
    make_noise(Duck{});
    // make_noise(Robot{});     // <- uncomment and THIS is when it breaks
    std::println("compiled and ran, and make_noise<Robot> was never checked");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 duck.cpp && ./duck">
{`  quack
compiled and ran, and make_noise<Robot> was never checked`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same file with that line uncommented">
{`duck.cpp:7:33: error: no member named 'quack' in 'Robot'
    7 | void make_noise(const T& t) { t.quack(); }
      |                               ~ ^
duck.cpp:14:5: note: in instantiation of function template specialization
      'make_noise<Robot>' requested here
   14 |     make_noise(Robot{});          // <- uncomment and THIS is whe...
      |     ^
1 error generated.`}
      </CodeBlock>

      <p>
        Note the shape of that error, because it is the shape of every template error:{' '}
        <strong>the <code>error:</code> is at line 7 — inside the template — and your call site is
        a <code>note:</code> underneath it.</strong> With one level of templates that is fine and
        even helpful. With <code>std::sort</code>&apos;s eight levels of internal helpers it is the
        304-line monster later on this page.
      </p>
      <p>
        The upside is real, though. Duck typing is why <code>std::sort</code> works on your own
        types without them inheriting from anything, why a &quot;container&quot; in C++ is anything
        with <code>begin()</code> and <code>end()</code> rather than anything implementing an
        interface, and why <code>std::vector&lt;int&gt;</code> can exist. Java&apos;s{' '}
        <code>&lt;T extends Comparable&lt;T&gt;&gt;</code> buys you better errors by requiring
        every usable type to have been designed to fit — which is why{' '}
        <code>int</code> cannot.
      </p>

      <InfoBox variant="warning" title="The two keywords this forces on you: typename and template">
        <p>
          Because the compiler parses the template body before it knows what <code>T</code> is, it
          cannot tell whether <code>C::value_type</code> names a type or a static member. It assumes{' '}
          <em>member</em>, and you have to say otherwise:
        </p>
        <CodeBlock language="cpp" title="tname.cpp — #include &lt;vector&gt; elided; the error line numbers are from the real file">
{`template <class C>
void f(const C& c) {
    C::value_type x = c.front();         // is value_type a type or a value?
    typename C::value_type y = c.front();// ok: we said it is a type
    (void)x; (void)y;
}
int main() { f(std::vector<int>{1}); }`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only tname.cpp">
{`tname.cpp:4:5: error: missing 'typename' prior to dependent type name
      'C::value_type'
    4 |     C::value_type x = c.front();         // is value_type a type o...
      |     ^~~~~~~~~~~~~
      |     typename
1 error generated.`}
        </CodeBlock>
        <p>
          Checked rather than assumed, because C++20&apos;s{' '}
          <em>Down with <code>typename</code></em> change made the keyword optional in a long list
          of contexts — but <strong>not this one</strong>, a declaration inside a function body, as
          the error above confirms on <code>-std=c++23</code>. At least clang now tells you exactly
          what to type.
        </p>
        <p>
          The same ambiguity gives you the <code>template</code> disambiguator:{' '}
          <code>obj.template get&lt;0&gt;()</code>, needed when the member is itself a template and
          the compiler would otherwise read <code>&lt;</code> as less-than. If you have ever
          wondered what that line noise in a library header was, that is it.
        </p>
      </InfoBox>

      <h2>Why Templates Live In Headers — And What It Costs</h2>
      <p>
        If the compiler generates code per instantiation, it needs the full definition at every
        point of instantiation. Put a template definition in a <code>.cpp</code> and the shape of
        the failure is instructive: <strong>both translation units compile cleanly and the link
        fails.</strong>
      </p>

      <CodeBlock language="cpp" title="maxv.h / maxv.cpp / main.cpp — the ordinary-function layout, applied to a template">
{`// ---- maxv.h ----
#pragma once
// DECLARATION only. The definition is in maxv.cpp, like a normal function.
template <class T>
T maxv(T a, T b);

// ---- maxv.cpp ----
#include "maxv.h"
template <class T>
T maxv(T a, T b) { return a < b ? b : a; }

// ---- main.cpp ----
#include <print>
#include "maxv.h"
int main() {
    std::println("maxv(3, 7)     = {}", maxv(3, 7));
    std::println("maxv(1.5, 0.5) = {}", maxv(1.5, 0.5));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — compile each TU, then link">
{`$ clang++ -std=c++23 -Wall -Wextra -c maxv.cpp -o maxv.o
$ clang++ -std=c++23 -Wall -Wextra -c main.cpp -o main.o
both TUs compiled with no errors

$ clang++ maxv.o main.o -o app
Undefined symbols for architecture arm64:
  "double maxv<double>(double, double)", referenced from:
      _main in main.o
  "int maxv<int>(int, int)", referenced from:
      _main in main.o
ld: symbol(s) not found for architecture arm64
clang++: error: linker command failed with exit code 1 (use -v to see invocation)

$ nm maxv.o | c++filt
0000000000000000 t ltmp0`}
      </CodeBlock>

      <p>
        That last line is the whole explanation. <strong><code>maxv.o</code> contains one symbol,{' '}
        <code>ltmp0</code>, and no code for <code>maxv</code> at all.</strong> A template definition
        on its own is not a function; it is a recipe. The TU that had the recipe never used it, so
        nothing was generated. The TU that used it never had the recipe, so it emitted calls to
        functions nobody wrote.
      </p>
      <p>
        This is the same &quot;undefined symbols&quot; family{' '}
        <a href="/cpp/compiling">the compiling and linking lesson</a> covered, with a new cause.
        There are two fixes, and the second one is why almost every template you will ever see is
        header-only.
      </p>

      <h3>Fix 1: explicit instantiation (works, and is limiting)</h3>
      <p>
        Append two lines to <code>maxv.cpp</code> — no body, no <code>=</code>, just the word{' '}
        <code>template</code> in front of a declaration:
      </p>

      <CodeBlock language="cpp" title="maxv.cpp, with explicit instantiation definitions added">
{`#include "maxv.h"
template <class T>
T maxv(T a, T b) { return a < b ? b : a; }

// Explicit instantiation definitions: force the compiler to emit these two.
template int    maxv<int>(int, int);
template double maxv<double>(double, double);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — recompile, inspect, link, run">
{`$ clang++ -std=c++23 -Wall -Wextra -c maxv.cpp -o maxv.o && nm maxv.o | c++filt
0000000000000044 T double maxv<double>(double, double)
0000000000000000 T int maxv<int>(int, int)
0000000000000000 t ltmp0
0000000000000088 s ltmp1

$ clang++ maxv.o main.o -o app && ./app
maxv(3, 7)     = 7
maxv(1.5, 0.5) = 1.5`}
      </CodeBlock>

      <p>
        Two symbols appeared where there had been none, the link succeeded, and the program ran. And
        then a caller wanting a third type:
      </p>

      <CodeBlock language="cpp" title="main2.cpp">
{`#include <print>
#include "maxv.h"
int main() { std::println("{}", maxv(1L, 2L)); }   // long: never instantiated`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -c main2.cpp -o main2.o && clang++ maxv.o main2.o -o app2">
{`Undefined symbols for architecture arm64:
  "long maxv<long>(long, long)", referenced from:
      _main in main2.o
ld: symbol(s) not found for architecture arm64
clang++: error: linker command failed with exit code 1 (use -v to see invocation)`}
      </CodeBlock>

      <p>
        <code>template int maxv&lt;int&gt;(int, int);</code> tells the compiler &quot;generate this
        one, here&quot;. It works, and the catch is in that last error: you have to enumerate every
        type in advance, and a caller who wants one you did not list gets a link error rather than
        a working program.
      </p>
      <p>
        That restriction is occasionally exactly what you want, and the standard library on this
        machine uses it. <code>&lt;string&gt;</code> declares its <code>char</code> and{' '}
        <code>wchar_t</code> instantiations <code>extern</code> so that every translation unit
        using <code>std::string</code> links against the copy in the dylib instead of generating
        its own:
      </p>
      <CodeBlock language="cpp" title="/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/include/c++/v1/string, around line 2595">
{`#  define _LIBCPP_DECLARE(...) extern template _LIBCPP_EXPORTED_FROM_ABI __VA_ARGS__;
#  ifdef _LIBCPP_ABI_STRING_OPTIMIZED_EXTERNAL_INSTANTIATION
_LIBCPP_STRING_UNSTABLE_EXTERN_TEMPLATE_LIST(_LIBCPP_DECLARE, char)
#    if _LIBCPP_HAS_WIDE_CHARACTERS
_LIBCPP_STRING_UNSTABLE_EXTERN_TEMPLATE_LIST(_LIBCPP_DECLARE, wchar_t)
#    endif
#  else
_LIBCPP_STRING_V1_EXTERN_TEMPLATE_LIST(_LIBCPP_DECLARE, char)`}
      </CodeBlock>
      <p>
        <code>extern template</code> is the other half of the feature — an explicit instantiation{' '}
        <em>declaration</em>, meaning &quot;do not generate this here, somebody else has it&quot;.
        Paired with an explicit instantiation <em>definition</em> in one TU, it is a legitimate
        build-time optimisation for a template with a small, fixed set of uses. It is still the
        wrong default for your own code.
      </p>

      <h3>Fix 2: put it in the header — and measure what that costs</h3>
      <p>
        The normal answer is that the definition goes in the header, and the <code>inline</code>-like
        ODR exemption for templates lets every TU emit its own copy for the linker to merge.
        Nothing about that is free, and the price is the thing C++ is most often complained about.
        First, what a header costs to <em>read</em>:
      </p>

      <CodeBlock language="cpp" title="t3.cpp — the heaviest of the four programs measured below">
{`#include <algorithm>
#include <print>
#include <ranges>
#include <string>
#include <vector>
int main() {
    std::vector<std::string> v{"b","a","c"};
    std::ranges::sort(v);
    std::println("{}", v);
    return 0;
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real measurements — clang++ -std=c++23 -E | wc -l / wc -c, and clang++ -std=c++23 -O2 wall time, best of 5">
{`                                               preprocessed      compile+link
t0.cpp  int main() { return 0; }                     8 lines           117 ms
                                                   154 bytes
t1.cpp  + <cstdio>                                 711 lines           125 ms
                                                31,211 bytes
t2.cpp  + <vector>                              40,476 lines           310 ms
                                             1,750,028 bytes
t3.cpp  + <algorithm> <print> <ranges>          71,115 lines           925 ms
          <string> <vector>                  3,147,942 bytes`}
      </CodeBlock>

      <p>
        <strong>That eleven-line program takes 925 ms to build, against 117 ms for an empty{' '}
        <code>main</code>.</strong> Eight times the time, and 3.1 MB of preprocessed source, for
        four lines of logic. None of that is your code; it is 71,115 lines of template definitions
        that have to be parsed in every translation unit that includes them.
      </p>
      <p>
        Second, what instantiation costs. Same template, same body, increasing numbers of distinct
        type arguments:
      </p>

      <CodeBlock language="cpp" title="The generated benchmark — abridged; the real files declare N structs and call work&lt;Si&gt;() once for each">
{`#include <algorithm>
#include <vector>

template <class T>
std::size_t work() {
    std::vector<T> v(4);
    std::ranges::sort(v, [](const T& a, const T& b) { return a.k < b.k; });
    return v.size();
}

struct S0 { int k; double pad[4]; };     // ... repeated N times
// int main() { t += work<S0>(); ... }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -c, best of 3">
{`1    instantiations:      296 ms   object file     8,528 bytes
10   instantiations:      790 ms   object file    77,056 bytes
50   instantiations:     3062 ms   object file   381,912 bytes
200  instantiations:    11945 ms   object file 1,525,496 bytes`}
      </CodeBlock>

      <p>
        Roughly linear in both: about <strong>58 ms and 7.6 KB per distinct instantiation</strong>{' '}
        of a three-line function that calls <code>sort</code>. Two hundred of them — which is not a
        large number for a real codebase&apos;s worth of entity types — is twelve seconds in one
        translation unit and one and a half megabytes of object code.
      </p>
      <p>
        That is the trade in full. Java pays at runtime, in boxing and casts and megamorphic
        dispatch, and compiles instantly. C++ pays at build time, in parsing and instantiation and
        code size, and runs with nothing generic left. Neither is free; they are bills payable at
        different times.
      </p>

      <InfoBox variant="tip" title="The practical mitigations, in order of effect">
        <ul>
          <li>
            <strong>Do not template what does not need to be templated.</strong> The largest
            reductions come from moving non-dependent code out of a template body into an ordinary
            function it calls. Code that does not mention <code>T</code> does not need to be
            generated once per <code>T</code>.
          </li>
          <li>
            <strong>Type-erase at the boundary.</strong> A function taking{' '}
            <code>std::span&lt;const int&gt;</code> or <code>std::string_view</code> is instantiated
            once for all callers; the same function templated on the container type is instantiated
            per container.
          </li>
          <li>
            <strong>Explicit instantiation</strong> for a template with a known, small set of uses
            — as libc++ does for <code>std::string</code>.
          </li>
          <li>
            <strong>Include less.</strong> <code>&lt;vector&gt;</code> alone was 40,476 lines
            against <code>&lt;algorithm&gt; &lt;print&gt; &lt;ranges&gt; &lt;string&gt;
            &lt;vector&gt;</code> at 71,115. Forward declarations and narrow includes still
            matter.
          </li>
          <li>
            <strong>Precompiled headers</strong> (<code>-include-pch</code>) and, properly, C++20{' '}
            <strong>modules</strong>, which parse an interface once instead of once per TU.{' '}
            <a href="/cpp/compiling">The compiling lesson</a> covers where module support on this
            toolchain actually stands — it is not a thing to bet a build on yet.
          </li>
        </ul>
      </InfoBox>

      <h2>Specialisation</h2>
      <p>
        Specialisation is how you say &quot;the general version is wrong for this particular
        type&quot;. It has no Java analogue, because with one erased implementation there is nothing
        to specialise. There are two kinds, and the difference between them is the difference
        between one type and a family of types.
      </p>

      <CodeBlock language="cpp" title="spec.cpp — includes and main() elided">
{`// ---- The primary template ----
template <class T>
struct Serialiser {
    static std::string to_text(const T&) { return std::format("<generic {}>", sizeof(T)); }
};

// ---- FULL (explicit) specialisation: one exact type ----
template <>
struct Serialiser<bool> {
    static std::string to_text(const bool& v) { return v ? "true" : "false"; }
};
template <>
struct Serialiser<std::string> {
    static std::string to_text(const std::string& v) { return "\\"" + v + "\\""; }
};

// ---- PARTIAL specialisation: a FAMILY of types ----
template <class T>
struct Serialiser<std::vector<T>> {               // any vector
    static std::string to_text(const std::vector<T>& v) {
        std::string out = "[";
        for (std::size_t i = 0; i < v.size(); ++i) {
            if (i) out += ", ";
            out += Serialiser<T>::to_text(v[i]);   // recurse into the element
        }
        return out + "]";
    }
};
template <class T>
struct Serialiser<T*> {                           // any pointer
    static std::string to_text(T* p) {
        return p ? "->" + Serialiser<T>::to_text(*p) : "null";
    }
};

// ---- Function templates: full specialisation works, PARTIAL does not ----
template <class T> std::string name()        { return "something"; }
template <>        std::string name<int>()   { return "int"; }
template <>        std::string name<bool>()  { return "bool"; }

// You cannot partially specialise a function template. You OVERLOAD instead,
// and overload resolution prefers the more specialised one.
template <class T> std::string kind(T)        { return "value"; }
template <class T> std::string kind(T*)       { return "pointer"; }
template <class T> std::string kind(std::vector<T>) { return "vector"; }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 spec.cpp && ./spec">
{`Serialiser<int>          : <generic 4>
Serialiser<bool>         : true
Serialiser<std::string>  : "hi"
Serialiser<vector<bool>> : [true, false, true]
nested                   : [["a", "b"], ["c"]]
Serialiser<int*>         : -><generic 4>
Serialiser<int*> (null)  : null

name<int>()   = int
name<bool>()  = bool
name<char>()  = something
kind(1)       = value
kind(&n)      = pointer
kind(vb)      = vector`}
      </CodeBlock>

      <p>
        The <code>nested</code> line is the point of partial specialisation:{' '}
        <code>[["a", "b"], ["c"]]</code> came out of one{' '}
        <code>Serialiser&lt;std::vector&lt;T&gt;&gt;</code> that recursed into{' '}
        <code>Serialiser&lt;T&gt;</code> twice, picking up the{' '}
        <code>std::string</code> full specialisation at the bottom. The compiler composed four
        specialisations without being told the combination existed.
      </p>
      <p>
        Two rules that will trip you:
      </p>
      <ul>
        <li>
          <strong>Function templates cannot be partially specialised.</strong> Only fully. Measured:
          <CodeBlock language="text" title="Real output — template <class T> void f<T*>(T*) {}">
{`spec2.cpp:2:25: error: function template partial specialization is not
      allowed
    2 | template <class T> void f<T*>(T*) {}     // partial specialisatio...
      |                         ^~~~~
1 error generated.`}
          </CodeBlock>
          The replacement is ordinary <strong>overloading</strong>, which is what{' '}
          <code>kind(T)</code>, <code>kind(T*)</code> and{' '}
          <code>kind(std::vector&lt;T&gt;)</code> above are — and the output confirms overload
          resolution picked the most specialised one every time.
        </li>
        <li>
          <strong>Prefer overloading to full function specialisation anyway</strong>, because an
          explicit specialisation specialises <em>one particular primary template</em> and is only
          considered after overload resolution has already picked that primary. If another overload
          wins, your specialisation is simply never called. Measured:
          <CodeBlock language="cpp" title="fspec.cpp">
{`template <class T> void g(T)  { std::println("  g(T)   primary"); }
template <class T> void g(T*) { std::println("  g(T*)  pointer overload"); }
template <> void g<int*>(int*) { std::println("  g<int*>(int*) SPECIALISATION of g(T)"); }

int main() { int n = 0; std::println("g(&n):"); g(&n); }`}
          </CodeBlock>
          <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 fspec.cpp && ./fspec">
{`g(&n):
  g(T*)  pointer overload`}
          </CodeBlock>
          <code>g&lt;int*&gt;(int*)</code> is a specialisation of <code>g(T)</code>, and{' '}
          <code>g(T*)</code> is a <em>better match</em> for <code>int*</code>, so{' '}
          <code>g(T*)</code> wins and the specialisation you wrote never runs — no warning, no
          error. (Moving the specialisation above or below the <code>g(T*)</code> declaration made
          no difference here; both orders printed the overload.) The modern answer for almost all
          of this is <code>if constexpr</code> or a constrained overload — the next two sections.
        </li>
      </ul>

      <h2>Variadic Templates And Fold Expressions</h2>
      <p>
        A <strong>parameter pack</strong> is zero or more template arguments. Java&apos;s varargs
        are an array of one type; a C++ pack is a heterogeneous list of types, known at compile
        time, with no array and no boxing. This is what makes{' '}
        <code>std::make_unique</code>, <code>emplace_back</code>, <code>std::tuple</code> and{' '}
        <code>std::format</code> possible.
      </p>
      <p>
        Packs used to require recursion with a base case. C++17 <strong>fold expressions</strong>{' '}
        replaced most of that with one line:
      </p>

      <CodeBlock language="cpp" title="variadic.cpp — includes and main() elided">
{`// --- The pre-C++17 way: recursion with a base case. Still common in the wild.
template <class T>
T sum_rec(T last) { return last; }
template <class T, class... Rest>
T sum_rec(T first, Rest... rest) { return first + sum_rec(rest...); }

// --- C++17 fold expressions. One line, no base case, no recursion.
template <class... Ts> auto sum(Ts... xs)       { return (... + xs); }        // unary left fold
template <class... Ts> auto sum_right(Ts... xs) { return (xs + ...); }        // unary right fold
template <class... Ts> auto sum_from(int i, Ts... xs) { return (i + ... + xs); } // binary fold

template <class... Ts> bool all_true(Ts... xs) { return (... && xs); }
template <class... Ts> bool any_true(Ts... xs) { return (... || xs); }

// Folding over a comma to run a statement per element.
template <class... Ts>
void print_each(const Ts&... xs) {
    ((std::print("[{}]", xs)), ...);
    std::println("");
}

// sizeof... and a fold over || to ask a question about the whole pack.
template <class... Ts>
void describe(const Ts&... xs) {
    std::println("  {} argument(s); any string? {}", sizeof...(Ts),
                 (std::is_same_v<Ts, std::string> || ...));
    print_each(xs...);
}

// Perfect forwarding a pack -- the std::make_unique shape.
struct Target {
    Target(int a, const std::string& b, double c) {
        std::println("  Target({}, {}, {})", a, b, c);
    }
};
template <class T, class... Args>
T build(Args&&... args) { return T(std::forward<Args>(args)...); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 variadic.cpp && ./variadic">
{`sum_rec(1,2,3,4)        = 10
sum(1,2,3,4)            = 10
sum(1.5, 2, 3)          = 6.5
sum_right(1,2,3,4)      = 10
sum_from(100, 1,2,3)    = 106
sum(std::string{"a"}, "b", "c") = abc

all_true(true,true,true) = true
all_true(true,false)     = false
any_true(false,false)    = false
all_true() on empty pack = true

  3 argument(s); any string? true
[1][2.5][three]
  0 argument(s); any string? false


  Target(1, two, 3.5)`}
      </CodeBlock>

      <p>
        Read <code>sum(1.5, 2, 3) = 6.5</code> against the deduction section above:{' '}
        <strong>a pack has no single <code>T</code> to conflict</strong>, so mixed types are
        fine — each argument gets its own type and the fold applies ordinary{' '}
        <code>operator+</code> rules. <code>sum(std::string{'{'}"a"{'}'}, "b", "c") = abc</code>{' '}
        works for the same reason: <code>string + const char* + const char*</code> is a valid
        left-fold.
      </p>
      <p>
        The syntax, since there are four forms and they look alike:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Form</th>
            <th style={headStyle}>Expands to</th>
            <th style={headStyle}>Empty pack</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>(... op xs)</code> unary left</td>
            <td style={cellStyle}><code>((x1 op x2) op x3) op x4</code></td>
            <td style={cellStyle}>Only legal for <code>&amp;&amp;</code> (<code>true</code>),{' '}
              <code>||</code> (<code>false</code>) and <code>,</code> (<code>void</code>)</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>(xs op ...)</code> unary right</td>
            <td style={cellStyle}><code>x1 op (x2 op (x3 op x4))</code></td>
            <td style={cellStyle}>Same three</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>(init op ... op xs)</code> binary left</td>
            <td style={cellStyle}><code>((init op x1) op x2) op x3</code></td>
            <td style={cellStyle}>Fine — yields <code>init</code></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>(xs op ... op init)</code> binary right</td>
            <td style={cellStyle}><code>x1 op (x2 op (x3 op init))</code></td>
            <td style={cellStyle}>Fine — yields <code>init</code></td>
          </tr>
        </tbody>
      </table>

      <p>
        That last column is a real error, not a footnote. <code>all_true()</code> on an empty pack
        returned <code>true</code> because <code>&amp;&amp;</code> has an identity value;{' '}
        <code>sum()</code> on an empty pack does not compile:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only variadic2.cpp">
{`variadic2.cpp:1:53: error: unary fold expression has empty expansion for
      operator '+' with no fallback value
    1 | template <class... Ts> auto sum(Ts... xs) { return (... + xs); }
      |                                                     ^
variadic2.cpp:2:21: note: in instantiation of function template
      specialization 'sum<>' requested here
    2 | int main() { return sum(); }
      |                     ^
1 error generated.`}
      </CodeBlock>

      <p>
        The fix is the binary form with an explicit initial value:{' '}
        <code>(0 + ... + xs)</code>. Which is also better style, because it pins down the result
        type.
      </p>

      <h2><code>if constexpr</code></h2>
      <p>
        <code>if constexpr</code> is a compile-time branch, and the thing that makes it more than
        syntax sugar is that <strong>the branch not taken is not instantiated</strong>. It may
        therefore contain code that would be ill-formed for this <code>T</code>.
      </p>

      <CodeBlock language="cpp" title="ifconst.cpp — includes and main() elided">
{`template <class T>
std::string describe(const T& v) {
    if constexpr (std::is_integral_v<T>) {
        return std::format("integral, {} bits, value {}", sizeof(T) * 8, v);
    } else if constexpr (std::is_floating_point_v<T>) {
        return std::format("floating point, value {:.3f}", v);
    } else if constexpr (requires { v.size(); }) {
        // v.size() does not exist for int. This line is never compiled for int.
        return std::format("has size(), {} element(s)", v.size());
    } else {
        return "something else";
    }
}

// The pre-C++17 shape of the same thing: tag dispatch, three overloads.
template <class T> std::string old_way(const T& v, std::true_type)  { return std::format("integral {}", v); }
template <class T> std::string old_way(const T& v, std::false_type) { return std::format("not integral, {} bytes", sizeof(v)); }
template <class T> std::string old_way(const T& v) { return old_way(v, std::is_integral<T>{}); }

// if constexpr also prunes recursion -- this terminates without a base case
// specialisation.
template <int N>
constexpr int fact() {
    if constexpr (N <= 1) return 1;
    else                  return N * fact<N - 1>();
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 ifconst.cpp && ./ifconst">
{`describe(42)             : integral, 32 bits, value 42
describe(short{7})       : integral, 16 bits, value 7
describe(3.14159)        : floating point, value 3.142
describe(std::string)    : has size(), 5 element(s)
describe(vector<int>)    : has size(), 3 element(s)
describe(nullptr)        : something else

old_way(42)              : integral 42
old_way(3.5)             : not integral, 8 bytes

fact<10>() = 3628800  (computed at compile time)`}
      </CodeBlock>

      <p>
        Six types through one function, no overloads, no tag dispatch, no specialisation. Compare
        the three-overload <code>old_way</code> shape underneath it, which is what the same logic
        looked like before C++17 and what you will still find in anything written against C++11.
      </p>
      <p>
        Now the part that is easy to misread. Replace <code>if constexpr</code> with a plain{' '}
        <code>if</code> — the condition is still a compile-time constant, so surely it is the same
        thing:
      </p>

      <CodeBlock language="cpp" title="ifconst2.cpp — the same function with a runtime 'if' (includes elided; error line numbers are from the real file)">
{`template <class T>
std::string describe(const T& v) {
    if (std::is_integral_v<T>) {
        return std::format("integral, value {}", v);
    } else {
        return std::format("has size(), {} element(s)", v.size());  // int has no size()
    }
}

int main() { return (int)describe(42).size(); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=74 -fsyntax-only ifconst2.cpp">
{`ifconst2.cpp:10:58: error: member reference base type 'const int' is not a
      structure or union
   10 |         return std::format("has size(), {} element(s)", v.size());  // in...
      |                                                         ~^~~~~
ifconst2.cpp:14:26: note: in instantiation of function template
      specialization 'describe<int>' requested here
   14 | int main() { return (int)describe(42).size(); }
      |                          ^
1 error generated.`}
      </CodeBlock>

      <p>
        <strong>A runtime <code>if</code> requires both branches to compile.</strong> The optimiser
        will certainly delete the dead one, but deletion happens long after type checking.{' '}
        <code>if constexpr</code> is the only form that keeps the untaken branch out of the
        instantiation altogether — and that is the whole reason it exists.
      </p>
      <p>
        One more thing hiding in <code>ifconst.cpp</code>:{' '}
        <code>else if constexpr (requires {'{'} v.size(); {'}'})</code>. That is a{' '}
        <code>requires</code> expression — a C++20 feature that asks &quot;would this expression
        compile?&quot; and yields <code>true</code> or <code>false</code>. It is the first piece of{' '}
        <a href="/cpp/concepts">the next lesson</a>, and it is already more readable than the{' '}
        <code>enable_if</code> machinery it replaces.
      </p>

      <FlowChart
        title="Picking the compile-time dispatch mechanism"
        chart={
          'graph TD\n' +
          '  Q["One algorithm, several types,<br/>and the types need different code"] --> Q1{"Is the difference inside<br/>ONE function body?"}\n' +
          '  Q1 -->|yes| IFC["if constexpr<br/>C++17 and the default answer.<br/>The untaken branch is NOT instantiated,<br/>so it may be ill-formed for this T.<br/>Measured: a plain if on the same code<br/>failed with member reference base type<br/>const int is not a structure or union."]\n' +
          '  Q1 -->|"no, it is a whole<br/>different implementation"| Q2{"Does it differ for ONE type,<br/>or for a FAMILY of types?"}\n' +
          '  Q2 -->|"one exact type"| FULL["FULL specialisation<br/>template &lt;&gt; struct S&lt;bool&gt; { ... };<br/>Works for class AND function templates."]\n' +
          '  Q2 -->|"a family — any vector,<br/>any pointer, any T with X"| Q3{"Class template<br/>or function template?"}\n' +
          '  Q3 -->|class| PART["PARTIAL specialisation<br/>template &lt;class T&gt; struct S&lt;vector&lt;T&gt;&gt;<br/>Measured: composed with a full<br/>specialisation to print nested vectors<br/>as [[a, b], [c]] without being told<br/>that combination existed."]\n' +
          '  Q3 -->|function| OVL["OVERLOAD, not specialisation.<br/>Measured: partial specialisation of a<br/>function template is not allowed —<br/>a hard error. Overload resolution picks<br/>the most specialised candidate."]\n' +
          '  Q1 -->|"the difference is WHETHER the<br/>type is allowed at all"| CON["CONSTRAIN it — the next lesson.<br/>A concept moves the error from inside<br/>the instantiation to the call site.<br/>Measured: 34,331 bytes of diagnostics<br/>became 3,758."]\n' +
          '  IFC --> OLD["The pre-C++17 versions of all of this —<br/>tag dispatch on std::true_type,<br/>enable_if, SFINAE — are what you will<br/>read in older code. Same intent,<br/>much worse errors."]\n' +
          '  OVL --> OLD\n' +
          '  style IFC fill:#1a3329,stroke:#4ade80\n' +
          '  style CON fill:#1a3329,stroke:#4ade80\n' +
          '  style PART fill:#1a2744,stroke:#5b9cf6\n' +
          '  style FULL fill:#1a2744,stroke:#5b9cf6\n' +
          '  style OVL fill:#1a2744,stroke:#5b9cf6\n' +
          '  style OLD fill:#3d2f14,stroke:#fb923c'
        }
      />

      <h2>Why Template Error Messages Are So Bad</h2>
      <p>
        This section exists for morale. You are going to make a small mistake in your first hour of
        template code and receive a wall of text, and the useful response is not to read it
        top-to-bottom but to know its shape. So here is a realistic mistake, measured.
      </p>
      <p>
        A <code>struct</code> with no comparison operator, sorted:
      </p>

      <CodeBlock language="cpp" title="e1.cpp — twelve lines, one honest mistake">
{`#include <algorithm>
#include <string>
#include <vector>

struct Employee {
    std::string name;
    int salary;
};

int main() {
    std::vector<Employee> staff{{"ada", 9}, {"bob", 7}};
    std::sort(staff.begin(), staff.end());      // Employee has no operator<
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the size of the diagnostics, measured">
{`$ clang++ -std=c++23 -fsyntax-only e1.cpp 2>&1 | wc -l
304

$ clang++ -std=c++23 -fsyntax-only e1.cpp 2>&1 | wc -c
34331

$ clang++ -std=c++23 -fsyntax-only e1.cpp 2>&1 | grep -c "in instantiation of"
44

$ clang++ -std=c++23 -fsyntax-only e1.cpp 2>&1 | grep "error:" | sed 's/^.*error: //' | sort | uniq -c | sort -rn
  11 no matching function for call to object of type 'std::__less<void, void>'
   6 no matching function for call to '__sort3'
   1 too many errors emitted, stopping now [-ferror-limit=]
   1 no matching function for call to '__partial_sort_impl'
   1 invalid operands to binary expression ('const Employee' and 'const Employee')`}
      </CodeBlock>

      <p>
        <strong>304 lines, 34,331 bytes, 44 instantiation frames and 20 errors for one missing
        operator — and then it stopped early because it hit the error limit.</strong> Only{' '}
        <em>one</em> of those 20 errors describes the actual problem, and it is the last line of
        that table, not the first thing you see.
      </p>

      <h3>Reading it</h3>
      <p>
        Here is the top of the output. This is the part worth learning to read, because the
        structure is the same every time:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fmessage-length=76 -fsyntax-only e1.cpp (first 20 of 304 lines; libc++ paths shortened to .../)">
{`In file included from e1.cpp:1:
In file included from .../c++/v1/algorithm:1842:
In file included from .../c++/v1/__algorithm/adjacent_find.h:13:
.../c++/v1/__algorithm/comp.h:42:18: error:
      invalid operands to binary expression ('const Employee' and
      'const Employee')
   42 |     return __lhs < __rhs;
      |            ~~~~~ ^ ~~~~~
.../c++/v1/__algorithm/sift_down.h:49:39: note:
      in instantiation of function template specialization
      'std::__less<>::operator()<Employee, Employee>' requested here
   49 |   } else if ((__child + 1) < __len && __comp(__first[__child], __fir...
      |                                       ^
.../c++/v1/__algorithm/make_heap.h:49:12: note:
      in instantiation of function template specialization
      'std::__sift_down<std::_ClassicAlgPolicy, false, std::__less<void,
      void> &, Employee *>' requested here
   49 |       std::__make_heap<_AlgPolicy>(__first, __middle, __comp);
      |            ^`}
      </CodeBlock>

      <ol>
        <li>
          <strong>Lines 1–3 are a <code>#include</code> chain, not the error.</strong>{' '}
          <code>In file included from</code> tells you how the compiler got to the file it is
          complaining about. Skip these; they are never the problem.
        </li>
        <li>
          <strong>Line 4 is the only <code>error:</code> that matters</strong> —{' '}
          <code>invalid operands to binary expression (&apos;const Employee&apos; and &apos;const
          Employee&apos;)</code>, at <code>comp.h:42</code>, on the statement{' '}
          <code>return __lhs &lt; __rhs;</code>. That is the real diagnosis:{' '}
          <em>two <code>Employee</code>s cannot be compared with <code>&lt;</code></em>. It is
          reported inside a libc++ header called <code>comp.h</code> because that is where the
          requirement was finally exercised.
        </li>
        <li>
          <strong>Everything after it is an instantiation stack,</strong> read bottom-up like any
          stack trace: <code>__less::operator()</code> was instantiated by{' '}
          <code>__sift_down</code>, which was instantiated by <code>__make_heap</code>, which was
          instantiated by <code>__partial_sort_impl</code>, and so on. You do not care about any of
          these frames. You care about the <em>last</em> one.
        </li>
        <li>
          <strong>Your line is at output line 50, as a <code>note:</code>.</strong> Measured — the
          first mention of <code>e1.cpp</code> as a location rather than an include is 50 lines in:
          <CodeBlock language="text" title="Real output — output line 50 of 304">
{`e1.cpp:12:10: note: in instantiation of function template specialization
      'std::sort<std::__wrap_iter<Employee *>>' requested here
   12 |     std::sort(staff.begin(), staff.end());      // Employee has no operator<
      |          ^`}
          </CodeBlock>
        </li>
        <li>
          <strong>The remaining 254 lines are the same mistake re-reported</strong> from every other
          internal helper that also needed <code>operator&lt;</code> — <code>__sort3</code>,{' '}
          <code>__partial_sort_impl</code>, and eleven more copies of{' '}
          <code>no matching function for call to object of type
          &apos;std::__less&lt;void, void&gt;&apos;</code>. One cause, twenty reports.
        </li>
      </ol>

      <InfoBox variant="tip" title="Two flags that make this bearable, measured">
        <p>
          You can cut 34 KB to 1.5 KB without losing either of the two things you need — the real
          error, and your own line:
        </p>
        <CodeBlock language="text" title="Real output — sizes of the same diagnostics under three flag sets">
{`clang++ -std=c++23                                        -fsyntax-only e1.cpp
  -> 304 lines, 34,331 bytes

clang++ -std=c++23 -ferror-limit=1                        -fsyntax-only e1.cpp
  ->  32 lines,  3,394 bytes

clang++ -std=c++23 -ferror-limit=1 -ftemplate-backtrace-limit=2 -fsyntax-only e1.cpp
  ->  17 lines,  1,527 bytes`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — the whole 17 lines (libc++ paths shortened to .../)">
{`In file included from e1.cpp:1:
In file included from .../c++/v1/algorithm:1842:
In file included from .../c++/v1/__algorithm/adjacent_find.h:13:
.../c++/v1/__algorithm/comp.h:42:18: error: invalid operands to binary expression ('const Employee' and 'const Employee')
   42 |     return __lhs < __rhs;
      |            ~~~~~ ^ ~~~~~
.../c++/v1/__algorithm/sift_down.h:49:39: note: in instantiation of function template specialization 'std::__less<>::operator()<Employee, Employee>' requested here
   49 |   } else if ((__child + 1) < __len && __comp(__first[__child], __first[__child + 1])) {
      |                                       ^
.../c++/v1/__algorithm/make_heap.h:49:12: note: (skipping 6 contexts in backtrace; use -ftemplate-backtrace-limit=0 to see all)
   49 |       std::__sift_down<_AlgPolicy, __assume_both_children>(__first, __comp_ref, __sift_down_n, __start);
      |            ^
e1.cpp:12:10: note: in instantiation of function template specialization 'std::sort<std::__wrap_iter<Employee *>>' requested here
   12 |     std::sort(staff.begin(), staff.end());      // Employee has no operator<
      |          ^
fatal error: too many errors emitted, stopping now [-ferror-limit=]
2 errors generated.`}
        </CodeBlock>
        <p>
          The real error, <code>(skipping 6 contexts in backtrace)</code> where the noise used to
          be, and your line. <strong>Put <code>-ferror-limit=1</code> in your
          local development flags</strong>; the first template error is almost always the only real
          one, and the other nineteen are echoes. Keep the limit off in CI, where you want
          everything.
        </p>
      </InfoBox>

      <FlowChart
        title="Anatomy of a template error, and how to shrink it"
        chart={
          'graph TD\n' +
          '  M["std::sort(staff.begin(), staff.end());<br/>Employee has no operator&lt;<br/>ONE mistake, 12-line file"] --> OUT["Measured output:<br/>304 lines / 34,331 bytes<br/>20 errors, 44 instantiation frames<br/>and it STOPPED EARLY on -ferror-limit"]\n' +
          '  OUT --> L1["Lines 1-3: In file included from ...<br/>How the compiler reached the header.<br/>NEVER the problem. Skip."]\n' +
          '  OUT --> L2["Line 4: the ONE real error.<br/>invalid operands to binary expression<br/>(const Employee and const Employee)<br/>at comp.h:42, on return __lhs &lt; __rhs;<br/>READ THIS LINE AND NOTHING ELSE FIRST."]\n' +
          '  OUT --> L3["Lines 5-49: the instantiation stack.<br/>__less -&gt; __sift_down -&gt; __make_heap -&gt;<br/>__partial_sort_impl -&gt; __sort_impl -&gt; sort<br/>Read bottom-up. You want the LAST frame."]\n' +
          '  OUT --> L4["Line 50: YOUR line, as a note.<br/>e1.cpp:12:10 ... requested here<br/>This is the last frame of the stack."]\n' +
          '  OUT --> L5["Lines 51-304: the SAME mistake,<br/>re-reported by every other internal<br/>helper that also needed operator&lt;.<br/>11x __less, 6x __sort3. Echoes."]\n' +
          '  L2 --> WHY["WHY it lands there: a template body is<br/>only type-checked at instantiation, so<br/>the diagnosis happens wherever inside<br/>the library the requirement was finally<br/>exercised — not where you called it."]\n' +
          '  WHY --> F1["SHRINK IT: -ferror-limit=1<br/>Measured: 304 lines -&gt; 32"]\n' +
          '  F1 --> F2["PLUS -ftemplate-backtrace-limit=2<br/>Measured: -&gt; 17 lines / 1,527 bytes,<br/>and it still shows the real error<br/>AND your own line."]\n' +
          '  WHY --> F3["FIX IT PROPERLY: constrain the template.<br/>Measured, std::ranges::sort on the same<br/>mistake: 34 lines / 3,758 bytes, ONE<br/>error, starting at YOUR line — and a<br/>readable chain of because X evaluated<br/>to false."]\n' +
          '  F3 --> NEXT["That is what concepts are for.<br/>Next lesson."]\n' +
          '  style L2 fill:#1a3329,stroke:#4ade80\n' +
          '  style L4 fill:#1a3329,stroke:#4ade80\n' +
          '  style F1 fill:#1a3329,stroke:#4ade80\n' +
          '  style F2 fill:#1a3329,stroke:#4ade80\n' +
          '  style F3 fill:#1a3329,stroke:#4ade80\n' +
          '  style NEXT fill:#1a3329,stroke:#4ade80\n' +
          '  style OUT fill:#3b1a1a,stroke:#f87171\n' +
          '  style L5 fill:#3b1a1a,stroke:#f87171\n' +
          '  style L1 fill:#3d2f14,stroke:#fb923c\n' +
          '  style L3 fill:#3d2f14,stroke:#fb923c\n' +
          '  style WHY fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h2>And Then C++20 Fixed Most Of It</h2>
      <p>
        The reason the errors are enormous is structural: nothing in{' '}
        <code>std::sort</code>&apos;s signature says what it requires of the element type, so the
        requirement can only be discovered by trying, deep inside. A{' '}
        <strong>constrained</strong> algorithm states its requirements up front, and the compiler
        can reject the call before instantiating anything.
      </p>
      <p>
        Same mistake, same file, one word changed:
      </p>

      <CodeBlock language="cpp" title="e4.cpp — std::ranges::sort instead of std::sort">
{`int main() {
    std::vector<Employee> staff{{"ada", 9}, {"bob", 7}};
    std::ranges::sort(staff);                   // the constrained version
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — measured sizes, side by side">
{`std::sort        (unconstrained) : 304 lines   34,331 bytes   20 errors
std::ranges::sort (constrained)  :  34 lines    3,758 bytes    1 error`}
      </CodeBlock>

      <p>
        Nine times smaller, and one error instead of twenty. But the shape matters more than the
        size. Here is a second case where the difference is starker — sorting a{' '}
        <code>std::list</code>, whose iterators are not random-access:
      </p>

      <CodeBlock language="text" title="Real output — std::ranges::sort(std::list<int>{3,1,2}) — all 22 lines, libc++ paths shortened and source echoes removed">
{`e3.cpp:7:5: error: no matching function for call to object of type
      'const __sort'
    7 |     std::ranges::sort(l);
      |     ^~~~~~~~~~~~~~~~~
.../__algorithm/ranges_sort.h:64:3: note:
      candidate template ignored: constraints not satisfied [with _Range =
      std::list<int> &, _Comp = ranges::less, _Proj = identity]
.../__algorithm/ranges_sort.h:61:13: note:
      because 'std::list<int> &' does not satisfy 'random_access_range'
.../__ranges/concepts.h:116:59: note:
      because 'iterator_t<std::list<int, std::allocator<int>> &>' (aka
      '__list_iterator<int, void *>') does not satisfy
      'random_access_iterator'
.../__iterator/concepts.h:219:36: note:
      because 'derived_from<_ITER_CONCEPT<std::__list_iterator<int, void
      *>>, random_access_iterator_tag>' evaluated to false
.../__concepts/derived_from.h:27:24: note:
      because 'is_base_of_v<std::random_access_iterator_tag,
      std::bidirectional_iterator_tag>' evaluated to false
1 error generated.`}
      </CodeBlock>

      <p>
        Three things changed, and they are the whole argument for the next lesson.
      </p>
      <ul>
        <li>
          <strong>The error is at <em>your</em> line</strong> — <code>e3.cpp:7:5</code> is the
          first line of output, not line 50 of 304.
        </li>
        <li>
          <strong>It says what is wrong in English:</strong>{' '}
          <code>because &apos;std::list&lt;int&gt; &amp;&apos; does not satisfy
          &apos;random_access_range&apos;</code>. Compare{' '}
          <code>no matching function for call to object of type &apos;std::__less&lt;void,
          void&gt;&apos;</code>, eleven times.
        </li>
        <li>
          <strong>The rest is a derivation, not an echo.</strong> Each{' '}
          <code>because ... evaluated to false</code> narrows the previous one — range → iterator →
          iterator category → <code>is_base_of_v</code>. You can stop reading at the first line
          you understand, and the first line is usually enough.
        </li>
      </ul>
      <p>
        For comparison, <code>std::sort</code> on the same <code>std::list</code> produced{' '}
        <strong>114 lines and 12,800 bytes</strong>, 21 instantiation frames and four errors, none
        of which mentioned iterators.
      </p>
      <p>
        Which is the handover. <a href="/cpp/concepts">Concepts &amp; Compile-Time
        Constraints</a> is about writing <code>random_access_range</code>-style requirements on your
        own templates: the <code>requires</code> clause, the <code>requires</code> expression you
        already met in <code>if constexpr</code>, the standard concepts in{' '}
        <code>&lt;concepts&gt;</code>, and the <code>enable_if</code>/SFINAE machinery they
        replaced — which is what you will actually find in any codebase older than 2021.
      </p>

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
            <td style={cellStyle}>&quot;<code>Box&lt;int&gt;</code> and{' '}
              <code>Box&lt;double&gt;</code> are the same class with a different
              parameter&quot;</td>
            <td style={cellStyle}>Different types: different <code>typeid</code>, different{' '}
              <code>sizeof</code> (4 / 8 / 24), and three independent static counters reading{' '}
              <code>3</code>, <code>1</code> and <code>2</code>. Java&apos;s read{' '}
              <code>6</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;One template, one implementation&quot;</td>
            <td style={cellStyle}><code>nm</code> showed three separate <code>twice</code>{' '}
              functions at three addresses, one per type used.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Generics are free&quot;</td>
            <td style={cellStyle}>At runtime, yes. At build time: 1 &rarr; 200 instantiations took
              296 ms &rarr; 11.9 s and 8.5 KB &rarr; 1.5 MB of object code.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A nine-line program compiles instantly&quot;</td>
            <td style={cellStyle}>925 ms, against 117 ms for an empty <code>main</code> — from
              71,115 lines of preprocessed header.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The template body is checked when I write it&quot;</td>
            <td style={cellStyle}>A template calling <code>t.quack()</code> compiled and ran. It
              only failed when something without a <code>quack</code> was passed.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>larger(1, 2.0)</code> will widen to
              <code>double</code>&quot;</td>
            <td style={cellStyle}><code>error: deduced conflicting types for parameter
              &apos;T&apos; (&apos;int&apos; vs. &apos;double&apos;)</code>. Deduction never
              converts to make two deductions agree.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::vector x{'{'}v{'}'}</code> wraps{' '}
              <code>v</code>&quot;</td>
            <td style={cellStyle}>CTAD picked the copy constructor —{' '}
              <code>decltype(x)</code> was <code>std::vector&lt;int&gt;</code> with{' '}
              <code>size() == 3</code>, not a vector of vectors.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Put the definition in the .cpp like any function&quot;</td>
            <td style={cellStyle}>Both TUs compiled clean and the link failed.{' '}
              <code>nm</code> on the TU with the definition showed <em>one</em> symbol:{' '}
              <code>ltmp0</code>. No code was generated at all.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A compile-time <code>if</code> is a compile-time
              <code>if</code>&quot;</td>
            <td style={cellStyle}>A plain <code>if</code> type-checks both branches and failed with{' '}
              <code>member reference base type &apos;const int&apos; is not a structure or
              union</code>. Only <code>if constexpr</code> prunes.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;I can partially specialise anything&quot;</td>
            <td style={cellStyle}>Class templates yes; function templates{' '}
              <code>error: function template partial specialization is not allowed</code>. Use
              overloading.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A fold over an empty pack gives zero&quot;</td>
            <td style={cellStyle}>Only <code>&amp;&amp;</code>, <code>||</code> and <code>,</code>{' '}
              have identities. <code>(... + xs)</code> on an empty pack is{' '}
              <code>error: unary fold expression has empty expansion for operator &apos;+&apos;
              with no fallback value</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The error message will point at my
              mistake&quot;</td>
            <td style={cellStyle}>304 lines, 34,331 bytes, 20 errors, 44 instantiation frames. Your
              line appeared at output line 50, as a <code>note:</code>. One of the 20 errors
              described the actual problem.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Nothing can be done about that&quot;</td>
            <td style={cellStyle}><code>-ferror-limit=1 -ftemplate-backtrace-limit=2</code> cut it
              to 17 lines and 1,527 bytes, keeping the real error and your line. The
              concept-constrained algorithm cut it to 34 lines and 1 error, starting at your
              line.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        You can now read and write templates, and you know why they cost what they cost. The one
        thing still missing is a way to <em>say what a template requires</em> — which is both a
        documentation problem and, as the measurements above show, the entire error-message problem.
      </p>
      <p>
        <strong><a href="/cpp/concepts">Concepts &amp; Compile-Time Constraints</a></strong> is
        that. The centrepiece is the same comparison this lesson ended on, done on your own code
        rather than on the standard library: one mistake, the error message with and without a
        concept, both captured. It also covers the <code>requires</code> clause and{' '}
        <code>requires</code> expression, the standard concepts in <code>&lt;concepts&gt;</code>,
        constrained <code>auto</code> parameters, <code>static_assert</code> as the older and
        cruder tool, and an honest look at <code>std::enable_if</code> and SFINAE — which you will
        meet in any codebase written before 2021 and which concepts exist to replace.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          Two experiments, both five minutes, both likely to teach you something about a codebase
          you are about to work in.
        </p>
        <p>
          <strong>One: find out what your headers cost.</strong> Pick the heaviest-looking
          translation unit you have and run:
        </p>
        <CodeBlock language="bash" title="Verified commands">
{`# How much source does the compiler actually read for this one file?
clang++ -std=c++23 -E yourfile.cpp | wc -l

# Where is the time going? -ftime-trace writes a Chrome-tracing JSON next to
# the -o target (so 'tt.o' gives you 'tt.json'), openable at
# chrome://tracing or ui.perfetto.dev.
clang++ -std=c++23 -ftime-trace -c yourfile.cpp -o tt.o`}
        </CodeBlock>
        <p>
          The measurement to compare against: <code>&lt;vector&gt;</code> alone was{' '}
          <strong>40,476 lines</strong> on this machine, and five common headers together were{' '}
          <strong>71,115</strong>. If your file is in the hundreds of thousands, the includes are
          worth an afternoon. And here is what <code>-ftime-trace</code> says about the
          eleven-line <code>t3.cpp</code> from earlier, summing the <code>Total *</code> events:
        </p>
        <CodeBlock language="text" title="Real output — the top ten Total entries from tt.json for t3.cpp">
{`Total ExecuteCompiler                         494.2 ms
Total Frontend                                413.5 ms
Total Source                                  301.6 ms
Total InstantiateFunction                     101.7 ms
Total ParseFunctionDefinition                  83.9 ms
Total ParseClass                               79.4 ms
Total Backend                                   77.2 ms
Total ParseDeclarationOrFunctionDefinition     74.6 ms
Total CodeGenPasses                            70.9 ms
Total OptModule                                70.9 ms`}
        </CodeBlock>
        <p>
          <strong><code>Frontend</code> is 413 of 494 ms and <code>Backend</code> is 77.</strong>{' '}
          Reading and instantiating templates is six times the cost of generating the code. That
          ratio is the single most useful number to know about a C++ build, and it is the reason
          build-time work is almost always about headers rather than about the optimiser.
        </p>
        <p>
          <strong>Two: break something on purpose.</strong> Take any{' '}
          <code>std::sort</code>, <code>std::map</code> or <code>std::set</code> in your code and
          remove the comparison it depends on — delete an <code>operator&lt;</code>, or swap the
          key type for one that has not got one. Then read the output, and specifically{' '}
          <em>count</em> it:
        </p>
        <CodeBlock language="bash" title="The exercise">
{`clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | wc -l
clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | grep -c "in instantiation of"
clang++ -std=c++23 -fsyntax-only broken.cpp 2>&1 | grep -n "broken.cpp" | head -2`}
        </CodeBlock>
        <p>
          The third command is the interesting one: it tells you how far down the output your own
          file first appears. For <code>e1.cpp</code> on this page the answer was line 50 of 304.
          Knowing that number — and knowing to search the output for your own filename rather than
          reading from the top — is most of the skill.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Templates;
