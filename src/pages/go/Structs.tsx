import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Structs() {
  return (
    <LessonLayout
      title="Structs, Methods & Composition"
      sectionId="go"
      lessonIndex={3}
      prev={{ path: '/go/syntax', label: 'Syntax, Types & Zero Values' }}
      next={{ path: '/go/interfaces', label: 'Interfaces Without implements' }}
    >
      <p>
        A struct is the closest thing Go has to the shape you reach for a hundred times a day in
        Node (<code>{'{ id, name, email }'}</code>) and in Java (<code>class User</code>). It is
        also the single place where the instincts from both of those languages diverge hardest from
        what the compiler actually does.
      </p>
      <p>
        The one sentence worth holding onto before any of the syntax: <strong>a struct is a value,
        not a handle to a value.</strong> In JavaScript, <code>const b = a</code> on an object gives
        you a second name for the same object. In Java, <code>User b = a</code> gives you a second
        reference to the same instance. In Go, <code>b := a</code> on a struct copies every field.
        Almost everything surprising in this lesson falls out of that one difference.
      </p>

      <h2>Declaring and Building One</h2>
      <p>
        A struct type is a named, ordered list of typed fields. There is no constructor, no{' '}
        <code>new</code> keyword you are obliged to use, no superclass, and no methods inside the
        braces — methods are declared separately, which we get to shortly.
      </p>

      <CodeBlock language="go" title="Struct literals and the zero value">
{`package main

import "fmt"

type User struct {
	ID    int
	Name  string
	Email string
	Admin bool
}

func main() {
	// No constructor needed. Declaring a struct variable gives you a fully
	// usable value with every field at its own zero value.
	var zero User
	fmt.Printf("zero value: %+v\\n", zero)

	// Keyed literal — the form to use in real code. Omitted fields are zero.
	keyed := User{Name: "Ada", Email: "ada@example.com"}
	fmt.Printf("keyed:      %+v\\n", keyed)

	// Positional literal — legal, but brittle: adding a field breaks every
	// call site, and reordering two same-typed fields breaks them SILENTLY.
	positional := User{7, "Alan", "alan@example.com", true}
	fmt.Printf("positional: %+v\\n", positional)

	// &T{...} gives you a pointer directly. This is the Go equivalent of
	// "new User(...)" and is extremely common.
	ptr := &User{Name: "Grace"}
	fmt.Printf("ptr:        %+v  (type %T)\\n", ptr, ptr)

	// There is no "->" in Go. Field access auto-dereferences.
	fmt.Println("field via pointer, no arrow needed:", ptr.Name)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`zero value: {ID:0 Name: Email: Admin:false}
keyed:      {ID:0 Name:Ada Email:ada@example.com Admin:false}
positional: {ID:7 Name:Alan Email:alan@example.com Admin:true}
ptr:        &{ID:0 Name:Grace Email: Admin:false}  (type *main.User)
field via pointer, no arrow needed: Grace`}
      </CodeBlock>

      <InfoBox variant="tip" title="%+v is the one format verb to memorise">
        <p>
          <code>%v</code> prints values, <code>%+v</code> adds field names, and{' '}
          <code>%#v</code> prints Go syntax you could paste back into source. For a Node developer
          this is your <code>console.log(obj)</code> replacement — <code>fmt.Println(u)</code> on a
          struct prints <code>{'{0 Ada ... }'}</code> with no labels, which is almost never what you
          want while debugging. <code>%T</code> prints the dynamic type, which earns its keep in the{' '}
          <a href="/go/interfaces">interfaces lesson</a>.
        </p>
      </InfoBox>

      <h3>What a Java developer should notice is missing</h3>
      <ul>
        <li>
          <strong>No access modifiers.</strong> Visibility is decided by the <em>case of the
          identifier</em>: <code>Name</code> is exported from the package, <code>name</code> is not.
          That applies to fields, methods, types, and functions uniformly. There is no{' '}
          <code>protected</code>, and the unit of encapsulation is the package, not the type — code
          in the same package can read your lowercase fields.
        </li>
        <li>
          <strong>No constructors.</strong> If a type needs validation or non-zero defaults, you
          write an ordinary function, conventionally <code>NewXxx</code>, returning the value (or a
          pointer) and possibly an error. Nothing forces callers through it unless you make the
          struct&apos;s fields unexported.
        </li>
        <li>
          <strong>No <code>equals</code>/<code>hashCode</code>.</strong> The compiler generates
          structural equality for you, with rules covered below.
        </li>
        <li>
          <strong>No inheritance.</strong> That is the big one, and it gets its own section.
        </li>
      </ul>

      <h2>Field Tags: Why This Matters in Hour One</h2>
      <p>
        A field tag is a string literal after the field type. The compiler stores it and otherwise
        ignores it; libraries read it with reflection. For a backend developer this is not a
        curiosity — it is how your Go struct becomes the JSON contract your Node service was
        previously producing by hand.
      </p>

      <CodeBlock language="go" title="JSON tags, exported fields, and the four things that bite">
{`package main

import (
	"encoding/json"
	"fmt"
)

type Account struct {
	ID        int     \`json:"id"\`
	Email     string  \`json:"email"\`
	Nickname  string  \`json:"nickname,omitempty"\` // dropped when zero
	Balance   float64 \`json:"balance,string"\`     // encoded as a JSON string
	password  string                              // unexported: invisible to encoding/json
	Internal  string  \`json:"-"\`                  // explicitly skipped
	CreatedAt string  \`json:"created_at"\`
}

func main() {
	a := Account{ID: 1, Email: "ada@example.com", Balance: 42.5,
		password: "hunter2", Internal: "secret", CreatedAt: "2026-01-02"}

	out, _ := json.Marshal(a)
	fmt.Println("marshal: ", string(out))

	// Decoding into a struct needs a POINTER — json.Unmarshal has to write
	// into your value, and Go passes everything by value.
	var b Account
	in := []byte(\`{"ID":9,"EMAIL":"alan@example.com","balance":"7.25",
	               "created_at":"2026-03-04","nickname":"al","Internal":"ignored"}\`)
	if err := json.Unmarshal(in, &b); err != nil {
		fmt.Println("err:", err)
	}
	fmt.Printf("unmarshal: %+v\\n", b)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`marshal:  {"id":1,"email":"ada@example.com","balance":"42.5","created_at":"2026-01-02"}
unmarshal: {ID:9 Email:alan@example.com Nickname:al Balance:7.25 password: Internal: CreatedAt:2026-03-04}`}
      </CodeBlock>

      <p>Four things in that output are worth reading carefully:</p>
      <ol>
        <li>
          <code>password</code> and <code>Internal</code> are both absent from the JSON, for
          different reasons. <code>password</code> is <strong>unexported</strong>, so{' '}
          <code>encoding/json</code> cannot see it at all — no tag will change that.{' '}
          <code>Internal</code> is exported but tagged <code>&quot;-&quot;</code>. The practical
          lesson: lowercasing a field is the strongest way to keep it out of your API surface, and
          it also keeps it out of your decoded input — note <code>Internal</code> stayed empty even
          though the JSON supplied it.
        </li>
        <li>
          <code>Nickname</code> is missing from the marshalled output because{' '}
          <code>omitempty</code> drops zero values. This is the Go analogue of the{' '}
          <code>JSON.stringify</code> behaviour where <code>undefined</code> properties vanish —
          except Go cannot tell &quot;absent&quot; from &quot;explicitly empty string&quot;. If that
          distinction matters in your API, you need <code>*string</code> (nil vs pointer-to-empty)
          and the <a href="/go/pointers">pointers lesson</a> explains the cost.
        </li>
        <li>
          <code>Balance</code> round-trips through a JSON <em>string</em>{' '}
          (<code>&quot;42.5&quot;</code>) because of the <code>,string</code> option. You will meet
          this when talking to APIs that send money as strings to dodge float issues.
        </li>
        <li>
          Decoding matched <code>&quot;ID&quot;</code> and <code>&quot;EMAIL&quot;</code> to the
          right fields even though the tags say <code>id</code> and <code>email</code>. Go&apos;s
          field matching is <strong>case-insensitive as a fallback</strong>. Convenient, and
          occasionally the reason two different keys fight over one field.
        </li>
      </ol>

      <InfoBox variant="warning" title="Tags are strings, and typos in them are silent">
        <p>
          <code>{'`json:"user_id"`'}</code> works. <code>{'`json: "user_id"`'}</code> — with a space
          after the colon — does not; the tag no longer parses as a <code>json</code> key and your
          field silently serialises as <code>UserID</code>. Nothing in the compiler complains.{' '}
          <code>go vet</code> does catch this one: its <code>structtag</code> check runs by default
          and reports malformed tags, which is a good reason to wire <code>go vet ./...</code> into
          your build before you have written much.
        </p>
      </InfoBox>

      <h2>Methods, and the Receiver Decision</h2>
      <p>
        A method is a function with a <strong>receiver</strong> declared before its name. It lives
        at package level, next to the type, not inside it. There is no implicit{' '}
        <code>this</code> — you name the receiver yourself, and by convention it is a one- or
        two-letter abbreviation of the type, not <code>self</code> or <code>this</code>.
      </p>
      <p>
        The receiver can be a value (<code>func (c Counter)</code>) or a pointer{' '}
        (<code>func (c *Counter)</code>). That choice is the first real decision Go asks you to make
        that neither Node nor Java ever asked, and getting it wrong produces a bug that compiles,
        passes <code>go vet</code>, and does nothing:
      </p>

      <CodeBlock language="go" title="The value-receiver bug every Go developer writes once">
{`package main

import "fmt"

type Counter struct {
	n int
}

// Value receiver: c is a COPY of the Counter the caller had.
// Incrementing c.n increments the copy, which is discarded on return.
func (c Counter) IncBroken() {
	c.n++
}

// Pointer receiver: c is the address of the caller's Counter.
func (c *Counter) Inc() {
	c.n++
}

// Implementing String() makes fmt use it automatically — this is Go's
// toString(), satisfied implicitly. More on why in the interfaces lesson.
func (c Counter) String() string {
	return fmt.Sprintf("Counter(%d)", c.n)
}

func main() {
	c := Counter{}
	for i := 0; i < 3; i++ {
		c.IncBroken()
	}
	fmt.Println("after 3x IncBroken:", c)

	for i := 0; i < 3; i++ {
		c.Inc() // the compiler rewrites this as (&c).Inc()
	}
	fmt.Println("after 3x Inc:      ", c)

	p := &Counter{}
	p.Inc()
	fmt.Println("through pointer:   ", *p)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64 (go vet reports nothing)">
{`after 3x IncBroken: Counter(0)
after 3x Inc:       Counter(3)
through pointer:    Counter(1)`}
      </CodeBlock>

      <p>
        Three increments, zero effect, no diagnostic. If you are coming from Node this is genuinely
        new: there is no JavaScript expression that looks like a mutation and isn&apos;t. If you are
        coming from Java, note that this is <em>not</em> the familiar &quot;Java is pass-by-value of
        references&quot; situation — there is no reference here at all. The whole struct was copied
        onto the stack for the duration of the call.
      </p>

      <h3>Notice what the compiler did for you</h3>
      <p>
        <code>c.Inc()</code> worked on a <code>Counter</code>, not a <code>*Counter</code>. Go
        inserts the <code>&amp;</code> automatically when the receiver is{' '}
        <strong>addressable</strong>, and inserts the <code>*</code> automatically in the other
        direction. That is why you rarely see explicit <code>(&amp;c).Inc()</code> in real Go, and
        also why the value-receiver bug is so easy to write: the two call sites look identical.
      </p>
      <p>
        The sugar runs out when the value has no address. Map elements and literals are the two
        cases you will actually hit:
      </p>

      <CodeBlock language="go" title="Where the automatic &amp; stops working">
{`counters := map[string]Counter{"a": {}}
counters["a"].Inc()   // line 9

Counter{}.Inc()       // line 11`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5 darwin/arm64">
{`./main.go:9:16: cannot call pointer method Inc on Counter
./main.go:11:12: cannot call pointer method Inc on Counter`}
      </CodeBlock>

      <p>
        A map element is not addressable because the map may move its storage when it grows, so{' '}
        <code>&amp;counters[&quot;a&quot;]</code> would be a pointer with no guaranteed lifetime.
        The usual fix is to store <code>map[string]*Counter</code>, or to read the value out, modify
        it, and write it back.
      </p>

      <FlowChart
        title="Pointer or value receiver — the decision in practice"
        chart={"graph TD\nA[\"New method on type T\"] --> B{\"Does it need to mutate the receiver?\"}\nB -->|Yes| P[\"Pointer receiver — func (t *T)\"]\nB -->|No| C{\"Does T contain a sync.Mutex, or is it large?\"}\nC -->|Yes| P\nC -->|No| D{\"Do T's other methods use a pointer receiver?\"}\nD -->|Yes| P\nD -->|No| V[\"Value receiver — func (t T)\"]\nstyle P fill:#1a2744,stroke:#5b9cf6\nstyle V fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        The last branch — consistency — is the one people skip and then regret. Mixing receiver
        kinds on one type means the <em>method set</em> of <code>T</code> differs from that of{' '}
        <code>*T</code>, which changes which of them satisfies an interface. That is a real trap and
        the <a href="/go/interfaces">interfaces lesson</a> shows it biting. Pick one per type and
        stay with it; if any method needs a pointer, make them all pointers.
      </p>

      <InfoBox variant="note" title="Don't reach for &quot;value receivers are faster&quot;">
        <p>
          The copy is real, but so is the pointer indirection, and a pointer receiver can force the
          value onto the heap. Which wins depends on size and on escape analysis, which the{' '}
          <a href="/go/pointers">pointers lesson</a> measures directly. Decide on{' '}
          <strong>semantics</strong> — does this method need to mutate? — and treat performance as a
          thing you measure later, if ever. The one hard rule: a type containing a{' '}
          <code>sync.Mutex</code> must use pointer receivers, because copying a mutex copies its
          lock state and gives you two independent locks protecting the same data.
        </p>
      </InfoBox>

      <h2>No Inheritance. Embedding Instead.</h2>
      <p>
        Go has no <code>extends</code>, no abstract classes, no <code>super</code>, and no virtual
        methods. What it has is <strong>embedding</strong>: declare a field with a type and no name,
        and that type&apos;s fields and methods are <em>promoted</em> to the outer type.
      </p>
      <p>
        For a Java developer this covers an enormous share of what you used{' '}
        <code>extends</code> for — reusing a base class&apos;s stored state and its helper methods
        without rewriting delegation by hand. What it specifically does <strong>not</strong> give
        you is polymorphic dispatch back into the subclass, and that is worth seeing rather than
        being told:
      </p>

      <CodeBlock language="go" title="Embedding, promotion, and the thing that is not inheritance">
{`package main

import "fmt"

type Animal struct {
	Name string
}

func (a Animal) Speak() string { return "..." }

func (a Animal) Describe() string {
	return a.Name + " says " + a.Speak()
}

type Dog struct {
	Animal // embedded: a field whose name IS its type name
	Breed  string
}

// Looks like an override. Is not an override.
func (d Dog) Speak() string { return "Woof" }

func main() {
	d := Dog{Animal: Animal{Name: "Rex"}, Breed: "corgi"}

	fmt.Println("d.Name            =", d.Name)        // promoted field
	fmt.Println("d.Animal.Name     =", d.Animal.Name) // the real path
	fmt.Println("d.Speak()         =", d.Speak())     // Dog's method shadows Animal's
	fmt.Println("d.Animal.Speak()  =", d.Animal.Speak())
	fmt.Println("d.Describe()      =", d.Describe()) // <-- read this one twice
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`d.Name            = Rex
d.Animal.Name     = Rex
d.Speak()         = Woof
d.Animal.Speak()  = ...
d.Describe()      = Rex says ...`}
      </CodeBlock>

      <p>
        In Java, <code>d.describe()</code> on that hierarchy prints <code>Rex says Woof</code>:{' '}
        <code>speak()</code> is virtual, so the call inside the base method dispatches to the
        subclass override. In Go it prints <code>Rex says ...</code> — the embedded{' '}
        <code>Animal</code> has no idea it is embedded in anything.
      </p>

      <FlowChart
        title="Why d.Describe() cannot reach Dog.Speak"
        chart={"graph TD\nCall[\"d.Describe() where d is a Dog\"] --> Q1{\"Does Dog declare Describe?\"}\nQ1 -->|No| Q2[\"Promote from the embedded Animal field\"]\nQ2 --> Rewrite[\"Compiler rewrites it as d.Animal.Describe()\"]\nRewrite --> Inside[\"Inside Animal.Describe the receiver is an Animal\"]\nInside --> NoBack[\"An Animal holds no reference back to the Dog that embeds it\"]\nNoBack --> Dispatch[\"so a.Speak() resolves to Animal.Speak, never Dog.Speak\"]\nDispatch --> Out[\"Result: Rex says ...\"]\nstyle NoBack fill:#3b1a1a,stroke:#f87171\nstyle Dispatch fill:#3b1a1a,stroke:#f87171"}
      />

      <p>
        Embedding is <strong>syntactic sugar over a named field</strong>, nothing more. Everything
        the compiler does here is a rewrite from <code>d.X</code> to <code>d.Animal.X</code> at
        compile time. There is no vtable, no dynamic lookup, and no way for the inner type to
        participate in the outer type&apos;s identity.
      </p>

      <InfoBox variant="danger" title="The template-method pattern does not port">
        <p>
          If your Java design has an abstract base class that implements an algorithm and calls
          abstract hooks the subclass fills in, a straight translation to embedding will compile and
          silently call the base&apos;s own hooks forever. The Go answer is to{' '}
          <strong>pass the behaviour in</strong> rather than inherit it: make the hook a field of
          interface or function type that the constructor supplies. In other words, the Go
          replacement for the template method pattern is dependency injection, not embedding.
        </p>
      </InfoBox>

      <p>So what <em>is</em> embedding genuinely good for? Three things, in order of how often you will use them:</p>
      <ul>
        <li>
          <strong>Mixing in ready-made behaviour</strong> from the standard library. Embedding{' '}
          <code>sync.Mutex</code> promotes <code>Lock</code>/<code>Unlock</code> onto your type;
          embedding <code>*log.Logger</code> promotes <code>Printf</code>. The composed type is
          usable with no wiring.
        </li>
        <li>
          <strong>Sharing stored state across several concrete types</strong> — the common fields of
          a set of handlers or repositories, written once.
        </li>
        <li>
          <strong>Satisfying a large interface by delegating most of it.</strong> Embed an existing
          implementation, override the one method you care about, and the rest is promoted. The{' '}
          <a href="/go/interfaces">interfaces lesson</a> returns to this with{' '}
          <code>io.ReadWriter</code>.
        </li>
      </ul>

      <CodeBlock language="go" title="Embedding sync.Mutex — the idiom you will actually write">
{`package main

import (
	"fmt"
	"sync"
)

type SafeCache struct {
	sync.Mutex // promotes Lock() and Unlock() onto *SafeCache
	entries    map[string]string
}

// Pointer receiver is mandatory here: copying a SafeCache copies the mutex.
func (c *SafeCache) Put(k, v string) {
	c.Lock()
	defer c.Unlock()
	if c.entries == nil {
		c.entries = map[string]string{}
	}
	c.entries[k] = v
}

func main() {
	var c SafeCache // zero value is a ready-to-use unlocked mutex
	c.Put("k", "v")
	fmt.Println("SafeCache:", c.entries)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`SafeCache: map[k:v]`}
      </CodeBlock>

      <InfoBox variant="tip" title="Embed or name the field?">
        <p>
          Embedding <code>sync.Mutex</code> promotes <code>Lock</code> and <code>Unlock</code> into
          your type&apos;s <em>public</em> API — anyone holding a <code>*SafeCache</code> can lock
          it. Often you want the opposite, and a named field <code>mu sync.Mutex</code> keeps the
          lock private. Use embedding when the promoted methods are genuinely part of the contract
          you are offering; use a named field otherwise. The standard library does both, and{' '}
          <code>mu sync.Mutex</code> is the more common choice in application code. The{' '}
          <a href="/go/sync">sync lesson</a> goes further into this.
        </p>
      </InfoBox>

      <h2>Comparability</h2>
      <p>
        Go generates structural equality for structs. No <code>equals</code> to override, no{' '}
        <code>hashCode</code> to keep in sync, and — unlike JavaScript, where{' '}
        <code>{'{a:1} === {a:1}'}</code> is <code>false</code> and comparing objects means reaching
        for lodash or <code>JSON.stringify</code> — <code>==</code> compares field by field.
      </p>
      <p>
        The catch is that this only works if <em>every</em> field is itself comparable. Slices,
        maps, and functions are not, and a struct containing one of them is not comparable at all —
        which is a <strong>compile error</strong>, not a runtime surprise:
      </p>

      <CodeBlock language="go" title="Comparable structs, and structs as map keys">
{`package main

import (
	"fmt"
	"reflect"
)

type Point struct{ X, Y int }

type Config struct {
	Name  string
	Hosts []string // a slice field makes Config non-comparable
}

func main() {
	fmt.Println("Point{1,2} == Point{1,2}:", Point{1, 2} == Point{1, 2})

	// Comparable structs work as map keys with nothing to implement.
	grid := map[Point]string{{0, 0}: "origin", {1, 2}: "treasure"}
	fmt.Println("grid[Point{1,2}]:", grid[Point{1, 2}])

	// For the non-comparable case, reflect.DeepEqual is the stdlib fallback.
	a := Config{Name: "x", Hosts: []string{"h"}}
	b := Config{Name: "x", Hosts: []string{"h"}}
	fmt.Println("reflect.DeepEqual:", reflect.DeepEqual(a, b))
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`Point{1,2} == Point{1,2}: true
grid[Point{1,2}]: treasure
reflect.DeepEqual: true`}
      </CodeBlock>

      <CodeBlock language="go" title="And what happens if you try == on the slice-bearing one">
{`a := Config{Name: "x"}
b := Config{Name: "x"}
fmt.Println(a == b)         // line 13

m := map[Config]bool{}      // line 15`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go build, go1.25.5 darwin/arm64">
{`./main.go:13:14: invalid operation: a == b (struct containing []string cannot be compared)
./main.go:15:11: invalid map key type Config`}
      </CodeBlock>

      <InfoBox variant="note" title="reflect.DeepEqual is for tests, not hot paths">
        <p>
          It is reflection-based and slow, it treats a nil slice and an empty slice as{' '}
          <em>different</em> (the <a href="/go/slices">slices lesson</a> covers why that distinction
          exists), and it will happily recurse into fields you did not mean to compare. In tests the
          community default is <code>google/go-cmp</code>, which gives readable diffs and lets you
          ignore fields. For production equality, write an explicit{' '}
          <code>func (c Config) Equal(other Config) bool</code>.
        </p>
      </InfoBox>

      <h2>Copying: the Part That Is Only Half Deep</h2>
      <p>
        Struct assignment copies all fields. But a field that is itself a slice, map, pointer, or
        channel holds a small header or address, and <em>that</em> is what gets copied — not the
        data behind it. So a struct copy is deep in its value fields and shallow in its reference-y
        ones, in the same operation:
      </p>

      <CodeBlock language="go" title="One copy, two different behaviours">
{`package main

import "fmt"

type Config struct {
	Name  string
	Hosts []string
}

type User struct {
	Name  string
	Admin bool
}

func main() {
	c1 := Config{Name: "prod", Hosts: []string{"a.example.com"}}
	c2 := c1 // full struct copy

	c2.Name = "staging"      // independent: Name is a value field
	c2.Hosts[0] = "MUTATED"  // shared: both headers point at one array

	fmt.Printf("c1: %+v\\n", c1)
	fmt.Printf("c2: %+v\\n", c2)

	// The same copy rule applies to range, which hands you a copy per element.
	users := []User{{Name: "ada"}, {Name: "alan"}}
	for _, u := range users {
		u.Admin = true // writes to the loop copy, then throws it away
	}
	fmt.Printf("after range-by-value: %+v\\n", users)

	for i := range users {
		users[i].Admin = true // index back into the slice to reach the real element
	}
	fmt.Printf("after range-by-index: %+v\\n", users)
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`c1: {Name:prod Hosts:[MUTATED]}
c2: {Name:staging Hosts:[MUTATED]}
after range-by-value: [{Name:ada Admin:false} {Name:alan Admin:false}]
after range-by-index: [{Name:ada Admin:true} {Name:alan Admin:true}]`}
      </CodeBlock>

      <p>
        The <code>range</code> half of that output is the same bug as{' '}
        <code>IncBroken</code> wearing a different hat, and it is one of the most common mistakes in
        real Go code. If you are iterating to <em>modify</em>, iterate by index. If you are
        iterating to <em>read</em>, range-by-value is fine and reads better.
      </p>
      <p>
        The <code>Hosts</code> half is the aliasing problem, and it is big enough to have its own
        lesson: <a href="/go/slices">Slices, Maps &amp; the Aliasing Trap</a>. For now, just
        register the rule — <strong>copying a struct never deep-copies a slice or a map field.</strong>
      </p>

      <InfoBox variant="info" title="For the C++ reader: no copy constructors, no operator overloading">
        <p>
          Go struct copies are always a memory copy of the fields. There is no copy constructor, no
          assignment operator, no move semantics, and no RAII destructor — the only resource-release
          mechanism is <code>defer</code>, which you call explicitly. The flip side is that there is
          nothing hidden: <code>b := a</code> cannot run arbitrary user code, so it cannot fail,
          allocate unexpectedly, or throw.
        </p>
      </InfoBox>

      <h3>Field order affects size</h3>
      <p>
        Worth a single paragraph because the C++ reader will ask. Go lays fields out in declaration
        order and inserts alignment padding, so reordering fields changes{' '}
        <code>unsafe.Sizeof</code>:
      </p>

      <CodeBlock language="go" title="Same four fields, two orderings">
{`type Padded struct {
	A bool
	B int64
	C bool
	D int64
}

type Packed struct {
	B int64
	D int64
	A bool
	C bool
}

fmt.Println("sizeof Padded:", unsafe.Sizeof(Padded{}))
fmt.Println("sizeof Packed:", unsafe.Sizeof(Packed{}))`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — go run, go1.25.5 darwin/arm64">
{`sizeof Padded: 32
sizeof Packed: 24`}
      </CodeBlock>

      <p>
        A third of the struct was padding. This matters when you have millions of them and nowhere
        else, so the honest advice is: order fields for readability, and only group by descending
        size if a profiler has pointed you here. Note the numbers above are for{' '}
        <code>darwin/arm64</code>; alignment rules are platform-dependent, so do not hard-code them
        into your mental model of a type.
      </p>

      <h2>Putting It Together</h2>
      <p>
        A small, idiomatic type — unexported fields, a constructor that validates, a mix of
        read-only and mutating methods with consistent receivers, and JSON tags for the wire format:
      </p>

      <CodeBlock language="go" title="account.go — the shape most of your Go types will take">
{`package account

import (
	"errors"
	"fmt"
)

// Fields are unexported, so callers in other packages must use New and
// the accessors. That is how you get encapsulation without "private".
type Account struct {
	id      string
	balance int64 // minor units; never float for money
}

type accountJSON struct {
	ID      string \`json:"id"\`
	Balance int64  \`json:"balance"\`
}

var ErrInsufficientFunds = errors.New("account: insufficient funds")

// New is the convention, not a language feature. Return a pointer when the
// type has mutating methods, so callers cannot accidentally hold a copy.
func New(id string, opening int64) (*Account, error) {
	if id == "" {
		return nil, errors.New("account: id required")
	}
	if opening < 0 {
		return nil, fmt.Errorf("account: negative opening balance %d", opening)
	}
	return &Account{id: id, balance: opening}, nil
}

// Mutating: pointer receiver, no question.
func (a *Account) Withdraw(amount int64) error {
	if amount > a.balance {
		return ErrInsufficientFunds
	}
	a.balance -= amount
	return nil
}

// Read-only, but still a pointer receiver — consistency within the type.
func (a *Account) Balance() int64 { return a.balance }

func (a *Account) String() string {
	return fmt.Sprintf("Account(%s, %d)", a.id, a.balance)
}`}
      </CodeBlock>

      <InfoBox variant="success" title="Carry these five forward">
        <ul>
          <li>
            A struct is a <strong>value</strong>. <code>b := a</code> copies it; passing it to a
            function copies it.
          </li>
          <li>
            Mutating methods need a <strong>pointer receiver</strong>, and the failure mode of
            getting that wrong is silence, not a compile error. Keep receivers consistent across a
            type.
          </li>
          <li>
            Visibility is <strong>capitalisation</strong>, scoped to the package. Unexported fields
            are invisible to <code>encoding/json</code> too.
          </li>
          <li>
            <strong>Embedding is promotion, not inheritance.</strong> A base method can never
            dispatch back into the type that embeds it. Inject behaviour instead.
          </li>
          <li>
            <code>==</code> works structurally and only on fully comparable structs; a slice or map
            field makes the type non-comparable at compile time.
          </li>
        </ul>
      </InfoBox>

      <p>
        Next: the other half of Go&apos;s answer to object orientation. Structs hold data;{' '}
        <a href="/go/interfaces">interfaces</a> describe behaviour — and they are satisfied without
        anyone writing <code>implements</code>.
      </p>
    </LessonLayout>
  );
}

export default Structs;
