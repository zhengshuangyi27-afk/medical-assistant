import { ChevronLeft, ChevronRight, Mic, Sparkles, Loader2, CheckCircle2, Save, RefreshCw, FileText, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { getLocalDrafts } from '@/src/lib/local-drafts';

interface MedicalRecord {
  chiefComplaint: string;
  assessment: string;
  plan: string;
}

interface Patient {
  id: string;
  name: string;
  initial: string;
  gender: string;
  age: number;
  patientId: string;
  room: string;
}

const TEST_PATIENTS: Patient[] = [
  { id: '1', name: '张浩', initial: '张', gender: '男', age: 45, patientId: '10023948', room: '402-B' },
  { id: '2', name: '李梅', initial: '李', gender: '女', age: 62, patientId: '10023951', room: '403-A' },
  { id: '3', name: '王建国', initial: '王', gender: '男', age: 58, patientId: '10023955', room: '401-C' },
  { id: '4', name: '刘芳', initial: '刘', gender: '女', age: 38, patientId: '10023960', room: '405-B' },
  { id: '5', name: '陈明', initial: '陈', gender: '男', age: 71, patientId: '10023962', room: '404-A' },
];

function randomVitals() {
  const temp = (36 + Math.random() * 2).toFixed(1);
  const systolic = 90 + Math.floor(Math.random() * 45);
  const diastolic = 60 + Math.floor(Math.random() * 25);
  const pulse = 58 + Math.floor(Math.random() * 48);
  const spo2 = 95 + Math.floor(Math.random() * 6);
  return {
    temp: `${temp}°C`,
    bp: `${systolic}/${diastolic}`,
    pulse: `${pulse} 次/分`,
    spo2: `${spo2}%`,
  };
}

export default function Records() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [vitals, setVitals] = useState(() => randomVitals());
  const [selectedPatientIndex, setSelectedPatientIndex] = useState(0);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  const selectedPatient = TEST_PATIENTS[selectedPatientIndex] ?? TEST_PATIENTS[0];

  useEffect(() => {
    setDraftCount(getLocalDrafts().length);
  }, []);

  const refreshDraftCount = () => setDraftCount(getLocalDrafts().length);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 2000);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate speech-to-text result
      setInputText(prev => prev + (prev ? '\n' : '') + '患者自述反复胸痛3天，体力活动后加重，伴有轻微气促。');
      showToast('语音识别完成');
    } else {
      setIsRecording(true);
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      showToast('请输入病情描述');
      return;
    }
    setIsGenerating(true);
    try {
      const { apiPost } = await import('@/src/lib/api');
      const { getSelectedModelId } = await import('@/src/lib/llm');
      const data = await apiPost<MedicalRecord>('/api/records/generate', {
        text: inputText.trim(),
        modelId: getSelectedModelId(),
      });
      setRecord(data);
      setIsEditing(false);
      showToast('病历生成成功');
    } catch (e) {
      console.error(e);
      showToast('生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-gray-800 text-white px-5 py-3 rounded-full text-sm flex items-center justify-center gap-2 shadow-lg animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <span className="text-center">{toastMsg}</span>
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe">
        <div className="px-4 h-16 flex items-center justify-between relative">
          <button onClick={() => navigate(-1)} aria-label="返回" className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-xl tracking-tight text-blue-900">Ai 病例生成</h1>
          <Link to="/drafts" className="text-blue-600 font-medium text-sm shrink-0 active:opacity-70">
            草稿箱 ({draftCount})
          </Link>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-10 no-scrollbar">
        {/* PatientSelectionSection */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-700">患者信息</h2>
            <button
              onClick={() => setPatientModalOpen(true)}
              className="text-blue-600 text-sm font-medium flex items-center gap-1 active:opacity-70"
            >
              <span>选择患者</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
              {selectedPatient.initial}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{selectedPatient.name}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedPatient.gender}, {selectedPatient.age}岁</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">ID: {selectedPatient.patientId} | 病房: {selectedPatient.room}</p>
            </div>
          </div>
        </section>

        {/* 选择患者弹窗 */}
        {patientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPatientModalOpen(false)}>
            <div className="bg-white w-full max-w-md rounded-t-2xl shadow-xl max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-lg">选择患者</h3>
                <button onClick={() => setPatientModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[60vh] p-2">
                {TEST_PATIENTS.map((p, index) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientIndex(index);
                      setPatientModalOpen(false);
                      showToast(`已切换至 ${p.name}`);
                    }}
                    className={cn(
                      'w-full flex items-center gap-4 p-3 rounded-xl text-left transition-colors',
                      index === selectedPatientIndex ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 border border-transparent hover:bg-slate-100'
                    )}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                      {p.initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">{p.name}</div>
                      <p className="text-xs text-slate-500">{p.gender}, {p.age}岁 · ID: {p.patientId} · {p.room}</p>
                    </div>
                    {index === selectedPatientIndex && (
                      <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VitalSignsWidget */}
        <section className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700 text-sm">提取体征数据</h2>
            <button
              onClick={() => {
                setVitals(randomVitals());
                showToast('已刷新体征数据');
              }}
              className="text-xs text-blue-600 flex items-center gap-1 active:opacity-70"
            >
              <RefreshCw className="w-3 h-3" /> 同步
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold">体温</span>
              <span className="text-sm font-bold text-blue-700 mt-1">{vitals.temp}</span>
            </div>
            <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold">血压</span>
              <span className="text-sm font-bold text-blue-700 mt-1">{vitals.bp}</span>
            </div>
            <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold">脉搏</span>
              <span className="text-sm font-bold text-blue-700 mt-1">{vitals.pulse}</span>
            </div>
            <div className="flex flex-col items-center bg-blue-50/50 p-2 rounded-lg border border-blue-100">
              <span className="text-[10px] text-slate-500 uppercase font-bold">血氧</span>
              <span className="text-sm font-bold text-blue-700 mt-1">{vitals.spo2}</span>
            </div>
          </div>
        </section>

        {/* InputArea */}
        <section className="space-y-3">
          <div className="relative">
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full min-h-[160px] p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-700 text-sm shadow-inner bg-white resize-none pb-16" 
              placeholder="请描述患者情况，或点击麦克风开始语音输入..."
            ></textarea>
            <button 
              onClick={handleVoiceToggle}
              className={cn(
                "absolute bottom-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transition-all active:scale-95",
                isRecording ? "bg-red-500 animate-pulse shadow-red-200" : "bg-blue-600 shadow-blue-200 hover:bg-blue-700"
              )}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !inputText.trim()}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-100 flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Ai 生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Ai 生成标准病历
              </>
            )}
          </button>
        </section>

        {/* ResultSection */}
        {record && (
          <section className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <FileText className="w-4 h-4" />
                标准病历预览
              </span>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-full transition-colors active:scale-95",
                  isEditing ? "bg-blue-600 text-white" : "text-blue-600 bg-blue-100 hover:bg-blue-200"
                )}
              >
                {isEditing ? '完成编辑' : '编辑'}
              </button>
            </div>
            
            <div className="p-4 space-y-4 text-sm text-slate-700 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-800 underline underline-offset-4 decoration-blue-200 mb-2 italic">主诉：</h4>
                {isEditing ? (
                  <textarea 
                    value={record.chiefComplaint}
                    onChange={(e) => setRecord({...record, chiefComplaint: e.target.value})}
                    className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={2}
                  />
                ) : (
                  <p>{record.chiefComplaint}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 underline underline-offset-4 decoration-blue-200 mb-2 italic">护理评估：</h4>
                {isEditing ? (
                  <textarea 
                    value={record.assessment}
                    onChange={(e) => setRecord({...record, assessment: e.target.value})}
                    className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={3}
                  />
                ) : (
                  <p>{record.assessment}</p>
                )}
              </div>
              
              <div>
                <h4 className="font-bold text-slate-800 underline underline-offset-4 decoration-blue-200 mb-2 italic">诊疗计划：</h4>
                {isEditing ? (
                  <textarea 
                    value={record.plan}
                    onChange={(e) => setRecord({...record, plan: e.target.value})}
                    className="w-full p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    rows={4}
                  />
                ) : (
                  <p className="whitespace-pre-line">{record.plan}</p>
                )}
              </div>
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={async () => {
                  if (!record) return;
                  const { saveDraftToLocal } = await import('@/src/lib/local-drafts');
                  const payload = {
                    chiefComplaint: record.chiefComplaint,
                    assessment: record.assessment,
                    plan: record.plan,
                    rawInput: inputText,
                  };
                  try {
                    const { apiPost } = await import('@/src/lib/api');
                    await apiPost('/api/records/save', payload);
                    saveDraftToLocal(payload);
                    refreshDraftCount();
                    showToast('已保存至服务器');
                  } catch {
                    saveDraftToLocal(payload);
                    refreshDraftCount();
                    showToast('已保存至本地草稿箱（未同步到服务器）');
                  }
                }}
                className="py-2.5 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 font-semibold text-sm hover:bg-slate-100 transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                保存至本地
              </button>
              <button 
                onClick={() => showToast('HIS 接口未配置')}
                className="py-2.5 px-4 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 shadow-sm shadow-green-100 transition-colors active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                同步至 HIS
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
