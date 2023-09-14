import * as moment_tz from 'moment-timezone';

import { Constants } from '../../../config/constants';
import {
  IChecklistNode,
  IElementLogicNode,
  IModuleAnswerField,
  IModuleTabNode,
  ModuleAnswerComponentDetail,
  ModuleNodeType
} from '../../interfaces/module/module.interface';

export class EmployeeModuleRecordUtils {
  /**
   * To format the date without the time in ( Month day, year ) format
   */
  static formatDate(dateTime: any, timeZone = Constants.TIMEZONE): string {
    return moment_tz.tz(dateTime, timeZone).format('YYYY-MM-DD');
  }

  /**
   * To format the date and time in ( Month day, year HH:mm) format
   */
  static formatTime(dateTime: any, timeZone = Constants.TIMEZONE): string {
    return moment_tz.tz(dateTime, timeZone).format('HH:mm:ss');
  }

  /**
   * Method to create group from array of objects, using one of the key in  object
   * @param elements array of elements to group
   * @param groupKey key in element object for grouping
   */
  static groupBy(elements: [], groupKey: string) {
    return elements
      ? elements.reduce((group: any, ele: any) => {
          (group[ele[groupKey]] = group[ele[groupKey]] || []).push(ele);
          return group;
        }, {})
      : {};
  }

  /**
   * Method to format module answer from node Id
   * @param nodeIds
   * @param moduleAnswers
   */
  static getModuleData(nodeIds: string[], moduleAnswers: IModuleAnswerField[]) {
    const newModuleData: ModuleAnswerComponentDetail[] = [];
    const firstEntryModuleAnswers = moduleAnswers?.filter((moduleAnswer) => !moduleAnswer.multipleEntryDetail);
    if (firstEntryModuleAnswers?.length) {
      for (const nodeId of nodeIds) {
        for (const firstEntryModuleAnswer of firstEntryModuleAnswers) {
          if (nodeId === firstEntryModuleAnswer.nodeId || nodeId === firstEntryModuleAnswer.sourceId) {
            const moduleAnswerResult = moduleAnswers
              ?.filter(
                (answer) =>
                  firstEntryModuleAnswer.nodeId === answer.nodeId ||
                  firstEntryModuleAnswer.nodeId === answer.multipleEntryDetail?.sourceNodeId
              )
              ?.sort((s1, s2) => (s1?.multipleEntryDetail?.orderNo || 0) - (s2?.multipleEntryDetail?.orderNo || 0))
              ?.map((moduleAnswer) => ({
                orderNo: moduleAnswer?.componentDetail ? moduleAnswer?.componentDetail.orderNo : 0,
                moduleAnswer
              }));
            newModuleData.push(...moduleAnswerResult);
          }
        }
      }
      newModuleData?.sort((a, b) => a.orderNo - b.orderNo);
      const formattedModuleData: { [key: string]: ModuleAnswerComponentDetail[] } = this.groupBy(
        newModuleData as any,
        'orderNo'
      );

      return formattedModuleData;
    } else {
      return {};
    }
  }

  /**
   * Method to nodeIds from module template
   * @param nodes
   */
  static getNodeIdsFromTemplate(nodes: IElementLogicNode[] | IModuleTabNode[] | IChecklistNode[]) {
    const nodeIds: string[] = [];
    if (nodes?.length > 0) {
      for (const node of nodes) {
        if (node.nodeType === ModuleNodeType.TEXTLABEL || node.nodeType === ModuleNodeType.ELEMENT) {
          nodeIds.push(node.nodeId);
          if (node.logics?.length) {
            for (const logic of node.logics) {
              nodeIds.push(...this.getNodeIdsFromTemplate(logic.nodes));
            }
          }
        } else if (node.nodeType === ModuleNodeType.CATEGORY || node.nodeType === ModuleNodeType.COMPONENT) {
          nodeIds.push(...this.getNodeIdsFromTemplate(node.nodes));
        }
      }
    }
    return nodeIds;
  }

  /**
   * Method to escape entity name special characters
   * @param name
   * @returns updated entity name
   */
  static escapeEntityNameSpecialCharacter(name: string) {
    return name
      ?.replace(/&/g, '&amp;')
      ?.replace(/</g, '&lt;')
      ?.replace(/>/g, '&gt;')
      ?.replace(/"/g, '&quot;')
      ?.replace(/'/g, '&apos;');
  }

  /**
   * Method to escape column name special characters
   * @param column
   * @returns updated column name
   */
  static escapeColumnNameSpecialCharacters(column: string) {
    return column?.replace(/\./g, `_x002E_`)?.replace(/\#/g, `_x0023_`)?.replace(/\@/g, `_x0040_`);
  }
}
