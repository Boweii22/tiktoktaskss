-- Fix: Remove duplicates, add 30 tasks ONLY for @boweii_gmx
-- If your username is bowei_gmx (one i), change both 'boweii_gmx' to 'bowei_gmx' below
--
-- STEP 1: Remove ALL user_tasks (clean slate - fixes 150+ duplicate tasks)
-- This will reduce the general feed back to only the 30 built-in tasks
DELETE FROM user_tasks;

-- STEP 2: Add exactly 30 tasks for boweii_gmx ONLY
-- Change 'boweii_gmx' to 'bowei_gmx' if your username has one 'i'
INSERT INTO user_tasks (id, created_by_session_id, created_by_username, name, instruction, type, config)
SELECT v.id, p.session_id, 'boweii_gmx', v.name, v.instruction, v.type, v.config::jsonb
FROM (SELECT session_id FROM profiles WHERE username = 'boweii_gmx' LIMIT 1) p
CROSS JOIN (VALUES
  ('user_hold3000', 'Hold', 'Hold for exactly 3.000 seconds. Release too early or too late = fail.', 'timing', '{"target": 3000, "tolerance": 15}'),
  ('user_static_tap', 'Still', 'Tap in the exact moment the circle freezes. It only freezes for a split second each cycle.', 'static_tap', '{"cycle_ms": 4500, "window_ms": 35}'),
  ('user_shrinking_circle', 'Catch', 'Drag the dot into the circle before it disappears. Miss = fail.', 'shrinking_circle', '{"shrink_rate": 0.94, "min_size": 12}'),
  ('user_trap_tap', 'Tap 50', 'Tap 50 times. One tap is a trap — if you hit it you fail and start over.', 'trap_tap', '{"required_taps": 50, "trap_position": -1}'),
  ('user_balance_shape', 'Balance', 'Keep the block centered for 5 seconds. Let it drift too far = fail.', 'balance', '{"duration": 5000, "sensitivity": 2.8}'),
  ('user_misleading', 'Read', 'Tap the blue button. (Read the instruction carefully.)', 'misleading', '{"correct_action": "red"}'),
  ('user_wait_unknown', 'Wait', 'Tap only when the button appears. Tapping before it appears = fail.', 'wait', '{"min_wait": 3500, "max_wait": 7500}'),
  ('user_align_frame', 'Sync', 'Tap only when the two shapes overlap exactly. Slightly off = fail.', 'align', '{"speed": 3.2, "window_ms": 100, "align_threshold_deg": 9}'),
  ('user_timing_window', 'React', 'Tap as soon as it turns green. You have under 0.2 seconds.', 'reaction', '{"min_delay": 2200, "max_delay": 4800, "window_ms": 165}'),
  ('user_hesitation', 'Quick', 'Tap within 0.35 seconds of start. Hesitate = fail.', 'hesitation', '{"max_delay": 350}'),
  ('user_precision_slider', 'Exact', 'Slide to exactly 73. Lock in. Tolerance is ±0.4.', 'precision', '{"target": 73, "tolerance": 0.4}'),
  ('user_rapid_tap', 'Speed', 'Tap 12 times in 2 seconds. Not 11. Not 13.', 'rapid', '{"required_taps": 12, "time_limit": 2000, "tolerance": 0}'),
  ('user_color_stop', 'Color Stop', 'A color slowly shifts. Tap when it looks fully stopped. It never truly does.', 'color_stop', '{"cycle_ms": 5000, "window_ms": 70}'),
  ('user_vibration_end', 'Vibration', 'The phone vibrates inconsistently. Let go exactly when it stops. It fakes you out.', 'vibration_end', '{"duration_ms": 6000, "window_ms": 400}'),
  ('user_tap_center', 'Center', 'A dot appears. Tap the true mathematical center. No guides. Tiny tolerance.', 'tap_center', '{"tolerance_px": 10}'),
  ('user_dont_blink', 'Don''t Blink', 'A button grows subtly. Touching too early or too late fails.', 'dont_blink', '{"grow_ms": 4500, "window_ms": 120}'),
  ('user_swipe_straight', 'Swipe Up', 'Swipe perfectly vertical. Very tight angle tolerance.', 'swipe_straight', '{"max_angle_deg": 10, "min_distance": 100}'),
  ('user_tap_once', 'One Tap', 'You are allowed exactly one tap. Nothing tells you when to tap.', 'tap_once', '{"min_wait": 4000, "max_wait": 9000, "window_ms": 350}'),
  ('user_follow_literal', 'Literal', 'Follow the instruction literally. Doing what it sounds like fails.', 'follow_literal', '{}'),
  ('user_tap_nothing', 'Nothing', 'Tap when nothing happens. The correct moment looks identical to all others.', 'tap_nothing', '{"trigger_after_ms": 5200, "window_ms": 280}'),
  ('user_timer_zero', 'Stop at Zero', 'Timer jumps from 0.02 to -0.01 unpredictably. Stop it at zero.', 'timer_zero', '{"window_ms": 180}'),
  ('user_finger_still', 'Finger Still', 'Keep your finger still. Microscopic movement is detected. Any jitter fails.', 'finger_still', '{"duration": 3500, "max_move_px": 5}'),
  ('user_drag_no_edge', 'No Edge', 'Drag the dot to the goal. Invisible margins exist. Hit one = instant fail.', 'drag_no_edge', '{"margin_px": 18}'),
  ('user_match_rhythm', 'Rhythm', 'A silent rhythm plays visually once. Reproduce it perfectly.', 'match_rhythm', '{"pattern_ms": [400, 400, 800, 400], "tolerance_ms": 120}'),
  ('user_wait_longer', 'Wait Longer', 'Wait longer than feels right. Touching too soon fails. Touching too late also fails.', 'wait_longer', '{"correct_after_ms": 5500, "window_ms": 400}'),
  ('user_odd_frame', 'Odd Frame', 'Out of many identical frames, one is slightly different for 1 frame. Tap it.', 'odd_frame', '{"total_frames": 80, "odd_duration_frames": 3}'),
  ('user_dont_react', 'Don''t React', 'A fake GO! appears. Reacting instantly fails.', 'dont_react', '{"fake_go_at_ms": 2500, "real_go_at_ms": 5500, "window_ms": 200}'),
  ('user_swipe_slow', 'Slow Swipe', 'Swipe at the slowest speed. Too fast or too slow both fail.', 'swipe_slow', '{"min_speed": 35, "max_speed": 75, "min_distance": 150}'),
  ('user_tap_same_spot', 'Same Spot', 'The second tap must land exactly on the first pixel.', 'tap_same_spot', '{"tolerance_px": 8}'),
  ('user_zero_score', 'Zero Score', 'Every tap increases score. You must end with exactly zero.', 'zero_score', '{}')
) AS v(id, name, instruction, type, config);

-- Result: Global feed = 30 built-in only. @boweii_gmx profile shows 30 tasks created.
