import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function HtmlForms() {
  return (
    <LessonLayout
      title="Forms, Inputs & Native Validation"
      sectionId="html"
      lessonIndex={2}
      prev={{ path: '/html/semantics', label: 'Semantic Structure & Text Elements' }}
      next={{ path: '/html/interactive', label: 'Native Interactive Elements' }}
    >
      <p>
        Forms are where HTML has the most built-in behaviour and where React developers
        most often rebuild it by hand. The browser already knows how to validate, report
        errors, serialise fields, and submit — and a React form that fights that usually
        ends up with worse keyboard and autofill behaviour than the plain version.
      </p>
      <p>
        Every output in this lesson came from running it in Chromium 149.
      </p>

      <h2>Labels: Two Ways, Both Correct</h2>
      <p>
        A label that is not <em>associated</em> with its input is just text. Association
        is what makes clicking the label focus the field, and what makes a screen reader
        announce the field&apos;s purpose.
      </p>

      <CodeBlock language="html" title="Wrapping and for= are equivalent — verified">
{`<!-- 1. Wrapping. No id needed. -->
<label>Email <input type="email" name="email" /></label>

<!-- 2. Explicit, via for -> id. Needed when the markup can't nest. -->
<label for="pw">Password</label>
<input id="pw" type="password" name="pw" />

<!-- NOT associated — looks identical, behaves worse: -->
<span>Email</span><input type="email" />`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — input.labels.length for each of the first two">
{`wrapping form:   input.labels.length -> 1
for= / id form:  input.labels.length -> 1`}
      </CodeBlock>

      <InfoBox variant="warning" title="placeholder is not a label">
        <p>
          A <code>placeholder</code> disappears the moment the user types, so it cannot
          remind anyone what the field was. It is also commonly low-contrast, and some
          screen readers do not announce it at all. Use a real label; use the
          placeholder for a <em>format example</em> (<code>placeholder="+1 555 0100"</code>)
          if you use it at all.
        </p>
      </InfoBox>

      <h2>Input Types Are Not Cosmetic</h2>
      <p>
        On a phone, <code>type</code> picks the keyboard. That alone is worth getting
        right — <code>type="text"</code> for an email field means no{' '}
        <code>@</code> key.
      </p>

      <CodeBlock language="html" title="The types that earn their place">
{`<input type="email"    />  <!-- @ keyboard, built-in format validation -->
<input type="tel"      />  <!-- numeric keypad; NO validation (formats vary) -->
<input type="url"      />  <!-- requires a scheme: "acme.com" is invalid -->
<input type="number"   />  <!-- spinner; rejects letters; see the warning below -->
<input type="search"   />  <!-- clear button; Enter submits -->
<input type="date"     />  <!-- native picker; value is always YYYY-MM-DD -->
<input type="password" />  <!-- masked, and excluded from autofill heuristics -->
<input type="file" multiple accept="image/*" />
<input type="checkbox" />  <!-- .checked, not .value -->
<input type="radio" name="plan" />  <!-- same name = one mutually-exclusive group -->

<!-- Prefer inputmode over type=number for things that are DIGITS but not
     QUANTITIES — postcodes, card numbers, OTP codes. You get the numeric
     keypad without the spinner and without number semantics. -->
<input type="text" inputmode="numeric" autocomplete="one-time-code" />`}
      </CodeBlock>

      <InfoBox variant="danger" title="input.value is always a string — even on type=number">
        <p>
          This is the single most common form bug in JavaScript, and it is not obvious
          because it only breaks on arithmetic:
        </p>
        <CodeBlock language="text" title="Real output — Chromium 149">
{`<input type="number" value="42">

typeof input.value          -> "string"
typeof input.valueAsNumber  -> "number"   (42)`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So <code>input.value + 1</code> is <code>"421"</code>, not <code>43</code>. Use{' '}
          <code>valueAsNumber</code>, or <code>Number(value)</code> — and remember that an
          empty number input gives <code>""</code>, which <code>Number("")</code> turns
          into <code>0</code> rather than <code>NaN</code>. That silent zero is how a
          blank quantity field becomes a free order.
        </p>
      </InfoBox>

      <h2>Validation the Browser Does For You</h2>
      <p>
        Constraint attributes are declarative, work with JavaScript disabled, and expose a
        full API. The browser also writes the error messages, localised, for free.
      </p>

      <CodeBlock language="html" title="The attributes, and the API they drive">
{`<form id="signup">
  <input name="email"  type="email" required />
  <input name="age"    type="number" min="18" max="120" step="1" />
  <input name="code"   pattern="[A-Z]{3}-\\d{4}" title="ABC-1234" />
  <input name="bio"    maxlength="200" minlength="10" />
  <button>Join</button>
</form>`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the validity API on an empty required field">
{`input.checkValidity()        -> false
input.validity.valueMissing  -> true
input.validationMessage      -> "Please fill out this field."

// type=email with value "nope"
input.checkValidity()        -> false
input.validity.typeMismatch  -> true`}
      </CodeBlock>

      <p>
        The <code>validationMessage</code> is the string the browser would show in its own
        bubble, in the user&apos;s language. That makes the native layer a genuinely good
        default even when you render errors yourself: read the flags, write your own
        markup, and let the browser decide the wording.
      </p>

      <CodeBlock language="html" title="Styling validity, and the pseudo-class that is actually usable">
{`<style>
  /* :invalid matches from first paint — an empty required field is
     invalid before the user has done anything, so this shows red
     errors on a pristine form. Almost never what you want. */
  input:invalid { border-color: red; }

  /* :user-invalid only matches AFTER the user has interacted. This is
     the one to use. */
  input:user-invalid { border-color: red; }
  input:user-valid   { border-color: green; }
</style>

<!-- Turn the browser's own bubbles off but KEEP the constraint API: -->
<form novalidate>…</form>`}
      </CodeBlock>

      <InfoBox variant="tip" title="novalidate does not disable validation">
        <p>
          <code>novalidate</code> stops the browser blocking submission and showing its
          bubble. <code>checkValidity()</code>, the <code>validity</code> flags and the
          CSS pseudo-classes all keep working. That is exactly the combination a custom
          form library wants: native constraint logic, your own error presentation.
        </p>
      </InfoBox>

      <h2>Submission and <code>FormData</code></h2>
      <p>
        <code>FormData</code> reads a form the way the browser would submit it — which
        means it follows rules you need to know, because they are the source of
        &quot;why is this field missing&quot;.
      </p>

      <CodeBlock language="text" title="Real output — two rules, measured">
{`<form><input name="a" value="1"><input value="2"></form>
  [...new FormData(form).keys()]  ->  ["a"]
  // A field with NO name attribute is not submitted. At all.

<form><input name="a" value="1"><input name="b" value="2" disabled></form>
  [...new FormData(form).keys()]  ->  ["a"]
  // A DISABLED field is not submitted either. Use readonly if you want
  // the value sent but not editable.`}
      </CodeBlock>

      <CodeBlock language="javascript" title="The whole pattern, without a form library">
{`form.addEventListener('submit', async (e) => {
  e.preventDefault();                    // stop the full-page navigation

  if (!form.checkValidity()) {           // still works under novalidate
    form.reportValidity();               // show the browser's own messages
    return;
  }

  const data = new FormData(form);
  // Object.fromEntries LOSES repeated keys (checkbox groups, multi-select).
  // Use data.getAll('tags') for those.
  await fetch('/api/signup', { method: 'POST', body: data });
});`}
      </CodeBlock>

      <InfoBox variant="warning" title="button type defaults to submit — inside a form">
        <p>
          A <code>&lt;button&gt;</code> with no <code>type</code> inside a form is{' '}
          <code>type="submit"</code>. So a &quot;Remove row&quot; button in a form
          submits the form, which in a React app looks like a mysterious page reload.
          Write <code>type="button"</code> on every button that is not the submit button.
          This is the single most common form bug in React.
        </p>
      </InfoBox>

      <h2>Autocomplete: The Attribute Users Notice</h2>
      <p>
        <code>autocomplete</code> takes specific documented tokens, not free text. Get
        them right and the browser and password manager fill the form in one tap; get
        them wrong and nothing happens.
      </p>

      <CodeBlock language="html" title="The tokens worth memorising">
{`<input name="email"    autocomplete="email" />
<input name="name"     autocomplete="name" />
<input name="tel"      autocomplete="tel" />

<!-- Login: these two are what a password manager looks for -->
<input autocomplete="username" />
<input type="password" autocomplete="current-password" />

<!-- Signup / change password — tells the manager to OFFER a new one -->
<input type="password" autocomplete="new-password" />

<!-- Address: the token set is granular and worth copying exactly -->
<input autocomplete="street-address" />
<input autocomplete="postal-code" />
<input autocomplete="country-name" />

<!-- One-time codes: iOS and Android will offer the SMS code -->
<input autocomplete="one-time-code" inputmode="numeric" />

<!-- autocomplete="off" is widely IGNORED for passwords on purpose,
     because sites used it to break password managers. Do not rely on it. -->`}
      </CodeBlock>

      <h2>Grouping: <code>fieldset</code> and <code>legend</code></h2>
      <CodeBlock language="html" title="The only correct way to label a radio group">
{`<fieldset>
  <legend>Billing period</legend>
  <label><input type="radio" name="period" value="monthly" /> Monthly</label>
  <label><input type="radio" name="period" value="annual" /> Annual</label>
</fieldset>`}
      </CodeBlock>
      <p>
        Each radio has its own label, but nothing ties them together — without the{' '}
        <code>&lt;legend&gt;</code>, a screen-reader user hears &quot;Monthly, radio
        button&quot; with no idea what question it answers. <code>fieldset</code> also
        gives you one useful bonus: <code>disabled</code> on the fieldset disables every
        control inside it, which is the cleanest way to lock a form while it submits.
      </p>

      <InfoBox variant="note" title="…but the children's .disabled property stays false — verified">
        <p>
          A disabled fieldset disables its controls <em>behaviourally</em>, not by setting
          their attribute. Measured in Chromium 149 on an input inside{' '}
          <code>&lt;fieldset disabled&gt;</code>:
        </p>
        <CodeBlock language="text" title="Real output — four ways of asking the same question">
{`input.disabled            -> false     <- reflects its OWN attribute only
input.matches(':disabled')-> true      <- but it IS disabled
input.focus(); activeEl   -> not the input   (cannot take focus)
new FormData(form).keys() -> ["outside"]     (the field is not submitted)`}
        </CodeBlock>
        <p style={{ marginBottom: 0 }}>
          So a guard written as <code>if (input.disabled)</code> silently fails here,
          while CSS <code>:disabled</code> and form submission both behave correctly.
          Check <code>input.matches(':disabled')</code> if you need to ask in JavaScript.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
