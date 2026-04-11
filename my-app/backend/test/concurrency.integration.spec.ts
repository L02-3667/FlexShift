import * as request from 'supertest';

import {
  closeTestContext,
  createTestContext,
  loginAs,
  resetTestData,
  type TestContext,
} from './test-app';

describe('concurrency integration', () => {
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

  it('allows only one employee to claim the same open shift during a race', async () => {
    const firstEmployee = await loginAs(context.app, 'an.nguyen@flexshift.app');
    const secondEmployee = await loginAs(
      context.app,
      'linh.tran@flexshift.app',
    );

    const openShift = await context.prisma.openShift.findFirstOrThrow({
      where: { status: 'open' },
      orderBy: { date: 'asc' },
    });

    const [firstClaim, secondClaim] = await Promise.all([
      request(context.app.getHttpServer())
        .post(`/api/open-shifts/${openShift.id}/claim`)
        .set('Authorization', `Bearer ${firstEmployee.accessToken}`)
        .send({}),
      request(context.app.getHttpServer())
        .post(`/api/open-shifts/${openShift.id}/claim`)
        .set('Authorization', `Bearer ${secondEmployee.accessToken}`)
        .send({}),
    ]);

    const responses = [firstClaim, secondClaim].sort(
      (left, right) => left.status - right.status,
    );

    expect(responses[0].status).toBe(201);
    expect(responses[1].status).toBe(409);
    expect(responses[1].body.code).toBe('OPEN_SHIFT_ALREADY_CLAIMED');
  });

  it('lets only one approval decision win when the same request is submitted twice', async () => {
    const employeeSession = await loginAs(
      context.app,
      'an.nguyen@flexshift.app',
    );
    const managerSession = await loginAs(context.app, 'manager@flexshift.app');

    const employee = await context.prisma.user.findUniqueOrThrow({
      where: { email: 'an.nguyen@flexshift.app' },
    });
    const referenceShift = await context.prisma.shift.findFirstOrThrow({
      where: {
        assignments: {
          some: { userId: employee.id },
        },
      },
      orderBy: { date: 'asc' },
    });

    const leaveShift = await context.prisma.shift.create({
      data: {
        storeId: referenceShift.storeId,
        positionId: referenceShift.positionId,
        date: new Date('2026-04-15T00:00:00.000Z'),
        startTime: '22:00',
        endTime: '02:00',
        status: 'scheduled',
        assignments: {
          create: {
            userId: employee.id,
          },
        },
      },
    });

    const leaveRequest = await request(context.app.getHttpServer())
      .post('/api/requests/leave')
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .send({
        shiftId: leaveShift.id,
        reason: 'Can nghi mot buoi de xu ly viec gia dinh.',
      })
      .expect(201);

    const [firstApproval, secondApproval] = await Promise.all([
      request(context.app.getHttpServer())
        .post(`/api/approvals/${leaveRequest.body.id}/approve`)
        .set('Authorization', `Bearer ${managerSession.accessToken}`)
        .send({
          note: 'Duyet lan 1.',
        }),
      request(context.app.getHttpServer())
        .post(`/api/approvals/${leaveRequest.body.id}/approve`)
        .set('Authorization', `Bearer ${managerSession.accessToken}`)
        .send({
          note: 'Duyet lan 2.',
        }),
    ]);

    const responses = [firstApproval, secondApproval].sort(
      (left, right) => left.status - right.status,
    );

    expect(responses[0].status).toBe(201);
    expect(responses[1].status).toBe(409);
    expect(responses[1].body.code).toBe('REQUEST_ALREADY_REVIEWED');
  });
});
