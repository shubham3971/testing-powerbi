import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OwnerCompanyRepository } from '../../repository/company/owner-company.repository';
import { OwnerCompanyController } from './owner-company.controller';
import { OwnerCompanyService } from './owner-company.service';

@Module({
  providers: [OwnerCompanyService, ConfigService, OwnerCompanyRepository],
  controllers: [OwnerCompanyController]
})
export class OwnerCompanyModule {}
