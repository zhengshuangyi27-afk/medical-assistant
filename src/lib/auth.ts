const TOKEN_KEY = 'medical_auth_token';
const USER_KEY = 'medical_auth_user';

export type AuthUser = {
  id: string;
  phone: string;
  nickname: string | null;
  hasPassword: boolean;
  /** 相对路径如 /uploads/avatars/xxx.jpg */
  avatarUrl?: string | null;
  /** 客户端递增，用于更换头像后刷新图片缓存 */
  avatarRev?: number;
};

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(USER_KEY);
    if (!s) return null;
    return JSON.parse(s) as AuthUser;
  } catch {
    return null;
  }
}

export function maskPhone(phone: string): string {
  if (phone.length !== 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
