import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { getAuthToken } from '@/src/lib/auth';
import {
  getTasks,
  getTodayDateKey,
  getCurrentHHmm,
  isTaskDueForReminder,
  markReminderFired,
  hydrateTasksFromServer,
  type Task,
} from '@/src/lib/tasks';

const POLL_MS = 25_000;

/**
 * 全局：当系统时间到达（或已超过）任务的提醒时间时，弹窗提醒（每项每天最多一次）
 */
export default function TaskReminder() {
  const navigate = useNavigate();
  const activeRef = useRef<Task | null>(null);
  const [, bump] = useState(0);

  const tryShowNext = useCallback(() => {
    if (!getAuthToken()) return;
    if (activeRef.current) return;
    const today = getTodayDateKey();
    const now = getCurrentHHmm();
    const due = getTasks()
      .filter((t) => isTaskDueForReminder(t, today, now))
      .sort((a, b) => (a.reminderHHmm || '').localeCompare(b.reminderHHmm || ''));
    const next = due[0];
    if (!next) return;
    markReminderFired(next.id, today);
    activeRef.current = next;
    bump((n) => n + 1);
  }, []);

  const dismiss = useCallback(() => {
    activeRef.current = null;
    bump((n) => n + 1);
    setTimeout(() => tryShowNext(), 300);
  }, [tryShowNext]);

  useEffect(() => {
    void hydrateTasksFromServer();
    tryShowNext();
    const id = setInterval(tryShowNext, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tryShowNext();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [tryShowNext]);

  const task = activeRef.current;

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="task-reminder-title"
        aria-modal="true"
      >
        <div className="p-5 border-b border-slate-100 flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">任务提醒</p>
            <h2 id="task-reminder-title" className="text-lg font-bold text-slate-900 mt-1 leading-snug">
              {task.title}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              已到提醒时间 <span className="font-mono font-semibold text-slate-700">{task.reminderHHmm}</span>
              {task.location && task.location !== '—' ? ` · ${task.location}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              dismiss();
              navigate('/tasks');
            }}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm"
          >
            前往任务列表
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
}

