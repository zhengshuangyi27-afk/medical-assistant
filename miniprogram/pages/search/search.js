const api = require('../../utils/api.js');

Page({
  data: {
    query: '',
    loading: false,
    result: '',
  },

  onInput(e) {
    this.setData({ query: e.detail.value });
  },

  async onSearch() {
    const query = (this.data.query || '').trim();
    if (!query) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const selectedLlm = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
      const data = await api.post('/api/llm/query', { query, modelId: selectedLlm || undefined });
      this.setData({ result: data.result || '', loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '搜索失败', icon: 'none' });
    }
  },

  goCalculator() {
    wx.navigateTo({ url: '/pages/calculator/calculator' });
  },
});
