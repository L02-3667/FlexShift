import type {
  OpenShiftStatus,
  RequestStatus,
  RequestType,
  ShiftStatus,
  UserRole,
  UserStatus,
} from '@/src/types/models';

export const ROLE_LABELS: Record<UserRole, string> = {
  employee: 'Nhan vien',
  manager: 'Quan ly',
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Dang hoat dong',
  inactive: 'Tam ngung',
};

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  scheduled: 'Da xep ca',
  completed: 'Hoan tat',
  cancelled: 'Da huy',
};

export const OPEN_SHIFT_STATUS_LABELS: Record<OpenShiftStatus, string> = {
  open: 'Dang mo',
  claimed: 'Da nhan',
  cancelled: 'Da huy',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Cho duyet',
  approved: 'Da duyet',
  rejected: 'Tu choi',
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  leave: 'Xin nghi',
  yield: 'Nhuong ca',
};

export const STORE_OPTIONS = [
  'FlexShift Coffee - Quan 1',
  'FlexShift Coffee - Quan 7',
];
export const POSITION_OPTIONS = [
  'Thu ngan',
  'Phuc vu',
  'Pha che',
  'Ho tro kho',
];
