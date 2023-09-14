import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import { IActionItemRecord } from '../common/interfaces/action-module/action-module.interface';
import { IEmployeeModuleRecordQuery } from '../common/interfaces/module/module.interface';
import { TABLE_NAMES } from '../config/constants';

@Injectable()
export class ActionItemRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Method to fetch the action module records from DB
   * @param query
   * @param skip
   * @param top
   * @returns
   */
  async fetchActionItemRecordDetails(query: IEmployeeModuleRecordQuery, skip: number, top: number) {
    try {
      const actionItemData = await this.connection.db
        .collection(TABLE_NAMES.ACTION_ITEM)
        .aggregate([
          {
            $match: {
              company: new ObjectId(query.company),
              site: new ObjectId(query.site)
            }
          },
          { $sort: { createdAt: 1 } },
          { $skip: skip },
          { $limit: top },
          {
            $lookup: {
              from: TABLE_NAMES.EMPLOYEES,
              localField: 'responsible',
              foreignField: '_id',
              as: 'responsible'
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
              localField: 'personDelegated',
              foreignField: '_id',
              as: 'personDelegated'
            }
          },
          {
            $unwind: {
              path: '$personDelegated',
              preserveNullAndEmptyArrays: true
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
              from: TABLE_NAMES.COMPANY,
              foreignField: '_id',
              localField: 'company',
              as: 'company'
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
              as: 'actionItemTemplate',
              from: TABLE_NAMES.EMPLOYEE_MODULE_TEMPLATES,
              foreignField: '_id',
              localField: 'actionItemTemplate'
            }
          },
          {
            $unwind: {
              path: '$actionItemTemplate',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.EMPLOYEE_MODULE,
              let: { employeeModuleRecord: '$employeeModuleRecord' },
              pipeline: [
                {
                  $match: { $expr: { $eq: ['$$employeeModuleRecord', '$_id'] } }
                },
                {
                  $project: {
                    employeeModuleId: 1
                  }
                }
              ],
              as: 'employeeModuleRecord'
            }
          },
          {
            $unwind: {
              path: '$employeeModuleRecord',
              preserveNullAndEmptyArrays: true
            }
          }
        ])
        .toArray();
      return actionItemData as IActionItemRecord[];
    } catch (error) {
      throw new InternalServerErrorException('Error ', error);
    }
  }
}
