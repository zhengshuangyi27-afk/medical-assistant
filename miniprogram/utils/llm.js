const MODULE_KEYS = ['drug', 'records', 'report'];

function parseModules() {
  try {
    const s = wx.getStorageSync('llm_by_module');
    if (!s) return {};
    const o = typeof s === 'string' ? JSON.parse(s) : s;
    return o && typeof o === 'object' ? o : {};
  } catch {
    return {};
  }
}

function getGlobalModelId() {
  const app = getApp();
  return (app.globalData.selectedLlm || wx.getStorageSync('selected_llm') || '').trim();
}

function getModelIdForModule(module) {
  const m = parseModules();
  const v = m[module];
  if (v && String(v).trim()) return String(v).trim();
  const g = getGlobalModelId();
  return g || '';
}

function setLlmByModule(map) {
  const next = {};
  MODULE_KEYS.forEach((k) => {
    if (map[k] && String(map[k]).trim()) next[k] = String(map[k]).trim();
  });
  wx.setStorageSync('llm_by_module', JSON.stringify(next));
  getApp().globalData.llmByModule = next;
}

function mergeLlmFromServer(serverMap) {
  if (!serverMap || typeof serverMap !== 'object') {
    setLlmByModule({});
    return;
  }
  const next = {};
  MODULE_KEYS.forEach((k) => {
    if (serverMap[k] && String(serverMap[k]).trim()) next[k] = String(serverMap[k]).trim();
  });
  setLlmByModule(next);
}

function serializeForApi() {
  return parseModules();
}

module.exports = {
  MODULE_KEYS,
  getModelIdForModule,
  getGlobalModelId,
  setLlmByModule,
  mergeLlmFromServer,
  serializeForApi,
  parseModules,
};
