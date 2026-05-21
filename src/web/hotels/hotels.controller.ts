import { Controller, Get, Query } from '@nestjs/common';
import { HotelsWebService } from './hotels.service';

@Controller('web/hotels')
export class HotelsWebController {
  constructor(private readonly hotelsService: HotelsWebService) {}

  @Get()
  findAll(
    @Query('destinationId') destinationId?: string,
    @Query('starRating') starRating?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hotelsService.findAll({
      destinationId: destinationId ? Number(destinationId) : undefined,
      starRating: starRating ? Number(starRating) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
