import { Search as SearchIcon, Heart, Share2, ChevronRight, ChevronDown, ChevronUp, Clock, Calculator, FileText, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';
import Markdown from 'react-markdown';
import { apiPost } from '@/src/lib/api';

export default function Search() {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [structuredResult, setStructuredResult] = useState<{
    推荐剂量?: string;
    禁忌症与相互作用?: string;
    指南摘要?: string;
    指南来源?: string;
  } | null>(null);
  /** 按「1. 标题」「2. 标题」切分的多块卡片（大段 Markdown 时使用） */
  const [numberedSections, setNumberedSections] = useState<{ title: string; content: string }[]>([]);
  /** 已展开的卡片下标（固定高度时点击「全部」展开） */
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [fullTextOpen, setFullTextOpen] = useState(false);

  const toggleCardExpanded = (idx: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const CARD_COLORS = ['bg-[#0055BB]', 'bg-orange-400', 'bg-green-500', 'bg-amber-500', 'bg-[#0055BB]', 'bg-orange-400'];

  const parseStructured = (raw: string): typeof structuredResult => {
    const keys = ['推荐剂量', '禁忌症与相互作用', '指南摘要', '指南来源'];
    const tryParse = (str: string): typeof structuredResult | null => {
      try {
        const parsed = JSON.parse(str) as Record<string, unknown>;
        const map: Record<string, string> = {};
        keys.forEach((k) => {
          const v = parsed[k];
          if (v != null && typeof v === 'string') {
            const trimmed = v.trim();
            if (trimmed && trimmed !== '—') map[k] = trimmed;
          }
        });
        return Object.keys(map).length ? (map as typeof structuredResult) : null;
      } catch {
        return null;
      }
    };
    let cleaned = raw.trim();
    // 去掉 markdown 代码块
    const codeBlock = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i.exec(cleaned);
    if (codeBlock) cleaned = codeBlock[1].trim();
    let parsed = tryParse(cleaned);
    if (parsed) return parsed;
    // 从整段文本中截取首尾 { } 之间的内容再解析
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      parsed = tryParse(cleaned.slice(start, end + 1));
      if (parsed) return parsed;
    }
    // 兜底：按「推荐剂量」「禁忌症」「指南」等标题切分大段文字
    const sections: Record<string, string> = {};
    const splitRe = /(推荐剂量|禁忌症与相互作用|禁忌症[与及]?相互作用|指南摘要|最新指南\s*\(\d+\)|指南)[：:]\s*/gi;
    const parts = cleaned.split(splitRe);
    for (let i = 1; i < parts.length - 1; i += 2) {
      const title = (parts[i] || '').trim();
      const content = (parts[i + 1] || '').trim().replace(/\n{3,}/g, '\n\n');
      if (!content || content.length < 2) continue;
      if (/推荐剂量/.test(title)) sections['推荐剂量'] = content;
      else if (/禁忌症/.test(title)) sections['禁忌症与相互作用'] = content;
      else if (/指南/.test(title)) sections['指南摘要'] = content;
    }
    if (Object.keys(sections).length > 0) return sections as typeof structuredResult;
    return null;
  };

  /** 将禁忌症文本拆成列表项（按换行或句号） */
  const contraindicationItems = (text: string): string[] => {
    return text
      .split(/\n|(?<=。)/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  /** 按「**1. 标题**」或行首「1. 标题」切分为多块，用于大段 Markdown 展示为卡片 */
  const parseNumberedSections = (raw: string): { title: string; content: string }[] => {
    const trimmed = raw.trim();
    const sections: { title: string; content: string }[] = [];

    // 方式一：匹配 **1. 药物基本信息**（标题至少一个非*字符，到下一个 ** 结束）
    const boldRe = /\*\*(\d+\.\s*[^*]+)\*\*/g;
    let m: RegExpExecArray | null;
    let prevTitle = '';
    let prevStart = 0;
    while ((m = boldRe.exec(trimmed)) !== null) {
      if (prevTitle) {
        const content = trimmed.slice(prevStart, m.index).trim().replace(/\n{3,}/g, '\n\n');
        if (content.length > 0) sections.push({ title: prevTitle, content });
      }
      prevTitle = m[1].trim();
      prevStart = m.index + m[0].length;
    }
    if (prevTitle) {
      const content = trimmed.slice(prevStart).trim().replace(/\n{3,}/g, '\n\n');
      if (content.length > 0) sections.push({ title: prevTitle, content });
    }

    // 方式二：若无 ** 格式，按行首「1. 标题」或「### 1. 标题」切分
    if (sections.length === 0) {
      const lineRe = /(?:^|\n)\s*#{0,3}\s*(\d+\.\s*[^\n]+)/gm;
      const parts: { index: number; title: string; fullLen: number }[] = [];
      let match: RegExpExecArray | null;
      while ((match = lineRe.exec(trimmed)) !== null) {
        const title = match[1].replace(/\*\*/g, '').trim();
        if (title && /^\d+\.\s+\S+/.test(title)) {
          parts.push({ index: match.index, title, fullLen: match[0].length });
        }
      }
      for (let i = 0; i < parts.length; i++) {
        const contentStart = parts[i].index + parts[i].fullLen;
        const contentEnd = i + 1 < parts.length ? parts[i + 1].index : trimmed.length;
        const content = trimmed.slice(contentStart, contentEnd).trim().replace(/\n{3,}/g, '\n\n');
        sections.push({ title: parts[i].title, content: content || '—' });
      }
    }
    return sections;
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setStructuredResult(null);
    setNumberedSections([]);
    setExpandedCards(new Set());
    try {
      const { getSelectedModelId } = await import('@/src/lib/llm');
      const data = await apiPost<{ result: string }>('/api/llm/query', {
        query: searchQuery,
        modelId: getSelectedModelId(),
      });
      const text = data.result || '未获取到结果';
      setResult(text);
      const structured = parseStructured(text);
      setStructuredResult(structured);
      const sections = parseNumberedSections(text);
      setNumberedSections(sections);
    } catch (error) {
      console.error(error);
      setResult('抱歉，获取信息时发生错误，请稍后重试。');
      setStructuredResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F5F7FA]">
      <header className="bg-white sticky top-0 z-40 shadow-sm px-4 pt-safe pb-4">
        <div className="flex items-center space-x-3 mb-4 mt-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="w-8 h-8 bg-[#0055BB] rounded-lg flex items-center justify-center shrink-0">
            <SearchIcon className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-bold text-[#0055BB] tracking-tight">Ai 医疗指南</h1>
        </div>
        
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </span>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="block w-full pl-10 pr-14 py-3 bg-[#F5F7FA] border-none rounded-xl focus:ring-2 focus:ring-[#0055BB] text-sm placeholder-gray-500 outline-none" 
            placeholder="搜索药物、症状或指南..." 
          />
          {isLoading ? (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Loader2 className="h-5 w-5 text-[#0055BB] animate-spin" />
            </span>
          ) : (
            <button 
              onClick={() => handleSearch()}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#0055BB] font-bold text-sm hover:text-blue-700 active:scale-95 transition-transform"
            >
              搜索
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar pb-10">
        {/* AI Search Results Section */}
        {result ? (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-[#0055BB] text-xs font-bold px-2 py-0.5 rounded">Ai 回答</span>
                <h2 className="text-base font-bold text-gray-800 line-clamp-1">{query}</h2>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn("transition-colors", isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500")}
                >
                  <Heart className={cn("h-6 w-6", isFavorite ? "fill-red-500" : "")} />
                </button>
                <button className="text-gray-400 hover:text-[#0055BB] transition-colors">
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {numberedSections.length > 0 ? (
                <>
                  {numberedSections.map((sec, idx) => {
                    const isExpanded = expandedCards.has(idx);
                    return (
                      <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={cn('w-1.5 h-4 rounded-full', CARD_COLORS[idx % CARD_COLORS.length])} />
                          <h3 className="font-bold text-sm text-gray-800">{sec.title}</h3>
                        </div>
                        <div
                          className={cn(
                            'text-sm text-gray-600 leading-relaxed overflow-hidden transition-[max-height] duration-300',
                            isExpanded ? 'max-h-[2000px]' : 'max-h-20'
                          )}
                        >
                          <Markdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-0.5" {...props} />,
                              li: ({ node, ...props }) => <li className="ml-1" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-semibold text-gray-800" {...props} />,
                            }}
                          >
                            {sec.content}
                          </Markdown>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCardExpanded(idx)}
                          className="mt-2 text-xs font-bold text-[#0055BB] flex items-center hover:underline"
                        >
                          {isExpanded ? '收起' : '全部'}
                          {isExpanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setFullTextOpen(true)}
                    className="text-xs font-bold text-[#0055BB] flex items-center hover:underline"
                  >
                    阅读全文
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                  {fullTextOpen && result && (
                    <div
                      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in duration-200"
                      onClick={() => setFullTextOpen(false)}
                    >
                      <div
                        className="bg-white w-full max-h-[85vh] rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                          <h3 className="font-bold text-gray-800">完整返回数据</h3>
                          <button
                            type="button"
                            onClick={() => setFullTextOpen(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                          >
                            关闭
                          </button>
                        </div>
                        <div className="overflow-y-auto p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-slate-50 rounded-b-2xl flex-1">
                          {result}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : structuredResult ? (
                <>
                  {structuredResult['推荐剂量'] && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-4 bg-[#0055BB] rounded-full" />
                        <h3 className="font-bold text-sm text-gray-800">推荐剂量</h3>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{structuredResult['推荐剂量']}</p>
                    </div>
                  )}
                  {structuredResult['禁忌症与相互作用'] && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-4 bg-orange-400 rounded-full" />
                        <h3 className="font-bold text-sm text-gray-800">禁忌症与相互作用</h3>
                      </div>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {contraindicationItems(structuredResult['禁忌症与相互作用']).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(structuredResult['指南摘要'] || structuredResult['指南来源']) && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-4 bg-green-500 rounded-full" />
                        <h3 className="font-bold text-sm text-gray-800">最新指南 (2024)</h3>
                      </div>
                      <div className="bg-[#F5F7FA] p-3 rounded-xl">
                        {structuredResult['指南来源'] && (
                          <p className="text-xs font-semibold text-[#0055BB] mb-1 italic">{structuredResult['指南来源']}：</p>
                        )}
                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                          {structuredResult['指南摘要'] ?? '—'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setFullTextOpen(true)}
                          className="mt-2 text-xs font-bold text-[#0055BB] flex items-center hover:underline"
                        >
                          阅读全文
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 阅读全文弹窗：展示接口返回的完整数据 */}
                  {fullTextOpen && result && (
                    <div
                      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 animate-in fade-in duration-200"
                      onClick={() => setFullTextOpen(false)}
                    >
                      <div
                        className="bg-white w-full max-h-[85vh] rounded-t-2xl shadow-xl flex flex-col animate-in slide-in-from-bottom duration-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                          <h3 className="font-bold text-gray-800">完整返回数据</h3>
                          <button
                            type="button"
                            onClick={() => setFullTextOpen(false)}
                            className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                          >
                            关闭
                          </button>
                        </div>
                        <div className="overflow-y-auto p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono bg-slate-50 rounded-b-2xl flex-1">
                          {result}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <Markdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-lg font-bold text-[#0055BB] mt-4 mb-2" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-base font-bold text-[#0055BB] mt-4 mb-2" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-sm font-bold text-gray-800 mt-3 mb-1" {...props} />,
                        p: ({node, ...props}) => <p className="mb-3" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-600" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-600" {...props} />,
                        li: ({node, ...props}) => <li className="ml-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                      }}
                    >
                      {result}
                    </Markdown>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="bg-blue-100 text-[#0055BB] text-xs font-bold px-2 py-0.5 rounded">Ai 洞察示例</span>
                <h2 className="text-base font-bold text-gray-800">二甲双胍 (Metformin)</h2>
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={cn("transition-colors", isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500")}
                >
                  <Heart className={cn("h-6 w-6", isFavorite ? "fill-red-500" : "")} />
                </button>
                <button className="text-gray-400 hover:text-[#0055BB] transition-colors">
                  <Share2 className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-1.5 h-4 bg-[#0055BB] rounded-full"></div>
                  <h3 className="font-bold text-sm text-gray-700">推荐剂量</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  起始剂量：口服 500 mg 每日两次，或 850 mg 每日一次，随餐服用。每周增加 500 mg 或每 2 周增加 850 mg。
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
                  <h3 className="font-bold text-sm text-gray-700">禁忌症与相互作用</h3>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>严重肾功能损害 (eGFR 低于 30 mL/min)。</li>
                  <li>急性或慢性代谢性酸中毒。</li>
                  <li>避免过量饮酒。</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                  <h3 className="font-bold text-sm text-gray-700">最新指南 (2024)</h3>
                </div>
                <div className="bg-[#F5F7FA] p-3 rounded-xl">
                  <p className="text-xs font-semibold text-[#0055BB] mb-1 italic">ADA 2024 糖尿病诊疗标准：</p>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    除非有禁忌症，二甲双胍仍是 2 型糖尿病的一线治疗药物。鼓励早期联合治疗...
                  </p>
                  <button className="mt-2 text-xs font-bold text-[#0055BB] flex items-center hover:underline">
                    阅读全文 
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Recent Searches List */}
        {!result && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">最近搜索</h2>
              <button className="text-xs text-gray-400 font-medium hover:text-gray-600">清除全部</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['阿莫西林', '高血压指南', '小儿发烧'].map((term) => (
                <div 
                  key={term} 
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                  className="bg-white px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-200 flex items-center space-x-2 cursor-pointer hover:bg-gray-50"
                >
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{term}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Reference Footer Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div 
            onClick={() => navigate('/calculator')}
            className="bg-[#0055BB] p-4 rounded-2xl flex flex-col justify-between h-28 text-white shadow-lg shadow-blue-100 cursor-pointer active:scale-95 transition-transform"
          >
            <Calculator className="h-6 w-6 opacity-80" />
            <span className="font-bold text-sm">医学计算器</span>
          </div>
          <div className="bg-white p-4 rounded-2xl flex flex-col justify-between h-28 text-[#0055BB] border border-blue-50 shadow-sm cursor-pointer active:scale-95 transition-transform">
            <FileText className="h-6 w-6 text-[#0055BB]" />
            <span className="font-bold text-sm text-gray-800">处方模板</span>
          </div>
        </section>
      </main>
    </div>
  );
}
