import type { SQLiteDatabase } from '@/src/db/sqlite-provider';

import {
  ensureUsersExist,
  getAllRequests,
  getAllShifts,
  getCachedActivityLogs,
  getCachedAnnouncements,
  getCachedNotifications,
  getConfirmedSchedule,
  getEmployeeUsers,
  getOpenShiftById,
  getOpenShifts,
  getRequestById,
  getRequestsByEmployee,
  getRequestsSortedByPriority,
  getShiftsByEmployee,
  getUpcomingShiftsByEmployee,
  getUserSetting,
  replaceCachedNotifications,
  replaceOpenShiftsCache,
  replaceUsersCache,
  upsertRequestCache,
  upsertShiftCache,
  upsertUserSetting,
} from '@/src/db/repositories';
import type {
  ActivityLogItem,
  AnnouncementItem,
  NotificationItem,
  OpenShiftView,
  RequestView,
  ShiftView,
  User,
  UserSetting,
} from '@/src/types/models';
import {
  getCalendarRequest,
  getEmployeeStatisticsRequest,
  getEmployeesRequest,
  getManagerStatisticsRequest,
  getNotificationsRequest,
  getOpenShiftDetailRequest,
  getOpenShiftsRequest,
  getRequestDetailRequest,
  getRequestsRequest,
  getUserSettingsRequest,
  getShiftsRequest,
  updateUserSettingsRequest,
} from '@/src/services/api/flexshift-api';
import { getSessionSnapshot } from '@/src/services/session/session-store';

const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
});

const recentFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

type ActivityTone = 'primary' | 'warning' | 'neutral';

interface CalendarAgenda {
  shifts: ShiftView[];
  openShifts: OpenShiftView[];
  requests: RequestView[];
}

export interface ActivityUpdate {
  id: string;
  title: string;
  description: string;
  timestampLabel: string;
  tone: ActivityTone;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  body: string;
  requiresAck: boolean;
  acknowledgedAt: string | null;
  publishedAt: string;
}

export interface CalendarDaySummary {
  date: string;
  weekdayLabel: string;
  dayLabel: string;
  isToday: boolean;
  scheduledCount: number;
  openShiftCount: number;
  pendingRequestCount: number;
}

export interface EmployeeCalendarData {
  days: CalendarDaySummary[];
  selectedDate: string;
  agendaByDate: Record<string, CalendarAgenda>;
  weekSummary: {
    scheduledCount: number;
    openShiftCount: number;
    pendingRequestCount: number;
  };
}

export interface ManagerCalendarData {
  days: CalendarDaySummary[];
  selectedDate: string;
  agendaByDate: Record<string, CalendarAgenda>;
  weekSummary: {
    confirmedShiftCount: number;
    openShiftCount: number;
    pendingRequestCount: number;
  };
}

export interface EmployeeStatisticsData {
  shiftCountThisWeek: number;
  hoursThisWeek: number;
  hoursThisMonth: number;
  pendingRequestCount: number;
  completedShiftCount: number;
  approvalRate: number;
}

export interface ManagerStatisticsData {
  openShiftCount: number;
  pendingRequestCount: number;
  fillRate: number;
  confirmedShiftCount: number;
  approvedRequestCount: number;
  rejectedRequestCount: number;
  allocatedHoursThisWeek: number;
  storeBreakdown: Array<{
    storeName: string;
    confirmedShiftCount: number;
    openShiftCount: number;
  }>;
}

function hasRemoteSession() {
  return Boolean(getSessionSnapshot().session?.accessToken);
}

async function ensureSettingsUserCache(db: SQLiteDatabase, userId: string) {
  const sessionUser = getSessionSnapshot().session?.user;

  await ensureUsersExist(
    db,
    sessionUser && sessionUser.id === userId
      ? [sessionUser]
      : [{ id: userId }],
  );
}

