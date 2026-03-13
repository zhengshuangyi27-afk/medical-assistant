import { supabase } from './supabase.js';

export async function getSetting(userId: string, key: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('user_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(userId: string, key: string, value: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('user_settings').upsert(
    {
      user_id: userId,
      key,
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,key' }
  );
}
