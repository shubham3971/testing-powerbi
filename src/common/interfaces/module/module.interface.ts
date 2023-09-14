import { ObjectId } from 'mongodb';

export interface IModuleAccessPrivilege {
  name: string;
}

export interface IUserPermittedModule {
  moduleId: string;
  moduleName?: string;
  companyId: string;
  companyName?: string;
  siteId: string;
  siteName?: string;
  moduleType?: ModuleType;
}

export enum ModuleType {
  ACTION = 'ACTION'
}

export interface IModuleTemplateODataMetaData {
  moduleAccessPrivilege: string;
  moduleTemplate: string;
  company: string;
  site: string;
  level: number;
  columns: IModuleTemplateColumnDetail[];
  tablePluginDetails: IModuleTemplateTablePluginDetail[];
  moduleId: string;
  moduleName: string;
  companyId: string;
  companyName: string;
  siteId: string;
  siteName: string;
}

export interface IModuleTemplateTablePluginDetail {
  tablePluginElementId: string;
  tablePluginLabel: string;
  tablePluginColumns: IModuleTemplateTablePluginColumn[];
}

export interface IModuleTemplateTablePluginColumn {
  columnId: string;
  elementName: string;
  columnName: string;
  columnValue?: string;
}

export interface IEntitySchema {
  entityType: string;
  entityContainer: string;
}

export interface IModuleTemplateColumnDetail {
  tabNodeId: string;
  elementNodeId: string;
  elementName: string;
  columnName: string;
  columnValue: string;
}

export interface IEmployeeModuleRecordQuery {
  company: string;
  site: string;
  moduleAccessPrivilege: string;
  timezone: string;
}

export enum ModuleTabType {
  CHECKLIST = 'CHECKLIST',
  CUSTOM = 'CUSTOM'
}

export enum ModuleNodeType {
  CATEGORY = 'CATEGORY',
  COMPONENT = 'COMPONENT',
  ELEMENT = 'ELEMENT',
  TEXTLABEL = 'TEXTLABEL'
}

export enum ElementType {
  TEXTFIELD = 'TEXTFIELD',
  NUMBER = 'NUMBER',
  DATETIME = 'DATETIME',
  CHECKBOX = 'CHECKBOX',
  DROPDOWN = 'DROPDOWN',
  SIGNATURE = 'SIGNATURE',
  TILES = 'TILES',
  TAGS = 'TAGS',
  FILE_UPLOAD = 'FILE_UPLOAD',
  GPS_LOCATION = 'GPS_LOCATION',
  TEXT_WITH_CHECKBOX = 'TEXT_WITH_CHECKBOX',
  LOCATION_TREE = 'LOCATION_TREE',
  WEB_LINK = 'WEB_LINK',
  EMAIL = 'EMAIL',
  TABLE_PLUGINS = 'TABLE_PLUGINS',
  CALCULATION = 'CALCULATION',
  REFERENCE_RECORDS = 'REFERENCE_RECORDS',
  SKETCH = 'SKETCH'
}

export enum LogicConditionType {
  IS = 'IS',
  IS_NOT = 'IS_NOT',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  EQUAL_TO = 'EQUAL_TO',
  NOT_EQUAL_TO = 'NOT_EQUAL_TO',
  IN_BETWEEN = 'IN_BETWEEN',
  NOT_IN_BETWEEN = 'NOT_IN_BETWEEN',
  IS_SELECTED = 'IS_SELECTED',
  IS_DATE = 'IS_DATE',
  IS_TIME = 'IS_TIME',
  IS_DATE_AND_TIME = 'IS_DATE_AND_TIME',
  IS_NOT_DATE = 'IS_NOT_DATE',
  IS_NOT_TIME = 'IS_NOT_TIME',
  IS_NOT_DATE_AND_TIME = 'IS_NOT_DATE_AND_TIME',
  SIGNED = 'SIGNED',
  CAPTURED = 'CAPTURED',
  UPLOADED = 'UPLOADED',
  ENTERED = 'ENTERED',
  IS_PLANT = 'IS_PLANT',
  IS_NOT_PLANT = 'IS_NOT_PLANT',
  IS_AREA = 'IS_AREA',
  IS_NOT_AREA = 'IS_NOT_AREA',
  IS_ZONE = 'IS_ZONE',
  IS_NOT_ZONE = 'IS_NOT_ZONE'
}

