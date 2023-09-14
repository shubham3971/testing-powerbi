import { Controller, Get, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Constants } from '../../config/constants';
import { ResponseHeaderInterceptor } from '../../shared/interceptors/response-header.interceptor';
import { OwnerCompanyService } from './owner-company.service';

@Controller()
export class OwnerCompanyController {
  constructor(private ownerCompanyService: OwnerCompanyService) {}

  /**
   * Controller to get owner company details
   * @param request
   * @returns
   */

  @UseGuards(AuthGuard('basic'))
  @UseInterceptors(ResponseHeaderInterceptor)
  @Get(`modules/${Constants.OWNER_COMPANY_ROUTE}/:formName`)
  async fetchOwnerCompanyDetails(@Request() request) {
    const companyId = request.params?.formName;
    const oDataContext = await this.ownerCompanyService.fetchOwnerCompanyContextDetails(companyId);
    return oDataContext;
  }

  /**
   * Controller to fetch all contractor details of owner company
   * @param request
   * @returns
   */
  @UseGuards(AuthGuard('basic'))
  @UseInterceptors(ResponseHeaderInterceptor)
  @Get(`modules/${Constants.OWNER_COMPANY_CONTRACTOR_ROUTE}/:formName`)
  async fetchOwnerCompanyContractorsDetails(@Request() request) {
    const companyId = request.params?.formName;
    const oDataContext = await this.ownerCompanyService.fetchOwnerCompanyContractorsContextDetails(companyId);
    return oDataContext;
  }
}
