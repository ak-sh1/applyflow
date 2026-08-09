export const STATUSES = ["Saved", "Applied", "Interview", "Offer"] as const;

export type Status = (typeof STATUSES)[number];

export type Application = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  location: string;
  status: Status;
  applied_date: string | null;
  next_step: string;
  source: string;
  resume: string;
  accent: string;
  job_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
