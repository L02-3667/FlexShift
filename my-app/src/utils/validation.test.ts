import {
  validateOpenShiftFields,
  validateReason,
} from '@/src/utils/validation';

describe('validation helpers', () => {
  it('accepts overnight open-shift windows but rejects zero-length windows', () => {
    expect(
      validateOpenShiftFields({
        date: '2026-04-11',
        startTime: '22:00',
        endTime: '02:00',
        storeName: 'Central Market',
        position: 'Thu ngân',
        note: 'Ca đêm cần bổ sung.',
      }),
    ).toBeNull();

    expect(
      validateOpenShiftFields({
        date: '2026-04-11',
        startTime: '22:00',
        endTime: '22:00',
        storeName: 'Central Market',
        position: 'Thu ngân',
        note: 'Không hợp lệ.',
      }),
    ).toContain('Khung giờ không hợp lệ');
  });

  it('rejects short reasons and missing fields', () => {
    expect(validateReason('')).toContain('Vui lòng nhập lý do');
    expect(validateReason('abc')).toContain('Lý do cần đủ rõ ràng');
  });
});
