import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Migration() {
  return (
    <LessonLayout
      title="Migrating 2 → 3 → 4, In Order"
      sectionId="springboot2"
      lessonIndex={7}
      prev={{ path: '/springboot2/actuator', label: 'Actuator & Metrics Before the Rename' }}
      next={{ path: '/springboot2/cheatsheet', label: '📋 Spring Boot 2 Cheat Sheet' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Migration;
