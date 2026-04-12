import type { SQLiteDatabase } from '@/src/db/sqlite-provider';

import type {
  ApprovalAction,
  ActivityLogItem,
  AppLanguagePreference,
  AppThemePreference,
  AnnouncementItem,
  Checklist,
  CreateLeaveRequestInput,
  CreateOpenShiftInput,
  CreateYieldRequestInput,
  NotificationItem,
  OpenShiftView,
  PendingMutationRecord,
  PendingMutationStatus,
  RequestView,
  Shift,
  ShiftRequest,
  SyncStatusSnapshot,
  ShiftView,
  User,
  UserSetting,
} from '@/src/types/models';
import {
  compareDateTime,
  formatIsoTimestamp,
  getAdjacentDateStrings,
  isUpcoming,
} from '@/src/utils/date';
import { createId } from '@/src/utils/id';
import { checkShiftConflict } from '@/src/utils/shift-conflicts';

interface UserSettingRow {
  userId: string;
  notificationsEnabled: number;
  approvalUpdatesEnabled: number;
  openShiftAlertsEnabled: number;
  remindersEnabled: number;
  reminderMinutesBefore: number;
  language: AppLanguagePreference;
  theme: AppThemePreference;
  updatedAt: string;
}

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: NotificationItem['type'];
  isRead: number;
  createdAt: string;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  requiresAck: number;
  acknowledgedAt: string | null;
  publishedAt: string;
  expiresAt: string | null;
  updatedAt: string;
}

interface ActivityLogRow {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  actorUserId: string | null;
  actorUserName: string | null;
  payload: string | null;
  createdAt: string;
}

interface PendingMutationRow {
  clientMutationId: string;
  type: PendingMutationRecord['type'];
  payload: string;
  entityId: string | null;
  entityType: string;
  createdAt: string;
  retryCount: number;
  status: PendingMutationStatus;
  lastError: string | null;
  requiresNetwork: number;
  dedupeKey: string;
}

interface ChecklistRow {
  id: string;
  title: string;
  description: string | null;
  status: Checklist['status'];
  assigneeId: string | null;
  dueAt: string | null;
  updatedAt: string;
}

interface ChecklistItemRow {
  id: string;
  checklistId: string;
  label: string;
  sortOrder: number;
  isCompleted: number;
  completedAt: string | null;
}

type UserShellInput = Pick<User, 'id'> & Partial<Omit<User, 'id'>>;

async function getPendingRequestForShift(
  db: SQLiteDatabase,
  shiftId: string,
  employeeId: string,
) {
  return db.getFirstAsync<{ id: string }>(
    `SELECT id
     FROM requests
     WHERE shift_id = ? AND created_by_employee_id = ? AND status = 'pending'
     LIMIT 1`,
    shiftId,
    employeeId,
  );
}

export async function getUsers(db: SQLiteDatabase) {
  return db.getAllAsync<User>(
    `SELECT
      id,
      full_name as fullName,
      role,
      phone,
      email,
      status
    FROM users
    ORDER BY CASE role WHEN 'manager' THEN 0 ELSE 1 END, full_name`,
  );
}

export async function getEmployeeUsers(db: SQLiteDatabase) {
  return db.getAllAsync<User>(
    `SELECT
      id,
      full_name as fullName,
      role,
      phone,
      email,
      status
    FROM users
    WHERE role = 'employee'
    ORDER BY full_name`,
  );
}

export async function replaceUsersCache(db: SQLiteDatabase, users: User[]) {
  await db.withTransactionAsync(async () => {
    for (const user of users) {
      await db.runAsync(
        `INSERT INTO users (id, full_name, role, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           full_name = excluded.full_name,
           role = excluded.role,
           phone = excluded.phone,
           email = excluded.email,
           status = excluded.status`,
        user.id,
        user.fullName,
        user.role,
        user.phone,
        user.email,
        user.status,
      );
    }
  });

  return getUsers(db);
}

function normalizeUserShell(user: UserShellInput): User {
  const fullName = user.fullName?.trim() ? user.fullName.trim() : user.id;

  return {
    id: user.id,
    fullName,
    role: user.role ?? 'employee',
    phone: user.phone ?? '',
    email: user.email ?? '',
    status: user.status ?? 'active',
  };
}

function mergeUserShell(current: User, next: User) {
  const currentHasRealName =
    current.fullName.trim().length > 0 && current.fullName !== current.id;
  const nextHasRealName =
    next.fullName.trim().length > 0 && next.fullName !== next.id;

  return {
    id: current.id,
    fullName:
      !currentHasRealName && nextHasRealName ? next.fullName : current.fullName,
    role:
      current.role === 'manager' || next.role === 'manager'
        ? 'manager'
        : 'employee',
    phone: current.phone || next.phone,
    email: current.email || next.email,
    status: current.status === 'inactive' ? current.status : next.status,
  };
}

export async function ensureUsersExist(
  db: SQLiteDatabase,
  users: UserShellInput[],
) {
  const userMap = new Map<string, User>();

  for (const user of users) {
    if (!user?.id) {
      continue;
    }

    const normalized = normalizeUserShell(user);
    const existing = userMap.get(normalized.id);
    userMap.set(
      normalized.id,
      existing ? mergeUserShell(existing, normalized) : normalized,
    );
  }

  for (const user of userMap.values()) {
    await db.runAsync(
      `INSERT INTO users (id, full_name, role, phone, email, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO NOTHING`,
      user.id,
      user.fullName,
      user.role,
      user.phone,
      user.email,
      user.status,
    );
  }

  return Array.from(userMap.values());
}

