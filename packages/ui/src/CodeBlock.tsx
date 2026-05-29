import { useState, type CSSProperties } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const customStyle = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: '#1a1d2e',
    borderRadius: '8px',
    padding: '1.25rem',
    margin: '1rem 0',
    fontSize: '0.875rem',
    border: '1px solid #2a2e42',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({
  children,
  language = 'java',
  title,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const titleStyle: CSSProperties | undefined = title
    ? { borderRadius: '0 0 8px 8px', marginTop: 0 }
    : undefined;

  return (
    <div style={{ position: 'relative', margin: '1rem 0' }}>
      {title && (
        <div style={{
          background: '#252a3f',
          padding: '0.5rem 1rem',
          borderRadius: '8px 8px 0 0',
          border: '1px solid #2a2e42',
          borderBottom: 'none',
          fontSize: '0.8rem',
          color: '#9399b2',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span>{title}</span>
          <span style={{
            background: '#1a1d2e',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: '#5b9cf6',
          }}>{language}</span>
        </div>
      )}
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          top: title ? '3rem' : '0.5rem',
          right: '0.75rem',
          background: copied ? '#4ade80' : '#252a3f',
          color: copied ? '#0f1117' : '#9399b2',
          border: '1px solid #2a2e42',
          borderRadius: '4px',
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: '0.7rem',
          fontFamily: "'JetBrains Mono', monospace",
          zIndex: 10,
          transition: 'all 0.2s ease',
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language={language}
        style={customStyle}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={titleStyle ?? {}}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;
