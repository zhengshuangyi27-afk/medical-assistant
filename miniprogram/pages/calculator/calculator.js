Page({
  data: {
    tab: 'bmi',
    height: '',
    weight: '',
    age: '',
    crWeight: '',
    creatinine: '',
    gender: 'M',
    bmi: 0,
    bsa: 0,
    bmiStatus: '',
    crcl: 0,
  },

  switchTab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab });
  },

  onHeight(e) { this.setData({ height: e.detail.value }); this.calc(); },
  onWeight(e) { this.setData({ weight: e.detail.value }); this.calc(); },
  onAge(e) { this.setData({ age: e.detail.value }); this.calc(); },
  onCrWeight(e) { this.setData({ crWeight: e.detail.value }); this.calc(); },
  onCreatinine(e) { this.setData({ creatinine: e.detail.value }); this.calc(); },
  onGender(e) { this.setData({ gender: e.currentTarget.dataset.g }); this.calc(); },

  calc() {
    const { height, weight, age, crWeight, creatinine, gender } = this.data;
    let bmi = 0, bsa = 0, bmiStatus = '', crcl = 0;
    const h = parseFloat(height), w = parseFloat(weight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      bmi = w / (hM * hM);
      bsa = Math.sqrt((h * w) / 3600);
      if (bmi < 18.5) bmiStatus = '偏瘦';
      else if (bmi < 24) bmiStatus = '正常';
      else if (bmi < 28) bmiStatus = '超重';
      else bmiStatus = '肥胖';
    }
    const a = parseFloat(age), cw = parseFloat(crWeight), cr = parseFloat(creatinine);
    if (a > 0 && cw > 0 && cr > 0) {
      let base = ((140 - a) * cw) / (0.818 * cr);
      if (gender === 'F') base *= 0.85;
      crcl = base;
    }
    this.setData({ bmi, bsa, bmiStatus, crcl });
  },
});
