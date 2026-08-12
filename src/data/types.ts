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
  sectionIds: string[];
}
