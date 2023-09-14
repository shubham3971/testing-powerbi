import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthRepository } from '../../repository/auth.repository';
import { AuthService } from './auth.service';
import { BasicStrategy } from './auth-basic.strategy';

@Module({
  imports: [PassportModule, ConfigModule],
  providers: [BasicStrategy, AuthService, AuthRepository]
})
export class AuthModule {}
