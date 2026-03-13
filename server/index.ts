/**
 * Medical Assistant Backend
 * - LLM chat / search (multi-provider)
 * - Medical records generate & persist (Supabase)
 * - Voice transcription (for WeChat miniprogram)
 */
import 'dotenv/config';

// 启动前设置代理（.env 中 PROXY 或 HTTP_PROXY/HTTPS_PROXY），供请求 Gemini/DashScope/OpenAI 等使用
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.PROXY;
if (proxyUrl) {
  if (!process.env.HTTP_PROXY) process.env.HTTP_PROXY = proxyUrl;
  if (!process.env.HTTPS_PROXY) process.env.HTTPS_PROXY = proxyUrl;
  try {
    const { setGlobalDispatcher, ProxyAgent } = await import('undici');
    setGlobalDispatcher(new ProxyAgent(proxyUrl));
    console.log('Proxy enabled:', proxyUrl.replace(/:[^:@]+@/, ':****@'));
  } catch (e) {
    console.warn('Proxy config found but undici not available, skipping:', (e as Error).message);
  }
}

import express from 'express';
import cors from 'cors';
import { llmRouter } from './routes/llm.js';
import { recordsRouter } from './routes/records.js';
import { configRouter } from './routes/config.js';
import { voiceRouter } from './routes/voice.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/llm', llmRouter);
app.use('/api/records', recordsRouter);
app.use('/api/config', configRouter);
app.use('/api/voice', voiceRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Medical Assistant API running at http://localhost:${PORT}`);
});
