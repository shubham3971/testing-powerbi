import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class MetadataResponseHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const response: Response = http.getResponse();
    response
      .setHeader('Content-Type', 'application/xml; charset=utf-8')
      .setHeader('OData-Version', '4.0')
      .setHeader('accept-encoding', 'gzip, deflate')
      .setHeader('Cache-Control', 'none');
    return next.handle();
  }
}
