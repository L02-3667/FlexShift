export type UserRole = 'employee' | 'manager';
export type UserStatus = 'active' | 'inactive';
export type ShiftStatus = 'scheduled' | 'completed' | 'cancelled';
export type OpenShiftStatus = 'open' | 'claimed' | 'cancelled';
export type RequestType = 'leave' | 'yield';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type AppThemePreference = 'system' | 'light';
export type AppLanguagePreference = 'vi';
export type SessionStatus =
  | 'idle'
  | 'restoring'
  | 'authenticated'
  | 'unauthenticated';
export type NotificationType =
  | 'request-approved'
  | 'request-rejected'
  | 'shift-assigned'
  | 'open-shift-match'
  | 'schedule-updated'
  | 'announcement-published';
export type PendingMutationStatus =
  | 'queued'
  | 'sending'
  | 'failed'
  | 'conflict'
  | 'completed';
export type PendingMutationType =
  | 'open_shift_create'
  | 'open_shift_claim'
  | 'request_leave'
  | 'request_yield'
  | 'request_approve'
  | 'request_reject'
  | 'announcement_ack';
export type SyncNetworkState = 'online' | 'offline' | 'degraded';
export type SyncLifecycleStatus = 'idle' | 'syncing' | 'error';
export type ChecklistStatus = 'open' | 'in_progress' | 'completed';

export interface User {
  id: string;
  fullName: string;
  role: UserRole;
  phone: string;
  email: string;
  status: UserStatus;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
}

export interface AuthSession extends SessionTokens {
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
}

export interface PasswordUpdateInput {
  currentPassword: string;
  nextPassword: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  position: string;
  status: ShiftStatus;
  updatedAt?: string;
}

export interface OpenShift {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  position: string;
  note: string;
  status: OpenShiftStatus;
  claimedByEmployeeId: string | null;
  updatedAt?: string;
}

export interface ShiftRequest {
  id: string;
  type: RequestType;
  createdByEmployeeId: string;
  shiftId: string;
  targetEmployeeId: string | null;
  reason: string;
  status: RequestStatus;
  managerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  updatedAt?: string;
}

export interface ApprovalAction {
  requestId: string;
  managerId: string;
  action: Exclude<RequestStatus, 'pending'>;
  managerNote?: string;
  reviewedAt: string;
}

export interface ShiftView extends Shift {
  employeeName: string;
}

export interface OpenShiftView extends OpenShift {
  claimedByEmployeeName: string | null;
}

export interface RequestView extends ShiftRequest {
  createdByEmployeeName: string;
  targetEmployeeName: string | null;
  shiftDate: string;
  shiftStartTime: string;
  shiftEndTime: string;
  shiftStoreName: string;
  shiftPosition: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  requiresAck: boolean;
  acknowledgedAt: string | null;
  publishedAt: string;
  expiresAt: string | null;
  updatedAt?: string;
}

export interface ActivityLogItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorUserId: string | null;
  actorUserName: string | null;
  createdAt: string;
  payload?: unknown;
}

export interface ChecklistItem {
  id: string;
  label: string;
  sortOrder: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export interface Checklist {
  id: string;
  title: string;
  description: string | null;
  status: ChecklistStatus;
  assigneeId: string | null;
  dueAt: string | null;
  updatedAt: string;
  items: ChecklistItem[];
}

export interface UserSetting {
  userId: string;
  notificationsEnabled: boolean;
  approvalUpdatesEnabled: boolean;
  openShiftAlertsEnabled: boolean;
  remindersEnabled: boolean;
  reminderMinutesBefore: number;
  language: AppLanguagePreference;
  theme: AppThemePreference;
  updatedAt: string;
}

export interface EmployeeDashboardData {
  upcomingShifts: ShiftView[];
  openShiftCount: number;
  pendingRequestCount: number;
}

export interface ManagerDashboardData {
  pendingRequests: RequestView[];
  openShiftCount: number;
  confirmedShiftCount: number;
}

export interface CreateOpenShiftInput {
  date: string;
  startTime: string;
  endTime: string;
  storeName: string;
  position: string;
  note: string;
}

export interface CreateLeaveRequestInput {
  createdByEmployeeId: string;
  shiftId: string;
  reason: string;
}

export interface CreateYieldRequestInput {
  createdByEmployeeId: string;
  shiftId: string;
  targetEmployeeId: string;
  reason: string;
}

export type CreateSwapRequestInput = CreateYieldRequestInput;

export interface PendingMutationRecord {
  clientMutationId: string;
  type: PendingMutationType;
  payload: string;
  entityId: string | null;
  entityType: string;
  createdAt: string;
  retryCount: number;
  status: PendingMutationStatus;
  lastError: string | null;
  requiresNetwork: boolean;
  dedupeKey: string;
}

export interface SyncStatusSnapshot {
  networkState: SyncNetworkState;
  lifecycle: SyncLifecycleStatus;
  pendingMutationCount: number;
  lastSuccessfulSyncAt: string | null;
  lastAttemptedSyncAt: string | null;
  lastError: string | null;
  serverCursor: number;
  activeUserId: string | null;
}

export interface MutationActionResult {
  delivery: 'sent' | 'queued';
  clientMutationId: string;
}
