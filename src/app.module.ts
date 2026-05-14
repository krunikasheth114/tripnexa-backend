import { Module } from '@nestjs/common';
import { DestinationsModule } from './destinations/destinations.module';
import { HotelsModule } from './hotels/hotels.module';
import { ItineraryDetailsModule } from './itinerary-details/itinerary-details.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { GalleryModule } from './gallery/gallery.module';
import { PackagesModule } from './packages/packages.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    DestinationsModule,
    GalleryModule,
    PackagesModule,
    ItineraryModule,
    HotelsModule,
    ItineraryDetailsModule,
  ],
})
export class AppModule {}
