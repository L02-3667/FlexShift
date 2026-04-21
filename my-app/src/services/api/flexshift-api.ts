import type {
  ActivityLogItem,
  AnnouncementItem,
  AuthSession,
  Checklist,
  CreateOpenShiftInput,
  LoginInput,
  NotificationItem,
  OpenShiftView,
  PasswordUpdateInput,
  RequestStatus,
  RequestView,
  ShiftView,
  User,
  UserSetting,
} from '@/src/types/models';

import { apiRequest } from './api-client';

interface CalendarResponse {
  shifts: ShiftView[];
  openShifts: OpenShiftView[];
  requests: RequestView[];
}

interface SyncDomainResponse<T> {
  items: T[];
  deletedIds: string[];
  cursor: number;
}

export interface SyncPullResponse {
  cursor: number;
  serverCursor: number;
  hasMore: boolean;
  serverTime: string;
  staleAfterMs: number;
  domains: {
    shifts: SyncDomainResponse<ShiftView>;
    openShifts: SyncDomainResponse<OpenShiftView>;
    requests: SyncDomainResponse<RequestView>;
    notifications: SyncDomainResponse<NotificationItem>;
    settings: SyncDomainResponse<UserSetting>;
    announcements: SyncDomainResponse<AnnouncementItem>;
    activity: SyncDomainResponse<ActivityLogItem>;
    checklists: SyncDomainResponse<Checklist>;
  };
}

export function loginRequest(input: LoginInput) {
  return apiRequest<AuthSession>('/auth/login', {
    auth: false,
    method: 'POST',
    body: input,
  });
}

export function refreshSessionRequest(refreshToken: string, deviceId?: string) {
  return apiRequest<AuthSession>('/auth/refresh', {
    auth: false,
    method: 'POST',
    body: { refreshToken, deviceId },
  });
}

export function logoutRequest(refreshToken?: string) {
  return apiRequest<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: refreshToken ? { refreshToken } : {},
  });
}

export function getCurrentUserRequest() {
  return apiRequest<User | null>('/auth/me');
}

export function updatePasswordRequest(input: PasswordUpdateInput) {
  return apiRequest<{ success: boolean }>('/auth/password', {
    method: 'PATCH',
    body: input,
  });
}

export function getEmployeesRequest() {
  return apiRequest<User[]>('/users/employees');
}

export function getShiftsRequest(params?: {
  from?: string;
  to?: string;
  status?: string;
  userId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params?.from) {
    searchParams.set('from', params.from);
  }

  if (params?.to) {
    searchParams.set('to', params.to);
  }

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  if (params?.userId) {
    searchParams.set('userId', params.userId);
  }

  const query = searchParams.toString();
  return apiRequest<ShiftView[]>(`/shifts${query ? `?${query}` : ''}`);
}

export function getRequestsRequest(params?: { status?: RequestStatus }) {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.set('status', params.status);
  }

  const query = searchParams.toString();
  return apiRequest<RequestView[]>(`/requests${query ? `?${query}` : ''}`);
}

export function getRequestDetailRequest(id: string) {
  return apiRequest<RequestView>(`/requests/${id}`);
}

export function createLeaveRequestRequest(input: {
  shiftId: string;
  reason: string;
  clientMutationId?: string;
  dedupeKey?: string;
}) {
  return apiRequest<RequestView>('/requests/leave', {
    method: 'POST',
    body: input,
  });
}

export function createYieldRequestRequest(input: {
  shiftId: string;
  targetEmployeeId: string;
  reason: string;
  clientMutationId?: string;
  dedupeKey?: string;
}) {
  return apiRequest<RequestView>('/requests/yield', {
    method: 'POST',
    body: input,
  });
}

export function approveRequestRequest(
  id: string,
  note?: string,
  clientMutationId?: string,
  dedupeKey?: string,
) {
  return apiRequest(`/approvals/${id}/approve`, {
    method: 'POST',
    body: { note, clientMutationId, dedupeKey },
  });
}

export function rejectRequestRequest(
  id: string,
  note?: string,
  clientMutationId?: string,
  dedupeKey?: string,
) {
  return apiRequest(`/approvals/${id}/reject`, {
    method: 'POST',
    body: { note, clientMutationId, dedupeKey },
  });
}

export function getOpenShiftsRequest() {
  return apiRequest<OpenShiftView[]>('/open-shifts');
}

export function getOpenShiftDetailRequest(id: string) {
  return apiRequest<OpenShiftView>(`/open-shifts/${id}`);
}

export function createOpenShiftRequest(
  input: CreateOpenShiftInput & {
    clientMutationId?: string;
    dedupeKey?: string;
  },
) {
  return apiRequest<OpenShiftView>('/open-shifts', {
    method: 'POST',
    body: input,
  });
}

export function claimOpenShiftRequest(
  id: string,
  input?: {
    clientMutationId?: string;
    dedupeKey?: string;
  },
) {
  return apiRequest<ShiftView>(`/open-shifts/${id}/claim`, {
    method: 'POST',
    body: input ?? {},
  });
}

export function getCalendarRequest(params?: { from?: string; to?: string }) {
  const searchParams = new URLSearchParams();

  if (params?.from) {
    searchParams.set('from', params.from);
  }

  if (params?.to) {
    searchParams.set('to', params.to);
  }

  const query = searchParams.toString();
  return apiRequest<CalendarResponse>(`/calendar${query ? `?${query}` : ''}`);
}

export function getEmployeeStatisticsRequest() {
  return apiRequest('/statistics/employee');
}

export function getManagerStatisticsRequest() {
  return apiRequest('/statistics/manager');
}

export function getUserSettingsRequest() {
  return apiRequest<UserSetting>('/settings/me');
}

export function updateUserSettingsRequest(input: Partial<UserSetting>) {
  return apiRequest<UserSetting>('/settings/me', {
    method: 'PATCH',
    body: input,
  });
}

export function getNotificationsRequest() {
  return apiRequest<NotificationItem[]>('/notifications');
}

export function markNotificationReadRequest(id: string) {
  return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function getAnnouncementsRequest() {
  return apiRequest<AnnouncementItem[]>('/announcements');
}

export function acknowledgeAnnouncementRequest(
  id: string,
  input?: {
    clientMutationId?: string;
    dedupeKey?: string;
  },
) {
  return apiRequest<{ success: boolean; acknowledgedAt: string }>(
    `/announcements/${id}/ack`,
    {
      method: 'POST',
      body: input ?? {},
    },
  );
}

export function getActivityRequest(limit = 25) {
  return apiRequest<ActivityLogItem[]>(`/activity?limit=${limit}`);
}

export function getSyncPullRequest(cursor: number, limit = 250) {
  return apiRequest<SyncPullResponse>(
    `/sync/pull?cursor=${cursor}&limit=${limit}`,
  );
}
