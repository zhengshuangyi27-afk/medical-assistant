-- =============================================================================
-- 本地登录 + 用户扩展（SQLite）· 与 server/lib/auth-db.ts 一致
-- 文件：server/data/auth.sqlite（运行 server 时自动迁移列）
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  nickname TEXT,
  created_at INTEGER NOT NULL,
  avatar_url TEXT,
  updated_at INTEGER,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS sms_codes (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  sent_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);

-- 说明：若由旧版创建的无 avatar_url 表，运行 Node 时会自动 ALTER 补齐列。
