import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = BACKEND_URL ? `${String(BACKEND_URL).replace(/\/$/, '')}/api` : '';

// Fallback task list when backend/API is unavailable (no DB or server down)
const FALLBACK_TASKS = [
  { id: 'hold3000', name: 'Hold', instruction: 'Hold for exactly 3.000 seconds. Release too early or too late = fail.', type: 'timing', config: { target: 3000, tolerance: 15 }, stats: { task_id: 'hold3000', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'static_tap', name: 'Still', instruction: 'Tap in the exact moment the circle freezes. It only freezes for a split second each cycle.', type: 'static_tap', config: { cycle_ms: 4500, window_ms: 35 }, stats: { task_id: 'static_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'shrinking_circle', name: 'Catch', instruction: 'Drag the dot into the circle before it disappears. Miss = fail.', type: 'shrinking_circle', config: { shrink_rate: 0.94, min_size: 12 }, stats: { task_id: 'shrinking_circle', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'trap_tap', name: 'Tap 50', instruction: 'Tap 50 times. One tap is a trap — if you hit it you fail and start over.', type: 'trap_tap', config: { required_taps: 50, trap_position: -1 }, stats: { task_id: 'trap_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'balance_shape', name: 'Balance', instruction: 'Keep the block centered for 5 seconds. Let it drift too far = fail.', type: 'balance', config: { duration: 5000, sensitivity: 2.8 }, stats: { task_id: 'balance_shape', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'misleading', name: 'Read', instruction: 'Tap the blue button. (Read the instruction carefully.)', type: 'misleading', config: { correct_action: 'red' }, stats: { task_id: 'misleading', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'wait_unknown', name: 'Wait', instruction: 'Tap only when the button appears. Tapping before it appears = fail.', type: 'wait', config: { min_wait: 3500, max_wait: 7500 }, stats: { task_id: 'wait_unknown', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'align_frame', name: 'Sync', instruction: 'Tap only when the two shapes overlap exactly. Slightly off = fail.', type: 'align', config: { speed: 3.2, window_ms: 100, align_threshold_deg: 9 }, stats: { task_id: 'align_frame', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'timing_window', name: 'React', instruction: 'Tap as soon as it turns green. You have under 0.2 seconds.', type: 'reaction', config: { min_delay: 2200, max_delay: 4800, window_ms: 165 }, stats: { task_id: 'timing_window', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'hesitation', name: 'Quick', instruction: 'Tap within 0.35 seconds of start. Hesitate = fail.', type: 'hesitation', config: { max_delay: 350 }, stats: { task_id: 'hesitation', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'precision_slider', name: 'Exact', instruction: 'Slide to exactly 73. Lock in. Tolerance is ±0.4.', type: 'precision', config: { target: 73, tolerance: 0.4 }, stats: { task_id: 'precision_slider', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'rapid_tap', name: 'Speed', instruction: 'Tap 12 times in 2 seconds. Not 11. Not 13.', type: 'rapid', config: { required_taps: 12, time_limit: 2000, tolerance: 0 }, stats: { task_id: 'rapid_tap', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'color_stop', name: 'Color Stop', instruction: 'A color slowly shifts. Tap when it looks fully stopped. It never truly does.', type: 'color_stop', config: { cycle_ms: 5000, window_ms: 70 }, stats: { task_id: 'color_stop', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'vibration_end', name: 'Vibration', instruction: 'The phone vibrates inconsistently. Let go exactly when it stops. It fakes you out.', type: 'vibration_end', config: { duration_ms: 6000, window_ms: 400 }, stats: { task_id: 'vibration_end', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'tap_center', name: 'Center', instruction: 'A dot appears. Tap the true mathematical center. No guides. Tiny tolerance.', type: 'tap_center', config: { tolerance_px: 10 }, stats: { task_id: 'tap_center', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'dont_blink', name: "Don't Blink", instruction: 'A button grows subtly. Touching too early or too late fails.', type: 'dont_blink', config: { grow_ms: 4500, window_ms: 120 }, stats: { task_id: 'dont_blink', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'swipe_straight', name: 'Swipe Up', instruction: 'Swipe perfectly vertical. Very tight angle tolerance.', type: 'swipe_straight', config: { max_angle_deg: 10, min_distance: 100 }, stats: { task_id: 'swipe_straight', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'tap_once', name: 'One Tap', instruction: 'You are allowed exactly one tap. Nothing tells you when to tap.', type: 'tap_once', config: { min_wait: 4000, max_wait: 9000, window_ms: 350 }, stats: { task_id: 'tap_once', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'follow_literal', name: 'Literal', instruction: 'Follow the instruction literally. Doing what it sounds like fails.', type: 'follow_literal', config: {}, stats: { task_id: 'follow_literal', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'tap_nothing', name: 'Nothing', instruction: 'Tap when nothing happens. The correct moment looks identical to all others.', type: 'tap_nothing', config: { trigger_after_ms: 5200, window_ms: 280 }, stats: { task_id: 'tap_nothing', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'timer_zero', name: 'Stop at Zero', instruction: 'Timer jumps from 0.02 to -0.01 unpredictably. Stop it at zero.', type: 'timer_zero', config: { window_ms: 180 }, stats: { task_id: 'timer_zero', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'finger_still', name: 'Finger Still', instruction: 'Keep your finger still. Microscopic movement is detected. Any jitter fails.', type: 'finger_still', config: { duration: 3500, max_move_px: 5 }, stats: { task_id: 'finger_still', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'drag_no_edge', name: 'No Edge', instruction: 'Drag the dot to the goal. Invisible margins exist. Hit one = instant fail.', type: 'drag_no_edge', config: { margin_px: 18 }, stats: { task_id: 'drag_no_edge', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'match_rhythm', name: 'Rhythm', instruction: 'A silent rhythm plays visually once. Reproduce it perfectly.', type: 'match_rhythm', config: { pattern_ms: [400, 400, 800, 400], tolerance_ms: 120 }, stats: { task_id: 'match_rhythm', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'wait_longer', name: 'Wait Longer', instruction: 'Wait longer than feels right. Touching too soon fails. Touching too late also fails.', type: 'wait_longer', config: { correct_after_ms: 5500, window_ms: 400 }, stats: { task_id: 'wait_longer', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'odd_frame', name: 'Odd Frame', instruction: 'Out of many identical frames, one is slightly different for 1 frame. Tap it.', type: 'odd_frame', config: { total_frames: 80, odd_duration_frames: 3 }, stats: { task_id: 'odd_frame', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'dont_react', name: "Don't React", instruction: "A fake GO! appears. Reacting instantly fails.", type: 'dont_react', config: { fake_go_at_ms: 2500, real_go_at_ms: 5500, window_ms: 200 }, stats: { task_id: 'dont_react', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'swipe_slow', name: 'Slow Swipe', instruction: 'Swipe at the slowest speed. Too fast or too slow both fail.', type: 'swipe_slow', config: { min_speed: 35, max_speed: 75, min_distance: 150 }, stats: { task_id: 'swipe_slow', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'tap_same_spot', name: 'Same Spot', instruction: 'The second tap must land exactly on the first pixel.', type: 'tap_same_spot', config: { tolerance_px: 8 }, stats: { task_id: 'tap_same_spot', attempts: 0, completions: 0, completion_rate: 0 } },
  { id: 'zero_score', name: 'Zero Score', instruction: 'Every tap increases score. You must end with exactly zero.', type: 'zero_score', config: {}, stats: { task_id: 'zero_score', attempts: 0, completions: 0, completion_rate: 0 } }
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
      const response = await axios.get(`${API}/tasks`, { timeout: 25000 });
      return { tasks: response.data, offline: false };
    } catch (error) {
      console.warn('Backend unavailable, using offline tasks. Check REACT_APP_BACKEND_URL and CORS.', error?.message || error);
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
