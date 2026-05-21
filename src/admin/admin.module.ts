import { Module } from '@nestjs/common';
import { DestinationsModule } from './destinations/destinations.module';
import { PackagesModule } from './packages/packages.module';
import { HotelsModule } from './hotels/hotels.module';
import { ItineraryModule } from './itinerary/itinerary.module';
import { ItineraryDetailsModule } from './itinerary-details/itinerary-details.module';
import { GalleryModule } from './gallery/gallery.module';
import { BookingsModule } from './bookings/bookings.module';

@Module({
  imports: [
    DestinationsModule,
    PackagesModule,
    HotelsModule,
    ItineraryModule,
    ItineraryDetailsModule,
    GalleryModule,
    BookingsModule,
  ],
})
export class AdminModule {}
