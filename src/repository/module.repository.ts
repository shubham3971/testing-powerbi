import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import {
  IEmployeeModule,
  IEmployeeModuleRecordQuery,
  IModuleTemplateODataMetaData,
  IUserPermittedModule
} from '../common/interfaces/module/module.interface';
import { TABLE_NAMES } from '../config/constants';

@Injectable()
export class ModuleRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Method to fetch the user permitted sites and module information
   * @param userId id of logged in user
   * @returns user permitted modules
   */
  async fetchUserPermittedModules(userId: string): Promise<IUserPermittedModule[]> {
    return new Promise(async (resolve) => {
      const userModules = this.connection.db
        .collection(TABLE_NAMES.EMPLOYEES)
        .aggregate([
          {
            $match: {
              _id: userId
            }
          },
          {
            $project: {
              permittedSites: 1
            }
          },
          {
            $unwind: {
              path: '$permittedSites',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: '$permittedSites.moduleAccessPrivileges',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $match: {
              $and: [
                { 'permittedSites.moduleAccessPrivileges': { $ne: undefined } },
                { 'permittedSites.company': { $ne: undefined } },
                { 'permittedSites.site': { $ne: undefined } }
              ]
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.MODULE_ACCESS_PRIVILEGES,
              let: { permittedSite: '$permittedSites' },
              as: 'moduleAccessPrivilege',
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: ['$$permittedSite.moduleAccessPrivileges', '$_id']
                    }
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$moduleAccessPrivilege',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.COMPANY,
              let: { permittedSite: '$permittedSites' },
              as: 'company',
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$permittedSite.company', '$_id'] }
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$company',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.SITE,
              let: { permittedSite: '$permittedSites' },
              as: 'site',
              pipeline: [
                {
                  $match: { $expr: { $eq: ['$$permittedSite.site', '$_id'] } }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$site',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              moduleId: { $toString: '$moduleAccessPrivilege._id' },
              moduleName: '$moduleAccessPrivilege.name',
              companyId: { $toString: '$company._id' },
              companyName: '$company.name',
              siteId: { $toString: '$site._id' },
              siteName: '$site.name',
              moduleType: '$moduleAccessPrivilege.moduleType'
            }
          }
        ])
        .toArray();
      return resolve(userModules as any as IUserPermittedModule[]);
    });
  }

  /**
   * Method to fetch the module template fields for requested module
   * @param userModule user module details
   * @returns module template fields
   */
  async fetchModuleTemplateMetaDataFields(
    userModule: IUserPermittedModule
  ): Promise<IModuleTemplateODataMetaData | void> {
    return new Promise(async (resolve) => {
      const { moduleId, companyId, siteId } = userModule;

      const moduleTemplateFields = await this.connection.db
        .collection(TABLE_NAMES.MODULE_TEMPLATE_ODATA_META_DATA)
        .aggregate([
          {
            $facet: {
              globalTemplate: [
                {
                  $match: {
                    level: 1,
                    moduleAccessPrivilege: moduleId
                  }
                }
              ],
              companyTemplate: [
                {
                  $match: {
                    level: 2,
                    company: companyId,
                    moduleAccessPrivilege: moduleId
                  }
                }
              ],
              siteTemplate: [
                {
                  $match: {
                    level: 3,
                    company: companyId,
                    site: siteId,
                    moduleAccessPrivilege: moduleId
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$globalTemplate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: '$companyTemplate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $unwind: {
              path: '$siteTemplate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $project: {
              template: {
                $cond: {
                  if: { $ifNull: ['$siteTemplate', false] },
                  then: '$siteTemplate',
                  else: {
                    $cond: {
                      if: { $ifNull: ['$companyTemplate', false] },
                      then: '$companyTemplate',
                      else: '$globalTemplate'
                    }
                  }
                }
              }
            }
          },
          {
            $replaceRoot: {
              newRoot: { $mergeObjects: [{}, '$template'] }
            }
          }
        ])
        .toArray();

      if (moduleTemplateFields?.length > 0) {
        return resolve(moduleTemplateFields[0] as any as IModuleTemplateODataMetaData);
      } else {
        return resolve();
      }
    });
  }

  /**
   * Method to fetch the module records data
   * @param query company, site and module query
   * @returns module records data
   */
  async fetchModuleRecordDetails(query: IEmployeeModuleRecordQuery, skip: number, top: number) {
    try {
      const employeeModuleData = await this.connection.db
        .collection(TABLE_NAMES.EMPLOYEE_MODULE)
        .aggregate([
          {
            $match: {
              company: new ObjectId(query.company),
              site: new ObjectId(query.site),
              moduleAccessPrivilege: new ObjectId(query.moduleAccessPrivilege)
            }
          },
          { $sort: { createdAt: 1 } },
          { $skip: skip },
          { $limit: top },
          {
            $project: {
              docs: '$$ROOT',
              actionItems: 1
            }
          },
          {
            $unwind: {
              path: '$actionItems',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.ACTION_ITEM,
              as: 'actionItems',
              let: { actionItems: '$actionItems' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$actionItems', '$_id'] }
                  }
                },
                {
                  $lookup: {
                    from: TABLE_NAMES.EMPLOYEES,
                    as: 'responsible',
                    let: { responsible: '$responsible' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$$responsible', '$_id'] }
                        }
                      }
                    ]
                  }
                },
                {
                  $unwind: {
                    path: '$responsible',
                    preserveNullAndEmptyArrays: true
                  }
                },
                {
                  $lookup: {
                    from: TABLE_NAMES.EMPLOYEES,
                    as: 'personDelegated',
                    let: { personDelegated: '$personDelegated' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$$personDelegated', '$_id'] }
                        }
                      }
                    ]
                  }
                },
                {
                  $unwind: {
                    path: '$personDelegated',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$actionItems',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $group: {
              _id: '$_id',
              actionItems: { $push: '$actionItems' },
              docs: { $first: '$docs' }
            }
          },
          {
            $addFields: {
              'docs.actionItems': {
                $cond: {
                  if: { $ifNull: ['$docs.actionItems', false] },
                  then: '$actionItems',
                  else: undefined
                }
              }
            }
          },
          {
            $replaceRoot: {
              newRoot: '$docs'
            }
          },
          {
            $lookup: {
              as: 'createdBy',
              from: TABLE_NAMES.EMPLOYEES,
              foreignField: '_id',
              localField: 'createdBy'
            }
          },
          {
            $unwind: {
              path: '$createdBy',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              as: 'company',
              from: TABLE_NAMES.COMPANY,
              foreignField: '_id',
              localField: 'company'
            }
          },
          {
            $unwind: {
              path: '$company',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              as: 'site',
              from: TABLE_NAMES.SITE,
              foreignField: '_id',
              localField: 'site'
            }
          },
          {
            $unwind: {
              path: '$site',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              as: 'moduleAccessPrivilege',
              from: TABLE_NAMES.MODULE_ACCESS_PRIVILEGES,
              foreignField: '_id',
              localField: 'moduleAccessPrivilege'
            }
          },
          {
            $unwind: {
              path: '$moduleAccessPrivilege',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              as: 'employeeModuleTemplate',
              from: TABLE_NAMES.EMPLOYEE_MODULE_TEMPLATES,
              foreignField: '_id',
              localField: 'employeeModuleTemplate'
            }
          },
          {
            $unwind: {
              path: '$employeeModuleTemplate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.MODULE_PROJECTS,
              localField: 'moduleProject',
              foreignField: '_id',
              as: 'moduleProject'
            }
          },
          {
            $unwind: {
              path: '$moduleProject',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $addFields: {
              company: '$company.name',
              site: '$site.name',
              moduleAccessPrivilege: '$moduleAccessPrivilege.name',
              moduleProject: '$moduleProject.name'
            }
          }
        ])
        .toArray();
      return employeeModuleData as IEmployeeModule[];
    } catch (error) {
      throw new InternalServerErrorException('Error ', error);
    }
  }

  /**
   * Method to fetch the area name by id
   * @param areaId area id
   * @returns area name
   */
  async getAreaNameById(areaId: string) {
    const areaName = (
      await this.connection.db
        .collection(TABLE_NAMES.AREA)
        .findOne({ _id: new ObjectId(areaId) }, { projection: { name: 1 } })
    )?.name;
    return areaName;
  }

  /**
   * Method to fetch the zone name by id
   * @param zoneId zone id
   * @returns zone name
   */
  async getZoneNameById(zoneId: string) {
    const zoneName = (
      await this.connection.db
        .collection(TABLE_NAMES.ZONE)
        .findOne({ _id: new ObjectId(zoneId) }, { projection: { name: 1 } })
    )?.name;
    return zoneName;
  }

  /**
   * Method to fetch the plant name by id
   * @param plantId pant id
   * @returns plant name
   */
  async getPlantNameById(plantId: string) {
    const plantName = (
      await this.connection.db
        .collection(TABLE_NAMES.PLANT)
        .findOne({ _id: new ObjectId(plantId) }, { projection: { name: 1 } })
    )?.name;
    return plantName;
  }
}
