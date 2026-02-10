import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND_URL ? `${String(BACKEND_URL).replace(/\/$/, '')}/api` : '';

// Fallback task list when backend/API is unavailable (no DB or server down)
const FALLBACK_TASKS = [
  { id: 'hold3000', name: 'Hold', instruction: 'Hold for exactly 3 seconds.', type: 'timing', config: { target: 3000, tolerance: 20 }, stats: { task_id: 'hold3000', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'static_tap', name: 'Still', instruction: 'Tap when the circle stops moving.', type: 'static_tap', config: { cycle_ms: 4000, window_ms: 50 }, stats: { task_id: 'static_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'shrinking_circle', name: 'Catch', instruction: 'Drag the dot into the circle.', type: 'shrinking_circle', config: { shrink_rate: 0.95, min_size: 10 }, stats: { task_id: 'shrinking_circle', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'trap_tap', name: 'Tap 50', instruction: 'Tap exactly 50 times.', type: 'trap_tap', config: { required_taps: 50, trap_position: -1 }, stats: { task_id: 'trap_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'balance_shape', name: 'Balance', instruction: 'Keep it balanced for 5 seconds.', type: 'balance', config: { duration: 5000, sensitivity: 2 }, stats: { task_id: 'balance_shape', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'misleading', name: 'Read', instruction: 'Tap the blue button.', type: 'misleading', config: { correct_action: 'red' }, stats: { task_id: 'misleading', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'wait_unknown', name: 'Wait', instruction: 'Wait.', type: 'wait', config: { min_wait: 3000, max_wait: 8000 }, stats: { task_id: 'wait_unknown', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'align_frame', name: 'Sync', instruction: 'Tap when they align.', type: 'align', config: { speed: 3, window_ms: 100 }, stats: { task_id: 'align_frame', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'timing_window', name: 'React', instruction: 'Tap when it turns green.', type: 'reaction', config: { min_delay: 2000, max_delay: 5000, window_ms: 200 }, stats: { task_id: 'timing_window', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'hesitation', name: 'Quick', instruction: 'Tap immediately.', type: 'hesitation', config: { max_delay: 500 }, stats: { task_id: 'hesitation', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'precision_slider', name: 'Exact', instruction: 'Slide to 73.', type: 'precision', config: { target: 73, tolerance: 0.5 }, stats: { task_id: 'precision_slider', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'rapid_tap', name: 'Speed', instruction: 'Tap 10 times in 2 seconds. Exactly.', type: 'rapid', config: { required_taps: 10, time_limit: 2000, tolerance: 0 }, stats: { task_id: 'rapid_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'hold_5', name: 'Steady', instruction: 'Hold for exactly 5 seconds. No more, no less.', type: 'timing', config: { target: 5000, tolerance: 50 }, stats: { task_id: 'hold_5', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'slide_42', name: 'Forty-Two', instruction: 'Slide to exactly 42.', type: 'precision', config: { target: 42, tolerance: 1 }, stats: { task_id: 'slide_42', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'double_tap', name: 'Double', instruction: 'Double-tap. Not too fast, not too slow.', type: 'double_tap', config: { min_gap: 200, max_gap: 600 }, stats: { task_id: 'double_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'dont_tap', name: 'Resist', instruction: "Don't tap for 4 seconds. (Yes, it will try to trick you.)", type: 'dont_tap', config: { duration: 4000 }, stats: { task_id: 'dont_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'color_react', name: 'Yellow', instruction: 'Tap only when it turns yellow.', type: 'color_react', config: { min_delay: 1500, max_delay: 4500, window_ms: 250 }, stats: { task_id: 'color_react', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'count_7', name: 'Count', instruction: 'Tap at exactly 7 seconds. No timer — count in your head.', type: 'count_seconds', config: { target_seconds: 7, tolerance_ms: 800 }, stats: { task_id: 'count_7', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'odd_one_out', name: 'Different', instruction: "Tap the one that's different.", type: 'odd_one_out', config: { count: 4 }, stats: { task_id: 'odd_one_out', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'sequence_tap', name: 'Order', instruction: 'Tap in order: 1, then 2, then 3, then 4.', type: 'sequence_tap', config: { length: 4 }, stats: { task_id: 'sequence_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'double_react', name: 'Both', instruction: 'Tap when both circles turn green.', type: 'double_react', config: { min_delay: 2500, max_delay: 5500, window_ms: 220 }, stats: { task_id: 'double_react', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'hold_7', name: 'Patience', instruction: 'Hold for exactly 7 seconds.', type: 'timing', config: { target: 7000, tolerance: 80 }, stats: { task_id: 'hold_7', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'rapid_5', name: 'Five', instruction: 'Tap 5 times in 1 second. Exactly.', type: 'rapid', config: { required_taps: 5, time_limit: 1000, tolerance: 0 }, stats: { task_id: 'rapid_5', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'wait_5', name: 'Chill', instruction: 'Wait. Tap only when the button appears.', type: 'wait', config: { min_wait: 4000, max_wait: 7000 }, stats: { task_id: 'wait_5', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'precision_0', name: 'Zero', instruction: "Slide to exactly 0. Don't overshoot.", type: 'precision', config: { target: 0, tolerance: 0.5 }, stats: { task_id: 'precision_0', attempts: 0, completions: 0, completion_rate: 0 } }
];

// Generate a session ID for tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('impossible_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('impossible_session', sessionId);
  }
  return sessionId;
};

export const api = {
  // Get all tasks with stats (uses fallback when backend/DB unavailable)
  getTasks: async () => {
    if (!API) return { tasks: FALLBACK_TASKS, offline: true };
    try {
      const response = await axios.get(`${API}/tasks`, { timeout: 5000 });
      return { tasks: response.data, offline: false };
    } catch (error) {
      console.warn('Backend unavailable, using offline tasks. Start backend + MongoDB for stats.', error?.message || error);
      return { tasks: FALLBACK_TASKS, offline: true };
    }
  },

  // Get single task
  getTask: async (taskId) => {
    if (!API) return FALLBACK_TASKS.find((t) => t.id === taskId) || null;
    try {
      const response = await axios.get(`${API}/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch task:', error);
      return null;
    }
  },

  // Record an attempt
  recordAttempt: async (taskId) => {
    if (!API) return null;
    try {
      const response = await axios.post(`${API}/tasks/${taskId}/attempt`, {
        session_id: getSessionId()
      });
      return response.data;
    } catch (error) {
      console.error('Failed to record attempt:', error);
      return null;
    }
  },

  // Record a completion
  recordCompletion: async (taskId, timeTaken = null) => {
    if (!API) return null;
    try {
      const response = await axios.post(`${API}/tasks/${taskId}/complete`, {
        session_id: getSessionId(),
        time_taken: timeTaken
      });
      return response.data;
    } catch (error) {
      console.error('Failed to record completion:', error);
      return null;
    }
  },

  // Get task stats
  getTaskStats: async (taskId) => {
    if (!API) return null;
    try {
      const response = await axios.get(`${API}/tasks/${taskId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return null;
    }
  },

  // Get leaderboard
  getLeaderboard: async () => {
    if (!API) return [];
    try {
      const response = await axios.get(`${API}/leaderboard`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }
};

export const generateShareUrl = (taskId) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/task/${taskId}`;
};

export const shareTask = async (task) => {
  const url = generateShareUrl(task.id);
  const rate = task.stats?.completion_rate?.toFixed(1) || '0.0';
  const text = `Only ${rate}% passed "${task.name}" - Can you beat this impossible task?`;
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Impossible Tasks',
        text: text,
        url: url
      });
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  }
  
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};
