import type { ReactNode } from 'react';

const variants = {
  info:     { bg: '#1a2744', border: '#2563eb', icon: 'ℹ️',  label: 'Info' },
  tip:      { bg: '#1a3329', border: '#16a34a', icon: '💡',  label: 'Tip' },
  warning:  { bg: '#3d2f14', border: '#d97706', icon: '⚠️',  label: 'Warning' },
  danger:   { bg: '#3b1a1a', border: '#dc2626', icon: '🚫',  label: 'Danger' },
  note:     { bg: '#2a1f44', border: '#7c3aed', icon: '📝',  label: 'Note' },
  success:  { bg: '#1a3329', border: '#4ade80', icon: '✅',  label: 'Success' },
  question: { bg: '#1a2744', border: '#22d3ee', icon: '🤔',  label: 'Think About It' },
} as const;

export type InfoBoxVariant = keyof typeof variants;

export interface InfoBoxProps {
  variant?: InfoBoxVariant;
  title?: string;
  children: ReactNode;
}

export function InfoBox({ variant = 'info', title, children }: InfoBoxProps) {
  const v = variants[variant];

  return (
    <div style={{
      background: v.bg,
      border: `1px solid ${v.border}40`,
      borderLeft: `4px solid ${v.border}`,
      borderRadius: '8px',
      padding: '1rem 1.25rem',
      margin: '1rem 0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '0.5rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: v.border,
      }}>
        <span>{v.icon}</span>
        <span>{title ?? v.label}</span>
      </div>
      <div style={{ color: '#c4c8db', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

export default InfoBox;
