import { checkShiftConflict } from '@/src/utils/shift-conflicts';

describe('checkShiftConflict', () => {
  it('returns true when a candidate overlaps existing shifts', () => {
    expect(
      checkShiftConflict(
        [
          {
            id: 'shift-1',
            startTime: '08:00',
            endTime: '12:00',
          },
        ],
        {
          startTime: '11:30',
          endTime: '15:00',
        },
      ),
    ).toBe(true);
  });

  it('ignores the excluded shift id', () => {
    expect(
      checkShiftConflict(
        [
          {
            id: 'shift-1',
            startTime: '08:00',
            endTime: '12:00',
          },
        ],
        {
          startTime: '11:30',
          endTime: '15:00',
        },
        {
          excludeShiftId: 'shift-1',
        },
      ),
    ).toBe(false);
  });
});
