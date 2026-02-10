import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTaskComponent } from './taskRegistry';
import { StatsOverlay } from './StatsOverlay';
import { ShareDialog } from './ShareDialog';
import { SwipeHint } from './SwipeHint';
import { api } from '../../lib/api';
import { soundManager } from '../../lib/sounds';

export const TaskCard = ({ task, onSuccess, onFail, localAttempts }) => {
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
      className={`task-card ${flashState === 'fail' ? 'fail-flash' : ''} ${flashState === 'success' ? 'success-glow' : ''}`}
      data-testid={`task-card-${task.id}`}
    >
      {/* Stats overlay */}
      <StatsOverlay task={task} localAttempts={localAttempts} />
      
      {/* Task name */}
      <div className="absolute top-4 left-4 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
        <h1 className="text-xl font-bold text-slate-900" data-testid="task-name">
          {task.name}
        </h1>
      </div>
      
      {/* Task content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-md mx-auto">
        <TaskComponent 
          task={task} 
          onSuccess={handleSuccess} 
          onFail={handleFail}
        />
      </div>
      
      {/* Share button */}
      <ShareDialog task={task} />
    </motion.div>
  );
};

export const TaskContainer = ({ initialTaskId = null }) => {
  const [tasks, setTasks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localAttempts, setLocalAttempts] = useState({});
  const [dragY, setDragY] = useState(0);
  const [offline, setOffline] = useState(false);

  // Fetch tasks on mount (uses fallback when backend/DB unavailable)
  useEffect(() => {
    const fetchTasks = async () => {
      const result = await api.getTasks();
      const taskList = result.tasks ?? result;
      setTasks(Array.isArray(taskList) ? taskList : []);
      setOffline(Boolean(result.offline));

      if (initialTaskId && taskList.length > 0) {
        const idx = taskList.findIndex(t => t.id === initialTaskId);
        if (idx !== -1) setCurrentIndex(idx);
      }

      setLoading(false);
    };

    fetchTasks();
  }, [initialTaskId]);

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
    
    // Record completion
    const result = await api.recordCompletion(currentTask.id);
    if (result?.stats) {
      setTasks(prev => prev.map(t => 
        t.id === currentTask.id ? { ...t, stats: result.stats } : t
      ));
    }
  }, [currentTask]);

  const handleFail = useCallback(async () => {
    if (!currentTask) return;
    
    // Record attempt
    await api.recordAttempt(currentTask.id);
    
    // Update local attempts
    setLocalAttempts(prev => ({
      ...prev,
      [currentTask.id]: (prev[currentTask.id] || 0) + 1
    }));
    
    // Refresh stats
    const stats = await api.getTaskStats(currentTask.id);
    if (stats) {
      setTasks(prev => prev.map(t => 
        t.id === currentTask.id ? { ...t, stats } : t
      ));
    }
  }, [currentTask]);

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
      <div className="task-viewport flex items-center justify-center bg-slate-50" data-testid="loading-container">
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-2 border-slate-900 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-slate-600 font-medium">Loading impossible tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-viewport relative" data-testid="task-container">
      {offline && (
        <div className="absolute top-0 left-0 right-0 z-50 py-1.5 px-3 bg-amber-500/90 text-slate-900 text-center text-sm font-medium" style={{ paddingTop: 'max(env(safe-area-inset-top), 6px)' }}>
          Offline mode — play works; stats not saved. Start backend + MongoDB for global stats.
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