function mergeUsers(currentUser: User | null, employees: User[]) {
  const seen = new Set<string>();
  const nextUsers: User[] = [];

  const append = (user: User | null) => {
    if (!user || seen.has(user.id)) {
      return;
    }

    seen.add(user.id);
    nextUsers.push(user);
  };

  append(currentUser);
  employees.forEach(append);

  return nextUsers;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function getStartOfWeek(baseDate: Date) {
  const copy = new Date(baseDate);
  const currentDay = copy.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function getEndOfWeek(baseDate: Date) {
  const start = getStartOfWeek(baseDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getStartOfMonth(baseDate: Date) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfMonth(baseDate: Date) {
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return end;
}

function isDateWithinRange(date: string, start: Date, end: Date) {
  const value = parseDate(date);
  return value.getTime() >= start.getTime() && value.getTime() <= end.getTime();
}

function getShiftDurationHours(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const durationMinutes =
    endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
  return durationMinutes / 60;
}

function toRecentLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return recentFormatter.format(date);
}

function sortRequestsByRecent(left: RequestView, right: RequestView) {
  return (right.reviewedAt ?? right.createdAt).localeCompare(
    left.reviewedAt ?? left.createdAt,
  );
}

function createEmptyAgenda(): CalendarAgenda {
  return {
    shifts: [],
    openShifts: [],
    requests: [],
  };
}

function buildUpcomingDayWindow(windowSize = 7) {
  const days: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = 0; index < windowSize; index += 1) {
    const value = new Date(today);
    value.setDate(today.getDate() + index);
    days.push(formatDateKey(value));
  }

  return days;
}

function buildCalendarDays(
  days: string[],
  agendaByDate: Record<string, CalendarAgenda>,
): CalendarDaySummary[] {
  const todayKey = formatDateKey(new Date());

  return days.map((date) => {
    const parsed = parseDate(date);
    const agenda = agendaByDate[date] ?? createEmptyAgenda();

    return {
      date,
      weekdayLabel: weekdayFormatter.format(parsed).replace('.', ''),
      dayLabel: `${parsed.getDate()}`.padStart(2, '0'),
      isToday: date === todayKey,
      scheduledCount: agenda.shifts.filter(
        (shift) => shift.status === 'scheduled',
      ).length,
      openShiftCount: agenda.openShifts.length,
      pendingRequestCount: agenda.requests.filter(
        (request) => request.status === 'pending',
      ).length,
    };
  });
}

function pickDefaultCalendarDate(
  days: string[],
  agendaByDate: Record<string, CalendarAgenda>,
) {
  return (
    days.find((date) => {
      const agenda = agendaByDate[date];

      return Boolean(
        agenda &&
        (agenda.shifts.length > 0 ||
          agenda.openShifts.length > 0 ||
          agenda.requests.length > 0),
      );
    }) ?? days[0]
  );
}

function buildNotificationUpdates(
  notifications: NotificationItem[],
): ActivityUpdate[] {
  return notifications.slice(0, 4).map((notification) => ({
    id: notification.id,
    title: notification.title,
    description: notification.body,
    timestampLabel: toRecentLabel(notification.createdAt),
    tone:
      notification.type === 'request-rejected'
        ? 'neutral'
        : notification.type === 'request-approved'
          ? 'primary'
          : notification.type === 'open-shift-match'
            ? 'warning'
            : 'primary',
  }));
}

function buildActivityLogUpdates(
  activityLogs: ActivityLogItem[],
): ActivityUpdate[] {
  return activityLogs.slice(0, 4).map((activity) => ({
    id: activity.id,
    title: activity.summary,
    description: activity.actorUserName
      ? `Thực hiện bởi ${activity.actorUserName}`
      : activity.entityType,
    timestampLabel: toRecentLabel(activity.createdAt),
    tone: activity.action.includes('rejected')
      ? 'neutral'
      : activity.action.includes('created') ||
          activity.action.includes('approved')
        ? 'primary'
        : 'warning',
  }));
}

function buildAnnouncementSummaries(
  announcements: AnnouncementItem[],
): AnnouncementSummary[] {
  return announcements
    .filter(
      (announcement) =>
        !announcement.expiresAt ||
        announcement.expiresAt >= formatIsoDateTime(),
    )
    .slice(0, 3)
    .map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      requiresAck: announcement.requiresAck,
      acknowledgedAt: announcement.acknowledgedAt,
      publishedAt: announcement.publishedAt,
    }));
}

function formatIsoDateTime() {
  return new Date().toISOString();
}

