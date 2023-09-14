import { OwnerCompanyConstants, OwnerCompanyContractorConstants } from '../../../config/constants';

export interface ICompany {
  _id: string;
  companyId: string;
  name: string;
  sites: ISite[];
  contractors: ICompany[];
}

export interface ISite {
  name: string;
  plants: IPlant[];
}

export interface IPlant {
  name: string;
  areas: IArea[];
  zones: IZone[];
}

export interface IArea {
  name: string;
  areaId: string;
  companyId: string;
}

export interface IZone {
  name: string;
  company: string;
  plant: string;
}

const OwnerCompanyMetaDataConstants = [
  OwnerCompanyConstants.OWNER_COMPANY_SL_NO,
  OwnerCompanyConstants.OWNER_COMPANY_ID,
  OwnerCompanyConstants.OWNER_COMPANY_NAME,
  OwnerCompanyConstants.OWNER_COMPANY_SITE,
  OwnerCompanyConstants.OWNER_COMPANY_PLANT,
  OwnerCompanyConstants.OWNER_COMPANY_AREA,
  OwnerCompanyConstants.OWNER_COMPANY_ZONE
] as const;
export type OwnerCompanyColumn = {
  [k in typeof OwnerCompanyMetaDataConstants[number]]: string | number;
};

const OwnerCompanyContractorMetadataConstants = [
  OwnerCompanyConstants.OWNER_COMPANY_SL_NO,
  OwnerCompanyConstants.OWNER_COMPANY_NAME,
  OwnerCompanyConstants.OWNER_COMPANY_ID,
  OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_ID,
  OwnerCompanyContractorConstants.OWNER_COMPANY_CONTRACTOR_NAME
] as const;
export type OwnerCompanyContractorColumn = {
  [k in typeof OwnerCompanyContractorMetadataConstants[number]]: string | number;
};
