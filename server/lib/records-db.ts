import { supabase } from './supabase.js';
import type { RecordRow } from './records-types.js';

export type { RecordRow };

export async function createRecord(row: RecordRow): Promise<string> {
  if (!supabase) {
    const m = await import('./medical-records-sqlite.js');
    return m.sqliteCreateRecord(row);
  }
  const insert = {
    user_id: row.user_id,
    patient_name: row.patient_name,
    patient_gender: row.patient_gender ?? null,
    patient_age: row.patient_age ?? null,
    department: row.department ?? null,
    chief_complaint: row.chief_complaint,
    assessment: row.assessment,
    plan: row.plan,
    raw_input: row.raw_input,
  };
  const { data, error } = await supabase.from('medical_records').insert(insert).select('id').single();
  if (error) {
    console.error('Supabase medical_records insert:', error.message);
    throw new Error(error.message || '病历保存失败，请确认已执行 supabase/schema.sql 迁移');
  }
  if (!data?.id) throw new Error('病历保存未返回 id');
  return data.id as string;
}

export async function listRecords(userId: string | null) {
  if (!supabase) {
    const m = await import('./medical-records-sqlite.js');
    return m.sqliteListRecords(userId);
  }
  let q = supabase
    .from('medical_records')
    .select('id, chief_complaint, assessment, plan, created_at, patient_name');
  if (userId) q = q.eq('user_id', userId);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(200);
  if (error) {
    console.error('Supabase medical_records list:', error.message);
    throw new Error(error.message || '病历列表加载失败');
  }
  return data ?? [];
}
