import * as request from 'supertest';

import {
  closeTestContext,
  createTestContext,
  loginAs,
  resetTestData,
  type TestContext,
} from './test-app';

describe('workflow integration', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext();
  });

  beforeEach(async () => {
    await resetTestData(context.prisma);
  });

  afterAll(async () => {
    await closeTestContext(context);
  });

  it('blocks employees from manager-only open shift creation', async () => {
    const employeeSession = await loginAs(
      context.app,
      'an.nguyen@flexshift.app',
    );

    await request(context.app.getHttpServer())
      .post('/api/open-shifts')
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .send({
        date: '2026-04-20',
        startTime: '09:00',
        endTime: '13:00',
        storeName: 'Central Market',
        position: 'Thu ngân',
        note: 'Manager only',
      })
      .expect(403);
  });

  it('claims an open shift once and returns a conflict on the second claim', async () => {
    const firstEmployee = await loginAs(context.app, 'an.nguyen@flexshift.app');
    const secondEmployee = await loginAs(
      context.app,
      'linh.tran@flexshift.app',
    );

    const openShift = await context.prisma.openShift.findFirstOrThrow({
      where: { status: 'open' },
      orderBy: { date: 'asc' },
    });

    await request(context.app.getHttpServer())
      .post(`/api/open-shifts/${openShift.id}/claim`)
      .set('Authorization', `Bearer ${firstEmployee.accessToken}`)
      .send({})
      .expect(201);

    const conflict = await request(context.app.getHttpServer())
      .post(`/api/open-shifts/${openShift.id}/claim`)
      .set('Authorization', `Bearer ${secondEmployee.accessToken}`)
      .send({})
      .expect(409);

    expect(conflict.body.code).toBe('OPEN_SHIFT_ALREADY_CLAIMED');
  });

  it('creates leave and yield requests, then rejects and conflicts approvals correctly', async () => {
    const employeeAn = await loginAs(context.app, 'an.nguyen@flexshift.app');
    const employeeLinh = await loginAs(context.app, 'linh.tran@flexshift.app');
    const manager = await loginAs(context.app, 'manager@flexshift.app');

    const anUser = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'an.nguyen@flexshift.app' },
    });
    const linhUser = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'linh.tran@flexshift.app' },
    });
    const minhUser = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'minh.pham@flexshift.app' },
    });

    const referenceShift = await context.prisma.shift.findFirstOrThrow({
      where: {
        assignments: {
          some: { userId: anUser.id },
        },
      },
      orderBy: { date: 'asc' },
    });

    const anShift = await context.prisma.shift.create({
      data: {
        storeId: referenceShift.storeId,
        positionId: referenceShift.positionId,
        date: new Date('2026-04-15T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '13:00',
        status: 'scheduled',
        assignments: {
          create: {
            userId: anUser.id,
          },
        },
      },
    });

    const leaveResponse = await request(context.app.getHttpServer())
      .post('/api/requests/leave')
      .set('Authorization', `Bearer ${employeeAn.accessToken}`)
      .send({
        shiftId: anShift.id,
        reason: 'Cần nghỉ một buổi để xử lý việc gia đình.',
      })
      .expect(201);

    expect(leaveResponse.body.status).toBe('pending');

    await request(context.app.getHttpServer())
      .post(`/api/approvals/${leaveResponse.body.id}/reject`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        note: 'Cần cập nhật đề nghị và gửi lại.',
      })
      .expect(201);

    const linhShift = await context.prisma.shift.findFirstOrThrow({
      where: {
        assignments: {
          some: { userId: linhUser.id },
        },
      },
      orderBy: { date: 'asc' },
    });

    await context.prisma.shift.create({
      data: {
        storeId: linhShift.storeId,
        positionId: linhShift.positionId,
        date: linhShift.date,
        startTime: linhShift.startTime,
        endTime: linhShift.endTime,
        status: 'scheduled',
        assignments: {
          create: {
            userId: minhUser.id,
          },
        },
      },
    });

    const yieldResponse = await request(context.app.getHttpServer())
      .post('/api/requests/yield')
      .set('Authorization', `Bearer ${employeeLinh.accessToken}`)
      .send({
        shiftId: linhShift.id,
        targetEmployeeId: minhUser.id,
        reason: 'Cần đổi lịch với đồng nghiệp.',
      })
      .expect(201);

    const approvalConflict = await request(context.app.getHttpServer())
      .post(`/api/approvals/${yieldResponse.body.id}/approve`)
      .set('Authorization', `Bearer ${manager.accessToken}`)
      .send({
        note: 'Thử duyệt trong điều kiện race conflict.',
      })
      .expect(409);

    expect(approvalConflict.body.code).toBe('APPROVAL_RACE_CONFLICT');
  });
});
