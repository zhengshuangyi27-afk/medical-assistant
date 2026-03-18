import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { verifyPassword } from '../lib/auth-password.js';
import {
  findUserByPhone,
  createUser,
  setUserPassword,
  updateNickname,
  updateAvatarUrl,
  recordLogin,
  type UserRow,
} from '../lib/auth-store.js';
import { signToken, verifyToken } from '../lib/auth-token.js';

const router = Router();
const PHONE_RE = /^1[3-9]\d{9}$/;

const AVATAR_DIR = path.join(process.cwd(), 'server', 'data', 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持 jpg、png、webp、gif'));
  },
});

function userPayload(u: UserRow) {
  return {
    id: u.id,
    phone: u.phone,
    nickname: u.nickname,
    hasPassword: !!u.password_hash,
    avatarUrl: u.avatar_url || null,
  };
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    const nickname = String(req.body?.nickname || '').trim() || undefined;

    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    if (password.length < 6 || password.length > 32) {
      return res.status(400).json({ error: '密码长度为 6～32 位' });
    }
    const existing = await findUserByPhone(phone);
    if (existing?.password_hash) {
      return res.status(400).json({ error: '该手机号已注册，请直接登录' });
    }
    let user: UserRow;
    if (existing && !existing.password_hash) {
      await setUserPassword(phone, password);
      if (nickname) await updateNickname(phone, nickname);
      user = (await findUserByPhone(phone))!;
    } else {
      user = await createUser(phone, password, nickname);
    }
    await recordLogin(phone);
    const token = signToken(user.id, user.phone);
    return res.json({ token, user: userPayload(user) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '注册失败';
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('23505')) {
      return res.status(400).json({ error: '该手机号已注册，请直接登录' });
    }
    console.error('register', e);
    return res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const phone = String(req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    if (!PHONE_RE.test(phone)) {
      return res.status(400).json({ error: '手机号格式不正确' });
    }
    const user = await findUserByPhone(phone);
    if (!user?.password_hash) {
      return res.status(400).json({ error: '账号不存在或未设置密码，请先注册' });
    }
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(400).json({ error: '手机号或密码错误' });
    }
    await recordLogin(phone);
    const token = signToken(user.id, user.phone);
    return res.json({ token, user: userPayload(user) });
  } catch (e) {
    console.error('login', e);
    return res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '未登录或登录已过期' });
  }
  try {
    const user = await findUserByPhone(payload.phone);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    return res.json({ user: userPayload(user) });
  } catch (e) {
    console.error('me', e);
    return res.status(500).json({ error: '加载失败' });
  }
});

function avatarUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  avatarUpload.single('avatar')(req, res, (err: unknown) => {
    if (err) {
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      if (code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '图片请小于 2MB' });
      }
      const msg = err instanceof Error ? err.message : '上传失败';
      return res.status(400).json({ error: msg });
    }
    next();
  });
}

router.post('/avatar', avatarUploadMiddleware, async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: '未登录' });
    }
    const user = await findUserByPhone(payload.phone);
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: '请选择图片文件' });
    }
    const mime = req.file.mimetype.toLowerCase();
    const ext =
      mime === 'image/png'
        ? '.png'
        : mime === 'image/webp'
          ? '.webp'
          : mime === 'image/gif'
            ? '.gif'
            : '.jpg';
    try {
      const files = fs.readdirSync(AVATAR_DIR);
      for (const f of files) {
        const base = f.replace(/\.[^.]+$/, '');
        if (base === user.id) {
          fs.unlinkSync(path.join(AVATAR_DIR, f));
        }
      }
    } catch {
      /* ignore */
    }
    const filename = `${user.id}${ext}`;
    fs.writeFileSync(path.join(AVATAR_DIR, filename), req.file.buffer);
    const publicPath = `/uploads/avatars/${filename}`;
    await updateAvatarUrl(user.phone, publicPath);
    return res.json({ ok: true, avatarUrl: publicPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '上传失败';
    if (msg.includes('仅支持')) {
      return res.status(400).json({ error: msg });
    }
    console.error('avatar', e);
    return res.status(500).json({ error: '头像上传失败' });
  }
});

router.patch('/profile', async (req: Request, res: Response) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : '';
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: '未登录' });
  }
  const nickname = String(req.body?.nickname || '').trim();
  if (nickname.length < 1 || nickname.length > 32) {
    return res.status(400).json({ error: '昵称为 1～32 字' });
  }
  try {
    await updateNickname(payload.phone, nickname);
    return res.json({ ok: true, nickname });
  } catch (e) {
    console.error('profile patch', e);
    return res.status(500).json({ error: '更新失败' });
  }
});

export const authRouter = router;
