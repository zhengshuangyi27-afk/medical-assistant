/**
 * 未配置 Supabase 时，病历持久化到本机 SQLite（server/data/medical_records.sqlite）
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import type { RecordRow } from './records-types.js';

const dataDir = path.join(process.cwd(), 'server', 'data');
const dbPath = path.join(dataDir, 'medical_records.sqlite');

fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(dbPath);

db.exec(`
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
`);

const userCols = db.prepare('PRAGMA table_info(medical_records)').all() as { name: string }[];
for (const col of ['patient_gender', 'patient_age', 'department', 'updated_at'] as const) {
  if (!userCols.some((c) => c.name === col)) {
    if (col === 'updated_at') {
      db.exec('ALTER TABLE medical_records ADD COLUMN updated_at INTEGER');
      db.prepare('UPDATE medical_records SET updated_at = created_at WHERE updated_at IS NULL').run();
    } else {
      db.exec(`ALTER TABLE medical_records ADD COLUMN ${col} TEXT`);
    }
  }
}

export type { RecordRow };

export function sqliteCreateRecord(row: RecordRow): string {
  const id = randomUUID();
  const now = Date.now();
  db.prepare(
    `INSERT INTO medical_records (
      id, user_id, patient_name, patient_gender, patient_age, department,
      chief_complaint, assessment, plan, raw_input, created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    row.user_id,
    row.patient_name,
    row.patient_gender ?? null,
    row.patient_age ?? null,
    row.department ?? null,
    row.chief_complaint,
    row.assessment,
    row.plan,
    row.raw_input,
    now,
    now
  );
  return id;
}

export function sqliteListRecords(userId: string | null) {
  let rows: {
    id: string;
    chief_complaint: string;
    assessment: string;
    plan: string;
    patient_name: string | null;
    created_at: number;
  }[];
  if (userId) {
    rows = db
      .prepare(
        `SELECT id, chief_complaint, assessment, plan, patient_name, created_at
         FROM medical_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 200`
      )
      .all(userId) as typeof rows;
  } else {
    rows = db
      .prepare(
        `SELECT id, chief_complaint, assessment, plan, patient_name, created_at
         FROM medical_records ORDER BY created_at DESC LIMIT 200`
      )
      .all() as typeof rows;
  }
  return rows.map((r) => ({
    id: r.id,
    chief_complaint: r.chief_complaint,
    assessment: r.assessment,
    plan: r.plan,
    patient_name: r.patient_name,
    created_at: new Date(r.created_at).toISOString(),
  }));
}
