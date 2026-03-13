import { supabase } from './supabase.js';

export async function createRecord(row: {
  user_id: string | null;
  patient_name: string | null;
  chief_complaint: string;
  assessment: string;
  plan: string;
  raw_input: string | null;
}): Promise<string> {
  if (supabase) {
    const { data, error } = await supabase
      .from('medical_records')
      .insert(row)
      .select('id')
      .single();
    if (!error && data?.id) return data.id;
  }
  return 'local-' + Date.now();
}

export async function listRecords(userId: string | null) {
  if (supabase) {
    let q = supabase.from('medical_records').select('id, chief_complaint, assessment, plan, created_at, patient_name');
    if (userId) q = q.eq('user_id', userId);
    const { data, error } = await q.order('created_at', { ascending: false }).limit(100);
    if (!error) return data ?? [];
  }
  return [];
}
