-- =============================================================================
-- Medical Assistant · 数据库结构（PostgreSQL / Supabase）
-- 在 Supabase：Dashboard → SQL Editor → 粘贴执行
-- 已有旧库请先执行文末「迁移」一节，或逐段执行避免重复报错
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. LLM 配置（多模型列表，供「我的」里选择）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_configs (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'gemini',
  model_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO llm_configs (id, provider, model_id, name, description, is_default, sort_order)
VALUES
  ('gemini-2.0-flash', 'gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', '快速响应，适合日常问答', false, 0),
  ('gemini-1.5-pro', 'gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', '强推理，适合复杂分析', false, 1),
  ('qwen3.5-plus', 'dashscope', 'qwen3.5-plus', '通义千问 3.5 Plus (阿里云)', 'DashScope 推荐，能力强', true, 2),
  ('qwen-turbo', 'dashscope', 'qwen-turbo', '通义千问 Turbo (阿里云)', 'DashScope 快速响应', false, 3),
  ('qwen-plus', 'dashscope', 'qwen-plus', '通义千问 Plus (阿里云)', 'DashScope 更强推理', false, 4),
  ('gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o Mini', 'OpenAI 轻量模型', false, 5)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. 病历（服务端保存；user_id 建议 u_手机号 或与 JWT 一致）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  patient_name TEXT,
  patient_gender TEXT,
  patient_age TEXT,
  department TEXT,
  chief_complaint TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  raw_input TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_user_created
  ON medical_records (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. 用户设置（大模型偏好等，key-value）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings (user_id, key);

-- -----------------------------------------------------------------------------
-- 4. 应用用户（可选，与 Web 本机 SQLite 登录可并行存在）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ma_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT,
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ma_users_phone ON ma_users (phone);

-- -----------------------------------------------------------------------------
-- 5. 云端草稿（病例/报告等 JSON，多设备可同步；前端可后续对接）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  draft_type TEXT NOT NULL,
  title TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_drafts_user_updated ON app_drafts (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_drafts_type ON app_drafts (user_id, draft_type);

-- -----------------------------------------------------------------------------
-- 6. 报告助手分析记录（可选审计 / 历史）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  user_message TEXT,
  model_summary TEXT,
  raw_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_analyses_user ON report_analyses (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 7. 用药查询等检索日志（可选统计，敏感环境勿存原文可改存 hash）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  query_text TEXT NOT NULL,
  source_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_user ON search_logs (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 迁移：从旧版 schema 升级（列已存在时会跳过或报错，可单条执行）
-- -----------------------------------------------------------------------------
ALTER TABLE ma_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE ma_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE ma_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
UPDATE ma_users SET updated_at = created_at WHERE updated_at IS NULL;

ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS patient_gender TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS patient_age TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
UPDATE medical_records SET updated_at = created_at WHERE updated_at IS NULL;

-- -----------------------------------------------------------------------------
-- RLS（生产环境按需开启并编写策略）
-- -----------------------------------------------------------------------------
-- ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ma_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_drafts ENABLE ROW LEVEL SECURITY;
