import { canViewRequest } from '../src/common/policies/request-access.policy';
import { checkShiftConflict } from '../src/common/policies/schedule-conflict.policy';
import {
  mapOpenShiftForMobile,
  mapShiftForMobile,
} from '../src/open-shifts/open-shift.mapper';
import { mapRequestForMobile } from '../src/requests/request.mapper';

describe('backend policy helpers', () => {
  it('detects schedule overlap conflicts', () => {
    expect(
      checkShiftConflict(
        [
          {
            startTime: '08:00',
            endTime: '12:00',
          },
        ],
        {
          startTime: '11:00',
          endTime: '13:00',
        },
      ),
    ).toBe(true);
  });

  it('allows managers or owners to view a request', () => {
    expect(canViewRequest('manager', 'employee-1', 'manager-1')).toBe(true);
    expect(canViewRequest('employee', 'employee-1', 'employee-1')).toBe(true);
    expect(canViewRequest('employee', 'employee-1', 'employee-2')).toBe(false);
  });

  it('maps open shifts, shifts, and requests into mobile payloads', () => {
    expect(
      mapOpenShiftForMobile({
        id: 'open-1',
        date: new Date('2026-04-13T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '13:00',
        note: 'Need support',
        status: 'open',
        claimedById: null,
        updatedAt: new Date('2026-04-10T08:00:00.000Z'),
        store: { name: 'Central Market' },
        position: { name: 'Thu ngan' },
      }),
    ).toMatchObject({
      id: 'open-1',
      storeName: 'Central Market',
      position: 'Thu ngan',
    });

    expect(
      mapShiftForMobile({
        id: 'shift-1',
        date: new Date('2026-04-13T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '13:00',
        status: 'scheduled',
        updatedAt: new Date('2026-04-10T08:00:00.000Z'),
        store: { name: 'Central Market' },
        position: { name: 'Thu ngan' },
        assignments: [
          {
            userId: 'employee-1',
            user: { fullName: 'An Nguyen' },
          },
        ],
      }),
    ).toMatchObject({
      id: 'shift-1',
      employeeId: 'employee-1',
      employeeName: 'An Nguyen',
    });

    expect(
      mapRequestForMobile({
        id: 'request-1',
        type: 'leave',
        status: 'pending',
        createdById: 'employee-1',
        targetUserId: null,
        reason: 'Family matter',
        managerNote: null,
        createdAt: new Date('2026-04-10T08:00:00.000Z'),
        updatedAt: new Date('2026-04-10T08:05:00.000Z'),
        shift: {
          id: 'shift-1',
          date: new Date('2026-04-13T00:00:00.000Z'),
          startTime: '09:00',
          endTime: '13:00',
          store: { name: 'Central Market' },
          position: { name: 'Thu ngan' },
        },
        createdBy: { fullName: 'An Nguyen' },
        targetUser: null,
        approvalActions: [],
      }),
    ).toMatchObject({
      id: 'request-1',
      createdByEmployeeName: 'An Nguyen',
      shiftStoreName: 'Central Market',
    });
  });
});
