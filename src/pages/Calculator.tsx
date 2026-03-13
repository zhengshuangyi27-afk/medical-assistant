import { useState } from 'react';
import { ChevronLeft, Calculator as CalcIcon, Activity, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

type CalcType = 'bmi' | 'crcl';

export default function Calculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CalcType>('bmi');

  // BMI/BSA State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

  // CrCl State
  const [age, setAge] = useState('');
  const [crWeight, setCrWeight] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // Calculate BMI & BSA
  const h = parseFloat(height);
  const w = parseFloat(weight);
  let bmi = 0;
  let bsa = 0;
  let bmiStatus = '';
  let bmiColor = '';

  if (h > 0 && w > 0) {
    const hMeter = h / 100;
    bmi = w / (hMeter * hMeter);
    bsa = Math.sqrt((h * w) / 3600); // Mosteller formula

    if (bmi < 18.5) {
      bmiStatus = '偏瘦';
      bmiColor = 'text-blue-500';
    } else if (bmi >= 18.5 && bmi < 24) {
      bmiStatus = '正常';
      bmiColor = 'text-green-500';
    } else if (bmi >= 24 && bmi < 28) {
      bmiStatus = '超重';
      bmiColor = 'text-orange-500';
    } else {
      bmiStatus = '肥胖';
      bmiColor = 'text-red-500';
    }
  }

  // Calculate CrCl (Cockcroft-Gault)
  // Formula: ((140 - age) * weight) / (0.818 * Cr_umol/L)  * (0.85 if female)
  const a = parseFloat(age);
  const cw = parseFloat(crWeight);
  const cr = parseFloat(creatinine);
  let crcl = 0;

  if (a > 0 && cw > 0 && cr > 0) {
    let base = ((140 - a) * cw) / (0.818 * cr);
    if (gender === 'F') {
      base = base * 0.85;
    }
    crcl = base;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <header className="bg-white sticky top-0 z-40 shadow-sm px-4 pt-safe pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3 mt-2">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <CalcIcon className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">医学计算器</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-4 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('bmi')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'bmi' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Activity className="w-4 h-4" />
            BMI / 体表面积
          </button>
          <button 
            onClick={() => setActiveTab('crcl')}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === 'crcl' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Droplets className="w-4 h-4" />
            肌酐清除率
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 no-scrollbar">
        {activeTab === 'bmi' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">身高 (cm)</label>
                <input 
                  type="number" 
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="例如: 175"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">体重 (kg)</label>
                <input 
                  type="number" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="例如: 70"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {bmi > 0 && (
              <div className="bg-blue-600 p-5 rounded-2xl shadow-lg shadow-blue-200 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-blue-500/50 pb-4">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">BMI (体质指数)</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{bmi.toFixed(1)}</span>
                      <span className="text-blue-200 text-sm">kg/m²</span>
                    </div>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <span className={cn("font-bold", bmiColor.replace('text-', 'text-'))} style={{ color: bmiStatus === '正常' ? '#4ade80' : bmiStatus === '偏瘦' ? '#93c5fd' : bmiStatus === '超重' ? '#fb923c' : '#f87171' }}>
                      {bmiStatus}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">BSA (体表面积 - Mosteller)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{bsa.toFixed(2)}</span>
                    <span className="text-blue-200 text-sm">m²</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'crcl' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setGender('M')}
                      className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", gender === 'M' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
                    >
                      男
                    </button>
                    <button 
                      onClick={() => setGender('F')}
                      className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", gender === 'F' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500")}
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
                    placeholder="例如: 65"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">体重 (kg)</label>
                <input 
                  type="number" 
                  value={crWeight}
                  onChange={(e) => setCrWeight(e.target.value)}
                  placeholder="例如: 70"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">血清肌酐 (μmol/L)</label>
                <input 
                  type="number" 
                  value={creatinine}
                  onChange={(e) => setCreatinine(e.target.value)}
                  placeholder="例如: 90"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            {crcl > 0 && (
              <div className="bg-teal-600 p-5 rounded-2xl shadow-lg shadow-teal-200 text-white space-y-2">
                <p className="text-teal-100 text-sm font-medium">肌酐清除率 (Cockcroft-Gault)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{crcl.toFixed(1)}</span>
                  <span className="text-teal-200 text-sm">mL/min</span>
                </div>
                <p className="text-teal-100 text-xs mt-2 opacity-80">
                  提示: 正常值通常为 90-120 mL/min。此结果仅供临床参考。
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
