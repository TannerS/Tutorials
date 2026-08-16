import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Collaboration() {
  return (
    <LessonLayout
      title="Collaborative Workflows"
      sectionId="version-control"
      lessonIndex={2}
      prev={{ path: '/version-control/branching', label: 'Branching & Rebase Strategies' }}
      next={{ path: '/version-control/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
