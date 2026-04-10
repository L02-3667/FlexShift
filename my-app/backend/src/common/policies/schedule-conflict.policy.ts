import { hasTimeOverlap } from '../utils/shift.utils';

interface ShiftWindow {
  startTime: string;
  endTime: string;
}

export function checkShiftConflict(
  existing: ShiftWindow[],
  candidate: ShiftWindow,
) {
  return existing.some((shift) =>
    hasTimeOverlap(
      shift.startTime,
      shift.endTime,
      candidate.startTime,
      candidate.endTime,
    ),
  );
}
