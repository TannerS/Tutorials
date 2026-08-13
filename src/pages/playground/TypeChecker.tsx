import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';
import TsTypeChecker from '../../components/TsTypeChecker';

export default function TypeCheckerPlayground() {
  return (
    <LessonLayout
      title="🔍 TypeScript Type Checker"
      sectionId="playground"
      lessonIndex={1}
      prev={{ path: '/playground/compiler', label: 'JS/TS Compiler Comparison' }}
      next={{ path: '/playground/jsx-compiler', label: 'JSX Compiler Comparison' }}
    >
      <p>
        This is real type-checking, not a linter guessing at patterns — it runs
        TypeScript&apos;s actual language service against your code, the same
        engine your editor uses. Pick an example with a deliberate bug, or write
        your own, and see the exact diagnostics TypeScript produces: what&apos;s
        wrong, and precisely where.
      </p>

      <InfoBox variant="note" title="Single-file checking">
        <p>
          This checks one file in isolation — no imports between files, but it
          does have the real <code>lib.d.ts</code> definitions (so it knows about{' '}
          <code>Array</code>, <code>Promise</code>, DOM types, and everything else
          the standard library provides). That covers the overwhelming majority of
          "did I get this type right?" questions. Click any diagnostic in the list
          to jump the editor&apos;s selection straight to the problem.
        </p>
      </InfoBox>

      <h2>Type checker</h2>
      <InfoBox variant="question" title="What to try, and what to notice">
        <p>
          Work through the examples in this order — each one is a different{' '}
          <em>kind</em> of mistake, and the useful skill is recognising which kind you
          are looking at from the message alone:
        </p>
        <ol>
          <li>
            <strong>Wrong argument type</strong> — the everyday case. Note that the
            message names both types (&quot;is not assignable to&quot;) and points at
            the <em>argument</em>, not the function. When you get this in real code,
            the bug is usually at the call site, exactly where TypeScript is pointing.
          </li>
          <li>
            <strong>Object missing a required property</strong> — reads{' '}
            <code>Property &apos;retries&apos; is missing… but required in type
            &apos;Config&apos;</code>. The error lands on the <em>variable</em>, not the
            missing line, because TypeScript checks the whole object literal against{' '}
            <code>Config</code> as one unit.
          </li>
          <li>
            <strong>Generic constraint violation</strong> — the one people find
            cryptic. <code>Type &apos;number&apos; does not satisfy the constraint
            &apos;{'{ length: number; }'}&apos;</code> is not about your arguments; it is
            about the type argument you wrote in angle brackets. Read
            &quot;satisfy the constraint&quot; as &quot;this type is missing something{' '}
            <code>extends</code> demanded&quot; — here, <code>number</code> has no{' '}
            <code>.length</code>.
          </li>
        </ol>
      </InfoBox>
      <TsTypeChecker />

      <InfoBox variant="tip" title="Strict mode matters">
        <p>
          Toggle <strong>Strict mode</strong> off on the &quot;Possibly null/undefined&quot;
          example — the error disappears entirely, because without{' '}
          <code>strictNullChecks</code> (bundled into <code>strict</code>),
          TypeScript treats <code>undefined</code> as assignable to anything.
          That single flag is responsible for catching an enormous share of
          real-world null-reference bugs before they ship — it&apos;s why every
          lesson&apos;s example <code>tsconfig.json</code> across this site turns
          it on.
        </p>
        <p>
          <strong>Now look at what did not change.</strong> The code is still just as
          broken: <code>findUser(5)</code> indexes past the end of a two-element array,
          so <code>user</code> really is <code>undefined</code> and{' '}
          <code>user.name</code> really does throw at runtime. Turning off the flag did
          not fix a bug — it removed the only warning you were going to get. A clean
          type-check means &quot;no contradiction I was configured to look for,&quot; not
          &quot;this code works.&quot;
        </p>
        <p>
          Toggle strict off on the <em>Object missing a required property</em> example
          and the error stubbornly stays. <code>strict</code> is not a master switch for
          type-checking; it is a bundle of specific extra checks, mostly about{' '}
          <code>null</code>/<code>undefined</code> and implicit <code>any</code>.
          Structural mismatches like a missing required property are caught either way.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