function buildEmployeeUpdates(
  requests: RequestView[],
  upcomingShifts: ShiftView[],
): ActivityUpdate[] {
  const updates = requests
    .slice()
    .sort(sortRequestsByRecent)
    .map<ActivityUpdate>((request) => {
      const title =
        request.status === 'approved'
          ? 'Yêu cầu đã được duyệt'
          : request.status === 'rejected'
            ? 'Yêu cầu cần xem lại'
            : 'Yêu cầu đang chờ duyệt';

      const description =
        request.type === 'leave'
          ? `${request.shiftPosition} tai ${request.shiftStoreName}`
          : `Nhường ca ${request.shiftPosition} cho ${request.targetEmployeeName ?? 'đồng nghiệp'}`;

      return {
        id: request.id,
        title,
        description,
        timestampLabel: toRecentLabel(request.reviewedAt ?? request.createdAt),
        tone:
          request.status === 'pending'
            ? 'warning'
            : request.status === 'approved'
              ? 'primary'
              : 'neutral',
      };
    });

  if (updates.length > 0) {
    return updates.slice(0, 3);
  }

  return upcomingShifts.slice(0, 3).map((shift) => ({
    id: shift.id,
    title: 'Ca đã chốt sắp tới',
    description: `${shift.position}, ${shift.storeName}`,
    timestampLabel: `${shift.date} ${shift.startTime}`,
    tone: 'primary',
  }));
}

function buildManagerUpdates(requests: RequestView[]): ActivityUpdate[] {
  return requests
    .slice()
    .sort(sortRequestsByRecent)
    .slice(0, 4)
    .map((request) => ({
      id: request.id,
      title:
        request.status === 'pending'
          ? `${request.createdByEmployeeName} đang chờ duyệt`
          : request.status === 'approved'
            ? `${request.createdByEmployeeName} đã được duyệt`
            : `${request.createdByEmployeeName} đã bị từ chối`,
      description:
        request.type === 'leave'
          ? `Xin nghỉ ${request.shiftPosition} tại ${request.shiftStoreName}`
          : `Nhường ca ${request.shiftPosition} tại ${request.shiftStoreName}`,
      timestampLabel: toRecentLabel(request.reviewedAt ?? request.createdAt),
      tone:
        request.status === 'pending'
          ? 'warning'
          : request.status === 'approved'
            ? 'primary'
            : 'neutral',
    }));
}

function buildEmployeeDashboardSnapshot(
  upcomingShifts: ShiftView[],
  openShifts: OpenShiftView[],
  requests: RequestView[],
  recentUpdates: ActivityUpdate[],
  announcements: AnnouncementSummary[],
) {
  const currentWeekStart = getStartOfWeek(new Date());
  const currentWeekEnd = getEndOfWeek(new Date());
  const weekShiftCount = upcomingShifts.filter((shift) =>
    isDateWithinRange(shift.date, currentWeekStart, currentWeekEnd),
  ).length;

  return {
    upcomingShifts: upcomingShifts.slice(0, 4),
    openShiftCount: openShifts.length,
    pendingRequestCount: requests.filter(
      (request) => request.status === 'pending',
    ).length,
    weekShiftCount,
    recentUpdates,
    announcements,
  };
}

function buildManagerDashboardSnapshot(
  requests: RequestView[],
  openShifts: OpenShiftView[],
  confirmedSchedule: ShiftView[],
  recentUpdates: ActivityUpdate[],
  announcements: AnnouncementSummary[],
) {
  const pendingRequests = requests.filter(
    (request) => request.status === 'pending',
  );

  return {
    pendingRequests: pendingRequests.slice(0, 4),
    openShiftCount: openShifts.length,
    confirmedShiftCount: confirmedSchedule.length,
    pendingCount: pendingRequests.length,
    recentUpdates,
    announcements,
  };
}

async function syncUsersCache(db: SQLiteDatabase, employees: User[]) {
  const currentSessionUser = getSessionSnapshot().session?.user ?? null;
  await replaceUsersCache(db, mergeUsers(currentSessionUser, employees));
}

async function syncScheduleCache(
  db: SQLiteDatabase,
  input: {
    shifts?: ShiftView[];
    openShifts?: OpenShiftView[];
    requests?: RequestView[];
  },
) {
  if (input.shifts) {
    await upsertShiftCache(db, input.shifts);
  }

  if (input.openShifts) {
    await replaceOpenShiftsCache(db, input.openShifts);
  }

  if (input.requests) {
    await upsertRequestCache(db, input.requests);
  }
}

async function getRemoteNotifications(db: SQLiteDatabase) {
  const notifications = await getNotificationsRequest();
  await replaceCachedNotifications(db, notifications);
  return notifications;
}

async function getLocalNotifications(db: SQLiteDatabase) {
  return getCachedNotifications(db);
}

