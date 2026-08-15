import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoHashing() {
  return (
    <LessonLayout
      title="Hashing & Data Integrity"
      sectionId="cryptography"
      lessonIndex={2}
      prev={{ path: '/cryptography/encryption', label: 'Encryption Fundamentals — AES, RSA, ECC' }}
      next={{ path: '/cryptography/aead', label: 'Authenticated Encryption (AEAD)' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
