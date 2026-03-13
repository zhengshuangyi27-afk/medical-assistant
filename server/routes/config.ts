import { Router, type Request, type Response } from 'express';
import { listLlmConfigs } from '../lib/config-db.js';
import { getSetting, setSetting } from '../lib/settings-db.js';

const router = Router();

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
    const userId = (req.query.userId as string) || 'default';
    const selectedLlm = await getSetting(userId, 'selected_llm');
    return res.json({ selected_llm: selectedLlm || null });
  } catch (e) {
    console.error('Get user settings error:', e);
    return res.status(500).json({ error: 'Failed to get settings' });
  }
});

const putUserSettings = async (req: Request, res: Response) => {
  try {
    const { userId = 'default', selected_llm } = req.body;
    if (selected_llm != null) {
      await setSetting(userId, 'selected_llm', String(selected_llm));
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
