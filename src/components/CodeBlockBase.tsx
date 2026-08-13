import { useState, type CSSProperties } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

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

  const preStyle: CSSProperties = {
    background: 'var(--bg-code)',
    borderRadius: title ? '0 0 8px 8px' : '8px',
    padding: '1.25rem',
    margin: '1rem 0',
    marginTop: 0,
    fontSize: '0.875rem',
    border: '1px solid var(--border-color)',
    borderTop: title ? 'none' : '1px solid var(--border-color)',
  };

  return (
    <div className="code-block" style={{ position: 'relative', margin: '1rem 0' }}>
      {title && (
        <div style={{
          background: 'var(--bg-active)',
          padding: '0.5rem 1rem',
          borderRadius: '8px 8px 0 0',
          border: '1px solid var(--border-color)',
          borderBottom: 'none',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span>{title}</span>
          <span style={{
            background: 'var(--bg-card)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'var(--accent-blue)',
          }}>{language}</span>
        </div>
      )}
      <button
        onClick={handleCopy}
        className="no-print"
        style={{
          position: 'absolute',
          top: title ? '3rem' : '0.5rem',
          right: '0.75rem',
          background: copied ? 'var(--accent-green)' : 'var(--bg-active)',
          color: copied ? 'var(--bg-primary)' : 'var(--text-secondary)',
          border: '1px solid var(--border-color)',
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
        style={{}}
        useInlineStyles={false}
        showLineNumbers={showLineNumbers}
        wrapLines
        customStyle={preStyle}
        codeTagProps={{ className: 'site-code', style: { fontFamily: "'JetBrains Mono', monospace" } }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}

export default CodeBlock;