export async function getShiftsByEmployee(
  db: SQLiteDatabase,
  employeeId: string,
) {
  return db.getAllAsync<ShiftView>(
    `SELECT
      s.id,
      s.employee_id as employeeId,
      s.date,
      s.start_time as startTime,
      s.end_time as endTime,
      s.store_name as storeName,
      s.position,
      s.status,
      u.full_name as employeeName
    FROM shifts s
    INNER JOIN users u ON u.id = s.employee_id
    WHERE s.employee_id = ?
    ORDER BY s.date, s.start_time`,
    employeeId,
  );
}

export async function getAllShifts(db: SQLiteDatabase) {
  return db.getAllAsync<ShiftView>(
    `SELECT
      s.id,
      s.employee_id as employeeId,
      s.date,
      s.start_time as startTime,
      s.end_time as endTime,
      s.store_name as storeName,
      s.position,
      s.status,
      u.full_name as employeeName
    FROM shifts s
    INNER JOIN users u ON u.id = s.employee_id
    ORDER BY s.date, s.start_time, u.full_name`,
  );
}

export async function getShiftById(db: SQLiteDatabase, shiftId: string) {
  return db.getFirstAsync<Shift>(
    `SELECT
      id,
      employee_id as employeeId,
      date,
      start_time as startTime,
      end_time as endTime,
      store_name as storeName,
      position,
      status
    FROM shifts
    WHERE id = ?`,
    shiftId,
  );
}

export async function getUpcomingShiftsByEmployee(
  db: SQLiteDatabase,
  employeeId: string,
) {
  const rows = await db.getAllAsync<ShiftView>(
    `SELECT
      s.id,
      s.employee_id as employeeId,
      s.date,
      s.start_time as startTime,
      s.end_time as endTime,
      s.store_name as storeName,
      s.position,
      s.status,
      u.full_name as employeeName
    FROM shifts s
    INNER JOIN users u ON u.id = s.employee_id
    WHERE s.employee_id = ? AND s.status = 'scheduled'
    ORDER BY s.date, s.start_time`,
    employeeId,
  );

  return rows.filter((row) => isUpcoming(row.date, row.endTime));
}

export async function getConfirmedSchedule(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<ShiftView>(
    `SELECT
      s.id,
      s.employee_id as employeeId,
      s.date,
      s.start_time as startTime,
      s.end_time as endTime,
      s.store_name as storeName,
      s.position,
      s.status,
      u.full_name as employeeName
    FROM shifts s
    INNER JOIN users u ON u.id = s.employee_id
    WHERE s.status = 'scheduled'
    ORDER BY s.date, s.start_time, u.full_name`,
  );

  return rows.filter((row) => isUpcoming(row.date, row.endTime));
}

export async function getOpenShifts(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<OpenShiftView>(
    `SELECT
      o.id,
      o.date,
      o.start_time as startTime,
      o.end_time as endTime,
      o.store_name as storeName,
      o.position,
      o.note,
      o.status,
      o.claimed_by_employee_id as claimedByEmployeeId,
      u.full_name as claimedByEmployeeName
    FROM open_shifts o
    LEFT JOIN users u ON u.id = o.claimed_by_employee_id
    WHERE o.status = 'open'
    ORDER BY o.date, o.start_time`,
  );

  return rows.filter((row) => isUpcoming(row.date, row.endTime));
}

export async function getOpenShiftById(
  db: SQLiteDatabase,
  openShiftId: string,
) {
  return db.getFirstAsync<OpenShiftView>(
    `SELECT
      o.id,
      o.date,
      o.start_time as startTime,
      o.end_time as endTime,
      o.store_name as storeName,
      o.position,
      o.note,
      o.status,
      o.claimed_by_employee_id as claimedByEmployeeId,
      u.full_name as claimedByEmployeeName
    FROM open_shifts o
    LEFT JOIN users u ON u.id = o.claimed_by_employee_id
    WHERE o.id = ?`,
    openShiftId,
  );
}

