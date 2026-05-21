import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../../prisma/prisma.module';

// ⚠️  Move this to an env var in production: JWT_SECRET=...
export const JWT_SECRET = process.env.JWT_SECRET ?? 'TripNexa_JWT_S3cr3t_2025!Gujarat@Nexa';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
