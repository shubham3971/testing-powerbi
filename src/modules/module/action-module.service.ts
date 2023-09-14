import { Injectable, InternalServerErrorException } from '@nestjs/common';

import {
  ActionItemSourceType,
  ActionItemStatus,
  IActionItemRecord
} from '../../common/interfaces/action-module/action-module.interface';
import {
  FieldsType,
  IEmployee,
  IEmployeeModule,
  IModuleRecordDetail,
  IModuleTemplateColumnDetail,
  IPaginationQuery,
  ModuleTabType
} from '../../common/interfaces/module/module.interface';
import { GeneralUtils } from '../../common/utils/general/general.utils';
import { EmployeeModuleRecordUtils } from '../../common/utils/module/moduleRecordGeneral.utils';
import { PAGINATION_QUERY } from '../../config/constants';
import { ActionItemRepository } from '../../repository/action-module.repository';
import { ModuleRepository } from '../../repository/module.repository';
import { ModuleService } from './module.service';

@Injectable()
export class ActionItemService {
  constructor(
    private moduleService: ModuleService,
    private moduleRepository: ModuleRepository,
    private actionItemRepository: ActionItemRepository
  ) {}

  /**
   * Method to fetch module record details
   * @param moduleUrl
   * @param userId
   * @param query
   * @returns module record details
   */
  async getActionModuleContextDetails(moduleUrl: string, userId: string, query: IPaginationQuery) {
    // To fetch Pagination query
    const { parsedSkip, updatedTop, isPreview, updatedSkip } = GeneralUtils.getPaginationQuery(query);

    const { moduleRecordsData: recordDetails, isNextODataLinkRequired } = await this.fetchActionItemRecordDetails(
      moduleUrl,
      parsedSkip,
      updatedTop,
      isPreview
    );

    const ODataTableValueContextDetail = await this.moduleService.generateODataModuleRecordValueContextDetail(
      moduleUrl,
      userId,
      recordDetails,
      updatedSkip,
      isNextODataLinkRequired,
      true
    );

    return ODataTableValueContextDetail;
  }