export async function replaceOpenShiftsCache(
  db: SQLiteDatabase,
  openShifts: OpenShiftView[],
) {
  await db.withTransactionAsync(async () => {
    await ensureUsersExist(
      db,
      openShifts
        .filter((openShift) => Boolean(openShift.claimedByEmployeeId))
        .map((openShift) => ({
          id: openShift.claimedByEmployeeId!,
          fullName:
            openShift.claimedByEmployeeName ?? openShift.claimedByEmployeeId!,
        })),
    );

    await db.runAsync('DELETE FROM open_shifts');

    for (const openShift of openShifts) {
      await db.runAsync(
        `INSERT INTO open_shifts (
          id,
          date,
          start_time,
          end_time,
          store_name,
          position,
          note,
          status,
          claimed_by_employee_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        openShift.id,
        openShift.date,
        openShift.startTime,
        openShift.endTime,
        openShift.storeName,
        openShift.position,
        openShift.note,
        openShift.status,
        openShift.claimedByEmployeeId,
      );
    }
  });

  return getOpenShifts(db);
}

export async function getRequestsByEmployee(
  db: SQLiteDatabase,
  employeeId: string,
) {
  return db.getAllAsync<RequestView>(
    `SELECT
      r.id,
      r.type,
      r.created_by_employee_id as createdByEmployeeId,
      r.shift_id as shiftId,
      r.target_employee_id as targetEmployeeId,
      r.reason,
      r.status,
      r.manager_note as managerNote,
      r.created_at as createdAt,
      r.reviewed_at as reviewedAt,
      creator.full_name as createdByEmployeeName,
      target.full_name as targetEmployeeName,
      s.date as shiftDate,
      s.start_time as shiftStartTime,
      s.end_time as shiftEndTime,
      s.store_name as shiftStoreName,
      s.position as shiftPosition
    FROM requests r
    INNER JOIN users creator ON creator.id = r.created_by_employee_id
    INNER JOIN shifts s ON s.id = r.shift_id
    LEFT JOIN users target ON target.id = r.target_employee_id
    WHERE r.created_by_employee_id = ?
    ORDER BY r.created_at DESC`,
    employeeId,
  );
}

export async function getAllRequests(db: SQLiteDatabase) {
  return db.getAllAsync<RequestView>(
    `SELECT
      r.id,
      r.type,
      r.created_by_employee_id as createdByEmployeeId,
      r.shift_id as shiftId,
      r.target_employee_id as targetEmployeeId,
      r.reason,
      r.status,
      r.manager_note as managerNote,
      r.created_at as createdAt,
      r.reviewed_at as reviewedAt,
      creator.full_name as createdByEmployeeName,
      target.full_name as targetEmployeeName,
      s.date as shiftDate,
      s.start_time as shiftStartTime,
      s.end_time as shiftEndTime,
      s.store_name as shiftStoreName,
      s.position as shiftPosition
    FROM requests r
    INNER JOIN users creator ON creator.id = r.created_by_employee_id
    INNER JOIN shifts s ON s.id = r.shift_id
    LEFT JOIN users target ON target.id = r.target_employee_id
    ORDER BY COALESCE(r.reviewed_at, r.created_at) DESC`,
  );
}

export async function getPendingRequests(db: SQLiteDatabase) {
  return db.getAllAsync<RequestView>(
    `SELECT
      r.id,
      r.type,
      r.created_by_employee_id as createdByEmployeeId,
      r.shift_id as shiftId,
      r.target_employee_id as targetEmployeeId,
      r.reason,
      r.status,
      r.manager_note as managerNote,
      r.created_at as createdAt,
      r.reviewed_at as reviewedAt,
      creator.full_name as createdByEmployeeName,
      target.full_name as targetEmployeeName,
      s.date as shiftDate,
      s.start_time as shiftStartTime,
      s.end_time as shiftEndTime,
      s.store_name as shiftStoreName,
      s.position as shiftPosition
    FROM requests r
    INNER JOIN users creator ON creator.id = r.created_by_employee_id
    INNER JOIN shifts s ON s.id = r.shift_id
    LEFT JOIN users target ON target.id = r.target_employee_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC`,
  );
}

export async function getRequestById(db: SQLiteDatabase, requestId: string) {
  return db.getFirstAsync<RequestView>(
    `SELECT
      r.id,
      r.type,
      r.created_by_employee_id as createdByEmployeeId,
      r.shift_id as shiftId,
      r.target_employee_id as targetEmployeeId,
      r.reason,
      r.status,
      r.manager_note as managerNote,
      r.created_at as createdAt,
      r.reviewed_at as reviewedAt,
      creator.full_name as createdByEmployeeName,
      target.full_name as targetEmployeeName,
      s.date as shiftDate,
      s.start_time as shiftStartTime,
      s.end_time as shiftEndTime,
      s.store_name as shiftStoreName,
      s.position as shiftPosition
    FROM requests r
    INNER JOIN users creator ON creator.id = r.created_by_employee_id
    INNER JOIN shifts s ON s.id = r.shift_id
    LEFT JOIN users target ON target.id = r.target_employee_id
    WHERE r.id = ?`,
    requestId,
  );
}

export async function upsertShiftCache(
  db: SQLiteDatabase,
  shifts: ShiftView[],
) {
  await db.withTransactionAsync(async () => {
    await ensureUsersExist(
      db,
      shifts.map((shift) => ({
        id: shift.employeeId,
        fullName: shift.employeeName,
      })),
    );

    for (const shift of shifts) {
      await db.runAsync(
        `INSERT INTO shifts (id, employee_id, date, start_time, end_time, store_name, position, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           employee_id = excluded.employee_id,
           date = excluded.date,
           start_time = excluded.start_time,
           end_time = excluded.end_time,
           store_name = excluded.store_name,
           position = excluded.position,
           status = excluded.status`,
        shift.id,
        shift.employeeId,
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.storeName,
        shift.position,
        shift.status,
      );
    }
  });

  return shifts;
}

export async function upsertRequestCache(
  db: SQLiteDatabase,
  requests: RequestView[],
) {
  await db.withTransactionAsync(async () => {
    await ensureUsersExist(
      db,
      requests.flatMap((request) => {
        const users: UserShellInput[] = [
          {
            id: request.createdByEmployeeId,
            fullName: request.createdByEmployeeName,
          },
        ];

        if (request.targetEmployeeId) {
          users.push({
            id: request.targetEmployeeId,
            fullName:
              request.targetEmployeeName ?? request.targetEmployeeId,
          });
        }

        return users;
      }),
    );

    for (const request of requests) {
      await db.runAsync(
        `INSERT INTO shifts (
          id,
          employee_id,
          date,
          start_time,
          end_time,
          store_name,
          position,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING`,
        request.shiftId,
        request.createdByEmployeeId,
        request.shiftDate,
        request.shiftStartTime,
        request.shiftEndTime,
        request.shiftStoreName,
        request.shiftPosition,
        'scheduled',
      );
    }

    for (const request of requests) {
      await db.runAsync(
        `INSERT INTO requests (
          id,
          type,
          created_by_employee_id,
          shift_id,
          target_employee_id,
          reason,
          status,
          manager_note,
          created_at,
          reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          created_by_employee_id = excluded.created_by_employee_id,
          shift_id = excluded.shift_id,
          target_employee_id = excluded.target_employee_id,
          reason = excluded.reason,
          status = excluded.status,
          manager_note = excluded.manager_note,
          created_at = excluded.created_at,
          reviewed_at = excluded.reviewed_at`,
        request.id,
        request.type,
        request.createdByEmployeeId,
        request.shiftId,
        request.targetEmployeeId,
        request.reason,
        request.status,
        request.managerNote,
        request.createdAt,
        request.reviewedAt,
      );
    }
  });

  return requests;
}

export async function countPendingRequestsByEmployee(
  db: SQLiteDatabase,
  employeeId: string,
) {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM requests
     WHERE created_by_employee_id = ? AND status = 'pending'`,
    employeeId,
  );

  return row?.total ?? 0;
}

export async function countPendingRequests(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM requests WHERE status = 'pending'`,
  );

  return row?.total ?? 0;
}

export async function countOpenShifts(db: SQLiteDatabase) {
  const openShifts = await getOpenShifts(db);
  return openShifts.length;
}

export async function detectShiftConflict(
  db: SQLiteDatabase,
  employeeId: string,
  candidate: Pick<Shift, 'date' | 'startTime' | 'endTime'>,
  excludeShiftId?: string,
) {
  const candidateDates = getAdjacentDateStrings(candidate.date);
  const args: string[] = [employeeId, ...candidateDates];
  let query = `
    SELECT
      id,
      employee_id as employeeId,
      date,
      start_time as startTime,
      end_time as endTime,
      store_name as storeName,
      position,
      status
    FROM shifts
    WHERE employee_id = ? AND date IN (?, ?, ?) AND status = 'scheduled'
  `;

  if (excludeShiftId) {
    query += ' AND id != ?';
    args.push(excludeShiftId);
  }

  const existing = await db.getAllAsync<Shift>(query, ...args);

  return checkShiftConflict(existing, candidate, { excludeShiftId });
}

export async function createOpenShift(
  db: SQLiteDatabase,
  input: CreateOpenShiftInput,
) {
  const id = createId('open-shift');

  await db.runAsync(
    `INSERT INTO open_shifts (id, date, start_time, end_time, store_name, position, note, status, claimed_by_employee_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NULL)`,
    id,
    input.date,
    input.startTime,
    input.endTime,
    input.storeName,
    input.position,
    input.note,
  );

  return getOpenShiftById(db, id);
}

export async function claimOpenShift(
  db: SQLiteDatabase,
  openShiftId: string,
  employeeId: string,
) {
  const openShift = await getOpenShiftById(db, openShiftId);

  if (!openShift) {
    throw new Error('Khong tim thay ca trong.');
  }

  if (openShift.status !== 'open') {
    throw new Error('Ca trong nay khong con kha dung.');
  }

  const isConflict = await detectShiftConflict(db, employeeId, openShift);

  if (isConflict) {
    throw new Error('Ban da co ca trung thoi gian nen khong the nhan ca nay.');
  }

  const newShiftId = createId('shift');

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE open_shifts
       SET status = 'claimed', claimed_by_employee_id = ?
       WHERE id = ?`,
      employeeId,
      openShiftId,
    );

    await db.runAsync(
      `INSERT INTO shifts (id, employee_id, date, start_time, end_time, store_name, position, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')`,
      newShiftId,
      employeeId,
      openShift.date,
      openShift.startTime,
      openShift.endTime,
      openShift.storeName,
      openShift.position,
    );
  });

  return getShiftById(db, newShiftId);
}

export async function createLeaveRequest(
  db: SQLiteDatabase,
  input: CreateLeaveRequestInput,
) {
  const shift = await getShiftById(db, input.shiftId);

  if (!shift || shift.employeeId !== input.createdByEmployeeId) {
    throw new Error('Ca lam khong hop le de tao don xin nghi.');
  }

  const existing = await getPendingRequestForShift(
    db,
    input.shiftId,
    input.createdByEmployeeId,
  );

  if (existing) {
    throw new Error('Ban da co mot yeu cau dang cho duyet cho ca nay.');
  }

  const requestId = createId('request');
  const createdAt = formatIsoTimestamp();

  await db.runAsync(
    `INSERT INTO requests (
      id,
      type,
      created_by_employee_id,
      shift_id,
      target_employee_id,
      reason,
      status,
      manager_note,
      created_at,
      reviewed_at
    ) VALUES (?, 'leave', ?, ?, NULL, ?, 'pending', NULL, ?, NULL)`,
    requestId,
    input.createdByEmployeeId,
    input.shiftId,
    input.reason.trim(),
    createdAt,
  );

  return getRequestById(db, requestId);
}

export async function createYieldRequest(
  db: SQLiteDatabase,
  input: CreateYieldRequestInput,
) {
  const shift = await getShiftById(db, input.shiftId);

  if (!shift || shift.employeeId !== input.createdByEmployeeId) {
    throw new Error('Ca lam khong hop le de tao de nghi nhuong ca.');
  }

  if (input.createdByEmployeeId === input.targetEmployeeId) {
    throw new Error('Ban can chon mot dong nghiep khac de nhan ca.');
  }

  const existing = await getPendingRequestForShift(
    db,
    input.shiftId,
    input.createdByEmployeeId,
  );

  if (existing) {
    throw new Error('Ban da co mot yeu cau dang cho duyet cho ca nay.');
  }

  const target = await db.getFirstAsync<User>(
    `SELECT
      id,
      full_name as fullName,
      role,
      phone,
      email,
      status
     FROM users
     WHERE id = ? AND role = 'employee'`,
    input.targetEmployeeId,
  );

  if (!target) {
    throw new Error('Khong tim thay dong nghiep nhan ca.');
  }

  const requestId = createId('request');
  const createdAt = formatIsoTimestamp();

  await db.runAsync(
    `INSERT INTO requests (
      id,
      type,
      created_by_employee_id,
      shift_id,
      target_employee_id,
      reason,
      status,
      manager_note,
      created_at,
      reviewed_at
    ) VALUES (?, 'yield', ?, ?, ?, ?, 'pending', NULL, ?, NULL)`,
    requestId,
    input.createdByEmployeeId,
    input.shiftId,
    input.targetEmployeeId,
    input.reason.trim(),
    createdAt,
  );

  return getRequestById(db, requestId);
}

export async function createSwapRequest(
  db: SQLiteDatabase,
  input: CreateYieldRequestInput,
) {
  return createYieldRequest(db, input);
}

export async function approveRequest(
  db: SQLiteDatabase,
  requestId: string,
  managerId: string,
  managerNote?: string,
): Promise<ApprovalAction> {
  const request = await db.getFirstAsync<ShiftRequest>(
    `SELECT
      id,
      type,
      created_by_employee_id as createdByEmployeeId,
      shift_id as shiftId,
      target_employee_id as targetEmployeeId,
      reason,
      status,
      manager_note as managerNote,
      created_at as createdAt,
      reviewed_at as reviewedAt
    FROM requests
    WHERE id = ?`,
    requestId,
  );

  if (!request) {
    throw new Error('Khong tim thay yeu cau can duyet.');
  }

  if (request.status !== 'pending') {
    throw new Error('Yeu cau nay da duoc xu ly truoc do.');
  }

  const shift = await getShiftById(db, request.shiftId);

  if (!shift) {
    throw new Error('Khong tim thay ca lien quan toi yeu cau.');
  }

  const reviewedAt = formatIsoTimestamp();
  const safeNote = managerNote?.trim() || null;

  if (request.type === 'leave') {
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE shifts SET status = 'cancelled' WHERE id = ?`,
        request.shiftId,
      );

      await db.runAsync(
        `INSERT INTO open_shifts (
          id,
          date,
          start_time,
          end_time,
          store_name,
          position,
          note,
          status,
          claimed_by_employee_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NULL)`,
        createId('open-shift'),
        shift.date,
        shift.startTime,
        shift.endTime,
        shift.storeName,
        shift.position,
        `Ca phat sinh tu don xin nghi: ${request.reason}`,
      );

      await db.runAsync(
        `UPDATE requests
         SET status = 'approved', manager_note = ?, reviewed_at = ?
         WHERE id = ?`,
        safeNote,
        reviewedAt,
        requestId,
      );
    });
  } else {
    if (!request.targetEmployeeId) {
      throw new Error('Yeu cau nhuong ca thieu nguoi nhan ca.');
    }

    const isConflict = await detectShiftConflict(
      db,
      request.targetEmployeeId,
      shift,
      request.shiftId,
    );

    if (isConflict) {
      throw new Error(
        'Nguoi nhan ca dang co lich trung thoi gian nen chua the duyet.',
      );
    }

    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `UPDATE shifts
         SET employee_id = ?
         WHERE id = ?`,
        request.targetEmployeeId,
        request.shiftId,
      );

      await db.runAsync(
        `UPDATE requests
         SET status = 'approved', manager_note = ?, reviewed_at = ?
         WHERE id = ?`,
        safeNote,
        reviewedAt,
        requestId,
      );
    });
  }

  return {
    requestId,
    managerId,
    action: 'approved',
    managerNote: safeNote ?? undefined,
    reviewedAt,
  };
}

export async function rejectRequest(
  db: SQLiteDatabase,
  requestId: string,
  managerId: string,
  managerNote?: string,
): Promise<ApprovalAction> {
  const request = await db.getFirstAsync<{ status: ShiftRequest['status'] }>(
    `SELECT status FROM requests WHERE id = ?`,
    requestId,
  );

  if (!request) {
    throw new Error('Khong tim thay yeu cau can tu choi.');
  }

  if (request.status !== 'pending') {
    throw new Error('Yeu cau nay da duoc xu ly truoc do.');
  }

  const reviewedAt = formatIsoTimestamp();
  const safeNote = managerNote?.trim() || null;

  await db.runAsync(
    `UPDATE requests
     SET status = 'rejected', manager_note = ?, reviewed_at = ?
     WHERE id = ?`,
    safeNote,
    reviewedAt,
    requestId,
  );

  return {
    requestId,
    managerId,
    action: 'rejected',
    managerNote: safeNote ?? undefined,
    reviewedAt,
  };
}

export async function getRequestsSortedByPriority(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<RequestView>(
    `SELECT
      r.id,
      r.type,
      r.created_by_employee_id as createdByEmployeeId,
      r.shift_id as shiftId,
      r.target_employee_id as targetEmployeeId,
      r.reason,
      r.status,
      r.manager_note as managerNote,
      r.created_at as createdAt,
      r.reviewed_at as reviewedAt,
      creator.full_name as createdByEmployeeName,
      target.full_name as targetEmployeeName,
      s.date as shiftDate,
      s.start_time as shiftStartTime,
      s.end_time as shiftEndTime,
      s.store_name as shiftStoreName,
      s.position as shiftPosition
    FROM requests r
    INNER JOIN users creator ON creator.id = r.created_by_employee_id
    INNER JOIN shifts s ON s.id = r.shift_id
    LEFT JOIN users target ON target.id = r.target_employee_id`,
  );

  return rows.sort((left, right) => {
    if (left.status === 'pending' && right.status !== 'pending') {
      return -1;
    }

    if (left.status !== 'pending' && right.status === 'pending') {
      return 1;
    }

    return compareDateTime(
      right.shiftDate,
      right.shiftStartTime,
      left.shiftDate,
      left.shiftStartTime,
    );
  });
}

function buildDefaultUserSetting(userId: string): UserSetting {
  return {
    userId,
    notificationsEnabled: true,
    approvalUpdatesEnabled: true,
    openShiftAlertsEnabled: true,
    remindersEnabled: true,
    reminderMinutesBefore: 60,
    language: 'vi',
    theme: 'system',
    updatedAt: formatIsoTimestamp(),
  };
}

function mapUserSettingRow(row: UserSettingRow): UserSetting {
  return {
    userId: row.userId,
    notificationsEnabled: Boolean(row.notificationsEnabled),
    approvalUpdatesEnabled: Boolean(row.approvalUpdatesEnabled),
    openShiftAlertsEnabled: Boolean(row.openShiftAlertsEnabled),
    remindersEnabled: Boolean(row.remindersEnabled),
    reminderMinutesBefore: row.reminderMinutesBefore,
    language: row.language,
    theme: row.theme,
    updatedAt: row.updatedAt,
  };
}

export async function getUserSetting(db: SQLiteDatabase, userId: string) {
  const row = await db.getFirstAsync<UserSettingRow>(
    `SELECT
      user_id as userId,
      notifications_enabled as notificationsEnabled,
      approval_updates_enabled as approvalUpdatesEnabled,
      open_shift_alerts_enabled as openShiftAlertsEnabled,
      reminders_enabled as remindersEnabled,
      reminder_minutes_before as reminderMinutesBefore,
      language,
      theme,
      updated_at as updatedAt
    FROM user_settings
    WHERE user_id = ?`,
    userId,
  );

  if (!row) {
    return buildDefaultUserSetting(userId);
  }

  return mapUserSettingRow(row);
}

export async function upsertUserSetting(
  db: SQLiteDatabase,
  input: Omit<UserSetting, 'updatedAt'>,
) {
  const updatedAt = formatIsoTimestamp();

  await db.runAsync(
    `INSERT INTO user_settings (
      user_id,
      notifications_enabled,
      approval_updates_enabled,
      open_shift_alerts_enabled,
      reminders_enabled,
      reminder_minutes_before,
      language,
      theme,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      notifications_enabled = excluded.notifications_enabled,
      approval_updates_enabled = excluded.approval_updates_enabled,
      open_shift_alerts_enabled = excluded.open_shift_alerts_enabled,
      reminders_enabled = excluded.reminders_enabled,
      reminder_minutes_before = excluded.reminder_minutes_before,
      language = excluded.language,
      theme = excluded.theme,
      updated_at = excluded.updated_at`,
    input.userId,
    input.notificationsEnabled ? 1 : 0,
    input.approvalUpdatesEnabled ? 1 : 0,
    input.openShiftAlertsEnabled ? 1 : 0,
    input.remindersEnabled ? 1 : 0,
    input.reminderMinutesBefore,
    input.language,
    input.theme,
    updatedAt,
  );

  return getUserSetting(db, input.userId);
}

function mapNotificationRow(row: NotificationRow): NotificationItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    isRead: Boolean(row.isRead),
    createdAt: row.createdAt,
  };
}

export async function getCachedNotifications(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<NotificationRow>(
    `SELECT
      id,
      title,
      body,
      type,
      is_read as isRead,
      created_at as createdAt
    FROM notifications
    ORDER BY created_at DESC`,
  );

  return rows.map(mapNotificationRow);
}

export async function replaceCachedNotifications(
  db: SQLiteDatabase,
  notifications: NotificationItem[],
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM notifications');

    for (const notification of notifications) {
      await db.runAsync(
        `INSERT INTO notifications (id, title, body, type, is_read, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        notification.id,
        notification.title,
        notification.body,
        notification.type,
        notification.isRead ? 1 : 0,
        notification.createdAt,
      );
    }
  });

  return getCachedNotifications(db);
}

function mapAnnouncementRow(row: AnnouncementRow): AnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    requiresAck: Boolean(row.requiresAck),
    acknowledgedAt: row.acknowledgedAt,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    updatedAt: row.updatedAt,
  };
}

