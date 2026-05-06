import { Module } from '@nestjs/common';
import { DestinationsModule } from './destinations/destinations.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { GalleryModule } from './gallery/gallery.module';
import { PackagesModule } from './packages/packages.module';
import { ItineraryModule } from './itinerary/itinerary.module';

@Module({
  imports: [PrismaModule, UsersModule, DestinationsModule, GalleryModule, PackagesModule, ItineraryModule],
})
export class AppModule {}
