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
        position: 'Thu ngan',
        note: 'Ca dem can bo sung.',
      }),
    ).toBeNull();

    expect(
      validateOpenShiftFields({
        date: '2026-04-11',
        startTime: '22:00',
        endTime: '22:00',
        storeName: 'Central Market',
        position: 'Thu ngan',
        note: 'Khong hop le.',
      }),
    ).toContain('Khung gio khong hop le');
  });

  it('rejects short reasons and missing fields', () => {
    expect(validateReason('')).toContain('Vui long nhap ly do');
    expect(validateReason('abc')).toContain('Ly do can du ro rang');
  });
});
