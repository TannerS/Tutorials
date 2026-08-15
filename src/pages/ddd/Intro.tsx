import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddIntro() {
  return (
    <LessonLayout
      title="Why Domain-Driven Design"
      sectionId="ddd"
      lessonIndex={0}
      prev={null}
      next={{ path: '/ddd/strategic', label: 'Strategic DDD: Bounded Contexts & Context Mapping' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
