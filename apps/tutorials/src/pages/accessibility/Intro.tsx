import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Intro() {
  return (
    <LessonLayout
      title="WCAG & Why It Matters"
      sectionId="accessibility"
      lessonIndex={0}
      prev={null}
      next={{ path: '/accessibility/semantic', label: 'Semantic HTML & Landmarks' }}
    >
      <p>
        Web accessibility (a11y) means designing and building websites so <strong>everyone</strong> can
        perceive, understand, navigate, and interact with the web — including people with disabilities.
        Over 1 billion people worldwide live with some form of disability. Building accessible products
        isn't optional — it's a legal requirement, a business advantage, and the right thing to do.
      </p>

      <InfoBox variant="info" title={"Why \"a11y\"?"}>
        The abbreviation <strong>a11y</strong> is a numeronym for "accessibility" — the letter "a",
        then 11 letters, then "y". You'll see it everywhere in tooling, linting rules, and conference talks.
      </InfoBox>

      {/* ── Disability Categories ─────────────────────────── */}
      <h2>Disability Categories</h2>
      <p>
        Accessibility addresses a wide spectrum of disabilities. Understanding these categories helps
        you anticipate the barriers users face:
      </p>

      <FlowChart
        title="Disability Categories Affecting Web Use"
        chart={"graph LR\n  D[Disability Categories] --> V[Visual]\n  D --> A[Auditory]\n  D --> M[Motor / Physical]\n  D --> C[Cognitive / Neurological]\n  V --> V1[Blindness]\n  V --> V2[Low vision]\n  V --> V3[Color blindness]\n  A --> A1[Deafness]\n  A --> A2[Hard of hearing]\n  M --> M1[Limited fine motor]\n  M --> M2[Paralysis]\n  M --> M3[Tremors]\n  C --> C1[Dyslexia]\n  C --> C2[ADHD]\n  C --> C3[Epilepsy]"}
      />

      <p>
        Disabilities can also be <strong>permanent</strong> (blind from birth),
        <strong> temporary</strong> (broken arm), or <strong>situational</strong> (holding a baby,
        bright sunlight on a screen). Accessible design benefits everyone.
      </p>

      {/* ── WCAG Overview ─────────────────────────────────── */}
      <h2>WCAG 2.1 AA — The Standard</h2>
      <p>
        The <strong>Web Content Accessibility Guidelines (WCAG)</strong> are published by the W3C's
        Web Accessibility Initiative (WAI). WCAG 2.1 defines three conformance levels:
      </p>
      <ul>
        <li><strong>Level A</strong> — Minimum accessibility. Removes the most severe barriers.</li>
        <li><strong>Level AA</strong> — The target for most laws and policies. This is what you aim for.</li>
        <li><strong>Level AAA</strong> — Highest level. Not required as a blanket target but useful for specific contexts.</li>
      </ul>

      <InfoBox variant="warning" title="AA Is the Industry Target">
        Nearly every legal framework references WCAG 2.1 Level AA. If your product doesn't meet AA,
        you're exposed to lawsuits. In 2023, over 4,600 ADA web accessibility lawsuits were filed in
        the US alone. Don't ship without an accessibility audit.
      </InfoBox>

      {/* ── POUR Principles ───────────────────────────────── */}
      <h2>The Four POUR Principles</h2>
      <p>
        WCAG is organized around four foundational principles. Every success criterion falls under one
        of these. Memorize them — they come up in interviews constantly.
      </p>

      <FlowChart
        title="POUR Principles"
        chart={"graph TD\n  POUR[WCAG POUR Principles] --> P[Perceivable]\n  POUR --> O[Operable]\n  POUR --> U[Understandable]\n  POUR --> R[Robust]\n  P --> P1[Text alternatives for images]\n  P --> P2[Captions for video/audio]\n  P --> P3[Color contrast 4.5:1 ratio]\n  P --> P4[Content adaptable to different presentations]\n  O --> O1[Keyboard accessible]\n  O --> O2[Enough time to read/use]\n  O --> O3[No seizure-inducing content]\n  O --> O4[Navigable with skip links and headings]\n  U --> U1[Readable text]\n  U --> U2[Predictable behavior]\n  U --> U3[Input assistance and error recovery]\n  R --> R1[Compatible with assistive tech]\n  R --> R2[Valid HTML semantics]\n  R --> R3[Name, role, value exposed]"}
      />

      <h3>Perceivable</h3>
      <p>
        Users must be able to perceive the content. This means providing text alternatives for
        non-text content, captions for multimedia, and sufficient color contrast. If content is only
        conveyed through color, some users will miss it entirely.
      </p>

      <h3>Operable</h3>
      <p>
        All functionality must be available from a keyboard. Users must have enough time to interact,
        and content must not cause seizures. Navigation should be predictable with clear focus indicators.
      </p>

      <h3>Understandable</h3>
      <p>
        Text must be readable, the UI must behave predictably, and users must get help avoiding and
        correcting errors. Think clear labels, consistent navigation, and descriptive error messages.
      </p>

      <h3>Robust</h3>
      <p>
        Content must be robust enough to work with current and future assistive technologies. This
        means valid HTML, proper ARIA usage, and exposing name/role/value to the accessibility tree.
      </p>

      {/* ── Legal Requirements ────────────────────────────── */}
      <h2>Legal Requirements</h2>
      <p>Accessibility is legally mandated in many jurisdictions:</p>

      <CodeBlock language="javascript" title="Major Accessibility Laws">
{`// United States
// ADA (Americans with Disabilities Act) — applies to public accommodations
// Section 508 — federal agencies must meet WCAG 2.0 AA
// State laws (e.g., California's Unruh Act)

// European Union
// European Accessibility Act (EAA) — enforcement begins June 2025
// EN 301 549 — harmonized standard referencing WCAG 2.1 AA

// Canada
// Accessible Canada Act (ACA)
// AODA (Ontario) — WCAG 2.0 AA required

// Key takeaway: WCAG 2.1 AA is the de facto global standard.
// When in doubt, target AA compliance.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Real Lawsuits Happen">
        Domino's Pizza, Beyoncé's website, and thousands of e-commerce sites have faced ADA lawsuits.
        The legal risk is not theoretical — plaintiffs' firms actively test sites with automated tools
        and file complaints. Build accessibility in from the start; retrofitting is 10× more expensive.
      </InfoBox>

      {/* ── Business Case ─────────────────────────────────── */}
      <h2>The Business Case</h2>
      <p>Beyond legal compliance, accessibility drives real business value:</p>
      <ul>
        <li><strong>Market reach</strong> — 15% of the global population has a disability</li>
        <li><strong>SEO benefits</strong> — semantic HTML, alt text, and structured content improve search rankings</li>
        <li><strong>Better UX for everyone</strong> — captions help in noisy environments, keyboard nav helps power users</li>
        <li><strong>Brand reputation</strong> — inclusive design signals maturity and care</li>
        <li><strong>Lower maintenance</strong> — accessible code is cleaner, more semantic, easier to test</li>
      </ul>

      {/* ── Assistive Technologies ─────────────────────────── */}
      <h2>Assistive Technologies</h2>
      <p>
        Understanding the tools your users rely on helps you build for them:
      </p>

      <CodeBlock language="html" title="Assistive Technologies Overview">
{`<!-- Screen Readers — read page content aloud -->
<!-- VoiceOver (macOS/iOS), NVDA (Windows, free), JAWS (Windows, paid) -->
<!-- They navigate by headings, landmarks, links, and form controls -->

<!-- Screen Magnifiers — ZoomText, built-in OS zoom -->
<!-- Users may see only a small portion of the screen at once -->

<!-- Switch Devices — single or dual switches for users with limited mobility -->
<!-- Users navigate sequentially; every interactive element must be focusable -->

<!-- Voice Control — Dragon NaturallySpeaking, Voice Access (Android) -->
<!-- Users say "click [label]" — elements MUST have visible, accessible names -->

<!-- Alternative Keyboards — on-screen keyboards, sip-and-puff devices -->
<!-- Keyboard accessibility is the foundation for all these tools -->`}
      </CodeBlock>

      {/* ── The Accessibility Tree ─────────────────────────── */}
      <h2>The Accessibility Tree</h2>
      <p>
        Browsers build a parallel representation of the DOM called the <strong>accessibility tree</strong>.
        This is what assistive technologies actually read — not the visual layout, not the CSS.
        Every node in the a11y tree has four key properties:
      </p>

      <FlowChart
        title="DOM to Accessibility Tree"
        chart={"graph TD\n  DOM[DOM Tree] --> AT[Accessibility Tree]\n  AT --> N[Name - what is it called?]\n  AT --> R[Role - what type of element?]\n  AT --> S[State - checked, expanded, disabled?]\n  AT --> V[Value - current value if applicable]\n  DOM2[HTML: button Submit] --> AT2[Role: button]\n  AT2 --> N2[Name: Submit]\n  AT2 --> S2[State: enabled, focusable]\n  DOM3[HTML: input type=checkbox checked] --> AT3[Role: checkbox]\n  AT3 --> N3[Name: from label]\n  AT3 --> S3[State: checked]"}
      />

      <CodeBlock language="html" title="How Elements Map to the Accessibility Tree">
{`<!-- Good: native elements create proper a11y tree nodes automatically -->
<button>Save</button>
<!-- A11y tree: Role=button, Name="Save", Focusable=true -->

<label for="email">Email</label>
<input type="email" id="email" required />
<!-- A11y tree: Role=textbox, Name="Email", Required=true -->

<!-- Bad: div has no role, no keyboard support, no a11y tree entry -->
<div class="btn" onclick="save()">Save</div>
<!-- A11y tree: Role=generic, Name="", Focusable=false -->
<!-- Screen reader users literally cannot find or activate this -->`}
      </CodeBlock>

      <InfoBox variant="tip" title="Inspect the Accessibility Tree">
        Chrome DevTools → Elements panel → Accessibility tab shows the a11y tree for any element.
        Firefox also has an excellent Accessibility Inspector. Use these constantly during development
        to verify your elements are exposed correctly.
      </InfoBox>

      <InteractiveChallenge
        question={"Which WCAG principle requires that all functionality be available from a keyboard?"}
        options={[
          "Perceivable",
          "Operable",
          "Understandable",
          "Robust"
        ]}
        correctIndex={1}
        explanation={"The Operable principle states that all UI components and navigation must be operable via keyboard. This is WCAG Success Criterion 2.1.1. Users who cannot use a mouse must be able to access every interactive element."}
        language="html"
      />

      <InteractiveChallenge
        question={"What is the minimum color contrast ratio required by WCAG 2.1 AA for normal text?"}
        options={[
          "3:1",
          "4.5:1",
          "7:1",
          "2:1"
        ]}
        correctIndex={1}
        explanation={"WCAG 2.1 AA requires a minimum contrast ratio of 4.5:1 for normal text (Success Criterion 1.4.3). Large text (18pt or 14pt bold) can use 3:1. Level AAA requires 7:1 for normal text."}
        language="html"
      />

      {/* ── Getting Started ───────────────────────────────── */}
      <h2>Your Accessibility Mindset</h2>
      <p>
        Accessibility isn't a checklist you bolt on at the end — it's a mindset you apply from the
        first line of code. In the upcoming lessons we'll cover semantic HTML, ARIA, keyboard
        navigation, and testing. Together these form the foundation every senior developer needs
        to build production-quality, inclusive applications.
      </p>

      <CodeBlock language="javascript" title="Quick A11y Wins You Can Do Today">
{`// 1. Add lang attribute to <html>
// <html lang="en">

// 2. Ensure every image has meaningful alt text (or alt="" for decorative)
// <img src="logo.png" alt="Acme Corp logo" />
// <img src="divider.png" alt="" />  ← decorative, hidden from a11y tree

// 3. Use native HTML elements instead of divs
// <button> instead of <div onClick>
// <a href> instead of <span onClick>

// 4. Add visible focus styles
// :focus-visible { outline: 2px solid #4A90D9; outline-offset: 2px; }

// 5. Test with keyboard only — unplug your mouse for 10 minutes
// Can you reach every interactive element? Can you see where focus is?`}
      </CodeBlock>
    </LessonLayout>
  );
}

export default function IntroPage() {
  return <Intro />;
}
