/**
 * Guards for the global Arrow-Left/Right "previous/next lesson" shortcut.
 *
 * The original check only looked at `input` / `textarea` / `select`, which
 * misses every rich code editor on the site: Sandpack (LiveExample), the six
 * playgrounds and the TypeScript playground all render CodeMirror, whose
 * editing surface is a `contenteditable` div. Pressing Left/Right to move the
 * caret inside one of those editors navigated to another lesson and threw away
 * whatever the reader had typed.
 */
export function isTypingTarget(el: Element | null = document.activeElement): boolean {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  // CodeMirror/Monaco put role="textbox" on their editing surface.
  const role = el.getAttribute('role');
  return role === 'textbox' || role === 'combobox' || role === 'searchbox';
}

/**
 * Chorded arrows mean something else entirely (Cmd+Left = browser back on
 * macOS, Alt+Left = back on Windows/Linux, Shift+Arrow = extend selection), so
 * the shortcut must stay out of the way when any modifier is held.
 */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;
}
