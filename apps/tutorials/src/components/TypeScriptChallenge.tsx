import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Challenge,
  ChallengeDifficulty,
} from '../data/typescript-challenges';
import { ASSERTION_HELPERS } from '../data/typescript-challenges';
import type {
  ValidateRequest,
  ValidateResult,
} from '../workers/typescript-validator.worker';

interface TypeScriptChallengeProps {
  challenge: Challenge;
  worker: Worker | null;
  workerReady: boolean;
}

const DIFFICULTY_COLORS: Record<ChallengeDifficulty, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
};

const DIFFICULTY_LABELS: Record<ChallengeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

/**
 * Build the full code sent to the validator: helpers + user code + hidden tests.
 * The user only sees their own code in the editor; the helpers and tests are
 * stitched on at validation time.
 */
function buildFullCode(userCode: string, hiddenTests: string): string {
  return `${ASSERTION_HELPERS}\n\n// ── Your code ────────────────────────────────────────────────────────────────\n${userCode}\n\n${hiddenTests}\n`;
}

export default function TypeScriptChallenge({
  challenge,
  worker,
  workerReady,
}: TypeScriptChallengeProps) {
  const [code, setCode] = useState(challenge.starter);
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [running, setRunning] = useState(false);
  const [hintsShown, setHintsShown] = useState(0);
  const [solutionVisible, setSolutionVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state whenever the challenge changes.
  useEffect(() => {
    setCode(challenge.starter);
    setResult(null);
    setRunning(false);
    setHintsShown(0);
    setSolutionVisible(false);
  }, [challenge.id, challenge.starter]);

  // Listen for validation results matching THIS challenge.
  useEffect(() => {
    if (!worker) return;
    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== 'result') return;
      if (data.challengeId !== challenge.id) return;
      setResult(data as ValidateResult);
      setRunning(false);
    };
    worker.addEventListener('message', handler);
    return () => worker.removeEventListener('message', handler);
  }, [worker, challenge.id]);

  const runCheck = useCallback(() => {
    if (!worker || !workerReady) return;
    setRunning(true);
    setResult(null);
    const req: ValidateRequest = {
      type: 'validate',
      challengeId: challenge.id,
      fullCode: buildFullCode(code, challenge.hiddenTests),
    };
    worker.postMessage(req);
  }, [worker, workerReady, code, challenge.id, challenge.hiddenTests]);

  const resetCode = useCallback(() => {
    setCode(challenge.starter);
    setResult(null);
  }, [challenge.starter]);

  // Tab-to-indent inside the textarea so users can format their code.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = code.slice(0, start) + '  ' + code.slice(end);
        setCode(next);
        // Restore cursor after the inserted indent.
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
      // Cmd/Ctrl+Enter runs the check.
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        runCheck();
      }
    },
    [code, runCheck],
  );

  const difficultyChip = useMemo(
    () => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.15rem 0.6rem',
          borderRadius: '999px',
          background: DIFFICULTY_COLORS[challenge.difficulty],
          color: '#fff',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {DIFFICULTY_LABELS[challenge.difficulty]}
      </span>
    ),
    [challenge.difficulty],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            {challenge.category}
          </span>
          {difficultyChip}
        </div>
        <h2 style={{ margin: 0 }}>{challenge.title}</h2>
      </div>

      {/* ── Prompt ───────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '1rem 1.25rem',
          lineHeight: 1.6,
        }}
      >
        {challenge.prompt.split('\n\n').map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? '0 0 0.75rem 0' : '0.75rem 0 0 0' }}>
            {renderInlineMarkdown(para)}
          </p>
        ))}
      </div>

      {/* ── Editor ───────────────────────────────────────────────────────── */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0d0d0d',
            border: '1px solid #333',
            borderBottom: 'none',
            borderTopLeftRadius: '6px',
            borderTopRightRadius: '6px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.8rem',
            color: '#888',
          }}
        >
          <span>index.ts</span>
          <span style={{ fontFamily: 'monospace', opacity: 0.6 }}>
            Cmd/Ctrl + Enter to check
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            width: '100%',
            minHeight: '300px',
            padding: '1rem',
            background: '#0a0a0a',
            color: '#e4e4e4',
            border: '1px solid #333',
            borderTop: 'none',
            borderBottomLeftRadius: '6px',
            borderBottomRightRadius: '6px',
            fontFamily:
              '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
            fontSize: '0.9rem',
            lineHeight: 1.55,
            resize: 'vertical',
            outline: 'none',
            tabSize: 2,
            whiteSpace: 'pre',
            overflow: 'auto',
          }}
        />
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={runCheck}
          disabled={!workerReady || running}
          style={{
            padding: '0.55rem 1.1rem',
            background: workerReady && !running ? '#3178c6' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: workerReady && !running ? 'pointer' : 'not-allowed',
          }}
        >
          {running
            ? 'Checking…'
            : !workerReady
              ? 'Loading TypeScript…'
              : 'Check ▶'}
        </button>
        <button
          onClick={resetCode}
          style={{
            padding: '0.55rem 1.1rem',
            background: 'transparent',
            color: '#aaa',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        {challenge.hints && challenge.hints.length > 0 && (
          <button
            onClick={() =>
              setHintsShown((s) =>
                Math.min(s + 1, challenge.hints?.length ?? 0),
              )
            }
            disabled={hintsShown >= (challenge.hints?.length ?? 0)}
            style={{
              padding: '0.55rem 1.1rem',
              background: 'transparent',
              color:
                hintsShown >= (challenge.hints?.length ?? 0) ? '#555' : '#aaa',
              border: '1px solid #444',
              borderRadius: '6px',
              cursor:
                hintsShown >= (challenge.hints?.length ?? 0)
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {hintsShown === 0
              ? `Hint (${challenge.hints.length} available)`
              : `Next hint (${hintsShown}/${challenge.hints.length})`}
          </button>
        )}
        <button
          onClick={() => setSolutionVisible((v) => !v)}
          style={{
            padding: '0.55rem 1.1rem',
            background: 'transparent',
            color: '#aaa',
            border: '1px solid #444',
            borderRadius: '6px',
            cursor: 'pointer',
            marginLeft: 'auto',
          }}
        >
          {solutionVisible ? 'Hide solution' : 'Show solution'}
        </button>
      </div>

      {/* ── Hints ────────────────────────────────────────────────────────── */}
      {challenge.hints && hintsShown > 0 && (
        <div
          style={{
            background: '#1a1a2a',
            border: '1px solid #2d2d4a',
            borderRadius: '6px',
            padding: '0.85rem 1.1rem',
          }}
        >
          <strong style={{ color: '#9bb6e8' }}>Hints</strong>
          <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem' }}>
            {challenge.hints.slice(0, hintsShown).map((hint, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                {hint}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* ── Solution ─────────────────────────────────────────────────────── */}
      {solutionVisible && (
        <div
          style={{
            background: '#0d1a0d',
            border: '1px solid #2a4a2a',
            borderRadius: '6px',
            padding: '0.85rem 1.1rem',
          }}
        >
          <strong style={{ color: '#9be8a0' }}>Model solution</strong>
          <pre
            style={{
              margin: '0.5rem 0 0 0',
              padding: '0.75rem',
              background: '#070707',
              borderRadius: '4px',
              overflowX: 'auto',
              fontFamily:
                '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
              fontSize: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {challenge.solution}
          </pre>
        </div>
      )}

      {/* ── Result panel ─────────────────────────────────────────────────── */}
      {result && (
        <div
          style={{
            background: result.passed ? '#0d1a0d' : '#1a0d0d',
            border: `1px solid ${result.passed ? '#2a4a2a' : '#4a2a2a'}`,
            borderRadius: '6px',
            padding: '1rem 1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: result.diagnostics.length > 0 ? '0.75rem' : 0,
            }}
          >
            <strong
              style={{
                fontSize: '1.05rem',
                color: result.passed ? '#7ce888' : '#e87c7c',
              }}
            >
              {result.passed
                ? '✓ All checks passed'
                : `✗ ${result.diagnostics.filter((d) => d.category === 'error').length} error(s)`}
            </strong>
            <span style={{ color: '#777', fontSize: '0.8rem' }}>
              ({result.durationMs}ms)
            </span>
          </div>

          {result.diagnostics.length > 0 && (
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.25rem',
                listStyle: 'none',
                fontFamily:
                  '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              {result.diagnostics.map((d, i) => (
                <li
                  key={i}
                  style={{
                    color: d.category === 'error' ? '#e87c7c' : '#e8c87c',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span style={{ color: '#666' }}>
                    {d.line > 0 ? `[Ln ${d.line}, Col ${d.column}] ` : ''}
                  </span>
                  {d.message}
                </li>
              ))}
            </ul>
          )}

          {result.passed && (
            <p style={{ margin: 0, color: '#9bb89b' }}>
              Nice work. Pick another challenge from the sidebar to keep going.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Tiny inline-markdown renderer: bold (**text**) and inline code (`text`).
 * Avoids pulling in a markdown library for prompt rendering.
 */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Split on **bold** and `code`. Keep delimiters.
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={match.index}
          style={{
            background: '#252525',
            padding: '0.1rem 0.35rem',
            borderRadius: '3px',
            fontFamily:
              '"JetBrains Mono", Menlo, Monaco, Consolas, monospace',
            fontSize: '0.85em',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
