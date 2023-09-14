import { ICompany, ISite } from '../company/owner-company.interface';
import {
  IEmployee,
  IEmployeeModule,
  IEmployeeModuleTemplate,
  IModuleAccessPrivilege,
  IModuleRecordCompletedWorkflowDetail,
  IModuleRecordDetail
} from '../module/module.interface';

export interface IActionItemRecord {
  actionItemId: string;
  dueDate: Date;
  title: string;
  responsible: IEmployee;
  personDelegated: IEmployee;
  createdBy: IEmployee;
  company: ICompany;
  site: ISite;
  source: string;
  description: string;
  sourceType: ActionItemSourceType;
  comment: string;
  status: ActionItemStatus;
  employeeModuleRecord: IEmployeeModule;
  actionItemRecordDetails: IModuleRecordDetail[];
  actionItemTemplate: IEmployeeModuleTemplate;
  moduleAccessPrivilege: IModuleAccessPrivilege;
  workflow: string;
  isWaitingForDecision: boolean;
  nextWorkflow: string;
  createdAt: Date;
  updatedAt: Date;
  completedWorkflows: IModuleRecordCompletedWorkflowDetail[];
}

export enum ActionItemStatus {
  OPEN = 0,
  CLOSED = 1
}

/**
 *  AUDIT - for Module Action: action created from module record
 *  STANDALONE - for Standalone Action: Action created from Action module
 */
export enum ActionItemSourceType {
  AUDIT = 'AUDIT',
  STANDALONE = 'STANDALONE'
}
