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
import { DoubleReactTask } from './tasks/DoubleReactTask';
import { DoubleTapTask } from './tasks/DoubleTapTask';
import { DontTapTask } from './tasks/DontTapTask';
import { ColorReactTask } from './tasks/ColorReactTask';
import { CountSecondsTask } from './tasks/CountSecondsTask';
import { OddOneOutTask } from './tasks/OddOneOutTask';
import { SequenceTapTask } from './tasks/SequenceTapTask';

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
  double_react: DoubleReactTask,
  double_tap: DoubleTapTask,
  dont_tap: DontTapTask,
  color_react: ColorReactTask,
  count_seconds: CountSecondsTask,
  odd_one_out: OddOneOutTask,
  sequence_tap: SequenceTapTask
};

export const getTaskComponent = (type) => {
  return taskComponents[type] || null;
};
