import { checkShiftConflict } from '@/src/utils/shift-conflicts';

describe('checkShiftConflict', () => {
  it('returns true when a candidate overlaps existing shifts', () => {
    expect(
      checkShiftConflict(
        [
          {
            id: 'shift-1',
            date: '2026-04-11',
            startTime: '08:00',
            endTime: '12:00',
          },
        ],
        {
          date: '2026-04-11',
          startTime: '11:30',
          endTime: '15:00',
        },
      ),
    ).toBe(true);
  });

  it('detects overnight conflicts on adjacent dates', () => {
    expect(
      checkShiftConflict(
        [
          {
            id: 'shift-overnight',
            date: '2026-04-11',
            startTime: '22:00',
            endTime: '02:00',
          },
        ],
        {
          date: '2026-04-12',
          startTime: '01:00',
          endTime: '04:00',
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
            date: '2026-04-11',
            startTime: '08:00',
            endTime: '12:00',
          },
        ],
        {
          date: '2026-04-11',
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
