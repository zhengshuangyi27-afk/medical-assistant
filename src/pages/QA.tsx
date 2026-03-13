import { ChevronLeft, MoreHorizontal, Mic, Send, Image, Wrench, Calendar, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: React.ReactNode;
}

export default function QA() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'user',
      content: '腹部手术的术前准备流程是什么？'
    },
    {
      id: '2',
      role: 'ai',
      content: (
        <>
          <h3 className="text-sm font-bold text-gray-800 mb-2">腹部手术术前准备指南</h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">请仔细遵循以下步骤，以确保手术安全顺利进行：</p>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">1.</span>
              <span><strong>禁食：</strong> 术前 8 小时禁食固体食物。术前 2 小时前允许饮用清亮液体。</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">2.</span>
              <span><strong>用药：</strong> 术前 5 天停用所有抗凝药物（如阿司匹林）。请务必咨询您的主治医生。</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">3.</span>
              <span><strong>卫生：</strong> 手术前一晚和手术当日早晨，请使用提供的抗菌肥皂洗澡。</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold text-blue-600 mr-2">4.</span>
              <span><strong>到达：</strong> 请在预定手术时间前 2 小时到达手术入院登记处。</span>
            </li>
          </ul>
          <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">生成于上午 10:45</span>
            <button className="text-xs text-blue-600 font-medium hover:underline">下载 PDF</button>
          </div>
        </>
      )
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    const { getSelectedModelId } = await import('@/src/lib/llm');
    const history = messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'ai',
      content: typeof m.content === 'string' ? m.content : String(m.content),
    }));

    try {
      const { apiPost } = await import('@/src/lib/api');
      const data = await apiPost<{ reply: string }>('/api/llm/chat', {
        prompt: text,
        modelId: getSelectedModelId(),
        history,
      });
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.reply,
      };
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error('LLM API Error:', error);
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `请求失败：${error instanceof Error ? error.message : '请检查网络或后端服务'}`,
      };
      setMessages(prev => [...prev, newAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe">
        <div className="px-4 h-16 flex items-center justify-between relative">
          <button onClick={() => navigate(-1)} aria-label="返回" className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors shrink-0">
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 font-bold text-xl tracking-tight text-blue-900">Ai 科室问答</h1>
          <button type="button" className="text-gray-400 hover:text-gray-600 p-1 shrink-0" aria-label="更多">
            <MoreHorizontal className="h-6 w-6" />
          </button>
        </div>
      </nav>

      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 no-scrollbar space-y-6">
        {messages.map((msg, index) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            style={{ animationDelay: `${index === 0 || index === 1 ? index * 150 : 0}ms`, animationFillMode: 'both' }}
          >
            {msg.role === 'user' ? (
              <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-sm">
                <div className="text-sm">{msg.content}</div>
              </div>
            ) : (
              <div className="flex items-start space-x-2 max-w-[90%]">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mt-1">
                  <span className="text-xs font-bold text-blue-600">Ai</span>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-4 shadow-sm">
                  {msg.content}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start space-x-2 max-w-[90%]">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mt-1">
                <span className="text-xs font-bold text-blue-600">Ai</span>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-4 shadow-sm flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-500">正在思考...</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Suggestions */}
        <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300 fill-mode-both">
          {['手术准备', '化验流程', '紧急联系人', '术后护理'].map((chip) => (
            <button 
              key={chip} 
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="bg-white border border-blue-100 text-blue-600 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm active:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chip}
            </button>
          ))}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 pb-safe">
        <div className="p-4">
          <div className="relative flex items-center">
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage(inputValue);
                  }
                }}
                disabled={isLoading}
                className="w-full bg-gray-100 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-400 outline-none disabled:opacity-50" 
                placeholder="输入问题（如：手术准备流程）" 
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600">
                <Mic className="h-5 w-5" />
              </button>
            </div>
            <button 
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="ml-3 bg-blue-600 text-white p-3 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-3 flex justify-around text-gray-400">
            <button className="flex flex-col items-center hover:text-gray-600 transition-colors">
              <Image className="h-5 w-5" />
              <span className="text-[10px] mt-1">照片</span>
            </button>
            <button className="flex flex-col items-center hover:text-gray-600 transition-colors">
              <Wrench className="h-5 w-5" />
              <span className="text-[10px] mt-1">工具</span>
            </button>
            <button className="flex flex-col items-center hover:text-gray-600 transition-colors">
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] mt-1">记录</span>
            </button>
            <button className="flex flex-col items-center hover:text-gray-600 transition-colors">
              <User className="h-5 w-5" />
              <span className="text-[10px] mt-1">个人</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
