import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddEventStorming() {
  return (
    <LessonLayout
      title="Event Storming: Discovering Bounded Contexts"
      sectionId="ddd"
      lessonIndex={4}
      prev={{ path: '/ddd/domain-events', label: 'Domain Events & the Repository Pattern' }}
      next={{ path: '/ddd/spring-boot', label: 'DDD in a Spring Boot Codebase' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
