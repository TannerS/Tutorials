import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilitySlos() {
  return (
    <LessonLayout
      title="SLIs, SLOs & Error Budgets"
      sectionId="observability"
      lessonIndex={1}
      prev={{ path: '/observability/three-pillars', label: 'The Three Pillars: Metrics, Logs, Traces' }}
      next={{ path: '/observability/tracing', label: 'Distributed Tracing Design' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
