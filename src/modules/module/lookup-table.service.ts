import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectId } from 'mongodb';

import {
  ILookupTable,
  ILookupTableQuery,
  LookupTableLevel
} from '../../common/interfaces/module/lookup-table.interface';
import { FieldsType, IPaginationQuery, IUserPermittedModule } from '../../common/interfaces/module/module.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { Constants, PAGINATION_QUERY } from '../../config/constants';
import { LookupTableRepository } from '../../repository/lookup-table.repository';
import { ModuleRepository } from '../../repository/module.repository';

@Injectable()
export class LookupTableService {
  constructor(
    private configService: ConfigService,
    private moduleRepository: ModuleRepository,
    private lookupTableRepository: LookupTableRepository
  ) {}

  /**
   * Method to generate lookup table entity set values
   * @param userModules
   * @returns
   */
  async generateLookupTableEntitySet(userModules: IUserPermittedModule[]) {
    try {
      const entitySetValues: { name: string; kind: string; url: string }[] = [];

      // group user permitted modules by company id
      const companyAccessGroup = userModules.reduce(
        (accumulator: { [key: string]: IUserPermittedModule[] }, currentValue) => {
          accumulator[currentValue.companyId] = accumulator[currentValue.companyId] || [];
          accumulator[currentValue.companyId].push(currentValue);
          return accumulator;
        },
        {}
      );

      const lookupTables: ILookupTable[] = [];

      for (const [key, value] of Object.entries(companyAccessGroup)) {
        const siteIds = value.map((element) => new ObjectId(element.siteId));
        const companyId = new ObjectId(key);
        // form thr list query
        const listQuery: ILookupTableQuery[] = [
          {
            level: LookupTableLevel.COMPANY,
            company: companyId
          },
          {
            level: LookupTableLevel.SITE,
            company: companyId,
            site: { $in: siteIds }
          }
        ];

        // fetch the lookup tables
        const lookupTableResult = await this.lookupTableRepository.fetchLookupTables(listQuery);
        if (lookupTableResult?.length) {
          lookupTables.push(...lookupTableResult);
        }
      }

      if (lookupTables && lookupTables?.length > 0) {
        for (const lookupTableData of lookupTables) {
          if (lookupTableData.level === LookupTableLevel.COMPANY) {
            const companyInfo = userModules.find(
              (element) => element.companyId === lookupTableData.company?.toHexString()
            );
            // entity set for Company level lookup tables
            entitySetValues.push({
              name: `${companyInfo.companyName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`,
              kind: 'EntitySet',
              url: `${Constants.LOOKUP_TABLE_DATA}/${lookupTableData._id?.toHexString()}`
            });
          } else {
            // entity set for Company level lookup tables
            const companyInfo = userModules.find(
              (element) =>
                element.companyId === lookupTableData.company?.toHexString() &&
                element.siteId === lookupTableData.site?.toHexString()
            );
            entitySetValues.push({
              name: `${companyInfo.companyName}-${companyInfo.siteName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`,
              kind: 'EntitySet',
              url: `${Constants.LOOKUP_TABLE_DATA}/${lookupTableData._id?.toHexString()}`
            });
          }
        }
      }
      return entitySetValues;
    } catch (error) {
      const logger = new Logger();
      logger.error(error);
      return [];
    }
  }

  /**
   * Method to generate the lookup table metadata
   * @param userModules
   * @returns
   */
  async generateLookupTableODataMetaData(userModules: IUserPermittedModule[]) {
    try {
      let entityType = ``;
      let entityContainer = ``;

      // group user permitted modules by company id
      const companyAccessGroup = userModules.reduce(
        (accumulator: { [key: string]: IUserPermittedModule[] }, currentValue) => {
          accumulator[currentValue.companyId] = accumulator[currentValue.companyId] || [];
          accumulator[currentValue.companyId].push(currentValue);
          return accumulator;
        },
        {}
      );
      const lookupTables: ILookupTable[] = [];

      for (const [key, value] of Object.entries(companyAccessGroup)) {
        const siteIds = value.map((element) => new ObjectId(element.siteId));
        const companyId = new ObjectId(key);

        // forming the table list query
        const listQuery: ILookupTableQuery[] = [
          {
            level: LookupTableLevel.COMPANY,
            company: companyId
          },
          {
            level: LookupTableLevel.SITE,
            company: companyId,
            site: { $in: siteIds }
          }
        ];

        // fetching the lookup tables
        const lookupTableResult = await this.lookupTableRepository.fetchLookupTables(listQuery);

        if (lookupTableResult?.length) {
          lookupTables.push(...lookupTableResult);
        }
      }

      if (lookupTables && lookupTables?.length > 0) {
        for (const lookupTableData of lookupTables) {
          let updateEntityName: string;
          let updatedEntitySetName: string;
          if (lookupTableData.level === LookupTableLevel.COMPANY) {
            const companyInfo = userModules.find(
              (element) => element.companyId === lookupTableData.company?.toHexString()
            );
            updateEntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
              `${companyInfo.companyName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`.toUpperCase()
            );
            updatedEntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
              `${companyInfo.companyName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`
            );
          } else {
            const companyInfo = userModules.find(
              (element) =>
                element.companyId === lookupTableData.company?.toHexString() &&
                element.siteId === lookupTableData.site?.toHexString()
            );
            updateEntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
              `${companyInfo.companyName}-${companyInfo.siteName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`.toUpperCase()
            );
            updatedEntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
              `${companyInfo.companyName}-${companyInfo.siteName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableData.tableName}`
            );
          }

