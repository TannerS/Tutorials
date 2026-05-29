import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Task, Filter, User, Theme } from './types';

// FIXME: CTX-1 — One mega-context for *everything*. Any change to any field
// re-renders every consumer. Split into multiple smaller contexts (TasksContext,
// FilterContext, ThemeContext, UserContext) OR use a state store (Zustand/Jotai/Redux).

// FIXME: CTX-2 — The value object is rebuilt every render, so even consumers
// whose data didn't change get a new reference and re-render. Memoize with useMemo,
// or split state and dispatch into two contexts (the dispatch one is referentially stable).

type AppContextValue = {
  // tasks
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  // filter
  filter: Filter;
  setFilter: (f: Filter) => void;
  // theme
  theme: Theme;
  setTheme: (t: Theme) => void;
  // user
  user: User;
  setUser: (u: User) => void;
};

// FIXME: CTX-3 — default value is a lie (functions that throw or no-op). Consumers
// outside a provider will silently do nothing. Either throw in the default, or wrap
// useContext in a custom hook that asserts the provider is present.
const AppContext = createContext<AppContextValue>({
  tasks: [],
  setTasks: () => {},
  filter: 'all',
  setFilter: () => {},
  theme: 'dark',
  setTheme: () => {},
  user: { id: 0, name: '', email: '', loading: true },
  setUser: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<User>({ id: 1, name: 'Tanner', email: 't@example.com', loading: false });

  // FIXME: CTX-4 — fresh object every render → every consumer re-renders even when
  // their slice didn't change. Wrap in useMemo (and stabilize setters? — they're already stable from useState).
  const value: AppContextValue = {
    tasks, setTasks,
    filter, setFilter,
    theme, setTheme,
    user, setUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// FIXME: CTX-5 — direct useContext export forces every consumer to subscribe to the
// whole value. Provide narrow selector hooks (useTasks, useFilter, useTheme) that
// each read from their own dedicated context.
export const useApp = () => useContext(AppContext);
