import LessonLayout from '../../components/LessonLayout';

function FromScratchStorage() {
  return (
    <LessonLayout
      title="Build a Key-Value Store with a Write-Ahead Log"
      sectionId="from-scratch"
      lessonIndex={2}
      prev={{ path: '/from-scratch/scheduler', label: 'Build a Task Scheduler' }}
      next={{ path: '/from-scratch/httpserver', label: 'Build an HTTP Server from Sockets' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default FromScratchStorage;
