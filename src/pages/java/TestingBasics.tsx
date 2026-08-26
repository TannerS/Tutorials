import LessonLayout from '../../components/LessonLayout';

function JavaTestingBasics() {
  return (
    <LessonLayout
      title="Unit Testing Fundamentals — Dummies, Stubs, Spies, Mocks"
      sectionId="java"
      lessonIndex={14}
      prev={{ path: '/java/build-tools', label: 'Build Tools: Maven & Gradle' }}
      next={{ path: '/java/mockito', label: 'Mockito in Practice' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default JavaTestingBasics;
