import LessonLayout from '../../components/LessonLayout';
import InfoBox from '../../components/InfoBox';
import TypeScriptPlayground from '../../components/TypeScriptPlayground';

export default function TsPlayground() {
  return (
    <LessonLayout
      title="TypeScript Playground — Interactive Challenges"
      sectionId="typescript"
      lessonIndex={11}
      prev={{ path: '/typescript/tsconfig', label: 'tsconfig Mastery' }}
    >
      <p>
        Eight hands-on challenges covering the TypeScript concepts that come up most in real codebases.
        Each challenge gives you broken or untyped starter code — your job is to fix the TypeScript errors
        until the red squiggles disappear and the preview shows ✅.
      </p>

      <InfoBox variant="info" title="How it works">
        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 2 }}>
          <li><strong>Red squiggles</strong> in the editor are TypeScript errors — hover them to read the exact message.</li>
          <li><strong>The preview panel</strong> shows runtime output. A ✅ there means the logic is correct too.</li>
          <li><strong>The console</strong> (button at bottom of editor) shows <code>console.log</code> output — useful for verifying values.</li>
          <li>When squiggles are gone and preview shows ✅, hit <strong>Mark Complete</strong>. Progress is saved locally.</li>
          <li>Click any <strong>progress dot</strong> at the top to jump to a specific challenge.</li>
        </ul>
      </InfoBox>

      <TypeScriptPlayground />
    </LessonLayout>
  );
}
