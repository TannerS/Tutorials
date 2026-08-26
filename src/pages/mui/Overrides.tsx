import LessonLayout from '../../components/LessonLayout';

function MuiOverrides() {
  return (
    <LessonLayout
      title="Overriding Component Styles"
      sectionId="mui"
      lessonIndex={3}
      prev={{ path: '/mui/theming', label: 'Theming & the Theme Object' }}
      next={{ path: '/mui/styled-v5', label: 'v5 and Beyond — styled() and sx' }}
    >
      <p>Coming soon.</p>
    </LessonLayout>
  );
}

export default MuiOverrides;