  /**
   * Method to fetch the action module record data
   * @param moduleUrl
   * @param skip
   * @param top
   * @param isPreview
   * @returns
   */
  async fetchActionItemRecordDetails(moduleUrl: string, skip: number, top: number, isPreview: boolean) {
    try {
      const moduleRecordsData: FieldsType[] = [];
      let isNextODataLinkRequired = false;

      //to get selected module records details
      if (moduleUrl) {
        const [company, site, moduleAccessPrivilege] = moduleUrl.split('-');
        const actionItemData = await this.actionItemRepository.fetchActionItemRecordDetails(
          {
            company,
            site,
            moduleAccessPrivilege,
            timezone: 'UTC'
          },
          skip,
          top
        );

        //enabling next oData link based preview or load
        isNextODataLinkRequired = !isPreview && actionItemData?.length === PAGINATION_QUERY.DEFAULT_LIMIT;

        if (actionItemData?.length > 0) {
          const moduleRecordDetailFields = await this.fetchActionModuleFormattedRecordData(actionItemData, 'UTC', skip);
          const moduleTemplateData = await this.moduleRepository.fetchModuleTemplateMetaDataFields({
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
                // to escape special characters
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
   *Method to format the action module records data to oData supported data
   * @param actionItemData
   * @param timezone
   * @param skip
   * @returns
   */
  async fetchActionModuleFormattedRecordData(actionItemData: IActionItemRecord[], timezone: string, skip: number) {
    try {
      const moduleRecordDetailFields: FieldsType[] = [];
      let recordSlNo = skip + 1;
      if (actionItemData?.length) {
        for (const moduleData of actionItemData) {
          if (moduleData?.actionItemTemplate) {
            await this.getActionModuleRecordDetailData(moduleData, moduleRecordDetailFields, timezone, recordSlNo);
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
   * Method to format the individual action module data
   * @param actionModuleData
   * @param moduleRecordDetailFields
   * @param timeZone
   * @param recordSlNo
   * @returns
   */
  async getActionModuleRecordDetailData(
    actionModuleData: IActionItemRecord,
    moduleRecordDetailFields: FieldsType[],
    timeZone: string,
    recordSlNo: number
  ) {
    const fields: FieldsType = {
      'iGZ SlNo': recordSlNo.toString()
    };

    const { actionItemTemplate: actionModuleTemplate } = actionModuleData;

    // fetching the workflow trigger
    let workflowId: string;
    if (actionModuleData.workflow) {
      workflowId = actionModuleData.workflow;
    } else {
      workflowId = actionModuleData.completedWorkflows?.find(
        (completedWorkflow) => !completedWorkflow.destinationWorkflow
      )?.workflow;
    }

    const workflowResult = actionModuleTemplate.moduleTemplate?.workflow?.workflows.find(
      (workflow) => workflow.nodeId === workflowId
    );

    fields[`iGZ ID`] = actionModuleData.actionItemId;
    fields[`iGZ Project Name`] = '';
    fields[`iGZ Company`] = actionModuleData?.company?.name ?? '';
    fields[`iGZ Site`] = actionModuleData?.site?.name ?? '';
    fields[`iGZ Created Date`] = EmployeeModuleRecordUtils.formatDate(actionModuleData.createdAt, timeZone);
    fields[`iGZ Created Time`] = EmployeeModuleRecordUtils.formatTime(actionModuleData.createdAt, timeZone);
    fields[`iGZ Auditor Name`] = actionModuleData.createdBy
      ? `${actionModuleData.createdBy.firstName} ${actionModuleData.createdBy.lastName}`
      : '';
    fields[`iGZ Auditor Id`] = actionModuleData.createdBy ? actionModuleData.createdBy.employeeId : '';
    fields[`iGZ Trigger`] = workflowResult?.trigger?.name ?? '';
    fields[`iGZ Updated On`] = EmployeeModuleRecordUtils.formatDate(actionModuleData.updatedAt, timeZone);
    fields[`iGZ Updated Time`] = EmployeeModuleRecordUtils.formatTime(actionModuleData.updatedAt, timeZone);
    fields[`iGZ Record Title`] = actionModuleData.title ?? '';
    fields[`iGZ Action Item Count`] = '0';
    fields[`iGZ Attachments Count`] = '0';
    fields[`iGZ Scanned Cards Link`] = '';
    fields[`iGZ Source Record ID`] = actionModuleData?.employeeModuleRecord?.employeeModuleId ?? '';
    fields[`iGZ Source Module`] =
      actionModuleData?.sourceType === ActionItemSourceType.STANDALONE
        ? 'Standalone'
        : actionModuleData?.moduleAccessPrivilege?.name ?? '';

    // adding status
    let status = 'CLOSED';

    if (actionModuleData.status === ActionItemStatus.OPEN) {
      if (new Date().getTime() > actionModuleData.dueDate?.getTime()) {
        status = 'OPEN';
      } else {
        status = 'IN PROGRESS';
      }
    }

    fields[`iGZ Status`] = status;

    // adding the action item summary data
    const actionItemNodeId = 'actionModuleField';
    fields[`${actionItemNodeId}-actionTitle`] = actionModuleData?.title ?? '';
    fields[`${actionItemNodeId}-description`] = actionModuleData?.description ?? '';
    fields[`${actionItemNodeId}-personResponsible`] = actionModuleData.responsible
      ? `${(actionModuleData.responsible as IEmployee)?.firstName} ${
          (actionModuleData.responsible as IEmployee)?.lastName
        }`
      : '';
    fields[`${actionItemNodeId}-personDelegated`] = actionModuleData.personDelegated
      ? `${(actionModuleData.personDelegated as IEmployee)?.firstName} ${
          (actionModuleData.personDelegated as IEmployee)?.lastName
        }`
      : '';
    fields[`${actionItemNodeId}-dueDate`] = actionModuleData.dueDate ? actionModuleData.dueDate?.toISOString() : '';
    fields[`${actionItemNodeId}-comment`] = actionModuleData?.comment ?? '';

    const { actionItemRecordDetails } = actionModuleData;

    if (actionItemRecordDetails) {
      try {
        // creating the action item data
        const moduleData = {
          moduleRecordDetails: actionItemRecordDetails as IModuleRecordDetail[]
        } as IEmployeeModule;

        const tabs = actionModuleTemplate?.moduleTemplate?.tabs?.sort((a, b) => a.orderNo - b.orderNo);
        for (const tab of tabs) {
          if (tab.moduleTabType === ModuleTabType.CUSTOM) {
            const moduleRecordField = {
              nodes: tab?.moduleTabContent?.nodes,
              tabId: tab.nodeId,
              timeZone
            };
            await this.moduleService.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
          } else if (tab.moduleTabType === ModuleTabType.CHECKLIST) {
            if (actionModuleTemplate.moduleChecklistTemplate) {
              const moduleCheckListTemplateResult = actionModuleTemplate.moduleChecklistTemplate?.find(
                (moduleCheckListTemplate) => tab.nodeId === moduleCheckListTemplate.tabId
              );
              if (moduleCheckListTemplateResult) {
                const moduleRecordField = {
                  nodes: moduleCheckListTemplateResult.moduleChecklist?.checklistContent,
                  tabId: tab.nodeId,
                  timeZone
                };
                await this.moduleService.getModuleRecordExportFields(moduleData, fields, moduleRecordField);
              }
            }
          }
        }
        moduleRecordDetailFields.push(fields);
      } catch (error) {
        moduleRecordDetailFields.push(fields);
      }
    } else {
      moduleRecordDetailFields.push(fields);
    }
    return;
  }
}
