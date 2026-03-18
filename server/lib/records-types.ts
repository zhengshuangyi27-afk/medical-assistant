export type RecordRow = {
  user_id: string | null;
  patient_name: string | null;
  patient_gender?: string | null;
  patient_age?: string | null;
  department?: string | null;
  chief_complaint: string;
  assessment: string;
  plan: string;
  raw_input: string | null;
};
