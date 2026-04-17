import { Logger, ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppModule } from './app.module';
import type { ValidatedEnv } from './config/env';

function isLoopbackOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/u.test(origin);
}

function setupSwagger(
  app: INestApplication,
  configService: ConfigService<ValidatedEnv, true>,
) {
  const docsEnabled = configService.get<boolean>('API_DOCS_ENABLED') ?? true;

  if (!docsEnabled) {
    return;
  }

  const docsPath = `api/${configService.get<string>('API_DOCS_PATH') ?? 'docs'}`;
  const publicApiBaseUrl = configService.get<string>('PUBLIC_API_BASE_URL');
  const documentBuilder = new DocumentBuilder()
    .setTitle('FlexShift API')
    .setDescription(
      'API phục vụ ứng dụng di động FlexShift, bao gồm xác thực, đồng bộ dữ liệu vận hành, phê duyệt yêu cầu và thông báo nội bộ.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token trả về từ POST /api/auth/login.',
      },
      'access-token',
    )
    .addTag('auth', 'Xác thực phiên đăng nhập cho ứng dụng FlexShift.')
    .addTag(
      'announcements',
      'Quản lý và xác nhận thông báo vận hành trong ứng dụng.',
    )
    .addTag('health', 'Kiểm tra liveness, readiness và trạng thái dịch vụ.');

  if (publicApiBaseUrl) {
    documentBuilder.addServer(publicApiBaseUrl);
  }

  const document = SwaggerModule.createDocument(app, documentBuilder.build(), {
    deepScanRoutes: true,
    autoTagControllers: true,
  });

  SwaggerModule.setup(docsPath, app, document, {
    customSiteTitle: 'FlexShift API Docs',
    jsonDocumentUrl: `${docsPath}-json`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ValidatedEnv, true>);
  const logger = new Logger('Bootstrap');
  const appEnv = configService.get<ValidatedEnv['APP_ENV']>('APP_ENV');
  const allowedOrigins = new Set(
    configService.get<string[]>('CORS_ALLOWED_ORIGINS') ?? [],
  );
  const allowCredentials =
    configService.get<boolean>('CORS_ALLOW_CREDENTIALS') ?? false;
  const port = configService.get<number>('PORT') ?? 3000;

  app.enableCors({
    origin(
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        allowedOrigins.has(origin) ||
        (appEnv !== 'production' && isLoopbackOrigin(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: allowCredentials,
  });
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
  setupSwagger(app, configService);

  await app.listen(port, '0.0.0.0');
  logger.log(`FlexShift backend is listening on port ${port}.`);
}

void bootstrap();
