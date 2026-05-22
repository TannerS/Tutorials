const variants = {
  info:     { bg: '#1a2744', border: '#2563eb', icon: 'ℹ️', label: 'Info' },
  tip:      { bg: '#1a3329', border: '#16a34a', icon: '💡', label: 'Tip' },
  warning:  { bg: '#3d2f14', border: '#d97706', icon: '⚠️', label: 'Warning' },
  danger:   { bg: '#3b1a1a', border: '#dc2626', icon: '🚫', label: 'Danger' },
  note:     { bg: '#2a1f44', border: '#7c3aed', icon: '📝', label: 'Note' },
  success:  { bg: '#1a3329', border: '#4ade80', icon: '✅', label: 'Success' },
  question: { bg: '#1a2744', border: '#22d3ee', icon: '🤔', label: 'Think About It' },
};

export default function InfoBox({ variant = 'info', title, children }) {
  const v = variants[variant] || variants.info;
  return (
    <div style={{
      margin: '1.5rem 0',
      background: v.bg,
      borderLeft: `4px solid ${v.border}`,
      borderRadius: '0 8px 8px 0',
      padding: '1rem 1.25rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: title || children ? '0.5rem' : 0,
        fontWeight: 600, fontSize: '0.9rem', color: '#e4e6f0',
      }}>
        <span>{v.icon}</span>
        <span>{title || v.label}</span>
      </div>
      <div style={{ fontSize: '0.9rem', color: '#c4c8db', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}
