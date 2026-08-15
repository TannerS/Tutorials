import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function ObservabilityCheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="observability"
      lessonIndex={4}
      prev={{ path: '/observability/incidents', label: 'Alerting & Incident Response' }}
      next={null}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
