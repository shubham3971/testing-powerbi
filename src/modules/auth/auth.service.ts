import { Injectable } from '@nestjs/common';
import * as bCrypt from 'bcrypt';

import { AuthRepository } from '../../repository/auth.repository';

@Injectable()
export class AuthService {
  constructor(private repository: AuthRepository) {}
  /**
   * Method to validate logged in user
   * @param userName
   * @param password
   * @returns user data
   */
  async validateUser(userName: string, password: string) {
    const user = await this.repository.fetchUserDetail(userName);
    if (user) {
      return await this.validatePassword(user, password);
    } else {
      return false;
    }
  }

  /**
   * Method to compare user password
   * @param user
   * @param password
   * @returns user data
   */
  async validatePassword(user: any, password: string): Promise<any> {
    return new Promise(async (resolve) => {
      if (user) {
        bCrypt.compare(password, user.password.toString(), (bCryptError: Error, isSame: boolean) => {
          if (isSame) {
            return resolve(user);
          } else {
            return resolve(false);
          }
        });
      } else {
        return resolve(false);
      }
    });
  }
}
