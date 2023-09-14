import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IPaginationQuery } from '../../common/interfaces/module/module.interface';
import {
  IModuleProject,
  ModuleProjectColumn,
  ModuleProjectLevel
} from '../../common/interfaces/project/module-project.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import {
  Constants,
  ModuleProjectConstants,
  ModuleProjectStatusConstants,
  MultipleEntrySeparator,
  PAGINATION_QUERY
} from '../../config/constants';
import { ModuleProjectRepository } from '../../repository/project/module-project.repository';

@Injectable()
export class ModuleProjectService {
  constructor(private configService: ConfigService, private moduleProjectRepository: ModuleProjectRepository) {}

  /**
   * To generate Module Project meta data
   * @param companyName
   * @returns
   */
  generateModuleProjectODataMetadata(companyName: string) {
    // To form meta data columns
    const metadataConstants = [
      ModuleProjectConstants.ID,
      ModuleProjectConstants.NAME,
      ModuleProjectConstants.DESCRIPTION,
      ModuleProjectConstants.LEVEL,
      ModuleProjectConstants.COMPANY,
      ModuleProjectConstants.SITE_LOCATION,
      ModuleProjectConstants.MODULE_ACCESS_PRIVILEGES,
      ModuleProjectConstants.START_DATE,
      ModuleProjectConstants.COMPLETION_DATE,
      ModuleProjectConstants.ADDRESS,
      ModuleProjectConstants.CITY,
      ModuleProjectConstants.STATE,
      ModuleProjectConstants.ZIP_CODE,
      ModuleProjectConstants.CONTACT_NAME,
      ModuleProjectConstants.PHONE_NUMBER,
      ModuleProjectConstants.PERMISSION_APPROVAL,
      ModuleProjectConstants.STATUS
    ];

    let entityType = ``;
    let entityContainer = ``;

    // To escape special characters
    const EntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.MODULE_PROJECT_ENTITY_NAME}`.toUpperCase()
    );

    const EntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.MODULE_PROJECT_ENTITY_NAME}`
    );

    let entitySchema = `<EntityType Name="${EntityName}" OpenType="true">`;
    entitySchema += `<Property Name="${ModuleProjectConstants.SL_NO}" Type="Edm.Decimal" Nullable="true"/>\n`;

    const containerSchema = `<EntitySet Name="${EntitySetName}" EntityType="userData.${EntityName}"/> \n`;

    metadataConstants.forEach((column) => {
      entitySchema += `<Property Name="${column}" Type="Edm.String" Nullable="true"/>\n`;
    });

    entitySchema += `</EntityType>\n`;

    // To concat the column values
    entityType += entitySchema;
    entityContainer += containerSchema;

    return {
      entityType: entityType,
      entityContainer: entityContainer
    };
  }

  /**
   * To format module project data
   * @param moduleProjects
   * @param skip
   * @returns
   */
  private formatModuleProjectData(moduleProjects: IModuleProject[], skip: number) {
    if (moduleProjects?.length) {
      const moduleProjectInfo: ModuleProjectColumn[] = [];
      let projectSlNo: number = skip;

      for (const project of moduleProjects) {
        projectSlNo++;

        const companyName = project?.company?.name ?? '';
        const siteName = project?.site?.name ?? '';
        const igzId = project?.projectIGZId;
        const projectName = project?.name ?? '';
        const description = project?.description ?? '';
        const projectLevel = project?.level ? ModuleProjectLevel[project.level] : '';
        const startDate = project.startDate ? project?.startDate?.toISOString() : '';
        const completionDate = project.completionDate ? project?.completionDate?.toISOString() : '';
        const moduleAccessPrivilege = project?.moduleAccessPrivileges?.length
          ? project?.moduleAccessPrivileges?.reduce((str, opt) => {
              return str + `${str ? MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR : ''}${opt.name}`;
            }, '')
          : '';
        const address = project?.address ?? '';
        const city = project?.city ?? '';
        const state = project?.state ?? '';
        const zipCode = project?.zipCode ?? '';
        const contactName = project?.contactName ?? '';
        const phoneNumber = project?.mobile ?? '';
        const status = project?.isActive ? ModuleProjectStatusConstants.ACTIVE : ModuleProjectStatusConstants.INACTIVE;
        // To get multiple user permission approval in comas
        const projectPermissionApproval = project?.userPermissionApproval?.length
          ? project?.userPermissionApproval?.reduce((str, opt) => {
              return (
                str +
                `${str ? MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR : ''}${opt.firstName} ${
                  opt.lastName
                }`
              );
            }, '')
          : '';

        moduleProjectInfo.push({
          [ModuleProjectConstants.SL_NO]: projectSlNo,
          [ModuleProjectConstants.ID]: igzId,
          [ModuleProjectConstants.NAME]: projectName,
          [ModuleProjectConstants.DESCRIPTION]: description,
          [ModuleProjectConstants.LEVEL]: projectLevel,
          [ModuleProjectConstants.COMPANY]: companyName,
          [ModuleProjectConstants.MODULE_ACCESS_PRIVILEGES]: moduleAccessPrivilege,
          [ModuleProjectConstants.SITE_LOCATION]: siteName,
          [ModuleProjectConstants.START_DATE]: startDate,
          [ModuleProjectConstants.COMPLETION_DATE]: completionDate,
          [ModuleProjectConstants.ADDRESS]: address,
          [ModuleProjectConstants.CITY]: city,
          [ModuleProjectConstants.STATE]: state,
          [ModuleProjectConstants.ZIP_CODE]: zipCode,
          [ModuleProjectConstants.CONTACT_NAME]: contactName,
          [ModuleProjectConstants.PHONE_NUMBER]: phoneNumber,
          [ModuleProjectConstants.PERMISSION_APPROVAL]: projectPermissionApproval,
          [ModuleProjectConstants.STATUS]: status
        });
      }
      return moduleProjectInfo;
    } else {
      return [];
    }
  }

  /**
   * To fetch module project context details
   * @param companyId
   * @param query
   * @returns
   */
  async fetchModuleProjectContextDetails(companyId: string, query: IPaginationQuery) {
    try {
      // To fetch Pagination query
      const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

      // To fetch company project info
      const moduleProjectInfo: IModuleProject[] = await this.moduleProjectRepository.fetchModuleProjectDetails(
        companyId,
        parsedSkip,
        updatedTop
      );

      let entityName = '';
      let moduleProjectData: ModuleProjectColumn[] = [];

      if (moduleProjectInfo?.length) {
        entityName = `${moduleProjectInfo[0].company.name}-${Constants.MODULE_PROJECT_ENTITY_NAME}`;
        moduleProjectData = this.formatModuleProjectData(moduleProjectInfo, parsedSkip);
      }

      const oDataContext = {
        '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
        value: moduleProjectData
      };

      // Flag the generate the pagination query
      const isNextODataLinkRequired = !isPreview && moduleProjectInfo?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

      // To set next odata link based on condition
      if (isNextODataLinkRequired)
        oDataContext['@odata.nextLink'] = `${this.configService.get<string>('BASE_URL')}/modules/${
          Constants.MODULE_PROJECT_ROUTE
        }/${companyId}?$top=${PAGINATION_QUERY.DEFAULT_LIMIT}&&$skip=${updatedSkip}`;

      return oDataContext;
    } catch (err) {
      const logger = new Logger();
      logger.error(err);
      throw new InternalServerErrorException('Error ', err);
    }
  }
}
