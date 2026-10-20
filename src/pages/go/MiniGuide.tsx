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

      <h2>Laying Out a Real Project</h2>
      <p>
        One file stops being enough fast. This is the layout almost every Go repo uses,
        and it was built and run to confirm it works as written:
      </p>
      <CodeBlock language="text" title="The conventional shape">
{`proj/
├── go.mod                  module example.com/proj
├── cmd/
│   └── app/main.go         package main — one folder per binary
└── internal/
    └── task/task.go        package task — importable ONLY inside this module

go run   ./cmd/app
go build -o bin/app ./cmd/app`}
      </CodeBlock>
      <CodeBlock language="go" title="internal/task/task.go">
{`package task                  // package name = folder name

type Task struct {
	Title string
	Done  bool
}

func New(title string) Task { return Task{Title: title} }

func (t *Task) Finish() { t.Done = true }   // pointer receiver: mutates

func hidden() {}              // lowercase: invisible outside this package`}
      </CodeBlock>
      <CodeBlock language="go" title="cmd/app/main.go">
{`package main

import (
	"fmt"

	"example.com/proj/internal/task"    // module path + folder path
)

func main() {
	t := task.New("ship")
	t.Finish()
	fmt.Printf("%+v\\n", t)              // measured: {Title:ship Done:true}
}`}
      </CodeBlock>
      <InfoBox variant="tip" title="Three rules this encodes">
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>Import paths are module path + folder path.</strong> There is no
            path config and no aliasing — the folder is the truth.
          </li>
          <li>
            <strong><code>internal/</code> is enforced by the compiler.</strong> Code
            outside your module literally cannot import it. Free encapsulation at the
            package level, no tooling required.
          </li>
          <li>
            <strong>Capitalisation is the access modifier.</strong>{' '}
            <code>New</code> and <code>Task</code> are exported;{' '}
            <code>hidden</code> is not. There is no <code>public</code> keyword.
          </li>
        </ul>
      </InfoBox>

      <h2>Dependencies</h2>
      <CodeBlock language="bash" title="There is no package.json and no install step">
{`go get github.com/google/uuid       # adds it to go.mod and go.sum
go mod tidy                         # add what is imported, drop what is not
go mod download                     # fetch into the module cache (CI)

# go.sum pins cryptographic hashes. Commit BOTH go.mod and go.sum.
# There is no node_modules — the cache lives in $GOPATH/pkg/mod, shared
# across every project on the machine.`}
      </CodeBlock>
      <p>
        The standard library is unusually large, so check it before reaching outward:
        HTTP client and server, JSON, SQL, crypto, templating, compression and testing
        are all built in.
      </p>

      <h2>JSON — You Will Need This on Day One</h2>
      <CodeBlock language="go" title="Struct tags control the wire format">
{`type Config struct {
	Name    string   \`json:"name"\`
	Port    int      \`json:"port"\`
	Tags    []string \`json:"tags,omitempty"\`   // omit when empty
	secret  string                              // unexported: NEVER marshalled
	Missing *int     \`json:"missing,omitempty"\`
}

b, err := json.Marshal(cfg)              // struct -> []byte
err = json.Unmarshal(data, &cfg)         // []byte -> struct  (note the &)`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — Go 1.25.5">
{`marshal: {"name":"api","port":8080,"tags":["a"]}
  -> 'secret' is absent: unexported fields are invisible to encoding/json.
  -> 'missing' is absent: omitempty + nil pointer.

unmarshal type error: json: cannot unmarshal string into Go struct
                      field Config.port of type int

back: {Name:web Port:90 Tags:[] secret: Missing:<nil>}`}
      </CodeBlock>
      <InfoBox variant="danger" title="The silent one">
        <p style={{ marginBottom: 0 }}>
          A <strong>lowercase field is skipped without any error</strong>. Marshal a
          struct whose fields you forgot to capitalise and you get <code>{'{}'}</code>{' '}
          back, cheerfully. If JSON is coming out empty, check the capitalisation
          first — it is almost always this.
        </p>
      </InfoBox>

      <h2>The Standard Library Bits You Will Reach For</h2>
      <CodeBlock language="go" title="slices, maps, strings, strconv, os">
{`import ("slices"; "maps"; "strings"; "strconv"; "os")

// slices / maps — generic helpers, Go 1.21+. Stop writing these by hand.
slices.Sort(s)              slices.Contains(s, 2)      slices.Index(s, 3)
slices.Reverse(s)           slices.Max(s)              slices.Clone(s)
keys := slices.Sorted(maps.Keys(m))     // deterministic map iteration

// strings
strings.Join(parts, ",")    strings.Split(s, ",")      strings.Fields(s)
strings.Contains(s, "b")    strings.HasPrefix(s, "a")  strings.TrimSpace(s)
strings.ToUpper(s)          strings.ReplaceAll(s, "a", "b")
var sb strings.Builder; sb.WriteString("x"); sb.String()   // efficient concat

// strconv — conversion that can FAIL, so it returns an error
n, err := strconv.Atoi("42")        strconv.Itoa(42)
f, err := strconv.ParseFloat("1.5", 64)

// os
os.Getenv("PORT")           os.Args          // [0] is the program path
data, err := os.ReadFile("f.txt")            // whole file, as []byte
err = os.WriteFile("f.txt", data, 0o644)`}
      </CodeBlock>
      <CodeBlock language="text" title="Real output — the ones with surprises">
{`slices.Sorted(maps.Keys(m))  ->  [a b]     (map order is RANDOM without this)
strconv.Atoi("42x")          ->  0, strconv.Atoi: parsing "42x": invalid syntax
                                 ^ returns ZERO plus an error, not a panic`}
      </CodeBlock>

      <h2>Printf Verbs, Since You Will Debug With Them</h2>
      <CodeBlock language="text" title="Real output — one struct, six verbs">
{`type P struct{ X int };  p := P{1}

%v    {1}              the value
%+v   {X:1}            with field names   <- the one you want 90% of the time
%#v   main.P{X:1}      Go syntax
%T    main.P           the TYPE
%q    "str"            quoted
%d %s %f %t            int, string, float, bool

fmt.Println(a, b)                 // spaces + newline, no format string
fmt.Printf("x=%d\\n", x)           // needs the \\n
fmt.Errorf("ctx: %w", err)        // %w wraps; %v would flatten it to text
fmt.Fprintf(os.Stderr, ...)       // write to stderr`}
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

      <h2>Structs, Interfaces and Embedding, Practically</h2>
      <CodeBlock language="go" title="The composition model, in one block">
{`// EMBEDDING — the closest Go gets to inheritance. It is composition:
// the outer type gets the inner type's methods promoted onto it.
type Base struct{ ID int }
func (b Base) Describe() string { return fmt.Sprint("id=", b.ID) }

type User struct {
	Base              // embedded — no field name
	Name string
}
u := User{Base{1}, "ann"}
u.Describe()          // promoted from Base. u.ID works too.

// INTERFACES — satisfied implicitly. Define them where they are USED,
// not next to the implementation, and keep them small.
type Store interface {
	Get(id int) (User, error)
}

// The rule of thumb that keeps Go code testable:
//   ACCEPT interfaces, RETURN structs.
func NewService(s Store) *Service { ... }      // accepts: any Store, incl. a fake
func NewPostgres(db *sql.DB) *Postgres { ... } // returns: the concrete type

// io.Reader / io.Writer are the two interfaces worth knowing by heart.
// Files, HTTP bodies, buffers and network connections all satisfy them,
// so anything taking an io.Reader works with all of them.
func count(r io.Reader) (int, error)`}
      </CodeBlock>

      <h2>A 40-Line CLI, Which Covers Most Small Projects</h2>
      <CodeBlock language="go" title="flags, file I/O, exit codes">
{`package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"strings"
)

func main() {
	upper := flag.Bool("upper", false, "shout the output")
	name := flag.String("file", "", "file to read")
	flag.Parse()                       // ./app -upper -file=x.txt

	if *name == "" {
		fmt.Fprintln(os.Stderr, "missing -file")
		os.Exit(2)                     // non-zero = failure, for the shell
	}

	f, err := os.Open(*name)
	if err != nil {
		fmt.Fprintf(os.Stderr, "open: %v\\n", err)
		os.Exit(1)
	}
	defer f.Close()

	sc := bufio.NewScanner(f)          // line by line, no loading the whole file
	for sc.Scan() {
		line := sc.Text()
		if *upper {
			line = strings.ToUpper(line)
		}
		fmt.Println(line)
	}
	if err := sc.Err(); err != nil {   // Scan() returning false is not proof of EOF
		fmt.Fprintf(os.Stderr, "read: %v\\n", err)
		os.Exit(1)
	}
}`}
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
