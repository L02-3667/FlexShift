import type { Shift } from '@/src/types/models';

import { hasTimeOverlap } from './date';

interface ShiftWindow {
  id?: string;
  startTime: string;
  endTime: string;
}

interface CheckShiftConflictOptions {
  excludeShiftId?: string;
}

export function checkShiftConflict(
  existingShifts: ShiftWindow[],
  candidate: Pick<Shift, 'startTime' | 'endTime'>,
  options: CheckShiftConflictOptions = {},
) {
  return existingShifts.some((shift) => {
    if (options.excludeShiftId && shift.id === options.excludeShiftId) {
      return false;
    }

    return hasTimeOverlap(
      shift.startTime,
      shift.endTime,
      candidate.startTime,
      candidate.endTime,
    );
  });
}
