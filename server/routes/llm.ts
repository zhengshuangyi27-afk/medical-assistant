import { Router } from 'express';
import { chat, complete } from '../lib/llm.js';
import { getLlmConfigById, listLlmConfigs, getDefaultLlmConfig } from '../lib/config-db.js';
import type { ApiChatMessage } from '../types.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const { prompt, modelId, history = [] } = req.body as {
      prompt?: string;
      modelId?: string;
      history?: ApiChatMessage[];
    };
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }
    const config = modelId
      ? await getLlmConfigById(modelId)
      : await getDefaultLlmConfig();
    if (!config) {
      return res.status(400).json({ error: 'No LLM config found. Configure model in Supabase or env.' });
    }
    const messages: { role: string; content: string }[] = [
      ...history.map((m) => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];
    const text = await chat(config, messages);
    return res.json({ reply: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'LLM chat failed';
    const isFetchFailed = msg.includes('fetch failed');
    console.error('LLM chat error:', e);
    return res.status(500).json({
      error: isFetchFailed ? '无法连接大模型服务 (fetch failed)' : msg,
      hint: isFetchFailed ? '若需代理请在 .env 配置 PROXY 或 HTTPS_PROXY 后重启服务' : undefined,
    });
  }
});

const DRUG_QUERY_BLOCKED_MSG =
  '本模块仅限药品与用药相关查询。请输入药品名称或用药问题（如：二甲双胍用法用量、阿莫西林禁忌、两种药能否同服）。疾病诊断、手术流程、护理常识等请使用其他功能。';

router.post('/query', async (req, res) => {
  try {
    const { query, modelId } = req.body as { query?: string; modelId?: string };
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query is required' });
    }
    const config = modelId
      ? await getLlmConfigById(modelId)
      : await getDefaultLlmConfig();
    if (!config) {
      return res.status(400).json({ error: 'No LLM config found.' });
    }
    const systemPrompt = `你是用药查询专用助手，仅服务「药品、药物、用药」相关问题。

第一步：判断用户问题是否明确与药品/用药相关。以下属于允许范围：具体药名、用法用量、禁忌、不良反应、药物相互作用、同类药比较、服药时间等。
以下禁止回答（与药品无直接关系）：纯疾病诊断、手术流程、护理操作、体检解读（未点名药品）、养生百科、非药物疗法等——一律视为非药品查询。

若属于禁止范围，只输出这一行 JSON（不要其它字段）：
{"drugQueryBlocked":true,"message":"本模块仅限药品与用药相关查询，请重新输入药品名或用药问题。"}

若属于允许范围，只输出一行 JSON（不要 drugQueryBlocked），键名必须为：推荐剂量、禁忌症与相互作用、指南摘要、指南来源。值均为字符串。不适用填 "—"。
示例：{"推荐剂量":"口服500mg每日两次","禁忌症与相互作用":"严重肾功能损害。\\n避免饮酒。","指南摘要":"二甲双胍为一线用药。","指南来源":"ADA 2024 糖尿病诊疗标准"}`;
    const text = await complete(config, systemPrompt, `用户问题：${query}`);
    try {
      const cleaned = text.replace(/^```\w*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        const obj = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
        if (obj.drugQueryBlocked === true) {
          const raw = typeof obj.message === 'string' ? obj.message.trim() : '';
          const msg = raw.length >= 8 ? raw : DRUG_QUERY_BLOCKED_MSG;
          return res.json({ blocked: true, message: msg, result: text });
        }
      }
    } catch {
      /* 非 JSON 时按正常结果返回 */
    }
    return res.json({ blocked: false, result: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'LLM query failed';
    const isFetchFailed = msg.includes('fetch failed');
    console.error('LLM query error:', e);
    return res.status(500).json({
      error: isFetchFailed ? '无法连接大模型服务 (fetch failed)' : msg,
      hint: isFetchFailed ? '若需代理请在 .env 配置 PROXY 或 HTTPS_PROXY 后重启服务' : undefined,
    });
  }
});

export const llmRouter = router;
