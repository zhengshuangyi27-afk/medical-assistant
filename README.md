<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/265e15ba-dc9d-43a5-8cd7-4ed92be1d911

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. 复制 `.env.example` 为 `.env`（或 `.env.local`），配置：
   - `GEMINI_API_KEY`：Gemini API 密钥（问答、搜索、病历生成）
   - 可选：`OPENAI_API_KEY`（语音转写 Whisper、或 GPT 模型）
   - 可选：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（见下方 Supabase）
3. **后端 + 前端一起跑：**
   - 先启动后端：`npm run server`（默认 http://localhost:3001）
   - 再启动前端：`npm run dev`（默认 http://localhost:3000，代理 /api 到后端）
   - 或使用：`npm run dev:all`（需先安装 concurrently）同时启动前后端

## 后端 API（Express）

- `POST /api/llm/chat` — 对话（body: prompt, modelId?, history?）
- `POST /api/llm/query` — 医疗搜索（body: query, modelId?）
- `POST /api/records/generate` — 根据病情描述生成病历（body: text, modelId?）
- `POST /api/records/save` — 保存病历到 Supabase（body: chiefComplaint, assessment, plan, rawInput?）
- `GET /api/records` — 病历列表（query: userId?）
- `GET /api/config/llm` — 大模型列表（支持多模型配置）
- `GET/POST /api/config/user/settings` — 用户设置（如 selected_llm）
- `POST /api/voice/transcribe` — 语音转写（multipart: audio 文件，需 OPENAI_API_KEY 用 Whisper）

## 数据存储（Supabase）

1. 在 [Supabase](https://supabase.com) 创建项目，在 SQL Editor 中执行 `supabase/schema.sql`。
2. 在 `.env` 中设置 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。
3. 表说明：`llm_configs`（多模型配置）、`medical_records`（病历）、`user_settings`（用户选中模型等）。

未配置 Supabase 时，后端仍可运行，LLM 使用内置默认模型列表，病历保存会落空（返回本地 id）。

## 微信小程序

- 目录：`miniprogram/`
- 使用微信开发者工具打开 `miniprogram` 目录，在 `app.js` 中把 `API_BASE` 改为你的后端地址（正式环境须为 HTTPS）。
- **语音输入**：使用微信自带 `wx.getRecorderManager()` 录音，录音文件上传到后端 `POST /api/voice/transcribe` 转写（需配置 OPENAI_API_KEY 使用 Whisper）；或在小程序内使用微信提供的语音识别能力（如插件）直接得到文字。
- 页面：首页、病历（语音+生成+保存）、搜索、问答、设置（多模型切换）、医学计算器。
