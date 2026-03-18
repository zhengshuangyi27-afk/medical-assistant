import { Router, type Request, type Response } from 'express';
import { listLlmConfigs } from '../lib/config-db.js';
import { getSetting, setSetting } from '../lib/settings-db.js';
import { verifyToken, userSettingsKeyFromPhone } from '../lib/auth-token.js';

const router = Router();

function resolveUserId(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    const p = verifyToken(auth.slice(7));
    if (p?.phone) return userSettingsKeyFromPhone(p.phone);
  }
  const fromBody = (req.body as { userId?: string })?.userId;
  const fromQuery = req.query.userId as string | undefined;
  return fromBody || fromQuery || 'default';
}

router.get('/llm', async (_req, res) => {
  try {
    const list = await listLlmConfigs();
    return res.json({ models: list });
  } catch (e) {
    console.error('Config llm error:', e);
    return res.status(500).json({ error: 'Failed to list LLM configs' });
  }
});

router.get('/user/settings', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let userId = 'default';
    if (auth?.startsWith('Bearer ')) {
      const p = verifyToken(auth.slice(7));
      if (p?.phone) userId = userSettingsKeyFromPhone(p.phone);
    } else {
      userId = (req.query.userId as string) || 'default';
    }
    const selectedLlm = await getSetting(userId, 'selected_llm');
    let llm_by_module: Record<string, string> | null = null;
    const raw = await getSetting(userId, 'llm_by_module');
    if (raw != null && String(raw).length > 0) {
      try {
        const p = JSON.parse(raw) as unknown;
        if (p && typeof p === 'object') llm_by_module = p as Record<string, string>;
        else llm_by_module = {};
      } catch {
        llm_by_module = {};
      }
    }
    return res.json({ selected_llm: selectedLlm || null, llm_by_module });
  } catch (e) {
    console.error('Get user settings error:', e);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

const putUserSettings = async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const { selected_llm, llm_by_module } = req.body as {
      selected_llm?: string | null;
      llm_by_module?: Record<string, string> | null;
    };
    if (selected_llm != null) {
      await setSetting(userId, 'selected_llm', String(selected_llm));
    }
    if (llm_by_module != null && typeof llm_by_module === 'object') {
      await setSetting(userId, 'llm_by_module', JSON.stringify(llm_by_module));
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('Put user settings error:', e);
    return res.status(500).json({ error: 'Failed to save settings' });
  }
};
router.put('/user/settings', putUserSettings);
router.post('/user/settings', putUserSettings);

export const configRouter = router;
