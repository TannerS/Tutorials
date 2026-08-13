export interface Lesson {
  id: string;
  title: string;
  path: string;
}

export interface Section {
  id: string;
  label: string;
  icon: string;
  color: string;
  lessons: Lesson[];
}

export interface Group {
  id: string;
  label: string;
  icon: string;
  color: string;
  /** Sections nested directly under this group. */
  sectionIds?: string[];
  /** Child groups nested under this group — enables N-level sidebar nesting
   *  (e.g. Frontend -> React -> TypeScript). Optional; most groups are leaves
   *  with only `sectionIds`. */
  children?: Group[];
}
