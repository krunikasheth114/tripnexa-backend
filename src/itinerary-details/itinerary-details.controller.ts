import { Body, Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common';
import { AddHotelDto } from './dto/add-hotel.dto';
import { ItineraryDetailsService } from './itinerary-details.service';

@Controller('itinerary-details')
export class ItineraryDetailsController {
  constructor(private readonly itineraryDetailsService: ItineraryDetailsService) {}

  @Post('hotels')
  addHotel(@Body() dto: AddHotelDto) {
    return this.itineraryDetailsService.addHotel(dto);
  }

  @Delete('hotels/:id')
  removeHotel(@Param('id', ParseIntPipe) id: number) {
    return this.itineraryDetailsService.removeHotel(id);
  }
}
