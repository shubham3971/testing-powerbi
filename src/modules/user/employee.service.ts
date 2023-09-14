import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ICompany } from '../../common/interfaces/company/owner-company.interface';
import { IPaginationQuery } from '../../common/interfaces/module/module.interface';
import { Roles } from '../../common/interfaces/user/auth.interface';
import { AuditorColumn, IEmployee, PreparerColumn } from '../../common/interfaces/user/employee.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { UserUtils } from '../../common/utils/user/user.utils';
import {
  AuditorEmployeeConstants,
  Constants,
  PAGINATION_QUERY,
  PreparerEmployeeConstants
} from '../../config/constants';
import { EmployeeRepository } from '../../repository/user/employee.repository';

@Injectable()
export class EmployeeService {
  constructor(private configService: ConfigService, private employeeRepository: EmployeeRepository) {}

  /**
   * To generate Auditor Employee's oData meta data
   * @param companyName
   * @returns
   */
  generateAuditorODataMetaData(companyName: string) {
    // Columns of Auditor Employee data
    const metadataConstants = [
      AuditorEmployeeConstants.ID,
      AuditorEmployeeConstants.FIRST_NAME,
      AuditorEmployeeConstants.LAST_NAME,
      AuditorEmployeeConstants.USERNAME,
      AuditorEmployeeConstants.MEMBER_SINCE,
      AuditorEmployeeConstants.COMPANY,
      AuditorEmployeeConstants.JOB,
      AuditorEmployeeConstants.TITLE,
      AuditorEmployeeConstants.ROLE,
      AuditorEmployeeConstants.MOBILE,
      AuditorEmployeeConstants.EMAIL,
      AuditorEmployeeConstants.ANALYTIC_ACCESS,
      AuditorEmployeeConstants.OWNER_ANALYTIC_ACCESS,
      AuditorEmployeeConstants.VERIFIED,
      AuditorEmployeeConstants.VERIFIED_ON,
      AuditorEmployeeConstants.ACCESS_SUSPENDED,
      AuditorEmployeeConstants.ACCESS_SUSPENDED_ON,
      AuditorEmployeeConstants.ACCESS_TERMINATED,
      AuditorEmployeeConstants.ACCESS_TERMINATED_ON
    ];

    let entityType = ``;
    let entityContainer = ``;

    // To escape special characters
    const EntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.AUDITOR_ENTITY_NAME}`.toUpperCase()
    );

    const EntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.AUDITOR_ENTITY_NAME}`
    );

    let entitySchema = `<EntityType Name="${EntityName}" OpenType="true">`;
    entitySchema += `<Property Name="${AuditorEmployeeConstants.SL_NO}" Type="Edm.Decimal" Nullable="true"/>\n`;

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
   * To generate Preparer Employee's meta data
   * @param companyName
   * @returns
   */
  generatePreparerODataMetaData(companyName: string) {
    // columns of Preparer Employee data
    const metadataConstants = [
      PreparerEmployeeConstants.ID,
      PreparerEmployeeConstants.FIRST_NAME,
      PreparerEmployeeConstants.LAST_NAME,
      PreparerEmployeeConstants.USERNAME,
      PreparerEmployeeConstants.MEMBER_SINCE,
      PreparerEmployeeConstants.COMPANY,
      PreparerEmployeeConstants.JOB,
      PreparerEmployeeConstants.TITLE,
      PreparerEmployeeConstants.ROLE,
      PreparerEmployeeConstants.MOBILE,
      PreparerEmployeeConstants.EMAIL,
      PreparerEmployeeConstants.VERIFIED,
      PreparerEmployeeConstants.VERIFIED_ON,
      PreparerEmployeeConstants.ACCESS_SUSPENDED,
      PreparerEmployeeConstants.ACCESS_SUSPENDED_ON,
      PreparerEmployeeConstants.ACCESS_TERMINATED,
      PreparerEmployeeConstants.ACCESS_TERMINATED_ON
    ];

    let entityType = ``;
    let entityContainer = ``;

    // to escape special characters
    const EntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.PREPARER_ENTITY_NAME}`.toUpperCase()
    );

    const EntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.PREPARER_ENTITY_NAME}`
    );

    let entitySchema = `<EntityType Name="${EntityName}" OpenType="true">`;
    entitySchema += `<Property Name="${PreparerEmployeeConstants.SL_NO}" Type="Edm.Decimal" Nullable="true"/>\n`;

    const containerSchema = `<EntitySet Name="${EntitySetName}" EntityType="userData.${EntityName}"/> \n`;

    metadataConstants.forEach((column) => {
      entitySchema += `<Property Name="${column}" Type="Edm.String" Nullable="true"/>\n`;
    });

    entitySchema += `</EntityType>\n`;

    // to concat the column values
    entityType += entitySchema;
    entityContainer += containerSchema;

    return {
      entityType: entityType,
      entityContainer: entityContainer
    };
  }

  /**
   *  To format Auditor Employee's data
   * @param employees
   * @param skip
   * @returns
   */
  private formatAuditorData(employees: IEmployee[], skip: number) {
    if (employees?.length) {
      const auditorData: AuditorColumn[] = [];
      let empSlNo: number = skip;

      for (const employee of employees) {
        let companyName = '';

        if (employee.company) {
          companyName = (employee.company as ICompany).name;
        }

        empSlNo++;
        const igzId: string = employee?.employeeId;
        const firstName: string = employee?.firstName ?? '';
        const lastName: string = employee?.lastName ?? '';
        const username: string = employee?.username;
        const createdAt: string = employee?.createdAt ? employee?.createdAt?.toISOString() : '';
        const job: string = employee?.job?.name ?? '';
        const title: string = employee?.title?.name ?? '';
        const mobile: string = employee?.mobile ?? '';
        const email: string = employee?.email ?? '';
        const roles: string = employee?.roles?.length
          ? employee?.roles?.reduce((str, opt) => {
              return str + `${str ? '/' : ''}${opt.key}`;
            }, '')
          : '';
        const verified: string = employee?.isAdminVerified ? 'Yes' : 'No';
        const verifiedOn: string = employee?.isAdminVerified ? employee?.adminVerifiedOn?.toISOString() : '';
        const isAccessTerminated: string = employee.isAccessTerminated ? 'Yes' : 'No';
        const accessTerminatedOn = employee?.isAccessTerminated ? employee?.accessTerminatedOn?.toISOString() : '';
        const isAccessSuspended: string = employee?.isAccessSuspended ? 'Yes' : 'No';
        const accessSuspendedOn = employee?.isAccessSuspended ? employee?.accessSuspendedOn?.toISOString() : '';
        const analyticsAccess: string = UserUtils.isManager(employee) ? 'Yes' : 'No';
        const contractorAnalyticsAccess: string = employee.isContractorAsOwner ? 'Yes' : 'No';

        auditorData.push({
          [AuditorEmployeeConstants.SL_NO]: empSlNo,
          [AuditorEmployeeConstants.ID]: igzId,
          [AuditorEmployeeConstants.FIRST_NAME]: firstName,
          [AuditorEmployeeConstants.LAST_NAME]: lastName,
          [AuditorEmployeeConstants.USERNAME]: username,
          [AuditorEmployeeConstants.MEMBER_SINCE]: createdAt,
          [AuditorEmployeeConstants.EMAIL]: email,
          [AuditorEmployeeConstants.COMPANY]: companyName,
          [AuditorEmployeeConstants.JOB]: job,
          [AuditorEmployeeConstants.TITLE]: title,
          [AuditorEmployeeConstants.ROLE]: roles,
          [AuditorEmployeeConstants.MOBILE]: mobile,
          [AuditorEmployeeConstants.ANALYTIC_ACCESS]: analyticsAccess,
          [AuditorEmployeeConstants.OWNER_ANALYTIC_ACCESS]: contractorAnalyticsAccess,
          [AuditorEmployeeConstants.VERIFIED]: verified,
          [AuditorEmployeeConstants.VERIFIED_ON]: verifiedOn,
          [AuditorEmployeeConstants.ACCESS_SUSPENDED]: isAccessSuspended,
          [AuditorEmployeeConstants.ACCESS_SUSPENDED_ON]: accessSuspendedOn,
          [AuditorEmployeeConstants.ACCESS_TERMINATED]: isAccessTerminated,
          [AuditorEmployeeConstants.ACCESS_TERMINATED_ON]: accessTerminatedOn
        });
      }
      return auditorData;
    } else {
      return [];
    }
  }

  /**
   * To format Preparer Employee's data
   * @param employees
   * @param skip
   * @returns
   */
  private formatPreparerData(employees: IEmployee[], skip: number) {
    if (employees?.length) {
      const preparersData: PreparerColumn[] = [];
      let empSlNo: number = skip;
      for (const employee of employees) {
        let companyName = '';
        if (employee?.company) {
          companyName = (employee?.company as ICompany).name;
        }
        empSlNo++;
        const igzId: string = employee?.employeeId;
        const firstName: string = employee?.firstName ?? '';
        const lastName: string = employee?.lastName ?? '';
        const username: string = employee?.username;
        const createdAt: string = employee?.createdAt ? employee?.createdAt?.toISOString() : '';
        const job: string = employee?.job?.name ?? '';
        const title: string = employee?.title?.name ?? '';
        const mobile: string = employee?.mobile ?? '';
        const email: string = employee?.email ?? '';
        const verified: string = employee?.isAdminVerified ? 'Yes' : 'No';
        const verifiedOn = employee?.isAdminVerified ? employee?.adminVerifiedOn?.toISOString() : '';
        const isAccessTerminated: string = employee?.isAccessTerminated ? 'Yes' : 'No';
        const accessTerminatedOn = employee?.isAccessTerminated ? employee?.accessTerminatedOn?.toISOString() : '';
        const isAccessSuspended: string = employee?.isAccessSuspended ? 'Yes' : 'No';
        const accessSuspendedOn = employee?.isAccessSuspended ? employee?.accessSuspendedOn?.toISOString() : '';

        preparersData.push({
          [PreparerEmployeeConstants.SL_NO]: empSlNo,
          [PreparerEmployeeConstants.ID]: igzId,
          [PreparerEmployeeConstants.FIRST_NAME]: firstName,
          [PreparerEmployeeConstants.LAST_NAME]: lastName,
          [PreparerEmployeeConstants.USERNAME]: username,
          [PreparerEmployeeConstants.MEMBER_SINCE]: createdAt,
          [PreparerEmployeeConstants.COMPANY]: companyName,
          [PreparerEmployeeConstants.JOB]: job,
          [PreparerEmployeeConstants.TITLE]: title,
          [PreparerEmployeeConstants.ROLE]: Roles.PREPARER,
          [PreparerEmployeeConstants.MOBILE]: mobile,
          [PreparerEmployeeConstants.EMAIL]: email,
          [PreparerEmployeeConstants.VERIFIED]: verified,
          [PreparerEmployeeConstants.VERIFIED_ON]: verifiedOn,
          [PreparerEmployeeConstants.ACCESS_SUSPENDED]: isAccessSuspended,
          [PreparerEmployeeConstants.ACCESS_SUSPENDED_ON]: accessSuspendedOn,
          [PreparerEmployeeConstants.ACCESS_TERMINATED]: isAccessTerminated,
          [PreparerEmployeeConstants.ACCESS_TERMINATED_ON]: accessTerminatedOn
        });
      }
      return preparersData;
    } else {
      return [];
    }
  }

  /**
   * To fetch Employee's context details
   * @param companyId
   * @param query
   * @param role
   * @returns
   */
  async fetchEmployeeContextDetails(companyId: string, query: IPaginationQuery, role: string) {
    try {
      // To fetch Pagination query
      const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

      // To fetch  Employees data
      const employeesData = await this.employeeRepository.fetchEmployees(companyId, role, parsedSkip, updatedTop);

      let entityName = '';
      let companyName = '';
      let employeeData: AuditorColumn[] | PreparerColumn[] = [];

      if (employeesData?.length) {
        // To get company name of the employee for oData context schema
        companyName = employeesData[0].company.name;

        // To fetch context details based on employee roles
        if (role === Roles.AUDITOR) {
          entityName = `${companyName}-${Constants.AUDITOR_ENTITY_NAME}`;
          employeeData = this.formatAuditorData(employeesData, parsedSkip);
        } else {
          entityName = `${companyName}-${Constants.PREPARER_ENTITY_NAME}`;
          employeeData = this.formatPreparerData(employeesData, parsedSkip);
        }
      }
      const oDataContext = {
        '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
        value: employeeData
      };

      // Flag the generate the pagination query
      const isNextODataLinkRequired = !isPreview && employeesData?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

      // To set next odata link based on condition
      if (isNextODataLinkRequired)
        oDataContext['@odata.nextLink'] = `${this.configService.get<string>('BASE_URL')}/modules/${
          role === Roles.AUDITOR ? Constants.AUDITOR_ROUTE : Constants.PREPARER_ROUTE
        }/${companyId}?$top=${PAGINATION_QUERY.DEFAULT_LIMIT}&&$skip=${updatedSkip}`;

      return oDataContext;
    } catch (error) {
      const logger = new Logger();
      logger.error(error);
      throw new InternalServerErrorException('Error ', error);
    }
  }
}
