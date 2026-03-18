import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { hashPassword } from './auth-password.js';
import type { UserRow } from './auth-types.js';

const dataDir = path.join(process.cwd(), 'server', 'data');
fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'auth.sqlite');

const db = new Database(dbPath);

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  nickname TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sms_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  sent_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
`);

function userColNames(): Set<string> {
  return new Set((db.prepare('PRAGMA table_info(users)').all() as { name: string }[]).map((c) => c.name));
}

function migrateUsersTable(): void {
  let cols = userColNames();
  if (!cols.has('avatar_url')) {
    db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
    cols = userColNames();
  }
  if (!cols.has('updated_at')) {
    db.exec('ALTER TABLE users ADD COLUMN updated_at INTEGER');
    db.prepare('UPDATE users SET updated_at = created_at WHERE updated_at IS NULL').run();
    cols = userColNames();
  }
  if (!cols.has('last_login_at')) {
    db.exec('ALTER TABLE users ADD COLUMN last_login_at INTEGER');
  }
}

migrateUsersTable();

export type { UserRow };

export function findUserByPhone(phone: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as UserRow | undefined;
}

export function createUser(phone: string, password: string, nickname?: string): UserRow {
  const id = randomUUID();
  const now = Date.now();
  const nh = hashPassword(password);
  const nick = nickname?.trim() || `用户${phone.slice(-4)}`;
  db.prepare(
    'INSERT INTO users (id, phone, password_hash, nickname, created_at, updated_at) VALUES (?,?,?,?,?,?)'
  ).run(id, phone, nh, nick, now, now);
  return { id, phone, password_hash: nh, nickname: nick, created_at: now, avatar_url: null, updated_at: now, last_login_at: null };
}

export function createUserSmsOnly(phone: string): UserRow {
  const id = randomUUID();
  const now = Date.now();
  const nick = `用户${phone.slice(-4)}`;
  db.prepare(
    'INSERT INTO users (id, phone, password_hash, nickname, created_at, updated_at) VALUES (?,?,NULL,?,?,?)'
  ).run(id, phone, nick, now, now);
  return { id, phone, password_hash: null, nickname: nick, created_at: now, avatar_url: null, updated_at: now, last_login_at: null };
}

export function recordLogin(phone: string): void {
  const now = Date.now();
  db.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE phone = ?').run(now, now, phone);
}

export function setSmsCode(phone: string, code: string, ttlMs: number): void {
  const now = Date.now();
  db.prepare(
    `INSERT INTO sms_codes (phone, code, expires_at, sent_at) VALUES (?,?,?,?)
     ON CONFLICT(phone) DO UPDATE SET code=excluded.code, expires_at=excluded.expires_at, sent_at=excluded.sent_at`
  ).run(phone, code, now + ttlMs, now);
}

export function verifyAndConsumeSmsCode(phone: string, code: string): boolean {
  const row = db.prepare('SELECT code, expires_at FROM sms_codes WHERE phone = ?').get(phone) as
    | { code: string; expires_at: number }
    | undefined;
  if (!row || Date.now() > row.expires_at) return false;
  if (row.code !== code.trim()) return false;
  db.prepare('DELETE FROM sms_codes WHERE phone = ?').run(phone);
  return true;
}

export function getLastSmsSentAt(phone: string): number | null {
  const row = db.prepare('SELECT sent_at FROM sms_codes WHERE phone = ?').get(phone) as { sent_at: number } | undefined;
  return row?.sent_at ?? null;
}

export function updateNickname(phone: string, nickname: string): void {
  const now = Date.now();
  db.prepare('UPDATE users SET nickname = ?, updated_at = ? WHERE phone = ?').run(nickname, now, phone);
}

export function setUserPassword(phone: string, password: string): void {
  const now = Date.now();
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE phone = ?').run(hashPassword(password), now, phone);
}

export function updateAvatarUrl(phone: string, url: string): void {
  const now = Date.now();
  db.prepare('UPDATE users SET avatar_url = ?, updated_at = ? WHERE phone = ?').run(url, now, phone);
}
