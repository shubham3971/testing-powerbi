import { Controller, Get, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Constants } from '../../config/constants';
import { ResponseHeaderInterceptor } from '../../shared/interceptors/response-header.interceptor';
import { ModuleProjectService } from './module-project.service';

@Controller()
export class ModuleProjectController {
  constructor(private moduleProjectService: ModuleProjectService) {}

  /**
   * To fetch all the projects of the company
   * @param request
   * @returns
   */
  @UseGuards(AuthGuard('basic'))
  // Interceptor to mimic odata headers
  @UseInterceptors(ResponseHeaderInterceptor)
  @Get(`modules/${Constants.MODULE_PROJECT_ROUTE}/:formName`)
  async fetchModuleProjectDetails(@Request() request) {
    const companyId = request.params?.formName;
    const oDataContext = await this.moduleProjectService.fetchModuleProjectContextDetails(companyId, request?.query);
    return oDataContext;
  }
}