export async function getEmployeeDashboardData(
  db: SQLiteDatabase,
  employeeId: string,
) {
  if (hasRemoteSession()) {
    try {
      const [
        upcomingShifts,
        openShifts,
        requests,
        notifications,
        announcements,
        activityLogs,
      ] = await Promise.all([
        getShiftsRequest({ status: 'scheduled' }),
        getOpenShiftsRequest(),
        getRequestsRequest(),
        getRemoteNotifications(db),
        getCachedAnnouncements(db),
        getCachedActivityLogs(db),
      ]);

      await syncScheduleCache(db, {
        shifts: upcomingShifts,
        openShifts,
        requests,
      });

      return buildEmployeeDashboardSnapshot(
        upcomingShifts,
        openShifts,
        requests,
        activityLogs.length > 0
          ? buildActivityLogUpdates(activityLogs)
          : buildNotificationUpdates(notifications),
        buildAnnouncementSummaries(announcements),
      );
    } catch {
      const [
        upcomingShifts,
        openShifts,
        requests,
        notifications,
        announcements,
        activityLogs,
      ] = await Promise.all([
        getUpcomingShiftsByEmployee(db, employeeId),
        getOpenShifts(db),
        getRequestsByEmployee(db, employeeId),
        getLocalNotifications(db),
        getCachedAnnouncements(db),
        getCachedActivityLogs(db),
      ]);

      return buildEmployeeDashboardSnapshot(
        upcomingShifts,
        openShifts,
        requests,
        activityLogs.length > 0
          ? buildActivityLogUpdates(activityLogs)
          : notifications.length > 0
            ? buildNotificationUpdates(notifications)
            : buildEmployeeUpdates(requests, upcomingShifts),
        buildAnnouncementSummaries(announcements),
      );
    }
  }

  const [
    upcomingShifts,
    openShifts,
    requests,
    notifications,
    announcements,
    activityLogs,
  ] = await Promise.all([
    getUpcomingShiftsByEmployee(db, employeeId),
    getOpenShifts(db),
    getRequestsByEmployee(db, employeeId),
    getLocalNotifications(db),
    getCachedAnnouncements(db),
    getCachedActivityLogs(db),
  ]);

  return buildEmployeeDashboardSnapshot(
    upcomingShifts,
    openShifts,
    requests,
    activityLogs.length > 0
      ? buildActivityLogUpdates(activityLogs)
      : notifications.length > 0
        ? buildNotificationUpdates(notifications)
        : buildEmployeeUpdates(requests, upcomingShifts),
    buildAnnouncementSummaries(announcements),
  );
}

export async function getManagerDashboardData(db: SQLiteDatabase) {
  if (hasRemoteSession()) {
    try {
      const [
        requests,
        openShifts,
        confirmedSchedule,
        notifications,
        announcements,
        activityLogs,
      ] = await Promise.all([
        getRequestsRequest(),
        getOpenShiftsRequest(),
        getShiftsRequest({ status: 'scheduled' }),
        getRemoteNotifications(db),
        getCachedAnnouncements(db),
        getCachedActivityLogs(db),
      ]);

      await syncScheduleCache(db, {
        shifts: confirmedSchedule,
        openShifts,
        requests,
      });

      return buildManagerDashboardSnapshot(
        requests,
        openShifts,
        confirmedSchedule,
        activityLogs.length > 0
          ? buildActivityLogUpdates(activityLogs)
          : buildNotificationUpdates(notifications),
        buildAnnouncementSummaries(announcements),
      );
    } catch {
      const [
        requests,
        openShifts,
        confirmedSchedule,
        notifications,
        announcements,
        activityLogs,
      ] = await Promise.all([
        getAllRequests(db),
        getOpenShifts(db),
        getConfirmedSchedule(db),
        getLocalNotifications(db),
        getCachedAnnouncements(db),
        getCachedActivityLogs(db),
      ]);

      return buildManagerDashboardSnapshot(
        requests,
        openShifts,
        confirmedSchedule,
        activityLogs.length > 0
          ? buildActivityLogUpdates(activityLogs)
          : notifications.length > 0
            ? buildNotificationUpdates(notifications)
            : buildManagerUpdates(requests),
        buildAnnouncementSummaries(announcements),
      );
    }
  }

  const [
    requests,
    openShifts,
    confirmedSchedule,
    notifications,
    announcements,
    activityLogs,
  ] = await Promise.all([
    getAllRequests(db),
    getOpenShifts(db),
    getConfirmedSchedule(db),
    getLocalNotifications(db),
    getCachedAnnouncements(db),
    getCachedActivityLogs(db),
  ]);

  return buildManagerDashboardSnapshot(
    requests,
    openShifts,
    confirmedSchedule,
    activityLogs.length > 0
      ? buildActivityLogUpdates(activityLogs)
      : notifications.length > 0
        ? buildNotificationUpdates(notifications)
        : buildManagerUpdates(requests),
    buildAnnouncementSummaries(announcements),
  );
}

