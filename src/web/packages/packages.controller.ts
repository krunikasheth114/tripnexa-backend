import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PackagesService } from './packages.service';

@Controller('web/packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findAll(
    @Query('destinationId') destinationId?: string,
    @Query('minDays') minDays?: string,
    @Query('maxDays') maxDays?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.packagesService.findAll({
      destinationId: destinationId ? Number(destinationId) : undefined,
      minDays: minDays ? Number(minDays) : undefined,
      maxDays: maxDays ? Number(maxDays) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('featured')
  findFeatured() {
    return this.packagesService.findFeatured();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.packagesService.findById(id);
  }
}
