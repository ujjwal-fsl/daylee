import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Category,
  RepeatRule,
  Task,
  User,
  UserSettings,
  ACCENT_COLORS,
  DEFAULT_CATEGORIES,
} from './types';
import {
  addDays,
  getTodayDateString,
  isTaskScheduledForDate,
  isToday,
} from './utils/dateUtils';
import {
  DEFAULT_USER_SETTINGS,
  getStoredCategories,
  getStoredSettings,
  getStoredTasks,
  getStoredUser,
  getStoredHasCreatedTask,
  setStoredHasCreatedTask,
  setStoredCategories,
  setStoredSettings,
  setStoredTasks,
  setStoredUser,
  subscribeToSync,
  getInitialTasks,
  clearAllStoredUserData,
} from './utils/storage';
import {
  onAuthStatusChanged,
  logoutFirebase,
} from './services/firebase';
import {
  fetchUserNotebook,
  saveUserNotebook,
  subscribeToUserNotebook,
  syncUserProfile,
  fetchUserProfile,
} from './services/firestoreSync';
import { NotebookBackground } from './components/NotebookBackground';
import { NotebookNavbar } from './components/NotebookNavbar';
import { DateHeader } from './components/DateHeader';
import { SearchBar } from './components/SearchBar';
import { SearchResultsList } from './components/SearchResultsList';
import { CategoryChips } from './components/CategoryChips';
import { TaskInput } from './components/TaskInput';
import { TaskItem } from './components/TaskItem';
import { EmptyNotebookState } from './components/EmptyNotebookState';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { UndoSnackbar } from './components/UndoSnackbar';
import { OfflineBanner } from './components/OfflineBanner';
import { LandingPage } from './components/LandingPage';

