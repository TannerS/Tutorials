import type { ReactNode } from 'react';

const variants = {
  info:     { bg: 'var(--accent-blue-bg)',   border: 'var(--accent-blue)',    icon: 'ℹ️',  label: 'Info' },
  tip:      { bg: 'var(--accent-green-bg)',  border: 'var(--accent-green)',   icon: '💡',  label: 'Tip' },
  warning:  { bg: 'var(--accent-orange-bg)', border: 'var(--accent-amber-deep)', icon: '⚠️',  label: 'Warning' },
  danger:   { bg: 'var(--accent-red-bg)',    border: 'var(--accent-red-deep)', icon: '🚫',  label: 'Danger' },
  note:     { bg: 'var(--accent-purple-bg)', border: 'var(--accent-purple)',  icon: '📝',  label: 'Note' },
  success:  { bg: 'var(--accent-green-bg)',  border: 'var(--accent-green)',   icon: '✅',  label: 'Success' },
  question: { bg: 'var(--accent-blue-bg)',   border: 'var(--accent-cyan)',    icon: '🤔',  label: 'Think About It' },
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
      border: '1px solid var(--border-color)',
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
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

export default InfoBox;
