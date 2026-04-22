// Shared types for Health Companion UI components.
// Kept loose to mirror the backend's soft contract.

export type LabStatus = "ok" | "borderline" | "out_of_range" | "critical";

export type LabValue = {
  test: string;
  value?: number | null;
  value_text?: string | null;
  unit?: string | null;
  reference_range?: string | null;
  status: LabStatus;
  interpretation: string;
  // TODO: backend does not yet emit `confidence` in LabAnalysis. When it
  // lands, ConfidenceBadge in LabTable will start rendering automatically.
  confidence?: number | null;
};

export type LabFlag = {
  value_refs: string[];
  severity: "info" | "watch" | "talk_to_doctor" | "urgent";
  message: string;
};

export type LabTrend = {
  test: string;
  prior_value?: number | null;
  prior_date?: string | null;
  current_value?: number | null;
  current_date?: string | null;
  direction: "improved" | "stable" | "worsened" | "unclear";
  summary: string;
};

export type LabAnalysis = {
  drawn_on?: string | null;
  laboratory?: string | null;
  panel_summary: string;
  values: LabValue[];
  trends?: LabTrend[];
  flags?: LabFlag[];
  doctor_questions?: string[];
};

export type Biomarker = {
  name?: string;
  value?: number | string | null;
  unit?: string | null;
  sample_date?: string | null;
  source?: string | null;
  [key: string]: unknown;
};

export type TimelineEvent = {
  event_type: string;
  payload: Record<string, unknown>;
  occurred_on: string;
  created_at: string;
};

export type ProactiveMessage = {
  text: string;
  context_refs: string[];
  next_step: string;
  months_later?: number;
};
