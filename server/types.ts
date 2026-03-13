export interface LlmConfigRow {
  id: string;
  provider: string;
  model_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  sort_order: number;
}

export interface MedicalRecordBody {
  chiefComplaint: string;
  assessment: string;
  plan: string;
}

export interface ApiChatMessage {
  role: 'user' | 'ai';
  content: string;
}
