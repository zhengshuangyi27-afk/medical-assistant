-- =============================================================================
-- Medical Assistant · 数据库结构（PostgreSQL / Supabase）
-- 在 Supabase：Dashboard → SQL Editor → 粘贴执行（可整段执行）
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
-- 2. 病历（服务端保存接口写入；user_id 建议填登录用户标识，如 u_13800138000）
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  patient_name TEXT,
  chief_complaint TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  raw_input TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_medical_records_user_created
  ON medical_records (user_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 3. 用户设置（大模型偏好等；key 如 selected_llm、llm_by_module 的 JSON）
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
-- 4. 应用用户（可选）
-- 说明：当前 Web 登录用户默认存在本机 SQLite（server/data/auth.sqlite）。
-- 若日后把登录迁到 Supabase，可使用本表；与现有后端需另行对接。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ma_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash TEXT,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ma_users_phone ON ma_users (phone);

-- -----------------------------------------------------------------------------
-- RLS（按需开启）
-- -----------------------------------------------------------------------------
-- ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ma_users ENABLE ROW LEVEL SECURITY;