export default function App() {
  // Persistent core state - new users start unauthenticated on landing page
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [settings, setSettings] = useState<UserSettings>(() => getStoredSettings());
  const [categories, setCategories] = useState<Category[]>(() => getStoredCategories());
  const [tasks, setTasks] = useState<Task[]>(() => getStoredTasks());
  const [hasCreatedFirstTask, setHasCreatedFirstTask] = useState<boolean>(() => {
    const storedUser = getStoredUser();
    const stored = getStoredHasCreatedTask(storedUser?.id);
    const storedTasks = getStoredTasks();
    return stored || storedTasks.length > 0;
  });

  // View state: landing page for new users, notebook for logged-in or guest users
  const [currentView, setCurrentView] = useState<'notebook' | 'landing'>(() => {
    return getStoredUser() ? 'notebook' : 'landing';
  });
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString);
  const [pageDirection, setPageDirection] = useState<number>(0); // -1 for prev, 1 for next

  // Modals & UX state
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [selectedInputCategoryId, setSelectedInputCategoryId] = useState<string>(() => {
    const cats = getStoredCategories();
    return cats[0]?.id || 'cat-study';
  });

  const [deletedTask, setDeletedTask] = useState<Task | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Connectivity state (Section 6 & 14 Offline Support)
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const [syncTimestamp, setSyncTimestamp] = useState<number>(Date.now);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Active UID tracking to prevent cross-account async write leaks and race conditions
  const activeUidRef = useRef<string | null>(user?.id || null);
  useEffect(() => {
    activeUidRef.current = user?.id || null;
  }, [user]);

  // Pending write ref for debounced text editing (400ms)
  const pendingDebouncedWriteRef = useRef<{
    timerId: ReturnType<typeof setTimeout> | null;
    uid: string;
    payload: {
      tasks: Task[];
      categories: Category[];
      settings: UserSettings;
      hasCreatedFirstTask: boolean;
    };
  } | null>(null);

  // Flush any pending debounced write immediately
  const flushPendingWrite = useCallback(() => {
    if (pendingDebouncedWriteRef.current) {
      const { timerId, uid, payload } = pendingDebouncedWriteRef.current;
      if (timerId) clearTimeout(timerId);
      pendingDebouncedWriteRef.current = null;

      if (uid && uid === activeUidRef.current && uid !== 'guest_student') {
        saveUserNotebook(uid, payload).then((ts) => {
          if (ts) setSyncTimestamp(ts);
        });
      }
    }
  }, []);

  // Cancel any pending debounced write (e.g. on account switch or logout)
  const cancelPendingWrite = useCallback(() => {
    if (pendingDebouncedWriteRef.current) {
      if (pendingDebouncedWriteRef.current.timerId) {
        clearTimeout(pendingDebouncedWriteRef.current.timerId);
      }
      pendingDebouncedWriteRef.current = null;
    }
  }, []);

  // Flush pending writes on window unload/pagehide
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushPendingWrite();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      flushPendingWrite();
    };
  }, [flushPendingWrite]);

  // Online / Offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cross-tab real-time sync subscription (Section 6 Cloud Features & Acceptance Criteria)
  useEffect(() => {
    const unsubscribe = subscribeToSync((type) => {
      if (type === 'tasks') {
        setTasks(getStoredTasks());
      } else if (type === 'categories') {
        setCategories(getStoredCategories());
      } else if (type === 'settings') {
        setSettings(getStoredSettings());
      } else if (type === 'user') {
        setUser(getStoredUser());
      }
      setSyncTimestamp(Date.now());
    });

    return unsubscribe;
  }, []);

  // Helper to push updates to Firestore for persistent cloud sync with optional 400ms debounce
  const pushToServer = useCallback(
    (
      updatedTasks?: Task[],
      updatedCategories?: Category[],
      updatedSettings?: UserSettings,
      options: { debounce?: boolean } = {}
    ) => {
      if (!user || user.isGuest) return;
      const targetUid = user.id;
      const currentTasks = updatedTasks || tasks;
      const currentCats = updatedCategories || categories;
      const currentSets = updatedSettings || settings;
      const hasCreated = hasCreatedFirstTask || currentTasks.length > 0;

      const payload = {
        tasks: currentTasks,
        categories: currentCats,
        settings: currentSets,
        hasCreatedFirstTask: hasCreated,
      };

      if (options.debounce) {
        if (pendingDebouncedWriteRef.current?.timerId) {
          clearTimeout(pendingDebouncedWriteRef.current.timerId);
        }

        const timerId = setTimeout(() => {
          if (activeUidRef.current === targetUid) {
            saveUserNotebook(targetUid, payload).then((ts) => {
              if (ts) setSyncTimestamp(ts);
            });
          }
          pendingDebouncedWriteRef.current = null;
        }, 400);

        pendingDebouncedWriteRef.current = {
          timerId,
          uid: targetUid,
          payload,
        };
      } else {
        flushPendingWrite();
        saveUserNotebook(targetUid, payload).then((ts) => {
          if (ts) setSyncTimestamp(ts);
        });
      }
    },
    [user, tasks, categories, settings, hasCreatedFirstTask, flushPendingWrite]
  );

  // Authoritative Firebase Authentication state listener & real-time Firestore sync
  useEffect(() => {
    let unsubscribeNotebook: (() => void) | null = null;

    const unsubscribeAuth = onAuthStatusChanged(async (fbUser) => {
      // Cancel pending writes from previous user session to avoid writing into wrong notebook
      cancelPendingWrite();

      if (fbUser) {
        const photo = fbUser.photoURL || fbUser.providerData?.[0]?.photoURL || '';
        const authenticatedUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Daylee User',
          email: fbUser.email || '',
          avatar: photo || undefined,
          isGuest: false,
        };

        activeUidRef.current = fbUser.uid;
        setUser(authenticatedUser);
        setStoredUser(authenticatedUser);
        setCurrentView('notebook');
        syncUserProfile(authenticatedUser);

        // If photo was not provided by auth provider, restore saved avatar from Firestore if present
        if (!photo) {
          fetchUserProfile(fbUser.uid).then((savedProfile) => {
            if (savedProfile?.avatar && activeUidRef.current === fbUser.uid) {
              const updatedUser: User = { ...authenticatedUser, avatar: savedProfile.avatar };
              setUser(updatedUser);
              setStoredUser(updatedUser);
            }
          });
        }

        // Fix 2: Immediately clear previous account's notebook from UI to prevent ghosting
        setTasks([]);
        setStoredTasks([]);
        setCategories(DEFAULT_CATEGORIES);
        setStoredCategories(DEFAULT_CATEGORIES);
        setSettings(DEFAULT_USER_SETTINGS);
        setStoredSettings(DEFAULT_USER_SETTINGS);
        setHasCreatedFirstTask(false);
        setCloudSyncError(null);

        // Fetch initial notebook document from Firestore
        try {
          const fetchResult = await fetchUserNotebook(fbUser.uid);

          // Ensure active user hasn't changed while network request was in flight
          if (activeUidRef.current !== fbUser.uid) {
            return;
          }

          if (fetchResult.status === 'found') {
            // Existing user: load their saved tasks, categories, and settings
            const docData = fetchResult.data;
            const loadedTasks = docData.tasks || [];
            setTasks(loadedTasks);
            setStoredTasks(loadedTasks);

            if (docData.categories && docData.categories.length > 0) {
              setCategories(docData.categories);
              setStoredCategories(docData.categories);
            }
            if (docData.settings) {
              setSettings(docData.settings);
              setStoredSettings(docData.settings);
            }

            const hasCreated = Boolean(docData.hasCreatedFirstTask || loadedTasks.length > 0);
            setHasCreatedFirstTask(hasCreated);
            setStoredHasCreatedTask(hasCreated, fbUser.uid);
            setSyncTimestamp(docData.updatedAt || Date.now());
            setCloudSyncError(null);
          } else if (fetchResult.status === 'not_found') {
            // Fix 1 & 2: Genuinely brand new account confirmed by Firestore (snap.exists() === false).
            // Initialize with pristine canonical defaults (DEFAULT_CATEGORIES, DEFAULT_USER_SETTINGS),
            // strictly ignoring any modified guest state!
            setTasks([]);
            setStoredTasks([]);
            setCategories(DEFAULT_CATEGORIES);
            setStoredCategories(DEFAULT_CATEGORIES);
            setSettings(DEFAULT_USER_SETTINGS);
            setStoredSettings(DEFAULT_USER_SETTINGS);
            setHasCreatedFirstTask(false);
            setStoredHasCreatedTask(false, fbUser.uid);

            await saveUserNotebook(fbUser.uid, {
              tasks: [],
              categories: DEFAULT_CATEGORIES,
              settings: DEFAULT_USER_SETTINGS,
              hasCreatedFirstTask: false,
            });
            setSyncTimestamp(Date.now());
            setCloudSyncError(null);
          } else {
            // Fix 1: Read failure (network offline, permission error, quota).
            // NEVER overwrite remote data with empty defaults!
            console.error('Failed to load user notebook from cloud:', fetchResult.error);
            setCloudSyncError('Could not sync with cloud. Please check your connection.');
          }
        } catch (e) {
          console.warn('Initial Firestore notebook load error:', e);
          setCloudSyncError('Could not sync with cloud. Please check your connection.');
        }

        // Set up real-time multi-device subscription (instant updates across phone/laptop/tablet)
        if (unsubscribeNotebook) unsubscribeNotebook();
        unsubscribeNotebook = subscribeToUserNotebook(fbUser.uid, (remoteDoc) => {
          if (activeUidRef.current !== fbUser.uid) return;
          if (remoteDoc && remoteDoc.isInitialized) {
            setTasks(remoteDoc.tasks);
            setStoredTasks(remoteDoc.tasks);
            if (remoteDoc.categories && remoteDoc.categories.length > 0) {
              setCategories(remoteDoc.categories);
              setStoredCategories(remoteDoc.categories);
            }
            if (remoteDoc.settings) {
              setSettings(remoteDoc.settings);
              setStoredSettings(remoteDoc.settings);
            }
            const hasCreated = Boolean(remoteDoc.hasCreatedFirstTask || remoteDoc.tasks.length > 0);
            setHasCreatedFirstTask(hasCreated);
            setStoredHasCreatedTask(hasCreated, fbUser.uid);
            setSyncTimestamp(remoteDoc.updatedAt || Date.now());
            setCloudSyncError(null);
          }
        });
      } else {
        // Not authenticated via Firebase
        activeUidRef.current = null;
        if (unsubscribeNotebook) {
          unsubscribeNotebook();
          unsubscribeNotebook = null;
        }

        // If not in local guest mode, redirect to landing view
        const stored = getStoredUser();
        if (!stored?.isGuest) {
          setUser(null);
          setStoredUser(null);
          setCurrentView('landing');
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotebook) unsubscribeNotebook();
    };
  }, [cancelPendingWrite, flushPendingWrite]);

  // Recoverable cloud sync retry handler
  const handleRetrySync = useCallback(async () => {
    if (!user || user.isGuest) return;
    setCloudSyncError(null);
    try {
      const fetchResult = await fetchUserNotebook(user.id);
      if (activeUidRef.current !== user.id) return;

      if (fetchResult.status === 'found') {
        const docData = fetchResult.data;
        const loadedTasks = docData.tasks || [];
        setTasks(loadedTasks);
        setStoredTasks(loadedTasks);

        if (docData.categories && docData.categories.length > 0) {
          setCategories(docData.categories);
          setStoredCategories(docData.categories);
        }
        if (docData.settings) {
          setSettings(docData.settings);
          setStoredSettings(docData.settings);
        }

        const hasCreated = Boolean(docData.hasCreatedFirstTask || loadedTasks.length > 0);
        setHasCreatedFirstTask(hasCreated);
        setStoredHasCreatedTask(hasCreated, user.id);
        setSyncTimestamp(docData.updatedAt || Date.now());
        setCloudSyncError(null);
      } else if (fetchResult.status === 'error') {
        setCloudSyncError('Could not sync with cloud. Please check your connection.');
      }
    } catch {
      setCloudSyncError('Could not sync with cloud. Please check your connection.');
    }
  }, [user]);

  // Active accent color configuration
  const currentAccent =
    ACCENT_COLORS.find((c) => c.id === settings.accentColorId) || ACCENT_COLORS[0];

  // Date Navigation with page slide direction and pending write flush
  const handlePrevDay = () => {
    flushPendingWrite();
    setPageDirection(-1);
    setCurrentDate((prev) => addDays(prev, -1));
  };

  const handleNextDay = () => {
    flushPendingWrite();
    setPageDirection(1);
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleSelectToday = () => {
    flushPendingWrite();
    const today = getTodayDateString();
    setPageDirection(today > currentDate ? 1 : -1);
    setCurrentDate(today);
  };

  const handleJumpToDate = (targetDate: string) => {
    flushPendingWrite();
    setPageDirection(targetDate > currentDate ? 1 : -1);
    setCurrentDate(targetDate);
  };

  // Task Handlers
  const handleAddTask = (text: string, categoryId: string, repeatRule?: RepeatRule) => {
    if (isOffline) return;

    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text,
      categoryId,
      createdDate: currentDate,
      repeatRule,
      completedDates: [],
      order: tasks.length,
      userId: user?.id || 'guest',
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    setStoredTasks(updated);
    if (!hasCreatedFirstTask) {
      setHasCreatedFirstTask(true);
      setStoredHasCreatedTask(true, user?.id);
    }
    pushToServer(updated, categories, settings);
  };

  const handleToggleComplete = (taskId: string, targetDate: string = currentDate) => {
    if (isOffline) return;

    const updated = tasks.map((t) => {
      if (t.id !== taskId) return t;

      const isCompletedOnDate = t.completedDates.includes(targetDate);
      const newCompletedDates = isCompletedOnDate
        ? t.completedDates.filter((d) => d !== targetDate)
        : [...t.completedDates, targetDate];

      return {
        ...t,
        completedDates: newCompletedDates,
      };
    });

    setTasks(updated);
    setStoredTasks(updated);
    pushToServer(updated, categories, settings);
  };

  // Task inline editing with 400ms debounce to prevent Firestore write storms
  const handleEditTask = (taskId: string, newText: string) => {
    if (isOffline) return;

    const updated = tasks.map((t) => (t.id === taskId ? { ...t, text: newText } : t));
    setTasks(updated);
    setStoredTasks(updated);
    pushToServer(updated, categories, settings, { debounce: true });
  };

  const handleDeleteTask = (taskId: string) => {
    if (isOffline) return;

    const target = tasks.find((t) => t.id === taskId);
    if (!target) return;

    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    setStoredTasks(updated);
    setDeletedTask(target); // Opens 5s undo snackbar
    pushToServer(updated, categories, settings);
  };

  const handleUndoDelete = () => {
    if (!deletedTask) return;

    const updated = [...tasks, deletedTask];
    setTasks(updated);
    setStoredTasks(updated);
    setDeletedTask(null);
    pushToServer(updated, categories, settings);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, overId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === overId) return;

    const sourceIndex = tasks.findIndex((t) => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex((t) => t.id === overId);

    if (sourceIndex < 0 || targetIndex < 0) return;

    const newTasks = [...tasks];
    const [moved] = newTasks.splice(sourceIndex, 1);
    newTasks.splice(targetIndex, 0, moved);

    // Update order values
    const reordered = newTasks.map((t, idx) => ({ ...t, order: idx }));
    setTasks(reordered);
    setStoredTasks(reordered);
    pushToServer(reordered, categories, settings);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  // Category handlers
  const handleAddCategory = (name: string, color: string) => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      name,
      color,
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    setStoredCategories(updated);
    pushToServer(tasks, updated, settings);
  };

  const handleRenameCategory = (id: string, newName: string) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, name: newName } : c));
    setCategories(updated);
    setStoredCategories(updated);
    pushToServer(tasks, updated, settings);
  };

  const handleDeleteCategory = (idToDelete: string, reassignToId: string) => {
    // Reassign all affected tasks
    const updatedTasks = tasks.map((t) =>
      t.categoryId === idToDelete ? { ...t, categoryId: reassignToId } : t
    );
    setTasks(updatedTasks);
    setStoredTasks(updatedTasks);

    // Remove category
    const updatedCategories = categories.filter((c) => c.id !== idToDelete);
    setCategories(updatedCategories);
    setStoredCategories(updatedCategories);

    if (selectedInputCategoryId === idToDelete) {
      setSelectedInputCategoryId(reassignToId);
    }
    if (activeCategoryFilter === idToDelete) {
      setActiveCategoryFilter(null);
    }
    pushToServer(updatedTasks, updatedCategories, settings);
  };

  // Settings & User Handlers
  const handleUpdateSettings = (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setStoredSettings(updated);
    pushToServer(tasks, categories, updated);
  };

  const handleFocusTaskInput = useCallback(() => {
    const inputEl = document.getElementById('task-writing-input') as HTMLInputElement | null;
    if (inputEl) {
      inputEl.focus();
      inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser);
    setCurrentView('notebook');
  };

  const handleEnterGuestDemo = () => {
    // Cancel pending writes and isolate state
    cancelPendingWrite();
    activeUidRef.current = 'guest_student';

    // Clean all previous user data to prevent session or task inheritance
    clearAllStoredUserData();

    const guestUser: User = {
      id: 'guest_student',
      name: 'Student Guest',
      email: 'guest@student.daylee',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isGuest: true,
    };

    // Demonstration guest mode loads sample tasks and clean canonical categories/settings
    const sample = getInitialTasks();
    setTasks(sample);
    setStoredTasks(sample);
    setCategories(DEFAULT_CATEGORIES);
    setStoredCategories(DEFAULT_CATEGORIES);
    setSettings(DEFAULT_USER_SETTINGS);
    setStoredSettings(DEFAULT_USER_SETTINGS);
    setHasCreatedFirstTask(true);
    setStoredHasCreatedTask(true, 'guest_student');
    setUser(guestUser);
    setStoredUser(guestUser);
    setCloudSyncError(null);
    setCurrentView('notebook');
  };

  const handleLogout = async () => {
    flushPendingWrite();
    cancelPendingWrite();
    activeUidRef.current = null;

    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Firebase signOut error', e);
    }
    clearAllStoredUserData();
    setUser(null);
    setTasks([]);
    setStoredTasks([]);
    setCategories(DEFAULT_CATEGORIES);
    setStoredCategories(DEFAULT_CATEGORIES);
    setSettings(DEFAULT_USER_SETTINGS);
    setStoredSettings(DEFAULT_USER_SETTINGS);
    setHasCreatedFirstTask(false);
    setCloudSyncError(null);
    setIsSettingsModalOpen(false);
    setCurrentView('landing');
  };

  const handleSelectSearchTask = (task: Task) => {
    flushPendingWrite();
    const targetDate = task.createdDate || currentDate;
    setPageDirection(targetDate >= currentDate ? 1 : -1);
    setCurrentDate(targetDate);
    setHighlightedTaskId(task.id);
    setSearchQuery(''); // Clears search box to return to normal notebook view on that date
    setTimeout(() => {
      setHighlightedTaskId(null);
    }, 3000);
  };

  // Filter tasks scheduled for current notebook date (Section 8.10 Virtual notebook page)
  const scheduledTasks = tasks.filter((task) => isTaskScheduledForDate(task, currentDate));

  // Global search filtering across the entire notebook (Requirement 2):
  // "When the user enters a search term, search through all tasks stored for the authenticated user across all dates, not just the currently displayed day."
  const isSearchActive = Boolean(searchQuery.trim());

  const globalSearchMatches = useMemo(() => {
    if (!isSearchActive) return [];
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter((task) => {
      if (activeCategoryFilter && task.categoryId !== activeCategoryFilter) {
        return false;
      }
      return task.text.toLowerCase().includes(q);
    });
  }, [tasks, searchQuery, activeCategoryFilter, isSearchActive]);

  // Apply category filter for normal single-day view
  const visibleTasks = scheduledTasks.filter((task) => {
    if (activeCategoryFilter && task.categoryId !== activeCategoryFilter) {
      return false;
    }
    return true;
  });

  // Calculate stats for current day's notebook
  const completedCount = scheduledTasks.filter((t) =>
    t.completedDates.includes(currentDate)
  ).length;

  if (currentView === 'landing') {
    return (
      <>
        <LandingPage
          onLoginSuccess={handleAuthSuccess}
          onEnterGuestDemo={handleEnterGuestDemo}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F3EC] text-[#2D2B28] flex flex-col font-sans selection:bg-[#EAE1D0]">
      {/* Offline notification banner */}
      <OfflineBanner isOffline={isOffline} />

      {/* Recoverable Cloud sync error notification */}
      {cloudSyncError && !isOffline && (
        <div className="w-full bg-[#FAF0ED] border-b border-[#ECC4B8] py-2 px-4 text-center text-xs text-[#A05244] flex items-center justify-center gap-3 select-none">
          <span>{cloudSyncError}</span>
          <button
            type="button"
            onClick={handleRetrySync}
            className="underline underline-offset-2 font-medium hover:text-[#843B2E] cursor-pointer"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <NotebookNavbar
        user={user}
        settings={settings}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAuth={() => {
          setAuthModalMode('login');
          setIsAuthModalOpen(true);
        }}
        onGoHome={() => setCurrentView('landing')}
        isOffline={isOffline}
        onToggleOfflineDemo={() => setIsOffline(!isOffline)}
        syncTimestamp={syncTimestamp}
      />

      {/* Main Notebook Canvas with Paper Metaphor */}
      <main className="flex-1 w-full px-3 sm:px-6 flex flex-col items-center">
        <NotebookBackground paperStyle={settings.paperStyle}>
          {/* Section 8.8 Search Bar at top of notebook */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            accentColor={currentAccent.hex}
          />

          {/* Section 9.3 Category Filter Chips */}
          <CategoryChips
            categories={categories}
            activeCategoryId={activeCategoryFilter}
            onSelectCategory={setActiveCategoryFilter}
            onOpenManager={() => setIsCategoryModalOpen(true)}
            accentColor={currentAccent.hex}
          />

          {/* Section 8.2 & 8.3 Greeting and Date Header with Doodle Arrows */}
          <DateHeader
            currentDate={currentDate}
            onPrevDate={handlePrevDay}
            onNextDate={handleNextDay}
            onSelectToday={handleSelectToday}
            onDateChange={handleJumpToDate}
            font={settings.font}
            accentColor={currentAccent.hex}
          />

          {/* Section 8.4 Task Input Writing Line on Paper */}
          <TaskInput
            currentDate={currentDate}
            categories={categories}
            selectedCategoryId={selectedInputCategoryId}
            onSelectCategory={setSelectedInputCategoryId}
            onAddTask={handleAddTask}
            font={settings.font}
            accentColor={currentAccent.hex}
            isOffline={isOffline}
          />

          {isSearchActive ? (
            <SearchResultsList
              matchingTasks={globalSearchMatches}
              categories={categories}
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              onSelectTask={handleSelectSearchTask}
              onToggleComplete={handleToggleComplete}
              font={settings.font}
              accentColor={currentAccent.hex}
              isOffline={isOffline}
            />
          ) : (
            <>
              {/* Animated Page Slide Container (Section 7 & 8.3 Paper Slide Animation) */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={currentDate}
                  initial={{
                    opacity: 0,
                    x: pageDirection * 20,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -pageDirection * 20,
                  }}
                  transition={{
                    duration: 0.22,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="flex-1 flex flex-col mt-1"
                >
                  {/* Task list or empty state */}
                  {visibleTasks.length === 0 ? (
                    <EmptyNotebookState
                      font={settings.font}
                      isSearchActive={false}
                      searchQuery=""
                      onClearSearch={() => setSearchQuery('')}
                      isWelcomeState={
                        !hasCreatedFirstTask &&
                        tasks.length === 0 &&
                        !activeCategoryFilter
                      }
                      accentColor={currentAccent.hex}
                      onAddFirstTask={handleFocusTaskInput}
                    />
                  ) : (
                    <div className="divide-y divide-transparent space-y-0.5">
                      {visibleTasks.map((task) => {
                        const category = categories.find((c) => c.id === task.categoryId);
                        const isCompleted = task.completedDates.includes(currentDate);

                        return (
                          <TaskItem
                            key={task.id}
                            task={task}
                            category={category}
                            isCompleted={isCompleted}
                            onToggleComplete={handleToggleComplete}
                            onEdit={handleEditTask}
                            onDelete={handleDeleteTask}
                            font={settings.font}
                            accentColor={currentAccent.hex}
                            isOffline={isOffline}
                            isHighlighted={highlightedTaskId === task.id}
                            isDragging={draggedTaskId === task.id}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Gentle Daily Progress Indicator */}
              {scheduledTasks.length > 0 && (
                <div className="mt-8 pt-4 border-t border-[#EAE3D5]/80 flex items-center justify-between text-xs text-[#8E877B] select-none">
                  <span className="italic font-serif">
                    {completedCount === scheduledTasks.length && scheduledTasks.length > 0
                      ? 'All tasks completed for today ✨'
                      : `${completedCount} of ${scheduledTasks.length} completed`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-20 sm:w-28 h-1.5 rounded-full bg-[#EAE3D5] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${(completedCount / scheduledTasks.length) * 100}%`,
                          backgroundColor: currentAccent.hex,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </NotebookBackground>
      </main>

      {/* Modals & Overlays */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        tasks={tasks}
        onAddCategory={handleAddCategory}
        onRenameCategory={handleRenameCategory}
        onDeleteCategory={handleDeleteCategory}
        accentColor={currentAccent.hex}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        user={user}
        onLogout={handleLogout}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Section 8.7 & 14 Undo Snackbar */}
      <UndoSnackbar
        deletedTask={deletedTask}
        onUndo={handleUndoDelete}
        onDismiss={() => setDeletedTask(null)}
      />
    </div>
  );
}
