import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { BulkCreateDestinationDto } from './dto/bulk-create-destination.dto';
import { BulkDeleteDestinationDto } from './dto/bulk-delete-destination.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { DestinationsService } from './destinations.service';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @Post()
  create(@Body() createDestinationDto: CreateDestinationDto) {
    return this.destinationsService.create(createDestinationDto);
  }

  @Post('bulk')
  bulkCreate(@Body() bulkCreateDto: BulkCreateDestinationDto) {
    return this.destinationsService.bulkCreate(bulkCreateDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit !== undefined ? Number(limit) : 10;
    const parsedPage  = page  !== undefined ? Number(page)  : 1;
    return this.destinationsService.findAll(parsedPage, parsedLimit);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDestinationDto: UpdateDestinationDto,
  ) {
    return this.destinationsService.update(id, updateDestinationDto);
  }

  @Delete('bulk')
  bulkDelete(@Body() dto: BulkDeleteDestinationDto) {
    return this.destinationsService.bulkDelete(dto.ids);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.remove(id);
  }
}
