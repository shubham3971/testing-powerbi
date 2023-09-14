import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Connection } from 'mongoose';

import { ILookupTable, ILookupTableQuery, ILookupTableValue } from '../common/interfaces/module/lookup-table.interface';
import { TABLE_NAMES } from '../config/constants';

@Injectable()
export class LookupTableRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Method to fetch all the lookup tables
   * @param listQuery
   * @returns
   */
  fetchLookupTables(listQuery: ILookupTableQuery[]): Promise<ILookupTable[]> {
    return new Promise((resolve) => {
      const lookupTables = this.connection.db
        .collection(TABLE_NAMES.LOOKUP_TABLES)
        .find({ $or: listQuery })
        .sort({ level: 1 })
        .project({ _id: 1, level: 1, company: 1, site: 1, tableName: 1, columns: 1, tableIgzId: 1 })
        .toArray();
      return resolve(lookupTables as any as ILookupTable[]);
    });
  }

  /**
   * Method to get the lookup table by id
   * @param tableId
   * @returns
   */
  getLookupTableById(tableId: string): Promise<ILookupTable> {
    return new Promise(async (resolve) => {
      const lookupTable = await this.connection.db
        .collection(TABLE_NAMES.LOOKUP_TABLES)
        .findOne(
          { _id: new ObjectId(tableId) },
          { projection: { _id: 1, level: 1, company: 1, site: 1, tableName: 1, columns: 1, tableIgzId: 1 } }
        );
      return resolve(lookupTable as any as ILookupTable);
    });
  }

  /**
   * Method to fetch the lookup table values
   * @param tableId
   * @param skip
   * @param limit
   * @returns
   */
  fetchLookupTableValues(tableId: string, skip: number, limit: number): Promise<ILookupTableValue[]> {
    return new Promise((resolve) => {
      const lookupTables = this.connection.db
        .collection(TABLE_NAMES.LOOKUP_TABLE_VALUES)
        .find({ lookupTable: new ObjectId(tableId) })
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      return resolve(lookupTables as any as ILookupTableValue[]);
    });
  }
}
