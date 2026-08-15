import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoSecureRandom() {
  return (
    <LessonLayout
      title="Secure Random Number Generation"
      sectionId="cryptography"
      lessonIndex={10}
      prev={{ path: '/cryptography/key-wrapping', label: 'Key Wrapping & Envelope Encryption' }}
      next={{ path: '/cryptography/secure-login-flow', label: 'Anatomy of a Secure Login' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
