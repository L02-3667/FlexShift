import { isShiftWindowChronologicallyValid } from '@/src/utils/date';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function isValidDateInput(value: string) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function isValidTimeInput(value: string) {
  if (!TIME_PATTERN.test(value)) {
    return false;
  }

  const [hours, minutes] = value.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isStartBeforeEnd(startTime: string, endTime: string) {
  return isShiftWindowChronologicallyValid(startTime, endTime);
}

export function validateOpenShiftFields(input: {
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  position: string;
  note: string;
}) {
  if (!isValidDateInput(input.date)) {
    return 'Ngay lam viec can theo dinh dang YYYY-MM-DD.';
  }

  if (!isValidTimeInput(input.startTime) || !isValidTimeInput(input.endTime)) {
    return 'Gio bat dau va ket thuc can theo dinh dang HH:mm.';
  }

  if (!isStartBeforeEnd(input.startTime, input.endTime)) {
    return 'Khung gio khong hop le. Gio ket thuc khong duoc trung gio bat dau.';
  }

  if (!input.storeName.trim()) {
    return 'Vui long nhap cua hang.';
  }

  if (!input.position.trim()) {
    return 'Vui long nhap vi tri.';
  }

  if (!input.note.trim()) {
    return 'Vui long nhap ly do hoac ghi chu cho ca trong.';
  }

  return null;
}

export function validateReason(reason: string) {
  if (!reason.trim()) {
    return 'Vui long nhap ly do.';
  }

  if (reason.trim().length < 6) {
    return 'Ly do can du ro rang de quan ly xem xet.';
  }

  return null;
}
