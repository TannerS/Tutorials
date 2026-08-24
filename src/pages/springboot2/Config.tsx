import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Config() {
  return (
    <LessonLayout
      title="Configuration & Properties That Moved"
      sectionId="springboot2"
      lessonIndex={4}
      prev={{ path: '/springboot2/data', label: 'Spring Data & JPA on Hibernate 5' }}
      next={{ path: '/springboot2/testing', label: 'Testing in Boot 2 — @MockBean and Friends' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Config;
