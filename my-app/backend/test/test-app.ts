import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { SEED_USER_PASSWORD, seedFlexShift } from '../prisma/seed';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
}

export async function createTestContext(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  return {
    app,
    prisma,
  };
}

export async function resetTestData(prisma: PrismaService) {
  await seedFlexShift(prisma);
}

export async function closeTestContext(context: TestContext) {
  await context.app.close();
}

export async function loginAs(
  app: INestApplication,
  email: string,
  deviceId = `test-device-${email}`,
) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email,
      password: SEED_USER_PASSWORD,
      deviceId,
      deviceName: 'Quality Gate Test Device',
      platform: 'test',
    })
    .expect(201);

  return response.body as {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      role: 'employee' | 'manager';
    };
  };
}
