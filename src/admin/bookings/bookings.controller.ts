import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  /** GET /bookings?page=1&limit=20&status=CONFIRMED&search=TN-xxx */
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAll(
      Number(page),
      Number(limit),
      status,
      search,
    );
  }

  /** GET /bookings/stats */
  @Get('stats')
  getStats() {
    return this.bookingsService.getStats();
  }

  /** GET /bookings/:id */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }
}
