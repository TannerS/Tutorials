import { useState } from 'react';
import CodeBlock from './CodeBlock';

interface InteractiveChallengeProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  code?: string;
  language?: string;
}

export default function InteractiveChallenge({
  question, options, correctIndex, explanation, code, language = 'java',
}: InteractiveChallengeProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const handleSelect = (index: number) => {
    setSelected(index);
    setShowExplanation(true);
  };

  const isCorrect = selected === correctIndex;

  return (
    <div className="no-print" style={{
      margin: '1.5rem 0',
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: 'var(--accent-purple)',
      }}>
        <span>🧩</span> Challenge
      </div>
      <div style={{ padding: '1.25rem' }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 500, marginBottom: '1rem' }}>{question}</p>
        {code && <CodeBlock language={language} showLineNumbers={false}>{code}</CodeBlock>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {options.map((option, idx) => {
            let bg = 'var(--bg-card)';
            let border = 'var(--border-color)';
            if (selected !== null) {
              if (idx === correctIndex) { bg = 'var(--accent-green-bg)'; border = 'var(--accent-green)'; }
              else if (idx === selected) { bg = 'var(--accent-red-bg)'; border = 'var(--accent-red)'; }
            }
            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={selected !== null}
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'var(--text-primary)',
                  cursor: selected !== null ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontFamily: option.startsWith('`') ? "'JetBrains Mono', monospace" : 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ color: 'var(--accent-blue)', marginRight: '0.5rem', fontWeight: 600 }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                {option}
              </button>
            );
          })}
        </div>
        {showExplanation && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: isCorrect ? 'var(--accent-green-bg)' : 'var(--accent-red-bg)',
            border: `1px solid ${isCorrect ? 'var(--accent-green)' : 'var(--accent-red)'}`,
            borderRadius: '8px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {isCorrect ? '✅ Correct!' : '❌ Not quite.'}
            </strong>{' '}
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}