export async function getCachedAnnouncements(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<AnnouncementRow>(
    `SELECT
      id,
      title,
      body,
      requires_ack as requiresAck,
      acknowledged_at as acknowledgedAt,
      published_at as publishedAt,
      expires_at as expiresAt,
      updated_at as updatedAt
    FROM announcements
    ORDER BY published_at DESC`,
  );

  return rows.map(mapAnnouncementRow);
}

export async function replaceCachedAnnouncements(
  db: SQLiteDatabase,
  announcements: AnnouncementItem[],
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM announcements');

    for (const announcement of announcements) {
      await db.runAsync(
        `INSERT INTO announcements (
          id,
          title,
          body,
          requires_ack,
          acknowledged_at,
          published_at,
          expires_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        announcement.id,
        announcement.title,
        announcement.body,
        announcement.requiresAck ? 1 : 0,
        announcement.acknowledgedAt,
        announcement.publishedAt,
        announcement.expiresAt,
        announcement.updatedAt ?? announcement.publishedAt,
      );
    }
  });

  return getCachedAnnouncements(db);
}

export async function acknowledgeAnnouncementCache(
  db: SQLiteDatabase,
  announcementId: string,
  acknowledgedAt: string,
) {
  await db.runAsync(
    `UPDATE announcements
     SET acknowledged_at = ?, updated_at = ?
     WHERE id = ?`,
    acknowledgedAt,
    acknowledgedAt,
    announcementId,
  );

  return getCachedAnnouncements(db);
}

function mapActivityLogRow(row: ActivityLogRow): ActivityLogItem {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    action: row.action,
    summary: row.summary,
    actorUserId: row.actorUserId,
    actorUserName: row.actorUserName,
    createdAt: row.createdAt,
    payload: row.payload ? JSON.parse(row.payload) : undefined,
  };
}

export async function getCachedActivityLogs(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<ActivityLogRow>(
    `SELECT
      id,
      entity_type as entityType,
      entity_id as entityId,
      action,
      summary,
      actor_user_id as actorUserId,
      actor_user_name as actorUserName,
      payload,
      created_at as createdAt
    FROM activity_logs
    ORDER BY created_at DESC`,
  );

  return rows.map(mapActivityLogRow);
}

export async function replaceCachedActivityLogs(
  db: SQLiteDatabase,
  activityLogs: ActivityLogItem[],
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM activity_logs');

    for (const activity of activityLogs) {
      await db.runAsync(
        `INSERT INTO activity_logs (
          id,
          entity_type,
          entity_id,
          action,
          summary,
          actor_user_id,
          actor_user_name,
          payload,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        activity.id,
        activity.entityType,
        activity.entityId,
        activity.action,
        activity.summary,
        activity.actorUserId,
        activity.actorUserName,
        activity.payload ? JSON.stringify(activity.payload) : null,
        activity.createdAt,
      );
    }
  });

  return getCachedActivityLogs(db);
}

