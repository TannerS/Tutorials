import GuideLayout from '../../components/GuideLayout';
import GuidePanel, { GuideCode, GuideDefs, GuideRules, GuideTable } from '../../components/GuidePanel';

export default function HtmlFieldGuide() {
  return (
    <GuideLayout
      title="HTML Field Guide"
      kicker="Web Platform"
      tagline="The document, semantics, forms, native components and the parser — every behaviour here was measured in Chromium 149, not quoted."
      glyph="📄"
      meta={['Chromium 149', '6 lessons', '12 panels']}
      page="1 / 1"
      footer="Measured, not recalled: quirks-mode differences, srcset selection across viewport × DPR, parser repairs, validity flags and FormData rules were all run in a real browser."
      prev={{ path: '/html/parser', label: 'How the Browser Parses & Repairs HTML' }}
      next={null}
    >
      <GuidePanel n={1} title="The Minimum Document" accent="blue" glyph="📄" span={2}>
        <GuideCode>{`<!doctype html>                 <- mode switch, NOT a version
<html lang="en">                <- pronunciation + hyphenation
  <head>
    <meta charset="utf-8">      <- must be in the FIRST 1024 BYTES
    <meta name="viewport"
          content="width=device-width, initial-scale=1">
    <title>Page — Site</title>  <- tab, bookmark, search result, SR announce
  </head>
  <body>…</body>
</html>`}</GuideCode>
        <GuideRules items={[
          'No doctype = quirks mode. document.compatMode is "BackCompat" instead of "CSS1Compat".',
          'Measured quirks differences: height:50% resolved against the VIEWPORT (300px vs 18px), and the <img> in a <td> baseline gap disappears (30px vs 34px cell).',
          'The box-model claim everyone repeats did NOT reproduce — both modes were content-box at 250px.',
          'No meta viewport = the phone pretends to be ~980px wide and every media query is evaluated against that.',
        ]} />
      </GuidePanel>

      <GuidePanel n={2} title="Script Loading" accent="amber" glyph="⚡">
        <GuideCode>{`<script src>          BLOCKS parsing
<script async src>    runs on arrival,
                      ORDER NOT GUARANTEED
<script defer src>    after parse,
                      IN DOCUMENT ORDER
<script type="module">  defer by default`}</GuideCode>
        <GuideRules items={[
          'defer (or type=module) is the sane default.',
          'async only for genuinely independent scripts.',
          'A stylesheet in <head> blocks first paint — on purpose, to avoid a flash of unstyled content.',
        ]} />
      </GuidePanel>

      <GuidePanel n={3} title="Link or Button" accent="green" glyph="🔗">
        <GuideDefs items={[
          ['Changes the URL', '<a href> — middle-click, Cmd-click, copy address, history, crawlable'],
          ['Performs an action', '<button type="button"> — Space AND Enter, disabled, form submit'],
          ['href="#" + onClick', 'a button wearing a link costume. Fix the element.'],
          ['div + onClick', 'the same bug in React. Use <Link> or <button>.'],
        ]} />
      </GuidePanel>

      <GuidePanel n={4} title="Sectioning & Headings" accent="purple" glyph="🧭">
        <GuideCode>{`<header>  banner      ONE, top level
<nav>     navigation  several OK IF named
<main>    main        EXACTLY ONE
<aside>   complementary
<footer>  contentinfo ONE, top level
<section> landmark ONLY with a heading
<article> self-contained`}</GuideCode>
        <GuideRules items={[
          'Heading level = depth in the outline, never font size.',
          'Never skip a level (h1 -> h4) and never style a <p> to look like a heading.',
          'One <h1> per rendered view — in a SPA each route owns its own.',
          'A <section> with no heading is a <div>. Use a div then.',
        ]} />
      </GuidePanel>

      <GuidePanel n={5} title="Forms — the Rules" accent="blue" glyph="📝" span={2}>
        <GuideCode>{`<label>Email <input name="email"></label>   wrapping
<label for="pw">Pw</label><input id="pw">  explicit
// both -> input.labels.length === 1 (verified)

<button>  inside a form defaults to type="submit"
          -> write type="button" on every non-submit button`}</GuideCode>
        <GuideTable
          head={['Rule', 'Measured result']}
          rows={[
            ['Field with no name=', 'NOT in FormData — at all'],
            ['Field disabled', 'NOT in FormData'],
            ['Field readonly', 'IS in FormData'],
            ['fieldset[disabled] child', 'input.disabled === false, but :disabled matches, cannot focus, not submitted'],
            ['Object.fromEntries(fd)', 'LOSES repeated keys — use fd.getAll("tags")'],
          ]}
        />
      </GuidePanel>

      <GuidePanel n={6} title="Input Types" accent="green" glyph="⌨️">
        <GuideDefs items={[
          ['email / url', 'format validated; url needs a scheme'],
          ['tel', 'numeric keypad, NO validation (verified)'],
          ['number', 'spinner; .value is a STRING'],
          ['date', 'value is always YYYY-MM-DD'],
          ['search', 'clear button, Enter submits'],
          ['inputmode="numeric"', 'digits without number semantics — codes, postcodes'],
        ]} />
        <GuideRules items={[
          'input.value is a string even on type=number. Use valueAsNumber.',
          'Empty number input -> "" and Number("") is 0, not NaN. That silent zero is a real bug.',
        ]} />
      </GuidePanel>

      <GuidePanel n={7} title="Native Validation" accent="amber" glyph="✅">
        <GuideCode>{`required  min  max  step
pattern   minlength  maxlength

input.checkValidity()       -> false
input.validity.valueMissing -> true
input.validationMessage
  -> "Please fill out this field."
     (browser-written, localised)`}</GuideCode>
        <GuideRules items={[
          'Use :user-invalid, not :invalid — :invalid matches an untouched empty required field from first paint.',
          'novalidate stops the bubble and the block, but checkValidity(), the validity flags and the pseudo-classes all keep working.',
          'form.reportValidity() shows the browser messages on demand.',
        ]} />
      </GuidePanel>

      <GuidePanel n={8} title="autocomplete Tokens" accent="purple" glyph="🪄">
        <GuideCode>{`email  name  tel
username
current-password   <- login
new-password       <- signup / change
one-time-code      <- SMS codes
street-address  postal-code  country-name`}</GuideCode>
        <GuideRules items={[
          'Specific documented tokens, not free text — a wrong token simply does nothing.',
          'autocomplete="off" is widely ignored for passwords, deliberately.',
        ]} />
      </GuidePanel>

      <GuidePanel n={9} title="Native Components" accent="green" glyph="🪟" span={2}>
        <GuideTable
          head={['Element', 'What you get free', 'Measured']}
          rows={[
            ['<dialog> + showModal()', 'top layer, focus trap, Escape, ::backdrop', 'matches :modal; focus moves to first child; Escape closes'],
            ['<dialog> + show()', 'non-modal panel — no trap, no Escape', 'does NOT match :modal'],
            ['form method="dialog"', 'closes on submit, passes button value', 'returnValue === "confirmed", close fired'],
            ['<details>', 'accordion, find-in-page can open it', 'works with zero JS'],
            ['<details name="g">', 'EXCLUSIVE accordion — opening one closes the others', 'a.open became false when b opened'],
            ['popover + popovertarget', 'top layer, light dismiss, Escape', 'defaults to popover="auto"; :popover-open matches'],
          ]}
        />
        <GuideRules items={[
          'dialog = modal and blocking. popover = non-modal and dismissible. Both use the top layer, so neither has z-index or overflow:hidden problems.',
          'Clicking the backdrop does NOT close a dialog — you add that yourself.',
          '<progress> = progress through a task. <meter> = where a value sits in a range. Not interchangeable.',
        ]} />
      </GuidePanel>

      <GuidePanel n={10} title="Images — srcset & sizes" accent="blue" glyph="🖼️" span={2}>
        <GuideCode>{`<img srcset="h-400.jpg 400w, h-800.jpg 800w, h-1600.jpg 1600w"
     sizes="100vw" src="h-800.jpg" alt="…"
     width="800" height="400" loading="lazy">`}</GuideCode>
        <GuideTable
          head={['Viewport', 'DPR', 'sizes=100vw', 'sizes=50vw']}
          rows={[
            ['800px', '1', '800.svg', '400.svg'],
            ['800px', '2', '1600.svg', '800.svg'],
            ['400px', '1', '400.svg', '400.svg'],
          ]}
        />
        <GuideRules items={[
          'The algorithm: needed = layout width × device pixel ratio, then pick the smallest candidate that covers it.',
          '400w means "this file is 400px wide" — it is NOT a media query.',
          'sizes defaults to 100vw, so omitting it on a thumbnail downloads a full-viewport image.',
          'width/height attributes = aspect ratio reserved before load. Measured: "auto 100 / 50". Cheapest CLS fix there is.',
          'loading="lazy" is wrong for your hero image.',
          '<picture> picks between FORMATS or CROPS; srcset picks between SIZES. The nested <img> is what renders.',
        ]} />
      </GuidePanel>

      <GuidePanel n={11} title="Parser Repairs — Measured" accent="red" glyph="🔧" span={3}>
        <GuideCode>{`wrote:  <p><div>x</div></p>
got:    <p></p><div>x</div><p></p>          1 element in, 3 out

wrote:  <table><div>oops</div><tr>…
got:    <div>oops</div><table><tbody>…     the div is HOISTED OUT

wrote:  <table><tr><td>c</td></tr></table>
got:    firstElementChild === "TBODY"       a tbody you never wrote

wrote:  <a href="/x"><a href="/y">y</a></a>
got:    2 SIBLING <a> elements              <a> cannot nest

wrote:  <table><form><tr>…</tr></form></table>
got:    form.parentElement === "TABLE"      rows move out from under it
                                            -> "my table form submits nothing"`}</GuideCode>
        <GuideRules items={[
          'HTML has no syntax errors. The browser repairs and carries on, silently.',
          'THIS is where unexplained React hydration mismatches come from: the server string gets repaired, so the client tree differs. Treat validateDOMNesting warnings as errors.',
          'DevTools Elements shows the REPAIRED tree; View Source shows what you sent. When they disagree, the parser rewrote something.',
          'Use a React fragment <>…</> when you need grouping without a wrapper the parser would reject.',
        ]} />
      </GuidePanel>

      <GuidePanel n={12} title="Text, Whitespace & Escaping" accent="purple" glyph="✍️" span={2}>
        <GuideDefs items={[
          ['<em> / <strong>', 'carry MEANING — emphasis, importance'],
          ['<i> / <b>', 'presentation only, not deprecated — redefined'],
          ['<code> / <kbd> / <samp>', 'code / keys the user presses / program output'],
          ['<time datetime>', 'machine-readable date'],
          ['<dl><dt><dd>', 'the forgotten list — ideal for key/value display'],
          ['<span>', 'means nothing, by design'],
        ]} />
        <GuideRules items={[
          'Runs of whitespace collapse to one space; a newline IS whitespace — that is the inline-block gap.',
          '<pre> and <textarea> preserve it; <textarea> also eats ONE leading newline (verified).',
          'Escape five characters: < > & " \'.',
          'innerHTML runs the parser: <script> does NOT execute, but <img src=x onerror=…> DOES (verified it fires). textContent does not parse at all.',
          'Only <li>, <script> and <template> may be direct children of ul/ol.',
        ]} />
      </GuidePanel>
    </GuideLayout>
  );
}
