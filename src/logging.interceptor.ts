import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { method, originalUrl, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;

    const startTime = Date.now();

    this.logger.log(
      `[REQ] ${method} ${originalUrl} | IP: ${ip} | UserAgent: ${userAgent} | Body: ${JSON.stringify(
        body || {},
      )} | Query: ${JSON.stringify(query || {})} | Params: ${JSON.stringify(params || {})}`,
    );

    return next.handle().pipe(
      tap({
        next: (resData) => {
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          this.logger.log(
            `[RES] ${method} ${originalUrl} ${statusCode} | Duration: ${duration}ms | Body: ${JSON.stringify(
              resData || {},
            )}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[ERR] ${method} ${originalUrl} | Duration: ${duration}ms | Error: ${error.message}`,
          );
        },
      }),
    );
  }
}
