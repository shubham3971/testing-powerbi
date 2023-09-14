import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ElementType,
  FieldsType,
  IActionItem,
  IChecklistNode,
  IElementLogicNode,
  IElementOption,
  IEmployee,
  IEmployeeModule,
  IEntitySchema,
  IGPSLocationField,
  IMediaData,
  IModuleAnswerField,
  IModuleRecordDetail,
  IModuleTabNode,
  IModuleTemplateColumnDetail,
  IModuleTemplateODataMetaData,
  IPaginationQuery,
  IUserPermittedModule,
  ModuleAnswerComponentDetail,
  ModuleNodeType,
  ModuleRecordActionComponentField,
  ModuleRecordFields,
  ModuleTabType,
  ModuleType
} from '../../common/interfaces/module/module.interface';
import { IUserRole } from '../../common/interfaces/user/auth.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { UserUtils } from '../../common/utils/user/user.utils';
import { Constants, MultipleEntrySeparator, PAGINATION_QUERY } from '../../config/constants';
import { ModuleRepository } from '../../repository/module.repository';
import { OwnerCompanyService } from '../company/owner-company.service';
import { ModuleProjectService } from '../project/module-project.service';
import { EmployeeService } from '../user/employee.service';
import { LookupTableService } from './lookup-table.service';

@Injectable()
export class ModuleService {
  constructor(
    private repository: ModuleRepository,
    private configService: ConfigService,
    private lookupTableService: LookupTableService,
    private ownerCompanyService: OwnerCompanyService,
    private employeeService: EmployeeService,
    private moduleProjectService: ModuleProjectService
  ) {}

  /**
   * Method to fetch the logged in user’s permitted modules to show the Tables in powerBI,
   * @param userId
   * @param userRoles
   * @returns entity set required response
   */
  async fetchUserPermittedModules(userId: string, userRoles: IUserRole[]) {
    const userPermittedModules = await this.repository.fetchUserPermittedModules(userId);
    const entitySetResult = this.generateODataEntitySet(userPermittedModules, userRoles);
    return entitySetResult;
  }

  /**
   * Method to generate the xml meta data for modules to display the table and column details
   * @param userId
   * @param roles
   * @returns meta data information
   */
  async generateODataModuleTableMetaData(userId: string, roles: IUserRole[]) {
    const userPermittedModules = await this.repository.fetchUserPermittedModules(userId);
    const templateMetaDataFields = await this.fetchModuleTemplateMetaDataFields(userPermittedModules);
    const moduleRecordMetadataSchema = this.generateModuleRecordODataMetaData(templateMetaDataFields);

    // To give access of owners and users data to only GLOBALSITEADMIN
    if (roles?.length && UserUtils.isGlobalSiteAdmin(roles)) {
      // To generate owner company metadata
      const ownerCompanyMetaDataSchema = this.ownerCompanyService.generateOwnerCompanyODataMetaData(
        userPermittedModules[0].companyName
      );

      if (ownerCompanyMetaDataSchema?.entityType) {
        moduleRecordMetadataSchema.entityType =
          moduleRecordMetadataSchema.entityType + ownerCompanyMetaDataSchema.entityType;
        moduleRecordMetadataSchema.entityContainer =
          moduleRecordMetadataSchema.entityContainer + ownerCompanyMetaDataSchema.entityContainer;
      }

      // To generate owner company contractors metadata
      const companyContractorsMetaDataSchema = this.ownerCompanyService.generateOwnerCompanyContractorsODataMetaData(
        userPermittedModules[0].companyName
      );

      if (companyContractorsMetaDataSchema?.entityType) {
        moduleRecordMetadataSchema.entityType =
          moduleRecordMetadataSchema.entityType + companyContractorsMetaDataSchema.entityType;
        moduleRecordMetadataSchema.entityContainer =
          moduleRecordMetadataSchema.entityContainer + companyContractorsMetaDataSchema.entityContainer;
      }

      // To generate Auditor user's meta data
      const AuditorsODataMetaDataSchema = this.employeeService.generateAuditorODataMetaData(
        userPermittedModules[0].companyName
      );

      if (AuditorsODataMetaDataSchema?.entityType) {
        moduleRecordMetadataSchema.entityType =
          moduleRecordMetadataSchema.entityType + AuditorsODataMetaDataSchema.entityType;
        moduleRecordMetadataSchema.entityContainer =
          moduleRecordMetadataSchema.entityContainer + AuditorsODataMetaDataSchema.entityContainer;
      }

      // To generate Preparer user's meta data
      const PreparersODataMetaDataSchema = this.employeeService.generatePreparerODataMetaData(
        userPermittedModules[0].companyName
      );

      if (PreparersODataMetaDataSchema?.entityType) {
        moduleRecordMetadataSchema.entityType =
          moduleRecordMetadataSchema.entityType + PreparersODataMetaDataSchema.entityType;
        moduleRecordMetadataSchema.entityContainer =
          moduleRecordMetadataSchema.entityContainer + PreparersODataMetaDataSchema.entityContainer;
      }

      // To generate Module Project meta data
      const moduleProjectMetaDataSchema = this.moduleProjectService.generateModuleProjectODataMetadata(
        userPermittedModules[0].companyName
      );

      if (moduleProjectMetaDataSchema?.entityType) {
        moduleRecordMetadataSchema.entityType =
          moduleRecordMetadataSchema.entityType + moduleProjectMetaDataSchema.entityType;
        moduleRecordMetadataSchema.entityContainer =
          moduleRecordMetadataSchema.entityContainer + moduleProjectMetaDataSchema.entityContainer;
      }
    }

    // To fetch lookup table meta data
    const lookupTableMetadata = await this.lookupTableService.generateLookupTableODataMetaData(userPermittedModules);
    if (lookupTableMetadata?.entityType) {
      moduleRecordMetadataSchema.entityType = moduleRecordMetadataSchema.entityType + lookupTableMetadata.entityType;
      moduleRecordMetadataSchema.entityContainer =
        moduleRecordMetadataSchema.entityContainer + lookupTableMetadata.entityContainer;
    }

    // To form a the metadata edm
    const entitySetResult = this.formMetaDataEdm(moduleRecordMetadataSchema);

    return entitySetResult;
  }

