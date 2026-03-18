/**
 * 已配置 Supabase 时用户读写 ma_users；否则使用本机 SQLite。
 */
import { supabase } from './supabase.js';
import * as sqlite from './auth-db.js';
import * as pg from './auth-supabase.js';

export type UserRow = sqlite.UserRow;

export async function findUserByPhone(phone: string): Promise<UserRow | undefined> {
  if (supabase) return pg.findUserByPhone(phone);
  return sqlite.findUserByPhone(phone);
}

export async function createUser(phone: string, password: string, nickname?: string): Promise<UserRow> {
  if (supabase) return pg.createUser(phone, password, nickname);
  return sqlite.createUser(phone, password, nickname);
}

export async function setUserPassword(phone: string, password: string): Promise<void> {
  if (supabase) return pg.setUserPassword(phone, password);
  sqlite.setUserPassword(phone, password);
}

export async function updateNickname(phone: string, nickname: string): Promise<void> {
  if (supabase) return pg.updateNickname(phone, nickname);
  sqlite.updateNickname(phone, nickname);
}

export async function updateAvatarUrl(phone: string, url: string): Promise<void> {
  if (supabase) return pg.updateAvatarUrl(phone, url);
  sqlite.updateAvatarUrl(phone, url);
}

export async function recordLogin(phone: string): Promise<void> {
  if (supabase) return pg.recordLogin(phone);
  sqlite.recordLogin(phone);
}
