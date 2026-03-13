import { ChevronLeft, FileText, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getLocalDrafts, deleteLocalDraft, type DraftRecord } from '@/src/lib/local-drafts';

export default function Drafts() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<DraftRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadDrafts = () => setDrafts(getLocalDrafts());

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteLocalDraft(id);
    loadDrafts();
    if (expandedId === id) setExpandedId(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center pt-safe">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold ml-2">草稿箱</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-10 no-scrollbar">
        {drafts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>暂无草稿</p>
            <p className="mt-1">在「生成病历」页生成并保存后，会出现在这里</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  className="w-full text-left p-4 flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 line-clamp-1">{d.chiefComplaint || '（无主诉）'}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(d.savedAt)}</p>
                  </div>
                  <span className="text-slate-400 text-sm shrink-0">
                    {expandedId === d.id ? '收起' : '展开'}
                  </span>
                </button>
                {expandedId === d.id && (
                  <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3 text-sm">
                    <div>
                      <span className="text-slate-500 font-medium">主诉：</span>
                      <p className="text-slate-700 mt-0.5">{d.chiefComplaint || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">护理评估：</span>
                      <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{d.assessment || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">诊疗计划：</span>
                      <p className="text-slate-700 mt-0.5 whitespace-pre-wrap">{d.plan || '—'}</p>
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => handleDelete(e, d.id)}
                        className="text-red-500 flex items-center gap-1 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
