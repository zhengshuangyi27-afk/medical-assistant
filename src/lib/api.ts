/**
 * 前端请求后端 API 的 base URL。
 * 生产环境配置 VITE_API_URL；开发时未配置则直连后端 3001，避免代理导致 404。
 */
const API_BASE = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
  ? (import.meta as any).env.VITE_API_URL
  : (typeof window !== 'undefined' ? 'http://localhost:3001' : 'http://localhost:3001');

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({})) as { error?: string; hint?: string };
  if (!res.ok) {
    const msg = data.error || res.statusText;
    const hint = data.hint ? ` (${data.hint})` : '';
    throw new Error(msg + hint);
  }
  return data as T;
}

const networkErrorMsg = '无法连接后端，请确认已运行 npm run server（端口 3001）';

/** LLM 类接口可等待较长时间；其他接口用较短超时 */
const LLM_TIMEOUT_MS = 90_000;
const DEFAULT_TIMEOUT_MS = 25_000;

function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init.timeoutMs ?? (url.includes('/api/llm') || url.includes('/api/records/generate') ? LLM_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = controller.signal;
  const { timeoutMs: _t, ...fetchInit } = init;
  return fetch(url, { ...fetchInit, signal }).finally(() => clearTimeout(timeoutId));
}

export async function apiPost<T = unknown>(path: string, body: object, options?: { timeoutMs?: number }): Promise<T> {
  try {
    const url = apiUrl(path);
    const timeoutMs = options?.timeoutMs ?? (path.includes('/api/llm') || path.includes('/api/records/generate') ? LLM_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs,
    } as RequestInit & { timeoutMs?: number });
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    if (e instanceof TypeError && (e.message === 'fetch failed' || e.message.includes('Failed to fetch'))) {
      throw new Error(networkErrorMsg);
    }
    throw e;
  }
}

/** 上传表单（如报告图片），body 为 FormData，不要设置 Content-Type 让浏览器自动加 boundary */
export async function apiPostFormData<T = unknown>(path: string, body: FormData, options?: { timeoutMs?: number }): Promise<T> {
  try {
    const url = apiUrl(path);
    const timeoutMs = options?.timeoutMs ?? (path.includes('/api/report') ? LLM_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body,
      timeoutMs,
    } as RequestInit & { timeoutMs?: number });
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    if (e instanceof TypeError && (e.message === 'fetch failed' || e.message.includes('Failed to fetch'))) {
      throw new Error(networkErrorMsg);
    }
    throw e;
  }
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string>, options?: { timeoutMs?: number }): Promise<T> {
  try {
    const url = new URL(apiUrl(path), typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const res = await fetchWithTimeout(url.toString(), { timeoutMs });
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }
    if (e instanceof TypeError && (e.message === 'fetch failed' || e.message.includes('Failed to fetch'))) {
      throw new Error(networkErrorMsg);
    }
    throw e;
  }
}
