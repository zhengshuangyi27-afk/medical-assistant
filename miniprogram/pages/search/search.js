const api = require('../../utils/api.js');

Page({
  data: {
    query: '',
    loading: false,
    result: '',
    blockedMsg: '',
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
    this.setData({ loading: true, blockedMsg: '', result: '' });
    try {
      const selectedLlm = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
      const data = await api.post('/api/llm/query', { query, modelId: selectedLlm || undefined });
      if (data.blocked) {
        this.setData({
          loading: false,
          blockedMsg: data.message || '本模块仅限药品与用药相关查询。',
          result: '',
        });
        return;
      }
      this.setData({ result: data.result || '', loading: false });
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: e.message || '搜索失败', icon: 'none' });
    }
  },

});
