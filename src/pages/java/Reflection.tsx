import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Reflection() {
  return (
    <LessonLayout
      title="Reflection & Annotations"
      sectionId="java"
      lessonIndex={12}
      prev={{ path: '/java/jvm-internals', label: 'JVM Internals & Garbage Collection' }}
      next={{ path: '/java/build-tools', label: 'Build Tools: Maven & Gradle' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
