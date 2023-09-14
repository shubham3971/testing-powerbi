import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';
import { ICompany } from 'src/common/interfaces/company/owner-company.interface';

import { TABLE_NAMES } from '../../config/constants';

@Injectable()
export class OwnerCompanyRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * To fetch owner company details
   * @param companyId
   */
  async fetchOwnersCompanyDetails(companyId: string): Promise<ICompany[]> {
    try {
      const ownersCompanyDetails = await this.connection.db
        .collection(TABLE_NAMES.COMPANY)
        .aggregate([
          {
            $match: {
              _id: new ObjectId(companyId)
            }
          },
          {
            $project: {
              sites: 1,
              name: 1,
              contractors: 1,
              companyId: 1
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.SITE,
              let: { site: '$sites' },
              as: 'sites',
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $in: ['$_id', '$$site']
                    }
                  }
                },
                {
                  $addFields: {
                    id: '$_id',
                    plants: { $ifNull: ['$plants', []] }
                  }
                },
                {
                  $lookup: {
                    from: TABLE_NAMES.PLANT,
                    let: { plants: '$plants' },
                    pipeline: [
                      { $match: { $expr: { $in: ['$_id', '$$plants'] } } },
                      {
                        $addFields: {
                          id: '$_id',
                          zones: { $ifNull: ['$zones', []] },
                          areas: { $ifNull: ['$areas', []] }
                        }
                      },
                      {
                        $lookup: {
                          from: TABLE_NAMES.AREA,
                          let: { areas: '$areas' },
                          pipeline: [
                            { $match: { $expr: { $in: ['$_id', '$$areas'] } } },
                            {
                              $addFields: {
                                id: '$_id'
                              }
                            }
                          ],
                          as: 'areas'
                        }
                      },
                      {
                        $lookup: {
                          from: TABLE_NAMES.ZONE,
                          let: { zones: '$zones' },
                          pipeline: [
                            { $match: { $expr: { $in: ['$_id', '$$zones'] } } },
                            { $addFields: { id: '$_id' } }
                          ],
                          as: 'zones'
                        }
                      }
                    ],
                    as: 'plants'
                  }
                }
              ]
            }
          },
          {
            $lookup: {
              from: TABLE_NAMES.COMPANY,
              let: { contractors: '$contractors' },
              pipeline: [
                {
                  $match: {
                    $expr: { $in: ['$_id', '$$contractors'] }
                  }
                },
                {
                  $addFields: {
                    id: '$_id'
                  }
                }
              ],
              as: 'contractors'
            }
          }
        ])
        .toArray();
      return ownersCompanyDetails as ICompany[];
    } catch (error) {
      throw new InternalServerErrorException('Error', error);
    }
  }
}
