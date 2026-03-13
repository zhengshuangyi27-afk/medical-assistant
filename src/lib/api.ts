/**
 * 前端请求后端 API 的 base URL。
 * 开发时 Vite 代理或直接连本地 server；生产环境配置 VITE_API_URL。
 */
const API_BASE = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL
  ? (import.meta as any).env.VITE_API_URL
  : (typeof window !== 'undefined' ? '' : 'http://localhost:3001');

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

export async function apiPost<T = unknown>(path: string, body: object): Promise<T> {
  try {
    const url = apiUrl(path);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if (e instanceof TypeError && (e.message === 'fetch failed' || e.message.includes('Failed to fetch'))) {
      throw new Error(networkErrorMsg);
    }
    throw e;
  }
}

export async function apiGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  try {
    const url = new URL(apiUrl(path), typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString());
    return handleResponse(res) as Promise<T>;
  } catch (e) {
    if (e instanceof TypeError && (e.message === 'fetch failed' || e.message.includes('Failed to fetch'))) {
      throw new Error(networkErrorMsg);
    }
    throw e;
  }
}
