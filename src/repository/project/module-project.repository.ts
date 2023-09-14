import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import { IModuleProject } from '../../common/interfaces/project/module-project.interface';
import { TABLE_NAMES } from '../../config/constants';

@Injectable()
export class ModuleProjectRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * To fetch Module Project details
   * @param companyId
   * @param skip
   * @param top
   * @returns
   */
  async fetchModuleProjectDetails(companyId: string, skip: number, top: number): Promise<IModuleProject[]> {
    try {
      const moduleProjects = this.connection.db
        .collection(TABLE_NAMES.MODULE_PROJECTS)
        .aggregate([
          {
            $match: {
              company: new ObjectId(companyId)
            }
          },
          { $sort: { createdAt: 1 } },
          { $skip: skip },
          { $limit: top },
          {
            $lookup: {
              from: TABLE_NAMES.MODULE_ACCESS_PRIVILEGES,
              localField: 'moduleAccessPrivileges',
              foreignField: '_id',
              as: 'moduleAccessPrivileges',
              pipeline: [{ $project: { name: 1 } }]
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.COMPANY,
              as: 'company',
              let: { company: '$company' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$company', '$_id'] }
                  }
                },
                { $project: { name: 1 } }
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
              as: 'site',
              let: { site: '$site' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$site', '$_id'] }
                  }
                },
                { $project: { name: 1 } }
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
            $lookup: {
              from: TABLE_NAMES.EMPLOYEES,
              localField: 'userPermissionApproval.employee',
              foreignField: '_id',
              as: 'userPermissionApproval',
              pipeline: [{ $project: { firstName: 1, lastName: 1 } }]
            }
          }
        ])
        .toArray();
      return moduleProjects as any as IModuleProject[];
    } catch (error) {
      throw new InternalServerErrorException('Error', error);
    }
  }
}
