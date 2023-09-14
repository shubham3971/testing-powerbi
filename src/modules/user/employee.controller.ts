import { Controller, Get, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../../common/interfaces/user/auth.interface';
import { Constants } from '../../config/constants';
import { ResponseHeaderInterceptor } from '../../shared/interceptors/response-header.interceptor';
import { EmployeeService } from './employee.service';

@Controller()
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  /**
   * Controller to fetch all the auditors of the company
   * @param request
   * @returns
   */
  @UseGuards(AuthGuard('basic'))
  @UseInterceptors(ResponseHeaderInterceptor) // Interceptor to mimic odata headers
  @Get(`modules/${Constants.AUDITOR_ROUTE}/:formName`)
  async fetchAuditorEmployeeDetails(@Request() request) {
    const companyId = request.params?.formName;
    const oDataContext = await this.employeeService.fetchEmployeeContextDetails(
      companyId,
      request?.query,
      Roles.AUDITOR
    );
    return oDataContext;
  }

  /**
   * Controller to fetch all the preparers of the company
   * @param request
   * @returns
   */
  @UseGuards(AuthGuard('basic'))
  @UseInterceptors(ResponseHeaderInterceptor) // interceptor to mimic oData
  @Get(`modules/${Constants.PREPARER_ROUTE}/:formName`)
  async fetchPreparerEmployeeDetails(@Request() request) {
    const companyId = request.params?.formName;
    const oDataContext = await this.employeeService.fetchEmployeeContextDetails(
      companyId,
      request?.query,
      Roles.PREPARER
    );
    return oDataContext;
  }
}
