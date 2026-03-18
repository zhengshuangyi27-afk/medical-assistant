# Railway 部署 API（手把手）

把本项目的 **Express 后端** 部署到 Railway，供 Vercel 前端通过 **`VITE_API_URL`** 调用。

---

## 零、开始前请准备好

| 项目 | 说明 |
|------|------|
| GitHub | 代码已推到仓库（如 `zhengshuangyi27-afk/medical-assistant`） |
| Supabase | 已建项目，并在 SQL Editor 执行过 **`supabase/schema.sql`** |
| 大模型 Key | 至少配一个（如通义 `DASHSCOPE_API_KEY`），否则部分功能不可用 |

---

## 一、注册并连接 GitHub

1. 打开 **https://railway.app** → 用 **GitHub** 登录。  
2. 若提示授权，允许 Railway 访问你的仓库。

---

## 二、新建项目并部署仓库

1. 首页点 **New Project**。  
2. 选 **Deploy from GitHub repo**（从 GitHub 部署）。  
3. 若第一次用：点 **Configure GitHub App**，把要部署的仓库 **勾选** 给 Railway。  
4. 在列表里选中 **`medical-assistant`**（你的仓库名）。  
5. Railway 会自动创建一个 **Service** 并开始 **Build + Deploy**。

> **注意**：有时会检测到多个进程或误加空服务，只保留 **一个** 指向本仓库的服务即可。

---

## 三、配置启动命令（很重要）

仓库根目录已有 **`railway.toml`**，里面写了 **`startCommand = "npm start"`**，多数情况下 Railway 会直接按此启动，无需再改。

若界面里仍显示别的启动方式，请手动改：

1. 点进 **该服务** → **Settings** → **Deploy**。  
2. **Custom Start Command**：与仓库 **`railway.toml`** 一致，填 **`tsx server/index.ts`**（不要用 `npm start`，否则容器被停时 npm 常打出 SIGTERM 红字）。若提示找不到 `tsx`，再试 **`npx tsx server/index.ts`**。  
3. **Root Directory**：留空。  
4. 保存后必要时 **Redeploy**。

> **`tsx` 已放在 `dependencies` 里**，这样 Railway 即使用「仅生产依赖」安装，也能找到 `tsx`，避免启动报 `command not found`。

---

## 四、配置环境变量（Variables）

1. 仍在该服务里，点 **Variables**（变量）。  
2. 点 **New Variable**，**逐个添加**（名称必须一致）：

| 变量名 | 示例 / 说明 |
|--------|-------------|
| `AUTH_SECRET` | 随便一串 **32 位以上随机字符**（用于登录 Token，勿泄露） |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Project Settings → API → service_role**（secret） |
| `DASHSCOPE_API_KEY` | 用通义时必填（阿里云 DashScope） |
| `GEMINI_API_KEY` | 用 Gemini 时填 |
| `OPENAI_API_KEY` | 用 OpenAI 时填 |

**不要** 手动添加 `PORT`：Railway 会 **自动注入**，Express 已使用 `process.env.PORT`。

可选：

| 变量名 | 说明 |
|--------|------|
| `NODE_ENV` | 填 `production` |
| `HTTPS_PROXY` | 访问 Gemini 等需代理时 |

3. 每加一条会自动触发 **重新部署**，等状态变为 **Success**（绿色）。

---

## 五、生成公网域名

1. 同一服务 → **Settings** → **Networking**。  
2. 打开 **Public Networking**（公共网络）。  
3. 点 **Generate Domain**（生成域名）。  
4. 会得到类似：  
   `https://medical-assistant-production-xxxx.up.railway.app`  
   **复制根地址**（不要末尾 `/`）。

---

## 六、验证 API 是否正常

浏览器新开标签访问：

```text
https://你的域名/health
```

应看到 JSON，例如：`{"ok":true,"ts":"..."}`。

- 若 **502 / Application failed**：点服务 **Deployments → 最新一条 → View Logs**，看是否缺环境变量、或 `better-sqlite3` 编译失败等。  
- **`better-sqlite3` 报错**：在 Variables 增加 `NPM_CONFIG_BUILD_FROM_SOURCE=true` 后 Redeploy；生产数据以 **Supabase** 为准，SQLite 只是未配 Supabase 时的兜底。

---

## 七、对接 Vercel 前端

1. 打开 Vercel 项目 → **Settings → Environment Variables**。  
2. 新增：**`VITE_API_URL`** = `https://你的Railway域名`（**无尾斜杠**）。  
3. **Deployments → Redeploy** 前端（改环境变量后必须重新构建）。

---

## 八、常见问题

| 现象 | 处理 |
|------|------|
| **Application failed to respond** | 多为进程在监听前崩溃。请确认 Railway **Variables** 里已配置 **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`**。未配 Supabase 时会加载 SQLite，在 Linux 上易失败。 |
| **`npm error signal SIGTERM` / Stopping Container** | 多为 **正常关容器**：重新部署、缩容、免费档休眠时平台会发 SIGTERM。若日志里先有 `listening on http://0.0.0.0:…` 再出现 SIGTERM，一般是旧实例被换下，**不必慌**。最新代码用 **`tsx server/index.ts`** 直接启动（见 `railway.toml`），可减少 npm 误报。 |
| 部署成功但立刻 Crash | 看 **Deployments → Logs**：缺 `AUTH_SECRET`、Supabase Key 错误、启动命令错误。 |
| `tsx: not found` | 拉最新代码后 Redeploy。 |
| 登录 404 | 前端 **`VITE_API_URL`** 指向 Railway 域名并 Redeploy Vercel。 |
| 免费额度 / 休眠 | 首次访问慢属正常。 |

---

## 九、和「通用 API 部署说明」的关系

环境变量含义、头像目录说明等，与 **[DEPLOY_API.md](./DEPLOY_API.md)** 一致；本文只把 **Railway 操作步骤** 写细。
