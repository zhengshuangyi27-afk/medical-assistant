import { supabase } from './supabase.js';
import type { LlmConfigRow } from '../types.js';

const DEFAULT_LLM_CONFIGS: LlmConfigRow[] = [
  { id: 'gemini-2.0-flash', provider: 'gemini', model_id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速响应，适合日常问答', is_default: false, sort_order: 0 },
  { id: 'gemini-1.5-pro', provider: 'gemini', model_id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '强推理，适合复杂分析', is_default: false, sort_order: 1 },
  { id: 'qwen3.5-plus', provider: 'dashscope', model_id: 'qwen3.5-plus', name: '通义千问 3.5 Plus (阿里云)', description: 'DashScope 推荐，能力强', is_default: true, sort_order: 2 },
  { id: 'qwen-turbo', provider: 'dashscope', model_id: 'qwen-turbo', name: '通义千问 Turbo (阿里云)', description: 'DashScope 兼容接口，快速响应', is_default: false, sort_order: 3 },
  { id: 'qwen-plus', provider: 'dashscope', model_id: 'qwen-plus', name: '通义千问 Plus (阿里云)', description: 'DashScope 兼容接口，更强推理', is_default: false, sort_order: 4 },
  { id: 'gpt-4o-mini', provider: 'openai', model_id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'OpenAI 轻量模型', is_default: false, sort_order: 5 },
];

/** 内存缓存：减少每次 /chat、/query 都查库 */
let configCache: { list: LlmConfigRow[]; at: number } | null = null;
const CONFIG_CACHE_TTL_MS = 60_000;

export async function listLlmConfigs(): Promise<LlmConfigRow[]> {
  const now = Date.now();
  if (configCache && now - configCache.at < CONFIG_CACHE_TTL_MS) {
    return configCache.list;
  }
  if (supabase) {
    const { data, error } = await supabase
      .from('llm_configs')
      .select('id, provider, model_id, name, description, is_default, sort_order')
      .order('sort_order', { ascending: true });
    if (!error && data?.length) {
      configCache = { list: data as LlmConfigRow[], at: now };
      return configCache.list;
    }
  }
  configCache = { list: [...DEFAULT_LLM_CONFIGS], at: now };
  return configCache.list;
}

export async function getLlmConfigById(id: string): Promise<LlmConfigRow | null> {
  if (!id) return null;
  const list = await listLlmConfigs();
  return list.find((c) => c.id === id) ?? null;
}

export async function getDefaultLlmConfig(): Promise<LlmConfigRow | null> {
  const list = await listLlmConfigs();
  return list.find((c) => c.is_default) ?? list[0] ?? null;
}
