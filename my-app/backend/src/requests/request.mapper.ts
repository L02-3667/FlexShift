export function mapRequestForMobile(request: {
  id: string;
  type: 'leave' | 'yield';
  status: 'pending' | 'approved' | 'rejected';
  createdById: string;
  targetUserId: string | null;
  reason: string;
  managerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  shift: {
    id: string;
    date: Date;
    startTime: string;
    endTime: string;
    store: { name: string };
    position: { name: string };
  };
  createdBy: { fullName: string };
  targetUser: { fullName: string } | null;
  approvalActions: Array<{ createdAt: Date }>;
}) {
  const reviewedAt = request.approvalActions[0]?.createdAt ?? null;

  return {
    id: request.id,
    type: request.type,
    createdByEmployeeId: request.createdById,
    shiftId: request.shift.id,
    targetEmployeeId: request.targetUserId,
    reason: request.reason,
    status: request.status,
    managerNote: request.managerNote,
    createdAt: request.createdAt.toISOString(),
    reviewedAt: reviewedAt ? reviewedAt.toISOString() : null,
    createdByEmployeeName: request.createdBy.fullName,
    targetEmployeeName: request.targetUser?.fullName ?? null,
    shiftDate: request.shift.date.toISOString().slice(0, 10),
    shiftStartTime: request.shift.startTime,
    shiftEndTime: request.shift.endTime,
    shiftStoreName: request.shift.store.name,
    shiftPosition: request.shift.position.name,
    updatedAt: request.updatedAt.toISOString(),
  };
}
