import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const errorResponse: ApiErrorResponse = {
      status: 'error',
      statusCode,
      data: this.buildErrorData(exceptionResponse, statusCode),
    };

    response.status(statusCode).json({
      ...errorResponse,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private buildErrorData(
    exceptionResponse: string | object | null,
    statusCode: number,
  ) {
    if (typeof exceptionResponse === 'string') {
      return { message: exceptionResponse };
    }

    if (this.isErrorBody(exceptionResponse)) {
      return {
        message: exceptionResponse.message,
        ...(exceptionResponse.error
          ? { error: exceptionResponse.error }
          : {}),
      };
    }

    return {
      message:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal server error'
          : 'Request failed',
    };
  }

  private isErrorBody(
    value: string | object | null,
  ): value is { message: string | string[]; error?: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'message' in value &&
      (typeof value.message === 'string' || Array.isArray(value.message))
    );
  }
}
