import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  FieldsType,
  IElementOption,
  IModuleTemplateTablePluginColumn,
  IPaginationQuery
} from '../../common/interfaces/module/module.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { Constants, MultipleEntrySeparator, PAGINATION_QUERY } from '../../config/constants';
import { ModuleRepository } from '../../repository/module.repository';
import { ModuleRecordTablePluginRepository } from '../../repository/table-plugin.repository';

@Injectable()
export class ModuleRecordTablePluginService {
  constructor(
    private moduleRepository: ModuleRepository,
    private configService: ConfigService,
    private tablePluginRepository: ModuleRecordTablePluginRepository
  ) {}

  /**
   *Method to get the get the table plugin data context
   * @param moduleUrl company, site and module info url
   * @param userId user id of logged in user
   * @param query pagination queries
   * @returns
   */
  async getModuleRecordTablePluginContextDetails(moduleUrl: string, userId: string, query: IPaginationQuery) {
    // To fetch Pagination query
    const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

    // fetch the table plugin records
    const { tablePluginResultValues, isNextODataLinkRequired } = await this.fetchModuleRecordTablePluginDetails(
      moduleUrl,
      parsedSkip,
      updatedTop,
      isPreview
    );
    const ODataTableValueContextDetail = await this.generateODataTablePluginValueContextDetail(
      moduleUrl,
      userId,
      tablePluginResultValues,
      updatedSkip,
      isNextODataLinkRequired
    );
    return ODataTableValueContextDetail;
  }

