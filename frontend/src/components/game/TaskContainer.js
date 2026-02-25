import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTaskComponent } from './taskRegistry';
import { StatsOverlay } from './StatsOverlay';
import { ActionBar } from './ActionBar';
import { SwipeHint } from './SwipeHint';
import { StreakBadge } from './StreakBadge';
import { UsernameButton } from '../profile/UsernameButton';
import { SearchBar } from '../profile/SearchBar';
import { ProfileOverlay } from '../profile/ProfileOverlay';
import { useProfile } from '../../contexts/ProfileContext';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sounds';

export const TaskCard = ({ task, onSuccess, onFail, localAttempts, onCreatorClick, isCreator, onTaskUpdated, onLikeUpdate }) => {
  const [flashState, setFlashState] = useState(null); // 'success' | 'fail' | null
  
  const TaskComponent = getTaskComponent(task?.type);

  const handleSuccess = useCallback(() => {
    setFlashState('success');
    setTimeout(() => {
      setFlashState(null);
      onSuccess();
    }, 100);
  }, [onSuccess]);

  const handleFail = useCallback(() => {
    setFlashState('fail');
    setTimeout(() => {
      setFlashState(null);
      onFail();
    }, 100);
  }, [onFail]);

  if (!task || !TaskComponent) {
    return (
      <div className="task-card flex items-center justify-center" data-testid="loading-task">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className={`task-card task-card--tiktok ${flashState === 'fail' ? 'fail-flash' : ''} ${flashState === 'success' ? 'success-glow' : ''}`}
      data-testid={`task-card-${task.id}`}
    >
      {/* Creator (above title) and task name - top left */}
      <motion.div
        className="task-card__title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {task.created_by_username && (
          <button
            type="button"
            className="task-card__creator task-card__creator--above"
            onClick={() => onCreatorClick?.(task.created_by_username)}
          >
            @{task.created_by_username}
          </button>
        )}
        <h1 className="task-card__title-text" data-testid="task-name">
          {task.name}
        </h1>
      </motion.div>

      {/* Task content - center */}
      <div className="task-card__content">
        <TaskComponent 
          task={task} 
          onSuccess={handleSuccess} 
          onFail={handleFail}
        />
      </div>

      {/* Stats - bottom left (TikTok style) */}
      <StatsOverlay task={task} localAttempts={localAttempts} />

      {/* Action bar - right (like, comment, bookmark, share, theme) */}
      <ActionBar
        task={task}
        isCreator={isCreator}
        onTaskUpdated={onTaskUpdated}
        onLikeUpdate={onLikeUpdate}
      />
    </motion.div>
  );
};

