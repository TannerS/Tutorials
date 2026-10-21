import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Algorithms() {
  return (
    <LessonLayout
      title="Algorithms, Iterators & Ranges"
      sectionId="cpp"
      lessonIndex={16}
      prev={{ path: '/cpp/containers', label: 'STL Containers & Iterator Invalidation' }}
      next={{ path: '/cpp/errors', label: 'Error Handling: Exceptions, noexcept & expected' }}
    >
      <p>
        The previous lesson covered where data lives. This one covers what you do to it — and the
        headline is that you should mostly stop writing loops. Not for elegance: a named algorithm
        states intent, is already correct at the boundaries, and leaves no room for the off-by-one
        you would otherwise have to review.
      </p>

      <p>
        You know this argument already from <code>map</code>/<code>filter</code>/<code>reduce</code>{' '}
        in JavaScript and Streams in Java. C++'s version is older, uglier in places, and — once{' '}
        <strong>ranges</strong> arrive in C++20 — genuinely better in one specific way that this
        lesson measures rather than asserts.
      </p>

      <h2>Iterators: the Glue</h2>

      <p>
        Every algorithm in <code>&lt;algorithm&gt;</code> is written against iterators, not
        containers. That is why one <code>std::sort</code> works on a <code>vector</code>, a raw
        array, and a slice of either. The cost is the half-open range convention you have to hold
        in your head: <code>begin()</code> points at the first element, <code>end()</code> points{' '}
        <em>one past</em> the last, and dereferencing <code>end()</code> is undefined behaviour.
      </p>

      <CodeBlock language="cpp" title="The categories, and what they let you do">
{`// input        read once, forward only          (istream_iterator)
// forward      read repeatedly, forward only     (forward_list)
// bidirectional  ++ and --                       (list, map, set)
// random access  it + n in O(1)                  (vector, deque, array)
// contiguous   elements are adjacent in memory   (vector, array, string)   [C++20]

std::sort(v.begin(), v.end());   // needs RANDOM ACCESS — will not compile on std::list
lst.sort();                      // which is why list ships its own member sort`}
      </CodeBlock>

      <p>
        That last line is the practical consequence. <code>std::sort</code> on a{' '}
        <code>std::list</code> is a compile error rather than a slow path, because the algorithm
        requires a capability the container cannot provide. The error message is enormous — which
        is exactly the problem <a href="/cpp/concepts">concepts</a> were introduced to fix.
      </p>

      <h2>The Workhorses</h2>

      <CodeBlock language="cpp" title="The ones worth knowing by name">
{`#include <algorithm>
#include <numeric>

std::sort(v.begin(), v.end());                        // O(n log n), unstable
std::stable_sort(v.begin(), v.end());                 // stable, needs scratch memory
std::find(v.begin(), v.end(), 42);                    // returns end() on miss
std::find_if(v.begin(), v.end(), pred);
std::count_if(v.begin(), v.end(), pred);
std::any_of / all_of / none_of (v.begin(), v.end(), pred);
std::transform(in.begin(), in.end(), std::back_inserter(out), fn);   // map
std::copy_if(in.begin(), in.end(), std::back_inserter(out), pred);   // filter
std::accumulate(v.begin(), v.end(), 0);               // reduce — note the INIT value
std::binary_search(v.begin(), v.end(), x);            // requires it to be SORTED already`}
      </CodeBlock>

      <InfoBox variant="warning" title="accumulate's init value decides the type, not the container">
        <p>
          <code>std::accumulate(v.begin(), v.end(), 0)</code> over a{' '}
          <code>vector&lt;double&gt;</code> accumulates into an <code>int</code> and silently
          truncates every addition, because the type is deduced from the literal <code>0</code>.
          Write <code>0.0</code>. This is one of the most common real bugs in STL code and the
          compiler will not warn you.
        </p>
      </InfoBox>

      <h2>remove Does Not Remove</h2>

      <p>
        This is the surprise worth paying for the lesson. An algorithm only has iterators — it has
        no access to the container, so it <strong>cannot change the container's size</strong>.{' '}
        <code>std::remove</code> therefore shuffles the elements you want to keep to the front and
        returns an iterator to the new logical end. Everything past that point is unspecified, and
        the container is exactly as long as it was.
      </p>

      <CodeBlock language="cpp" title="remove_demo.cpp — complete, run it yourself">
{`#include <algorithm>
#include <print>
#include <vector>

void dump(const char* label, const std::vector<int>& v) {
    std::print("{:<14} size={} contents=", label, v.size());
    for (int x : v) std::print("{} ", x);
    std::println("");
}

int main() {
    std::vector<int> v{1, 2, 3, 2, 4, 2, 5};

    auto it = std::remove(v.begin(), v.end(), 2);   // shuffles; size unchanged
    dump("after remove:", v);
    std::println("  returned iterator at index {}", it - v.begin());

    v.erase(it, v.end());                           // the container does the shrinking
    dump("after erase:", v);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra remove_demo.cpp && ./remove_demo">
{`after remove:  size=7 contents=1 3 4 5 4 2 5
  returned iterator at index 4
after erase:   size=4 contents=1 3 4 5`}
      </CodeBlock>

      <p>
        Read the first line carefully. The size is still <strong>7</strong>, and the tail reads{' '}
        <code>4 2 5</code> — leftover junk from the shuffle, including a <code>2</code> you
        thought you had removed. Had you printed this vector and believed it, you would have
        concluded the algorithm was broken. It is doing exactly what it can.
      </p>

      <CodeBlock language="cpp" title="The erase-remove idiom, and what replaced it">
{`// C++98 through C++17 — the idiom you will meet in every older codebase
v.erase(std::remove(v.begin(), v.end(), 2), v.end());

// C++20 — a free function that does both and returns the count
auto n = std::erase(v, 2);          // n == 3
auto m = std::erase_if(v, pred);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — std::erase">
{`std::erase removed 3 -> size=4 contents=1 3 4 5`}
      </CodeBlock>

      <InfoBox variant="tip" title="Use std::erase and std::erase_if">
        They were added in C++20 precisely because the erase-remove idiom was a decades-long
        papercut that everyone got wrong at least once. Reach for the free functions in new code;
        recognise the idiom when you read old code.
      </InfoBox>

      <h2>Ranges: the C++20 Rewrite</h2>

      <p>
        Ranges fix the two things that make classic algorithms tedious. First, you pass the
        container instead of two iterators. Second — and this is the real win — views{' '}
        <strong>compose lazily</strong>, so a chain of operations makes one pass and allocates
        nothing per stage.
      </p>

      <CodeBlock language="cpp" title="The same work, three ways">
{`// classic: two temporaries, three passes
std::vector<int> evens, scaled;
std::copy_if(v.begin(), v.end(), std::back_inserter(evens), is_even);
std::transform(evens.begin(), evens.end(), std::back_inserter(scaled), times_ten);
scaled.resize(2);

// ranges: one expression, no temporaries, lazy
auto result = v | std::views::filter(is_even)
                | std::views::transform(times_ten)
                | std::views::take(2);`}
      </CodeBlock>

      <p>
        The JavaScript equivalent —{' '}
        <code>v.filter(isEven).map(timesTen).slice(0,2)</code> — allocates a new array at every
        step and processes all ten elements twice before throwing most of the work away. Java
        Streams are lazy like C++ ranges. Here is the laziness, instrumented and measured:
      </p>

      <CodeBlock language="cpp" title="lazy.cpp — complete, run it yourself">
{`#include <print>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> v{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};
    int preds = 0, xforms = 0;

    auto pipeline = v
        | std::views::filter([&](int x) { ++preds;  return x % 2 == 0; })
        | std::views::transform([&](int x) { ++xforms; return x * 10; })
        | std::views::take(2);

    std::println("after building pipeline: predicate ran {} times, transform {} times",
                 preds, xforms);

    std::print("consuming: ");
    for (int x : pipeline) std::print("{} ", x);
    std::println("");

    std::println("after consuming: predicate ran {} times, transform {} times",
                 preds, xforms);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra lazy.cpp && ./lazy">
{`after building pipeline: predicate ran 0 times, transform 0 times
consuming: 20 40
after consuming: predicate ran 6 times, transform 2 times`}
      </CodeBlock>

      <p>
        Three facts in those numbers. Building the pipeline ran <strong>nothing</strong> — a view
        is a description, not a computation. Consuming it ran the predicate{' '}
        <strong>6 times, not 10</strong>, because <code>take(2)</code> stopped the whole chain as
        soon as it had what it needed. And the transform ran exactly <strong>twice</strong> — only
        on the elements that survived the filter and were actually demanded.
      </p>

      <InfoBox variant="note" title="Why 6 and not 4?">
        <p>
          Reasonable first count: check 1 and 2 to get the first even, 3 and 4 to get the second,
          stop — four calls. The extra two are worth understanding, because they are the shape of
          every lazy pipeline. Printing each call as it happens gives:
        </p>
        <CodeBlock language="text" title="Real output — the same pipeline, tracing every call">
{`trace: p1 p2 [t2] =>20  p3 p4 [t4] =>40  p5 p6`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          Read it left to right. <code>p1 p2</code> finds the first even and the transform turns it
          into 20. <code>p3 p4</code> finds the second, giving 40. Then the loop increments one last
          time to ask &quot;is there a third element?&quot; — the filter dutifully goes looking and
          burns <code>p5 p6</code> finding the 6 — and only then does <code>take</code>&apos;s
          counter hit zero and end the loop. So the 6 was found but never transformed, which is why
          the transform count stays at 2. <strong>A lazy pipeline always looks one step further than
          it consumes.</strong>
        </p>
      </InfoBox>

      <FlowChart
        title="A Lazy Pipeline Pulls, It Does Not Push"
        chart={
          'graph RL\n' +
          '  TAKE["take(2)<br/>stops after 2"] -->|"give me one"| XF["transform(×10)<br/>ran 2×"]\n' +
          '  XF -->|"give me one"| FIL["filter(even)<br/>ran 6×"]\n' +
          '  FIL -->|"give me one"| SRC["vector 1..10<br/>only 6 visited"]\n' +
          '  SRC -.->|"2, then 4"| FIL\n' +
          '  FIL -.->|" "| XF\n' +
          '  XF -.->|"20, then 40"| TAKE\n' +
          '  style TAKE fill:#1a3329,stroke:#4ade80\n' +
          '  style SRC fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <p>
        Demand flows right to left; values flow back left to right. Nothing upstream does work
        until something downstream asks for it, which is why the source was never fully traversed.
      </p>

      <h2>Materialising a View</h2>

      <p>
        A view is not a container. When you need a real one, C++23 adds{' '}
        <code>std::ranges::to</code> — verified available on this toolchain
        (<code>__cpp_lib_ranges</code> reports <code>202406</code>):
      </p>

      <CodeBlock language="cpp" title="View to container">
{`auto out = v | std::views::take(3) | std::ranges::to<std::vector>();
// out is a real std::vector<int> with 3 elements

// Pre-C++23, the manual version:
std::vector<int> out2;
std::ranges::copy(v | std::views::take(3), std::back_inserter(out2));`}
      </CodeBlock>

      <InfoBox variant="danger" title="A view does not own anything — and that is a dangling trap">
        <p>
          Views reference the underlying range. Returning a view that borrows from a local, or from
          a temporary, gives you exactly the dangling problem from{' '}
          <a href="/cpp/memory-model">the memory model lesson</a> — the view outlives the data it
          points at, and the compiler will not stop you. <code>std::string_view</code> from{' '}
          <a href="/cpp/containers">the containers lesson</a> has the same hazard for the same
          reason. If a view must escape the scope that owns its data, materialise it with{' '}
          <code>ranges::to</code> first.
        </p>
      </InfoBox>

      <h2>Projections</h2>

      <p>
        A small addition that removes a lot of lambda noise. Range algorithms take an optional
        final argument saying <em>which part of each element</em> to operate on:
      </p>

      <CodeBlock language="cpp" title="Sorting by a member without writing a comparator">
{`struct Employee { std::string name; int age; };
std::vector<Employee> staff = /* ... */;

// classic: a lambda just to reach into the struct
std::sort(staff.begin(), staff.end(),
          [](const auto& a, const auto& b){ return a.age < b.age; });

// ranges: say what to compare, not how
std::ranges::sort(staff, {}, &Employee::age);
//                      ^^  ^^^^^^^^^^^^^^
//              default less   the projection`}
      </CodeBlock>

      <h2>Where Ranges Still Disappoint</h2>

      <p>
        Worth knowing before you convert a codebase, because the costs are real and front-loaded:
      </p>

      <CodeBlock language="text" title="The honest list">
{`COMPILE TIMES      Views are deeply nested template types. A long pipeline
                   is measurably slower to compile than the loop it replaced.

ERROR MESSAGES     Better than pre-concepts templates, still bad. One wrong
                   type in a four-stage pipeline can produce a screenful.

DEBUGGING          Stepping through a lazy pipeline in lldb means stepping
                   through iterator adaptor internals, not your logic.
                   Breakpoints land in places that look nothing like the code.

LIBRARY GAPS       Not everything from range-v3 made it into the standard.
                   Check what your toolchain actually has before designing
                   around a view — and check the standard it needs.`}
      </CodeBlock>

      <p>
        None of that argues against ranges. It argues for using them where the clarity wins —
        which is most places — and reaching for a plain loop when you are in a hot compile path or
        debugging something intricate.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong>Prefer a named algorithm to a hand-written loop</strong> — it states intent and has
        the boundaries right. <strong>Watch <code>accumulate</code>'s init value</strong>, which
        silently decides the accumulation type. <strong><code>remove</code> does not remove</strong>:
        it shuffles and returns a new logical end, leaving the size unchanged — use C++20's{' '}
        <code>std::erase</code>/<code>erase_if</code> and recognise the erase-remove idiom in older
        code. <strong>Ranges compose lazily</strong>, measured here as 0 calls to build, then 6
        predicates and 2 transforms for a <code>take(2)</code> over ten elements — one pass, no
        intermediate allocation. <strong>Views do not own their data</strong>, so materialise with{' '}
        <code>ranges::to</code> before letting one escape its scope. And <strong>take the compile
        time, error messages and debugging cost seriously</strong> when deciding where to use them.
      </p>

      <h2>Where This Leads</h2>
      <p>
        Phase 4 is now complete: <a href="/cpp/containers">containers</a> hold the data and
        algorithms act on it. Every example on this page, though, quietly assumed the work
        succeeds. <code>std::find</code> returning <code>end()</code> is a miss rather than a
        failure, and a predicate that cannot answer has nowhere to say so — a lambda passed to{' '}
        <code>filter</code> returns <code>bool</code>, not &quot;bool, or an explanation&quot;.
      </p>
      <p>
        That gap is the next lesson.{' '}
        <strong><a href="/cpp/errors">Error Handling: Exceptions, noexcept &amp;{' '}
        expected</a></strong> covers the two answers C++ gives — throwing, and returning a type that
        carries either a value or an error — and which one to reach for. It also bears directly on
        the deeply nested adaptor types this page just built: an exception thrown inside a pipeline
        unwinds back out through every layer, and that lesson measures the cost of unwinding through
        one frame against fifty.
      </p>
    </LessonLayout>
  );
}
