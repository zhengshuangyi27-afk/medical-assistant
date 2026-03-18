/** 默认使用阿里云 DashScope（通义千问 3.5 Plus） */
const DEFAULT_MODEL_ID = 'qwen3.5-plus';

/** 曾作为默认的 Gemini，首次加载时迁移到 DashScope */
const MIGRATE_TO_DASHSCOPE = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-preview'];
const MIGRATE_KEY = 'medical_assistant_llm_migrated';

const STORAGE_MODULES = 'medical_assistant_llm_modules';

/** 可按模块单独指定模型的功能键 */
export const LLM_MODULES = [
  { key: 'drug', label: '用药查询' },
  { key: 'records', label: '病例生成' },
  { key: 'report', label: '报告助手' },
] as const;

export type LlmModuleKey = (typeof LLM_MODULES)[number]['key'];

function loadModuleMap(): Partial<Record<LlmModuleKey, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const s = localStorage.getItem(STORAGE_MODULES);
    if (!s) return {};
    const o = JSON.parse(s) as unknown;
    if (typeof o !== 'object' || !o) return {};
    return o as Partial<Record<LlmModuleKey, string>>;
  } catch {
    return {};
  }
}

/** 从服务端同步写入的完整映射（仅含已单独指定的模块） */
export function setModuleModelMapFromServer(map: Record<string, string> | null | undefined): void {
  if (typeof window === 'undefined') return;
  if (!map || typeof map !== 'object') {
    localStorage.setItem(STORAGE_MODULES, '{}');
    return;
  }
  const allowed: LlmModuleKey[] = ['drug', 'records', 'report'];
  const next: Partial<Record<LlmModuleKey, string>> = {};
  for (const k of allowed) {
    const v = map[k];
    if (typeof v === 'string' && v.trim()) next[k] = v.trim();
  }
  localStorage.setItem(STORAGE_MODULES, JSON.stringify(next));
}

export function getModuleModelMap(): Partial<Record<LlmModuleKey, string>> {
  return { ...loadModuleMap() };
}

export function setModuleModelId(module: LlmModuleKey, modelId: string | null | undefined): void {
  const all = loadModuleMap();
  if (!modelId || !String(modelId).trim()) {
    delete all[module];
  } else {
    all[module] = String(modelId).trim();
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_MODULES, JSON.stringify(all));
  }
}

/**
 * 某功能实际使用的 modelId：若该模块未单独设置，则与全局默认一致。
 */
export function getModelIdForModule(module: LlmModuleKey): string {
  const m = loadModuleMap()[module];
  if (m && m.trim()) return m.trim();
  return getSelectedModelId();
}

/**
 * 获取当前用于请求的 modelId（全局默认）。未选择时使用 DashScope 默认模型。
 */
export function getSelectedModelId(): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL_ID;
  const raw = localStorage.getItem('selected_llm') || '';
  if (!raw) {
    localStorage.setItem('selected_llm', DEFAULT_MODEL_ID);
    return DEFAULT_MODEL_ID;
  }
  return raw;
}

/** 应用启动时执行一次：曾选 Gemini 的迁移为 DashScope */
export function migrateToDashScopeDefault(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATE_KEY)) return;
  const raw = localStorage.getItem('selected_llm') || '';
  if (MIGRATE_TO_DASHSCOPE.includes(raw)) {
    localStorage.setItem('selected_llm', DEFAULT_MODEL_ID);
  }
  localStorage.setItem(MIGRATE_KEY, '1');
}

/** 供接口同步：序列化各模块覆盖（空对象表示全部跟随全局） */
export function serializeLlmByModuleForApi(): Record<string, string> {
  const m = loadModuleMap();
  const out: Record<string, string> = {};
  for (const k of LLM_MODULES) {
    const v = m[k.key];
    if (v && v.trim()) out[k.key] = v.trim();
  }
  return out;
}
