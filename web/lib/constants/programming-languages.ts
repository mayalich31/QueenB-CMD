export const PROGRAMMING_LANGUAGE_VALUES = [
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "C",
  "C++",
  "C#",
  "SQL",
  "HTML",
  "CSS",
] as const;

export type ProgrammingLanguage =
  (typeof PROGRAMMING_LANGUAGE_VALUES)[number];
