import * as request from 'supertest';

import {
  closeTestContext,
  createTestContext,
  loginAs,
  resetTestData,
  type TestContext,
} from './test-app';

describe('auth integration', () => {
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

  it('logs in and resolves /auth/me', async () => {
    const session = await loginAs(context.app, 'manager@flexshift.app');

    const response = await request(context.app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.accessToken}`)
      .expect(200);

    expect(response.body.email).toBe('manager@flexshift.app');
    expect(response.body.role).toBe('manager');
  });

  it('refreshes and then revokes a session on logout', async () => {
    const session = await loginAs(
      context.app,
      'an.nguyen@flexshift.app',
      'refresh-device',
    );

    const refreshResponse = await request(context.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: session.refreshToken,
        deviceId: 'refresh-device',
      })
      .expect(201);

    expect(refreshResponse.body.refreshToken).not.toBe(session.refreshToken);

    await request(context.app.getHttpServer())
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refreshResponse.body.accessToken}`)
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(201);

    await request(context.app.getHttpServer())
      .post('/api/auth/refresh')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
        deviceId: 'refresh-device',
      })
      .expect(401);
  });
});