export async function getEmployeeRequestFormData(
  db: SQLiteDatabase,
  employeeId: string,
) {
  if (hasRemoteSession()) {
    try {
      const [upcomingShifts, employees] = await Promise.all([
        getShiftsRequest({ status: 'scheduled' }),
        getEmployeesRequest(),
      ]);

      await syncUsersCache(db, employees);
      await syncScheduleCache(db, { shifts: upcomingShifts });

      return {
        upcomingShifts,
        coworkers: employees.filter((employee) => employee.id !== employeeId),
      };
    } catch {
      const [upcomingShifts, employees] = await Promise.all([
        getUpcomingShiftsByEmployee(db, employeeId),
        getEmployeeUsers(db),
      ]);

      return {
        upcomingShifts,
        coworkers: employees.filter((employee) => employee.id !== employeeId),
      };
    }
  }

  const [upcomingShifts, employees] = await Promise.all([
    getUpcomingShiftsByEmployee(db, employeeId),
    getEmployeeUsers(db),
  ]);

  return {
    upcomingShifts,
    coworkers: employees.filter((employee) => employee.id !== employeeId),
  };
}

export async function getOpenShiftListingSummary(db: SQLiteDatabase) {
  if (hasRemoteSession()) {
    try {
      const openShifts = await getOpenShiftsRequest();
      await replaceOpenShiftsCache(db, openShifts);
      return {
        openShifts,
        total: openShifts.length,
      };
    } catch {
      const openShifts = await getOpenShifts(db);
      return {
        openShifts,
        total: openShifts.length,
      };
    }
  }

  const openShifts = await getOpenShifts(db);
  return {
    openShifts,
    total: openShifts.length,
  };
}

function buildCalendarSnapshot(
  days: string[],
  agendaByDate: Record<string, CalendarAgenda>,
) {
  return {
    days: buildCalendarDays(days, agendaByDate),
    selectedDate: pickDefaultCalendarDate(days, agendaByDate),
    agendaByDate,
  };
}

function buildEmployeeCalendarSnapshot(
  days: string[],
  agendaByDate: Record<string, CalendarAgenda>,
) {
  return {
    ...buildCalendarSnapshot(days, agendaByDate),
    weekSummary: {
      scheduledCount: Object.values(agendaByDate).reduce(
        (total, agenda) => total + agenda.shifts.length,
        0,
      ),
      openShiftCount: Object.values(agendaByDate).reduce(
        (total, agenda) => total + agenda.openShifts.length,
        0,
      ),
      pendingRequestCount: Object.values(agendaByDate).reduce(
        (total, agenda) =>
          total +
          agenda.requests.filter((request) => request.status === 'pending')
            .length,
        0,
      ),
    },
  };
}

function buildManagerCalendarSnapshot(
  days: string[],
  agendaByDate: Record<string, CalendarAgenda>,
) {
  return {
    ...buildCalendarSnapshot(days, agendaByDate),
    weekSummary: {
      confirmedShiftCount: Object.values(agendaByDate).reduce(
        (total, agenda) => total + agenda.shifts.length,
        0,
      ),
      openShiftCount: Object.values(agendaByDate).reduce(
        (total, agenda) => total + agenda.openShifts.length,
        0,
      ),
      pendingRequestCount: Object.values(agendaByDate).reduce(
        (total, agenda) =>
          total +
          agenda.requests.filter((request) => request.status === 'pending')
            .length,
        0,
      ),
    },
  };
}

