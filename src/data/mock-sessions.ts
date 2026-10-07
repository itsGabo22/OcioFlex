export type FocusSession = {
  id: string;
  timestamp: string;
  durationMinutes: number;
  task: string;
};

export const getDailySessions = (): FocusSession[] => [
  { id: "1", timestamp: "09:00 AM", durationMinutes: 45, task: "Morning Sync & Triage" },
  { id: "2", timestamp: "10:15 AM", durationMinutes: 90, task: "UI System Architecture" },
  { id: "3", timestamp: "01:30 PM", durationMinutes: 60, task: "PostgreSQL Schema Refactor" },
];
