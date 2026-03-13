import { Router } from 'express';
import { complete } from '../lib/llm.js';
import { getDefaultLlmConfig, getLlmConfigById } from '../lib/config-db.js';
import { createRecord, listRecords } from '../lib/records-db.js';

const router = Router();

const RECORD_SYSTEM_PROMPT = `你是一位专业的医疗文书助手。根据用户提供的病情描述（可能包含主诉、体征等），生成一份结构化的标准病历，严格按以下 JSON 格式输出，不要包含其他说明文字：
{"chiefComplaint":"主诉（一句话）","assessment":"护理评估（简要体格与状态描述）","plan":"诊疗计划（分点列出）"}
只输出这一份 JSON，不要 markdown 代码块。`;

router.post('/generate', async (req, res) => {
  try {
    const { text, modelId } = req.body as { text?: string; modelId?: string };
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    const config = (modelId ? await getLlmConfigById(modelId) : null) ?? await getDefaultLlmConfig();
    if (!config) {
      return res.status(400).json({ error: 'No LLM config found. Configure GEMINI_API_KEY or OPENAI_API_KEY and ensure Supabase llm_configs has entries.' });
    }
    const raw = await complete(config, RECORD_SYSTEM_PROMPT, text);
    const rawStr = typeof raw === 'string' ? raw : String(raw ?? '');
    let parsed: { chiefComplaint?: string; assessment?: string; plan?: string };
    try {
      const cleaned = rawStr.replace(/```\w*\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        chiefComplaint: text.slice(0, 200),
        assessment: rawStr.slice(0, 500),
        plan: '',
      };
    }
    const record = {
      chiefComplaint: parsed.chiefComplaint ?? '',
      assessment: parsed.assessment ?? '',
      plan: parsed.plan ?? '',
    };
    return res.json(record);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Generate failed';
    const isFetchFailed = msg === 'fetch failed' || (e instanceof TypeError && e.message?.includes('fetch'));
    console.error('Records generate error:', msg, e);
    let hint: string | undefined;
    if (msg.includes('GEMINI_API_KEY')) hint = '请在 .env 中配置 GEMINI_API_KEY';
    else if (msg.includes('OPENAI') && !msg.includes('API ')) hint = '请在 .env 中配置 OPENAI_API_KEY';
    else if (msg.includes('DASHSCOPE')) hint = '请在 .env 中配置 DASHSCOPE_API_KEY';
    else if (isFetchFailed) hint = '无法连接大模型服务，请检查网络；若需代理，请在 .env 中配置 PROXY 或 HTTPS_PROXY 后重启服务';
    return res.status(500).json({
      error: isFetchFailed ? '无法连接大模型服务 (fetch failed)' : msg,
      hint,
    });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { chiefComplaint, assessment, plan, rawInput, patientName, userId } = req.body;
    if (!chiefComplaint && !assessment && !plan) {
      return res.status(400).json({ error: 'At least one of chiefComplaint, assessment, plan is required.' });
    }
    const id = await createRecord({
      user_id: userId ?? null,
      patient_name: patientName ?? null,
      chief_complaint: chiefComplaint ?? '',
      assessment: assessment ?? '',
      plan: plan ?? '',
      raw_input: rawInput ?? null,
    });
    return res.json({ id, ok: true });
  } catch (e) {
    console.error('Records save error:', e);
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Save failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || null;
    const list = await listRecords(userId);
    return res.json({ records: list });
  } catch (e) {
    console.error('Records list error:', e);
    return res.status(500).json({ error: e instanceof Error ? e.message : 'List failed' });
  }
});

export const recordsRouter = router;
