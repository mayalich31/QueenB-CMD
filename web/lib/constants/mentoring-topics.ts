export const MENTORING_TOPIC_VALUES = [
  "career_planning",
  "mock_interviews",
  "company_advice",
  "technical_interviews",
  "resume_review",
  "leadership_growth",
] as const;

export type MentoringTopic = (typeof MENTORING_TOPIC_VALUES)[number];

export const MENTORING_TOPIC_LABELS: Record<MentoringTopic, string> = {
  career_planning: "Career planning",
  mock_interviews: "Mock interviews",
  company_advice: "Company advice",
  technical_interviews: "Technical interviews",
  resume_review: "Resume review",
  leadership_growth: "Leadership growth",
};
