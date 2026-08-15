import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilityIncidents() {
  return (
    <LessonLayout
      title="Alerting & Incident Response"
      sectionId="observability"
      lessonIndex={3}
      prev={{ path: '/observability/tracing', label: 'Distributed Tracing Design' }}
      next={{ path: '/observability/cheatsheet', label: '📋 Cheat Sheet' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
