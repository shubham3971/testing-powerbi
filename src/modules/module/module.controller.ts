import { Controller, Get, Header, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Constants } from '../../config/constants';
import { ActionItemService as ActionModuleService } from './action-module.service';
import { LookupTableService } from './lookup-table.service';
import { ModuleService } from './module.service';
import { ModuleRecordTablePluginService } from './table-plugin.service';

@Controller()
export class ModuleController {
  constructor(
    private moduleService: ModuleService,
    private actionModuleService: ActionModuleService,
    private tablePluginService: ModuleRecordTablePluginService,
    private lookupTableService: LookupTableService
  ) {}

  /**
   * controller to get user permitted modules
   * @param request
   * @returns
   */

  // @UseInterceptors(ModuleEntitySetInterceptor)
  @UseGuards(AuthGuard('basic'))
  @Header(
    'content-type',
    'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
  )
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get('modules')
  async fetchUserPermittedModules(@Request() request) {
    const userModules = await this.moduleService.fetchUserPermittedModules(request?.user._id, request?.user?.roles);
    return userModules;
  }

  /**
   * controller to get user meta data of user modules
   * @param request
   * @returns
   */

  // @UseInterceptors(ModuleMetaDataInterceptor)
  @UseGuards(AuthGuard('basic'))
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get('modules/\\$metaData')
  async fetchODataTableMetaData(@Request() request) {
    const userModuleMetaData = await this.moduleService.generateODataModuleTableMetaData(
      request?.user._id,
      request?.user?.roles
    );
    return userModuleMetaData;
  }

  /**
   * controller to get module record details
   * @param request
   * @returns
   */
  // @UseInterceptors(ModuleEntitySetInterceptor)

  @UseGuards(AuthGuard('basic'))
  @Header(
    'content-type',
    'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
  )
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get('modules/:formName')
  async fetchModuleRecordDetails(@Request() request) {
    const moduleUrl = request.params?.formName;
    const query = request?.query;
    const moduleRecords = await this.moduleService.getModuleRecordContextDetails(moduleUrl, request?.user._id, query);
    return moduleRecords;
  }

  // @UseInterceptors(ModuleEntitySetInterceptor)
  @UseGuards(AuthGuard('basic'))
  @Header(
    'content-type',
    'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
  )
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get(`modules/${Constants.ACTION_MODULE_ROUTE}/:formName`)
  async fetchActionItemDetails(@Request() request) {
    const moduleUrl = request.params?.formName;
    const query = request?.query;
    const moduleRecords = await this.actionModuleService.getActionModuleContextDetails(
      moduleUrl,
      request?.user._id,
      query
    );
    return moduleRecords;
  }

  @UseGuards(AuthGuard('basic'))
  @Header(
    'content-type',
    'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
  )
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get(`modules/${Constants.TABLE_PLUGIN_DATA}/:formName`)
  async fetchModuleRecordTablePluginDetails(@Request() request) {
    const moduleUrl = request.params?.formName;

    const oDataContext = await this.tablePluginService.getModuleRecordTablePluginContextDetails(
      moduleUrl,
      request?.user._id,
      request?.query
    );
    return oDataContext;
  }

  @UseGuards(AuthGuard('basic'))
  @Header(
    'content-type',
    'application/json;odata.metadata=minimal;odata.streaming=true;IEEE754Compatible=false; charset=utf-8'
  )
  @Header('OData-Version', '4.0')
  @Header('accept-encoding', 'gzip, deflate')
  @Header('Cache-Control', 'none')
  @Get(`modules/${Constants.LOOKUP_TABLE_DATA}/:formName`)
  async fetchLookupTableDetails(@Request() request) {
    const tableId = request.params?.formName;

    const oDataContext = await this.lookupTableService.fetchLookupTableRecords(
      tableId,
      request?.user._id,
      request?.query
    );
    return oDataContext;
  }
}
