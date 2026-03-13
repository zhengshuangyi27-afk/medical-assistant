export type TaskStatus = 'in-progress' | 'pending' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  time: string;
  location: string;
  status: TaskStatus;
  iconType: 'clipboard' | 'clock' | 'check';
}

const STORAGE_KEY = 'medical_assistant_tasks';

const DEFAULT_TASKS: Task[] = [
  { id: '1', title: '晨间查房', time: '08:30 AM', location: '4楼', status: 'in-progress', iconType: 'clipboard' },
  { id: '2', title: '手术准备', time: '11:00 AM', location: '2号手术室', status: 'pending', iconType: 'clock' },
  { id: '3', title: '门诊接诊', time: '07:00 AM', location: '201诊室', status: 'completed', iconType: 'check' },
];

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_TASKS];
    const parsed = JSON.parse(raw) as Task[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_TASKS];
  } catch {
    return [...DEFAULT_TASKS];
  }
}

function saveTasks(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function getTasks(): Task[] {
  return loadTasks();
}

export function setTasks(tasks: Task[]): Task[] {
  saveTasks(tasks);
  return tasks;
}

export function addTask(task: Omit<Task, 'id'>): Task {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
  const newTask: Task = { ...task, id };
  const list = loadTasks();
  list.unshift(newTask);
  saveTasks(list);
  return newTask;
}

export function updateTask(id: string, patch: Partial<Task>): Task[] {
  const list = loadTasks().map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveTasks(list);
  return list;
}

export function deleteTask(id: string): Task[] {
  const list = loadTasks().filter((t) => t.id !== id);
  saveTasks(list);
  return list;
}
