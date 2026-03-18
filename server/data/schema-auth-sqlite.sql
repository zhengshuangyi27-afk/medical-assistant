-- =============================================================================
-- 本地登录库（SQLite）· 与 Node 端 auth-db 一致
-- 文件位置：server/data/auth.sqlite（运行 npm run server 会自动创建）
-- 若用手动工具维护，可在该库上执行本脚本。
-- =============================================================================

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

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
