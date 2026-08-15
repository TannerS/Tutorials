import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoKeyWrapping() {
  return (
    <LessonLayout
      title="Key Wrapping & Envelope Encryption"
      sectionId="cryptography"
      lessonIndex={9}
      prev={{ path: '/cryptography/trust-stores', label: 'Where Keys & Certs Actually Live' }}
      next={{ path: '/cryptography/secure-random', label: 'Secure Random Number Generation' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
