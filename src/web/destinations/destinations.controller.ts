import { Controller, Get, Query } from '@nestjs/common';
import { DestinationsService } from './destinations.service';

@Controller('web/destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  /** Simple flat list for nav dropdowns */
  @Get()
  findAll() {
    return this.destinationsService.findAll();
  }

  /** Paginated list with optional type/search filters */
  @Get('list')
  findAllPaginated(
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.destinationsService.findAllPaginated({
      type: type || undefined,
      search: search || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
