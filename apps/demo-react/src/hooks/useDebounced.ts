import { useEffect, useState } from 'react';

// FIXME: HOOK-1 — Implementation is broken in subtle ways:
//   • returns the *initial* value forever on the first render (good)
//   • the cleanup uses `setTimeout(...)` not `clearTimeout`, so timers stack up
//   • when `value` changes during a pending timer, the old timer still fires →
//     debounced value oscillates.
// Fix: use `setTimeout` then `clearTimeout` in cleanup.
//
// FIXME: HOOK-2 — No way to flush immediately. Add a `flush()` returned alongside.
//
// FIXME: HOOK-3 — Not generic. Calling site must cast. Type with a generic <T>.
export function useDebounced(value: string, delayMs: number = 300): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    // ⬇ BUG: should be clearTimeout(handle). This no-op-returning cleanup compiles
    // but does nothing, so the old timer still fires.
    return () => {
      // intentionally a no-op — fix me
      void handle;
    };
  }, [value, delayMs]);

  return debounced;
}