function buildAgendaForDays(
  days: string[],
  shifts: ShiftView[],
  openShifts: OpenShiftView[],
  requests: RequestView[],
) {
  const agendaByDate: Record<string, CalendarAgenda> = Object.fromEntries(
    days.map((date) => [date, createEmptyAgenda()]),
  );

  shifts.forEach((shift) => {
    if (agendaByDate[shift.date]) {
      agendaByDate[shift.date].shifts.push(shift);
    }
  });

  openShifts.forEach((openShift) => {
    if (agendaByDate[openShift.date]) {
      agendaByDate[openShift.date].openShifts.push(openShift);
    }
  });

  requests.forEach((request) => {
    if (agendaByDate[request.shiftDate]) {
      agendaByDate[request.shiftDate].requests.push(request);
    }
  });

  return agendaByDate;
}

export async function getEmployeeCalendarData(
  db: SQLiteDatabase,
  employeeId: string,
) {
  const days = buildUpcomingDayWindow();

  if (hasRemoteSession()) {
    try {
      const calendar = await getCalendarRequest({
        from: days[0],
        to: days[days.length - 1],
      });

      await syncScheduleCache(db, calendar);

      const agendaByDate = buildAgendaForDays(
        days,
        calendar.shifts,
        calendar.openShifts,
        calendar.requests,
      );
      return buildEmployeeCalendarSnapshot(days, agendaByDate);
    } catch {
      const [upcomingShifts, openShifts, requests] = await Promise.all([
        getUpcomingShiftsByEmployee(db, employeeId),
        getOpenShifts(db),
        getRequestsByEmployee(db, employeeId),
      ]);

      const agendaByDate = buildAgendaForDays(
        days,
        upcomingShifts,
        openShifts,
        requests,
      );
      return buildEmployeeCalendarSnapshot(days, agendaByDate);
    }
  }

  const [upcomingShifts, openShifts, requests] = await Promise.all([
    getUpcomingShiftsByEmployee(db, employeeId),
    getOpenShifts(db),
    getRequestsByEmployee(db, employeeId),
  ]);

  const agendaByDate = buildAgendaForDays(
    days,
    upcomingShifts,
    openShifts,
    requests,
  );
  return buildEmployeeCalendarSnapshot(days, agendaByDate);
}

export async function getManagerCalendarData(db: SQLiteDatabase) {
  const days = buildUpcomingDayWindow();

  if (hasRemoteSession()) {
    try {
      const calendar = await getCalendarRequest({
        from: days[0],
        to: days[days.length - 1],
      });

      await syncScheduleCache(db, calendar);

      const agendaByDate = buildAgendaForDays(
        days,
        calendar.shifts,
        calendar.openShifts,
        calendar.requests,
      );
      return buildManagerCalendarSnapshot(days, agendaByDate);
    } catch {
      const [confirmedSchedule, openShifts, requests] = await Promise.all([
        getConfirmedSchedule(db),
        getOpenShifts(db),
        getAllRequests(db),
      ]);

      const agendaByDate = buildAgendaForDays(
        days,
        confirmedSchedule,
        openShifts,
        requests,
      );
      return buildManagerCalendarSnapshot(days, agendaByDate);
    }
  }

  const [confirmedSchedule, openShifts, requests] = await Promise.all([
    getConfirmedSchedule(db),
    getOpenShifts(db),
    getAllRequests(db),
  ]);

  const agendaByDate = buildAgendaForDays(
    days,
    confirmedSchedule,
    openShifts,
    requests,
  );
  return buildManagerCalendarSnapshot(days, agendaByDate);
}

function buildEmployeeStatisticsSnapshot(
  shifts: ShiftView[],
  requests: RequestView[],
) {
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const monthEnd = getEndOfMonth(now);

  const scheduledShifts = shifts.filter(
    (shift) => shift.status === 'scheduled',
  );
  const weeklyShifts = scheduledShifts.filter((shift) =>
    isDateWithinRange(shift.date, weekStart, weekEnd),
  );
  const monthlyShifts = scheduledShifts.filter((shift) =>
    isDateWithinRange(shift.date, monthStart, monthEnd),
  );
  const completedShiftCount = shifts.filter(
    (shift) => shift.status === 'completed',
  ).length;
  const resolvedRequests = requests.filter(
    (request) => request.status !== 'pending',
  );
  const approvedRequests = resolvedRequests.filter(
    (request) => request.status === 'approved',
  );

  return {
    shiftCountThisWeek: weeklyShifts.length,
    hoursThisWeek: weeklyShifts.reduce(
      (total, shift) =>
        total + getShiftDurationHours(shift.startTime, shift.endTime),
      0,
    ),
    hoursThisMonth: monthlyShifts.reduce(
      (total, shift) =>
        total + getShiftDurationHours(shift.startTime, shift.endTime),
      0,
    ),
    pendingRequestCount: requests.filter(
      (request) => request.status === 'pending',
    ).length,
    completedShiftCount,
    approvalRate:
      resolvedRequests.length > 0
        ? Math.round((approvedRequests.length / resolvedRequests.length) * 100)
        : 0,
  };
}

