import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ActionItemRepository } from '../../repository/action-module.repository';
import { OwnerCompanyRepository } from '../../repository/company/owner-company.repository';
import { LookupTableRepository } from '../../repository/lookup-table.repository';
import { ModuleRepository } from '../../repository/module.repository';
import { ModuleProjectRepository } from '../../repository/project/module-project.repository';
import { ModuleRecordTablePluginRepository } from '../../repository/table-plugin.repository';
import { EmployeeRepository } from '../../repository/user/employee.repository';
import { OwnerCompanyService } from '../company/owner-company.service';
import { ModuleProjectService } from '../project/module-project.service';
import { EmployeeService } from '../user/employee.service';
import { ActionItemService } from './action-module.service';
import { LookupTableService } from './lookup-table.service';
import { ModuleController } from './module.controller';
import { ModuleService } from './module.service';
import { ModuleRecordTablePluginService } from './table-plugin.service';

@Module({
  providers: [
    ModuleService,
    ModuleRepository,
    ConfigService,
    ActionItemService,
    ActionItemRepository,
    ModuleRecordTablePluginService,
    ModuleRecordTablePluginRepository,
    LookupTableService,
    LookupTableRepository,
    OwnerCompanyService,
    OwnerCompanyRepository,
    EmployeeService,
    EmployeeRepository,
    ModuleProjectService,
    ModuleProjectRepository
  ],
  controllers: [ModuleController]
})
export class ModuleAccessPrivilegeModule {}
