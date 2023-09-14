import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors();
  const configService = app.get(ConfigService);
  const port = configService.get('PORT');
  await app.listen(port || 5000);
  // Logging server starting status
  const logger = new Logger('INFO');
  logger.log(`[message: starting HTTP server on port :${port}]`);
}
bootstrap();
