import { supabase } from './supabase.js';
import { hashPassword } from './auth-password.js';
import type { UserRow } from './auth-types.js';

export type { UserRow };

type MaRow = {
  id: string;
  phone: string;
  password_hash: string | null;
  nickname: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

function toRow(r: MaRow): UserRow {
  return {
    id: r.id,
    phone: r.phone,
    password_hash: r.password_hash,
    nickname: r.nickname,
    created_at: new Date(r.created_at).getTime(),
    avatar_url: r.avatar_url,
    updated_at: new Date(r.updated_at).getTime(),
    last_login_at: r.last_login_at ? new Date(r.last_login_at).getTime() : null,
  };
}

export async function findUserByPhone(phone: string): Promise<UserRow | undefined> {
  if (!supabase) return undefined;
  const { data, error } = await supabase.from('ma_users').select('*').eq('phone', phone).maybeSingle();
  if (error || !data) return undefined;
  return toRow(data as MaRow);
}

export async function createUser(phone: string, password: string, nickname?: string): Promise<UserRow> {
  if (!supabase) throw new Error('Supabase not configured');
  const nick = nickname?.trim() || `用户${phone.slice(-4)}`;
  const nh = hashPassword(password);
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('ma_users')
    .insert({
      phone,
      password_hash: nh,
      nickname: nick,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error || !data) throw new Error(error?.message || 'create user failed');
  return toRow(data as MaRow);
}

export async function setUserPassword(phone: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('ma_users')
    .update({ password_hash: hashPassword(password), updated_at: now })
    .eq('phone', phone);
  if (error) throw new Error(error.message);
}

export async function updateNickname(phone: string, nickname: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const { error } = await supabase.from('ma_users').update({ nickname, updated_at: now }).eq('phone', phone);
  if (error) throw new Error(error.message);
}

export async function updateAvatarUrl(phone: string, url: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const now = new Date().toISOString();
  const { error } = await supabase.from('ma_users').update({ avatar_url: url, updated_at: now }).eq('phone', phone);
  if (error) throw new Error(error.message);
}

export async function recordLogin(phone: string): Promise<void> {
  if (!supabase) return;
  const now = new Date().toISOString();
  await supabase
    .from('ma_users')
    .update({ last_login_at: now, updated_at: now })
    .eq('phone', phone);
}
