import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from '../i18n/i18n.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly i18n = new I18nService();

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const respObj = exceptionResponse as Record<string, any>;
      message = respObj.message || message;
      code = respObj.code || code;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const acceptLanguage = request.headers['accept-language'] as string | undefined;
    const localizedMessage = this.i18n.translate(code, message, acceptLanguage);

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Error: ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - ${status}: ${message}`);
    }

    response.status(status).json({
      status: 'error',
      statusCode: status,
      code,
      message: localizedMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
