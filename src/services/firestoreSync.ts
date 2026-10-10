import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Category, Task, User, UserSettings } from '../types';

export interface NotebookDocument {
  tasks: Task[];
  categories: Category[];
  settings: UserSettings;
  hasCreatedFirstTask: boolean;
  isInitialized: boolean;
  updatedAt: number;
}

export type FetchNotebookResult =
  | { status: 'found'; data: NotebookDocument }
  | { status: 'not_found' }
  | { status: 'error'; error: unknown };

/**
 * Recursively remove keys with undefined values from objects/arrays to guarantee
 * safe Firestore serialization without dropping valid values like false, 0, "", or null.
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof value === 'object' && value !== null) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined) {
        cleaned[k] = sanitizeForFirestore(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

/**
 * Sync user profile to Firestore users/{uid}
 * Avoids overwriting an existing valid profile image with an empty value
 */
export async function syncUserProfile(user: User): Promise<void> {
  if (!user || user.isGuest) return;
  try {
    const userRef = doc(db, 'users', user.id);
    const profilePayload: Record<string, any> = {
      uid: user.id,
      name: user.name,
      email: user.email,
      lastActiveAt: Date.now(),
    };
    if (user.avatar && user.avatar.trim()) {
      profilePayload.avatar = user.avatar.trim();
    }
    await setDoc(userRef, profilePayload, { merge: true });
  } catch (err) {
    console.warn('Failed to sync user profile document:', err);
  }
}

/**
 * Fetch stored user profile from Firestore users/{uid} to restore avatar if not present from auth provider
 */
export async function fetchUserProfile(
  uid: string
): Promise<{ avatar?: string; name?: string } | null> {
  if (!uid || uid === 'guest_student') return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        avatar:
          typeof data.avatar === 'string' && data.avatar.trim()
            ? data.avatar.trim()
            : undefined,
        name: typeof data.name === 'string' ? data.name : undefined,
      };
    }
    return null;
  } catch (err) {
    console.warn('Failed to fetch user profile:', err);
    return null;
  }
}

/**
 * Fetch notebook document for an authenticated user.
 * Explicitly distinguishes between nonexistent documents ('not_found')
 * and read/network/permission failures ('error') so existing data is never wiped.
 */
export async function fetchUserNotebook(uid: string): Promise<FetchNotebookResult> {
  if (!uid || uid === 'guest_student') {
    return { status: 'not_found' };
  }

  try {
    const docRef = doc(db, 'users', uid, 'notebook', 'main');
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { status: 'not_found' };
    }

    const data = snap.data();
    return {
      status: 'found',
      data: {
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        settings: data.settings || null,
        hasCreatedFirstTask: Boolean(data.hasCreatedFirstTask),
        isInitialized: Boolean(data.isInitialized),
        updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
      },
    };
  } catch (err) {
    console.error('Error fetching Firestore notebook:', err);
    return { status: 'error', error: err };
  }
}

/**
 * Save notebook document for an authenticated user with timestamp safeguard and serialization sanitization
 */
export async function saveUserNotebook(
  uid: string,
  payload: {
    tasks: Task[];
    categories: Category[];
    settings: UserSettings;
    hasCreatedFirstTask: boolean;
  }
): Promise<number> {
  if (!uid || uid === 'guest_student') return Date.now();

  const now = Date.now();
  try {
    const docRef = doc(db, 'users', uid, 'notebook', 'main');
    const sanitized = sanitizeForFirestore({
      tasks: payload.tasks,
      categories: payload.categories,
      settings: payload.settings,
      hasCreatedFirstTask: payload.hasCreatedFirstTask,
      isInitialized: true,
      updatedAt: now,
    });

    await setDoc(docRef, sanitized, { merge: true });
    return now;
  } catch (err) {
    console.error('Error saving Firestore notebook:', err);
    return now;
  }
}

/**
 * Subscribe to real-time updates for multi-device sync
 * Safeguarded against local write echoes
 */
export function subscribeToUserNotebook(
  uid: string,
  onRemoteChange: (notebook: NotebookDocument) => void
): Unsubscribe {
  if (!uid || uid === 'guest_student') {
    return () => {};
  }

  const docRef = doc(db, 'users', uid, 'notebook', 'main');

  return onSnapshot(
    docRef,
    (snapshot) => {
      // Ignore local pending writes to avoid write echoes and race conditions
      if (snapshot.metadata.hasPendingWrites) {
        return;
      }

      if (snapshot.exists()) {
        const data = snapshot.data();
        onRemoteChange({
          tasks: Array.isArray(data.tasks) ? data.tasks : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          settings: data.settings || null,
          hasCreatedFirstTask: Boolean(data.hasCreatedFirstTask),
          isInitialized: Boolean(data.isInitialized),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
        });
      }
    },
    (error) => {
      console.warn('Firestore real-time subscription error:', error);
    }
  );
}
