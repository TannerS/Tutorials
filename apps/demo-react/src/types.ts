// FIXME: TS-1 — `any` everywhere. Replace with proper interfaces and discriminated unions.

export type Task = {
  id: any;
  title: any;
  done: any;
  priority: any;  // "low" | "medium" | "high" — but here it's any string
  createdAt: any;
  tags: any;      // should be string[]
};

// FIXME: TS-2 — Filter is a stringly-typed grab bag. Should be a discriminated union or enum.
export type Filter = string;

export type User = {
  id: any;
  name: any;
  email: any;
  // FIXME: TS-3 — no separation between "loaded" vs "loading" vs "error" user state.
  loading: any;
};

// FIXME: TS-4 — Theme is widened to string. Should be a literal union.
export type Theme = string;
