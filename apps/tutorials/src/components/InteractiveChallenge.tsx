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
    <div style={{
      margin: '1.5rem 0',
      background: '#161822',
      borderRadius: '12px',
      border: '1px solid #2a2e42',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #2a2e42',
        background: '#1a1d2e',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: 600,
        fontSize: '0.9rem',
        color: '#a78bfa',
      }}>
        <span>🧩</span> Challenge
      </div>
      <div style={{ padding: '1.25rem' }}>
        <p style={{ color: '#e4e6f0', fontWeight: 500, marginBottom: '1rem' }}>{question}</p>
        {code && <CodeBlock language={language} showLineNumbers={false}>{code}</CodeBlock>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {options.map((option, idx) => {
            let bg = '#1a1d2e';
            let border = '#2a2e42';
            if (selected !== null) {
              if (idx === correctIndex) { bg = '#1a3329'; border = '#4ade80'; }
              else if (idx === selected) { bg = '#3b1a1a'; border = '#f87171'; }
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
                  color: '#e4e6f0',
                  cursor: selected !== null ? 'default' : 'pointer',
                  textAlign: 'left',
                  fontSize: '0.9rem',
                  fontFamily: option.startsWith('`') ? "'JetBrains Mono', monospace" : 'inherit',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ color: '#5b9cf6', marginRight: '0.5rem', fontWeight: 600 }}>
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
            background: isCorrect ? '#1a3329' : '#3b1a1a',
            border: `1px solid ${isCorrect ? '#4ade8040' : '#f8717140'}`,
            borderRadius: '8px',
            color: '#c4c8db',
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}>
            <strong style={{ color: isCorrect ? '#4ade80' : '#f87171' }}>
              {isCorrect ? '✅ Correct!' : '❌ Not quite.'}
            </strong>{' '}
            {explanation}
          </div>
        )}
      </div>
    </div>
  );
}
