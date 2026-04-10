import type { SQLiteDatabase } from '@/src/db/sqlite-provider';

import {
  acknowledgeAnnouncementCache,
  approveRequest,
  claimOpenShift,
  createLeaveRequest,
  createOpenShift,
  createYieldRequest,
  rejectRequest,
} from '@/src/db/repositories';
import type {
  CreateLeaveRequestInput,
  CreateOpenShiftInput,
  CreateYieldRequestInput,
  MutationActionResult,
} from '@/src/types/models';
import { createId } from '@/src/utils/id';

import { getSessionSnapshot } from '@/src/services/session/session-store';
import {
  createPendingMutationRecord,
  queueMutation,
} from '@/src/services/sync/sync-engine';

function hasRemoteSession() {
  return Boolean(getSessionSnapshot().session?.accessToken);
}

function buildLocalResult(): MutationActionResult {
  return {
    delivery: 'sent',
    clientMutationId: createId('local-mutation'),
  };
}

export async function createOpenShiftAction(
  db: SQLiteDatabase,
  input: CreateOpenShiftInput,
) {
  await createOpenShift(db, input);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'open_shift_create',
    payload: input,
    entityType: 'open_shift',
    dedupeKey: `open_shift:${input.date}:${input.startTime}:${input.endTime}:${input.storeName}:${input.position}`,
  });

  return queueMutation(db, mutation);
}

export async function claimOpenShiftAction(
  db: SQLiteDatabase,
  openShiftId: string,
  employeeId: string,
) {
  await claimOpenShift(db, openShiftId, employeeId);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'open_shift_claim',
    payload: { openShiftId },
    entityId: openShiftId,
    entityType: 'open_shift',
    dedupeKey: `open_shift_claim:${openShiftId}`,
  });

  return queueMutation(db, mutation);
}

export async function createLeaveRequestAction(
  db: SQLiteDatabase,
  input: CreateLeaveRequestInput,
) {
  await createLeaveRequest(db, input);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'request_leave',
    payload: {
      shiftId: input.shiftId,
      reason: input.reason,
    },
    entityId: input.shiftId,
    entityType: 'request',
    dedupeKey: `request_leave:${input.shiftId}`,
  });

  return queueMutation(db, mutation);
}

export async function createYieldRequestAction(
  db: SQLiteDatabase,
  input: CreateYieldRequestInput,
) {
  await createYieldRequest(db, input);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'request_yield',
    payload: {
      shiftId: input.shiftId,
      targetEmployeeId: input.targetEmployeeId,
      reason: input.reason,
    },
    entityId: input.shiftId,
    entityType: 'request',
    dedupeKey: `request_yield:${input.shiftId}:${input.targetEmployeeId}`,
  });

  return queueMutation(db, mutation);
}

export async function approveRequestAction(
  db: SQLiteDatabase,
  requestId: string,
  managerId: string,
  managerNote?: string,
) {
  await approveRequest(db, requestId, managerId, managerNote);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'request_approve',
    payload: {
      requestId,
      managerNote,
    },
    entityId: requestId,
    entityType: 'request',
    dedupeKey: `request_approve:${requestId}`,
  });

  return queueMutation(db, mutation);
}

export async function rejectRequestAction(
  db: SQLiteDatabase,
  requestId: string,
  managerId: string,
  managerNote?: string,
) {
  await rejectRequest(db, requestId, managerId, managerNote);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'request_reject',
    payload: {
      requestId,
      managerNote,
    },
    entityId: requestId,
    entityType: 'request',
    dedupeKey: `request_reject:${requestId}`,
  });

  return queueMutation(db, mutation);
}

export async function acknowledgeAnnouncementAction(
  db: SQLiteDatabase,
  announcementId: string,
) {
  const acknowledgedAt = new Date().toISOString();
  await acknowledgeAnnouncementCache(db, announcementId, acknowledgedAt);

  if (!hasRemoteSession()) {
    return buildLocalResult();
  }

  const mutation = await createPendingMutationRecord({
    type: 'announcement_ack',
    payload: {
      announcementId,
    },
    entityId: announcementId,
    entityType: 'announcement',
    dedupeKey: `announcement_ack:${announcementId}`,
  });

  return queueMutation(db, mutation);
}
