import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tutorial-progress';

export function useProgress() {
  const [progress, setProgress] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const markComplete = (sectionId, lessonId) => {
    setProgress(prev => ({
      ...prev,
      [`${sectionId}/${lessonId}`]: true,
    }));
  };

  const isComplete = (sectionId, lessonId) => {
    return !!progress[`${sectionId}/${lessonId}`];
  };

  const getSectionProgress = (sectionId, totalLessons) => {
    let count = 0;
    for (let i = 0; i < totalLessons; i++) {
      if (progress[`${sectionId}/${i}`]) count++;
    }
    return count;
  };

  return { markComplete, isComplete, getSectionProgress };
}

export default function ProgressTracker({ sectionId, lessonIndex, onComplete }) {
  const { markComplete, isComplete } = useProgress();
  const done = isComplete(sectionId, lessonIndex);

  const handleClick = () => {
    markComplete(sectionId, lessonIndex);
    if (onComplete) onComplete();
  };

  return (
    <div style={{
      margin: '2rem 0',
      padding: '1rem',
      background: done ? '#1a3329' : '#1a1d2e',
      border: `1px solid ${done ? '#4ade8040' : '#2a2e42'}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ color: done ? '#4ade80' : '#9399b2', fontSize: '0.9rem' }}>
        {done ? '✅ Lesson completed!' : 'Mark this lesson as complete when you\'re done:'}
      </span>
      {!done && (
        <button
          onClick={handleClick}
          style={{
            background: '#5b9cf6',
            color: '#0f1117',
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
