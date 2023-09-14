import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import { IEmployeeModuleRecordQuery } from '../common/interfaces/module/module.interface';
import { IModuleRecordTablePluginResultType } from '../common/interfaces/module/table-plugin.interface';
import { TABLE_NAMES } from '../config/constants';

@Injectable()
export class ModuleRecordTablePluginRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Method to fetch the table plugin records
   * @param query
   * @param skip
   * @param top
   * @returns
   */
  async fetchTablePluginRecords(query: IEmployeeModuleRecordQuery, skip: number, top: number) {
    try {
      const tablePluginRecords = await this.connection.db
        .collection(TABLE_NAMES.EMPLOYEE_MODULE)
        .aggregate([
          {
            $match: {
              company: new ObjectId(query.company),
              site: new ObjectId(query.site),
              moduleAccessPrivilege: new ObjectId(query.moduleAccessPrivilege),
              tablePluginDetails: { $exists: true, $not: { $size: 0 } }
            }
          },
          { $sort: { createdAt: 1, _id: 1 } },
          {
            $unwind: '$tablePluginDetails'
          },
          {
            $addFields: {
              moduleRecordStringId: { $toString: '$_id' }
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.MODULE_RECORD_TABLE_PLUGIN_DETAILS,
              let: { tablePluginNodeId: '$tablePluginDetails.nodeId', moduleRecordId: '$moduleRecordStringId' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$tablePluginNodeId', '$$tablePluginNodeId'] },
                        { $eq: ['$moduleRecordId', '$$moduleRecordId'] }
                      ]
                    }
                  }
                },
                { $sort: { _id: 1 } }
              ],
              as: 'tablePluginRecords'
            }
          },
          {
            $project: {
              moduleRecordDetails: 0,
              completedWorkflows: 0
            }
          },

          {
            $unwind: '$tablePluginRecords'
          },
          { $skip: skip },
          { $limit: top }
        ])
        .toArray();
      return tablePluginRecords as IModuleRecordTablePluginResultType[];
    } catch (error) {
      throw new InternalServerErrorException('Error ', error);
    }
  }
}
