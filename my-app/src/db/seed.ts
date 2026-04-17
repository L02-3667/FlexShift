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
      fullName: 'Trần Mai Anh',
      role: 'manager',
      phone: '0901 234 567',
      email: 'manager@flexshift.app',
      status: 'active',
    },
    {
      id: employeeLinhId,
      fullName: 'Nguyễn Khánh Linh',
      role: 'employee',
      phone: '0908 222 333',
      email: 'linh@flexshift.app',
      status: 'active',
    },
    {
      id: employeeAnId,
      fullName: 'Phạm Hải An',
      role: 'employee',
      phone: '0909 111 777',
      email: 'an@flexshift.app',
      status: 'active',
    },
    {
      id: employeeBaoId,
      fullName: 'Lê Quốc Bảo',
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
      storeName: 'FlexShift Coffee - Quận 1',
      position: 'Thu ngân',
      status: 'scheduled',
    },
    {
      id: 'shift-linh-2',
      employeeId: employeeLinhId,
      date: day2,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quận 1',
      position: 'Pha chế',
      status: 'scheduled',
    },
    {
      id: 'shift-an-1',
      employeeId: employeeAnId,
      date: day1,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quận 7',
      position: 'Phục vụ',
      status: 'scheduled',
    },
    {
      id: 'shift-an-2',
      employeeId: employeeAnId,
      date: day3,
      startTime: '09:00',
      endTime: '13:00',
      storeName: 'FlexShift Coffee - Quận 1',
      position: 'Thu ngân',
      status: 'scheduled',
    },
    {
      id: 'shift-bao-1',
      employeeId: employeeBaoId,
      date: day4,
      startTime: '15:00',
      endTime: '22:00',
      storeName: 'FlexShift Coffee - Quận 7',
      position: 'Hỗ trợ kho',
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
      storeName: 'FlexShift Coffee - Quận 1',
      position: 'Phục vụ',
      note: 'Ca tối cuối tuần cần bổ sung nhân sự.',
      status: 'open',
      claimedByEmployeeId: null,
    },
    {
      id: 'open-shift-2',
      date: day2,
      startTime: '14:00',
      endTime: '18:00',
      storeName: 'FlexShift Coffee - Quận 7',
      position: 'Thu ngân',
      note: 'Ca phát sinh cần bổ sung gấp cho cửa hàng.',
      status: 'open',
      claimedByEmployeeId: null,
    },
    {
      id: 'open-shift-3',
      date: day3,
      startTime: '18:00',
      endTime: '22:00',
      storeName: 'FlexShift Coffee - Quận 1',
      position: 'Pha chế',
      note: 'Ca closing cần người đã quen quy trình.',
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
      reason: 'Có lịch thi cuối kỳ vào buổi chiều nên cần xin nghỉ ca này.',
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
      reason: 'Muốn nhường ca vì có lịch học thêm buổi sáng.',
      status: 'rejected',
      managerNote: 'Người được đề nghị nhận ca không thể nhận vào ngày này.',
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
      title: 'Yêu cầu đang chờ duyệt',
      body: 'Đơn xin nghỉ của Khánh Linh đang cần quản lý xử lý.',
      type: 'schedule-updated',
      isRead: false,
      createdAt,
    },
    {
      id: 'notification-2',
      title: 'Ca trống mới phù hợp',
      body: 'Đã có ca tối tại Quận 1 có thể nhận ngay.',
      type: 'open-shift-match',
      isRead: false,
      createdAt,
    },
  ];
}