function mapPendingMutationRow(row: PendingMutationRow): PendingMutationRecord {
  return {
    clientMutationId: row.clientMutationId,
    type: row.type,
    payload: row.payload,
    entityId: row.entityId,
    entityType: row.entityType,
    createdAt: row.createdAt,
    retryCount: row.retryCount,
    status: row.status,
    lastError: row.lastError,
    requiresNetwork: Boolean(row.requiresNetwork),
    dedupeKey: row.dedupeKey,
  };
}

export async function enqueuePendingMutation(
  db: SQLiteDatabase,
  mutation: PendingMutationRecord,
) {
  await db.runAsync(
    `INSERT INTO pending_mutations (
      client_mutation_id,
      type,
      payload,
      entity_id,
      entity_type,
      created_at,
      retry_count,
      status,
      last_error,
      requires_network,
      dedupe_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(client_mutation_id) DO UPDATE SET
      payload = excluded.payload,
      entity_id = excluded.entity_id,
      entity_type = excluded.entity_type,
      retry_count = excluded.retry_count,
      status = excluded.status,
      last_error = excluded.last_error,
      requires_network = excluded.requires_network,
      dedupe_key = excluded.dedupe_key`,
    mutation.clientMutationId,
    mutation.type,
    mutation.payload,
    mutation.entityId,
    mutation.entityType,
    mutation.createdAt,
    mutation.retryCount,
    mutation.status,
    mutation.lastError,
    mutation.requiresNetwork ? 1 : 0,
    mutation.dedupeKey,
  );

  return mutation;
}