          let entitySchema = `<EntityType Name="${updateEntityName}" OpenType="true">`;

          const containerSchema = `<EntitySet Name="${updatedEntitySetName}" EntityType="userData.${updateEntityName}"/> \n`;

          // to concat all the column property
          lookupTableData.columns.forEach((col) => {
            const updatedColumnName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(col.name);
            entitySchema += `<Property Name="${updatedColumnName}" Type="Edm.String" Nullable="true"/>\n`;
          });

          entitySchema += `</EntityType>\n`;
          entityType += entitySchema;
          entityContainer += containerSchema;
        }
      }

      return {
        entityType: entityType,
        entityContainer: entityContainer
      };
    } catch (error) {
      const logger = new Logger();
      logger.error(error);
      return {};
    }
  }

  /**
   * Method to fetch the lookup table records
   * @param tableId
   * @param userId
   * @param query
   * @returns
   */
  async fetchLookupTableRecords(tableId: string, userId: string, query: IPaginationQuery) {
    if (!tableId) {
      return {};
    }
    // To fetch pagination query
    const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

    // fetch all lookup table values
    const { lookupTableValues } = await this.fetchLookupTableValues(tableId, parsedSkip, updatedTop);

    // flag the generate the pagination query
    const isNextODataLinkRequired = !isPreview && lookupTableValues?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

    const ODataTableValueContextDetail = await this.generateODataLookupTableValueContextDetail(
      tableId,
      userId,
      lookupTableValues,
      updatedSkip,
      isNextODataLinkRequired
    );

    return ODataTableValueContextDetail;
  }

  /**
   * Method to fetch the lookup table values
   * @param tableId
   * @param skip
   * @param top
   * @returns
   */
  async fetchLookupTableValues(
    tableId: string,
    skip: number,
    top: number
  ): Promise<{ lookupTableValues: FieldsType[] }> {
    try {
      // get lookup table by id
      const lookupTableResult = await this.lookupTableRepository.getLookupTableById(tableId);

      if (lookupTableResult) {
        // fetching the lookup table values
        const lookupTableValuesResult = await this.lookupTableRepository.fetchLookupTableValues(tableId, skip, top);

        if (lookupTableValuesResult?.length) {
          const lookupTableValues: FieldsType[] = [];
          const lookupTableRowValue: FieldsType = {};
          const lookupTableColumnDetail: FieldsType = {};

          lookupTableResult?.columns?.forEach((element) => {
            const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(element.name);
            lookupTableColumnDetail[element._id?.toHexString()] = formattedColumnName;
            lookupTableRowValue[formattedColumnName] = '';
          });

          for (const lookTableValueData of lookupTableValuesResult) {
            const lookupTableRowValueCopy = { ...lookupTableRowValue };
            lookTableValueData?.columnValues
              ?.filter((element) => element.value?.length)
              .forEach((element) => {
                if (lookupTableColumnDetail[element.columnId]) {
                  lookupTableRowValueCopy[lookupTableColumnDetail[element.columnId]] = element.value.join(', ');
                }
              });
            lookupTableValues.push(lookupTableRowValueCopy);
          }
          return { lookupTableValues };
        }
      }
      return { lookupTableValues: [] };
    } catch (error) {
      console.log('####Error: ', error);
      return { lookupTableValues: [] };
    }
  }

  /**
   * Method to generate the oData context
   * @param tableId
   * @param userId
   * @param lookupTableValues
   * @param skip
   * @param isNextODataLinkRequired
   * @returns
   */
  async generateODataLookupTableValueContextDetail(
    tableId: string,
    userId: string,
    lookupTableValues: FieldsType[],
    skip: number,
    isNextODataLinkRequired: boolean
  ) {
    // get lookup table by Id
    const lookupTableResult = await this.lookupTableRepository.getLookupTableById(tableId);
    let entityName = '';

    if (lookupTableResult) {
      // fetch user permitted modules
      const userPermittedModules = await this.moduleRepository.fetchUserPermittedModules(userId);
      if (lookupTableResult.level === LookupTableLevel.COMPANY) {
        const companyInfo = userPermittedModules.find(
          (element) => element.companyId === lookupTableResult.company?.toHexString()
        );
        entityName = `${companyInfo.companyName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableResult.tableName}`;
      } else {
        const companyInfo = userPermittedModules.find(
          (element) =>
            element.companyId === lookupTableResult.company?.toHexString() &&
            element.siteId === lookupTableResult.site?.toHexString()
        );
        entityName = `${companyInfo.companyName}-${companyInfo.siteName}-${Constants.LOOKUP_TABLE_ENTITY_NAME}-${lookupTableResult.tableName}`;
      }
    }

    const oDataContext = {
      '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
      value: lookupTableValues
    };

    //to set next odata link based on condition
    if (isNextODataLinkRequired)
      oDataContext['@odata.nextLink'] = `${this.configService.get<string>('BASE_URL')}/modules/${
        Constants.LOOKUP_TABLE_DATA
      }/${tableId}?$top=${PAGINATION_QUERY.DEFAULT_LIMIT}&&$skip=${skip}`;

    return oDataContext;
  }
}
