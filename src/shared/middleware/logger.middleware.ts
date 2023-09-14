import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
// eslint-disable-next-line
const os = require('os');

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    try {
      const RequestLogger = new Logger();
      const hostname = os.hostname;
      const { ip, method, originalUrl: url, body, headers, query } = req;
      const userAgent = req.get('user-agent') || '';
      const startTime = Date.now();
      // To print the api url as soon as it is called
      RequestLogger.log(req.originalUrl);
      // To print the api information after api is successfully called
      req.on('close', () => {
        const responseLogger = new Logger('Response');
        const endTime = Date.now();
        // To calculate the run time of every api
        const resTime = endTime - startTime;
        const { statusCode, statusMessage } = res;
        responseLogger.log(
          `Body "${JSON.stringify(body)}"`
        );
        responseLogger.log(
          `Query "${JSON.stringify(query)}"`
        );
        responseLogger.log(
          `Header ${JSON.stringify(headers)}`
        );
        responseLogger.log(
          `${hostname} "${method} ${url}" ${statusCode} ${statusMessage}  "${userAgent}" "${ip}" ${resTime}ms`
        );
      });
      next();
    } catch (err) {
      const errorLogger = new Logger('Error');
      errorLogger.error(err);
    }
  }
}
