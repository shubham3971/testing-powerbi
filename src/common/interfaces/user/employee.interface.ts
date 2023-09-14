import { AuditorEmployeeConstants, PreparerEmployeeConstants } from '../../../config/constants';
import { ICompany } from '../company/owner-company.interface';
import { IUserRole } from './auth.interface';

export interface IEmployee {
  createdAt: Date;
  employeeId: string;
  updatedAt: Date;
  firstName: string;
  lastName: string;
  username: string;
  company: ICompany;
  roles: IUserRole[];
  job: IJob;
  title: ITitle;
  mobile: string;
  email: string;
  isVerified: boolean;
  verifiedOn: Date;
  isAdminVerified: boolean;
  adminVerifiedOn: Date;
  isAccessTerminated?: boolean;
  accessTerminatedOn?: Date;
  isAccessSuspended?: boolean;
  accessSuspendedOn?: Date;
  isContractorAsOwner: boolean;
}

export interface IJob {
  id: string;
  name: string;
  companyId: string;
}

export interface ITitle {
  id: string;
  name: string;
  companyId: string;
}

const AuditorMetadataConstants = [
  AuditorEmployeeConstants.SL_NO,
  AuditorEmployeeConstants.ID,
  AuditorEmployeeConstants.FIRST_NAME,
  AuditorEmployeeConstants.LAST_NAME,
  AuditorEmployeeConstants.USERNAME,
  AuditorEmployeeConstants.MEMBER_SINCE,
  AuditorEmployeeConstants.COMPANY,
  AuditorEmployeeConstants.JOB,
  AuditorEmployeeConstants.TITLE,
  AuditorEmployeeConstants.ROLE,
  AuditorEmployeeConstants.MOBILE,
  AuditorEmployeeConstants.EMAIL,
  AuditorEmployeeConstants.ANALYTIC_ACCESS,
  AuditorEmployeeConstants.OWNER_ANALYTIC_ACCESS,
  AuditorEmployeeConstants.VERIFIED,
  AuditorEmployeeConstants.VERIFIED_ON,
  AuditorEmployeeConstants.ACCESS_SUSPENDED,
  AuditorEmployeeConstants.ACCESS_SUSPENDED_ON,
  AuditorEmployeeConstants.ACCESS_TERMINATED,
  AuditorEmployeeConstants.ACCESS_TERMINATED_ON
] as const;
export type AuditorColumn = {
  [k in typeof AuditorMetadataConstants[number]]: string | number;
};

const PreparerMetadataConstants = [
  PreparerEmployeeConstants.SL_NO,
  PreparerEmployeeConstants.ID,
  PreparerEmployeeConstants.FIRST_NAME,
  PreparerEmployeeConstants.LAST_NAME,
  PreparerEmployeeConstants.USERNAME,
  PreparerEmployeeConstants.MEMBER_SINCE,
  PreparerEmployeeConstants.COMPANY,
  PreparerEmployeeConstants.JOB,
  PreparerEmployeeConstants.TITLE,
  PreparerEmployeeConstants.ROLE,
  PreparerEmployeeConstants.MOBILE,
  PreparerEmployeeConstants.EMAIL,
  PreparerEmployeeConstants.VERIFIED,
  PreparerEmployeeConstants.VERIFIED_ON,
  PreparerEmployeeConstants.ACCESS_SUSPENDED,
  PreparerEmployeeConstants.ACCESS_SUSPENDED_ON,
  PreparerEmployeeConstants.ACCESS_TERMINATED,
  PreparerEmployeeConstants.ACCESS_TERMINATED_ON
] as const;
export type PreparerColumn = {
  [k in typeof PreparerMetadataConstants[number]]: string | number;
};
