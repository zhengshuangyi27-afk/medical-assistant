import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('Supabase: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. DB features disabled.');
}

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export type Tables = {
  llm_configs: {
    id: string;
    provider: string;
    model_id: string;
    name: string;
    description: string | null;
    is_default: boolean;
    sort_order: number;
    created_at: string;
  };
  medical_records: {
    id: string;
    user_id: string | null;
    patient_name: string | null;
    chief_complaint: string;
    assessment: string;
    plan: string;
    raw_input: string | null;
    created_at: string;
  };
  user_settings: {
    id: string;
    user_id: string;
    key: string;
    value: string;
    updated_at: string;
  };
};
