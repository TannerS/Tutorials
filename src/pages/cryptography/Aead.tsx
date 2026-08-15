import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoAead() {
  return (
    <LessonLayout
      title="Authenticated Encryption (AEAD)"
      sectionId="cryptography"
      lessonIndex={3}
      prev={{ path: '/cryptography/hashing', label: 'Hashing & Data Integrity' }}
      next={{ path: '/cryptography/signatures', label: 'Digital Signatures' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
