import { useProgress } from './useProgress';

interface ProgressTrackerProps {
  sectionId: string;
  lessonIndex: number;
  onComplete?: () => void;
}

export default function ProgressTracker({ sectionId, lessonIndex, onComplete }: ProgressTrackerProps) {
  const { markComplete, isComplete } = useProgress();
  const done = isComplete(sectionId, lessonIndex);

  const handleClick = () => {
    markComplete(sectionId, lessonIndex);
    onComplete?.();
  };

  return (
    <div className="no-print" style={{
      margin: '2rem 0',
      padding: '1rem',
      background: done ? 'var(--accent-green-bg)' : 'var(--bg-secondary)',
      border: `1px solid ${done ? 'var(--accent-green)' : 'var(--border-color)'}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ color: done ? 'var(--accent-green)' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
        {done ? '✅ Lesson completed!' : "Mark this lesson as complete when you're done:"}
      </span>
      {!done && (
        <button
          onClick={handleClick}
          style={{
            background: 'var(--accent-blue)',
            color: 'var(--bg-primary)',
            border: 'none',
            borderRadius: '6px',
            padding: '0.5rem 1.25rem',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
          }}
        >
          Complete ✓
        </button>
      )}
    </div>
  );
}
