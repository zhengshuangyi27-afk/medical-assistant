/**
 * 已配置 Supabase 时用户读写 ma_users；否则懒加载 SQLite（避免 Railway 上 better-sqlite3 编译失败导致整站起不来）。
 */
import { supabase } from './supabase.js';
import * as pg from './auth-supabase.js';

export type { UserRow } from './auth-types.js';

type SqliteAuth = typeof import('./auth-db.js');
let sqliteMod: SqliteAuth | null = null;

async function sqlite(): Promise<SqliteAuth> {
  if (!sqliteMod) sqliteMod = await import('./auth-db.js');
  return sqliteMod;
}

export async function findUserByPhone(phone: string) {
  if (supabase) return pg.findUserByPhone(phone);
  return (await sqlite()).findUserByPhone(phone);
}

export async function createUser(phone: string, password: string, nickname?: string) {
  if (supabase) return pg.createUser(phone, password, nickname);
  return (await sqlite()).createUser(phone, password, nickname);
}

export async function setUserPassword(phone: string, password: string): Promise<void> {
  if (supabase) return pg.setUserPassword(phone, password);
  (await sqlite()).setUserPassword(phone, password);
}

export async function updateNickname(phone: string, nickname: string): Promise<void> {
  if (supabase) return pg.updateNickname(phone, nickname);
  (await sqlite()).updateNickname(phone, nickname);
}

export async function updateAvatarUrl(phone: string, url: string): Promise<void> {
  if (supabase) return pg.updateAvatarUrl(phone, url);
  (await sqlite()).updateAvatarUrl(phone, url);
}

export async function recordLogin(phone: string): Promise<void> {
  if (supabase) return pg.recordLogin(phone);
  (await sqlite()).recordLogin(phone);
}
