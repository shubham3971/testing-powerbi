import { ObjectId } from 'mongodb';

export enum LookupTableLevel {
  COMPANY = 1,
  SITE = 2
}

export interface ILookupTableQuery {
  level: LookupTableLevel;
  company: ObjectId;
  site?: { $in: ObjectId[] };
}

export interface ILookupTable {
  _id: ObjectId;
  tableIgzId: string;
  level: LookupTableLevel;
  company: ObjectId;
  site: ObjectId;
  tableName: string;
  columns: ILookupTableColumn[];
}

export interface ILookupTableColumn {
  _id: ObjectId;
  name: string;
  orderNo: number;
}

export interface ILookupTableValue {
  lookupTable: ObjectId;
  columnValues: ILookupTableColumnValue[];
}

interface ILookupTableColumnValue {
  columnId: string;
  value: string[];
}
