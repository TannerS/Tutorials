import { createContext, useContext } from 'react';

/* The theme context and its consumer hook live apart from the ThemeProvider
   component on purpose: a file exporting both a component and a hook opts out
   of React Fast Refresh, so editing ThemeProvider.tsx would full-reload the app
   in dev rather than hot-swapping the component. */

export type Theme = 'dark' | 'light';

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