function buildManagerStatisticsSnapshot(
  shifts: ShiftView[],
  requests: RequestView[],
  openShifts: OpenShiftView[],
) {
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);
  const scheduledShifts = shifts.filter(
    (shift) => shift.status === 'scheduled',
  );

  const storeMap = new Map<
    string,
    {
      storeName: string;
      confirmedShiftCount: number;
      openShiftCount: number;
    }
  >();

  scheduledShifts.forEach((shift) => {
    const current = storeMap.get(shift.storeName) ?? {
      storeName: shift.storeName,
      confirmedShiftCount: 0,
      openShiftCount: 0,
    };

    current.confirmedShiftCount += 1;
    storeMap.set(shift.storeName, current);
  });

  openShifts.forEach((shift) => {
    const current = storeMap.get(shift.storeName) ?? {
      storeName: shift.storeName,
      confirmedShiftCount: 0,
      openShiftCount: 0,
    };

    current.openShiftCount += 1;
    storeMap.set(shift.storeName, current);
  });

  const denominator = scheduledShifts.length + openShifts.length;

  return {
    openShiftCount: openShifts.length,
    pendingRequestCount: requests.filter(
      (request) => request.status === 'pending',
    ).length,
    fillRate:
      denominator > 0
        ? Math.round((scheduledShifts.length / denominator) * 100)
        : 100,
    confirmedShiftCount: scheduledShifts.length,
    approvedRequestCount: requests.filter(
      (request) => request.status === 'approved',
    ).length,
    rejectedRequestCount: requests.filter(
      (request) => request.status === 'rejected',
    ).length,
    allocatedHoursThisWeek: scheduledShifts
      .filter((shift) => isDateWithinRange(shift.date, weekStart, weekEnd))
      .reduce(
        (total, shift) =>
          total + getShiftDurationHours(shift.startTime, shift.endTime),
        0,
      ),
    storeBreakdown: Array.from(storeMap.values()).sort((left, right) =>
      left.storeName.localeCompare(right.storeName),
    ),
  };
}

export async function getEmployeeStatisticsData(
  db: SQLiteDatabase,
  employeeId: string,
) {
  if (hasRemoteSession()) {
    try {
      return (await getEmployeeStatisticsRequest()) as EmployeeStatisticsData;
    } catch {
      const [shifts, requests] = await Promise.all([
        getShiftsByEmployee(db, employeeId),
        getRequestsByEmployee(db, employeeId),
      ]);

      return buildEmployeeStatisticsSnapshot(shifts, requests);
    }
  }

  const [shifts, requests] = await Promise.all([
    getShiftsByEmployee(db, employeeId),
    getRequestsByEmployee(db, employeeId),
  ]);

  return buildEmployeeStatisticsSnapshot(shifts, requests);
}

export async function getManagerStatisticsData(db: SQLiteDatabase) {
  if (hasRemoteSession()) {
    try {
      return (await getManagerStatisticsRequest()) as ManagerStatisticsData;
    } catch {
      const [shifts, requests, openShifts] = await Promise.all([
        getAllShifts(db),
        getAllRequests(db),
        getOpenShifts(db),
      ]);

      return buildManagerStatisticsSnapshot(shifts, requests, openShifts);
    }
  }

  const [shifts, requests, openShifts] = await Promise.all([
    getAllShifts(db),
    getAllRequests(db),
    getOpenShifts(db),
  ]);

  return buildManagerStatisticsSnapshot(shifts, requests, openShifts);
}

export async function getMyRequestsData(
  db: SQLiteDatabase,
  employeeId: string,
) {
  if (hasRemoteSession()) {
    try {
      const requests = await getRequestsRequest();
      await upsertRequestCache(db, requests);
      return requests;
    } catch {
      return getRequestsByEmployee(db, employeeId);
    }
  }

  return getRequestsByEmployee(db, employeeId);
}

