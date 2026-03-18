# 部署到 Vercel（前端）+ 独立 API

本项目的 **React 前端** 与 **Express 后端** 是分离的。  
**API 单独部署的详细步骤见：[DEPLOY_API.md](./DEPLOY_API.md)**。  
Vercel 默认只构建静态页面，**不会运行** `server/index.ts`，因此直接访问 `https://xxx.vercel.app/api/auth/login` 会返回 **NOT_FOUND**。

## 正确做法

### 1. 先部署后端（任选其一）

把 **整个仓库** 部署到支持 Node 的平台，启动命令示例：

```bash
npm install
npm run server
```

环境变量至少配置：

- `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`（若用云端库）
- `AUTH_SECRET`
- 各 LLM Key（按你启用的模型）

记下公网地址，例如：`https://medical-api.up.railway.app`（**不要**尾斜杠）。

> 平台示例：Railway、Render、Fly.io、自己的 VPS 等。需开放端口并监听 `process.env.PORT`。

### 2. 再配置 Vercel 前端

1. 打开 Vercel 项目 → **Settings** → **Environment Variables**
2. 新增：
   - **Name**: `VITE_API_URL`
   - **Value**: `https://medical-api.up.railway.app`（换成你的 API 根地址）
3. **Save** 后到 **Deployments** → 对最新部署 **Redeploy**（环境变量会打进前端构建）

### 3. 头像 `/uploads`

头像文件在 API 服务器本地磁盘。生产环境若前端用 `VITE_API_URL` 拉头像，需保证该 API 对外提供 `/uploads` 静态资源（当前 Express 已挂载）。

---

## 校验

浏览器访问：`https://你的API域名/health`  
应返回 JSON：`{ "ok": true, ... }`  

再打开 Vercel 站点登录；若仍失败，在浏览器开发者工具 **Network** 里看登录请求是否指向 `VITE_API_URL` 的域名。
