import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';

export default function CryptoSigningFiles() {
  return (
    <LessonLayout
      title="Signing Files & Software"
      sectionId="cryptography"
      lessonIndex={5}
      prev={{ path: '/cryptography/signatures', label: 'Digital Signatures' }}
      next={{ path: '/cryptography/certificate-issuance', label: 'How a Certificate Is Actually Made' }}
    >
      <p>
        TODO — this lesson has not been written yet.
      </p>
    </LessonLayout>
  );
}
