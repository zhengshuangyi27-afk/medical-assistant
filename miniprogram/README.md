# 医疗助手 · 微信小程序

## 真机调试 / 预览

**必须用微信开发者工具打开「本目录」**（即 `miniprogram` 文件夹），不要打开上一级 `medical-assistant`。

- 微信开发者工具 → 导入项目 → 选择目录：**`medical-assistant/miniprogram`**
- 这样根目录下就有 `app.json`，不会再提示「缺少 app.json」。

## 配置

- 在 `app.js` 中修改 `API_BASE` 为你的后端地址（真机/体验版须为 HTTPS）。
- 后端需已启动（如 `npm run server`），并保证手机与电脑在同一网络或后端已部署到公网。
