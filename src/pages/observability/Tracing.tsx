import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilityTracing() {
  return (
    <LessonLayout
      title="Distributed Tracing Design"
      sectionId="observability"
      lessonIndex={2}
      prev={{ path: '/observability/slos', label: 'SLIs, SLOs & Error Budgets' }}
      next={{ path: '/observability/incidents', label: 'Alerting & Incident Response' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
