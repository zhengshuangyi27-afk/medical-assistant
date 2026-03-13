/**
 * 病历草稿本地存储（localStorage），用于「保存至本地」兜底或纯本地草稿箱。
 */

const DRAFTS_KEY = 'medical_records_drafts';

export interface DraftRecord {
  id: string;
  chiefComplaint: string;
  assessment: string;
  plan: string;
  rawInput?: string;
  patientName?: string;
  savedAt: string;
}

export function saveDraftToLocal(record: {
  chiefComplaint: string;
  assessment: string;
  plan: string;
  rawInput?: string;
  patientName?: string;
}): string {
  const id = 'local-' + Date.now();
  const draft: DraftRecord = {
    id,
    ...record,
    savedAt: new Date().toISOString(),
  };
  const list = getLocalDrafts();
  list.unshift(draft);
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(list.slice(0, 20)));
  }
  return id;
}

export function getLocalDrafts(): DraftRecord[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function deleteLocalDraft(id: string): void {
  const list = getLocalDrafts().filter((d) => d.id !== id);
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(list));
}