  /**
   * Method to fetch the table plugin records with pagination
   * @param moduleUrl
   * @param skip
   * @param top
   * @param isPreview
   * @returns
   */
  async fetchModuleRecordTablePluginDetails(moduleUrl: string, skip: number, top: number, isPreview: boolean) {
    try {
      let isNextODataLinkRequired = false;
      const tablePluginResultValues: FieldsType[] = [];
      const [company, site, moduleAccessPrivilege] = moduleUrl.split('-');

      const moduleTemplateData = await this.moduleRepository.fetchModuleTemplateMetaDataFields({
        companyId: company,
        siteId: site,
        moduleId: moduleAccessPrivilege
      });

      if (moduleTemplateData && moduleTemplateData.tablePluginDetails?.length > 0) {
        const { tablePluginDetails } = moduleTemplateData;
        type IModuleTemplateTablePluginType = IModuleTemplateTablePluginColumn & { tablePluginElementId: string };

        const tablePluginRowResult: FieldsType = {},
          elementDetails: IModuleTemplateTablePluginType[] = [];

        tablePluginDetails.forEach((tablePluginInfo, index) => {
          const updatedTablePluginLabel =
            index === 0 ? Constants.TABLE_PLUGIN_LABEL : `${Constants.TABLE_PLUGIN_LABEL}_${index}`;
          tablePluginRowResult[updatedTablePluginLabel] = '';

          tablePluginInfo.tablePluginColumns.forEach((tablePluginColumnInfo) => {
            const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(
              tablePluginColumnInfo.columnName
            );
            tablePluginRowResult[formattedColumnName] = '';

            if (!tablePluginColumnInfo.columnValue) {
              elementDetails.push({
                ...tablePluginColumnInfo,
                tablePluginElementId: tablePluginInfo.tablePluginElementId
              });
            }
          });
        });

        const tablePluginRecords = await this.tablePluginRepository.fetchTablePluginRecords(
          {
            company,
            site,
            moduleAccessPrivilege,
            timezone: Constants.TIMEZONE
          },
          skip,
          top
        );

        // enabling next oData link based preview or load
        isNextODataLinkRequired = !isPreview && tablePluginRecords?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

        if (tablePluginRecords?.length) {
          for (const tablePluginData of tablePluginRecords) {
            const tablePluginDataLevelCopy = { ...tablePluginRowResult };

            tablePluginDataLevelCopy['IGZ ID'] = tablePluginData.employeeModuleId;

            const tablePluginElementIndex = moduleTemplateData.tablePluginDetails.findIndex(
              (element) => element.tablePluginElementId === tablePluginData?.tablePluginDetails?.nodeId
            );
            const tablePluginInfo = moduleTemplateData.tablePluginDetails[tablePluginElementIndex];
            if (tablePluginInfo) {
              const updatedTablePluginLabel =
                tablePluginElementIndex === 0
                  ? Constants.TABLE_PLUGIN_LABEL
                  : `${Constants.TABLE_PLUGIN_LABEL}_${tablePluginElementIndex}`;
              tablePluginDataLevelCopy[updatedTablePluginLabel] = tablePluginInfo.tablePluginLabel;

              tablePluginInfo.tablePluginColumns
                .filter((element) => element.columnValue)
                .forEach((tablePluginColumnInfo) => {
                  const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(
                    tablePluginColumnInfo.columnName
                  );
                  tablePluginDataLevelCopy[formattedColumnName] = tablePluginColumnInfo.columnValue;
                });

              if (tablePluginData?.tablePluginRecords?.columnResults?.length) {
                tablePluginData?.tablePluginRecords?.columnResults.forEach((columnResult) => {
                  const columnAnswer = elementDetails.find(
                    (element) =>
                      element.tablePluginElementId === tablePluginData?.tablePluginRecords?.tablePluginNodeId &&
                      element.columnId === columnResult.columnId
                  );
                  if (columnAnswer) {
                    const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(
                      columnAnswer.columnName
                    );
                    let columnValue = '';
                    if (columnResult.stringField) {
                      columnValue = columnResult.stringField;
                    } else if (columnResult.numberField) {
                      columnValue = columnResult.numberField;
                    } else if (columnResult.dateField) {
                      columnValue = columnResult.dateField?.toISOString();
                    } else if (columnResult.optionField?.length) {
                      columnValue = columnResult.optionField
                        ?.map((option: IElementOption) => option?.label)
                        ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR);
                    } else if (columnResult.calculationField) {
                      columnValue = columnResult.calculationField;
                    }
                    tablePluginDataLevelCopy[formattedColumnName] = columnValue;
                  }
                });

                tablePluginResultValues.push(tablePluginDataLevelCopy);
              } else {
                tablePluginResultValues.push(tablePluginDataLevelCopy);
              }
            }
          }
        }
      }
      return { tablePluginResultValues, isNextODataLinkRequired };
    } catch (error) {
      return { tablePluginResultValues: [], isNextODataLinkRequired: false };
    }
  }

  /**
   * Method to generate the table plugin oData context Object
   * @param moduleUrl
   * @param userId
   * @param recordDetails
   * @param skip
   * @param isNextODataLinkRequired
   * @returns
   */
  async generateODataTablePluginValueContextDetail(
    moduleUrl: string,
    userId: string,
    recordDetails: FieldsType[],
    skip: number,
    isNextODataLinkRequired: boolean
  ) {
    const [company, site, moduleAccessPrivilege] = moduleUrl.split('-');
    const userPermittedModules = await this.moduleRepository.fetchUserPermittedModules(userId);
    // module selected in power bi
    const selectedModule = userPermittedModules.find(
      (module) => module.companyId === company && module.siteId === site && module.moduleId === moduleAccessPrivilege
    );
    // to form entity name of id with the help of company , site and module name
    const entityName = selectedModule
      ? `${selectedModule.companyName}-${selectedModule.siteName}-${selectedModule.moduleName}`
      : '';

    const oDataContext = {
      '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}-${
        Constants.TABLE_PLUGIN_ENTITY_NAME
      }`,
      value: recordDetails
    };

    // to set next odata link based on condition
    if (isNextODataLinkRequired)
      oDataContext['@odata.nextLink'] = `${this.configService.get<string>('BASE_URL')}/modules/${
        Constants.TABLE_PLUGIN_DATA
      }/${moduleUrl}?$top=${PAGINATION_QUERY.DEFAULT_LIMIT}&&$skip=${skip}`;

    return oDataContext;
  }
}