export async function getPendingMutations(
  db: SQLiteDatabase,
  statuses: PendingMutationStatus[] = [
    'queued',
    'failed',
    'conflict',
    'sending',
  ],
) {
  const placeholders = statuses.map(() => '?').join(', ');
  const rows = await db.getAllAsync<PendingMutationRow>(
    `SELECT
      client_mutation_id as clientMutationId,
      type,
      payload,
      entity_id as entityId,
      entity_type as entityType,
      created_at as createdAt,
      retry_count as retryCount,
      status,
      last_error as lastError,
      requires_network as requiresNetwork,
      dedupe_key as dedupeKey
    FROM pending_mutations
    WHERE status IN (${placeholders})
    ORDER BY created_at ASC`,
    ...statuses,
  );

  return rows.map(mapPendingMutationRow);
}

export async function getPendingMutationById(
  db: SQLiteDatabase,
  clientMutationId: string,
) {
  const row = await db.getFirstAsync<PendingMutationRow>(
    `SELECT
      client_mutation_id as clientMutationId,
      type,
      payload,
      entity_id as entityId,
      entity_type as entityType,
      created_at as createdAt,
      retry_count as retryCount,
      status,
      last_error as lastError,
      requires_network as requiresNetwork,
      dedupe_key as dedupeKey
    FROM pending_mutations
    WHERE client_mutation_id = ?`,
    clientMutationId,
  );

  return row ? mapPendingMutationRow(row) : null;
}

