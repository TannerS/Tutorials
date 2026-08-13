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
      <TsTypeChecker />

      <InfoBox variant="tip" title="Strict mode matters">
        <p>
          Toggle <strong>Strict mode</strong> off on the "Possibly null/undefined"
          example — the error disappears entirely, because without{' '}
          <code>strictNullChecks</code> (bundled into <code>strict</code>),
          TypeScript treats <code>undefined</code> as assignable to anything.
          That single flag is responsible for catching an enormous share of
          real-world null-reference bugs before they ship — it&apos;s why every
          lesson&apos;s example <code>tsconfig.json</code> across this site turns
          it on.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}
