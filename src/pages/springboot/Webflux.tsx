import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function Webflux() {
  return (
    <LessonLayout
      title="Reactive Programming with WebFlux"
      sectionId="springboot"
      lessonIndex={16}
      prev={{ path: '/springboot/observability', label: 'Observability' }}
      next={{ path: '/springboot/resilience', label: 'Resilience4j & Circuit Breakers' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
