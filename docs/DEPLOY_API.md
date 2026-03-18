# 单独部署 API（Express）详细说明

本仓库的 **后端** 是 `server/index.ts`：Express，默认监听环境变量 **`PORT`**（未设置时为 `3001`）。  
前端（Vercel 等）通过 **`VITE_API_URL`** 指向这个地址。

---

## 一、部署前要理解的结构

| 内容 | 说明 |
|------|------|
| **入口** | `npm run server` 或 `npm start`（等价：`tsx server/index.ts`） |
| **健康检查** | 浏览器或 curl 访问 `https://你的API域名/health` 应返回 `{"ok":true,...}` |
| **接口前缀** | 均为 `/api/*`，例如登录 `POST /api/auth/login` |
| **CORS** | 已配置 `origin: true`，允许任意前端域名跨域调用 |
| **生产强烈建议** | 配置 **Supabase**（`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`），用户与病历进云端；否则仅用本机 SQLite，在云平台 **磁盘常是临时的**，重启后数据可能丢失 |

---

## 二、环境变量清单（按优先级）

在部署平台「Environment Variables」里逐项添加（名称区分大小写）。

### 必填（生产）

| 变量 | 说明 |
|------|------|
| **`PORT`** | 多数平台 **自动注入**，不要手写冲突；若平台要求你填，用平台给的端口或留空让其注入 |
| **`AUTH_SECRET`** | JWT 签名密钥，**长随机字符串**，不要用默认值 |
| **`SUPABASE_URL`** | Supabase 项目 URL，如 `https://xxxx.supabase.co` |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Supabase → Settings → API → **service_role**（仅后端使用，勿泄露到前端） |

### 按功能选填（LLM）

至少配置你实际会用到的模型对应 Key，否则相关接口会报错：

| 变量 | 用途 |
|------|------|
| `DASHSCOPE_API_KEY` | 通义千问（阿里云） |
| `GEMINI_API_KEY` | Google Gemini |
| `OPENAI_API_KEY` | OpenAI |

### 可选

| 变量 | 说明 |
|------|------|
| `HTTPS_PROXY` / `PROXY` | 国内访问 Gemini 等需要代理时 |
| `NODE_ENV` | 可设为 `production` |

在 Supabase **SQL Editor** 执行本仓库 **`supabase/schema.sql`**（含 `ma_users`、`medical_records`、`user_settings`、`llm_configs` 等）。

---

## 三、方式 A：Railway（推荐）

**更细的分步说明（图文级操作顺序）见：[DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)**。

概要：GitHub 连接 → 部署仓库 → **Start Command：`npm start`** → 配置 Variables → **Generate Domain** → 浏览器访问 **`/health`** → Vercel 设置 **`VITE_API_URL`**。

- **构建失败（better-sqlite3）**：Variables 加 `NPM_CONFIG_BUILD_FROM_SOURCE=true` 后 Redeploy。
- **`tsx` 找不到**：`tsx` 已放入 `dependencies`，拉最新代码后重部署。

---

## 四、方式 B：Render

1. 打开 [render.com](https://render.com) → **New** → **Web Service**。
2. 连接 GitHub 仓库，选择分支。
3. 配置示例：
   - **Runtime**：Node
   - **Build Command**：`npm install`
   - **Start Command**：`npm start`
   - **Instance type**：按需求选免费或付费
4. **Environment** 里添加与第二节相同变量。
5. 部署完成后会得到 `https://xxx.onrender.com`，同样用 `/health` 自检，再把该根地址填到 **`VITE_API_URL`**。

---

## 五、方式 C：自有 VPS（Ubuntu 示例）

1. 安装 Node 20+、git。
2. `git clone` 仓库 → `cd medical-assistant` → `npm install`。
3. 在项目根目录创建 `.env`（不要提交到 Git），写入所有环境变量。
4. 进程守护（二选一）：
   - **pm2**：`npm i -g pm2` → `pm2 start npm --name api -- start`
   - **systemd**：写 service 文件，`ExecStart=/usr/bin/npm start`，`WorkingDirectory=/path/to/medical-assistant`
5. 前面用 **Nginx** 反代：`proxy_pass http://127.0.0.1:3001;`（若本机用 3001），并配置 HTTPS 证书。
6. 对外域名指向前端时，前端 **`VITE_API_URL`** = `https://api.你的域名.com`。

---

## 六、与 Vercel 前端如何对接（再强调）

1. API 必须先能公网访问，且 **`/health` 正常**。
2. Vercel 项目 → **Environment Variables** → **`VITE_API_URL`** = API 根 URL（`https://...`，无 `/` 结尾）。
3. **重新部署** Vercel（环境变量在 **构建时** 打进前端，改完必须 Redeploy）。
4. 登录请求应打到 **API 域名**，在浏览器 F12 → Network 里可看到。

---

## 七、头像与上传目录说明

头像保存在服务器 **`server/data/uploads/avatars/`**。  
在 Railway/Render 等 **无持久盘** 或 **实例重建** 时，文件可能丢失；头像 URL 仍指向旧路径会 404。生产若要稳定，可后续改为 **Supabase Storage** 存图；当前逻辑是「路径写进 `ma_users.avatar_url` + 本机静态目录 `/uploads`」。

---

## 八、自检清单

- [ ] `/health` 返回 200 JSON  
- [ ] `POST /api/auth/register` 或 `login` 用 Postman/curl 能通（需 JSON body）  
- [ ] Supabase 已执行 `schema.sql`  
- [ ] Vercel 已设 `VITE_API_URL` 并已 Redeploy  
- [ ] 前端登录请求的 Host 是 API 域名，不是 `xxx.vercel.app`  

更简短的前端部署说明见：**[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**。