export enum LogicContentType {
  QUESTION = 'QUESTION',
  COMPONENT = 'COMPONENT',
  TEXTLABEL = 'TEXTLABEL'
}

export enum WorkflowAccessMandatoryControl {
  ANY_ONE = 'ANY_ONE',
  ALL = 'ALL'
}

interface IElementOptionProperties {
  company: string;
  site: string;
}

export interface IElementOption {
  id: string;
  key: string;
  label: string;
  score: number;
  colorValue: string;
  optionProperties: IElementOptionProperties;
}

export interface ILogicConditionValue {
  stringValue: string;

  numberValue: number;
  numberFrom: number;
  numberTo: number;

  dateValue: string;
  timeValue: string;

  plant: string;
  area: string;
  zone: string;

  optionValue: IElementOption;
  optionValues: [IElementOption];
}

interface IElementLogicCondition {
  conditionType: LogicConditionType;
  conditionValue: ILogicConditionValue;
}

export interface ILookupTableValuesMapping {
  columnId: string;
}

export interface IDropdownData {
  sourceType: string;
  sourceOption: IElementOption;
  sourceFilter: string;
  category: string;
  workflowAccessMandatoryControl: WorkflowAccessMandatoryControl;
  lookupTableId: string;
  lookupTableColumns: ILookupTableValuesMapping[];
}

export interface IMediaData {
  url: string;
  fileName: string;
  mediaType: string;
  description: string;
  thumbnail: string;
  createdDate: Date;
  createdLocation: string;
  createdGPSCoordinate: IAutoSetGPSCoordinate;
}

interface IAutoSetGPSCoordinate {
  latitude: number;
  longitude: number;
}

export interface IElementDefaultValue {
  stringField: string;
  numberField: string;
  optionField: IElementOption[];
  webLinkField: string;
}

export interface IElementProperties {
  label: string;
  mediaData: [IMediaData];
  fieldType: string;
  isMultipleEntriesEnabled: boolean;
  isActionItem: boolean;
  isNoteEnabled: boolean;
  isMediaUploadEnabled: boolean;
  isAttachmentUploadEnabled: boolean;
}

export interface IElementLogicNode {
  nodeSerialNumber: string;
  nodeId: string;
  sourceId: string;
  nodeType: ModuleNodeType;
  elementType: ElementType;
  name: string;
  nodes: [IElementLogicNode];
  properties: IElementProperties;
  orderNo: number;
  logics: [IElementLogic];
}

export interface IElementLogic {
  condition: IElementLogicCondition;
  contentType: LogicContentType;
  nodes: [IElementLogicNode];
  orderNo: number;
}

export interface IModuleTabNode {
  nodeSerialNumber: string;
  nodeId: string;
  sourceId: string;
  nodeType: ModuleNodeType;
  elementType: ElementType;
  name: string;
  nodes: [IModuleTabNode];
  properties: IElementProperties;
  orderNo: number;
  logics: [IElementLogic];
}

export interface IChecklistNode {
  nodeSerialNumber: string;
  nodeId: string;
  sourceId: string;
  nodeType: ModuleNodeType;
  elementType: ElementType;
  name: string;
  nodes: [IChecklistNode];
  properties: IElementProperties;
  orderNo: number;
  logics: [IElementLogic];
}

export interface ModuleRecordFields {
  nodes: IModuleTabNode[] | IChecklistNode[] | IElementLogicNode[];
  tabId: string;
  timeZone: string;
}

export interface IModuleAnswerFieldComponentDetail {
  componentNodeId: string;
  componentEntryId: string;
  orderNo: number;
}

