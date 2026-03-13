import { ChevronLeft, ClipboardList, Clock, CheckCircle2, X, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import BottomNav from '@/src/components/ui/BottomNav';
import type { Task, TaskStatus } from '@/src/lib/tasks';
import { getTasks, addTask, updateTask, deleteTask } from '@/src/lib/tasks';

function getIconStyles(status: TaskStatus) {
  switch (status) {
    case 'in-progress': return 'bg-green-50 border-green-100 text-green-600';
    case 'pending': return 'bg-orange-50 border-orange-100 text-orange-600';
    case 'completed': return 'bg-slate-100 border-slate-200 text-slate-400';
    case 'cancelled': return 'bg-red-50 border-red-100 text-red-500';
  }
}

function getStatusBadgeStyles(status: TaskStatus) {
  switch (status) {
    case 'in-progress': return 'bg-green-50 text-green-700';
    case 'pending': return 'bg-slate-100 text-slate-500';
    case 'completed': return 'bg-slate-50 text-slate-400';
    case 'cancelled': return 'bg-red-50 text-red-500';
  }
}

function getStatusText(status: TaskStatus) {
  switch (status) {
    case 'in-progress': return '进行中';
    case 'pending': return '待处理';
    case 'completed': return '已完成';
    case 'cancelled': return '已取消';
  }
}

function getIcon(type: string, status: TaskStatus) {
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5" />;
  if (status === 'cancelled') return <X className="h-5 w-5" />;
  if (type === 'clipboard') return <ClipboardList className="h-5 w-5" />;
  if (type === 'clock') return <Clock className="h-5 w-5" />;
  return <CheckCircle2 className="h-5 w-5" />;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'pending', label: '待处理' },
  { value: 'in-progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function Tasks() {
  const navigate = useNavigate();
  const [tasks, setTasksState] = useState<Task[]>(() => getTasks());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('pending');
  const [newIconType, setNewIconType] = useState<'clipboard' | 'clock' | 'check'>('clipboard');

  const refreshTasks = () => setTasksState(getTasks());

  const handleUpdateStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(updateTask(id, { status: newStatus }));
    refreshTasks();
    setSelectedTask(null);
  };

  /** 将 time 输入值 HH:mm 转为 "08:30 AM" 格式 */
  const formatTimeDisplay = (hhmm: string): string => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm || '—';
    const [h, m] = hhmm.split(':').map(Number);
    const h12 = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    addTask({
      title,
      time: formatTimeDisplay(newTime) || '—',
      location: newLocation.trim() || '—',
      status: newStatus,
      iconType: newIconType,
    });
    refreshTasks();
    setNewTitle('');
    setNewTime('');
    setNewLocation('');
    setNewStatus('pending');
    setNewIconType('clipboard');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    refreshTasks();
    setSelectedTask(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe px-4 py-3 flex items-center">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors mr-2">
          <ChevronLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">任务列表</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24 no-scrollbar space-y-4">
        {/* 添加任务 */}
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-blue-600 font-semibold"
          >
            <Plus className="h-5 w-5" />
            {showAddForm ? '收起' : '添加任务'}
          </button>
          {showAddForm && (
            <div className="px-4 pb-4 pt-0 border-t border-slate-100 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="任务名称（必填）"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <div>
                <label className="block text-slate-500 text-sm mb-1">时间</label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="地点，如 4楼"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <span className="text-slate-500 text-sm w-full">状态</span>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setNewStatus(opt.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium',
                      newStatus === opt.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAdd}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm"
              >
                添加
              </button>
            </div>
          )}
        </section>

        {/* 任务列表 */}
        <section>
          <h3 className="text-slate-900 font-bold text-lg mb-3">全部任务</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={cn(
                  'bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform',
                  (task.status === 'completed' || task.status === 'cancelled') && 'opacity-70'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center border shrink-0', getIconStyles(task.status))}>
                    {getIcon(task.iconType, task.status)}
                  </div>
                  <div>
                    <p className={cn('font-semibold text-slate-800 text-base leading-none', (task.status === 'completed' || task.status === 'cancelled') && 'line-through')}>
                      {task.title}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">{task.time} — {task.location}</p>
                  </div>
                </div>
                <span className={cn('px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider shrink-0', getStatusBadgeStyles(task.status))}>
                  {getStatusText(task.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />

      {/* 更新状态 / 删除 弹窗 */}
      {selectedTask && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-t-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-lg">更新任务状态</h3>
              <button type="button" onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="font-semibold text-slate-800 text-base mb-1">{selectedTask.title}</p>
              <p className="text-base text-slate-500 mb-6">{selectedTask.time} — {selectedTask.location}</p>
              <div className="space-y-3">
                {selectedTask.status !== 'completed' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTask.id, 'completed')}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    标记为已完成
                  </button>
                )}
                {selectedTask.status !== 'in-progress' && selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTask.id, 'in-progress')}
                    className="w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    设为进行中
                  </button>
                )}
                {selectedTask.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedTask.id, 'cancelled')}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    取消任务
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(selectedTask.id)}
                  className="w-full py-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl font-bold text-sm"
                >
                  删除任务
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
