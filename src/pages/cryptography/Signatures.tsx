import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoSignatures() {
  return (
    <LessonLayout
      title="Digital Signatures"
      sectionId="cryptography"
      lessonIndex={4}
      prev={{ path: '/cryptography/aead', label: 'Authenticated Encryption (AEAD)' }}
      next={{ path: '/cryptography/signing-files', label: 'Signing Files & Software' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
