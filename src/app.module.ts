import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { OwnerCompanyModule } from './modules/company/owner-company.module';
import { ModuleAccessPrivilegeModule } from './modules/module/module.module';
import { ModuleProjectModule } from './modules/project/module-project.module';
import { EmployeeModule } from './modules/user/employee.module';
import { LoggerMiddleware } from './shared/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    AuthModule,
    ModuleAccessPrivilegeModule,
    OwnerCompanyModule,
    EmployeeModule,
    ModuleProjectModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
