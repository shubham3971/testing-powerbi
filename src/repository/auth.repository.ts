import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { TABLE_NAMES } from '../config/constants';

@Injectable()
export class AuthRepository {
  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Method to fetch user Details from the Database
   * @param userName
   * @returns user details
   */
  async fetchUserDetail(userName: string): Promise<any> {
    return new Promise(async (resolve) => {
      const user = await this.connection.db.collection(TABLE_NAMES.EMPLOYEES).findOne({ username: userName });
      return resolve(user);
    });
  }
}
