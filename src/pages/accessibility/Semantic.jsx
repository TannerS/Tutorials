import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

export default function A11ySemantic() {
  return (
    <LessonLayout
      title="Semantic HTML"
      sectionId="accessibility"
      lessonIndex={1}
      prev={{ path: '/accessibility/intro', label: 'Accessibility Introduction' }}
      next={{ path: '/accessibility/aria', label: 'ARIA Attributes' }}
    >
      <h2>What Is Semantic HTML?</h2>
      <p>
        Semantic HTML uses elements that convey meaning — not just visual appearance. When you use
        a <code>{'<nav>'}</code> instead of a <code>{'<div class="nav">'}</code>, screen readers,
        search engines, and other tools understand the structure of your page. Semantics are the
        foundation of accessibility: correct semantics often mean ARIA is unnecessary.
      </p>

      <FlowChart
        title="Semantic vs Non-Semantic"
        chart={"graph LR\n  A[div soup] --> B[No structure for AT]\n  C[Semantic HTML] --> D[Screen reader landmarks]\n  C --> E[SEO understanding]\n  C --> F[Keyboard navigation]\n  C --> G[No ARIA needed]"}
      />

      <CodeBlock language="html" title="Landmark Elements — Page Structure">
{`<!-- NON-SEMANTIC — screen readers see a wall of divs, no navigation aid -->
<div class="header">
  <div class="nav">
    <div onclick="go('/')">Home</div>
    <div onclick="go('/about')">About</div>
  </div>
</div>
<div class="main">
  <div class="article">
    <div class="h1">Welcome</div>
    <div class="p">Content here...</div>
  </div>
</div>
<div class="footer">Copyright 2024</div>

<!-- SEMANTIC — assistive technology can navigate by landmark -->
<header>                            <!-- banner landmark -->
  <nav aria-label="Main navigation">  <!-- navigation landmark -->
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<main>                              <!-- main landmark (one per page) -->
  <article>                         <!-- self-contained content -->
    <h1>Welcome</h1>
    <p>Content here...</p>
    <section aria-labelledby="features-heading">
      <h2 id="features-heading">Features</h2>
      <!-- section groups related content, labeled by heading -->
    </section>
  </article>

  <aside aria-label="Related articles">  <!-- complementary landmark -->
    <!-- sidebar content -->
  </aside>
</main>

<footer>                            <!-- contentinfo landmark -->
  <p>Copyright 2024</p>
  <nav aria-label="Footer navigation">
    <a href="/privacy">Privacy</a>
    <a href="/terms">Terms</a>
  </nav>
</footer>

<!-- Screen reader users press 'r' to jump between regions,
     'h' to jump between headings, 'l' for lists —
     semantic HTML makes all of this work automatically -->`}
      </CodeBlock>

      <h2>Heading Hierarchy — Structure, Not Style</h2>

      <CodeBlock language="html" title="Correct Heading Usage">
{`<!-- Headings communicate document outline — never skip levels for style -->

<!-- ✗ Wrong: using headings for visual size, skipping levels -->
<h1>Company Blog</h1>
<h3>Latest Post</h3>          <!-- skipped h2! -->
<h1>Popular Categories</h1>  <!-- wrong: second h1 breaks outline -->

<!-- ✓ Correct: sequential hierarchy, one h1 per page -->
<h1>Company Blog</h1>          <!-- page title — only one per page -->
  <h2>Latest Post</h2>
    <h3>Comments</h3>
      <h4>Reply to Alice</h4>
  <h2>Popular Categories</h2>
    <h3>JavaScript</h3>
    <h3>CSS</h3>

<!-- If you want text styled like an h3 but it's logically an h2: -->
<!-- Don't change the heading level — change the CSS class -->
<h2 class="text-sm font-normal">Visual subtitle</h2>
<!-- Still h2 in the outline, but styled however you want -->

<!-- Screen readers let users list all headings on a page.
     A broken hierarchy makes the document outline meaningless. -->

<!-- React pattern for dynamic heading levels -->
function Heading({ level = 2, children, ...props }) {
  const Tag = 'h' + Math.min(6, Math.max(1, level));
  return <Tag {...props}>{children}</Tag>;
}

// Adjust level based on context, not visual design
<Section>
  <Heading level={currentDepth + 1}>Section Title</Heading>
</Section>`}
      </CodeBlock>

      <h2>Interactive Elements — Button vs Link</h2>

      <CodeBlock language="jsx" title="Choosing the Right Interactive Element">
{`// THE RULE:
// <button> → triggers an action (submit form, open modal, toggle state)
// <a href> → navigates to a URL or page section

// ✓ Correct button usage
<button onClick={openModal}>Edit Profile</button>
<button type="submit">Create Account</button>
<button onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
<button onClick={deleteItem} aria-label={"Delete " + item.name}>
  <TrashIcon />
</button>

// ✓ Correct link usage
<a href="/about">About Us</a>
<a href="#features">Jump to Features</a>
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Site
</a>

// ✗ Wrong — div/span for interactive actions (not keyboard accessible)
<div onClick={openModal}>Edit</div>         // no keyboard, no role
<span onClick={handleSort}>Sort</span>     // no Enter/Space support

// ✗ Wrong — link that doesn't navigate
<a href="#" onClick={openModal}>Edit</a>   // use button instead!
<a href="javascript:void(0)">Click</a>    // definitely wrong

// ✗ Wrong — button that navigates
<button onClick={() => navigate('/about')}>About</button>
// Use <Link to="/about"> instead — right semantics, right keyboard behavior

// Keyboard expectations (enforced by browsers for semantic elements):
// <a>:      Enter activates it
// <button>: Enter AND Space activate it
// Using wrong element breaks user expectations

// When you must use a non-semantic element (e.g., third-party component),
// add role and keyboard support:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
>
  Custom Button
</div>
// But prefer native <button> — browsers handle this for free`}
      </CodeBlock>

      <h2>Lists, Tables, and Forms</h2>

      <CodeBlock language="html" title="Semantic Lists and Tables">
{`<!-- Navigation menus should be lists -->
<nav aria-label="Breadcrumb">
  <ol>  <!-- ordered: position matters in breadcrumbs -->
    <li><a href="/">Home</a></li>
    <li><a href="/products">Products</a></li>
    <li aria-current="page">Laptop Pro</li>
  </ol>
</nav>

<!-- Definition lists for term-value pairs -->
<dl>
  <dt>RAM</dt>         <dd>16 GB DDR5</dd>
  <dt>Storage</dt>     <dd>512 GB NVMe SSD</dd>
  <dt>Display</dt>     <dd>14" 2560×1600 120Hz</dd>
</dl>

<!-- Tables for TABULAR DATA only (not layout!) -->
<table>
  <caption>Q4 Sales by Region</caption>  <!-- table title for AT -->
  <thead>
    <tr>
      <th scope="col">Region</th>         <!-- scope tells AT: this is a column header -->
      <th scope="col">Sales</th>
      <th scope="col">Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">North America</th>  <!-- row header -->
      <td>$4.2M</td>
      <td>+12%</td>
    </tr>
    <tr>
      <th scope="row">Europe</th>
      <td>$2.8M</td>
      <td>+8%</td>
    </tr>
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td>$7.0M</td>
      <td>+10.5%</td>
    </tr>
  </tfoot>
</table>
<!-- Screen readers announce: "Q4 Sales by Region, Europe row, Sales column: $2.8M" -->`}
      </CodeBlock>

      <CodeBlock language="html" title="Accessible Form Patterns">
{`<!-- Every input needs a visible label — never just placeholder -->
<!-- Placeholder disappears when typing and has poor contrast -->

<!-- ✓ Explicit label association -->
<label for="email">Email address</label>
<input id="email" type="email" name="email" autocomplete="email" required>

<!-- ✓ Wrapping label (implicit association) -->
<label>
  Password
  <input type="password" name="password" autocomplete="current-password">
</label>

<!-- ✓ Multiple inputs in a group — use fieldset + legend -->
<fieldset>
  <legend>Shipping address</legend>
  <label for="street">Street</label>
  <input id="street" type="text" autocomplete="street-address">
  <label for="city">City</label>
  <input id="city" type="text" autocomplete="address-level2">
</fieldset>

<!-- ✓ Radio button group — fieldset + legend required -->
<fieldset>
  <legend>Preferred contact method</legend>
  <label><input type="radio" name="contact" value="email"> Email</label>
  <label><input type="radio" name="contact" value="phone"> Phone</label>
  <label><input type="radio" name="contact" value="text"> Text</label>
</fieldset>

<!-- ✓ Inline error with aria-describedby -->
<label for="username">Username</label>
<input
  id="username"
  type="text"
  aria-describedby="username-error"
  aria-invalid="true"
>
<span id="username-error" role="alert">
  Username must be at least 3 characters.
</span>
<!-- Screen reader: "Username, invalid, text field. Username must be at least 3 characters." -->

<!-- ✓ Required fields — programmatic + visual -->
<label for="phone">
  Phone number
  <span aria-hidden="true">*</span>  <!-- hide asterisk from AT -->
</label>
<input id="phone" type="tel" required aria-required="true" autocomplete="tel">`}
      </CodeBlock>

      <h2>Time, Address, and Inline Semantics</h2>

      <CodeBlock language="html" title="Inline Semantic Elements">
{`<!-- time — machine-readable datetime + human-readable text -->
<p>Published <time datetime="2024-03-15">March 15, 2024</time></p>
<p>Meeting at <time datetime="2024-03-15T14:00:00">2:00 PM</time></p>
<p>Duration: <time datetime="PT2H30M">2 hours 30 minutes</time></p>

<!-- address — contact information for nearest article/body ancestor -->
<footer>
  <address>
    <a href="mailto:hello@example.com">hello@example.com</a><br>
    123 Main St, Seattle, WA 98101
  </address>
</footer>

<!-- abbr — abbreviation with full expansion -->
<p>The <abbr title="World Wide Web Consortium">W3C</abbr> publishes web standards.</p>

<!-- mark — highlighted/relevant text (like search result highlight) -->
<p>Results for "semantic": The <mark>semantic</mark> web was Tim Berners-Lee's vision.</p>

<!-- del / ins — editorial changes with optional datetime -->
<p>Price: <del datetime="2024-01-01">$99</del> <ins datetime="2024-02-01">$79</ins></p>

<!-- cite — title of a creative work -->
<blockquote>
  <p>"First, solve the problem. Then, write the code."</p>
  <footer>— <cite>John Johnson</cite></footer>
</blockquote>

<!-- code, kbd, samp — technical text -->
<p>Press <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.</p>
<p>The function returns <code>null</code> if not found.</p>
<p>Output: <samp>Error: file not found</samp></p>

<!-- figure + figcaption — image/diagram with caption -->
<figure>
  <img src="architecture.svg" alt="Three-tier architecture: client, server, database">
  <figcaption>
    Figure 1: Three-tier architecture showing request flow from browser to database.
  </figcaption>
</figure>`}
      </CodeBlock>

      <InfoBox variant="tip" title="The First Rule of ARIA">
        <p>
          The W3C's first rule of ARIA use: <em>don't use ARIA</em> — use the native HTML element
          that already has the semantics and behavior you need. A <code>{'<button>'}</code> is
          better than <code>{'<div role="button">'}</code> because the browser gives it keyboard
          support, focus styles, and click handling for free. Semantic HTML is zero-effort
          accessibility. ARIA is for filling gaps when no semantic element exists.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="When should you use a <button> versus an <a> tag for an interactive element?"
        options={[
          "They are interchangeable — use whichever looks better",
          "<button> for actions that do something on the current page; <a href> for navigation to a URL or resource",
          "<a> for everything clickable since it supports href",
          "<button> only for form submissions inside <form> elements"
        ]}
        correctIndex={1}
        explanation="<button> is for actions: submit a form, open a modal, toggle a menu, delete an item. <a href> is for navigation: go to a URL, jump to an anchor. This matters for accessibility: keyboards expect Space to activate buttons but not links; screen readers announce them differently ('link' vs 'button'); browsers style them differently. Using the wrong element creates confusion for users who rely on keyboard or assistive technology."
      />

      <InteractiveChallenge
        question="What is wrong with using heading elements (h1–h6) purely for their visual size?"
        options={[
          "Nothing — heading levels are just CSS shortcuts for font sizes",
          "Skipping heading levels or using multiple h1s breaks the document outline that screen readers use for navigation",
          "Search engines penalize pages that use h2 before h3",
          "Headings must always match the visual font hierarchy"
        ]}
        correctIndex={1}
        explanation="Screen reader users press 'h' to jump between headings and can list all headings to understand page structure. If you use h3 for visual style instead of structural meaning, or skip from h1 to h3, the document outline becomes meaningless — like a table of contents with missing chapters. Use CSS classes to control heading appearance; use heading levels to communicate hierarchy. One h1 per page (the main topic), h2 for major sections, h3 for subsections."
      />
    </LessonLayout>
  );
}
