import InfoBox from '../InfoBox';

export interface MtlsExplainerProps {
  /** Shorter version for pages where mTLS is a supporting detail, not the topic. */
  compact?: boolean;
}

export default function MtlsExplainer({ compact = false }: MtlsExplainerProps) {
  return (
    <InfoBox variant="info" title="What mTLS Actually Is">
      <p>
        Standard TLS only authenticates the <strong>server</strong> — your browser checks the
        bank's certificate, but the bank has no cryptographic proof of who's connecting. <strong>
        Mutual TLS (mTLS)</strong> requires <em>both</em> sides to present a certificate signed by
        a trusted CA, so the server verifies the client's identity too, before any data moves.
      </p>
      {!compact && (
        <p style={{ marginTop: '0.5rem' }}>
          This is why service meshes (Istio, Linkerd) default to it: every sidecar proxy holds a
          short-lived certificate issued by the mesh's own internal CA, so two services can prove
          their identity to each other without a shared secret or an API key that could leak.
        </p>
      )}
    </InfoBox>
  );
}
