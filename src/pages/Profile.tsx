import { ChevronRight, Info, Database, FileCode2, ChevronLeft, Bot, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BottomNav from '@/src/components/ui/BottomNav';
import { cn } from '@/src/lib/utils';
import { apiGet, apiPost } from '@/src/lib/api';
import { getSelectedModelId } from '@/src/lib/llm';

interface LlmModel {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => getSelectedModelId());
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);

  useEffect(() => {
    apiGet<{ models: LlmModel[] }>('/api/config/llm')
      .then((data) => {
        setModels(data.models || []);
        if (!selectedModel && data.models?.length) {
          const defaultId = data.models.find((m) => m.is_default)?.id || data.models[0].id;
          setSelectedModel(defaultId);
          localStorage.setItem('selected_llm', defaultId);
        }
      })
      .catch(() => {
        setModels([
          { id: 'qwen3.5-plus', name: '通义千问 3.5 Plus (阿里云)', description: 'DashScope 推荐，能力强', is_default: true },
          { id: 'qwen-turbo', name: '通义千问 Turbo (阿里云)', description: 'DashScope 快速响应', is_default: false },
          { id: 'qwen-plus', name: '通义千问 Plus (阿里云)', description: 'DashScope 更强推理', is_default: false },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速响应', is_default: false },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '强推理', is_default: false },
        ]);
        if (!selectedModel) setSelectedModel('qwen3.5-plus');
        localStorage.setItem('selected_llm', 'qwen3.5-plus');
      });
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selected_llm', modelId);
    apiPost('/api/config/user/settings', { selected_llm: modelId }).catch(() => {});
    setIsModelModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f8fa] relative">
      <header className="bg-white sticky top-0 z-40 px-4 py-3 flex items-center pt-safe">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors mr-2">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">设置</h1>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* UserProfileSection */}
        <section className="bg-white px-4 py-8 flex items-center shadow-sm mb-3">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mr-4 overflow-hidden border border-gray-100 shrink-0">
            <img 
              alt="用户头像" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbBfro0m89yk4rm-wyVevUSsEpExKZKWXqYjpMpH_R0ZxG1lHO1aX2l0XYLufxC1FXphv8vBL2wFzdX135gXIq3YJnXUbp1YFreLWYwJOb-boCUuGTBhM4bvaw-FppB2oymZBoU-VgO4p8P3Dlshr8IERUW-PSihMDSW7P9ydRyeKxfO2hOU9u51wrKq64JwtfnD_D7R03AAA7ljdtdTTWwLqb9jbXL6pELfp73ndNNp5hevXcfVMsK3yOfcY5rDZJbBFF77Ts-HY" 
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-xl font-bold text-[#333333]">陈伟 医生</h1>
            <p className="text-sm text-[#666666] mt-1">高级医疗助理 • 心内科</p>
          </div>
          <div className="text-gray-400">
            <ChevronRight className="h-5 w-5" />
          </div>
        </section>

        {/* LLM Configuration Section */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">AI 大模型配置</h2>
          <div className="bg-white border-y border-gray-100">
            <div 
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <span className="text-base text-[#333333] block font-medium">当前启用模型</span>
                  <span className="text-xs text-purple-600 font-medium mt-0.5 block">
                    {models.find(m => m.id === selectedModel)?.name || selectedModel || '未选择'}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-[#666666]">
                <span className="text-sm mr-2">切换</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        {/* SystemConfigurationSection */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">医院系统配置</h2>
          <div className="bg-white border-y border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center">
                <span className="text-[#1a73e8] mr-3">
                  <Database className="h-5 w-5" />
                </span>
                <span className="text-base text-[#333333]">HIS API 终端</span>
              </div>
              <div className="flex items-center text-[#666666]">
                <span className="text-sm mr-2">已连接</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center">
                <span className="text-[#1a73e8] mr-3">
                  <FileCode2 className="h-5 w-5" />
                </span>
                <span className="text-base text-[#333333]">EMR 集成</span>
              </div>
              <div className="flex items-center text-[#666666]">
                <span className="text-sm mr-2">v2.4.0</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        {/* NotificationsSection */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">消息通知</h2>
          <div className="bg-white border-y border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <span className="text-base text-[#333333]">新患者提醒</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a73e8]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <span className="text-base text-[#333333]">化验结果更新</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a73e8]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* SupportSection */}
        <section className="mb-8">
          <div className="bg-white border-y border-gray-100">
            <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">
                  <Info className="h-5 w-5" />
                </span>
                <span className="text-base text-[#333333]">关于医疗助手</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </section>

        {/* ActionButtons */}
        <section className="px-4 mt-8">
          <button 
            onClick={() => {
              // eslint-disable-next-line no-restricted-globals
              if(confirm('您确定要退出登录吗？')) {
                console.log('正在退出登录...');
              }
            }}
            className="w-full bg-white text-red-500 font-medium py-3 rounded-xl border border-red-50 active:bg-red-50 transition-colors shadow-sm"
          >
            退出登录
          </button>
          <p className="text-center text-xs text-gray-400 mt-6 pb-4">版本 1.2.4 (构建号 20231024)</p>
        </section>
      </main>

      <BottomNav />

      {/* Model Selection Modal */}
      {isModelModalOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full rounded-t-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 pb-safe">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">选择 AI 大模型</h3>
              <button onClick={() => setIsModelModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50">
              {models.map(model => (
                <div 
                  key={model.id}
                  onClick={() => handleModelChange(model.id)}
                  className={cn(
                    "p-4 flex items-center justify-between rounded-xl mb-3 cursor-pointer transition-all active:scale-[0.98] bg-white shadow-sm",
                    selectedModel === model.id ? "ring-2 ring-purple-500 border-transparent" : "border border-slate-200 hover:border-purple-300"
                  )}
                >
                  <div>
                    <h4 className={cn("font-bold text-base", selectedModel === model.id ? "text-purple-700" : "text-slate-800")}>
                      {model.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5">{model.description ?? ''}</p>
                  </div>
                  {selectedModel === model.id && (
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-purple-600" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
