/**
 * Multi-LLM adapter: Gemini, OpenAI, DashScope (OpenAI 兼容).
 */
import { GoogleGenAI } from '@google/genai';
import type { LlmConfigRow } from '../types.js';

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

async function chatWithGemini(modelId: string, messages: { role: string; content: string }[]): Promise<string> {
  if (!geminiClient) throw new Error('GEMINI_API_KEY not configured');
  const last = messages[messages.length - 1];
  const prompt = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n') + (last?.role === 'user' ? '' : '');
  const response = await geminiClient.models.generateContent({
    model: modelId,
    contents: prompt || 'Hello',
  });
  return response.text ?? '';
}

async function chatWithOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  messages: { role: string; content: string }[]
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  const body = {
    model: modelId,
    messages: messages.map((m) => ({
      role: m.role === 'ai' ? 'assistant' : m.role,
      content: m.content,
    })),
  };
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fetch failed: ${msg}. 若需代理请在 .env 配置 PROXY 或 HTTPS_PROXY 后重启。`);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  return content ?? '';
}

async function chatWithOpenAI(modelId: string, messages: { role: string; content: string }[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  return chatWithOpenAICompatible('https://api.openai.com/v1', key, modelId, messages);
}

async function chatWithDashScope(modelId: string, messages: { role: string; content: string }[]): Promise<string> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) throw new Error('DASHSCOPE_API_KEY not configured');
  return chatWithOpenAICompatible(DASHSCOPE_BASE_URL, key, modelId, messages);
}

export async function chat(
  config: LlmConfigRow,
  messages: { role: string; content: string }[]
): Promise<string> {
  const provider = (config.provider || 'gemini').toLowerCase();
  if (provider === 'openai') {
    return chatWithOpenAI(config.model_id, messages);
  }
  if (provider === 'dashscope') {
    return chatWithDashScope(config.model_id, messages);
  }
  return chatWithGemini(config.model_id, messages);
}

export async function complete(
  config: LlmConfigRow,
  systemPrompt: string,
  userContent: string
): Promise<string> {
  return chat(config, [
    { role: 'user', content: systemPrompt + '\n\n' + userContent },
  ]);
}
