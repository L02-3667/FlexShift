import type { Shift } from '@/src/types/models';

import { hasDateTimeOverlap } from './date';

interface ShiftWindow {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
}

interface CheckShiftConflictOptions {
  excludeShiftId?: string;
}

export function checkShiftConflict(
  existingShifts: ShiftWindow[],
  candidate: Pick<Shift, 'date' | 'startTime' | 'endTime'>,
  options: CheckShiftConflictOptions = {},
) {
  return existingShifts.some((shift) => {
    if (options.excludeShiftId && shift.id === options.excludeShiftId) {
      return false;
    }

    return hasDateTimeOverlap(
      shift.date,
      shift.startTime,
      shift.endTime,
      candidate.date,
      candidate.startTime,
      candidate.endTime,
    );
  });
}
