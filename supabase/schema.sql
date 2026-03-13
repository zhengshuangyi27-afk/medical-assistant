-- Medical Assistant: Supabase schema
-- Run in Supabase SQL Editor (Dashboard -> SQL Editor)

-- LLM 配置（支持多个大模型）
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

-- 插入默认模型（可按需修改；DashScope 需在 .env 配置 DASHSCOPE_API_KEY）
INSERT INTO llm_configs (id, provider, model_id, name, description, is_default, sort_order)
VALUES
  ('gemini-2.0-flash', 'gemini', 'gemini-2.0-flash', 'Gemini 2.0 Flash', '快速响应，适合日常问答', false, 0),
  ('gemini-1.5-pro', 'gemini', 'gemini-1.5-pro', 'Gemini 1.5 Pro', '强推理，适合复杂分析', false, 1),
  ('qwen3.5-plus', 'dashscope', 'qwen3.5-plus', '通义千问 3.5 Plus (阿里云)', 'DashScope 推荐，能力强', true, 2),
  ('qwen-turbo', 'dashscope', 'qwen-turbo', '通义千问 Turbo (阿里云)', 'DashScope 兼容接口，快速响应', false, 3),
  ('qwen-plus', 'dashscope', 'qwen-plus', '通义千问 Plus (阿里云)', 'DashScope 兼容接口，更强推理', false, 4),
  ('gpt-4o-mini', 'openai', 'gpt-4o-mini', 'GPT-4o Mini', 'OpenAI 轻量模型', false, 5)
ON CONFLICT (id) DO NOTHING;

-- 病历表
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

CREATE INDEX IF NOT EXISTS idx_medical_records_user_created ON medical_records(user_id, created_at DESC);

-- 用户设置（如当前选中的大模型）
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_key ON user_settings(user_id, key);

-- RLS 可选：若需按用户隔离，可启用 RLS 并添加 policy
-- ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
