import type {
  OpenShiftStatus,
  RequestStatus,
  RequestType,
  ShiftStatus,
  UserRole,
  UserStatus,
} from '@/src/types/models';

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Nhân viên',
  manager: 'Quản lý',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Đang hoạt động',
  inactive: 'Tạm ngưng',
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: 'Đã xếp ca',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

export const OPEN_SHIFT_STATUS_LABELS: Record<OpenShiftStatus, string> = {
  open: 'Đang mở',
  claimed: 'Đã nhận',
  cancelled: 'Đã hủy',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  leave: 'Xin nghỉ',
  yield: 'Nhường ca',
};

export const STORE_OPTIONS = [
  'FlexShift Coffee - Quận 1',
  'FlexShift Coffee - Quận 7',
];
export const POSITION_OPTIONS = [
  'Thu ngân',
  'Phục vụ',
  'Pha chế',
  'Hỗ trợ kho',
];
