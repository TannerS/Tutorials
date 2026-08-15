import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function DddCheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="ddd"
      lessonIndex={6}
      prev={{ path: '/ddd/spring-boot', label: 'DDD in a Spring Boot Codebase' }}
      next={null}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
