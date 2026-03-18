Page({
  data: {
    tab: 'bmi',
    height: '',
    weight: '',
    age: '',
    crWeight: '',
    creatinine: '',
    gender: 'M',
    egfrAge: '',
    egfrCr: '',
    na: '',
    cl: '',
    hco3: '',
    ibwHeight: '',
    sbp: '',
    dbp: '',
    naSerum: '',
    glucoseMmol: '',
    bmi: 0,
    bsa: 0,
    bmiStatus: '',
    crcl: 0,
    egfr: 0,
    ag: 0,
    agShow: false,
    ibw: 0,
    mapVal: 0,
    naCorrected: 0,
    naCorrShow: false,
    naCorrHint: false,
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
  onEgfrAge(e) { this.setData({ egfrAge: e.detail.value }); this.calc(); },
  onEgfrCr(e) { this.setData({ egfrCr: e.detail.value }); this.calc(); },
  onNa(e) { this.setData({ na: e.detail.value }); this.calc(); },
  onCl(e) { this.setData({ cl: e.detail.value }); this.calc(); },
  onHco3(e) { this.setData({ hco3: e.detail.value }); this.calc(); },
  onIbwHeight(e) { this.setData({ ibwHeight: e.detail.value }); this.calc(); },
  onSbp(e) { this.setData({ sbp: e.detail.value }); this.calc(); },
  onDbp(e) { this.setData({ dbp: e.detail.value }); this.calc(); },
  onNaSerum(e) { this.setData({ naSerum: e.detail.value }); this.calc(); },
  onGlucose(e) { this.setData({ glucoseMmol: e.detail.value }); this.calc(); },

  calc() {
    const d = this.data;
    let bmi = 0, bsa = 0, bmiStatus = '', crcl = 0, egfr = 0, ag = 0, agShow = false;
    let ibw = 0, mapVal = 0, naCorrected = 0, naCorrShow = false, naCorrHint = false;

    const h = parseFloat(d.height), w = parseFloat(d.weight);
    if (h > 0 && w > 0) {
      const hM = h / 100;
      bmi = w / (hM * hM);
      bsa = Math.sqrt((h * w) / 3600);
      if (bmi < 18.5) bmiStatus = '偏瘦';
      else if (bmi < 24) bmiStatus = '正常';
      else if (bmi < 28) bmiStatus = '超重';
      else bmiStatus = '肥胖';
    }

    const a = parseFloat(d.age), cw = parseFloat(d.crWeight), cr = parseFloat(d.creatinine);
    if (a > 0 && cw > 0 && cr > 0) {
      let base = ((140 - a) * cw) / (0.818 * cr);
      if (d.gender === 'F') base *= 0.85;
      crcl = base;
    }

    const ea = parseFloat(d.egfrAge), ecr = parseFloat(d.egfrCr);
    if (ea >= 18 && ecr > 0) {
      const scr = Math.max(ecr / 88.4, 0.1);
      egfr = 175 * Math.pow(scr, -1.154) * Math.pow(Math.max(ea, 1), -0.203) * (d.gender === 'F' ? 0.742 : 1);
      egfr = Math.min(egfr, 200);
    }

    const n = parseFloat(d.na), c = parseFloat(d.cl), hc = parseFloat(d.hco3);
    agShow = (d.na || '').trim() !== '' && (d.cl || '').trim() !== '' && (d.hco3 || '').trim() !== '';
    if (agShow && !isNaN(n) && !isNaN(c) && !isNaN(hc)) ag = n - c - hc;

    const ih = parseFloat(d.ibwHeight);
    if (ih > 0) {
      const hIn = ih / 2.54;
      const over = Math.max(0, hIn - 60);
      ibw = d.gender === 'M' ? 50 + 2.3 * over : 45.5 + 2.3 * over;
    }

    const s = parseFloat(d.sbp), di = parseFloat(d.dbp);
    if (s > 0 && di > 0 && s >= di) mapVal = di + (s - di) / 3;

    const ns = parseFloat(d.naSerum), glu = parseFloat(d.glucoseMmol);
    if (ns > 0 && glu > 0) {
      const gluMg = glu * 18;
      if (gluMg > 100) {
        naCorrected = ns + (1.6 * (gluMg - 100)) / 100;
        naCorrShow = true;
      } else naCorrHint = true;
    }

    this.setData({
      bmi,
      bsa,
      bmiStatus,
      crcl,
      crclStr: crcl > 0 ? crcl.toFixed(1) : '',
      egfr,
      egfrStr: egfr > 0 ? Math.round(egfr) + '' : '',
      ag,
      agStr: agShow ? ag.toFixed(1) : '',
      agShow,
      ibw,
      ibwStr: ibw > 0 ? ibw.toFixed(1) : '',
      mapVal,
      mapStr: mapVal > 0 ? Math.round(mapVal) + '' : '',
      naCorrected,
      naCorrStr: naCorrShow ? naCorrected.toFixed(1) : '',
      naCorrShow,
      naCorrHint,
      bmiStr: bmi > 0 ? bmi.toFixed(1) : '',
      bsaStr: bsa > 0 ? bsa.toFixed(2) : '',
    });
  },
});
