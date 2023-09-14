import { IUserRole, Roles } from '../../../common/interfaces/user/auth.interface';
import { IEmployee } from '../../interfaces/user/employee.interface';

export class UserUtils {
  /**
   * Method to check if logged in user is global site admin
   * @param roles
   * @returns
   */

  static isGlobalSiteAdmin(roles: IUserRole[]) {
    const isGlobalSiteAdmin = roles?.find((role) => role.key === Roles.GLOBALSITEADMIN);
    return isGlobalSiteAdmin;
  }

  /**
   * To check if employee is manager
   * @param user
   * @returns
   */

  public static isManager(user: IEmployee) {
    return this.hasRole(user, Roles.MANAGEMENT);
  }

  /**
   * To check if user has specific roles ?
   * @param user
   * @param expectedRole
   * @returns
   */

  public static hasRole(user: IEmployee, expectedRole: Roles) {
    if (user?.roles?.length) {
      const userRoles = user.roles as [IUserRole];
      const isManager = userRoles.find((role) => role.key === expectedRole);
      return isManager ? true : false;
    }
    return false;
  }
}
