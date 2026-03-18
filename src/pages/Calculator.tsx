import { useState } from 'react';
import {
  ChevronLeft,
  Calculator as CalcIcon,
  Activity,
  Droplets,
  Heart,
  Atom,
  Scale,
  Gauge,
  Droplet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

type CalcType = 'bmi' | 'crcl' | 'egfr' | 'ag' | 'ibw' | 'map' | 'nacorr';

const TABS: { id: CalcType; label: string; short: string; Icon: typeof Activity }[] = [
  { id: 'bmi', label: 'BMI / 体表面积', short: 'BMI', Icon: Activity },
  { id: 'crcl', label: '肌酐清除率', short: 'CrCl', Icon: Droplets },
  { id: 'egfr', label: 'eGFR (MDRD)', short: 'eGFR', Icon: Heart },
  { id: 'ag', label: '阴离子间隙', short: 'AG', Icon: Atom },
  { id: 'ibw', label: '理想体重', short: 'IBW', Icon: Scale },
  { id: 'map', label: '平均动脉压', short: 'MAP', Icon: Gauge },
  { id: 'nacorr', label: '校正血钠', short: '血钠', Icon: Droplet },
];

export default function Calculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CalcType>('bmi');

  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  const [age, setAge] = useState('');
  const [crWeight, setCrWeight] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  const [egfrAge, setEgfrAge] = useState('');
  const [egfrCr, setEgfrCr] = useState('');

  const [na, setNa] = useState('');
  const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState('');

  const [ibwHeight, setIbwHeight] = useState('');

  const [sbp, setSbp] = useState('');
  const [dbp, setDbp] = useState('');

  const [naSerum, setNaSerum] = useState('');
  const [glucoseMmol, setGlucoseMmol] = useState('');

  const h = parseFloat(height);
  const w = parseFloat(weight);
  let bmi = 0;
  let bsa = 0;
  let bmiStatus = '';

  if (h > 0 && w > 0) {
    const hMeter = h / 100;
    bmi = w / (hMeter * hMeter);
    bsa = Math.sqrt((h * w) / 3600);
    if (bmi < 18.5) bmiStatus = '偏瘦';
    else if (bmi < 24) bmiStatus = '正常';
    else if (bmi < 28) bmiStatus = '超重';
    else bmiStatus = '肥胖';
  }

  const a = parseFloat(age);
  const cw = parseFloat(crWeight);
  const cr = parseFloat(creatinine);
  let crcl = 0;
  if (a > 0 && cw > 0 && cr > 0) {
    let base = ((140 - a) * cw) / (0.818 * cr);
    if (gender === 'F') base *= 0.85;
    crcl = base;
  }

  const ea = parseFloat(egfrAge);
  const ecr = parseFloat(egfrCr);
  let egfr = 0;
  if (ea >= 18 && ecr > 0) {
    const scrMg = ecr / 88.4;
    const scr = Math.max(scrMg, 0.1);
    egfr =
      175 * Math.pow(scr, -1.154) * Math.pow(Math.max(ea, 1), -0.203) * (gender === 'F' ? 0.742 : 1);
    egfr = Math.min(egfr, 200);
  }

  const n = parseFloat(na);
  const c = parseFloat(cl);
  const hc = parseFloat(hco3);
  const agValid = na.trim() !== '' && cl.trim() !== '' && hco3.trim() !== '';
  let ag = 0;
  if (agValid && !Number.isNaN(n) && !Number.isNaN(c) && !Number.isNaN(hc)) ag = n - c - hc;

  let ibw = 0;
  const ih = parseFloat(ibwHeight);
  if (ih > 0) {
    const hIn = ih / 2.54;
    const over = Math.max(0, hIn - 60);
    ibw = gender === 'M' ? 50 + 2.3 * over : 45.5 + 2.3 * over;
  }

  const s = parseFloat(sbp);
  const d = parseFloat(dbp);
  let mapVal = 0;
  if (s > 0 && d > 0 && s >= d) mapVal = d + (s - d) / 3;

  const ns = parseFloat(naSerum);
  const glu = parseFloat(glucoseMmol);
  let naCorrected = 0;
  let naCorrShow = false;
  if (ns > 0 && glu > 0) {
    const gluMg = glu * 18;
    if (gluMg > 100) {
      naCorrected = ns + (1.6 * (gluMg - 100)) / 100;
      naCorrShow = true;
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <header className="bg-white sticky top-0 z-40 shadow-sm px-4 pt-safe pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3 mt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CalcIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">医学计算器</h1>
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {TABS.map(({ id, short, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                'shrink-0 py-2 px-3 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 border',
                activeTab === id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {short}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 no-scrollbar pb-8">
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          以下结果仅供学习参考，不能替代诊疗；用药与处置请以临床与检验为准。
        </p>

        {activeTab === 'bmi' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">身高 (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="例如: 175"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="例如: 70"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            {bmi > 0 && (
              <div className="bg-blue-600 p-5 rounded-2xl shadow-lg text-white space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/50 pb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">BMI</p>
                    <span className="text-4xl font-bold">{bmi.toFixed(1)}</span>
                    <span className="text-blue-200 text-sm ml-2">kg/m² · {bmiStatus}</span>
                  </div>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">BSA (Mosteller)</p>
                  <span className="text-3xl font-bold">{bsa.toFixed(2)}</span>
                  <span className="text-blue-200 text-sm ml-2">m²</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'crcl' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setGender('M')}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium rounded-lg',
                        gender === 'M' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('F')}
                      className={cn(
                        'flex-1 py-2 text-sm font-medium rounded-lg',
                        gender === 'F' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
                      )}
                    >
                      女
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">年龄 (岁)</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="65"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">体重 (kg)</label>
                <input
                  type="number"
                  value={crWeight}
                  onChange={(e) => setCrWeight(e.target.value)}
                  placeholder="70"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  血清肌酐 (μmol/L)
                </label>
                <input
                  type="number"
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  placeholder="90"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {crcl > 0 && (
              <div className="bg-teal-600 p-5 rounded-2xl shadow-lg text-white">
                <p className="text-teal-100 text-sm">肌酐清除率 (Cockcroft-Gault)</p>
                <span className="text-4xl font-bold">{crcl.toFixed(1)}</span>
                <span className="text-teal-200 text-sm ml-2">mL/min</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'egfr' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 space-y-4">
              <p className="text-xs text-slate-500">
                MDRD 公式，肌酐 μmol/L，适用于成人；与检验科 eGFR 算法可能略有差异。
              </p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl border">
                    <button
                      type="button"
                      onClick={() => setGender('M')}
                      className={cn(
                        'flex-1 py-2 text-sm rounded-lg',
                        gender === 'M' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                      )}
                    >
                      男
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('F')}
                      className={cn(
                        'flex-1 py-2 text-sm rounded-lg',
                        gender === 'F' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                      )}
                    >
                      女
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">年龄 (≥18)</label>
                  <input
                    type="number"
                    value={egfrAge}
                    onChange={(e) => setEgfrAge(e.target.value)}
                    placeholder="60"
                    className="w-full bg-slate-50 border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  血清肌酐 (μmol/L)
                </label>
                <input
                  type="number"
                  value={egfrCr}
                  onChange={(e) => setEgfrCr(e.target.value)}
                  placeholder="90"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {egfr > 0 && (
              <div className="bg-indigo-600 p-5 rounded-2xl text-white">
                <p className="text-indigo-100 text-sm">eGFR (MDRD, mL/min/1.73m²)</p>
                <span className="text-4xl font-bold">{egfr.toFixed(0)}</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ag' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <p className="text-xs text-slate-500">AG = Na⁺ − Cl⁻ − HCO₃⁻（mmol/L），常见参考约 8–16。</p>
              <div>
                <label className="block text-sm font-medium mb-1">Na⁺ (mmol/L)</label>
                <input
                  type="number"
                  value={na}
                  onChange={(e) => setNa(e.target.value)}
                  placeholder="140"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cl⁻ (mmol/L)</label>
                <input
                  type="number"
                  value={cl}
                  onChange={(e) => setCl(e.target.value)}
                  placeholder="100"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HCO₃⁻ (mmol/L)</label>
                <input
                  type="number"
                  value={hco3}
                  onChange={(e) => setHco3(e.target.value)}
                  placeholder="24"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {agValid && !Number.isNaN(ag) && (
              <div className="bg-violet-600 p-5 rounded-2xl text-white">
                <p className="text-violet-100 text-sm">阴离子间隙</p>
                <span className="text-4xl font-bold">{ag.toFixed(1)}</span>
                <span className="text-violet-200 text-sm ml-2">mmol/L</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ibw' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <p className="text-xs text-slate-500">Devine 公式（用药参考），身高 cm。</p>
              <div>
                <label className="block text-sm font-medium mb-1">性别</label>
                <div className="flex bg-slate-50 p-1 rounded-xl border">
                  <button
                    type="button"
                    onClick={() => setGender('M')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg',
                      gender === 'M' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                    )}
                  >
                    男
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('F')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg',
                      gender === 'F' ? 'bg-white text-blue-600 shadow' : 'text-slate-500'
                    )}
                  >
                    女
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">身高 (cm)</label>
                <input
                  type="number"
                  value={ibwHeight}
                  onChange={(e) => setIbwHeight(e.target.value)}
                  placeholder="170"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {ibw > 0 && (
              <div className="bg-amber-600 p-5 rounded-2xl text-white">
                <p className="text-amber-100 text-sm">理想体重 (IBW)</p>
                <span className="text-4xl font-bold">{ibw.toFixed(1)}</span>
                <span className="text-amber-200 text-sm ml-2">kg</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <p className="text-xs text-slate-500">MAP = 舒张压 + (收缩压 − 舒张压) / 3</p>
              <div>
                <label className="block text-sm font-medium mb-1">收缩压 (mmHg)</label>
                <input
                  type="number"
                  value={sbp}
                  onChange={(e) => setSbp(e.target.value)}
                  placeholder="120"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">舒张压 (mmHg)</label>
                <input
                  type="number"
                  value={dbp}
                  onChange={(e) => setDbp(e.target.value)}
                  placeholder="80"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {mapVal > 0 && (
              <div className="bg-rose-600 p-5 rounded-2xl text-white">
                <p className="text-rose-100 text-sm">平均动脉压 (MAP)</p>
                <span className="text-4xl font-bold">{mapVal.toFixed(0)}</span>
                <span className="text-rose-200 text-sm ml-2">mmHg</span>
              </div>
            )}
          </div>
        )}

        {activeTab === 'nacorr' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <p className="text-xs text-slate-500">
                高渗时校正血钠（Katz）：校正 Na = 实测 Na + 1.6×(血糖mg/dL−100)/100；此处血糖请填
                mmol/L。
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">实测血钠 (mmol/L)</label>
                <input
                  type="number"
                  value={naSerum}
                  onChange={(e) => setNaSerum(e.target.value)}
                  placeholder="135"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">血糖 (mmol/L)</label>
                <input
                  type="number"
                  value={glucoseMmol}
                  onChange={(e) => setGlucoseMmol(e.target.value)}
                  placeholder="20"
                  className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {naCorrShow && (
              <div className="bg-cyan-700 p-5 rounded-2xl text-white">
                <p className="text-cyan-100 text-sm">校正后血钠（高渗校正，估算）</p>
                <span className="text-4xl font-bold">{naCorrected.toFixed(1)}</span>
                <span className="text-cyan-200 text-sm ml-2">mmol/L</span>
              </div>
            )}
            {ns > 0 && glu > 0 && glu * 18 <= 100 && (
              <p className="text-sm text-slate-500">血糖未明显高于 5.6 mmol/L 时，一般不做此项校正。</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