  /**
   * Method to get required oData context data format to display table
   * @param userModules
   * @param roles
   * @returns oData context format data
   *
   */
  async generateODataEntitySet(userModules: IUserPermittedModule[], roles: IUserRole[]) {
    const entitySetValues: { name: string; kind: string; url: string }[] = [];

    for (const userModuleInfo of userModules) {
      let urlString = `${userModuleInfo.companyId}-${userModuleInfo.siteId}-${userModuleInfo.moduleId}`;

      // To generate the url for Action module
      if (userModuleInfo.moduleType === ModuleType.ACTION) {
        urlString = `${Constants.ACTION_MODULE_ROUTE}/${urlString}`;
      }

      // User module record entity
      entitySetValues.push({
        name: `${userModuleInfo.companyName}-${userModuleInfo.siteName}-${userModuleInfo.moduleName}`,
        kind: 'EntitySet',
        url: urlString
      });

      // To fetch table plugin entity
      const templateData = await this.repository.fetchModuleTemplateMetaDataFields(userModuleInfo);
      if (templateData && Object.keys(templateData).length > 0 && templateData.tablePluginDetails?.length) {
        entitySetValues.push({
          name: `${userModuleInfo.companyName}-${userModuleInfo.siteName}-${userModuleInfo.moduleName}-${Constants.TABLE_PLUGIN_ENTITY_NAME}`,
          kind: 'EntitySet',
          url: `${Constants.TABLE_PLUGIN_DATA}/${userModuleInfo.companyId}-${userModuleInfo.siteId}-${userModuleInfo.moduleId}`
        });
      }
    }

    // To give access to owners and users data to only GLOBALSITEADMIN
    if (roles?.length && UserUtils.isGlobalSiteAdmin(roles)) {
      const companyName = userModules[0]?.companyName;
      const companyId = userModules[0]?.companyId;

      // User company list entity
      entitySetValues.push({
        name: `${companyName}-${Constants.OWNER_COMPANY_ENTITY_NAME}`,
        kind: 'EntitySet',
        url: `${Constants.OWNER_COMPANY_ROUTE}/${companyId}`
      });

      // Company contractors entity
      entitySetValues.push({
        name: `${companyName}-${Constants.OWNER_COMPANY_CONTRACTOR_ENTITY_NAME}`,
        kind: 'EntitySet',
        url: `${Constants.OWNER_COMPANY_CONTRACTOR_ROUTE}/${companyId}`
      });

      // To  generate user auditors entity set
      entitySetValues.push({
        name: `${companyName}-${Constants.AUDITOR_ENTITY_NAME}`,
        kind: 'EntitySet',
        url: `${Constants.AUDITOR_ROUTE}/${companyId}`
      });

      // To  generate user auditors entity set
      entitySetValues.push({
        name: `${companyName}-${Constants.PREPARER_ENTITY_NAME}`,
        kind: 'EntitySet',
        url: `${Constants.PREPARER_ROUTE}/${companyId}`
      });

      // To  generate user auditors entity set
      entitySetValues.push({
        name: `${companyName}-${Constants.MODULE_PROJECT_ENTITY_NAME}`,
        kind: 'EntitySet',
        url: `${Constants.MODULE_PROJECT_ROUTE}/${companyId}`
      });
    }

    // To fetch lookup table entity type and entity set
    const lookupTableEntitySet = await this.lookupTableService.generateLookupTableEntitySet(userModules);
    if (lookupTableEntitySet?.length) {
      entitySetValues.push(...lookupTableEntitySet);
    }

    return {
      '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata`,
      value: entitySetValues
    };
  }

