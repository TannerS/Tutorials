import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoCheatsheet() {
  return (
    <LessonLayout
      title="📋 Cheat Sheet"
      sectionId="cryptography"
      lessonIndex={15}
      prev={{ path: '/cryptography/mistakes', label: 'Common Cryptographic Mistakes' }}
      next={null}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
