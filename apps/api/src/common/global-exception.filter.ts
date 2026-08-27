import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { Request, Response } from "express";

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    status: number;
    path: string;
    method: string;
    timestamp: string;
    details?: Record<string, unknown>;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, code, message, details } = this.mapException(exception);

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status} ${code}: ${message}`, exception instanceof Error ? exception.stack : String(exception));
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status} ${code}: ${message}`);
    }

    const body: ErrorResponseBody = {
      error: {
        code,
        message,
        status,
        path: request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
        ...(details ? { details } : {})
      }
    };
    response.status(status).json(body);
  }

  private mapException(exception: unknown): { status: number; code: string; message: string; details?: Record<string, unknown> } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === "string") {
        return { status, code: this.codeForStatus(status), message: resp };
      }
      if (resp && typeof resp === "object") {
        const obj = resp as { message?: unknown; error?: string };
        const message = Array.isArray(obj.message) ? "Validation failed" : String(obj.message ?? exception.message);
        const details = Array.isArray(obj.message) ? { fields: obj.message } : undefined;
        return { status, code: obj.error?.toUpperCase() ?? this.codeForStatus(status), message, details };
      }
      return { status, code: this.codeForStatus(status), message: exception.message };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_ERROR",
      message: "Internal server error"
    };
  }

  private codeForStatus(status: number): string {
    switch (status) {
      case 400: return "BAD_REQUEST";
      case 401: return "UNAUTHORIZED";
      case 403: return "FORBIDDEN";
      case 404: return "NOT_FOUND";
      case 409: return "CONFLICT";
      case 410: return "GONE";
      case 413: return "PAYLOAD_TOO_LARGE";
      case 415: return "UNSUPPORTED_MEDIA_TYPE";
      case 422: return "UNPROCESSABLE_ENTITY";
      case 429: return "TOO_MANY_REQUESTS";
      case 500: return "INTERNAL_ERROR";
      case 502: return "BAD_GATEWAY";
      case 503: return "SERVICE_UNAVAILABLE";
      case 504: return "GATEWAY_TIMEOUT";
      default:
        if (status >= 400 && status < 500) return "CLIENT_ERROR";
        if (status >= 500) return "SERVER_ERROR";
        return "UNKNOWN";
    }
  }
}
