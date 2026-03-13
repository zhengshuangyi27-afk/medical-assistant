import { Bell, Zap, FileText, FlaskConical, MessageSquare, ClipboardList, Clock, CheckCircle2, X } from 'lucide-react';
import BottomNav from '@/src/components/ui/BottomNav';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/src/lib/utils';

type TaskStatus = 'in-progress' | 'pending' | 'completed' | 'cancelled';

interface Task {
  id: string;
  title: string;
  time: string;
  location: string;
  status: TaskStatus;
  iconType: 'clipboard' | 'clock' | 'check';
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: '晨间查房', time: '08:30 AM', location: '4楼', status: 'in-progress', iconType: 'clipboard' },
    { id: '2', title: '手术准备', time: '11:00 AM', location: '2号手术室', status: 'pending', iconType: 'clock' },
    { id: '3', title: '门诊接诊', time: '07:00 AM', location: '201诊室', status: 'completed', iconType: 'check' },
  ]);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
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
            <span className="font-bold text-xl tracking-tight text-blue-900">AI助手医护版</span>
          </div>

          <div className="flex items-center gap-4">
            <button aria-label="通知" className="relative p-2 text-slate-500">
              <Bell className="h-6 w-6" />
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <img
              alt="用户头像"
              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1qTLZ9Lv-ihjhCI8QPhoRtam2DBIQE4ZESYQlFReF_UkGHg4PUP6DiIf0ppUPCiVjvhJe54sVWpvWnSej7ePoXNfZd_FYKbwHk4rsixsPTHsLVqi7aPT8-onZGHMKx_xTYBjJZaObwlJxQcMLDjWXTF8Yo_R9CiNOonHl-KeFP1AzrnknRJ9PxQZQZ7xRd6B7C1uVxP708UBpxKW3zI-D7nbak6KXcOYLgfiQTJ1V3PH1vNB25Lamztm3jXn0GTdX4oOfYYiRAKE"
            />
          </div>
        </div>
      </nav>

      {/* MainContent */}
      <main className="flex-1 px-4 py-6 space-y-6 overflow-y-auto pb-24 no-scrollbar">
        {/* NotificationBanner */}
        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
          <div className="mt-1 bg-blue-500 p-1.5 rounded-lg shrink-0">
            <div className="h-5 w-5 text-white flex items-center justify-center font-bold text-sm">i</div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 text-base">新紧急消息</h4>
            <p className="text-blue-700 text-sm mt-1 leading-relaxed">患者 #1024 的检验结果已出，请尽快审阅并采取行动。</p>
          </div>
          <button className="text-blue-400 hover:text-blue-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        </section>

        {/* QuickAccessGrid */}
        <section>
          <h3 className="text-slate-900 font-bold text-lg mb-4">快捷访问</h3>
          <div className="grid grid-cols-3 gap-3">
            <Link to="/records" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">生成<br />病历</span>
            </Link>
            
            <Link to="/search" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">用药<br />查询</span>
            </Link>
            
            <Link to="/qa" className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group active:scale-95 transition-transform">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">科室<br />问答</span>
            </Link>
          </div>
        </section>

        {/* TodaysTasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-900 font-bold text-lg">今日任务</h3>
            <button className="text-blue-600 text-sm font-semibold">查看全部</button>
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
