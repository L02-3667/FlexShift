import { hasDateTimeOverlap } from '../utils/shift.utils';

interface ShiftWindow {
  date: Date | string;
  startTime: string;
  endTime: string;
}

export function checkShiftConflict(
  existing: ShiftWindow[],
  candidate: ShiftWindow,
) {
  return existing.some((shift) =>
    hasDateTimeOverlap(
      shift.date,
      shift.startTime,
      shift.endTime,
      candidate.date,
      candidate.startTime,
      candidate.endTime,
    ),
  );
}
