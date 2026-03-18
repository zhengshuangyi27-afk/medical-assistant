const api = require('../../utils/api.js');
const llmUtil = require('../../utils/llm.js');

const MODULES = [
  { key: 'drug', label: '用药查询' },
  { key: 'records', label: '病例生成' },
  { key: 'report', label: '报告助手' },
];

Page({
  data: {
    models: [],
    selectedModel: '',
    globalName: '',
    moduleRows: [],
    showModal: false,
    pickTarget: 'global',
    modalTitle: '',
  },

  onLoad() {
    this.loadAll();
  },

  onShow() {
    this.refreshModuleRows();
  },

  buildModuleRows(models, globalId) {
    const name = (id) => (models || []).find((m) => m.id === id)?.name || id || '—';
    const map = llmUtil.parseModules();
    return MODULES.map(({ key, label }) => {
      const ov = map[key];
      return {
        key,
        label,
        display: ov && String(ov).trim() ? name(ov) : `跟随全局（${name(globalId)}）`,
      };
    });
  },

  refreshModuleRows() {
    const globalId = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
    this.setData({
      moduleRows: this.buildModuleRows(this.data.models, globalId),
      globalName: (this.data.models.find((m) => m.id === globalId) || {}).name || globalId || '未选择',
    });
  },

  async loadAll() {
    let settings = {};
    try {
      settings = await api.get('/api/config/user/settings');
    } catch (e) {
      /* local only */
    }
    if (settings.selected_llm) {
      getApp().globalData.selectedLlm = settings.selected_llm;
      wx.setStorageSync('selected_llm', settings.selected_llm);
    }
    if (settings.llm_by_module != null) {
      llmUtil.mergeLlmFromServer(settings.llm_by_module);
    }

    try {
      const data = await api.get('/api/config/llm');
      const models = data.models || [];
      const globalId =
        getApp().globalData.selectedLlm ||
        wx.getStorageSync('selected_llm') ||
        (models.find((m) => m.is_default) || models[0])?.id ||
        '';
      if (!wx.getStorageSync('selected_llm') && globalId) {
        wx.setStorageSync('selected_llm', globalId);
        getApp().globalData.selectedLlm = globalId;
      }
      const globalName = (models.find((m) => m.id === globalId) || {}).name || globalId;
      this.setData({
        models,
        selectedModel: globalId,
        globalName,
        moduleRows: this.buildModuleRows(models, globalId),
      });
    } catch (e) {
      const fallback = [
        { id: 'qwen3.5-plus', name: '通义千问 3.5 Plus', description: '推荐', is_default: true },
        { id: 'qwen-turbo', name: '通义千问 Turbo', description: '快速', is_default: false },
      ];
      const gid = wx.getStorageSync('selected_llm') || 'qwen3.5-plus';
      this.setData({
        models: fallback,
        selectedModel: gid,
        globalName: (fallback.find((m) => m.id === gid) || {}).name || gid,
        moduleRows: this.buildModuleRows(fallback, gid),
      });
    }
  },

  persist() {
    const selected_llm = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
    api
      .post('/api/config/user/settings', {
        selected_llm,
        llm_by_module: llmUtil.serializeForApi(),
      })
      .catch(() => {});
  },

  onSelectGlobal() {
    this.setData({
      showModal: true,
      pickTarget: 'global',
      modalTitle: '全局默认模型',
    });
  },

  onSelectModule(e) {
    const key = e.currentTarget.dataset.key;
    const label = MODULES.find((m) => m.key === key)?.label || key;
    this.setData({
      showModal: true,
      pickTarget: key,
      modalTitle: label + ' · 模型',
    });
  },

  onFollowGlobal() {
    const key = this.data.pickTarget;
    if (key === 'global') return;
    const map = llmUtil.parseModules();
    delete map[key];
    llmUtil.setLlmByModule(map);
    this.persist();
    this.refreshModuleRows();
    this.setData({ showModal: false });
    wx.showToast({ title: '已跟随全局', icon: 'success' });
  },

  onChooseModel(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.pickTarget === 'global') {
      getApp().globalData.selectedLlm = id;
      wx.setStorageSync('selected_llm', id);
    } else {
      const key = this.data.pickTarget;
      const map = llmUtil.parseModules();
      map[key] = id;
      llmUtil.setLlmByModule(map);
    }
    this.persist();
    const globalId = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
    const globalName = (this.data.models.find((m) => m.id === globalId) || {}).name || globalId;
    this.setData({
      showModal: false,
      selectedModel: globalId,
      globalName,
      moduleRows: this.buildModuleRows(this.data.models, globalId),
    });
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  closeModal() {
    this.setData({ showModal: false });
  },
});
