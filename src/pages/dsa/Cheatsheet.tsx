import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="dsa"
      lessonIndex={9}
      prev={{ path: '/dsa/patterns', label: 'Common Interview Patterns' }}
      next={null}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
