import { Module } from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';

import { ModuleRepository } from '../../repository/module.repository';
import { ModuleProjectRepository } from '../../repository/project/module-project.repository';
import { ModuleProjectController } from './module-project.controller';
import { ModuleProjectService } from './module-project.service';

@Module({
  providers: [ConfigService, ModuleProjectService, ModuleProjectRepository, ModuleRepository],
  controllers: [ModuleProjectController]
})
export class ModuleProjectModule {}
