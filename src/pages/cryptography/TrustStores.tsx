import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoTrustStores() {
  return (
    <LessonLayout
      title="Where Keys & Certs Actually Live"
      sectionId="cryptography"
      lessonIndex={8}
      prev={{ path: '/cryptography/tls', label: 'TLS & HTTPS' }}
      next={{ path: '/cryptography/key-wrapping', label: 'Key Wrapping & Envelope Encryption' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