export async function updatePendingMutation(
  db: SQLiteDatabase,
  mutation: PendingMutationRecord,
) {
  await db.runAsync(
    `UPDATE pending_mutations
     SET retry_count = ?,
         status = ?,
         last_error = ?,
         payload = ?,
         entity_id = ?,
         entity_type = ?,
         dedupe_key = ?
     WHERE client_mutation_id = ?`,
    mutation.retryCount,
    mutation.status,
    mutation.lastError,
    mutation.payload,
    mutation.entityId,
    mutation.entityType,
    mutation.dedupeKey,
    mutation.clientMutationId,
  );

  return mutation;
}

export async function removeCompletedPendingMutations(db: SQLiteDatabase) {
  await db.runAsync(`DELETE FROM pending_mutations WHERE status = 'completed'`);
}

export async function getPendingMutationCount(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total
     FROM pending_mutations
     WHERE status IN ('queued', 'sending', 'failed', 'conflict')`,
  );

  return row?.total ?? 0;
}

export async function getSyncStateValue(db: SQLiteDatabase, key: string) {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value
     FROM sync_state
     WHERE key = ?`,
    key,
  );

  return row?.value ?? null;
}

export async function setSyncStateValue(
  db: SQLiteDatabase,
  key: string,
  value: string,
) {
  const updatedAt = formatIsoTimestamp();

  await db.runAsync(
    `INSERT INTO sync_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at`,
    key,
    value,
    updatedAt,
  );
}

