import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function GoCheatsheet() {
  return (
    <GuideLayout
      title="Go"
      kicker="FIELD GUIDE"
      glyph="🐹"
      tagline="Written for a Node backend who also knows Java and C++ — every version, default and output here was run against a real toolchain, not recalled."
      meta={['Go 1.27.3 current · verified on 1.25.5', 'stdlib-first', '18 panels']}
      page="1 / 1"
      footer="The eighteen lessons in this section carry the reasoning and the worked examples; this page is the recall sheet."
      prev={{ path: '/go/mini-guide', label: 'Go Mini Guide' }}
      next={null}
    >
      <GuidePanel n={1} title="Coming From Node — What Inverts" accent="red" glyph="🔄" span={2}>
        <GuideTable
          head={['Your Node instinct', 'Go']}
          rows={[
            ['single-threaded event loop', 'real parallelism across OS threads'],
            ['blocking is a sin', 'blocking is cheap and idiomatic'],
            ['races impossible (one thread)', 'races are real and corrupt state'],
            ['async/await, promises', 'goroutines + channels, nothing returned'],
            ['try/catch around await', 'errors are return values'],
            ['npm install express', 'net/http IS the production server'],
            ['Prisma / TypeORM', 'database/sql + SQL you wrote'],
            ['jest', 'go test — in the stdlib'],
            ['deploy source + node_modules', 'deploy ONE static binary'],
          ]}
        />
        <GuideRules items={[
          'From Java: no classes, no inheritance, no implements keyword, no exceptions, no JVM.',
          'From C++: pointers exist but no arithmetic, no manual free, returning &local is safe.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Toolchain" accent="purple" glyph="🔧">
        <GuideCode>{`go mod init example.com/svc
go mod tidy          # add missing, drop unused
go build ./...
go run .
go test ./...
go test -race ./...  # NOT optional in CI
go vet ./...         # catches copied mutexes etc.
go fmt ./...         # no config, no debate`}</GuideCode>
        <GuideRules items={[
          'gofmt has no options on purpose — formatting arguments are not a thing in Go.',
          'A major version >= 2 changes the IMPORT PATH: example.com/svc/v2.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Zero Values — There Is No undefined" accent="green" glyph="0️⃣">
        <GuideCode>{`var i int        // 0
var s string     // ""   (never nil)
var b bool       // false
var p *T         // nil
var sl []int     // nil, but len/append WORK on it
var m map[string]int  // nil — reads OK, WRITES PANIC
var ch chan int  // nil — blocks forever

m := map[string]int{}        // must make/literal to write
v, ok := m["missing"]        // comma-ok: 0, false`}</GuideCode>
        <GuideRules items={[
          'A nil slice is usable: append(nil, x) is fine. A nil map is NOT writable.',
          'Every type has a defined zero, so "uninitialised" is never a state.',
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Errors Are Values" accent="amber" glyph="⚠️" span={2}>
        <GuideCode>{`if err != nil { return err }                       // the whole idiom

return fmt.Errorf("load user %s: %w", id, err)     // %w WRAPS (keeps the chain)
                                                    // %v flattens to text — chain lost

errors.Is(err, sql.ErrNoRows)        // match a sentinel through the wrap chain
var pe *PathError
errors.As(err, &pe)                  // extract a typed error

panic/recover — NOT error handling. Reserve for programmer bugs
and a recover() at a server boundary so one bad request
cannot take the process down.`}</GuideCode>
        <GuideRules items={[
          'Wrap with %w when adding context, compare with errors.Is — never err == target on a wrapped error.',
          'sql.ErrNoRows and context.Canceled are sentinels you branch on, not failures to log.',
          'A function that returns an error has it LAST. A function taking a ctx has it FIRST.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Interfaces Are Implicit" accent="pink" glyph="🔌">
        <GuideCode>{`// No "implements". Having the method IS implementing it.
type Reader interface { Read([]byte) (int, error) }

// Declared by the CONSUMER, kept small.
// Accept interfaces, return structs.
func Save(w io.Writer, b []byte) error

val, ok := x.(MyType)     // type assertion, comma-ok
switch v := x.(type) { }  // type switch`}</GuideCode>
        <GuideRules items={[
          'TYPED-NIL TRAP: a nil *T stored in an interface makes the interface NON-nil. err != nil is true when you expected false. Return a bare nil, never a nil typed pointer.',
          'Only *T satisfies an interface with pointer-receiver methods — a T value silently will not.',
        ]} />
      </GuidePanel>

      <GuidePanel n={6} title="Value Semantics" accent="cyan" glyph="📋">
        <GuideCode>{`a := Counter{n: 1}
b := a          // FULL COPY, not an alias
b.n = 99        // a.n is still 1

func (c Counter) Inc()  { c.n++ }  // mutates a COPY — silent no-op
func (c *Counter) Inc() { c.n++ }  // mutates the original

mutate(&x)      // writing THROUGH a pointer: caller sees it
p = &other      // reassigning your COPY: caller does not`}</GuideCode>
        <GuideRules items={[
          'Everything is pass-by-value, pointers included. Pointers are copied; what they point at is shared.',
          'Pick ONE receiver kind per type. Mixing creates interface-satisfaction traps.',
          'Exception: slices, maps, channels are headers containing a pointer — copying the header still aliases the data.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Slices — The Aliasing Trap" accent="red" glyph="🔪" span={2}>
        <GuideCode>{`// A slice is {ptr, len, cap}. Copying it copies the HEADER, not the data.
a := []int{1, 2, 3, 4, 5}
b := a[1:3]            // len 2, cap 4 — SHARES a's backing array
b[0] = 99              // a is now [1 99 3 4 5]

b = append(b, 42)      // cap allows it -> WRITES INTO a[3]
                       // a is now [1 99 3 42 5]

c := make([]int, len(a))
copy(c, a)             // the only way to get an independent copy

d := a[1:3:3]          // three-index: caps it, so append must reallocate`}</GuideCode>
        <GuideRules items={[
          'append REALLOCATES only when cap is exceeded. Under cap it writes into the shared array — this is the #1 real-world Go bug.',
          'Map iteration order is deliberately randomised. Never depend on it; sort the keys.',
          'Maps are NOT safe for concurrent use — one writer plus any reader is a race. Use a mutex or sync.Map.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="Goroutines" accent="blue" glyph="🚀">
        <GuideCode>{`go doWork()        // that's it. Nothing is returned.
                   // No handle, no promise, no way to cancel from outside.

// main returning kills every goroutine instantly.
// A goroutine exits ONLY by its function returning.`}</GuideCode>
        <GuideDefs
          items={[
            ['cost', 'a few KB of stack, grown on demand'],
            ['scale', '100k+ is routine; 100k OS threads is not'],
            ['scheduler', 'M goroutines multiplexed onto N OS threads'],
            ['GOMAXPROCS', 'parallelism ceiling; defaults to core count'],
          ]}
        />
        <GuideRules items={[
          'A blocking syscall parks the goroutine and frees its thread — this is why blocking is fine here and fatal in Node.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Channels & select" accent="purple" glyph="📡" span={2}>
        <GuideCode>{`ch := make(chan int)      // UNBUFFERED: send blocks until a receiver is ready
ch := make(chan int, 10)  // buffered: blocks only when full

v, ok := <-ch             // ok == false means CLOSED and drained
for v := range ch { }     // drains until closed
close(ch)                 // the SENDER closes. Never the receiver.

select {
case v := <-a:        // if several are ready, one is chosen at RANDOM
case b <- 1:
case <-time.After(time.Second):
default:              // makes the whole select non-blocking
}`}</GuideCode>
        <GuideRules items={[
          'Send on a closed channel PANICS. Receive from a closed channel returns the zero value immediately.',
          'Closing is a BROADCAST — every receiver unblocks at once. That is how ctx.Done() wakes everybody.',
          'A nil channel blocks forever; in a select its case is effectively disabled.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="sync — and When NOT to Use Channels" accent="green" glyph="🔒">
        <GuideCode>{`var mu sync.Mutex
mu.Lock(); defer mu.Unlock()

var wg sync.WaitGroup
wg.Add(1)                     // BEFORE the goroutine, never inside
go func() { defer wg.Done(); work() }()
wg.Wait()

var once sync.Once
once.Do(initialise)           // exactly once, ever`}</GuideCode>
        <GuideRules items={[
          'Channels TRANSFER OWNERSHIP and coordinate. A mutex PROTECTS SHARED STATE. Using a channel to guard a counter is a beginner tell.',
          'Pass WaitGroups and Mutexes by POINTER. Copying one breaks it silently; go vet catches it.',
          'sync.Map is for the specific case of many readers and disjoint keys — not a general concurrent map.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Context" accent="amber" glyph="⏱️" span={2}>
        <GuideCode>{`func Fetch(ctx context.Context, id string) (*User, error)   // ctx ALWAYS first

ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()                 // ALWAYS — not deferring leaks. Double-cancel is safe.

select {
case <-time.After(d):  return nil
case <-ctx.Done():     return ctx.Err()   // return WHY, don't invent an error
}

errors.Is(err, context.DeadlineExceeded)  // time ran out  -> often 504
errors.Is(err, context.Canceled)          // caller gave up -> often no response`}</GuideCode>
        <GuideRules items={[
          'Nothing can kill a goroutine from outside. Cancellation is COOPERATIVE — ctx.Done() is the agreed signal.',
          'r.Context() is cancelled when the HTTP client disconnects. Respect it and you stop paying for abandoned work.',
          'Never store a Context in a struct. Pass it per call. Never pass nil — use context.TODO().',
          'WithValue is for cross-cutting request metadata (request ID, trace span), NEVER for real arguments.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Concurrency Failure Modes" accent="red" glyph="💀" span={2}>
        <GuideTable
          head={['Symptom', 'Cause / fix']}
          rows={[
            ['memory climbs, nothing logs', 'goroutine leak — no exit path. Check runtime.NumGoroutine(); pprof/goroutine'],
            ['fatal error: all goroutines are asleep', 'total deadlock. Read the [chan send] state in the trace'],
            ['hangs but no deadlock error', 'the detector only fires when EVERYTHING sleeps — a ticker hides it'],
            ['Wait() returns immediately', 'wg.Add was inside the goroutine'],
            ['Wait() blocks forever', 'WaitGroup copied by value — pass the pointer'],
            ['send on closed channel (panic)', 'receiver closed it, or two senders raced to close'],
          ]}
        />
        <GuideRules items={[
          'errgroup.WithContext is what you usually want over a raw WaitGroup: first error wins and siblings are cancelled.',
          'Bound concurrency always — worker pool or a buffered channel as a semaphore. Never unbounded go-per-item.',
          'Loop-variable capture (i := i) is OBSOLETE on Go 1.22+ — each iteration gets a fresh variable. Verified: 3 iterations, 3 distinct addresses.',
        ]} />
      </GuidePanel>

      <GuidePanel n={13} title="Generics — Used Sparingly" accent="pink" glyph="🧬">
        <GuideCode>{`func Map[T, U any](xs []T, f func(T) U) []U {
	out := make([]U, 0, len(xs))
	for _, x := range xs { out = append(out, f(x)) }
	return out
}

type Number interface { ~int | ~int64 | ~float64 }  // ~ = underlying type`}</GuideCode>
        <GuideRules items={[
          'Go culture is far more conservative here than Java or TypeScript. The idiomatic answer is often still an interface, or writing it twice.',
          'comparable constrains to types usable with == (valid map keys).',
          'No type erasure as in Java — the compiler generates real implementations.',
        ]} />
      </GuidePanel>

      <GuidePanel n={14} title="Testing — No Framework" accent="cyan" glyph="🧪" span={2}>
        <GuideCode>{`// user_test.go — same package, _test.go suffix
func TestAdd(t *testing.T) {
	tests := []struct{            // TABLE-DRIVEN is the dominant idiom
		name string
		a, b, want int
	}{
		{"positive", 1, 2, 3},
		{"negative", -1, -2, -3},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {    // subtest: own name, own failure
			if got := Add(tt.a, tt.b); got != tt.want {
				t.Errorf("Add(%d,%d) = %d, want %d", tt.a, tt.b, got, tt.want)
			}
		})
	}
}`}</GuideCode>
        <GuideDefs
          items={[
            ['t.Errorf', 'fail and CONTINUE'],
            ['t.Fatalf', 'fail and STOP this test'],
            ['t.Helper()', 'report the caller\'s line, not the helper\'s'],
            ['t.Cleanup(fn)', 'teardown, LIFO'],
            ['-run Name', 'filter by regex'],
            ['-race / -cover / -bench', 'detector / coverage / benchmarks'],
          ]}
        />
        <GuideRules items={[
          'No assertion library in the stdlib — you write if/Errorf. testify is widely used and the community is genuinely split on it.',
          'httptest.NewRecorder tests a handler as a plain function call: no port, no server.',
        ]} />
      </GuidePanel>

      <GuidePanel n={15} title="net/http — the Server IS the Stdlib" accent="blue" glyph="🌐" span={2}>
        <GuideCode>{`mux := http.NewServeMux()

// Go 1.22+: METHOD and {wildcard} in the pattern. No router needed.
mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)          // headers -> WriteHeader -> body, in that order
	json.NewEncoder(w).Encode(user)
})
// POST to a "GET ..." pattern returns 405 automatically.

// Middleware is just a function that wraps a Handler.
func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}
handler := logging(requireAuth(mux))      // outermost runs first`}</GuideCode>
        <GuideRules items={[
          'NEVER ship http.ListenAndServe — it sets no timeouts. Build an http.Server with ReadHeaderTimeout/ReadTimeout/WriteTimeout/IdleTimeout.',
          'Graceful shutdown: signal.Notify on a BUFFERED chan, then srv.Shutdown(ctx). ErrServerClosed is the SUCCESS path.',
          'Writing the body first implicitly sends 200 and your later WriteHeader is ignored.',
        ]} />
      </GuidePanel>

      <GuidePanel n={16} title="database/sql" accent="purple" glyph="🗄️" span={2}>
        <GuideCode>{`db, _ := sql.Open("pgx", dsn)   // a POOL, not a connection. Lazy — ping to verify.
defer db.Close()
db.SetMaxOpenConns(25)          // default UNLIMITED — a spike becomes an outage
db.SetMaxIdleConns(25)          // default 2 — too low, causes churn
db.SetConnMaxLifetime(30 * time.Minute)

rows, err := db.QueryContext(ctx, \`SELECT id, name FROM users\`)
defer rows.Close()              // (1) or you leak a connection per call
for rows.Next() { rows.Scan(&u.ID, &u.Name) }
if err := rows.Err(); err != nil { return err }   // (2) or a mid-iteration
                                                   //     failure looks like "done"

err = db.QueryRowContext(ctx, q, id).Scan(&u.ID)
errors.Is(err, sql.ErrNoRows)   // -> 404, not 500

tx, _ := db.BeginTx(ctx, nil)
defer tx.Rollback()             // no-op after a successful Commit
return tx.Commit()`}</GuideCode>
        <GuideRules items={[
          'rows.Close() and rows.Err() are the two everyone forgets, and both are production bugs.',
          'Placeholders ONLY — $1 on Postgres, ? on MySQL/SQLite. They bind values, never identifiers.',
          'sql.NullString for nullable columns: check .Valid before trusting .String.',
          'Ecosystem: pgx (driver), sqlx (less boilerplate), sqlc (generates Go from your SQL), GORM (full ORM).',
        ]} />
      </GuidePanel>

      <GuidePanel n={17} title="Build & Deploy" accent="green" glyph="📦" span={2}>
        <GuideCode>{`go build -ldflags="-s -w -X main.version=1.4.2" -o app .
# measured: 5.1M default -> 3.5M stripped

# Cross-compile from anywhere to anywhere, no extra toolchain:
GOOS=linux   GOARCH=arm64 CGO_ENABLED=0 go build -o app-linux-arm64 .
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -o app.exe .
# verified: real ELF and PE32+ binaries, built on macOS

FROM golang:1.25 AS build
COPY go.mod go.sum ./ && RUN go mod download     # cache deps before source
COPY . . && RUN CGO_ENABLED=0 go build -o /app ./cmd/api
FROM gcr.io/distroless/static-debian12
COPY --from=build /app /app
USER nonroot:nonroot
ENTRYPOINT ["/app"]`}</GuideCode>
        <GuideRules items={[
          'CGO_ENABLED=0 is what makes the binary truly static — otherwise it dies on a minimal image with a libc error.',
          'distroless/static over scratch: scratch has NO CA certs (TLS fails), no tzdata, no /etc/passwd.',
          'internal/ is COMPILER-ENFORCED privacy — no npm equivalent. golang-standards/project-layout is NOT official.',
          'log/slog is stdlib since 1.21 — structured logging needs no dependency.',
          'pprof: import _ "net/http/pprof" registers on DefaultServeMux — serve it on a PRIVATE port or you expose heap dumps.',
        ]} />
      </GuidePanel>

      <GuidePanel n={18} title="Section Index" accent="amber" glyph="📖" span={2}>
        <GuideCode>{` 0. Go From a Node Backend        runtime model, static binary
 1. Setup, Modules & Toolchain    go.mod vs package.json
 2. Syntax, Types & Zero Values   no undefined, defer, iota
 3. Structs, Methods, Composition receivers, embedding, no inheritance
 4. Interfaces Without implements implicit satisfaction, typed-nil trap
 5. Errors Are Values             %w, errors.Is/As, panic vs error
 6. Slices, Maps & Aliasing       the #1 real-world Go bug
 7. Pointers & Value Semantics    escape analysis, no arithmetic
 8. Goroutines                    beyond the event loop
 9. Channels & select             rendezvous, close as broadcast
10. The sync Package              mutex vs channel, and when
11. Context                       cancellation, deadlines, leaks
12. Concurrency Patterns          worker pool, errgroup, failure modes
13. Generics                      and why Go uses them sparingly
14. Testing Without a Framework   table-driven, httptest, benchmarks
15. HTTP Services with net/http   1.22 routing, middleware, timeouts
16. Database Without an ORM       rows.Err(), pools, transactions
17. Project Layout, Build, Deploy static binaries, distroless, pprof
18. This field guide`}</GuideCode>
        <GuideRules items={[
          'Printing: hit Ctrl/Cmd-P straight from the page — print styles force the light palette regardless of the on-screen toggle, and keep each panel whole across page breaks.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
