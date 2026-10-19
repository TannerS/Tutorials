import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { audioManifest } from '../data/audioManifest';

export interface LessonAudioProps {
  sectionId: string;
  title: string;
  /** Where to go when this track finishes, if anywhere. */
  nextPath?: string | null;
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

const fmt = (s: number) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

/**
 * Pre-generated narration for a lesson, for listening while driving.
 *
 * WHY A REAL <audio> AND NOT speechSynthesis: live TTS stops the moment iOS
 * locks the screen or you switch apps, which makes it useless in a car. A
 * media element keeps playing, and with the Media Session API below it gets
 * lock-screen and CarPlay controls. The cost is that the audio has to be
 * generated ahead of time — see scripts/build-audio.mjs.
 *
 * Renders nothing at all when this lesson has no generated file, so the
 * feature can be rolled out section by section.
 */
export default function LessonAudio({ sectionId, title, nextPath }: LessonAudioProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const ref = useRef<HTMLAudioElement>(null);

  const lessonId = location.pathname.split('/').filter(Boolean).pop() ?? '';
  const file = audioManifest[sectionId]?.[lessonId];

  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  // The element can finish loading its header BEFORE React attaches
  // onLoadedMetadata, in which case the event never reaches us and the duration
  // stays blank — measured: readyState 4 with duration 413, label still "—".
  // So read the element directly on mount as well as listening for the event.
  useEffect(() => {
    const a = ref.current;
    if (a && a.readyState >= 1 && Number.isFinite(a.duration)) setDuration(a.duration);
  }, [file]);

  // Lock screen / CarPlay metadata and transport controls.
  useEffect(() => {
    if (!file || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: 'Dev Tutorials',
      album: sectionId,
    });
    const act = navigator.mediaSession;
    act.setActionHandler('play', () => ref.current?.play());
    act.setActionHandler('pause', () => ref.current?.pause());
    act.setActionHandler('seekbackward', () => {
      if (ref.current) ref.current.currentTime = Math.max(0, ref.current.currentTime - 15);
    });
    act.setActionHandler('seekforward', () => {
      if (ref.current) ref.current.currentTime += 30;
    });
    act.setActionHandler('nexttrack', nextPath ? () => navigate(nextPath) : null);
    return () => {
      for (const a of ['play', 'pause', 'seekbackward', 'seekforward', 'nexttrack'] as const) {
        try { act.setActionHandler(a, null); } catch { /* unsupported action */ }
      }
    };
  }, [file, title, sectionId, nextPath, navigate]);

  if (!file) return null;

  const src = `${import.meta.env.BASE_URL}audio/${sectionId}/${file}`;
  const pct = duration ? (time / duration) * 100 : 0;

  return (
    <div
      className="no-print"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.6rem 0.85rem',
        marginBottom: '1.75rem',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        background: 'var(--bg-secondary, transparent)',
      }}
    >
      <audio
        ref={ref}
        src={src}
        // "metadata" fetches only the header (a few KB) so the duration is
        // visible before you commit to a 7-minute download.
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        onEnded={() => { setPlaying(false); if (nextPath) navigate(nextPath); }}
      />

      <button
        type="button"
        onClick={() => { const a = ref.current; if (!a) return; a.playbackRate = speed; if (playing) a.pause(); else void a.play(); }}
        aria-label={playing ? 'Pause narration' : 'Play narration'}
        style={{
          width: '2.3rem',
          height: '2.3rem',
          flexShrink: 0,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.9rem',
          color: '#fff',
          background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
        }}
      >
        {playing ? '❚❚' : '▶'}
      </button>

      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '0.3rem',
        }}>
          Listen · {duration ? fmt(duration) : '—'}
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={time}
          step={1}
          aria-label="Seek"
          onChange={e => { if (ref.current) ref.current.currentTime = Number(e.target.value); }}
          style={{ width: '100%', accentColor: 'var(--accent-blue)', background: `linear-gradient(90deg, transparent ${pct}%, transparent)` }}
        />
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(time)} / {fmt(duration)}
      </span>

      <button
        type="button"
        onClick={() => {
          const i = (SPEEDS.indexOf(speed) + 1) % SPEEDS.length;
          setSpeed(SPEEDS[i]);
          if (ref.current) ref.current.playbackRate = SPEEDS[i];
        }}
        aria-label={`Playback speed ${speed} times`}
        style={{
          border: '1px solid var(--border-color)',
          background: 'none',
          color: 'var(--text-secondary)',
          borderRadius: '6px',
          padding: '0.2rem 0.45rem',
          fontSize: '0.72rem',
          cursor: 'pointer',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {speed}×
      </button>

      <a
        href={src}
        download
        aria-label="Download this lesson's audio"
        style={{ fontSize: '0.95rem', textDecoration: 'none', color: 'var(--text-muted)' }}
      >
        ⤓
      </a>
    </div>
  );
}
