import { useEffect, useMemo, useRef, useState } from 'react';
import LessonLayout from '../../components/LessonLayout';
import TypeScriptChallenge from '../../components/TypeScriptChallenge';
import {
  CHALLENGES,
  groupByCategory,
  type Challenge,
} from '../../data/typescript-challenges';

/**
 * Interactive TypeScript challenges page.
 *
 * Owns the validator Web Worker and shares it across challenges (one worker
 * per page load — the lib-file CDN fetch happens once and is reused).
 */
export default function Interactive() {
  const [activeId, setActiveId] = useState<string>(CHALLENGES[0].id);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerReady, setWorkerReady] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  // Lazily create the worker on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Vite worker import — bundler picks up '?worker' suffix.
      const ValidatorWorker = (
        await import('../../workers/typescript-validator.worker?worker')
      ).default;
      if (cancelled) return;
      const w = new ValidatorWorker();
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === 'ready') {
          setWorkerReady(true);
        }
      };
      w.addEventListener('message', onMessage);
      workerRef.current = w;
      setWorker(w);
    })();
    return () => {
      cancelled = true;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  const grouped = useMemo(() => groupByCategory(CHALLENGES), []);
  const activeChallenge =
    CHALLENGES.find((c) => c.id === activeId) ?? CHALLENGES[0];

  return (
    <LessonLayout
      title="Interactive TypeScript Challenges"
      sectionId="typescript"
      lessonIndex={10}
      prev={{ path: '/typescript/tsconfig', label: 'tsconfig Mastery' }}
      next={null}
    >
      <p>
        Real practice beats reading about it. Each challenge below presents a
        scenario, gives you starter code, and validates your solution with the
        actual TypeScript compiler running in a Web Worker. Hidden type
        assertions check your work — when all pass, you've matched the
        intended shape.
      </p>

      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          margin: '1rem 0 1.5rem',
          fontSize: '0.85rem',
          lineHeight: 1.55,
        }}
      >
        <strong>How validation works:</strong> we prepend a set of type-test
        helpers (<code>Equal&lt;X, Y&gt;</code>, <code>Expect&lt;T extends true&gt;</code>),
        append hidden assertions, and run the combined file through the
        TypeScript compiler. If your code satisfies the assertions with no
        compile errors, you pass. Errors are shown line-by-line.
      </div>

      <ChallengeWorkspace
        grouped={grouped}
        activeId={activeId}
        onSelect={setActiveId}
        challenge={activeChallenge}
        worker={worker}
        workerReady={workerReady}
      />
    </LessonLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChallengeWorkspace — sidebar + active challenge
// ─────────────────────────────────────────────────────────────────────────────

interface ChallengeWorkspaceProps {
  grouped: Map<string, Challenge[]>;
  activeId: string;
  onSelect: (id: string) => void;
  challenge: Challenge;
  worker: Worker | null;
  workerReady: boolean;
}

function ChallengeWorkspace({
  grouped,
  activeId,
  onSelect,
  challenge,
  worker,
  workerReady,
}: ChallengeWorkspaceProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 260px) 1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        style={{
          position: 'sticky',
          top: '6rem',
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '6px',
          padding: '0.85rem 0.75rem',
        }}
      >
        <h3
          style={{
            margin: '0 0 0.5rem 0',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#888',
          }}
        >
          Challenges
        </h3>
        {Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '0.85rem' }}>
            <div
              style={{
                fontSize: '0.75rem',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '0.35rem 0.5rem 0.2rem',
              }}
            >
              {category}
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {items.map((it) => {
                const isActive = it.id === activeId;
                return (
                  <li key={it.id}>
                    <button
                      onClick={() => onSelect(it.id)}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.4rem 0.55rem',
                        background: isActive ? '#1f2937' : 'transparent',
                        color: isActive ? '#e4e4e4' : '#bbb',
                        border: 'none',
                        borderRadius: '4px',
                        borderLeft: isActive
                          ? '3px solid #3178c6'
                          : '3px solid transparent',
                        fontSize: '0.85rem',
                        lineHeight: 1.35,
                        cursor: 'pointer',
                        marginBottom: '0.1rem',
                      }}
                    >
                      {it.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      {/* ── Active challenge ─────────────────────────────────────────────── */}
      <main>
        <TypeScriptChallenge
          key={challenge.id}
          challenge={challenge}
          worker={worker}
          workerReady={workerReady}
        />
      </main>
    </div>
  );
}
