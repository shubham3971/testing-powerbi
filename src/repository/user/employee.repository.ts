import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import { IEmployee } from '../../common/interfaces/user/employee.interface';
import { TABLE_NAMES } from '../../config/constants';

@Injectable()
export class EmployeeRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * to fetch employee details based on their roles
   * @param companyId
   * @param userRoles
   * @param skip
   * @param top
   * @returns
   */
  async fetchEmployees(companyId: string, userRoles: string, skip: number, top: number): Promise<IEmployee[]> {
    try {
      const employeeData = await this.connection.db
        .collection(TABLE_NAMES.EMPLOYEES)
        .aggregate([
          {
            $match: {
              $and: [{ company: new ObjectId(companyId) }, { roles: { $elemMatch: { key: userRoles } } }]
            }
          },
          {
            $project: {
              isAccessSuspended: 1,
              isAccessTerminated: 1,
              isAdminVerified: 1,
              isVerified: 1,
              createdAt: 1,
              isContractorAsOwner: 1,
              firstName: 1,
              lastName: 1,
              username: 1,
              company: 1,
              roles: 1,
              job: 1,
              email: 1,
              employeeId: 1,
              accessSuspendedOn: 1,
              accessTerminatedOn: 1,
              adminVerifiedOn: 1,
              mobile: 1,
              title: 1
            }
          },
          { $sort: { createdAt: 1 } },
          { $skip: skip },
          { $limit: top },
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
              from: TABLE_NAMES.JOB,
              as: 'job',
              let: { job: '$job' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$job', '$_id'] }
                  }
                }
              ]
            }
          },
          {
            $unwind: {
              path: '$job',
              preserveNullAndEmptyArrays: true
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.TITLE,
              as: 'title',
              let: { title: '$title' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$$title', '$_id'] }
                  }
                },
                { $project: { name: 1 } }
              ]
            }
          },
          {
            $unwind: {
              path: '$title',
              preserveNullAndEmptyArrays: true
            }
          }
        ])
        .toArray();
      return employeeData as IEmployee[];
    } catch (error) {
      throw new InternalServerErrorException('Error', error);
    }
  }
}
