import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

interface PosterCodeProps {
  language?: string;
  children: string;
}

/**
 * Renders with useInlineStyles=false so Prism emits `class="token keyword"`
 * etc. instead of baked-in inline colors — poster.css then themes those
 * classes per mode (vivid dark / ink-minimal light / grayscale-safe print),
 * which plain per-render inline styles couldn't respond to.
 */
export default function PosterCode({ language = 'tsx', children }: PosterCodeProps) {
  return (
    <div className="poster-code-wrap">
      <SyntaxHighlighter
        language={language}
        style={{}}
        useInlineStyles={false}
        showLineNumbers={false}
        PreTag="pre"
        codeTagProps={{ className: 'poster-code' }}
      >
        {children.trim()}
      </SyntaxHighlighter>
    </div>
  );
}
