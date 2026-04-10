import type {
  AnnouncementItem,
  OpenShiftView,
  RequestView,
  SyncStatusSnapshot,
  User,
  UserSetting,
} from '@/src/types/models';

export const managerUser: User = {
  id: 'manager-1',
  fullName: 'Le Hoang Quan',
  role: 'manager',
  phone: '0901000001',
  email: 'manager@flexshift.app',
  status: 'active',
};

export const employeeUser: User = {
  id: 'employee-1',
  fullName: 'An Nguyen',
  role: 'employee',
  phone: '0901000002',
  email: 'an.nguyen@flexshift.app',
  status: 'active',
};

export const sampleOpenShift: OpenShiftView = {
  id: 'open-1',
  date: '2026-04-13',
  startTime: '09:00',
  endTime: '13:00',
  storeName: 'Central Market',
  position: 'Thu ngan',
  note: 'Can bo sung gap cho ca sang.',
  status: 'open',
  claimedByEmployeeId: null,
  claimedByEmployeeName: null,
  updatedAt: '2026-04-10T08:00:00.000Z',
};

export const sampleRequest: RequestView = {
  id: 'request-1',
  type: 'leave',
  createdByEmployeeId: employeeUser.id,
  shiftId: 'shift-1',
  targetEmployeeId: null,
  reason: 'Can nghi mot buoi de xu ly viec gia dinh.',
  status: 'pending',
  managerNote: null,
  createdAt: '2026-04-10T08:00:00.000Z',
  reviewedAt: null,
  updatedAt: '2026-04-10T08:00:00.000Z',
  createdByEmployeeName: employeeUser.fullName,
  targetEmployeeName: null,
  shiftDate: '2026-04-11',
  shiftStartTime: '08:00',
  shiftEndTime: '12:00',
  shiftStoreName: 'Central Market',
  shiftPosition: 'Thu ngan',
};

export const sampleAnnouncement: AnnouncementItem = {
  id: 'announcement-1',
  title: 'Cap nhat quy trinh giao ca',
  body: 'Moi ca toi can xac nhan handover note truoc khi roi cua hang.',
  requiresAck: true,
  acknowledgedAt: null,
  publishedAt: '2026-04-10T08:00:00.000Z',
  expiresAt: null,
  updatedAt: '2026-04-10T08:00:00.000Z',
};

export const sampleSyncStatus: SyncStatusSnapshot = {
  networkState: 'offline',
  lifecycle: 'idle',
  pendingMutationCount: 2,
  lastSuccessfulSyncAt: '2026-04-10T08:00:00.000Z',
  lastAttemptedSyncAt: '2026-04-10T08:05:00.000Z',
  lastError: null,
  serverCursor: 10,
  activeUserId: employeeUser.id,
};

export const sampleSettings: UserSetting = {
  userId: managerUser.id,
  notificationsEnabled: true,
  approvalUpdatesEnabled: true,
  openShiftAlertsEnabled: true,
  remindersEnabled: true,
  reminderMinutesBefore: 60,
  language: 'vi',
  theme: 'system',
  updatedAt: '2026-04-10T08:00:00.000Z',
};