export interface IGPSLocationField {
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface IPlant {
  name: string;
}

export interface IArea {
  name: string;
}

export interface IZone {
  name: string;
}
export interface ILocationTreeField {
  plant: IPlant | string;
  area: IArea | string;
  zone: IZone | string;
}

interface IMultipleEntryDetail {
  sourceNodeId: string;
  orderNo: number;
}

export interface IModuleAnswerField {
  elementType: ElementType;
  sourceId: string;
  nodeId: string;
  componentDetail: IModuleAnswerFieldComponentDetail;
  stringField: string;
  dateField: Date;
  numberField: string;
  optionField: [IElementOption];
  textWithCheckBoxField: boolean;
  fileField: [IMediaData];
  gpsLocationField: [IGPSLocationField];
  note: string;
  media: [IMediaData];
  attachment: [IMediaData];
  locationTreeField: ILocationTreeField;
  signature: [IMediaData];
  webLinkField: string;
  multipleEntryDetail: IMultipleEntryDetail;
  calculationField: string;
  referenceRecordsField: IReferenceRecordsField[];
  sketchField: ISketchData;
}

interface ISketchData {
  id: string;
  sketchType: SketchType;
  fileName: string;
  thumbnail: string;
  url: string;
  mediaType: string;
}

enum SketchType {
  BLANK = 'BLANK',
  CUSTOM = 'CUSTOM'
}

export interface IReferenceRecordsField {
  employeeModuleId: string;
  recordId: string;
  isTranscribedRecord: boolean;
}

export interface IModuleRecordDetail {
  tabId: string;
  moduleChecklistId?: string;
  moduleAnswers: [IModuleAnswerField];
}

export interface IModuleTabContent {
  nodes: [IModuleTabNode];
  expandOneCategory: boolean;
}

export interface IModuleTab {
  name: string;
  isEnabled: boolean;
  orderNo: number;
  moduleTabContent: IModuleTabContent;
  moduleTabType: ModuleTabType;
  isCustomizable: boolean;
  nodeId: string;
  isDefault: boolean;
  isActionItemTab: boolean;
}

export interface IModuleWorkflow {
  workflows: IModuleWorkflowProperties[];
}

export interface IModuleWorkflowProperties {
  trigger: IWorkflowTrigger;
  nodeId: string;
}

export interface IWorkflowTrigger {
  name: string;
}

export interface IModuleTemplate {
  tabs: [IModuleTab];
  workflow: IModuleWorkflow;
}

export interface IModuleChecklist {
  checklistContent: [IChecklistNode];
}

export interface IModuleChecklistRecordTemplate {
  tabId: string;
  moduleChecklist: IModuleChecklist;
}

export interface IEmployeeModuleTemplate {
  moduleTemplate?: IModuleTemplate;
  moduleChecklistTemplate?: IModuleChecklistRecordTemplate[];
}

export interface IEmployee {
  firstName: string;
  lastName: string;
  employeeId: string;
}

export interface IActionItemTabInfo {
  tabId: string;
  actionComponentNodeId: string;
  orderNo: number;
}

export interface IActionItem {
  dueDate?: Date;
  title?: string;
  responsible?: IEmployee;
  personDelegated?: IEmployee;
  tabInfo?: IActionItemTabInfo;
  description?: string;
  comment?: string;
}

export interface IEmployeeModule {
  _id: ObjectId;
  employeeModuleId: string;
  site: string;
  moduleAccessPrivilege: string;
  moduleRecordDetails?: IModuleRecordDetail[];
  employeeModuleTemplate?: IEmployeeModuleTemplate;
  actionItems: IActionItem[];
  company: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  scannedImages: [IScannedImage];
  createdBy: IEmployee;
  workflow: string;
  status: IWorkflowStatus;
  moduleProject: string;
  completedWorkflows: IModuleRecordCompletedWorkflowDetail[];
  tablePluginDetails: IModuleRecordTablePluginInfo[];
}

export interface FieldsType {
  [key: string]: string | undefined;
}

export interface ModuleRecordActionComponentField {
  actionItems: IActionItem[];
  tabId: string;
  nodeId: string;
  timeZone: string;
}

export interface ModuleAnswerComponentDetail {
  orderNo: number;
  moduleAnswer: IModuleAnswerField;
}

interface IScannedImage {
  thumbnail: string;
  url: string;
}

export interface IPaginationQuery {
  $skip: string;
  $top: string;
}

export interface IWorkflowStatus {
  name: string;
}

export interface IModuleRecordCompletedWorkflowDetail {
  workflow: string;
  destinationWorkflow?: string;
  decisionNodeId?: string;
  displayTabs: string[];
}

export interface IModuleRecordTablePluginInfo {
  tabId: string;
  nodeId: string;
}
