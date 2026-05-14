import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { WebModule } from './web/web.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AdminModule,
    WebModule,
  ],
})
export class AppModule {}
