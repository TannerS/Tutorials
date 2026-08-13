import { Sandpack, type SandpackPredefinedTemplate } from '@codesandbox/sandpack-react';

export interface LiveExampleProps {
  /** Single file (App.tsx) shorthand. */
  code?: string;
  /** Sandpack template — defaults to react-ts. */
  template?: SandpackPredefinedTemplate;
  /** Multi-file map: filename → contents. Overrides `code` when provided. */
  files?: Record<string, string>;
  /** Optional title shown above the editor. */
  title?: string;
  /** Editor height. Default 360. */
  height?: number;
}

const DEFAULT_FILES = (code: string): Record<string, string> => ({
  '/App.tsx': code,
});

export function LiveExample({
  code,
  template = 'react-ts',
  files,
  title,
  height = 360,
}: LiveExampleProps) {
  const resolvedFiles =
    files ?? (code ? DEFAULT_FILES(code) : { '/App.tsx': "export default () => <h1>Hello</h1>;" });

  return (
    <div className="interactive-embed" style={{ margin: '1.5rem 0' }}>
      {title && (
        <div style={{
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          fontFamily: "'JetBrains Mono', monospace",
          marginBottom: '0.4rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <span style={{ color: 'var(--accent-purple)' }}>▶</span> {title} <span style={{ color: 'var(--text-muted)' }}>· live, editable</span>
        </div>
      )}
      <Sandpack
        template={template}
        files={resolvedFiles}
        theme="dark"
        options={{
          editorHeight: height,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
        }}
      />
    </div>
  );
}

export default LiveExample;
