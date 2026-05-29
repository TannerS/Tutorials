import { useApp } from '../AppContext';
import type { CSSProperties } from 'react';

// FIXME: PROP-4 — accepting an inline `style` prop. Per APP-1, the parent creates this
// object every render, so even if we memoized UserProfile it would still re-render.
// Either accept a `className` instead, or memo with a custom equality fn, or freeze the
// style object in the parent (useMemo / module constant).
export function UserProfile({ style }: { style?: CSSProperties }) {
  const { user } = useApp();
  if (user.loading) return <span style={style}>Loading…</span>;
  return (
    <span style={style} className="user-profile">
      👤 {user.name}
    </span>
  );
}
