import { IElementOption, IModuleRecordTablePluginInfo } from './module.interface';

export interface IModuleRecordTablePluginDetail {
  moduleRecordId: string;
  tablePluginNodeId: string;
  columnResults: IModuleRecordTablePluginColumnResult[];
}

export interface IModuleRecordTablePluginColumnResult {
  columnId: string;
  stringField: string;
  dateField: Date;
  numberField: string;
  optionField: IElementOption[];
  calculationField: string;
}

export interface IModuleRecordTablePluginResultType {
  employeeModuleId: string;
  tablePluginDetails: IModuleRecordTablePluginInfo;
  tablePluginRecords: IModuleRecordTablePluginDetail;
}
