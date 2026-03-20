import { Router, type Request, type Response } from 'express';
import { listLlmConfigs } from '../lib/config-db.js';
import { getSetting, setSetting } from '../lib/settings-db.js';
import { verifyToken, userSettingsKeyFromPhone } from '../lib/auth-token.js';

type UserTask = {
  id: string;
  title: string;
  time: string;
  location: string;
  status: 'in-progress' | 'pending' | 'completed' | 'cancelled';
  iconType: 'clipboard' | 'clock' | 'check';
  reminderHHmm: string;
  reminderEnabled?: boolean;
};

type ReportHistoryItem = {
  id: string;
  reportType: string;
  createdAt: string;
  parsed: unknown | null;
  rawResult: string | null;
};
const MAX_REPORT_HISTORY = 3;

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

function normalizeTask(raw: Record<string, unknown>): UserTask {
  return {
    id: String(raw.id || ''),
    title: String(raw.title || ''),
    time: String(raw.time || '—'),
    location: String(raw.location || '—'),
    status: (['in-progress', 'pending', 'completed', 'cancelled'].includes(String(raw.status))
      ? String(raw.status)
      : 'pending') as UserTask['status'],
    iconType: (['clipboard', 'clock', 'check'].includes(String(raw.iconType))
      ? String(raw.iconType)
      : 'clipboard') as UserTask['iconType'],
    reminderHHmm: /^\d{2}:\d{2}$/.test(String(raw.reminderHHmm || '')) ? String(raw.reminderHHmm) : '09:00',
    reminderEnabled: raw.reminderEnabled === false ? false : undefined,
  };
}

router.get('/user/tasks', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const raw = await getSetting(userId, 'today_tasks');
    // 数据库里尚未为该用户配置过任务时：前端应回退到本地默认任务
    if (!raw) return res.json({ tasks: null });
    let tasks: UserTask[] = [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        tasks = parsed.map((x) => normalizeTask((x ?? {}) as Record<string, unknown>));
      }
    } catch {
      tasks = [];
    }
    return res.json({ tasks });
  } catch (e) {
    console.error('Get user tasks error:', e);
    return res.status(500).json({ error: 'Failed to get tasks' });
  }
});

router.post('/user/tasks', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const body = req.body as { tasks?: unknown };
    if (!Array.isArray(body.tasks)) {
      return res.status(400).json({ error: 'tasks must be an array' });
    }
    const tasks = body.tasks.map((x) => normalizeTask((x ?? {}) as Record<string, unknown>));
    await setSetting(userId, 'today_tasks', JSON.stringify(tasks));
    return res.json({ ok: true, count: tasks.length });
  } catch (e) {
    console.error('Save user tasks error:', e);
    return res.status(500).json({ error: 'Failed to save tasks' });
  }
});

function normalizeReportHistoryItem(raw: Record<string, unknown>): ReportHistoryItem {
  return {
    id: String(raw.id || ''),
    reportType: String(raw.reportType || '未命名报告'),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    parsed: raw.parsed ?? null,
    rawResult: raw.rawResult == null ? null : String(raw.rawResult),
  };
}

router.get('/user/report-history', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const raw = await getSetting(userId, 'report_history');
    if (!raw) return res.json({ items: [] });
    let items: ReportHistoryItem[] = [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed.map((x) => normalizeReportHistoryItem((x ?? {}) as Record<string, unknown>));
      }
    } catch {
      items = [];
    }
    return res.json({ items });
  } catch (e) {
    console.error('Get report history error:', e);
    return res.status(500).json({ error: 'Failed to get report history' });
  }
});

router.post('/user/report-history', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    const body = req.body as { items?: unknown };
    if (!Array.isArray(body.items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }
    const items = body.items
      .map((x) => normalizeReportHistoryItem((x ?? {}) as Record<string, unknown>))
      .slice(0, MAX_REPORT_HISTORY);
    await setSetting(userId, 'report_history', JSON.stringify(items));
    return res.json({ ok: true, count: items.length });
  } catch (e) {
    console.error('Save report history error:', e);
    return res.status(500).json({ error: 'Failed to save report history' });
  }
});

export const configRouter = router;
