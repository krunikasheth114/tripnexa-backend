import { Module } from '@nestjs/common';
import { ItineraryDetailsController } from './itinerary-details.controller';
import { ItineraryDetailsService } from './itinerary-details.service';

@Module({
  controllers: [ItineraryDetailsController],
  providers: [ItineraryDetailsService],
})
export class ItineraryDetailsModule {}