export async function getSyncCursor(db: SQLiteDatabase, domain = 'global') {
  const row = await db.getFirstAsync<{ cursor: number }>(
    `SELECT cursor
     FROM sync_cursors
     WHERE domain = ?`,
    domain,
  );

  return row?.cursor ?? 0;
}

export async function setSyncCursor(
  db: SQLiteDatabase,
  domain: string,
  cursor: number,
) {
  const updatedAt = formatIsoTimestamp();

  await db.runAsync(
    `INSERT INTO sync_cursors (domain, cursor, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(domain) DO UPDATE SET
       cursor = excluded.cursor,
       updated_at = excluded.updated_at`,
    domain,
    cursor,
    updatedAt,
  );
}

function buildDefaultSyncSnapshot(): SyncStatusSnapshot {
  return {
    networkState: 'degraded',
    lifecycle: 'idle',
    pendingMutationCount: 0,
    lastSuccessfulSyncAt: null,
    lastAttemptedSyncAt: null,
    lastError: null,
    serverCursor: 0,
    activeUserId: null,
  };
}

export async function getSyncStatusSnapshot(db: SQLiteDatabase) {
  const pendingMutationCount = await getPendingMutationCount(db);
  const raw = await getSyncStateValue(db, 'sync_status');

  if (!raw) {
    return {
      ...buildDefaultSyncSnapshot(),
      pendingMutationCount,
    };
  }

  try {
    const parsed = JSON.parse(raw) as SyncStatusSnapshot;
    return {
      ...buildDefaultSyncSnapshot(),
      ...parsed,
      pendingMutationCount,
    };
  } catch {
    return {
      ...buildDefaultSyncSnapshot(),
      pendingMutationCount,
    };
  }
}

export async function setSyncStatusSnapshot(
  db: SQLiteDatabase,
  snapshot: SyncStatusSnapshot,
) {
  await setSyncStateValue(db, 'sync_status', JSON.stringify(snapshot));
}

export async function ensureOperationalUserScope(
  db: SQLiteDatabase,
  userId: string,
) {
  const activeUserId = await getSyncStateValue(db, 'active_user_id');

  if (activeUserId && activeUserId !== userId) {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM shifts');
      await db.runAsync('DELETE FROM open_shifts');
      await db.runAsync('DELETE FROM requests');
      await db.runAsync('DELETE FROM notifications');
      await db.runAsync('DELETE FROM announcements');
      await db.runAsync('DELETE FROM activity_logs');
      await db.runAsync('DELETE FROM checklists');
      await db.runAsync('DELETE FROM checklist_items');
      await db.runAsync('DELETE FROM pending_mutations');
      await db.runAsync('DELETE FROM sync_cursors');
    });
  }

  await setSyncStateValue(db, 'active_user_id', userId);
}

export async function clearOperationalState(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM shifts');
    await db.runAsync('DELETE FROM open_shifts');
    await db.runAsync('DELETE FROM requests');
    await db.runAsync('DELETE FROM notifications');
    await db.runAsync('DELETE FROM announcements');
    await db.runAsync('DELETE FROM activity_logs');
    await db.runAsync('DELETE FROM checklists');
    await db.runAsync('DELETE FROM checklist_items');
    await db.runAsync('DELETE FROM pending_mutations');
    await db.runAsync('DELETE FROM sync_cursors');
    await db.runAsync('DELETE FROM sync_state');
  });
}

function mapChecklistRows(
  checklists: ChecklistRow[],
  items: ChecklistItemRow[],
): Checklist[] {
  return checklists.map((checklist) => ({
    id: checklist.id,
    title: checklist.title,
    description: checklist.description,
    status: checklist.status,
    assigneeId: checklist.assigneeId,
    dueAt: checklist.dueAt,
    updatedAt: checklist.updatedAt,
    items: items
      .filter((item) => item.checklistId === checklist.id)
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((item) => ({
        id: item.id,
        label: item.label,
        sortOrder: item.sortOrder,
        isCompleted: Boolean(item.isCompleted),
        completedAt: item.completedAt,
      })),
  }));
}

export async function getCachedChecklists(db: SQLiteDatabase) {
  const [checklists, items] = await Promise.all([
    db.getAllAsync<ChecklistRow>(
      `SELECT
        id,
        title,
        description,
        status,
        assignee_id as assigneeId,
        due_at as dueAt,
        updated_at as updatedAt
      FROM checklists
      ORDER BY updated_at DESC`,
    ),
    db.getAllAsync<ChecklistItemRow>(
      `SELECT
        id,
        checklist_id as checklistId,
        label,
        sort_order as sortOrder,
        is_completed as isCompleted,
        completed_at as completedAt
      FROM checklist_items`,
    ),
  ]);

  return mapChecklistRows(checklists, items);
}

export async function replaceCachedChecklists(
  db: SQLiteDatabase,
  checklists: Checklist[],
) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM checklist_items');
    await db.runAsync('DELETE FROM checklists');

    for (const checklist of checklists) {
      await db.runAsync(
        `INSERT INTO checklists (
          id,
          title,
          description,
          status,
          assignee_id,
          due_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        checklist.id,
        checklist.title,
        checklist.description,
        checklist.status,
        checklist.assigneeId,
        checklist.dueAt,
        checklist.updatedAt,
      );

      for (const item of checklist.items) {
        await db.runAsync(
          `INSERT INTO checklist_items (
            id,
            checklist_id,
            label,
            sort_order,
            is_completed,
            completed_at
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          item.id,
          checklist.id,
          item.label,
          item.sortOrder,
          item.isCompleted ? 1 : 0,
          item.completedAt,
        );
      }
    }
  });

  return getCachedChecklists(db);
}
