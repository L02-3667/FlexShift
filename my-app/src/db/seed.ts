import type {
  NotificationItem,
  OpenShift,
  Shift,
  ShiftRequest,
  User,
} from '@/src/types/models';
import { addDays, formatDateInput, formatIsoTimestamp } from '@/src/utils/date';

const managerId = 'user-manager-1';
const employeeLinhId = 'user-employee-1';
const employeeAnId = 'user-employee-2';
const employeeBaoId = 'user-employee-3';

export function getSeedUserIds() {
  return {
    managerId,
    employeeLinhId,
    employeeAnId,
    employeeBaoId,
  };
}

export function buildSeedUsers(): User[] {
  return [
    {
      id: managerId,
      fullName: 'Tran Mai Anh',
      role: 'manager',
      phone: '0901 234 567',
      email: 'manager@flexshift.app',
      status: 'active',
    },
    {
      id: employeeLinhId,
      fullName: 'Nguyen Khanh Linh',
      role: 'employee',
      phone: '0908 222 333',
      email: 'linh@flexshift.app',
      status: 'active',
    },
    {
      id: employeeAnId,
      fullName: 'Pham Hai An',
      role: 'employee',
      phone: '0909 111 777',
      email: 'an@flexshift.app',
      status: 'active',
    },
    {
      id: employeeBaoId,
      fullName: 'Le Quoc Bao',
      role: 'employee',
      phone: '0912 456 999',
      email: 'bao@flexshift.app',
      status: 'active',
    },
  ];
}

export function buildSeedShifts(): Shift[] {
  const now = new Date();
  const day1 = formatDateInput(addDays(now, 1));
  const day2 = formatDateInput(addDays(now, 2));
  const day3 = formatDateInput(addDays(now, 3));
  const day4 = formatDateInput(addDays(now, 4));

  return [
    {
      id: 'shift-linh-1',
      employeeId: employeeLinhId,
      date: day1,
      startTime: '09:00',
      endTime: '13:00',
      storeName: 'FlexShift Coffee - Quan 1',
      position: 'Thu ngan',
      status: 'scheduled',
    },
    {
      id: 'shift-linh-2',
      employeeId: employeeLinhId,
      date: day2,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quan 1',
      position: 'Pha che',
      status: 'scheduled',
    },
    {
      id: 'shift-an-1',
      employeeId: employeeAnId,
      date: day1,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quan 7',
      position: 'Phuc vu',
      status: 'scheduled',
    },
    {
      id: 'shift-an-2',
      employeeId: employeeAnId,
      date: day3,
      startTime: '09:00',
      endTime: '13:00',
      storeName: 'FlexShift Coffee - Quan 1',
      position: 'Thu ngan',
      status: 'scheduled',
    },
    {
      id: 'shift-bao-1',
      employeeId: employeeBaoId,
      date: day4,
      startTime: '15:00',
      endTime: '22:00',
      storeName: 'FlexShift Coffee - Quan 7',
      position: 'Ho tro kho',
      status: 'scheduled',
    },
  ];
}

export function buildSeedOpenShifts(): OpenShift[] {
  const now = new Date();
  const day1 = formatDateInput(addDays(now, 1));
  const day2 = formatDateInput(addDays(now, 2));
  const day3 = formatDateInput(addDays(now, 3));

  return [
    {
      id: 'open-shift-1',
      date: day1,
      startTime: '18:00',
      endTime: '22:00',
      storeName: 'FlexShift Coffee - Quan 1',
      position: 'Phuc vu',
      note: 'Ca toi cuoi tuan can bo sung nhan su.',
      status: 'open',
      claimedByEmployeeId: null,
    },
    {
      id: 'open-shift-2',
      date: day2,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quan 7',
      position: 'Thu ngan',
      note: 'Ca phat sinh can bo sung gap cho cua hang.',
      status: 'open',
      claimedByEmployeeId: null,
    },
    {
      id: 'open-shift-3',
      date: day3,
      startTime: '18:00',
      endTime: '22:00',
      storeName: 'FlexShift Coffee - Quan 1',
      position: 'Pha che',
      note: 'Ca closing can nguoi da quen quy trinh.',
      status: 'open',
      claimedByEmployeeId: null,
    },
  ];
}

export function buildSeedRequests(): ShiftRequest[] {
  const createdAt = formatIsoTimestamp();

  return [
    {
      id: 'request-leave-1',
      type: 'leave',
      createdByEmployeeId: employeeLinhId,
      shiftId: 'shift-linh-2',
      targetEmployeeId: null,
      reason: 'Co lich thi cuoi ky vao buoi chieu nen can xin nghi ca nay.',
      status: 'pending',
      managerNote: null,
      createdAt,
      reviewedAt: null,
    },
    {
      id: 'request-yield-1',
      type: 'yield',
      createdByEmployeeId: employeeAnId,
      shiftId: 'shift-an-2',
      targetEmployeeId: employeeBaoId,
      reason: 'Muon nhuong ca vi co lich hoc them buoi sang.',
      status: 'rejected',
      managerNote: 'Nguoi duoc de nghi nhan ca khong the nhan vao ngay nay.',
      createdAt,
      reviewedAt: createdAt,
    },
  ];
}

export function buildSeedNotifications(): NotificationItem[] {
  const createdAt = formatIsoTimestamp();

  return [
    {
      id: 'notification-1',
      title: 'Yeu cau dang cho duyet',
      body: 'Don xin nghi cua Khanh Linh dang can quan ly xu ly.',
      type: 'schedule-updated',
      isRead: false,
      createdAt,
    },
    {
      id: 'notification-2',
      title: 'Ca trong moi phu hop',
      body: 'Da co ca toi tai Quan 1 co the nhan ngay.',
      type: 'open-shift-match',
      isRead: false,
      createdAt,
    },
  ];
}
