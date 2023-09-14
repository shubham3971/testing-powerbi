import { Module } from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';

import { OwnerCompanyRepository } from '../../repository/company/owner-company.repository';
import { EmployeeRepository } from '../../repository/user/employee.repository';
import { OwnerCompanyService } from '../company/owner-company.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  providers: [ConfigService, EmployeeRepository, EmployeeService, OwnerCompanyService, OwnerCompanyRepository],
  controllers: [EmployeeController]
})
export class EmployeeModule {}
