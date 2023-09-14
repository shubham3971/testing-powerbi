import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class ResponseHeaderInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const response: Response = http.getResponse();
    response
      .setHeader(
        'content-type',
        'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
      )
      .setHeader('OData-Version', '4.0')
      .setHeader('accept-encoding', 'gzip, deflate')
      .setHeader('Cache-Control', 'none');
    return next.handle();
  }
}
