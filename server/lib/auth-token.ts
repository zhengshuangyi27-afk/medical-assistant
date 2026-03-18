import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.AUTH_SECRET || 'medical-assistant-dev-secret-change-in-prod';

export interface TokenPayload {
  sub: string;
  phone: string;
  exp: number;
}

export function signToken(userId: string, phone: string, daysValid = 30): string {
  const exp = Date.now() + daysValid * 86400000;
  const payload = Buffer.from(JSON.stringify({ sub: userId, phone, exp })).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string | undefined): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const i = token.lastIndexOf('.');
  if (i <= 0) return null;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  try {
    if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload;
    if (!data.phone || !data.sub || typeof data.exp !== 'number') return null;
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

export function userSettingsKeyFromPhone(phone: string): string {
  return `u_${phone}`;
}
