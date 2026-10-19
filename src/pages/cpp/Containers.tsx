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

function Containers() {
  return (
    <LessonLayout
      title="STL Containers & Iterator Invalidation"
      sectionId="cpp"
      lessonIndex={14}
      prev={{ path: '/cpp/concepts', label: 'Concepts & Compile-Time Constraints' }}
      next={{ path: '/cpp/algorithms', label: 'Algorithms, Iterators & Ranges' }}
    >
      <p>
        Phase 4 starts here, with the part of C++ you will touch in every single file: the
        containers. You already know what a growable array and a hash map are, so this lesson is not
        a tour of the API. It is a correction of three specific instincts that a Node and Java
        background installs, each of which is wrong in a way that costs real money.
      </p>
      <ul>
        <li>
          <strong>&quot;The container holds my objects.&quot;</strong> It holds <em>copies</em> of
          your objects. <a href="/cpp/intro">The intro</a> made this claim about assignment and{' '}
          <a href="/cpp/references">the references lesson</a> made it about parameters; a container
          is the same rule applied a thousand times. <code>push_back(o)</code> is a copy
          constructor call, and <code>orders[0]</code> is a different object from <code>o</code>{' '}
          with a different address. Measured below, next to the Java program that does the opposite.
        </li>
        <li>
          <strong>&quot;Mutating while iterating is risky.&quot;</strong> In Java it is a{' '}
          <em>clean failure</em>: <code>ConcurrentModificationException</code>, on the next{' '}
          <code>next()</code>, with a stack trace. Measured below on JDK 26. In C++ the same loop
          skips elements, then reads past the end, then dies of <code>SIGBUS</code> with its{' '}
          <code>stdout</code> buffer unflushed so you see <em>no output at all</em> — identically at{' '}
          <code>-O0</code> and <code>-O2</code>. That is not a worse exception. It is the absence of
          one.
        </li>
        <li>
          <strong>&quot;<code>std::map</code> is the hash map.&quot;</strong> It is a balanced
          binary tree. <code>std::unordered_map</code> is the hash map. The names are backwards
          relative to Java, where <code>HashMap</code> and <code>TreeMap</code> both say what they
          are. Measured: at four million keys, <code>map::find</code> took{' '}
          <strong>558 ns</strong> and <code>unordered_map::find</code> took{' '}
          <strong>11.7 ns</strong> — a factor of 47, from picking the wrong five letters.
        </li>
      </ul>
      <p>
        The centrepiece is the second one, generalised. <strong>Iterator invalidation is a
        use-after-free with its own vocabulary</strong>, and once you see it that way, every rule in
        the table at the end of this lesson follows from one question: <em>did that operation free
        or move the storage my iterator points at?</em>
      </p>

      <InfoBox variant="note" title="What was actually run">
        <p>
          Same machine and toolchain as the rest of the section:{' '}
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>,{' '}
          <code>arm64-apple-darwin25.6.0</code>, libc++ with{' '}
          <code>_LIBCPP_VERSION 220106</code>, <code>-std=c++23</code>. Every capacity value,
          timing, byte count, address, exit code and sanitizer report on this page came from a real
          run here. The Java comparisons are real runs on <strong>JDK 26.0.1 (26.0.1+8-34)</strong>.
        </p>
        <p>
          Timings are the <em>best of three or five runs</em> of a release build
          (<code>-O2</code>), stated as such each time, and they are wall-clock milliseconds on one
          laptop — use the <em>ratios</em>, not the absolute numbers. Allocation counts come from
          replacing global <code>operator new</code> with a counting version, which is the only way
          to know rather than reason, and is the same technique{' '}
          <a href="/cpp/types">the types lesson</a> used.
        </p>
        <p>
          <strong>Six things on this page are not what the lesson set out to claim.</strong>{' '}
          <code>std::list</code> lost the one benchmark it is supposed to win, by 33&times;. A third
          of <code>vector</code>&apos;s traversal win turned out to be SIMD rather than cache.{' '}
          <code>map::emplace</code> on a key that already exists is not a no-op — it builds the
          value and throws it away. Comparing addresses before and after an operation turned out to
          be useless as an invalidation test, because the allocator handed back the identical block.{' '}
          <code>-Wdangling-gsl</code> is on by default, which is better than expected, and
          completely blind one function call deeper, which is worse. And every libc++ hardening
          mode, including <code>_LIBCPP_HARDENING_MODE_DEBUG</code>, ignored a stale iterator
          entirely. All six are written up where they happened.
        </p>
      </InfoBox>

      <h2>1. A Container Holds Values</h2>
      <p>
        Start here, because every later surprise is a consequence of it. A{' '}
        <code>std::vector&lt;Order&gt;</code> is not an array of pointers to <code>Order</code>. It
        is a single block of memory containing <code>Order</code> objects, laid end to end, and{' '}
        <code>push_back</code> constructs a new one in that block from the thing you handed it.
      </p>

      <CodeBlock language="cpp" title="valsem.cpp">
{`#include <print>
#include <string>
#include <vector>

struct Order { int id; std::string customer; };

int main() {
    Order o{1, "acme"};
    std::vector<Order> orders;
    orders.push_back(o);                      // a COPY goes in

    o.customer = "MUTATED AFTER push_back";   // edit the original

    std::println("local  o.customer  = {}", o.customer);
    std::println("orders[0].customer = {}", orders[0].customer);
    std::println("&o = {}, &orders[0] = {}  same object? {}",
                 (void*)&o, (void*)&orders[0], (void*)&o == (void*)&orders[0]);

    auto  copy = orders[0];                   // auto deduces Order -- another copy
    copy.customer = "changed the copy";
    std::println("after editing 'auto copy' : orders[0].customer = {}", orders[0].customer);

    auto& ref = orders[0];                    // auto& is the reference
    ref.customer = "changed through auto&";
    std::println("after editing 'auto& ref' : orders[0].customer = {}", orders[0].customer);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 valsem.cpp && ./valsem">
{`local  o.customer  = MUTATED AFTER push_back
orders[0].customer = acme
&o = 0x16da4a788, &orders[0] = 0x102ac5b20  same object? false
after editing 'auto copy' : orders[0].customer = acme
after editing 'auto& ref' : orders[0].customer = changed through auto&`}
      </CodeBlock>

      <p>
        Note the two addresses: <code>&amp;o</code> is <code>0x16da...</code> — the stack — and{' '}
        <code>&amp;orders[0]</code> is <code>0x102a...</code> — the heap. Two objects. Now the same
        program in Java:
      </p>

      <CodeBlock language="java" title="ValSem.java">
{`import java.util.ArrayList;
import java.util.List;

public class ValSem {
    static class Order {
        int id; String customer;
        Order(int id, String c) { this.id = id; this.customer = c; }
    }
    public static void main(String[] args) {
        Order o = new Order(1, "acme");
        List<Order> orders = new ArrayList<>();
        orders.add(o);
        o.customer = "MUTATED AFTER add";
        System.out.println("local  o.customer    = " + o.customer);
        System.out.println("orders.get(0).customer = " + orders.get(0).customer);
        System.out.println("same object? " + (orders.get(0) == o));
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — javac ValSem.java && java ValSem (JDK 26.0.1)">
{`local  o.customer    = MUTATED AFTER add
orders.get(0).customer = MUTATED AFTER add
same object? true`}
      </CodeBlock>

      <p>
        <code>same object? true</code> against <code>same object? false</code>. An{' '}
        <code>ArrayList&lt;Order&gt;</code> is an array of references; a{' '}
        <code>vector&lt;Order&gt;</code> is an array of orders. Everything downstream follows:
      </p>
      <ul>
        <li>
          <strong>Adding to a container costs a copy</strong> unless you move or emplace. That is
          what section 8 is about, and{' '}
          <a href="/cpp/move-semantics">the move-semantics lesson</a> already measured what
          reallocation does to that cost.
        </li>
        <li>
          <strong><code>auto x = v[0]</code> silently copies an element.</strong>{' '}
          <code>auto&amp;</code> or <code>const auto&amp;</code> is what you meant. In a range-for
          over a container of anything non-trivial, <code>for (auto x : v)</code> copies every
          element in turn.
        </li>
        <li>
          <strong>The container needs to know how big an element is at compile time</strong>, which
          is why polymorphism does not work the way your Java instinct expects.
        </li>
      </ul>

      <InfoBox variant="danger" title="vector<Base> slices. The compiler will not stop you.">
        <p>
          <a href="/cpp/inheritance">The inheritance lesson</a> measured object slicing on
          assignment. A container does it on insertion, for the same reason — the element slot is{' '}
          <code>sizeof(Base)</code> bytes wide and a <code>Derived</code> does not fit.
        </p>
        <CodeBlock language="cpp" title="valsem2.cpp">
{`struct Shape {
    virtual ~Shape() = default;
    virtual std::string name() const { return "Shape"; }
};
struct Circle : Shape {
    double radius{2.5};
    std::string name() const override { return "Circle"; }
};

int main() {
    std::println("sizeof(Shape) = {}, sizeof(Circle) = {}", sizeof(Shape), sizeof(Circle));

    std::vector<Shape> flat;
    flat.push_back(Circle{});                     // compiles. Stores a Shape.
    std::println("vector<Shape>              -> name() = {}", flat[0].name());

    std::vector<std::unique_ptr<Shape>> poly;
    poly.push_back(std::make_unique<Circle>());
    std::println("vector<unique_ptr<Shape>>  -> name() = {}", poly[0]->name());
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 valsem2.cpp && ./valsem2 (no warnings)">
{`sizeof(Shape) = 8, sizeof(Circle) = 16
vector<Shape>              -> name() = Shape
vector<unique_ptr<Shape>>  -> name() = Circle`}
        </CodeBlock>
        <p>
          The <code>Circle</code> went in and a <code>Shape</code> came out. Eight bytes of it were
          kept — the vtable pointer, overwritten with <code>Shape</code>&apos;s — and the{' '}
          <code>radius</code> was discarded. <strong>No warning at <code>-Wall
          -Wextra</code>.</strong> If you want polymorphic elements you need a container of{' '}
          <em>handles</em>: <code>vector&lt;unique_ptr&lt;Shape&gt;&gt;</code> from{' '}
          <a href="/cpp/smart-pointers">the smart-pointers lesson</a>, or{' '}
          <code>vector&lt;variant&lt;Circle, Square&gt;&gt;</code> from{' '}
          <a href="/cpp/inheritance">the inheritance lesson</a>. A Java{' '}
          <code>List&lt;Shape&gt;</code> is already the first of those; C++ makes you say so.
        </p>
      </InfoBox>

      <h2>2. <code>vector</code> Is The Default, And It Is Not Close</h2>
      <p>
        The received advice is &quot;<code>vector</code> for iteration, <code>list</code> for
        insertion&quot;. The first half is right for a reason worth measuring and the second half is
        wrong on this hardware. Both halves below, measured, with the <code>list</code> result
        broken into the two very different things people mean by it.
      </p>

      <CodeBlock language="cpp" title="bench1.cpp — abridged; the operator-new counter and the timing helper are elided">
{`constexpr int N = 10'000'000;

std::vector<int> v(N);                 // one allocation
std::iota(v.begin(), v.end(), 0);

std::list<int> l;                      // one allocation PER ELEMENT
for (int i = 0; i < N; ++i) l.push_back(i);

// A list whose nodes are no longer in traversal order -- i.e. one that has
// been churned over a program's lifetime. Built by splicing the same nodes
// into a new list in shuffled order, so the ALLOCATIONS are identical and
// only the link order differs.
std::list<int> shuffled;
/* ... push_back N, collect iterators, std::shuffle them, splice in that order ... */

// then: sum each one five times with a plain range-for.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 bench1.cpp && ./bench1">
{`N = 10000000 ints
vector: 1 allocations, 40000000 bytes  (4.0 bytes/element)
list:   10000000 allocations, 240000000 bytes  (24.0 bytes/element)

sum, 5 runs (ms)                           r1         r2         r3         r4         r5
vector<int> range-for                    0.7       0.5       0.4       0.4       0.4
list<int> range-for (in-order nodes)      13.3       7.8       7.8       7.8       7.8
list<int> range-for (shuffled links)    1158.7    1163.6    1166.9    1200.4    1161.5
vector<int> accumulate                   0.5       0.4       0.4       0.4       0.4
list<int> accumulate                     7.9       7.9       7.9       7.9       7.8

sink = 1249999875000000 (keeps the loops alive)`}
      </CodeBlock>

      <p>
        Three numbers out of that, in increasing order of how much they should change your
        defaults.
      </p>
      <ul>
        <li>
          <strong>Memory: 4.0 bytes per element against 24.0.</strong> Six times. A{' '}
          <code>list&lt;int&gt;</code> node is a previous pointer, a next pointer and the{' '}
          <code>int</code>, padded to 24 bytes — 83% overhead to store a 4-byte value. And{' '}
          <strong>ten million separate allocations against one.</strong>
        </li>
        <li>
          <strong>Traversal of a freshly built list: 7.8 ms against 0.4 ms.</strong> Twenty times
          slower, for a loop that does nothing but add.
        </li>
        <li>
          <strong>Traversal of a <em>churned</em> list: 1161 ms.</strong> Same nodes, same
          allocations, same element count — only the <em>order the links run in</em> changed. That
          is <strong>2,900&times; slower than the vector</strong> and 150&times; slower than the
          same list walked in allocation order.
        </li>
      </ul>
      <p>
        That last number is the real content. A microbenchmark that builds a list and immediately
        walks it is measuring the <em>best possible</em> case for a list, because{' '}
        <code>malloc</code> handed out consecutive nodes and the hardware prefetcher can follow
        them. A list in a long-running program — nodes inserted, erased, spliced over hours — is
        the 1161 ms case. <strong>The cost of a linked list is not the pointers. It is that the next
        element&apos;s address is only knowable after the current element has been fetched</strong>,
        which serialises every memory access and defeats prefetching entirely.
      </p>

      <InfoBox variant="warning" title="Something this lesson expected and had to qualify: a third of vector's win is SIMD, not cache">
        <p>
          0.4 ms for ten million additions is about 25 GB/s, which should look suspicious. It is:
          clang auto-vectorises the contiguous loop and cannot vectorise the pointer chase. Rebuilt
          with vectorisation off, to separate the two effects:
        </p>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -fno-vectorize -fno-slp-vectorize bench1.cpp && ./bench1nv">
{`sum, 5 runs (ms)                           r1         r2         r3         r4         r5
vector<int> range-for                    2.3       2.3       2.4       2.3       2.4
list<int> range-for (in-order nodes)      14.2       7.9       7.7       7.9       7.9
list<int> range-for (shuffled links)    1153.9    1179.7    1197.3    1164.6    1155.2
vector<int> accumulate                   2.4       2.3       2.3       2.4       2.3`}
        </CodeBlock>
        <p>
          So the honest decomposition of the 20&times;: <strong>vector goes from 0.4 ms to 2.3 ms
          without SIMD, and the list does not move at all.</strong> Against the non-vectorised
          vector, the in-order list is 3.4&times; slower and the churned list is still
          500&times; slower. Contiguity buys you two separate things — fewer cache misses{' '}
          <em>and</em> eligibility for vector instructions — and only the first is the one everybody
          quotes.
        </p>
      </InfoBox>

      <h3>The benchmark <code>list</code> is supposed to win</h3>
      <p>
        &quot;O(1) insertion&quot; is the argument for a linked list, and it is true about the
        insertion itself. It is not true about getting to the insertion point, and that is where the
        workload actually lives.
      </p>

      <CodeBlock language="cpp" title="bench2.cpp — abridged; best of three runs each, timing helper elided">
{`constexpr int M = 100'000;
// insert at the FRONT M times
std::list<int>   l; for (int i = 0; i < M; ++i) l.push_front(i);
std::deque<int>  d; for (int i = 0; i < M; ++i) d.push_front(i);
std::vector<int> v; for (int i = 0; i < M; ++i) v.insert(v.begin(), i);
std::vector<int> w; w.reserve(M);
for (int i = 0; i < M; ++i) w.push_back(i); std::reverse(w.begin(), w.end());

constexpr int K = 20'000;
// insert in the MIDDLE K times, finding the position the way you have to
std::list<int> l2(1000, 0);
for (int i = 0; i < K; ++i) {
    auto it = l2.begin(); std::advance(it, l2.size() / 2);   // O(n) -- unavoidable
    l2.insert(it, i);                                        // O(1)
}
std::vector<int> v2(1000, 0);
for (int i = 0; i < K; ++i) v2.insert(v2.begin() + v2.size() / 2, i);  // O(n) memmove`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 bench2.cpp && ./bench2">
{`--- insert at the FRONT, 100000 times (the case list is supposed to win) ---
std::list   push_front :      3.27 ms
std::deque  push_front :      0.40 ms
std::vector insert(begin): 261.56 ms
std::vector push_back + reverse: 0.04 ms

--- insert in the MIDDLE 20000 times, position found by traversal ---
std::list  (advance to mid, insert):   130.83 ms
std::vector (index mid, insert):         3.93 ms

--- sorting 1,000,000 ints ---
std::sort on vector :    14.52 ms
list::sort          :   185.82 ms

--- splice: moving 1,000,000 elements between lists ---
list::splice (whole range): 0.0000 ms
vector insert(range):       0.2031 ms`}
      </CodeBlock>

      <p>
        Read those four blocks as four separate verdicts.
      </p>
      <ol>
        <li>
          <strong>Front insertion: <code>list</code> lost to <code>deque</code> by 8&times;.</strong>{' '}
          Both are O(1) amortised; the deque writes into an existing block and the list calls{' '}
          <code>operator new</code> a hundred thousand times. And{' '}
          <code>vector::insert(begin())</code> at 261 ms is the genuinely quadratic answer — 80&times;
          worse than the list, which is the one place the textbook advice holds up. Note the fourth
          line, though: <strong>push to the back and reverse once, 0.04 ms</strong>, eighty times
          faster than the list. Most &quot;I need to prepend&quot; problems are really &quot;I built
          it in the wrong order&quot;.
        </li>
        <li>
          <strong>Middle insertion: <code>vector</code> won by 33&times;.</strong> 130.83 ms against
          3.93 ms, on the operation a linked list exists for. The list pays O(n) pointer-chasing to
          reach the middle and the vector pays O(n) <code>memmove</code>, and a{' '}
          <code>memmove</code> of a few kilobytes is enormously faster than walking a few thousand
          nodes. <strong>Big-O was the same; the constant was 33.</strong>
        </li>
        <li>
          <strong>Sorting: 14.52 ms against 185.82 ms.</strong> <code>list::sort</code> exists
          because <code>std::sort</code> requires random access, and it is a merge sort over
          pointers. 13&times;.
        </li>
        <li>
          <strong><code>splice</code>: the one real win, and it is total.</strong> Moving a million
          elements from one list to another relinks three pointers and is below the timer&apos;s
          resolution. The vector has to copy 4 MB. If your workload genuinely is &quot;move ranges
          of elements between sequences, or hold iterators that must stay valid across
          insertions&quot;, <code>std::list</code> is correct and nothing else will do. Otherwise
          this benchmark is the whole argument.
        </li>
      </ol>

      <InfoBox variant="tip" title="The rule, stated plainly">
        <p>
          <strong>Default to <code>std::vector</code>. Change only with a measurement.</strong>{' '}
          Reach for <code>std::deque</code> when you push and pop at both ends,{' '}
          <code>std::array</code> when the size is a compile-time constant, and{' '}
          <code>std::list</code> when you need <code>splice</code> or permanently stable
          iterators. <code>std::forward_list</code> exists, saves 8 bytes per node, and has no{' '}
          <code>size()</code>; you will not need it.
        </p>
        <p>
          This is not a C++-specific prejudice. It is the same reason <code>ArrayList</code> is the
          default in Java and <code>LinkedList</code> is a historical curiosity — C++ just removes
          the pointer indirection that was hiding half the difference.
        </p>
      </InfoBox>

      <h2>3. Growth, Capacity And <code>reserve</code></h2>
      <p>
        A <code>vector</code> has two sizes. <code>size()</code> is how many elements exist;{' '}
        <code>capacity()</code> is how many fit before the buffer must be replaced. The gap between
        them is the entire subject of the next section, so it is worth knowing exactly how it moves.
      </p>
      <p>
        The growth factor is <em>not</em> specified by the standard — only that{' '}
        <code>push_back</code> is amortised O(1), which any geometric factor satisfies. libstdc++
        and libc++ have historically differed. So here it is watched rather than asserted:
      </p>

      <CodeBlock language="cpp" title="growth.cpp — print the capacity every time it changes">
{`std::vector<int> v;
std::size_t last = v.capacity();
for (int i = 0; i < 100000; ++i) {
    v.push_back(i);
    if (v.capacity() != last) {
        std::println("push #{:<6} size={:<6} cap {:<6} -> {:<6} factor={:.3f}",
                     i + 1, v.size(), last, v.capacity(),
                     last == 0 ? 0.0 : double(v.capacity()) / double(last));
        last = v.capacity();
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 growth.cpp && ./growth (first 18 reallocations, all of them)">
{`push #1      size=1      cap 0      -> 1      factor=0.000
push #2      size=2      cap 1      -> 2      factor=2.000
push #3      size=3      cap 2      -> 4      factor=2.000
push #5      size=5      cap 4      -> 8      factor=2.000
push #9      size=9      cap 8      -> 16     factor=2.000
push #17     size=17     cap 16     -> 32     factor=2.000
push #33     size=33     cap 32     -> 64     factor=2.000
push #65     size=65     cap 64     -> 128    factor=2.000
push #129    size=129    cap 128    -> 256    factor=2.000
push #257    size=257    cap 256    -> 512    factor=2.000
push #513    size=513    cap 512    -> 1024   factor=2.000
push #1025   size=1025   cap 1024   -> 2048   factor=2.000
push #2049   size=2049   cap 2048   -> 4096   factor=2.000
push #4097   size=4097   cap 4096   -> 8192   factor=2.000
push #8193   size=8193   cap 8192   -> 16384  factor=2.000
push #16385  size=16385  cap 16384  -> 32768  factor=2.000
push #32769  size=32769  cap 32768  -> 65536  factor=2.000
push #65537  size=65537  cap 65536  -> 131072 factor=2.000
after 100000 pushes: size=100000 cap=131072 reallocations=18`}
      </CodeBlock>

      <p>
        <strong>Exactly 2.000, every time, on this implementation.</strong> First allocation is 1
        element, not some default block; eighteen reallocations to reach a hundred thousand
        elements; and the final capacity is <strong>131,072 for 100,000 elements — 31% of the
        buffer is unused</strong>. That last fact is the practical consequence of a factor of two
        and the reason <code>shrink_to_fit</code> exists.
      </p>
      <p>
        Java&apos;s <code>ArrayList</code> does the same job with different numbers, and since the
        field is private this was measured by reflection rather than from memory:
      </p>

      <CodeBlock language="java" title="Growth.java — reading ArrayList's private elementData">
{`Field f = ArrayList.class.getDeclaredField("elementData");
f.setAccessible(true);
ArrayList<Integer> list = new ArrayList<>();
int last = ((Object[]) f.get(list)).length;
for (int i = 0; i < 200; i++) {
    list.add(i);
    int cap = ((Object[]) f.get(list)).length;
    if (cap != last) { /* print i, last, cap, cap / last */ last = cap; }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — java --add-opens java.base/java.util=ALL-UNNAMED Growth (JDK 26.0.1)">
{`start cap = 0
add #1    cap 0    -> 10   factor=0.000
add #11   cap 10   -> 15   factor=1.500
add #16   cap 15   -> 22   factor=1.467
add #23   cap 22   -> 33   factor=1.500
add #34   cap 33   -> 49   factor=1.485
add #50   cap 49   -> 73   factor=1.490
add #74   cap 73   -> 109  factor=1.493
add #110  cap 109  -> 163  factor=1.495
add #164  cap 163  -> 244  factor=1.497`}
      </CodeBlock>

      <p>
        <strong>1.5&times; in Java, 2&times; here</strong> — Java&apos;s{' '}
        <code>oldCapacity + (oldCapacity &gt;&gt; 1)</code>, with a first jump straight to 10. Less
        wasted memory, more reallocations. Neither is wrong; the point is that the number is an
        implementation decision in both languages and you should check rather than remember.
      </p>

      <CodeBlock language="text" title="Real output — the rest of growth.cpp: reserve, clear and shrink_to_fit">
{`--- reserve() then push ---
after reserve(1000): size=0 cap=1000
after 1000 pushes:   size=1000 cap=1000 data moved? false
one more push:       size=1001 cap=2000 data moved? true

--- what shrinks, what does not ---
vector<int> c(1000):          size=1000 cap=1000
after clear():                size=0 cap=1000
after shrink_to_fit():        size=0 cap=0

--- sizeof the container object itself (not its elements) ---
sizeof(std::vector<int>)        = 24
sizeof(std::deque<int>)         = 48`}
      </CodeBlock>

      <p>
        Four facts in there worth keeping:
      </p>
      <ul>
        <li>
          <strong><code>reserve(n)</code> sets capacity exactly</strong>, not to the next power of
          two. A thousand pushes afterwards did not move the buffer; the thousand-and-first
          doubled it to 2000 and moved everything.
        </li>
        <li>
          <strong><code>clear()</code> does not release memory.</strong> Size 0, capacity still
          1000. It destroys the elements and keeps the buffer, which is usually what you want and
          occasionally a leak-shaped surprise in a long-lived object.
        </li>
        <li>
          <strong><code>shrink_to_fit()</code> is the one that frees</strong>, and it is a{' '}
          <em>request</em> — the standard permits an implementation to ignore it. This one does not.
        </li>
        <li>
          <strong>A <code>vector</code> is 24 bytes</strong> regardless of how many elements it
          holds: three pointers (begin, end, end-of-capacity). A <code>deque</code> is 48.
        </li>
      </ul>

      <InfoBox variant="tip" title="reserve() is the cheapest optimisation in C++, and the cross-reference">
        <p>
          If you know roughly how many elements are coming, say so. It converts eighteen
          allocate-move-free cycles into one allocation, and — more importantly for this lesson —{' '}
          <strong>it is the only way to make iterators and pointers into a growing vector stay
          valid.</strong>
        </p>
        <p>
          What reallocation costs <em>per element</em> was measured in{' '}
          <a href="/cpp/move-semantics">the move-semantics lesson</a>: five{' '}
          <code>emplace_back</code>s from capacity 1 cost <strong>7 moves</strong> for a type with a{' '}
          <code>noexcept</code> move constructor and <strong>7 copies</strong> for one without.
          That is the same geometric sequence as the capacities above (1 + 2 + 4 = 7), and whether
          each one is a move or a copy is decided by the special-member matrix from{' '}
          <a href="/cpp/classes">the classes lesson</a>. This page does not repeat that
          measurement; it is the other half of this one.
        </p>
      </InfoBox>

      <h2>4. The Centrepiece: Iterator Invalidation</h2>
      <p>
        Everything above was setup for this. <strong>An iterator, a pointer, a reference, a{' '}
        <code>span</code> and a <code>string_view</code> into a container are all just addresses
        into storage the container owns.</strong> When the container frees or moves that storage,
        every one of them becomes a dangling pointer — and C++ does not track them, does not
        invalidate them, and does not tell you. You hold an address to freed memory and the next
        read is undefined behaviour.
      </p>
      <p>
        That is the whole idea. The rest is knowing which operations do it.
      </p>

      <FlowChart
        title="What one push_back does to everything pointing into a vector (measured)"
        chart={
          'graph TD\n' +
          '  S["vector&lt;int&gt; prices{100, 200, 300};<br/>shrink_to_fit() -&gt; size 3, capacity 3<br/>buffer at 0x6020000000d0, 12 bytes"] --> R["int&amp; first = prices[0];<br/>a reference INTO that buffer"]\n' +
          '  R --> P["prices.push_back(400);<br/>size == capacity, so:"]\n' +
          '  P --> A1["1. allocate a NEW buffer,<br/>capacity 3 -&gt; 6 (measured factor: exactly 2.0)"]\n' +
          '  A1 --> A2["2. MOVE or copy all 3 elements across<br/>(which one is decided by the special-member<br/>matrix from the classes lesson)"]\n' +
          '  A2 --> A3["3. destroy the old elements"]\n' +
          '  A3 --> A4["4. FREE the old buffer -&gt; the 12-byte region<br/>at 0x6020000000d0 is now dead"]\n' +
          '  A4 --> D["\'first\' still holds 0x6020000000d0.<br/>Every iterator, pointer, reference, span<br/>and string_view into the old buffer<br/>is now DANGLING."]\n' +
          '  D --> O1["No sanitizer: MEASURED<br/>prints \'after=2\' instead of 100,<br/>identically at -O0, -O1 and -O2.<br/>Exit code 0. No warning at compile time."]\n' +
          '  D --> O2["ASan: MEASURED<br/>heap-use-after-free, READ of size 4,<br/>frame #0 is YOUR line, with the<br/>freeing stack ending in<br/>vector::__emplace_back_slow_path.<br/>Caught at -O0, -Og, -O1 AND -O2."]\n' +
          '  D --> O3["Java equivalent: there isn\'t one.<br/>ArrayList holds references; growth copies<br/>the pointer array, never the objects,<br/>so a reference you already hold stays valid."]\n' +
          '  style A4 fill:#3b1a1a,stroke:#f87171\n' +
          '  style D fill:#3b1a1a,stroke:#f87171\n' +
          '  style O1 fill:#3b1a1a,stroke:#f87171\n' +
          '  style O2 fill:#1a3329,stroke:#4ade80\n' +
          '  style O3 fill:#1a2744,stroke:#5b9cf6\n' +
          '  style A1 fill:#3d2f14,stroke:#fb923c\n' +
          '  style A2 fill:#3d2f14,stroke:#fb923c\n' +
          '  style A3 fill:#3d2f14,stroke:#fb923c'
        }
      />

      <CodeBlock language="cpp" title="inval2.cpp — eleven lines, one bug">
{`#include <print>
#include <vector>

int read_through(const int& r) { return r; }     // keeps the read in main's frame

int main() {
    std::vector<int> prices{100, 200, 300};
    prices.shrink_to_fit();                  // capacity == size == 3

    int& first = prices[0];                  // a reference INTO the buffer
    int  before = read_through(first);

    prices.push_back(400);                   // capacity full -> REALLOCATION

    int after = read_through(first);         // <-- reads the freed buffer
    std::println("before={} after={}", before, after);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — no sanitizer, three optimisation levels">
{`$ for o in -O0 -O1 -O2; do clang++ -std=c++23 -Wall -Wextra -g $o inval2.cpp -o nos && ./nos; done
before=100 after=2    (exit 0)
before=100 after=2    (exit 0)
before=100 after=2    (exit 0)`}
      </CodeBlock>

      <p>
        <strong><code>after=2</code>.</strong> Not 100, not a crash, not a warning — the number 2,
        which is whatever the allocator wrote into the freed block when libc++ recycled it. Exit
        code 0. <code>-Wall -Wextra</code> says nothing. This is the shape of C++ bug{' '}
        <a href="/cpp/intro">the intro</a> warned about: it compiled, it ran, it printed something,
        and it was wrong.
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsanitize=address -g -O0 inval2.cpp -o inval2_O0 && ./inval2_O0 (abridged)">
{`=================================================================
==45029==ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000d0 at pc 0x000104154920 bp 0x00016bcaa600 sp 0x00016bcaa5f8
READ of size 4 at 0x6020000000d0 thread T0
    #0 0x00010415491c in read_through(int const&) inval2.cpp:4
    #1 0x000104154bd4 in main inval2.cpp:15
    #2 0x0001813c04e0 in start+0x1b4c (dyld:arm64e+0x204e0)

0x6020000000d0 is located 0 bytes inside of 12-byte region [0x6020000000d0,0x6020000000dc)
freed by thread T0 here:
    #0 ... in _ZdlPv+0x74 (libclang_rt.asan_osx_dynamic.dylib:arm64e+0x50558)
    ...
    #6 ... in int* std::__1::vector<int>::__emplace_back_slow_path<int>(int&&) vector.h:1113
    ...
    #11 0x0001043ecbac in main inval2.cpp:12          <-- the push_back

previously allocated by thread T0 here:
    ...
    #8 ... in std::__1::vector<int>::vector(std::initializer_list<int>) vector.h:277`}
      </CodeBlock>

      <p>
        Three stacks: where you read it, where it was freed, where it was allocated. Frame{' '}
        <code>#11</code> of the freeing stack is <code>main inval2.cpp:12</code> — your{' '}
        <code>push_back</code> — and the frame above it names{' '}
        <code>__emplace_back_slow_path</code>, which is libc++&apos;s reallocation path.{' '}
        <strong>The report tells you the line that invalidated the reference and the line that used
        it.</strong> That is the single most useful thing in this lesson.
      </p>

      <CodeBlock language="text" title="Real measurements — does the optimisation level matter here?">
{`$ for o in -O0 -Og -O1 -O2; do
>   clang++ -std=c++23 -fsanitize=address -g $o inval2.cpp -o sw && ./sw
> done
-O0 : CAUGHT heap-use-after-free (exit 134)
-Og : CAUGHT heap-use-after-free (exit 134)
-O1 : CAUGHT heap-use-after-free (exit 134)
-O2 : CAUGHT heap-use-after-free (exit 134)`}
      </CodeBlock>

      <InfoBox variant="success" title="A caveat from phase 2 that does NOT apply here, checked rather than assumed">
        <p>
          <a href="/cpp/memory-bugs">The memory-bugs lesson</a> measured that{' '}
          <strong>stack-use-after-scope is only caught at <code>-O0</code></strong> — not{' '}
          <code>-Og</code>, not <code>-O1</code> — and that{' '}
          <strong>use-after-return needs <code>ASAN_OPTIONS=detect_stack_use_after_return=1</code></strong>,
          which is off by default. Both of those are about <em>stack</em> storage, where the
          optimiser can reuse or elide the frame slots ASan was poisoning.
        </p>
        <p>
          Container invalidation is almost always a <em>heap</em> use-after-free, and the heap
          redzones survive optimisation. Measured above: caught at all four levels, with the same
          report. So the practical rule for this family of bug is milder than phase 2&apos;s —{' '}
          <strong>your normal <code>-O1 -g -fsanitize=address</code> CI job will find
          these.</strong> Keep the <code>-O0</code> run for the stack cases.
        </p>
        <p>
          One phase-2 fact still holds and bites here: <strong>LeakSanitizer does not exist on this
          platform</strong> — <code>-fsanitize=leak</code> is rejected by the driver — so a
          container that grows without bound is not something a sanitizer will report. That is a{' '}
          <code>MallocStackLogging</code> / <code>leaks</code> job, as measured in that lesson.
        </p>
      </InfoBox>

      <h3>The Java instinct, written in C++</h3>
      <p>
        Here is the loop everybody writes once. It is the same source in both languages.
      </p>

      <CodeBlock language="cpp" title="erase2.cpp — tracing to stderr, because stdout does not survive what happens next">
{`#include <print>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6};
    std::println(stderr, "before: size={} capacity={}", v.size(), v.capacity());

    int visits = 0;
    for (auto it = v.begin(); it != v.end(); ++it) {
        std::println(stderr, "  visit {:>2}: *it = {:<12} size={}", ++visits, *it, v.size());
        if (*it % 2 == 0) v.erase(it);          // 'it' is invalidated here
        if (visits == 12) { std::println(stderr, "  ...stopping at 12"); break; }
    }
    std::println(stderr, "after: size={}", v.size());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — no sanitizer, -O0 and -O2 are byte-identical">
{`$ clang++ -std=c++23 -Wall -Wextra -g -O0 erase2.cpp -o e2a && ./e2a; echo "exit=$?"
before: size=6 capacity=6
  visit  1: *it = 1            size=6
  visit  2: *it = 2            size=6
  visit  3: *it = 4            size=5
  visit  4: *it = 6            size=4
  visit  5: *it = 6            size=3
exit=138

$ clang++ -std=c++23 -Wall -Wextra -g -O2 erase2.cpp -o e2b && ./e2b; echo "exit=$?"
  ... identical trace ...
exit=138`}
      </CodeBlock>

      <p>
        Read the trace. It contains <em>three different bugs</em> from one mistake:
      </p>
      <ol>
        <li>
          <strong>Visit 3 reads 4. The value 3 was never visited.</strong> Erasing element 1 shifted
          everything left, so the iterator — which is just a pointer into the buffer — now referred
          to the element that <em>moved into</em> that slot. Then <code>++it</code> skipped over it.
        </li>
        <li>
          <strong>Visit 5 reads 6 again</strong>, at a position past the new <code>size()</code>.
          The loop is now reading storage inside the capacity but outside the container.
        </li>
        <li>
          <strong>The loop never terminates normally.</strong> <code>it != v.end()</code> compares
          addresses, and the iterator stepped <em>past</em> the shrinking <code>end()</code> instead
          of landing on it. It never reached the <code>visits == 12</code> escape hatch either —{' '}
          <code>exit=138</code> is <code>128 + 10</code>, <strong><code>SIGBUS</code></strong>, from
          walking off the end of the mapped page.
        </li>
      </ol>
      <p>
        And one more thing, which is why the trace prints to <code>stderr</code>: the first draft of
        this demonstration used <code>std::println</code> to <code>stdout</code> and produced{' '}
        <strong>no output whatsoever</strong>, just <code>exit=138</code>. <code>stdout</code> is
        block-buffered and the process died before any flush. <strong>A C++ program that crashes can
        swallow everything it told you.</strong>

      </p>

      <CodeBlock language="java" title="EraseLoop.java — the same loop">
{`List<Integer> v = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
System.out.println("before: " + v);
try {
    for (Integer x : v) {                 // the same loop
        System.out.println("  visit: " + x + "  size=" + v.size());
        if (x % 2 == 0) v.remove(x);
    }
} catch (RuntimeException e) {
    System.out.println("THREW: " + e.getClass().getName());
}
System.out.println("after: " + v);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — javac EraseLoop.java && java EraseLoop (JDK 26.0.1)">
{`before: [1, 2, 3, 4, 5, 6]
  visit: 1  size=6
  visit: 2  size=6
THREW: java.util.ConcurrentModificationException
after: [1, 3, 4, 5, 6]
Iterator.remove(): [1, 3, 5]
removeIf():        [1, 3, 5]
exit=0`}
      </CodeBlock>

      <p>
        Java caught it on the <em>third</em> iteration — the one right after the mutation — because{' '}
        <code>ArrayList</code> keeps a <code>modCount</code> and the iterator compares it on every{' '}
        <code>next()</code>. You get an exception, a stack trace, a line number and a process that
        is still alive. <strong>That is a feature with a runtime cost, and C++ did not buy
        it.</strong> There is no <code>modCount</code> in a <code>std::vector</code>; a{' '}
        <code>vector&lt;int&gt;::iterator</code> on libc++ is literally an <code>int*</code>.
      </p>

      <CodeBlock language="text" title="Real output — the same broken C++ loop under ASan, all four optimisation levels">
{`$ for o in -O0 -Og -O1 -O2; do
>   clang++ -std=c++23 -fsanitize=address -g $o erase1.cpp -o s && ./s
> done
-O0 : ERROR: AddressSanitizer: container-overflow (exit 134)
-Og : ERROR: AddressSanitizer: container-overflow (exit 134)
-O1 : ERROR: AddressSanitizer: container-overflow (exit 134)
-O2 : ERROR: AddressSanitizer: container-overflow (exit 134)

==45141==ERROR: AddressSanitizer: container-overflow on address 0x603000001c40 ...
READ of size 4 at 0x603000001c40 thread T0
    #0 0x000104470c8c in main erase1.cpp:11
0x603000001c40 is located 16 bytes inside of 24-byte region [0x603000001c30,0x603000001c48)`}
      </CodeBlock>

      <p>
        <code>container-overflow</code> is a different diagnosis from{' '}
        <code>heap-use-after-free</code> and worth recognising:{' '}
        <strong>libc++ annotates the gap between <code>size()</code> and{' '}
        <code>capacity()</code> as poisoned</strong> when built under ASan, so reading an element
        that is inside the allocation but outside the container is caught too. Frame{' '}
        <code>#0</code> is <code>main erase1.cpp:11</code>, the <code>*it</code>. ASan here is the
        closest thing C++ has to <code>ConcurrentModificationException</code>, and it is opt-in at
        build time rather than always on.
      </p>

      <InfoBox variant="danger" title="What libc++ hardening does and does not catch — measured, and the answer is disappointing">
        <p>
          <a href="/cpp/memory-bugs">Phase 2</a> introduced{' '}
          <code>-D_LIBCPP_HARDENING_MODE=...</code> as the cheap always-on option. It was worth
          checking whether it helps with this family of bug. It does not.
        </p>
        <CodeBlock language="text" title="Real output — the broken erase loop, no sanitizer, each hardening mode">
{`$ for m in _LIBCPP_HARDENING_MODE_FAST _LIBCPP_HARDENING_MODE_EXTENSIVE \\
>          _LIBCPP_HARDENING_MODE_DEBUG; do
>   clang++ -std=c++23 -D_LIBCPP_HARDENING_MODE=$m -g -O1 erase1.cpp -o h && ./h
> done
_LIBCPP_HARDENING_MODE_FAST      : exit=138  (no message)
_LIBCPP_HARDENING_MODE_EXTENSIVE : exit=138  (no message)
_LIBCPP_HARDENING_MODE_DEBUG     : exit=138  (no message)`}
        </CodeBlock>
        <p>
          All three died of the same <code>SIGBUS</code> as the unhardened build, silently. The
          hardening modes check <em>bounds on indexing</em>, not <em>iterator validity</em> — and on
          that job they are excellent:
        </p>
        <CodeBlock language="text" title="Real output — std::vector<int> v{1,2,3}; then v[7]">
{`none                             : exit=0    v[7] = 0
_LIBCPP_HARDENING_MODE_FAST      : exit=133   (silent SIGTRAP)
_LIBCPP_HARDENING_MODE_EXTENSIVE : exit=133   (silent SIGTRAP)
_LIBCPP_HARDENING_MODE_DEBUG     : exit=134
  .../__vector/vector.h:414: libc++ Hardening assertion __n < size() failed:
  vector[] index out of bounds

$ # and for comparison, the checked accessor needs no flags at all:
v.at(7) threw std::out_of_range: vector`}
        </CodeBlock>
        <p>
          So: <strong>hardening turns <code>v[7]</code> from a silent <code>0</code> into a crash,
          and does nothing at all about a stale iterator.</strong> Use it — it is nearly free — but
          do not expect it to replace the ASan job. And note <code>v.at(7)</code>, which throws{' '}
          <code>std::out_of_range</code> in every build with no flags; the only reason not to use it
          everywhere is the branch.
        </p>
      </InfoBox>

      <h3>The loops that are actually correct</h3>

      <CodeBlock language="cpp" title="erasefix.cpp">
{`// 1. erase() RETURNS the next valid iterator. Reassign; do not ++.
std::vector<int> a{1, 2, 3, 4, 5, 6};
for (auto it = a.begin(); it != a.end(); ) {
    if (*it % 2 == 0) it = a.erase(it);
    else              ++it;
}

// 2. Pre-C++20: the erase-remove idiom. (Next lesson explains why it is two calls.)
std::vector<int> b{1, 2, 3, 4, 5, 6};
b.erase(std::remove_if(b.begin(), b.end(), [](int x){ return x % 2 == 0; }), b.end());

// 3. C++20: one call, and it returns how many it removed.
std::vector<int> c{1, 2, 3, 4, 5, 6};
auto removed = std::erase_if(c, [](int x){ return x % 2 == 0; });`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 erasefix.cpp && ./erasefix">
{`it = erase(it) loop        : [1, 3, 5]
erase(remove_if(...), end()): [1, 3, 5]
std::erase_if(c, pred)     : [1, 3, 5]   (returned 3 = count removed)`}
      </CodeBlock>

      <p>
        <strong><code>std::erase_if(container, predicate)</code> is the answer</strong> — C++20, one
        line, no iterators in your source at all, and the direct equivalent of Java&apos;s{' '}
        <code>removeIf</code>. <a href="/cpp/algorithms">The next lesson</a> is about why form 2
        needs two function calls, which is a genuinely surprising piece of API history.
      </p>

      <InfoBox variant="warning" title="The index-based loop: a bug that passed its first test">
        <p>
          The other way people fix this is to iterate by index, which cannot dangle. It can still
          skip, and this is a good illustration of why &quot;I tested it&quot; is not the same as
          &quot;it is right&quot;:
        </p>
        <CodeBlock language="cpp" title="skip.cpp">
{`for (std::size_t i = 0; i < d.size(); ++i)
    if (d[i] % 2 == 0) d.erase(d.begin() + (long)i);     // ++i then skips one`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — two inputs, clang++ -std=c++23 -O2 skip.cpp && ./skip">
{`[1, 2, 3, 4, 5, 6] -> index loop gives [1, 3, 5]    erase_if gives [1, 3, 5]  (same, by luck)
[1, 2, 4, 6, 3]    -> index loop gives [1, 4, 3]    erase_if gives [1, 3]     <-- WRONG`}
        </CodeBlock>
        <p>
          <strong>The first input — the obvious one to test with — gives the right answer.</strong>{' '}
          It takes two <em>adjacent</em> matches to expose the skip, and then the 4 survives. No
          crash, no sanitizer report, no undefined behaviour: just a quietly wrong result, which is
          the worst of the three outcomes in this section because nothing will ever tell you. If you
          must index, decrement <code>i</code> after erasing, or iterate backwards, or — far better
          — call <code>std::erase_if</code>.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="A test this lesson tried and had to throw away: comparing addresses proves nothing">
        <p>
          The first draft established the invalidation table below by recording{' '}
          <code>&amp;element</code> before an operation and after it, on the theory that{' '}
          <em>same address means still valid</em>. That theory is false, and the counterexample is
          deterministic on this allocator:
        </p>
        <CodeBlock language="text" title="Real output — reuse.cpp, two runs">
{`=== An address can be reused: p == q does not mean the object survived ===
freed buffer was at 0x1031c5b60
new vector's buffer at 0x1031c5b60
same address? true

vector<int>(5): 0x1031c5b60 -> reserve(100) 0x1031c7040 -> shrink_to_fit 0x1031c5b60
p2 == p0? true   (two reallocations happened either way)

=== run 2 ===
same address? true
vector<int>(5): 0x100b35b60 -> reserve(100) 0x100b36040 -> shrink_to_fit 0x100b35b60
p2 == p0? true`}
        </CodeBlock>
        <p>
          <code>reserve(100)</code> freed the buffer and <code>shrink_to_fit()</code> asked for the
          same size again — and <code>malloc</code> handed back the <em>identical block</em>. Two
          reallocations, every iterator invalidated twice, and the address test reports that nothing
          happened. <strong>Address equality is evidence of allocator behaviour, not of
          validity.</strong> The table below is therefore the standard&apos;s rules, with
          measurements used to <em>demonstrate</em> the interesting rows rather than to derive them,
          and ASan used whenever the question is &quot;did this actually dangle&quot;.
        </p>
      </InfoBox>

      <h2>5. <code>array</code>, <code>deque</code> And <code>list</code></h2>
      <p>
        With invalidation in hand, the other sequence containers are mostly a question of what their
        storage looks like — because the storage layout <em>is</em> the invalidation rule.
      </p>

      <h3><code>std::array&lt;T, N&gt;</code> — the size is part of the type</h3>
      <CodeBlock language="text" title="Real output — sv.cpp, the std::array section">
{`sizeof(std::array<int,5>) = 20  (5 * sizeof(int) = 20)
a.size() is constexpr     : 5
a.data() on the stack?    : true
sizeof(std::vector<int>)  = 24 regardless of element count`}
      </CodeBlock>
      <p>
        Twenty bytes, no pointer, no heap, <code>data()</code> <em>is</em> the object. It is a raw C
        array that knows its own length and does not decay, which{' '}
        <a href="/cpp/references">the references lesson</a> made the case for. For invalidation it is
        the easy case: <strong><code>std::array</code> has no operation that invalidates anything</strong>,
        because it has no operation that changes its size. The only way to dangle is for the array
        itself to go out of scope — which is a stack lifetime bug, and therefore the one case in
        this lesson where phase 2&apos;s <code>-O0</code>-only caveat for{' '}
        <code>stack-use-after-scope</code> does apply.
      </p>

      <h3><code>std::deque&lt;T&gt;</code> — contiguous in pieces</h3>
      <p>
        A <code>deque</code> is an array of pointers to fixed-size blocks of elements. That gives it
        O(1) push and pop at <em>both</em> ends with no reallocation of the elements, random access
        (via two indirections instead of one), and a very specific invalidation profile. The block
        size is not specified; measured by watching for address discontinuities:
      </p>

      <CodeBlock language="text" title="Real output — blocks.cpp, first detected boundary for each element size">
{`libc++ std::deque: how many elements per allocated block?
  deque<int>    : new block at element #1024 -> 1024 elements/block = 4096 bytes
  deque<string> : new block at element #170  ->  170 elements/block = 4080 bytes
  deque<512B>   : new block at element #16   ->   16 elements/block = 8192 bytes`}
      </CodeBlock>
      <p>
        That is <code>4096 / sizeof(T)</code>, with a floor of 16 elements for big types —{' '}
        <code>4096/4 = 1024</code>, <code>4096/24 = 170</code>, and 16 for the 512-byte struct. (The
        detector finds a boundary by spotting a non-consecutive address, so it misses boundaries
        where <code>malloc</code> happens to return an adjacent block; only the first clean reading
        for each type is quoted.)
      </p>
      <p>
        Now the interesting part. Here is every element&apos;s address before and after four
        operations:
      </p>

      <CodeBlock language="text" title="Real output — deq.cpp. deque<int>, 9 elements, printed as value@low-16-bits-of-address">
{`before                 0@0xf040 1@0xf044 2@0xf048 3@0xf04c 4@0xf050 5@0xf054 6@0xf058 7@0xf05c 8@0xf060
after erase(begin()+4) 0@0xf044 1@0xf048 2@0xf04c 3@0xf050 5@0xf054 6@0xf058 7@0xf05c 8@0xf060

before                 0@0x4000 1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 7@0x401c 8@0x4020
after erase(begin()+7) 0@0x4000 1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 8@0x401c

before                 0@0x4000 1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 7@0x401c 8@0x4020
after pop_front()      1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 7@0x401c 8@0x4020

before                 0@0x4000 1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 7@0x401c 8@0x4020
after push_front(-1)   -1@0x8ffc 0@0x4000 1@0x4004 2@0x4008 3@0x400c 4@0x4010 5@0x4014 6@0x4018 7@0x401c 8@0x4020`}
      </CodeBlock>

      <ul>
        <li>
          <strong><code>erase(begin()+4)</code> moved elements 0&ndash;3 forward by four bytes</strong>{' '}
          and left 5&ndash;8 where they were. libc++ shifts from whichever end is closer, so a
          front-half erase moves the front.
        </li>
        <li>
          <strong><code>erase(begin()+7)</code> moved only element 8</strong> — the back half was
          closer that time. Which side moves depends on <em>where</em> you erase, which is why the
          rule for <code>deque::erase</code> is simply &quot;assume everything moved&quot;.
        </li>
        <li>
          <strong><code>pop_front()</code> moved nothing.</strong> Erasing at an end only destroys
          the element at that end.
        </li>
        <li>
          <strong><code>push_front(-1)</code> moved nothing either</strong>, and put the new element
          at <code>0x8ffc</code> — a completely different block, allocated for the purpose.
        </li>
      </ul>
      <p>
        So <code>deque</code> has the property <code>vector</code> cannot have:{' '}
        <strong>pushing at either end never moves existing elements, so pointers and references
        into a deque survive <code>push_back</code> and <code>push_front</code></strong> — even
        though the iterators are formally invalidated, because the block index array may have been
        reallocated. That distinction between &quot;references survive&quot; and &quot;iterators are
        invalidated&quot; is real and is in the table below.
      </p>

      <h3><code>std::list&lt;T&gt;</code> — the one with permanent iterators</h3>
      <p>
        Section 2 made the performance case against it. Here is the case for it, which is not about
        speed at all: <strong>a <code>list</code> iterator points at a node, and a node never
        moves.</strong> Inserting or erasing anywhere invalidates nothing except iterators to the
        erased element itself. If your design needs to hand out long-lived handles to elements of a
        mutating collection, <code>list</code> (or <code>map</code>, below) is how you do it — and{' '}
        <code>splice</code> at 0.0000 ms for a million elements is the operation that has no
        equivalent anywhere else.
      </p>

      <InfoBox variant="warning" title="std::vector<bool> is not a container of bool">
        <p>
          One trap worth knowing before the table, because it breaks the model this whole lesson is
          built on. <code>std::vector&lt;bool&gt;</code> is a specialisation that packs elements
          into bits.
        </p>
        <CodeBlock language="text" title="Real output — vbool.cpp">
{`sizeof(vector<bool>) = 24, sizeof(vector<char>) = 24
8 bools: capacity() = 64   8 chars: capacity() = 8
vector<bool>::reference is bool&? false
vector<char>::reference is char&? true
decltype(b[0]) is 'a PROXY object'
does vector<bool> have .data()? false
does vector<char> have .data()? true`}
      </CodeBlock>
        <p>
          Eight <code>bool</code>s have capacity 64 — one 64-bit word.{' '}
          <code>v[0]</code> returns a <em>proxy object</em>, not a <code>bool&amp;</code>, so{' '}
          <code>auto&amp; r = v[0]</code> does not mean what it means for every other container and{' '}
          <code>bool* p = &amp;v[0]</code> does not compile. There is <strong>no{' '}
          <code>data()</code> member at all</strong>, so it is not a contiguous range and cannot be
          passed as a <code>span&lt;bool&gt;</code>. Use <code>std::vector&lt;char&gt;</code>,{' '}
          <code>std::vector&lt;std::uint8_t&gt;</code>, or <code>std::bitset&lt;N&gt;</code> if the
          size is fixed. (Note the detection idiom in that output had to be wrapped in a template:
          a <code>requires</code> expression on a concrete type is a hard error, exactly as{' '}
          <a href="/cpp/concepts">the concepts lesson</a> measured.)
        </p>
      </InfoBox>

      <h2>6. Ordered Trees Versus Hash Tables</h2>
      <p>
        <code>std::map</code> and <code>std::set</code> are <strong>balanced binary search
        trees</strong> (red-black, in every implementation). <code>std::unordered_map</code> and{' '}
        <code>std::unordered_set</code> are <strong>hash tables</strong> — added in C++11, which is
        why they got the longer names despite being the ones you want nine times out of ten. In Java
        the names tell you: <code>TreeMap</code> and <code>HashMap</code>. Here they do not.
      </p>
      <p>
        The one-line test for which you are looking at:
      </p>

      <CodeBlock language="text" title="Real output — maps.cpp, section 1">
{`inserted      : zulu alpha mike bravo yankee charlie
map           : alpha bravo charlie mike yankee zulu
unordered_map : yankee mike bravo alpha charlie zulu`}
      </CodeBlock>

      <p>
        <code>map</code> iterates in <strong>key order</strong>, always, because the tree is sorted
        by construction. <code>unordered_map</code> iterates in <strong>bucket order</strong>, which
        is neither insertion order nor key order and is not guaranteed stable across
        implementations, standard library versions, or even insertions. If you are relying on the
        order of anything coming out of an <code>unordered_</code> container, you have a bug waiting
        for a libc++ update.
      </p>

      <CodeBlock language="text" title="Real output — maps.cpp, section 2: one million <int,int> entries">
{`map<int,int>           :   1000000 allocations,    40000000 bytes (40.0 B/elem)
unordered_map<int,int> :   1000020 allocations,    50338568 bytes (50.3 B/elem)
  bucket_count = 1646237, load_factor = 0.6074, max_load_factor = 1.0
vector<pair<int,int>>  :        21 allocations,    16777208 bytes (16.8 B/elem)`}
      </CodeBlock>

      <p>
        Both associative containers are node-based: <strong>one allocation per element</strong>, for
        a million elements. A <code>map</code> node is 40 bytes to store 8 bytes of payload — two
        child pointers, a parent pointer, a colour bit, and the <code>pair</code>. The{' '}
        <code>unordered_map</code> adds the bucket array on top, hence the twenty extra allocations
        and 50.3 bytes per element. The <code>vector&lt;pair&gt;</code> row — 16.8 bytes per
        element in 21 allocations — is there as the reminder that{' '}
        <strong>for small collections, a sorted vector beats both of them on every axis</strong>.
      </p>

      <CodeBlock language="text" title="Real output — maps.cpp, section 3: one million successful find()s, best of three">
{`         N       map (ms) unordered (ms)          ratio
      1000           6.20           0.52         12.02x
     10000          49.47           1.11         44.57x
    100000          85.58           1.46         58.55x
   1000000         224.43           6.64         33.78x
   4000000         558.31          11.73         47.60x`}
      </CodeBlock>

      <p>
        Per lookup, that is <strong>6.2 ns vs 0.5 ns at a thousand keys</strong> and{' '}
        <strong>558 ns vs 11.7 ns at four million</strong>. The hash table grew by 23&times; across
        a 4000&times; increase in size; the tree grew by 90&times;.
      </p>
      <p>
        The textbook explanation for the tree is &quot;O(log n), so about 22 comparisons at four
        million keys&quot;. 558 nanoseconds is far too long for 22 comparisons. The real cost is
        that <strong>each level of the tree is a separate heap node at an address you cannot predict
        until you have read the level above</strong> — it is the churned-linked-list measurement
        from section 2 again, 22 dependent cache misses deep. O(log n) with a cache miss per level
        is a different animal from O(log n) in an array.
      </p>

      <InfoBox variant="info" title="What the tree buys you, and it is not nothing">
        <CodeBlock language="text" title="Real output — maps.cpp, section 4">
{`map.lower_bound(25)  -> first key >= 25 : 30
map range [15, 35)   ->
    20 = twenty
    30 = thirty
*m.begin() (smallest) = 10, *m.rbegin() (largest) = 40

unordered_map has no lower_bound, no rbegin, no operator< ordering.`}
        </CodeBlock>
        <p>
          <strong>Range queries, nearest-key lookups, min, max, and sorted iteration</strong> — all
          O(log n) or free, none of them available from a hash table at any price. If your keys are
          timestamps and you ever ask &quot;everything between these two times&quot;,{' '}
          <code>std::map</code> is the right container and the 47&times; lookup penalty is the price
          of the feature you are using. If you only ever ask &quot;give me the one with this
          key&quot;, you are paying it for nothing.
        </p>
        <p>
          Two more differences worth having in mind. <strong><code>map</code> needs{' '}
          <code>operator&lt;</code>; <code>unordered_map</code> needs{' '}
          <code>std::hash</code> and <code>operator==</code></strong> — and there is no{' '}
          <code>std::hash</code> for your struct, or for <code>std::pair</code>, so a custom key
          type is more work for the hash container. And <strong><code>map</code> gives you
          worst-case guarantees; <code>unordered_map</code> gives you average-case</strong>, which
          matters more than it sounds:
        </p>
        <CodeBlock language="text" title="Real output — badhash.cpp: 20,000 insertions then 20,000 lookups">
{`unordered_map, std::hash          :    0.50 ms
unordered_map, every key collides :  477.00 ms
map (balanced tree, no hash)      :    1.26 ms`}
        </CodeBlock>
        <p>
          A hash function that returns a constant turns the table into a linked list and the
          container into <strong>954&times; slower than itself and 379&times; slower than the
          tree</strong>. You will not write <code>return 42;</code> — but a hand-rolled hash that
          ignores a high-entropy field, or attacker-chosen keys in a web request, produces the same
          shape. The tree cannot be attacked this way.
        </p>
      </InfoBox>

      <p>
        For invalidation, both associative containers behave the same way and the way is{' '}
        <em>good</em>: they are node-based, so insertion never moves an existing element. Verified
        on the rehash, which is the operation that sounds like it ought to move everything:
      </p>

      <CodeBlock language="text" title="Real output — stability.cpp, the unordered_map rehash probe">
{`unordered_map rehash: do ELEMENT addresses move?
  bucket_count 4 -> 16384
  &m[3] before = 0x9dac00b94, after = 0x9dac00b94  -> SAME (node-based: references survive)`}
      </CodeBlock>

      <p>
        A rehash reallocates the <em>bucket array</em> and relinks the nodes. The nodes — and
        therefore your pointers and references to the values — do not move.{' '}
        <strong>Iterators are invalidated by a rehash; references are not.</strong> Same distinction
        as <code>deque</code>&apos;s ends, for the same reason, and it is the reason{' '}
        <code>reserve()</code> on an <code>unordered_map</code> is worth calling: it is the only way
        to avoid the rehash, and thus the only way to keep iterators valid across a batch of
        inserts.
      </p>

      <h2>7. Non-Owning Views: <code>span</code> And <code>string_view</code></h2>
      <p>
        <a href="/cpp/types">The types lesson</a> introduced <code>string_view</code> and measured
        its allocation savings and its missing NUL;{' '}
        <a href="/cpp/references">the references lesson</a> introduced <code>std::span</code> as the
        replacement for <code>(pointer, length)</code> parameters. Neither is repeated here. What
        belongs in <em>this</em> lesson is the single sentence that connects them to everything
        above:
      </p>
      <p>
        <strong>A <code>span</code> or a <code>string_view</code> is an iterator pair with a
        friendlier name, and every invalidation rule in this lesson applies to it
        identically.</strong> They are 16 bytes of pointer and length, they own nothing, and they
        keep nothing alive.
      </p>

      <CodeBlock language="cpp" title="span1.cpp">
{`int sum(std::span<const int> xs) {            // a non-owning view: no copy
    int t = 0; for (int x : xs) t += x; return t;
}

int main() {
    std::vector<int> v{1, 2, 3};
    v.shrink_to_fit();
    std::span<const int> s = v;               // points at v's buffer
    std::println(stderr, "sum before = {}  (span size {})", sum(s), s.size());
    v.push_back(4);                           // REALLOCATION: s now dangles
    std::println(stderr, "sum after  = {}  (span size {})", sum(s), s.size());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real measurements — span1.cpp, with and without the sanitizer">
{`$ clang++ -std=c++23 -Wall -Wextra -g -O0 span1.cpp -o sp0
(no diagnostics)

$ clang++ -std=c++23 -g -O0 span1.cpp -o sp && ./sp
sum before = 6  (span size 3)   sum after  = 4  (span size 3)   exit=0

$ clang++ -std=c++23 -g -O2 span1.cpp -o sp && ./sp
sum before = 6  (span size 3)   sum after  = 8  (span size 3)   exit=0

$ for o in -O0 -Og -O1 -O2; do clang++ -std=c++23 -fsanitize=address -g $o span1.cpp -o sp && ./sp; done
-O0 : ERROR: AddressSanitizer: heap-use-after-free (exit 134)
-Og : ERROR: AddressSanitizer: heap-use-after-free (exit 134)
-O1 : ERROR: AddressSanitizer: heap-use-after-free (exit 134)
-O2 : ERROR: AddressSanitizer: heap-use-after-free (exit 134)

    #0 ... in sum(std::__1::span<int const, 18446744073709551615ul>) span1.cpp:6
    #1 ... in main span1.cpp:15`}
      </CodeBlock>

      <p>
        <strong><code>sum after = 4</code> at <code>-O0</code> and <code>sum after = 8</code> at{' '}
        <code>-O2</code>.</strong> Two different wrong answers from the same source file, both with
        exit code 0, both with no compile-time diagnostic. The <code>span</code> still reports{' '}
        <code>size() == 3</code> — it has no idea anything happened. ASan catches it at every
        optimisation level and names your line.
      </p>

      <InfoBox variant="warning" title="-Wdangling-gsl: better than expected, and blind one call deep">
        <p>
          Clang does have a warning for the most common dangling-view shape, and it turned out to be{' '}
          <strong>on by default</strong> — no <code>-Wall</code> required, which was a pleasant
          surprise:
        </p>
        <CodeBlock language="cpp" title="views.cpp">
{`std::string load_name() { return std::string("configuration-service-alpha"); }

int main() {
    std::string_view sv = load_name();          // the temporary dies HERE
    std::println("sv = '{}'", sv);              // reads freed heap
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -g -O0 views.cpp (no -Wall)">
{`views.cpp:11:27: warning: object backing the pointer will be destroyed at the
      end of the full-expression [-Wdangling-gsl]
   11 |     std::string_view sv = load_name();          // the temporary dies HERE
      |                           ^~~~~~~~~~~
1 warning generated.

$ ./views       # built anyway, because it is a warning
sv = '                         '        (exit 0)

$ ASan, all four optimisation levels: ERROR: AddressSanitizer: heap-use-after-free`}
        </CodeBlock>
        <p>
          Twenty-five spaces instead of the string, exit 0. Now the same bug written the way it
          actually appears in a codebase — behind a helper function, and stored in a member:
        </p>
        <CodeBlock language="cpp" title="views2.cpp">
{`// A perfectly reasonable helper. It owns nothing, so it keeps nothing alive.
std::string_view first_word(const std::string& s) {
    return std::string_view(s).substr(0, s.find('-'));
}

struct Config {
    std::string_view name;                 // a view stored as a MEMBER
    explicit Config(const std::string& s) : name(s) {}
};

int main() {
    std::string_view w = first_word(load_name());   // dangles
    std::println("first_word = '{}'", w);

    Config c{load_name()};                          // also dangles
    std::println("config.name = '{}'", c.name);
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -g -O0 views2.cpp">
{`(no warnings about views2.cpp)

$ ASan -O0: ==45492==ERROR: AddressSanitizer: heap-use-after-free`}
        </CodeBlock>
        <p>
          <strong>Silence at <code>-Wall -Wextra</code>.</strong> The warning is a syntactic
          pattern-match on a temporary bound directly to a view in the same full-expression; one
          function call of indirection, or a constructor, and it is gone. Which is the same
          conclusion <a href="/cpp/references">the references lesson</a> reached about{' '}
          <code>-Wreturn-stack-address</code> and the same one{' '}
          <a href="/cpp/memory-bugs">the memory-bugs lesson</a> reached in general:{' '}
          <strong>the warning catches the version you would have spotted yourself; the sanitizer
          catches the version you would not.</strong>
        </p>
        <p>
          The rule that actually works: <strong>views are for parameters, not for members and not
          for return values.</strong> Take a <code>string_view</code> or a{' '}
          <code>span</code> as a parameter and use it before you return. If something has to be{' '}
          <em>stored</em>, store a <code>std::string</code> or a <code>std::vector</code> — own it.
        </p>
      </InfoBox>

      <h2>8. <code>emplace</code> Versus <code>insert</code></h2>
      <p>
        <code>emplace</code> is advertised as &quot;constructs in place, avoids a copy&quot;. That
        is true and it is also narrower than people think, so here it is instrumented: a type that
        counts its own constructions, copies, moves and destructions.
      </p>

      <CodeBlock language="cpp" title="emplace.cpp — abridged; the Counts struct and report() helper are elided">
{`struct Widget {
    std::string name;
    int weight;
    Widget(std::string n, int w) : name(std::move(n)), weight(w) { ++C.ctor; }
    Widget(const Widget& o) : name(o.name), weight(o.weight)    { ++C.copy; }
    Widget(Widget&& o) noexcept : name(std::move(o.name)), weight(o.weight) { ++C.move; }
    Widget& operator=(const Widget&)     { ++C.copy; return *this; }
    Widget& operator=(Widget&&) noexcept { ++C.move; return *this; }
    ~Widget() { ++C.dtor; }
};`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 emplace.cpp && ./emplace">
{`=== vector: four ways to add one element (capacity reserved) ===
push_back(lvalue)                              ctor=1 copy=1 move=0 dtor=0
push_back(Widget{...})  -- a temporary         ctor=1 copy=0 move=1 dtor=1
push_back(std::move(lvalue))                   ctor=1 copy=0 move=1 dtor=0
emplace_back("in place", 4)                    ctor=1 copy=0 move=0 dtor=0

=== the same, WITHOUT reserve: growth re-moves everything ===
5x emplace_back, no reserve   cap=8  ctor=5 copy=0 move=7 dtor=7
5x emplace_back, reserve(5)   cap=5  ctor=5 copy=0 move=0 dtor=0`}
      </CodeBlock>

      <p>
        The vector block is the straightforward half. <code>emplace_back(args...)</code> forwards
        your arguments to a constructor running <em>in the element slot</em>: one construction, zero
        copies, zero moves, zero destructions. <code>push_back</code> with an lvalue costs a copy;
        with a temporary or a <code>std::move</code> it costs a move. And the second block is the
        reallocation tax again — <strong>seven moves and seven destructions for five{' '}
        <code>emplace_back</code>s, all of which <code>reserve(5)</code> removes</strong>, matching
        the measurement in <a href="/cpp/move-semantics">the move-semantics lesson</a> exactly.
      </p>

      <CodeBlock language="text" title="Real output — the associative half, which is where the surprise is">
{`=== map<string,Widget>: inserting a key that is ABSENT ===
insert({"k", Widget{...}})                     ctor=1 copy=0 move=2 dtor=2
emplace("k", Widget{...})                      ctor=1 copy=0 move=1 dtor=1
try_emplace("k", "w", 1)                       ctor=1 copy=0 move=0 dtor=0

=== map<string,Widget>: inserting a key that is ALREADY PRESENT ===
insert({"k", Widget{...}})   [no-op]           ctor=1 copy=0 move=1 dtor=2
emplace("k", Widget{...})     [no-op]          ctor=1 copy=0 move=1 dtor=2
try_emplace("k", "w", 1)    [no-op]            ctor=0 copy=0 move=0 dtor=0

=== unordered_map, same two cases ===
absent:  emplace("k", Widget{...})             ctor=1 copy=0 move=1 dtor=1
present: emplace("k", Widget{...})             ctor=1 copy=0 move=1 dtor=2
present: try_emplace("k", "w", 1)              ctor=0 copy=0 move=0 dtor=0`}
      </CodeBlock>

      <p>
        <strong>This lesson expected <code>emplace</code> on an existing key to be a no-op. It is
        not.</strong> <code>ctor=1 copy=0 move=1 dtor=2</code> — the value was constructed, moved
        into a freshly allocated node, the map then discovered the key was already there, and both
        objects were destroyed. The work was done and thrown away. Same for{' '}
        <code>unordered_map</code>.
      </p>
      <p>
        <code>try_emplace</code> is the one that does nothing: <code>ctor=0</code>. It is C++17, it
        takes the key and then the value&apos;s constructor arguments separately, and it checks for
        the key <em>before</em> building anything. In the absent case it also beats{' '}
        <code>emplace</code> — <code>ctor=1 move=0</code> against <code>ctor=1 move=1</code> —
        because there is no temporary to move from.
      </p>

      <InfoBox variant="tip" title="The rules, in order of how often they matter">
        <ul>
          <li>
            <strong><code>emplace_back(args...)</code> over <code>push_back(T{'{'}args...{'}'})</code></strong>{' '}
            for sequences. Measured: zero moves against one. Use <code>push_back</code> when you
            already have the object.
          </li>
          <li>
            <strong><code>try_emplace(key, args...)</code> over <code>emplace</code> and{' '}
            <code>insert</code></strong> for maps, always. It is the only one that is free when the
            key exists, and it is also the only one whose arguments read in an obvious order. The
            counterpart for &quot;insert or overwrite&quot; is{' '}
            <code>insert_or_assign</code>.
          </li>
          <li>
            <strong><code>m[key]</code> on a map default-constructs a value if the key is
            missing</strong> and returns a reference to it. That is why <code>m[key]</code> does not
            exist on a <code>const</code> map, why it requires the value type to be
            default-constructible, and why reading a missing key through <code>[]</code> silently
            grows the container. Use <code>find</code>, <code>at</code>, or C++20&apos;s{' '}
            <code>contains</code>.
          </li>
          <li>
            <strong><code>reserve</code> dominates all of this.</strong> The seven-moves-to-zero
            result for five elements is a bigger effect than the emplace-versus-push_back result for
            one, and it is one line.
          </li>
        </ul>
      </InfoBox>

      <h2>9. The Invalidation Table</h2>
      <p>
        This is the reference to come back to. &quot;Iterators&quot; and
        &quot;references/pointers&quot; are listed separately because they genuinely differ — a{' '}
        <code>deque</code> push and an <code>unordered_map</code> rehash both invalidate iterators
        while leaving references intact, both measured above.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>Container</th>
            <th style={headStyle}>Operation</th>
            <th style={headStyle}>Iterators</th>
            <th style={headStyle}>References &amp; pointers</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>array</code></td>
            <td style={cellStyle}>anything (size cannot change)</td>
            <td style={cellStyle}>all stay valid</td>
            <td style={cellStyle}>all stay valid</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>vector</code></td>
            <td style={cellStyle}><code>push_back</code>, <code>insert</code>,{' '}
              <code>emplace</code> — <strong>when <code>size() == capacity()</code></strong></td>
            <td style={cellStyle}><strong>ALL invalid</strong></td>
            <td style={cellStyle}><strong>ALL invalid</strong></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>vector</code></td>
            <td style={cellStyle}>same, with spare capacity</td>
            <td style={cellStyle}>invalid from the insertion point to <code>end()</code></td>
            <td style={cellStyle}>invalid from the insertion point on</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>vector</code></td>
            <td style={cellStyle}><code>reserve</code>, <code>shrink_to_fit</code>,{' '}
              <code>resize</code> past capacity, assignment, <code>swap</code></td>
            <td style={cellStyle}><strong>ALL invalid</strong></td>
            <td style={cellStyle}><strong>ALL invalid</strong></td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>vector</code></td>
            <td style={cellStyle}><code>erase(pos)</code></td>
            <td style={cellStyle}>invalid from <code>pos</code> to <code>end()</code></td>
            <td style={cellStyle}>invalid from <code>pos</code> on</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>vector</code></td>
            <td style={cellStyle}><code>clear</code>, <code>pop_back</code></td>
            <td style={cellStyle}>the erased ones and <code>end()</code></td>
            <td style={cellStyle}>the erased ones</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>deque</code></td>
            <td style={cellStyle}><code>push_front</code>, <code>push_back</code></td>
            <td style={cellStyle}><strong>all invalid</strong> (the block index may move)</td>
            <td style={cellStyle}><strong>all stay valid</strong> — measured: nothing moved</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>deque</code></td>
            <td style={cellStyle}><code>erase</code> in the middle</td>
            <td style={cellStyle}><strong>ALL invalid</strong></td>
            <td style={cellStyle}><strong>ALL invalid</strong> — measured: one side shifts, and
              which side depends on the position</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>deque</code></td>
            <td style={cellStyle}><code>pop_front</code>, <code>pop_back</code></td>
            <td style={cellStyle}>the erased one and <code>end()</code></td>
            <td style={cellStyle}>the erased one only — measured: nothing else moved</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>list</code>,{' '}
              <code>forward_list</code></td>
            <td style={cellStyle}><code>insert</code>, <code>push_*</code>, <code>splice</code>,{' '}
              <code>merge</code></td>
            <td style={cellStyle}>all stay valid</td>
            <td style={cellStyle}>all stay valid</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>list</code></td>
            <td style={cellStyle}><code>erase</code></td>
            <td style={cellStyle}>only iterators to the erased element</td>
            <td style={cellStyle}>only references to the erased element</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>map</code>, <code>set</code>,{' '}
              <code>multimap</code>, <code>multiset</code></td>
            <td style={cellStyle}><code>insert</code>, <code>emplace</code>,{' '}
              <code>try_emplace</code></td>
            <td style={cellStyle}>all stay valid</td>
            <td style={cellStyle}>all stay valid</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>map</code>, <code>set</code></td>
            <td style={cellStyle}><code>erase</code></td>
            <td style={cellStyle}>only iterators to the erased element</td>
            <td style={cellStyle}>only references to the erased element</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>unordered_map</code>,{' '}
              <code>unordered_set</code></td>
            <td style={cellStyle}><code>insert</code> that triggers a <strong>rehash</strong></td>
            <td style={cellStyle}><strong>all invalid</strong></td>
            <td style={cellStyle}><strong>all stay valid</strong> — measured: bucket_count 4 &rarr;
              16384, <code>&amp;m[3]</code> unchanged</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>unordered_map</code></td>
            <td style={cellStyle}><code>insert</code> with no rehash (after{' '}
              <code>reserve</code>), or <code>erase</code></td>
            <td style={cellStyle}>only the erased ones</td>
            <td style={cellStyle}>only the erased ones</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>string</code></td>
            <td style={cellStyle}>anything that changes the length or capacity</td>
            <td style={cellStyle}><strong>assume ALL invalid</strong></td>
            <td style={cellStyle}><strong>assume ALL invalid</strong> — and note the SSO buffer
              lives <em>inside</em> the object, so growing past 22 characters moves the data from
              the stack to the heap</td>
          </tr>
        </tbody>
      </table>

      <p>
        Three ways to remember all of that, in descending order of usefulness:
      </p>
      <ol>
        <li>
          <strong>Ask where the elements live.</strong> One block that gets replaced
          (<code>vector</code>, <code>string</code>) means everything dies on growth. Separate
          nodes (<code>list</code>, <code>map</code>, <code>unordered_map</code>) means elements
          never move and only the erased one dies. Blocks with an index (<code>deque</code>) means
          the elements stay but the iterators cannot be trusted. <strong>You do not need to memorise
          the table if you know the layout.</strong>
        </li>
        <li>
          <strong>Never hold an iterator across a call that could mutate the container.</strong> Not
          &quot;try to be careful&quot; — do not do it. Recompute it, or index, or use an
          algorithm that does the mutation for you.
        </li>
        <li>
          <strong>Build one CI configuration with{' '}
          <code>-fsanitize=address</code>.</strong> Measured on this page: it catches the vector
          reallocation, the erase-in-loop, the dangling <code>span</code> and the dangling{' '}
          <code>string_view</code>, at every optimisation level, naming your line in all four cases.
          Nothing else on this page caught more than one of them.
        </li>
      </ol>

      <h2>Choosing A Container</h2>

      <FlowChart
        title="Choosing a container, with the measurement behind each branch"
        chart={
          'graph TD\n' +
          '  Q["You need a container"] --> Q1{"Do you need lookup by key?"}\n' +
          '  Q1 -->|no| Q2{"Is the size a compile-time<br/>constant?"}\n' +
          '  Q2 -->|yes| ARR["std::array&lt;T, N&gt;<br/>Measured: sizeof(array&lt;int,5&gt;) == 20,<br/>data() inside the object, zero allocations,<br/>and no operation that invalidates anything."]\n' +
          '  Q2 -->|no| Q3{"Do you push at the FRONT<br/>as well as the back?"}\n' +
          '  Q3 -->|no| VEC["std::vector&lt;T&gt; — the default.<br/>Measured: 4.0 bytes/element for int,<br/>1 allocation for 10M elements,<br/>0.4 ms to sum them."]\n' +
          '  Q3 -->|yes| DEQ["std::deque&lt;T&gt;<br/>Measured: 100k push_front in 0.40 ms<br/>vs list 3.27 ms. References survive<br/>push_front AND push_back."]\n' +
          '  Q1 -->|yes| Q4{"Do you ever need the keys<br/>IN ORDER, or a range query?"}\n' +
          '  Q4 -->|"no — just get by key"| UM["std::unordered_map / unordered_set<br/>THE HASH TABLE. Measured: 11.7 ns/lookup<br/>at 4M keys, 47x faster than std::map.<br/>But: 477 ms vs 0.50 ms with a bad hash."]\n' +
          '  Q4 -->|"yes — sorted iteration,<br/>lower_bound, min, max"| M["std::map / std::set<br/>A BALANCED TREE, not a hash map.<br/>Measured: 558 ns/lookup at 4M keys —<br/>22 dependent cache misses, not 22<br/>comparisons. Iteration comes out sorted."]\n' +
          '  VEC --> L{"Tempted by std::list?"}\n' +
          '  DEQ --> L\n' +
          '  L -->|"splice, or iterators that<br/>must survive insertion"| LY["std::list is the right answer and<br/>nothing else will do. Measured:<br/>splicing 1M elements took 0.0000 ms<br/>against vector 0.2031 ms."]\n' +
          '  L -->|"\'insertion-heavy\', i.e.<br/>the usual reason"| LN["Measured against vector: 6x the memory,<br/>20x slower to traverse fresh, 2900x once<br/>the nodes are churned, 33x slower to<br/>insert in the MIDDLE, 13x slower to sort,<br/>and beaten 8x at push_front by deque."]\n' +
          '  UM --> SMALL{"Fewer than a few hundred<br/>elements?"}\n' +
          '  M --> SMALL\n' +
          '  SMALL -->|yes| SV["Consider a sorted std::vector of pairs.<br/>Measured: 16.8 bytes/element in 21<br/>allocations, against map 40.0 B in<br/>1,000,000 and unordered_map 50.3 B."]\n' +
          '  SMALL -->|no| KEEP["Keep the associative container."]\n' +
          '  style VEC fill:#1a3329,stroke:#4ade80\n' +
          '  style ARR fill:#1a3329,stroke:#4ade80\n' +
          '  style UM fill:#1a2744,stroke:#5b9cf6\n' +
          '  style M fill:#1a2744,stroke:#5b9cf6\n' +
          '  style DEQ fill:#1a2744,stroke:#5b9cf6\n' +
          '  style SV fill:#1a2744,stroke:#5b9cf6\n' +
          '  style LY fill:#3d2f14,stroke:#fb923c\n' +
          '  style LN fill:#3b1a1a,stroke:#f87171'
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
            <td style={cellStyle}>&quot;The container holds my object&quot;</td>
            <td style={cellStyle}>It holds a copy. <code>&amp;o</code> was on the stack,{' '}
              <code>&amp;orders[0]</code> on the heap, and editing <code>o</code> after{' '}
              <code>push_back</code> changed nothing. Java&apos;s answer to the same program was{' '}
              <code>same object? true</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Mutating while iterating throws&quot;</td>
            <td style={cellStyle}>Java: <code>ConcurrentModificationException</code> on the third
              iteration. C++: skipped 3, skipped 5, read 6 twice, escaped its own termination
              condition, died of <code>SIGBUS</code> (exit 138) with <code>stdout</code> unflushed
              — identically at <code>-O0</code> and <code>-O2</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::map</code> is a hash map&quot;</td>
            <td style={cellStyle}>It is a red-black tree. Iteration came out sorted; lookups cost
              558 ns at 4M keys against <code>unordered_map</code>&apos;s 11.7 ns — 47&times;.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>list</code> is for insertion-heavy
              workloads&quot;</td>
            <td style={cellStyle}>It lost that benchmark 33&times;: 130.83 ms against the
              vector&apos;s 3.93 ms for 20,000 middle insertions, because reaching the position
              costs more than the <code>memmove</code>. <code>deque</code> beat it 8&times; at{' '}
              <code>push_front</code>. Its one real win is <code>splice</code>, at 0.0000 ms for a
              million elements.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A linked list costs you the pointers&quot;</td>
            <td style={cellStyle}>It costs you locality. 24 B/element against 4 is 6&times;, but
              traversal was 20&times; slower fresh and <strong>2,900&times; slower once the link
              order no longer matched the allocation order</strong> — same nodes, same count, only
              the order changed.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Contiguity means fewer cache misses&quot;</td>
            <td style={cellStyle}>It also means SIMD, and that was a third of the gap.{' '}
              <code>-fno-vectorize</code> moved the vector from 0.4 ms to 2.3 ms and left the list
              at 7.9 ms, reducing a 20&times; win to 3.4&times;.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The growth factor is 1.5, like Java&quot;</td>
            <td style={cellStyle}>Measured <strong>exactly 2.000</strong> on libc++, 18
              reallocations to 100,000 elements, final capacity 131,072 — 31% unused. Java&apos;s{' '}
              <code>ArrayList</code>, measured by reflection on the same machine: first jump to 10,
              then 1.5&times;.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>clear()</code> releases the memory&quot;</td>
            <td style={cellStyle}>Size 0, capacity still 1000. <code>shrink_to_fit()</code> is the
              one that frees, and it is a request the standard lets an implementation ignore.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>emplace</code> on an existing key does
              nothing&quot;</td>
            <td style={cellStyle}><code>ctor=1 copy=0 move=1 dtor=2</code> — it built the value,
              allocated a node, found the key, and destroyed both. <code>try_emplace</code> is the
              no-op: <code>ctor=0</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Same address means my iterator is still valid&quot;</td>
            <td style={cellStyle}>No. <code>reserve(100)</code> then <code>shrink_to_fit()</code>{' '}
              reallocated twice and came back to the <em>identical</em> block address, twice in a
              row. Only ASan can answer that question.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Hardening or the warnings will catch this&quot;</td>
            <td style={cellStyle}>Every <code>_LIBCPP_HARDENING_MODE</code>, including{' '}
              <code>DEBUG</code>, died silently on the stale iterator (exit 138). They do catch{' '}
              <code>v[7]</code>, which is unhardened a silent <code>0</code>.{' '}
              <code>-Wdangling-gsl</code> is on by default but went silent as soon as the bug moved
              one function call away.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Sanitizer results are optimisation-dependent&quot;</td>
            <td style={cellStyle}>For <em>stack</em> bugs, yes — that was{' '}
              <a href="/cpp/memory-bugs">phase 2</a>&apos;s measurement. For container
              invalidation, no: <code>heap-use-after-free</code> and{' '}
              <code>container-overflow</code> were both caught at <code>-O0</code>,{' '}
              <code>-Og</code>, <code>-O1</code> and <code>-O2</code> alike.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;An index loop is the safe fix&quot;</td>
            <td style={cellStyle}>It cannot dangle, and it still skips.{' '}
              <code>[1,2,4,6,3]</code> became <code>[1,4,3]</code> instead of <code>[1,3]</code> —
              no crash, no sanitizer report, just a wrong answer. And it produced the{' '}
              <em>right</em> answer on the first input tried.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>vector&lt;bool&gt;</code> is a vector of
              bools&quot;</td>
            <td style={cellStyle}>Eight elements, <code>capacity() == 64</code>.{' '}
              <code>operator[]</code> returns a proxy, not <code>bool&amp;</code>, and there is no{' '}
              <code>data()</code> at all.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        You now have the storage. <a href="/cpp/algorithms">The next lesson</a> is about the
        operations — and it opens on the loose end this one deliberately left: why{' '}
        <code>b.erase(std::remove_if(b.begin(), b.end(), pred), b.end())</code> needs two function
        calls, and what <code>std::remove_if</code> is actually doing when it does not remove
        anything. It is the strangest API in the standard library and it follows directly from the
        invalidation rules above.
      </p>
      <p>
        That lesson also replaces most of the loops on this page.{' '}
        <code>std::erase_if</code> was the first instalment; C++20 ranges are the rest.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          One exercise, and it is a build-configuration change rather than a program, because that
          is the thing on this page with the highest return.
        </p>
        <p>
          Take any C++ project you have — or the <code>inval2.cpp</code> from this lesson — and
          build it twice:
        </p>
        <CodeBlock language="bash" title="Verified commands">
{`# the build you probably have
clang++ -std=c++23 -Wall -Wextra -O2 -g prog.cpp -o prog && ./prog

# the build that finds this entire family of bug
clang++ -std=c++23 -Wall -Wextra -O1 -g -fsanitize=address \\
        -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_DEBUG prog.cpp -o prog_san
./prog_san`}
        </CodeBlock>
        <p>
          Then go looking, in your own code, for the three shapes this lesson measured:{' '}
          <strong>a reference or pointer to an element that is held across a{' '}
          <code>push_back</code></strong>; <strong>a loop that erases from the container it is
          iterating</strong>; and <strong>a <code>string_view</code> or <code>span</code> stored in
          a member or returned from a function</strong>. The third is the one that hides best,
          because it compiles without a warning and usually works — the owner usually does outlive
          the view, until somebody refactors the caller.
        </p>
        <p>
          And the uncomfortable follow-up, which is the real reason to do this now rather than
          later: <strong>how would you have found out?</strong> On this page, the unsanitized builds
          printed <code>after=2</code>, <code>sum after = 4</code>, twenty-five spaces, and{' '}
          <code>[1, 4, 3]</code>. Four wrong answers, four exit codes of 0, and not one warning
          between them.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Containers;
