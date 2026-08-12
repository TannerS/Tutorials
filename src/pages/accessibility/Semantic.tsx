import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Semantic() {
  return (
    <LessonLayout
      title="Semantic HTML & Landmarks"
      sectionId="accessibility"
      lessonIndex={1}
      prev={{ path: '/accessibility/intro', label: 'WCAG & Why It Matters' }}
      next={{ path: '/accessibility/aria', label: 'ARIA Roles & Attributes' }}
    >
      <p>
        Semantic HTML is the single most impactful thing you can do for accessibility. Native HTML
        elements carry built-in roles, keyboard behavior, and states that assistive technologies
        understand automatically. A &lt;button&gt; is focusable, activatable with Enter/Space, and
        announced as "button" — a &lt;div&gt; is none of these things.
      </p>

      <InfoBox variant="tip" title="The Golden Rule">
        Use the correct HTML element for the job. If a native element does what you need, use it.
        Only reach for ARIA when there is no native HTML equivalent. This is the{' '}
        <strong>first rule of ARIA</strong> — and it starts here with semantic HTML.
      </InfoBox>

      {/* ── Semantic vs Non-Semantic ──────────────────────── */}
      <h2>Semantic vs Non-Semantic Elements</h2>
      <p>
        Non-semantic elements like &lt;div&gt; and &lt;span&gt; are generic containers with no
        meaning. Semantic elements communicate purpose to both the browser and assistive tech.
      </p>

      <FlowChart
        title="Semantic HTML Document Structure"
        chart={"graph TD\n  PAGE[Document] --> HEADER[header - Site banner]\n  PAGE --> NAV[nav - Navigation]\n  PAGE --> MAIN[main - Primary content]\n  PAGE --> FOOTER[footer - Site footer]\n  MAIN --> SECTION[section - Thematic group]\n  MAIN --> ARTICLE[article - Self-contained content]\n  MAIN --> ASIDE[aside - Tangential content]\n  SECTION --> H2[h2 - Section heading]\n  ARTICLE --> H3[h3 - Article heading]"}
      />

      <CodeBlock language="html" title="❌ Non-Semantic (div soup)">
{`<div class="header">
  <div class="nav">
    <div class="nav-link" onclick="goto('/')">Home</div>
    <div class="nav-link" onclick="goto('/about')">About</div>
  </div>
</div>
<div class="main">
  <div class="section">
    <div class="title">Welcome</div>
    <div class="text">Content here...</div>
  </div>
</div>
<div class="footer">© 2024</div>

<!-- Screen reader hears: "group, group, group, group..."
     No landmarks, no headings, no navigation structure -->`}
      </CodeBlock>

      <CodeBlock language="html" title="✅ Semantic HTML">
{`<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
<main>
  <section aria-labelledby="welcome-heading">
    <h1 id="welcome-heading">Welcome</h1>
    <p>Content here...</p>
  </section>
</main>
<footer>© 2024</footer>

<!-- Screen reader: "banner landmark, navigation landmark,
     main landmark, heading level 1 Welcome, contentinfo landmark"
     Users can jump between landmarks instantly -->`}
      </CodeBlock>

      {/* ── Landmark Roles ────────────────────────────────── */}
      <h2>Landmark Roles</h2>
      <p>
        Landmarks allow screen reader users to jump directly to major page sections — like a table
        of contents for the page structure. Native HTML5 elements create implicit landmarks:
      </p>

      <CodeBlock language="html" title="HTML Elements → Landmark Roles">
{`<!-- Element          → Implicit ARIA Role    → Screen Reader Announcement -->
<header>              <!-- banner              "banner landmark"           -->
<nav>                 <!-- navigation          "navigation landmark"      -->
<main>                <!-- main                "main landmark"            -->
<aside>               <!-- complementary       "complementary landmark"   -->
<footer>              <!-- contentinfo         "contentinfo landmark"     -->
<section aria-label>  <!-- region              "region landmark"          -->
<form aria-label>     <!-- form                "form landmark"            -->
<search>              <!-- search (HTML5.2)    "search landmark"          -->

<!-- Rules: -->
<!-- • Only ONE <main> per page -->
<!-- • <header> and <footer> are landmarks only at the top level -->
<!-- • <section> needs aria-label or aria-labelledby to be a landmark -->
<!-- • Multiple <nav> elements should have distinct aria-label values -->`}
      </CodeBlock>

      <InfoBox variant="warning" title="Label Your Landmarks">
        When you have multiple landmarks of the same type (e.g., two &lt;nav&gt; elements), each must
        have a unique accessible name via <code>aria-label</code> or <code>aria-labelledby</code>.
        Otherwise screen reader users can't tell them apart: "navigation landmark... navigation landmark."
      </InfoBox>

      {/* ── Heading Hierarchy ─────────────────────────────── */}
      <h2>Heading Hierarchy (h1–h6)</h2>
      <p>
        Headings create an outline of the page content. Screen reader users navigate by headings
        more than any other method. The rules are strict:
      </p>

      <CodeBlock language="html" title="❌ Bad Heading Hierarchy">
{`<!-- Skipping levels — screen readers announce gaps, confusing users -->
<h1>Dashboard</h1>
<h4>Recent Activity</h4>  <!-- Skipped h2 and h3! -->
<h2>Settings</h2>
<h6>Theme</h6>            <!-- Skipped h3, h4, h5! -->

<!-- Using headings for styling — use CSS instead -->
<h3>This text should just be bold, not a heading</h3>`}
      </CodeBlock>

      <CodeBlock language="html" title="✅ Correct Heading Hierarchy">
{`<h1>Dashboard</h1>           <!-- One h1 per page -->
  <h2>Recent Activity</h2>   <!-- h2 = major sections -->
    <h3>Today</h3>            <!-- h3 = subsections -->
    <h3>Yesterday</h3>
  <h2>Settings</h2>
    <h3>Theme</h3>
    <h3>Notifications</h3>
      <h4>Email</h4>          <!-- Never skip levels going down -->
      <h4>Push</h4>

<!-- Screen reader users press 'H' to jump between headings.
     A proper hierarchy lets them understand page structure instantly. -->`}
      </CodeBlock>

      {/* ── Lists ─────────────────────────────────────────── */}
      <h2>Lists</h2>
      <p>
        Screen readers announce the number of items in a list and the current position. Using proper
        list markup gives users spatial awareness they can't get from styled &lt;div&gt;s.
      </p>

      <CodeBlock language="html" title="Accessible Lists">
{`<!-- Unordered list — screen reader: "list, 3 items" -->
<ul>
  <li>First item</li>     <!-- "bullet, First item, 1 of 3" -->
  <li>Second item</li>
  <li>Third item</li>
</ul>

<!-- Description list — great for key-value data -->
<dl>
  <dt>Name</dt>
  <dd>Jane Smith</dd>
  <dt>Role</dt>
  <dd>Senior Engineer</dd>
</dl>

<!-- Navigation as list — best practice -->
<nav aria-label="Main">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>`}
      </CodeBlock>

      {/* ── Tables ────────────────────────────────────────── */}
      <h2>Accessible Tables</h2>
      <p>
        Data tables must use proper &lt;th&gt; headers with <code>scope</code> attributes so screen
        readers can associate data cells with their column/row headers.
      </p>

      <CodeBlock language="html" title="❌ Inaccessible Table">
{`<!-- Divs pretending to be a table — no semantic meaning -->
<div class="table">
  <div class="row">
    <div class="cell bold">Name</div>
    <div class="cell bold">Role</div>
  </div>
  <div class="row">
    <div class="cell">Jane</div>
    <div class="cell">Engineer</div>
  </div>
</div>
<!-- Screen reader: just reads text in sequence, no table navigation -->`}
      </CodeBlock>

      <CodeBlock language="html" title="✅ Accessible Table">
{`<table>
  <caption>Team Members</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Role</th>
      <th scope="col">Department</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Jane Smith</th>
      <td>Senior Engineer</td>
      <td>Platform</td>
    </tr>
    <tr>
      <th scope="row">John Doe</th>
      <td>Designer</td>
      <td>Product</td>
    </tr>
  </tbody>
</table>
<!-- Screen reader: "Table, Team Members, 3 columns, 2 rows.
     Row 2: Name: Jane Smith, Role: Senior Engineer, Department: Platform" -->`}
      </CodeBlock>

      {/* ── Forms ─────────────────────────────────────────── */}
      <h2>Forms: label, fieldset, legend</h2>

      <CodeBlock language="html" title="❌ Inaccessible Form">
{`<div>Name</div>
<input type="text" />          <!-- No label association! -->

<div>Choose a plan:</div>
<input type="radio" name="plan" /> Free
<input type="radio" name="plan" /> Pro
<!-- Radio group has no fieldset/legend -->`}
      </CodeBlock>

      <CodeBlock language="html" title="✅ Accessible Form">
{`<!-- Explicit label with for/id -->
<label for="name">Full Name</label>
<input type="text" id="name" autocomplete="name" required />

<!-- Group related inputs with fieldset + legend -->
<fieldset>
  <legend>Choose a plan</legend>
  <label>
    <input type="radio" name="plan" value="free" />
    Free
  </label>
  <label>
    <input type="radio" name="plan" value="pro" />
    Pro — $9/month
  </label>
</fieldset>

<!-- Error messages linked with aria-describedby -->
<label for="email">Email</label>
<input type="email" id="email" aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert">Please enter a valid email address</span>`}
      </CodeBlock>

      {/* ── Link vs Button ────────────────────────────────── */}
      <h2>Link vs Button</h2>
      <p>
        This distinction trips up even experienced developers. The rule is simple:
      </p>

      <CodeBlock language="html" title="When to Use Link vs Button">
{`<!-- LINK (<a>) — navigates to a new URL or location -->
<a href="/settings">Go to Settings</a>
<a href="#section-2">Jump to Section 2</a>
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Site (opens in new tab)
</a>

<!-- BUTTON (<button>) — triggers an action without navigation -->
<button type="button" onclick="openModal()">Open Settings</button>
<button type="submit">Save Changes</button>
<button type="button" onclick="deleteItem()">Delete</button>

<!-- NEVER do these: -->
<!-- ❌ <a href="#" onclick="doAction()">   — use <button> -->
<!-- ❌ <div onclick="navigate()">          — use <a> -->
<!-- ❌ <a href="javascript:void(0)">       — use <button> -->
<!-- ❌ <button onclick="goto('/page')">    — use <a> -->`}
      </CodeBlock>

      {/* ── Images and Alt Text ───────────────────────────── */}
      <h2>Image Alt Text Guidelines</h2>

      <CodeBlock language="html" title="Alt Text Rules">
{`<!-- Informative images — describe the content -->
<img src="chart.png" alt="Bar chart showing Q3 revenue up 15% over Q2" />

<!-- Decorative images — empty alt to hide from a11y tree -->
<img src="decorative-wave.svg" alt="" />

<!-- Functional images (inside links/buttons) — describe the action -->
<a href="/home">
  <img src="logo.png" alt="Acme Corp - Go to homepage" />
</a>

<!-- Complex images — use figure + figcaption + longer description -->
<figure>
  <img src="architecture.png"
       alt="System architecture diagram"
       aria-describedby="arch-desc" />
  <figcaption id="arch-desc">
    The system uses a microservices architecture with an API gateway
    routing to auth, user, and payment services, each with their own database.
  </figcaption>
</figure>

<!-- Icon buttons — alt or aria-label is REQUIRED -->
<button aria-label="Close dialog">
  <img src="x-icon.svg" alt="" />   <!-- alt="" on icon, label on button -->
</button>`}
      </CodeBlock>

      <InfoBox variant="info" title="Alt Text Decision Tree">
        Ask yourself: (1) Is the image decorative? → <code>alt=""</code>.
        (2) Is it informative? → Describe its content.
        (3) Is it functional (inside a link/button)? → Describe the action.
        (4) Is it complex (chart/diagram)? → Short alt + longer description via figcaption or aria-describedby.
      </InfoBox>

      {/* ── Dialog Element ────────────────────────────────── */}
      <h2>The &lt;dialog&gt; Element</h2>
      <p>
        HTML5's native &lt;dialog&gt; provides built-in modal behavior: focus trapping, Escape to
        close, and proper role announcement. Prefer it over custom div-based modals.
      </p>

      <CodeBlock language="html" title="Native Dialog Element">
{`<dialog id="confirm-dialog">
  <h2>Confirm Deletion</h2>
  <p>Are you sure you want to delete this item? This cannot be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="confirm" autofocus>Delete</button>
  </form>
</dialog>

<button onclick="document.getElementById('confirm-dialog').showModal()">
  Delete Item
</button>

<!-- Benefits of native <dialog>:
     ✅ Automatic focus trapping (Tab stays inside)
     ✅ Escape key closes it
     ✅ ::backdrop pseudo-element for overlay
     ✅ role="dialog" is implicit
     ✅ Returns focus to trigger element on close
     ✅ Inert attribute applied to background content -->`}
      </CodeBlock>

      <InteractiveChallenge
        question={"Which HTML element should you use to group related radio buttons and give them a shared label?"}
        options={[
          "<div> with a <span> label",
          "<fieldset> with a <legend>",
          "<section> with a <h2>",
          "<label> wrapping all inputs"
        ]}
        correctIndex={1}
        explanation={"<fieldset> groups related form controls and <legend> provides the group label. Screen readers announce the legend text for each input in the group, so users understand the context. For example: \"Choose a plan, radio button, Free, 1 of 2\"."}
        language="html"
      />

      <InteractiveChallenge
        question={"An image is purely decorative (adds no information). What alt text should it have?"}
        options={[
          "alt=\"decorative image\"",
          "No alt attribute at all",
          "alt=\"\"",
          "aria-hidden=\"true\" with no alt"
        ]}
        correctIndex={2}
        explanation={"An empty alt attribute (alt=\"\") tells screen readers to skip the image entirely. Omitting alt altogether causes some screen readers to announce the filename, which is worse. For decorative images, alt=\"\" is the correct approach."}
        language="html"
      />

    </LessonLayout>
  );
}

export default function SemanticPage() {
  return <Semantic />;
}
