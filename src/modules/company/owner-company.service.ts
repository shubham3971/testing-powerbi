import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ICompany,
  OwnerCompanyColumn,
  OwnerCompanyContractorColumn
} from '../../common/interfaces/company/owner-company.interface';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { Constants, OwnerCompanyConstants, OwnerCompanyContractorConstants } from '../../config/constants';
import { OwnerCompanyRepository } from '../../repository/company/owner-company.repository';

@Injectable()
export class OwnerCompanyService {
  constructor(private configService: ConfigService, private ownerCompanyRepository: OwnerCompanyRepository) {}

  /**
   * Method to generate owner company meta data
   * @param companyName
   * @returns
   */
  generateOwnerCompanyODataMetaData(companyName: string) {
    // columns of owner company data
    const metadataConstants = [
      OwnerCompanyConstants.OWNER_COMPANY_ID,
      OwnerCompanyConstants.OWNER_COMPANY_NAME,
      OwnerCompanyConstants.OWNER_COMPANY_SITE,
      OwnerCompanyConstants.OWNER_COMPANY_PLANT,
      OwnerCompanyConstants.OWNER_COMPANY_AREA,
      OwnerCompanyConstants.OWNER_COMPANY_ZONE
    ];

    let entityType = ``;
    let entityContainer = ``;

    // To escape special characters
    const EntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.OWNER_COMPANY_ENTITY_NAME}`.toUpperCase()
    );

    const EntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.OWNER_COMPANY_ENTITY_NAME}`
    );

    let entitySchema = `<EntityType Name="${EntityName}" OpenType="true">`;
    entitySchema += `<Property Name="${OwnerCompanyConstants.OWNER_COMPANY_SL_NO}" Type="Edm.Decimal" Nullable="true"/>\n`;

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
   * Method to format Owner Company data
   * @param companyData
   * @returns
   */
  private async formatOwnerCompanyData(companyData: ICompany) {
    // This is variable declaration for the owner company data

    const companiesData: OwnerCompanyColumn[] = [];
    const sites = companyData?.sites;

    // To form owner company data
    if (sites?.length) {
      sites.sort((s1, s2) => s1.name.localeCompare(s2.name));
      const companyId = companyData?.companyId;
      const companyName = companyData?.name;

      // Initial company sl no
      let companySlNo = 0;

      for (const site of sites) {
        const sitePlants = site?.plants;

        if (sitePlants?.length) {
          sitePlants.sort((s1, s2) => s1.name.localeCompare(s2.name));
          for (const plant of sitePlants) {
            const companyAreas = plant.areas;
            const companyZones = plant.zones;

            // To get plant if both area and zones are empty
            if (!companyAreas.length && !companyZones.length) {
              companySlNo++;
              companiesData.push({
                [OwnerCompanyConstants.OWNER_COMPANY_ID]: companyId,
                [OwnerCompanyConstants.OWNER_COMPANY_NAME]: companyName,
                [OwnerCompanyConstants.OWNER_COMPANY_SL_NO]: companySlNo,
                [OwnerCompanyConstants.OWNER_COMPANY_PLANT]: plant.name,
                [OwnerCompanyConstants.OWNER_COMPANY_AREA]: '',
                [OwnerCompanyConstants.OWNER_COMPANY_SITE]: site.name,
                [OwnerCompanyConstants.OWNER_COMPANY_ZONE]: ''
              });
            } else {
              // To map area values
              if (companyAreas.length) {
                companyAreas.sort((s1, s2) => s1.name.localeCompare(s2.name));
                for (const area of companyAreas) {
                  companySlNo++;

                  companiesData.push({
                    [OwnerCompanyConstants.OWNER_COMPANY_ID]: companyId,
                    [OwnerCompanyConstants.OWNER_COMPANY_NAME]: companyName,
                    [OwnerCompanyConstants.OWNER_COMPANY_SL_NO]: companySlNo,
                    [OwnerCompanyConstants.OWNER_COMPANY_PLANT]: plant.name,
                    [OwnerCompanyConstants.OWNER_COMPANY_AREA]: area.name,
                    [OwnerCompanyConstants.OWNER_COMPANY_SITE]: site.name,
                    [OwnerCompanyConstants.OWNER_COMPANY_ZONE]: ''
                  });
                }
              }

              // To map zone values
              if (companyZones.length) {
                companyZones.sort((s1, s2) => s1.name.localeCompare(s2.name));
                for (const zone of companyZones) {
                  companySlNo++;
                  companiesData.push({
                    [OwnerCompanyConstants.OWNER_COMPANY_ID]: companyId,
                    [OwnerCompanyConstants.OWNER_COMPANY_NAME]: companyName,
                    [OwnerCompanyConstants.OWNER_COMPANY_SL_NO]: companySlNo,
                    [OwnerCompanyConstants.OWNER_COMPANY_PLANT]: plant.name,
                    [OwnerCompanyConstants.OWNER_COMPANY_AREA]: '',
                    [OwnerCompanyConstants.OWNER_COMPANY_SITE]: site.name,
                    [OwnerCompanyConstants.OWNER_COMPANY_ZONE]: zone.name
                  });
                }
              }
            }
          }
        } else {
          // if a site does not contain a plant then site name should be displayed
          companySlNo++;
          companiesData.push({
            [OwnerCompanyConstants.OWNER_COMPANY_ID]: companyId,
            [OwnerCompanyConstants.OWNER_COMPANY_NAME]: companyName,
            [OwnerCompanyConstants.OWNER_COMPANY_SL_NO]: companySlNo,
            [OwnerCompanyConstants.OWNER_COMPANY_PLANT]: '',
            [OwnerCompanyConstants.OWNER_COMPANY_AREA]: '',
            [OwnerCompanyConstants.OWNER_COMPANY_SITE]: site.name,
            [OwnerCompanyConstants.OWNER_COMPANY_ZONE]: ''
          });
        }
      }
    }
    return companiesData;
  }

  /**
   * Method to fetch owner company  context details
   * @param companyId
   * @returns
   */

  async fetchOwnerCompanyContextDetails(companyId: string) {
    try {
      // To fetch owner company data
      const companyData = await this.ownerCompanyRepository.fetchOwnersCompanyDetails(companyId);
      let companyName = '';
      let entityName = '';
      let ownerCompanyData: OwnerCompanyColumn[] = [];

      if (companyData?.length) {
        companyName = companyData[0]?.name;
        entityName = `${companyName}-${Constants.OWNER_COMPANY_ENTITY_NAME}`;
        ownerCompanyData = await this.formatOwnerCompanyData(companyData[0]);
      }

      const oDataContext = {
        '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
        value: ownerCompanyData
      };
      return oDataContext;
    } catch (err) {
      const logger = new Logger();
      logger.error(err);
      throw new InternalServerErrorException('Error ', err);
    }
  }

  /**
   * Method to generate owner company contractors meta data
   * @param companyName
   * @returns
   */
  generateOwnerCompanyContractorsODataMetaData(companyName: string) {
    // Columns of owner company contractors data
    const metadataConstants = [
      OwnerCompanyConstants.OWNER_COMPANY_NAME,
      OwnerCompanyConstants.OWNER_COMPANY_ID,
      OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_NAME,
      OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_ID
    ];

    let entityType = ``;
    let entityContainer = ``;

    const EntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.OWNER_COMPANY_CONTRACTOR_ENTITY_NAME}`.toUpperCase()
    );
    const EntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
      `${companyName}-${Constants.OWNER_COMPANY_CONTRACTOR_ENTITY_NAME}`
    );

    let entitySchema = `<EntityType Name="${EntityName}" OpenType="true">`;
    const containerSchema = `<EntitySet Name="${EntitySetName}" EntityType="userData.${EntityName}"/> \n`;
    entitySchema += `<Property Name="${OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_SL_NO}" Type="Edm.Decimal" Nullable="true"/>\n`;

    // To map column names
    metadataConstants.forEach((column) => {
      entitySchema += `<Property Name="${column}" Type="Edm.String" Nullable="true"/>\n`;
    });

    entitySchema += `</EntityType>\n`;
    entityType += entitySchema;
    entityContainer += containerSchema;
    return {
      entityType: entityType,
      entityContainer: entityContainer
    };
  }

  /**
   * Method to format owner company contractors data
   * @param companyData
   * @returns
   */
  private async formatOwnerCompanyContractorsData(companyData: ICompany) {
    const contractorsData: OwnerCompanyContractorColumn[] = [];
    const contractors = companyData?.contractors;
    const companyId = companyData?.companyId;
    const companyName = companyData?.name;

    let contractorSlNo = 0;

    // To get owner company contractor data
    if (contractors?.length) {
      contractors.sort((s1, s2) => s1.name.localeCompare(s2.name));
      for (const contractor of contractors) {
        contractorSlNo++;
        contractorsData.push({
          [OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_SL_NO]: contractorSlNo,
          [OwnerCompanyConstants.OWNER_COMPANY_ID]: companyId,
          [OwnerCompanyConstants.OWNER_COMPANY_NAME]: companyName,
          [OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_NAME]: contractor.name,
          [OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_ID]: contractor.companyId
        });
      }
    }
    return contractorsData;
  }

  /**
   * Method to fetch owner company contractor context details
   * @param companyId
   * @returns
   */

  async fetchOwnerCompanyContractorsContextDetails(companyId: string) {
    try {
      const companyData = await this.ownerCompanyRepository.fetchOwnersCompanyDetails(companyId);

      let companyName = '';
      let entityName = '';
      let contractorsData: OwnerCompanyContractorColumn[] = [];

      if (companyData?.length) {
        companyName = companyData[0]?.name;
        entityName = `${companyName}-${Constants.OWNER_COMPANY_CONTRACTOR_ENTITY_NAME}`;
        contractorsData = await this.formatOwnerCompanyContractorsData(companyData[0]);
      }

      const oDataContext = {
        '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
        value: contractorsData
      };

      return oDataContext;
    } catch (err) {
      const logger = new Logger();
      logger.error(err);
      throw new InternalServerErrorException('Error ', err);
    }
  }
}
