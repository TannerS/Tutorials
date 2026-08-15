import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddSpringBoot() {
  return (
    <LessonLayout
      title="DDD in a Spring Boot Codebase"
      sectionId="ddd"
      lessonIndex={5}
      prev={{ path: '/ddd/event-storming', label: 'Event Storming: Discovering Bounded Contexts' }}
      next={{ path: '/ddd/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
