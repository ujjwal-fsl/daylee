import { Category, DEFAULT_CATEGORIES, Task, User, UserSettings } from '../types';
import { getTodayDateString } from './dateUtils';

const STORAGE_KEYS = {
  USER: 'daylee_user_v2',
  TASKS: 'daylee_tasks_v2',
  CATEGORIES: 'daylee_categories_v2',
  SETTINGS: 'daylee_settings_v2',
  HAS_CREATED_TASK: 'daylee_has_created_task_v2',
};

const SYNC_CHANNEL_NAME = 'daylee_broadcast_sync';

// BroadcastChannel for instant cross-tab synchronization
let syncChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

export function subscribeToSync(onSync: (type: 'tasks' | 'categories' | 'settings' | 'user') => void): () => void {
  if (!syncChannel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      onSync(event.data.type);
    }
  };

  syncChannel.addEventListener('message', handler);
  return () => {
    syncChannel?.removeEventListener('message', handler);
  };
}

function broadcastChange(type: 'tasks' | 'categories' | 'settings' | 'user') {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type, timestamp: Date.now() });
    } catch (e) {
      console.warn('Failed to broadcast sync event', e);
    }
  }
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  paperStyle: 'ruled',
  font: 'patrick',
  accentColorId: 'sage',
};

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
    broadcastChange('user');
  } catch (e) {
    console.error('Error saving user to storage', e);
  }
}

export function getStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export function setStoredSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    broadcastChange('settings');
  } catch (e) {
    console.error('Error saving settings to storage', e);
  }
}

export function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function setStoredCategories(categories: Category[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    broadcastChange('categories');
  } catch (e) {
    console.error('Error saving categories to storage', e);
  }
}

export function getInitialTasks(): Task[] {
  const today = getTodayDateString();
  return [
    {
      id: 'task-1',
      text: 'Review Physics Chapter 4 notes & equation summary',
      categoryId: 'cat-study',
      createdDate: today,
      completedDates: [],
      order: 0,
      userId: 'guest_student',
    },
    {
      id: 'task-2',
      text: 'Calculus problem set #3 (Limits & Derivatives)',
      categoryId: 'cat-study',
      createdDate: today,
      completedDates: [],
      order: 1,
      userId: 'guest_student',
      repeatRule: {
        type: 'custom_weekdays',
        weekdays: [1, 3, 5], // Mon, Wed, Fri
        startDate: today,
      },
    },
    {
      id: 'task-3',
      text: 'Read 20 pages of required novel',
      categoryId: 'cat-reading',
      createdDate: today,
      completedDates: [today], // Completed today to showcase satisfying check
      order: 2,
      userId: 'guest_student',
      repeatRule: {
        type: 'daily',
        startDate: today,
      },
    },
    {
      id: 'task-4',
      text: 'Organize study desk & clear clutter',
      categoryId: 'cat-personal',
      createdDate: today,
      completedDates: [],
      order: 3,
      userId: 'guest_student',
    },
    {
      id: 'task-5',
      text: '30-minute evening walk or light stretch',
      categoryId: 'cat-health',
      createdDate: today,
      completedDates: [],
      order: 4,
      userId: 'guest_student',
      repeatRule: {
        type: 'daily',
        startDate: today,
      },
    },
  ];
}

export function getStoredTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setStoredTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    broadcastChange('tasks');
  } catch (e) {
    console.error('Error saving tasks to storage', e);
  }
}

export function getStoredHasCreatedTask(userId?: string): boolean {
  try {
    const key = userId ? `${STORAGE_KEYS.HAS_CREATED_TASK}_${userId}` : STORAGE_KEYS.HAS_CREATED_TASK;
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export function setStoredHasCreatedTask(value: boolean, userId?: string): void {
  try {
    const key = userId ? `${STORAGE_KEYS.HAS_CREATED_TASK}_${userId}` : STORAGE_KEYS.HAS_CREATED_TASK;
    if (value) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.error('Error saving hasCreatedTask to storage', e);
  }
}

/**
 * Cleanly wipe all local notebook storage (used on logout or switching from guest)
 */
export function clearAllStoredUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.HAS_CREATED_TASK);
    localStorage.removeItem('daylee_session_token'); // clean legacy session token if any
  } catch (e) {
    console.warn('Could not clear stored data', e);
  }
}
