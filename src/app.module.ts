import { Module } from '@nestjs/common';
import { DestinationsModule } from './destinations/destinations.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GalleryModule } from './gallery/gallery.module';

@Module({
  imports: [PrismaModule, UsersModule, DestinationsModule, GalleryModule],
})
export class AppModule {}
