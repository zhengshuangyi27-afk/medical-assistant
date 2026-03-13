/** 默认使用阿里云 DashScope（通义千问 3.5 Plus） */
const DEFAULT_MODEL_ID = 'qwen3.5-plus';

/** 曾作为默认的 Gemini，首次加载时迁移到 DashScope */
const MIGRATE_TO_DASHSCOPE = ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-preview'];
const MIGRATE_KEY = 'medical_assistant_llm_migrated';

/**
 * 获取当前用于请求的 modelId。未选择时使用 DashScope（qwen-turbo）。
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
