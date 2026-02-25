// Task component registry
import { HoldTask } from './tasks/HoldTask';
import { StaticTapTask } from './tasks/StaticTapTask';
import { ShrinkingCircleTask } from './tasks/ShrinkingCircleTask';
import { TrapTapTask } from './tasks/TrapTapTask';
import { BalanceTask } from './tasks/BalanceTask';
import { MisleadingTask } from './tasks/MisleadingTask';
import { WaitTask } from './tasks/WaitTask';
import { AlignTask } from './tasks/AlignTask';
import { ReactionTask } from './tasks/ReactionTask';
import { HesitationTask } from './tasks/HesitationTask';
import { PrecisionTask } from './tasks/PrecisionTask';
import { RapidTapTask } from './tasks/RapidTapTask';
import { ColorStopTask } from './tasks/ColorStopTask';
import { VibrationEndTask } from './tasks/VibrationEndTask';
import { TapCenterTask } from './tasks/TapCenterTask';
import { DontBlinkTask } from './tasks/DontBlinkTask';
import { SwipeStraightTask } from './tasks/SwipeStraightTask';
import { TapOnceTask } from './tasks/TapOnceTask';
import { FollowLiteralTask } from './tasks/FollowLiteralTask';
import { TapNothingTask } from './tasks/TapNothingTask';
import { TimerZeroTask } from './tasks/TimerZeroTask';
import { FingerStillTask } from './tasks/FingerStillTask';
import { DragNoEdgeTask } from './tasks/DragNoEdgeTask';
import { MatchRhythmTask } from './tasks/MatchRhythmTask';
import { WaitLongerTask } from './tasks/WaitLongerTask';
import { OddFrameTask } from './tasks/OddFrameTask';
import { DontReactTask } from './tasks/DontReactTask';
import { SwipeSpeedTask } from './tasks/SwipeSpeedTask';
import { TapSameSpotTask } from './tasks/TapSameSpotTask';
import { ZeroScoreTask } from './tasks/ZeroScoreTask';
import { MirrorTask } from './tasks/MirrorTask';
import { MemoryDotTask } from './tasks/MemoryDotTask';
import { SimonTask } from './tasks/SimonTask';
import { CountFlashTask } from './tasks/CountFlashTask';
import { TwoTapTask } from './tasks/TwoTapTask';
import { NumberOrderTask } from './tasks/NumberOrderTask';
import { StroopTask } from './tasks/StroopTask';
import { SilentBeatTask } from './tasks/SilentBeatTask';

export const taskComponents = {
  timing: HoldTask,
  static_tap: StaticTapTask,
  shrinking_circle: ShrinkingCircleTask,
  trap_tap: TrapTapTask,
  balance: BalanceTask,
  misleading: MisleadingTask,
  wait: WaitTask,
  align: AlignTask,
  reaction: ReactionTask,
  hesitation: HesitationTask,
  precision: PrecisionTask,
  rapid: RapidTapTask,
  color_stop: ColorStopTask,
  vibration_end: VibrationEndTask,
  tap_center: TapCenterTask,
  dont_blink: DontBlinkTask,
  swipe_straight: SwipeStraightTask,
  tap_once: TapOnceTask,
  follow_literal: FollowLiteralTask,
  tap_nothing: TapNothingTask,
  timer_zero: TimerZeroTask,
  finger_still: FingerStillTask,
  drag_no_edge: DragNoEdgeTask,
  match_rhythm: MatchRhythmTask,
  wait_longer: WaitLongerTask,
  odd_frame: OddFrameTask,
  dont_react: DontReactTask,
  swipe_slow: SwipeSpeedTask,
  tap_same_spot: TapSameSpotTask,
  zero_score: ZeroScoreTask,
  mirror: MirrorTask,
  memory_dot: MemoryDotTask,
  simon: SimonTask,
  count_flash: CountFlashTask,
  two_tap: TwoTapTask,
  number_order: NumberOrderTask,
  stroop: StroopTask,
  silent_beat: SilentBeatTask,
};

export const getTaskComponent = (type) => {
  return taskComponents[type] || null;
};
