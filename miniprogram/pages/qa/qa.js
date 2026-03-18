const api = require('../../utils/api.js');

Page({
  data: {
    previewPath: '',
    loading: false,
    error: '',
    parsed: {},
    rawResult: '',
    hasAdviceBlock: false,
  },

  onChooseCamera() {
    this.chooseImage('camera');
  },

  onChooseAlbum() {
    this.chooseImage('album');
  },

  chooseImage(sourceType) {
    if (this.data.loading) return;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: [sourceType],
      success: (res) => {
        const path = res.tempFilePaths[0];
        this.setData({
          previewPath: path,
          error: '',
          parsed: {},
          rawResult: '',
          hasAdviceBlock: false,
        });
        this.uploadAndParse(path);
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择失败', icon: 'none' });
        }
      },
    });
  },

  uploadAndParse(filePath) {
    this.setData({ loading: true });
    api.uploadReportImage(filePath)
      .then((data) => {
        const p = data.parsed || {};
        const hasAdvice =
          (p.suggestions && p.suggestions.length > 0) ||
          !!p.visitRecommendation ||
          (p.recommendedDepartments && p.recommendedDepartments.length > 0) ||
          (p.lifestyleAndDietAdvice && p.lifestyleAndDietAdvice.length > 0);
        this.setData({
          loading: false,
          parsed: p,
          rawResult: data.result || '',
          hasAdviceBlock: !!hasAdvice,
        });
      })
      .catch((e) => {
        this.setData({
          loading: false,
          error: e.message || '解析失败，请重试',
        });
      });
  },
});
