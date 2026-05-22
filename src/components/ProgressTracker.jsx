import { useState, useCallback } from 'react';

const STORAGE_KEY = 'tutorial-progress';

export function useProgress() {
  const getAll = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  };

  const markComplete = useCallback((sectionId, lessonId) => {
    const all = getAll();
    all[`${sectionId}/${lessonId}`] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }, []);

  const isComplete = useCallback((sectionId, lessonId) => {
    return !!getAll()[`${sectionId}/${lessonId}`];
  }, []);

  const getSectionProgress = useCallback((sectionId, totalLessons) => {
    const all = getAll();
    let count = 0;
    for (let i = 0; i < totalLessons; i++) {
      if (all[`${sectionId}/${i}`]) count++;
    }
    return count;
  }, []);

  return { markComplete, isComplete, getSectionProgress };
}

export default function ProgressTracker({ sectionId, lessonIndex, onComplete }) {
  const { markComplete, isComplete } = useProgress();
  const [done, setDone] = useState(() => isComplete(sectionId, lessonIndex));

  const handleClick = () => {
    markComplete(sectionId, lessonIndex);
    setDone(true);
    if (onComplete) onComplete();
  };

  return (
    <div style={{ margin: '2rem 0 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {done ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: '#4ade80', fontWeight: 600, fontSize: '0.9rem',
          background: '#1a3329', padding: '0.5rem 1rem',
          borderRadius: '8px', border: '1px solid #4ade80',
        }}>
          <span>✅</span> Lesson completed!
        </div>
      ) : (
        <button onClick={handleClick} style={{
          background: '#5b9cf6', color: '#0f1117',
          border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem',
          cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
          fontFamily: 'inherit', transition: 'background 0.2s ease',
        }}
          onMouseEnter={e => e.target.style.background = '#7db4f8'}
          onMouseLeave={e => e.target.style.background = '#5b9cf6'}
        >
          Mark complete
        </button>
      )}
    </div>
  );
}
