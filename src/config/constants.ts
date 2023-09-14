export const TABLE_NAMES = {
  EMPLOYEES: 'employees',
  MODULE_TEMPLATE_ODATA_META_DATA: 'moduletemplateodatametadatas',
  EMPLOYEE_MODULE: 'employeemodules',
  AREA: 'areas',
  ZONE: 'zones',
  PLANT: 'plants',
  ACTION_ITEM: 'actionitems',
  COMPANY: 'companies',
  SITE: 'sites',
  MODULE_ACCESS_PRIVILEGES: 'moduleaccessprivileges',
  EMPLOYEE_MODULE_TEMPLATES: 'employeemoduletemplates',
  MODULE_PROJECTS: 'moduleprojects',
  MODULE_RECORD_TABLE_PLUGIN_DETAILS: 'modulerecordtableplugindetails',
  LOOKUP_TABLES: 'lookuptables',
  LOOKUP_TABLE_VALUES: 'lookuptablevalues',
  JOB: 'jobs',
  TITLE: 'titles'
};

export const PAGINATION_QUERY = {
  DEFAULT_LIMIT: 50,
  PREVIEW_LIMIT: 5,
  POWER_BI_PREVIEW: 200
};

export class MultipleEntrySeparator {
  static readonly ELEMENT_MULTIPLE_ENTRY_SPLITTER = '$#';
  static readonly COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT = '$#$';
  static readonly DATE_TIME_SPLITTER = '&#&';
  static readonly MODULE_RECORD_ELEMENT_VALUE_SEPARATOR = '#';
  static readonly MODULE_RECORD_DROPDOWN_SCORE_SEPARATOR = '~';
  static readonly MODULE_RECORD_SIGNATURE_AUTO_CAPTURE_SEPARATOR = '::';
}

export class Constants {
  static readonly ACTION_MODULE_ROUTE = 'action-module';
  static readonly TABLE_PLUGIN_ENTITY_NAME = 'Table_Plugins';
  static readonly TABLE_PLUGIN_LABEL = 'Table Plugin label';
  static readonly MODULE_RECORD_DATA = 'module-record';
  static readonly TABLE_PLUGIN_DATA = 'table-plugin';
  static readonly LOOKUP_TABLE_ENTITY_NAME = 'Lookup_Table';
  static readonly LOOKUP_TABLE_DATA = 'lookup-table';
  static readonly TIMEZONE = 'UTC';
  static readonly OWNER_COMPANY_ENTITY_NAME = 'Company';
  static readonly OWNER_COMPANY_ROUTE = 'company';
  static readonly OWNER_COMPANY_CONTRACTOR_ENTITY_NAME = 'Contractors';
  static readonly OWNER_COMPANY_CONTRACTOR_ROUTE = 'contractors';
  static readonly AUDITOR_ENTITY_NAME = 'Auditors';
  static readonly AUDITOR_ROUTE = 'auditors';
  static readonly PREPARER_ENTITY_NAME = 'Preparers';
  static readonly PREPARER_ROUTE = 'preparers';
  static readonly MODULE_PROJECT_ENTITY_NAME = 'Module_Project';
  static readonly MODULE_PROJECT_ROUTE = 'module-project';
}

// Owner company metadata columns
export class OwnerCompanyConstants {
  static readonly OWNER_COMPANY_SL_NO = 'Sl No';
  static readonly OWNER_COMPANY_ID = 'Company Id';
  static readonly OWNER_COMPANY_NAME = 'Company';
  static readonly OWNER_COMPANY_SITE = 'Sites';
  static readonly OWNER_COMPANY_PLANT = 'Plants';
  static readonly OWNER_COMPANY_AREA = 'Areas';
  static readonly OWNER_COMPANY_ZONE = 'Zones';
}

// Owner company contractors meta data columns
export class OwnerCompanyContractorConstants {
  static readonly OWNER_COMPANY_CONTRACTOR_SL_NO = 'Sl No';
  static readonly OWNER_COMPANY_CONTRACTOR_ID = 'Contractor Id';
  static readonly OWNER_COMPANY_CONTRACTOR_NAME = 'Contractor Name';
}

// Auditor Employee meta data columns
export class AuditorEmployeeConstants {
  static readonly SL_NO = 'Sl No';
  static readonly ID = 'Auditor Id';
  static readonly FIRST_NAME = 'First Name';
  static readonly LAST_NAME = 'Last Name';
  static readonly USERNAME = 'Username';
  static readonly MEMBER_SINCE = 'Member Since';
  static readonly COMPANY = 'Company';
  static readonly JOB = 'Job';
  static readonly TITLE = 'Title';
  static readonly ROLE = 'Roles';
  static readonly MOBILE = 'Mobile';
  static readonly EMAIL = 'Email';
  static readonly ANALYTIC_ACCESS = 'Analytic Access';
  static readonly OWNER_ANALYTIC_ACCESS = 'OwnerAnalytic Access';
  static readonly VERIFIED = 'Verified';
  static readonly VERIFIED_ON = 'Verified On';
  static readonly ACCESS_SUSPENDED = 'Access Suspended';
  static readonly ACCESS_SUSPENDED_ON = 'Access Suspended On';
  static readonly ACCESS_TERMINATED = 'Access Terminated';
  static readonly ACCESS_TERMINATED_ON = 'Access Terminated On';
}

// Preparer Employee meta data columns
export class PreparerEmployeeConstants {
  static readonly SL_NO = 'Sl No';
  static readonly ID = 'Preparer Id';
  static readonly FIRST_NAME = 'First Name';
  static readonly LAST_NAME = 'Last Name';
  static readonly USERNAME = 'Username';
  static readonly MEMBER_SINCE = 'Member Since';
  static readonly COMPANY = 'Company';
  static readonly JOB = 'Job';
  static readonly TITLE = 'Title';
  static readonly ROLE = 'Roles';
  static readonly MOBILE = 'Mobile';
  static readonly EMAIL = 'Email';
  static readonly VERIFIED = 'Verified';
  static readonly VERIFIED_ON = 'Verified On';
  static readonly ACCESS_SUSPENDED = 'Access Suspended';
  static readonly ACCESS_SUSPENDED_ON = 'Access Suspended On';
  static readonly ACCESS_TERMINATED = 'Access Terminated';
  static readonly ACCESS_TERMINATED_ON = 'Access Terminated On';
}

// Module project meta data columns
export class ModuleProjectConstants {
  static readonly SL_NO = 'Sl No';
  static readonly ID = 'Project Id';
  static readonly NAME = 'Project Name';
  static readonly DESCRIPTION = 'Description';
  static readonly LEVEL = 'Project Level';
  static readonly MODULE_ACCESS_PRIVILEGES = 'Module Access Privileges';
  static readonly COMPANY = 'Company';
  static readonly SITE_LOCATION = 'Site/Location';
  static readonly START_DATE = 'Start Date';
  static readonly COMPLETION_DATE = 'Completion Date';
  static readonly ADDRESS = 'Address';
  static readonly CITY = 'City';
  static readonly STATE = 'State';
  static readonly ZIP_CODE = 'Zipcode';
  static readonly CONTACT_NAME = 'Contact Name';
  static readonly PHONE_NUMBER = 'Phone Number';
  static readonly PERMISSION_APPROVAL = 'Project Permission Approval';
  static readonly STATUS = 'Status';
}

export class ModuleProjectStatusConstants {
  static readonly ACTIVE = 'Active';
  static readonly INACTIVE = 'Inactive';
}
