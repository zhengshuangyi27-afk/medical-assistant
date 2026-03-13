import { Zap, FileText, FlaskConical, MessageSquare, ClipboardList, Clock, CheckCircle2, X } from 'lucide-react';
import BottomNav from '@/src/components/ui/BottomNav';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { getSelectedModelId } from '@/src/lib/llm';
import { apiGet } from '@/src/lib/api';
import type { Task, TaskStatus } from '@/src/lib/tasks';
import { getTasks, updateTask } from '@/src/lib/tasks';

/** 与 Profile 页一致的头像地址，保证首页头像即「我的」头像 */
const PROFILE_AVATAR_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbBfro0m89yk4rm-wyVevUSsEpExKZKWXqYjpMpH_R0ZxG1lHO1aX2l0XYLufxC1FXphv8vBL2wFzdX135gXIq3YJnXUbp1YFreLWYwJOb-boCUuGTBhM4bvaw-FppB2oymZBoU-VgO4p8P3Dlshr8IERUW-PSihMDSW7P9ydRyeKxfO2hOU9u51wrKq64JwtfnD_D7R03AAA7ljdtdTTWwLqb9jbXL6pELfp73ndNNp5hevXcfVMsK3yOfcY5rDZJbBFF77Ts-HY';

export default function Home() {
  const [currentModelName, setCurrentModelName] = useState<string>('');

  useEffect(() => {
    const id = getSelectedModelId();
    apiGet<{ models: { id: string; name: string }[] }>('/api/config/llm')
      .then((data) => {
        const name = data.models?.find((m) => m.id === id)?.name ?? id;
        setCurrentModelName(name);
      })
      .catch(() => setCurrentModelName(id || '—'));
  }, []);

  const [tasks, setTasksState] = useState<Task[]>(() => getTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    updateTask(id, { status: newStatus });
    setTasksState(getTasks());
    setSelectedTask(null);
  };

  const getIconStyles = (status: TaskStatus) => {
    switch(status) {
      case 'in-progress': return 'bg-green-50 border-green-100 text-green-600';
      case 'pending': return 'bg-orange-50 border-orange-100 text-orange-600';
      case 'completed': return 'bg-slate-100 border-slate-200 text-slate-400';
      case 'cancelled': return 'bg-red-50 border-red-100 text-red-500';
    }
  };

  const getStatusBadgeStyles = (status: TaskStatus) => {
    switch(status) {
      case 'in-progress': return 'bg-green-50 text-green-700';
      case 'pending': return 'bg-slate-100 text-slate-500';
      case 'completed': return 'bg-slate-50 text-slate-400';
      case 'cancelled': return 'bg-red-50 text-red-500';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch(status) {
      case 'in-progress': return '进行中';
      case 'pending': return '待处理';
      case 'completed': return '已完成';
      case 'cancelled': return '已取消';
    }
  };

  const getIcon = (type: string, status: TaskStatus) => {
    if (status === 'completed') return <CheckCircle2 className="h-5 w-5" />;
    if (status === 'cancelled') return <X className="h-5 w-5" />;
    if (type === 'clipboard') return <ClipboardList className="h-5 w-5" />;
    if (type === 'clock') return <Clock className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* NavigationBar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe">
        <div className="px-4 h-16 flex items-center justify-between relative">
          {/* Left placeholder to maintain flex layout balance */}
          <div className="w-[72px]"></div>
          
          {/* Centered Title */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-blue-900">多模态Ai医护助手</span>
          </div>

          <div className="flex items-center">
            <Link to="/profile" className="block rounded-full border border-slate-200 overflow-hidden">
              <img
                alt="用户头像"
                className="w-8 h-8 rounded-full object-cover"
                src={PROFILE_AVATAR_URL}
              />
            </Link>
          </div>
        </div>
      </nav>

      {/* MainContent */}
      <main className="flex-1 px-4 py-6 space-y-6 overflow-y-auto pb-24 no-scrollbar">
        {/* QuickAccessGrid */}
        <section>
          <h3 className="text-slate-900 font-bold text-lg mb-4">快捷访问</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/records" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Ai<br />病例生成</span>
            </Link>
            
            <Link to="/search" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Ai<br />用药查询</span>
            </Link>
            
            <Link to="/qa" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">Ai<br />科室问答</span>
            </Link>
          </div>
        </section>

        {/* TodaysTasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 font-bold text-lg">今日任务</h3>
            <Link to="/tasks" className="text-blue-600 text-sm font-semibold">查看全部</Link>
          </div>
          <div className="space-y-3">
            {tasks.map(task => (
              <div 
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={cn(
                  "bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform",
                  (task.status === 'completed' || task.status === 'cancelled') && "opacity-70"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", getIconStyles(task.status))}>
                    {getIcon(task.iconType, task.status)}
                  </div>
                  <div>
                    <p className={cn("font-semibold text-slate-800 text-base leading-none", (task.status === 'completed' || task.status === 'cancelled') && "line-through")}>
                      {task.title}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">{task.time} - {task.location}</p>
                  </div>
                </div>
                <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider shrink-0", getStatusBadgeStyles(task.status))}>
                  {getStatusText(task.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 当前模型显示：导航栏上方 */}
      {currentModelName && (
        <div className="fixed bottom-16 left-0 right-0 z-40 max-w-md mx-auto px-4 pb-1">
          <div className="bg-slate-100/95 backdrop-blur text-slate-600 text-xs py-2 px-3 rounded-lg text-center">
            当前模型：{currentModelName}
          </div>
        </div>
      )}

      <BottomNav />

      {/* Task Action Modal */}
      {selectedTask && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">更新任务状态</h3>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="font-semibold text-slate-800 text-base mb-1">{selectedTask.title}</p>
              <p className="text-base text-slate-500 mb-6">{selectedTask.time} - {selectedTask.location}</p>
              
              <div className="space-y-3">
                {selectedTask.status !== 'completed' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'completed')}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    标记为已完成
                  </button>
                )}
                {selectedTask.status !== 'in-progress' && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'in-progress')}
                    className="w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <Clock className="w-5 h-5" />
                    设为进行中
                  </button>
                )}
                {selectedTask.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleUpdateStatus(selectedTask.id, 'cancelled')}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                  >
                    <X className="w-5 h-5" />
                    取消任务
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
