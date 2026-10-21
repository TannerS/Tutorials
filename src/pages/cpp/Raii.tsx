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

function Raii() {
  return (
    <LessonLayout
      title="RAII: The Idea That Defines C++"
      sectionId="cpp"
      lessonIndex={7}
      prev={{ path: '/cpp/class-primer', label: 'Class Syntax Primer: Just Enough to Read What Follows' }}
      next={{ path: '/cpp/smart-pointers', label: 'Smart Pointers: unique_ptr, shared_ptr & weak_ptr' }}
    >
      <p>
        This is the most important lesson in the section. Not the hardest — the idea is one
        sentence long and you will have it by the end of the next paragraph. Important because it is
        the answer to a question the other three languages you use have each answered differently
        and less well, and because essentially every modern C++ idiom is a special case of it.
      </p>
      <p>
        <strong>Bind a resource&apos;s lifetime to an object&apos;s lifetime. Acquire it in the
        constructor, release it in the destructor. Then the compiler&apos;s guarantee that the
        destructor runs becomes a guarantee that the resource is released.</strong>
      </p>
      <p>
        That is RAII — <em>Resource Acquisition Is Initialisation</em> — and the name is poor,
        because the interesting half is the other one. The acquisition is not the point; the point
        is that <em>release is destruction</em>, and destruction is the one thing in C++ that{' '}
        <a href="/cpp/memory-model">the previous lesson</a> showed happens on every path out of a
        scope, deterministically, in a defined order, whether you leave by falling off the end, by{' '}
        <code>return</code>, by <code>break</code>, or by throwing an exception from four frames
        down.
      </p>

      <InfoBox variant="question" title="The exercise from the last lesson, answered">
        <p>
          You were asked to add a <code>throw</code> between <code>b</code> and <code>c</code> in a
          block containing three instrumented locals, and to predict the output. Here it is:
        </p>
        <CodeBlock language="text" title="Real output — the three-local block with a throw after b">
{`  + a (declared 1st)
  + b (declared 2nd)
  - b (declared 2nd)
  - a (declared 1st)
caught: boom`}
        </CodeBlock>
        <p>
          <code>b</code> then <code>a</code> — the same reverse order as a normal exit — and{' '}
          <code>c</code> never appears, because it was never constructed. There is no{' '}
          <code>finally</code> block in that program and no cleanup code of any kind. If your
          prediction was that you needed to write something to make this happen, that is the
          instinct this lesson is for.
        </p>
      </InfoBox>

      <InfoBox variant="note" title="What was actually run">
        <p>
          <strong>Apple clang 21.0.0 (clang-2100.3.34.2)</strong>, <code>arm64-apple-darwin25.6.0</code>,
          libc++, <code>-std=c++23</code>. The cross-language comparisons are also real runs on this
          machine: <strong>JDK 26.0.1</strong>, <strong>Go 1.25.5 darwin/arm64</strong>, and{' '}
          <strong>Node v25.2.1</strong>. The Node result in particular is not what this lesson was
          originally going to say — see the comparison section.
        </p>
      </InfoBox>

      <h2>Exception Safety, For Free</h2>
      <p>
        Start with the hardest case, because if RAII survives it the easy cases are uninteresting. An
        exception thrown three calls deep, caught at the top.
      </p>

      <CodeBlock language="cpp" title="unwind.cpp">
{`#include <print>
#include <stdexcept>
#include <string>
#include <utility>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

void level3() {
    Tracer t{"level3 local"};
    std::println("    . level3 is about to throw");
    throw std::runtime_error{"boom"};
    std::println("    . never printed");
}

void level2() {
    Tracer t{"level2 local"};
    level3();
    std::println("    . level2 after the call -- never printed");
}

void level1() {
    Tracer t{"level1 local"};
    level2();
    std::println("    . level1 after the call -- never printed");
}

int main() {
    Tracer outer{"main local"};
    std::println("--- entering the try ---");
    try {
        level1();
    } catch (const std::exception& e) {
        std::println("--- caught: {} ---", e.what());
    }
    std::println("--- still running, and everything is released ---");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 unwind.cpp && ./unwind">
{`  + main local
--- entering the try ---
  + level1 local
  + level2 local
  + level3 local
    . level3 is about to throw
  - level3 local
  - level2 local
  - level1 local
--- caught: boom ---
--- still running, and everything is released ---
  - main local`}
      </CodeBlock>

      <p>
        Three destructors ran, innermost first, between the <code>throw</code> and the{' '}
        <code>catch</code>. This is <strong>stack unwinding</strong>: when an exception propagates,
        the runtime walks outward frame by frame looking for a matching handler, and as it discards
        each frame it runs the destructor of every fully-constructed automatic object in it. Note
        that <code>main</code>&apos;s own local was <em>not</em> destroyed — its frame was never
        discarded, so it carried on living and died at <code>main</code>&apos;s closing brace, after
        the handler.
      </p>
      <p>
        Count the lines of cleanup code in that file. Zero.
      </p>

      <FlowChart
        title="What an exception does to the stack"
        chart={
          'graph TD\n' +
          '  T["level3(): throw std::runtime_error{\'boom\'}"] --> U["STACK UNWINDING begins.<br/>The runtime walks frames outward looking<br/>for a handler that matches the type."]\n' +
          '  U --> F3["level3\'s frame is torn down<br/>~Tracer runs — printed: - level3 local"]\n' +
          '  F3 --> F2["level2\'s frame is torn down<br/>~Tracer runs — printed: - level2 local"]\n' +
          '  F2 --> F1["level1\'s frame is torn down<br/>~Tracer runs — printed: - level1 local"]\n' +
          '  F1 --> C{"main() has a catch for<br/>const std::exception&amp;"}\n' +
          '  C -->|matches| H["the handler body runs:<br/>--- caught: boom ---"]\n' +
          '  H --> A["main() carries on.<br/>Its OWN local is untouched and still alive;<br/>it dies later, at main\'s closing brace."]\n' +
          '  U --> RAW["If a frame held a RAW owning pointer,<br/>unwinding destroys the POINTER — 8 bytes —<br/>and never runs the delete. Measured:<br/>2 of 3 exit paths leaked."]\n' +
          '  RAW --> LEAK["Leaked. Silently. Permanently.<br/>No destructor, no warning, no sanitizer on macOS."]\n' +
          '  A --> NONE["Nothing in the source said \'clean up\'.<br/>No finally. No defer. No using.<br/>No catch-and-rethrow."]\n' +
          '  style H fill:#1a3329,stroke:#4ade80\n' +
          '  style A fill:#1a3329,stroke:#4ade80\n' +
          '  style NONE fill:#1a3329,stroke:#4ade80\n' +
          '  style RAW fill:#3d2f14,stroke:#fb923c\n' +
          '  style LEAK fill:#3b1a1a,stroke:#f87171'
        }
      />

      <h3>The same function written three ways, and the leak counted</h3>
      <p>
        That diagram&apos;s right-hand branch is the case worth measuring. Here is one small function
        with three exit paths — normal completion, an early <code>return</code>, and a throw — in
        three versions: a raw owning pointer, a <code>unique_ptr</code>, and a plain local.
      </p>

      <CodeBlock language="cpp" title="leakpath.cpp">
{`#include <memory>
#include <print>
#include <stdexcept>
#include <string>
#include <utility>

static int live = 0;

struct Buffer {
    std::string name;
    explicit Buffer(std::string n) : name(std::move(n)) {
        ++live;
        std::println("  + {}  (live = {})", name, live);
    }
    ~Buffer() {
        --live;
        std::println("  - {}  (live = {})", name, live);
    }
};

void validate(int n) {
    if (n < 0) throw std::invalid_argument{"n must not be negative"};
}

// 1. Raw owning pointer. The delete is right there, on the happy path.
void raw_version(int n) {
    Buffer* b = new Buffer{"raw new'd"};
    validate(n);                 // may throw
    if (n == 0) return;          // ...or may just return early
    delete b;                    // reached on exactly one of three paths
}

// 2. The same function with the resource bound to an object.
void raii_version(int n) {
    auto b = std::make_unique<Buffer>("unique_ptr owned");
    validate(n);
    if (n == 0) return;
}

// 3. And the simplest form of all: no heap at all.
void value_version(int n) {
    Buffer b{"plain local"};
    validate(n);
    if (n == 0) return;
}

template <class F>
void run(const char* label, F f, int n) {
    std::println("{} with n = {}:", label, n);
    try { f(n); } catch (const std::exception& e) { std::println("    caught: {}", e.what()); }
    std::println("    live buffers afterwards = {}", live);
    std::println("");
}

int main() {
    run("raw_version   ", raw_version, 1);
    run("raw_version   ", raw_version, 0);
    run("raw_version   ", raw_version, -1);
    run("raii_version  ", raii_version, 1);
    run("raii_version  ", raii_version, 0);
    run("raii_version  ", raii_version, -1);
    run("value_version ", value_version, -1);
    std::println("leaked buffers at the end: {}", live);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 leakpath.cpp && ./leakpath">
{`raw_version    with n = 1:
  + raw new'd  (live = 1)
  - raw new'd  (live = 0)
    live buffers afterwards = 0

raw_version    with n = 0:
  + raw new'd  (live = 1)
    live buffers afterwards = 1

raw_version    with n = -1:
  + raw new'd  (live = 2)
    caught: n must not be negative
    live buffers afterwards = 2

raii_version   with n = 1:
  + unique_ptr owned  (live = 3)
  - unique_ptr owned  (live = 2)
    live buffers afterwards = 2

raii_version   with n = 0:
  + unique_ptr owned  (live = 3)
  - unique_ptr owned  (live = 2)
    live buffers afterwards = 2

raii_version   with n = -1:
  + unique_ptr owned  (live = 3)
  - unique_ptr owned  (live = 2)
    caught: n must not be negative
    live buffers afterwards = 2

value_version  with n = -1:
  + plain local  (live = 3)
  - plain local  (live = 2)
    caught: n must not be negative
    live buffers afterwards = 2

leaked buffers at the end: 2`}
      </CodeBlock>

      <p>
        <strong><code>raw_version</code> released the buffer on one of its three exit paths.</strong>{' '}
        The <code>delete</code> is sitting right there in the function, visible, four lines from the{' '}
        <code>new</code> — and it is skipped by the early return and skipped by the exception. Both
        of the other two versions released on all three paths, including the throwing one, with no
        cleanup code at all.
      </p>
      <p>
        One detail in that output is worth pointing out because it is the whole argument in
        miniature: <strong>the leak count never goes back down.</strong> After the two leaked
        buffers, every subsequent line reads <code>live buffers afterwards = 2</code> even though
        every subsequent call was clean. A leak is not a transient failure that the next request
        recovers from; it is a permanent debit against a long-running process, and the only visible
        symptom is a number that drifts upward over hours.
      </p>

      <InfoBox variant="danger" title="The counter-arguments, and why they do not hold">
        <p>
          <strong>&quot;I will just put the delete in a <code>catch</code>.&quot;</strong> Then you
          need a <code>catch (...)</code> plus a rethrow, around every function that owns anything,
          and you need it on the early-return path too, and you need it again when somebody adds a
          fourth exit path in eight months. You have reimplemented the destructor, by hand, once per
          call site, with no compiler check that you did it everywhere. The raw version above is only
          three lines and already gets it wrong twice.
        </p>
        <p>
          <strong>&quot;I will build with <code>-fno-exceptions</code>, so there is no throw
          path.&quot;</strong> Some game and embedded codebases genuinely do this, and it is a
          defensible choice. It removes one of the three paths above. The early return is still
          there, and so is <code>break</code>, and <code>goto cleanup</code>, and the next{' '}
          <code>return</code> somebody adds.
        </p>
        <p>
          <strong>&quot;The leak is small.&quot;</strong> The one on this page is a{' '}
          <code>std::string</code>. The next one is a file descriptor, and{' '}
          <a href="#own">the measurement further down this page</a> shows a descriptor leak
          exhausting its limit after 253 iterations and failing every subsequent{' '}
          <code>open</code> in the process. The one after that is a mutex, which does not leak — it{' '}
          <em>deadlocks</em>, and that is also measured below.
        </p>
      </InfoBox>

      <h2>Exactly When The Destructor Runs</h2>
      <p>
        RAII is only as good as the guarantee underneath it, so it is worth knowing that guarantee
        precisely rather than approximately. Seven occasions, in one program:
      </p>

      <CodeBlock language="cpp" title="whenrun.cpp">
{`#include <print>
#include <string>
#include <utility>
#include <vector>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

Tracer make(const char* n) { return Tracer{n}; }

struct Owner {
    Tracer t;
    explicit Owner(const char* n) : t(n) {}
};

int main() {
    std::println("1. end of scope:");
    { Tracer a{"a local"}; }

    std::println("2. end of the full expression -- an unbound temporary:");
    make("a temporary");
    std::println("   (the semicolon already did it)");

    std::println("3. a temporary inside a larger expression:");
    std::println("   name length = {}", make("temporary in an argument").name.size());
    std::println("   (destroyed at the END of the whole statement, not after the argument)");

    std::println("4. delete:");
    { Tracer* p = new Tracer{"new'd"}; delete p; }

    std::println("5. a container dropping an element:");
    {
        std::vector<Tracer> v;
        v.reserve(2);
        v.emplace_back("vector[0]");
        v.emplace_back("vector[1]");
        std::println("   pop_back():");
        v.pop_back();
        std::println("   leaving the scope:");
    }

    std::println("6. assigning over an object destroys what it held:");
    {
        std::vector<Tracer> v;
        v.reserve(1);
        v.emplace_back("the first contents");
        std::println("   assigning an empty vector over it:");
        v = std::vector<Tracer>{};
        std::println("   done");
    }

    std::println("7. a member, when its owner dies:");
    { Owner o{"Owner's member"}; }

    std::println("all seven done.");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 whenrun.cpp && ./whenrun">
{`1. end of scope:
  + a local
  - a local
2. end of the full expression -- an unbound temporary:
  + a temporary
  - a temporary
   (the semicolon already did it)
3. a temporary inside a larger expression:
  + temporary in an argument
   name length = 24
  - temporary in an argument
   (destroyed at the END of the whole statement, not after the argument)
4. delete:
  + new'd
  - new'd
5. a container dropping an element:
  + vector[0]
  + vector[1]
   pop_back():
  - vector[1]
   leaving the scope:
  - vector[0]
6. assigning over an object destroys what it held:
  + the first contents
   assigning an empty vector over it:
  - the first contents
   done
7. a member, when its owner dies:
  + Owner's member
  - Owner's member
all seven done.`}
      </CodeBlock>

      <p>
        Block 3 is the one people get wrong. The temporary was destroyed <em>after</em>{' '}
        <code>name length = 24</code> printed, not after its <code>.size()</code> was read. The rule
        is <strong>end of the full expression</strong> — the whole statement, up to the semicolon —
        which is why <code>const T&amp;</code> parameters can safely bind to temporaries for the
        duration of a call, and why the <code>string_view</code>-into-a-temporary trap from{' '}
        <a href="/cpp/types">the types lesson</a> fires at the semicolon rather than mid-expression.
      </p>
      <p>
        Block 6 is the one that makes <code>vector</code> and <code>string</code> behave like
        values: assigning over an object destroys whatever it was holding first. That is the
        copy-assignment operator doing RAII&apos;s work, and it is why{' '}
        <code>v = {'{}'}</code> frees memory immediately rather than at some later point.
      </p>

      <h3>And the four occasions when it does not run</h3>
      <p>
        The guarantee has a boundary, and knowing where it is matters, because &quot;the destructor
        always runs&quot; is not quite true.
      </p>

      <CodeBlock language="cpp" title="notrun.cpp">
{`#include <cstdlib>
#include <print>
#include <stdexcept>
#include <string>
#include <utility>

struct Tracer {
    std::string name;
    explicit Tracer(std::string n) : name(std::move(n)) { std::println("  + {}", name); }
    ~Tracer() { std::println("  - {}", name); }
};

Tracer global{"a STATIC object"};

void depart(const char* how) {
    Tracer local{"an AUTOMATIC local in depart()"};
    std::println("  . leaving via {}", how);
    if (std::string_view{how} == "exit")       std::exit(0);
    if (std::string_view{how} == "abort")      std::abort();
    if (std::string_view{how} == "throw")      throw std::runtime_error{"uncaught"};
    if (std::string_view{how} == "quick_exit") std::quick_exit(0);
}

int main(int argc, char** argv) {
    std::println("main() entered; argv[1] = {}", argc > 1 ? argv[1] : "(none)");
    depart(argc > 1 ? argv[1] : "return");
    std::println("  . back in main, returning normally");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — five exits, with the Tracer printing to stderr so nothing is lost to buffering">
{`### ./notrun return
  + a STATIC object
main() entered; argv[1] = return
  + an AUTOMATIC local in depart()
  . leaving via return
  - an AUTOMATIC local in depart()
  . back in main, returning normally
  - a STATIC object
exit=0

### ./notrun exit
  + a STATIC object
main() entered; argv[1] = exit
  + an AUTOMATIC local in depart()
  . leaving via exit
  - a STATIC object
exit=0

### ./notrun abort
  + a STATIC object
main() entered; argv[1] = abort
  + an AUTOMATIC local in depart()
  . leaving via abort
exit=134

### ./notrun quick_exit
  + a STATIC object
main() entered; argv[1] = quick_exit
  + an AUTOMATIC local in depart()
  . leaving via quick_exit
exit=0

### ./notrun throw
  + a STATIC object
main() entered; argv[1] = throw
  + an AUTOMATIC local in depart()
  . leaving via throw
libc++abi: terminating due to uncaught exception of type std::runtime_error: uncaught
exit=134`}
      </CodeBlock>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>How you leave</th>
            <th style={headStyle}>Automatic destructors</th>
            <th style={headStyle}>Static destructors</th>
            <th style={headStyle}>Exit code</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>return</code> / falling off the end</td>
            <td style={cellStyle}>run</td>
            <td style={cellStyle}>run</td>
            <td style={cellStyle}>0</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>a caught exception</td>
            <td style={cellStyle}>run (unwinding)</td>
            <td style={cellStyle}>run</td>
            <td style={cellStyle}>0</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::exit()</code></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}>run</td>
            <td style={cellStyle}>as given</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::quick_exit()</code></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}>as given</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>std::abort()</code></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}>134 (SIGABRT)</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>an <em>uncaught</em> exception</td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}><strong>skipped</strong></td>
            <td style={cellStyle}>134 (SIGABRT)</td>
          </tr>
        </tbody>
      </table>

      <p>
        The last row is the counter-intuitive one and worth stating plainly:{' '}
        <strong>an exception with no handler does not unwind the stack at all.</strong>{' '}
        <code>std::terminate</code> is called at the throw point, and whether anything is unwound
        first is implementation-defined; on this toolchain nothing was. So &quot;exception safety for
        free&quot; is conditional on somebody, somewhere up the stack, actually catching. A top-level{' '}
        <code>try</code>/<code>catch</code> in <code>main</code> is not defensive
        over-engineering — it is what makes every destructor below it run.
      </p>

      <InfoBox variant="info" title="An aside on diagnosing crashes, found while writing this">
        <p>
          The first version of that experiment printed to <code>stdout</code>, and the{' '}
          <code>quick_exit</code> run produced <strong>no output whatsoever</strong> — not even the
          lines that had definitely already executed. The reason is not destructors, it is{' '}
          <code>stdout</code> buffering: when output is redirected it is fully buffered, and{' '}
          <code>quick_exit</code> does not flush C streams. Everything the program had &quot;said&quot;
          was still sitting in a buffer when the process vanished.
        </p>
        <p>
          That is a general hazard rather than a C++ one, and it is why the table above was
          regenerated with the tracer printing to <code>stderr</code>, which is unbuffered. If you
          are ever debugging a crash and the logs stop well before the crash point, suspect the
          buffer before you suspect your understanding of the code.
        </p>
      </InfoBox>

      <h2>Compared With The Three Mechanisms You Already Know</h2>
      <p>
        You have met this problem before, in three languages, with three different solutions. All
        three are real and all three work. The differences are specific, and they are the reason C++
        developers describe RAII as a feature rather than a workaround for a missing GC.
      </p>

      <h3>Java: <code>try</code>-with-resources</h3>

      <CodeBlock language="java" title="Twr.java">
{`public class Twr {
    static class Resource implements AutoCloseable {
        final String name;
        Resource(String name) { this.name = name; System.out.println("  + acquired " + name); }
        @Override public void close() { System.out.println("  - released " + name); }
    }

    static class Holder implements AutoCloseable {
        final Resource a = new Resource("Holder.a");
        final Resource b = new Resource("Holder.b");
        @Override public void close() { b.close(); a.close(); }   // by hand, in reverse
    }

    static class Failing implements AutoCloseable {
        @Override public void close() { throw new IllegalStateException("close() failed"); }
    }

    public static void main(String[] args) {
        System.out.println("1. try-with-resources, two resources, and a throw:");
        try (Resource a = new Resource("a"); Resource b = new Resource("b")) {
            System.out.println("    . inside the try block");
            throw new RuntimeException("boom");
        } catch (RuntimeException e) {
            System.out.println("   caught: " + e.getMessage());
        }

        System.out.println("2. a plain local -- no try, no close:");
        {
            Resource forgotten = new Resource("declared with no try-with-resources");
            System.out.println("    . block ending");
        }
        System.out.println("   -> nothing was released. javac said nothing.");

        System.out.println("3. members are not composed; Holder.close() chains by hand:");
        try (Holder h = new Holder()) {
            System.out.println("    . inside");
        }

        System.out.println("4. when close() itself throws, on top of a body exception:");
        try (Failing f = new Failing()) {
            throw new RuntimeException("body failed");
        } catch (RuntimeException e) {
            System.out.println("   caught: " + e.getMessage());
            for (Throwable s : e.getSuppressed()) {
                System.out.println("   suppressed: " + s.getClass().getSimpleName()
                                   + ": " + s.getMessage());
            }
        }
    }
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — JDK 26.0.1, javac Twr.java (no warnings) && java Twr">
{`1. try-with-resources, two resources, and a throw:
  + acquired a
  + acquired b
    . inside the try block
  - released b
  - released a
   caught: boom
2. a plain local -- no try, no close:
  + acquired declared with no try-with-resources
    . block ending
   -> nothing was released. javac said nothing.
3. members are not composed; Holder.close() chains by hand:
  + acquired Holder.a
  + acquired Holder.b
    . inside
  - released Holder.b
  - released Holder.a
4. when close() itself throws, on top of a body exception:
   caught: body failed
   suppressed: IllegalStateException: close() failed`}
      </CodeBlock>

      <p>
        Block 1 is genuinely good: two resources, reverse order, exception-safe. Java solved this
        problem properly in 7. Blocks 2 and 3 are where the difference lives.
      </p>
      <p>
        <strong>It is opt-in at every use site.</strong> The resource must implement{' '}
        <code>AutoCloseable</code> <em>and</em> be declared in the <code>try</code> header. Declare
        it as a normal local and nothing happens — <code>javac</code> compiled block 2 without a
        single warning. So the guarantee is not &quot;this type is always released,&quot; it is{' '}
        &quot;this type is released wherever the author of the calling code remembered the
        syntax.&quot;
      </p>
      <p>
        <strong>Ownership does not compose.</strong> <code>Holder</code> has two{' '}
        <code>Resource</code> members, and <code>Holder.close()</code> had to call{' '}
        <code>b.close()</code> and then <code>a.close()</code> by hand, in the right order, forever,
        and correctly even if the first one throws. In C++ that method does not exist, because member
        destruction in reverse declaration order is what{' '}
        <a href="/cpp/memory-model">the previous lesson</a> measured happening automatically. For a
        class with five resource members, Java&apos;s version is a careful nested
        try/finally; C++&apos;s version is an empty destructor.
      </p>
      <p>
        Block 4 is the machinery Java needed to handle a <code>close()</code> that throws while an
        exception is already in flight: the second exception is attached to the first as a{' '}
        <em>suppressed</em> exception. C++ does not have that machinery, and the reason is the subject
        of the warning box further down — a destructor that throws during unwinding calls{' '}
        <code>std::terminate</code>, so C++ forbids the situation instead of modelling it.
      </p>

      <h3>Go: <code>defer</code></h3>

      <CodeBlock language="go" title="main.go — the four properties of defer that matter here">
{`func blockScope() {
	fmt.Println("1. defer is FUNCTION-scoped, not block-scoped:")
	{
		r := acquire("inside an inner block")
		defer r.Release()
		fmt.Println("    . inner block ending")
	}
	fmt.Println("    . back in blockScope(); is it released yet?")
	fmt.Println("    . no -- the deferred call runs when the FUNCTION returns")
}

func inALoop() {
	fmt.Println("2. three iterations, one defer each:")
	for i := 0; i < 3; i++ {
		r := acquire(fmt.Sprintf("iteration %d", i))
		defer r.Release()
	}
	fmt.Println("    . loop finished, all three still open")
}

func onPanic() {
	fmt.Println("3. defer does run on a panic:")
	defer func() {
		if p := recover(); p != nil {
			fmt.Printf("    . recovered: %v\\n", p)
		}
	}()
	r := acquire("about to panic")
	defer r.Release()
	panic("boom")
}

func forgotten() {
	fmt.Println("4. forgetting the defer:")
	acquire("never released")
	fmt.Println("    . function ending, nothing happens")
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — Go 1.25.5, go vet (silent) && go run .">
{`1. defer is FUNCTION-scoped, not block-scoped:
  + acquired inside an inner block
    . inner block ending
    . back in blockScope(); is it released yet?
    . no -- the deferred call runs when the FUNCTION returns
  - released inside an inner block
   (blockScope returned -- NOW it released)
2. three iterations, one defer each:
  + acquired iteration 0
  + acquired iteration 1
  + acquired iteration 2
    . loop finished, all three still open
  - released iteration 2
  - released iteration 1
  - released iteration 0
   (inALoop returned -- NOW all three released, in reverse order)
3. defer does run on a panic:
  + acquired about to panic
  - released about to panic
    . recovered: boom
4. forgetting the defer:
  + acquired never released
    . function ending, nothing happens`}
      </CodeBlock>

      <p>
        <code>defer</code> is the closest of the three to RAII and the most pleasant to write:
        acquire on one line, schedule the release on the next, panic-safe, reverse order. Two real
        differences.
      </p>
      <p>
        <strong>It is function-scoped, not block-scoped.</strong> Block 1 proves it — the{' '}
        <code>defer</code> inside an inner block fired when <code>blockScope</code> returned, not at
        the inner brace. Block 2 is the practical consequence and it is a well-known Go footgun: a{' '}
        <code>defer file.Close()</code> inside a loop over ten thousand filenames holds ten thousand
        descriptors open until the function ends. The Go fix is to extract the loop body into its own
        function; the C++ equivalent needs no fix, because a C++ destructor fires at the end of the
        block, which the loop-iteration demonstration in{' '}
        <a href="/cpp/memory-model">the previous lesson</a> shows directly.
      </p>
      <p>
        <strong>And it is a statement you have to remember.</strong> Block 4 forgot it;{' '}
        <code>go vet</code> was silent and the resource leaked. Go leans on convention and on{' '}
        <code>go vet</code>/linters for this, and those work well in practice — but the guarantee
        lives at the call site, once per call site, not in the type.
      </p>

      <h3>JavaScript: <code>using</code> — and this is where the lesson had to be rewritten</h3>
      <p>
        The intended version of this section said that JavaScript has no scope-based cleanup
        mechanism at all and that <code>try/finally</code> is the only option. <strong>That is no
        longer true, and the check took one file.</strong> Node v25.2.1 on this machine supports{' '}
        <code>using</code> declarations and <code>Symbol.dispose</code>:
      </p>

      <CodeBlock language="javascript" title="using.mjs">
{`class Resource {
  constructor(name) { this.name = name; console.log(\`  + acquired \${name}\`); }
  [Symbol.dispose]() { console.log(\`  - released \${this.name}\`); }
}

function work() {
  using outer = new Resource("outer");
  {
    using inner = new Resource("inner");
    console.log("    . inside the inner block");
  }
  console.log("    . back in work(), inner is already gone");
  throw new Error("boom");
}

try { work(); } catch (e) { console.log(\`caught: \${e.message}\`); }
console.log("still running");`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — node v25.2.1 using.mjs">
{`  + acquired outer
  + acquired inner
    . inside the inner block
  - released inner
    . back in work(), inner is already gone
  - released outer
caught: boom
still running`}
      </CodeBlock>

      <p>
        That is block-scoped, reverse-order, exception-safe disposal, and the output has the same
        shape as the C++ <code>Tracer</code> output from{' '}
        <a href="/cpp/intro">the intro lesson</a>. It is not a coincidence: the TC39 explicit resource
        management proposal is openly modelled on C++ RAII and C#&apos;s <code>using</code>. If you
        write Node, this is worth knowing about independently of C++.
      </p>
      <p>
        The remaining differences are the same two that Java has, and they were measured rather than
        assumed:
      </p>

      <CodeBlock language="text" title="Real output — node v25.2.1 using3.mjs, probing the edges">
{`1. forgetting the \`using\` keyword:
  + acquired const, not using
    . block ending
   -> nothing was released. No error, no warning.
2. \`using\` on a type with no Symbol.dispose:
  + acquired Holder.a
  + acquired Holder.b
   -> TypeError: Symbol(Symbol.dispose) is not a function  (thrown on ENTERING the block)
   -> and Holder.a / Holder.b were constructed and then leaked.
3. members are not composed -- Holder must dispose them by hand:
  + acquired Holder2.a
  + acquired Holder2.b
  - released Holder2.b
  - released Holder2.a
4. what the runtime provides:
   typeof DisposableStack       = function
   typeof AsyncDisposableStack  = function
   typeof Symbol.dispose        = symbol
   typeof Symbol.asyncDispose   = symbol
5. node's own fs handles:
   FileHandle[Symbol.asyncDispose] = function
   FileHandle[Symbol.dispose]      = undefined
   await using on a FileHandle: ok, leaving block
   -> left the block without an explicit close()`}
      </CodeBlock>

      <p>
        <strong>Writing <code>const</code> instead of <code>using</code> silently does
        nothing</strong> — there is no error and no warning, which is the same opt-in-per-use-site
        problem as Java&apos;s <code>try</code> header, with the added wrinkle that the two spellings
        differ by one keyword.{' '}
        <strong>Writing <code>using</code> on something that is not disposable throws a{' '}
        <code>TypeError</code> on entering the block</strong> — after its members have been
        constructed, so you get the leak <em>and</em> the exception.{' '}
        <strong>And members do not compose</strong>: <code>Holder2</code> had to implement{' '}
        <code>Symbol.dispose</code> and call its members&apos; disposers by hand, in reverse,
        exactly like the Java version.
      </p>
      <p>
        Node&apos;s own <code>FileHandle</code> implements <code>Symbol.asyncDispose</code> but not{' '}
        <code>Symbol.dispose</code>, so it works with <code>await using</code> and would throw with
        plain <code>using</code>. That split is inherent to a runtime where closing a file is
        asynchronous, and it has no C++ analogue.
      </p>

      <FlowChart
        title="Four languages, one question: who guarantees the release?"
        chart={
          'graph TD\n' +
          '  Q["A function acquires a resource,<br/>then something goes wrong.<br/>Who releases it?"] --> JAVA\n' +
          '  Q --> GO\n' +
          '  Q --> JS\n' +
          '  Q --> CPP\n' +
          '  JAVA["JAVA — try-with-resources"] --> JA["You must: implement AutoCloseable,<br/>AND declare it in the try header.<br/>Scope = the try block."]\n' +
          '  JA --> JB["Verified: forgetting the try<br/>released nothing and javac said nothing.<br/>Members are NOT composed — Holder.close()<br/>had to call b.close() then a.close() by hand."]\n' +
          '  GO["GO — defer"] --> GA["You must: write defer on the line after<br/>acquiring. Scope = the FUNCTION,<br/>not the block."]\n' +
          '  GA --> GB["Verified: a defer inside an inner block<br/>ran when the function returned, not at the<br/>brace. Three defers in a loop held three<br/>resources open until the function ended."]\n' +
          '  JS["JAVASCRIPT — using, Node 25"] --> SA["You must: implement Symbol.dispose,<br/>AND write \'using\' instead of \'const\'.<br/>Scope = the block. Reverse order. Throw-safe."]\n' +
          '  SA --> SB["Verified: forgetting \'using\' released nothing.<br/>\'using\' on a non-disposable threw a TypeError<br/>on entry — after its members were built.<br/>Members are NOT composed."]\n' +
          '  CPP["C++ — the destructor"] --> CA["You must: nothing at the use site.<br/>Scope = the block. Reverse order.<br/>Throw-safe. Members composed automatically."]\n' +
          '  CA --> CB["There is no keyword to forget, because<br/>there is no keyword. The guarantee is<br/>attached to the TYPE, once, by its author —<br/>not to every call site by every caller."]\n' +
          '  style CB fill:#1a3329,stroke:#4ade80\n' +
          '  style CA fill:#1a3329,stroke:#4ade80\n' +
          '  style JB fill:#3d2f14,stroke:#fb923c\n' +
          '  style GB fill:#3d2f14,stroke:#fb923c\n' +
          '  style SB fill:#3d2f14,stroke:#fb923c'
        }
      />

      <InfoBox variant="success" title="The one-sentence version of that diagram">
        <p>
          All four languages can release a resource reliably on every exit path. The difference is{' '}
          <strong>where the guarantee lives</strong>. In Java, Go and JavaScript it lives at the{' '}
          <em>use site</em>: every caller must write <code>try (...)</code>, or <code>defer</code>,
          or <code>using</code>, and a caller who forgets gets silence. In C++ it lives in the{' '}
          <em>type</em>: the author of <code>std::lock_guard</code> wrote the destructor once, and
          every use of it in every codebase forever is correct without the caller doing anything.
        </p>
        <p>
          That is why RAII scales to codebases where you do not trust every caller, and it is the
          actual reason &quot;no garbage collector&quot; is not experienced as a loss. The GC
          managed one resource. This manages all of them, and it does it without a keyword at the
          call site.
        </p>
      </InfoBox>

      <h2>The Standard Library Is Already RAII</h2>
      <p>
        You have been using this since the first lesson without naming it. Every{' '}
        <code>std::string</code>, every <code>std::vector</code>, every <code>std::unique_ptr</code>{' '}
        in Phase 1 was an RAII type. Here are the three that are most obviously about a resource
        other than memory.
      </p>

      <h3><code>std::lock_guard</code> and <code>std::scoped_lock</code></h3>
      <p>
        The strongest case for RAII, because the failure mode of a leaked lock is not a slow drift
        upward in memory use — it is a deadlock, and the measurement is unambiguous.
      </p>

      <CodeBlock language="cpp" title="locks.cpp">
{`#include <mutex>
#include <print>
#include <stdexcept>
#include <thread>

std::mutex m;

// Ask a DIFFERENT thread whether the mutex is free. try_lock() from the thread
// that already holds it is undefined behaviour, so this has to be a new thread.
bool is_free() {
    bool free = false;
    std::thread t{[&] {
        if (m.try_lock()) { free = true; m.unlock(); }
    }};
    t.join();
    return free;
}

void manual_lock() {
    m.lock();
    throw std::runtime_error{"failure while holding the lock"};
    m.unlock();                       // never reached
}

void guarded_lock() {
    std::lock_guard<std::mutex> g{m};
    throw std::runtime_error{"failure while holding the lock"};
}

int main() {
    std::println("before anything:        mutex free = {}", is_free());

    try { manual_lock(); } catch (const std::exception& e) {
        std::println("caught from manual_lock:  {}", e.what());
    }
    std::println("after manual_lock:      mutex free = {}   <-- still locked", is_free());
    m.unlock();                       // clean up so the next test is meaningful
    std::println("after an explicit unlock: mutex free = {}", is_free());

    try { guarded_lock(); } catch (const std::exception& e) {
        std::println("caught from guarded_lock: {}", e.what());
    }
    std::println("after guarded_lock:     mutex free = {}   <-- released by ~lock_guard",
                 is_free());
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 locks.cpp && ./locks">
{`before anything:        mutex free = true
caught from manual_lock:  failure while holding the lock
after manual_lock:      mutex free = false   <-- still locked
after an explicit unlock: mutex free = true
caught from guarded_lock: failure while holding the lock
after guarded_lock:     mutex free = true   <-- released by ~lock_guard`}
      </CodeBlock>

      <p>
        <code>mutex free = false</code> after the manual version. In a real program that is the end:
        the next thread to take that mutex blocks forever, and the stack trace it blocks in has
        nothing to do with the function that failed to unlock. The <code>lock_guard</code> version
        released it during unwinding and the mutex is free.
      </p>
      <p>
        Note also that <code>-Wall -Wextra</code> said nothing about the unreachable{' '}
        <code>m.unlock()</code>. <code>-Wunreachable-code</code>, which is not in either of those
        sets, does:
      </p>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -Wunreachable-code -fsyntax-only locks.cpp">
{`locks.cpp:22:5: warning: code will never be executed [-Wunreachable-code]
   22 |     m.unlock();                       // never reached
      |     ^
1 warning generated.`}
      </CodeBlock>

      <h4>And the cost of the guard, measured</h4>
      <p>
        &quot;Zero-cost&quot; is the claim; here is the arm64 the compiler produced for the two
        shapes, with the locked work in another translation unit so nothing can be inlined away:
      </p>

      <CodeBlock language="cpp" title="lockcost.cpp">
{`#include <mutex>

extern std::mutex m;
void work();

void manual()  { m.lock(); work(); m.unlock(); }
void guarded() { std::lock_guard<std::mutex> g{m}; work(); }`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -O2 -S, instruction counts extracted programmatically">
{`--- __Z6manualv: 12 instructions total
    happy-path instructions: 12
      stp	x20, x19, [sp, #-32]!
      stp	x29, x30, [sp, #16]
      add	x29, sp, #16
      adrp	x19, _m@GOTPAGE
      ldr	x19, [x19, _m@GOTPAGEOFF]
      mov	x0, x19
      bl	__ZNSt3__15mutex4lockEv
      bl	__Z4workv
      mov	x0, x19
      ldp	x29, x30, [sp, #16]
      ldp	x20, x19, [sp], #32
      b	__ZNSt3__15mutex6unlockEv

--- __Z7guardedv: 19 instructions total
    happy-path instructions: 12
      stp	x20, x19, [sp, #-32]!
      stp	x29, x30, [sp, #16]
      add	x29, sp, #16
      adrp	x0, _m@GOTPAGE
      ldr	x0, [x0, _m@GOTPAGEOFF]
      bl	__ZNSt3__15mutex4lockEv
      bl	__Z4workv
      adrp	x0, _m@GOTPAGE
      ldr	x0, [x0, _m@GOTPAGEOFF]
      ldp	x29, x30, [sp, #16]
      ldp	x20, x19, [sp], #32
      b	__ZNSt3__15mutex6unlockEv`}
      </CodeBlock>

      <p>
        <strong>Twelve instructions each on the happy path.</strong> Identical structure: set up the
        frame, load the mutex address, call <code>lock</code>, call <code>work</code>, then tail-jump
        to <code>unlock</code>. The <code>lock_guard</code> is not a wrapper at runtime; it compiles
        to the <code>lock</code> and <code>unlock</code> calls you would have written.
      </p>
      <p>
        The difference is the other seven instructions in <code>guarded()</code> — a{' '}
        <strong>landing pad</strong>, plus an exception table, reached only if <code>work()</code>{' '}
        throws, which unlocks the mutex and resumes unwinding. <code>manual()</code> has no landing
        pad at all, which is exactly why it left the mutex locked. So the honest accounting is: the
        happy path is free, and you pay a block of cold code and some binary size for the behaviour
        you could not reliably have written by hand.
      </p>

      <InfoBox variant="warning" title="The one lock_guard mistake worth memorising">
        <p>
          Omit the variable name and you have written a temporary, which is destroyed at the end of
          the full expression — so it locks and immediately unlocks, and the rest of the function
          runs unprotected.
        </p>
        <CodeBlock language="cpp" title="guardtrap.cpp — the named/unnamed difference">
{`void named() {
    std::lock_guard<std::mutex> g{m1};          // a NAMED object: holds the lock
    std::println("  inside named():     m1 free = {}", is_free(m1));
}

void unnamed() {
    std::lock_guard<std::mutex>{m1};            // a TEMPORARY: locks, then unlocks
    std::println("  inside unnamed():   m1 free = {}", is_free(m1));
}

void two_at_once() {
    std::scoped_lock lock{m1, m2};              // C++17: both, deadlock-free, one line
    std::println("  inside two_at_once: m1 free = {}, m2 free = {}",
                 is_free(m1), is_free(m2));
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 guardtrap.cpp && ./guardtrap">
{`guardtrap.cpp:20:5: warning: ignoring temporary created by a constructor
      declared with 'nodiscard' attribute [-Wunused-value]
   20 |     std::lock_guard<std::mutex>{m1};            // a TEMPORARY: lo...
      |     ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
1 warning generated.

  inside named():     m1 free = false
  inside unnamed():   m1 free = true
  inside two_at_once: m1 free = false, m2 free = false
after everything:   m1 free = true, m2 free = true`}
        </CodeBlock>
        <p>
          <code>m1 free = true</code> inside <code>unnamed()</code> — the lock was never held for
          the body. The good news is that libc++ marks the constructor{' '}
          <code>[[nodiscard]]</code>, so <code>-Wall</code> catches it with{' '}
          <code>ignoring temporary created by a constructor declared with
          &apos;nodiscard&apos;</code>. This is <em>the</em> argument for{' '}
          <code>[[nodiscard]]</code> on your own RAII types.
        </p>
        <p>
          And use <code>std::scoped_lock</code> (C++17) rather than <code>lock_guard</code> by
          default: it takes any number of mutexes and acquires them in a deadlock-free order.{' '}
          <code>std::unique_lock</code> is the heavier option you reach for when you need deferred
          locking, manual early unlock, or to move the lock somewhere — it costs a bool.
        </p>
      </InfoBox>

      <h3><code>std::ofstream</code> — and a demonstration that the destructor matters</h3>

      <CodeBlock language="cpp" title="fstr.cpp">
{`#include <filesystem>
#include <fstream>
#include <print>
#include <string>

int main() {
    const char* path = "raii-demo.txt";
    std::filesystem::remove(path);

    {
        std::ofstream out{path};
        out << "forty-two lines of extremely important configuration\\n";
        std::println("inside the scope, after writing:");
        std::println("  out.is_open()  = {}", out.is_open());
        std::println("  file_size      = {} bytes", std::filesystem::file_size(path));
    }   // ~ofstream flushes the buffer and closes the file descriptor

    std::println("after the closing brace:");
    std::println("  file_size      = {} bytes", std::filesystem::file_size(path));

    std::ifstream in{path};
    std::string line;
    std::getline(in, line);
    std::println("  first line     = \\"{}\\"", line);
    std::filesystem::remove(path);
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 fstr.cpp && ./fstr">
{`inside the scope, after writing:
  out.is_open()  = true
  file_size      = 0 bytes
after the closing brace:
  file_size      = 53 bytes
  first line     = "forty-two lines of extremely important configuration"`}
      </CodeBlock>

      <p>
        <strong>Zero bytes on disk inside the scope; 53 after the brace.</strong> The data was in the
        stream&apos;s buffer the whole time, and <code>~ofstream</code> flushed it and closed the
        descriptor. This is the mechanism behind a bug you have probably hit in another language —
        &quot;the file is empty / truncated&quot; because nothing closed the handle — and here it
        cannot happen at a scope exit, including an exception.
      </p>
      <p>
        Worth knowing where this one is weak, though: <code>~ofstream</code>{' '}
        <strong>cannot report a failure.</strong> If the flush fails because the disk is full, the
        destructor cannot throw (see below) and the error goes into the stream&apos;s state bits on
        an object that is about to cease existing. For data you care about, call{' '}
        <code>out.close()</code> explicitly and check <code>out.good()</code>; let the destructor be
        the safety net rather than the mechanism. That caveat applies to every RAII type whose
        release can fail, which is most of the ones that touch a filesystem or a network.
      </p>

      <h3><code>std::jthread</code> — RAII for a thread</h3>
      <p>
        The C++20 addition that fixes the single worst default in <code>&lt;thread&gt;</code>.
      </p>

      <CodeBlock language="cpp" title="jth.cpp">
{`#include <chrono>
#include <print>
#include <thread>

int main() {
    std::println("1. std::jthread joins in its destructor:");
    {
        std::jthread t{[] {
            std::this_thread::sleep_for(std::chrono::milliseconds{200});
            std::println("    . worker finished");
        }};
        std::println("    . left the thread running, now leaving the scope");
    }
    std::println("   (the brace waited for it -- no .join() anywhere)");

    std::println("2. std::thread does NOT:");
    try {
        std::thread t{[] { std::println("    . worker"); }};
    } catch (...) { std::println("    . exception"); }
    std::println("   never reached");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 jth.cpp, the two streams shown separately">
{`$ ./jth 2>/dev/null                 # stdout
1. std::jthread joins in its destructor:
    . left the thread running, now leaving the scope
    . worker finished
   (the brace waited for it -- no .join() anywhere)
2. std::thread does NOT:
    . worker

$ ./jth 2>&1 1>/dev/null            # stderr
libc++abi: terminating

$ ./jth > /dev/null 2>&1; echo $?
134`}
      </CodeBlock>

      <p>
        The <code>jthread</code>&apos;s destructor waited 200 ms for the worker and then returned —
        no <code>join()</code> in the source, and correct on a throwing path too. A{' '}
        <code>std::thread</code> destroyed while still joinable calls{' '}
        <code>std::terminate</code>: the second block printed <code>libc++abi: terminating</code> and
        exited 134, and <code>&quot;never reached&quot;</code> never printed. (The two streams are
        shown separately above for a reason: in a combined capture the unbuffered{' '}
        <code>stderr</code> message appears <em>before</em> all the buffered{' '}
        <code>stdout</code> lines, which makes the ordering look impossible. Same buffering trap as
        the <code>quick_exit</code> aside earlier.) That is{' '}
        <code>std::thread</code> admitting it is not an RAII type.{' '}
        <strong>Prefer <code>std::jthread</code> always</strong>; it also carries a{' '}
        <code>stop_token</code> for cooperative cancellation, which is a separate reason.
      </p>

      <h2 id="own">Writing Your Own</h2>
      <p>
        Most of the time you do not need to: the right answer is a standard type, and the diagram
        below is the lookup table. You write your own when you are wrapping a C API — which, in a
        real codebase, is often.
      </p>

      <FlowChart
        title="Which RAII do I actually need?"
        chart={
          'graph TD\n' +
          '  Q["I am holding something that has to be<br/>given back: memory, a descriptor, a lock,<br/>a transaction, a GPU buffer."] --> A{"Does the standard library<br/>already own this?"}\n' +
          '  A -->|"memory, one owner"| U["std::unique_ptr&lt;T&gt;"]\n' +
          '  A -->|"memory, shared"| S["std::shared_ptr&lt;T&gt;"]\n' +
          '  A -->|"a block of T"| V["std::vector&lt;T&gt; / std::string"]\n' +
          '  A -->|"a mutex"| L["std::lock_guard — one mutex<br/>std::scoped_lock — one or more<br/>std::unique_lock — deferred or movable"]\n' +
          '  A -->|"a file"| F["std::ofstream / std::ifstream<br/>— verified: 0 bytes on disk inside the<br/>scope, 53 after the closing brace"]\n' +
          '  A -->|"a thread"| T["std::jthread — joins in its destructor"]\n' +
          '  A -->|"no — a C API with an<br/>open/close pair"| B{"Is the handle a pointer,<br/>and is the closer stateless?"}\n' +
          '  B -->|yes| CD["std::unique_ptr&lt;FILE, FileCloser&gt;<br/>— no new class needed.<br/>Measured: sizeof == sizeof(FILE*) == 8"]\n' +
          '  B -->|"no — an int fd, a C handle,<br/>or two-step teardown"| OWN["Write the class. Four things:<br/>1. acquire in the constructor, throw on failure<br/>2. release in the destructor, never throw<br/>3. = delete the copy operations<br/>4. add move operations if it should transfer"]\n' +
          '  U --> NEVER["and in none of these cases do you write<br/>new, delete, close, unlock or free<br/>at the point of use"]\n' +
          '  S --> NEVER\n' +
          '  V --> NEVER\n' +
          '  L --> NEVER\n' +
          '  F --> NEVER\n' +
          '  T --> NEVER\n' +
          '  CD --> NEVER\n' +
          '  OWN --> NEVER\n' +
          '  style NEVER fill:#1a3329,stroke:#4ade80\n' +
          '  style OWN fill:#1a2744,stroke:#5b9cf6\n' +
          '  style CD fill:#1a2744,stroke:#5b9cf6'
        }
      />

      <h3>The shortcut: <code>unique_ptr</code> with a custom deleter</h3>
      <p>
        If the handle is a pointer, you do not need a new class. <code>std::unique_ptr</code> takes a
        deleter type as its second template parameter, and a stateless one costs nothing:
      </p>

      <CodeBlock language="cpp" title="cdel.cpp">
{`#include <cstdio>
#include <memory>
#include <print>
#include <stdexcept>

// A generic RAII wrapper for any C API that has an open/close pair:
// unique_ptr with a custom deleter. No new class required.
struct FileCloser {
    void operator()(std::FILE* f) const noexcept {
        if (f) { std::println("  closing the FILE*"); std::fclose(f); }
    }
};
using FilePtr = std::unique_ptr<std::FILE, FileCloser>;

FilePtr open_or_throw(const char* path, const char* mode) {
    FilePtr f{std::fopen(path, mode)};
    if (!f) throw std::runtime_error{"cannot open"};
    return f;                 // ownership moves out
}

int main() {
    {
        auto f = open_or_throw("cdel-demo.txt", "w");
        std::fputs("written through a unique_ptr<FILE>\\n", f.get());
        std::println("  wrote; leaving the scope");
    }
    std::println("sizeof(FilePtr)              = {}", sizeof(FilePtr));
    std::println("sizeof(std::FILE*)           = {}", sizeof(std::FILE*));
    std::remove("cdel-demo.txt");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 cdel.cpp && ./cdel">
{`  wrote; leaving the scope
  closing the FILE*
sizeof(FilePtr)              = 8
sizeof(std::FILE*)           = 8`}
      </CodeBlock>

      <p>
        <strong>Eight bytes</strong> — exactly a <code>FILE*</code>. A stateless deleter is an empty
        type and the compiler stores none of it, so the whole RAII wrapper costs nothing in space
        and one <code>fclose</code> in time. Note the deleter is part of the{' '}
        <em>type</em>, so a <code>FilePtr</code> cannot be assigned from a plain{' '}
        <code>unique_ptr&lt;FILE&gt;</code> and cannot be deleted the wrong way by accident. Full
        treatment of <code>unique_ptr</code> is <a href="/cpp/smart-pointers">the next lesson</a>.
      </p>

      <h3>The real thing: wrapping a non-pointer handle</h3>
      <p>
        A POSIX file descriptor is an <code>int</code>, so <code>unique_ptr</code> does not fit
        naturally. This is where you write the class, and this is as complicated as it gets:
      </p>

      <CodeBlock language="cpp" title="fd.cpp — a complete RAII wrapper in twenty lines">
{`#include <cerrno>
#include <fcntl.h>
#include <print>
#include <stdexcept>
#include <string>
#include <system_error>
#include <unistd.h>

// A minimal RAII wrapper over a POSIX file descriptor.
// The resource is acquired in the constructor and released in the destructor;
// there is no other way to get one and no other way to let one go.
class Fd {
    int fd_ = -1;
public:
    Fd(const char* path, int flags, mode_t mode = 0644)
        : fd_(::open(path, flags, mode)) {
        if (fd_ < 0) throw std::system_error{errno, std::generic_category(), path};
    }

    ~Fd() { if (fd_ >= 0) ::close(fd_); }

    // Copying a file descriptor wrapper is almost always wrong: two objects
    // would each close the same fd. Say so, and let the compiler enforce it.
    Fd(const Fd&) = delete;
    Fd& operator=(const Fd&) = delete;

    [[nodiscard]] int get() const noexcept { return fd_; }

    void write_all(std::string_view s) const {
        if (::write(fd_, s.data(), s.size()) < 0)
            throw std::system_error{errno, std::generic_category(), "write"};
    }
};

void risky_work(const char* path, bool fail) {
    Fd f{path, O_WRONLY | O_CREAT | O_TRUNC};
    std::println("  opened fd {}", f.get());
    f.write_all("some data\\n");
    if (fail) throw std::runtime_error{"failed while holding the fd"};
    std::println("  finished normally with fd {}", f.get());
}

int main() {
    std::println("1. the happy path:");
    risky_work("fd-demo.txt", false);

    std::println("2. the throwing path:");
    try { risky_work("fd-demo.txt", true); }
    catch (const std::exception& e) { std::println("  caught: {}", e.what()); }

    std::println("3. opening a path that does not exist:");
    try { Fd bad{"/no/such/directory/file.txt", O_WRONLY}; }
    catch (const std::system_error& e) {
        std::println("  caught: {}  (code {})", e.what(), e.code().value());
    }

    std::println("4. the loop that proves the fds really were closed:");
    for (int i = 0; i < 200'000; ++i) {
        Fd f{"fd-demo.txt", O_WRONLY | O_CREAT | O_TRUNC};
        if (i % 50'000 == 0) std::println("  iteration {:>6}: fd = {}", i, f.get());
    }
    std::println("  200,000 opens completed");
    ::unlink("fd-demo.txt");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 fd.cpp && ./fd">
{`1. the happy path:
  opened fd 3
  finished normally with fd 3
2. the throwing path:
  opened fd 3
  caught: failed while holding the fd
3. opening a path that does not exist:
  caught: /no/such/directory/file.txt: No such file or directory  (code 2)
4. the loop that proves the fds really were closed:
  iteration      0: fd = 3
  iteration  50000: fd = 3
  iteration 100000: fd = 3
  iteration 150000: fd = 3
  200,000 opens completed`}
      </CodeBlock>

      <p>
        Block 4 is the proof. <strong>The descriptor number stayed at 3 for two hundred thousand
        iterations.</strong> The kernel hands out the lowest free descriptor, so a constant 3 means
        each one was genuinely returned before the next was requested. Here is the same loop without
        the wrapper, under a deliberately low descriptor limit so it fails quickly:
      </p>

      <CodeBlock language="cpp" title="fdleak.cpp">
{`#include <cerrno>
#include <cstring>
#include <fcntl.h>
#include <print>
#include <unistd.h>

// The same job without RAII: open, use, and forget to close.
int main() {
    for (int i = 0; ; ++i) {
        int fd = ::open("fd-demo.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (fd < 0) {
            std::println("iteration {}: open failed: {} (errno {})",
                         i, std::strerror(errno), errno);
            break;
        }
        if (i % 50 == 0) std::println("iteration {:>4}: fd = {}", i, fd);
        // no close() -- this is the bug
    }
    ::unlink("fd-demo.txt");
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — ( ulimit -n 256; ./fdleak )">
{`iteration    0: fd = 3
iteration   50: fd = 53
iteration  100: fd = 103
iteration  150: fd = 153
iteration  200: fd = 203
iteration  250: fd = 253
iteration 253: open failed: Too many open files (errno 24)`}
      </CodeBlock>

      <p>
        The number climbs by one per iteration and then <code>EMFILE</code>. Note what happens next
        in a real service: <em>every</em> subsequent <code>open</code>, <code>socket</code> and{' '}
        <code>accept</code> anywhere in the process fails, so the symptom shows up in a component
        that has nothing to do with the leak. This is the resource-leak equivalent of the leaked{' '}
        <code>live = 2</code> counter earlier, and it is why descriptor leaks are such miserable
        production bugs.
      </p>
      <p>
        The deleted copy operations are not decoration either. Without them, the compiler would
        generate a copy constructor that duplicates the <code>int</code>, and two{' '}
        <code>Fd</code> objects would each <code>close()</code> the same descriptor — a double-close,
        which in a threaded program can close a descriptor another thread has just been given. With
        them, it is a compile error:
      </p>

      <CodeBlock language="cpp" title="fdcopy2.cpp — the same class, plus the two things you must not be able to do">
{`int main() {
    Fd a{"x.txt", O_WRONLY | O_CREAT};
    Fd b = a;                   // two objects, one descriptor
    Fd c{"y.txt", O_WRONLY | O_CREAT};
    c = a;                      // the same problem by assignment
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — clang++ -std=c++23 -fsyntax-only -fmessage-length=74 fdcopy2.cpp">
{`fdcopy2.cpp:20:8: error: call to deleted constructor of 'Fd'
   20 |     Fd b = a;                   // two objects, one descriptor
      |        ^   ~
fdcopy2.cpp:14:5: note: 'Fd' has been explicitly marked deleted here
   14 |     Fd(const Fd&) = delete;
      |     ^
fdcopy2.cpp:22:7: error: overload resolution selected deleted operator '='
   22 |     c = a;                      // the same problem by assignment
      |     ~ ^ ~
fdcopy2.cpp:15:9: note: candidate function has been explicitly deleted
   15 |     Fd& operator=(const Fd&) = delete;
      |         ^
2 errors generated.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Two rules about RAII destructors that are not optional">
        <p>
          <strong>1. A destructor must not throw.</strong> Destructors are implicitly{' '}
          <code>noexcept</code> since C++11, and you have to go out of your way —{' '}
          <code>noexcept(false)</code> — to write one that can throw at all. Here is why, with a
          destructor that throws while an exception is already unwinding:
        </p>
        <CodeBlock language="cpp" title="dtor_throw.cpp">
{`struct Bad {
    ~Bad() noexcept(false) {
        std::fprintf(stderr, "  ~Bad throwing\\n");
        throw std::runtime_error{"from the destructor"};
    }
};

int main() {
    try {
        Bad b;
        std::fprintf(stderr, "  throwing from the body\\n");
        throw std::runtime_error{"from the body"};
    } catch (const std::exception& e) {
        std::fprintf(stderr, "  caught: %s\\n", e.what());
    }
    std::fprintf(stderr, "  still running\\n");
}`}
        </CodeBlock>
        <CodeBlock language="text" title="Real output — clang++ -std=c++23 -Wall -Wextra -O2 dtor_throw.cpp && ./dtor_throw">
{`  throwing from the body
  ~Bad throwing
libc++abi: terminating due to uncaught exception of type std::runtime_error: from the destructor
exit=134`}
        </CodeBlock>
        <p>
          The <code>catch</code> never ran and neither did <code>still running</code>. Two exceptions
          in flight, <code>std::terminate</code>, process gone. So a release operation that can fail
          must swallow or log the failure, not propagate it; if the caller needs to know, give them
          an explicit <code>close()</code> that can throw and let the destructor be the fallback.
          That is precisely what <code>std::ofstream</code> does, and it is also why C++ has no
          equivalent of Java&apos;s suppressed-exception machinery: it forbids the situation rather
          than modelling it.
        </p>
        <p>
          <strong>2. Declaring a destructor has consequences for copying and moving.</strong>{' '}
          Writing a destructor suppresses the implicit <em>move</em> operations, so a class with a
          user-declared destructor and nothing else is copyable but not movable. For an owning
          wrapper, the copy is exactly what you must forbid, which is why the two{' '}
          <code>= delete</code> lines are mandatory rather than stylistic — and why, if the handle
          should be transferable, you have to write the move operations yourself. That is the{' '}
          <strong>rule of five</strong>, and it is covered fully in the
          <a href="/cpp/classes">classes lesson</a>; <code>Fd</code> as written above is deliberately non-transferable, which is a
          legitimate design and the simplest correct one.
        </p>
        <p>
          There is no <code>std::scope_exit</code> to fall back on, incidentally — verified rather
          than assumed: <code>#include &lt;experimental/scope&gt;</code> on this toolchain gives{' '}
          <code>fatal error: &apos;experimental/scope&apos; file not found</code>. The
          Library Fundamentals TS scope guards are not available here, so a class or a{' '}
          <code>unique_ptr</code> with a deleter are your two options.
        </p>
      </InfoBox>

      <h2>A Raw Owning Pointer Is Almost Always A Bug</h2>
      <p>
        This is the rule that falls out of everything above, and it is worth stating as strongly as
        it deserves. <strong>In modern C++, a raw pointer means &quot;I can see this thing, and
        somebody else is responsible for it.&quot; A raw pointer that you are expected to{' '}
        <code>delete</code> is a design error.</strong>
      </p>
      <p>
        Not because <code>delete</code> is hard to type, but because the ownership is then encoded in
        documentation rather than in the type system, and every single one of the following has to
        then be got right by hand, at every call site, forever:
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={headStyle}>What can go wrong</th>
            <th style={headStyle}>Raw owning pointer</th>
            <th style={headStyle}>RAII type</th>
          </tr>
        </thead>
        <tbody>
          <tr style={rowStyle}>
            <td style={cellStyle}>an early <code>return</code></td>
            <td style={cellStyle}>leaks — measured above</td>
            <td style={cellStyle}>impossible</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>an exception from anything in between</td>
            <td style={cellStyle}>leaks — measured above</td>
            <td style={cellStyle}>impossible</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>a <code>break</code> or <code>continue</code></td>
            <td style={cellStyle}>leaks</td>
            <td style={cellStyle}>impossible</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>deleted twice down two code paths</td>
            <td style={cellStyle}>double free; exit 133 at best, silent corruption at worst</td>
            <td style={cellStyle}>impossible</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}><code>new[]</code> freed with <code>delete</code></td>
            <td style={cellStyle}>undefined behaviour</td>
            <td style={cellStyle}>impossible — the type carries the deleter</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>used after <code>delete</code></td>
            <td style={cellStyle}>the pointer is not nulled; no check is possible</td>
            <td style={cellStyle}>the owner is gone, so the name is gone</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>the object is copied</td>
            <td style={cellStyle}>two pointers, one allocation, two deletes</td>
            <td style={cellStyle}>a compile error, or a move, by design</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>a constructor throws half way through</td>
            <td style={cellStyle}>the members built so far leak</td>
            <td style={cellStyle}>already-built members are destroyed</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;who frees this?&quot;</td>
            <td style={cellStyle}>a comment, if you are lucky</td>
            <td style={cellStyle}>the type, checked by the compiler</td>
          </tr>
        </tbody>
      </table>

      <p>
        The last row in the table is the real one. A signature that says{' '}
        <code>std::unique_ptr&lt;Session&gt; make_session();</code> tells the caller, in the type,
        that they now own a <code>Session</code> and that it will be released when their variable
        dies. A signature that says <code>Session* make_session();</code> tells them nothing, and
        the answer is in a comment, or in a wiki page, or in nobody&apos;s head at all.
      </p>

      <CodeBlock language="cpp" title="What a raw pointer should mean in code you write today">
{`// OWNING -- yes. Lifetime travels with the type.
std::unique_ptr<Session> make_session();          // caller owns it
std::shared_ptr<Config>  shared_config();         // shared ownership, genuinely
std::vector<Row>         fetch_rows();            // owns N Rows

// NON-OWNING -- also yes. These are views, and they must not outlive the owner.
void log(const Session& s);                       // definitely there
void log(const Session* s);                       // maybe there; check it
void sum(std::span<const int> xs);                // a window onto someone's buffer
void find(std::string_view needle);               // a window onto someone's chars

// OWNING RAW POINTER -- no.
Session* make_session();                          // who deletes this? when? how?
void take_ownership(Session* s);                  // does it delete? can I still use s?
Session* sessions = new Session[n];               // delete[] -- on every path?`}
      </CodeBlock>

      <InfoBox variant="tip" title="The exceptions, because there are a few">
        <p>
          Raw <code>new</code> and <code>delete</code> are not forbidden, they are just not for
          application code. Legitimate places they still appear:
        </p>
        <ul>
          <li>
            <strong>Inside an RAII type.</strong> Somebody has to call them, and that somebody is{' '}
            <code>unique_ptr</code>, <code>vector</code>, or your own wrapper. One place, reviewed
            once.
          </li>
          <li>
            <strong>Custom allocators and intrusive data structures</strong>, where you are
            implementing the ownership mechanism rather than using it.
          </li>
          <li>
            <strong>Interop boundaries</strong> — handing a pointer to a C callback API that will
            hand it back later. The modern form is <code>ptr.release()</code> on the way out and{' '}
            <code>unique_ptr&lt;T&gt;{'{'}p{'}'}</code> on the way back in, so the raw pointer only
            exists while it is in C&apos;s hands.
          </li>
          <li>
            <strong>Code you did not write and are not going to rewrite today.</strong> Wrapping the
            handle in an RAII type at the boundary is usually a smaller change than it looks, and it
            is the highest-value refactor available in a legacy C++ codebase.
          </li>
        </ul>
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
            <td style={cellStyle}>&quot;I need a cleanup block for the exception path&quot;</td>
            <td style={cellStyle}>Three destructors ran between the <code>throw</code> and the{' '}
              <code>catch</code>, from a file with zero lines of cleanup code.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The <code>delete</code> is right there, it is fine&quot;</td>
            <td style={cellStyle}>It ran on <strong>one of three</strong> exit paths. The leak
              count never returned to zero.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;The destructor always runs&quot;</td>
            <td style={cellStyle}>Not on <code>std::exit</code>, <code>quick_exit</code>,{' '}
              <code>abort</code>, or an <em>uncaught</em> exception — where not even the static
              destructors ran.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A temporary dies after it is used&quot;</td>
            <td style={cellStyle}>It dies at the end of the <em>full expression</em> — after the{' '}
              <code>println</code> that consumed it had already printed.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Go&apos;s <code>defer</code> is the same thing&quot;</td>
            <td style={cellStyle}>Function-scoped, not block-scoped. A <code>defer</code> in an
              inner block fired after the function returned; three in a loop held three resources
              open.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;JavaScript has nothing like this&quot;</td>
            <td style={cellStyle}>Wrong as of Node v25.2.1. <code>using</code> +{' '}
              <code>Symbol.dispose</code> gives block-scoped, reverse-order, throw-safe disposal —
              but you must remember the keyword, and members do not compose.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;Java&apos;s try-with-resources is equivalent&quot;</td>
            <td style={cellStyle}>Equivalent per use site. <code>Holder.close()</code> had to chain
              its two members by hand; <code>javac</code> warned about nothing when the{' '}
              <code>try</code> was omitted.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;A guard object must cost something&quot;</td>
            <td style={cellStyle}><strong>12 instructions each</strong> on the happy path for{' '}
              <code>lock_guard</code> and hand-written lock/unlock. The extra 7 are the landing pad
              that makes it correct.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;<code>std::lock_guard&lt;std::mutex&gt;{'{'}m{'}'};</code> locks
              the function&quot;</td>
            <td style={cellStyle}>It locks and unlocks immediately —{' '}
              <code>m1 free = true</code> inside the body. <code>-Wall</code> catches it via{' '}
              <code>[[nodiscard]]</code>.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;An unclosed file is a tidiness issue&quot;</td>
            <td style={cellStyle}>0 bytes on disk until the brace. And a descriptor leak hit{' '}
              <code>EMFILE</code> at iteration 253, breaking every later <code>open</code> in the
              process.</td>
          </tr>
          <tr style={rowStyle}>
            <td style={cellStyle}>&quot;An RAII wrapper is a layer of indirection&quot;</td>
            <td style={cellStyle}><code>sizeof(unique_ptr&lt;FILE, FileCloser&gt;)</code> = 8 ={' '}
              <code>sizeof(FILE*)</code>. The deleter occupies no space at all.</td>
          </tr>
        </tbody>
      </table>

      <h2>Where This Leads</h2>
      <p>
        RAII is the technique; the standard library ships the instances you need most. The next
        lesson is the most important of those instances, and it is the one that makes the rule at the
        top of this page — never a raw owning pointer — practical rather than aspirational:
      </p>
      <ul>
        <li>
          <strong><code>std::unique_ptr&lt;T&gt;</code></strong> — single ownership, the default,
          and the thing you return from a factory. Measured in{' '}
          <a href="/cpp/intro">the intro</a> as compiling to exactly a pointer.
        </li>
        <li>
          <strong><code>std::shared_ptr&lt;T&gt;</code></strong> — reference-counted shared
          ownership, what it actually costs, and why it is not the default despite being the closest
          thing to a Java reference.
        </li>
        <li>
          <strong><code>std::weak_ptr&lt;T&gt;</code></strong> — the answer to reference cycles and
          to the dangling-callback problem that{' '}
          <a href="/cpp/functions">the functions lesson</a> left open.
        </li>
        <li>
          <strong><code>make_unique</code> and <code>make_shared</code></strong> — and why they are
          not just shorthand.
        </li>
      </ul>
      <p>
        After that, <strong>move semantics</strong>, which is the other half of this story: RAII says
        a resource has exactly one owner bound to one scope, and moves are how that ownership gets
        from one scope to another without copying the resource. The <code>return f;</code> in the{' '}
        <code>FilePtr</code> factory above was already a move — it is worth noticing that it
        compiled at all, given that <code>FilePtr</code> cannot be copied.
      </p>

      <InfoBox variant="question" title="Before you move on">
        <p>
          Go and find the <code>try</code>/<code>finally</code>, <code>defer</code> or{' '}
          <code>try</code>-with-resources blocks in something you have written recently in another
          language. Count them. Then ask, for each one, whether the resource being released is a type
          you control.
        </p>
        <p>
          Where the answer is yes, every one of those blocks is a place where C++ would need nothing
          at all — the guarantee would live in the type, written once by you, and no caller could
          get it wrong. Where the answer is no, you have found the reason the three other
          languages put the burden at the call site: they cannot attach a destructor to somebody
          else&apos;s class. C++ can, because a destructor is part of the type and the compiler
          emits the call.
        </p>
        <p>
          That is the whole lesson, and it is why this page is the one to come back to.{' '}
          <a href="/cpp/smart-pointers">The next lesson</a> applies it to the resource you will
          reach for most often — memory — and retires <code>new</code> and <code>delete</code> from
          your vocabulary for good.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Raii;
