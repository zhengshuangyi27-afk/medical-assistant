/** 与 auth-db / auth-supabase 返回结构一致，供不加载 SQLite 的模块引用类型 */
export type UserRow = {
  id: string;
  phone: string;
  password_hash: string | null;
  nickname: string | null;
  created_at: number;
  avatar_url?: string | null;
  updated_at?: number | null;
  last_login_at?: number | null;
};