export const TaskContainer = ({ initialTaskId = null }) => {
  const { profile, refreshProfile, setProfile } = useProfile();
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localAttempts, setLocalAttempts] = useState({});
  const [dragY, setDragY] = useState(0);
  const [offline, setOffline] = useState(false);
  const [profileOverlayOpen, setProfileOverlayOpen] = useState(false);
  const [profileOverlayUsername, setProfileOverlayUsername] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [streakJustIncreased, setStreakJustIncreased] = useState(false);
  const [streakJustReset, setStreakJustReset] = useState(false);

  useEffect(() => {
    if (!streakJustIncreased && !streakJustReset) return;
    const t = setTimeout(() => {
      setStreakJustIncreased(false);
      setStreakJustReset(false);
    }, 700);
    return () => clearTimeout(t);
  }, [streakJustIncreased, streakJustReset]);

  const fetchTasks = useCallback(async () => {
    const result = await api.getTasks();
    const taskList = result.tasks ?? result;
    const list = Array.isArray(taskList) ? taskList : [];
    setTasks(list);
    setOffline(Boolean(result.offline));
    setLoading(false);
    return list;
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const taskList = await fetchTasks();
      if (initialTaskId) {
        const idx = taskList.findIndex(t => t.id === initialTaskId);
        if (idx !== -1) {
          setCurrentIndex(idx);
        } else {
          // User task from direct link — fetch and prepend
          const task = await api.getTask(initialTaskId);
          if (task) {
            const withStats = { ...task, stats: task.stats || { task_id: task.id, attempts: 0, completions: 0, completion_rate: 0 } };
            setTasks([withStats, ...taskList]);
            setCurrentIndex(0);
          }
        }
      }
      setLoading(false);
    };
    run();
  }, [initialTaskId, fetchTasks]);

  const handleTaskCreated = useCallback(async (newTask) => {
    if (!newTask?.id) return;
    const taskList = await fetchTasks();
    const idx = taskList.findIndex(t => t.id === newTask.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      // User-created task not in global list — prepend and show it
      const withStats = { ...newTask, stats: newTask.stats || { task_id: newTask.id, attempts: 0, completions: 0, completion_rate: 0 } };
      setTasks([withStats, ...taskList]);
      setCurrentIndex(0);
    }
  }, [fetchTasks]);

  const handleTaskUpdated = useCallback((updatedTask) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
  }, []);

  const handleLikeUpdate = useCallback((taskId, { liked, count }) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, liked, likeCount: count } : t));
  }, []);

  const handlePlayTask = useCallback(async (task) => {
    if (!task?.id) return;
    const taskList = await fetchTasks();
    const idx = taskList.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      setCurrentIndex(idx);
    } else {
      // Profile task not in global list — prepend and show it
      const withStats = { ...task, stats: task.stats || { task_id: task.id, attempts: 0, completions: 0, completion_rate: 0 } };
      setTasks([withStats, ...taskList]);
      setCurrentIndex(0);
    }
  }, [fetchTasks]);

  // Refresh current task stats periodically (skip when offline)
  useEffect(() => {
    if (tasks.length === 0 || offline) return;

    const interval = setInterval(async () => {
      const currentTask = tasks[currentIndex];
      if (currentTask) {
        const stats = await api.getTaskStats(currentTask.id);
        if (stats) {
          setTasks(prev => prev.map(t =>
            t.id === currentTask.id ? { ...t, stats } : t
          ));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex, tasks, offline]);

  const currentTask = tasks[currentIndex];

  const handleSuccess = useCallback(async () => {
    if (!currentTask) return;
    setStreakJustIncreased(true);
    // Optimistic: bump streak so the badge updates immediately
    if (profile) {
      const next = (profile.current_streak ?? 0) + 1;
      const best = Math.max(profile.longest_streak ?? 0, next);
      setProfile({ ...profile, current_streak: next, longest_streak: best });
    }
    const result = await api.recordCompletion(currentTask.id);
    if (result?.stats) {
      setTasks(prev => prev.map(t => 
        t.id === currentTask.id ? { ...t, stats: result.stats } : t
      ));
    }
    // Use API values if returned (server-authoritative)
    if (result && (result.current_streak != null || result.longest_streak != null) && profile) {
      setProfile(prev => prev ? {
        ...prev,
        ...(result.current_streak != null && { current_streak: result.current_streak }),
        ...(result.longest_streak != null && { longest_streak: result.longest_streak }),
      } : prev);
    } else if (!profile) {
      await refreshProfile();
    }
  }, [currentTask, profile, refreshProfile, setProfile]);

  const handleFail = useCallback(async () => {
    if (!currentTask) return;
    const hadStreak = (profile?.current_streak ?? 0) > 0;
    if (hadStreak) setStreakJustReset(true);
    // Optimistic: reset streak so badge shows 0 immediately
    if (profile) setProfile({ ...profile, current_streak: 0 });
    const result = await api.recordAttempt(currentTask.id);
    if (result && result.longest_streak != null && profile) {
      setProfile(prev => prev ? { ...prev, longest_streak: result.longest_streak } : prev);
    }
    setLocalAttempts(prev => ({
      ...prev,
      [currentTask.id]: (prev[currentTask.id] || 0) + 1
    }));
    const stats = await api.getTaskStats(currentTask.id);
    if (stats) {
      setTasks(prev => prev.map(t => 
        t.id === currentTask.id ? { ...t, stats } : t
      ));
    }
  }, [currentTask, profile, refreshProfile, setProfile]);

  const goToNext = useCallback(() => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      soundManager.playClick();
    }
  }, [currentIndex, tasks.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      soundManager.playClick();
    }
  }, [currentIndex]);

  const handleDragEnd = useCallback((_, info) => {
    const threshold = 50;
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    if (offset < -threshold || velocity < -500) {
      goToNext();
    } else if (offset > threshold || velocity > 500) {
      goToPrev();
    }
    
    setDragY(0);
  }, [goToNext, goToPrev]);

  if (loading) {
    return (
      <div className="task-viewport flex items-center justify-center" style={{ background: 'var(--bg-subtle)' }} data-testid="loading-container">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-2 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: 'var(--fg-default)', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="font-medium" style={{ color: 'var(--fg-muted)' }}>Loading impossible tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-viewport relative" data-testid="task-container">
      <div className="task-viewport__profile-header" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="task-viewport__header-row">
          {profile?.username && (
            <UsernameButton
              username={profile.username}
              displayName={profile.display_name}
              onClick={() => setProfileOverlayOpen(true)}
            />
          )}
          {profile && (
            <StreakBadge
              currentStreak={profile.current_streak ?? 0}
              longestStreak={profile.longest_streak ?? 0}
              justIncreased={streakJustIncreased}
              justReset={streakJustReset}
            />
          )}
          <SearchBar onProfileSelect={(username) => { setProfileOverlayUsername(username); setProfileOverlayOpen(true); }} />
        </div>
      </div>
      <AnimatePresence>
        {profileOverlayOpen && (
          profileOverlayUsername ? (
            <ProfileOverlay
              username={profileOverlayUsername}
              onClose={() => { setProfileOverlayOpen(false); setProfileOverlayUsername(null); }}
              onTaskCreated={handleTaskCreated}
              onPlayTask={handlePlayTask}
              onTasksRefresh={fetchTasks}
            />
          ) : profile?.username && (
            <ProfileOverlay
              profile={profile}
              isOwnProfile
              onClose={() => setProfileOverlayOpen(false)}
              onTaskCreated={handleTaskCreated}
              onPlayTask={handlePlayTask}
              onTasksRefresh={fetchTasks}
            />
          )
        )}
      </AnimatePresence>
      {offline && (
        <div className="absolute top-0 left-0 right-0 z-50 py-1.5 px-3 bg-amber-500/90 text-slate-900 text-center text-sm font-medium" style={{ paddingTop: 'max(env(safe-area-inset-top), 6px)' }}>
          Offline mode — play works; stats not saved. Backend unreachable. Check REACT_APP_BACKEND_URL and CORS.
        </div>
      )}
      <motion.div
        className="h-full w-full"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={(_, info) => setDragY(info.offset.y)}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTask?.id}
            className="h-full w-full"
            initial={{ opacity: 0, y: dragY > 0 ? -50 : 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dragY > 0 ? 50 : -50 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30 
            }}
          >
            <TaskCard
              task={currentTask}
              onSuccess={handleSuccess}
              onFail={handleFail}
              localAttempts={localAttempts[currentTask?.id] || 0}
              onCreatorClick={(un) => { setProfileOverlayUsername(un); setProfileOverlayOpen(true); }}
              isCreator={!!(profile?.username && currentTask?.created_by_username === profile.username)}
              onTaskUpdated={handleTaskUpdated}
              onLikeUpdate={handleLikeUpdate}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      
      {/* Swipe hint */}
      <SwipeHint 
        show={tasks.length > 1}
        currentIndex={currentIndex}
        totalTasks={tasks.length}
      />
    </div>
  );
};
