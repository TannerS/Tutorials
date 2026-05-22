import { useState } from 'react';
import CodeBlock from './CodeBlock';

const LABELS = ['A', 'B', 'C', 'D'];

export default function InteractiveChallenge({
  question,
  options,
  correctIndex,
  explanation,
  code,
  language = 'java',
}) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
  };

  const isAnswered = selected !== null;
  const isCorrect = selected === correctIndex;

  return (
    <div style={{
      margin: '2rem 0',
      background: '#1a1d2e',
      border: '1px solid #a78bfa',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: '#2a1f44',
        padding: '0.75rem 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        borderBottom: '1px solid #3d2e5a',
      }}>
        <span style={{ fontSize: '1.1rem' }}>🧩</span>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Challenge</span>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem' }}>
        <p style={{ color: '#e4e6f0', marginBottom: '1rem', fontWeight: 500 }}>{question}</p>

        {code && (
          <CodeBlock language={language} showLineNumbers={false}>
            {code}
          </CodeBlock>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          {options.map((opt, i) => {
            let bg = '#252a3f';
            let border = '#2a2e42';
            let color = '#e4e6f0';
            if (isAnswered) {
              if (i === correctIndex) { bg = '#1a3329'; border = '#4ade80'; color = '#4ade80'; }
              else if (i === selected) { bg = '#3b1a1a'; border = '#f87171'; color = '#f87171'; }
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} style={{
                background: bg, border: `1px solid ${border}`, borderRadius: '8px',
                padding: '0.75rem 1rem', cursor: isAnswered ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                color, textAlign: 'left', transition: 'all 0.15s ease',
                fontFamily: 'inherit', fontSize: '0.9rem',
              }}>
                <span style={{
                  minWidth: '24px', height: '24px', borderRadius: '50%',
                  background: '#1a1d2e', border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: '#5b9cf6',
                }}>{LABELS[i]}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: isCorrect ? '#1a3329' : '#3b1a1a',
            border: `1px solid ${isCorrect ? '#4ade80' : '#f87171'}`,
            borderRadius: '8px',
          }}>
            <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: isCorrect ? '#4ade80' : '#f87171' }}>
              {isCorrect ? '✅ Correct!' : '❌ Not quite'}
            </div>
            <div style={{ color: '#c4c8db', fontSize: '0.9rem' }}>{explanation}</div>
          </div>
        )}
      </div>
    </div>
  );
}
