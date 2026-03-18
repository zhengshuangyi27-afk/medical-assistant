import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomBytes, scryptSync, timingSafeEqual, randomUUID } from 'crypto';

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

const userCols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[];
if (!userCols.some((c) => c.name === 'avatar_url')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [sh, hh] = parts;
  try {
    const salt = Buffer.from(sh, 'hex');
    const hash = scryptSync(password, salt, 64);
    const expected = Buffer.from(hh, 'hex');
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}

export type UserRow = {
  id: string;
  phone: string;
  password_hash: string | null;
  nickname: string | null;
  created_at: number;
  avatar_url?: string | null;
};

export function findUserByPhone(phone: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as UserRow | undefined;
}

export function createUser(phone: string, password: string, nickname?: string): UserRow {
  const id = randomUUID();
  const now = Date.now();
  const nh = hashPassword(password);
  const nick = nickname?.trim() || `用户${phone.slice(-4)}`;
  db.prepare('INSERT INTO users (id, phone, password_hash, nickname, created_at) VALUES (?,?,?,?,?)').run(
    id,
    phone,
    nh,
    nick,
    now
  );
  return { id, phone, password_hash: nh, nickname: nick, created_at: now, avatar_url: null };
}

/** 验证码登录时自动注册（无密码） */
export function createUserSmsOnly(phone: string): UserRow {
  const id = randomUUID();
  const now = Date.now();
  const nick = `用户${phone.slice(-4)}`;
  db.prepare('INSERT INTO users (id, phone, password_hash, nickname, created_at) VALUES (?,?,NULL,?,?)').run(
    id,
    phone,
    nick,
    now
  );
  return { id, phone, password_hash: null, nickname: nick, created_at: now, avatar_url: null };
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
  db.prepare('UPDATE users SET nickname = ? WHERE phone = ?').run(nickname, phone);
}

export function setUserPassword(phone: string, password: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE phone = ?').run(hashPassword(password), phone);
}

export function updateAvatarUrl(phone: string, url: string): void {
  db.prepare('UPDATE users SET avatar_url = ? WHERE phone = ?').run(url, phone);
}
