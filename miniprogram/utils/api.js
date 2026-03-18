const app = getApp();

function apiBase() {
  return app.globalData.apiBase || 'http://localhost:3001';
}

function request(options) {
  const base = apiBase();
  const url = options.url.startsWith('http') ? options.url : base + (options.url.startsWith('/') ? options.url : '/' + options.url);
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      url,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || '请求失败'));
        }
      },
      fail: reject,
    });
  });
}

function post(path, data) {
  return request({
    method: 'POST',
    url: path,
    data,
    header: { 'Content-Type': 'application/json' },
  });
}

function get(path, data) {
  let url = path;
  if (data && Object.keys(data).length) {
    const q = Object.entries(data).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&');
    url += (path.indexOf('?') >= 0 ? '&' : '?') + q;
  }
  return request({ method: 'GET', url });
}

// 上传录音文件到后端转写（微信自带录音 + 后端 Whisper/转写）
function uploadVoice(filePath) {
  const base = apiBase();
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: base + '/api/voice/transcribe',
      filePath,
      name: 'audio',
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          resolve(data.text || '');
        } catch (e) {
          reject(e);
        }
      },
      fail: reject,
    });
  });
}

// 报告助手：上传报告图片，后端解析并返回固定格式
function uploadReportImage(filePath) {
  const base = apiBase();
  const modelId = app.globalData.selectedLlm || wx.getStorageSync('selected_llm') || '';
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: base + '/api/report/parse',
      filePath,
      name: 'image',
      formData: modelId ? { modelId } : {},
      success: (res) => {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || '解析失败'));
          }
        } catch (e) {
          reject(new Error(res.data && res.data.substring(0, 100) || '解析失败'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || '上传失败')),
    });
  });
}

module.exports = { request, post, get, uploadVoice, uploadReportImage, apiBase };
