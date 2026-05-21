import { Module } from '@nestjs/common';
import { DestinationsModule } from './destinations/destinations.module';
import { PackagesModule } from './packages/packages.module';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { HotelsWebModule } from './hotels/hotels.module';

@Module({
  imports: [DestinationsModule, PackagesModule, AuthModule, BookingModule, HotelsWebModule],
})
export class WebModule {}
