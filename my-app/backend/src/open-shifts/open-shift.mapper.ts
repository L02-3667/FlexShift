import { toDateOnly } from '../common/utils/shift.utils';

export function mapOpenShiftForMobile(openShift: {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  note: string;
  status: 'open' | 'claimed' | 'cancelled';
  claimedById: string | null;
  updatedAt: Date;
  store: { name: string };
  position: { name: string };
}) {
  return {
    id: openShift.id,
    date: openShift.date.toISOString().slice(0, 10),
    startTime: openShift.startTime,
    endTime: openShift.endTime,
    storeName: openShift.store.name,
    position: openShift.position.name,
    note: openShift.note,
    status: openShift.status,
    claimedByEmployeeId: openShift.claimedById,
    claimedByEmployeeName: null,
    updatedAt: openShift.updatedAt.toISOString(),
  };
}

export function mapShiftForMobile(shift: {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  updatedAt: Date;
  store: { name: string };
  position: { name: string };
  assignments: Array<{ userId: string; user: { fullName: string } }>;
}) {
  const assignee = shift.assignments[0]?.user;

  return {
    id: shift.id,
    employeeId: shift.assignments[0]?.userId ?? '',
    employeeName: assignee?.fullName ?? '',
    date: toDateOnly(shift.date),
    startTime: shift.startTime,
    endTime: shift.endTime,
    storeName: shift.store.name,
    position: shift.position.name,
    status: shift.status,
    updatedAt: shift.updatedAt.toISOString(),
  };
}
