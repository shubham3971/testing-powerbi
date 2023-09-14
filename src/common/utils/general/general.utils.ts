import { IPaginationQuery } from '../../../common/interfaces/module/module.interface';
import { PAGINATION_QUERY } from '../../../config/constants';

export class GeneralUtils {
  /**
   * Method to form the pagination query
   * @param query
   * @returns
   */
  static getPaginationQuery(query: IPaginationQuery) {
    const skip = query?.$skip;
    const top = query?.$top;
    const parsedSkip = skip ? parseInt(skip) : 0;
    const parsedTop = top ? parseInt(top) : 0;

    // To get top value based on preview or load
    const updatedTop =
      parsedTop === PAGINATION_QUERY.POWER_BI_PREVIEW ? PAGINATION_QUERY.PREVIEW_LIMIT : PAGINATION_QUERY.DEFAULT_LIMIT;

    // Flag to set true if it is in preview mode
    const isPreview = parsedTop === PAGINATION_QUERY.POWER_BI_PREVIEW;

    // Pagination skip value
    const updatedSkip = skip ? parseInt(skip) + PAGINATION_QUERY.DEFAULT_LIMIT : PAGINATION_QUERY.DEFAULT_LIMIT;
    return {
      parsedSkip,
      updatedTop,
      isPreview,
      updatedSkip
    };
  }
}
