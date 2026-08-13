import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';
import SassPlaygroundWidget from '../../components/SassPlayground';

export default function SassPlaygroundLesson() {
  return (
    <LessonLayout
      title="💅 Sass/SCSS Playground"
      sectionId="playground"
      lessonIndex={4}
      prev={{ path: '/playground/css-playground', label: 'CSS Playground' }}
      next={{ path: '/playground/sql-playground', label: 'SQL Playground' }}
    >
      <p>
        This runs the real Dart Sass compiler in your browser — the same{' '}
        <code>sass</code> package your build pipeline uses. Write SCSS on the
        left, see the exact CSS it emits on the right. The most useful habit
        when learning a preprocessor is checking what your abstraction actually
        produces, because the output is what ships.
      </p>

      <InfoBox variant="note" title="One file, compiled in isolation">
        <p>
          This compiles a single string with <code>compileString()</code>, so
          there is no file system behind it — <code>@use &quot;./variables&quot;</code>{' '}
          or <code>@import</code> of your own partials can&apos;t resolve here.
          Sass&apos;s <strong>built-in</strong> modules do work, because they ship
          inside the compiler: <code>sass:math</code>, <code>sass:color</code>,{' '}
          <code>sass:string</code>, <code>sass:map</code>, and{' '}
          <code>sass:list</code>. The <strong>@use</strong> example demonstrates
          those.
        </p>
      </InfoBox>

      <h2>Playground</h2>
      <SassPlaygroundWidget />

      <h2>The one distinction worth memorizing</h2>
      <p>
        A <strong>mixin</strong> emits declarations; a <strong>function</strong>{' '}
        returns a value. If you want a block of CSS, you want a mixin. If you
        want something to put on the right-hand side of a colon, you want a
        function.
      </p>
      <CodeBlock language="scss" title="Mixin — emits declarations">
{`@mixin card {
  padding: 1rem;
  border-radius: 8px;
}

.panel { @include card; }`}
      </CodeBlock>
      <CodeBlock language="scss" title="Function — returns a value">
{`@use "sass:math";

@function rem($px) {
  @return math.div($px, 16px) * 1rem;
}

.panel { font-size: rem(24px); }  // font-size: 1.5rem;`}
      </CodeBlock>

      <h2>$variables vs. CSS custom properties</h2>
      <p>
        This trips people up constantly, and the playground makes the answer
        obvious: compile the first example and look at what survives.
      </p>
      <ul>
        <li>
          <code>$brand</code> is <strong>compile-time</strong>. Sass substitutes
          its value and the variable itself never reaches the browser. You cannot
          change it at runtime, read it from JavaScript, or override it inside a
          media query without recompiling.
        </li>
        <li>
          <code>--brand</code> is <strong>runtime</strong>. It appears in the
          output, it <em>inherits</em>, and it can be reassigned per-component,
          per-theme, or from JS with <code>element.style.setProperty()</code>.
        </li>
      </ul>
      <p>
        The modern convention on most teams: use CSS custom properties for
        anything themeable, and reserve <code>$variables</code> for values Sass
        itself needs to compute with — breakpoint widths inside{' '}
        <code>@media</code> queries, map keys, and loop bounds, none of which
        accept <code>var()</code>.
      </p>

      <InfoBox variant="warning" title="@import is dead — use @use">
        <p>
          Sass&apos;s original <code>@import</code> is deprecated and slated for
          removal. It dumped everything into one global namespace, so a variable
          defined in any file could be silently clobbered by any other.{' '}
          <code>@use</code> replaces it with real modules: each file is loaded
          once, and its members are namespaced (<code>math.div</code>, not a bare{' '}
          <code>div</code>). <code>@forward</code> is its companion, for re-exporting
          a set of partials from a single entry point.
        </p>
      </InfoBox>

      <InfoBox variant="tip" title="Try minifying">
        <p>
          Switch <strong>Output style</strong> to <em>Compressed</em> on the maps
          example. That is what a production build actually emits — the same rules,
          whitespace stripped. It&apos;s also a good reminder that a tidy nested
          source and a small CSS bundle are unrelated: nesting six levels deep
          generates six-selector-long rules that compress no better than if you
          had written them out by hand.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
