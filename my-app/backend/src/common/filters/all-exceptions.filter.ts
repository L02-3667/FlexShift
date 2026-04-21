import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import type { RequestContextRequest } from '../http/request-context';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestContextRequest>();
    const response = context.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const body =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : typeof exceptionResponse === 'object' && exceptionResponse
          ? exceptionResponse
          : { message: 'FlexShift backend encountered an unexpected error.' };

    if (status >= 500) {
      this.logger.error(
        JSON.stringify({
          requestId: request.requestId,
          path: request.originalUrl,
          method: request.method,
          status,
          exception,
        }),
      );
    }

    response.status(status).json({
      statusCode: status,
      requestId: request.requestId ?? null,
      timestamp: new Date().toISOString(),
      ...body,
    });
  }
}
