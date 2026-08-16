import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Cheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="version-control"
      lessonIndex={3}
      prev={{ path: '/version-control/collaboration', label: 'Collaborative Workflows' }}
      next={null}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
