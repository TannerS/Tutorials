import PosterLayout from '../../components/PosterLayout';
import PosterCard from '../../components/PosterCard';
import PosterQuickRef from '../../components/PosterQuickRef';

export default function FieldGuideReactFundamentals() {
  return (
    <PosterLayout
      accent="sky"
      eyebrow="React 19 · Field Reference"
      title="React Fundamentals"
      tagline="Components, JSX, props, and what actually makes the screen change — the base layer every other page in this guide assumes."
      meta={['React 19', '13 concepts']}
      footerLabel="Personal study reference — React 19"
      pageLabel="React 19 Field Guide · Fundamentals"
      prev={null}
      next={{ path: '/react-field-guide/hooks', label: 'Hooks' }}
    >
      <PosterCard
        glyph="Cp"
        title={<>What Is a <span className="dim">Component?</span></>}
        code={`// A component is a function that returns JSX.
function Greeting() {
  return <h1>Hello!</h1>;
}

// PascalCase is REQUIRED — lowercase means "HTML tag"
<Greeting />   // renders your component
<greeting />   // renders an unknown <greeting> DOM element

// You call it by rendering it, never as Greeting()`}
        caption="That's the whole definition: a function whose return value describes UI. React calls it for you — you write <Greeting /> and React invokes the function, so it can track the result and re-run it later."
      />

      <PosterCard
        glyph="JSX"
        title={<>JSX <span className="dim">is just JavaScript</span></>}
        code={`const el = <h1 className="title">Hi</h1>;
// compiles to roughly:
const el = jsx('h1', { className: 'title', children: 'Hi' });

// It's an OBJECT describing UI — not a DOM node, not a string.
// Attribute names are JS-flavored, not HTML:
className (not class)   htmlFor (not for)
onClick (not onclick)   tabIndex (not tabindex)`}
        caption="JSX is syntax sugar over a function call that returns a plain object. Because the attributes become JS object keys, reserved words like class and for get renamed, and every multi-word attribute is camelCase."
      />

      <PosterCard
        glyph="{ }"
        title={<>Braces <span className="dim">embed expressions</span></>}
        code={`const name = 'Tanner';
const user = { role: 'admin' };

<p>Hello, {name}</p>                  // variable
<p>{2 + 2}</p>                        // expression
<p>{user.role.toUpperCase()}</p>      // any call that returns a value
<input disabled={isLocked} />         // non-string prop needs braces
<div style={{ padding: 16 }} />       // outer {} = JSX, inner {} = object

// ❌ Statements are NOT expressions — this is a syntax error
<p>{ if (x) { 'yes' } }</p>`}
        caption="Braces take an expression — something that evaluates to a value. if, for, and switch are statements, so they can't go inside JSX; do that work above the return, or use the ternary/&& forms below."
      />

      <PosterCard
        glyph="?:"
        title={<>Conditional <span className="dim">Rendering</span></>}
        code={`{isLoggedIn ? <Dashboard /> : <LoginForm />}   // either/or
{error && <p className="err">{error}</p>}      // render or nothing
{isOpen && <Modal />}

if (!user) return <Spinner />;                 // early return — cleanest

// ⚠️ && with a NUMBER renders the number
{items.length && <List />}    // renders "0" when the list is empty!
{items.length > 0 && <List />} // ✅ force it to a real boolean`}
        caption="React renders nothing for false, null, undefined, and true — but 0 is a perfectly good number, so it gets printed. Always compare explicitly rather than leaning on a length or count being truthy."
      />

      <PosterCard
        glyph="[ ]"
        title={<>Lists <span className="dim">&amp; the key prop</span></>}
        code={`{users.map(user => (
  <UserRow key={user.id} user={user} />
))}

// key must be: stable, unique among SIBLINGS, from your data
key={user.id}          // ✅
key={index}            // ⚠️ breaks if the list reorders/filters
key={Math.random()}    // ❌ new key every render = full remount

// key lives on the element returned by map, not inside UserRow`}
        caption="React uses key to match each element to the same one from the last render so it can keep its DOM node and its state. An index key silently hands row 2's state to row 1 the moment you sort, insert, or delete."
      />

      <PosterCard
        glyph="Pr"
        title={<>Props <span className="dim">— passing &amp; reading</span></>}
        code={`// parent PASSES
<UserCard name="Ada" age={36} admin onSelect={handleSelect} />
//         string    number   admin={true} shorthand   function

// child READS — destructure in the parameter list
function UserCard({ name, age, admin = false, onSelect }) {
  return <li onClick={onSelect}>{name} ({age})</li>;
}

// Props are READ-ONLY. Never do this:
function Bad({ user }) { user.name = 'x'; }  // ❌ mutating the parent's data`}
        caption="Props are the function's arguments, bundled into one object. Strings can use quotes; everything else goes in braces. Defaults come from JS destructuring defaults — a child never writes to its own props."
      />

      <PosterCard
        glyph="Ch"
        title={<>children <span className="dim">— the content slot</span></>}
        code={`function Card({ title, children }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}          {/* whatever was nested inside */}
    </section>
  );
}

<Card title="Profile">
  <Avatar />              {/* this becomes children */}
  <p>Joined 2019</p>
</Card>`}
        caption="Anything nested between a component's opening and closing tags arrives as the children prop. It's an ordinary prop with a special name — this is how you wrap UI without the parent knowing what it contains."
      />

      <PosterCard
        glyph="↓↑"
        title={<>One-Way <span className="dim">Data Flow</span></>}
        code={`// Data flows DOWN as props. Events flow UP as callbacks.
function Parent() {
  const [query, setQuery] = useState('');
  return <SearchBox value={query} onChange={setQuery} />;
}                          //   ↓ data          ↑ callback

function SearchBox({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}
// The child asks the parent to change; only the OWNER calls setState.`}
        caption="A child can never reach up and edit a parent's state — it can only call a function the parent handed down. When two siblings need the same value, move that state up to their nearest common parent ('lifting state up')."
      />

      <PosterCard
        glyph="S/P"
        title={<>State <span className="dim">vs Props</span></>}
        code={`function Counter({ step }) {          // props — from the PARENT
  const [count, setCount] = useState(0); // state — owned HERE
  return <button onClick={() => setCount(count + step)}>{count}</button>;
}

props   read-only    parent owns it     changing it = parent re-renders
state   changeable   this component     changing it = THIS re-renders

// ❌ Don't copy a prop into state — it silently goes stale
const [name, setName] = useState(props.name);`}
        caption="Same question, two answers: does this value come from outside (prop) or does this component own it (state)? Anything you can calculate from props during render should just be calculated, not stored."
      />

      <PosterCard
        glyph="↻"
        title={<>The Render Cycle <span className="dim">in plain terms</span></>}
        language="text"
        code={`1. React CALLS your component function
2. It returns JSX — a description of what the UI should look like
3. React compares that to the previous description
4. It changes only the DOM nodes that actually differ  ("commit")
5. Effects run after the browser paints

Re-render = React calls your function AGAIN. That's all it means.
It does NOT mean the DOM was rebuilt — usually almost nothing changes.`}
        caption="Rendering is calling a function and getting a description back; committing is React touching the real DOM. Keep render pure — no fetching, no timers, no writing to variables outside — because React may call it more than once."
      />

      <PosterCard
        glyph="Tr"
        title={<>What Triggers <span className="dim">a Re-Render</span></>}
        language="text"
        code={`A component re-renders when:
  • its own setState / dispatch is called
  • its PARENT re-rendered (children re-render too, by default)
  • a context value it reads changed

It does NOT re-render because:
  • you mutated an object or array in place  → React sees no change
  • a plain variable changed                 → not tracked at all
  • a ref's .current changed                 → refs never re-render

setState is ASYNC-ish: the value updates on the NEXT render, not now.`}
        caption="Only state, props from a re-rendered parent, and context cause updates. This is why you replace state instead of mutating it — React compares references, so setItems([...items, x]) is seen but items.push(x) is not."
      />

      <PosterCard
        glyph="Ev"
        title={<>Handling <span className="dim">Events</span></>}
        code={`<button onClick={handleClick}>Save</button>     // ✅ pass the function
<button onClick={handleClick()}>Save</button>   // ❌ CALLS it while rendering

// need an argument? wrap it in an arrow
<button onClick={() => remove(item.id)}>Delete</button>

function handleSubmit(e) {
  e.preventDefault();   // stop the browser's full-page form post
  save(form);
}
<form onSubmit={handleSubmit}>...</form>`}
        caption="Handlers are camelCase props that take a function reference. Adding () calls it immediately during render — the classic 'my button fires on page load and loops forever' bug."
      />

      <PosterCard
        glyph="Fm"
        title={<>Controlled <span className="dim">vs Uncontrolled Inputs</span></>}
        code={`// CONTROLLED — React state is the single source of truth
const [email, setEmail] = useState('');
<input value={email} onChange={e => setEmail(e.target.value)} />

// UNCONTROLLED — the DOM keeps the value, you read it when needed
const emailRef = useRef(null);
<input ref={emailRef} defaultValue="" />
// emailRef.current.value on submit

// ⚠️ value={x} with no onChange = a permanently read-only input
// ⚠️ value={undefined} then value="a" = "uncontrolled to controlled" warning`}
        caption="Controlled means every keystroke goes through state, so you can validate, format, or disable as the user types. Uncontrolled is less code when you only care about the final value at submit — pick one per input and never switch mid-life."
      />

      <PosterQuickRef
        title="How do I do the basic thing?"
        rows={[
          { need: 'Show a variable in markup', answer: '{value} — braces take an expression' },
          { need: 'Show one thing or another', answer: '{cond ? <A /> : <B />}' },
          { need: 'Show something or nothing', answer: '{cond && <A />} — guard numbers with > 0' },
          { need: 'Render a list', answer: 'items.map(i => <Row key={i.id} … />)' },
          { need: 'Pass data to a child', answer: 'A prop — <Child value={x} />' },
          { need: 'Pass nested markup', answer: 'The children prop' },
          { need: 'Let a child change parent data', answer: 'Pass a callback prop down' },
          { need: 'Share a value between siblings', answer: 'Lift state to their common parent' },
          { need: 'Remember something across renders', answer: 'useState (re-renders) / useRef (does not)' },
          { need: 'React to a click', answer: 'onClick={fn} — no parentheses' },
          { need: 'Read what the user typed', answer: 'value + onChange (controlled input)' },
          { need: 'Stop a form reloading the page', answer: 'e.preventDefault() in onSubmit' },
          { need: 'Make the screen update', answer: 'Call a setState function — nothing else works' },
        ]}
      />
    </PosterLayout>
  );
}
