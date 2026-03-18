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
    const m = (await import('node:undici')) as {
      setGlobalDispatcher: (d: unknown) => void;
      ProxyAgent: new (url: string) => unknown;
    };
    if (m.setGlobalDispatcher && m.ProxyAgent) {
      m.setGlobalDispatcher(new m.ProxyAgent(proxyUrl));
      console.log('Proxy enabled:', proxyUrl.replace(/:[^:@]+@/, ':****@'));
    }
  } catch {
    console.warn(
      'Proxy: 已设置 HTTP_PROXY/HTTPS_PROXY；全局 fetch 代理需 Node 20.10+（内置 undici）。当前可依赖各 SDK 是否读取环境变量代理。'
    );
  }
}

import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { llmRouter } from './routes/llm.js';
import { recordsRouter } from './routes/records.js';
import { configRouter } from './routes/config.js';
import { voiceRouter } from './routes/voice.js';
import { reportRouter } from './routes/report.js';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsRoot = path.join(process.cwd(), 'server', 'data', 'uploads');
fs.mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
app.use('/uploads', express.static(uploadsRoot));

app.use('/api/llm', llmRouter);
app.use('/api/records', recordsRouter);
app.use('/api/config', configRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/report', reportRouter);
app.use('/api/auth', authRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API 路径不存在，请确认后端已更新并包含 /api/auth 等路由' });
});

app.listen(PORT, HOST, () => {
  console.log(`Medical Assistant API listening on http://${HOST}:${PORT}`);
});
