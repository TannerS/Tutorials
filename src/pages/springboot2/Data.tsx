import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Data() {
  return (
    <LessonLayout
      title="Spring Data & JPA on Hibernate 5"
      sectionId="springboot2"
      lessonIndex={3}
      prev={{ path: '/springboot2/security', label: 'Security the Boot 2 Way' }}
      next={{ path: '/springboot2/config', label: 'Configuration & Properties That Moved' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Data;
