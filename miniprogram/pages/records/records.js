const api = require('../../utils/api.js');

const TEST_PATIENTS = [
  { id: '1', name: '张浩', initial: '张', gender: '男', age: 45, patientId: '10023948', room: '402-B' },
  { id: '2', name: '李梅', initial: '李', gender: '女', age: 62, patientId: '10023951', room: '403-A' },
  { id: '3', name: '王建国', initial: '王', gender: '男', age: 58, patientId: '10023955', room: '401-C' },
  { id: '4', name: '刘芳', initial: '刘', gender: '女', age: 38, patientId: '10023960', room: '405-B' },
  { id: '5', name: '陈明', initial: '陈', gender: '男', age: 71, patientId: '10023962', room: '404-A' },
];

Page({
  data: {
    inputText: '',
    isRecording: false,
    isGenerating: false,
    record: null,
    toast: '',
    patients: TEST_PATIENTS,
    selectedPatientIndex: 0,
    selectedPatient: TEST_PATIENTS[0],
    patientModalOpen: false,
  },

  onLoad() {},

  openPatientModal() {
    this.setData({ patientModalOpen: true });
  },

  closePatientModal() {
    this.setData({ patientModalOpen: false });
  },

  onSelectPatient(e) {
    const index = e.currentTarget.dataset.index;
    const p = TEST_PATIENTS[index];
    this.setData({ selectedPatientIndex: index, selectedPatient: p, patientModalOpen: false });
    wx.showToast({ title: '已切换至 ' + p.name, icon: 'none' });
  },

  // 微信自带录音：RecorderManager 录音，结束后上传后端转写
  onVoiceTap() {
    const isRecording = this.data.isRecording;
    if (isRecording) {
      this.stopRecord();
    } else {
      this.startRecord();
    }
  },

  startRecord() {
    const recorder = wx.getRecorderManager();
    recorder.onStart(() => {
      this.setData({ isRecording: true, toast: '正在录音...' });
    });
    recorder.onStop((res) => {
      this.setData({ isRecording: false, toast: '' });
      const path = res.tempFilePath;
      if (!path) {
        wx.showToast({ title: '录音失败', icon: 'none' });
        return;
      }
      wx.showLoading({ title: '转写中...' });
      api.uploadVoice(path).then((text) => {
        wx.hideLoading();
        if (text) {
          const prev = this.data.inputText;
          this.setData({ inputText: prev ? prev + '\n' + text : text });
          wx.showToast({ title: '识别完成', icon: 'success' });
        } else {
          wx.showToast({ title: '未识别到文字', icon: 'none' });
        }
      }).catch(() => {
        wx.hideLoading();
        wx.showToast({ title: '转写失败，请重试', icon: 'none' });
      });
    });
    recorder.onError((err) => {
      this.setData({ isRecording: false, toast: '' });
      wx.showToast({ title: err.errMsg || '录音错误', icon: 'none' });
    });
    recorder.start({ format: 'mp3', duration: 60000 });
    this.recorder = recorder;
  },

  stopRecord() {
    if (this.recorder) this.recorder.stop();
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value });
  },

  async onGenerate() {
    const { inputText } = this.data;
    if (!inputText.trim()) {
      wx.showToast({ title: '请输入病情描述', icon: 'none' });
      return;
    }
    this.setData({ isGenerating: true });
    try {
      const llmUtil = require('../../utils/llm.js');
      const selectedLlm = llmUtil.getModelIdForModule('records');
      const record = await api.post('/api/records/generate', {
        text: inputText.trim(),
        modelId: selectedLlm || undefined,
      });
      this.setData({ record, isGenerating: false });
      wx.showToast({ title: '生成成功', icon: 'success' });
    } catch (e) {
      this.setData({ isGenerating: false });
      wx.showToast({ title: e.message || '生成失败', icon: 'none' });
    }
  },

  async onSave() {
    const { record } = this.data;
    if (!record) return;
    try {
      await api.post('/api/records/save', {
        chiefComplaint: record.chiefComplaint,
        assessment: record.assessment,
        plan: record.plan,
        rawInput: this.data.inputText,
      });
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (e) {
      wx.showToast({ title: e.message || '保存失败', icon: 'none' });
    }
  },

  onSyncHis() {
    wx.showToast({ title: 'HIS 接口未配置', icon: 'none' });
  },
});
