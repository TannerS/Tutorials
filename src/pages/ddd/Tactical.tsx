import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddTactical() {
  return (
    <LessonLayout
      title="Tactical DDD: Entities, Value Objects & Aggregates"
      sectionId="ddd"
      lessonIndex={2}
      prev={{ path: '/ddd/strategic', label: 'Strategic DDD: Bounded Contexts & Context Mapping' }}
      next={{ path: '/ddd/domain-events', label: 'Domain Events & the Repository Pattern' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
