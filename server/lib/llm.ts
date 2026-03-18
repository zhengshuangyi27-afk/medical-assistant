/**
 * Multi-LLM adapter: Gemini, OpenAI, DashScope (OpenAI 兼容).
 */
import { GoogleGenAI } from '@google/genai';
import type { LlmConfigRow } from '../types.js';

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/** LLM 请求超时（毫秒），避免长时间无响应 */
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 90_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} 请求超时（${ms / 1000}秒），请稍后重试`)), ms)
    ),
  ]);
}

async function chatWithGemini(modelId: string, messages: { role: string; content: string }[]): Promise<string> {
  if (!geminiClient) throw new Error('GEMINI_API_KEY not configured');
  const last = messages[messages.length - 1];
  const prompt = messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n') + (last?.role === 'user' ? '' : '');
  const response = await withTimeout(
    geminiClient.models.generateContent({
      model: modelId,
      contents: prompt || 'Hello',
    }),
    LLM_TIMEOUT_MS,
    'Gemini'
  );
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === 'AbortError') {
      throw new Error(`请求超时（${LLM_TIMEOUT_MS / 1000}秒），请稍后重试`);
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`fetch failed: ${msg}. 若需代理请在 .env 配置 PROXY 或 HTTPS_PROXY 后重启。`);
  }
  clearTimeout(timeoutId);
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

/** 带图片的解析（视觉模型）：传入 base64 图片，返回模型文本结果 */
export async function completeWithImage(
  config: LlmConfigRow,
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const provider = (config.provider || 'gemini').toLowerCase();
  if (provider === 'gemini') {
    return completeWithImageGemini(config.model_id, systemPrompt, userText, imageBase64, mimeType);
  }
  if (provider === 'openai') {
    return completeWithImageOpenAICompatible(
      'https://api.openai.com/v1',
      process.env.OPENAI_API_KEY!,
      config.model_id,
      systemPrompt,
      userText,
      imageBase64,
      mimeType
    );
  }
  if (provider === 'dashscope') {
    return completeWithImageOpenAICompatible(
      DASHSCOPE_BASE_URL,
      process.env.DASHSCOPE_API_KEY!,
      config.model_id,
      systemPrompt,
      userText,
      imageBase64,
      mimeType
    );
  }
  throw new Error(`Vision not supported for provider: ${provider}`);
}

async function completeWithImageGemini(
  modelId: string,
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  if (!geminiClient) throw new Error('GEMINI_API_KEY not configured');
  const contents = [
    { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } },
    { text: systemPrompt + '\n\n' + userText },
  ];
  const response = await withTimeout(
    geminiClient.models.generateContent({ model: modelId, contents }),
    LLM_TIMEOUT_MS,
    'Gemini'
  );
  return response.text ?? '';
}

async function completeWithImageOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userText: string,
  imageBase64: string,
  mimeType: string
): Promise<string> {
  const url = baseUrl.replace(/\/$/, '') + '/chat/completions';
  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
  const body = {
    model: modelId,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: dataUrl } },
        ],
      },
    ],
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API ${res.status}: ${err}`);
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content ?? '';
  } catch (e) {
    clearTimeout(timeoutId);
    if ((e as Error).name === 'AbortError') {
      throw new Error(`请求超时（${LLM_TIMEOUT_MS / 1000}秒），请稍后重试`);
    }
    throw e;
  }
}
