import { toMinutes } from '@/src/utils/date';

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
  return toMinutes(startTime) < toMinutes(endTime);
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
    return 'Ngày làm việc cần theo định dạng YYYY-MM-DD.';
  }

  if (!isValidTimeInput(input.startTime) || !isValidTimeInput(input.endTime)) {
    return 'Giờ bắt đầu và kết thúc cần theo định dạng HH:mm.';
  }

  if (!isStartBeforeEnd(input.startTime, input.endTime)) {
    return 'Giờ kết thúc phải lớn hơn giờ bắt đầu.';
  }

  if (!input.storeName.trim()) {
    return 'Vui lòng nhập cửa hàng.';
  }

  if (!input.position.trim()) {
    return 'Vui lòng nhập vị trí.';
  }

  if (!input.note.trim()) {
    return 'Vui lòng nhập lý do hoặc ghi chú cho ca trống.';
  }

  return null;
}

export function validateReason(reason: string) {
  if (!reason.trim()) {
    return 'Vui lòng nhập lý do.';
  }

  if (reason.trim().length < 6) {
    return 'Lý do cần đủ rõ ràng để quản lý xem xét.';
  }

  return null;
}
