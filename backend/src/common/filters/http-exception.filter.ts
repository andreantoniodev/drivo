import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responsePayload: Record<string, unknown> =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? { ...exceptionResponse }
        : { message: exceptionResponse };

    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      responsePayload.message =
        'Muitas requisições. Por segurança, aguarde alguns instantes antes de tentar novamente.';
      this.logger.warn(
        `[RATE LIMIT EXCEEDED] ${request.method} ${request.url} - IP: ${request.ip}`,
      );
    } else if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      responsePayload.message = 'Arquivo muito grande. O limite é de 10 MB.';
      this.logger.warn(`[PAYLOAD TOO LARGE] ${request.method} ${request.url}`);
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - Details: ${JSON.stringify(
          responsePayload,
        )}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...responsePayload,
    });
  }
}
