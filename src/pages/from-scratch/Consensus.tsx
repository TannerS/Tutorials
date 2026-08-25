import LessonLayout from '../../components/LessonLayout';

function FromScratchConsensus() {
  return (
    <LessonLayout
      title="Build Raft: Leader Election & Log Replication"
      sectionId="from-scratch"
      lessonIndex={4}
      prev={{ path: '/from-scratch/httpserver', label: 'Build an HTTP Server from Sockets' }}
      next={null}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default FromScratchConsensus;
