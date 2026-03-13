const api = require('../../utils/api.js');

Page({
  data: {
    inputValue: '',
    loading: false,
    messages: [],
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async onSend(ev) {
    const text = (ev && ev.currentTarget && ev.currentTarget.dataset.text) || (this.data.inputValue || '').trim();
    if (!text || this.data.loading) return;

    const userMsg = { id: Date.now(), role: 'user', content: text };
    this.setData({
      messages: this.data.messages.concat([userMsg]),
      inputValue: '',
      loading: true,
    });

    try {
      const selectedLlm = getApp().globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
      const history = this.data.messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const data = await api.post('/api/llm/chat', {
        prompt: text,
        modelId: selectedLlm || undefined,
        history,
      });
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: data.reply || '' };
      this.setData({
        messages: this.data.messages.concat([aiMsg]),
        loading: false,
      });
    } catch (e) {
      const aiMsg = { id: Date.now() + 1, role: 'ai', content: '请求失败：' + (e.message || '请重试') };
      this.setData({
        messages: this.data.messages.concat([aiMsg]),
        loading: false,
      });
    }
  },

  onSuggestionTap(e) {
    const text = e.currentTarget.dataset.text;
    if (text) this.onSend({ currentTarget: { dataset: { text } } });
  },
});
