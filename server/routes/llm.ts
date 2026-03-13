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
    const systemPrompt = `你是医疗AI助手。请仅用一行 JSON 回答用药/医疗查询，不要任何解释、不要 markdown、不要换行。直接输出一行，以 { 开头、以 } 结尾。
键名必须为：推荐剂量、禁忌症与相互作用、指南摘要、指南来源。值均为字符串。不适用填 "—"。
示例：{"推荐剂量":"口服500mg每日两次","禁忌症与相互作用":"严重肾功能损害。\\n避免饮酒。","指南摘要":"二甲双胍为一线用药。","指南来源":"ADA 2024 糖尿病诊疗标准"}`;
    const text = await complete(config, systemPrompt, `问题：${query}`);
    return res.json({ result: text });
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
