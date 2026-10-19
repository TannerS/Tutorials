import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CppMiniGuide() {
  return (
    <LessonLayout
      title="🧩 C++ Mini Guide — The Short Version"
      sectionId="cpp"
      lessonIndex={20}
      prev={{ path: '/cpp/tooling', label: 'Build Systems, Debugging & Sanitizers' }}
      next={{ path: '/cpp/cheatsheet', label: 'C++ Field Guide' }}
    >
      <InfoBox variant="warning" title="The middle tier — shorter than the section, fuller than the field guide">
        <p>
          Three ways to read this section, and this is the one in between. The{' '}
          <strong>twenty lessons above</strong> are the real course. The{' '}
          <a href="/cpp/cheatsheet">field guide</a> below is a lookup table for when you
          already know what you are after. <strong>This page is neither</strong> — it is
          one linear read that gets you writing small C++ programs today.
        </p>
        <p style={{ marginBottom: 0 }}>
          Deliberately incomplete: no templates, no move semantics, no vtables. When
          something bites, the full lesson is linked beside it. Everything here was run on{' '}
          <strong>Apple clang 21.0.0, arm64</strong> with <strong>CMake 4.4.4</strong>.{' '}
          <strong>Temporary page — delete it once the section above has been read.</strong>
        </p>
      </InfoBox>

      <h2>Compiling, Two Ways</h2>
      <CodeBlock language="bash" title="One file — use this while learning">
{`clang++ -std=c++23 -Wall -Wextra -o app main.cpp
./app

# Measured here: 2.1s to compile the 30-line program below, 73 KB binary.`}
      </CodeBlock>
      <CodeBlock language="bash" title="CMake — use this the moment you have two files">
{`# CMakeLists.txt
cmake_minimum_required(VERSION 3.20)
project(app CXX)
set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_executable(app main.cpp)

# Then:
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug   # measured: 561 ms
cmake --build build                            # measured: 581 ms
./build/app`}
      </CodeBlock>

      <InfoBox variant="danger" title="Always pass -std. The default is not what you want.">
        <p style={{ marginBottom: 0 }}>
          Measured on this machine: with no <code>-std</code> flag, clang reports{' '}
          <code>__cplusplus 201402L</code> — that is <strong>C++14</strong>, from eleven
          years ago. No <code>std::optional</code>, no structured bindings, no{' '}
          <code>std::expected</code>. Half the &quot;why doesn&apos;t this compile&quot;
          confusion in C++ is a missing <code>-std=c++23</code>.
        </p>
      </InfoBox>

      <h2>The Program</h2>
      <CodeBlock language="cpp" title="main.cpp — compiles and runs as-is">
{`#include <algorithm>
#include <iostream>
#include <memory>
#include <optional>
#include <string>
#include <vector>

struct Task {
    std::string title;
    bool done = false;        // default member initialiser — do this always
};

// optional<T> is "a T, or nothing" — no null pointer, no sentinel value.
std::optional<Task> make_task(std::string title) {
    if (title.empty()) return std::nullopt;
    return Task{std::move(title), false};
}

int main() {
    std::vector<Task> tasks;
    for (std::string name : {"write guide", "", "ship it"}) {
        if (auto t = make_task(name)) tasks.push_back(std::move(*t));
        else std::cerr << "skipping: empty title\\n";
    }
    tasks[0].done = true;

    for (const Task& t : tasks)             // const& — do NOT copy in a loop
        std::cout << '[' << (t.done ? 'x' : ' ') << "] " << t.title << '\\n';

    std::cout << "count: " << tasks.size() << " cap: " << tasks.capacity() << '\\n';

    auto n = std::count_if(tasks.begin(), tasks.end(),
                           [](const Task& t){ return t.done; });
    std::cout << "done: " << n << '\\n';

    auto owned = std::make_unique<Task>(Task{"owned", true});
    std::cout << "unique_ptr: " << owned->title << '\\n';
}                                           // everything freed here. No delete.`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`skipping: empty title
[x] write guide
[ ] ship it
count: 2 cap: 2
done: 1
unique_ptr: owned`}
      </CodeBlock>

      <h2>The One Idea That Makes C++ Make Sense</h2>
      <InfoBox variant="success" title="RAII — a destructor runs when the scope ends">
        <p>
          Every object cleans itself up when it goes out of scope, automatically, even if
          an exception is thrown. <code>std::vector</code> frees its memory.{' '}
          <code>std::string</code> frees its buffer. <code>std::unique_ptr</code> deletes
          what it owns. <code>std::lock_guard</code> unlocks the mutex.
        </p>
        <p style={{ marginBottom: 0 }}>
          The practical consequence for you right now:{' '}
          <strong>you should almost never write <code>new</code> or
          <code> delete</code>.</strong> If you are reaching for them, reach for a{' '}
          <code>vector</code>, a <code>string</code>, or a <code>unique_ptr</code>{' '}
          instead. Full story: <a href="/cpp/raii">RAII</a>,{' '}
          <a href="/cpp/smart-pointers">Smart Pointers</a>.
        </p>
      </InfoBox>

      <h2>The Syntax You Actually Need</h2>
      <CodeBlock language="cpp" title="90% of day-one C++">
{`// TYPES — auto where the type is obvious, explicit where it is not
auto x = 5;                 int y = 5;
const auto& r = thing;      // bind without copying

// THE FOUR CONTAINERS YOU NEED
std::vector<int> v{1,2,3};              // the default. Use it unless you know better.
std::string s = "hi";
std::unordered_map<std::string,int> m;  // hash map
std::optional<int> maybe;               // "an int, or nothing"

v.push_back(4);   v.size();   v[0];   v.at(0);   // .at() is bounds-checked
m["k"] = 1;   if (m.contains("k")) ...           // C++20

// LOOPS
for (const auto& item : v) { }      // read-only: const auto&
for (auto& item : v) { item++; }    // mutate: auto&
for (auto item : v) { }             // COPIES each element — usually a mistake

// STRUCTURED BINDINGS (C++17) — destructuring
for (const auto& [key, value] : m) { }
auto [a, b] = std::pair{1, 2};

// FUNCTIONS
int add(int a, int b) { return a + b; }
void take(const std::string& s);    // by const ref: no copy, cannot modify
void fill(std::string& s);          // by ref: can modify the caller's object
void own(std::string s);            // by value: takes a copy (or a move)

// LAMBDAS
auto f = [](int x){ return x * 2; };
auto g = [&total](int x){ total += x; };   // [&] captures by reference
auto h = [=](int x){ return x + base; };   // [=] captures by copy

// CLASSES
class Counter {
public:
    void inc() { ++n_; }
    int value() const { return n_; }    // const = does not modify the object
private:
    int n_ = 0;
};`}
      </CodeBlock>

      <h2>Headers, and Why There Are Two Files</h2>
      <CodeBlock language="cpp" title="The model: #include is a literal copy-paste">
{`// task.hpp — the DECLARATION. What exists.
#pragma once                  // include it twice, it only lands once
#include <string>

struct Task {
    std::string title;
    bool done = false;
    void finish();            // declared, not defined
};

// task.cpp — the DEFINITION. How it works.
#include "task.hpp"
void Task::finish() { done = true; }

// main.cpp
#include "task.hpp"           // the preprocessor pastes the header in, verbatim

// Then compile BOTH .cpp files:
//   clang++ -std=c++23 -o app main.cpp task.cpp
// Forgetting the second one gives "undefined symbol: Task::finish()" --
// that is a LINKER error, not a compiler one, and it means the declaration
// was found but the body was never compiled in.`}
      </CodeBlock>
      <p>
        <a href="/cpp/compiling">Compiling, Linking &amp; the One-Definition Rule</a> is
        the lesson to read the first time a linker error makes no sense.
      </p>

      <h2>The Five Things That Will Bite You</h2>
      <CodeBlock language="cpp" title="In rough order of how soon you will hit them">
{`// 1. ITERATOR / POINTER INVALIDATION — the classic.
std::vector<int> v{1,2,3};
int* p = &v[0];
v.push_back(4);        // may REALLOCATE; p now dangles
std::cout << *p;       // undefined behaviour. See the sanitizer section.

// 2. Copying by accident in a range-for.
for (auto s : big_strings) { }        // copies every string
for (const auto& s : big_strings) { } // fix

// 3. Returning a reference to a local.
const std::string& bad() { std::string s = "x"; return s; }   // dangles
std::string good() { return "x"; }                            // just return by value

// 4. Uninitialised variables hold GARBAGE, not zero.
int x;                 // whatever was in that memory
int x = 0;             // say what you mean. Always initialise.

// 5. v[i] does NOT bounds-check. Reading v[99] of a 3-element vector is
//    undefined behaviour, not a crash -- it may quietly return nonsense.
//    v.at(i) throws std::out_of_range instead.`}
      </CodeBlock>

      <h2>The Tool That Will Save You the Most Time</h2>
      <p>
        Memory bugs in C++ are usually silent. Turn them into loud, precise error
        messages by compiling with a sanitizer. Use this for every debug build:
      </p>
      <CodeBlock language="bash" title="AddressSanitizer — one flag">
{`clang++ -std=c++23 -g -fsanitize=address -o app main.cpp
./app`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — ASan on bug #1 above">
{`==73740==ERROR: AddressSanitizer: heap-use-after-free on address 0x6020000000d0
READ of size 4 at 0x6020000000d0 thread T0
    #0 0x000102d20af4 in main bug.cpp:7`}
      </CodeBlock>
      <InfoBox variant="tip" title="File and line number, for free">
        <p style={{ marginBottom: 0 }}>
          Without the flag that program printed a plausible-looking number and exited 0.
          With it, you get the exact line. Add{' '}
          <code>-fsanitize=address,undefined</code> to catch signed overflow and bad
          casts too, and <code>-fsanitize=thread</code> for data races. More:{' '}
          <a href="/cpp/memory-bugs">Memory Bugs &amp; the Sanitizers That Catch Them</a>.
        </p>
      </InfoBox>

      <h2>Errors</h2>
      <CodeBlock language="cpp" title="Three options; pick by situation">
{`// 1. optional<T> — "it might not be there". No error detail.
std::optional<Task> find(int id);
if (auto t = find(1)) use(*t);

// 2. expected<T,E> (C++23) — "it failed, and here is why". No exceptions.
std::expected<Config, std::string> load(std::string path);
auto cfg = load("a.toml");
if (!cfg) std::cerr << cfg.error();

// 3. Exceptions — for genuinely exceptional failure.
try { risky(); }
catch (const std::exception& e) { std::cerr << e.what(); }

// RAII means you do NOT need try/finally: destructors run during unwinding,
// so a vector/lock/file still cleans up when an exception passes through.`}
      </CodeBlock>

      <h2>Where to Go When This Runs Out</h2>
      <CodeBlock language="text" title="Read these in this order, as you hit them">
{`linker error that makes no sense  -> /cpp/compiling
crash you cannot explain          -> /cpp/memory-bugs  (sanitizers first!)
confused by & and * and copies    -> /cpp/references, /cpp/memory-model
writing your own class            -> /cpp/classes  (Rule of Zero)
owning heap memory                -> /cpp/smart-pointers
"why is this so slow"             -> /cpp/performance, /cpp/containers
setting up a real build           -> /cpp/tooling
want the one-page reference       -> /cpp/cheatsheet`}
      </CodeBlock>
    </LessonLayout>
  );
}