export async function getApprovalRequestsData(db: SQLiteDatabase) {
  if (hasRemoteSession()) {
    try {
      const requests = await getRequestsRequest();
      await upsertRequestCache(db, requests);
      return requests.sort((left, right) => {
        if (left.status === 'pending' && right.status !== 'pending') {
          return -1;
        }

        if (left.status !== 'pending' && right.status === 'pending') {
          return 1;
        }

        return (right.reviewedAt ?? right.createdAt).localeCompare(
          left.reviewedAt ?? left.createdAt,
        );
      });
    } catch {
      return getRequestsSortedByPriority(db);
    }
  }

  return getRequestsSortedByPriority(db);
}

export async function getRequestDetailData(
  db: SQLiteDatabase,
  requestId: string,
) {
  if (hasRemoteSession()) {
    try {
      const request = await getRequestDetailRequest(requestId);
      await upsertRequestCache(db, [request]);
      return request;
    } catch {
      return getRequestById(db, requestId);
    }
  }

  return getRequestById(db, requestId);
}

export async function getOpenShiftDetailData(
  db: SQLiteDatabase,
  openShiftId: string,
) {
  if (hasRemoteSession()) {
    try {
      return await getOpenShiftDetailRequest(openShiftId);
    } catch {
      return getOpenShiftById(db, openShiftId);
    }
  }

  return getOpenShiftById(db, openShiftId);
}

export async function getSettingsData(db: SQLiteDatabase, userId: string) {
  if (hasRemoteSession()) {
    try {
      const settings = await getUserSettingsRequest();
      await ensureSettingsUserCache(db, settings.userId);
      await upsertUserSetting(db, {
        userId: settings.userId,
        notificationsEnabled: settings.notificationsEnabled,
        approvalUpdatesEnabled: settings.approvalUpdatesEnabled,
        openShiftAlertsEnabled: settings.openShiftAlertsEnabled,
        remindersEnabled: settings.remindersEnabled,
        reminderMinutesBefore: settings.reminderMinutesBefore,
        language: settings.language,
        theme: settings.theme,
      });
      return settings;
    } catch {
      return getUserSetting(db, userId);
    }
  }

  return getUserSetting(db, userId);
}

export async function saveSettingsData(
  db: SQLiteDatabase,
  userId: string,
  patch: Partial<UserSetting>,
) {
  if (hasRemoteSession()) {
    try {
      const settings = await updateUserSettingsRequest(patch);
      await ensureSettingsUserCache(db, settings.userId);
      await upsertUserSetting(db, {
        userId: settings.userId,
        notificationsEnabled: settings.notificationsEnabled,
        approvalUpdatesEnabled: settings.approvalUpdatesEnabled,
        openShiftAlertsEnabled: settings.openShiftAlertsEnabled,
        remindersEnabled: settings.remindersEnabled,
        reminderMinutesBefore: settings.reminderMinutesBefore,
        language: settings.language,
        theme: settings.theme,
      });
      return settings;
    } catch {
      const current = await getUserSetting(db, userId);
      await ensureSettingsUserCache(db, userId);
      return upsertUserSetting(db, {
        userId,
        notificationsEnabled:
          patch.notificationsEnabled ?? current.notificationsEnabled,
        approvalUpdatesEnabled:
          patch.approvalUpdatesEnabled ?? current.approvalUpdatesEnabled,
        openShiftAlertsEnabled:
          patch.openShiftAlertsEnabled ?? current.openShiftAlertsEnabled,
        remindersEnabled: patch.remindersEnabled ?? current.remindersEnabled,
        reminderMinutesBefore:
          patch.reminderMinutesBefore ?? current.reminderMinutesBefore,
        language: patch.language ?? current.language,
        theme: patch.theme ?? current.theme,
      });
    }
  }

  const current = await getUserSetting(db, userId);
  await ensureSettingsUserCache(db, userId);
  return upsertUserSetting(db, {
    userId,
    notificationsEnabled:
      patch.notificationsEnabled ?? current.notificationsEnabled,
    approvalUpdatesEnabled:
      patch.approvalUpdatesEnabled ?? current.approvalUpdatesEnabled,
    openShiftAlertsEnabled:
      patch.openShiftAlertsEnabled ?? current.openShiftAlertsEnabled,
    remindersEnabled: patch.remindersEnabled ?? current.remindersEnabled,
    reminderMinutesBefore:
      patch.reminderMinutesBefore ?? current.reminderMinutesBefore,
    language: patch.language ?? current.language,
    theme: patch.theme ?? current.theme,
  });
}
