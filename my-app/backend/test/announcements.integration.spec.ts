import * as request from 'supertest';

import {
  closeTestContext,
  createTestContext,
  loginAs,
  resetTestData,
  type TestContext,
} from './test-app';

describe('announcements integration', () => {
  jest.setTimeout(30000);

  let context!: TestContext;
  let contextReady = false;

  beforeAll(async () => {
    context = await createTestContext();
    contextReady = true;
  });

  beforeEach(async () => {
    if (contextReady) {
      await resetTestData(context.prisma);
    }
  });

  afterAll(async () => {
    if (contextReady) {
      await closeTestContext(context);
    }
  });

  it('supports manager CRUD flow for announcements', async () => {
    const managerSession = await loginAs(context.app, 'manager@flexshift.app');

    const createResponse = await request(context.app.getHttpServer())
      .post('/api/announcements')
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .send({
        title: 'Cập nhật điều phối cuối tuần',
        body: 'Ca tối cuối tuần cần ưu tiên nhân sự đã quen checklist bàn giao.',
        requiresAck: true,
      })
      .expect(201);

    expect(createResponse.body.title).toBe('Cập nhật điều phối cuối tuần');
    expect(createResponse.body.scopeRole).toBeNull();
    expect(createResponse.body.requiresAck).toBe(true);
    expect(createResponse.body.acknowledgedAt).toBeNull();

    const announcementId = createResponse.body.id as string;

    const listResponse = await request(context.app.getHttpServer())
      .get('/api/announcements')
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .expect(200);

    expect(
      listResponse.body.some(
        (item: { id: string; title: string }) =>
          item.id === announcementId &&
          item.title === 'Cập nhật điều phối cuối tuần',
      ),
    ).toBe(true);

    const detailResponse = await request(context.app.getHttpServer())
      .get(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .expect(200);

    expect(detailResponse.body.id).toBe(announcementId);
    expect(detailResponse.body.body).toContain('checklist bàn giao');

    const updateResponse = await request(context.app.getHttpServer())
      .patch(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .send({
        title: 'Cập nhật điều phối cuối tuần đã chỉnh',
        requiresAck: false,
      })
      .expect(200);

    expect(updateResponse.body.title).toBe(
      'Cập nhật điều phối cuối tuần đã chỉnh',
    );
    expect(updateResponse.body.requiresAck).toBe(false);

    await request(context.app.getHttpServer())
      .delete(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .expect(200, {
        success: true,
      });

    await request(context.app.getHttpServer())
      .get(`/api/announcements/${announcementId}`)
      .set('Authorization', `Bearer ${managerSession.accessToken}`)
      .expect(404);
  });

  it('allows an employee to acknowledge a visible announcement', async () => {
    const employeeSession = await loginAs(context.app, 'an.nguyen@flexshift.app');

    const listResponse = await request(context.app.getHttpServer())
      .get('/api/announcements')
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .expect(200);

    const employeeAnnouncement = listResponse.body.find(
      (item: { id: string; requiresAck: boolean; scopeRole: string | null }) =>
        item.requiresAck === true &&
        (item.scopeRole === null || item.scopeRole === 'employee'),
    ) as { id: string } | undefined;

    expect(employeeAnnouncement).toBeDefined();

    const acknowledgeResponse = await request(context.app.getHttpServer())
      .post(`/api/announcements/${employeeAnnouncement!.id}/ack`)
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .expect(201);

    expect(acknowledgeResponse.body.success).toBe(true);
    expect(acknowledgeResponse.body.acknowledgedAt).toEqual(
      expect.any(String),
    );

    const detailResponse = await request(context.app.getHttpServer())
      .get(`/api/announcements/${employeeAnnouncement!.id}`)
      .set('Authorization', `Bearer ${employeeSession.accessToken}`)
      .expect(200);

    expect(detailResponse.body.acknowledgedAt).toEqual(expect.any(String));
  });
});
