import { formatDateTimeLabel, hasTimeOverlap } from '@/src/utils/date';

describe('date helpers', () => {
  it('detects overlapping time ranges', () => {
    expect(hasTimeOverlap('08:00', '12:00', '11:00', '13:00')).toBe(true);
    expect(hasTimeOverlap('08:00', '12:00', '12:00', '14:00')).toBe(false);
  });

  it('formats a readable date-time label', () => {
    expect(formatDateTimeLabel('2026-04-10', '08:00', '12:00')).toContain(
      '08:00 - 12:00',
    );
  });
});
