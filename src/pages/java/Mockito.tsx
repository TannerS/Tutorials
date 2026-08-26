import LessonLayout from '../../components/LessonLayout';

function JavaMockito() {
  return (
    <LessonLayout
      title="Mockito in Practice"
      sectionId="java"
      lessonIndex={15}
      prev={{ path: '/java/testing-basics', label: 'Unit Testing Fundamentals — Dummies, Stubs, Spies, Mocks' }}
      next={{ path: '/java/cheatsheet', label: 'Java Cheat Sheet' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default JavaMockito;
