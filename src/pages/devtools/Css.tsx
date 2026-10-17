import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function DevtoolsCss() {
  return (
    <LessonLayout
      title="Debugging CSS: Tracing a Computed Value"
      sectionId="devtools"
      lessonIndex={1}
      prev={{ path: '/devtools/elements', label: 'Elements: Inspecting the Live DOM' }}
      next={{ path: '/devtools/console', label: 'Console: Beyond console.log' }}
    >
      <p>
        The hardest CSS question is not &quot;what is this value?&quot; — Computed answers
        that. It is <strong>&quot;which rule set it, and why did that one win?&quot;</strong>{' '}
        In a codebase with a reset, a component library, utility classes and design
        tokens, a single colour can have six candidates, and the winner is often none of
        the ones you were looking at.
      </p>
      <p>
        This lesson is the workflow for that, plus the overlays for layout problems. It
        covers Chrome/Edge DevTools (Chromium 149).
      </p>

      <h2>The Core Move: Computed → Expand the Property</h2>
      <p>
        Everyone finds the Computed tab eventually. The part people miss is that{' '}
        <strong>every property in it expands</strong>.
      </p>

      <CodeBlock language="text" title="What expanding a property gives you">
{`Computed tab -> find the property -> click the ▸ arrow

  color    rgb(107, 114, 128)
    ▾
    .text-muted          tokens.css:88      <- WINNER, listed first
    .card p              card.css:42        <- struck through: lost
    body                 reset.css:12       <- struck through: lost

// Each line is clickable and jumps to that exact source line.
// The order IS the cascade order. The top one is what you see.
// Everything below it is a rule that tried and lost.`}
      </CodeBlock>

      <InfoBox variant="tip" title="This is the answer to &quot;where is this coming from?&quot;">
        <p style={{ marginBottom: 0 }}>
          One click gives you every rule that targeted the property, ranked, each with a
          file and line. Tick <strong>Show all</strong> at the top to include properties
          nobody set — that is how you find an <em>inherited</em> or
          <em> user-agent</em> value, which is the case where there is no rule of yours to
          find at all.
        </p>
      </InfoBox>

      <h2>Reading the Styles Pane</h2>
      <p>
        Styles shows the same information organised by <em>rule</em> rather than by
        property, in cascade order with the winner at the top. The visual cues are the
        whole language:
      </p>

      <CodeBlock language="text" title="Every cue, and what it means">
{`color: red                   applied
color: blue                  STRUCK THROUGH — lost. Hover it; DevTools
                             often explains why in a tooltip.

element.style { }            inline styles. React's style prop lands here,
                             and it beats every stylesheet rule.

.card ⟶ styles.css:42        click the file:line to jump to the source

(index)                      came from a <style> tag in the document

user agent stylesheet        the BROWSER's default. If you are fighting a
                             margin or font-size you never wrote, it is
                             almost always this.

Inherited from <body>        a separate block at the bottom, for values
                             that came down the tree rather than matching
                             this element.

@layer base { }              the cascade layer the rule lives in. Layer
                             order beats specificity — see the CSS
                             Variables lesson for the measured proof.

a crossed-out PROPERTY NAME  invalid property or value. A typo'd
                             property name shows here with a warning
                             triangle — the single fastest way to spot
                             "my CSS does nothing".`}
      </CodeBlock>

      <InfoBox variant="warning" title="The checkbox beside every declaration">
        <p style={{ marginBottom: 0 }}>
          Unticking a declaration disables it live. It is the crudest tool in the panel
          and often the fastest: when you cannot work out which of five declarations is
          responsible for a layout, switch them off one at a time and watch. Nothing is
          saved, so a reload restores everything.
        </p>
      </InfoBox>

      <h2>The Decision Tree</h2>
      <FlowChart
        title="&quot;Why does this element look like that?&quot;"
        chart={"graph TD\n  A[\"a value is wrong\"] --> B[\"Computed tab:\\nexpand the property\"]\n  B --> C{\"is there a rule listed?\"}\n  C -->|\"yes, and the winner\\nis a file I know\"| D[\"click file:line.\\nDone.\"]\n  C -->|\"yes, but the winner is\\na library / utility class\"| E[\"you are fighting it.\\nOverride in a later layer,\\nor stop fighting and use\\nthe library's own API\"]\n  C -->|\"no rule at all\"| F{\"Show all ticked?\"}\n  F -->|\"it is Inherited from…\"| G[\"the value came DOWN\\nthe tree. Fix it on the\\nancestor, or reset it here\"]\n  F -->|\"it is user agent\\nstylesheet\"| H[\"a browser default.\\nYour reset is not\\ncovering this element\"]\n  F -->|\"nothing\"| I[\"it is the property's\\nINITIAL value. Nobody\\nset it — including you\"]\n  style D fill:#1a3329,stroke:#4ade80\n  style G fill:#3d2f14,stroke:#d97706\n  style H fill:#2a1f44,stroke:#a78bfa"}
      />

      <h2>CSS Variables Need One Extra Step</h2>
      <p>
        A custom property hides the source twice over: the rule you find sets{' '}
        <code>color: var(--text-muted)</code>, and now you need to know where{' '}
        <em>that</em> came from — which is a different element, usually{' '}
        <code>:root</code>.
      </p>
      <CodeBlock language="text" title="The two things DevTools gives you">
{`1. HOVER the var() in Styles
     -> a tooltip shows the resolved value, and where the variable
        was defined. Cmd/Ctrl-click it to jump there.

2. Computed tab, tick "Show all", and custom properties are listed
   like any other property — so you can see every --token in scope
   on this element, including ones inherited from an ancestor.

// The common bug: a variable defined on .theme-dark but read by an
// element OUTSIDE that subtree. Custom properties INHERIT, so the
// element gets the :root fallback instead and you see the light
// value with no rule to blame. Check WHICH element defines it,
// not just that it is defined.`}
      </CodeBlock>

      <h2>Layout Problems: Use the Overlays</h2>
      <CodeBlock language="text" title="Badges in the Elements tree, and the Layout pane">
{`grid badge     -> overlay with NUMBERED grid lines and named areas.
                  Stop counting tracks by hand. The Layout pane has
                  persistent checkboxes so you can leave it on.

flex badge     -> overlay showing main/cross axis, gaps, and how free
                  space is distributed.

scroll badge   -> THIS ELEMENT IS A SCROLL CONTAINER. Often a surprise,
                  and it explains: a nested scrollbar you cannot find,
                  a sticky element sticking to the wrong thing, and a
                  dropdown being clipped. If a popover is cut off, look
                  for this badge on its ancestors.

Force state    -> right-click the element: pin :hover, :active, :focus,
                  :focus-visible, :target. The only sane way to style a
                  state you cannot hold still.
Command Menu -> "Show Rendering":
  Paint flashing          see exactly what repaints as you interact
  Layout Shift Regions    flashes the areas that moved — CLS, visually
  Scrolling performance   highlights slow-scrolling regions
  Emulate prefers-color-scheme  / vision deficiencies`}
      </CodeBlock>

      <InfoBox variant="success" title="The sizing questions, and which tool answers each">
        <p>
          These are the three that come up most, and the panel answers all of them —{' '}
          <a href="/css-mastery/sizing">Why Is This Element That Size?</a> has the
          measured rules behind them:
        </p>
        <ul style={{ marginBottom: 0 }}>
          <li>
            <strong>&quot;Why does this child fill the parent?&quot;</strong> → check the{' '}
            <em>parent&apos;s</em> <code>display</code> in Computed. Block children fill;
            flex and inline-block children shrink-wrap.
          </li>
          <li>
            <strong>&quot;Why is my <code>height: 100%</code> ignored?&quot;</strong> →
            check the parent&apos;s computed <code>height</code>. If it is{' '}
            <code>auto</code>, the percentage is dropped silently.
          </li>
          <li>
            <strong>&quot;Why is content stretching the container?&quot;</strong> → look at
            the item&apos;s computed <code>min-width</code>. On a flex or grid item{' '}
            <code>auto</code> means &quot;at least as wide as my content&quot;, and a
            minimum beats a maximum. Measured: a 300px flex container with one long word
            rendered its item at <strong>471px</strong> until{' '}
            <code>min-width: 0</code> was added.
          </li>
        </ul>
      </InfoBox>

      <h2>Two More Panels Worth Knowing</h2>
      <CodeBlock language="text" title="Both from the Command Menu">
{`Coverage        records which CSS and JS actually executed. Shows
                unused bytes per file — the evidence for deleting
                dead CSS, rather than guessing.

Changes         every live edit you have made in this DevTools session,
                as a DIFF. Fix a layout by poking at Styles, then open
                Changes and copy the result into your real stylesheet.
                This turns experimentation into a patch.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The workflow that makes DevTools edits worth keeping">
        <p style={{ marginBottom: 0 }}>
          Experiment freely in Styles, then open <strong>Changes</strong> to see exactly
          what you altered as a diff you can copy. For a bigger change, add your project
          folder under <strong>Sources → Filesystem</strong> and DevTools will write edits
          straight to disk. Either way you stop re-typing the fix you already found.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
