import { ChevronLeft, Camera, Upload, Loader2, AlertTriangle, FileText, Stethoscope, Apple } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRef, useState } from 'react';
import { cn } from '@/src/lib/utils';
import BottomNav from '@/src/components/ui/BottomNav';
import { apiPostFormData } from '@/src/lib/api';
import { getModelIdForModule } from '@/src/lib/llm';

interface ReportItem {
  name: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
  reference: string;
}

interface ReportParsed {
  reportType?: string;
  items?: ReportItem[];
  abnormalSummary?: string[];
  summary?: string;
  /** 综合建议 */
  suggestions?: string[];
  /** 是否需就诊、紧急程度等 */
  visitRecommendation?: string;
  /** 建议就诊科室 */
  recommendedDepartments?: string[];
  /** 生活与饮食建议 */
  lifestyleAndDietAdvice?: string[];
}

export default function Report() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ReportParsed | null>(null);
  const [rawResult, setRawResult] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!/^image\/(jpeg|png|gif|webp)$/i.test(file.type)) {
      setError('请选择图片文件（jpg/png/gif/webp）');
      return;
    }
    setError('');
    setParsed(null);
    setRawResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      form.append('modelId', getModelIdForModule('report'));
      const data = await apiPostFormData<{ result: string; parsed: ReportParsed | null }>('/api/report/parse', form);
      setRawResult(data.result || null);
      setParsed(data.parsed || null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '解析失败，请重试';
      setError(msg.includes('Not Found') || msg.includes('404') ? '接口未找到，请确认后端已启动（npm run server）并已包含报告路由' : msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe">
        <div className="px-4 h-16 flex items-center justify-between relative">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-xl tracking-tight text-blue-900">报告助手</h1>
          <div className="w-10 shrink-0" />
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar space-y-4">
        {/* 上传区域：拍照 + 上传照片 */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-sm text-slate-600 mb-3">上传报告图片，AI 将解析并标注异常指标</p>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              capture="environment"
              onChange={handleInputChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              <Camera className="h-5 w-5" />
              拍照
            </button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleInputChange}
              className="hidden"
              id="report-file-upload"
            />
            <label
              htmlFor="report-file-upload"
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm border-2 border-slate-200 text-slate-700',
                isLoading ? 'opacity-60 pointer-events-none' : 'cursor-pointer hover:bg-slate-50'
              )}
            >
              <Upload className="h-5 w-5" />
              上传照片
            </label>
          </div>
        </section>

        {/* 预览图 */}
        {previewUrl && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <p className="text-xs text-slate-500 px-4 pt-3 pb-1">当前图片</p>
            <img src={previewUrl} alt="报告" className="w-full max-h-48 object-contain bg-slate-50" />
          </section>
        )}

        {/* 加载中 */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-8 text-blue-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>正在解析报告…</span>
          </div>
        )}

        {/* 错误 */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* 解析结果：固定格式展示 + 异常指标提示 */}
        {!isLoading && (parsed || rawResult) && (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="font-bold text-slate-800">解析结果</h2>
            </div>
            <div className="p-4 space-y-4">
              {parsed?.reportType && (
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">报告类型</p>
                  <p className="font-semibold text-slate-800">{parsed.reportType}</p>
                </div>
              )}

              {parsed?.abnormalSummary && parsed.abnormalSummary.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    异常指标提示
                  </p>
                  <ul className="space-y-1.5 text-sm text-amber-900">
                    {parsed.abnormalSummary.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 shrink-0">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed?.items && parsed.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">检查项目</p>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600">
                          <th className="text-left py-2 px-3 font-medium">项目</th>
                          <th className="text-left py-2 px-3 font-medium">结果</th>
                          <th className="text-left py-2 px-3 font-medium">参考范围</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsed.items.map((item, i) => (
                          <tr
                            key={i}
                            className={cn(
                              'border-t border-slate-100',
                              item.isAbnormal ? 'bg-red-50/80' : ''
                            )}
                          >
                            <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                            <td className="py-2 px-3">
                              <span className={cn(item.isAbnormal && 'font-semibold text-red-700')}>
                                {item.value} {item.unit}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">{item.reference || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {parsed?.summary && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-0.5">总结</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{parsed.summary}</p>
                </div>
              )}

              {(parsed?.suggestions && parsed.suggestions.length > 0) ||
              parsed?.visitRecommendation ||
              (parsed?.recommendedDepartments && parsed.recommendedDepartments.length > 0) ||
              (parsed?.lifestyleAndDietAdvice && parsed.lifestyleAndDietAdvice.length > 0) ? (
                <div className="pt-3 border-t border-slate-100 space-y-4">
                  <p className="text-sm font-bold text-blue-900">健康与就诊建议</p>
                  {parsed?.suggestions && parsed.suggestions.length > 0 && (
                    <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-2">综合建议</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        {parsed.suggestions.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-blue-600 shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(parsed?.visitRecommendation ||
                    (parsed?.recommendedDepartments && parsed.recommendedDepartments.length > 0)) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                        <Stethoscope className="h-4 w-4" />
                        就医与科室
                      </p>
                      {parsed.visitRecommendation && (
                        <p className="text-sm text-slate-800 mb-2 leading-relaxed">{parsed.visitRecommendation}</p>
                      )}
                      {parsed.recommendedDepartments && parsed.recommendedDepartments.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">建议就诊科室</p>
                          <div className="flex flex-wrap gap-2">
                            {parsed.recommendedDepartments.map((d, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-sm font-medium text-blue-800"
                              >
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {parsed?.lifestyleAndDietAdvice && parsed.lifestyleAndDietAdvice.length > 0 && (
                    <div className="bg-emerald-50/80 border border-emerald-100 rounded-xl p-3">
                      <p className="text-xs font-semibold text-emerald-800 mb-2 flex items-center gap-1">
                        <Apple className="h-4 w-4" />
                        生活与饮食习惯
                      </p>
                      <ul className="space-y-1.5 text-sm text-emerald-900">
                        {parsed.lifestyleAndDietAdvice.map((s, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-emerald-600 shrink-0">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400">以上建议由 AI 生成，仅供参考，不能替代医生诊断与处方。</p>
                </div>
              ) : null}

              {!parsed && rawResult && (
                <div className="text-sm text-slate-600 whitespace-pre-wrap font-mono bg-slate-50 p-3 rounded-xl">
                  {rawResult}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
