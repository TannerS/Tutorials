import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';

export default function Http() {
  return (
    <LessonLayout
      title="HTTP Services with net/http"
      sectionId="go"
      lessonIndex={16}
      prev={{ path: '/go/testing', label: 'Testing Without a Framework' }}
      next={{ path: '/go/database', label: 'Database Access Without an ORM' }}
    >
      <p>
        In Node, the first line of any service is <code>npm install express</code>. The built-in{' '}
        <code>http</code> module is technically a server, but nobody ships on it — it has no
        router, no middleware story, and no ergonomics.
      </p>

      <p>
        Go's standard library is not that. <code>net/http</code> is the production server: it is
        what the Go team runs, it has a competent router, middleware is a language feature rather
        than a framework feature, and as of Go 1.22 it handles method-based and parameterised
        routing natively. <strong>Most Go services need no HTTP framework at all</strong>, and
        that is the single biggest structural difference from a Node backend.
      </p>

      <h2>The Entire Server Interface</h2>

      <CodeBlock language="go" title="This is the whole abstraction">
{`type Handler interface {
	ServeHTTP(w http.ResponseWriter, r *http.Request)
}`}
      </CodeBlock>

      <p>
        One method. Everything in Go's HTTP world — routers, middleware, the server itself,
        every third-party library you might add — is built on satisfying that interface. Because
        satisfaction is <a href="/go/interfaces">implicit</a>, any type with that method is a
        handler, and no registration or inheritance is involved.
      </p>

      <p>
        <code>http.HandlerFunc</code> is the adapter that makes a plain function satisfy it, which
        is why handlers usually look like functions rather than types:
      </p>

      <CodeBlock language="go" title="A handler, and what HandlerFunc actually is">
{`func hello(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "hello")
}

// HandlerFunc is literally this — a function type with a ServeHTTP method
// that calls itself. That is the whole trick.
//
//   type HandlerFunc func(ResponseWriter, *Request)
//   func (f HandlerFunc) ServeHTTP(w ResponseWriter, r *Request) { f(w, r) }`}
      </CodeBlock>

      <h2>Routing: What Go 1.22 Changed</h2>

      <p>
        This is the part where older advice will mislead you. For years the correct answer was
        "the standard <code>ServeMux</code> cannot match methods or path parameters, so use chi
        or gorilla/mux." <strong>Go 1.22 fixed both.</strong> Patterns can now carry an HTTP
        method and named wildcards:
      </p>

      <CodeBlock language="go" title="Standard library routing, Go 1.22+">
{`mux := http.NewServeMux()

mux.HandleFunc("GET /users/{id}", func(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")                      // named wildcard
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(User{ID: id, Name: "Ada"})
})

mux.HandleFunc("POST /users", func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	fmt.Fprint(w, \`{"created":true}\`)
})`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — run against a live httptest server">
{`GET /users/42  -> 200 {"id":"42","name":"Ada"}
POST /users    -> 201 {"created":true}
POST /users/42 -> 405 (method not allowed)`}
      </CodeBlock>

      <p>
        Note the third line: because the pattern declared <code>GET</code>, a <code>POST</code>{' '}
        to the same path returns <strong>405 Method Not Allowed</strong> automatically. You did
        not write that. In Express you would be writing it yourself, or installing something that
        does.
      </p>

      <InfoBox variant="tip" title="Pattern syntax worth knowing">
        <code>{'"GET /users/{id}"'}</code> matches one segment and exposes it via{' '}
        <code>r.PathValue("id")</code>. <code>{'"GET /files/{path...}"'}</code> matches the rest
        of the path, trailing segments included. <code>{'"GET /exact/{$}"'}</code> anchors the
        match so it will not also catch sub-paths. Precedence is by specificity, not registration
        order — the most specific pattern wins, so you do not have to think about the order your
        routes are declared in, unlike Express.
      </InfoBox>

      <InfoBox variant="note" title="When a third-party router still earns its place">
        Honest answer: less often than it used to, but not never. Reach for <code>chi</code> when
        you want route <em>groups</em> with per-group middleware stacks, regex constraints on
        parameters, or you are already deep in an ecosystem built around it. What changed is the
        default — starting a new service on <code>net/http</code> is now a reasonable decision
        rather than an austere one, and you can add a router later without rewriting your
        handlers, because they are all just <code>http.Handler</code>.
      </InfoBox>

      <h2>Middleware Is Just a Function That Wraps a Handler</h2>

      <p>
        Express middleware is a framework concept with a <code>next()</code> callback and an
        ordering contract. Go middleware is a function that takes a handler and returns a
        handler. There is no framework involved, and no API to learn:
      </p>

      <CodeBlock language="go" title="The entire middleware pattern">
{`func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)                          // "call next()"
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}

func requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return                                     // don't call next — chain stops
		}
		next.ServeHTTP(w, r)
	})
}

// Composition is just nesting. Outermost runs first.
handler := logging(requireAuth(mux))`}
      </CodeBlock>

      <FlowChart
        title="A Request Through the Wrapped Chain"
        chart={
          'graph LR\n' +
          '  REQ["request"] --> L1["logging<br/>start timer"]\n' +
          '  L1 --> A1["requireAuth<br/>check header"]\n' +
          '  A1 -->|"ok"| MUX["mux → handler"]\n' +
          '  A1 -.->|"missing → 401, chain stops"| OUT2["response"]\n' +
          '  MUX --> A2["unwinds back out"]\n' +
          '  A2 --> L2["logging<br/>log duration"]\n' +
          '  L2 --> OUT["response"]\n' +
          '  style MUX fill:#1a3329,stroke:#4ade80\n' +
          '  style OUT2 fill:#3b1a1a,stroke:#f87171'
        }
      />

      <p>
        The code after <code>next.ServeHTTP</code> runs on the way back out, which is how the
        logging middleware times the request. Returning early without calling{' '}
        <code>next</code> short-circuits the chain — that is the equivalent of not calling{' '}
        <code>next()</code> in Express, except the control flow is ordinary Go rather than a
        framework convention.
      </p>

      <h2>JSON In and Out</h2>

      <CodeBlock language="go" title="Decode, validate, encode">
{`type CreateUserRequest struct {
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

func createUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()        // reject typos instead of ignoring them
	if err := dec.Decode(&req); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	if req.Name == "" {                // no validation framework in the stdlib
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)  // WriteHeader AFTER headers, BEFORE body
	json.NewEncoder(w).Encode(User{ID: "1", Name: req.Name})
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="Ordering on ResponseWriter is strict and unenforced">
        Set headers, then call <code>WriteHeader</code>, then write the body — in that order.
        Writing the body first implicitly sends <code>200</code>, and any later{' '}
        <code>WriteHeader</code> is ignored with a{' '}
        <code>superfluous response.WriteHeader call</code> logged. Nothing stops you at compile
        time, so the bug surfaces as a handler that returns 200 with an error payload.
      </InfoBox>

      <h2>Timeouts: The Production Hazard</h2>

      <p>
        <code>http.ListenAndServe</code> is what every tutorial shows and it sets{' '}
        <strong>no timeouts at all</strong>. A slow or malicious client can hold a connection
        open indefinitely, and enough of them exhaust your file descriptors. This is the most
        common way a Go service that "worked fine locally" falls over in production.
      </p>

      <CodeBlock language="go" title="Always construct the Server explicitly">
{`srv := &http.Server{
	Addr:              ":8080",
	Handler:           handler,
	ReadHeaderTimeout: 5 * time.Second,    // Slowloris defence
	ReadTimeout:       15 * time.Second,   // entire request
	WriteTimeout:      15 * time.Second,   // entire response
	IdleTimeout:       60 * time.Second,   // keep-alive reuse
	MaxHeaderBytes:    1 << 20,
}`}
      </CodeBlock>

      <h2>Graceful Shutdown</h2>

      <p>
        On SIGTERM — which is what your orchestrator sends before killing the pod — you want to
        stop accepting connections, let in-flight requests finish, and then exit:
      </p>

      <CodeBlock language="go" title="The standard shutdown dance">
{`go func() {
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("listen: %v", err)   // ErrServerClosed is the NORMAL path
	}
}()

stop := make(chan os.Signal, 1)        // buffered — signal.Notify never blocks
signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
<-stop

ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
defer cancel()
if err := srv.Shutdown(ctx); err != nil {
	log.Printf("forced shutdown: %v", err)   // deadline hit; some requests cut off
}`}
      </CodeBlock>

      <p>
        <code>Shutdown</code> respects the context from{' '}
        <a href="/go/context">the context lesson</a> — it waits for active requests, but only
        until the deadline. Two details catch people: <code>ListenAndServe</code> returns{' '}
        <code>http.ErrServerClosed</code> on a clean shutdown, so treating every non-nil error as
        fatal will log a false alarm every deploy; and the signal channel must be buffered,
        because <code>signal.Notify</code> does a non-blocking send and drops the signal if
        nobody is ready.
      </p>

      <h2>Testing Handlers Needs No Server</h2>

      <p>
        <code>httptest.NewRecorder()</code> satisfies <code>ResponseWriter</code>, so you can
        call a handler directly — no port, no network, no lifecycle:
      </p>

      <CodeBlock language="go" title="Fast handler tests">
{`func TestCreateUser(t *testing.T) {
	body := strings.NewReader(\`{"name":"Ada","email":"ada@example.com"}\`)
	req := httptest.NewRequest("POST", "/users", body)
	rec := httptest.NewRecorder()

	createUser(rec, req)                 // just a function call

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusCreated)
	}
}`}
      </CodeBlock>

      <p>
        For integration-level tests, <code>httptest.NewServer</code> gives you a real server on a
        real ephemeral port — that is what produced the verified output earlier in this lesson.
        See <a href="/go/testing">Testing Without a Framework</a> for the surrounding conventions.
      </p>

      <h2>Key Takeaways</h2>

      <p>
        <strong><code>net/http</code> is the production server</strong>, not a toy — the Express
        reflex to install a framework first does not transfer.{' '}
        <strong>Go 1.22 gave <code>ServeMux</code> method and wildcard routing</strong>, with
        automatic 405s and specificity-based precedence, which invalidates most pre-2024 advice
        about needing a third-party router. <strong>Middleware is handler wrapping</strong> —
        plain functions, no framework contract. <strong>Never ship{' '}
        <code>ListenAndServe</code> without timeouts</strong>; construct the{' '}
        <code>http.Server</code> explicitly. <strong>Handle SIGTERM with{' '}
        <code>srv.Shutdown(ctx)</code></strong> and expect <code>ErrServerClosed</code> as the
        success case. And <strong>test handlers with <code>httptest.NewRecorder</code></strong> —
        they are ordinary functions, so testing them needs no server at all.
      </p>
    </LessonLayout>
  );
}
