import { apiGet, apiPost } from './api';
import { getAuthToken } from './auth';
export type TaskStatus = 'in-progress' | 'pending' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  time: string;
  location: string;
  status: TaskStatus;
  iconType: 'clipboard' | 'clock' | 'check';
  /** 今日到点提醒，24 小时制 HH:mm */
  reminderHHmm: string;
  /** 是否启用到点弹窗提醒，默认 true */
  reminderEnabled?: boolean;
}

const STORAGE_KEY = 'medical_assistant_tasks';
const REMINDER_LOG_KEY = 'medical_assistant_task_reminder_log';

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: '晨间查房', time: '08:30 AM', location: '4楼', status: 'in-progress', iconType: 'clipboard', reminderHHmm: '08:30' },
  { id: '2', title: '手术准备', time: '11:00 AM', location: '2号手术室', status: 'pending', iconType: 'clock', reminderHHmm: '11:00' },
  { id: '3', title: '门诊接诊', time: '07:00 AM', location: '201诊室', status: 'completed', iconType: 'check', reminderHHmm: '07:00' },
];

/** 将展示用时间转为 HH:mm */
export function parseDisplayTimeToHHmm(time: string): string {
  const t = (time || '').trim();
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return '09:00';
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (!ap && h > 23) h = h % 24;
  return `${String(Math.min(23, Math.max(0, h))).padStart(2, '0')}:${min}`;
}

function normalizeTask(raw: Record<string, unknown>): Task {
  const reminderHHmm =
    typeof raw.reminderHHmm === 'string' && /^\d{2}:\d{2}$/.test(raw.reminderHHmm)
      ? raw.reminderHHmm
      : parseDisplayTimeToHHmm(String(raw.time || ''));
  return {
    id: String(raw.id),
    title: String(raw.title || ''),
    time: String(raw.time || '—'),
    location: String(raw.location || '—'),
    status: (['in-progress', 'pending', 'completed', 'cancelled'].includes(String(raw.status))
      ? raw.status
      : 'pending') as TaskStatus,
    iconType: (['clipboard', 'clock', 'check'].includes(String(raw.iconType)) ? raw.iconType : 'clipboard') as Task['iconType'],
    reminderHHmm,
    reminderEnabled: raw.reminderEnabled === false ? false : undefined,
  };
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TASKS.map((t) => ({ ...t }));
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TASKS.map((t) => ({ ...t }));
    return parsed.map((x) => normalizeTask(x as Record<string, unknown>));
  } catch {
    return DEFAULT_TASKS.map((t) => ({ ...t }));
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function persistTasksToServer(tasks: Task[]): void {
  if (!getAuthToken()) return;
  void apiPost('/api/config/user/tasks', { tasks }).catch((e) => {
    console.warn('Save tasks to server failed:', e);
  });
}

export function getTodayDateKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getCurrentHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function loadReminderLog(): Record<string, string> {
  try {
    const s = localStorage.getItem(REMINDER_LOG_KEY);
    if (!s) return {};
    const o = JSON.parse(s) as Record<string, string>;
    return typeof o === 'object' && o ? o : {};
  } catch {
    return {};
  }
}

export function wasReminderFiredToday(taskId: string, dateKey: string): boolean {
  return loadReminderLog()[taskId] === dateKey;
}

export function markReminderFired(taskId: string, dateKey: string): void {
  const log = loadReminderLog();
  log[taskId] = dateKey;
  localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(log));
}

/** 是否应在当前时刻弹出提醒（未取消/未完成、已启用、已到设定时间、今日尚未提醒） */
export function isTaskDueForReminder(task: Task, dateKey: string, nowHHmm: string): boolean {
  if (task.reminderEnabled === false) return false;
  if (task.status === 'completed' || task.status === 'cancelled') return false;
  const hhmm = task.reminderHHmm || '09:00';
  if (nowHHmm < hhmm) return false;
  if (wasReminderFiredToday(task.id, dateKey)) return false;
  return true;
}

export function getTasks(): Task[] {
  return loadTasks();
}

export function setTasks(tasks: Task[]): Task[] {
  saveTasks(tasks);
  persistTasksToServer(tasks);
  return tasks;
}

export async function hydrateTasksFromServer(): Promise<Task[]> {
  if (!getAuthToken()) return loadTasks();
  try {
    const data = await apiGet<{ tasks?: unknown[] | null }>('/api/config/user/tasks');
    // 未配置过（tasks=null）时，回退到本地默认任务
    if (!Array.isArray(data.tasks) || data.tasks.length === 0) return loadTasks();
    const tasks = data.tasks.map((x) => normalizeTask((x ?? {}) as Record<string, unknown>));
    saveTasks(tasks);
    return tasks;
  } catch {
    return loadTasks();
  }
}

export type NewTaskInput = Omit<Task, 'id' | 'reminderHHmm'> & { reminderHHmm?: string };

export function addTask(task: NewTaskInput): Task {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
  const reminderHHmm =
    task.reminderHHmm && /^\d{2}:\d{2}$/.test(task.reminderHHmm)
      ? task.reminderHHmm
      : parseDisplayTimeToHHmm(task.time);
  const newTask: Task = {
    ...task,
    id,
    reminderHHmm,
    reminderEnabled: task.reminderEnabled === false ? false : undefined,
  };
  const list = loadTasks();
  list.unshift(newTask);
  saveTasks(list);
  persistTasksToServer(list);
  return newTask;
}

export function updateTask(id: string, patch: Partial<Task>): Task[] {
  const list = loadTasks().map((t) => {
    if (t.id !== id) return t;
    let next = { ...t, ...patch } as Task;
    if (patch.reminderEnabled === true) {
      next = { ...t, ...patch };
      delete (next as { reminderEnabled?: boolean }).reminderEnabled;
    }
    if (patch.time && patch.reminderHHmm === undefined) {
      next.reminderHHmm = parseDisplayTimeToHHmm(patch.time);
    }
    return next;
  });
  saveTasks(list);
  persistTasksToServer(list);
  return list;
}

export function deleteTask(id: string): Task[] {
  const list = loadTasks().filter((t) => t.id !== id);
  saveTasks(list);
  persistTasksToServer(list);
  const log = loadReminderLog();
  delete log[id];
  localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(log));
  return list;
}
