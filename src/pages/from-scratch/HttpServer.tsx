import LessonLayout from '../../components/LessonLayout';

function FromScratchHttpServer() {
  return (
    <LessonLayout
      title="Build an HTTP Server from Sockets"
      sectionId="from-scratch"
      lessonIndex={3}
      prev={{ path: '/from-scratch/storage', label: 'Build a Key-Value Store with a Write-Ahead Log' }}
      next={{ path: '/from-scratch/consensus', label: 'Build Raft: Leader Election & Log Replication' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default FromScratchHttpServer;
