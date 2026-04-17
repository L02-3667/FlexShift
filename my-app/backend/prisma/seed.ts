import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
export const SEED_USER_PASSWORD = 'FlexShift123!';
const RESET_TABLES = [
  'SyncChange',
  'MutationRecord',
  'AnnouncementAck',
  'Announcement',
  'ChecklistItem',
  'Checklist',
  'AuditLog',
  'ApprovalAction',
  'Notification',
  'Request',
  'ShiftAssignment',
  'OpenShift',
  'Shift',
  'UserSetting',
  'Session',
  'Position',
  'Store',
  'User',
] as const;

async function resetDatabase(client: PrismaClient) {
  const tableList = RESET_TABLES.map(
    (tableName) => `"public"."${tableName}"`,
  ).join(', ');

  if (tableList) {
    await client.$executeRawUnsafe(
      `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
    );
  }
}

export async function seedFlexShift(client: PrismaClient = prisma) {
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, 10);

  await resetDatabase(client);

  const storeCentral = await client.store.create({
    data: {
      code: 'central-market',
      name: 'Central Market',
    },
  });
  const storeRiverside = await client.store.create({
    data: {
      code: 'riverside-kiosk',
      name: 'Riverside Kiosk',
    },
  });

  const cashier = await client.position.create({
    data: {
      name: 'Thu ngân',
    },
  });
  const sales = await client.position.create({
    data: {
      name: 'Bán hàng',
    },
  });
  const barista = await client.position.create({
    data: {
      name: 'Pha chế',
    },
  });

  const manager = await client.user.create({
    data: {
      fullName: 'Lê Hoàng Quân',
      email: 'manager@flexshift.app',
      phone: '0901000001',
      passwordHash,
      role: 'manager',
    },
  });

  const employeeAn = await client.user.create({
    data: {
      fullName: 'An Nguyễn',
      email: 'an.nguyen@flexshift.app',
      phone: '0901000002',
      passwordHash,
      role: 'employee',
    },
  });
  const employeeLinh = await client.user.create({
    data: {
      fullName: 'Linh Trần',
      email: 'linh.tran@flexshift.app',
      phone: '0901000003',
      passwordHash,
      role: 'employee',
    },
  });
  const employeeMinh = await client.user.create({
    data: {
      fullName: 'Minh Phạm',
      email: 'minh.pham@flexshift.app',
      phone: '0901000004',
      passwordHash,
      role: 'employee',
    },
  });

  const shiftMorning = await client.shift.create({
    data: {
      storeId: storeCentral.id,
      positionId: cashier.id,
      date: new Date('2026-04-11T00:00:00.000Z'),
      startTime: '08:00',
      endTime: '12:00',
      status: 'scheduled',
      assignments: {
        create: {
          userId: employeeAn.id,
        },
      },
    },
  });

  const shiftAfternoon = await client.shift.create({
    data: {
      storeId: storeRiverside.id,
      positionId: sales.id,
      date: new Date('2026-04-12T00:00:00.000Z'),
      startTime: '13:00',
      endTime: '17:00',
      status: 'scheduled',
      assignments: {
        create: {
          userId: employeeLinh.id,
        },
      },
    },
  });

  const shiftCompleted = await client.shift.create({
    data: {
      storeId: storeCentral.id,
      positionId: barista.id,
      date: new Date('2026-04-09T00:00:00.000Z'),
      startTime: '17:00',
      endTime: '21:00',
      status: 'completed',
      assignments: {
        create: {
          userId: employeeMinh.id,
        },
      },
    },
  });

  await client.openShift.createMany({
    data: [
      {
        storeId: storeCentral.id,
        positionId: cashier.id,
        date: new Date('2026-04-13T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '13:00',
        note: 'Cần bổ sung gấp cho ca sáng.',
        status: 'open',
      },
      {
        storeId: storeRiverside.id,
        positionId: sales.id,
        date: new Date('2026-04-14T00:00:00.000Z'),
        startTime: '17:00',
        endTime: '21:00',
        note: 'Tăng cường cuối ngày.',
        status: 'open',
      },
    ],
  });

  const pendingLeaveRequest = await client.request.create({
    data: {
      type: 'leave',
      shiftId: shiftMorning.id,
      createdById: employeeAn.id,
      reason: 'Trùng lịch học buổi sáng.',
      status: 'pending',
    },
  });

  const approvedYieldRequest = await client.request.create({
    data: {
      type: 'yield',
      shiftId: shiftAfternoon.id,
      createdById: employeeLinh.id,
      targetUserId: employeeMinh.id,
      reason: 'Cần đổi lịch gia đình trong buổi chiều.',
      status: 'approved',
      managerNote: 'Đã chuyển cho Minh theo lịch mới.',
    },
  });

  await client.approvalAction.create({
    data: {
      requestId: approvedYieldRequest.id,
      managerId: manager.id,
      action: 'approved',
      note: 'Đã chuyển cho Minh theo lịch mới.',
    },
  });

  await client.userSetting.createMany({
    data: [
      {
        userId: manager.id,
        notificationsEnabled: true,
        approvalUpdatesEnabled: true,
        openShiftAlertsEnabled: true,
        remindersEnabled: true,
        reminderMinutesBefore: 60,
        language: 'vi',
        theme: 'system',
      },
      {
        userId: employeeAn.id,
        notificationsEnabled: true,
        approvalUpdatesEnabled: true,
        openShiftAlertsEnabled: true,
        remindersEnabled: true,
        reminderMinutesBefore: 30,
        language: 'vi',
        theme: 'system',
      },
      {
        userId: employeeLinh.id,
        notificationsEnabled: true,
        approvalUpdatesEnabled: true,
        openShiftAlertsEnabled: true,
        remindersEnabled: true,
        reminderMinutesBefore: 60,
        language: 'vi',
        theme: 'light',
      },
    ],
  });

  await client.notification.createMany({
    data: [
      {
        userId: manager.id,
        title: 'Yêu cầu mới cần duyệt',
        body: 'An Nguyễn vừa gửi đơn xin nghỉ ca sáng ngày 11/04.',
        type: 'schedule_updated',
      },
      {
        userId: employeeAn.id,
        title: 'Lịch hôm nay đã được cập nhật',
        body: 'Ca sáng của bạn đang chờ quản lý xem xét.',
        type: 'schedule_updated',
      },
      {
        userId: employeeLinh.id,
        title: 'Đề nghị nhường ca đã được duyệt',
        body: 'Ca chiều của bạn đã được chuyển cho Minh.',
        type: 'request_approved',
      },
    ],
  });

  await client.announcement.createMany({
    data: [
      {
        title: 'Cập nhật quy trình giao ca',
        body: 'Từ ngày mai, mỗi ca tối cần xác nhận handover note trước khi rời cửa hàng.',
        scopeRole: 'employee',
        requiresAck: true,
        createdById: manager.id,
      },
      {
        title: 'Checklist đầu ngày cho quản lý',
        body: 'Xem backlog approval, staffing risk và open shift trước 09:00 mỗi ngày.',
        scopeRole: 'manager',
        requiresAck: false,
        createdById: manager.id,
      },
    ],
  });

  const handoverChecklist = await client.checklist.create({
    data: {
      title: 'Handover cuối ca',
      description: 'Checklist handover thu ngân ca tối',
      status: 'open',
      createdById: manager.id,
      assigneeId: employeeAn.id,
      dueAt: new Date('2026-04-11T21:15:00.000Z'),
      storeId: storeCentral.id,
      shiftId: shiftMorning.id,
      items: {
        create: [
          {
            label: 'Chốt tiền mặt và đối chiếu POS',
            sortOrder: 1,
          },
          {
            label: 'Ghi chú sự cố hoặc note bàn giao',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await client.auditLog.create({
    data: {
      actorUserId: manager.id,
      entityType: 'checklist',
      entityId: handoverChecklist.id,
      action: 'checklist.created',
      summary: 'Đã tạo checklist bàn giao ca',
      payload: {
        assigneeId: employeeAn.id,
      },
    },
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log('Seeded FlexShift backend data');
    console.log(`Manager login: ${manager.email} / ${SEED_USER_PASSWORD}`);
    console.log(`Employee login: ${employeeAn.email} / ${SEED_USER_PASSWORD}`);
    console.log(
      `Reference shifts: ${shiftMorning.id}, ${shiftAfternoon.id}, ${shiftCompleted.id}`,
    );
    console.log(`Pending request: ${pendingLeaveRequest.id}`);
  }
}

async function main() {
  await seedFlexShift(prisma);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
