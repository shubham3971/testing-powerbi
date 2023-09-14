import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';

import { AuthService } from './auth.service';

@Injectable()
export class BasicStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      passReqToCallback: true
    });
  }

  /**
   * Method to validate user name and password
   * @param request
   * @param username
   * @param password
   *
   */
  async validate(request: any, username: string, password: string): Promise<any> {
    const logger = new Logger();

    const user = await this.authService.validateUser(username, password);
    if (!user) {
      logger.error(new UnauthorizedException());
      throw new UnauthorizedException();
    }
    return user;
  }
}
