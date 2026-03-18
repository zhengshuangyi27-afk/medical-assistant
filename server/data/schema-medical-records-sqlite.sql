-- =============================================================================
-- 本地病历库（无 Supabase 时使用）· server/data/medical_records.sqlite
-- =============================================================================

CREATE TABLE IF NOT EXISTS medical_records (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  patient_name TEXT,
  patient_gender TEXT,
  patient_age TEXT,
  department TEXT,
  chief_complaint TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  raw_input TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mr_user_created ON medical_records (user_id, created_at DESC);