  /**
   * To get the object containing entityType and entityContainer for Module record and Table plugin
   * @param userColumns
   * @returns entityType and entityContainer
   */
  generateModuleRecordODataMetaData(userColumns: IModuleTemplateODataMetaData[]) {
    let entityType = ``;
    let entityContainer = ``;

    // To concat all the entity type
    userColumns?.forEach((columnInfo) => {
      // To escape entity name special character
      const updateEntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
        `${columnInfo.companyName}-${columnInfo.siteName}-${columnInfo.moduleName}`.toUpperCase()
      );
      let entitySchema = `<EntityType Name="${updateEntityName}" OpenType="true">`;

      const updatedEntitySetName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
        `${columnInfo.companyName}-${columnInfo.siteName}-${columnInfo.moduleName}`
      );

      const containerSchema = `<EntitySet Name="${updatedEntitySetName}" EntityType="userData.${updateEntityName}"/> \n`;

      // To concat all the property
      columnInfo.columns.forEach((col) => {
        const updatedColumnName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(col.columnName);
        entitySchema += `<Property Name="${updatedColumnName}" Type="Edm.String" Nullable="true"/>\n`;
      });

      entitySchema += `</EntityType>\n`;
      entityType += entitySchema;
      entityContainer += containerSchema;

      // Forming the meta data for table plugin
      if (columnInfo?.tablePluginDetails?.length) {
        const tablePluginEntityName = `${columnInfo.companyName}-${columnInfo.siteName}-${columnInfo.moduleName}-${Constants.TABLE_PLUGIN_ENTITY_NAME}`;
        // To escape entity name special character
        const updateTablePluginEntityName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
          tablePluginEntityName.toUpperCase()
        );
        let tablePluginEntitySchema = `<EntityType Name="${updateTablePluginEntityName}" OpenType="true">`;

        // Adding the Record IGZ ID Column to table plugin
        tablePluginEntitySchema += `<Property Name="IGZ ID" Type="Edm.String" Nullable="true"/>\n`;

        const updatedTablePluginEntitySetName =
          EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(tablePluginEntityName);

        columnInfo.tablePluginDetails.forEach((tablePluginInfo, index) => {
          const updatedTablePluginLabel =
            index === 0 ? Constants.TABLE_PLUGIN_LABEL : `${Constants.TABLE_PLUGIN_LABEL}_${index}`;

          tablePluginEntitySchema += `<Property Name="${updatedTablePluginLabel}" Type="Edm.String" Nullable="true"/>\n`;
          // to concat all the property
          tablePluginInfo.tablePluginColumns.forEach((col) => {
            const updatedTablePluginColumnName = EmployeeModuleRecordUtils.escapeEntityNameSpecialCharacter(
              col.columnName
            );
            tablePluginEntitySchema += `<Property Name="${updatedTablePluginColumnName}" Type="Edm.String" Nullable="true"/>\n`;
          });
        });

        const tablePluginContainerSchema = `<EntitySet Name="${updatedTablePluginEntitySetName}" EntityType="userData.${updateTablePluginEntityName}"/> \n`;

        tablePluginEntitySchema += `</EntityType>\n`;
        entityType += tablePluginEntitySchema;
        entityContainer += tablePluginContainerSchema;
      }
    });

    return {
      entityType: entityType,
      entityContainer: entityContainer
    };
  }

  /**
   * Method to generate metaData in xml format
   * @param entitySchema
   * @returns metaData schema
   */
  formMetaDataEdm(entitySchema: IEntitySchema) {
    const metaDataSchema = `<?xml version="1.0" encoding="UTF-8"?>
      <edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
      <edmx:DataServices>
      <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="userData">
      ${entitySchema.entityType}
      <EntityContainer Name="userDataContext">
      ${entitySchema.entityContainer}
      </EntityContainer>
      </Schema>
      </edmx:DataServices>
      </edmx:Edmx>`;

    return metaDataSchema;
  }

  /**
   * Method to fetch the module template meta data fields
   * @param userPermittedModules
   * @returns meta data fields
   */
  async fetchModuleTemplateMetaDataFields(userPermittedModules: IUserPermittedModule[]) {
    const moduleTemplateMetaDataDetails: IModuleTemplateODataMetaData[] = [];

    if (userPermittedModules?.length > 0) {
      for (const userModule of userPermittedModules) {
        const templateData = await this.repository.fetchModuleTemplateMetaDataFields(userModule);
        if (templateData && Object.keys(templateData).length > 0) {
          // assigning the company, site and module details to meta data details
          Object.assign(templateData, userModule);
          moduleTemplateMetaDataDetails.push(templateData);
        }
      }
    }

    return moduleTemplateMetaDataDetails;
  }

  /**
   * Method to fetch module record details
   * @param moduleUrl
   * @param userId
   * @param query
   * @returns module record details
   */
  async getModuleRecordContextDetails(moduleUrl: string, userId: string, query: IPaginationQuery) {
    // To fetch Pagination query
    const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

    const { moduleRecordsData: recordDetails, isNextODataLinkRequired } = await this.fetchModuleRecordDetails(
      moduleUrl,
      parsedSkip,
      updatedTop,
      isPreview
    );

    // To fetch Module record details
    const ODataTableValueContextDetail = await this.generateODataModuleRecordValueContextDetail(
      moduleUrl,
      userId,
      recordDetails,
      updatedSkip,
      isNextODataLinkRequired
    );

    return ODataTableValueContextDetail;
  }

  /**
   * Method to generate oData Value context details
   * @param moduleUrl
   * @param userId
   * @param recordDetails
   * @param skip
   * @param isNextODataLinkRequired
   * @param isActionModule
   * @returns oData context details
   */
  async generateODataModuleRecordValueContextDetail(
    moduleUrl: string,
    userId: string,
    recordDetails: FieldsType[],
    skip: number,
    isNextODataLinkRequired: boolean,
    isActionModule = false
  ) {
    const [company, site, moduleAccessPrivilege] = moduleUrl.split('-');
    const userPermittedModules = await this.repository.fetchUserPermittedModules(userId);
    // Module selected in power bi
    const selectedModule = userPermittedModules.find(
      (module) => module.companyId === company && module.siteId === site && module.moduleId === moduleAccessPrivilege
    );
    // To form entity name of id with the help of company , site and module name
    const entityName = selectedModule
      ? `${selectedModule.companyName}-${selectedModule.siteName}-${selectedModule.moduleName}`
      : '';

    const oDataContext = {
      '@odata.context': `${this.configService.get<string>('BASE_URL')}/modules/$metadata#${entityName}`,
      value: recordDetails
    };
    // To set next odata link based on condition
    if (isNextODataLinkRequired) {
      const actionRoute = isActionModule ? `/${Constants.ACTION_MODULE_ROUTE}` : '';
      oDataContext['@odata.nextLink'] = `${this.configService.get<string>(
        'BASE_URL'
      )}/modules${actionRoute}/${moduleUrl}?$top=${PAGINATION_QUERY.DEFAULT_LIMIT}&&$skip=${skip}`;
    }

    return oDataContext;
  }

  /**
   * Method to fetch module records data
   * @param moduleUrl
   * @param skip
   * @param top
   * @param isPreview
   * @returns module record data
   */
  async fetchModuleRecordDetails(moduleUrl: string, skip: number, top: number, isPreview: boolean) {
    try {
      const moduleRecordsData: FieldsType[] = [];
      let isNextODataLinkRequired = false;

      // To get selected module records details
      if (moduleUrl) {
        const [company, site, moduleAccessPrivilege] = moduleUrl.split('-');
        const employeeModuleData = await this.repository.fetchModuleRecordDetails(
          {
            company,
            site,
            moduleAccessPrivilege,
            timezone: Constants.TIMEZONE
          },
          skip,
          top
        );

        // Enabling next oData link based preview or load
        isNextODataLinkRequired = !isPreview && employeeModuleData?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

        if (employeeModuleData?.length > 0) {
          const moduleRecordDetailFields = await this.fetchModuleRecordData(
            employeeModuleData,
            Constants.TIMEZONE,
            skip
          );
          const moduleTemplateData = await this.repository.fetchModuleTemplateMetaDataFields({
            companyId: company,
            siteId: site,
            moduleId: moduleAccessPrivilege
          });

          if (moduleTemplateData && moduleTemplateData.columns?.length > 0) {
            const { columns } = moduleTemplateData;
            const { moduleRecordTabDetail, elementDetails } = columns.reduce(
              (
                accumulator: {
                  moduleRecordTabDetail: FieldsType;
                  elementDetails: IModuleTemplateColumnDetail[];
                },
                currentValue
              ) => {
                // To escape special characters
                const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(
                  currentValue.columnName
                );
                if (currentValue.columnValue) {
                  accumulator.moduleRecordTabDetail[formattedColumnName] = currentValue.columnValue;
                } else {
                  accumulator.moduleRecordTabDetail[formattedColumnName] = '';
                  accumulator.elementDetails.push(currentValue);
                }
                return accumulator;
              },
              { moduleRecordTabDetail: {}, elementDetails: [] }
            );

            if (elementDetails?.length > 0) {
              moduleRecordDetailFields.forEach((recordDetail) => {
                const moduleRecordTabDetailCopy = { ...moduleRecordTabDetail };
                elementDetails.forEach((elementColumnDetail) => {
                  if (
                    recordDetail.hasOwnProperty(elementColumnDetail.elementNodeId) &&
                    recordDetail[elementColumnDetail.elementNodeId]
                  ) {
                    const formattedColumnName = EmployeeModuleRecordUtils.escapeColumnNameSpecialCharacters(
                      elementColumnDetail.columnName
                    );

                    moduleRecordTabDetailCopy[formattedColumnName] = recordDetail[elementColumnDetail.elementNodeId];
                  }
                });
                moduleRecordsData.push(moduleRecordTabDetailCopy);
              });
            }
          }
        }
      }
      return { moduleRecordsData, isNextODataLinkRequired };
    } catch (error) {
      console.log('####Error: ', error);
      return { moduleRecordsData: [], isNextODataLinkRequired: false };
    }
  }

  /**
   * Method to get employee module record answers
   * @param employeeModuleData
   * @param timezone
   * @param skip
   * @returns module record details fields
   */
  async fetchModuleRecordData(employeeModuleData: IEmployeeModule[], timezone: string, skip: number) {
    try {
      const moduleRecordDetailFields: FieldsType[] = [];
      let recordSlNo = skip + 1;
      if (employeeModuleData?.length) {
        for (const moduleData of employeeModuleData) {
          if (moduleData?.moduleRecordDetails?.length && moduleData?.employeeModuleTemplate) {
            await this.getModuleRecordDetailData(moduleData, moduleRecordDetailFields, timezone, recordSlNo);
            recordSlNo++;
          }
        }
      }
      return moduleRecordDetailFields;
    } catch (error) {
      throw new InternalServerErrorException('Error ', error);
    }
  }

  /**
   * Method to get module records detail
   * @param moduleData
   * @param moduleRecordDetailFields
   * @param timeZone
   * @param recordSlNo
   * @returns module fields details
   */
  async getModuleRecordDetailData(
    moduleData: IEmployeeModule,
    moduleRecordDetailFields: FieldsType[],
    timeZone: string,
    recordSlNo: number
  ) {
    const fields: FieldsType = {
      'iGZ SlNo': recordSlNo.toString()
    };

    const { employeeModuleTemplate } = moduleData;

    // Fetching the workflow trigger
    let workflowId: string;
    if (moduleData.workflow) {
      workflowId = moduleData.workflow;
    } else {
      workflowId = moduleData.completedWorkflows?.find(
        (completedWorkflow) => !completedWorkflow.destinationWorkflow
      )?.workflow;
    }

    const workflowResult = employeeModuleTemplate.moduleTemplate?.workflow?.workflows.find(
      (workflow) => workflow.nodeId === workflowId
    );

    fields[`iGZ ID`] = moduleData.employeeModuleId;
    fields[`iGZ Project Name`] = moduleData.moduleProject ?? '';
    fields[`iGZ Company`] = moduleData.company;
    fields[`iGZ Site`] = moduleData.site;
    fields[`iGZ Created Date`] = EmployeeModuleRecordUtils.formatDate(moduleData.createdAt, timeZone);
    fields[`iGZ Created Time`] = EmployeeModuleRecordUtils.formatTime(moduleData.createdAt, timeZone);
    fields[`iGZ Auditor Name`] = moduleData.createdBy
      ? `${moduleData.createdBy.firstName} ${moduleData.createdBy.lastName}`
      : '';
    fields[`iGZ Auditor Id`] = moduleData.createdBy ? moduleData.createdBy.employeeId : '';
    fields[`iGZ Status`] = moduleData.status?.name ?? '';
    fields[`iGZ Trigger`] = workflowResult?.trigger?.name ?? '';
    fields[`iGZ Updated On`] = EmployeeModuleRecordUtils.formatDate(moduleData.updatedAt, timeZone);
    fields[`iGZ Updated Time`] = EmployeeModuleRecordUtils.formatTime(moduleData.updatedAt, timeZone);
    fields[`iGZ Record Title`] = moduleData.title ?? '';
    fields[`iGZ Action Item Count`] = moduleData.actionItems ? moduleData.actionItems.length?.toString() : '0';
    fields[`iGZ Attachments Count`] = moduleData.scannedImages ? moduleData.scannedImages.length?.toString() : '0';
    fields[`iGZ Scanned Cards Link`] = moduleData.scannedImages?.length
      ? moduleData.scannedImages.reduce((acc, currentValue) => {
          return acc + `${acc ? MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR : ''}${currentValue.url}`;
        }, '')
      : '';

    const { moduleRecordDetails } = moduleData;

    if (employeeModuleTemplate && moduleRecordDetails) {
      const tabs = employeeModuleTemplate?.moduleTemplate?.tabs?.sort((a, b) => a.orderNo - b.orderNo);
      for (const tab of tabs) {
        if (tab.moduleTabType === ModuleTabType.CUSTOM) {
          const moduleRecordField = {
            nodes: tab?.moduleTabContent?.nodes,
            tabId: tab.nodeId,
            timeZone
          };
          await this.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
        } else if (tab.moduleTabType === ModuleTabType.CHECKLIST) {
          if (employeeModuleTemplate.moduleChecklistTemplate) {
            const moduleCheckListTemplateResult = employeeModuleTemplate.moduleChecklistTemplate?.find(
              (moduleCheckListTemplate) => tab.nodeId === moduleCheckListTemplate.tabId
            );
            if (moduleCheckListTemplateResult) {
              const moduleRecordField = {
                nodes: moduleCheckListTemplateResult.moduleChecklist?.checklistContent,
                tabId: tab.nodeId,
                timeZone
              };
              await this.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
            }
          }
        }
      }
      moduleRecordDetailFields.push(fields);
    }
    return;
  }

  /**
   * Method to get spread sheet rows and columns for module record
   * @param moduleData
   * @param fields
   * @param moduleRecordField
   */
  async getModuleRecordExportFields(
    moduleData: IEmployeeModule,
    fields: FieldsType,
    moduleRecordField: ModuleRecordFields
  ) {
    const { nodes, tabId, timeZone } = moduleRecordField;
    if (nodes?.length > 0) {
      for (const node of nodes) {
        if (node.nodeType === ModuleNodeType.ELEMENT) {
          const answerField = await this.getModuleAnswerField(
            moduleData.moduleRecordDetails as IModuleRecordDetail[],
            tabId,
            node.nodeId,
            node.elementType,
            timeZone,
            node.properties?.fieldType
          );
          this.formatAnswerField(fields, node.elementType, node, answerField);

          // To get the note, media and attachment answers
          this.getElementNoteAttachmentAnswerField(
            moduleData.moduleRecordDetails as IModuleRecordDetail[],
            tabId,
            node,
            fields
          );

          if (node.logics?.length) {
            for (const logic of node.logics) {
              const moduleRecordLogicField = {
                nodes: logic.nodes,
                tabId,
                timeZone
              };
              await this.getModuleRecordExportFields(moduleData, fields, moduleRecordLogicField);
            }
          }
        } else if (node.nodeType === ModuleNodeType.CATEGORY) {
          const moduleRecordField = {
            nodes: node.nodes,
            tabId,
            timeZone
          };
          await this.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
        } else if (node.nodeType === ModuleNodeType.COMPONENT) {
          if (!node.properties?.isActionItem) {
            const moduleRecordField = {
              nodes: node.nodes,
              tabId,
              timeZone
            };
            if (node.properties?.isMultipleEntriesEnabled) {
              const nodeIds = EmployeeModuleRecordUtils.getNodeIdsFromTemplate(node.nodes);
              const moduleRecordDetail = moduleData.moduleRecordDetails?.find(
                (moduleRecordDetails) => moduleRecordDetails.tabId === tabId
              );
              const newModuleData = EmployeeModuleRecordUtils.getModuleData(
                nodeIds,
                moduleRecordDetail?.moduleAnswers as IModuleAnswerField[]
              );

              await this.getModuleRecordComponentExportFields(moduleData, newModuleData, fields, moduleRecordField);
            } else {
              await this.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
            }
          } else {
            if (moduleData.actionItems) {
              const moduleRecordActionComponentField = {
                actionItems: moduleData.actionItems,
                tabId,
                nodeId: node.nodeId,
                timeZone
              };
              this.fetchActionComponent(fields, moduleRecordActionComponentField);
            }
          }
        }
      }
    }
  }

  /**
   * Method to get module record answers
   * @param moduleRecordDetails
   * @param tabId
   * @param nodeId
   * @param timeZone user time zone
   */
  async getModuleAnswerField(
    moduleRecordDetails: IModuleRecordDetail[],
    tabId: string,
    nodeId: string,
    elementType: ElementType,
    timeZone = Constants.TIMEZONE,
    nodePropertiesFieldType: string
  ) {
    let answerField: string[] = [];
    if (moduleRecordDetails?.length) {
      const moduleAnswerResult = moduleRecordDetails
        .find((moduleRecordDetail) => moduleRecordDetail.tabId === tabId)
        ?.moduleAnswers?.filter(
          (moduleAnswer) =>
            moduleAnswer.nodeId === nodeId ||
            moduleAnswer.sourceId === nodeId ||
            moduleAnswer.multipleEntryDetail?.sourceNodeId === nodeId
        )
        ?.sort((s1, s2) => (s1.multipleEntryDetail?.orderNo || 0) - (s2.multipleEntryDetail?.orderNo || 0));

      if (moduleAnswerResult?.length) {
        switch (elementType) {
          case ElementType.TEXTFIELD:
          case ElementType.EMAIL:
            answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.stringField);
            break;
          case ElementType.DATETIME:
            if (nodePropertiesFieldType === 'DATE') {
              answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.dateField?.toISOString());
            } else {
              answerField = moduleAnswerResult.map(
                (moduleAnswer) =>
                  `${EmployeeModuleRecordUtils.formatDate(moduleAnswer.dateField, timeZone)}${
                    MultipleEntrySeparator.DATE_TIME_SPLITTER
                  }${EmployeeModuleRecordUtils.formatTime(moduleAnswer.dateField, timeZone)}`
              );
            }
            break;
          case ElementType.NUMBER:
            answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.numberField);
            break;
          case ElementType.LOCATION_TREE:
            for (const moduleAnswer of moduleAnswerResult) {
              if (moduleAnswer.locationTreeField?.area) {
                answerField.push(await this.repository.getAreaNameById(moduleAnswer.locationTreeField?.area as string));
              } else if (moduleAnswer.locationTreeField?.zone) {
                answerField.push(await this.repository.getZoneNameById(moduleAnswer.locationTreeField?.zone as string));
              } else {
                answerField.push(
                  await this.repository.getPlantNameById(moduleAnswer.locationTreeField?.plant as string)
                );
              }
            }
            break;
          case ElementType.DROPDOWN:
          case ElementType.CHECKBOX:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.optionField
                ?.map((option: IElementOption) =>
                  option?.score != null
                    ? `${option?.label}${MultipleEntrySeparator.MODULE_RECORD_DROPDOWN_SCORE_SEPARATOR}${option?.score}`
                    : option?.label
                )
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            );
            break;
          case ElementType.TAGS:
          case ElementType.TILES:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.optionField
                ?.map((option: IElementOption) => option?.label)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            );
            break;
          case ElementType.SIGNATURE:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.signature
                ?.map((mediaData: IMediaData) => {
                  const signatureResult = [mediaData?.url];
                  if (mediaData?.createdDate) {
                    if (mediaData?.createdGPSCoordinate) {
                      signatureResult.push(
                        mediaData.createdDate.toISOString(),
                        `${mediaData.createdGPSCoordinate.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${mediaData.createdGPSCoordinate.longitude}`
                      );
                    } else if (mediaData?.createdLocation) {
                      signatureResult.push(mediaData.createdDate.toISOString(), mediaData.createdLocation);
                    } else {
                      signatureResult.push(mediaData.createdDate.toISOString());
                    }
                  } else if (mediaData?.createdGPSCoordinate) {
                    signatureResult.push(
                      '-',
                      `${mediaData.createdGPSCoordinate.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${mediaData.createdGPSCoordinate.longitude}`
                    );
                  } else if (mediaData?.createdLocation) {
                    signatureResult.push('-', mediaData.createdLocation);
                  }
                  return signatureResult?.join(MultipleEntrySeparator.MODULE_RECORD_SIGNATURE_AUTO_CAPTURE_SEPARATOR);
                })
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            );
            break;
          case ElementType.FILE_UPLOAD:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.fileField
                ?.map((mediaData: IMediaData) => mediaData?.url)
                ?.filter(Boolean)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            );
            break;
          case ElementType.TEXT_WITH_CHECKBOX:
            const multipleCheck = moduleAnswerResult
              .map((moduleAnswer) => moduleAnswer.textWithCheckBoxField)
              ?.filter(Boolean)?.length;
            answerField = moduleAnswerResult
              .map((moduleAnswer) =>
                moduleAnswer.textWithCheckBoxField
                  ? moduleAnswer.textWithCheckBoxField.toString()
                  : multipleCheck
                  ? '-'
                  : ''
              )
              ?.filter(Boolean);
            break;
          case ElementType.GPS_LOCATION:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.gpsLocationField?.reduce((acc, curr) => {
                return acc
                  ? acc +
                      `${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${curr.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${curr.longitude}`
                  : `${curr.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${curr.longitude}`;
              }, '')
            );
            break;
          case ElementType.WEB_LINK:
            answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.webLinkField);
            break;
          case ElementType.CALCULATION:
            answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.calculationField);
            break;
          case ElementType.REFERENCE_RECORDS:
            answerField = moduleAnswerResult.map((moduleAnswer) =>
              moduleAnswer.referenceRecordsField
                ?.map((refRecord) => refRecord?.employeeModuleId)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            );
            break;
          case ElementType.SKETCH:
            answerField = moduleAnswerResult.map((moduleAnswer) => moduleAnswer.sketchField?.url);
            break;
        }
      }
    }
    return answerField;
  }

  /**
   * Method to structure answer field to spread sheet
   * @param fields
   * @param nodeType
   * @param node
   * @param answerField
   */
  formatAnswerField(
    fields: FieldsType,
    nodeType: ElementType,
    node: IElementLogicNode | IModuleTabNode | IChecklistNode,
    answerField: string[]
  ) {
    const label: string = node.nodeId;
    switch (nodeType) {
      case ElementType.TEXTFIELD:
      case ElementType.NUMBER:
      case ElementType.LOCATION_TREE:
      case ElementType.DROPDOWN:
      case ElementType.CHECKBOX:
      case ElementType.TAGS:
      case ElementType.TILES:
      case ElementType.SIGNATURE:
      case ElementType.FILE_UPLOAD:
      case ElementType.GPS_LOCATION:
      case ElementType.TEXT_WITH_CHECKBOX:
      case ElementType.WEB_LINK:
      case ElementType.EMAIL:
      case ElementType.CALCULATION:
      case ElementType.REFERENCE_RECORDS:
      case ElementType.SKETCH:
        fields[label] = answerField?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
        break;
      case ElementType.DATETIME:
        if (node.properties?.fieldType) {
          if (node.properties?.fieldType === 'DATETIME') {
            fields[label] = answerField?.length
              ? answerField.reduce((acc: string, currentValue) => {
                  const dateTimeValue = currentValue.replace(MultipleEntrySeparator.DATE_TIME_SPLITTER, ' ');
                  return acc
                    ? `${acc}${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${dateTimeValue}`
                    : dateTimeValue;
                }, undefined)
              : '';
          } else if (node.properties?.fieldType === 'DATE') {
            fields[label] = answerField?.length
              ? answerField.reduce((acc: string, dateValue) => {
                  return acc
                    ? `${acc}${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${dateValue}`
                    : dateValue;
                }, undefined)
              : '';
          } else if (node.properties?.fieldType === 'TIME') {
            fields[label] = answerField?.length
              ? answerField.reduce((acc: string, currentValue) => {
                  const timeValue = currentValue.split(MultipleEntrySeparator.DATE_TIME_SPLITTER)[1];
                  return acc
                    ? `${acc}${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${timeValue}`
                    : timeValue;
                }, undefined)
              : '';
          }
        }
        break;
    }
  }

  /**
   * Method to get action component
   * @param fields
   * @param moduleRecordActionField
   */
  fetchActionComponent(fields: FieldsType, moduleRecordActionField: ModuleRecordActionComponentField) {
    const { actionItems, tabId, nodeId, timeZone } = moduleRecordActionField;
    if (actionItems?.length) {
      const actionTitle: string[] = [];
      const actionDescription: string[] = [];
      const actionResponsible: string[] = [];
      const actionDelegated: string[] = [];
      const actionDueDate: string[] = [];
      const actionDueTime: string[] = [];
      const actionComment: string[] = [];
      for (const actionItem of actionItems as IActionItem[]) {
        if (actionItem.tabInfo?.tabId === tabId && actionItem.tabInfo?.actionComponentNodeId === nodeId) {
          actionTitle.push(actionItem.title ? (actionItem.title as string) : '-');
          actionDescription.push(actionItem.description ? (actionItem.description as string) : '-');
          actionResponsible.push(
            actionItem.responsible
              ? `${(actionItem.responsible as IEmployee)?.firstName} ${(actionItem.responsible as IEmployee)?.lastName}`
              : '-'
          );
          actionDelegated.push(
            actionItem.personDelegated
              ? `${(actionItem.personDelegated as IEmployee)?.firstName} ${
                  (actionItem.personDelegated as IEmployee)?.lastName
                }`
              : '-'
          );
          actionDueDate.push(
            actionItem.dueDate ? EmployeeModuleRecordUtils.formatDate(actionItem.dueDate, timeZone) : '-'
          );
          actionDueTime.push(
            actionItem.dueDate ? EmployeeModuleRecordUtils.formatTime(actionItem.dueDate, timeZone) : '-'
          );
          actionComment.push(actionItem.comment ? (actionItem.comment as string) : '-');
        }
      }

      const actionItemFieldName = `${nodeId}-actionTitle`;
      fields[actionItemFieldName] = actionTitle?.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);

      if (actionDescription?.filter((element) => element !== '-')?.length) {
        const descriptionItemFieldName = `${nodeId}-description`;
        fields[descriptionItemFieldName] = actionDescription?.join(
          MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
        );
      }

      const responsibleItemFieldName = `${nodeId}-personResponsible`;
      fields[responsibleItemFieldName] = actionResponsible?.join(
        MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
      );

      if (actionDelegated?.filter((element) => element !== '-')?.length) {
        const personDelegatedItemFieldName = `${nodeId}-personDelegated`;
        fields[personDelegatedItemFieldName] = actionDelegated?.join(
          MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
        );
      }

      const dueDateItemFieldName = `${nodeId}-dueDate-date`;
      fields[dueDateItemFieldName] = actionDueDate?.join(
        MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
      );

      const dueDateTimeItemFieldName = `${nodeId}-dueDate-time`;
      fields[dueDateTimeItemFieldName] = actionDueTime?.join(
        MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
      );

      if (actionComment?.filter((element) => element !== '-')?.length) {
        const commentFieldName = `${nodeId}-comment`;
        fields[commentFieldName] = actionComment?.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);
      }
    }
  }

  /**
   * Method to get spread sheet rows and columns of multiple entries component for module record
   * @param moduleData
   * @param newModuleData
   * @param fields
   * @param moduleRecordFields
   */
  async getModuleRecordComponentExportFields(
    moduleData: IEmployeeModule,
    newModuleData: { [key: string]: ModuleAnswerComponentDetail[] },
    fields: FieldsType,
    moduleRecordFields: ModuleRecordFields
  ) {
    const { nodes, tabId, timeZone } = moduleRecordFields;
    let answerField: string[] | undefined;
    if (nodes?.length > 0) {
      for (const node of nodes) {
        if (node.nodeType === ModuleNodeType.ELEMENT) {
          answerField = await this.getMultipleModuleAnswerField(newModuleData, node.nodeId, node.elementType, timeZone);
          this.formatMultipleAnswerField(fields, node.elementType, node, answerField);
          // to get the note, media and attachment answers
          this.getMultipleElementNoteAttachmentAnswerField(newModuleData, node, tabId, fields);

          if (node.logics?.length) {
            for (const logic of node.logics) {
              const moduleRecordLogicField = {
                nodes: logic.nodes,
                tabId,
                timeZone
              };
              await this.getModuleRecordComponentExportFields(
                moduleData,
                newModuleData,
                fields,
                moduleRecordLogicField
              );
            }
          }
        } else if (node.nodeType === ModuleNodeType.CATEGORY) {
          const moduleRecordField = {
            nodes: node.nodes,
            tabId,
            timeZone
          };
          await this.getModuleRecordComponentExportFields(moduleData, newModuleData, fields, moduleRecordField);
        } else if (node.nodeType === ModuleNodeType.COMPONENT) {
          if (node.properties?.isActionItem) {
            if (moduleData.actionItems) {
              const moduleRecordActionComponentField = {
                actionItems: moduleData.actionItems,
                tabId,
                nodeId: node.nodeId,
                timeZone
              };
              this.fetchActionComponent(fields, moduleRecordActionComponentField);
            }
          }
        }
      }
    }
  }

  /**
   * Method to get module answers for multiple entries
   * @param newModuleData
   * @param nodeId
   * @param timeZone
   */
  async getMultipleModuleAnswerField(
    newModuleData: { [key: string]: ModuleAnswerComponentDetail[] },
    nodeId: string,
    elementType: ElementType,
    timeZone = Constants.TIMEZONE
  ) {
    const multiAnswerField: string[] = [];
    let isAnswered = false;
    for (const key in newModuleData) {
      let answerField: string | undefined;
      const moduleResult = newModuleData[key]?.filter(
        (moduleData) =>
          moduleData.moduleAnswer?.nodeId === nodeId ||
          moduleData.moduleAnswer?.multipleEntryDetail?.sourceNodeId === nodeId ||
          moduleData.moduleAnswer?.sourceId === nodeId
      );

      switch (elementType) {
        case ElementType.TEXTFIELD:
        case ElementType.EMAIL:
          answerField = moduleResult
            ?.map((module) => module.moduleAnswer.stringField)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.DATETIME:
          answerField = moduleResult
            ?.map(
              (module) =>
                `${EmployeeModuleRecordUtils.formatDate(module.moduleAnswer.dateField, timeZone)}${
                  MultipleEntrySeparator.DATE_TIME_SPLITTER
                }${EmployeeModuleRecordUtils.formatTime(module.moduleAnswer.dateField, timeZone)}`
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.NUMBER:
          answerField = moduleResult
            ?.map((module) => module.moduleAnswer.numberField)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.LOCATION_TREE:
          const locationTreeAnswer: string[] = [];
          for (const module of moduleResult) {
            if (module?.moduleAnswer?.locationTreeField?.plant) {
              if (module.moduleAnswer.locationTreeField?.area) {
                locationTreeAnswer.push(
                  await this.repository.getAreaNameById(module.moduleAnswer.locationTreeField.area as string)
                );
              } else if (module.moduleAnswer.locationTreeField.zone) {
                locationTreeAnswer.push(
                  await this.repository.getZoneNameById(module.moduleAnswer.locationTreeField?.zone as string)
                );
              } else {
                locationTreeAnswer.push(
                  await this.repository.getPlantNameById(module.moduleAnswer.locationTreeField?.plant as string)
                );
              }
            }
          }
          answerField = locationTreeAnswer?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.DROPDOWN:
        case ElementType.CHECKBOX:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer?.optionField
                ?.map((option: IElementOption) =>
                  option?.score != null
                    ? `${option?.label}${MultipleEntrySeparator.MODULE_RECORD_DROPDOWN_SCORE_SEPARATOR}${option?.score}`
                    : option?.label
                )
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.TAGS:
        case ElementType.TILES:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer?.optionField
                ?.map((option: IElementOption) => option?.label)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.SIGNATURE:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer?.signature
                ?.map((mediaData: IMediaData) => {
                  const signatureResult = [mediaData?.url];
                  if (mediaData?.createdDate) {
                    if (mediaData?.createdGPSCoordinate) {
                      signatureResult.push(
                        mediaData.createdDate.toISOString(),
                        `${mediaData.createdGPSCoordinate.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${mediaData.createdGPSCoordinate.longitude}`
                      );
                    } else if (mediaData?.createdLocation) {
                      signatureResult.push(mediaData.createdDate.toISOString(), mediaData.createdLocation);
                    } else {
                      signatureResult.push(mediaData.createdDate.toISOString());
                    }
                  } else if (mediaData?.createdGPSCoordinate) {
                    signatureResult.push(
                      '-',
                      `${mediaData.createdGPSCoordinate.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${mediaData.createdGPSCoordinate.longitude}`
                    );
                  } else if (mediaData?.createdLocation) {
                    signatureResult.push('-', mediaData.createdLocation);
                  }
                  return signatureResult?.join(MultipleEntrySeparator.MODULE_RECORD_SIGNATURE_AUTO_CAPTURE_SEPARATOR);
                })
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.FILE_UPLOAD:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer?.fileField
                ?.map((mediaData: IMediaData) => mediaData?.url)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.TEXT_WITH_CHECKBOX:
          const multipleCheck = moduleResult
            .map((module) => module.moduleAnswer?.textWithCheckBoxField)
            ?.filter(Boolean).length;
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer?.textWithCheckBoxField
                ? module.moduleAnswer.textWithCheckBoxField.toString()
                : multipleCheck
                ? '-'
                : ''
            )
            ?.filter(Boolean)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.GPS_LOCATION:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer.gpsLocationField
                ?.map(
                  (gpsLocation: IGPSLocationField) =>
                    `(${gpsLocation?.latitude}${MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR}${gpsLocation?.longitude})`
                )
                .join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.WEB_LINK:
          answerField = moduleResult
            ?.map((module) => module.moduleAnswer.webLinkField)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.CALCULATION:
          answerField = moduleResult
            ?.map((module) => module.moduleAnswer.calculationField)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.REFERENCE_RECORDS:
          answerField = moduleResult
            ?.map((module) =>
              module.moduleAnswer.referenceRecordsField
                ?.map((refRecord) => refRecord?.employeeModuleId)
                ?.join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR)
            )
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
        case ElementType.SKETCH:
          answerField = moduleResult
            ?.map((module) => module.moduleAnswer?.sketchField?.url)
            ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
          break;
      }
      if (answerField) {
        isAnswered = true;
        multiAnswerField.push(answerField);
      } else {
        multiAnswerField.push('-');
      }
    }
    return isAnswered ? multiAnswerField : [];
  }

  /**
   * Method to format module answer from multiple entries
   * @param fields
   * @param nodeType
   * @param node
   * @param answerField
   */
  formatMultipleAnswerField(
    fields: FieldsType,
    nodeType: ElementType,
    node: IElementLogicNode | IModuleTabNode | IChecklistNode,
    answerField: string[]
  ) {
    const label: string = node.nodeId;
    switch (nodeType) {
      case ElementType.TEXTFIELD:
      case ElementType.NUMBER:
      case ElementType.LOCATION_TREE:
      case ElementType.DROPDOWN:
      case ElementType.CHECKBOX:
      case ElementType.TAGS:
      case ElementType.TILES:
      case ElementType.SIGNATURE:
      case ElementType.FILE_UPLOAD:
      case ElementType.GPS_LOCATION:
      case ElementType.TEXT_WITH_CHECKBOX:
      case ElementType.WEB_LINK:
      case ElementType.EMAIL:
      case ElementType.CALCULATION:
      case ElementType.REFERENCE_RECORDS:
      case ElementType.SKETCH:
        fields[label] = answerField?.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);
        break;
      case ElementType.DATETIME:
        if (node.properties?.fieldType) {
          const dateTimeField: string[] = [];
          const dateField: string[] = [];
          const timeField: string[] = [];
          answerField?.forEach((dateTime: string) => {
            if (dateTime === '-') {
              dateTimeField.push('-');
              dateField.push('-');
              timeField.push('-');
            } else {
              const dateTimeValue = dateTime
                ?.split(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER)
                ?.map((ele) => ele?.replace(MultipleEntrySeparator.DATE_TIME_SPLITTER, ' '))
                ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
              dateTimeField.push(dateTimeValue);

              const dateValue = dateTime
                ?.split(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER)
                ?.map((ele) => ele?.split(MultipleEntrySeparator.DATE_TIME_SPLITTER)[0])
                ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
              dateField.push(dateValue);

              const timeValue = dateTime
                ?.split(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER)
                ?.map((ele) => ele?.split(MultipleEntrySeparator.DATE_TIME_SPLITTER)[1])
                ?.join(MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER);
              timeField.push(timeValue);
            }
          });
          if (node.properties?.fieldType === 'DATETIME') {
            fields[label] = dateTimeField.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);
          } else if (node.properties?.fieldType === 'DATE') {
            fields[label] = dateField.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);
          } else if (node.properties?.fieldType === 'TIME') {
            fields[label] = timeField.join(MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT);
          }
        }
        break;
    }
  }

  /**
   * Method to format the duplicate Action module fields
   * @param fields
   * @param actionItemFieldName
   * @param serialNo
   * @returns field name
   */
  checkActionItemDuplicateFields(fields: FieldsType, actionItemFieldName: string, serialNo?: number): string {
    if (fields.hasOwnProperty(actionItemFieldName)) {
      serialNo = serialNo ? serialNo + 1 : 1;
      return this.checkActionItemDuplicateFields(fields, `${actionItemFieldName}_${serialNo}`);
    } else {
      return actionItemFieldName;
    }
  }

  /**
   * Method to get the element module record note, media and attachment answer details
   * @param moduleRecordDetails
   * @param tabId
   * @param node
   * @param fields
   * @returns
   */
  getElementNoteAttachmentAnswerField(
    moduleRecordDetails: IModuleRecordDetail[],
    tabId: string,
    node: IElementLogicNode | IModuleTabNode | IChecklistNode,
    fields: FieldsType
  ) {
    if (moduleRecordDetails?.length) {
      if (node?.properties?.isNoteEnabled) {
        let isNoteValuePresent = false;
        let noteAnswer: string | undefined;
        moduleRecordDetails
          .find((moduleRecordDetail) => moduleRecordDetail.tabId === tabId)
          ?.moduleAnswers?.filter(
            (moduleAnswerElement) =>
              moduleAnswerElement.nodeId === node.nodeId ||
              moduleAnswerElement.sourceId === node.nodeId ||
              moduleAnswerElement?.multipleEntryDetail?.sourceNodeId === node.nodeId
          )
          ?.sort((s1, s2) => (s1?.multipleEntryDetail?.orderNo || 0) - (s2?.multipleEntryDetail?.orderNo || 0))
          ?.forEach((currentValue) => {
            let noteValue: string;
            if (currentValue.note) {
              isNoteValuePresent = true;
              noteValue = currentValue.note;
            } else {
              noteValue = '-';
            }
            noteAnswer = noteAnswer
              ? noteAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${noteValue}`
              : noteValue;
          });

        if (isNoteValuePresent) {
          fields[`${node.nodeId}-note`] = noteAnswer;
        }
      }

      if (node?.properties?.isMediaUploadEnabled) {
        let isMediaValuePresent = false;
        let mediaAnswer: string | undefined;
        moduleRecordDetails
          .find((moduleRecordDetail) => moduleRecordDetail.tabId === tabId)
          ?.moduleAnswers?.filter(
            (moduleAnswerElement) =>
              moduleAnswerElement.nodeId === node.nodeId ||
              moduleAnswerElement.sourceId === node.nodeId ||
              moduleAnswerElement?.multipleEntryDetail?.sourceNodeId === node.nodeId
          )
          ?.sort((s1, s2) => (s1?.multipleEntryDetail?.orderNo || 0) - (s2?.multipleEntryDetail?.orderNo || 0))
          ?.forEach((currentValue) => {
            let mediaValue: string;
            if (currentValue.media?.length) {
              isMediaValuePresent = true;
              mediaValue = currentValue.media
                .map((element) => element.url)
                .join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR);
            } else {
              mediaValue = '-';
            }
            mediaAnswer = mediaAnswer
              ? mediaAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${mediaValue}`
              : mediaValue;
          });

        if (isMediaValuePresent) {
          fields[`${node.nodeId}-record-media-uploaded`] = mediaAnswer;
        }
      }

      if (node?.properties?.isAttachmentUploadEnabled) {
        let isAttachmentValuePresent = false;
        let attachmentAnswer: string | undefined;
        moduleRecordDetails
          .find((moduleRecordDetail) => moduleRecordDetail.tabId === tabId)
          ?.moduleAnswers?.filter(
            (moduleAnswerElement) =>
              moduleAnswerElement.nodeId === node.nodeId ||
              moduleAnswerElement.sourceId === node.nodeId ||
              moduleAnswerElement?.multipleEntryDetail?.sourceNodeId === node.nodeId
          )
          ?.sort((s1, s2) => (s1?.multipleEntryDetail?.orderNo || 0) - (s2?.multipleEntryDetail?.orderNo || 0))
          ?.forEach((currentValue) => {
            let attachmentValue: string;
            if (currentValue.attachment?.length) {
              isAttachmentValuePresent = true;
              attachmentValue = currentValue.attachment
                .map((element) => element.url)
                .join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR);
            } else {
              attachmentValue = '-';
            }

            attachmentAnswer = attachmentAnswer
              ? attachmentAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${attachmentValue}`
              : attachmentValue;
          });

        if (isAttachmentValuePresent) {
          fields[`${node.nodeId}-record-attachment-uploaded`] = attachmentAnswer;
        }
      }
    }
    return;
  }

  /**
   * Method to get the component multiple entry  module record note, media and attachment answer details
   * @param newModuleData
   * @param node
   * @param tabId
   * @param fields
   * @returns
   */
  getMultipleElementNoteAttachmentAnswerField(
    newModuleData: { [key: string]: ModuleAnswerComponentDetail[] },
    node: IElementLogicNode | IModuleTabNode | IChecklistNode,
    tabId: string,
    fields: FieldsType
  ) {
    if (newModuleData) {
      if (node?.properties?.isNoteEnabled) {
        const nodeId = node.nodeId;
        const multiAnswerField: string[] = [];
        let isNotePresentInComponent = false;
        Object.values(newModuleData)?.forEach((componentData) => {
          let isNoteValuePresent = false;
          let noteAnswer: string | undefined;

          componentData
            .filter(
              (data) =>
                data.moduleAnswer?.nodeId === nodeId ||
                data.moduleAnswer?.sourceId === nodeId ||
                data.moduleAnswer?.multipleEntryDetail?.sourceNodeId === nodeId
            )
            ?.sort(
              (s1, s2) =>
                (s1?.moduleAnswer?.multipleEntryDetail?.orderNo || 0) -
                (s2?.moduleAnswer?.multipleEntryDetail?.orderNo || 0)
            )
            ?.forEach((currentValue) => {
              let noteValue: string;
              if (currentValue?.moduleAnswer?.note) {
                isNoteValuePresent = true;
                noteValue = currentValue?.moduleAnswer?.note ? currentValue?.moduleAnswer?.note : '-';
              } else {
                noteValue = '-';
              }
              noteAnswer = noteAnswer
                ? noteAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${noteValue}`
                : noteValue;
            });

          if (isNoteValuePresent) {
            isNotePresentInComponent = true;
            multiAnswerField.push(noteAnswer);
          } else {
            multiAnswerField.push('-');
          }
        });

        if (isNotePresentInComponent) {
          fields[`${nodeId}-note`] = multiAnswerField?.join(
            MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
          );
        }
      }

      if (node?.properties?.isMediaUploadEnabled) {
        const nodeId = node.nodeId;
        const multiAnswerField: string[] = [];
        let isMediaPresentInComponent = false;
        Object.values(newModuleData)?.forEach((componentData) => {
          let isMediaValuePresent = false;
          let mediaAnswer: string | undefined;

          componentData
            .filter(
              (data) =>
                data.moduleAnswer?.nodeId === nodeId ||
                data.moduleAnswer?.sourceId === nodeId ||
                data.moduleAnswer?.multipleEntryDetail?.sourceNodeId === nodeId
            )
            ?.sort(
              (s1, s2) =>
                (s1?.moduleAnswer?.multipleEntryDetail?.orderNo || 0) -
                (s2?.moduleAnswer?.multipleEntryDetail?.orderNo || 0)
            )
            ?.forEach((currentValue) => {
              let mediaValue: string;
              if (currentValue?.moduleAnswer?.media?.length) {
                isMediaValuePresent = true;
                mediaValue = currentValue?.moduleAnswer?.media
                  .map((element) => element.url)
                  .join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR);
              } else {
                mediaValue = '-';
              }
              mediaAnswer = mediaAnswer
                ? mediaAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${mediaValue}`
                : mediaValue;
            });

          if (isMediaValuePresent) {
            isMediaPresentInComponent = true;
            multiAnswerField.push(mediaAnswer);
          } else {
            multiAnswerField.push('-');
          }
        });

        if (isMediaPresentInComponent) {
          fields[`${nodeId}-record-media-uploaded`] = multiAnswerField?.join(
            MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
          );
        }
      }

      if (node?.properties?.isAttachmentUploadEnabled) {
        const nodeId = node.nodeId;
        const multiAnswerField: string[] = [];
        let isAttachmentPresentInComponent = false;
        Object.values(newModuleData)?.forEach((componentData) => {
          let isAttachmentValuePresent = false;
          let attachmentAnswer: string | undefined;

          componentData
            .filter(
              (data) =>
                data.moduleAnswer?.nodeId === nodeId ||
                data.moduleAnswer?.sourceId === nodeId ||
                data.moduleAnswer?.multipleEntryDetail?.sourceNodeId === nodeId
            )
            ?.sort(
              (s1, s2) =>
                (s1?.moduleAnswer?.multipleEntryDetail?.orderNo || 0) -
                (s2?.moduleAnswer?.multipleEntryDetail?.orderNo || 0)
            )
            ?.forEach((currentValue) => {
              let attachmentValue: string;
              if (currentValue?.moduleAnswer?.attachment?.length) {
                isAttachmentValuePresent = true;
                attachmentValue = currentValue?.moduleAnswer?.attachment
                  .map((element) => element.url)
                  .join(MultipleEntrySeparator.MODULE_RECORD_ELEMENT_VALUE_SEPARATOR);
              } else {
                attachmentValue = '-';
              }
              attachmentAnswer = attachmentAnswer
                ? attachmentAnswer + `${MultipleEntrySeparator.ELEMENT_MULTIPLE_ENTRY_SPLITTER}${attachmentValue}`
                : attachmentValue;
            });

          if (isAttachmentValuePresent) {
            isAttachmentPresentInComponent = true;
            multiAnswerField.push(attachmentAnswer);
          } else {
            multiAnswerField.push('-');
          }
        });

        if (isAttachmentPresentInComponent) {
          fields[`${nodeId}-record-attachment-uploaded`] = multiAnswerField?.join(
            MultipleEntrySeparator.COMPONENT_MULTIPLE_ENTRY_SPLITTER_EXPORT
          );
        }
      }
    }
    return;
  }
}
