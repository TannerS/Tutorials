import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function GoMiniGuide() {
  return (
    <LessonLayout
      title="🧩 Go Mini Guide — The Short Version"
      sectionId="go"
      lessonIndex={18}
      prev={{ path: '/go/deploy', label: 'Project Layout, Build & Deploy' }}
      next={{ path: '/go/cheatsheet', label: 'Go Field Guide' }}
    >
      <InfoBox variant="warning" title="The middle tier — shorter than the section, fuller than the field guide">
        <p>
          Three ways to read this section, and this is the one in between. The{' '}
          <strong>eighteen lessons above</strong> are the real course. The{' '}
          <a href="/go/cheatsheet">field guide</a> below is a lookup table for when you
          already know what you are after. <strong>This page is neither</strong> — it is
          one linear read that gets you writing small Go programs today.
        </p>
        <p style={{ marginBottom: 0 }}>
          Deliberately incomplete: no generics, no deep concurrency, no deep dives. When
          something bites, the full lesson is linked beside it. Everything here was run
          on <strong>go1.25.5 darwin/arm64</strong>.{' '}
          <strong>Temporary page — delete it once the section above has been read.</strong>
        </p>
      </InfoBox>

      <h2>A Project, Start to Finish</h2>
      <CodeBlock language="bash" title="Four commands — this is the whole workflow">
{`mkdir hello && cd hello
go mod init example.com/hello     # creates go.mod; the name is an import path
# ...write main.go...
go run .                          # compile + run, no artifact left behind
go build -o hello .               # produce a binary

# Two more worth knowing from day one:
go vet ./...                      # real bug finder, not a style linter
go test ./...                     # runs *_test.go; no framework to install
go fmt ./...                      # formatting is not a debate in Go`}
      </CodeBlock>

      <InfoBox variant="tip" title="Three facts that save a lot of confusion">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>One <code>main</code> package per program.</strong> The file must say{' '}
            <code>package main</code> and have <code>func main()</code>. Everything else
            is a library package named after its folder.
          </li>
          <li>
            <strong>The binary is static and self-contained.</strong> The 30-line program
            below built to <strong>2.3 MB</strong> and needs no runtime installed —
            copy it to a server and it runs.
          </li>
          <li>
            <strong>An unused import or variable is a compile ERROR</strong>, not a
            warning. This catches people on their first day. Delete it, or assign to{' '}
            <code>_</code>.
          </li>
        </ul>
      </InfoBox>

      <h2>The Program</h2>
      <p>
        This is small on purpose and uses nearly everything you need for a first project:
        a struct, a method, a slice, a map, an error, a loop, and formatted output.
      </p>
      <CodeBlock language="go" title="main.go — runs as-is">
{`package main

import (
	"errors"
	"fmt"
	"os"
	"strings"
)

type Task struct {
	Title string          // Capitalised = exported (public). lowercase = package-private.
	Done  bool
}

// A method. The (t Task) receiver is a VALUE — it gets a copy.
// Use (t *Task) when the method must mutate the original.
func (t Task) String() string {
	mark := " "
	if t.Done {
		mark = "x"
	}
	return fmt.Sprintf("[%s] %s", mark, t.Title)
}

var errEmpty = errors.New("empty title")

// Multiple return values, with the error LAST. This is the Go signature.
func newTask(title string) (Task, error) {
	if strings.TrimSpace(title) == "" {
		return Task{}, errEmpty
	}
	return Task{Title: title}, nil
}

func main() {
	tasks := []Task{}                       // := declares and infers
	for _, name := range []string{"write guide", "", "ship it"} {
		t, err := newTask(name)
		if err != nil {                     // you will write this a LOT
			fmt.Fprintf(os.Stderr, "skipping: %v\\n", err)
			continue
		}
		tasks = append(tasks, t)            // append RETURNS the new slice
	}
	tasks[0].Done = true

	for _, t := range tasks {
		fmt.Println(t)                      // calls String() automatically
	}
	fmt.Println("count:", len(tasks), "cap:", cap(tasks))

	var zero Task
	fmt.Printf("zero value: %+v | nil map read: %v\\n", zero, map[string]int(nil)["missing"])
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run .">
{`skipping: empty title
[x] write guide
[ ] ship it
count: 2 cap: 2
zero value: [ ]  | nil map read: 0`}
      </CodeBlock>

      <h2>The Syntax You Actually Need</h2>
      <CodeBlock language="go" title="90% of day-one Go">
{`// VARIABLES
x := 5                    // inside functions only; type inferred
var x int = 5             // explicit; works at package level too
const Max = 100

// There is no uninitialised memory. Every type has a ZERO VALUE:
//   numbers 0 | string "" | bool false | pointers/slices/maps nil

// FUNCTIONS — types come after the name
func add(a, b int) int { return a + b }
func divide(a, b int) (int, error) { ... }   // error last, by convention

// COLLECTIONS
s := []int{1, 2, 3}       // slice (what you want 95% of the time)
s = append(s, 4)          // reassign! append may return a NEW backing array
m := map[string]int{}     // map
m["k"] = 1
v, ok := m["k"]           // the comma-ok idiom: ok is false if absent

// CONTROL FLOW — no parentheses, braces mandatory
if v, err := f(); err != nil { ... }   // scoped to the if
for i := 0; i < 10; i++ { }            // the only loop keyword
for i, v := range s { }                // index, value
for { break }                          // while(true)

switch x {                             // no fallthrough by default
case 1, 2: ...
default: ...
}

// STRUCTS & INTERFACES
type Point struct{ X, Y int }
p := Point{X: 1, Y: 2}

type Stringer interface{ String() string }
// No "implements" — having the method IS implementing it.

// POINTERS: no arithmetic, and no -> ; the dot auto-dereferences
p := &Point{1, 2}
p.X = 5                   // same as (*p).X`}
      </CodeBlock>

      <h2>Errors — the Thing That Feels Alien</h2>
      <CodeBlock language="go" title="There are no exceptions">
{`f, err := os.Open("x.txt")
if err != nil {
	return fmt.Errorf("opening config: %w", err)   // %w WRAPS, keeping the cause
}
defer f.Close()          // runs when the function returns, in LIFO order

// Inspecting a wrapped error:
if errors.Is(err, os.ErrNotExist) { ... }          // is it this sentinel?
var pe *os.PathError
if errors.As(err, &pe) { ... }                     // is it this type? bind it

// panic() exists and is NOT for ordinary failure. Use it for "this program
// is broken", not "the file was missing".`}
      </CodeBlock>
      <p>
        Verbose, and that is the point — every failure is visible at the call site.{' '}
        <a href="/go/errors">Errors Are Values, Not Exceptions</a> has the full treatment.
      </p>

      <h2>Concurrency — the 10% You Need Now</h2>
      <CodeBlock language="go" title="Enough to be useful, not enough to be dangerous">
{`// A goroutine is a function call with 'go' in front.
go doWork()

// WaitGroup — wait for N goroutines to finish.
var wg sync.WaitGroup
for _, url := range urls {
	wg.Add(1)
	go func() {              // Go 1.22+: loop vars are per-iteration, no copy needed
		defer wg.Done()
		fetch(url)
	}()
}
wg.Wait()

// Channel — a typed pipe. Send blocks until someone receives.
ch := make(chan string)
go func() { ch <- "done" }()
msg := <-ch

// Mutex, when you just need to guard a map or counter.
var mu sync.Mutex
mu.Lock(); count++; mu.Unlock()`}
      </CodeBlock>
      <InfoBox variant="danger" title="The one rule">
        <p style={{ marginBottom: 0 }}>
          Do not share a map or slice across goroutines without a lock. Go will not stop
          you and the corruption is silent. Run <code>go test -race</code> or{' '}
          <code>go run -race .</code> — the race detector is genuinely excellent and
          finds these immediately. Deeper:{' '}
          <a href="/go/goroutines">Goroutines</a>, <a href="/go/channels">Channels</a>,{' '}
          <a href="/go/sync">The sync Package</a>.
        </p>
      </InfoBox>

      <h2>The Five Things That Will Bite You</h2>
      <CodeBlock language="go" title="In rough order of how soon you will hit them">
{`// 1. append may or may not share memory with the original.
b := a[:2]
b = append(b, 99)        // might overwrite a[2], might not. Depends on cap.
                         // Fix: copy explicitly when you need independence.

// 2. Value receivers get a COPY.
func (t Task) Finish() { t.Done = true }    // does NOTHING to the caller's Task
func (t *Task) Finish() { t.Done = true }   // works

// 3. A nil map read is fine; a nil map WRITE panics.
var m map[string]int
_ = m["k"]               // 0, fine
m["k"] = 1               // panic: assignment to entry in nil map
m = map[string]int{}     // make it first

// 4. defer evaluates arguments NOW, runs the call LATER.
defer fmt.Println(i)     // prints i's value at the defer line, not at return

// 5. An interface holding a nil pointer is NOT nil.
var p *MyErr = nil
var err error = p
err != nil               // TRUE. Classic bug: return a concrete nil pointer
                         // as an error and every caller sees a failure.`}
      </CodeBlock>

      <h2>A Tiny HTTP Server</h2>
      <CodeBlock language="go" title="The standard library is the framework">
{`package main

import (
	"encoding/json"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()

	// Go 1.22+ supports method + path params directly in the pattern.
	mux.HandleFunc("GET /tasks/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"id": id})
	})

	log.Fatal(http.ListenAndServe(":8080", mux))
}`}
      </CodeBlock>
      <p>
        No framework needed for small services. <a href="/go/http">HTTP Services with
        net/http</a> covers middleware, timeouts and graceful shutdown;{' '}
        <a href="/go/database">Database Access Without an ORM</a> covers{' '}
        <code>database/sql</code>.
      </p>

      <h2>Testing, Because It Is Free</h2>
      <CodeBlock language="go" title="main_test.go — no imports to install">
{`package main

import "testing"

func TestNewTask(t *testing.T) {
	if _, err := newTask(""); err == nil {
		t.Fatal("expected an error for an empty title")
	}
	got, err := newTask("x")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.Title != "x" {
		t.Errorf("Title = %q, want %q", got.Title, "x")
	}
}

// go test ./...          run them
// go test -race ./...    run them while watching for data races
// go test -cover ./...   coverage, built in`}
      </CodeBlock>

      <h2>Where to Go When This Runs Out</h2>
      <CodeBlock language="text" title="Read these in this order, as you hit them">
{`hit a slice surprise            -> /go/slices
confused by pointer vs value    -> /go/pointers
drowning in if err != nil       -> /go/errors
writing anything concurrent     -> /go/goroutines, /go/channels, /go/context
building a real service         -> /go/http, /go/database
laying out a repo / shipping it -> /go/deploy
want the one-page reference     -> /go/cheatsheet`}
      </CodeBlock>
    </LessonLayout>
  );
}
