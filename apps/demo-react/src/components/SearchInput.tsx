import { forwardRef } from 'react';

// FIXME: REACT19-7 — `forwardRef` is DEPRECATED in React 19. Refs can be passed
// as a normal prop now:
//
//   export function SearchInput({ ref, ...props }: Props & { ref?: Ref<HTMLInputElement> }) {
//     return <input ref={ref} ... />;
//   }
//
// The codemod is essentially:
//   - drop the forwardRef() wrapper
//   - move `ref` into the props type
//   - rename `(props, ref) =>` to `({ ref, ...props }) =>`
//
// React Compiler also gets to optimize this better when forwardRef is gone.

interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput({ value, onChange, placeholder }, ref) {
    return (
      <input
        ref={ref}
        className="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        // FIXME: A11Y-1 — still missing label/aria-label. forwardRef removal won't
        // fix that for you.
      />
    );
  },
);
