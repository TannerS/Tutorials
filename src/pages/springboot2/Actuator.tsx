import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Actuator() {
  return (
    <LessonLayout
      title="Actuator & Metrics Before the Rename"
      sectionId="springboot2"
      lessonIndex={6}
      prev={{ path: '/springboot2/testing', label: 'Testing in Boot 2 — @MockBean and Friends' }}
      next={{ path: '/springboot2/migration', label: 'Migrating 2 → 3 → 4, In Order' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Actuator;
