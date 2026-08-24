import LessonLayout from '../../components/LessonLayout';

function SpringBoot2Security() {
  return (
    <LessonLayout
      title="Security the Boot 2 Way"
      sectionId="springboot2"
      lessonIndex={2}
      prev={{ path: '/springboot2/javax', label: 'The javax World — Namespace, JPA, Servlets' }}
      next={{ path: '/springboot2/data', label: 'Spring Data & JPA on Hibernate 5' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default SpringBoot2Security;
