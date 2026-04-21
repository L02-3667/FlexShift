import * as request from 'supertest';

import {
  closeTestContext,
  createTestContext,
  loginAs,
  resetTestData,
  type TestContext,
} from './test-app';

describe('sync and health integration', () => {
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

  it('serves health summary and readiness against the real database', async () => {
    await request(context.app.getHttpServer()).get('/api/health').expect(200);

    const readiness = await request(context.app.getHttpServer())
      .get('/api/health/readiness')
      .expect(200);

    expect(readiness.body.database).toBe('up');
  });

  it('returns the sync pull contract for an authenticated employee', async () => {
    const employeeSession = await loginAs(
      context.app,
      'an.nguyen@flexshift.app',
    );

    const response = await request(context.app.getHttpServer())
      .get('/api/sync/pull?cursor=0')
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .expect(200);

    expect(response.body).toMatchObject({
      domains: expect.any(Object),
      cursor: expect.any(Number),
      serverCursor: expect.any(Number),
    });
    expect(response.body.domains.announcements.items).toBeDefined();
  });

  it('acknowledges an announcement for the signed-in employee', async () => {
    const employeeSession = await loginAs(
      context.app,
      'an.nguyen@flexshift.app',
    );
    const announcement = await context.prisma.announcement.findFirstOrThrow({
      where: { requiresAck: true },
      orderBy: { publishedAt: 'desc' },
    });

    const response = await request(context.app.getHttpServer())
      .post(`/api/announcements/${announcement.id}/ack`)
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .send({})
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.acknowledgedAt).toEqual(expect.any(String));
  });
});
