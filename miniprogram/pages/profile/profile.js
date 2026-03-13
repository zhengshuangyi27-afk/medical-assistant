const api = require('../../utils/api.js');

Page({
  data: {
    models: [],
    selectedModel: '',
    selectedName: '',
    showModal: false,
  },

  onLoad() {
    const selected = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
    this.setData({ selectedModel: selected });
    this.loadModels();
  },

  async loadModels() {
    try {
      const data = await api.get('/api/config/llm');
      const models = data.models || [];
      const selected = this.data.selectedModel || (models.find((m) => m.is_default) || models[0])?.id || '';
      const selectedName = (models.find((m) => m.id === selected) || {}).name || selected;
      getApp().globalData.selectedLlm = selected;
      wx.setStorageSync('selected_llm', selected);
      this.setData({ models, selectedModel: selected, selectedName });
    } catch (e) {
      this.setData({
        models: [
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速响应', is_default: true },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '强推理', is_default: false },
        ],
        selectedName: this.data.selectedModel || 'Gemini 2.0 Flash',
      });
    }
  },

  onSelectModel() {
    this.setData({ showModal: true });
  },

  onChooseModel(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    getApp().globalData.selectedLlm = id;
    wx.setStorageSync('selected_llm', id);
    api.post('/api/config/user/settings', { selected_llm: id }).catch(() => {});
    this.setData({ selectedModel: id, selectedName: name, showModal: false });
  },

  closeModal() {
    this.setData({ showModal: false });
  },
});
