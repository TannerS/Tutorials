import CodeBlock from '../../components/CodeBlock';
import CssPlaygroundWidget from '../../components/CssPlayground';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function CssPlaygroundLesson() {
  return (
    <LessonLayout
      title="🎨 CSS Playground"
      sectionId="playground"
      lessonIndex={3}
      prev={{ path: '/playground/jsx-compiler', label: 'JSX Compiler Comparison' }}
      next={{ path: '/playground/sass-playground', label: 'Sass/SCSS Playground' }}
    >
      <p>
        Write HTML and CSS, see it render instantly. There&apos;s no compile step
        here and no framework in the way — just the browser&apos;s own layout and
        paint engine, which is exactly the point. The fastest way to actually
        learn flexbox, grid, or a tricky selector is to change one value and watch
        what moves.
      </p>

      <InfoBox variant="note" title="Why an iframe, and not just a div">
        <p>
          The preview renders inside an <code>&lt;iframe&gt;</code> with a{' '}
          <code>srcDoc</code> attribute, which gives it a completely separate
          document — its own stylesheet scope, its own <code>:root</code>, its own
          cascade. If it were a <code>&lt;div&gt;</code> with an injected{' '}
          <code>&lt;style&gt;</code> tag, a rule like <code>body {'{ ... }'}</code>{' '}
          or <code>* {'{ ... }'}</code> in your example would escape and restyle this
          entire site. The iframe is also sandboxed, so <code>&lt;script&gt;</code>{' '}
          tags in your HTML won&apos;t run — this is a CSS playground, not a JS one
          (that&apos;s what the compiler pages are for).
        </p>
      </InfoBox>

      <h2>Playground</h2>
      <InfoBox variant="question" title="Change one value, watch what moves">
        <p>
          Reading CSS teaches you very little; breaking it teaches you a lot. Three
          edits worth making, each aimed at a rule that is hard to believe until you
          see it:
        </p>
        <ol>
          <li>
            <strong>Discover that flexbox&apos;s axes are relative, not vertical and
            horizontal.</strong> Load <em>Flexbox — centering anything</em>. The comments
            claim <code>align-items</code> is vertical and <code>justify-content</code> is
            horizontal. Now add <code>flex-direction: column;</code> to{' '}
            <code>.stage</code>. The comments are now wrong — the two properties have
            swapped meaning. <code>justify-content</code> always works along the{' '}
            <em>main</em> axis and <code>align-items</code> along the <em>cross</em> axis,
            and <code>flex-direction</code> decides which is which. Nearly every &quot;why
            won&apos;t this center&quot; bug is this.
          </li>
          <li>
            <strong>Rearrange a page without touching the HTML.</strong> Load{' '}
            <em>CSS Grid — a page layout</em> and look at{' '}
            <code>grid-template-areas</code> — the layout is literally ASCII art. Swap{' '}
            <code>nav</code> and <code>aside</code> in that string and the sidebars trade
            places, while the HTML source order is untouched. Useful, and also a warning:
            screen readers and keyboard tab order follow the <em>DOM</em>, not the grid, so
            a visual reorder that contradicts source order is an accessibility bug.
          </li>
          <li>
            <strong>Feel the difference between a transition and an animation.</strong>{' '}
            Load <em>Transitions &amp; keyframe animation</em>. The pink circle pulses
            immediately and forever without you doing anything; the button only grows when
            you hover. That is the whole distinction — a <code>@keyframes</code> animation
            runs on its own schedule, while a <code>transition</code> is inert until some
            property actually changes. Delete the <code>transition</code> line from{' '}
            <code>.grow</code> and hover again: the size still changes, just instantly.
            Transitions never cause a change; they only smooth one that was already
            happening.
          </li>
        </ol>
      </InfoBox>
      <CssPlaygroundWidget />

      <h2>The three layout systems, in one sentence each</h2>
      <p>
        Nearly every layout question comes down to picking the right one of these:
      </p>
      <ul>
        <li>
          <strong>Flexbox</strong> — lay items out along <em>one</em> axis and
          distribute the leftover space. Reach for it for toolbars, button rows,
          centering, and &quot;push this one thing to the right&quot;.
        </li>
        <li>
          <strong>Grid</strong> — define rows <em>and</em> columns up front, then
          place items into them. Reach for it for page skeletons, card galleries,
          and anything where things need to line up in both directions.
        </li>
        <li>
          <strong>Normal flow</strong> — the default. Block elements stack, inline
          elements run along the line. Most text does not need a layout system at all.
        </li>
      </ul>

      <h2>Centering, the modern way</h2>
      <p>
        The old &quot;how do I vertically center a div&quot; joke is genuinely dead.
        Two lines with flexbox, or one with grid:
      </p>
      <CodeBlock language="css" title="Flexbox">
{`.parent {
  display: flex;
  align-items: center;      /* cross axis (vertical, by default) */
  justify-content: center;  /* main axis (horizontal, by default) */
}`}
      </CodeBlock>
      <CodeBlock language="css" title="Grid — shorter still">
{`.parent {
  display: grid;
  place-items: center;  /* shorthand for align-items + justify-items */
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Custom properties are real variables, not preprocessor find-and-replace">
        <p>
          Load the <strong>Custom properties</strong> example and change{' '}
          <code>--radius</code> on <code>:root</code>. Every element updates, because
          CSS variables are resolved by the browser at <em>runtime</em> and they{' '}
          <strong>inherit</strong> — redefining <code>--chip-color</code> on a child
          only affects that subtree. That inheritance is what makes them able to do
          things a Sass <code>$variable</code> fundamentally cannot: theming, media-query
          overrides, and per-component values, all without recompiling. The next lesson
          covers exactly where that line falls.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
