// 配置后端 API 根地址，正式环境请改为你的服务器域名
const API_BASE = 'http://localhost:3001';

function loadLlmMap() {
  try {
    return JSON.parse(wx.getStorageSync('llm_by_module') || '{}') || {};
  } catch {
    return {};
  }
}

App({
  globalData: {
    apiBase: API_BASE,
    selectedLlm: wx.getStorageSync('selected_llm') || '',
    llmByModule: loadLlmMap(),
  },
  onLaunch() {
    // 可在此请求 /api/config/llm 拉取模型列表并缓存
  },
});
