import { ModuleProjectConstants } from '../../../config/constants';
import { ICompany, ISite } from '../company/owner-company.interface';
import { IModuleAccessPrivilege } from '../module/module.interface';

export interface IModuleProject {
  createdAt: Date;
  projectIGZId: string;
  updatedAt: Date;
  isActive: boolean;
  level: ModuleProjectLevel;
  name: string;
  description: string;
  company: ICompany;
  site: ISite;
  moduleAccessPrivileges: IModuleAccessPrivilege[];
  startDate: Date;
  completionDate: Date;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  contactName: string;
  mobile: string;
  countryCode: string;
  dialCode: string;
  userPermissionApproval: IModuleProjectUserPermissionApproval[];
}

export enum ModuleProjectLevel {
  COMPANY = 1,
  SITE = 2
}

interface IModuleProjectUserPermissionApproval {
  firstName: string;
  lastName: string;
}

const moduleProjectMetadataConstants = [
  ModuleProjectConstants.SL_NO,
  ModuleProjectConstants.ID,
  ModuleProjectConstants.NAME,
  ModuleProjectConstants.DESCRIPTION,
  ModuleProjectConstants.LEVEL,
  ModuleProjectConstants.COMPANY,
  ModuleProjectConstants.MODULE_ACCESS_PRIVILEGES,
  ModuleProjectConstants.SITE_LOCATION,
  ModuleProjectConstants.START_DATE,
  ModuleProjectConstants.COMPLETION_DATE,
  ModuleProjectConstants.ADDRESS,
  ModuleProjectConstants.CITY,
  ModuleProjectConstants.STATE,
  ModuleProjectConstants.ZIP_CODE,
  ModuleProjectConstants.CONTACT_NAME,
  ModuleProjectConstants.PHONE_NUMBER,
  ModuleProjectConstants.PERMISSION_APPROVAL,
  ModuleProjectConstants.STATUS
] as const;
export type ModuleProjectColumn = {
  [k in typeof moduleProjectMetadataConstants[number]]: string | number;
};
