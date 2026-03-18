/**
 * API 根地址。
 * - 开发（npm run dev）：默认空字符串 → 请求同源 /api/*，由 Vite 代理到 3001（需同时运行 npm run server）。
 * - 生产：配置 VITE_API_URL；未配置则用当前站点 origin（前后端同域时）。
 */
const env = typeof import.meta !== 'undefined' ? ((import.meta as unknown as { env?: Record<string, string> }).env ?? {}) : {};
const viteApi = (env.VITE_API_URL || '').trim();
const API_BASE =
  viteApi ||
  (env.DEV ? '' : typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE.replace(/\/$/, '')}${p}`;
}

/** 头像等静态资源 URL（开发走同源 /uploads，生产可配 VITE_API_URL） */
export function publicAssetUrl(filePath: string): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath;
  const p = filePath.startsWith('/') ? filePath : `/${filePath}`;
  if (!API_BASE) return p;
  return `${API_BASE.replace(/\/$/, '')}${p}`;
}

function authHeaders(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {};
  const t = localStorage.getItem('medical_auth_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  let data = {} as { error?: string; hint?: string };
  if (ct.includes('application/json')) {
    data = (await res.json().catch(() => ({}))) as typeof data;
  } else {
    const text = (await res.text().catch(() => '')).trim();
    if (text && text.length < 300) {
      data = { error: text === 'Not Found' ? '' : text };
    }
  }
  if (!res.ok) {
    let msg = data.error || '';
    if (!msg) {
      if (res.status === 404) {
        msg =
          '未找到接口。请确认：1）已在本机运行 npm run server；2）前端使用 npm run dev（不要用仅静态预览访问），或设置 VITE_API_URL 指向后端地址';
      } else {
        msg = res.statusText || `请求失败（${res.status}）`;
      }
    }
    const hint = data.hint ? ` (${data.hint})` : '';
    throw new Error(msg + hint);
  }
  return data as T;
}

const networkErrorMsg =
  '无法连接后端。请先运行 npm run server（端口 3001），前端请用 npm run dev 打开，或配置 VITE_API_URL 为后端地址';

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
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
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
      headers: { ...authHeaders() },
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

export async function apiPatch<T = unknown>(path: string, body: object, options?: { timeoutMs?: number }): Promise<T> {
  try {
    const url = apiUrl(path);
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const res = await fetchWithTimeout(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
      timeoutMs,
    } as RequestInit & { timeoutMs?: number });
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new Error('请求超时，请稍后重试');
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
    const res = await fetchWithTimeout(url.toString(), {
      headers: { ...authHeaders() },
      timeoutMs,
    });
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
