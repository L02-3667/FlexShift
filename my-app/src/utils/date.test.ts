import {
  addCalendarDays,
  formatDateTimeLabel,
  getAdjacentDateStrings,
  hasDateTimeOverlap,
  hasTimeOverlap,
} from '@/src/utils/date';

describe('date helpers', () => {
  it('detects overlapping time ranges', () => {
    expect(hasTimeOverlap('08:00', '12:00', '11:00', '13:00')).toBe(true);
    expect(hasTimeOverlap('08:00', '12:00', '12:00', '14:00')).toBe(false);
  });

  it('supports overnight overlap checks across adjacent dates', () => {
    expect(
      hasDateTimeOverlap(
        '2026-04-11',
        '22:00',
        '02:00',
        '2026-04-12',
        '01:00',
        '03:00',
      ),
    ).toBe(true);
    expect(
      hasDateTimeOverlap(
        '2026-04-11',
        '22:00',
        '02:00',
        '2026-04-12',
        '02:00',
        '04:00',
      ),
    ).toBe(false);
  });

  it('formats a readable date-time label and adjacent dates', () => {
    expect(formatDateTimeLabel('2026-04-10', '08:00', '12:00')).toContain(
      '08:00 - 12:00',
    );
    expect(addCalendarDays('2026-04-10', 1)).toBe('2026-04-11');
    expect(getAdjacentDateStrings('2026-04-10')).toEqual([
      '2026-04-09',
      '2026-04-10',
      '2026-04-11',
    ]);
  });
});
