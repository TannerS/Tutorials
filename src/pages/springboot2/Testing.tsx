import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Testing() {
  return (
    <LessonLayout
      title="Testing in Boot 2 — @MockBean and Friends"
      sectionId="springboot2"
      lessonIndex={5}
      prev={{ path: '/springboot2/config', label: 'Configuration & Properties That Moved' }}
      next={{ path: '/springboot2/actuator', label: 'Actuator & Metrics Before the Rename' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Testing;
