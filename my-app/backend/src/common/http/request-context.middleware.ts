import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Response } from 'express';

import type { RequestContextRequest } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: RequestContextRequest, response: Response, next: NextFunction) {
    const requestId = request.header('x-request-id') ?? randomUUID();
    const startedAt = Date.now();

    request.requestId = requestId;
    request.requestStartedAt = startedAt;

    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.logger.log(
        JSON.stringify({
          requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs,
        }),
      );
    });

    next();
  }
}
